// run-profile.mjs — per-bead timing profile of a finished super-code run: the bead graph's shape, each
// bead's timeline and why it started when it did, the realized critical path, the bottleneck bead and
// what it spent its time on, and simulated reshaping what-ifs.
// Invoked through ./run-profile (bash wrapper, checks for node). Usage: --help.
// Exit codes: 0 ok, 2 bad input, 3 no timing source (prints a `Profile: unavailable — …` line).
//
// The coordinator cannot read a clock (Workflow scripts throw on Date.now()) and the ledger carries
// no timestamps, so timing comes from the harness's own session files, read best-effort: what is
// missing is named on the `Unmeasured:` line, never guessed.
// - A Workflow run directory: journal.jsonl (each dispatch's label, phase and result),
//   agent-<id>.meta.json (label, model) and agent-<id>.jsonl (the agent's transcript, a timestamp on
//   every row). The graph is the planners' own `deps` rows (PLANNED results in the journal).
// - The ordinary-subagent coordinator (coordinator-subagents.md), which names every dispatch from the
//   label grammar: on Codex, the coordinator's rollout and its children's under ~/.codex/sessions; on
//   Claude Code, the calling session's subagents/ directory and transcript. There is no journal:
//   outcomes come from the ledger, the graph from bd, and the merges, which the coordinator runs
//   itself, from its own git commands.
import { readFileSync, readdirSync, writeFileSync, statSync, openSync, readSync, closeSync, existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'

const USAGE = `usage: run-profile (--workflow <dir>... | --codex <thread>... | --subagents <dir>... | --discover --epic <id>) [options]

  --workflow <dir>    a Workflow run directory (journal.jsonl, agent-*.jsonl); repeat for each
                      invocation of the same epic (relaunches), in any order
  --codex <thread>    an ordinary-subagent coordinator on Codex: its thread id, or its rollout file
  --subagents <dir>   an ordinary-subagent coordinator on Claude Code: the calling session's
                      <projects>/<project>/<session>/subagents directory
  --discover          find every run of --epic: Workflow runs whose Launch: line names it, and
                      ordinary-subagent coordinators whose log names its ledger
  --epic <id>         the root epic (required with --discover; otherwise read from the runs)
  --projects <dir>    where --discover looks for Claude Code sessions (default: ~/.claude/projects)
  --codex-home <dir>  where Codex keeps sessions/ (default: ~/.codex)
  --ledger <file>     the run's progress.md, for ordinary-subagent runs (default: the one the
                      coordinator's commands name): merge and task outcomes
  --beads <file>      a saved \`bd list --all --json --limit 0\` dump, for ordinary-subagent runs
                      (default: run bd in the coordinator's directory): the dependency graph
  --cap <N>           the coordinator's slot cap (default: min(concurrency, runtimeSlots - 2) from
                      the Launch: line; 1 for an ordinary-subagent run; else unlimited)
  --out <prefix>      also write <prefix>.md (tables, critical path, timeline) and <prefix>.json
  --include-dry-run   keep invocations launched with dryRun: true (skipped by default)

  --latest            keep only the newest invocation and the relaunches that led into it (an
                      earlier run that ended under 10 minutes before the next one started)
  --summarize <json>… instead: aggregate earlier --out profiles (<prefix>.json files) into
                      \`Baseline:\` lines, to compare runs against each other

Prints the summary on stdout as ledger-ready lines, \`Profile: <epic> · …\` then
\`Profile: <key> — …\` for shape, bound, critical path, critical chain, bottleneck, waits, early
unblock, rework, tests, slow tests, merge lane, conflicts, runtime, what-if (one line each) and
unmeasured; an ordinary-subagent run adds concurrency and per-kind dispatch time, and when its
dispatch names do not map to the epic's beads, prints only those run-level lines.`

const die = (code, msg) => { process.stderr.write(`run-profile: ${msg}\n`); process.exit(code) }

// ---- argv ----
const opt = { workflow: [], codex: [], subagents: [] }
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--help' || a === '-h') { console.log(USAGE); process.exit(0) }
  if (a === '--discover') { opt.discover = true; continue }
  if (a === '--include-dry-run') { opt.includeDryRun = true; continue }
  if (a === '--latest') { opt.latest = true; continue }
  if (a === '--summarize') { opt.summarize = []; while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) opt.summarize.push(argv[++i]); continue }
  if (!a.startsWith('--') || i + 1 >= argv.length) die(2, `bad argument '${a}'\n${USAGE}`)
  const k = a.slice(2)
  if (['workflow', 'codex', 'subagents'].includes(k)) opt[k].push(argv[++i])
  else if (['epic', 'projects', 'cap', 'out', 'codex-home', 'ledger', 'beads'].includes(k)) opt[k] = argv[++i]
  else die(2, `unknown option ${a}`)
}
if (!opt.discover && !opt.workflow.length && !opt.codex.length && !opt.subagents.length && !opt.summarize) die(2, `give --workflow <dir>, --codex <thread>, --subagents <dir>, --discover --epic <id> or --summarize <json>…\n${USAGE}`)
if (opt.summarize && !opt.summarize.length) die(2, '--summarize needs at least one profile .json')
if (opt.discover && !opt.epic) die(2, '--discover needs --epic <id>')
if (opt.cap !== undefined && !(Number(opt.cap) >= 1)) die(2, '--cap must be a positive number')

