import path from "node:path";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import { describe, expect, it } from "vitest";
import {
  classifyWordBenchmarkFailure,
  buildWordBenchmarkTaskRunPolicy,
  buildWordBenchmarkTaskExecutionPlan,
  buildHumanReviewStub,
  evaluateWordBenchmarkTaskArtifacts,
  loadWordBenchmarkSuite,
  planArtifactPaths,
  scoreBenchmarkTaskRun,
  summarizeWordBenchmarkRun,
  type BridgeSessionFingerprint,
} from "./word-benchmark/benchmark-suite";
import {
  appendActiveIssueEntry,
  appendResolvedIssueEntry,
  initializeLiveReviewIssueArtifacts,
} from "./word-benchmark/live-review-issues";
import { buildCapabilityLiveReviewPlan } from "./word-benchmark/live-review-planner";
import {
  advanceLiveReviewBatch,
  createLiveReviewBatchRuntime,
} from "./word-benchmark/live-review-runtime";
import { classifyHarnessVsLiveReviewMismatch } from "./word-benchmark/live-review-compare";
import { completeMinimalLiveReviewerResult } from "./word-benchmark/live-review-reviewer";
import {
  buildReviewerPrompt,
  buildTaskpanePromptSubmissionScript,
  classifyLiveExecutionReceipts,
  LIVE_REVIEW_AUTOMATION_GLOBAL,
  LIVE_REVIEW_SEND_BUTTON_SELECTOR,
  LIVE_REVIEW_TEXTAREA_SELECTOR,
  unwrapTaskpaneSubmissionResult,
} from "./word-benchmark/live-review-submission.mjs";

const suiteDir = path.join(
  __dirname,
  "word-benchmark",
);

