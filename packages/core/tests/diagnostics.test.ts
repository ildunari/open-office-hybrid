import { describe, expect, it } from "vitest";
import { buildDiagnosticsModel } from "../src/chat/diagnostics";
import { readFileSync } from "node:fs";
import path from "node:path";

const corpusScenarios = JSON.parse(
  readFileSync(
    path.join(
      __dirname,
      "../../sdk/tests/fixtures/docx-corpus/docx-corpus.scenarios.json",
    ),
    "utf8",
  ),
) as {
  scenarios: Array<{
    file: string;
    stressArea: string;
    request: string;
  }>;
};

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

  it("trims crowded diagnostics collections to the latest policy trace entries and first completion artifacts", () => {
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
      instructionSources: [],
      policyTrace: Array.from({ length: 8 }, (_, index) => ({
        id: `trace-${index + 1}`,
        event: "policy_check" as const,
        outcome: "allowed" as const,
        reason: `reason-${index + 1}`,
        capabilityMode: "standard" as const,
        approvalMode: "confirm_risky" as const,
        at: index + 1,
      })),
      activeHookNames: [],
      activePatternMetadata: [],
      activeVerifierIds: [],
      threads: [],
      activeThreadId: null,
      compactionState: null,
      completionArtifacts: Array.from({ length: 7 }, (_, index) => ({
        id: `artifact-${index + 1}`,
        threadId: "thread-1",
        taskId: `task-${index + 1}`,
        summary: `artifact-${index + 1}`,
        verificationStatus: "passed" as const,
        changedScopes: [],
        createdAt: index + 1,
      })),
      lastVerification: null,
    });

    expect(model.recentPolicyTrace).toHaveLength(6);
    expect(model.recentPolicyTrace.map((trace) => trace.id)).toEqual([
      "trace-8",
      "trace-7",
      "trace-6",
      "trace-5",
      "trace-4",
      "trace-3",
    ]);
    expect(model.completionArtifacts).toHaveLength(5);
    expect(model.completionArtifacts.map((artifact) => artifact.id)).toEqual([
      "artifact-1",
      "artifact-2",
      "artifact-3",
      "artifact-4",
      "artifact-5",
    ]);
  });

  it("handles corpus-derived crowded diagnostics summaries without disturbing selection and ordering", () => {
    const longSummaries = corpusScenarios.scenarios.map((scenario, index) => ({
      id: `source-${index + 1}`,
      kind: "document_memory" as const,
      label: scenario.file,
      precedence: index,
      summary: `${scenario.stressArea}: ${scenario.request}`,
    }));

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
      instructionSources: longSummaries,
      policyTrace: [],
      activeHookNames: [],
      activePatternMetadata: [],
      activeVerifierIds: [],
      threads: [],
      activeThreadId: null,
      compactionState: null,
      completionArtifacts: [],
      lastVerification: null,
    });

    expect(model.instructionSources).toHaveLength(corpusScenarios.scenarios.length);
    expect(model.instructionSources[0]?.label).toBe("comments.docx");
    expect(model.instructionSources.at(-1)?.label).toBe("toc.docx");
  });
});
