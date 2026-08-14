#!/usr/bin/env node
// Replay harness for the canonical coordinator script embedded in
// skills/super-code/coordinator-workflow.md.
//
// Why this exists: every recorded validation of that script before 2026-08 was dryRun-only, and
// dryRun stubs never return null and never reference a missing file — so the entire class of
// defects the first live run hit (null agent() results crashing or fabricating success, reviewer
// file parameters never supplied) was structurally invisible to it. This harness stubs the
// Workflow runtime's hooks (agent/log/phase/pipeline/parallel) in-process and drives full rounds:
//
// - "dryrun" mode replays the three recorded dryRun scenarios from the doc's own ```json args
//   blocks, answering each stub prompt with its embedded JSON — same counts, no model spend.
// - "live-sim" mode runs with dryRun:false, so the REAL prompt builders execute and their text
//   can be asserted (the thing the doc says no dryRun can ever prove), with canned answers keyed
//   by dispatch label — and any label's answer can be null, or an array consumed per call whose
//   entries can be null, to model a subagent dying on a terminal API error (transiently or
//   permanently).
//
// No dependencies. Run: node tests/super-code/replay-harness.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const docPath = path.join(here, '..', '..', 'skills', 'super-code', 'coordinator-workflow.md')
const doc = readFileSync(docPath, 'utf8')

// ---------- extraction ----------

function extractScript() {
  const m = doc.match(/```javascript\n([\s\S]*?)\n```/)
  if (!m) throw new Error('no ```javascript fence found in coordinator-workflow.md')
  return m[1].replace(/^export const meta/m, 'const meta')
}

function extractJsonBlocks() {
  const out = []
  const re = /```json\n([\s\S]*?)\n```/g
  let m
  while ((m = re.exec(doc))) out.push(JSON.parse(m[1]))
  return out
}

const scriptBody = extractScript()
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const scriptFn = new AsyncFunction('args', 'agent', 'log', 'phase', 'pipeline', 'parallel', 'budget', 'workflow', scriptBody)

// ---------- runtime stubs ----------

// canned: { [label]: value | value[] } — arrays are consumed one entry per call, clamped to the
// last entry; an entry (or the whole value) of null models a dead subagent. In dryrun mode canned
// is ignored and each stub prompt's embedded JSON is the answer, except labels listed in
// nullLabels, which return null (dryRun stubs can't model null — that is the point of this knob).
async function run({ args, canned = {}, nullLabels = new Set(), nullAll = false }) {
  const trace = []
  const logs = []
  const counts = {}
  let error = null

  async function agent(prompt, opts = {}) {
    const label = opts.label ?? '<unlabelled>'
    trace.push({ label, phase: opts.phase, prompt })
    counts[label] = (counts[label] ?? 0) + 1
    if (nullAll || nullLabels.has(label)) return null
    if (args.dryRun) {
      const marker = 'Return exactly this JSON as your structured output: '
      const i = prompt.lastIndexOf(marker)
      if (i === -1) throw new Error(`dryrun stub prompt without JSON payload for ${label}`)
      return JSON.parse(prompt.slice(i + marker.length))
    }
    if (!(label in canned)) throw new Error(`no canned answer for label ${label}`)
    let v = canned[label]
    if (Array.isArray(v)) v = v[Math.min(counts[label] - 1, v.length - 1)]
    return typeof v === 'function' ? v() : v
  }

  async function pipeline(items, ...stages) {
    return Promise.all(items.map(async (item, i) => {
      let prev = item
      for (const stage of stages) {
        try { prev = await stage(prev, item, i) } catch { return null }
      }
      return prev
    }))
  }

  async function parallel(thunks) {
    return Promise.all(thunks.map(t => Promise.resolve().then(t).catch(() => null)))
  }

  const budget = { total: null, spent: () => 0, remaining: () => Infinity }
  const workflow = () => { throw new Error('workflow() not available in replay') }

  let result = null
  try {
    result = await scriptFn(args, agent, m => logs.push(m), () => {}, pipeline, parallel, budget, workflow)
  } catch (e) {
    error = e
  }
  return { result, trace, logs, counts, error }
}

// ---------- assertion plumbing ----------

let failures = 0
let passes = 0
let currentScenario = ''

function scenario(name) {
  currentScenario = name
  console.log(`\n## ${name}`)
}

