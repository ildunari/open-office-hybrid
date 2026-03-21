#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BRIDGE_URL="${BRIDGE_URL:-https://localhost:4017}"
SESSION=""
BASELINE_DIR="./baselines"
SEQUENCE_FILE=""
REQUIRE_HYBRID=false
DOCUMENT=""

usage() {
  cat <<EOF
Usage: $(basename "$0") <tool-sequence.json> [session] [--baseline-dir DIR] [--bridge-url URL] [--document ID] [--hybrid-word] [--help]
Run tool calls from a JSON file and compare outputs to baselines.
  tool-sequence.json: [{"tool":"name","args":{},"expectContains":"..."}]
  --baseline-dir DIR  Baseline directory (default: ./baselines)
  --bridge-url URL    Bridge URL (default: https://localhost:4017)
  --document ID       Require a documentId substring match
  --hybrid-word       Require OpenWord Hybrid and use https://localhost:4018 by default
  BRIDGE_URL env      Bridge URL (default: https://localhost:4017)
  Exit: 0=pass, N=failures (max 125), 2=usage error
EOF
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --baseline-dir) BASELINE_DIR="$2"; shift 2 ;;
    --bridge-url) BRIDGE_URL="$2"; shift 2 ;;
    --document) DOCUMENT="$2"; shift 2 ;;
    --hybrid-word) REQUIRE_HYBRID=true; shift ;;
    --help) usage 0 ;;
    --*) echo "Unknown option: $1" >&2; usage 2 ;;
    *)
      if [[ -z "$SEQUENCE_FILE" ]]; then SEQUENCE_FILE="$1"
      elif [[ -z "$SESSION" ]]; then SESSION="$1"
      else echo "Unexpected argument: $1" >&2; usage 2
      fi
      shift ;;
  esac
done

if [[ "$REQUIRE_HYBRID" == "true" && "$BRIDGE_URL" == "https://localhost:4017" ]]; then
  BRIDGE_URL="https://localhost:4018"
fi

[[ -z "$SEQUENCE_FILE" ]] && { echo "Error: tool-sequence.json required" >&2; usage 2; }
command -v jq >/dev/null 2>&1 || { echo "Error: jq is required" >&2; exit 1; }
[[ -f "$SEQUENCE_FILE" ]] || { echo "Error: File not found: $SEQUENCE_FILE" >&2; exit 1; }

mkdir -p "$BASELINE_DIR"

WAIT_ARGS=(--app word --timeout 10000 --bridge-url "$BRIDGE_URL")
if [[ -n "$DOCUMENT" ]]; then
  WAIT_ARGS+=(--document "$DOCUMENT")
fi
if [[ -n "$SESSION" ]]; then
  WAIT_ARGS=("$SESSION" "${WAIT_ARGS[@]}")
fi
if [[ "$REQUIRE_HYBRID" == "true" ]]; then
  WAIT_ARGS=(--hybrid-word "${WAIT_ARGS[@]}")
fi
"${SCRIPT_DIR}/wait-and-check.sh" "${WAIT_ARGS[@]}" >/dev/null

BRIDGE_ARGS=(--url "$BRIDGE_URL")
SESSION_ARGS=("${BRIDGE_ARGS[@]}")
[[ -n "$SESSION" ]] && SESSION_ARGS=("$SESSION" "${BRIDGE_ARGS[@]}")

COUNT=$(jq 'length' "$SEQUENCE_FILE")
PASSED=0; FAILED=0; NEW=0

for ((i=0; i<COUNT; i++)); do
  TOOL=$(jq -r ".[$i].tool" "$SEQUENCE_FILE")
  ARGS=$(jq -c ".[$i].args // {}" "$SEQUENCE_FILE")
  EXPECT=$(jq -r ".[$i].expectContains // empty" "$SEQUENCE_FILE")
  BASELINE_FILE="$BASELINE_DIR/${TOOL}-${i}.json"

  echo -n "  [$((i+1))/$COUNT] $TOOL ... "

  RESULT=$(pnpm exec office-bridge tool "${SESSION_ARGS[@]}" "$TOOL" --input "$ARGS" --json 2>&1) || {
    echo "FAIL (command error)"
    echo "$RESULT" > "$BASELINE_DIR/${TOOL}-${i}-error.txt"
    FAILED=$((FAILED + 1))
    continue
  }

  # Check expectContains
  if [[ -n "$EXPECT" ]]; then
    if ! echo "$RESULT" | grep -q "$EXPECT"; then
      echo "FAIL (missing expected: $EXPECT)"
      FAILED=$((FAILED + 1))
      echo "$RESULT" > "$BASELINE_FILE"
      continue
    fi
  fi

  # Compare to baseline
  if [[ -f "$BASELINE_FILE" ]]; then
    if diff -q <(echo "$RESULT" | jq -S . 2>/dev/null || echo "$RESULT") \
               <(jq -S . "$BASELINE_FILE" 2>/dev/null || cat "$BASELINE_FILE") >/dev/null 2>&1; then
      echo "OK (matches baseline)"
      PASSED=$((PASSED + 1))
    else
      echo "DIFF (output changed from baseline)"
      FAILED=$((FAILED + 1))
      echo "$RESULT" > "${BASELINE_FILE}.new"
    fi
  else
    echo "NEW (baseline saved)"
    echo "$RESULT" > "$BASELINE_FILE"
    NEW=$((NEW + 1))
  fi
done

echo "---"
echo "{\"passed\":$PASSED,\"failed\":$FAILED,\"new\":$NEW,\"total\":$COUNT}"

EXITCODE=$((FAILED > 125 ? 125 : FAILED))
exit "$EXITCODE"