// ---- helpers ----
const EPS = 5000            // clock slack when matching one dispatch's end to the next one's start
const DISPATCH_GAP = 30000  // a start this soon after its predecessor's end is dispatch latency
const isDir = p => { try { return statSync(p).isDirectory() } catch { return false } }
const ls = p => { try { return readdirSync(p) } catch { return [] } }
function readJsonl(file) {
  let text
  try { text = readFileSync(file, 'utf8') } catch { return null }
  const rows = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    try { rows.push(JSON.parse(line)) } catch { /* a torn last line */ }
  }
  return rows
}
const textOf = c => typeof c === 'string' ? c : Array.isArray(c) ? c.map(x => (x && typeof x.text === 'string') ? x.text : '').join('\n') : ''
const oneLine = (s, n = 70) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t }
function slowTestText(e) { return `${e.cmd} ${fmtDur(e.ms)} (${e.runs} run${e.runs === 1 ? '' : 's'}, longest ${fmtDur(e.longestMs)})` }
function fmtDur(ms) {
  if (!Number.isFinite(ms)) return '?'
  const s = Math.round(Math.max(0, ms) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m`
}
const fmtTime = t => new Date(t).toISOString().slice(0, 16) + 'Z'
const pct = (a, b) => b > 0 ? Math.round(100 * a / b) : 0
const sum = xs => xs.reduce((s, x) => s + x, 0)
const latest = xs => xs.reduce((x, y) => (!x || y.end > x.end ? y : x), null)
function unionMs(spans) {
  let total = 0, cs = -Infinity, ce = -Infinity
  for (const [s, e] of [...spans].sort((a, b) => a[0] - b[0])) {
    if (s > ce) { if (ce > cs) total += ce - cs; cs = s; ce = e } else if (e > ce) ce = e
  }
  return ce > cs ? total + ce - cs : total
}

// The first JSON object in `s` (the `Launch: args {…}` tail inside the launch append's prompt).
function leadingJson(s) {
  let depth = 0, inStr = false, esc = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue }
    if (ch === '"') inStr = true
    else if (ch === '{') depth++
    else if (ch === '}' && --depth === 0) { try { return JSON.parse(s.slice(0, i + 1)) } catch { return null } }
  }
  return null
}
function launchArgs(rows) {
  for (const r of rows ?? []) {
    if (r.type !== 'user') continue
    const t = textOf(r.message?.content)
    const i = t.indexOf('Launch: args {')
    if (i >= 0) { const j = leadingJson(t.slice(i + 'Launch: args '.length)); if (j) return j }
  }
  return null
}

// ---- labels: `<kind>:<bead>[:<suffix>]` for per-task dispatches, `<kind>[:<suffix>]` for run-level ----
const BEAD_KINDS = new Set(['brief', 'impl', 'commit-nudge', 'review', 'fix', 'seam-review', 'merge', 'review-bead', 'triage',
  'clarify', 'notify', 'missing-blocker', 'unplanned-blocker', 'close-only', 'reopen', 'discard', 'ledger'])
function parseLabel(label) {
  const i = label.indexOf(':')
  const kind = i < 0 ? label : label.slice(0, i)
  const rest = i < 0 ? '' : label.slice(i + 1)
  if (BEAD_KINDS.has(kind) && rest) {
    const [bead, ...suf] = rest.split(':')
    return { kind, bead, suffix: suf.join(':') }
  }
  return { kind, bead: null, suffix: rest }
}
// The merge lane is single-flight: a task's merge, its seam review and its seam or merge-check fix
// all run inside one lane turn (stages `merge` and `seam`).
function stageOf(kind, suffix) {
  switch (kind) {
    case 'brief': case 'impl': case 'commit-nudge': return 'implement'  // `brief:` is older coordinators' setup step
    case 'review': return 'review'
    case 'fix': return suffix ? 'seam' : 'fix'
    case 'seam-review': return 'seam'
    case 'merge': return 'merge'
    case 'review-bead': return 'split'
    case 'triage': case 'clarify': case 'notify': case 'missing-blocker': case 'unplanned-blocker': return 'blocker'
    case 'close-only': return 'close'
    case 'reopen': case 'discard': return 'cancel'
    case 'ledger': case 'ledger-append': case 'read-ledger': return 'ledger'
    case 'plan': case 'plan-rest': return 'planning'
    case 'bd-ready': case 'bd-ready-topup': case 'bd-ready-recheck': case 'close-epics': return 'ready'
    case 'edge-audit': case 'edge-cuts': case 'edge-add': return 'audit'
    case 'sweep': case 'final-review': case 'reconcile-buckets': case 'worktree-sweep': return 'finish'
    default: return 'other'
  }
}
const LANE = new Set(['merge', 'seam'])
const IN_SLOT = new Set(['implement', 'review', 'fix', 'blocker', 'close', 'cancel'])

// ---- what a dispatch's tool time went to ----
// A Bash call is split into its sub-commands (`&&`, `||`, `;`, `|`, `&`, newlines, outside quotes;
// heredoc bodies dropped) and takes the weightiest category among them, so `cd x && cargo test | tail`
// is a test, `git add tests/a.py` is git and `./run.sh | tail` is shell. A loop that sleeps, or
// `tail -f`, is polling a background run; a test binary under target/*/deps/ run directly is a test.
const CMD_PREFIX = /^(?:\s*(?:(?:export\s+|env\s+)?[A-Z_][A-Z0-9_]*=(?:"[^"]*"|'[^']*'|\S*)\s+|(?:nice|ionice)(?:\s+-n\s*-?\d+)?\s+|timeout\s+(?:-\S+\s+)*\d+[smh]?\s+|(?:time|command|exec|then|do|else|sudo)\s+|[({]\s*))+/
const TEST_RE = /^(?:cargo\s+(?:\+\S+\s+)?(?:nextest|test|t)\b|(?:npm|pnpm|yarn|bun)\s+(?:(?:-r|-w|--recursive|--filter\s+\S+|workspace\s+\S+)\s+)*(?:run\s+)?(?:test|t)\b|npx\s+(?:jest|vitest|mocha|playwright\s+test|cypress\s+run)\b|(?:python3?\s+-m\s+)?(?:pytest|py\.test|unittest|nose2?|tox|nox)\b|go\s+test\b|(?:jest|vitest|mocha|rspec|phpunit|bats|ctest)\b|(?:mvn|\.?\/?gradlew?)\s+(?:\S+\s+)*?\S*test\b|(?:make|just)\s+(?:-\S+\s+)*\S*(?:test|check)\b|bazel\s+test\b|deno\s+test\b|swift\s+test\b|dotnet\s+test\b|node\s+--test\b|(?:bash|sh|node|python3?|deno|bun|tsx)\s+\S*(?:tests?\/\S+|test[-_][\w.-]*)\.(?:sh|mjs|cjs|js|ts|py)\b|\.?\/?\S*(?:tests?\/\S+|test[-_][\w.-]*)\.sh\b)/
const BUILD_RE = /^(?:cargo\s+(?:\+\S+\s+)?(?:build|check|clippy|b)\b|(?:npx\s+)?tsc\b|go\s+(?:build|vet)\b|(?:npm|pnpm|yarn|bun)\s+(?:(?:-r|-w|--recursive|--filter\s+\S+|workspace\s+\S+)\s+)*(?:run\s+)?(?:build|typecheck|lint|compile)\b|(?:mvn|\.?\/?gradlew?)\s+(?:\S+\s+)*?(?:compile|build|package|assemble)\b|swift\s+build\b|dotnet\s+build\b|cmake\b|make\b|ninja\b|bazel\s+build\b)/
const INSTALL_RE = /^(?:(?:npm|pnpm|yarn|bun)\s+(?:ci|install|i|add)\b|pip3?\s+install\b|python3?\s+-m\s+pip\s+install\b|uv\s+(?:sync|add|pip\s+install)\b|poetry\s+install\b|cargo\s+(?:fetch|install)\b|bundle\s+install\b|go\s+(?:mod\s+download|get)\b)/
const READ_RE = /^(?:rg|grep|egrep|cat|sed|head|tail|less|ls|find|fd|wc|awk|jq|diff|stat|file|tree|sort|uniq|cut|tr)\b/
const TRIVIAL_RE = /^(?:cd|export|set|pushd|popd|true|false|:|pwd|source|\.|echo|printf|[0-9]*>\S*|[0-9]+)(?:\s|$)/
const CAT_RANK = ['poll', 'test', 'build', 'install', 'shell', 'git', 'bd', 'read']
const TEST_BIN_RE = /target\/(?:debug|release)\/deps\//
function subCommands(cmd) {
  const s = String(cmd).replace(/<<-?\s*(['"]?)([A-Za-z_]\w*)\1[^\n]*\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g, '')
  const parts = []
  let cur = '', q = null
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) { cur += c; if (c === q && s[i - 1] !== '\\') q = null; continue }
    if (c === '"' || c === "'") { q = c; cur += c; continue }
    if (c === '\n' || c === ';' || c === '|' || c === '&') { parts.push(cur); cur = ''; continue }
    cur += c
  }
  parts.push(cur)
  return parts.map(x => x.replace(CMD_PREFIX, '').trim()).filter(x => x && !TRIVIAL_RE.test(x))
}
function bashCategory(command) {
  const cmd = String(command ?? '').replace(/<<-?\s*(['"]?)([A-Za-z_]\w*)\1[^\n]*\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g, '')
  if (/\b(?:for|while|until)\b[\s\S]*?\bsleep\s+\d/.test(cmd) || /^\s*sleep\s/.test(cmd)) return 'poll'
  const subs = subCommands(cmd)
  const testVars = new Set()
  for (const x of subs) { const m = /^([A-Za-z_]\w*)=(\S+)/.exec(x); if (m && TEST_BIN_RE.test(m[2])) testVars.add(m[1]) }
  let best = null
  for (const x of subs) {
    if (/^[A-Za-z_]\w*=\S*$/.test(x)) continue
    const v = /^"?\$\{?(\w+)\}?"?/.exec(x)
    const testBin = (v && testVars.has(v[1])) || /^\S*target\/(?:debug|release)\/deps\/\S+/.test(x) || /^"?\$\([^)]*target\/(?:debug|release)\/deps\//.test(x)
    const c = testBin ? 'test' : /^tail\s+(?:-\S*\s+)*-\S*[fF]/.test(x) ? 'poll' : /^git\b/.test(x) ? 'git' : /^bd\b/.test(x) ? 'bd'
      : READ_RE.test(x) ? 'read' : INSTALL_RE.test(x) ? 'install' : TEST_RE.test(x) ? 'test' : BUILD_RE.test(x) ? 'build' : 'shell'
    if (best === null || CAT_RANK.indexOf(c) < CAT_RANK.indexOf(best)) best = c
  }
  return best ?? 'shell'
}
function toolCategory(name, input) {
  if (name === 'StructuredOutput') return null
  if (name === 'Bash') return bashCategory(input?.command)
  if (/^(Read|Grep|Glob|LS|NotebookRead)$/.test(name)) return 'read'
  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(name)) return 'edit'
  if (/^(BashOutput|TaskOutput|Monitor|KillShell|KillBash)$/.test(name)) return 'poll'
  if (/^(Agent|Task)$/.test(name)) return 'subagent'
  return 'other'
}
const commandHead = input => oneLine(subCommands(String(input?.command ?? '').split('\n')[0])[0] ?? String(input?.command ?? ''), 60)
// A test call's command, normalized so runs of one command group across tasks: the test sub-command
// only, worktree and temp paths and test-binary hashes dropped, redirections stripped.
function testKey(command) {
  const subs = subCommands(command)
  const vars = new Map(subs.map(y => /^([A-Za-z_]\w*)=(\S+)$/.exec(y)).filter(Boolean).map(m => [m[1], m[2].replace(/^["']|["']$/g, '')]))
  const run = subs.filter(y => !/^[A-Za-z_]\w*=\S*$/.test(y))
    .map(y => y.replace(/^"?\$\{?(\w+)\}?"?/, (m, v) => vars.get(v) ?? m))
  const x = run.find(y => TEST_RE.test(y) || TEST_BIN_RE.test(y)) ?? run[0] ?? subs[0] ?? ''
  return oneLine(x
    .replace(/\s*\d*>>?\s*\S*/g, '')
    .replace(/(?:\/[^\s'"/]+)*\/\.worktrees\/[^\s'"/]+\//g, '')
    .replace(/(?:\/private)?\/tmp\/[^\s'"]*/g, '<tmp>')
    .replace(/(target\/(?:debug|release)\/deps\/[\w-]+?)-[0-9a-f]{16}\b/g, '$1-*'), 90)
}

// ---- one Workflow run directory ----
function transcriptTiming(rows) {
  let start = Infinity, end = -Infinity
  const open = new Map()
  const calls = []
  for (const r of rows) {
    const t = Date.parse(r.timestamp)
    if (!Number.isFinite(t)) continue
    if (t < start) start = t
    if (t > end) end = t
    const c = r.message?.content
    if (!Array.isArray(c)) continue
    for (const x of c) {
      if (x?.type === 'tool_use' && x.id) open.set(x.id, { name: x.name, input: x.input ?? {}, t })
      else if (x?.type === 'tool_result' && open.has(x.tool_use_id)) {
        const u = open.get(x.tool_use_id)
        open.delete(x.tool_use_id)
        const cat = toolCategory(u.name, u.input)
        if (cat) calls.push({ name: u.name, cat, what: u.name === 'Bash' ? (oneLine(u.input.description) || commandHead(u.input)) : '', ...(cat === 'test' && u.name === 'Bash' ? { test: testKey(u.input.command) } : {}), start: u.t, end: t })
      }
    }
  }
  if (!Number.isFinite(start)) return null
  const byCat = {}
  for (const cat of new Set(calls.map(x => x.cat))) byCat[cat] = unionMs(calls.filter(x => x.cat === cat).map(x => [x.start, x.end]))
  return { start, end, dur: end - start, toolMs: unionMs(calls.map(x => [x.start, x.end])), byCat,
    calls: calls.map(x => ({ name: x.name, cat: x.cat, what: x.what, ...(x.test ? { test: x.test } : {}), ms: x.end - x.start })) }
}

function readRunMeta(dir) {
  const journal = readJsonl(join(dir, 'journal.jsonl'))
  const agents = new Map()
  const get = id => { if (!agents.has(id)) agents.set(id, { id, run: basename(dir) }); return agents.get(id) }
  for (const r of journal ?? []) {
    if (!r || !r.agentId) continue
    if (r.type === 'started') { const a = get(r.agentId); a.label ??= r.label; a.phase ??= r.phase }
    else if (r.type === 'result') get(r.agentId).result = r.result
    else if (r.type === 'failed') get(r.agentId).failed = true
  }
  for (const f of ls(dir)) {
    const m = /^agent-(.+)\.meta\.json$/.exec(f)
    if (!m) continue
    let meta
    try { meta = JSON.parse(readFileSync(join(dir, f), 'utf8')) } catch { continue }
    const a = get(m[1])
    a.label ??= meta.description
    a.phase ??= meta.workflowPhase
    a.model ??= meta.model
  }
  let launch = null
  for (const a of agents.values()) {
    if (a.label === 'ledger-append:launch') { launch = launchArgs(readJsonl(join(dir, `agent-${a.id}.jsonl`))); if (launch) break }
  }
  // A coordinator run reads its ledger, queries ready work or plans; other workflows that reuse
  // labels like `impl:` do not.
  const coordinator = [...agents.values()].some(a => /^(read-ledger|bd-ready|close-epics|plan|plan-rest|ledger-append:launch)$/.test(a.label ?? ''))
  return { source: 'workflow', dir, runId: basename(dir), journal: !!journal, agents, launch, coordinator }
}
function readRun(dir) {
  const run = readRunMeta(dir)
  for (const a of run.agents.values()) {
    const t = transcriptTiming(readJsonl(join(dir, `agent-${a.id}.jsonl`)) ?? [])
    if (t) Object.assign(a, t)
    Object.assign(a, parseLabel(a.label ?? ''))
    a.stage = stageOf(a.kind, a.suffix)
  }
  return run
}
const planEpic = run => {
  for (const a of run.agents.values()) {
    const p = (a.label === 'plan' || a.label === 'plan-rest') && a.result?.planPath
    const m = p && /\/sdd\/([^/]+)-plan\/|([^/]+)-plan\.md$/.exec(p)
    if (m) return m[1] ?? m[2]
  }
  return null
}
function discover(projects, epic) {
  const found = []
  for (const p of ls(projects)) {
    const pd = join(projects, p)
    if (!isDir(pd)) continue
    for (const s of ls(pd)) {
      const wf = join(pd, s, 'subagents', 'workflows')
      for (const w of ls(wf)) {
        const dir = join(wf, w)
        if (!w.startsWith('wf_') || !isDir(dir)) continue
        const run = readRunMeta(dir)
        if (run.coordinator && (run.launch?.epicId ?? planEpic(run)) === epic) found.push(dir)
      }
    }
  }
  return found
}

// ---- ordinary-subagent runs (coordinator-subagents.md): Codex rollouts, Claude Code subagent directories ----
// Dispatch names follow the label grammar. On Claude Code the Agent description is the label itself
// (`impl:<bead>`). Codex task names allow only [a-z0-9_], so there it is `<kind>_<bead>[_<suffix>]`
// with every other character of the bead id written `_`, and `__<n>` appended to a repeated name.
const normName = s => String(s).toLowerCase().replace(/[^a-z0-9_]/g, '_')
const RUN_KINDS = ['plan', 'plan-rest', 'final-review', 'sweep', 'worktree-sweep', 'reconcile-buckets', 'bd-ready', 'close-epics',
  'edge-audit', 'edge-cuts', 'edge-add', 'read-ledger', 'ledger-append']
const KINDS_LONGEST_FIRST = [...BEAD_KINDS].sort((a, b) => b.length - a.length)
// The label a Codex task name stands for; byNorm maps a normalized bead id to the id (null when two
// ids normalize alike). Null when the name does not follow the rule.
function codexLabel(name, byNorm) {
  const n = String(name ?? '').replace(/__\d+$/, '')
  for (const kind of KINDS_LONGEST_FIRST) {
    const pre = normName(kind) + '_'
    if (!n.startsWith(pre)) continue
    const rest = n.slice(pre.length)
    let best = null
    for (const [k, id] of byNorm) if (id && (rest === k || rest.startsWith(k + '_')) && (!best || k.length > best[0].length)) best = [k, id]
    if (best) { const suf = rest.slice(best[0].length + 1); return `${kind}:${best[1]}${suf ? `:${suf}` : ''}` }
  }
  for (const kind of RUN_KINDS) { const k = normName(kind); if (n === k || n.startsWith(k + '_')) return n === k ? kind : `${kind}:${n.slice(k.length + 1)}` }
  return null
}
// The first line of a (possibly large) JSONL file.
function firstRow(file) {
  let fd
  try { fd = openSync(file, 'r') } catch { return null }
  const chunks = [], buf = Buffer.alloc(65536)
  try {
    for (let n; (n = readSync(fd, buf, 0, buf.length, null)) > 0;) {
      const i = buf.subarray(0, n).indexOf(10)
      chunks.push(Buffer.from(buf.subarray(0, i >= 0 ? i : n)))
      if (i >= 0) break
    }
  } finally { closeSync(fd) }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return null }
}
const codexHome = () => opt['codex-home'] ?? join(homedir(), '.codex')
// Every rollout's session_meta: thread id, and for a spawned agent its parent and task name.
let codexIdx = null
function codexIndex() {
  if (codexIdx) return codexIdx
  codexIdx = []
  const walk = d => {
    for (const f of ls(d)) {
      const p = join(d, f)
      if (/^rollout-.*\.jsonl$/.test(f)) {
        const m = firstRow(p)?.payload
        if (!m?.id) continue
        const sp = m.source?.subagent?.thread_spawn
        codexIdx.push({ file: p, id: m.id, parent: sp?.parent_thread_id ?? null, name: sp ? String(sp.agent_path ?? '').split('/').pop() : null, sub: !!m.source?.subagent, cwd: m.cwd })
      } else if (isDir(p)) walk(p)
    }
  }
  walk(join(codexHome(), 'sessions'))
  return codexIdx
}
const tsOf = r => Date.parse(r?.timestamp)
// What one Codex tool call ran. Code mode's `exec` cell calls `tools.exec_command({cmd: "…"})`, one or
// more; other builds call exec_command or shell directly.
const CODEX_RANK = ['poll', 'test', 'build', 'install', 'edit', 'shell', 'git', 'bd', 'read', 'subagent', 'other']
function codexCall(name, input) {
  const cmds = [], kinds = new Set()
  if (name === 'exec') {
    const src = String(input ?? '')
    for (const m of src.matchAll(/tools\.(\w+)\(/g)) kinds.add(m[1])
    for (const m of src.matchAll(/\bcmd\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g)) {
      const q = m[1]
      let v = q.slice(1, -1)
      if (q[0] === '"') try { v = JSON.parse(q) } catch { /* keep the raw text */ }
      cmds.push(v)
    }
  } else {
    kinds.add(name)
    let args = {}
    try { args = typeof input === 'string' ? JSON.parse(input) : input ?? {} } catch { /* a patch body, not JSON */ }
    const c = args?.cmd ?? args?.command
    if (c !== undefined) cmds.push(Array.isArray(c) ? c.join(' ') : String(c))
  }
  const cats = []
  if (cmds.length) cats.push(bashCategory(cmds.join('\n')))
  else if (kinds.has('exec_command') || kinds.has('shell')) cats.push('shell')
  if (kinds.has('apply_patch')) cats.push('edit')
  if (['write_stdin', 'sleep', 'wait', 'wait_agent'].some(k => kinds.has(k))) cats.push('poll')
  if (kinds.has('spawn_agent') || kinds.has('followup_task')) cats.push('subagent')
  const cat = cats.sort((a, b) => CODEX_RANK.indexOf(a) - CODEX_RANK.indexOf(b))[0] ?? 'other'
  return { cat, text: cmds.join('\n'), what: cmds.length ? commandHead({ command: cmds[0] }) : [...kinds].join(', '), ...(cat === 'test' ? { test: testKey(cmds.join('\n')) } : {}) }
}
function codexCalls(rows) {
  const open = new Map(), calls = []
  for (const r of rows) {
    const p = r.payload, t = tsOf(r)
    if (r.type !== 'response_item' || !p || !Number.isFinite(t)) continue
    if ((p.type === 'function_call' || p.type === 'custom_tool_call') && p.call_id) open.set(p.call_id, { name: p.name, input: p.type === 'custom_tool_call' ? p.input : p.arguments, t })
    else if ((p.type === 'function_call_output' || p.type === 'custom_tool_call_output') && open.has(p.call_id)) {
      const u = open.get(p.call_id)
      open.delete(p.call_id)
      calls.push({ name: u.name, ...codexCall(u.name, u.input), start: u.t, end: t })
    }
  }
  return calls
}
// A child's dispatches: each task it ran (task_started to task_complete or turn_aborted); a
// follow-up task is a second dispatch under the same name.
function codexTasks(rows) {
  let lo = Infinity, hi = -Infinity, open = null
  const spans = []
  for (const r of rows) {
    const t = tsOf(r)
    if (!Number.isFinite(t)) continue
    lo = Math.min(lo, t); hi = Math.max(hi, t)
    const k = r.type === 'event_msg' ? r.payload?.type : null
    if (k === 'task_started' && open === null) open = t
    else if ((k === 'task_complete' || k === 'turn_aborted') && open !== null) { spans.push([open, t]); open = null }
  }
  if (open !== null) spans.push([open, hi])
  const out = spans.filter(([s, e]) => e > s)
  return out.length || hi <= lo ? out : [[lo, hi]]
}
function spanTiming(start, end, calls) {
  const cs = calls.filter(x => x.start >= start && x.start <= end)
  const clip = x => [x.start, Math.min(x.end, end)]
  const byCat = {}
  for (const cat of new Set(cs.map(x => x.cat))) byCat[cat] = unionMs(cs.filter(x => x.cat === cat).map(clip))
  return { start, end, dur: end - start, toolMs: unionMs(cs.map(clip)), byCat, calls: cs.map(x => ({ name: x.name, cat: x.cat, what: x.what, ...(x.test ? { test: x.test } : {}), ms: x.end - x.start })) }
}
function readCodex(input) {
  const idx = codexIndex()
  let id = input
  if (existsSync(input) && !isDir(input)) {
    const m = firstRow(input)?.payload
    if (!m?.id) die(2, `not a Codex rollout: ${input}`)
    id = m.id
    if (!idx.some(e => e.file === input)) idx.push({ file: input, id, parent: null, name: null, sub: !!m.source?.subagent, cwd: m.cwd })
  }
  const own = idx.filter(e => e.id === id)
  if (!own.length) die(2, `no Codex rollout for thread ${id} under ${codexHome()}/sessions`)
  const rows = own.flatMap(e => readJsonl(e.file) ?? []).sort((a, b) => tsOf(a) - tsOf(b))
  const agents = new Map()
  for (const c of idx.filter(e => e.parent === id)) {
    const crow = readJsonl(c.file) ?? []
    // A forked child replays its parent's history at its spawn instant; those calls are not its own.
    const t0 = tsOf(crow[0])
    const calls = codexCalls(crow).filter(x => !(x.start === t0 && x.end === t0))
    codexTasks(crow).forEach(([s, e], k) => agents.set(`${c.id}#${k}`, { id: `${c.id}#${k}`, run: id, name: c.name, ...spanTiming(s, e, calls) }))
  }
  return { source: 'codex', dir: own[0].file, runId: id, journal: false, agents, launch: null, coordinator: true, callerCalls: codexCalls(rows), cwd: own[0].cwd }
}
function claudeCallerCalls(rows) {
  const open = new Map(), calls = []
  for (const r of rows) {
    const t = tsOf(r), c = r.message?.content
    if (!Number.isFinite(t) || !Array.isArray(c)) continue
    for (const x of c) {
      if (x?.type === 'tool_use' && x.id) open.set(x.id, { name: x.name, input: x.input ?? {}, t })
      else if (x?.type === 'tool_result' && open.has(x.tool_use_id)) {
        const u = open.get(x.tool_use_id)
        open.delete(x.tool_use_id)
        calls.push({ name: u.name, text: u.name === 'Bash' ? String(u.input.command ?? '') : '', start: u.t, end: t })
      }
    }
  }
  return calls
}
// <projects>/<project>/<session>/subagents: agent-<id>.meta.json (`description` is the label) and
// agent-<id>.jsonl; the calling session's own transcript is <projects>/<project>/<session>.jsonl.
function readSubagents(dir) {
  const d = dir.replace(/\/+$/, '')
  const session = basename(dirname(d))
  const agents = new Map()
  for (const f of ls(d)) {
    const m = /^agent-(.+)\.meta\.json$/.exec(f)
    if (!m) continue
    let meta
    try { meta = JSON.parse(readFileSync(join(d, f), 'utf8')) } catch { continue }
    const t = transcriptTiming(readJsonl(join(d, `agent-${m[1]}.jsonl`)) ?? [])
    agents.set(m[1], { id: m[1], run: session, name: meta.description ?? '', model: meta.model, ...(t ?? {}) })
  }
  const rows = readJsonl(`${dirname(d)}.jsonl`) ?? []
  return { source: 'subagents', dir: d, runId: session, journal: false, agents, launch: null, coordinator: true, callerCalls: claudeCallerCalls(rows), cwd: rows.find(r => r.cwd)?.cwd }
}
const LEDGER_RE = /(\/[^\s"'`]*\/\.superpowers\/sdd\/([^/\s"'`]+)-plan\/progress\.md)/g
function discoverOrdinary(projects, epic) {
  const marker = `sdd/${epic}-plan/`
  const subagents = []
  for (const p of ls(projects)) {
    const pd = join(projects, p)
    for (const f of ls(pd)) {
      const sub = join(pd, f.replace(/\.jsonl$/, ''), 'subagents')
      if (!f.endsWith('.jsonl') || !ls(sub).some(x => /^agent-.+\.meta\.json$/.test(x))) continue
      let text = ''
      try { text = readFileSync(join(pd, f), 'utf8') } catch { continue }
      if (text.includes('mechanism ordinary-subagents') && text.includes(marker)) subagents.push(sub)
    }
  }
  const idx = codexIndex()
  const parents = new Set(idx.map(e => e.parent).filter(Boolean))
  const codex = [...new Set(idx.filter(e => !e.sub && parents.has(e.id)).filter(e => { try { return readFileSync(e.file, 'utf8').includes(marker) } catch { return false } }).map(e => e.id))]
  return { subagents, codex }
}
// The ledger's outcomes: a bead landed on a success `Merge:` line (no ` → blocker|auth-refused|held`)
// or a `Task … complete` line, and is blocked on `Task … BLOCKED`.
function readLedger(file) {
  let text
  try { text = readFileSync(file, 'utf8') } catch { return null }
  const landed = new Set(), blocked = new Set(), ids = new Set()
  let epic = null
  for (const line of text.split('\n')) {
    let m
    if ((m = /^Launch: mechanism \S+ · epic (\S+)/.exec(line))) epic = m[1]
    else if ((m = /^# SDD ledger — plan: \S*?([^/\s]+)-plan\.md/.exec(line))) epic ??= m[1]
    else if ((m = /^Merge: (\S+) — (.*)$/.exec(line))) { ids.add(m[1]); if (!/\s→\s/.test(m[2])) landed.add(m[1]) }
    else if ((m = /^Task \d+ \(([^)]+)\): (complete|BLOCKED)\b/.exec(line))) { ids.add(m[1]); (m[2] === 'complete' ? landed : blocked).add(m[1]) }
    else if ((m = /^Task \d+ \(([^)]+)\):/.exec(line))) ids.add(m[1])
  }
  return { file, epic, landed, blocked, ids }
}
function bdDump(cwd) {
  if (!cwd || !isDir(cwd)) return null
  try { return JSON.parse(execFileSync('bd', ['list', '--all', '--json', '--limit', '0'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000, maxBuffer: 1 << 28 })) } catch { return null }
}
// The epic's leaves and their in-tree blockers, as tree-deps defines them but over every status (the
// run is over, so most are closed): in-tree by parent links, not epics, not blocker or review beads.
function bdLeaves(dump, epic) {
  const byId = new Map(dump.filter(b => b?.id).map(b => [b.id, b]))
  const parents = b => [...(b.dependencies ?? []).filter(d => d.type === 'parent-child').map(d => d.depends_on_id), ...(b.parent ? [b.parent] : [])]
  const inTree = id => {
    const seen = new Set(), q = [id]
    while (q.length && seen.size < 1000) {
      const x = q.shift()
      if (x === epic) return true
      if (seen.has(x)) continue
      seen.add(x)
      q.push(...parents(byId.get(x) ?? {}))
    }
    return false
  }
  const leaves = new Map()
  for (const b of byId.values()) if (b.id !== epic && b.issue_type !== 'epic' && !(b.labels ?? []).some(l => l === 'blocker' || l === 'sp:review') && inTree(b.id)) leaves.set(b.id, [])
  for (const id of leaves.keys()) leaves.set(id, (byId.get(id).dependencies ?? []).filter(d => d.type === 'blocks' && leaves.has(d.depends_on_id) && d.depends_on_id !== id).map(d => d.depends_on_id))
  return leaves
}
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// A bead id inside free text, not as a prefix of a longer id (`cx.1` in `task-cx.1`, not in `cx.10`).
const idRe = (id, pre = '') => new RegExp(`(?<![A-Za-z0-9_.])${pre}${escRe(id)}(?![A-Za-z0-9_]|\\.[A-Za-z0-9])`)

// ---- --summarize: a baseline over earlier profiles ----
if (opt.summarize) {
  const loaded = opt.summarize.map(f => { try { return JSON.parse(readFileSync(f, 'utf8')) } catch { die(2, `not a profile JSON: ${f}`) } })
  for (const [i, x] of loaded.entries()) if (x?.version !== 1 || !x.criticalPath) die(2, `not a run-profile JSON (version 1): ${opt.summarize[i]}`)
  // A profile whose invocations an earlier input already covered is the same run profiled twice.
  const seenRuns = new Set()
  const ps = loaded.filter((x, i) => {
    const ids = (x.invocations ?? []).map(v => v.runId)
    if (ids.length && ids.every(id => seenRuns.has(id))) { process.stderr.write(`run-profile: --summarize: ${opt.summarize[i]} repeats runs already counted; skipped\n`); return false }
    ids.forEach(id => seenRuns.add(id))
    return true
  })
  const verdictOf = x => x.simulation?.verdict ?? (x.simulation?.failed ? 'model failed' : null)
    ?? (x.summary ?? []).find(l => l.startsWith('Profile: bound'))?.match(/→ ([a-z-]+):/)?.[1] ?? 'no model'
  const H = ms => fmtDur(ms)
  const add = (o, k, v) => { o[k] = (o[k] ?? 0) + v }
  const out = []
  const starts = ps.map(x => x.window.start).sort()
  const nInv = sum(ps.map(x => x.invocations?.length ?? 1))
  out.push(`Baseline: ${ps.length} profile${ps.length === 1 ? '' : 's'} · ${nInv} invocation${nInv === 1 ? '' : 's'} · ${new Set(ps.map(x => x.epic)).size} epic(s) · ${starts[0].slice(0, 10)} → ${starts.at(-1).slice(0, 10)} · task graph ${H(sum(ps.map(x => x.window.graphMs)))} · landed ${sum(ps.map(x => x.beads.filter(b => b.landed).length))} beads`)
  const cat = {}
  for (const x of ps) for (const [k, v] of Object.entries(x.criticalPath.byCategory)) add(cat, k, v)
  const ct = sum(Object.values(cat))
  out.push(`Baseline: critical path — ${Object.entries(cat).sort((a, b) => b[1] - a[1]).filter(([, v]) => v >= 0.005 * ct).map(([k, v]) => `${k} ${pct(v, ct)}%`).join(' · ')} (of ${H(ct)})`)
  const ver = {}
  for (const x of ps) add(ver, verdictOf(x), 1)
  out.push(`Baseline: verdicts — ${Object.entries(ver).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`)
  const fits = ps.map(x => x.simulation?.fit).filter(f => typeof f === 'number').sort((a, b) => a - b)
  if (fits.length) out.push(`Baseline: model fit — median ${fits[Math.floor(fits.length / 2)]} · within 10% of actual ${fits.filter(f => f >= 0.9 && f <= 1.1).length} of ${fits.length} · lowest ${fits[0]}`)
  const w = {}, wn = {}
  for (const x of ps) for (const b of x.beads) if (b.landed && b.waitCause !== 'none') { add(w, b.waitCause, b.waitMs); add(wn, b.waitCause, 1) }
  out.push(`Baseline: waits, summed per bead (not wall time) — ${Object.keys(w).length ? Object.entries(w).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${H(v)} (${wn[k]})`).join(' · ') : 'none past dispatch latency'}`)
  const rd = {}, rn = {}
  for (const x of ps) for (const [k, v] of Object.entries(x.criticalPath.redo ?? {})) { add(rd, k, v.ms); add(rn, k, v.beads.length) }
  if (Object.values(rd).some(v => v >= 1000)) out.push(`Baseline: redo on the critical path, up to — ${Object.entries(rd).filter(([, v]) => v >= 1000).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${H(v)} (${rn[k]})`).join(' · ')} (of ${H(sum(ps.map(x => x.window.graphMs)))} task-graph time)`)
  const withDeps = ps.flatMap(x => x.beads.filter(b => b.landed && b.deps.length))
  out.push(`Baseline: early unblock — ${withDeps.length} landed beads had in-run blockers · stacked on an implementation ${withDeps.filter(b => b.stackParents.length).length} · bounced on a stack conflict ${withDeps.filter(b => b.waitCause === 'stack-conflict').length} · waited for a merge ${withDeps.filter(b => b.waitCause === 'waited-for-merge').length}`)
  const busy = sum(ps.map(x => x.lane.busyMs)), seam = sum(ps.map(x => x.lane.seamMs))
  out.push(`Baseline: merge lane — busy ${H(busy)} · seam reviews and fixes ${pct(seam, busy)}% of it · queue wait ${H(sum(ps.map(x => x.lane.queueWaitMs)))} summed · first try not merged ${sum(ps.map(x => x.lane.firstTryFailed))} of ${sum(ps.map(x => x.lane.firstTryKnown ?? x.beads.filter(b => b.landed).length))}`)
  const tsum = k => sum(ps.map(x => x.tests?.[k] ?? 0))
  if (tsum('busyMs')) out.push(`Baseline: tests — implementers and fixers, summed: ${H(tsum('testMs'))} running tests and ${H(tsum('pollMs'))} polling background runs, ${pct(tsum('testMs') + tsum('pollMs'), tsum('busyMs'))}% of their ${H(tsum('busyMs'))} · ${tsum('cappedCalls')} Bash call(s) at the 10-minute tool limit`)
  const st = new Map()
  for (const e of ps.flatMap(x => x.slowTests ?? [])) {
    const t = st.get(e.cmd) ?? { cmd: e.cmd, ms: 0, runs: 0, longestMs: 0 }
    t.ms += e.ms; t.runs += e.runs; t.longestMs = Math.max(t.longestMs, e.longestMs)
    st.set(e.cmd, t)
  }
  const stShown = [...st.values()].filter(e => e.longestMs >= 60000).sort((a, b) => b.ms - a.ms).slice(0, 5)
  if (stShown.length) out.push(`Baseline: slow tests — ${stShown.map(slowTestText).join(' · ')}`)
  const tools = {}
  let implMs = 0
  for (const x of ps) if (x.bottleneck) { for (const [k, v] of Object.entries(x.bottleneck.implByTool ?? {})) add(tools, k, v); implMs += x.beads.find(b => b.id === x.bottleneck.bead)?.implMs ?? 0 }
  const tt = sum(Object.values(tools))
  if (implMs) out.push(`Baseline: bottleneck implement — ${H(implMs)} across ${ps.filter(x => x.bottleneck).length} bottleneck beads: ${Object.entries(tools).sort((a, b) => b[1] - a[1]).filter(([, v]) => v >= 0.01 * implMs).map(([k, v]) => `${k} ${pct(v, implMs)}%`).join(' · ')} · model ${pct(Math.max(0, implMs - tt), implMs)}%`)
  const wk = {}, ws = {}
  for (const x of ps) {
    for (const k of new Set((x.simulation?.whatIfs ?? []).map(y => y.kind))) add(wk, k, 1)
    for (const y of x.simulation?.whatIfs ?? []) add(ws, y.kind, y.savingMs)
  }
  if (Object.keys(wk).length) out.push(`Baseline: what-ifs — ${Object.entries(ws).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} in ${wk[k]} run(s), modelled savings ${H(v)} summed`).join(' · ')}`)
  console.log(out.join('\n'))
  process.exit(0)
}

// ---- load ----
const projectsDir = opt.projects ?? join(homedir(), '.claude', 'projects')
const dirs = [...new Set([...opt.workflow, ...(opt.discover ? discover(projectsDir, opt.epic) : [])])]
const found = opt.discover ? discoverOrdinary(projectsDir, opt.epic) : { subagents: [], codex: [] }
const codexIn = [...new Set([...opt.codex, ...found.codex])]
const subIn = [...new Set([...opt.subagents, ...found.subagents])]
for (const d of [...dirs, ...subIn]) if (!isDir(d)) die(2, `not a directory: ${d}`)
let runs = [...dirs.map(readRun), ...codexIn.map(readCodex), ...subIn.map(readSubagents)]
const notCoordinator = runs.filter(r => !r.coordinator)
if (notCoordinator.length) die(2, `not a super-code coordinator run (no ledger read, ready query or planner dispatch): ${notCoordinator.map(r => r.dir).join(', ')}`)
const skippedDry = runs.filter(r => r.launch?.dryRun === true && !opt.includeDryRun)
runs = runs.filter(r => !skippedDry.includes(r))
// One run id can sit under two project directories; keep the copy with the most timed agents.
const byRunId = new Map()
for (const r of runs) {
  const n = [...r.agents.values()].filter(a => a.start !== undefined).length
  if (!byRunId.has(r.runId) || n > byRunId.get(r.runId).n) byRunId.set(r.runId, { run: r, n })
}
runs = [...byRunId.values()].map(x => x.run)
if (opt.latest && runs.length > 1) {
  const span = r => { const ts = [...r.agents.values()].filter(a => a.start !== undefined); return ts.length ? [Math.min(...ts.map(a => a.start)), Math.max(...ts.map(a => a.end))] : null }
  const spans = runs.map(r => ({ r, s: span(r) })).filter(x => x.s).sort((a, b) => a.s[0] - b.s[0])
  if (spans.length) {
    const keep = [spans.at(-1)]
    for (let i = spans.length - 2; i >= 0 && keep[0].s[0] - spans[i].s[1] < 600000; i--) keep.unshift(spans[i])
    runs = keep.map(x => x.r)
  }
}

// ---- ordinary-subagent runs: labels from dispatch names, outcomes from the ledger, the graph from bd,
// and the merges, which the coordinator runs itself, from its own commands ----
const ordinary = runs.filter(r => r.source !== 'workflow')
const serialRuns = new Set(ordinary.map(r => r.runId))
let ledger = null, leaves = null, noLaneTiming = 0
if (ordinary.length) {
  const named = [...new Set(ordinary.flatMap(r => r.callerCalls.flatMap(c => [...c.text.matchAll(LEDGER_RE)].map(m => m[1]))))]
  const ledgerPath = opt.ledger ?? named.find(f => existsSync(f) && (!opt.epic || f.includes(`/${opt.epic}-plan/`)))
  ledger = ledgerPath ? readLedger(ledgerPath) : null
  if (opt.ledger && !ledger) die(2, `cannot read the ledger: ${opt.ledger}`)
  const ep = opt.epic ?? ledger?.epic
  if (!ep) die(2, 'an ordinary-subagent run needs --epic <id> (or a --ledger whose Launch: line names it)')
  let dump = null
  if (opt.beads) { try { dump = JSON.parse(readFileSync(opt.beads, 'utf8')) } catch { die(2, `not a bd list JSON dump: ${opt.beads}`) } }
  else for (const r of ordinary) if ((dump = bdDump(r.cwd))) break
  leaves = Array.isArray(dump) ? bdLeaves(dump, ep) : null
  const ids = new Set([...(leaves?.keys() ?? []), ...(ledger?.ids ?? [])])
  const byNorm = new Map()
  for (const id of ids) { const k = normName(id); byNorm.set(k, byNorm.has(k) && byNorm.get(k) !== id ? null : id) }
  for (const r of ordinary) {
    r.launch = { epicId: ep, mechanism: 'ordinary-subagents', config: { concurrency: 1, earlyUnblock: false } }
    r.journal = !!ledger
    for (const a of r.agents.values()) {
      const label = r.source === 'codex' ? codexLabel(a.name, byNorm) : a.name
      const p = parseLabel(label ?? '')
      a.mapped = !!label && ((!!p.bead && (!ids.size || ids.has(p.bead))) || RUN_KINDS.includes(p.kind))
      if (a.mapped) { Object.assign(a, { label }, p); a.stage = stageOf(a.kind, a.suffix) }
      else Object.assign(a, { label: a.name || '(unnamed)', kind: /[a-z0-9]+/i.exec(a.name ?? '')?.[0]?.toLowerCase() ?? '?', bead: null, suffix: '', stage: 'other' })
    }
    // A lane turn per bead: from the coordinator's first `git merge|rebase` naming task-<id> to its
    // last command naming the bead before the next dispatch (a seam review splits it in two).
    const real = [...r.agents.values()].filter(a => a.start !== undefined)
    const starts = real.map(a => a.start).sort((x, y) => x - y)
    for (const id of new Set(real.filter(a => a.bead).map(a => a.bead))) {
      if (real.some(a => a.bead === id && a.kind === 'merge')) continue
      const from = Math.min(...real.filter(a => a.bead === id).map(a => a.start))
      const re = idRe(id), taskRe = idRe(id, 'task-')
      const opens = r.callerCalls.filter(c => c.start >= from && /\bgit\b[\s\S]*\b(?:merge|rebase)\b/.test(c.text) && taskRe.test(c.text)).sort((x, y) => x.start - y.start)
      for (let i = 0, k = 0; i < opens.length; k++) {
        const s = opens[i].start, stop = starts.find(t => t > s) ?? Infinity
        const end = Math.max(...r.callerCalls.filter(c => c.start >= s && c.start < stop && re.test(c.text)).map(c => c.end))
        const m = { id: `${r.runId}:merge:${id}:${k}`, run: r.runId, label: `merge:${id}`, synthetic: true, mapped: true, start: s, end, dur: end - s, toolMs: 0, byCat: {}, calls: [] }
        Object.assign(m, parseLabel(m.label)); m.stage = 'merge'
        r.agents.set(m.id, m)
        while (i < opens.length && opens[i].start < stop) i++
      }
    }
  }
  if (ledger) {
    const all = ordinary.flatMap(r => [...r.agents.values()]).filter(a => a.bead && a.start !== undefined).sort((x, y) => x.start - y.start)
    for (const id of new Set(all.map(a => a.bead))) {
      const as = all.filter(a => a.bead === id), merges = as.filter(a => a.kind === 'merge'), impls = as.filter(a => a.kind === 'impl')
      const ok = ledger.landed.has(id)
      merges.forEach((a, i) => { a.result = { merged: ok && i === merges.length - 1 } })
      if (impls.length) impls.at(-1).result = { status: ok ? 'IMPLEMENTED' : ledger.blocked.has(id) ? 'BLOCKED' : null }
      if (ok && !merges.length) {
        // Landed, but no merge in the coordinator's log: a zero-length landing where its chain ended.
        const last = latest(as), r = ordinary.find(x => x.runId === last.run)
        const m = { id: `${r.runId}:merge:${id}:end`, run: r.runId, label: `merge:${id}`, synthetic: true, mapped: true, start: last.end, end: last.end, dur: 0, toolMs: 0, byCat: {}, calls: [], result: { merged: true } }
        Object.assign(m, parseLabel(m.label)); m.stage = 'merge'
        r.agents.set(m.id, m)
        noLaneTiming++
      }
    }
  }
}
const epicOf = r => r.launch?.epicId ?? planEpic(r)
const epic = opt.epic ?? runs.map(epicOf).find(Boolean) ?? null
const foreign = runs.filter(r => epic && epicOf(r) && epicOf(r) !== epic)
if (foreign.length) die(2, `runs for another epic were given: ${foreign.map(r => `${r.runId} (${epicOf(r)})`).join(', ')}; expected ${epic}`)

// A resumed run can list a cached agent again under its original agentId: keep the timed copy.
const agentById = new Map()
for (const r of runs) for (const a of r.agents.values()) {
  const prev = agentById.get(a.id)
  if (!prev || (prev.start === undefined && a.start !== undefined)) agentById.set(a.id, a)
}
const allAgents = [...agentById.values()]
const realAgents = allAgents.filter(a => !a.synthetic)
const timed = allAgents.filter(a => a.start !== undefined && a.label).sort((a, b) => a.start - b.start || a.end - b.end)
const untimed = allAgents.filter(a => a.start === undefined)
if (!timed.some(a => a.bead) && !timed.some(a => serialRuns.has(a.run))) {
  const why = !dirs.length && !codexIn.length && !subIn.length ? `no Workflow run directory found${opt.epic ? ` for ${opt.epic}` : ''}, nor an ordinary-subagent coordinator's log (this harness keeps none, or they were cleaned up)`
    : !runs.length ? `every run given was a dryRun launch (${skippedDry.map(r => r.runId).join(', ')})`
    : 'no timed task dispatch in the runs given (transcripts missing)'
  console.log(`Profile: unavailable — ${why}`)
  process.exit(3)
}
const invocations = runs.map(r => {
  const as = timed.filter(a => a.run === r.runId)
  return { runId: r.runId, dir: r.dir, source: r.source, journal: r.journal, launch: r.launch, agents: [...r.agents.values()].filter(a => !a.synthetic).length, timed: as.length,
    start: as.length ? as[0].start : null, end: as.length ? Math.max(...as.map(a => a.end)) : null }
}).filter(v => v.start !== null).sort((a, b) => a.start - b.start)
const launch = invocations.map(v => v.launch).filter(Boolean).at(-1) ?? null
const cfg = launch?.config ?? {}
const earlyUnblock = cfg.earlyUnblock !== false
const runtimeSlots = Number(cfg.runtimeSlots) > 0 ? Number(cfg.runtimeSlots) : null
const cap = opt.cap !== undefined ? Number(opt.cap)
  : Number(cfg.concurrency) > 0 && runtimeSlots > 2 ? Math.min(Number(cfg.concurrency), runtimeSlots - 2)
  : Number(cfg.concurrency) > 0 ? Number(cfg.concurrency) : Infinity
