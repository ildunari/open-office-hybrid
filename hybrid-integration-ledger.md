# Hybrid Integration Ledger

## Kept From Claude

- SDK planning foundation in `packages/sdk/src/planning/*`
- SDK task tracking, reflection, verification, and persisted plan/task storage in `packages/sdk/src/state/*`, `packages/sdk/src/reflection/*`, `packages/sdk/src/verification/*`, and `packages/sdk/src/storage/*`
- Hook registry, tool wrapper, read-before-write protections, and format fingerprint hooks in `packages/sdk/src/hooks/*`
- Pattern registry plus Excel and Word reasoning patterns and verification suites in `packages/sdk/src/patterns/*`, `packages/excel/src/lib/patterns/*`, `packages/excel/src/lib/verifiers/*`, `packages/word/src/lib/patterns/*`, and `packages/word/src/lib/verifiers/*`

## Kept From Codex

- Permission mode vocabulary: `read_only`, `confirm_writes`, `confirm_risky`, `full_auto`
- Compact operator-facing chat surfaces in `packages/core/src/chat/status-strip.svelte`, `packages/core/src/chat/approval-drawer.svelte`, `packages/core/src/chat/plan-panel.svelte`, `packages/core/src/chat/resume-task-banner.svelte`, and `packages/core/src/chat/task-progress-bar.svelte`
- Provider-config hardening for missing `localStorage` APIs in `packages/sdk/src/provider-config.ts` and its tests

## Rewritten As Hybrid

- `packages/sdk/src/runtime.ts`
  - Claude runtime core preserved, but now exposes Codex-style alias state: `planState`, `taskPhase`, `permissionMode`, and `waitingState`
  - Permission mode remains the compact operator-facing alias, but now maps onto first-class capability boundary and approval policy state
  - Runtime now tracks instruction-source hierarchy, policy traces, thread summaries, compaction state, and completion artifacts without introducing a second persistence authority
- `packages/core/src/chat/app-adapter.ts`
  - Combines Claude adapter safety extension points with the shared host/permission vocabulary needed by the hybrid UI
- `packages/core/src/chat/chat-interface.svelte` and `packages/core/src/chat/settings-panel.svelte`
  - Uses Codex-style status/approval/plan/resume UI against the Claude-backed runtime state
  - Adds a collapsed diagnostics surface for instruction sources, policy state, hooks/patterns/verifiers, active thread, compaction state, and completion artifacts
- `packages/core/src/sdk.ts`
  - Adds a SDK-only subpath so app packages can consume runtime helpers without pulling the Svelte UI surface into tests
- `packages/powerpoint/src/lib/adapter.ts`, `packages/powerpoint/src/lib/patterns/*`, and `packages/powerpoint/src/lib/verifiers/*`
  - PowerPoint now participates in the same framework layer as Excel and Word with host registration, reasoning patterns, risk estimation, handoff summaries, and verification suites

## Rejected And Why

- Codex `AgentOrchestrator`, `TaskStore`, `workspaceGuidance`, and `learnedMemory`
  - Rejected to avoid a second runtime authority and a second persistence story alongside Claude’s task/plan storage
- Claude `PlanChecklist` UI
  - Rejected to avoid duplicating plan, approval, and handoff state in the chat surface
- Direct app-package imports from `@office-agents/sdk`
  - Rejected in app packages to preserve the repo’s package boundary and keep tests from pulling the full core UI bundle unexpectedly