function check(cond, description, detail) {
  if (cond) { passes++; console.log(`  [PASS] ${description}`) }
  else {
    failures++
    console.log(`  [FAIL] ${description}`)
    if (detail !== undefined) console.log(`         ${String(detail).slice(0, 400)}`)
  }
}

function promptOf(trace, label) {
  const hit = trace.find(t => t.label === label)
  return hit ? hit.prompt : null
}

function assertNoThrow(out) {
  check(!out.error, 'run completes without throwing', out.error && (out.error.stack || out.error.message))
}

function assertBucketsDisjoint(result) {
  if (!result) { check(false, 'buckets well-formed (no result returned)'); return }
  const { completed = [], escalated = [], pendingRetry = [], parked = [] } = result
  const pairs = [['completed', completed, 'escalated', escalated],
                 ['completed', completed, 'pendingRetry', pendingRetry],
                 ['escalated', escalated, 'pendingRetry', pendingRetry]]
  for (const [an, a, bn, b] of pairs) {
    const overlap = a.filter(x => b.includes(x))
    check(overlap.length === 0, `no id in both ${an} and ${bn}`, JSON.stringify(overlap))
  }
  const strayParked = parked.filter(x => !completed.includes(x))
  check(strayParked.length === 0, 'parked is a subset of completed', JSON.stringify(strayParked))
  for (const k of ['completed', 'escalated', 'pendingRetry', 'parked']) {
    check(Array.isArray(result[k]), `return carries array bucket '${k}'`)
  }
  check(typeof result.stalled === 'boolean', "return carries boolean 'stalled'")
  check(typeof result.stopReason === 'string', "return carries 'stopReason'", JSON.stringify(result.stopReason))
}

// ---------- shared live-sim fixtures ----------

const EPIC = 'bd-100'
const BRANCH = 'epic-bd-100-integration'
const ROOT = '/repo'
const IW = `${ROOT}/.worktrees/${BRANCH}` // where the plan actually lands in a real run
const PLANDIR = `${IW}/.superpowers/sdd/${EPIC}-plan`
const PLANPATH = `${PLANDIR}/${EPIC}-plan.md`

const SHA = c => c.repeat(40)

function liveArgs(overrides = {}) {
  return {
    epicId: EPIC,
    integrationBranch: BRANCH,
    dryRun: false,
    config: {
      concurrency: 4,
      models: { planner: 'opus', implementer: 'sonnet', reviewer: 'sonnet', mechanical: 'sonnet', triage: 'opus', finalReview: 'opus', fixEscalation: 'opus' },
    },
    ...overrides,
  }
}

// One-task happy-path canned set: bd-101 briefs, implements, reviews CLEAN, merges. Ready drains
// on the second round. Override pieces per scenario.
function oneTaskCanned(overrides = {}) {
  return {
    'read-ledger': { text: '' },
    'close-epics': { rootClosed: false, closedThisRun: [] },
    'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
    'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }] },
    'brief:bd-101': { id: 'bd-101', n: 1, status: 'BRIEFED', files: ['src/a.js'], branch: 'x', base: SHA('a') },
    'impl:bd-101': { id: 'bd-101', status: 'IMPLEMENTED', files: ['src/a.js'] },
    'review:bd-101': { id: 'bd-101', status: 'CLEAN' },
    'merge:bd-101': { id: 'bd-101', merged: true, head: SHA('b'), mergeBase: SHA('a') },
    'ledger-append:bd-101': { appended: true },
    'final-review': 'looks fine',
    ...overrides,
  }
}

// ---------- scenarios ----------

