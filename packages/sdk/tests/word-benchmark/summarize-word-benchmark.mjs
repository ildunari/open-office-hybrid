#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import path from "node:path";
import { summarizeWordBenchmarkRun } from "./benchmark-suite-runtime.mjs";

function parseArgs(argv) {
  const args = {
    runDir: "",
  };

  for (let i = 0; i < argv.length; i++) {
    const value = argv[i];
    if (value === "--run-dir") args.runDir = argv[++i];
  }

  if (!args.runDir) {
    throw new Error("Usage: summarize-word-benchmark.mjs --run-dir <path>");
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));
const summary = summarizeWordBenchmarkRun(args.runDir);

writeFileSync(
  path.join(args.runDir, "run-summary.json"),
  JSON.stringify(summary, null, 2),
);
writeFileSync(
  path.join(args.runDir, "run-summary.md"),
  [
    "# Word Benchmark Run Summary",
    "",
    `- Run Dir: ${args.runDir}`,
    `- Fixtures: ${summary.fixtureCount}`,
    `- Tasks: ${summary.taskCount}`,
    `- Pending tasks: ${summary.pendingTasks}`,
    `- Completed tasks: ${summary.completedTasks}`,
    "",
    "## Fixtures",
    ...summary.fixtureSummaries.map(
      (fixture) =>
        `- ${fixture.fixtureName}: baseline=${fixture.hasBaselineSmoke ? "yes" : "no"}, tasks=${fixture.taskCount}, pending=${fixture.pendingTasks}, completed=${fixture.completedTasks}`,
    ),
    "",
  ].join("\n"),
);

console.log(JSON.stringify(summary, null, 2));
