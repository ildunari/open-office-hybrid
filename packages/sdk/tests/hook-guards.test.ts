import { describe, expect, it } from "vitest";
import {
  extractSuccessPayload,
  hashFormattingBlocks,
} from "../src/hooks/builtins/format-fingerprint";
import {
  hasReadCoverage,
  readBeforeWritePreHook,
  scopeKeyFromParams,
} from "../src/hooks/builtins/read-before-write";

describe("read-before-write guards", () => {
  it("requires broad read coverage for broad Word writes", () => {
    const writeScope = scopeKeyFromParams("execute_office_js", {
      code: 'const results = context.document.body.search("Party A");',
    });

    expect(hasReadCoverage(new Set(["word:para:5-5"]), writeScope)).toBe(false);
    expect(hasReadCoverage(new Set(["word:all"]), writeScope)).toBe(true);
  });

  it("treats bounded execute_office_js edits as local Word writes", () => {
    const writeScope = scopeKeyFromParams("execute_office_js", {
      code: `
        const paragraphs = context.document.body.paragraphs;
        paragraphs.load("items");
        await context.sync();
        paragraphs.items[4].insertText("Updated", "Replace");
        await context.sync();
      `,
    });

    expect(writeScope).toBe("word:local");
    expect(hasReadCoverage(new Set(["word:para:5-5"]), writeScope)).toBe(true);
    expect(hasReadCoverage(new Set(["word:child:2-4"]), writeScope)).toBe(true);
  });

  it("keeps broad execute_office_js edits gated on broad Word reads", () => {
    const writeScope = scopeKeyFromParams("execute_office_js", {
      code: `
        const results = context.document.body.search("Party A", { matchCase: true });
        results.load("items");
        await context.sync();
        for (const range of results.items) {
          range.insertText("Acme", "Replace");
        }
        await context.sync();
      `,
    });

    expect(writeScope).toBe("word:all");
    expect(hasReadCoverage(new Set(["word:para:5-5"]), writeScope)).toBe(false);
    expect(hasReadCoverage(new Set(["word:all"]), writeScope)).toBe(true);
  });

  it("accepts overlapping narrow Word reads for narrow writes", () => {
    const writeScope = "word:para:2-4";

    expect(hasReadCoverage(new Set(["word:para:0-10"]), writeScope)).toBe(true);
    expect(hasReadCoverage(new Set(["word:para:5-8"]), writeScope)).toBe(false);
  });

  it("returns truthful read-before-write messages for local and broad Word writes", () => {
    const localResult = readBeforeWritePreHook.execute({
      toolName: "execute_office_js",
      params: {
        code: 'context.document.body.paragraphs.items[0].insertText("x", "Replace")',
      },
      sessionState: { readScopes: new Set<string>() },
    } as never);
    expect(localResult.action).toBe("abort");
    expect(localResult.errorMessage).toContain(
      "Read the target Word scope first, then perform the bounded write.",
    );

    const broadResult = readBeforeWritePreHook.execute({
      toolName: "execute_office_js",
      params: {
        code: 'context.document.body.search("Party A").load("items")',
      },
      sessionState: { readScopes: new Set<string>() },
    } as never);
    expect(broadResult.action).toBe("abort");
    expect(broadResult.errorMessage).toContain(
      "Detected a broad Word write. Read a broad document or structure scope first.",
    );
  });
});

describe("format fingerprint helpers", () => {
  it("hashes only formatting blocks", () => {
    const base =
      '<w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Hello</w:t></w:r></w:p>';
    const textChanged =
      '<w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>World</w:t></w:r></w:p>';
    const formattingChanged =
      '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Hello</w:t></w:r></w:p>';

    expect(hashFormattingBlocks(base)).toBe(hashFormattingBlocks(textChanged));
    expect(hashFormattingBlocks(base)).not.toBe(
      hashFormattingBlocks(formattingChanged),
    );
  });

  it("extracts JSON payloads from text tool results", () => {
    expect(
      extractSuccessPayload({
        content: [
          { type: "text", text: '{"file":"/tmp/test.xml","lines":12}' },
        ],
        details: undefined,
      }),
    ).toEqual({ file: "/tmp/test.xml", lines: 12 });
  });
});
