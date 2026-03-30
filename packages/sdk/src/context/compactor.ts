import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type {
  AssistantMessage,
  ImageContent,
  TextContent,
  ToolResultMessage,
  UserMessage,
} from "@mariozechner/pi-ai";
import type { ExecutionPlan, TaskRecord } from "../planning/types";
import type { CompactionLedgerEntry, CompactionSummary } from "./types";

const TOOL_RESULT_TRUNCATE_THRESHOLD = 2048;
const TOOL_RESULT_KEEP_HEAD = 200;

const IMAGE_PLACEHOLDER: TextContent = { type: "text", text: "[image omitted]" };

/**
 * Handles pre-filtering, summarizer prompt construction, response parsing,
 * and message array rebuilding for context compaction.
 */
export class ContextCompactor {
  /**
   * Pre-filter messages to reduce token count before summarization.
   * - Strips base64 image data in user and tool-result messages (replaces with
   *   "[image omitted]" text block)
   * - Truncates tool_result content blocks longer than 2048 chars
   * - Removes thinking/reasoning blocks from assistant messages
   * - Preserves message structure (roles, tool names, tool call IDs)
   */
  preFilter(messages: AgentMessage[]): AgentMessage[] {
    return messages.map((msg): AgentMessage => {
      if (msg.role === "assistant") {
        const assistantMsg = msg as AssistantMessage;
        // Drop thinking blocks; assistant content has no image type
        const filteredContent = assistantMsg.content.filter(
          (block) => block.type !== "thinking",
        );
        return { ...assistantMsg, content: filteredContent } as AgentMessage;
      }

      if (msg.role === "toolResult") {
        const toolMsg = msg as ToolResultMessage;
        const filteredContent: (TextContent | ImageContent)[] =
          toolMsg.content.map((block) => {
            if (block.type === "image") {
              return IMAGE_PLACEHOLDER;
            }
            if (
              block.type === "text" &&
              block.text.length > TOOL_RESULT_TRUNCATE_THRESHOLD
            ) {
              return {
                type: "text" as const,
                text: block.text.slice(0, TOOL_RESULT_KEEP_HEAD) + "...[truncated]",
              };
            }
            return block;
          });
        return { ...toolMsg, content: filteredContent } as AgentMessage;
      }

      if (msg.role === "user") {
        const userMsg = msg as UserMessage;
        if (typeof userMsg.content === "string") {
          return msg;
        }
        const filteredContent: (TextContent | ImageContent)[] =
          userMsg.content.map((block): TextContent | ImageContent => {
            if (block.type === "image") {
              return IMAGE_PLACEHOLDER;
            }
            return block;
          });
        return { ...userMsg, content: filteredContent } as AgentMessage;
      }

      return msg;
    });
  }

