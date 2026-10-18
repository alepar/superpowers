// Exercise the canonical fence, including reconstructed/manual JSON arguments.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const doc = readFileSync(new URL('../../skills/super-roast/super-roast-workflow.md', import.meta.url), 'utf8')
const source = doc.match(/```javascript\n([\s\S]*?)\n```/)[1].replace('export const meta', 'const meta')
const run = new (async () => {}).constructor('args', 'agent', 'parallel', 'log', 'phase', source)
const ready = { coverage: 'complete', provenance: 'available', basis: 'Captured base/head and full changed-hunk inspection inventory verified at this source.' }
const bounded = { coverage: 'bounded', provenance: 'unavailable', basis: 'Four reported inspection ranges; remaining source and archived digest provenance unresolved.' }
const unknown = { coverage: 'unknown', provenance: 'unknown', basis: '' }
const finding = (i = 0) => ({ claim: `defect ${i}`, location: `a.js:${i + 1}`, category: 'core1', external: false, evidence: 'observed' })
const vote = (verdict = 'CONFIRM', severity = 'Should-fix') => ({ verdict, severity, evidence: 'source evidence' })
const report = (verdict = 'clean (0 nits)', body = '') => ({ verdict, reportMarkdown: `super-roast verdict: ${verdict}\ncoverage: reporter supplied\n\n${body}`, confirmedCount: 0, escalations: [] })

async function execute(options = {}) {
  const names = Array.from({ length: options.scouts ?? 9 }, (_, i) => `core${i + 1}`)
  const calls = [], reporterPrompts = []
  const args = {
    mode: 'pr', iteration: 2, priorReport: 'prior report', profile: 'local tooling', inputs: 'captured audit', independence: 'same-family (test) · rung: manual fan-out',
    prompts: { triage: 'triage', scouts: Object.fromEntries(names.map(n => [n, 'scout'])), dedupe: '{{FINDINGS_JSON}}', seats: { reproduce: '{{FINDING_JSON}}', refute: '{{FINDING_JSON}}', ground: '{{FINDING_JSON}}' } },
    config: { coreLanes: names },
    ...options.args,
  }
  args.prompts.reporter ??= '{{COVERAGE_JSON}}\n{{COVERAGE_LINE}}\n{{PACKETS_JSON}}'
  if ('readiness' in options) args.reviewReadiness = options.readiness
  const agent = async (prompt, o) => {
    calls.push(o.label)
    if (o.label === 'triage') return { lanes: [], domains: [] }
    if (o.label.startsWith('scout:')) return options.deadScout && o.label === 'scout:core1' ? null : { findings: o.label === 'scout:core1' ? options.findings ?? [] : [] }
    if (o.label === 'dedupe') return { groups: (options.findings ?? []).map((_, i) => ({ ids: [i], suggestedSeverity: 'Should-fix', rank: i })) }
    if (o.label.startsWith('judge:')) return vote()
    if (o.label === 'reporter') { reporterPrompts.push(prompt); return options.reporterFailed ? null : options.report ?? report() }
    throw Error(`unexpected call ${o.label}`)
  }
  const parallel = fns => Promise.all(fns.map(f => Promise.resolve().then(f).catch(() => null)))
  const result = await run(options.stringify ? JSON.stringify(args) : args, agent, parallel, () => {}, () => {})
  return { result, calls, reporterPrompts }
}
function noConvergence(result) {
  assert.ok(!result.verdict.includes('[converged]'), result.verdict)
  assert.ok(!result.reportMarkdown.split('\n')[0].includes('[converged]'), result.reportMarkdown.split('\n')[0])
}

test('bounded post-cap source: nine live scouts, empty packets, reporter limitation survives', async () => {
  const body = 'Bounded inspected hunks only. Remaining hunks and provenance gaps remain unreviewed.\nNative qualification, cleanup and final full-suite measurement remain outstanding.'
  const { result, calls } = await execute({ readiness: bounded, args: { iteration: 'post-cap audit' }, report: report('clean (1 nits) [low coverage]', body) })
  noConvergence(result)
  assert.ok(result.verdict.includes('[low coverage]'))
  assert.ok(result.reportMarkdown.startsWith('super-roast verdict: clean (1 nits) [low coverage]'))
  assert.ok(result.reportMarkdown.includes(body))
  assert.equal(result.coverage.lowCoverage, false, 'stage completion stays independent')
  assert.deepEqual(result.coverage.reviewReadiness, bounded)
  assert.equal(result.coverage.convergenceEligible, false)
  assert.equal(calls.length, 11, 'no deduper or judges on empty candidates')
})

