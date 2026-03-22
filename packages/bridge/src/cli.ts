#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { DOM_QUERIES } from "./dom-queries.js";
import {
  type BridgeRequestOptions,
  probeBridge,
  requestJson,
} from "./http-client.js";
import {
  buildPromptExecCode,
  observePromptRun,
} from "./prompt-automation.js";
import {
  type BridgeInvokeMethod,
  type BridgeRuntimeStateSlice,
  type BridgeSessionSnapshot,
  type BridgeStoredEvent,
  type BridgeVfsEntry,
  type BridgeVfsReadResult,
  DEFAULT_BRIDGE_HTTP_URL,
  DEFAULT_REQUEST_TIMEOUT_MS,
  getDefaultRawExecutionTool,
  normalizeBridgeUrl,
  serializeForJson,
  summarizePromptAutomationRun,
} from "./protocol.js";
import { getScreenshotTimeoutMs } from "./screenshot-timeout.js";
import {
  type BridgeServerHandle,
  type BridgeSessionRecord,
  createBridgeServer,
  findMatchingSession,
  summarizeExecutionError,
} from "./server.js";
import { pickUniqueWaitSession } from "./session-selection.js";

const OPTIONS = {
  help: { type: "boolean" as const },
  json: { type: "boolean" as const },
  stdin: { type: "boolean" as const },
  sandbox: { type: "boolean" as const },
  url: { type: "string" as const },
  host: { type: "string" as const },
  port: { type: "string" as const },
  timeout: { type: "string" as const },
  input: { type: "string" as const },
  file: { type: "string" as const },
  code: { type: "string" as const },
  explanation: { type: "string" as const },
  out: { type: "string" as const },
  prompt: { type: "string" as const },
  limit: { type: "string" as const },
  app: { type: "string" as const },
  document: { type: "string" as const },
  pages: { type: "string" as const },
  "sheet-id": { type: "string" as const },
  range: { type: "string" as const },
  "slide-index": { type: "string" as const },
  slide: { type: "string" as const },
  interval: { type: "string" as const },
  events: { type: "string" as const },
  mode: { type: "string" as const },
  phase: { type: "string" as const },
  streaming: { type: "string" as const },
  runs: { type: "string" as const },
  threshold: { type: "string" as const },
  text: { type: "string" as const },
  "keep-config": { type: "boolean" as const },
  compact: { type: "boolean" as const },
  fields: { type: "string" as const },
  "max-tokens": { type: "string" as const },
};

const DEFAULT_PROMPT_TIMEOUT_MS = 5 * 60_000;

interface Cli {
  positionals: string[];
  values: Record<string, string | boolean | undefined>;
}

function parseCli(): Cli {
  const { positionals, values } = parseArgs({
    args: process.argv.slice(2),
    options: OPTIONS,
    strict: false,
    allowPositionals: true,
  });
  return {
    positionals,
    values: values as Record<string, string | boolean | undefined>,
  };
}

function str(cli: Cli, name: string): string | undefined {
  const v = cli.values[name];
  return typeof v === "string" ? v : undefined;
}

function flag(cli: Cli, name: string): boolean {
  return cli.values[name] === true;
}

function int(cli: Cli, name: string, fallback: number): number {
  const v = str(cli, name);
  return v ? Number.parseInt(v, 10) : fallback;
}

function reqOpts(cli: Cli): BridgeRequestOptions {
  return {
    baseUrl: str(cli, "url"),
    timeoutMs: int(cli, "timeout", DEFAULT_REQUEST_TIMEOUT_MS),
  };
}

function baseUrl(cli: Cli): string {
  return normalizeBridgeUrl(str(cli, "url") || DEFAULT_BRIDGE_HTTP_URL, "http");
}

function printUsage() {
  console.log(`office-bridge

Commands:
  serve [--host HOST] [--port PORT]
  stop [--url URL]
  list [--json]
  wait [selector] [--app APP] [--document DOCUMENT] [--timeout MS] [--json]
  inspect [session] [--compact] [--fields KEY1,KEY2]
  metadata [session] [--compact] [--fields KEY1,KEY2]
  events [session] [--limit N] [--compact] [--fields KEY1,KEY2] [--max-tokens N]
  prompt [session] [prompt text] [--prompt TEXT | --file PATH | --stdin] [--timeout MS]
  tool [session] <toolName> [--input JSON | --file PATH | --stdin]
  exec [session] [--code JS | --file PATH | --stdin] [--sandbox]
  rpc [session] <method> [--input JSON | --file PATH | --stdin]
  screenshot [session] [--pages PAGES | --sheet-id ID --range A1:B2 | --slide-index N] [--out PATH]
  vfs ls [session] [prefix]
  vfs pull [session] <remotePath> [localPath]
  vfs push [session] <localPath> <remotePath>
  vfs rm [session] <remotePath>
  state [session] [--compact]
  poll [session] [--interval MS] [--events TYPE1,TYPE2]
  assert [session] [--mode X] [--phase Y] [--streaming true|false]
  bench [session] <toolName> [--runs N]
  summary [session]
  diag [session]
  dom [session] <query>
  reset [session] [--keep-config] [--timeout MS]
  screenshot-diff <img1> <img2> [--threshold 0.95]

Supported DOM queries: visible-panels, scroll-positions, computed-theme, layout-metrics, message-count

Global flags:
  --compact     Strip nulls, empty arrays, shorten timestamps
  --fields      Pick only specified keys from output (comma-separated)
  --max-tokens  Limit number of events returned

Examples:
  office-bridge serve
  office-bridge stop
  office-bridge list
  office-bridge inspect word
  office-bridge inspect word --compact --fields app,documentId
  office-bridge prompt word:SESSION_ID "Summarize the key changes in this document."
  office-bridge exec word --code "return { href: window.location.href, title: document.title }"
  office-bridge exec word --sandbox --code "const body = context.document.body; body.load('text'); await context.sync(); return body.text;"
  office-bridge tool excel screenshot_range --input '{"sheetId":1,"range":"A1:F20"}' --out range.png
  office-bridge screenshot word --pages 1 --out page1.png
  office-bridge vfs ls word /home/user
  office-bridge vfs pull word /home/user/uploads/report.docx ./report.docx
  office-bridge state word --compact
  office-bridge poll word --interval 1000 --events session_updated,tool_executed
  office-bridge assert word --mode agent --streaming true
  office-bridge bench word get_document_text --runs 10
  office-bridge summary word
  office-bridge diag word
  office-bridge dom word visible-panels
  office-bridge reset word --keep-config
  office-bridge reset word --keep-config --timeout 300000
  office-bridge screenshot-diff before.png after.png --threshold 0.90
`);
}

