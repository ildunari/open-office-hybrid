export const LIVE_REVIEW_TEXTAREA_SELECTOR = "[data-live-review-textarea]";
export const LIVE_REVIEW_SEND_BUTTON_SELECTOR = "[data-live-review-send]";
export const LIVE_REVIEW_AUTOMATION_GLOBAL =
  "window.__OFFICE_AGENTS_AUTOMATION__";
const WORD_READ_TOOL_NAMES = new Set([
  "get_document_text",
  "get_document_structure",
  "get_ooxml",
  "get_paragraph_ooxml",
]);
const WORD_WRITE_TOOL_NAMES = new Set(["execute_office_js"]);

export function buildReviewerPrompt({
  capabilityId,
  taskId,
  sourceDocument,
  taskPrompt,
}) {
  return [
    `Live reviewer check for task ${taskId} in capability area ${capabilityId}.`,
    `Source document: ${sourceDocument}.`,
    taskPrompt ? `Target task intent: ${taskPrompt}` : null,
    "",
    "Read-only check only.",
    "Do not edit the document.",
    "Do not create a plan.",
    "Do not call update_plan.",
    "Use exactly one tool call: `get_document_structure`.",
    "Do not call any other tool.",
    "After that single tool call, respond with exactly two bullets:",
    "- Bullet 1: a short structure summary.",
    "- Bullet 2: whether the document appears ready for a scoped review task.",
    "Do not edit the document.",
  ].join("\n");
}

export function buildTaskpanePromptSubmissionScript({ prompt }) {
  const textareaSelector = JSON.stringify(LIVE_REVIEW_TEXTAREA_SELECTOR);
  const sendButtonSelector = JSON.stringify(LIVE_REVIEW_SEND_BUTTON_SELECTOR);
  const promptText = JSON.stringify(prompt);
  const automationGlobal = JSON.stringify(LIVE_REVIEW_AUTOMATION_GLOBAL);

  return `(async () => {
    const automation = ${automationGlobal}
      .split(".")
      .reduce((value, key, index) => {
        if (index === 0) {
          return key === "window" ? window : globalThis[key];
        }
        return value?.[key];
      }, undefined);
    if (automation && typeof automation.submitPrompt === "function") {
      return automation.submitPrompt(${promptText}, { freshSession: true });
    }

    const textarea = document.querySelector(${textareaSelector});
    if (!(textarea instanceof HTMLTextAreaElement)) {
      throw new Error("Live review textarea selector not found");
    }

    const sendButton = document.querySelector(${sendButtonSelector});
    if (!(sendButton instanceof HTMLButtonElement)) {
      throw new Error("Live review send button selector not found");
    }

    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    if (valueSetter) {
      valueSetter.call(textarea, ${promptText});
    } else {
      textarea.value = ${promptText};
    }

    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    textarea.focus();
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (sendButton.disabled) {
      throw new Error("Live review send button is disabled");
    }

    textarea.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    if (!sendButton.disabled && textarea.value.trim().length > 0) {
      sendButton.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
    }

    return {
      submitted: true,
      promptLength: ${promptText}.length,
      submissionMethod: "dom",
      textareaSelector: ${textareaSelector},
      sendButtonSelector: ${sendButtonSelector},
    };
  })();`;
}

export function unwrapTaskpaneSubmissionResult(executionResult) {
  if (
    executionResult &&
    typeof executionResult === "object" &&
    executionResult.result &&
    typeof executionResult.result === "object" &&
    executionResult.result.result &&
    typeof executionResult.result.result === "object"
  ) {
    return executionResult.result.result;
  }

  if (
    executionResult &&
    typeof executionResult === "object" &&
    executionResult.result &&
    typeof executionResult.result === "object"
  ) {
    return executionResult.result;
  }

  return executionResult;
}

