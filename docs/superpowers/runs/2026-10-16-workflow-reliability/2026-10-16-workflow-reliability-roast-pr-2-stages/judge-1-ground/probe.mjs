#!/usr/bin/env node
// Replay harness for the canonical coordinator script, skills/super-code/coordinator.js (dryRun
// args and stub tables live in skills/super-code/coordinator-workflow.md).
//
// Why this exists: every recorded validation of that script before 2026-08 was dryRun-only, and
// dryRun stubs never return null and never reference a missing file — so the entire class of
// defects the first live run hit (null agent() results crashing or fabricating success, reviewer
// file parameters never supplied) was structurally invisible to it. This harness stubs the
// Workflow runtime's hooks (agent/log/phase/pipeline/parallel) in-process and drives full rounds:
//
// - "dryrun" mode replays the three recorded dryRun scenarios (canonical, fix-pass-blocked,
//   parked) from the doc's own ```json args blocks, answering each stub prompt with its embedded
//   JSON — same counts, no model spend.
// - "live-sim" mode runs with dryRun:false, so the REAL prompt builders execute and their text
//   can be asserted (the thing the doc says no dryRun can ever prove), with canned answers keyed
//   by dispatch label — and any label's answer can be null, or an array consumed per call whose
//   entries can be null, to model a subagent dying on a terminal API error (transiently or
//   permanently).
//
// No dependencies. Run: node tests/super-code/replay-harness.mjs

import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { execFileSync, spawnSync, spawn } from 'node:child_process'

const here = path.dirname(fileURLToPath(import.meta.url))
const skillDir = '/tmp/ufz-pr2-controller/source/skills/super-code'
const docPath = path.join(skillDir, 'coordinator-workflow.md')
const doc = readFileSync(docPath, 'utf8')
const implementerTemplate = readFileSync(path.join(skillDir, 'implementer-prompt.md'), 'utf8')
const reviewerTemplate = readFileSync(path.join(skillDir, 'task-reviewer-prompt.md'), 'utf8')

// Fixture teardown must not depend on the inspection/cleanup helper being tested.
async function withFixtureProcesses(run) {
  const owned = []
  const own = child => {
    if (!Number.isSafeInteger(child.pid) || child.pid <= 1) throw new Error('fixture did not supply an owned PID')
    owned.push(child); child.unref?.(); return child
  }
  try { return await run(own) }
  finally {
    const exits = owned.filter(c => c.once && c.exitCode === null && c.signalCode === null)
      .map(c => new Promise(resolve => { c.ref(); c.once('exit', resolve) }))
    for (const child of owned) {
      if (child.once && (child.exitCode !== null || child.signalCode !== null)) continue
      try { process.kill(child.pid, 'SIGKILL') }
      catch (e) { if (e.code !== 'ESRCH') throw e }
    }
    await Promise.all(exits)
  }
}

function fixtureProcessAlive(pid) {
  const r = spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' })
  if (r.error || typeof r.stdout !== 'string' || ![0, 1].includes(r.status) || (r.status === 0 && !r.stdout.trim())) {
    throw new Error(`process inspection unavailable for fixture PID ${pid}`)
  }
  const st = r.stdout.trim()
  return st !== '' && !st.startsWith('Z')
}

// ---------- extraction ----------