const windowStart = invocations[0].start

// ---- run level, for ordinary-subagent runs: how many dispatches ran at once (3 and more counted
// together), and time per kind.
// Needs no bead mapping, so it also covers dispatches whose names do not follow the label grammar ----
const runLevel = (() => {
  const ds = timed.filter(a => !a.synthetic && serialRuns.has(a.run))
  if (!ds.length) return null
  const s0 = Math.min(...ds.map(a => a.start)), s1 = Math.max(...ds.map(a => a.end))
  const byActive = {}
  let n = 0, prev = s0, peak = 0
  for (const [t, d] of ds.flatMap(a => [[a.start, 1], [a.end, -1]]).sort((x, y) => x[0] - y[0] || x[1] - y[1])) {
    if (t > prev) byActive[Math.min(n, 3)] = (byActive[Math.min(n, 3)] ?? 0) + t - prev
    n += d; prev = t; peak = Math.max(peak, n)
  }
  const kinds = {}
  for (const a of ds) { const k = kinds[a.kind + (a.mapped ? '' : '?')] ??= { kind: a.kind, mapped: a.mapped, ms: 0, n: 0 }; k.ms += a.dur; k.n++ }
  const merges = timed.filter(a => a.synthetic && serialRuns.has(a.run))
  const wall = s1 - s0, busy = unionMs(ds.map(a => [a.start, a.end]))
  const kt = ks => { ks.sort((x, y) => y.ms - x.ms); const rest = ks.slice(8); return [...ks.slice(0, 8).map(k => `${k.kind} ${fmtDur(k.ms)} (${k.n})`), ...(rest.length ? [`${rest.length} more ${fmtDur(sum(rest.map(k => k.ms)))} (${sum(rest.map(k => k.n))})`] : [])].join(' · ') }
  const mapped = Object.values(kinds).filter(k => k.mapped), unmapped = Object.values(kinds).filter(k => !k.mapped)
  return {
    unmapped: ds.filter(a => !a.mapped).length,
    json: { dispatches: ds.length, wallMs: wall, busyMs: busy, byActive, peak, kinds: Object.values(kinds), coordinatorMergeMs: sum(merges.map(a => a.dur)) },
    lines: [
      `Profile: concurrency — ${ds.length} dispatches over ${fmtDur(wall)} · a dispatch running ${fmtDur(busy)} (${pct(busy, wall)}%) · dispatches at once: ${Object.entries(byActive).map(([k, v]) => `${k === '3' ? '3+' : k} for ${pct(v, wall)}%`).join(' · ')} of the time · peak ${peak}`,
      `Profile: dispatch time by kind, summed — ${[kt(mapped), unmapped.length ? `not named for a bead: ${kt(unmapped)}` : '', merges.length ? `merges run by the coordinator ${fmtDur(sum(merges.map(a => a.dur)))} (${merges.length})` : ''].filter(Boolean).join(' · ')}`,
    ],
  }
})()
const RULE = 'coordinator-subagents.md names dispatches <kind>_<bead id> on Codex, <kind>:<bead id> on Claude Code'
if (!timed.some(a => a.bead)) {
  // No dispatch maps to a bead: only the run-level lines.
  const end = Math.max(...timed.map(a => a.end))
  const lines = [`Profile: ${epic ?? '(epic unknown)'} · ${invocations.length} invocation${invocations.length === 1 ? '' : 's'} · ${fmtTime(windowStart)} → ${fmtTime(end)} · wall ${fmtDur(end - windowStart)} · agents ${realAgents.length} (timed ${realAgents.filter(a => a.start !== undefined).length}) · beads dispatched 0${leaves ? `, planned ${leaves.size}` : ''}`,
    ...runLevel.lines,
    `Profile: unmeasured — no per-bead profile: no dispatch is named for a bead of ${epic} (${RULE})`]
  console.log(lines.join('\n'))
  if (opt.out) {
    writeFileSync(`${opt.out}.json`, JSON.stringify({ version: 1, epic, partial: true, invocations: invocations.map(v => ({ runId: v.runId, dir: v.dir, source: v.source, start: new Date(v.start).toISOString(), end: new Date(v.end).toISOString(), agents: v.agents, timed: v.timed })), concurrency: runLevel.json, summary: lines }, null, 2) + '\n')
    writeFileSync(`${opt.out}.md`, [`# Run profile — ${epic ?? 'unknown epic'}`, '', '```', ...lines, '```', ''].join('\n'))
  }
  process.exit(0)
}