export function classifyLiveExecutionReceipts({
  baselineMessageCount,
  stateSnapshots,
  newEvents,
}) {
  const hasConsoleReceipt = (marker) =>
    newEvents.some(
      (event) => {
        if (event.event !== "console") return false;
        if (
          typeof event.payloadSummary === "string" &&
          event.payloadSummary.includes(`"${marker}"`)
        ) {
          return true;
        }

        return (
          Array.isArray(event.payload?.args) &&
          event.payload.args[1] === marker
        );
      },
    );

  const promptSubmitted = stateSnapshots.some((state) => {
    const messageCount = state?.sessionStats?.messageCount ?? baselineMessageCount;
    return Boolean(
      state?.isStreaming ||
        state?.activeTaskSummary ||
        messageCount > baselineMessageCount,
    );
  });

  const toolEvents = newEvents.filter(
    (event) =>
      event.event === "tool:started" ||
      event.event === "tool:completed" ||
      event.event === "tool:failed",
  );
  const readEvents = toolEvents.filter((event) =>
    WORD_READ_TOOL_NAMES.has(event.payload?.toolName),
  );
  const writeEvents = toolEvents.filter((event) =>
    WORD_WRITE_TOOL_NAMES.has(event.payload?.toolName),
  );
  const successfulWriteEvents = writeEvents.filter(
    (event) => event.event === "tool:completed",
  );
  const failedWriteEvents = writeEvents.filter(
    (event) => event.event === "tool:failed",
  );
  const firstWriteTs = successfulWriteEvents[0]?.ts ?? null;
  const postWriteRereadObserved =
    firstWriteTs == null
      ? false
      : readEvents.some((event) => (event.ts ?? 0) >= firstWriteTs);
  const finalState = stateSnapshots[stateSnapshots.length - 1] ?? null;

  const executionObserved =
    stateSnapshots.some(
      (state) => (state?.activeTaskSummary?.toolExecutionCount ?? 0) > 0,
    ) ||
    newEvents.some(
      (event) =>
        event.event === "tool:started" ||
        event.event === "tool:completed" ||
        event.event === "tool:failed",
    ) ||
    hasConsoleReceipt("tool_execution_start") ||
    hasConsoleReceipt("tool_execution_end");
  const completionObserved =
    stateSnapshots.some((state) => {
      return Boolean(
        state?.isStreaming === false &&
          state?.activeTaskSummary?.status === "completed" &&
          (state?.activeTaskSummary?.toolExecutionCount ?? 0) > 0,
      );
    }) ||
    hasConsoleReceipt("agent_end");

  const noWriteLoopSuspected = Boolean(
    promptSubmitted &&
      executionObserved &&
      successfulWriteEvents.length === 0 &&
      readEvents.length >= 3 &&
      (finalState?.mode === "blocked" ||
        finalState?.waitingState != null ||
        (finalState?.degradedGuardrails?.length ?? 0) > 0),
  );
  const reviewerOnlySuccess = Boolean(
    completionObserved &&
      successfulWriteEvents.length === 0 &&
      failedWriteEvents.length === 0 &&
      readEvents.length > 0,
  );
  const writeAttemptedButFailed = Boolean(
    failedWriteEvents.length > 0 && successfulWriteEvents.length === 0,
  );
  const writeSucceededWithoutReread = Boolean(
    successfulWriteEvents.length > 0 && !postWriteRereadObserved,
  );
  const executionClassification = reviewerOnlySuccess
    ? "reviewer_only_success"
    : noWriteLoopSuspected
      ? "no_write_loop"
      : writeAttemptedButFailed
        ? "write_attempted_but_failed"
        : writeSucceededWithoutReread
          ? "write_succeeded_without_reread"
          : successfulWriteEvents.length > 0
            ? "write_completed_with_reread"
            : executionObserved
              ? "execution_without_write_signal"
              : "no_execution_signal";

  return {
    promptSubmitted,
    executionObserved,
    completionObserved,
    readCount: readEvents.length,
    writeCount: successfulWriteEvents.length,
    failedWriteCount: failedWriteEvents.length,
    firstReadTs: readEvents[0]?.ts ?? null,
    firstWriteTs,
    postWriteRereadObserved,
    noWriteLoopSuspected,
    reviewerOnlySuccess,
    writeAttemptedButFailed,
    writeSucceededWithoutReread,
    executionClassification,
  };
}
