import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type WordBenchmarkArchetype =
  | "grant"
  | "legal"
  | "review_state"
  | "scientific_paper"
  | "technical_report"
  | "thesis";

export interface WordBenchmarkFixture {
  source_doc_id: string;
  display_name: string;
  file?: string;
  archetype: WordBenchmarkArchetype;
  tags?: string[];
  risk_profile?: string[];
  sha256?: string;
  difficulty_vector?: Record<string, number>;
  pending_fixture?: boolean;
  notes?: string;
  expected_session_fingerprint?: {
    pageCount: number;
    sectionCount: number;
    tableCount: number;
    changeTrackingMode: string;
    previewMarkers: string[];
  };
}

export interface WordBenchmarkTask {
  task_id: string;
  phase: number;
  archetype: WordBenchmarkArchetype;
  source_doc_id: string;
  prompt: string;
  allowed_regions: string[];
  forbidden_regions: string[];
  expected_invariants: string[];
  validator_bundle: string[];
  human_review_axes: string[];
  auto_fail_conditions: string[];
  mutation_ids?: string[];
}

export interface WordBenchmarkMultistepSession {
  session_id: string;
  phase: number;
  archetype: WordBenchmarkArchetype;
  source_doc_id: string;
  steps: string[];
  sticky_constraints: string[];
}

export interface BridgeSessionFingerprint {
  run_seq: number;
  sessionId: string;
  documentId: string;
  appName: string;
  title: string;
  pageCount: number;
  sectionCount: number;
  tableCount: number;
  changeTrackingMode: string;
  previewText: string;
  timestamp: string;
}

interface FixtureRegistryFile {
  version: number;
  local: WordBenchmarkFixture[];
  pending: WordBenchmarkFixture[];
}

interface TaskPackFile {
  version: number;
  pack_id: string;
  description: string;
  tasks: WordBenchmarkTask[];
}

interface MultistepPackFile {
  version: number;
  pack_id: string;
  description: string;
  sessions: WordBenchmarkMultistepSession[];
}

export interface TaskRunScoreInput {
  archetype: WordBenchmarkArchetype;
  dimensions: {
    semantic_correctness: number;
    scope_localization: number;
    word_native_integrity: number;
    formatting_layout_fidelity: number;
    completion_coverage: number;
    safety_ambiguity_handling: number;
  };
  triggeredAutoFail: boolean;
  repeatability: {
    repeatCount: number;
    recoveryCostTier: "RC0" | "RC1" | "RC2" | "RC3" | "RC4";
    scoreVariance: number;
  };
}

export interface TaskRunScoreOutput {
  overallScore: number;
  overallLabel: "fail" | "passable" | "strong" | "excellent";
  autoFailApplied: boolean;
  weightedDimensionScore: number;
  status: "scored";
  highRiskRecoveryCapApplied: boolean;
}

export interface WordBenchmarkSuite {
  baseDir: string;
  fixtures: {
    local: WordBenchmarkFixture[];
    pending: WordBenchmarkFixture[];
    all: WordBenchmarkFixture[];
  };
  scenarioPacks: {
    core: TaskPackFile;
    adversarial: TaskPackFile;
    multistep: MultistepPackFile;
  };
  matchFixturesToSessions: (
    sessions: BridgeSessionFingerprint[],
  ) => FixtureSessionMappingResult;
}

export interface FixtureSessionMapping {
  run_seq: number;
  sessionId: string;
  documentId: string;
  source_doc_id: string;
  fixtureFile: string;
  display_name: string;
  appName: string;
  title: string;
  pageCount: number;
  sectionCount: number;
  tableCount: number;
  changeTrackingMode: string;
  timestamp: string;
}

export interface FixtureSessionMappingResult {
  matches: FixtureSessionMapping[];
  unmatchedFixtures: WordBenchmarkFixture[];
  unmatchedSessions: BridgeSessionFingerprint[];
}

export interface WordBenchmarkRunSummary {
  runDir: string;
  fixtureCount: number;
  taskCount: number;
  pendingTasks: number;
  readyTasks: number;
  awaitingHumanReviewTasks: number;
  failedTasks: number;
  completedTasks: number;
  fixtureSummaries: Array<{
    fixtureName: string;
    hasBaselineSmoke: boolean;
    taskCount: number;
    pendingTasks: number;
    readyTasks: number;
    awaitingHumanReviewTasks: number;
    failedTasks: number;
    completedTasks: number;
  }>;
}

