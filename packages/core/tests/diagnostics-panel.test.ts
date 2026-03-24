import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import DiagnosticsPanel from "../src/chat/diagnostics-panel.svelte";

describe("DiagnosticsPanel", () => {
  it("renders live diagnostics fields when expanded", () => {
    const { body } = render(DiagnosticsPanel, {
      props: {
        initiallyExpanded: true,
        runtimeState: {
          mode: "blocked",
          taskPhase: "blocked",
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
          waitingState: {
            kind: "retry_exhausted",
            reason: "Verification follow-up required",
            resumeMessage: "Resume after rereading the edited paragraph.",
            createdAt: Date.now(),
          },
          handoff: {
            taskId: "task-1",
            mode: "execute",
            currentIntent: "Update the grant summary",
            constraints: [],
            incompleteVerifications: ["word-reread"],
            nextRecommendedAction:
              "Resume after rereading the edited paragraph.",
            summary:
              "Verification is blocked on a missing reread of the edited paragraph.",
            updatedAt: Date.now(),
          },
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
            status: "retryable",
            retryable: true,
            results: [],
          },
          degradedGuardrails: [
            "Verification failed after 2 resume attempts; completing with degraded guardrails.",
          ],
          promptProvenance: {
            providerFamily: "gpt",
            provider: "openai",
            model: "gpt-5",
            apiType: "default",
            phase: "mutation",
            runtimeNotes: [
              "Reread the edited paragraph before reporting completion.",
            ],
            contributors: [
              {
                id: "source-system",
                kind: "system_prompt",
                label: "System prompt",
                order: 0,
                summary: "Word host system prompt",
              },
              {
                id: "source-doctrine",
                kind: "local_doctrine",
                label: "Local doctrine",
                order: 1,
                summary:
                  "gpt-prompt-architect, word-mastery-v3, openword-best-practices",
              },
            ],
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
    expect(body).toContain("runtime truth");
    expect(body).toContain("retry_exhausted");
    expect(body).toContain("Verification follow-up required");
    expect(body).toContain(
      "Verification is blocked on a missing reread of the edited paragraph.",
    );
    expect(body).toContain("Resume after rereading the edited paragraph.");
    expect(body).toContain("retryable");
    expect(body).toContain(
      "Verification failed after 2 resume attempts; completing with degraded guardrails.",
    );
    expect(body).toContain("prompt provenance");
    expect(body).toContain("openai / gpt-5");
    expect(body).toContain("mutation");
    expect(body).toContain(
      "gpt-prompt-architect, word-mastery-v3, openword-best-practices",
    );
    expect(body).toContain(
      "Reread the edited paragraph before reporting completion.",
    );
  });
});
