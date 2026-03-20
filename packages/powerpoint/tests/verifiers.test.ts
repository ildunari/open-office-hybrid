import { describe, expect, it } from "vitest";
import {
  buildPowerPointHandoffSummary,
  estimatePowerPointScopeRisk,
  getPowerPointVerificationSuites,
} from "../src/lib/verifiers";

describe("PowerPoint verifier helpers", () => {
  it("escalates master and theme edits to approval", () => {
    const risk = estimatePowerPointScopeRisk(
      "Replace the slide master theme across the entire deck.",
      {
        complexity: "complex",
        risk: "medium",
        needsPlan: true,
        rationale: "Deck-wide theme mutation",
      },
    );

    expect(risk.requiresApproval).toBe(true);
    expect(risk.level).toBe("high");
    expect(risk.scopeSummary).toContain("master");
  });

  it("builds a useful PowerPoint handoff summary", () => {
    const summary = buildPowerPointHandoffSummary({
      id: "task-1",
      userRequest: "Tighten slide 4 so the text fits and verify layout.",
      status: "failed",
      scopeSummary: "slide 4",
      toolCallIds: [],
      createdAt: 1,
      updatedAt: 1,
    });

    expect(summary).toContain("slide 4");
    expect(summary).toContain("verify layout");
  });

  it("returns failing, passing, and retryable results for the new PowerPoint suites", async () => {
    const suites = getPowerPointVerificationSuites();
    const layoutSuite = suites.find(
      (suite) => suite.id === "powerpoint:layout-verification",
    );
    const templateSuite = suites.find(
      (suite) => suite.id === "powerpoint:template-preservation",
    );
    const chartSuite = suites.find(
      (suite) => suite.id === "powerpoint:chart-data-integrity",
    );

    expect(
      await layoutSuite?.verify({
        mode: "verify",
        request: "Fix the layout so the slide no longer overlaps.",
        plan: null,
        task: null,
        toolExecutions: [
          {
            toolCallId: "tc-1",
            toolName: "verify_slides",
            isError: false,
            resultText: "Detected overlap between title and body shapes.",
            timestamp: 1,
          },
        ],
        promptNotes: [],
      }),
    ).toEqual(
      expect.objectContaining({
        status: "failed",
      }),
    );

    expect(
      await templateSuite?.verify({
        mode: "verify",
        request: "Preserve the existing template while updating the theme accents.",
        plan: null,
        task: null,
        toolExecutions: [
          {
            toolCallId: "tc-2",
            toolName: "edit_slide_master",
            isError: false,
            resultText: "updated theme",
            timestamp: 1,
          },
        ],
        promptNotes: ["Keep the existing master and template language."],
      }),
    ).toEqual(
      expect.objectContaining({
        status: "passed",
      }),
    );

    expect(
      await chartSuite?.verify({
        mode: "verify",
        request: "Update the chart labels on slide 2.",
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
