<script lang="ts">
  import { getChatContext } from "./chat-runtime-context";

  interface Props {
    message: string | null;
    canResume?: boolean;
  }

  let { message, canResume = false }: Props = $props();
  const chat = getChatContext();
</script>

{#if message}
  <div class="mx-3 mt-3 border border-(--chat-border) bg-(--chat-warning-bg) rounded-sm px-3 py-2 text-xs text-(--chat-warning) flex flex-col">
    <div class="panel-expandable min-h-0 max-h-32">{message}</div>
    {#if canResume}
      <div class="mt-3 flex justify-end">
        <button
          type="button"
          onclick={() => chat.resumeFromHandoff()}
          class="px-2.5 py-1 text-[11px] rounded-sm bg-(--chat-accent) text-white hover:opacity-90 transition-opacity"
        >
          Resume task
        </button>
      </div>
    {/if}
  </div>
{/if}
