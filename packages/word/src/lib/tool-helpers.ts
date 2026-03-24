export function normalizeParagraphBounds(
  startParagraph: number | undefined,
  endParagraph: number | undefined,
  totalParagraphs: number,
): { start: number; end: number } {
  const start = startParagraph ?? 0;
  if (start < 0) {
    throw new Error("startParagraph must be >= 0");
  }

  const end = Math.min(endParagraph ?? totalParagraphs, totalParagraphs);
  if (end < 0) {
    throw new Error("endParagraph must be >= 0");
  }
  if (end < start) {
    throw new Error("endParagraph must be >= startParagraph");
  }

  return { start, end };
}

export function documentBodyHasDirectChildren(ooxmlPackage: string): boolean {
  const bodyMatch = ooxmlPackage.match(/<w:body\b[^>]*>([\s\S]*?)<\/w:body>/);
  if (!bodyMatch) return false;
  return /<w:(?:p|tbl|sdt)\b/.test(bodyMatch[1]);
}
