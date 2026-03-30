<script lang="ts">
  import { FileText } from "lucide-svelte";
  import { onMount } from "svelte";
  import { bindOfficeDocumentHandler } from "./office-document-events";

  /* global Word, Office */

  interface SelectionState {
    selectedText: string;
  }

  let selection = $state<SelectionState | null>(null);
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  function getSelectionState(): Promise<SelectionState> {
    return Word.run(async (context) => {
      const selectionRange = context.document.getSelection();
      selectionRange.load("text");
      await context.sync();

      return {
        selectedText:
          selectionRange.text.length > 60
            ? `${selectionRange.text.substring(0, 60)}…`
            : selectionRange.text,
      };
    });
  }

  async function refresh() {
    try {
      selection = await getSelectionState();
    } catch {
      // ignore selection refresh errors
    }
  }

  function scheduleRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      void refresh();
    }, 300);
  }

  onMount(() => {
    void refresh();

    const handleSelectionChanged = () => {
      scheduleRefresh();
    };

    const detach = bindOfficeDocumentHandler(
      Office?.context?.document,
      Office.EventType.DocumentSelectionChanged,
      handleSelectionChanged,
    );

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
      detach();
    };
  });
</script>

{#if selection}
  <div
    class="flex items-center gap-1.5 px-3 py-1 text-[10px] text-(--chat-text-muted) border-t border-(--chat-border) bg-(--chat-bg-secondary)"
    style="font-family: var(--chat-font-mono)"
  >
    <FileText size={10} class="shrink-0 opacity-60" />
    {#if selection.selectedText}
      <span class="truncate max-w-[200px]">&ldquo;{selection.selectedText}&rdquo;</span>
    {:else}
      <span>No selection</span>
    {/if}
  </div>
{/if}
