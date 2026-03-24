# Live Word Testing Observational Report

Date: 2026-03-24
Repo: `/Users/Kosta/LocalDev/office-agents-hybrid`
Host under test: Mac Studio Hybrid Word setup

## Purpose

This report records what was run, what completed successfully, and what did not complete successfully during the live Word testing session. It is intentionally observational and does not diagnose causes of failures.

## Environment Snapshot

- Hybrid Word dev server active at `https://localhost:3003`
- Hybrid bridge active at `https://localhost:4018`
- Hybrid pane connected in Word
- Side-panel provider config active and verified in the live pane
- Wrapper-backed model path in use: `https://localhost:3003/llm-proxy/v1`

## Documents Used

- Report template:
  - `/Users/Kosta/LocalDev/office-agents-hybrid/packages/sdk/tests/word-benchmark/fixtures/Generic-report-template.docx`
- NIH grant copy:
  - `/Users/Kosta/LocalDev/office-agents-hybrid/packages/sdk/tests/word-benchmark/fixtures/NIH Biocoating V30 km edits copy.docx`

## Code Verification Runs

### Passed

- `pnpm --filter @office-agents/word exec vitest run tests/tool-helpers.test.ts tests/verifiers.test.ts`
- `pnpm --filter @office-agents/bridge exec vitest run tests/server.test.ts tests/client.test.ts`
- `pnpm --filter @office-agents/sdk exec vitest run tests/word-agent-benchmark-suite.test.ts tests/hook-guards.test.ts tests/runtime.test.ts`
- `pnpm --filter @office-agents/bridge build`
- `pnpm typecheck`
- `pnpm --filter @office-agents/sdk exec node tests/word-benchmark/run-live-review-batch.mjs --capability nih_grants --plan-only`

## Live Framework Validation Runs

### Passed

1. Report template live reviewer run

- Command path:
  - `run-live-review-batch.mjs`
- Source document:
  - `report_tti_generic_v1`
- Task:
  - `T21-report-core`
- Result:
  - batch completed
  - reviewer report status: `pass`
  - execution status: `completed`
- Artifact folder:
  - `/Users/Kosta/LocalDev/office-agents-hybrid/packages/sdk/tests/word-benchmark/artifacts/live-review/lrb-manual_orchestrator_led-report_tti_generic_v1-2026-03-24T00-07-55-744Z`

2. Report template adversarial reviewer run

- Command path:
  - `run-live-review-batch.mjs`
- Source document:
  - `report_tti_generic_v1`
- Task:
  - `M02-report-stale-field-recovery`
- Result:
  - batch completed
  - reviewer report status: `pass`
  - execution status: `completed`
- Artifact folder:
  - `/Users/Kosta/LocalDev/office-agents-hybrid/packages/sdk/tests/word-benchmark/artifacts/live-review/lrb-manual_orchestrator_led-report_tti_generic_v1-2026-03-24T00-08-36-647Z`

## Live NIH Grant Capability Test

### Baseline Checks Completed

- Live session detected and healthy for the NIH grant document
- Metadata captured successfully
- `get_document_text` baseline read for the opening paragraphs completed successfully
- Visual baseline screenshot created successfully:
  - `/tmp/nih-grant-before.png`

### Live Complex Prompt Submission Completed

- A bundled natural-language cleanup prompt was submitted to the live side panel through the controller automation hook
- The live session entered active planning/execution mode
- The event stream showed live agent reasoning and tool usage activity

### Did Not Complete Successfully

1. NIH bundled cleanup task

- Document under test:
  - `/Users/Kosta/LocalDev/office-agents-hybrid/packages/sdk/tests/word-benchmark/fixtures/NIH Biocoating V30 km edits copy.docx`
- Prompt type:
  - bundled multi-fix natural-language edit request
- Observed final status:
  - run was interrupted before a successful completion message was captured
- Document state after interruption:
  - opening paragraphs reread successfully
  - no visible changes observed in the checked opening paragraph range

### Post-Run Visual Comparison

- Before screenshot:
  - `/tmp/nih-grant-before.png`
- After screenshot:
  - `/tmp/nih-grant-after.png`
- Screenshot diff result:
  - similarity: `1`
  - diffPixels: `0`
  - passed: `true`

## Document Readback Observations

### Report Template

- Live reviewer output was captured through the pane
- The completed reviewer text described:
  - `226 paragraphs`
  - `9 sections`
  - `5 tables`
  - document judged ready for a targeted read-only review

### NIH Grant

- Baseline and post-run reads of the opening paragraph range completed successfully
- The checked opening range still contained the same visible issue markers after the interrupted run, including:
  - `Bio-coating` in the title
  - empty heading block before `PROJECT SUMMARY`
  - `hyphothesis`
  - `APROACH`
  - `No Spacing` style on the Innovation body paragraphs in the inspected range

## Artifacts Produced

- Live-review artifact folders under:
  - `/Users/Kosta/LocalDev/office-agents-hybrid/packages/sdk/tests/word-benchmark/artifacts/live-review/`
- Baseline screenshot:
  - `/tmp/nih-grant-before.png`
- Post-run screenshot:
  - `/tmp/nih-grant-after.png`

## Summary Table

| Area | Item | Outcome |
|---|---|---|
| Automated verification | Word focused tests | Passed |
| Automated verification | Bridge focused tests | Passed |
| Automated verification | SDK focused tests | Passed |
| Automated verification | Bridge build | Passed |
| Automated verification | Typecheck | Passed |
| Live framework validation | Report reviewer task `T21-report-core` | Passed |
| Live framework validation | Report reviewer task `M02-report-stale-field-recovery` | Passed |
| Live capability test | NIH bundled cleanup prompt | Did not complete successfully |
| Visual regression check | NIH grant page 1 before/after diff | No visible change |

