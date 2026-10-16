#!/usr/bin/env bash
# Tests for skills/super-code/scripts/context-preflight: the Context: line per harness, the --json
# windows, env relocations, warnings, and that the script exits 0 and writes nothing.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
P="$REPO_ROOT/skills/super-code/scripts/context-preflight"
FX="$SCRIPT_DIR/fixtures/context-preflight"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_has() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing: $2"; echo "    in:      $1"; fi; }
assert_lacks() { if printf '%s\n' "$1" | grep -qF -- "$2"; then fail "$3"; echo "    unexpected: $2"; else pass "$3"; fi; }

mkdir -p "$T/home" "$T/empty"
# run <env assignments…> -- <script args…>; sets out, code, err
run() {
  local envs=()
  while [ "$1" != "--" ]; do envs+=("$1"); shift; done
  shift
  set +e
  out=$(cd "$T/empty" && env -i HOME="$T/home" PATH="$PATH" ${envs[@]+"${envs[@]}"} bash "$P" "$@" 2>"$T/err")
  code=$?
  set -e
  err=$(cat "$T/err")
}
expect_clean() { assert_eq "$code" 0 "$1: exits 0"; assert_eq "$err" "" "$1: no stderr"; }

touch "$T/stamp"; sleep 1

echo "context-preflight: codex"
run CODEX_HOME="$FX/codex-ok" -- --harness codex
expect_clean "codex-ok"
assert_eq "$out" "Context: codex · planner=475K/auto · implementer=475K/auto · reviewer=475K/auto · finalReview=475K/auto · assembler=475K/auto" "codex-ok line"
run CODEX_HOME="$FX/codex-ok" -- --harness codex --json
assert_eq "$out" '{"planner":475000,"implementer":475000,"reviewer":475000,"finalReview":475000,"assembler":475000}' "codex-ok --json"

mkdir -p "$T/low"; cp "$FX/codex-lowlimit/config.toml" "$FX/codex-ok/models_cache.json" "$T/low/"
run CODEX_HOME="$T/low" -- --harness codex
expect_clean "codex-lowlimit"
assert_has "$out" "planner=475K/100K" "low limit shown as the compact point"
assert_has "$out" "warn: model_auto_compact_token_limit 100000 below 50% of 475K → " "low limit warning"
assert_lacks "$out" "multi-agent" "cache's multi_agent_version enables multi-agent"

mkdir -p "$T/nomulti"; cp "$FX/codex-nomulti/config.toml" "$FX/codex-ok/models_cache.json" "$T/nomulti/"
run CODEX_HOME="$T/nomulti" -- --harness codex
assert_has "$out" "warn: Codex multi-agent disabled → set multi_agent = true under [features] in config.toml" "multi_agent=false warns"

run CODEX_HOME="$T/nope" -- --harness codex
expect_clean "codex unreadable"
assert_eq "$out" "Context: unknown — cannot read $T/nope/config.toml" "unreadable config.toml"
run CODEX_HOME="$T/nope" -- --harness codex --json
assert_eq "$out" "{}" "unreadable --json"

mkdir -p "$T/nojq"
for t in awk sed head tr; do ln -s "$(command -v $t)" "$T/nojq/$t"; done
out=$(cd "$T/empty" && env -i HOME="$T/home" PATH="$T/nojq" CODEX_HOME="$FX/codex-ok" "$(command -v bash)" "$P" --harness codex 2>/dev/null)
assert_has "$out" "planner=unknown · implementer=unknown" "no jq: window unknown, not defaulted"
out=$(cd "$T/empty" && env -i HOME="$T/home" PATH="$T/nojq" CODEX_HOME="$FX/codex-ok" "$(command -v bash)" "$P" --harness codex --json 2>/dev/null)
assert_eq "$out" "{}" "no jq: --json is {}"

mkdir -p "$T/home/.codex"; cp "$FX/codex-ok/"* "$T/home/.codex/"
run CODEX_THREAD_ID=abc -- 
assert_has "$out" "Context: codex · planner=475K/auto" "CODEX_THREAD_ID selects codex; default home is \$HOME/.codex"

