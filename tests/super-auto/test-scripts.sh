#!/usr/bin/env bash
# Tests for skills/super-auto/scripts; each section below names the script it covers.
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

echo "report-status"
RS="$REPO_ROOT/skills/super-auto/scripts/report-status"
RF="$SCRIPT_DIR/fixtures/report-status"
rs_status() { run bash "$RS" "$@"; printf '%s\n' "$out" | head -1; }

assert_eq "$(rs_status "$RF/clean.md")" "status: clean" "clean run"
run bash "$RS" "$RF/clean.md"
assert_eq "$code" 0 "clean run exits 0"
assert_eq "$out" "status: clean" "clean run prints no qualifier lines"
assert_eq "$(rs_status "$RF/degraded-verdict.md")" "status: clean [degraded: low coverage, redesign proposed, not applied]" "degraded-verdict records become qualifiers; beyond-cap and graph-change do not"
run bash "$RS" "$RF/escalations.md"
assert_eq "$out" "status: completed with 0 unresolved Blocking, 2 escalations [degraded: low coverage, code findings parked]
qualifier: low coverage
qualifier: code findings parked" "parked escalation plus codeBuckets.escalated count as escalations; one qualifier line each"
assert_eq "$(rs_status "$RF/roast-skipped.md")" "status: clean [degraded: plan roast skipped, code roast skipped]" "skipped roasts (t/f flag values) are qualifiers"
assert_eq "$(rs_status "$RF/code-capped.md")" "status: completed with 2 unresolved Blocking, 0 escalations" "roastCodeCapped keys (comma-bearing locations) count as unresolved Blocking"
assert_eq "$(rs_status "$RF/design-capped-proceeded.md")" "status: completed with 2 unresolved Blocking, 0 escalations [degraded: design roast capped-blocking, code roast skipped]" "proceeded design cap counts its keys and leads the qualifiers"
assert_eq "$(rs_status "$RF/design-capped-stopped.md")" "status: stalled at phase capped-blocking" "phase capped-blocking is a stall"
assert_eq "$(rs_status "$RF/code-stalled.md")" "status: stalled at phase code" "codeBuckets.stalled true is a stall at code"
assert_eq "$(rs_status "$RF/pending-retry.md")" "status: completed with 0 unresolved Blocking, 0 escalations [degraded: tasks pending retry, final review: Blocking (2 confirmed)]" "pendingRetry forces completed form; non-CLEAN review is a qualifier"
assert_eq "$(rs_status "$RF/sweep-deferred.md")" "status: clean [degraded: sweep: SWEEP DEFERRED (caller-owned)]" "deferred sweep is a qualifier"
assert_eq "$(rs_status "$RF/sweep-failed.md")" "status: clean [degraded: sweep: FAIL 1 of 415 tests @ 7c01d9e]" "failed sweep is a qualifier"
assert_eq "$(rs_status "$RF/clean.md" --tip 3f9c2e1a)" "status: clean" "--tip matching the sweep SHA keeps clean"
assert_eq "$(rs_status "$RF/clean.md" --tip abcdef0)" "status: clean [degraded: sweep: PASS 412 tests @ 3f9c2e1]" "--tip differing from the sweep SHA is a qualifier"
assert_eq "$(rs_status --stalled finish "$RF/clean.md")" "status: stalled at phase finish" "--stalled before RUN_MD"
run bash "$RS" "$RF/roast-skipped.md" --stalled roast-code
assert_eq "$out" "status: stalled at phase roast-code
qualifier: plan roast skipped
qualifier: code roast skipped" "--stalled wins; qualifier lines still printed"

run bash "$RS" "$RF/clean.md" --stalled bogus
assert_eq "$code" 2 "unknown --stalled phase exits 2"
run bash "$RS" "$RF/clean.md" --tip XYZ
assert_eq "$code" 2 "non-SHA --tip exits 2"
run bash "$RS" "$RF/missing.md"
assert_eq "$code" 2 "missing run.md exits 2"
run bash "$RS" "$RF/no-phase.md"
assert_eq "$code" 2 "run.md without phase: exits 2"
run bash "$RS"
assert_eq "$code" 2 "no arguments exits 2"

nojq=$(mktemp -d)
ln -s "$(command -v bash)" "$nojq/bash"
ln -s "$(command -v awk)" "$nojq/awk"
run env PATH="$nojq" bash "$SBC" --step-back "$SF/valid-redesign.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "0:ok" "step-back-check runs with only bash and awk on PATH (no jq)"
run env PATH="$nojq" bash "$RS" "$RF/escalations.md"
assert_eq "$code" 0 "report-status runs with only bash and awk on PATH (no jq)"
rm -rf "$nojq"

echo
if [ "$FAILURES" -eq 0 ]; then echo "All super-auto script tests passed"; else echo "$FAILURES failure(s)"; exit 1; fi
