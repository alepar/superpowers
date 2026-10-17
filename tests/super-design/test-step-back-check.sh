#!/usr/bin/env bash
# Tests for skills/super-design/scripts/step-back-check. Runs against the fixtures beside this file.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SBC="$REPO_ROOT/skills/super-design/scripts/step-back-check"
SF="$SCRIPT_DIR/fixtures/step-back-check"
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

run() { set +e; out=$("$@" 2>/dev/null); code=$?; set -e; }

echo "step-back-check"

run bash "$SBC" --step-back "$SF/valid-patch.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "0:ok" "valid patch record (no scope:) is ok"
run bash "$SBC" --step-back "$SF/valid-redesign.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "0:ok" "valid redesign with rN-prefixed, comma-bearing keys is ok"
run bash "$SBC" --step-back "$SF/unknown-key.md" --keys "$SF/keys.txt"
assert_eq "$code" 3 "unknown key exits 3"
assert_eq "$out" "reject: dissolves: unknown key 'r3 [Blocking] nowhere.ts:1'" "only the unknown key gets a reject line (unprefixed canonical key matches)"
run bash "$SBC" --step-back "$SF/missing-decision.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "3:reject: decision: missing" "missing decision: is rejected"
run bash "$SBC" --step-back "$SF/redesign-no-scope.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "3:reject: scope: missing (required for redesign)" "redesign without scope: is rejected"

run bash "$SBC" --step-back "$SF/missing.md" --keys "$SF/keys.txt"
assert_eq "$code" 2 "missing step-back file exits 2"
run bash "$SBC" --step-back "$SF/valid-patch.md"
assert_eq "$code" 2 "missing --keys exits 2"

echo "step-back-check: triggers and ledger"

run bash "$SBC" --step-back "$SF/local-no-triggers.md" --keys "$SF/keys.txt" --ledger "$SF/ledger-none.md"
assert_eq "$code:$out" "0:ok" "local with a ledger showing triggers: none is ok"
run bash "$SBC" --step-back "$SF/local-no-triggers.md" --keys "$SF/keys.txt" --ledger "$SF/ledger-no-progress.md"
assert_eq "$code:$out" "3:reject: decision: local while ledger names mechanical trigger(s): no-progress" "local under a mechanical trigger is rejected"
run bash "$SBC" --step-back "$SF/patch-as-local.md" --keys "$SF/keys.txt" --ledger "$SF/ledger-recurrence.md"
assert_eq "$code:$out" "3:reject: decision: local while ledger names mechanical trigger(s): recurrence" "patch is read as local and rejected under a mechanical trigger (evidence with commas)"
run bash "$SBC" --step-back "$SF/patch-as-local.md" --keys "$SF/keys.txt" --ledger "$SF/ledger-none.md"
assert_eq "$code:$out" "0:ok" "patch is accepted as local"
run bash "$SBC" --step-back "$SF/redesign-triggers-none.md" --keys "$SF/keys.txt" --ledger "$SF/ledger-none.md"
assert_eq "$code:$out" "3:reject: triggers: none with decision redesign" "redesign with triggers: none is rejected"
run bash "$SBC" --step-back "$SF/redesign-cites-recurrence.md" --keys "$SF/keys.txt" --ledger "$SF/ledger-no-progress.md"
assert_eq "$code:$out" "3:reject: triggers: 'recurrence' is mechanical and the ledger does not list it" "a cited mechanical trigger absent from the ledger is rejected"
run bash "$SBC" --step-back "$SF/redesign-cites-recurrence.md" --keys "$SF/keys.txt" --ledger "$SF/ledger-recurrence.md"
assert_eq "$code:$out" "0:ok" "a cited mechanical trigger the ledger lists is ok"
run bash "$SBC" --step-back "$SF/redesign-semantic.md" --keys "$SF/keys.txt" --ledger "$SF/ledger-none.md"
assert_eq "$code:$out" "0:ok" "semantic-only redesign is ok with a ledger showing triggers: none"
run bash "$SBC" --step-back "$SF/redesign-mech-ok.md" --keys "$SF/keys.txt" --ledger "$SF/ledger-no-progress.md"
assert_eq "$code:$out" "0:ok" "mechanical plus semantic triggers are ok when the ledger lists the mechanical one"
run bash "$SBC" --step-back "$SF/valid-patch.md" --keys "$SF/keys.txt" --ledger "$SF/ledger-none.md"
assert_eq "$code:$out" "3:reject: triggers: missing" "with --ledger a record without triggers: is rejected"
run bash "$SBC" --step-back "$SF/valid-patch.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "0:ok" "without --ledger a record without triggers: is ok"
run bash "$SBC" --step-back "$SF/local-no-triggers.md" --keys "$SF/keys.txt" --ledger "$SF/missing.md"
assert_eq "$code" 2 "missing ledger file exits 2"
nt=$(mktemp)
printf 'round: 2\n' > "$nt"
run bash "$SBC" --step-back "$SF/local-no-triggers.md" --keys "$SF/keys.txt" --ledger "$nt"
assert_eq "$code" 2 "ledger without a triggers: line exits 2"
rm -f "$nt"

echo "step-back-check: key forms"

run bash "$SBC" --step-back "$SF/dissolves-canonical.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "0:ok" "unprefixed canonical keys match rN-prefixed keys-file lines"
run bash "$SBC" --step-back "$SF/dissolves-prefixed.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "0:ok" "rN-prefixed keys match too"
run bash "$SBC" --step-back "$SF/dissolves-comma-key.md" --keys "$SF/keys-comma.txt"
assert_eq "$code:$out" "0:ok" "a key containing ', ' is split only on ', [' into the right keys"
run bash "$SBC" --step-back "$SF/dissolves-comma-key.md" --keys "$SF/keys.txt"
assert_eq "$out" "reject: dissolves: unknown key '[Should-fix] §3 Step 1 item 2, item 5'" "the comma-bearing key stays whole when it is unknown"

echo "step-back-check: no jq"
nojq=$(mktemp -d)
ln -s "$(command -v bash)" "$nojq/bash"
ln -s "$(command -v awk)" "$nojq/awk"
run env PATH="$nojq" bash "$SBC" --step-back "$SF/valid-redesign.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "0:ok" "step-back-check runs with only bash and awk on PATH (no jq)"
rm -rf "$nojq"

echo
if [ "$FAILURES" -eq 0 ]; then echo "All step-back-check tests passed"; else echo "$FAILURES failure(s)"; exit 1; fi
