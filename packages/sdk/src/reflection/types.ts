export type ReflectionLevel = "micro" | "step" | "task";

export interface QualityCriteria {
  formatPreserved?: boolean;
  intentMatch?: boolean;
  scopeAppropriate?: boolean;
  noSideEffects?: boolean;
}

export interface ReflectionResult {
  level: ReflectionLevel;
  score: number;
  criteria: QualityCriteria;
  observations: string[];
  corrections?: string[];
  stepId?: string;
  timestamp: number;
}

export interface MicroReflectionInput {
  toolName: string;
  isError: boolean;
  warnings?: string[];
}

export interface StepReflectionInput {
  stepId: string;
  successCriteria: string[];
  summary?: string;
}

export interface TaskReflectionInput {
  taskId: string;
  summary?: string;
  observations?: string[];
}
