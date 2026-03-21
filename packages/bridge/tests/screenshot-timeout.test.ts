import { describe, expect, it } from "vitest";
import { getScreenshotTimeoutMs } from "../src/screenshot-timeout";

describe("getScreenshotTimeoutMs", () => {
  it("uses a longer default timeout for Word screenshots", () => {
    expect(getScreenshotTimeoutMs("word")).toBe(120_000);
  });

  it("keeps the standard default timeout for non-Word screenshots", () => {
    expect(getScreenshotTimeoutMs("excel")).toBe(30_000);
    expect(getScreenshotTimeoutMs("powerpoint")).toBe(30_000);
  });

  it("preserves an explicit timeout override", () => {
    expect(getScreenshotTimeoutMs("word", 45_000)).toBe(45_000);
  });
});
