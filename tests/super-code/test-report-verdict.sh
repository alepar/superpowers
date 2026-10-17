#!/usr/bin/env bash
# Tests for skills/super-code/scripts/report-verdict: one recogniser per child-report kind, first
# match wins, output capped at ~20 lines, unknown format falls back, bad input exits 2.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
R="$REPO_ROOT/skills/super-code/scripts/report-verdict"
FX="$SCRIPT_DIR/fixtures/report-verdict"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_has() { if printf '%s\n' "$1" | grep -qxF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing line: $2"; fi; }
assert_lacks() { if printf '%s\n' "$1" | grep -qF -- "$2"; then fail "$3"; echo "    unexpected: $2"; else pass "$3"; fi; }
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; }
lines() { printf '%s\n' "$1" | wc -l | tr -d ' '; }

echo "report-verdict: task report, clean"
run bash "$R" "$FX/task-report.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "verdict: DONE
kind: task-report
path: $FX/task-report.md" "DONE: verdict, kind, no items, path"

echo "report-verdict: task report, concerns"
run bash "$R" "$FX/task-report-concerns.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "verdict: DONE_WITH_CONCERNS
kind: task-report
- The budget trim drops the tail section first, which may hide the newest merge line.
- test-run-digest.sh takes 4 minutes on this machine.
path: $FX/task-report-concerns.md" "concern bullets are the items"

echo "report-verdict: roast"
run bash "$R" "$FX/roast-report.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "verdict: Blocking (2 confirmed)
kind: roast
- [Blocking] spec §A2 — the marker is read without a liveness check
- [Blocking] spec §B3 — the split path has no exit code for bad coverage
path: $FX/roast-report.md" "Blocking entries of Confirmed findings only"
assert_lacks "$out" "Should-fix" "Should-fix entry not listed"
assert_lacks "$out" "hook fires twice" "Rejected-section Blocking line not counted"

echo "report-verdict: roast, many blocking"
run bash "$R" "$FX/roast-many.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$(printf '%s\n' "$out" | grep -c '^- \[Blocking\]')" 15 "15 items shown"
assert_has "$out" "+5 more" "overflow counted"
assert_has "$out" "- [Blocking] file15.sh:15 — problem number 15" "15th item present"
assert_lacks "$out" "problem number 16" "16th item cut"

echo "report-verdict: final review"
run bash "$R" "$FX/final-review.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "verdict: not ready (2 must-fix)
kind: final-review
- skills/super-code/scripts/run-digest: the budget trim never reaches the tail section.
- hooks/session-start-runblock: no watchdog around run-digest, a slow bd call hangs the hook.
untested: The Codex entry script was not exercised.
path: $FX/final-review.md" "Verdict section text, Must fix bullets and untested line"

echo "report-verdict: final review quoting a task Status line"
run bash "$R" "$FX/final-review-quoted-status.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "verdict: not ready (1 must-fix)
kind: final-review
- skills/super-code/scripts/report-verdict: the status line wins over the verdict heading.
untested: None run live.
path: $FX/final-review-quoted-status.md" "the exact Verdict heading wins over a quoted Status line"

echo "report-verdict: cluster verdict"
run bash "$R" "$FX/cluster-verdict.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "verdict: ready
kind: final-review
untested: Codex entry script.
path: $FX/cluster-verdict.md" "inline verdict, '- none' yields no items"

echo "report-verdict: final review, the real phase-3 sample"
run bash "$R" "$FX/final-review-real.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$(printf '%s\n' "$out" | sed -n 1p | cut -c1-33)" "verdict: not ready (known-failing" "verdict is the heading's value, not the bold label"
assert_lacks "$(printf '%s\n' "$out" | sed -n 1p)" "**" "verdict has no bold markers"
assert_lacks "$out" "One test is known" "verdict does not carry the label's trailing paragraph"
assert_has "$out" "kind: final-review" "kind"
assert_eq "$(printf '%s\n' "$out" | grep -c '^- ')" 3 "exactly three numbered must-fix items"
for pre in "- The failing test" "- Stop the run block" "- Pass the sweep result"; do
  assert_eq "$(printf '%s\n' "$out" | grep -c "^$pre")" 1 "item starts '$pre'"
done
assert_lacks "$out" "Its bead" "nested sub-bullet is not an item"
assert_eq "$(printf '%s\n' "$out" | grep -c '^untested: .*No full-suite sweep')" 1 "untested line carries the first untested item"
assert_eq "$(printf '%s\n' "$out" | tail -n 1)" "path: $FX/final-review-real.md" "path is last"

