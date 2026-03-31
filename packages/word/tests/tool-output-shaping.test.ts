import { describe, expect, it, vi } from "vitest";

vi.mock("@office-agents/core", () => ({
  resizeImage: async (data: string, mimeType: string) => ({ data, mimeType }),
}));

import {
  buildExecuteOfficeJsPayload,
  buildParagraphOoxmlPayload,
  compactChildSummaryList,
} from "../src/lib/tools/output-shaping";
import { getDocumentStructureTool } from "../src/lib/tools/get-document-structure";
import { getDocumentTextTool } from "../src/lib/tools/get-document-text";

describe("word tool output shaping", () => {
  it("keeps small paragraph OOXML inline", async () => {
    const writes: Array<{ path: string; content: string | Uint8Array }> = [];
    const payload = await buildParagraphOoxmlPayload(
      "tc_inline",
      1,
      1,
      "<w:p>Hello</w:p>",
      async (path, content) => {
        writes.push({ path, content });
      },
    );

    expect(payload).toMatchObject({
      paragraphIndex: 1,
      xml: "<w:p>Hello</w:p>",
    });
    expect(writes).toHaveLength(0);
  });

  it("spills large paragraph OOXML to VFS metadata", async () => {
    const writes: Array<{ path: string; content: string | Uint8Array }> = [];
    const xml = "<w:p>" + "A".repeat(5000) + "</w:p>";
    const payload = await buildParagraphOoxmlPayload(
      "tc_large",
      2,
      4,
      xml,
      async (path, content) => {
        writes.push({ path, content });
      },
    );

    expect(payload).toMatchObject({
      paragraphIndex: 2,
      endParagraphIndex: 4,
      file: "/home/user/ooxml/paragraphs-2-4-tc_large.xml",
      truncated: true,
    });
    expect("xml" in payload).toBe(false);
    expect(writes).toHaveLength(1);
  });

  it("keeps small Office.js results inline", async () => {
    const writes: Array<{ path: string; content: string | Uint8Array }> = [];
    const payload = await buildExecuteOfficeJsPayload(
      "tc_small",
      { ok: true, count: 2 },
      async (path, content) => {
        writes.push({ path, content });
      },
    );

    expect(payload).toEqual({
      success: true,
      result: { ok: true, count: 2 },
    });
    expect(writes).toHaveLength(0);
  });

  it("spills large Office.js results to VFS metadata", async () => {
    const writes: Array<{ path: string; content: string | Uint8Array }> = [];
    const payload = await buildExecuteOfficeJsPayload(
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
        path: "/home/user/tool-results/execute-office-js-tc_large.json",
        format: "json",
      },
      truncated: true,
    });
    expect(writes).toHaveLength(1);
  });

  it("caps child-summary previews while preserving totals", () => {
    const children = Array.from({ length: 25 }, (_, index) => ({
      index,
      type: "p",
    }));

    const summary = compactChildSummaryList(children);

    expect(summary.total).toBe(25);
    expect(summary.preview).toHaveLength(20);
    expect(summary.omitted).toBe(5);
    expect(summary.preview[0]).toEqual({ index: 0, type: "p" });
  });

  it("caps get_document_text paragraph payloads and returns a next range", async () => {
    const paragraphs = Array.from({ length: 30 }, (_, index) => ({
      text: `Paragraph ${index}`,
      style: index % 3 === 0 ? "Heading 1" : "Normal",
      alignment: "Left",
      listItemOrNullObject: {
        isNullObject: true,
        level: 0,
        listString: "",
        load: vi.fn(),
      },
      load: vi.fn(),
    }));

    vi.stubGlobal("Word", {
      run: async (callback: (context: unknown) => Promise<unknown>) =>
        callback({
          document: {
            body: {
              paragraphs: {
                items: paragraphs,
                load: vi.fn(),
              },
            },
          },
          sync: vi.fn(async () => {}),
        }),
    });

    const result = await getDocumentTextTool.execute("tc_text", {
      includeFormatting: true,
    });
    vi.unstubAllGlobals();

    const payload = JSON.parse(result.content[0]?.type === "text" ? result.content[0].text : "{}");

    expect(payload.totalParagraphs).toBe(30);
    expect(payload.paragraphs).toHaveLength(20);
    expect(payload.omittedParagraphs).toBe(10);
    expect(payload.next).toEqual({ startParagraph: 20 });
    expect(payload.truncated).toBe(true);
  });

  it("adds get_document_structure previews without dropping legacy arrays", async () => {
    const paragraphs = Array.from({ length: 30 }, (_, index) => ({
      text: `Heading ${index}`,
      style: "Heading 1",
      outlineLevel: 1,
      load: vi.fn(),
    }));
    const tables = Array.from({ length: 8 }, (_, index) => ({
      style: `Table Grid ${index}`,
      rows: {
        items: Array.from({ length: 3 }),
        load: vi.fn(),
      },
      load: vi.fn(),
    }));
    const contentControls = Array.from({ length: 6 }, (_, index) => ({
      id: index + 1,
      title: `Control ${index + 1}`,
      tag: `tag-${index + 1}`,
      type: "richText",
      load: vi.fn(),
    }));
    const sections = {
      items: Array.from({ length: 4 }),
      load: vi.fn(),
    };

    vi.stubGlobal("Word", {
      run: async (callback: (context: unknown) => Promise<unknown>) =>
        callback({
          document: {
            body: {
              paragraphs: {
                items: paragraphs,
                load: vi.fn(),
              },
              tables: {
                items: tables,
                load: vi.fn(),
              },
              contentControls: {
                items: contentControls,
                load: vi.fn(),
              },
            },
            sections,
          },
          sync: vi.fn(async () => {}),
        }),
    });

    const result = await getDocumentStructureTool.execute("tc_structure", {});
    vi.unstubAllGlobals();

    const payload = JSON.parse(result.content[0]?.type === "text" ? result.content[0].text : "{}");

    expect(payload.paragraphCount).toBe(30);
    expect(payload.headings).toHaveLength(30);
    expect(payload.headingPreview).toHaveLength(20);
    expect(payload.headingOmitted).toBe(10);
    expect(payload.tables).toHaveLength(8);
    expect(payload.tablePreview).toHaveLength(5);
    expect(payload.tableOmitted).toBe(3);
    expect(payload.contentControls).toHaveLength(6);
    expect(payload.contentControlPreview).toHaveLength(5);
    expect(payload.contentControlOmitted).toBe(1);
    expect(payload.next).toEqual({
      headingsOffset: 20,
      tablesOffset: 5,
      contentControlsOffset: 5,
    });
    expect(payload.truncated).toBe(true);
  });
});
