export type HostApp = "word" | "excel" | "powerpoint" | "generic";

export type PermissionMode =
  | "read_only"
  | "confirm_writes"
  | "confirm_risky"
  | "full_auto";

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

export interface WaitingState {
  kind: "approval" | "clarification" | "retry_exhausted";
  reason: string;
  resumeMessage: string;
  actionClass?: ActionClass;
  scopes?: HostScopeRef[];
  createdAt: number;
}