function extractScript() {
  return readFileSync(path.join(skillDir, 'coordinator.js'), 'utf8').replace(/^export const meta/m, 'const meta')
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
const scriptFn = new AsyncFunction('args', 'agent', 'log', 'phase', 'pipeline', 'parallel', 'budget', 'workflow', 'setTimeout', 'clearTimeout', scriptBody)

// ---------- runtime stubs ----------

// canned: { [label]: value | value[] | fn } — arrays are consumed one entry per call, clamped to
// the last entry; an entry (or the whole value) of null models a dead subagent. A FUNCTION value
// is awaited with a context `{ waitFor(label), counts, trace }` — `waitFor` resolves once a
// dispatch with that label has been observed (immediately if it already was), which lets a
// scenario build stragglers and cross-task orderings without timers. In dryrun mode canned is
// ignored and each stub prompt's embedded JSON is the answer, except labels listed in
// nullLabels, which return null (dryRun stubs can't model null — that is the point of this knob).
// `maxOpen` (returned) tracks the concurrent-in-flight high-water mark per label KIND (the text
// before the first ':') — `maxOpen.merge === 1` is the single-flight merge invariant.
// `timeoutMs` converts a deadlock (e.g. a reintroduced dispatch/merge barrier that makes a
// waitFor unsatisfiable) into a test failure instead of a hang.
async function run({ args, canned = {}, nullLabels = new Set(), nullAll = false, timeoutMs = 15000, readinessTimers = { setTimeout, clearTimeout } }) {
  const trace = []
  const logs = []
  const counts = {}
  const open = {}
  const maxOpen = {}
  const seen = new Set()
  const waiters = []
  let error = null

  const waitFor = label => seen.has(label)
    ? Promise.resolve()
    : new Promise(res => waiters.push({ label, res }))

  async function agent(prompt, opts = {}) {
    const label = opts.label ?? '<unlabelled>'
    const kind = label.split(':')[0]
    trace.push({ label, phase: opts.phase, prompt, opts })
    counts[label] = (counts[label] ?? 0) + 1
    seen.add(label)
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (waiters[i].label === label) { waiters[i].res(); waiters.splice(i, 1) }
    }
    open[kind] = (open[kind] ?? 0) + 1
    maxOpen[kind] = Math.max(maxOpen[kind] ?? 0, open[kind])
    try {
      if (nullAll || nullLabels.has(label)) return null
      if (args.dryRun) {
        const marker = 'Return exactly this JSON as your structured output: '
        const i = prompt.lastIndexOf(marker)
        if (i === -1) throw new Error(`dryrun stub prompt without JSON payload for ${label}`)
        return JSON.parse(prompt.slice(i + marker.length))
      }
      if (!(label in canned)) {
        // Dispatches that fire in nearly every live-sim scenario whatever its point — the Finish
        // Metrics block (unconditional), the Finish reconciliation (whenever escalated/pendingRetry
        // is non-empty), the mandatory sweep (whenever work landed), and each task's batched
        // `ledger:<id>` flush — default to no-op answers here; a scenario that cares about one
        // overrides its key explicitly.
        if (label.startsWith('close-check:')) return { closed: (prompt.match(/read its status: ([^.]+)\./)?.[1] ?? '').split(', ') }
        if (label === 'read-ledger:finish' || label === 'read-ledger:finish:retry') return { text: '# ledger-digest: 0 of 1 lines', reviewBase: SHA('a'), reviewHead: SHA('b') }
        if (label === 'ledger-append:metrics' || label.startsWith('ledger-append:recovery:')) return { appended: true }
        if (label === 'reconcile-buckets') return { closed: [] }
        if (label === 'assemble:final') return { dir: FR_DIR, exit: 0, fits: 'fits: yes (12000 of 80000)', clusterFits: [], clusters: 0 }   // the final review's assembler pre-step: fits
        if (label === 'sweep') return 'abc1234 — 1 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: <project test command>'
        if (label === 'ledger-append:sweep') return { appended: true }
        if (label.startsWith('ledger:')) return { appended: true }   // a task's batched ledger flush
        if (label === 'plan-rest') return { planPath: '', mapping: [] }   // round 1's second planner: nothing more to map
        if (label === 'worktree-sweep') return { lines: [] }   // the Finish worktree backstop: nothing left to sweep
        throw new Error(`no canned answer for label ${label}`)
      }
      let v = canned[label]
      if (Array.isArray(v)) v = v[Math.min(counts[label] - 1, v.length - 1)]
      v = typeof v === 'function' ? await v({ waitFor, counts, trace }) : v
      // Ledger reads echo scripts/ledger-digest, whose first line counts what it kept: fixtures written
      // as bare ledger text get that header added (a fixture that sets its own header is left alone).
      if (label.startsWith('read-ledger') && v && typeof v.text === 'string' && v.text.trim() && !v.text.startsWith('# ledger-')) {
        const n = v.text.split('\n').filter(l => l.trim()).length
        v = { ...v, text: `# ledger-digest: ${n} of ${n} lines\n${v.text}` }
      }
      return v
    } finally {
      open[kind]--
    }
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
  let timer = null
  try {
    result = await Promise.race([
      scriptFn(args, agent, m => logs.push(m), () => {}, pipeline, parallel, budget, workflow, readinessTimers.setTimeout, readinessTimers.clearTimeout),
      new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`HARNESS TIMEOUT after ${timeoutMs}ms — an unsatisfied waitFor usually means a dispatch/merge barrier was reintroduced`)), timeoutMs) }),
    ])
  } catch (e) {
    error = e
  } finally {
    if (timer) clearTimeout(timer)
    for (const w of waiters) w.res()  // release stranded waiters so node can exit
  }
  return { result, trace, logs, counts, maxOpen, error }
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
  // Task 6: additive — an array of exactly four strings, alongside `sweep`, never replacing it.
  check(Array.isArray(result.metrics) && result.metrics.length === 4 && result.metrics.every(l => typeof l === 'string'),
    "return carries 'metrics' as an array of exactly four strings", JSON.stringify(result.metrics))
}

