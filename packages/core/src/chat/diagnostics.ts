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
  | "compactionState"
  | "completionArtifacts"
  | "lastVerification"
>;

export interface DiagnosticsModel {
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
