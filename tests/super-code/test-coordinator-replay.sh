#!/usr/bin/env bash
# Runs the super-code coordinator replay harness (see replay-harness.mjs).
# The harness extracts the canonical script from skills/super-code/coordinator-workflow.md,
# stubs the Workflow runtime hooks, replays the doc's three recorded dryRun scenarios, and
# drives the null-injection and stall-guard scenarios no dryRun can express.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "SKIP: node not available" >&2
  exit 0
fi

exec node "$SCRIPT_DIR/replay-harness.mjs"
