#!/usr/bin/env bash
# Tests for skills/super-design/scripts/findings-ledger. Runs against the fixtures in
# fixtures/findings-ledger/; each scenario directory holds trimmed real-format roast reports.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
S="$REPO_ROOT/skills/super-design/scripts"
F="$SCRIPT_DIR/fixtures/findings-ledger"
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

assert_eq() {
  if [ "$1" = "$2" ]; then pass "$3"; else
    fail "$3"
    echo "    expected:"; printf '%s\n' "$2" | sed 's/^/      /'
    echo "    got:";      printf '%s\n' "$1" | sed 's/^/      /'
  fi
}

run() { set +e; out=$("$@" 2>"$T/stderr"); code=$?; set -e; err=$(cat "$T/stderr"); }

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
L="$T/ledger.md"

ledger() { run bash "$S/findings-ledger" --loop code --out "$L" "$@"; }
line() { grep "^$1" "$L" || true; }
row() { grep -F -- "- $1 ·" "$L" | sed 's/ · text .*//' || true; }
text() { grep -F -- "- $1 ·" "$L" | sed 's/.* · text //' || true; }

echo "round 1 only"
ledger --report 1="$F/r1-only/r1.md"
assert_eq "$code" 0 "exit 0"
assert_eq "$(head -1 "$L")" "# findings ledger — code — through r1" "header line"
assert_eq "$(line triggers:)" "triggers: none" "no triggers in round 1"
assert_eq "$(line blocking:)" "blocking: r0=- r1=2 carriedB=- regressedB=- degraded=none not-computable=no-progress,returned,regressed" "round 1 blocking line: nothing computable"
assert_eq "$(row '[Blocking] src/a.sh:10')" "- [Blocking] src/a.sh:10 · raised r1@3f9c2e1 · open · source roast" "row carries the sha from the inputs line"

echo "no-progress and its non-triggers"
ledger --report 2="$F/no-progress/r2.md" --report 1="$F/no-progress/r1.md"
assert_eq "$(line triggers:)" "triggers: no-progress(r1 Blocking keys all re-confirmed in r2: 2)" "every prior Blocking key re-confirmed fires no-progress (reports given out of order)"
assert_eq "$(line blocking:)" "blocking: r1=2 r2=2 carriedB=2 regressedB=0 degraded=none not-computable=none" "blocking line from the delta"
ledger --report 1="$F/same-count-new-keys/r1.md" --report 2="$F/same-count-new-keys/r2.md"
assert_eq "$(line triggers:)" "triggers: none" "same Blocking count with different keys: no trigger"
assert_eq "$(line blocking: | sed 's/ degraded.*//')" "blocking: r1=2 r2=2 carriedB=0 regressedB=0" "counts are equal yet nothing fires"
ledger --report 1="$F/disputed-reconfirmed/r1.md" --report 2="$F/disputed-reconfirmed/r2.md" --overrides "$F/disputed-reconfirmed/overrides.md"
assert_eq "$(line triggers:)" "triggers: no-progress(r1 Blocking keys all re-confirmed in r2: 1)" "disputed key leaves prev; the other key still re-confirmed fires with count 1"
assert_eq "$(line blocking: | sed 's/ carriedB.*//')" "blocking: r1=1 r2=1" "effective counts exclude the disputed key"
assert_eq "$(row '[Blocking] src/a.sh:10')" "- [Blocking] src/a.sh:10 · raised r1@3f9c2e1 · disputed@r1 (premise wrong) · source roast" "disputed key stays disputed after re-confirmation"
printf '[Blocking] src/a.sh:10 · disputed@r1 (premise wrong)\n[Blocking] src/b.sh:5 · disputed@r1 (also wrong)\n' > "$T/both.md"
ledger --report 1="$F/disputed-reconfirmed/r1.md" --report 2="$F/disputed-reconfirmed/r2.md" --overrides "$T/both.md"
assert_eq "$(line triggers:)" "triggers: none" "every prior Blocking key disputed: prev is empty, no no-progress"

