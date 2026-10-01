#!/usr/bin/env bash
# Tests for skills/super-design/scripts/: coverage-precheck, requirements-tally,
# coverage-divergence, graph-shape. Runs against the fixtures beside this file; no bd tracker needed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
S="$REPO_ROOT/skills/super-design/scripts"
F="$SCRIPT_DIR/fixtures"
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

echo "coverage-precheck"
if command -v jq >/dev/null 2>&1; then
  run bash "$S/coverage-precheck" --from "$F/tree.json" r "$F/ledger.md"
  assert_eq "$out" "flag-sweep: r.4 sp:frozen-promotion
unstated: r.3 <- r.2
citation: r.1 needs r.2 blocker
citation: r.2 needs r.3 dependent
citation: r.4 needs r.5 unwired
citation: r.4 needs r.99 unknown
citation: r.6.1 needs r.2 blocker
citation: r.7 needs r.2 blocker
summary: flag-sweep 1 · unstated 1 · citations 6 (dependent 1, unwired 1, unknown 1)" \
    "flags minus ledger, unstated edge, citations incl. inherited epic edge and transitive path"
  assert_eq "$code" 0 "exit 0"

  run bash "$S/coverage-precheck" --from "$F/tree.json" r "$F/no-ledger-yet.md"
  assert_eq "$(printf '%s\n' "$out" | grep -c '^flag-sweep:')" 2 "missing ledger excludes nothing"

  run bash "$S/coverage-precheck" --from "$F/tree.json" nope "$F/ledger.md"
  assert_eq "$code" 2 "unknown root exits 2"
else
  echo "  [SKIP] jq not installed; only the no-jq path is tested"
fi

# No-jq path: a PATH holding only the tools the script needs besides jq.
nojq=$(mktemp -d)
trap 'rm -rf "$nojq"' EXIT
for b in bash awk cat grep; do ln -s "$(command -v "$b")" "$nojq/$b"; done
run env PATH="$nojq" bash "$S/coverage-precheck" --from "$F/tree.json" r "$F/ledger.md"
assert_eq "$code" 4 "no jq exits 4"
case "$out" in JQ_UNAVAILABLE:*) pass "no jq prints a JQ_UNAVAILABLE: instruction" ;;
  *) fail "no jq prints a JQ_UNAVAILABLE: instruction"; echo "    got: $out" ;; esac

run bash "$S/coverage-precheck" r
assert_eq "$code" 2 "missing argument exits 2"

echo "requirements-tally"
run bash "$S/requirements-tally" "$F/canonical.md" "$F/review-1.md" "$F/review-2.md" "$F/review-3.md"
assert_eq "$out" "requirements: 4 · mapped: 4 · unmapped: 3 (R2, R3, R4)
r-new: audit log of rejections
r-new: per-endpoint overrides
no-block: $F/review-3.md" \
  "union by id: mapped by any, unmapped (or unlisted) by any; R-new deduped; blockless review named"
assert_eq "$code" 0 "exit 0"

run bash "$S/requirements-tally" "$F/canonical.md" "$F/review-1.md"
assert_eq "$(printf '%s\n' "$out" | head -1)" "requirements: 4 · mapped: 3 · unmapped: 1 (R2)" "single reviewer"

run bash "$S/requirements-tally" "$F/canonical.md" "$F/missing.md"
assert_eq "$code" 2 "missing review file exits 2"

echo "coverage-divergence"
run bash "$S/coverage-divergence" "$F/findings-r1.md" "$F/findings-r2.md"
assert_eq "$out" "findings: 3 → 5
novel: 3/5 (60%)
widening: yes" "grew and mostly novel (type match is case-insensitive)"

run bash "$S/coverage-divergence" "$F/findings-r2.md" "$F/findings-r1.md"
assert_eq "$(printf '%s\n' "$out" | tail -1)" "widening: no" "shrinking round is not widening"

run bash "$S/coverage-divergence" "$F/findings-r1.md"
assert_eq "$code" 2 "missing argument exits 2"

echo "graph-shape"
if command -v jq >/dev/null 2>&1; then
  run bash "$S/graph-shape" --from "$F/graph.json" r
  assert_eq "$out" "shape: leaves 8 · depth 5 · width 1.6 · critical path: r.1.1 → r.1.2 → r.2.2 → r.3 → r.9
edge: r.1.2 <- r.1.1 · leaf · critical yes · depth 5→4
edge: r.2 <- r.1 · epic · critical yes · depth 5→3
edge: r.3 <- r.2.2 · leaf · critical yes · depth 5→4
summary: edges 11 · exempt 7 · candidates 3 (critical 3, epic-level 1)" \
    "epic edge waits for the subtree; sweep/contract edges count but are exempt; closed/blocker beads and off-path leaf edges dropped"
  assert_eq "$code" 0 "exit 0"

  cyc=$(mktemp)
  printf '%s' '[{"id":"c","issue_type":"epic","status":"open","labels":["sp:c"]},{"id":"c.1","issue_type":"task","status":"open","parent":"c","dependencies":[{"depends_on_id":"c.2","type":"blocks"}]},{"id":"c.2","issue_type":"task","status":"open","parent":"c","dependencies":[{"depends_on_id":"c.1","type":"blocks"}]}]' > "$cyc"
  run bash "$S/graph-shape" --from "$cyc" c
  assert_eq "$code" 0 "a wait cycle still exits 0"
  assert_eq "$(printf '%s\n' "$out" | head -1)" "shape: leaves 2 · depth 2 · width 1.0 · critical path: c.2 → c.1" "cycle edge ignored"
  rm -f "$cyc"

  run bash "$S/graph-shape" --from "$F/graph.json" nope
  assert_eq "$code" 2 "unknown root exits 2"
fi
run env PATH="$nojq" bash "$S/graph-shape" --from "$F/graph.json" r
assert_eq "$code" 4 "no jq exits 4"
case "$out" in JQ_UNAVAILABLE:*) pass "no jq prints a JQ_UNAVAILABLE: instruction" ;;
  *) fail "no jq prints a JQ_UNAVAILABLE: instruction"; echo "    got: $out" ;; esac

echo
if [ "$FAILURES" -eq 0 ]; then echo "All super-design script tests passed"; else echo "$FAILURES failure(s)"; exit 1; fi
