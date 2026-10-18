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
run bash "$A" --mode pr --inputs "b@1 vs m@0" \
  --artifact "b@1 vs m@0 — stated intent: docs/r/x-design.md, docs/r/x--y-design.md" \
  --diff-stat "M a.js" --out "$T/pr-intent.json"
assert_eq "$code" 0 "pr with a stated intent exits 0"
assert_eq "$(q "$T/pr-intent.json" "[...Object.values(d.prompts.scouts), ...Object.values(d.prompts.seats)].every(p => p.includes('b@1 vs m@0 — stated intent: docs/r/x-design.md, docs/r/x--y-design.md'))")" "true" "stated intent appended to --artifact reaches every scout and judge-seat prompt"

run bash "$A" --mode design --inputs "docs/spec.md" --spec /abs/spec.md --context "Epic bd-1" --out "$T/d1.json" --script "$T/d1.js"
assert_eq "$code" 0 "design round 1 exits 0"
assert_eq "$(q "$T/d1.json" "d.config.coreLenses.join(',') + ' | ' + d.config.widenLenses.join(',')")" "premortem,completeness,yagni,failure-mode,feasibility | security,maintainer" "design lens rosters from SKILL.md"
assert_eq "$(q "$T/d1.json" "d.prompts.scoutDomainTemplate.includes('{{DOMAIN}}') && d.prompts.scoutDomainTemplate.includes('Epic bd-1')")" "true" "domain template keeps {{DOMAIN}} and carries caller context"
run bash "$A" --mode design --inputs "docs/spec.md" --spec /abs/spec.md --out "$T/d1-manual.json"
assert_eq "$(q "$T/d1-manual.json" "d.independence.endsWith(' · rung: manual fan-out') && d.prompts.reporter.includes('independence: same-family (Claude) — seat-differentiated panel · rung: manual fan-out')")" "true" "without --script, independence names the manual fan-out rung"

echo "assemble-args: literal replacement metacharacters"
# Exercise the real generator: string replacements must not interpret caller/report text.
set +e
node --input-type=module - "$A" "$T" "$SCRIPT_DIR/engine-mock.mjs" <<'NODE'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
const [assembler, dir, mock] = process.argv.slice(2)
const literal = "$& $` $' $$"
const prior = `PRIOR-REPORT-MARKER\nPrior report: ${literal}\n`
writeFileSync(`${dir}/literal-prior.md`, prior)
const AsyncFunction = (async () => {}).constructor
let failures = 0
const check = (name, fn) => {
  try { fn(); console.log(`  [PASS] ${name}`) }
  catch (e) { failures++; console.log(`  [FAIL] ${name} — ${e.message}`) }
}
for (const scenario of ['prior', 'inputs', 'independence']) {
  const customIndependence = scenario === 'independence'
  const stem = `${dir}/literal-${scenario}`
  const artifact = scenario === 'inputs' ? `Caller artifact: ${literal}` : 'b@2 vs m@0'
  const diffStat = scenario === 'inputs' ? `Caller diff stat: ${literal}` : 'M a.js'
  const independence = `Caller independence: ${literal}`
  const result = spawnSync('bash', [assembler, '--mode', 'pr', '--inputs', artifact,
    '--artifact', artifact, '--diff-stat', diffStat, '--iteration', '2',
    '--prior-report', `${dir}/literal-prior.md`, '--punch-listed', `${dir}/punch.txt`,
    '--out', `${stem}.json`, '--script', `${stem}.js`,
    ...(customIndependence ? ['--independence', independence] : [])], { encoding: 'utf8' })
  check(`${scenario}: generator accepts literal input`, () => assert.equal(result.status, 0, result.stderr))
  if (result.status !== 0) continue
  const args = JSON.parse(readFileSync(`${stem}.json`, 'utf8'))
  check('prior report keeps all replacement metacharacters in args', () => assert.equal(args.priorReport, prior))
  check('caller diff stat keeps all replacement metacharacters in triage', () => assert.ok(args.prompts.triage.includes(diffStat)))
  check('caller artifact keeps all replacement metacharacters in every scout', () => {
    for (const prompt of Object.values(args.prompts.scouts)) assert.ok(prompt.includes(artifact))
  })
  if (customIndependence) check('caller independence stays literal in both reporter insertions', () => {
    assert.ok(args.prompts.reporter.includes(`independence: ${independence}`))
    assert.ok(args.prompts.reporter.includes(`The \`independence:\` line is \`${independence}\` exactly as the`))
  })
  const source = readFileSync(`${stem}.js`, 'utf8')
  check('generated script parses with replacement metacharacters', () => {
    new AsyncFunction('args', 'agent', 'parallel', 'log', 'phase', source.replace('export const meta', 'const meta'))
  })
  check('generated script embeds args verbatim', () => {
    const embedded = source.match(/^const A = (.*)$/m)
    assert.ok(embedded, 'embedded args declaration missing')
    assert.deepEqual(JSON.parse(embedded[1]), args)
  })
  if (!customIndependence) check('generated literal-input script executes against existing mocks', () => {
    const execution = spawnSync(process.execPath, [mock, `${stem}.js`, 'pr-r2'], { encoding: 'utf8' })
    assert.equal(execution.status, 0, execution.stdout + execution.stderr)
  })
}
process.exit(failures ? 1 : 0)
NODE
rc=$?
set -e
[ "$rc" -eq 0 ] || FAILURES=$((FAILURES + 1))

