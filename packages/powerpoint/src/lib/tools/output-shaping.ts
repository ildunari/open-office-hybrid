export async function buildPowerPointOfficeJsPayload(
  toolCallId: string,
  result: unknown,
  writeRawFile: (path: string, content: string | Uint8Array) => Promise<void>,
) {
  const safeResult = result ?? null;
  const serialized =
    typeof safeResult === "string"
      ? safeResult
      : JSON.stringify(safeResult, null, 2);

  if (serialized.length <= 4000) {
    return { success: true, result: safeResult };
  }

  const extension = typeof safeResult === "string" ? "txt" : "json";
  const filePath = `/home/user/tool-results/powerpoint-office-js-${toolCallId}.${extension}`;
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
      head: serialized.slice(0, 800),
      tail: serialized.slice(-400),
    },
    truncated: true,
  };
}

export async function buildSlideTextPayload(
  toolCallId: string,
  result: string,
  slideIndex: number,
  shapeId: string,
  writeRawFile: (path: string, content: string | Uint8Array) => Promise<void>,
) {
  if (result.length <= 4000) {
    return { success: true, result };
  }

  const filePath = `/home/user/ooxml/slide-${slideIndex}-shape-${shapeId}-${toolCallId}.xml`;
  await writeRawFile(filePath, result);

  return {
    success: true,
    result: null,
    file: filePath,
    lines: result.split("\n").length,
    preview: {
      head: result.slice(0, 800),
      tail: result.slice(-400),
    },
    truncated: true,
  };
}

export function buildShapeListPayload(result: Array<Record<string, unknown>>) {
  const maxShapes = 100;
  if (result.length <= maxShapes) {
    return { success: true, result };
  }

  return {
    success: true,
    result,
    shapePreview: result.slice(0, maxShapes),
    totalShapes: result.length,
    omittedShapes: result.length - maxShapes,
    truncated: true,
  };
}

const MAX_VERIFY_SLIDE_PREVIEW = 5;

interface VerifySlideSummary {
  slideIndex: number;
  shapeCount: number;
  overflowCount: number;
  overlapCount: number;
}

function countOverlapGroups(
  overlaps: Array<{
    shapeA?: { id?: string };
    shapeB?: { id?: string };
  }>,
) {
  const adjacency = new Map<string, Set<string>>();

  for (const overlap of overlaps) {
    const a = overlap.shapeA?.id;
    const b = overlap.shapeB?.id;
    if (!a || !b) continue;

    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  }

  let groups = 0;
  const visited = new Set<string>();

  for (const shapeId of adjacency.keys()) {
    if (visited.has(shapeId)) continue;
    groups += 1;

    const stack = [shapeId];
    visited.add(shapeId);
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      for (const neighbor of adjacency.get(current) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        stack.push(neighbor);
      }
    }
  }

  return groups;
}

export function buildVerifySlidesPayload(
  slides: Array<{
    shapes: unknown[];
    overflows: unknown[];
    overlaps: unknown[];
  }>,
) {
  const summaries: VerifySlideSummary[] = slides.map((slide, index) => ({
    slideIndex: index,
    shapeCount: slide.shapes.length,
    overflowCount: slide.overflows.length,
    overlapCount: countOverlapGroups(
      slide.overlaps as Array<{
        shapeA?: { id?: string };
        shapeB?: { id?: string };
      }>,
    ),
  }));
  const preview = summaries.slice(0, MAX_VERIFY_SLIDE_PREVIEW);
  const omitted = Math.max(0, summaries.length - preview.length);

  return {
    success: true,
    result: {
      slides,
      slidePreview: preview,
      totalSlides: summaries.length,
      omittedSlides: omitted,
      truncated: omitted > 0,
    },
  };
}
