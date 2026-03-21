<script lang="ts">
  import type { ApprovalRequest, PermissionMode } from "@office-agents/sdk";
  import { getChatContext } from "./chat-runtime-context";
  import { emitBridgeUIEvent } from "./bridge-ui-events.js";

  interface Props {
    approval: ApprovalRequest | null;
    permissionMode: PermissionMode;
  }

  let { approval, permissionMode }: Props = $props();
  const chat = getChatContext();

  $effect(() => {
    if (approval) {
      emitBridgeUIEvent("ui:approval_shown", { actionClass: approval.actionClass ?? "unknown" });
    }
  });
</script>

{#if approval}
  <div class="mx-3 mt-3 border border-(--chat-border) bg-(--chat-bg-secondary) rounded-sm px-3 py-2 text-xs flex flex-col">
    <div class="text-[10px] uppercase tracking-wider text-(--chat-text-muted)">
      approval needed
    </div>
    <div class="mt-1 text-(--chat-text-primary) panel-expandable min-h-0 max-h-40">
      {approval.reason}
    </div>
    {#if approval.actionClass}
      <div class="mt-1 text-(--chat-text-muted) shrink-0">
        action: {approval.actionClass}
      </div>
    {/if}
    {#if approval.scopes && approval.scopes.length > 0}
      <div class="mt-1 text-(--chat-text-muted) shrink-0">
        scope: {approval.scopes.map((scope) => scope.ref).join(", ")}
      </div>
    {/if}
    <div class="mt-3 flex justify-end shrink-0">
      {#if permissionMode === "read_only"}
        <div class="text-[11px] text-(--chat-text-muted)">
          Change permission mode to continue.
        </div>
      {:else}
        <button
          type="button"
          onclick={() => {
            emitBridgeUIEvent("ui:approval_responded", { actionClass: approval?.actionClass ?? "unknown", approved: true });
            chat.approvePending();
          }}
          class="px-2.5 py-1 text-[11px] rounded-sm bg-(--chat-accent) text-white hover:opacity-90 transition-opacity"
        >
          Approve and continue
        </button>
      {/if}
    </div>
  </div>
{/if}
