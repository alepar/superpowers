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
printf 'super-roast verdict: Blocking (1 confirmed)\nPRIOR-REPORT-MARKER\n## Confirmed findings\n- [Blocking] b.js:4 — unguarded null\n' > "$T/prior-blocking.md"
printf 'super-roast verdict: Blocking (1 confirmed)\n## Confirmed findings\n- [Blocking] build.log:1 — noisy log\n' > "$T/prior-scope.md"

echo "assemble-args: shape"
run bash "$A" --mode pr --inputs "b@1 vs m@0" --diff-stat "M a.js" --out "$T/pr1.json" --script "$T/pr1.js" \
  --report-dir docs/superpowers/reviews --topic demo --date 2026-10-01
assert_eq "$code" 0 "pr round 1 exits 0"
assert_eq "$(printf '%s\n' "$out" | grep '^report:')" "report: docs/superpowers/reviews/2026-10-01-demo-roast-pr-1.md" "report path carries mode and round"
assert_eq "$(q "$T/pr1.json" "d.config.coreLanes.join(',')")" "correctness,security,premortem,simplicity-design,hot-path-perf,concurrency-async,text-formats" "pr core lanes from triage-prompt.md"
assert_eq "$(q "$T/pr1.json" "Object.keys(d.prompts.scouts).length")" "17" "pr round 1: 17 lane prompts, no regression"
assert_eq "$(q "$T/pr1.json" "d.priorReport === '' && d.iteration === 1")" "true" "round 1: empty prior report, numeric iteration"
assert_eq "$(q "$T/pr1.json" "d.prompts.seatsSafe === undefined")" "true" "seatsSafe only on request"

run bash "$A" --mode pr --inputs "b@2 vs m@0" --iteration 2 --prior-report "$T/prior.md" --punch-listed "$T/punch.txt" --diff-stat "M a.js" --seats-safe --out "$T/pr2.json" --script "$T/pr2.js"
run bash "$A" --mode pr --inputs "b@2 vs m@0" --iteration 2 --prior-report "$T/prior-blocking.md" --diff-stat "M b.js" --out "$T/pr2u.json" --script "$T/pr2u.js" \
  --review-readiness '{"coverage":"complete","provenance":"available","basis":"Captured b@2 vs m@0 and full changed-hunk inventory."}'
assert_eq "$code" 0 "pr round 2 with a prior Blocking exits 0"
run bash "$A" --mode pr --inputs "b@2 vs m@0" --iteration 2 --prior-report "$T/prior-scope.md" --diff-stat "M b.js" --out "$T/pr2s.json" --script "$T/pr2s.js" \
  --review-readiness '{"coverage":"complete","provenance":"available","basis":"Captured b@2 vs m@0 and full changed-hunk inventory."}'
assert_eq "$code" 0 "pr round 2 with an out-of-scope prior Blocking exits 0"
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

