# Word Live Review System Design Draft

Status: workflow and archive decisions finalized for v1 implementation
Date: 2026-03-22
Scope: v1 design baseline with workflow defaults locked for implementation

## Goal

Design a three-layer Word testing system for OpenWord Hybrid that compares benchmark artifacts against real live-review behavior in Word, while staying as automated as possible and avoiding the current benchmark sprawl.

The system should:

- default to capability-led testing requests in natural language
- run live review against real Word documents and the Hybrid side panel
- compare harness conclusions with live reviewer conclusions
- diagnose failures and, when safe, self-heal low-blast-radius harness/tooling issues
- keep the user out of the loop except where Word session/pane state still requires a human action

## Non-Goals For V1

- fully automating Word pane opening
- parallel live reviewers in multiple Word windows
- broad autonomous product-behavior refactors
- replacing the deterministic benchmark harness
- relying on undo as a document reset mechanism

## Core Model

### Three Layers

1. Automated harness and validator layer
   - Current benchmark/task-manifest/artifact system
   - Produces task definitions, run artifacts, validator results, and historical signals

2. Live reviewer layer
   - A reviewer subagent runs a task live through the side-panel agent on a fresh disposable clone
   - Produces a structured report plus freeform observations

3. Orchestrator synthesis layer
   - Compares live reviewer findings against benchmark artifacts
   - Classifies mismatches
   - Diagnoses failures
   - Plans bounded fixes

### Terminology

- Capability area: broad product behavior to test, such as NIH grant editing or legal numbering
- Document family: domain grouping, such as NIH grants, legal contracts, civil complaints
- Source document: concrete fixture file used for a live session
- Task: one benchmark action on one source document
- Batch: a grouped live-review pass over one source document for one testing purpose

## Locked Decisions

### Entry Mode

- Default entry mode is capability-led
- The user can still invoke:
  - capability-led runs
  - failure-led runs
  - manual/orchestrator-led runs

### Batch Scope

- One batch equals one source document
- One task equals one fresh disposable clone
- One document batch may contain multiple tasks
- One capability-led run may use up to 3 source documents max
- Default is 2 documents unless risk signals justify a third

### Document Selection

- The orchestrator may choose 1 to 3 documents automatically
- It must explain how many documents it chose and why
- Selection should use a weighted blend:
  - 60% prior artifact risk
  - 30% fixture metadata / difficulty
  - 10% diversity coverage

### Task Selection

- Default task ordering is highest-risk first
- Default batch goal is diagnosis-first, not coverage-first
- Within one document batch, task count should follow a risk-budget until confidence is reached, not a blind fixed count
- Recommended v1 default:
  - start with the top 2 highest-risk tasks
  - continue only when failures, mismatches, or instability mean confidence has not yet been reached
  - enforce a hard per-document cap

### User Interaction Boundary

- The reviewer system opens the target document itself
- The user opens the Hybrid pane once at batch start
- The system should only ask again if the bridge session drops or pane continuity is lost

### Session Handling

- The system should try to keep one Word window and one pane/session alive across task clones in the same document batch
- Pane continuity is an optimization, not an assumption
- Before every task, the system should verify:
  - expected document path
  - visible Word title
  - bridge session id
  - Word document id
- If the preflight tuple does not match, the system should pause rather than trust a stale session

### Clone Lifecycle

- Every live task runs on a fresh clone
- Clones should live in one temp workspace per batch
- Each clone should have a unique task-specific id
- Successful task clones are closed without save and deleted
- Failed task clones should be quarantined for later inspection
- The system must not rely on undo for reset

### Live Review Report Storage

- Living batch reports should live in a separate live-review artifact tree
- Do not mix live-review runs into the benchmark rerun artifact folders
- Recommended namespace:
  - `packages/sdk/tests/word-benchmark/artifacts/live-review/`
- Purpose:
  - keep deterministic benchmark artifacts separate from human-like live-review evidence
  - make harness-vs-live comparison easier
  - avoid polluting benchmark-history folders with a different evidence model

