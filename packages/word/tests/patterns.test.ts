import { HookRegistry } from "@office-agents/core/sdk";
import { describe, expect, it } from "vitest";
import { WORD_REASONING_PATTERNS } from "../src/lib/patterns";

const moderateClassification = {
  complexity: "moderate" as const,
  risk: "medium" as const,
  needsPlan: true,
  rationale: "Multi-step edit.",
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

describe("WORD_REASONING_PATTERNS", () => {
  it("exports the approved medium Word pattern ids", () => {
    expect(WORD_REASONING_PATTERNS.map((pattern) => pattern.id)).toEqual([
      "word:semantic-load-bearing",
      "word:format-fingerprinting",
      "word:coherence-horizon",
      "word:revision-layer-awareness",
      "word:numeric-sanctity",
      "word:long-document-working-set",
    ]);
  });

  it("triggers semantic-load-bearing for compression-style requests", () => {
    const pattern = WORD_REASONING_PATTERNS.find(
      (entry) => entry.id === "word:semantic-load-bearing",
    );

    expect(
      pattern?.triggers(moderateClassification, {
        userRequest: "Summarize this section and tighten the prose by 30%.",
      } as never),
    ).toBe(true);
    expect(
      pattern?.triggers(moderateClassification, {
        userRequest: "Make the heading blue.",
      } as never),
    ).toBe(false);
  });

  it("triggers numeric-sanctity only when the request implies numeric sensitivity", () => {
    const pattern = WORD_REASONING_PATTERNS.find(
      (entry) => entry.id === "word:numeric-sanctity",
    );

    expect(
      pattern?.triggers(moderateClassification, {
        userRequest: "Rewrite this clause but preserve the 45 day deadline and 12% fee.",
      } as never),
    ).toBe(true);
    expect(
      pattern?.triggers(moderateClassification, {
        userRequest: "Polish the transition wording.",
      } as never),
    ).toBe(false);
  });

  it("registers hook-backed prompt notes when a matching pattern activates", async () => {
    const pattern = WORD_REASONING_PATTERNS.find(
      (entry) => entry.id === "word:semantic-load-bearing",
    );
    const registry = new HookRegistry();
    const disposable = pattern?.activate(registry, {});

    const result = await registry.runPreHooks(
      createPreContext("execute_office_js", {
        code: "paragraph.clear(); paragraph.insertText('Shorter version', 'Start');",
      }),
    );

    disposable?.dispose();

    expect(result.promptNotes?.length).toBeGreaterThan(0);
    expect(result.promptNotes?.[0]?.text).toContain("structural");
  });

  it("adds long-document scope notes on read tools when the long-doc pattern activates", async () => {
    const pattern = WORD_REASONING_PATTERNS.find(
      (entry) => entry.id === "word:long-document-working-set",
    );
    const registry = new HookRegistry();
    const disposable = pattern?.activate(registry, {});

    const result = await registry.runPreHooks(
      createPreContext("get_document_text", {
        startParagraph: 0,
        endParagraph: 250,
      }),
    );

    disposable?.dispose();

    expect(result.promptNotes?.some((note) => note.text.includes("working set"))).toBe(
      true,
    );
  });
});
