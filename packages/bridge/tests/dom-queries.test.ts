import { describe, expect, it } from "vitest";
import { DOM_QUERIES } from "../src/dom-queries";

const EXPECTED_QUERIES = [
  "visible-panels",
  "scroll-positions",
  "computed-theme",
  "layout-metrics",
  "message-count",
];

describe("DOM_QUERIES", () => {
  it("exports exactly the five expected query keys", () => {
    const keys = Object.keys(DOM_QUERIES).sort();
    expect(keys).toEqual([...EXPECTED_QUERIES].sort());
  });

  for (const name of EXPECTED_QUERIES) {
    describe(`query: ${name}`, () => {
      it("has a non-empty description string", () => {
        expect(typeof DOM_QUERIES[name].description).toBe("string");
        expect(DOM_QUERIES[name].description.trim().length).toBeGreaterThan(0);
      });

      it("has a non-empty code string", () => {
        expect(typeof DOM_QUERIES[name].code).toBe("string");
        expect(DOM_QUERIES[name].code.trim().length).toBeGreaterThan(0);
      });

      it("has parseable JavaScript in the code field", () => {
        // Wrap in an async function body so `return` statements are valid.
        const src = `(async function() { ${DOM_QUERIES[name].code} })`;
        expect(() => new Function(src)).not.toThrow();
      });
    });
  }

  it("each entry has only description and code as its fields", () => {
    for (const [key, entry] of Object.entries(DOM_QUERIES)) {
      const fields = Object.keys(entry).sort();
      expect(
        fields,
        `query "${key}" should have exactly {code, description}`,
      ).toEqual(["code", "description"]);
    }
  });
});
