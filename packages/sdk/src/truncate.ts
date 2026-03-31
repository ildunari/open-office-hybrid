export const DEFAULT_MAX_LINES = 2000;
export const DEFAULT_MAX_BYTES = 50 * 1024; // 50KB

export interface TruncationResult {
  content: string;
  truncated: boolean;
  truncatedBy: "lines" | "bytes" | null;
  totalLines: number;
  totalBytes: number;
  outputLines: number;
  outputBytes: number;
}

export interface TruncationOptions {
  maxLines?: number;
  maxBytes?: number;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function byteLength(str: string): number {
  return new TextEncoder().encode(str).byteLength;
}

function trimToMaxBytes(content: string, maxBytes: number): string {
  if (byteLength(content) <= maxBytes) return content;
  let end = content.length;
  while (end > 0 && byteLength(content.slice(0, end)) > maxBytes) {
    end--;
  }
  return content.slice(0, end);
}

export function truncateHead(
  content: string,
  options: TruncationOptions = {},
): TruncationResult {
  const maxLines = options.maxLines ?? DEFAULT_MAX_LINES;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const totalBytes = byteLength(content);
  const lines = content.split("\n");
  const totalLines = lines.length;

  if (totalLines <= maxLines && totalBytes <= maxBytes) {
    return {
      content,
      truncated: false,
      truncatedBy: null,
      totalLines,
      totalBytes,
      outputLines: totalLines,
      outputBytes: totalBytes,
    };
  }

  const outputLines: string[] = [];
  let outputBytesCount = 0;
  let truncatedBy: "lines" | "bytes" = "lines";

  for (let i = 0; i < lines.length && i < maxLines; i++) {
    const line = lines[i];
    const lb = byteLength(line) + (i > 0 ? 1 : 0);
    if (outputBytesCount + lb > maxBytes) {
      truncatedBy = "bytes";
      break;
    }
    outputLines.push(line);
    outputBytesCount += lb;
  }

  if (outputLines.length >= maxLines && outputBytesCount <= maxBytes) {
    truncatedBy = "lines";
  }

  const outputContent = outputLines.join("\n");
  return {
    content: outputContent,
    truncated: true,
    truncatedBy,
    totalLines,
    totalBytes,
    outputLines: outputLines.length,
    outputBytes: byteLength(outputContent),
  };
}

export function truncateTail(
  content: string,
  options: TruncationOptions = {},
): TruncationResult {
  const maxLines = options.maxLines ?? DEFAULT_MAX_LINES;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const totalBytes = byteLength(content);
  const lines = content.split("\n");
  const totalLines = lines.length;

  if (totalLines <= maxLines && totalBytes <= maxBytes) {
    return {
      content,
      truncated: false,
      truncatedBy: null,
      totalLines,
      totalBytes,
      outputLines: totalLines,
      outputBytes: totalBytes,
    };
  }

  const outputLines: string[] = [];
  let outputBytesCount = 0;
  let truncatedBy: "lines" | "bytes" = "lines";

  for (let i = lines.length - 1; i >= 0 && outputLines.length < maxLines; i--) {
    const line = lines[i];
    const lb = byteLength(line) + (outputLines.length > 0 ? 1 : 0);
    if (outputBytesCount + lb > maxBytes) {
      truncatedBy = "bytes";
      break;
    }
    outputLines.unshift(line);
    outputBytesCount += lb;
  }

  if (outputLines.length >= maxLines && outputBytesCount <= maxBytes) {
    truncatedBy = "lines";
  }

  const outputContent = outputLines.join("\n");
  return {
    content: outputContent,
    truncated: true,
    truncatedBy,
    totalLines,
    totalBytes,
    outputLines: outputLines.length,
    outputBytes: byteLength(outputContent),
  };
}

export function truncateHeadTail(
  content: string,
  options: TruncationOptions = {},
): TruncationResult {
  const maxLines = options.maxLines ?? DEFAULT_MAX_LINES;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const totalBytes = byteLength(content);
  const lines = content.split("\n");
  const totalLines = lines.length;

  if (totalLines <= maxLines && totalBytes <= maxBytes) {
    return {
      content,
      truncated: false,
      truncatedBy: null,
      totalLines,
      totalBytes,
      outputLines: totalLines,
      outputBytes: totalBytes,
    };
  }

  let headCount = Math.max(1, Math.floor(maxLines / 2));
  let tailCount = Math.max(0, maxLines - headCount);
  let merged = "";
  let mergedLines = 0;

  const buildPreview = () => {
    const cappedHead = Math.min(headCount, totalLines);
    const head = lines.slice(0, cappedHead);
    const tailStart = Math.max(cappedHead, totalLines - tailCount);
    const tail = lines.slice(tailStart);
    const omitted = Math.max(0, tailStart - cappedHead);
    const separator = omitted > 0 ? [`... [${omitted} lines omitted] ...`] : [];
    const previewLines = [...head, ...separator, ...tail];
    merged = previewLines.join("\n");
    mergedLines = previewLines.length;
    return { omitted, headCount: head.length, tailCount: tail.length };
  };

  buildPreview();
  while (byteLength(merged) > maxBytes && (headCount > 1 || tailCount > 0)) {
    if (tailCount >= headCount && tailCount > 0) {
      tailCount--;
    } else if (headCount > 1) {
      headCount--;
    } else if (tailCount > 0) {
      tailCount--;
    }
    buildPreview();
  }

  if (byteLength(merged) > maxBytes) {
    merged = trimToMaxBytes(merged, maxBytes);
  }

  return {
    content: merged,
    truncated: true,
    truncatedBy: totalBytes > maxBytes ? "bytes" : "lines",
    totalLines,
    totalBytes,
    outputLines: mergedLines,
    outputBytes: byteLength(merged),
  };
}
