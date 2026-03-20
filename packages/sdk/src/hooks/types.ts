import type { AgentToolResult } from "@mariozechner/pi-agent-core";

export type HookPhase = "pre" | "post";
export type HookBand = "early" | "default" | "late";
export type HookSpeed = "sync" | "fast" | "slow";
export type HookFailurePolicy = "ignore" | "warn" | "abort";
export type HookAction = "continue" | "abort" | "skip";

export type ToolTag =
  | "read"
  | "write"
  | "destructive"
  | "office-js"
  | "shell"
  | "fs";

export interface HookSelector {
  toolNames?: string[];
  toolPatterns?: string[];
  tags?: ToolTag[];
}

export interface HookSourceRef {
  patternId?: string;
  hookName: string;
}

export interface HookPromptNote {
  level: "info" | "warning" | "error";
  text: string;
  source: HookSourceRef;
}

export interface HookWarning {
  message: string;
  source: HookSourceRef;
}

export interface HookBudget {
  totalMs: number;
  elapsedMs: number;
}

export interface HookSessionState {
  readScopes: Set<string>;
  formatFingerprints: Map<string, string>;
  custom: Map<string, unknown>;
}

export interface PreHookContext {
  toolName: string;
  tags: ToolTag[];
  params: Record<string, unknown>;
  toolCallId: string;
  budget: HookBudget;
  signal?: AbortSignal;
  captures: Map<string, unknown>;
  sessionState: HookSessionState;
}

export interface PreHookResult {
  action: HookAction;
  errorMessage?: string;
  promptNotes?: HookPromptNote[];
  modifiedParams?: Record<string, unknown>;
}

export interface PostHookContext {
  toolName: string;
  tags: ToolTag[];
  params: Record<string, unknown>;
  result: AgentToolResult<unknown>;
  isError: boolean;
  toolCallId: string;
  budget: HookBudget;
  signal?: AbortSignal;
  captures: Map<string, unknown>;
  sessionState: HookSessionState;
}

export interface PostHookResult {
  warnings?: HookWarning[];
  promptNotes?: HookPromptNote[];
  modifiedResult?: AgentToolResult<unknown>;
}

export interface PreHookDefinition {
  name: string;
  selector?: HookSelector;
  band?: HookBand;
  priority?: number;
  after?: string[];
  speed: HookSpeed;
  onFailure?: HookFailurePolicy;
  source: HookSourceRef;
  execute: (ctx: PreHookContext) => Promise<PreHookResult> | PreHookResult;
}

export interface PostHookDefinition {
  name: string;
  selector?: HookSelector;
  band?: HookBand;
  priority?: number;
  after?: string[];
  speed: HookSpeed;
  onFailure?: HookFailurePolicy;
  source: HookSourceRef;
  execute: (ctx: PostHookContext) => Promise<PostHookResult> | PostHookResult;
}

export interface Disposable {
  dispose(): void;
}

export type OfficeApp = "word" | "excel" | "powerpoint";

export interface WordScope {
  app: "word";
  startChild?: number;
  endChild?: number;
  startParagraph?: number;
  endParagraph?: number;
}

export interface ExcelScope {
  app: "excel";
  sheet?: string;
  range?: string;
}

export interface PowerPointScope {
  app: "powerpoint";
  slideIndex?: number;
}

export type DocumentScope = WordScope | ExcelScope | PowerPointScope;
export type RiskLevel = "none" | "low" | "medium" | "high";

export interface ToolCallEnvelope {
  toolName: string;
  toolCallId: string;
  params: Record<string, unknown>;
  tags: ToolTag[];
  risk: RiskLevel;
  scope?: DocumentScope;
  app?: OfficeApp;
  startedAt: number;
}
