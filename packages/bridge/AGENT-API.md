# Office Bridge Agent API Reference

Machine-readable reference for agents interacting with the Office Bridge development server.

## Quick Start

```bash
# 1. Start the bridge server
pnpm bridge:serve

# 2. Open an Office app with the add-in sideloaded
pnpm start:word

# 3. List connected sessions
pnpm exec office-bridge list

# 4. Inspect a session
pnpm exec office-bridge inspect word

# 5. Run a tool
pnpm exec office-bridge tool word get_document_text
```

The bridge runs at `https://localhost:4017` by default. The add-in taskpane auto-connects via WebSocket at `wss://localhost:4017/ws`.

## HTTP Endpoints

Base URL: `https://localhost:4017`

All responses are JSON with `{ ok: true, ... }` on success or `{ ok: false, error: { message: string } }` on failure.

### GET /health

Health check.

```bash
curl -sk https://localhost:4017/health
```

```json
{ "ok": true, "uptime": 12345 }
```

### GET /sessions

List all connected sessions.

```bash
curl -sk https://localhost:4017/sessions
```

```json
{
  "ok": true,
  "sessions": [
    {
      "snapshot": {
        "sessionId": "bridge_abc123",
        "instanceId": "inst_xyz",
        "app": "word",
        "appName": "OpenWord Hybrid",
        "documentId": "doc-hash",
        "tools": [{ "name": "get_document_text", "description": "..." }],
        "host": { "href": "https://localhost:3003", "userAgent": "..." },
        "runtimeState": { "mode": "discuss", "taskPhase": "idle", "isStreaming": false, ... },
        "connectedAt": 1700000000000,
        "updatedAt": 1700000001000
      },
      "lastSeenAt": 1700000001000
    }
  ]
}
```

### GET /sessions/{id}

Get a single session by ID.

```bash
curl -sk https://localhost:4017/sessions/bridge_abc123
```

```json
{
  "ok": true,
  "session": { "snapshot": { ... }, "lastSeenAt": ... }
}
```

### POST /sessions/{id}/invoke

Invoke an RPC method on a connected session. The add-in processes the request via WebSocket.

```bash
curl -sk -X POST https://localhost:4017/sessions/bridge_abc123/invoke \
  -H 'Content-Type: application/json' \
  -d '{"method":"execute_tool","params":{"toolName":"get_document_text","args":{}}}'
```

**Methods:**

| Method | Params | Description |
|--------|--------|-------------|
| `ping` | none | Connectivity check |
| `get_session_snapshot` | none | Full session snapshot from the add-in |
| `refresh_session` | none | Force snapshot refresh |
| `execute_tool` | `{ toolName, args }` | Run a registered add-in tool |
| `execute_unsafe_office_js` | `{ code, explanation? }` | Run arbitrary JS in the taskpane |
| `vfs_list` | `{ prefix? }` | List VFS files |
| `vfs_read` | `{ path, encoding? }` | Read a VFS file |
| `vfs_write` | `{ path, text?, dataBase64? }` | Write a VFS file |
| `vfs_delete` | `{ path }` | Delete a VFS file |

### POST /sessions/{id}/tools/{toolName}

Shorthand for `execute_tool`.

```bash
curl -sk -X POST https://localhost:4017/sessions/bridge_abc123/tools/get_document_text \
  -H 'Content-Type: application/json' \
  -d '{"args":{}}'
```

### POST /sessions/{id}/exec

Execute code in the taskpane. Default is unsafe (full runtime access). Pass `"unsafe": false` for sandboxed mode.

```bash
curl -sk -X POST https://localhost:4017/sessions/bridge_abc123/exec \
  -H 'Content-Type: application/json' \
  -d '{"code":"return document.title","unsafe":true}'
```

### POST /sessions/{id}/metadata

Fetch document metadata from the add-in's adapter.

```bash
curl -sk -X POST https://localhost:4017/sessions/bridge_abc123/metadata -d '{}'
```

### GET /sessions/{id}/events?limit=N

Fetch recent bridge events.

```bash
curl -sk "https://localhost:4017/sessions/bridge_abc123/events?limit=20"
```

```json
{
  "ok": true,
  "events": [
    { "id": "evt_1", "event": "tool:completed", "ts": 1700000000000, "payload": { "toolCallId": "tc1", "toolName": "get_document_text", "durationMs": 45 } }
  ]
}
```

### GET /sessions/{id}/events/stream?events=type1,type2

Server-Sent Events (SSE) stream. Optionally filter by comma-separated event types.

```bash
curl -sk -N "https://localhost:4017/sessions/bridge_abc123/events/stream?events=tool:completed,error:runtime"
```

Each SSE message is `data: <JSON>\n\n` where JSON is a `BridgeStoredEvent`.

### POST /sessions/{id}/diff

State diff since a given timestamp. Returns new events and non-null runtime state fields.

```bash
curl -sk -X POST https://localhost:4017/sessions/bridge_abc123/diff \
  -H 'Content-Type: application/json' \
  -d '{"since":1700000000000}'
```