// ---------------------------------------------------------------------------
// Input helpers
// ---------------------------------------------------------------------------

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function loadJsonPayload(cli: Cli): Promise<unknown> {
  const inline = str(cli, "input");
  if (inline) return JSON.parse(inline);

  const file = str(cli, "file");
  if (file) return JSON.parse(await readFile(file, "utf8"));

  if (flag(cli, "stdin") || !process.stdin.isTTY) {
    const content = (await readStdin()).trim();
    return content ? JSON.parse(content) : {};
  }

  return {};
}

async function loadCode(cli: Cli): Promise<string> {
  const inline = str(cli, "code");
  if (inline) return inline;

  const file = str(cli, "file");
  if (file) return readFile(file, "utf8");

  if (flag(cli, "stdin") || !process.stdin.isTTY) return readStdin();

  throw new Error("Missing code. Use --code, --file, or --stdin.");
}

async function loadPromptText(
  cli: Cli,
  positionalPrompt: string | undefined,
): Promise<string> {
  const inline = str(cli, "prompt");
  if (inline?.trim()) return inline;

  const legacyText = str(cli, "text");
  if (legacyText?.trim()) return legacyText;

  const file = str(cli, "file");
  if (file) return readFile(file, "utf8");

  if (flag(cli, "stdin") || !process.stdin.isTTY) {
    const content = await readStdin();
    if (content.trim()) return content;
  }

  if (positionalPrompt?.trim()) return positionalPrompt;

  throw new Error(
    "Missing prompt. Pass prompt text directly, use --prompt, --file, or --stdin.",
  );
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

async function fetchSessions(cli: Cli): Promise<BridgeSessionRecord[]> {
  const response = await requestJson<{
    ok: true;
    sessions: BridgeSessionRecord[];
  }>("GET", "/sessions", undefined, reqOpts(cli));
  return response.sessions;
}

function filterSessions(
  sessions: BridgeSessionRecord[],
  cli: Cli,
): BridgeSessionRecord[] {
  const app = str(cli, "app")?.toLowerCase();
  const documentId = str(cli, "document")?.toLowerCase();

  return sessions.filter((s) => {
    if (app && s.snapshot.app.toLowerCase() !== app) return false;
    if (documentId && !s.snapshot.documentId.toLowerCase().includes(documentId))
      return false;
    return true;
  });
}

async function resolveSession(
  cli: Cli,
  selector: string | undefined,
): Promise<BridgeSessionRecord> {
  const filtered = filterSessions(await fetchSessions(cli), cli);
  if (filtered.length === 0) {
    throw new Error(
      "No bridge sessions available. Start the server and open an add-in.",
    );
  }

  if (!selector) {
    if (filtered.length === 1) return filtered[0];
    throw new Error("Multiple sessions available. Pass a session selector.");
  }

  const matches = findMatchingSession(filtered, selector);
  if (matches.length === 1) return matches[0];
  if (matches.length === 0) throw new Error(`No session matches "${selector}"`);
  throw new Error(
    `Session selector "${selector}" is ambiguous: ${matches.map((s) => s.snapshot.sessionId).join(", ")}`,
  );
}

function sessionPath(sessionId: string, suffix = ""): string {
  return `/sessions/${encodeURIComponent(sessionId)}${suffix}`;
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function sanitizeImagesForOutput(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeImagesForOutput);
  if (!value || typeof value !== "object") return value;

  const record = value as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(record)) {
    sanitized[key] = sanitizeImagesForOutput(v);
  }

  const mimeType = typeof record.mimeType === "string" ? record.mimeType : null;
  const imageType = typeof record.type === "string" ? record.type : null;
  const data = typeof record.data === "string" ? record.data : null;

  if (
    data !== null &&
    (mimeType?.startsWith("image/") || imageType === "image")
  ) {
    sanitized.data = "[omitted image base64]";
    sanitized.base64Length = data.length;
  }

  return sanitized;
}

function printJson(value: unknown) {
  console.log(
    JSON.stringify(serializeForJson(sanitizeImagesForOutput(value)), null, 2),
  );
}

function describeSession(session: BridgeSessionRecord): string {
  const ago = Math.round((Date.now() - session.lastSeenAt) / 1000);
  return `${session.snapshot.sessionId}  app=${session.snapshot.app}  document=${session.snapshot.documentId}  tools=${session.snapshot.tools.length}  lastSeen=${ago}s ago`;
}

