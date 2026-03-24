import type { AgentTool } from "@mariozechner/pi-agent-core";
import type {
  Disposable,
  HookRegistry,
  HostApp,
  ReasoningPattern,
  ScopeRiskEstimate,
  SkillMeta,
  StorageNamespace,
  VerificationSuite,
} from "@office-agents/sdk";
import type { CustomCommand } from "just-bash/browser";
import type { Component } from "svelte";

export type MaybePromise<T> = T | Promise<T>;

export interface LinkClickContext {
  href: string;
  anchor: HTMLAnchorElement;
  event: MouseEvent;
}

export type LinkClickResult = "handled" | "default";

export interface ToolExtrasProps {
  toolName: string;
  result?: string;
  expanded: boolean;
}

export interface BridgeRuntimeStateLike {
  mode: string;
  taskPhase: string;
  isStreaming: boolean;
  permissionMode: string;
  waitingState: string | null;
  activePlanSummary: {
    id: string;
    status: string;
    stepCount: number;
    activeStepIndex: number;
  } | null;
  activeTaskSummary: {
    id: string;
    status: string;
    mode: string;
    toolExecutionCount: number;
  } | null;
  contextBudget: { usagePct: number; action: string };
  lastVerification: { status: string } | null;
  sessionStats: {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
    messageCount: number;
  };
  error: string | null;
  threadCount: number;
  activeThreadId: string | null;
  degradedGuardrails: string[];
  promptProvenance?: {
    providerFamily: string;
    provider: string;
    model: string;
    phase: string;
    contributorCount: number;
    doctrineIds: string[];
    runtimeNotes: string[];
  } | null;
}

export interface AppAdapter {
  hostApp?: HostApp;
  tools: AgentTool[];
  bridgeEventSink?: (event: string, payload: Record<string, unknown>) => void;
  buildSystemPrompt: (skills: SkillMeta[]) => string;
  getDocumentId: () => Promise<string>;
  getDocumentMetadata?: () => Promise<{
    metadata: object;
    nameMap?: Record<number, string>;
  } | null>;
  onToolResult?: (toolCallId: string, result: string, isError: boolean) => void;
  metadataTag?: string;
  storageNamespace?: StorageNamespace;
  appVersion?: string;
  appName?: string;
  emptyStateMessage?: string;
  staticFiles?: Record<string, string>;
  customCommands?: () => CustomCommand[];
  registerHooks?: (
    registry: HookRegistry,
  ) => Disposable | Disposable[] | undefined;
  getReasoningPatterns?: () => ReasoningPattern[];
  getVerificationSuites?: () => VerificationSuite[];
  buildHandoffSummary?: (
    task: import("@office-agents/sdk").TaskRecord,
  ) => MaybePromise<string>;
  estimateScopeRisk?: (
    request: string,
    classification: import("@office-agents/sdk").TaskClassification,
  ) => MaybePromise<ScopeRiskEstimate>;
  getRuntimeState?: () => BridgeRuntimeStateLike | null;
  hasImageSearch?: boolean;
  showFollowModeToggle?: boolean;
  handleLinkClick?: (
    context: LinkClickContext,
  ) => MaybePromise<LinkClickResult>;
  ToolExtras?: Component<ToolExtrasProps>;
  HeaderExtras?: Component;
  SelectionIndicator?: Component;
}
