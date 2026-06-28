#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# TalentIQ — Android APK Build Script (EAS)
# Run this AFTER: eas login (Expo username: plalitkr)
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "==> Logging into EAS..."
echo "    (Will prompt for Expo password once)"
eas login --username plalitkr

echo ""
echo "==> Initializing EAS project (gets project ID)..."
cd "$(dirname "$0")/../mobile"
eas init --id auto --force 2>/dev/null || true

echo ""
echo "==> Building Android APK (preview profile)..."
echo "    This uploads to EAS cloud servers (~10-15 min)"
eas build --platform android --profile preview --non-interactive

echo ""
echo "==> Build queued! Monitor at: https://expo.dev/accounts/plalitkr/projects/talentiq/builds"
echo ""
echo "==> When done, download the .apk and run:"
echo "    bash scripts/release-apk.sh /path/to/talentiq.apk"