// ---------------------------------------------------------------------------
// Image save helpers
// ---------------------------------------------------------------------------

function imageExtForMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/bmp": ".bmp",
  };
  return map[mimeType] ?? ".bin";
}

function extractImages(
  value: unknown,
): Array<{ data: string; mimeType: string }> {
  if (!value || typeof value !== "object") return [];
  const images = (value as { images?: unknown }).images;
  if (!Array.isArray(images)) return [];
  return images.filter(
    (img): img is { data: string; mimeType: string } =>
      !!img &&
      typeof img === "object" &&
      typeof (img as Record<string, unknown>).data === "string" &&
      typeof (img as Record<string, unknown>).mimeType === "string",
  );
}

function buildImagePath(
  basePath: string,
  index: number,
  count: number,
  mimeType: string,
): string {
  if (basePath.includes("{n}"))
    return basePath.replaceAll("{n}", String(index + 1));

  const ext = path.extname(basePath);
  const fallbackExt = imageExtForMime(mimeType);
  if (count === 1) return ext ? basePath : `${basePath}${fallbackExt}`;

  const stem = ext ? basePath.slice(0, -ext.length) : basePath;
  return `${stem}-${index + 1}${ext || fallbackExt}`;
}

async function saveFile(localPath: string, data: Buffer): Promise<void> {
  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, data);
}

async function saveImages(
  images: Array<{ data: string; mimeType: string }>,
  outputPath: string,
): Promise<string[]> {
  const saved: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const dest = buildImagePath(outputPath, i, images.length, img.mimeType);
    await saveFile(dest, Buffer.from(img.data, "base64"));
    saved.push(dest);
  }
  return saved;
}

async function maybeSaveToolImages(
  value: unknown,
  outputPath: string | undefined,
): Promise<string[]> {
  if (!outputPath) return [];
  const images = extractImages(value);
  if (images.length === 0)
    throw new Error("No images were returned by this command");
  return saveImages(images, outputPath);
}

function logSavedImages(cli: Cli, savedPaths: string[]) {
  if (savedPaths.length > 0 && !flag(cli, "json")) {
    for (const p of savedPaths) console.log(`Saved image: ${p}`);
  }
}

// ---------------------------------------------------------------------------
// Positional arg splitter for commands with optional [session] prefix
//
// Many commands accept `[session] <required> [optional]`. When there are
// more positionals than the command strictly needs, we try to resolve the
// first one as a session selector. If it matches we consume it; otherwise
// we fall back and treat every positional as a regular arg.
// ---------------------------------------------------------------------------

interface SplitResult {
  session: BridgeSessionRecord;
  args: string[];
}

async function splitSessionArgs(
  cli: Cli,
  positionals: string[],
  minArgs: number,
): Promise<SplitResult> {
  // No positionals at all — resolve session with no selector.
  if (positionals.length === 0) {
    return { session: await resolveSession(cli, undefined), args: [] };
  }

  // Exactly the minimum required — no session selector present.
  if (positionals.length <= minArgs) {
    return { session: await resolveSession(cli, undefined), args: positionals };
  }

  // More positionals than minimum — try treating the first as a session
  // selector. If it doesn't match any session, treat all as regular args.
  const sessions = filterSessions(await fetchSessions(cli), cli);
  const candidate = positionals[0];
  const matches = findMatchingSession(sessions, candidate);

  if (matches.length === 1) {
    return { session: matches[0], args: positionals.slice(1) };
  }

  if (matches.length > 1) {
    throw new Error(
      `Session selector "${candidate}" is ambiguous: ${matches.map((s) => s.snapshot.sessionId).join(", ")}`,
    );
  }

  // No session match — resolve without selector (auto-pick single session)
  return { session: await resolveSession(cli, undefined), args: positionals };
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function commandServe(cli: Cli) {
  const host = str(cli, "host");
  const port = str(cli, "port")
    ? Number.parseInt(str(cli, "port")!, 10)
    : undefined;
  const url = normalizeBridgeUrl(
    `https://${host || "localhost"}:${port || 4017}`,
    "http",
  );

  let server: BridgeServerHandle | null = null;
  try {
    server = await createBridgeServer({ host, port });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Error & { code?: string }).code === "EADDRINUSE"
    ) {
      try {
        await probeBridge(url);
        console.log(`Bridge server already running at ${url}`);
        return;
      } catch {
        throw error;
      }
    }
    throw error;
  }

  const shutdown = async () => {
    if (server) await server.close();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown().catch(() => process.exit(1)));
  process.on("SIGTERM", () => shutdown().catch(() => process.exit(1)));

  console.log(`Bridge server running at ${server.httpUrl}`);
  await new Promise(() => undefined);
}

async function commandStop(cli: Cli) {
  try {
    const response = await requestJson<{ ok: true; message: string }>(
      "POST",
      "/shutdown",
      {},
      reqOpts(cli),
    );
    console.log(response.message);
  } catch {
    try {
      await probeBridge(baseUrl(cli));
      throw new Error("Failed to stop bridge server");
    } catch {
      console.log("Bridge server is not running.");
    }
  }
}

async function commandList(cli: Cli) {
  const sessions = filterSessions(await fetchSessions(cli), cli);
  if (flag(cli, "json")) {
    printJson(sessions);
    return;
  }
  if (sessions.length === 0) {
    console.log("No sessions connected.");
    return;
  }
  for (const s of sessions) console.log(describeSession(s));
}