// ---- the graph: every planner row seen, read from journal results (a planner cached on resume has
// no transcript). Deps are the open in-tree blockers at that planning, so the union is the run's
// graph; plus planner-found missing edges, and applied edge cuts with the time they landed ----
const runStart = new Map(invocations.map(v => [v.runId, v.start]))
const doneAt = a => a.end ?? runStart.get(a.run) ?? windowStart
const rows = new Map()
const cuts = []
for (const a of allAgents.filter(x => /^(plan|plan-rest|edge-cuts)$/.test(x.kind ?? '') && x.result).sort((x, y) => doneAt(x) - doneAt(y))) {
  const at = doneAt(a)
  const agent = a.start !== undefined ? a : null
  if (Array.isArray(a.result.mapping)) {
    for (const m of a.result.mapping) {
      if (!m || typeof m.id !== 'string') continue
      const row = rows.get(m.id) ?? { id: m.id, n: m.n, deps: new Set(), files: new Set(), opaque: false, graph: false, mappings: [] }
      for (const d of m.deps ?? []) if (d !== m.id) row.deps.add(d)
      for (const f of m.files ?? []) row.files.add(f)
      row.graph ||= Array.isArray(m.deps)
      row.opaque ||= m.opaque === true
      row.mappings.push({ at, agent })
      rows.set(m.id, row)
    }
    for (const e of a.result.missingEdges ?? []) if (e?.dependent && e?.blocker) rows.get(e.dependent)?.deps.add(e.blocker)
  }
  if (a.kind === 'edge-cuts') for (const c of a.result.applied ?? []) if (c?.dependent && c?.blocker) {
    cuts.push({ dependent: c.dependent, blocker: c.blocker, kind: c.kind, at, agent })
    for (const e of c.add ?? []) if (e?.dependent && e?.blocker) rows.get(e.dependent)?.deps.add(e.blocker)
  }
}
// An ordinary-subagent run has no planner rows in a journal: its graph is bd's, released when its
// first planner returned.
if (leaves) {
  const plan0 = timed.filter(a => serialRuns.has(a.run) && a.stage === 'planning').sort((x, y) => x.end - y.end)[0] ?? null
  for (const [id, deps] of leaves) if (!rows.has(id)) rows.set(id, { id, n: undefined, deps: new Set(deps), files: new Set(), opaque: false, graph: true, mappings: [{ at: plan0 ? plan0.end : windowStart, agent: plan0 }] })
}
// The planning a dispatch at time t followed: the bead's latest mapping by then.
const mappingFor = (id, t) => { const ms = rows.get(id)?.mappings ?? []; return ms.filter(m => m.at <= t + EPS).at(-1) ?? ms[0] ?? null }
const cutAt = (dependent, blocker) => cuts.find(c => c.dependent === dependent && c.blocker === blocker)?.at ?? Infinity
const depsAt = (id, t) => [...(rows.get(id)?.deps ?? [])].filter(d => rows.has(d) && cutAt(id, d) > t)
const dependentsOf = new Map()
for (const r of rows.values()) for (const d of r.deps) { if (!dependentsOf.has(d)) dependentsOf.set(d, new Set()); dependentsOf.get(d).add(r.id) }

