import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type BridgeRequestOptions, requestJson } from "./http-client.js";
import {
  type BridgeToolExecutionResult,
  serializeForJson,
} from "./protocol.js";
import { type BridgeSessionRecord, findMatchingSession } from "./server.js";

function toStructuredRecord(value: unknown): Record<string, unknown> {
  const serialized = serializeForJson(value);
  if (
    serialized &&
    typeof serialized === "object" &&
    !Array.isArray(serialized)
  ) {
    return serialized as Record<string, unknown>;
  }
  return { value: serialized };
}

function buildJsonResult(data: unknown) {
  const structuredContent = toStructuredRecord(data);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(serializeForJson(data), null, 2),
      },
    ],
    structuredContent,
  };
}

export function bridgeToolExecutionResultToMcpResult(
  result: BridgeToolExecutionResult,
) {
  const content = [];
  if (result.resultText.trim()) {
    content.push({ type: "text" as const, text: result.resultText });
  }
  for (const image of result.images) {
    content.push({
      type: "image" as const,
      data: image.data,
      mimeType: image.mimeType,
    });
  }
  if (content.length === 0) {
    content.push({
      type: "text" as const,
      text: JSON.stringify(serializeForJson(result.result), null, 2),
    });
  }
  return {
    content,
    structuredContent: toStructuredRecord(result),
    isError: result.isError,
  };
}

