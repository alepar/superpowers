// dispatch-text.mjs — the exact dispatch text the Workflow coordinator would send, for the
// ordinary-subagent coordinator (coordinator-subagents.md). Its prompt builders live in
// coordinator.js; this loads that script with stubbed runtime hooks and calls them, so the two
// paths never drift.
// Invoked through ./dispatch-text (bash wrapper, checks for node). Usage: --help.
// Exit codes: 0 ok, 2 bad input, 3 coordinator.js could not be loaded.
//
// Loading: coordinator.js is a Workflow script body (top-level await, no exports). Its prompt
// builders are function declarations, hoisted over the whole body, and the state they read is
// declared before the round loop. So a `return` of the builders goes just before the first top-level
// `while (true) {`; the rest of the body stays in place, unreachable. Everything before the return runs
// against an `agent` stub that returns null (the Resume ledger read degrades as on a null dispatch).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, lstatSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const codeSkill = resolve(here, '..')
const skillsRoot = resolve(codeSkill, '..')

const USAGE = `usage: dispatch-text --ledger <progress.md> [--stdout | --out <file>] <kind> [options]

Writes the dispatch text for one agent to <ledger dir>/dispatch/<label>.md (or --out) and prints
its path; spawn the agent with "Read <path> and follow it exactly." --stdout prints the text.
Run, epic, branch, integration worktree and mergeCheck come from the ledger's last Launch: line.

kinds and options:
  implement         --id ID --n N [--parents P1,P2] [--reentry] [--recut]
  review            --id ID --n N --base SHA --head SHA [--result-file F]
                    (verification-only: the implementer JSON RESULT supplies completionKind,
                    sourceTree, evidence and requiredLiveChecks)
  verification-close --id ID --result-file F (the accepted verification basis)
  fix               --id ID --n N --base SHA --kind review|seam|check --finding-file F
  seam-review       --id ID --n N --base SHA --merge-base SHA --head SHA --overlap F1,F2
                    (an overlap entry "consumes <id>" names a consumed blocker, not a file)
  check-fix-review  --id ID --n N --pre-fix-head SHA --head SHA --errors-file F
  merge             --id ID --n N --base SHA [--stacked] [--seam-cleared] [--review-bead ID]
                    [--resolved-bead ID] [--consumes ID1,ID2]
  plan              --ids ID1,ID2 [--mode ready|rest|refill] [--reentry-ids ID1,ID2]
  triage            --id ID --blocker BEAD
  check-evidence    --results-file F
                    (JSON array of {dispatch, result} replies; outputs the shared Workflow
                    classification, retaining source/check provenance and evidence gaps)
  assemble          --consumer final-review|roast-code|history|assess --instance I
                    [--threshold N] [--base SHA] [--head SHA] [--spec P1,P2]
  bind-review-source --read | --base SHA --head SHA [--artifact PATH]
                    (persist immutable invocation source; refuse existing artifact writes)
  final-review      --mode single|cluster|seam|stub --base SHA --head SHA [--dir D] [--capped] [--sweep F|deferred]
                    [--metrics F] [--cluster N --name NAME] [--reviewed N1,N2|none] [--unreviewed F]
                    (single: --sweep/--metrics default to the ledger's last Sweep: line and last four
                    Metrics: lines; cluster needs --dir --cluster --name; seam needs --dir --reviewed,
                    the clusters whose review returned a verdict; stub needs --reviewed --unreviewed;
                    --unreviewed F holds one unreviewed entry per line)

common options:
  --plan <file>        the plan file (default: <ledger dir>/<epic>-plan.md)
  --test-paths P1,P2   config.testPaths, when the run set one
  --run-tag T          groups the enclosing run (default: the Launch: line's runTag, else the epic)
  --invocation-id I     must match the persisted Launch invocationId for review output
  --epic, --branch, --worktree, --merge-check   override the Launch: line`