### Reviewer Subagent Role

- The reviewer subagent triggers the live task itself
- It owns the end-to-end reviewer experience
- It writes:
  - structured report fields
  - freeform observations

Minimum reviewer report fields:

- task identity
- capability area
- source document
- task id
- clone id
- timestamp
- readiness state
- doc opened
- pane ready
- bridge session id
- Word document id
- execution status
- duration
- retries used
- meaning preserved
- scope preserved
- Word-native integrity preserved
- visible layout/formatting issues
- collateral damage observed
- failure classification
- evidence checked
- verdict
- score
- confidence
- freeform observations

### Orchestrator Role

- The orchestrator compares:
  - benchmark artifacts
  - live reviewer output
- It diagnoses failures and writes:
  - batch intent
  - chosen docs and why
  - per-task timeline
  - diagnosis summary
  - whether a fix was attempted
  - whether the rerun improved
  - mismatch map between harness and live review
  - stop reasons
  - quarantined tasks
  - next-action queue

## Self-Healing Defaults

### Task-Level Recovery Loop

On a clear critical failure:

1. Pause the failing task
2. Orchestrator diagnoses the failure
3. Orchestrator writes a bounded fix plan
4. Orchestrator launches a fix subagent with full relevant context
5. System resets to a fresh clone
6. Same reviewer subagent reruns the task from the start

### Retry Budget

- One diagnosis cycle
- One bounded fix cycle
- One full rerun from a fresh clone
- If the rerun fails again, quarantine the task and continue

### Give-Up Rules

Give up on a task when:

- it fails again after the single fix/rerun cycle
- the root cause remains ambiguous after diagnosis
- the failure is clearly environmental and not task-specific

Give up on a document when:

- pane/session instability repeatedly prevents preflight re-establishment
- 2 tasks on the same document fail due to session/pane instability
- 3 tasks on the same document are quarantined

Capability-led stop behavior:

- on the first severe product failure, stop the broader capability-led run
- diagnose at the orchestrator layer
- attempt the bounded fix/rerun loop
- then resume from the same run state rather than skipping immediately to additional documents
- if a document produces strong positive evidence, do not stop early on success alone
- continue into later planned documents for diversity coverage because additional document shapes may still reveal failures

## Automatic Fix Scope For V1

Automatic fixes should be tightly bounded to low-blast-radius areas:

- harness logic
- scoring logic
- bridge/session/tooling support
- artifact/reporting contracts

V1 should not autonomously:

- rewrite broad product behavior
- do large prompt-architecture churn
- perform open-ended product refactors

## Issue Recording

### Confirmed Need

We want a root-visible record of high-priority failures that captures:

- what failed
- how it failed
- how to reproduce it
- where the fix most likely belongs

We do not want the issue record to contain solution hints that bias future reviewer or fix agents.

### Finalized Recommendation

Use two levels:

1. Batch report
   - detailed run evidence for one live testing session

2. High-priority issue ledger
   - root-visible compact index of important open issues
   - factual only
   - no implementation tips

Minimum issue-ledger fields:

- issue id
- capability area
- source document
- task id
- date/run reference
- observed behavior
- expected behavior
- reproduction summary
- seen in harness, live review, or both
- likely failure class
- likely solution surface
- status

Workflow and archive decision:

- use an active issue ledger plus a separate resolved archive from day one
- keep the active ledger small and high-signal for future review/fix agents
- store resolved issues with a compact archive entry plus a linked detailed per-issue report
- default operator entry is natural-language capability requests, with documented
  slash-style command patterns and fuzzy equivalents as prompt conventions
- user responsibility remains opening the Hybrid pane once per document batch

## V1 Scope Boundary

First version should stay intentionally narrow:

- one capability-led run
- up to 2 documents by default, 3 only when justified
- sequential live reviewer execution
- one fix/rerun loop per failed task
- hard cap of 4 tasks per document batch
- no parallel live reviewers
- no autonomous product-level refactors

This is intended to avoid building another sprawling benchmark system before the live reviewer loop proves itself.
