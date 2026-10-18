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
import { dirname, join, resolve, posix } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
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
  review-inputs     --base SHA --head SHA --out-dir DIR [--review-run-file captured/run.md]
                    (captured-Git selection, slices and generated-input provenance; exit 3 unavailable)
  bounded-review   --base SHA --head SHA --selection FILE --draft FILE --coverage FILE --out FILE
                    (preserve bounded draft and coverage; write a forced incomplete final report)
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
      return { epic: a.epicId, branch: a.integrationBranch, worktree: a.integrationWorktree, runTag: a.runTag, invocationId: a.invocationId, sweep: a.deferSweep ? 'deferred' : undefined, mergeCheck: a.config?.mergeCheck, testPaths: a.config?.testPaths, reviewBase: a.reviewBase, reviewHead: a.reviewHead, reviewRunFile: a.reviewRunFile }
    } catch { return {} }
  }
  const f = {}
  for (const part of line.split(' · ')) {
    const m = part.match(/^(\S+)\s+(.*)$/)
    if (m) f[m[1]] = m[2].trim()
  }
  return { epic: f.epic, branch: f.branch, worktree: f.integrationWorktree, runTag: f.runTag, invocationId: f.invocationId, mergeCheck: f.mergeCheck, sweep: f.sweep, reviewBase: f.reviewBase, reviewHead: f.reviewHead, reviewRunFile: f.reviewRunFile }
}

// The ledger's last `Sweep: ` line (text after the prefix) and the last four `Metrics: ` lines (the
// Workflow appends exactly four, in one batch), as Finish passes them to the final-review builder.
const lastSweep = t => { const m = t.split('\n').filter(l => l.startsWith('Sweep: ')); return m.length ? m[m.length - 1].slice(7).trim() : null }
const lastMetrics = t => t.split('\n').filter(l => l.startsWith('Metrics: ')).slice(-4)

function loadBuilders(cfg) {
  let src
  try { src = readFileSync(join(codeSkill, 'coordinator.js'), 'utf8') } catch (e) { console.error(`dispatch-text: cannot read coordinator.js: ${e.message}`); process.exit(3) }
  // Rendering uses initialized declarations, then returns before operational Resume/Launch.
  // Keep the whole source for hoisted real builders; no public startup bypass or fake identity.
  const cut = src.search(/^\/\/ Resume from the ledger, read once before the round loop:/m)
  if (cut < 0) { console.error('dispatch-text: coordinator.js has no operational Resume boundary'); process.exit(3) }
  const ret = `return { SWEEP_DEFERRED, planPrompt, implementPrompt, taskReviewPrompt, fixPrompt, seamReviewPrompt, checkFixReviewPrompt, finalReviewPrompt, finalClusterReviewPrompt, finalSeamReviewPrompt, finalReviewStubPrompt, mergePrompt, triagePrompt, assemblePrompt, reviewBeadOf, mergeCheckCommand, recordCheckEvidence, classifyCheckEvidence, verificationClosePrompt, verificationProblem }\n`
  const body = (src.slice(0, cut) + ret + src.slice(cut)).replace(/^export const meta/m, 'const meta')
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  const fn = new AsyncFunction('args', 'agent', 'log', 'phase', 'pipeline', 'parallel', 'budget', 'workflow', body)
  const noop = () => {}
  const operational = () => { throw new Error('dispatch-text: builder rendering attempted an operational dispatch') }
  return fn(cfg, operational, noop, operational, operational, operational, undefined, undefined)
}

