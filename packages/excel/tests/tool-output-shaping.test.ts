import { describe, expect, it } from "vitest";
import { buildEvalOfficeJsPayload } from "../src/lib/tools/output-shaping";

describe("excel tool output shaping", () => {
  it("keeps small Office.js results inline", async () => {
    const writes: Array<{ path: string; content: string | Uint8Array }> = [];
    const payload = await buildEvalOfficeJsPayload(
      "tc_small",
      { ok: true, rows: 3 },
      [{ sheetId: 1, range: "A1:B2" }],
      async (path, content) => {
        writes.push({ path, content });
      },
    );

    expect(payload).toEqual({
      success: true,
      result: { ok: true, rows: 3 },
      _dirtyRanges: [{ sheetId: 1, range: "A1:B2" }],
    });
    expect(writes).toHaveLength(0);
  });

  it("spills large Office.js results to VFS metadata", async () => {
    const writes: Array<{ path: string; content: string | Uint8Array }> = [];
    const payload = await buildEvalOfficeJsPayload(
      "tc_large",
      { html: "<div>" + "A".repeat(5000) + "</div>" },
      [],
      async (path, content) => {
        writes.push({ path, content });
      },
    );

    expect(payload).toMatchObject({
      success: true,
      result: null,
      rawRef: {
        path: "/home/user/tool-results/eval-officejs-tc_large.json",
        format: "json",
      },
      truncated: true,
    });
    expect(writes).toHaveLength(1);
  });
});
