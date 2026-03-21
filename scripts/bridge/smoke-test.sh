#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BRIDGE_URL="${BRIDGE_URL:-https://localhost:4017}"
SESSION=""
OUT_DIR="./smoke-results"
REQUIRE_HYBRID=false
SCENARIO=""
FIXTURE=""

usage() {
  cat <<EOF
Usage: $(basename "$0") [session] [--out-dir DIR] [--bridge-url URL] [--hybrid-word] [--scenario NAME] [--fixture FILE] [--help]
Full integration smoke test for a bridge session.
  --out-dir DIR    Output directory (default: ./smoke-results)
  --bridge-url URL Bridge URL (default: https://localhost:4017)
  --hybrid-word    Require OpenWord Hybrid and use https://localhost:4018 by default
  --scenario NAME  Logical scenario label for artifact grouping
  --fixture FILE   Corpus fixture name associated with this run
  BRIDGE_URL env   Bridge URL (default: https://localhost:4017)
  Exit: 0=all pass, N=failure count, 2=usage error
EOF
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out-dir) OUT_DIR="$2"; shift 2 ;;
    --bridge-url) BRIDGE_URL="$2"; shift 2 ;;
    --hybrid-word) REQUIRE_HYBRID=true; shift ;;
    --scenario) SCENARIO="$2"; shift 2 ;;
    --fixture) FIXTURE="$2"; shift 2 ;;
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

mkdir -p "$OUT_DIR"
if [[ -n "$SCENARIO" ]]; then
  OUT_DIR="${OUT_DIR%/}/${SCENARIO}"
  mkdir -p "$OUT_DIR"
fi
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

capture_json() {
  local name="$1"; shift
  local output_file="$OUT_DIR/${name}.json"
  if OUTPUT=$("$@" --json 2>&1); then
    echo "$OUTPUT" > "$output_file"
    return 0
  fi
  echo "$OUTPUT" > "$OUT_DIR/${name}-error.txt"
  return 1
}

BRIDGE_ARGS=(--url "$BRIDGE_URL")
SESSION_ARGS=("${BRIDGE_ARGS[@]}")
[[ -n "$SESSION" ]] && SESSION_ARGS=("$SESSION" "${BRIDGE_ARGS[@]}")

echo "Smoke test starting (output: $OUT_DIR)"
echo "---"

cat > "$OUT_DIR/run-metadata.json" <<EOF
{
  "bridgeUrl": "$BRIDGE_URL",
  "session": "${SESSION:-}",
  "scenario": "${SCENARIO:-}",
  "fixture": "${FIXTURE:-}",
  "requiresHybrid": $([[ "$REQUIRE_HYBRID" == "true" ]] && echo true || echo false)
}
EOF

echo "[preflight] Bridge health"
if ! curl -sk --max-time 5 "$BRIDGE_URL/health" > "$OUT_DIR/health.json" 2>&1; then
  echo '{"ok":false,"error":"Bridge not reachable"}' > "$OUT_DIR/health-error.txt"
  FAILED=$((FAILED + 1))
fi

# 1. Wait for session
echo "[1/8] Session availability"
WAIT_ARGS=(--bridge-url "$BRIDGE_URL" --timeout 10000)
if [[ -n "$SESSION" ]]; then
  WAIT_ARGS+=("$SESSION")
fi
if [[ "$REQUIRE_HYBRID" == "true" ]]; then
  WAIT_ARGS=(--hybrid-word "${WAIT_ARGS[@]}")
fi
run_check "session-wait" "${SCRIPT_DIR}/wait-and-check.sh" "${WAIT_ARGS[@]}" || true
capture_json "session" pnpm exec office-bridge wait "${SESSION_ARGS[@]}" --timeout 10000 || true

# 2. Summary
echo "[2/8] Session summary"
run_check "summary" pnpm exec office-bridge summary "${SESSION_ARGS[@]}" || true
pnpm exec office-bridge summary "${SESSION_ARGS[@]}" > "$OUT_DIR/summary.txt" 2>/dev/null || true

# 3. State
echo "[3/8] Runtime state"
if run_check "state" pnpm exec office-bridge state "${SESSION_ARGS[@]}"; then
  capture_json "state" pnpm exec office-bridge state "${SESSION_ARGS[@]}" || true
fi

# 4. Diagnostics
echo "[4/8] Diagnostics"
if run_check "diag" pnpm exec office-bridge diag "${SESSION_ARGS[@]}"; then
  pnpm exec office-bridge diag "${SESSION_ARGS[@]}" > "$OUT_DIR/diag.json" 2>/dev/null || true
fi

# 5. Metadata
echo "[5/8] Document metadata"
if run_check "metadata" pnpm exec office-bridge metadata "${SESSION_ARGS[@]}"; then
  capture_json "metadata" pnpm exec office-bridge metadata "${SESSION_ARGS[@]}" || true
fi

# 6. Inspect
echo "[6/8] Session inspect"
if run_check "inspect" pnpm exec office-bridge inspect "${SESSION_ARGS[@]}"; then
  capture_json "inspect" pnpm exec office-bridge inspect "${SESSION_ARGS[@]}" || true
fi

# 7. Events
echo "[7/8] Recent events"
if run_check "events" pnpm exec office-bridge events "${SESSION_ARGS[@]}" --limit 20; then
  EVENTS=$(pnpm exec office-bridge events "${SESSION_ARGS[@]}" --limit 20 --json 2>/dev/null || echo "[]")
  echo "$EVENTS" > "$OUT_DIR/events.json"
  if [[ "$HAS_JQ" == "true" ]]; then
    ERROR_COUNT=$(echo "$EVENTS" | jq '[.[] | select((.event // "") | test("error";"i"))] | length' 2>/dev/null || echo "0")
    if [[ "$ERROR_COUNT" -gt 0 ]]; then
      echo "  WARNING: $ERROR_COUNT error event(s) found"
    fi
  fi
fi

# 8. Screenshot
echo "[8/8] Screenshot capture"
run_check "screenshot" pnpm exec office-bridge screenshot "${SESSION_ARGS[@]}" --out "$OUT_DIR/screenshot.png" || true

echo "---"
TOTAL=$((PASSED + FAILED))
echo "{\"passed\":$PASSED,\"failed\":$FAILED,\"total\":$TOTAL}"

exit "$FAILED"