function loadJsonFixture<T>(...parts: string[]) {
  const filePath = path.join(suiteDir, ...parts);
  expect(existsSync(filePath)).toBe(true);
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

describe("word benchmark suite", () => {
  it("validates live review schemas", () => {
    const reviewerSchema = loadJsonFixture<{
      required: string[];
      properties: Record<string, unknown>;
    }>("live-review.schema.json");
    const batchSchema = loadJsonFixture<{
      required: string[];
      properties: Record<string, unknown>;
    }>("live-review-batch.schema.json");
    const issueLedgerSchema = loadJsonFixture<{
      required: string[];
      properties: Record<string, unknown>;
    }>("issue-ledger.schema.json");
    const resolvedIssueSchema = loadJsonFixture<{
      required: string[];
      properties: Record<string, unknown>;
    }>("resolved-issue.schema.json");

    expect(reviewerSchema.required).toEqual(
      expect.arrayContaining([
        "task_identity",
        "capability_area",
        "source_document",
        "task_id",
        "clone_id",
        "execution_status",
        "failure_classification",
        "verdict",
        "score",
        "confidence",
        "freeform_observations",
      ]),
    );
    expect(reviewerSchema.properties.evidence_checked).toBeDefined();

    expect(batchSchema.required).toEqual(
      expect.arrayContaining([
        "batch_id",
        "capability_area",
        "source_document",
        "selected_tasks",
        "diagnosis_summary",
        "mismatch_map",
        "stop_reasons",
        "next_action_queue",
      ]),
    );
    expect(batchSchema.properties.per_task_timeline).toBeDefined();

    expect(issueLedgerSchema.required).toEqual(
      expect.arrayContaining([
        "issue_id",
        "capability_area",
        "source_document",
        "task_id",
        "observed_behavior",
        "expected_behavior",
        "likely_failure_class",
        "likely_solution_surface",
        "status",
      ]),
    );
    expect(issueLedgerSchema.properties.solution_hint).toBeUndefined();

    expect(resolvedIssueSchema.required).toEqual(
      expect.arrayContaining([
        "issue_id",
        "resolved_at",
        "summary",
        "resolution_kind",
        "detailed_report_path",
      ]),
    );
    expect(resolvedIssueSchema.properties.archive_index_entry).toBeDefined();
  });

  it("builds a capability-led live review plan", () => {
    const plan = buildCapabilityLiveReviewPlan({
      suiteDir,
      capabilityId: "nih_grants",
      artifactRiskByTaskId: {
        "M08-grant-protected-neighbor": 0.96,
        "S03-grant-scope-and-compliance": 0.88,
        "M11-biosketch-length-neutral": 0.77,
        "T31-biosketch-consistency": 0.52,
      },
    });

    expect(plan.entryMode).toBe("capability_led");
    expect(plan.documents).toHaveLength(2);
    expect(plan.documents.map((entry) => entry.sourceDocument)).toEqual([
      "grant_nih_r01_template_v1",
      "grant_biosketch_nonfellowship_2021_v1",
    ]);
    expect(plan.documents[0].tasks).toHaveLength(4);
    expect(plan.documents[1].tasks).toHaveLength(2);
    expect(plan.documents[0].tasks.map((task) => task.taskId)).toEqual([
      "M08-grant-protected-neighbor",
      "S03-grant-scope-and-compliance",
      "T39-grant-approved-region",
      "T11-grant-template-rewrite",
    ]);
    expect(plan.documents[0].tasks.every((task) => task.riskScore >= 0)).toBe(true);
    expect(plan.documents.every((entry) => entry.tasks.length <= 4)).toBe(true);
    expect(plan.maxDocs).toBe(2);
    expect(plan.maxTasksPerDocument).toBe(4);
  });

  it("writes active and resolved live review issue records", () => {
    const rootDir = mkdtempSync(path.join(os.tmpdir(), "word-live-review-issues-"));

    initializeLiveReviewIssueArtifacts(rootDir);

    const activePaths = appendActiveIssueEntry(rootDir, {
      issueId: "LRI-001",
      capabilityArea: "nih_grants",
      sourceDocument: "grant_nih_r01_template_v1",
      taskId: "M08-grant-protected-neighbor",
      dateRunReference: "lrb-nih_grants-grant_nih_r01_template_v1-2026-03-22T23-59-00Z",
      observedBehavior: "Protected neighboring content changed during a scoped edit.",
      expectedBehavior: "Only the selected grant paragraph changes.",
      reproductionSummary: "Run the task on a fresh clone with the Hybrid pane open.",
      seenIn: "both",
      likelyFailureClass: "scope_violation",
      likelySolutionSurface: "harness_scope_diff",
      status: "open",
    });

    const activeLedger = readFileSync(activePaths.activeLedgerPath, "utf8");
    expect(activeLedger).toContain("LRI-001");
    expect(activeLedger).toContain("scope_violation");
    expect(activeLedger).not.toContain("solution hint");

    const resolvedPaths = appendResolvedIssueEntry(rootDir, {
      issueId: "LRI-001",
      resolvedAt: "2026-03-22T23:59:30.000Z",
      summary: "Scope diff handling now keeps the protected region stable.",
      resolutionKind: "harness_fix",
      detailedReportBody: "# LRI-001\n\nResolved by tightening harness-side scope diff checks.\n",
    });

    const resolvedIndex = readFileSync(resolvedPaths.indexPath, "utf8");
    expect(resolvedIndex).toContain("LRI-001");
    expect(resolvedIndex).toContain("LRI-001.md");
    expect(readFileSync(resolvedPaths.detailedReportPath, "utf8")).toContain(
      "Resolved by tightening harness-side scope diff checks.",
    );
  });

  it("runs the live review batch state machine", () => {
    const initial = createLiveReviewBatchRuntime({
      batchId: "lrb-nih_grants-grant_nih_r01_template_v1-2026-03-23T00-00-00Z",
      capabilityArea: "nih_grants",
      sourceDocument: "grant_nih_r01_template_v1",
      selectedTasks: ["M08-grant-protected-neighbor"],
    });

    expect(initial.phase).toBe("batch_preflight");

    const waitingForPane = advanceLiveReviewBatch(initial, {
      type: "preflight_completed",
      requiresPaneOpen: true,
    });
    expect(waitingForPane.phase).toBe("pane_open_required");

    const sessionReady = advanceLiveReviewBatch(waitingForPane, {
      type: "session_verified",
      bridgeSessionId: "word:hybrid",
      wordDocumentId: "doc-123",
      visibleTitle: "NIH New R01 application template",
    });
    expect(sessionReady.phase).toBe("session_ready");
    expect(sessionReady.bridgeSessionId).toBe("word:hybrid");

    const reviewerRunning = advanceLiveReviewBatch(sessionReady, {
      type: "reviewer_task_started",
      taskId: "M08-grant-protected-neighbor",
      cloneId: "clone-M08-grant-protected-neighbor-1",
    });
    expect(reviewerRunning.phase).toBe("reviewer_running");
    expect(reviewerRunning.activeTaskId).toBe("M08-grant-protected-neighbor");

    const quarantined = advanceLiveReviewBatch(reviewerRunning, {
      type: "rerun_failed",
      taskId: "M08-grant-protected-neighbor",
      reason: "bridge_refresh_timeout",
    });
    expect(quarantined.phase).toBe("quarantined");
    expect(quarantined.quarantinedTasks).toEqual([
      "M08-grant-protected-neighbor",
    ]);
  });

  it("classifies harness versus live review mismatches", () => {
    const rootDir = mkdtempSync(path.join(os.tmpdir(), "word-live-review-compare-"));
    const taskDir = path.join(rootDir, "task");
    mkdirSync(taskDir, { recursive: true });

    writeFileSync(path.join(taskDir, "inspect.json"), JSON.stringify({ sections: 1 }));

    writeFileSync(
      path.join(taskDir, "score.json"),
      JSON.stringify({
        status: "validated",
        autoFailApplied: false,
        validatorResults: {
          scope_diff_check: { status: "passed" },
        },
      }),
    );
    expect(
      classifyHarnessVsLiveReviewMismatch({
        taskArtifactDir: taskDir,
        reviewerReport: {
          verdict: "fail",
          execution_status: "failed",
          failure_classification: "skipped_verification",
        },
      }).mismatchClass,
    ).toBe("validated_but_skipped_verification");

    expect(
      classifyHarnessVsLiveReviewMismatch({
        taskArtifactDir: taskDir,
        reviewerReport: {
          verdict: "fail",
          execution_status: "failed",
          failure_classification: "retryable_verification",
        },
      }).mismatchClass,
    ).toBe("validated_but_retryable_verification");

    expect(
      classifyHarnessVsLiveReviewMismatch({
        taskArtifactDir: taskDir,
        reviewerReport: {
          verdict: "fail",
          execution_status: "failed",
          failure_classification: "layout_regression",
        },
      }),
    ).toEqual(
      expect.objectContaining({
        mismatchClass: "harness_pass_live_fail",
        likelyFailureSurface: "product_or_prompt_behavior",
        boundedFixAllowedInV1: false,
      }),
    );

    writeFileSync(
      path.join(taskDir, "score.json"),
      JSON.stringify({
        status: "failed",
        autoFailApplied: true,
        validatorResults: {
          scope_diff_check: { status: "failed" },
        },
      }),
    );

    expect(
      classifyHarnessVsLiveReviewMismatch({
        taskArtifactDir: taskDir,
        reviewerReport: {
          verdict: "pass",
          execution_status: "completed",
          failure_classification: "none",
        },
      }),
    ).toEqual(
      expect.objectContaining({
        mismatchClass: "harness_fail_live_pass",
        likelyFailureSurface: "harness_or_scoring_contract",
        boundedFixAllowedInV1: true,
      }),
    );
  });

  it("completes a minimal live reviewer result", () => {
    const completed = completeMinimalLiveReviewerResult({
      receipts: {
        promptSubmitted: false,
        executionObserved: false,
        completionObserved: false,
      },
      metadata: {
        ok: true,
        metadata: {
          hasContent: true,
          pageCount: 1,
          changeTrackingMode: "TrackAll",
        },
      },
      runtimeState: {
        isStreaming: false,
        error: null,
        activePlanSummary: null,
        activeTaskSummary: null,
      },
      events: [
        { event: "bridge_connected" },
        { event: "bridge_status" },
      ],
    });

    expect(completed.readinessState).toBe("completed");
    expect(completed.executionStatus).toBe("completed");
    expect(completed.failureClassification).toBe("reviewer_task_not_executed");
    expect(completed.verdict).toBe("fail");
    expect(completed.score).toBeGreaterThan(0);
    expect(completed.evidenceChecked).toEqual([
      "bridge_session_tuple",
      "bridge_metadata",
      "runtime_state",
      "recent_events",
    ]);
    expect(completed.timelineEvents).toEqual([
      "reviewer_evidence_captured",
      "reviewer_completed",
    ]);
  });

  it("marks the reviewer complete when prompt submission, execution, and completion are all observed", () => {
    const completed = completeMinimalLiveReviewerResult({
      receipts: {
        promptSubmitted: true,
        executionObserved: true,
        completionObserved: true,
      },
      metadata: {
        ok: true,
        metadata: {
          hasContent: true,
          pageCount: 1,
          changeTrackingMode: "TrackAll",
        },
      },
      runtimeState: {
        isStreaming: false,
        error: null,
        activePlanSummary: null,
        activeTaskSummary: null,
      },
      events: [
        { event: "bridge_connected" },
        { event: "tool:started" },
        { event: "message:completed" },
      ],
    });

    expect(completed.failureClassification).toBe("reviewer_task_completed");
    expect(completed.verdict).toBe("pass");
    expect(completed.evidenceChecked).toContain("tool_execution_receipt");
    expect(completed.timelineEvents).toContain("prompt_submitted");
  });

  it("treats a preflighted session as healthy without requiring a fresh bridge event", () => {
    const completed = completeMinimalLiveReviewerResult({
      receipts: {
        promptSubmitted: true,
        executionObserved: true,
        completionObserved: true,
      },
      metadata: {
        ok: true,
        metadata: {
          hasContent: true,
          pageCount: 1,
        },
      },
      runtimeState: {
        isStreaming: false,
        error: null,
        activePlanSummary: null,
        activeTaskSummary: null,
      },
      events: [],
    });

    expect(completed.failureClassification).toBe("reviewer_task_completed");
    expect(completed.verdict).toBe("pass");
  });

  it("keeps stable live review selectors in the chat input", () => {
    const chatInputPath = path.join(
      __dirname,
      "..",
      "..",
      "core",
      "src",
      "chat",
      "chat-input.svelte",
    );
    const source = readFileSync(chatInputPath, "utf8");

    expect(source).toContain("data-live-review-textarea");
    expect(source).toContain("data-live-review-send");
    expect(LIVE_REVIEW_TEXTAREA_SELECTOR).toBe("[data-live-review-textarea]");
    expect(LIVE_REVIEW_SEND_BUTTON_SELECTOR).toBe("[data-live-review-send]");
  });

  it("exposes a stable dev-only taskpane automation hook", () => {
    const chatInterfacePath = path.join(
      __dirname,
      "..",
      "..",
      "core",
      "src",
      "chat",
      "chat-interface.svelte",
    );
    const source = readFileSync(chatInterfacePath, "utf8");

    expect(source).toContain("__OFFICE_AGENTS_AUTOMATION__");
    expect(source).toContain("submitPrompt");
    expect(source).toContain("freshSession");
    expect(LIVE_REVIEW_AUTOMATION_GLOBAL).toBe(
      "window.__OFFICE_AGENTS_AUTOMATION__",
    );
  });

  it("builds the taskpane submission script with the automation hook and selector fallback", () => {
    const prompt = buildReviewerPrompt({
      capabilityId: "nih_grants",
      taskId: "S03-grant-scope-and-compliance",
      sourceDocument: "grant_nih_r01_template_v1",
      taskPrompt:
        "Assess whether the scoped review task can be performed safely without touching unrelated content.",
    });
    const script = buildTaskpanePromptSubmissionScript({ prompt });

    expect(script).toContain(LIVE_REVIEW_AUTOMATION_GLOBAL);
    expect(script).toContain("submitPrompt");
    expect(script).toContain("freshSession: true");
    expect(script).toContain(LIVE_REVIEW_TEXTAREA_SELECTOR);
    expect(script).toContain(LIVE_REVIEW_SEND_BUTTON_SELECTOR);
    expect(script).toContain('new KeyboardEvent("keydown"');
    expect(script).toContain('new MouseEvent("click"');
    expect(script).toContain('submissionMethod: "dom"');
    expect(script).toContain("get_document_structure");
    expect(prompt).toContain("Do not create a plan.");
    expect(prompt).toContain("Use exactly one tool call");
    expect(prompt).toContain("Target task intent:");
  });

  it("supports manual report task targeting in the live-review runner", () => {
    const runnerPath = path.join(
      __dirname,
      "word-benchmark",
      "run-live-review-batch.mjs",
    );
    const source = readFileSync(runnerPath, "utf8");

    expect(source).toContain("--source-document");
    expect(source).toContain("--task-id");
    expect(source).toContain("entryMode: \"orchestrator_led\"");
    expect(source).toContain("manual_orchestrator_led");
  });

  it("classifies the live execution receipts from runtime state and events", () => {
    const receipts = classifyLiveExecutionReceipts({
      baselineMessageCount: 0,
      stateSnapshots: [
        {
          isStreaming: true,
          activeTaskSummary: {
            id: "task-1",
            status: "in_progress",
            mode: "execute",
            toolExecutionCount: 0,
          },
          sessionStats: { messageCount: 1 },
        },
        {
          isStreaming: false,
          activeTaskSummary: {
            id: "task-1",
            status: "completed",
            mode: "completed",
            toolExecutionCount: 1,
          },
          sessionStats: { messageCount: 2 },
        },
      ],
      newEvents: [
        { event: "message:created" },
        {
          event: "console",
          payload: {
            args: ["[Runtime] Agent event:", "tool_execution_start"],
          },
        },
        {
          event: "console",
          payload: {
            args: ["[Runtime] Agent event:", "tool_execution_end"],
          },
        },
        {
          event: "console",
          payload: {
            args: ["[Runtime] Agent event:", "agent_end"],
          },
        },
      ],
    });

    expect(receipts).toEqual({
      promptSubmitted: true,
      executionObserved: true,
      completionObserved: true,
    });
  });

  it("unwraps nested bridge exec submission results", () => {
    expect(
      unwrapTaskpaneSubmissionResult({
        ok: true,
        result: {
          mode: "unsafe",
          result: {
            submitted: true,
            submissionMethod: "controller",
            freshSession: true,
          },
        },
      }),
    ).toEqual({
      submitted: true,
      submissionMethod: "controller",
      freshSession: true,
    });
  });

  it("loads the local fixture registry and placeholder archetypes", () => {
    const suite = loadWordBenchmarkSuite(suiteDir);

    expect(suite.fixtures.local).toHaveLength(6);
    expect(suite.fixtures.pending).toHaveLength(2);
    expect(
      suite.fixtures.local.map((fixture) => fixture.source_doc_id).sort(),
    ).toEqual([
      "grant_biosketch_nonfellowship_2021_v1",
      "grant_nih_r01_template_v1",
      "legal_contract_msc_core_terms_ew_2025_v1",
      "legal_pleading_usdc_complaint_v1",
      "report_tti_generic_v1",
      "review_track_changes_sample_v1",
    ]);
    expect(
      suite.fixtures.pending.map((fixture) => fixture.archetype).sort(),
    ).toEqual(["scientific_paper", "thesis"]);
    expect(
      suite.fixtures.local.every((fixture) => !fixture.file.includes("~$")),
    ).toBe(true);
  });

  it("loads scenario packs that only reference known fixture ids", () => {
    const suite = loadWordBenchmarkSuite(suiteDir);
    const knownFixtureIds = new Set(suite.fixtures.all.map((f) => f.source_doc_id));

    expect(Object.keys(suite.scenarioPacks).sort()).toEqual([
      "adversarial",
      "core",
      "multistep",
    ]);
    expect(suite.scenarioPacks.core.tasks.length).toBeGreaterThanOrEqual(12);
    expect(suite.scenarioPacks.adversarial.tasks.length).toBeGreaterThanOrEqual(6);
    expect(suite.scenarioPacks.multistep.sessions.length).toBeGreaterThanOrEqual(3);

    for (const pack of Object.values(suite.scenarioPacks)) {
      if ("tasks" in pack) {
        for (const task of pack.tasks) {
          expect(knownFixtureIds.has(task.source_doc_id)).toBe(true);
        }
      } else {
        for (const session of pack.sessions) {
          expect(knownFixtureIds.has(session.source_doc_id)).toBe(true);
          expect(session.steps.length).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it("scores weighted task results and honors auto-fail severity", () => {
    const strong = scoreBenchmarkTaskRun({
      archetype: "legal",
      dimensions: {
        semantic_correctness: 0.96,
        scope_localization: 0.98,
        word_native_integrity: 0.94,
        formatting_layout_fidelity: 0.85,
        completion_coverage: 1,
        safety_ambiguity_handling: 0.96,
      },
      triggeredAutoFail: false,
      repeatability: {
        repeatCount: 3,
        recoveryCostTier: "RC1",
        scoreVariance: 0.04,
      },
    });

    expect(strong.overallScore).toBeGreaterThanOrEqual(4.5);
    expect(strong.overallLabel).toBe("excellent");

    const failed = scoreBenchmarkTaskRun({
      archetype: "grant",
      dimensions: {
        semantic_correctness: 0.9,
        scope_localization: 0.25,
        word_native_integrity: 0.8,
        formatting_layout_fidelity: 0.9,
        completion_coverage: 1,
        safety_ambiguity_handling: 0.2,
      },
      triggeredAutoFail: true,
      repeatability: {
        repeatCount: 5,
        recoveryCostTier: "RC4",
        scoreVariance: 0.4,
      },
    });

    expect(failed.overallScore).toBe(1);
    expect(failed.overallLabel).toBe("fail");
    expect(failed.autoFailApplied).toBe(true);
  });

  it("caps high-risk RC4 recoveries below strong even when the raw score is high", () => {
    const scored = scoreBenchmarkTaskRun({
      archetype: "review_state",
      dimensions: {
        semantic_correctness: 1,
        scope_localization: 1,
        word_native_integrity: 1,
        formatting_layout_fidelity: 1,
        completion_coverage: 1,
        safety_ambiguity_handling: 1,
      },
      triggeredAutoFail: false,
      repeatability: {
        repeatCount: 5,
        recoveryCostTier: "RC4",
        scoreVariance: 0,
      },
    });

    expect(scored.overallScore).toBe(3.7);
    expect(scored.overallLabel).toBe("passable");
    expect(scored.highRiskRecoveryCapApplied).toBe(true);
    expect(scored.status).toBe("scored");
  });

  it("plans deterministic artifact paths and session-map output", () => {
    const planned = planArtifactPaths({
      rootDir: path.join(suiteDir, "artifacts"),
      runId: "run-001",
      fixtureFile: "Generic-report-template.docx",
      taskId: "T21-report-core",
    });

    expect(planned.runDir).toContain(
      path.join("artifacts", "word-benchmark", "run-001"),
    );
    expect(planned.taskDir).toContain(
      path.join("Generic-report-template.docx", "T21-report-core"),
    );
    expect(planned.sessionMapPath).toBe(
      path.join(planned.runDir, "session-map.json"),
    );
    expect(planned.humanReviewPath).toBe(
      path.join(planned.taskDir, "human-review.md"),
    );
    expect(planned.summaryPath).toBe(path.join(planned.taskDir, "summary.txt"));
    expect(planned.screenshotPath).toBe(path.join(planned.taskDir, "before.png"));
    expect(planned.baselineReferencePath).toBe(
      path.join(planned.taskDir, "baseline-reference.json"),
    );
    expect(planned.eventsPath).toBe(path.join(planned.taskDir, "events.json"));
  });

  it("builds a useful human-review stub", () => {
    const suite = loadWordBenchmarkSuite(suiteDir);
    const fixture = suite.fixtures.local.find(
      (entry) => entry.source_doc_id === "report_tti_generic_v1",
    );
    const task = suite.scenarioPacks.core.tasks.find(
      (entry) => entry.task_id === "T21-report-core",
    );

    expect(fixture).toBeDefined();
    expect(task).toBeDefined();

    const stub = buildHumanReviewStub({
      fixture: fixture!,
      task: task!,
      runId: "run-001",
    });

    expect(stub).toContain("run-001");
    expect(stub).toContain("report_tti_generic_v1");
    expect(stub).toContain("formatting_fidelity");
    expect(stub).toContain("collateral_damage");
  });

  it("resolves executable validators and mutations for benchmark tasks", () => {
    const suite = loadWordBenchmarkSuite(suiteDir);
    const task = suite.scenarioPacks.adversarial.tasks.find(
      (entry) => entry.task_id === "M01-report-section-break-recovery",
    );

    expect(task).toBeDefined();

    const executionPlan = buildWordBenchmarkTaskExecutionPlan(task!);

    expect(executionPlan.validators.map((entry) => entry.id)).toEqual([
      "section_map_check",
      "header_footer_linkage_check",
      "page_number_scheme_check",
    ]);
    expect(executionPlan.validators[0].requiredArtifacts).toContain("inspectPath");
    expect(executionPlan.mutations.map((entry) => entry.id)).toEqual(["M01"]);
    expect(executionPlan.mutations[0].requiredArtifacts).toContain(
      "baselineReferencePath",
    );
  });

  it("classifies benchmark run failures by type", () => {
    expect(
      classifyWordBenchmarkFailure(
        "Bridge request timed out after 30000ms (refresh_session)",
      ).kind,
    ).toBe("bridge_refresh_timeout");
    expect(
      classifyWordBenchmarkFailure(
        "Session is already streaming. Wait for the current run to finish before submitting another prompt.",
      ).kind,
    ).toBe("session_collision");
    expect(
      classifyWordBenchmarkFailure(
        "Request timed out after 300000ms",
      ).kind,
    ).toBe("prompt_timeout");
  });

  it("uses extended timing and retries for recovery and scope-sensitive benchmark tasks", () => {
    const suite = loadWordBenchmarkSuite(suiteDir);
    const recoveryTask = suite.scenarioPacks.adversarial.tasks.find(
      (entry) => entry.task_id === "M05-contract-numbering-recovery",
    );
    const scopeTask = suite.scenarioPacks.multistep.sessions.find(
      (entry) => entry.session_id === "S02-contract-scope-discipline",
    );
    const simpleTask = suite.scenarioPacks.core.tasks.find(
      (entry) => entry.task_id === "T01-report-outline",
    );

    expect(recoveryTask).toBeDefined();
    expect(scopeTask).toBeDefined();
    expect(simpleTask).toBeDefined();

    const recoveryPolicy = buildWordBenchmarkTaskRunPolicy(recoveryTask!);
    const scopePolicy = buildWordBenchmarkTaskRunPolicy(scopeTask!);
    const simplePolicy = buildWordBenchmarkTaskRunPolicy(simpleTask!);

    expect(recoveryPolicy.promptTimeoutMs).toBeGreaterThan(
      simplePolicy.promptTimeoutMs,
    );
    expect(scopePolicy.promptTimeoutMs).toBeGreaterThan(
      simplePolicy.promptTimeoutMs,
    );
    expect(recoveryPolicy.maxPromptAttempts).toBeGreaterThan(1);
    expect(scopePolicy.requireSettledSession).toBe(true);
  });

  it("maps live bridge sessions to fixtures using structural and text fingerprints", () => {
    const suite = loadWordBenchmarkSuite(suiteDir);
    const sessions: BridgeSessionFingerprint[] = [
      {
        run_seq: 1,
        sessionId: "word:a",
        documentId: "doc-a",
        appName: "OpenWord Hybrid",
        title: "Unknown",
        pageCount: 19,
        sectionCount: 9,
        tableCount: 5,
        changeTrackingMode: "Off",
        previewText: "[Title Style, Initial Caps]",
        timestamp: "2026-03-21T20:00:00.000Z",
      },
      {
        run_seq: 2,
        sessionId: "word:b",
        documentId: "doc-b",
        appName: "OpenWord Hybrid",
        title: "Unknown",
        pageCount: 84,
        sectionCount: 2,
        tableCount: 3,
        changeTrackingMode: "Off",
        previewText: "Core Terms and Conditions",
        timestamp: "2026-03-21T20:00:01.000Z",
      },
      {
        run_seq: 3,
        sessionId: "word:c",
        documentId: "doc-c",
        appName: "OpenWord Hybrid",
        title: "Unknown",
        pageCount: 3,
        sectionCount: 1,
        tableCount: 1,
        changeTrackingMode: "Off",
        previewText:
          "BIOGRAPHICAL SKETCH Provide the following information for the Senior/key personnel",
        timestamp: "2026-03-21T20:00:02.000Z",
      },
    ];

    const mapped = suite.matchFixturesToSessions(sessions);
    expect(mapped.matches.map((entry) => entry.source_doc_id)).toEqual([
      "report_tti_generic_v1",
      "legal_contract_msc_core_terms_ew_2025_v1",
      "grant_biosketch_nonfellowship_2021_v1",
    ]);
    expect(mapped.unmatchedFixtures.length).toBe(3);
    expect(mapped.unmatchedSessions).toHaveLength(0);
  });

  it("summarizes a run directory into fixture and task status counts", () => {
    const rootDir = mkdtempSync(path.join(os.tmpdir(), "word-benchmark-run-"));
    const runDir = path.join(rootDir, "word-benchmark", "run-001");
    const fixtureDir = path.join(runDir, "Generic-report-template.docx");
    const baselineDir = path.join(fixtureDir, "baseline-smoke", "benchmark-baseline");
    mkdirSync(baselineDir, { recursive: true });

    writeFileSync(
      path.join(runDir, "session-map.json"),
      JSON.stringify({ matches: [{ source_doc_id: "report_tti_generic_v1" }] }),
    );
    writeFileSync(path.join(baselineDir, "summary.txt"), "word | idle");

    const suite = loadWordBenchmarkSuite(suiteDir);
    const task = suite.scenarioPacks.core.tasks.find(
      (entry) => entry.task_id === "T21-report-core",
    );
    const readyTask = suite.scenarioPacks.core.tasks.find(
      (entry) => entry.task_id === "T22-report-header",
    );
    const failedTask = suite.scenarioPacks.adversarial.tasks.find(
      (entry) => entry.task_id === "M01-report-section-break-recovery",
    );

    expect(task).toBeDefined();
    expect(readyTask).toBeDefined();
    expect(failedTask).toBeDefined();

    const pendingPaths = planArtifactPaths({
      rootDir,
      runId: "run-001",
      fixtureFile: "Generic-report-template.docx",
      taskId: task!.task_id,
    });
    const readyPaths = planArtifactPaths({
      rootDir,
      runId: "run-001",
      fixtureFile: "Generic-report-template.docx",
      taskId: readyTask!.task_id,
    });
    const failedPaths = planArtifactPaths({
      rootDir,
      runId: "run-001",
      fixtureFile: "Generic-report-template.docx",
      taskId: failedTask!.task_id,
    });

    for (const [currentTask, paths] of [
      [task!, pendingPaths],
      [readyTask!, readyPaths],
      [failedTask!, failedPaths],
    ] as const) {
      mkdirSync(paths.taskDir, { recursive: true });
      writeFileSync(paths.taskManifestPath, JSON.stringify(currentTask));
      writeFileSync(
        paths.runMetadataPath,
        JSON.stringify({
          executionStatus: "baseline_captured_pending_manual_agent_run",
        }),
      );
      writeFileSync(paths.scorePath, JSON.stringify({ status: "pending" }));
      writeFileSync(paths.humanReviewPath, buildHumanReviewStub({
        fixture: suite.fixtures.local.find(
          (entry) => entry.source_doc_id === currentTask.source_doc_id,
        )!,
        task: currentTask,
        runId: "run-001",
      }));
      writeFileSync(paths.actionLogPath, "");
      writeFileSync(
        paths.baselineReferencePath,
        JSON.stringify({ fixtureBaselineDir: "../baseline-smoke/benchmark-baseline" }),
      );
      writeFileSync(paths.summaryPath, "word | idle");
      writeFileSync(paths.metadataPath, JSON.stringify({ pageCount: 19 }));
      writeFileSync(paths.inspectPath, JSON.stringify({ sections: 9 }));
      writeFileSync(paths.statePath, JSON.stringify({ status: "idle" }));
      writeFileSync(paths.diagPath, JSON.stringify({ hooks: [] }));
    }

    writeFileSync(pendingPaths.actionLogPath, '{"step":"agent edit"}\n');
    writeFileSync(
      pendingPaths.runMetadataPath,
      JSON.stringify({ executionStatus: "agent_run_recorded" }),
    );
    writeFileSync(
      pendingPaths.scorePath,
      JSON.stringify({
        status: "validated",
        validatorResults: {
          toc_field_check: { status: "passed" },
          section_map_check: { status: "passed" },
          visual_front_matter_check: { status: "passed" },
        },
      }),
    );

    writeFileSync(
      failedPaths.actionLogPath,
      '{"step":"recovery attempt"}\n',
    );
    writeFileSync(
      failedPaths.scorePath,
      JSON.stringify({
        status: "validated",
        autoFailApplied: true,
        validatorResults: {
          section_map_check: { status: "passed" },
          header_footer_linkage_check: { status: "failed" },
          page_number_scheme_check: { status: "failed" },
        },
      }),
    );

    const summary = summarizeWordBenchmarkRun(runDir);
    expect(summary.fixtureCount).toBe(1);
    expect(summary.taskCount).toBe(3);
    expect(summary.pendingTasks).toBe(0);
    expect(summary.readyTasks).toBe(1);
    expect(summary.awaitingHumanReviewTasks).toBe(1);
    expect(summary.failedTasks).toBe(1);
    expect(summary.completedTasks).toBe(0);
    expect(summary.fixtureSummaries[0].hasBaselineSmoke).toBe(true);
    expect(summary.fixtureSummaries[0].readyTasks).toBe(1);
    expect(summary.fixtureSummaries[0].awaitingHumanReviewTasks).toBe(1);
    expect(summary.fixtureSummaries[0].failedTasks).toBe(1);
  });

  it("summarizes failed benchmark tasks by failure family", () => {
    const rootDir = mkdtempSync(path.join(os.tmpdir(), "word-benchmark-run-"));
    const runDir = path.join(rootDir, "word-benchmark", "run-001");
    const fixtureDir = path.join(runDir, "Generic-report-template.docx");
    const baselineDir = path.join(fixtureDir, "baseline-smoke", "benchmark-baseline");
    mkdirSync(baselineDir, { recursive: true });
    writeFileSync(path.join(baselineDir, "summary.txt"), "word | idle");

    const suite = loadWordBenchmarkSuite(suiteDir);
    const recoveryTask = suite.scenarioPacks.adversarial.tasks.find(
      (entry) => entry.task_id === "M02-report-stale-field-recovery",
    );
    const scopeTask = suite.scenarioPacks.multistep.sessions.find(
      (entry) => entry.session_id === "S03-grant-scope-and-compliance",
    );

    expect(recoveryTask).toBeDefined();
    expect(scopeTask).toBeDefined();

    const cases = [
      {
        taskId: recoveryTask!.task_id,
        fixtureFile: "Generic-report-template.docx",
        manifest: recoveryTask!,
        message: "Bridge request timed out after 30000ms (refresh_session)",
      },
      {
        taskId: scopeTask!.session_id,
        fixtureFile: "Generic-report-template.docx",
        manifest: scopeTask!,
        message:
          "Session is already streaming. Wait for the current run to finish before submitting another prompt.",
      },
    ];

    for (const current of cases) {
      const paths = planArtifactPaths({
        rootDir,
        runId: "run-001",
        fixtureFile: current.fixtureFile,
        taskId: current.taskId,
      });
      mkdirSync(paths.taskDir, { recursive: true });
      writeFileSync(paths.taskManifestPath, JSON.stringify(current.manifest));
      writeFileSync(paths.scorePath, JSON.stringify({ status: "failed" }));
      writeFileSync(paths.humanReviewPath, "# Human Review Sheet\n");
      writeFileSync(paths.actionLogPath, "");
      writeFileSync(paths.baselineReferencePath, JSON.stringify({}));
      writeFileSync(paths.summaryPath, "word | idle");
      writeFileSync(paths.metadataPath, JSON.stringify({ pageCount: 19 }));
      writeFileSync(paths.inspectPath, JSON.stringify({ sections: 9 }));
      writeFileSync(paths.statePath, JSON.stringify({ status: "idle" }));
      writeFileSync(paths.diagPath, JSON.stringify({}));
      writeFileSync(
        paths.runMetadataPath,
        JSON.stringify({
          executionStatus: "failed",
          error: {
            message: current.message,
          },
        }),
      );
    }

    const summary = summarizeWordBenchmarkRun(runDir);
    expect(summary.failedTasks).toBe(2);
    expect(summary.failureCounts).toEqual({
      bridge_refresh_timeout: 1,
      prompt_timeout: 0,
      session_collision: 1,
      other: 0,
    });
    expect(summary.failedTaskGroups.bridge_refresh_timeout).toContain(
      "Generic-report-template.docx/M02-report-stale-field-recovery",
    );
    expect(summary.failedTaskGroups.session_collision).toContain(
      "Generic-report-template.docx/S03-grant-scope-and-compliance",
    );
  });

  it("classifies benchmark task directories from the runner artifact contract", () => {
    const rootDir = mkdtempSync(path.join(os.tmpdir(), "word-benchmark-task-"));
    const suite = loadWordBenchmarkSuite(suiteDir);
    const task = suite.scenarioPacks.core.tasks.find(
      (entry) => entry.task_id === "T21-report-core",
    );
    const fixture = suite.fixtures.local.find(
      (entry) => entry.source_doc_id === task?.source_doc_id,
    );

    expect(task).toBeDefined();
    expect(fixture).toBeDefined();

    const paths = planArtifactPaths({
      rootDir,
      runId: "run-001",
      fixtureFile: "Generic-report-template.docx",
      taskId: task!.task_id,
    });

    mkdirSync(paths.taskDir, { recursive: true });
    writeFileSync(paths.taskManifestPath, JSON.stringify(task));
    writeFileSync(
      paths.runMetadataPath,
      JSON.stringify({ executionStatus: "baseline_captured_pending_manual_agent_run" }),
    );
    writeFileSync(paths.scorePath, JSON.stringify({ status: "pending" }));
    writeFileSync(
      paths.humanReviewPath,
      buildHumanReviewStub({ fixture: fixture!, task: task!, runId: "run-001" }),
    );
    writeFileSync(paths.actionLogPath, "");
    writeFileSync(
      paths.baselineReferencePath,
      JSON.stringify({ fixtureBaselineDir: "../baseline-smoke/benchmark-baseline" }),
    );
    writeFileSync(paths.summaryPath, "word | idle");
    writeFileSync(paths.metadataPath, JSON.stringify({ pageCount: 19 }));
    writeFileSync(paths.inspectPath, JSON.stringify({ sections: 9 }));
    writeFileSync(paths.statePath, JSON.stringify({ status: "idle" }));
    writeFileSync(paths.diagPath, JSON.stringify({ hooks: [] }));

    expect(evaluateWordBenchmarkTaskArtifacts(paths.taskDir).status).toBe("ready");

    writeFileSync(paths.actionLogPath, '{"step":"repair toc"}\n');
    writeFileSync(
      paths.runMetadataPath,
      JSON.stringify({ executionStatus: "agent_run_recorded" }),
    );
    expect(evaluateWordBenchmarkTaskArtifacts(paths.taskDir).status).toBe(
      "awaiting_validation",
    );

    writeFileSync(
      paths.scorePath,
      JSON.stringify({
        status: "validated",
        validatorResults: {
          toc_field_check: { status: "passed" },
          section_map_check: { status: "passed" },
          visual_front_matter_check: { status: "passed" },
        },
      }),
    );
    expect(evaluateWordBenchmarkTaskArtifacts(paths.taskDir).status).toBe(
      "awaiting_human_review",
    );

    writeFileSync(
      paths.humanReviewPath,
      [
        "# Human Review Sheet",
        "",
        "- Score (1-5): 4",
        "- Reviewer: QA",
        "- Timestamp: 2026-03-21T20:10:00.000Z",
      ].join("\n"),
    );
    writeFileSync(
      paths.scorePath,
      JSON.stringify({
        status: "completed",
        overallScore: 4.2,
        overallLabel: "strong",
        validatorResults: {
          toc_field_check: { status: "passed" },
          section_map_check: { status: "passed" },
          visual_front_matter_check: { status: "passed" },
        },
      }),
    );

    const completed = evaluateWordBenchmarkTaskArtifacts(paths.taskDir);
    expect(completed.status).toBe("completed");
    expect(completed.missingArtifacts).toEqual([]);
  });
});
