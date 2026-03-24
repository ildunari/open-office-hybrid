import type { TaskClassification, TaskRecord } from "../planning";
import { saveTaskRecord, type TaskRecordEntry } from "../storage/db";
import type {
  ApprovalRequest,
  HandoffPacket,
  VerificationResult,
} from "../verification/types";
import { buildUndoNarrative, type TrackedMutation } from "./undo";

export interface BeginTaskOptions {
  planId?: string;
  attachments?: string[];
  scopeSummary?: string;
  constraints?: string[];
  expectedEffects?: string[];
  mode?: TaskRecord["mode"];
  approvalPending?: boolean;
  approvalRequest?: ApprovalRequest | null;
}

export class TaskTracker {
  private currentTask: TaskRecord | null = null;
  private mutations: TrackedMutation[] = [];

  beginTask(
    userRequest: string,
    classification: TaskClassification,
    options: BeginTaskOptions = {},
  ): TaskRecord {
    const now = Date.now();
    this.currentTask = {
      id: crypto.randomUUID(),
      userRequest,
      mode: options.mode ?? (classification.needsPlan ? "plan" : "discuss"),
      status: classification.needsPlan ? "in_progress" : "pending",
      planId: options.planId,
      attachments: options.attachments,
      scopeSummary: options.scopeSummary,
      constraints: options.constraints ?? [],
      expectedEffects: options.expectedEffects ?? [],
      approvalPending: options.approvalPending ?? false,
      approvalRequest: options.approvalRequest ?? undefined,
      toolCallIds: [],
      toolExecutions: [],
      createdAt: now,
      updatedAt: now,
    };
    this.mutations = [];
    return this.currentTask;
  }

  getCurrentTask(): TaskRecord | null {
    return this.currentTask;
  }

  hydrate(record: TaskRecordEntry | null | undefined): TaskRecord | null {
    this.currentTask = record ? { ...record.task } : null;
    this.mutations = [];
    return this.currentTask;
  }

  reset(): void {
    this.currentTask = null;
    this.mutations = [];
  }

  recordToolCall(toolCallId: string): void {
    if (!this.currentTask) return;
    this.currentTask = {
      ...this.currentTask,
      status: "in_progress",
      toolCallIds: [...this.currentTask.toolCallIds, toolCallId],
      updatedAt: Date.now(),
    };
  }

  recordMutation(mutation: TrackedMutation): void {
    this.mutations.push(mutation);
  }

  recordToolExecution(
    execution: NonNullable<TaskRecord["toolExecutions"]>[number],
  ): void {
    if (!this.currentTask) return;
    this.currentTask = {
      ...this.currentTask,
      toolExecutions: [...(this.currentTask.toolExecutions ?? []), execution],
      updatedAt: Date.now(),
    };
  }

  setExecutionDiagnostics(
    executionDiagnostics: NonNullable<TaskRecord["executionDiagnostics"]>,
  ): void {
    if (!this.currentTask) return;
    this.currentTask = {
      ...this.currentTask,
      executionDiagnostics,
      updatedAt: Date.now(),
    };
  }

  setNoWriteRecoveryCount(noWriteRecoveryCount: number): void {
    if (!this.currentTask) return;
    this.currentTask = {
      ...this.currentTask,
      noWriteRecoveryCount,
      updatedAt: Date.now(),
    };
  }

  setMode(mode: TaskRecord["mode"]): void {
    if (!this.currentTask) return;
    this.currentTask = {
      ...this.currentTask,
      mode,
      updatedAt: Date.now(),
    };
  }

  setApprovalPending(approvalPending: boolean): void {
    if (!this.currentTask) return;
    this.currentTask = {
      ...this.currentTask,
      approvalPending,
      updatedAt: Date.now(),
    };
  }

  setApprovalRequest(approvalRequest: ApprovalRequest | null): void {
    if (!this.currentTask) return;
    this.currentTask = {
      ...this.currentTask,
      approvalRequest: approvalRequest ?? undefined,
      updatedAt: Date.now(),
    };
  }

  setVerificationResults(
    results: VerificationResult[],
    status: NonNullable<TaskRecord["verificationSummary"]>["status"],
    retryable: boolean,
  ): void {
    if (!this.currentTask) return;
    this.currentTask = {
      ...this.currentTask,
      verificationSummary: {
        status,
        retryable,
        failedVerifierIds: results
          .filter(
            (result) =>
              result.status === "failed" || result.status === "retryable",
          )
          .map((result) => result.suiteId),
        lastVerifiedAt: Date.now(),
      },
      updatedAt: Date.now(),
    };
  }

  setHandoff(handoff: HandoffPacket | null): void {
    if (!this.currentTask) return;
    this.currentTask = {
      ...this.currentTask,
      handoff: handoff ?? undefined,
      updatedAt: Date.now(),
    };
  }

  buildUndoNarrative(): string {
    return buildUndoNarrative(this.mutations);
  }

  completeTask(summary?: string): TaskRecord | null {
    if (!this.currentTask) return null;
    this.currentTask = {
      ...this.currentTask,
      status: "completed",
      undoNarrative: summary
        ? `${buildUndoNarrative(this.mutations)}\nSummary: ${summary}`
        : buildUndoNarrative(this.mutations),
      updatedAt: Date.now(),
    };
    return this.currentTask;
  }

  failTask(error: string): TaskRecord | null {
    if (!this.currentTask) return null;
    this.currentTask = {
      ...this.currentTask,
      status: "failed",
      undoNarrative: buildUndoNarrative(this.mutations),
      updatedAt: Date.now(),
    };
    this.recordMutation({
      toolName: "task_failure",
      scope: "task",
      summary: error,
    });
    return this.currentTask;
  }

  async persist(sessionId: string): Promise<TaskRecordEntry | null> {
    if (!this.currentTask) return null;
    await saveTaskRecord(sessionId, this.currentTask);
    return {
      id: this.currentTask.id,
      sessionId,
      task: { ...this.currentTask },
      createdAt: this.currentTask.createdAt,
      updatedAt: this.currentTask.updatedAt,
    };
  }
}
