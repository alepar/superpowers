#!/usr/bin/env bash
# Integration test for the roast findings redesign loop. It chains the three landed scripts on
# fixture round reports: findings-ledger (code loop) -> step-back-check (against the ledger) ->
# amend-check (against the ledger and a spec diff) -> the next round's ledger. Per-script cases live
# in test-findings-ledger.sh, test-step-back-check.sh and test-amend-check.sh; this file holds only
# what crosses a script boundary, plus the trigger-token cross-check and the stale-path check.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
S="$REPO_ROOT/skills/super-design/scripts"
RV="$REPO_ROOT/skills/super-code/scripts/report-verdict"
F="$SCRIPT_DIR/fixtures/redesign-chain"
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
assert_has() { # haystack needle label
  case "$1" in *"$2"*) pass "$3" ;; *) fail "$3"; echo "    wanted substring: $2"; printf '%s\n' "$1" | sed 's/^/      /' ;; esac
}
assert_lacks() {
  case "$1" in *"$2"*) fail "$3"; echo "    unwanted substring: $2"; printf '%s\n' "$1" | sed 's/^/      /' ;; *) pass "$3" ;; esac
}

run() { set +e; out=$("$@" 2>&1); code=$?; set -e; }

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

A='[Blocking] src/retry.sh:10'
B='[Blocking] src/auth.sh:42'
C='[Should-fix] src/cache.sh:7; src/cache.sh:31'

ledger() { # out, then findings-ledger args
  local o=$1; shift
  bash "$S/findings-ledger" --loop code --out "$o" "$@"
}
trig() { sed -n 's/^triggers: //p' "$1"; }
# status of one key's row: the third ` · ` field
status() { grep -F -- "- $2 · " "$1" | awk -F' · ' '{print $3}'; }
# every trigger name a ledger emitted, one per line (text before each `(`)
NAMES="$T/names.txt"; : > "$NAMES"
note_triggers() { trig "$1" | sed 's/([^)]*)//g' | tr ',' '\n' | sed 's/^ *//; s/ *$//' | { grep -v '^none$' || true; } >> "$NAMES"; }

