import { describe, expect, it } from "vitest";
import type {
  BridgeRuntimeStateSlice,
  BridgeSessionSnapshot,
} from "../src/protocol";
import { buildSessionSummaryLine } from "../src/session-summary";

function createSnapshot(
  overrides: Partial<BridgeSessionSnapshot> = {},
): BridgeSessionSnapshot {
  const now = Date.now();
  return {
    sessionId: "word:hybrid-doc-1",
    instanceId: "instance-1",
    app: "word",
    appName: "OpenWord Hybrid",
    appVersion: "1.2.3",
    metadataTag: "doc_context",
    documentId: "hybrid-doc-1",
    documentMetadata: {},
    tools: [{ name: "get_document_text" }, { name: "execute_office_js" }],
    host: {
      href: "https://localhost:3003/taskpane.html",
      title: "OpenWord Hybrid",
    },
    connectedAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createRuntimeState(
  overrides: Partial<BridgeRuntimeStateSlice> = {},
): BridgeRuntimeStateSlice {
  return {
    mode: "execute",
    taskPhase: "execute",
    isStreaming: true,
    permissionMode: "confirm_risky",
    waitingState: null,
    waitingReason: null,
    handoffSummary: null,
    nextRecommendedAction: null,
    activePlanSummary: {
      id: "plan-1",
      status: "in_progress",
      stepCount: 3,
      activeStepIndex: 1,
    },
    activeTaskSummary: {
      id: "task-1",
      status: "in_progress",
      mode: "execute",
      toolExecutionCount: 4,
    },
    contextBudget: { usagePct: 0.42, action: "continue" },
    lastVerification: null,
    latestCompletion: null,
    sessionStats: {
      inputTokens: 1200,
      outputTokens: 800,
      totalCost: 0.03,
      messageCount: 6,
    },
    error: null,
    threadCount: 1,
    activeThreadId: "thread-1",
    degradedGuardrails: [],
    promptProvenance: null,
    ...overrides,
  };
}

describe("buildSessionSummaryLine", () => {
  it("makes the Hybrid target identity explicit in the summary", () => {
    const summary = buildSessionSummaryLine(
      createSnapshot({
        runtimeState: createRuntimeState({
          promptProvenance: {
            providerFamily: "gpt",
            provider: "openai",
            model: "gpt-5",
            phase: "mutation",
            contributorCount: 5,
            doctrineIds: [
              "gpt-prompt-architect",
              "word-mastery-v3",
              "openword-best-practices",
            ],
            runtimeNotes: [],
          },
        }),
      }),
    );

    expect(summary).toContain("OpenWord Hybrid");
    expect(summary).toContain("doc:hybrid-doc-1");
    expect(summary).toContain("session:word:hybrid-doc-1");
    expect(summary).toContain("target:https://localhost:3003/taskpane.html");
    expect(summary).toContain("plan:step2/3");
    expect(summary).toContain("prompt:gpt/mutation/5");
  });

  it("surfaces blocked and degraded truth instead of stale plan progress", () => {
    const summary = buildSessionSummaryLine(
      createSnapshot({
        runtimeState: createRuntimeState({
          mode: "blocked",
          taskPhase: "blocked",
          isStreaming: false,
          activePlanSummary: {
            id: "plan-1",
            status: "in_progress",
            stepCount: 3,
            activeStepIndex: 2,
          },
          waitingState: "retry_exhausted",
          waitingReason: "Verification follow-up required",
          handoffSummary:
            "Document verification is blocked on a missing reread.",
          nextRecommendedAction: "Resume after rereading the edited paragraph.",
          lastVerification: { status: "retryable", retryable: true },
          degradedGuardrails: [
            "Verification failed after 2 resume attempts; completing with degraded guardrails.",
          ],
        }),
      }),
    );

    expect(summary).toContain("blocked");
    expect(summary).toContain("waiting:retry_exhausted");
    expect(summary).toContain("verify:retryable");
    expect(summary).toContain("degraded:1");
    expect(summary).toContain(
      "next:Resume after rereading the edited paragraph.",
    );
    expect(summary).toContain("plan:in_progress");
  });

  it("prefers completion truth over an old active plan step", () => {
    const summary = buildSessionSummaryLine(
      createSnapshot({
        runtimeState: createRuntimeState({
          mode: "completed",
          taskPhase: "completed",
          isStreaming: false,
          activePlanSummary: {
            id: "plan-1",
            status: "completed",
            stepCount: 3,
            activeStepIndex: -1,
          },
          lastVerification: { status: "passed", retryable: false },
          latestCompletion: {
            summary:
              "Updated the grant summary and reread the edited paragraph.",
            verificationStatus: "passed",
          },
        }),
      }),
    );

    expect(summary).toContain("completed");
    expect(summary).toContain(
      "completion:Updated the grant summary and reread the edited paragraph.",
    );
    expect(summary).toContain("verify:passed");
    expect(summary).toContain("plan:completed");
  });
});
