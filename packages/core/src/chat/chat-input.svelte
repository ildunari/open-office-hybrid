<script lang="ts">
  import { Paperclip, Send, Square, X } from "lucide-svelte";
  import { getChatContext } from "./chat-runtime-context";
  import SlashCommandDropdown from "./slash-command-dropdown.svelte";
  import { defaultCommands, filterCommands, type SlashCommand } from "./slash-commands";

  const LINE_HEIGHT = 20;
  const MIN_ROWS = 1;
  const MAX_ROWS = 8;

  const chat = getChatContext();
  const runtimeState = chat.state;

  let input = $state("");
  let textareaRef: HTMLTextAreaElement | null = null;
  let fileInputRef: HTMLInputElement | null = null;
  let slashSelectedIndex = $state(0);

  const isSlashMode = $derived(input.startsWith("/") && !input.includes(" "));
  const matchedCommands = $derived(
    isSlashMode ? filterCommands(input.slice(1), defaultCommands) : [],
  );

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  let rafId = 0;

  function scheduleResize() {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(autoResize);
  }

  function autoResize() {
    if (!textareaRef) return;
    // Use overflow:hidden + auto height to measure natural content height
    // without collapsing to 0px (which causes visible flash)
    textareaRef.style.overflow = "hidden";
    textareaRef.style.height = "auto";
    const min = LINE_HEIGHT * MIN_ROWS;
    const max = LINE_HEIGHT * MAX_ROWS;
    const scrollH = textareaRef.scrollHeight;
    const clamped = Math.max(min, Math.min(scrollH, max));
    textareaRef.style.height = `${clamped}px`;
    textareaRef.style.overflow = scrollH > max ? "auto" : "hidden";
  }

  function selectSlashCommand(command: SlashCommand) {
    input = "";
    slashSelectedIndex = 0;
    void command.handler(chat);
  }

  async function handleSubmit() {
    if (isSlashMode && matchedCommands.length > 0) {
      selectSlashCommand(matchedCommands[slashSelectedIndex]!);
      return;
    }

    const trimmed = input.trim();
    if (!trimmed || $runtimeState.isStreaming) return;

    const attachmentNames = $runtimeState.uploads.map((upload) => upload.name);
    input = "";
    await chat.sendMessage(
      trimmed,
      attachmentNames.length > 0 ? attachmentNames : undefined,
    );
  }

  async function handleFileSelect(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    await chat.processFiles(Array.from(files));
    if (fileInputRef) {
      fileInputRef.value = "";
    }
  }

  $effect(() => {
    // Reset selection index whenever the input value changes
    input;
    slashSelectedIndex = 0;
  });

  $effect(() => {
    input;
    slashSelectedIndex;
    scheduleResize();
  });
</script>

<div
  class="border-t border-(--chat-border) px-3 py-2 bg-(--chat-bg)"
  style="font-family: var(--chat-font-mono)"
>
  {#if $runtimeState.error}
    <div class="text-(--chat-error) text-xs mb-2 px-1">
      {$runtimeState.error}
    </div>
  {/if}

  {#if $runtimeState.uploads.length > 0}
    <div class="flex flex-wrap gap-1.5 mb-2">
      {#each $runtimeState.uploads as file (file.name)}
        <div
          class="flex items-center gap-1 px-2 py-1 text-[10px] bg-(--chat-bg-secondary) border border-(--chat-border) text-(--chat-text-secondary)"
          style="border-radius: var(--chat-radius)"
        >
          <span class="max-w-[120px] truncate" title={file.name}>
            {file.name}
          </span>
          {#if file.size > 0}
            <span class="text-(--chat-text-muted)">
              {formatFileSize(file.size)}
            </span>
          {/if}
          <button
            type="button"
            onclick={() => chat.removeUpload(file.name)}
            class="ml-0.5 text-(--chat-text-muted) hover:text-(--chat-error) transition-colors"
            title="Remove from list"
          >
            <X size={10} />
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <input
    bind:this={fileInputRef}
    type="file"
    multiple
    onchange={handleFileSelect}
    class="hidden"
    accept="image/*,.txt,.csv,.json,.xml,.md,.html,.css,.js,.ts,.py,.sh"
  />

  <div
    class="relative bg-(--chat-input-bg) border border-(--chat-border) focus-within:border-(--chat-border-active) transition-colors"
    style="border-radius: var(--chat-radius)"
  >
    {#if isSlashMode && matchedCommands.length > 0}
      <SlashCommandDropdown
        commands={matchedCommands}
        selectedIndex={slashSelectedIndex}
        onselect={selectSlashCommand}
      />
    {/if}
    <textarea
      bind:this={textareaRef}
      bind:value={input}
      data-live-review-textarea
      oninput={autoResize}
      onkeydown={(event) => {
        if (isSlashMode && matchedCommands.length > 0) {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            slashSelectedIndex = (slashSelectedIndex + 1) % matchedCommands.length;
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            slashSelectedIndex = (slashSelectedIndex - 1 + matchedCommands.length) % matchedCommands.length;
            return;
          }
          if (event.key === "Tab") {
            event.preventDefault();
            selectSlashCommand(matchedCommands[slashSelectedIndex]!);
            return;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            input = "";
            return;
          }
        }
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          void handleSubmit();
        }
      }}
      placeholder={$runtimeState.providerConfig
        ? "Type a message..."
        : "Configure API key in settings"}
      disabled={!$runtimeState.providerConfig}
      aria-label="Chat message"
      aria-activedescendant={isSlashMode && matchedCommands.length > 0 ? `slash-cmd-${matchedCommands[slashSelectedIndex]?.name}` : undefined}
      class="w-full resize-none bg-transparent text-(--chat-text-primary) text-sm px-3 pt-2 pb-0 border-none outline-none placeholder:text-(--chat-text-muted) disabled:opacity-50 disabled:cursor-not-allowed"
      style={`font-family: var(--chat-font-mono); line-height: ${LINE_HEIGHT}px; height: ${LINE_HEIGHT * MIN_ROWS}px;`}
    ></textarea>

    <div class="flex items-center justify-between px-1.5 py-1">
      <button
        type="button"
        onclick={() => fileInputRef?.click()}
        disabled={$runtimeState.isUploading || $runtimeState.isStreaming}
        class="flex items-center justify-center w-6 h-5 text-(--chat-text-muted) hover:text-(--chat-text-primary) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Upload files"
      >
        <Paperclip
          size={13}
          class={$runtimeState.isUploading ? "animate-pulse" : ""}
        />
      </button>

      {#if $runtimeState.isStreaming}
        <button
          type="button"
          onclick={() => chat.abort()}
          class="flex items-center justify-center w-6 h-5 text-(--chat-error) hover:text-(--chat-bg) hover:bg-(--chat-error) transition-colors"
          style="border-radius: var(--chat-radius)"
        >
          <Square size={13} />
        </button>
      {:else}
        <button
          type="button"
          onclick={handleSubmit}
          data-live-review-send
          disabled={!$runtimeState.providerConfig || !input.trim()}
          class="flex items-center justify-center w-6 h-5 text-(--chat-text-muted) hover:text-(--chat-text-primary) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={13} />
        </button>
      {/if}
    </div>
  </div>
</div>