// ---------- shared live-sim fixtures ----------

const EPIC = 'bd-100'
const BRANCH = 'epic-bd-100-integration'
const ROOT = '/repo'
const IW = `${ROOT}/.worktrees/${BRANCH}` // where the plan actually lands in a real run
const PLANDIR = `${IW}/.superpowers/sdd/${EPIC}-plan`
const PLANPATH = `${PLANDIR}/${EPIC}-plan.md`
// liveArgs sets no integrationWorktree, so the script derives it from the branch; the final review's
// workspace, assembled directory and handoff file hang off that path (runTag falls back to the epic).
const FR_WS = `.worktrees/${BRANCH}/.superpowers/sdd/${EPIC}-plan`
const REVIEW_PATH = `${FR_WS}/final-review-${EPIC}.md`
const FR_DIR = `${FR_WS}/assembled/final-review-${EPIC}-final`

const SHA = c => c.repeat(40)

// Mirrors the coordinator script's own `LEDGER_LINE_RE` (see coordinator-workflow.md) — kept as a
// literal copy, not extracted from the doc, because this harness already extracts and RUNS the
// script itself (extractScript) and a self-referential extraction of one more regex out of that
// same text would just move the sync risk, not remove it; a drift here is caught the same way any
// other doc/harness mismatch is, by a failing assertion.
const LEDGER_LINE_RE = /^Task\s+(\S+)\s+\(([^)]+)\):\s*(.*)$/
// Pulls the actual ledger payload out of a real ledgerAppendPrompt dispatch's prompt text — the
// text inside each `<ledger-line>` tag that prompt wraps every line in (see `ledgerAppendPrompt`
// in coordinator-workflow.md) — so assertions check the LINES, not the instruction prose.
function extractLedgerLines(promptText) {
  return [...String(promptText ?? '').matchAll(/<ledger-line>([^\n]*?)<\/ledger-line>/g)].map(m => m[1])
}
function extractLedgerLine(promptText) {
  return extractLedgerLines(promptText)[0] ?? null
}
// A task's ledger lines are batched: everything the task noted (fix pass, Merge:, completion,
// minors, blocker outcome) is written by one `ledger:<id>` flush when its chain ends — or its
// `:retry` when that flush returned null. These collect every line written for one id, in order.
function taskLedgerLines(trace, id, { retry = false, recovery = false } = {}) {
  const label = retry ? `ledger:${id}:retry` : `ledger:${id}`
  return trace.filter(t => t.label === label).flatMap(t => extractLedgerLines(t.prompt)).filter(l => recovery || !l.startsWith('Recovery:'))
}
function taskLedgerLine(trace, id, re, opts) {
  return taskLedgerLines(trace, id, opts).find(l => re.test(l)) ?? null
}
// Mirrors the coordinator script's own `defaultTestPathspecs` (spec §5) — kept here, not
// imported from the script, since the script has no module exports of its own (it's an
// AsyncFunction body extracted from the doc's fence, see `extractScript`). The prompt-text
// assertions above already prove the SAME array appears in a real dispatch; this copy is only
// for the fixture-repo scenario below, which needs the literal list to hand to a real
// subprocess `git diff` — a change to the script's list without updating this copy would show
// up there as a spurious pass/fail, not silently.
const defaultTestPathspecsForFixtureTest = [
  'tests/**', 'test/**', 'spec/**', '**/tests/**', '**/test/**', '**/spec/**',
  '*_test.*', '*.test.*', 'test_*.*', '*_spec.*', '*.spec.*',
  '**/*_test.*', '**/*.test.*', '**/test_*.*', '**/*_spec.*', '**/*.spec.*',
]

const MODELS = { planner: 'opus', implementer: 'sonnet', reviewer: 'sonnet', mechanical: 'sonnet', triage: 'opus', finalReview: 'opus' }
const cfg = (extra = {}) => ({ concurrency: 4, models: MODELS, ...extra })
const SKILLS = '/abs/superpowers/skills'

function liveArgs(overrides = {}) {
  return {
    epicId: EPIC,
    invocationId: EPIC,
    integrationBranch: BRANCH,
    skillsRoot: SKILLS,
    dryRun: false,
    config: cfg(),
    ...overrides,
  }
}

