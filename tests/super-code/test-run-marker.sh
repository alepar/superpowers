#!/usr/bin/env bash
# Tests for skills/super-code/scripts/run-marker: register / get / clear / prune of the per-session
# run marker, its liveness rules, its fallback marker and the refusal for task worktrees/subagents.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
M="$REPO_ROOT/skills/super-code/scripts/run-marker"
T=$(mktemp -d)
T=$(cd "$T" && pwd -P)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_has() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing: $2"; echo "    in: $1"; fi; }
assert_lacks() { if printf '%s\n' "$1" | grep -qF -- "$2"; then fail "$3"; echo "    unexpected: $2"; else pass "$3"; fi; }

# rm_run <env assignments...> -- <args>: run the script with a clean session environment.
# Sets $out (stdout) and $code. XDG_STATE_HOME comes from $XDG (empty = unset, HOME=$T/home).
XDG=""
mk() {  # mk <name> sets up a case: $XDG, a worktree $W, a run.md $R (phase: code)
  XDG="$T/state-$1"
  W="$T/wt-$1"
  R="$W/run.md"
  mkdir -p "$W/sub" "$W/a/b"
  printf 'phase: code\n' > "$R"
  : > "$W/ledger.md"
}
rm_run() {
  local envs=() a
  while [ "$#" -gt 0 ] && [ "$1" != "--" ]; do envs+=("$1"); shift; done
  shift
  set +e
  if [ -n "$XDG" ]; then
    out=$(env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID XDG_STATE_HOME="$XDG" HOME="$T/home" ${envs[@]+"${envs[@]}"} bash "$M" "$@" 2>"$T/err")
  else
    out=$(env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u XDG_STATE_HOME HOME="$T/home" ${envs[@]+"${envs[@]}"} bash "$M" "$@" 2>"$T/err")
  fi
  code=$?
  set -e
}
store() { echo "$XDG/superpowers/active-runs"; }
reg() { # reg <env> <extra args...> : register super-auto in $W
  local e="$1"; shift
  rm_run "$e" -- register --skill super-auto --worktree "$W" --run-md "$R" --ledger "$W/ledger.md" --epic ep --run-tag rt-1 "$@"
}

echo "run-marker: no session id"
mk none
reg "X=1"
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "run-marker: no session id — skipped" "prints the skip line"
[ ! -e "$(store)" ] && pass "no file written" || fail "no file written"

echo "run-marker: register + get by session id"
mk basic
reg "CLAUDE_CODE_SESSION_ID=s1"
assert_eq "$code" 0 "register exits 0"
assert_eq "$out" "run-marker: registered s1 ($(store)/s1)" "reports the store path"
[ -f "$(store)/s1" ] && pass "file at <store>/s1" || fail "file at <store>/s1"
rm_run -- get s1
assert_eq "$code" 0 "get exits 0"
assert_eq "$(printf '%s\n' "$out" | head -1)" "key: s1" "first line is key: s1"
assert_has "$out" "skill: super-auto" "skill field"
assert_has "$out" "harness: claude" "harness claude from CLAUDE_CODE_SESSION_ID"
assert_has "$out" "run_md: $R" "run_md absolute"
assert_has "$out" "ledger: $W/ledger.md" "ledger field"
assert_has "$out" "epic: ep" "epic field"
assert_has "$out" "worktree: $W" "worktree field"
assert_has "$out" "session: s1" "session field"
assert_has "$out" "runTag: rt-1" "runTag field"
assert_has "$out" "registered_by_pid: " "registered_by_pid field"
assert_has "$out" "started: 20" "started field"

