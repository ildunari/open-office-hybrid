import { Type } from "@sinclair/typebox";
import { defineTool, type ToolResult, toolSuccess } from "../tools/types";
import type { PlanManager } from "./manager";

export function createUpdatePlanTool(planManager: PlanManager) {
  return defineTool({
    name: "update_plan",
    label: "Update Plan",
    description:
      "Internal control tool for advancing or revising the active execution plan.",
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal("complete_step"),
        Type.Literal("fail_step"),
        Type.Literal("skip_step"),
        Type.Literal("revise"),
      ]),
      stepId: Type.Optional(Type.String()),
      reason: Type.Optional(Type.String()),
    }),
    execute: async (_toolCallId, params): Promise<ToolResult> => {
      if (params.action === "revise") {
        const activePlan = planManager.getActivePlan();
        if (activePlan) {
          planManager.revisePlan(
            activePlan.id,
            params.reason ?? "No reason provided.",
          );
        }
        return toolSuccess({ ok: true, action: params.action });
      }

      if (params.stepId) {
        const status =
          params.action === "complete_step"
            ? "completed"
            : params.action === "fail_step"
              ? "failed"
              : "skipped";
        planManager.updateStep(params.stepId, status, {
          error: status === "failed" ? params.reason : undefined,
        });
      }

      return toolSuccess({
        ok: true,
        action: params.action,
        stepId: params.stepId,
      });
    },
  });
}
