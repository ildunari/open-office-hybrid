import { HookRegistry } from "@office-agents/core/sdk";
import { describe, expect, it } from "vitest";
import { getPowerPointReasoningPatterns } from "../src/lib/patterns";

const moderateClassification = {
  complexity: "moderate" as const,
  risk: "medium" as const,
  needsPlan: true,
  rationale: "Multi-step slide edit.",
};

function createPreContext(toolName: string, params: Record<string, unknown> = {}) {
  return {
    toolName,
    tags: ["write"] as const,
    params,
    toolCallId: "tc-1",
    budget: { totalMs: 1000, elapsedMs: 0 },
    captures: new Map<string, unknown>(),
    sessionState: {
      readScopes: new Set<string>(),
      formatFingerprints: new Map<string, string>(),
      custom: new Map<string, unknown>(),
    },
  };
}

describe("PowerPoint reasoning patterns", () => {
  const patterns = getPowerPointReasoningPatterns();

  it("exports the approved PowerPoint pattern ids", () => {
    expect(patterns.map((pattern) => pattern.id)).toEqual([
      "powerpoint:layout-verification",
      "powerpoint:template-preservation",
      "powerpoint:chart-data-integrity",
    ]);
  });

  it("triggers layout verification for layout-sensitive slide work", () => {
    const pattern = patterns.find(
      (entry) => entry.id === "powerpoint:layout-verification",
    );

    expect(
      pattern?.triggers(moderateClassification, {
        userRequest: "Reflow this slide so the title and bullets fit without overlap.",
      } as never),
    ).toBe(true);
    expect(
      pattern?.triggers(moderateClassification, {
        userRequest: "Duplicate slide 3.",
      } as never),
    ).toBe(false);
  });

  it("registers prompt notes for chart-sensitive edits", async () => {
    const pattern = patterns.find(
      (entry) => entry.id === "powerpoint:chart-data-integrity",
    );
    const registry = new HookRegistry();
    const disposable = pattern?.activate(registry, {});

    const result = await registry.runPreHooks(
      createPreContext("edit_slide_chart", {
        instruction: "Update the chart data and labels.",
      }),
    );

    disposable?.dispose();

    expect(result.promptNotes?.[0]?.text).toContain("chart");
  });
});
