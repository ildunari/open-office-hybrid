import { describe, expect, it } from "vitest";
import { HookRegistry } from "@office-agents/core/sdk";
import {
  auditFormulaResult,
  detectUnitHints,
  extractA1References,
  getExcelReasoningPatterns,
  inferSchemaFromRows,
} from "../src/lib/patterns";

describe("excel reasoning pattern helpers", () => {
  it("extracts A1 references from formulas and Office.js snippets", () => {
    expect(
      extractA1References(
        "=SUM(B2:B10)+Sheet2!C5\nworksheet.getRange('D4:E8')",
      ),
    ).toEqual(["B2:B10", "Sheet2!C5", "D4:E8"]);
  });

  it("detects unit families from labels and number formats", () => {
    expect(
      detectUnitHints(["Revenue ($M)", "Gross Margin %"], [
        "$#,##0.00",
        "0.0%",
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dimension: "currency" }),
        expect.objectContaining({ dimension: "percent" }),
      ]),
    );
  });

  it("infers header rows, total rows, and calculated columns from sample rows", () => {
    const schema = inferSchemaFromRows([
      ["Region", "Revenue", "Growth %"],
      ["East", 120, "=B2/1000"],
      ["West", 140, "=B3/1000"],
      ["Grand Total", 260, "=SUM(C2:C3)"],
    ]);

    expect(schema.headerRowIndexes).toEqual([0]);
    expect(schema.totalRowIndexes).toEqual([3]);
    expect(schema.columns[2]).toEqual(
      expect.objectContaining({ calculated: true }),
    );
  });

  it("finds spreadsheet error surfaces in result payloads", () => {
    expect(
      auditFormulaResult('{"result":"#REF! in Sheet1!D7 and #VALUE! in E2"}'),
    ).toEqual(["#REF!", "#VALUE!"]);
  });
});

describe("excel reasoning patterns", () => {
  const patterns = getExcelReasoningPatterns();
  const ids = patterns.map((pattern) => pattern.id);

  it("exports the approved medium pattern set", () => {
    expect(ids).toEqual([
      "excel:dependency-graph",
      "excel:schema-inference",
      "excel:unit-consistency",
      "excel:ripple-impact",
      "excel:formula-audit",
      "excel:error-diagnosis",
    ]);
  });

  it("activates dependency graph guidance for formula-heavy plans", async () => {
    const registry = new HookRegistry();
    const dg = patterns.find((pattern) => pattern.id === "excel:dependency-graph");
    if (!dg) throw new Error("dependency graph pattern missing");

    const classification = {
      complexity: "moderate" as const,
      risk: "medium" as const,
      needsPlan: true,
      rationale: "Formula editing risk.",
    };
    const plan = {
      id: "plan-1",
      userRequest: "Update the forecast formulas and verify downstream totals.",
      mode: "auto" as const,
      status: "active" as const,
      steps: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      classification,
      revisionNotes: [],
    };

    const disposable = dg.activate(registry, dg.defaultState());
    const result = await registry.runPreHooks({
      toolName: "eval_officejs",
      tags: ["write", "office-js"],
      params: {
        code: "const range = sheet.getRange('B2:B10'); range.formulas = [[ '=A2*1.1' ]];",
      },
      toolCallId: "call-1",
      budget: { totalMs: 1000, elapsedMs: 0 },
      captures: new Map<string, unknown>(),
      sessionState: registry.getSessionState(),
    });
    disposable.dispose();

    expect(result.promptNotes?.[0]?.text).toContain("dependency");
  });
});
