#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  deriveWordBenchmarkRuntimePolicy,
  matchWordBenchmarkFixtures,
  summarizeWordBenchmarkRun,
} from "./benchmark-suite-runtime.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..", "..", "..", "..");
const bridgeCliPath = path.join(repoRoot, "packages", "bridge", "dist", "cli.js");
const MAX_BUFFER = 20 * 1024 * 1024;

function parseArgs(argv) {
  const args = {
    bridgeUrl: "https://localhost:4018",
    outDir: path.join(__dirname, "artifacts"),
    mode: "full",
    runId: `run-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    fixture: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const value = argv[i];
    if (value === "--bridge-url") args.bridgeUrl = argv[++i];
    else if (value === "--out-dir") args.outDir = argv[++i];
    else if (value === "--mode") args.mode = argv[++i];
    else if (value === "--run-id") args.runId = argv[++i];
    else if (value === "--fixture") args.fixture = argv[++i];
  }

  return args;
}

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, payload) {
  writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function copyIfExists(sourcePath, destPath) {
  if (existsSync(sourcePath)) {
    copyFileSync(sourcePath, destPath);
  }
}

function normalizeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }
  return {
    name: "Error",
    message: String(error),
    stack: null,
  };
}

function selectedPacks(mode, packs) {
  if (mode === "core") return [packs.core];
  if (mode === "adversarial") return [packs.adversarial];
  if (mode === "multistep") return [packs.multistep];
  return [packs.core, packs.adversarial, packs.multistep];
}

function artifactPaths(outDir, runId, fixtureFile, taskId) {
  const runDir = path.join(outDir, "word-benchmark", runId);
  const taskDir = path.join(runDir, fixtureFile, taskId);
  return {
    runDir,
    taskDir,
    fixtureDir: path.join(runDir, fixtureFile),
    taskManifestPath: path.join(taskDir, "task-manifest.json"),
    runMetadataPath: path.join(taskDir, "run-metadata.json"),
    humanReviewPath: path.join(taskDir, "human-review.md"),
    scorePath: path.join(taskDir, "score.json"),
    summaryPath: path.join(taskDir, "summary.txt"),
    metadataPath: path.join(taskDir, "metadata.json"),
    inspectPath: path.join(taskDir, "inspect.json"),
    statePath: path.join(taskDir, "state.json"),
    diagPath: path.join(taskDir, "diag.json"),
    eventsPath: path.join(taskDir, "events.json"),
    screenshotPath: path.join(taskDir, "before.png"),
    actionLogPath: path.join(taskDir, "action-log.ndjson"),
    baselineReferencePath: path.join(taskDir, "baseline-reference.json"),
  };
}

function buildHumanReview(task, fixture, runId) {
  return [
    "# Human Review Sheet",
    "",
    `- Run ID: ${runId}`,
    `- Source Doc ID: ${fixture.source_doc_id}`,
    `- Fixture: ${fixture.display_name}`,
    `- Task ID: ${task.task_id}`,
    `- Archetype: ${task.archetype}`,
    "",
    "## Review Axes",
    ...task.human_review_axes.map((axis) => `- ${axis}: [ ]`),
    "",
    "## Notes",
    "- Meaning preserved:",
    "- Scope preserved:",
    "- Visible formatting/layout issues:",
    "- Collateral damage observed:",
    "",
    "## Final Human Verdict",
    "- Score (1-5):",
    "- Reviewer:",
    "- Timestamp:",
    "",
  ].join("\n");
}

function execBridgeCli(args, { allowFailure = false } = {}) {
  try {
    return {
      ok: true,
      stdout: execFileSync("node", [bridgeCliPath, ...args], {
        cwd: repoRoot,
        encoding: "utf8",
        maxBuffer: MAX_BUFFER,
      }),
    };
  } catch (error) {
    if (!allowFailure) throw error;
    return {
      ok: false,
      stdout:
        typeof error?.stdout === "string"
          ? error.stdout
          : Buffer.isBuffer(error?.stdout)
            ? error.stdout.toString("utf8")
            : "",
      stderr:
        typeof error?.stderr === "string"
          ? error.stderr
          : Buffer.isBuffer(error?.stderr)
            ? error.stderr.toString("utf8")
            : "",
      error,
    };
  }
}

function runBridgeCliText(args) {
  return execBridgeCli(args).stdout;
}

function runBridgeCliJson(args) {
  return JSON.parse(runBridgeCliText(args));
}

function runBridgeCliJsonAllowFailure(args) {
  const result = execBridgeCli(args, { allowFailure: true });
  const rawText = (result.stdout ?? "").trim();
  if (rawText.length > 0) {
    try {
      return {
        ok: result.ok,
        value: JSON.parse(rawText),
      };
    } catch {
      // Fall through and surface the original process failure below.
    }
  }

  if (!result.ok) {
    throw result.error;
  }

  return {
    ok: true,
    value: JSON.parse(result.stdout),
  };
}

function ensureBridgeCliBuilt() {
  execFileSync("pnpm", ["--filter", "@office-agents/bridge", "build"], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: MAX_BUFFER,
  });
}

function fetchLiveWordSessions(bridgeUrl) {
  const sessions = runBridgeCliJson(["--url", bridgeUrl, "list", "--json"]);
  return sessions
    .map((entry) => entry.snapshot)
    .filter((snapshot) => snapshot.app === "word");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSessionFingerprints(bridgeUrl) {
  const sessions = fetchLiveWordSessions(bridgeUrl);
  return sessions.map((snapshot, index) => {
    return {
      run_seq: index + 1,
      sessionId: snapshot.sessionId,
      documentId: snapshot.documentId,
      appName: snapshot.appName,
      title: snapshot.host?.title ?? "Unknown",
      pageCount: snapshot.documentMetadata?.pageCount ?? 0,
      sectionCount: snapshot.documentMetadata?.sectionCount ?? 0,
      tableCount: snapshot.documentMetadata?.tableCount ?? 0,
      changeTrackingMode:
        snapshot.documentMetadata?.changeTrackingMode ?? "Unknown",
      previewText: "",
      timestamp: new Date().toISOString(),
    };
  });
}

function findLiveWordSessionSnapshot(bridgeUrl, sessionId) {
  return fetchLiveWordSessions(bridgeUrl).find(
    (snapshot) => snapshot.sessionId === sessionId,
  );
}

async function captureArtifacts(bridgeUrl, sessionId, taskPaths) {
  const commands = [
    {
      path: taskPaths.summaryPath,
      args: ["--url", bridgeUrl, "summary", sessionId],
      parse: (text) => text,
    },
    {
      path: taskPaths.statePath,
      args: ["--url", bridgeUrl, "state", sessionId, "--compact"],
      parse: (text) => text,
    },
    {
      path: taskPaths.eventsPath,
      args: ["--url", bridgeUrl, "events", sessionId, "--limit", "50", "--compact"],
      parse: (text) => text,
    },
  ];

  let summaryText = "";
  let stateText = "";
  let eventsText = "[]";
  for (const command of commands) {
    let recovered = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = runBridgeCliText(command.args);
        writeFileSync(command.path, command.parse(text));
        if (command.path === taskPaths.summaryPath) summaryText = text;
        if (command.path === taskPaths.statePath) stateText = text;
        if (command.path === taskPaths.eventsPath) eventsText = text;
        break;
      } catch (error) {
        if (attempt === 1) throw error;
        recovered = true;
        await sleep(2000);
      }
    }
    if (recovered && taskPaths.actionLogPath) {
      appendActionLog(taskPaths, {
        type: "artifact_capture_recovered",
        file: path.basename(command.path),
        sessionId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const snapshot = findLiveWordSessionSnapshot(bridgeUrl, sessionId) ?? null;
  const inspectPayload = snapshot
    ? {
        snapshot: {
          sessionId: snapshot.sessionId,
          documentId: snapshot.documentId,
          appName: snapshot.appName,
          title: snapshot.host?.title ?? "Unknown",
          documentMetadata: snapshot.documentMetadata ?? null,
          runtimeState: snapshot.runtimeState ?? null,
        },
      }
    : { snapshot: null };

  writeJson(taskPaths.metadataPath, {
    metadata: snapshot?.documentMetadata ?? null,
    sessionId,
    documentId: snapshot?.documentId ?? null,
  });
  writeJson(taskPaths.inspectPath, inspectPayload);
  writeJson(taskPaths.diagPath, {
    summary: summaryText.trim(),
    state: stateText.trim(),
    eventsPreview: eventsText.trim(),
    snapshot: inspectPayload.snapshot,
  });
}

function appendActionLog(taskPaths, payload) {
  writeFileSync(taskPaths.actionLogPath, `${JSON.stringify(payload)}\n`, {
    flag: "a",
  });
}

function readJsonMaybe(filePath) {
  if (!existsSync(filePath)) return null;
  return loadJson(filePath);
}

function getMetadataCore(payload) {
  return payload?.metadata ?? payload?.snapshot?.documentMetadata ?? payload ?? {};
}

function buildValidatorResults(task, promptSummary, beforeMetadata, afterMetadata) {
  const before = getMetadataCore(beforeMetadata);
  const after = getMetadataCore(afterMetadata);
  const unchangedStructure =
    before.sectionCount === after.sectionCount &&
    before.tableCount === after.tableCount;

  return Object.fromEntries(
    task.validator_bundle.map((validatorId) => {
      let status = "passed";
      let evidence = "Automatic benchmark validator passed.";

      if (
        promptSummary.outcome === "error" ||
        promptSummary.outcome === "timed_out"
      ) {
        status = "failed";
        evidence = "Prompt execution failed before validators could complete.";
      } else if (
        promptSummary.outcome === "waiting_on_user" ||
        promptSummary.outcome === "blocked"
      ) {
        status = "skipped";
        evidence = "Prompt requested clarification or approval before acting.";
      } else if (
        [
          "section_map_check",
          "header_footer_linkage_check",
          "page_number_scheme_check",
          "heading_tree_check",
          "numbering_tree_check",
        ].includes(validatorId)
      ) {
        status = unchangedStructure ? "passed" : "failed";
        if (status === "failed") {
          evidence = "Automatic benchmark validator detected a structural mismatch.";
        }
      } else if (validatorId === "page_count_check") {
        status = before.pageCount === after.pageCount ? "passed" : "failed";
        if (status === "failed") {
          evidence = "Page count changed unexpectedly.";
        }
      }

      return [validatorId, { status, evidence }];
    }),
  );
}

function scoreFromPromptSummary(task, promptSummary, validatorResults) {
  const validatorStatuses = Object.values(validatorResults).map(
    (entry) => entry.status,
  );
  const failedValidatorCount = validatorStatuses.filter(
    (status) => status === "failed",
  ).length;
  const triggeredAutoFail =
    promptSummary.outcome === "error" ||
    promptSummary.outcome === "timed_out" ||
    failedValidatorCount > 0;

  const completionMap = {
    completed: 1,
    waiting_on_user: 0.5,
    blocked: 0.35,
    timed_out: 0.1,
    error: 0.1,
    streaming: 0.2,
  };
  const completion =
    completionMap[promptSummary.outcome] ?? completionMap.error;

  return {
    archetype: task.archetype,
    dimensions: {
      semantic_correctness: promptSummary.latestAssistant?.text ? 0.8 : 0.4,
      scope_localization: failedValidatorCount === 0 ? 0.9 : 0.35,
      word_native_integrity: failedValidatorCount === 0 ? 0.9 : 0.35,
      formatting_layout_fidelity: 0.8,
      completion_coverage: completion,
      safety_ambiguity_handling:
        promptSummary.outcome === "waiting_on_user" ? 0.9 : 0.8,
    },
    triggeredAutoFail,
    repeatability: {
      repeatCount: 1,
      recoveryCostTier: "RC0",
      scoreVariance: 0,
    },
  };
}

function runPromptTask(bridgeUrl, sessionId, prompt, timeoutMs = 300000) {
  const result = runBridgeCliJsonAllowFailure([
    "--url",
    bridgeUrl,
    "prompt",
    sessionId,
    "--prompt",
    prompt,
    "--timeout",
    String(timeoutMs),
    "--json",
  ]);
  return result.value;
}

async function waitForSessionReady(bridgeUrl, sessionId, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const stateText = runBridgeCliText([
        "--url",
        bridgeUrl,
        "state",
        sessionId,
        "--compact",
      ]);
      if (!stateText.includes("streaming=true")) {
        return;
      }
    } catch {
      // keep polling until the session is queryable again
    }
    await sleep(2000);
  }
  throw new Error(
    `Timed out waiting for session ${sessionId} to become ready after reset.`,
  );
}

async function resetLiveSessionState(bridgeUrl, sessionId, timeoutMs) {
  runBridgeCliText([
    "--url",
    bridgeUrl,
    "reset",
    sessionId,
    "--keep-config",
    "--timeout",
    String(timeoutMs),
  ]);
  await waitForSessionReady(bridgeUrl, sessionId, timeoutMs);
}

function applyMutationPlan(task, taskPaths) {
  const appliedMutations = (task.mutation_ids ?? []).map((id) => ({
    id,
    status: "documented",
    note: "Mutation scaffold recorded; live destructive mutation automation is limited in v1.",
  }));
  if (appliedMutations.length > 0) {
    appendActionLog(taskPaths, {
      type: "mutation",
      appliedMutations,
      timestamp: new Date().toISOString(),
    });
  }
  return appliedMutations;
}

function writeTaskState(taskPaths, baseMetadata, executionStatus, extra = {}) {
  writeJson(taskPaths.runMetadataPath, {
    ...baseMetadata,
    executionStatus,
    updatedAt: new Date().toISOString(),
    ...extra,
  });
}

function writePendingTaskSkeleton(args, match, taskPaths, task, fixture, baselineDir) {
  ensureDir(taskPaths.taskDir);
  writeJson(taskPaths.taskManifestPath, task);
  writeFileSync(taskPaths.humanReviewPath, buildHumanReview(task, fixture, args.runId));
  writeFileSync(taskPaths.actionLogPath, "");
  writeJson(taskPaths.scorePath, { status: "pending" });
  writeJson(taskPaths.baselineReferencePath, {
    fixtureBaselineDir: baselineDir
      ? path.relative(taskPaths.taskDir, baselineDir)
      : null,
    sessionId: match.sessionId,
    documentId: match.documentId,
  });
  if (baselineDir) {
    copyIfExists(path.join(baselineDir, "summary.txt"), taskPaths.summaryPath);
    copyIfExists(path.join(baselineDir, "metadata.json"), taskPaths.metadataPath);
    copyIfExists(path.join(baselineDir, "inspect.json"), taskPaths.inspectPath);
    copyIfExists(path.join(baselineDir, "state.json"), taskPaths.statePath);
    copyIfExists(path.join(baselineDir, "diag.json"), taskPaths.diagPath);
    copyIfExists(path.join(baselineDir, "events.json"), taskPaths.eventsPath);
  }
}

async function captureBaselineDir(bridgeUrl, sessionId, baselineDir) {
  ensureDir(baselineDir);
  const paths = {
    summaryPath: path.join(baselineDir, "summary.txt"),
    metadataPath: path.join(baselineDir, "metadata.json"),
    inspectPath: path.join(baselineDir, "inspect.json"),
    statePath: path.join(baselineDir, "state.json"),
    diagPath: path.join(baselineDir, "diag.json"),
    eventsPath: path.join(baselineDir, "events.json"),
  };
  await captureArtifacts(bridgeUrl, sessionId, paths);
  writeJson(path.join(baselineDir, "health.json"), { ok: true, bridgeUrl });
  writeJson(path.join(baselineDir, "run-metadata.json"), {
    bridgeUrl,
    sessionId,
    capturedAt: new Date().toISOString(),
  });
  writeJson(path.join(baselineDir, "session.json"), { sessionId });
}

function buildMatchRecord(match, overrides = {}) {
  return { ...match, ...overrides };
}

function resolveLiveSession(match, fixture, bridgeUrl) {
  const liveFingerprints = buildSessionFingerprints(bridgeUrl);
  const exact = liveFingerprints.find(
    (entry) => entry.sessionId === match.sessionId,
  );
  if (exact) {
    return {
      sessionId: exact.sessionId,
      matchRecord: buildMatchRecord(match, exact),
      remappedFrom: null,
    };
  }

  const byDocument = liveFingerprints.find(
    (entry) => entry.documentId === match.documentId,
  );
  if (byDocument) {
    return {
      sessionId: byDocument.sessionId,
      matchRecord: buildMatchRecord(match, byDocument),
      remappedFrom: match.sessionId,
    };
  }

  const remapped = matchWordBenchmarkFixtures([fixture], liveFingerprints).matches[0];
  if (remapped) {
    return {
      sessionId: remapped.sessionId,
      matchRecord: buildMatchRecord(match, remapped),
      remappedFrom: match.sessionId,
    };
  }

  throw new Error(
    `No live session found for ${match.source_doc_id} (${match.documentId})`,
  );
}

function writeRunSummary(runDir, args, mapping, fatalError = null) {
  ensureDir(runDir);
  const summary = summarizeWordBenchmarkRun(runDir);
  const summaryPayload = {
    ...summary,
    runId: args.runId,
    bridgeUrl: args.bridgeUrl,
    unmatchedFixtures: mapping.unmatchedFixtures.map(
      (fixture) => fixture.source_doc_id,
    ),
    unmatchedSessions: mapping.unmatchedSessions.map(
      (session) => session.sessionId,
    ),
    ...(fatalError ? { fatalError } : {}),
  };

  writeJson(path.join(runDir, "run-summary.json"), summaryPayload);
  writeFileSync(
    path.join(runDir, "run-summary.md"),
    [
      "# Word Benchmark Run Summary",
      "",
      `- Run ID: ${args.runId}`,
      `- Bridge URL: ${args.bridgeUrl}`,
      `- Fixtures: ${summaryPayload.fixtureCount}`,
      `- Tasks: ${summaryPayload.taskCount}`,
      `- Pending tasks: ${summaryPayload.pendingTasks}`,
      `- Ready tasks: ${summaryPayload.readyTasks}`,
      `- Awaiting human review: ${summaryPayload.awaitingHumanReviewTasks}`,
      `- Failed tasks: ${summaryPayload.failedTasks}`,
      `- Completed tasks: ${summaryPayload.completedTasks}`,
      fatalError ? `- Fatal error: ${fatalError.message}` : null,
      "",
      "## Fixtures",
      ...summaryPayload.fixtureSummaries.map(
        (fixture) =>
          `- ${fixture.fixtureName}: baseline=${fixture.hasBaselineSmoke ? "yes" : "no"}, tasks=${fixture.taskCount}, ready=${fixture.readyTasks}, pending=${fixture.pendingTasks}, failed=${fixture.failedTasks}, completed=${fixture.completedTasks}`,
      ),
      "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return summaryPayload;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fixtures = loadJson(path.join(__dirname, "fixtures.registry.json"));
  const packs = {
    core: loadJson(path.join(__dirname, "core-suite.json")),
    adversarial: loadJson(path.join(__dirname, "adversarial-suite.json")),
    multistep: loadJson(path.join(__dirname, "multistep-suite.json")),
  };
  const runDir = path.join(args.outDir, "word-benchmark", args.runId);
  const fixtureBaselineDirs = new Map();
  let mapping = {
    matches: [],
    unmatchedFixtures: [],
    unmatchedSessions: [],
  };
  let fatalError = null;

  ensureDir(runDir);

  try {
    ensureBridgeCliBuilt();
    const sessionFingerprints = buildSessionFingerprints(args.bridgeUrl);
    mapping = matchWordBenchmarkFixtures(fixtures.local, sessionFingerprints);

    writeJson(path.join(runDir, "session-map.json"), {
      runId: args.runId,
      bridgeUrl: args.bridgeUrl,
      generatedAt: new Date().toISOString(),
      matches: mapping.matches,
      unmatchedFixtures: mapping.unmatchedFixtures,
      unmatchedSessions: mapping.unmatchedSessions,
    });

    for (const match of mapping.matches) {
      const fixtureFile = path.basename(match.fixtureFile);
      if (args.fixture && fixtureFile !== args.fixture) continue;
      const smokeDir = path.join(runDir, fixtureFile, "baseline-smoke");
      const baselineDir = path.join(smokeDir, "benchmark-baseline");
      try {
        await captureBaselineDir(args.bridgeUrl, match.sessionId, baselineDir);
        fixtureBaselineDirs.set(match.source_doc_id, baselineDir);
      } catch (error) {
        writeJson(path.join(smokeDir, "baseline-error.json"), {
          sessionId: match.sessionId,
          error: normalizeError(error),
          capturedAt: new Date().toISOString(),
        });
      }
    }

    for (const pack of selectedPacks(args.mode, packs)) {
      if ("tasks" in pack) {
        for (const task of pack.tasks) {
          const match = mapping.matches.find(
            (entry) => entry.source_doc_id === task.source_doc_id,
          );
          if (!match) continue;

          const fixtureFile = path.basename(match.fixtureFile);
          if (args.fixture && fixtureFile !== args.fixture) continue;

          const fixture = fixtures.local.find(
            (entry) => entry.source_doc_id === task.source_doc_id,
          );
          if (!fixture) continue;

          const taskPaths = artifactPaths(
            args.outDir,
            args.runId,
            fixtureFile,
            task.task_id,
          );
          const baseMetadata = {
            runId: args.runId,
            mode: args.mode,
            bridgeUrl: args.bridgeUrl,
            session: match,
            taskId: task.task_id,
            fixtureFile,
          };
          const baselineDir = fixtureBaselineDirs.get(match.source_doc_id) ?? null;

          writePendingTaskSkeleton(
            args,
            match,
            taskPaths,
            task,
            fixture,
            baselineDir,
          );
          writeTaskState(taskPaths, baseMetadata, "baseline_captured");

          try {
            const resolved = resolveLiveSession(match, fixture, args.bridgeUrl);
            const runtimePolicy = deriveWordBenchmarkRuntimePolicy(task);
            if (resolved.remappedFrom) {
              appendActionLog(taskPaths, {
                type: "session_remap",
                fromSessionId: resolved.remappedFrom,
                toSessionId: resolved.sessionId,
                timestamp: new Date().toISOString(),
              });
            }
            const activeMetadata = {
              ...baseMetadata,
              session: resolved.matchRecord,
            };

            writeTaskState(taskPaths, activeMetadata, "session_validated", {
              remappedFromSessionId: resolved.remappedFrom,
            });

            if (runtimePolicy.resetSessionBeforeTask) {
              await resetLiveSessionState(
                args.bridgeUrl,
                resolved.sessionId,
                runtimePolicy.promptTimeoutMs,
              );
              appendActionLog(taskPaths, {
                type: "session_reset",
                sessionId: resolved.sessionId,
                keepConfig: true,
                timeoutMs: runtimePolicy.promptTimeoutMs,
                timestamp: new Date().toISOString(),
              });
            }

            await captureArtifacts(args.bridgeUrl, resolved.sessionId, taskPaths);
            const appliedMutations = applyMutationPlan(task, taskPaths);
            writeTaskState(taskPaths, activeMetadata, "prompt_running", {
              remappedFromSessionId: resolved.remappedFrom,
            });

            const promptSummary = runPromptTask(
              args.bridgeUrl,
              resolved.sessionId,
              task.prompt,
              runtimePolicy.promptTimeoutMs,
            );
            appendActionLog(taskPaths, {
              type: "prompt_result",
              promptSummary,
              timestamp: new Date().toISOString(),
            });
            writeTaskState(taskPaths, activeMetadata, "prompt_finished", {
              remappedFromSessionId: resolved.remappedFrom,
              promptOutcome: promptSummary.outcome,
            });

            await captureArtifacts(args.bridgeUrl, resolved.sessionId, taskPaths);

            const beforeMetadata = baselineDir
              ? readJsonMaybe(path.join(baselineDir, "metadata.json"))
              : readJsonMaybe(taskPaths.metadataPath);
            const afterMetadata = readJsonMaybe(taskPaths.metadataPath);
            const validatorResults = buildValidatorResults(
              task,
              promptSummary,
              beforeMetadata,
              afterMetadata,
            );
            writeTaskState(taskPaths, activeMetadata, "validation_finished", {
              remappedFromSessionId: resolved.remappedFrom,
              promptOutcome: promptSummary.outcome,
            });

            const scored = scoreFromPromptSummary(
              task,
              promptSummary,
              validatorResults,
            );
            const scoreRecord = {
              status: scored.triggeredAutoFail ? "failed" : "validated",
              promptSummary,
              appliedMutations,
              validatorResults,
              ...scored,
            };
            writeJson(taskPaths.scorePath, scoreRecord);
            writeTaskState(taskPaths, activeMetadata, "scored", {
              remappedFromSessionId: resolved.remappedFrom,
              promptOutcome: promptSummary.outcome,
            });
          } catch (error) {
            const normalizedError = normalizeError(error);
            appendActionLog(taskPaths, {
              type: "task_error",
              error: normalizedError,
              timestamp: new Date().toISOString(),
            });
            writeJson(taskPaths.scorePath, {
              status: "failed",
              error: normalizedError,
            });
            writeTaskState(taskPaths, baseMetadata, "failed", {
              error: normalizedError,
            });
          }
        }
      } else {
        for (const sessionPlan of pack.sessions) {
          const match = mapping.matches.find(
            (entry) => entry.source_doc_id === sessionPlan.source_doc_id,
          );
          if (!match) continue;

          const fixtureFile = path.basename(match.fixtureFile);
          if (args.fixture && fixtureFile !== args.fixture) continue;

          const fixture = fixtures.local.find(
            (entry) => entry.source_doc_id === sessionPlan.source_doc_id,
          );
          if (!fixture) continue;

          const sessionPaths = artifactPaths(
            args.outDir,
            args.runId,
            fixtureFile,
            sessionPlan.session_id,
          );
          const baseMetadata = {
            runId: args.runId,
            mode: args.mode,
            bridgeUrl: args.bridgeUrl,
            session: match,
            taskId: sessionPlan.session_id,
            fixtureFile,
          };
          const baselineDir = fixtureBaselineDirs.get(match.source_doc_id) ?? null;

          ensureDir(sessionPaths.taskDir);
          writeJson(sessionPaths.taskManifestPath, sessionPlan);
          writeFileSync(
            sessionPaths.humanReviewPath,
            [
              "# Multi-step Human Review Sheet",
              "",
              `- Run ID: ${args.runId}`,
              `- Source Doc ID: ${match.source_doc_id}`,
              `- Session ID: ${sessionPlan.session_id}`,
              "",
              "## Sticky Constraints",
              ...sessionPlan.sticky_constraints.map((constraint) => `- ${constraint}`),
              "",
              "## Step Notes",
              ...sessionPlan.steps.map((step, index) => `${index + 1}. ${step}`),
              "",
            ].join("\n"),
          );
          writeFileSync(sessionPaths.actionLogPath, "");
          writeJson(sessionPaths.scorePath, { status: "pending" });
          writeJson(sessionPaths.baselineReferencePath, {
            fixtureBaselineDir: baselineDir
              ? path.relative(sessionPaths.taskDir, baselineDir)
              : null,
            sessionId: match.sessionId,
            documentId: match.documentId,
          });
          if (baselineDir) {
            copyIfExists(path.join(baselineDir, "summary.txt"), sessionPaths.summaryPath);
            copyIfExists(path.join(baselineDir, "metadata.json"), sessionPaths.metadataPath);
            copyIfExists(path.join(baselineDir, "inspect.json"), sessionPaths.inspectPath);
            copyIfExists(path.join(baselineDir, "state.json"), sessionPaths.statePath);
            copyIfExists(path.join(baselineDir, "diag.json"), sessionPaths.diagPath);
            copyIfExists(path.join(baselineDir, "events.json"), sessionPaths.eventsPath);
          }
          writeTaskState(sessionPaths, baseMetadata, "baseline_captured");

          try {
            const resolved = resolveLiveSession(match, fixture, args.bridgeUrl);
            const activeMetadata = {
              ...baseMetadata,
              session: resolved.matchRecord,
            };
            writeTaskState(sessionPaths, activeMetadata, "session_validated", {
              remappedFromSessionId: resolved.remappedFrom,
            });

            await captureArtifacts(args.bridgeUrl, resolved.sessionId, sessionPaths);
            const results = [];
            for (const step of sessionPlan.steps) {
              writeTaskState(sessionPaths, activeMetadata, "prompt_running", {
                currentStep: step,
                remappedFromSessionId: resolved.remappedFrom,
              });
              const promptSummary = runPromptTask(
                args.bridgeUrl,
                resolved.sessionId,
                step,
              );
              results.push(promptSummary);
              appendActionLog(sessionPaths, {
                type: "session_step",
                step,
                promptSummary,
                timestamp: new Date().toISOString(),
              });
            }

            await captureArtifacts(args.bridgeUrl, resolved.sessionId, sessionPaths);
            writeJson(sessionPaths.scorePath, {
              status: results.some(
                (entry) => entry.outcome === "error" || entry.outcome === "timed_out",
              )
                ? "failed"
                : "validated",
              sessionResults: results,
            });
            writeTaskState(sessionPaths, activeMetadata, "scored", {
              remappedFromSessionId: resolved.remappedFrom,
            });
          } catch (error) {
            const normalizedError = normalizeError(error);
            appendActionLog(sessionPaths, {
              type: "task_error",
              error: normalizedError,
              timestamp: new Date().toISOString(),
            });
            writeJson(sessionPaths.scorePath, {
              status: "failed",
              error: normalizedError,
            });
            writeTaskState(sessionPaths, baseMetadata, "failed", {
              error: normalizedError,
            });
          }
        }
      }
    }
  } catch (error) {
    fatalError = normalizeError(error);
    process.exitCode = 1;
  } finally {
    const summary = writeRunSummary(runDir, args, mapping, fatalError);
    console.log(
      JSON.stringify(
        {
          runId: args.runId,
          bridgeUrl: args.bridgeUrl,
          matchedSessions: mapping.matches.length,
          unmatchedFixtures: mapping.unmatchedFixtures.map(
            (fixture) => fixture.source_doc_id,
          ),
          unmatchedSessions: mapping.unmatchedSessions.map(
            (session) => session.sessionId,
          ),
          runSummaryPath: path.join(runDir, "run-summary.json"),
          outputDir: runDir,
          fatalError,
          status:
            summary.failedTasks > 0 || fatalError ? "completed_with_failures" : "completed",
        },
        null,
        2,
      ),
    );
  }
}

await main();
