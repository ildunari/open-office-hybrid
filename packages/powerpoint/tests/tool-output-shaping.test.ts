import { describe, expect, it, vi } from "vitest";

vi.mock("@office-agents/core", () => ({
  resizeImage: async (data: string, mimeType: string) => ({ data, mimeType }),
}));

import {
  buildPowerPointOfficeJsPayload,
  buildShapeListPayload,
  buildSlideTextPayload,
} from "../src/lib/tools/output-shaping";
import { verifySlidesTool } from "../src/lib/tools/verify-slides";

describe("powerpoint tool output shaping", () => {
  it("keeps small Office.js results inline", async () => {
    const writes: Array<{ path: string; content: string | Uint8Array }> = [];
    const payload = await buildPowerPointOfficeJsPayload(
      "tc_small",
      { ok: true },
      async (path, content) => {
        writes.push({ path, content });
      },
    );

    expect(payload).toEqual({ success: true, result: { ok: true } });
    expect(writes).toHaveLength(0);
  });

  it("spills large Office.js results to VFS metadata", async () => {
    const writes: Array<{ path: string; content: string | Uint8Array }> = [];
    const payload = await buildPowerPointOfficeJsPayload(
      "tc_large",
      { html: "<p>" + "A".repeat(5000) + "</p>" },
      async (path, content) => {
        writes.push({ path, content });
      },
    );

    expect(payload).toMatchObject({
      success: true,
      result: null,
      rawRef: {
        path: "/home/user/tool-results/powerpoint-office-js-tc_large.json",
        format: "json",
      },
      truncated: true,
    });
    expect(writes).toHaveLength(1);
  });

  it("spills large slide text to VFS metadata", async () => {
    const writes: Array<{ path: string; content: string | Uint8Array }> = [];
    const payload = await buildSlideTextPayload(
      "tc_xml",
      "<a:p>" + "A".repeat(5000) + "</a:p>",
      3,
      "42",
      async (path, content) => {
        writes.push({ path, content });
      },
    );

    expect(payload).toMatchObject({
      success: true,
      result: null,
      file: "/home/user/ooxml/slide-3-shape-42-tc_xml.xml",
      truncated: true,
    });
    expect(writes).toHaveLength(1);
  });

  it("adds preview metadata for oversized shape lists without dropping IDs", () => {
    const payload = buildShapeListPayload(
      Array.from({ length: 120 }, (_, index) => ({ id: String(index) })),
    );

    expect(payload).toMatchObject({
      success: true,
      totalShapes: 120,
      omittedShapes: 20,
      truncated: true,
    });
    expect(Array.isArray(payload.result)).toBe(true);
    expect(payload.result).toHaveLength(120);
    expect(payload.shapePreview).toHaveLength(100);
  });

  it("adds verify_slides deck summaries without dropping per-shape detail", async () => {
    const slideResults = Array.from({ length: 7 }, (_, index) => ({
      shapes: Array.from({ length: 4 }, (__, shapeIndex) => ({
        id: `${index + 1}-${shapeIndex + 1}`,
        name: `Slide ${index + 1} Shape ${shapeIndex + 1}`,
        left: shapeIndex * 10,
        top: shapeIndex * 10,
        w: 100,
        h: 40,
      })),
      overflows: [],
      overlaps:
        index % 2 === 0
          ? [
              {
                shapeA: {
                  id: `${index + 1}-1`,
                  name: "Title",
                  left: 0,
                  top: 0,
                  w: 100,
                  h: 40,
                },
                shapeB: {
                  id: `${index + 1}-2`,
                  name: "Body",
                  left: 50,
                  top: 10,
                  w: 120,
                  h: 60,
                },
                overlapX: 50,
                overlapY: 30,
              },
            ]
          : [],
    }));

    vi.stubGlobal("PowerPoint", {
      run: async (callback: (context: unknown) => Promise<unknown>) =>
        callback({
          presentation: {
            slides: {
              items: slideResults.map((slide) => ({
                shapes: {
                  items: slide.shapes.map((shape) => ({
                    id: shape.id,
                    name: shape.name,
                    left: shape.left,
                    top: shape.top,
                    width: shape.w,
                    height: shape.h,
                    load: vi.fn(),
                  })),
                  load: vi.fn(),
                },
              })),
              load: vi.fn(),
            },
            pageSetup: {
              slideWidth: 720,
              slideHeight: 540,
              load: vi.fn(),
            },
          },
          sync: vi.fn(async () => {}),
        }),
    });

    const result = await verifySlidesTool.execute("tc_verify", {});
    vi.unstubAllGlobals();

    const payload = JSON.parse(result.content[0]?.type === "text" ? result.content[0].text : "{}");

    expect(payload.success).toBe(true);
    expect(payload.result.slides).toHaveLength(7);
    expect(payload.result.slidePreview).toHaveLength(5);
    expect(payload.result.totalSlides).toBe(7);
    expect(payload.result.omittedSlides).toBe(2);
    expect(payload.result.truncated).toBe(true);
    expect(payload.result.slidePreview[0]).toMatchObject({
      slideIndex: 0,
      shapeCount: 4,
      overlapCount: 1,
    });
    expect(payload.result.slides[0].shapes[0]).toMatchObject({
      id: "1-1",
    });
  });
});
