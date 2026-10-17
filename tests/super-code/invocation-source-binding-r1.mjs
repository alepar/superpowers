#!/usr/bin/env node
// Regression: a resumed invocation must never retarget or rewrite its partial findings.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const skills = join(root, 'skills')
const helper = join(skills, 'super-code/scripts/dispatch-text.mjs')
const source = readFileSync(join(skills, 'super-code/coordinator.js'), 'utf8').replace(/^export const meta/m, 'const meta')
const run = new (Object.getPrototypeOf(async function () {}).constructor)('args', 'agent', 'log', 'phase', 'pipeline', 'parallel', 'budget', 'workflow', source)
const sha = c => c.repeat(40)
const tmp = mkdtempSync(join(os.tmpdir(), 'source-binding-'))
let passed = 0
function cli(ledger, ...args) {
  return spawnSync(process.execPath, [helper, '--ledger', ledger, '--stdout', ...args], { cwd: root, encoding: 'utf8' })
}
function launch(worktree, id) {
  return 'Launch: args ' + JSON.stringify({ epicId: 'R', integrationBranch: 'integ', integrationWorktree: worktree, runTag: 'shared', invocationId: id, config: {} })
}
function fixture(name, id = 'resume-same') {
  const worktree = join(tmp, name), ws = join(worktree, '.superpowers/sdd/R-plan')
  mkdirSync(ws, { recursive: true })
  const ledger = join(ws, 'progress.md')
  writeFileSync(ledger, launch(worktree, id) + '\nTask 1 (T): complete (review clean)\n')
  return { worktree, ws, ledger, id }
}
function binding(f) {
  return readFileSync(f.ledger, 'utf8').split('\n').filter(l => l.startsWith('Recovery:')).map(l => JSON.parse(l.slice(9))).find(r => r.data?.reviewSource?.invocationId === f.id)
}
function bind(f, head = sha('b')) {
  return cli(f.ledger, 'bind-review-source', '--base', sha('a'), '--head', head)
}
async function replay(f, head, { mode = 'split', seam = null, stub = null, assemble = true, launchOK = true } = {}) {
  const trace = [], snapshots = []
  const agent = async (prompt, opts = {}) => {
    const label = opts.label
    trace.push({ label, prompt })
    if (label === 'read-ledger' || label === 'read-ledger:finish') {
      const d = spawnSync('bash', [join(skills, 'super-code/scripts/ledger-digest'), f.ledger], { encoding: 'utf8' })
      return { text: d.stdout.trim(), landed: [], ...(label.endsWith('finish') ? { reviewBase: sha('a'), reviewHead: head } : {}) }
    }
    if (label?.startsWith('ledger')) {
      if (label?.startsWith('ledger-append:launch') && !launchOK) return null
      for (const m of prompt.matchAll(/<ledger-line>([^\n]*)<\/ledger-line>/g)) writeFileSync(f.ledger, m[1] + '\n', { flag: 'a' })
      return { appended: true }
    }
    if (label === 'close-epics') return { rootClosed: false, closedThisRun: [] }
    if (label?.startsWith('bd-ready')) return { ids: [], reviews: [] }
    if (label === 'worktree-sweep') return { lines: [], processLines: [] }
    if (label === 'assemble:final' || label?.startsWith('final-review')) {
      // Execute the real mechanical source guard emitted by the real prompt builder.
      const cmd = prompt.match(/`(node [^`]* bind-review-source[^`]*)`/)?.[1]
      if (cmd) {
        const guard = spawnSync('sh', ['-c', cmd], { cwd: f.worktree, encoding: 'utf8' })
        if (guard.status !== 0) return label === 'assemble:final' ? { dir: prompt.match(/\[OUT_DIR\] = ([^;]+);/)?.[1], exit: 2, cause: 'review source guard: ' + guard.stderr.trim() } : null
      }
      snapshots.push({ label, binding: binding(f) })
      if (label === 'assemble:final') {
        if (!assemble) return null
        const dir = prompt.match(/\[OUT_DIR\] = ([^;]+);/)?.[1]
        mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, 'digest.md'), 'assembly from ' + head)
        return { dir, exit: 0, fits: mode === 'single' ? 'fits: yes (100 of 80000)' : 'fits: no (100000 of 80000)', clusterFits: mode === 'single' ? [] : ['cluster-fits: alpha yes (100 of 80000)'], clusters: mode === 'single' ? 0 : 1 }
      }
      if (label === 'final-review:seam' || label === 'final-review:stub') {
        const result = label === 'final-review:seam' ? seam : stub
        if (result) writeFileSync(join(f.ws, 'final-review-' + f.id + '.md'), 'retained cluster finding and seam status\n')
        return result
      }
      const artifact = prompt.match(/declared review artifact is (\S+?\.md)/)?.[1]
      if (artifact) writeFileSync(artifact, '## Verdict\nnot ready\n## Must fix before landing\n- original finding at ' + head + '\n')
      return { verdict: 'not ready', path: artifact }
    }
    throw new Error('unexpected dispatch ' + label)
  }
  const result = await run({ epicId: 'R', integrationBranch: 'integ', integrationWorktree: f.worktree, skillsRoot: skills, invocationId: f.id, runTag: 'shared', rootAcceptance: 'caller', deferSweep: true, config: { concurrency: 2, earlyUnblock: false } }, agent, () => {}, () => {}, async () => [], async thunks => Promise.all(thunks.map(t => t())), { remaining: () => Infinity }, () => {})
  return { result, trace, snapshots }
}
try {
  // Omitting persistence before assembly is the original defect; this fails before any fix.
  const f = fixture('resume')
  const first = await replay(f, sha('b'))
  assert(first.snapshots.length > 0)
  assert(first.snapshots.every(s => s.binding?.data.reviewSource.head === sha('b')), 'captured source must be durable before each artifact writer')
  passed++
  const cluster = join(f.ws, 'final-review-resume-same.cluster-1.md')
  const digest = join(f.ws, 'assembled/final-review-resume-same-final/digest.md')
  const packagePath = join(f.ws, 'final-review-resume-same.md.diff')
  writeFileSync(packagePath, 'original package findings\n')
  const original = [cluster, digest, packagePath].map(p => readFileSync(p, 'utf8'))
  assert.equal(cli(f.ledger, 'bind-review-source', '--base', sha('a'), '--head', sha('b'), '--artifact', cluster).status, 2, 'same-source retry preserves existing partial cluster')
  const resumed = await replay(f, sha('c'))
  assert.deepEqual([cluster, digest, packagePath].map(p => readFileSync(p, 'utf8')), original)
  for (const call of resumed.trace.filter(t => t.label === 'assemble:final' || t.label?.startsWith('final-review'))) {
    assert(call.prompt.includes(sha('b')), call.label + ' must receive the original capture')
    assert(!call.prompt.includes(sha('c')), call.label + ' must not silently retarget to advanced integration')
  }
  assert.equal(resumed.snapshots.length, 0, 'existing assembly and package guards must refuse before destructive writer steps')
  assert(!resumed.trace.some(t => t.label?.startsWith('final-review')), 'source-guard refusal must not bypass partial findings through direct fallback')
  assert(resumed.result.review.includes('partial bundle preserved'), 'resume reports the retained evidence gap')
  assert.equal(resumed.result.reviewPath, null, 'unconfirmed seam/stub retains null path semantics')
  assert.equal(binding(f).data.reviewSource.head, sha('b'))
  assert.equal(cli(f.ledger, 'bind-review-source', '--read').status, 0, 'ordinary resume retrieves the original binding without recapture')
  passed++
  const before = readFileSync(f.ledger, 'utf8')
  assert.equal(bind(f, sha('c')).status, 2, 'same-ID mismatched source must be refused')
  assert.equal(readFileSync(f.ledger, 'utf8'), before)
  passed++

  for (const ordinary of [false, true]) {
    const g = fixture('cli-' + ordinary)
    if (ordinary) writeFileSync(g.ledger, `Launch: mechanism ordinary-subagents · epic R · branch integ · integrationWorktree ${g.worktree} · invocationId resume-same · runTag shared\n`)
    const unboundPrompt = cli(g.ledger, 'final-review', '--mode', 'single', '--base', sha('a'), '--head', sha('b'))
    assert.equal(unboundPrompt.status, 0, unboundPrompt.stderr)
    assert(unboundPrompt.stdout.startsWith('BEFORE ANY ARTIFACT WRITE'), 'unbound prompt must bind source before producing review artifacts')
    assert.equal(binding(g), undefined, 'rendering a prompt alone is no persisted source fact')
    assert.equal(bind(g).status, 0)
    const record = binding(g)
    assert.equal(record.data.reviewSource.base, sha('a'))
    assert.equal(record.data.reviewSource.head, sha('b'))
    const cases = [
      ['assemble', '--consumer', 'final-review', '--instance', 'final'],
      ['final-review', '--mode', 'single'],
      ['final-review', '--mode', 'cluster', '--dir', '/slices', '--cluster', '1', '--name', 'alpha'],
      ['final-review', '--mode', 'seam', '--dir', '/slices', '--reviewed', '1'],
      ['final-review', '--mode', 'stub', '--reviewed', '1', '--unreviewed', join(g.ws, 'gaps.txt')],
    ]
    writeFileSync(join(g.ws, 'gaps.txt'), 'seam\n')
    for (const args of cases) {
      const out = cli(g.ledger, ...args)
      assert.equal(out.status, 0, out.stderr)
      assert(out.stdout.includes(sha('a')) && out.stdout.includes(sha('b')), args.join(' ') + ' must retain source binding')
      assert.equal(cli(g.ledger, ...args, '--head', sha('c')).status, 2, 'override cannot retarget source')
    }
    passed++
  }
  const fresh = { ...f, id: 'new-id' }
  writeFileSync(f.ledger, launch(f.worktree, fresh.id) + '\n', { flag: 'a' })
  assert.equal(bind(fresh, sha('c')).status, 0)
  assert.equal(binding(fresh).data.reviewSource.head, sha('c'))
  const unbound = fixture('unbound')
  writeFileSync(join(unbound.ws, 'final-review-resume-same.cluster-1.md'), 'unbound finding\n')
  assert.equal(bind(unbound).status, 2, 'existing unbound partial bundle is a gap, never rebound')
  assert.equal(readFileSync(join(unbound.ws, 'final-review-resume-same.cluster-1.md'), 'utf8'), 'unbound finding\n')
  passed++
  // Execute every Workflow writer's real source guard, including stub and direct fallback.
  for (const [name, options, expectedPath] of [
    ['single', { mode: 'single' }, true],
    ['split-seam', { seam: { verdict: 'not ready (retained cluster finding)' } }, true],
    ['split-stub', { stub: { written: true } }, true],
    ['direct', { assemble: false }, true],
  ]) {
    const f = fixture(name, name)
    const execution = await replay(f, sha('b'), options)
    assert(execution.snapshots.length >= 2, name + ' executes assembly and review guards')
    assert(execution.snapshots.every(s => s.binding?.data.reviewSource.base === sha('a') && s.binding?.data.reviewSource.head === sha('b')), name + ' persists before every writer')
    assert.equal(!!execution.result.reviewPath, expectedPath, name + ' keeps confirmed output path semantics')
    assert(readFileSync(execution.result.reviewPath, 'utf8').includes('finding'), name + ' confirmed path contains its finding artifact')
    if (name === 'split-stub') assert(execution.snapshots.some(s => s.label === 'final-review:stub'), 'stub guard was exercised')
    if (name === 'split-seam') assert(execution.snapshots.some(s => s.label === 'final-review:seam'), 'seam guard was exercised')
    passed++
  }
  const noPersist = fixture('no-persist')
  const unavailable = await replay(noPersist, sha('b'), { launchOK: false })
  assert.equal(unavailable.result.reviewPath, null)
  assert.equal(unavailable.snapshots.length, 0)
  passed++
  console.log(`${passed} invocation source-binding scenarios passed`)
} finally { rmSync(tmp, { recursive: true, force: true }) }
