import type {
  ScopeRiskEstimate,
  TaskClassification,
  TaskRecord,
  VerificationSuite,
} from "@office-agents/core/sdk";

const WORD_SCOPE_RE =
  /\b(selection|paragraph|section|document|table|content control|bookmark|header|footer)\b/i;
const WORD_FORMAT_RE = /\b(format|style|rewrite|replace|preserve)\b/i;
const WORD_REVISION_RE =
  /\b(redline|tracked changes|track changes|comment|review)\b/i;

export function detectWordNumericTokens(text: string): string[] {
  return (
    text.match(
      /\b\d+(?:\.\d+)?%?|\b\d+\s+(?:day|days|month|months|year|years)\b/gi,
    ) ?? []
  );
}

export function detectRevisionSensitiveRequest(text: string): boolean {
  return WORD_REVISION_RE.test(text);
}

export function estimateWordScopeRisk(
  request: string,
  classification: TaskClassification,
): ScopeRiskEstimate {
  const destructive =
    /\b(delete|remove|replace all|clear|overwrite|rebuild)\b/i.test(request) ||
    detectRevisionSensitiveRequest(request);
  const requiresApproval = destructive || classification.risk === "high";
  const constraints = [
    "Preserve existing formatting and document structure unless explicitly changed.",
  ];
  if (detectRevisionSensitiveRequest(request)) {
    constraints.push("Prefer tracked changes or revision-safe edits.");
  }
  const numericTokens = detectWordNumericTokens(request);
  if (numericTokens.length > 0) {
    constraints.push("Preserve numeric facts and deadlines exactly.");
  }

  return {
    level: destructive ? "high" : classification.risk,
    destructive,
    requiresApproval,
    reasons: requiresApproval
      ? ["High-impact Word mutation detected."]
      : ["No additional Word-specific approval gate required."],
    scopeSummary:
      request.match(WORD_SCOPE_RE)?.[0]?.toLowerCase() ?? "document scope",
    constraints,
    expectedEffects: [
      "Word content changes only within the requested scope.",
      "Formatting remains intact after the edit.",
    ],
  };
}

export function buildWordHandoffSummary(task: TaskRecord): string {
  const numericTokens = detectWordNumericTokens(task.userRequest);
  const numericNote =
    numericTokens.length > 0
      ? ` Preserve numeric tokens: ${numericTokens.join(", ")}.`
      : "";
  return `Resume Word task for ${task.scopeSummary ?? "document scope"}. ${task.userRequest}.${numericNote}`;
}

export function getWordVerificationSuites(): VerificationSuite[] {
  return [
    {
      id: "word:format-preserved",
      label: "Formatting preserved",
      appliesTo: (context) => WORD_FORMAT_RE.test(context.request),
      verify: (context) => {
        const hadWrite = context.toolExecutions.some(
          (execution) => execution.toolName === "execute_office_js",
        );
        return {
          suiteId: "word:format-preserved",
          label: "Formatting preserved",
          expectedEffect: "Formatting stays consistent after the edit.",
          observedEffect: hadWrite
            ? "Word write executed; no explicit formatting mismatch detected."
            : "No Word write detected to verify.",
          status: hadWrite ? "passed" : "retryable",
          evidence: context.promptNotes,
          retryable: !hadWrite,
        };
      },
    },
    {
      id: "word:revision-safe",
      label: "Revision-safe edit",
      appliesTo: (context) => detectRevisionSensitiveRequest(context.request),
      verify: (context) => ({
        suiteId: "word:revision-safe",
        label: "Revision-safe edit",
        expectedEffect: "Tracked changes / revision-safe flow preserved.",
        observedEffect: context.toolExecutions.some((entry) => entry.isError)
          ? "Write error detected during revision-sensitive flow."
          : "No write errors detected during revision-sensitive flow.",
        status: context.toolExecutions.some((entry) => entry.isError)
          ? "failed"
          : "passed",
        evidence: context.toolExecutions.map((entry) => entry.toolName),
        retryable: false,
      }),
    },
    {
      id: "word:coherence-reread",
      label: "Nearby coherence reread",
      appliesTo: (context) =>
        /\b(section|introduction|conclusion|summary|heading)\b/i.test(
          context.request,
        ),
      verify: (context) => ({
        suiteId: "word:coherence-reread",
        label: "Nearby coherence reread",
        expectedEffect: "Adjacent text still reads coherently after the edit.",
        observedEffect:
          context.promptNotes.length > 0
            ? "Prompt notes captured for coherence-aware follow-up."
            : "No explicit coherence follow-up evidence recorded.",
        status: context.promptNotes.length > 0 ? "passed" : "retryable",
        evidence: context.promptNotes,
        retryable: context.promptNotes.length === 0,
      }),
    },
  ];
}
