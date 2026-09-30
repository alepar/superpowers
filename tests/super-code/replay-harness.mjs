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
    trace.push({ label, phase: opts.phase, prompt })
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
        // is non-empty), the mandatory sweep (whenever work landed), and the per-task minor and
        // fix-pass ledger appends — default to no-op answers here; a scenario that cares about one
        // overrides its key explicitly.
        if (label === 'read-ledger:finish') return { text: '' }
        if (label === 'ledger-append:metrics') return { appended: true }
        if (label === 'reconcile-buckets') return { closed: [] }
        if (label === 'sweep') return 'abc1234 — 1 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: <project test command>'
        if (label === 'ledger-append:sweep') return { appended: true }
        if (label.startsWith('ledger-minor:') || label.startsWith('ledger-append:fix-pass:')) return { appended: true }
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
    'merge:bd-101': { id: 'bd-101', merged: true, head: SHA('b'), mergeBase: SHA('a'), rebaseConflictFiles: 0 },
    'ledger-append:bd-101': { appended: true },
    'ledger-append:merge:bd-101': { appended: true },
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
    check(scan.spans.length === 217,
      `top-level template-literal count matches recorded baseline (got ${scan.spans.length}, baseline 217 — 215 after the D4 loop rewrite, +2 for deferSweep's log line and final-review wording, −1 when the tree walk/ready/close-epics builders became script echoes (5 literals out, 4 in), +1 for dispatch()'s SCRIPT FAILURE log; update it only alongside an edit that deliberately adds or removes a template literal) — a changed count without a deliberate literal add/remove is the backtick-in-prose trap`)
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
    check(out.trace.length === 50, `50 agent dispatches (got ${out.trace.length}) — the doc's "Expected dispatch count" arithmetic`)
    const r = out.result
    check(r && JSON.stringify([...r.completed].sort()) === '["bd-101","bd-102"]', 'completed = [bd-101, bd-102]', JSON.stringify(r?.completed))
    check(r && JSON.stringify([...r.escalated].sort()) === '["bd-103","bd-104"]', 'escalated = [bd-103, bd-104] — bd-104 spent its one retry same-round and bounced', JSON.stringify(r?.escalated))
    check(r && r.pendingRetry.length === 0 && r.parked.length === 0 && r.stalled === false, 'pendingRetry and parked empty, stalled false', JSON.stringify(r))
    check(r && r.stopReason === 'ready-drained', "stopReason = 'ready-drained'", r?.stopReason)
    check(!out.trace.some(t => ['review:bd-104', 'fix:bd-104', 'merge:bd-104'].includes(t.label)), 'bd-104 never reviewed, fixed, or merged (implementer BLOCKED guard held)')
    check(out.counts['fix:bd-101'] === 1 && !out.trace.some(t => /^fix:bd-10[234]$/.test(t.label)), 'exactly one fix pass, for bd-101 only')
    check(!out.trace.some(t => /re-review|adjudicate|breaker/.test(t.label)), 'no re-review, adjudicator, or breaker dispatch exists')
    check(out.counts['ledger-append:fix-pass:bd-101'] === 1, 'one fix-pass ledger line for bd-101')
    check(out.counts['ledger-minor:bd-101'] === 1, "bd-101's minors written in one ledger dispatch")
    for (const id of ['bd-101', 'bd-102']) check(out.counts[`ledger-append:merge:${id}`] === 1, `exactly one ledger-append:merge:${id} dispatch`)
    check(out.counts['ledger-append:merge-failed:bd-103'] === 1, 'exactly one ledger-append:merge-failed:bd-103 dispatch')
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
    check(out.trace.length === 19, `19 agent dispatches (got ${out.trace.length})`)
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
    check(out.trace.length === 22, `22 agent dispatches (got ${out.trace.length})`)
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
      'ledger-append:bd-104': { appended: true },
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

    const fixLine = extractLedgerLine(promptOf(out.trace, 'ledger-append:fix-pass:bd-101'))
    check(/^Task 1 \(bd-101\): fix pass FIXED \(missing null check at src\/a\.js:42; commits cccccccc?\.\.fffffff\)$/.test(fixLine ?? ''), 'fix-pass line: ordinal, id, outcome, finding, and the implementer-head..fixer-head range', fixLine)
    check(LEDGER_LINE_RE.test(fixLine ?? ''), "fix-pass line matches the coordinator's LEDGER_LINE_RE")
    const done = extractLedgerLine(promptOf(out.trace, 'ledger-append:bd-101'))
    check(/^Task 1 \(bd-101\): complete \(commits aaaaaaa\.\.bbbbbbb, fix pass\)$/.test(done ?? ''), 'completion line records the fix pass', done)
    const minors = extractLedgerLines(promptOf(out.trace, 'ledger-minor:bd-101'))
    check(minors.length === 1 && minors[0] === 'Task 1 (bd-101): minor (deferred): name x is uninformative', 'minors written as one-per-line ledger entries in a single dispatch', JSON.stringify(minors))

    const merge = promptOf(out.trace, 'merge:bd-101')
    check(/Run no tests in this dispatch/.test(merge ?? '') && !/project test command/.test(merge ?? ''), 'merge dispatch runs no tests (no per-merge gate)', merge)
    check(merge?.includes('rebase `task-bd-101`') && merge?.includes('git merge --no-ff task-bd-101'), 'merge dispatch rebases and merges the task BRANCH ref, not the worktree path', merge)
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
    const line = extractLedgerLine(promptOf(out.trace, 'ledger-append:bd-101'))
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
    check(/^Task 1 \(bd-101\): fix pass BLOCKED \(/.test(extractLedgerLine(promptOf(out.trace, 'ledger-append:fix-pass:bd-101')) ?? ''), 'fix-pass line records BLOCKED')
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
      'ledger-append:bd-105': { appended: true },
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
    check(merge?.includes(`is checked out in ${explicit}.`) && merge?.includes(`in ${explicit}, \`git merge --no-ff`), 'merge runs in the caller-supplied integration worktree', merge)
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
    check(/^Task 1 \(bd-101\): complete \(already merged/.test(extractLedgerLine(promptOf(out.trace, 'ledger-append:bd-101')) ?? ''), 'ledger records an already-merged completion line')
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
      'ledger-append:bd-104': { appended: true },
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
    let canned = oneTaskCanned({ 'ledger-append:bd-101': [null, { appended: true }], 'ledger-append:bd-101:retry': { appended: true } })
    let out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['ledger-append:bd-101'] === 1 && out.counts['ledger-append:bd-101:retry'] === 1, 'one retry dispatch after the null append', JSON.stringify(out.counts))
    check(extractLedgerLine(promptOf(out.trace, 'ledger-append:bd-101:retry'))?.startsWith('Task 1 (bd-101): complete'), 'the retry carries the same completion line shape')
    check(JSON.stringify(out.result?.ledgerAppendFailed) === '[]', 'nothing marked failed when the retry lands')
    check(out.logs.some(l => /ledger-append retried: ledger-append:bd-101/.test(l)), 'the retry is logged by label')
    canned = oneTaskCanned({ 'ledger-append:bd-101': null, 'ledger-append:bd-101:retry': null })
    out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.ledgerAppendFailed) === '["ledger-append:bd-101"]', 'the lost line is returned by label', JSON.stringify(out.result?.ledgerAppendFailed))
    check(out.logs.some(l => l.startsWith('ledger-append-failed: ledger-append:bd-101')), 'a ledger-append-failed marker is logged')
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
      'ledger-append:bd-101': [null, { appended: true }],
      'ledger-append:bd-101:retry': { appended: true },
    })
    let out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(promptOf(out.trace, 'ledger-append:bd-101')?.includes(DETAIL), 'the first attempt carries the triage detail')
    const retry = promptOf(out.trace, 'ledger-append:bd-101:retry')
    check(!!retry && !retry.includes(DETAIL) && !retry.includes('weakened'), 'the retry elides the triage detail', retry)
    const rl = extractLedgerLine(retry)
    const m = LEDGER_LINE_RE.exec(rl ?? '')
    check(!!m && m[2] === 'bd-101' && m[3].startsWith('pending retry — RESOLVE') && rl.includes('bd-109'), 'the elided line keeps the resume shape, the id, the outcome token and the blocker bead id', rl)
    canned = oneTaskCanned({
      'impl:bd-101': { id: 'bd-101', status: 'BLOCKED', files: ['src/a.js'], blockerBead: 'bd-109' },
      'triage:bd-101': { decision: 'ESCALATE', detail: DETAIL },
      'notify:bd-101': [null, { sent: true }],
      'ledger-append:bd-101': null,
      'ledger-append:bd-101:retry': { appended: true },
    })
    out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    const notifies = out.trace.filter(t => t.label === 'notify:bd-101').map(t => t.prompt)
    check(notifies.length === 2 && notifies[0].includes(DETAIL) && !notifies[1].includes(DETAIL) && notifies[1].includes('bd-109'), 'a null notify is retried once with the detail elided and the blocker bead named')
    const bl = extractLedgerLine(promptOf(out.trace, 'ledger-append:bd-101:retry'))
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
      canned[`merge:${id}`] = { id, merged: true, head: SHA('b'), mergeBase: SHA('a'), rebaseConflictFiles: 0 }
      canned[`ledger-append:${id}`] = { appended: true }
      canned[`ledger-append:merge:${id}`] = { appended: true }
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
      'merge:bd-101': [null, { id: 'bd-101', merged: true, head: SHA('b'), mergeBase: SHA('a') }],
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['ledger-append:bd-101'] === 1, `exactly one completion ledger line (got ${out.counts['ledger-append:bd-101'] ?? 0})`)
    check(!out.trace.some(t => /^(triage|missing-blocker|notify):/.test(t.label)), 'null merge never entered the blocker path')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && out.result?.escalated.length === 0 && out.result?.pendingRetry.length === 0, 'task completed exactly once, no other bucket', JSON.stringify(out.result))
    check(out.logs.some(l => l.includes('NULL dispatch: merge:bd-101')), 'swallowed null merge is logged by label')
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
    check(!out.trace.some(t => ['ledger-append:bd-101', 'notify:bd-101', 'clarify:bd-101'].includes(t.label)), 'no ledger line, neither triage branch executed')
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
      c[`merge:${id}`] = tick({ id, merged: true, head: SHA('b'), mergeBase: SHA('a') })
      c[`ledger-append:${id}`] = { appended: true }
      c[`ledger-append:merge:${id}`] = { appended: true }
    }
    return { ...c, ...overrides }
  }

  scenario('no round barrier: 12 siblings merge while the 13th still implements (live-incident shape)')
  {
    const ids = Array.from({ length: 13 }, (_, i) => `bd-${101 + i}`)
    const siblings = ids.slice(0, 12)
    const canned = manyTaskCanned(ids, {
      'impl:bd-113': async ctx => { await Promise.all(siblings.map(s => ctx.waitFor(`ledger-append:${s}`))); return { id: 'bd-113', status: 'IMPLEMENTED', files: [] } },
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
    const canned = manyTaskCanned(ids, { 'impl:bd-101': async ctx => { await ctx.waitFor('ledger-append:bd-103'); return { id: 'bd-101', status: 'IMPLEMENTED', files: [] } } })
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
      'impl:bd-101': async ctx => { await ctx.waitFor('ledger-append:bd-102'); return { id: 'bd-101', status: 'IMPLEMENTED', files: [] } },
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

  scenario('unplanned-id triage rides the merge queue instead of stalling dispatch')
  {
    const canned = oneTaskCanned({
      'bd-ready': [{ ids: ['bd-101', 'bd-105'] }, { ids: [] }],
      'unplanned-blocker:bd-105': { id: 'bd-105', status: 'BLOCKED', blockerBead: 'bd-110' },
      'triage:bd-105': async ctx => { await ctx.waitFor('impl:bd-101'); return { decision: 'ESCALATE', detail: 'needs a human' } },
      'notify:bd-105': { sent: true },
      'ledger-append:bd-105': { appended: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && JSON.stringify(out.result?.escalated) === '["bd-105"]', 'mapped task completed; unmapped id escalated via the queue', JSON.stringify(out.result))
    assertBucketsDisjoint(out.result)
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
    const readyNow = counts => ids.filter((id, k) => k === 0 || counts[`ledger-append:${ids[Math.floor((k - 1) / 2)]}`])
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
    const args = JSON.parse(JSON.stringify(canonicalArgs))
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
    check(ids.every(id => out.counts[`ledger-minor:${id}`] === 1) && extractLedgerLines(promptOf(out.trace, 'ledger-minor:bd-102')).length === 2, 'one minor dispatch per task, one ledger line per minor')
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
    check(extractLedgerLine(promptOf(out.trace, 'ledger-append:bd-101'))?.includes('BLOCKED-AUTH — permission refused'), 'ledger line starts with BLOCKED')
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
    const out = await run({ args: liveArgs(), canned: manyTaskCanned(['bd-101', 'bd-102'], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: [] }] }) })
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
      'edge-audit:1': { openLeaves: 5, depth: 2, suspectEdges: [{ from: 'bd-104', to: 'bd-103', reason: 'consumer reads nothing the producer writes' }], summary: 'graph-bound' },
    })
    const out = await run({ args: liveArgs({ config: cfg({ edgeAuditCap: 1 }) }), canned })
    assertNoThrow(out)
    check(out.counts['edge-audit:1'] === 1 && !out.counts['edge-audit:2'], 'one audit, bounded by the cap')
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('edge-audit:1') > idx('merge:bd-102') && idx('edge-audit:1') < idx('brief:bd-103'), 'audit fires at the end of round 2, before round 3 dispatches')
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
      'ledger-append:bd-104': { appended: true },
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
      'merge:bd-101:seam-cleared': { id: 'bd-101', merged: true, head: SHA('c'), mergeBase: SHA('b') },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['seam-review:bd-101'] === 1 && out.counts['merge:bd-101:seam-cleared'] === 1 && !out.counts['fix:bd-101:seam'], 'one seam review, no fix, one seam-cleared merge')
    const seam = promptOf(out.trace, 'seam-review:bd-101')
    check(!!seam && seam.includes('READ-ONLY') && seam.includes('src/a.js') && seam.includes('outside this review') && !seam.includes('already approved'), 'seam review is read-only, scoped, and not primed with the prior approval', seam)
    check(!!seam && seam.includes('TEST CHANGES') && seam.includes(`${SHA('b')}..HEAD`) && /deleted, skipped, loosened, or whose expected values were edited/.test(seam) && /valid only with the command you ran stated/.test(seam), 'seam review carries the Test changes rule over the post-rebase range')
    check(promptOf(out.trace, 'merge:bd-101:seam-cleared')?.includes('ALREADY rebased') && promptOf(out.trace, 'merge:bd-101')?.includes('POST-REBASE SEAM CHECK'), 'first merge carries the seam check; the second skips it')
    check(/^Merge: bd-101 — rebase clean · seam-review cleared$/.test(extractLedgerLine(promptOf(out.trace, 'ledger-append:merge:bd-101')) ?? ''), 'Merge: line records seam-review cleared')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]' && out.maxOpen.merge === 1, 'merged; single-flight held')
    assertBucketsDisjoint(out.result)
  }

  scenario('post-rebase seam: NEEDS_FIX gets exactly one seam fix, then the merge — never a second seam round')
  {
    const canned = oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: false, seamOverlap: ['src/a.js'], head: SHA('c'), mergeBase: SHA('b') },
      'seam-review:bd-101': { id: 'bd-101', status: 'NEEDS_FIX', finding: 'sibling renamed parse() to parseInput()' },
      'fix:bd-101:seam': { id: 'bd-101', status: 'FIXED' },
      'merge:bd-101:seam-cleared': { id: 'bd-101', merged: true, head: SHA('d'), mergeBase: SHA('b') },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['fix:bd-101:seam'] === 1 && out.counts['seam-review:bd-101'] === 1, 'one fix, one review')
    const fix = promptOf(out.trace, 'fix:bd-101:seam')
    check(!!fix && fix.includes('parseInput()') && /post-rebase seam fix/.test(fix) && /Run the tests covering the overlapping files/.test(fix), 'seam fix carries the finding and runs the covering tests')
    check(/seam-review fixed$/.test(extractLedgerLine(promptOf(out.trace, 'ledger-append:merge:bd-101')) ?? ''), 'Merge: line records seam-review fixed')
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

  scenario('Merge: ledger line renders the gate-less shape on both the success and blocker paths')
  {
    const ok = await run({ args: liveArgs(), canned: oneTaskCanned({ 'merge:bd-101': { id: 'bd-101', merged: true, head: SHA('b'), mergeBase: SHA('a'), rebaseConflictFiles: 2 } }) })
    assertNoThrow(ok)
    const okLine = extractLedgerLine(promptOf(ok.trace, 'ledger-append:merge:bd-101'))
    check(okLine === 'Merge: bd-101 — rebase conflict: 2 files · seam-review none', 'success line: id, conflict count, no seam review, no gate field', okLine)
    const fail = await run({ args: liveArgs(), canned: oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: false, blockerBead: 'bd-108', rebaseConflictFiles: 3 },
      'ledger-append:merge-failed:bd-101': { appended: true },
      'triage:bd-101': { decision: 'ESCALATE', detail: 'conflict resolution failed' },
      'notify:bd-101': { sent: true },
    }) })
    assertNoThrow(fail)
    const failLine = extractLedgerLine(promptOf(fail.trace, 'ledger-append:merge-failed:bd-101'))
    check(failLine === 'Merge: bd-101 — rebase conflict: 3 files · seam-review none → blocker', 'failure line ends in → blocker, no gate field', failLine)
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
      'Merge: bd-101 — rebase clean · seam-review none',
      'Merge: bd-102 — rebase conflict: 3 files · seam-review fixed',
      'Merge: bd-103 — rebase conflict: 2 files · seam-review cleared → blocker',
      'Task 1 (bd-101): complete (commits aaaaaaa..bbbbbbb, review clean)',
      'Task 2 (bd-102): fix pass FIXED (finding A; commits ccccccc..ddddddd)',
      'Task 2 (bd-102): complete (commits aaaaaaa..eeeeeee, fix pass)',
      'Task 5 (bd-105): fix pass FIXED (finding B; commits ccccccc..ddddddd)',
      'Task 5 (bd-105): complete (commits aaaaaaa..fffffff, fix pass, 1 parked — reason: plan-mandated — finding: B)',
      'Task 6 (bd-106): fix pass BLOCKED (finding C)',
      'Task 6 (bd-106): fix pass FIXED (finding C; commits ccccccc..ddddddd)',
      'Task 7 (bd-107): complete (already merged into epic-bd-100-integration before this re-entry — bead closed, no new review)',
      'Task 8 (bd-108): minor (deferred): naming',
      'Detector: round 1 — 2 ready · topped-up 0 · cap 4 · peak in-flight 2 · top-up queries 0/40',
    ].join('\n')
    const out = await run({ args: liveArgs(), canned: manyTaskCanned(['bd-101', 'bd-102'], { 'read-ledger:finish': { text: knownLedger } }) })
    assertNoThrow(out)
    const lines = extractLedgerLines(promptOf(out.trace, 'ledger-append:metrics'))
    check(lines[0] === 'Metrics: merges 2 · merge-failed 1 · rebase-conflicts 2 · seam-reviews 2 (fixed 1)', 'line 1: success-path merges only, conflicts and seam reviews on both paths', lines[0])
    check(lines[1] === 'Metrics: completions — review clean 1 · after fix pass 2 · parked 1 · re-entry closes 1', 'line 2: completion kinds (parked counted within fix pass)', lines[1])
    check(lines[2] === 'Metrics: fix-pass — entered 4 · FIXED 3 · BLOCKED 1', 'line 3: every fix-pass line counted, a retried task twice', lines[2])
    check(lines[3] === 'Metrics: ledger-check ok · append-failed 0 · append-retried 0', "line 4: M (2) matches this run's completed.size (2)", lines[3])
    check(JSON.stringify(out.result?.metrics) === JSON.stringify(lines), 'the return carries exactly those four lines, in order', JSON.stringify(out.result?.metrics))
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
    // Fake bd: list/show read list.json with closed.txt applied; close appends to closed.txt;
    // close-eligible derives eligibility (open epic, >=1 child, all children closed) and refuses
    // the mutating form; ready serves ready-label.json / ready-all.json cut to --limit. Every call
    // is logged to calls.log.
    const fakeBd = `#!${bashPath}
set -euo pipefail
d=$FAKE_BD_DIR
echo "$*" >> "$d/calls.log"
closed() { if [ -s "$d/closed.txt" ]; then jq -R . "$d/closed.txt" | jq -s .; else echo '[]'; fi; }
state() { jq --argjson c "$(closed)" 'map(if (.id as $i | $c | index($i)) then .status = "closed" else . end)' "$d/list.json"; }
case "$1" in
  list) state ;;
  show) state | jq -e --arg id "$2" '[.[] | select(.id == $id)] | if length == 0 then error("no issue " + $id) else . end' ;;
  close) echo "$2" >> "$d/closed.txt" ;;
  epic)
    case " $* " in *" --dry-run "*) ;; *) echo "fake bd: unfiltered mutating close-eligible" >&2; exit 9 ;; esac
    state | jq '. as $all | [ .[] | select(.issue_type == "epic" and .status != "closed") | .id as $e
      | [ $all[] | select(any((.dependencies // [])[]; .type == "parent-child" and .depends_on_id == $e)) ] as $k
      | select(($k | length) > 0 and all($k[]; .status == "closed"))
      | {epic: {id: $e, status: "open"}, total_children: ($k | length), closed_children: ($k | length), eligible_for_close: true} ]' ;;
  ready)
    limit=100; f=ready-all.json; prev=
    for a in "$@"; do
      [ "$prev" = --limit ] && limit=$a
      [ "$prev" = --label ] && f=ready-label.json
      prev=$a
    done
    jq --argjson n "$limit" '.[:$n]' "$d/$f" ;;
  *) echo "fake bd: unexpected $*" >&2; exit 9 ;;
esac
`
    const newFixture = ({ list = baseList(), readyLabel = [], readyAll = [], closed = [] } = {}) => {
      const dir = mkdtempSync(path.join(os.tmpdir(), 'sc-tree-scripts-'))
      mkdirSync(path.join(dir, 'bin'))
      writeFileSync(path.join(dir, 'bin', 'bd'), fakeBd, { mode: 0o755 })
      writeFileSync(path.join(dir, 'list.json'), JSON.stringify(list))
      writeFileSync(path.join(dir, 'ready-label.json'), JSON.stringify(readyLabel.map(id => ({ id }))))
      writeFileSync(path.join(dir, 'ready-all.json'), JSON.stringify(readyAll.map(id => ({ id }))))
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
      for (const [name, args] of [['epic-tree', ['R', 'A']], ['ready-in-tree', ['R']], ['close-in-tree-epics', ['R']], ['edge-stats', ['R']]]) {
        const r = runScript(dir, name, args, { noJq: true })
        check(r.code === 4 && /^JQ_UNAVAILABLE: /.test(r.stdout) && lines(r.stdout).length === 1 && r.stdout.includes('R'), `${name}: exit 4 with one self-contained JQ_UNAVAILABLE: line naming the epic`, JSON.stringify(r))
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

      scenario('scripts: ready-in-tree — labelled fast path, structural fallback, truncation re-runs')
      {
        let dir = newFixture({ readyLabel: ['A'], readyAll: ['O', 'A', 'B'] })
        let r = runScript(dir, 'ready-in-tree', ['R'])
        check(r.code === 0 && r.stdout.trim() === '{"ids":["A"]}', 'fast path: the labelled ids, as one JSON object', JSON.stringify(r))
        check(calls(dir).length === 1 && /--exclude-type=epic --exclude-label blocker --label sp:R --limit 500 --json/.test(calls(dir)[0]), 'fast path runs only the labelled query, excluding epics and blocker beads', calls(dir).join(' | '))
        rmSync(dir, { recursive: true, force: true })

        dir = newFixture({ readyLabel: [], readyAll: ['O', 'R.9', 'B', 'zz-1', 'OE.1'] })
        r = runScript(dir, 'ready-in-tree', ['R'])
        check(r.code === 0 && r.stdout.trim() === '{"ids":["B","zz-1"]}', 'empty fast path falls back to the repo-global set filtered by structure, bd order kept', JSON.stringify(r))
        const readyCalls = calls(dir).filter(c => c.startsWith('ready'))
        check(readyCalls.length === 2 && !readyCalls[1].includes('--label') && readyCalls[1].includes('--exclude-label blocker'), 'fallback query is repo-global and still excludes blocker beads', readyCalls.join(' | '))
        rmSync(dir, { recursive: true, force: true })

        dir = newFixture({ readyLabel: [], readyAll: [] })
        r = runScript(dir, 'ready-in-tree', ['R'])
        check(r.code === 0 && r.stdout.trim() === '{"ids":[]}', 'nothing ready anywhere: an empty list, exit 0', JSON.stringify(r))
        rmSync(dir, { recursive: true, force: true })

        const many = Array.from({ length: 700 }, (_, i) => `R.${i + 100}`)
        dir = newFixture({ readyLabel: many })
        r = runScript(dir, 'ready-in-tree', ['R'])
        const limits = calls(dir).map(c => c.match(/--limit (\d+)/)?.[1])
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
