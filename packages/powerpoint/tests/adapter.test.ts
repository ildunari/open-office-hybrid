import { AgentRuntime } from "@office-agents/core/sdk";
import { describe, expect, it } from "vitest";
import { createPowerPointAdapter } from "../src/lib/adapter";

describe("createPowerPointAdapter runtime integration", () => {
  it("surfaces PowerPoint patterns and verifiers through AgentRuntime", async () => {
    const adapter = createPowerPointAdapter();
    const runtime = new AgentRuntime({
      ...adapter,
      getDocumentId: async () => "ppt-doc-1",
    });

    const state = runtime.getState();
    expect(adapter.hostApp).toBe("powerpoint");
    expect(state.activeVerifierIds).toEqual(
      expect.arrayContaining([
        "powerpoint:layout-verification",
        "powerpoint:template-preservation",
        "powerpoint:chart-data-integrity",
      ]),
    );
    expect(
      adapter.getReasoningPatterns?.().map((pattern) => pattern.id),
    ).toEqual(
      expect.arrayContaining([
        "powerpoint:layout-verification",
        "powerpoint:template-preservation",
        "powerpoint:chart-data-integrity",
      ]),
    );
    runtime.dispose();
  });
});
