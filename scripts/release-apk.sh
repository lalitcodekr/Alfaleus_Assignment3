#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# TalentIQ — GitHub Release + APK Upload Script
# Usage: bash scripts/release-apk.sh /path/to/talentiq.apk
# Requires: gh CLI (brew install gh && gh auth login)
# ─────────────────────────────────────────────────────────────────────────────
set -e

APK_PATH="$1"
REPO="lalitcodekr/Alfaleus_Assignment3"
TAG="v1.0.0"

if [ -z "$APK_PATH" ]; then
  echo "Usage: bash scripts/release-apk.sh /path/to/talentiq.apk"
  exit 1
fi

if [ ! -f "$APK_PATH" ]; then
  echo "Error: APK file not found at $APK_PATH"
  exit 1
fi

echo "==> Checking gh CLI..."
if ! command -v gh &>/dev/null; then
  echo "Installing GitHub CLI..."
  brew install gh
fi

echo "==> Creating GitHub Release $TAG and uploading APK..."
gh release create "$TAG" "$APK_PATH#talentiq.apk" \
  --repo "$REPO" \
  --title "TalentIQ v1.0.0 — Android APK" \
  --notes "## TalentIQ Android App

### Download
Download and install \`talentiq.apk\` directly on your Android device.

> Enable **Install from Unknown Sources** in Android Settings → Security before installing.

### What's included
- Token-based interview flow
- Camera/microphone recording (4 questions)
- Chunked video upload to Cloudflare R2
- AI-generated scorecard via faster-whisper + Claude 3.5 Sonnet

### Minimum Requirements
- Android 8.0+ (API 26)
- Camera + microphone access" \
  --latest

echo ""
echo "✅ Release created at: https://github.com/$REPO/releases/tag/$TAG"
echo ""
echo "==> APK download URL (update in README.md):"
echo "    https://github.com/$REPO/releases/latest/download/talentiq.apk"
