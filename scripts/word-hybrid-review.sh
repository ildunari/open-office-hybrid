#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/kosta/LocalDev/office-agents-hybrid"
BRIDGE_URL="https://localhost:4018"
OUT_DIR="${ROOT}/tmp/word-hybrid-review"

mkdir -p "${OUT_DIR}"
cd "${ROOT}"

pnpm exec office-bridge --url "${BRIDGE_URL}" list
pnpm exec office-bridge --url "${BRIDGE_URL}" metadata word >"${OUT_DIR}/metadata.json"
pnpm exec office-bridge --url "${BRIDGE_URL}" inspect word >"${OUT_DIR}/inspect.json"
pnpm exec office-bridge --url "${BRIDGE_URL}" screenshot word --pages 1 --out "${OUT_DIR}/page1.png"

echo "Saved hybrid review artifacts to:"
echo "  ${OUT_DIR}/metadata.json"
echo "  ${OUT_DIR}/inspect.json"
echo "  ${OUT_DIR}/page1.png"
