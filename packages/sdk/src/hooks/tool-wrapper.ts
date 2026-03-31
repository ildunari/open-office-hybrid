import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { adaptToolResultForConsumers } from "../tool-output/adapter";
import { classifyTool } from "./classifier";
import type { HookRegistry } from "./registry";
import type { PostHookContext, PreHookContext } from "./types";

export function wrapTool(tool: AgentTool, registry: HookRegistry): AgentTool {
  const tags = classifyTool(tool.name);

  return {
    ...tool,
    execute: async (toolCallId, params, signal, onUpdate) => {
      const captures = new Map<string, unknown>();
      const sessionState = registry.getSessionState();

      const preCtx: PreHookContext = {
        toolName: tool.name,
        tags,
        params: params as Record<string, unknown>,
        toolCallId,
        budget: { totalMs: 1000, elapsedMs: 0 },
        signal,
        captures,
        sessionState,
      };

      const preResult = await registry.runPreHooks(preCtx);
      if (preResult.promptNotes) {
        registry.addPromptNotes(preResult.promptNotes);
      }

      if (preResult.action === "abort") {
        const errorResult: AgentToolResult<undefined> = {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: preResult.errorMessage ?? "Operation blocked by hook",
              }),
            },
          ],
          details: undefined,
        };
        return errorResult;
      }

      if (preResult.action === "skip") {
        return {
          content: [{ type: "text", text: '{"skipped":true}' }],
          details: undefined,
        };
      }

      const finalParams = preResult.modifiedParams ?? params;
      const result = await tool.execute(
        toolCallId,
        finalParams,
        signal,
        onUpdate,
      );

      const postCtx: PostHookContext = {
        toolName: tool.name,
        tags,
        params: finalParams as Record<string, unknown>,
        result,
        isError: result.content.some(
          (content) =>
            content.type === "text" && content.text.includes('"success":false'),
        ),
        toolCallId,
        budget: { totalMs: 1000, elapsedMs: 0 },
        signal,
        captures,
        sessionState,
      };

      const postResult = await registry.runPostHooks(postCtx);
      if (postResult.promptNotes) {
        registry.addPromptNotes(postResult.promptNotes);
      }

      return adaptToolResultForConsumers(postResult.modifiedResult ?? result);
    },
  };
}
