// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBash,
  readFile,
  resetVfs,
  setCustomCommands,
  writeFile,
} from "../src/vfs";
import { getSharedCustomCommands } from "../src/vfs/custom-commands";
import * as pdfModule from "../src/pdf";

const FIXTURES = join(__dirname, "fixtures");

function loadFixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(join(FIXTURES, name)));
}

async function run(cmd: string) {
  const bash = getBash();
  const result = await bash.exec(cmd);
  return {
    ...result,
    out: result.stdout.replace(/\n$/, ""),
  };
}

// Promise.try is required by pdfjs-dist v5 but not available in Node <23
// @ts-ignore
const hasPromiseTry = typeof Promise.try === "function";

describe("shared custom commands (integration)", () => {
  beforeEach(() => {
    setCustomCommands(() => getSharedCustomCommands());
    resetVfs();
  });

  afterEach(() => {
    setCustomCommands(() => []);
    resetVfs();
  });

  describe("docx-to-text", () => {
    it("extracts text from a DOCX file", async () => {
      await writeFile("test.docx", loadFixture("test.docx"));
      const result = await run(
        "docx-to-text /home/user/uploads/test.docx /home/user/uploads/out.txt",
      );
      expect(result.exitCode).toBe(0);
      expect(result.out).toContain("Extracted text from DOCX");

      const text = await readFile("out.txt");
      expect(text).toContain("Hello from test document");
      expect(text).toContain("Second paragraph here");
    });

    it("prints usage when args are missing", async () => {
      const result = await run("docx-to-text");
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Usage:");
    });

    it("fails on non-existent file", async () => {
      const result = await run(
        "docx-to-text /home/user/uploads/nope.docx /home/user/uploads/out.txt",
      );
      expect(result.exitCode).toBe(1);
    });
  });

  describe("xlsx-to-csv", () => {
    it("converts a single sheet by index", async () => {
      await writeFile("test.xlsx", loadFixture("test.xlsx"));
      const result = await run(
        "xlsx-to-csv /home/user/uploads/test.xlsx /home/user/uploads/out.csv 0",
      );
      expect(result.exitCode).toBe(0);
      expect(result.out).toContain("Results");

      const csv = await readFile("out.csv");
      expect(csv).toContain("Name,Score");
      expect(csv).toContain("Alice,90");
      expect(csv).toContain("Bob,85");
    });

    it("converts a single sheet by name", async () => {
      await writeFile("test.xlsx", loadFixture("test.xlsx"));
      const result = await run(
        "xlsx-to-csv /home/user/uploads/test.xlsx /home/user/uploads/prices.csv Prices",
      );
      expect(result.exitCode).toBe(0);

      const csv = await readFile("prices.csv");
      expect(csv).toContain("Item,Price");
      expect(csv).toContain("Widget");
    });

    it("exports all sheets when no sheet arg given", async () => {
      await writeFile("test.xlsx", loadFixture("test.xlsx"));
      const result = await run(
        "xlsx-to-csv /home/user/uploads/test.xlsx /home/user/uploads/all.csv",
      );
      expect(result.exitCode).toBe(0);
      expect(result.out).toContain("Converted 2 sheets");
    });

    it("caps multi-sheet export summaries with a preview and omitted count", async () => {
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      for (const [index, name] of ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"].entries()) {
        const sheet = XLSX.utils.aoa_to_sheet([
          ["Name", "Value"],
          [name, index + 1],
        ]);
        XLSX.utils.book_append_sheet(workbook, sheet, name);
      }

      const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      await writeFile("many-sheets.xlsx", new Uint8Array(bytes));

      const result = await run(
        "xlsx-to-csv /home/user/uploads/many-sheets.xlsx /home/user/uploads/all.csv",
      );

      expect(result.exitCode).toBe(0);
      expect(result.out).toContain("Converted 5 sheets");
      expect(result.out).toContain("Preview:");
      expect(result.out).toContain('"Alpha"');
      expect(result.out).toContain('"Gamma"');
      expect(result.out).toContain("2 additional sheet export(s) omitted");
      expect(result.out).not.toContain('"Delta"');
      expect(result.out).not.toContain('"Epsilon"');
    });

    it("fails on invalid sheet name", async () => {
      await writeFile("test.xlsx", loadFixture("test.xlsx"));
      const result = await run(
        "xlsx-to-csv /home/user/uploads/test.xlsx /home/user/uploads/out.csv NoSuchSheet",
      );
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Sheet not found");
    });

    it("prints usage when args are missing", async () => {
      const result = await run("xlsx-to-csv");
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Usage:");
    });
  });

  describe("pdf-to-text", () => {
    it.skipIf(!hasPromiseTry)("extracts text from a PDF file", async () => {
      await writeFile("test.pdf", loadFixture("test.pdf"));
      const result = await run(
        "pdf-to-text /home/user/uploads/test.pdf /home/user/uploads/out.txt",
      );
      expect(result.exitCode).toBe(0);
      expect(result.out).toContain("Extracted text from");
      expect(result.out).toContain("page");

      const text = await readFile("out.txt");
      expect(text).toContain("Test PDF content");
      expect(text).toContain("Second line");
    });

    it("prints usage when args are missing", async () => {
      const result = await run("pdf-to-text");
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Usage:");
    });

    it("fails on non-existent file", async () => {
      const result = await run(
        "pdf-to-text /home/user/uploads/nope.pdf /home/user/uploads/out.txt",
      );
      expect(result.exitCode).toBe(1);
    });
  });

  describe("pdf-to-images", () => {
    it("caps rendered page summaries with a preview and omitted count", async () => {
      await writeFile("mock.pdf", new Uint8Array([1, 2, 3]));
      const originalCreateElement = document.createElement.bind(document);

      const loadPdfSpy = vi.spyOn(pdfModule, "loadPdfDocument").mockResolvedValue({
        numPages: 5,
        getPage: vi.fn(async (pageNum: number) => ({
          getViewport: () => ({ width: 800 + pageNum, height: 600 + pageNum }),
          render: () => ({ promise: Promise.resolve() }),
        })),
      } as Awaited<ReturnType<typeof pdfModule.loadPdfDocument>>);

      const createElementSpy = vi
        .spyOn(document, "createElement")
        .mockImplementation(((tagName: string) => {
          if (tagName !== "canvas") {
            return originalCreateElement(tagName);
          }

          return {
            width: 0,
            height: 0,
            getContext: () => ({}) as CanvasRenderingContext2D,
            toBlob: (callback: BlobCallback) => {
              callback?.(new Blob([new Uint8Array(2048)], { type: "image/png" }));
            },
          } as HTMLCanvasElement;
        }) as typeof document.createElement);

      const result = await run(
        "pdf-to-images /home/user/uploads/mock.pdf /home/user/uploads/rendered",
      );

      loadPdfSpy.mockRestore();
      createElementSpy.mockRestore();

      expect(result.exitCode).toBe(0);
      expect(result.out).toContain("Converted 5 page(s) from 5 total");
      expect(result.out).toContain("Preview:");
      expect(result.out).toContain("page-1.png");
      expect(result.out).toContain("page-3.png");
      expect(result.out).toContain("2 additional rendered page(s) omitted");
      expect(result.out).not.toContain("page-4.png");
      expect(result.out).not.toContain("page-5.png");
    });
  });

  describe("web-search", () => {
    const hasSearchKey =
      !!process.env.SERPER_API_KEY || !!process.env.TAVILY_API_KEY;

    it("prints usage when query is missing", async () => {
      const result = await run("web-search");
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Usage:");
    });

    it.skipIf(!hasSearchKey)("returns results for a query", async () => {
      const result = await run("web-search typescript --max=3 --json");
      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.out);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0]).toHaveProperty("title");
      expect(parsed[0]).toHaveProperty("url");
    });

    it.skipIf(!hasSearchKey)(
      "returns formatted text output by default",
      async () => {
        const result = await run("web-search javascript MDN --max=2");
        expect(result.exitCode).toBe(0);
        expect(result.out).toContain("1.");
      },
    );
  });

  describe("web-fetch", () => {
    it("prints usage when args are missing", async () => {
      const result = await run("web-fetch");
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Usage:");
    });

    it("fetches a text page and saves to file", async () => {
      const fetchMock = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(
          new Response("<html><body>Example Domain</body></html>", {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          }),
        );

      const result = await run(
        "web-fetch https://example.com /home/user/uploads/page.txt",
      );
      expect(result.exitCode).toBe(0);
      expect(result.out).toContain("Fetched text");

      const text = await readFile("page.txt");
      expect(text.toLowerCase()).toContain("example");
      fetchMock.mockRestore();
    });
  });
});
