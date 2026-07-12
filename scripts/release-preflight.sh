#!/usr/bin/env bash
set -euo pipefail

echo "[release-preflight] Running lint"
npm run lint

echo "[release-preflight] Running typecheck"
npm run typecheck

echo "[release-preflight] Running unit tests"
npm test

echo "[release-preflight] Running production build"
npm run build

echo "[release-preflight] Running e2e smoke tests"
npm run test:e2e

echo "[release-preflight] All checks passed"
