#!/usr/bin/env bash
# Tests for skills/super-auto/scripts: scope-dispositions (Blocking and unrouted defaults, cluster
# pull-in, cluster override, round filtering, input validation, the no-jq path).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
S="$REPO_ROOT/skills/super-auto/scripts/scope-dispositions"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; }

cat > "$T/keys" <<'K'
[Blocking] a.rs:1
[Should-fix] store/mod.rs:838
[Should-fix] seats.rs:702
[Should-fix] hook.rs:716
[Nit] fmt.rs:3
[Should-fix] x.rs:9
[Should-fix] y.rs:4
K
cat > "$T/filter.json" <<'F'
{"findings":[
{"key":"[Blocking] a.rs:1","disposition":"punch-list","reason":"wrong"},
{"key":"[Should-fix] store/mod.rs:838","disposition":"punch-list","reason":"not goal-named"},
{"key":"[Should-fix] seats.rs:702","disposition":"punch-list","reason":"not goal-named","clusterOverride":"seats are bounded at 16"},
{"key":"[Should-fix] hook.rs:716","disposition":"in-scope","reason":"goal path"},
{"key":"[Nit] fmt.rs:3","disposition":"punch-list","reason":"style"},
{"key":"[Should-fix] y.rs:4","disposition":"punch-list","reason":"hardening"}
]}
F
cat > "$T/sb.md" <<'B'
decision: patch
summary: sweep the unbounded scans
pattern: cluster a
clusters:
  - a: r1 [Should-fix] store/mod.rs:838, r2 [Should-fix] store/mod.rs:838, r2 [Should-fix] seats.rs:702, r2 [Should-fix] hook.rs:716 | rule: page every list query with a bounded cursor
  - b: r2 [Should-fix] y.rs:4, r2 [Nit] fmt.rs:3 | rule: no member in scope, so nothing is pulled in
B

echo "scope-dispositions"
run bash "$S" --round 2 --findings "$T/keys" --filter "$T/filter.json" --step-back "$T/sb.md"
assert_eq "$code" 0 "exits 0"
expected='scopeFilter-round-2: [Blocking] a.rs:1 in-scope — Blocking, always in-scope
scopeFilter-round-2: [Should-fix] store/mod.rs:838 in-scope — cluster a
scopeFilter-round-2: [Should-fix] seats.rs:702 punch-list — cluster override: seats are bounded at 16
scopeFilter-round-2: [Should-fix] hook.rs:716 in-scope — goal path
scopeFilter-round-2: [Nit] fmt.rs:3 punch-list — style
scopeFilter-round-2: [Should-fix] x.rs:9 in-scope — unrouted by filter — defaulted in-scope
scopeFilter-round-2: [Should-fix] y.rs:4 punch-list — hardening
scope-filter: 4 in-scope · 3 punch-listed'
assert_eq "$out" "$expected" "Blocking/unrouted defaults, cluster pull-in, override, all-punch cluster untouched"

run bash "$S" --round 2 --findings "$T/keys" --filter "$T/filter.json"
assert_eq "$(printf '%s\n' "$out" | grep 'store/mod.rs:838')" "scopeFilter-round-2: [Should-fix] store/mod.rs:838 punch-list — not goal-named" "no step-back file: no cluster pull-in"

run bash "$S" --round 3 --findings "$T/keys" --filter "$T/filter.json" --step-back "$T/sb.md"
assert_eq "$(printf '%s\n' "$out" | tail -1)" "scope-filter: 3 in-scope · 4 punch-listed" "cluster members of another round are ignored"

run bash "$S" --round x --findings "$T/keys" --filter "$T/filter.json"
assert_eq "$code" 2 "non-numeric round exits 2"
run bash "$S" --round 2 --findings "$T/missing" --filter "$T/filter.json"
assert_eq "$code" 2 "missing findings file exits 2"

nojq=$(mktemp -d)
ln -s "$(command -v bash)" "$nojq/bash"
run env PATH="$nojq" bash "$S" --round 2 --findings "$T/keys" --filter "$T/filter.json" --step-back "$T/sb.md"
rm -rf "$nojq"
assert_eq "$code" 4 "missing jq exits 4"
assert_eq "$(printf '%s' "$out" | cut -c1-15)" "JQ_UNAVAILABLE:" "missing jq prints the manual-computation line"

echo
echo "step-back-check"
SBC="$REPO_ROOT/skills/super-auto/scripts/step-back-check"
SF="$SCRIPT_DIR/fixtures/step-back-check"

run bash "$SBC" --step-back "$SF/valid-patch.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "0:ok" "valid patch record (no scope:) is ok"
run bash "$SBC" --step-back "$SF/valid-redesign.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "0:ok" "valid redesign with rN-prefixed, comma-bearing keys is ok"
run bash "$SBC" --step-back "$SF/unknown-key.md" --keys "$SF/keys.txt"
assert_eq "$code" 3 "unknown key exits 3"
assert_eq "$out" "reject: dissolves: unknown key '[Nit] report-prompt.md:40'
reject: dissolves: unknown key 'r3 [Blocking] nowhere.ts:1'" "unprefixed and unknown keys each get a reject line"
run bash "$SBC" --step-back "$SF/missing-decision.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "3:reject: decision: missing" "missing decision: is rejected"
run bash "$SBC" --step-back "$SF/redesign-no-scope.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "3:reject: scope: missing (required for redesign)" "redesign without scope: is rejected"

run bash "$SBC" --step-back "$SF/missing.md" --keys "$SF/keys.txt"
assert_eq "$code" 2 "missing step-back file exits 2"
run bash "$SBC" --step-back "$SF/valid-patch.md"
assert_eq "$code" 2 "missing --keys exits 2"

nojq=$(mktemp -d)
ln -s "$(command -v bash)" "$nojq/bash"
ln -s "$(command -v awk)" "$nojq/awk"
run env PATH="$nojq" bash "$SBC" --step-back "$SF/valid-redesign.md" --keys "$SF/keys.txt"
rm -rf "$nojq"
assert_eq "$code:$out" "0:ok" "runs with only bash and awk on PATH (no jq)"

echo
if [ "$FAILURES" -eq 0 ]; then echo "All super-auto script tests passed"; else echo "$FAILURES failure(s)"; exit 1; fi
