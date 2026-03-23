export const LIVE_REVIEW_TEXTAREA_SELECTOR = "[data-live-review-textarea]";
export const LIVE_REVIEW_SEND_BUTTON_SELECTOR = "[data-live-review-send]";
export const LIVE_REVIEW_AUTOMATION_GLOBAL =
  "window.__OFFICE_AGENTS_AUTOMATION__";

export function buildReviewerPrompt({ capabilityId, taskId, sourceDocument }) {
  return [
    `Live reviewer check for task ${taskId} in capability area ${capabilityId}.`,
    `Source document: ${sourceDocument}.`,
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

  return {
    promptSubmitted,
    executionObserved,
    completionObserved,
  };
}