// ---- per-bead attempts; every attempt starts with an `impl` dispatch (a review re-entry re-runs setup),
// or with the `brief:` that preceded it in older coordinators ----
const beads = new Map()
for (const a of timed) if (a.bead) {
  if (!beads.has(a.bead)) beads.set(a.bead, { id: a.bead, n: rows.get(a.bead)?.n, agents: [], attempts: [] })
  beads.get(a.bead).agents.push(a)
}
const hasJournal = run => runs.find(r => r.runId === run)?.journal
for (const b of beads.values()) {
  let cur = null
  for (const a of b.agents) {
    const afterBrief = cur && cur.agents.at(-1)?.kind === 'brief'
    if (!cur || a.kind === 'brief' || (a.kind === 'impl' && !afterBrief)) { cur = { bead: b.id, agents: [] }; b.attempts.push(cur) }
    cur.agents.push(a)
    a.attempt = cur
  }
  for (const at of b.attempts) {
    const by = st => at.agents.filter(a => a.stage === st)
    const head = at.agents[0]
    at.start = head.start
    at.run = head.run
    const implHead = at.agents.find(a => a.kind === 'impl')
    at.status = implHead ? (implHead.result?.status ?? (implHead.failed ? 'FAILED' : null)) : null
    at.impl = by('implement'); at.review = by('review'); at.fix = by('fix'); at.lane = at.agents.filter(a => LANE.has(a.stage))
    at.split = by('split')[0] ?? null
    at.blocker = by('blocker')
    // The slot is held to the chain's end before integration; a failed merge's blocker path takes one
    // again after the lane turn.
    const laneStart = at.lane.length ? at.lane[0].start : Infinity
    const inSlot = at.agents.filter(a => IN_SLOT.has(a.stage))
    at.chainEndAgent = latest(inSlot.filter(a => a.end <= laneStart + EPS))
    at.afterLane = inSlot.filter(a => a.start >= laneStart)
    // Usable by dependents (early unblock): the end of an implementation that committed.
    at.implEndAgent = at.status === 'IMPLEMENTED' || (!hasJournal(head.run) && at.impl.length) ? latest(at.impl) : null
    // The landing: the last merge that reported merged (no journal: the last merge), or a close-only
    // step that confirmed the branch had already merged.
    const merges = at.agents.filter(a => a.kind === 'merge')
    at.landing = merges.filter(a => a.result?.merged === true).at(-1)
      ?? (merges.length && !hasJournal(merges.at(-1).run) ? merges.at(-1) : null)
      ?? at.agents.filter(a => a.stage === 'close' && (a.result?.status === 'CLOSED' || !hasJournal(a.run))).at(-1) ?? null
  }
  // The landing is the real merge. A later close-only of an already-merged branch (its bead close was
  // lost) is bookkeeping, counted apart as a re-entry close.
  b.final = b.attempts.filter(at => at.landing?.kind === 'merge').at(-1) ?? b.attempts.filter(at => at.landing).at(-1) ?? b.attempts.at(-1)
  b.reentryCloses = b.attempts.filter(at => at.start > b.final.start && at.landing && at.landing.kind !== 'merge')
  b.landed = !!b.final.landing
}
const landingOf = id => beads.get(id)?.final?.landing ?? null
const landedBy = (d, t) => beads.get(d)?.attempts.map(at => at.landing).filter(x => x && x.end <= t + EPS).at(-1) ?? null
const implementedBy = (d, t) => beads.get(d)?.attempts.map(at => at.implEndAgent).filter(x => x && x.end <= t + EPS).at(-1) ?? null
// The earliest event that let dependents use bead d, as of time t: its implementation under early
// unblock, else its merge.
const usableBy = (d, t) => (earlyUnblock && implementedBy(d, t)) || landedBy(d, t)

// ---- slots and ready queries, for explaining waits ----
const hotFileCap = Math.max(1, Number(cfg.hotFileCap) || 3)
// The ordinary-subagent coordinator runs one chain at a time, merge included: its slot is the whole attempt.
const slotSpans = [...beads.values()].flatMap(b => b.attempts.flatMap(at => {
  if (serialRuns.has(at.run)) { const a = latest(at.agents.filter(x => x.stage !== 'ledger')); return a ? [{ bead: b.id, start: at.start, end: a.end, agent: a }] : [] }
  return [
    ...(at.chainEndAgent ? [{ bead: b.id, start: at.start, end: at.chainEndAgent.end, agent: at.chainEndAgent }] : []),
    ...(at.afterLane.length ? [{ bead: b.id, start: at.afterLane[0].start, end: latest(at.afterLane).end, agent: latest(at.afterLane) }] : []),
  ]
}))
// What freed the start of bead `id` at `start`: a chain ending just before it while every slot was
// busy, or while `hotFileCap` in-flight chains declared a file it shares.
function slotRelease(id, start, after) {
  const rel = latest(slotSpans.filter(s => s.bead !== id && s.end <= start + EPS && s.end >= start - DISPATCH_GAP && s.end > after + EPS))
  if (!rel) return null
  const live = slotSpans.filter(s => s.bead !== id && s.start < rel.end - 1 && s.end >= rel.end - 1)
  if (Number.isFinite(cap) && live.length >= cap) return { agent: rel.agent, why: 'slot' }
  const mine = rows.get(id)?.files ?? new Set()
  const shared = [...(rows.get(rel.bead)?.files ?? [])].filter(f => mine.has(f))
  if (shared.some(f => live.filter(s => rows.get(s.bead)?.files.has(f)).length >= hotFileCap)) return { agent: rel.agent, why: 'hot-file' }
  return null
}
const endedNear = (xs, start) => latest(xs.filter(x => x.start < start && x.end <= start + EPS && x.end >= start - DISPATCH_GAP))
const readyQueries = timed.filter(a => a.stage === 'ready')
const planners = timed.filter(a => a.stage === 'planning')

// ---- per-bead timeline of the final attempt, and why it started when it did ----
const invStartOf = run => runStart.get(run) ?? windowStart
for (const b of beads.values()) {
  const at = b.final
  const S = at.start
  const invStart = invStartOf(at.run)
  const dur = as => sum(as.map(a => a.dur))
  const deps = depsAt(b.id, S)
  b.deps = deps
  const ready = Math.max(mappingFor(b.id, S)?.at ?? invStart, ...deps.map(d => usableBy(d, S)).filter(Boolean).map(x => x.end))
  // Ready before this invocation began (a relaunch, or the caller's next round): not a wait inside it.
  b.carriedMs = Math.max(0, invStart - ready)
  b.readyAt = Math.max(ready, invStart)
  b.dispatchedAt = S
  b.waitMs = Math.max(0, S - b.readyAt)
  const earlier = b.attempts.filter(x => x !== at && x.start < S)
  const earlierHere = earlier.filter(x => x.start >= invStart - EPS)
  const bounced = earlierHere.filter(x => x.status === 'STACK_CONFLICT')
  if (b.waitMs <= DISPATCH_GAP) b.waitCause = 'none'
  else if (bounced.length) b.waitCause = 'stack-conflict'
  else if (earlierHere.some(x => x.agents.some(a => a.stage === 'cancel'))) b.waitCause = 'cancelled'
  else if (earlierHere.length) b.waitCause = 'retry'
  else {
    const land = deps.map(d => landedBy(d, S)).filter(x => x && x.end >= S - DISPATCH_GAP).at(-1)
    const rel = slotRelease(b.id, S, b.readyAt)
    b.waitCause = land ? 'waited-for-merge' : rel?.why === 'slot' ? 'slot' : endedNear(readyQueries, S) ? 'ready-query'
      : rel?.why === 'hot-file' ? 'hot-file' : endedNear(planners, S) ? 'planning' : 'unexplained'
  }
  // Stack conflicts: the bounced attempt's stack parents (implemented, not merged yet) are the ones
  // this bead then waited on.
  b.lateEdges = new Set()
  if (bounced.length) for (const d of deps) { const l = landedBy(d, S); if (l && l.end > bounced[0].start + EPS) b.lateEdges.add(d) }
  if (b.waitCause === 'waited-for-merge') for (const d of deps) { const l = landedBy(d, S); if (l && l.end >= S - DISPATCH_GAP) b.lateEdges.add(d) }
  b.stackConflictMs = bounced.length ? Math.max(0, S - bounced[0].start) : 0
  b.implMs = dur(at.impl); b.reviewMs = dur(at.review); b.fixMs = dur(at.fix)
  b.implByCat = {}
  for (const a of at.impl) for (const [k, v] of Object.entries(a.byCat ?? {})) b.implByCat[k] = (b.implByCat[k] ?? 0) + v
  b.implToolMs = sum(at.impl.map(a => a.toolMs ?? 0))
  b.blockerMs = sum(b.attempts.map(x => dur(x.blocker)))
  b.reworkMs = sum(earlier.map(x => dur(x.agents.filter(a => a.stage !== 'ledger'))))
  const chainEnd = at.chainEndAgent ? at.chainEndAgent.end : S
  // A stacked task merges only after every task it was cut on merged; a split task after its split.
  b.stackParents = deps.filter(d => { const l = landingOf(d); return l && l.end > S + EPS })
  b.enqueueAt = Math.max(chainEnd, ...b.stackParents.map(d => landingOf(d).end), at.split ? at.split.end : -Infinity)
  const laneStart = at.lane.length ? at.lane[0].start : null
  b.laneStart = laneStart
  b.stackWaitMs = laneStart !== null ? Math.max(0, b.enqueueAt - chainEnd) : 0
  b.queueWaitMs = laneStart !== null ? Math.max(0, laneStart - b.enqueueAt) : 0
  b.landedAt = at.landing ? at.landing.end : null
  b.laneMs = laneStart !== null && b.landedAt !== null ? b.landedAt - laneStart : dur(at.lane)
  b.seamMs = dur(at.lane.filter(a => a.stage === 'seam'))
  const first = at.lane[0]?.result
  b.firstTryMerged = first && typeof first.merged === 'boolean' ? first.merged : null
}
const landed = [...beads.values()].filter(b => b.landed)
const lastLanding = latest(landed.map(b => b.final.landing))
const runEnd = Math.max(...timed.map(a => a.end))
// With nothing landed, the task graph ends at its last task step.
const lastTaskStep = lastLanding ?? latest(timed.filter(a => a.bead && a.stage !== 'ledger')) ?? latest(timed)
const graphEnd = lastTaskStep.end
const actualGraphMs = graphEnd - windowStart

// ---- merge lane, runtime slots, conflict files ----
const laneAgents = timed.filter(a => LANE.has(a.stage))
const lane = {
  busyMs: unionMs(laneAgents.map(a => [a.start, a.end])),
  seamMs: sum(laneAgents.filter(a => a.stage === 'seam').map(a => a.dur)),
  spanMs: laneAgents.length ? Math.max(...laneAgents.map(a => a.end)) - laneAgents[0].start : 0,
  merges: laneAgents.filter(a => a.kind === 'merge').length,
  firstTryFailed: landed.filter(b => b.firstTryMerged === false).length,
  firstTryKnown: landed.filter(b => b.firstTryMerged !== null).length,
  queueWaitMs: sum(landed.map(b => b.queueWaitMs)),
  stackWaitMs: sum(landed.map(b => b.stackWaitMs)),
}
{
  const ev = landed.filter(b => b.laneStart !== null && b.laneStart > b.enqueueAt).flatMap(b => [[b.enqueueAt, 1], [b.laneStart, -1]]).sort((x, y) => x[0] - y[0] || x[1] - y[1])
  let n = 0
  lane.peakQueue = 0
  for (const [, d] of ev) { n += d; lane.peakQueue = Math.max(lane.peakQueue, n) }
}
const runtime = { slots: runtimeSlots, peak: 0, fullMs: 0 }
{
  const ev = timed.filter(a => !a.synthetic).flatMap(a => [[a.start, 1], [a.end, -1]]).sort((x, y) => x[0] - y[0] || x[1] - y[1])
  let n = 0, prev = null
  for (const [t, d] of ev) {
    if (prev !== null && runtimeSlots && n >= runtimeSlots) runtime.fullMs += t - prev
    n += d; prev = t
    runtime.peak = Math.max(runtime.peak, n)
  }
}
const FILE_RE = /(?:[\w@.+-]+\/)+[\w@.+-]+\.[A-Za-z0-9]{1,8}\b/g
const conflict = new Map()
const hit = (f, k) => { const c = conflict.get(f) ?? { file: f, stackConflicts: new Set(), seamOverlaps: 0 }; if (k) c.stackConflicts.add(k); else c.seamOverlaps++; conflict.set(f, c) }
for (const b of beads.values()) for (const at of b.attempts) {
  if (at.status === 'STACK_CONFLICT') for (const f of new Set(String(at.agents[0].result?.finding ?? '').match(FILE_RE) ?? [])) hit(f, b.id)
  for (const a of at.lane) for (const f of a.result?.seamOverlap ?? []) if (typeof f === 'string') hit(f, null)
}
const declaredBy = f => [...rows.values()].filter(r => r.files.has(f)).length
const hotConflicts = [...conflict.values()].map(c => ({ file: c.file, stackConflicts: c.stackConflicts.size, seamOverlaps: c.seamOverlaps, declaredBy: declaredBy(c.file) }))
  .sort((x, y) => (y.stackConflicts + y.seamOverlaps) - (x.stackConflicts + x.seamOverlaps) || (x.file < y.file ? -1 : 1))

