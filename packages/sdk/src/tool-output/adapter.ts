import type { AgentToolResult } from "@mariozechner/pi-agent-core";

interface OutputAdapterDetails {
  text?: string;
}

interface ResultDetailsWithOutputAdapter {
  outputAdapter?: OutputAdapterDetails;
  [key: string]: unknown;
}

function getOutputAdapterText(details: unknown): string | undefined {
  if (!details || typeof details !== "object") return undefined;
  const adapter = (details as ResultDetailsWithOutputAdapter).outputAdapter;
  if (!adapter || typeof adapter !== "object") return undefined;
  return typeof adapter.text === "string" ? adapter.text : undefined;
}

function hasTextContent(result: AgentToolResult<unknown>): boolean {
  return result.content.some(
    (part) =>
      part.type === "text" &&
      typeof part.text === "string" &&
      part.text.trim().length > 0,
  );
}

export function adaptToolResultForConsumers(
  result: AgentToolResult<unknown>,
): AgentToolResult<unknown> {
  if (hasTextContent(result)) {
    return result;
  }

  const adapterText = getOutputAdapterText(result.details);
  if (!adapterText) {
    return result;
  }

  return {
    ...result,
    content: [{ type: "text", text: adapterText }, ...result.content],
  };
}
