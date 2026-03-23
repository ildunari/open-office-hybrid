# Word Live Review Artifacts

This directory defines the live-review layer that sits beside the deterministic
Word benchmark harness.

## Purpose

- Keep live-review evidence separate from benchmark rerun history.
- Preserve a stable place for planner output, reviewer reports, batch reports,
  and issue tracking.
- Make harness-versus-live comparison possible without polluting the existing
  benchmark artifact tree.

## Artifact separation

- Deterministic benchmark runs stay under `artifacts/word-benchmark/`.
- Live-review runs stay under `artifacts/live-review/`.
- Issue tracking for live-review runs stays under
  `artifacts/live-review/issues/`.

## Naming rules

- `batch_id`: `lrb-<capability>-<source-doc>-<timestamp>`
- `task_id`: preserve the benchmark task or session id exactly as it appears in
  the suite files
- `clone_id`: `clone-<task-id>-<attempt>`

These names are intentionally compact so reports, quarantines, and reruns can
be matched back to the originating batch without renaming the benchmark
history.
