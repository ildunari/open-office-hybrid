import { describe, expect, it } from "vitest";
import { buildDiagnosticsModel } from "../src/chat/diagnostics";

describe("buildDiagnosticsModel", () => {
  it("selects the active thread and sorts diagnostic collections predictably", () => {
    const model = buildDiagnosticsModel({
      permissionMode: "confirm_risky",
      capabilityBoundary: {
        mode: "standard",
        blockedActionClasses: [],
        description: "normal",
      },
      approvalPolicy: {
        mode: "confirm_risky",
        description: "ask on risky work",
      },
      instructionSources: [
        {
          id: "session",
          kind: "session_memory",
          label: "Session",
          precedence: 3,
          summary: "session summary",
        },
        {
          id: "global",
          kind: "app_global",
          label: "Global",
          precedence: 0,
          summary: "global summary",
        },
      ],
      policyTrace: [
        {
          id: "trace-1",
          event: "task_completed",
          outcome: "allowed",
          reason: "done",
          capabilityMode: "standard",
          approvalMode: "confirm_risky",
          at: 10,
        },
        {
          id: "trace-2",
          event: "policy_check",
          outcome: "approval_required",
          reason: "check",
          capabilityMode: "standard",
          approvalMode: "confirm_risky",
          at: 20,
        },
      ],
      activeHookNames: ["zeta", "alpha"],
      activePatternMetadata: [{ id: "pattern-a", reason: "test" }],
      activeVerifierIds: ["verifier-b", "verifier-a"],
      threads: [
        {
          id: "thread-1",
          title: "Main",
          status: "active",
          rootTaskId: null,
          currentTaskId: null,
          forkedFromThreadId: null,
          compactedSummary: null,
          milestoneIds: [],
          updatedAt: 1,
        },
        {
          id: "thread-2",
          title: "Alt",
          status: "compacted",
          rootTaskId: null,
          currentTaskId: null,
          forkedFromThreadId: "thread-1",
          compactedSummary: "archived",
          milestoneIds: [],
          updatedAt: 2,
        },
      ],
      activeThreadId: "thread-1",
      compactionState: {
        artifactCount: 2,
        lastCompactedThreadId: "thread-2",
        updatedAt: 30,
      },
      completionArtifacts: [
        {
          id: "artifact-1",
          threadId: "thread-1",
          taskId: "task-1",
          summary: "Completed safely",
          verificationStatus: "passed",
          changedScopes: ["slide 1"],
          createdAt: 40,
        },
      ],
      lastVerification: {
        status: "passed",
        retryable: false,
        results: [],
      },
    });

    expect(model.activeThread?.id).toBe("thread-1");
    expect(model.otherThreads.map((thread) => thread.id)).toEqual(["thread-2"]);
    expect(model.instructionSources.map((source) => source.id)).toEqual([
      "global",
      "session",
    ]);
    expect(model.activeHooks).toEqual(["alpha", "zeta"]);
    expect(model.activeVerifierIds).toEqual(["verifier-a", "verifier-b"]);
    expect(model.recentPolicyTrace.map((trace) => trace.id)).toEqual([
      "trace-2",
      "trace-1",
    ]);
  });
});
