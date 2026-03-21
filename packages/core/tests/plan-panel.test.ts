import type { ExecutionPlan } from "@office-agents/sdk";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import PlanPanel from "../src/chat/plan-panel.svelte";

function makePlan(): ExecutionPlan {
  return {
    id: "plan-1",
    userRequest: "Review and revise the document",
    summary: "Revise the tracked section",
    status: "active",
    classification: {
      complexity: "moderate",
      needsPlan: true,
      needsExecution: true,
      risk: "medium",
    },
    steps: [
      {
        id: "step-1",
        description: "Read the current section",
        successCriteria: "Context is captured",
        kind: "read",
        status: "completed",
      },
      {
        id: "step-2",
        description: "Edit the section",
        successCriteria: "Requested changes are applied",
        kind: "write",
        status: "active",
      },
    ],
    milestones: [],
    mode: "execute",
    createdAt: 1,
    updatedAt: 2,
  } as ExecutionPlan;
}

describe("PlanPanel", () => {
  it("renders the plan summary, steps, and approval message", async () => {
    const { body } = render(PlanPanel, {
      props: {
        plan: makePlan(),
        approvalMessage: "Approval is still required before writing.",
      },
    });

    expect(body).toContain("active plan");
    expect(body).toContain("Revise the tracked section");
    expect(body).toContain("Read the current section");
    expect(body).toContain("Edit the section");
    expect(body).toContain("Approval is still required before writing.");
  });

  it("renders nothing when no active plan is present", () => {
    const { body } = render(PlanPanel, {
      props: {
        plan: null,
        approvalMessage: null,
      },
    });

    expect(body).not.toContain("active plan");
  });
});