test('complete supported source with available provenance converges', async () => {
  const { result, reporterPrompts } = await execute({ readiness: ready })
  assert.equal(result.verdict, 'clean (0 nits) [converged]')
  assert.ok(result.reportMarkdown.startsWith(`super-roast verdict: ${result.verdict}`))
  assert.ok(result.reportMarkdown.includes('review readiness: coverage complete, provenance available'))
  assert.ok(reporterPrompts[0].includes(JSON.stringify(ready)))
})

for (const [name, readiness] of [
  ['bounded', bounded], ['complete with unknown provenance', { ...ready, provenance: 'unknown' }],
  ['unknown coverage', { ...ready, coverage: 'unknown' }], ['missing', undefined],
  ['null', null], ['array', []], ['invalid enum', { ...ready, coverage: 'all' }],
  ['empty basis', { ...ready, basis: '  ' }], ['non-string basis', { ...ready, basis: 1 }],
  ['missing provenance', { coverage: 'complete', basis: 'evidence' }],
]) test(`nonready source cannot converge: ${name}`, async () => {
  const { result } = await execute({ readiness, report: report('clean (0 nits) [converged]') })
  noConvergence(result)
  assert.equal(result.coverage.convergenceEligible, false)
  assert.equal(result.coverage.lowCoverage, false)
  assert.ok(result.verdict.includes('[review readiness incomplete]'))
  assert.ok(result.reportMarkdown.includes('review readiness:'))
  if (['missing', 'null', 'array', 'invalid enum', 'empty basis', 'non-string basis', 'missing provenance'].includes(name)) assert.deepEqual(result.coverage.reviewReadiness, unknown)
})

for (const iteration of [1, '1']) test(`first iteration ${typeof iteration} with stray prior never converges`, async () => {
  const { result } = await execute({ readiness: ready, args: { iteration }, report: report('clean (0 nits) [converged]') })
  noConvergence(result)
  assert.equal(result.coverage.emptyLateRound, false)
})
for (const iteration of [2, '2', 'post-cap audit']) test(`late iteration ${iteration} requires prior and readiness`, async () => {
  const { result } = await execute({ readiness: ready, args: { iteration } })
  assert.ok(result.verdict.includes('[converged]'))
  noConvergence((await execute({ readiness: ready, args: { iteration, priorReport: '' } })).result)
})

test('reporter low coverage survives even complete empty late round', async () => {
  const { result } = await execute({ readiness: ready, report: report('clean (0 nits) [low coverage] [converged]') })
  noConvergence(result)
  assert.ok(result.verdict.includes('[low coverage]'))
})
test('reportMarkdown-only coverage qualifier survives header enforcement', async () => {
  const rep = report('clean (0 nits) [low coverage]', 'Bounded prose retained.'); rep.verdict = 'clean (0 nits)'
  const { result } = await execute({ readiness: ready, report: rep })
  noConvergence(result)
  assert.ok(result.verdict.includes('[low coverage]'))
})
test('dead scout, panel cap and reporter failure retain independent stage guards', async () => {
  for (const options of [{ deadScout: true }, { args: { config: { coreLanes: ['core1'], panelCap: 0 } }, findings: [finding()] }, { reporterFailed: true }]) {
    const { result } = await execute({ readiness: ready, report: report('clean (0 nits) [converged]'), ...options })
    noConvergence(result)
    assert.ok(result.verdict.includes(options.findings ? '[panel-capped: 1 unverified]' : '[low coverage]'))
  }
})
test('nonempty packets need reporter judgment; affirmative readiness alone never forces convergence', async () => {
  noConvergence((await execute({ readiness: ready, findings: [finding()], report: report('Should-fix (1 confirmed)') })).result)
  assert.ok((await execute({ readiness: ready, findings: [finding()], report: report('Should-fix (1 confirmed) [converged]') })).result.verdict.includes('[converged]'))
})
test('Blocking verdict cannot carry reporter-supplied convergence', async () => {
  for (const findings of [[], [finding()]]) noConvergence((await execute({ readiness: ready, findings, report: report('Blocking (1 confirmed) [converged]') })).result)
})
test('manual reconstructed arguments and JSON-string arguments use identical gate', async () => {
  for (const stringify of [false, true]) {
    noConvergence((await execute({ stringify, report: report('clean (0 nits) [converged]') })).result)
    assert.ok((await execute({ stringify, readiness: ready })).result.verdict.includes('[converged]'))
  }
})

