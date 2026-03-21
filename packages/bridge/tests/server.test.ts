import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { requestJson } from "../src/http-client";
import { createBridgeServer, type BridgeServerHandle } from "../src/server";
import type {
  BridgeResponseMessage,
  BridgeRuntimeStateSlice,
  BridgeSessionSnapshot,
  BridgeWireMessage,
} from "../src/protocol";
import {
  createBridgeEvent,
  serializeForJson,
  toBridgeClassifiedError,
} from "../src/protocol";

const silentLogger = {
  log: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

function createSnapshot(
  overrides: Partial<BridgeSessionSnapshot> = {},
): BridgeSessionSnapshot {
  const now = Date.now();
  return {
    sessionId: "excel:test-session",
    instanceId: "instance-1",
    app: "excel",
    appName: "Excel",
    appVersion: "1.0.0",
    metadataTag: "doc_context",
    documentId: "doc-123",
    documentMetadata: { sheetCount: 3 },
    tools: [{ name: "echo" }, { name: "eval_officejs" }],
    host: {
      host: "excel",
      platform: "desktop",
      href: "https://localhost/taskpane.html",
      title: "Office Agents",
    },
    connectedAt: now,
    updatedAt: now,
    ...overrides,
  };
}

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to allocate a free port"));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

function createTempTlsMaterial() {
  const dir = mkdtempSync(path.join(tmpdir(), "office-bridge-test-"));
  const keyPath = path.join(dir, "localhost.key");
  const certPath = path.join(dir, "localhost.crt");

  execFileSync("openssl", [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-keyout",
    keyPath,
    "-out",
    certPath,
    "-nodes",
    "-subj",
    "/CN=localhost",
    "-days",
    "1",
  ]);

  return { dir, keyPath, certPath };
}

async function connectClient(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url, {
      rejectUnauthorized: false,
    });
    socket.once("open", () => resolve(socket));
    socket.once("error", reject);
  });
}

async function waitForParsedMessage(
  socket: WebSocket,
): Promise<BridgeWireMessage> {
  return new Promise((resolve, reject) => {
    const onMessage = (raw: Buffer) => {
      cleanup();
      resolve(JSON.parse(raw.toString("utf8")) as BridgeWireMessage);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      socket.off("message", onMessage);
      socket.off("error", onError);
    };
    socket.on("message", onMessage);
    socket.on("error", onError);
  });
}

