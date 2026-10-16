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
path: $FX/final-review.md" "Verdict section text and Must fix bullets"
assert_lacks "$out" "Codex entry script" "Untested scope not listed"

echo "report-verdict: cluster verdict"
run bash "$R" "$FX/cluster-verdict.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "verdict: ready
kind: final-review
path: $FX/cluster-verdict.md" "inline verdict, '- none' yields no items"

echo "report-verdict: step-back"
run bash "$R" "$FX/step-back.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "verdict: decision: patch
kind: step-back
- summary: the failing check is a one-off typo in the fixture, not a design gap
path: $FX/step-back.md" "patch: summary only"
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
