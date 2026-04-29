#!/usr/bin/env bash
# build-react-ch5z.sh — package the React app into a Crestron .ch5z archive
#
# Stages the Vite production build into the same folder layout `ch5-cli`
# expects (Shell/), drops the contract + libraries + manifest in next to
# it, then zips the lot into dist/prod/office-react.ch5z.
#
# Usage:
#   deploy/build-react-ch5z.sh             # mock-mode build (for screenshots)
#   deploy/build-react-ch5z.sh --live      # real CIP, talks to the CP3
#
# After this produces office-react.ch5z, deploy with:
#   npx ch5-cli deploy -p \
#     -H 192.168.50.105 -t touchscreen \
#     dist/prod/office-react.ch5z
# (Or run from a real TTY: `npm run build:deploywithpassword` works
#  if you point it at the new .ch5z by editing package.json.)

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$REPO/web"
STAGE="$REPO/dist/prod/react-stage"
SHELL_DIR="$STAGE/Shell"
OUT="$REPO/dist/prod/office-react.ch5z"

LIVE=""
if [[ "${1:-}" == "--live" ]]; then
  LIVE="VITE_CIP_MODE=live"
  echo "[build] LIVE mode: will use real CrComLib at runtime"
else
  echo "[build] MOCK mode: dev/screenshot bundle"
fi

# 1. Build the React app
cd "$WEB"
if [[ -n "$LIVE" ]]; then
  VITE_CIP_MODE=live npx vite build
else
  npx vite build
fi
cd "$REPO"

# 2. Stage in CH5-archive layout
rm -rf "$STAGE"
mkdir -p "$SHELL_DIR/assets" "$SHELL_DIR/config" "$SHELL_DIR/libraries"

# React bundle becomes the panel's index.html + assets
cp -r "$WEB/dist/index.html" "$SHELL_DIR/"
cp -r "$WEB/dist/assets" "$SHELL_DIR/"
cp -r "$WEB/public/img" "$SHELL_DIR/"   # icons + wallpaper (referenced as ./img/...)

# Crestron contract — same as the CH5 build uses
cp "$REPO/config/contract.cse2j" "$SHELL_DIR/config/contract.cse2j"

# CH5 runtime libraries (cr-com-lib + webxpanel) — copied from node_modules
# so the panel has them available when the React app loads them
if [[ -f "$WEB/node_modules/@crestron/ch5-crcomlib/build_bundles/umd/cr-com-lib.js" ]]; then
  cp "$WEB/node_modules/@crestron/ch5-crcomlib/build_bundles/umd/cr-com-lib.js" \
     "$SHELL_DIR/libraries/cr-com-lib.js"
fi

# Project manifest the panel firmware expects
cat > "$SHELL_DIR/_manifest.json" <<'JSON'
{
  "projectname": "Office.ch5",
  "samplesource": "Shell",
  "version": "1.0.0"
}
JSON

# 3. Zip the staged folder into a .ch5z (same format ch5-cli produces)
cd "$STAGE"
rm -f "$OUT"
# Inner .ch5 is what the panel extracts; outer wrapper .ch5z holds the manifest
cd "$SHELL_DIR"
zip -qr "$STAGE/Office.ch5" .
cd "$STAGE"
zip -qr "$OUT" Office.ch5 Shell/_manifest.json

echo
echo "✅ Built: $OUT ($(du -h "$OUT" | cut -f1))"
echo
echo "Deploy:"
echo "  npx ch5-cli deploy -p -H 192.168.50.105 -t touchscreen \\"
echo "    \"$OUT\""
