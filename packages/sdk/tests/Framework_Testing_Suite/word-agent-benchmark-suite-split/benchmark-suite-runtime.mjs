import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

function parseJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function normalizePreviewText(value) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function fixtureMatchScore(fixture, session) {
  const expected = fixture.expected_session_fingerprint;
  if (!expected) return -Infinity;

  let score = 0;
  if (expected.pageCount === session.pageCount) score += 4;
  if (expected.sectionCount === session.sectionCount) score += 3;
  if (expected.tableCount === session.tableCount) score += 2;
  if (
    expected.changeTrackingMode.toLowerCase() ===
    session.changeTrackingMode.toLowerCase()
  ) {
    score += 2;
  }

  const preview = normalizePreviewText(session.previewText ?? "");
  for (const marker of expected.previewMarkers ?? []) {
    if (preview.includes(marker.toLowerCase())) score += 5;
  }

  return score;
}

export function matchWordBenchmarkFixtures(fixtures, sessions) {
  const availableFixtures = new Map(
    fixtures.map((fixture) => [fixture.source_doc_id, fixture]),
  );
  const matches = [];
  const unmatchedSessions = [];

  for (const session of sessions) {
    const ranked = [...availableFixtures.values()]
      .map((fixture) => ({
        fixture,
        score: fixtureMatchScore(fixture, session),
      }))
      .sort((left, right) => right.score - left.score);

    const best = ranked[0];
    if (!best || best.score < 8 || !best.fixture.file) {
      unmatchedSessions.push(session);
      continue;
    }

    matches.push({
      ...session,
      source_doc_id: best.fixture.source_doc_id,
      fixtureFile: best.fixture.file,
      display_name: best.fixture.display_name,
      fixtureSha256: best.fixture.sha256 ?? null,
    });
    availableFixtures.delete(best.fixture.source_doc_id);
  }

  matches.sort((left, right) => left.run_seq - right.run_seq);

  return {
    matches,
    unmatchedFixtures: [...availableFixtures.values()],
    unmatchedSessions,
  };
}

export function deriveWordBenchmarkRuntimePolicy(task) {
  const highRiskRecovery =
    (task.mutation_ids?.length ?? 0) > 0 || task.phase >= 8;
  return {
    promptTimeoutMs: highRiskRecovery ? 15 * 60_000 : 5 * 60_000,
    resetSessionBeforeTask: true,
  };
}

export function evaluateWordBenchmarkTaskArtifacts(taskDir) {
  const requiredFiles = [
    "task-manifest.json",
    "run-metadata.json",
    "score.json",
    "human-review.md",
    "action-log.ndjson",
    "baseline-reference.json",
    "summary.txt",
    "metadata.json",
    "inspect.json",
    "state.json",
    "diag.json",
  ];
  const missingArtifacts = requiredFiles.filter(
    (file) => !existsSync(path.join(taskDir, file)),
  );
  if (missingArtifacts.length > 0) {
    return { status: "pending", missingArtifacts };
  }

  const score = parseJson(path.join(taskDir, "score.json"));
  const runMetadata = parseJson(path.join(taskDir, "run-metadata.json"));
  const actionLog = readFileSync(
    path.join(taskDir, "action-log.ndjson"),
    "utf8",
  ).trim();
  const humanReview = readFileSync(
    path.join(taskDir, "human-review.md"),
    "utf8",
  );

  if (score.status === "completed") {
    return { status: "completed", missingArtifacts: [] };
  }
  if (score.status === "failed" || score.autoFailApplied) {
    return { status: "failed", missingArtifacts: [] };
  }
  if (score.status === "validated") {
    const hasHumanScore = /- Score \(1-5\):\s*[1-5]/.test(humanReview);
    return {
      status: hasHumanScore ? "completed" : "awaiting_human_review",
      missingArtifacts: [],
    };
  }
  if (
    runMetadata.executionStatus === "agent_run_recorded" ||
    runMetadata.executionStatus === "prompt_finished" ||
    runMetadata.executionStatus === "validation_finished"
  ) {
    if (actionLog.length > 0) {
      return { status: "awaiting_validation", missingArtifacts: [] };
    }
  }
  if (
    runMetadata.executionStatus === "failed" &&
    score.status !== "failed"
  ) {
    return { status: "failed", missingArtifacts: [] };
  }
  return { status: "ready", missingArtifacts: [] };
}

export function summarizeWordBenchmarkRun(runDir) {
  const fixtureNames = readdirSync(runDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const fixtureSummaries = fixtureNames.map((fixtureName) => {
    const fixtureDir = path.join(runDir, fixtureName);
    const children = readdirSync(fixtureDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const taskDirs = children.filter((entry) => entry !== "baseline-smoke");
    let pendingTasks = 0;
    let readyTasks = 0;
    let awaitingHumanReviewTasks = 0;
    let failedTasks = 0;
    let completedTasks = 0;

    for (const taskName of taskDirs) {
      const artifactStatus = evaluateWordBenchmarkTaskArtifacts(
        path.join(fixtureDir, taskName),
      );
      if (artifactStatus.status === "completed") completedTasks++;
      else if (artifactStatus.status === "awaiting_human_review")
        awaitingHumanReviewTasks++;
      else if (artifactStatus.status === "failed") failedTasks++;
      else if (artifactStatus.status === "ready") readyTasks++;
      else pendingTasks++;
    }

    return {
      fixtureName,
      hasBaselineSmoke: existsSync(
        path.join(fixtureDir, "baseline-smoke", "benchmark-baseline", "summary.txt"),
      ),
      taskCount: taskDirs.length,
      pendingTasks,
      readyTasks,
      awaitingHumanReviewTasks,
      failedTasks,
      completedTasks,
    };
  });

  return {
    runDir,
    fixtureCount: fixtureSummaries.length,
    taskCount: fixtureSummaries.reduce((sum, fixture) => sum + fixture.taskCount, 0),
    pendingTasks: fixtureSummaries.reduce(
      (sum, fixture) => sum + fixture.pendingTasks,
      0,
    ),
    readyTasks: fixtureSummaries.reduce((sum, fixture) => sum + fixture.readyTasks, 0),
    awaitingHumanReviewTasks: fixtureSummaries.reduce(
      (sum, fixture) => sum + fixture.awaitingHumanReviewTasks,
      0,
    ),
    failedTasks: fixtureSummaries.reduce((sum, fixture) => sum + fixture.failedTasks, 0),
    completedTasks: fixtureSummaries.reduce(
      (sum, fixture) => sum + fixture.completedTasks,
      0,
    ),
    fixtureSummaries,
  };
}