// ---- realized critical path: walk back from the last landing through each step's binding predecessor ----
// A predecessor started strictly before the step and ended by its start (EPS of clock slack); among
// the candidates the one that ended last binds. Starts strictly decrease, so the walk cannot cycle.
const WHY_RANK = ['stack-conflict', 'dep', 'stack-parent', 'chain', 'split', 'planned', 'retry', 'edge-cut', 'merge-lane', 'slot', 'hot-file', 'ready-query', 'previous', 'relaunch']
const before = (x, a) => x && x !== a && x.start < a.start && x.end <= a.start + EPS
const latestBefore = (xs, a) => latest(xs.filter(x => x.stage !== 'ledger' && before(x, a)))
const lanePrev = a => latest(laneAgents.filter(x => x.bead !== a.bead && before(x, a)))
function predecessors(a) {
  const out = []
  const add = (agent, why) => { if (before(agent, a)) out.push({ agent, why }) }
  const at = a.attempt
  if (a.bead && at && at.agents[0] === a) {
    // An attempt's head: its blockers, its planning, the attempt before it, an edge cut, and — when
    // those leave a gap — a freed slot, a ready query or a planner that just returned.
    const b = beads.get(a.bead)
    const idx = b.attempts.indexOf(at)
    const bouncedBefore = b.attempts.slice(0, idx).some(x => x.status === 'STACK_CONFLICT' && x.run === a.run)
    if (a.kind === 'impl' || a.kind === 'brief') for (const d of depsAt(a.bead, a.start)) {
      const u = usableBy(d, a.start), l = landedBy(d, a.start)
      add(u, 'dep')
      if (l && l !== u) add(l, bouncedBefore ? 'stack-conflict' : 'dep')
    }
    add(mappingFor(a.bead, a.start)?.agent, 'planned')
    if (idx > 0) add(latest(b.attempts[idx - 1].agents.filter(x => x.stage !== 'ledger')), 'retry')
    for (const c of cuts) if (c.dependent === a.bead) add(c.agent, 'edge-cut')
    const best = latest(out.map(o => o.agent))
    if (!best || a.start - best.end > DISPATCH_GAP) {
      const rel = slotRelease(a.bead, a.start, best ? best.end : -Infinity)
      if (rel) add(rel.agent, rel.why)
      add(endedNear(readyQueries, a.start), 'ready-query')
      add(endedNear(planners, a.start), 'planned')
    }
  } else if (a.bead && at && LANE.has(a.stage) && at.lane[0] === a) {
    add(at.chainEndAgent, 'chain')
    for (const d of beads.get(a.bead).stackParents ?? []) add(landingOf(d), 'stack-parent')
    add(at.split, 'split')
    add(lanePrev(a), 'merge-lane')
  } else if (a.bead && at) {
    add(latestBefore(at.agents, a), 'chain')
  }
  // Nothing structural: whatever ended last before it in its own invocation; at an invocation's
  // first step, the previous invocation's last one (a relaunch, or the caller's next round).
  if (!out.length) add(latestBefore(timed.filter(x => x.run === a.run), a), 'previous')
  if (!out.length) {
    const i = invocations.findIndex(v => v.runId === a.run)
    if (i > 0) add(latestBefore(timed.filter(x => x.run === invocations[i - 1].runId), a), 'relaunch')
  }
  return out
}
const path = []
{
  let cur = lastTaskStep
  const seen = new Set()
  while (cur && !seen.has(cur)) {
    seen.add(cur)
    const p = predecessors(cur).filter(x => !seen.has(x.agent))
      .sort((x, y) => y.agent.end - x.agent.end || WHY_RANK.indexOf(x.why) - WHY_RANK.indexOf(y.why))[0] ?? null
    path.push({ agent: cur, pred: p })
    cur = p?.agent ?? null
  }
  path.reverse()
}
// Segments: each step's own span (clipped so EPS overlaps are not counted twice), the gap before it,
// and the lead-in from the run's first dispatch. They sum to the task graph's wall time.
const segments = []
{
  let t = windowStart
  if (path.length && path[0].agent.start > t) { segments.push({ kind: 'startup', bead: null, label: 'run start', start: t, ms: path[0].agent.start - t }); t = path[0].agent.start }
  for (const step of path) {
    const a = step.agent
    const why = step.pred?.why
    if (step.pred && a.start > t) {
      const gap = a.start - t
      const kind = why === 'slot' || why === 'hot-file' || why === 'relaunch' ? why : gap <= DISPATCH_GAP ? 'dispatch' : 'wait'
      segments.push({ kind, bead: a.bead, label: `${why} → ${a.label}`, start: t, ms: gap })
      t = a.start
    }
    const s = Math.max(a.start, t)
    const ms = Math.max(0, a.end - s)
    segments.push({ kind: a.stage, bead: a.bead, label: a.label, start: s, ms, agent: a, why })
    t = s + ms
  }
}
const pathMs = sum(segments.map(s => s.ms))
const CAT_ORDER = ['implement', 'review', 'fix', 'merge', 'seam', 'split', 'blocker', 'cancel', 'close', 'planning', 'ready', 'audit', 'finish', 'ledger', 'other', 'startup', 'dispatch', 'slot', 'hot-file', 'wait', 'relaunch']
const byCat = {}
for (const s of segments) byCat[s.kind] = (byCat[s.kind] ?? 0) + s.ms
const crit = new Map()
for (const s of segments) if (s.bead) {
  const m = crit.get(s.bead) ?? { total: 0, byCat: {}, agents: [] }
  m.total += s.ms
  m.byCat[s.kind] = (m.byCat[s.kind] ?? 0) + s.ms
  if (s.agent) m.agents.push(s.agent)
  crit.set(s.bead, m)
}
for (const b of beads.values()) b.criticalMs = crit.get(b.id)?.total ?? 0
// Lane contention: a lane turn the next step waited behind only because the lane was busy (the
// next lane agent's predecessor is this turn's last agent, via `merge-lane`), counted whole.
let laneContentionMs = 0
{
  const steps = segments.filter(s => s.agent)
  for (let i = 0; i < steps.length - 1; i++) {
    if (!LANE.has(steps[i].kind) || steps[i + 1].why !== 'merge-lane') continue
    for (let j = i; j >= 0 && steps[j].bead === steps[i].bead && LANE.has(steps[j].kind); j--) laneContentionMs += steps[j].ms
  }
}
// Redo on the critical path: a bead whose final attempt is on the path and which had an earlier
// attempt in the same invocation cost the path up to the stretch from that attempt's start to the
// final one's — what a first-try success could have saved (the what-ifs model the actual saving). A
// bounce on a stack conflict is a lost early unblock; a re-dispatch after its stack parent failed is
// a cancellation; anything else (blocked, failed, a null) is a retry.
const redo = { 'stack-conflict': { ms: 0, beads: [] }, cancelled: { ms: 0, beads: [] }, retry: { ms: 0, beads: [] } }
{
  const onPath = new Set(segments.filter(s => s.agent).map(s => s.agent))
  for (const b of beads.values()) {
    const fin = b.final
    if (!onPath.has(fin.agents[0])) continue
    const prior = b.attempts.filter(x => x !== fin && x.run === fin.run && x.start < fin.start)
    if (!prior.length) continue
    const kind = prior.some(x => x.status === 'STACK_CONFLICT') ? 'stack-conflict' : prior.some(x => x.agents.some(a => a.stage === 'cancel')) ? 'cancelled' : 'retry'
    redo[kind].ms += fin.start - prior[0].start
    redo[kind].beads.push(b.id)
  }
}
const bottleneck = [...crit.entries()].sort((x, y) => y[1].total - x[1].total)[0] ?? null

// ---- graph shape over every planned bead ----
function shapeOf(ids, depsFn) {
  const set = new Set(ids)
  const level = new Map(), via = new Map(), cycles = new Set()
  // A dependency still on the stack is a back edge (a cycle in the planner rows): skipped and named.
  const visit = (id, stack = new Set()) => {
    if (level.has(id)) return level.get(id)
    stack.add(id)
    let lv = 1, from = null
    for (const d of depsFn(id)) {
      if (!set.has(d)) continue
      if (stack.has(d)) { cycles.add(`${id} <- ${d}`); continue }
      const l = visit(d, stack) + 1
      if (l > lv) { lv = l; from = d }
    }
    stack.delete(id)
    level.set(id, lv); via.set(id, from)
    return lv
  }
  for (const id of set) visit(id)
  const depth = Math.max(0, ...level.values())
  const levels = Array.from({ length: depth }, (_, i) => [...level.values()].filter(l => l === i + 1).length)
  let tail = [...set].filter(id => level.get(id) === depth).sort((x, y) => (beads.get(y)?.implMs ?? 0) - (beads.get(x)?.implMs ?? 0))[0]
  const chain = []
  while (tail && !chain.includes(tail)) { chain.unshift(tail); tail = via.get(tail) }
  const transitive = id => { const seen = new Set(), q = [id]; while (q.length) for (const y of dependentsOf.get(q.pop()) ?? []) if (set.has(y) && !seen.has(y)) { seen.add(y); q.push(y) } return seen.size }
  const fanOut = [...set].map(id => ({ id, direct: [...(dependentsOf.get(id) ?? [])].filter(y => set.has(y)).length, transitive: transitive(id) }))
    .filter(f => f.direct > 0).sort((x, y) => y.transitive - x.transitive || y.direct - x.direct || (x.id < y.id ? -1 : 1)).slice(0, 5)
  return { beads: set.size, edges: sum([...set].map(id => depsFn(id).filter(d => set.has(d)).length)), depth,
    width: depth ? Math.round(10 * set.size / depth) / 10 : 0, levels, criticalPath: chain, fanOut, cycles: [...cycles] }
}
const shape = shapeOf([...rows.keys()], id => [...(rows.get(id)?.deps ?? [])].filter(d => cutAt(id, d) === Infinity))

// ---- schedule model: the landed beads replayed with their measured times ----
// A bead takes a slot for implement + review + fix, then queues for the merge lane once its stack
// parents merged; the lane turn includes its seam work. Dependents start at a blocker's
// implementation (early unblock), except over the edges where this run's dependent waited for the
// merge (a stack conflict, or early unblock not taken): those wait for the blocker's landing.
// No planner rows means no graph: no model then. A bead's edges are the ones in force at its dispatch
// (a cut that landed later still bound it), and its release is the planning it followed.
const simInput = new Map()
if (rows.size) for (const b of landed) simInput.set(b.id, { id: b.id, I: b.implMs, R: b.reviewMs + b.fixMs, M: b.laneMs, seam: b.seamMs,
  release: (mappingFor(b.id, b.dispatchedAt)?.at ?? invStartOf(b.final.run)) - windowStart, deps: [] })
