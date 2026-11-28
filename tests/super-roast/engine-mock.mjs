// Runs a super-roast engine script produced by `assemble-args --script` against a mock agent()
// and checks how the assembled prompts reach each stage. Usage: node engine-mock.mjs <script> <scenario>
// Scenarios: pr-r1, pr-r1-yield, pr-r1-preexisting[-fallback], pr-r2, pr-r2-empty,
// pr-r2-unjudged[-misformat|-held] (prior report lists `[Blocking] b.js:4`), pr-r1-scope[-fallback],
// pr-r2-scope-prior (prior report lists `[Blocking] build.log:1`), design-r1. Prints PASS/FAIL lines; exits 1 on any failure.
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const [scriptPath, scenario] = process.argv.slice(2)
const src = readFileSync(scriptPath, 'utf8').replace('export const meta', 'const meta')
const AsyncFunction = (async () => {}).constructor
const run = new AsyncFunction('args', 'agent', 'parallel', 'log', 'phase', src)
const parallel = fns => Promise.all(fns.map(f => Promise.resolve().then(f).catch(() => null)))

let failures = 0
const check = (name, fn) => { try { fn(); console.log(`  [PASS] ${scenario}: ${name}`) } catch (e) { failures++; console.log(`  [FAIL] ${scenario}: ${name} — ${e.message}`) } }

