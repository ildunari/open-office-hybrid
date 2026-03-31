import { Type } from "@sinclair/typebox";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
  truncateHeadTail,
} from "../truncate";
import { getBash } from "../vfs";
import { defineTool, toolError, toolSuccess } from "./types";

export const bashTool = defineTool({
  name: "bash",
  label: "Bash",
  description:
    "Execute bash commands in a sandboxed virtual environment. " +
    `Output is truncated to last ${DEFAULT_MAX_LINES} lines or ${DEFAULT_MAX_BYTES / 1024}KB (whichever is hit first). ` +
    "The filesystem is in-memory with user uploads in /home/user/uploads/. " +
    "Useful for: file operations (ls, cat, grep, find), text processing (awk, sed, jq, sort, uniq), " +
    "data analysis (wc, cut, paste), and general scripting. " +
    "Network access is disabled. No external runtimes (node, python, etc.) are available.",
  parameters: Type.Object({
    command: Type.String({
      description:
        "Bash command(s) to execute. Can be a single command or a script with multiple lines. " +
        "Supports pipes (|), redirections (>, >>), command chaining (&&, ||, ;), " +
        "variables, loops, conditionals, and functions.",
    }),
    explanation: Type.Optional(
      Type.String({
        description: "Brief explanation (max 50 chars)",
        maxLength: 50,
      }),
    ),
  }),
  execute: async (_toolCallId, params) => {
    try {
      const bash = getBash();
      const result = await bash.exec(params.command);

      let output = "";

      if (result.stdout) {
        output += result.stdout;
      }

      if (result.stderr) {
        if (output && !output.endsWith("\n")) output += "\n";
        output += `stderr: ${result.stderr}`;
      }

      if (result.exitCode !== 0) {
        if (output && !output.endsWith("\n")) output += "\n";
        output += `[exit code: ${result.exitCode}]`;
      }

      if (!output) {
        output = "[no output]";
      }

      output = output.trim();

      const truncation = truncateHeadTail(output);
      let outputText = truncation.content;

      if (truncation.truncated) {
        outputText += `\n\n[Showing head and tail preview of ${truncation.totalLines} lines (${formatSize(DEFAULT_MAX_BYTES)} limit). Output truncated.]`;
      }

      return toolSuccess(
        {
          output: outputText,
          exitCode: result.exitCode,
          truncated: truncation.truncated,
          totalLines: truncation.totalLines,
        },
        truncation.truncated
          ? {
              outputAdapter: {
                text: `bash output preview (${truncation.totalLines} lines, exit ${result.exitCode})`,
              },
            }
          : undefined,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error executing bash command";
      return toolError(message);
    }
  },
});
