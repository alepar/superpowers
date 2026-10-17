#!/usr/bin/env bash
# Tests for skills/super-code/scripts/dispatch-text: the ordinary-subagent coordinator's dispatch
# text comes from coordinator.js's own prompt builders, with run facts read from the ledger's
# Launch: line.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
D="$REPO_ROOT/skills/super-code/scripts/dispatch-text"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_has() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing: $2"; fi; }
assert_lacks() { if printf '%s\n' "$1" | grep -qF -- "$2"; then fail "$3"; echo "    unexpected: $2"; else pass "$3"; fi; }
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; }

PIN_BASE=1111111111111111111111111111111111111111
PIN_HEAD=2222222222222222222222222222222222222222
W=/r/wt
mkdir -p "$T/ws"
L="$T/ws/progress.md"
printf '%s\n' '# SDD ledger — plan: ep-plan.md' \
  "Launch: mechanism ordinary-subagents · epic ep · branch feat/x · integrationWorktree $W · concurrency 4 · earlyUnblock on · sweep deferred · reviewBase $PIN_BASE · reviewHead $PIN_HEAD · mergeCheck cargo check --all-targets" > "$L"
TW="$W/.worktrees/feat-x--task-ep.2"

echo "dispatch-text: implement"
run bash "$D" --ledger "$L" implement --id ep.2 --n 2
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "$T/ws/dispatch/impl-ep.2.md" "writes <ledger dir>/dispatch/<label>.md and prints only its path"
txt=$(cat "$T/ws/dispatch/impl-ep.2.md")
assert_has "$txt" "You are the implementer for task ep.2." "the implementer dispatch"
assert_has "$txt" "[WORKTREE] = $TW" "task worktree under the Launch: line's integration worktree"
assert_has "$txt" "[BRIEF_FILE] = $T/ws/task-2-brief.md" "artifacts in the ledger's directory, by ordinal"
assert_has "$txt" "git worktree add $TW -b task-ep.2 feat/x" "workspace setup cuts from the integration branch"
assert_has "$txt" "PROCESSES AND TEMP STATE" "process hygiene the implementer template points at"
assert_has "$txt" "CURRENT REQUIREMENTS" "current requirements"
assert_lacks "$txt" "stack: ep.1" "no stacking without --parents"
run bash "$D" --ledger "$L" --stdout implement --id ep.2 --n 2 --parents ep.1
assert_has "$out" 'git merge --no-ff -m "stack: ep.1" task-ep.1' "--parents stacks on the parent's branch"
assert_has "$out" "STACK_CONFLICT" "and names the stack-conflict return"
run bash "$D" --ledger "$L" --stdout implement --id ep.2 --n 2 --reentry
assert_has "$out" "This is a review re-entry" "--reentry: the review re-entry setup"

echo "dispatch-text: review, fix, seam review, check-fix review"
run bash "$D" --ledger "$L" --stdout review --id ep.2 --n 2 --base "$PIN_BASE" --head "$PIN_HEAD"
assert_has "$out" "[HEAD] = $PIN_HEAD" "task review receives captured implementation head"
assert_has "$out" "--is-ancestor $PIN_BASE $PIN_HEAD" "base check uses captured head"
for mode in single cluster seam; do
  extra=(--dir /review/inputs)
  case "$mode" in cluster) extra=(--dir /review/inputs --cluster 1 --name source);; seam) extra=(--dir /review/inputs --reviewed none);; esac
  run bash "$D" --ledger "$L" --stdout final-review --mode "$mode" --base "$PIN_BASE" --head "$PIN_HEAD" "${extra[@]}"
  assert_eq "$code" 0 "pinned final $mode exits 0"
  assert_has "$out" "diff $PIN_BASE..$PIN_HEAD" "final $mode diff is captured"
  assert_has "$out" "show $PIN_HEAD:<path>" "final $mode source is captured"
