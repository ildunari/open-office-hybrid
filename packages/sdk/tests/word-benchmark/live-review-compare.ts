import { readFileSync } from "node:fs";
import path from "node:path";

export type LiveReviewMismatchClass =
  | "validated_but_skipped_verification"
  | "validated_but_retryable_verification"
  | "harness_pass_live_fail"
  | "harness_fail_live_pass"
  | "aligned";

export interface LiveReviewReviewerSignal {
  verdict: "pass" | "fail" | "inconclusive";
  execution_status: string;
  failure_classification: string;
}

export interface ClassifyHarnessVsLiveReviewMismatchOptions {
  taskArtifactDir: string;
  reviewerReport: LiveReviewReviewerSignal;
}

export interface LiveReviewMismatchResult {
  mismatchClass: LiveReviewMismatchClass;
  likelyFailureSurface: string;
  boundedFixAllowedInV1: boolean;
}

function loadJson(filePath: string) {
  return JSON.parse(readFileSync(filePath, "utf8")) as {
    status?: string;
    autoFailApplied?: boolean;
  };
}

function harnessPassed(score: { status?: string; autoFailApplied?: boolean }) {
  return (
    (score.status === "validated" || score.status === "completed") &&
    score.autoFailApplied !== true
  );
}

export function classifyHarnessVsLiveReviewMismatch(
  options: ClassifyHarnessVsLiveReviewMismatchOptions,
): LiveReviewMismatchResult {
  const score = loadJson(path.join(options.taskArtifactDir, "score.json"));
  loadJson(path.join(options.taskArtifactDir, "inspect.json"));

  if (
    harnessPassed(score) &&
    options.reviewerReport.execution_status === "failed" &&
    options.reviewerReport.failure_classification === "skipped_verification"
  ) {
    return {
      mismatchClass: "validated_but_skipped_verification",
      likelyFailureSurface: "harness_validation_contract",
      boundedFixAllowedInV1: true,
    };
  }

  if (
    harnessPassed(score) &&
    options.reviewerReport.execution_status === "failed" &&
    options.reviewerReport.failure_classification === "retryable_verification"
  ) {
    return {
      mismatchClass: "validated_but_retryable_verification",
      likelyFailureSurface: "bridge_or_tooling_retry_contract",
      boundedFixAllowedInV1: true,
    };
  }

  if (harnessPassed(score) && options.reviewerReport.verdict === "fail") {
    return {
      mismatchClass: "harness_pass_live_fail",
      likelyFailureSurface: "product_or_prompt_behavior",
      boundedFixAllowedInV1: false,
    };
  }

  if (!harnessPassed(score) && options.reviewerReport.verdict === "pass") {
    return {
      mismatchClass: "harness_fail_live_pass",
      likelyFailureSurface: "harness_or_scoring_contract",
      boundedFixAllowedInV1: true,
    };
  }

  return {
    mismatchClass: "aligned",
    likelyFailureSurface: "none",
    boundedFixAllowedInV1: false,
  };
}