async function main() {

  // ===== 1. The three recorded dryRun scenarios, replayed offline =====
  const jsonBlocks = extractJsonBlocks()
  check(jsonBlocks.length === 3, `doc carries exactly 3 dryRun args blocks (found ${jsonBlocks.length})`)
  const [canonicalArgs, capArgs, parkArgs] = jsonBlocks

  scenario('dryRun replay: canonical four-task scenario')
  {
    const out = await run({ args: canonicalArgs })
    assertNoThrow(out)
    check(out.trace.length === 32, `32 agent dispatches (got ${out.trace.length})`)
    const r = out.result
    check(r && JSON.stringify(r.completed.sort()) === '["bd-101","bd-102"]', 'completed = [bd-101, bd-102]', JSON.stringify(r?.completed))
    check(r && JSON.stringify(r.escalated) === '["bd-103"]', 'escalated = [bd-103]', JSON.stringify(r?.escalated))
    check(r && JSON.stringify(r.pendingRetry) === '["bd-104"]', 'pendingRetry = [bd-104]', JSON.stringify(r?.pendingRetry))
    check(r && r.parked.length === 0 && r.stalled === false, 'parked empty, stalled false')
    check(r && r.stopReason === 'ready-drained', "stopReason = 'ready-drained'", r?.stopReason)
    check(!out.trace.some(t => ['review:bd-104', 'merge:bd-104'].includes(t.label)), 'bd-104 never reviewed or merged (C4 guard held)')
    assertBucketsDisjoint(r)
  }

  scenario('dryRun replay: cap-tripping scenario')
  {
    const out = await run({ args: capArgs })
    assertNoThrow(out)
    check(out.trace.length === 24, `24 agent dispatches (got ${out.trace.length})`)
    const r = out.result
    check(r && r.completed.length === 0 && JSON.stringify(r.escalated) === '["bd-201"]', 'completed empty, escalated = [bd-201]', JSON.stringify(r))
    check(r && r.review === 'no work landed', "review = 'no work landed'", r?.review)
    check(!out.trace.some(t => t.label === 'merge:bd-201' || t.label === 'final-review'), 'no merge and no final-review dispatched')
    check(out.trace.filter(t => t.label.startsWith('fix:bd-201:')).length === 5, 'exactly 5 fix rounds')
    check(out.trace.filter(t => t.label === 'adjudicate:bd-201').length === 1, 'adjudicator dispatched exactly once')
    assertBucketsDisjoint(r)
  }

  scenario('dryRun replay: PARK scenario')
  {
    const out = await run({ args: parkArgs })
    assertNoThrow(out)
    check(out.trace.length === 23, `23 agent dispatches (got ${out.trace.length})`)
    const r = out.result
    check(r && JSON.stringify(r.completed) === '["bd-301"]' && JSON.stringify(r.parked) === '["bd-301"]', 'bd-301 completed AND parked', JSON.stringify(r))
    check(out.trace.some(t => t.label === 'merge:bd-301'), 'PARK ruling reached the merge gate')
    check(!out.trace.some(t => ['breaker-blocker:bd-301', 'triage:bd-301', 'notify:bd-301'].includes(t.label)), 'no blocker-path dispatch fired on PARK')
    assertBucketsDisjoint(r)
  }

  // ===== 2. live-sim: real prompt builders run; assert the text plumbing =====
  scenario('live-sim: defect-3 file plumbing and defect-4 query/filing text reach real dispatches')
  {
    const canned = {
      'read-ledger': { text: '' },
      'close-epics': { rootClosed: false, closedThisRun: [] },
      'bd-ready': [{ ids: ['bd-101', 'bd-104'] }, { ids: [] }],
      'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }, { n: 4, id: 'bd-104', files: ['src/c.js'] }] },
      'brief:bd-101': { id: 'bd-101', n: 1, status: 'BRIEFED', files: ['src/a.js'], branch: 'x', base: SHA('a') },
      'brief:bd-104': { id: 'bd-104', n: 4, status: 'BRIEFED', files: ['src/c.js'], branch: 'x', base: SHA('d') },
      'impl:bd-101': { id: 'bd-101', status: 'IMPLEMENTED', files: ['src/a.js'] },
      'impl:bd-104': { id: 'bd-104', status: 'BLOCKED', files: ['src/c.js'], blockerBead: 'bd-109' },
      'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'missing null check' },
      'fix:bd-101:1': { id: 'bd-101', status: 'FIXED' },
      're-review:bd-101:1': { id: 'bd-101', status: 'CLEAN' },
      'merge:bd-101': { id: 'bd-101', merged: true, head: SHA('b'), mergeBase: SHA('a') },
      'ledger-append:bd-101': { appended: true },
      'ledger-append:bd-104': { appended: true },
      'triage:bd-104': { decision: 'RESOLVE', detail: 'name the constant' },
      'clarify:bd-104': { recorded: true },
      'final-review': 'fine',
    }
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)

    const ready = promptOf(out.trace, 'bd-ready')
    check((ready?.match(/--exclude-label blocker/g) ?? []).length >= 2, 'bd-ready prompt excludes blocker label on BOTH queries', ready)
    check(/DROP any id whose labels include/.test(ready ?? ''), 'bd-ready prompt drops blocker-labelled ids as a fixed rule')

    const plan = promptOf(out.trace, 'plan')
    check(/ABSOLUTE path/.test(plan ?? ''), 'plan prompt requires an absolute planPath')

    const brief = promptOf(out.trace, 'brief:bd-101')
    check(brief?.includes(`scripts/task-brief ${PLANPATH} 1 ${PLANDIR}/task-1-brief.md`), 'brief prompt passes an explicit integration-workspace OUTFILE', brief)

    const impl = promptOf(out.trace, 'impl:bd-101')
    check(impl?.includes(`[BRIEF_FILE] is ${PLANDIR}/task-1-brief.md`), 'implement prompt names [BRIEF_FILE]', impl)
    check(impl?.includes(`[REPORT_FILE] is ${PLANDIR}/task-1-report.md`), 'implement prompt names [REPORT_FILE]', impl)
    check(/MUST write your full report/.test(impl ?? ''), 'implement prompt mandates writing the report')

    const review = promptOf(out.trace, 'review:bd-101')
    for (const [param, val] of [['BRIEF_FILE', `${PLANDIR}/task-1-brief.md`], ['REPORT_FILE', `${PLANDIR}/task-1-report.md`], ['DIFF_FILE', `${PLANDIR}/task-1-review-initial.diff`]]) {
      check(review?.includes(`[${param}] = ${val}`), `task-review prompt fills [${param}]`, review)
    }
    check(review?.includes(`scripts/review-package ${PLANPATH} ${SHA('a')} HEAD ${PLANDIR}/task-1-review-initial.diff`), 'task-review prompt passes review-package an explicit OUTFILE')

    const rere = promptOf(out.trace, 're-review:bd-101:1')
    check(rere?.includes(`[REPORT_FILE] = ${PLANDIR}/task-1-report.md`) && rere?.includes(`[DIFF_FILE] = ${PLANDIR}/task-1-review-fix-1.diff`), 're-review prompt fills [REPORT_FILE]/[DIFF_FILE] per round', rere)

    const fix = promptOf(out.trace, 'fix:bd-101:1')
    check(fix?.includes(`${PLANDIR}/task-1-report.md`), 'fix prompt names the report file to append to', fix)

    const missing = promptOf(out.trace, 'missing-blocker:bd-104')
    check(missing === null, 'self-filed bead present, so no missing-blocker fallback fired')
    const impl104 = promptOf(out.trace, 'impl:bd-104')
    check(/ONLY the `blocker` label/.test(impl104 ?? '') && /no `--parent`/.test(impl104 ?? ''), 'implementer self-filing instruction is label-only', impl104)

    const r = out.result
    check(JSON.stringify(r?.completed) === '["bd-101"]' && JSON.stringify(r?.pendingRetry) === '["bd-104"]', 'terminal buckets correct', JSON.stringify(r))
    assertBucketsDisjoint(r)
  }

  scenario('live-sim: blocker-filing prompts are label-only (unplanned + breaker paths)')
  {
    // bd-105 is ready but the planner leaves it unmapped -> unplanned-blocker path.
    const canned = oneTaskCanned({
      'bd-ready': [{ ids: ['bd-101', 'bd-105'] }, { ids: [] }],
      'unplanned-blocker:bd-105': { id: 'bd-105', status: 'BLOCKED', blockerBead: 'bd-110' },
      'triage:bd-105': { decision: 'ESCALATE', detail: 'needs a human' },
      'notify:bd-105': { sent: true },
      'ledger-append:bd-105': { appended: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const unplanned = promptOf(out.trace, 'unplanned-blocker:bd-105')
    check(/ONLY the `blocker` label/.test(unplanned ?? '') && /no `sp:` label/.test(unplanned ?? '') && /no `--parent`/.test(unplanned ?? ''), 'unplanned-blocker filing prompt is label-only', unplanned)
    check(JSON.stringify(out.result?.escalated) === '["bd-105"]', 'unmapped id escalated after ESCALATE triage', JSON.stringify(out.result))
  }

  scenario('live-sim: defect 5 — slashed integration branch derives collapsed paths')
  {
    const branch = 'super-auto/my-slug'
    const iw = `${ROOT}/.worktrees/super-auto-my-slug`
    const pd = `${iw}/.superpowers/sdd/${EPIC}-plan`
    const canned = oneTaskCanned({ 'plan': { planPath: `${pd}/${EPIC}-plan.md`, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }] } })
    const out = await run({ args: liveArgs({ integrationBranch: branch }), canned })
    assertNoThrow(out)
    const brief = promptOf(out.trace, 'brief:bd-101')
    check(brief?.includes('.worktrees/super-auto-my-slug--task-bd-101'), 'task worktree path collapses the branch slash', brief)
    check(!brief?.includes('.worktrees/super-auto/my-slug'), 'no slashed (nested) worktree path anywhere in the brief dispatch')
    const merge = promptOf(out.trace, 'merge:bd-101')
    check(merge?.includes('.worktrees/super-auto-my-slug'), 'merge dispatch uses the collapsed integration worktree', merge)
  }

  scenario('live-sim: defect 5 — explicit integrationWorktree wins over derivation')
  {
    const explicit = '/somewhere/native-tool/run-worktree'
    const pd = `${explicit}/.superpowers/sdd/${EPIC}-plan`
    const canned = oneTaskCanned({ 'plan': { planPath: `${pd}/${EPIC}-plan.md`, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }] } })
    const out = await run({ args: liveArgs({ integrationBranch: 'super-auto/my-slug', integrationWorktree: explicit }), canned })
    assertNoThrow(out)
    const readLedger = promptOf(out.trace, 'read-ledger')
    check(readLedger?.includes(explicit), 'ledger read runs in the caller-supplied worktree', readLedger)
    const merge = promptOf(out.trace, 'merge:bd-101')
    check(merge?.startsWith(`In ${explicit},`), 'merge runs in the caller-supplied integration worktree', merge)
    // Task worktrees still use the derived (slash-collapsed) convention — only the INTEGRATION
    // worktree derivation is overridden by the explicit path.
    check(merge?.includes('.worktrees/super-auto-my-slug--task-bd-101'), 'task worktree still follows the collapsed convention', merge)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'run completes normally', JSON.stringify(out.result))
  }

  // ===== 3. null-injection scenarios (defect 1 & 2) =====

  scenario('null merge, transient: costs a round, completes exactly once, never the blocker path')
  {
    const canned = oneTaskCanned({
      'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-101'] }, { ids: [] }],
      'merge:bd-101': [null, { id: 'bd-101', merged: true, head: SHA('b'), mergeBase: SHA('a') }],
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['ledger-append:bd-101'] === 1, `exactly one completion ledger line (got ${out.counts['ledger-append:bd-101'] ?? 0})`)
    check(!out.trace.some(t => t.label.startsWith('triage:') || t.label.startsWith('missing-blocker:') || t.label.startsWith('notify:')), 'null merge never entered the blocker path')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'task completed exactly once', JSON.stringify(out.result))
    check(out.result?.escalated.length === 0 && out.result?.pendingRetry.length === 0, 'no terminal bucket from the null round')
    check(out.logs.some(l => l.includes('NULL dispatch: merge:bd-101')), 'swallowed null merge is logged by label')
    check(out.logs.some(l => l.includes('bounded null-retry 1/2')), 'no-progress round with a null took the bounded retry, not the stall')
    assertBucketsDisjoint(out.result)
  }

  scenario('null bd-ready, permanent: stops as ready-unavailable, never reports completion')
  {
    const canned = oneTaskCanned({ 'bd-ready': [null, null, null, null] })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.result?.stopReason === 'ready-unavailable', "stopReason = 'ready-unavailable'", out.result?.stopReason)
    check(out.counts['bd-ready'] === 3, `bounded: exactly 3 ready attempts (got ${out.counts['bd-ready']})`)
    check(out.result?.completed.length === 0, 'nothing reported completed')
    check(out.result?.review === 'no work landed', 'no final review fabricated')
    check(out.logs.some(l => l.includes('NOT completion')), 'stop log says this is not completion')
    assertBucketsDisjoint(out.result)
  }

  scenario('null bd-ready, transient: one retry then the run proceeds')
  {
    const canned = oneTaskCanned({ 'bd-ready': [null, { ids: ['bd-101'] }, { ids: [] }] })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'work still lands after a transient ready outage', JSON.stringify(out.result))
    check(out.result?.stopReason === 'ready-drained', 'drained exit only after a REAL empty ready set', out.result?.stopReason)
  }

  scenario('null close-epics: closed zero epics, never rootClosed')
  {
    const canned = oneTaskCanned({ 'close-epics': null })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.result?.stopReason === 'ready-drained', 'run never stopped as root-closed', out.result?.stopReason)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'work still lands under a close-epics outage')
    assertBucketsDisjoint(out.result)
  }

  scenario('null plan, permanent: bounded retry then plan-unavailable')
  {
    const canned = oneTaskCanned({ 'bd-ready': { ids: ['bd-101'] }, 'plan': null })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.result?.stopReason === 'plan-unavailable', "stopReason = 'plan-unavailable'", out.result?.stopReason)
    check(out.counts['plan'] === 3, `bounded: exactly 3 plan attempts (got ${out.counts['plan']})`)
    check(out.result?.completed.length === 0 && out.result?.escalated.length === 0, 'no fabricated outcome for the un-planned ids')
    assertBucketsDisjoint(out.result)
  }

  scenario('null implement, transient: no bucket, re-enters, completes once')
  {
    const canned = oneTaskCanned({
      'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-101'] }, { ids: [] }],
      'impl:bd-101': [null, { id: 'bd-101', status: 'IMPLEMENTED', files: ['src/a.js'] }],
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'completed exactly once after recovery', JSON.stringify(out.result))
    check(out.counts['merge:bd-101'] === 1, 'merge dispatched only on the recovered round')
    assertBucketsDisjoint(out.result)
  }

  for (const [label, extra] of [
    ['review:bd-101', {}],
    ['fix:bd-101:1', { 'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'f' } }],
    ['re-review:bd-101:1', { 'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'f' }, 'fix:bd-101:1': { id: 'bd-101', status: 'FIXED' } }],
  ]) {
    scenario(`null ${label.split(':')[0]}: not CLEAN, not BLOCKED — no bucket, no merge, no throw`)
    {
      const canned = oneTaskCanned({ ...extra, [label]: null })
      const out = await run({ args: liveArgs(), canned })
      assertNoThrow(out)
      const r = out.result
      check(r && r.completed.length === 0 && r.escalated.length === 0 && r.pendingRetry.length === 0, 'task in no terminal bucket', JSON.stringify(r))
      check(!out.trace.some(t => t.label === 'merge:bd-101'), 'never reached the merge gate')
      check(!out.trace.some(t => t.label.startsWith('triage:')), 'never entered the blocker path')
      check(out.result?.stopReason === 'ready-drained', 'run drained instead of crashing', out.result?.stopReason)
      assertBucketsDisjoint(r)
    }
  }

  scenario('null triage: unsettled — no quarantine, no burned retry, no ledger line')
  {
    const canned = oneTaskCanned({
      'impl:bd-101': { id: 'bd-101', status: 'BLOCKED', files: [], blockerBead: 'bd-109' },
      'triage:bd-101': null,
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const r = out.result
    check(r && r.escalated.length === 0, 'not quarantined (ESCALATE was never judged)', JSON.stringify(r))
    check(r && r.pendingRetry.length === 0, 'one-retry allowance not burned (RESOLVE was never judged)')
    check(!out.trace.some(t => t.label === 'ledger-append:bd-101'), 'no ledger line written')
    check(!out.trace.some(t => t.label === 'notify:bd-101' || t.label === 'clarify:bd-101'), 'neither branch of triage executed')
    check(out.logs.some(l => l.includes('unsettled')), 'unsettled state is logged')
    assertBucketsDisjoint(r)
  }

  scenario('null adjudicate at the cap: cannot PARK, cannot fabricate BLOCKED')
  {
    const needsFix = { id: 'bd-101', status: 'NEEDS_FIX', finding: 'race' }
    const canned = oneTaskCanned({
      'review:bd-101': needsFix,
      'fix:bd-101:1': { id: 'bd-101', status: 'FIXED' }, 're-review:bd-101:1': needsFix,
      'fix:bd-101:2': { id: 'bd-101', status: 'FIXED' }, 're-review:bd-101:2': needsFix,
      'fix:bd-101:3': { id: 'bd-101', status: 'FIXED' }, 're-review:bd-101:3': needsFix,
      'fix:bd-101:4': { id: 'bd-101', status: 'FIXED' }, 're-review:bd-101:4': needsFix,
      'fix:bd-101:5': { id: 'bd-101', status: 'FIXED' }, 're-review:bd-101:5': needsFix,
      'adjudicate:bd-101': null,
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(!out.trace.some(t => t.label === 'merge:bd-101'), 'no merge without a PARK ruling')
    check(!out.trace.some(t => t.label === 'breaker-blocker:bd-101'), 'no blocker bead filed without a BLOCKED ruling')
    check(out.result?.parked.length === 0 && out.result?.escalated.length === 0, 'no terminal bucket', JSON.stringify(out.result))
    check(out.logs.some(l => l.includes('cannot PARK')), 'null adjudication logged')
    assertBucketsDisjoint(out.result)
  }

  scenario('null blocker filing: BLOCKED task with no bead is left unsettled, never triaged blind')
  {
    const canned = oneTaskCanned({
      'impl:bd-101': { id: 'bd-101', status: 'BLOCKED', files: [] }, // no blockerBead self-filed
      'missing-blocker:bd-101': null,
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.trace.some(t => t.label === 'missing-blocker:bd-101'), 'fallback filing was attempted')
    check(!out.trace.some(t => t.label === 'triage:bd-101'), 'triage never dispatched against an undefined bead')
    check(out.result?.escalated.length === 0 && out.result?.pendingRetry.length === 0, 'no terminal bucket', JSON.stringify(out.result))
    assertBucketsDisjoint(out.result)
  }

  scenario('null final-review: explicit UNAVAILABLE, never "no findings"')
  {
    const canned = oneTaskCanned({ 'final-review': null })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(typeof out.result?.review === 'string' && out.result.review.includes('FINAL REVIEW UNAVAILABLE'), 'review is the explicit UNAVAILABLE string', out.result?.review)
    check(!/no findings/.test(out.result?.review ?? '') || /never as "no findings"/.test(out.result?.review ?? ''), 'unmistakable for a clean review')
  }

  scenario('null read-ledger: resume degrades loudly, run proceeds')
  {
    const canned = oneTaskCanned({ 'read-ledger': null })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'run proceeds to a normal finish', JSON.stringify(out.result))
    check(out.logs.some(l => l.includes('ledger read unavailable')), 'degraded resume is logged')
  }

  scenario('ALL dispatches null simultaneously: nothing throws, nothing fabricated')
  {
    const out = await run({ args: liveArgs(), canned: {}, nullAll: true })
    assertNoThrow(out)
    const r = out.result
    check(r && r.completed.length === 0 && r.escalated.length === 0 && r.pendingRetry.length === 0 && r.parked.length === 0, 'all buckets empty', JSON.stringify(r))
    check(r?.stopReason === 'ready-unavailable', 'stops as ready-unavailable (first unrecoverable gate)', r?.stopReason)
    check(r?.review === 'no work landed', 'no review fabricated')
    check(r?.stalled === false, 'not misreported as a workload stall')
    assertBucketsDisjoint(r)
  }

  scenario('stall guard reachable: resumed-complete id that never closes in bd spins ONE round then stalls')
  {
    // The epic never self-closes (close-epics always rootClosed:false) and bd ready keeps
    // returning an id whose ledger line already says complete — merging it again grows nothing,
    // so the round makes no progress with zero nulls: the stall guard must fire, not spin.
    // This fixture also exercises Resume against NON-EMPTY ledger text, which no recorded dryRun
    // ever did (every read-ledger stub returned {text:""}).
    const canned = oneTaskCanned({
      'read-ledger': { text: `# SDD ledger — plan: ${EPIC}-plan.md\nTask 1 (bd-101): complete (commits aaaaaaa..bbbbbbb, review clean)` },
      'bd-ready': { ids: ['bd-101'] }, // never drains
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.result?.stalled === true && out.result?.stopReason === 'stalled', 'stall guard fired', JSON.stringify({ stalled: out.result?.stalled, stopReason: out.result?.stopReason }))
    check(out.counts['bd-ready'] === 1, `exactly one spin round before the guard (got ${out.counts['bd-ready']})`)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'resume reconstructed completed from real ledger text', JSON.stringify(out.result?.completed))
    check(out.logs.some(l => l.startsWith('STALLED')), 'stall is logged')
    assertBucketsDisjoint(out.result)
  }

  // ===== summary =====
  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
