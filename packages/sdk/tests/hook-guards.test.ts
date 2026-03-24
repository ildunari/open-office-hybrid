import { describe, expect, it } from "vitest";
import {
  hasReadCoverage,
  scopeKeyFromParams,
} from "../src/hooks/builtins/read-before-write";
import {
  extractSuccessPayload,
  hashFormattingBlocks,
} from "../src/hooks/builtins/format-fingerprint";

describe("read-before-write guards", () => {
  it("requires broad read coverage for broad Word writes", () => {
    const writeScope = scopeKeyFromParams("execute_office_js", {});

    expect(
      hasReadCoverage(new Set(["word:para:5-5"]), writeScope),
    ).toBe(false);
    expect(hasReadCoverage(new Set(["word:all"]), writeScope)).toBe(true);
  });

  it("accepts overlapping narrow Word reads for narrow writes", () => {
    const writeScope = "word:para:2-4";

    expect(hasReadCoverage(new Set(["word:para:0-10"]), writeScope)).toBe(
      true,
    );
    expect(hasReadCoverage(new Set(["word:para:5-8"]), writeScope)).toBe(
      false,
    );
  });
});

describe("format fingerprint helpers", () => {
  it("hashes only formatting blocks", () => {
    const base =
      "<w:p><w:pPr><w:jc w:val=\"left\"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Hello</w:t></w:r></w:p>";
    const textChanged =
      "<w:p><w:pPr><w:jc w:val=\"left\"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>World</w:t></w:r></w:p>";
    const formattingChanged =
      "<w:p><w:pPr><w:jc w:val=\"center\"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Hello</w:t></w:r></w:p>";

    expect(hashFormattingBlocks(base)).toBe(hashFormattingBlocks(textChanged));
    expect(hashFormattingBlocks(base)).not.toBe(
      hashFormattingBlocks(formattingChanged),
    );
  });

  it("extracts JSON payloads from text tool results", () => {
    expect(
      extractSuccessPayload({
        content: [{ type: "text", text: '{"file":"/tmp/test.xml","lines":12}' }],
        details: undefined,
      }),
    ).toEqual({ file: "/tmp/test.xml", lines: 12 });
  });
});