echo "report fixtures are well-formed"
bad=0
for f in "$F"/*/r*.md; do bash "$RV" --keys "$f" >/dev/null 2>&1 || { bad=1; echo "    bad report: $f"; }; done
assert_eq "$bad" 0 "every fixture report yields keys through report-verdict --keys"

echo "main flow"
: > "$T/ov.md"
run ledger "$T/L2.md" --report 1="$F/main/r1.md" --report 2="$F/main/r2.md" --final-review 2="$F/main/fr-2.txt" --overrides "$T/ov.md"
assert_eq "$code" 0 "round-2 ledger builds"
note_triggers "$T/L2.md"
assert_has "$(trig "$T/L2.md")" "no-progress" "round-2 ledger fires no-progress (A and B confirmed again)"
run bash "$S/step-back-check" --step-back "$F/main/step-back-local.md" --keys "$F/main/keys-2.txt" --ledger "$T/L2.md"
assert_eq "$code" 3 "step-back local is rejected under no-progress (exit)"
assert_has "$out" "no-progress" "the reject names no-progress"
run bash "$S/step-back-check" --step-back "$F/main/step-back-redesign.md" --keys "$F/main/keys-2.txt" --ledger "$T/L2.md"
assert_eq "$code:$out" "0:ok" "step-back redesign citing no-progress is accepted"

# The validated dissolves: key goes to the overrides file; the ledger is rebuilt.
printf '%s\n' "$A · dissolved@r2" > "$T/ov.md"
run ledger "$T/L2d.md" --report 1="$F/main/r1.md" --report 2="$F/main/r2.md" --final-review 2="$F/main/fr-2.txt" --overrides "$T/ov.md"
assert_eq "$code" 0 "ledger rebuilds after the dissolved line"
assert_eq "$(status "$T/L2d.md" "$A")" "dissolved@r2" "A's row reads dissolved@r2"

# Amend-check runs in a temp git repo with the spec committed at base and edited in the working tree.
# Production order (super-auto Step 1, Redesign cycle step 1): step-back-check, then the dissolved
# lines written, then the ledger rebuilt, then amend-check against the rebuilt ledger ($T/L2d.md).
REPO="$T/repo"; mkdir -p "$REPO/docs"
git -C "$REPO" init -q
cp "$F/main/spec-base.md" "$REPO/docs/spec.md"
git -C "$REPO" add docs/spec.md
git -C "$REPO" -c user.name=t -c user.email=t@t commit -q -m base
cp "$F/main/spec-amended.md" "$REPO/docs/spec.md"
amend() { # loop amend-file ledger
  run bash -c 'cd "$1" && bash "$2" --loop "$3" --amend "$4" --ledger "$5" --specs docs/spec.md' _ "$REPO" "$S/amend-check" "$1" "$2" "$3"
}
amend code "$F/main/amend-post-dissolve.md" "$T/L2d.md"
assert_eq "$code:$out" "0:ok" "amend record passes amend-check against the rebuilt (post-dissolve) ledger"
amend code "$F/main/amend-ok.md" "$T/L2d.md"
assert_eq "$code" 3 "a stale record still owning the dissolved key is rejected"
assert_has "$out" "owners: not an open ledger key: $A" "the reject names the dissolved key"

run ledger "$T/L3.md" --report 1="$F/main/r1.md" --report 2="$F/main/r2.md" --report 3="$F/main/r3.md" --final-review 2="$F/main/fr-2.txt" --overrides "$T/ov.md"
assert_eq "$code" 0 "round-3 ledger builds"
note_triggers "$T/L3.md"
# spec §1 rule 4: dissolved@rN stands unless the key is confirmed in a later round; A is absent from r3.
assert_eq "$(status "$T/L3.md" "$A")" "dissolved@r2" "A stays dissolved@r2 in round 3 (not re-confirmed)"
assert_eq "$(status "$T/L3.md" "$C")" "open (returned r3)" "C returns in round 3"
assert_has "$(trig "$T/L3.md")" "recurrence" "round-3 ledger fires recurrence"
run bash "$S/step-back-check" --step-back "$F/main/step-back-local-r3.md" --keys "$F/main/keys-3.txt" --ledger "$T/L3.md"
assert_eq "$code" 3 "step-back local is rejected under recurrence"

echo "cap round"
run ledger "$T/C2.md" --report 1="$F/cap-round/r1.md" --report 2="$F/cap-round/r2.md"
note_triggers "$T/C2.md"
assert_eq "$(trig "$T/C2.md")" "none" "cap-round r2: same count, different key, no trigger"
run ledger "$T/C3.md" --report 1="$F/cap-round/r1.md" --report 2="$F/cap-round/r2.md" --report 3="$F/cap-round/r3.md"
note_triggers "$T/C3.md"
assert_has "$(trig "$T/C3.md")" "no-progress" "cap-round r3: no-progress first fires"
run bash "$S/step-back-check" --step-back "$F/cap-round/step-back-local.md" --keys "$F/cap-round/keys-3.txt" --ledger "$T/C3.md"
assert_eq "$code" 3 "cap-round step-back local is rejected"

echo "disputed key"
run ledger "$T/D2.md" --report 1="$F/disputed/r1.md" --report 2="$F/disputed/r2.md" --overrides "$F/disputed/overrides.md"
note_triggers "$T/D2.md"
assert_lacks "$(trig "$T/D2.md")" "no-progress" "re-confirmed disputed key does not fire no-progress"
assert_eq "$(status "$T/D2.md" "$A")" "disputed@r1 (premise wrong)" "A's row stays disputed"
run bash "$S/step-back-check" --step-back "$F/disputed/step-back-local.md" --keys "$F/disputed/keys-2.txt" --ledger "$T/D2.md"
assert_eq "$code:$out" "0:ok" "step-back local is accepted when the only repeat is disputed"

echo "degraded round"
run ledger "$T/G3.md" --report 1="$F/degraded/r1.md" --report 2="$F/degraded/r2.md" --report 3="$F/degraded/r3.md"
assert_eq "$code" 0 "ledger over a degraded round builds"
note_triggers "$T/G3.md"
assert_eq "$(status "$T/G3.md" "$C")" "open" "C is open, not returned, across the degraded round"
assert_lacks "$(trig "$T/G3.md")" "recurrence" "no recurrence across a degraded round"
assert_has "$(grep '^blocking:' "$T/G3.md")" "returned" "not-computable names returned"

echo "reverse rule"
amend code "$F/reverse-rule/amend-fr-uncovered.md" "$T/L2d.md"
assert_eq "$code" 3 "final-review row covered by no work line is rejected"
assert_has "$out" "reverse" "the reject is the reverse rule (final-review)"
amend code "$F/reverse-rule/amend-local-uncovered.md" "$T/L2d.md"
assert_eq "$code" 3 "local key covered by no work line is rejected"
assert_has "$out" "reverse" "the reject is the reverse rule (local key)"
amend code "$F/reverse-rule/amend-owner-only.md" "$T/L2d.md"
assert_eq "$code" 3 "code loop: open key covered only by an amended owner section is rejected"
assert_has "$out" "reverse" "the reject is the reverse rule (owner-only)"
amend design "$F/reverse-rule/amend-owner-only.md" "$T/L2d.md"
assert_eq "$code:$out" "0:ok" "design loop: the same record passes"

echo "override for a dropped report's key"
run ledger "$T/O.md" --report 1="$F/main/r1.md" --report 2="$F/main/r2.md" --overrides "$F/dropped-override/overrides.md"
assert_eq "$code" 0 "ledger applies the overrides file without exit 2"
note_triggers "$T/O.md"
assert_has "$(grep '^ignored-overrides:' "$T/O.md")" "ignored-overrides: 1" "the dropped round's key is ignored and counted"
assert_eq "$(status "$T/O.md" "$B")" "dissolved@r2" "the rN-prefixed line matches B canonically"

echo "report-verdict"
run bash "$RV" "$F/main/step-back-local.md"
assert_has "$out" "kind: step-back" "report-verdict recognises a step-back record"
assert_has "$out" "decision: local" "report-verdict reads decision: local"

echo "trigger-token cross-check"
mech=$(printf '%s\n' no-progress recurrence | sort -u)
sem=$(printf '%s\n' shared-cause defect-type | sort -u)
both=$(printf '%s\n%s\n' "$mech" "$sem" | sort -u)
# (a) names the ledger emitted in every ledger built above: a subset of the mechanical set
emitted=$(sort -u < "$NAMES")
extra=$(comm -23 <(printf '%s\n' "$emitted") <(printf '%s\n' "$mech") | grep -v '^$' || true)
assert_eq "$extra" "" "findings-ledger emits only mechanical trigger names"
assert_eq "$emitted" "$mech" "findings-ledger emitted both mechanical names in this test"
# (b) step-back-prompt.md's output-field line: `triggers: <comma list from a, b, c, d> | none`
line=$(grep -m1 '^ *triggers:' "$REPO_ROOT/skills/super-design/step-back-prompt.md")
prompt_names=$(printf '%s\n' "$line" | sed 's/^.*from //; s/>.*//' | tr ',' '\n' | sed 's/^ *//; s/ *$//' | grep -v '^$' | sort -u)
assert_eq "$prompt_names" "$both" "step-back-prompt.md lists the four canonical names"
# (c) step-back-check: mechanical names in its header comment, semantic list in its SEMANTIC variable
hdr=$(sed -n '1,40p' "$S/step-back-check")
check_mech=$(printf '%s\n' "$hdr" | grep -oE '`(no-progress|recurrence)`' | tr -d '`' | sort -u)
check_sem=$(grep -m1 'SEMANTIC = ' "$S/step-back-check" | sed 's/.*SEMANTIC = "//; s/".*//' | tr ' ' '\n' | grep -v '^$' | sort -u)
hdr_sem=$(printf '%s\n' "$hdr" | grep -oE '`(shared-cause|defect-type)`' | tr -d '`' | sort -u)
assert_eq "$check_mech" "$mech" "step-back-check's header lists the mechanical names"
assert_eq "$check_sem" "$sem" "step-back-check's SEMANTIC list is the semantic names"
assert_eq "$hdr_sem" "$sem" "step-back-check's header documents the same semantic names"
assert_eq "$(comm -23 <(printf '%s\n' "$prompt_names") <(printf '%s\n' "$mech"))" "$check_sem" "the prompt's semantic names equal step-back-check's"
# behavioural backing
printf '%s\n' '# findings ledger — code — through r1' 'triggers: none' > "$T/none.md"
for name in shared-cause defect-type; do
  cat > "$T/sem-$name.md" <<X
