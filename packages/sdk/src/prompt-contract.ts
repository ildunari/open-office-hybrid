import type { HostApp } from "./orchestration/types";
import type { RuntimeMode, TaskRecord } from "./planning";
import type { ProviderConfig } from "./provider-config";

export type PromptProviderFamily = "claude" | "gpt" | "gemini" | "generic";

export type PromptPhase =
  | "mutation"
  | "reviewer_live_review"
  | "blocked"
  | "resume"
  | "discuss";

function inferProviderFamily(
  config: ProviderConfig | null | undefined,
): PromptProviderFamily {
  if (!config) return "generic";

  const provider = `${config.provider} ${config.apiType ?? ""}`.toLowerCase();
  const model = config.model.toLowerCase();

  if (
    provider.includes("anthropic") ||
    provider.includes("claude") ||
    model.includes("claude")
  ) {
    return "claude";
  }

  if (
    provider.includes("openai") ||
    provider.includes("gpt") ||
    provider.includes("codex") ||
    model.includes("gpt") ||
    model.includes("o1") ||
    model.includes("o3") ||
    model.includes("o4")
  ) {
    return "gpt";
  }

  if (
    provider.includes("google") ||
    provider.includes("gemini") ||
    provider.includes("vertex") ||
    model.includes("gemini")
  ) {
    return "gemini";
  }

  return "generic";
}

function inferPromptPhase(
  content: string,
  mode: RuntimeMode,
  task: TaskRecord | null | undefined,
): PromptPhase {
  const normalizedContent = content.toLowerCase();

  if (mode === "blocked" || mode === "awaiting_approval") {
    return "blocked";
  }

  if (
    (task?.resumeCount ?? 0) > 0 &&
    (mode === "execute" || mode === "verify")
  ) {
    return "resume";
  }

  if (
    /live[-\s]?review|live reviewer|reviewer check|review-only|read-only evidence|reviewer loop/.test(
      normalizedContent,
    )
  ) {
    return "reviewer_live_review";
  }

  if (mode === "plan" || mode === "execute" || mode === "verify") {
    return "mutation";
  }

  if (
    /\brewrite\b|\bedit\b|\bfix\b|\bupdate\b|\bchange\b|\binsert\b|\bdelete\b|\breplace\b/.test(
      normalizedContent,
    )
  ) {
    return "mutation";
  }

  return "discuss";
}

function buildProviderGuidance(
  family: PromptProviderFamily,
  config: ProviderConfig | null | undefined,
): string[] {
  const thinking =
    config?.thinking && config.thinking !== "none"
      ? `Thinking level is set to ${config.thinking}; use that budget for the current task only.`
      : "Thinking is not elevated for this run; stay concise and decisive.";

  switch (family) {
    case "claude":
      return [
        "Provider profile: Claude/Anthropic-style instruction framing is active for this run.",
        "Use XML-tagged sections when structure helps, and treat instructions literally rather than filling in extra unstated work.",
        "Prefer explained conditionals over aggressive imperative wording in your own planning and execution notes.",
        thinking,
      ];
    case "gpt":
      return [
        "Provider profile: GPT/OpenAI-style instruction framing is active for this run.",
        "Scope discipline matters: do only what was requested and avoid adding extra deliverables, abstractions, or documentation.",
        "Use direct CTCO-style execution framing when you need structure: context, task, constraints, output.",
        thinking,
      ];
    case "gemini":
      return [
        "Provider profile: Gemini/Google-style instruction framing is active for this run.",
        "Keep instructions explicit, grounded in current context, and avoid assuming hidden state.",
        "Use lightweight structure and make tool intent obvious before acting.",
        thinking,
      ];
    default:
      return [
        "Provider profile: generic compatibility framing is active for this run.",
        "Rely on explicit instructions from the prompt and current runtime state; do not infer extra objectives.",
        thinking,
      ];
  }
}

function buildPhaseGuidance(phase: PromptPhase, hostApp?: HostApp): string[] {
  const hostLabel = hostApp ?? "office";

  switch (phase) {
    case "mutation":
      return [
        `Phase contract: this is a ${hostLabel} mutation run.`,
        "Inspect only the smallest scope needed for the next safe step.",
        "Once the target scope is clear, do one bounded Word write, then reread that same scope immediately before expanding.",
        "Do not drift into reviewer-only evidence gathering or blocked-state narration unless the runtime state actually changes.",
      ];
    case "reviewer_live_review":
      return [
        "Phase contract: this is a reviewer/live-review pass.",
        "Stay read-only and gather evidence from the permitted review path only.",
        "Do not create a new mutation plan, do not execute writes, and do not claim mutation success.",
      ];
    case "blocked":
      return [
        "Phase contract: the task is currently blocked.",
        "Do not continue broad exploration or new writes while the blocker is unresolved.",
        "Summarize the concrete blocker, preserve the current scope, and state the next bounded action needed to resume.",
      ];
    case "resume":
      return [
        "Phase contract: this task is resuming from a prior handoff.",
        "Resume from the recorded blocker instead of restarting discovery from scratch.",
        "Perform only the next bounded recovery step, then verify whether the blocker is cleared.",
      ];
    default:
      return [
        `Phase contract: this is a ${hostLabel} discussion or planning pass.`,
        "Clarify intent, constraints, and evidence before proposing mutations.",
      ];
  }
}

export function buildPromptContract(options: {
  providerConfig: ProviderConfig | null | undefined;
  mode: RuntimeMode;
  task: TaskRecord | null | undefined;
  content: string;
  hostApp?: HostApp;
}): string {
  const providerFamily = inferProviderFamily(options.providerConfig);
  const phase = inferPromptPhase(options.content, options.mode, options.task);
  const providerGuidance = buildProviderGuidance(
    providerFamily,
    options.providerConfig,
  );
  const phaseGuidance = buildPhaseGuidance(phase, options.hostApp);
  const provider = options.providerConfig?.provider ?? "unconfigured";
  const model = options.providerConfig?.model ?? "unknown";
  const apiType = options.providerConfig?.apiType ?? "default";

  return `<prompt_contract provider_family="${providerFamily}" provider="${provider}" model="${model}" api_type="${apiType}" phase="${phase}" host_app="${options.hostApp ?? "generic"}">
<provider_profile>
${providerGuidance.map((line) => `- ${line}`).join("\n")}
</provider_profile>
<phase_profile>
${phaseGuidance.map((line) => `- ${line}`).join("\n")}
</phase_profile>
</prompt_contract>`;
}
