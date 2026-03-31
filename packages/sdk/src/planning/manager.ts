import { type PlanRecord, savePlanRecord } from "../storage/db";
import type {
  ExecutionPlan,
  PlanMilestone,
  PlanStep,
  StepStatus,
  TaskClassification,
  TaskRecord,
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

export interface StepActionProposal {
  ok: true;
  step: PlanStep;
  plan: ExecutionPlan;
}

export interface StepActionRejection {
  ok: false;
  error: string;
}

export type StepActionDecision = StepActionProposal | StepActionRejection;

function mergeUniqueStrings(current: string[], incoming: string[]): string[] {
  return [...new Set([...current, ...incoming])];
}

function mergePlanRequest(current: string, followUp: string): string {
  if (current.includes(followUp)) {
    return current;
  }
  return `${current}\n\nFollow-up request: ${followUp}`;
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

  proposeStepUpdate(stepId: string, status: StepStatus): StepActionDecision {
    if (!this.activePlan) {
      return {
        ok: false,
        error: "No active plan.",
      };
    }

    const step = this.activePlan.steps.find(
      (candidate) => candidate.id === stepId,
    );
    if (!step) {
      return {
        ok: false,
        error: `Unknown plan step "${stepId}".`,
      };
    }

    const blockedDependencies = (step.after ?? []).filter((dependencyId) => {
      const dependency = this.activePlan?.steps.find(
        (candidate) => candidate.id === dependencyId,
      );
      return dependency?.status !== "completed";
    });
    if (
      blockedDependencies.length > 0 &&
      (status === "completed" || status === "failed" || status === "skipped")
    ) {
      return {
        ok: false,
        error: `Cannot ${stepStatusToVerb(status)} "${stepId}" before its dependencies: ${blockedDependencies.join(", ")}.`,
      };
    }

    return {
      ok: true,
      step,
      plan: this.activePlan,
    };
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
      milestones: syncMilestones(this.activePlan.milestones, steps),
      updatedAt: Date.now(),
    };
    return this.activePlan;
  }

  syncWithExecution(
    task: Pick<TaskRecord, "mode" | "status" | "executionDiagnostics"> | null,
  ): ExecutionPlan | null {
    if (!this.activePlan) return null;

    const diagnostics = task?.executionDiagnostics;
    const hasRead = Boolean(
      diagnostics?.scopeReadCount ||
        diagnostics?.preWriteReadCount ||
        diagnostics?.firstReadAt,
    );
    const movedBeyondInspection = Boolean(
      diagnostics?.planAdvancedBeyondInspection ||
        diagnostics?.writeCount ||
        diagnostics?.failedWriteCount,
    );
    const hasSuccessfulWrite = Boolean(diagnostics?.writeCount);
    const hasPostWriteReread = Boolean(diagnostics?.postWriteRereadCount);

    const steps = this.activePlan.steps.map((step) => {
      let status: StepStatus = step.status;

      switch (step.kind) {
        case "read":
          status = hasRead ? "completed" : "pending";
          break;
        case "analyze":
          status = movedBeyondInspection
            ? "completed"
            : hasRead
              ? "active"
              : "pending";
          break;
        case "write":
          status = hasSuccessfulWrite
            ? "completed"
            : movedBeyondInspection
              ? "active"
              : "pending";
          break;
        case "verify":
          status = hasPostWriteReread
            ? "completed"
            : hasSuccessfulWrite || task?.mode === "verify"
              ? "active"
              : "pending";
          break;
      }

      return step.status === status
        ? step
        : {
            ...step,
            status,
            completedAt:
              status === "completed"
                ? (step.completedAt ?? Date.now())
                : undefined,
          };
    });

    const activeStep =
      steps.find((step) => step.status === "active") ??
      steps.find((step) => step.status === "pending") ??
      null;
    const planCompleted =
      steps.length > 0 && steps.every((step) => step.status === "completed");

    this.activePlan = {
      ...this.activePlan,
      status: planCompleted ? "completed" : "active",
      activeStepId: planCompleted ? null : (activeStep?.id ?? null),
      steps,
      milestones: syncMilestones(this.activePlan.milestones, steps),
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

  mergeContinuation(
    followUpRequest: string,
    options: {
      expectedEffects?: string[];
      approvalRequired?: boolean;
    } = {},
  ): ExecutionPlan | null {
    if (!this.activePlan) return null;
    this.activePlan = {
      ...this.activePlan,
      userRequest: mergePlanRequest(
        this.activePlan.userRequest,
        followUpRequest,
      ),
      summary: this.activePlan.summary
        ? mergePlanRequest(this.activePlan.summary, followUpRequest)
        : followUpRequest,
      requirements: mergeUniqueStrings(this.activePlan.requirements, [
        followUpRequest,
      ]),
      expectedEffects: mergeUniqueStrings(
        this.activePlan.expectedEffects,
        options.expectedEffects ?? [],
      ),
      approvalRequired:
        options.approvalRequired ?? this.activePlan.approvalRequired,
      updatedAt: Date.now(),
      revisionNotes: [
        ...this.activePlan.revisionNotes,
        {
          at: Date.now(),
          reason: `Merged follow-up request: ${followUpRequest}`,
        },
      ],
    };
    return this.activePlan;
  }

  finalize(
    status: ExecutionPlan["status"],
    reason?: string,
  ): ExecutionPlan | null {
    if (!this.activePlan) return null;
    this.activePlan = {
      ...this.activePlan,
      status,
      activeStepId: status === "active" ? this.activePlan.activeStepId : null,
      updatedAt: Date.now(),
      revisionNotes: reason
        ? [
            ...this.activePlan.revisionNotes,
            {
              at: Date.now(),
              reason,
            },
          ]
        : this.activePlan.revisionNotes,
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
    milestones: buildDefaultMilestones(steps),
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

function stepStatusToVerb(status: StepStatus): string {
  switch (status) {
    case "completed":
      return "complete";
    case "failed":
      return "fail";
    case "skipped":
      return "skip";
    default:
      return "update";
  }
}

function buildDefaultMilestones(steps: PlanStep[]): PlanMilestone[] {
  return [
    {
      id: "milestone-discover",
      title: "Inspect and analyze",
      stepIds: steps
        .filter((step) => step.kind === "read" || step.kind === "analyze")
        .map((step) => step.id),
      status: "pending",
    },
    {
      id: "milestone-execute",
      title: "Apply and verify",
      stepIds: steps
        .filter((step) => step.kind === "write" || step.kind === "verify")
        .map((step) => step.id),
      status: "pending",
    },
  ];
}

function syncMilestones(
  milestones: PlanMilestone[],
  steps: PlanStep[],
): PlanMilestone[] {
  return milestones.map((milestone) => {
    const milestoneSteps = steps.filter((step) =>
      milestone.stepIds.includes(step.id),
    );
    const completed = milestoneSteps.every(
      (step) => step.status === "completed",
    );
    const inProgress = milestoneSteps.some(
      (step) => step.status === "active" || step.status === "completed",
    );
    return {
      ...milestone,
      status: completed ? "completed" : inProgress ? "in_progress" : "pending",
    };
  });
}
