#!/usr/bin/env bash
# Exercise the documented outer-finish decision table with disposable Git resources.
# This checks the caller contract and Git consequences, not fresh-agent instruction compliance.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
fixture_tmp=${TMPDIR:-/tmp}
T=$(mktemp -d "${fixture_tmp%/}/outer-cleanup-r1.XXXXXX")
T=$(cd "$T" && pwd -P)
owned_process_root=
cleanup() {
  local result=0
  if [ -n "$owned_process_root" ]; then
    (cd "$repo" && bash "$ROOT/skills/super-code/scripts/stop-run-processes" "$owned_process_root") || result=$?
    if [ "$result" != 0 ]; then
      echo "Fixture process cleanup unverified; retained $T" >&2
      return "$result"
    fi
  fi
  rm -rf "$T"
}
trap cleanup EXIT
export HOME="$T/home" XDG_CONFIG_HOME="$T/config" XDG_DATA_HOME="$T/data" XDG_CACHE_HOME="$T/cache" XDG_STATE_HOME="$T/state"
mkdir -p "$HOME"
export GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME=Fixture GIT_AUTHOR_EMAIL=fixture@example.invalid
export GIT_COMMITTER_NAME=Fixture GIT_COMMITTER_EMAIL=fixture@example.invalid

fixture() {
  repo="$T/$1/repo"
  outer="$repo/.worktrees/outer"
  child="$outer/.worktrees/child"
  temp="$outer/retained-temp"
  mkdir -p "$repo"
  git -C "$repo" init -q
  printf '.worktrees/\nretained-temp/\n' > "$repo/.gitignore"
  printf 'committed\n' > "$repo/file"
  git -C "$repo" add .
  git -C "$repo" commit -qm seed
  git -C "$repo" worktree add -qb outer "$outer"
  if [ "$2" = nested ]; then
    git -C "$repo" worktree add -qb child "$child"
    printf 'dirty child work\n' > "$child/file"
  fi
  mkdir -p "$temp"
  printf 'retained temporary evidence\n' > "$temp/evidence"
}

# Baseline consequence: a clean parent status does not protect ignored dirty children.
fixture baseline nested
[ -z "$(git -C "$outer" status --porcelain)" ]
[ -n "$(git -C "$child" status --porcelain)" ]
git -C "$repo" worktree remove "$outer"
[ ! -e "$child/file" ]
echo 'PASS baseline: ordinary parent removal exits 0 and destroys ignored dirty child'

