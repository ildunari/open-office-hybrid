# Bridge Agent Testing & Monitoring System - Code Review Prompt

Use this document to perform a complete independent review of the Office Bridge agent testing, monitoring, and debugging system built across Phases 1-5.

## Files Changed

### Phase 1: Core Instrumentation

| File | Changes |
|------|---------|
| `packages/bridge/src/protocol.ts` | Added `BridgeErrorClass` type (8 error classes), `BridgeEventPayloads` interface (30+ typed events across 10 categories), `BridgeEventName` type, `BridgeTypedEvent<K>` generic, `BridgeRuntimeStateSlice` interface, `BridgeClassifiedError` interface, `toBridgeClassifiedError()` helper, `createBridgeEvent()` helper |
| `packages/sdk/src/runtime.ts` | Added `bridgeEventSink` property on `RuntimeAdapter`, `emitBridgeEvent()` private method, `getRuntimeStateSlice()` method. Events emitted at: mode changes (`state:mode_changed`), phase changes (`state:phase_changed`), message lifecycle (`message:created`, `message:completed`), tool lifecycle (`tool:started`, `tool:completed`, `tool:failed`) |

### Phase 3: CLI & Scripts

| File | Changes |
|------|---------|
| `packages/bridge/src/cli.ts` | Added CLI commands: `state`, `poll`, `assert`, `bench`, `summary`, `diag`, `dom`, `reset`, `screenshot-diff`. Added `DOM_QUERIES` map with 5 pre-built queries. Added output formatting (`--compact`, `--fields`, `--max-tokens`). Added `wait` command |
| `packages/bridge/src/server.ts` | Added SSE endpoint `GET /sessions/{id}/events/stream` with event type filtering via `?events=` query param. Added `POST /sessions/{id}/diff` endpoint with `since` timestamp. Added `sseListeners` set per session |
| `scripts/bridge/wait-and-check.sh` | Shell script: wait for bridge session, verify tools loaded |
| `scripts/bridge/smoke-test.sh` | Shell script: full integration smoke test (5 checks) |
| `scripts/bridge/regression-loop.sh` | Shell script: run tool sequence from JSON, compare to baselines |
| `scripts/bridge/event-monitor.sh` | Shell script: long-running event poller with JSONL output |

### Phase 4: Frontend Observability

| File | Changes |
|------|---------|
| `packages/core/src/chat/bridge-ui-events.ts` | New file: singleton `setBridgeController()` + `emitBridgeUIEvent()`. Zero overhead when bridge is disconnected (early return if `!bridgeController?.enabled`) |
| `packages/core/src/chat/chat-interface.svelte` | Emits: `ui:theme_changed`, `ui:session_switched`, `ui:tab_changed`, `ui:panel_toggled` |
| `packages/core/src/chat/diagnostics-panel.svelte` | Emits: `ui:panel_toggled` (diagnostics) |
| `packages/core/src/chat/plan-panel.svelte` | Emits: `ui:panel_toggled` (plan) |
| `packages/core/src/chat/approval-drawer.svelte` | Emits: `ui:approval_shown`, `ui:approval_responded` |
| `packages/core/src/chat/message-list.svelte` | Emits: `ui:scroll_position` |
| `packages/core/src/chat/error-boundary.svelte` | Emits: `error:ui_boundary` (cast as `any` since not in typed map) |
| `packages/core/src/chat/resize-handle.svelte` | Emits: `ui:resize` |
| `packages/bridge/src/dom-queries.ts` | New file: 5 pre-built DOM query templates (visible-panels, scroll-positions, computed-theme, layout-metrics, message-count) |
| `packages/bridge/src/client.ts` | Added `beforeunload` handler emitting `session:hmr_reload` |

### Phase 5: State Diffing & Visual Regression

| File | Changes |
|------|---------|
| `packages/bridge/src/server.ts` | Added `POST /sessions/{id}/diff` endpoint returning new events since timestamp + non-null runtime state fields |
| `packages/bridge/src/cli.ts` | Added `screenshot-diff` command for byte-level image comparison |

## Verification Checklist

### Phase 1: Core Instrumentation

