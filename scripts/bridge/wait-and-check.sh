#!/usr/bin/env bash
set -euo pipefail

BRIDGE_URL="${BRIDGE_URL:-https://localhost:4017}"
APP="word"
TIMEOUT="30000"
SESSION=""
DOCUMENT=""
REQUIRE_HYBRID=false

usage() {
  cat <<EOF
Usage: $(basename "$0") [session] [--app APP] [--document DOCUMENT] [--timeout MS] [--bridge-url URL] [--hybrid-word] [--help]

Wait for a bridge session and run basic health assertions.

Options:
  --app APP        App to wait for (default: word)
  --document ID    Require a documentId substring match
  --timeout MS     Max wait time in milliseconds (default: 30000)
  --bridge-url URL Bridge server URL (default: https://localhost:4017)
  --hybrid-word    Require the OpenWord Hybrid add-in and use https://localhost:4018 by default
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
    --bridge-url) BRIDGE_URL="$2"; shift 2 ;;
    --app) APP="$2"; shift 2 ;;
    --document) DOCUMENT="$2"; shift 2 ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --hybrid-word) REQUIRE_HYBRID=true; BRIDGE_URL="${BRIDGE_URL:-https://localhost:4018}"; shift ;;
    --help) usage 0 ;;
    --*) echo "Unknown option: $1" >&2; usage 2 ;;
    *) SESSION="$1"; shift ;;
  esac
done

if [[ "$REQUIRE_HYBRID" == "true" && "$BRIDGE_URL" == "https://localhost:4017" ]]; then
  BRIDGE_URL="https://localhost:4018"
fi

HAS_JQ=true
command -v jq >/dev/null 2>&1 || HAS_JQ=false

echo "Checking bridge health at $BRIDGE_URL ..."
if ! curl -sk --max-time 5 "$BRIDGE_URL/health" >/dev/null 2>&1; then
  echo '{"ok":false,"error":"Bridge not reachable at '"$BRIDGE_URL"'"}' >&2
  exit 1
fi
echo "Bridge is running."

echo "Waiting for $APP session (timeout: ${TIMEOUT}ms) ..."
WAIT_ARGS=(pnpm exec office-bridge wait --app "$APP" --timeout "$TIMEOUT" --json --url "$BRIDGE_URL")
if [[ -n "$DOCUMENT" ]]; then
  WAIT_ARGS+=(--document "$DOCUMENT")
fi
if [[ -n "$SESSION" ]]; then
  WAIT_ARGS+=("$SESSION")
fi
SESSION_JSON=$("${WAIT_ARGS[@]}" 2>&1) || {
  echo '{"ok":false,"error":"Timed out waiting for session"}' >&2
  exit 1
}

echo "$SESSION_JSON"

if [[ "$HAS_JQ" == "true" ]]; then
  TOOL_COUNT=$(echo "$SESSION_JSON" | jq '.snapshot.tools | length // 0' 2>/dev/null || echo "0")
  RESOLVED_SESSION_ID=$(echo "$SESSION_JSON" | jq -r '.snapshot.sessionId // empty' 2>/dev/null || echo "")
  RESOLVED_DOCUMENT_ID=$(echo "$SESSION_JSON" | jq -r '.snapshot.documentId // empty' 2>/dev/null || echo "")
else
  TOOL_COUNT=$(echo "$SESSION_JSON" | grep -o '"tools":\[' | wc -l | tr -d ' ')
  RESOLVED_SESSION_ID=""
  RESOLVED_DOCUMENT_ID=""
fi

if [[ "$TOOL_COUNT" -lt 1 ]]; then
  echo '{"ok":false,"error":"Session has no tools loaded"}' >&2
  exit 1
fi

if [[ "$REQUIRE_HYBRID" == "true" ]]; then
  if [[ "$HAS_JQ" == "true" ]]; then
    APP_NAME=$(echo "$SESSION_JSON" | jq -r '.snapshot.appName // empty' 2>/dev/null || echo "")
    HOST_HREF=$(echo "$SESSION_JSON" | jq -r '.snapshot.host.href // empty' 2>/dev/null || echo "")
  else
    APP_NAME=""
    HOST_HREF=""
  fi
  if [[ "$APP_NAME" != "OpenWord Hybrid" || "$HOST_HREF" != *"3003"* ]]; then
    echo '{"ok":false,"error":"Session is not the OpenWord Hybrid add-in on port 3003"}' >&2
    exit 1
  fi
fi

echo "Session healthy: $TOOL_COUNT tool(s) loaded."
if [[ -n "$RESOLVED_SESSION_ID" ]]; then
  echo "Resolved session: $RESOLVED_SESSION_ID"
fi
if [[ -n "$RESOLVED_DOCUMENT_ID" ]]; then
  echo "Resolved document: $RESOLVED_DOCUMENT_ID"
fi
exit 0