describe("bridge server", () => {
  let tlsDir = "";
  let server: BridgeServerHandle | null = null;
  let socket: WebSocket | null = null;

  beforeEach(() => {
    tlsDir = "";
  });

  afterEach(async () => {
    if (socket) {
      socket.terminate();
      socket = null;
    }
    if (server) {
      await server.close();
      server = null;
    }
    if (tlsDir) {
      rmSync(tlsDir, { recursive: true, force: true });
      tlsDir = "";
    }
  });

  it("registers a session, records bounded event history, and exposes session data over HTTPS", async () => {
    const tls = createTempTlsMaterial();
    tlsDir = tls.dir;
    const port = await getFreePort();
    server = await createBridgeServer({
      host: "127.0.0.1",
      port,
      certPath: tls.certPath,
      keyPath: tls.keyPath,
      eventLimit: 3,
      logger: silentLogger,
    });

    socket = await connectClient(server.wsUrl);
    socket.send(
      JSON.stringify({
        type: "hello",
        role: "office-addin",
        protocolVersion: 1,
        snapshot: createSnapshot(),
      }),
    );

    await waitForParsedMessage(socket);

    socket.send(
      JSON.stringify({ type: "event", event: "selection_changed", ts: 1 }),
    );
    socket.send(
      JSON.stringify({ type: "event", event: "tool_executed", ts: 2 }),
    );
    socket.send(
      JSON.stringify({
        type: "event",
        event: "session_updated",
        ts: 3,
        payload: createSnapshot({
          documentMetadata: { sheetCount: 4, activeSheet: "Summary" },
          updatedAt: Date.now() + 1,
        }),
      }),
    );

    const health = (await requestJson("GET", "/health", undefined, {
      baseUrl: server.httpUrl,
    })) as { ok: boolean; sessions: number };
    const sessionsResponse = (await requestJson("GET", "/sessions", undefined, {
      baseUrl: server.httpUrl,
    })) as {
      ok: boolean;
      sessions: Array<{ snapshot: BridgeSessionSnapshot }>;
    };
    const events = server.getEvents("excel:test-session", 10);

    expect(health.ok).toBe(true);
    expect(health.sessions).toBe(1);
    expect(sessionsResponse.sessions).toHaveLength(1);
    expect(sessionsResponse.sessions[0].snapshot.documentMetadata).toEqual({
      sheetCount: 4,
      activeSheet: "Summary",
    });
    expect(events.map((event) => event.event)).toEqual([
      "selection_changed",
      "tool_executed",
      "session_updated",
    ]);
  });

  it("forwards tool invocations over WebSocket and returns the response to the HTTPS caller", async () => {
    const tls = createTempTlsMaterial();
    tlsDir = tls.dir;
    const port = await getFreePort();
    server = await createBridgeServer({
      host: "127.0.0.1",
      port,
      certPath: tls.certPath,
      keyPath: tls.keyPath,
      logger: silentLogger,
    });

    socket = await connectClient(server.wsUrl);
    socket.send(
      JSON.stringify({
        type: "hello",
        role: "office-addin",
        protocolVersion: 1,
        snapshot: createSnapshot(),
      }),
    );
    await waitForParsedMessage(socket);

    const invokePromise = waitForParsedMessage(socket).then((message) => {
      if (message.type !== "invoke") {
        throw new Error(`Expected invoke message, got ${message.type}`);
      }

      expect(message.method).toBe("execute_tool");
      expect(message.params).toEqual({
        toolName: "echo",
        args: { value: 42, format: "json" },
      });

      const response: BridgeResponseMessage = {
        type: "response",
        requestId: message.requestId,
        ok: true,
        result: {
          toolCallId: "tool_123",
          toolName: "echo",
          isError: false,
          result: {
            content: [{ type: "text", text: "42" }],
          },
          resultText: "42",
          images: [],
        },
      };
      socket?.send(JSON.stringify(response));
    });

    const result = (await requestJson(
      "POST",
      "/sessions/excel%3Atest-session/tools/echo",
      { args: { value: 42, format: "json" } },
      { baseUrl: server.httpUrl },
    )) as {
      ok: boolean;
      result: { resultText: string; toolName: string };
    };

    await invokePromise;

    expect(result.ok).toBe(true);
    expect(result.result.toolName).toBe("echo");
    expect(result.result.resultText).toBe("42");
  });

  it("rejects pending invocations when the WebSocket session disconnects mid-request", async () => {
    const tls = createTempTlsMaterial();
    tlsDir = tls.dir;
    const port = await getFreePort();
    server = await createBridgeServer({
      host: "127.0.0.1",
      port,
      certPath: tls.certPath,
      keyPath: tls.keyPath,
      logger: silentLogger,
    });

    socket = await connectClient(server.wsUrl);
    socket.send(
      JSON.stringify({
        type: "hello",
        role: "office-addin",
        protocolVersion: 1,
        snapshot: createSnapshot(),
      }),
    );
    await waitForParsedMessage(socket);

    const invocation = server.invokeSession({
      sessionId: "excel:test-session",
      method: "ping",
      timeoutMs: 5_000,
    });

    const message = await waitForParsedMessage(socket);
    expect(message.type).toBe("invoke");
    socket.close();

    await expect(invocation).rejects.toThrow(/disconnected/i);
  });
});

// ---------------------------------------------------------------------------
// createBridgeEvent — typed event creation
// ---------------------------------------------------------------------------

