<script lang="ts">
  import type { SlashCommand } from "./slash-commands";

  interface Props {
    commands: SlashCommand[];
    selectedIndex: number;
    onselect: (command: SlashCommand) => void;
  }

  let { commands, selectedIndex, onselect }: Props = $props();
</script>

{#if commands.length > 0}
  <div
    role="listbox"
    aria-label="Slash commands"
    class="absolute bottom-full left-0 right-0 mb-1 border border-(--chat-border) bg-(--chat-bg) shadow-sm overflow-hidden z-10"
    style="border-radius: var(--chat-radius); font-family: var(--chat-font-mono)"
  >
    {#each commands as command, i (command.name)}
      <button
        type="button"
        role="option"
        id="slash-cmd-{command.name}"
        aria-selected={i === selectedIndex}
        class="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors {i === selectedIndex
          ? 'bg-(--chat-bg-secondary) text-(--chat-text-primary)'
          : 'text-(--chat-text-secondary) hover:bg-(--chat-bg-secondary)'}"
        onmousedown={(e: MouseEvent) => { e.preventDefault(); onselect(command); }}
      >
        <span class="text-(--chat-accent) shrink-0">/{command.name}</span>
        <span class="text-(--chat-text-muted) truncate">{command.description}</span>
      </button>
    {/each}
  </div>
{/if}
