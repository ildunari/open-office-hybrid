export interface LoadedStyleSummary {
  builtIn: boolean;
  inUse: boolean;
  nameLocal: string;
  font: {
    name?: string;
    size?: number;
    color?: string;
  };
}

export interface ParagraphSampleInput {
  index: number;
  text: string;
  style: string;
  font: {
    name?: string;
    size?: number;
    color?: string;
  };
}

export function buildStyleInfoFromLoadedStyles(
  styles: LoadedStyleSummary[],
): Record<string, { font?: string; size?: number; color?: string }> | null {
  const styleInfo: Record<
    string,
    { font?: string; size?: number; color?: string }
  > = {};

  for (const style of styles) {
    if (!style.builtIn || !style.inUse || !style.nameLocal) continue;
    const entry: { font?: string; size?: number; color?: string } = {};
    if (style.font.name) entry.font = style.font.name;
    if (style.font.size && style.font.size > 0) entry.size = style.font.size;
    if (
      style.font.color &&
      style.font.color !== "Automatic" &&
      style.font.color !== "#000000"
    ) {
      entry.color = style.font.color;
    }
    if (Object.keys(entry).length > 0) {
      styleInfo[style.nameLocal] = entry;
    }
  }

  return Object.keys(styleInfo).length > 0 ? styleInfo : null;
}

export function buildRunFormattingSample(
  paragraphs: ParagraphSampleInput[],
): Array<{
  index: number;
  style: string;
  font?: string;
  size?: number;
  color?: string;
}> | null {
  const results: Array<{
    index: number;
    style: string;
    font?: string;
    size?: number;
    color?: string;
  }> = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.text?.trim()) continue;
    const entry: (typeof results)[number] = {
      index: paragraph.index,
      style: paragraph.style,
    };
    if (paragraph.font.name) entry.font = paragraph.font.name;
    if (paragraph.font.size && paragraph.font.size > 0) {
      entry.size = paragraph.font.size;
    }
    if (
      paragraph.font.color &&
      paragraph.font.color !== "Automatic" &&
      paragraph.font.color !== "#000000"
    ) {
      entry.color = paragraph.font.color;
    }
    results.push(entry);
  }

  return results.length > 0 ? results : null;
}