done
run bash "$D" --ledger "$L" --stdout review --id ep.2 --n 2 --base "$PIN_BASE" --head moving-branch
assert_eq "$code" 2 "task review rejects a moving source ref"
run bash "$D" --ledger "$L" --stdout final-review --mode single --base "$PIN_BASE" --head moving-branch
assert_eq "$code" 2 "final review rejects a moving source ref"
run bash "$D" --ledger "$L" --stdout review --id ep.2 --n 2 --base abc1234 --head "$PIN_HEAD"
assert_has "$out" "BASE CHECK" "review carries the base check"
assert_has "$out" "[BASE] = abc1234" "and the reported base"
printf 'error[E0061]: this function takes 2 arguments\n' > "$T/err.txt"
run bash "$D" --ledger "$L" --stdout fix --id ep.2 --n 2 --base abc1234 --kind check --finding-file "$T/err.txt"
assert_has "$out" "This is the merge-check fix" "fix --kind check: the merge-check fix scope"
assert_has "$out" "cargo check --all-targets" "with the Launch: line's mergeCheck"
assert_has "$out" "error[E0061]" "and the build errors as data"
for k in check seam review; do
  printf 'finding text\n' > "$T/f-$k.txt"
  run bash "$D" --ledger "$L" --stdout fix --id ep.2 --n 2 --base abc1234 --kind "$k" --finding-file "$T/f-$k.txt"
  assert_has "$out" "no memory of the earlier round" "fix --kind $k: fresh-agent handoff"
  assert_has "$out" "task-2-brief.md" "fix --kind $k: brief path"
  assert_has "$out" "task-2-report.md" "fix --kind $k: previous report path"
  assert_has "$out" "abc1234..HEAD" "fix --kind $k: base..HEAD range"
done
assert_has "$out" "task-2-review.md" "fix --kind review: the review file path"
run bash "$D" --ledger "$L" --stdout seam-review --id ep.2 --n 2 --base abc1234 --merge-base def5678 --head 9999999 --overlap src/a.rs,"consumes ep.1"
assert_has "$out" "READ-ONLY post-rebase seam review for task ep.2" "seam review"
assert_has "$out" "A \`consumes <id>\` entry" "a consumes entry gets the composed-review text"
run bash "$D" --ledger "$L" --stdout check-fix-review --id ep.2 --n 2 --head "$PIN_HEAD" --pre-fix-head abc1234 --errors-file "$T/err.txt"
assert_has "$out" "READ-ONLY review of a merge-check fix" "check-fix review"

echo "dispatch-text: merge"
run bash "$D" --ledger "$L" --stdout merge --id ep.2 --n 2 --base abc1234
assert_has "$out" "rebase \`task-ep.2\` onto feat/x" "an unstacked merge rebases the whole branch"
assert_has "$out" "BRANCH CHECK" "fail-closed branch and clean checks"
assert_has "$out" "\`cargo check --all-targets\`" "the merge check"
assert_lacks "$out" "LEDGER, last" "the merge leaves the ledger lines to the coordinator"
assert_lacks "$out" "--keep-branch" "an unsplit task's branch is removed"
run bash "$D" --ledger "$L" --stdout merge --id ep.2 --n 2 --base abc1234 --stacked --review-bead ep.9
assert_has "$out" "git rebase --onto feat/x abc1234 task-ep.2" "--stacked rebases only the task's own commits"
assert_has "$out" "then \`bd close ep.9\`" "--review-bead closes the review bead after the task bead"
assert_has "$out" "--keep-branch" "and keeps a split task's branch for its dependents"

echo "dispatch-text: plan, triage"
run bash "$D" --ledger "$L" --stdout plan --ids ep.1,ep.2 --mode ready
assert_has "$out" "plan ONLY the confirmed-ready ids" "plan --mode ready"
run bash "$D" --ledger "$L" --stdout plan --ids ep.1 --mode rest
assert_has "$out" "APPENDING only" "plan --mode rest appends"
for w in task-surface filesToRead surfaceTokens oversized; do assert_has "$out" "$w" "plan text names $w"; done
run bash "$D" --ledger "$L" --stdout triage --id ep.2 --blocker ep.7
assert_has "$out" "blocker bead ep.7, filed against task ep.2" "triage"
assert_has "$out" "waitFor" "and its waitFor field"

