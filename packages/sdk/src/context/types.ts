export type OfficeApp = "word" | "excel" | "powerpoint";

export interface ContextBudget {
  summarizeThreshold: number;
  compactThreshold: number;
  pruneThreshold: number;
  emergencyThreshold: number;
}

export interface DocumentMap {
  app: OfficeApp;
  regions: Map<string, { hash: string; updatedAt: number }>;
}
