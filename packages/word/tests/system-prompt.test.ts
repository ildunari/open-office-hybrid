import { describe, expect, it } from "vitest";
import { buildWordSystemPrompt } from "../src/lib/system-prompt";

describe("buildWordSystemPrompt", () => {
  it("removes behavior that is now enforced by hooks, plans, and patterns", () => {
    const prompt = buildWordSystemPrompt([]);

    expect(prompt).not.toContain("## ⚠️ CRITICAL: Preserving Formatting");
    expect(prompt).not.toContain("### Mandatory workflow for editing existing paragraphs:");
    expect(prompt).not.toContain("7. **Build incrementally**");
    expect(prompt).not.toContain("## Document Editing Best Practices");
    expect(prompt).not.toContain("## PE/Law Document Workflows");
  });

  it("keeps the lightweight read-before-write reminder and the OOXML reference material", () => {
    const prompt = buildWordSystemPrompt([]);

    expect(prompt).toContain("5. **Read before writing**");
    expect(prompt).toContain("### Alternative: Use font properties after insertText");
    expect(prompt).toContain("## OOXML Insertion");
  });
});
