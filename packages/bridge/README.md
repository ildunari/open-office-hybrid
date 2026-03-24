# @office-agents/bridge

Local development bridge for Office add-ins.

It lets a running add-in connect back to a local HTTPS/WebSocket server so external tools and CLIs can invoke real Office.js operations inside Excel, PowerPoint, or Word.

## What it does

- keeps a live registry of connected add-in sessions
- exposes session metadata and recent bridge events
- lets you invoke any registered add-in tool remotely
- supports raw Office.js execution through each app's escape-hatch tool
- forwards console messages, window errors, and unhandled promise rejections

## Start the bridge

```bash
pnpm bridge:serve
pnpm bridge:stop
```

Or run the bridge CLI through the root script:

```bash
pnpm bridge -- list
pnpm bridge -- exec word --code "const body = context.document.body; body.load('text'); await context.sync(); return body.text;"
```

Package-local equivalents:

```bash
pnpm --filter @office-agents/bridge start
pnpm --filter @office-agents/bridge run cli -- list
```

The server defaults to:

- HTTPS API: `https://localhost:4017`
- WebSocket: `wss://localhost:4017/ws`

It expects the Office Add-in dev cert files at:

- `~/.office-addin-dev-certs/localhost.crt`
- `~/.office-addin-dev-certs/localhost.key`

Override with:

- `OFFICE_BRIDGE_CERT`
- `OFFICE_BRIDGE_KEY`

## CLI usage

```bash
office-bridge list
office-bridge inspect word
office-bridge metadata excel
office-bridge events word --limit 20
office-bridge exec word --unsafe --code "return { href: window.location.href, title: document.title }"
office-bridge exec word --sandbox --code "const body = context.document.body; body.load('text'); await context.sync(); return body.text;"
office-bridge tool excel screenshot_range --input '{"sheetId":1,"range":"A1:F20"}' --out range.png
office-bridge screenshot word --pages 1 --out page1.png
office-bridge screenshot excel --sheet-id 1 --range A1:F20 --out range.png
office-bridge screenshot powerpoint --slide-index 0 --out slide1.png
office-bridge vfs ls word /home/user
office-bridge vfs pull word /home/user/uploads/report.docx ./report.docx
office-bridge vfs push word ./local.txt /home/user/uploads/local.txt
```

If the bridge is already running, `pnpm bridge:serve` / `office-bridge serve` will report the existing healthy server instead of failing with `EADDRINUSE`.

To stop the bridge from another shell:

```bash
office-bridge stop
# or
pnpm bridge:stop
```

## Exec modes

`office-bridge exec` now uses sandbox mode by default so the CLI routes through the app's existing raw Office.js tool.

Use `--unsafe` only when you explicitly want direct taskpane/runtime evaluation, and `--sandbox` when you want to force the existing raw Office.js tool (`eval_officejs` / `execute_office_js`).

## Auth and origin checks

All non-health bridge endpoints now require either:

- a valid local browser origin (`localhost` / `127.0.0.1`), or
- the bridge auth token via `X-Office-Bridge-Token` for HTTP/SSE or `?token=...` for WebSocket.

The CLI automatically reads the token from `OFFICE_BRIDGE_TOKEN` or the local bridge token file written by the server.

## Screenshot commands

Use `screenshot` for a simpler image-to-file workflow:

```bash
office-bridge screenshot word --pages 1 --out page1.png
office-bridge screenshot excel --sheet-id 1 --range A1:F20 --out range.png
office-bridge screenshot powerpoint --slide-index 0 --out slide1.png
```

The CLI strips image base64 from printed JSON output, so screenshot commands don't flood stdout or model context windows.

You can also save image-returning tool calls directly with `--out`:

```bash
office-bridge tool excel screenshot_range --input '{"sheetId":1,"range":"A1:F20"}' --out range.png
```

## VFS commands

The bridge can move files between the add-in VFS and your local filesystem:

```bash
office-bridge vfs ls word /home/user
office-bridge vfs pull word /home/user/uploads/report.docx ./report.docx
office-bridge vfs push word ./notes.txt /home/user/uploads/notes.txt
office-bridge vfs rm word /home/user/uploads/notes.txt
```

`vfs ls` currently enumerates files via a VFS snapshot in the add-in runtime, so it is meant for development/debugging rather than high-performance file browsing.

## Monitoring & testing commands

Commands for agent-driven testing, state inspection, and debugging:

```bash
office-bridge state word:SESSION_ID                   # Dump runtime state as JSON
office-bridge state word:SESSION_ID --compact         # One-line mode/phase/streaming summary
office-bridge summary word:SESSION_ID                 # One-line status (streaming, plan, tokens, cost)
office-bridge poll word:SESSION_ID --events tool:completed,error:runtime  # Stream events as NDJSON via SSE
office-bridge assert word:SESSION_ID --mode discuss   # Assert runtime state (exit 1 on mismatch)
office-bridge bench word:SESSION_ID get_document_text --runs 10  # Benchmark a tool
office-bridge diag word:SESSION_ID                    # Full diagnostics dump (session + events + state)
office-bridge dom word:SESSION_ID visible-panels      # Run pre-built DOM inspection query
office-bridge reset word:SESSION_ID --keep-config     # Clear storage (preserve API keys)
office-bridge screenshot-diff before.png after.png    # Byte-level image comparison
```

## SSE event streaming

Subscribe to real-time events from a session:

```bash
curl -sk -N "https://localhost:4017/sessions/{id}/events/stream?events=tool:completed,error:runtime"
```

The `poll` CLI command wraps this with automatic SSE-to-polling fallback.

## Shell scripts

Automation scripts in `scripts/bridge/`:

| Script | Purpose |
|--------|---------|
| `wait-and-check.sh` | Wait for a unique session and verify it has tools loaded |
| `smoke-test.sh` | Full integration smoke test (8 numbered checks plus a health preflight) |
| `regression-loop.sh` | Run tool sequence from JSON, compare to baselines |
| `event-monitor.sh` | Long-running event poller with JSONL log output |
| `focus-word-pane.sh` | Use macOS accessibility to click/focus the OpenWord Hybrid side panel |

`focus-word-pane.sh` is a helper only. The main live-testing method remains the
bridge workflow: verify the live session, inspect `summary` / `state` / `diag`,
run tools, capture events, and save screenshots/artifacts. Use the pane-focus
helper only when the taskpane needs to be surfaced or the input needs focus
before running the standard bridge-based checks.

For Hybrid Word work, prefer a split model when UI automation is flaky:
- Use the bridge as the primary live test surface for the agent framework and
  document tools.
- Validate real document behavior through `metadata`, `tool`, `exec`, `state`,
  `summary`, `diag`, `events`, and `screenshot`.
- Treat precise pane UX behavior and visual polish as manual QA unless you
  explicitly need full UI automation.

For Hybrid Word runs on the alternate bridge:

```bash
BRIDGE_URL=https://localhost:4018 scripts/bridge/wait-and-check.sh --hybrid-word --document <document-id>
scripts/bridge/focus-word-pane.sh --target body
scripts/bridge/focus-word-pane.sh --target input
scripts/bridge/smoke-test.sh --hybrid-word --document <document-id> --scenario review-heavy --fixture comments.docx
```

If multiple Word windows are open, do not use bare `word` as a selector except
when intentionally reproducing ambiguity. Use an exact `word:<session-id>`
selector or `--document <document-id>` to route live checks to one document.

See [AGENT-API.md](./AGENT-API.md) for the full machine-readable API reference.

## Browser integration

Apps import `startOfficeBridge()` from `@office-agents/bridge/client` and pass the current `AppAdapter`.

The client auto-enables on `localhost` by default. You can override with:

- query: `?office_bridge=1`
- query URL override: `?office_bridge_url=wss://localhost:4017/ws`
- localStorage: `office-agents-bridge-enabled`
- localStorage URL: `office-agents-bridge-url`