async function commandWait(cli: Cli) {
  const selector = cli.positionals[1];
  const timeoutMs = int(cli, "timeout", DEFAULT_REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const sessions = filterSessions(await fetchSessions(cli), cli);
    const matches = selector
      ? findMatchingSession(sessions, selector)
      : sessions;
    const session = pickUniqueWaitSession(matches, selector);
    if (session) {
      if (flag(cli, "json")) {
        printJson(session);
      } else {
        console.log(describeSession(session));
      }
      return;
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }

  throw new Error(`Timed out waiting for bridge session after ${timeoutMs}ms`);
}

async function commandInspect(cli: Cli) {
  const session = await resolveSession(cli, cli.positionals[1]);
  const response = await requestJson<{
    ok: true;
    session: BridgeSessionRecord;
  }>("GET", sessionPath(session.snapshot.sessionId), undefined, reqOpts(cli));
  printFormattedJson(response.session, cli);
}

async function commandMetadata(cli: Cli) {
  const session = await resolveSession(cli, cli.positionals[1]);
  const response = await requestJson<{
    ok: true;
    metadata: unknown;
    snapshot: BridgeSessionSnapshot;
  }>(
    "POST",
    sessionPath(session.snapshot.sessionId, "/metadata"),
    {},
    reqOpts(cli),
  );
  printFormattedJson(response, cli);
}

async function commandEvents(cli: Cli) {
  const session = await resolveSession(cli, cli.positionals[1]);
  const limit = int(cli, "limit", 50);
  const maxTokens = int(cli, "max-tokens", 0);
  const response = await requestJson<{ ok: true; events: BridgeStoredEvent[] }>(
    "GET",
    sessionPath(
      session.snapshot.sessionId,
      `/events?limit=${Math.max(1, limit)}`,
    ),
    undefined,
    reqOpts(cli),
  );
  let events = response.events;
  if (maxTokens > 0) events = events.slice(0, maxTokens);

  if (flag(cli, "compact")) {
    const compactEvents = events.map((e) => ({
      ts: e.ts,
      event: e.event,
      payloadSummary: e.payload
        ? JSON.stringify(e.payload).slice(0, 100)
        : null,
    }));
    printFormattedJson(compactEvents, cli);
    return;
  }
  printFormattedJson(events, cli);
}

async function commandTool(cli: Cli) {
  // tool [session] <toolName>  — toolName is required (minArgs=1)
  const { session, args } = await splitSessionArgs(
    cli,
    cli.positionals.slice(1),
    1,
  );
  const toolName = args[0];
  if (!toolName) {
    throw new Error(
      "Usage: office-bridge tool [session] <toolName> [--input JSON | --file PATH] [--out PATH]",
    );
  }

  const payload = await loadJsonPayload(cli);

  const response = await requestJson<{ ok: true; result: unknown }>(
    "POST",
    "/rpc",
    {
      sessionId: session.snapshot.sessionId,
      method: "execute_tool",
      params: {
        toolName,
        args: payload,
      },
      timeoutMs: int(cli, "timeout", DEFAULT_REQUEST_TIMEOUT_MS),
    },
    reqOpts(cli),
  );
  logSavedImages(
    cli,
    await maybeSaveToolImages(response.result, str(cli, "out")),
  );
  printJson(response.result);
}

async function commandPrompt(cli: Cli) {
  const { session, args } = await splitSessionArgs(
    cli,
    cli.positionals.slice(1),
    0,
  );
  if (session.snapshot.app.toLowerCase() !== "word") {
    throw new Error(
      "Prompt automation is currently supported only for Word bridge sessions.",
    );
  }
  const prompt = await loadPromptText(
    cli,
    str(cli, "text") ?? args.join(" "),
  );
  const timeoutMs = str(cli, "timeout")
    ? int(cli, "timeout", DEFAULT_PROMPT_TIMEOUT_MS)
    : DEFAULT_PROMPT_TIMEOUT_MS;
  const startedAt = Date.now();
  const initialState = session.snapshot.runtimeState ?? null;
  const sessionId = session.snapshot.sessionId;
  const code = buildPromptExecCode(prompt);

  const response = await requestJson<{ ok: true; result: unknown }>(
    "POST",
    "/rpc",
    {
      sessionId: session.snapshot.sessionId,
      method: "execute_unsafe_office_js",
      params: {
        code,
        explanation:
          "Submit a benchmark prompt and wait for the Word runtime to settle.",
      },
      timeoutMs,
    },
    {
      ...reqOpts(cli),
      timeoutMs,
    },
  );

  const loadSessionSnapshot = async (): Promise<BridgeSessionSnapshot> => {
    const sessionResponse = await requestJson<{
      ok: true;
      snapshot: BridgeSessionSnapshot;
    }>(
      "POST",
      sessionPath(sessionId, "/refresh"),
      undefined,
      {
        ...reqOpts(cli),
        timeoutMs,
      },
    );
    return sessionResponse.snapshot;
  };

  const loadRecentEvents = async (): Promise<BridgeStoredEvent[]> => {
    const eventsResponse = await requestJson<{
      ok: true;
      events: BridgeStoredEvent[];
    }>(
      "GET",
      sessionPath(sessionId, "/events?limit=50"),
      undefined,
      {
        ...reqOpts(cli),
        timeoutMs,
      },
    );
    return eventsResponse.events;
  };

  const initialSnapshot = await loadSessionSnapshot();
  const observation = await observePromptRun({
    initialState: initialState as BridgeRuntimeStateSlice | null,
    initialSnapshot,
    timeoutMs,
    loadSnapshot: loadSessionSnapshot,
    loadEvents: loadRecentEvents,
  });
  const completedAt = Date.now();

  const summary = summarizePromptAutomationRun({
    sessionId,
    app: session.snapshot.app,
    documentId: session.snapshot.documentId,
    prompt,
    startedAt,
    completedAt,
    snapshot: observation.snapshot,
    timedOut: observation.timedOut,
  });

  printFormattedJson(summary, cli);
  if (summary.outcome === "error" || summary.outcome === "timed_out") {
    process.exit(1);
  }
}

async function commandExec(cli: Cli) {
  const session = await resolveSession(cli, cli.positionals[1]);
  const code = await loadCode(cli);
  const explanation = str(cli, "explanation");
  const sandbox = flag(cli, "sandbox");

  if (sandbox && !getDefaultRawExecutionTool(session.snapshot.app)) {
    throw new Error(
      `No default raw execution tool for app ${session.snapshot.app}`,
    );
  }

  const response = await requestJson<{
    ok: true;
    result: unknown;
    toolName?: string;
    mode: "unsafe" | "sandbox";
  }>(
    "POST",
    sessionPath(session.snapshot.sessionId, "/exec"),
    { code, explanation, unsafe: !sandbox },
    reqOpts(cli),
  );

  if (response.mode === "sandbox") {
    const summaryError = summarizeExecutionError(response.result);
    if (summaryError)
      console.error(
        `Tool ${response.toolName} reported an error: ${summaryError}`,
      );
  }

  logSavedImages(
    cli,
    await maybeSaveToolImages(response.result, str(cli, "out")),
  );
  printJson(response);
}

async function commandRpc(cli: Cli) {
  // rpc [session] <method>  — method is required (minArgs=1)
  const { session, args } = await splitSessionArgs(
    cli,
    cli.positionals.slice(1),
    1,
  );
  const method = args[0] as BridgeInvokeMethod | undefined;
  if (!method) {
    throw new Error(
      "Usage: office-bridge rpc [session] <method> [--input JSON | --file PATH]",
    );
  }

  const payload = await loadJsonPayload(cli);
  const response = await requestJson<{ ok: true; result: unknown }>(
    "POST",
    "/rpc",
    {
      sessionId: session.snapshot.sessionId,
      method,
      params: payload,
      timeoutMs: int(cli, "timeout", DEFAULT_REQUEST_TIMEOUT_MS),
    },
    reqOpts(cli),
  );
  printJson(response.result);
}

async function commandScreenshot(cli: Cli) {
  const session = await resolveSession(cli, cli.positionals[1]);
  const explanation = str(cli, "explanation");

  let toolName: string;
  let payload: Record<string, unknown> = {};
  let defaultOutputBase: string;

  switch (session.snapshot.app) {
    case "word": {
      toolName = "screenshot_document";
      const pages = str(cli, "pages");
      if (pages) payload.page = Number.parseInt(pages, 10);
      if (explanation) payload.explanation = explanation;
      defaultOutputBase = "word-screenshot.png";
      break;
    }
    case "excel": {
      toolName = "screenshot_range";
      const sheetId = str(cli, "sheet-id");
      const range = str(cli, "range");
      if (!sheetId || !range)
        throw new Error(
          "Excel screenshots require --sheet-id <id> and --range <A1:B2>",
        );
      const parsedSheetId = Number.parseInt(sheetId, 10);
      if (Number.isNaN(parsedSheetId))
        throw new Error(`Invalid --sheet-id: ${sheetId}`);
      payload = { sheetId: parsedSheetId, range };
      if (explanation) payload.explanation = explanation;
      defaultOutputBase = `excel-${range.replaceAll(/[^A-Za-z0-9_-]/g, "_")}.png`;
      break;
    }
    case "powerpoint": {
      toolName = "screenshot_slide";
      const slideIndex = str(cli, "slide-index") || str(cli, "slide");
      if (!slideIndex)
        throw new Error(
          "PowerPoint screenshots require --slide-index <0-based index>",
        );
      const parsedIndex = Number.parseInt(slideIndex, 10);
      if (Number.isNaN(parsedIndex))
        throw new Error(`Invalid --slide-index: ${slideIndex}`);
      payload = { slide_index: parsedIndex };
      if (explanation) payload.explanation = explanation;
      defaultOutputBase = `powerpoint-slide-${parsedIndex}.png`;
      break;
    }
    default:
      throw new Error(
        `Screenshot is not supported for app ${session.snapshot.app}`,
      );
  }

  const timeoutMs = getScreenshotTimeoutMs(
    session.snapshot.app,
    str(cli, "timeout")
      ? int(cli, "timeout", DEFAULT_REQUEST_TIMEOUT_MS)
      : undefined,
  );

  const response = await requestJson<{ ok: true; result: unknown }>(
    "POST",
    "/rpc",
    {
      sessionId: session.snapshot.sessionId,
      method: "execute_tool",
      params: {
        toolName,
        args: payload,
      },
      timeoutMs,
    },
    {
      ...reqOpts(cli),
      timeoutMs,
    },
  );

  const outputPath = str(cli, "out") || defaultOutputBase;
  const savedPaths = await maybeSaveToolImages(response.result, outputPath);
  if (flag(cli, "json")) {
    printJson({ toolName, savedPaths, result: response.result });
    return;
  }
  for (const p of savedPaths) console.log(`Saved screenshot: ${p}`);
}

// ---------------------------------------------------------------------------
// VFS — each subcommand has explicit positional definitions
// ---------------------------------------------------------------------------

async function commandVfs(cli: Cli) {
  const subcommand = cli.positionals[1];
  if (!subcommand)
    throw new Error("Usage: office-bridge vfs <ls|pull|push|rm> [session] ...");

  // Positionals after the subcommand: e.g. `vfs pull word /remote ./local`
  const rest = cli.positionals.slice(2);

  switch (subcommand) {
    case "ls": {
      // ls [session] [prefix]  — 0 required args
      const { session, args } = await splitSessionArgs(cli, rest, 0);
      const prefix = args[0];
      const response = await requestJson<{
        ok: true;
        result: BridgeVfsEntry[];
      }>(
        "POST",
        sessionPath(session.snapshot.sessionId, "/vfs/list"),
        prefix ? { prefix } : {},
        reqOpts(cli),
      );
      if (flag(cli, "json")) {
        printJson(response.result);
        return;
      }
      for (const entry of response.result)
        console.log(`${entry.path}\t${entry.byteLength}`);
      return;
    }
    case "pull": {
      // pull [session] <remotePath> [localPath]  — 1 required arg
      const { session, args } = await splitSessionArgs(cli, rest, 1);
      const remotePath = args[0];
      if (!remotePath)
        throw new Error(
          "Usage: office-bridge vfs pull [session] <remotePath> [localPath]",
        );
      const localPath = args[1] || path.basename(remotePath);

      const response = await requestJson<{
        ok: true;
        result: BridgeVfsReadResult;
      }>(
        "POST",
        sessionPath(session.snapshot.sessionId, "/vfs/read"),
        { path: remotePath, encoding: "base64" },
        reqOpts(cli),
      );
      if (!response.result.dataBase64)
        throw new Error(`No binary data returned for ${remotePath}`);

      await saveFile(
        localPath,
        Buffer.from(response.result.dataBase64, "base64"),
      );
      if (flag(cli, "json")) {
        printJson({
          remotePath,
          localPath,
          byteLength: response.result.byteLength,
        });
        return;
      }
      console.log(
        `Pulled ${remotePath} -> ${localPath} (${response.result.byteLength} bytes)`,
      );
      return;
    }
    case "push": {
      // push [session] <localPath> <remotePath>  — 2 required args
      const { session, args } = await splitSessionArgs(cli, rest, 2);
      const localPath = args[0];
      const remotePath = args[1];
      if (!localPath || !remotePath) {
        throw new Error(
          "Usage: office-bridge vfs push [session] <localPath> <remotePath>",
        );
      }

      const data = await readFile(localPath);
      const response = await requestJson<{ ok: true; result: unknown }>(
        "POST",
        sessionPath(session.snapshot.sessionId, "/vfs/write"),
        { path: remotePath, dataBase64: data.toString("base64") },
        reqOpts(cli),
      );
      if (flag(cli, "json")) {
        printJson(response.result);
        return;
      }
      console.log(`Pushed ${localPath} -> ${remotePath}`);
      return;
    }
    case "rm": {
      // rm [session] <remotePath>  — 1 required arg
      const { session, args } = await splitSessionArgs(cli, rest, 1);
      const remotePath = args[0];
      if (!remotePath)
        throw new Error("Usage: office-bridge vfs rm [session] <remotePath>");

      const response = await requestJson<{ ok: true; result: unknown }>(
        "POST",
        sessionPath(session.snapshot.sessionId, "/vfs/delete"),
        { path: remotePath },
        reqOpts(cli),
      );
      if (flag(cli, "json")) {
        printJson(response.result);
        return;
      }
      console.log(`Deleted ${remotePath}`);
      return;
    }
    default:
      throw new Error(`Unknown vfs subcommand: ${subcommand}`);
  }
}

// ---------------------------------------------------------------------------
// Output formatting helpers
// ---------------------------------------------------------------------------

function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNulls);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(record)) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    result[key] = stripNulls(v);
  }
  return result;
}