echo "recurrence: regressed Blocking and plausibility"
ledger --report 1="$F/regressed/r1.md" --report 2="$F/regressed/r2.md"
assert_eq "$(line triggers:)" "triggers: recurrence(regressedB=1)" "regressedB >= 1 with plausible counts fires recurrence"
assert_eq "$(line blocking:)" "blocking: r1=2 r2=1 carriedB=1 regressedB=1 degraded=none not-computable=none" "counts shown when plausible"
ledger --report 1="$F/implausible/r1.md" --report 2="$F/implausible/r2.md"
assert_eq "$(line triggers:)" "triggers: no-progress(r1 Blocking keys all re-confirmed in r2: 1)" "implausible regressed count fires nothing (only key identity no-progress)"
assert_eq "$(line blocking:)" "blocking: r1=1 r2=2 carriedB=- regressedB=- degraded=none not-computable=regressed" "carriedB+regressedB > prior: both counts -, not-computable=regressed"

echo "recurrence: returned key"
ledger --report 1="$F/returned/r1.md" --report 2="$F/returned/r2.md" --report 3="$F/returned/r3.md"
assert_eq "$(line triggers:)" "triggers: recurrence(returned=2)" "a Blocking and a Should-fix key returned: one recurrence trigger"
assert_eq "$(row '[Blocking] src/a.sh:10')" "- [Blocking] src/a.sh:10 · raised r1@3f9c2e1 · open (returned r3) · source roast" "key absent in r2 and back in r3"
assert_eq "$(row '[Should-fix] src/t.sh:1')" "- [Should-fix] src/t.sh:1 · raised r2@4a5b6c7 · resolved@r3 · source roast" "key confirmed in r2 and absent from r3 is resolved@r3"
ledger --report 1="$F/returned/r1.md" --report 2="$F/returned/r2.md"
assert_eq "$(row '[Blocking] src/a.sh:10')" "- [Blocking] src/a.sh:10 · raised r1@3f9c2e1 · resolved@r2 · source roast" "absent from a non-degraded round: resolved@r2"
printf '[Blocking] src/a.sh:10 · disputed@r2 (not a defect)\n' > "$T/disp.md"
ledger --report 1="$F/returned/r1.md" --report 2="$F/returned/r2.md" --report 3="$F/returned/r3.md" --overrides "$T/disp.md"
assert_eq "$(line triggers:)" "triggers: recurrence(returned=1)" "a disputed returned key does not count toward recurrence"

echo "degraded round"
ledger --report 1="$F/degraded/r1.md" --report 2="$F/degraded/r2.md" --report 3="$F/degraded/r3.md"
assert_eq "$(line triggers:)" "triggers: none" "no trigger across the degraded r2"
assert_eq "$(line blocking: | sed 's/.*degraded=/degraded=/')" "degraded=r2 not-computable=no-progress,returned" "not-computable lists the skipped signals"
assert_eq "$(row '[Blocking] src/a.sh:10')" "- [Blocking] src/a.sh:10 · raised r1@3f9c2e1 · open · source roast" "key missing from the degraded r2 and back in r3 is plain open, not returned"
ledger --report 1="$F/degraded/r1.md" --report 2="$F/degraded/r2.md"
assert_eq "$(row '[Blocking] src/a.sh:10')" "- [Blocking] src/a.sh:10 · raised r1@3f9c2e1 · open · source roast" "key missing from a degraded latest round stays open"
assert_eq "$(line blocking: | sed 's/.*degraded=/degraded=/')" "degraded=r2 not-computable=no-progress" "degraded latest round: only no-progress is skipped (returned is a latest-vs-previous check on a non-degraded r1)"

