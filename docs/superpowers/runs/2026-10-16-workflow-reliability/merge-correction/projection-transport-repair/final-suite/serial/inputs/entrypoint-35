#!/usr/bin/env node
// Exercise the real coordinator startup with Workflow's nondeterministic globals disabled.
// The mechanical Resume dispatch is simulated; its UUID command runs outside the Workflow VM.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import vm from 'node:vm'

const source = readFileSync(new URL('../../skills/super-code/coordinator.js', import.meta.url), 'utf8')
const cut = source.search(/^while \(true\) \{$/m)
assert.ok(cut > 0, 'real coordinator round-loop boundary exists')
const builders = source.indexOf('\nfunction cleanupOutcomeRule()')
assert.ok(builders > cut, 'real coordinator prompt-builder boundary exists')
const body = source.slice(0, cut).replace(/^export const meta/m, 'const meta') +
  '\nreturn { invocationId, invocationPersisted, assembly: assemblePrompt("final-review", "final", {base:"a".repeat(40), head:"b".repeat(40)}), review: finalReviewPrompt(epicId, integrationBranch, integrationWorktree, ledgerPath, "plan.md", "deferred", [], {base:"a".repeat(40), head:"b".repeat(40)}) }\n' + source.slice(builders)

const priorLedger = '# ledger-digest: 1 of 1 lines\nLaunch: args {"runTag":"same-run","invocationId":"inv-prior"}'
async function start({ invocationId, mint = true, append = true, replies } = {}) {
  const logs = [], trace = []
  const args = { epicId: 'epic', integrationBranch: 'branch', integrationWorktree: '/fixture',
    skillsRoot: '/skills', runTag: 'same-run', config: {}, ...(invocationId === undefined ? {} : { invocationId }) }
  const context = vm.createContext({ args, log: m => logs.push(m), phase() {},
    async agent(prompt, opts) {
      trace.push({ prompt, ...opts })
      if (opts.label === 'read-ledger' || opts.label === 'read-ledger:retry') {
        const reply = replies ? replies[opts.label === 'read-ledger' ? 0 : 1] : { text: priorLedger }
        if (reply === null) return null
        if (invocationId === undefined && mint && !replies) {
          assert.match(prompt, /uuidgen/, 'omitted-ID startup requests minting at the mechanical boundary')
          assert.ok(opts.schema.properties.invocationId, 'mechanical output admits the minted identity')
          reply.invocationId = 'inv-' + execFileSync('uuidgen', { encoding: 'utf8' }).trim()
        }
        return reply
      }
      if (opts.label === 'ledger-append:launch') return { appended: append }
      throw new Error('unexpected startup dispatch: ' + opts.label)
    },
  })
  vm.runInContext('Date.now = () => { throw new Error("forbidden Date.now") }; Math.random = () => { throw new Error("forbidden Math.random") }', context)
  try {
    const result = await vm.runInContext('(async () => {\n' + body + '\n})()', context)
    return { result, logs, trace }
  } catch (error) { return { error, logs, trace } }
}

const first = await start()
assert.equal(first.error, undefined, 'omitted-ID startup survives forbidden clock/random globals: ' + first.error?.message)
assert.ok(first.logs.some(m => m.startsWith('coordinator:')), 'startup reaches logging')
assert.deepEqual(first.trace.map(t => t.label), ['read-ledger', 'ledger-append:launch'], 'identity acquisition uses existing startup dispatches only')
assert.ok(first.result.invocationPersisted, 'launch persistence is confirmed before artifact builders')
assert.ok(first.trace[1].prompt.includes('"invocationId":"' + first.result.invocationId + '"'), 'Launch persists the minted token')
assert.ok(first.result.review.includes('/final-review-' + first.result.invocationId + '.md'), 'review destination uses minted identity')
assert.ok(first.result.assembly.includes('/assembled/final-review-' + first.result.invocationId + '-final'), 'assembly destination uses minted identity')

const second = await start()
assert.equal(second.error, undefined)
assert.notEqual(first.result.invocationId, second.result.invocationId, 'fresh launches sharing runTag have distinct identities')
assert.notEqual(first.result.review, second.result.review, 'fresh review artifacts remain distinct')
assert.notEqual(first.result.assembly, second.result.assembly, 'fresh assembly directories remain distinct')
assert.notEqual(first.result.invocationId, 'inv-prior', 'fresh identity never copies a previous Launch')

const explicit = await start({ invocationId: 'inv-explicit' })
assert.equal(explicit.error, undefined)
assert.equal(explicit.result.invocationId, 'inv-explicit', 'explicit identity remains unchanged')
assert.ok(!explicit.trace[0].prompt.includes('uuidgen'), 'explicit resume does not mint a replacement token')
const resumed = await start({ invocationId: first.result.invocationId })
assert.equal(resumed.error, undefined)
assert.equal(resumed.result.review, first.result.review, 'explicit unsettled resume retains review identity')

const replayed = await start({ replies: [{ text: priorLedger, invocationId: first.result.invocationId }] })
assert.equal(replayed.error, undefined)
assert.equal(replayed.result.review, first.result.review, 'reusing recorded Resume output preserves omitted-ID review identity')
assert.equal(replayed.result.assembly, first.result.assembly, 'reusing recorded Resume output preserves assembly identity')

const unavailable = await start({ mint: false })
assert.match(unavailable.error?.message ?? '', /invocationId.*unavailable/, 'missing identity fails visibly')
assert.equal(unavailable.trace.length, 1, 'missing identity never appends a fabricated Launch token')
const unsafe = await start({ invocationId: '../escape' })
assert.match(unsafe.error?.message ?? '', /filesystem-safe/)
assert.equal(unsafe.trace.length, 0, 'unsafe explicit identity fails before dispatch')
const unsafeAcquired = await start({ mint: false, replies: [{ text: priorLedger, invocationId: '../escape' }] })
assert.match(unsafeAcquired.error?.message ?? '', /filesystem-safe/, 'unsafe mechanical identity fails visibly')
assert.equal(unsafeAcquired.trace.length, 1, 'unsafe acquired identity cannot append Launch or authorize artifacts')

// Transport repair must not mint twice or drop a valid identity already selected on the first read.
const repaired = await start({ replies: [
  { text: 'broken transport', invocationId: 'inv-selected' }, { text: priorLedger },
] })
assert.equal(repaired.error, undefined)
assert.equal(repaired.result.invocationId, 'inv-selected', 'retry reconstruction preserves selected identity')
assert.deepEqual(repaired.trace.map(t => t.label), ['read-ledger', 'read-ledger:retry', 'ledger-append:launch'])
assert.ok(!repaired.trace[1].prompt.includes('uuidgen'), 'transport retry does not mint over a valid selected token')
assert.ok(repaired.trace[2].prompt.includes('"invocationId":"inv-selected"'), 'Launch uses the selected token after retry')
const retryUnavailable = await start({ replies: [{ text: 'broken transport', invocationId: 'inv-before-null' }, null] })
assert.equal(retryUnavailable.error, undefined)
assert.equal(retryUnavailable.result.invocationId, 'inv-before-null', 'a failed transport retry retains the first valid identity')
assert.ok(!retryUnavailable.trace[1].prompt.includes('uuidgen'), 'a failed retry was not asked to remint')
const recovered = await start({ replies: [null, { text: priorLedger, invocationId: 'inv-recovered' }] })
assert.equal(recovered.error, undefined)
assert.equal(recovered.result.invocationId, 'inv-recovered', 'retry can acquire when initial dispatch supplied no identity')
assert.match(recovered.trace[1].prompt, /uuidgen/, 'retry requests minting when identity is still unavailable')
const missingAfterRetry = await start({ replies: [{ text: 'bad transport' }, { text: priorLedger }] })
assert.match(missingAfterRetry.error?.message ?? '', /invocationId.*unavailable/)
assert.deepEqual(missingAfterRetry.trace.map(t => t.label), ['read-ledger', 'read-ledger:retry'], 'no fabricated identity after repaired transport')
const unsafeAfterRetry = await start({ replies: [null, { text: priorLedger, invocationId: 'a.b' }] })
assert.match(unsafeAfterRetry.error?.message ?? '', /filesystem-safe/)
assert.equal(unsafeAfterRetry.trace.length, 2, 'unsafe retry identity cannot append Launch')
const preserved = await start({ replies: [{ text: 'bad transport', invocationId: 'inv-kept' }, { text: priorLedger, invocationId: 'inv-replacement' }] })
assert.equal(preserved.error, undefined)
assert.equal(preserved.result.invocationId, 'inv-kept', 'unsolicited retry token cannot replace a selected valid identity')
const explicitRetry = await start({ invocationId: 'inv-explicit', replies: [{ text: 'bad transport' }, { text: priorLedger, invocationId: 'inv-ignored' }] })
assert.equal(explicitRetry.error, undefined)
assert.equal(explicitRetry.result.invocationId, 'inv-explicit')
assert.ok(explicitRetry.trace.every(t => !t.prompt.includes('uuidgen')), 'explicit identity never requests minting, including retries')

const gap = await start({ invocationId: 'inv-gap', append: false })
assert.equal(gap.error, undefined)
assert.equal(gap.result.invocationPersisted, false, 'failed persistence leaves review output unauthorized')
console.log('PASS: omitted-ID and explicit startup, distinct artifacts, resume, missing/unsafe identity, persistence gap, transport retry, recorded-result replay (16 startups; Workflow-like sandbox; mechanical agent simulated)')
