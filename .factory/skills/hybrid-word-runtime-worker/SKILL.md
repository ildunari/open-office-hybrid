---
name: hybrid-word-runtime-worker
description: Implement Hybrid Word runtime, hook, verifier, bridge, and taskpane truthfulness fixes with test-first discipline.
---

# Hybrid Word Runtime Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the work procedure.

## When to Use This Skill

Use for features that change:
- `packages/sdk/src/runtime.ts`
- `packages/sdk/src/hooks/**`
- `packages/sdk/src/planning/**`
- `packages/word/src/lib/**`
- `packages/bridge/src/**` when the change is in service of runtime truthfulness
- `packages/core/src/chat/**` when the change is in service of blocked/resume/verification truth

Do not use for primarily live-review harness workflow/features; use `hybrid-live-review-worker` for those.

## Required Skills

- `Test-Driven Development` — invoke before code changes; add or update failing tests first.
- `Systematic Debugging` — invoke if current behavior or a failing test is not yet understood.
- `bridge-monitoring` — invoke only if a real Hybrid bridge session is available and live verification is feasible for this feature.

## Work Procedure

1. Read the feature, `mission.md`, mission `AGENTS.md`, and the relevant `.factory/library/*.md` files.
2. Confirm the touched contract in current code before changing it. Re-read the adjacent runtime/hook/verifier/UI code so the diff stays minimal and correct.
3. Write or update focused failing tests first. Prefer the narrowest suite that proves the contract gap.
4. Implement the smallest fix that makes the new tests pass.
5. Run focused validators for each touched package.
6. If the feature changes runtime truth, blocked/resume behavior, or verifier state, run the nearest cross-package tests too.
7. If a real Hybrid session is available, do a bridge-first manual verification using explicit Hybrid targeting. Never use the Dev add-in.
8. Before finishing, run:
   - relevant targeted Vitest suites
   - `pnpm typecheck`
   - any additional package-specific checks required by touched files
9. In the handoff, be explicit about:
   - what runtime contract changed
   - what tests were added or updated
   - whether live Hybrid verification was attempted or blocked

## Example Handoff

```json
{
  "salientSummary": "Hardened Word read-before-write scope handling and no-write-loop recovery truth, then updated runtime tests and hook-guard coverage. Targeted SDK/Word tests passed; live Hybrid verification was not possible because no bridge session was connected on 4018.",
  "whatWasImplemented": "Updated the Word execution contract so failed writes stay distinct from pure no-write loops, bounded steering surfaces before the next relevant tool call, and runtime progress/verification state reflects actual write+reread behavior. Added targeted tests in SDK runtime and hook guard suites to lock the behavior.",
  "whatWasLeftUndone": "Live bridge validation remains undone because the Hybrid pane was not connected, so the feature still needs end-of-mission live confirmation.",
  "verification": {
    "commandsRun": [
      {
        "command": "pnpm --filter @office-agents/sdk exec vitest run tests/hook-guards.test.ts",
        "exitCode": 0,
        "observation": "Guard coverage passed with new local/broad write cases."
      },
      {
        "command": "pnpm --filter @office-agents/sdk exec vitest run tests/runtime.test.ts --testNamePattern 'loop|write|resume|plan'",
        "exitCode": 0,
        "observation": "Runtime loop/progress truth tests passed."
      },
      {
        "command": "pnpm typecheck",
        "exitCode": 0,
        "observation": "Typecheck passed for touched packages."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Attempted Hybrid bridge verification via https://localhost:4018 with explicit session targeting",
        "observed": "No connected Hybrid session was available, so live verification could not run."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "packages/sdk/tests/runtime.test.ts",
        "cases": [
          {
            "name": "failed writes stay distinct from no-write loops",
            "verifies": "Runtime/live truth does not collapse failed write attempts into the no-write-loop branch."
          }
        ]
      }
    ]
  },
  "discoveredIssues": [
    {
      "severity": "medium",
      "description": "Live Hybrid session availability is still environmental, so end-to-end confirmation remains pending."
    }
  ]
}
```

## When to Return to Orchestrator

- The required change would force a broad redesign beyond Hybrid Word hardening.
- The feature depends on a live Hybrid session and none is available after a reasonable bridge-first attempt.
- The right fix is ambiguous between product/runtime behavior and harness/config noise.
- A shared runtime change would likely break unrelated Office hosts unless scope is renegotiated.
