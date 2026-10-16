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

W=/r/wt
mkdir -p "$T/ws"
L="$T/ws/progress.md"
printf '%s\n' '# SDD ledger — plan: ep-plan.md' \
  "Launch: mechanism ordinary-subagents · epic ep · branch feat/x · integrationWorktree $W · concurrency 4 · earlyUnblock on · sweep deferred · mergeCheck cargo check --all-targets" > "$L"
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
run bash "$D" --ledger "$L" --stdout review --id ep.2 --n 2 --base abc1234
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
run bash "$D" --ledger "$L" --stdout check-fix-review --id ep.2 --n 2 --pre-fix-head abc1234 --errors-file "$T/err.txt"
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
ends_with_rule review review --id ep.2 --n 2 --base abc1234
ends_with_rule "fix (check)" fix --id ep.2 --n 2 --base abc1234 --kind check --finding-file "$T/err.txt"
printf 'a finding\n' > "$T/finding.txt"
ends_with_rule "fix (review)" fix --id ep.2 --n 2 --base abc1234 --kind review --finding-file "$T/finding.txt"
ends_with_rule "fix (seam)" fix --id ep.2 --n 2 --base abc1234 --kind seam --finding-file "$T/finding.txt"
ends_with_rule seam-review seam-review --id ep.2 --n 2 --base abc1234 --merge-base def5678 --head 9999999 --overlap src/a.rs
ends_with_rule check-fix-review check-fix-review --id ep.2 --n 2 --pre-fix-head abc1234 --errors-file "$T/err.txt"
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
  "Launch: mechanism ordinary-subagents · epic ep · branch feat/x · integrationWorktree $W · runTag rt-1 · mergeCheck none" > "$T/ws/rt.md"
printf '%s\n' 'Launch: args {"epicId":"ep","integrationBranch":"feat/y","integrationWorktree":"/r/wy","skillsRoot":"/s","runTag":"rt-2","config":{"mergeCheck":"none"}}' > "$T/ws/rtargs.md"
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
fr --mode seam --dir "$FD" --clusters 3
for n in 1 2 3; do assert_has "$out" "final-review-rt-1-cluster-$n.md" "seam is given cluster file $n"; done
assert_lacks "$out" "final-review-rt-1-cluster-4.md" "seam is given no cluster beyond --clusters"
assert_has "$out" "$W/.superpowers/sdd/ep-plan/final-review-rt-1.md" "seam writes the handoff file"
if last_is_schema; then pass "seam ends with the final-answer line"; else fail "seam ends with the final-answer line"; fi
fr --mode bogus
assert_eq "$code" 2 "final-review --mode bogus: exit 2"
fr --mode cluster --dir "$FD" --cluster 2
assert_eq "$code" 2 "cluster without --name: exit 2"
fr --mode seam --dir "$FD" --clusters 0
assert_eq "$code" 2 "seam --clusters 0: exit 2"

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
