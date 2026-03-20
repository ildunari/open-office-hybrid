export type PlanMode = "auto" | "manual" | "revised";

export type PlanStatus = "active" | "completed" | "failed" | "abandoned";

export type StepStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "skipped";

export type TaskComplexity = "trivial" | "simple" | "moderate" | "complex";

export type RiskLevel = "none" | "low" | "medium" | "high";

export interface TaskClassification {
  complexity: TaskComplexity;
  risk: RiskLevel;
  needsPlan: boolean;
  suggestedSteps?: number;
  rationale: string;
}

export type RuntimeMode =
  | "discuss"
  | "plan"
  | "execute"
  | "verify"
  | "awaiting_approval"
  | "blocked"
  | "completed";

export type StepKind = "read" | "analyze" | "write" | "verify" | "rollback";

export interface PlanStep {
  id: string;
  description: string;
  kind: StepKind;
  status: StepStatus;
  successCriteria: string;
  retryLimit: number;
  retryCount: number;
  scope?: Record<string, unknown>;
  patternIds?: string[];
  toolCalls: string[];
  after?: string[];
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface PlanRevisionNote {
  at: number;
  reason: string;
}

export interface ExecutionUnit {
  id: string;
  title: string;
  stepIds: string[];
  mode: Exclude<RuntimeMode, "discuss" | "completed">;
}

export interface VerificationIntent {
  id: string;
  label: string;
  expectedEffect: string;
}

export interface ExecutionPlan {
  id: string;
  userRequest: string;
  summary?: string;
  mode: PlanMode;
  status: PlanStatus;
  activeStepId?: string | null;
  requirements: string[];
  strategy: string[];
  executionUnits: ExecutionUnit[];
  verification: VerificationIntent[];
  approvalRequired: boolean;
  expectedEffects: string[];
  steps: PlanStep[];
  createdAt: number;
  updatedAt: number;
  classification: TaskClassification;
  revisionNotes: PlanRevisionNote[];
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "failed";

export interface TaskRecord {
  id: string;
  userRequest: string;
  mode?: RuntimeMode;
  status: TaskStatus;
  planId?: string;
  undoNarrative?: string;
  attachments?: string[];
  scopeSummary?: string;
  constraints?: string[];
  expectedEffects?: string[];
  approvalPending?: boolean;
  verificationSummary?: {
    status: "pending" | "passed" | "failed" | "retryable" | "skipped";
    failedVerifierIds?: string[];
    retryable?: boolean;
    lastVerifiedAt?: number;
  };
  handoff?: {
    taskId: string;
    mode: RuntimeMode;
    currentIntent: string;
    summary: string;
    activeScope?: string;
    constraints: string[];
    incompleteVerifications: string[];
    nextRecommendedAction: string;
    attachmentPaths?: string[];
    updatedAt: number;
  };
  toolExecutions?: Array<{
    toolCallId: string;
    toolName: string;
    isError: boolean;
    resultText: string;
    timestamp: number;
  }>;
  toolCallIds: string[];
  createdAt: number;
  updatedAt: number;
}
