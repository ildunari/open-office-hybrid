# Word Live Review Workflows

This document explains how to trigger the v1 Hybrid Word live-review system and
what the operator still owns during a run.

## Default entry path

The default entry mode is a natural-language capability request. The system
translates that request into a capability-led plan, chooses one to three source
documents, and then shapes one document batch at a time.

Examples:

- "Run a live review for NIH grant editing."
- "Check whether the grant scope protections still hold in live Hybrid Word."

## Slash-style prompt conventions

Slash-style prompts are supported as documented conventions rather than a hard
command parser. Fuzzy equivalents should route to the same capability-led flow
when the intent is clear.

Examples:

- `/live-review nih_grants`
- `/live-review failure-led grant_nih_r01_template_v1`
- `/live-review manual grant_nih_r01_template_v1 M08-grant-protected-neighbor`

## Batch behavior

- one batch equals one source document
- one task equals one fresh disposable clone
- hard cap stays at four tasks per document batch
- default planning stays diagnosis-first and risk-first

The system keeps live-review artifacts under
`packages/sdk/tests/word-benchmark/artifacts/live-review/` so they stay separate
from deterministic benchmark rerun artifacts.

## Operator responsibilities

The operator opens the Hybrid pane once at the start of each document batch.
The system should only ask again if the bridge session drops or the pane/session
continuity is lost.

The operator does not need to choose tasks manually in the normal path unless a
manual/orchestrator-led run is requested.

## Self-healing boundaries

The v1 loop may diagnose and attempt one bounded fix/rerun cycle only for:

- harness logic
- scoring logic
- bridge/session/tooling support
- artifact/reporting contracts

The v1 loop must not autonomously do broad product-behavior refactors, prompt
architecture churn, or open-ended product cleanup.