decision: redesign
triggers: $name
summary: s
scope: inside — "Goal" stands
X
  run bash "$S/step-back-check" --step-back "$T/sem-$name.md" --keys "$F/main/keys-2.txt" --ledger "$T/none.md"
  assert_eq "$code:$out" "0:ok" "redesign citing semantic $name with a triggers: none ledger is accepted"
done
cat > "$T/mech.md" <<X
decision: redesign
triggers: no-progress
summary: s
scope: inside — "Goal" stands
X
run bash "$S/step-back-check" --step-back "$T/mech.md" --keys "$F/main/keys-2.txt" --ledger "$T/L2.md"
assert_eq "$code:$out" "0:ok" "redesign citing no-progress against the round-2 ledger is accepted"

echo "no stale path"
old="super-auto/scripts/step-back"'-check'
stale=$(git -C "$REPO_ROOT" grep -n "$old" -- skills tests CLAUDE.md || true)
assert_eq "$stale" "" "no reference to the old super-auto step-back-check path"
rel=$(git -C "$REPO_ROOT" grep -n 'this skill.s dir>/scripts/step-back-check' -- skills/super-auto || true)
assert_eq "$rel" "" "no super-auto relative step-back-check path"

echo
if [ "$FAILURES" -gt 0 ]; then echo "$FAILURES failure(s)"; exit 1; fi
echo "all redesign-chain checks passed"
