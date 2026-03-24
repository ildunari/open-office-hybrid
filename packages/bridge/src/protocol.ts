export const BRIDGE_PROTOCOL_VERSION = 1;
export const DEFAULT_BRIDGE_HOST = "localhost";
export const DEFAULT_BRIDGE_PORT = 4017;
export const DEFAULT_BRIDGE_WS_PATH = "/ws";
export const DEFAULT_BRIDGE_HTTP_URL = `https://${DEFAULT_BRIDGE_HOST}:${DEFAULT_BRIDGE_PORT}`;
export const DEFAULT_BRIDGE_WS_URL = `wss://${DEFAULT_BRIDGE_HOST}:${DEFAULT_BRIDGE_PORT}${DEFAULT_BRIDGE_WS_PATH}`;
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
export const DEFAULT_EVENT_LIMIT = 200;

export type BridgeApp = "excel" | "powerpoint" | "word" | (string & {});

export interface BridgeToolDefinition {
  name: string;
  label?: string;
  description?: string;
  parameters?: unknown;
}

export interface BridgeHostInfo {
  host?: string;
  platform?: string;
  officeVersion?: string;
  userAgent?: string;
  href: string;
  title?: string;
}

export interface BridgeSessionSnapshot {
  sessionId: string;
  instanceId: string;
  app: BridgeApp;
  appName?: string;
  appVersion?: string;
  metadataTag?: string;
  documentId: string;
  documentMetadata?: unknown;
  tools: BridgeToolDefinition[];
  host: BridgeHostInfo;
  runtimeState?: BridgeRuntimeStateSlice;
  connectedAt: number;
  updatedAt: number;
}

export interface BridgeError {
  message: string;
  code?: string;
  stack?: string;
}

export interface BridgeHelloMessage {
  type: "hello";
  role: "office-addin";
  protocolVersion: number;
  snapshot: BridgeSessionSnapshot;
}

export interface BridgeWelcomeMessage {
  type: "welcome";
  protocolVersion: number;
  serverTime: number;
}

export type BridgeInvokeMethod =
  | "ping"
  | "get_session_snapshot"
  | "refresh_session"
  | "execute_tool"
  | "execute_unsafe_office_js"
  | "vfs_list"
  | "vfs_read"
  | "vfs_write"
  | "vfs_delete";

export interface BridgeInvokeMessage {
  type: "invoke";
  requestId: string;
  method: BridgeInvokeMethod;
  params?: unknown;
}

export interface BridgeResponseMessage {
  type: "response";
  requestId: string;
  ok: boolean;
  result?: unknown;
  error?: BridgeError;
}

export interface BridgeEventMessage {
  type: "event";
  event: string;
  ts: number;
  payload?: unknown;
}

export type BridgeWireMessage =
  | BridgeHelloMessage
  | BridgeWelcomeMessage
  | BridgeInvokeMessage
  | BridgeResponseMessage
  | BridgeEventMessage;

export interface BridgeStoredEvent {
  id: string;
  event: string;
  ts: number;
  payload?: unknown;
}

// ---------------------------------------------------------------------------
// Typed event registry — discriminated payloads by event name
// ---------------------------------------------------------------------------

export type BridgeErrorClass =
  | "office_js"
  | "tool_execution"
  | "network"
  | "timeout"
  | "rate_limit"
  | "llm_api"
  | "ui_render"
  | "internal"
  | "unknown";

export interface BridgeEventPayloads {
  // Message lifecycle
  "message:created": { messageId: string; role: string };
  "message:streaming": { messageId: string; tokenCount?: number };
  "message:completed": {
    messageId: string;
    role: string;
    tokenCount?: number;
    durationMs?: number;
  };

  // Tool lifecycle
  "tool:queued": { toolCallId: string; toolName: string };
  "tool:started": { toolCallId: string; toolName: string };
  "tool:completed": {
    toolCallId: string;
    toolName: string;
    durationMs?: number;
    truncated?: boolean;
  };
  "tool:failed": {
    toolCallId: string;
    toolName: string;
    error: string;
    durationMs?: number;
  };

  // Plan lifecycle
  "plan:created": { planId: string; stepCount: number; mode: string };
  "plan:step_started": {
    planId: string;
    stepId: string;
    stepIndex: number;
    kind: string;
  };
  "plan:step_completed": {
    planId: string;
    stepId: string;
    status: string;
    durationMs?: number;
  };
  "plan:completed": { planId: string; status: string; durationMs?: number };

  // State transitions
  "state:mode_changed": { from: string; to: string; reason?: string };
  "state:phase_changed": { from: string; to: string; reason?: string };

  // Approval flow
  "approval:requested": { actionClass: string; scopes: string[] };
  "approval:granted": { actionClass: string };
  "approval:denied": { actionClass: string; reason?: string };

  // Context budget
  "context:budget_update": { usagePct: number; action: string };
  "context:compacted": { artifactCount: number; threadId?: string };

