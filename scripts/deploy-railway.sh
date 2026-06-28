#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# TalentIQ — Railway Deployment Script
# Run this AFTER: railway login && railway link (project ID: 43739b04-3ebd-49f8-a71d-cfd1e7abd334)
# Secrets are loaded from .env — never committed to git
# ─────────────────────────────────────────────────────────────────────────────
set -e

# Load secrets from .env
source "$(dirname "$0")/../.env"

PROJECT_ID="43739b04-3ebd-49f8-a71d-cfd1e7abd334"

echo "==> Linking Railway project $PROJECT_ID"
railway link --project "$PROJECT_ID" --environment production

echo ""
echo "==> Setting environment variables on Railway..."

railway variables set \
  "DATABASE_URL=$DATABASE_URL" \
  "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" \
  "RESEND_API_KEY=$RESEND_API_KEY" \
  "BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET" \
  "JWT_SECRET=$JWT_SECRET" \
  "NODE_ENV=production" \
  "PORT=3001"

railway variables set \
  "R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID" \
  "R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY" \
  "R2_ACCOUNT_ID=$R2_ACCOUNT_ID" \
  "R2_BUCKET_NAME=$R2_BUCKET_NAME" \
  "R2_ENDPOINT=$R2_ENDPOINT"

railway variables set \
  "SCRAPER_WORKER_URL=$SCRAPER_WORKER_URL" \
  "JD_ANALYSIS_WORKER_URL=$JD_ANALYSIS_WORKER_URL" \
  "SCORER_WORKER_URL=$SCORER_WORKER_URL" \
  "TRANSCRIBER_WORKER_URL=$TRANSCRIBER_WORKER_URL"

echo ""
echo "==> Deployment triggered!"
echo "    Check status at: https://railway.app/project/$PROJECT_ID"
