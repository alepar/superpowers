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

import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { execFileSync, spawnSync } from 'node:child_process'

const here = path.dirname(fileURLToPath(import.meta.url))
const skillDir = path.join(here, '..', '..', 'skills', 'super-code')
const docPath = path.join(skillDir, 'coordinator-workflow.md')
const doc = readFileSync(docPath, 'utf8')
const implementerTemplate = readFileSync(path.join(skillDir, 'implementer-prompt.md'), 'utf8')
const reviewerTemplate = readFileSync(path.join(skillDir, 'task-reviewer-prompt.md'), 'utf8')

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
async function run({ args, canned = {}, nullLabels = new Set(), nullAll = false, timeoutMs = 15000 }) {
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
        if (label === 'read-ledger:finish') return { text: '' }
        if (label === 'ledger-append:metrics') return { appended: true }
        if (label === 'reconcile-buckets') return { closed: [] }
        if (label === 'sweep') return 'abc1234 — 1 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: <project test command>'
        if (label === 'ledger-append:sweep') return { appended: true }
        if (label.startsWith('ledger:')) return { appended: true }   // a task's batched ledger flush
        throw new Error(`no canned answer for label ${label}`)
      }
      let v = canned[label]
      if (Array.isArray(v)) v = v[Math.min(counts[label] - 1, v.length - 1)]
      return typeof v === 'function' ? await v({ waitFor, counts, trace }) : v
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
      scriptFn(args, agent, m => logs.push(m), () => {}, pipeline, parallel, budget, workflow),
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
function taskLedgerLines(trace, id, { retry = false } = {}) {
  const label = retry ? `ledger:${id}:retry` : `ledger:${id}`
  return trace.filter(t => t.label === label).flatMap(t => extractLedgerLines(t.prompt))
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
    'read-ledger': { text: '' },
    'ledger-append:launch': { appended: true },
    'ledger-append:detector': { appended: true },
    'edge-audit:1': { openLeaves: 0, depth: 1, suspectEdges: [], summary: 'stub audit' },
    'edge-audit:2': { openLeaves: 0, depth: 1, suspectEdges: [], summary: 'stub audit' },
    'edge-audit:3': { openLeaves: 0, depth: 1, suspectEdges: [], summary: 'stub audit' },
    'ledger-append:edge-audit:1': { appended: true },
    'ledger-append:edge-audit:2': { appended: true },
    'ledger-append:edge-audit:3': { appended: true },
    'close-epics': { rootClosed: false, closedThisRun: [] },
    'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
    'bd-ready-topup': { ids: [] },
    'bd-ready-recheck': { ids: [] },
    'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }] },
    'brief:bd-101': { id: 'bd-101', n: 1, status: 'BRIEFED', files: ['src/a.js'], branch: 'x', base: SHA('a') },
    'impl:bd-101': { id: 'bd-101', status: 'IMPLEMENTED', files: ['src/a.js'] },
    'review:bd-101': { id: 'bd-101', status: 'CLEAN' },
    'fix:bd-101': { id: 'bd-101', status: 'FIXED', head: SHA('f') },
    'merge:bd-101': { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, head: SHA('b'), mergeBase: SHA('a'), rebaseConflictFiles: 0 },
    'read-ledger:finish': { text: '' },
    'ledger-append:metrics': { appended: true },
    'final-review': 'looks fine',
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

  // ===== 0. template-literal span accounting =====
  scenario('template-literal spans: scanner clean, count matches recorded baseline')
  {
    const scan = scanTemplateSpans(scriptBody)
    check(scan.clean, 'scanner ends in code state (no unterminated literal, string, or ${})')
    check(scan.spans.length === 285,
      `top-level template-literal count matches recorded baseline (got ${scan.spans.length}, baseline 285 — 215 after the D4 loop rewrite, +10 for the merge-evidence contract (clean-check and merge steps, mergeEvidence's diagnoses and logs, the Merge-cleanup line) and writeFence(), +17 for the failing-mergeCheck seam route (the check-fix and fix-review dispatch keys/labels, their logs and blocker findings, the re-merge, fixPrompt's check branch, checkFixReviewPrompt), +2 for mergeCheck's two check-step branches, +2 for deferSweep's log line and final-review wording, −1 when the tree walk/ready/close-epics builders became script echoes (5 literals out, 4 in), +1 for dispatch()'s SCRIPT FAILURE log, −7 for batched ledger writes (per-line ledger keys and labels out, the per-task flush key, the merge agent's LEDGER step and its line templates, the runtime-slot logs, the per-site null-merge logs and the background edge audit in), +46 for early unblock and graph readiness (the split/reopen/discard dispatch keys, labels, prompts and logs, the cancel and graph-dispatch logs, the stacked/re-entry brief and implementer wording, the stacked rebase and review-bead close, the held-back and re-entry logs, the reconcile split note, the detector and Metrics fields, the resume note); update it only alongside an edit that deliberately adds or removes a template literal) — a changed count without a deliberate literal add/remove is the backtick-in-prose trap`)
    // self-test: inject a raw backtick mid-way through the first literal's content and assert
    // the detector actually fires — a detector that cannot catch the known failure is decoration
    const [s, e] = scan.spans[0]
    const mid = Math.floor((s + e) / 2)
    const mutated = scriptBody.slice(0, mid) + '`' + scriptBody.slice(mid)
    const rescan = scanTemplateSpans(mutated)
    check(!rescan.clean || rescan.spans.length !== scan.spans.length,
      'injected raw backtick is detected (span count shifts or scan ends dirty)')
  }

  // ===== 1. The three recorded dryRun scenarios, replayed offline =====
  const jsonBlocks = extractJsonBlocks()
  check(jsonBlocks.length === 3, `doc carries exactly 3 dryRun args blocks (found ${jsonBlocks.length})`)
  const [canonicalArgs, fixBlockedArgs, parkedArgs] = jsonBlocks

  scenario('dryRun replay: canonical four-task scenario')
  {
    const out = await run({ args: canonicalArgs })
    assertNoThrow(out)
    check(out.trace.length === 48, `48 agent dispatches (got ${out.trace.length}) — the doc's "Expected dispatch count" arithmetic`)
    const r = out.result
    check(r && JSON.stringify([...r.completed].sort()) === '["bd-101","bd-102","bd-105"]', 'completed = [bd-101, bd-102, bd-105]', JSON.stringify(r?.completed))
    check(r && JSON.stringify([...r.escalated].sort()) === '["bd-103","bd-104"]', 'escalated = [bd-103, bd-104] — bd-104 spent its one retry same-round and bounced', JSON.stringify(r?.escalated))
    check(r && r.pendingRetry.length === 0 && r.parked.length === 0 && r.stalled === false, 'pendingRetry and parked empty, stalled false', JSON.stringify(r))
    check(r && r.stopReason === 'ready-drained', "stopReason = 'ready-drained'", r?.stopReason)
    check(!out.trace.some(t => ['review:bd-104', 'fix:bd-104', 'merge:bd-104'].includes(t.label)), 'bd-104 never reviewed, fixed, or merged (implementer BLOCKED guard held)')
    check(out.counts['fix:bd-101'] === 1 && !out.trace.some(t => /^fix:bd-10[234]$/.test(t.label)), 'exactly one fix pass, for bd-101 only')
    check(!out.trace.some(t => /re-review|adjudicate|breaker/.test(t.label)), 'no re-review, adjudicator, or breaker dispatch exists')
    check(out.counts['ledger:bd-101'] === 1, "bd-101's fix-pass line and minors go out in ONE flush (its merge agent wrote the Merge: and completion lines)")
    check(!out.counts['ledger:bd-102'], 'bd-102 needs no ledger dispatch: its merge agent wrote both success lines')
    check(out.counts['ledger:bd-103'] === 1, "bd-103's failed Merge: line and BLOCKED line go out in one flush")
    check(out.counts['ledger:bd-104'] === 2, 'bd-104 flushes once per chain: pending retry, then BLOCKED')
    check(!out.trace.some(t => /^ledger-append:(merge|fix-pass|bd-)|^ledger-minor:/.test(t.label)), 'no per-line ledger dispatch remains')
    {
      const at = label => out.trace.findIndex(t => t.label === label)
      check(out.counts['review-bead:bd-102'] === 1 && !out.trace.some(t => /^review-bead:bd-10[1345]$/.test(t.label)), 'only bd-102, the one task with an open dependent, is split')
      check(at('brief:bd-105') > at('impl:bd-102') && at('brief:bd-105') < at('merge:bd-102'), 'bd-105 dispatches at bd-102\'s implementation, before bd-102 merges (early unblock)')
      check(at('merge:bd-105') > at('merge:bd-102'), 'bd-105 merges only after its stack parent bd-102 merged')
      check(!out.counts['bd-ready-topup'], 'graph mode: no bd-ready-topup dispatch (readiness computed from the deps rows)', JSON.stringify(out.counts['bd-ready-topup']))
      check(out.counts['ledger:bd-105'] === 1, "bd-105's stacked-on line goes out in its one flush")
      check(out.maxOpen.merge === 1, 'single-flight merge held')
    }
    check(out.counts['sweep'] === 1 && out.counts['ledger-append:metrics'] === 1 && out.counts['final-review'] === 1, 'sweep, one Metrics append, and the final review each dispatch once')
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('sweep') < idx('read-ledger:finish') && idx('ledger-append:metrics') < idx('final-review'), 'sweep precedes Metrics, Metrics precedes the final review')
    check(r?.sweep?.includes('not in this measurement') && r.sweep.includes('bd-103') && r.sweep.includes('bd-104'), 'sweep summary names the escalated leaves as unswept', r?.sweep)
    assertBucketsDisjoint(r)
  }

  scenario('dryRun replay: fix-pass-blocked scenario')
  {
    const out = await run({ args: fixBlockedArgs })
    assertNoThrow(out)
    check(out.trace.length === 18, `18 agent dispatches (got ${out.trace.length})`)
    const r = out.result
    check(r && r.completed.length === 0 && JSON.stringify(r.escalated) === '["bd-201"]' && r.pendingRetry.length === 0 && r.parked.length === 0, 'completed empty, escalated = [bd-201]', JSON.stringify(r))
    check(r && r.review === 'no work landed' && r.sweep === null, "review = 'no work landed', no sweep", JSON.stringify({ review: r?.review, sweep: r?.sweep }))
    check(out.counts['fix:bd-201'] === 1, 'exactly one fix pass')
    check(!out.trace.some(t => ['merge:bd-201', 'sweep', 'final-review', 'missing-blocker:bd-201'].includes(t.label)), 'no merge, sweep, final review, or missing-bead fallback (the fixer filed its bead)')
    check(out.counts['triage:bd-201'] === 1, 'the fixer\'s BLOCKED took the ordinary triage path')
    assertBucketsDisjoint(r)
  }

  scenario('dryRun replay: parked scenario')
  {
    const out = await run({ args: parkedArgs })
    assertNoThrow(out)
    check(out.trace.length === 20, `20 agent dispatches (got ${out.trace.length})`)
    const r = out.result
    check(r && JSON.stringify(r.completed) === '["bd-301"]' && JSON.stringify(r.parked) === '["bd-301"]', 'bd-301 completed AND parked', JSON.stringify(r))
    check(!out.trace.some(t => /^(triage|notify|missing-blocker|unplanned-blocker):/.test(t.label)), 'a declined finding never reaches the blocker path')
    check(out.logs.some(l => l.includes('Parked (merged with fix-pass-declined findings): 1')), 'Finish log counts the parked task')
    assertBucketsDisjoint(r)
  }

  // ===== 2. live-sim: real prompt builders run; assert the text plumbing =====
  scenario('live-sim: file plumbing, absolute template paths, query/filing text reach real dispatches')
  {
    const canned = oneTaskCanned({
      'bd-ready': [{ ids: ['bd-101', 'bd-104'] }, { ids: [] }],
      'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }, { n: 4, id: 'bd-104', files: ['src/c.js'] }] },
      'brief:bd-104': { id: 'bd-104', n: 4, status: 'BRIEFED', files: ['src/c.js'], branch: 'x', base: SHA('d') },
      'impl:bd-101': { id: 'bd-101', status: 'IMPLEMENTED', files: ['src/a.js'], head: SHA('c') },
      'impl:bd-104': { id: 'bd-104', status: 'BLOCKED', files: ['src/c.js'], blockerBead: 'bd-109' },
      'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'missing null check at src/a.js:42', minors: ['name x is uninformative'] },
      'fix:bd-101': { id: 'bd-101', status: 'FIXED', head: SHA('f') },
      'triage:bd-104': { decision: 'RESOLVE', detail: 'name the constant' },
      'clarify:bd-104': { recorded: true },
      'notify:bd-104': { sent: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const TPL = `${SKILLS}/super-code`
    const SDD = `${SKILLS}/subagent-driven-development/scripts`

    const ready = promptOf(out.trace, 'bd-ready')
    check(ready?.includes(`bash ${TPL}/scripts/ready-in-tree bd-100`) && ready?.includes('JQ_UNAVAILABLE:'), 'bd-ready prompt echoes the shipped ready-in-tree script by absolute path, with the no-jq fallback line', ready)
    check(!/bd ready --/.test(ready ?? '') && !/IN-TREE/.test(ready ?? ''), 'bd-ready prompt leaves the query and the tree filter to the script', ready)

    const plan = promptOf(out.trace, 'plan')
    check(/ABSOLUTE path/.test(plan ?? '') && plan?.includes(`${TPL}/planner-prompt.md`) && plan?.includes(`bash ${SDD}/sdd-workspace`), 'plan prompt names the planner template and sdd-workspace by absolute path and requires an absolute planPath', plan)

    const brief = promptOf(out.trace, 'brief:bd-101')
    check(brief?.includes(`bash ${SDD}/task-brief ${PLANPATH} 1 ${PLANDIR}/task-1-brief.md`), 'brief prompt runs task-brief by absolute path with an explicit integration-workspace OUTFILE', brief)

    const impl = promptOf(out.trace, 'impl:bd-101')
    check(impl?.includes(`${TPL}/implementer-prompt.md`) && /"Your job"/.test(impl ?? ''), 'implement prompt names the implementer template by absolute path', impl)
    for (const [param, val] of [['BRIEF_FILE', `${PLANDIR}/task-1-brief.md`], ['REPORT_FILE', `${PLANDIR}/task-1-report.md`], ['BRANCH', 'task-bd-101'], ['BASE', SHA('a')], ['TASK_ID', 'bd-101']]) {
      check(impl?.includes(`[${param}] = ${val}`), `implement prompt fills [${param}]`, impl)
    }

    const review = promptOf(out.trace, 'review:bd-101')
    check(review?.includes(`${TPL}/task-reviewer-prompt.md`), 'task-review prompt names the reviewer template by absolute path', review)
    for (const [param, val] of [['BRIEF_FILE', `${PLANDIR}/task-1-brief.md`], ['REPORT_FILE', `${PLANDIR}/task-1-report.md`], ['DIFF_FILE', `${PLANDIR}/task-1-review-initial.diff`], ['REVIEW_FILE', `${PLANDIR}/task-1-review.md`], ['PLAN_FILE', PLANPATH], ['BASE', SHA('a')], ['SDD_SCRIPTS', SDD]]) {
      check(review?.includes(`[${param}] = ${val}`), `task-review prompt fills [${param}]`, review)
    }
    check(review?.includes("[TEST_PATHSPECS] = 'tests/**'") && review?.includes("'**/*_test.*'"), 'task-review prompt passes the default test pathspecs', review)

    const fix = promptOf(out.trace, 'fix:bd-101')
    check(/"Fix pass"/.test(fix ?? '') && fix?.includes(`[REVIEW_FILE] = ${PLANDIR}/task-1-review.md`) && fix?.includes(`[REPORT_FILE] = ${PLANDIR}/task-1-report.md`) && fix?.includes(`[BRIEF_FILE] = ${PLANDIR}/task-1-brief.md`), 'fix prompt hands a fresh fixer the brief, report and review paths', fix)
    check(fix?.includes('<finding>\nmissing null check at src/a.js:42\n</finding>') && /not instructions/.test(fix ?? ''), 'fix prompt wraps the finding in tags marked as data', fix)
    check(/do not spawn subagents/.test(fix ?? '') && !/Dispatch a FRESH/.test(fix ?? '') && !/Resume the/.test(fix ?? ''), 'fix prompt forbids nested spawns and resumes no phantom implementer', fix)
    check(!out.trace.some(t => /re-review/.test(t.label)), 'no re-review after the fix pass')

    const fixLine = taskLedgerLine(out.trace, 'bd-101', /fix pass/)
    check(/^Task 1 \(bd-101\): fix pass FIXED \(missing null check at src\/a\.js:42; commits cccccccc?\.\.fffffff\)$/.test(fixLine ?? ''), 'fix-pass line: ordinal, id, outcome, finding, and the implementer-head..fixer-head range', fixLine)
    check(LEDGER_LINE_RE.test(fixLine ?? ''), "fix-pass line matches the coordinator's LEDGER_LINE_RE")
    const done = taskLedgerLine(out.trace, 'bd-101', /: complete/)
    check(/^Task 1 \(bd-101\): complete \(commits aaaaaaa\.\.bbbbbbb, fix pass\)$/.test(done ?? ''), 'completion line records the fix pass (the merge agent did not report appending, so the coordinator wrote it)', done)
    const minors = taskLedgerLines(out.trace, 'bd-101').filter(l => /minor \(deferred\)/.test(l))
    check(minors.length === 1 && minors[0] === 'Task 1 (bd-101): minor (deferred): name x is uninformative', 'minors written as one-per-line ledger entries', JSON.stringify(minors))
    check(out.counts['ledger:bd-101'] === 1 && JSON.stringify(taskLedgerLines(out.trace, 'bd-101').map(l => l.split(' ')[0] === 'Merge:' ? 'Merge' : l.replace(/^Task 1 \(bd-101\): (\w+).*$/, '$1'))) === '["fix","Merge","complete","minor"]',
      "bd-101's lines go out in ONE flush, in order: fix pass, Merge:, completion, minor", JSON.stringify(taskLedgerLines(out.trace, 'bd-101')))

    const merge = promptOf(out.trace, 'merge:bd-101')
    check(/Run no tests in this dispatch/.test(merge ?? '') && !/project test command/.test(merge ?? ''), 'merge dispatch runs no tests (no per-merge gate)', merge)
    check(merge?.includes('rebase `task-bd-101`') && merge?.includes('git merge --no-ff --no-commit task-bd-101'), 'merge dispatch rebases and merges the task BRANCH ref, not the worktree path', merge)
    check(/resolves the conflicted hunks only/.test(merge ?? '') && /do not run, add, delete, skip, or loosen any test/.test(merge ?? ''), 'merge dispatch fences conflict resolution to the conflicted hunks', merge)

    check(promptOf(out.trace, 'missing-blocker:bd-104') === null, 'self-filed bead present, so no missing-blocker fallback fired')
    check(/ONLY the `blocker` label/.test(implementerTemplate) && /no `--parent`/.test(implementerTemplate), 'implementer template\'s self-filing instruction is label-only')

    // No dispatch string points at a relative template or a bare `scripts/` path the agent's cwd
    // would resolve into the project.
    const relative = out.trace.filter(t => /\.\/(planner|triage|implementer|task-reviewer)-prompt\.md|(^|[\s`(])scripts\/(task-brief|review-package|sdd-workspace)/.test(t.prompt))
    check(relative.length === 0, 'no dispatch references a relative template or script path', relative.map(t => t.label).join(', '))
    const internal = out.trace.filter(t => /see "|handleBlocker|runTask|reviewAndFix|integrateOne|issue #\d/.test(t.prompt))
    check(internal.length === 0, 'no dispatch references coordinator-internal names, doc sections, or issue numbers', internal.map(t => t.label).join(', '))

    const r = out.result
    check(JSON.stringify(r?.completed) === '["bd-101"]' && JSON.stringify(r?.escalated) === '["bd-104"]' && r?.pendingRetry.length === 0, 'terminal buckets correct (bd-104 retried same-round and bounced)', JSON.stringify(r))
    assertBucketsDisjoint(r)
  }

  scenario('templates: implementer and reviewer carry the D4 contract')
  {
    check(/COMMIT IS THE LAST STEP/.test(implementerTemplate) && /git status --short/.test(implementerTemplate), 'implementer: commit last, clean tree')
    check(/bd comments \[TASK_ID\]/.test(implementerTemplate), 'implementer: reads recorded clarifications')
    check(/No one can answer questions during this run/.test(implementerTemplate) && !/Ask them now/.test(implementerTemplate) && !/Don't guess/.test(implementerTemplate), 'implementer: unattended default reading, no ask-now / no-guess')
    check(/Do not run the whole suite/.test(implementerTemplate) && /command and output/.test(implementerTemplate), 'implementer: task-relevant tests once, command + output in the report')
    check(/## Fix pass/.test(implementerTemplate) && /smallest change/.test(implementerTemplate) && /Declined/.test(implementerTemplate), 'implementer: fix pass with smallest change and declines')
    check(/You are read-only/.test(reviewerTemplate) && /Don't run tests/.test(reviewerTemplate), 'reviewer: read-only, no test re-run')
    check(/CLEAN when there is no ❌ item and no Critical or Important issue/.test(reviewerTemplate), 'reviewer: one CLEAN/NEEDS_FIX mapping')
    check(reviewerTemplate.indexOf('**Issues:**') < reviewerTemplate.indexOf('**Strengths:**'), 'reviewer: strengths after issues')
  }

  scenario('live-sim: a missing skillsRoot fails the launch on line 1')
  {
    const out = await run({ args: liveArgs({ skillsRoot: undefined }), canned: oneTaskCanned() })
    check(!!out.error && String(out.error).includes('skillsRoot'), 'launch throws naming skillsRoot', String(out.error))
    check(out.trace.length === 0, 'nothing dispatched')
  }

  scenario('live-sim: config.gate and config.models.fixEscalation are ignored with a log line')
  {
    const out = await run({ args: liveArgs({ config: cfg({ gate: 'pytest tests/unit', models: { ...MODELS, fixEscalation: 'opus' } }) }), canned: oneTaskCanned() })
    assertNoThrow(out)
    check(out.logs.some(l => l.startsWith('config.gate is ignored')), 'gate ignored and logged')
    check(out.logs.some(l => l.startsWith('config.models.fixEscalation is ignored')), 'fixEscalation ignored and logged')
    check(!out.trace.some(t => t.label !== 'ledger-append:launch' && t.prompt.includes('pytest tests/unit')), 'the gate command reaches no dispatch (only the Launch record of config)')
  }

  scenario('live-sim: the fix pass declines a plan-mandated finding → merged as parked')
  {
    const canned = oneTaskCanned({
      'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'duplicated constant (plan-mandated)' },
      'fix:bd-101': { id: 'bd-101', status: 'FIXED', head: SHA('f'), declined: 'duplicated constant — the brief requires it' },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const r = out.result
    check(JSON.stringify(r?.completed) === '["bd-101"]' && JSON.stringify(r?.parked) === '["bd-101"]', 'completed and parked', JSON.stringify(r))
    const line = taskLedgerLine(out.trace, 'bd-101', /: complete/)
    check(/^Task 1 \(bd-101\): complete \(commits aaaaaaa\.\.bbbbbbb, fix pass, 1 parked — reason: duplicated constant — the brief requires it — finding: duplicated constant \(plan-mandated\)\)$/.test(line ?? ''), 'parked completion line carries the reason and the finding', line)
    check(out.logs.some(l => l.startsWith('PARKED bd-101')), 'parked merge logged')
    const fr = promptOf(out.trace, 'final-review')
    check(/parked/.test(fr ?? '') && /plan-mandated/.test(fr ?? ''), 'final reviewer is told to triage parked lines, including plan-mandated ones')
    check(!out.trace.some(t => t.label.startsWith('triage:')), 'no blocker path')
    assertBucketsDisjoint(r)
  }

  scenario('live-sim: a fix pass that reports FIXED without a new commit is a diagnosed BLOCKED')
  {
    const canned = oneTaskCanned({
      'impl:bd-101': { id: 'bd-101', status: 'IMPLEMENTED', files: ['src/a.js'], head: SHA('c') },
      'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'missing null check' },
      'fix:bd-101': { id: 'bd-101', status: 'FIXED', head: SHA('c') },   // same head: nothing committed
      'missing-blocker:bd-101': { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-190' },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'fix never committed' },
      'notify:bd-101': { sent: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(!out.trace.some(t => t.label === 'merge:bd-101'), 'never merged unfixed')
    check(/without a new commit/.test(promptOf(out.trace, 'missing-blocker:bd-101') ?? ''), 'the blocker bead carries the coordinator\'s diagnosis', promptOf(out.trace, 'missing-blocker:bd-101'))
    check(/^Task 1 \(bd-101\): fix pass BLOCKED \(/.test(taskLedgerLine(out.trace, 'bd-101', /fix pass/) ?? ''), 'fix-pass line records BLOCKED')
    check(JSON.stringify(out.result?.escalated) === '["bd-101"]', 'escalated', JSON.stringify(out.result))
  }

  scenario('live-sim: a fixer\'s own BLOCKED goes to triage with its bead; an unrecognized review verdict still gets the fix pass')
  {
    const blocked = oneTaskCanned({
      'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'needs a caching decision' },
      'fix:bd-101': { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-210' },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'design decision' },
      'notify:bd-101': { sent: true },
    })
    const out = await run({ args: liveArgs(), canned: blocked })
    assertNoThrow(out)
    check(!out.trace.some(t => t.label === 'missing-blocker:bd-101') && /bd-210/.test(promptOf(out.trace, 'triage:bd-101') ?? ''), 'triage reads the fixer\'s own bead; no fallback filing')
    check(JSON.stringify(out.result?.escalated) === '["bd-101"]' && !out.trace.some(t => t.label === 'merge:bd-101'), 'escalated, never merged')

    const weird = oneTaskCanned({ 'review:bd-101': { id: 'bd-101', status: 'LOOKS_OK_I_THINK' } })
    const out2 = await run({ args: liveArgs(), canned: weird })
    assertNoThrow(out2)
    check(out2.counts['fix:bd-101'] === 1, 'fail closed: an unrecognized verdict gets the fix pass, never a silent merge')
    check(/without finding text/.test(promptOf(out2.trace, 'fix:bd-101') ?? ''), 'the fixer is pointed at the review file when no finding text came back', promptOf(out2.trace, 'fix:bd-101'))
    check(JSON.stringify(out2.result?.completed) === '["bd-101"]', 'merged after the fix pass')
  }

  scenario('live-sim: blocker-filing prompts are label-only and carry the planner\'s missing decision')
  {
    const canned = oneTaskCanned({
      'bd-ready': [{ ids: ['bd-101', 'bd-105'] }, { ids: [] }],
      'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }], unplanned: [{ id: 'bd-105', missingDecision: 'which cache backend' }] },
      'unplanned-blocker:bd-105': { id: 'bd-105', status: 'BLOCKED', blockerBead: 'bd-110' },
      'triage:bd-105': { decision: 'ESCALATE', detail: 'needs a human' },
      'notify:bd-105': { sent: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const unplanned = promptOf(out.trace, 'unplanned-blocker:bd-105')
    check(/ONLY the `blocker` label/.test(unplanned ?? '') && /no `sp:` label/.test(unplanned ?? '') && /no `--parent`/.test(unplanned ?? ''), 'unplanned-blocker filing prompt is label-only', unplanned)
    check(unplanned?.includes('<missing-decision>\nwhich cache backend\n</missing-decision>'), 'the planner\'s missing decision reaches the bead body, tagged', unplanned)
    check(JSON.stringify(out.result?.escalated) === '["bd-105"]', 'unmapped id escalated after ESCALATE triage', JSON.stringify(out.result))
    const triage = promptOf(out.trace, 'triage:bd-105')
    check(triage?.includes(`${SKILLS}/super-code/triage-prompt.md`) && triage?.includes(`bd show ${EPIC} --json`) && triage?.includes(PLANPATH), 'triage prompt: absolute template, the epic as the spec source, the per-epic plan file', triage)
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
    check(promptOf(out.trace, 'read-ledger')?.includes(explicit), 'ledger read runs in the caller-supplied worktree')
    const merge = promptOf(out.trace, 'merge:bd-101')
    check(merge?.includes(`is checked out in ${explicit}.`) && merge?.includes(`in ${explicit}, run \`git merge --no-ff --no-commit task-bd-101\``), 'merge runs in the caller-supplied integration worktree', merge)
    check(merge?.includes(`${explicit}/.worktrees/super-auto-my-slug--task-bd-101`), 'task worktree still follows the collapsed convention, rooted under it', merge)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'run completes normally', JSON.stringify(out.result))
  }

  // ===== 2b. coordinator-owned identities; empty-range distinctions; blocker close; reconciliation =====
  scenario('live-sim: absolute task worktree, pinned branch name, id re-stamp, no reconcile when buckets are clean')
  {
    const explicit = '/somewhere/native-tool/run-worktree'
    const pd = `${explicit}/.superpowers/sdd/${EPIC}-plan`
    const canned = oneTaskCanned({
      'plan': { planPath: `${pd}/${EPIC}-plan.md`, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }] },
      'impl:bd-101': { id: 'task-1', status: 'IMPLEMENTED', files: ['src/a.js'], head: SHA('c') },  // a WRONG echoed id
    })
    const out = await run({ args: liveArgs({ integrationBranch: 'super-auto/my-slug', integrationWorktree: explicit }), canned })
    assertNoThrow(out)
    const brief = promptOf(out.trace, 'brief:bd-101')
    check(brief?.includes(`${explicit}/.worktrees/super-auto-my-slug--task-bd-101`), 'brief names the task worktree as an ABSOLUTE path under the integration worktree', brief)
    check(/the task branch is `task-bd-101`/.test(brief ?? ''), 'brief pins the task branch name', brief)
    check(brief?.includes(`bash ${SKILLS}/super-code/scripts/already-merged super-auto/my-slug task-bd-101`), 'brief runs the shipped already-merged script', brief)
    check(promptOf(out.trace, 'impl:bd-101')?.includes(`[WORKTREE] = ${explicit}/.worktrees/super-auto-my-slug--task-bd-101`), 'implementer gets the same absolute worktree')
    const r = out.result
    check(JSON.stringify(r?.completed) === '["bd-101"]' && !JSON.stringify(r).includes('task-1'), 'buckets carry the dispatched id, never the echoed one', JSON.stringify(r))
    check(!out.trace.some(t => t.label === 'reconcile-buckets'), 'no reconciliation dispatch when escalated/pendingRetry are empty')
  }

  scenario('live-sim: a re-entered task whose branch is already merged closes the bead without implement/review')
  {
    const canned = oneTaskCanned({
      'brief:bd-101': { id: 'bd-101', n: 1, status: 'BRIEFED', files: ['src/a.js'], branch: 'x', base: SHA('a'), alreadyMerged: true },
      'close-only:bd-101': { id: 'bd-101', status: 'CLOSED' },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(!out.trace.some(t => ['impl:bd-101', 'review:bd-101', 'merge:bd-101'].includes(t.label)), 'no implementer, reviewer, or merge dispatched')
    check(/bd close bd-101/.test(promptOf(out.trace, 'close-only:bd-101') ?? ''), 'close-only dispatch closes the task bead')
    check(/^Task 1 \(bd-101\): complete \(already merged/.test(taskLedgerLine(out.trace, 'bd-101', /complete/) ?? ''), 'ledger records an already-merged completion line')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && out.result?.escalated.length === 0, 'lands in completed, never escalated', JSON.stringify(out.result))
  }

  scenario('live-sim: an implementer that did not commit is nudged once, then reviewed; twice uncommitted is a diagnosed BLOCKED')
  {
    const nudged = oneTaskCanned({
      'impl:bd-101': { id: 'bd-101', status: 'IMPLEMENTED', files: ['src/a.js'], head: SHA('a') },  // head == base
      'commit-nudge:bd-101': { id: 'bd-101', status: 'IMPLEMENTED', files: ['src/a.js'], head: SHA('c') },
    })
    const out = await run({ args: liveArgs(), canned: nudged })
    assertNoThrow(out)
    const nudge = promptOf(out.trace, 'commit-nudge:bd-101')
    check(/nothing has been committed/.test(nudge ?? '') && nudge?.includes(SHA('a')) && /Files changed/.test(nudge ?? ''), 'commit-nudge names the uncommitted state, the base, and the report\'s file list', nudge)
    check(out.trace.some(t => t.label === 'review:bd-101') && JSON.stringify(out.result?.completed) === '["bd-101"]', 'nudged task is reviewed and completes')

    const stillUncommitted = oneTaskCanned({
      'impl:bd-101': { id: 'bd-101', status: 'IMPLEMENTED', files: ['src/a.js'], head: SHA('a') },
      'commit-nudge:bd-101': { id: 'bd-101', status: 'IMPLEMENTED', files: ['src/a.js'], head: SHA('a') },
      'missing-blocker:bd-101': { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-190' },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'no commit on the task branch' },
      'notify:bd-101': { sent: true },
    })
    const out2 = await run({ args: liveArgs(), canned: stillUncommitted })
    assertNoThrow(out2)
    check(!out2.trace.some(t => t.label === 'review:bd-101'), 'no review dispatched against an empty range')
    check(/no commit/.test(promptOf(out2.trace, 'missing-blocker:bd-101') ?? ''), 'the blocker filing names the diagnosed cause')
    check(JSON.stringify(out2.result?.escalated) === '["bd-101"]', 'escalated with a precise cause', JSON.stringify(out2.result))
  }

  scenario('live-sim: a RESOLVEd blocker bead is closed by the merge that lands the retry')
  {
    const canned = oneTaskCanned({
      'impl:bd-101': [{ id: 'bd-101', status: 'BLOCKED', files: ['src/a.js'], blockerBead: 'bd-109' }, { id: 'bd-101', status: 'IMPLEMENTED', files: ['src/a.js'], head: SHA('c') }],
      'triage:bd-101': { decision: 'RESOLVE', detail: 'the constant is named in the spec' },
      'clarify:bd-101': { recorded: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(/bd close bd-109/.test(promptOf(out.trace, 'merge:bd-101') ?? ''), 'merge dispatch closes the RESOLVEd blocker bead alongside the task bead')
    const clarify = promptOf(out.trace, 'clarify:bd-101')
    check(clarify?.includes('bd comment bd-101 <text>') && clarify?.includes('<clarification>\nthe constant is named in the spec\n</clarification>'), 'clarification written with the exact bd comment the implementer reads back, tagged', clarify)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && out.result?.pendingRetry.length === 0, 'retried task completes and leaves pendingRetry', JSON.stringify(out.result))
  }

  scenario('live-sim: Finish reconciles escalated/pendingRetry against tracker status')
  {
    const canned = oneTaskCanned({
      'bd-ready': [{ ids: ['bd-101', 'bd-104'] }, { ids: [] }],
      'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }, { n: 4, id: 'bd-104', files: ['src/c.js'] }] },
      'brief:bd-104': { id: 'bd-104', n: 4, status: 'BRIEFED', files: ['src/c.js'], branch: 'x', base: SHA('d') },
      'impl:bd-104': { id: 'bd-104', status: 'BLOCKED', files: ['src/c.js'], blockerBead: 'bd-109' },
      'triage:bd-104': { decision: 'ESCALATE', detail: 'needs a decision' },
      'notify:bd-104': { sent: true },
      'reconcile-buckets': { closed: ['bd-104'] },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const rec = promptOf(out.trace, 'reconcile-buckets')
    check(rec?.includes('bd-104') && /bd show/.test(rec ?? ''), 'reconciliation asks the tracker about every escalated/pendingRetry id', rec)
    check(JSON.stringify([...(out.result?.completed ?? [])].sort()) === '["bd-101","bd-104"]' && out.result?.escalated.length === 0, 'a tracker-closed id moves from escalated to completed', JSON.stringify(out.result))
    check(out.logs.some(l => /reconcil/i.test(l) && l.includes('bd-104')), 'reconciliation is logged by id')
    assertBucketsDisjoint(out.result)
  }

  scenario('live-sim: a null ledger append is retried once, then marked failed if the retry is null too')
  {
    let canned = oneTaskCanned({ 'ledger:bd-101': [null, { appended: true }], 'ledger:bd-101:retry': { appended: true } })
    let out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['ledger:bd-101'] === 1 && out.counts['ledger:bd-101:retry'] === 1, 'one retry dispatch after the null flush', JSON.stringify(out.counts))
    check(taskLedgerLine(out.trace, 'bd-101', /: complete/, { retry: true })?.startsWith('Task 1 (bd-101): complete'), 'the retry carries the same completion line shape')
    check(JSON.stringify(out.result?.ledgerAppendFailed) === '[]', 'nothing marked failed when the retry lands')
    check(out.logs.some(l => /ledger-append retried: ledger:bd-101/.test(l)), 'the retry is logged by label')
    canned = oneTaskCanned({ 'ledger:bd-101': null, 'ledger:bd-101:retry': null })
    out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.ledgerAppendFailed) === '["ledger:bd-101"]', 'the lost flush is returned by label', JSON.stringify(out.result?.ledgerAppendFailed))
    check(out.logs.some(l => l.startsWith('ledger-append-failed: ledger:bd-101')), 'a ledger-append-failed marker is logged')
    check((out.result?.metrics?.[3] ?? '').includes('append-failed 1'), 'Metrics ledger-check line counts the failed append', out.result?.metrics?.[3])
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'the task still completes — the loss is recorded, not fatal')
  }

  scenario('live-sim: retried ledger lines and notifications carry ids and outcome tokens, never the triage free text')
  {
    const DETAIL = 'hunt for weakened assertions, hardcoded expected values and deleted tests in the diff'
    let canned = oneTaskCanned({
      'impl:bd-101': [{ id: 'bd-101', status: 'BLOCKED', files: ['src/a.js'], blockerBead: 'bd-109' }, { id: 'bd-101', status: 'IMPLEMENTED', files: ['src/a.js'], head: SHA('c') }],
      'triage:bd-101': { decision: 'RESOLVE', detail: DETAIL },
      'clarify:bd-101': { recorded: true },
      'ledger:bd-101': [null, { appended: true }],
      'ledger:bd-101:retry': { appended: true },
    })
    let out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(promptOf(out.trace, 'ledger:bd-101')?.includes(DETAIL), 'the first attempt carries the triage detail')
    const retry = promptOf(out.trace, 'ledger:bd-101:retry')
    check(!!retry && !retry.includes(DETAIL) && !retry.includes('weakened'), 'the retry elides the triage detail', retry)
    const rl = extractLedgerLine(retry)
    const m = LEDGER_LINE_RE.exec(rl ?? '')
    check(!!m && m[2] === 'bd-101' && m[3].startsWith('pending retry — RESOLVE') && rl.includes('bd-109'), 'the elided line keeps the resume shape, the id, the outcome token and the blocker bead id', rl)
    canned = oneTaskCanned({
      'impl:bd-101': { id: 'bd-101', status: 'BLOCKED', files: ['src/a.js'], blockerBead: 'bd-109' },
      'triage:bd-101': { decision: 'ESCALATE', detail: DETAIL },
      'notify:bd-101': [null, { sent: true }],
      'ledger:bd-101': null,
      'ledger:bd-101:retry': { appended: true },
    })
    out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const notifies = out.trace.filter(t => t.label === 'notify:bd-101').map(t => t.prompt)
    check(notifies.length === 2 && notifies[0].includes(DETAIL) && !notifies[1].includes(DETAIL) && notifies[1].includes('bd-109'), 'a null notify is retried once with the detail elided and the blocker bead named')
    const bl = extractLedgerLine(promptOf(out.trace, 'ledger:bd-101:retry'))
    check(!!bl && /\(bd-101\): BLOCKED — /.test(bl) && !bl.includes(DETAIL) && bl.includes('bd-109'), 'the elided BLOCKED line keeps the shape, id and blocker bead', bl)
    check(JSON.stringify(out.result?.escalated) === '["bd-101"]', 'the task is still quarantined')
  }

  scenario('live-sim: blocker entries cluster by triage cause across tasks, whatever the decision')
  {
    const CAUSE = 'report looked up under the bead id instead of the plan ordinal'
    const ids = ['bd-101', 'bd-102', 'bd-103']
    const canned = oneTaskCanned({
      'bd-ready': [{ ids }, { ids: [] }],
      'plan': { planPath: PLANPATH, mapping: ids.map((id, i) => ({ n: i + 1, id, files: [`src/${i}.js`] })) },
      'notify:bd-103': { sent: true },
      'ledger-recurring:1': { appended: true },
    })
    ids.forEach((id, i) => {
      canned[`brief:${id}`] = { id, n: i + 1, status: 'BRIEFED', files: [`src/${i}.js`], branch: 'x', base: SHA('a') }
      canned[`impl:${id}`] = [{ id, status: 'BLOCKED', files: [`src/${i}.js`], blockerBead: `bd-11${i + 1}` }, { id, status: 'IMPLEMENTED', files: [`src/${i}.js`], head: SHA('c') }]
      canned[`triage:${id}`] = id === 'bd-103'
        ? { decision: 'ESCALATE', detail: `task ${id}: needs a decision`, cause: CAUSE }
        : { decision: 'RESOLVE', detail: `task ${id}: the report is task-${i + 1}-report.md`, cause: CAUSE }
      canned[`clarify:${id}`] = { recorded: true }
      canned[`review:${id}`] = { id, status: 'CLEAN' }
      canned[`merge:${id}`] = { id, merged: true, mergeExit: 0, mergeHead: true, head: SHA('b'), mergeBase: SHA('a'), rebaseConflictFiles: 0 }
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['ledger-recurring:1'] === 1 && !out.counts['ledger-recurring:2'], 'exactly one cluster line, reported once', JSON.stringify(out.counts))
    const line = promptOf(out.trace, 'ledger-recurring:1')
    check(!!line && line.includes('Recurring blocker: ×3 across 3 task(s)') && line.includes(CAUSE), 'the cluster line names the kind, count, spread and root cause', line)
    check(out.logs.some(l => l.startsWith('RECURRING BLOCKER ×3')), 'the cluster is logged')
    check(promptOf(out.trace, 'final-review')?.includes('Recurring blocker:'), 'the final reviewer is told about blocker clusters')
    check(JSON.stringify([...(out.result?.completed ?? [])].sort()) === '["bd-101","bd-102"]' && JSON.stringify(out.result?.escalated) === '["bd-103"]', 'decisions are unchanged by the detector', JSON.stringify(out.result))
  }

  // ===== 3. null-injection scenarios =====
  scenario('null merge, transient: costs a round, completes exactly once, never the blocker path')
  {
    const canned = oneTaskCanned({
      'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-101'] }, { ids: [] }],
      'merge:bd-101': [null, { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, head: SHA('b'), mergeBase: SHA('a') }],
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const completions = taskLedgerLines(out.trace, 'bd-101').filter(l => /: complete/.test(l))
    check(completions.length === 1, `exactly one completion ledger line (got ${completions.length})`)
    check(!out.trace.some(t => /^(triage|missing-blocker|notify):/.test(t.label)), 'null merge never entered the blocker path')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && out.result?.escalated.length === 0 && out.result?.pendingRetry.length === 0, 'task completed exactly once, no other bucket', JSON.stringify(out.result))
    check(out.logs.some(l => l.includes('NULL dispatch: merge:bd-101')), 'swallowed null merge is logged by label')
    check(out.logs.some(l => l.startsWith('merge for bd-101 unavailable (null dispatch) — no merge happened')), 'the merge site logs its own unsettled line')
    check(out.logs.some(l => l.includes('bounded null-retry 1/2')), 'no-progress round with a null took the bounded retry, not the stall')
    assertBucketsDisjoint(out.result)
  }

  // A script-echo dispatch whose script failed returns `scriptError` with placeholder fields; the
  // coordinator must take the null path, never read the placeholders as a result.
  const SE = name => `${name} exited 1; stderr: Error: failed to open database: migration required`
  scenario('script failure on bd-ready, permanent: null path to ready-unavailable, never an empty ready set')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'bd-ready': { ids: [], scriptError: SE('ready-in-tree') } }) })
    assertNoThrow(out)
    check(out.result?.stopReason === 'ready-unavailable', "stopReason = 'ready-unavailable', not 'ready-drained'", out.result?.stopReason)
    check(out.counts['bd-ready'] === 3, `bounded retry exactly as for a null (got ${out.counts['bd-ready']})`)
    check(out.result?.completed.length === 0 && !out.counts['sweep'], 'nothing completed, nothing fabricated')
    check(out.logs.some(l => l.startsWith('SCRIPT FAILURE: bd-ready') && l.includes('ready-in-tree exited 1') && l.includes('migration required')), 'failure logged with script name, exit code and stderr', out.logs.find(l => l.includes('SCRIPT FAILURE')))
    assertBucketsDisjoint(out.result)
  }

  scenario('script failure on bd-ready, transient: one retry then the run proceeds')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'bd-ready': [{ ids: [], scriptError: SE('ready-in-tree') }, { ids: ['bd-101'] }, { ids: [] }] }) })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && out.result?.stopReason === 'ready-drained', 'work lands; drained only after a real empty set', JSON.stringify(out.result))
  }

  scenario('script failure on close-epics: placeholder rootClosed is ignored, closed zero epics')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'close-epics': { rootClosed: true, closedThisRun: ['bd-100'], scriptError: SE('close-in-tree-epics') } }) })
    assertNoThrow(out)
    check(out.result?.stopReason === 'ready-drained', 'run never stopped as root-closed on a failed script', out.result?.stopReason)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'work still lands')
    check(!out.counts['bd-ready-recheck'], 'placeholder closedThisRun triggers no closure re-check')
    check(out.logs.some(l => l.startsWith('SCRIPT FAILURE: close-epics')), 'failure logged')
    assertBucketsDisjoint(out.result)
  }

  scenario('script-echo prompts carry the failure rule')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned() })
    for (const label of ['bd-ready', 'close-epics', 'bd-ready-topup']) {
      const p = promptOf(out.trace, label) ?? ''
      check(p.includes('exits non-zero without printing `JQ_UNAVAILABLE:`') && p.includes('`scriptError`'), `${label} prompt: a non-zero exit is reported as scriptError, never as a result`, p)
    }
  }

  scenario('null bd-ready, permanent: stops as ready-unavailable, never reports completion')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'bd-ready': [null, null, null, null] }) })
    assertNoThrow(out)
    check(out.result?.stopReason === 'ready-unavailable', "stopReason = 'ready-unavailable'", out.result?.stopReason)
    check(out.counts['bd-ready'] === 3, `bounded: exactly 3 ready attempts (got ${out.counts['bd-ready']})`)
    check(out.result?.completed.length === 0 && out.result?.review === 'no work landed' && !out.counts['sweep'], 'nothing completed, no review or sweep fabricated')
    check(out.logs.some(l => l.includes('NOT completion')), 'stop log says this is not completion')
    assertBucketsDisjoint(out.result)
  }

  scenario('null bd-ready, transient: one retry then the run proceeds')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'bd-ready': [null, { ids: ['bd-101'] }, { ids: [] }] }) })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'work still lands after a transient ready outage', JSON.stringify(out.result))
    check(out.result?.stopReason === 'ready-drained', 'drained exit only after a REAL empty ready set', out.result?.stopReason)
  }

  scenario('null close-epics: closed zero epics, never rootClosed')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'close-epics': null }) })
    assertNoThrow(out)
    check(out.result?.stopReason === 'ready-drained', 'run never stopped as root-closed', out.result?.stopReason)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'work still lands under a close-epics outage')
    assertBucketsDisjoint(out.result)
  }

  scenario('null plan, permanent: bounded retry then plan-unavailable')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'bd-ready': { ids: ['bd-101'] }, 'plan': null }) })
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
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && out.counts['merge:bd-101'] === 1, 'completed exactly once, merged only on the recovered round', JSON.stringify(out.result))
    assertBucketsDisjoint(out.result)
  }

  for (const [label, extra] of [
    ['review:bd-101', {}],
    ['fix:bd-101', { 'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'f' } }],
  ]) {
    scenario(`null ${label.split(':')[0]}: not CLEAN, not BLOCKED — no bucket, no merge, no throw`)
    {
      const out = await run({ args: liveArgs(), canned: oneTaskCanned({ ...extra, [label]: null }) })
      assertNoThrow(out)
      const r = out.result
      check(r && r.completed.length === 0 && r.escalated.length === 0 && r.pendingRetry.length === 0, 'task in no terminal bucket', JSON.stringify(r))
      check(!out.trace.some(t => t.label === 'merge:bd-101'), 'never reached the merge gate (a null fix pass never merges unfixed)')
      check(!out.trace.some(t => t.label.startsWith('triage:')), 'never entered the blocker path')
      check(r?.stopReason === 'ready-drained', 'run drained instead of crashing', r?.stopReason)
      assertBucketsDisjoint(r)
    }
  }

  scenario('null triage: unsettled — no quarantine, no burned retry, no ledger line')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'impl:bd-101': { id: 'bd-101', status: 'BLOCKED', files: [], blockerBead: 'bd-109' }, 'triage:bd-101': null }) })
    assertNoThrow(out)
    const r = out.result
    check(r && r.escalated.length === 0 && r.pendingRetry.length === 0, 'neither quarantined nor retry-burned', JSON.stringify(r))
    check(!out.trace.some(t => ['ledger:bd-101', 'notify:bd-101', 'clarify:bd-101'].includes(t.label)), 'no ledger line, neither triage branch executed')
    check(out.logs.some(l => l.includes('unsettled')), 'unsettled state is logged')
    assertBucketsDisjoint(r)
  }

  scenario('null blocker filing: BLOCKED task with no bead is left unsettled, never triaged blind')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'impl:bd-101': { id: 'bd-101', status: 'BLOCKED', files: [] }, 'missing-blocker:bd-101': null }) })
    assertNoThrow(out)
    check(out.trace.some(t => t.label === 'missing-blocker:bd-101') && !out.trace.some(t => t.label === 'triage:bd-101'), 'fallback filing attempted; triage never dispatched against an undefined bead')
    check(out.result?.escalated.length === 0 && out.result?.pendingRetry.length === 0, 'no terminal bucket', JSON.stringify(out.result))
    assertBucketsDisjoint(out.result)
  }

  scenario('null final-review: explicit UNAVAILABLE, never "no findings"')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'final-review': null }) })
    assertNoThrow(out)
    check(typeof out.result?.review === 'string' && out.result.review.includes('FINAL REVIEW UNAVAILABLE'), 'review is the explicit UNAVAILABLE string', out.result?.review)
  }

  scenario('null sweep: explicit SWEEP UNAVAILABLE, never green')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'sweep': null }) })
    assertNoThrow(out)
    check(out.result?.sweep?.startsWith('SWEEP UNAVAILABLE'), 'returned sweep is the explicit UNAVAILABLE string', out.result?.sweep)
    check(promptOf(out.trace, 'final-review')?.includes('SWEEP UNAVAILABLE'), 'the final reviewer reads the unavailable measurement')
  }

  scenario('null read-ledger: resume degrades loudly, run proceeds')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'read-ledger': null }) })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'run proceeds to a normal finish', JSON.stringify(out.result))
    check(out.logs.some(l => l.includes('ledger read unavailable')), 'degraded resume is logged')
  }

  scenario('null read-ledger:finish: Metrics lines say UNAVAILABLE, never zero counts')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'read-ledger:finish': null }) })
    assertNoThrow(out)
    const m = out.result?.metrics ?? []
    check(m.length === 4 && m.every(l => l.startsWith('Metrics: UNAVAILABLE')), 'all four lines are explicit UNAVAILABLE lines', JSON.stringify(m))
    check(JSON.stringify(extractLedgerLines(promptOf(out.trace, 'ledger-append:metrics'))) === JSON.stringify(m), 'the same four lines reach the ledger')
  }

  scenario('ALL dispatches null simultaneously: nothing throws, nothing fabricated')
  {
    const out = await run({ args: liveArgs(), canned: {}, nullAll: true })
    assertNoThrow(out)
    const r = out.result
    check(r && r.completed.length === 0 && r.escalated.length === 0 && r.pendingRetry.length === 0 && r.parked.length === 0, 'all buckets empty', JSON.stringify(r))
    check(r?.stopReason === 'ready-unavailable' && r?.review === 'no work landed' && r?.stalled === false, 'stops as ready-unavailable; no review; not a stall', JSON.stringify(r))
    assertBucketsDisjoint(r)
  }

  scenario('stall guard reachable: resumed-complete id that never closes in bd spins ONE round then stalls')
  {
    const canned = oneTaskCanned({
      'read-ledger': { text: `# SDD ledger — plan: ${EPIC}-plan.md\nTask 1 (bd-101): complete (commits aaaaaaa..bbbbbbb, review clean)` },
      'bd-ready': { ids: ['bd-101'] },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.result?.stalled === true && out.result?.stopReason === 'stalled', 'stall guard fired', JSON.stringify({ stalled: out.result?.stalled, stopReason: out.result?.stopReason }))
    check(out.counts['bd-ready'] === 1, `exactly one spin round before the guard (got ${out.counts['bd-ready']})`)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'resume reconstructed completed from real ledger text')
    check(out.logs.some(l => l.startsWith('STALLED')), 'stall is logged')
    assertBucketsDisjoint(out.result)
  }

  scenario('resume: parked and pending-retry lines reconstruct; fix-pass and minor lines do not')
  {
    const canned = oneTaskCanned({
      'read-ledger': { text: [
        `# SDD ledger — plan: ${EPIC}-plan.md`,
        'Task 1 (bd-101): complete (commits aaaaaaa..bbbbbbb, fix pass, 1 parked — reason: plan-mandated — finding: dup)',
        'Task 2 (bd-102): pending retry — RESOLVE: name the constant',
        'Task 3 (bd-103): fix pass FIXED (null check; commits ccccccc..ddddddd)',
        'Task 3 (bd-103): minor (deferred): naming',
        'Task 4 (bd-104): BLOCKED — needs a decision',
      ].join('\n') },
      'bd-ready': { ids: [] },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const r = out.result
    check(JSON.stringify(r?.completed) === '["bd-101"]' && JSON.stringify(r?.parked) === '["bd-101"]', 'parked completion resumes into completed + parked', JSON.stringify(r))
    check(JSON.stringify(r?.pendingRetry) === '["bd-102"]', 'pending retry resumes into pendingRetry')
    check(!JSON.stringify(r).includes('bd-103') && r?.escalated.length === 0, 'fix-pass/minor lines and a historical BLOCKED gate nothing', JSON.stringify(r))
    check(out.logs.some(l => l.includes('1 previously-BLOCKED id(s)')), 'historical BLOCKED counted in the resume log')
    assertBucketsDisjoint(r)
  }

  // ===== 4. parallelism scenarios =====
  const tick = v => async () => { await new Promise(r => setImmediate(r)); return v }

  function manyTaskCanned(ids, overrides = {}) {
    const c = {
      'read-ledger': { text: '' },
      'ledger-append:launch': { appended: true },
      'ledger-append:detector': { appended: true },
      'edge-audit:1': { openLeaves: 0, depth: 1, suspectEdges: [], summary: 'stub audit' },
      'edge-audit:2': { openLeaves: 0, depth: 1, suspectEdges: [], summary: 'stub audit' },
      'edge-audit:3': { openLeaves: 0, depth: 1, suspectEdges: [], summary: 'stub audit' },
      'ledger-append:edge-audit:1': { appended: true },
      'ledger-append:edge-audit:2': { appended: true },
      'ledger-append:edge-audit:3': { appended: true },
      'close-epics': { rootClosed: false, closedThisRun: [] },
      'bd-ready': [{ ids: [...ids] }, { ids: [] }],
      'bd-ready-topup': { ids: [] },
      'bd-ready-recheck': { ids: [] },
      'plan': { planPath: PLANPATH, mapping: ids.map((id, i) => ({ n: i + 1, id, files: [`src/f${i}.js`] })) },
      'final-review': 'fine',
    }
    for (const id of ids) {
      c[`brief:${id}`] = { id, status: 'BRIEFED', files: [], branch: 'x', base: SHA('a') }
      // implementers and merges yield a tick so genuine concurrency (and a broken single-flight
      // queue) is OBSERVABLE as overlapping in-flight dispatches
      c[`impl:${id}`] = tick({ id, status: 'IMPLEMENTED', files: [] })
      c[`review:${id}`] = { id, status: 'CLEAN' }
      c[`merge:${id}`] = tick({ id, merged: true, mergeExit: 0, mergeHead: true, head: SHA('b'), mergeBase: SHA('a') })
    }
    return { ...c, ...overrides }
  }

  scenario('no round barrier: 12 siblings merge while the 13th still implements (live-incident shape)')
  {
    const ids = Array.from({ length: 13 }, (_, i) => `bd-${101 + i}`)
    const siblings = ids.slice(0, 12)
    const canned = manyTaskCanned(ids, {
      'impl:bd-113': async ctx => { await Promise.all(siblings.map(s => ctx.waitFor(`ledger:${s}`))); return { id: 'bd-113', status: 'IMPLEMENTED', files: [] } },
    })
    const out = await run({ args: liveArgs({ config: cfg({ concurrency: 14 }) }), canned })
    assertNoThrow(out)
    check(out.result?.completed.length === 13, `all 13 completed (got ${out.result?.completed.length})`)
    check(out.maxOpen.merge === 1, `exactly one merge in flight, ever (maxOpen.merge = ${out.maxOpen.merge})`)
    check((out.maxOpen.impl ?? 0) >= 2, `implementers genuinely concurrent (maxOpen.impl = ${out.maxOpen.impl})`)
    check(ids.every(id => out.counts[`merge:${id}`] === 1), 'every task merged exactly once')
    check(out.logs.some(l => /parallelism: 13 ready · topped-up 0 · cap 14 · peak in-flight/.test(l)), 'detector line reports ready/topped-up/cap/peak')
    assertBucketsDisjoint(out.result)
  }

  scenario('sliding window: a straggler does not block later dispatch (no chunk barrier)')
  {
    const ids = ['bd-101', 'bd-102', 'bd-103']
    const canned = manyTaskCanned(ids, { 'impl:bd-101': async ctx => { await ctx.waitFor('ledger:bd-103'); return { id: 'bd-101', status: 'IMPLEMENTED', files: [] } } })
    const out = await run({ args: liveArgs({ config: cfg({ concurrency: 2 }) }), canned })
    assertNoThrow(out)
    check(out.result?.completed.length === 3, `all 3 completed (got ${out.result?.completed.length})`)
    check(out.logs.some(l => /peak in-flight 2/.test(l)), 'peak in-flight equals the cap')
    check(out.maxOpen.merge === 1, 'single-flight merge invariant held')
    assertBucketsDisjoint(out.result)
  }

  scenario('hot-file cap: same-file task waits for the file to drain, disjoint task overtakes')
  {
    const ids = ['bd-101', 'bd-102', 'bd-103']
    const canned = manyTaskCanned(ids, {
      'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }, { n: 2, id: 'bd-102', files: ['src/b.js'] }, { n: 3, id: 'bd-103', files: ['src/a.js'] }] },
      'impl:bd-101': async ctx => { await ctx.waitFor('ledger:bd-102'); return { id: 'bd-101', status: 'IMPLEMENTED', files: [] } },
    })
    const out = await run({ args: liveArgs({ config: cfg({ hotFileCap: 1 }) }), canned })
    assertNoThrow(out)
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('brief:bd-103') > idx('review:bd-101'), 'same-file task waited for the hot file to drain')
    check(idx('brief:bd-102') < idx('review:bd-101'), 'disjoint-file task overtook the hot-file wait')
    check(out.logs.some(l => l.includes('hot-file deferrals: src/a.js')), 'detector names the hot file')
    check(out.result?.completed.length === 3, 'all 3 still completed')
    assertBucketsDisjoint(out.result)
  }

  scenario('unplanned-id filing and triage run beside the implementers — no barrier, never on the merge queue')
  {
    const canned = oneTaskCanned({
      'bd-ready': [{ ids: ['bd-101', 'bd-105'] }, { ids: [] }],
      // a filing barrier before dispatch would deadlock here: the filing waits for the implementer
      'unplanned-blocker:bd-105': async ctx => { await ctx.waitFor('impl:bd-101'); return { id: 'bd-105', status: 'BLOCKED', blockerBead: 'bd-110' } },
      'triage:bd-105': async ctx => { await ctx.waitFor('impl:bd-101'); return { decision: 'ESCALATE', detail: 'needs a human' } },
      'notify:bd-105': { sent: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && JSON.stringify(out.result?.escalated) === '["bd-105"]', 'mapped task completed; unmapped id escalated beside it', JSON.stringify(out.result))
    assertBucketsDisjoint(out.result)
  }

  scenario('blocker triage runs off the merge queue: a merge in flight never holds a triage, and a failed merge releases the queue first')
  {
    const twoTasks = {
      'bd-ready': [{ ids: ['bd-101', 'bd-102'] }, { ids: [] }],
      'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }, { n: 2, id: 'bd-102', files: ['src/b.js'] }] },
      'brief:bd-102': { id: 'bd-102', n: 2, status: 'BRIEFED', files: ['src/b.js'], branch: 'x', base: SHA('d') },
      'review:bd-102': { id: 'bd-102', status: 'CLEAN' },
    }
    // bd-101's merge completes only after bd-102's triage started, and bd-102 blocks only once that
    // merge is in flight: a triage queued behind the merge would deadlock
    let out = await run({ args: liveArgs(), canned: oneTaskCanned({ ...twoTasks,
      'impl:bd-102': async ctx => { await ctx.waitFor('merge:bd-101'); return { id: 'bd-102', status: 'BLOCKED', files: ['src/b.js'], blockerBead: 'bd-109' } },
      'merge:bd-101': async ctx => { await ctx.waitFor('triage:bd-102'); return { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, head: SHA('b'), mergeBase: SHA('a') } },
      'triage:bd-102': { decision: 'ESCALATE', detail: 'needs a human' },
      'notify:bd-102': { sent: true },
    }) })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && JSON.stringify(out.result?.escalated) === '["bd-102"]', 'merge and triage overlapped; both settled', JSON.stringify(out.result))
    // bd-101's merge fails; its triage completes only after bd-102's merge started: a triage still
    // holding the queue would deadlock
    out = await run({ args: liveArgs(), canned: oneTaskCanned({ ...twoTasks,
      'impl:bd-102': async ctx => { await ctx.waitFor('triage:bd-101'); return { id: 'bd-102', status: 'IMPLEMENTED', files: ['src/b.js'] } },
      'merge:bd-101': { id: 'bd-101', merged: false, blockerBead: 'bd-108', rebaseConflictFiles: 2 },
      'triage:bd-101': async ctx => { await ctx.waitFor('merge:bd-102'); return { decision: 'ESCALATE', detail: 'conflict' } },
      'notify:bd-101': { sent: true },
      'merge:bd-102': { id: 'bd-102', merged: true, mergeExit: 0, mergeHead: true, head: SHA('e'), mergeBase: SHA('d') },
    }) })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-102"]' && JSON.stringify(out.result?.escalated) === '["bd-101"]', 'the next merge ran while the failed merge was in triage', JSON.stringify(out.result))
    check(out.maxOpen.merge === 1, 'single-flight held')
    const lines = taskLedgerLines(out.trace, 'bd-101')
    check(lines.length === 2 && /^Merge: bd-101 — .* → blocker$/.test(lines[0]) && /\(bd-101\): BLOCKED — conflict$/.test(lines[1]), "bd-101's failed Merge: line precedes its BLOCKED line, in one flush", JSON.stringify(lines))
    assertBucketsDisjoint(out.result)
  }

  scenario('a blocker burst stays inside the concurrency cap: triage holds the blocked task\'s slot')
  {
    const ids = ['bd-101', 'bd-102', 'bd-103', 'bd-104']
    // implementers and triages share one in-flight counter: both are agents a slot must cover
    let inFlight = 0, peak = 0
    const counted = v => async () => { inFlight++; peak = Math.max(peak, inFlight); await new Promise(r => setImmediate(r)); inFlight--; return v }
    const over = {}
    for (const id of ids) {
      over[`impl:${id}`] = counted({ id, status: 'BLOCKED', files: [], blockerBead: `bead-${id}` })
      over[`triage:${id}`] = counted({ decision: 'ESCALATE', detail: 'x' })
      over[`notify:${id}`] = { sent: true }
    }
    const out = await run({ args: liveArgs({ config: cfg({ concurrency: 2 }) }), canned: manyTaskCanned(ids, over) })
    assertNoThrow(out)
    check(peak <= 2 && (out.maxOpen.triage ?? 0) >= 1, `implementers plus triages never exceed the cap of 2 (peak ${peak})`)
    check(out.result?.escalated.length === 4, 'all four escalated')
  }

  scenario('merge agent writes its own success ledger lines; the coordinator writes only what it must')
  {
    let out = await run({ args: liveArgs(), canned: oneTaskCanned({
      'review:bd-101': { id: 'bd-101', status: 'CLEAN', minors: ['tiny nit'] },
      'merge:bd-101': { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, head: SHA('b'), mergeBase: SHA('a'), rebaseConflictFiles: 0, ledgerAppended: true },
    }) })
    assertNoThrow(out)
    const merge = promptOf(out.trace, 'merge:bd-101') ?? ''
    const tmpl = extractLedgerLines(merge)
    check(JSON.stringify(tmpl) === JSON.stringify(['Merge: bd-101 — rebase <REBASE> · seam-review none · check none', 'Task 1 (bd-101): complete (commits <RANGE>, review clean)']), 'merge prompt hands the agent the Merge: and completion line templates', JSON.stringify(tmpl))
    check(/LEDGER, last, only after the merge is committed/.test(merge) && merge.includes(`${PLANDIR.replace(IW + '/', '')}/progress.md`) && /report ledgerAppended true/.test(merge) && /Merge-cleanup: bd-101/.test(merge), 'the LEDGER step names the ledger path, the cleanup line and the report field', merge)
    const lines = taskLedgerLines(out.trace, 'bd-101')
    check(JSON.stringify(lines) === JSON.stringify(['Task 1 (bd-101): minor (deferred): tiny nit']), 'the coordinator flushes only the minor; no duplicate Merge: or completion line', JSON.stringify(lines))
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'merged')

    out = await run({ args: liveArgs({ config: cfg({ mergeCheck: 'cargo check' }) }), canned: oneTaskCanned({
      'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'dup constant (plan-mandated)' },
      'fix:bd-101': { id: 'bd-101', status: 'FIXED', head: SHA('f'), declined: 'the brief requires it' },
      'merge:bd-101': { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, check: 'pass', head: SHA('b'), mergeBase: SHA('a'), rebaseConflictFiles: 0, ledgerAppended: true },
    }) })
    assertNoThrow(out)
    const ptmpl = extractLedgerLines(promptOf(out.trace, 'merge:bd-101'))
    check(JSON.stringify(ptmpl) === JSON.stringify(['Merge: bd-101 — rebase <REBASE> · seam-review none · check pass']), 'parked task: the agent gets only the Merge: template (check pass with a declared check); the completion line carries fixer free text', JSON.stringify(ptmpl))
    check(/1 parked — reason: the brief requires it — finding: dup constant/.test(taskLedgerLine(out.trace, 'bd-101', /: complete/) ?? ''), 'the coordinator writes the parked completion line')

    out = await run({ args: liveArgs(), canned: oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: false, head: SHA('b'), mergeBase: SHA('a'), ledgerAppended: true },
      'missing-blocker:bd-101': { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-190' },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'no merge' },
      'notify:bd-101': { sent: true },
    }) })
    assertNoThrow(out)
    check(out.logs.some(l => l.startsWith('ledger: the merge agent for bd-101 appended success lines for a merge the coordinator rejected')), 'a rejected merge whose agent claimed the ledger write is logged')
    check(/\(bd-101\): BLOCKED — /.test(taskLedgerLines(out.trace, 'bd-101').at(-1) ?? ''), 'the BLOCKED line follows and supersedes on resume')
  }

  scenario('effort: mechanical dispatches run low, planner/triage/final review high, implementer/reviewer/merge inherit; config.efforts overrides')
  {
    const canned = oneTaskCanned({
      'bd-ready': [{ ids: ['bd-101', 'bd-104'] }, { ids: [] }],
      'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }, { n: 4, id: 'bd-104', files: ['src/c.js'] }] },
      'brief:bd-104': { id: 'bd-104', n: 4, status: 'BRIEFED', files: ['src/c.js'], branch: 'x', base: SHA('d') },
      'impl:bd-104': { id: 'bd-104', status: 'BLOCKED', files: ['src/c.js'], blockerBead: 'bd-109' },
      'triage:bd-104': { decision: 'ESCALATE', detail: 'x' },
      'notify:bd-104': { sent: true },
    })
    let out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const opt = (o, l) => o.trace.find(t => t.label === l)?.opts ?? {}
    for (const l of ['read-ledger', 'bd-ready', 'brief:bd-101', 'ledger:bd-101', 'sweep', 'read-ledger:finish']) check(opt(out, l).effort === 'low' && opt(out, l).model === 'sonnet', `${l}: sonnet at low effort`, JSON.stringify(opt(out, l)))
    for (const l of ['plan', 'triage:bd-104', 'final-review']) check(opt(out, l).effort === 'high', `${l}: high effort`, JSON.stringify(opt(out, l)))
    for (const l of ['impl:bd-101', 'review:bd-101', 'merge:bd-101']) check(!('effort' in opt(out, l)), `${l}: inherits the session effort`, JSON.stringify(opt(out, l)))
    out = await run({ args: liveArgs({ config: cfg({ efforts: { mechanical: 'medium', implementer: 'high' } }) }), canned })
    assertNoThrow(out)
    check(opt(out, 'bd-ready').effort === 'medium' && opt(out, 'impl:bd-101').effort === 'high' && opt(out, 'plan').effort === 'high', 'config.efforts overrides per role; unset roles keep their default', JSON.stringify([opt(out, 'bd-ready'), opt(out, 'impl:bd-101')]))
    const dry = await run({ args: extractJsonBlocks()[0] })
    check(dry.trace.every(t => t.opts.model === 'haiku' && !('effort' in t.opts)), 'dryRun stubs: haiku, no effort override')
  }

  scenario('runtime slots: the cap leaves two runtime slots free; unset slots are logged')
  {
    const ids = Array.from({ length: 8 }, (_, i) => `bd-1${String(i + 1).padStart(2, '0')}`)
    let out = await run({ args: liveArgs({ config: cfg({ concurrency: 16, runtimeSlots: 6 }) }), canned: manyTaskCanned(ids) })
    assertNoThrow(out)
    check(out.logs.some(l => l.startsWith('concurrency cap 16 lowered to 4: 6 runtime slots')), 'cap lowered to runtimeSlots - 2, logged')
    check((out.maxOpen.impl ?? 0) <= 4 && out.logs.some(l => /^parallelism: .* · cap 4 · peak in-flight 4 .*· runtime slots 6/.test(l)), 'never more than 4 chains in flight; the detector reports the slots', out.logs.find(l => l.startsWith('parallelism:')))
    check(out.result?.completed.length === 8, 'all 8 complete')
    out = await run({ args: liveArgs({ config: cfg({ concurrency: 3, runtimeSlots: 14 }) }), canned: manyTaskCanned(ids) })
    check(!out.logs.some(l => l.startsWith('concurrency cap')) && out.logs.some(l => / · cap 3 · /.test(l)), 'a cap already under the slots is kept as configured')
    out = await run({ args: liveArgs(), canned: manyTaskCanned(ids) })
    check(out.logs.some(l => l.startsWith('config.runtimeSlots not set')), 'unset runtimeSlots is logged')
  }

  scenario('dryRun: an unregistered ledger flush key is FATAL at the next drain, never silently lost')
  {
    const args = JSON.parse(JSON.stringify(extractJsonBlocks()[0]))
    delete args.prompts.stubs['ledger:bd-101']
    const out = await run({ args })
    check(!!out.error && String(out.error).includes('no stub for key ledger:bd-101'), 'the queued append\'s throw surfaces', String(out.error))
  }

  // ===== 5. mid-round top-up =====
  scenario('top-up: a bead unblocked by a merge dispatches in the SAME round')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102'], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }], 'bd-ready-topup': { ids: ['bd-101', 'bd-102'] } })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify([...(out.result?.completed ?? [])].sort()) === '["bd-101","bd-102"]', 'both completed', JSON.stringify(out.result))
    check(out.counts['bd-ready'] === 2, `bd-102 did NOT wait for a new round (got ${out.counts['bd-ready']} round queries)`)
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('brief:bd-102') > idx('merge:bd-101'), 'topped-up bead dispatched after the unblocking merge')
    check(out.counts['brief:bd-102'] === 1 && out.counts['brief:bd-101'] === 1, 'no double dispatch despite the top-up re-listing both ids')
    check(out.logs.some(l => l.includes('topped-up 1')), 'detector reports the topped-up count')
    const S = `bash ${SKILLS}/super-code/scripts`
    const close = promptOf(out.trace, 'close-epics')
    check(close?.includes(`${S}/close-in-tree-epics bd-100`) && close?.includes('JQ_UNAVAILABLE:') && !/IN-TREE|--dry-run/.test(close ?? ''), 'close-epics prompt echoes close-in-tree-epics by absolute path; the fixpoint and tree filter live in the script', close)
    const topup = promptOf(out.trace, 'bd-ready-topup') ?? ''
    const ci = topup.indexOf(`${S}/close-in-tree-epics bd-100`), ri = topup.indexOf(`${S}/ready-in-tree bd-100`)
    check(ci !== -1 && ri > ci && topup.includes('JQ_UNAVAILABLE:'), 'top-up prompt runs close-in-tree-epics, then ready-in-tree, with the no-jq fallback line', topup)
    assertBucketsDisjoint(out.result)
  }

  scenario('top-up: null query skips opportunistically, next round recovers')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102'], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: [] }], 'bd-ready-topup': null })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify([...(out.result?.completed ?? [])].sort()) === '["bd-101","bd-102"]', 'both complete across rounds')
    check(out.result?.stopReason === 'ready-drained' && out.logs.some(l => l.includes('skipping this top-up')), 'null top-up logged as opportunistic, never a stopReason')
    assertBucketsDisjoint(out.result)
  }

  scenario('script failure on the top-up: skipped like a null top-up, placeholder ids never dispatched')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102'], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: [] }], 'bd-ready-topup': { ids: ['bd-102'], scriptError: 'close-in-tree-epics exited 1; stderr: Error: failed to open database' } })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['bd-ready'] === 3 && out.logs.some(l => l.includes('skipping this top-up')), 'bd-102 waits for the next round query; the top-up is skipped', JSON.stringify(out.counts))
    check(out.result?.completed.length === 2, 'both still complete')
  }

  scenario('top-up: an unmapped id is skipped (waits for the next planner pass)')
  {
    const out = await run({ args: liveArgs(), canned: manyTaskCanned(['bd-101'], { 'bd-ready-topup': { ids: ['bd-999'] } }) })
    assertNoThrow(out)
    check(!out.trace.some(t => t.label === 'brief:bd-999') && JSON.stringify(out.result?.completed) === '["bd-101"]', 'unmapped id never dispatched; round completes normally')
    assertBucketsDisjoint(out.result)
  }

  scenario('top-up: recursion — a topped-up bead\'s merge tops up the next, bounded by the mapping')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102', 'bd-103'], {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
      'bd-ready-topup': [{ ids: ['bd-102'] }, { ids: ['bd-103'] }, { ids: ['bd-101', 'bd-102', 'bd-103'] }],
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.result?.completed.length === 3 && out.counts['bd-ready'] === 2, 'entire chain drained in one round')
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('brief:bd-102') > idx('merge:bd-101') && idx('brief:bd-103') > idx('merge:bd-102'), 'each link dispatched after its unblocking merge')
    check(out.logs.some(l => l.includes('topped-up 2')) && out.maxOpen.merge === 1, 'detector counts both; single-flight held')
    assertBucketsDisjoint(out.result)
  }

  scenario('top-up: query budget exhausts, degrades to round-boundary refill losing no work')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102', 'bd-103'], {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-103'] }, { ids: [] }],
      'bd-ready-topup': [{ ids: ['bd-102'] }, { ids: ['bd-103'] }],
    })
    const out = await run({ args: liveArgs({ config: cfg({ topUpQueryCap: 1 }) }), canned })
    assertNoThrow(out)
    check(out.result?.completed.length === 3, 'all three completed despite the exhausted budget')
    check(out.counts['bd-ready-topup'] === 2 && out.counts['bd-ready'] === 3, 'one query per round under the per-round cap; bd-103 arrived via the next round')
    check(out.logs.some(l => l.includes('top-up query budget exhausted (1)')) && out.logs.some(l => l.includes('top-up queries 1/1')), 'exhaustion logged; detector reports usage')
    assertBucketsDisjoint(out.result)
  }

  scenario('top-up at scale: 40-bead unblock-two graph drains in ONE round (simulation shape)')
  {
    const ids = Array.from({ length: 40 }, (_, i) => `bd-${101 + i}`)
    const readyNow = counts => ids.filter((id, k) => k === 0 || counts[`merge:${ids[Math.floor((k - 1) / 2)]}`])
    const canned = manyTaskCanned(ids, { 'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }], 'bd-ready-topup': ctx => ({ ids: readyNow(ctx.counts) }) })
    const out = await run({ args: liveArgs({ config: cfg({ concurrency: 14 }) }), canned, timeoutMs: 30000 })
    assertNoThrow(out)
    check(out.result?.completed.length === 40 && out.counts['bd-ready'] === 2, 'all 40 completed in one working round')
    check(out.maxOpen.merge === 1 && ids.every(id => (out.counts[`brief:${id}`] ?? 0) === 1), 'single-flight held; no double dispatch')
    check(out.logs.some(l => l.includes('topped-up 39')), 'detector counts the 39 topped-up beads')
    assertBucketsDisjoint(out.result)
  }

  // ===== 6. round-head parallelism =====
  scenario('planner skip: a refill round with fully-mapped ids dispatches no planner')
  {
    const out = await run({ args: liveArgs(), canned: manyTaskCanned(['bd-101', 'bd-102'], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: [] }] }) })
    assertNoThrow(out)
    check(out.counts['plan'] === 1 && out.logs.some(l => l.includes('already mapped — skipping the planner dispatch')), 'planner dispatched once; skip logged')
    check(out.result?.completed.length === 2, 'both rounds complete their work')
    assertBucketsDisjoint(out.result)
  }

  scenario('Close∥Ready: in-tree closures trigger the ready re-check, epic-dependent task joins the round')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102'], {
      'close-epics': [{ rootClosed: false, closedThisRun: ['bd-090'] }, { rootClosed: false, closedThisRun: [] }],
      'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
      'bd-ready-recheck': { ids: ['bd-101', 'bd-102'] },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['bd-ready-recheck'] === 1 && out.result?.completed.length === 2 && out.counts['bd-ready'] === 2, 're-check fired once; the epic-dependent task completed in round 1')
    assertBucketsDisjoint(out.result)
  }

  scenario('Close∥Ready: null re-check keeps the original ready result (opportunistic)')
  {
    const canned = manyTaskCanned(['bd-101'], { 'close-epics': [{ rootClosed: false, closedThisRun: ['bd-090'] }, { rootClosed: false, closedThisRun: [] }], 'bd-ready-recheck': null })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && out.logs.some(l => l.includes('keeping the original ready result')) && out.result?.stopReason === 'ready-drained', 'round proceeds; null re-check logged; never a stopReason')
    assertBucketsDisjoint(out.result)
  }

  scenario('RESOLVE retry: clarified task completes in the SAME round')
  {
    const canned = manyTaskCanned(['bd-101'], {
      'impl:bd-101': [{ id: 'bd-101', status: 'BLOCKED', files: [], blockerBead: 'bd-109' }, tick({ id: 'bd-101', status: 'IMPLEMENTED', files: [] })],
      'triage:bd-101': { decision: 'RESOLVE', detail: 'use the existing constant' },
      'clarify:bd-101': { recorded: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && out.result?.pendingRetry.length === 0 && out.counts['bd-ready'] === 2, 'completed within the round; pendingRetry cleared')
    check(out.counts['impl:bd-101'] === 2 && out.counts['brief:bd-101'] === 2 && out.counts['triage:bd-101'] === 1, 'retry re-briefed and re-implemented once; allowance spent once')
    check(promptOf(out.trace, 'impl:bd-101')?.includes('[TASK_ID] = bd-101') && /bd comments \[TASK_ID\]/.test(implementerTemplate), 'the implementer reads recorded clarifications (template) for this task id (dispatch)')
    assertBucketsDisjoint(out.result)
  }

  scenario('RESOLVE retry: still-blocked retry bounces to ESCALATE within the round (one-retry bound intact)')
  {
    const canned = manyTaskCanned(['bd-101'], {
      'impl:bd-101': { id: 'bd-101', status: 'BLOCKED', files: [], blockerBead: 'bd-109' },
      'triage:bd-101': { decision: 'RESOLVE', detail: 'try the constant' },
      'clarify:bd-101': { recorded: true },
      'notify:bd-101': { sent: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.escalated) === '["bd-101"]' && out.result?.pendingRetry.length === 0, 'second RESOLVE bounced to quarantine')
    check(out.counts['impl:bd-101'] === 2 && out.counts['bd-ready'] === 2, 'exactly one retry, all within one working round')
    assertBucketsDisjoint(out.result)
  }

  // ===== 7. failure visibility =====
  scenario('dryRun: an unregistered top-up stub key is FATAL (config errors loud where they are cheap)')
  {
    // the parked fixture's mapping carries no deps rows, so its merge falls back to the bd top-up
    const args = JSON.parse(JSON.stringify(parkedArgs))
    delete args.prompts.stubs['bd-ready-topup']
    const out = await run({ args })
    check(!!out.error && String(out.error).includes('no stub for key bd-ready-topup'), 'run fails naming the missing key', String(out.error).slice(0, 200))
  }

  scenario('live run: a failing top-up is swallowed AND logged with the exception, round completes')
  {
    const canned = oneTaskCanned()
    delete canned['bd-ready-topup']
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'the round completed its real work')
    check(out.logs.some(l => l.includes('top-up failed and was swallowed') && l.includes('bd-ready-topup')), 'the swallowed failure is logged with its cause')
    assertBucketsDisjoint(out.result)
  }

  scenario('chain rejection is logged with the exception, never vanished')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102'], {})
    delete canned['brief:bd-102']
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const rejLog = out.logs.find(l => l.includes('chain for bd-102 REJECTED'))
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && !!rejLog && rejLog.includes('no canned answer for label brief:bd-102'), 'sibling completed; dead chain logged with the actual exception', rejLog)
    assertBucketsDisjoint(out.result)
  }

  // ===== 8. review package, minors, permissions, detector, edge audit =====
  scenario('empty review package: INVALID is re-dispatched once, never recorded clean, never fixed')
  {
    const canned = oneTaskCanned({
      'review:bd-101': { id: 'bd-101', status: 'INVALID', finding: 'pwd=/integration; EMPTY RANGE' },
      'review:bd-101:retry': { id: 'bd-101', status: 'CLEAN' },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['review:bd-101'] === 1 && out.counts['review:bd-101:retry'] === 1, 'exactly one fresh re-dispatch of the review')
    check(!out.trace.some(t => t.label.startsWith('fix:bd-101')), 'INVALID never reaches the fix pass')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && out.logs.some(l => l.includes('INVALID') && l.includes('never recorded as clean')), 'merged on the valid retry; invalid package logged')
    check(/INVALID/.test(reviewerTemplate) && /`cd \[WORKTREE\]` first/.test(reviewerTemplate), 'reviewer template pins the working directory and the empty-package rule')
    assertBucketsDisjoint(out.result)
  }

  scenario('empty review package twice: BLOCKED through the blocker path, never merged')
  {
    const inv = { id: 'bd-101', status: 'INVALID', finding: 'EMPTY RANGE' }
    const canned = oneTaskCanned({
      'review:bd-101': inv, 'review:bd-101:retry': inv,
      'missing-blocker:bd-101': { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-900' },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'pipeline defect: empty review package' },
      'notify:bd-101': { sent: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(!out.trace.some(t => t.label === 'merge:bd-101') && JSON.stringify(out.result?.escalated) === '["bd-101"]' && out.counts['triage:bd-101'] === 1, 'never merged; escalated after triage saw the pipeline defect')
    check(/review package invalid twice/.test(promptOf(out.trace, 'missing-blocker:bd-101') ?? ''), 'the bead carries the diagnosed cause')
    assertBucketsDisjoint(out.result)
  }

  scenario('recurring deferred minors: one signature across 3 tasks writes ONE cluster line')
  {
    const ids = ['bd-101', 'bd-102', 'bd-103']
    const canned = manyTaskCanned(ids, {
      'review:bd-101': { id: 'bd-101', status: 'CLEAN', minors: ['review-package resolved HEAD in /wt/integration (104 bytes)'] },
      'review:bd-102': { id: 'bd-102', status: 'CLEAN', minors: ['review-package resolved HEAD in /wt/integration (104 bytes)', 'unrelated nit'] },
      'review:bd-103': { id: 'bd-103', status: 'CLEAN', minors: ['Review-package resolved HEAD in /wt/integration (105 bytes)'] },
      'ledger-recurring:1': { appended: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['ledger-recurring:1'] === 1 && !out.counts['ledger-recurring:2'], 'exactly one cluster line, reported once')
    check(ids.every(id => out.counts[`ledger:${id}`] === 1) && taskLedgerLines(out.trace, 'bd-102').filter(l => /minor \(deferred\)/.test(l)).length === 2, 'one ledger flush per task, one ledger line per minor')
    check(promptOf(out.trace, 'ledger-recurring:1')?.includes('Recurring minor: ×3 across 3 task(s)'), 'cluster line carries count and task spread')
    check(out.logs.some(l => l.startsWith('RECURRING MINOR ×3')), 'cluster is logged loudly')
    check(/triage those first/.test(promptOf(out.trace, 'final-review') ?? ''), 'final reviewer is told to triage clusters first')
    assertBucketsDisjoint(out.result)
  }

  scenario('permission refusal: BLOCKED_AUTH quarantines with no bead, no triage, run continues')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102'], { 'impl:bd-101': { id: 'bd-101', status: 'BLOCKED_AUTH', finding: 'git worktree add .worktrees/x' } })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.escalated) === '["bd-101"]' && JSON.stringify(out.result?.completed) === '["bd-102"]', 'refused task quarantined, sibling completed', JSON.stringify(out.result))
    check(!out.trace.some(t => /^(triage|missing-blocker|notify):/.test(t.label)) && !out.trace.some(t => ['review:bd-101', 'merge:bd-101'].includes(t.label)), 'no bead, triage or notify; never reviewed or merged')
    check(JSON.stringify(out.result?.authRefused) === JSON.stringify([{ id: 'bd-101', refused: 'git worktree add .worktrees/x' }]), 'authRefused returned to the caller')
    check(taskLedgerLine(out.trace, 'bd-101', /BLOCKED-AUTH/)?.includes('(bd-101): BLOCKED-AUTH — permission refused'), 'ledger line starts with BLOCKED')
    check(out.logs.some(l => l.startsWith('AUTH-REFUSED bd-101')), 'logged loudly')
    const impl = promptOf(out.trace, 'impl:bd-101')
    check(!!impl && impl.includes('PERMISSION REFUSALS') && impl.includes('BLOCKED_AUTH') && impl.includes('ONE equivalent form'), 'implementer carries the auth-refusal rule')
    assertBucketsDisjoint(out.result)
  }

  scenario('permission refusal in the fix pass or at the merge takes the same path')
  {
    const fixRefused = oneTaskCanned({
      'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'f' },
      'fix:bd-101': { id: 'bd-101', status: 'BLOCKED_AUTH', finding: 'git commit' },
    })
    const out1 = await run({ args: liveArgs(), canned: fixRefused })
    assertNoThrow(out1)
    check(JSON.stringify(out1.result?.escalated) === '["bd-101"]' && out1.result?.authRefused.length === 1 && !out1.trace.some(t => t.label.startsWith('triage:')), 'fix-pass refusal quarantined, no triage')
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({ 'merge:bd-101': { id: 'bd-101', merged: false, authRefused: 'git merge --no-ff task-bd-101' } }) })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.escalated) === '["bd-101"]' && out.result?.authRefused.length === 1 && !out.trace.some(t => t.label.startsWith('triage:')), 'merge refusal quarantined + recorded, no triage')
    const merge = promptOf(out.trace, 'merge:bd-101')
    check(!!merge && merge.includes('authRefused') && merge.includes('merge-base SHA of the failed attempt'), 'merge prompt maps refusals to authRefused and stamps blockers with the merge-base', merge?.slice(-400))
    assertBucketsDisjoint(out.result)
  }

  scenario('detector persistence: every completed round writes a Detector: ledger line')
  {
    const out = await run({ args: liveArgs(), canned: manyTaskCanned(['bd-101', 'bd-102'], {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: [] }],
      // round 1's detector append completes only once round 2 is dispatching: awaiting it at the
      // round end would deadlock
      'ledger-append:detector': async ctx => { await ctx.waitFor('brief:bd-102'); return { appended: true } },
    }) })
    assertNoThrow(out)
    const d = out.trace.filter(t => t.label === 'ledger-append:detector').map(t => extractLedgerLine(t.prompt))
    check(d.length === 2 && d[0]?.startsWith('Detector: round 1 —') && d[1]?.startsWith('Detector: round 2 —') && d[1].includes('cap 4'), 'one round-stamped detector line per working round', JSON.stringify(d))
    assertBucketsDisjoint(out.result)
  }

  scenario('edge audit: armed by two below-cap rounds, report-only, bounded by edgeAuditCap; width computed in JS')
  {
    const ids = ['bd-101', 'bd-102', 'bd-103', 'bd-104']
    const canned = manyTaskCanned(ids, {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: ['bd-103'] }, { ids: ['bd-104'] }, { ids: [] }],
      // the audit returns only once round 3 is dispatching: awaiting it at the round end would deadlock
      'edge-audit:1': async ctx => { await ctx.waitFor('brief:bd-103'); return { openLeaves: 5, depth: 2, suspectEdges: [{ from: 'bd-104', to: 'bd-103', reason: 'consumer reads nothing the producer writes' }], summary: 'graph-bound' } },
    })
    const out = await run({ args: liveArgs({ config: cfg({ edgeAuditCap: 1 }) }), canned })
    assertNoThrow(out)
    check(out.counts['edge-audit:1'] === 1 && !out.counts['edge-audit:2'], 'one audit, bounded by the cap')
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('edge-audit:1') > idx('merge:bd-102') && idx('edge-audit:1') < idx('brief:bd-103'), 'audit dispatches at the end of round 2, before round 3 dispatches — and round 3 does not wait for it')
    const line = extractLedgerLine(promptOf(out.trace, 'ledger-append:edge-audit:1'))
    check(!!line && line.includes('achievable width 3 vs cap 4') && line.includes('bd-104→bd-103'), 'ledger line carries ceil(5/2)=3 computed in JS and the suspect edge', line)
    const audit = promptOf(out.trace, 'edge-audit:1')
    check(!!audit && audit.includes('READ-ONLY') && audit.includes(`bash ${SKILLS}/super-code/scripts/edge-stats bd-100`) && audit.includes('JQ_UNAVAILABLE:') && audit.includes('bd list --all --json') && !audit.includes('achievableWidth'), 'audit prompt is read-only, takes its numbers from edge-stats, reads edges from the bulk dump, and does not ask for the width', audit)
    check(out.result?.completed.length === 4, 'all four still complete')
    assertBucketsDisjoint(out.result)
  }

  scenario('edge audit: edgeAuditCap 0 disables it; the default never fires on a cap-sized frontier')
  {
    const out = await run({ args: liveArgs({ config: cfg({ edgeAuditCap: 0 }) }), canned: manyTaskCanned(['bd-101', 'bd-102', 'bd-103'], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: ['bd-103'] }, { ids: [] }] }) })
    assertNoThrow(out)
    check(!out.trace.some(t => t.label.startsWith('edge-audit')), 'no audit dispatched with cap 0')
    const out2 = await run({ args: liveArgs({ config: cfg({ concurrency: 1 }) }), canned: manyTaskCanned(['bd-101', 'bd-102'], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: [] }] }) })
    assertNoThrow(out2)
    check(!out2.trace.some(t => t.label.startsWith('edge-audit')), 'frontier == cap every round: streak never arms')
  }

  // ===== 9. tests: none per merge; the mandatory full-suite sweep at Finish =====
  scenario('sweep: mandatory when work landed — declared command exactly, or the project\'s full suite; unswept leaves named')
  {
    const canned = oneTaskCanned({ 'sweep': 'abc1234 — 100 passed, 0 failed, 0 errors, 1 skipped; failing: none; command: nice -n 10 pytest -q' })
    const out = await run({ args: liveArgs({ config: cfg({ sweep: 'nice -n 10 pytest -q' }) }), canned })
    assertNoThrow(out)
    const sweep = promptOf(out.trace, 'sweep')
    check(!!sweep && sweep.includes('EXACTLY this command') && sweep.includes('nice -n 10 pytest -q') && sweep.includes('MEASUREMENT INVALID'), 'sweep prompt carries the exact command and the validity floor')
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('sweep') > idx('merge:bd-101') && idx('sweep') < idx('final-review'), 'sweep runs after the last merge and before the final review')
    check(extractLedgerLine(promptOf(out.trace, 'ledger-append:sweep'))?.startsWith('Sweep: abc1234 — 100 passed'), 'sweep summary lands on the ledger')
    check(promptOf(out.trace, 'final-review')?.includes('<sweep>\nabc1234'), 'final reviewer reads the sweep result, tagged')
    check(out.result?.sweep?.startsWith('abc1234') && !out.result.sweep.includes('not in this measurement'), 'summary returned; no unswept clause when nothing escalated')
    check(!out.trace.some(t => t.label.startsWith('merge:') && /pytest/.test(t.prompt)), 'no test command reaches any merge dispatch')

    const plain = await run({ args: liveArgs(), canned: oneTaskCanned() })
    assertNoThrow(plain)
    const psweep = promptOf(plain.trace, 'sweep')
    check(!!psweep && /FULL test suite/.test(psweep), 'undeclared: the sweep still runs, against the project\'s full test suite', psweep)

    const esc = oneTaskCanned({
      'bd-ready': [{ ids: ['bd-101', 'bd-104'] }, { ids: [] }],
      'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }, { n: 4, id: 'bd-104', files: ['src/c.js'] }] },
      'brief:bd-104': { id: 'bd-104', n: 4, status: 'BRIEFED', files: ['src/c.js'], branch: 'x', base: SHA('d') },
      'impl:bd-104': { id: 'bd-104', status: 'BLOCKED', files: ['src/c.js'], blockerBead: 'bd-109' },
      'triage:bd-104': { decision: 'ESCALATE', detail: 'needs a decision' },
      'notify:bd-104': { sent: true },
    })
    const eo = await run({ args: liveArgs(), canned: esc })
    assertNoThrow(eo)
    check(extractLedgerLine(promptOf(eo.trace, 'ledger-append:sweep'))?.includes('not in this measurement') && eo.result?.sweep?.includes('bd-104') && !eo.result.sweep.includes('bd-101'), 'escalated leaf named as unswept scope, only that id', eo.result?.sweep)
    check(promptOf(eo.trace, 'final-review')?.includes('bd-104'), 'final reviewer is told which leaves the sweep never covered')

    const none = await run({ args: liveArgs(), canned: oneTaskCanned({ 'impl:bd-101': { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-109' }, 'triage:bd-101': { decision: 'ESCALATE', detail: 'x' }, 'notify:bd-101': { sent: true } }) })
    assertNoThrow(none)
    check(!none.trace.some(t => t.label === 'sweep') && none.result?.sweep === null, 'no sweep when no work landed')
  }

  scenario('deferSweep: no sweep dispatch, the final review is told, the return says SWEEP DEFERRED (caller-owned)')
  {
    const out = await run({ args: liveArgs({ deferSweep: true, config: cfg({ sweep: 'nice -n 10 pytest -q' }) }), canned: oneTaskCanned() })
    assertNoThrow(out)
    check(!out.trace.some(t => t.label === 'sweep' || t.label === 'ledger-append:sweep'), 'no sweep and no Sweep: ledger dispatch')
    check(out.result?.sweep === 'SWEEP DEFERRED (caller-owned)', 'return carries the deferred marker', out.result?.sweep)
    const fr = promptOf(out.trace, 'final-review')
    check(/deferred to the caller/.test(fr ?? '') && !/<sweep>/.test(fr ?? ''), 'final reviewer is told the sweep was deferred, not handed a measurement', fr)
    check(extractLedgerLine(promptOf(out.trace, 'ledger-append:launch'))?.includes('"deferSweep":true'), 'the Launch line records deferSweep')
    check(out.logs.some(l => l.includes('SWEEP DEFERRED (caller-owned)')), 'deferral is logged')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'the run otherwise completes normally')
    const plain = await run({ args: liveArgs({ deferSweep: false }), canned: oneTaskCanned() })
    assertNoThrow(plain)
    check(plain.counts['sweep'] === 1, 'deferSweep false keeps the mandatory sweep')
  }

  scenario('config.testPaths: a declared override replaces the defaults; an empty array keeps them')
  {
    const out = await run({ args: liveArgs({ config: cfg({ testPaths: ['pkg/**/*.spec.ts'] }) }), canned: oneTaskCanned() })
    assertNoThrow(out)
    const review = promptOf(out.trace, 'review:bd-101')
    check(review?.includes("[TEST_PATHSPECS] = 'pkg/**/*.spec.ts'") && !review?.includes("'tests/**'"), 'override replaces the defaults in the review dispatch', review)
    const empty = await run({ args: liveArgs({ config: cfg({ testPaths: [] }) }), canned: oneTaskCanned() })
    assertNoThrow(empty)
    check(promptOf(empty.trace, 'review:bd-101')?.includes("'tests/**'") && empty.logs.some(l => l.includes('config.testPaths is an empty array') && l.includes('rejected at pre-flight')), 'an empty array keeps the defaults and logs a rejection')
  }

  scenario('config.testPaths default pathspecs: a real git fixture proves the defaults actually match')
  {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'testpaths-fixture-'))
    try {
      const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 'x', GIT_AUTHOR_EMAIL: 'x@x', GIT_COMMITTER_NAME: 'x', GIT_COMMITTER_EMAIL: 'x@x' } })
      git('init', '-q')
      mkdirSync(path.join(dir, 'tests', 'x'), { recursive: true })
      mkdirSync(path.join(dir, 'src'), { recursive: true })
      writeFileSync(path.join(dir, 'tests', 'x', 'y.sh'), '#!/bin/sh\ntrue\n')
      writeFileSync(path.join(dir, 'src', 'foo_test.go'), 'package src\n')
      writeFileSync(path.join(dir, 'main_test.go'), 'package main\n')
      writeFileSync(path.join(dir, 'README.md'), 'not a test\n')
      git('add', '-A'); git('commit', '-q', '-m', 'add files')
      git('rm', '-q', 'tests/x/y.sh', 'src/foo_test.go', 'main_test.go'); git('commit', '-q', '-m', 'delete files')
      const stat = execFileSync('git', ['diff', '--stat', 'HEAD~1..HEAD', '--', ...defaultTestPathspecsForFixtureTest], { cwd: dir, encoding: 'utf8' })
      check(stat.includes('tests/x/y.sh') && stat.includes('src/foo_test.go') && stat.includes('main_test.go'), 'defaults match nested, nested-suffix, and root-level test files', stat)
      check(!stat.includes('README.md'), 'defaults do not match a non-test file', stat)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }

  // ===== 10. post-rebase seam review (kept under D4: an integration check, not a task review) =====
  scenario('post-rebase seam: overlap → one scoped read-only review → merge re-dispatched seam-cleared')
  {
    const canned = oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: false, seamOverlap: ['src/a.js'], head: SHA('c'), mergeBase: SHA('b') },
      'seam-review:bd-101': { id: 'bd-101', status: 'CLEAN' },
      'merge:bd-101:seam-cleared': { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, head: SHA('c'), mergeBase: SHA('b') },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['seam-review:bd-101'] === 1 && out.counts['merge:bd-101:seam-cleared'] === 1 && !out.counts['fix:bd-101:seam'], 'one seam review, no fix, one seam-cleared merge')
    const seam = promptOf(out.trace, 'seam-review:bd-101')
    check(!!seam && seam.includes('READ-ONLY') && seam.includes('src/a.js') && seam.includes('outside this review') && !seam.includes('already approved'), 'seam review is read-only, scoped, and not primed with the prior approval', seam)
    check(!!seam && seam.includes('TEST CHANGES') && seam.includes(`${SHA('b')}..HEAD`) && /deleted, skipped, loosened, or whose expected values were edited/.test(seam) && /valid only with the command you ran stated/.test(seam), 'seam review carries the Test changes rule over the post-rebase range')
    check(promptOf(out.trace, 'merge:bd-101:seam-cleared')?.includes('ALREADY rebased') && promptOf(out.trace, 'merge:bd-101')?.includes('POST-REBASE SEAM CHECK'), 'first merge carries the seam check; the second skips it')
    check(/^Merge: bd-101 — rebase clean · seam-review cleared · check none$/.test(taskLedgerLine(out.trace, 'bd-101', /^Merge: /) ?? ''), 'Merge: line records seam-review cleared')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && out.maxOpen.merge === 1, 'merged; single-flight held')
    assertBucketsDisjoint(out.result)
  }

  scenario('post-rebase seam: NEEDS_FIX gets exactly one seam fix, then the merge — never a second seam round')
  {
    const canned = oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: false, seamOverlap: ['src/a.js'], head: SHA('c'), mergeBase: SHA('b') },
      'seam-review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'sibling renamed parse() to parseInput()' },
      'fix:bd-101:seam': { id: 'bd-101', status: 'FIXED' },
      'merge:bd-101:seam-cleared': { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, head: SHA('d'), mergeBase: SHA('b') },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['fix:bd-101:seam'] === 1 && out.counts['seam-review:bd-101'] === 1, 'one fix, one review')
    const fix = promptOf(out.trace, 'fix:bd-101:seam')
    check(!!fix && fix.includes('parseInput()') && /post-rebase seam fix/.test(fix) && /Run the tests covering the overlapping files/.test(fix), 'seam fix carries the finding and runs the covering tests')
    check(/seam-review fixed · check none$/.test(taskLedgerLine(out.trace, 'bd-101', /^Merge: /) ?? ''), 'Merge: line records seam-review fixed')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'merged after the fix')
    assertBucketsDisjoint(out.result)
  }

  scenario('post-rebase seam: a seam fix that reports BLOCKED goes to the blocker path, never merged')
  {
    const canned = oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: false, seamOverlap: ['src/a.js'], head: SHA('c'), mergeBase: SHA('b') },
      'seam-review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'incompatible schema' },
      'fix:bd-101:seam': { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-300' },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'schema decision' },
      'notify:bd-101': { sent: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(!out.trace.some(t => t.label === 'merge:bd-101:seam-cleared') && JSON.stringify(out.result?.escalated) === '["bd-101"]', 'no seam-cleared merge; escalated', JSON.stringify(out.result))
    check(/bd-300/.test(promptOf(out.trace, 'triage:bd-101') ?? ''), 'triage reads the seam fixer\'s bead')
  }

  scenario('mergeCheck: a build-only check on the merged tree at every merge — pass, fail → blocker, none')
  {
    const CHECK = 'nice -n 10 cargo check --all-targets'
    const ok = await run({ args: liveArgs({ config: cfg({ mergeCheck: CHECK }) }), canned: oneTaskCanned({ 'merge:bd-101': { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, head: SHA('b'), mergeBase: SHA('a'), rebaseConflictFiles: 0, check: 'pass' } }) })
    assertNoThrow(ok)
    const merge = promptOf(ok.trace, 'merge:bd-101')
    check(!!merge && merge.includes(`EXACTLY this command on the merged tree in .worktrees/${BRANCH}, unchanged: \`${CHECK}\``) && /build only, never tests/.test(merge) && /Run no tests in this dispatch/.test(merge), 'merge dispatch runs the declared build-only check on the merged tree, and no tests', merge)
    check(!!merge && merge.indexOf('POST-REBASE SEAM CHECK') < merge.indexOf('MERGE CHECK') && /git merge --no-ff --no-commit task-bd-101/.test(merge), 'the check runs after the rebase and seam check, on an uncommitted merge')
    check(!!merge && /do not edit any code or test to make it pass/.test(merge) && /git merge --abort/.test(merge), 'a failing check is fenced: no in-place fixes, the merge is aborted')
    check(taskLedgerLine(ok.trace, 'bd-101', /^Merge: /) === 'Merge: bd-101 — rebase clean · seam-review none · check pass', 'Merge: line records check pass')
    check(extractLedgerLine(promptOf(ok.trace, 'ledger-append:launch'))?.includes(`"mergeCheck":"${CHECK}"`), 'the Launch line records the check command')

    const seamed = await run({ args: liveArgs({ config: cfg({ mergeCheck: CHECK }) }), canned: oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: false, seamOverlap: ['src/a.js'], head: SHA('c'), mergeBase: SHA('b') },
      'seam-review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'stale closure signature' },
      'fix:bd-101:seam': { id: 'bd-101', status: 'FIXED' },
      'merge:bd-101:seam-cleared': { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, head: SHA('d'), mergeBase: SHA('b'), check: 'pass' },
    }) })
    assertNoThrow(seamed)
    check(promptOf(seamed.trace, 'merge:bd-101:seam-cleared')?.includes(CHECK), 'the seam-cleared merge re-runs the check after the seam fix')

    // A failing check routes to one merge-check fix + one scoped review, then the check re-runs.
    const ERR = "error[E0061]: this function takes 2 arguments but 1 argument was supplied\n  --> crates/other/tests/provider.rs:41:9"
    const failMerge = { id: 'bd-101', merged: false, mergeExit: 0, mergeHead: true, rebaseConflictFiles: 0, check: 'fail', head: SHA('c'), mergeBase: SHA('b'), checkOutput: `${CHECK}\n${ERR}` }
    const blockerTail = {
      'missing-blocker:bd-101': { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-190' },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'cross-lane compile seam' },
      'notify:bd-101': { sent: true },
    }

    const fixed = await run({ args: liveArgs({ config: cfg({ mergeCheck: CHECK }) }), canned: oneTaskCanned({
      'merge:bd-101': failMerge,
      'fix:bd-101:check': { id: 'bd-101', status: 'FIXED', head: SHA('e') },
      'seam-review:bd-101:check': { id: 'bd-101', status: 'CLEAN' },
      'merge:bd-101:check-fixed': { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, head: SHA('e'), mergeBase: SHA('b'), check: 'pass' },
    }) })
    assertNoThrow(fixed)
    const cfix = promptOf(fixed.trace, 'fix:bd-101:check')
    check(!!cfix && cfix.includes(ERR) && cfix.includes(CHECK) && cfix.includes(`[BRIEF_FILE] = ${PLANDIR}/task-1-brief.md`) && cfix.includes(`[REPORT_FILE] = ${PLANDIR}/task-1-report.md`), 'merge-check fix gets the command, the error output, and the brief/report paths', cfix)
    check(!!cfix && /edit whatever files the errors name/.test(cfix) && /do not delete, skip, or loosen any test assertion/.test(cfix) && /smallest change/.test(cfix), 'merge-check fix is fenced: any named file, smallest change, no weakened tests')
    const crev = promptOf(fixed.trace, 'seam-review:bd-101:check')
    check(!!crev && /READ-ONLY/.test(crev) && crev.includes(`${SHA('c')}..HEAD`) && crev.includes('<build-errors>'), 'one scoped read-only review of the fix diff')
    check(promptOf(fixed.trace, 'merge:bd-101:check-fixed')?.includes(CHECK), 'the check re-runs on the re-dispatched merge')
    check(taskLedgerLine(fixed.trace, 'bd-101', /^Merge: /) === 'Merge: bd-101 — rebase clean · seam-review none · check fail→fixed', 'Merge: line records check fail→fixed')
    check(JSON.stringify(fixed.result?.completed) === '["bd-101"]' && !fixed.trace.some(t => t.label.startsWith('triage:')), 'merged without the blocker path', JSON.stringify(fixed.result))
    check(!/file a blocker bead \(as below\) whose body also carries the command/.test(promptOf(fixed.trace, 'merge:bd-101') ?? '') && /do not file a blocker bead/.test(promptOf(fixed.trace, 'merge:bd-101') ?? ''), 'the merge agent reports the failure instead of filing a bead')

    const fixBlocked = await run({ args: liveArgs({ config: cfg({ mergeCheck: CHECK }) }), canned: oneTaskCanned({
      'merge:bd-101': failMerge,
      'fix:bd-101:check': { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-191' },
      ...blockerTail,
    }) })
    assertNoThrow(fixBlocked)
    check(taskLedgerLine(fixBlocked.trace, 'bd-101', /^Merge: .*→ blocker$/) === 'Merge: bd-101 — rebase clean · seam-review none · check fail → blocker', 'fix BLOCKED: Merge: line records check fail → blocker')
    check(/bd-191/.test(promptOf(fixBlocked.trace, 'triage:bd-101') ?? '') && !fixBlocked.trace.some(t => t.label === 'seam-review:bd-101:check'), 'fix BLOCKED: triage reads the fixer\'s bead; no review')
    check(JSON.stringify(fixBlocked.result?.escalated) === '["bd-101"]', 'fix BLOCKED: escalated')

    const still = await run({ args: liveArgs({ config: cfg({ mergeCheck: CHECK }) }), canned: oneTaskCanned({
      'merge:bd-101': failMerge,
      'fix:bd-101:check': { id: 'bd-101', status: 'FIXED', head: SHA('e') },
      'seam-review:bd-101:check': { id: 'bd-101', status: 'CLEAN' },
      'merge:bd-101:check-fixed': { ...failMerge, checkOutput: `${CHECK}\nerror: still broken` },
      ...blockerTail,
    }) })
    assertNoThrow(still)
    check(taskLedgerLine(still.trace, 'bd-101', /^Merge: .*→ blocker$/)?.endsWith('check fail → blocker'), 'still failing: check fail → blocker')
    check(/still fails after the merge-check fix/.test(promptOf(still.trace, 'missing-blocker:bd-101') ?? '') && still.counts['fix:bd-101:check'] === 1, 'still failing: blocker bead carries the diagnosis; no second fix')
    check(JSON.stringify(still.result?.escalated) === '["bd-101"]', 'still failing: escalated')

    const rejected = await run({ args: liveArgs({ config: cfg({ mergeCheck: CHECK }) }), canned: oneTaskCanned({
      'merge:bd-101': failMerge,
      'fix:bd-101:check': { id: 'bd-101', status: 'FIXED', head: SHA('e') },
      'seam-review:bd-101:check': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'loosened an assertion' },
      ...blockerTail,
    }) })
    assertNoThrow(rejected)
    check(!rejected.trace.some(t => t.label === 'merge:bd-101:check-fixed') && /rejected by its review: loosened an assertion/.test(promptOf(rejected.trace, 'missing-blocker:bd-101') ?? ''), 'review rejects: no re-merge; blocker path with the review finding')

    const spent = await run({ args: liveArgs({ config: cfg({ mergeCheck: CHECK }) }), canned: oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: false, seamOverlap: ['src/a.js'], head: SHA('c'), mergeBase: SHA('b') },
      'seam-review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'renamed parse()' },
      'fix:bd-101:seam': { id: 'bd-101', status: 'FIXED' },
      'merge:bd-101:seam-cleared': failMerge,
      ...blockerTail,
    }) })
    assertNoThrow(spent)
    check(!spent.trace.some(t => t.label === 'fix:bd-101:check'), 'same-file seam fix already used: no merge-check fix')
    check(taskLedgerLine(spent.trace, 'bd-101', /^Merge: .*→ blocker$/) === 'Merge: bd-101 — rebase clean · seam-review fixed · check fail → blocker', 'same-file seam fix already used: seam-review fixed · check fail → blocker')
    check(JSON.stringify(spent.result?.escalated) === '["bd-101"]' && /failed on the merged tree/.test(promptOf(spent.trace, 'missing-blocker:bd-101') ?? ''), 'same-file seam fix already used: straight to the blocker path with the check output')

    const none = await run({ args: liveArgs(), canned: oneTaskCanned({ 'merge:bd-101': { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, head: SHA('b'), mergeBase: SHA('a'), check: 'pass' } }) })
    assertNoThrow(none)
    check(/No merge check is declared/.test(promptOf(none.trace, 'merge:bd-101') ?? '') && !/MERGE CHECK/.test(promptOf(none.trace, 'merge:bd-101') ?? ''), 'undeclared: no check step in the merge dispatch')
    check(taskLedgerLine(none.trace, 'bd-101', /^Merge: /)?.endsWith('· check none'), 'undeclared: the Merge: line says check none, whatever the agent reported')
    check(extractLedgerLine(promptOf(none.trace, 'ledger-append:launch'))?.includes('"mergeCheck":"none (no build/typecheck step declared)"'), 'undeclared: the Launch line says no check runs')
    const explicitNone = await run({ args: liveArgs({ config: cfg({ mergeCheck: 'none' }) }), canned: oneTaskCanned() })
    assertNoThrow(explicitNone)
    check(/No merge check is declared/.test(promptOf(explicitNone.trace, 'merge:bd-101') ?? ''), 'pre-flight\'s explicit "none" (no build step in the project) runs no check')
  }

  scenario('merge evidence: a dirty integration worktree, a refused merge, or no MERGE_HEAD is a merge failure — never check pass')
  {
    const CHECK = 'cargo check --all-targets'
    const tail = {
      'missing-blocker:bd-101': { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-190' },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'merge failure' },
      'notify:bd-101': { sent: true },
    }
    const dirty = await run({ args: liveArgs({ config: cfg({ mergeCheck: CHECK }) }), canned: oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: false, check: 'none', dirty: ['?? evidence/host-recovery-validation/report.md'] }, ...tail }) })
    assertNoThrow(dirty)
    check(JSON.stringify(dirty.result?.escalated) === '["bd-101"]' && !dirty.result?.completed.length, 'dirty worktree: no merge, blocker path', JSON.stringify(dirty.result))
    check(/is dirty/.test(promptOf(dirty.trace, 'missing-blocker:bd-101') ?? '') && (promptOf(dirty.trace, 'missing-blocker:bd-101') ?? '').includes('evidence/host-recovery-validation/report.md'), 'dirty worktree: the bead names the stray paths', promptOf(dirty.trace, 'missing-blocker:bd-101'))
    check(taskLedgerLine(dirty.trace, 'bd-101', /^Merge: .*→ blocker$/)?.endsWith('check none → blocker'), 'dirty worktree: Merge: line says check none → blocker')
    check(!dirty.trace.some(t => t.label === 'fix:bd-101:check'), 'dirty worktree: never routed to a merge-check fix')

    const refused = await run({ args: liveArgs({ config: cfg({ mergeCheck: CHECK }) }), canned: oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: false, mergeExit: 128, mergeHead: false, check: 'none' }, ...tail }) })
    assertNoThrow(refused)
    check(JSON.stringify(refused.result?.escalated) === '["bd-101"]' && /exit 128/.test(promptOf(refused.trace, 'missing-blocker:bd-101') ?? ''), 'merge exit non-zero: failure with the exit code in the diagnosis')

    const lying = await run({ args: liveArgs({ config: cfg({ mergeCheck: CHECK }) }), canned: oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: true, head: SHA('b'), mergeBase: SHA('a'), check: 'pass', mergeExit: 0, mergeHead: false }, ...tail }) })
    assertNoThrow(lying)
    check(!lying.result?.completed.length && JSON.stringify(lying.result?.escalated) === '["bd-101"]', 'no MERGE_HEAD: a reported merged/check pass is rejected (fail closed)', JSON.stringify(lying.result))
    check(/MERGE_HEAD absent/.test(promptOf(lying.trace, 'missing-blocker:bd-101') ?? '') && taskLedgerLine(lying.trace, 'bd-101', /^Merge: .*→ blocker$/)?.endsWith('check none → blocker'), 'no MERGE_HEAD: diagnosis names it; the check result is voided on the ledger')

    const unreported = await run({ args: liveArgs(), canned: oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: true, head: SHA('b'), mergeBase: SHA('a') }, ...tail }) })
    assertNoThrow(unreported)
    check(!unreported.result?.completed.length && /not reported/.test(promptOf(unreported.trace, 'missing-blocker:bd-101') ?? ''), 'merged without any merge evidence: rejected')

    const cleaned = await run({ args: liveArgs(), canned: oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: true, head: SHA('b'), mergeBase: SHA('a'), mergeExit: 0, mergeHead: true, check: 'none', removedIdentical: ['evidence/report.md'] } }) })
    assertNoThrow(cleaned)
    const lines = taskLedgerLines(cleaned.trace, 'bd-101').filter(l => /^Merge/.test(l))
    check(lines.length === 2 && lines[1] === 'Merge-cleanup: bd-101 — removed byte-identical untracked copies from the integration worktree before merging: evidence/report.md', 'identical-copy removals are listed on a Merge-cleanup line', JSON.stringify(lines))
    check(JSON.stringify(cleaned.result?.completed) === '["bd-101"]', 'merged after removing only identical copies')

    const merge = promptOf(cleaned.trace, 'merge:bd-101') ?? ''
    check(/git status --porcelain --untracked-files=all/.test(merge) && /cmp -s/.test(merge) && /Delete nothing else/.test(merge), 'merge prompt: strict clean check; only byte-identical copies may be removed')
    check(/git rev-parse -q --verify MERGE_HEAD/.test(merge) && /do NOT run any check and do NOT commit/.test(merge), 'merge prompt: exit code and MERGE_HEAD gate the check and the commit')
    check(merge.indexOf('PRE-MERGE CLEAN CHECK') < merge.indexOf('MERGE: in') && merge.indexOf('MERGE: in') < merge.indexOf('No merge check is declared'), 'merge prompt order: clean check → merge → check')
  }

  scenario('write fence: task agents write only inside their task worktree (plus named plan-workspace files)')
  {
    const out = await run({ args: liveArgs(), canned: oneTaskCanned({
      'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'f' },
      'merge:bd-101': { id: 'bd-101', merged: false, seamOverlap: ['src/a.js'], head: SHA('c'), mergeBase: SHA('b') },
      'seam-review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'g' },
      'fix:bd-101:seam': { id: 'bd-101', status: 'FIXED' },
      'merge:bd-101:seam-cleared': { id: 'bd-101', merged: true, head: SHA('d'), mergeBase: SHA('b'), mergeExit: 0, mergeHead: true },
    }) })
    assertNoThrow(out)
    const TW = `.worktrees/${BRANCH}/.worktrees/${BRANCH}--task-bd-101`
    for (const label of ['impl:bd-101', 'fix:bd-101', 'fix:bd-101:seam']) {
      const p = promptOf(out.trace, label) ?? ''
      check(p.includes(`WRITE TARGETS: every file you create or change (code, tests, evidence, logs, scratch) goes inside ${TW}`) && p.includes(`The integration worktree .worktrees/${BRANCH} and the user's checkout are READ-ONLY for you`), `${label}: write fence names the task worktree and marks the integration worktree read-only`, p.slice(-500))
    }
    check(/## Where you write/.test(implementerTemplate) && /Never write into the integration worktree or the user's checkout/.test(implementerTemplate) && /This applies to the fix pass too/.test(implementerTemplate), 'implementer template carries the write fence, fix pass included')
    check(/The only files you write are \[DIFF_FILE\]/.test(reviewerTemplate), 'reviewer template limits its writes to the package and review files')
  }

  scenario('Merge: ledger line renders the gate-less shape on both the success and blocker paths')
  {
    const ok = await run({ args: liveArgs(), canned: oneTaskCanned({ 'merge:bd-101': { id: 'bd-101', merged: true, mergeExit: 0, mergeHead: true, head: SHA('b'), mergeBase: SHA('a'), rebaseConflictFiles: 2 } }) })
    assertNoThrow(ok)
    const okLine = taskLedgerLine(ok.trace, 'bd-101', /^Merge: /)
    check(okLine === 'Merge: bd-101 — rebase conflict: 2 files · seam-review none · check none', 'success line: id, conflict count, no seam review, no gate field', okLine)
    const fail = await run({ args: liveArgs(), canned: oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: false, blockerBead: 'bd-108', rebaseConflictFiles: 3 },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'conflict resolution failed' },
      'notify:bd-101': { sent: true },
    }) })
    assertNoThrow(fail)
    const failLine = taskLedgerLine(fail.trace, 'bd-101', /^Merge: .*→ blocker$/)
    check(failLine === 'Merge: bd-101 — rebase conflict: 3 files · seam-review none · check none → blocker', 'failure line ends in → blocker, no gate field', failLine)
    check(JSON.stringify(fail.result?.escalated) === '["bd-101"]', 'the blocked task reaches the ordinary ESCALATE bucket')
  }

  // ===== 11. Finish Metrics =====
  scenario('Metrics: one read-ledger:finish and ONE ledger-append:metrics carrying four lines, before final-review')
  {
    const out = await run({ args: liveArgs(), canned: manyTaskCanned(['bd-101', 'bd-102']) })
    assertNoThrow(out)
    check(out.counts['read-ledger:finish'] === 1 && out.counts['ledger-append:metrics'] === 1, 'exactly one re-read and one Metrics append')
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('ledger-append:metrics') !== -1 && idx('ledger-append:metrics') < idx('final-review'), 'Metrics precede the final review')
    check(extractLedgerLines(promptOf(out.trace, 'ledger-append:metrics')).length === 4, 'four lines in the one dispatch')
    assertBucketsDisjoint(out.result)
  }

  scenario('Metrics arithmetic against a known ledger: merges, completion kinds, fix-pass outcomes, ledger-check')
  {
    const knownLedger = [
      `# SDD ledger — plan: ${EPIC}-plan.md`,
      'Merge: bd-101 — rebase clean · seam-review none · check fail→fixed',
      'Merge: bd-102 — rebase conflict: 3 files · seam-review fixed · check pass',
      'Merge: bd-103 — rebase conflict: 2 files · seam-review cleared · check fail → blocker',
      'Task 1 (bd-101): complete (commits aaaaaaa..bbbbbbb, review clean)',
      'Task 2 (bd-102): fix pass FIXED (finding A; commits ccccccc..ddddddd)',
      'Task 2 (bd-102): complete (commits aaaaaaa..eeeeeee, fix pass)',
      'Task 5 (bd-105): fix pass FIXED (finding B; commits ccccccc..ddddddd)',
      'Task 5 (bd-105): complete (commits aaaaaaa..fffffff, fix pass, 1 parked — reason: plan-mandated — finding: B)',
      'Task 6 (bd-106): fix pass BLOCKED (finding C)',
      'Task 6 (bd-106): fix pass FIXED (finding C; commits ccccccc..ddddddd)',
      'Task 7 (bd-107): complete (already merged into epic-bd-100-integration before this re-entry — bead closed, no new review)',
      'Task 8 (bd-108): minor (deferred): naming',
      'Task 9 (bd-109): stacked on bd-101 (dispatched at implementation-done)',
      'Task 10 (bd-110): cancelled (parent bd-106 blocked)',
      'Detector: round 1 — 2 ready · topped-up 0 · cap 4 · peak in-flight 2 · top-up queries 0/40',
    ].join('\n')
    const out = await run({ args: liveArgs(), canned: manyTaskCanned(['bd-101', 'bd-102'], { 'read-ledger:finish': { text: knownLedger } }) })
    assertNoThrow(out)
    const lines = extractLedgerLines(promptOf(out.trace, 'ledger-append:metrics'))
    check(lines[0] === 'Metrics: merges 2 · merge-failed 1 · rebase-conflicts 2 · seam-reviews 2 (fixed 1) · check-fails 2 (fixed 1)', 'line 1: success-path merges only; conflicts, seam reviews and check failures on both paths', lines[0])
    check(lines[1] === 'Metrics: completions — review clean 1 · after fix pass 2 · parked 1 · re-entry closes 1 · dispatched early 1 · cancelled 1', 'line 2: completion kinds (parked counted within fix pass), early dispatches and cancellations', lines[1])
    check(lines[2] === 'Metrics: fix-pass — entered 4 · FIXED 3 · BLOCKED 1', 'line 3: every fix-pass line counted, a retried task twice', lines[2])
    check(lines[3] === 'Metrics: ledger-check ok · append-failed 0 · append-retried 0', "line 4: M (2) matches this run's completed.size (2)", lines[3])
    check(JSON.stringify(out.result?.metrics) === JSON.stringify(lines), 'the return carries exactly those four lines, in order', JSON.stringify(out.result?.metrics))
  }

  // ===== 12. early unblock and graph readiness =====
  // `graphCanned(rows)`: manyTaskCanned over the given rows, with the planner's deps/opaque columns
  // on the mapping and NO bd-ready-topup answer — in graph mode the top-up must not run.
  function graphCanned(rows, overrides = {}) {
    const ids = rows.map(r => r.id)
    const c = manyTaskCanned(ids, {
      'plan': { planPath: PLANPATH, mapping: rows.map((r, i) => ({ n: i + 1, id: r.id, files: [`src/f${i}.js`], deps: r.deps ?? [], opaque: r.opaque ?? false })) },
      ...overrides,
    })
    if (!('bd-ready-topup' in overrides)) delete c['bd-ready-topup']
    for (const id of ids) {
      if (!(`review-bead:${id}` in c)) c[`review-bead:${id}`] = { reviewBead: `${id}-rv`, implClosed: true, created: true }
      c[`impl:${id}`] = c[`impl:${id}`] ?? tick({ id, status: 'IMPLEMENTED', files: [], head: SHA('c') })
    }
    return c
  }
  const at = (out, label) => out.trace.findIndex(t => t.label === label)
  const lastAt = (out, label) => out.trace.map(t => t.label).lastIndexOf(label)

  scenario('early unblock: a dependent dispatches at its parent\'s implementation, cut on the parent\'s branch, and merges after it')
  {
    const canned = graphCanned([{ id: 'bd-101' }, { id: 'bd-102', deps: ['bd-101'] }], {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
      // the parent's review finishes only once the dependent is already implementing
      'review:bd-101': async ctx => { await ctx.waitFor('impl:bd-102'); return { id: 'bd-101', status: 'CLEAN' } },
      'review-bead:bd-101': { reviewBead: 'bd-150', implClosed: true, created: true },
      'brief:bd-102': { id: 'bd-102', status: 'BRIEFED', files: [], branch: 'x', base: SHA('e'), stacked: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify([...(out.result?.completed ?? [])].sort()) === '["bd-101","bd-102"]', 'both completed in one working round', JSON.stringify(out.result))
    check(out.counts['bd-ready'] === 2 && !out.counts['bd-ready-topup'], 'no bd-ready-topup: the dependent came from the graph', JSON.stringify(out.counts))
    check(out.counts['review-bead:bd-101'] === 1 && !out.counts['review-bead:bd-102'], 'the parent (it has a dependent) is split once; the leaf dependent is not')
    check(promptOf(out.trace, 'review-bead:bd-101')?.includes(`bash ${SKILLS}/super-code/scripts/review-bead split bd-101`), 'the split is a script echo of review-bead split', promptOf(out.trace, 'review-bead:bd-101'))
    check(at(out, 'brief:bd-102') > at(out, 'impl:bd-101') && at(out, 'brief:bd-102') < at(out, 'merge:bd-101'), 'the dependent is briefed after the parent\'s implementation and before its merge')
    const brief = promptOf(out.trace, 'brief:bd-102') ?? ''
    check(brief.includes('git merge --no-ff -m "stack: bd-101" task-bd-101') && /STACK_CONFLICT/.test(brief), 'the dependent\'s brief merges the parent\'s branch into its fresh worktree, with a stack-conflict exit', brief)
    check((promptOf(out.trace, 'impl:bd-102') ?? '').includes('cut with the branches of bd-101 merged in'), 'the dependent\'s implementer is told it builds on the unmerged parent')
    check(at(out, 'merge:bd-102') > at(out, 'merge:bd-101') && out.maxOpen.merge === 1, 'the dependent merges only after its parent merged; single-flight held')
    const mergeChild = promptOf(out.trace, 'merge:bd-102') ?? ''
    check(mergeChild.includes(`git rebase --onto ${BRANCH} ${SHA('e')} task-bd-102`) && /fix passes changed/.test(mergeChild), 'the dependent rebases only its own commits (--onto from its stacked base), and its seam list covers the parent\'s fix pass', mergeChild)
    check((promptOf(out.trace, 'merge:bd-101') ?? '').includes('`bd close bd-101` (a no-op if it is already closed), then `bd close bd-150`'), 'the parent\'s merge closes its task bead, then its review bead')
    check(taskLedgerLines(out.trace, 'bd-102').includes('Task 2 (bd-102): stacked on bd-101 (dispatched at implementation-done)'), 'the dependent\'s ledger flush carries its stacked-on line', JSON.stringify(taskLedgerLines(out.trace, 'bd-102')))
    check(out.logs.some(l => /parallelism: 1 ready · topped-up 1 · .* · stacked 1/.test(l)), 'the detector counts the graph dispatch and names the stacked one')
    assertBucketsDisjoint(out.result)
  }

  scenario('early unblock: a parent BLOCKED at its fix pass cancels its stacked dependent, discards its worktree, and reopens the parent\'s task bead')
  {
    const canned = graphCanned([{ id: 'bd-101' }, { id: 'bd-102', deps: ['bd-101'] }], {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
      'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'wrong cache key' },
      'fix:bd-101': async ctx => { await ctx.waitFor('impl:bd-102'); return { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-109', finding: 'needs a decision' } },
      // the dependent finishes implementing only after the parent's failure was handled
      'impl:bd-102': async ctx => { await ctx.waitFor('reopen:bd-101'); return { id: 'bd-102', status: 'IMPLEMENTED', files: [], head: SHA('d') } },
      'reopen:bd-101': { reopened: ['bd-101'] },
      'discard:bd-102': { discarded: true, reopened: [] },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'a human picks the cache key' },
      'notify:bd-101': { sent: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const r = out.result
    check(JSON.stringify(r?.escalated) === '["bd-101"]' && r?.completed.length === 0 && !JSON.stringify(r).includes('bd-102'), 'the parent is escalated; the cancelled dependent is in no bucket (it re-enters when the parent resolves)', JSON.stringify(r))
    check(!out.trace.some(t => ['review:bd-102', 'merge:bd-102', 'triage:bd-102', 'notify:bd-102'].includes(t.label)), 'the dependent is never reviewed, merged, or escalated')
    check(out.counts['reopen:bd-101'] === 1 && (promptOf(out.trace, 'reopen:bd-101') ?? '').includes(`scripts/review-bead reopen bd-101`), 'the parent\'s task bead is reopened (review-bead reopen) so bd blocks its dependents again')
    check(at(out, 'reopen:bd-101') < at(out, 'triage:bd-101'), 'the reopen lands before the parent\'s triage, so a RESOLVE retry starts from a settled attempt')
    const discard = promptOf(out.trace, 'discard:bd-102') ?? ''
    check(out.counts['discard:bd-102'] === 1 && discard.includes('git worktree remove --force') && discard.includes('git branch -D task-bd-102'), 'the dependent\'s worktree and branch are discarded', discard)
    check(taskLedgerLines(out.trace, 'bd-102').includes('Task 2 (bd-102): cancelled (parent bd-101 blocked)'), 'the dependent\'s cancelled line names its parent', JSON.stringify(taskLedgerLines(out.trace, 'bd-102')))
    check(out.counts['brief:bd-102'] === 1, 'not re-dispatched while its parent is quarantined')
    assertBucketsDisjoint(r)
  }

  scenario('early unblock: when the parent\'s RESOLVE retry is implemented again, the cancelled dependent is re-dispatched on it and both land')
  {
    const canned = graphCanned([{ id: 'bd-101' }, { id: 'bd-102', deps: ['bd-101'] }], {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
      'review:bd-101': [{ id: 'bd-101', status: 'NEEDS_FIX', finding: 'wrong cache key' }, { id: 'bd-101', status: 'CLEAN' }],
      'fix:bd-101': async ctx => { await ctx.waitFor('impl:bd-102'); return { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-109', finding: 'needs a decision' } },
      'impl:bd-102': [async ctx => { await ctx.waitFor('reopen:bd-101'); return { id: 'bd-102', status: 'IMPLEMENTED', files: [], head: SHA('d') } }, tick({ id: 'bd-102', status: 'IMPLEMENTED', files: [], head: SHA('d') })],
      'reopen:bd-101': { reopened: ['bd-101'] },
      'discard:bd-102': { discarded: true, reopened: [] },
      'triage:bd-101': { decision: 'RESOLVE', detail: 'use the tenant id as the key' },
      'clarify:bd-101': { recorded: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify([...(out.result?.completed ?? [])].sort()) === '["bd-101","bd-102"]' && out.result?.pendingRetry.length === 0, 'both land in the same round', JSON.stringify(out.result))
    check(out.counts['brief:bd-102'] === 2 && out.counts['discard:bd-102'] === 1 && out.counts['review-bead:bd-101'] === 2, 'the dependent ran twice (cancelled, then re-dispatched); the parent was split again on its retry', JSON.stringify(out.counts))
    check(lastAt(out, 'brief:bd-102') > lastAt(out, 'impl:bd-101') && at(out, 'merge:bd-102') > at(out, 'merge:bd-101'), 'the re-dispatch follows the parent\'s second implementation, and merges after it')
    assertBucketsDisjoint(out.result)
  }

  scenario('resume: an open review bead re-enters its task at the review stage, and a dependent bd reports ready stacks on it')
  {
    const canned = graphCanned([{ id: 'bd-101' }, { id: 'bd-102', deps: ['bd-101'] }], {
      'bd-ready': [{ ids: ['bd-102'], reviews: [{ id: 'bd-150', task: 'bd-101' }] }, { ids: [] }],
      'brief:bd-101': { id: 'bd-101', status: 'BRIEFED', files: [], branch: 'x', base: SHA('a'), head: SHA('c'), alreadyMerged: false },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify([...(out.result?.completed ?? [])].sort()) === '["bd-101","bd-102"]', 'the re-entered task and its dependent both land', JSON.stringify(out.result))
    check(!out.counts['impl:bd-101'] && out.counts['review:bd-101'] === 1, 'the re-entered task is reviewed without an implementer dispatch')
    check(/review re-entry/.test(promptOf(out.trace, 'brief:bd-101') ?? '') && (promptOf(out.trace, 'brief:bd-101') ?? '').includes('bd reopen bd-101'), 'its brief knows it is a re-entry, with the reopen path when the branch is gone')
    check((promptOf(out.trace, 'review:bd-101') ?? '').includes(`[BASE] = ${SHA('a')}`), 'the review uses the base the brief found')
    check((promptOf(out.trace, 'plan') ?? '').includes('Review re-entries this round') && (promptOf(out.trace, 'plan') ?? '').includes('"bd-101"'), 'the planner is told to keep the re-entry\'s row')
    check((promptOf(out.trace, 'merge:bd-101') ?? '').includes('then `bd close bd-150`'), 'its merge closes the review bead from the ready set')
    check((promptOf(out.trace, 'brief:bd-102') ?? '').includes('stack: bd-101') && at(out, 'merge:bd-102') > at(out, 'merge:bd-101'), 'the dependent stacks on the re-entry and merges after it')
    check(!out.counts['review-bead:bd-101'], 'the re-entry is not split again (its review bead exists)')
    assertBucketsDisjoint(out.result)
  }

  scenario('earlyUnblock false: the dependent waits for the merge — no review beads, no stacking, still no top-up agent')
  {
    const canned = graphCanned([{ id: 'bd-101' }, { id: 'bd-102', deps: ['bd-101'] }], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }] })
    const out = await run({ args: liveArgs({ config: cfg({ earlyUnblock: false }) }), canned })
    assertNoThrow(out)
    check(JSON.stringify([...(out.result?.completed ?? [])].sort()) === '["bd-101","bd-102"]', 'both completed in one working round', JSON.stringify(out.result))
    check(!out.trace.some(t => /^(review-bead|reopen|discard):/.test(t.label)), 'no split, reopen or discard dispatch')
    check(at(out, 'brief:bd-102') > at(out, 'merge:bd-101'), 'the dependent is briefed only after its parent merged')
    check(!(promptOf(out.trace, 'brief:bd-102') ?? '').includes('-m "stack:') && !(promptOf(out.trace, 'merge:bd-102') ?? '').includes('--onto'), 'no stack merge in the brief, plain rebase at the merge')
    check(!out.counts['bd-ready-topup'], 'the graph still finds the dependent with no top-up agent')
    assertBucketsDisjoint(out.result)
  }

  scenario('graph readiness: a three-link chain drains in one round with no top-up agent; an opaque row keeps the bd top-up')
  {
    const rows = [{ id: 'bd-101' }, { id: 'bd-102', deps: ['bd-101'] }, { id: 'bd-103', deps: ['bd-102'] }]
    // the first link's review completes only once the third link is briefed: each link stacks on the one before
    const out = await run({ args: liveArgs(), canned: graphCanned(rows, { 'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }], 'review:bd-101': async ctx => { await ctx.waitFor('brief:bd-103'); return { id: 'bd-101', status: 'CLEAN' } } }) })
    assertNoThrow(out)
    check(out.result?.completed.length === 3 && out.counts['bd-ready'] === 2 && !out.counts['bd-ready-topup'], 'the whole chain in one round, zero top-up dispatches', JSON.stringify(out.counts))
    check(at(out, 'merge:bd-101') < at(out, 'merge:bd-102') && at(out, 'merge:bd-102') < at(out, 'merge:bd-103'), 'merges land in dependency order')
    check(at(out, 'brief:bd-103') < at(out, 'merge:bd-101'), 'the third link starts before the first one merges (each stacks on the one before)')
    check(out.counts['review-bead:bd-101'] === 1 && out.counts['review-bead:bd-102'] === 1 && !out.counts['review-bead:bd-103'], 'each task with a dependent is split once; the last link is not')
    assertBucketsDisjoint(out.result)

    // bd-104 waits on an epic-level edge JS cannot see: every landing re-queries bd for it
    const opaque = graphCanned([{ id: 'bd-101' }, { id: 'bd-104', opaque: true }], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }], 'bd-ready-topup': { ids: ['bd-104'] } })
    const o2 = await run({ args: liveArgs(), canned: opaque })
    assertNoThrow(o2)
    check(o2.counts['bd-ready-topup'] === 1 && JSON.stringify([...(o2.result?.completed ?? [])].sort()) === '["bd-101","bd-104"]', 'the opaque row is found by the bd top-up after the landing, then nothing is left waiting', JSON.stringify(o2.counts))
    assertBucketsDisjoint(o2.result)
  }

  scenario('early unblock: stack parents whose branches conflict — the dependent waits for both merges, then cuts fresh')
  {
    const canned = graphCanned([{ id: 'bd-101' }, { id: 'bd-102' }, { id: 'bd-103', deps: ['bd-101', 'bd-102'] }], {
      'bd-ready': [{ ids: ['bd-101', 'bd-102'] }, { ids: [] }],
      'brief:bd-103': [{ id: 'bd-103', status: 'STACK_CONFLICT', finding: 'task-bd-101 and task-bd-102 both rewrite src/x.js' }, { id: 'bd-103', status: 'BRIEFED', files: [], branch: 'x', base: SHA('a') }],
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.result?.completed.length === 3, 'all three land', JSON.stringify(out.result))
    check(out.counts['brief:bd-103'] === 2 && lastAt(out, 'brief:bd-103') > at(out, 'merge:bd-101') && lastAt(out, 'brief:bd-103') > at(out, 'merge:bd-102'), 'the second brief comes after both parents merged')
    const second = out.trace.filter(t => t.label === 'brief:bd-103')[1]?.prompt ?? ''
    check(!second.includes('-m "stack:') && (promptOf(out.trace, 'brief:bd-103') ?? '').includes('-m "stack: bd-101"') && (promptOf(out.trace, 'brief:bd-103') ?? '').includes('-m "stack: bd-102"'), 'the first brief stacked both parents; the fresh one stacks none')
    check(!out.counts['discard:bd-103'] && !taskLedgerLines(out.trace, 'bd-103').some(l => /cancelled/.test(l)), 'a stack conflict is a wait, not a cancellation')
    assertBucketsDisjoint(out.result)
  }

  scenario('split unavailable: a null review-bead dispatch leaves the task unsplit in bd, and its dependent still dispatches early')
  {
    const canned = graphCanned([{ id: 'bd-101' }, { id: 'bd-102', deps: ['bd-101'] }], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }], 'review-bead:bd-101': null })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.result?.completed.length === 2 && at(out, 'brief:bd-102') < at(out, 'merge:bd-101'), 'the dependent still started before the parent merged; both land')
    check(!(promptOf(out.trace, 'merge:bd-101') ?? '').includes('review bead') && out.logs.some(l => l.includes('stays unsplit in bd')), 'no review bead to close at the merge; the gap is logged')
    assertBucketsDisjoint(out.result)
  }

  scenario('Finish reconciliation: a split task counts as closed only when its review bead is closed too')
  {
    const canned = graphCanned([{ id: 'bd-101' }, { id: 'bd-102', deps: ['bd-101'] }], {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
      // the dependent is already waiting at its merge gate when the parent's merge fails
      'merge:bd-101': async ctx => { await ctx.waitFor('review:bd-102'); await new Promise(r => setImmediate(r)); return { id: 'bd-101', merged: false, blockerBead: 'bd-108', rebaseConflictFiles: 1 } },
      'reopen:bd-101': null,
      'discard:bd-102': { discarded: true, reopened: [] },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'conflict' },
      'notify:bd-101': { sent: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const rec = promptOf(out.trace, 'reconcile-buckets') ?? ''
    check(rec.includes('bd-101 (review bead bd-101-rv)') && /counts as closed only when its review bead/.test(rec), 'the reconciliation names the split task with its review bead', rec)
    check(out.logs.some(l => l.includes('reopen of bd-101 unavailable')) && JSON.stringify(out.result?.escalated) === '["bd-101"]', 'a failed merge reopens the split task; a null reopen is logged', JSON.stringify(out.result))
    check(taskLedgerLines(out.trace, 'bd-102').includes('Task 2 (bd-102): cancelled (parent bd-101 blocked)') && out.counts['discard:bd-102'] === 1 && !out.counts['merge:bd-102'], 'the merge failure cancels the dependent waiting at its merge gate, and discards its worktree')
    assertBucketsDisjoint(out.result)
  }

  scenario('round head: a ready id whose blocker this run quarantined is held back (a lost reopen), and an all-held-back round drains')
  {
    const canned = graphCanned([{ id: 'bd-101' }, { id: 'bd-102', deps: ['bd-101'] }], {
      // round 2: bd still reports bd-102 ready, because bd-101's reopen was lost
      'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: [] }],
      'review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'f' },
      'fix:bd-101': { id: 'bd-101', status: 'BLOCKED', blockerBead: 'bd-109', finding: 'needs a decision' },
      'impl:bd-102': async ctx => { await ctx.waitFor('reopen:bd-101'); return { id: 'bd-102', status: 'IMPLEMENTED', files: [] } },
      'reopen:bd-101': null,
      'discard:bd-102': { discarded: true, reopened: [] },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'a human decides' },
      'notify:bd-101': { sent: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['brief:bd-102'] === 1 && out.logs.some(l => l.startsWith('held back 1 ready id(s)') && l.includes('bd-102')), 'round 2 holds bd-102 back instead of dispatching it on a quarantined blocker', JSON.stringify(out.counts))
    check(out.result?.stopReason === 'ready-drained' && out.result?.stalled === false && out.counts['bd-ready'] === 2, 'a round whose only ready ids are held back drains, never stalls', JSON.stringify({ stop: out.result?.stopReason, n: out.counts['bd-ready'] }))
    assertBucketsDisjoint(out.result)
  }

  // ===== 10. shipped tree scripts against a fake `bd` serving fixture JSON =====
  // The fixture JSON follows `bd list --all --json` / `bd epic close-eligible --dry-run --json` as
  // bd 1.3.0 emits them. Tree: R (epic) > S (epic) > B, C (C blocked by B); R > A (blocked by the
  // out-of-tree bead O), R > D (blocked by the epic S), R > X (blocker-labelled), R > Z (closed);
  // R > zz-1, an in-tree bead whose id breaks the prefix convention; OE (epic, out of tree) > R.9,
  // an out-of-tree bead whose id FAKES the prefix convention, and OE > OE.1 (closed).
  {
    const scriptsDir = path.join(skillDir, 'scripts')
    const hasJq = (() => { try { execFileSync('bash', ['-c', 'command -v jq'], { stdio: 'ignore' }); return true } catch { return false } })()
    const bashPath = execFileSync('bash', ['-c', 'command -v bash'], { encoding: 'utf8' }).trim()
    const pc = p => ({ issue_id: 'x', depends_on_id: p, type: 'parent-child' })
    const bl = p => ({ issue_id: 'x', depends_on_id: p, type: 'blocks' })
    const bead = (id, issue_type, deps = [], extra = {}) => ({ id, title: id, status: 'open', priority: 2, issue_type, dependencies: deps, ...extra })
    const baseList = () => [
      bead('R', 'epic'),
      bead('S', 'epic', [pc('R')], { parent: 'R' }),
      bead('B', 'task', [pc('S')], { parent: 'S' }),
      bead('C', 'task', [bl('B'), pc('S')], { parent: 'S' }),
      bead('A', 'task', [bl('O'), pc('R')], { parent: 'R', labels: ['sp:R'] }),
      bead('D', 'task', [bl('S'), pc('R')], { parent: 'R' }),
      bead('X', 'task', [bl('D'), pc('R')], { parent: 'R', labels: ['blocker'] }),
      bead('Z', 'task', [pc('R')], { parent: 'R', status: 'closed' }),
      bead('zz-1', 'task', [pc('R')], { parent: 'R' }),
      bead('O', 'task'),
      bead('OE', 'epic'),
      bead('R.9', 'task', [pc('OE')], { parent: 'OE' }),
      bead('OE.1', 'task', [pc('OE')], { parent: 'OE', status: 'closed' }),
    ]
    // Fake bd: list/show read list.json with closed.txt applied (list honors --label and, without
    // --all, hides closed beads); close appends to closed.txt, refusing a bead with an open blocks
    // dependency; reopen removes it; create appends a bead (title, --parent, -l, --deps blocked-by:)
    // and prints its id; close-eligible derives eligibility (open epic, >=1 child, all children
    // closed) and refuses the mutating form; ready serves ready-label.json / ready-all.json (work) or
    // ready-review-label.json / ready-review-all.json (with --label sp:review) cut to --limit. Every
    // call is logged to calls.log.
    const fakeBd = `#!${bashPath}
set -euo pipefail
d=$FAKE_BD_DIR
echo "$*" >> "$d/calls.log"
closed() { if [ -s "$d/closed.txt" ]; then jq -R . "$d/closed.txt" | jq -s .; else echo '[]'; fi; }
state() { jq --argjson c "$(closed)" 'map(if (.id as $i | $c | index($i)) then .status = "closed" else . end)' "$d/list.json"; }
case "$1" in
  list)
    label=; all=0; prev=
    for a in "$@"; do [ "$prev" = --label ] && label=$a; [ "$a" = --all ] && all=1; prev=$a; done
    state | jq --arg l "$label" --argjson all "$all" 'map(select(($l == "" or ((.labels // []) | index($l))) and ($all == 1 or .status != "closed")))' ;;
  show) state | jq -e --arg id "$2" '[.[] | select(.id == $id)] | if length == 0 then error("no issue " + $id) else . end' ;;
  close)
    if state | jq -e --arg id "$2" '. as $all | .[] | select(.id == $id) | (.dependencies // [])[] | select(.type == "blocks") | .depends_on_id as $b | $all[] | select(.id == $b and .status != "closed")' >/dev/null; then
      echo "cannot close blocked issue: $2" >&2; exit 1
    fi
    echo "$2" >> "$d/closed.txt" ;;
  reopen) grep -vx "$2" "$d/closed.txt" > "$d/closed.tmp" || true; mv "$d/closed.tmp" "$d/closed.txt" ;;
  create)
    title=$2; shift 2; parent=; labels=; deps=
    while [ $# -gt 0 ]; do case "$1" in --parent) parent=$2; shift ;; -l) labels=$2; shift ;; --deps) deps=$2; shift ;; -d) shift ;; esac; shift; done
    id="\${parent:-N}.r$(( $(jq length "$d/list.json") + 1 ))"
    jq --arg id "$id" --arg t "$title" --arg p "$parent" --arg l "$labels" --arg dp "$deps" '. + [{id: $id, title: $t, status: "open", issue_type: "task",
      labels: ($l | split(",") | map(select(length > 0))), parent: (if $p == "" then null else $p end),
      dependencies: ([ if $p == "" then empty else {depends_on_id: $p, type: "parent-child"} end ]
        + [ $dp | split(",")[] | select(length > 0) | {depends_on_id: sub("^blocked-by:"; ""), type: "blocks"} ])}]' "$d/list.json" > "$d/list.tmp"
    mv "$d/list.tmp" "$d/list.json"
    echo "$id" ;;
  epic)
    case " $* " in *" --dry-run "*) ;; *) echo "fake bd: unfiltered mutating close-eligible" >&2; exit 9 ;; esac
    state | jq '. as $all | [ .[] | select(.issue_type == "epic" and .status != "closed") | .id as $e
      | [ $all[] | select(any((.dependencies // [])[]; .type == "parent-child" and .depends_on_id == $e)) ] as $k
      | select(($k | length) > 0 and all($k[]; .status == "closed"))
      | {epic: {id: $e, status: "open"}, total_children: ($k | length), closed_children: ($k | length), eligible_for_close: true} ]' ;;
  ready)
    limit=100; labelled=0; review=0; prev=
    for a in "$@"; do
      [ "$prev" = --limit ] && limit=$a
      if [ "$prev" = --label ]; then if [ "$a" = sp:review ]; then review=1; else labelled=1; fi; fi
      prev=$a
    done
    f=ready-all.json
    if [ "$review" = 1 ]; then f=ready-review-all.json; [ "$labelled" = 1 ] && f=ready-review-label.json
    elif [ "$labelled" = 1 ]; then f=ready-label.json; fi
    jq --argjson n "$limit" '.[:$n]' "$d/$f" ;;
  *) echo "fake bd: unexpected $*" >&2; exit 9 ;;
esac
`
    const newFixture = ({ list = baseList(), readyLabel = [], readyAll = [], reviewLabel = [], reviewAll = [], closed = [] } = {}) => {
      const dir = mkdtempSync(path.join(os.tmpdir(), 'sc-tree-scripts-'))
      mkdirSync(path.join(dir, 'bin'))
      writeFileSync(path.join(dir, 'bin', 'bd'), fakeBd, { mode: 0o755 })
      writeFileSync(path.join(dir, 'list.json'), JSON.stringify(list))
      writeFileSync(path.join(dir, 'ready-label.json'), JSON.stringify(readyLabel.map(id => ({ id, title: id }))))
      writeFileSync(path.join(dir, 'ready-all.json'), JSON.stringify(readyAll.map(id => ({ id, title: id }))))
      // review entries are [reviewBeadId, taskId] pairs, served with the "review: <task>" title
      writeFileSync(path.join(dir, 'ready-review-label.json'), JSON.stringify(reviewLabel.map(([id, t]) => ({ id, title: `review: ${t}` }))))
      writeFileSync(path.join(dir, 'ready-review-all.json'), JSON.stringify(reviewAll.map(([id, t]) => ({ id, title: `review: ${t}` }))))
      writeFileSync(path.join(dir, 'closed.txt'), closed.map(c => c + '\n').join(''))
      writeFileSync(path.join(dir, 'calls.log'), '')
      return dir
    }
    // Runs `bash scripts/<name> ...args` with the fake bd first on PATH. noJq: PATH holds only a
    // bin dir with the fake bd and dirname, so `command -v jq` fails.
    const runScript = (dir, name, args, { noJq = false } = {}) => {
      let PATH = `${path.join(dir, 'bin')}:${process.env.PATH}`
      if (noJq) {
        const nb = path.join(dir, 'nojq-bin'); mkdirSync(nb, { recursive: true })
        execFileSync('ln', ['-sf', execFileSync('bash', ['-c', 'command -v dirname'], { encoding: 'utf8' }).trim(), path.join(nb, 'dirname')])
        PATH = nb
      }
      const r = spawnSync(bashPath, [path.join(scriptsDir, name), ...args], { encoding: 'utf8', env: { ...process.env, PATH, FAKE_BD_DIR: dir } })
      return { code: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
    }
    const calls = dir => readFileSync(path.join(dir, 'calls.log'), 'utf8').split('\n').filter(Boolean)
    const lines = s => s.split('\n').filter(Boolean)

    scenario('scripts: every tree script prints JQ_UNAVAILABLE: and exits 4 when jq is missing')
    {
      const dir = newFixture()
      for (const [name, args] of [['epic-tree', ['R', 'A']], ['ready-in-tree', ['R']], ['close-in-tree-epics', ['R']], ['edge-stats', ['R']], ['tree-deps', ['R']]]) {
        const r = runScript(dir, name, args, { noJq: true })
        check(r.code === 4 && /^JQ_UNAVAILABLE: /.test(r.stdout) && lines(r.stdout).length === 1 && r.stdout.includes('R'), `${name}: exit 4 with one self-contained JQ_UNAVAILABLE: line naming the epic`, JSON.stringify(r))
      }
      for (const args of [['split', 'C'], ['reopen', 'B', 'C']]) {
        const r = runScript(dir, 'review-bead', args, { noJq: true })
        check(r.code === 4 && /^JQ_UNAVAILABLE: /.test(r.stdout) && lines(r.stdout).length === 1 && r.stdout.includes('C'), `review-bead ${args[0]}: exit 4 with one self-contained JQ_UNAVAILABLE: line naming the task`, JSON.stringify(r))
      }
      check(calls(dir).length === 0, 'the no-jq path runs no bd command', calls(dir).join(' | '))
      rmSync(dir, { recursive: true, force: true })
    }

    if (!hasJq) {
      scenario('scripts: jq-backed cases')
      console.log('  [SKIP] jq not installed — only the JQ_UNAVAILABLE path was exercised')
    } else {
      scenario('scripts: epic-tree — structural membership, never the id prefix')
      {
        const dir = newFixture()
        const all = runScript(dir, 'epic-tree', ['R'])
        check(all.code === 0 && lines(all.stdout)[0] === 'R', 'root listed first', all.stdout)
        check(JSON.stringify(lines(all.stdout).slice(1).sort()) === JSON.stringify(['A', 'B', 'C', 'D', 'S', 'X', 'Z', 'zz-1']), 'every descendant (closed and nested included), nothing out of tree', all.stdout)
        const f = runScript(dir, 'epic-tree', ['R', 'OE', 'R.9', 'zz-1', 'C', 'R', 'nope'])
        check(f.code === 0 && JSON.stringify(lines(f.stdout)) === JSON.stringify(['zz-1', 'C', 'R']), 'candidates filtered in input order: prefix-faking R.9 out, prefix-breaking zz-1 in, unknown id out', f.stdout)
        const sub = runScript(dir, 'epic-tree', ['S', 'B', 'D', 'R'])
        check(JSON.stringify(lines(sub.stdout)) === JSON.stringify(['B']), 'a sub-epic tree excludes its parent and siblings', sub.stdout)
        const bad = runScript(dir, 'epic-tree', ['nope'])
        check(bad.code === 2 && bad.stderr.includes('unknown epic'), 'unknown EPIC_ID exits 2', JSON.stringify(bad))
        check(runScript(dir, 'epic-tree', []).code === 2, 'missing EPIC_ID exits 2')
        writeFileSync(path.join(dir, 'dump.json'), JSON.stringify(baseList()))
        writeFileSync(path.join(dir, 'calls.log'), '')
        const from = runScript(dir, 'epic-tree', ['--from', path.join(dir, 'dump.json'), 'R', 'B', 'OE'])
        check(from.stdout === 'B\n' && calls(dir).length === 0, '--from reads a saved dump and runs no bd', JSON.stringify(from))
        rmSync(dir, { recursive: true, force: true })
      }

      scenario('scripts: ready-in-tree — labelled fast path, structural fallback, truncation re-runs, review beads apart')
      {
        let dir = newFixture({ readyLabel: ['A'], readyAll: ['O', 'A', 'B'] })
        let r = runScript(dir, 'ready-in-tree', ['R'])
        check(r.code === 0 && r.stdout.trim() === '{"ids":["A"],"reviews":[]}', 'fast path: the labelled ids, as one JSON object with an empty reviews list', JSON.stringify(r))
        const fastCalls = calls(dir).filter(c => c.startsWith('ready'))
        check(/--exclude-type=epic --exclude-label blocker,sp:review --label sp:R --limit 500 --json/.test(fastCalls[0]) && !fastCalls.slice(1).some(c => c.includes('--exclude-label')), 'the work query runs labelled first, excluding epics, blocker beads and review beads', fastCalls.join(' | '))
        check(fastCalls.length === 3 && /--label sp:review --label sp:R/.test(fastCalls[1]) && /--label sp:review --limit/.test(fastCalls[2]), 'review beads: a labelled query, then the repo-global one when it comes back empty', fastCalls.join(' | '))
        rmSync(dir, { recursive: true, force: true })

        dir = newFixture({ readyLabel: [], readyAll: ['O', 'R.9', 'B', 'zz-1', 'OE.1'] })
        r = runScript(dir, 'ready-in-tree', ['R'])
        check(r.code === 0 && r.stdout.trim() === '{"ids":["B","zz-1"],"reviews":[]}', 'empty fast path falls back to the repo-global set filtered by structure, bd order kept', JSON.stringify(r))
        const readyCalls = calls(dir).filter(c => c.startsWith('ready'))
        check(!readyCalls[1].includes('--label') && readyCalls[1].includes('--exclude-label blocker,sp:review'), 'fallback query is repo-global and still excludes blocker and review beads', readyCalls.join(' | '))
        rmSync(dir, { recursive: true, force: true })

        dir = newFixture({ readyLabel: [], readyAll: [] })
        r = runScript(dir, 'ready-in-tree', ['R'])
        check(r.code === 0 && r.stdout.trim() === '{"ids":[],"reviews":[]}', 'nothing ready anywhere: empty lists, exit 0', JSON.stringify(r))
        rmSync(dir, { recursive: true, force: true })

        dir = newFixture({ readyLabel: ['zz-1'], reviewLabel: [['R.r20', 'B']] })
        r = runScript(dir, 'ready-in-tree', ['R'])
        check(r.code === 0 && r.stdout.trim() === '{"ids":["zz-1"],"reviews":[{"id":"R.r20","task":"B"}]}', 'a ready review bead is reported apart, with the task its title names', JSON.stringify(r))
        rmSync(dir, { recursive: true, force: true })

        // a review bead's labels need not carry this epic's label: the structural fallback finds it
        const withReview = [...baseList(), { id: 'S.r30', title: 'review: C', status: 'open', issue_type: 'task', labels: ['sp:review'], parent: 'S', dependencies: [{ issue_id: 'x', depends_on_id: 'S', type: 'parent-child' }, { issue_id: 'x', depends_on_id: 'C', type: 'blocks' }] }]
        dir = newFixture({ list: withReview, readyLabel: ['zz-1'], reviewAll: [['OE.r9', 'R.9'], ['S.r30', 'C']] })
        r = runScript(dir, 'ready-in-tree', ['R'])
        check(r.code === 0 && r.stdout.trim() === '{"ids":["zz-1"],"reviews":[{"id":"S.r30","task":"C"}]}', 'repo-global review beads are filtered by structure: the out-of-tree one is dropped', JSON.stringify(r))
        rmSync(dir, { recursive: true, force: true })

        dir = newFixture({ readyAll: ['B'] })
        r = runScript(dir, 'ready-in-tree', ['nope'])
        check(r.code === 2 && r.stderr.includes('unknown epic'), 'unknown EPIC_ID exits 2 (the fallback\'s tree filter fails, and that failure propagates)', JSON.stringify(r))
        rmSync(dir, { recursive: true, force: true })

        const many = Array.from({ length: 700 }, (_, i) => `R.${i + 100}`)
        dir = newFixture({ readyLabel: many })
        r = runScript(dir, 'ready-in-tree', ['R'])
        const limits = calls(dir).filter(c => c.includes('--label sp:R') && !c.includes('--label sp:review')).map(c => c.match(/--limit (\d+)/)?.[1])
        check(r.code === 0 && JSON.parse(r.stdout).ids.length === 700 && JSON.stringify(limits) === '["500","1000"]', 'a result that fills the limit re-runs with it doubled until it comes back short', JSON.stringify({ limits, n: r.stdout.length }))
        rmSync(dir, { recursive: true, force: true })
      }

      scenario('scripts: close-in-tree-epics — fixpoint over tree levels, out-of-tree epics untouched')
      {
        let dir = newFixture({ closed: ['A', 'B', 'C', 'D', 'X', 'zz-1'] })
        let r = runScript(dir, 'close-in-tree-epics', ['R'])
        check(r.code === 0 && r.stdout.trim() === '{"rootClosed":true,"closedThisRun":["S","R"]}', 'S then R closed across two passes; root reported closed', JSON.stringify(r))
        const cs = calls(dir)
        check(!cs.includes('close OE') && cs.filter(c => c.startsWith('epic close-eligible')).every(c => c.includes('--dry-run')), 'the permanently-eligible out-of-tree epic is never closed; close-eligible only ever previews', cs.join(' | '))
        check(cs.filter(c => c.startsWith('epic close-eligible')).length === 3, 'stops on the pass that closes zero (3 previews), though OE stays eligible forever', cs.join(' | '))
        rmSync(dir, { recursive: true, force: true })

        dir = newFixture({ closed: ['B'] })
        r = runScript(dir, 'close-in-tree-epics', ['R'])
        check(r.code === 0 && r.stdout.trim() === '{"rootClosed":false,"closedThisRun":[]}', 'nothing eligible in tree: one pass, nothing closed, root open', JSON.stringify(r))
        rmSync(dir, { recursive: true, force: true })

        dir = newFixture()
        r = runScript(dir, 'close-in-tree-epics', ['nope'])
        check(r.code === 2, 'unknown EPIC_ID exits 2', JSON.stringify(r))
        rmSync(dir, { recursive: true, force: true })
      }

      scenario('scripts: tree-deps — in-tree leaf blockers per open leaf; opaque when anything else gates it')
      {
        let dir = newFixture()
        let r = runScript(dir, 'tree-deps', ['R'])
        let j = null; try { j = JSON.parse(r.stdout) } catch {}
        const by = id => j?.beads.find(b => b.id === id)
        check(r.code === 0 && JSON.stringify(j?.beads.map(b => b.id)) === '["B","C","A","D","zz-1"]', 'one entry per open, non-epic, non-blocker in-tree bead, in dump order (closed Z, blocker X, out-of-tree O excluded)', r.stdout + r.stderr)
        check(JSON.stringify(by('C')) === '{"id":"C","deps":["B"],"opaque":false}' && JSON.stringify(by('B')) === '{"id":"B","deps":[],"opaque":false}', 'C waits on the in-tree leaf B; B on nothing', r.stdout)
        check(by('A')?.opaque === true && by('A')?.deps.length === 0, 'A, blocked by an out-of-tree bead, is opaque', r.stdout)
        check(by('D')?.opaque === true && by('D')?.deps.length === 0, 'D, blocked by an epic, is opaque', r.stdout)
        rmSync(dir, { recursive: true, force: true })

        const gated = baseList(); gated.find(b => b.id === 'S').dependencies.push(bl('A'))
        gated.find(b => b.id === 'zz-1').status = 'in_progress'
        dir = newFixture({ list: gated, closed: ['B'] })
        r = runScript(dir, 'tree-deps', ['R'])
        j = null; try { j = JSON.parse(r.stdout) } catch {}
        check(r.code === 0 && JSON.stringify(by('C')) === '{"id":"C","deps":[],"opaque":true}', 'a closed blocker is satisfied (C loses B); an ancestor epic with an open blocker makes its leaves opaque', r.stdout)
        check(by('zz-1')?.opaque === true, 'a bead claimed by hand (status in_progress) is opaque', r.stdout)
        rmSync(dir, { recursive: true, force: true })

        dir = newFixture()
        check(runScript(dir, 'tree-deps', ['nope']).code === 2, 'unknown EPIC_ID exits 2')
        rmSync(dir, { recursive: true, force: true })
      }

      scenario('scripts: review-bead — split creates or reuses the review bead before closing the task; reopen undoes it')
      {
        const dir = newFixture({ closed: ['O'] })   // A's out-of-tree blocker is done, so A can close
        let r = runScript(dir, 'review-bead', ['split', 'C'])
        check(r.code === 0 && r.stdout.trim() === '{"reviewBead":"S.r14","implClosed":false,"created":true}', 'C (blocked by open B): review bead created, and bd\'s refusal to close a blocked bead is reported, not forced', JSON.stringify(r))
        const created = JSON.parse(readFileSync(path.join(dir, 'list.json'), 'utf8')).find(b => b.id === 'S.r14')
        check(created?.title === 'review: C' && created?.parent === 'S' && JSON.stringify(created?.labels) === '["sp:review"]' && created?.dependencies.some(d => d.type === 'blocks' && d.depends_on_id === 'C'), 'the review bead: title "review: C", C\'s parent, sp:review, blocked by C', JSON.stringify(created))
        const create = calls(dir).find(c => c.startsWith('create'))
        check(/--no-inherit-labels/.test(create ?? '') && /--deps blocked-by:C/.test(create ?? ''), 'created with --no-inherit-labels and blocked-by the task', create)
        const order = calls(dir).filter(c => /^(create|close) /.test(c)).map(c => c.split(' ')[0])
        check(JSON.stringify(order) === '["create","close"]', 'the review bead exists before the task bead is closed', JSON.stringify(order))
        r = runScript(dir, 'review-bead', ['split', 'A'])
        check(r.code === 0 && JSON.parse(r.stdout).implClosed === true && JSON.stringify(JSON.parse(readFileSync(path.join(dir, 'list.json'), 'utf8')).find(b => b.title === 'review: A')?.labels) === '["sp:R","sp:review"]', 'the task\'s sp: labels carry over; an unblocked task closes', JSON.stringify(r))
        r = runScript(dir, 'review-bead', ['split', 'A'])
        check(r.code === 0 && JSON.parse(r.stdout).created === false && JSON.parse(r.stdout).reviewBead === 'R.r15', 'a second split reuses the open review bead', JSON.stringify(r))
        r = runScript(dir, 'review-bead', ['reopen', 'A', 'C'])
        check(r.code === 0 && r.stdout.trim() === '{"reopened":["A"]}' && !readFileSync(path.join(dir, 'closed.txt'), 'utf8').split('\n').includes('A'), 'reopen reopens the closed task only', JSON.stringify(r))
        check(runScript(dir, 'review-bead', ['split', 'nope']).code === 2 && runScript(dir, 'review-bead', ['bogus', 'A']).code === 2, 'unknown task or subcommand exits 2')
        rmSync(dir, { recursive: true, force: true })
      }

      scenario('scripts: edge-stats — open leaves, depth through epic waits, one critical path')
      {
        let dir = newFixture()
        let r = runScript(dir, 'edge-stats', ['R'])
        let j = null; try { j = JSON.parse(r.stdout) } catch {}
        // Open non-epic, non-blocker in-tree beads: A B C D zz-1 = 5. Longest wait chain:
        // D -> S -> C -> B (S is an epic: depth 3).
        check(r.code === 0 && j?.openLeaves === 5 && j?.depth === 3, 'openLeaves 5 (closed, blocker and out-of-tree beads excluded), depth 3 (the epic adds none)', r.stdout + r.stderr)
        check(JSON.stringify(j?.criticalPath) === '["D","S","C","B"]', 'critical path runs through the epic-level edge, waiting bead first', r.stdout)
        rmSync(dir, { recursive: true, force: true })

        const cyc = baseList(); cyc.find(b => b.id === 'B').dependencies.push(bl('C'))
        dir = newFixture({ list: cyc })
        r = runScript(dir, 'edge-stats', ['R'])
        j = null; try { j = JSON.parse(r.stdout) } catch {}
        check(r.code === 0 && j?.depth === 3 && r.stderr.includes('wait cycle'), 'a wait cycle terminates, is reported on stderr, and its closing edge is ignored', JSON.stringify(r))
        rmSync(dir, { recursive: true, force: true })

        dir = newFixture()
        check(runScript(dir, 'edge-stats', ['nope']).code === 2, 'unknown EPIC_ID exits 2')
        rmSync(dir, { recursive: true, force: true })
      }
    }
  }

  // ===== summary =====
  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
