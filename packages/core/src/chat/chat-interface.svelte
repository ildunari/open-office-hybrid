<script lang="ts">
  import { getSessionMessageCount } from "@office-agents/sdk";
  import {
    Check,
    ChevronDown,
    Eye,
    EyeOff,
    FolderOpen,
    MessageSquare,
    Minimize2,
    Moon,
    Plus,
    Settings,
    Sun,
    Trash2,
    Upload,
  } from "lucide-svelte";
  import { onDestroy } from "svelte";
  import type { AppAdapter } from "./app-adapter";
  import ApprovalDrawer from "./approval-drawer.svelte";
  import { ChatController } from "./chat-controller";
  import DiagnosticsPanel from "./diagnostics-panel.svelte";
  import { setChatContext } from "./chat-runtime-context";
  import ChatInput from "./chat-input.svelte";
  import FilesPanel from "./files-panel.svelte";
  import MessageList from "./message-list.svelte";
  import PlanPanel from "./plan-panel.svelte";
  import ResumeTaskBanner from "./resume-task-banner.svelte";
  import SettingsPanel from "./settings-panel.svelte";
  import StatusStrip from "./status-strip.svelte";
  import ResizeHandle from "./resize-handle.svelte";
  import ControlPanelsWrapper from "./control-panels-wrapper.svelte";
  import type { ChatTab } from "./types";
  import { emitBridgeUIEvent } from "./bridge-ui-events.js";

  type Theme = "light" | "dark";

  const THEME_KEY = "office-agents-theme";

  interface Props {
    adapter: AppAdapter;
  }

  type TaskpaneAutomation = {
    submitPrompt: (
      prompt: string,
      options?: { freshSession?: boolean },
    ) => Promise<{
      submitted: boolean;
      promptLength: number;
      submissionMethod: "controller";
      freshSession: boolean;
    }>;
  };

  let { adapter }: Props = $props();

  const controller = (() => {
    const ctrl = new ChatController(adapter);
    setChatContext(ctrl);
    return ctrl;
  })();

  const runtimeState = controller.state;
  let activeTab = $state<ChatTab>("chat");
  let isDragOver = $state(false);
  let dragCounter = $state(0);
  let sessionDropdownOpen = $state(false);
  let sessionDropdownRef = $state<HTMLDivElement | null>(null);
  let diagnosticsWrapperRef = $state<HTMLDivElement | null>(null);
  let inputWrapperRef = $state<HTMLDivElement | null>(null);

  let theme = $state<Theme>(loadTheme());

  function getTaskpaneAutomation(): TaskpaneAutomation {
    return {
      submitPrompt: async (prompt: string, options) => {
        const trimmed = prompt.trim();
        if (!trimmed) {
          throw new Error("Automation prompt must not be empty");
        }
        if (controller.snapshot.isStreaming) {
          throw new Error(
            "Session is already streaming. Wait for the current run to finish before submitting another prompt.",
          );
        }
        if (!controller.snapshot.providerConfig) {
          throw new Error(
            "Taskpane provider configuration is missing. Configure the taskpane before running live review automation.",
          );
        }

        if (options?.freshSession) {
          await controller.newSession();
        }
        void controller.sendMessage(trimmed);
        return {
          submitted: true,
          promptLength: trimmed.length,
          submissionMethod: "controller",
          freshSession: Boolean(options?.freshSession),
        };
      },
    };
  }

  function loadTheme(): Theme {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    const initial =
      saved ??
      (window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark");
    document.documentElement.setAttribute("data-theme", initial);
    return initial;
  }

  function isLocalDevRuntime(): boolean {
    return ["localhost", "127.0.0.1"].includes(window.location.hostname);
  }

  function toggleTheme() {
    theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    emitBridgeUIEvent("ui:theme_changed", { theme });
  }

  function formatTokens(value: number): string {
    if (!Number.isFinite(value) || value < 0) return "0";
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return value.toString();
  }

  function formatCost(value: number): string {
    if (!Number.isFinite(value) || value < 0) return "$0.0000";
    if (value < 0.01) return `$${value.toFixed(4)}`;
    return `$${value.toFixed(3)}`;
  }

  function getPressure(
    usagePct: number | null | undefined,
  ): "low" | "medium" | "high" | "critical" | null {
    if (usagePct === null || usagePct === undefined) return null;
    if (usagePct >= 0.9) return "critical";
    if (usagePct >= 0.75) return "high";
    if (usagePct >= 0.55) return "medium";
    return "low";
  }

  function getResumeMessage(
    handoff:
      | {
          summary: string;
          nextRecommendedAction: string;
        }
      | null,
    approvalRequest: unknown | null,
  ) {
    if (!handoff || approvalRequest) return null;
    return handoff.summary || handoff.nextRecommendedAction;
  }

  async function handleNewSession() {
    await controller.newSession();
    sessionDropdownOpen = false;
    activeTab = "chat";
  }

  async function handleSwitchSession(sessionId: string) {
    await controller.switchSession(sessionId);
    sessionDropdownOpen = false;
    activeTab = "chat";
    emitBridgeUIEvent("ui:session_switched", { toSessionId: sessionId });
  }

  function handleClickOutside(event: MouseEvent) {
    if (
      sessionDropdownRef &&
      event.target instanceof Node &&
      !sessionDropdownRef.contains(event.target)
    ) {
      sessionDropdownOpen = false;
    }
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter += 1;
    if (event.dataTransfer?.types.includes("Files")) {
      isDragOver = true;
    }
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter -= 1;
    if (dragCounter === 0) {
      isDragOver = false;
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter = 0;
    isDragOver = false;

    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length > 0) {
      void controller.processFiles(files);
    }
  }

  $effect(() => {
    controller.setAdapter(adapter);
  });

  $effect(() => {
    emitBridgeUIEvent("ui:tab_changed", { tab: activeTab });
    emitBridgeUIEvent("ui:panel_toggled", { panel: "settings", visible: activeTab === "settings" });
  });

  $effect(() => {
    if (!sessionDropdownOpen) return undefined;
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  onDestroy(() => {
    delete (
      window as typeof window & {
        __OFFICE_AGENTS_AUTOMATION__?: TaskpaneAutomation;
      }
    ).__OFFICE_AGENTS_AUTOMATION__;
    controller.dispose();
  });

  $effect(() => {
    if (!isLocalDevRuntime()) return undefined;
    (
      window as typeof window & {
        __OFFICE_AGENTS_AUTOMATION__?: TaskpaneAutomation;
      }
    ).__OFFICE_AGENTS_AUTOMATION__ = getTaskpaneAutomation();

    return () => {
      delete (
        window as typeof window & {
          __OFFICE_AGENTS_AUTOMATION__?: TaskpaneAutomation;
        }
      ).__OFFICE_AGENTS_AUTOMATION__;
    };
  });

  const currentName = $derived(
    $runtimeState.currentSession?.name ?? "New Chat",
  );
  const truncatedName = $derived(
    currentName.length > 20 ? `${currentName.slice(0, 18)}…` : currentName,
  );
  const followMode = $derived($runtimeState.providerConfig?.followMode ?? true);
  const HeaderExtras = $derived(adapter.HeaderExtras);
  const SelectionIndicator = $derived(adapter.SelectionIndicator);
  const activeTaskTitle = $derived($runtimeState.activeTask?.userRequest ?? null);
  const contextPressure = $derived(
    getPressure($runtimeState.contextBudgetState?.usagePct),
  );
  const resumeMessage = $derived(
    getResumeMessage($runtimeState.handoff, $runtimeState.approvalRequest),
  );
  const canResume = $derived(
    Boolean($runtimeState.handoff && !$runtimeState.approvalRequest),
  );
</script>

<div
  role="application"
  class="flex flex-col h-full bg-(--chat-bg) relative"
  style="font-family: var(--chat-font-mono)"
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
  <div class="border-b border-(--chat-border) bg-(--chat-bg)">
    <div class="flex items-center justify-between px-2">
      <div class="flex">
        {#if activeTab === "chat"}
          <div class="relative" bind:this={sessionDropdownRef}>
            <button
              type="button"
              onclick={() => (sessionDropdownOpen = !sessionDropdownOpen)}
              class="flex items-center gap-1 px-3 py-2 text-xs uppercase tracking-wider border-b-2 border-(--chat-accent) text-(--chat-text-primary) transition-colors"
              style="font-family: var(--chat-font-mono)"
            >
              <MessageSquare size={12} />
              <span class="max-w-[100px] truncate">{truncatedName}</span>
              <ChevronDown
                size={12}
                class={`transition-transform ${sessionDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {#if sessionDropdownOpen}
              <div
                class="absolute top-full left-0 mt-1 w-56 bg-(--chat-bg) border border-(--chat-border) rounded shadow-lg z-50 overflow-hidden"
              >
                <button
                  type="button"
                  onclick={handleNewSession}
                  disabled={$runtimeState.isStreaming}
                  class={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors border-b border-(--chat-border) ${$runtimeState.isStreaming ? "text-(--chat-text-muted) pointer-events-none" : "text-(--chat-accent) hover:bg-(--chat-bg-secondary)"}`}
                >
                  <Plus size={14} />
                  New Chat
                </button>

                <div class="max-h-48 overflow-y-auto">
                  {#each $runtimeState.sessions as session (session.id)}
                    {@const isCurrent =
                      session.id === $runtimeState.currentSession?.id}
                    {@const isDisabled =
                      $runtimeState.isStreaming && !isCurrent}
                    <button
                      type="button"
                      disabled={isDisabled}
                      class={`flex items-center justify-between px-3 py-2 text-xs transition-colors w-full text-left ${isCurrent ? "bg-(--chat-bg-secondary)" : ""} ${isDisabled ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-(--chat-bg-secondary)"}`}
                      onclick={() => handleSwitchSession(session.id)}
                    >
                      <div class="flex items-center gap-2 min-w-0 flex-1">
                        {#if isCurrent}
                          <Check
                            size={12}
                            class="text-(--chat-accent) shrink-0"
                          />
                        {:else}
                          <div class="w-3 shrink-0"></div>
                        {/if}
                        <span class="truncate text-(--chat-text-primary)">
                          {session.name}
                        </span>
                      </div>
                      <span
                        class="text-[10px] text-(--chat-text-muted) shrink-0 ml-2"
                      >
                        {getSessionMessageCount(session)}
                      </span>
                    </button>
                  {/each}
                </div>

                {#if $runtimeState.sessions.length > 1 && $runtimeState.currentSession}
                  <button
                    type="button"
                    disabled={$runtimeState.isStreaming}
                    onclick={async (event) => {
                      event.stopPropagation();
                      await controller.deleteCurrentSession();
                      sessionDropdownOpen = false;
                    }}
                    class={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors border-t border-(--chat-border) ${$runtimeState.isStreaming ? "text-(--chat-text-muted) pointer-events-none" : "text-(--chat-error) hover:bg-(--chat-bg-secondary)"}`}
                  >
                    <Trash2 size={14} />
                    Delete Current Session
                  </button>
                {/if}
              </div>
            {/if}
          </div>
        {:else}
          <button
            type="button"
            onclick={() => (activeTab = "chat")}
            class="flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider border-b-2 border-transparent transition-colors text-(--chat-text-muted) hover:text-(--chat-text-secondary)"
            style="font-family: var(--chat-font-mono)"
          >
            <MessageSquare size={12} />
            Chat
          </button>
        {/if}

        <button
          type="button"
          onclick={() => (activeTab = "files")}
          class={`flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider border-b-2 transition-colors ${activeTab === "files" ? "border-(--chat-accent) text-(--chat-text-primary)" : "border-transparent text-(--chat-text-muted) hover:text-(--chat-text-secondary)"}`}
          style="font-family: var(--chat-font-mono)"
        >
          <FolderOpen size={12} />
          Files
        </button>

        <button
          type="button"
          onclick={() => (activeTab = "settings")}
          class={`flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider border-b-2 transition-colors ${activeTab === "settings" ? "border-(--chat-accent) text-(--chat-text-primary)" : "border-transparent text-(--chat-text-muted) hover:text-(--chat-text-secondary)"}`}
          style="font-family: var(--chat-font-mono)"
        >
          <Settings size={12} />
          Settings
        </button>
      </div>

      <div class="flex items-center">
        {#if activeTab === "chat" && HeaderExtras}
          <HeaderExtras />
        {/if}

        {#if activeTab === "chat" && (adapter.showFollowModeToggle ?? true)}
          <button
            type="button"
            onclick={() => controller.toggleFollowMode()}
            class={`p-1.5 transition-colors ${followMode ? "text-(--chat-accent) hover:text-(--chat-text-primary)" : "text-(--chat-text-muted) hover:text-(--chat-text-primary)"}`}
            data-tooltip={followMode ? "Follow mode: ON" : "Follow mode: OFF"}
          >
            {#if followMode}
              <Eye size={14} />
            {:else}
              <EyeOff size={14} />
            {/if}
          </button>
        {/if}

        <button
          type="button"
          onclick={toggleTheme}
          class="p-1.5 text-(--chat-text-muted) hover:text-(--chat-text-primary) transition-colors"
          data-tooltip={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {#if theme === "dark"}
            <Sun size={14} />
          {:else}
            <Moon size={14} />
          {/if}
        </button>

        {#if activeTab === "chat" && $runtimeState.messageCount > 0}
          <button
            type="button"
            onclick={async () => {
              await controller.clearMessages();
            }}
            class="p-1.5 text-(--chat-text-muted) hover:text-(--chat-error) transition-colors"
            data-tooltip="Clear messages"
          >
            <Trash2 size={14} />
          </button>
        {/if}
      </div>
    </div>
  </div>

  <div class:hidden={activeTab !== "chat"} class="flex flex-col flex-1 min-h-0">
    {#if activeTab === "chat"}
      <StatusStrip
        phase={$runtimeState.taskPhase}
        permissionMode={$runtimeState.permissionMode}
        pressure={contextPressure}
        taskTitle={activeTaskTitle}
        waiting={Boolean($runtimeState.waitingState)}
      />

      <ResumeTaskBanner message={resumeMessage} canResume={canResume} />

      <ApprovalDrawer
        approval={$runtimeState.approvalRequest}
        permissionMode={$runtimeState.permissionMode}
      />

      <ControlPanelsWrapper>
        {#snippet children()}
          <PlanPanel
            plan={$runtimeState.planState}
            approvalMessage={$runtimeState.approvalRequest?.uiMessage ?? null}
          />
          <div bind:this={diagnosticsWrapperRef} class="shrink-0 overflow-hidden">
            <DiagnosticsPanel runtimeState={$runtimeState} />
          </div>
          <ResizeHandle target={() => diagnosticsWrapperRef} direction="above" min={32} max={500} />
        {/snippet}
      </ControlPanelsWrapper>

      <MessageList />
      {#if SelectionIndicator}
        <SelectionIndicator />
      {/if}
      {#if $runtimeState.providerConfig}
        <div
          class="flex items-center justify-between px-3 py-1.5 text-[10px] border-t border-(--chat-border) bg-(--chat-bg-secondary) text-(--chat-text-muted)"
          style="font-family: var(--chat-font-mono)"
        >
          <div class="flex items-center gap-3">
            <span title="Input tokens">
              ↑{formatTokens($runtimeState.sessionStats.inputTokens)}
            </span>
            <span title="Output tokens">
              ↓{formatTokens($runtimeState.sessionStats.outputTokens)}
            </span>
            {#if $runtimeState.sessionStats.cacheRead > 0}
              <span title="Cache read tokens">
                R{formatTokens($runtimeState.sessionStats.cacheRead)}
              </span>
            {/if}
            {#if $runtimeState.sessionStats.cacheWrite > 0}
              <span title="Cache write tokens">
                W{formatTokens($runtimeState.sessionStats.cacheWrite)}
              </span>
            {/if}
            <span title="Total cost">
              {formatCost($runtimeState.sessionStats.totalCost)}
            </span>
            {#if $runtimeState.sessionStats.contextWindow > 0}
              <span title="Context usage">
                {formatTokens(
                  $runtimeState.sessionStats.lastInputTokens || 0,
                )}/{formatTokens(
                  $runtimeState.sessionStats.contextWindow,
                )}
              </span>
              {#if ($runtimeState.sessionStats.lastInputTokens / $runtimeState.sessionStats.contextWindow) > 0.5}
                <button
                  type="button"
                  onclick={() => controller.compactContext()}
                  disabled={$runtimeState.isStreaming}
                  class="text-(--chat-text-muted) hover:text-(--chat-accent) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Compact context"
                >
                  <Minimize2 size={10} />
                </button>
              {/if}
            {/if}
          </div>
          <div class="flex items-center gap-1">
            <span>{$runtimeState.providerConfig.provider}</span>
            <span class="text-(--chat-text-secondary)">
              {$runtimeState.providerConfig.model}
            </span>
            {#if $runtimeState.providerConfig.thinking !== "none"}
              <span class="text-(--chat-accent)">
                • {$runtimeState.providerConfig.thinking}
              </span>
            {/if}
          </div>
        </div>
      {/if}
      <ResizeHandle target={() => inputWrapperRef} direction="below" min={48} max={300} />
    {/if}
    <div bind:this={inputWrapperRef} class:hidden={activeTab !== "chat"} class="shrink-0 flex flex-col">
      <ChatInput />
    </div>
  </div>

  {#if activeTab === "files"}
    <div>
      <FilesPanel />
    </div>
  {/if}

  <div class:hidden={activeTab !== "settings"}>
    <SettingsPanel />
  </div>

  {#if isDragOver}
    <div
      class="absolute inset-0 z-50 flex items-center justify-center bg-(--chat-bg)/80 backdrop-blur-sm"
    >
      <div
        class="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-(--chat-accent) rounded-lg"
      >
        <Upload size={32} class="text-(--chat-accent)" />
        <span class="text-sm text-(--chat-text-primary)">Drop files here</span>
      </div>
    </div>
  {/if}
</div>
