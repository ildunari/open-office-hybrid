import type { AgentTool } from "@mariozechner/pi-agent-core";
import { describe, expect, it } from "vitest";
import { HookRegistry } from "../src/hooks/registry";
import { wrapTool } from "../src/hooks/tool-wrapper";

function getText(result: Awaited<ReturnType<AgentTool["execute"]>>): string[] {
  return result.content
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text);
}

describe("wrapTool", () => {
  it("lets post-hooks inspect raw tool output before adapter reinjection", async () => {
    const registry = new HookRegistry();
    let seenText = "";
    registry.registerPost({
      name: "inspect-raw-result",
      speed: "fast",
      source: { hookName: "inspect-raw-result" },
      execute: (ctx) => {
        seenText = ctx.result.content
          .filter(
            (part): part is { type: "text"; text: string } =>
              part.type === "text",
          )
          .map((part) => part.text)
          .join("\n");
        return {
          modifiedResult: {
            content: [{ type: "image", data: "abc123", mimeType: "image/png" }],
            details: {
              outputAdapter: {
                text: "Compacted read summary",
              },
            },
          },
        };
      },
    });

    const wrapped = wrapTool(
      {
        name: "dummy",
        description: "dummy tool",
        parameters: {},
        execute: async () => ({
          content: [{ type: "text", text: "raw tool output" }],
          details: undefined,
        }),
      } as unknown as AgentTool,
      registry,
    );

    const result = await wrapped.execute("tc_0", {}, undefined, undefined);
    expect(seenText).toBe("raw tool output");
    expect(getText(result)).toEqual(["Compacted read summary"]);
  });

  it("re-injects adapter text after post-hooks return a non-text modifiedResult", async () => {
    const registry = new HookRegistry();
    registry.registerPost({
      name: "replace-with-image",
      speed: "fast",
      source: { hookName: "replace-with-image" },
      execute: () => ({
        modifiedResult: {
          content: [{ type: "image", data: "abc123", mimeType: "image/png" }],
          details: {
            outputAdapter: {
              text: "Compacted read summary",
            },
          },
        },
      }),
    });

    const wrapped = wrapTool(
      {
        name: "dummy",
        description: "dummy tool",
        parameters: {},
        execute: async () => ({
          content: [{ type: "text", text: "raw tool output" }],
          details: undefined,
        }),
      } as unknown as AgentTool,
      registry,
    );

    const result = await wrapped.execute("tc_1", {}, undefined, undefined);
    expect(getText(result)).toEqual(["Compacted read summary"]);
    expect(
      result.content.some(
        (part) => part.type === "image" && part.mimeType === "image/png",
      ),
    ).toBe(true);
  });

  it("does not rewrite already text-bearing post-hook results", async () => {
    const registry = new HookRegistry();
    registry.registerPost({
      name: "already-final",
      speed: "fast",
      source: { hookName: "already-final" },
      execute: () => ({
        modifiedResult: {
          content: [{ type: "text", text: "already final" }],
          details: {
            outputAdapter: {
              text: "Compacted read summary",
            },
          },
        },
      }),
    });

    const wrapped = wrapTool(
      {
        name: "dummy",
        description: "dummy tool",
        parameters: {},
        execute: async () => ({
          content: [{ type: "text", text: "raw tool output" }],
          details: undefined,
        }),
      } as unknown as AgentTool,
      registry,
    );

    const result = await wrapped.execute("tc_2", {}, undefined, undefined);
    expect(getText(result)).toEqual(["already final"]);
  });

  it("re-injects adapter text when text blocks are present but blank", async () => {
    const registry = new HookRegistry();
    registry.registerPost({
      name: "blank-text",
      speed: "fast",
      source: { hookName: "blank-text" },
      execute: () => ({
        modifiedResult: {
          content: [{ type: "text", text: "   " }],
          details: {
            outputAdapter: {
              text: "Compacted fallback summary",
            },
          },
        },
      }),
    });

    const wrapped = wrapTool(
      {
        name: "dummy",
        description: "dummy tool",
        parameters: {},
        execute: async () => ({
          content: [{ type: "text", text: "raw tool output" }],
          details: undefined,
        }),
      } as unknown as AgentTool,
      registry,
    );

    const result = await wrapped.execute("tc_3", {}, undefined, undefined);
    expect(getText(result)).toEqual(["Compacted fallback summary", "   "]);
  });
});