echo "punch list and overrides statuses"
ledger --report 1="$F/punch-list/r1.md" --report 2="$F/punch-list/r2.md" --punch-list "$F/punch-list/punch-list.txt"
assert_eq "$(row '[Should-fix] src/s.sh:3')" "- [Should-fix] src/s.sh:3 · raised r1@3f9c2e1 · punch-listed · source roast" "punch-listed key (rN-prefixed line matched canonically)"
ledger --report 1="$F/punch-list/r1.md" --report 2="$F/punch-list/r2.md"
assert_eq "$(row '[Should-fix] src/s.sh:3')" "- [Should-fix] src/s.sh:3 · raised r1@3f9c2e1 · resolved@r2 · source roast" "same key without a punch list is resolved@r2"
ledger --report 1="$F/overrides-precedence/r1.md" --report 2="$F/overrides-precedence/r2.md" --overrides "$F/overrides-precedence/overrides.md"
assert_eq "$code" 0 "precedence scenario exits 0"
assert_eq "$(row '[Blocking] src/a.sh:10')" "- [Blocking] src/a.sh:10 · raised r1@3f9c2e1 · open · source roast" "dissolved@r1 (rN-prefixed line) beaten by the r2 re-confirmation"
assert_eq "$(row '[Blocking] src/b.sh:5')" "- [Blocking] src/b.sh:5 · raised r1@3f9c2e1 · disputed@r1 (reviewer reproduced it) · source roast" "last override line for a key wins"
assert_eq "$(row '[Blocking] src/c.sh:7')" "- [Blocking] src/c.sh:7 · raised r1@3f9c2e1 · disputed@r1 (premise wrong) · source roast" "disputed is sticky across a re-confirmation"
assert_eq "$(row '[Blocking] src/d.sh:9')" "- [Blocking] src/d.sh:9 · raised r1@3f9c2e1 · dissolved@r1 · source roast" "dissolved stands when the key is not confirmed later"
assert_eq "$(line blocking: | sed 's/ carriedB.*//')" "blocking: r1=1 r2=1" "r1 and r2 counts exclude disputed and dissolved keys, include the re-confirmed one"

echo "ignored overrides"
ledger --report 1="$F/ignored-overrides/r1.md" --report 2="$F/ignored-overrides/r2.md" --overrides "$F/ignored-overrides/overrides.md"
assert_eq "$code" 0 "unknown-key and dropped-report overrides: exit 0"
assert_eq "$(line ignored-overrides:)" "ignored-overrides: 2" "both lines counted"
assert_eq "$(row '[Blocking] src/b.sh:5')" "- [Blocking] src/b.sh:5 · raised r1@3f9c2e1 · disputed@r1 (kept despite the mis-keyed lines) · source roast" "the other override still applies"
assert_eq "$(grep -c 'only-r3\|nowhere' "$L" || true)" 0 "ignored keys get no rows"

echo "multi-location keys"
ledger --report 1="$F/multi-location/r1.md" --report 2="$F/multi-location/r2.md" --overrides "$F/multi-location/overrides.md"
assert_eq "$(row '[Blocking] src/a.sh:10; src/a2.sh:4')" "- [Blocking] src/a.sh:10; src/a2.sh:4 · raised r1@3f9c2e1 · disputed@r1 (shared helper, by design) · source roast" "a '; ' key is carried verbatim and matched by an rN-prefixed override line"
assert_eq "$(line ignored-overrides:)" "ignored-overrides: 0" "the multi-location override was not ignored"

echo "final-review keys"
ledger --report 1="$F/final-review/r1.md" --report 2="$F/final-review/r2.md" --final-review 2="$F/final-review/fr-2.txt" --final-review 3="$F/final-review/fr-3.txt"
assert_eq "$code" 0 "final-review inputs accepted in the code loop"
assert_eq "$(row '[Must-fix] reviewer item one')" "- [Must-fix] reviewer item one · raised r2@- · open · source final-review" "open while in the latest final-review file (rN prefix stripped)"
assert_eq "$(text '[Must-fix] reviewer item one')" "$F/final-review/fr-3.txt" "final-review text points to the latest keys file holding it"
assert_eq "$(row '[Must-fix] untested: reviewer item two')" "- [Must-fix] untested: reviewer item two · raised r2@- · resolved@r3 · source final-review" "omitted from the latest file: resolved"
assert_eq "$(line triggers:)" "triggers: none" "final-review rows never feed the triggers"
assert_eq "$(line blocking: | sed 's/ carriedB.*//')" "blocking: r1=1 r2=1" "final-review rows are not counted as Blocking"

