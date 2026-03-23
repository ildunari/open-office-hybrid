import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface ActiveIssueEntryInput {
  issueId: string;
  capabilityArea: string;
  sourceDocument: string;
  taskId: string;
  dateRunReference: string;
  observedBehavior: string;
  expectedBehavior: string;
  reproductionSummary: string;
  seenIn: "harness" | "live_review" | "both";
  likelyFailureClass: string;
  likelySolutionSurface: string;
  status: "open" | "triaged" | "blocked" | "resolved";
}

export interface ResolvedIssueEntryInput {
  issueId: string;
  resolvedAt: string;
  summary: string;
  resolutionKind:
    | "harness_fix"
    | "scoring_fix"
    | "bridge_fix"
    | "tooling_fix"
    | "operator_resolution";
  detailedReportBody: string;
}

export interface LiveReviewIssuePaths {
  liveReviewRoot: string;
  issuesRoot: string;
  resolvedRoot: string;
  activeLedgerPath: string;
  resolvedReadmePath: string;
  indexPath: string;
}

function ensureFile(filePath: string, contents: string) {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, contents);
  }
}

export function getLiveReviewIssuePaths(rootDir: string): LiveReviewIssuePaths {
  const liveReviewRoot = path.join(rootDir, "artifacts", "live-review");
  const issuesRoot = path.join(liveReviewRoot, "issues");
  const resolvedRoot = path.join(issuesRoot, "resolved");
  return {
    liveReviewRoot,
    issuesRoot,
    resolvedRoot,
    activeLedgerPath: path.join(issuesRoot, "ACTIVE.md"),
    resolvedReadmePath: path.join(resolvedRoot, "README.md"),
    indexPath: path.join(resolvedRoot, "index.md"),
  };
}

export function initializeLiveReviewIssueArtifacts(rootDir: string) {
  const paths = getLiveReviewIssuePaths(rootDir);

  mkdirSync(paths.resolvedRoot, { recursive: true });
  ensureFile(
    path.join(paths.liveReviewRoot, "README.md"),
    "# Live Review Artifact Tree\n\nSeparate live-review evidence from deterministic benchmark reruns.\n",
  );
  ensureFile(
    paths.activeLedgerPath,
    "# Active Live Review Issues\n\nKeep entries factual only.\n",
  );
  ensureFile(
    paths.resolvedReadmePath,
    "# Resolved Live Review Issues\n\nDetailed reports live beside the compact index.\n",
  );
  ensureFile(
    paths.indexPath,
    "# Resolved Live Review Issue Index\n\n",
  );

  return paths;
}

export function appendActiveIssueEntry(
  rootDir: string,
  entry: ActiveIssueEntryInput,
) {
  const paths = initializeLiveReviewIssueArtifacts(rootDir);
  const block = [
    `## ${entry.issueId}`,
    `- Capability area: ${entry.capabilityArea}`,
    `- Source document: ${entry.sourceDocument}`,
    `- Task id: ${entry.taskId}`,
    `- Date/run reference: ${entry.dateRunReference}`,
    `- Seen in: ${entry.seenIn}`,
    `- Likely failure class: ${entry.likelyFailureClass}`,
    `- Likely solution surface: ${entry.likelySolutionSurface}`,
    `- Status: ${entry.status}`,
    `- Observed behavior: ${entry.observedBehavior}`,
    `- Expected behavior: ${entry.expectedBehavior}`,
    `- Reproduction summary: ${entry.reproductionSummary}`,
    "",
  ].join("\n");

  appendFileSync(paths.activeLedgerPath, `\n${block}`);
  return paths;
}

export function appendResolvedIssueEntry(
  rootDir: string,
  entry: ResolvedIssueEntryInput,
) {
  const paths = initializeLiveReviewIssueArtifacts(rootDir);
  const fileName = `${entry.issueId}.md`;
  const detailedReportPath = path.join(paths.resolvedRoot, fileName);
  writeFileSync(detailedReportPath, entry.detailedReportBody);

  appendFileSync(
    paths.indexPath,
    `- ${entry.issueId} | ${entry.resolvedAt} | ${entry.resolutionKind} | [${fileName}](./${fileName})\n`,
  );

  return {
    ...paths,
    detailedReportPath,
  };
}
