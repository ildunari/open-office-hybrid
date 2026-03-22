# Hybrid Word Testing Review Prompt

Use this prompt when you need a **read-only audit** of Hybrid Word testing coverage, bridge instrumentation, verification contracts, or prompt/test completeness. This is the narrow prompt for reviewing whether the testing system is wired correctly, not for driving a live taskpane session and not for running the Word benchmark harness.

## Context

- Repo root: `/Users/kosta/LocalDev/office-agents-hybrid`
- Primary target: **OpenWord Hybrid** development flow
- If this prompt is being run **inside the side-panel LLM itself**, remember that host bridge commands and host repo checks are operator-facing references, not commands you can execute from the in-pane `bash` tool unless the host has already supplied receipts.
- Closest related docs and evidence sources:
  - `docs/ai/bridge-review-prompt.md`
  - `packages/bridge/README.md`
  - `package.json`
  - `.github/workflows/ci.yml`
  - `packages/bridge/tests/**/*.test.ts`
  - `packages/core/tests/**/*.test.ts`
  - `packages/sdk/tests/**/*.test.ts`
- Static verification layers available in this repo:
  - package-local `vitest`
  - root `pnpm test`
  - root `pnpm typecheck`
  - root `pnpm lint`
  - root `pnpm validate`

## Task

Perform a **repository-aware, read-only review** of the Hybrid Word testing surface that matches the request at hand.

Choose the narrowest valid review path:

1. If the change is local to one package or one helper, review the relevant package tests and commands first.
2. If the change spans bridge, SDK, and UI wiring, review cross-package contracts and the root CI checks.
3. If the request is about live taskpane behavior or fixture quality, stop and recommend the live smoke prompt or benchmark prompt instead of improvising those checks here.

Your goal is to answer:

- What is covered already?
- What is missing or risky?
- Which existing repo checks prove the behavior?
- What should be run next for stronger evidence?

## Constraints

- Stay **read-only**.
- Do not act like a live operator prompt.
- Do not run benchmark workflows unless the request is explicitly benchmark-focused.
- Do not review unrelated packages, files, or architecture once the relevant testing surface is clear.
- Do not assume the side-panel runtime can `cd` into the host repo or invoke host-side `pnpm` or `office-bridge` commands directly from its in-pane `bash` tool.
- When running inside the side-panel LLM, recommend host checks or reason from receipts already provided instead of pretending they executed locally.
- Do not suggest generic “run everything” verification unless the change genuinely crosses package boundaries.
- Prefer the repo’s actual contracts and commands over abstract QA advice.
- Stop after delivering findings, evidence, and next checks. Do not drift into implementation planning unless asked.

## Review Checklist

- Identify the requested testing surface:
  - static contract review
  - test-suite coverage review
  - CI/verification-path review
- Name the exact files and commands that matter.
- Verify whether the current repo already has proof for the behavior:
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm validate`
  - package-local `vitest run`
- Call out any live-only claims that static review cannot prove.
- Separate:
  - proven by current tests
  - partially covered
  - not covered / requires live smoke
  - not covered / requires benchmark regression

## Evidence Receipts

Prefer receipts like these:

- exact test files
- exact verification commands
- exact workflow steps in `.github/workflows/ci.yml`
- exact docs or scripts already present in the repo
- shortest failing or missing contract summary

Avoid vague statements like “there seems to be good coverage” without naming the proving artifacts.

## Non-Goals

- Running Hybrid Word interactively
- Focusing the Word pane
- Submitting prompts to a live taskpane
- Collecting screenshots from Word
- Running fixture-based capability evaluations

If the task requires any of those, hand off to the correct prompt:

- `docs/ai/hybrid-word-live-smoke-prompt.md`
- `docs/ai/hybrid-word-benchmark-regression-prompt.md`

## Output

Return:

1. **Mode chosen**: why this was a review task rather than live smoke or benchmark work
2. **Files reviewed**
3. **Checks that already exist**
4. **Findings by severity**
5. **Evidence**: commands, files, or workflow steps that support each finding
6. **Gaps that static review cannot prove**
7. **Recommended next check**: the smallest higher-confidence follow-up

Keep the answer concrete and evidence-led. If there are no findings, say so explicitly and list any residual blind spots.

## Handoff

- If the issue is about runtime/session behavior, move to `docs/ai/hybrid-word-live-smoke-prompt.md`
- If the issue is about capability quality, scope control, or fixture regressions, move to `docs/ai/hybrid-word-benchmark-regression-prompt.md`
