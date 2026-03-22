import type {
  BridgeRuntimeStateSlice,
  BridgeStoredEvent,
} from "./protocol.js";

export interface PromptSubmissionResult {
  submittedAt: number;
  activeThreadId: string | null;
}

export interface PromptObservationResult {
  snapshot: unknown;
  state: BridgeRuntimeStateSlice | null;
  events: BridgeStoredEvent[];
  started: boolean;
  timedOut: boolean;
}

interface PromptObservationInput {
  initialState: BridgeRuntimeStateSlice | null | undefined;
  initialSnapshot: unknown;
  timeoutMs: number;
  pollIntervalMs?: number;
  loadSnapshot: () => Promise<unknown>;
  loadEvents: () => Promise<BridgeStoredEvent[]>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

export function extractRuntimeState(
  snapshot: unknown,
): BridgeRuntimeStateSlice | null {
  const record = asRecord(snapshot);
  const runtimeState = asRecord(record?.runtimeState);
  return runtimeState
    ? (runtimeState as unknown as BridgeRuntimeStateSlice)
    : null;
}

export function buildPromptExecCode(
  prompt: string,
  attachments?: string[],
): string {
  return `
const helper = globalThis.__OFFICE_CHAT__;
if (
  !helper ||
  typeof helper.submitPrompt !== "function" ||
  typeof helper.getSnapshot !== "function"
) {
  throw new Error("Benchmark chat helper is unavailable. Reload the taskpane in dev mode.");
}
const before = helper.getSnapshot();
if (before?.isStreaming) {
  throw new Error(
    "Session is already streaming. Wait for the current run to finish before submitting another prompt.",
  );
}
return helper.submitPrompt(${JSON.stringify(prompt)}, ${JSON.stringify(attachments ?? [])});
`;
}

function dedupeEvents(
  current: BridgeStoredEvent[],
  seenIds: Set<string>,
): BridgeStoredEvent[] {
  const next: BridgeStoredEvent[] = [];
  for (const event of current) {
    if (seenIds.has(event.id)) continue;
    seenIds.add(event.id);
    next.push(event);
  }
  return next;
}

export function hasPromptStarted(
  initialState: BridgeRuntimeStateSlice | null | undefined,
  nextState: BridgeRuntimeStateSlice | null | undefined,
  events: BridgeStoredEvent[],
): boolean {
  if (!nextState) return false;
  if (nextState.isStreaming) return true;

  const initialMessageCount = initialState?.sessionStats.messageCount ?? 0;
  if (nextState.sessionStats.messageCount > initialMessageCount) return true;

  return events.some((event) =>
    [
      "message:created",
      "message:completed",
      "plan:created",
      "plan:completed",
      "tool:started",
      "tool:completed",
      "tool:failed",
      "state:mode_changed",
      "state:phase_changed",
      "approval:requested",
    ].includes(event.event),
  );
}

export function isPromptSettled(
  started: boolean,
  state: BridgeRuntimeStateSlice | null | undefined,
): boolean {
  if (!started || !state) return false;
  if (state.isStreaming) return false;
  return !["execute", "planning", "executing"].includes(state.taskPhase);
}

export function summarizePromptOutcome(
  state: BridgeRuntimeStateSlice | null | undefined,
): "completed" | "waiting_on_user" | "blocked" | "timed_out" | "unknown" {
  if (!state) return "unknown";
  if (state.mode === "awaiting_approval" || state.taskPhase === "waiting_on_user") {
    return "waiting_on_user";
  }
  if (state.mode === "blocked") return "blocked";
  if (!state.isStreaming) return "completed";
  return "unknown";
}

export async function observePromptRun(
  input: PromptObservationInput,
): Promise<PromptObservationResult> {
  const pollIntervalMs = input.pollIntervalMs ?? 750;
  const deadline = Date.now() + input.timeoutMs;
  const seenEventIds = new Set<string>();
  let snapshot = input.initialSnapshot;
  let state = extractRuntimeState(snapshot);
  let started = false;
  const collectedEvents: BridgeStoredEvent[] = [];

  while (true) {
    const currentEvents = dedupeEvents(await input.loadEvents(), seenEventIds);
    if (currentEvents.length > 0) {
      collectedEvents.push(...currentEvents);
    }

    if (!started) {
      started = hasPromptStarted(input.initialState, state, currentEvents);
    }

    if (isPromptSettled(started, state)) {
      return {
        snapshot,
        state,
        events: collectedEvents,
        started,
        timedOut: false,
      };
    }

    if (Date.now() >= deadline) {
      return {
        snapshot,
        state,
        events: collectedEvents,
        started,
        timedOut: true,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    snapshot = await input.loadSnapshot();
    state = extractRuntimeState(snapshot);
  }
}
