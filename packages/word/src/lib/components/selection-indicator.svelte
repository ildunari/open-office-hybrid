<script lang="ts">
  import { FileText } from "lucide-svelte";
  import { onMount } from "svelte";
  import { bindOfficeDocumentHandler } from "./office-document-events";
  import { readWordSelectionPreview } from "../live-context";

  /* global Word, Office */

  interface SelectionState {
    selectedText: string;
  }

  let selection = $state<SelectionState | null>(null);
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  async function refresh() {
    try {
      selection = await readWordSelectionPreview();
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
    const officeDocument =
      typeof Office === "undefined" ? undefined : Office?.context?.document;
    const selectionEventType =
      typeof Office === "undefined"
        ? undefined
        : Office?.EventType?.DocumentSelectionChanged;

    const detach =
      officeDocument && selectionEventType
        ? bindOfficeDocumentHandler(
            officeDocument,
            selectionEventType,
            handleSelectionChanged,
          )
        : () => undefined;

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