echo "input presence"
X='[Must-fix] x broken'
ledger --report 1="$F/fr-empty/r1.md" --report 2="$F/fr-empty/r2.md" --final-review 1="$F/fr-empty/fr-1.txt" --final-review 2="$F/fr-empty/fr-2.txt"
assert_eq "$(row "$X")" "- $X · raised r1@- · open · source final-review" "an empty final-review file resolves nothing"
ledger --report 1="$F/fr-empty/r1.md" --report 2="$F/fr-empty/r2.md" --final-review 1="$F/fr-empty/fr-1.txt"
assert_eq "$(row "$X")" "- $X · raised r1@- · open · source final-review" "no round-2 final-review file: the key stays open"
ledger --report 1="$F/final-review/r1.md" --report 2="$F/final-review/r2.md" --final-review 2="$F/final-review/fr-2.txt" --final-review 3="$F/final-review/fr-3.txt" --final-review 4="$F/fr-empty/fr-2.txt"
assert_eq "$(row '[Must-fix] untested: reviewer item two')" "- [Must-fix] untested: reviewer item two · raised r2@- · resolved@r3 · source final-review" "an empty later file is not the frmax round: r3 still decides"
ledger --report 1="$F/fr-empty/r1.md" --final-review 1="$F/fr-empty/fr-1.txt" --final-review 1="$F/fr-empty/fr-1.txt"
assert_eq "$code" 2 "the same final-review round twice: exit 2"
assert_eq "$(printf '%s' "$err" | grep -c 'round 1 given twice' || true)" 1 "duplicate final-review round named on stderr"
ledger --report 1="$F/final-review/r1.md" --report 2="$F/final-review/r2.md" --final-review 2="$F/final-review/fr-2.txt" --final-review 3="$F/final-review/fr-3.txt" --overrides "$F/fr-override/overrides.md"
assert_eq "$(row '[Must-fix] reviewer item one')" "- [Must-fix] reviewer item one · raised r2@- · disputed@r2 (not reproducible) · source final-review" "an override targets a final-review row"
assert_eq "$(line ignored-overrides:)" "ignored-overrides: 0" "the final-review override is not ignored"
ledger --report 1="$F/degraded-first/r1.md" --report 2="$F/degraded-first/r2.md" --report 3="$F/degraded-first/r3.md"
assert_eq "$(row '[Should-fix] src/x.sh:2')" "- [Should-fix] src/x.sh:2 · raised r2@4a5b6c7 · open · source roast" "a key first raised in a degraded round and re-confirmed is open, not returned"
assert_eq "$(line triggers:)" "triggers: none" "no returned trigger for it"
ledger --report 1="$F/panel-capped/r1.md" --report 2="$F/panel-capped/r2.md" --report 3="$F/panel-capped/r3.md"
assert_eq "$(line blocking: | sed 's/.*degraded=/degraded=/')" "degraded=r2 not-computable=no-progress,returned,regressed" "[panel-capped: N unverified] marks the round degraded"
assert_eq "$(row '[Should-fix] src/c.sh:3')" "- [Should-fix] src/c.sh:3 · raised r1@3f9c2e1 · open · source roast" "absence from a panel-capped round is neither returned nor resolved"
ledger --report 1="$F/missing-prev/r1.md" --report 3="$F/missing-prev/r3.md"
assert_eq "$(line blocking:)" "blocking: r2=- r3=1 carriedB=- regressedB=- degraded=none not-computable=no-progress,returned,regressed" "missing round N-1: nothing computable"
assert_eq "$(line triggers:)" "triggers: none" "missing round N-1: no trigger"
ledger --report 1="$F/returned-nit/r1.md" --report 2="$F/returned-nit/r2.md" --report 3="$F/returned-nit/r3.md"
assert_eq "$(row '[Nit] src/n.sh:1')" "- [Nit] src/n.sh:1 · raised r1@3f9c2e1 · open (returned r3) · source roast" "a returned Nit is labelled returned"
assert_eq "$(line triggers:)" "triggers: none" "a returned Nit never fires recurrence"
ledger --report 1="$F/punch-after-redesign/r1.md" --report 2="$F/punch-after-redesign/r2.md" --report 3="$F/punch-after-redesign/r3.md" --punch-list "$F/punch-after-redesign/punch-list-1.txt"
assert_eq "$(row '[Should-fix] src/a.sh:1')" "- [Should-fix] src/a.sh:1 · raised r1@3f9c2e1 · punch-listed · source roast" "the latest existing punch list stays valid across a round that wrote none"
ledger --report 1="$F/punch-after-redesign/r1.md" --report 2="$F/punch-after-redesign/r2.md" --report 3="$F/punch-after-redesign/r3.md"
assert_eq "$(row '[Should-fix] src/a.sh:1')" "- [Should-fix] src/a.sh:1 · raised r1@3f9c2e1 · resolved@r2 · source roast" "without a punch list the same key is resolved"