for (const s of simInput.values()) {
  const b = beads.get(s.id)
  s.deps = b.deps.filter(d => simInput.has(d)).map(d => ({ id: d, late: !earlyUnblock || b.lateEdges.has(d) }))
}
function simulate(input, { cap = Infinity, lanes = 1 } = {}) {
  const S = new Map([...input.values()].map(s => [s.id, { ...s, started: null, implEnd: null, chainEnd: null, queued: null, laneStart: null, landed: null, freed: false }]))
  const all = [...S.values()].sort((a, b) => a.release - b.release || (a.id < b.id ? -1 : 1))
  const laneFree = Array.from({ length: Number.isFinite(lanes) ? lanes : all.length || 1 }, () => 0)
  let t = 0, inSlot = 0
  for (let guard = 0; guard < 1e6; guard++) {
    let changed = true
    while (changed) {
      changed = false
      for (const s of all) if (s.started !== null && !s.freed && s.chainEnd <= t) { s.freed = true; inSlot--; changed = true }
      for (const s of all) if (s.chainEnd !== null && s.chainEnd <= t && s.queued === null) {
        const parents = s.deps.map(d => S.get(d.id)).filter(p => p.landed === null || p.landed > s.started)
        if (parents.every(p => p.landed !== null && p.landed <= t)) { s.queued = t; changed = true }
      }
      for (const s of all.filter(x => x.queued !== null && x.laneStart === null).sort((a, b) => a.queued - b.queued || (a.id < b.id ? -1 : 1))) {
        const k = laneFree.findIndex(f => f <= t)
        if (k < 0) break
        s.laneStart = t; s.landed = t + s.M; laneFree[k] = s.landed; changed = true
      }
      for (const s of all) {
        if (s.started !== null || s.release > t || inSlot >= cap) continue
        if (!s.deps.every(d => { const p = S.get(d.id); return d.late ? p.landed !== null && p.landed <= t : p.implEnd !== null && p.implEnd <= t })) continue
        s.started = t; s.implEnd = t + s.I; s.chainEnd = t + s.I + s.R; inSlot++; changed = true
      }
    }
    if (all.every(s => s.landed !== null && s.landed <= t)) break
    const next = Math.min(...all.flatMap(s => [s.release, s.implEnd, s.chainEnd, s.landed]).filter(x => x !== null && x > t), ...laneFree.filter(f => f > t))
    if (!Number.isFinite(next)) return NaN
    t = next
  }
  return Math.max(0, ...all.map(s => s.landed ?? 0))
}
// The graph's own bound (no slot cap, a lane per merge) in closed form, with the chain that sets it:
// from the last landing, follow whichever term bound each step — a stack parent's merge, else the
// blocker that released its start.
function lowerBoundChain(input) {
  const memo = new Map()
  const at = id => {
    if (memo.has(id)) return memo.get(id)
    memo.set(id, null)
    const s = input.get(id)
    let start = s.release, by = null
    for (const d of s.deps) { const p = at(d.id); if (!p) continue; const t = d.late ? p.landed : p.implEnd; if (t > start) { start = t; by = d.id } }
    const chainEnd = start + s.I + s.R
    let queued = chainEnd, viaMerge = null
    for (const d of s.deps) { const p = at(d.id); if (p && !d.late && p.landed > start && p.landed > queued) { queued = p.landed; viaMerge = d.id } }
    const r = { implEnd: start + s.I, landed: queued + s.M, by, viaMerge }
    memo.set(id, r)
    return r
  }
  for (const id of input.keys()) at(id)
  let cur = [...input.keys()].reduce((x, y) => (x === null || memo.get(y).landed > memo.get(x).landed ? y : x), null)
  const ms = cur === null ? 0 : memo.get(cur).landed
  const chain = []
  const seen = new Set()
  while (cur && !seen.has(cur)) { seen.add(cur); chain.unshift(cur); cur = memo.get(cur).viaMerge ?? memo.get(cur).by }
  return { ms, chain }
}
const withBeads = (fn) => new Map([...simInput].map(([k, v]) => [k, fn(v)]))
let sim = null
if (simInput.size && !Number.isFinite(simulate(simInput, { cap, lanes: 1 }))) sim = { failed: true, whatIfs: [] }
else if (simInput.size) {
  const base = { cap, lanes: 1 }
  const asRun = simulate(simInput, base)
  const s = {
    asRunMs: asRun, actualMs: actualGraphMs, fit: actualGraphMs > 0 ? Math.round(100 * asRun / actualGraphMs) / 100 : null,
    unlimitedSlotsMs: simulate(simInput, { ...base, cap: Infinity }),
    unlimitedLanesMs: simulate(simInput, { ...base, lanes: Infinity }),
    lowerBoundMs: simulate(simInput, { cap: Infinity, lanes: Infinity }),
    graphChain: lowerBoundChain(simInput).chain,
    whatIfs: [],
  }
  const push = (kind, target, ms, note) => { if (Number.isFinite(ms) && asRun - ms > Math.max(60000, asRun * 0.01)) s.whatIfs.push({ kind, target, ms, savingMs: asRun - ms, note }) }
  push('slots', 'unlimited slots', s.unlimitedSlotsMs, 'no slot cap')
  push('lanes', 'unlimited merge lanes', s.unlimitedLanesMs, 'merges in parallel, each still after its stack parents')
  if ([...simInput.values()].some(x => x.deps.some(d => d.late))) push('early', 'every early unblock taken', simulate(withBeads(v => ({ ...v, deps: v.deps.map(d => ({ ...d, late: !earlyUnblock })) })), base), 'no stack conflicts: dependents stack on implemented blockers instead of waiting for their merge')
  if (lane.seamMs > 0) push('seam', 'seam work off the merge lane', simulate(withBeads(v => ({ ...v, R: v.R + v.seam, M: v.M - v.seam })), base), 'rebase and seam review/fix before queueing; the lane only merges (an engine change)')
  const edges = []
  for (const x of simInput.values()) for (const d of x.deps) edges.push({ target: `${x.id} <- ${d.id}`, ms: simulate(withBeads(v => (v.id === x.id ? { ...v, deps: v.deps.filter(y => y.id !== d.id) } : v)), base) })
  for (const e of edges.sort((a, b) => a.ms - b.ms).slice(0, 3)) push('cut', `cut ${e.target}`, e.ms, 'payoff if this edge were cut — whether it can be is a design call')
  const splits = []
  for (const x of simInput.values()) {
    const n = [...simInput.values()].filter(y => y.deps.some(d => d.id === x.id)).length
    if (!n || x.I < 120000) continue
    const head = { id: `${x.id}#contract`, I: 0.3 * x.I, R: 0.5 * x.R, M: Math.max(0, x.M - x.seam), seam: 0, release: x.release, deps: x.deps }
    const trial = withBeads(v => (v.id === x.id ? { ...v, I: 0.7 * v.I, deps: [...v.deps, { id: head.id, late: false }] }
      : { ...v, deps: v.deps.map(d => (d.id === x.id ? { ...d, id: head.id } : d)) }))
    trial.set(head.id, head)
    splits.push({ id: x.id, n, ms: simulate(trial, base) })
  }
  for (const x of splits.sort((a, b) => a.ms - b.ms).slice(0, 2)) push('split', `split ${x.id}`, x.ms, `its ${x.n} dependent(s) wait only for a contract slice ≈30% of its implement time`)
  const faster = [...simInput.values()].map(x => ({ id: x.id, ms: simulate(withBeads(v => (v.id === x.id ? { ...v, I: v.I / 2 } : v)), base) }))
  for (const x of faster.sort((a, b) => a.ms - b.ms).slice(0, 2)) push('faster', `faster ${x.id}`, x.ms, 'its implement time halved')
  s.whatIfs.sort((a, b) => b.savingMs - a.savingMs)
  sim = s
}

