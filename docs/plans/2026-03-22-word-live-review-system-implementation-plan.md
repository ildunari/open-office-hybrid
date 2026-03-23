# Word Live Review System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a small, usable v1 of the Hybrid Word live-review system that can plan capability-led batches, run one reviewer-subagent loop on fresh document clones, compare live-review results against benchmark artifacts, and record high-priority issues without rebuilding another sprawling test framework.

**Architecture:** Implement the planning/reporting backbone first, then wire one thin live execution loop on top of it. Reuse the newly normalized benchmark root at `packages/sdk/tests/word-benchmark`, keep deterministic benchmark artifacts separate from live-review artifacts, and constrain autonomous fixes to harness/scoring/bridge/tooling paths only.

**Tech Stack:** Node.js scripts, TypeScript test utilities, existing Word benchmark JSON/task manifests, Office bridge CLI, shell helpers under `scripts/bridge/`, markdown reports under `docs/plans` and repo-root testing artifacts.

---

## Assumptions Locked In

- Default entry mode is capability-led.
- One batch equals one source document.
- One task equals one fresh disposable clone.
- Up to 3 documents per capability-led run; default to 2 unless risk signals justify a third.
- Task ordering is risk-first.
- Per-document hard cap is 4 tasks.
- User opens the Hybrid pane once per document batch; the system only asks again if the session drops.
- Reviewer subagent runs the live task itself.
- The orchestrator diagnoses and compares live-review findings vs benchmark artifacts.
- Automatic fixes in v1 are limited to harness/scoring/bridge/tooling support, not broad product behavior.
- Live-review reports live under `packages/sdk/tests/word-benchmark/artifacts/live-review/`.
- High-priority issue tracking uses an active ledger plus a separate resolved archive from day one.

## Task 1: Define The Live Review File Layout And Schemas

**Files:**
- Create: `packages/sdk/tests/word-benchmark/live-review.schema.json`
- Create: `packages/sdk/tests/word-benchmark/live-review-batch.schema.json`
- Create: `packages/sdk/tests/word-benchmark/issue-ledger.schema.json`
- Create: `packages/sdk/tests/word-benchmark/resolved-issue.schema.json`
- Create: `packages/sdk/tests/word-benchmark/README.live-review.md`
- Test: `packages/sdk/tests/word-agent-benchmark-suite.test.ts`

**Step 1: Write the failing test**

Add tests that load the new schemas and validate:
- reviewer report required fields
- orchestrator batch report required fields
- active issue ledger required fields
- resolved issue archive entry required fields

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts -t "validates live review schemas"`

Expected: FAIL because the schema files do not exist yet.

**Step 3: Write minimal implementation**

Create the schema files with exact fields for:
- reviewer report
- batch report
- active issue entry
- resolved issue archive entry

Create `README.live-review.md` describing:
- artifact tree purpose
- separation from deterministic benchmark artifacts
- naming rules for batch ids, task ids, clone ids

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts -t "validates live review schemas"`

Expected: PASS

**Step 5: Run nearby suite**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts`

Expected: PASS

## Task 2: Add Capability-Led Batch Planning Inputs

**Files:**
- Create: `packages/sdk/tests/word-benchmark/live-review-capabilities.json`
- Create: `packages/sdk/tests/word-benchmark/live-review-planner.ts`
- Modify: `packages/sdk/tests/word-agent-benchmark-suite.test.ts`

**Step 1: Write the failing test**

Add tests that expect the planner to:
- map a capability like `nih_grants` to candidate source docs
- rank tasks by artifact risk and fixture metadata
- choose 1-3 docs with default 2
- cap tasks at 4 per document

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts -t "builds a capability-led live review plan"`

Expected: FAIL

**Step 3: Write minimal implementation**

Create:
- `live-review-capabilities.json` describing capability areas, fixture families, and seed mappings
- `live-review-planner.ts` that consumes:
  - benchmark task manifests
  - fixture registry
  - artifact risk signals

Implement only the planning path, not execution:
- weighted doc selection
- risk-first task ranking
- diagnosis-first batch shaping
- document/task caps

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts -t "builds a capability-led live review plan"`

Expected: PASS

**Step 5: Run nearby suite**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts`

Expected: PASS

## Task 3: Create The Active Issue Ledger And Resolved Archive

**Files:**
- Create: `packages/sdk/tests/word-benchmark/artifacts/live-review/README.md`
- Create: `packages/sdk/tests/word-benchmark/artifacts/live-review/issues/ACTIVE.md`
- Create: `packages/sdk/tests/word-benchmark/artifacts/live-review/issues/resolved/README.md`
- Create: `packages/sdk/tests/word-benchmark/artifacts/live-review/issues/resolved/index.md`
- Create: `packages/sdk/tests/word-benchmark/live-review-issues.ts`
- Modify: `packages/sdk/tests/word-agent-benchmark-suite.test.ts`

**Step 1: Write the failing test**

Add tests that expect:
- active issue entries to be appendable in a compact structured format
- resolved archive index entries to link to per-issue detailed reports
- no solution-hint field in the active ledger schema

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts -t "writes active and resolved live review issue records"`

Expected: FAIL

**Step 3: Write minimal implementation**

Create:
- active issue ledger markdown with clear section structure
- resolved archive index and per-issue detail conventions
- small helper module for formatting and appending entries

Keep active entries factual only:
- no implementation guidance
- no solution hints
- only likely solution surface

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts -t "writes active and resolved live review issue records"`

Expected: PASS

