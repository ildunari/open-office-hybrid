<script lang="ts">
  import type { PermissionMode, TaskPhase } from "@office-agents/sdk";

  interface Props {
    phase: TaskPhase;
    permissionMode: PermissionMode;
    pressure: "low" | "medium" | "high" | "critical" | null;
    taskTitle?: string | null;
    waiting?: boolean;
  }

  let {
    phase,
    permissionMode,
    pressure,
    taskTitle = null,
    waiting = false,
  }: Props = $props();
</script>

<div class="border-b border-(--chat-border) bg-(--chat-bg-secondary) px-3 py-1.5 text-[10px] uppercase tracking-wider text-(--chat-text-muted)">
  <div class="flex items-center gap-3 flex-wrap">
    <span>phase: <span class="text-(--chat-text-primary)">{phase}</span></span>
    <span>mode: <span class="text-(--chat-text-primary)">{permissionMode}</span></span>
    <span>context: <span class="text-(--chat-text-primary)">{pressure ?? "n/a"}</span></span>
    {#if taskTitle}
      <span class="normal-case tracking-normal text-(--chat-text-secondary) truncate max-w-[220px]">
        {taskTitle}
      </span>
    {/if}
    {#if waiting}
      <span class="px-1.5 py-0.5 rounded-sm bg-(--chat-warning-bg) text-(--chat-warning)">
        waiting
      </span>
    {/if}
  </div>
</div>
