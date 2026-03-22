import { describe, expect, it } from "vitest";
import {
  createBridgeEvent,
  createBridgeId,
  DEFAULT_BRIDGE_HTTP_URL,
  DEFAULT_BRIDGE_WS_URL,
  extractToolError,
  extractToolImages,
  extractToolText,
  getDefaultRawExecutionTool,
  normalizeBridgeUrl,
  serializeForJson,
  summarizePromptAutomationRun,
  toBridgeClassifiedError,
  toBridgeError,
} from "../src/protocol";

// ---------------------------------------------------------------------------
// createBridgeId
// ---------------------------------------------------------------------------

describe("createBridgeId", () => {
  it("uses the default prefix when called with no argument", () => {
    const id = createBridgeId();
    expect(id).toMatch(/^bridge_/);
  });

  it("respects a custom prefix", () => {
    const id = createBridgeId("event");
    expect(id).toMatch(/^event_/);
  });

  it("generates unique values on successive calls", () => {
    const ids = Array.from({ length: 20 }, () => createBridgeId("req"));
    const unique = new Set(ids);
    expect(unique.size).toBe(20);
  });

  it("contains only the prefix and suffix separated by underscore", () => {
    const id = createBridgeId("test");
    const parts = id.split("_");
    expect(parts[0]).toBe("test");
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// normalizeBridgeUrl
// ---------------------------------------------------------------------------

describe("normalizeBridgeUrl", () => {
  it("returns the default WS URL when value is undefined", () => {
    expect(normalizeBridgeUrl(undefined, "ws")).toBe(DEFAULT_BRIDGE_WS_URL);
  });

  it("returns the default HTTP URL when value is undefined", () => {
    expect(normalizeBridgeUrl(undefined, "http")).toBe(DEFAULT_BRIDGE_HTTP_URL);
  });

  it("returns the default WS URL when value is empty string", () => {
    expect(normalizeBridgeUrl("", "ws")).toBe(DEFAULT_BRIDGE_WS_URL);
  });

  it("returns the default HTTP URL when value is empty string", () => {
    expect(normalizeBridgeUrl("", "http")).toBe(DEFAULT_BRIDGE_HTTP_URL);
  });

  it("converts an https URL to wss and appends /ws path", () => {
    const result = normalizeBridgeUrl("https://localhost:4017", "ws");
    expect(result).toBe("wss://localhost:4017/ws");
  });

  it("converts a wss URL to https and strips /ws path", () => {
    const result = normalizeBridgeUrl("wss://localhost:4017/ws", "http");
    expect(result).toBe("https://localhost:4017");
  });

  it("converts an http URL to ws", () => {
    const result = normalizeBridgeUrl("http://localhost:4017", "ws");
    expect(result).toBe("ws://localhost:4017/ws");
  });

  it("converts a ws URL to http", () => {
    const result = normalizeBridgeUrl("ws://localhost:4017/ws", "http");
    expect(result).toBe("http://localhost:4017");
  });

  it("accepts a bare host:port and produces a wss URL", () => {
    const result = normalizeBridgeUrl("localhost:4017", "ws");
    expect(result).toMatch(/^wss:\/\/localhost:4017/);
  });

  it("accepts a bare host:port and produces an https URL", () => {
    const result = normalizeBridgeUrl("localhost:4017", "http");
    expect(result).toMatch(/^https:\/\/localhost:4017/);
  });

  it("preserves an existing custom path when converting for WS", () => {
    const result = normalizeBridgeUrl("https://myhost:9000/custom/ws", "ws");
    expect(result).toBe("wss://myhost:9000/custom/ws");
  });

  it("does not append trailing slash", () => {
    const result = normalizeBridgeUrl("https://localhost:4017", "http");
    expect(result).not.toMatch(/\/$/);
  });

  it("handles whitespace in the input by trimming", () => {
    const result = normalizeBridgeUrl("  https://localhost:4017  ", "http");
    expect(result).toBe("https://localhost:4017");
  });
});

// ---------------------------------------------------------------------------
// toBridgeError
// ---------------------------------------------------------------------------

describe("toBridgeError", () => {
  it("converts an Error instance to a BridgeError with message and stack", () => {
    const err = new Error("something broke");
    const result = toBridgeError(err);
    expect(result.message).toBe("something broke");
    expect(result.stack).toBeDefined();
  });

  it("converts a string to a BridgeError", () => {
    const result = toBridgeError("plain string error");
    expect(result.message).toBe("plain string error");
    expect(result.stack).toBeUndefined();
  });

  it("uses a fallback message for non-string, non-Error values", () => {
    const result = toBridgeError(42);
    expect(result.message).toBe("Unknown bridge error");
  });

  it("uses a fallback message for null", () => {
    const result = toBridgeError(null);
    expect(result.message).toBe("Unknown bridge error");
  });
});

// ---------------------------------------------------------------------------
// toBridgeClassifiedError
// ---------------------------------------------------------------------------

describe("toBridgeClassifiedError", () => {
  it("adds errorClass to the base bridge error", () => {
    const result = toBridgeClassifiedError(new Error("bad"), "office_js");
    expect(result.errorClass).toBe("office_js");
    expect(result.message).toBe("bad");
  });

  it("defaults errorClass to unknown when not provided", () => {
    const result = toBridgeClassifiedError(new Error("oops"));
    expect(result.errorClass).toBe("unknown");
  });

  it("propagates all BridgeError fields", () => {
    const err = new Error("network failed");
    const result = toBridgeClassifiedError(err, "network");
    expect(result.message).toBe("network failed");
    expect(result.stack).toBeDefined();
    expect(result.errorClass).toBe("network");
  });

  it("classifies a string error correctly", () => {
    const result = toBridgeClassifiedError("timed out", "timeout");
    expect(result.message).toBe("timed out");
    expect(result.errorClass).toBe("timeout");
  });

  it("supports all defined error classes without type errors", () => {
    const classes = [
      "office_js",
      "tool_execution",
      "network",
      "timeout",
      "rate_limit",
      "llm_api",
      "ui_render",
      "internal",
      "unknown",
    ] as const;
    for (const cls of classes) {
      const result = toBridgeClassifiedError(new Error("x"), cls);
      expect(result.errorClass).toBe(cls);
    }
  });
});

// ---------------------------------------------------------------------------
// createBridgeEvent
// ---------------------------------------------------------------------------

describe("createBridgeEvent", () => {
  it("creates a typed event with the correct structure", () => {
    const event = createBridgeEvent("message:created", {
      messageId: "msg_1",
      role: "user",
    });
    expect(event.type).toBe("event");
    expect(event.event).toBe("message:created");
    expect(event.payload).toEqual({ messageId: "msg_1", role: "user" });
    expect(typeof event.ts).toBe("number");
  });

  it("sets ts to a recent timestamp", () => {
    const before = Date.now();
    const event = createBridgeEvent("tool:started", {
      toolCallId: "tc_1",
      toolName: "echo",
    });
    const after = Date.now();
    expect(event.ts).toBeGreaterThanOrEqual(before);
    expect(event.ts).toBeLessThanOrEqual(after);
  });

  it("creates a plan:created event with correct payload shape", () => {
    const event = createBridgeEvent("plan:created", {
      planId: "plan_1",
      stepCount: 3,
      mode: "sequential",
    });
    expect(event.payload.planId).toBe("plan_1");
    expect(event.payload.stepCount).toBe(3);
    expect(event.payload.mode).toBe("sequential");
  });

  it("creates a state:mode_changed event", () => {
    const event = createBridgeEvent("state:mode_changed", {
      from: "idle",
      to: "agent",
    });
    expect(event.payload.from).toBe("idle");
    expect(event.payload.to).toBe("agent");
  });

  it("creates a session:hmr_reload event", () => {
    const event = createBridgeEvent("session:hmr_reload", {});
    expect(event.event).toBe("session:hmr_reload");
  });

  it("creates a ui:tab_changed event", () => {
    const event = createBridgeEvent("ui:tab_changed", { tab: "diagnostics" });
    expect(event.payload.tab).toBe("diagnostics");
  });

  it("creates approval and compaction events with the expected payloads", () => {
    const approvalRequested = createBridgeEvent("approval:requested", {
      actionClass: "destructive_write",
      scopes: ["document:body"],
    });
    expect(approvalRequested.payload).toEqual({
      actionClass: "destructive_write",
      scopes: ["document:body"],
    });

    const approvalShown = createBridgeEvent("ui:approval_shown", {
      actionClass: "structural_write",
    });
    expect(approvalShown.payload.actionClass).toBe("structural_write");

    const approvalResponded = createBridgeEvent("ui:approval_responded", {
      actionClass: "structural_write",
      approved: true,
    });
    expect(approvalResponded.payload).toEqual({
      actionClass: "structural_write",
      approved: true,
    });

    const compacted = createBridgeEvent("context:compacted", {
      artifactCount: 2,
      threadId: "thread-1",
    });
    expect(compacted.payload).toEqual({
      artifactCount: 2,
      threadId: "thread-1",
    });
  });

  it("creates an error:tool event with errorClass", () => {
    const event = createBridgeEvent("error:tool", {
      source: "eval_officejs",
      errorClass: "tool_execution",
      message: "RangeError: out of bounds",
    });
    expect(event.payload.errorClass).toBe("tool_execution");
    expect(event.payload.source).toBe("eval_officejs");
  });

  it("creates an error:ui_boundary event without escaping the typed map", () => {
    const event = createBridgeEvent("error:ui_boundary", {
      source: "error-boundary",
      errorClass: "ui_render",
      message: "render exploded",
    });
    expect(event.event).toBe("error:ui_boundary");
    expect(event.payload).toEqual({
      source: "error-boundary",
      errorClass: "ui_render",
      message: "render exploded",
    });
  });
});

// ---------------------------------------------------------------------------
// extractToolText
// ---------------------------------------------------------------------------

describe("extractToolText", () => {
  it("returns a plain string unchanged", () => {
    expect(extractToolText("hello world")).toBe("hello world");
  });

  it("joins text parts from a content array", () => {
    const result = extractToolText({
      content: [
        { type: "text", text: "line 1" },
        { type: "text", text: "line 2" },
      ],
    });
    expect(result).toBe("line 1\nline 2");
  });

  it("skips image parts in the content array", () => {
    const result = extractToolText({
      content: [
        { type: "image", data: "abc123", mimeType: "image/png" },
        { type: "text", text: "caption" },
      ],
    });
    expect(result).toBe("caption");
  });

  it("returns empty string when content array has no text parts", () => {
    const result = extractToolText({
      content: [{ type: "image", data: "abc", mimeType: "image/png" }],
    });
    expect(result).toBe("");
  });

  it("falls back to JSON stringify for non-string, non-content objects", () => {
    const obj = { foo: "bar", count: 3 };
    const result = extractToolText(obj);
    expect(result).toContain('"foo"');
    expect(result).toContain('"bar"');
  });

  it("falls back to JSON stringify for arrays", () => {
    const result = extractToolText([1, 2, 3]);
    expect(result).toContain("1");
  });
});

// ---------------------------------------------------------------------------
// extractToolImages
// ---------------------------------------------------------------------------

describe("extractToolImages", () => {
  it("returns an empty array when result has no content", () => {
    expect(extractToolImages({})).toEqual([]);
  });

  it("returns an empty array for null input", () => {
    expect(extractToolImages(null)).toEqual([]);
  });

  it("extracts image parts from a content array", () => {
    const images = extractToolImages({
      content: [
        { type: "image", data: "base64data", mimeType: "image/png" },
        { type: "text", text: "ignored" },
      ],
    });
    expect(images).toHaveLength(1);
    expect(images[0]).toEqual({ data: "base64data", mimeType: "image/png" });
  });

  it("extracts multiple image parts", () => {
    const images = extractToolImages({
      content: [
        { type: "image", data: "d1", mimeType: "image/png" },
        { type: "image", data: "d2", mimeType: "image/jpeg" },
      ],
    });
    expect(images).toHaveLength(2);
  });

  it("returns an empty array when content array exists but has no image parts", () => {
    const images = extractToolImages({
      content: [{ type: "text", text: "text only" }],
    });
    expect(images).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// extractToolError
// ---------------------------------------------------------------------------

describe("extractToolError", () => {
  it("returns undefined for a plain success string", () => {
    expect(extractToolError("Success")).toBeUndefined();
  });

  it("returns undefined for a non-error JSON object", () => {
    expect(
      extractToolError({ content: [{ type: "text", text: '{"ok":true}' }] }),
    ).toBeUndefined();
  });

  it("extracts error from a JSON object with an error string field", () => {
    const result = extractToolError({
      content: [
        { type: "text", text: JSON.stringify({ error: "cell not found" }) },
      ],
    });
    expect(result).toBe("cell not found");
  });

  it("returns a generic message when success is false but no error string", () => {
    const result = extractToolError({
      content: [
        { type: "text", text: JSON.stringify({ success: false, details: {} }) },
      ],
    });
    expect(result).toBe("Tool execution failed");
  });

  it("returns undefined when the result is empty", () => {
    expect(extractToolError({ content: [] })).toBeUndefined();
  });

  it("returns undefined for a plain text result that is not JSON", () => {
    expect(
      extractToolError({ content: [{ type: "text", text: "plain result" }] }),
    ).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getDefaultRawExecutionTool
// ---------------------------------------------------------------------------

describe("getDefaultRawExecutionTool", () => {
  it("returns eval_officejs for excel", () => {
    expect(getDefaultRawExecutionTool("excel")).toBe("eval_officejs");
  });

  it("returns eval_officejs for Excel (mixed case)", () => {
    expect(getDefaultRawExecutionTool("Excel")).toBe("eval_officejs");
  });

  it("returns execute_office_js for word", () => {
    expect(getDefaultRawExecutionTool("word")).toBe("execute_office_js");
  });

  it("returns execute_office_js for powerpoint", () => {
    expect(getDefaultRawExecutionTool("powerpoint")).toBe("execute_office_js");
  });

  it("returns execute_office_js for PowerPoint (mixed case)", () => {
    expect(getDefaultRawExecutionTool("PowerPoint")).toBe("execute_office_js");
  });

  it("returns undefined for unknown apps", () => {
    expect(getDefaultRawExecutionTool("visio")).toBeUndefined();
    expect(getDefaultRawExecutionTool("")).toBeUndefined();
    expect(getDefaultRawExecutionTool("onenote")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// summarizePromptAutomationRun
// ---------------------------------------------------------------------------

describe("summarizePromptAutomationRun", () => {
  it("summarizes a completed run with the latest assistant text and tool calls", () => {
    const summary = summarizePromptAutomationRun({
      sessionId: "word:test-session",
      app: "word",
      documentId: "doc-123",
      prompt: "Summarize this document",
      startedAt: 1_000,
      completedAt: 1_350,
      snapshot: {
        mode: "completed",
        taskPhase: "completed",
        isStreaming: false,
        permissionMode: "full_auto",
        waitingState: null,
        error: null,
        approvalRequest: null,
        handoff: null,
        messages: [
          {
            id: "msg-user",
            role: "user",
            timestamp: 1_010,
            parts: [{ type: "text", text: "Summarize this document" }],
          },
          {
            id: "msg-assistant",
            role: "assistant",
            timestamp: 1_340,
            parts: [
              { type: "thinking", thinking: "Checking the document" },
              {
                type: "toolCall",
                id: "tool-1",
                name: "get_document_text",
                args: {},
                status: "complete",
                result: "Document body",
              },
              { type: "text", text: "Here is the summary." },
            ],
          },
        ],
      },
    });

    expect(summary.outcome).toBe("completed");
    expect(summary.durationMs).toBe(350);
    expect(summary.latestAssistant?.text).toBe("Here is the summary.");
    expect(summary.latestAssistant?.toolCalls).toEqual([
      {
        id: "tool-1",
        name: "get_document_text",
        status: "complete",
        result: "Document body",
      },
    ]);
    expect(summary.state.taskPhase).toBe("completed");
  });

  it("surfaces approval and handoff details when the runtime is waiting on the user", () => {
    const summary = summarizePromptAutomationRun({
      sessionId: "word:test-session",
      app: "word",
      documentId: "doc-123",
      prompt: "Rewrite the whole contract",
      startedAt: 2_000,
      completedAt: 2_120,
      snapshot: {
        mode: "awaiting_approval",
        taskPhase: "waiting_on_user",
        isStreaming: false,
        permissionMode: "confirm_risky",
        waitingState: { kind: "approval", reason: "Need approval" },
        error: null,
        approvalRequest: {
          reason: "This is a risky whole-document rewrite.",
          actionClass: "destructive_write",
          scopes: [{ kind: "document", ref: "body" }],
        },
        handoff: {
          summary: "Approve the plan to continue.",
          nextRecommendedAction: "Approve the plan.",
        },
        messages: [],
      },
    });

    expect(summary.outcome).toBe("waiting_on_user");
    expect(summary.approvalRequired).toBe(true);
    expect(summary.state.waitingState).toBe("approval");
    expect(summary.approval?.actionClass).toBe("destructive_write");
    expect(summary.handoff?.summary).toBe("Approve the plan to continue.");
  });

  it("reports error outcome when the runtime snapshot contains an error", () => {
    const summary = summarizePromptAutomationRun({
      sessionId: "word:test-session",
      app: "word",
      documentId: "doc-123",
      prompt: "Do the thing",
      startedAt: 3_000,
      completedAt: 3_090,
      snapshot: {
        mode: "blocked",
        taskPhase: "blocked",
        isStreaming: false,
        permissionMode: "full_auto",
        waitingState: null,
        error: "The model request failed.",
        approvalRequest: null,
        handoff: null,
        messages: [],
      },
    });

    expect(summary.outcome).toBe("error");
    expect(summary.state.error).toBe("The model request failed.");
    expect(summary.latestAssistant).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// serializeForJson
// ---------------------------------------------------------------------------

describe("serializeForJson", () => {
  it("passes plain objects through unchanged", () => {
    const result = serializeForJson({ a: 1, b: "hello" });
    expect(result).toEqual({ a: 1, b: "hello" });
  });

  it("converts Error instances to plain objects with name, message, stack", () => {
    const err = new Error("oops");
    const result = serializeForJson(err) as Record<string, unknown>;
    expect(result.name).toBe("Error");
    expect(result.message).toBe("oops");
    expect(typeof result.stack).toBe("string");
  });

  it("converts Uint8Array to a type/byteLength descriptor", () => {
    const arr = new Uint8Array([1, 2, 3, 4]);
    const result = serializeForJson(arr) as Record<string, unknown>;
    expect(result.type).toBe("Uint8Array");
    expect(result.byteLength).toBe(4);
  });

  it("converts bigint to a string", () => {
    const result = serializeForJson(BigInt("12345678901234567890"));
    expect(result).toBe("12345678901234567890");
  });

  it("handles nested Error inside an object", () => {
    const obj = { count: 1, err: new Error("nested") };
    const result = serializeForJson(obj) as Record<string, unknown>;
    const err = result.err as Record<string, unknown>;
    expect(err.message).toBe("nested");
    expect(err.name).toBe("Error");
  });

  it("handles nested Uint8Array inside an object", () => {
    const obj = { data: new Uint8Array([10, 20]) };
    const result = serializeForJson(obj) as Record<string, unknown>;
    const data = result.data as Record<string, unknown>;
    expect(data.type).toBe("Uint8Array");
    expect(data.byteLength).toBe(2);
  });

  it("preserves null and primitive values", () => {
    expect(serializeForJson(null)).toBeNull();
    expect(serializeForJson(42)).toBe(42);
    expect(serializeForJson("text")).toBe("text");
    expect(serializeForJson(true)).toBe(true);
  });

  it("handles arrays containing special types", () => {
    const result = serializeForJson([
      new Error("err"),
      BigInt(99),
    ]) as unknown[];
    const errPart = result[0] as Record<string, unknown>;
    expect(errPart.message).toBe("err");
    expect(result[1]).toBe("99");
  });
});
