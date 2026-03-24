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

export interface PlanMilestone {
  id: string;
  title: string;
  stepIds: string[];
  status: "pending" | "in_progress" | "completed";
  summary?: string;
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
  milestones: PlanMilestone[];
  approvalRequired: boolean;
  expectedEffects: string[];
  steps: PlanStep[];
  createdAt: number;
  updatedAt: number;
  classification: TaskClassification;
  revisionNotes: PlanRevisionNote[];
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "failed";

export type ThreadStatus =
  | "active"
  | "paused"
  | "blocked"
  | "completed"
  | "compacted";

export interface TaskThreadSummary {
  id: string;
  title: string;
  status: ThreadStatus;
  rootTaskId: string | null;
  currentTaskId: string | null;
  forkedFromThreadId: string | null;
  compactedSummary: string | null;
  milestoneIds: string[];
  updatedAt: number;
}

export interface CompletionArtifact {
  id: string;
  threadId: string;
  taskId: string;
  summary: string;
  verificationStatus: "pending" | "passed" | "failed" | "retryable" | "skipped";
  changedScopes: string[];
  createdAt: number;
}

export interface CompactionArtifact {
  id: string;
  threadId: string;
  summary: string;
  sourceTaskIds: string[];
  createdAt: number;
}

export interface TaskRecord {
  id: string;
  userRequest: string;
  threadId?: string;
  milestoneId?: string;
  mode?: RuntimeMode;
  status: TaskStatus;
  planId?: string;
  undoNarrative?: string;
  attachments?: string[];
  scopeSummary?: string;
  constraints?: string[];
  expectedEffects?: string[];
  approvalPending?: boolean;
  approvalRequest?: import("../verification").ApprovalRequest;
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
  executionDiagnostics?: {
    preWriteReadCount: number;
    preWriteInspectionCount: number;
    scopeReadCount: number;
    writeCount: number;
    failedWriteCount: number;
    postWriteRereadCount: number;
    firstReadAt?: number;
    firstWriteAt?: number;
    planAdvancedBeyondInspection: boolean;
    noWriteLoopDetected?: boolean;
    noWriteLoopReason?: string;
  };
  toolCallIds: string[];
  resumeCount?: number;
  createdAt: number;
  updatedAt: number;
}
