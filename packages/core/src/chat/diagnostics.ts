import type {
  ActivePatternMetadata,
  ApprovalPolicy,
  CapabilityBoundary,
  CompletionArtifact,
  PolicyTraceEntry,
  RuntimeState,
  VerificationRunSummary,
} from "@office-agents/sdk";

export type DiagnosticsStateInput = Pick<
  RuntimeState,
  | "mode"
  | "taskPhase"
  | "permissionMode"
  | "capabilityBoundary"
  | "approvalPolicy"
  | "instructionSources"
  | "policyTrace"
  | "activeHookNames"
  | "activePatternMetadata"
  | "activeVerifierIds"
  | "threads"
  | "activeThreadId"
  | "waitingState"
  | "handoff"
  | "degradedGuardrails"
  | "compactionState"
  | "completionArtifacts"
  | "lastVerification"
>;

export interface DiagnosticsModel {
  runtimeTruth: {
    mode: RuntimeState["mode"];
    taskPhase: RuntimeState["taskPhase"];
    waitingState: RuntimeState["waitingState"]["kind"] | null;
    waitingReason: string | null;
    handoffSummary: string | null;
    nextRecommendedAction: string | null;
    verificationStatus: VerificationRunSummary["status"] | null;
    verificationRetryable: boolean;
    degradedGuardrails: string[];
  };
  permissionMode: RuntimeState["permissionMode"];
  capabilityBoundary: CapabilityBoundary;
  approvalPolicy: ApprovalPolicy;
  instructionSources: DiagnosticsStateInput["instructionSources"];
  recentPolicyTrace: PolicyTraceEntry[];
  activeHooks: string[];
  activePatterns: ActivePatternMetadata[];
  activeVerifierIds: string[];
  activeThread: DiagnosticsStateInput["threads"][number] | null;
  otherThreads: DiagnosticsStateInput["threads"];
  compactionState: DiagnosticsStateInput["compactionState"];
  completionArtifacts: CompletionArtifact[];
  lastVerification: VerificationRunSummary | null;
}

export function buildDiagnosticsModel(
  state: DiagnosticsStateInput,
): DiagnosticsModel {
  const activeThread =
    state.threads.find((thread) => thread.id === state.activeThreadId) ?? null;
  const otherThreads = state.threads.filter(
    (thread) => thread.id !== state.activeThreadId,
  );

  return {
    runtimeTruth: {
      mode: state.mode,
      taskPhase: state.taskPhase,
      waitingState: state.waitingState?.kind ?? null,
      waitingReason: state.waitingState?.reason ?? null,
      handoffSummary: state.handoff?.summary ?? null,
      nextRecommendedAction: state.handoff?.nextRecommendedAction ?? null,
      verificationStatus: state.lastVerification?.status ?? null,
      verificationRetryable: state.lastVerification?.retryable ?? false,
      degradedGuardrails: [...state.degradedGuardrails],
    },
    permissionMode: state.permissionMode,
    capabilityBoundary: state.capabilityBoundary,
    approvalPolicy: state.approvalPolicy,
    instructionSources: [...state.instructionSources].sort(
      (a, b) => a.precedence - b.precedence,
    ),
    recentPolicyTrace: [...state.policyTrace].slice(-6).reverse(),
    activeHooks: [...state.activeHookNames].sort(),
    activePatterns: [...state.activePatternMetadata],
    activeVerifierIds: [...state.activeVerifierIds].sort(),
    activeThread,
    otherThreads,
    compactionState: state.compactionState,
    completionArtifacts: state.completionArtifacts.slice(0, 5),
    lastVerification: state.lastVerification,
  };
}
