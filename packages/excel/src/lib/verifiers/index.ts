import type {
  ScopeRiskEstimate,
  TaskClassification,
  TaskRecord,
  VerificationSuite,
} from "@office-agents/core/sdk";
import { auditFormulaResult } from "../patterns";

const EXCEL_STRUCTURE_RE =
  /\b(rename|insert|delete|resize|sheet|workbook|table|column|pivot|chart)\b/i;
const EXCEL_FORMULA_RE =
  /\b(formula|forecast|model|scenario|projection|total|calculate|recalculate)\b/i;
const EXCEL_UNIT_RE =
  /\b(percent|%|currency|revenue|margin|rate|price|cost|usd|eur)\b/i;

export function estimateExcelScopeRisk(
  request: string,
  classification: TaskClassification,
): ScopeRiskEstimate {
  const destructive =
    /\b(delete|remove|clear|overwrite|replace all|rebuild)\b/i.test(request) ||
    EXCEL_STRUCTURE_RE.test(request);

  return {
    level: destructive ? "high" : classification.risk,
    destructive,
    requiresApproval: destructive || classification.risk === "high",
    reasons: destructive
      ? ["Workbook structure or data shape may change."]
      : ["No additional Excel-specific approval gate required."],
    scopeSummary: EXCEL_STRUCTURE_RE.test(request)
      ? "sheet/workbook structure"
      : "worksheet range",
    constraints: [
      "Preserve formulas, references, and bindings outside the requested scope.",
      ...(EXCEL_UNIT_RE.test(request)
        ? ["Keep units and scales consistent across edited cells."]
        : []),
    ],
    expectedEffects: [
      "Workbook formulas and bindings stay valid after the edit.",
      "Only the intended sheet/range changes.",
    ],
  };
}

export function buildExcelHandoffSummary(task: TaskRecord): string {
  return `Resume Excel task for ${task.scopeSummary ?? "worksheet scope"}. ${task.userRequest}.`;
}

export function getExcelVerificationSuites(): VerificationSuite[] {
  return [
    {
      id: "excel:formula-errors",
      label: "Formula error scan",
      appliesTo: (context) => EXCEL_FORMULA_RE.test(context.request),
      verify: (context) => {
        const errors = context.toolExecutions.flatMap((entry) =>
          auditFormulaResult(entry.resultText),
        );
        return {
          suiteId: "excel:formula-errors",
          label: "Formula error scan",
          expectedEffect: "No spreadsheet error tokens appear after the edit.",
          observedEffect:
            errors.length === 0
              ? "No spreadsheet error tokens found."
              : `Detected spreadsheet errors: ${errors.join(", ")}`,
          status: errors.length === 0 ? "passed" : "failed",
          evidence: errors,
          retryable: false,
        };
      },
    },
    {
      id: "excel:ripple-check",
      label: "Dependency and ripple reread",
      appliesTo: (context) =>
        EXCEL_FORMULA_RE.test(context.request) ||
        EXCEL_STRUCTURE_RE.test(context.request),
      verify: (context) => ({
        suiteId: "excel:ripple-check",
        label: "Dependency and ripple reread",
        expectedEffect:
          "Downstream workbook effects are reviewed after the edit.",
        observedEffect:
          context.toolExecutions.length > 0
            ? "Tool execution evidence captured for post-edit review."
            : "No tool execution evidence available for ripple review.",
        status: context.toolExecutions.length > 0 ? "passed" : "retryable",
        evidence: context.toolExecutions.map((entry) => entry.toolName),
        retryable: context.toolExecutions.length === 0,
      }),
    },
    {
      id: "excel:binding-sanity",
      label: "Chart / pivot binding sanity",
      appliesTo: (context) =>
        /\b(chart|pivot|binding|dashboard)\b/i.test(context.request),
      verify: (context) => ({
        suiteId: "excel:binding-sanity",
        label: "Chart / pivot binding sanity",
        expectedEffect: "Chart and pivot bindings remain intact.",
        observedEffect: context.toolExecutions.some((entry) => entry.isError)
          ? "A host write failed during a binding-sensitive task."
          : "No host write failures detected for binding-sensitive work.",
        status: context.toolExecutions.some((entry) => entry.isError)
          ? "failed"
          : "passed",
        evidence: context.toolExecutions.map((entry) => entry.resultText),
        retryable: false,
      }),
    },
  ];
}
