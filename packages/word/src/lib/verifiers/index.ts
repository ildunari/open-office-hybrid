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
const WORD_REREAD_TOOL_NAMES = new Set([
  "get_document_text",
  "get_document_structure",
  "get_ooxml",
  "get_paragraph_ooxml",
]);

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

function hasTool(
  toolExecutions: NonNullable<TaskRecord["toolExecutions"]>,
  toolName: string,
): boolean {
  return toolExecutions.some((execution) => execution.toolName === toolName);
}

export function hasPostWriteReread(
  toolExecutions: NonNullable<TaskRecord["toolExecutions"]>,
): boolean {
  const writeExecution = [...toolExecutions]
    .reverse()
    .find(
      (execution) =>
        execution.toolName === "execute_office_js" && !execution.isError,
    );
  if (!writeExecution) return false;
  return toolExecutions.some(
    (execution) =>
      execution.timestamp >= writeExecution.timestamp &&
      WORD_REREAD_TOOL_NAMES.has(execution.toolName),
  );
}

export function getWordVerificationSuites(): VerificationSuite[] {
  return [
    {
      id: "word:write-progress",
      label: "Mutation task made write progress",
      appliesTo: (context) => {
        const planRisk = context.plan?.classification?.risk ?? "none";
        const taskMode = context.task?.mode ?? "discuss";
        return (
          context.app === "word" &&
          (planRisk !== "none" ||
            taskMode === "plan" ||
            taskMode === "execute" ||
            WORD_FORMAT_RE.test(context.request))
        );
      },
      verify: (context) => {
        const successfulWrites = context.toolExecutions.filter(
          (execution) =>
            execution.toolName === "execute_office_js" && !execution.isError,
        );
        const failedWrites = context.toolExecutions.filter(
          (execution) =>
            execution.toolName === "execute_office_js" && execution.isError,
        );
        const hadPostWriteReread =
          (context.task?.executionDiagnostics?.postWriteRereadCount ?? 0) > 0 ||
          (context.task?.executionDiagnostics == null &&
            hasPostWriteReread(context.toolExecutions));
        const loopReason =
          context.task?.executionDiagnostics?.noWriteLoopReason;

        if (successfulWrites.length === 0) {
          return {
            suiteId: "word:write-progress",
            label: "Mutation task made write progress",
            expectedEffect:
              "Mutation-capable Word tasks attempt at least one real write.",
            observedEffect: loopReason
              ? `No successful Word write detected. ${loopReason}`
              : failedWrites.length > 0
                ? "Word write was attempted but no successful write completed."
                : "No successful Word write was detected for the mutation-capable task.",
            status: failedWrites.length > 0 ? "failed" : "retryable",
            evidence: [
              ...context.toolExecutions.map((execution) => execution.toolName),
              ...(loopReason ? [loopReason] : []),
            ],
            retryable: failedWrites.length === 0,
          };
        }

        if (!hadPostWriteReread) {
          return {
            suiteId: "word:write-progress",
            label: "Mutation task made write progress",
            expectedEffect:
              "Each successful write is followed by a reread of the affected scope.",
            observedEffect:
              "A successful Word write completed, but no post-write reread was detected.",
            status: "retryable",
            evidence: context.toolExecutions.map(
              (execution) => execution.toolName,
            ),
            retryable: true,
          };
        }

        return {
          suiteId: "word:write-progress",
          label: "Mutation task made write progress",
          expectedEffect:
            "Mutation-capable Word tasks perform a write and reread the affected scope.",
          observedEffect:
            "A successful Word write was followed by a reread of the affected scope.",
          status: "passed",
          evidence: context.toolExecutions.map(
            (execution) => execution.toolName,
          ),
          retryable: false,
        };
      },
    },
    {
      id: "word:format-preserved",
      label: "Formatting preserved",
      appliesTo: (context) => WORD_FORMAT_RE.test(context.request),
      verify: (context) => {
        const hadWrite = hasTool(context.toolExecutions, "execute_office_js");
        const hadPostWriteReread =
          (context.task?.executionDiagnostics?.postWriteRereadCount ?? 0) > 0 ||
          (context.task?.executionDiagnostics == null &&
            hasPostWriteReread(context.toolExecutions));
        const hadFingerprintMismatch = context.promptNotes.some((note) =>
          /format(?:ting)? fingerprint mismatch|formatting drift/i.test(note),
        );
        return {
          suiteId: "word:format-preserved",
          label: "Formatting preserved",
          expectedEffect: "Formatting stays consistent after the edit.",
          observedEffect: hadFingerprintMismatch
            ? "A post-write reread detected formatting drift in the edited scope."
            : !hadWrite
              ? "No Word write detected to verify."
              : hadPostWriteReread
                ? "Word write was followed by a reread of nearby document state."
                : "Word write executed without a reread of the affected document state.",
          status: hadFingerprintMismatch
            ? "failed"
            : hadWrite && hadPostWriteReread
              ? "passed"
              : "retryable",
          evidence: [
            ...context.toolExecutions.map((execution) => execution.toolName),
            ...context.promptNotes,
          ],
          retryable:
            !hadFingerprintMismatch && !(hadWrite && hadPostWriteReread),
        };
      },
    },
    {
      id: "word:revision-safe",
      label: "Revision-safe edit",
      appliesTo: (context) => detectRevisionSensitiveRequest(context.request),
      verify: (context) => {
        const hadWrite = hasTool(context.toolExecutions, "execute_office_js");
        const hadWriteError = context.toolExecutions.some(
          (entry) => entry.isError,
        );
        const hadPostWriteReread =
          (context.task?.executionDiagnostics?.postWriteRereadCount ?? 0) > 0 ||
          (context.task?.executionDiagnostics == null &&
            hasPostWriteReread(context.toolExecutions));
        const hadRevisionPromptNote = context.promptNotes.some((note) =>
          /revision layer|tracked changes|revision-safe/i.test(note),
        );

        return {
          suiteId: "word:revision-safe",
          label: "Revision-safe edit",
          expectedEffect: "Tracked changes / revision-safe flow preserved.",
          observedEffect: hadWriteError
            ? "Write error detected during revision-sensitive flow."
            : !hadWrite
              ? "No Word write detected for the revision-sensitive request."
              : hadPostWriteReread && hadRevisionPromptNote
                ? "Revision-sensitive write was followed by a reread with revision guidance present."
                : "Revision-sensitive write lacked either a reread or explicit revision guidance.",
          status: hadWriteError
            ? "failed"
            : hadWrite && hadPostWriteReread && hadRevisionPromptNote
              ? "passed"
              : "retryable",
          evidence: [
            ...context.toolExecutions.map((entry) => entry.toolName),
            ...context.promptNotes,
          ],
          retryable: !hadWriteError,
        };
      },
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
