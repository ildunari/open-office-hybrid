#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCapabilityLiveReviewPlan } from "./live-review-planner.ts";
import {
  appendActiveIssueEntry,
  initializeLiveReviewIssueArtifacts,
} from "./live-review-issues.ts";
import {
  advanceLiveReviewBatch,
  createLiveReviewBatchRuntime,
} from "./live-review-runtime.ts";
import { completeMinimalLiveReviewerResult } from "./live-review-reviewer.ts";
import { classifyHarnessVsLiveReviewMismatch } from "./live-review-compare.ts";
import {
  buildReviewerPrompt,
  buildTaskpanePromptSubmissionScript,
  classifyLiveExecutionReceipts,
  unwrapTaskpaneSubmissionResult,
} from "./live-review-submission.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..", "..", "..");
const MAX_BUFFER = 20 * 1024 * 1024;
const RECEIPT_EVENT_LIMIT = "200";

function parseArgs(argv) {
  const args = {
    capability: null,
    bridgeUrl: "https://localhost:4018",
    maxDocs: 2,
    maxTasks: 4,
    planOnly: false,
    sourceDocument: null,
    taskId: null,
    sessionSelector: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--capability") args.capability = argv[index + 1], index += 1;
    else if (value === "--bridge-url") args.bridgeUrl = argv[index + 1], index += 1;
    else if (value === "--max-docs") args.maxDocs = Number(argv[index + 1]), index += 1;
    else if (value === "--max-tasks") args.maxTasks = Number(argv[index + 1]), index += 1;
    else if (value === "--plan-only") args.planOnly = true;
    else if (value === "--source-document") args.sourceDocument = argv[index + 1], index += 1;
    else if (value === "--task-id") args.taskId = argv[index + 1], index += 1;
    else if (value === "--session-selector") args.sessionSelector = argv[index + 1], index += 1;
  }

  if (!args.capability && !args.sourceDocument) {
    throw new Error("Missing required --capability argument");
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
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function listFilesRecursive(rootDir, targetFileName) {
  const files = [];
  const queue = [rootDir];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || !existsSync(current)) continue;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (entry.isFile() && entry.name === targetFileName) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function loadArtifactRiskByTaskId() {
  const artifactsRoot = path.join(__dirname, "artifacts", "word-benchmark");
  if (!existsSync(artifactsRoot)) {
    return {};
  }

  const riskByTaskId = {};
  for (const scorePath of listFilesRecursive(artifactsRoot, "score.json")) {
    const taskId = path.basename(path.dirname(scorePath));
    const score = loadJson(scorePath);
    let risk = 0.5;

    if (score.autoFailApplied === true || score.status === "failed") {
      risk = 1;
    } else if (
      score.status === "validated" ||
      score.status === "completed"
    ) {
      risk = 0.1;
    } else if (
      score.status === "awaiting_human_review" ||
      score.status === "ready"
    ) {
      risk = 0.75;
    }

    riskByTaskId[taskId] = Math.max(riskByTaskId[taskId] ?? 0, risk);
  }

  return riskByTaskId;
}

function loadPlanInputs() {
  const fixtures = loadJson(path.join(__dirname, "fixtures.registry.json"));
  const core = loadJson(path.join(__dirname, "core-suite.json"));
  const adversarial = loadJson(path.join(__dirname, "adversarial-suite.json"));
  const multistep = loadJson(path.join(__dirname, "multistep-suite.json"));
  return {
    fixtures,
    tasks: [...core.tasks, ...adversarial.tasks],
    sessions: multistep.sessions,
  };
}

function getFixtureBySourceDocument(sourceDocument) {
  const inputs = loadPlanInputs();
  return inputs.fixtures.local.find(
    (fixture) => fixture.source_doc_id === sourceDocument,
  ) ?? null;
}

function sessionMatchesFixtureFingerprint(session, fixture) {
  const expected = fixture?.expected_session_fingerprint;
  const metadata = session?.documentMetadata;
  if (!expected || !metadata) return false;

  const comparableKeys = [
    "pageCount",
    "sectionCount",
    "tableCount",
    "changeTrackingMode",
  ];

  return comparableKeys.every((key) => {
    if (expected[key] === undefined) return true;
    return metadata[key] === expected[key];
  });
}

export function resolveLiveReviewSession({
  sessions,
  sourceDocument,
  sessionSelector = null,
}) {
  if (!sessions || sessions.length === 0) {
    throw new Error("No Word bridge sessions available for live review.");
  }

  if (sessionSelector) {
    const exact = sessions.find(
      (entry) =>
        entry.sessionId === sessionSelector ||
        entry.documentId === sessionSelector,
    );
    if (exact) return exact;

    throw new Error(
      `Requested live-review session ${sessionSelector} was not found among connected Word sessions.`,
    );
  }

  if (sessions.length === 1) {
    return sessions[0];
  }

  const fixture = getFixtureBySourceDocument(sourceDocument);
  const fingerprintMatches = sessions.filter((entry) =>
    sessionMatchesFixtureFingerprint(entry, fixture),
  );
  if (fingerprintMatches.length === 1) {
    return fingerprintMatches[0];
  }

  if (fingerprintMatches.length > 1) {
    throw new Error(
      `Multiple Word sessions match ${sourceDocument}; pass an explicit session selector.`,
    );
  }

  throw new Error(
    `Multiple Word sessions are connected and none uniquely match ${sourceDocument}; close the extra document windows or pass an explicit session selector.`,
  );
}

function buildManualPlan({ sourceDocument, taskId }) {
  const inputs = loadPlanInputs();
  const fixture = inputs.fixtures.local.find(
    (entry) => entry.source_doc_id === sourceDocument,
  );
  if (!fixture) {
    throw new Error(`Unknown source document: ${sourceDocument}`);
  }

  const allCandidates = [
    ...inputs.tasks.map((task) => ({
      taskId: task.task_id,
      prompt: task.prompt,
      phase: task.phase,
      kind: "task",
      sourceDocument: task.source_doc_id,
    })),
    ...inputs.sessions.map((session) => ({
      taskId: session.session_id,
      prompt: session.goal,
      phase: session.phase,
      kind: "session",
      sourceDocument: session.source_doc_id,
    })),
  ].filter((entry) => entry.sourceDocument === sourceDocument);

  const selectedTask = taskId
    ? allCandidates.find((entry) => entry.taskId === taskId)
    : allCandidates.sort((left, right) => right.phase - left.phase)[0];

  if (!selectedTask) {
    throw new Error(
      taskId
        ? `Unknown task ${taskId} for ${sourceDocument}`
        : `No task candidates found for ${sourceDocument}`,
    );
  }

  return {
    capabilityId: "manual_orchestrator_led",
    entryMode: "orchestrator_led",
    maxDocs: 1,
    maxTasksPerDocument: 1,
    documents: [
      {
        sourceDocument: fixture.source_doc_id,
        displayName: fixture.display_name,
        fixtureFile: fixture.file,
        selectionScore: 1,
        selectionReason: "manual_orchestrator_led",
        tasks: [
          {
            taskId: selectedTask.taskId,
            sourceDocument: fixture.source_doc_id,
            phase: selectedTask.phase,
            kind: selectedTask.kind,
            artifactRisk: 0,
            riskScore: Number((selectedTask.phase / 10).toFixed(4)),
          },
        ],
      },
    ],
  };
}

function makeBatchId(capabilityId, sourceDocument) {
  return `lrb-${capabilityId}-${sourceDocument}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

function createClone(batchId, document, taskId, cloneAttempt = 1) {
  const cloneRoot = path.join(os.tmpdir(), "office-agents-live-review", batchId);
  ensureDir(cloneRoot);
  const cloneId = `clone-${taskId}-${cloneAttempt}`;
  const fixturePath = path.join(__dirname, document.fixtureFile ?? "");
  const clonePath = path.join(
    cloneRoot,
    `${cloneId}-${path.basename(document.fixtureFile ?? `${taskId}.docx`)}`,
  );
  if (document.fixtureFile && existsSync(fixturePath)) {
    copyFileSync(fixturePath, clonePath);
  }
  return { cloneId, clonePath };
}

function getOfficeBridgeSessions(bridgeUrl) {
  try {
    return execBridgeJson(bridgeUrl, "list");
  } catch {
    return [];
  }
}

function execBridgeJson(bridgeUrl, ...commandArgs) {
  const output = execFileSync(
    "pnpm",
    ["exec", "office-bridge", "--url", bridgeUrl, ...commandArgs, "--json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: MAX_BUFFER,
    },
  );
  return JSON.parse(output);
}

function isRetryableBridgeDisconnect(error) {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("Bridge session disconnected: socket closed") ||
    message.includes("No bridge sessions available") ||
    message.includes("No sessions connected")
  );
}

async function execBridgeJsonWithReconnect(
  bridgeUrl,
  commandArgs,
  {
    sessionSelector = null,
    retries = 5,
    delayMs = 1000,
  } = {},
) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return execBridgeJson(bridgeUrl, ...commandArgs);
    } catch (error) {
      lastError = error;
      if (!isRetryableBridgeDisconnect(error) || attempt === retries) {
        throw error;
      }

      await sleep(delayMs);

      if (sessionSelector) {
        const sessions = getOfficeBridgeSessions(bridgeUrl)
          .map((entry) => entry.snapshot)
          .filter((snapshot) => snapshot?.app === "word");
        if (sessions.length > 0) {
          const session = sessions.find(
            (entry) =>
              entry.sessionId === sessionSelector ||
              entry.documentId === sessionSelector,
          );
          if (session) {
            sessionSelector = session.sessionId;
          }
        }
      }
    }
  }

  throw lastError;
}

function execBridgeTaskpaneJson(bridgeUrl, sessionId, code) {
  const output = execFileSync(
    "pnpm",
    [
      "exec",
      "office-bridge",
      "--url",
      bridgeUrl,
      "exec",
      sessionId,
      "--unsafe",
      "--code",
      code,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: MAX_BUFFER,
    },
  );
  return JSON.parse(output);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForIdleSession({
  bridgeUrl,
  sessionId,
  timeoutMs = 120000,
}) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const state = execBridgeJson(bridgeUrl, "state", sessionId);
    if (state?.isStreaming === false) {
      return state;
    }
    await sleep(1000);
  }

  throw new Error(
    `Timed out waiting for Hybrid session ${sessionId} to become idle.`,
  );
}

async function observeLiveExecutionReceipts({
  bridgeUrl,
  sessionId,
  baselineMessageCount,
  baselineEventIds,
  timeoutMs = 75000,
}) {
  const stateSnapshots = [];
  const newEvents = [];
  const seenEventIds = new Set(baselineEventIds);
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const state = await execBridgeJsonWithReconnect(
      bridgeUrl,
      ["state", sessionId],
      { sessionSelector: sessionId },
    );
    stateSnapshots.push(state);

    const events = await execBridgeJsonWithReconnect(
      bridgeUrl,
      ["events", sessionId, "--limit", RECEIPT_EVENT_LIMIT],
      { sessionSelector: sessionId },
    );
    for (const event of events) {
      if (seenEventIds.has(event.id)) continue;
      seenEventIds.add(event.id);
      newEvents.push(event);
    }

    const receipts = classifyLiveExecutionReceipts({
      baselineMessageCount,
      stateSnapshots,
      newEvents,
    });
    if (receipts.completionObserved) {
      return { stateSnapshots, newEvents, receipts };
    }

    await sleep(1000);
  }

  return {
    stateSnapshots,
    newEvents,
    receipts: classifyLiveExecutionReceipts({
      baselineMessageCount,
      stateSnapshots,
      newEvents,
    }),
  };
}

function createReviewerReportSkeleton({
  capabilityId,
  sourceDocument,
  taskId,
  cloneId,
}) {
  return {
    task_identity: `${sourceDocument}:${taskId}`,
    capability_area: capabilityId,
    source_document: sourceDocument,
    task_id: taskId,
    clone_id: cloneId,
    timestamp: new Date().toISOString(),
    readiness_state: "preflight_pending",
    doc_opened: false,
    pane_ready: false,
    bridge_session_id: "pending",
    word_document_id: "pending",
    execution_status: "pending",
    duration_ms: 0,
    retries_used: 0,
    meaning_preserved: false,
    scope_preserved: false,
    word_native_integrity_preserved: false,
    visible_layout_formatting_issues: [],
    collateral_damage_observed: [],
    failure_classification: "pending",
    evidence_checked: [],
    verdict: "inconclusive",
    score: 0,
    confidence: 0,
    freeform_observations: "",
  };
}

function createBatchReportSkeleton(plan, document, batchId) {
  return {
    batch_id: batchId,
    capability_area: plan.capabilityId,
    source_document: document.sourceDocument,
    selected_tasks: document.tasks.map((task) => task.taskId),
    batch_intent: "diagnosis_first_live_review",
    chosen_documents: [
      {
        source_document: document.sourceDocument,
        selection_reason: document.selectionReason,
      },
    ],
    per_task_timeline: document.tasks.map((task) => ({
      task_id: task.taskId,
      events: ["batch_preflight"],
      execution_classification: "pending",
    })),
    diagnosis_summary: "pending",
    fix_attempted: false,
    rerun_improved: null,
    mismatch_map: [],
    stop_reasons: [],
    quarantined_tasks: [],
    next_action_queue: ["verify_pane_and_session"],
  };
}

function buildExecutionDiagnosticReport({
  task,
  receiptObservation,
  finalState,
}) {
  return {
    task_id: task.taskId,
    captured_at: new Date().toISOString(),
    execution_classification:
      receiptObservation.receipts.executionClassification,
    prompt_submitted: receiptObservation.receipts.promptSubmitted,
    execution_observed: receiptObservation.receipts.executionObserved,
    completion_observed: receiptObservation.receipts.completionObserved,
    read_count: receiptObservation.receipts.readCount,
    write_count: receiptObservation.receipts.writeCount,
    failed_write_count: receiptObservation.receipts.failedWriteCount,
    first_read_ts: receiptObservation.receipts.firstReadTs,
    first_write_ts: receiptObservation.receipts.firstWriteTs,
    post_write_reread_observed:
      receiptObservation.receipts.postWriteRereadObserved,
    no_write_loop_suspected: receiptObservation.receipts.noWriteLoopSuspected,
    reviewer_only_success: receiptObservation.receipts.reviewerOnlySuccess,
    write_attempted_but_failed:
      receiptObservation.receipts.writeAttemptedButFailed,
    write_succeeded_without_reread:
      receiptObservation.receipts.writeSucceededWithoutReread,
    final_runtime_mode: finalState?.mode ?? null,
    final_waiting_state: finalState?.waitingState ?? null,
    final_verification_status: finalState?.lastVerification?.status ?? null,
    degraded_guardrails: finalState?.degradedGuardrails ?? [],
  };
}

function findTaskTimeline(batchReport, taskId) {
  return batchReport.per_task_timeline.find((entry) => entry.task_id === taskId);
}

function findTaskArtifactDir(document, taskId) {
  const artifactsRoot = path.join(__dirname, "artifacts", "word-benchmark");
  if (!existsSync(artifactsRoot) || !document.fixtureFile) {
    return null;
  }

  const targetFileName = path.basename(document.fixtureFile);
  const matches = [];
  const queue = [artifactsRoot];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || !existsSync(current)) continue;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (
        entry.isFile() &&
        entry.name === "score.json" &&
        path.basename(path.dirname(fullPath)) === taskId &&
        path.basename(path.dirname(path.dirname(fullPath))) === targetFileName
      ) {
        matches.push(path.dirname(fullPath));
      }
    }
  }

  if (matches.length === 0) return null;
  return matches.sort((left, right) => {
    return statSync(right).mtimeMs - statSync(left).mtimeMs;
  })[0];
}

function buildIssueEntry({
  batchId,
  document,
  task,
  completion,
  mismatch,
}) {
  return {
    issueId: `${batchId}-${task.taskId}`,
    capabilityArea: batchId.split("-")[1] ?? "live_review",
    sourceDocument: document.sourceDocument,
    taskId: task.taskId,
    dateRunReference: batchId,
    observedBehavior: completion.diagnosisSummary,
    expectedBehavior:
      mismatch.mismatchClass === "harness_fail_live_pass"
        ? "Benchmark artifacts should agree with successful live review."
        : "Live review should align with benchmark artifact expectations.",
    reproductionSummary:
      "Run the live review batch on a fresh clone with the Hybrid pane open.",
    seenIn:
      mismatch.mismatchClass === "harness_fail_live_pass" ||
      mismatch.mismatchClass === "harness_pass_live_fail"
        ? "both"
        : "live_review",
    likelyFailureClass: mismatch.mismatchClass,
    likelySolutionSurface: mismatch.likelyFailureSurface,
    status: "open",
  };
}

async function runTask({
  bridgeUrl,
  batchId,
  batchDir,
  batchReport,
  document,
  capabilityId,
  task,
  sessionSelector,
}) {
  const clone = createClone(batchId, document, task.taskId);
  const reviewerReport = createReviewerReportSkeleton({
    capabilityId,
    sourceDocument: document.sourceDocument,
    taskId: task.taskId,
    cloneId: clone.cloneId,
  });
  let runtime = createLiveReviewBatchRuntime({
    batchId,
    capabilityArea: capabilityId,
    sourceDocument: document.sourceDocument,
    selectedTasks: [task.taskId],
  });
  const timeline = findTaskTimeline(batchReport, task.taskId);
  if (!timeline) {
    throw new Error(`Missing task timeline for ${task.taskId}`);
  }

  const sessions = getOfficeBridgeSessions(bridgeUrl)
    .map((entry) => entry.snapshot)
    .filter((snapshot) => snapshot?.app === "word");
  runtime = advanceLiveReviewBatch(runtime, {
    type: "preflight_completed",
    requiresPaneOpen: sessions.length === 0,
  });

  if (sessions.length === 0) {
    reviewerReport.readiness_state = "pane_open_required";
    reviewerReport.execution_status = "paused_for_pane";
    timeline.events.push("pane_open_required");
    batchReport.stop_reasons.push("awaiting_hybrid_pane");
    writeJson(
      path.join(batchDir, `${task.taskId}-reviewer-report.json`),
      reviewerReport,
    );
    writeJson(path.join(batchDir, `${task.taskId}-task-clone.json`), {
      clone_id: clone.cloneId,
      clone_path: clone.clonePath,
      task_id: task.taskId,
    });
    return;
  }

  const session = resolveLiveReviewSession({
    sessions,
    sourceDocument: document.sourceDocument,
    sessionSelector,
  });
  const baselineState = await waitForIdleSession({
    bridgeUrl,
    sessionId: session.sessionId,
  });
  const baselineEvents = execBridgeJson(
    bridgeUrl,
    "events",
    session.sessionId,
    "--limit",
    RECEIPT_EVENT_LIMIT,
  );

  runtime = advanceLiveReviewBatch(runtime, {
    type: "session_verified",
    bridgeSessionId: session.sessionId,
    wordDocumentId: session.documentId ?? "unknown",
    visibleTitle: session.host?.title ?? document.displayName,
  });

  const reviewerPrompt = buildReviewerPrompt({
    capabilityId,
    taskId: task.taskId,
    sourceDocument: document.sourceDocument,
  });
  const submissionScript = buildTaskpanePromptSubmissionScript({
    prompt: reviewerPrompt,
  });
  const submissionEnvelope = execBridgeTaskpaneJson(
    bridgeUrl,
    session.sessionId,
    submissionScript,
  );
  const submissionResult = unwrapTaskpaneSubmissionResult(submissionEnvelope);

  runtime = advanceLiveReviewBatch(runtime, {
    type: "reviewer_task_started",
    taskId: task.taskId,
    cloneId: clone.cloneId,
  });

  const metadata = await execBridgeJsonWithReconnect(
    bridgeUrl,
    ["metadata", "word"],
    { sessionSelector: session.sessionId },
  );
  const receiptObservation = await observeLiveExecutionReceipts({
    bridgeUrl,
    sessionId: session.sessionId,
    baselineMessageCount: baselineState.sessionStats?.messageCount ?? 0,
    baselineEventIds: baselineEvents.map((event) => event.id),
  });
  const finalState = await execBridgeJsonWithReconnect(
    bridgeUrl,
    ["state", session.sessionId],
    { sessionSelector: session.sessionId },
  );
  receiptObservation.stateSnapshots.push(finalState);
  const completion = completeMinimalLiveReviewerResult({
    receipts: receiptObservation.receipts,
    metadata,
    runtimeState: finalState,
    events: receiptObservation.newEvents,
  });

  reviewerReport.readiness_state = completion.readinessState;
  reviewerReport.doc_opened = true;
  reviewerReport.pane_ready = true;
  reviewerReport.bridge_session_id = runtime.bridgeSessionId ?? "unknown";
  reviewerReport.word_document_id = runtime.wordDocumentId ?? "unknown";
  reviewerReport.meaning_preserved = completion.verdict === "pass";
  reviewerReport.scope_preserved = completion.verdict === "pass";
  reviewerReport.word_native_integrity_preserved = completion.verdict === "pass";
  reviewerReport.execution_status = completion.executionStatus;
  reviewerReport.evidence_checked = completion.evidenceChecked;
  reviewerReport.failure_classification = completion.failureClassification;
  reviewerReport.verdict = completion.verdict;
  reviewerReport.score = completion.score;
  reviewerReport.confidence = completion.confidence;
  reviewerReport.freeform_observations = completion.freeformObservations;
  reviewerReport.duration_ms = Date.now() - Date.parse(reviewerReport.timestamp);
  timeline.execution_classification =
    receiptObservation.receipts.executionClassification;

  timeline.events.push(
    "session_ready",
    "reviewer_task_started",
    ...completion.timelineEvents,
  );
  if (submissionResult?.submitted || receiptObservation.receipts.promptSubmitted) {
    timeline.events.splice(2, 0, "prompt_submitted");
  }

  batchReport.diagnosis_summary = completion.diagnosisSummary;
  batchReport.next_action_queue =
    completion.verdict === "pass"
      ? ["compare_live_result_against_harness_artifacts"]
      : ["capture_first_in_pane_task_receipt"];

  const taskArtifactDir = findTaskArtifactDir(document, task.taskId);
  if (taskArtifactDir) {
    const mismatch = classifyHarnessVsLiveReviewMismatch({
      taskArtifactDir,
      reviewerReport: {
        verdict: reviewerReport.verdict,
        execution_status: reviewerReport.execution_status,
        failure_classification: reviewerReport.failure_classification,
      },
    });
    if (mismatch.mismatchClass !== "aligned") {
      batchReport.mismatch_map.push({
        task_id: task.taskId,
        mismatch_class: mismatch.mismatchClass,
        likely_failure_surface: mismatch.likelyFailureSurface,
        bounded_fix_allowed_in_v1: mismatch.boundedFixAllowedInV1,
      });
      appendActiveIssueEntry(__dirname, buildIssueEntry({
        batchId,
        document,
        task,
        completion,
        mismatch,
      }));
    }
  }

  writeJson(
    path.join(batchDir, `${task.taskId}-reviewer-report.json`),
    reviewerReport,
  );
  writeJson(
    path.join(batchDir, `${task.taskId}-execution-diagnostic.json`),
    buildExecutionDiagnosticReport({
      task,
      receiptObservation,
      finalState,
    }),
  );
  writeJson(path.join(batchDir, `${task.taskId}-task-clone.json`), {
    clone_id: clone.cloneId,
    clone_path: clone.clonePath,
    task_id: task.taskId,
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  initializeLiveReviewIssueArtifacts(__dirname);

  const plan = args.sourceDocument
    ? buildManualPlan({
        sourceDocument: args.sourceDocument,
        taskId: args.taskId,
      })
    : buildCapabilityLiveReviewPlan({
        suiteDir: __dirname,
        capabilityId: args.capability,
        artifactRiskByTaskId: loadArtifactRiskByTaskId(),
        maxDocs: Math.min(Math.max(args.maxDocs, 1), 3),
        maxTasksPerDocument: Math.min(Math.max(args.maxTasks, 1), 4),
      });

  const liveReviewRoot = path.join(__dirname, "artifacts", "live-review");
  ensureDir(liveReviewRoot);

  if (args.planOnly) {
    const planId = `plan-${args.capability ?? args.sourceDocument}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const planDir = path.join(liveReviewRoot, planId);
    ensureDir(planDir);
    writeJson(path.join(planDir, "plan.json"), plan);
    console.log(`Wrote live review plan to ${path.join(planDir, "plan.json")}`);
    return;
  }

  for (const document of plan.documents) {
    if (!document.tasks || document.tasks.length === 0) continue;
    const batchId = makeBatchId(plan.capabilityId, document.sourceDocument);
    const batchDir = path.join(liveReviewRoot, batchId);
    ensureDir(batchDir);

    const batchReport = createBatchReportSkeleton(plan, document, batchId);
    for (const task of document.tasks) {
      await runTask({
        bridgeUrl: args.bridgeUrl,
        batchId,
        batchDir,
        batchReport,
        document,
        capabilityId: plan.capabilityId,
        task,
        sessionSelector: args.sessionSelector,
      });
    }

    writeJson(path.join(batchDir, "batch-report.json"), batchReport);
    writeJson(path.join(batchDir, "plan.json"), plan);
    console.log(`Batch artifacts written to ${batchDir}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