echo "dispatch-text: final-answer rule"
SCHEMA_RULE='FINAL ANSWER: your structured result is the whole answer. Return every field your schema or output template defines, in full, and add no prose summary beside it.'
VERDICT_RULE='FINAL ANSWER: your final message is exactly one line: your verdict, then " — " and the absolute path of the file that holds your full report (" — none" when this job writes no report). Never paste a report body into your final message.'
ends_with_rule() {  # $1 = label, rest = dispatch-text args; the last non-empty line must end with the schema rule
  local label="$1"; shift
  run bash "$D" --ledger "$L" --stdout "$@"
  local last; last=$(printf '%s\n' "$out" | awk 'NF{l=$0} END{print l}')
  case "$last" in *"$SCHEMA_RULE") pass "$label ends with the final-answer rule" ;; *) fail "$label ends with the final-answer rule"; echo "    last line ends: ${last: -120}" ;; esac
}
ends_with_rule implement implement --id ep.2 --n 2
ends_with_rule "implement (stacked)" implement --id ep.2 --n 2 --parents ep.1
ends_with_rule "implement (reentry)" implement --id ep.2 --n 2 --reentry
ends_with_rule review review --id ep.2 --n 2 --base abc1234 --head "$PIN_HEAD"
ends_with_rule "fix (check)" fix --id ep.2 --n 2 --base abc1234 --kind check --finding-file "$T/err.txt"
printf 'a finding\n' > "$T/finding.txt"
ends_with_rule "fix (review)" fix --id ep.2 --n 2 --base abc1234 --kind review --finding-file "$T/finding.txt"
ends_with_rule "fix (seam)" fix --id ep.2 --n 2 --base abc1234 --kind seam --finding-file "$T/finding.txt"
ends_with_rule seam-review seam-review --id ep.2 --n 2 --base abc1234 --merge-base def5678 --head 9999999 --overlap src/a.rs
ends_with_rule check-fix-review check-fix-review --id ep.2 --n 2 --head "$PIN_HEAD" --pre-fix-head abc1234 --errors-file "$T/err.txt"
ends_with_rule merge merge --id ep.2 --n 2 --base abc1234
ends_with_rule "merge (stacked)" merge --id ep.2 --n 2 --base abc1234 --stacked --review-bead ep.9
ends_with_rule "plan (ready)" plan --ids ep.1,ep.2 --mode ready
ends_with_rule "plan (rest)" plan --ids ep.1 --mode rest
ends_with_rule "plan (refill)" plan --ids ep.1 --mode refill
ends_with_rule triage triage --id ep.2 --blocker ep.7
CJS="$REPO_ROOT/skills/super-code/coordinator.js"
STEP="$REPO_ROOT/skills/super-design/step-back-prompt.md"
SCOPE="$REPO_ROOT/skills/super-auto/scope-filter-prompt.md"
REPORT="$REPO_ROOT/skills/super-auto/report-prompt.md"
has_f() { if grep -qF -- "$2" "$3"; then pass "$1"; else fail "$1"; echo "    missing in $3"; fi; }
lacks_f() { if grep -qF -- "$2" "$3"; then fail "$1"; echo "    unexpected in $3"; else pass "$1"; fi; }
has_f "coordinator.js carries the schema-form rule" "$SCHEMA_RULE" "$CJS"
has_f "coordinator.js carries the verdict-form rule" "$VERDICT_RULE" "$CJS"
has_f "step-back-prompt.md copies the schema form" "$SCHEMA_RULE" "$STEP"
has_f "scope-filter-prompt.md copies the schema form" "$SCHEMA_RULE" "$SCOPE"
has_f "report-prompt.md copies the verdict form" "$VERDICT_RULE" "$REPORT"
lacks_f "report-prompt.md has no schema form" "$SCHEMA_RULE" "$REPORT"
lacks_f "step-back-prompt.md has no verdict form" "$VERDICT_RULE" "$STEP"
lacks_f "scope-filter-prompt.md has no verdict form" "$VERDICT_RULE" "$SCOPE"
has_f "report-prompt.md describes the draft handoff" "report.draft.md" "$REPORT"
has_f "report-prompt.md names the status placeholder" "{{STATUS_BLOCK}}" "$REPORT"
row=$(grep '^| report drafter' "$REPO_ROOT/skills/super-auto/SKILL.md" || true)
assert_has "$row" "report.draft.md" "SKILL.md's report drafter row names report.draft.md"

