import { describe, expect, it } from "vitest";
import {
  buildLocalDoctrinePromptSection,
  selectLocalDoctrineContributors,
} from "../src/skills/local-doctrine";
import { buildSkillsPromptSection, parseSkillMeta } from "../src/skills";

describe("parseSkillMeta", () => {
  it("parses valid frontmatter with name and description", () => {
    const content = `---
name: budget-writer
description: Writes budget reports
---

# Budget Writer

Some instructions here.`;
    const meta = parseSkillMeta(content);
    expect(meta).toEqual({
      name: "budget-writer",
      description: "Writes budget reports",
    });
  });

  it("parses frontmatter with optional platform field", () => {
    const content = `---
name: excel-formatter
description: Format Excel sheets
platform: excel
---

Instructions.`;
    const meta = parseSkillMeta(content);
    expect(meta).toEqual({
      name: "excel-formatter",
      description: "Format Excel sheets",
      platform: "excel",
    });
  });

  it("returns null when frontmatter is missing", () => {
    expect(parseSkillMeta("# No frontmatter here")).toBeNull();
  });

  it("returns null when name is missing", () => {
    const content = `---
description: Only description
---`;
    expect(parseSkillMeta(content)).toBeNull();
  });

  it("returns null when description is missing", () => {
    const content = `---
name: only-name
---`;
    expect(parseSkillMeta(content)).toBeNull();
  });

  it("returns null for empty frontmatter", () => {
    const content = `---
---`;
    expect(parseSkillMeta(content)).toBeNull();
  });
});

describe("buildSkillsPromptSection", () => {
  it("returns empty string for no skills", () => {
    expect(buildSkillsPromptSection([])).toBe("");
  });

  it("renders a single skill", () => {
    const result = buildSkillsPromptSection([
      { name: "analyzer", description: "Analyzes data" },
    ]);
    expect(result).toContain("<available_skills>");
    expect(result).toContain("<name>analyzer</name>");
    expect(result).toContain("<description>Analyzes data</description>");
    expect(result).toContain(
      "<location>/home/skills/analyzer/SKILL.md</location>",
    );
    expect(result).toContain("</available_skills>");
  });

  it("renders multiple skills", () => {
    const result = buildSkillsPromptSection([
      { name: "alpha", description: "First" },
      { name: "beta", description: "Second" },
    ]);
    expect(result).toContain("<name>alpha</name>");
    expect(result).toContain("<name>beta</name>");
  });

  it("includes instruction text about reading skill files", () => {
    const result = buildSkillsPromptSection([
      { name: "s", description: "d" },
    ]);
    expect(result).toContain(
      "Use the read tool to load a skill's file when the task matches",
    );
  });
});

describe("selectLocalDoctrineContributors", () => {
  it("selects a bounded GPT Word mutation doctrine set with the v3 Word source", () => {
    const contributors = selectLocalDoctrineContributors({
      hostApp: "word",
      providerFamily: "gpt",
      phase: "mutation",
    });

    expect(contributors.map((item) => item.id)).toEqual([
      "gpt-prompt-architect",
      "word-mastery-v3",
      "openword-best-practices",
    ]);
    expect(contributors[1]?.canonicalPath).toBe("skills/word-mastery-v3/SKILL.md");
    expect(contributors.some((item) => item.canonicalPath.includes("skills/word-mastery/SKILL.md"))).toBe(false);
  });

  it("selects the Claude prompt doctrine for Claude Word mutation runs", () => {
    const contributors = selectLocalDoctrineContributors({
      hostApp: "word",
      providerFamily: "claude",
      phase: "mutation",
    });

    expect(contributors.map((item) => item.id)).toEqual([
      "prompt-architect",
      "word-mastery-v3",
      "openword-best-practices",
    ]);
  });

  it("does not inject Word doctrine for non-editing or non-Word runs", () => {
    expect(
      selectLocalDoctrineContributors({
        hostApp: "word",
        providerFamily: "gpt",
        phase: "reviewer_live_review",
      }),
    ).toEqual([]);
    expect(
      selectLocalDoctrineContributors({
        hostApp: "powerpoint",
        providerFamily: "gpt",
        phase: "mutation",
      }),
    ).toEqual([]);
  });
});

describe("buildLocalDoctrinePromptSection", () => {
  it("renders active doctrine excerpts for Word mutation runs", () => {
    const result = buildLocalDoctrinePromptSection({
      hostApp: "word",
      providerFamily: "gpt",
      phase: "mutation",
    });

    expect(result).toContain("<active_doctrine");
    expect(result).toContain('provider_family="gpt"');
    expect(result).toContain("<skill id=\"gpt-prompt-architect\"");
    expect(result).toContain('canonical_path="skills/word-mastery-v3/SKILL.md"');
    expect(result).toContain("Scope discipline.");
    expect(result).toContain("Use named styles for every recurring element.");
    expect(result).toContain("Use OOXML replacement for mixed-run formatting");
  });
});
