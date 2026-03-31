// @vitest-environment happy-dom

import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProbeCounts, resetProbeCounts } from "./fixtures/tab-mount-probe-state";

vi.mock("@office-agents/sdk", () => ({
  getSessionMessageCount: () => 0,
}));

vi.mock("../src/chat/chat-controller", async () => {
  const { writable } = await import("svelte/store");

  return {
    ChatController: class {
      adapter: unknown;
      state = writable({
        taskPhase: "idle",
        permissionMode: "read_only",
        contextBudgetState: null,
        activeTask: null,
        handoff: null,
        approvalRequest: null,
        planState: null,
        waitingState: null,
        currentSession: { id: "session-1", name: "New Chat" },
        sessions: [{ id: "session-1", name: "New Chat" }],
        isStreaming: false,
        messageCount: 0,
        providerConfig: null,
        sessionStats: {
          inputTokens: 0,
          outputTokens: 0,
          cacheRead: 0,
          cacheWrite: 0,
          totalCost: 0,
          contextWindow: 0,
          lastInputTokens: 0,
        },
      });
      messagesState = writable({ messages: [], isStreaming: false });
      snapshot = { isStreaming: false, providerConfig: null, messages: [] };

      constructor(adapter: unknown) {
        this.adapter = adapter;
      }

      setAdapter(adapter: unknown) {
        this.adapter = adapter;
      }

      dispose() {}
      toggleFollowMode() {}
      clearMessages() {
        return Promise.resolve();
      }
      newSession() {
        return Promise.resolve();
      }
      switchSession() {
        return Promise.resolve();
      }
      deleteCurrentSession() {
        return Promise.resolve();
      }
      compactContext() {}
      processFiles() {
        return Promise.resolve();
      }
      resumeFromHandoff() {
        return Promise.resolve();
      }
    },
  };
});

vi.mock("../src/chat/message-list.svelte", async () => ({
  default: (await import("./fixtures/chat-root-probe.svelte")).default,
}));

vi.mock("../src/chat/files-panel.svelte", async () => ({
  default: (await import("./fixtures/files-root-probe.svelte")).default,
}));

vi.mock("../src/chat/settings-panel.svelte", async () => ({
  default: (await import("./fixtures/settings-root-probe.svelte")).default,
}));

vi.mock("../src/chat/status-strip.svelte", async () => ({
  default: (await import("./fixtures/chat-root-probe.svelte")).default,
}));

vi.mock("../src/chat/resume-task-banner.svelte", async () => ({
  default: (await import("./fixtures/chat-root-probe.svelte")).default,
}));

vi.mock("../src/chat/approval-drawer.svelte", async () => ({
  default: (await import("./fixtures/chat-root-probe.svelte")).default,
}));

vi.mock("../src/chat/plan-panel.svelte", async () => ({
  default: (await import("./fixtures/chat-root-probe.svelte")).default,
}));

vi.mock("../src/chat/diagnostics-panel.svelte", async () => ({
  default: (await import("./fixtures/chat-root-probe.svelte")).default,
}));

vi.mock("../src/chat/chat-input.svelte", async () => ({
  default: (await import("./fixtures/chat-root-probe.svelte")).default,
}));

vi.mock("../src/chat/resize-handle.svelte", async () => ({
  default: (await import("./fixtures/chat-root-probe.svelte")).default,
}));

vi.mock("../src/chat/bridge-ui-events.js", () => ({
  emitBridgeUIEvent: () => {},
}));

import ChatInterface from "../src/chat/chat-interface.svelte";

function installBrowserStubs() {
  const storage = new Map<string, string>();

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    } satisfies Storage,
  });

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderChatInterface() {
  const target = document.createElement("div");
  document.body.appendChild(target);

  const app = mount(ChatInterface, {
    target,
    props: {
      adapter: {
        tools: [],
        buildSystemPrompt: () => "",
        getDocumentId: async () => "doc-1",
      },
    },
  });

  flushSync();
  return { app, target };
}

function clickTab(target: HTMLElement, label: "Files" | "Settings" | "Chat") {
  const button = Array.from(target.querySelectorAll("button")).find((node) =>
    node.textContent?.includes(label),
  );

  expect(button, `${label} tab button should exist`).toBeTruthy();
  button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  flushSync();
}

function getProbe(target: HTMLElement, testId: string) {
  return target.querySelector(`[data-testid="${testId}"]`);
}

describe("ChatInterface tab mounting", () => {
  let mounted:
    | {
        app: ReturnType<typeof mount>;
        target: HTMLDivElement;
      }
    | undefined;

  beforeEach(() => {
    resetProbeCounts();
    installBrowserStubs();
    localStorage.clear();
    document.body.innerHTML = "";
  });

  afterEach(async () => {
    if (mounted) {
      await unmount(mounted.app);
      mounted = undefined;
    }
    document.body.innerHTML = "";
  });

  it("keeps stateful chat/settings inputs mounted while unmounting inactive chat display content", () => {
    mounted = renderChatInterface();

    expect(getProbe(mounted.target, "chat-root-probe")).toBeTruthy();
    expect(getProbe(mounted.target, "files-root-probe")).toBeFalsy();
    expect(getProbe(mounted.target, "settings-root-probe")).toBeTruthy();
    expect(getProbeCounts()).toEqual({
      chat: { mounted: 9, unmounted: 0 },
      files: { mounted: 0, unmounted: 0 },
      settings: { mounted: 1, unmounted: 0 },
    });

    clickTab(mounted.target, "Files");

    expect(getProbe(mounted.target, "files-root-probe")).toBeTruthy();
    expect(getProbeCounts()).toEqual({
      chat: { mounted: 9, unmounted: 8 },
      files: { mounted: 1, unmounted: 0 },
      settings: { mounted: 1, unmounted: 0 },
    });

    clickTab(mounted.target, "Settings");

    expect(getProbe(mounted.target, "files-root-probe")).toBeFalsy();
    expect(getProbe(mounted.target, "settings-root-probe")).toBeTruthy();
    expect(getProbeCounts()).toEqual({
      chat: { mounted: 9, unmounted: 8 },
      files: { mounted: 1, unmounted: 1 },
      settings: { mounted: 1, unmounted: 0 },
    });

    clickTab(mounted.target, "Chat");

    expect(getProbe(mounted.target, "chat-root-probe")).toBeTruthy();
    expect(getProbe(mounted.target, "files-root-probe")).toBeFalsy();
    expect(getProbe(mounted.target, "settings-root-probe")).toBeTruthy();
    expect(getProbeCounts()).toEqual({
      chat: { mounted: 17, unmounted: 8 },
      files: { mounted: 1, unmounted: 1 },
      settings: { mounted: 1, unmounted: 0 },
    });
  });
});