echo "context-preflight: claude"
BASE="Context: claude · planner=1M/967K · implementer=200K/167K · reviewer=200K/167K · finalReview=1M/967K · assembler=200K/167K"
run CLAUDE_CONFIG_DIR="$FX/claude-1m" -- --harness claude
expect_clean "claude-1m"
assert_has "$out" "$BASE" "claude-1m windows"
assert_has "$out" "warn: implementer, reviewer, assembler on a 200K model → set ANTHROPIC_DEFAULT_SONNET_MODEL=<model>[1m]" "one grouped 200K warning"
assert_eq "$(printf '%s\n' "$out" | grep -o 'warn:' | wc -l | tr -d ' ')" 1 "exactly one warning"
run CLAUDE_CONFIG_DIR="$FX/claude-1m" -- --harness claude --json
assert_eq "$out" '{"planner":1000000,"implementer":200000,"reviewer":200000,"finalReview":1000000,"assembler":200000}' "claude-1m --json"

run CLAUDE_CONFIG_DIR="$FX/claude-1m" ANTHROPIC_DEFAULT_SONNET_MODEL='claude-sonnet-x[1m]' -- --harness claude
assert_eq "$out" "Context: claude · planner=1M/967K · implementer=1M/967K · reviewer=1M/967K · finalReview=1M/967K · assembler=1M/967K" "sonnet default override to 1M"

run CLAUDE_CONFIG_DIR="$FX/claude-200k" -- --harness claude
assert_has "$out" "planner=200K/167K · implementer=200K/167K · reviewer=200K/167K · finalReview=200K/167K · assembler=200K/167K" "claude-200k all 200K"
assert_has "$out" "planner, finalReview on a 200K model → set ANTHROPIC_DEFAULT_OPUS_MODEL" "opus roles warned"
assert_has "$out" "implementer, reviewer, assembler on a 200K model → set ANTHROPIC_DEFAULT_SONNET_MODEL" "sonnet roles warned"

run CLAUDE_CONFIG_DIR="$FX/claude-200k" CLAUDE_CODE_SUBAGENT_MODEL='opus[1m]' -- --harness claude
assert_eq "$out" "Context: claude · planner=1M/967K · implementer=1M/967K · reviewer=1M/967K · finalReview=1M/967K · assembler=1M/967K" "subagent model env"

run CLAUDE_CONFIG_DIR="$FX/claude-1m" CLAUDE_CODE_AUTO_COMPACT_WINDOW=300000 -- --harness claude
assert_has "$out" "planner=1M/300K · implementer=200K/300K" "auto-compact window is every role's compact point"
assert_has "$out" "warn: CLAUDE_CODE_AUTO_COMPACT_WINDOW 300000 below 50% of 1M → unset it or raise it" "override below 50% warns"
assert_lacks "$out" "below 50% of 200K" "300K is not below 50% of a 200K window"

run CLAUDE_CONFIG_DIR="$T/nope" -- --harness claude
expect_clean "claude no settings"
assert_has "$out" "planner=unknown" "bare alias with unreadable session model is unknown"
run CLAUDE_CONFIG_DIR="$T/nope" CLAUDE_CODE_SUBAGENT_MODEL='sonnet[1m]' -- --harness claude --json
assert_eq "$out" '{"planner":1000000,"implementer":1000000,"reviewer":1000000,"finalReview":1000000,"assembler":1000000}' "explicit [1m] needs no settings"

run CLAUDE_CONFIG_DIR="$FX/claude-1m" CLAUDECODE=1 -- 
assert_has "$out" "Context: claude · planner=1M/967K" "CLAUDECODE=1 selects claude"

mkdir -p "$T/proj/.claude"; printf '{"model":"sonnet[1m]"}\n' > "$T/proj/.claude/settings.json"
set +e; out=$(cd "$T/proj" && env -i HOME="$T/home" PATH="$PATH" CLAUDE_CONFIG_DIR="$FX/claude-200k" bash "$P" --harness claude --json 2>/dev/null); set -e
assert_has "$out" '"implementer":1000000' "project .claude/settings.json beats the config dir"

echo "context-preflight: undetected"
run -- 
expect_clean "no harness"
assert_eq "$out" "Context: unknown — harness not detected" "no signal, no --harness"
run -- --json
assert_eq "$out" "{}" "no harness --json"

echo "context-preflight: writes nothing"
stray=$(find "$T" -type f -newer "$T/stamp" | grep -v -E "^$T/(err|low/|nomulti/|nojq/|home/\.codex/|proj/)" || true)
assert_eq "$stray" "" "no files written by the script"
assert_eq "$(ls -A "$T/empty")" "" "cwd untouched"

if [ "$FAILURES" -gt 0 ]; then echo "context-preflight: $FAILURES failed"; exit 1; fi
echo "context-preflight: all tests passed"
