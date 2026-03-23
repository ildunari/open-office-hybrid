# Hybrid Word Benchmark Regression Prompt

Use this prompt when you need to evaluate **Word-agent capability, regression safety, or fixture-level behavior** using the existing benchmark suite and its task contracts. This is the prompt for “did the agent preserve invariants?”, “did scope control regress?”, or “which benchmark tasks fail now?” questions.

## Context

- Repo root: `/Users/kosta/LocalDev/office-agents-hybrid`
- Primary target: **Hybrid Word first**
- If this prompt is being run **inside the side-panel LLM itself**, remember that host benchmark commands and host repo paths are operator-facing references, not commands you can execute from the in-pane `bash` tool unless the host has already supplied receipts.
- Benchmark sources:
  - `packages/sdk/tests/word-benchmark/core-suite.json`
  - `packages/sdk/tests/word-benchmark/adversarial-suite.json`
  - `packages/sdk/tests/word-benchmark/run-live-word-benchmark.mjs`
  - `packages/sdk/tests/word-benchmark/summarize-word-benchmark.mjs`
  - `packages/sdk/tests/word-benchmark/docs/word-agent-capability-benchmark-spec.md`
  - `packages/sdk/tests/word-benchmark/docs/word-agent-harness-validation-spec.md`

## Task

Run or analyze the **smallest benchmark slice that can answer the regression question**.

Use the benchmark suite’s native structure instead of inventing ad hoc QA:

- task prompt
- allowed regions
- forbidden regions
- expected invariants
- validator bundles
- human review axes
- auto-fail conditions

Prefer:

1. one task or one fixture family first
2. the `core` suite before broader expansion
3. smoke-mode or targeted benchmark runs before full-pack sweeps

## Constraints

- Treat benchmark tasks as **contracts**, not just prompt strings.
- Do not flatten the benchmark into generic “try a few prompts.”
- Do not use this prompt for ordinary bridge health checks.
- Do not claim regression status without naming the task IDs, invariants, and evidence.
- Do not assume the side-panel runtime can `cd` into the host repo or invoke host-side benchmark scripts directly from its in-pane `bash` tool.
- When running inside the side-panel LLM, recommend host benchmark commands or reason from supplied receipts instead of pretending the benchmark executed locally.
- Preserve read-only tasks exactly as read-only.
- If a task’s contract says the document must remain unchanged, any mutation is a failure.
- Keep the run narrow unless the request explicitly asks for a broader regression pass.
- Stop after producing enough task-level evidence to answer the question.

## Benchmark Discipline

For each task under review, capture:

- `task_id`
- source fixture / document
- natural-language prompt
- allowed regions
- forbidden regions
- expected invariants
- validator bundle
- human review axes
- auto-fail conditions

If the benchmark run is live, tie the result back to those fields. If the request is analytic only, review the task contract and explain what the task is designed to prove.

## Commands And Evidence Sources

Use the narrowest benchmark entry point that matches the request:

```bash
pnpm benchmark:word:smoke
pnpm benchmark:word:prepare
pnpm benchmark:word:report
```

Package-local equivalents:

```bash
pnpm --filter @office-agents/sdk benchmark:word:smoke
pnpm --filter @office-agents/sdk benchmark:word:prepare
pnpm --filter @office-agents/sdk benchmark:word:report
```

When needed, inspect the benchmark task contracts directly in:

- `core-suite.json`
- `adversarial-suite.json`

Prefer task-level artifact summaries over broad prose. If a human review axis is involved, state that clearly rather than pretending automation fully proved it.

## Auto-Fail Conditions

- Reporting a benchmark result without naming the task or invariant that passed/failed
- Treating a read-only task as editable
- Ignoring forbidden regions or auto-fail rules
- Using benchmark mode when the real question is only bridge/session health
- Running a large suite when a single task would answer the regression question

## Non-Goals

- Static test coverage review
- Generic bridge smoke verification
- Cross-app benchmark generalization
- Rewriting the benchmark suite or adding new tasks

## Output

Return:

1. **Benchmark slice chosen**: suite, task IDs, or fixture scope
2. **Why this slice fits the question**
3. **Contracts used**: invariants, forbidden scope, validators
4. **Commands run or task files reviewed**
5. **Result by task**
6. **Any human-review-only uncertainty**
7. **Regression verdict**
8. **Next smallest benchmark expansion** if more confidence is needed

Be explicit when the result is partial. “One smoke task passed” is not the same as “the full capability area is green.”

## Handoff

- If the issue is about bridge connectivity or taskpane runtime state, move to `docs/ai/hybrid-word-live-smoke-prompt.md`
- If the issue is about repository coverage, missing checks, or CI/test-path completeness, move to `docs/ai/hybrid-word-testing-review-prompt.md`
