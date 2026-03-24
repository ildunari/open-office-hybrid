import { describe, expect, it } from "vitest";
import {
  buildRunFormattingSample,
  buildStyleInfoFromLoadedStyles,
} from "../src/lib/metadata-helpers";
import {
  normalizeParagraphBounds,
  documentBodyHasDirectChildren,
} from "../src/lib/tool-helpers";

describe("word tool helpers", () => {
  it("rejects negative and inverted paragraph ranges", () => {
    expect(() => normalizeParagraphBounds(-1, 3, 10)).toThrow(/startParagraph/);
    expect(() => normalizeParagraphBounds(4, 2, 10)).toThrow(/endParagraph/);
    expect(normalizeParagraphBounds(2, undefined, 5)).toEqual({ start: 2, end: 5 });
  });

  it("treats table-only OOXML as document content", () => {
    const tableOnly = `<?xml version="1.0" encoding="UTF-8"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
        </w:body>
      </w:document>`;

    expect(documentBodyHasDirectChildren(tableOnly)).toBe(true);
  });

  it("does not treat section-properties-only OOXML as document content", () => {
    const sectionOnly = `<?xml version="1.0" encoding="UTF-8"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:sectPr />
        </w:body>
      </w:document>`;

    expect(documentBodyHasDirectChildren(sectionOnly)).toBe(false);
  });

  it("builds style info keyed by localized style names", () => {
    const styleInfo = buildStyleInfoFromLoadedStyles([
      {
        builtIn: true,
        inUse: true,
        nameLocal: "Titre 1",
        font: { name: "Aptos", size: 14, color: "#123456" },
      },
    ]);

    expect(styleInfo).toEqual({
      "Titre 1": { font: "Aptos", size: 14, color: "#123456" },
    });
  });

  it("preserves original paragraph indices when blank paragraphs are skipped", () => {
    expect(
      buildRunFormattingSample([
        { index: 0, text: "Heading", style: "Heading 1", font: { name: "Aptos", size: 16, color: "#000000" } },
        { index: 1, text: "   ", style: "Normal", font: { name: "Aptos", size: 11, color: "#000000" } },
        { index: 2, text: "Body", style: "Normal", font: { name: "Aptos", size: 11, color: "#111111" } },
      ]),
    ).toEqual([
      { index: 0, style: "Heading 1", font: "Aptos", size: 16 },
      { index: 2, style: "Normal", font: "Aptos", size: 11, color: "#111111" },
    ]);
  });
});
