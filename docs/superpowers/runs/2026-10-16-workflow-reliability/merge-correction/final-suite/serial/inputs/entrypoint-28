#!/usr/bin/env bash
# Prompt-text check: super-code / super-auto fix rounds and re-reviews are fresh agents, and
# improvised dispatches are bounded. Pins phrases in codex-tools.md, coordinator-subagents.md and
# coordinator-workflow.md.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_has() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing: $2"; fi; }
assert_lacks() { if printf '%s\n' "$1" | grep -qF -- "$2"; then fail "$3"; echo "    unexpected: $2"; else pass "$3"; fi; }
# Joins wrapped lines so a phrase may span a line break.
flat() { tr '\n' ' ' < "$1" | tr -s ' '; }

CODEX=$(flat "$REPO_ROOT/skills/using-superpowers/references/codex-tools.md")
SUBS=$(flat "$REPO_ROOT/skills/super-code/coordinator-subagents.md")
WF=$(flat "$REPO_ROOT/skills/super-code/coordinator-workflow.md")

echo "fresh-rounds: codex-tools.md"
assert_lacks "$CODEX" 'resume the implementer with `followup_task` — it' "no resume-the-implementer instruction"
assert_lacks "$CODEX" 'Never dispatch a fresh implementer' "no ban on fresh implementers"
assert_has "$CODEX" '**Fix rounds (super-code and super-auto):**' "super-code/super-auto fix-rounds bullet"
assert_has "$CODEX" 'fork_turns: "none"' "fresh spawn"
assert_has "$CODEX" 'fix rounds 1–3' "SDD resumes rounds 1-3"
assert_has "$CODEX" 'fresh one from round 4' "SDD fresh from round 4"

echo "fresh-rounds: coordinator-subagents.md"
assert_has "$SUBS" 'One fresh agent per round' "fresh agent per round"
assert_has "$SUBS" 'is a new round' "steering that adds work is a new round"
assert_has "$SUBS" 'one fresh agent, one job' "bounded improvised brief"
assert_has "$SUBS" 'dispatch-text assemble --consumer history|assess' "assembler route"
assert_has "$SUBS" 'assembler: unavailable —' "assembler fallback ledger line"

echo "fresh-rounds: coordinator-workflow.md"
assert_has "$WF" '**Improvised dispatches.**' "improvised-dispatch rule"
assert_has "$WF" 'one fresh agent, one job' "rule states the bound"

if [ "$FAILURES" -ne 0 ]; then echo "test-prompt-text-fresh-rounds: $FAILURES failure(s)"; exit 1; fi
echo "test-prompt-text-fresh-rounds: all tests passed"
