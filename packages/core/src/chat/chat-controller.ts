import type { Api, Model } from "@mariozechner/pi-ai";
import {
  AgentRuntime,
  configureNamespace,
  type PermissionMode,
  type ProviderConfig,
  type RuntimeState,
} from "@office-agents/sdk";
import { get, type Writable, writable } from "svelte/store";
import type { AppAdapter, BridgeRuntimeStateLike } from "./app-adapter";

type ChatMessagesState = Pick<RuntimeState, "messages" | "isStreaming">;
export type ChatUiState = Omit<RuntimeState, "messages"> & {
  messageCount: number;
};

export class ChatController {
  readonly state: Writable<ChatUiState>;
  readonly messagesState: Writable<ChatMessagesState>;
  adapter: AppAdapter;
  #runtime: AgentRuntime;
  #unsubscribe: (() => void) | null = null;
  #stateSnapshot: ChatUiState;
  #messagesSnapshot: ChatMessagesState;
  readonly #bridgeRuntimeState = (): BridgeRuntimeStateLike =>
    this.#runtime.getRuntimeStateSlice();

  constructor(adapter: AppAdapter) {
    this.adapter = adapter;
    if (adapter.storageNamespace) {
      configureNamespace(adapter.storageNamespace);
    }

    this.#runtime = new AgentRuntime(adapter);
    this.#attachBridgeRuntimeState(adapter);
    const initialState = this.#runtime.getState();
    this.#stateSnapshot = this.#selectUiState(initialState);
    this.#messagesSnapshot = this.#selectMessagesState(initialState);
    this.state = writable(this.#stateSnapshot);
    this.messagesState = writable(this.#messagesSnapshot);
    this.#unsubscribe = this.#runtime.subscribe((next) =>
      this.#syncStateStores(next),
    );
    this.#runtime.init();
  }

  get snapshot() {
    return {
      ...get(this.state),
      ...get(this.messagesState),
    } satisfies RuntimeState;
  }

  get availableProviders() {
    return this.#runtime.getAvailableProviders();
  }

  setAdapter(adapter: AppAdapter) {
    this.#detachBridgeRuntimeState(this.adapter);
    this.adapter = adapter;
    if (adapter.storageNamespace) {
      configureNamespace(adapter.storageNamespace);
    }
    this.#attachBridgeRuntimeState(adapter);
    this.#runtime.setAdapter(adapter);
  }

  dispose() {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#detachBridgeRuntimeState(this.adapter);
    this.#runtime.dispose();
  }

  getRuntimeStateSlice(): BridgeRuntimeStateLike {
    return this.#runtime.getRuntimeStateSlice();
  }

  getModelsForProvider(provider: string): Model<Api>[] {
    return this.#runtime.getModelsForProvider(provider);
  }

  sendMessage(content: string, attachments?: string[]) {
    return this.#runtime.sendMessage(content, attachments);
  }

  approvePending() {
    return this.#runtime.approvePending();
  }

  approveActivePlan() {
    return this.#runtime.approveActivePlan();
  }

  resumeFromHandoff() {
    return this.#runtime.resumeFromHandoff();
  }

  setPermissionMode(mode: PermissionMode) {
    this.#runtime.setPermissionMode(mode);
  }

  setProviderConfig(config: ProviderConfig) {
    this.#runtime.setProviderConfig(config);
  }

  clearMessages() {
    return this.#runtime.clearMessages();
  }

  abort() {
    this.#runtime.abort();
  }

  newSession() {
    return this.#runtime.newSession();
  }

  switchSession(sessionId: string) {
    return this.#runtime.switchSession(sessionId);
  }

  deleteCurrentSession() {
    return this.#runtime.deleteCurrentSession();
  }

  getName(id: number) {
    return this.#runtime.getName(id);
  }

  toggleFollowMode() {
    this.#runtime.toggleFollowMode();
  }

  toggleExpandToolCalls() {
    this.#runtime.toggleExpandToolCalls();
  }

  async processFiles(files: File[]) {
    if (files.length === 0) return;

    const inputs = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        size: file.size,
        data: new Uint8Array(await file.arrayBuffer()),
      })),
    );
    await this.#runtime.uploadFiles(inputs);
  }

  removeUpload(name: string) {
    return this.#runtime.removeUpload(name);
  }

  async installSkill(files: File[]) {
    if (files.length === 0) return;

    const inputs = await Promise.all(
      files.map(async (file) => {
        const fullPath = file.webkitRelativePath || file.name;
        const parts = fullPath.split("/");
        const path = parts.length > 1 ? parts.slice(1).join("/") : parts[0];
        return { path, data: new Uint8Array(await file.arrayBuffer()) };
      }),
    );

    await this.#runtime.installSkill(inputs);
  }

  uninstallSkill(name: string) {
    return this.#runtime.uninstallSkill(name);
  }

  #attachBridgeRuntimeState(adapter: AppAdapter) {
    adapter.getRuntimeState = this.#bridgeRuntimeState;
  }

  #detachBridgeRuntimeState(adapter: AppAdapter) {
    if (adapter.getRuntimeState === this.#bridgeRuntimeState) {
      delete adapter.getRuntimeState;
    }
  }

  #selectUiState(state: RuntimeState): ChatUiState {
    const { messages, ...rest } = state;
    return {
      ...rest,
      messageCount: messages.length,
    };
  }

  #selectMessagesState(state: RuntimeState): ChatMessagesState {
    return {
      messages: state.messages,
      isStreaming: state.isStreaming,
    };
  }

  #syncStateStores(next: RuntimeState) {
    const nextMessages = this.#selectMessagesState(next);
    if (
      nextMessages.messages !== this.#messagesSnapshot.messages ||
      nextMessages.isStreaming !== this.#messagesSnapshot.isStreaming
    ) {
      this.#messagesSnapshot = nextMessages;
      this.messagesState.set(nextMessages);
    }

    const nextUiState = this.#selectUiState(next);
    if (this.#hasUiStateChanged(nextUiState)) {
      this.#stateSnapshot = nextUiState;
      this.state.set(nextUiState);
    }
  }

  #hasUiStateChanged(next: ChatUiState): boolean {
    const prev = this.#stateSnapshot;
    const keys = Object.keys(next) as Array<keyof ChatUiState>;
    for (const key of keys) {
      if (prev[key] !== next[key]) {
        return true;
      }
    }
    return false;
  }
}