**Step 5: Run nearby suite**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts`

Expected: PASS

## Task 4: Build One Thin Reviewer-Subagent Execution Loop

**Files:**
- Create: `packages/sdk/tests/word-benchmark/run-live-review-batch.mjs`
- Create: `packages/sdk/tests/word-benchmark/live-review-runtime.ts`
- Modify: `packages/sdk/tests/word-agent-benchmark-suite.test.ts`
- Reference: `scripts/bridge/wait-and-check.sh`
- Reference: `scripts/bridge/focus-word-pane.sh`

**Step 1: Write the failing test**

Add tests that simulate a live-review batch state machine and expect:
- batch preflight state
- user pane-open pause state
- session-ready state
- reviewer task launch state
- quarantined-task state after failed rerun

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts -t "runs the live review batch state machine"`

Expected: FAIL

**Step 3: Write minimal implementation**

Implement only the smallest viable execution loop:
- open one fresh clone for one task
- emit a “please open the Hybrid pane” pause
- verify bridge session readiness tuple
- write batch/report skeleton files
- model one reviewer-subagent task launch
- support one diagnosis/fix/rerun loop state transition

Do not implement broad automatic fixing yet.
Do not implement multiple documents yet.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts -t "runs the live review batch state machine"`

Expected: PASS

**Step 5: Run nearby suite**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts`

Expected: PASS

## Task 5: Add Harness-Vs-Live Comparison And Diagnosis Output

**Files:**
- Create: `packages/sdk/tests/word-benchmark/live-review-compare.ts`
- Modify: `packages/sdk/tests/word-agent-benchmark-suite.test.ts`

**Step 1: Write the failing test**

Add tests that expect the comparison layer to:
- compare a reviewer verdict vs `score.json` / `inspect.json`
- detect mismatch classes such as:
  - validated-but-skipped-verification
  - validated-but-retryable-verification
  - harness pass vs live fail
  - harness fail vs live pass

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts -t "classifies harness versus live review mismatches"`

Expected: FAIL

**Step 3: Write minimal implementation**

Create a comparison helper that reads:
- task artifact files
- reviewer report
- batch state

Output:
- mismatch class
- likely failure surface
- whether a bounded fix attempt is allowed in v1

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts -t "classifies harness versus live review mismatches"`

Expected: PASS

**Step 5: Run nearby suite**

Run: `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts`

Expected: PASS

## Task 6: Document The User-Facing Entry Paths

**Files:**
- Create: `docs/testing/word/live-review-workflows.md`
- Modify: `docs/plans/2026-03-22-word-live-review-system-design.md`
- Reference: `docs/ai/hybrid-word-live-smoke-prompt.md`
- Reference: `docs/ai/hybrid-word-benchmark-regression-prompt.md`

**Step 1: Write the failing test**

No code test for this task. Instead define a documentation verification checklist:
- capability-led default is clearly explained
- slash-style command patterns are documented as prompt conventions
- natural-language fuzzy routing is documented
- operator responsibilities are explicit

**Step 2: Run verification to show the doc is missing**

Run: `test -f docs/testing/word/live-review-workflows.md && echo exists || echo missing`

Expected: `missing`

**Step 3: Write minimal implementation**

Create the workflow doc covering:
- natural-language default entry
- slash-style prompt conventions
- user handoff for pane-open
- one-document batch behavior
- self-healing loop boundaries

Update the design draft to mark these workflow decisions as finalized.

**Step 4: Run verification to show it exists**

Run: `test -f docs/testing/word/live-review-workflows.md && echo exists || echo missing`

Expected: `exists`

## Task 7: Run A Narrow End-To-End Dry Run

**Files:**
- No planned code changes
- Outputs under: `packages/sdk/tests/word-benchmark/artifacts/live-review/`

**Step 1: Preflight**

Run:

```bash
pnpm exec office-bridge --url https://localhost:4018 list
```

Expected:
- bridge reachable
- zero or more sessions listed

**Step 2: Run one planner-only dry run**

Run:

```bash
pnpm --filter @office-agents/sdk exec node tests/word-benchmark/run-live-review-batch.mjs --capability nih_grants --plan-only
```

Expected:
- planned documents and tasks written
- no live task execution yet

**Step 3: Run one minimal live batch on one task if environment is ready**

Run:

```bash
pnpm --filter @office-agents/sdk exec node tests/word-benchmark/run-live-review-batch.mjs --capability nih_grants --max-docs 1 --max-tasks 1
```

Expected:
- one batch folder created under `artifacts/live-review/`
- pane-open pause emitted
- reviewer report scaffold written

If the live environment is not ready, record the blocked preflight clearly instead of guessing.

## Task 8: Final Verification And Summary

**Files:**
- No additional code changes

**Step 1: Run the benchmark suite contract tests**

Run:

```bash
pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts
```

Expected: PASS

**Step 2: Run the SDK package tests**

Run:

```bash
pnpm --filter @office-agents/sdk test
```

Expected: PASS or a clearly documented pre-existing failure

**Step 3: Summarize**

Capture:
- files created/modified
- planner/reporting paths
- dry-run result
- any live-environment blockers

## Implementation Notes

- Keep the first live-review execution path intentionally thin.
- Prefer helper modules and schemas over large new frameworks.
- Do not rename benchmark artifact history in this plan.
- Do not mix the Hybrid live-review script cleanup into this implementation unless a direct dependency forces it.

## Recommended First Commit Boundaries

1. Schemas + README + tests
2. Capability planner + tests
3. Issue ledger/archive + tests
4. Thin execution loop + tests
5. Comparison/diagnosis layer + tests
6. Workflow docs

Plan complete and saved to `docs/plans/2026-03-22-word-live-review-system-implementation-plan.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration

2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
