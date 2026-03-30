<script lang="ts">
  import { ChevronRight } from "lucide-svelte";
  import { emitBridgeUIEvent } from "./bridge-ui-events.js";

  interface Props {
    children: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  const PANELS_COLLAPSED_KEY = "oa-panels-collapsed";

  let collapsed = $state(
    localStorage.getItem(PANELS_COLLAPSED_KEY) === "true",
  );

  function toggle() {
    collapsed = !collapsed;
    localStorage.setItem(PANELS_COLLAPSED_KEY, String(collapsed));
    emitBridgeUIEvent("ui:panel_toggled", {
      panel: "control-panels",
      visible: !collapsed,
    });
  }
</script>

{#if collapsed}
  <button
    type="button"
    class="w-full flex items-center gap-1.5 px-3 border-b border-(--chat-border) bg-(--chat-bg-secondary) text-(--chat-text-muted) h-6 shrink-0"
    style="font-family: var(--chat-font-mono)"
    onclick={toggle}
    aria-expanded="false"
    aria-label="Expand panels"
  >
    <ChevronRight size={10} class="shrink-0" />
    <span class="text-[10px] uppercase tracking-widest select-none">Panels</span>
  </button>
{:else}
  <div>
    <button
      type="button"
      class="w-full flex items-center gap-1.5 px-3 border-b border-(--chat-border) bg-(--chat-bg-secondary) text-(--chat-text-muted) h-6 shrink-0"
      style="font-family: var(--chat-font-mono)"
      onclick={toggle}
      aria-expanded="true"
      aria-label="Collapse panels"
    >
      <ChevronRight size={10} class="shrink-0 rotate-90" />
      <span class="text-[10px] uppercase tracking-widest select-none">Panels</span>
    </button>
    {@render children()}
  </div>
{/if}