const F = (claim, location, category) => ({ claim, location, category, external: false, evidence: 'e' })
const V = (verdict, severity) => ({ verdict, severity, evidence: 'ev' })
const seen = []
const agent = async (prompt, o) => {
  seen.push({ label: o.label, prompt, o })
  const pre = scenario.startsWith('pr-r1-preexisting')
  if (o.label === 'triage') return { lanes: pre ? ['testing', 'test-suite-cost', 'test-isolation-environment'] : scenario.startsWith('pr') ? ['testing'] : [], domains: scenario.startsWith('design') ? ['queueing'] : [] }
  if (scenario === 'pr-r2-empty' && o.label.startsWith('scout:')) return { findings: [] }
  // Scope: run records, a log and a vendored path are out of scope; a run's design spec, a mixed
  // location and a location naming no path stay in.
  if (scenario.startsWith('pr-r1-scope') && o.label === 'scout:correctness') return { findings: [
    F('core defect', 'c.js:1', 'correctness'), F('log noise', '`build.log:12`', 'correctness'),
    F('run record typo', 'docs/superpowers/runs/2026-01-01-x/run.md:3; vendor/lib/lib.go:9', 'correctness'),
    F('spec gap', 'docs/superpowers/runs/2026-01-01-x/2026-01-01-x-design.md:4', 'correctness'),
    F('caller breaks', 'vendor/lib/lib.go:2; c.js:7', 'correctness'), F('overall layering', 'the module boundary', 'correctness'),
    F('listed callers', 'vendor/lib/lib.go:9, c.js:7', 'correctness'), F('prose first', 'docs/superpowers/runs/ handling in coordinator.js', 'correctness'),
    F('line-prefixed log', 'logs/build.log:L5', 'correctness')] }
  if (scenario.startsWith('pr-r1-scope') && o.label === 'reporter' && scenario.endsWith('-fallback')) return null
  if (scenario === 'pr-r2-scope-prior' && o.label.startsWith('scout:')) return { findings: [] }
  if (scenario === 'pr-r2-scope-prior' && o.label === 'reporter')
    return { verdict: 'clean (0 nits) [converged]', reportMarkdown: ['super-roast verdict: clean (0 nits) [converged]', 'delta vs prior: 0 new confirmed (0 Blocking) · 0 resolved · 1 unjudged (open) (1 Blocking)', '## Confirmed findings', '- none', '## Prior findings (no current packet)', '- [Blocking] build.log:1 — noisy log (unjudged (open))'].join('\n'), confirmedCount: 0, escalations: [] }
  const unj = scenario.startsWith('pr-r2-unjudged')
  if (unj && o.label.startsWith('scout:')) return { findings: [], ...(scenario.endsWith('-held') && o.label === 'scout:regression' ? { fixesChecked: [{ prior: '[Blocking] b.js:4', held: true, evidence: 'b.js:4 now guards the null' }] } : {}) }
  // The reporter claims convergence and omits (or misformats) the unjudged (open) delta term.
  if (unj && o.label === 'reporter') {
    const delta = scenario.endsWith('-misformat') ? ['delta vs prior: 0 new confirmed (0 Blocking) · 0 resolved · 1 unjudged (1 Blocking)'] : []
    return { verdict: 'clean (0 nits) [converged]', reportMarkdown: ['super-roast verdict: clean (0 nits) [converged]', ...delta, '## Confirmed findings', '- none'].join('\n'), confirmedCount: 0, escalations: [] }
  }
  if (scenario === 'pr-r1-yield') {
    if (o.label === 'scout:security') return null
    if (o.label === 'scout:testing') return { findings: [F('flaky assert', 't.js:9', 'testing')] }
    if (o.label === 'dedupe') return { groups: [{ ids: [0, 1], suggestedSeverity: 'Should-fix', rank: 1 }, { ids: [2], suggestedSeverity: 'Should-fix', rank: 2 }] }
    if (o.label.startsWith('judge:')) return V(prompt.includes('t.js:9') ? 'REJECT' : 'CONFIRM', 'Should-fix')
    if (o.label === 'reporter') return null
  }
  if (pre) {
    // Mislabelled category: the engine must attribute by dispatching lane, not this string.
    if (o.label === 'scout:test-suite-cost') return { findings: [F('rebuilds deps per test', 'slow.js:3', 'testing')] }
    if (o.label === 'scout:testing') return { findings: [F('cleanup skipped on failure', 'merge.js:7', 'testing')] }
    if (o.label === 'scout:test-isolation-environment') return { findings: [F('cleanup skipped on failure', 'merge.js:7', 'test-isolation-environment')] }
    if (o.label === 'dedupe') {
      // slow.js:3 suggested Nit → spot check; the spot seat's Should-fix must promote it despite preExisting.
      // merge.js:7 merges a testing and a test-lane member.
      const raw = JSON.parse(prompt.match(/<findings>\n([\s\S]*?)\n<\/findings>/)[1])
      const ids = loc => raw.filter(f => f.location === loc).map(f => f.id)
      return { groups: [...new Set(raw.map(f => f.location))].map((loc, i) => ({ ids: ids(loc), suggestedSeverity: loc === 'slow.js:3' ? 'Nit' : 'Should-fix', rank: i + 1 })) }
    }
    if (o.label.startsWith('judge:') || o.label.startsWith('spot#')) return { ...V('CONFIRM', 'Should-fix'), preExisting: true }
    if (o.label === 'reporter' && scenario.endsWith('-fallback')) return null
  }
  if (scenario === 'pr-r2-empty' && o.label === 'reporter') return { verdict: 'clean (0 nits) [low coverage]', reportMarkdown: 'super-roast verdict: x', confirmedCount: 0, escalations: [] }
  if (o.label === 'scout:correctness' || o.label === 'scout:premortem') return { findings: [F('core defect', 'c.js:1', o.label.slice(6))] }
  if (o.label === 'scout:regression') return { findings: [F('fix broke caller', 'r.js:5', 'regression')] }
  if (o.label.startsWith('scout:')) return { findings: [] }
  if (o.label === 'dedupe') {
    const raw = JSON.parse(prompt.match(/<findings>\n([\s\S]*?)\n<\/findings>/)[1])
    return { groups: raw.map((f, i) => ({ ids: [f.id], suggestedSeverity: 'Should-fix', rank: i + 1 })) }
  }
  if (o.label.startsWith('judge:') || o.label.startsWith('spot#')) return V('CONFIRM', 'Should-fix')
  if (o.label === 'reporter') {
    const packets = JSON.parse(prompt.match(/<packets>\n([\s\S]*?)\n<\/packets>/)[1])
    const lines = packets.map(p => `- [Should-fix] ${p.finding.location} — ${p.finding.claim}`)
    return { verdict: `Should-fix (${lines.length} confirmed)`, reportMarkdown: ['super-roast verdict: x', '## Confirmed findings', ...lines].join('\n'), confirmedCount: lines.length, escalations: [] }
  }
  throw new Error(`unexpected label ${o.label}`)
}

