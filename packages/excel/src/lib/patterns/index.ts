import type {
  Disposable,
  HookRegistry,
  ReasoningPattern,
} from "@office-agents/core/sdk";

export interface UnitHint {
  label: string;
  numberFormat: string;
  dimension: "currency" | "percent" | "count" | "text";
}

export interface InferredColumn {
  columnIndex: number;
  header: string;
  calculated: boolean;
}

export interface InferredSchema {
  headerRowIndexes: number[];
  totalRowIndexes: number[];
  columns: InferredColumn[];
}

function asHookRegistry(registry: unknown): HookRegistry {
  return registry as HookRegistry;
}

function composeDisposables(disposables: Disposable[]): Disposable {
  return {
    dispose() {
      for (const disposable of disposables) {
        disposable.dispose();
      }
    },
  };
}

function requestText(plan?: { userRequest?: string }): string {
  return plan?.userRequest?.toLowerCase() ?? "";
}

export function extractA1References(text: string): string[] {
  const matches =
    text.match(
      /\b(?:[A-Za-z_][A-Za-z0-9_]*!)?[A-Z]{1,3}\d+(?::[A-Z]{1,3}\d+)?\b/g,
    ) ?? [];
  return [...new Set(matches)];
}

export function detectUnitHints(
  labels: string[],
  numberFormats: string[],
): UnitHint[] {
  return labels.map((label, index) => {
    const format = numberFormats[index] ?? "";
    const lower = `${label} ${format}`.toLowerCase();
    let dimension: UnitHint["dimension"] = "count";
    if (lower.includes("$") || lower.includes("usd") || lower.includes("eur")) {
      dimension = "currency";
    } else if (lower.includes("%") || lower.includes("percent")) {
      dimension = "percent";
    } else if (!label.trim()) {
      dimension = "text";
    }
    return { label, numberFormat: format, dimension };
  });
}

export function inferSchemaFromRows(rows: unknown[][]): InferredSchema {
  const header = (rows[0] ?? []).map((cell) => String(cell ?? ""));
  const totalRowIndexes = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) =>
      String(row[0] ?? "")
        .toLowerCase()
        .includes("total"),
    )
    .map(({ index }) => index);

  const columns = header.map((value, columnIndex) => ({
    columnIndex,
    header: value,
    calculated: rows
      .slice(1)
      .some(
        (row) =>
          typeof row[columnIndex] === "string" &&
          row[columnIndex].startsWith("="),
      ),
  }));

  return {
    headerRowIndexes: header.length > 0 ? [0] : [],
    totalRowIndexes,
    columns,
  };
}

export function auditFormulaResult(resultText: string): string[] {
  return (
    resultText.match(/#(?:REF|VALUE|DIV\/0|NAME\?|NUM|N\/A|NULL)!?/g) ?? []
  );
}

function notePattern(
  id: string,
  note: string,
  toolNames: string[],
  expectedVerifierIds: string[],
  trigger: (request: string) => boolean,
): ReasoningPattern {
  return {
    id,
    name: id,
    apps: ["excel"],
    defaultState: () => ({}),
    triggers: (classification, plan) =>
      classification.needsPlan && trigger(requestText(plan)),
    describeActivation: () => ({
      id,
      reason: note,
      expectedVerifierIds,
    }),
    activate: (registry) => {
      const hooks = asHookRegistry(registry);
      const disposables = toolNames.map((toolName) =>
        hooks.registerPre({
          name: `${id}:${toolName}`,
          selector: { toolNames: [toolName] },
          speed: "sync",
          source: { patternId: id, hookName: toolName },
          execute: () => ({
            action: "continue",
            promptNotes: [
              {
                level: "info",
                text: note,
                source: { patternId: id, hookName: toolName },
              },
            ],
          }),
        }),
      );
      return composeDisposables(disposables);
    },
  };
}

export function getExcelReasoningPatterns(): ReasoningPattern[] {
  return [
    notePattern(
      "excel:dependency-graph",
      "Check dependency graph impact before changing formulas or structural spreadsheet logic.",
      ["eval_officejs", "set_cell_range", "modify_object"],
      ["excel:ripple-check"],
      (request) =>
        /\b(formula|forecast|downstream|total|recalculate|calc)\b/i.test(
          request,
        ),
    ),
    notePattern(
      "excel:schema-inference",
      "Infer headers, totals, and calculated columns before rewriting tabular workbook regions.",
      ["get_cell_ranges", "get_range_as_csv", "search_data"],
      ["excel:ripple-check"],
      (request) =>
        /\b(table|column|schema|dataset|rows|headers)\b/i.test(request),
    ),
    notePattern(
      "excel:unit-consistency",
      "Preserve unit consistency across currency, percentage, and scaled values before writing formulas.",
      ["eval_officejs", "set_cell_range"],
      ["excel:formula-errors"],
      (request) =>
        /\b(percent|%|currency|revenue|margin|rate|price|cost)\b/i.test(
          request,
        ),
    ),
    notePattern(
      "excel:ripple-impact",
      "Scan ripple impact on charts, pivots, validations, and formulas before structural workbook edits.",
      ["modify_sheet_structure", "modify_workbook_structure", "modify_object"],
      ["excel:ripple-check", "excel:binding-sanity"],
      (request) =>
        /\b(rename|insert|delete|resize|move|sheet|workbook|pivot|chart)\b/i.test(
          request,
        ),
    ),
    notePattern(
      "excel:formula-audit",
      "Audit formula semantics after edits and verify references still align with the intended model.",
      ["eval_officejs", "set_cell_range"],
      ["excel:formula-errors"],
      (request) =>
        /\b(formula|audit|model|scenario|projection)\b/i.test(request),
    ),
    notePattern(
      "excel:error-diagnosis",
      "Re-check the workbook for spreadsheet error surfaces like #REF! and #VALUE! after risky edits.",
      ["eval_officejs", "set_cell_range", "modify_object"],
      ["excel:formula-errors"],
      (request) => /\b(error|diagnose|fix|repair|#ref|#value)\b/i.test(request),
    ),
  ];
}
