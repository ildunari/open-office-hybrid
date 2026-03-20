import type { ExecutionPlan, TaskRecord } from "../planning";
import type {
  ActivePatternMetadata,
  HandoffPacket,
} from "../verification/types";
import type { ContextBudget, DocumentMap, OfficeApp } from "./types";

export type ContextAction =
  | "none"
  | "summarize"
  | "compact"
  | "prune"
  | "emergency";

const DEFAULT_BUDGET: ContextBudget = {
  summarizeThreshold: 60,
  compactThreshold: 75,
  pruneThreshold: 85,
  emergencyThreshold: 92,
};

export class ContextManager {
  constructor(private readonly budget: ContextBudget = DEFAULT_BUDGET) {}

  getActionForUsage(usagePct: number): ContextAction {
    if (usagePct >= this.budget.emergencyThreshold) return "emergency";
    if (usagePct >= this.budget.pruneThreshold) return "prune";
    if (usagePct >= this.budget.compactThreshold) return "compact";
    if (usagePct >= this.budget.summarizeThreshold) return "summarize";
    return "none";
  }

  getWorkingMemoryPaths(planId: string) {
    return {
      plan: `/.oa/plans/${planId}.json`,
      taskState: "/.oa/state/task.json",
      reflections: "/.oa/state/reflections.json",
      documentMap: "/.oa/context/document-map.json",
      workingSet: "/.oa/context/working-set.json",
    };
  }

  createDocumentMap(app: OfficeApp): DocumentMap {
    return { app, regions: new Map() };
  }

  updateRegionHash(
    documentMap: DocumentMap,
    regionKey: string,
    hash: string,
    updatedAt = Date.now(),
  ): DocumentMap {
    documentMap.regions.set(regionKey, { hash, updatedAt });
    return documentMap;
  }

  buildRequirementsSnapshot(
    request: string,
    mode: string,
    constraints: string[],
    expectedEffects: string[],
  ) {
    return {
      request,
      mode,
      constraints,
      expectedEffects,
      updatedAt: Date.now(),
    };
  }

  buildWorkingSet(
    plan: ExecutionPlan | null,
    task: TaskRecord | null,
    patterns: ActivePatternMetadata[],
  ) {
    return {
      activePlanId: plan?.id ?? null,
      activeTaskId: task?.id ?? null,
      activeStepId: plan?.activeStepId ?? null,
      activePatternIds: patterns.map((pattern) => pattern.id),
      scopeSummary: task?.scopeSummary ?? null,
      updatedAt: Date.now(),
    };
  }

  compactToolExecutions(
    executions: NonNullable<TaskRecord["toolExecutions"]>,
    keepLast = 6,
  ) {
    if (executions.length <= keepLast) {
      return {
        kept: executions,
        summary: [] as string[],
      };
    }

    const dropped = executions.slice(0, executions.length - keepLast);
    const kept = executions.slice(-keepLast);
    const summary = dropped.map(
      (entry) =>
        `${entry.toolName}: ${entry.isError ? "error" : "ok"} (${entry.resultText.slice(0, 80)})`,
    );

    return { kept, summary };
  }

  buildHandoff(
    task: TaskRecord,
    incompleteVerifications: string[],
    nextRecommendedAction: string,
  ): HandoffPacket {
    return {
      taskId: task.id,
      mode: task.mode ?? "blocked",
      currentIntent: task.userRequest,
      activeScope: task.scopeSummary,
      constraints: task.constraints ?? [],
      incompleteVerifications,
      nextRecommendedAction,
      summary:
        task.undoNarrative ??
        `Resume ${task.userRequest} from ${task.scopeSummary ?? "current scope"}.`,
      attachmentPaths: task.attachments,
      updatedAt: Date.now(),
    };
  }
}
