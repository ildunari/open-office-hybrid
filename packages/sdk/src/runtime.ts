import {
  Agent,
  type AgentEvent,
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
import { ContextManager } from "./context/manager";
import {
  type Disposable,
  HookRegistry,
  readBeforeWritePostHook,
  readBeforeWritePreHook,
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
  HostApp,
  PermissionMode,
  TaskPhase,
  WaitingState,
} from "./orchestration/types";
import { PatternRegistry } from "./patterns/registry";
import type { ReasoningPattern } from "./patterns/types";
import {
  createUpdatePlanTool,
  type ExecutionPlan,
  PlanManager,
  TaskClassifier,
  type TaskRecord,
} from "./planning";
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
import { TaskTracker } from "./state/tracker";
import {
  type ChatSession,
  createSession,
  deleteSession,
  getOrCreateCurrentSession,
  getSession,
  listSessions,
  loadVfsFiles,
  saveSession,
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
  activePlan: ExecutionPlan | null;
  activeTask: TaskRecord | null;
  planState: ExecutionPlan | null;
  taskPhase: TaskPhase;
  permissionMode: PermissionMode;
  waitingState: WaitingState | null;
}

type StateListener = (state: RuntimeState) => void;

const INITIAL_STATS: SessionStats = { ...deriveStats([]), contextWindow: 0 };

function thinkingLevelToAgent(level: ThinkingLevel): AgentThinkingLevel {
  return level === "none" ? "off" : level;
}

function toTaskPhase(
  mode: RuntimeState["mode"],
  hasPendingDecision: boolean,
): TaskPhase {
  if (mode === "awaiting_approval") return "waiting_on_user";
  if (mode === "plan") return "plan";
  if (mode === "execute") return "execute";
  if (mode === "verify") return "verify";
  if (mode === "completed") return "completed";
  if (mode === "blocked") {
    return hasPendingDecision ? "waiting_on_user" : "blocked";
  }
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

  if (!state.handoff) return null;
  return {
    kind: "clarification",
    reason: state.handoff.nextRecommendedAction,
    resumeMessage: state.handoff.summary || state.handoff.nextRecommendedAction,
    createdAt: state.handoff.updatedAt,
  };
}

export class AgentRuntime {
  private agent: Agent | null = null;
  private config: ProviderConfig | null = null;
  private pendingConfig: ProviderConfig | null = null;
  private streamingMessageId: string | null = null;
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
  private patternRegistry = new PatternRegistry();
  private verificationEngine = new VerificationEngine();
  private listeners: Set<StateListener> = new Set();
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
      activePlan: null,
      activeTask: null,
      planState: null,
      taskPhase: "discuss",
      permissionMode: validConfig?.permissionMode ?? "confirm_risky",
      waitingState: null,
    };
  }

  getState(): RuntimeState {
    return this.state;
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

  private update(partial: Partial<RuntimeState>) {
    this.state = this.syncHybridState({ ...this.state, ...partial });
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

  private syncHybridState(next: RuntimeState): RuntimeState {
    return {
      ...next,
      planState: next.activePlan,
      taskPhase: toTaskPhase(
        next.mode,
        Boolean(next.approvalRequest || next.handoff),
      ),
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
  }

  setPermissionMode(mode: PermissionMode) {
    const nextConfig = this.state.providerConfig
      ? { ...this.state.providerConfig, permissionMode: mode }
      : null;
    if (nextConfig) {
      saveConfig(nextConfig);
    }
    this.update({ permissionMode: mode, providerConfig: nextConfig });
  }

  approvePending() {
    return this.approveActivePlan();
  }

  private applyPermissionMode(
    classification: Awaited<ReturnType<TaskClassifier["classify"]>>,
    riskEstimate: ScopeRiskEstimate,
  ): ScopeRiskEstimate {
    const hasMutationRisk =
      classification.risk !== "none" || riskEstimate.destructive;
    if (!hasMutationRisk) return riskEstimate;

    if (this.state.permissionMode === "full_auto") {
      return {
        ...riskEstimate,
        requiresApproval: false,
      };
    }

    if (this.state.permissionMode === "confirm_writes") {
      return {
        ...riskEstimate,
        requiresApproval: true,
        reasons: [
          ...riskEstimate.reasons,
          "Permission mode requires approval before writes.",
        ],
      };
    }

    if (this.state.permissionMode === "read_only") {
      return {
        ...riskEstimate,
        requiresApproval: true,
        reasons: [
          ...riskEstimate.reasons,
          "Permission mode is read-only. Change the mode to allow writes.",
        ],
      };
    }

    return riskEstimate;
  }

  private isReadOnlyMutationBlocked(
    classification: Awaited<ReturnType<TaskClassifier["classify"]>>,
    riskEstimate: ScopeRiskEstimate,
  ) {
    return (
      this.state.permissionMode === "read_only" &&
      (classification.risk !== "none" || riskEstimate.destructive)
    );
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
        }
        break;
      }
      case "message_update": {
        if (event.message.role === "assistant" && this.streamingMessageId) {
          const streamId = this.streamingMessageId;
          this.updateMessages((msgs) => {
            const messages = [...msgs];
            const idx = messages.findIndex((m) => m.id === streamId);
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
        break;
      }
      case "message_end": {
        if (event.message.role === "assistant") {
          const assistantMsg = event.message as AssistantMessage;
          const isError =
            assistantMsg.stopReason === "error" ||
            assistantMsg.stopReason === "aborted";
          const streamId = this.streamingMessageId;

          this.updateMessages(
            (msgs) => {
              const messages = [...msgs];
              const idx = messages.findIndex((m) => m.id === streamId);

              if (isError) {
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
        this.taskTracker.recordToolCall(event.toolCallId);
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
        break;
      }
      case "agent_end": {
        this.isStreaming = false;
        this.streamingMessageId = null;
        this.update({ isStreaming: false });
        this.onStreamingEnd();
        break;
      }
    }
  };

  applyConfig(config: ProviderConfig) {
    let contextWindow = 0;
    let baseModel: Model<Api>;
    if (config.provider === "custom") {
      const custom = buildCustomModel(config);
      if (!custom) return;
      baseModel = custom;
    } else {
      try {
        baseModel = (getModel as (p: string, m: string) => Model<Api>)(
          config.provider,
          config.model,
        );
      } catch {
        return;
      }
    }
    contextWindow = baseModel.contextWindow;
    this.config = config;

    const proxiedModel = applyProxyToModel(baseModel, config);
    const existingMessages = this.agent?.state.messages ?? [];

    if (this.agent) {
      this.agent.abort();
    }

    const systemPrompt = this.adapter.buildSystemPrompt(this.skills);

    const agent = new Agent({
      initialState: {
        model: proxiedModel,
        systemPrompt,
        thinkingLevel: thinkingLevelToAgent(config.thinking),
        tools: [
          createUpdatePlanTool(this.planManager),
          ...this.hookRegistry.wrapTools(this.adapter.tools),
        ],
        messages: existingMessages,
      },
      streamFn: async (model, context, options) => {
        const cfg = this.config ?? config;
        const apiKey = await this.getActiveApiKey(cfg);
        return streamSimple(model, context, {
          ...options,
          apiKey,
        });
      },
    });
    this.agent = agent;
    agent.subscribe(this.handleAgentEvent);
    this.pendingConfig = null;
    this.followMode = config.followMode ?? true;

    this.update({
      providerConfig: config,
      error: null,
      sessionStats: {
        ...this.state.sessionStats,
        contextWindow,
      },
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

    try {
      const classification = await this.taskClassifier.classify(content);
      const rawRiskEstimate = await this.estimateScopeRisk(
        content,
        classification,
      );
      const riskEstimate = this.applyPermissionMode(
        classification,
        rawRiskEstimate,
      );
      const permissionBlocked = this.isReadOnlyMutationBlocked(
        classification,
        rawRiskEstimate,
      );
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

      this.update({
        mode: riskEstimate.requiresApproval
          ? permissionBlocked
            ? "blocked"
            : "awaiting_approval"
          : classification.needsPlan
            ? "plan"
            : "discuss",
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
        handoff: null,
        lastVerification: null,
        degradedGuardrails,
        activePatternMetadata,
        activeHookNames: this.hookRegistry.getRegisteredHookNames(),
        contextBudgetState: null,
        lastPromptNotes: [],
        activePlan,
        activeTask,
      });

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
        return;
      }

      if (riskEstimate.requiresApproval && activeTask) {
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
    if (this.state.permissionMode === "read_only") return;
    this.taskTracker.setApprovalPending(false);
    this.taskTracker.setMode("execute");
    this.taskTracker.setHandoff(null);
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
    this.taskTracker.setMode("execute");
    this.taskTracker.setHandoff(null);
    this.update({
      mode: "execute",
      handoff: null,
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

  clearMessages() {
    this.abort();
    this.agent?.reset();
    resetVfs();
    this.hookRegistry.resetSessionState();
    this.planManager.hydrate(null);
    this.taskTracker.reset();
    this.patternRegistry.deactivateAll();
    if (this.currentSessionId) {
      Promise.all([
        saveSession(this.currentSessionId, []),
        saveVfsFiles(this.currentSessionId, []),
        deletePlanRecords(this.currentSessionId),
        deleteTaskRecords(this.currentSessionId),
        deleteReflectionEntries(this.currentSessionId),
      ]).catch(console.error);
    }
    this.update({
      messages: [],
      error: null,
      sessionStats: INITIAL_STATS,
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
      activePlan: null,
      activeTask: null,
    });
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
      await this.refreshSessions();
      this.update({
        messages: [],
        currentSession: session,
        error: null,
        sessionStats: INITIAL_STATS,
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
        activePlan: null,
        activeTask: null,
      });
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
        approvalRequest:
          activeTask?.approvalPending && activeTask.handoff
            ? {
                level: activePlan?.classification.risk ?? "medium",
                destructive: true,
                reason: activeTask.handoff.nextRecommendedAction,
                requestedAt: activeTask.handoff.updatedAt,
              }
            : null,
        handoff: activeTask?.handoff ?? null,
        lastVerification: null,
        degradedGuardrails: [],
        activePatternMetadata: this.patternRegistry.getActivePatternMetadata(),
        activeHookNames: this.hookRegistry.getRegisteredHookNames(),
        contextBudgetState: null,
        lastPromptNotes: [],
        activePlan,
        activeTask,
      });
      await this.refreshNameMap();
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
      approvalRequest:
        activeTask?.approvalPending && activeTask.handoff
          ? {
              level: activePlan?.classification.risk ?? "medium",
              destructive: true,
              reason: activeTask.handoff.nextRecommendedAction,
              requestedAt: activeTask.handoff.updatedAt,
            }
          : null,
      handoff: activeTask?.handoff ?? null,
      lastVerification: null,
      degradedGuardrails: [],
      activePatternMetadata: this.patternRegistry.getActivePatternMetadata(),
      activeHookNames: this.hookRegistry.getRegisteredHookNames(),
      contextBudgetState: null,
      lastPromptNotes: [],
      activePlan,
      activeTask,
    });
  }

  private async onStreamingEnd() {
    if (!this.currentSessionId) return;
    const sessionId = this.currentSessionId;
    const agentMessages = this.agent?.state.messages ?? [];
    try {
      const taskSummary = this.state.error
        ? this.state.error
        : "Agent execution completed.";
      const activeTask = this.state.error
        ? this.taskTracker.failTask(taskSummary)
        : this.taskTracker.completeTask(taskSummary);
      await this.runVerificationPhase();
      if (activeTask) {
        await this.reflectionEngine.taskReflect({
          taskId: activeTask.id,
          summary: taskSummary,
        });
      }
      const vfsFiles = await snapshotVfs();
      await Promise.all([
        saveSession(sessionId, agentMessages),
        saveVfsFiles(sessionId, vfsFiles),
        this.planManager.persist(sessionId),
        this.taskTracker.persist(sessionId),
        this.reflectionEngine.persist(sessionId),
      ]);
      await this.refreshSessions();
      const updated = await getSession(sessionId);
      if (updated) {
        this.update({
          currentSession: updated,
          activePlan: this.planManager.getActivePlan(),
          activeTask: this.taskTracker.getCurrentTask(),
        });
      }
      this.bumpVfs();
    } catch (e) {
      console.error(e);
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
        approvalRequest:
          activeTask?.approvalPending && activeTask.handoff
            ? {
                level: activePlan?.classification.risk ?? "medium",
                destructive: true,
                reason: activeTask.handoff.nextRecommendedAction,
                requestedAt: activeTask.handoff.updatedAt,
              }
            : null,
        handoff: activeTask?.handoff ?? null,
        lastVerification: null,
        degradedGuardrails: [],
        activePatternMetadata: this.patternRegistry.getActivePatternMetadata(),
        activeHookNames: this.hookRegistry.getRegisteredHookNames(),
        contextBudgetState: null,
        lastPromptNotes: [],
        activePlan,
        activeTask,
      });
      await this.refreshNameMap();
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
      if (meta?.nameMap) {
        this.update({ nameMap: meta.nameMap });
      }
    } catch (err) {
      console.error("[Runtime] Failed to refresh nameMap:", err);
    }
  }

  dispose() {
    this.agent?.abort();
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
      this.update({
        activeHookNames: this.hookRegistry.getRegisteredHookNames(),
      });
      return;
    }

    this.adapterHookDisposables = Array.isArray(registration)
      ? registration
      : [registration];
    this.update({
      activeHookNames: this.hookRegistry.getRegisteredHookNames(),
    });
  }

  private syncAdapterPatterns(adapter: RuntimeAdapter) {
    this.patternRegistry.deactivateAll();
    this.patternRegistry = new PatternRegistry();

    for (const pattern of adapter.getReasoningPatterns?.() ?? []) {
      this.patternRegistry.register(pattern);
    }
    this.update({ activePatternMetadata: [] });
  }

  private syncAdapterVerifiers(adapter: RuntimeAdapter) {
    this.verificationEngine.setSuites(adapter.getVerificationSuites?.() ?? []);
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

  private async buildPromptContent(content: string, attachments?: string[]) {
    let promptContent = content;

    if (this.adapter.getDocumentMetadata) {
      try {
        const meta = await this.adapter.getDocumentMetadata();
        if (meta) {
          const tag = this.adapter.metadataTag || "doc_context";
          promptContent = `<${tag}>\n${JSON.stringify(meta.metadata, null, 2)}\n</${tag}>\n\n${content}`;
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
      promptContent = `<attachments>\n${paths}\n</attachments>\n\n${promptContent}`;
    }

    if (this.state.activePlan) {
      promptContent = `${this.planManager.formatPlanForPrompt(this.state.activePlan)}\n\n${promptContent}`;
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
      promptContent = `<context_budget action="${contextAction}" usage_pct="${contextUsagePct}" />\n\n${promptContent}`;
    }
    this.update({
      contextBudgetState: { action: contextAction, usagePct: contextUsagePct },
    });

    const hookNotes = this.hookRegistry.drainPromptNotes();
    this.update({
      lastPromptNotes: hookNotes.map((note) => note.text),
    });
    if (hookNotes.length > 0) {
      const noteText = hookNotes
        .map((note) => `[${note.level.toUpperCase()}] ${note.text}`)
        .join("\n");
      promptContent = `<hook_notes>\n${noteText}\n</hook_notes>\n\n${promptContent}`;
    }

    return promptContent;
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

    const verification = await this.verificationEngine.run({
      app:
        this.adapter.metadataTag === "doc_context"
          ? "word"
          : this.adapter.metadataTag === "wb_context"
            ? "excel"
            : undefined,
      mode: "verify",
      request: task.userRequest,
      plan: this.planManager.getActivePlan(),
      task: {
        ...task,
        toolExecutions: compacted.kept,
      },
      toolExecutions: compacted.kept,
      promptNotes: this.state.lastPromptNotes,
    });

    this.taskTracker.setVerificationResults(
      verification.results,
      verification.status as NonNullable<
        TaskRecord["verificationSummary"]
      >["status"],
      verification.retryable,
    );

    const handoff =
      verification.status === "failed" || verification.status === "retryable"
        ? await this.buildHandoff(
            this.taskTracker.getCurrentTask()!,
            verification.retryable
              ? "Resume the task after addressing the retryable verification mismatch."
              : "Review the failed verification before continuing.",
          )
        : null;

    if (verification.status === "skipped") {
      degradedGuardrails.push(
        "Verification was skipped because no suite matched this task.",
      );
    }

    this.taskTracker.setHandoff(handoff);
    this.taskTracker.setMode(
      verification.status === "failed" || verification.status === "retryable"
        ? "blocked"
        : "completed",
    );

    this.update({
      mode:
        verification.status === "failed" || verification.status === "retryable"
          ? "blocked"
          : "completed",
      handoff,
      lastVerification: verification,
      degradedGuardrails,
      activeTask: this.taskTracker.getCurrentTask(),
    });

    await writeFile(
      "/.oa/state/verification.json",
      JSON.stringify(verification, null, 2),
    );

    return verification;
  }
}
