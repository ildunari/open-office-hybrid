<script lang="ts">
  import type { ExecutionPlan } from "@office-agents/sdk";
  import { ChevronDown } from "lucide-svelte";
  import TaskProgressBar from "./task-progress-bar.svelte";
  import { emitBridgeUIEvent } from "./bridge-ui-events.js";

  interface Props {
    plan: ExecutionPlan | null;
    approvalMessage?: string | null;
  }

  let { plan, approvalMessage = null }: Props = $props();
  let expanded = $state(true);

  const completedCount = $derived(
    plan?.steps.filter((step) => step.status === "completed").length ?? 0,
  );
</script>

{#if plan}
  <div class="border-b border-(--chat-border) bg-(--chat-bg-secondary) px-3 py-2">
    <button
      type="button"
      class="w-full flex items-center justify-between gap-2 text-left"
      onclick={() => {
        expanded = !expanded;
        emitBridgeUIEvent("ui:panel_toggled", { panel: "plan", visible: expanded });
      }}
    >
      <div class="min-w-0">
        <div class="text-[10px] uppercase tracking-widest text-(--chat-text-muted)">
          active plan
        </div>
        <div class="text-xs text-(--chat-text-primary) mt-0.5 truncate">
          {plan.summary || plan.userRequest || "Execution plan"}
        </div>
      </div>
      <ChevronDown
        size={12}
        class={`transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
      />
    </button>

    <div class="mt-2">
      <TaskProgressBar completed={completedCount} total={plan.steps.length} />
    </div>

    {#if approvalMessage}
      <div class="mt-2 text-[11px] text-(--chat-warning) bg-(--chat-warning-bg) border border-(--chat-border) rounded-sm px-2 py-1.5">
        {approvalMessage}
      </div>
    {/if}

    {#if expanded}
      <div class="panel-expandable mt-2 space-y-1 max-h-48">
        {#each plan.steps as step (step.id)}
          <div class="flex items-start gap-2 text-xs">
            <div class={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${step.status === "completed" ? "bg-green-500" : step.status === "active" ? "bg-(--chat-accent)" : step.status === "failed" ? "bg-red-500" : "bg-(--chat-text-muted)"}`}></div>
            <div class="min-w-0">
              <div class="text-(--chat-text-primary)">{step.description}</div>
              <div class="text-(--chat-text-muted)">
                {step.successCriteria}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
