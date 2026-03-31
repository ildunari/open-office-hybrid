import { describe, expect, it } from "vitest";
import {
  buildDefaultPlan,
  createUpdatePlanTool,
  inferTaskClassification,
  PlanManager,
} from "../src/planning";

function parseToolResult(result: Awaited<ReturnType<any>>) {
  return JSON.parse(result.content[0]?.text ?? "{}");
}

function createToolWithDefaultPlan() {
  const request = "Rewrite the introduction and preserve formatting.";
  const classification = inferTaskClassification(request);
  const planManager = new PlanManager();
  planManager.replacePlan(buildDefaultPlan(request, classification));
  return {
    planManager,
    tool: createUpdatePlanTool(planManager) as any,
  };
}

describe("createUpdatePlanTool", () => {
  it("rejects step actions without a step id", async () => {
    const { tool } = createToolWithDefaultPlan();

    const result = parseToolResult(
      await tool.execute("tool-call-1", {
        action: "complete_step",
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "stepId is required for step actions.",
    });
  });

  it("rejects unknown step ids", async () => {
    const { tool } = createToolWithDefaultPlan();

    const result = parseToolResult(
      await tool.execute("tool-call-2", {
        action: "complete_step",
        stepId: "step-missing",
      }),
    );

    expect(result).toEqual({
      success: false,
      error: 'Unknown plan step "step-missing".',
    });
  });

  it("rejects dependency-violating advancement", async () => {
    const { tool, planManager } = createToolWithDefaultPlan();

    const result = parseToolResult(
      await tool.execute("tool-call-3", {
        action: "complete_step",
        stepId: "step-write",
      }),
    );

    expect(result).toEqual({
      success: false,
      error:
        'Cannot complete "step-write" before its dependencies: step-analyze.',
    });
    expect(
      planManager
        .getActivePlan()
        ?.steps.find((step) => step.id === "step-write")?.status,
    ).toBe("pending");
  });
});
