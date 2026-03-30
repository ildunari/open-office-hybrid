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

export interface CompactionSummary {
  decisions: string[];
  constraints: string[];
  progress: string[];
  currentState: string;
  nextSteps: string[];
  sourceMessageCount: number;
  timestamp: number;
}

export interface CompactionLedgerEntry {
  id: string;
  summary: CompactionSummary;
  cascadeDepth: number;
  createdAt: number;
}