function pickFields(value: unknown, fields: string[]): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value))
    return value.map((item) => pickFields(item, fields));
  const record = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in record) result[field] = record[field];
  }
  return result;
}

function formatOutput(value: unknown, cli: Cli): unknown {
  let result = value;
  if (flag(cli, "compact")) result = stripNulls(result);
  const fields = str(cli, "fields");
  if (fields)
    result = pickFields(
      result,
      fields.split(",").map((f) => f.trim()),
    );
  return result;
}

function printFormattedJson(value: unknown, cli: Cli) {
  console.log(
    JSON.stringify(
      serializeForJson(sanitizeImagesForOutput(formatOutput(value, cli))),
      null,
      2,
    ),
  );
}

// DOM_QUERIES imported from dom-queries.ts at top of file

// ---------------------------------------------------------------------------
// New commands
// ---------------------------------------------------------------------------

async function commandState(cli: Cli) {
  const session = await resolveSession(cli, cli.positionals[1]);
  const snapshot = session.snapshot;
  const rs = snapshot.runtimeState;
  if (!rs) {
    console.log("No runtime state available.");
    return;
  }
  if (flag(cli, "compact")) {
    const plan = rs.activePlanSummary;
    const planStr = plan
      ? `plan:step${plan.activeStepIndex + 1}/${plan.stepCount}`
      : "no-plan";
    const tokens = rs.sessionStats.inputTokens + rs.sessionStats.outputTokens;
    console.log(
      `${snapshot.app} | ${rs.mode} | ${rs.taskPhase} | streaming=${rs.isStreaming} | ${planStr} | ${Math.round(tokens / 1000)}k tokens`,
    );
    return;
  }
  printFormattedJson(rs, cli);
}

