import { readFileSync } from "node:fs";
import path from "node:path";
import {
  loadWordBenchmarkSuite,
  type WordBenchmarkFixture,
  type WordBenchmarkMultistepSession,
  type WordBenchmarkTask,
} from "./benchmark-suite.ts";

interface LiveReviewCapabilityDefinition {
  capability_id: string;
  display_name: string;
  fixture_families: string[];
  source_doc_ids: string[];
  seed_task_ids: string[];
}

interface LiveReviewCapabilitiesFile {
  version: number;
  capabilities: LiveReviewCapabilityDefinition[];
}

type CandidateTask = {
  taskId: string;
  sourceDocument: string;
  phase: number;
  kind: "task" | "session";
  artifactRisk: number;
  riskScore: number;
};

export interface PlannedLiveReviewTask extends CandidateTask {}

export interface PlannedLiveReviewDocument {
  sourceDocument: string;
  displayName: string;
  fixtureFile?: string;
  selectionScore: number;
  selectionReason: string;
  tasks: PlannedLiveReviewTask[];
}

export interface CapabilityLiveReviewPlan {
  capabilityId: string;
  entryMode: "capability_led";
  maxDocs: number;
  maxTasksPerDocument: number;
  documents: PlannedLiveReviewDocument[];
}

export interface BuildCapabilityLiveReviewPlanOptions {
  suiteDir: string;
  capabilityId: string;
  artifactRiskByTaskId?: Record<string, number>;
  maxDocs?: number;
  maxTasksPerDocument?: number;
}

function loadCapabilities(suiteDir: string) {
  const filePath = path.join(suiteDir, "live-review-capabilities.json");
  return JSON.parse(readFileSync(filePath, "utf8")) as LiveReviewCapabilitiesFile;
}

function normalizeDifficultyScore(fixture: WordBenchmarkFixture) {
  const values = Object.values(fixture.difficulty_vector ?? {});
  if (values.length === 0) {
    return 0;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / (values.length * 5);
}

function buildCandidateTasks(
  fixture: WordBenchmarkFixture,
  tasks: WordBenchmarkTask[],
  sessions: WordBenchmarkMultistepSession[],
  artifactRiskByTaskId: Record<string, number>,
) {
  const candidateTasks: CandidateTask[] = [
    ...tasks
      .filter((task) => task.source_doc_id === fixture.source_doc_id)
      .map((task) => {
        const artifactRisk = artifactRiskByTaskId[task.task_id] ?? 0;
        const phaseRisk = task.phase / 10;
        const mutationRisk = task.mutation_ids?.length ? 0.08 : 0;
        return {
          taskId: task.task_id,
          sourceDocument: task.source_doc_id,
          phase: task.phase,
          kind: "task" as const,
          artifactRisk,
          riskScore: Number((artifactRisk * 0.6 + phaseRisk * 0.3 + mutationRisk).toFixed(4)),
        };
      }),
    ...sessions
      .filter((session) => session.source_doc_id === fixture.source_doc_id)
      .map((session) => {
        const artifactRisk = artifactRiskByTaskId[session.session_id] ?? 0;
        const phaseRisk = session.phase / 10;
        const multistepRisk = Math.min(session.steps.length / 10, 0.1);
        return {
          taskId: session.session_id,
          sourceDocument: session.source_doc_id,
          phase: session.phase,
          kind: "session" as const,
          artifactRisk,
          riskScore: Number((artifactRisk * 0.6 + phaseRisk * 0.3 + multistepRisk).toFixed(4)),
        };
      }),
  ];

  return candidateTasks.sort((left, right) => right.riskScore - left.riskScore);
}

export function buildCapabilityLiveReviewPlan(
  options: BuildCapabilityLiveReviewPlanOptions,
): CapabilityLiveReviewPlan {
  const maxDocs = Math.min(Math.max(options.maxDocs ?? 2, 1), 3);
  const maxTasksPerDocument = Math.min(
    Math.max(options.maxTasksPerDocument ?? 4, 1),
    4,
  );
  const artifactRiskByTaskId = options.artifactRiskByTaskId ?? {};
  const suite = loadWordBenchmarkSuite(options.suiteDir);
  const capabilities = loadCapabilities(options.suiteDir);
  const capability = capabilities.capabilities.find(
    (entry) => entry.capability_id === options.capabilityId,
  );

  if (!capability) {
    throw new Error(`Unknown live review capability: ${options.capabilityId}`);
  }

  const candidateFixtures = suite.fixtures.local.filter(
    (fixture) =>
      capability.source_doc_ids.includes(fixture.source_doc_id) ||
      capability.fixture_families.includes(fixture.archetype),
  );

  const scoredDocuments = candidateFixtures
    .map((fixture) => {
      const tasks = buildCandidateTasks(
        fixture,
        suite.scenarioPacks.core.tasks.concat(suite.scenarioPacks.adversarial.tasks),
        suite.scenarioPacks.multistep.sessions,
        artifactRiskByTaskId,
      ).slice(0, maxTasksPerDocument);
      const topTaskRisk = tasks[0]?.riskScore ?? 0;
      const difficultyScore = normalizeDifficultyScore(fixture);
      const diversityScore = Math.min((fixture.risk_profile?.length ?? 0) / 5, 1);
      const selectionScore = Number(
        (topTaskRisk * 0.6 + difficultyScore * 0.3 + diversityScore * 0.1).toFixed(4),
      );

      return {
        sourceDocument: fixture.source_doc_id,
        displayName: fixture.display_name,
        fixtureFile: fixture.file,
        selectionScore,
        selectionReason: `artifact-risk=${topTaskRisk.toFixed(2)} difficulty=${difficultyScore.toFixed(2)} diversity=${diversityScore.toFixed(2)}`,
        tasks,
      };
    })
    .sort((left, right) => right.selectionScore - left.selectionScore)
    .slice(0, maxDocs);

  return {
    capabilityId: capability.capability_id,
    entryMode: "capability_led",
    maxDocs,
    maxTasksPerDocument,
    documents: scoredDocuments,
  };
}