echo "dispatch-text: assemble"
printf '%s\n' '# SDD ledger — plan: ep-plan.md' \
  "Launch: mechanism ordinary-subagents · epic ep · branch feat/x · integrationWorktree $W · runTag rt-1 · reviewBase $PIN_BASE · reviewHead $PIN_HEAD · mergeCheck none" > "$T/ws/rt.md"
printf '%s\n' 'Launch: args {"epicId":"ep","integrationBranch":"feat/y","integrationWorktree":"/r/wy","skillsRoot":"/s","runTag":"rt-2","reviewBase":"1111111111111111111111111111111111111111","reviewHead":"2222222222222222222222222222222222222222","config":{"mergeCheck":"none"}}' > "$T/ws/rtargs.md"
AW="$W/.superpowers/sdd/ep-plan/assembled"
asm() {  # $1 = consumer, $2 = instance
  run bash "$D" --ledger "$T/ws/rt.md" --stdout assemble --consumer "$1" --instance "$2"
}
asm final-review final
assert_eq "$code" 0 "assemble final-review exits 0"
assert_has "$out" "[OUT_DIR] = $AW/final-review-rt-1-final" "OUT_DIR is <workspace>/assembled/<consumer>-<runTag>-<instance>"
assert_has "$out" "assembler-prompt.md" "points at the assembler template"
assert_has "$out" "[CONSUMER] = final-review" "names the consumer"
assert_has "$out" "[CLUSTERS] = yes" "final-review asks for clusters"
for sec in "diffstat" "report summaries" "interfaces and seams" "deferred minors" "amendments"; do
  assert_has "$out" "$sec" "final-review section: $sec"
done
assert_has "$out" "[ASSEMBLED_SIZE] = bash " "assembled-size is named by absolute script path"
assert_has "$out" "scripts/assembled-size" "and it is the script, not a re-implementation"
assert_has "$out" "[LEDGER] = $W/.superpowers/sdd/ep-plan/progress.md" "the ledger path"
assert_has "$out" "[THRESHOLD] = 80000" "default threshold"
assert_has "$out" "[SPEC_PATHS] = none" "no spec paths by default"
last=$(printf '%s\n' "$out" | awk 'NF{l=$0} END{print l}')
case "$last" in *"$SCHEMA_RULE") pass "assemble final-review ends with the final-answer rule" ;; *) fail "assemble final-review ends with the final-answer rule" ;; esac
asm roast-code r3
assert_has "$out" "[OUT_DIR] = $AW/roast-code-rt-1-r3" "roast-code OUT_DIR carries the instance"
assert_has "$out" "slice index" "roast-code section: slice index"
assert_has "$out" "stated-intent spec paths" "roast-code section: stated-intent spec paths"
assert_has "$out" "diffstat" "roast-code section: diffstat"
assert_lacks "$out" "report summaries" "roast-code carries no report summaries"
assert_lacks "$out" "concerns" "roast-code carries no concerns"
assert_has "$out" "[CLUSTERS] = no" "roast-code asks for no clusters"
last=$(printf '%s\n' "$out" | awk 'NF{l=$0} END{print l}')
case "$last" in *"$SCHEMA_RULE") pass "assemble roast-code ends with the final-answer rule" ;; *) fail "assemble roast-code ends with the final-answer rule" ;; esac
run bash "$D" --ledger "$T/ws/rt.md" --stdout assemble --consumer roast-code --instance r3 --spec docs/a.md,docs/b.md
assert_has "$out" "[SPEC_PATHS] = docs/a.md, docs/b.md" "--spec lists the spec paths"
asm history ep.4
assert_has "$out" "[OUT_DIR] = $AW/history-rt-1-ep.4" "history instance is a bead id"
assert_has "$out" "ledger lines" "history section: ledger lines"
assert_has "$out" "bead comments" "history section: bead comments"
assert_has "$out" "report summaries" "history section: report summaries"
assert_has "$out" "[CLUSTERS] = no" "history asks for no clusters"
last=$(printf '%s\n' "$out" | awk 'NF{l=$0} END{print l}')
case "$last" in *"$SCHEMA_RULE") pass "assemble history ends with the final-answer rule" ;; *) fail "assemble history ends with the final-answer rule" ;; esac
asm assess audit
assert_has "$out" "ledger state counts" "assess section: ledger state counts"
assert_has "$out" "deferred minors" "assess section: deferred minors"
assert_has "$out" "[CLUSTERS] = no" "assess asks for no clusters"
last=$(printf '%s\n' "$out" | awk 'NF{l=$0} END{print l}')
case "$last" in *"$SCHEMA_RULE") pass "assemble assess ends with the final-answer rule" ;; *) fail "assemble assess ends with the final-answer rule" ;; esac
run bash "$D" --ledger "$T/ws/rt.md" --stdout --run-tag x assemble --consumer assess --instance audit
assert_has "$out" "[OUT_DIR] = $AW/assess-x-audit" "--run-tag overrides the Launch: line"
run bash "$D" --ledger "$T/ws/rtargs.md" --stdout assemble --consumer assess --instance audit
assert_has "$out" "[OUT_DIR] = /r/wy/.superpowers/sdd/ep-plan/assembled/assess-rt-2-audit" "the Launch: args form carries runTag"
run bash "$D" --ledger "$L" --stdout assemble --consumer final-review --instance final
assert_has "$out" "assembled/final-review-ep-final" "a Launch line without runTag falls back to the epic"
ASMT="$REPO_ROOT/skills/super-code/assembler-prompt.md"
has_f "assembler-prompt.md states it judges nothing" "judges nothing" "$ASMT"
has_f "assembler-prompt.md empties the instance dir first" 'rm -rf [OUT_DIR] && mkdir -p [OUT_DIR]/slices' "$ASMT"
has_f "assembler-prompt.md relays the exit code and the fits: line" 'its `fits:` line verbatim' "$ASMT"
for m in opus sonnet haiku gpt; do lacks_f "assembler-prompt.md names no model ($m)" "$m" "$ASMT"; done
run bash "$D" --ledger "$L" --stdout assemble --consumer bogus --instance final
assert_eq "$code" 2 "--consumer bogus: exit 2"
run bash "$D" --ledger "$L" --stdout assemble --consumer assess
assert_eq "$code" 2 "assemble without --instance: exit 2"

