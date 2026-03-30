import {
  Agent,
  type AgentEvent,
  type AgentMessage,
  type ThinkingLevel as AgentThinkingLevel,
  type AgentTool,
} from "@mariozechner/pi-agent-core";
import {
  type Api,
  type AssistantMessage,
  getModel,
  getModels,
  getProviders,
  type Model,
  streamSimple,
} from "@mariozechner/pi-ai";
import type { CustomCommand } from "just-bash/browser";
import { appendLedger, loadLedger } from "./context/compaction-ledger";
import { ContextCompactor } from "./context/compactor";
import { ContextManager } from "./context/manager";
import type { CompactionLedgerEntry, CompactionSummary } from "./context/types";
import {
  type Disposable,
  HookRegistry,
  hasReadCoverage,
  readBeforeWritePostHook,
  readBeforeWritePreHook,
  scopeKeyFromParams,
} from "./hooks";
import {
  agentMessagesToChatMessages,
  type ChatMessage,
  deriveStats,
  extractPartsFromAssistantMessage,
  generateId,
  type SessionStats,
} from "./message-utils";
import {
  loadOAuthCredentials,
  refreshOAuthToken,
  saveOAuthCredentials,
} from "./oauth";
import type {
  ApprovalPolicy,
  ApprovalPolicyMode,
  CapabilityBoundary,
  CapabilityBoundaryMode,
  HostApp,
  PermissionMode,
  PolicyTraceEntry,
  TaskPhase,
  WaitingState,
} from "./orchestration/types";
import {
  approvalPolicyForPermissionMode,
  capabilityBoundaryForPermissionMode,
  permissionModeFromPolicy,
} from "./orchestration/types";
import { PatternRegistry } from "./patterns/registry";
import type { ReasoningPattern } from "./patterns/types";
import {
  type CompactionArtifact,
  type CompletionArtifact,
  createUpdatePlanTool,
  type ExecutionPlan,
  inferTaskClassification,
  PlanManager,
  TaskClassifier,
  type TaskRecord,
  type TaskThreadSummary,
} from "./planning";
import type { PromptPhase, PromptProviderFamily } from "./prompt-contract";
import {
  buildPromptContract,
  inferPromptPhase,
  inferProviderFamily,
} from "./prompt-contract";
import {
  applyProxyToModel,
  buildCustomModel,
  loadSavedConfig,
  type ProviderConfig,
  saveConfig,
  type ThinkingLevel,
} from "./provider-config";
import { ReflectionEngine } from "./reflection/engine";
import {
  addSkill,
  getInstalledSkills,
  removeSkill,
  type SkillMeta,
  syncSkillsToVfs,
} from "./skills";
import {
  buildLocalDoctrinePromptSection,
  selectLocalDoctrineContributors,
} from "./skills/local-doctrine";
import { TaskTracker } from "./state/tracker";
import {
  type ChatSession,
  createCompactionArtifact,
  createCompletionArtifact,
  createSession,
  deleteCompactionArtifacts,
  deleteCompletionArtifacts,
  deleteSession,
  deleteThreadSummaries,
  getOrCreateCurrentSession,
  getSession,
  listCompactionArtifacts,
  listCompletionArtifacts,
  listSessions,
  listThreadSummaries,
  loadVfsFiles,
  saveSession,
  saveThreadSummary,
  saveVfsFiles,
} from "./storage";
import {
  deletePlanRecords,
  deleteReflectionEntries,
  deleteTaskRecords,
  getLatestPlanRecord,
  getLatestTaskRecord,
} from "./storage/db";
import {
  type ActivePatternMetadata,
  type ApprovalRequest,
  type HandoffPacket,
  type ScopeRiskEstimate,
  VerificationEngine,
  type VerificationRunSummary,
  type VerificationSuite,
} from "./verification";
import {
  deleteFile,
  listUploads,
  resetVfs,
  restoreVfs,
  setCustomCommands,
  setStaticFiles,
  snapshotVfs,
  writeFile,
} from "./vfs";

export type PromptProvenanceContributorKind =
  | "system_prompt"
  | "prompt_contract"
  | "local_doctrine"
  | "document_metadata"
  | "attachments"
  | "plan"
  | "context_budget"
  | "hook_notes"
  | "user_request";

export interface PromptProvenanceContributor {
  id: string;
  kind: PromptProvenanceContributorKind;
  label: string;
  order: number;
  summary: string;
  path?: string;
}

export interface PromptProvenance {
  providerFamily: PromptProviderFamily;
  provider: string;
  model: string;
  apiType: string;
  phase: PromptPhase;
  contributors: PromptProvenanceContributor[];
  runtimeNotes: string[];
  updatedAt: number;
}

export interface RuntimeAdapter {
  hostApp?: HostApp;
  tools: AgentTool[];
  buildSystemPrompt: (skills: SkillMeta[]) => string;
  getDocumentId: () => Promise<string>;
  getDocumentMetadata?: () => Promise<{
    metadata: object;
    nameMap?: Record<number, string>;
  } | null>;
  onToolResult?: (toolCallId: string, result: string, isError: boolean) => void;
  metadataTag?: string;
  staticFiles?: Record<string, string>;
  customCommands?: () => CustomCommand[];
  registerHooks?: (
    registry: HookRegistry,
  ) => Disposable | Disposable[] | undefined;
  getReasoningPatterns?: () => ReasoningPattern[];
  getVerificationSuites?: () => VerificationSuite[];
  buildHandoffSummary?: (task: TaskRecord) => Promise<string> | string;
  estimateScopeRisk?: (
    request: string,
    classification: Awaited<ReturnType<TaskClassifier["classify"]>>,
  ) => Promise<ScopeRiskEstimate> | ScopeRiskEstimate;
  bridgeEventSink?: (event: string, payload: Record<string, unknown>) => void;
}

export interface UploadedFile {
  name: string;
  size: number;
}

export interface RuntimeState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  providerConfig: ProviderConfig | null;
  sessionStats: SessionStats;
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  nameMap: Record<number, string>;
  uploads: UploadedFile[];
  isUploading: boolean;
  skills: SkillMeta[];
  vfsInvalidatedAt: number;
  mode: import("./planning").RuntimeMode;
  approvalRequest: ApprovalRequest | null;
  handoff: HandoffPacket | null;
  lastVerification: VerificationRunSummary | null;
  degradedGuardrails: string[];
  activePatternMetadata: ActivePatternMetadata[];
  activeHookNames: string[];
  contextBudgetState: { action: string; usagePct: number } | null;
  lastPromptNotes: string[];
  promptProvenance: PromptProvenance | null;
  activePlan: ExecutionPlan | null;
  activeTask: TaskRecord | null;
  planState: ExecutionPlan | null;
  taskPhase: TaskPhase;
  permissionMode: PermissionMode;
  waitingState: WaitingState | null;
  capabilityBoundary: CapabilityBoundary;
  approvalPolicy: ApprovalPolicy;
  policyTrace: PolicyTraceEntry[];
  instructionSources: Array<{
    id: string;
    kind: "app_global" | "host_specific" | "document_memory" | "session_memory";
    label: string;
    precedence: number;
    summary: string;
    updatedAt?: number;
  }>;
  threads: TaskThreadSummary[];
  activeThreadId: string | null;
  compactionState: {
    artifactCount: number;
    lastCompactedThreadId: string | null;
    updatedAt: number;
  } | null;
  completionArtifacts: CompletionArtifact[];
  activeVerifierIds: string[];
}

type StateListener = (state: RuntimeState) => void;

const INITIAL_STATS: SessionStats = { ...deriveStats([]), contextWindow: 0 };

function thinkingLevelToAgent(level: ThinkingLevel): AgentThinkingLevel {
  return level === "none" ? "off" : level;
}

function toTaskPhase(mode: RuntimeState["mode"]): TaskPhase {
  if (mode === "awaiting_approval") return "waiting_on_user";
  if (mode === "plan") return "plan";
  if (mode === "execute") return "execute";
  if (mode === "verify") return "verify";
  if (mode === "completed") return "completed";
  if (mode === "blocked") return "blocked";
  return "discuss";
}

function buildWaitingState(
  state: Pick<RuntimeState, "mode" | "approvalRequest" | "handoff">,
): WaitingState | null {
  if (state.approvalRequest) {
    return {
      kind: "approval",
      reason: state.approvalRequest.reason,
      resumeMessage:
        state.approvalRequest.uiMessage ??
        state.handoff?.summary ??
        state.approvalRequest.reason,
      actionClass: state.approvalRequest.actionClass,
      scopes: state.approvalRequest.scopes,
      createdAt: state.approvalRequest.requestedAt,
    };
  }
  return null;
}

const MAX_POLICY_TRACE_ENTRIES = 25;
const WORD_READ_TOOL_NAMES = new Set([
  "get_document_text",
  "get_document_structure",
  "get_ooxml",
  "get_paragraph_ooxml",
]);
const WORD_WRITE_TOOL_NAMES = new Set(["execute_office_js"]);
const GENERIC_INSPECTION_TOOL_NAMES = new Set(["bash", "read"]);
const NO_WRITE_LOOP_READ_LIMIT = 4;
const NO_WRITE_LOOP_INSPECTION_LIMIT = 6;
const NO_WRITE_LOOP_MS_LIMIT = 45_000;
const NO_WRITE_LOOP_RECOVERY_LIMIT = 1;

function createCapabilityBoundary(
  mode: CapabilityBoundaryMode,
): CapabilityBoundary {
  switch (mode) {
    case "read_only":
      return {
        mode,
        blockedActionClasses: [
          "benign_write",
          "structural_write",
          "destructive_write",
          "external_io",
          "unsafe_eval",
        ],
        description:
          "Blocks all mutation-capable work until the boundary changes.",
      };
    case "full_host_access":
      return {
        mode,
        blockedActionClasses: [],
        description:
          "Allows unrestricted host access, including risky mutations.",
      };
    default:
      return {
        mode,
        blockedActionClasses: [],
        description:
          "Allows normal host work while deferring high-risk actions to approval policy.",
      };
  }
}

function createApprovalPolicy(mode: ApprovalPolicyMode): ApprovalPolicy {
  switch (mode) {
    case "confirm_writes":
      return {
        mode,
        description:
          "Requests approval before any write-capable task continues.",
      };
    case "auto":
      return {
        mode,
        description: "Allows write-capable tasks to continue automatically.",
      };
    default:
      return {
        mode,
        description:
          "Allows low-risk work automatically and pauses for riskier mutations.",
      };
  }
}

function summarizeJson(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (!serialized) return "No details available.";
  return serialized.length > 180
    ? `${serialized.slice(0, 177)}...`
    : serialized;
}

function summarizeMetadataTag(tag: string, metadata: object): string {
  const keys = Object.keys(metadata);
  if (keys.length === 0) return `${tag} with no fields`;
  const preview = keys.slice(0, 3).join(", ");
  return `${tag} with fields: ${preview}${keys.length > 3 ? ", ..." : ""}`;
}

function summarizeAttachments(attachments: string[]): string {
  if (attachments.length === 0) return "No attachments.";
  if (attachments.length === 1) return attachments[0] ?? "1 attachment";
  return `${attachments.length} attachments: ${attachments.slice(0, 3).join(", ")}${attachments.length > 3 ? ", ..." : ""}`;
}

function inferPlanStepIndex(
  plan: ExecutionPlan | null,
  task: TaskRecord | null,
): number {
  if (!plan) return -1;
  if (task?.status === "completed" || task?.mode === "completed") return -1;
  if (task?.mode === "verify") {
    return plan.steps.findIndex((step) => step.kind === "verify");
  }

  const diagnostics = task?.executionDiagnostics;
  if (diagnostics?.writeCount && diagnostics.writeCount > 0) {
    if (diagnostics.postWriteRereadCount > 0) {
      const verifyIndex = plan.steps.findIndex(
        (step) => step.kind === "verify",
      );
      return verifyIndex >= 0 ? verifyIndex : plan.steps.length - 1;
    }
    return plan.steps.findIndex((step) => step.kind === "write");
  }

  if (diagnostics?.scopeReadCount && diagnostics.scopeReadCount > 0) {
    const analyzeIndex = plan.steps.findIndex(
      (step) => step.kind === "analyze",
    );
    return analyzeIndex >= 0 ? analyzeIndex : 0;
  }

  return plan.activeStepId
    ? plan.steps.findIndex((step) => step.id === plan.activeStepId)
    : -1;
}

