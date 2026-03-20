import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AgentRuntime,
  type RuntimeAdapter,
  type RuntimeState,
} from "../src/runtime";
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
    expect(state.sessionStats.contextWindow).toBe(750000);
    runtime.dispose();
  });

  it("sendMessage errors when no config", async () => {
    const runtime = new AgentRuntime(createAdapter());
    await runtime.sendMessage("hello");
    const state = runtime.getState();
    expect(state.error).toContain("API key");
    runtime.dispose();
  });

  it("clearMessages resets state", () => {
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

    runtime.clearMessages();
    const state = runtime.getState();
    expect(state.messages).toEqual([]);
    expect(state.error).toBeNull();
    expect(state.uploads).toEqual([]);
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

    const firstSession = runtime.getState().currentSession!.id;
    await runtime.newSession();
    const secondSession = runtime.getState().currentSession!.id;

    expect(firstSession).not.toBe(secondSession);
    expect(runtime.getState().messages).toEqual([]);
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
