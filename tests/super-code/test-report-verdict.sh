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
  'Launch: mechanism ordinary-subagents · epic ep · invocationId ep-parser-contract · branch b · integrationWorktree /r/w · mergeCheck none' > "$T/ledger.md"
run bash "$REPO_ROOT/skills/super-code/scripts/dispatch-text" --ledger "$T/ledger.md" --stdout final-review --mode single \
  --base 1111111111111111111111111111111111111111 --head 2222222222222222222222222222222222222222
assert_eq "$code" 0 "dispatch-text builds the single-mode final-review prompt"
for needle in '"## Verdict"' '"## Must fix before landing"' '"## Untested scope"' 'no numbered lists'; do
  if printf '%s\n' "$out" | grep -qF -- "$needle"; then pass "prompt fixes $needle"; else fail "prompt fixes $needle"; fi
done

echo "report-verdict: review-file whole-file rule"
run bash "$R" --complete --source format-check "$FX/narrative-findings-subheadings.md"
assert_eq "$code" 4 "narrative Findings under sub-headings is a grammar failure"
assert_has "$(cat "$T/err")" "report-verdict: --complete: empty finding section: Findings" "names the empty Findings section"
run bash "$R" --complete --source format-check "$FX/findings-prose-preamble.md"
assert_eq "$code" 4 "prose preamble in Findings is a grammar failure"
if grep -qF "finding text without a list marker" "$T/err"; then pass "names the unmarked text"; else fail "names the unmarked text"; cat "$T/err"; fi
run bash "$R" --complete --source format-check "$FX/whole-file-rule.md"
assert_eq "$code" 0 "a file written to the whole-file rule extracts"
want=$(grep '^- ' "$FX/whole-file-rule.md" | grep -vc '^- none$')
got=$(printf '%s' "$out" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).occurrences.length))')
assert_eq "$got" "$want" "every list item of the rule-shaped file is an occurrence"
for mode in single cluster seam; do
  extra=(--dir /review/inputs)
  case "$mode" in cluster) extra=(--dir /review/inputs --cluster 1 --name source);; seam) extra=(--dir /review/inputs --reviewed none);; esac
  run bash "$REPO_ROOT/skills/super-code/scripts/dispatch-text" --ledger "$T/ledger.md" --stdout final-review --mode "$mode" \
    --base 1111111111111111111111111111111111111111 --head 2222222222222222222222222222222222222222 "${extra[@]}"
  for needle in 'mark extractable sections anywhere' '"- none"' 'no sub-headings, bold labels or prose preamble' 'report-verdict --complete --source format-check' 'only on exit 4' 'formatting only'; do
    if printf '%s\n' "$out" | grep -qF -- "$needle"; then pass "$mode prompt carries: $needle"; else fail "$mode prompt carries: $needle"; fi
  done
done

echo "report-verdict: step-back"
run bash "$R" "$FX/step-back.md"
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "verdict: decision: patch
kind: step-back
- summary: the failing check is a one-off typo in the fixture, not a design gap
path: $FX/step-back.md" "patch: summary only"
run bash "$R" "$FX/step-back-local.md"
assert_eq "$code" 0 "local exits 0"
assert_eq "$out" "verdict: decision: local
kind: step-back
- summary: the failing check is a one-off typo in the fixture, not a design gap
path: $FX/step-back-local.md" "local: summary only"
run bash "$R" "$FX/step-back-redesign.md"
assert_eq "$code" 0 "redesign exits 0"
assert_eq "$out" "verdict: decision: redesign
kind: step-back
- summary: three reviewers independently found the marker lifecycle underspecified
- changes: replace the pid marker with a session-scoped marker owned by run-marker
- scope: spec §A2, §A3 and the hook entry scripts
path: $FX/step-back-redesign.md" "redesign: summary, changes, scope"
run bash "$R" "$FX/step-back-near-miss.md"
assert_eq "$code" 0 "near-miss exits 0"
assert_lacks "$out" "verdict: decision: local" "a near-miss token (localized) is not read as local"
assert_lacks "$out" "kind: step-back" "a near-miss token is not a step-back"
assert_eq "$out" "verdict: unknown
path: $FX/step-back-near-miss.md
decision: localized
summary: s" "a near-miss token falls through to the unknown recogniser"

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
for k in task-report step-back step-back-local step-back-near-miss assembled-digest unknown; do
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