echo "assemble-args: excluded trees"
# Breaks caught: run records, vendored trees, logs or linguist-generated files in the scouts' diff
# or triage's stat without any flag; an excluded tree dropped without a trace; the run's design
# spec excluded with its run records; the project scope file ignored; --include not honoured or
# not recorded.
set +e
node --input-type=module - "$A" "$T" <<'NODE'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
const [assembler, dir] = process.argv.slice(2)
const repo = `${dir}/excludes`
const run = `${repo}/docs/superpowers/runs/2026-01-01-x`
for (const d of [`${run}/reviews/i`, `${repo}/vendor/lib`, `${repo}/gen`, `${repo}/scratch`]) mkdirSync(d, { recursive: true })
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim()
git('init', '-q'); git('config', 'user.email', 'test@example.com'); git('config', 'user.name', 'Test')
writeFileSync(`${repo}/product.txt`, 'base\n')
writeFileSync(`${repo}/.gitattributes`, '*.pb.go linguist-generated\ngen/hand.pb.go -linguist-generated\n/top.gen linguist-vendored=true\nthird_party/** -linguist-vendored\n*.sh text eol=lf\n')
writeFileSync(`${repo}/.super-roast-scope`, '# project scope\n/scratch/\n')
git('add', '.'); git('commit', '-qm', 'base')
const base = git('rev-parse', 'HEAD')
writeFileSync(`${repo}/product.txt`, 'reviewed\n')
for (const f of ['run.md', 'reviews/i/final-review-i.md', 'findings-ledger-design.md']) writeFileSync(`${run}/${f}`, 'canary\n')
writeFileSync(`${run}/2026-01-01-x-design.md`, 'spec\n')
writeFileSync(`${repo}/vendor/lib/lib.go`, 'canary\n')
writeFileSync(`${repo}/build.log`, 'canary\n'); writeFileSync(`${repo}/gen/events.jsonl`, 'canary\n')
writeFileSync(`${repo}/gen/api.pb.go`, 'canary\n'); writeFileSync(`${repo}/gen/hand.pb.go`, 'handwritten\n')
writeFileSync(`${repo}/scratch/notes.txt`, 'canary\n')
writeFileSync(`${repo}/top.gen`, 'canary\n'); writeFileSync(`${repo}/sub.top.gen`, 'kept\n')
mkdirSync(`${repo}/third_party/x`, { recursive: true }); writeFileSync(`${repo}/third_party/x/x.c`, 'canary\n')
// The change under review tries to exempt its own code: rules come from the base commit, so it can't.
writeFileSync(`${repo}/.super-roast-scope`, '# project scope\n/scratch/\nproduct.txt\n')
writeFileSync(`${repo}/.gitattributes`, 'product.txt linguist-generated\n')
git('add', '.'); git('commit', '-qm', 'reviewed')
const head = git('rev-parse', 'HEAD')
const assemble = (...extra) => {
  const r = spawnSync('bash', [assembler, '--mode', 'pr', '--inputs', 'x', '--repo', repo, '--base', base, '--head', head, ...extra], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  return JSON.parse(r.stdout)
}
const diffOf = args => execFileSync('bash', ['-c', args.prompts.scouts.correctness.match(/all diffs use `([^`]*)`/)[1]], { encoding: 'utf8' })
const args = assemble()
const diff = diffOf(args)
assert.ok(['product.txt', '2026-01-01-x-design.md', 'hand.pb.go', 'sub.top.gen', '.gitattributes', '.super-roast-scope'].every(p => diff.includes(p)), 'the diff keeps product code, the run spec, unset and unanchored linguist paths, and a head-side self-exemption')
assert.ok(!diff.includes('canary'), 'with no flags the diff leaves run records, vendor, third_party (an unset attribute does not re-include it), logs, JSONL, linguist-set and scope-file paths out')
assert.equal(diff.split('\n').filter(l => l.startsWith('diff --git')).length, 6, 'each kept path appears once')
const fileCmd = args.prompts.scouts.correctness.match(/To view one file's diff, run `([^`]*)`/)[1]
assert.ok(fileCmd.endsWith(' -- <path>'), 'the per-file form takes one path')
const fileDiff = execFileSync('bash', ['-c', fileCmd.replace('<path>', 'product.txt')], { encoding: 'utf8' })
assert.equal(fileDiff.split('\n').filter(l => l.startsWith('diff --git')).length, 1, 'the per-file form shows only that file')
for (const text of [args.prompts.triage, args.prompts.scouts.correctness]) {
  for (const line of ['excluded: docs/superpowers/runs/ (3 files changed)', 'excluded: vendor/ (1 files changed)', 'excluded: **/*.log (1 files changed)',
    'excluded: **/*.jsonl (1 files changed)', 'excluded: scratch/ (1 files changed)', 'excluded: third_party/ (1 files changed)',
    'excluded: linguist-generated/vendored paths (.gitattributes) (2 files changed)'])
    assert.ok(text.includes(line), `summary line: ${line}`)
  assert.ok(!text.includes('excluded: evidence/'), 'a tree without changes gets no line')
}
assert.ok(!/canary|lib\.go|run\.md|build\.log|events\.jsonl|api\.pb\.go|notes\.txt|x\.c\b/.test(args.prompts.triage.replace(/Review scope:.*/s, '')), 'triage stat names no excluded path')
assert.ok(args.prompts.scouts.correctness.includes('Review scope: a finding located only on a path matching docs/superpowers/runs/**'), 'scouts are told the engine scope rule')
assert.ok(args.prompts.seats.refute.includes('Review scope:'), 'seats are told the engine scope rule')
assert.deepEqual(args.scope.sources, ['defaults', '.super-roast-scope (1)', '.gitattributes linguist (2)'])
assert.ok(['scratch/**', 'top.gen', 'gen/api.pb.go'].every(g => args.scope.exclude.includes(g)), 'scope-file directory entry, anchored and set linguist paths are excluded')
assert.ok(!args.scope.exclude.includes('product.txt') && !args.scope.exclude.includes('sub.top.gen') && !args.scope.exclude.includes('gen/hand.pb.go'))
assert.deepEqual(args.scope.keep, ['docs/superpowers/runs/*/[0-9]*-design.md'], 'an unset attribute adds no keep')
assert.equal(args.scope.root, repo)
const supplied = assemble('--diff-stat', 'M product.txt')
assert.ok(supplied.prompts.triage.includes('M product.txt\nexcluded: docs/superpowers/runs/ (3 files changed)'), 'a supplied stat gains the summary lines')
const opted = assemble('--include', 'vendor/**', '--include', '**/*.log')
const optedDiff = diffOf(opted)
assert.ok(optedDiff.includes('lib.go') && optedDiff.includes('build.log') && !optedDiff.includes('events.jsonl'), '--include brings exactly its paths back')
assert.ok(!opted.prompts.triage.includes('excluded: vendor/') && opted.prompts.triage.includes('excluded: **/*.jsonl'), 'an included tree gets no summary line')
assert.deepEqual(opted.scope.include, ['vendor/**', '**/*.log'], 'the opt-out is recorded for the report header')
const vrepo = `${dir}/vendor-only`
mkdirSync(`${vrepo}/vendor`, { recursive: true })
const vgit = (...a) => execFileSync('git', ['-C', vrepo, ...a], { encoding: 'utf8' }).trim()
vgit('init', '-q'); vgit('config', 'user.email', 't@example.com'); vgit('config', 'user.name', 'T')
writeFileSync(`${vrepo}/a.txt`, 'a\n'); vgit('add', '.'); vgit('commit', '-qm', 'b')
writeFileSync(`${vrepo}/vendor/v.go`, 'v\n'); vgit('add', '.'); vgit('commit', '-qm', 'h')
const vonly = spawnSync('bash', [assembler, '--mode', 'pr', '--inputs', 'x', '--repo', vrepo, '--base', 'HEAD~1', '--head', 'HEAD'], { encoding: 'utf8' })
assert.equal(vonly.status, 0, vonly.stderr)
assert.ok(vonly.stderr.includes('scope: every changed path is out of scope (1)'), 'a change confined to excluded trees is flagged')
const vin = spawnSync('bash', [assembler, '--mode', 'pr', '--inputs', 'x', '--repo', vrepo, '--base', 'HEAD~1', '--head', 'HEAD', '--include', 'vendor/**'], { encoding: 'utf8' })
assert.ok(!vin.stderr.includes('every changed path'), 'no warning once included')
const design = JSON.parse(spawnSync('bash', [assembler, '--mode', 'design', '--inputs', 'x', '--spec', `${run}/run.md`], { encoding: 'utf8' }).stdout)
assert.ok(design.scope.keep.includes('docs/superpowers/runs/2026-01-01-x/run.md') && design.scope.root === repo, 'design mode keeps the spec under review in scope')
assert.ok(design.scope.exclude.includes('scratch/**'), 'design mode reads the scope file from the working tree')
console.log('  [PASS] default, scope-file and linguist exclusions leave the diff and stat with one summary line each; kept specs and --include paths stay')
NODE
rc=$?
set -e
[ "$rc" -eq 0 ] || FAILURES=$((FAILURES + 1))

echo "assemble-args: shared review-scope defaults"
# Break caught: super-roast and super-code's review packages drift apart on what is out of scope.
# super-code's lists may be a subset (no logs/JSONL there); every glob they name must be a super-roast
# default, and the run-spec keep must match exactly.
set +e
node --input-type=module - "$REPO_ROOT" <<'NODE'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
const [root] = process.argv.slice(2)
const src = readFileSync(`${root}/skills/super-roast/scripts/assemble-args.mjs`, 'utf8')
const list = name => JSON.parse(src.match(new RegExp(`^const ${name} = (\\[.*\\])$`, 'm'))[1].replaceAll("'", '"'))
const ex = list('DEFAULT_EXCLUDES'), keep = list('DEFAULT_KEEPS')
const pairs = text => { const out = { exclude: [], keep: [] }; for (const m of text.matchAll(/'--(exclude|keep)', '([^']+)'/g)) out[m[1]].push(m[2]); return out }
const coord = pairs(readFileSync(`${root}/skills/super-code/coordinator.js`, 'utf8').match(/^ *const scope = \['--exclude'.*$/m)[0])
const pkgPath = `${root}/skills/super-code/scripts/review-package`
const consumers = { 'coordinator.js': coord }
if (existsSync(pkgPath)) {
  const pkg = readFileSync(pkgPath, 'utf8')
  const arr = name => [...(pkg.match(new RegExp(`^${name}=\\(([^)]*)\\)`, 'm'))?.[1] ?? '').matchAll(/'([^']+)'/g)].map(m => m[1])
  consumers['review-package'] = { exclude: arr('excludes'), keep: arr('keeps') }
}
for (const [name, c] of Object.entries(consumers)) {
  assert.ok(c.exclude.length >= 4, `${name}: exclusion list found`)
  for (const g of c.exclude) assert.ok(ex.includes(g), `${name} excludes ${g}, which is not a super-roast default`)
  assert.deepEqual(c.keep, keep, `${name} keeps`)
}
console.log(`  [PASS] review-scope defaults agree: super-roast and ${Object.keys(consumers).join(', ')}`)
NODE
rc=$?
set -e
[ "$rc" -eq 0 ] || FAILURES=$((FAILURES + 1))

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

echo "assemble-args: caller-derived review readiness"
node --input-type=module - "$A" <<'NODE'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
const assembler = process.argv[2]
const pr = ['--mode', 'pr', '--inputs', 'captured-source', '--diff-stat', 'M a.js']
const design = ['--mode', 'design', '--inputs', 'docs/spec.md', '--spec', '/abs/spec.md']
const accepted = [
  [pr, { coverage: 'complete', provenance: 'available', basis: '/r/assembled/roast-code-r2/review-inputs.json: status complete, no gaps, captured 1111111..2222222' }],
  [pr, { coverage: 'bounded', provenance: 'unavailable', basis: 'review input selection: provenance unavailable; captured source available; inspected src/a.js; unreviewed docs/old/run.md' }],
  [pr, { coverage: 'unknown', provenance: 'unavailable', basis: 'assembler: unavailable — exit 1' }],
  [design, { coverage: 'complete', provenance: 'available', basis: 'settled tree @3333333: docs/spec.md' }],
  [design, { coverage: 'unknown', provenance: 'unknown', basis: 'docs/spec.md has uncommitted changes' }],
]
for (const [args, value] of accepted) {
  const result = spawnSync('bash', [assembler, ...args, '--review-readiness', JSON.stringify(value)], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout).reviewReadiness, value, 'derived readiness survives transport unchanged')
}
for (const args of [pr, design]) {
  for (const basis of ['', '   ']) {
    const result = spawnSync('bash', [assembler, ...args, '--review-readiness', JSON.stringify({ coverage: 'complete', provenance: 'available', basis })], { encoding: 'utf8' })
    assert.equal(result.status, 2, `complete+available with basis ${JSON.stringify(basis)} is rejected`)
  }
}
console.log('  [PASS] derived readiness values accepted; complete without a basis exits 2 in both modes')
NODE

flat() { tr '\n' ' ' < "$1" | tr -s ' '; }
has() {
  case "$1" in *"$3"*) pass "$2 has: $3" ;; *) fail "$2 lacks: $3" ;; esac
}
ROAST_RAW="$REPO_ROOT/skills/super-roast/SKILL.md"
AUTO_RAW="$REPO_ROOT/skills/super-auto/SKILL.md"
row=$(grep '^| review readiness' "$ROAST_RAW" || true)
for p in coverage provenance basis '--review-readiness'; do
  has "$row" "super-roast Inputs row" "$p"
done
AUTO=$(flat "$AUTO_RAW")
for p in 'review-inputs.json' '"coverage":"complete","provenance":"available"' '"coverage":"bounded","provenance":"unavailable"' '"coverage":"unknown","provenance":"unavailable"' 'outOfRange' 'never copied from a prior round' 'green sweep'; do
  has "$AUTO" "super-auto phase 4" "$p"
done
has "$(grep 'iteration `post-cap audit`, which `super-roast` accepts, with the punch-list file' "$AUTO_RAW")" "post-cap audit" "review readiness"
amend=$(grep '^3\. On `applied`' "$AUTO_RAW")
has "$amend" "amend design roast" "review readiness"
has "$amend" "amend design roast" '§Adversarial Review Loop (root only)'
DESIGN=$(flat "$REPO_ROOT/skills/super-design/SKILL.md")
for p in '**Review readiness (design roast).**' 'settled tree @<sha>: <spec paths>' 'git status --porcelain'; do
  has "$DESIGN" "super-design" "$p"
done

echo "assemble-args: no node"
nonode=$(mktemp -d)
for b in bash dirname; do ln -s "$(command -v "$b")" "$nonode/$b"; done
run env PATH="$nonode" bash "$A" --mode pr --inputs x
rm -rf "$nonode"
assert_eq "$code" 4 "missing node exits 4"
assert_eq "$(printf '%s' "$out" | cut -c1-17)" "NODE_UNAVAILABLE:" "missing node prints the manual-assembly line"

echo "engine run of the assembled script (mock agents)"
for s in pr-r1:pr1 pr-r1-yield:pr1 pr-r1-preexisting:pr1 pr-r1-preexisting-fallback:pr1 pr-r2:pr2 pr-r2-empty:pr2 pr-r2-unjudged:pr2u pr-r2-unjudged-misformat:pr2u pr-r2-unjudged-held:pr2u pr-r1-scope:pr1 pr-r1-scope-fallback:pr1 pr-r2-scope-prior:pr2s design-r1:d1; do
  set +e; node "$SCRIPT_DIR/engine-mock.mjs" "$T/${s#*:}.js" "${s%%:*}"; rc=$?; set -e
  [ "$rc" -eq 0 ] || FAILURES=$((FAILURES + 1))
done

echo
if [ "$FAILURES" -eq 0 ]; then echo "All super-roast assemble-args tests passed"; else echo "$FAILURES failure(s)"; exit 1; fi
