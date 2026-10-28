#!/usr/bin/env bash
# Breaks caught: the review-continuity pieces each passing alone while the hand-offs between them
# fail: a report written to the producers' own format rules failing report-verdict --complete;
# a retained report losing its source extraction; a product-only range blocked by an untouched old
# run; readiness derived from review-inputs.json rejected by super-roast; a scope decision with no
# finding-route going unreported; a format repair that is not retained or that replaces the original;
# the reporter template and reviewFileFormat() drifting apart. Real scripts, real git, no mocks.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILLS="$REPO_ROOT/skills"
RV="$SKILLS/super-code/scripts/report-verdict"
RS="$SKILLS/super-auto/scripts/report-status"
SD="$SKILLS/super-auto/scripts/scope-dispositions"
DT="$SKILLS/super-code/scripts/dispatch-text.mjs"
AA="$SKILLS/super-roast/scripts/assemble-args"
FIX="$REPO_ROOT/tests/super-code/fixtures/report-verdict"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0
export GIT_AUTHOR_NAME=fixture GIT_AUTHOR_EMAIL=fixture@example.test GIT_COMMITTER_NAME=fixture GIT_COMMITTER_EMAIL=fixture@example.test

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
# run CMD...: sets code, out (stdout) and err (stderr) without tripping set -e.
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; err=$(cat "$T/err"); }
g() { git -c commit.gpgsign=false -c core.hooksPath=/dev/null "$@"; }
sha() { shasum -a 256 "$1" | cut -d' ' -f1; }
# Pin check: a bare git write call would use the ambient identity, signing and hooks.
if grep -nE '(^|[^[:alnum:]_./-])git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?(commit|merge|rebase|cherry-pick|checkout|switch|init|add|rm|tag|branch|worktree|reset|revert|am)([[:space:]]|$)' "$0"; then fail "a bare git write call bypasses g"; else pass "every git write call goes through g"; fi
q() { node -e 'const d=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(new Function("d","return "+process.argv[2])(d))' "$1" "$2"; }
rec() { printf -- '- %s · %s\n' "$1" "$2"; } # rec TYPE JSON-or-text

