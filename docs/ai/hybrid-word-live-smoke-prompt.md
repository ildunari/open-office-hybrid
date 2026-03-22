# Hybrid Word Live Smoke Prompt

Use this prompt when you need to verify **live Hybrid Word behavior** through the bridge against a running taskpane session. This is the prompt for runtime bugs, bridge/session state issues, screenshots, event flow, or “does the live add-in actually do this?” checks.

## Context

- Repo root: `/Users/kosta/LocalDev/office-agents-hybrid`
- Primary target: **OpenWord Hybrid**
- If this prompt is being run **inside the side-panel LLM itself**, remember that host bridge commands are operator-facing references, not commands you can execute from the in-pane `bash` tool.
- Prefer the Hybrid bridge flow where applicable:
  - standard bridge default: `https://localhost:4017`
  - Hybrid Word alternate bridge: `https://localhost:4018`
- Key live-testing references:
  - `packages/bridge/README.md`
  - `scripts/bridge/wait-and-check.sh`
  - `scripts/bridge/smoke-test.sh`
  - `scripts/bridge/event-monitor.sh`
  - `scripts/word-hybrid-review.sh`

## Task

Run the **smallest live check that can prove or disprove the reported Hybrid Word behavior**.

Choose the narrowest valid path:

1. **Session discovery / health**: confirm the right bridge and session first.
2. **State proof**: use `summary`, `state`, `diag`, or `assert` for mode/phase/streaming questions.
3. **Runtime observation**: use `events`, `poll`, or screenshots when the issue is visual or lifecycle-sensitive.
4. **Tool behavior**: run a targeted bridge tool or `exec` check only when state inspection is not enough.
5. **Smoke script**: use repo scripts only when the issue genuinely needs a broader live pass.

## Constraints

- Treat **Hybrid Word** as the default live target unless the request explicitly says otherwise.
- Inspect current state before running assertions or screenshots.
- Do not use a bare `word` selector when multiple Word windows may be open unless the task is specifically about ambiguity.
- Prefer a specific selector or document-targeted flow when available.
- Do not assume the side-panel runtime can `cd` into the host repo or invoke `office-bridge` directly from its in-pane `bash` tool.
- When running inside the side-panel LLM, treat host bridge commands as **recommended operator commands** unless the host has already supplied the resulting receipts.
- Do not default to `pnpm test` for a runtime/session problem.
- Do not run the full benchmark harness from this prompt.
- Do not mutate the document unless the request requires it.
- If the task is read-only, preserve that and treat document mutation as a failure.
- Stop once you have enough live evidence to answer the question.

## Live Verification Flow

1. Confirm which bridge URL is in play.
2. Verify the session exists and is healthy.
3. Capture one current-state receipt before any deeper action.
4. Run the minimum targeted command set needed to test the claim.
5. Save or report artifacts that prove the result.

## Commands And Evidence Sources

These host-side commands are the canonical operator receipts. If you are the side-panel LLM, recommend them or reason from receipts already provided to you; do not pretend they executed inside the in-pane shell.

Start with the smallest relevant command:

```bash
pnpm exec office-bridge --url https://localhost:4018 list
pnpm exec office-bridge --url https://localhost:4018 summary word
pnpm exec office-bridge --url https://localhost:4018 state word --compact
pnpm exec office-bridge --url https://localhost:4018 diag word
pnpm exec office-bridge --url https://localhost:4018 assert word --mode discuss
pnpm exec office-bridge --url https://localhost:4018 screenshot word --pages 1 --out tmp/hybrid-word-page1.png
```

Escalate only if needed:

```bash
BRIDGE_URL=https://localhost:4018 scripts/bridge/wait-and-check.sh --hybrid-word --document <document-id>
scripts/bridge/smoke-test.sh --hybrid-word --document <document-id> --scenario review-heavy --fixture comments.docx
scripts/word-hybrid-review.sh
```

Use `poll` / `events` only when event flow matters. Use `exec` only when state/tool receipts are insufficient.

## Auto-Fail Conditions

- You skip session/bridge discovery and assert against an ambiguous target.
- You claim runtime behavior from static tests alone.
- You run the full smoke flow when a one-command proof would have answered the question.
- You mutate the document during a read-only check.
- You report success without a bridge-native receipt.

## Non-Goals

- Broad code review of testing completeness
- Full benchmark or fixture scoring
- Cross-app generalization to Excel or PowerPoint
- Repo-wide static verification unless the live issue clearly crossed into code changes

## Output

Return:

1. **Bridge target used**: `4017` or `4018`, and why
2. **Session selector used**
3. **Commands run**
4. **Artifacts captured**
5. **Observed state / result**
6. **Pass/fail decision**
7. **Open risks or ambiguity**
8. **Next smallest check** if more confidence is needed

Use the shortest receipts that prove the claim: one-line summaries, assertion output, screenshot path, or a concise event/state excerpt.

## Handoff

- If the question becomes “is the testing system complete?” move to `docs/ai/hybrid-word-testing-review-prompt.md`
- If the question becomes “did the Word agent preserve scope/invariants across fixtures?” move to `docs/ai/hybrid-word-benchmark-regression-prompt.md`