// Documented dryRun scenarios, executed locally with deterministic structured-output stubs.
// Synthetic readiness is a fixture for qualifier topology, never a source-coverage claim.
const stub = value => `You are a stub. Call no tools. Return exactly this JSON as your structured output: ${JSON.stringify(value)}`
async function topology(variant) {
  const calls = []
  const design = variant.startsWith('design')
  const names = design ? ['core1', 'core2', 'core3', 'core4', 'core5'] : ['core1', 'core2', 'core3']
  const raw1 = [0, 1, 2, 3].map(i => finding(i))
  const raw2 = [4, 5, 6, 7].map(i => ({ ...finding(i === 4 ? 0 : i), category: 'core2' }))
  const stubs = {
    triage: stub({ lanes: design ? [] : ['data-migrations'], domains: variant === 'design-domain' ? ['queueing'] : [] }),
    ...Object.fromEntries([...names, 'data-migrations', 'domain:queueing', 'security', 'maintainer'].map(n => [`scout:${n}`, stub({ findings: n === 'core1' ? (design ? [finding()] : raw1) : n === 'core2' && !design ? raw2 : [] })])),
    dedupe: stub({ groups: design ? [{ ids: [0], suggestedSeverity: 'Blocking', rank: 1 }] : [
      { ids: [0, 4], suggestedSeverity: 'Blocking', rank: 1 },
      { ids: [1], suggestedSeverity: 'Should-fix', rank: 2 },
      ...[2, 3, 5, 6, 7].map((id, i) => ({ ids: [id], suggestedSeverity: i === 2 || i === 3 ? 'FYI' : 'Nit', rank: i + 3 })),
    ] }),
    'seat:reproduce:panel': stub(vote('CONFIRM', 'Blocking')),
    'seat:ground:panel': stub(vote(variant === 'unsettled' ? 'UNVERIFIED' : 'CONFIRM', variant === 'unsettled' ? 'FYI' : 'Blocking')),
    'seat:refute:panel': stub(vote('REJECT', 'FYI')),
    'seat:refute:spot': stub(vote('CONFIRM', 'Should-fix')),
    reporter: variant === 'dead-reporter' ? 'You are a stub. Call no tools. Reply with the single word: none' : stub({ ...report('Blocking (1 confirmed)'), reportMarkdown: '# stub report', confirmedCount: 1 }),
  }
  const args = {
    mode: design ? 'design' : 'pr', dryRun: true, iteration: 1, reviewReadiness: { ...ready, basis: 'Synthetic topology fixture only.' },
    prompts: { stubs, dedupe: '', seats: { reproduce: '', refute: '', ground: '' }, reporter: '' },
    config: { coreLanes: names, coreLenses: names, widenLenses: ['security', 'maintainer'], remainderCap: 3 },
  }
  const agent = async (prompt, o) => { calls.push(o); assert.equal(o.effort, 'low'); const json = prompt.split('structured output: ')[1]; return json ? JSON.parse(json) : null }
  const parallel = fns => Promise.all(fns.map(f => Promise.resolve().then(f).catch(() => null)))
  return { result: await run(args, agent, parallel, () => {}, () => {}), calls }
}
for (const variant of ['canonical', 'dead-reporter', 'unsettled', 'design-domain', 'design-widen']) test(`documented dryRun topology: ${variant}`, async () => {
  const { result, calls } = await topology(variant)
  const design = variant.startsWith('design')
  assert.equal(calls.length, design ? (variant === 'design-domain' ? 12 : 13) : variant === 'dead-reporter' ? 23 : 22)
  assert.equal(result.coverage.scoutsDispatched, design ? (variant === 'design-domain' ? 6 : 7) : 4)
  assert.equal(result.coverage.rawFindings, design ? 1 : 8)
  assert.equal(result.coverage.dedupedFindings, design ? 1 : 7)
  assert.equal(result.coverage.beyondCap, design ? 0 : 2)
  assert.equal(result.coverage.promotedCount, design ? 0 : 3)
  assert.equal(result.coverage.judgeCompletionPct, 100)
  assert.equal(result.coverage.lowCoverage, false)
  assert.equal(result.coverage.convergenceEligible, false, 'first iteration cannot converge')
  assert.deepEqual(result.routeCounts, variant === 'unsettled' ? { 'escalate:unsettled-panel': 2, confirmed: 3 } : { confirmed: design ? 1 : 5 })
  assert.equal(result.reporterFailed, variant === 'dead-reporter')
  assert.equal(result.verdict, variant === 'dead-reporter' ? 'Blocking (5 confirmed) [low coverage]' : 'Blocking (1 confirmed)')
  assert.ok(result.reportMarkdown.startsWith(`super-roast verdict: ${result.verdict}`))
  if (variant === 'canonical') assert.equal(result.seatAgreement, 'seat-agreement: panels 5 · rr 0.60 · rg 1.00 · fg 0.60 · unanimous 0.60 · ground-loo 1.00 (n=3) · reproduce 5/0/0 · refute 3/2/0 · ground 5/0/0')
  if (variant === 'unsettled') assert.equal(result.escalations.length, 2)
  if (design) assert.equal(calls.some(o => o.label === 'scout:security'), variant === 'design-widen')
})
