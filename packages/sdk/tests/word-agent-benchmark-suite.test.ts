import path from "node:path";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import { describe, expect, it } from "vitest";
import {
  buildWordBenchmarkTaskExecutionPlan,
  deriveWordBenchmarkRuntimePolicy,
  buildHumanReviewStub,
  evaluateWordBenchmarkTaskArtifacts,
  loadWordBenchmarkSuite,
  planArtifactPaths,
  scoreBenchmarkTaskRun,
  summarizeWordBenchmarkRun,
  type BridgeSessionFingerprint,
} from "./Framework_Testing_Suite/word-agent-benchmark-suite-split/benchmark-suite";

const suiteDir = path.join(
  __dirname,
  "Framework_Testing_Suite",
  "word-agent-benchmark-suite-split",
);

describe("word benchmark suite", () => {
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

  it("derives longer prompt budgets and forced isolation for recovery tasks", () => {
    const suite = loadWordBenchmarkSuite(suiteDir);
    const recoveryTask = suite.scenarioPacks.adversarial.tasks.find(
      (entry) => entry.task_id === "M05-contract-numbering-recovery",
    );
    const coreTask = suite.scenarioPacks.core.tasks.find(
      (entry) => entry.task_id === "T01-report-outline",
    );

    expect(recoveryTask).toBeDefined();
    expect(coreTask).toBeDefined();

    const recoveryPolicy = deriveWordBenchmarkRuntimePolicy(recoveryTask!);
    const corePolicy = deriveWordBenchmarkRuntimePolicy(coreTask!);

    expect(recoveryPolicy.promptTimeoutMs).toBe(15 * 60_000);
    expect(corePolicy.promptTimeoutMs).toBe(5 * 60_000);
    expect(recoveryPolicy.resetSessionBeforeTask).toBe(true);
    expect(corePolicy.resetSessionBeforeTask).toBe(true);
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