export interface WordBenchmarkValidatorDefinition {
  id: string;
  requiredArtifacts: string[];
}

export interface WordBenchmarkMutationDefinition {
  id: string;
  requiredArtifacts: string[];
}

export interface WordBenchmarkTaskExecutionPlan {
  validators: WordBenchmarkValidatorDefinition[];
  mutations: WordBenchmarkMutationDefinition[];
}

export interface WordBenchmarkRuntimePolicy {
  promptTimeoutMs: number;
  resetSessionBeforeTask: boolean;
}

export interface WordBenchmarkTaskArtifactStatus {
  status:
    | "pending"
    | "ready"
    | "awaiting_validation"
    | "awaiting_human_review"
    | "completed"
    | "failed";
  missingArtifacts: string[];
}

const DEFAULT_DIMENSION_WEIGHTS = {
  semantic_correctness: 0.25,
  scope_localization: 0.2,
  word_native_integrity: 0.2,
  formatting_layout_fidelity: 0.15,
  completion_coverage: 0.1,
  safety_ambiguity_handling: 0.1,
} as const;

const ARCHETYPE_WEIGHT_OVERRIDES: Partial<
  Record<WordBenchmarkArchetype, Partial<typeof DEFAULT_DIMENSION_WEIGHTS>>
> = {
  technical_report: {
    formatting_layout_fidelity: 0.2,
    word_native_integrity: 0.22,
    semantic_correctness: 0.2,
  },
  legal: {
    scope_localization: 0.25,
    semantic_correctness: 0.24,
    safety_ambiguity_handling: 0.14,
    formatting_layout_fidelity: 0.07,
  },
  grant: {
    scope_localization: 0.24,
    safety_ambiguity_handling: 0.14,
    formatting_layout_fidelity: 0.1,
    semantic_correctness: 0.22,
  },
};

const VALIDATOR_ARTIFACT_REQUIREMENTS: Record<string, string[]> = {
  heading_tree_check: ["inspectPath"],
  section_map_check: ["inspectPath"],
  semantic_fidelity_check: ["summaryPath"],
  style_inventory_check: ["metadataPath"],
  toc_field_check: ["summaryPath", "inspectPath"],
  visual_front_matter_check: ["screenshotPath"],
  header_footer_linkage_check: ["inspectPath"],
  numbering_tree_check: ["inspectPath"],
  defined_term_check: ["summaryPath"],
  scope_diff_check: ["diagPath"],
  page_number_scheme_check: ["metadataPath"],
  revision_inventory_check: ["eventsPath"],
  comment_inventory_check: ["eventsPath"],
  consistency_check: ["summaryPath"],
  page_count_check: ["metadataPath"],
  protection_integrity_check: ["diagPath"],
  field_inventory_check: ["inspectPath"],
};

const MUTATION_ARTIFACT_REQUIREMENTS: Record<string, string[]> = {
  M01: ["baselineReferencePath"],
  M02: ["baselineReferencePath"],
  M05: ["baselineReferencePath"],
  M07: ["baselineReferencePath"],
  M08: ["baselineReferencePath"],
  M11: ["baselineReferencePath"],
};

function normalizeWeights(archetype: WordBenchmarkArchetype) {
  const merged = {
    ...DEFAULT_DIMENSION_WEIGHTS,
    ...(ARCHETYPE_WEIGHT_OVERRIDES[archetype] ?? {}),
  };
  const total = Object.values(merged).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [key, value / total]),
  ) as typeof DEFAULT_DIMENSION_WEIGHTS;
}

function parseJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function normalizePreviewText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function fixtureMatchScore(
  fixture: WordBenchmarkFixture,
  session: BridgeSessionFingerprint,
): number {
  const expected = fixture.expected_session_fingerprint;
  if (!expected) return -Infinity;

  let score = 0;
  if (expected.pageCount === session.pageCount) score += 4;
  if (expected.sectionCount === session.sectionCount) score += 3;
  if (expected.tableCount === session.tableCount) score += 2;
  if (
    expected.changeTrackingMode.toLowerCase() ===
    session.changeTrackingMode.toLowerCase()
  )
    score += 2;

  const preview = normalizePreviewText(session.previewText);
  for (const marker of expected.previewMarkers) {
    if (preview.includes(marker.toLowerCase())) score += 5;
  }

  return score;
}

