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
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
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
  review            --id ID --n N --base SHA
  fix               --id ID --n N --base SHA --kind review|seam|check --finding-file F
  seam-review       --id ID --n N --base SHA --merge-base SHA --head SHA --overlap F1,F2
                    (an overlap entry "consumes <id>" names a consumed blocker, not a file)
  check-fix-review  --id ID --n N --pre-fix-head SHA --errors-file F
  merge             --id ID --n N --base SHA [--stacked] [--seam-cleared] [--review-bead ID]
                    [--resolved-bead ID] [--consumes ID1,ID2]
  plan              --ids ID1,ID2 [--mode ready|rest|refill] [--reentry-ids ID1,ID2]
  triage            --id ID --blocker BEAD
  assemble          --consumer final-review|roast-code|history|assess --instance I
                    [--threshold N] [--base SHA] [--head REF] [--spec P1,P2]
  final-review      --mode single|cluster|seam [--dir D] [--capped] [--cluster N --name NAME] [--clusters N]
                    (single without --dir reviews direct inputs; cluster needs --dir --cluster --name;
                    seam needs --dir --clusters, the cluster files being 1..N)

common options:
  --plan <file>        the plan file (default: <ledger dir>/<epic>-plan.md)
  --test-paths P1,P2   config.testPaths, when the run set one
  --run-tag T          names the assembled-input directories (default: the Launch: line's runTag, else the epic)
  --epic, --branch, --worktree, --merge-check   override the Launch: line`

const FLAGS = new Set(['stdout', 'reentry', 'recut', 'stacked', 'seam-cleared', 'capped', 'help'])
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
      return { epic: a.epicId, branch: a.integrationBranch, worktree: a.integrationWorktree, runTag: a.runTag, mergeCheck: a.config?.mergeCheck, testPaths: a.config?.testPaths }
    } catch { return {} }
  }
  const f = {}
  for (const part of line.split(' · ')) {
    const m = part.match(/^(\S+)\s+(.*)$/)
    if (m) f[m[1]] = m[2].trim()
  }
  return { epic: f.epic, branch: f.branch, worktree: f.integrationWorktree, runTag: f.runTag, mergeCheck: f.mergeCheck }
}

function loadBuilders(cfg) {
  let src
  try { src = readFileSync(join(codeSkill, 'coordinator.js'), 'utf8') } catch (e) { console.error(`dispatch-text: cannot read coordinator.js: ${e.message}`); process.exit(3) }
  const cut = src.search(/^while \(true\) \{$/m)
  if (cut < 0) { console.error('dispatch-text: coordinator.js has no top-level `while (true) {` round loop to cut at'); process.exit(3) }
  const ret = `return { planPrompt, implementPrompt, taskReviewPrompt, fixPrompt, seamReviewPrompt, checkFixReviewPrompt, finalReviewPrompt, finalClusterReviewPrompt, finalSeamReviewPrompt, finalReviewStubPrompt, mergePrompt, triagePrompt, assemblePrompt, reviewBeadOf, mergeCheckCommand }\n`
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
const planPath = o.plan || join(ws, `${epic}-plan.md`)

const B = await loadBuilders({
  epicId: epic, integrationBranch: branch, integrationWorktree: worktree, skillsRoot, runTag, dryRun: false,
  config: { mergeCheck: mergeCheck && !/^none\b/.test(mergeCheck) ? mergeCheck : 'none', ...(testPaths ? { testPaths } : {}) },
})

const need = (...ks) => { for (const k of ks) if (!o[k]) fail(`${kind} needs --${k}`) }
const art = n => ({
  brief: `${ws}/task-${n}-brief.md`,
  report: `${ws}/task-${n}-report.md`,
  review: `${ws}/task-${n}-review.md`,
  diff: tag => `${ws}/task-${n}-review-${tag}.diff`,
})
const taskWorktree = id => `${worktree}/.worktrees/${String(branch).replace(/\//g, '-')}--task-${id}`
const task = () => ({ id: o.id, n: Number(o.n), branch: taskWorktree(o.id), base: o.base })
const readArg = k => { try { return readFileSync(o[k], 'utf8').trim() } catch (e) { fail(`cannot read --${k} ${o[k]}: ${e.message}`) } }

let text, label
switch (kind) {
  case 'implement':
    need('id', 'n')
    text = B.implementPrompt(planPath, o.id, Number(o.n), branch, art(o.n), { parents: list(o.parents), reentry: !!o.reentry, recut: !!o.recut })
    label = `impl-${o.id}`
    break
  case 'review':
    need('id', 'n', 'base')
    text = B.taskReviewPrompt(task(), planPath, art(o.n))
    label = `review-${o.id}`
    break
  case 'fix': {
    need('id', 'n', 'base', 'kind', 'finding-file')
    if (!['review', 'seam', 'check'].includes(o.kind)) fail('--kind is review, seam or check')
    text = B.fixPrompt(task(), readArg('finding-file'), art(o.n), o.kind)
    label = o.kind === 'review' ? `fix-${o.id}` : `fix-${o.id}-${o.kind}`
    break
  }
  case 'seam-review':
    need('id', 'n', 'base', 'merge-base', 'head', 'overlap')
    text = B.seamReviewPrompt(task(), { seamOverlap: list(o.overlap), mergeBase: o['merge-base'], head: o.head }, branch, art(o.n))
    label = `seam-review-${o.id}`
    break
  case 'check-fix-review':
    need('id', 'n', 'pre-fix-head', 'errors-file')
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
    const opts = { specPaths: list(o.spec) }
    if (o.threshold !== undefined) { if (!/^\d+$/.test(o.threshold)) fail('--threshold is a non-negative integer'); opts.threshold = Number(o.threshold) }
    if (o.base) opts.base = o.base
    if (o.head) opts.head = o.head
    text = B.assemblePrompt(o.consumer, o.instance, opts)
    label = `assemble-${o.consumer}-${o.instance}`
    break
  }
  case 'final-review': {
    need('mode')
    if (!['single', 'cluster', 'seam'].includes(o.mode)) fail('--mode is single, cluster or seam')
    const reviewPath = `${worktree}/.superpowers/sdd/${epic}-plan/final-review-${runTag}.md`
    const clusterPath = n => `${worktree}/.superpowers/sdd/${epic}-plan/final-review-${runTag}-cluster-${n}.md`
    const posInt = k => { if (!/^[1-9]\d*$/.test(String(o[k]))) fail(`--${k} is a positive integer`); return Number(o[k]) }
    if (o.mode === 'single') {
      text = B.finalReviewPrompt(epic, branch, worktree, '.superpowers/sdd/' + epic + '-plan/progress.md', planPath, null, [], { dir: o.dir || null, capped: !!o.capped, reviewPath })
      label = 'final-review-single'
    } else if (o.mode === 'cluster') {
      need('dir', 'cluster', 'name')
      const n = posInt('cluster')
      text = B.finalClusterReviewPrompt(n, o.name, o.dir, clusterPath(n), epic, branch, worktree)
      label = `final-review-cluster-${n}`
    } else {
      need('dir', 'clusters')
      const k = posInt('clusters')
      text = B.finalSeamReviewPrompt(o.dir, Array.from({ length: k }, (_, i) => clusterPath(i + 1)), reviewPath, epic, branch, worktree)
      label = 'final-review-seam'
    }
    break
  }
  default:
    fail(`unknown kind ${kind}\n${USAGE}`)
}

if (o.stdout) { process.stdout.write(text + '\n'); process.exit(0) }
const out = o.out || join(ws, 'dispatch', `${label}.md`)
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, text + '\n')
console.log(out)
