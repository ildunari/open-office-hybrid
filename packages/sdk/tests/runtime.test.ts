import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildDefaultPlan, inferTaskClassification } from "../src/planning";
import {
  AgentRuntime,
  type RuntimeAdapter,
  type RuntimeState,
} from "../src/runtime";
import {
  getPlanRecord,
  getTaskRecord,
  saveExecutionManifest,
  getLatestTaskRecord,
  listThreadSummaries,
  loadVfsFiles,
  saveSession,
  savePlanRecord,
  saveTaskRecord,
} from "../src/storage/db";
import { configureNamespace } from "../src/storage/namespace";
import { resetVfs, setStaticFiles } from "../src/vfs";

// Stub localStorage for Node
if (typeof globalThis.localStorage === "undefined") {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
  };
}

let nsCounter = 0;

function freshNamespace() {
  nsCounter++;
  const dbName = `RuntimeTestDB_${nsCounter}`;
  configureNamespace({
    dbName,
    dbVersion: 1,
    localStoragePrefix: `runtime-test-${nsCounter}`,
    documentSettingsPrefix: `runtime-test-${nsCounter}`,
    documentIdSettingsKey: `runtime-test-${nsCounter}-document-id`,
  });
  return dbName;
}

function createAdapter(
  overrides: Partial<RuntimeAdapter> = {},
): RuntimeAdapter {
  return {
    tools: [],
    buildSystemPrompt: () => "You are a test assistant.",
    getDocumentId: async () => "test-doc-1",
    ...overrides,
  };
}

function createPlan(
  overrides: Partial<{
    id: string;
    userRequest: string;
    summary: string;
    approvalRequired: boolean;
    classification: ReturnType<typeof inferTaskClassification>;
  }> = {},
) {
  return {
    id: overrides.id ?? "plan-test",
    userRequest: overrides.userRequest ?? "Rewrite the introduction",
    summary: overrides.summary ?? "Plan summary",
    mode: "auto" as const,
    status: "active" as const,
    requirements: [],
    strategy: [],
    executionUnits: [],
    verification: [],
    milestones: [],
    approvalRequired: overrides.approvalRequired ?? true,
    expectedEffects: [],
    steps: [],
    createdAt: 1,
    updatedAt: 1,
    classification:
      overrides.classification ??
      inferTaskClassification("Rewrite the introduction"),
    revisionNotes: [],
  };
}

function runtimeInternals(runtime: AgentRuntime) {
  return runtime as unknown as {
    taskClassifier: { classify: (message: string) => Promise<unknown> };
    estimateScopeRisk: (
      message: string,
      classification: unknown,
    ) => Promise<{
      level: "none" | "low" | "medium" | "high";
      destructive: boolean;
      requiresApproval: boolean;
      reasons: string[];
      scopeSummary?: string;
      constraints?: string[];
      expectedEffects?: string[];
    }>;
    applyApprovalPolicy: (
      message: string,
      classification: { risk: "none" | "low" | "medium" | "high" },
      riskEstimate: {
        level: "none" | "low" | "medium" | "high";
        destructive: boolean;
        requiresApproval: boolean;
        reasons: string[];
      },
    ) => {
      level: "none" | "low" | "medium" | "high";
      destructive: boolean;
      requiresApproval: boolean;
      reasons: string[];
    };
    isCapabilityBoundaryBlocked: (
      message: string,
      classification: { risk: "none" | "low" | "medium" | "high" },
      riskEstimate: {
        level: "none" | "low" | "medium" | "high";
        destructive: boolean;
        requiresApproval: boolean;
        reasons: string[];
      },
    ) => boolean;
    taskTracker: {
      beginTask: (
        request: string,
        classification: ReturnType<typeof inferTaskClassification>,
        options?: Record<string, unknown>,
      ) => Record<string, unknown>;
      getCurrentTask: () => Record<string, unknown> | null;
      recordToolExecution: (execution: {
        toolCallId: string;
        toolName: string;
        isError: boolean;
        resultText: string;
        timestamp: number;
      }) => void;
      setMode: (mode: string) => void;
      setExecutionDiagnostics: (diagnostics: Record<string, unknown>) => void;
      completeTask: (summary?: string) => Record<string, unknown> | null;
      setHandoff: (handoff: Record<string, unknown> | null) => void;
      persist: (sessionId: string) => Promise<unknown>;
    };
    hookRegistry: {
      addPromptNotes: (
        notes: Array<{
          level: "info" | "warning" | "error";
          text: string;
          source: { hookName: string };
        }>,
      ) => void;
    };
    planManager: {
      replacePlan: (plan: ReturnType<typeof createPlan>) => void;
      getActivePlan: () => ReturnType<typeof createPlan> | null;
      syncWithExecution: (task: Record<string, unknown> | null) => unknown;
      persist: (sessionId: string) => Promise<unknown>;
    };
    deriveExecutionDiagnostics: (
      task: Record<string, unknown> | null,
    ) => Record<string, unknown>;
    maybeInterruptNoWriteLoop: () => Promise<boolean>;
    update: (partial: Partial<RuntimeState>) => void;
  };
}

const corpusScenarioMap = JSON.parse(
  readFileSync(
    path.join(
      __dirname,
      "fixtures",
      "docx-corpus",
      "docx-corpus.scenarios.json",
    ),
    "utf8",
  ),
) as {
  scenarios: Array<{
    file: string;
    stressArea: string;
    request: string;
  }>;
};