const FLAGS = new Set(['stdout', 'reentry', 'recut', 'stacked', 'seam-cleared', 'capped', 'help', 'read'])
function fail(msg) { process.stderr.write(`dispatch-text: ${msg}\n`); process.exit(2) }
function parse(argv) {
  const o = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) { o._.push(a); continue }
    const k = a.slice(2)
    if (FLAGS.has(k)) { o[k] = true; continue }
    if (i + 1 >= argv.length) fail(`${a} needs a value`)
    o[k] = argv[++i]
  }
  return o
}
const list = s => (s ? String(s).split(',').map(x => x.trim()).filter(Boolean) : [])

// `Launch: mechanism ordinary-subagents · epic <id> · branch <b> · integrationWorktree <p> · … ·
// mergeCheck <cmd or none>`; the Workflow form `Launch: args {json}` is read too.
function launchFrom(ledgerText) {
  const lines = ledgerText.split('\n').filter(l => l.trim().startsWith('Launch:'))
  if (!lines.length) return {}
  const line = lines[lines.length - 1].trim().replace(/^Launch:\s*/, '')
  if (line.startsWith('args ')) {
    try {
      const a = JSON.parse(line.slice(5))
      return { epic: a.epicId, branch: a.integrationBranch, worktree: a.integrationWorktree, runTag: a.runTag, invocationId: a.invocationId, sweep: a.deferSweep ? 'deferred' : undefined, mergeCheck: a.config?.mergeCheck, testPaths: a.config?.testPaths, reviewBase: a.reviewBase, reviewHead: a.reviewHead }
    } catch { return {} }
  }
  const f = {}
  for (const part of line.split(' · ')) {
    const m = part.match(/^(\S+)\s+(.*)$/)
    if (m) f[m[1]] = m[2].trim()
  }
  return { epic: f.epic, branch: f.branch, worktree: f.integrationWorktree, runTag: f.runTag, invocationId: f.invocationId, mergeCheck: f.mergeCheck, sweep: f.sweep, reviewBase: f.reviewBase, reviewHead: f.reviewHead }
}

// The ledger's last `Sweep: ` line (text after the prefix) and the last four `Metrics: ` lines (the
// Workflow appends exactly four, in one batch), as Finish passes them to the final-review builder.
const lastSweep = t => { const m = t.split('\n').filter(l => l.startsWith('Sweep: ')); return m.length ? m[m.length - 1].slice(7).trim() : null }
const lastMetrics = t => t.split('\n').filter(l => l.startsWith('Metrics: ')).slice(-4)