echo "report-verdict --complete: complete final-review occurrences and stable archive identity"
cat > "$T/complete-final.md" <<'EOF'
Status: DONE
## Verdict
not ready (findings retained)
## Must fix before landing
- **Keep \"quoted\" café text.**
  Evidence: src/one:7 — Ω
  - nested detail stays with this occurrence
- same finding
- same finding
## Untested scope
1. Run the live check.
## Deferred OK
* **Deferred finding** with a \\ backslash.
  Continuation preserves **formatting**.
## Deferred OK
- Another deferred occurrence.
EOF
run bash "$R" --complete --source 'run/invocation-1/final-review' "$T/complete-final.md"
assert_eq "$code" 0 "complete mode accepts a caller-supplied immutable source"
if [ "$code" = 0 ]; then
  printf '%s\n' "$out" > "$T/complete-final.json"
  run node --input-type=module - "$T/complete-final.json" "$T/complete-final.md" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const value = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.deepEqual(value, {
  version: 1, source: 'run/invocation-1/final-review', artifact: process.argv[3],
  kind: 'final-review', verdict: 'not ready (findings retained)',
  occurrences: [
    {section:'Must fix before landing', position:1, key:'**Keep \\"quoted\\" café text.**',
     text:'**Keep \\"quoted\\" café text.**\n  Evidence: src/one:7 — Ω\n  - nested detail stays with this occurrence'},
    {section:'Must fix before landing', position:2, key:'same finding', text:'same finding'},
    {section:'Must fix before landing', position:3, key:'same finding', text:'same finding'},
    {section:'Untested scope', position:1, key:'Run the live check.', text:'Run the live check.'},
    {section:'Deferred OK', position:1, key:'**Deferred finding** with a \\\\ backslash.',
     text:'**Deferred finding** with a \\\\ backslash.\n  Continuation preserves **formatting**.'},
    {section:'Deferred OK', position:2, key:'Another deferred occurrence.', text:'Another deferred occurrence.'},
  ],
});
NODE
  assert_eq "$code" 0 "all relevant sections, repeated occurrences and original text survive JSON encoding"
  run bash "$R" --complete --source 'run/invocation-1/final-review' "$T/complete-final.md"
  assert_eq "$out" "$(cat "$T/complete-final.json")" "repeat parsing is deterministic"
  cp "$T/complete-final.md" "$T/archive-final.md"
  run bash "$R" --complete --source 'run/invocation-1/final-review' "$T/archive-final.md"
  printf '%s\n' "$out" > "$T/archive-final.json"
  run node --input-type=module - "$T/complete-final.json" "$T/archive-final.json" "$T/archive-final.md" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const original = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const archive = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
assert.equal(archive.artifact, process.argv[4]);
assert.equal(archive.source, original.source);
assert.deepEqual(archive.occurrences, original.occurrences);
NODE
  assert_eq "$code" 0 "archiving changes artifact path but preserves source and occurrence identities"
fi

echo "report-verdict --complete: every roast finding section and severity"
cat > "$T/complete-roast.md" <<'EOF'
super-roast verdict: Blocking (4 confirmed)
## Confirmed findings
- [Blocking] a:1 — broken
  evidence: actual proof
- [Should-fix] b:2 — smaller
- [Nit] c:3 — nit
- [FYI] d:4 — context
## Not verified (beyond panel cap)
- [suggested Blocking] e:5 — unjudged
## Not verified (dedupe failed or judge lost)
- [unrated] f:6 — judge lost
## Beyond remainder cap (count only)
- 2 candidates dropped by the remainder cap
## Rejected (with reason)
- [Blocking] g:7 — rejected claim
  evidence: retained reason
## Unverified nits (spot-checked)
- [Nit] h:8 — uncertain
## Escalations (need human)
- [Blocking] i:9 — unsettled panel
## Deferred findings
- [Should-fix] j:10 — deferred
EOF
run bash "$R" --complete --source 'invocation/roast' "$T/complete-roast.md"
assert_eq "$code" 0 "roast complete mode exits 0"
if [ "$code" = 0 ]; then
  printf '%s\n' "$out" > "$T/complete-roast.json"
  run node --input-type=module - "$T/complete-roast.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {kind, verdict, occurrences:o} = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(kind, 'roast');