echo "dispatch-text: final-review"
fr() { run bash "$D" --ledger "$T/ws/rt.md" --stdout final-review "$@"; }
last_is_schema() { [ "$(printf '%s\n' "$out" | tail -n 1 | grep -o 'FINAL ANSWER:.*')" = "$SCHEMA_RULE" ]; }
FD="$AW/final-review-rt-1-final"
fr --mode single
assert_eq "$code" 0 "final-review --mode single exits 0"
assert_has "$out" "review-package" "single without --dir reviews direct inputs through the review package"
assert_has "$out" "$W/.superpowers/sdd/ep-plan/final-review-rt-1.md" "single writes the handoff file final-review-<runTag>.md"
assert_lacks "$out" "no usable clusters" "an uncapped single review is not told its inputs overflow"
if last_is_schema; then pass "single ends with the final-answer line"; else fail "single ends with the final-answer line"; fi
fr --mode single --dir "$FD"
assert_has "$out" "$FD/digest.md" "single --dir reads the assembled digest"
assert_lacks "$out" "review-package" "single --dir does not rebuild the review package"
fr --mode single --capped
assert_has "$out" "no usable clusters" "--capped tells the reviewer its inputs exceed the window"
fr --mode cluster --dir "$FD" --cluster 2 --name hooks
assert_has "$out" "final-review-rt-1-cluster-2.md" "cluster writes final-review-<runTag>-cluster-<n>.md"
assert_has "$out" "cluster named hooks" "cluster names the cluster it reviews"
if last_is_schema; then pass "cluster ends with the final-answer line"; else fail "cluster ends with the final-answer line"; fi
printf 'cluster 2 (hooks): over the window\n' > "$T/unrev.txt"
fr --mode seam --dir "$FD" --reviewed 1,3 --unreviewed "$T/unrev.txt"
assert_eq "$code" 0 "seam --reviewed exits 0"
assert_has "$out" "final-review-rt-1-cluster-1.md" "seam is given reviewed cluster file 1"
assert_has "$out" "final-review-rt-1-cluster-3.md" "seam is given reviewed cluster file 3"
assert_lacks "$out" "final-review-rt-1-cluster-2.md" "seam is not given the unreviewed cluster's file"
assert_has "$out" "cluster 2 (hooks): over the window" "seam names the unreviewed entry verbatim"
assert_has "$out" "$W/.superpowers/sdd/ep-plan/final-review-rt-1.md" "seam writes the handoff file"
if last_is_schema; then pass "seam ends with the final-answer line"; else fail "seam ends with the final-answer line"; fi
fr --mode seam --dir "$FD" --reviewed none
assert_has "$out" "none — no cluster review completed" "--reviewed none: the empty list"
fr --mode stub --reviewed 1 --unreviewed <(printf 'seam\n')
assert_eq "$code" 0 "stub exits 0"
assert_has "$out" "$W/.superpowers/sdd/ep-plan/final-review-rt-1.md" "stub writes the handoff file"
assert_has "$out" "unreviewed: seam" "stub names the unreviewed entries"
assert_has "$out" "final-review-rt-1-cluster-1.md" "stub lists the reviewed cluster file"
if last_is_schema; then pass "stub ends with the final-answer line"; else fail "stub ends with the final-answer line"; fi
run bash "$D" --ledger "$T/ws/rt.md" final-review --mode stub --reviewed none --unreviewed "$T/unrev.txt"
assert_eq "$out" "$T/ws/dispatch/final-review-stub.md" "stub's default label is final-review-stub"
fr --mode bogus
assert_eq "$code" 2 "final-review --mode bogus: exit 2"
fr --mode cluster --dir "$FD" --cluster 2
assert_eq "$code" 2 "cluster without --name: exit 2"
fr --mode stub --reviewed 1
assert_eq "$code" 2 "stub without --unreviewed: exit 2"
fr --mode seam --dir "$FD" --reviewed 0
assert_eq "$code" 2 "seam --reviewed 0: exit 2"
fr --mode seam --dir "$FD" --reviewed a,b
assert_eq "$code" 2 "seam --reviewed a,b: exit 2"
fr --mode seam --dir "$FD"
assert_eq "$code" 2 "seam without --reviewed: exit 2"
assert_has "$(cat "$T/err")" "needs --reviewed" "and says what is missing"

