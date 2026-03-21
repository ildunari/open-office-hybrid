#!/usr/bin/env bash
set -euo pipefail

BRIDGE_URL="${BRIDGE_URL:-https://localhost:4017}"
SESSION=""
OUT_DIR="./smoke-results"

usage() {
  cat <<EOF
Usage: $(basename "$0") [session] [--out-dir DIR] [--help]
Full integration smoke test for a bridge session.
  --out-dir DIR    Output directory (default: ./smoke-results)
  BRIDGE_URL env   Bridge URL (default: https://localhost:4017)
  Exit: 0=all pass, N=failure count, 2=usage error
EOF
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out-dir) OUT_DIR="$2"; shift 2 ;;
    --help) usage 0 ;;
    --*) echo "Unknown option: $1" >&2; usage 2 ;;
    *) SESSION="$1"; shift ;;
  esac
done

HAS_JQ=true
command -v jq >/dev/null 2>&1 || HAS_JQ=false

mkdir -p "$OUT_DIR"
PASSED=0
FAILED=0

run_check() {
  local name="$1"; shift
  echo -n "  $name ... "
  if OUTPUT=$("$@" 2>&1); then
    echo "OK"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo "FAIL"
    echo "$OUTPUT" > "$OUT_DIR/${name}-error.txt"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

BRIDGE_ARGS=(--url "$BRIDGE_URL")
SESSION_ARGS=("${BRIDGE_ARGS[@]}")
[[ -n "$SESSION" ]] && SESSION_ARGS=("$SESSION" "${BRIDGE_ARGS[@]}")

echo "Smoke test starting (output: $OUT_DIR)"
echo "---"

# 1. Wait for session
echo "[1/5] Session availability"
run_check "session-wait" pnpm exec office-bridge wait "${SESSION_ARGS[@]}" --timeout 10000 --json || true

# 2. Screenshot
echo "[2/5] Screenshot capture"
run_check "screenshot" pnpm exec office-bridge screenshot "${SESSION_ARGS[@]}" --out "$OUT_DIR/screenshot.png" || true

# 3. Metadata
echo "[3/5] Document metadata"
if run_check "metadata" pnpm exec office-bridge metadata "${SESSION_ARGS[@]}"; then
  pnpm exec office-bridge metadata "${SESSION_ARGS[@]}" > "$OUT_DIR/metadata.json" 2>/dev/null || true
fi

# 4. Inspect
echo "[4/5] Session inspect"
if run_check "inspect" pnpm exec office-bridge inspect "${SESSION_ARGS[@]}"; then
  pnpm exec office-bridge inspect "${SESSION_ARGS[@]}" > "$OUT_DIR/inspect.json" 2>/dev/null || true
fi

# 5. Events
echo "[5/5] Recent events"
if run_check "events" pnpm exec office-bridge events "${SESSION_ARGS[@]}" --limit 20; then
  EVENTS=$(pnpm exec office-bridge events "${SESSION_ARGS[@]}" --limit 20 2>/dev/null || echo "[]")
  echo "$EVENTS" > "$OUT_DIR/events.json"
  if [[ "$HAS_JQ" == "true" ]]; then
    ERROR_COUNT=$(echo "$EVENTS" | jq '[.[] | select(.type | test("error";"i"))] | length' 2>/dev/null || echo "0")
    if [[ "$ERROR_COUNT" -gt 0 ]]; then
      echo "  WARNING: $ERROR_COUNT error event(s) found"
    fi
  fi
fi

echo "---"
TOTAL=$((PASSED + FAILED))
echo "{\"passed\":$PASSED,\"failed\":$FAILED,\"total\":$TOTAL}"

exit "$FAILED"
