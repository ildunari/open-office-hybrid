import type { HookRegistry, ReasoningPattern } from "@office-agents/core/sdk";

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function asHookRegistry(registry: unknown): HookRegistry {
  return registry as HookRegistry;
}

function requestText(plan?: { userRequest?: string }): string {
  return plan?.userRequest?.toLowerCase() ?? "";
}

const SEMANTIC_PATTERNS = [
  /\bsummarize\b/i,
  /\bshorten\b/i,
  /\bcondense\b/i,
  /\btighten\b/i,
  /\bcompress\b/i,
];

const NUMERIC_PATTERNS = [
  /\d/,
  /%/,
  /\b(day|days|deadline|fee|amount|revenue|price|cost)\b/i,
];

export const WORD_REASONING_PATTERNS: ReasoningPattern[] = [
  {
    id: "word:semantic-load-bearing",
    name: "Semantic Load-Bearing",
    apps: ["word"],
    defaultState: () => ({}),
    triggers: (_classification, plan) =>
      matchesAny(requestText(plan), SEMANTIC_PATTERNS),
    describeActivation: () => ({
      id: "word:semantic-load-bearing",
      reason: "The request implies summarization or compression.",
      expectedVerifierIds: ["word:coherence-reread"],
    }),
    activate: (registry) => {
      const hooks = asHookRegistry(registry);
      return hooks.registerPre({
        name: "word:semantic-load-bearing:note",
        selector: { toolNames: ["execute_office_js"] },
        speed: "sync",
        source: { patternId: "word:semantic-load-bearing", hookName: "note" },
        execute: () => ({
          action: "continue",
          promptNotes: [
            {
              level: "info",
              text:
                "Preserve structural and evidential meaning before compressing prose. " +
                "Keep structural claims, qualified statements, citations, and named entities intact.",
              source: {
                patternId: "word:semantic-load-bearing",
                hookName: "note",
              },
            },
          ],
        }),
      });
    },
  },
  {
    id: "word:format-fingerprinting",
    name: "Format Fingerprinting",
    apps: ["word"],
    defaultState: () => ({}),
    triggers: (classification, plan) =>
      classification.risk !== "low" &&
      /\b(format|style|rewrite|replace|preserve)\b/i.test(requestText(plan)),
    describeActivation: () => ({
      id: "word:format-fingerprinting",
      reason: "The request risks changing existing formatting.",
      expectedVerifierIds: ["word:format-preserved"],
    }),
    activate: (registry) => {
      const hooks = asHookRegistry(registry);
      return hooks.registerPre({
        name: "word:format-fingerprinting:note",
        selector: { toolNames: ["execute_office_js"] },
        speed: "sync",
        source: { patternId: "word:format-fingerprinting", hookName: "note" },
        execute: () => ({
          action: "continue",
          promptNotes: [
            {
              level: "info",
              text:
                "Preserve run-level formatting when rewriting existing content. " +
                "Prefer OOXML inspection or font-property replay before and after the edit.",
              source: {
                patternId: "word:format-fingerprinting",
                hookName: "note",
              },
            },
          ],
        }),
      });
    },
  },
  {
    id: "word:coherence-horizon",
    name: "Coherence Horizon",
    apps: ["word"],
    defaultState: () => ({}),
    triggers: (classification, plan) =>
      classification.needsPlan &&
      /\b(section|heading|document|conclusion|introduction|flow|coherence)\b/i.test(
        requestText(plan),
      ),
    describeActivation: () => ({
      id: "word:coherence-horizon",
      reason: "The request touches section-level coherence.",
      expectedVerifierIds: ["word:coherence-reread"],
    }),
    activate: (registry) => {
      const hooks = asHookRegistry(registry);
      return hooks.registerPre({
        name: "word:coherence-horizon:note",
        selector: { toolNames: ["get_document_text", "execute_office_js"] },
        speed: "sync",
        source: { patternId: "word:coherence-horizon", hookName: "note" },
        execute: () => ({
          action: "continue",
          promptNotes: [
            {
              level: "info",
              text: "Check the nearby heading, opening sentence, and closing sentence so the edited section stays coherent with adjacent content.",
              source: {
                patternId: "word:coherence-horizon",
                hookName: "note",
              },
            },
          ],
        }),
      });
    },
  },
  {
    id: "word:revision-layer-awareness",
    name: "Revision Layer Awareness",
    apps: ["word"],
    defaultState: () => ({}),
    triggers: (_classification, plan) =>
      /\b(redline|redlining|track changes|tracked changes|review|comment)\b/i.test(
        requestText(plan),
      ),
    describeActivation: () => ({
      id: "word:revision-layer-awareness",
      reason: "The request is revision/comment sensitive.",
      expectedVerifierIds: ["word:revision-safe"],
    }),
    activate: (registry) => {
      const hooks = asHookRegistry(registry);
      return hooks.registerPre({
        name: "word:revision-layer-awareness:note",
        selector: { toolNames: ["execute_office_js"] },
        speed: "sync",
        source: {
          patternId: "word:revision-layer-awareness",
          hookName: "note",
        },
        execute: () => ({
          action: "continue",
          promptNotes: [
            {
              level: "warning",
              text: "Preserve the document's revision layer: prefer tracked changes, comments, and replace-in-place edits over destructive clear-and-reinsert workflows.",
              source: {
                patternId: "word:revision-layer-awareness",
                hookName: "note",
              },
            },
          ],
        }),
      });
    },
  },
  {
    id: "word:numeric-sanctity",
    name: "Numeric Sanctity",
    apps: ["word"],
    defaultState: () => ({}),
    triggers: (_classification, plan) =>
      matchesAny(requestText(plan), NUMERIC_PATTERNS),
    describeActivation: () => ({
      id: "word:numeric-sanctity",
      reason: "The request contains numeric or deadline-sensitive content.",
      expectedVerifierIds: ["word:coherence-reread"],
    }),
    activate: (registry) => {
      const hooks = asHookRegistry(registry);
      return hooks.registerPre({
        name: "word:numeric-sanctity:note",
        selector: { toolNames: ["execute_office_js"] },
        speed: "sync",
        source: { patternId: "word:numeric-sanctity", hookName: "note" },
        execute: () => ({
          action: "continue",
          promptNotes: [
            {
              level: "warning",
              text: "Preserve numeric facts, dates, percentages, fees, and deadlines exactly unless the user explicitly asked to change them.",
              source: {
                patternId: "word:numeric-sanctity",
                hookName: "note",
              },
            },
          ],
        }),
      });
    },
  },
  {
    id: "word:long-document-working-set",
    name: "Long-Document Working Set",
    apps: ["word"],
    defaultState: () => ({}),
    triggers: (classification, plan) =>
      classification.complexity === "complex" ||
      /\b(long document|entire document|whole document|appendix|chapter)\b/i.test(
        requestText(plan),
      ),
    describeActivation: () => ({
      id: "word:long-document-working-set",
      reason: "The request implies a large document scope.",
      expectedVerifierIds: ["word:coherence-reread"],
    }),
    activate: (registry) => {
      const hooks = asHookRegistry(registry);
      return hooks.registerPre({
        name: "word:long-document-working-set:note",
        selector: { toolNames: ["get_document_text", "get_ooxml"] },
        speed: "sync",
        source: {
          patternId: "word:long-document-working-set",
          hookName: "note",
        },
        execute: (ctx) => {
          const start = Number(
            ctx.params.startParagraph ?? ctx.params.startChild ?? 0,
          );
          const endRaw =
            ctx.params.endParagraph ?? ctx.params.endChild ?? start;
          const end = endRaw === "end" ? start + 250 : Number(endRaw);
          if (Number.isNaN(start) || Number.isNaN(end) || end - start < 100) {
            return { action: "continue" };
          }

          return {
            action: "continue",
            promptNotes: [
              {
                level: "info",
                text: "Large range detected; work from a bounded working set and verify each chunk before expanding scope.",
                source: {
                  patternId: "word:long-document-working-set",
                  hookName: "note",
                },
              },
            ],
          };
        },
      });
    },
  },
];

export function getWordReasoningPatterns(): ReasoningPattern[] {
  return [...WORD_REASONING_PATTERNS];
}
