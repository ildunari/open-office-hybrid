export async function buildEvalOfficeJsPayload(
  toolCallId: string,
  result: unknown,
  dirtyRanges: unknown[] = [],
  writeRawFile: (path: string, content: string | Uint8Array) => Promise<void>,
) {
  const safeResult = result ?? null;
  const serialized =
    typeof safeResult === "string"
      ? safeResult
      : JSON.stringify(safeResult, null, 2);

  if (serialized.length <= 4000) {
    const inlineResult: Record<string, unknown> = {
      success: true,
      result: safeResult,
    };
    if (dirtyRanges.length > 0) {
      inlineResult._dirtyRanges = dirtyRanges;
    }
    return inlineResult;
  }

  const extension = typeof safeResult === "string" ? "txt" : "json";
  const filePath = `/home/user/tool-results/eval-officejs-${toolCallId}.${extension}`;
  await writeRawFile(filePath, serialized);

  const compactResult: Record<string, unknown> = {
    success: true,
    result: null,
    rawRef: {
      path: filePath,
      format: extension,
      chars: serialized.length,
      lines: serialized.split("\n").length,
    },
    preview: {
      head: serialized.slice(0, 800),
      tail: serialized.slice(-400),
    },
    truncated: true,
  };
  if (dirtyRanges.length > 0) {
    compactResult._dirtyRanges = dirtyRanges;
  }
  return compactResult;
}