function labelForScore(overallScore: number): TaskRunScoreOutput["overallLabel"] {
  if (overallScore < 3) return "fail";
  if (overallScore <= 3.7) return "passable";
  if (overallScore <= 4.3) return "strong";
  return "excellent";
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadWordBenchmarkSuite(
  baseDir = __dirname,
): WordBenchmarkSuite {
  const fixtures = parseJsonFile<FixtureRegistryFile>(
    path.join(baseDir, "fixtures.registry.json"),
  );
  const core = parseJsonFile<TaskPackFile>(path.join(baseDir, "core-suite.json"));
  const adversarial = parseJsonFile<TaskPackFile>(
    path.join(baseDir, "adversarial-suite.json"),
  );
  const multistep = parseJsonFile<MultistepPackFile>(
    path.join(baseDir, "multistep-suite.json"),
  );

  return {
    baseDir,
    fixtures: {
      local: fixtures.local,
      pending: fixtures.pending,
      all: [...fixtures.local, ...fixtures.pending],
    },
    scenarioPacks: {
      core,
      adversarial,
      multistep,
    },
    matchFixturesToSessions(sessions) {
      const availableFixtures = new Map(
        fixtures.local.map((fixture) => [fixture.source_doc_id, fixture]),
      );
      const matches: FixtureSessionMapping[] = [];
      const unmatchedSessions: BridgeSessionFingerprint[] = [];

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
          run_seq: session.run_seq,
          sessionId: session.sessionId,
          documentId: session.documentId,
          source_doc_id: best.fixture.source_doc_id,
          fixtureFile: best.fixture.file,
          display_name: best.fixture.display_name,
          appName: session.appName,
          title: session.title,
          pageCount: session.pageCount,
          sectionCount: session.sectionCount,
          tableCount: session.tableCount,
          changeTrackingMode: session.changeTrackingMode,
          timestamp: session.timestamp,
        });
        availableFixtures.delete(best.fixture.source_doc_id);
      }

      matches.sort((left, right) => left.run_seq - right.run_seq);

      return {
        matches,
        unmatchedFixtures: [...availableFixtures.values()],
        unmatchedSessions,
      };
    },
  };
}

export function scoreBenchmarkTaskRun(
  input: TaskRunScoreInput,
): TaskRunScoreOutput {
  if (input.triggeredAutoFail) {
    return {
      overallScore: 1,
      overallLabel: "fail",
      autoFailApplied: true,
      weightedDimensionScore: 0,
      status: "scored",
      highRiskRecoveryCapApplied: false,
    };
  }

  const weights = normalizeWeights(input.archetype);
  const weightedDimensionScore =
    input.dimensions.semantic_correctness * weights.semantic_correctness +
    input.dimensions.scope_localization * weights.scope_localization +
    input.dimensions.word_native_integrity * weights.word_native_integrity +
    input.dimensions.formatting_layout_fidelity *
      weights.formatting_layout_fidelity +
    input.dimensions.completion_coverage * weights.completion_coverage +
    input.dimensions.safety_ambiguity_handling *
      weights.safety_ambiguity_handling;

  const variancePenalty = Math.min(input.repeatability.scoreVariance * 0.6, 0.35);
  const recoveryPenalty =
    {
      RC0: 0,
      RC1: 0.03,
      RC2: 0.08,
      RC3: 0.16,
      RC4: 0.3,
    }[input.repeatability.recoveryCostTier] ?? 0;

  const repeatBonus = input.repeatability.repeatCount >= 5 ? 0.03 : 0;
  const normalizedScore = Math.max(
    0,
    Math.min(1, weightedDimensionScore - variancePenalty - recoveryPenalty + repeatBonus),
  );
  const overallScore = Math.round((1 + normalizedScore * 4) * 100) / 100;
  const highRiskRecoveryCapApplied =
    input.repeatability.recoveryCostTier === "RC4" && overallScore > 3.7;
  const finalScore = highRiskRecoveryCapApplied ? 3.7 : overallScore;

  return {
    overallScore: finalScore,
    overallLabel: labelForScore(finalScore),
    autoFailApplied: false,
    weightedDimensionScore:
      Math.round(weightedDimensionScore * 1000) / 1000,
    status: "scored",
    highRiskRecoveryCapApplied,
  };
}

