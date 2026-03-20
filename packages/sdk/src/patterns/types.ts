import type { OfficeApp } from "../context/types";
import type { ExecutionPlan, TaskClassification } from "../planning";
import type { ActivePatternMetadata } from "../verification/types";

export interface Disposable {
  dispose(): void;
}

export interface ReasoningPattern<TState = unknown> {
  id: string;
  name: string;
  apps: OfficeApp[];
  triggers: (
    classification: TaskClassification,
    plan?: ExecutionPlan,
  ) => boolean;
  describeActivation?: (
    classification: TaskClassification,
    plan?: ExecutionPlan,
  ) => ActivePatternMetadata;
  activate: (registry: unknown, state: TState) => Disposable;
  defaultState: () => TState;
}