assert.equal(verdict, 'Blocking (4 confirmed)');
assert.deepEqual(o.map(x => x.section), [
  'Confirmed findings', 'Confirmed findings', 'Confirmed findings', 'Confirmed findings',
  'Not verified (beyond panel cap)', 'Not verified (dedupe failed or judge lost)',
  'Beyond remainder cap (count only)', 'Rejected (with reason)', 'Unverified nits (spot-checked)',
  'Escalations (need human)', 'Deferred findings',
]);
assert.deepEqual(o.map(x => x.position), [1,2,3,4,1,1,1,1,1,1,1]);
assert.deepEqual(o.map(x => x.key), ['[Blocking] a:1','[Should-fix] b:2','[Nit] c:3','[FYI] d:4',
  '[suggested Blocking] e:5','[unrated] f:6','2 candidates dropped by the remainder cap',
  '[Blocking] g:7','[Nit] h:8','[Blocking] i:9','[Should-fix] j:10']);
assert.equal(o[0].text, '[Blocking] a:1 — broken\n  evidence: actual proof');
assert.equal(o[7].text, '[Blocking] g:7 — rejected claim\n  evidence: retained reason');
NODE
  assert_eq "$code" 0 "all roast routes, severities, reason text and section-local positions are retained"
fi

echo "report-verdict --complete: uncapped extraction"
run bash "$R" --complete --source 'invocation/many' "$T/many-mustfix.md"
assert_eq "$code" 0 "large final review accepted"
if [ "$code" = 0 ]; then
  printf '%s\n' "$out" > "$T/many.json"
  run node --input-type=module - "$T/many.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const o = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).occurrences;
assert.equal(o.length, 32);
assert.deepEqual(o[31], {section:'Untested scope',position:12,key:'area 12',text:'area 12'});
NODE
  assert_eq "$code" 0 "complete extraction has no default item caps"
fi
run bash "$R" --complete --source 'invocation/long' "$T/long.md"
assert_eq "$code" 0 "long roast accepted"
if [ "$code" = 0 ]; then
  printf '%s\n' "$out" > "$T/long.json"
  run node --input-type=module - "$T/long.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {key,text} = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).occurrences[0];
assert.equal(text, '[Blocking] ' + '0'.repeat(300));
assert.equal(key, text);
NODE
  assert_eq "$code" 0 "complete extraction does not truncate keys or text"
fi

echo "report-verdict --complete: task concerns, bold labels and valid explicit empty reviews"
cat > "$T/complete-task.md" <<'EOF'
Status: IMPLEMENTED
**Concerns:**
- Still has an unmeasured path.
**Deferred:**
- Retain this even after a success status.
EOF
run bash "$R" --complete --source 'invocation/task' "$T/complete-task.md"
assert_eq "$code" 0 "task report with successful status can retain concerns"
if [ "$code" = 0 ]; then
  printf '%s\n' "$out" > "$T/task.json"
  run node --input-type=module - "$T/task.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const value = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(value.kind, 'task-report');
assert.equal(value.verdict, 'IMPLEMENTED');
assert.deepEqual(value.occurrences.map(x=>x.text), ['Still has an unmeasured path.', 'Retain this even after a success status.']);
NODE
  assert_eq "$code" 0 "successful task status does not erase concern/deferred occurrences"
fi
printf '## Verdict\nready\n## Must fix before landing\n- none\n## Untested scope\n- none\n## Deferred OK\n- none\n' > "$T/explicit-empty.md"
run bash "$R" --complete --source 'invocation/empty' "$T/explicit-empty.md"
assert_eq "$code" 0 "recognized explicitly empty review succeeds"
if [ "$code" = 0 ]; then
  printf '%s\n' "$out" > "$T/empty.json"
  run node --input-type=module - "$T/empty.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
assert.deepEqual(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).occurrences, []);
NODE
  assert_eq "$code" 0 "explicit none markers are not findings"