export class AgentRuntime {
  private agent: Agent | null = null;
  private unsubscribeAgent: (() => void) | null = null;
  private config: ProviderConfig | null = null;
  private pendingConfig: ProviderConfig | null = null;
  private streamingMessageId: string | null = null;
  private streamingBuffer: AgentEvent | null = null;
  private flushScheduled = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private isStreaming = false;
  private documentId: string | null = null;
  private currentSessionId: string | null = null;
  private sessionLoaded = false;
  private followMode = true;
  private skills: SkillMeta[] = [];
  private adapter: RuntimeAdapter;
  private hookRegistry: HookRegistry;
  private adapterHookDisposables: Disposable[] = [];
  private taskClassifier = new TaskClassifier();
  private planManager = new PlanManager({ writeFile });
  private taskTracker = new TaskTracker();
  private reflectionEngine = new ReflectionEngine();
  private contextManager = new ContextManager();
  private readonly compactor = new ContextCompactor();
  private patternRegistry = new PatternRegistry();
  private verificationEngine = new VerificationEngine();
  private listeners: Set<StateListener> = new Set();
  private lastDocumentMetadata: object | null = null;
  private lastDocumentMetadataUpdatedAt: number | null = null;
  private interruptedStreamingReason:
    | "inspection_budget_exhausted"
    | "inspection_budget_recovery"
    | null = null;
  private pendingNoWriteRecovery: {
    content: string;
    attachments?: string[];
  } | null = null;
  private state: RuntimeState;

  constructor(adapter: RuntimeAdapter) {
    this.adapter = adapter;
    this.hookRegistry = new HookRegistry();
    this.hookRegistry.registerPre(readBeforeWritePreHook);
    this.hookRegistry.registerPost(readBeforeWritePostHook);
    this.syncAdapterHooks(adapter);
    this.syncAdapterPatterns(adapter);
    this.syncAdapterVerifiers(adapter);
    const saved = loadSavedConfig();
    const validConfig =
      saved?.provider && saved?.apiKey && saved?.model ? saved : null;
    this.followMode = validConfig?.followMode ?? true;
    const capabilityMode =
      validConfig?.capabilityBoundaryMode ??
      capabilityBoundaryForPermissionMode(validConfig?.permissionMode);
    const approvalMode =
      validConfig?.approvalPolicyMode ??
      approvalPolicyForPermissionMode(validConfig?.permissionMode);
    this.state = {
      messages: [],
      isStreaming: false,
      error: null,
      providerConfig: validConfig,
      sessionStats: INITIAL_STATS,
      currentSession: null,
      sessions: [],
      nameMap: {},
      uploads: [],
      isUploading: false,
      skills: [],
      vfsInvalidatedAt: 0,
      mode: "discuss",
      approvalRequest: null,
      handoff: null,
      lastVerification: null,
      degradedGuardrails: [],
      activePatternMetadata: [],
      activeHookNames: this.hookRegistry.getRegisteredHookNames(),
      contextBudgetState: null,
      lastPromptNotes: [],
      promptProvenance: null,
      activePlan: null,
      activeTask: null,
      planState: null,
      taskPhase: "discuss",
      permissionMode: permissionModeFromPolicy(capabilityMode, approvalMode),
      waitingState: null,
      capabilityBoundary: createCapabilityBoundary(capabilityMode),
      approvalPolicy: createApprovalPolicy(approvalMode),
      policyTrace: [],
      instructionSources: [],
      threads: [],
      activeThreadId: null,
      compactionState: null,
      completionArtifacts: [],
      activeVerifierIds: this.verificationEngine
        .getSuites()
        .map((suite) => suite.id),
    };
  }

  getState(): RuntimeState {
    return this.state;
  }