# ---------------------------------------------------------------------------------------------
echo "S1 final-review shape (live reviewFileFormat() text) and collection"
# Load the live rule from coordinator.js so the test never holds a copy of it.
node - "$SKILLS/super-code/coordinator.js" >"$T/format.txt" <<'NODE'
const fs = require('node:fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
const start = src.indexOf('function reviewFileFormat(');
const end = src.indexOf('\n}\n', start);
if (start < 0 || end < 0) { console.error('reviewFileFormat() not found'); process.exit(1); }
const body = src.slice(start, end + 3);
process.stdout.write(new Function('codeSkill', body + '\nreturn reviewFileFormat("FILE");')('SKILL'));
NODE
for h in '## Verdict' '## Must fix before landing' '## Untested scope' '## Deferred OK'; do
  grep -qF "\"$h\"" "$T/format.txt" && pass "live rule names heading $h" || fail "live rule names heading $h"
done

WS="$T/s1/workspace"; RUN1="$T/s1/run.md"; REVIEW1="$WS/final-review-inv-e2e.md"
mkdir -p "$WS/inputs"
echo 'required source bytes' >"$WS/inputs/required.txt"
printf 'flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n' >"$RUN1"
# Narrative sits under headings with none of the marker words; the four closing sections follow the rule.
cat >"$REVIEW1" <<'EOF'
# Whole-epic review

## Walkthrough
The review path was read end to end against the spec.

## Verdict
ready

## Must fix before landing
- none

## Untested scope
- native macOS hardware path
  needs a second machine

## Deferred OK
- none
EOF
run bash "$RV" --complete --source inv-e2e/final "$REVIEW1"
assert_eq "$code" 0 "S1 report in reviewFileFormat() shape passes --complete"
printf '%s\n' "$out" >"$T/s1.json"
assert_eq "$(q "$T/s1.json" 'd.kind+" "+d.verdict+" "+d.occurrences.length')" "final-review ready 1" "S1 extraction is the final-review with the one untested item"

# Break the same file the way the rule forbids (bold label inside a section): --complete must reject it.
sed 's/^- none$/**Note:** nothing/' "$REVIEW1" >"$T/s1-bad.md"
run bash "$RV" --complete --source format-check "$T/s1-bad.md"
assert_eq "$code" 4 "S1 a bold label inside a section is a grammar failure (exit 4)"

run bash "$RS" --collect "$RUN1" --invocation inv-e2e --workspace "$WS" --review "$REVIEW1" --verdict ready --required inputs/required.txt
assert_eq "$code" 0 "S1 report-status --collect exits 0"
[ "$(grep -c '^- review-collection · ' "$RUN1")" -ge 1 ] && pass "S1 review-collection record appended" || fail "S1 review-collection record appended"
assert_eq "$(grep '^- review-collection · ' "$RUN1" | tail -n 1 | sed 's/^- review-collection · //' | node -e 'const r=JSON.parse(require("fs").readFileSync(0,"utf8"));console.log(r.complete+" "+r.review+" "+r.reviewPath)')" "true ready $REVIEW1" "S1 latest record is complete and names the review file"

# ---------------------------------------------------------------------------------------------
echo "S2 roast template shape and retention"
run bash "$RV" --complete --source roast-code/round-1 "$FIX/roast-template-shaped.md"
assert_eq "$code" 0 "S2 template-shaped roast report passes --complete"
printf '%s\n' "$out" >"$T/s2.json"
assert_eq "$(q "$T/s2.json" 'd.occurrences.length')" "7" "S2 one occurrence for each of the seven sections"

# Build a run.md retaining a report: roast-code pointer + finding-source (+ root-acceptance declaring it).
# retain_run RUN REPORT EXTRACTION-JSON [with-source]
retain_run() {
  local run=$1 report=$2 ext=$3 with_source=${4:-yes}
  { printf 'flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\nroast-code: %s\napprovals:\n' "$report"
    [ "$with_source" = yes ] && rec finding-source "$(cat "$ext")"
    true
  } >"$run"
}
# acceptance_gaps RUN: prints the acceptance output; the source-coverage gap text is what we look for.
GAP='declared report has no retained source extraction'
acceptance_out() { run bash "$RS" --acceptance "$1" --tree "$(printf 'a%.0s' $(seq 40))"; printf '%s\n%s\n' "$out" "$err"; }

mkdir -p "$T/s2"
cp "$FIX/roast-template-shaped.md" "$T/s2/roast-code-1.md"
run bash "$RV" --complete --source roast-code/round-1 "$T/s2/roast-code-1.md"; printf '%s\n' "$out" >"$T/s2/ext.json"
retain_run "$T/s2/run.md" "$T/s2/roast-code-1.md" "$T/s2/ext.json"
run bash "$RS" "$T/s2/run.md"
assert_eq "$code" 0 "S2 report-status exits 0"
case "$out$err" in *'finding projection unavailable'*) fail "S2 finding projection ran: $out" ;; *'outstanding findings: '*) pass "S2 finding projection ran and reported outstanding findings" ;; *) fail "S2 finding projection ran and reported outstanding findings: $out" ;; esac
case "$out$err" in *'finding evidence'*|*'review collection'*) fail "S2 retained roast source leaves status qualifiers: $out" ;; *) pass "S2 report-status prints no finding evidence or review collection qualifier" ;; esac
acceptance_out "$T/s2/run.md" >"$T/s2/acc.txt"
if grep -qF "$GAP" "$T/s2/acc.txt"; then fail "S2 acceptance reports a source-coverage gap for a retained report"; else pass "S2 acceptance has no source-coverage gap for the retained report"; fi
# Negative control: without the finding-source record the same acceptance run does name the gap.
retain_run "$T/s2/run-nosource.md" "$T/s2/roast-code-1.md" "$T/s2/ext.json" no
acceptance_out "$T/s2/run-nosource.md" >"$T/s2/acc-no.txt"
if grep -qF "$GAP" "$T/s2/acc-no.txt"; then pass "S2 control: omitting the extraction record surfaces the coverage gap"; else fail "S2 control: omitting the extraction record should surface the coverage gap"; cat "$T/s2/acc-no.txt"; fi

# ---------------------------------------------------------------------------------------------
echo "S3 range-scoped provenance and readiness"
# Real git repo (Task 4's fixture shape): an untouched prior run with an incomplete collection, then
# a product-only commit.
REC='- review-collection · {"invocationId": "old-inv", "workspace": "/prior/workspace", "reviewPath": null, "review": "no work landed", "required": [], "settled": true, "complete": false, "gaps": ["retained prior failure"], "files": []}'
R="$T/s3repo"; mkdir -p "$R"; cd "$R"; g init -q
printf 'Launch: args {"epicId":"t","integrationBranch":"main","integrationWorktree":"%s","invocationId":"new-inv"}\n' "$R" >"$T/ledger.md"
echo zero >product.txt; g add -A; g commit -qm zero
mkdir -p docs/prior/reviews/old-inv
printf '# Prior run\napprovals:\n%s\n' "$REC" >docs/prior/run.md
echo old >docs/prior/reviews/old-inv/final-review-old-inv.md
echo one >product.txt; g add -A; g commit -qm prior; B=$(g rev-parse HEAD)
echo two >product.txt; g commit -qam product; H=$(g rev-parse HEAD)
run node "$DT" --ledger "$T/ledger.md" review-inputs --base "$B" --head "$H" --out-dir "$T/s3out"
assert_eq "$code" 0 "S3 product-only range exits 0 despite the untouched incomplete run"
J="$T/s3out/review-inputs.json"
cd "$REPO_ROOT"
assert_eq "$(node -e 'const d=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(d.status+" "+d.gaps.length+" "+(d.outOfRange.length>0)+" "+(d.base===process.argv[2])+" "+(d.head===process.argv[3]))' "$J" "$B" "$H")" "complete 0 true true true" "S3 review-inputs.json: complete, no gaps, outOfRange non-empty, base/head are the captured SHAs"