  // Errors
  "error:tool": {
    source: string;
    errorClass: BridgeErrorClass;
    message: string;
    stack?: string;
  };
  "error:runtime": {
    source: string;
    errorClass: BridgeErrorClass;
    message: string;
    stack?: string;
    recoveryAction?: string;
  };
  "error:office_js": {
    source: string;
    errorClass: "office_js";
    message: string;
    stack?: string;
  };
  "error:ui_boundary": {
    source: string;
    errorClass: "ui_render";
    message: string;
    stack?: string;
  };
  "error:recovered": {
    source: string;
    errorClass: BridgeErrorClass;
    message: string;
    recoveryAction: string;
  };

  // UI events (emitted from frontend components)
  "ui:tab_changed": { tab: string };
  "ui:theme_changed": { theme: string };
  "ui:panel_toggled": { panel: string; visible: boolean };
  "ui:scroll_position": { atBottom: boolean; scrollPct: number };
  "ui:approval_shown": { actionClass: string };
  "ui:approval_responded": { actionClass: string; approved: boolean };
  "ui:session_switched": { fromSessionId?: string; toSessionId: string };
  "ui:resize": { target: string; height: number };

  // Session lifecycle
  "session:hmr_reload": { previousSessionId?: string };
  "session:reconnected": { previousSessionId?: string };

  // Existing untyped events (backward compat — payload stays unknown)
  bridge_connected: Record<string, unknown>;
  bridge_status: Record<string, unknown>;
  bridge_error: Record<string, unknown>;
  bridge_warning: Record<string, unknown>;
  session_updated: Record<string, unknown>;
  tool_executed: Record<string, unknown>;
  console: Record<string, unknown>;
  window_error: Record<string, unknown>;
  unhandled_rejection: Record<string, unknown>;
  unsafe_office_js_executed: Record<string, unknown>;
  vfs_listed: Record<string, unknown>;
  vfs_read: Record<string, unknown>;
  vfs_written: Record<string, unknown>;
  vfs_deleted: Record<string, unknown>;
}

export type BridgeEventName = keyof BridgeEventPayloads;

export interface BridgeTypedEvent<K extends BridgeEventName = BridgeEventName> {
  type: "event";
  event: K;
  ts: number;
  payload: BridgeEventPayloads[K];
}

// ---------------------------------------------------------------------------
// Runtime state slice — curated subset of RuntimeState for bridge snapshots
// ---------------------------------------------------------------------------

export interface BridgeRuntimeStateSlice {
  mode: string;
  taskPhase: string;
  isStreaming: boolean;
  permissionMode: string;
  waitingState: string | null;
  waitingReason?: string | null;
  handoffSummary?: string | null;
  nextRecommendedAction?: string | null;
  activePlanSummary: {
    id: string;
    status: string;
    stepCount: number;
    activeStepIndex: number;
  } | null;
  activeTaskSummary: {
    id: string;
    status: string;
    mode: string;
    toolExecutionCount?: number;
  } | null;
  contextBudget: { usagePct: number; action: string };
  lastVerification: { status: string; retryable?: boolean } | null;
  latestCompletion?: {
    summary: string;
    verificationStatus: string;
  } | null;
  sessionStats: {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
    messageCount: number;
  };
  error: string | null;
  threadCount: number;
  activeThreadId: string | null;
  degradedGuardrails: string[];
}

// ---------------------------------------------------------------------------
// Classified bridge error (extends BridgeError with error class)
// ---------------------------------------------------------------------------

export interface BridgeClassifiedError extends BridgeError {
  errorClass: BridgeErrorClass;
}

export interface BridgeInvokeRequest {
  sessionId: string;
  method: BridgeInvokeMethod;
  params?: unknown;
  timeoutMs?: number;
}

export interface BridgeToolExecutionResult {
  toolCallId: string;
  toolName: string;
  isError: boolean;
  result: unknown;
  resultText: string;
  images: Array<{ data: string; mimeType: string }>;
  error?: string;
}

export interface BridgeUnsafeOfficeJsParams {
  code: string;
  explanation?: string;
}

export interface BridgeUnsafeOfficeJsResult {
  mode: "unsafe";
  app: string;
  result: unknown;
}

export interface BridgeVfsEntry {
  path: string;
  byteLength: number;
}

export interface BridgeVfsListParams {
  prefix?: string;
}

export interface BridgeVfsReadParams {
  path: string;
  encoding?: "text" | "base64";
}

export interface BridgeVfsReadResult {
  path: string;
  encoding: "text" | "base64";
  byteLength: number;
  text?: string;
  dataBase64?: string;
}

export interface BridgeVfsWriteParams {
  path: string;
  text?: string;
  dataBase64?: string;
}

export interface BridgeVfsDeleteParams {
  path: string;
}

