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
  - Permission mode now adjusts approval behavior without introducing a second orchestrator state model
- `packages/core/src/chat/app-adapter.ts`
  - Combines Claude adapter safety extension points with the shared host/permission vocabulary needed by the hybrid UI
- `packages/core/src/chat/chat-interface.svelte` and `packages/core/src/chat/settings-panel.svelte`
  - Uses Codex-style status/approval/plan/resume UI against the Claude-backed runtime state
- `packages/core/src/sdk.ts`
  - Adds a SDK-only subpath so app packages can consume runtime helpers without pulling the Svelte UI surface into tests

## Rejected And Why

- Codex `AgentOrchestrator`, `TaskStore`, `workspaceGuidance`, and `learnedMemory`
  - Rejected to avoid a second runtime authority and a second persistence story alongside Claude’s task/plan storage
- Claude `PlanChecklist` UI
  - Rejected to avoid duplicating plan, approval, and handoff state in the chat surface
- Direct app-package imports from `@office-agents/sdk`
  - Rejected in app packages to preserve the repo’s package boundary and keep tests from pulling the full core UI bundle unexpectedly