# Phase-4 readiness derivation (skills/super-auto/SKILL.md phase 4): exit 0 + status complete + empty
# gaps + base/head equal to the captured SHAs => complete/available with the stated basis.
node - "$J" "$B" "$H" "$T/readiness.json" <<'NODE'
const fs = require('node:fs');
const [file, base, head, out] = process.argv.slice(2);
const j = JSON.parse(fs.readFileSync(file, 'utf8'));
const ok = j.status === 'complete' && Array.isArray(j.gaps) && j.gaps.length === 0 && j.base === base && j.head === head;
const readiness = ok
  ? { coverage: 'complete', provenance: 'available', basis: `${file}: status complete, no gaps, captured ${base}..${head}` }
  : { coverage: 'unknown', provenance: 'unavailable', basis: 'assembler: unavailable — review-inputs.json not complete' };
fs.writeFileSync(out, JSON.stringify(readiness));
NODE
assert_eq "$(q "$T/readiness.json" 'd.coverage+"/"+d.provenance')" "complete/available" "S3 derivation yields complete/available"
run bash "$AA" --mode pr --inputs x --diff-stat 'M product.txt' --review-readiness "@$T/readiness.json" --out "$T/aa.json"
assert_eq "$code" 0 "S3 assemble-args accepts the derived readiness"
assert_eq "$(q "$T/aa.json" 'd.reviewReadiness.coverage+"/"+d.reviewReadiness.provenance+"/"+d.reviewReadiness.basis.includes("captured ")')" "complete/available/true" "S3 reviewReadiness is preserved in the engine args"

# ---------------------------------------------------------------------------------------------
echo "S4 scope-filter bookkeeping"
mkdir -p "$T/s4"
cp "$FIX/roast-template-shaped.md" "$T/s4/roast-code-1.md"
run bash "$RV" --complete --source roast-code/round-1 "$T/s4/roast-code-1.md"; printf '%s\n' "$out" >"$T/s4/ext.json"
ref() { printf '{"source":"roast-code/round-1","section":"%s","position":1}' "$1"; }
write_s4() { # $1 = run.md; $2 = "no-punch-route" drops the punch-list decision's route
  { printf 'flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\nroast-code: %s\napprovals:\n' "$T/s4/roast-code-1.md"
    rec finding-source "$(cat "$T/s4/ext.json")"
    # one fix route (in-scope decision), one deferred route (punch-list decision), one pending-human route
    rec finding-route "{\"ref\":$(ref 'Confirmed findings'),\"fix\":\"bead x\"}"
    [ "${2:-}" = no-punch-route ] || rec finding-route "{\"ref\":$(ref 'Unverified nits (spot-checked)'),\"deferred\":\"punch-listed\"}"
    rec finding-route "{\"ref\":$(ref 'Escalations (need human)'),\"owner\":\"human\"}"
    echo 'scopeFilter-round-1: [Should-fix] src/a.sh:10 in-scope — goal'
    echo 'scopeFilter-round-1: [Nit] src/a.sh:3 punch-list — formatting'
    echo 'scope-filter: 1 in-scope · 1 punch-listed'
  } >"$1"
}
write_s4 "$T/s4/run.md"
run bash "$SD" --project "$T/s4/run.md"
assert_eq "$code" 0 "S4 run.md written per the disposition instructions exits 0"
assert_eq "$(printf '%s' "$out" | node -e 'const p=JSON.parse(require("fs").readFileSync(0,"utf8"));console.log(p.gaps.length+" "+p.metrics.unrouted)')" "0 0" "S4 no bookkeeping gap, zero unrouted"
write_s4 "$T/s4/run-gap.md" no-punch-route
run bash "$SD" --project "$T/s4/run-gap.md"
assert_eq "$code" 3 "S4 with the punch-list route removed exits 3"
assert_eq "$(printf '%s' "$out" | node -e 'const p=JSON.parse(require("fs").readFileSync(0,"utf8"));console.log(p.gaps.map(g=>g.message).join("|"))')" "scope-filter decision without finding-route: round 1 [Nit] src/a.sh:3" "S4 exactly the removed decision is named"

