import type { PostHookDefinition, PreHookDefinition } from "../types";

const READ_TOOLS = new Set([
  "get_document_text",
  "get_document_structure",
  "get_ooxml",
  "get_paragraph_ooxml",
  "screenshot_document",
  "get_cell_ranges",
  "get_range_as_csv",
  "search_data",
  "screenshot_range",
  "get_all_objects",
  "read_slide_text",
  "list_slide_shapes",
  "screenshot_slide",
  "verify_slides",
]);

const WRITE_TOOLS = new Set([
  "execute_office_js",
  "eval_officejs",
  "set_cell_range",
  "clear_cell_range",
  "copy_to",
  "modify_sheet_structure",
  "modify_workbook_structure",
  "resize_range",
  "modify_object",
  "edit_slide_text",
  "edit_slide_xml",
  "edit_slide_chart",
  "edit_slide_master",
  "duplicate_slide",
]);

function isWordTool(toolName: string): boolean {
  return (
    toolName.startsWith("get_document") ||
    toolName.startsWith("get_ooxml") ||
    toolName.startsWith("get_paragraph_ooxml") ||
    toolName === "screenshot_document" ||
    toolName === "execute_office_js"
  );
}

function isExcelTool(toolName: string): boolean {
  return (
    toolName.startsWith("get_") ||
    toolName.endsWith("_range") ||
    toolName === "search_data" ||
    toolName === "copy_to" ||
    toolName.startsWith("modify_") ||
    toolName === "eval_officejs"
  );
}

function isPowerPointTool(toolName: string): boolean {
  return (
    toolName.includes("slide") ||
    toolName === "verify_slides" ||
    toolName === "execute_office_js"
  );
}

export function scopeKeyFromParams(
  toolName: string,
  params: Record<string, unknown>,
): string {
  if (isWordTool(toolName)) {
    if (toolName === "get_document_text") {
      const start = params.startParagraph ?? 0;
      const end = params.endParagraph ?? "end";
      return `word:para:${start}-${end}`;
    }
    if (toolName === "get_ooxml") {
      const start = params.startChild ?? 0;
      const end = params.endChild ?? "end";
      return `word:child:${start}-${end}`;
    }
    if (toolName === "get_paragraph_ooxml") {
      const index = params.paragraphIndex ?? params.index ?? "all";
      return `word:para:${index}-${index}`;
    }
    return "word:all";
  }

  if (isExcelTool(toolName)) {
    const sheet =
      params.sheetName ??
      params.sheet ??
      params.sheetId ??
      params.worksheetId ??
      "sheet";
    const range = params.range ?? params.address ?? params.target ?? "all";
    return `excel:${sheet}:${range}`;
  }

  if (isPowerPointTool(toolName)) {
    const index = params.slideIndex ?? params.slide_index ?? "all";
    return `powerpoint:slide:${index}`;
  }

  return "all";
}

function parseWordScope(scope: string):
  | { kind: "all" }
  | { kind: "para" | "child"; start: number; end: number | null }
  | null {
  if (scope === "word:all") return { kind: "all" };
  const match = /^word:(para|child):(-?\d+)-(end|-?\d+)$/.exec(scope);
  if (!match) return null;
  return {
    kind: match[1] as "para" | "child",
    start: Number(match[2]),
    end: match[3] === "end" ? null : Number(match[3]),
  };
}

function rangeContains(
  outer: { start: number; end: number | null },
  inner: { start: number; end: number | null },
): boolean {
  const outerEnd = outer.end ?? Number.POSITIVE_INFINITY;
  const innerEnd = inner.end ?? Number.POSITIVE_INFINITY;
  return outer.start <= inner.start && outerEnd >= innerEnd;
}

export function hasReadCoverage(readScopes: Set<string>, writeScope: string): boolean {
  if (readScopes.has(writeScope) || readScopes.has("all")) {
    return true;
  }

  const [appPrefix] = writeScope.split(":");
  for (const scope of readScopes) {
    if (scope === `${appPrefix}:all`) {
      return true;
    }

    if (appPrefix === "word") {
      const readWordScope = parseWordScope(scope);
      const writeWordScope = parseWordScope(writeScope);
      if (
        readWordScope &&
        writeWordScope &&
        readWordScope.kind === writeWordScope.kind &&
        readWordScope.kind !== "all" &&
        writeWordScope.kind !== "all" &&
        rangeContains(readWordScope, writeWordScope)
      ) {
        return true;
      }
    }
  }

  return false;
}

export const readBeforeWritePostHook: PostHookDefinition = {
  name: "builtin:read-before-write:record",
  selector: {
    toolNames: [...READ_TOOLS],
  },
  band: "early",
  priority: 100,
  speed: "sync",
  onFailure: "ignore",
  source: { hookName: "read-before-write:record" },
  execute: (ctx) => {
    if (!ctx.isError) {
      ctx.sessionState.readScopes.add(
        scopeKeyFromParams(ctx.toolName, ctx.params),
      );
    }
    return {};
  },
};

export const readBeforeWritePreHook: PreHookDefinition = {
  name: "builtin:read-before-write:check",
  selector: {
    toolNames: [...WRITE_TOOLS],
  },
  band: "early",
  priority: 100,
  speed: "sync",
  onFailure: "warn",
  source: { hookName: "read-before-write:check" },
  execute: (ctx) => {
    const writeScope = scopeKeyFromParams(ctx.toolName, ctx.params);
    if (!hasReadCoverage(ctx.sessionState.readScopes, writeScope)) {
      return {
        action: "abort",
        errorMessage:
          "You must read the target content before modifying it. " +
          "Use get_document_text, get_document_structure, get_ooxml, " +
          "get_cell_ranges, get_range_as_csv, search_data, or the appropriate " +
          `read tool first. (Attempted write scope: ${writeScope})`,
      };
    }

    return { action: "continue" };
  },
};