# Single: sweep and Metrics come from the ledger, as Finish passes them.
printf '%s\n' "Launch: mechanism ordinary-subagents · epic ep · branch feat/x · integrationWorktree $W · runTag rt-1 · reviewBase $PIN_BASE · reviewHead $PIN_HEAD · mergeCheck none" \
  'Sweep: abc1234 — 120 passed, 0 failed; failing: none; command: npm test' \
  'Metrics: m1' 'Metrics: m2' 'Metrics: m3' 'Metrics: m4' > "$T/ws/sw.md"
frl() { run bash "$D" --ledger "$T/ws/sw.md" --stdout final-review "$@"; }
frl --mode single
assert_has "$out" "<sweep>" "single reads the ledger's Sweep: line into the prompt"
assert_has "$out" "120 passed" "and its text"
assert_has "$out" "Metrics: m1 | Metrics: m2 | Metrics: m3 | Metrics: m4" "single reads the four Metrics: lines"
assert_lacks "$out" "No sweep result is available" "a recorded sweep is not reported absent"
frl --mode single --sweep deferred
assert_has "$out" "deferred to the caller" "--sweep deferred passes the deferred marker"
printf 'sweep from file\n' > "$T/sweepf.txt"; printf 'Metrics: f1\nMetrics: f2\n' > "$T/metf.txt"
frl --mode single --sweep "$T/sweepf.txt" --metrics "$T/metf.txt"
assert_has "$out" "sweep from file" "--sweep F overrides the ledger"
assert_lacks "$out" "120 passed" "and the ledger's sweep is not used"
assert_has "$out" "Metrics: f1 | Metrics: f2" "--metrics F overrides the ledger"
assert_lacks "$out" "Metrics: m1" "and the ledger's metrics are not used"
printf '%s\n' "Launch: mechanism ordinary-subagents · epic ep · branch feat/x · integrationWorktree $W · runTag rt-1 · sweep deferred · reviewBase $PIN_BASE · reviewHead $PIN_HEAD · mergeCheck none" > "$T/ws/df.md"
run bash "$D" --ledger "$T/ws/df.md" --stdout final-review --mode single
assert_has "$out" "deferred to the caller" "a Launch line with sweep deferred and no Sweep: line defers the sweep"
printf '%s\n' 'Launch: args {"epicId":"ep","integrationBranch":"feat/x","integrationWorktree":"/r/wt","runTag":"rt-1","deferSweep":true,"reviewBase":"1111111111111111111111111111111111111111","reviewHead":"2222222222222222222222222222222222222222"}' > "$T/ws/dfa.md"
run bash "$D" --ledger "$T/ws/dfa.md" --stdout final-review --mode single
assert_has "$out" "deferred to the caller" "the Workflow Launch form's deferSweep defers the sweep"
fr --mode single
assert_has "$out" "No sweep result is available" "no Sweep: line and no deferral: still no sweep result"

