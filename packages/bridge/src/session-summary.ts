import type {
  BridgeRuntimeStateSlice,
  BridgeSessionSnapshot,
} from "./protocol";

function truncate(text: string, max = 96): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
}

function buildTargetIdentity(snapshot: BridgeSessionSnapshot): string[] {
  const appLabel = snapshot.appName?.trim() || snapshot.app;
  const parts = [
    appLabel,
    `doc:${snapshot.documentId}`,
    `session:${snapshot.sessionId}`,
  ];
  if (snapshot.host?.href) {
    parts.push(`target:${snapshot.host.href}`);
  }
  return parts;
}

function buildRuntimeStatus(runtimeState: BridgeRuntimeStateSlice): string[] {
  const parts: string[] = [];
  parts.push(runtimeState.isStreaming ? "streaming" : "idle");
  parts.push(runtimeState.mode);

  const plan = runtimeState.activePlanSummary;
  if (plan) {
    parts.push(
      runtimeState.mode === "blocked" || runtimeState.mode === "completed"
        ? `plan:${plan.status}`
        : plan.activeStepIndex >= 0
          ? `plan:step${plan.activeStepIndex + 1}/${plan.stepCount}`
          : "plan:done",
    );
  } else {
    parts.push("no-plan");
  }

  if (runtimeState.waitingState) {
    parts.push(`waiting:${runtimeState.waitingState}`);
  }
  if (runtimeState.lastVerification) {
    parts.push(`verify:${runtimeState.lastVerification.status}`);
  }
  if (runtimeState.degradedGuardrails.length > 0) {
    parts.push(`degraded:${runtimeState.degradedGuardrails.length}`);
  }
  if (runtimeState.promptProvenance) {
    parts.push(
      `prompt:${runtimeState.promptProvenance.providerFamily}/${runtimeState.promptProvenance.phase}/${runtimeState.promptProvenance.contributorCount}`,
    );
  }
  if (runtimeState.nextRecommendedAction) {
    parts.push(`next:${truncate(runtimeState.nextRecommendedAction)}`);
  }
  if (runtimeState.latestCompletion?.summary) {
    parts.push(`completion:${truncate(runtimeState.latestCompletion.summary)}`);
  }

  return parts;
}

export function buildSessionSummaryLine(
  snapshot: BridgeSessionSnapshot,
): string {
  const parts = buildTargetIdentity(snapshot);
  const runtimeState = snapshot.runtimeState;
  if (!runtimeState) {
    return `${parts.join(" | ")} | no runtime state`;
  }

  parts.push(...buildRuntimeStatus(runtimeState));
  const tokens =
    runtimeState.sessionStats.inputTokens +
    runtimeState.sessionStats.outputTokens;
  parts.push(`${Math.round(tokens / 1000)}k tokens`);
  parts.push(`$${runtimeState.sessionStats.totalCost.toFixed(2)}`);
  parts.push(`${snapshot.tools.length} tools`);

  return parts.join(" | ");
}