// ---- report ----
const lines = []
let testTotals = null, slowTests = []
const afterMs = Math.max(0, runEnd - graphEnd)
const catText = (obj, order = CAT_ORDER) => [...order, ...Object.keys(obj).filter(k => !order.includes(k)).sort()].filter(k => obj[k] >= 1000).map(k => `${k} ${fmtDur(obj[k])}`).join(' · ')
lines.push(`Profile: ${epic ?? '(epic unknown)'} · ${invocations.length} invocation${invocations.length === 1 ? '' : 's'} · ${fmtTime(windowStart)} → ${fmtTime(runEnd)} · wall ${fmtDur(runEnd - windowStart)} (task graph ${fmtDur(actualGraphMs)}${afterMs ? `, after the last landing ${fmtDur(afterMs)}` : ''}) · agents ${realAgents.length} (timed ${realAgents.filter(a => a.start !== undefined).length}) · beads dispatched ${beads.size}, landed ${landed.length}, planned ${rows.size}`)
const fan = shape.fanOut[0]
lines.push(`Profile: shape — ${shape.beads} beads · ${shape.edges} edges · depth ${shape.depth} · width ${shape.width} · beads per level ${shape.levels.join('/') || '-'}${fan ? ` · widest fan-out ${fan.id} (${fan.direct} direct, ${fan.transitive} transitive dependents)` : ''}${cuts.length ? ` · ${cuts.length} edge cut(s) applied mid-run` : ''}`)
if (sim?.failed) lines.push(`Profile: bound — model failed: the planner rows hold a dependency cycle or an edge nothing satisfies${shape.cycles.length ? ` (${shape.cycles.slice(0, 3).join(', ')})` : ''}`)
else if (!sim) lines.push(`Profile: bound — no model: ${!rows.size ? (ordinary.length ? 'no dependency graph' : 'no planner rows, so the graph is unknown') : 'nothing landed'}`)
else {
  const above = sim.asRunMs - sim.lowerBoundMs
  const lanesGain = sim.asRunMs - sim.unlimitedLanesMs, slotsGain = sim.asRunMs - sim.unlimitedSlotsMs
  const ch = sim.graphChain
  sim.verdict = above <= Math.max(60000, 0.1 * sim.asRunMs) ? (ch.length <= 1 ? 'bead-bound' : 'graph-bound') : lanesGain >= slotsGain ? 'merge-lane-bound' : 'slot-bound'
  const verdict = above <= Math.max(60000, 0.1 * sim.asRunMs)
    ? (ch.length <= 1 ? `bead-bound: ${ch[0] ?? 'one bead'} alone set the pace — split it or make it faster` : `graph-bound: the ${ch.length}-bead dependency chain set the pace — reshaping it is the lever`)
    : lanesGain >= slotsGain ? `merge-lane-bound: ${fmtDur(lanesGain)} of the ${fmtDur(above)} above the graph's bound is the serial merge lane`
    : `slot-bound: ${fmtDur(slotsGain)} of the ${fmtDur(above)} above the graph's bound is the slot cap`
  const chainText = ch.length > 1 ? ` along ${ch.length > 8 ? [...ch.slice(0, 3), '…', ...ch.slice(-3)].join(' → ') : ch.join(' → ')}` : ''
  lines.push(`Profile: bound — graph lower bound ${fmtDur(sim.lowerBoundMs)}${chainText} (unlimited slots and merge lanes) · model of the run ${fmtDur(sim.asRunMs)} (cap ${Number.isFinite(cap) ? cap : '∞'}, one merge lane) vs actual ${fmtDur(actualGraphMs)} (${sim.fit ? `${Math.round(100 * sim.fit)}%` : '?'}) → ${verdict}`)
}
lines.push(`Profile: critical path — ${fmtDur(pathMs)} = ${catText(byCat)}${laneContentionMs ? ` · of which other beads' merge-lane turns ${fmtDur(laneContentionMs)}` : ''}`)
{
  // A bead's consecutive steps collapse into one entry; consecutive lane turns of different beads
  // into one `merge lane ×N` entry.
  const parts = []
  for (const s of segments) {
    if (!s.agent) continue
    const who = s.bead ?? s.agent.kind
    const last = parts.at(-1)
    const laneStep = LANE.has(s.kind)
    if (laneStep && last?.lane) { last.beads.add(who); last.ms += s.ms; if (s.kind === 'seam') last.seam += s.ms; continue }
    if (laneStep && last && !last.lane && last.who !== who && last.kinds.some(k => LANE.has(k))) {
      parts.push({ lane: true, beads: new Set([who]), ms: s.ms, seam: s.kind === 'seam' ? s.ms : 0 }); continue
    }
    if (last && !last.lane && last.who === who) { if (!last.kinds.includes(s.kind)) last.kinds.push(s.kind); last.ms += s.ms; continue }
    parts.push({ who, kinds: [s.kind], ms: s.ms })
  }
  const text = parts.map(p => p.lane ? `merge lane ×${p.beads.size} ${fmtDur(p.ms)}${p.seam ? ` (seam ${fmtDur(p.seam)})` : ''}` : `${p.who} ${p.kinds.join('+')} ${fmtDur(p.ms)}`)
  const shown = text.length > 14 ? [...text.slice(0, 6), `… ${text.length - 12} more …`, ...text.slice(-6)] : text
  lines.push(`Profile: critical chain — ${shown.join(' → ')}`)
}
const TOOL_ORDER = ['test', 'poll', 'build', 'install', 'git', 'bd', 'read', 'edit', 'shell', 'subagent', 'other']
if (bottleneck) {
  const [id, m] = bottleneck
  const b = beads.get(id)
  // What its implement steps on the path spent their time on (tool categories, then model time).
  const impl = m.agents.filter(a => a.stage === 'implement')
  const implMs = sum(impl.map(a => a.dur)), toolMs = sum(impl.map(a => a.toolMs ?? 0))
  const cats = {}
  for (const a of impl) for (const [k, v] of Object.entries(a.byCat ?? {})) cats[k] = (cats[k] ?? 0) + v
  const tools = impl.flatMap(a => a.calls ?? []).sort((x, y) => y.ms - x.ms).slice(0, 2)
  const implText = implMs >= 1000 ? ` · implement on the path ${fmtDur(implMs)}: ${[catText(cats, TOOL_ORDER), implMs - toolMs >= 1000 ? `model ${fmtDur(implMs - toolMs)}` : ''].filter(Boolean).join(' · ')}${tools.length ? ` (longest: ${tools.map(x => `${x.what ? `"${x.what}"` : x.name} ${fmtDur(x.ms)}`).join(', ')})` : ''}` : ''
  const f = shape.fanOut.find(x => x.id === id)
  lines.push(`Profile: bottleneck — ${id}${b.landed ? '' : ' (did not land)'} — ${fmtDur(m.total)} on the critical path (${pct(m.total, pathMs)}%) · ${catText(m.byCat)}${implText}${b.attempts.length > 1 ? ` · ${b.attempts.length} attempts (${b.attempts.map(x => x.status ?? '?').join(', ')})` : ''} · dependents ${f ? `${f.direct} direct, ${f.transitive} transitive` : dependentsOf.get(id)?.size ?? 0}`)
}
{
  const causes = {}
  for (const b of landed) if (b.waitCause !== 'none') { const c = causes[b.waitCause] ?? { ms: 0, n: 0 }; c.ms += b.waitMs; c.n++; causes[b.waitCause] = c }
  const order = ['stack-conflict', 'waited-for-merge', 'slot', 'hot-file', 'ready-query', 'planning', 'cancelled', 'retry', 'unexplained']
  const total = sum(Object.values(causes).map(c => c.ms))
  const carried = landed.filter(b => b.carriedMs > 0)
  lines.push(`Profile: waits — ready→start, summed per bead (beads wait at the same time, so not wall time): ${fmtDur(total)} over ${sum(Object.values(causes).map(c => c.n))} of ${landed.length} landed beads${total ? ' — ' + order.filter(k => causes[k]).map(k => `${k} ${fmtDur(causes[k].ms)} (${causes[k].n})`).join(' · ') : ''}${carried.length ? ` · ready before their invocation began, not counted: ${fmtDur(sum(carried.map(b => b.carriedMs)))} (${carried.length})` : ''}`)
  if (earlyUnblock) {
    const withDeps = landed.filter(b => b.deps.length)
    const stacked = withDeps.filter(b => b.stackParents.length).length
    const bounced = withDeps.filter(b => b.waitCause === 'stack-conflict').length
    const waited = withDeps.filter(b => b.waitCause === 'waited-for-merge').length
    lines.push(`Profile: early unblock — ${withDeps.length} landed beads had in-run blockers · stacked on an implementation ${stacked} · bounced on a stack conflict then waited for the merge ${bounced} (${fmtDur(sum(withDeps.filter(b => b.waitCause === 'stack-conflict').map(b => b.waitMs)))}) · waited for a merge without one ${waited}`)
  }
}
{
  // Time in attempts that did not land: earlier attempts of landed beads, and beads that never landed.
  const lost = [...beads.values()].map(b => {
    const atts = b.attempts.filter(x => (x !== b.final || !b.landed) && !b.reentryCloses.includes(x))
    return { id: b.id, ms: sum(atts.map(x => sum(x.agents.filter(a => a.stage !== 'ledger').map(a => a.dur)))), how: atts.map(x => x.status ?? '?').join(', '), landed: b.landed }
  }).filter(x => x.ms >= 1000).sort((x, y) => y.ms - x.ms)
  const closes = [...beads.values()].filter(b => b.reentryCloses.length)
  const closeText = closes.length ? ` · ${closes.length} merged bead(s) re-dispatched only to close (a lost bead close), ${fmtDur(sum(closes.map(b => b.reentryCloses[0].start - b.final.landing.end)))} after their merge` : ''
  if (lost.length || closes.length) lines.push(`Profile: rework — ${fmtDur(sum(lost.map(x => x.ms)))} of dispatch time in attempts that did not land${lost.length ? ' — ' + lost.slice(0, 3).map(x => `${x.id} ${fmtDur(x.ms)} (${x.how}${x.landed ? '; landed later' : '; never landed'})`).join(' · ') : ''}${lost.length > 3 ? ` · ${lost.length - 3} more` : ''}${closeText}`)
}
{
  // Test time across every implementer and fixer (summed: they run at the same time).
  const coders = timed.filter(a => a.kind === 'impl' || a.kind === 'commit-nudge' || a.kind === 'fix')
  const busy = sum(coders.map(a => a.dur))
  const test = sum(coders.map(a => a.byCat?.test ?? 0)), poll = sum(coders.map(a => a.byCat?.poll ?? 0))
  const capped = coders.flatMap(a => a.calls ?? []).filter(x => x.name === 'Bash' && x.ms >= 595000)
  if (busy >= 1000) lines.push(`Profile: tests — implementers and fixers, summed: ${fmtDur(test)} running tests and ${fmtDur(poll)} polling background runs, ${pct(test + poll, busy)}% of their ${fmtDur(busy)} · ${capped.length} Bash call(s) ran into the 10-minute tool limit`)
  testTotals = { busyMs: busy, testMs: test, pollMs: poll, cappedCalls: capped.length }
  // The test commands that cost the most, summed over every implementer and fixer run of them.
  const byCmd = new Map()
  for (const x of coders.flatMap(a => a.calls ?? []).filter(x => x.test)) {
    const e = byCmd.get(x.test) ?? { cmd: x.test, ms: 0, runs: 0, longestMs: 0 }
    e.ms += x.ms; e.runs++; e.longestMs = Math.max(e.longestMs, x.ms)
    byCmd.set(x.test, e)
  }
  slowTests = [...byCmd.values()].sort((a, b) => b.ms - a.ms).slice(0, 20)
  const shown = slowTests.filter(e => e.longestMs >= 60000).slice(0, 5)
  if (shown.length) lines.push(`Profile: slow tests — ${shown.map(slowTestText).join(' · ')}`)
}
{
  const parts = [['stack-conflict', 'stack-conflict re-cuts'], ['retry', 'retries'], ['cancelled', 'cancelled re-dispatches']].filter(([k]) => redo[k].ms >= 1000)
  if (parts.length) lines.push(`Profile: redo — on the critical path, up to ${parts.map(([k, name]) => `${name} ${fmtDur(redo[k].ms)} (${redo[k].beads.join(', ')})`).join(' · ')} — from a bead's first attempt to its final one; the what-ifs model the real saving`)
}
lines.push(`Profile: merge lane — busy ${fmtDur(lane.busyMs)} of ${fmtDur(lane.spanMs)} (${pct(lane.busyMs, lane.spanMs)}%) · seam reviews and fixes ${fmtDur(lane.seamMs)} (${pct(lane.seamMs, lane.busyMs)}% of busy) · ${lane.merges} merge dispatches, first try not merged for ${lane.firstTryKnown ? `${lane.firstTryFailed} of ${lane.firstTryKnown}` : 'unknown (no merge results)'} · queue wait ${fmtDur(lane.queueWaitMs)} total, peak ${lane.peakQueue} waiting · stack-parent wait ${fmtDur(lane.stackWaitMs)}`)
if (hotConflicts.length) lines.push(`Profile: conflicts — ${hotConflicts.slice(0, 4).map(c => `${c.file} (stack conflicts ${c.stackConflicts}, seam overlaps ${c.seamOverlaps}, declared by ${c.declaredBy})`).join(' · ')}`)
if (runLevel) lines.push(...runLevel.lines)
lines.push(`Profile: runtime — peak ${runtime.peak} agents at once${runtimeSlots ? ` of ${runtimeSlots} runtime slots · full ${pct(runtime.fullMs, runEnd - windowStart)}% of the run` : ''} · slot cap ${Number.isFinite(cap) ? cap : 'unknown'}`)
for (const w of sim?.whatIfs.slice(0, 6) ?? []) lines.push(`Profile: what-if — ${w.target} → ${fmtDur(w.ms)} (−${fmtDur(w.savingMs)}, ${pct(w.savingMs, sim.asRunMs)}%) — ${w.note}`)
if (sim && !sim.failed && !sim.whatIfs.length) lines.push(`Profile: what-if — none saves more than 1% of the modelled ${fmtDur(sim.asRunMs)}`)
const unmeasured = []
if (untimed.length) unmeasured.push(`${untimed.length} agent(s) without a transcript (cached on resume, or cleaned up)`)
const noJournal = invocations.filter(v => !v.journal && v.source === 'workflow')
if (noJournal.length) unmeasured.push(`${noJournal.length} invocation(s) without journal.jsonl: no planner graph or merge results there`)
if (ordinary.length && !ledger) unmeasured.push('no ledger (--ledger): outcomes not read, so every merge the coordinator ran counts as landed')
if (noLaneTiming) unmeasured.push(`${noLaneTiming} landed bead(s) with no merge in the coordinator's log: lane time 0`)
if (runLevel?.unmapped) unmeasured.push(`${runLevel.unmapped} dispatch(es) not named for a bead of ${epic}, in the run-level lines only (${RULE})`)
if (!rows.size) unmeasured.push(ordinary.length ? 'no dependency graph (bd gave none; pass --beads): dependency waits and what-ifs are missing' : 'no planner rows: the graph is unknown, so dependency waits and what-ifs are missing')
if (skippedDry.length) unmeasured.push(`${skippedDry.length} dryRun invocation(s) skipped`)
if (!launch) unmeasured.push(`no Launch: line: cap ${Number.isFinite(cap) ? cap : 'unknown'}, early unblock assumed on`)
if (shape.cycles.length) unmeasured.push(`dependency cycle(s) in the planner rows, skipped for the shape: ${shape.cycles.slice(0, 3).join(', ')}`)
if (sim?.fit && (sim.fit < 0.75 || sim.fit > 1.25)) unmeasured.push(`the schedule model is ${Math.round(100 * sim.fit)}% of actual, so the what-ifs are rough`)
const notLanded = [...beads.values()].filter(b => !b.landed)
if (notLanded.length) unmeasured.push(`${notLanded.length} dispatched bead(s) did not land (not in the model): ${notLanded.slice(0, 5).map(b => b.id).join(', ')}${notLanded.length > 5 ? ', …' : ''}`)
lines.push(`Profile: unmeasured — ${unmeasured.length ? unmeasured.join('; ') : 'none'}`)
console.log(lines.join('\n'))

if (opt.out) {
  const T = t => (t === null || t === undefined || !Number.isFinite(t)) ? null : new Date(t).toISOString()
  const off = t => (t === null || t === undefined) ? '' : `+${fmtDur(t - windowStart)}`
  const beadRows = [...beads.values()].sort((a, b) => a.dispatchedAt - b.dispatchedAt)
  const json = {
    version: 1, epic, cap: Number.isFinite(cap) ? cap : null, earlyUnblock, runtimeSlots,
    invocations: invocations.map(v => ({ runId: v.runId, dir: v.dir, source: v.source, start: T(v.start), end: T(v.end), agents: v.agents, timed: v.timed, journal: v.journal })),
    window: { start: T(windowStart), lastLanding: T(lastLanding?.end), end: T(runEnd), graphMs: actualGraphMs, wallMs: runEnd - windowStart },
    shape, cuts: cuts.map(c => ({ dependent: c.dependent, blocker: c.blocker, kind: c.kind, at: T(c.at) })),
    beads: beadRows.map(b => ({ id: b.id, n: b.n ?? null, deps: b.deps, dependents: [...(dependentsOf.get(b.id) ?? [])], attempts: b.attempts.map(x => x.status), landed: b.landed,
      readyAt: T(b.readyAt), dispatchedAt: T(b.dispatchedAt), landedAt: T(b.landedAt), waitMs: b.waitMs, waitCause: b.waitCause, carriedMs: b.carriedMs,
      implMs: b.implMs, implByTool: b.implByCat, implToolMs: b.implToolMs, reviewMs: b.reviewMs, fixMs: b.fixMs, stackWaitMs: b.stackWaitMs,
      queueWaitMs: b.queueWaitMs, laneMs: b.laneMs, seamMs: b.seamMs, blockerMs: b.blockerMs, reworkMs: b.reworkMs, criticalMs: b.criticalMs,
      stackParents: b.stackParents, lateEdges: [...b.lateEdges] })),
    criticalPath: { ms: pathMs, byCategory: byCat, laneContentionMs, redo, segments: segments.map(s => ({ kind: s.kind, bead: s.bead, label: s.label, via: s.why ?? null, start: T(s.start), ms: s.ms })) },
    bottleneck: bottleneck ? { bead: bottleneck[0], ms: bottleneck[1].total, share: pathMs ? bottleneck[1].total / pathMs : 0, byCategory: bottleneck[1].byCat,
      implByTool: beads.get(bottleneck[0]).implByCat, calls: beads.get(bottleneck[0]).final.impl.flatMap(a => a.calls ?? []).sort((x, y) => y.ms - x.ms).slice(0, 10) } : null,
    lane, runtime, concurrency: runLevel?.json ?? null, tests: testTotals, slowTests, conflicts: hotConflicts.slice(0, 20), simulation: sim, unmeasured, summary: lines,
  }
  writeFileSync(`${opt.out}.json`, JSON.stringify(json, null, 2) + '\n')
  const md = [`# Run profile — ${epic ?? 'unknown epic'}`, '', '```', ...lines, '```', '']
  md.push('## Per bead', '', 'Offsets are from the run\'s first dispatch. `wait` is from the moment every blocker was usable (its implementation under early unblock, else its merge) to the implementer starting, with its cause; `stack` is a stacked task waiting for its parents to merge; `queue` is the wait for the single merge lane; `lane` is its lane turn (merge plus seam work).', '')
  md.push('| bead | deps | dependents | attempts | wait (cause) | implement | of it: tools | review | fix | stack | queue | lane (seam) | landed | critical |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const b of beadRows) {
    const tools = catText(b.implByCat, TOOL_ORDER)
    md.push(`| ${b.id} | ${b.deps.length} | ${dependentsOf.get(b.id)?.size ?? 0} | ${b.attempts.map(x => x.status ?? '?').join(', ')} | ${b.waitCause === 'none' ? '-' : `${fmtDur(b.waitMs)} (${b.waitCause})`} | ${fmtDur(b.implMs)} | ${tools || '-'} | ${fmtDur(b.reviewMs)} | ${b.fixMs ? fmtDur(b.fixMs) : '-'} | ${b.stackWaitMs ? fmtDur(b.stackWaitMs) : '-'} | ${b.queueWaitMs ? fmtDur(b.queueWaitMs) : '-'} | ${b.laneMs ? `${fmtDur(b.laneMs)}${b.seamMs ? ` (${fmtDur(b.seamMs)})` : ''}` : '-'} | ${b.landed ? off(b.landedAt) : 'not landed'} | ${b.criticalMs ? fmtDur(b.criticalMs) : ''} |`)
  }
  md.push('', '## Critical path, step by step', '', '| at | step | kind | via | duration |', '|---|---|---|---|---|')
  for (const s of segments) md.push(`| ${off(s.start)} | ${s.label} | ${s.kind} | ${s.why ?? ''} | ${fmtDur(s.ms)} |`)
  if (json.bottleneck?.calls.length) {
    md.push('', `## Longest tool calls in the bottleneck's implement (${json.bottleneck.bead})`, '', '| tool | category | what | duration |', '|---|---|---|---|')
    for (const x of json.bottleneck.calls) md.push(`| ${x.name} | ${x.cat} | ${(x.what || '').replace(/\|/g, '\\|')} | ${fmtDur(x.ms)} |`)
  }
  if (hotConflicts.length) {
    md.push('', '## Conflict files', '', 'Files named in stack-conflict findings and in merges\' seam overlaps, with how many planned beads declared them.', '', '| file | stack conflicts | seam overlaps | declared by |', '|---|---|---|---|')
    for (const c of hotConflicts.slice(0, 15)) md.push(`| ${c.file} | ${c.stackConflicts} | ${c.seamOverlaps} | ${c.declaredBy} |`)
  }
  if (sim && !sim.failed) {
    md.push('', '## Schedule model', '', `Landed beads replayed with their measured implement, review+fix and lane times; planner timing kept as it ran; dependents start at a blocker's implementation except over edges where this run's dependent waited for the merge. Model of the run: ${fmtDur(sim.asRunMs)} against ${fmtDur(actualGraphMs)} measured. Estimates, not measurements.`, '')
    md.push('| scenario | makespan | saving |', '|---|---|---|', `| as run (cap ${Number.isFinite(cap) ? cap : '∞'}, one merge lane) | ${fmtDur(sim.asRunMs)} | - |`, `| unlimited slots | ${fmtDur(sim.unlimitedSlotsMs)} | ${fmtDur(sim.asRunMs - sim.unlimitedSlotsMs)} |`, `| unlimited merge lanes | ${fmtDur(sim.unlimitedLanesMs)} | ${fmtDur(sim.asRunMs - sim.unlimitedLanesMs)} |`, `| graph lower bound (both) | ${fmtDur(sim.lowerBoundMs)} | ${fmtDur(sim.asRunMs - sim.lowerBoundMs)} |`)
    for (const w of sim.whatIfs.filter(w => w.kind !== 'slots' && w.kind !== 'lanes')) md.push(`| ${w.target} | ${fmtDur(w.ms)} | ${fmtDur(w.savingMs)} |`)
  }
  const gantt = beadRows.filter(b => b.final.agents.some(a => a.dur > 0)).slice(0, 80)
  if (gantt.length) {
    const onPath = new Set(segments.map(s => s.agent).filter(Boolean))
    md.push('', '## Timeline', '', `${gantt.length < beadRows.length ? `First ${gantt.length} beads by dispatch; ` : ''}each bead's final attempt; critical-path steps are marked crit.`, '', '```mermaid', 'gantt', '  dateFormat x', '  axisFormat %H:%M')
    for (const b of gantt) {
      md.push(`  section ${b.id}`)
      for (const a of b.final.agents.filter(a => a.stage !== 'ledger' && a.dur > 0)) md.push(`  ${a.kind}${a.suffix ? ' ' + a.suffix : ''} :${onPath.has(a) ? 'crit, ' : ''}${Math.round(a.start)}, ${Math.round(a.end)}`)
    }
    md.push('```')
  }
  if (unmeasured.length) md.push('', '## Unmeasured', '', ...unmeasured.map(u => `- ${u}`))
  writeFileSync(`${opt.out}.md`, md.join('\n') + '\n')
}
