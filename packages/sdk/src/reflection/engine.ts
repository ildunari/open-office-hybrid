import { type ReflectionEntry, saveReflectionEntry } from "../storage/db";
import type {
  MicroReflectionInput,
  ReflectionResult,
  StepReflectionInput,
  TaskReflectionInput,
} from "./types";

export interface ReflectionEngineOptions {
  stepEvaluator?: (
    input: StepReflectionInput,
  ) => Promise<ReflectionResult> | ReflectionResult;
  taskEvaluator?: (
    input: TaskReflectionInput,
  ) => Promise<ReflectionResult> | ReflectionResult;
}

export class ReflectionEngine {
  private readonly results: ReflectionResult[] = [];

  constructor(private readonly options: ReflectionEngineOptions = {}) {}

  async microReflect(input: MicroReflectionInput): Promise<ReflectionResult> {
    const warnings = input.warnings?.length ?? 0;
    const score = input.isError ? 0 : warnings > 0 ? 0.6 : 1;
    const result: ReflectionResult = {
      level: "micro",
      score,
      criteria: {
        noSideEffects: !input.isError,
        scopeAppropriate: warnings === 0,
      },
      observations: input.isError
        ? [`${input.toolName} reported an error.`]
        : warnings > 0
          ? (input.warnings ?? [])
          : [`${input.toolName} completed cleanly.`],
      timestamp: Date.now(),
    };
    this.results.push(result);
    return result;
  }

  async stepReflect(input: StepReflectionInput): Promise<ReflectionResult> {
    const result = this.options.stepEvaluator
      ? await this.options.stepEvaluator(input)
      : {
          level: "step" as const,
          score: 0.75,
          criteria: { intentMatch: true, scopeAppropriate: true },
          observations: input.summary
            ? [input.summary]
            : ["Step completed and awaits runtime validation."],
          stepId: input.stepId,
          timestamp: Date.now(),
        };
    this.results.push(result);
    return result;
  }

  async taskReflect(input: TaskReflectionInput): Promise<ReflectionResult> {
    const result = this.options.taskEvaluator
      ? await this.options.taskEvaluator(input)
      : {
          level: "task" as const,
          score: 0.8,
          criteria: {
            intentMatch: true,
            scopeAppropriate: true,
            noSideEffects: true,
          },
          observations:
            input.observations && input.observations.length > 0
              ? input.observations
              : [
                  input.summary ??
                    "Task completed with foundation-level validation.",
                ],
          timestamp: Date.now(),
        };
    this.results.push(result);
    return result;
  }

  getResults(level?: ReflectionResult["level"]): ReflectionResult[] {
    return level
      ? this.results.filter((result) => result.level === level)
      : [...this.results];
  }

  async persist(sessionId: string): Promise<ReflectionEntry[]> {
    const entries: ReflectionEntry[] = [];
    for (const reflection of this.results) {
      await saveReflectionEntry(sessionId, reflection);
      entries.push({
        id: crypto.randomUUID(),
        sessionId,
        reflection,
        createdAt: reflection.timestamp,
      });
    }
    return entries;
  }
}