export async function createOfficeBridgeMcpServer(
  options: BridgeRequestOptions = {},
) {
  const server = new McpServer(
    {
      name: "office-bridge",
      version: "0.0.2",
    },
    {
      capabilities: {
        tools: {},
      },
      instructions:
        "Use this server to inspect live Office bridge sessions, read Word live context, execute bridge tools, and optionally run privileged Office.js actions when the target session allows them.",
    },
  );

  async function fetchSessions() {
    const response = await requestJson<{
      ok: true;
      sessions: BridgeSessionRecord[];
    }>("GET", "/sessions", undefined, options);
    return response.sessions;
  }

  async function resolveSession(selector?: string) {
    const sessions = await fetchSessions();
    if (sessions.length === 0) {
      throw new Error("No bridge sessions available.");
    }
    if (!selector) {
      if (sessions.length === 1) return sessions[0];
      throw new Error(
        "Multiple bridge sessions available. Pass a session selector.",
      );
    }
    const matches = findMatchingSession(sessions, selector);
    if (matches.length === 1) return matches[0];
    if (matches.length === 0) {
      throw new Error(`No bridge session matches "${selector}".`);
    }
    throw new Error(
      `Bridge session selector "${selector}" is ambiguous: ${matches.map((session) => session.snapshot.sessionId).join(", ")}`,
    );
  }

  server.registerTool(
    "list_sessions",
    {
      description: "List connected Office bridge sessions.",
    },
    async () => buildJsonResult({ sessions: await fetchSessions() }),
  );

  server.registerTool(
    "get_session_snapshot",
    {
      description:
        "Get the latest snapshot for a bridge session, including runtime state, gateway capabilities, and live context.",
      inputSchema: z.object({
        session: z.string().optional(),
      }),
    },
    async ({ session }) => {
      const resolved = await resolveSession(session);
      const response = await requestJson<{ ok: true; result: unknown }>(
        "POST",
        "/rpc",
        {
          sessionId: resolved.snapshot.sessionId,
          method: "refresh_session",
        },
        options,
      );
      return buildJsonResult(response.result);
    },
  );

  server.registerTool(
    "get_live_context",
    {
      description:
        "Read the current live context for a bridge session, including selected Word text when available.",
      inputSchema: z.object({
        session: z.string().optional(),
      }),
    },
    async ({ session }) => {
      const resolved = await resolveSession(session);
      const response = await requestJson<{ ok: true; result: unknown }>(
        "POST",
        "/rpc",
        {
          sessionId: resolved.snapshot.sessionId,
          method: "refresh_session",
        },
        options,
      );
      const snapshot = response.result as {
        gateway?: { liveContext?: unknown };
      };
      return buildJsonResult({
        sessionId: resolved.snapshot.sessionId,
        liveContext: snapshot.gateway?.liveContext ?? null,
      });
    },
  );

  server.registerTool(
    "get_recent_events",
    {
      description: "Fetch recent bridge events for a session.",
      inputSchema: z.object({
        session: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      }),
    },
    async ({ session, limit }) => {
      const resolved = await resolveSession(session);
      const response = await requestJson<{
        ok: true;
        events: unknown[];
      }>(
        "GET",
        `/sessions/${encodeURIComponent(resolved.snapshot.sessionId)}/events?limit=${limit ?? 20}`,
        undefined,
        options,
      );
      return buildJsonResult({
        sessionId: resolved.snapshot.sessionId,
        events: response.events,
      });
    },
  );

  server.registerTool(
    "call_bridge_tool",
    {
      description:
        "Execute a registered bridge tool for a session. Respect the session's declared capability boundaries.",
      inputSchema: z.object({
        session: z.string().optional(),
        toolName: z.string(),
        args: z.record(z.string(), z.unknown()).optional(),
      }),
    },
    async ({ session, toolName, args }) => {
      const resolved = await resolveSession(session);
      const response = await requestJson<{
        ok: true;
        result: BridgeToolExecutionResult;
      }>(
        "POST",
        `/sessions/${encodeURIComponent(resolved.snapshot.sessionId)}/tools/${encodeURIComponent(toolName)}`,
        { args: args ?? {} },
        options,
      );
      return bridgeToolExecutionResultToMcpResult(response.result);
    },
  );

  server.registerTool(
    "run_unsafe_office_js",
    {
      description:
        "Run privileged Office.js code against a session when that session explicitly exposes the unsafe_office_js capability.",
      inputSchema: z.object({
        session: z.string().optional(),
        code: z.string(),
        explanation: z.string().optional(),
      }),
    },
    async ({ session, code, explanation }) => {
      const resolved = await resolveSession(session);
      const response = await requestJson<{ ok: true; result: unknown }>(
        "POST",
        "/rpc",
        {
          sessionId: resolved.snapshot.sessionId,
          method: "execute_unsafe_office_js",
          params: { code, explanation },
        },
        options,
      );
      return buildJsonResult(response.result);
    },
  );

  server.registerTool(
    "vfs_list",
    {
      description: "List files exposed through the bridge virtual filesystem.",
      inputSchema: z.object({
        session: z.string().optional(),
        prefix: z.string().optional(),
      }),
    },
    async ({ session, prefix }) => {
      const resolved = await resolveSession(session);
      const response = await requestJson<{ ok: true; result: unknown }>(
        "POST",
        "/rpc",
        {
          sessionId: resolved.snapshot.sessionId,
          method: "vfs_list",
          params: { prefix },
        },
        options,
      );
      return buildJsonResult(response.result);
    },
  );

  server.registerTool(
    "vfs_read",
    {
      description: "Read a bridge virtual filesystem file.",
      inputSchema: z.object({
        session: z.string().optional(),
        path: z.string(),
        encoding: z.enum(["text", "base64"]).optional(),
      }),
    },
    async ({ session, path, encoding }) => {
      const resolved = await resolveSession(session);
      const response = await requestJson<{ ok: true; result: unknown }>(
        "POST",
        "/rpc",
        {
          sessionId: resolved.snapshot.sessionId,
          method: "vfs_read",
          params: { path, encoding },
        },
        options,
      );
      return buildJsonResult(response.result);
    },
  );

  server.registerTool(
    "vfs_write",
    {
      description: "Write a bridge virtual filesystem file.",
      inputSchema: z.object({
        session: z.string().optional(),
        path: z.string(),
        text: z.string().optional(),
        dataBase64: z.string().optional(),
      }),
    },
    async ({ session, path, text, dataBase64 }) => {
      const resolved = await resolveSession(session);
      const response = await requestJson<{ ok: true; result: unknown }>(
        "POST",
        "/rpc",
        {
          sessionId: resolved.snapshot.sessionId,
          method: "vfs_write",
          params: { path, text, dataBase64 },
        },
        options,
      );
      return buildJsonResult(response.result);
    },
  );

  server.registerTool(
    "vfs_delete",
    {
      description: "Delete a bridge virtual filesystem file.",
      inputSchema: z.object({
        session: z.string().optional(),
        path: z.string(),
      }),
    },
    async ({ session, path }) => {
      const resolved = await resolveSession(session);
      const response = await requestJson<{ ok: true; result: unknown }>(
        "POST",
        "/rpc",
        {
          sessionId: resolved.snapshot.sessionId,
          method: "vfs_delete",
          params: { path },
        },
        options,
      );
      return buildJsonResult(response.result);
    },
  );

  return server;
}
