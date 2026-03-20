<script lang="ts">
  import type { RuntimeState } from "@office-agents/sdk";
  import { ChevronDown } from "lucide-svelte";
  import { buildDiagnosticsModel } from "./diagnostics";

  interface Props {
    runtimeState: RuntimeState;
    initiallyExpanded?: boolean;
  }

  let { runtimeState, initiallyExpanded = false }: Props = $props();
  let expanded = $state(false);
  let hasToggled = $state(false);
  const isExpanded = $derived(hasToggled ? expanded : initiallyExpanded);

  const model = $derived(buildDiagnosticsModel(runtimeState));

  function formatWhen(timestamp?: number | null): string {
    if (!timestamp) return "n/a";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
</script>

<div class="border-b border-(--chat-border) bg-(--chat-bg-secondary) px-3 py-2">
  <button
    type="button"
    class="w-full flex items-center justify-between gap-2 text-left"
    onclick={() => {
      hasToggled = true;
      expanded = !isExpanded;
    }}
  >
    <div class="min-w-0">
      <div class="text-[10px] uppercase tracking-widest text-(--chat-text-muted)">
        diagnostics
      </div>
      <div class="text-xs text-(--chat-text-primary) mt-0.5 truncate">
        {model.instructionSources.length} instruction sources, {model.activeHooks.length} hooks, {model.activePatterns.length} patterns, {model.activeVerifierIds.length} verifiers
      </div>
    </div>
    <ChevronDown
      size={12}
      class={`transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}
    />
  </button>

  {#if isExpanded}
    <div class="mt-3 grid gap-3 text-[11px]">
      <section class="grid gap-1">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">policy</div>
        <div class="text-(--chat-text-primary)">
          mode: {runtimeState.permissionMode}
        </div>
        <div class="text-(--chat-text-primary)">
          boundary: {model.capabilityBoundary.mode} - {model.capabilityBoundary.description}
        </div>
        <div class="text-(--chat-text-primary)">
          approvals: {model.approvalPolicy.mode} - {model.approvalPolicy.description}
        </div>
      </section>

      <section class="grid gap-1">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">instruction sources</div>
        {#each model.instructionSources as source (source.id)}
          <div class="rounded-sm border border-(--chat-border) px-2 py-1">
            <div class="text-(--chat-text-primary)">
              {source.label} <span class="text-(--chat-text-muted)">({source.kind})</span>
            </div>
            <div class="text-(--chat-text-secondary) break-words">{source.summary}</div>
          </div>
        {/each}
      </section>

      <section class="grid gap-1">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">active framework</div>
        <div class="text-(--chat-text-primary)">
          hooks: {model.activeHooks.length > 0 ? model.activeHooks.join(", ") : "none"}
        </div>
        <div class="text-(--chat-text-primary)">
          patterns:
          {model.activePatterns.length > 0
            ? model.activePatterns.map((pattern) => pattern.id).join(", ")
            : "none"}
        </div>
        <div class="text-(--chat-text-primary)">
          verifiers:
          {model.activeVerifierIds.length > 0
            ? model.activeVerifierIds.join(", ")
            : "none"}
        </div>
      </section>

      <section class="grid gap-1">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">threads</div>
        {#if model.activeThread}
          <div class="text-(--chat-text-primary)">
            active: {model.activeThread.title} ({model.activeThread.status})
          </div>
        {:else}
          <div class="text-(--chat-text-muted)">No active thread.</div>
        {/if}
        {#if model.otherThreads.length > 0}
          <div class="text-(--chat-text-secondary)">
            archived/other:
            {model.otherThreads.map((thread) => `${thread.title} (${thread.status})`).join(", ")}
          </div>
        {/if}
        <div class="text-(--chat-text-primary)">
          compaction:
          {#if model.compactionState}
            {model.compactionState.artifactCount} artifacts, last thread {model.compactionState.lastCompactedThreadId ?? "n/a"} at {formatWhen(model.compactionState.updatedAt)}
          {:else}
            none
          {/if}
        </div>
      </section>

      <section class="grid gap-1">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">policy trace</div>
        {#if model.recentPolicyTrace.length > 0}
          {#each model.recentPolicyTrace as trace (trace.id)}
            <div class="rounded-sm border border-(--chat-border) px-2 py-1">
              <div class="text-(--chat-text-primary)">
                {trace.event} -> {trace.outcome}
                <span class="text-(--chat-text-muted)">at {formatWhen(trace.at)}</span>
              </div>
              <div class="text-(--chat-text-secondary) break-words">{trace.reason}</div>
            </div>
          {/each}
        {:else}
          <div class="text-(--chat-text-muted)">No policy trace entries yet.</div>
        {/if}
      </section>

      <section class="grid gap-1">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">completion</div>
        {#if model.completionArtifacts.length > 0}
          {#each model.completionArtifacts as artifact (artifact.id)}
            <div class="rounded-sm border border-(--chat-border) px-2 py-1">
              <div class="text-(--chat-text-primary)">
                {artifact.summary}
                <span class="text-(--chat-text-muted)">({artifact.verificationStatus})</span>
              </div>
              <div class="text-(--chat-text-secondary)">
                thread {artifact.threadId} at {formatWhen(artifact.createdAt)}
              </div>
            </div>
          {/each}
        {:else}
          <div class="text-(--chat-text-muted)">No completion artifacts yet.</div>
        {/if}

        <div class="text-(--chat-text-primary)">
          latest verification:
          {#if model.lastVerification}
            {model.lastVerification.status} across {model.lastVerification.results.length} suites
          {:else}
            none
          {/if}
        </div>
      </section>
    </div>
  {/if}
</div>