fi

echo "report-verdict --complete: invalid or incomplete input cannot look clean"
printf '## Verdict\n\n## Must fix before landing\n- none\n' > "$T/no-verdict.md"
printf '## Verdict\nready\n' > "$T/no-sections.md"
printf '## Verdict\nready\n## Must fix before landing\nunfinished prose without a finding marker\n' > "$T/malformed-section.md"
printf 'super-roast verdict: \n## Confirmed findings\n- none\n' > "$T/empty-roast-verdict.md"
printf '## Verdict\nready\n## Must fix before landing\n' > "$T/truncated-section.md"
for invalid in "$T/nope.md" "$T" "$FX/unknown.md" "$T/no-verdict.md" "$T/no-sections.md" "$T/malformed-section.md" "$T/empty-roast-verdict.md" "$T/truncated-section.md"; do
  run bash "$R" --complete --source 'invocation/invalid' "$invalid"
  if [ "$code" -ne 0 ]; then pass "$(basename "$invalid"): explicit failure"; else fail "$(basename "$invalid"): explicit failure"; fi
  assert_eq "$out" "" "$(basename "$invalid"): no success JSON"
  if [ -s "$T/err" ]; then pass "$(basename "$invalid"): diagnostic on stderr"; else fail "$(basename "$invalid"): diagnostic on stderr"; fi
done
for source in '' '   '; do
  run bash "$R" --complete --source "$source" "$T/explicit-empty.md"
  assert_eq "$code" 2 "empty source identity exits 2"
  assert_eq "$out" "" "empty source identity has no success output"
done
run bash "$R" --complete "$T/explicit-empty.md"
assert_eq "$code" 2 "missing --source exits 2"
run bash "$R" --complete --source identity
assert_eq "$code" 2 "missing artifact exits 2"

echo "report-verdict --complete: sub-headings, fences and exit codes"
SUBTAIL='## Untested scope\n- none\n'
printf "## Verdict\nnot ready (x)\n## Must fix before landing\n- a\n### detail\n- b\n$SUBTAIL" > "$T/sub-after-items.md"
printf "## Verdict\nnot ready (x)\n## Must fix before landing\n- a\n**Note**\n- b\n$SUBTAIL" > "$T/bold-after-items.md"
printf '## Verdict\nready\n**Findings**\n- a\n**Note** text\n- b\n' > "$T/bold-opened-subbold.md"
printf '## Verdict\nnot ready (x)\n## Must fix before landing\n- a\n## Untested scope\n- u\n### Deferred OK\n- d\n' > "$T/back-to-back.md"
printf '## Verdict\nnot ready (x)\n## Findings\n- f1\n## Analysis\nnarrative prose here\n' > "$T/findings-then-analysis.md"
printf '## Verdict\nnot ready (x)\n## Must fix before landing\n- first\n```\n# reproduce\n```\n- second\n## Untested scope\n- none\n' > "$T/fenced.md"
printf '## Verdict\nnot ready (x)\n## Must fix before landing\n- first\n   ~~~\n# reproduce\n   ~~~\n- second\n## Untested scope\n- none\n' > "$T/fenced-tilde.md"

for f in sub-after-items bold-after-items bold-opened-subbold; do
  run bash "$R" --complete --source 'invocation/sub' "$T/$f.md"
  assert_eq "$code" 4 "$f: exits 4"
  assert_eq "$out" "" "$f: no success JSON"
  case "$(cat "$T/err")" in "report-verdict: --complete: sub-heading inside "*) pass "$f: grammar prefix and message";; *) fail "$f: grammar prefix and message"; cat "$T/err";; esac
done
run bash "$R" --complete --source 'invocation/sub' "$T/sub-after-items.md"
assert_has "$(cat "$T/err")" "report-verdict: --complete: sub-heading inside Must fix before landing: ### detail" "sub-heading error names the section and line"

