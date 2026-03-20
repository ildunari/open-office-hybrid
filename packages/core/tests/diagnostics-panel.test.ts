import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import DiagnosticsPanel from "../src/chat/diagnostics-panel.svelte";

describe("DiagnosticsPanel", () => {
  it("renders live diagnostics fields when expanded", () => {
    const { body } = render(DiagnosticsPanel, {
      props: {
        initiallyExpanded: true,
        runtimeState: {
          permissionMode: "confirm_risky",
          capabilityBoundary: {
            mode: "standard",
            blockedActionClasses: [],
            description: "normal host work",
          },
          approvalPolicy: {
            mode: "confirm_risky",
            description: "pause on risky work",
          },
          instructionSources: [
            {
              id: "app",
              kind: "app_global",
              label: "App-global",
              precedence: 0,
              summary: "shared rules",
            },
          ],
          policyTrace: [
            {
              id: "trace-1",
              event: "policy_check",
              outcome: "approval_required",
              reason: "needs approval",
              capabilityMode: "standard",
              approvalMode: "confirm_risky",
              at: Date.now(),
            },
          ],
          activeHookNames: ["hook-a"],
          activePatternMetadata: [{ id: "pattern-a", reason: "reason" }],
          activeVerifierIds: ["verifier-a"],
          threads: [
            {
              id: "thread-1",
              title: "Main thread",
              status: "active",
              rootTaskId: null,
              currentTaskId: null,
              forkedFromThreadId: null,
              compactedSummary: null,
              milestoneIds: [],
              updatedAt: Date.now(),
            },
          ],
          activeThreadId: "thread-1",
          compactionState: {
            artifactCount: 1,
            lastCompactedThreadId: "thread-old",
            updatedAt: Date.now(),
          },
          completionArtifacts: [
            {
              id: "artifact-1",
              threadId: "thread-1",
              taskId: "task-1",
              summary: "Completed safely",
              verificationStatus: "passed",
              changedScopes: ["slide 1"],
              createdAt: Date.now(),
            },
          ],
          lastVerification: {
            status: "passed",
            retryable: false,
            results: [],
          },
        },
      },
    });

    expect(body).toContain("diagnostics");
    expect(body).toContain("App-global");
    expect(body).toContain("approval_required");
    expect(body).toContain("hook-a");
    expect(body).toContain("pattern-a");
    expect(body).toContain("verifier-a");
    expect(body).toContain("Main thread");
    expect(body).toContain("Completed safely");
  });
});
