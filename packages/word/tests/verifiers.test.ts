import { describe, expect, it } from "vitest";
import {
  buildWordHandoffSummary,
  detectRevisionSensitiveRequest,
  estimateWordScopeRisk,
  getWordVerificationSuites,
} from "../src/lib/verifiers";

describe("word verifier helpers", () => {
  it("detects revision-sensitive requests", () => {
    expect(
      detectRevisionSensitiveRequest("Redline this contract and track changes."),
    ).toBe(true);
    expect(detectRevisionSensitiveRequest("Rewrite the intro only.")).toBe(
      false,
    );
  });

  it("escalates destructive or revision-sensitive work to approval", () => {
    const risk = estimateWordScopeRisk("Replace all clauses and redline it.", {
      complexity: "moderate",
      risk: "medium",
      needsPlan: true,
      rationale: "Mutation-heavy",
    });

    expect(risk.requiresApproval).toBe(true);
    expect(risk.level).toBe("high");
  });

  it("builds a useful Word handoff summary", () => {
    const summary = buildWordHandoffSummary({
      id: "task-1",
      userRequest: "Rewrite this section but preserve the 45 day deadline.",
      status: "failed",
      scopeSummary: "section 3",
      toolCallIds: [],
      createdAt: 1,
      updatedAt: 1,
    });

    expect(summary).toContain("section 3");
    expect(summary).toContain("45 day");
  });

  it("returns passing or retryable verification results for formatting/coherence suites", async () => {
    const suites = getWordVerificationSuites();
    const formatSuite = suites.find((suite) => suite.id === "word:format-preserved");
    const coherenceSuite = suites.find(
      (suite) => suite.id === "word:coherence-reread",
    );

    expect(
      await formatSuite?.verify({
        mode: "verify",
        request: "Rewrite the section and preserve formatting.",
        plan: null,
        task: null,
        toolExecutions: [
          {
            toolCallId: "tc-1",
            toolName: "execute_office_js",
            isError: false,
            resultText: "ok",
            timestamp: 1,
          },
        ],
        promptNotes: [],
      }),
    ).toEqual(
      expect.objectContaining({
        status: "passed",
      }),
    );

    expect(
      await coherenceSuite?.verify({
        mode: "verify",
        request: "Update the introduction section.",
        plan: null,
        task: null,
        toolExecutions: [],
        promptNotes: [],
      }),
    ).toEqual(
      expect.objectContaining({
        status: "retryable",
      }),
    );
  });
});