occ() { node --input-type=module - "$1" <<'NODE'
const j = JSON.parse(process.argv[2]);
console.log(j.occurrences.map(o => `${o.section}|${o.position}|${o.key}`).join('\n'));
NODE
}
run bash "$R" --complete --source 'invocation/b2b' "$T/back-to-back.md"
assert_eq "$code" 0 "back-to-back recognized sections: exits 0"
assert_eq "$(occ "$out")" "Must fix before landing|1|a
Untested scope|1|u
Deferred OK|1|d" "recognized deeper label is a sibling, not a sub-heading"
run bash "$R" --complete --source 'invocation/fta' "$T/findings-then-analysis.md"
assert_eq "$code" 0 "Findings then Analysis: exits 0"
assert_eq "$(occ "$out")" "Findings|1|f1" "same-level unrecognized heading is a sibling; its prose is ignored"
for f in fenced fenced-tilde; do
  run bash "$R" --complete --source 'invocation/fence' "$T/$f.md"
  assert_eq "$code" 0 "$f: exits 0"
  assert_eq "$(occ "$out")" "Must fix before landing|1|first
Must fix before landing|2|second" "$f: fence line is not a heading; both items extracted"
done

# strictDraft copy: same bytes, driven through the exported boundedReport.
cat > "$T/strict.cjs" <<'NODE'
const fs = require('node:fs');
const {boundedReport} = require(process.argv[2]);
try { boundedReport(fs.readFileSync(process.argv[3], 'utf8'), {}); console.log('ok'); }
catch (e) { console.log('throws: ' + e.message); }
NODE
AA="$REPO_ROOT/skills/super-code/scripts/assembly-archive.cjs"
for f in sub-after-items bold-after-items; do
  run node "$T/strict.cjs" "$AA" "$T/$f.md"
  assert_eq "$out" "throws: draft sub-heading inside a finding section" "$f: strictDraft rejects"
done
for f in fenced fenced-tilde back-to-back; do
  run node "$T/strict.cjs" "$AA" "$T/$f.md"
  assert_eq "$out" "ok" "$f: strictDraft accepts"
done
printf '## Verdict\nnot ready (x)\n## Findings\n- f1\n## Analysis\nnarrative prose here\n## Untested scope\n- none\n' > "$T/fta-strict.md"
run node "$T/strict.cjs" "$AA" "$T/fta-strict.md"
assert_eq "$out" "ok" "Findings then Analysis: strictDraft accepts"

printf '\xff\xfe' > "$T/bad-utf8.md"
for g in "$FX/unknown.md" "$T/no-verdict.md" "$T/no-sections.md" "$T/malformed-section.md" "$T/empty-roast-verdict.md" "$T/truncated-section.md"; do
  run bash "$R" --complete --source 'invocation/grammar' "$g"
  assert_eq "$code" 4 "$(basename "$g"): grammar failure exits 4"
done
for g in "$T/nope.md" "$T" "$T/bad-utf8.md"; do
  run bash "$R" --complete --source 'invocation/io' "$g"
  assert_eq "$code" 2 "$(basename "$g"): unreadable artifact exits 2"
  case "$(cat "$T/err")" in "report-verdict: --complete: "*) pass "$(basename "$g"): stderr prefix";; *) fail "$(basename "$g"): stderr prefix";; esac
done
run bash "$R" --complete --source '' "$T/explicit-empty.md"
assert_eq "$code" 2 "empty source id exits 2 (grammar block)"

echo "report-verdict: --repair-check accepts only marker additions"
RC_HDR='super-roast verdict: Should-fix (2 confirmed)
mode: PR        iteration: 1 of 3
'
RC_CONF='## Confirmed findings
- [Should-fix] a.sh:3 — first finding
  continuation for the first finding
- [Should-fix] b.sh:9 — second finding
'
RC_PROSE='One refute-seat pass each; not panel-strength verification.'
rc_mk() { # file rejected-body prose-line subheading-line
  printf '%s\n%s\n## Rejected (with reason)\n%s\n\n## Unverified nits (spot-checked)\n%s\n- [Nit] c.sh:1 — a nit\n%s\n- [Nit] d.sh:2 — another nit\n' "$RC_HDR" "$RC_CONF" "$2" "$3" "$4" > "$1"
}
# originals: all three defects, or exactly one defect each
rc_mk "$T/repair-orig.md" "" "$RC_PROSE" "### detail"
rc_mk "$T/repair-orig-prose.md" "- none" "$RC_PROSE" "- detail"
rc_mk "$T/repair-orig-empty.md" "" "- $RC_PROSE" "- detail"
rc_mk "$T/repair-orig-subheading.md" "- none" "- $RC_PROSE" "### detail"
rc_mk "$T/repaired.md" "- none" "- $RC_PROSE" "- detail"
for pair in prose empty subheading; do
  run bash "$R" --repair-check "$T/repair-orig-$pair.md" "$T/repaired.md"
  assert_eq "$code" 0 "single edit ($pair): accepted"
  assert_eq "$(cat "$T/err")" "" "single edit ($pair): no stderr"