function loadBuilders(cfg) {
  let src
  try { src = readFileSync(join(codeSkill, 'coordinator.js'), 'utf8') } catch (e) { console.error(`dispatch-text: cannot read coordinator.js: ${e.message}`); process.exit(3) }
  const cut = src.search(/^while \(true\) \{$/m)
  if (cut < 0) { console.error('dispatch-text: coordinator.js has no top-level `while (true) {` round loop to cut at'); process.exit(3) }
  const ret = `return { SWEEP_DEFERRED, planPrompt, implementPrompt, taskReviewPrompt, fixPrompt, seamReviewPrompt, checkFixReviewPrompt, finalReviewPrompt, finalClusterReviewPrompt, finalSeamReviewPrompt, finalReviewStubPrompt, mergePrompt, triagePrompt, assemblePrompt, reviewBeadOf, mergeCheckCommand, recordCheckEvidence, classifyCheckEvidence, verificationClosePrompt, verificationProblem }\n`
  const body = (src.slice(0, cut) + ret + src.slice(cut)).replace(/^export const meta/m, 'const meta')
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  const fn = new AsyncFunction('args', 'agent', 'log', 'phase', 'pipeline', 'parallel', 'budget', 'workflow', body)
  const noop = () => {}
  return fn(cfg, async () => null, noop, noop, async () => [], async () => [], undefined, undefined)
}

const o = parse(process.argv.slice(2))
if (o.help || !o._.length) { console.log(USAGE); process.exit(o.help ? 0 : 2) }
const kind = o._[0]
if (!o.ledger) fail('--ledger is required')
let ledgerText = ''
try { ledgerText = readFileSync(o.ledger, 'utf8') } catch (e) { fail(`cannot read ledger ${o.ledger}: ${e.message}`) }
const L = launchFrom(ledgerText)
const epic = o.epic || L.epic, branch = o.branch || L.branch, worktree = o.worktree || L.worktree
if (!epic || !branch || !worktree) fail('epic, branch and integration worktree are needed: no Launch: line names them, and no --epic/--branch/--worktree was given')
const mergeCheck = o['merge-check'] ?? L.mergeCheck
const testPaths = o['test-paths'] ? list(o['test-paths']) : L.testPaths
const ws = dirname(resolve(o.ledger))
const runTag = o['run-tag'] || L.runTag || epic
const invocationId = L.invocationId
const reviewOutput = kind === 'bind-review-source' || kind === 'final-review' || (kind === 'assemble' && o.consumer === 'final-review')
if (reviewOutput && (typeof invocationId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(invocationId))) fail('review output needs a persisted filesystem-safe Launch invocationId')
if (o['invocation-id'] !== undefined && o['invocation-id'] !== invocationId) fail('--invocation-id must match the persisted Launch invocationId')
// Source facts use the existing compact Recovery transport (Launch lines are elided by digest).
const fullCommit = v => typeof v === 'string' && /^[0-9a-f]{40,64}$/.test(v)
let boundSource = null
if (reviewOutput) for (const line of ledgerText.split('\n')) {
  if (line.startsWith('Launch:')) {
    const launch = launchFrom(line)
    if (launch.invocationId !== invocationId || (!launch.reviewBase && !launch.reviewHead)) continue
    if (!fullCommit(launch.reviewBase) || !fullCommit(launch.reviewHead)) fail('invalid captured source in persisted Launch')
    if (boundSource && (boundSource.base !== launch.reviewBase || boundSource.head !== launch.reviewHead)) fail('conflicting persisted invocation source bindings; preserve bundle')
    boundSource = { invocationId, base: launch.reviewBase, head: launch.reviewHead }
    continue
  }
  if (!line.startsWith('Recovery:')) continue
  let r
  try { r = JSON.parse(line.slice(9)) } catch { continue }
  const source = r.data?.reviewSource
  if (source?.invocationId !== invocationId && r.id !== 'review-source:' + invocationId) continue
  if (r.version !== 1 || r.kind !== 'deferred' || r.operation !== 'record' || !source || source.invocationId !== invocationId || !fullCommit(source.base) || !fullCommit(source.head)) fail('invalid persisted invocation source binding; preserve bundle as an evidence gap')
  if (boundSource && (boundSource.base !== source.base || boundSource.head !== source.head)) fail('conflicting persisted invocation source bindings; preserve bundle')
  boundSource = source
}
if (reviewOutput) {
  if (boundSource && ((o.base && o.base !== boundSource.base) || (o.head && o.head !== boundSource.head))) fail('invocation source mismatch; preserve existing partial bundle and use a fresh invocation identity for new source')
  if (kind === 'bind-review-source') {
    if (o.read) {
      if (!boundSource) fail('missing persisted invocation source binding')
      console.log(JSON.stringify(boundSource))
      process.exit(0)
    }
    if (!fullCommit(o.base) || !fullCommit(o.head)) fail('bind-review-source needs --base and --head as full captured commits (or --read)')
    if (!boundSource) {
      const prefix = 'final-review-' + invocationId
      const artifacts = readdirSync(ws).some(n => n === prefix + '.md' || n.startsWith(prefix + '.md.') || n.startsWith(prefix + '.cluster-'))
      let assembled = false
      try { assembled = readdirSync(join(ws, 'assembled')).some(n => n.startsWith(prefix + '-')) } catch (e) { if (e.code !== 'ENOENT') fail(e.message) }
      if (artifacts || assembled) fail('missing invocation source binding for existing partial bundle; preserve evidence gap')
      boundSource = { invocationId, base: o.base, head: o.head }
      const record = { version: 1, id: 'review-source:' + invocationId, kind: 'deferred', operation: 'record', reason: 'immutable invocation review source', evidence: [resolve(o.ledger)], data: { reviewSource: boundSource } }
      try { writeFileSync(o.ledger, '\nRecovery: ' + JSON.stringify(record) + '\n', { flag: 'a' }) } catch (e) { fail('source binding persistence unavailable: ' + e.message) }
    }
    if (o.artifact) {
      for (const path of [o.artifact, o.artifact + '.diff']) {
        try { lstatSync(path); fail('partial artifact already exists; preserve it without rewriting: ' + path) } catch (e) { if (e.code !== 'ENOENT') fail(e.message) }
      }
    }
    console.log(JSON.stringify(boundSource))
    process.exit(0)
  }
  if (!boundSource && (!fullCommit(o.base) || !fullCommit(o.head))) fail('missing invocation source binding or full captured --base and --head; bind before artifact writes')
}
const planPath = o.plan || join(ws, `${epic}-plan.md`)

const B = await loadBuilders({
  epicId: epic, integrationBranch: branch, integrationWorktree: worktree, skillsRoot, runTag, ...(reviewOutput ? { invocationId } : {}), dryRun: false,
  config: { mergeCheck: mergeCheck && !/^none\b/.test(mergeCheck) ? mergeCheck : 'none', ...(testPaths ? { testPaths } : {}) },
})

const need = (...ks) => { for (const k of ks) if (!o[k]) fail(`${kind} needs --${k}`) }
const commitId = value => {
  if (!/^[0-9a-f]{7,64}$/.test(String(value))) fail(`captured commit id required, got ${value}`)
  return value
}
const art = n => ({
  brief: `${ws}/task-${n}-brief.md`,
  report: `${ws}/task-${n}-report.md`,
  review: `${ws}/task-${n}-review.md`,
  diff: tag => `${ws}/task-${n}-review-${tag}.diff`,
})
const taskWorktree = id => `${worktree}/.worktrees/${String(branch).replace(/\//g, '-')}--task-${id}`
const task = () => ({ id: o.id, n: Number(o.n), branch: taskWorktree(o.id), base: o.base, head: o.head })
const readLines = k => readArg(k).split('\n').map(l => l.trim()).filter(Boolean)
const readArg = k => { try { return readFileSync(o[k], 'utf8').trim() } catch (e) { fail(`cannot read --${k} ${o[k]}: ${e.message}`) } }

let text, label
switch (kind) {
  case 'check-evidence': {
    need('results-file')
    let replies
    try { replies = JSON.parse(readArg('results-file')) } catch (e) { fail(`invalid --results-file JSON: ${e.message}`) }
    if (!Array.isArray(replies) || !replies.every(r => r && typeof r.dispatch === 'string' && /^[^:]+:[^:]+/.test(r.dispatch) && r.result && typeof r.result === 'object' && !Array.isArray(r.result))) fail('--results-file must be an array of {dispatch, result} replies')
    for (const r of replies) B.recordCheckEvidence(r.result, r.dispatch)
    text = JSON.stringify(B.classifyCheckEvidence(), null, 2)
    label = 'check-evidence'
    break
  }
  case 'implement':
    need('id', 'n')
    text = B.implementPrompt(planPath, o.id, Number(o.n), branch, art(o.n), { parents: list(o.parents), reentry: !!o.reentry, recut: !!o.recut })
    label = `impl-${o.id}`
    break
  case 'verification-close': {
    need('id', 'result-file')
    let basis
    try { basis = JSON.parse(readArg('result-file')) } catch (e) { fail('invalid --result-file JSON: ' + e.message) }
    const problem = B.verificationProblem(basis, basis)
    if (problem || basis.reviewStatus !== 'CLEAN' || !basis.reportPath?.trim() || !basis.reviewPath?.trim()) fail(problem || 'independent verification report and review paths required')
    text = B.verificationClosePrompt(o.id, basis)
    label = 'close-only-' + o.id
    break
  }
  case 'review': {
    need('id', 'n', 'base', 'head')
    commitId(o.base); commitId(o.head)
    let outcome = {}
    if (o['result-file']) {
      try { outcome = JSON.parse(readArg('result-file')) } catch (e) { fail('invalid --result-file JSON: ' + e.message) }
      if (!outcome || typeof outcome !== 'object' || Array.isArray(outcome)) fail('--result-file must hold a RESULT object')
    }
    text = B.taskReviewPrompt({ ...outcome, ...task() }, planPath, art(o.n))
    label = `review-${o.id}`
    break
  }
  case 'fix': {
    need('id', 'n', 'base', 'kind', 'finding-file')
    if (!['review', 'seam', 'check'].includes(o.kind)) fail('--kind is review, seam or check')
    text = B.fixPrompt(task(), readArg('finding-file'), art(o.n), o.kind)
    label = o.kind === 'review' ? `fix-${o.id}` : `fix-${o.id}-${o.kind}`
    break
  }
  case 'seam-review':
    need('id', 'n', 'base', 'merge-base', 'head', 'overlap')
    commitId(o.base); commitId(o['merge-base']); commitId(o.head)
    text = B.seamReviewPrompt(task(), { seamOverlap: list(o.overlap), mergeBase: o['merge-base'], head: o.head }, branch, art(o.n))
    label = `seam-review-${o.id}`
    break
  case 'check-fix-review':
    need('id', 'n', 'pre-fix-head', 'head', 'errors-file')
    commitId(o['pre-fix-head']); commitId(o.head)
    text = B.checkFixReviewPrompt(task(), o['pre-fix-head'], readArg('errors-file'), art(o.n))
    label = `check-fix-review-${o.id}`
    break
  case 'merge': {
    need('id', 'n', 'base')
    if (o['review-bead']) B.reviewBeadOf.set(o.id, o['review-bead'])
    const r = { ...task(), stacked: !!o.stacked, seamCleared: !!o['seam-cleared'], composedWith: list(o.consumes) }
    text = B.mergePrompt(r, branch, worktree, o['resolved-bead'] || null, B.mergeCheckCommand, null)
    label = `merge-${o.id}`
    break
  }
  case 'plan': {
    need('ids')
    const mode = o.mode || 'refill'
    if (!['ready', 'rest', 'refill'].includes(mode)) fail('--mode is ready, rest or refill')
    text = B.planPrompt(epic, list(o.ids), `${epic}-plan.md`, list(o['reentry-ids']), mode)
    label = `plan-${mode}`
    break
  }
  case 'triage':
    need('id', 'blocker')
    text = B.triagePrompt(o.id, o.blocker, planPath)
    label = `triage-${o.id}`
    break
  case 'assemble': {
    need('consumer', 'instance')
    if (!['final-review', 'roast-code', 'history', 'assess'].includes(o.consumer)) fail('--consumer is final-review, roast-code, history or assess')
    const opts = { specPaths: list(o.spec), base: o.base || (reviewOutput ? boundSource?.base : L.reviewBase), head: o.head || (reviewOutput ? boundSource?.head : L.reviewHead) }
    if (o.threshold !== undefined) { if (!/^\d+$/.test(o.threshold)) fail('--threshold is a non-negative integer'); opts.threshold = Number(o.threshold) }
    if (['final-review', 'roast-code'].includes(o.consumer) && (!opts.base || !opts.head)) fail('assemble needs captured --base and --head (or Launch reviewBase/reviewHead)')
    if (['final-review', 'roast-code'].includes(o.consumer)) { commitId(opts.base); commitId(opts.head) }
    text = B.assemblePrompt(o.consumer, o.instance, opts)
    label = `assemble-${o.consumer}-${o.consumer === 'final-review' ? invocationId + '-' : ''}${o.instance}`
    break
  }
  case 'final-review': {
    need('mode')
    if (!['single', 'cluster', 'seam', 'stub'].includes(o.mode)) fail('--mode is single, cluster, seam or stub')
    const source = { base: o.base || (reviewOutput ? boundSource?.base : L.reviewBase), head: o.head || (reviewOutput ? boundSource?.head : L.reviewHead) }
    if (o.mode !== 'stub' && source.base && source.head) { commitId(source.base); commitId(source.head) }
    const reviewPath = `${worktree}/.superpowers/sdd/${epic}-plan/final-review-${invocationId}.md`
    const clusterPath = n => `${worktree}/.superpowers/sdd/${epic}-plan/final-review-${invocationId}.cluster-${n}.md`
    const posInt = k => { if (!/^[1-9]\d*$/.test(String(o[k]))) fail(`--${k} is a positive integer`); return Number(o[k]) }
    // --reviewed N1,N2|none: the cluster ordinals whose review returned a verdict, in the order given.
    const reviewedPaths = () => {
      need('reviewed')
      if (o.reviewed === 'none') return []
      const ns = list(o.reviewed)
      if (!ns.length || !ns.every(n => /^[1-9]\d*$/.test(n))) fail('--reviewed is positive cluster numbers, comma-separated, or none')
      return ns.map(n => clusterPath(Number(n)))
    }
    if (o.mode === 'single') {
      if (!source.base || !source.head) fail('final-review needs captured --base and --head (or Launch reviewBase/reviewHead)')
      const sweep = o.sweep === 'deferred' ? B.SWEEP_DEFERRED : o.sweep ? readArg('sweep')
        : lastSweep(ledgerText) ?? (L.sweep === 'deferred' ? B.SWEEP_DEFERRED : null)
      const metrics = o.metrics ? readLines('metrics') : lastMetrics(ledgerText)
      text = B.finalReviewPrompt(epic, branch, worktree, '.superpowers/sdd/' + epic + '-plan/progress.md', planPath, sweep, metrics, { dir: o.dir || null, capped: !!o.capped, reviewPath, base: source.base, head: source.head })
      label = `final-review-${invocationId}-single`
    } else if (o.mode === 'cluster') {
      need('dir', 'cluster', 'name')
      if (!source.base || !source.head) fail('final-review needs captured --base and --head (or Launch reviewBase/reviewHead)')
      const n = posInt('cluster')
      text = B.finalClusterReviewPrompt(n, o.name, o.dir, clusterPath(n), epic, branch, worktree, source)
      label = `final-review-${invocationId}-cluster-${n}`
    } else if (o.mode === 'seam') {
      need('dir')
      const paths = reviewedPaths()
      if (!source.base || !source.head) fail('final-review needs captured --base and --head (or Launch reviewBase/reviewHead)')
      text = B.finalSeamReviewPrompt(o.dir, paths, reviewPath, epic, branch, worktree, o.unreviewed ? readLines('unreviewed') : [], source)
      label = `final-review-${invocationId}-seam`
    } else {
      need('unreviewed')
      text = B.finalReviewStubPrompt(reviewedPaths(), readLines('unreviewed'), reviewPath, source)
      label = `final-review-${invocationId}-stub`
    }
    break
  }
  default:
    fail(`unknown kind ${kind}\n${USAGE}`)
}

if (o.stdout) { process.stdout.write(text + '\n'); process.exit(0) }
const out = o.out || join(ws, 'dispatch', `${label}.${kind === 'check-evidence' ? 'json' : 'md'}`)
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, text + '\n')
console.log(out)
