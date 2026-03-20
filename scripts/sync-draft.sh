#!/bin/bash
# Safely propagate code/config changes from main → draft
# WITHOUT touching content/ (which belongs to the CMS)
set -e

echo "[sync-draft] fetching latest..."
git fetch origin

echo "[sync-draft] switching to draft..."
git checkout draft
git pull origin draft

echo "[sync-draft] copying code files from main (not content/)..."
git checkout origin/main -- \
  admin/ \
  src/ \
  assets/css/ \
  assets/js/ \
  build.js \
  package.json \
  package-lock.json \
  scripts/ \
  .github/ \
  netlify.toml \
  favicon.svg \
  README.md \
  CLAUDE.md \
  2>/dev/null || true

echo "[sync-draft] committing..."
git add -A
git diff --cached --quiet && echo "[sync-draft] nothing to commit" && git checkout main && exit 0
git commit -m "sync: update code/config from main"

echo "[sync-draft] pushing draft..."
git push origin draft

echo "[sync-draft] switching back to main..."
git checkout main

echo "[sync-draft] done — content/ was never touched"