done
run bash "$R" --repair-check "$T/repair-orig.md" "$T/repaired.md"
assert_eq "$code" 0 "all three edits: accepted"
awk '/^## /{body=1} !body || NF' "$T/repaired.md" > "$T/repaired-noblank.md"  # header blanks are checked by (ii)
run bash "$R" --repair-check "$T/repair-orig.md" "$T/repaired-noblank.md"
assert_eq "$code" 0 "all three edits, section blank lines dropped: accepted"

rc_rej() { # name check repair-file
  run bash "$R" --repair-check "$T/repair-orig.md" "$3"
  assert_eq "$code" 4 "$1: exits 4"
  assert_eq "$out" "" "$1: empty stdout"
  case "$(cat "$T/err")" in "report-verdict: --repair-check: "*"$2"*) pass "$1: stderr names $2";; *) fail "$1: stderr names $2"; echo "    got: $(cat "$T/err")";; esac
}
sed '/d.sh:2/d' "$T/repaired.md" > "$T/r1.md"; rc_rej "item dropped" "(iv)" "$T/r1.md"
sed 's/another nit/another nit, reworded/' "$T/repaired.md" > "$T/r2.md"; rc_rej "item reworded" "(iv)" "$T/r2.md"
sed '/continuation for/d' "$T/repaired.md" > "$T/r3.md"; rc_rej "continuation dropped" "(iv)" "$T/r3.md"
sed 's/continuation for the first/continuation for the 1st/' "$T/repaired.md" > "$T/r4.md"; rc_rej "continuation reworded" "(iv)" "$T/r4.md"
sed 's/^## Rejected (with reason)$/## Rejected/' "$T/repaired.md" > "$T/r5.md"; rc_rej "heading renamed" "(iv)" "$T/r5.md"
{ cat "$T/repaired.md"; printf '## Escalations (need human)\n- none\n'; } > "$T/r6.md"; rc_rej "heading added" "(iv)" "$T/r6.md"
sed -e '/c.sh:1/d' -e 's/^## Rejected (with reason)$/&\n- [Nit] c.sh:1 — a nit/' "$T/repaired.md" > "$T/r7.md"; rc_rej "item moved to another section" "(iv)" "$T/r7.md"
sed 's/^mode: PR /mode: diff /' "$T/repaired.md" > "$T/r8.md"; rc_rej "header line changed" "(ii)" "$T/r8.md"
sed 's/a.sh:3/a.sh:4/' "$T/repaired.md" > "$T/r9.md"; rc_rej "--keys output changed" "(iii)" "$T/r9.md"
sed '/^- none$/d' "$T/repaired.md" > "$T/r10.md"; rc_rej "repair fails --complete" "(i)" "$T/r10.md"

run bash "$R" --repair-check "$T/repair-orig.md"
assert_eq "$code" 2 "one argument exits 2"
run bash "$R" --repair-check "$T/repair-orig.md" "$T/repaired.md" "$T/repaired.md"
assert_eq "$code" 2 "three file arguments exit 2"
run bash "$R" --repair-check "$T/nope.md" "$T/repaired.md"
assert_eq "$code" 2 "missing ORIGINAL exits 2"
run bash "$R" --repair-check "$T/repair-orig.md" "$T/nope.md"
assert_eq "$code" 2 "missing REPAIR exits 2"

