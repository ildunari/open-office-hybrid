import { describe, expect, it } from "vitest";
import { bridgeToolExecutionResultToMcpResult } from "../src/mcp";

describe("bridgeToolExecutionResultToMcpResult", () => {
  it("preserves text and images for MCP tool responses", () => {
    const result = bridgeToolExecutionResultToMcpResult({
      toolCallId: "tool-1",
      toolName: "screenshot_document",
      isError: false,
      result: { ok: true },
      resultText: "Captured page 1",
      images: [{ data: "abc123", mimeType: "image/png" }],
    });

    expect(result.isError).toBe(false);
    expect(result.content).toEqual([
      { type: "text", text: "Captured page 1" },
      { type: "image", data: "abc123", mimeType: "image/png" },
    ]);
  });

  it("falls back to serialized structured content when text is empty", () => {
    const result = bridgeToolExecutionResultToMcpResult({
      toolCallId: "tool-2",
      toolName: "get_document_text",
      isError: false,
      result: { body: "hello" },
      resultText: "",
      images: [],
    });

    expect(result.content).toEqual([
      {
        type: "text",
        text: JSON.stringify({ body: "hello" }, null, 2),
      },
    ]);
  });
});
