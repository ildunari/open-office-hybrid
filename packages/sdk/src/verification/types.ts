import type { OfficeApp } from "../context/types";
import type { ActionClass, HostScopeRef } from "../orchestration/types";
import type {
  ExecutionPlan,
  RiskLevel,
  RuntimeMode,
  TaskRecord,
} from "../planning";

export type VerificationStatus =
  | "pending"
  | "running"
  | "passed"
  | "failed"
  | "retryable"
  | "skipped";

export interface VerificationResult {
  suiteId: string;
  label: string;
  expectedEffect: string;
  observedEffect: string;
  status: VerificationStatus;
  evidence: string[];
  retryable: boolean;
}

export interface VerificationContext {
  app?: OfficeApp;
  mode: RuntimeMode;
  request: string;
  plan: ExecutionPlan | null;
  task: TaskRecord | null;
  toolExecutions: NonNullable<TaskRecord["toolExecutions"]>;
  promptNotes: string[];
}

export interface VerificationSuite {
  id: string;
  label: string;
  appliesTo: (context: VerificationContext) => boolean;
  verify: (
    context: VerificationContext,
  ) => Promise<VerificationResult | null> | VerificationResult | null;
}

export interface VerificationRunSummary {
  status: VerificationStatus;
  retryable: boolean;
  results: VerificationResult[];
}

export interface ScopeRiskEstimate {
  level: RiskLevel;
  destructive: boolean;
  requiresApproval: boolean;
  reasons: string[];
  scopeSummary?: string;
  constraints?: string[];
  expectedEffects?: string[];
}

export interface ApprovalRequest {
  level: RiskLevel;
  destructive: boolean;
  reason: string;
  requestedAt: number;
  uiMessage?: string;
  actionClass?: ActionClass;
  scopes?: HostScopeRef[];
}

export interface HandoffPacket {
  taskId: string;
  mode: RuntimeMode;
  currentIntent: string;
  activeScope?: string;
  constraints: string[];
  incompleteVerifications: string[];
  nextRecommendedAction: string;
  summary: string;
  attachmentPaths?: string[];
  updatedAt: number;
}

export interface ActivePatternMetadata {
  id: string;
  reason: string;
  scope?: string;
  expectedVerifierIds?: string[];
}
