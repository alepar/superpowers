#!/usr/bin/env node
// Runtime integration: unmapped work is new admission, while settlement retains its slot path.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const here = path.dirname(fileURLToPath(import.meta.url))
const harness = fs.readFileSync(path.join(here, 'replay-harness.mjs'), 'utf8')
const prefix = harness.slice(0, harness.indexOf('// ---------- template-literal span scan'))
  .replace('const here = path.dirname(fileURLToPath(import.meta.url))', 'const here = ' + JSON.stringify(here))
async function driver(inject = false) {
  let source = prefix
  if (inject) {
    // Boundary fault injection only: a real scheduler reservation is queued before
    // the existing Recovery producer records a new hold. Scheduling/admission and
    // blocker/triage/ledger consumers are the unchanged production implementation.
    source = source.replace('const scriptBody = extractScript()', `const scriptBody = extractScript().replace('  const withSlot =', ${JSON.stringify(`  const originalAcquire = sched.acquire
  sched.acquire = async id => {
    const pending = originalAcquire(id)
    if (id === 'bd-106') {
      noteRecovery('bd-106', 'hold', 'record', 'hold arrived during capacity wait', ['new-hold.md'], { taskId: 'bd-106' })
    }
    const waited = await pending
    if (id === 'bd-106') log('fixture new hold while capacity queued: ' + waited)
    return waited
  }
  const withSlot =`)})`)
  }
  return import('data:text/javascript;base64,' + Buffer.from(source + '\nexport {run,liveArgs,oneTaskCanned}').toString('base64'))
}
function noRoute(out, id) {
  for (const label of ['unplanned-blocker:', 'triage:', 'notify:']) assert.equal(out.counts[label + id] || 0, 0, 'held reservation must not route ' + label + id)
  assert(!out.trace.filter(t => t.label === 'ledger:' + id).some(t => /<ledger-line>Task /.test(t.prompt)), 'held reservation creates no task outcome ledger')
  for (const bucket of ['completed', 'escalated', 'pendingRetry']) assert(!out.result[bucket].includes(id), 'held reservation creates no outcome')
}
let failures = 0
for (const mode of ['eligible', 'task', 'global', 'during-wait']) {
  const {run,liveArgs,oneTaskCanned} = await driver(mode === 'during-wait')
  const id = mode === 'during-wait' ? 'bd-106' : 'bd-105'
  const hold = {version:1,id:mode === 'global' ? 'merge-lane' : id,kind:'hold',operation:'record',reason:'human gate pending',evidence:['hold.md'],data:mode === 'global' ? {} : {taskId:id}}
  const overrides = {
    'bd-ready': [{ids:['bd-101', 'bd-105', ...(mode === 'during-wait' ? [id] : [])]}, {ids:[]}],
    'unplanned-blocker:bd-105': {blockerBead:'blocker-105'},
    'triage:bd-105': {decision:'ESCALATE',detail:'independent ordinary unplanned task'},
    'notify:bd-105': {sent:true},
    'unplanned-blocker:bd-106': {blockerBead:'blocker-106'},
    'triage:bd-106': {decision:'ESCALATE',detail:'must never run'},
    'notify:bd-106': {sent:true},
  }
  if (['task','global'].includes(mode)) overrides['read-ledger'] = {text:'Recovery: ' + JSON.stringify(hold)}
  const out = await run({args:liveArgs({deferSweep:true,rootAcceptance:'caller',config:{concurrency:1,earlyUnblock:false}}),canned:oneTaskCanned(overrides)})
  try {
    assert.ifError(out.error)
    if (mode === 'eligible') assert(out.result.escalated.includes(id), 'ordinary unmapped work retains blocker routing')
    else { noRoute(out,id); assert.equal(out.result.stopReason,'recovery-held') }
    assert.equal(out.counts['impl:bd-101'] || 0,mode === 'global' ? 0 : 1,'unrelated eligible implementation progresses')
    if (mode === 'during-wait') {
      assert(out.logs.includes('fixture new hold while capacity queued: true'), 'new hold occurs during an actual queued reservation')
      assert(out.result.escalated.includes('bd-105'),'already-started unplanned settlement completes')
      assert(out.result.recovery.obligations.some(r=>r.id===id&&r.reason==='hold arrived during capacity wait'),'real producer retains new hold')
    }
    console.log('PASS unplanned admission ' + mode)
  } catch(e) { failures++;console.error('FAIL '+mode+'\n'+e.stack) }
}
process.exitCode = failures ? 1 : 0
