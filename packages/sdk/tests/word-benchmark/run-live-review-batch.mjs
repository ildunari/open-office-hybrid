#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildReviewerPrompt,
  buildTaskpanePromptSubmissionScript,
  classifyLiveExecutionReceipts,
  unwrapTaskpaneSubmissionResult,
} from "./live-review-submission.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..", "..", "..", "..");
const MAX_BUFFER = 20 * 1024 * 1024;
const RECEIPT_EVENT_LIMIT = "200";

function parseArgs(argv) {
  const args = {
    capability: null,
    bridgeUrl: "https://localhost:4018",
    maxDocs: 2,
    maxTasks: 4,
    planOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--capability") args.capability = argv[index + 1], index += 1;
    else if (value === "--bridge-url") args.bridgeUrl = argv[index + 1], index += 1;
    else if (value === "--max-docs") args.maxDocs = Number(argv[index + 1]), index += 1;
    else if (value === "--max-tasks") args.maxTasks = Number(argv[index + 1]), index += 1;
    else if (value === "--plan-only") args.planOnly = true;
  }

  if (!args.capability) {
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

function loadPlanInputs() {
  const capabilities = loadJson(path.join(__dirname, "live-review-capabilities.json"));
  const fixtures = loadJson(path.join(__dirname, "fixtures.registry.json"));
  const core = loadJson(path.join(__dirname, "core-suite.json"));
  const adversarial = loadJson(path.join(__dirname, "adversarial-suite.json"));
  const multistep = loadJson(path.join(__dirname, "multistep-suite.json"));
  return {
    capabilities,
    fixtures,
    tasks: [...core.tasks, ...adversarial.tasks],
    sessions: multistep.sessions,
  };
}

function normalizeDifficultyScore(fixture) {
  const values = Object.values(fixture.difficulty_vector ?? {});
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / (values.length * 5);
}

function loadArtifactRiskByTaskId() {
  return {};
}

function buildPlan({ capabilityId, maxDocs, maxTasks }) {
  const inputs = loadPlanInputs();
  const capability = inputs.capabilities.capabilities.find(
    (entry) => entry.capability_id === capabilityId,
  );
  if (!capability) {
    throw new Error(`Unknown capability: ${capabilityId}`);
  }

  const artifactRiskByTaskId = loadArtifactRiskByTaskId();
  const fixtures = inputs.fixtures.local.filter(
    (fixture) =>
      capability.source_doc_ids.includes(fixture.source_doc_id) ||
      capability.fixture_families.includes(fixture.archetype),
  );

  const documents = fixtures
    .map((fixture) => {
      const taskCandidates = [
        ...inputs.tasks
          .filter((task) => task.source_doc_id === fixture.source_doc_id)
          .map((task) => {
            const artifactRisk = artifactRiskByTaskId[task.task_id] ?? 0;
            return {
              taskId: task.task_id,
              phase: task.phase,
              kind: "task",
              riskScore: Number(
                (artifactRisk * 0.6 + (task.phase / 10) * 0.3 + (task.mutation_ids?.length ? 0.08 : 0)).toFixed(4),
              ),
            };
          }),
        ...inputs.sessions
          .filter((session) => session.source_doc_id === fixture.source_doc_id)
          .map((session) => {
            const artifactRisk = artifactRiskByTaskId[session.session_id] ?? 0;
            return {
              taskId: session.session_id,
              phase: session.phase,
              kind: "session",
              riskScore: Number(
                (artifactRisk * 0.6 + (session.phase / 10) * 0.3 + Math.min(session.steps.length / 10, 0.1)).toFixed(4),
              ),
            };
          }),
      ]
        .sort((left, right) => right.riskScore - left.riskScore)
        .slice(0, maxTasks);

      const topTaskRisk = taskCandidates[0]?.riskScore ?? 0;
      const difficultyScore = normalizeDifficultyScore(fixture);
      const diversityScore = Math.min((fixture.risk_profile?.length ?? 0) / 5, 1);
      return {
        sourceDocument: fixture.source_doc_id,
        displayName: fixture.display_name,
        fixtureFile: fixture.file,
        selectionScore: Number(
          (topTaskRisk * 0.6 + difficultyScore * 0.3 + diversityScore * 0.1).toFixed(4),
        ),
        tasks: taskCandidates,
      };
    })
    .sort((left, right) => right.selectionScore - left.selectionScore)
    .slice(0, maxDocs);

  return {
    capabilityId,
    entryMode: "capability_led",
    maxDocs,
    maxTasksPerDocument: maxTasks,
    documents,
  };
}

function makeBatchId(capabilityId, sourceDocument) {
  return `lrb-${capabilityId}-${sourceDocument}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

function createClone(batchId, document, taskId) {
  const cloneRoot = path.join(os.tmpdir(), "office-agents-live-review", batchId);
  ensureDir(cloneRoot);
  const cloneId = `clone-${taskId}-1`;
  const fixturePath = path.join(__dirname, document.fixtureFile);
  const clonePath = path.join(cloneRoot, `${cloneId}-${path.basename(document.fixtureFile)}`);
  if (existsSync(fixturePath)) {
    copyFileSync(fixturePath, clonePath);
  }
  return { cloneId, clonePath };
}

function getOfficeBridgeSessions(bridgeUrl) {
  try {
    return execBridgeJson(bridgeUrl, "list");
  } catch (error) {
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

function execBridgeTaskpaneJson(bridgeUrl, sessionId, code) {
  const output = execFileSync(
    "pnpm",
    ["exec", "office-bridge", "--url", bridgeUrl, "exec", sessionId, "--code", code],
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
  let lastState = null;

  while (Date.now() - startedAt < timeoutMs) {
    lastState = execBridgeJson(bridgeUrl, "state", sessionId);
    if (lastState?.isStreaming === false) {
      return lastState;
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
    const state = execBridgeJson(bridgeUrl, "state", sessionId);
    stateSnapshots.push(state);

    const events = execBridgeJson(
      bridgeUrl,
      "events",
      sessionId,
      "--limit",
      RECEIPT_EVENT_LIMIT,
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
    if (receipts.completionObserved || (receipts.promptSubmitted && receipts.executionObserved)) {
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

function completeMinimalLiveReviewerResult({ receipts, metadata, runtimeState, events }) {
  const sessionLooksHealthy =
    metadata?.ok === true &&
    metadata.metadata?.hasContent === true &&
    (metadata.metadata?.pageCount ?? 0) > 0 &&
    runtimeState?.error == null;

  if (
    sessionLooksHealthy &&
    receipts.promptSubmitted &&
    receipts.executionObserved &&
    receipts.completionObserved
  ) {
    return {
      readinessState: "completed",
      executionStatus: "completed",
      failureClassification: "reviewer_task_completed",
      verdict: "pass",
      score: 4,
      confidence: 0.91,
      evidenceChecked: [
        "bridge_session_tuple",
        "bridge_metadata",
        "runtime_state",
        "recent_events",
        "prompt_submission_receipt",
        "tool_execution_receipt",
        "completion_receipt",
      ],
      freeformObservations:
        "The reviewer prompt was submitted through the real taskpane UI, a Word tool execution was observed, and the assistant completed the response.",
      timelineEvents: [
        "prompt_submitted",
        "reviewer_evidence_captured",
        "reviewer_completed",
      ],
      diagnosisSummary:
        "The live reviewer loop observed prompt submission, real tool execution, and completion in the Hybrid pane.",
    };
  }

  if (sessionLooksHealthy) {
    return {
      readinessState: "completed",
      executionStatus: "completed",
      failureClassification: "reviewer_task_not_executed",
      verdict: "fail",
      score: 1.5,
      confidence: 0.86,
      evidenceChecked: [
        "bridge_session_tuple",
        "bridge_metadata",
        "runtime_state",
        "recent_events",
      ],
      freeformObservations:
        "Live Hybrid session was healthy, but no task execution receipt was observed for the selected reviewer task.",
      timelineEvents: ["reviewer_evidence_captured", "reviewer_completed"],
      diagnosisSummary:
        "Live session is healthy, but the reviewer loop did not yet observe an in-pane task execution receipt.",
    };
  }

  return {
    readinessState: "completed",
    executionStatus: "completed",
    failureClassification: "live_session_unhealthy",
    verdict: "fail",
    score: 0.5,
    confidence: 0.72,
    evidenceChecked: [
      "bridge_session_tuple",
      "bridge_metadata",
      "runtime_state",
      "recent_events",
    ],
    freeformObservations:
      "Reviewer completion ended with insufficient healthy-session evidence to treat the task as started.",
    timelineEvents: ["reviewer_evidence_captured", "reviewer_completed"],
    diagnosisSummary:
      "Reviewer completion ended before task execution because the live session evidence was not healthy enough.",
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
    freeform_observations: ""
  };
}

function createBatchReportSkeleton(plan, document, taskId, batchId) {
  return {
    batch_id: batchId,
    capability_area: plan.capabilityId,
    source_document: document.sourceDocument,
    selected_tasks: [taskId],
    batch_intent: "diagnosis_first_live_review",
    chosen_documents: [
      {
        source_document: document.sourceDocument,
        selection_reason: `selection-score=${document.selectionScore}`,
      },
    ],
    per_task_timeline: [
      {
        task_id: taskId,
        events: ["batch_preflight"],
      },
    ],
    diagnosis_summary: "pending",
    fix_attempted: false,
    rerun_improved: null,
    mismatch_map: [],
    stop_reasons: [],
    quarantined_tasks: [],
    next_action_queue: ["verify_pane_and_session"],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = buildPlan({
    capabilityId: args.capability,
    maxDocs: Math.min(Math.max(args.maxDocs, 1), 3),
    maxTasks: Math.min(Math.max(args.maxTasks, 1), 4),
  });

  const liveReviewRoot = path.join(__dirname, "artifacts", "live-review");
  ensureDir(liveReviewRoot);

  if (args.planOnly) {
    const planId = `plan-${args.capability}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const planDir = path.join(liveReviewRoot, planId);
    ensureDir(planDir);
    writeJson(path.join(planDir, "plan.json"), plan);
    console.log(`Wrote live review plan to ${path.join(planDir, "plan.json")}`);
    return;
  }

  const document = plan.documents[0];
  if (!document || document.tasks.length === 0) {
    throw new Error(`No live review document/task candidates found for ${args.capability}`);
  }

  const task = document.tasks[0];
  const batchId = makeBatchId(plan.capabilityId, document.sourceDocument);
  const batchDir = path.join(liveReviewRoot, batchId);
  ensureDir(batchDir);

  const clone = createClone(batchId, document, task.taskId);
  const reviewerReport = createReviewerReportSkeleton({
    capabilityId: plan.capabilityId,
    sourceDocument: document.sourceDocument,
    taskId: task.taskId,
    cloneId: clone.cloneId,
  });
  const batchReport = createBatchReportSkeleton(plan, document, task.taskId, batchId);

  const sessions = getOfficeBridgeSessions(args.bridgeUrl)
    .map((entry) => entry.snapshot)
    .filter((snapshot) => snapshot?.app === "word");

  if (sessions.length === 0) {
    console.log(`PAUSE: Please open the Hybrid pane for ${document.displayName}.`);
    reviewerReport.readiness_state = "pane_open_required";
    reviewerReport.execution_status = "paused_for_pane";
    batchReport.per_task_timeline[0].events.push("pane_open_required");
    batchReport.stop_reasons.push("awaiting_hybrid_pane");
  } else {
    const session = sessions[0];
    const baselineState = await waitForIdleSession({
      bridgeUrl: args.bridgeUrl,
      sessionId: session.sessionId,
    });
    const baselineEvents = execBridgeJson(
      args.bridgeUrl,
      "events",
      session.sessionId,
      "--limit",
      RECEIPT_EVENT_LIMIT,
    );
    const reviewerPrompt = buildReviewerPrompt({
      capabilityId: plan.capabilityId,
      taskId: task.taskId,
      sourceDocument: document.sourceDocument,
    });
    const submissionScript = buildTaskpanePromptSubmissionScript({
      prompt: reviewerPrompt,
    });
    const submissionEnvelope = execBridgeTaskpaneJson(
      args.bridgeUrl,
      session.sessionId,
      submissionScript,
    );
    const submissionResult = unwrapTaskpaneSubmissionResult(submissionEnvelope);
    const metadata = execBridgeJson(args.bridgeUrl, "metadata", "word");
    const receiptObservation = await observeLiveExecutionReceipts({
      bridgeUrl: args.bridgeUrl,
      sessionId: session.sessionId,
      baselineMessageCount: baselineState.sessionStats?.messageCount ?? 0,
      baselineEventIds: baselineEvents.map((event) => event.id),
    });
    const runtimeState =
      receiptObservation.stateSnapshots.at(-1) ??
      execBridgeJson(args.bridgeUrl, "state", session.sessionId);
    const events = receiptObservation.newEvents;
    const completion = completeMinimalLiveReviewerResult({
      receipts: receiptObservation.receipts,
      metadata,
      runtimeState,
      events,
    });

    console.log(`Session ready: ${session.sessionId} (${document.displayName})`);
    reviewerReport.readiness_state = "session_ready";
    reviewerReport.doc_opened = true;
    reviewerReport.pane_ready = true;
    reviewerReport.bridge_session_id = session.sessionId ?? "unknown";
    reviewerReport.word_document_id = session.documentId ?? "unknown";
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
    reviewerReport.readiness_state = completion.readinessState;
    reviewerReport.duration_ms = Date.now() - Date.parse(reviewerReport.timestamp);
    batchReport.per_task_timeline[0].events.push(
      "session_ready",
      "reviewer_task_started",
      ...completion.timelineEvents,
    );
    if (submissionResult?.submitted || receiptObservation.receipts.promptSubmitted) {
      batchReport.per_task_timeline[0].events.splice(2, 0, "prompt_submitted");
    }
    batchReport.diagnosis_summary = completion.diagnosisSummary;
    batchReport.next_action_queue =
      completion.verdict === "pass"
        ? ["compare_live_result_against_harness_artifacts"]
        : ["capture_first_in_pane_task_receipt"];
    batchReport.stop_reasons = [];
  }

  writeJson(path.join(batchDir, "batch-report.json"), batchReport);
  writeJson(path.join(batchDir, "reviewer-report.json"), reviewerReport);
  writeJson(path.join(batchDir, "plan.json"), plan);
  writeJson(path.join(batchDir, "task-clone.json"), {
    clone_id: clone.cloneId,
    clone_path: clone.clonePath,
    task_id: task.taskId,
  });

  console.log(`Batch artifacts written to ${batchDir}`);
}

await main();