# Argument parity: every final-review builder call in coordinator.js and dispatch-text.mjs passes as
# many arguments as the builder declares, with the same option-object keys.
parity=$(cd "$REPO_ROOT" && node - <<'NODE'
const { readFileSync } = require('node:fs')
const co = readFileSync('skills/super-code/coordinator.js', 'utf8')
const dt = readFileSync('skills/super-code/scripts/dispatch-text.mjs', 'utf8')
function argsAt(src, open) {
  const out = []; let d = 0, cur = '', q = null
  for (let j = open + 1; j < src.length; j++) {
    const c = src[j]
    if (q) { cur += c; if (c === '\\') { cur += src[++j]; continue } if (c === q) q = null; continue }
    if (c === '"' || c === "'" || c === '`') { q = c; cur += c; continue }
    if ('([{'.includes(c)) d++
    if (')]}'.includes(c)) { if (d === 0) { if (cur.trim()) out.push(cur.trim()); return out } d-- }
    if (c === ',' && d === 0) { out.push(cur.trim()); cur = ''; continue }
    cur += c
  }
  return null
}
const keys = a => a.trim().startsWith('{') ? argsAt('(' + a.trim().slice(1, -1) + ')', 0).map(p => p.split(':')[0].trim()).sort().join(',') : null
const calls = (src, re) => { const r = []; let m; while ((m = re.exec(src))) r.push(argsAt(src, m.index + m[0].length - 1)); return r }
for (const name of ['finalReviewPrompt', 'finalClusterReviewPrompt', 'finalSeamReviewPrompt', 'finalReviewStubPrompt']) {
  const decl = new RegExp('^function ' + name + '\\(', 'm').exec(co)
  const params = argsAt(co, decl.index + decl[0].length - 1).length
  const cc = calls(co, new RegExp('(?<!function )\\b' + name + '\\(', 'g'))
  const dc = calls(dt, new RegExp('B\\.' + name + '\\(', 'g'))
  const bad = []
  if (!cc.length) bad.push('no coordinator.js call')
  if (!dc.length) bad.push('no dispatch-text call')
  for (const c of cc) if (c.length !== params) bad.push(`coordinator.js passes ${c.length} of ${params}`)
  for (const c of dc) {
    if (c.length !== params) bad.push(`dispatch-text passes ${c.length} of ${params}`)
    c.forEach((a, i) => { const k = keys(a), ck = cc[0] && cc[0][i] ? keys(cc[0][i]) : null; if (k !== ck) bad.push(`arg ${i + 1} keys ${k} vs ${ck}`) })
  }
  console.log(bad.length ? `bad ${name}: ${bad.join('; ')}` : `ok ${name}`)
}
NODE
)
while IFS= read -r line; do
  case "$line" in ok\ *) pass "argument parity: ${line#ok }" ;; *) fail "argument parity: ${line#bad }" ;; esac
done <<< "$parity"
[ -n "$parity" ] || fail "argument parity block printed nothing"

