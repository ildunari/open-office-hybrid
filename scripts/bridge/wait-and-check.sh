#!/usr/bin/env bash
set -euo pipefail

BRIDGE_URL="${BRIDGE_URL:-https://localhost:4017}"
APP="word"
TIMEOUT="30000"

usage() {
  cat <<EOF
Usage: $(basename "$0") [--app APP] [--timeout MS] [--help]

Wait for a bridge session and run basic health assertions.

Options:
  --app APP        App to wait for (default: word)
  --timeout MS     Max wait time in milliseconds (default: 30000)
  --help           Show this help

Environment:
  BRIDGE_URL       Bridge server URL (default: https://localhost:4017)

Exit codes:
  0  Bridge healthy and session connected with tools
  1  Bridge unreachable or session unhealthy
  2  Usage error
EOF
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app) APP="$2"; shift 2 ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --help) usage 0 ;;
    *) echo "Unknown option: $1" >&2; usage 2 ;;
  esac
done

HAS_JQ=true
command -v jq >/dev/null 2>&1 || HAS_JQ=false

echo "Checking bridge health at $BRIDGE_URL ..."
if ! curl -sk --max-time 5 "$BRIDGE_URL/health" >/dev/null 2>&1; then
  echo '{"ok":false,"error":"Bridge not reachable at '"$BRIDGE_URL"'"}' >&2
  exit 1
fi
echo "Bridge is running."

echo "Waiting for $APP session (timeout: ${TIMEOUT}ms) ..."
SESSION_JSON=$(pnpm exec office-bridge wait --app "$APP" --timeout "$TIMEOUT" --json --url "$BRIDGE_URL" 2>&1) || {
  echo '{"ok":false,"error":"Timed out waiting for session"}' >&2
  exit 1
}

echo "$SESSION_JSON"

if [[ "$HAS_JQ" == "true" ]]; then
  TOOL_COUNT=$(echo "$SESSION_JSON" | jq '.snapshot.tools | length // 0' 2>/dev/null || echo "0")
else
  TOOL_COUNT=$(echo "$SESSION_JSON" | grep -o '"tools":\[' | wc -l | tr -d ' ')
fi

if [[ "$TOOL_COUNT" -lt 1 ]]; then
  echo '{"ok":false,"error":"Session has no tools loaded"}' >&2
  exit 1
fi

echo "Session healthy: $TOOL_COUNT tool(s) loaded."
exit 0
