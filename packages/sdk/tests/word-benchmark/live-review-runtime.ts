export type LiveReviewBatchPhase =
  | "batch_preflight"
  | "pane_open_required"
  | "session_ready"
  | "reviewer_running"
  | "rerun_pending"
  | "quarantined";

export interface LiveReviewBatchRuntime {
  batchId: string;
  capabilityArea: string;
  sourceDocument: string;
  selectedTasks: string[];
  phase: LiveReviewBatchPhase;
  bridgeSessionId: string | null;
  wordDocumentId: string | null;
  visibleTitle: string | null;
  activeTaskId: string | null;
  activeCloneId: string | null;
  quarantinedTasks: string[];
}

type LiveReviewBatchEvent =
  | {
      type: "preflight_completed";
      requiresPaneOpen: boolean;
    }
  | {
      type: "session_verified";
      bridgeSessionId: string;
      wordDocumentId: string;
      visibleTitle: string;
    }
  | {
      type: "reviewer_task_started";
      taskId: string;
      cloneId: string;
    }
  | {
      type: "rerun_failed";
      taskId: string;
      reason: string;
    };

export interface CreateLiveReviewBatchRuntimeOptions {
  batchId: string;
  capabilityArea: string;
  sourceDocument: string;
  selectedTasks: string[];
}

export function createLiveReviewBatchRuntime(
  options: CreateLiveReviewBatchRuntimeOptions,
): LiveReviewBatchRuntime {
  return {
    batchId: options.batchId,
    capabilityArea: options.capabilityArea,
    sourceDocument: options.sourceDocument,
    selectedTasks: options.selectedTasks,
    phase: "batch_preflight",
    bridgeSessionId: null,
    wordDocumentId: null,
    visibleTitle: null,
    activeTaskId: null,
    activeCloneId: null,
    quarantinedTasks: [],
  };
}

export function advanceLiveReviewBatch(
  runtime: LiveReviewBatchRuntime,
  event: LiveReviewBatchEvent,
): LiveReviewBatchRuntime {
  switch (event.type) {
    case "preflight_completed":
      return {
        ...runtime,
        phase: event.requiresPaneOpen ? "pane_open_required" : "session_ready",
      };
    case "session_verified":
      return {
        ...runtime,
        phase: "session_ready",
        bridgeSessionId: event.bridgeSessionId,
        wordDocumentId: event.wordDocumentId,
        visibleTitle: event.visibleTitle,
      };
    case "reviewer_task_started":
      return {
        ...runtime,
        phase: "reviewer_running",
        activeTaskId: event.taskId,
        activeCloneId: event.cloneId,
      };
    case "rerun_failed":
      return {
        ...runtime,
        phase: "quarantined",
        activeTaskId: event.taskId,
        quarantinedTasks: [...runtime.quarantinedTasks, event.taskId],
      };
  }
}