echo "assemble-args: pinned PR sources and isolated reproductions"
node --input-type=module - "$A" "$T" <<'NODE'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
const [assembler, dir] = process.argv.slice(2)
const repo = `${dir}/caller`
mkdirSync(repo)
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim()
git('init', '-q'); git('config', 'user.email', 'test@example.com'); git('config', 'user.name', 'Test')
writeFileSync(`${repo}/source.txt`, 'base\n'); git('add', '.'); git('commit', '-qm', 'base')
const base = git('rev-parse', 'HEAD')
writeFileSync(`${repo}/source.txt`, 'reviewed\n'); git('commit', '-qam', 'reviewed')
const head = git('rev-parse', 'HEAD')
git('branch', 'reviewed')
writeFileSync(`${repo}/source.txt`, 'advanced caller\n'); git('commit', '-qam', 'advance caller')
const result = spawnSync('bash', [assembler, '--mode', 'pr', '--inputs', 'reviewed vs base', '--repo', repo, '--base', base, '--head', 'reviewed'], { encoding: 'utf8' })
assert.equal(result.status, 0, result.stderr)
const args = JSON.parse(result.stdout)
assert.deepEqual(args.source, { repo, base, head })
for (const prompt of [...Object.values(args.prompts.scouts), ...Object.values(args.prompts.seats)]) {
  assert.ok(prompt.includes(`diff ${base}...${head}`), 'diff uses captured commits')
  assert.ok(prompt.includes(`show ${head}:<path>`), 'source uses captured head')
  assert.match(prompt, /detached\s+worktree/, 'filesystem access is review-owned')
}
assert.ok(args.prompts.triage.includes(`Diff ${base}...${head}`))
const status = git('status', '--porcelain=v1'), caller = readFileSync(`${repo}/source.txt`, 'utf8')
for (const name of ['review-one', 'review-two']) git('worktree', 'add', '--detach', `${dir}/${name}`, head)
writeFileSync(`${dir}/review-two/output.txt`, 'other review\n')
writeFileSync(`${dir}/review-one/source.txt`, 'mutation\n')
writeFileSync(`${dir}/review-one/output.txt`, 'reproduction\n')
assert.equal(readFileSync(`${repo}/source.txt`, 'utf8'), caller)
assert.equal(git('status', '--porcelain=v1'), status)
assert.equal(readFileSync(`${dir}/review-two/source.txt`, 'utf8'), 'reviewed\n')
assert.equal(readFileSync(`${dir}/review-two/output.txt`, 'utf8'), 'other review\n')
const bad = spawnSync('bash', [assembler, '--mode', 'pr', '--inputs', 'x', '--repo', repo, '--base', base, '--head', 'missing-ref', '--diff-stat', 'M source.txt'], { encoding: 'utf8' })
assert.equal(bad.status, 2, 'unresolved source is rejected even with a supplied stat')
console.log('  [PASS] captured PR inputs survive caller advancement; independent mutable reproductions preserve caller and sibling')
NODE

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

echo "assemble-args: source review readiness"
node --input-type=module - "$A" "$T" <<'NODE'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
const [assembler, dir] = process.argv.slice(2)
const base = ['--mode', 'pr', '--inputs', 'captured-source', '--diff-stat', 'M a.js']
const unknown = { coverage: 'unknown', provenance: 'unknown', basis: '' }
const values = [
  { coverage: 'complete', provenance: 'available', basis: 'Verified captured-source full-range inspection inventory.', evidenceRef: 'inventory.json' },
  { coverage: 'bounded', provenance: 'unavailable', basis: 'Only four inspected ranges; archived provenance missing.' },
  unknown,
]
for (const value of values) {
  writeFileSync(`${dir}/readiness.json`, JSON.stringify(value))
  for (const input of [JSON.stringify(value), `@${dir}/readiness.json`]) {
    const result = spawnSync('bash', [assembler, ...base, '--review-readiness', input], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(JSON.parse(result.stdout).reviewReadiness, value, 'same caller JSON object survives transport')
  }
}
assert.deepEqual(JSON.parse(readFileSync(`${dir}/pr1.json`)).reviewReadiness, unknown)
for (const value of ['', '{', 'null', '[]', JSON.stringify({ coverage: 'complete', provenance: 'available', basis: '' }), JSON.stringify({ coverage: 'all', provenance: 'available', basis: 'e' })]) {
  const result = spawnSync('bash', [assembler, ...base, '--review-readiness', value], { encoding: 'utf8' })
  assert.equal(result.status, 2, result.stderr)
}
console.log('  [PASS] readiness omission is unknown; JSON and @file preserve valid evidence; malformed input exits 2')
NODE

echo "assemble-args: no node"
nonode=$(mktemp -d)
for b in bash dirname; do ln -s "$(command -v "$b")" "$nonode/$b"; done
run env PATH="$nonode" bash "$A" --mode pr --inputs x
rm -rf "$nonode"
assert_eq "$code" 4 "missing node exits 4"
assert_eq "$(printf '%s' "$out" | cut -c1-17)" "NODE_UNAVAILABLE:" "missing node prints the manual-assembly line"

echo "engine run of the assembled script (mock agents)"
for s in pr-r1:pr1 pr-r1-yield:pr1 pr-r2:pr2 pr-r2-empty:pr2 design-r1:d1; do
  set +e; node "$SCRIPT_DIR/engine-mock.mjs" "$T/${s#*:}.js" "${s%%:*}"; rc=$?; set -e
  [ "$rc" -eq 0 ] || FAILURES=$((FAILURES + 1))
done

echo
if [ "$FAILURES" -eq 0 ]; then echo "All super-roast assemble-args tests passed"; else echo "$FAILURES failure(s)"; exit 1; fi