// Mechanical captured-Git selection only. This path exits before loading Workflow builders.
// Collection metadata remains the authority; directory names alone never grant an exemption.
function reviewInputs(repo, base, head, out, current = null) {
  const git = (...args) => execFileSync('git', ['--literal-pathspecs', ...args], { cwd: repo, maxBuffer: 64 * 1024 * 1024 })
  const hash = bytes => createHash('sha256').update(bytes).digest('hex')
  const safe = p => typeof p === 'string' && p !== '' && !p.includes('\\') && !p.includes('\0') && !posix.isAbsolute(p) && p.split('/').every(s => s && s !== '.' && s !== '..')
  const idOK = id => typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id)
  const gaps = [], gap = text => { if (!gaps.includes(text)) gaps.push(text) }
  for (const sha of [base, head]) {
    if (!/^[0-9a-f]{40,64}$/.test(String(sha))) fail('review-inputs needs full captured --base and --head commits')
    try { if (git('rev-parse', '--verify', sha + '^{commit}').toString().trim() !== sha) throw Error() }
    catch { fail('review-inputs cannot verify captured commit ' + sha) }
  }
  try {
    const entries = readdirSync(out)
    const emptySlices = entries.length === 1 && entries[0] === 'slices' && lstatSync(join(out, 'slices')).isDirectory() && !lstatSync(join(out, 'slices')).isSymbolicLink() && readdirSync(join(out, 'slices')).length === 0
    if (lstatSync(out).isSymbolicLink() || (entries.length && !emptySlices)) fail('review-inputs refuses existing partial output; preserve it: ' + out)
  } catch (e) { if (e.code !== 'ENOENT') fail(e.message) }
  mkdirSync(out, { recursive: true })
  const changed = git('diff', '--no-renames', '--name-only', '-z', base + '..' + head).toString().split('\0').filter(Boolean)
  let currentIdentity = null, currentHistoryPristine = true
  const pristine = record => Object.keys(record).every(k => ['invocationId', 'workspace', 'reviewPath', 'review', 'required', 'settled'].includes(k)) &&
    record.invocationId === current?.invocationId && record.workspace === current?.workspace &&
    record.reviewPath === current?.reviewPath && record.review === 'pending' && record.settled === false
  function snapshot(revision) {
    const tree = new Map(git('ls-tree', '-r', '-z', revision).toString().split('\0').filter(Boolean).map(entry => {
      const tab = entry.indexOf('\t'), [mode, type, oid] = entry.slice(0, tab).split(' ')
      return [entry.slice(tab + 1), { mode, type, oid }]
    }))
    const blob = p => {
      const entry = tree.get(p)
      if (!entry || entry.type !== 'blob' || !['100644', '100755'].includes(entry.mode)) throw Error('missing or non-regular captured file: ' + p)
      return git('cat-file', 'blob', entry.oid)
    }
    const archives = [], claims = new Map(), collections = []
    for (const run of tree.keys()) {
      if (posix.basename(run) !== 'run.md') continue
      let text
      try { text = blob(run).toString() } catch (e) { gap(revision + ': ' + e.message); continue }
      const latest = new Map(), identities = new Map(), savedHashes = new Map(), history = new Map()
      let approvals = false
      for (const [lineNumber, line] of text.split('\n').entries()) {
        if (/^[A-Za-z][A-Za-z0-9-]*:/.test(line)) approvals = line === 'approvals:'
        if (!line.startsWith('- review-collection')) continue
        try {
          if (!approvals || !line.startsWith('- review-collection · ')) throw Error('record outside approvals or invalid prefix')
          const r = JSON.parse(line.slice('- review-collection · '.length))
          if (!r || !idOK(r.invocationId) || typeof r.workspace !== 'string' || !posix.isAbsolute(r.workspace) ||
              !(r.reviewPath === null || (typeof r.reviewPath === 'string' && posix.isAbsolute(r.reviewPath))) ||
              typeof r.review !== 'string' || !r.review.trim() || typeof r.settled !== 'boolean' ||
              !Array.isArray(r.required) || !r.required.every(safe) ||
              !(r.complete === undefined || typeof r.complete === 'boolean') ||
              !(r.gaps === undefined || (Array.isArray(r.gaps) && r.gaps.every(g => typeof g === 'string' && g))) ||
              !(r.files === undefined || (Array.isArray(r.files) && r.files.every(f => f && safe(f.path) && /^[a-f0-9]{64}$/.test(f.sha256))))) throw Error('invalid collection fields')
          if (r.complete && (!r.settled || !Array.isArray(r.gaps) || r.gaps.length ||
              (r.reviewPath === null ? r.review !== 'no work landed' : !r.files?.some(f => f.path === 'final-review-' + r.invocationId + '.md')))) throw Error('invalid complete collection fields')
          const identity = JSON.stringify([r.workspace, r.required])
          const old = identities.get(r.invocationId), previous = latest.get(r.invocationId)?.record
          let recovered = false
          // Match the collector's preserved settled-null transition, including mandatory
          // markers on every subsequent snapshot. Hash the exact parsed object, not line metadata.
          if (r.recovery !== undefined || previous?.recovery !== undefined || (previous?.settled && previous.reviewPath === null && r.reviewPath !== null)) {
            const recovery = r.recovery, original = history.get(recovery?.recordSha256)
            recovered = !!(recovery && recovery.kind === 'settled-null' && original?.settled && original.reviewPath === null &&
              original.review === recovery.review && original.invocationId === r.invocationId &&
              original.workspace === r.workspace && JSON.stringify(original.required) === JSON.stringify(r.required) &&
              r.settled && r.reviewPath === posix.join(r.workspace, 'final-review-' + r.invocationId + '.md') &&
              (hash(JSON.stringify(previous)) === recovery.recordSha256 || (previous?.reviewPath === r.reviewPath && previous.review === r.review && JSON.stringify(previous.recovery) === JSON.stringify(recovery))))
            if (!recovered) throw Error('invalid settled-null recovery provenance')
          }
          if (old && (old.identity !== identity || (old.settled && old.reviewPath !== r.reviewPath && !recovered))) gap(revision + ':' + run + ': conflicting collection identity ' + r.invocationId)
          identities.set(r.invocationId, { identity, settled: r.settled, reviewPath: r.reviewPath })
          for (const f of r.files || []) {
            const key = r.invocationId + '/' + f.path, previous = savedHashes.get(key)
            if (previous && previous !== f.sha256) gap(revision + ':' + run + ': conflicting saved hash ' + key)
            savedHashes.set(key, f.sha256)
          }
          latest.set(r.invocationId, { ...r, line: lineNumber + 1, record: r })
          history.set(hash(JSON.stringify(r)), r)
        } catch (e) { gap(revision + ':' + run + ':' + (lineNumber + 1) + ': malformed collection record: ' + e.message) }
      }
      collections.push({ run, latest })
      if (current && run === current.run) for (const r of history.values()) {
        if (r.invocationId !== current.invocationId) continue
        const identity = JSON.stringify([r.workspace, r.required])
        if (currentIdentity !== null && currentIdentity !== identity) gap(revision + ':' + run + ': conflicting current collection identity across captured endpoints')
        currentIdentity = identity
        if (!pristine(r)) currentHistoryPristine = false
      }
    }
    return { tree, blob, archives, claims, collections }
  }
  function validateCollections(snapshot, revision) {
    const { tree, blob, archives, claims } = snapshot
    for (const { run, latest } of snapshot.collections) {
      for (const r of latest.values()) {
        const prefix = 'final-review-' + r.invocationId, assembled = 'assembled/' + prefix + '-final/'
        const archive = posix.join(posix.dirname(run), 'reviews', r.invocationId)
        const files = new Map((r.files || []).map(f => [f.path, f.sha256]))
        const context = revision + ':' + run + ':' + r.line + ' ' + r.invocationId
        // A caller-bound prelaunch intent promises future artifacts; it grants no
        // archive/omission authority. Validate all history first and accept no claims.
        if (current && run === current.run && pristine(r.record) &&
            currentHistoryPristine &&
            ![...tree.keys()].some(p => p.startsWith(archive + '/'))) continue
        if (!r.complete || !r.settled || !Array.isArray(r.gaps) || r.gaps.length) gap(context + ': incomplete claimed collection')
        if (r.reviewPath === null) {
          if (r.review !== 'no work landed' || files.size) gap(context + ': invalid null-review bundle')
        } else {
          if (!r.reviewPath.endsWith('/' + prefix + '.md') || !files.has(prefix + '.md')) gap(context + ': incomplete claimed final report')
          for (const required of r.required) if (!files.has(required)) gap(context + ': incomplete required bundle: ' + required)
        }
        if ((r.files || []).length !== files.size) gap(context + ': conflicting duplicate manifest paths')
        const inputs = [...files.keys()].filter(p => p.startsWith(assembled))
        if (inputs.length) for (const name of ['diffstat.txt', 'digest.md']) if (!files.has(assembled + name)) gap(context + ': incomplete assembled bundle: ' + name)
        const clusters = [...files.keys()].filter(p => p.startsWith(prefix + '.cluster-') && /\.cluster-\d+\.md$/.test(p))
        if (clusters.length || files.has(assembled + 'clusters.json')) {
          try {
            const m = JSON.parse(blob(posix.join(archive, assembled + 'clusters.json')).toString())
            if (!files.has(assembled + 'clusters.json') || !Array.isArray(m.clusters) || (clusters.length && !m.clusters.length)) throw Error('missing manifest')
            for (const [n, c] of m.clusters.entries()) {
              if ((clusters.length && !files.has(prefix + '.cluster-' + (n + 1) + '.md')) || !Array.isArray(c.slices)) throw Error('missing cluster report or slices')
              for (const slice of c.slices) if (!safe(slice) || !files.has(assembled + slice)) throw Error('missing claimed cluster slice')
            }
          } catch (e) { gap(context + ': incomplete split bundle: ' + e.message) }
        }
        for (const [relative, sha256] of files) {
          const p = posix.join(archive, relative)
          try { if (hash(blob(p)) !== sha256) gap(context + ': saved hash mismatch: ' + p) }
          catch (e) { gap(context + ': ' + e.message) }
          if (relative.startsWith(assembled) || relative === prefix + '.md.diff') {
            const claim = { path: p, sha256, revision, run, recordLine: r.line, invocationId: r.invocationId, archive, report: archive + '/' + prefix + '.md' }
            if (claims.has(p) && claims.get(p).sha256 !== sha256) gap(context + ': conflicting payload claim: ' + p)
            claims.set(p, claim)
          }
        }
        archives.push({ revision, run, recordLine: r.line, invocationId: r.invocationId, archive, report: r.reviewPath === null ? null : archive + '/' + prefix + '.md', files: r.files || [] })
      }
    }
  }
  let selected = changed, omitted = [], archives = [], slices = [], sourceAvailable = false
  try {
    // Capture and validate current identity history at BOTH endpoints before any
    // pending-intent deferral; a settled identity cannot become fresh by replacement.
    const before = snapshot(base), after = snapshot(head)
    validateCollections(before, base)
    validateCollections(after, head)
    archives = after.archives
    // Previously claimed payload deletion/corruption stays reviewable even if its record was removed.
    for (const [p, claim] of before.claims) {
      try { if (hash(after.blob(p)) !== claim.sha256) gap(head + ': previously claimed payload hash changed: ' + p) }
      catch (e) { gap(head + ': previously claimed payload unavailable: ' + p) }
    }
    if (!gaps.length) {
      omitted = changed.filter(p => after.claims.has(p)).map(p => after.claims.get(p))
      selected = changed.filter(p => !after.claims.has(p))
    }
    sourceAvailable = true
    // With zero omissions selected is the full captured range; a redundant long
    // path argv can exceed ARG_MAX even though the Git source is readable.
    writeFileSync(join(out, 'diffstat.txt'), selected.length ? git('diff', '--no-renames', '--stat', base + '..' + head, ...(omitted.length ? ['--', ...selected] : [])) : '')
    if (!gaps.length) {
      mkdirSync(join(out, 'slices'), { recursive: true })
      for (const [n, p] of selected.entries()) {
        // Ordinals avoid collisions and platform filename limits for arbitrary Git paths.
        const slice = 'slices/' + String(n + 1).padStart(6, '0') + '.diff'
        writeFileSync(join(out, slice), git('diff', '--no-renames', base + '..' + head, '--', p))
        slices.push({ path: p, slice })
      }
    }
  } catch (e) { sourceAvailable = false; gap('captured input extraction unavailable: ' + e.message); selected = changed; omitted = [] }
  const result = { base, head, sourceAvailable, wholeRangeReady: false, status: gaps.length ? 'unavailable' : 'complete', changed: selected, slices, archives, omitted, gaps }
  writeFileSync(join(out, 'review-inputs.json'), JSON.stringify(result, null, 2) + '\n')
  writeFileSync(join(out, 'generated-input-provenance.md'), [
    '## Generated-input provenance',
    'Captured range: ' + base + '..' + head,
    'Selection: ' + result.status + '; selected product/input paths: ' + selected.length + '; omitted historical payloads: ' + omitted.length + '.',
    'diffstat.txt describes selected product/input paths. Reports, findings and collection metadata remain ordinary review inputs.',
    ...omitted.map(o => '- ' + JSON.stringify(o)),
    ...gaps.map(g => '- Selection/evidence gap (unavailable): ' + g),
    'Open each report/archive at its recorded revision. Omission supplies no finding disposition or verdict.',
  ].join('\n') + '\n')
  console.log(JSON.stringify({ status: result.status, sourceAvailable, wholeRangeReady: false, dir: out, selected: selected.length, omitted: omitted.length, gaps }))
  process.exit(gaps.length ? 3 : 0)
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
const reviewOutput = kind === 'bounded-review' || kind === 'bind-review-source' || kind === 'final-review' || (kind === 'assemble' && o.consumer === 'final-review')
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
if (kind === 'review-inputs') {
  if (!o.base || !o.head || !o['out-dir']) fail('review-inputs needs --base, --head and --out-dir')
  // No inferred run path or command-line identity can replace persisted caller context.
  const run = o['review-run-file']
  const current = typeof run === 'string' && run === L.reviewRunFile &&
    run !== '' && !run.includes('\\') && !posix.isAbsolute(run) && run.split('/').every(s => s && s !== '.' && s !== '..') &&
    posix.basename(run) === 'run.md' && L.worktree === worktree &&
    typeof invocationId === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(invocationId)
    ? { run, invocationId, workspace: ws, reviewPath: join(ws, 'final-review-' + invocationId + '.md') } : null
  reviewInputs(worktree, o.base, o.head, resolve(o['out-dir']), current)
}
// A bounded artifact is a new report, never a rewrite of an unavailable invocation.
// The writer rechecks captured source and inventory; sidecar claims alone grant no authority.
if (kind === 'bounded-review') {
  if (!boundSource || !['selection', 'draft', 'coverage', 'out'].every(k => o[k])) fail('bounded-review needs --selection, --draft, --coverage and --out plus persisted source')
  const { base, head } = boundSource
  const git = (...args) => execFileSync('git', ['--literal-pathspecs', ...args], { cwd: worktree, maxBuffer: 64 * 1024 * 1024 }).toString()
  try {
    for (const sha of [base, head]) if (git('rev-parse', '--verify', sha + '^{commit}').trim() !== sha) throw Error('captured commit unavailable')
    const bytes = readFileSync(o.selection), selection = JSON.parse(bytes), coverage = JSON.parse(readFileSync(o.coverage, 'utf8'))
    const changed = git('diff', '--no-renames', '--name-only', '-z', base + '..' + head).split('\0').filter(Boolean)
    if (selection.base !== base || selection.head !== head || selection.status !== 'unavailable' || selection.sourceAvailable !== true ||
        selection.wholeRangeReady !== false || !Array.isArray(selection.omitted) || selection.omitted.length ||
        !Array.isArray(selection.gaps) || !selection.gaps.length || !selection.gaps.every(g => typeof g === 'string' && g.trim()) ||
        JSON.stringify(selection.changed) !== JSON.stringify(changed)) throw Error('bounded selection/source inventory mismatch')
    if (!Array.isArray(coverage.inspected) || !coverage.inspected.length) throw Error('actual inspected paths/hunks required')
    const seen = new Set()
    for (const item of coverage.inspected) {
      if (!item || !changed.includes(item.path) || seen.has(item.path) || !Array.isArray(item.hunks) || !item.hunks.length || !item.hunks.every(h => typeof h === 'string' && h.trim())) throw Error('invalid inspected coverage')
      // Exact captured hunk headers bind coverage to source rather than mutable checkout text.
      const diff = git('diff', '--no-renames', base + '..' + head, '--', item.path)
      for (const hunk of item.hunks) if (!diff.split('\n').includes(hunk) || !hunk.startsWith('@@ ')) throw Error('inspected hunk absent from captured source')
      seen.add(item.path)
    }
    const output = resolve(o.out)
    if (output !== join(ws, 'final-review-' + invocationId + '.md')) throw Error('output must be this invocation expected final report')
    if ([o.selection, o.draft, o.coverage].some(p => resolve(p) === output)) throw Error('preserve original bounded evidence')
    for (const p of [output, output + '.diff']) {
      try { lstatSync(p); throw Error('partial artifact already exists; preserve it: ' + p) } catch (e) { if (e.code !== 'ENOENT') throw e }
    }
    const draft = readFileSync(o.draft, 'utf8')
    const extraction = JSON.parse(execFileSync('bash', [join(here, 'report-verdict'), '--complete', '--source', invocationId + '/bounded-draft', resolve(o.draft)], { encoding: 'utf8' }))
    if (extraction.kind !== 'final-review' || !/^## Verdict\r?$/m.test(draft) || !/^## Untested scope\r?$/m.test(draft)) throw Error('bounded draft must use strict final-review headings')
    const verdict = 'not ready (unreviewed: whole-epic coverage and omission provenance remain incomplete)'
    const hash = b => createHash('sha256').update(b).digest('hex')
    const evidence = { base, head, selection: resolve(o.selection), selectionSha256: hash(bytes), draft: resolve(o.draft), draftSha256: hash(draft), coverage: resolve(o.coverage), coverageSha256: hash(readFileSync(o.coverage)), inspected: coverage.inspected, changed, unreviewedPaths: changed.filter(p => !seen.has(p)), gaps: selection.gaps, wholeRangeReady: false }
    // Preserve every draft finding/section verbatim. Only the verdict changes; coverage
    // becomes an explicit untested occurrence that existing extraction/collection retains.
    const body = draft.replace(/(^## Verdict\r?\n)([\s\S]*?)(?=^## |$(?![\s\S]))/m, '$1' + verdict + '\n')
      .replace(/^## Untested scope\r?$/m, '## Untested scope\n- whole-epic review incomplete; bounded inspected hunks only; all remaining hunks and provenance gaps remain unreviewed')
    const result = '# Bounded captured-source review\n\nCoverage record: ' + JSON.stringify(evidence) + '\n\n' + body
    writeFileSync(output, result, { flag: 'wx' })
    console.log(JSON.stringify({ verdict, path: output, wholeRangeReady: false }))
  } catch (e) { fail('bounded review unavailable: ' + e.message) }
  process.exit(0)
}
const planPath = o.plan || join(ws, `${epic}-plan.md`)

const B = await loadBuilders({
  epicId: epic, integrationBranch: branch, integrationWorktree: worktree, skillsRoot, runTag, reviewRunFile: L.reviewRunFile, ...(typeof invocationId === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(invocationId) ? { invocationId } : {}), dryRun: false,
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
      text = B.finalReviewPrompt(epic, branch, worktree, '.superpowers/sdd/' + epic + '-plan/progress.md', planPath, sweep, metrics, { dir: o.dir || null, capped: !!o.capped, provenanceGap: null, selectionPath: o.dir ? o.dir + '/review-inputs.json' : null, reviewPath, base: source.base, head: source.head })
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