export function planArtifactPaths(input: {
  rootDir: string;
  runId: string;
  fixtureFile: string;
  taskId: string;
}) {
  const runDir = path.join(input.rootDir, "word-benchmark", input.runId);
  const taskDir = path.join(runDir, input.fixtureFile, input.taskId);
  return {
    runDir,
    taskDir,
    sessionMapPath: path.join(runDir, "session-map.json"),
    humanReviewPath: path.join(taskDir, "human-review.md"),
    runMetadataPath: path.join(taskDir, "run-metadata.json"),
    taskManifestPath: path.join(taskDir, "task-manifest.json"),
    scorePath: path.join(taskDir, "score.json"),
    summaryPath: path.join(taskDir, "summary.txt"),
    statePath: path.join(taskDir, "state.json"),
    metadataPath: path.join(taskDir, "metadata.json"),
    inspectPath: path.join(taskDir, "inspect.json"),
    diagPath: path.join(taskDir, "diag.json"),
    eventsPath: path.join(taskDir, "events.json"),
    actionLogPath: path.join(taskDir, "action-log.ndjson"),
    screenshotPath: path.join(taskDir, "before.png"),
    baselineReferencePath: path.join(taskDir, "baseline-reference.json"),
  };
}

export function buildHumanReviewStub(input: {
  fixture: WordBenchmarkFixture;
  task: WordBenchmarkTask;
  runId: string;
}) {
  return [
    "# Human Review Sheet",
    "",
    `- Run ID: ${input.runId}`,
    `- Source Doc ID: ${input.fixture.source_doc_id}`,
    `- Fixture: ${input.fixture.display_name}`,
    `- Task ID: ${input.task.task_id}`,
    `- Archetype: ${input.task.archetype}`,
    "",
    "## Review Axes",
    ...input.task.human_review_axes.map((axis) => `- ${axis}: [ ]`),
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

export function buildWordBenchmarkTaskExecutionPlan(
  task: WordBenchmarkTask,
): WordBenchmarkTaskExecutionPlan {
  return {
    validators: task.validator_bundle.map((id) => ({
      id,
      requiredArtifacts: VALIDATOR_ARTIFACT_REQUIREMENTS[id] ?? ["summaryPath"],
    })),
    mutations: (task.mutation_ids ?? []).map((id) => ({
      id,
      requiredArtifacts: MUTATION_ARTIFACT_REQUIREMENTS[id] ?? [
        "baselineReferencePath",
      ],
    })),
  };
}

export function deriveWordBenchmarkRuntimePolicy(
  task: WordBenchmarkTask,
): WordBenchmarkRuntimePolicy {
  const highRiskRecovery =
    (task.mutation_ids?.length ?? 0) > 0 || task.phase >= 8;
  return {
    promptTimeoutMs: highRiskRecovery ? 15 * 60_000 : 5 * 60_000,
    resetSessionBeforeTask: true,
  };
}

export function evaluateWordBenchmarkTaskArtifacts(
  taskDir: string,
): WordBenchmarkTaskArtifactStatus {
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

  const score = parseJsonFile<{
    status?: string;
    autoFailApplied?: boolean;
  }>(path.join(taskDir, "score.json"));
  const runMetadata = parseJsonFile<{ executionStatus?: string }>(
    path.join(taskDir, "run-metadata.json"),
  );
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
    [
      "agent_run_recorded",
      "prompt_finished",
      "validation_finished",
    ].includes(runMetadata.executionStatus ?? "") &&
    actionLog.length > 0
  ) {
    return { status: "awaiting_validation", missingArtifacts: [] };
  }
  if (runMetadata.executionStatus === "failed") {
    return { status: "failed", missingArtifacts: [] };
  }
  return { status: "ready", missingArtifacts: [] };
}

export function summarizeWordBenchmarkRun(
  runDir: string,
): WordBenchmarkRunSummary {
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
