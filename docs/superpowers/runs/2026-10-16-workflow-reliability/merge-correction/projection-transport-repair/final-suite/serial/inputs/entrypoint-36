#!/usr/bin/env node
// Drive the existing replay runtime across the real persisted digest/resume boundary.
// Dropping an oversized pointer, accepting partial retrieval, or clearing on malformed input
// must fail these admission assertions; retaining full records must preserve additive data.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')
const harness = readFileSync(join(here, 'replay-harness.mjs'), 'utf8')
const driver = harness.slice(0, harness.indexOf('// ---------- template-literal span scan'))
  .replace('const here = path.dirname(fileURLToPath(import.meta.url))', 'const here = ' + JSON.stringify(here))
const { run, liveArgs, oneTaskCanned } = await import('data:text/javascript;base64,' + Buffer.from(driver + '\nexport { run, liveArgs, oneTaskCanned }').toString('base64'))
const temp = mkdtempSync(join(os.tmpdir(), 'hold-scope-'))
const digestHelper = join(root, 'skills/super-code/scripts/ledger-digest')
const hold = n => ({ version: 1, id: 'bd-101', kind: 'hold', operation: 'record', reason: 'human gate pending', evidence: ['hold-receipt.md'], data: { taskId: 'bd-101', context: 'x'.repeat(n) } })
const line = r => 'Recovery: ' + JSON.stringify(r)
let passed = 0
async function replay(name, records, { retrieval = 'real', transport = null } = {}) {
  const worktree = join(temp, name), ws = join(worktree, '.superpowers/sdd/bd-100-plan')
  mkdirSync(ws, { recursive: true })
  const ledger = join(ws, 'progress.md')
  writeFileSync(ledger, records.join('\n') + (records.length ? '\n' : ''))
  const text = transport ?? execFileSync('bash', [digestHelper, ledger], { encoding: 'utf8' })
  const read = ({ trace }) => {
    const prompt = trace.at(-1).prompt
    const recoveryRecords = []
    for (const pointer of text.matchAll(/^Recovery gap: ([0-9]+) (.+)$/gm)) {
      const command = prompt.match(/`(bash [^`]* --recovery-line N [^`]*)`/)?.[1]
      if (!command) continue // the RED baseline has no recovery instructions
      const result = retrieval === 'real'
        ? { text: execFileSync('sh', ['-c', command.replace('--recovery-line N ', '--recovery-line ' + pointer[1] + ' ')], { cwd: worktree, encoding: 'utf8' }) }
        : retrieval
      if (result) recoveryRecords.push({ source: pointer[2], line: Number(pointer[1]), ...result })
    }
    return { text, recoveryRecords }
  }
  const sha = c => c.repeat(40)
  const canned = oneTaskCanned({
    'read-ledger': read,
    'read-ledger:retry': read,
    'bd-ready': [{ ids: ['bd-101', 'bd-102'] }, { ids: [] }],
    'plan': { planPath: join(ws, 'bd-100-plan.md'), mapping: [
      { n: 1, id: 'bd-101', files: ['src/a.js'] }, { n: 2, id: 'bd-102', files: ['src/b.js'] },
    ] },
    'impl:bd-102': { id: 'bd-102', status: 'IMPLEMENTED', base: sha('a'), head: sha('c'), files: ['src/b.js'] },
    'review:bd-102': { id: 'bd-102', status: 'CLEAN' },
    'merge:bd-102': { id: 'bd-102', merged: true, mergeExit: 0, mergeHead: true, head: sha('b'), mergeBase: sha('a'), rebaseConflictFiles: 0 },
  })
  const out = await run({ args: liveArgs({ integrationWorktree: worktree, skillsRoot: join(root, 'skills'), deferSweep: true, rootAcceptance: 'caller', config: { concurrency: 2, earlyUnblock: false } }), canned })
  assert.ifError(out.error)
  assert(!out.trace.some(t => t.label.startsWith('read-recovery:')), 'recovery must use the existing reader response without another agent call')
  return { ...out, ledger, text }
}
function held(out, unrelated = true) {
  if ((out.counts['impl:bd-102'] || 0) !== (unrelated ? 1 : 0)) console.error(JSON.stringify({counts:out.counts,logs:out.logs,recovery:out.result.recovery}, null, 2))
  assert.equal(out.counts['impl:bd-101'] || 0, 0, 'held task must not dispatch')
  assert.equal(out.counts['merge:bd-101'] || 0, 0, 'held task must not merge')
  assert(out.result.recovery.obligations.some(r => r.kind === 'hold') || out.result.recovery.gaps.length > 0, 'hold or unresolved evidence gap remains visible')
  assert.equal(out.result.stopReason, 'recovery-held')
  assert.equal(out.counts['impl:bd-102'] || 0, unrelated ? 1 : 0, 'admission follows recovered scope or unresolved scope gap')
  assert.equal(out.counts['merge:bd-102'] || 0, unrelated ? 1 : 0)
}
try {
  let compactCalls
  for (const [n, bytes] of [[0, 173], [5000, 5173]]) {
    const record = hold(n)
    assert.equal(Buffer.byteLength(line(record)), bytes, 'reported reproduction size')
    const out = await replay('size-' + bytes, [line(record)])
    held(out)
    const calls = out.trace.map(t => t.label).sort()
    if (bytes === 173) compactCalls = calls
    else assert.deepEqual(calls, compactCalls, 'oversized recovery adds no agent calls')
    assert.deepEqual(out.result.recovery.obligations.find(r => r.id === 'bd-101'), record, 'all retained fields survive recovery')
    assert.equal(out.result.recovery.gaps.length, 0, 'successful recovery is distinct from an unresolved gap')
    assert.equal(readFileSync(out.ledger, 'utf8'), line(record) + '\n', 'recovery never rewrites authoritative bytes')
    console.log(bytes + '-byte hold preserves its task scope')
    passed++
  }
  // Invalid compact records must not silently release either known or unknown scope.
  for (const [name, record, scoped] of [
    ['version', { ...hold(0), version: 9 }, true],
    ['evidence', { ...hold(0), evidence: [] }, true],
    ['fields', { ...hold(0), reason: '' }, true],
    ['unknown-scope', { ...hold(0), id: '', data: {} }, false],
    ['broken-json', null, false],
  ]) {
    const raw = record ? line(record) : 'Recovery: {broken'
    const out = await replay('compact-invalid-' + name, [raw])
    held(out, scoped)
    assert(out.result.recovery.gaps.some(g => g.reason && (g.raw === raw || g.preview === raw)), 'invalid raw evidence remains recoverable')
    assert.equal(readFileSync(out.ledger, 'utf8'), raw + '\n', 'invalid source is never rewritten')
    passed++
  }
  const compactClear = await replay('compact-clear', [line(hold(0)), line({ ...hold(0), operation: 'clear', evidence: ['release.md'] })])
  assert.equal(compactClear.counts['impl:bd-101'], 1, 'valid compact clear releases only the supported obligation')
  passed++
  const additive = { ...hold(5000), ownerContext: { unknownFutureField: ['keep me'] } }
  held(await replay('additive', [line(additive), 'Task 1 (bd-101): complete, review clean']))
  const recovered = await replay('additive-data', [line(additive)])
  assert.deepEqual(recovered.result.recovery.obligations.find(r => r.id === 'bd-101'), additive)
  passed++
  const released = await replay('released', [line(hold(5000)), line({ ...hold(0), operation: 'clear', reason: 'human gate released', evidence: ['gate-release.md'], data: {} })])
  assert.equal(released.counts['impl:bd-101'], 1, 'supported matching clear releases recovered hold')
  assert.equal(released.counts['merge:bd-101'], 1)
  assert(!released.result.recovery.obligations.some(r => r.id === 'bd-101'))
  passed++
  for (const [name, retrieval] of [
    ['null', null], ['missing', { text: '# ledger-status: missing' }],
    ['empty', { text: '# ledger-digest: 0 of 0 lines' }],
    ['truncated', { text: '# ledger-digest: 1 of 1 lines' }],
    ['malformed', { text: '# ledger-digest: 1 of 1 lines\nRecovery: {broken' }],
    ['unknown-version', { text: '# ledger-digest: 1 of 1 lines\n' + line({ ...hold(0), version: 9 }) }],
  ]) {
    const out = await replay('gap-' + name, [line(hold(5000))], { retrieval })
    held(out, false)
    assert(out.result.recovery.gaps.some(g => g.line === 1 && g.source === out.ledger && g.reason), 'unresolved source pointer remains visible')
    assert(!out.result.recovery.obligations.some(r => r.kind === 'hold'), 'unavailable payload cannot invent an obligation or release')
    passed++
  }
  const brokenPointer = await replay('broken-pointer', [], { transport: '# ledger-digest: 1 of 1 lines\nRecovery gap: 1' })
  held(brokenPointer, false)
  assert(brokenPointer.result.recovery.gaps.some(g => g.reason.includes('malformed')), 'truncated pointer remains an explicit gap')
  passed++
  const badClear = { ...hold(0), operation: 'clear', evidence: [] }
  const invalid = await replay('invalid-clear', [line(hold(5000)), line(badClear)])
  held(invalid)
  assert(invalid.result.recovery.gaps.some(g => g.reason.includes('missing evidence')))
  passed++
  const scoped = { ...hold(5000), id: 'caller-hold', data: { affectedIds: ['bd-101'], context: 'x'.repeat(5000) } }
  held(await replay('affected-ids', [line(scoped)]))
  passed++
  for (const [name, text] of [
    ['valid-empty', '# ledger-digest: 0 of 0 lines'],
    ['missing-source', '# ledger-status: missing'],
    ['truncated-source', '# ledger-digest: 1 of 1 lines'],
  ]) {
    const out = await replay(name, [], { transport: text })
    if (name === 'truncated-source') assert(out.logs.some(l => l.includes('truncated (0 of 1 lines)')), 'truncated source is unavailable, never a valid empty record')
    else {
      const actual = execFileSync('bash', [digestHelper, name === 'missing-source' ? join(temp, 'absent.md') : out.ledger], { encoding: 'utf8' }).trim()
      assert.equal(actual, name === 'missing-source' ? '# ledger-status: missing' : '# ledger-digest: 0 of 0 lines', 'helper distinguishes missing source and valid empty source')
      assert.equal(out.counts['impl:bd-101'], 1, 'a new run with no prior hold keeps normal admission')
    }
    passed++
  }
  console.log(passed + ' recovery hold-scope scenarios passed')
} finally { rmSync(temp, { recursive: true, force: true }) }
