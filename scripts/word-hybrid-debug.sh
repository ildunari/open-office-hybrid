#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/kosta/LocalDev/office-agents-hybrid"
WEF_DIR="${HOME}/Library/Containers/com.microsoft.Word/Data/Documents/wef"
HYBRID_MANIFEST_ID="7b3a3c5d-0e6a-48a5-8657-6d2fb49f07e1"
HYBRID_MANIFEST_SRC="${ROOT}/packages/word/manifest.xml"
HYBRID_MANIFEST_DST="${WEF_DIR}/${HYBRID_MANIFEST_ID}.manifest.xml"
HYBRID_DEV_URL="https://localhost:3003"
HYBRID_BRIDGE_URL="https://localhost:4018"
HYBRID_BRIDGE_WS="wss://localhost:4018/ws"
BRIDGE_LOG="/tmp/openword-hybrid-bridge.log"
DEV_LOG="/tmp/openword-hybrid-dev.log"

mkdir -p "${WEF_DIR}"
cp "${HYBRID_MANIFEST_SRC}" "${HYBRID_MANIFEST_DST}"

cd "${ROOT}"

if ! lsof -ti tcp:4018 >/dev/null 2>&1; then
  nohup pnpm bridge:serve:hybrid >"${BRIDGE_LOG}" 2>&1 &
  sleep 3
fi

if ! lsof -ti tcp:3003 >/dev/null 2>&1; then
  nohup pnpm dev-server:word >"${DEV_LOG}" 2>&1 &
  sleep 5
fi

python3 - <<'PY'
import ssl, urllib.request, sys
ctx = ssl._create_unverified_context()
for url in ["https://localhost:3003/taskpane.html", "https://localhost:4018/health"]:
    try:
        with urllib.request.urlopen(url, context=ctx, timeout=8) as r:
            print(f"[ok] {url} -> {r.status}")
    except Exception as exc:
        print(f"[fail] {url} -> {exc}")
        sys.exit(1)
PY

open -a "Microsoft Word"

echo
echo "Hybrid add-in is installed at:"
echo "  ${HYBRID_MANIFEST_DST}"
echo
echo "Hybrid dev server:"
echo "  ${HYBRID_DEV_URL}"
echo "Hybrid bridge:"
echo "  ${HYBRID_BRIDGE_URL}"
echo "  ${HYBRID_BRIDGE_WS}"
echo
echo "Waiting up to 30s for a live Word session on the hybrid bridge..."

for _ in $(seq 1 30); do
  if pnpm exec office-bridge --url "${HYBRID_BRIDGE_URL}" list 2>/dev/null | grep -q "word:"; then
    echo "[ok] Word connected to the hybrid bridge."
    echo
    pnpm exec office-bridge --url "${HYBRID_BRIDGE_URL}" list
    exit 0
  fi
  sleep 1
done

echo "[warn] No Word session connected to the hybrid bridge yet."
echo "Open the 'OpenWord Hybrid' add-in inside Word, then run:"
echo "  pnpm exec office-bridge --url ${HYBRID_BRIDGE_URL} list"
