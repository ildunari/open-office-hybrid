import { describe, expect, it } from "vitest";
import {
  buildExcelHandoffSummary,
  estimateExcelScopeRisk,
  getExcelVerificationSuites,
} from "../src/lib/verifiers";

describe("excel verifier helpers", () => {
  it("requires approval for structural workbook edits", () => {
    const risk = estimateExcelScopeRisk(
      "Delete the sheet and rebuild the workbook structure.",
      {
        complexity: "complex",
        risk: "high",
        needsPlan: true,
        rationale: "Structural mutation",
      },
    );

    expect(risk.requiresApproval).toBe(true);
    expect(risk.scopeSummary).toContain("sheet");
  });

  it("builds a useful Excel handoff summary", () => {
    const summary = buildExcelHandoffSummary({
      id: "task-1",
      userRequest: "Update forecast formulas and verify downstream totals.",
      status: "failed",
      scopeSummary: "Sheet1!B2:F20",
      toolCallIds: [],
      createdAt: 1,
      updatedAt: 1,
    });

    expect(summary).toContain("Sheet1!B2:F20");
    expect(summary).toContain("Update forecast formulas");
  });

  it("detects formula errors and binding-sensitive failures", async () => {
    const suites = getExcelVerificationSuites();
    const formulaSuite = suites.find(
      (suite) => suite.id === "excel:formula-errors",
    );
    const bindingSuite = suites.find(
      (suite) => suite.id === "excel:binding-sanity",
    );

    expect(
      await formulaSuite?.verify({
        mode: "verify",
        request: "Update the forecast formulas.",
        plan: null,
        task: null,
        toolExecutions: [
          {
            toolCallId: "tc-1",
            toolName: "eval_officejs",
            isError: false,
            resultText: "Found #REF! in Sheet1!D7",
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
      await bindingSuite?.verify({
        mode: "verify",
        request: "Update the chart bindings.",
        plan: null,
        task: null,
        toolExecutions: [
          {
            toolCallId: "tc-2",
            toolName: "modify_object",
            isError: false,
            resultText: "updated",
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
  });
});