echo "report-verdict: final review in the format the prompts fix"
run bash "$R" "$FX/final-review-format.md"
assert_eq "$out" "verdict: not ready (2 must-fix)
kind: final-review
- skills/super-code/scripts/run-digest: the budget trim never reaches the tail section.
- hooks/session-start-runblock: no watchdog around run-digest, a slow bd call hangs the hook.
untested: Codex entry not run.
path: $FX/final-review-format.md" "exact output"

echo "report-verdict: untested lines are capped at 10"
{ printf '## Verdict\nready\n\n## Must fix before landing\n- none\n\n## Untested scope\n'; for i in 1 2 3 4 5 6 7 8 9 10 11 12; do echo "- area $i"; done; } > "$T/many-untested.md"
run bash "$R" "$T/many-untested.md"
assert_eq "$(printf '%s\n' "$out" | grep -c '^untested: ')" 11 "ten items plus the overflow line"
assert_has "$out" "untested: +2 more" "overflow counted"
assert_eq "$(lines "$out")" 14 "verdict, kind, 11 untested, path"

echo "report-verdict: producer/parser contract"
printf '%s\n' '# SDD ledger — plan: ep-plan.md' \
  'Launch: mechanism ordinary-subagents · epic ep · branch b · integrationWorktree /r/w · mergeCheck none' > "$T/ledger.md"
run bash "$REPO_ROOT/skills/super-code/scripts/dispatch-text" --ledger "$T/ledger.md" --stdout final-review --mode single
assert_eq "$code" 0 "dispatch-text builds the single-mode final-review prompt"
for needle in '"## Verdict"' '"## Must fix before landing"' '"## Untested scope"' 'no numbered lists'; do
  if printf '%s\n' "$out" | grep -qF -- "$needle"; then pass "prompt fixes $needle"; else fail "prompt fixes $needle"; fi
done

echo "report-verdict: step-back"
run bash "$R" "$FX/step-back.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "verdict: decision: patch
kind: step-back
- summary: the failing check is a one-off typo in the fixture, not a design gap
path: $FX/step-back.md" "patch: summary only"
run bash "$R" "$FX/step-back-local.md"
assert_eq "$out" "verdict: decision: local
kind: step-back
- summary: the failing check is a one-off typo in the fixture, not a design gap
path: $FX/step-back-local.md" "local: summary only"
run bash "$R" "$FX/step-back-redesign.md"
assert_eq "$out" "verdict: decision: redesign
kind: step-back
- summary: three reviewers independently found the marker lifecycle underspecified
- changes: replace the pid marker with a session-scoped marker owned by run-marker
- scope: spec §A2, §A3 and the hook entry scripts
path: $FX/step-back-redesign.md" "redesign: summary, changes, scope"

echo "report-verdict: assembled digest"
run bash "$R" "$FX/assembled-digest.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "verdict: fits: no (91000 of 80000)
kind: assembled
- cluster-fits: scripts no (85000 of 80000)
path: $FX/assembled-digest.md" "fits line; only non-fitting clusters are items"
assert_lacks "$out" "hooks yes" "fitting cluster not listed"

echo "report-verdict: unknown format"
run bash "$R" "$FX/unknown.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$(lines "$out")" 12 "verdict, path and exactly 10 lines"
assert_eq "$(printf '%s\n' "$out" | sed -n 1,2p)" "verdict: unknown
path: $FX/unknown.md" "verdict then path"
assert_eq "$(printf '%s\n' "$out" | sed -n 3,12p)" "$(head -10 "$FX/unknown.md")" "first 10 lines verbatim"
assert_lacks "$out" "Line 11 " "line 11 not shown"

