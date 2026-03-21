#!/usr/bin/env bash
set -euo pipefail

BRIDGE_URL="${BRIDGE_URL:-https://localhost:4017}"
SESSION=""
FILTER=""
LOG_FILE="events.jsonl"
DURATION=0
POLL_INTERVAL=2

usage() {
  cat <<EOF
Usage: $(basename "$0") [session] [--filter TYPES] [--log-file PATH] [--duration SEC] [--help]
Monitor bridge events with filtering. Polls and appends to a JSONL log file.
  --filter TYPES     Comma-separated event type substrings (e.g. "error,tool")
  --log-file PATH    Output file (default: events.jsonl)
  --duration SEC     Stop after N seconds (default: 0 = run until killed)
  BRIDGE_URL env     Bridge URL (default: https://localhost:4017)
EOF
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --filter) FILTER="$2"; shift 2 ;;
    --log-file) LOG_FILE="$2"; shift 2 ;;
    --duration) DURATION="$2"; shift 2 ;;
    --help) usage 0 ;;
    --*) echo "Unknown option: $1" >&2; usage 2 ;;
    *) SESSION="$1"; shift ;;
  esac
done

HAS_JQ=true
command -v jq >/dev/null 2>&1 || HAS_JQ=false

BRIDGE_ARGS=(--url "$BRIDGE_URL")
SESSION_ARGS=("${BRIDGE_ARGS[@]}")
[[ -n "$SESSION" ]] && SESSION_ARGS=("$SESSION" "${BRIDGE_ARGS[@]}")

TOTAL_EVENTS=0; ITERATION=0; LAST_SEEN=""
START_TIME=$(date +%s)

print_summary() {
  echo ""
  echo "{\"totalEvents\":$TOTAL_EVENTS,\"logFile\":\"$LOG_FILE\",\"iterations\":$ITERATION}"
  [[ "$HAS_JQ" == "true" && -f "$LOG_FILE" && "$TOTAL_EVENTS" -gt 0 ]] && \
    jq -r '.event // "unknown"' "$LOG_FILE" | sort | uniq -c | sort -rn
}

trap 'print_summary; exit 0' INT TERM

IFS=',' read -ra FILTER_PARTS <<< "$FILTER"

matches_filter() {
  local event_type="$1"
  if [[ -z "$FILTER" ]]; then return 0; fi
  for part in "${FILTER_PARTS[@]}"; do
    if [[ "$event_type" == *"$part"* ]]; then return 0; fi
  done
  return 1
}

echo "Monitoring events (log: $LOG_FILE, filter: ${FILTER:-none}, duration: ${DURATION}s)"

while true; do
  ITERATION=$((ITERATION + 1))

  if [[ "$DURATION" -gt 0 ]] && (( $(date +%s) - START_TIME >= DURATION )); then
    echo "Duration reached (${DURATION}s)."; break
  fi

  EVENTS=$(pnpm exec office-bridge events "${SESSION_ARGS[@]}" --limit 50 2>/dev/null || echo "[]")

  if [[ "$HAS_JQ" == "true" ]]; then
    EVENT_COUNT=$(echo "$EVENTS" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo "0")
    BATCH_LAST_SEEN=""
    for ((j=0; j<EVENT_COUNT; j++)); do
      EVENT=$(echo "$EVENTS" | jq -c ".[$j]" 2>/dev/null)
      EVENT_ID=$(echo "$EVENT" | jq -r '.id // .timestamp // empty' 2>/dev/null || echo "")
      if [[ -n "$EVENT_ID" ]]; then
        BATCH_LAST_SEEN="$EVENT_ID"
      fi
      if [[ -n "$LAST_SEEN" && "$EVENT_ID" == "$LAST_SEEN" ]]; then continue; fi
      EVENT_TYPE=$(echo "$EVENT" | jq -r '.event // "unknown"' 2>/dev/null || echo "unknown")
      if matches_filter "$EVENT_TYPE"; then
        echo "$EVENT" >> "$LOG_FILE"
        TOTAL_EVENTS=$((TOTAL_EVENTS + 1))
      fi
    done
    if [[ -n "$BATCH_LAST_SEEN" ]]; then
      LAST_SEEN="$BATCH_LAST_SEEN"
    fi
  else
    echo "$EVENTS" >> "$LOG_FILE"
  fi

  [[ $((ITERATION % 10)) -eq 0 ]] && echo "[iter $ITERATION] $TOTAL_EVENTS events logged"
  sleep "$POLL_INTERVAL"
done

print_summary
exit 0
