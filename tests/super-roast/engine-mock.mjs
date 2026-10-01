// Runs a super-roast engine script produced by `assemble-args --script` against a mock agent()
// and checks how the assembled prompts reach each stage. Usage: node engine-mock.mjs <script> <scenario>
// Scenarios: pr-r1, pr-r2, pr-r2-empty, design-r1. Prints PASS/FAIL lines; exits 1 on any failure.
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
  if (o.label === 'triage') return { lanes: scenario.startsWith('pr') ? ['testing'] : [], domains: scenario.startsWith('design') ? ['queueing'] : [] }
  if (scenario === 'pr-r2-empty' && o.label.startsWith('scout:')) return { findings: [] }
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
    assert.ok(lines.some(l => l.includes('r.js:5') && l.endsWith('[fix-regression]')))
    assert.ok(lines.some(l => l.includes('c.js:1') && !l.includes('[fix-regression]')))
  })
  check('fixRegressions return field names the regression finding', () => assert.deepEqual(r.fixRegressions.map(f => f.location), ['r.js:5']))
  check('iteration label rendered N of cap', () => assert.ok(by('reporter')[0].prompt.includes('iteration: 2 of 3')))
}
if (scenario === 'pr-r2-empty') {
  check('empty late round with every scout alive converges', () => {
    assert.equal(r.coverage.emptyLateRound, true)
    assert.equal(r.verdict, 'clean (0 nits) [converged]')
    assert.ok(r.reportMarkdown.startsWith('super-roast verdict: clean (0 nits) [converged]'))
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
