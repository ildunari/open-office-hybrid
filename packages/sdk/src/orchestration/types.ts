export type HostApp = "word" | "excel" | "powerpoint" | "generic";

export type PermissionMode =
  | "read_only"
  | "confirm_writes"
  | "confirm_risky"
  | "full_auto";

export type CapabilityBoundaryMode =
  | "read_only"
  | "standard"
  | "full_host_access";

export type ApprovalPolicyMode = "confirm_writes" | "confirm_risky" | "auto";

export type TaskPhase =
  | "discuss"
  | "plan"
  | "execute"
  | "verify"
  | "waiting_on_user"
  | "blocked"
  | "completed";

export type ActionClass =
  | "read"
  | "benign_write"
  | "structural_write"
  | "destructive_write"
  | "external_io"
  | "unsafe_eval"
  | "plan"
  | "neutral";

export interface HostScopeRef {
  kind: string;
  ref: string;
}

export interface CapabilityBoundary {
  mode: CapabilityBoundaryMode;
  blockedActionClasses: ActionClass[];
  description: string;
}

export interface ApprovalPolicy {
  mode: ApprovalPolicyMode;
  description: string;
}

export interface PolicyTraceEntry {
  id: string;
  event:
    | "prompt_submit"
    | "policy_check"
    | "approval_emitted"
    | "task_paused"
    | "task_resumed"
    | "task_completed";
  outcome: "allowed" | "approval_required" | "blocked";
  reason: string;
  actionClass?: ActionClass;
  toolName?: string;
  capabilityMode: CapabilityBoundaryMode;
  approvalMode: ApprovalPolicyMode;
  at: number;
}

export function capabilityBoundaryForPermissionMode(
  mode: PermissionMode = "confirm_risky",
): CapabilityBoundaryMode {
  switch (mode) {
    case "read_only":
      return "read_only";
    case "full_auto":
      return "full_host_access";
    default:
      return "standard";
  }
}

export function approvalPolicyForPermissionMode(
  mode: PermissionMode = "confirm_risky",
): ApprovalPolicyMode {
  switch (mode) {
    case "confirm_writes":
    case "read_only":
      return "confirm_writes";
    case "full_auto":
      return "auto";
    default:
      return "confirm_risky";
  }
}

export function permissionModeFromPolicy(
  capabilityMode: CapabilityBoundaryMode,
  approvalMode: ApprovalPolicyMode,
): PermissionMode {
  if (capabilityMode === "read_only") {
    return "read_only";
  }
  if (capabilityMode === "full_host_access" && approvalMode === "auto") {
    return "full_auto";
  }
  if (approvalMode === "confirm_writes") {
    return "confirm_writes";
  }
  return "confirm_risky";
}

export interface WaitingState {
  kind: "approval" | "clarification" | "retry_exhausted";
  reason: string;
  resumeMessage: string;
  actionClass?: ActionClass;
  scopes?: HostScopeRef[];
  createdAt: number;
}