echo "report-verdict: output cap"
for f in "$FX"/*.md; do
  run bash "$R" "$f"
  n=$(lines "$out")
  if [ "$n" -le 20 ]; then pass "$(basename "$f"): $n lines"; else fail "$(basename "$f"): $n lines > 20"; fi
done

echo "report-verdict: long item truncated"
{ echo "super-roast verdict: Blocking (1 confirmed)"; echo "## Confirmed findings"; printf -- '- [Blocking] %0300d\n' 0; } > "$T/long.md"
run bash "$R" "$T/long.md"
item=$(printf '%s\n' "$out" | sed -n 3p)
case "$item" in *…) pass "truncated item ends with an ellipsis";; *) fail "truncated item ends with an ellipsis"; echo "    got: $item";; esac
assert_eq "$(printf '%s' "${item%…}" | wc -c | tr -d ' ')" 162 "kept text is '- ' plus 160 characters"

RUNS="$REPO_ROOT/docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction"

echo "report-verdict --keys: the real roast-pr-1 report"
run bash "$R" --keys "$RUNS/2026-10-16-coordinator-subagent-compaction-roast-pr-1.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$(lines "$out")" 17 "every key, uncapped"
assert_eq "$out" "$(cat "$RUNS/2026-10-16-coordinator-subagent-compaction-roast-pr-1-scope-keys.txt")" "equals the hand-written scope keys"
assert_has "$out" "[Should-fix] skills/super-code/coordinator.js:701; tests/super-code/test-run-profile.sh:337; docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/final-review-phase3.md:1" "first key, longer than 160 characters, uncut"
assert_has "$out" "[Nit] skills/super-code/MAINTENANCE.md:1266" "last key"
assert_lacks "$out" "—" "no claim text"
assert_lacks "$out" "+" "no overflow line"

echo "report-verdict --keys: the real final-review-exception review"
run bash "$R" --keys "$RUNS/final-review-exception.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$(lines "$out")" 12 "four must-fix and eight untested keys"
assert_eq "$(printf '%s\n' "$out" | grep -c '^\[Must-fix\] untested: ')" 8 "eight untested keys"
assert_eq "$(printf '%s\n' "$out" | grep -vc '^\[Must-fix\] untested: ')" 4 "four must-fix keys"
assert_eq "$(printf '%s\n' "$out" | grep -vc '^\[Must-fix\] ')" 0 "every line starts [Must-fix] "
first=$(printf '%s\n' "$out" | sed -n 1p)
case "$first" in '[Must-fix] I8 versus the Phase 5 keys files (`skills/super-auto/SKILL.md` I8'*) pass "line 1 is the I8 item";; *) fail "line 1 is the I8 item"; echo "    got: $first";; esac
case "$first" in *…) fail "line 1 is not cut";; *) pass "line 1 is not cut";; esac
assert_has "$out" "[Must-fix] untested: The spec's live checks (forced compaction on both harnesses, a profiled Codex run) are post-merge follow-ons." "untested key"

echo "report-verdict --keys: fixtures"
run bash "$R" --keys "$FX/roast-report.md"
assert_eq "$code" 0 "roast-report exits 0"
assert_eq "$out" "[Blocking] spec §A2
[Blocking] spec §B3
[Should-fix] spec §C1" "every severity of Confirmed findings; Rejected section absent"
run bash "$R" --keys "$FX/roast-many.md"
assert_eq "$(lines "$out")" 20 "roast-many: all 20 keys"
assert_lacks "$out" "more" "roast-many: no overflow line"
run bash "$R" --keys "$FX/final-review-quoted-status.md"
assert_eq "$out" "[Must-fix] skills/super-code/scripts/report-verdict: the status line wins over the verdict heading.
[Must-fix] untested: None run live." "quoted-status final review"
run bash "$R" --keys "$FX/cluster-verdict.md"
assert_eq "$out" "[Must-fix] untested: Codex entry script." "none Must-fix gives no key"
{ printf '## Verdict\nnot ready (20)\n## Must fix before landing\n'; for i in $(seq 20); do echo "- item $i"; done
  printf '## Untested scope\n'; for i in $(seq 12); do echo "- area $i"; done; } > "$T/many-mustfix.md"
run bash "$R" --keys "$T/many-mustfix.md"
assert_eq "$(lines "$out")" 32 "final review: 20 must-fix and 12 untested, uncapped"
assert_has "$out" "[Must-fix] item 20" "item 20 present"
assert_has "$out" "[Must-fix] untested: area 12" "area 12 present"
assert_lacks "$out" "more" "no overflow line"

echo "report-verdict --keys: other kinds refused"
for k in task-report step-back step-back-local assembled-digest unknown; do
  run bash "$R" --keys "$FX/$k.md"
  assert_eq "$code" 3 "$k exits 3"
  assert_eq "$out" "" "$k prints nothing on stdout"
  assert_has "$(cat "$T/err")" "report-verdict: --keys reads only a roast report or a final review: $FX/$k.md" "$k message on stderr"
done
run bash "$R" --keys
assert_eq "$code" 2 "--keys alone exits 2"
run bash "$R" --keys a b
assert_eq "$code" 2 "--keys with two files exits 2"

echo "report-verdict: bad input"
run bash "$R" "$T/nope.md"
assert_eq "$code" 2 "missing file exits 2"
assert_has "$(cat "$T/err")" "report-verdict: cannot read $T/nope.md" "missing file message on stderr"
run bash "$R"
assert_eq "$code" 2 "no argument exits 2"
run bash "$R" a b
assert_eq "$code" 2 "two arguments exit 2"

if [ "$FAILURES" -gt 0 ]; then echo "report-verdict: $FAILURES failure(s)"; exit 1; fi
echo "report-verdict: all tests passed"
