#!/usr/bin/env bash
# Builds dist/unscroll/ (load unpacked) and dist/unscroll-<version>.zip (Chrome Web Store upload).
set -euo pipefail
cd "$(dirname "$0")/.."

FILES=(manifest.json background.js shared.js style.css blocked.html blocked.js popup.html popup.js icons)
VERSION=$(node -p "require('./manifest.json').version")

rm -rf dist && mkdir -p dist/unscroll
cp -r "${FILES[@]}" dist/unscroll/
(cd dist/unscroll && zip -qr "../unscroll-$VERSION.zip" .)

echo "dist/unscroll/            -> chrome://extensions > Load unpacked"
echo "dist/unscroll-$VERSION.zip"
