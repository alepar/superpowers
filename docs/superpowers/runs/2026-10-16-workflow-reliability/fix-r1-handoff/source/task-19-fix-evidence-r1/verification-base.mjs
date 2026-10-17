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

const here = path.join(process.cwd(), 'tests', 'super-code')
const skillDir = path.join(here, '..', '..', 'skills', 'super-code')
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

// ---------- template-literal span scan (issue #2 defect 7) ----------
// `node --check` passes a script whose template-literal boundaries MOVED: a raw backtick in
// prose inserted into a literal terminates it early, the rest of the prompt becomes code (or
// vice versa), and the file often remains syntactically valid — node is right to accept it,
// and the Workflow runtime (or the prompt content) is silently wrong. The detector is span
// accounting: scan the script with a string/comment/template-aware state machine and compare
// the top-level template-literal count against the recorded baseline below. An unintended
// span change is the signature of the backtick-in-prose trap; update the baseline ONLY
// alongside an edit that deliberately adds or removes a template literal.
function scanTemplateSpans(src) {
  const spans = []
  let state = 'code'            // code | line | block | str1 | str2 | tpl
  const tplDepth = []           // ${} nesting: each entry is the brace depth inside one ${...}
  let start = -1
  let prevSig = ''              // last significant char in code state, for regex-vs-division
  for (let i = 0; i < src.length; i++) {
    const c = src[i], n = src[i + 1]
    if (state === 'line') { if (c === '\n') state = 'code'; continue }
    if (state === 'block') { if (c === '*' && n === '/') { state = 'code'; i++ } continue }
    if (state === 'str1') { if (c === '\\') i++; else if (c === "'") state = 'code'; continue }
    if (state === 'str2') { if (c === '\\') i++; else if (c === '"') state = 'code'; continue }
    if (state === 'tpl') {
      if (c === '\\') { i++; continue }
      if (c === '$' && n === '{') { tplDepth.push(0); state = 'code'; i++; continue }
      if (c === '`') { state = 'code'; spans.push([start, i]); prevSig = '`' }
      continue
    }
    // code state
    if (c === '/' && n === '/') { state = 'line'; i++; continue }
    if (c === '/' && n === '*') { state = 'block'; i++; continue }
    if (c === '/' && /[=(,:;!&|?{}[+\-*%~^<>]/.test(prevSig)) {
      // regex literal: skip to its unescaped closing /, honoring character classes
      let cls = false
      for (i++; i < src.length; i++) {
        const r = src[i]
        if (r === '\\') { i++; continue }
        if (r === '[') cls = true
        else if (r === ']') cls = false
        else if (r === '/' && !cls) break
      }
      prevSig = '/'
      continue
    }
    if (c === "'") { state = 'str1'; continue }
    if (c === '"') { state = 'str2'; continue }
    if (c === '`') { if (tplDepth.length === 0) start = i; state = 'tpl'; continue }
    if (tplDepth.length > 0) {
      if (c === '{') tplDepth[tplDepth.length - 1]++
      else if (c === '}') {
        if (tplDepth[tplDepth.length - 1] === 0) { tplDepth.pop(); state = 'tpl'; continue }
        tplDepth[tplDepth.length - 1]--
      }
    }
    if (!/\s/.test(c)) prevSig = c
  }
  return { spans, clean: state === 'code' && tplDepth.length === 0 }
}
// ---------- scenarios ----------

async function main() {
  scenario('live-sim: independently reviewed verification-only completion preserves unchanged HEAD')
  {
    const identity = { sourceTree: SHA('d'), command: 'node smoke.mjs', configuration: 'target=staging' }
    const evidence = [{ ...identity, kind: 'live', outcome: 'pass', location: 'evidence/live.log' }]
    const impl = { id: 'bd-101', status: 'IMPLEMENTED', completionKind: 'verification-only', base: SHA('a'), head: SHA('a'), sourceTree: SHA('d'), files: [], evidence, requiredLiveChecks: [identity] }
    const review = { id: 'bd-101', status: 'CLEAN', files: [], base: SHA('a'), head: SHA('a'), completionKind: 'verification-only', sourceTree: SHA('d'), evidence, requiredLiveChecks: [identity] }
    const canned = extra => oneTaskCanned({ 'missing-blocker:bd-101': null, 'impl:bd-101': impl, 'review:bd-101': review, 'close-only:bd-101': { id: 'bd-101', status: 'CLOSED' }, ...extra })
    const out = await run({ args: liveArgs(), canned: canned() })
    assertNoThrow(out)
    check(out.counts['review:bd-101'] === 1 && out.counts['close-only:bd-101'] === 1 && out.result?.completed?.includes('bd-101'), 'unchanged verification dispatches independent review and confirmed closure')
    check(!out.counts['commit-nudge:bd-101'] && !out.counts['merge:bd-101'] && !out.counts['fix:bd-101'] && !out.counts['review-bead:bd-101'], 'verification creates no artificial commit, merge, unreviewed fix or early split')
    const prompt = promptOf(out.trace, 'review:bd-101') ?? ''
    check(prompt.includes('[COMPLETION_KIND] = verification-only') && prompt.includes(identity.sourceTree) && prompt.includes('evidence/live.log'), 'evidence review receives intent, fixed source and retained measurements')
    const close = promptOf(out.trace, 'close-only:bd-101') ?? ''
    check(close.includes('verification-only') && close.includes('bd show') && !close.includes('scripts/already-merged'), 'verification closure uses reviewed basis and tracker status rather than a merge claim')
    const basis = out.result?.verificationCompletions?.[0]
    check(basis?.reviewStatus === 'CLEAN' && basis?.head === SHA('a') && basis?.sourceTree === SHA('d') && basis?.evidence?.[0]?.location === 'evidence/live.log', 'durable completion retains source, independent review and evidence basis', JSON.stringify(basis))
    const lines = out.trace.filter(t => /^ledger/.test(t.label)).flatMap(t => extractLedgerLines(t.prompt))
    check(lines.some(l => l.startsWith('Recovery:') && l.includes('verification-only') && l.includes('evidence/live.log')) && lines.some(l => /complete \(verification-only/.test(l)), 'ledger records verification basis before completion')
    const dir = mkdtempSync(path.join(os.tmpdir(), 'verification-digest-'))
    let digest
    try {
      const file = path.join(dir, 'progress.md')
      writeFileSync(file, lines.join('\n'))
      digest = execFileSync('bash', [path.join(skillDir, 'scripts/ledger-digest'), file], { encoding: 'utf8' })
    } finally { rmSync(dir, { recursive: true, force: true }) }
    const resumed = await run({ args: liveArgs(), canned: canned({ 'read-ledger': { text: digest }, 'bd-ready': { ids: [] }, 'read-ledger:finish': { text: digest, reviewBase: SHA('a'), reviewHead: SHA('a') } }) })
    assertNoThrow(resumed)
    check(resumed.result?.completed?.includes('bd-101') && resumed.result?.verificationCompletions?.[0]?.sourceTree === SHA('d') && !resumed.counts['impl:bd-101'], 'resume reuses reviewed verification with unchanged source')
    check(resumed.result?.metrics?.some(l => /merges 0/.test(l)) && resumed.result?.metrics?.some(l => /ledger-check ok/.test(l)), 'verification completion does not increment task landings or invalidate ledger accounting')
    check(resumed.result?.metricsEvidence?.completed?.includes('bd-101') && JSON.stringify(resumed.result?.metricsEvidence?.ledger?.landings) === '[]' && JSON.stringify(resumed.result?.metricsEvidence?.discrepancies?.completedOnly) === '[]', 'reconciled metrics retain verification completion without a fictitious missing landing')
    for (const [name, extra] of [
      ['missing evidence', { 'impl:bd-101': { ...impl, evidence: [] }, 'review:bd-101': { ...review, evidence: [] } }],
      ['stale source', { 'review:bd-101': { ...review, sourceTree: SHA('e') } }],
      ['fallback required live', { 'impl:bd-101': { ...impl, evidence: [{ ...evidence[0], kind: 'fallback' }] }, 'review:bd-101': { ...review, evidence: [{ ...evidence[0], kind: 'fallback' }] } }],
      ['unavailable required check', { 'review:bd-101': { ...review, evidence: [{ ...evidence[0], outcome: 'unavailable' }] } }],
      ['changed verification', { 'impl:bd-101': { ...impl, head: SHA('c') } }],
      ['changed files', { 'impl:bd-101': { ...impl, files: ['src/a.js'] } }],
      ['wrong required configuration', { 'review:bd-101': { ...review, requiredLiveChecks: [{ ...identity, configuration: 'target=production' }] } }],
      ['missing reviewer source', { 'review:bd-101': { ...review, sourceTree: undefined } }],
      ['failed required check', { 'review:bd-101': { ...review, evidence: [{ ...evidence[0], outcome: 'fail' }] } }],
      ['unconfirmed intent', { 'review:bd-101': { ...review, completionKind: 'implementation' } }],
      ['implementation bead', { 'impl:bd-101': { ...impl, completionKind: 'implementation' }, 'commit-nudge:bd-101': { ...impl, completionKind: 'implementation' } }],
      ['null review', { 'review:bd-101': null }],
      ['invalid review', { 'review:bd-101': { id: 'bd-101', status: 'INVALID' }, 'review:bd-101:retry': { id: 'bd-101', status: 'INVALID' } }],
      ['rejected review', { 'review:bd-101': { ...review, status: 'NEEDS_FIX', finding: 'acceptance requires implementation' } }],
    ]) {
      const denied = await run({ args: liveArgs(), canned: canned(extra) })
      assertNoThrow(denied)
      check(!denied.result?.completed?.includes('bd-101') && !denied.counts['merge:bd-101'] && !denied.counts['close-only:bd-101'], name + ' cannot complete unchanged verification')
    }
    const rejectedClosed = await run({ args: liveArgs(), canned: canned({
      'review:bd-101': { ...review, status: 'NEEDS_FIX', finding: 'task requires delivered changes' },
      'missing-blocker:bd-101': { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-190' },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'unreviewed task' }, 'notify:bd-101': { sent: true },
      'reconcile-buckets': { closed: ['bd-101'] },
    }) })
    assertNoThrow(rejectedClosed)
    check(!rejectedClosed.result?.completed?.includes('bd-101'), 'tracker closure alone cannot replace rejected verification acceptance')
    const unpersisted = await run({ args: liveArgs(), canned: canned({ 'ledger-append:recovery:pending-closure:bd-101': null, 'ledger-append:recovery:pending-closure:bd-101:retry': null }) })
    assertNoThrow(unpersisted)
    check(!unpersisted.result?.completed?.length && !unpersisted.counts['close-only:bd-101'], 'unavailable durable verification write prevents tracker closure')
    const implementation = await run({ args: liveArgs(), canned: oneTaskCanned({ 'review:bd-101': review }) })
    assertNoThrow(implementation)
    check(implementation.counts['merge:bd-101'] === 1 && implementation.result?.verificationCompletions?.length === 0, 'a reviewer cannot switch implementation delivery to no-change completion')
    const cleanup = await run({ args: liveArgs(), canned: canned({ 'close-only:bd-101': { id: 'bd-101', status: 'CLOSED', finding: 'unknown: task process inspection refused; kept: task resource' } }) })
    assertNoThrow(cleanup)
    check(cleanup.result?.completed?.includes('bd-101') && cleanup.result?.verificationCompletions?.[0]?.cleanup === 'unknown: task process inspection refused; kept: task resource', 'confirmed closure retains unverified cleanup as its actual outcome')
    const capDir = mkdtempSync(path.join(os.tmpdir(), 'verification-cap-'))
    let capped
    try {
      const file = path.join(capDir, 'progress.md')
      const record = lines.find(l => l.startsWith('Recovery:') && l.includes('reviewed verification-only'))
      const oversized = JSON.parse(record.slice('Recovery:'.length))
      oversized.data.verification.evidence = Array(30).fill(evidence[0])
      writeFileSync(file, 'Recovery: ' + JSON.stringify(oversized) + '\nTask 1 (bd-101): complete (verification-only, reviewed acceptance evidence; no Git landing)\n')
      capped = execFileSync('bash', [path.join(skillDir, 'scripts/ledger-digest'), file], { encoding: 'utf8' })
      check(capped.includes('Recovery gap: 1 ' + file) && capped.includes('Task 1 (bd-101): complete, verification-only') && !capped.includes('evidence/live.log'), 'oversized basis preserves cap/source pointer and verification completion discriminator', capped)
    } finally { rmSync(capDir, { recursive: true, force: true }) }
    const gap = await run({ args: liveArgs(), canned: canned({ 'read-ledger': { text: capped }, 'bd-ready': { ids: [] } }) })
    assertNoThrow(gap)
    check(!gap.result?.completed?.length && gap.result?.recovery?.gaps?.some(g => g.reason.includes('verification completion basis unavailable')) && !gap.counts['close-only:bd-101'], 'typed completion with compacted-away basis remains an evidence gap rather than an inferred landing')
    const reentry = await run({ args: liveArgs(), canned: canned({ 'read-ledger': { text: capped } }) })
    assertNoThrow(reentry)
    check(reentry.counts['impl:bd-101'] === 1 && reentry.counts['review:bd-101'] === 1 && reentry.result?.completed?.includes('bd-101') && !reentry.counts['merge:bd-101'], 'ready reentry with missing basis obtains independent verification review before closure')
    const pending = await run({ args: liveArgs(), canned: canned({ 'close-only:bd-101': null }) })
    assertNoThrow(pending)
    check(!pending.result?.completed?.length && pending.result?.closureUnconfirmed?.includes('bd-101') && pending.result?.verificationCompletions?.length === 1, 'unavailable closure preserves verified basis and remains unconfirmed')
    const finishClosed = await run({ args: liveArgs(), canned: canned({
      'close-only:bd-101': null, 'reconcile-buckets': { closed: ['bd-101'] },
      'read-ledger:finish': { text: digest, landed: [], reviewBase: SHA('a'), reviewHead: SHA('a') },
    }) })
    assertNoThrow(finishClosed)
    check(finishClosed.trace.findIndex(t => t.label === 'reconcile-buckets') < finishClosed.trace.findIndex(t => t.label === 'read-ledger:finish') && finishClosed.result?.metricsEvidence?.completed?.includes('bd-101'), 'Finish-only verification closure is reconciled before metric source capture')
    check(finishClosed.result?.metrics?.[1].includes('verification-only 1') && finishClosed.result?.metrics?.[3].startsWith('Metrics: ledger-check ok') && JSON.stringify(finishClosed.result?.metricsEvidence?.discrepancies?.completedOnly) === '[]', 'Finish-only verification contributes a completion and zero missing landings')
    const pendingLines = pending.trace.filter(t => /^ledger/.test(t.label)).flatMap(t => extractLedgerLines(t.prompt)).join('\n')
    const recovered = await run({ args: liveArgs(), canned: canned({ 'read-ledger': { text: pendingLines }, 'bd-ready': [{ ids: [] }, { ids: [] }], 'resume-check:bd-101': { landed: false, sourceVerified: true, closed: [], open: ['bd-101'] } }) })
    assertNoThrow(recovered)
    check(recovered.result?.completed?.includes('bd-101') && !recovered.counts['review:bd-101'] && !recovered.counts['impl:bd-101'] && recovered.counts['close-only:bd-101'] === 1, 'pending verification resumes closure only without repeating reviewed work')
    const resumePrompt = promptOf(recovered.trace, 'resume-check:bd-101') ?? ''
    check(resumePrompt.includes(SHA('a')) && resumePrompt.includes(SHA('d')) && resumePrompt.includes('sourceVerified') && !resumePrompt.includes('already-merged'), 'verification resume checks captured commit/tree without inventing a landing')
    for (const observation of [null, { landed: true, sourceVerified: false, closed: ['bd-101'], open: [] }, { landed: false, sourceVerified: true, closed: [], open: [], error: 'tracker unavailable' }]) {
      const held = await run({ args: liveArgs(), canned: canned({ 'read-ledger': { text: pendingLines }, 'resume-check:bd-101': observation, 'reconcile-buckets': { closed: ['bd-101'] } }) })
      assertNoThrow(held)
      check(!held.result?.completed?.length && !held.counts['close-only:bd-101'] && held.result?.stopReason === 'recovery-held', 'unverified source or tracker holds verification recovery despite tracker closure claims')
    }
    for (const append of [null, { appended: false }]) {
      const held = await run({ args: liveArgs(), canned: canned({ 'read-ledger': { text: pendingLines }, 'resume-check:bd-101': { landed: false, sourceVerified: true, closed: [], open: ['bd-101'] }, 'ledger:bd-101': append, 'ledger:bd-101:retry': append }) })
      assertNoThrow(held)
      check(!held.result?.completed?.length && held.result?.stopReason === 'recovery-held' && held.result?.recovery?.obligations.some(r => r.kind === 'pending-closure' && r.data.verification?.sourceTree === SHA('d')), 'failed verification closure append preserves accepted basis before settlement')
    }
    const closedResume = await run({ args: liveArgs(), canned: canned({ 'read-ledger': { text: pendingLines }, 'bd-ready': { ids: [] }, 'resume-check:bd-101': { landed: false, sourceVerified: true, closed: ['bd-101'], open: [] } }) })
    assertNoThrow(closedResume)
    check(closedResume.result?.completed?.includes('bd-101') && !closedResume.counts['close-only:bd-101'] && !closedResume.counts['impl:bd-101'] && closedResume.result?.metrics?.some(l => /merges 0/.test(l)), 'already closed verification resume confirms durable typed completion without a landing')
  }

  console.log(`${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
}
main().catch(e => { console.error(e); process.exit(1) })