echo "run-marker: session id order"
mk ids
reg "CODEX_THREAD_ID=c1"
rm_run -- get c1
assert_has "$out" "harness: codex" "CODEX_THREAD_ID gives harness codex"
rm_run "CLAUDE_CODE_SESSION_ID=a1" "CODEX_THREAD_ID=c2" -- register --skill super-auto --worktree "$W" --run-md "$R" --ledger "$W/ledger.md" --epic ep
assert_has "$out" "registered a1" "CLAUDE_CODE_SESSION_ID wins over CODEX_THREAD_ID"
rm_run -- register --skill super-auto --worktree "$W" --run-md "$R" --ledger "$W/ledger.md" --epic ep --session x
assert_has "$out" "registered x" "--session used when neither env is set"
rm_run -- get x
assert_has "$out" "harness: unknown" "harness unknown for --session"
rm_run "CLAUDE_CODE_SESSION_ID=a1" -- register --skill super-auto --worktree "$W" --run-md "$R" --ledger "$W/ledger.md" --epic ep --session x
assert_has "$out" "registered a1" "env wins over --session"
rm_run "CLAUDE_CODE_SESSION_ID=a/b" -- register --skill super-auto --worktree "$W" --run-md "$R"
assert_has "$out" "no session id — skipped" "id with / rejected"

echo "run-marker: XDG_STATE_HOME unset uses HOME/.local/state"
mk home
XDG=""
mkdir -p "$T/home"
reg "CLAUDE_CODE_SESSION_ID=h1"
[ -f "$T/home/.local/state/superpowers/active-runs/h1" ] && pass "store under HOME/.local/state" || fail "store under HOME/.local/state"

echo "run-marker: liveness"
mk live
reg "CLAUDE_CODE_SESSION_ID=l1"
printf 'phase: done\n' > "$R"
rm_run -- get l1
assert_eq "$code" 1 "phase done is not live"
printf 'phase: code\n' > "$R"
rm_run -- get l1
assert_eq "$code" 0 "phase code is live"
rm -f "$R"
rm_run -- get l1
assert_eq "$code" 1 "missing run_md is not live"
printf 'phase: code\n' > "$R"
rm_run "CLAUDE_CODE_SESSION_ID=l2" -- register --skill super-code --worktree "$W" --ledger "$W/ledger.md" --epic ep
rm_run -- get l2
assert_eq "$code" 0 "standalone with ledger is live"
assert_lacks "$out" "run_md:" "standalone has no run_md field"
rm -f "$W/ledger.md"
rm_run -- get l2
assert_eq "$code" 1 "standalone without ledger is not live"
: > "$W/ledger.md"
touch -t 202001010000 "$(store)/l2"
rm_run -- get l2
assert_eq "$code" 1 "marker older than 14 days is not live"
rm_run "CLAUDE_CODE_SESSION_ID=l3" -- register --skill super-code --worktree "$W" --ledger "$W/ledger.md" --epic ep
touch -t 202001010000 "$(store)/l3"
touch -t 202001010000 "$(store)/l1"
printf 'phase: done\n' > "$R"
rm_run -- prune
assert_has "$out" "run-marker: pruned " "prune prints count"
[ ! -e "$(store)/l1" ] && [ ! -e "$(store)/l2" ] && [ ! -e "$(store)/l3" ] && pass "prune removed backdated and dead markers" || fail "prune removed backdated and dead markers"
# l2 was already pruned by the l3 register (register prunes non-live markers)
assert_eq "$out" "run-marker: pruned 2" "pruned exactly the 2 still-present non-live markers"

echo "run-marker: re-register and same run_md"
mk rereg
reg "CLAUDE_CODE_SESSION_ID=s1"
st1=$(grep '^started:' "$(store)/s1")
touch -t 202001010000 "$(store)/s1"
sleep 1
reg "CLAUDE_CODE_SESSION_ID=s1"
assert_eq "$(grep '^started:' "$(store)/s1")" "$st1" "started kept on re-register"
rm_run -- get s1
assert_eq "$code" 0 "re-register refreshed the age"
reg "CLAUDE_CODE_SESSION_ID=s2"
[ ! -e "$(store)/s1" ] && pass "same run_md removes the other session's marker" || fail "same run_md removes the other session's marker"
[ -e "$(store)/s2" ] && pass "new marker kept" || fail "new marker kept"