describe("AgentRuntime", () => {
  let dbName: string;

  beforeEach(() => {
    dbName = freshNamespace();
    resetVfs();
    setStaticFiles({});
  });

  afterEach(async () => {
    resetVfs();
    setStaticFiles({});
    // Clean up IndexedDB
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });

  it("getModelsForProvider returns empty array for unknown provider", () => {
    const runtime = new AgentRuntime(createAdapter());
    const models = runtime.getModelsForProvider("nonexistent-provider");
    expect(models).toEqual([]);
    runtime.dispose();
  });

  it("applyConfig sets up agent and updates state", () => {
    const runtime = new AgentRuntime(createAdapter());

    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    const state = runtime.getState();
    expect(state.providerConfig).not.toBeNull();
    expect(state.providerConfig!.provider).toBe("openai");
    expect(state.providerConfig!.model).toBe("gpt-4o-mini");
    expect(state.sessionStats.contextWindow).toBeGreaterThan(0);
    expect(state.error).toBeNull();
    runtime.dispose();
  });

  it("applyConfig with custom provider builds custom model", () => {
    const runtime = new AgentRuntime(createAdapter());

    runtime.applyConfig({
      provider: "custom",
      apiKey: "test-key",
      model: "llama3",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
      apiType: "openai-completions",
      customBaseUrl: "http://localhost:11434",
    });

    const state = runtime.getState();
    expect(state.providerConfig).not.toBeNull();
    expect(state.providerConfig!.provider).toBe("custom");
    expect(state.sessionStats.contextWindow).toBe(128000);
    runtime.dispose();
  });

  it("builds an explicit GPT mutation prompt contract without Claude-only guidance", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();
    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-5",
      useProxy: false,
      proxyUrl: "",
      thinking: "medium",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(runtime);
    const request = "Rewrite the introduction and preserve formatting.";
    internals.taskTracker.beginTask(request, inferTaskClassification(request), {
      mode: "execute",
    });
    internals.update({
      mode: "execute",
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });

    const prompt = await (runtime as any).buildPromptContent(request);

    expect(prompt).toContain("<prompt_contract");
    expect(prompt).toContain("<active_doctrine");
    expect(prompt).toContain('provider_family="gpt"');
    expect(prompt).toContain('phase="mutation"');
    expect(prompt).toContain('<skill id="gpt-prompt-architect"');
    expect(prompt).toContain(
      'canonical_path="skills/word-mastery-v3/SKILL.md"',
    );
    expect(prompt).toContain("Scope discipline matters");
    expect(prompt).toContain("one bounded Word write");
    expect(prompt).toContain("Use named styles for every recurring element.");
    expect(prompt).not.toContain("Use XML-tagged sections");
    runtime.dispose();
  });

  it("preserves prompt contracts and active doctrine when document metadata is present", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
        getDocumentMetadata: async () => ({
          metadata: { title: "Draft", paragraphCount: 4 },
        }),
      }),
    );
    await runtime.init();
    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-5",
      useProxy: false,
      proxyUrl: "",
      thinking: "medium",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(runtime);
    const request = "Rewrite the introduction and preserve formatting.";
    internals.taskTracker.beginTask(request, inferTaskClassification(request), {
      mode: "execute",
    });
    internals.update({
      mode: "execute",
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });

    const prompt = await (runtime as any).buildPromptContent(request);

    expect(prompt).toContain("<prompt_contract");
    expect(prompt).toContain("<active_doctrine");
    expect(prompt).toContain("<doc_context>");
    expect(prompt).toContain('"title": "Draft"');
    expect(runtime.getState().promptProvenance).toMatchObject({
      providerFamily: "gpt",
      provider: "openai",
      model: "gpt-5",
      apiType: "default",
      phase: "mutation",
      runtimeNotes: [],
    });
    expect(
      runtime
        .getState()
        .promptProvenance?.contributors.map((contributor) => contributor.kind),
    ).toEqual([
      "system_prompt",
      "prompt_contract",
      "local_doctrine",
      "document_metadata",
      "user_request",
    ]);
    expect(
      runtime
        .getState()
        .promptProvenance?.contributors.find(
          (contributor) => contributor.kind === "local_doctrine",
        ),
    ).toMatchObject({
      summary: "gpt-prompt-architect, word-mastery-v3, openword-best-practices",
    });
    runtime.dispose();
  });

  it("builds a reviewer/live-review prompt contract without mutation guidance", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();
    runtime.applyConfig({
      provider: "anthropic",
      apiKey: "sk-test",
      model: "claude-sonnet-4-5",
      useProxy: false,
      proxyUrl: "",
      thinking: "high",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(runtime);
    const request =
      "Live reviewer check for task M08 in Hybrid Word. Stay read-only and capture evidence only.";
    internals.taskTracker.beginTask(request, inferTaskClassification(request), {
      mode: "execute",
    });
    internals.update({
      mode: "execute",
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });

    const prompt = await (runtime as any).buildPromptContent(request);

    expect(prompt).toContain("<prompt_contract");
    expect(prompt).toContain('provider_family="claude"');
    expect(prompt).toContain('phase="reviewer_live_review"');
    expect(prompt).toContain("Use XML-tagged sections");
    expect(prompt).toContain("Stay read-only");
    expect(prompt).not.toContain("one bounded Word write");
    runtime.dispose();
  });

  it("treats low-risk formatting edits as mutation-phase Word runs even without rewrite keywords", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();
    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-5",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(runtime);
    const request = "Make the title bold and center it.";
    internals.taskTracker.beginTask(request, inferTaskClassification(request), {
      mode: "discuss",
    });
    internals.update({
      mode: "discuss",
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });

    const prompt = await (runtime as any).buildPromptContent(request);

    expect(prompt).toContain('phase="mutation"');
    expect(prompt).toContain("<active_doctrine");
    expect(prompt).toContain("one bounded Word write");
    runtime.dispose();
  });

  it("keeps read-only formatting inspection requests out of mutation-phase prompt framing", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();
    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-5",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(runtime);
    const request =
      "Check whether the title is bold and centered. Keep this read-only.";
    internals.taskTracker.beginTask(request, inferTaskClassification(request), {
      mode: "discuss",
    });
    internals.update({
      mode: "discuss",
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });

    const prompt = await (runtime as any).buildPromptContent(request);

    expect(prompt).toContain('phase="discuss"');
    expect(prompt).not.toContain("<active_doctrine");
    expect(prompt).not.toContain("one bounded Word write");
    runtime.dispose();
  });

  it("builds blocked and resume prompt contracts without leaking reviewer guidance", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();
    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(runtime);
    const request = "Rewrite the selected paragraph and preserve formatting.";
    internals.taskTracker.beginTask(request, inferTaskClassification(request), {
      mode: "execute",
    });
    internals.update({
      mode: "blocked",
      handoff: {
        taskId: "task-1",
        mode: "blocked",
        currentIntent: request,
        summary: "Blocked pending reread.",
        constraints: ["Preserve formatting."],
        incompleteVerifications: [],
        nextRecommendedAction: "Reread the edited paragraph.",
        updatedAt: Date.now(),
      } as any,
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });

    const blockedPrompt = await (runtime as any).buildPromptContent(request);
    expect(blockedPrompt).toContain('phase="blocked"');
    expect(blockedPrompt).toContain(
      "Do not continue broad exploration or new writes",
    );
    expect(blockedPrompt).not.toContain("Stay read-only");

    (internals.taskTracker.getCurrentTask() as any).resumeCount = 1;
    internals.update({
      mode: "execute",
      handoff: null,
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });

    const resumePrompt = await (runtime as any).buildPromptContent(request);
    expect(resumePrompt).toContain('phase="resume"');
    expect(resumePrompt).toContain("Resume from the recorded blocker");
    expect(resumePrompt).not.toContain("Stay read-only");
    runtime.dispose();
  });

  it("records ordered prompt provenance including plan, context budget, and runtime notes", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();
    runtime.applyConfig({
      provider: "anthropic",
      apiKey: "sk-test",
      model: "claude-sonnet-4-5",
      useProxy: false,
      proxyUrl: "",
      thinking: "high",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(runtime);
    const request = "Rewrite the selected paragraph and preserve formatting.";
    internals.taskTracker.beginTask(request, inferTaskClassification(request), {
      mode: "execute",
    });
    internals.planManager.replacePlan(createPlan());
    internals.hookRegistry.addPromptNotes([
      {
        level: "warning",
        text: "Reread the edited paragraph before reporting completion.",
        source: { hookName: "word-reread-guard" },
      },
    ]);
    internals.update({
      mode: "execute",
      activePlan: createPlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
      sessionStats: {
        ...runtime.getState().sessionStats,
        contextWindow: 1000,
        lastInputTokens: 600,
      },
    });

    await (runtime as any).buildPromptContent(request);
    const provenance = runtime.getState().promptProvenance;

    expect(provenance).toMatchObject({
      providerFamily: "claude",
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      phase: "mutation",
      runtimeNotes: [
        "Reread the edited paragraph before reporting completion.",
      ],
    });
    expect(
      provenance?.contributors.map((contributor) => contributor.kind),
    ).toEqual([
      "system_prompt",
      "prompt_contract",
      "local_doctrine",
      "plan",
      "context_budget",
      "hook_notes",
      "user_request",
    ]);
    expect(
      provenance?.contributors.find(
        (contributor) => contributor.kind === "context_budget",
      ),
    ).toMatchObject({
      summary: "summarize at 60% context usage",
    });
    expect(runtime.getRuntimeStateSlice().promptProvenance).toMatchObject({
      providerFamily: "claude",
      phase: "mutation",
      contributorCount: 7,
      runtimeNotes: [
        "Reread the edited paragraph before reporting completion.",
      ],
      doctrineIds: [
        "prompt-architect",
        "word-mastery-v3",
        "openword-best-practices",
      ],
    });
    runtime.dispose();
  });

  it("sendMessage errors when no config", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.sendMessage("hello");
    const state = runtime.getState();
    expect(state.error).toContain("API key");
    runtime.dispose();
  });

  it("clearMessages resets state", async () => {
    const runtime = new AgentRuntime(createAdapter());

    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    await runtime.clearMessages();
    const state = runtime.getState();
    expect(state.messages).toEqual([]);
    expect(state.error).toBeNull();
    expect(state.uploads).toEqual([]);
    expect(state.sessionStats.contextWindow).toBeGreaterThan(0);
    runtime.dispose();
  });

  it("toggleFollowMode flips followMode", () => {
    const runtime = new AgentRuntime(createAdapter());

    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    expect(runtime.getState().providerConfig!.followMode).toBe(true);
    runtime.toggleFollowMode();
    expect(runtime.getState().providerConfig!.followMode).toBe(false);
    runtime.toggleFollowMode();
    expect(runtime.getState().providerConfig!.followMode).toBe(true);
    runtime.dispose();
  });

  it("toggleExpandToolCalls flips expandToolCalls", () => {
    const runtime = new AgentRuntime(createAdapter());

    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    expect(runtime.getState().providerConfig!.expandToolCalls).toBe(false);
    runtime.toggleExpandToolCalls();
    expect(runtime.getState().providerConfig!.expandToolCalls).toBe(true);
    runtime.dispose();
  });

  it("setPermissionMode persists the runtime permission mode into config", () => {
    const runtime = new AgentRuntime(createAdapter());

    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    runtime.setPermissionMode("full_auto");

    const state = runtime.getState();
    expect(state.permissionMode).toBe("full_auto");
    expect(state.providerConfig?.permissionMode).toBe("full_auto");
    runtime.dispose();
  });

  it("init exposes instruction sources and a root thread for the active host", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "powerpoint",
        getDocumentMetadata: async () => ({
          metadata: { title: "Deck", slideCount: 3 },
        }),
      }),
    );

    await runtime.init();

    const state = runtime.getState();
    expect(state.instructionSources.map((source) => source.kind)).toEqual(
      expect.arrayContaining([
        "app_global",
        "host_specific",
        "document_memory",
        "session_memory",
      ]),
    );
    expect(state.threads).toHaveLength(1);
    expect(state.activeThreadId).toBe(state.threads[0].id);
    runtime.dispose();
  });

  it("separates capability boundary from approval policy and persists both", () => {
    const runtime = new AgentRuntime(createAdapter());

    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    runtime.setCapabilityBoundary("full_host_access");
    runtime.setApprovalPolicy("auto");

    const state = runtime.getState();
    expect(state.capabilityBoundary.mode).toBe("full_host_access");
    expect(state.approvalPolicy.mode).toBe("auto");
    expect(state.providerConfig?.capabilityBoundaryMode).toBe(
      "full_host_access",
    );
    expect(state.providerConfig?.approvalPolicyMode).toBe("auto");
    runtime.dispose();
  });

  it("classifies analysis-only requests as non-mutating risk", () => {
    const classification = inferTaskClassification(
      "Summarize the current document and list the risky clauses.",
    );

    expect(classification.risk).toBe("none");
    expect(classification.needsPlan).toBe(true);
  });

  it("does not require approval for analysis-only work in confirm_writes mode", () => {
    const runtime = new AgentRuntime(createAdapter());
    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
      permissionMode: "confirm_writes",
    });

    const classification = inferTaskClassification(
      "Summarize the current document and list the risky clauses.",
    );
    const riskEstimate = (
      runtime as unknown as {
        applyApprovalPolicy: (
          classification: ReturnType<typeof inferTaskClassification>,
          riskEstimate: {
            level: "none";
            destructive: false;
            requiresApproval: false;
            reasons: string[];
          },
        ) => {
          requiresApproval: boolean;
        };
      }
    ).applyApprovalPolicy(classification, {
      level: "none",
      destructive: false,
      requiresApproval: false,
      reasons: ["analysis only"],
    });

    expect(riskEstimate.requiresApproval).toBe(false);
    runtime.dispose();
  });

  it("does not block analysis-only work at the read-only capability boundary", () => {
    const runtime = new AgentRuntime(createAdapter());
    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
      permissionMode: "read_only",
    });

    const classification = inferTaskClassification(
      "Summarize the current document and list the risky clauses.",
    );
    const blocked = (
      runtime as unknown as {
        isCapabilityBoundaryBlocked: (
          classification: ReturnType<typeof inferTaskClassification>,
          riskEstimate: { destructive: false },
        ) => boolean;
      }
    ).isCapabilityBoundaryBlocked(classification, {
      destructive: false,
    });

    expect(blocked).toBe(false);
    runtime.dispose();
  });

  it("can fork and compact lightweight task threads", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    const originalThreadId = runtime.getState().activeThreadId;
    const forked = runtime.forkActiveThread("Alternative approach");
    expect(forked).not.toBeNull();
    expect(runtime.getState().activeThreadId).toBe(forked?.id);

    const compacted = runtime.compactThread(originalThreadId!);
    expect(compacted?.status).toBe("compacted");
    expect(runtime.getState().compactionState?.artifactCount).toBe(1);
    runtime.dispose();
  });

  it("clears session-local policy traces when starting a new session", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    (
      runtime as unknown as {
        appendPolicyTrace: (entry: {
          event: "policy_check";
          outcome: "approval_required";
          reason: string;
        }) => void;
      }
    ).appendPolicyTrace({
      event: "policy_check",
      outcome: "approval_required",
      reason: "test trace",
    });

    expect(runtime.getState().policyTrace).toHaveLength(1);
    await runtime.newSession();
    expect(runtime.getState().policyTrace).toEqual([]);
    runtime.dispose();
  });

  it("does not carry stale task metadata into a brand-new session root thread", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    (
      runtime as unknown as {
        update: (partial: Partial<RuntimeState>) => void;
      }
    ).update({
      activeTask: {
        id: "task-old",
        userRequest: "Old task",
        status: "in_progress",
        toolCallIds: [],
        createdAt: 1,
        updatedAt: 1,
      },
      activePlan: {
        id: "plan-old",
        userRequest: "Old plan",
        mode: "auto",
        status: "active",
        requirements: [],
        strategy: [],
        executionUnits: [],
        verification: [],
        milestones: [
          {
            id: "milestone-old",
            title: "Old milestone",
            stepIds: [],
            status: "pending",
          },
        ],
        approvalRequired: false,
        expectedEffects: [],
        steps: [],
        createdAt: 1,
        updatedAt: 1,
        classification: {
          complexity: "simple",
          risk: "low",
          needsPlan: false,
          rationale: "test",
        },
        revisionNotes: [],
      },
    });

    await runtime.newSession();

    expect(runtime.getState().threads[0]?.rootTaskId).toBeNull();
    expect(runtime.getState().threads[0]?.milestoneIds).toEqual([]);
    runtime.dispose();
  });

  it("preserves approval request details when switching sessions", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    const firstSessionId = runtime.getState().currentSession!.id;
    const tracker = (
      runtime as unknown as {
        taskTracker: {
          beginTask: (
            request: string,
            classification: ReturnType<typeof inferTaskClassification>,
            options: Record<string, unknown>,
          ) => unknown;
          persist: (sessionId: string) => Promise<unknown>;
        };
      }
    ).taskTracker;

    tracker.beginTask(
      "Rewrite the selected paragraph.",
      inferTaskClassification("Rewrite the selected paragraph."),
      {
        approvalPending: true,
        approvalRequest: {
          level: "medium",
          destructive: false,
          reason: "Approval required before rewriting content.",
          requestedAt: 123,
          uiMessage: "Approve the rewrite.",
          actionClass: "structural_write",
          scopes: [{ kind: "paragraph", ref: "3" }],
        },
      },
    );
    await tracker.persist(firstSessionId);

    await runtime.newSession();
    const secondSessionId = runtime.getState().currentSession!.id;
    await runtime.switchSession(firstSessionId);

    const restoredApproval = runtime.getState().approvalRequest;
    expect(restoredApproval?.reason).toBe(
      "Approval required before rewriting content.",
    );
    expect(restoredApproval?.destructive).toBe(false);
    expect(restoredApproval?.actionClass).toBe("structural_write");
    expect(restoredApproval?.scopes).toEqual([{ kind: "paragraph", ref: "3" }]);

    await runtime.switchSession(secondSessionId);
    runtime.dispose();
  });

  it("includes fresh hook notes in verification for the current run", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        getVerificationSuites: () => [
          {
            id: "note-suite",
            label: "Note suite",
            appliesTo: () => true,
            verify: (context) => ({
              suiteId: "note-suite",
              label: "Note suite",
              expectedEffect: "Hook notes are visible.",
              observedEffect: context.promptNotes.join(", "),
              status: context.promptNotes.includes("Fresh hook note")
                ? "passed"
                : "retryable",
              evidence: context.promptNotes,
              retryable: !context.promptNotes.includes("Fresh hook note"),
            }),
          },
        ],
      }),
    );
    await runtime.init();

    (
      runtime as unknown as {
        taskTracker: {
          beginTask: (
            request: string,
            classification: ReturnType<typeof inferTaskClassification>,
            options?: Record<string, unknown>,
          ) => unknown;
          recordToolExecution: (execution: {
            toolCallId: string;
            toolName: string;
            isError: boolean;
            resultText: string;
            timestamp: number;
          }) => void;
        };
        hookRegistry: {
          addPromptNotes: (
            notes: Array<{
              text: string;
              level: "info";
              source: { hookName: string };
            }>,
          ) => void;
        };
        syncAdapterVerifiers: (adapter: RuntimeAdapter) => void;
      }
    ).syncAdapterVerifiers(
      createAdapter({
        getVerificationSuites: () => [
          {
            id: "note-suite",
            label: "Note suite",
            appliesTo: () => true,
            verify: (context) => ({
              suiteId: "note-suite",
              label: "Note suite",
              expectedEffect: "Hook notes are visible.",
              observedEffect: context.promptNotes.join(", "),
              status: context.promptNotes.includes("Fresh hook note")
                ? "passed"
                : "retryable",
              evidence: context.promptNotes,
              retryable: !context.promptNotes.includes("Fresh hook note"),
            }),
          },
        ],
      }),
    );

    const internals = runtime as unknown as {
      taskTracker: {
        beginTask: (
          request: string,
          classification: ReturnType<typeof inferTaskClassification>,
          options?: Record<string, unknown>,
        ) => unknown;
        recordToolExecution: (execution: {
          toolCallId: string;
          toolName: string;
          isError: boolean;
          resultText: string;
          timestamp: number;
        }) => void;
      };
      hookRegistry: {
        addPromptNotes: (
          notes: Array<{
            text: string;
            level: "info";
            source: { hookName: string };
          }>,
        ) => void;
      };
    };

    internals.taskTracker.beginTask(
      "Rewrite the selected paragraph.",
      inferTaskClassification("Rewrite the selected paragraph."),
    );
    internals.taskTracker.recordToolExecution({
      toolCallId: "tool-1",
      toolName: "execute_office_js",
      isError: false,
      resultText: '{"success":true}',
      timestamp: Date.now(),
    });
    internals.hookRegistry.addPromptNotes([
      {
        text: "Fresh hook note",
        level: "info",
        source: { hookName: "test-hook" },
      },
    ]);

    const verification = await runtime.runVerificationPhase();
    expect(verification?.status).toBe("passed");
    expect(runtime.getState().lastPromptNotes).toContain("Fresh hook note");
    runtime.dispose();
  });

  it("uses output-adapter fallback text for follow-mode and task tracking", async () => {
    const onToolResultCalls: Array<{
      toolCallId: string;
      resultText: string;
      isError: boolean;
    }> = [];
    const runtime = new AgentRuntime(
      createAdapter({
        onToolResult: (toolCallId, resultText, isError) => {
          onToolResultCalls.push({ toolCallId, resultText, isError });
        },
      }),
    );

    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(runtime);
    internals.taskTracker.beginTask(
      "Compact tool output",
      inferTaskClassification("Compact tool output"),
      { mode: "execute" },
    );

    internals.update({
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          parts: [
            {
              type: "toolCall",
              id: "tc_adapter",
              name: "bash",
              args: { command: "echo hi" },
              status: "running",
            },
          ],
          timestamp: 1,
        },
      ],
    });

    await (runtime as any).handleAgentEvent({
      type: "tool_execution_end",
      toolCallId: "tc_adapter",
      toolName: "bash",
      isError: false,
      result: {
        content: [{ type: "image", data: "abc123", mimeType: "image/png" }],
        details: {
          outputAdapter: {
            text: "Compacted bash summary",
          },
        },
      },
    });

    const state = runtime.getState();
    expect(onToolResultCalls).toEqual([
      {
        toolCallId: "tc_adapter",
        resultText: "Compacted bash summary",
        isError: false,
      },
    ]);
    expect(state.messages[0]?.parts[0]).toMatchObject({
      type: "toolCall",
      result: "Compacted bash summary",
      status: "complete",
    });
    const task = internals.taskTracker.getCurrentTask();
    expect(task?.toolExecutions?.[0]?.resultText).toBe("");
    expect(task?.toolExecutions?.[0]?.resultSummary).toBe(
      "Compacted bash summary",
    );
    runtime.dispose();
  });

  it("prefers output-adapter text over raw text when both are present", async () => {
    const onToolResultCalls: string[] = [];
    const runtime = new AgentRuntime(
      createAdapter({
        onToolResult: (_toolCallId, resultText) => {
          onToolResultCalls.push(resultText);
        },
      }),
    );

    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(runtime);
    internals.taskTracker.beginTask(
      "Compact tool output",
      inferTaskClassification("Compact tool output"),
      { mode: "execute" },
    );
    internals.update({
      messages: [
        {
          id: "assistant-2",
          role: "assistant",
          parts: [
            {
              type: "toolCall",
              id: "tc_adapter_pref",
              name: "bash",
              args: { command: "echo hi" },
              status: "running",
            },
          ],
          timestamp: 1,
        },
      ],
    });

    await (runtime as any).handleAgentEvent({
      type: "tool_execution_end",
      toolCallId: "tc_adapter_pref",
      toolName: "bash",
      isError: false,
      result: {
        content: [{ type: "text", text: "very long raw text body" }],
        details: {
          outputAdapter: {
            text: "Compacted bash summary",
          },
        },
      },
    });

    const task = internals.taskTracker.getCurrentTask();
    expect(onToolResultCalls).toEqual(["Compacted bash summary"]);
    expect(task?.toolExecutions?.[0]?.resultText).toBe("very long raw text body");
    expect(task?.toolExecutions?.[0]?.resultSummary).toBe(
      "Compacted bash summary",
    );
    runtime.dispose();
  });

  it("stores compact tool summaries alongside legacy result text in task history", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    const internals = runtimeInternals(runtime);
    internals.taskTracker.beginTask(
      "Compact tool output",
      inferTaskClassification("Compact tool output"),
      { mode: "execute" },
    );
    internals.update({
      messages: [
        {
          id: "assistant-summary-contract",
          role: "assistant",
          parts: [
            {
              type: "toolCall",
              id: "tc_summary_contract",
              name: "bash",
              args: { command: "cat huge-file.txt" },
              status: "running",
            },
          ],
          timestamp: 1,
        },
      ],
    });

    await (runtime as any).handleAgentEvent({
      type: "tool_execution_end",
      toolCallId: "tc_summary_contract",
      toolName: "bash",
      isError: false,
      result: {
        content: [
          {
            type: "text",
            text: "Very long legacy tool output body that should remain available for compatibility.",
          },
        ],
        details: {
          outputAdapter: {
            text: "Compact bash summary",
          },
        },
      },
    });

    const task = internals.taskTracker.getCurrentTask() as
      | (Record<string, unknown> & {
          toolExecutions?: Array<Record<string, unknown>>;
        })
      | null;

    expect(task?.toolExecutions?.[0]).toMatchObject({
      resultText:
        "Very long legacy tool output body that should remain available for compatibility.",
      resultSummary: "Compact bash summary",
    });

    const sessionId = runtime.getState().currentSession?.id;
    expect(sessionId).toBeTruthy();
    await internals.taskTracker.persist(sessionId!);

    const persisted = await getLatestTaskRecord(sessionId!);
    expect(persisted?.task.toolExecutions?.[0]).toMatchObject({
      resultText:
        "Very long legacy tool output body that should remain available for compatibility.",
      resultSummary: "Compact bash summary",
    });
    runtime.dispose();
  });

  it("prefers execution summaries during verification compaction and falls back to legacy text", () => {
    const runtime = new AgentRuntime(createAdapter());
    const compacted = (
      runtime as unknown as {
        contextManager: {
          compactToolExecutions: (
            executions: Array<Record<string, unknown>>,
            keepLast?: number,
          ) => { kept: Array<Record<string, unknown>>; summary: string[] };
        };
      }
    ).contextManager.compactToolExecutions(
      [
        {
          toolCallId: "tc-summary",
          toolName: "bash",
          isError: false,
          resultText:
            "Legacy bash output that is much longer than the compact summary and should not drive compaction.",
          resultSummary: "Compact bash summary",
          timestamp: 1,
        },
        {
          toolCallId: "tc-fallback",
          toolName: "read",
          isError: false,
          resultText: "Legacy read fallback",
          timestamp: 2,
        },
        {
          toolCallId: "tc-keep",
          toolName: "execute_office_js",
          isError: false,
          resultText: "Latest write remains in kept executions",
          timestamp: 3,
        },
      ] as Array<Record<string, unknown>>,
      1,
    );

    expect(compacted.summary).toEqual([
      "bash: ok (Compact bash summary)",
      "read: ok (Legacy read fallback)",
    ]);
    runtime.dispose();
  });

  it("surfaces retryable verification follow-up as blocked instead of waiting-on-user", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        getVerificationSuites: () => [
          {
            id: "retryable-suite",
            label: "Retryable suite",
            appliesTo: () => true,
            verify: () => ({
              suiteId: "retryable-suite",
              label: "Retryable suite",
              expectedEffect: "Latest write is reread.",
              observedEffect: "Write happened but reread is missing.",
              status: "retryable",
              evidence: ["Missing reread"],
              retryable: true,
            }),
          },
        ],
      }),
    );
    await runtime.init();

    const internals = runtime as unknown as {
      taskTracker: {
        beginTask: (
          request: string,
          classification: ReturnType<typeof inferTaskClassification>,
          options?: Record<string, unknown>,
        ) => unknown;
      };
    };

    internals.taskTracker.beginTask(
      "Rewrite the selected paragraph.",
      inferTaskClassification("Rewrite the selected paragraph."),
      { mode: "execute" },
    );

    const verification = await runtime.runVerificationPhase();
    const slice = runtime.getRuntimeStateSlice();

    expect(verification?.status).toBe("retryable");
    expect(slice.mode).toBe("blocked");
    expect(slice.taskPhase).toBe("blocked");
    expect(slice.waitingState).toBe("retry_exhausted");
    expect(slice.lastVerification).toEqual({
      status: "retryable",
      retryable: true,
    });
    expect(runtime.getState().handoff?.nextRecommendedAction).toContain(
      "retryable verification mismatch",
    );
    runtime.dispose();
  });

  it("keeps degraded retryable verification completions honest after resume attempts are exhausted", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        getVerificationSuites: () => [
          {
            id: "retryable-suite",
            label: "Retryable suite",
            appliesTo: () => true,
            verify: () => ({
              suiteId: "retryable-suite",
              label: "Retryable suite",
              expectedEffect: "Latest write is reread.",
              observedEffect: "Write happened but reread is missing.",
              status: "retryable",
              evidence: ["Missing reread"],
              retryable: true,
            }),
          },
        ],
      }),
    );
    await runtime.init();

    const internals = runtime as unknown as {
      taskTracker: {
        beginTask: (
          request: string,
          classification: ReturnType<typeof inferTaskClassification>,
          options?: Record<string, unknown>,
        ) => unknown;
        getCurrentTask: () => Record<string, unknown> | null;
      };
    };

    internals.taskTracker.beginTask(
      "Rewrite the selected paragraph.",
      inferTaskClassification("Rewrite the selected paragraph."),
      { mode: "execute" },
    );
    (internals.taskTracker.getCurrentTask() as any).resumeCount = 2;

    const verification = await runtime.runVerificationPhase();
    const slice = runtime.getRuntimeStateSlice();

    expect(verification?.status).toBe("retryable");
    expect(slice.mode).toBe("completed");
    expect(slice.taskPhase).toBe("completed");
    expect(slice.waitingState).toBeNull();
    expect(slice.lastVerification).toEqual({
      status: "retryable",
      retryable: true,
    });
    expect(runtime.getState().degradedGuardrails).toContain(
      "Verification failed after 2 resume attempts; completing with degraded guardrails.",
    );
    runtime.dispose();
  });

  it("does not persist a completed durable task status when verification blocks completion", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        getVerificationSuites: () => [
          {
            id: "retryable-suite",
            label: "Retryable suite",
            appliesTo: () => true,
            verify: () => ({
              suiteId: "retryable-suite",
              label: "Retryable suite",
              expectedEffect: "Latest write is reread.",
              observedEffect: "Write happened but reread is missing.",
              status: "retryable",
              evidence: ["Missing reread"],
              retryable: true,
            }),
          },
        ],
      }),
    );
    await runtime.init();

    const internals = runtime as unknown as {
      taskTracker: {
        beginTask: (
          request: string,
          classification: ReturnType<typeof inferTaskClassification>,
          options?: Record<string, unknown>,
        ) => unknown;
      };
      onStreamingEnd: () => Promise<void>;
    };

    internals.taskTracker.beginTask(
      "Rewrite the selected paragraph.",
      inferTaskClassification("Rewrite the selected paragraph."),
      { mode: "execute" },
    );

    await internals.onStreamingEnd();

    const persisted = await getLatestTaskRecord(
      runtime.getState().currentSession!.id,
    );
    expect(persisted?.task.status).not.toBe("completed");
    runtime.dispose();
  });

  it("keeps corpus-derived review, structure, and formatting requests out of mutation gating when they are analysis-only", () => {
    const requests = corpusScenarioMap.scenarios
      .filter((scenario) =>
        ["review-heavy", "structure-heavy", "formatting-heavy"].includes(
          scenario.stressArea,
        ),
      )
      .map(
        (scenario) =>
          `Inspect ${scenario.file} and summarize risks without changing the document.`,
      );

    for (const request of requests) {
      const classification = inferTaskClassification(request);
      expect(classification.risk).toBe("none");
    }
  });

  it("uploadFiles adds files and updates state", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    await runtime.uploadFiles([
      {
        name: "data.csv",
        size: 100,
        data: new TextEncoder().encode("a,b\n1,2"),
      },
    ]);

    const state = runtime.getState();
    expect(state.uploads).toHaveLength(1);
    expect(state.uploads[0].name).toBe("data.csv");
    expect(state.isUploading).toBe(false);
    runtime.dispose();
  });

  it("removeUpload removes a file from state", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    await runtime.uploadFiles([
      {
        name: "temp.txt",
        size: 10,
        data: new TextEncoder().encode("temp"),
      },
    ]);
    expect(runtime.getState().uploads).toHaveLength(1);

    await runtime.removeUpload("temp.txt");
    expect(runtime.getState().uploads).toHaveLength(0);
    runtime.dispose();
  });

  it("persists awaiting-approval tasks before returning from sendMessage", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();
    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(
      runtime,
    ) as typeof runtimeInternals extends (runtime: AgentRuntime) => infer R
      ? R & {
          buildHandoff: (
            task: Record<string, unknown>,
            resumeMessage: string,
          ) => Promise<Record<string, unknown>>;
        }
      : never;

    const classification = inferTaskClassification("Rewrite the introduction");
    internals.taskClassifier.classify = async () => classification;
    internals.estimateScopeRisk = async () => ({
      level: "high",
      destructive: false,
      requiresApproval: true,
      reasons: ["Approval required"],
      scopeSummary: "document scope",
      constraints: ["Preserve formatting."],
      expectedEffects: ["Content changes only in requested scope."],
    });
    internals.buildHandoff = async (task, resumeMessage) => ({
      kind: "approval",
      resumeMessage,
      taskId: String(task.id),
    });

    await runtime.sendMessage("Rewrite the introduction");

    const currentSession = runtime.getState().currentSession;
    expect(currentSession).not.toBeNull();

    const [taskRecord, vfsFiles, threads] = await Promise.all([
      getLatestTaskRecord(currentSession!.id),
      loadVfsFiles(currentSession!.id),
      listThreadSummaries(currentSession!.id),
    ]);

    expect(taskRecord?.task.approvalPending).toBe(true);
    expect(taskRecord?.task.mode).toBe("awaiting_approval");
    expect(
      vfsFiles.some((file) => file.path === "/.oa/context/requirements.json"),
    ).toBe(true);
    expect(threads.length).toBeGreaterThan(0);
    runtime.dispose();
  });

  it("init loads session and skills", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    const state = runtime.getState();
    expect(state.currentSession).not.toBeNull();
    expect(state.currentSession!.workbookId).toBe("test-doc-1");
    expect(Array.isArray(state.skills)).toBe(true);
    runtime.dispose();
  });

  it("init is idempotent", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();
    const session1 = runtime.getState().currentSession;
    await runtime.init();
    const session2 = runtime.getState().currentSession;
    expect(session1!.id).toBe(session2!.id);
    runtime.dispose();
  });

  it("newSession creates a fresh session", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();
    runtime.applyConfig({
      provider: "custom",
      apiKey: "test-key",
      model: "llama3",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
      apiType: "openai-completions",
      customBaseUrl: "http://localhost:11434",
      customContextWindow: 256000,
    });

    const firstSession = runtime.getState().currentSession!.id;
    await runtime.newSession();
    const secondSession = runtime.getState().currentSession!.id;

    expect(firstSession).not.toBe(secondSession);
    expect(runtime.getState().messages).toEqual([]);
    expect(runtime.getState().sessionStats.contextWindow).toBe(256000);
    runtime.dispose();
  });

  it("switchSession restores a previous session", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    const firstId = runtime.getState().currentSession!.id;
    await runtime.newSession();
    const secondId = runtime.getState().currentSession!.id;

    await runtime.switchSession(firstId);
    expect(runtime.getState().currentSession!.id).toBe(firstId);

    await runtime.switchSession(secondId);
    expect(runtime.getState().currentSession!.id).toBe(secondId);
    runtime.dispose();
  });

  it("switchSession preserves compact tool summaries when rehydrating tool results", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    const firstId = runtime.getState().currentSession!.id;
    await saveSession(firstId, [
      {
        role: "assistant",
        content: [
          {
            type: "tool-call",
            id: "tc-rehydrate",
            name: "bash",
            arguments: { command: "echo hi" },
          },
        ],
        timestamp: 1,
        stopReason: "tool-calls",
        api: "openai-responses",
        provider: "openai",
        model: "gpt-4o-mini",
        usage: {
          input: 1,
          output: 1,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 2,
          cost: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            total: 0,
          },
        },
      } as any,
      {
        role: "toolResult",
        toolCallId: "tc-rehydrate",
        content: [{ type: "text", text: "very long raw text body" }],
        details: {
          outputAdapter: {
            text: "Compacted bash summary",
          },
        },
        isError: false,
        timestamp: 2,
      } as any,
    ]);

    await runtime.newSession();
    const secondId = runtime.getState().currentSession!.id;

    await runtime.switchSession(firstId);
    expect(runtime.getState().currentSession!.id).toBe(firstId);
    expect(runtime.getState().messages[0]?.parts[0]).toMatchObject({
      type: "toolCall",
      result: "Compacted bash summary",
      status: "complete",
    });

    await runtime.switchSession(secondId);
    runtime.dispose();
  });

  it("deleteCurrentSession switches to another session", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    await runtime.newSession();

    await runtime.deleteCurrentSession();
    // Should have switched to a different (or new) session
    expect(runtime.getState().currentSession).not.toBeNull();
    runtime.dispose();
  });

  it("emits state to subscribers on update", async () => {
    const runtime = new AgentRuntime(createAdapter());
    const states: RuntimeState[] = [];
    const unsub = runtime.subscribe((s) => states.push(s));

    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    expect(states.length).toBeGreaterThan(0);
    expect(states[states.length - 1].providerConfig).not.toBeNull();

    unsub();
    runtime.dispose();
  });

  it("derives waiting state from blocked handoffs even without approval requests", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    const internals = runtimeInternals(runtime);
    internals.update({
      mode: "blocked",
      approvalRequest: null,
      handoff: {
        taskId: "task-blocked",
        mode: "blocked",
        currentIntent: "Rewrite the introduction",
        summary: "Verification follow-up is blocked on a missing reread.",
        constraints: [],
        incompleteVerifications: ["word:write-progress"],
        nextRecommendedAction: "Resume after rereading the edited paragraph.",
        updatedAt: 123,
      } as any,
    });

    expect(runtime.getState().waitingState).toEqual(
      expect.objectContaining({
        kind: "retry_exhausted",
        reason: "Verification follow-up is blocked on a missing reread.",
        resumeMessage: "Resume after rereading the edited paragraph.",
      }),
    );
    runtime.dispose();
  });

  it("emits bridge lifecycle events for plan, approval, blocker, and verification changes", async () => {
    const events: string[] = [];
    const runtime = new AgentRuntime(
      createAdapter({
        bridgeEventSink: (event) => {
          events.push(event);
        },
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    internals.update({
      mode: "blocked",
      activePlan: createPlan({ id: "plan-events" }) as any,
      approvalRequest: {
        level: "high",
        destructive: false,
        reason: "Approval required",
        requestedAt: 10,
      } as any,
      handoff: {
        taskId: "task-events",
        mode: "blocked",
        currentIntent: "Rewrite the introduction",
        summary: "Task is blocked pending verification follow-up.",
        constraints: [],
        incompleteVerifications: ["word:write-progress"],
        nextRecommendedAction: "Resume after rereading the edited paragraph.",
        updatedAt: 20,
      } as any,
      lastVerification: {
        status: "retryable",
        retryable: true,
        results: [],
      },
    });

    expect(events).toEqual(
      expect.arrayContaining([
        "state:plan_changed",
        "state:approval_changed",
        "state:blocker_changed",
        "state:verification_changed",
      ]),
    );
    runtime.dispose();
  });

  it("uploadFiles replaces existing upload with same name", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    await runtime.uploadFiles([
      { name: "file.txt", size: 10, data: new TextEncoder().encode("v1") },
    ]);
    await runtime.uploadFiles([
      { name: "file.txt", size: 20, data: new TextEncoder().encode("v2") },
    ]);

    const state = runtime.getState();
    expect(state.uploads).toHaveLength(1);
    expect(state.uploads[0].size).toBe(20);
    runtime.dispose();
  });

  it("uses same-run steering recovery before blocking a Word mutation task that keeps reading without a write", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the whole document and fix formatting issues.",
    );
    internals.planManager.replacePlan(
      createPlan({
        userRequest: "Rewrite the whole document and fix formatting issues.",
        classification,
        approvalRequired: false,
      }),
    );
    internals.taskTracker.beginTask(
      "Rewrite the whole document and fix formatting issues.",
      classification,
      {
        mode: "execute",
        constraints: ["Preserve formatting."],
        expectedEffects: ["Write and reread the affected scope."],
      },
    );
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-1",
      toolName: "get_document_structure",
      isError: false,
      resultText: "ok",
      timestamp: 1,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-2",
      toolName: "get_document_text",
      isError: false,
      resultText: "ok",
      timestamp: 2,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-3",
      toolName: "get_ooxml",
      isError: false,
      resultText: "ok",
      timestamp: 3,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-4",
      toolName: "get_document_text",
      isError: false,
      resultText: "ok",
      timestamp: 4,
    });
    internals.update({
      isStreaming: true,
      mode: "execute",
      lastPromptNotes: [
        "Large range detected; work from a bounded working set.",
      ],
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });
    const promptCalls: string[] = [];
    (runtime as any).agent = {
      state: { messages: [] },
      prompt: async (promptContent: string) => {
        promptCalls.push(promptContent);
      },
      abort: () => {},
    };
    (runtime as any).isStreaming = true;

    const interrupted = await internals.maybeInterruptNoWriteLoop();
    await (runtime as any).handleAgentEvent({ type: "agent_end" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const state = runtime.getState();

    expect(interrupted).toBe(true);
    expect(state.mode).toBe("execute");
    expect(state.handoff).toBeNull();
    expect(state.activeTask?.executionDiagnostics?.noWriteLoopDetected).toBe(
      true,
    );
    expect(
      state.activeTask?.executionDiagnostics?.noWriteRecoveryAttemptCount,
    ).toBe(1);
    expect(
      state.activeTask?.executionDiagnostics?.noWriteRecoveryBudgetRemaining,
    ).toBe(0);
    expect(promptCalls).toHaveLength(1);
    expect(promptCalls[0]).toContain(
      "Inspection budget exhausted before first write",
    );
    expect(promptCalls[0]).toContain(
      "Perform exactly one bounded Word write now and reread that same scope immediately.",
    );
    expect(
      state.lastPromptNotes.some((note) =>
        note.includes(
          "Perform exactly one bounded Word write now and reread that same scope immediately.",
        ),
      ),
    ).toBe(true);
    runtime.dispose();
  });

  it("blocks a Word mutation task after the no-write recovery budget is exhausted", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the whole document and fix formatting issues.",
    );
    internals.planManager.replacePlan(
      createPlan({
        userRequest: "Rewrite the whole document and fix formatting issues.",
        classification,
        approvalRequired: false,
      }),
    );
    internals.taskTracker.beginTask(
      "Rewrite the whole document and fix formatting issues.",
      classification,
      {
        mode: "execute",
        constraints: ["Preserve formatting."],
        expectedEffects: ["Write and reread the affected scope."],
      },
    );
    (internals.taskTracker.getCurrentTask() as any).noWriteRecoveryCount = 1;
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-1",
      toolName: "get_document_structure",
      isError: false,
      resultText: "ok",
      timestamp: 1,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-2",
      toolName: "get_document_text",
      isError: false,
      resultText: "ok",
      timestamp: 2,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-3",
      toolName: "get_ooxml",
      isError: false,
      resultText: "ok",
      timestamp: 3,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-4",
      toolName: "get_document_text",
      isError: false,
      resultText: "ok",
      timestamp: 4,
    });
    internals.update({
      isStreaming: true,
      mode: "execute",
      lastPromptNotes: [
        "Large range detected; work from a bounded working set.",
      ],
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });
    (runtime as any).isStreaming = true;

    const interrupted = await internals.maybeInterruptNoWriteLoop();
    const state = runtime.getState();

    expect(interrupted).toBe(true);
    expect(state.mode).toBe("blocked");
    expect(state.handoff?.nextRecommendedAction).toContain(
      "Inspection budget exhausted before first write",
    );
    expect(state.handoff?.nextRecommendedAction).toContain(
      "Recovery budget exhausted after 1 same-run recovery attempt.",
    );
    expect(
      state.activeTask?.executionDiagnostics?.noWriteRecoveryAttemptCount,
    ).toBe(1);
    expect(
      state.activeTask?.executionDiagnostics?.noWriteRecoveryBudgetRemaining,
    ).toBe(0);
    runtime.dispose();
  });

  it("surfaces exhausted Word no-write stalls as blocked instead of waiting-on-user", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the whole document and fix formatting issues.",
    );
    internals.planManager.replacePlan(
      createPlan({
        userRequest: "Rewrite the whole document and fix formatting issues.",
        classification,
        approvalRequired: false,
      }),
    );
    internals.taskTracker.beginTask(
      "Rewrite the whole document and fix formatting issues.",
      classification,
      {
        mode: "execute",
        constraints: ["Preserve formatting."],
        expectedEffects: ["Write and reread the affected scope."],
      },
    );
    (internals.taskTracker.getCurrentTask() as any).noWriteRecoveryCount = 1;
    for (const [index, toolName] of [
      "get_document_structure",
      "get_document_text",
      "get_ooxml",
      "get_document_text",
    ].entries()) {
      internals.taskTracker.recordToolExecution({
        toolCallId: `tc-${index + 1}`,
        toolName,
        isError: false,
        resultText: "ok",
        timestamp: index + 1,
      });
    }
    internals.update({
      isStreaming: true,
      mode: "execute",
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });
    (runtime as any).isStreaming = true;

    const interrupted = await internals.maybeInterruptNoWriteLoop();
    const slice = runtime.getRuntimeStateSlice();

    expect(interrupted).toBe(true);
    expect(slice.mode).toBe("blocked");
    expect(slice.taskPhase).toBe("blocked");
    expect(slice.waitingState).toBe("retry_exhausted");
    runtime.dispose();
  });

  it("clears blocked handoff presentation and re-enters execution on resume", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the whole document and fix formatting issues.",
    );
    internals.planManager.replacePlan(
      createPlan({
        userRequest: "Rewrite the whole document and fix formatting issues.",
        classification,
        approvalRequired: false,
      }),
    );
    internals.taskTracker.beginTask(
      "Rewrite the whole document and fix formatting issues.",
      classification,
      {
        mode: "execute",
        constraints: ["Preserve formatting."],
        expectedEffects: ["Write and reread the affected scope."],
      },
    );
    (internals.taskTracker.getCurrentTask() as any).noWriteRecoveryCount = 1;
    for (const [index, toolName] of [
      "get_document_structure",
      "get_document_text",
      "get_ooxml",
      "get_document_text",
    ].entries()) {
      internals.taskTracker.recordToolExecution({
        toolCallId: `tc-${index + 1}`,
        toolName,
        isError: false,
        resultText: "ok",
        timestamp: index + 1,
      });
    }
    internals.update({
      isStreaming: true,
      mode: "execute",
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });
    (runtime as any).isStreaming = true;

    await internals.maybeInterruptNoWriteLoop();
    (runtime as any).agent = {
      prompt: async () => undefined,
      abort: () => undefined,
    };

    await runtime.resumeFromHandoff();

    const state = runtime.getState();
    const slice = runtime.getRuntimeStateSlice();
    expect(state.handoff).toBeNull();
    expect(slice.mode).toBe("execute");
    expect(slice.taskPhase).toBe("execute");
    expect(slice.waitingState).toBeNull();
    expect(state.isStreaming).toBe(true);
    runtime.dispose();
  });

  it("does not collapse failed Word writes into a no-write inspection loop", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the introduction and preserve formatting.",
    );
    internals.planManager.replacePlan(
      buildDefaultPlan(
        "Rewrite the introduction and preserve formatting.",
        classification,
      ),
    );
    internals.taskTracker.beginTask(
      "Rewrite the introduction and preserve formatting.",
      classification,
      {
        mode: "execute",
      },
    );
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-1",
      toolName: "get_document_text",
      isError: false,
      resultText: "ok",
      timestamp: 1,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-2",
      toolName: "execute_office_js",
      isError: true,
      resultText: '{"error":"Selection became invalid"}',
      timestamp: 2,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-3",
      toolName: "get_document_text",
      isError: false,
      resultText: "ok",
      timestamp: 3,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-4",
      toolName: "get_document_text",
      isError: false,
      resultText: "ok",
      timestamp: 4,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-5",
      toolName: "get_ooxml",
      isError: false,
      resultText: "ok",
      timestamp: 5,
    });
    internals.update({
      isStreaming: true,
      mode: "execute",
      lastPromptNotes: ["Preserve formatting after the edit."],
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });
    (runtime as any).isStreaming = true;

    const interrupted = await internals.maybeInterruptNoWriteLoop();
    const state = runtime.getState();

    expect(interrupted).toBe(false);
    expect(state.mode).toBe("execute");
    expect(state.activeTask?.executionDiagnostics?.failedWriteCount).toBe(1);
    expect(
      state.activeTask?.executionDiagnostics?.noWriteLoopDetected,
    ).not.toBe(true);
    runtime.dispose();
  });

  it("does not block once a Word mutation task has already written and reread", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the introduction and preserve formatting.",
    );
    internals.planManager.replacePlan(
      buildDefaultPlan(
        "Rewrite the introduction and preserve formatting.",
        classification,
      ),
    );
    internals.taskTracker.beginTask(
      "Rewrite the introduction and preserve formatting.",
      classification,
      {
        mode: "execute",
      },
    );
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-1",
      toolName: "get_document_text",
      isError: false,
      resultText: "ok",
      timestamp: 1,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-2",
      toolName: "execute_office_js",
      isError: false,
      resultText: "ok",
      timestamp: 2,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-3",
      toolName: "get_document_text",
      isError: false,
      resultText: "ok",
      timestamp: 3,
    });
    internals.update({
      isStreaming: true,
      mode: "execute",
      lastPromptNotes: ["Preserve formatting after the edit."],
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
    });
    (runtime as any).isStreaming = true;

    const interrupted = await internals.maybeInterruptNoWriteLoop();
    const state = runtime.getState();

    expect(interrupted).toBe(false);
    expect(state.mode).toBe("execute");
    expect(state.activeTask?.executionDiagnostics?.firstWriteAt).toBe(2);
    runtime.dispose();
  });

  it("advances plan steps from inspection to write and verify based on real tool activity", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the introduction and preserve formatting.",
    );
    internals.planManager.replacePlan(
      buildDefaultPlan(
        "Rewrite the introduction and preserve formatting.",
        classification,
      ),
    );
    internals.taskTracker.beginTask(
      "Rewrite the introduction and preserve formatting.",
      classification,
      {
        mode: "execute",
      },
    );

    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-1",
      toolName: "get_document_text",
      isError: false,
      resultText: "ok",
      timestamp: 1,
    });
    internals.taskTracker.setExecutionDiagnostics(
      internals.deriveExecutionDiagnostics(
        internals.taskTracker.getCurrentTask() as any,
      ) as any,
    );
    internals.planManager.syncWithExecution(
      internals.taskTracker.getCurrentTask() as any,
    );
    internals.update({
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
      mode: "execute",
    });

    let plan = runtime.getState().activePlan;
    expect(plan?.steps.map((step) => step.status)).toEqual([
      "completed",
      "active",
      "pending",
      "pending",
    ]);
    expect(
      runtime.getRuntimeStateSlice().activePlanSummary?.activeStepIndex,
    ).toBe(1);

    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-2",
      toolName: "execute_office_js",
      isError: false,
      resultText: "ok",
      timestamp: 2,
    });
    internals.taskTracker.setExecutionDiagnostics(
      internals.deriveExecutionDiagnostics(
        internals.taskTracker.getCurrentTask() as any,
      ) as any,
    );
    internals.planManager.syncWithExecution(
      internals.taskTracker.getCurrentTask() as any,
    );
    internals.update({
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
      mode: "execute",
    });

    plan = runtime.getState().activePlan;
    expect(plan?.steps.map((step) => step.status)).toEqual([
      "completed",
      "completed",
      "completed",
      "active",
    ]);
    expect(
      runtime.getRuntimeStateSlice().activePlanSummary?.activeStepIndex,
    ).toBe(2);

    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-3",
      toolName: "get_document_text",
      isError: false,
      resultText: "ok",
      timestamp: 3,
    });
    internals.taskTracker.setExecutionDiagnostics(
      internals.deriveExecutionDiagnostics(
        internals.taskTracker.getCurrentTask() as any,
      ) as any,
    );
    internals.planManager.syncWithExecution(
      internals.taskTracker.getCurrentTask() as any,
    );
    internals.update({
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
      mode: "verify",
    });

    plan = runtime.getState().activePlan;
    expect(plan?.steps.map((step) => step.status)).toEqual([
      "completed",
      "completed",
      "completed",
      "completed",
    ]);
    expect(
      runtime.getRuntimeStateSlice().activePlanSummary?.activeStepIndex,
    ).toBe(3);
    runtime.dispose();
  });

  it("anchors reread progress to the latest successful Word write", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the introduction and preserve formatting.",
    );
    internals.planManager.replacePlan(
      buildDefaultPlan(
        "Rewrite the introduction and preserve formatting.",
        classification,
      ),
    );
    internals.taskTracker.beginTask(
      "Rewrite the introduction and preserve formatting.",
      classification,
      {
        mode: "execute",
      },
    );
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-1",
      toolName: "get_document_text",
      isError: false,
      resultText: "before",
      timestamp: 1,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-2",
      toolName: "execute_office_js",
      isError: false,
      resultText: "first write",
      timestamp: 2,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-3",
      toolName: "get_document_text",
      isError: false,
      resultText: "after first write",
      timestamp: 3,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-4",
      toolName: "execute_office_js",
      isError: false,
      resultText: "second write",
      timestamp: 4,
    });

    const diagnostics = internals.deriveExecutionDiagnostics(
      internals.taskTracker.getCurrentTask() as any,
    );
    internals.taskTracker.setExecutionDiagnostics(diagnostics);
    internals.planManager.syncWithExecution(
      internals.taskTracker.getCurrentTask() as any,
    );
    internals.update({
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
      mode: "execute",
    });

    expect(diagnostics).toEqual(
      expect.objectContaining({
        writeCount: 2,
        postWriteRereadCount: 0,
        firstWriteAt: 4,
      }),
    );
    expect(
      runtime.getRuntimeStateSlice().activePlanSummary?.activeStepIndex,
    ).toBe(2);
    runtime.dispose();
  });

  it("counts a same-scope reread after an alias-style paragraph write as verification", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the introduction and preserve formatting.",
    );
    internals.planManager.replacePlan(
      buildDefaultPlan(
        "Rewrite the introduction and preserve formatting.",
        classification,
      ),
    );
    internals.taskTracker.beginTask(
      "Rewrite the introduction and preserve formatting.",
      classification,
      {
        mode: "execute",
      },
    );
    internals.update({
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          timestamp: 1,
          parts: [
            {
              type: "toolCall",
              id: "tc-read",
              name: "get_document_text",
              args: { startParagraph: 1, endParagraph: 3 },
              status: "complete",
            },
            {
              type: "toolCall",
              id: "tc-write",
              name: "execute_office_js",
              args: {
                code: "const p = context.document.body.paragraphs.items[1]; p.insertText('Updated', Word.InsertLocation.replace);",
              },
              status: "complete",
            },
            {
              type: "toolCall",
              id: "tc-reread-same-scope",
              name: "get_document_text",
              args: { startParagraph: 2, endParagraph: 2 },
              status: "complete",
            },
          ],
        },
      ],
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-read",
      toolName: "get_document_text",
      isError: false,
      resultText: "before",
      timestamp: 1,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-write",
      toolName: "execute_office_js",
      isError: false,
      resultText: "write",
      timestamp: 2,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-reread-same-scope",
      toolName: "get_document_text",
      isError: false,
      resultText: "updated scope",
      timestamp: 3,
    });

    const diagnostics = internals.deriveExecutionDiagnostics(
      internals.taskTracker.getCurrentTask() as any,
    );
    internals.taskTracker.setExecutionDiagnostics(diagnostics);
    internals.planManager.syncWithExecution(
      internals.taskTracker.getCurrentTask() as any,
    );
    internals.update({
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
      mode: "execute",
    });

    expect(diagnostics).toEqual(
      expect.objectContaining({
        writeCount: 1,
        postWriteRereadCount: 1,
        firstWriteAt: 2,
      }),
    );
    expect(
      runtime.getRuntimeStateSlice().activePlanSummary?.activeStepIndex,
    ).toBe(3);
    runtime.dispose();
  });

  it("does not treat an unrelated reread after the latest successful Word write as verification", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the introduction and preserve formatting.",
    );
    internals.planManager.replacePlan(
      buildDefaultPlan(
        "Rewrite the introduction and preserve formatting.",
        classification,
      ),
    );
    internals.taskTracker.beginTask(
      "Rewrite the introduction and preserve formatting.",
      classification,
      {
        mode: "execute",
      },
    );
    internals.update({
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          timestamp: 1,
          parts: [
            {
              type: "toolCall",
              id: "tc-read",
              name: "get_document_text",
              args: { startParagraph: 1, endParagraph: 3 },
              status: "complete",
            },
            {
              type: "toolCall",
              id: "tc-write",
              name: "execute_office_js",
              args: {
                code: "const p = context.document.body.paragraphs.items[1]; p.insertText('Updated', Word.InsertLocation.replace);",
              },
              status: "complete",
            },
            {
              type: "toolCall",
              id: "tc-reread-wrong-scope",
              name: "get_document_text",
              args: { startParagraph: 8, endParagraph: 10 },
              status: "complete",
            },
          ],
        },
      ],
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-read",
      toolName: "get_document_text",
      isError: false,
      resultText: "before",
      timestamp: 1,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-write",
      toolName: "execute_office_js",
      isError: false,
      resultText: "write",
      timestamp: 2,
    });
    internals.taskTracker.recordToolExecution({
      toolCallId: "tc-reread-wrong-scope",
      toolName: "get_document_text",
      isError: false,
      resultText: "different scope",
      timestamp: 3,
    });

    const diagnostics = internals.deriveExecutionDiagnostics(
      internals.taskTracker.getCurrentTask() as any,
    );
    internals.taskTracker.setExecutionDiagnostics(diagnostics);
    internals.planManager.syncWithExecution(
      internals.taskTracker.getCurrentTask() as any,
    );
    internals.update({
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
      mode: "execute",
    });

    expect(diagnostics).toEqual(
      expect.objectContaining({
        writeCount: 1,
        postWriteRereadCount: 0,
        firstWriteAt: 2,
      }),
    );
    expect(
      runtime.getRuntimeStateSlice().activePlanSummary?.activeStepIndex,
    ).toBe(2);
    runtime.dispose();
  });

  it("counts read-only execute_office_js inspections as Word reads", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime) as ReturnType<
      typeof runtimeInternals
    > & {
      handleAgentEvent: (event: Record<string, unknown>) => Promise<void>;
    };
    const classification = inferTaskClassification(
      "Rewrite the introduction and preserve formatting.",
    );
    internals.taskTracker.beginTask(
      "Rewrite the introduction and preserve formatting.",
      classification,
      {
        mode: "execute",
      },
    );
    internals.update({
      messages: [
        {
          id: "assistant-officejs-read",
          role: "assistant",
          parts: [
            {
              type: "toolCall",
              id: "tc_officejs_read",
              name: "execute_office_js",
              args: {
                code: "const body = context.document.body; body.load('text'); await context.sync(); return { text: body.text };",
              },
              status: "running",
            },
          ],
          timestamp: 1,
        },
      ] as any,
    });

    await internals.handleAgentEvent({
      type: "tool_execution_end",
      toolCallId: "tc_officejs_read",
      toolName: "execute_office_js",
      isError: false,
      result: "Read-only inspection",
    });

    const diagnostics = internals.deriveExecutionDiagnostics(
      internals.taskTracker.getCurrentTask() as any,
    );
    expect(diagnostics.preWriteReadCount).toBe(1);
    expect(diagnostics.scopeReadCount).toBe(1);
    expect(diagnostics.writeCount).toBe(0);
    runtime.dispose();
  });

  it("counts a read-only execute_office_js follow-up as a post-write reread", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime) as ReturnType<
      typeof runtimeInternals
    > & {
      handleAgentEvent: (event: Record<string, unknown>) => Promise<void>;
    };
    const classification = inferTaskClassification(
      "Rewrite the introduction and preserve formatting.",
    );
    internals.taskTracker.beginTask(
      "Rewrite the introduction and preserve formatting.",
      classification,
      {
        mode: "execute",
      },
    );
    internals.update({
      messages: [
        {
          id: "assistant-officejs-reread",
          role: "assistant",
          parts: [
            {
              type: "toolCall",
              id: "tc_officejs_write",
              name: "execute_office_js",
              args: {
                code: "const range = context.document.getSelection(); range.insertText('Updated', Word.InsertLocation.replace); await context.sync(); return { ok: true };",
              },
              status: "completed",
            },
            {
              type: "toolCall",
              id: "tc_officejs_reread",
              name: "execute_office_js",
              args: {
                code: "const range = context.document.getSelection(); range.load('text'); await context.sync(); return { text: range.text };",
              },
              status: "running",
            },
          ],
          timestamp: 1,
        },
      ] as any,
    });

    await internals.handleAgentEvent({
      type: "tool_execution_end",
      toolCallId: "tc_officejs_write",
      toolName: "execute_office_js",
      isError: false,
      result: "Write completed",
    });
    await internals.handleAgentEvent({
      type: "tool_execution_end",
      toolCallId: "tc_officejs_reread",
      toolName: "execute_office_js",
      isError: false,
      result: "Read-only reread",
    });

    const diagnostics = internals.deriveExecutionDiagnostics(
      internals.taskTracker.getCurrentTask() as any,
    );
    expect(diagnostics.writeCount).toBe(1);
    expect(diagnostics.postWriteRereadCount).toBe(1);
    runtime.dispose();
  });

  it("keeps the latest successful write available to verification even when it falls outside the compacted tail", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
        getVerificationSuites: () => [
          {
            id: "write-anchor-suite",
            label: "Write anchor suite",
            appliesTo: () => true,
            verify: (context) => ({
              suiteId: "write-anchor-suite",
              label: "Write anchor suite",
              expectedEffect:
                "Latest successful write remains visible to verification.",
              observedEffect: context.toolExecutions.some(
                (entry) => entry.toolName === "execute_office_js" && !entry.isError,
              )
                ? "Write anchor preserved."
                : "Latest successful write fell out of the verification window.",
              status: context.toolExecutions.some(
                (entry) => entry.toolName === "execute_office_js" && !entry.isError,
              )
                ? "passed"
                : "failed",
              evidence: context.toolExecutions.map((entry) => entry.toolName),
              retryable: false,
            }),
          },
        ],
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime) as ReturnType<
      typeof runtimeInternals
    > & {
      handleAgentEvent: (event: Record<string, unknown>) => Promise<void>;
      runVerificationPhase: () => Promise<{ status: string }>;
    };
    const classification = inferTaskClassification(
      "Rewrite the introduction and preserve formatting.",
    );
    internals.taskTracker.beginTask(
      "Rewrite the introduction and preserve formatting.",
      classification,
      {
        mode: "execute",
      },
    );
    internals.update({
      messages: [
        {
          id: "assistant-write-anchor",
          role: "assistant",
          parts: [
            {
              type: "toolCall",
              id: "tc_anchor_write",
              name: "execute_office_js",
              args: {
                code: "const range = context.document.getSelection(); range.insertText('Updated', Word.InsertLocation.replace); await context.sync(); return { ok: true };",
              },
              status: "completed",
            },
            ...Array.from({ length: 7 }, (_, index) => ({
              type: "toolCall",
              id: `tc_tail_${index}`,
              name: "get_document_text",
              args: { maxChars: 200 },
              status: "completed",
            })),
          ],
          timestamp: 1,
        },
      ] as any,
    });

    await internals.handleAgentEvent({
      type: "tool_execution_end",
      toolCallId: "tc_anchor_write",
      toolName: "execute_office_js",
      isError: false,
      result: "Write completed",
    });
    for (let index = 0; index < 7; index += 1) {
      await internals.handleAgentEvent({
        type: "tool_execution_end",
        toolCallId: `tc_tail_${index}`,
        toolName: "get_document_text",
        isError: false,
        result: `Tail reread ${index}`,
      });
    }

    await expect(internals.runVerificationPhase()).resolves.toMatchObject({
      status: "passed",
    });
    runtime.dispose();
  });

  it("marks completed plans as done in the runtime summary", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the introduction and preserve formatting.",
    );
    internals.planManager.replacePlan(
      createPlan({
        userRequest: "Rewrite the introduction and preserve formatting.",
        classification,
        approvalRequired: false,
      }),
    );
    internals.taskTracker.beginTask(
      "Rewrite the introduction and preserve formatting.",
      classification,
      {
        mode: "execute",
      },
    );
    internals.taskTracker.setExecutionDiagnostics({
      preWriteReadCount: 1,
      preWriteInspectionCount: 1,
      scopeReadCount: 1,
      writeCount: 1,
      failedWriteCount: 0,
      postWriteRereadCount: 1,
      firstReadAt: 1,
      firstWriteAt: 2,
      planAdvancedBeyondInspection: true,
    });
    internals.update({
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
      mode: "execute",
    });

    internals.taskTracker.completeTask("done");
    internals.update({
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
      mode: "completed",
    });

    expect(
      runtime.getRuntimeStateSlice().activePlanSummary?.activeStepIndex,
    ).toBe(-1);
    runtime.dispose();
  });

  it("does not complete a plan only because the task says completed while verification remains incomplete", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the introduction and preserve formatting.",
    );
    internals.planManager.replacePlan(
      buildDefaultPlan(
        "Rewrite the introduction and preserve formatting.",
        classification,
      ),
    );
    internals.taskTracker.beginTask(
      "Rewrite the introduction and preserve formatting.",
      classification,
      {
        mode: "execute",
      },
    );
    internals.taskTracker.setExecutionDiagnostics({
      preWriteReadCount: 1,
      preWriteInspectionCount: 1,
      scopeReadCount: 1,
      writeCount: 1,
      failedWriteCount: 0,
      postWriteRereadCount: 0,
      firstReadAt: 1,
      firstWriteAt: 2,
      planAdvancedBeyondInspection: true,
    });
    internals.taskTracker.completeTask("done");

    const plan = internals.planManager.syncWithExecution(
      internals.taskTracker.getCurrentTask() as any,
    );

    expect(plan?.status).not.toBe("completed");
    expect(plan?.activeStepId).toBeTruthy();
    expect(plan?.steps.map((step) => step.status)).toEqual([
      "completed",
      "completed",
      "completed",
      "active",
    ]);
    runtime.dispose();
  });

  it("keeps the runtime active step summary anchored until controller reconciliation runs", async () => {
    const runtime = new AgentRuntime(
      createAdapter({
        hostApp: "word",
      }),
    );
    await runtime.init();

    const internals = runtimeInternals(runtime);
    const classification = inferTaskClassification(
      "Rewrite the introduction and preserve formatting.",
    );
    const plan = buildDefaultPlan(
      "Rewrite the introduction and preserve formatting.",
      classification,
    );
    plan.activeStepId = "step-verify";
    plan.steps = plan.steps.map((step) =>
      step.id === "step-write" || step.id === "step-verify"
        ? { ...step, status: "completed", completedAt: 2 }
        : step,
    );

    internals.planManager.replacePlan(plan);
    internals.taskTracker.beginTask(
      "Rewrite the introduction and preserve formatting.",
      classification,
      {
        mode: "execute",
      },
    );
    internals.update({
      activePlan: internals.planManager.getActivePlan(),
      activeTask: internals.taskTracker.getCurrentTask() as any,
      mode: "execute",
    });

    expect(
      runtime.getRuntimeStateSlice().activePlanSummary?.activeStepIndex,
    ).toBe(0);
    runtime.dispose();
  });

  it("does not restore an unrelated latest task and latest plan as an active pair", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    const sessionId = runtime.getState().currentSession!.id;
    const matchingPlan = createPlan({
      id: "plan-match",
      userRequest: "Rewrite the introduction",
      classification: inferTaskClassification("Rewrite the introduction"),
    });
    const unrelatedLatestPlan = createPlan({
      id: "plan-latest",
      userRequest: "Summarize the appendix",
      classification: inferTaskClassification("Summarize the appendix"),
    });

    await savePlanRecord(sessionId, {
      ...matchingPlan,
      updatedAt: 100,
    } as any);
    await saveTaskRecord(sessionId, {
      id: "task-match",
      userRequest: "Rewrite the introduction",
      status: "in_progress",
      mode: "execute",
      planId: "plan-match",
      toolCallIds: [],
      createdAt: 100,
      updatedAt: 100,
    } as any);
    await savePlanRecord(sessionId, {
      ...unrelatedLatestPlan,
      updatedAt: 300,
    } as any);
    await saveTaskRecord(sessionId, {
      id: "task-latest",
      userRequest: "Refresh the summary",
      status: "in_progress",
      mode: "execute",
      planId: "plan-other",
      toolCallIds: [],
      createdAt: 200,
      updatedAt: 400,
    } as any);

    await runtime.newSession();
    await runtime.switchSession(sessionId);

    const state = runtime.getState();
    expect(state.activeTask?.planId ?? null).toBe(state.activePlan?.id ?? null);
    runtime.dispose();
  });

  it("prefers the manifest task's linked plan when the manifest plan id is stale", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    const sessionId = runtime.getState().currentSession!.id;
    const matchingPlan = createPlan({
      id: "plan-match",
      userRequest: "Rewrite the introduction",
      classification: inferTaskClassification("Rewrite the introduction"),
    });
    const staleManifestPlan = createPlan({
      id: "plan-stale",
      userRequest: "Summarize the appendix",
      classification: inferTaskClassification("Summarize the appendix"),
    });

    await savePlanRecord(sessionId, {
      ...matchingPlan,
      updatedAt: 100,
    } as any);
    await savePlanRecord(sessionId, {
      ...staleManifestPlan,
      updatedAt: 300,
    } as any);
    await saveTaskRecord(sessionId, {
      id: "task-match",
      userRequest: "Rewrite the introduction",
      status: "blocked",
      mode: "blocked",
      planId: "plan-match",
      toolCallIds: [],
      createdAt: 100,
      updatedAt: 100,
    } as any);
    await saveExecutionManifest(sessionId, {
      taskId: "task-match",
      planId: "plan-stale",
      lastVerification: null,
      updatedAt: 400,
    });

    await runtime.newSession();
    await runtime.switchSession(sessionId);

    const state = runtime.getState();
    expect(state.activeTask?.id).toBe("task-match");
    expect(state.activePlan?.id).toBe("plan-match");
    runtime.dispose();
  });

  it("restores last verification truth from the persisted task record", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();

    const sessionId = runtime.getState().currentSession!.id;
    await saveSession(sessionId, [
      {
        role: "user",
        content: "Rewrite the introduction",
        timestamp: 1,
      },
    ]);
    await saveTaskRecord(sessionId, {
      id: "task-verify",
      userRequest: "Rewrite the introduction",
      status: "in_progress",
      mode: "blocked",
      toolCallIds: [],
      verificationSummary: {
        status: "retryable",
        retryable: true,
        lastVerifiedAt: 123,
      },
      createdAt: 100,
      updatedAt: 200,
    } as any);

    await runtime.newSession();
    await runtime.switchSession(sessionId);

    expect(runtime.getRuntimeStateSlice().lastVerification).toEqual({
      status: "retryable",
      retryable: true,
    });
    runtime.dispose();
  });

  it("merges a same-scope follow-up into the unresolved active execution", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();
    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(
      runtime,
    ) as typeof runtimeInternals extends (runtime: AgentRuntime) => infer R
      ? R & {
          buildHandoff: (
            task: Record<string, unknown>,
            resumeMessage: string,
          ) => Promise<Record<string, unknown>>;
        }
      : never;

    const classification = inferTaskClassification("Rewrite the introduction");
    internals.taskClassifier.classify = async () => classification;
    internals.estimateScopeRisk = async () => ({
      level: "high",
      destructive: false,
      requiresApproval: true,
      reasons: ["Approval required"],
      scopeSummary: "document scope",
      constraints: ["Preserve formatting."],
      expectedEffects: ["Content changes only in requested scope."],
    });
    internals.buildHandoff = async (task, resumeMessage) => ({
      kind: "approval",
      resumeMessage,
      taskId: String(task.id),
    });

    await runtime.sendMessage("Rewrite the introduction");
    const firstTaskId = runtime.getState().activeTask?.id ?? null;
    const firstPlanId = runtime.getState().activePlan?.id ?? null;

    await runtime.sendMessage("Also rewrite the conclusion");

    expect(runtime.getState().activeTask?.id ?? null).toBe(firstTaskId);
    expect(runtime.getState().activePlan?.id ?? null).toBe(firstPlanId);
    expect(runtime.getState().activeTask?.userRequest).toContain(
      "Also rewrite the conclusion",
    );
    expect(runtime.getState().activePlan?.requirements).toContain(
      "Also rewrite the conclusion",
    );
    expect(runtime.getState().error).toBeNull();
    runtime.dispose();
  });

  it("blocks unrelated new requests until the active execution is resumed or superseded", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();
    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(
      runtime,
    ) as typeof runtimeInternals extends (runtime: AgentRuntime) => infer R
      ? R & {
          buildHandoff: (
            task: Record<string, unknown>,
            resumeMessage: string,
          ) => Promise<Record<string, unknown>>;
        }
      : never;

    const classification = inferTaskClassification("Rewrite the introduction");
    internals.taskClassifier.classify = async () => classification;
    internals.estimateScopeRisk = async () => ({
      level: "high",
      destructive: false,
      requiresApproval: true,
      reasons: ["Approval required"],
      scopeSummary: "document scope",
      constraints: ["Preserve formatting."],
      expectedEffects: ["Content changes only in requested scope."],
    });
    internals.buildHandoff = async (task, resumeMessage) => ({
      kind: "approval",
      resumeMessage,
      taskId: String(task.id),
    });

    await runtime.sendMessage("Rewrite the introduction");
    const firstTaskId = runtime.getState().activeTask?.id ?? null;
    const firstPlanId = runtime.getState().activePlan?.id ?? null;
    const firstRequest = runtime.getState().activeTask?.userRequest;

    await runtime.sendMessage("Summarize the appendix from scratch");

    expect(runtime.getState().activeTask?.id ?? null).toBe(firstTaskId);
    expect(runtime.getState().activePlan?.id ?? null).toBe(firstPlanId);
    expect(runtime.getState().activeTask?.userRequest).toBe(firstRequest);
    expect(runtime.getState().error).toContain("active task is still unresolved");
    runtime.dispose();
  });

  it("does not merge a continuation-shaped request before its own approval check runs", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();
    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(runtime);

    const activePlan = createPlan({ approvalRequired: false });
    internals.planManager.replacePlan(activePlan);
    const activeTask = internals.taskTracker.beginTask(
      "Rewrite the introduction",
      inferTaskClassification("Rewrite the introduction"),
      {
        planId: activePlan.id,
        mode: "execute",
        approvalPending: false,
      },
    );
    internals.update({
      activePlan,
      activeTask: activeTask as any,
      mode: "execute",
      handoff: null,
      approvalRequest: null,
      error: null,
    });

    let mergeCalls = 0;
    let blocked = false;
    (runtime as any).mergeFollowUpIntoActiveExecution = async () => {
      mergeCalls += 1;
      return true;
    };
    (runtime as any).blockNewRequestWhileExecutionUnresolved = async () => {
      blocked = true;
      return true;
    };

    internals.taskClassifier.classify = async () =>
      inferTaskClassification("Rewrite the introduction");
    internals.estimateScopeRisk = async (message) =>
      /delete/i.test(message)
        ? {
            level: "high",
            destructive: true,
            requiresApproval: true,
            reasons: ["Destructive rewrite requires approval"],
            scopeSummary: "appendix scope",
            constraints: ["Do not delete unrelated content."],
            expectedEffects: ["Only the requested appendix content changes."],
          }
        : {
            level: "low",
            destructive: false,
            requiresApproval: false,
            reasons: ["Safe edit"],
            scopeSummary: "document scope",
            constraints: ["Preserve formatting."],
            expectedEffects: ["Content changes only in requested scope."],
          };

    await runtime.sendMessage("Also delete the appendix");

    expect(mergeCalls).toBe(0);
    expect(blocked).toBe(true);
    runtime.dispose();
  });

  it("supersedes the unresolved execution before starting a replacement request", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.init();
    runtime.applyConfig({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      useProxy: false,
      proxyUrl: "",
      thinking: "none",
      followMode: true,
      expandToolCalls: false,
    });

    const internals = runtimeInternals(
      runtime,
    ) as typeof runtimeInternals extends (runtime: AgentRuntime) => infer R
      ? R & {
          buildHandoff: (
            task: Record<string, unknown>,
            resumeMessage: string,
          ) => Promise<Record<string, unknown>>;
        }
      : never;

    const classification = inferTaskClassification("Rewrite the introduction");
    internals.taskClassifier.classify = async () => classification;
    internals.estimateScopeRisk = async () => ({
      level: "high",
      destructive: false,
      requiresApproval: true,
      reasons: ["Approval required"],
      scopeSummary: "document scope",
      constraints: ["Preserve formatting."],
      expectedEffects: ["Content changes only in requested scope."],
    });
    internals.buildHandoff = async (task, resumeMessage) => ({
      kind: "approval",
      resumeMessage,
      taskId: String(task.id),
    });

    await runtime.sendMessage("Rewrite the introduction");
    const sessionId = runtime.getState().currentSession!.id;
    const firstTaskId = runtime.getState().activeTask?.id ?? null;
    const firstPlanId = runtime.getState().activePlan?.id ?? null;

    await runtime.supersedeActiveExecution("Rewrite only the conclusion");

    expect(runtime.getState().activeTask?.id).not.toBe(firstTaskId);
    expect(runtime.getState().activePlan?.id).not.toBe(firstPlanId);
    await expect(getTaskRecord(firstTaskId!)).resolves.toMatchObject({
      task: expect.objectContaining({ status: "superseded" }),
    });
    await expect(getPlanRecord(firstPlanId!)).resolves.toMatchObject({
      plan: expect.objectContaining({ status: "abandoned" }),
    });
    expect(runtime.getState().currentSession?.id).toBe(sessionId);
    runtime.dispose();
  });
});
