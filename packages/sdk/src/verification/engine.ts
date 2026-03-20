import type {
  VerificationContext,
  VerificationResult,
  VerificationRunSummary,
  VerificationSuite,
} from "./types";

export class VerificationEngine {
  constructor(private readonly suites: VerificationSuite[] = []) {}

  setSuites(suites: VerificationSuite[]) {
    this.suites.splice(0, this.suites.length, ...suites);
  }

  getSuites(): VerificationSuite[] {
    return [...this.suites];
  }

  async run(context: VerificationContext): Promise<VerificationRunSummary> {
    const results: VerificationResult[] = [];
    for (const suite of this.suites) {
      if (!suite.appliesTo(context)) continue;
      const result = await suite.verify(context);
      if (result) results.push(result);
    }

    if (results.length === 0) {
      return {
        status: "skipped",
        retryable: false,
        results: [],
      };
    }

    const hasFailed = results.some((result) => result.status === "failed");
    const hasRetryable = results.some(
      (result) => result.status === "retryable",
    );

    return {
      status: hasFailed ? "failed" : hasRetryable ? "retryable" : "passed",
      retryable: hasRetryable,
      results,
    };
  }
}