echo "run-marker: --cwd resolution"
mk cwd
reg "CLAUDE_CODE_SESSION_ID=s1"
rm_run -- get other --cwd "$W/sub"
assert_eq "$code" 0 "cwd under worktree resolves"
assert_eq "$(printf '%s\n' "$out" | head -1)" "key: s1" "key is the marker's session"
rm_run -- get other
assert_eq "$code" 1 "unknown id without --cwd: exit 1"
assert_eq "$out" "" "prints nothing"
# two live markers containing the dir: newer wins
W2="$W/sub"; mkdir -p "$W2/deep"
printf 'phase: code\n' > "$W2/run.md"
rm_run "CLAUDE_CODE_SESSION_ID=s9" -- register --skill super-auto --worktree "$W2" --run-md "$W2/run.md" --ledger "$W/ledger.md" --epic ep
touch -t 202601010000 "$(store)/s1"
rm_run -- get other --cwd "$W2/deep"
assert_eq "$(printf '%s\n' "$out" | head -1)" "key: s9" "newest live marker wins"
touch -t 202601010000 "$(store)/s9"; touch "$(store)/s1"
rm_run -- get other --cwd "$W2/deep"
assert_eq "$(printf '%s\n' "$out" | head -1)" "key: s1" "newest by mtime, not by name"
mkdir -p "$W/.worktrees/t1"
rm_run -- get other --cwd "$W/.worktrees/t1"
assert_eq "$code" 1 "task worktree cwd refused"
rm_run -- get other --cwd "$W/sub" --subagent
assert_eq "$code" 1 "--subagent refuses the cwd fallback"
rm_run -- get s1 --subagent
assert_eq "$code" 0 "--subagent with a session match still resolves"
rm_run -- get s1 --cwd "$W/.worktrees/t1"
assert_eq "$code" 0 "session match is not subject to the cwd refusal"

echo "run-marker: fallback marker"
mk fb
printf 'x' > "$T/afile"
XDG="$T/afile"
reg "CLAUDE_CODE_SESSION_ID=s1"
assert_eq "$code" 0 "exits 0"
assert_has "$out" "run-marker: wrote fallback $W/.superpowers/run-marker-s1 — " "prints fallback path and reason"
assert_has "$(cat "$W/.superpowers/.gitignore")" "run-marker-*" ".gitignore lists run-marker-*"
rm_run -- get s1 --cwd "$W/a/b"
assert_eq "$(printf '%s\n' "$out" | head -1)" "key: $W/.superpowers/run-marker-s1" "walk-up finds the fallback"
assert_has "$out" "session: s1" "fallback fields printed"
mkdir -p "$W/.worktrees/t"
rm_run -- get s1 --cwd "$W/.worktrees/t"
assert_eq "$code" 1 "fallback refused under .worktrees"
rm_run -- get s1
assert_eq "$code" 1 "fallback needs --cwd"
rm_run -- get s1 --cwd "$W/a/b" --subagent
assert_eq "$code" 1 "fallback refused for --subagent"
rm_run -- get other --cwd "$W/a/b"
assert_eq "$code" 1 "another session's fallback is not returned"
# two sessions, one worktree
reg "CLAUDE_CODE_SESSION_ID=s2"
[ -f "$W/.superpowers/run-marker-s1" ] && [ -f "$W/.superpowers/run-marker-s2" ] && pass "two distinct fallback files" || fail "two distinct fallback files"
rm_run -- get s1 --cwd "$W/a"
assert_eq "$(printf '%s\n' "$out" | head -1)" "key: $W/.superpowers/run-marker-s1" "s1 gets its own"
rm_run -- get s2 --cwd "$W/a"
assert_eq "$(printf '%s\n' "$out" | head -1)" "key: $W/.superpowers/run-marker-s2" "s2 gets its own"
[ "$(grep -c 'run-marker-\*' "$W/.superpowers/.gitignore")" = 1 ] && pass ".gitignore entry not duplicated" || fail ".gitignore entry not duplicated"

echo "run-marker: both unwritable"
mk bad
XDG="$T/afile"
WB="$T/afile/sub"
rm_run "CLAUDE_CODE_SESSION_ID=s1" -- register --skill super-auto --worktree "$WB" --run-md "$R" --ledger "$R"
assert_eq "$code" 0 "exits 0"
assert_has "$out" "run-marker: register failed — " "prints register failed"
assert_lacks "$out" "skipped" "not reported as a skip"

