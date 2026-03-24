# Live Word Hardening Diagnostic Handoff

Date: 2026-03-23
Repo: `/Users/Kosta/LocalDev/office-agents-hybrid`
Scope: runtime/control-loop hardening for live Word mutation tasks

## Why this exists

This document is intentionally diagnostic, unlike the observational report. It records the likely breakpoint surfaces behind the NIH live-task stall and the hardening changes added in this session.

## Distinct failure surfaces

### Prompt design issues

- The Word prompt and reasoning patterns were heavily weighted toward safe inspection.
- They already emphasized read-before-write, formatting preservation, revision safety, and long-document caution.
- They did not give the model a bounded “first write slice” rule for messy multi-fix edit requests.

### Runtime / control-loop issues

- The generic runtime created an execution plan but did not enforce progress from inspection into writing.
- Mutation-capable Word tasks could keep collecting reads and prompt notes without tripping a runtime guard.
- The bridge-visible task summary was not being refreshed on every tool event, which made live diagnosis less precise.

### Verification issues

- Existing Word verifiers mainly checked discipline after a write.
- They did not explicitly fail the “no successful write ever happened” case.
- They also did not treat “write happened but no reread followed” as a dedicated progress failure surface.

### Harness issues

- The live-review helper could tell that execution happened, but it did not classify whether execution stayed read-only, attempted and failed to write, or wrote without rereading.
- That made NIH-style stalls look like generic incomplete runs instead of a specific no-write-loop pattern.

## Hardening added in this session

### Runtime

- Added a Word-specific no-write-loop detector in the runtime.
- It derives live execution diagnostics from tool events:
  - pre-write read count
  - first read timestamp
  - first successful write timestamp
  - failed write count
  - post-write reread count
  - whether plan progress moved beyond inspection
- For mutation-capable Word tasks, once the task has:
  - at least one real Word read
  - prompt guidance active
  - no approval block
  - and repeated pre-write inspection beyond the configured budget
  the runtime now blocks the task with a diagnostic handoff instead of letting it continue indefinitely.

### Prompt layer

- Added a bounded execution path to the Word system prompt:
  - inspect the smallest needed scope
  - perform one bounded write
  - reread immediately
  - only then continue
- Added explicit guidance not to postpone all writes behind one harder subproblem in a multi-fix cleanup request.

### Verification

- Added a `word:write-progress` verifier.
- It now distinguishes:
  - no successful write
  - write attempted but failed
  - successful write with no reread
  - successful write with reread

### Harness

- Extended live execution receipt classification to label:
  - `reviewer_only_success`
  - `no_write_loop`
  - `write_attempted_but_failed`
  - `write_succeeded_without_reread`
  - `write_completed_with_reread`
- Added a separate per-task execution diagnostic artifact:
  - `*-execution-diagnostic.json`

## What to look for in live validation

- If the NIH task still stalls, the runtime should now terminate it as a blocked no-write loop with a handoff reason, not leave it as an open-ended silent execution.
- If the task performs a bounded write but forgets to reread, the verifier/harness should classify that separately.
- If the task completes a write and reread, bridge state and execution diagnostics should show first-write timing and post-write reread evidence.