// One-task happy-path canned set: bd-101 briefs, implements, reviews CLEAN, merges. Ready drains
// on the second round. Override pieces per scenario.
function oneTaskCanned(overrides = {}) {
  return {
    'read-ledger': { text: '# ledger-status: missing' },
    'ledger-append:launch': { appended: true },
    'ledger-append:detector': { appended: true },
    'edge-audit:1': { openLeaves: 0, depth: 1, changes: [], summary: 'stub audit' },
    'edge-audit:2': { openLeaves: 0, depth: 1, changes: [], summary: 'stub audit' },
    'edge-audit:3': { openLeaves: 0, depth: 1, changes: [], summary: 'stub audit' },
    'ledger-append:edge-audit:1': { appended: true },
    'ledger-append:edge-audit:2': { appended: true },
    'ledger-append:edge-audit:3': { appended: true },
    'close-epics': { rootClosed: false, closedThisRun: [] },
    'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
    'bd-ready-topup': { ids: [] },
    'bd-ready-recheck': { ids: [] },
    'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }] },
    'impl:bd-101': { id: 'bd-101', status: 'IMPLEMENTED', base: SHA('a'), head: SHA('c'), files: ['src/a.js'] },
    'review:bd-101': { id: 'bd-101', status: 'CLEAN' },
    'fix:bd-101': { id: 'bd-101', status: 'FIXED', head: SHA('f') },
    'merge:bd-101': { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, head: SHA('b'), mergeBase: SHA('a'), rebaseConflictFiles: 0 },
    'read-ledger:finish': { reviewBase: SHA('a'), reviewHead: SHA('b'), text: '# ledger-digest: 0 of 1 lines' },
    'ledger-append:metrics': { appended: true },
    'assemble:final': { dir: FR_DIR, exit: 0, fits: 'fits: yes (12000 of 80000)', clusterFits: [], clusters: 0 },
    'final-review': { verdict: 'ready', path: REVIEW_PATH },
    ...overrides,
  }
}


const identity = {sourceTree:SHA('d'), command:'node smoke.mjs', configuration:'local'}
const evidence = [{...identity,kind:'live',outcome:'pass',location:'evidence/live.log'}]
const verification = {id:'bd-102',completionKind:'verification-only',base:SHA('a'),head:SHA('a'),sourceTree:SHA('d'),files:[],evidence,requiredLiveChecks:[identity]}
async function probe({ordinary=false,success=false,cap=1}={}) {
 const canned = oneTaskCanned({
  'plan':{planPath:PLANPATH,mapping:[{n:1,id:'bd-101',files:['p'],deps:[]},{n:2,id:'bd-102',files:['q'],deps:['bd-101']}]},
  'review-bead:bd-101':{reviewBead:'bd-101-rv',implClosed:true,created:true},
  'impl:bd-102': ordinary ? {id:'bd-102',status:'IMPLEMENTED',base:SHA('a'),head:SHA('c'),files:[]} : {...verification,status:'IMPLEMENTED'},
  'review:bd-102': ordinary ? {id:'bd-102',status:'CLEAN'} : {...verification,status:'CLEAN'},
  'merge:bd-101':async ctx => {
    await ctx.waitFor('review:bd-102'); await new Promise(r=>setImmediate(r));
    return success ? {id:'bd-101',merged:true,mergeExit:0,mergeHead:true,head:SHA('b'),mergeBase:SHA('a')} : {id:'bd-101',merged:false,blockerBead:'bd-108',rebaseConflictFiles:1}
  },
  'merge:bd-102':{id:'bd-102',merged:true,mergeExit:0,mergeHead:true,head:SHA('b'),mergeBase:SHA('a')},
  'reopen:bd-101':{reopened:['bd-101']},
  'discard:bd-102':{discarded:true,reopened:[]},
  'triage:bd-101':{decision:'ESCALATE',detail:'conflict'},
  'notify:bd-101':{sent:true},
  'close-only:bd-102':{id:'bd-102',status:'CLOSED'},
 })
 const out=await run({args:liveArgs({config:cfg({concurrency:cap,readinessRefreshMs:5})}),canned,timeoutMs:300})
 return {ordinary,success,cap,error:out.error?.message,trace:out.trace.map(t=>t.label),logs:out.logs,result:out.result}
}
const receipt=[]
for(const args of [{},{ordinary:true},{success:true},{cap:2}]) receipt.push(await probe(args))
writeFileSync(new URL('receipt.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n')
console.log(JSON.stringify(receipt.map(({trace,logs,result,...r})=>({...r,trace,completed:result?.completed})),null,2))

process.exit(0)
