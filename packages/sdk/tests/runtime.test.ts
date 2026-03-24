import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AgentRuntime,
  type RuntimeAdapter,
  type RuntimeState,
} from "../src/runtime";
import { inferTaskClassification } from "../src/planning";
import {
  getLatestTaskRecord,
  listThreadSummaries,
  loadVfsFiles,
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
    estimateScopeRisk: (message: string, classification: unknown) => Promise<{
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
      hydrate: (plan: ReturnType<typeof createPlan>) => void;
      persist: (sessionId: string) => Promise<unknown>;
    };
    update: (partial: Partial<RuntimeState>) => void;
  };
}

const corpusScenarioMap = JSON.parse(
  readFileSync(
    path.join(__dirname, "fixtures", "docx-corpus", "docx-corpus.scenarios.json"),
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
        hookRegistry: { addPromptNotes: (notes: Array<{ text: string; level: "info"; source: { hookName: string } }>) => void };
        syncAdapterVerifiers: (adapter: RuntimeAdapter) => void;
      }
    ).syncAdapterVerifiers(createAdapter({
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
    }));

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

  it("keeps corpus-derived review, structure, and formatting requests out of mutation gating when they are analysis-only", () => {
    const requests = corpusScenarioMap.scenarios
      .filter((scenario) =>
        ["review-heavy", "structure-heavy", "formatting-heavy"].includes(
          scenario.stressArea,
        ),
      )
      .map((scenario) => `Inspect ${scenario.file} and summarize risks without changing the document.`);

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

    const internals = runtimeInternals(runtime) as typeof runtimeInternals extends (
      runtime: AgentRuntime,
    ) => infer R
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
    expect(vfsFiles.some((file) => file.path === "/.oa/context/requirements.json")).toBe(true);
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
});
