#!/bin/bash
set -u
worktree=/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.28
integration=/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers
scratch=/tmp/sp-bce79baa/super-plan-ufz.28
phase=$1
mode=$2
log="$worktree/.superpowers/task-25-evidence/$phase-$mode.log"
export HOME="$scratch/home" XDG_CONFIG_HOME="$scratch/config" XDG_CACHE_HOME="$scratch/cache" XDG_DATA_HOME="$scratch/data" XDG_STATE_HOME="$scratch/state"
case "$mode" in
  inherited) ;;
  trailing) export TMPDIR="$scratch/" ;;
  slashfree) export TMPDIR="$scratch" ;;
  *) exit 2 ;;
esac
cd "$worktree" || exit
{
  printf 'command: bash tests/super-code/test-dispatch-text.sh\nconfiguration: %s; TMPDIR=%s; HOME=%s; XDG_*_HOME under %s\n' "$mode" "$TMPDIR" "$HOME" "$scratch"
  printf 'sourceTree: '
  GIT_INDEX_FILE="$scratch/test-source.index" git read-tree HEAD
  GIT_INDEX_FILE="$scratch/test-source.index" git add -- tests/super-code/test-dispatch-text.sh
  GIT_INDEX_FILE="$scratch/test-source.index" git write-tree
  printf 'test runner: '
  command -v bash
  printf 'node runtime: '
  command -v node
  printf 'package under test: %s/skills/super-code/scripts/dispatch-text\n' "$worktree"
  bash tests/super-code/test-dispatch-text.sh
  result=$?
  printf '\nexit=%s\n' "$result"
} > "$log" 2>&1
rg '\[FAIL\]|failure\(s\)|all tests passed|exit=' "$log"
cd "$integration" || exit
bash skills/super-code/scripts/stop-run-processes --check "$worktree" "$scratch" > "$worktree/.superpowers/task-25-evidence/$phase-$mode-hygiene.log" 2>&1
hygiene=$?
cat "$worktree/.superpowers/task-25-evidence/$phase-$mode-hygiene.log"
printf 'test exit=%s; hygiene exit=%s\n' "$result" "$hygiene"
[ "$hygiene" -eq 0 ] || exit "$hygiene"
exit "$result"
