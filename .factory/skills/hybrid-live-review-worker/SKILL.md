---
name: hybrid-live-review-worker
description: Implement Hybrid live-review runner, artifact, session-targeting, and mismatch-truth fixes with bridge-first validation discipline.
---

# Hybrid Live Review Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the work procedure.

## When to Use This Skill

Use for features that primarily change:
- `packages/sdk/tests/word-benchmark/**`
- live-review runner, reviewer, submission, mismatch, or issue-ledger code
- bridge/session-targeting code directly required by the live-review path
- supporting docs/artifact contracts only when required by the harness logic itself

Do not use for core runtime/hook/verifier execution-contract features unless they are strictly needed to keep live classifications truthful.

## Required Skills

- `Test-Driven Development` — invoke before code changes; add or update failing tests first.
- `Systematic Debugging` — invoke if runner behavior, receipt classification, or session routing is unclear.
- `bridge-monitoring` — invoke when a Hybrid session is available; use bridge-first checks and explicit session/document routing.

## Work Procedure

1. Read the feature, `mission.md`, mission `AGENTS.md`, and `.factory/library/user-testing.md` plus `.factory/library/live-review.md`.
2. Inspect the existing harness contract first:
   - runner behavior
   - submission/receipt logic
   - mismatch classification
   - artifact outputs
3. Add failing targeted tests first. Prefer `packages/sdk/tests/word-agent-benchmark-suite.test.ts` plus any directly relevant helper tests.
4. Implement only the smallest harness/session-targeting change needed.
5. Keep Hybrid-only targeting explicit. Never normalize the solution around the Dev add-in.
6. If a live Hybrid session is available, use bridge-first validation:
   - explicit session or document targeting
   - `state`, `events`, `metadata`, `summary`, and artifacts
7. If no Hybrid session is available, complete automated verification, record the blocker clearly, and leave live assertions for later validation.
8. Before finishing, run:
   - targeted live-review/benchmark tests
   - any touched bridge tests
   - `pnpm typecheck` if production code changed
9. In the handoff, clearly separate:
   - harness correctness fixes
   - product/runtime bugs discovered
   - environment blockers

## Example Handoff

```json
{
  "salientSummary": "Hardened Hybrid live-review session routing and reviewer-only classification so the runner fails closed on wrong targets and no longer treats reviewer passes as mutation success. Targeted benchmark and bridge tests passed; live verification was deferred because no Hybrid session was connected.",
  "whatWasImplemented": "Updated the live-review runner to keep metadata/state/events tied to the same resolved Hybrid session, tightened reviewer receipt classification, and corrected mismatch logic so reviewer-only success is treated as non-mutation evidence. Added focused tests around session selection, artifact expectations, and classification branches.",
  "whatWasLeftUndone": "A real Hybrid live run is still needed to confirm the runner behavior against an actual pane/session on 4018.",
  "verification": {
    "commandsRun": [
      {
        "command": "pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts",
        "exitCode": 0,
        "observation": "Live-review contract tests passed."
      },
      {
        "command": "pnpm --filter @office-agents/bridge exec vitest run tests/session-selection.test.ts tests/cli-commands.test.ts",
        "exitCode": 0,
        "observation": "Bridge selection and CLI tests passed."
      },
      {
        "command": "pnpm typecheck",
        "exitCode": 0,
        "observation": "Typecheck passed for the touched code."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Attempted bridge-first Hybrid validation on https://localhost:4018",
        "observed": "No connected Hybrid session was available, so live runner verification was deferred."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "packages/sdk/tests/word-agent-benchmark-suite.test.ts",
        "cases": [
          {
            "name": "reviewer-only success is non-mutation evidence",
            "verifies": "Mismatch and issue logic no longer treat reviewer-only pass as live mutation success."
          }
        ]
      }
    ]
  },
  "discoveredIssues": [
    {
      "severity": "medium",
      "description": "Hybrid session availability remains an external dependency for end-to-end live validation."
    }
  ]
}
```

## When to Return to Orchestrator

- The needed fix is actually a core runtime/product bug and not a harness issue.
- Session-targeting requirements conflict with current mission boundaries.
- Live verification depends on a Hybrid pane/session that is not available after a reasonable attempt.
- The requested harness change would add large speculative automation beyond what this mission needs.