  /**
   * Build the summarizer prompt from filtered messages and prior ledger entries.
   * Returns a string prompt requesting structured JSON output.
   */
  buildSummarizerPrompt(
    filtered: AgentMessage[],
    ledger: CompactionLedgerEntry[],
  ): string {
    const priorContext =
      ledger.length > 0
        ? [
            "PRIOR COMPACTION CONTEXT:",
            ...ledger.map((entry, i) => {
              const s = entry.summary;
              return [
                `[Compaction ${i + 1}, depth ${entry.cascadeDepth}]`,
                `  State: ${s.currentState}`,
                s.decisions.length > 0
                  ? `  Decisions: ${s.decisions.join("; ")}`
                  : null,
                s.constraints.length > 0
                  ? `  Constraints: ${s.constraints.join("; ")}`
                  : null,
                s.progress.length > 0
                  ? `  Progress: ${s.progress.join("; ")}`
                  : null,
              ]
                .filter(Boolean)
                .join("\n");
            }),
            "",
          ].join("\n")
        : "";

    const serializedMessages = filtered
      .map((msg) => {
        if (msg.role === "user") {
          const userMsg = msg as UserMessage;
          const text =
            typeof userMsg.content === "string"
              ? userMsg.content
              : (userMsg.content as Array<{ type: string; text?: string }>)
                  .filter((b) => b.type === "text")
                  .map((b) => b.text ?? "")
                  .join("\n");
          return `[USER]: ${text.slice(0, 1000)}`;
        }
        if (msg.role === "assistant") {
          const assistantMsg = msg as AssistantMessage;
          const text = assistantMsg.content
            .filter((b) => b.type === "text")
            .map((b) => (b as { type: "text"; text: string }).text)
            .join("\n");
          const toolCalls = assistantMsg.content
            .filter((b) => b.type === "toolCall")
            .map(
              (b) =>
                `  [tool_call: ${(b as { type: string; name?: string }).name ?? "unknown"}]`,
            )
            .join("\n");
          return `[ASSISTANT]: ${text.slice(0, 800)}${toolCalls ? "\n" + toolCalls : ""}`;
        }
        if (msg.role === "toolResult") {
          const toolMsg = msg as ToolResultMessage;
          const text = toolMsg.content
            .filter((b) => b.type === "text")
            .map((b) => (b as { type: "text"; text: string }).text)
            .join("\n");
          return `[TOOL_RESULT (${toolMsg.toolName})]: ${text.slice(0, 400)}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n\n");

    return [
      "You are a conversation summarizer. Analyze the following conversation and produce a JSON summary.",
      "",
      "RULES:",
      "- Capture all DECISIONS made and their rationale",
      "- Capture all CONSTRAINTS discovered during execution",
      "- Capture PROGRESS: what was accomplished",
      "- Describe the CURRENT STATE of the task",
      "- List concrete NEXT STEPS",
      "",
      priorContext,
      "CONVERSATION:",
      serializedMessages,
      "",
      'Respond with ONLY valid JSON:',
      '{"decisions": [...], "constraints": [...], "progress": [...], "currentState": "...", "nextSteps": [...]}',
    ]
      .filter((line) => line !== null)
      .join("\n");
  }

  /**
   * Parse the summarizer's response into a CompactionSummary.
   * Handles JSON-in-markdown fences and raw JSON.
   * Falls back to a minimal summary on parse failure.
   */
  parseSummary(response: string, sourceMessageCount: number): CompactionSummary {
    const base = {
      sourceMessageCount,
      timestamp: Date.now(),
    };

    // Try to extract JSON from markdown code fences first
    const fenceMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenceMatch ? fenceMatch[1]!.trim() : response.trim();

    try {
      const parsed = JSON.parse(candidate) as {
        decisions?: unknown;
        constraints?: unknown;
        progress?: unknown;
        currentState?: unknown;
        nextSteps?: unknown;
      };

      return {
        decisions: Array.isArray(parsed.decisions)
          ? (parsed.decisions as string[])
          : [],
        constraints: Array.isArray(parsed.constraints)
          ? (parsed.constraints as string[])
          : [],
        progress: Array.isArray(parsed.progress)
          ? (parsed.progress as string[])
          : [],
        currentState:
          typeof parsed.currentState === "string"
            ? parsed.currentState
            : "Unknown state",
        nextSteps: Array.isArray(parsed.nextSteps)
          ? (parsed.nextSteps as string[])
          : [],
        ...base,
      };
    } catch {
      return {
        decisions: [],
        constraints: [],
        progress: [],
        currentState: response.slice(0, 500),
        nextSteps: [],
        ...base,
      };
    }
  }

  /**
   * Rebuild a minimal message array after compaction.
   * Creates one synthetic user message containing the compaction summary plus
   * plan/task state, followed by the last `keepTurns` conversation exchanges.
   */
  rebuildMessages(
    summary: CompactionSummary,
    allMessages: AgentMessage[],
    diskState: { plan?: ExecutionPlan | null; task?: TaskRecord | null },
    keepTurns = 3,
  ): AgentMessage[] {
    // Collect the last keepTurns user→assistant exchanges from the tail
    const recentTurns: AgentMessage[] = [];
    let turnsCollected = 0;
    let i = allMessages.length - 1;

    while (i >= 0 && turnsCollected < keepTurns) {
      // Walk backward: find an assistant message, then its preceding user message
      while (i >= 0 && allMessages[i]!.role !== "assistant") {
        i--;
      }
      if (i < 0) break;

      // Collect any trailing toolResult messages that belong to this assistant turn
      const turnMessages: AgentMessage[] = [];
      // Collect assistant message
      turnMessages.unshift(allMessages[i]!);
      i--;

      // Collect tool results that precede this assistant message in the array
      // (tool results come after the assistant message that issued the call)
      // Actually in pi-agent layout: user → assistant → toolResult* → assistant ...
      // Walk forward from this assistant to collect its tool results
      // But since we're going backward, recentTurns already has those.
      // Re-approach: walk backwards collecting assistant+preceding user block.
      while (i >= 0 && allMessages[i]!.role === "toolResult") {
        turnMessages.unshift(allMessages[i]!);
        i--;
      }

      // Now expect a user message
      if (i >= 0 && allMessages[i]!.role === "user") {
        turnMessages.unshift(allMessages[i]!);
        i--;
      }

      recentTurns.unshift(...turnMessages);
      turnsCollected++;
    }

    // Build the synthetic context recovery message text
    const lines: string[] = [
      "CONTEXT RECOVERY: Previous conversation was compacted.",
      "",
      `Current State: ${summary.currentState}`,
    ];

    if (summary.decisions.length > 0) {
      lines.push("", "Decisions made:");
      summary.decisions.forEach((d) => lines.push(`- ${d}`));
    }

    if (summary.constraints.length > 0) {
      lines.push("", "Constraints discovered:");
      summary.constraints.forEach((c) => lines.push(`- ${c}`));
    }

    if (summary.progress.length > 0) {
      lines.push("", "Progress:");
      summary.progress.forEach((p) => lines.push(`- ${p}`));
    }

    if (summary.nextSteps.length > 0) {
      lines.push("", "Next steps:");
      summary.nextSteps.forEach((s) => lines.push(`- ${s}`));
    }

    if (diskState.plan) {
      lines.push(
        "",
        `Active Plan: ${diskState.plan.userRequest} (${diskState.plan.status})`,
        `Strategy: ${diskState.plan.strategy.join("; ")}`,
      );
    }

    if (diskState.task) {
      lines.push(
        "",
        `Active Task: ${diskState.task.userRequest} (${diskState.task.status})`,
      );
      if (diskState.task.scopeSummary) {
        lines.push(`Scope: ${diskState.task.scopeSummary}`);
      }
    }

    lines.push("", "Continue from where we left off.");

    const syntheticMessage: AgentMessage = {
      role: "user",
      content: lines.join("\n"),
      timestamp: Date.now(),
    } as AgentMessage;

    return [syntheticMessage, ...recentTurns];
  }
}
