import { type PlanRecord, savePlanRecord } from "../storage/db";
import type {
  ExecutionPlan,
  PlanStep,
  StepStatus,
  TaskClassification,
} from "./types";

export interface PlanManagerOptions {
  createPlanFn?: (
    message: string,
    classification: TaskClassification,
  ) => Promise<ExecutionPlan> | ExecutionPlan;
  writeFile?: (path: string, content: string) => Promise<void> | void;
}

export interface StepUpdateResult {
  toolCallId?: string;
  note?: string;
  error?: string;
}

export class PlanManager {
  private activePlan: ExecutionPlan | null = null;

  constructor(private readonly options: PlanManagerOptions = {}) {}

  async createPlan(
    message: string,
    classification: TaskClassification,
  ): Promise<ExecutionPlan> {
    const plan = this.options.createPlanFn
      ? await this.options.createPlanFn(message, classification)
      : buildDefaultPlan(message, classification);
    this.activePlan = plan;
    return plan;
  }

  getActivePlan(): ExecutionPlan | null {
    return this.activePlan;
  }

  replacePlan(plan: ExecutionPlan): ExecutionPlan {
    this.activePlan = clonePlan(plan);
    return this.activePlan;
  }

  updateStep(
    stepId: string,
    status: StepStatus,
    result?: StepUpdateResult,
  ): ExecutionPlan | null {
    if (!this.activePlan) return null;

    const steps = this.activePlan.steps.map((step) => {
      if (step.id !== stepId) return step;
      const toolCalls = result?.toolCallId
        ? [...step.toolCalls, result.toolCallId]
        : step.toolCalls;
      return {
        ...step,
        status,
        error: result?.error ?? step.error,
        toolCalls,
        completedAt:
          status === "completed" || status === "failed" || status === "skipped"
            ? Date.now()
            : step.completedAt,
      };
    });

    this.activePlan = {
      ...this.activePlan,
      steps,
      updatedAt: Date.now(),
    };
    return this.activePlan;
  }

  revisePlan(planId: string, reason: string): ExecutionPlan | null {
    if (!this.activePlan || this.activePlan.id !== planId) return null;
    this.activePlan = {
      ...this.activePlan,
      mode: "revised",
      updatedAt: Date.now(),
      revisionNotes: [
        ...this.activePlan.revisionNotes,
        { at: Date.now(), reason },
      ],
    };
    return this.activePlan;
  }

  formatPlanForPrompt(plan = this.activePlan): string {
    return plan ? formatPlanForPrompt(plan) : "";
  }

  async persist(sessionId: string): Promise<PlanRecord | null> {
    if (!this.activePlan) return null;

    await savePlanRecord(sessionId, this.activePlan);
    if (this.options.writeFile) {
      await this.options.writeFile(
        `/.oa/plans/${this.activePlan.id}.json`,
        JSON.stringify(this.activePlan, null, 2),
      );
    }

    return {
      id: this.activePlan.id,
      sessionId,
      plan: clonePlan(this.activePlan),
      createdAt: this.activePlan.createdAt,
      updatedAt: this.activePlan.updatedAt,
    };
  }

  hydrate(record: PlanRecord | null | undefined): ExecutionPlan | null {
    this.activePlan = record ? clonePlan(record.plan) : null;
    return this.activePlan;
  }
}

export function buildDefaultPlan(
  userRequest: string,
  classification: TaskClassification,
): ExecutionPlan {
  const now = Date.now();
  const steps: PlanStep[] = [
    {
      id: "step-read",
      description:
        "Read the current target content and gather the exact scope.",
      kind: "read",
      status: "pending",
      successCriteria:
        "The current target state has been inspected before any write.",
      retryLimit: 1,
      retryCount: 0,
      toolCalls: [],
    },
    {
      id: "step-analyze",
      description:
        "Analyze the requested change and prepare the edit approach.",
      kind: "analyze",
      status: "pending",
      successCriteria:
        "The change strategy matches the request and known constraints.",
      retryLimit: 1,
      retryCount: 0,
      toolCalls: [],
      after: ["step-read"],
    },
    {
      id: "step-write",
      description: "Apply the document or workbook changes.",
      kind: "write",
      status: "pending",
      successCriteria: "The requested mutation completes without errors.",
      retryLimit: classification.risk === "high" ? 2 : 1,
      retryCount: 0,
      toolCalls: [],
      after: ["step-analyze"],
    },
    {
      id: "step-verify",
      description: "Re-read the affected scope and verify the result.",
      kind: "verify",
      status: "pending",
      successCriteria:
        "The final state matches the request and passes validation.",
      retryLimit: 1,
      retryCount: 0,
      toolCalls: [],
      after: ["step-write"],
    },
  ];

  return {
    id: crypto.randomUUID(),
    userRequest,
    summary: userRequest,
    mode: "auto",
    status: "active",
    activeStepId: steps[0]?.id ?? null,
    requirements: [userRequest],
    strategy: [
      "Inspect the current host state before mutation.",
      "Apply the minimal change needed for the request.",
      "Verify the observed result against the intended effect.",
    ],
    executionUnits: [
      {
        id: "unit-default",
        title: "Execute default plan",
        stepIds: steps.map((step) => step.id),
        mode: "execute",
      },
    ],
    verification: [
      {
        id: "verify-default",
        label: "Verify final host state",
        expectedEffect: "The final state matches the request.",
      },
    ],
    approvalRequired: classification.risk === "high",
    expectedEffects: ["The final state matches the request."],
    steps,
    createdAt: now,
    updatedAt: now,
    classification,
    revisionNotes: [],
  };
}

export function formatPlanForPrompt(plan: ExecutionPlan): string {
  const steps = plan.steps
    .map(
      (step, index) =>
        `${index + 1}. [${step.status}] ${step.description} :: ${step.successCriteria}`,
    )
    .join("\n");
  return `<execution_plan>\n${steps}\n</execution_plan>`;
}

function clonePlan(plan: ExecutionPlan): ExecutionPlan {
  return JSON.parse(JSON.stringify(plan)) as ExecutionPlan;
}