# Read the actual decision table, so an absent or regressed caller contract fails this fixture.
node - "$ROOT" "$T/decisions" <<'NODE'
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2],skill=fs.readFileSync(path.join(root,'skills/super-auto/SKILL.md'),'utf8');
const section=skill.split('### Phase 7 — cleanup preconditions')[1]?.split('\n## ')[0];
assert(section,'phase 7 cleanup preconditions missing');
const expected={'task-retained':'retain','resource-retained':'retain','process-survived':'retain','process-unknown':'retain','process-kept':'retain','process-unconfirmed':'retain','verified-clear':'remove'};
const decisions={};
for(const row of section.split('\n')) {
 const match=row.match(/^\| `([^`]+)` \|.*\| `(retain|remove)` \|$/);
 if(match) decisions[match[1]]=match[2];
}
assert.deepEqual(decisions,expected,'every refusal and positive cleanup outcome must remain explicit');
const verify=section.indexOf('1. Verify run-owned processes'),sweep=section.indexOf('2. Sweep task worktrees'),final=section.indexOf('3. Only after no retained descendants');
assert(verify>=0&&sweep>verify&&final>sweep,'leaf verification, safe task sweep, then final parent verification must remain ordered');
assert(section.includes('before the finisher')&&section.includes('Step 6 or any temp deletion'),'final verification must gate both parent and temp deletion');
assert(section.includes('missing output')&&section.includes('pending until step 3'),'missing results or pending parent verification cannot authorize removal');
assert(section.includes('exit-zero empty output'),'empty stdout must not establish inspection availability');
assert(section.includes('exit 3 or 4'),'task retention exits must block outer removal');
assert(section.includes('refused parent root'),'nested-root refusal must remain unknown');
const finish=fs.readFileSync(path.join(root,'skills/finishing-a-development-branch/SKILL.md'),'utf8');
assert(finish.indexOf('### Removal preconditions')<finish.indexOf('git worktree remove "$WORKTREE_PATH"'),'finisher must gate its actual removal');
assert(finish.includes('retained descendants')&&finish.includes('unknown'),'finisher must independently preserve retained and unverified resources');
for(const file of ['run-state.md','report-prompt.md']) {
 const text=fs.readFileSync(path.join(root,'skills/super-auto',file),'utf8');
 assert(text.toLowerCase().includes('phase-7 cleanup'),'durable cleanup/report contract absent: '+file);
 assert(text.includes('exit 3 or 4'),'retained cleanup exit provenance absent: '+file);
}
fs.writeFileSync(process.argv[3],Object.entries(decisions).map(([k,v])=>k+' '+v+'\n').join(''));
NODE

action_for() { awk -v key="$1" '$1==key{print $2}' "$T/decisions"; }
finish_fixture() {
  action=$(action_for "$1")
  case "$action" in
    retain) : ;;
    remove) git -C "$repo" worktree remove "$outer" ;;
    *) echo "FAIL missing contract outcome: $1" >&2; exit 1 ;;
  esac
}
assert_retained() {
  [ -f "$outer/file" ]
  [ "$(cat "$child/file")" = 'dirty child work' ]
  [ "$(cat "$temp/evidence")" = 'retained temporary evidence' ]
  git -C "$repo" worktree list --porcelain | grep -Fx "worktree $child" >/dev/null
}

# Real cleanup helper results, including process-discovery failure before the dirty check.
fixture task3 nested
status=0
(cd "$repo" && bash "$ROOT/skills/super-code/scripts/remove-task-worktree" "$child" child outer) > "$T/task3.log" 2>&1 || status=$?
[ "$status" = 3 ]
finish_fixture task-retained
assert_retained
echo 'PASS task cleanup exit 3 retains parent, dirty child and temporary resources'

fixture task4 nested
mkdir -p "$T/no-inspection"
printf '#!/bin/sh\nexit 1\n' > "$T/no-inspection/ps"
chmod +x "$T/no-inspection/ps"
status=0
(cd "$repo" && PATH="$T/no-inspection:$PATH" bash "$ROOT/skills/super-code/scripts/remove-task-worktree" --sweep "$outer/.worktrees" outer) > "$T/task4.log" 2>&1 || status=$?
[ "$status" = 4 ]
grep -q '^unknown:' "$T/task4.log"
finish_fixture task-retained
assert_retained
echo 'PASS task cleanup exit 4 retains parent, dirty child and temporary resources'

# An actual parent-root refusal cannot be bypassed with a broader process match.
status=0
(cd "$repo" && bash "$ROOT/skills/super-code/scripts/stop-run-processes" "$outer") > "$T/refused.log" 2>&1 || status=$?
[ "$status" = 2 ]
grep -q 'worktrees nested under it' "$T/refused.log"
finish_fixture process-unknown
assert_retained
echo 'PASS parent-root inspection refusal preserves every dependent resource'

# Deterministic process-result scenarios; these are caller decision simulations, not live kills.
for fact in resource-retained process-survived process-unknown process-kept process-unconfirmed; do
  fixture "$fact" nested
  finish_fixture "$fact"
  assert_retained
  echo "PASS $fact preserves parent, descendant and temporary resources"
done

# Positive path: sweep a clean merged leaf, then verify the parent before ordinary removal.
# This uses the real fail-closed helpers; a text-only success or hard-coded zero cannot pass.
fixture verified-clear nested
git -C "$child" restore file
status=0
(cd "$repo" && bash "$ROOT/skills/super-code/scripts/remove-task-worktree" --sweep "$outer/.worktrees" outer) > "$T/leaf-sweep.log" 2>&1 || status=$?
[ "$status" = 0 ]
[ ! -d "$child" ]
grep -F "removed: $child" "$T/leaf-sweep.log" >/dev/null
[ -f "$outer/file" ]
[ -f "$temp/evidence" ]
# This is the fixture's own disposable process; only exact resource ownership may match it.
owned_process_root=$outer
(cd "$outer" && exec node -e 'process.on("SIGTERM",()=>process.exit(0));require("node:fs").writeFileSync(process.argv[1],"ready\n");setInterval(()=>{},1000)' "$temp/process-ready") &
owned_pid=$!
for attempt in 1 2 3 4 5; do
  [ -f "$temp/process-ready" ] && break
  sleep 0.1
done
[ -f "$temp/process-ready" ]
status=0
(cd "$repo" && bash "$ROOT/skills/super-code/scripts/stop-run-processes" "$outer" "$temp") > "$T/parent-verification.log" 2>&1 || status=$?
[ "$status" = 0 ]
grep -F "stopped: $owned_pid " "$T/parent-verification.log" >/dev/null
if grep -Eq '^(unknown:|survived:|kept:)' "$T/parent-verification.log"; then exit 1; fi
owned_status=0
wait "$owned_pid" 2>/dev/null || owned_status=$?
[ "$owned_status" = 0 ]
owned_process_root=
finish_fixture verified-clear
[ ! -e "$outer" ]
[ ! -e "$temp" ]
if git -C "$repo" worktree list --porcelain | grep -Fx "worktree $outer" >/dev/null; then exit 1; fi
echo 'PASS verified-clear: real safe leaf sweep and verified owned-process termination permit ordinary cleanup'
echo 'All outer cleanup r1 fixture checks passed (instruction behavior evaluation remains caller-owned)'