async function commandPoll(cli: Cli) {
  const session = await resolveSession(cli, cli.positionals[1]);
  const intervalMs = int(cli, "interval", 2000);
  const eventsFilter = str(cli, "events");
  const allowedTypes = eventsFilter
    ? new Set(eventsFilter.split(",").map((t) => t.trim()))
    : null;

  const sseUrl = `${baseUrl(cli)}/sessions/${encodeURIComponent(session.snapshot.sessionId)}/events/stream${eventsFilter ? `?events=${encodeURIComponent(eventsFilter)}` : ""}`;

  let useSSE = true;
  try {
    const https = await import("node:https");
    const sseUrlObj = new URL(sseUrl);
    await new Promise<void>((resolve, reject) => {
      const req = https.request(
        sseUrlObj,
        {
          method: "GET",
          rejectUnauthorized: false,
          headers: { Accept: "text/event-stream" },
        },
        (res) => {
          if (
            res.statusCode === 200 &&
            res.headers["content-type"]?.includes("text/event-stream")
          ) {
            res.on("data", (chunk: Buffer) => {
              const lines = chunk.toString("utf8").split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6).trim();
                  if (data) console.log(data);
                }
              }
            });
            res.on("end", () => resolve());
            res.on("error", () => resolve());
          } else {
            useSSE = false;
            res.destroy();
            reject(new Error("SSE not available"));
          }
        },
      );
      req.on("error", () => {
        useSSE = false;
        reject(new Error("SSE not available"));
      });
      req.end();

      process.on("SIGINT", () => {
        req.destroy();
        process.exit(0);
      });
      process.on("SIGTERM", () => {
        req.destroy();
        process.exit(0);
      });
    });
  } catch {
    useSSE = false;
  }

  if (!useSSE) {
    let lastEventId: string | undefined;
    const poll = async () => {
      const response = await requestJson<{
        ok: true;
        events: BridgeStoredEvent[];
      }>(
        "GET",
        sessionPath(session.snapshot.sessionId, "/events?limit=50"),
        undefined,
        reqOpts(cli),
      );
      const events = response.events;
      let startIdx = 0;
      if (lastEventId) {
        const idx = events.findIndex((e) => e.id === lastEventId);
        if (idx >= 0) startIdx = idx + 1;
      }
      for (let i = startIdx; i < events.length; i++) {
        const evt = events[i];
        if (allowedTypes && !allowedTypes.has(evt.event)) continue;
        console.log(JSON.stringify(evt));
        lastEventId = evt.id;
      }
    };

    process.on("SIGINT", () => process.exit(0));
    process.on("SIGTERM", () => process.exit(0));

    while (true) {
      await poll();
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}

async function commandAssert(cli: Cli) {
  const session = await resolveSession(cli, cli.positionals[1]);
  const rs = session.snapshot.runtimeState;
  if (!rs) {
    console.error("No runtime state available");
    process.exit(1);
  }

  const mismatches: string[] = [];
  const expectedMode = str(cli, "mode");
  if (expectedMode && rs.mode !== expectedMode) {
    mismatches.push(`mode: expected "${expectedMode}", got "${rs.mode}"`);
  }
  const expectedPhase = str(cli, "phase");
  if (expectedPhase && rs.taskPhase !== expectedPhase) {
    mismatches.push(
      `taskPhase: expected "${expectedPhase}", got "${rs.taskPhase}"`,
    );
  }
  const expectedStreaming = str(cli, "streaming");
  if (expectedStreaming !== undefined) {
    const expected = expectedStreaming === "true";
    if (rs.isStreaming !== expected) {
      mismatches.push(
        `isStreaming: expected ${expected}, got ${rs.isStreaming}`,
      );
    }
  }

  if (mismatches.length > 0) {
    for (const m of mismatches) console.error(m);
    process.exit(1);
  }
  console.log("All assertions passed.");
}

async function commandBench(cli: Cli) {
  const { session, args } = await splitSessionArgs(
    cli,
    cli.positionals.slice(1),
    1,
  );
  const toolName = args[0];
  if (!toolName) {
    throw new Error(
      "Usage: office-bridge bench [session] <toolName> [--runs N]",
    );
  }
  const runs = int(cli, "runs", 5);
  const timings: number[] = [];
  let errors = 0;

  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    try {
      await requestJson(
        "POST",
        sessionPath(
          session.snapshot.sessionId,
          `/tools/${encodeURIComponent(toolName)}`,
        ),
        { args: {} },
        reqOpts(cli),
      );
    } catch {
      errors++;
    }
    timings.push(performance.now() - start);
  }

  const validTimings = timings;
  const min = Math.min(...validTimings);
  const max = Math.max(...validTimings);
  const avg = validTimings.reduce((a, b) => a + b, 0) / validTimings.length;

  printJson({
    toolName,
    runs,
    min: Math.round(min * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    max: Math.round(max * 100) / 100,
    errors,
  });
}

async function commandSummary(cli: Cli) {
  const session = await resolveSession(cli, cli.positionals[1]);
  const rs = session.snapshot.runtimeState;
  if (!rs) {
    console.log(`${session.snapshot.app} | no runtime state`);
    return;
  }
  const plan = rs.activePlanSummary;
  const planStr = plan
    ? `plan:step${plan.activeStepIndex + 1}/${plan.stepCount}`
    : "no-plan";
  const tokens = rs.sessionStats.inputTokens + rs.sessionStats.outputTokens;
  const cost = rs.sessionStats.totalCost;
  const toolCount = session.snapshot.tools.length;
  const streamStr = rs.isStreaming ? "streaming" : "idle";
  console.log(
    `${session.snapshot.app} | ${streamStr} | ${planStr} | ${Math.round(tokens / 1000)}k tokens | $${cost.toFixed(2)} | ${toolCount} tools`,
  );
}

async function commandDiag(cli: Cli) {
  const session = await resolveSession(cli, cli.positionals[1]);
  const id = session.snapshot.sessionId;

  const [inspectRes, eventsRes] = await Promise.all([
    requestJson<{ ok: true; session: BridgeSessionRecord }>(
      "GET",
      sessionPath(id),
      undefined,
      reqOpts(cli),
    ),
    requestJson<{ ok: true; events: BridgeStoredEvent[] }>(
      "GET",
      sessionPath(id, "/events?limit=50"),
      undefined,
      reqOpts(cli),
    ),
  ]);

  printFormattedJson(
    {
      session: inspectRes.session,
      events: eventsRes.events,
      runtimeState: session.snapshot.runtimeState ?? null,
    },
    cli,
  );
}

async function commandDom(cli: Cli) {
  const { session, args } = await splitSessionArgs(
    cli,
    cli.positionals.slice(1),
    1,
  );
  const query = args[0];
  if (!query) {
    throw new Error(
      `Usage: office-bridge dom [session] <query>\nSupported queries: ${Object.keys(DOM_QUERIES).join(", ")}`,
    );
  }
  const queryDef = DOM_QUERIES[query];
  if (!queryDef) {
    throw new Error(
      `Unknown DOM query: ${query}. Supported: ${Object.keys(DOM_QUERIES).join(", ")}`,
    );
  }

  const response = await requestJson<{ ok: true; result: unknown }>(
    "POST",
    sessionPath(session.snapshot.sessionId, "/exec"),
    { code: queryDef.code, unsafe: true },
    reqOpts(cli),
  );
  printFormattedJson(response.result, cli);
}

async function commandReset(cli: Cli) {
  const session = await resolveSession(cli, cli.positionals[1]);
  const keepConfig = flag(cli, "keep-config");
  const timeoutMs = int(cli, "timeout", DEFAULT_PROMPT_TIMEOUT_MS);

  const code = keepConfig
    ? `
      const preservePatterns = [/-provider-config$/, /-oauth-credentials$/];
      const keysToKeep = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && preservePatterns.some(p => p.test(key))) {
          keysToKeep[key] = localStorage.getItem(key);
        }
      }
      localStorage.clear();
      for (const [key, value] of Object.entries(keysToKeep)) {
        localStorage.setItem(key, value);
      }
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
      return { cleared: true, preservedKeys: Object.keys(keysToKeep) };
    `
    : `
      localStorage.clear();
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
      return { cleared: true, preservedKeys: [] };
    `;

  const response = await requestJson<{ ok: true; result: unknown }>(
    "POST",
    sessionPath(session.snapshot.sessionId, "/exec"),
    { code, unsafe: true },
    {
      ...reqOpts(cli),
      timeoutMs,
    },
  );
  console.log(
    `Reset complete for ${session.snapshot.app}.${keepConfig ? " Config keys preserved." : ""}`,
  );
  if (flag(cli, "json")) printJson(response.result);
}

async function commandScreenshotDiff(cli: Cli) {
  const img1Path = cli.positionals[1];
  const img2Path = cli.positionals[2];
  if (!img1Path || !img2Path) {
    throw new Error(
      "Usage: office-bridge screenshot-diff <img1> <img2> [--threshold 0.95]",
    );
  }

  const threshold = Number.parseFloat(str(cli, "threshold") || "0.95");
  const [buf1, buf2] = await Promise.all([
    readFile(img1Path),
    readFile(img2Path),
  ]);

  const totalPixels = Math.max(buf1.length, buf2.length);
  const compareLength = Math.min(buf1.length, buf2.length);
  let matchingBytes = 0;

  for (let i = 0; i < compareLength; i++) {
    if (buf1[i] === buf2[i]) matchingBytes++;
  }

  const similarity = totalPixels > 0 ? matchingBytes / totalPixels : 1;
  const diffPixels = totalPixels - matchingBytes;

  printJson({
    similarity: Math.round(similarity * 10000) / 10000,
    diffPixels,
    totalPixels,
    passed: similarity >= threshold,
  });
}

// ---------------------------------------------------------------------------
// Main dispatch
// ---------------------------------------------------------------------------

const COMMANDS: Record<string, (cli: Cli) => Promise<void>> = {
  serve: commandServe,
  stop: commandStop,
  list: commandList,
  wait: commandWait,
  inspect: commandInspect,
  metadata: commandMetadata,
  events: commandEvents,
  prompt: commandPrompt,
  tool: commandTool,
  exec: commandExec,
  rpc: commandRpc,
  screenshot: commandScreenshot,
  vfs: commandVfs,
  state: commandState,
  poll: commandPoll,
  assert: commandAssert,
  bench: commandBench,
  summary: commandSummary,
  diag: commandDiag,
  dom: commandDom,
  reset: commandReset,
  "screenshot-diff": commandScreenshotDiff,
};

async function main() {
  const cli = parseCli();
  const command = cli.positionals[0];

  if (!command || command === "help" || flag(cli, "help")) {
    printUsage();
    return;
  }

  const handler = COMMANDS[command];
  if (!handler) throw new Error(`Unknown command: ${command}`);
  await handler(cli);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
