#!/usr/bin/env bash
# Render build script — installs dev types and builds the worker.
# Use as Build Command: bash scripts/render-build.sh
set -euo pipefail
npm ci --include=dev
npm run build:render