echo "text pointers"
ledger --report 1="$F/no-progress/r1.md" --report 2="$F/no-progress/r2.md"
assert_eq "$(text '[Blocking] src/a.sh:10')" "$F/no-progress/r2.md" "a re-confirmed key points to the latest confirming report"
ledger --report 1="$F/regressed/r1.md" --report 2="$F/regressed/r2.md"
assert_eq "$(text '[Blocking] src/b.sh:5')" "$F/regressed/r1.md" "a key not in r2 points to the report that last confirmed it"

echo "missing delta line"
ledger --report 1="$F/no-delta/r1.md" --report 2="$F/no-delta/r2.md"
assert_eq "$code" 0 "a missing delta line is not an error"
assert_eq "$(line blocking:)" "blocking: r1=1 r2=1 carriedB=- regressedB=- degraded=none not-computable=regressed" "counts - and not-computable=regressed"
assert_eq "$(line triggers:)" "triggers: no-progress(r1 Blocking keys all re-confirmed in r2: 1)" "key-identity no-progress still computed"

echo "exit 2 on bad input"
ledger --report 1="$F/no-progress/r1.md" --report 2="$T/missing.md"
assert_eq "$code" 2 "missing report: exit 2"
assert_eq "$(printf '%s' "$err" | grep -c "$T/missing.md" || true)" 1 "missing report path named on stderr"
ledger --report 1="$F/no-progress/r1.md" --overrides "$T/missing-overrides.md"
assert_eq "$code" 2 "unreadable overrides: exit 2"
assert_eq "$(printf '%s' "$err" | grep -c "$T/missing-overrides.md" || true)" 1 "overrides path named on stderr"
printf 'decision: patch\nsummary: x\n' > "$T/step-back.md"
ledger --report 1="$F/no-progress/r1.md" --report 2="$T/step-back.md"
assert_eq "$code" 2 "step-back file as a report (report-verdict --keys exit 3): exit 2"
assert_eq "$(printf '%s' "$err" | grep -c "$T/step-back.md" || true)" 1 "step-back path named on stderr"
run bash "$S/findings-ledger" --loop design --out "$L" --report 1="$F/no-progress/r1.md" --final-review 1="$F/final-review/fr-2.txt"
assert_eq "$code:$err" "2:findings-ledger: --final-review is code-loop only" "design loop rejects --final-review"
run bash "$S/findings-ledger" --loop code --out "$L"
assert_eq "$code" 2 "no --report: exit 2"
ledger --report x=$F/no-progress/r1.md
assert_eq "$code" 2 "non-numeric round: exit 2"
ledger --report 1="$F/no-progress/r1.md" --report 1="$F/no-progress/r2.md"
assert_eq "$code" 2 "the same round twice: exit 2"

echo "design loop and idempotence"
run bash "$S/findings-ledger" --loop design --out "$T/design.md" --report 1="$F/no-progress/r1.md" --report 2="$F/no-progress/r2.md"
assert_eq "$code:$(head -1 "$T/design.md")" "0:# findings ledger — design — through r2" "design loop header"
ledger --report 1="$F/overrides-precedence/r1.md" --report 2="$F/overrides-precedence/r2.md" --overrides "$F/overrides-precedence/overrides.md" --punch-list "$F/punch-list/punch-list.txt"
cp "$L" "$T/first.md"
ledger --report 1="$F/overrides-precedence/r1.md" --report 2="$F/overrides-precedence/r2.md" --overrides "$F/overrides-precedence/overrides.md" --punch-list "$F/punch-list/punch-list.txt"
assert_eq "$(cmp "$T/first.md" "$L" && echo same)" "same" "a second run produces an identical file"

echo "runs with only bash and the core tools on PATH (no jq)"
nojq=$(mktemp -d)
for c in bash awk sed grep sort cat mktemp mv rm dirname tr cp head cut; do ln -s "$(command -v $c)" "$nojq/$c"; done
run env PATH="$nojq" bash "$S/findings-ledger" --loop code --out "$T/nojq.md" --report 1="$F/no-progress/r1.md" --report 2="$F/no-progress/r2.md"
assert_eq "$code:$(grep '^triggers:' "$T/nojq.md" || true)" "0:triggers: no-progress(r1 Blocking keys all re-confirmed in r2: 2)" "works without jq"
rm -rf "$nojq"

echo
if [ "$FAILURES" -eq 0 ]; then echo "All findings-ledger tests passed"; else echo "$FAILURES failure(s)"; exit 1; fi