```json
{
  "ok": true,
  "since": 1700000000000,
  "now": 1700000001000,
  "newEvents": [...],
  "runtimeStateDiff": { "mode": "discuss", "isStreaming": false, ... }
}
```

### VFS Endpoints

```bash
# List files
curl -sk -X POST https://localhost:4017/sessions/{id}/vfs/list -d '{}'

# Read file
curl -sk -X POST https://localhost:4017/sessions/{id}/vfs/read \
  -d '{"path":"/home/user/file.txt","encoding":"text"}'

# Write file
curl -sk -X POST https://localhost:4017/sessions/{id}/vfs/write \
  -d '{"path":"/home/user/file.txt","text":"content"}'

# Delete file
curl -sk -X POST https://localhost:4017/sessions/{id}/vfs/delete \
  -d '{"path":"/home/user/file.txt"}'
```

### POST /shutdown

Gracefully stop the bridge server.

```bash
curl -sk -X POST https://localhost:4017/shutdown -d '{}'
```

## CLI Commands

All commands accept `--url URL` to override the bridge address.

### Server Lifecycle

```bash
office-bridge serve [--host HOST] [--port PORT]    # Start bridge server
office-bridge stop [--url URL]                      # Stop bridge server
```

### Session Discovery

```bash
office-bridge list [--json]                                          # List sessions
office-bridge wait [selector] [--app APP] [--timeout MS] [--json]   # Wait for a session
```

### Inspection

```bash
office-bridge inspect [session] [--compact] [--fields KEY1,KEY2]    # Full session snapshot
office-bridge metadata [session] [--compact]                         # Document metadata
office-bridge events [session] [--limit N] [--compact] [--max-tokens N]  # Recent events
office-bridge state [session] [--compact]                            # Runtime state slice
office-bridge summary [session]                                      # One-line status
office-bridge diag [session]                                         # Full diagnostics dump (session + events + state)
```

### Execution

```bash
office-bridge tool [session] <toolName> [--input JSON | --file PATH | --stdin] [--out PATH]
office-bridge exec [session] [--code JS | --file PATH | --stdin] [--sandbox] [--out PATH]
office-bridge rpc [session] <method> [--input JSON | --file PATH | --stdin]
```

### Screenshots

```bash
office-bridge screenshot [session] [--pages N | --sheet-id ID --range A1:B2 | --slide-index N] [--out PATH]
office-bridge screenshot-diff <img1> <img2> [--threshold 0.95]
```

### VFS

```bash
office-bridge vfs ls [session] [prefix]
office-bridge vfs pull [session] <remotePath> [localPath]
office-bridge vfs push [session] <localPath> <remotePath>
office-bridge vfs rm [session] <remotePath>
```

### Monitoring & Testing

```bash
office-bridge poll [session] [--interval MS] [--events TYPE1,TYPE2]     # Stream events as NDJSON (SSE preferred, falls back to polling)
office-bridge assert [session] [--mode X] [--phase Y] [--streaming true|false]  # Assert runtime state (exit 1 on mismatch)
office-bridge bench [session] <toolName> [--runs N]                     # Benchmark a tool (min/avg/max ms)
office-bridge dom [session] <query>                                     # Run a pre-built DOM query
office-bridge reset [session] [--keep-config]                           # Clear localStorage + IndexedDB
```

### DOM Queries

Pre-built queries for `office-bridge dom`:

| Query | Description |
|-------|-------------|
| `visible-panels` | Which tabs and panels are currently visible |
| `scroll-positions` | Scroll state of key containers |
| `computed-theme` | Current CSS variable values for theme detection |
| `layout-metrics` | Bounding rects of major UI sections |
| `message-count` | Count of visible messages by type |

### Output Formatting Flags

| Flag | Effect |
|------|--------|
| `--compact` | Strip nulls, empty arrays, shorten timestamps |
| `--fields KEY1,KEY2` | Pick only specified keys from output |
| `--max-tokens N` | Limit number of events returned |
| `--json` | Force JSON output (for commands with text defaults) |

## Event Reference

All events are typed via `BridgeEventPayloads` in `protocol.ts`. Each event has a `ts` (timestamp) and typed `payload`.

### Message Lifecycle

| Event | Payload |
|-------|---------|
| `message:created` | `{ messageId, role }` |
| `message:streaming` | `{ messageId, tokenCount? }` |
| `message:completed` | `{ messageId, role, tokenCount?, durationMs? }` |

### Tool Lifecycle

| Event | Payload |
|-------|---------|
| `tool:queued` | `{ toolCallId, toolName }` |
| `tool:started` | `{ toolCallId, toolName }` |
| `tool:completed` | `{ toolCallId, toolName, durationMs?, truncated? }` |
| `tool:failed` | `{ toolCallId, toolName, error, durationMs? }` |

### Plan Lifecycle

| Event | Payload |
|-------|---------|
| `plan:created` | `{ planId, stepCount, mode }` |
| `plan:step_started` | `{ planId, stepId, stepIndex, kind }` |
| `plan:step_completed` | `{ planId, stepId, status, durationMs? }` |
| `plan:completed` | `{ planId, status, durationMs? }` |

### State Transitions