# ---------------------------------------------------------------------------------------------
echo "S5 roast format repair"
mkdir -p "$T/s5"
ORIG="$T/s5/roast-pr-1.md"; REPAIR="$T/s5/roast-pr-1-format-repair.md"
cp "$FIX/roast-unverified-nits-prose.md" "$ORIG"
ORIG_SHA=$(sha "$ORIG")
run bash "$RV" --complete --source format-check "$ORIG"
assert_eq "$code" 4 "S5 prose under Unverified nits is a grammar failure (exit 4)"
# The repair the re-dispatched reporter writes: formatting only, the prose line becomes an item.
sed 's/^One refute-seat pass each; not panel-strength verification\.$/- &/' "$ORIG" >"$REPAIR"
run bash "$RV" --repair-check "$ORIG" "$REPAIR"
assert_eq "$code" 0 "S5 --repair-check accepts the formatting-only repair"
run bash "$RV" --complete --source roast-code/round-1 "$REPAIR"
assert_eq "$code" 0 "S5 repaired report passes --complete"
printf '%s\n' "$out" >"$T/s5/ext.json"
assert_eq "$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).artifact===process.argv[2])' "$T/s5/ext.json" "$REPAIR")" "true" "S5 extraction artifact is the repair path"
retain_run "$T/s5/run.md" "$REPAIR" "$T/s5/ext.json"
run bash "$RS" "$T/s5/run.md"
assert_eq "$code" 0 "S5 report-status exits 0"
case "$out$err" in *'finding projection unavailable'*) fail "S5 finding projection ran: $out" ;; *'outstanding findings: '*) pass "S5 finding projection ran and reported outstanding findings" ;; *) fail "S5 finding projection ran and reported outstanding findings: $out" ;; esac
case "$out$err" in *'finding evidence'*|*'review collection'*) fail "S5 retained repair leaves status qualifiers: $out" ;; *) pass "S5 report-status prints no finding evidence or review collection qualifier" ;; esac
acceptance_out "$T/s5/run.md" >"$T/s5/acc.txt"
if grep -qF "$GAP" "$T/s5/acc.txt"; then fail "S5 acceptance reports a source-coverage gap for the retained repair"; else pass "S5 acceptance has no source-coverage gap for the retained repair"; fi
retain_run "$T/s5/run-nosource.md" "$REPAIR" "$T/s5/ext.json" no
acceptance_out "$T/s5/run-nosource.md" >"$T/s5/acc-no.txt"
if grep -qF "$GAP" "$T/s5/acc-no.txt"; then pass "S5 control: omitting the repair's extraction surfaces the coverage gap"; else fail "S5 control: omitting the repair's extraction should surface the coverage gap"; fi
assert_eq "$(sha "$ORIG")" "$ORIG_SHA" "S5 original report is byte-unchanged"
[ -f "$ORIG" ] && pass "S5 original report still exists" || fail "S5 original report still exists"

# ---------------------------------------------------------------------------------------------
echo "S6 reporter template and reviewFileFormat() state the same body rule"
node - "$SKILLS/super-roast/reporter-prompt.md" "$T/format.txt" <<'NODE' || FAILURES=$((FAILURES + 1))
const fs = require('node:fs');
const [reporterFile, formatFile] = process.argv.slice(2);
const reporter = fs.readFileSync(reporterFile, 'utf8');
const rule = reporter.split(/\n\s*\n/).find(p => /^Every section of the report body/.test(p.trim()));
const format = fs.readFileSync(formatFile, 'utf8');
let failed = 0;
const check = (name, ok) => { console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`); if (!ok) failed++; };
check('S6 reporter Step 6 body-rule paragraph found', !!rule);
const flat = s => (s || '').replace(/\s+/g, ' ');
const R = flat(rule), F = flat(format);
for (const word of ['Confirmed findings', 'Not verified', 'Beyond remainder cap', 'Rejected', 'Unverified nits', 'Escalations'])
  check(`S6 reporter rule names section "${word}"`, R.includes(word));
for (const word of ['## Verdict', '## Must fix before landing', '## Untested scope', '## Deferred OK'])
  check(`S6 reviewFileFormat() names heading "${word}"`, F.includes(word));
for (const [label, text] of [['reporter rule', R], ['reviewFileFormat()', F]]) {
  check(`S6 ${label} states "- " items`, text.includes('"- " items') || text.includes('`- ` items'));
  check(`S6 ${label} states the single item "- none"`, /- none/.test(text));
  for (const w of ['sub-heading', 'bold label', 'preamble'])
    check(`S6 ${label} forbids ${w}`, new RegExp(w, 'i').test(text));
}
process.exit(failed ? 1 : 0);
NODE

echo
if [ "$FAILURES" -ne 0 ]; then echo "FAILURES: $FAILURES"; exit 1; fi
echo "review-continuity-e2e: all passed"
