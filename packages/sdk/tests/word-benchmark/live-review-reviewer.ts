export interface MinimalLiveReviewerCompletionInput {
  receipts: {
    promptSubmitted: boolean;
    executionObserved: boolean;
    completionObserved: boolean;
  };
  metadata: {
    ok: boolean;
    metadata?: {
      hasContent?: boolean;
      pageCount?: number;
      changeTrackingMode?: string;
    };
  };
  runtimeState: {
    isStreaming?: boolean;
    error?: unknown;
    activePlanSummary?: unknown;
    activeTaskSummary?: unknown;
  };
  events: Array<{
    event: string;
  }>;
}

export interface MinimalLiveReviewerCompletion {
  readinessState: "completed";
  executionStatus: "completed";
  failureClassification:
    | "reviewer_task_not_executed"
    | "live_session_unhealthy"
    | "reviewer_task_completed";
  verdict: "fail" | "pass";
  score: number;
  confidence: number;
  evidenceChecked: string[];
  freeformObservations: string;
  timelineEvents: string[];
  diagnosisSummary: string;
}

export function completeMinimalLiveReviewerResult(
  input: MinimalLiveReviewerCompletionInput,
): MinimalLiveReviewerCompletion {
  const hasBridgeEvents = input.events.some(
    (entry) => entry.event === "bridge_connected" || entry.event === "bridge_status",
  );
  const sessionLooksHealthy =
    input.metadata.ok === true &&
    input.metadata.metadata?.hasContent === true &&
    (input.metadata.metadata?.pageCount ?? 0) > 0 &&
    input.runtimeState.isStreaming === false &&
    input.runtimeState.error == null &&
    hasBridgeEvents;

  if (
    sessionLooksHealthy &&
    input.receipts.promptSubmitted &&
    input.receipts.executionObserved &&
    input.receipts.completionObserved
  ) {
    return {
      readinessState: "completed",
      executionStatus: "completed",
      failureClassification: "reviewer_task_completed",
      verdict: "pass",
      score: 4,
      confidence: 0.91,
      evidenceChecked: [
        "bridge_session_tuple",
        "bridge_metadata",
        "runtime_state",
        "recent_events",
        "prompt_submission_receipt",
        "tool_execution_receipt",
        "completion_receipt",
      ],
      freeformObservations:
        "The reviewer prompt was submitted through the real taskpane UI, a Word tool execution was observed, and the assistant completed the response.",
      timelineEvents: [
        "prompt_submitted",
        "reviewer_evidence_captured",
        "reviewer_completed",
      ],
      diagnosisSummary:
        "The live reviewer loop observed prompt submission, real tool execution, and completion in the Hybrid pane.",
    };
  }

  if (sessionLooksHealthy) {
    return {
      readinessState: "completed",
      executionStatus: "completed",
      failureClassification: "reviewer_task_not_executed",
      verdict: "fail",
      score: 1.5,
      confidence: 0.86,
      evidenceChecked: [
        "bridge_session_tuple",
        "bridge_metadata",
        "runtime_state",
        "recent_events",
      ],
      freeformObservations:
        "Live Hybrid session was healthy, but no task execution receipt was observed for the selected reviewer task.",
      timelineEvents: [
        "reviewer_evidence_captured",
        "reviewer_completed",
      ],
      diagnosisSummary:
        "Live session is healthy, but the reviewer loop did not yet observe an in-pane task execution receipt.",
    };
  }

  return {
    readinessState: "completed",
    executionStatus: "completed",
    failureClassification: "live_session_unhealthy",
    verdict: "fail",
    score: 0.5,
    confidence: 0.72,
    evidenceChecked: [
      "bridge_session_tuple",
      "bridge_metadata",
      "runtime_state",
      "recent_events",
    ],
    freeformObservations:
      "Reviewer completion ended with insufficient healthy-session evidence to treat the task as started.",
    timelineEvents: [
      "reviewer_evidence_captured",
      "reviewer_completed",
    ],
    diagnosisSummary:
      "Reviewer completion ended before task execution because the live session evidence was not healthy enough.",
  };
}