  getRuntimeStateSlice(): {
    mode: string;
    taskPhase: string;
    isStreaming: boolean;
    permissionMode: string;
    waitingState: string | null;
    waitingReason: string | null;
    handoffSummary: string | null;
    nextRecommendedAction: string | null;
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
    lastVerification: { status: string; retryable: boolean } | null;
    latestCompletion: {
      summary: string;
      verificationStatus: string;
    } | null;
    promptProvenance: {
      providerFamily: string;
      provider: string;
      model: string;
      phase: string;
      contributorCount: number;
      doctrineIds: string[];
      runtimeNotes: string[];
    } | null;
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
  } {
    const s = this.state;
    const plan = s.activePlan;
    const task = s.activeTask;
    const stats = s.sessionStats;
    return {
      mode: s.mode,
      taskPhase: s.taskPhase,
      isStreaming: s.isStreaming,
      permissionMode: s.permissionMode,
      waitingState: s.waitingState?.kind ?? null,
      waitingReason: s.waitingState?.reason ?? null,
      handoffSummary: s.handoff?.summary ?? null,
      nextRecommendedAction: s.handoff?.nextRecommendedAction ?? null,
      activePlanSummary: plan
        ? {
            id: plan.id,
            status: plan.status,
            stepCount: plan.steps.length,
            activeStepIndex: inferPlanStepIndex(plan, task),
          }
        : null,
      activeTaskSummary: task
        ? {
            id: task.id,
            status: task.status,
            mode: task.mode ?? "discuss",
            toolExecutionCount: task.toolExecutions?.length ?? 0,
          }
        : null,
      contextBudget: s.contextBudgetState ?? { usagePct: 0, action: "none" },
      lastVerification: s.lastVerification
        ? {
            status: s.lastVerification.status,
            retryable: s.lastVerification.retryable,
          }
        : null,
      latestCompletion: s.completionArtifacts[0]
        ? {
            summary: s.completionArtifacts[0].summary,
            verificationStatus: s.completionArtifacts[0].verificationStatus,
          }
        : null,
      promptProvenance: s.promptProvenance
        ? {
            providerFamily: s.promptProvenance.providerFamily,
            provider: s.promptProvenance.provider,
            model: s.promptProvenance.model,
            phase: s.promptProvenance.phase,
            contributorCount: s.promptProvenance.contributors.length,
            doctrineIds: s.promptProvenance.contributors
              .filter((contributor) => contributor.kind === "local_doctrine")
              .flatMap((contributor) =>
                contributor.summary
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              ),
            runtimeNotes: [...s.promptProvenance.runtimeNotes],
          }
        : null,
      sessionStats: {
        inputTokens: stats.inputTokens,
        outputTokens: stats.outputTokens,
        totalCost: stats.totalCost,
        messageCount: s.messages.length,
      },
      error: s.error,
      threadCount: s.threads.length,
      activeThreadId: s.activeThreadId,
      degradedGuardrails: s.degradedGuardrails,
    };
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private emitBridgeEvent(event: string, payload: Record<string, unknown>) {
    try {
      this.adapter.bridgeEventSink?.(event, payload);
    } catch {
      // Bridge event emission is best-effort; never block runtime.
    }
  }

  private update(partial: Partial<RuntimeState>) {
    const prevMode = this.state.mode;
    const prevPhase = this.state.taskPhase;
    this.state = this.syncHybridState({ ...this.state, ...partial });
    if (this.state.mode !== prevMode) {
      this.emitBridgeEvent("state:mode_changed", {
        from: prevMode,
        to: this.state.mode,
      });
    }
    if (this.state.taskPhase !== prevPhase) {
      this.emitBridgeEvent("state:phase_changed", {
        from: prevPhase,
        to: this.state.taskPhase,
      });
    }
    this.emit();
  }

  private bumpVfs() {
    this.update({ vfsInvalidatedAt: Date.now() });
  }

  private updateMessages(
    updater: (messages: ChatMessage[]) => ChatMessage[],
    extra?: Partial<RuntimeState>,
  ) {
    this.state = this.syncHybridState({
      ...this.state,
      messages: updater(this.state.messages),
      ...extra,
    });
    this.emit();
  }

  private scheduleFlush() {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    this.flushTimer = setTimeout(() => this.flushStreamingBuffer(), 80);
  }

  private flushStreamingBuffer() {
    this.flushScheduled = false;
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    const event = this.streamingBuffer;
    if (!event || event.type !== "message_update") return;
    this.streamingBuffer = null;
    const streamId = this.streamingMessageId;
    if (!streamId) return;
    this.updateMessages((msgs) => {
      const messages = [...msgs];
      const idx = messages.findIndex((message) => message.id === streamId);
      if (idx !== -1) {
        const parts = extractPartsFromAssistantMessage(
          event.message,
          messages[idx].parts,
        );
        messages[idx] = { ...messages[idx], parts };
      }
      return messages;
    });
  }

  private syncHybridState(next: RuntimeState): RuntimeState {
    const permissionMode = permissionModeFromPolicy(
      next.capabilityBoundary.mode,
      next.approvalPolicy.mode,
    );
    return {
      ...next,
      permissionMode,
      planState: next.activePlan,
      taskPhase: toTaskPhase(next.mode),
      waitingState: buildWaitingState(next),
    };
  }

  setAdapter(adapter: RuntimeAdapter) {
    if (this.adapter === adapter) return;
    this.adapter = adapter;
    this.syncAdapterHooks(adapter);
    this.syncAdapterPatterns(adapter);
    this.syncAdapterVerifiers(adapter);

    if (this.state.providerConfig && !this.isStreaming) {
      this.applyConfig(this.state.providerConfig);
    }
    void this.refreshInstructionSources();
  }

  setPermissionMode(mode: PermissionMode) {
    const capabilityMode = capabilityBoundaryForPermissionMode(mode);
    const approvalMode = approvalPolicyForPermissionMode(mode);
    const nextConfig = this.state.providerConfig
      ? {
          ...this.state.providerConfig,
          permissionMode: mode,
          capabilityBoundaryMode: capabilityMode,
          approvalPolicyMode: approvalMode,
        }
      : null;
    if (nextConfig) {
      saveConfig(nextConfig);
    }
    this.update({
      providerConfig: nextConfig,
      capabilityBoundary: createCapabilityBoundary(capabilityMode),
      approvalPolicy: createApprovalPolicy(approvalMode),
    });
  }

  setCapabilityBoundary(mode: CapabilityBoundaryMode) {
    const approvalMode = this.state.approvalPolicy.mode;
    const permissionMode = permissionModeFromPolicy(mode, approvalMode);
    const nextConfig = this.state.providerConfig
      ? {
          ...this.state.providerConfig,
          permissionMode,
          capabilityBoundaryMode: mode,
          approvalPolicyMode: approvalMode,
        }
      : null;
    if (nextConfig) {
      saveConfig(nextConfig);
    }
    this.update({
      providerConfig: nextConfig,
      capabilityBoundary: createCapabilityBoundary(mode),
    });
  }

  setApprovalPolicy(mode: ApprovalPolicyMode) {
    const capabilityMode = this.state.capabilityBoundary.mode;
    const permissionMode = permissionModeFromPolicy(capabilityMode, mode);
    const nextConfig = this.state.providerConfig
      ? {
          ...this.state.providerConfig,
          permissionMode,
          capabilityBoundaryMode: capabilityMode,
          approvalPolicyMode: mode,
        }
      : null;
    if (nextConfig) {
      saveConfig(nextConfig);
    }
    this.update({
      providerConfig: nextConfig,
      approvalPolicy: createApprovalPolicy(mode),
    });
  }

  private buildInstructionSources(): RuntimeState["instructionSources"] {
    const documentSummary = this.lastDocumentMetadata
      ? summarizeJson(this.lastDocumentMetadata)
      : "No document metadata loaded yet.";
    const sessionSummary = this.state.activeTask
      ? `Task: ${this.state.activeTask.userRequest}`
      : this.state.completionArtifacts[0]
        ? `Last completion: ${this.state.completionArtifacts[0].summary}`
        : "No active task or completion artifacts.";
    return [
      {
        id: "instructions:app-global",
        kind: "app_global",
        label: "App-global",
        precedence: 0,
        summary: `Shared runtime rules for ${this.adapter.hostApp ?? "office"} agent runtime.`,
      },
      {
        id: `instructions:host:${this.adapter.hostApp ?? "generic"}`,
        kind: "host_specific",
        label: "Host-specific",
        precedence: 1,
        summary: `${this.adapter.hostApp ?? "generic"} host with ${this.state.activeHookNames.length} hooks, ${this.state.activePatternMetadata.length} patterns, and ${this.state.activeVerifierIds.length} verifiers.`,
      },
      {
        id: `instructions:document:${this.documentId ?? "pending"}`,
        kind: "document_memory",
        label: "Document memory",
        precedence: 2,
        summary: documentSummary,
        updatedAt: this.lastDocumentMetadataUpdatedAt ?? undefined,
      },
      {
        id: `instructions:session:${this.currentSessionId ?? "pending"}`,
        kind: "session_memory",
        label: "Session-local memory",
        precedence: 3,
        summary: sessionSummary,
        updatedAt: Date.now(),
      },
    ];
  }

  private async refreshInstructionSources(
    metadata?: { metadata: object; nameMap?: Record<number, string> } | null,
  ) {
    if (metadata?.metadata) {
      this.lastDocumentMetadata = metadata.metadata;
      this.lastDocumentMetadataUpdatedAt = Date.now();
    }
    this.update({
      instructionSources: this.buildInstructionSources(),
    });
  }

  private appendPolicyTrace(
    entry: Omit<
      PolicyTraceEntry,
      "id" | "at" | "capabilityMode" | "approvalMode"
    >,
  ) {
    const nextTrace = [
      ...this.state.policyTrace,
      {
        ...entry,
        id: crypto.randomUUID(),
        capabilityMode: this.state.capabilityBoundary.mode,
        approvalMode: this.state.approvalPolicy.mode,
        at: Date.now(),
      },
    ].slice(-MAX_POLICY_TRACE_ENTRIES);
    this.update({ policyTrace: nextTrace });
  }

  private buildRootThread(
    activeTask: TaskRecord | null = this.state.activeTask,
    activePlan: ExecutionPlan | null = this.state.activePlan,
  ): TaskThreadSummary {
    return {
      id: `thread-root:${this.currentSessionId ?? "pending"}`,
      title: `${this.adapter.hostApp ?? "office"} main thread`,
      status: "active",
      rootTaskId: activeTask?.id ?? null,
      currentTaskId: activeTask?.id ?? null,
      forkedFromThreadId: null,
      compactedSummary: null,
      milestoneIds: activePlan?.milestones.map((item) => item.id) ?? [],
      updatedAt: Date.now(),
    };
  }

  private async ensureThreadsLoaded(
    sessionId: string,
    activeTask: TaskRecord | null = this.state.activeTask,
    activePlan: ExecutionPlan | null = this.state.activePlan,
  ): Promise<TaskThreadSummary[]> {
    const existing = await listThreadSummaries(sessionId);
    if (existing.length > 0) {
      return existing;
    }
    const rootThread = this.buildRootThread(activeTask, activePlan);
    await saveThreadSummary(sessionId, rootThread);
    return [rootThread];
  }

  private async loadThreadState(
    sessionId: string,
    activeTask: TaskRecord | null = this.state.activeTask,
    activePlan: ExecutionPlan | null = this.state.activePlan,
  ) {
    const [threads, completionArtifacts, compactionArtifacts] =
      await Promise.all([
        this.ensureThreadsLoaded(sessionId, activeTask, activePlan),
        listCompletionArtifacts(sessionId),
        listCompactionArtifacts(sessionId),
      ]);
    const activeThread =
      threads.find((thread) => thread.status === "active") ??
      threads[0] ??
      null;
    const latestCompaction = compactionArtifacts[0] ?? null;
    this.update({
      threads,
      activeThreadId: activeThread?.id ?? null,
      completionArtifacts,
      compactionState: latestCompaction
        ? {
            artifactCount: compactionArtifacts.length,
            lastCompactedThreadId: latestCompaction.threadId,
            updatedAt: latestCompaction.createdAt,
          }
        : {
            artifactCount: 0,
            lastCompactedThreadId: null,
            updatedAt: Date.now(),
          },
    });
  }

  private async saveThread(thread: TaskThreadSummary) {
    if (!this.currentSessionId) return;
    await saveThreadSummary(this.currentSessionId, thread);
    const threads = await listThreadSummaries(this.currentSessionId);
    this.update({ threads });
  }

  forkActiveThread(title: string): TaskThreadSummary | null {
    const currentThread =
      this.state.threads.find(
        (thread) => thread.id === this.state.activeThreadId,
      ) ?? this.state.threads[0];
    if (!currentThread || !this.currentSessionId) return null;
    const forked: TaskThreadSummary = {
      id: crypto.randomUUID(),
      title,
      status: "active",
      rootTaskId: currentThread.rootTaskId,
      currentTaskId: this.state.activeTask?.id ?? currentThread.currentTaskId,
      forkedFromThreadId: currentThread.id,
      compactedSummary: null,
      milestoneIds:
        this.state.activePlan?.milestones.map((item) => item.id) ?? [],
      updatedAt: Date.now(),
    };
    void this.saveThread(forked);
    this.update({
      threads: [forked, ...this.state.threads],
      activeThreadId: forked.id,
    });
    return forked;
  }

  resumeThread(threadId: string): TaskThreadSummary | null {
    const thread = this.state.threads.find((item) => item.id === threadId);
    if (!thread) return null;
    const resumed = {
      ...thread,
      status: "active" as const,
      currentTaskId: this.state.activeTask?.id ?? thread.currentTaskId,
      updatedAt: Date.now(),
    };
    void this.saveThread(resumed);
    this.update({
      threads: this.state.threads.map((item) =>
        item.id === threadId ? resumed : item,
      ),
      activeThreadId: threadId,
    });
    return resumed;
  }

  compactThread(threadId: string): TaskThreadSummary | null {
    const thread = this.state.threads.find((item) => item.id === threadId);
    if (!thread || !this.currentSessionId) return null;
    const compacted = {
      ...thread,
      status: "compacted" as const,
      compactedSummary:
        this.state.activeTask?.userRequest ??
        this.state.completionArtifacts[0]?.summary ??
        "Compacted thread summary",
      updatedAt: Date.now(),
    };
    const artifact: CompactionArtifact = {
      id: crypto.randomUUID(),
      threadId,
      summary: compacted.compactedSummary ?? "Compacted thread summary",
      sourceTaskIds: compacted.currentTaskId ? [compacted.currentTaskId] : [],
      createdAt: Date.now(),
    };
    void Promise.all([
      saveThreadSummary(this.currentSessionId, compacted),
      createCompactionArtifact(this.currentSessionId, artifact),
    ]).then(() => this.loadThreadState(this.currentSessionId!));
    const nextActiveThread =
      this.state.threads.find(
        (item) => item.id !== threadId && item.status !== "compacted",
      )?.id ?? null;
    this.update({
      threads: this.state.threads.map((item) =>
        item.id === threadId ? compacted : item,
      ),
      activeThreadId: nextActiveThread,
      compactionState: {
        artifactCount: (this.state.compactionState?.artifactCount ?? 0) + 1,
        lastCompactedThreadId: threadId,
        updatedAt: artifact.createdAt,
      },
    });
    return compacted;
  }

  /**
   * Compact the current context window by summarizing the message history and
   * replacing the agent's message array with a minimal recovery set.
   *
   * `trigger` distinguishes user-initiated compaction from the auto-trigger
   * that fires when context usage crosses the 90 % threshold.
   */
  private isCompacting = false;

  async compactContext(trigger: "auto" | "manual" = "manual"): Promise<boolean> {
    if (!this.agent || !this.currentSessionId) return false;
    if (this.state.isStreaming) return false;
    if (this.isCompacting) return false; // serialization guard

    this.isCompacting = true;
    try {
      return await this.doCompaction(trigger);
    } finally {
      this.isCompacting = false;
    }
  }

  private async doCompaction(trigger: "auto" | "manual"): Promise<boolean> {
    const messages = this.agent!.state.messages ?? [];
    if (messages.length < 4) return false;

    const usage = this.state.sessionStats.lastInputTokens;
    const ctxWindow = this.state.sessionStats.contextWindow;
    const isEmergency = this.contextManager.shouldEmergencyCompact(usage, ctxWindow);

    try {
      let rebuiltMessages: AgentMessage[];

      if (isEmergency) {
        const fallbackSummary: CompactionSummary = {
          decisions: [],
          constraints: [],
          progress: [
            "Emergency compaction — prior context was dropped to prevent session loss.",
          ],
          currentState:
            "Context was critically full. Continuing with minimal history.",
          nextSteps: [],
          sourceMessageCount: messages.length,
          timestamp: Date.now(),
        };
        rebuiltMessages = this.compactor.rebuildMessages(
          fallbackSummary,
          messages,
          {
            plan: this.planManager.getActivePlan(),
            task: this.taskTracker.getCurrentTask(),
          },
          2,
        );
      } else {
        const filtered = this.compactor.preFilter(messages);
        const ledger = await loadLedger(this.currentSessionId!);
        const prompt = this.compactor.buildSummarizerPrompt(filtered, ledger);

        const cfg = this.config ?? this.state.providerConfig;
        if (!cfg) return false;

        const apiKey = await this.getActiveApiKey(cfg);
        let baseModel: Model<Api>;
        try {
          baseModel = (getModel as (p: string, m: string) => Model<Api>)(
            cfg.provider,
            cfg.model,
          );
        } catch {
          return false;
        }

        const stream = streamSimple(
          baseModel,
          {
            messages: [
              {
                role: "user",
                content: prompt,
                timestamp: Date.now(),
              },
            ],
          },
          { apiKey },
        );

        const assistantMsg = await stream.result();
        const responseText = assistantMsg.content
          .filter(
            (b): b is { type: "text"; text: string } => b.type === "text",
          )
          .map((b) => b.text)
          .join("");

        const summary = this.compactor.parseSummary(responseText, messages.length);

        // Abort if summarizer returned garbage — don't destroy history with empty summary
        if (!summary.currentState || summary.currentState.length < 10) {
          console.warn("[Runtime] Summarizer returned weak summary, aborting compaction.");
          return false;
        }

        rebuiltMessages = this.compactor.rebuildMessages(
          summary,
          messages,
          {
            plan: this.planManager.getActivePlan(),
            task: this.taskTracker.getCurrentTask(),
          },
          3,
        );

        const ledgerEntry: CompactionLedgerEntry = {
          id: crypto.randomUUID(),
          summary,
          cascadeDepth: (ledger[ledger.length - 1]?.cascadeDepth ?? 0) + 1,
          createdAt: Date.now(),
        };
        await appendLedger(this.currentSessionId!, ledgerEntry);
      }

      this.agent!.replaceMessages(rebuiltMessages);

      const chatMessages = agentMessagesToChatMessages(rebuiltMessages);
      const stats = deriveStats(rebuiltMessages);

      const activeThreadId =
        this.state.activeThreadId ?? this.state.threads[0]?.id ?? null;

      const artifact: CompactionArtifact = {
        id: crypto.randomUUID(),
        threadId: activeThreadId ?? "default",
        summary: `Context compacted (${trigger}): ${messages.length} → ${rebuiltMessages.length} messages`,
        sourceTaskIds: this.state.activeTask?.id
          ? [this.state.activeTask.id]
          : [],
        createdAt: Date.now(),
      };
      await createCompactionArtifact(this.currentSessionId!, artifact);

      this.update({
        messages: chatMessages,
        sessionStats: { ...this.state.sessionStats, ...stats },
        compactionState: {
          artifactCount: (this.state.compactionState?.artifactCount ?? 0) + 1,
          lastCompactedThreadId: activeThreadId,
          updatedAt: Date.now(),
        },
      });

      // Persist session so compacted messages survive reload
      await this.persistSessionState();

      this.emitBridgeEvent("context:compacted", {
        artifactCount: (this.state.compactionState?.artifactCount ?? 0) + 1,
        threadId: activeThreadId ?? null,
      });

      return true;
    } catch (error) {
      console.error("[Runtime] Compaction failed:", error);
      // No retry — failed compaction should not recurse
      return false;
    }
  }

  approvePending() {
    return this.approveActivePlan();
  }

  private async persistSessionState(sessionId = this.currentSessionId) {
    if (!sessionId) return;

    const activePlan = this.planManager.getActivePlan();
    const activeTask = this.taskTracker.getCurrentTask();
    const agentMessages = this.agent?.state.messages ?? [];
    const vfsFiles = await snapshotVfs();

    await Promise.all([
      saveSession(sessionId, agentMessages),
      saveVfsFiles(sessionId, vfsFiles),
      this.planManager.persist(sessionId),
      this.taskTracker.persist(sessionId),
    ]);

    const activeThreadId =
      this.state.activeThreadId ?? this.state.threads[0]?.id ?? null;
    if (activeThreadId) {
      const thread =
        this.state.threads.find((item) => item.id === activeThreadId) ??
        this.buildRootThread(activeTask, activePlan);
      await saveThreadSummary(sessionId, {
        ...thread,
        rootTaskId: activeTask?.id ?? thread.rootTaskId,
        currentTaskId: activeTask?.id ?? thread.currentTaskId,
        milestoneIds:
          activePlan?.milestones.map((item) => item.id) ?? thread.milestoneIds,
        updatedAt: Date.now(),
      });
      await this.loadThreadState(sessionId, activeTask, activePlan);
    }
  }

  private applyApprovalPolicy(
    classification: Awaited<ReturnType<TaskClassifier["classify"]>>,
    riskEstimate: ScopeRiskEstimate,
  ): ScopeRiskEstimate {
    const hasMutationRisk =
      classification.risk !== "none" || riskEstimate.destructive;
    if (!hasMutationRisk) return riskEstimate;

    if (this.state.approvalPolicy.mode === "auto") {
      return {
        ...riskEstimate,
        requiresApproval: false,
      };
    }

    if (this.state.approvalPolicy.mode === "confirm_writes") {
      return {
        ...riskEstimate,
        requiresApproval: true,
        reasons: [
          ...riskEstimate.reasons,
          "Approval policy requires confirmation before writes.",
        ],
      };
    }

    return riskEstimate;
  }

  private isCapabilityBoundaryBlocked(
    classification: Awaited<ReturnType<TaskClassifier["classify"]>>,
    riskEstimate: ScopeRiskEstimate,
  ) {
    return (
      this.state.capabilityBoundary.mode === "read_only" &&
      (classification.risk !== "none" || riskEstimate.destructive)
    );
  }

  private deriveExecutionDiagnostics(task: TaskRecord | null) {
    const executions = task?.toolExecutions ?? [];
    const noWriteRecoveryAttemptCount = task?.noWriteRecoveryCount ?? 0;
    const latestSuccessfulWrite = [...executions]
      .reverse()
      .find(
        (execution) =>
          WORD_WRITE_TOOL_NAMES.has(execution.toolName) && !execution.isError,
      );
    const latestSuccessfulWriteScope = latestSuccessfulWrite
      ? this.getExecutionScopeKey(latestSuccessfulWrite)
      : null;
    const firstRead = executions.find(
      (execution) =>
        WORD_READ_TOOL_NAMES.has(execution.toolName) && !execution.isError,
    );
    const preWriteReadCount = executions.filter((execution) => {
      if (execution.isError || !WORD_READ_TOOL_NAMES.has(execution.toolName)) {
        return false;
      }
      return latestSuccessfulWrite
        ? execution.timestamp < latestSuccessfulWrite.timestamp
        : true;
    }).length;
    const preWriteInspectionCount = executions.filter((execution) => {
      if (execution.isError) return false;
      if (
        !WORD_READ_TOOL_NAMES.has(execution.toolName) &&
        !GENERIC_INSPECTION_TOOL_NAMES.has(execution.toolName)
      ) {
        return false;
      }
      return latestSuccessfulWrite
        ? execution.timestamp < latestSuccessfulWrite.timestamp
        : true;
    }).length;
    const scopeReadCount = executions.filter((execution) => {
      if (execution.isError || !WORD_READ_TOOL_NAMES.has(execution.toolName)) {
        return false;
      }
      return latestSuccessfulWrite
        ? execution.timestamp < latestSuccessfulWrite.timestamp
        : true;
    }).length;
    const writeCount = executions.filter(
      (execution) =>
        WORD_WRITE_TOOL_NAMES.has(execution.toolName) && !execution.isError,
    ).length;
    const failedWriteCount = executions.filter(
      (execution) =>
        WORD_WRITE_TOOL_NAMES.has(execution.toolName) && execution.isError,
    ).length;
    const postWriteRereadCount = latestSuccessfulWrite
      ? executions.filter(
          (execution) =>
            !execution.isError &&
            WORD_READ_TOOL_NAMES.has(execution.toolName) &&
            execution.timestamp >= latestSuccessfulWrite.timestamp &&
            this.isRelevantPostWriteReread(
              execution,
              latestSuccessfulWriteScope,
            ),
        ).length
      : 0;
    const activePlan = this.planManager.getActivePlan();
    const planAdvancedBeyondInspection = Boolean(
      activePlan?.steps.some(
        (step) =>
          (step.kind === "write" || step.kind === "verify") &&
          (step.status === "active" || step.status === "completed"),
      ) ||
        activePlan?.activeStepId === "step-write" ||
        activePlan?.activeStepId === "step-verify" ||
        latestSuccessfulWrite,
    );

    return {
      preWriteReadCount,
      preWriteInspectionCount,
      scopeReadCount,
      writeCount,
      failedWriteCount,
      postWriteRereadCount,
      firstReadAt: firstRead?.timestamp,
      firstWriteAt: latestSuccessfulWrite?.timestamp,
      planAdvancedBeyondInspection,
      noWriteRecoveryAttemptCount,
      noWriteRecoveryBudgetRemaining: Math.max(
        0,
        NO_WRITE_LOOP_RECOVERY_LIMIT - noWriteRecoveryAttemptCount,
      ),
    };
  }

  private getToolCallArgs(
    toolCallId: string,
    toolName: string,
  ): Record<string, unknown> | null {
    for (
      let messageIndex = this.state.messages.length - 1;
      messageIndex >= 0;
      messageIndex--
    ) {
      const message = this.state.messages[messageIndex];
      for (const part of message.parts) {
        if (
          part.type === "toolCall" &&
          part.id === toolCallId &&
          part.name === toolName
        ) {
          return part.args;
        }
      }
    }
    return null;
  }

  private getExecutionScopeKey(
    execution: NonNullable<TaskRecord["toolExecutions"]>[number],
  ): string | null {
    const args = this.getToolCallArgs(execution.toolCallId, execution.toolName);
    if (!args) return null;
    return scopeKeyFromParams(execution.toolName, args);
  }

  private isRelevantPostWriteReread(
    execution: NonNullable<TaskRecord["toolExecutions"]>[number],
    writeScope: string | null,
  ): boolean {
    if (!writeScope) {
      return true;
    }
    const readScope = this.getExecutionScopeKey(execution);
    if (!readScope) {
      return false;
    }
    return hasReadCoverage(new Set([readScope]), writeScope);
  }

  private async resumePendingNoWriteRecovery() {
    const recovery = this.pendingNoWriteRecovery;
    if (!recovery || !this.agent) return;
    this.pendingNoWriteRecovery = null;
    await this.executeActiveTask(
      this.agent,
      recovery.content,
      recovery.attachments,
    );
  }

  private isMutationCapableWordTask(task: TaskRecord | null): boolean {
    if (this.adapter.hostApp !== "word" || !task) return false;
    const classification =
      this.planManager.getActivePlan()?.classification ??
      inferTaskClassification(task.userRequest);
    return classification.risk !== "none" || classification.needsPlan;
  }

  private async maybeInterruptNoWriteLoop() {
    const task = this.taskTracker.getCurrentTask();
    if (!this.isStreaming || !this.isMutationCapableWordTask(task) || !task) {
      return false;
    }

    const diagnostics = this.deriveExecutionDiagnostics(task);
    this.taskTracker.setExecutionDiagnostics(diagnostics);
    this.update({ activeTask: this.taskTracker.getCurrentTask() });
    const activeTask = this.taskTracker.getCurrentTask();
    if (!activeTask || diagnostics.firstWriteAt) {
      return false;
    }
    if (diagnostics.failedWriteCount > 0) {
      return false;
    }

    const hasScopeRead = diagnostics.scopeReadCount >= 1;
    const elapsedMs = diagnostics.firstReadAt
      ? Date.now() - diagnostics.firstReadAt
      : 0;
    const inspectionBudgetExceeded =
      diagnostics.preWriteReadCount >= NO_WRITE_LOOP_READ_LIMIT ||
      diagnostics.preWriteInspectionCount >= NO_WRITE_LOOP_INSPECTION_LIMIT ||
      (elapsedMs >= NO_WRITE_LOOP_MS_LIMIT &&
        diagnostics.preWriteInspectionCount >= 3);

    if (
      activeTask.approvalPending ||
      this.state.mode === "blocked" ||
      (!hasScopeRead &&
        diagnostics.preWriteInspectionCount < NO_WRITE_LOOP_INSPECTION_LIMIT) ||
      !inspectionBudgetExceeded
    ) {
      return false;
    }

    const reason =
      `Inspection budget exhausted before first write after ${diagnostics.preWriteInspectionCount} inspection operations` +
      `${elapsedMs > 0 ? ` and ${Math.round(elapsedMs / 1000)}s` : ""}.`;
    const steeringInstruction =
      "Perform exactly one bounded Word write now and reread that same scope immediately.";
    const recoveryCount = activeTask.noWriteRecoveryCount ?? 0;
    if (recoveryCount < NO_WRITE_LOOP_RECOVERY_LIMIT && this.agent) {
      const nextRecoveryCount = recoveryCount + 1;
      const recoveryReason = `${reason} ${steeringInstruction} Same-run recovery attempt ${nextRecoveryCount} of ${NO_WRITE_LOOP_RECOVERY_LIMIT}.`;
      this.taskTracker.setNoWriteRecoveryCount(nextRecoveryCount);
      this.taskTracker.setExecutionDiagnostics({
        ...diagnostics,
        noWriteLoopDetected: true,
        noWriteLoopReason: recoveryReason,
        noWriteRecoveryAttemptCount: nextRecoveryCount,
        noWriteRecoveryBudgetRemaining: Math.max(
          0,
          NO_WRITE_LOOP_RECOVERY_LIMIT - nextRecoveryCount,
        ),
      });
      this.appendPolicyTrace({
        event: "task_resumed",
        outcome: "allowed",
        reason: recoveryReason,
      });
      this.pendingNoWriteRecovery = {
        content: activeTask.userRequest,
        attachments: activeTask.attachments?.map(
          (path) => path.split("/").pop() ?? path,
        ),
      };
      this.hookRegistry.addPromptNotes([
        {
          level: "warning",
          text: recoveryReason,
          source: { hookName: "runtime.no-write-recovery" },
        },
      ]);
      this.interruptedStreamingReason = "inspection_budget_recovery";
      this.update({
        activeTask: this.taskTracker.getCurrentTask(),
        error: null,
      });
      await this.persistSessionState();
      this.agent.abort();
      return true;
    }

    const exhaustedReason =
      `${reason} Recovery budget exhausted after ${recoveryCount} same-run recovery attempt${recoveryCount === 1 ? "" : "s"}. ` +
      "Narrow to a bounded first write, reread the affected scope immediately, then continue.";
    this.interruptedStreamingReason = "inspection_budget_exhausted";
    this.appendPolicyTrace({
      event: "task_paused",
      outcome: "blocked",
      reason: exhaustedReason,
    });

    this.taskTracker.setExecutionDiagnostics({
      ...diagnostics,
      noWriteLoopDetected: true,
      noWriteLoopReason: exhaustedReason,
      noWriteRecoveryAttemptCount: recoveryCount,
      noWriteRecoveryBudgetRemaining: Math.max(
        0,
        NO_WRITE_LOOP_RECOVERY_LIMIT - recoveryCount,
      ),
    });
    const handoff = await this.buildHandoff(
      this.taskTracker.getCurrentTask()!,
      exhaustedReason,
    );
    this.taskTracker.setHandoff(handoff);
    this.taskTracker.setMode("blocked");
    this.isStreaming = false;
    this.update({
      isStreaming: false,
      mode: "blocked",
      handoff,
      degradedGuardrails: [
        ...this.state.degradedGuardrails,
        "Stopped a Word task after repeated pre-write inspection with no write attempt.",
      ],
      activeTask: this.taskTracker.getCurrentTask(),
      error: null,
    });
    await this.persistSessionState();
    this.agent?.abort();
    return true;
  }

  getAvailableProviders(): string[] {
    return getProviders();
  }

  getModelsForProvider(provider: string): Model<Api>[] {
    try {
      return (getModels as (p: string) => Model<Api>[])(provider);
    } catch {
      return [];
    }
  }

  private async getActiveApiKey(config: ProviderConfig): Promise<string> {
    if (config.authMethod !== "oauth") {
      return config.apiKey;
    }
    const creds = loadOAuthCredentials(config.provider);
    if (!creds) return config.apiKey;
    if (Date.now() < creds.expires) {
      return creds.access;
    }
    const refreshed = await refreshOAuthToken(
      config.provider,
      creds.refresh,
      config.proxyUrl,
      config.useProxy,
    );
    saveOAuthCredentials(config.provider, refreshed);
    return refreshed.access;
  }

  private handleAgentEvent = (event: AgentEvent) => {
    console.log("[Runtime] Agent event:", event.type, event);
    switch (event.type) {
      case "message_start": {
        if (event.message.role === "assistant") {
          const id = generateId();
          this.streamingMessageId = id;
          const parts = extractPartsFromAssistantMessage(event.message);
          const chatMessage: ChatMessage = {
            id,
            role: "assistant",
            parts,
            timestamp: event.message.timestamp,
          };
          this.updateMessages((msgs) => [...msgs, chatMessage]);
          this.emitBridgeEvent("message:created", {
            messageId: id,
            role: "assistant",
          });
        }
        break;
      }
      case "message_update": {
        if (event.message.role === "assistant" && this.streamingMessageId) {
          this.streamingBuffer = event;
          this.scheduleFlush();
        }
        break;
      }
      case "message_end": {
        this.flushStreamingBuffer();
        this.emitBridgeEvent("message:completed", {
          messageId: this.streamingMessageId ?? "",
          role: event.message.role,
        });
        if (event.message.role === "assistant") {
          const assistantMsg = event.message as AssistantMessage;
          const controlledAbort =
            assistantMsg.stopReason === "aborted" &&
            this.interruptedStreamingReason === "inspection_budget_exhausted";
          const isError =
            !controlledAbort &&
            (assistantMsg.stopReason === "error" ||
              assistantMsg.stopReason === "aborted");
          const streamId = this.streamingMessageId;

          this.updateMessages(
            (msgs) => {
              const messages = [...msgs];
              const idx = messages.findIndex((m) => m.id === streamId);

              if (isError || controlledAbort) {
                if (idx !== -1) {
                  messages.splice(idx, 1);
                }
              } else if (idx !== -1) {
                const parts = extractPartsFromAssistantMessage(
                  event.message,
                  messages[idx].parts,
                );
                messages[idx] = { ...messages[idx], parts };
              }
              return messages;
            },
            {
              error: isError
                ? assistantMsg.errorMessage || "Request failed"
                : this.state.error,
              sessionStats: isError
                ? this.state.sessionStats
                : {
                    ...deriveStats(this.agent?.state.messages ?? []),
                    contextWindow: this.state.sessionStats.contextWindow,
                  },
            },
          );
          this.streamingMessageId = null;
        }
        break;
      }
      case "tool_execution_start": {
        this.flushStreamingBuffer();
        this.taskTracker.recordToolCall(event.toolCallId);
        this.update({ activeTask: this.taskTracker.getCurrentTask() });
        this.emitBridgeEvent("tool:started", {
          toolCallId: event.toolCallId,
          toolName: event.toolName,
        });
        this.updateMessages((msgs) => {
          const messages = [...msgs];
          for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const partIdx = msg.parts.findIndex(
              (p) => p.type === "toolCall" && p.id === event.toolCallId,
            );
            if (partIdx !== -1) {
              const parts = [...msg.parts];
              const part = parts[partIdx];
              if (part.type === "toolCall") {
                parts[partIdx] = { ...part, status: "running" };
                messages[i] = { ...msg, parts };
              }
              break;
            }
          }
          return messages;
        });
        break;
      }
      case "tool_execution_update": {
        this.updateMessages((msgs) => {
          const messages = [...msgs];
          for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const partIdx = msg.parts.findIndex(
              (p) => p.type === "toolCall" && p.id === event.toolCallId,
            );
            if (partIdx !== -1) {
              const parts = [...msg.parts];
              const part = parts[partIdx];
              if (part.type === "toolCall") {
                let partialText: string;
                if (typeof event.partialResult === "string") {
                  partialText = event.partialResult;
                } else if (
                  event.partialResult?.content &&
                  Array.isArray(event.partialResult.content)
                ) {
                  partialText = event.partialResult.content
                    .filter((c: { type: string }) => c.type === "text")
                    .map((c: { text: string }) => c.text)
                    .join("\n");
                } else {
                  partialText = JSON.stringify(event.partialResult, null, 2);
                }
                parts[partIdx] = { ...part, result: partialText };
                messages[i] = { ...msg, parts };
              }
              break;
            }
          }
          return messages;
        });
        break;
      }
      case "tool_execution_end": {
        this.flushStreamingBuffer();
        let resultText: string;
        let resultImages: { data: string; mimeType: string }[] | undefined;
        if (typeof event.result === "string") {
          resultText = event.result;
        } else if (
          event.result?.content &&
          Array.isArray(event.result.content)
        ) {
          resultText = event.result.content
            .filter((c: { type: string }) => c.type === "text")
            .map((c: { text: string }) => c.text)
            .join("\n");
          const images = event.result.content
            .filter((c: { type: string }) => c.type === "image")
            .map((c: { data: string; mimeType: string }) => ({
              data: c.data,
              mimeType: c.mimeType,
            }));
          if (images.length > 0) resultImages = images;
        } else {
          resultText = JSON.stringify(event.result, null, 2);
        }

        if (!event.isError && this.followMode) {
          this.adapter.onToolResult?.(event.toolCallId, resultText, false);
        }
        this.taskTracker.recordToolExecution({
          toolCallId: event.toolCallId,
          toolName: event.toolName,
          isError: event.isError,
          resultText,
          timestamp: Date.now(),
        });
        const diagnostics = this.deriveExecutionDiagnostics(
          this.taskTracker.getCurrentTask(),
        );
        this.taskTracker.setExecutionDiagnostics(diagnostics);
        this.planManager.syncWithExecution(this.taskTracker.getCurrentTask());
        this.update({
          activePlan: this.planManager.getActivePlan(),
          activeTask: this.taskTracker.getCurrentTask(),
        });

        if (event.isError) {
          this.emitBridgeEvent("tool:failed", {
            toolCallId: event.toolCallId,
            toolName: event.toolName,
            error: resultText,
          });
        } else {
          this.emitBridgeEvent("tool:completed", {
            toolCallId: event.toolCallId,
            toolName: event.toolName,
          });
        }

        this.updateMessages((msgs) => {
          const messages = [...msgs];
          for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const partIdx = msg.parts.findIndex(
              (p) => p.type === "toolCall" && p.id === event.toolCallId,
            );
            if (partIdx !== -1) {
              const parts = [...msg.parts];
              const part = parts[partIdx];
              if (part.type === "toolCall") {
                parts[partIdx] = {
                  ...part,
                  status: event.isError ? "error" : "complete",
                  result: resultText,
                  images: resultImages,
                };
                messages[i] = { ...msg, parts };
              }
              break;
            }
          }
          return messages;
        });
        void this.maybeInterruptNoWriteLoop();
        break;
      }
      case "agent_end": {
        this.flushStreamingBuffer();
        this.isStreaming = false;
        this.streamingMessageId = null;
        this.update({ isStreaming: false });
        if (this.interruptedStreamingReason) {
          const interruptedReason = this.interruptedStreamingReason;
          this.interruptedStreamingReason = null;
          if (interruptedReason === "inspection_budget_recovery") {
            void this.resumePendingNoWriteRecovery();
          }
          break;
        }
        this.onStreamingEnd();
        break;
      }
    }
  };

  applyConfig(config: ProviderConfig) {
    const normalizedConfig: ProviderConfig = {
      ...config,
      permissionMode:
        config.permissionMode ??
        permissionModeFromPolicy(
          config.capabilityBoundaryMode ??
            capabilityBoundaryForPermissionMode(config.permissionMode),
          config.approvalPolicyMode ??
            approvalPolicyForPermissionMode(config.permissionMode),
        ),
      capabilityBoundaryMode:
        config.capabilityBoundaryMode ??
        capabilityBoundaryForPermissionMode(config.permissionMode),
      approvalPolicyMode:
        config.approvalPolicyMode ??
        approvalPolicyForPermissionMode(config.permissionMode),
    };
    let contextWindow = 0;
    let baseModel: Model<Api>;
    if (normalizedConfig.provider === "custom") {
      const custom = buildCustomModel(normalizedConfig);
      if (!custom) return;
      baseModel = custom;
    } else {
      try {
        baseModel = (getModel as (p: string, m: string) => Model<Api>)(
          normalizedConfig.provider,
          normalizedConfig.model,
        );
      } catch {
        return;
      }
    }
    contextWindow = baseModel.contextWindow;
    this.config = normalizedConfig;

    const proxiedModel = applyProxyToModel(baseModel, normalizedConfig);
    const existingMessages = this.agent?.state.messages ?? [];

    if (this.agent) {
      this.agent.abort();
      this.unsubscribeAgent?.();
      this.unsubscribeAgent = null;
    }

    const systemPrompt = this.adapter.buildSystemPrompt(this.skills);

    const agent = new Agent({
      initialState: {
        model: proxiedModel,
        systemPrompt,
        thinkingLevel: thinkingLevelToAgent(normalizedConfig.thinking),
        tools: [
          createUpdatePlanTool(this.planManager),
          ...this.hookRegistry.wrapTools(this.adapter.tools),
        ],
        messages: existingMessages,
      },
      streamFn: async (model, context, options) => {
        const cfg = this.config ?? normalizedConfig;
        const apiKey = await this.getActiveApiKey(cfg);
        return streamSimple(model, context, {
          ...options,
          apiKey,
        });
      },
    });
    this.agent = agent;
    this.unsubscribeAgent = agent.subscribe(this.handleAgentEvent);
    this.pendingConfig = null;
    this.followMode = normalizedConfig.followMode ?? true;

    this.update({
      providerConfig: normalizedConfig,
      error: null,
      sessionStats: {
        ...this.state.sessionStats,
        contextWindow,
      },
      capabilityBoundary: createCapabilityBoundary(
        normalizedConfig.capabilityBoundaryMode!,
      ),
      approvalPolicy: createApprovalPolicy(
        normalizedConfig.approvalPolicyMode!,
      ),
    });
  }

  setProviderConfig(config: ProviderConfig) {
    if (this.isStreaming) {
      this.pendingConfig = config;
      this.update({ providerConfig: config });
      return;
    }
    this.applyConfig(config);
  }

  abort() {
    this.agent?.abort();
    this.pendingNoWriteRecovery = null;
    this.isStreaming = false;
    this.update({ isStreaming: false });
  }

  async sendMessage(content: string, attachments?: string[]) {
    if (this.pendingConfig) {
      this.applyConfig(this.pendingConfig);
    }
    const agent = this.agent;
    if (!agent || !this.state.providerConfig) {
      this.update({ error: "Please configure your API key first" });
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      parts: [{ type: "text", text: content }],
      timestamp: Date.now(),
    };

    this.isStreaming = true;
    this.update({
      messages: [...this.state.messages, userMessage],
      isStreaming: true,
      error: null,
    });
    this.appendPolicyTrace({
      event: "prompt_submit",
      outcome: "allowed",
      reason:
        "Received a new user request for classification and policy evaluation.",
    });

    try {
      const classification = await this.taskClassifier.classify(content);
      const rawRiskEstimate = await this.estimateScopeRisk(
        content,
        classification,
      );
      const riskEstimate = this.applyApprovalPolicy(
        classification,
        rawRiskEstimate,
      );
      const permissionBlocked = this.isCapabilityBoundaryBlocked(
        classification,
        rawRiskEstimate,
      );
      this.appendPolicyTrace({
        event: "policy_check",
        outcome: permissionBlocked
          ? "blocked"
          : riskEstimate.requiresApproval
            ? "approval_required"
            : "allowed",
        reason: permissionBlocked
          ? "Capability boundary blocked mutation-capable work."
          : riskEstimate.requiresApproval
            ? riskEstimate.reasons.join("; ")
            : "Policy allowed the task to continue.",
        actionClass:
          classification.risk === "none"
            ? "read"
            : riskEstimate.destructive
              ? "destructive_write"
              : "structural_write",
      });
      const activePlan = classification.needsPlan
        ? await this.planManager.createPlan(content, classification)
        : this.planManager.hydrate(null);
      if (activePlan) {
        activePlan.summary = activePlan.summary ?? content;
        activePlan.requirements = activePlan.requirements ?? [content];
        activePlan.strategy = activePlan.strategy ?? [
          "Inspect current host state before mutation.",
          "Apply the smallest safe mutation for the request.",
          "Verify the observed host state against expected effects.",
        ];
        activePlan.executionUnits =
          activePlan.executionUnits.length > 0
            ? activePlan.executionUnits
            : [
                {
                  id: "unit-execute",
                  title: "Execute planned host changes",
                  stepIds: activePlan.steps.map((step) => step.id),
                  mode: "execute",
                },
              ];
        activePlan.verification =
          activePlan.verification.length > 0
            ? activePlan.verification
            : [
                {
                  id: "verify-host-state",
                  label: "Verify host state",
                  expectedEffect:
                    riskEstimate.expectedEffects?.join("; ") ??
                    "The final host state matches the request.",
                },
              ];
        activePlan.approvalRequired = riskEstimate.requiresApproval;
        activePlan.expectedEffects =
          riskEstimate.expectedEffects ?? activePlan.expectedEffects ?? [];
      }
      this.reflectionEngine = new ReflectionEngine();
      const activeTask = this.taskTracker.beginTask(content, classification, {
        planId: activePlan?.id,
        attachments: attachments?.map((name) => `/home/user/uploads/${name}`),
        scopeSummary: riskEstimate.scopeSummary,
        constraints: riskEstimate.constraints,
        expectedEffects: riskEstimate.expectedEffects,
        mode: classification.needsPlan ? "plan" : "discuss",
        approvalPending: riskEstimate.requiresApproval && !permissionBlocked,
        approvalRequest:
          riskEstimate.requiresApproval && !permissionBlocked
            ? {
                level: riskEstimate.level,
                destructive: riskEstimate.destructive,
                reason: riskEstimate.reasons.join("; "),
                requestedAt: Date.now(),
                uiMessage:
                  this.state.permissionMode === "read_only"
                    ? "This request is paused because permission mode is read-only."
                    : "Approve the plan to allow document mutation.",
              }
            : null,
      });
      this.patternRegistry.deactivateAll();
      this.patternRegistry.activateMatching(
        this.hookRegistry,
        classification,
        activePlan ?? undefined,
      );
      const activePatternMetadata =
        this.patternRegistry.getActivePatternMetadata();
      const degradedGuardrails =
        this.verificationEngine.getSuites().length === 0
          ? ["No verification suites configured for this adapter."]
          : [];

      const approvalRequest = activeTask.approvalRequest ?? null;

      this.update({
        mode: riskEstimate.requiresApproval
          ? permissionBlocked
            ? "blocked"
            : "awaiting_approval"
          : classification.needsPlan
            ? "plan"
            : "discuss",
        approvalRequest,
        handoff: null,
        lastVerification: null,
        degradedGuardrails,
        activePatternMetadata,
        activeHookNames: this.hookRegistry.getRegisteredHookNames(),
        contextBudgetState: null,
        lastPromptNotes: [],
        promptProvenance: null,
        activePlan,
        activeTask,
      });
      await this.refreshInstructionSources();

      const requirementsSnapshot =
        this.contextManager.buildRequirementsSnapshot(
          content,
          riskEstimate.requiresApproval
            ? permissionBlocked
              ? "blocked"
              : "awaiting_approval"
            : "plan",
          riskEstimate.constraints ?? [],
          riskEstimate.expectedEffects ?? [],
        );
      const workingSet = this.contextManager.buildWorkingSet(
        activePlan,
        activeTask,
        activePatternMetadata,
      );
      await writeFile(
        "/.oa/context/requirements.json",
        JSON.stringify(requirementsSnapshot, null, 2),
      );
      await writeFile(
        "/.oa/context/working-set.json",
        JSON.stringify(workingSet, null, 2),
      );

      if (permissionBlocked && activeTask) {
        this.appendPolicyTrace({
          event: "task_paused",
          outcome: "blocked",
          reason: "Task paused because the capability boundary is read-only.",
        });
        const handoff = await this.buildHandoff(
          activeTask,
          "Change permission mode to allow document mutation.",
        );
        this.taskTracker.setHandoff(handoff);
        this.taskTracker.setMode("blocked");
        this.isStreaming = false;
        this.update({
          isStreaming: false,
          handoff,
          activeTask: this.taskTracker.getCurrentTask(),
        });
        await this.persistSessionState();
        return;
      }

      if (riskEstimate.requiresApproval && activeTask) {
        this.appendPolicyTrace({
          event: "approval_emitted",
          outcome: "approval_required",
          reason:
            "Approval policy requires confirmation before this task continues.",
        });
        const handoff = await this.buildHandoff(
          activeTask,
          "Approve the plan to allow document mutation.",
        );
        this.taskTracker.setHandoff(handoff);
        this.taskTracker.setApprovalPending(true);
        this.taskTracker.setMode("awaiting_approval");
        this.isStreaming = false;
        this.update({
          isStreaming: false,
          handoff,
          activeTask: this.taskTracker.getCurrentTask(),
        });
        await this.persistSessionState();
        return;
      }

      await this.executeActiveTask(agent, content, attachments);
    } catch (err) {
      console.error("[Runtime] sendMessage error:", err);
      this.isStreaming = false;
      this.update({
        isStreaming: false,
        error: err instanceof Error ? err.message : "An error occurred",
        mode: "blocked",
        activePlan: this.planManager.getActivePlan(),
        activeTask: this.taskTracker.failTask(
          err instanceof Error ? err.message : "An error occurred",
        ),
      });
    }
  }

  async approveActivePlan() {
    if (!this.state.activeTask || !this.agent) return;
    if (this.state.capabilityBoundary.mode === "read_only") return;
    this.taskTracker.setApprovalPending(false);
    this.taskTracker.setApprovalRequest(null);
    this.taskTracker.setMode("execute");
    this.taskTracker.setHandoff(null);
    this.appendPolicyTrace({
      event: "task_resumed",
      outcome: "allowed",
      reason: "User approved the active plan.",
    });
    this.update({
      approvalRequest: null,
      handoff: null,
      mode: "execute",
      activeTask: this.taskTracker.getCurrentTask(),
      error: null,
    });
    await this.executeActiveTask(
      this.agent,
      this.state.activeTask.userRequest,
      this.state.activeTask.attachments?.map(
        (path) => path.split("/").pop() ?? path,
      ),
    );
  }

  async resumeFromHandoff() {
    if (!this.state.activeTask || !this.agent) return;
    const task = this.taskTracker.getCurrentTask();
    if (task) {
      (task as any).resumeCount = (task.resumeCount ?? 0) + 1;
    }
    this.taskTracker.setMode("execute");
    this.taskTracker.setHandoff(null);
    this.taskTracker.setApprovalPending(false);
    this.taskTracker.setApprovalRequest(null);
    this.appendPolicyTrace({
      event: "task_resumed",
      outcome: "allowed",
      reason: "Task resumed from handoff state.",
    });
    this.update({
      mode: "execute",
      handoff: null,
      approvalRequest: null,
      error: null,
      activeTask: this.taskTracker.getCurrentTask(),
    });
    await this.executeActiveTask(
      this.agent,
      this.state.activeTask.userRequest,
      this.state.activeTask.attachments?.map(
        (path) => path.split("/").pop() ?? path,
      ),
    );
  }

  async clearMessages() {
    this.abort();
    this.agent?.reset();
    resetVfs();
    this.hookRegistry.resetSessionState();
    this.planManager.hydrate(null);
    this.taskTracker.reset();
    this.patternRegistry.deactivateAll();
    this.pendingNoWriteRecovery = null;
    if (this.currentSessionId) {
      const rootThread = this.buildRootThread(null, null);
      await Promise.all([
        saveSession(this.currentSessionId, []),
        saveVfsFiles(this.currentSessionId, []),
        deletePlanRecords(this.currentSessionId),
        deleteTaskRecords(this.currentSessionId),
        deleteReflectionEntries(this.currentSessionId),
        deleteThreadSummaries(this.currentSessionId),
        deleteCompletionArtifacts(this.currentSessionId),
        deleteCompactionArtifacts(this.currentSessionId),
      ]);
      await saveThreadSummary(this.currentSessionId, rootThread);
    }
    this.update({
      messages: [],
      error: null,
      sessionStats: {
        ...INITIAL_STATS,
        contextWindow: this.state.sessionStats.contextWindow,
      },
      uploads: [],
      mode: "discuss",
      approvalRequest: null,
      handoff: null,
      lastVerification: null,
      degradedGuardrails: [],
      activePatternMetadata: [],
      activeHookNames: this.hookRegistry.getRegisteredHookNames(),
      contextBudgetState: null,
      lastPromptNotes: [],
      promptProvenance: null,
      activePlan: null,
      activeTask: null,
      threads: this.currentSessionId ? [this.buildRootThread(null, null)] : [],
      activeThreadId: this.currentSessionId
        ? this.buildRootThread(null, null).id
        : null,
      compactionState: {
        artifactCount: 0,
        lastCompactedThreadId: null,
        updatedAt: Date.now(),
      },
      completionArtifacts: [],
      policyTrace: [],
    });
    void this.refreshInstructionSources();
  }

  private async refreshSessions() {
    if (!this.documentId) return;
    const sessions = await listSessions(this.documentId);
    this.update({ sessions });
  }

  async newSession() {
    if (!this.documentId) return;
    if (this.isStreaming) return;
    try {
      this.agent?.reset();
      resetVfs();
      this.hookRegistry.resetSessionState();
      this.planManager.hydrate(null);
      this.taskTracker.reset();
      this.patternRegistry.deactivateAll();
      const session = await createSession(this.documentId);
      this.currentSessionId = session.id;
      await this.loadThreadState(session.id, null, null);
      await this.refreshSessions();
      this.update({
        messages: [],
        currentSession: session,
        error: null,
        sessionStats: {
          ...INITIAL_STATS,
          contextWindow: this.state.sessionStats.contextWindow,
        },
        uploads: [],
        mode: "discuss",
        approvalRequest: null,
        handoff: null,
        lastVerification: null,
        degradedGuardrails: [],
        activePatternMetadata: [],
        activeHookNames: this.hookRegistry.getRegisteredHookNames(),
        contextBudgetState: null,
        lastPromptNotes: [],
        promptProvenance: null,
        activePlan: null,
        activeTask: null,
        policyTrace: [],
      });
      await this.refreshInstructionSources();
    } catch (err) {
      console.error("[Runtime] Failed to create session:", err);
    }
  }

  async switchSession(sessionId: string) {
    if (this.currentSessionId === sessionId) return;
    if (this.isStreaming) return;
    this.agent?.reset();
    this.hookRegistry.resetSessionState();
    this.patternRegistry.deactivateAll();
    try {
      const [session, vfsFiles, latestPlan, latestTask] = await Promise.all([
        getSession(sessionId),
        loadVfsFiles(sessionId),
        getLatestPlanRecord(sessionId),
        getLatestTaskRecord(sessionId),
      ]);
      if (!session) return;
      await restoreVfs(vfsFiles);
      this.currentSessionId = session.id;
      const activePlan = this.planManager.hydrate(latestPlan);
      const activeTask = this.taskTracker.hydrate(latestTask);
      this.activateRestoredPatterns(activePlan);

      if (session.agentMessages.length > 0 && this.agent) {
        this.agent.replaceMessages(session.agentMessages);
      }

      await this.loadThreadState(session.id, activeTask, activePlan);
      const uploadNames = await listUploads();
      const stats = deriveStats(session.agentMessages);
      this.update({
        messages: agentMessagesToChatMessages(
          session.agentMessages,
          this.adapter.metadataTag,
        ),
        currentSession: session,
        error: null,
        sessionStats: {
          ...stats,
          contextWindow: this.state.sessionStats.contextWindow,
        },
        uploads: uploadNames.map((name) => ({ name, size: 0 })),
        mode: activeTask?.mode ?? (activePlan ? "plan" : "discuss"),
        approvalRequest: activeTask?.approvalPending
          ? (activeTask.approvalRequest ?? null)
          : null,
        handoff: activeTask?.handoff ?? null,
        lastVerification: null,
        degradedGuardrails: [],
        activePatternMetadata: this.patternRegistry.getActivePatternMetadata(),
        activeHookNames: this.hookRegistry.getRegisteredHookNames(),
        contextBudgetState: null,
        lastPromptNotes: [],
        promptProvenance: null,
        activePlan,
        activeTask,
        policyTrace: [],
      });
      await this.refreshNameMap();
      await this.refreshInstructionSources();
    } catch (err) {
      console.error("[Runtime] Failed to switch session:", err);
    }
  }

  async deleteCurrentSession() {
    if (!this.currentSessionId || !this.documentId) return;
    if (this.isStreaming) return;
    this.agent?.reset();
    this.hookRegistry.resetSessionState();
    this.planManager.hydrate(null);
    this.taskTracker.reset();
    this.patternRegistry.deactivateAll();
    const deletedId = this.currentSessionId;
    await Promise.all([
      deleteSession(deletedId),
      saveVfsFiles(deletedId, []),
      deletePlanRecords(deletedId),
      deleteTaskRecords(deletedId),
      deleteReflectionEntries(deletedId),
      deleteThreadSummaries(deletedId),
      deleteCompletionArtifacts(deletedId),
      deleteCompactionArtifacts(deletedId),
    ]);
    const session = await getOrCreateCurrentSession(this.documentId);
    this.currentSessionId = session.id;
    const [vfsFiles, latestPlan, latestTask] = await Promise.all([
      loadVfsFiles(session.id),
      getLatestPlanRecord(session.id),
      getLatestTaskRecord(session.id),
    ]);
    await restoreVfs(vfsFiles);
    const activePlan = this.planManager.hydrate(latestPlan);
    const activeTask = this.taskTracker.hydrate(latestTask);
    this.activateRestoredPatterns(activePlan);

    if (session.agentMessages.length > 0 && this.agent) {
      this.agent.replaceMessages(session.agentMessages);
    }

    await this.loadThreadState(session.id, activeTask, activePlan);
    await this.refreshSessions();
    const uploadNames = await listUploads();
    const stats = deriveStats(session.agentMessages);
    this.update({
      messages: agentMessagesToChatMessages(
        session.agentMessages,
        this.adapter.metadataTag,
      ),
      currentSession: session,
      error: null,
      sessionStats: {
        ...stats,
        contextWindow: this.state.sessionStats.contextWindow,
      },
      uploads: uploadNames.map((name) => ({ name, size: 0 })),
      mode: activeTask?.mode ?? (activePlan ? "plan" : "discuss"),
      approvalRequest: activeTask?.approvalPending
        ? (activeTask.approvalRequest ?? null)
        : null,
      handoff: activeTask?.handoff ?? null,
      lastVerification: null,
      degradedGuardrails: [],
      activePatternMetadata: this.patternRegistry.getActivePatternMetadata(),
      activeHookNames: this.hookRegistry.getRegisteredHookNames(),
      contextBudgetState: null,
      lastPromptNotes: [],
      promptProvenance: null,
      activePlan,
      activeTask,
      policyTrace: [],
    });
    await this.refreshInstructionSources();
  }

  private async onStreamingEnd() {
    if (!this.currentSessionId) return;
    const sessionId = this.currentSessionId;
    try {
      const taskSummary = this.state.error
        ? this.state.error
        : "Agent execution completed.";
      const activeTask = this.state.error
        ? this.taskTracker.failTask(taskSummary)
        : this.taskTracker.completeTask(taskSummary);
      const verification = await this.runVerificationPhase();
      if (activeTask) {
        await this.reflectionEngine.taskReflect({
          taskId: activeTask.id,
          summary: taskSummary,
        });
      }
      const activeThreadId =
        this.state.activeThreadId ?? this.state.threads[0]?.id ?? null;
      const completionArtifact =
        activeTask && activeThreadId
          ? {
              id: crypto.randomUUID(),
              threadId: activeThreadId,
              taskId: activeTask.id,
              summary: taskSummary,
              verificationStatus: (verification?.status === "running"
                ? "pending"
                : (verification?.status ??
                  activeTask.verificationSummary?.status ??
                  "pending")) as CompletionArtifact["verificationStatus"],
              changedScopes: activeTask.scopeSummary
                ? [activeTask.scopeSummary]
                : [],
              createdAt: Date.now(),
            }
          : null;
      await Promise.all([
        this.persistSessionState(sessionId),
        this.reflectionEngine.persist(sessionId),
        completionArtifact
          ? createCompletionArtifact(sessionId, completionArtifact)
          : Promise.resolve(),
      ]);
      if (activeThreadId) {
        await this.saveThread({
          ...(this.state.threads.find(
            (thread) => thread.id === activeThreadId,
          ) ?? this.buildRootThread()),
          id: activeThreadId,
          status:
            verification?.status === "failed" ||
            verification?.status === "retryable"
              ? "blocked"
              : "completed",
          rootTaskId: activeTask?.id ?? null,
          currentTaskId: activeTask?.id ?? null,
          milestoneIds:
            this.state.activePlan?.milestones.map((item) => item.id) ?? [],
          updatedAt: Date.now(),
        });
      }
      await this.loadThreadState(sessionId);
      this.appendPolicyTrace({
        event: "task_completed",
        outcome:
          verification?.status === "failed" ||
          verification?.status === "retryable"
            ? "blocked"
            : "allowed",
        reason:
          verification?.status === "failed" ||
          verification?.status === "retryable"
            ? "Task completed with verification follow-up required."
            : "Task completed and persisted successfully.",
      });
      await this.refreshSessions();
      const updated = await getSession(sessionId);
      if (updated) {
        this.update({
          currentSession: updated,
          activePlan: this.planManager.getActivePlan(),
          activeTask: this.taskTracker.getCurrentTask(),
        });
      }
      await this.refreshInstructionSources();
      this.bumpVfs();

      // Auto-compact: trigger compaction when context usage reaches 90 %
      const autoUsage = this.state.sessionStats.lastInputTokens;
      const autoWindow = this.state.sessionStats.contextWindow;
      if (autoWindow > 0 && this.contextManager.shouldCompact(autoUsage, autoWindow)) {
        await this.compactContext("auto");
      }
    } catch (e) {
      console.error("[Runtime] Failed to save session:", e);
      this.update({
        error: "Session save failed — your last changes may not persist.",
      });
    }
  }

  async init() {
    if (this.sessionLoaded) return;
    this.sessionLoaded = true;

    if (this.adapter.staticFiles) {
      setStaticFiles(this.adapter.staticFiles);
    }
    if (this.adapter.customCommands) {
      setCustomCommands(this.adapter.customCommands);
    }

    try {
      const id = await this.adapter.getDocumentId();
      this.documentId = id;

      const skills = await getInstalledSkills();
      this.skills = skills;
      await syncSkillsToVfs();

      const saved = loadSavedConfig();
      if (saved?.provider && saved?.apiKey && saved?.model) {
        this.applyConfig(saved);
      }

      const session = await getOrCreateCurrentSession(id);
      this.currentSessionId = session.id;
      const [sessions, vfsFiles, latestPlan, latestTask] = await Promise.all([
        listSessions(id),
        loadVfsFiles(session.id),
        getLatestPlanRecord(session.id),
        getLatestTaskRecord(session.id),
      ]);
      if (vfsFiles.length > 0) {
        await restoreVfs(vfsFiles);
      }
      const activePlan = this.planManager.hydrate(latestPlan);
      const activeTask = this.taskTracker.hydrate(latestTask);
      this.activateRestoredPatterns(activePlan);

      if (session.agentMessages.length > 0 && this.agent) {
        this.agent.replaceMessages(session.agentMessages);
      }

      await this.loadThreadState(session.id, activeTask, activePlan);
      const uploadNames = await listUploads();
      const stats = deriveStats(session.agentMessages);
      this.update({
        messages: agentMessagesToChatMessages(
          session.agentMessages,
          this.adapter.metadataTag,
        ),
        currentSession: session,
        sessions,
        skills,
        sessionStats: {
          ...stats,
          contextWindow: this.state.sessionStats.contextWindow,
        },
        uploads: uploadNames.map((name) => ({ name, size: 0 })),
        mode: activeTask?.mode ?? (activePlan ? "plan" : "discuss"),
        approvalRequest: activeTask?.approvalPending
          ? (activeTask.approvalRequest ?? null)
          : null,
        handoff: activeTask?.handoff ?? null,
        lastVerification: null,
        degradedGuardrails: [],
        activePatternMetadata: this.patternRegistry.getActivePatternMetadata(),
        activeHookNames: this.hookRegistry.getRegisteredHookNames(),
        contextBudgetState: null,
        lastPromptNotes: [],
        promptProvenance: null,
        activePlan,
        activeTask,
        policyTrace: [],
      });
      await this.refreshNameMap();
      await this.refreshInstructionSources();
    } catch (err) {
      console.error("[Runtime] Failed to load session:", err);
    }
  }

  async uploadFiles(files: { name: string; size: number; data: Uint8Array }[]) {
    if (files.length === 0) return;
    this.update({ isUploading: true });
    try {
      for (const file of files) {
        await writeFile(file.name, file.data);
        const uploads = [...this.state.uploads];
        const exists = uploads.findIndex((u) => u.name === file.name);
        if (exists !== -1) {
          uploads[exists] = { name: file.name, size: file.size };
        } else {
          uploads.push({ name: file.name, size: file.size });
        }
        this.update({ uploads });
      }
      if (this.currentSessionId) {
        const snapshot = await snapshotVfs();
        await saveVfsFiles(this.currentSessionId, snapshot);
      }
      this.bumpVfs();
    } catch (err) {
      console.error("Failed to upload file:", err);
    } finally {
      this.update({ isUploading: false });
    }
  }

  async removeUpload(name: string) {
    try {
      await deleteFile(name);
      this.update({
        uploads: this.state.uploads.filter((u) => u.name !== name),
      });
      if (this.currentSessionId) {
        const snapshot = await snapshotVfs();
        await saveVfsFiles(this.currentSessionId, snapshot);
      }
      this.bumpVfs();
    } catch (err) {
      console.error("Failed to delete file:", err);
      this.update({
        uploads: this.state.uploads.filter((u) => u.name !== name),
      });
    }
  }

  private async refreshSkillsAndRebuildAgent() {
    this.skills = await getInstalledSkills();
    this.update({ skills: this.skills });
    if (this.state.providerConfig) {
      this.applyConfig(this.state.providerConfig);
    }
  }

  async installSkill(inputs: { path: string; data: Uint8Array }[]) {
    if (inputs.length === 0) return;
    try {
      await addSkill(inputs);
      await this.refreshSkillsAndRebuildAgent();
    } catch (err) {
      console.error("[Runtime] Failed to install skill:", err);
      this.update({
        error: err instanceof Error ? err.message : "Failed to install skill",
      });
    }
  }

  async uninstallSkill(name: string) {
    try {
      await removeSkill(name);
      await this.refreshSkillsAndRebuildAgent();
    } catch (err) {
      console.error("[Runtime] Failed to uninstall skill:", err);
      this.update({
        error: err instanceof Error ? err.message : "Failed to uninstall skill",
      });
    }
  }

  toggleFollowMode() {
    if (!this.state.providerConfig) return;
    const newFollowMode = !this.state.providerConfig.followMode;
    this.followMode = newFollowMode;
    const newConfig = {
      ...this.state.providerConfig,
      followMode: newFollowMode,
    };
    saveConfig(newConfig);
    this.update({ providerConfig: newConfig });
  }

  toggleExpandToolCalls() {
    if (!this.state.providerConfig) return;
    const newConfig = {
      ...this.state.providerConfig,
      expandToolCalls: !this.state.providerConfig.expandToolCalls,
    };
    saveConfig(newConfig);
    this.update({ providerConfig: newConfig });
  }

  getName(id: number): string | undefined {
    return this.state.nameMap[id];
  }

  private async refreshNameMap() {
    if (!this.adapter.getDocumentMetadata) return;
    try {
      const meta = await this.adapter.getDocumentMetadata();
      if (meta?.metadata) {
        this.lastDocumentMetadata = meta.metadata;
        this.lastDocumentMetadataUpdatedAt = Date.now();
      }
      if (meta?.nameMap) {
        this.update({ nameMap: meta.nameMap });
      }
    } catch (err) {
      console.error("[Runtime] Failed to refresh nameMap:", err);
    }
  }

  dispose() {
    this.agent?.abort();
    this.unsubscribeAgent?.();
    this.unsubscribeAgent = null;
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.clearAdapterHooks();
    this.patternRegistry.deactivateAll();
    this.listeners.clear();
  }

  private clearAdapterHooks() {
    for (const disposable of this.adapterHookDisposables) {
      disposable.dispose();
    }
    this.adapterHookDisposables = [];
  }

  private syncAdapterHooks(adapter: RuntimeAdapter) {
    this.clearAdapterHooks();

    const registration = adapter.registerHooks?.(this.hookRegistry);
    if (!registration) {
      if (this.state) {
        this.update({
          activeHookNames: this.hookRegistry.getRegisteredHookNames(),
        });
      }
      return;
    }

    this.adapterHookDisposables = Array.isArray(registration)
      ? registration
      : [registration];
    if (this.state) {
      this.update({
        activeHookNames: this.hookRegistry.getRegisteredHookNames(),
      });
    }
  }

  private syncAdapterPatterns(adapter: RuntimeAdapter) {
    this.patternRegistry.deactivateAll();
    this.patternRegistry = new PatternRegistry();

    for (const pattern of adapter.getReasoningPatterns?.() ?? []) {
      this.patternRegistry.register(pattern);
    }
    if (this.state) {
      this.update({ activePatternMetadata: [] });
    }
  }

  private syncAdapterVerifiers(adapter: RuntimeAdapter) {
    this.verificationEngine.setSuites(adapter.getVerificationSuites?.() ?? []);
    if (this.state) {
      this.update({
        activeVerifierIds: this.verificationEngine
          .getSuites()
          .map((suite) => suite.id),
      });
    }
  }

  private activateRestoredPatterns(plan: ExecutionPlan | null) {
    this.patternRegistry.deactivateAll();
    if (!plan) {
      this.update({ activePatternMetadata: [] });
      return;
    }

    this.patternRegistry.activateMatching(
      this.hookRegistry,
      plan.classification,
      plan,
    );
    this.update({
      activePatternMetadata: this.patternRegistry.getActivePatternMetadata(),
      activeHookNames: this.hookRegistry.getRegisteredHookNames(),
    });
  }

  private createPromptProvenanceContributor(
    order: number,
    kind: PromptProvenanceContributorKind,
    label: string,
    summary: string,
    path?: string,
  ): PromptProvenanceContributor {
    return {
      id: `prompt:${kind}:${order}`,
      kind,
      label,
      order,
      summary,
      path,
    };
  }

  private async buildPromptContent(content: string, attachments?: string[]) {
    const promptParts: string[] = [];
    const provenanceContributors: PromptProvenanceContributor[] = [];
    let contributorOrder = 0;

    const providerFamily = inferProviderFamily(this.state.providerConfig);
    const phase = inferPromptPhase(
      content,
      this.state.mode,
      this.state.activeTask,
    );
    provenanceContributors.push(
      this.createPromptProvenanceContributor(
        contributorOrder++,
        "system_prompt",
        "System prompt",
        `${this.adapter.hostApp ?? "generic"} adapter system prompt`,
      ),
    );
    const promptContract = buildPromptContract({
      providerConfig: this.state.providerConfig,
      mode: this.state.mode,
      task: this.state.activeTask,
      content,
      hostApp: this.adapter.hostApp,
    });
    promptParts.push(promptContract);
    provenanceContributors.push(
      this.createPromptProvenanceContributor(
        contributorOrder++,
        "prompt_contract",
        "Prompt contract",
        `${providerFamily} provider profile in ${phase} phase`,
      ),
    );

    const localDoctrine = buildLocalDoctrinePromptSection({
      hostApp: this.adapter.hostApp,
      providerFamily,
      phase,
    });
    const localDoctrineContributors = selectLocalDoctrineContributors({
      hostApp: this.adapter.hostApp,
      providerFamily,
      phase,
    });
    if (localDoctrine) {
      promptParts.push(localDoctrine);
      provenanceContributors.push(
        this.createPromptProvenanceContributor(
          contributorOrder++,
          "local_doctrine",
          "Local doctrine",
          localDoctrineContributors
            .map((contributor) => contributor.id)
            .join(", "),
          localDoctrineContributors[0]?.canonicalPath,
        ),
      );
    }

    if (this.adapter.getDocumentMetadata) {
      try {
        const meta = await this.adapter.getDocumentMetadata();
        if (meta) {
          this.lastDocumentMetadata = meta.metadata;
          this.lastDocumentMetadataUpdatedAt = Date.now();
          const tag = this.adapter.metadataTag || "doc_context";
          promptParts.push(
            `<${tag}>\n${JSON.stringify(meta.metadata, null, 2)}\n</${tag}>`,
          );
          provenanceContributors.push(
            this.createPromptProvenanceContributor(
              contributorOrder++,
              "document_metadata",
              "Document metadata",
              summarizeMetadataTag(tag, meta.metadata),
            ),
          );
          if (meta.nameMap) {
            this.update({ nameMap: meta.nameMap });
          }
        }
      } catch (err) {
        console.error("[Runtime] Failed to get document metadata:", err);
      }
    }

    if (attachments && attachments.length > 0) {
      const paths = attachments
        .map((name) => `/home/user/uploads/${name}`)
        .join("\n");
      promptParts.push(`<attachments>\n${paths}\n</attachments>`);
      provenanceContributors.push(
        this.createPromptProvenanceContributor(
          contributorOrder++,
          "attachments",
          "Attachments",
          summarizeAttachments(attachments),
        ),
      );
    }

    if (this.state.activePlan) {
      promptParts.push(
        this.planManager.formatPlanForPrompt(this.state.activePlan),
      );
      provenanceContributors.push(
        this.createPromptProvenanceContributor(
          contributorOrder++,
          "plan",
          "Active plan",
          this.state.activePlan.summary ?? this.state.activePlan.userRequest,
        ),
      );
    }

    const contextUsagePct =
      this.state.sessionStats.contextWindow > 0
        ? Math.round(
            (this.state.sessionStats.lastInputTokens /
              this.state.sessionStats.contextWindow) *
              100,
          )
        : 0;
    const contextAction =
      this.contextManager.getActionForUsage(contextUsagePct);
    if (contextAction !== "none") {
      promptParts.push(
        `<context_budget action="${contextAction}" usage_pct="${contextUsagePct}" />`,
      );
      provenanceContributors.push(
        this.createPromptProvenanceContributor(
          contributorOrder++,
          "context_budget",
          "Context budget",
          `${contextAction} at ${contextUsagePct}% context usage`,
        ),
      );
    }
    this.update({
      contextBudgetState: { action: contextAction, usagePct: contextUsagePct },
    });

    const hookNotes = this.hookRegistry.drainPromptNotes();
    const runtimeNotes = hookNotes.map((note) => note.text);
    this.update({
      lastPromptNotes: runtimeNotes,
    });
    if (hookNotes.length > 0) {
      const noteText = hookNotes
        .map((note) => `[${note.level.toUpperCase()}] ${note.text}`)
        .join("\n");
      promptParts.push(`<hook_notes>\n${noteText}\n</hook_notes>`);
      provenanceContributors.push(
        this.createPromptProvenanceContributor(
          contributorOrder++,
          "hook_notes",
          "Runtime notes",
          `${hookNotes.length} note${hookNotes.length === 1 ? "" : "s"} from hooks`,
        ),
      );
    }

    promptParts.push(content);
    provenanceContributors.push(
      this.createPromptProvenanceContributor(
        contributorOrder++,
        "user_request",
        "User request",
        content,
      ),
    );
    this.update({
      promptProvenance: {
        providerFamily,
        provider: this.state.providerConfig?.provider ?? "unconfigured",
        model: this.state.providerConfig?.model ?? "unknown",
        apiType: this.state.providerConfig?.apiType ?? "default",
        phase,
        contributors: provenanceContributors,
        runtimeNotes,
        updatedAt: Date.now(),
      },
    });
    return promptParts.join("\n\n");
  }

  private async executeActiveTask(
    agent: Agent,
    content: string,
    attachments?: string[],
  ) {
    const promptContent = await this.buildPromptContent(content, attachments);
    this.isStreaming = true;
    this.taskTracker.setMode("execute");
    this.update({
      isStreaming: true,
      mode: "execute",
      activeTask: this.taskTracker.getCurrentTask(),
    });
    await agent.prompt(promptContent);
  }

  private async estimateScopeRisk(
    content: string,
    classification: Awaited<ReturnType<TaskClassifier["classify"]>>,
  ): Promise<ScopeRiskEstimate> {
    if (this.adapter.estimateScopeRisk) {
      return this.adapter.estimateScopeRisk(content, classification);
    }

    return {
      level: classification.risk,
      destructive: classification.risk === "high",
      requiresApproval: classification.risk === "high",
      reasons:
        classification.risk === "high"
          ? ["High-risk mutation inferred from the request."]
          : ["No adapter-specific risk override."],
      scopeSummary: undefined,
      constraints: [],
      expectedEffects: [],
    };
  }

  private async buildHandoff(
    task: TaskRecord,
    nextRecommendedAction: string,
  ): Promise<HandoffPacket> {
    const incompleteVerifications =
      task.verificationSummary?.failedVerifierIds ?? [];
    const handoff = this.contextManager.buildHandoff(
      task,
      incompleteVerifications,
      nextRecommendedAction,
    );
    if (this.adapter.buildHandoffSummary) {
      handoff.summary = await this.adapter.buildHandoffSummary(task);
    }
    await writeFile(
      "/.oa/state/handoff.json",
      JSON.stringify(handoff, null, 2),
    );
    return handoff;
  }

  async runVerificationPhase() {
    const task = this.taskTracker.getCurrentTask();
    if (!task) return null;

    this.update({ mode: "verify" });
    const compacted = this.contextManager.compactToolExecutions(
      task.toolExecutions ?? [],
    );
    const degradedGuardrails = [...this.state.degradedGuardrails];
    if (compacted.summary.length > 0) {
      degradedGuardrails.push(
        `Compacted ${compacted.summary.length} earlier tool execution records.`,
      );
    }

    const freshHookNotes = this.hookRegistry
      .drainPromptNotes()
      .map((note) => note.text);
    const promptNotes = [...this.state.lastPromptNotes, ...freshHookNotes];
    if (freshHookNotes.length > 0) {
      this.update({ lastPromptNotes: promptNotes });
    }

    const verification = await this.verificationEngine.run({
      app:
        this.adapter.hostApp === "word" ||
        this.adapter.metadataTag === "doc_context"
          ? "word"
          : this.adapter.hostApp === "excel" ||
              this.adapter.metadataTag === "wb_context"
            ? "excel"
            : this.adapter.hostApp === "powerpoint" ||
                this.adapter.metadataTag === "ppt_context"
              ? "powerpoint"
              : undefined,
      mode: "verify",
      request: task.userRequest,
      plan: this.planManager.getActivePlan(),
      task: {
        ...task,
        toolExecutions: compacted.kept,
      },
      toolExecutions: compacted.kept,
      promptNotes,
    });

    this.taskTracker.setVerificationResults(
      verification.results,
      verification.status as NonNullable<
        TaskRecord["verificationSummary"]
      >["status"],
      verification.retryable,
    );
    this.planManager.syncWithExecution(this.taskTracker.getCurrentTask());

    const verificationFailed =
      verification.status === "failed" || verification.status === "retryable";
    const isFullAuto = this.state.approvalPolicy.mode === "auto";
    const resumeCount = task.resumeCount ?? 0;
    const retriesExhausted = resumeCount >= 2;

    let handoff: Awaited<ReturnType<typeof this.buildHandoff>> | null = null;
    let finalMode: string;

    if (verificationFailed && !isFullAuto && !retriesExhausted) {
      handoff = await this.buildHandoff(
        this.taskTracker.getCurrentTask()!,
        verification.retryable
          ? "Resume the task after addressing the retryable verification mismatch."
          : "Review the failed verification before continuing.",
      );
      finalMode = "blocked";
    } else {
      if (verificationFailed) {
        degradedGuardrails.push(
          isFullAuto
            ? "Verification failed but full_auto mode suppressed the pause."
            : `Verification failed after ${resumeCount} resume attempts; completing with degraded guardrails.`,
        );
      }
      finalMode = "completed";
    }

    if (verification.status === "skipped") {
      degradedGuardrails.push(
        "Verification was skipped because no suite matched this task.",
      );
    }

    this.taskTracker.setHandoff(handoff);
    this.taskTracker.setMode(finalMode === "blocked" ? "blocked" : "completed");

    this.update({
      mode: finalMode === "blocked" ? "blocked" : "completed",
      handoff,
      lastVerification: verification,
      degradedGuardrails,
      activePlan: this.planManager.getActivePlan(),
      activeTask: this.taskTracker.getCurrentTask(),
    });

    await writeFile(
      "/.oa/state/verification.json",
      JSON.stringify(verification, null, 2),
    );

    return verification;
  }
}