| Event | Payload |
|-------|---------|
| `state:mode_changed` | `{ from, to, reason? }` |
| `state:phase_changed` | `{ from, to, reason? }` |

### Approval Flow

| Event | Payload |
|-------|---------|
| `approval:requested` | `{ actionClass, scopes }` |
| `approval:granted` | `{ actionClass }` |
| `approval:denied` | `{ actionClass, reason? }` |

### Context Budget

| Event | Payload |
|-------|---------|
| `context:budget_update` | `{ usagePct, action }` |
| `context:compacted` | `{ artifactCount, threadId? }` |

### Errors

| Event | Payload |
|-------|---------|
| `error:tool` | `{ source, errorClass, message, stack? }` |
| `error:runtime` | `{ source, errorClass, message, stack?, recoveryAction? }` |
| `error:office_js` | `{ source, errorClass: "office_js", message, stack? }` |
| `error:recovered` | `{ source, errorClass, message, recoveryAction }` |

Error classes: `office_js`, `tool_execution`, `network`, `timeout`, `rate_limit`, `llm_api`, `ui_render`, `internal`, `unknown`.

### UI Events

| Event | Payload |
|-------|---------|
| `ui:tab_changed` | `{ tab }` |
| `ui:theme_changed` | `{ theme }` |
| `ui:panel_toggled` | `{ panel, visible }` |
| `ui:scroll_position` | `{ atBottom, scrollPct }` |
| `ui:approval_shown` | `{ actionClass }` |
| `ui:approval_responded` | `{ actionClass, approved }` |
| `ui:session_switched` | `{ fromSessionId?, toSessionId }` |
| `ui:resize` | `{ target, height }` |

### Session Lifecycle

| Event | Payload |
|-------|---------|
| `session:hmr_reload` | `{ previousSessionId? }` |
| `session:reconnected` | `{ previousSessionId? }` |

### Backward-Compatible Events

These use `Record<string, unknown>` payloads for compatibility with pre-typed code:

`bridge_connected`, `bridge_status`, `bridge_error`, `bridge_warning`, `session_updated`, `tool_executed`, `console`, `window_error`, `unhandled_rejection`, `unsafe_office_js_executed`, `vfs_listed`, `vfs_read`, `vfs_written`, `vfs_deleted`.

## Runtime State Slice

Available via `inspect`, `state`, and `diag` commands. Shape (`BridgeRuntimeStateSlice`):

```typescript
{
  mode: string;              // "discuss" | "agent" | ...
  taskPhase: string;         // "idle" | "planning" | "executing" | ...
  isStreaming: boolean;
  permissionMode: string;
  waitingState: string | null;
  activePlanSummary: { id, status, stepCount, activeStepIndex } | null;
  activeTaskSummary: { id, status, mode } | null;
  contextBudget: { usagePct: number; action: string };
  lastVerification: { status: string } | null;
  sessionStats: { inputTokens, outputTokens, totalCost, messageCount };
  error: string | null;
  threadCount: number;
  activeThreadId: string | null;
  degradedGuardrails: string[];
}
```

## Shell Scripts

Located in `scripts/bridge/`.

### wait-and-check.sh

Wait for a bridge session and verify it has tools loaded.

```bash
scripts/bridge/wait-and-check.sh --app word --timeout 30000
```

Exit 0 = healthy session with tools. Exit 1 = bridge unreachable or unhealthy.

### smoke-test.sh

Full integration smoke test: waits for session, takes screenshot, fetches metadata, inspects session, checks events.

```bash
scripts/bridge/smoke-test.sh word --out-dir ./smoke-results
```

Exit code = number of failed checks (0 = all pass).

### regression-loop.sh

Run tool calls from a JSON sequence file and compare outputs against baselines.

```bash
# Sequence file format: [{"tool":"name","args":{},"expectContains":"..."}]
scripts/bridge/regression-loop.sh tool-sequence.json word --baseline-dir ./baselines
```

Exit code = number of failures (0 = all match or new baselines saved).

### event-monitor.sh

Long-running event monitor that polls and appends to a JSONL log file.

```bash
scripts/bridge/event-monitor.sh word --filter error,tool --log-file events.jsonl --duration 300
```

Ctrl+C prints a summary of event types collected.

### focus-word-pane.sh

Use macOS accessibility to click or focus the already-open `OpenWord Hybrid`
side panel inside Microsoft Word.

```bash
scripts/bridge/focus-word-pane.sh --target body
scripts/bridge/focus-word-pane.sh --target header
scripts/bridge/focus-word-pane.sh --target input
```

This is useful when the taskpane is open but needs focus before further manual
or scripted interaction. It is a helper for the main bridge-based validation
workflow, not a replacement for it. Continue to use `summary`, `state`, `diag`,
`tool`, `events`, `poll`, and `screenshot` as the primary testing surfaces.
It currently targets the pane by accessibility bounds and relative offsets, not
by deep named web controls.

## Security Note

Authentication and rate limiting are **not yet implemented**. The bridge is designed for local development only and binds to `localhost` by default. Auth and rate limiting are planned for future work (Phase 2, deferred).