echo "run-marker: refresh keeps optional fields"
mk keep
reg "CLAUDE_CODE_SESSION_ID=k1"
rm_run "CLAUDE_CODE_SESSION_ID=k1" -- register --skill super-auto --worktree "$W" --run-md "$R"
rm_run -- get k1
assert_has "$out" "ledger: $W/ledger.md" "refresh keeps ledger"
assert_has "$out" "epic: ep" "refresh keeps epic"
assert_has "$out" "runTag: rt-1" "refresh keeps runTag"
assert_has "$out" "run_md: $R" "refresh keeps run_md"
rm_run "CLAUDE_CODE_SESSION_ID=k1" -- register --skill super-auto --worktree "$W" --epic ep2
assert_eq "$(grep '^epic:' "$(store)/k1")" "epic: ep2" "a given flag wins over the kept value"
assert_eq "$(grep '^ledger:' "$(store)/k1")" "ledger: $W/ledger.md" "ledger kept beside a new epic"
mkdir -p "$T/wt-other"
rm_run "CLAUDE_CODE_SESSION_ID=k1" -- register --skill super-auto --worktree "$T/wt-other"
assert_eq "$(grep '^epic:' "$(store)/k1")" "epic: " "another worktree carries no epic"
assert_lacks "$(cat "$(store)/k1")" "$W/ledger.md" "another worktree carries no ledger"
assert_lacks "$(cat "$(store)/k1")" "runTag:" "another worktree carries no runTag"
reg "CLAUDE_CODE_SESSION_ID=k1"
rm_run "CLAUDE_CODE_SESSION_ID=k1" -- register --skill super-code --worktree "$W"
assert_eq "$(grep '^epic:' "$(store)/k1")" "epic: " "another skill carries no epic"
assert_lacks "$(cat "$(store)/k1")" "run_md:" "another skill carries no run_md"
assert_lacks "$(cat "$(store)/k1")" "runTag:" "another skill carries no runTag"
mk keepfb
printf 'x' > "$T/afile2"
XDG="$T/afile2"
reg "CLAUDE_CODE_SESSION_ID=k2"
rm_run "CLAUDE_CODE_SESSION_ID=k2" -- register --skill super-auto --worktree "$W"
assert_eq "$(grep '^epic:' "$W/.superpowers/run-marker-k2")" "epic: ep" "fallback refresh keeps epic"
assert_has "$(cat "$W/.superpowers/run-marker-k2")" "ledger: $W/ledger.md" "fallback refresh keeps ledger"

echo "run-marker: usage"
mk usage
rm_run "CLAUDE_CODE_SESSION_ID=s1" -- register --worktree "$W"
assert_eq "$code" 0 "register without --skill exits 0"
assert_has "$out" "run-marker: register failed — usage" "usage failure is a failure line"
rm_run -- get
assert_eq "$code" 2 "get with no args exits 2"
rm_run -- bogus
assert_eq "$code" 2 "unknown command exits 2"

echo "run-marker: clear"
mk clr
reg "CLAUDE_CODE_SESSION_ID=s1"
rm_run "CLAUDE_CODE_SESSION_ID=s2" -- register --skill super-code --worktree "$W" --ledger "$W/ledger.md" --epic ep
mkdir -p "$W/.superpowers"
printf 'session: s1\n' > "$W/.superpowers/run-marker-s1"
printf 'session: s2\n' > "$W/.superpowers/run-marker-s2"
rm_run "CLAUDE_CODE_SESSION_ID=s1" -- clear
assert_eq "$code" 0 "clear exits 0"
assert_eq "$out" "run-marker: cleared s1" "prints cleared"
[ ! -e "$(store)/s1" ] && [ ! -e "$W/.superpowers/run-marker-s1" ] && pass "caller's store and fallback markers removed" || fail "caller's store and fallback markers removed"
[ -e "$(store)/s2" ] && [ -e "$W/.superpowers/run-marker-s2" ] && pass "other session's markers survive" || fail "other session's markers survive"
rm_run -- clear
assert_eq "$out" "run-marker: no session id — skipped" "clear without id skips"

if [ "$FAILURES" -gt 0 ]; then echo "run-marker: $FAILURES failure(s)"; exit 1; fi
echo "run-marker: all tests passed"