describe("createBridgeEvent typed events", () => {
  it("creates a message:created event with the correct wire shape", () => {
    const event = createBridgeEvent("message:created", {
      messageId: "msg_abc",
      role: "assistant",
    });
    expect(event.type).toBe("event");
    expect(event.event).toBe("message:created");
    expect(event.payload.messageId).toBe("msg_abc");
    expect(event.payload.role).toBe("assistant");
    expect(typeof event.ts).toBe("number");
  });

  it("creates a tool:failed event with error and durationMs", () => {
    const event = createBridgeEvent("tool:failed", {
      toolCallId: "tc_1",
      toolName: "eval_officejs",
      error: "syntax error",
      durationMs: 250,
    });
    expect(event.event).toBe("tool:failed");
    expect(event.payload.error).toBe("syntax error");
    expect(event.payload.durationMs).toBe(250);
  });

  it("creates a ui:scroll_position event with scrollPct", () => {
    const event = createBridgeEvent("ui:scroll_position", {
      atBottom: true,
      scrollPct: 1.0,
    });
    expect(event.payload.atBottom).toBe(true);
    expect(event.payload.scrollPct).toBe(1.0);
  });

  it("timestamps are monotonically increasing across successive calls", () => {
    const first = createBridgeEvent("state:mode_changed", {
      from: "idle",
      to: "agent",
    });
    const second = createBridgeEvent("state:mode_changed", {
      from: "agent",
      to: "idle",
    });
    expect(second.ts).toBeGreaterThanOrEqual(first.ts);
  });
});

// ---------------------------------------------------------------------------
// toBridgeClassifiedError — error classification
// ---------------------------------------------------------------------------

describe("toBridgeClassifiedError in server context", () => {
  it("classifies an office_js error correctly", () => {
    const err = new Error("InvalidReference");
    const classified = toBridgeClassifiedError(err, "office_js");
    expect(classified.errorClass).toBe("office_js");
    expect(classified.message).toBe("InvalidReference");
    expect(classified.stack).toBeDefined();
  });

  it("classifies an unknown error from a non-Error value", () => {
    const classified = toBridgeClassifiedError({ weird: true }, "internal");
    expect(classified.errorClass).toBe("internal");
    expect(classified.message).toBe("Unknown bridge error");
  });

  it("defaults errorClass to unknown", () => {
    const classified = toBridgeClassifiedError(new Error("x"));
    expect(classified.errorClass).toBe("unknown");
  });
});

// ---------------------------------------------------------------------------
// serializeForJson — edge cases
// ---------------------------------------------------------------------------

describe("serializeForJson edge cases", () => {
  it("serializes an Error with custom name", () => {
    const err = new TypeError("bad type");
    const result = serializeForJson(err) as Record<string, unknown>;
    expect(result.name).toBe("TypeError");
    expect(result.message).toBe("bad type");
  });

  it("serializes a Uint8Array correctly", () => {
    const arr = new Uint8Array(8);
    const result = serializeForJson(arr) as Record<string, unknown>;
    expect(result.type).toBe("Uint8Array");
    expect(result.byteLength).toBe(8);
  });

  it("serializes bigint to its string representation", () => {
    // Use BigInt() with a string literal to avoid IEEE 754 precision loss.
    expect(serializeForJson(BigInt("9007199254740993"))).toBe(
      "9007199254740993",
    );
  });

  it("handles deeply nested objects with mixed special values", () => {
    const nested = {
      level1: {
        err: new Error("deep"),
        bytes: new Uint8Array([255]),
        big: BigInt(1),
        plain: "ok",
      },
    };
    const result = serializeForJson(nested) as Record<
      string,
      Record<string, unknown>
    >;
    const l1 = result.level1;
    expect((l1.err as Record<string, unknown>).message).toBe("deep");
    expect((l1.bytes as Record<string, unknown>).byteLength).toBe(1);
    expect(l1.big).toBe("1");
    expect(l1.plain).toBe("ok");
  });
});

// ---------------------------------------------------------------------------
// SSE endpoint — event-stream headers and event filtering
// ---------------------------------------------------------------------------