export function uint8ArrayToBase64(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

interface ToolTextPart {
  type: "text";
  text: string;
}

interface ToolImagePart {
  type: "image";
  data: string;
  mimeType: string;
}

interface ToolResultLike {
  content?: Array<ToolTextPart | ToolImagePart | Record<string, unknown>>;
  details?: unknown;
}

export function createBridgeId(prefix = "bridge"): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function normalizeBridgeUrl(
  value: string | undefined,
  kind: "ws" | "http",
): string {
  if (!value) {
    return kind === "ws" ? DEFAULT_BRIDGE_WS_URL : DEFAULT_BRIDGE_HTTP_URL;
  }

  const raw = value.trim();
  if (!raw) {
    return kind === "ws" ? DEFAULT_BRIDGE_WS_URL : DEFAULT_BRIDGE_HTTP_URL;
  }

  if (/^wss?:\/\//i.test(raw) || /^https?:\/\//i.test(raw)) {
    const url = new URL(raw);
    if (kind === "ws") {
      if (url.protocol === "http:") url.protocol = "ws:";
      if (url.protocol === "https:") url.protocol = "wss:";
      if (!url.pathname || url.pathname === "/") {
        url.pathname = DEFAULT_BRIDGE_WS_PATH;
      }
    } else {
      if (url.protocol === "ws:") url.protocol = "http:";
      if (url.protocol === "wss:") url.protocol = "https:";
      if (url.pathname === DEFAULT_BRIDGE_WS_PATH) {
        url.pathname = "/";
      }
    }
    return url.toString().replace(/\/$/, "");
  }

  const url = new URL(
    `${kind === "ws" ? "wss" : "https"}://${raw.replace(/^\/+/, "")}`,
  );
  if (kind === "ws" && (!url.pathname || url.pathname === "/")) {
    url.pathname = DEFAULT_BRIDGE_WS_PATH;
  }
  return url.toString().replace(/\/$/, "");
}

export function serializeForJson(value: unknown): unknown {
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, current) => {
        if (current instanceof Error) {
          return {
            name: current.name,
            message: current.message,
            stack: current.stack,
          };
        }
        if (current instanceof Uint8Array) {
          return {
            type: "Uint8Array",
            byteLength: current.byteLength,
          };
        }
        if (typeof current === "bigint") {
          return current.toString();
        }
        return current;
      }),
    );
  } catch {
    try {
      return String(value);
    } catch {
      return "[unserializable]";
    }
  }
}

export function toBridgeError(error: unknown): BridgeError {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: typeof error === "string" ? error : "Unknown bridge error",
  };
}

export function toBridgeClassifiedError(
  error: unknown,
  errorClass: BridgeErrorClass = "unknown",
): BridgeClassifiedError {
  const base = toBridgeError(error);
  return { ...base, errorClass };
}

export function createBridgeEvent<K extends BridgeEventName>(
  event: K,
  payload: BridgeEventPayloads[K],
): BridgeTypedEvent<K> {
  return { type: "event", event, ts: Date.now(), payload };
}

export function isBridgeHelloMessage(
  value: unknown,
): value is BridgeHelloMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as BridgeHelloMessage).type === "hello"
  );
}

export function isBridgeResponseMessage(
  value: unknown,
): value is BridgeResponseMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as BridgeResponseMessage).type === "response"
  );
}

export function isBridgeEventMessage(
  value: unknown,
): value is BridgeEventMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as BridgeEventMessage).type === "event"
  );
}

export function isBridgeInvokeMessage(
  value: unknown,
): value is BridgeInvokeMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as BridgeInvokeMessage).type === "invoke"
  );
}

export function extractToolText(result: unknown): string {
  if (typeof result === "string") return result;

  const candidate = result as ToolResultLike | undefined;
  if (candidate?.content && Array.isArray(candidate.content)) {
    return candidate.content
      .filter((part): part is ToolTextPart => part?.type === "text")
      .map((part) => part.text)
      .join("\n");
  }

  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

export function extractToolImages(
  result: unknown,
): Array<{ data: string; mimeType: string }> {
  const candidate = result as ToolResultLike | undefined;
  if (!candidate?.content || !Array.isArray(candidate.content)) return [];

  return candidate.content
    .filter((part): part is ToolImagePart => part?.type === "image")
    .map((part) => ({ data: part.data, mimeType: part.mimeType }));
}

export function extractToolError(result: unknown): string | undefined {
  const text = extractToolText(result).trim();
  if (!text) return undefined;

  try {
    const parsed = JSON.parse(text);
    if (
      parsed &&
      typeof parsed === "object" &&
      (("error" in parsed && typeof parsed.error === "string") ||
        parsed.success === false)
    ) {
      return typeof parsed.error === "string"
        ? parsed.error
        : "Tool execution failed";
    }
  } catch {
    // Plain text result.
  }

  return undefined;
}

export function getDefaultRawExecutionTool(
  app: string,
): "eval_officejs" | "execute_office_js" | undefined {
  const normalized = app.toLowerCase();
  if (normalized === "excel") return "eval_officejs";
  if (normalized === "powerpoint" || normalized === "word") {
    return "execute_office_js";
  }
  return undefined;
}
