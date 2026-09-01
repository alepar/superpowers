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
      if (!(label in canned)) throw new Error(`no canned answer for label ${label}`)
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
}

// ---------- shared live-sim fixtures ----------

const EPIC = 'bd-100'
const BRANCH = 'epic-bd-100-integration'
const ROOT = '/repo'
const IW = `${ROOT}/.worktrees/${BRANCH}` // where the plan actually lands in a real run
const PLANDIR = `${IW}/.superpowers/sdd/${EPIC}-plan`
const PLANPATH = `${PLANDIR}/${EPIC}-plan.md`

const SHA = c => c.repeat(40)

const MODELS = { planner: 'opus', implementer: 'sonnet', reviewer: 'sonnet', mechanical: 'sonnet', triage: 'opus', finalReview: 'opus', fixEscalation: 'opus' }
const cfg = (extra = {}) => ({ concurrency: 4, models: MODELS, ...extra })

function liveArgs(overrides = {}) {
  return {
    epicId: EPIC,
    integrationBranch: BRANCH,
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
    'edge-audit:1': { openLeaves: 0, depth: 1, achievableWidth: 0, suspectEdges: [], summary: 'stub audit' },
    'edge-audit:2': { openLeaves: 0, depth: 1, achievableWidth: 0, suspectEdges: [], summary: 'stub audit' },
    'edge-audit:3': { openLeaves: 0, depth: 1, achievableWidth: 0, suspectEdges: [], summary: 'stub audit' },
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
    'merge:bd-101': { id: 'bd-101', merged: true, head: SHA('b'), mergeBase: SHA('a') },
    'ledger-append:bd-101': { appended: true },
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

  // ===== 0. template-literal span accounting (issue #2 defect 7) =====
  scenario('template-literal spans: scanner clean, count matches recorded baseline')
  {
    const scan = scanTemplateSpans(scriptBody)
    check(scan.clean, 'scanner ends in code state (no unterminated literal, string, or ${})')
    check(scan.spans.length === 150,
      `top-level template-literal count matches recorded baseline (got ${scan.spans.length}, baseline 150; was 107 before the issue #3/#4 batch added the auth-refusal rule, seam review, edge audit, sweep, recurring-minor and detector-persistence literals) — a changed count without a deliberate literal add/remove is the backtick-in-prose trap`)
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
  const [canonicalArgs, capArgs, parkArgs] = jsonBlocks

  scenario('dryRun replay: canonical four-task scenario')
  {
    const out = await run({ args: canonicalArgs })
    assertNoThrow(out)
    check(out.trace.length === 42, `42 agent dispatches (got ${out.trace.length}) — 32 + 1 launch-args ledger record + 1 detector ledger record (round 1; round 2 exits at ready-drained before the detector) + 2 top-up queries + 1 post-closure re-check (round 2's Close reports closures) + bd-104's same-round RESOLVE retry wave (brief, implement, bounced triage, notify, BLOCKED ledger line)`)
    const r = out.result
    check(r && JSON.stringify(r.completed.sort()) === '["bd-101","bd-102"]', 'completed = [bd-101, bd-102]', JSON.stringify(r?.completed))
    check(r && JSON.stringify(r.escalated.sort()) === '["bd-103","bd-104"]', 'escalated = [bd-103, bd-104] — bd-104 spent its C-2 retry same-round (stub implementer stays BLOCKED) and bounced', JSON.stringify(r?.escalated))
    check(r && r.pendingRetry.length === 0, 'pendingRetry drained — the same-round retry resolved it to a terminal bucket', JSON.stringify(r?.pendingRetry))
    check(r && r.parked.length === 0 && r.stalled === false, 'parked empty, stalled false')
    check(r && r.stopReason === 'ready-drained', "stopReason = 'ready-drained'", r?.stopReason)
    check(!out.trace.some(t => ['review:bd-104', 'merge:bd-104'].includes(t.label)), 'bd-104 never reviewed or merged (C4 guard held)')
    assertBucketsDisjoint(r)
  }

  scenario('dryRun replay: cap-tripping scenario')
  {
    const out = await run({ args: capArgs })
    assertNoThrow(out)
    check(out.trace.length === 26, `26 agent dispatches (got ${out.trace.length}) — 24 + 1 launch-args ledger record + 1 detector ledger record`)
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
    check(out.trace.length === 26, `26 agent dispatches (got ${out.trace.length}) — 23 + 1 launch-args ledger record + 1 detector ledger record + 1 top-up query after bd-301's merge`)
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
      'ledger-append:launch': { appended: true },
    'ledger-append:detector': { appended: true },
    'edge-audit:1': { openLeaves: 0, depth: 1, achievableWidth: 0, suspectEdges: [], summary: 'stub audit' },
    'edge-audit:2': { openLeaves: 0, depth: 1, achievableWidth: 0, suspectEdges: [], summary: 'stub audit' },
    'edge-audit:3': { openLeaves: 0, depth: 1, achievableWidth: 0, suspectEdges: [], summary: 'stub audit' },
    'ledger-append:edge-audit:1': { appended: true },
    'ledger-append:edge-audit:2': { appended: true },
    'ledger-append:edge-audit:3': { appended: true },
      'close-epics': { rootClosed: false, closedThisRun: [] },
      'bd-ready': [{ ids: ['bd-101', 'bd-104'] }, { ids: [] }],
      'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }, { n: 4, id: 'bd-104', files: ['src/c.js'] }] },
      'bd-ready-topup': { ids: [] },
      'bd-ready-recheck': { ids: [] },
    'bd-ready-recheck': { ids: [] },
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
      'notify:bd-104': { sent: true },
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
    check(JSON.stringify(r?.completed) === '["bd-101"]' && JSON.stringify(r?.escalated) === '["bd-104"]' && r?.pendingRetry.length === 0, 'terminal buckets correct (bd-104 retried same-round and bounced to escalated)', JSON.stringify(r))
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

  // ===== 4. parallelism scenarios (round-barrier removal, scheduler, single-flight merge) =====
  // Each straggler below is TIMER-FREE: it waits on other dispatches having happened (waitFor),
  // so a reintroduced barrier makes the wait unsatisfiable and the harness timeout turns the
  // deadlock into a failure instead of a hang.

  const tick = v => async () => { await new Promise(r => setImmediate(r)); return v }

  function manyTaskCanned(ids, overrides = {}) {
    const c = {
      'read-ledger': { text: '' },
      'ledger-append:launch': { appended: true },
    'ledger-append:detector': { appended: true },
    'edge-audit:1': { openLeaves: 0, depth: 1, achievableWidth: 0, suspectEdges: [], summary: 'stub audit' },
    'edge-audit:2': { openLeaves: 0, depth: 1, achievableWidth: 0, suspectEdges: [], summary: 'stub audit' },
    'edge-audit:3': { openLeaves: 0, depth: 1, achievableWidth: 0, suspectEdges: [], summary: 'stub audit' },
    'ledger-append:edge-audit:1': { appended: true },
    'ledger-append:edge-audit:2': { appended: true },
    'ledger-append:edge-audit:3': { appended: true },
      'close-epics': { rootClosed: false, closedThisRun: [] },
      'bd-ready': [{ ids: [...ids] }, { ids: [] }],
      'bd-ready-topup': { ids: [] },
      'bd-ready-recheck': { ids: [] },
    'bd-ready-recheck': { ids: [] },
      'plan': { planPath: PLANPATH, mapping: ids.map((id, i) => ({ n: i + 1, id, files: [`src/f${i}.js`] })) },
      'final-review': 'fine',
    }
    for (const id of ids) {
      c[`brief:${id}`] = { id, status: 'BRIEFED', files: [], branch: 'x', base: SHA('a') }
      // implementers and merges yield a tick: instant answers resolve synchronously inside one
      // microtask, so genuine concurrency (and a broken single-flight queue) would never be
      // OBSERVABLE as overlapping in-flight dispatches without the yield
      c[`impl:${id}`] = tick({ id, status: 'IMPLEMENTED', files: [] })
      c[`review:${id}`] = { id, status: 'CLEAN' }
      c[`merge:${id}`] = tick({ id, merged: true, head: SHA('b'), mergeBase: SHA('a') })
      c[`ledger-append:${id}`] = { appended: true }
    }
    return { ...c, ...overrides }
  }

  scenario('no round barrier: 12 siblings merge while the 13th still implements (live-incident shape)')
  {
    // The measured incident: 13 finished-or-finishing tasks, one straggler, ZERO merges for
    // 3h15m under the old `await pipeline(...)` round barrier. Here the straggler's implementer
    // cannot even return until all 12 siblings' completion ledger lines exist — impossible
    // under a barrier (merges only started after every implementer returned), so the old shape
    // deadlocks into the harness timeout.
    const ids = Array.from({ length: 13 }, (_, i) => `bd-${101 + i}`)
    const siblings = ids.slice(0, 12)
    const canned = manyTaskCanned(ids, {
      'impl:bd-113': async ctx => {
        await Promise.all(siblings.map(s => ctx.waitFor(`ledger-append:${s}`)))
        return { id: 'bd-113', status: 'IMPLEMENTED', files: [] }
      },
    })
    const out = await run({ args: liveArgs({ config: cfg({ concurrency: 14 }) }), canned })
    assertNoThrow(out)
    check(out.result?.completed.length === 13, `all 13 completed (got ${out.result?.completed.length})`)
    check(out.maxOpen.merge === 1, `exactly one merge in flight, ever (maxOpen.merge = ${out.maxOpen.merge})`)
    check((out.maxOpen.impl ?? 0) >= 2, `implementers genuinely concurrent (maxOpen.impl = ${out.maxOpen.impl})`)
    check(ids.every(id => out.counts[`merge:${id}`] === 1), 'every task merged exactly once')
    check(out.logs.some(l => /parallelism: 13 ready · topped-up 0 · cap 14 · peak in-flight/.test(l)), 'detector line reports ready/topped-up/cap/peak', out.logs.find(l => l.startsWith('parallelism')))
    assertBucketsDisjoint(out.result)
  }

  scenario('sliding window: a straggler does not block later dispatch (no chunk barrier)')
  {
    // cap 2, three tasks. bd-101's implementer waits for bd-103's completion ledger line —
    // satisfiable ONLY if bd-103 can dispatch while bd-101 still holds a slot freed by bd-102.
    // Under the old chunk([101,102],[103]) wave barriers, bd-103's dispatch waited on bd-101 →
    // deadlock → timeout.
    const ids = ['bd-101', 'bd-102', 'bd-103']
    const canned = manyTaskCanned(ids, {
      'impl:bd-101': async ctx => { await ctx.waitFor('ledger-append:bd-103'); return { id: 'bd-101', status: 'IMPLEMENTED', files: [] } },
    })
    const out = await run({ args: liveArgs({ config: cfg({ concurrency: 2 }) }), canned })
    assertNoThrow(out)
    check(out.result?.completed.length === 3, `all 3 completed (got ${out.result?.completed.length})`)
    check(out.logs.some(l => /peak in-flight 2/.test(l)), 'peak in-flight equals the cap', out.logs.find(l => l.startsWith('parallelism')))
    check(out.maxOpen.merge === 1, 'single-flight merge invariant held')
    assertBucketsDisjoint(out.result)
  }

  scenario('hot-file cap: same-file task waits for the file to drain, disjoint task overtakes')
  {
    // cap 4 but hotFileCap 1. bd-101 and bd-103 both declare src/a.js; bd-102 declares
    // src/b.js. bd-101 stalls until bd-102 has merged, so dispatch order proves the
    // constraint: without it, brief:bd-103 fires in the first microtask (before bd-101's
    // review); with it, bd-103 dispatches only after bd-101 releases src/a.js.
    const ids = ['bd-101', 'bd-102', 'bd-103']
    const canned = manyTaskCanned(ids, {
      'plan': { planPath: PLANPATH, mapping: [{ n: 1, id: 'bd-101', files: ['src/a.js'] }, { n: 2, id: 'bd-102', files: ['src/b.js'] }, { n: 3, id: 'bd-103', files: ['src/a.js'] }] },
      'impl:bd-101': async ctx => { await ctx.waitFor('ledger-append:bd-102'); return { id: 'bd-101', status: 'IMPLEMENTED', files: [] } },
    })
    const out = await run({ args: liveArgs({ config: cfg({ hotFileCap: 1 }) }), canned })
    assertNoThrow(out)
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('brief:bd-103') > idx('review:bd-101'), 'same-file task waited for the hot file to drain', `brief:bd-103@${idx('brief:bd-103')} vs review:bd-101@${idx('review:bd-101')}`)
    check(idx('brief:bd-102') < idx('review:bd-101'), 'disjoint-file task overtook the hot-file wait')
    check(out.logs.some(l => l.includes('hot-file deferrals: src/a.js')), 'detector names the hot file', out.logs.find(l => l.startsWith('parallelism')))
    check(out.result?.completed.length === 3, 'all 3 still completed')
    assertBucketsDisjoint(out.result)
  }

  scenario('unplanned-id triage rides the merge queue instead of stalling dispatch')
  {
    // bd-105 is ready but unmapped. Its triage answer waits for bd-101's IMPLEMENTER to have
    // dispatched — impossible under the old shape, which awaited the full blocker path
    // (filing + opus triage) serially BEFORE any implementation dispatch.
    const canned = oneTaskCanned({
      'bd-ready': [{ ids: ['bd-101', 'bd-105'] }, { ids: [] }],
      'unplanned-blocker:bd-105': { id: 'bd-105', status: 'BLOCKED', blockerBead: 'bd-110' },
      'triage:bd-105': async ctx => { await ctx.waitFor('impl:bd-101'); return { decision: 'ESCALATE', detail: 'needs a human' } },
      'notify:bd-105': { sent: true },
      'ledger-append:bd-105': { appended: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'mapped task completed', JSON.stringify(out.result))
    check(JSON.stringify(out.result?.escalated) === '["bd-105"]', 'unmapped id escalated via the queue')
    assertBucketsDisjoint(out.result)
  }

  // ===== 5. mid-round top-up scenarios (inter-round barrier removal) =====

  scenario('top-up: a bead unblocked by a merge dispatches in the SAME round')
  {
    // bd-102 is blocked on bd-101 at round start (round query returns only bd-101) but the
    // planner mapped it (READY AND BLOCKED enumeration). After bd-101's merge, the top-up query
    // surfaces it — it must implement and merge without waiting for round 2.
    const canned = manyTaskCanned(['bd-101', 'bd-102'], {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
      'bd-ready-topup': { ids: ['bd-101', 'bd-102'] },  // reused every call: dedup must hold
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed.sort()) === '["bd-101","bd-102"]', 'both completed', JSON.stringify(out.result))
    check(out.counts['bd-ready'] === 2, `round query ran twice, not three times (got ${out.counts['bd-ready']}) — bd-102 did NOT wait for a new round`)
    check((out.counts['bd-ready-topup'] ?? 0) >= 1, 'top-up query fired')
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('brief:bd-102') > idx('merge:bd-101'), 'topped-up bead dispatched after the unblocking merge', `brief:bd-102@${idx('brief:bd-102')} merge:bd-101@${idx('merge:bd-101')}`)
    check(out.counts['brief:bd-102'] === 1 && out.counts['brief:bd-101'] === 1, 'no double dispatch despite the top-up re-listing both ids')
    check(out.logs.some(l => l.includes('topped-up 1')), 'detector reports the topped-up count', out.logs.find(l => l.startsWith('parallelism')))
    assertBucketsDisjoint(out.result)
  }

  scenario('top-up: null query skips opportunistically, next round recovers')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102'], {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: [] }],
      'bd-ready-topup': null,
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed.sort()) === '["bd-101","bd-102"]', 'both complete across rounds', JSON.stringify(out.result))
    check(out.result?.stopReason === 'ready-drained', 'null top-up never affects stopReason', out.result?.stopReason)
    check(out.logs.some(l => l.includes('skipping this top-up')), 'null top-up logged as opportunistic skip')
    assertBucketsDisjoint(out.result)
  }

  scenario('top-up: an unmapped id is skipped (waits for the next planner pass)')
  {
    const canned = manyTaskCanned(['bd-101'], {
      'bd-ready-topup': { ids: ['bd-999'] },  // ready but no mapping row (created mid-round)
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(!out.trace.some(t => t.label === 'brief:bd-999'), 'unmapped id never dispatched')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'round completes normally', JSON.stringify(out.result))
    assertBucketsDisjoint(out.result)
  }

  scenario('top-up: recursion — a topped-up bead\'s merge tops up the next, bounded by the mapping')
  {
    // Dependency chain bd-101 -> bd-102 -> bd-103, all mapped at round start. Each merge's
    // top-up surfaces the next; the whole chain drains in ONE round, and the quiescence loop
    // terminates (dispatched-set bound) even though the last top-up re-lists everything.
    const canned = manyTaskCanned(['bd-101', 'bd-102', 'bd-103'], {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
      'bd-ready-topup': [{ ids: ['bd-102'] }, { ids: ['bd-103'] }, { ids: ['bd-101', 'bd-102', 'bd-103'] }],
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed.sort()) === '["bd-101","bd-102","bd-103"]', 'entire chain drained in one round', JSON.stringify(out.result))
    check(out.counts['bd-ready'] === 2, `no extra rounds needed (got ${out.counts['bd-ready']})`)
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('brief:bd-102') > idx('merge:bd-101') && idx('brief:bd-103') > idx('merge:bd-102'), 'each link dispatched after its unblocking merge')
    check(out.logs.some(l => l.includes('topped-up 2')), 'detector counts both topped-up beads', out.logs.find(l => l.startsWith('parallelism')))
    check(out.maxOpen.merge === 1, 'single-flight merge invariant held through recursive top-ups')
    assertBucketsDisjoint(out.result)
  }

  scenario('top-up: query budget exhausts, degrades to round-boundary refill losing no work')
  {
    // Chain bd-101 -> bd-102 -> bd-103 with a query cap of 1: the single allowed top-up
    // dispatches bd-102; bd-102's merge finds the budget spent, so bd-103 waits for the next
    // ROUND's refill — and still completes. No work lost, exactly one top-up query.
    const canned = manyTaskCanned(['bd-101', 'bd-102', 'bd-103'], {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-103'] }, { ids: [] }],
      'bd-ready-topup': [{ ids: ['bd-102'] }, { ids: ['bd-103'] }],
    })
    const out = await run({ args: liveArgs({ config: cfg({ topUpQueryCap: 1 }) }), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed.sort()) === '["bd-101","bd-102","bd-103"]', 'all three completed despite the exhausted budget', JSON.stringify(out.result))
    check(out.counts['bd-ready-topup'] === 2, `one query per round under the PER-ROUND cap: round 1's only allowed query + round 2's own fresh allowance (got ${out.counts['bd-ready-topup']})`)
    check(out.counts['bd-ready'] === 3, `bd-103 arrived via the next round's refill (got ${out.counts['bd-ready']} round queries)`)
    check(out.logs.some(l => l.includes('top-up query budget exhausted (1)')), 'exhaustion logged once with the tuning pointer')
    check(out.logs.some(l => l.includes('top-up queries 1/1')), 'detector reports query usage against the cap', out.logs.find(l => l.startsWith('parallelism')))
    assertBucketsDisjoint(out.result)
  }

  scenario('top-up at scale: 40-bead unblock-two graph drains in ONE round (simulation shape)')
  {
    // Each bead's merge unblocks two more (binary tree over 40 beads). The top-up canned
    // answer is a FUNCTION computing the faithful ready frontier: a bead is ready once its
    // parent's completion ledger line exists. Under the old barrier this graph needs ~6 rounds;
    // with the top-up it must drain in one, with the single-flight invariant intact throughout.
    const ids = Array.from({ length: 40 }, (_, i) => `bd-${101 + i}`)
    const readyNow = counts => ids.filter((id, k) => k === 0 || counts[`ledger-append:${ids[Math.floor((k - 1) / 2)]}`])
    const canned = manyTaskCanned(ids, {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
      'bd-ready-topup': ctx => ({ ids: readyNow(ctx.counts) }),
    })
    const out = await run({ args: liveArgs({ config: cfg({ concurrency: 14 }) }), canned, timeoutMs: 30000 })
    assertNoThrow(out)
    check(out.result?.completed.length === 40, `all 40 completed (got ${out.result?.completed.length})`)
    check(out.counts['bd-ready'] === 2, `one working round + the drained round (got ${out.counts['bd-ready']}) — ~6 rounds under the old barrier`)
    check(out.maxOpen.merge === 1, 'single-flight merge invariant held across 40 recursive top-ups')
    check(ids.every(id => (out.counts[`brief:${id}`] ?? 0) === 1), 'no double dispatch anywhere in the graph')
    check(out.logs.some(l => l.includes('topped-up 39')), 'detector counts the 39 topped-up beads', out.logs.find(l => l.startsWith('parallelism')))
    check((out.counts['bd-ready-topup'] ?? 0) <= 40, `query count within the default budget (got ${out.counts['bd-ready-topup']})`)
    assertBucketsDisjoint(out.result)
  }

  // ===== 6. round-head parallelism scenarios =====

  scenario('planner skip: a refill round with fully-mapped ids dispatches no planner')
  {
    // Round 1 maps both ids (planner enumerates ready AND blocked); round 2's ready id bd-102
    // already has a row, so the opus planner must not re-dispatch.
    const canned = manyTaskCanned(['bd-101', 'bd-102'], {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: [] }],
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['plan'] === 1, `planner dispatched once across two working rounds (got ${out.counts['plan']})`)
    check(out.logs.some(l => l.includes('already mapped — skipping the planner dispatch')), 'skip is logged')
    check(JSON.stringify(out.result?.completed.sort()) === '["bd-101","bd-102"]', 'both rounds still complete their work', JSON.stringify(out.result))
    assertBucketsDisjoint(out.result)
  }

  scenario('Close∥Ready: in-tree closures trigger the ready re-check, epic-dependent task joins the round')
  {
    // Round 1's Close closes an in-tree epic; the initial (concurrent) ready query missed the
    // task that closure unblocked, the re-check catches it.
    const canned = manyTaskCanned(['bd-101', 'bd-102'], {
      'close-epics': [{ rootClosed: false, closedThisRun: ['bd-090'] }, { rootClosed: false, closedThisRun: [] }],
      'bd-ready': [{ ids: ['bd-101'] }, { ids: [] }],
      'bd-ready-recheck': { ids: ['bd-101', 'bd-102'] },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['bd-ready-recheck'] === 1, `re-check fired exactly once, on the closure round (got ${out.counts['bd-ready-recheck']})`)
    check(JSON.stringify(out.result?.completed.sort()) === '["bd-101","bd-102"]', 'the epic-dependent task completed in round 1', JSON.stringify(out.result))
    check(out.counts['bd-ready'] === 2, `no extra round needed (got ${out.counts['bd-ready']} round queries)`)
    assertBucketsDisjoint(out.result)
  }

  scenario('Close∥Ready: null re-check keeps the original ready result (opportunistic)')
  {
    const canned = manyTaskCanned(['bd-101'], {
      'close-epics': [{ rootClosed: false, closedThisRun: ['bd-090'] }, { rootClosed: false, closedThisRun: [] }],
      'bd-ready-recheck': null,
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'round proceeds on the original ready result', JSON.stringify(out.result))
    check(out.logs.some(l => l.includes('keeping the original ready result')), 'null re-check logged as opportunistic')
    check(out.result?.stopReason === 'ready-drained', 'never a stopReason', out.result?.stopReason)
    assertBucketsDisjoint(out.result)
  }

  scenario('RESOLVE retry: clarified task completes in the SAME round')
  {
    // First implement attempt reports BLOCKED with a self-filed bead; triage RESOLVEs; the
    // same-round retry re-briefs and the second attempt succeeds — merged without a new round.
    const canned = manyTaskCanned(['bd-101'], {
      'impl:bd-101': [
        { id: 'bd-101', status: 'BLOCKED', files: [], blockerBead: 'bd-109' },
        tick({ id: 'bd-101', status: 'IMPLEMENTED', files: [] }),
      ],
      'triage:bd-101': { decision: 'RESOLVE', detail: 'use the existing constant' },
      'clarify:bd-101': { recorded: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'completed within the round', JSON.stringify(out.result))
    check(out.result?.pendingRetry.length === 0, 'pendingRetry cleared by the successful retry')
    check(out.counts['bd-ready'] === 2, `no extra round consumed (got ${out.counts['bd-ready']})`)
    check(out.counts['impl:bd-101'] === 2 && out.counts['brief:bd-101'] === 2, 'retry re-briefed and re-implemented once')
    check(out.counts['triage:bd-101'] === 1, 'C-2 allowance spent exactly once')
    const impl = promptOf(out.trace, 'impl:bd-101')
    check(impl?.includes('bd comments bd-101'), 'implement dispatch tells the implementer to read recorded clarifications', impl)
    assertBucketsDisjoint(out.result)
  }

  scenario('RESOLVE retry: still-blocked retry bounces to ESCALATE within the round (C-2 bound intact)')
  {
    const canned = manyTaskCanned(['bd-101'], {
      'impl:bd-101': { id: 'bd-101', status: 'BLOCKED', files: [], blockerBead: 'bd-109' },  // BLOCKED every attempt
      'triage:bd-101': { decision: 'RESOLVE', detail: 'try the constant' },  // RESOLVE every time — C-2 must bounce the second
      'clarify:bd-101': { recorded: true },
      'notify:bd-101': { sent: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.escalated) === '["bd-101"]', 'second RESOLVE bounced to quarantine', JSON.stringify(out.result))
    check(out.result?.pendingRetry.length === 0, 'not left pending')
    check(out.counts['impl:bd-101'] === 2, `exactly one retry, then the bounce (got ${out.counts['impl:bd-101']} implements)`)
    check(out.counts['bd-ready'] === 2, 'all within one working round')
    assertBucketsDisjoint(out.result)
  }

  // ===== 7. failure-visibility scenarios (2nd downstream feedback round) =====

  scenario('dryRun: an unregistered top-up stub key is FATAL (config errors loud where they are cheap)')
  {
    const args = JSON.parse(JSON.stringify(canonicalArgs))
    delete args.prompts.stubs['bd-ready-topup']
    const out = await run({ args })
    check(!!out.error, 'run fails instead of silently degrading')
    check(String(out.error).includes('no stub for key bd-ready-topup'), 'failure names the missing key', String(out.error).slice(0, 200))
  }

  scenario('live run: a failing top-up is swallowed AND logged with the exception, round completes')
  {
    const canned = oneTaskCanned()
    delete canned['bd-ready-topup']  // the top-up dispatch will throw ("no canned answer")
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'the round completed its real work', JSON.stringify(out.result))
    check(out.logs.some(l => l.includes('top-up failed and was swallowed') && l.includes('bd-ready-topup')), 'the swallowed failure is logged with its cause', out.logs.find(l => l.includes('swallowed')))
    assertBucketsDisjoint(out.result)
  }

  scenario('chain rejection is logged with the exception, never vanished (all chain paths share chainCatch)')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102'], {})
    delete canned['brief:bd-102']  // bd-102's chain dies at its first dispatch
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'the sibling still completed and merged', JSON.stringify(out.result))
    const rejLog = out.logs.find(l => l.includes('chain for bd-102 REJECTED'))
    check(!!rejLog, 'the dead chain is logged by id')
    check(!!rejLog && rejLog.includes('no canned answer for label brief:bd-102'), 'the log carries the actual exception, not just the fact of failure', rejLog)
    assertBucketsDisjoint(out.result)
  }

  // ===== 8. issue #3 / #4 batch =====

  scenario('empty review package (issue #3 defect 1): INVALID is re-dispatched once, never recorded clean')
  {
    const canned = oneTaskCanned({
      'review:bd-101': { id: 'bd-101', status: 'INVALID', finding: 'pwd=/integration; EMPTY RANGE' },
      'review:bd-101:retry': { id: 'bd-101', status: 'CLEAN' },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['review:bd-101'] === 1 && out.counts['review:bd-101:retry'] === 1, 'exactly one fresh re-dispatch of the review')
    check(!out.trace.some(t => t.label.startsWith('fix:bd-101')), 'INVALID never enters the fix loop')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'merged on the valid retry', JSON.stringify(out.result))
    check(out.logs.some(l => l.includes('INVALID') && l.includes('never recorded as clean')), 'the invalid package is logged')
    const review = promptOf(out.trace, 'review:bd-101')
    check(review?.includes('cd ') && review.includes('EMPTY-PACKAGE RULE') && review.includes('INVALID'), 'review prompt pins the working directory and the empty-package rule', review?.slice(0, 200))
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
    check(!out.trace.some(t => t.label === 'merge:bd-101'), 'never merged')
    check(JSON.stringify(out.result?.escalated) === '["bd-101"]', 'escalated via the blocker path', JSON.stringify(out.result))
    check(out.counts['triage:bd-101'] === 1, 'triage saw the pipeline defect')
    assertBucketsDisjoint(out.result)
  }

  scenario('recurring deferred minors (issue #3 defect 2): one signature across 3 tasks writes ONE cluster line')
  {
    const ids = ['bd-101', 'bd-102', 'bd-103']
    const canned = manyTaskCanned(ids, {
      'review:bd-101': { id: 'bd-101', status: 'CLEAN', minors: ['review-package resolved HEAD in /wt/integration (104 bytes)'] },
      'review:bd-102': { id: 'bd-102', status: 'CLEAN', minors: ['review-package resolved HEAD in /wt/integration (104 bytes)', 'unrelated nit'] },
      'review:bd-103': { id: 'bd-103', status: 'CLEAN', minors: ['Review-package resolved HEAD in /wt/integration (105 bytes)'] },
      'ledger-minor:bd-101:1': { appended: true }, 'ledger-minor:bd-102:1': { appended: true }, 'ledger-minor:bd-102:2': { appended: true }, 'ledger-minor:bd-103:1': { appended: true },
      'ledger-recurring:1': { appended: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['ledger-recurring:1'] === 1 && !out.counts['ledger-recurring:2'], 'exactly one cluster line, reported once')
    const line = promptOf(out.trace, 'ledger-recurring:1')
    check(!!line && line.includes('Recurring minor: ×3 across 3 task(s)'), 'cluster line carries count and task spread', line)
    check(out.logs.some(l => l.startsWith('RECURRING MINOR ×3')), 'cluster is logged loudly')
    const fr = promptOf(out.trace, 'final-review')
    check(!!fr && fr.includes('Recurring minor:') && fr.includes('triage those FIRST'), 'final reviewer is told to triage clusters first')
    assertBucketsDisjoint(out.result)
  }

  scenario('permission refusal (issue #3 defect 3): BLOCKED_AUTH quarantines with no bead, no triage, run continues')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102'], {
      'impl:bd-101': { id: 'bd-101', status: 'BLOCKED_AUTH', finding: 'git worktree add .worktrees/x' },
      'ledger-append:bd-101': { appended: true },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.escalated) === '["bd-101"]' && JSON.stringify(out.result?.completed) === '["bd-102"]', 'refused task quarantined, sibling completed', JSON.stringify(out.result))
    check(!out.trace.some(t => t.label.startsWith('triage:') || t.label.startsWith('missing-blocker:') || t.label.startsWith('notify:')), 'no blocker bead, no triage, no notify')
    check(!out.trace.some(t => ['review:bd-101', 'merge:bd-101'].includes(t.label)), 'never reviewed or merged')
    check(JSON.stringify(out.result?.authRefused) === JSON.stringify([{ id: 'bd-101', refused: 'git worktree add .worktrees/x' }]), 'authRefused returned to the caller', JSON.stringify(out.result?.authRefused))
    const ledger = promptOf(out.trace, 'ledger-append:bd-101')
    check(!!ledger && ledger.includes('BLOCKED-AUTH — permission refused'), 'ledger line starts with BLOCKED (resume treats it as historical, fresh attempt next run)', ledger)
    check(out.logs.some(l => l.startsWith('AUTH-REFUSED bd-101')), 'logged loudly')
    const impl = promptOf(out.trace, 'impl:bd-101')
    check(!!impl && impl.includes('PERMISSION REFUSALS') && impl.includes('BLOCKED_AUTH') && impl.includes('ONE equivalent form'), 'implementer carries the auth-refusal rule (one workaround, then stop)')
    assertBucketsDisjoint(out.result)
  }

  scenario('permission refusal at the merge: authRefused on the MERGE report takes the same path')
  {
    const canned = oneTaskCanned({ 'merge:bd-101': { id: 'bd-101', merged: false, authRefused: 'git merge --no-ff task-bd-101' } })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(JSON.stringify(out.result?.escalated) === '["bd-101"]' && out.result?.authRefused.length === 1, 'quarantined + recorded', JSON.stringify(out.result))
    check(!out.trace.some(t => t.label.startsWith('triage:')), 'no triage')
    const merge = promptOf(out.trace, 'merge:bd-101')
    check(!!merge && merge.includes('authRefused') && merge.includes('merge-base SHA the gate ran against'), 'merge prompt maps refusals to authRefused and stamps blockers with the merge-base', merge?.slice(-300))
    assertBucketsDisjoint(out.result)
  }

  scenario('detector persistence (issue #3 defect 6): every completed round writes a Detector: ledger line')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102'], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: [] }] })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['ledger-append:detector'] === 2, `one detector line per working round (got ${out.counts['ledger-append:detector']})`)
    const d = out.trace.filter(t => t.label === 'ledger-append:detector').map(t => t.prompt)
    check(d[0]?.includes('Detector: round 1 —') && d[1]?.includes('Detector: round 2 —') && d[1].includes('cap 4'), 'lines are round-stamped and carry the detector fields', d[1]?.slice(0, 200))
    assertBucketsDisjoint(out.result)
  }

  scenario('edge audit (issue #3 DQ C): armed by two below-cap rounds, report-only, bounded by edgeAuditCap')
  {
    const ids = ['bd-101', 'bd-102', 'bd-103', 'bd-104']
    const canned = manyTaskCanned(ids, {
      'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: ['bd-103'] }, { ids: ['bd-104'] }, { ids: [] }],
      'edge-audit:1': { openLeaves: 3, depth: 3, achievableWidth: 1, suspectEdges: [{ from: 'bd-104', to: 'bd-103', reason: 'consumer reads nothing the producer writes' }], summary: 'graph-bound' },
    })
    const out = await run({ args: liveArgs({ config: cfg({ edgeAuditCap: 1 }) }), canned })
    assertNoThrow(out)
    check(out.counts['edge-audit:1'] === 1 && !out.counts['edge-audit:2'], `one audit after round 2, none after round 4 (cap 1) (got ${out.counts['edge-audit:1']}, ${out.counts['edge-audit:2']})`)
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('edge-audit:1') > idx('merge:bd-102') && idx('edge-audit:1') < idx('brief:bd-103'), 'audit fires at the end of round 2, before round 3 dispatches')
    const line = promptOf(out.trace, 'ledger-append:edge-audit:1')
    check(!!line && line.includes('achievable width 1 vs cap 4') && line.includes('bd-104→bd-103'), 'ledger line carries achievable width and the suspect edge', line)
    const audit = promptOf(out.trace, 'edge-audit:1')
    check(!!audit && audit.includes('READ-ONLY') && audit.includes('bd list --json') && audit.includes('Do NOT edit'), 'audit prompt is read-only and reads the bulk dump')
    check(out.logs.some(l => l.startsWith('EDGE AUDIT 1/1') && l.includes('report-only')), 'audit is logged as report-only')
    check(out.result?.completed.length === 4, 'all four still complete')
    assertBucketsDisjoint(out.result)
  }

  scenario('edge audit: edgeAuditCap 0 disables it; the default never fires on a cap-sized frontier')
  {
    const canned = manyTaskCanned(['bd-101', 'bd-102', 'bd-103'], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: ['bd-103'] }, { ids: [] }] })
    const out = await run({ args: liveArgs({ config: cfg({ edgeAuditCap: 0 }) }), canned })
    assertNoThrow(out)
    check(!out.trace.some(t => t.label.startsWith('edge-audit')), 'no audit dispatched with cap 0')
    const full = manyTaskCanned(['bd-101', 'bd-102'], { 'bd-ready': [{ ids: ['bd-101'] }, { ids: ['bd-102'] }, { ids: [] }] })
    const out2 = await run({ args: liveArgs({ config: cfg({ concurrency: 1 }) }), canned: full })
    assertNoThrow(out2)
    check(!out2.trace.some(t => t.label.startsWith('edge-audit')), 'frontier == cap every round: streak never arms')
  }

  scenario('declared gate + sweep (issue #3 doc gap 2 / #4 defect 5): exact commands reach the merge and the Finish sweep')
  {
    const canned = oneTaskCanned({ 'sweep': 'abc1234 — 100 passed, 0 failed, 0 errors, 1 skipped; failing: none; command: nice -n 10 pytest -q', 'ledger-append:sweep': { appended: true } })
    const out = await run({ args: liveArgs({ config: cfg({ gate: 'nice -n 10 pytest tests/unit -q', sweep: 'nice -n 10 pytest -q' }) }), canned })
    assertNoThrow(out)
    const merge = promptOf(out.trace, 'merge:bd-101')
    check(!!merge && merge.includes('EXACTLY as written') && merge.includes('nice -n 10 pytest tests/unit -q') && !merge.includes('run the project test command'), 'merge gate runs the declared command, not the default')
    const sweep = promptOf(out.trace, 'sweep')
    check(!!sweep && sweep.includes('nice -n 10 pytest -q') && sweep.includes('MEASUREMENT INVALID'), 'sweep prompt carries the exact command and the validity floor')
    const idx = label => out.trace.findIndex(t => t.label === label)
    check(idx('sweep') > idx('merge:bd-101') && idx('sweep') < idx('final-review'), 'sweep runs after the last merge and before the final review')
    check(promptOf(out.trace, 'ledger-append:sweep')?.includes('Sweep: abc1234 — 100 passed'), 'sweep summary lands on the ledger')
    check(promptOf(out.trace, 'final-review')?.includes('per-branch sweep ran against this tip and reported: abc1234'), 'final reviewer reads the sweep result')
    check(out.result?.sweep?.startsWith('abc1234'), 'sweep summary returned to the caller')
    const plain = await run({ args: liveArgs(), canned: oneTaskCanned() })
    assertNoThrow(plain)
    check(!plain.trace.some(t => t.label === 'sweep'), 'no sweep dispatched when none is declared')
    check(promptOf(plain.trace, 'merge:bd-101')?.includes('run the project test command'), 'undeclared gate keeps the default wording')
    check(promptOf(plain.trace, 'final-review')?.includes('No per-branch sweep was declared'), 'final reviewer is told no sweep ran')
  }

  scenario('post-rebase seam (issue #4 DQ1): overlap → one scoped review → merge re-dispatched seam-cleared')
  {
    const canned = oneTaskCanned({
      'merge:bd-101': { id: 'bd-101', merged: false, seamOverlap: ['src/a.js'], head: SHA('c'), mergeBase: SHA('b') },
      'seam-review:bd-101': { id: 'bd-101', status: 'CLEAN' },
      'merge:bd-101:seam-cleared': { id: 'bd-101', merged: true, head: SHA('c'), mergeBase: SHA('b') },
    })
    const out = await run({ args: liveArgs(), canned })
    assertNoThrow(out)
    check(out.counts['seam-review:bd-101'] === 1 && out.counts['merge:bd-101:seam-cleared'] === 1 && !out.counts['fix:bd-101:seam'], 'one seam review, no fix, one seam-cleared merge')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'merged after the seam review', JSON.stringify(out.result))
    const seam = promptOf(out.trace, 'seam-review:bd-101')
    check(!!seam && seam.includes('src/a.js') && seam.includes('do not re-review that') && seam.includes(SHA('b')), 'seam review is scoped to the overlapping files and the post-rebase range')
    const m2 = promptOf(out.trace, 'merge:bd-101:seam-cleared')
    check(!!m2 && m2.includes('ALREADY rebased') && !m2.includes('POST-REBASE SEAM CHECK'), 'second merge skips the seam check')
    const m1 = promptOf(out.trace, 'merge:bd-101')
    check(!!m1 && m1.includes('POST-REBASE SEAM CHECK') && m1.includes('seamOverlap'), 'first merge carries the seam check')
    check(out.maxOpen.merge === 1, 'single-flight held')
    assertBucketsDisjoint(out.result)
  }

  scenario('post-rebase seam: NEEDS_FIX gets exactly one seam fix, then the gate — never a second seam round')
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
    check(!!fix && fix.includes('parseInput()') && fix.includes('ONE bounded seam fix'), 'seam fix dispatch carries the finding')
    check(JSON.stringify(out.result?.completed) === '["bd-101"]', 'merged after the fix', JSON.stringify(out.result))
    assertBucketsDisjoint(out.result)
  }

  // ===== summary =====
  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