echo "dispatch-text: advancing caller fixture"
node --input-type=module - "$D" "$T" <<'NODE'
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const [dispatch, dir] = process.argv.slice(2)
const repo = `${dir}/advancing-caller`
mkdirSync(repo)
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim()
git('init', '-q'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.com')
writeFileSync(`${repo}/source.txt`, 'base\n'); git('add', '.'); git('commit', '-qm', 'base')
const base = git('rev-parse', 'HEAD')
writeFileSync(`${repo}/source.txt`, 'captured source\n'); git('commit', '-qam', 'reviewed')
const head = git('rev-parse', 'HEAD')
git('branch', '-m', 'integration')
const ledger = `${dir}/advancing-progress.md`
writeFileSync(ledger, `Launch: epic ep · branch integration · integrationWorktree ${repo}\n`)
for (const callerText of ['advanced once\n', 'advanced twice\n']) {
  writeFileSync(`${repo}/source.txt`, callerText); git('commit', '-qam', 'advance caller')
  for (const args of [
    ['review', '--id', 'ep.2', '--n', '2'],
    ['assemble', '--consumer', 'final-review', '--instance', 'final'],
    ['final-review', '--mode', 'single'],
    ['final-review', '--mode', 'cluster', '--dir', '/review/input', '--cluster', '1', '--name', 'source'],
    ['final-review', '--mode', 'seam', '--dir', '/review/input', '--reviewed', 'none'],
  ]) {
    const prompt = execFileSync('bash', [dispatch, '--ledger', ledger, '--stdout', ...args, '--base', base, '--head', head], { encoding: 'utf8' })
    assert.ok(prompt.includes(base) && prompt.includes(head), 'every dispatch retains captured pair')
    assert.ok(!prompt.includes(git('rev-parse', 'HEAD')), 'caller advance does not enter review inputs')
    if (args[0] === 'final-review') {
      const diff = prompt.match(/`git diff ([a-f0-9]+)\.\.([a-f0-9]+)`/)
      assert.ok(diff, 'rendered pinned diff command')
      const patch = git('diff', `${diff[1]}..${diff[2]}`)
      assert.ok(patch.includes('+captured source') && !patch.includes('advanced'))
      const source = prompt.match(/`git show ([a-f0-9]+):<path>`/)
      assert.ok(source, 'rendered pinned source command')
      assert.equal(git('show', `${source[1]}:source.txt`), 'captured source')
    }
  }
  assert.equal(readFileSync(`${repo}/source.txt`, 'utf8'), callerText)
  assert.equal(git('status', '--porcelain=v1'), '')
}
console.log('  [PASS] regenerated task/assembly/single/cluster/seam prompts preserve captured source across two caller advances')
NODE

echo "dispatch-text: run facts and bad input"
printf '%s\n' 'Launch: args {"epicId":"ep","integrationBranch":"feat/y","integrationWorktree":"/r/wy","config":{"mergeCheck":"none"}}' > "$T/ws/wf.md"
run bash "$D" --ledger "$T/ws/wf.md" --stdout merge --id ep.2 --n 2 --base abc1234
assert_has "$out" "the integration branch feat/y is checked out in /r/wy" "a Workflow Launch: args line is read too"
assert_has "$out" "No merge check is declared" "mergeCheck none: no check step"
run bash "$D" --ledger "$T/ws/wf.md" --stdout --branch feat/z merge --id ep.2 --n 2 --base abc1234
assert_has "$out" "the integration branch feat/z" "--branch overrides the Launch: line"
printf '# SDD ledger\n' > "$T/ws/empty.md"
run bash "$D" --ledger "$T/ws/empty.md" implement --id ep.2 --n 2
assert_eq "$code" 2 "no Launch: line and no overrides: exit 2"
run bash "$D" --ledger "$L" review --id ep.2 --n 2
assert_eq "$code" 2 "a missing required option: exit 2"
run bash "$D" --ledger "$L" bogus
assert_eq "$code" 2 "an unknown kind: exit 2"

echo "dispatch-text: every kind --help lists is one it builds"
missing=""
for k in $(grep -oE '^  [a-z][a-z-]* ' <(bash "$D" --help) | tr -d ' '); do
  run bash "$D" --ledger "$L" "$k"
  [ "$code" = 2 ] && grep -q "needs --" "$T/err" || missing="$missing $k(not-a-kind)"
done
assert_eq "${missing:-none}" "none" "the help's kinds all parse (missing:${missing:- none})"

echo
if [ "$FAILURES" -eq 0 ]; then echo "dispatch-text: all tests passed"; else echo "dispatch-text: $FAILURES failure(s)"; exit 1; fi
