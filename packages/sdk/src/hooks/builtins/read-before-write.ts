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

const WORD_LOCAL_WRITE_SCOPE = "word:local";

const BROAD_WORD_MUTATION_PATTERNS = [
  /(?:context\.document\.)?body\.search\s*\(/i,
  /(?:context\.document\.)?body\.getRange\s*\(/i,
  /(?:context\.document\.)?body\.(?:insertParagraph|insertTable|insertOoxml|insertFileFromBase64|insertBreak)\s*\(/i,
  /(?:context\.document\.)?body\.clear\s*\(/i,
  /context\.document\.sections\b/i,
  /getHeader\s*\(/i,
  /getFooter\s*\(/i,
  /changeTrackingMode\s*=/i,
  /getTrackedChanges\s*\(/i,
  /\bacceptAll\s*\(/i,
  /\brejectAll\s*\(/i,
  /(?:context\.document\.)?body\.(?:contentControls|inlinePictures)\b/i,
];

const LOCAL_WORD_MUTATION_PATTERNS = [
  /paragraphs\.items\s*\[/i,
  /tables\.items\s*\[/i,
  /contentControls\.items\s*\[/i,
  /getSelection\s*\(/i,
  /getBookmarkRange\s*\(/i,
  /paragraphs\.(?:getFirst|getLast)\s*\(/i,
  /tables\.(?:getFirst|getLast)\s*\(/i,
  /insertComment\s*\(/i,
];

function resolveParagraphIndexExpression(
  expression: string,
  numericBindings: Map<string, number>,
): number | null {
  const normalized = expression.trim();
  if (/^-?\d+$/.test(normalized)) {
    return Number(normalized);
  }
  return numericBindings.get(normalized) ?? null;
}

function inferParagraphWriteScope(code: string): string | null {
  const numericBindings = new Map<string, number>();
  for (const match of code.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(-?\d+)\s*;/g,
  )) {
    numericBindings.set(match[1], Number(match[2]));
  }

  const paragraphCollectionAliases = new Set<string>(["paragraphs"]);
  for (const match of code.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:context\.document\.)?body\.paragraphs\s*;/g,
  )) {
    paragraphCollectionAliases.add(match[1]);
  }

  const directParagraphMatch =
    /\b((?:context\.document\.)?body\.paragraphs|[A-Za-z_$][\w$]*)\.items\s*\[\s*([^\]]+?)\s*\]\s*\.(?:insertText|insertParagraph|insertHtml|insertOoxml|clear|delete)\s*\(/gi;
  for (const match of code.matchAll(directParagraphMatch)) {
    const collectionName = match[1];
    if (
      collectionName !== "body.paragraphs" &&
      collectionName !== "context.document.body.paragraphs" &&
      !paragraphCollectionAliases.has(collectionName)
    ) {
      continue;
    }
    const resolvedIndex = resolveParagraphIndexExpression(
      match[2],
      numericBindings,
    );
    if (resolvedIndex == null) {
      continue;
    }
    const paragraphIndex = resolvedIndex + 1;
    return `word:para:${paragraphIndex}-${paragraphIndex}`;
  }

  const paragraphAliases = new Map<string, number>();
  const paragraphAliasAssignment =
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*|(?:context\.document\.)?body\.paragraphs)\.items\s*\[\s*([^\]]+?)\s*\]\s*;/g;
  for (const match of code.matchAll(paragraphAliasAssignment)) {
    const sourceCollection = match[2];
    if (
      sourceCollection !== "body.paragraphs" &&
      sourceCollection !== "context.document.body.paragraphs" &&
      !paragraphCollectionAliases.has(sourceCollection)
    ) {
      continue;
    }
    const resolvedIndex = resolveParagraphIndexExpression(
      match[3],
      numericBindings,
    );
    if (resolvedIndex == null) {
      continue;
    }
    paragraphAliases.set(match[1], resolvedIndex + 1);
  }

  const paragraphAliasUse =
    /\b([A-Za-z_$][\w$]*)\s*\.(?:insertText|insertParagraph|insertHtml|insertOoxml|clear|delete)\s*\(/g;
  for (const match of code.matchAll(paragraphAliasUse)) {
    const paragraphIndex = paragraphAliases.get(match[1]);
    if (paragraphIndex != null) {
      return `word:para:${paragraphIndex}-${paragraphIndex}`;
    }
  }

  return null;
}

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
    if (toolName === "execute_office_js") {
      const code = String(params.code ?? params.jsCode ?? "")
        .replace(/\s+/g, " ")
        .trim();
      if (
        code &&
        BROAD_WORD_MUTATION_PATTERNS.some((pattern) => pattern.test(code))
      ) {
        return "word:all";
      }
      const inferredParagraphWriteScope = inferParagraphWriteScope(code);
      if (inferredParagraphWriteScope) {
        return inferredParagraphWriteScope;
      }
      if (
        !code ||
        LOCAL_WORD_MUTATION_PATTERNS.some((pattern) => pattern.test(code))
      ) {
        return WORD_LOCAL_WRITE_SCOPE;
      }
      return WORD_LOCAL_WRITE_SCOPE;
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

function parseWordScope(
  scope: string,
):
  | { kind: "all" | "local" }
  | { kind: "para" | "child"; start: number; end: number | null }
  | null {
  if (scope === "word:all") return { kind: "all" };
  if (scope === WORD_LOCAL_WRITE_SCOPE) return { kind: "local" };
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

export function hasReadCoverage(
  readScopes: Set<string>,
  writeScope: string,
): boolean {
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
      if (!readWordScope || !writeWordScope) {
        continue;
      }
      if (
        (readWordScope.kind === "para" || readWordScope.kind === "child") &&
        (writeWordScope.kind === "para" || writeWordScope.kind === "child") &&
        readWordScope.kind === writeWordScope.kind &&
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
      const scopeMessage =
        writeScope === "word:all"
          ? "Detected a broad Word write. Read a broad document or structure scope first."
          : writeScope === WORD_LOCAL_WRITE_SCOPE
            ? "Read the target Word scope first, then perform the bounded write. The runtime could not prove overlapping read coverage for this bounded Word write, so it is failing closed."
            : `Read the target Word scope first, then perform the bounded write. Attempted write scope: ${writeScope}`;
      return {
        action: "abort",
        errorMessage:
          "You must read the target content before modifying it. " +
          "Use get_document_text, get_document_structure, get_ooxml, " +
          "get_cell_ranges, get_range_as_csv, search_data, or the appropriate " +
          `read tool first. ${scopeMessage}`,
      };
    }

    return { action: "continue" };
  },
};