describe("bridge server SSE endpoint", () => {
  let tlsDir = "";
  let server: BridgeServerHandle | null = null;
  let socket: WebSocket | null = null;

  beforeEach(() => {
    tlsDir = "";
  });

  afterEach(async () => {
    if (socket) {
      socket.terminate();
      socket = null;
    }
    if (server) {
      await server.close();
      server = null;
    }
    if (tlsDir) {
      rmSync(tlsDir, { recursive: true, force: true });
      tlsDir = "";
    }
  });

  it("returns 404 for an unknown session", async () => {
    const tls = createTempTlsMaterial();
    tlsDir = tls.dir;
    const port = await getFreePort();
    server = await createBridgeServer({
      host: "127.0.0.1",
      port,
      certPath: tls.certPath,
      keyPath: tls.keyPath,
      logger: silentLogger,
    });

    const res = await fetch(
      `${server.httpUrl}/sessions/nonexistent%3Aid/events/stream`,
      { headers: { Accept: "text/event-stream" } },
    ).catch(() => null);

    // node fetch does not verify self-signed certs — use requestJson instead.
    let threw = false;
    try {
      await requestJson(
        "GET",
        "/sessions/nonexistent%3Aid/events/stream",
        undefined,
        { baseUrl: server.httpUrl },
      );
    } catch (err) {
      threw = true;
      expect(String(err)).toMatch(/404|Unknown session/i);
    }
    expect(threw).toBe(true);
  });

  it("streams events to SSE subscribers with text/event-stream content type", async () => {
    const tls = createTempTlsMaterial();
    tlsDir = tls.dir;
    const port = await getFreePort();
    server = await createBridgeServer({
      host: "127.0.0.1",
      port,
      certPath: tls.certPath,
      keyPath: tls.keyPath,
      logger: silentLogger,
    });

    socket = await connectClient(server.wsUrl);
    const snapshot = createSnapshot();
    socket.send(
      JSON.stringify({
        type: "hello",
        role: "office-addin",
        protocolVersion: 1,
        snapshot,
      }),
    );
    await waitForParsedMessage(socket);

    const https = await import("node:https");
    const sseUrl = new URL(
      `/sessions/${encodeURIComponent(snapshot.sessionId)}/events/stream`,
      server.httpUrl,
    );

    const receivedLines: string[] = [];

    const ssePromise = new Promise<void>((resolve) => {
      const req = https.request(
        sseUrl,
        { method: "GET", rejectUnauthorized: false },
        (res) => {
          expect(res.headers["content-type"]).toContain("text/event-stream");
          expect(res.headers["cache-control"]).toContain("no-cache");
          res.on("data", (chunk: Buffer) => {
            const lines = chunk.toString("utf8").split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                receivedLines.push(line.slice(6).trim());
                if (receivedLines.length >= 1) {
                  req.destroy();
                  resolve();
                }
              }
            }
          });
          res.on("error", () => resolve());
        },
      );
      req.on("error", () => resolve());
      req.end();
    });

    // Give the SSE connection a moment to establish, then emit an event.
    await new Promise((r) => setTimeout(r, 50));
    socket.send(
      JSON.stringify({ type: "event", event: "tool_executed", ts: Date.now() }),
    );

    await ssePromise;
    expect(receivedLines.length).toBeGreaterThanOrEqual(1);
    const parsed = JSON.parse(receivedLines[0]) as {
      event: string;
      ts: number;
    };
    expect(parsed.event).toBe("tool_executed");
  });

  it("filters SSE events by the events query parameter", async () => {
    const tls = createTempTlsMaterial();
    tlsDir = tls.dir;
    const port = await getFreePort();
    server = await createBridgeServer({
      host: "127.0.0.1",
      port,
      certPath: tls.certPath,
      keyPath: tls.keyPath,
      logger: silentLogger,
    });

    socket = await connectClient(server.wsUrl);
    const snapshot = createSnapshot();
    socket.send(
      JSON.stringify({
        type: "hello",
        role: "office-addin",
        protocolVersion: 1,
        snapshot,
      }),
    );
    await waitForParsedMessage(socket);

    const https = await import("node:https");
    const sseUrl = new URL(
      `/sessions/${encodeURIComponent(snapshot.sessionId)}/events/stream?events=session_updated`,
      server.httpUrl,
    );

    const receivedEvents: string[] = [];

    const ssePromise = new Promise<void>((resolve) => {
      const req = https.request(
        sseUrl,
        { method: "GET", rejectUnauthorized: false },
        (res) => {
          res.on("data", (chunk: Buffer) => {
            const lines = chunk.toString("utf8").split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data) {
                  const evt = JSON.parse(data) as { event: string };
                  receivedEvents.push(evt.event);
                  if (receivedEvents.length >= 1) {
                    req.destroy();
                    resolve();
                  }
                }
              }
            }
          });
          res.on("error", () => resolve());
          setTimeout(() => {
            req.destroy();
            resolve();
          }, 1000);
        },
      );
      req.on("error", () => resolve());
      req.end();
    });

    await new Promise((r) => setTimeout(r, 50));

    // Emit a tool_executed event — should be filtered out.
    socket.send(
      JSON.stringify({
        type: "event",
        event: "tool_executed",
        ts: Date.now(),
      }),
    );

    // Emit a session_updated event — should pass through.
    socket.send(
      JSON.stringify({
        type: "event",
        event: "session_updated",
        ts: Date.now(),
        payload: createSnapshot({ updatedAt: Date.now() + 1 }),
      }),
    );

    await ssePromise;

    // Only session_updated should have been received.
    expect(receivedEvents.every((e) => e === "session_updated")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// State diff endpoint — changed/unchanged detection
// ---------------------------------------------------------------------------

describe("bridge server state diff endpoint", () => {
  let tlsDir = "";
  let server: BridgeServerHandle | null = null;
  let socket: WebSocket | null = null;

  beforeEach(() => {
    tlsDir = "";
  });

  afterEach(async () => {
    if (socket) {
      socket.terminate();
      socket = null;
    }
    if (server) {
      await server.close();
      server = null;
    }
    if (tlsDir) {
      rmSync(tlsDir, { recursive: true, force: true });
      tlsDir = "";
    }
  });

  it("returns 404 for an unknown session", async () => {
    const tls = createTempTlsMaterial();
    tlsDir = tls.dir;
    const port = await getFreePort();
    server = await createBridgeServer({
      host: "127.0.0.1",
      port,
      certPath: tls.certPath,
      keyPath: tls.keyPath,
      logger: silentLogger,
    });

    let threw = false;
    try {
      await requestJson(
        "POST",
        "/sessions/no-such-session/diff",
        { since: 0 },
        { baseUrl: server.httpUrl },
      );
    } catch (err) {
      threw = true;
      expect(String(err)).toMatch(/404|Unknown session/i);
    }
    expect(threw).toBe(true);
  });

  it("reports changed=false when no events have arrived since the given timestamp", async () => {
    const tls = createTempTlsMaterial();
    tlsDir = tls.dir;
    const port = await getFreePort();
    server = await createBridgeServer({
      host: "127.0.0.1",
      port,
      certPath: tls.certPath,
      keyPath: tls.keyPath,
      logger: silentLogger,
    });

    socket = await connectClient(server.wsUrl);
    socket.send(
      JSON.stringify({
        type: "hello",
        role: "office-addin",
        protocolVersion: 1,
        snapshot: createSnapshot(),
      }),
    );
    await waitForParsedMessage(socket);

    const future = Date.now() + 60_000;
    const diff = (await requestJson(
      "POST",
      `/sessions/${encodeURIComponent("excel:test-session")}/diff`,
      { since: future },
      { baseUrl: server.httpUrl },
    )) as {
      ok: boolean;
      since: number;
      now: number;
      newEvents: Array<{ id: string; event: string; ts: number }>;
      runtimeStateDiff: Record<string, unknown>;
      changed: boolean;
      newEventCount: number;
    };

    expect(diff.ok).toBe(true);
    expect(diff.since).toBe(future);
    expect(diff.now).toBeGreaterThanOrEqual(future - 60_000);
    expect(diff.newEvents).toEqual([]);
    expect(diff.runtimeStateDiff).toEqual({});
    expect(diff.changed).toBe(false);
    expect(diff.newEventCount).toBe(0);
  });

  it("reports changed=true when events arrive after the since timestamp", async () => {
    const tls = createTempTlsMaterial();
    tlsDir = tls.dir;
    const port = await getFreePort();
    server = await createBridgeServer({
      host: "127.0.0.1",
      port,
      certPath: tls.certPath,
      keyPath: tls.keyPath,
      logger: silentLogger,
    });

    socket = await connectClient(server.wsUrl);
    socket.send(
      JSON.stringify({
        type: "hello",
        role: "office-addin",
        protocolVersion: 1,
        snapshot: createSnapshot(),
      }),
    );
    await waitForParsedMessage(socket);

    const before = Date.now();
    await new Promise((r) => setTimeout(r, 5));
    socket.send(
      JSON.stringify({ type: "event", event: "tool_executed", ts: Date.now() }),
    );
    await new Promise((r) => setTimeout(r, 20));

    const diff = (await requestJson(
      "POST",
      `/sessions/${encodeURIComponent("excel:test-session")}/diff`,
      { since: before },
      { baseUrl: server.httpUrl },
    )) as {
      ok: boolean;
      newEvents: Array<{
        id: string;
        event: string;
        ts: number;
        payload?: unknown;
      }>;
      changed: boolean;
      newEventCount: number;
      since: number;
      now: number;
    };

    expect(diff.ok).toBe(true);
    expect(diff.newEvents.length).toBeGreaterThanOrEqual(1);
    expect(diff.newEvents[0].event).toBe("tool_executed");
    expect(typeof diff.newEvents[0].id).toBe("string");
    expect(diff.newEvents[0].ts).toBeGreaterThan(before);
    expect(diff.changed).toBe(true);
    expect(diff.newEventCount).toBe(diff.newEvents.length);
    expect(diff.since).toBe(before);
    expect(diff.now).toBeGreaterThanOrEqual(before);
  });

  it("returns newEvents using the stored event wire shape", async () => {
    const tls = createTempTlsMaterial();
    tlsDir = tls.dir;
    const port = await getFreePort();
    server = await createBridgeServer({
      host: "127.0.0.1",
      port,
      certPath: tls.certPath,
      keyPath: tls.keyPath,
      logger: silentLogger,
    });

    socket = await connectClient(server.wsUrl);
    socket.send(
      JSON.stringify({
        type: "hello",
        role: "office-addin",
        protocolVersion: 1,
        snapshot: createSnapshot(),
      }),
    );
    await waitForParsedMessage(socket);

    const before = Date.now();
    await new Promise((r) => setTimeout(r, 5));
    socket.send(
      JSON.stringify({
        type: "event",
        event: "session_updated",
        ts: Date.now(),
        payload: {
          foo: "bar",
          nested: { count: 1 },
        },
      }),
    );
    await new Promise((r) => setTimeout(r, 20));

    const diff = (await requestJson(
      "POST",
      `/sessions/${encodeURIComponent("excel:test-session")}/diff`,
      { since: before },
      { baseUrl: server.httpUrl },
    )) as {
      ok: boolean;
      newEvents: Array<{
        id: string;
        event: string;
        ts: number;
        payload?: unknown;
      }>;
    };

    expect(diff.ok).toBe(true);
    expect(diff.newEvents).toHaveLength(1);
    expect(diff.newEvents[0]).toMatchObject({
      event: "session_updated",
      payload: {
        foo: "bar",
        nested: { count: 1 },
      },
    });
    expect(typeof diff.newEvents[0].id).toBe("string");
    expect(typeof diff.newEvents[0].ts).toBe("number");
  });

  it("populates runtimeStateDiff when runtimeState is present in snapshot", async () => {
    const tls = createTempTlsMaterial();
    tlsDir = tls.dir;
    const port = await getFreePort();
    server = await createBridgeServer({
      host: "127.0.0.1",
      port,
      certPath: tls.certPath,
      keyPath: tls.keyPath,
      logger: silentLogger,
    });

    const runtimeState: BridgeRuntimeStateSlice = {
      mode: "agent",
      taskPhase: "executing",
      isStreaming: true,
      permissionMode: "auto",
      waitingState: null,
      activePlanSummary: null,
      activeTaskSummary: null,
      contextBudget: { usagePct: 0.25, action: "continue" },
      lastVerification: null,
      sessionStats: {
        inputTokens: 100,
        outputTokens: 200,
        totalCost: 0.01,
        messageCount: 5,
      },
      error: null,
      threadCount: 1,
      activeThreadId: "thread_1",
      degradedGuardrails: [],
    };

    socket = await connectClient(server.wsUrl);
    socket.send(
      JSON.stringify({
        type: "hello",
        role: "office-addin",
        protocolVersion: 1,
        snapshot: createSnapshot({ runtimeState }),
      }),
    );
    await waitForParsedMessage(socket);

    const diff = (await requestJson(
      "POST",
      `/sessions/${encodeURIComponent("excel:test-session")}/diff`,
      { since: 0 },
      { baseUrl: server.httpUrl },
    )) as {
      ok: boolean;
      runtimeStateDiff: Record<string, unknown>;
    };

    expect(diff.ok).toBe(true);
    expect(diff.runtimeStateDiff.mode).toBe("agent");
    expect(diff.runtimeStateDiff.isStreaming).toBe(true);
    expect(diff.runtimeStateDiff.taskPhase).toBe("executing");
  });
});