echo "report-verdict --complete: roast report body rule"
run bash "$R" --complete --source format-check "$FX/roast-unverified-nits-prose.md"
assert_eq "$code" 4 "prose preamble in Unverified nits: grammar failure exits 4"
assert_eq "$out" "" "prose preamble in Unverified nits: empty stdout"
case "$(cat "$T/err")" in *"finding text without a list marker in Unverified nits"*) pass "prose preamble: error names the section";; *) fail "prose preamble: error names the section"; cat "$T/err";; esac
run bash "$R" --complete --source format-check "$FX/roast-template-shaped.md"
assert_eq "$code" 0 "template-shaped roast report: exits 0"
assert_eq "$(node -e 'const j = JSON.parse(process.argv[1]); console.log(j.occurrences.length)' "$out")" 7 "template-shaped: all seven items extracted"
assert_eq "$(node -e 'const j = JSON.parse(process.argv[1]); console.log(j.occurrences.map(o => o.section).join("\n"))' "$out")" "Confirmed findings
Not verified (beyond panel cap)
Not verified (dedupe failed or judge lost)
Beyond remainder cap (count only)
Rejected (with reason)
Unverified nits (spot-checked)
Escalations (need human)" "template-shaped: one occurrence per section"

flat() { tr '\n' ' ' < "$1" | tr -s ' '; }
RP=$(flat "$REPO_ROOT/skills/super-roast/reporter-prompt.md")
SR=$(flat "$REPO_ROOT/skills/super-roast/SKILL.md")
SA=$(flat "$REPO_ROOT/skills/super-auto/SKILL.md")
SD=$(flat "$REPO_ROOT/skills/super-design/SKILL.md")
has() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing: $2"; fi; }
has "$RP" 'only `- ` items' "reporter-prompt: body rule, list items only"
has "$RP" 'no prose preamble, sub-headings or bold labels' "reporter-prompt: body rule, no preamble"
has "$SR" 'only `- ` items' "super-roast SKILL: body rule, list items only"
has "$SR" 'no prose preamble, sub-headings or bold labels' "super-roast SKILL: body rule, no preamble"
for phrase in '--complete --source format-check' 'only on exit 4' '-format-repair.md' '--repair-check' 'report format repair:' "round's report path"; do
  has "$SR" "$phrase" "super-roast SKILL write step: $phrase"
done
has "$SA" "record and pass the round's report path" "super-auto SKILL: round's report path"
has "$SD" "is the round's report path from super-roast's write step" "super-design SKILL: round's report path"

echo "report-verdict: --repair-check rule (iv) guards every marker addition"
sed 's/^  continuation for the first finding$/-   continuation for the first finding/' "$T/repaired.md" > "$T/r11.md"
rc_rej "indented continuation given a marker" "(iv)" "$T/r11.md"
sed 's/^## Rejected (with reason)$/- &/' "$T/repaired.md" > "$T/r12.md"
rc_rej "## heading demoted to an item" "(iv)" "$T/r12.md"
rc_mk "$T/repair-orig-bold.md" "- none" "- $RC_PROSE" "**Escalations**"
rc_mk "$T/repair-bold-generic.md" "- none" "- $RC_PROSE" "- **Escalations**"
rc_mk "$T/repair-bold-demoted.md" "- none" "- $RC_PROSE" "- Escalations"
for v in generic demoted; do
  run bash "$R" --repair-check "$T/repair-orig-bold.md" "$T/repair-bold-$v.md"
  assert_eq "$code" 4 "recognized-word bold label ($v): exits 4"
  assert_eq "$out" "" "recognized-word bold label ($v): empty stdout"
  case "$(cat "$T/err")" in "report-verdict: --repair-check: "*"(iv)"*) pass "recognized-word bold label ($v): stderr names (iv)";; *) fail "recognized-word bold label ($v): stderr names (iv)"; echo "    got: $(cat "$T/err")";; esac
done
rc_mk "$T/repair-orig-note.md" "- none" "- $RC_PROSE" "**Note**"
rc_mk "$T/repair-note.md" "- none" "- $RC_PROSE" "- Note"
run bash "$R" --repair-check "$T/repair-orig-note.md" "$T/repair-note.md"
assert_eq "$code" 0 "unrecognized bold label demoted to an item: accepted"

if [ "$FAILURES" -gt 0 ]; then echo "report-verdict: $FAILURES failure(s)"; exit 1; fi
echo "report-verdict: all tests passed"
