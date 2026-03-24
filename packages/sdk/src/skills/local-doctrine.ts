import gptPromptArchitectSkill from "../../../../skills/gpt-prompt-architect/SKILL.md?raw";
import openwordBestPracticesSkill from "../../../../skills/openword-best-practices/SKILL.md?raw";
import promptArchitectSkill from "../../../../skills/prompt-architect/SKILL.md?raw";
import wordMasteryV3Skill from "../../../../skills/word-mastery-v3/SKILL.md?raw";
import type { HostApp } from "../orchestration/types";
import type { PromptPhase, PromptProviderFamily } from "../prompt-contract";
import { parseSkillMeta } from "./index";

export interface LocalDoctrineContributor {
  id: string;
  name: string;
  description: string;
  canonicalPath: string;
  rationale: string;
  excerpt: string;
}

interface LocalDoctrineDefinition {
  id: string;
  canonicalPath: string;
  raw: string;
  headings: string[];
  rationale: string;
}

const WORD_MUTATION_PHASES = new Set<PromptPhase>([
  "mutation",
  "resume",
  "blocked",
]);

const LOCAL_DOCTRINE: Record<string, LocalDoctrineDefinition> = {
  "prompt-architect": {
    id: "prompt-architect",
    canonicalPath: "skills/prompt-architect/SKILL.md",
    raw: promptArchitectSkill,
    headings: ["## Three Principles", "## Model Behavioral Summary"],
    rationale:
      "Apply Claude-specific prompt calibration when Hybrid Word is running on an Anthropic/Claude path.",
  },
  "gpt-prompt-architect": {
    id: "gpt-prompt-architect",
    canonicalPath: "skills/gpt-prompt-architect/SKILL.md",
    raw: gptPromptArchitectSkill,
    headings: ["## Three Principles", "## CTCO Pattern Quick Reference"],
    rationale:
      "Apply GPT-specific prompt calibration when Hybrid Word is running on an OpenAI/GPT path.",
  },
  "word-mastery-v3": {
    id: "word-mastery-v3",
    canonicalPath: "skills/word-mastery-v3/SKILL.md",
    raw: wordMasteryV3Skill,
    headings: [
      "## Universal rules",
      "## Default posture for existing documents",
      "## Done condition",
    ],
    rationale:
      "Use the canonical local Word doctrine source for structure, style discipline, and document-safe editing decisions.",
  },
  "openword-best-practices": {
    id: "openword-best-practices",
    canonicalPath: "skills/openword-best-practices/SKILL.md",
    raw: openwordBestPracticesSkill,
    headings: [
      "## Tool Selection by Task",
      "## Default Read Workflow",
      "## Formatting-Sensitive Editing Workflow",
      "## Critical Edge Cases",
    ],
    rationale:
      "Apply Word tool-ordering, verification, and formatting-preservation workflow guidance during editing runs.",
  },
};

function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractHeadingSection(markdown: string, heading: string): string | null {
  const normalized = stripFrontmatter(markdown);
  const pattern = new RegExp(
    `(^${escapeRegExp(heading)}\\s*$[\\s\\S]*?)(?=^##\\s|^#\\s|\\Z)`,
    "m",
  );
  const match = normalized.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function extractExcerpt(markdown: string, headings: string[]): string {
  const sections = headings
    .map((heading) => extractHeadingSection(markdown, heading))
    .filter((value): value is string => Boolean(value));
  if (sections.length > 0) {
    return sections.join("\n\n").trim();
  }
  return stripFrontmatter(markdown);
}

function resolvePromptDoctrineId(
  providerFamily: PromptProviderFamily,
): string | null {
  if (providerFamily === "claude") return "prompt-architect";
  if (providerFamily === "gpt") return "gpt-prompt-architect";
  return null;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function selectLocalDoctrineContributors(options: {
  hostApp?: HostApp;
  providerFamily: PromptProviderFamily;
  phase: PromptPhase;
}): LocalDoctrineContributor[] {
  if (options.hostApp !== "word") return [];
  if (!WORD_MUTATION_PHASES.has(options.phase)) return [];

  const selectedIds = [
    resolvePromptDoctrineId(options.providerFamily),
    "word-mastery-v3",
    "openword-best-practices",
  ].filter((value): value is string => Boolean(value));

  return selectedIds.map((id) => {
    const definition = LOCAL_DOCTRINE[id];
    const meta = parseSkillMeta(definition.raw);
    return {
      id: definition.id,
      name: meta?.name ?? definition.id,
      description: meta?.description ?? "",
      canonicalPath: definition.canonicalPath,
      rationale: definition.rationale,
      excerpt: extractExcerpt(definition.raw, definition.headings),
    };
  });
}

export function buildLocalDoctrinePromptSection(options: {
  hostApp?: HostApp;
  providerFamily: PromptProviderFamily;
  phase: PromptPhase;
}): string {
  const contributors = selectLocalDoctrineContributors(options);
  if (contributors.length === 0) return "";

  const renderedSkills = contributors
    .map(
      (contributor) => `  <skill id="${xmlEscape(contributor.id)}" name="${xmlEscape(contributor.name)}" canonical_path="${xmlEscape(contributor.canonicalPath)}">
    <why>${xmlEscape(contributor.rationale)}</why>
    <excerpt><![CDATA[
${contributor.excerpt}
]]></excerpt>
  </skill>`,
    )
    .join("\n");

  return `<active_doctrine host_app="${xmlEscape(options.hostApp ?? "generic")}" provider_family="${xmlEscape(options.providerFamily)}" phase="${xmlEscape(options.phase)}">
${renderedSkills}
</active_doctrine>`;
}
