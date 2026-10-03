#!/usr/bin/env bash
# Tests for skills/super-roast/scripts/assemble-args: assembled args shape by mode and round, input
# validation, the no-node path, and a mock engine run of the --script output (engine-mock.mjs).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
A="$REPO_ROOT/skills/super-roast/scripts/assemble-args"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; }
q() { node -e "const d=JSON.parse(require('fs').readFileSync('$1','utf8')); console.log($2)"; }

printf 'super-roast verdict: Should-fix (1 confirmed)\nPRIOR-REPORT-MARKER\n## Confirmed findings\n- [Should-fix] c.js:1 — old\n' > "$T/prior.md"
printf '[Should-fix] c.js:1\n\n[Nit] d.js:2; e.js:3\n' > "$T/punch.txt"

echo "assemble-args: shape"
run bash "$A" --mode pr --inputs "b@1 vs m@0" --diff-stat "M a.js" --out "$T/pr1.json" --script "$T/pr1.js" \
  --report-dir docs/superpowers/reviews --topic demo --date 2026-10-01
assert_eq "$code" 0 "pr round 1 exits 0"
assert_eq "$(printf '%s\n' "$out" | grep '^report:')" "report: docs/superpowers/reviews/2026-10-01-demo-roast-pr-1.md" "report path carries mode and round"
assert_eq "$(q "$T/pr1.json" "d.config.coreLanes.join(',')")" "correctness,security,premortem,simplicity-design,hot-path-perf,concurrency-async" "pr core lanes from triage-prompt.md"
assert_eq "$(q "$T/pr1.json" "Object.keys(d.prompts.scouts).length")" "13" "pr round 1: 13 lane prompts, no regression"
assert_eq "$(q "$T/pr1.json" "d.priorReport === '' && d.iteration === 1")" "true" "round 1: empty prior report, numeric iteration"
assert_eq "$(q "$T/pr1.json" "d.prompts.seatsSafe === undefined")" "true" "seatsSafe only on request"

run bash "$A" --mode pr --inputs "b@2 vs m@0" --iteration 2 --prior-report "$T/prior.md" --punch-listed "$T/punch.txt" --diff-stat "M a.js" --seats-safe --out "$T/pr2.json" --script "$T/pr2.js"
assert_eq "$code" 0 "pr round 2 exits 0"
assert_eq "$(q "$T/pr2.json" "d.config.coreLanes.includes('regression') && !!d.prompts.scouts.regression")" "true" "round 2 adds the regression lane"
assert_eq "$(q "$T/pr2.json" "Object.values(d.prompts.scouts).every(p => p.includes('## Materiality bar') && !p.includes('## High recall'))")" "true" "round 2: every scout carries one policy, the materiality bar"
assert_eq "$(q "$T/pr2.json" "Object.keys(d.prompts.seatsSafe).join(',')")" "reproduce,refute,ground" "seatsSafe for all three seats"
assert_eq "$(q "$T/pr2.json" "JSON.stringify(d.punchListed)")" '"[Should-fix] c.js:1\n[Nit] d.js:2; e.js:3"' "--punch-listed keys reach args.punchListed, blank lines dropped"
assert_eq "$(q "$T/pr2.json" "d.prompts.reporter.includes('<punch_listed>\\n{{PUNCH_LISTED}}\\n</punch_listed>')")" "true" "reporter prompt keeps the {{PUNCH_LISTED}} slot for the engine"
assert_eq "$(q "$T/pr1.json" "d.punchListed")" "" "no --punch-listed: empty punchListed"
assert_eq "$(q "$T/pr1.json" "d.independence")" "same-family (Claude) — seat-differentiated panel · rung: Workflow" "independence names the Workflow rung with --script"

run bash "$A" --mode design --inputs "docs/spec.md" --spec /abs/spec.md --context "Epic bd-1" --out "$T/d1.json" --script "$T/d1.js"
assert_eq "$code" 0 "design round 1 exits 0"
assert_eq "$(q "$T/d1.json" "d.config.coreLenses.join(',') + ' | ' + d.config.widenLenses.join(',')")" "premortem,completeness,yagni,failure-mode,feasibility | security,maintainer" "design lens rosters from SKILL.md"
assert_eq "$(q "$T/d1.json" "d.prompts.scoutDomainTemplate.includes('{{DOMAIN}}') && d.prompts.scoutDomainTemplate.includes('Epic bd-1')")" "true" "domain template keeps {{DOMAIN}} and carries caller context"
run bash "$A" --mode design --inputs "docs/spec.md" --spec /abs/spec.md --out "$T/d1-manual.json"
assert_eq "$(q "$T/d1-manual.json" "d.independence.endsWith(' · rung: manual fan-out') && d.prompts.reporter.includes('independence: same-family (Claude) — seat-differentiated panel · rung: manual fan-out')")" "true" "without --script, independence names the manual fan-out rung"

echo "assemble-args: validation"
run bash "$A" --mode pr --inputs x --iteration 2 --diff-stat x
assert_eq "$code" 2 "round 2 without a prior report exits 2"
run bash "$A" --mode pr --inputs x --prior-report "$T/prior.md" --diff-stat x
assert_eq "$code" 2 "round 1 with a prior report exits 2"
run bash "$A" --mode design --inputs x
assert_eq "$code" 2 "design without --spec exits 2"
run bash "$A" --mode pr --inputs x
assert_eq "$code" 2 "pr without a diff source exits 2"
run bash "$A" --mode pr --inputs x --diff-stat x --bogus 1
assert_eq "$code" 2 "unknown option exits 2"
run bash "$A" --mode pr --inputs x --diff-stat x --punch-listed "$T/punch.txt"
assert_eq "$code" 2 "--punch-listed without a prior report exits 2"
run bash "$A" --mode pr --inputs x --iteration 2 --prior-report "$T/prior.md" --diff-stat x --punch-listed "$T/nope.txt"
assert_eq "$code" 2 "missing --punch-listed file exits 2"
printf '[Blocking] a.js:1\n' > "$T/punch-blocking.txt"
run bash "$A" --mode pr --inputs x --iteration 2 --prior-report "$T/prior.md" --diff-stat x --punch-listed "$T/punch-blocking.txt"
assert_eq "$code" 2 "a Blocking key in --punch-listed exits 2 (punch-listed is sub-Blocking)"
printf 'c.js:1\n' > "$T/punch-bare.txt"
run bash "$A" --mode pr --inputs x --iteration 2 --prior-report "$T/prior.md" --diff-stat x --punch-listed "$T/punch-bare.txt"
assert_eq "$code" 2 "a --punch-listed line without [SEV] exits 2"

echo "assemble-args: no node"
nonode=$(mktemp -d)
for b in bash dirname; do ln -s "$(command -v "$b")" "$nonode/$b"; done
run env PATH="$nonode" bash "$A" --mode pr --inputs x
rm -rf "$nonode"
assert_eq "$code" 4 "missing node exits 4"
assert_eq "$(printf '%s' "$out" | cut -c1-17)" "NODE_UNAVAILABLE:" "missing node prints the manual-assembly line"

echo "engine run of the assembled script (mock agents)"
for s in pr-r1:pr1 pr-r2:pr2 pr-r2-empty:pr2 design-r1:d1; do
  set +e; node "$SCRIPT_DIR/engine-mock.mjs" "$T/${s#*:}.js" "${s%%:*}"; rc=$?; set -e
  [ "$rc" -eq 0 ] || FAILURES=$((FAILURES + 1))
done

echo
if [ "$FAILURES" -eq 0 ]; then echo "All super-roast assemble-args tests passed"; else echo "$FAILURES failure(s)"; exit 1; fi
