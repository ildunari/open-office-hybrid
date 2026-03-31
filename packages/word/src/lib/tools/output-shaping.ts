const INLINE_XML_CHAR_LIMIT = 4000;
const PREVIEW_HEAD_CHARS = 800;
const PREVIEW_TAIL_CHARS = 400;
const INLINE_RESULT_CHAR_LIMIT = 4000;
const RESULT_PREVIEW_HEAD_CHARS = 800;
const RESULT_PREVIEW_TAIL_CHARS = 400;
const MAX_CHILD_PREVIEW_ITEMS = 20;
const MAX_DOCUMENT_TEXT_PARAGRAPHS = 20;
const MAX_HEADING_PREVIEW_ITEMS = 20;
const MAX_TABLE_PREVIEW_ITEMS = 5;
const MAX_CONTENT_CONTROL_PREVIEW_ITEMS = 5;

export async function buildParagraphOoxmlPayload(
  toolCallId: string,
  startIdx: number,
  endIdx: number,
  xml: string,
  writeRawFile: (path: string, content: string | Uint8Array) => Promise<void>,
) {
  if (xml.length <= INLINE_XML_CHAR_LIMIT) {
    return {
      paragraphIndex: startIdx,
      endParagraphIndex: endIdx !== startIdx ? endIdx : undefined,
      xml,
    };
  }

  const filePath = `/home/user/ooxml/paragraphs-${startIdx}-${endIdx}-${toolCallId}.xml`;
  await writeRawFile(filePath, xml);

  return {
    paragraphIndex: startIdx,
    endParagraphIndex: endIdx !== startIdx ? endIdx : undefined,
    file: filePath,
    lines: xml.split("\n").length,
    preview: {
      head: xml.slice(0, PREVIEW_HEAD_CHARS),
      tail: xml.slice(-PREVIEW_TAIL_CHARS),
    },
    truncated: true,
  };
}

export async function buildExecuteOfficeJsPayload(
  toolCallId: string,
  result: unknown,
  writeRawFile: (path: string, content: string | Uint8Array) => Promise<void>,
) {
  const safeResult = result ?? null;
  const serialized =
    typeof safeResult === "string"
      ? safeResult
      : JSON.stringify(safeResult, null, 2);

  if (serialized.length <= INLINE_RESULT_CHAR_LIMIT) {
    return { success: true, result: safeResult };
  }

  const extension = typeof safeResult === "string" ? "txt" : "json";
  const filePath = `/home/user/tool-results/execute-office-js-${toolCallId}.${extension}`;
  await writeRawFile(filePath, serialized);

  return {
    success: true,
    result: null,
    rawRef: {
      path: filePath,
      format: extension,
      chars: serialized.length,
      lines: serialized.split("\n").length,
    },
    preview: {
      head: serialized.slice(0, RESULT_PREVIEW_HEAD_CHARS),
      tail: serialized.slice(-RESULT_PREVIEW_TAIL_CHARS),
    },
    truncated: true,
  };
}

export function compactChildSummaryList<T>(children: T[]) {
  const preview = children.slice(0, MAX_CHILD_PREVIEW_ITEMS);
  const omitted = Math.max(0, children.length - preview.length);
  return {
    preview,
    omitted,
    total: children.length,
  };
}

export function buildDocumentTextPayload(
  totalParagraphs: number,
  start: number,
  paragraphs: Array<Record<string, unknown>>,
) {
  const preview = paragraphs.slice(0, MAX_DOCUMENT_TEXT_PARAGRAPHS);
  const omitted = Math.max(0, paragraphs.length - preview.length);
  const nextStart = start + preview.length;

  return {
    totalParagraphs,
    showing: { start, end: start + preview.length },
    paragraphs: preview,
    omittedParagraphs: omitted,
    next: omitted > 0 ? { startParagraph: nextStart } : undefined,
    truncated: omitted > 0,
  };
}

export function buildDocumentStructurePayload(
  paragraphCount: number,
  sectionCount: number,
  headings: Array<Record<string, unknown>>,
  tables: Array<Record<string, unknown>>,
  contentControls: Array<Record<string, unknown>>,
) {
  const headingPreview = headings.slice(0, MAX_HEADING_PREVIEW_ITEMS);
  const tablePreview = tables.slice(0, MAX_TABLE_PREVIEW_ITEMS);
  const contentControlPreview = contentControls.slice(
    0,
    MAX_CONTENT_CONTROL_PREVIEW_ITEMS,
  );

  const headingOmitted = Math.max(0, headings.length - headingPreview.length);
  const tableOmitted = Math.max(0, tables.length - tablePreview.length);
  const contentControlOmitted = Math.max(
    0,
    contentControls.length - contentControlPreview.length,
  );

  const truncated =
    headingOmitted > 0 || tableOmitted > 0 || contentControlOmitted > 0;

  return {
    paragraphCount,
    sectionCount,
    tableCount: tables.length,
    contentControlCount: contentControls.length,
    headings,
    tables,
    contentControls,
    headingPreview,
    headingOmitted,
    tablePreview,
    tableOmitted,
    contentControlPreview,
    contentControlOmitted,
    next: truncated
      ? {
          headingsOffset:
            headingOmitted > 0 ? headingPreview.length : undefined,
          tablesOffset: tableOmitted > 0 ? tablePreview.length : undefined,
          contentControlsOffset:
            contentControlOmitted > 0
              ? contentControlPreview.length
              : undefined,
        }
      : undefined,
    truncated,
  };
}