const r = await run(undefined, agent, parallel, () => {}, () => {})
const by = l => seen.filter(s => s.label === l)
const scoutLabels = seen.filter(s => s.label.startsWith('scout:')).map(s => s.label.slice(6))

check('no unfilled assembly markers reach any agent', () => {
  for (const s of seen) for (const m of ['[LANE]', '[LENS]', '[ITERATION_STANCE]', '[RECALL_POLICY]', '[SEAT PROCEDURE]', '[SPEC_FILE_PATH', '{{'])
    assert.ok(!s.prompt.replace('the literal text `{{INDEPENDENCE}}`', '').includes(m), `${s.label} carries ${m}`)
})
check('triage lane enum built from the assembled conditional lanes', () => {
  const items = by('triage')[0].o.schema.properties.lanes.items
  if (scenario.startsWith('pr')) assert.ok(items.enum.includes('testing') && !items.enum.includes('correctness'))
})
check('every seat prompt carries the finding, without lanes', () => {
  for (const s of seen.filter(s => s.label.startsWith('judge:'))) { assert.ok(s.prompt.includes('"location"')); assert.ok(!s.prompt.includes('"lanes"')) }
})

if (scenario === 'pr-r1') {
  check('round 1: high recall, no regression scout', () => {
    assert.ok(!scoutLabels.includes('regression'))
    assert.ok(by('scout:correctness')[0].prompt.includes('## High recall'))
    assert.ok(!by('scout:correctness')[0].prompt.includes('## Materiality bar'))
  })
  check('triage-activated lane dispatched', () => assert.ok(scoutLabels.includes('testing')))
  check('no fix-regression tag on round 1', () => { assert.ok(!r.reportMarkdown.includes('[fix-regression]')); assert.deepEqual(r.fixRegressions, []) })
}
if (scenario === 'pr-r1') {
  check('confirmed entries tagged with every lane that found their location', () => {
    const lines = r.reportMarkdown.split('\n').filter(l => l.includes('c.js:1'))
    assert.equal(lines.length, 2)
    for (const l of lines) assert.ok(l.endsWith('[lanes: correctness, premortem]'), l)
  })
  check('lane-yield header line and coverage.laneYield', () => {
    assert.ok(r.reportMarkdown.split('\n').includes('lane-yield (found/confirmed/unique/refuted): correctness 1/1/1/0 · security 0/0/0/0 · premortem 1/1/1/0 · simplicity-design 0/0/0/0 · hot-path-perf 0/0/0/0 · concurrency-async 0/0/0/0 · text-formats 0/0/0/0 · testing 0/0/0/0'))
    assert.deepEqual(r.coverage.laneYield.premortem, { found: 1, confirmed: 1, unique: 1, refuted: 0 })
  })
}
if (scenario === 'pr-r1-yield') {
  check('agent count unchanged: 8 scouts + triage + dedupe + 2 panels + 2 reporter tries', () => assert.equal(seen.length, 1 + 8 + 1 + 6 + 2))
  check('merged finding: shared lanes count confirmed, not unique; dead scout and refuted lane shown', () => {
    assert.deepEqual(r.coverage.laneYield.correctness, { found: 1, confirmed: 1, unique: 0, refuted: 0 })
    assert.deepEqual(r.coverage.laneYield.testing, { found: 1, confirmed: 0, unique: 0, refuted: 1 })
    assert.ok(r.reportMarkdown.includes('lane-yield (found/confirmed/unique/refuted): correctness 1/1/0/0 · security dead · premortem 1/1/0/0 ·'))
  })
  check('fallback report tags confirmed entries with lanes, not rejected ones', () => {
    assert.equal(r.reporterFailed, true)
    const lines = r.reportMarkdown.split('\n')
    assert.ok(lines.some(l => l.startsWith('- [Should-fix] c.js:1 — core defect [lanes: correctness, premortem]')))
    assert.ok(lines.some(l => l.includes('t.js:9') && !l.includes('[lanes: ')))
  })
}
if (scenario.startsWith('pr-r1-preexisting')) {
  check('pre-existing: generic finding demoted to FYI, test-lane finding keeps its seat severity', () => {
    const lines = r.reportMarkdown.split('\n')
    assert.ok(lines.some(l => /^- \[FYI\] c\.js:1 — /.test(l)), r.reportMarkdown)
    assert.ok(lines.some(l => /^- \[Should-fix\] slow\.js:3 — /.test(l)), r.reportMarkdown)
    assert.ok(!lines.some(l => /^- \[FYI\] slow\.js:3 — /.test(l)))
    assert.ok(lines.some(l => /^- \[Should-fix\] merge\.js:7 — /.test(l)), 'merged testing + test-lane finding keeps severity')
  })
  check('pre-existing test-lane spot check promotes to a full panel', () => {
    assert.ok(seen.some(s => s.label.startsWith('spot#')), 'slow.js:3 went to a spot check')
    assert.ok(seen.some(s => s.label.startsWith('judge:') && s.prompt.includes('slow.js:3')), 'promoted panel ran on slow.js:3')
  })
  check('all three test lanes are in the triage enum', () => {
    const items = by('triage')[0].o.schema.properties.lanes.items.enum
    for (const l of ['test-causality-lifecycle', 'test-isolation-environment', 'test-suite-cost']) assert.ok(items.includes(l), l)
  })
  check('verdict severity reflects the kept test-lane finding', () => assert.ok(r.verdict.startsWith('Should-fix'), r.verdict))
}
if (scenario === 'pr-r2') {
  check('round 2: materiality bar and the prior report reach every scout', () => {
    for (const s of seen.filter(s => s.label.startsWith('scout:'))) {
      assert.ok(s.prompt.includes('## Materiality bar'), s.label)
      assert.ok(s.prompt.includes('PRIOR-REPORT-MARKER'), s.label)
    }
  })
  check('regression scout dispatched as a core lane', () => assert.ok(scoutLabels.includes('regression')))
  check('regression finding tagged [fix-regression]; core finding not', () => {
    const lines = r.reportMarkdown.split('\n')
    assert.ok(lines.some(l => l.includes('r.js:5') && l.endsWith('[lanes: regression] [fix-regression]')))
    assert.ok(lines.some(l => l.includes('c.js:1') && !l.includes('[fix-regression]')))
  })
  check('fixRegressions return field names the regression finding', () => assert.deepEqual(r.fixRegressions.map(f => f.location), ['r.js:5']))
  check('iteration label rendered N of cap', () => assert.ok(by('reporter')[0].prompt.includes('iteration: 2 of 3')))
  check('punch-listed keys reach the reporter', () => assert.ok(by('reporter')[0].prompt.includes('<punch_listed>\n[Should-fix] c.js:1\n[Nit] d.js:2; e.js:3\n</punch_listed>')))
}
if (scenario === 'pr-r2-empty') {
  check('empty late round preserves reporter limitation and unknown source readiness', () => {
    assert.equal(r.coverage.emptyLateRound, true)
    assert.equal(r.verdict, 'clean (0 nits) [low coverage] [review readiness incomplete]')
    assert.equal(r.coverage.lowCoverage, false)
    assert.equal(r.coverage.convergenceEligible, false)
    assert.ok(r.reportMarkdown.startsWith('super-roast verdict: ' + r.verdict))
  })
}
if (scenario === 'pr-r2-unjudged' || scenario === 'pr-r2-unjudged-misformat') {
  check('engine-counted unjudged prior Blocking withholds convergence despite the reporter delta term', () => {
    assert.equal(r.coverage.convergenceEligible, true)
    assert.ok(!r.verdict.includes('[converged]'), r.verdict)
    assert.ok(!r.reportMarkdown.split('\n')[0].includes('[converged]'), r.reportMarkdown)
    assert.ok(r.enforcement.includes('converged: withheld, 1 prior Blocking unjudged (open): b.js:4'), r.enforcement.join('; '))
  })
}
if (scenario === 'pr-r2-unjudged-held') {
  check('a held fix check resolves the prior Blocking: converged', () => {
    assert.ok(r.verdict.endsWith('[converged]'), r.verdict)
    assert.ok(!r.enforcement.some(e => e.startsWith('converged: withheld')), r.enforcement.join('; '))
  })
}
if (scenario.startsWith('pr-r1-scope')) {
  const dropped = ['`build.log:12`', 'docs/superpowers/runs/2026-01-01-x/run.md:3; vendor/lib/lib.go:9', 'logs/build.log:L5']
  check('out-of-scope findings never reach dedupe or a judge', () => {
    const rawIn = JSON.parse(by('dedupe')[0].prompt.match(/<findings>\n([\s\S]*?)\n<\/findings>/)[1]).map(f => f.location)
    for (const d of dropped) assert.ok(!rawIn.includes(d), d)
    for (const k of ['c.js:1', 'docs/superpowers/runs/2026-01-01-x/2026-01-01-x-design.md:4', 'vendor/lib/lib.go:2; c.js:7', 'the module boundary',
      'vendor/lib/lib.go:9, c.js:7', 'docs/superpowers/runs/ handling in coordinator.js']) assert.ok(rawIn.includes(k), `kept: ${k}`)
    assert.ok(!seen.some(s => (s.label.startsWith('judge:') || s.label.startsWith('spot#')) && (s.prompt.includes('build.log') || s.prompt.includes('run.md:3'))))
  })
  check('dropped findings are listed, not counted', () => {
    const lines = r.reportMarkdown.split('\n')
    const at = lines.indexOf('## Out of scope (dropped — not counted)')
    assert.ok(at > 0, r.reportMarkdown)
    assert.deepEqual(lines.slice(at + 1), dropped.map((d, i) => `- [out-of-scope (dropped)] ${d} — ${['log noise', 'run record typo', 'line-prefixed log'][i]} [lanes: correctness]`))
    assert.equal(r.coverage.outOfScopeDropped, 3)
    assert.equal(r.coverage.rawFindings, 7, 'six in-scope correctness findings plus premortem')
    assert.equal(r.coverage.laneYield.correctness.found, 6)
    assert.deepEqual(r.outOfScope.map(f => f.location), dropped)
    assert.ok(!lines.slice(lines.indexOf('## Confirmed findings'), at).some(l => l.includes('build.log') || l.includes('run.md:3')))
  })
  check('scope header line records exclusions, keeps, opt-outs and the drop count', () => {
    const line = r.reportMarkdown.split('\n').find(l => l.startsWith('scope: '))
    assert.ok(line && line.startsWith('scope: out of scope docs/superpowers/runs/**, evidence/**, vendor/**, third_party/**, **/*.log, **/*.jsonl · kept docs/superpowers/runs/*/[0-9]*-design.md · included (opt-out) none · dropped 3'), line)
    assert.ok(r.reportMarkdown.split('\n').indexOf(line) < r.reportMarkdown.split('\n').findIndex(l => l.startsWith('## ')))
  })
}
if (scenario === 'pr-r2-scope-prior') {
  check('an out-of-scope prior Blocking does not withhold convergence, even in the reporter delta', () => {
    assert.ok(r.verdict.endsWith('[converged]'), `${r.verdict} | ${r.enforcement.join('; ')}`)
    assert.ok(r.enforcement.includes('scope: 1 prior Blocking out of scope, not held against convergence: build.log:1'), r.enforcement.join('; '))
  })
}
if (scenario === 'design-r1') {
  check('domain scout dispatched from the template', () => {
    assert.ok(scoutLabels.includes('domain:queueing'))
    assert.ok(by('scout:domain:queueing')[0].prompt.includes('You are a queueing expert'))
    assert.ok(by('scout:domain:queueing')[0].prompt.includes('`domain:queueing`'))
  })
  check('widen lenses not added when triage named a domain', () => assert.ok(!scoutLabels.includes('security')))
  check('spec path reaches scouts and seats', () => {
    assert.ok(by('scout:premortem')[0].prompt.includes('/abs/spec.md — read it'))
    for (const s of seen.filter(s => s.label.startsWith('judge:'))) assert.ok(s.prompt.includes('/abs/spec.md — read the whole spec'))
  })
}
check('independence header rendered from the assembled roster', () => assert.ok(r.reportMarkdown.includes('independence: same-family (Claude) — seat-differentiated panel')))

process.exit(failures ? 1 : 0)
