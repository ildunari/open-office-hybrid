import { describe, expect, it } from "vitest";
import {
  buildPromptExecCode,
  hasPromptStarted,
  isPromptSettled,
  summarizePromptOutcome,
} from "../src/prompt-automation";
import type { BridgeRuntimeStateSlice, BridgeStoredEvent } from "../src/protocol";

function makeState(
  overrides: Partial<BridgeRuntimeStateSlice> = {},
): BridgeRuntimeStateSlice {
  return {
    mode: "discuss",
    taskPhase: "discuss",
    isStreaming: false,
    permissionMode: "full_auto",
    waitingState: null,
    activePlanSummary: null,
    activeTaskSummary: null,
    contextBudget: { usagePct: 0, action: "none" },
    lastVerification: null,
    sessionStats: {
      inputTokens: 0,
      outputTokens: 0,
      totalCost: 0,
      messageCount: 0,
    },
    error: null,
    threadCount: 1,
    activeThreadId: null,
    degradedGuardrails: [],
    ...overrides,
  };
}

function makeEvent(event: string): BridgeStoredEvent {
  return {
    id: `${event}-1`,
    event,
    ts: Date.now(),
    payload: {},
  };
}

describe("prompt automation helpers", () => {
  it("builds unsafe exec code that targets the benchmark chat helper", () => {
    const code = buildPromptExecCode("Run the benchmark");
    expect(code).toContain("__OFFICE_CHAT__");
    expect(code).toContain("submitPrompt");
    expect(code).toContain("getSnapshot");
    expect(code).toContain("already streaming");
    expect(code).toContain("Run the benchmark");
  });

  it("detects prompt start from streaming, message growth, or lifecycle events", () => {
    expect(
      hasPromptStarted(makeState(), makeState({ isStreaming: true }), []),
    ).toBe(true);
    expect(
      hasPromptStarted(
        makeState(),
        makeState({ sessionStats: { inputTokens: 0, outputTokens: 0, totalCost: 0, messageCount: 2 } }),
        [],
      ),
    ).toBe(true);
    expect(
      hasPromptStarted(makeState(), makeState(), [makeEvent("message:created")]),
    ).toBe(true);
  });

  it("detects settled prompt states once work has started", () => {
    expect(isPromptSettled(true, makeState({ isStreaming: false }))).toBe(true);
    expect(
      isPromptSettled(true, makeState({ isStreaming: true, taskPhase: "execute" })),
    ).toBe(false);
  });

  it("summarizes final prompt outcomes", () => {
    expect(summarizePromptOutcome(makeState())).toBe("completed");
    expect(
      summarizePromptOutcome(
        makeState({ mode: "awaiting_approval", taskPhase: "waiting_on_user" }),
      ),
    ).toBe("waiting_on_user");
    expect(summarizePromptOutcome(makeState({ mode: "blocked" }))).toBe("blocked");
  });
});
