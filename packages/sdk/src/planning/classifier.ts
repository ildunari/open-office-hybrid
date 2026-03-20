import type { TaskClassification } from "./types";

const ACK_RE =
  /^(ok|okay|thanks|thank you|got it|sounds good|cool|nice|great|yep|yes)$/i;

const HIGH_RISK_RE =
  /\b(delete|remove|clear|overwrite|replace all|rename workbook|drop|destructive)\b/i;

const MEDIUM_RISK_RE =
  /\b(rewrite|update|modify|revise|change|format|restructure|refactor)\b/i;

const COMPLEXITY_HINT_RE =
  /\b(and|then|after|before|verify|check|compare|summarize|analyze|plan|multi|entire|whole)\b/gi;

export interface TaskClassifierOptions {
  classifyFn?: (
    message: string,
  ) => Promise<TaskClassification> | TaskClassification;
}

export class TaskClassifier {
  constructor(private readonly options: TaskClassifierOptions = {}) {}

  shouldSkipClassification(message: string): boolean {
    const trimmed = message.trim();
    if (trimmed.length < 20) return true;
    if (trimmed.endsWith("?")) return true;
    return ACK_RE.test(trimmed);
  }

  async classify(message: string): Promise<TaskClassification> {
    if (this.shouldSkipClassification(message)) {
      return {
        complexity: "trivial",
        risk: "none",
        needsPlan: false,
        rationale: "Short question or acknowledgment; no plan needed.",
      };
    }

    if (this.options.classifyFn) {
      return this.options.classifyFn(message);
    }

    return inferTaskClassification(message);
  }
}

export function inferTaskClassification(message: string): TaskClassification {
  const trimmed = message.trim();
  const complexityHints = trimmed.match(COMPLEXITY_HINT_RE)?.length ?? 0;
  const highRisk = HIGH_RISK_RE.test(trimmed);
  const mediumRisk = MEDIUM_RISK_RE.test(trimmed);

  let complexity: TaskClassification["complexity"] = "simple";
  if (complexityHints >= 4) complexity = "complex";
  else if (complexityHints >= 2) complexity = "moderate";

  const risk: TaskClassification["risk"] = highRisk
    ? "high"
    : mediumRisk
      ? "medium"
      : "low";

  const needsPlan =
    complexity === "moderate" ||
    complexity === "complex" ||
    risk === "medium" ||
    risk === "high";

  return {
    complexity,
    risk,
    needsPlan,
    suggestedSteps: needsPlan ? (complexity === "complex" ? 5 : 4) : 1,
    rationale: needsPlan
      ? "Multiple dependent operations or meaningful mutation risk detected."
      : "Single low-risk change inferred from the request.",
  };
}
