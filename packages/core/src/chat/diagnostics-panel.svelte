<script lang="ts">
  import { ChevronDown } from "lucide-svelte";
  import {
    buildDiagnosticsModel,
    type DiagnosticsStateInput,
  } from "./diagnostics";
  import { emitBridgeUIEvent } from "./bridge-ui-events.js";

  interface Props {
    runtimeState: DiagnosticsStateInput;
    initiallyExpanded?: boolean;
  }

  let { runtimeState, initiallyExpanded = false }: Props = $props();
  let expanded = $state(false);
  let hasToggled = $state(false);
  const isExpanded = $derived(hasToggled ? expanded : initiallyExpanded);
  const summary = $derived({
    instructionSourceCount: runtimeState.instructionSources.length,
    activeHookCount: runtimeState.activeHookNames.length,
    activePatternCount: runtimeState.activePatternMetadata.length,
    activeVerifierCount: runtimeState.activeVerifierIds.length,
  });

  const model = $derived.by(() =>
    isExpanded ? buildDiagnosticsModel(runtimeState) : null,
  );

  function formatWhen(timestamp?: number | null): string {
    if (!timestamp) return "n/a";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
</script>

<div class="border-b border-(--chat-border) bg-(--chat-bg-secondary) px-3 py-2 overflow-hidden">
  <button
    type="button"
    class="w-full flex items-center justify-between gap-2 text-left"
    onclick={() => {
      hasToggled = true;
      expanded = !isExpanded;
      emitBridgeUIEvent("ui:panel_toggled", { panel: "diagnostics", visible: !isExpanded });
    }}
  >
    <div class="min-w-0">
      <div class="text-[10px] uppercase tracking-widest text-(--chat-text-muted)">
        diagnostics
      </div>
      <div class="text-xs text-(--chat-text-primary) mt-0.5 truncate">
        {summary.instructionSourceCount} instruction sources, {summary.activeHookCount} hooks, {summary.activePatternCount} patterns, {summary.activeVerifierCount} verifiers
      </div>
    </div>
    <ChevronDown
      size={12}
      class={`transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}
    />
  </button>

  {#if isExpanded}
    {@const expandedModel = model}
    {#if expandedModel}
    <div class="panel-expandable mt-3 grid gap-3 text-[11px]">
      <section class="grid gap-1 min-w-0">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">runtime truth</div>
        <div class="text-(--chat-text-primary) break-words">
          mode: {expandedModel.runtimeTruth.mode}
        </div>
        <div class="text-(--chat-text-primary) break-words">
          task phase: {expandedModel.runtimeTruth.taskPhase}
        </div>
        <div class="text-(--chat-text-primary) break-words">
          waiting:
          {#if expandedModel.runtimeTruth.waitingState}
            {expandedModel.runtimeTruth.waitingState}
            {#if expandedModel.runtimeTruth.waitingReason}
              {" - "}{expandedModel.runtimeTruth.waitingReason}
            {/if}
          {:else}
            none
          {/if}
        </div>
        <div class="text-(--chat-text-primary) break-words">
          handoff:
          {expandedModel.runtimeTruth.handoffSummary ?? "none"}
        </div>
        <div class="text-(--chat-text-primary) break-words">
          next action:
          {expandedModel.runtimeTruth.nextRecommendedAction ?? "none"}
        </div>
        <div class="text-(--chat-text-primary) break-words">
          verification:
          {#if expandedModel.runtimeTruth.verificationStatus}
            {expandedModel.runtimeTruth.verificationStatus}
            {#if expandedModel.runtimeTruth.verificationRetryable}
              {" (retryable)"}
            {/if}
          {:else}
            none
          {/if}
        </div>
        <div class="text-(--chat-text-primary) break-words">
          degraded guardrails:
          {#if expandedModel.runtimeTruth.degradedGuardrails.length > 0}
            {expandedModel.runtimeTruth.degradedGuardrails.join(" | ")}
          {:else}
            none
          {/if}
        </div>
      </section>

      <section class="grid gap-1 min-w-0">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">policy</div>
        <div class="text-(--chat-text-primary) break-words">
          mode: {runtimeState.permissionMode}
        </div>
        <div class="text-(--chat-text-primary) break-words">
          boundary: {expandedModel.capabilityBoundary.mode} - {expandedModel.capabilityBoundary.description}
        </div>
        <div class="text-(--chat-text-primary) break-words">
          approvals: {expandedModel.approvalPolicy.mode} - {expandedModel.approvalPolicy.description}
        </div>
      </section>

      <section class="grid gap-1 min-w-0">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">instruction sources</div>
        {#each expandedModel.instructionSources as source (source.id)}
          <div class="rounded-sm border border-(--chat-border) px-2 py-1 min-w-0">
            <div class="text-(--chat-text-primary) break-words">
              {source.label} <span class="text-(--chat-text-muted)">({source.kind})</span>
            </div>
            <div class="text-(--chat-text-secondary) break-words">{source.summary}</div>
          </div>
        {/each}
      </section>

      <section class="grid gap-1 min-w-0">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">prompt provenance</div>
        {#if expandedModel.promptProvenance}
          <div class="text-(--chat-text-primary) break-words">
            provider/model: {expandedModel.promptProvenance.provider} / {expandedModel.promptProvenance.model}
          </div>
          <div class="text-(--chat-text-primary) break-words">
            provider family: {expandedModel.promptProvenance.providerFamily}
          </div>
          <div class="text-(--chat-text-primary) break-words">
            phase: {expandedModel.promptProvenance.phase}
          </div>
          <div class="text-(--chat-text-primary) break-words">
            runtime notes:
            {#if expandedModel.promptProvenance.runtimeNotes.length > 0}
              {expandedModel.promptProvenance.runtimeNotes.join(" | ")}
            {:else}
              none
            {/if}
          </div>
          {#each expandedModel.promptProvenance.contributors as contributor (contributor.id)}
            <div class="rounded-sm border border-(--chat-border) px-2 py-1 min-w-0">
              <div class="text-(--chat-text-primary) break-words">
                {contributor.order + 1}. {contributor.label}
                <span class="text-(--chat-text-muted)">({contributor.kind})</span>
              </div>
              <div class="text-(--chat-text-secondary) break-words">{contributor.summary}</div>
              {#if contributor.path}
                <div class="text-(--chat-text-muted) break-words">{contributor.path}</div>
              {/if}
            </div>
          {/each}
        {:else}
          <div class="text-(--chat-text-muted)">No prompt provenance captured yet.</div>
        {/if}
      </section>

      <section class="grid gap-1 min-w-0">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">active framework</div>
        <div class="text-(--chat-text-primary) break-words">
          hooks: {expandedModel.activeHooks.length > 0 ? expandedModel.activeHooks.join(", ") : "none"}
        </div>
        <div class="text-(--chat-text-primary) break-words">
          patterns:
          {expandedModel.activePatterns.length > 0
            ? expandedModel.activePatterns.map((pattern) => pattern.id).join(", ")
            : "none"}
        </div>
        <div class="text-(--chat-text-primary) break-words">
          verifiers:
          {expandedModel.activeVerifierIds.length > 0
            ? expandedModel.activeVerifierIds.join(", ")
            : "none"}
        </div>
      </section>

      <section class="grid gap-1 min-w-0">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">threads</div>
        {#if expandedModel.activeThread}
          <div class="text-(--chat-text-primary) break-words">
            active: {expandedModel.activeThread.title} ({expandedModel.activeThread.status})
          </div>
        {:else}
          <div class="text-(--chat-text-muted)">No active thread.</div>
        {/if}
        {#if expandedModel.otherThreads.length > 0}
          <div class="text-(--chat-text-secondary) break-words">
            archived/other:
            {expandedModel.otherThreads.map((thread) => `${thread.title} (${thread.status})`).join(", ")}
          </div>
        {/if}
        <div class="text-(--chat-text-primary) break-words">
          compaction:
          {#if expandedModel.compactionState}
            {expandedModel.compactionState.artifactCount} artifacts, last thread {expandedModel.compactionState.lastCompactedThreadId ?? "n/a"} at {formatWhen(expandedModel.compactionState.updatedAt)}
          {:else}
            none
          {/if}
        </div>
      </section>

      <section class="grid gap-1 min-w-0">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">policy trace</div>
        {#if expandedModel.recentPolicyTrace.length > 0}
          {#each expandedModel.recentPolicyTrace as trace (trace.id)}
            <div class="rounded-sm border border-(--chat-border) px-2 py-1 min-w-0">
              <div class="text-(--chat-text-primary) break-words">
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

      <section class="grid gap-1 min-w-0">
        <div class="uppercase tracking-wider text-(--chat-text-muted)">completion</div>
        {#if expandedModel.completionArtifacts.length > 0}
          {#each expandedModel.completionArtifacts as artifact (artifact.id)}
            <div class="rounded-sm border border-(--chat-border) px-2 py-1 min-w-0">
              <div class="text-(--chat-text-primary) break-words">
                {artifact.summary}
                <span class="text-(--chat-text-muted)">({artifact.verificationStatus})</span>
              </div>
              <div class="text-(--chat-text-secondary) break-words">
                thread {artifact.threadId} at {formatWhen(artifact.createdAt)}
              </div>
            </div>
          {/each}
        {:else}
          <div class="text-(--chat-text-muted)">No completion artifacts yet.</div>
        {/if}

        <div class="text-(--chat-text-primary)">
          latest verification:
          {#if expandedModel.lastVerification}
            {expandedModel.lastVerification.status} across {expandedModel.lastVerification.results.length} suites
          {:else}
            none
          {/if}
        </div>
      </section>
    </div>
    {/if}
  {/if}
</div>