- [ ] `BridgeEventPayloads` in `protocol.ts` compiles without errors
- [ ] All event categories have at least one event defined: message (3), tool (4), plan (4), state (2), approval (3), context (2), error (4), UI (8), session (2), backward-compat (14)
- [ ] `BridgeTypedEvent<K>` correctly narrows payload type based on event name
- [ ] `BridgeRuntimeStateSlice` has all required fields: mode, taskPhase, isStreaming, permissionMode, waitingState, activePlanSummary, activeTaskSummary, contextBudget, lastVerification, sessionStats, error, threadCount, activeThreadId, degradedGuardrails
- [ ] `BridgeClassifiedError` extends `BridgeError` with `errorClass` field
- [ ] `toBridgeClassifiedError()` returns a proper `BridgeClassifiedError`
- [ ] `createBridgeEvent()` creates events with correct `type: "event"` and `ts`
- [ ] `bridgeEventSink` on `RuntimeAdapter` in `runtime.ts` is optional and callable
- [ ] `getRuntimeStateSlice()` returns an object conforming to `BridgeRuntimeStateSlice`
- [ ] `emitBridgeEvent()` calls `bridgeEventSink` when available, silently no-ops otherwise
- [ ] Events emitted at: mode change, phase change, message created, message completed, tool started, tool completed, tool failed

### Phase 3: CLI & Scripts

- [ ] All new commands exist in `COMMANDS` map in `cli.ts`: `state`, `poll`, `assert`, `bench`, `summary`, `diag`, `dom`, `reset`, `screenshot-diff`
- [ ] Each command has entry in `printUsage()` help text
- [ ] `state` command reads `snapshot.runtimeState` and prints JSON (or compact one-liner)
- [ ] `poll` command tries SSE first, falls back to HTTP polling
- [ ] `assert` command checks `--mode`, `--phase`, `--streaming` flags against runtime state, exits 1 on mismatch
- [ ] `bench` command runs tool N times, reports min/avg/max timing
- [ ] `summary` command prints a single-line status string
- [ ] `diag` command fetches session + events + runtime state in parallel
- [ ] `dom` command looks up query from `DOM_QUERIES` map and executes via `/exec`
- [ ] `reset` command clears localStorage + IndexedDB, with `--keep-config` preserving provider keys
- [ ] `screenshot-diff` command reads two image files and computes byte-level similarity
- [ ] SSE endpoint responds with `Content-Type: text/event-stream`
- [ ] SSE endpoint filters events by `?events=` query param
- [ ] All 4 shell scripts are valid bash (`bash -n scripts/bridge/*.sh`)
- [ ] Shell scripts have `#!/usr/bin/env bash` and `set -euo pipefail`
- [ ] `smoke-test.sh` runs 5 checks and exits with failure count
- [ ] `regression-loop.sh` requires `jq` and a sequence JSON file
- [ ] `event-monitor.sh` supports `--duration`, `--filter`, `--log-file` options

### Phase 4: Frontend Observability

- [ ] `bridge-ui-events.ts` exports `setBridgeController()` and `emitBridgeUIEvent()`
- [ ] `emitBridgeUIEvent` returns immediately when `bridgeController` is null or not enabled
- [ ] All 7 Svelte components import `emitBridgeUIEvent` from `./bridge-ui-events.js`
- [ ] `chat-interface.svelte` emits 4 events: theme_changed, session_switched, tab_changed, panel_toggled
- [ ] `diagnostics-panel.svelte` emits: panel_toggled
- [ ] `plan-panel.svelte` emits: panel_toggled
- [ ] `approval-drawer.svelte` emits: approval_shown, approval_responded
- [ ] `message-list.svelte` emits: scroll_position
- [ ] `error-boundary.svelte` emits: error event (note: uses `as any` cast)
- [ ] `resize-handle.svelte` emits: resize
- [ ] `dom-queries.ts` has 5 queries: visible-panels, scroll-positions, computed-theme, layout-metrics, message-count
- [ ] Each DOM query has `description` and `code` fields
- [ ] `client.ts` emits `session:hmr_reload` on `beforeunload`

### Phase 5: State Diffing & Visual Regression

- [ ] `POST /sessions/{id}/diff` endpoint exists in `server.ts`
- [ ] Diff endpoint accepts `{ since: timestamp }` body
- [ ] Diff endpoint returns `{ ok, since, now, newEvents, runtimeStateDiff }`
- [ ] `screenshot-diff` command exists in CLI COMMANDS map
- [ ] Screenshot diff reads two files, computes byte-level similarity, reports `{ similarity, diffPixels, totalPixels, passed }`
- [ ] `--threshold` flag defaults to 0.95

## Grep Verification Commands

Run these to verify completeness:

```bash
# Every emitBridgeUIEvent call site (should be 7 files, ~15 call sites)
grep -rn "emitBridgeUIEvent" packages/core/src/chat/

# Every new CLI command in COMMANDS map
grep -A1 "const COMMANDS" packages/bridge/src/cli.ts

# Every typed event in BridgeEventPayloads
grep -E '^\s+"[a-z]+:' packages/bridge/src/protocol.ts

# Backward-compat events
grep -E '^\s+[a-z_]+:' packages/bridge/src/protocol.ts

# bridgeEventSink usage in runtime
grep -n "bridgeEventSink\|emitBridgeEvent" packages/sdk/src/runtime.ts

# SSE listener management
grep -n "sseListeners" packages/bridge/src/server.ts

# DOM queries in cli.ts
grep -n "DOM_QUERIES" packages/bridge/src/cli.ts

# DOM queries in dom-queries.ts
grep -n "description:" packages/bridge/src/dom-queries.ts

# Shell scripts are valid bash
bash -n scripts/bridge/wait-and-check.sh
bash -n scripts/bridge/smoke-test.sh
bash -n scripts/bridge/regression-loop.sh
bash -n scripts/bridge/event-monitor.sh

# HMR awareness
grep -n "hmr_reload\|beforeunload" packages/bridge/src/client.ts

# Diff endpoint
grep -n "diff" packages/bridge/src/server.ts
```

## Known Limitations and Deferred Items

### Phase 2: Security (Deferred)

Authentication and rate limiting were intentionally deferred. The bridge is localhost-only for development. Future work should add:
- API key or token-based auth for the HTTP API
- Rate limiting per client
- Optional TLS client certificate validation

### Screenshot Diff is Byte-Level

The `screenshot-diff` command compares raw file bytes, not decoded pixel data. This means:
- Different PNG compression of identical images will show as different
- It cannot ignore anti-aliasing differences
- It is a coarse comparison, not a perceptual diff

### Event Log File Persistence Not Implemented

Events are held in-memory per session (`recentEvents` array). There is no disk persistence. The `event-monitor.sh` script works around this by polling and writing to a JSONL file.

### State Diff is Simplified

The `POST /sessions/{id}/diff` endpoint returns all non-null fields from `runtimeState`, not a true delta from the previous state. It does filter events by `since` timestamp correctly.

### error-boundary Uses `as any` Cast

`error-boundary.svelte` emits `"error:ui_boundary"` which is not in the typed `BridgeEventPayloads` map. It uses an `as any` cast. This event name should either be added to the typed map or changed to use an existing error event like `"error:runtime"`.

## Architecture Decisions to Validate

### 1. Singleton Pattern for UI Events

`bridge-ui-events.ts` uses a module-level variable (`bridgeController`) set via `setBridgeController()`. When null or disabled, `emitBridgeUIEvent()` returns immediately. This gives zero runtime overhead when the bridge is not connected, but means:
- Only one bridge connection per page (fine for Office add-ins, single taskpane)
- No cleanup needed on disconnect (just set to null)

**Validate:** Check that `setBridgeController(null)` is called on disconnect/cleanup.

### 2. Central `update()` Method for Mode/Phase Tracking

Instead of instrumenting every location that changes mode or phase, the SDK runtime has a central `emitBridgeEvent()` helper called from the main state transition points. This reduces instrumentation surface area but means:
- Any state change that bypasses the tracked code paths won't emit events
- The runtime must call `emitBridgeEvent` at every mode/phase transition

**Validate:** Check that mode changes in `runtime.ts` all flow through the instrumented paths.

### 3. SSE Listeners Stored Per-Session

Each session has a `sseListeners: Set<SseListener>` for streaming events. When a new event arrives via WebSocket, all SSE listeners for that session are notified. This means:
- Multiple SSE clients can subscribe to the same session
- Cleanup happens on HTTP connection close
- No global event bus needed

**Validate:** Check that listeners are properly removed on `req.on("close", ...)`.

### 4. DOM Queries as String Templates

DOM queries are stored as JavaScript strings in both `cli.ts` (inline) and `dom-queries.ts` (module). They are sent to the bridge `exec` endpoint for evaluation in the taskpane. This means:
- Queries run in the actual add-in DOM context
- They can access any browser API
- They are not type-checked at compile time

**Validate:** There are two sets of DOM queries (in `cli.ts` and `dom-queries.ts`). Check whether these are in sync or serve different purposes. The `cli.ts` queries are used by the CLI `dom` command. The `dom-queries.ts` module may be exported for programmatic use.

### 5. Backward Compatibility with Untyped Events

The `BridgeEventPayloads` map includes both typed events (e.g., `"tool:completed"` with specific payload) and backward-compatible events (e.g., `bridge_connected` with `Record<string, unknown>`). The existing `BridgeEventMessage` interface still uses `event: string` and `payload?: unknown`, so old code continues to work.

**Validate:** Ensure `BridgeEventMessage` is not removed or narrowed. Old event consumers should still compile.
