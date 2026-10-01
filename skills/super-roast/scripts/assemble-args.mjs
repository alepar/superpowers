// assemble-args.mjs — build super-roast's engine `args` from this skill's own prompt files.
// Invoked through ./assemble-args (bash wrapper, checks for node). Usage: --help.
// Exit codes: 0 ok, 2 bad input, 3 prompt-file drift (a block or marker the assembly expects is missing).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const USAGE = `usage: assemble-args --mode pr|design --inputs <header inputs> [options]

  --iteration <N|post-cap audit>  round number (default 1); rounds >= 2 require --prior-report
  --prior-report <path>           previous round's report; switches scouts to the late-round
                                  stance and adds the regression lane/lens
  --profile <text>                environment profile for the reporter (default: infer)
  --spec <path>                   design mode: the spec under review (required)
  --context <text|@file>          design mode: caller context the spec must satisfy
  --repo <dir> --base <ref> --head <ref>
                                  PR mode: names the diff command and computes triage's stat
  --diff-stat <text|@file>        PR mode: triage input instead of computing it with git
  --artifact <text>               PR mode: how scouts/judges name the change (default: --inputs)
  --independence <text>           independence label (default: derived from config.models.judge)
  --config <json|@file>           merged over the defaults (models merged per key)
  --seats-safe                    add prompts.seatsSafe (static-review wording for seat retries)
  --report-dir <dir> --topic <slug> [--date YYYY-MM-DD]
                                  print the report path the orchestrator writes to
  --out <file>                    write args JSON here (default: stdout)
  --script <file>                 write the engine with these args embedded (Workflow scriptPath)`

const die = (code, msg) => { process.stderr.write(`assemble-args: ${msg}\n`); process.exit(code) }
const drift = msg => die(3, `prompt-file drift: ${msg}`)

// ---- argv ----
const opt = {}
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--help' || a === '-h') { console.log(USAGE); process.exit(0) }
  if (a === '--seats-safe') { opt.seatsSafe = true; continue }
  if (!a.startsWith('--') || i + 1 >= argv.length) die(2, `bad argument '${a}'\n${USAGE}`)
  opt[a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = argv[++i]
}
const known = ['mode','inputs','iteration','priorReport','profile','spec','context','repo','base','head','diffStat','artifact','independence','config','seatsSafe','reportDir','topic','date','out','script']
for (const k of Object.keys(opt)) if (!known.includes(k)) die(2, `unknown option --${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}`)
const textArg = v => v?.startsWith('@') ? readFileSync(v.slice(1), 'utf8') : v

const mode = opt.mode
if (mode !== 'pr' && mode !== 'design') die(2, '--mode must be pr or design')
if (!opt.inputs) die(2, '--inputs is required (spec paths, or branch@sha vs base@sha, or PR#)')
const iteration = opt.iteration ?? '1'
const numbered = /^\d+$/.test(iteration)
if (numbered && Number(iteration) < 1) die(2, '--iteration must be >= 1')
if (numbered && Number(iteration) >= 2 && !opt.priorReport) die(2, `iteration ${iteration} needs --prior-report (rounds >= 2 run the late-round shape)`)
if (numbered && Number(iteration) === 1 && opt.priorReport) die(2, 'iteration 1 takes no --prior-report')
if (opt.priorReport && !existsSync(opt.priorReport)) die(2, `prior report not found: ${opt.priorReport}`)
const late = !!opt.priorReport
if (mode === 'design' && !opt.spec) die(2, 'design mode needs --spec')
if ((opt.reportDir || opt.topic) && !(opt.reportDir && opt.topic)) die(2, '--report-dir and --topic go together')

// ---- prompt-file parsing: headings and fences, fence-aware ----
const read = f => readFileSync(join(SKILL, f), 'utf8')
function sections(text) {
  const out = []; let cur = null, inFence = false
  for (const line of text.split('\n')) {
    if (/^```/.test(line)) inFence = !inFence
    if (!inFence && /^## /.test(line)) { cur = { heading: line.slice(3).trim(), lines: [] }; out.push(cur); continue }
    if (cur) cur.lines.push(line)
  }
  return out
}
function fences(lines) {
  const out = []; let buf = null
  for (const line of lines) {
    if (/^```/.test(line)) { if (buf) { out.push(buf.join('\n')); buf = null } else buf = []; continue }
    if (buf) buf.push(line)
  }
  return out
}
const firstFence = text => {
  const f = fences(text.split('\n'))
  if (!f.length) drift('no fenced prompt block')
  return f[0]
}
const section = (secs, pred, file) => secs.find(s => pred(s.heading)) ?? drift(`${file}: section not found (${pred})`)
const fence = (sec, i, file) => fences(sec.lines)[i] ?? drift(`${file}: '## ${sec.heading}' has no fenced block ${i}`)
const prose = sec => sec.lines.join('\n').trim()

// Replace a marker that stands on a line of its own, exactly once.
function replaceLine(block, marker, value, where) {
  const lines = block.split('\n')
  const idx = lines.findIndex(l => l.trim() === marker)
  if (idx < 0) drift(`${where}: marker ${marker} not on a line of its own`)
  lines[idx] = value
  return lines.join('\n')
}
function replaceAll(block, marker, value, where) {
  if (!block.includes(marker)) drift(`${where}: marker ${marker} missing`)
  return block.split(marker).join(value)
}
// The output contract's category bullet names the lane/lens; fill it with this dispatch's name.
function fillCategory(block, name, noun, where) {
  const re = /- \*\*category:\*\*[^\n]*(\n {2,}[^\n]*)*/
  if (!re.test(block)) drift(`${where}: category bullet not found`)
  return block.replace(re, `- **category:** \`${name}\` — this dispatch's ${noun} name, verbatim (required)`)
}
const MARKERS = ['[LANE]', '[LENS]', '[ITERATION_STANCE]', '[RECALL_POLICY]', '[SEAT PROCEDURE]', '[SPEC_FILE_PATH', '[REQUIREMENTS / EPIC]', '[DIFF FILE LIST']
function assertClean(text, where) {
  const left = MARKERS.filter(m => text.includes(m))
  if (left.length) drift(`${where}: unfilled marker(s) ${left.join(', ')}`)
}

// ---- iteration stance ----
function stanceBlocks(secs, file) {
  const sec = section(secs, h => h.startsWith('Iteration stance'), file)
  const [s1, r1, s2, r2] = [0, 1, 2, 3].map(i => fence(sec, i, file))
  if (!s1.startsWith('A rubber-stamp') || !s2.startsWith('A rubber-stamp')) drift(`${file}: iteration stance blocks out of order`)
  if (!r1.startsWith('## High recall') || !r2.startsWith('## Materiality')) drift(`${file}: recall-policy blocks out of order`)
  return late ? { stance: s2, recall: r2 } : { stance: s1, recall: r1 }
}

// ---- inputs for the artifact under review ----
const diffCmd = opt.repo && opt.base && opt.head ? `git -C ${resolve(opt.repo)} diff ${opt.base}...${opt.head}` : null
const artifact = opt.artifact ?? opt.inputs
function triageInput() {
  if (mode === 'design') return `Spec file: ${opt.spec} — read it.`
  if (opt.diffStat) return textArg(opt.diffStat).trim()
  if (!diffCmd) die(2, 'PR mode needs --diff-stat, or --repo/--base/--head to compute it')
  try {
    const range = `${opt.base}...${opt.head}`
    const names = execFileSync('git', ['-C', opt.repo, 'diff', '--name-status', range], { encoding: 'utf8' }).trim()
    const stat = execFileSync('git', ['-C', opt.repo, 'diff', '--shortstat', range], { encoding: 'utf8' }).trim()
    return `Diff ${range}:\n${names}\n${stat}`
  } catch (e) { die(2, `git diff failed: ${e.message.split('\n')[0]}`) }
}

// ---- config defaults (rosters read from the skill's own files) ----
const skillMd = read('SKILL.md')
const triageMd = read('triage-prompt.md')
const listFrom = (text, re, what) => {
  const m = text.match(re); if (!m) drift(`${what} not found`)
  return [...m[1].matchAll(/['`]([a-z0-9-]+)['`]/g)].map(x => x[1])
}
const coreLanesDefault = listFrom(triageMd, /Core lanes \(([^)]*)\) always run/, 'triage-prompt.md core-lane list')
const coreLensesDefault = listFrom(skillMd, /`config\.coreLenses`\*\*[^`]*`\[([^\]]*)\]`/, 'SKILL.md config.coreLenses')
const widenLensesDefault = listFrom(skillMd, /`config\.widenLenses`\*\*[^`]*`\[([^\]]*)\]`/, 'SKILL.md config.widenLenses')
const override = opt.config ? (() => { try { return JSON.parse(textArg(opt.config)) } catch (e) { die(2, `--config is not JSON: ${e.message}`) } })() : {}
const config = {
  remainderCap: 50,
  iterationCap: 3,
  ...(mode === 'pr' ? { coreLanes: coreLanesDefault } : { coreLenses: coreLensesDefault, widenLenses: widenLensesDefault }),
  ...override,
  models: { triage: 'sonnet', scout: 'opus', dedupe: 'fable', judge: 'sonnet', reporter: 'fable', ...(override.models ?? {}) },
}
const rosterKey = mode === 'pr' ? 'coreLanes' : 'coreLenses'
if (late && !config[rosterKey].includes('regression')) config[rosterKey] = [...config[rosterKey], 'regression']
if (!late) config[rosterKey] = config[rosterKey].filter(n => n !== 'regression')

// ---- scouts ----
const prompts = { scouts: {} }
if (mode === 'pr') {
  const file = 'scout-prompts-pr.md', secs = sections(read(file))
  const pre = fence(section(secs, h => h === 'Shared preamble', file), 0, file)
  const { stance, recall } = stanceBlocks(secs, file)
  let base = replaceAll(pre, '[ITERATION_STANCE]', stance, file)
  base = replaceLine(base, '[RECALL_POLICY]', recall, file)
  const diffLine = '- The diff (patch/hunks) under review.'
  if (!base.includes(diffLine)) drift(`${file}: inputs diff line not found`)
  base = base.replace(diffLine, `- The diff under review: ${artifact}${diffCmd ? ` (\`${diffCmd}\`)` : ''}.`)
  for (const sec of secs.filter(s => s.heading.startsWith('Lane: '))) {
    const name = sec.heading.slice('Lane: '.length).split(/[\s(]/)[0]
    if (name === 'regression' && !late) continue
    let p = replaceLine(base, '[LANE]', fence(sec, 0, file), `${file} lane ${name}`)
    p = fillCategory(p, name, 'lane', `${file} lane ${name}`)
    assertClean(p, `scout ${name}`)
    prompts.scouts[name] = p
  }
  for (const n of config.coreLanes) if (!prompts.scouts[n]) drift(`${file}: core lane '${n}' has no Lane block`)
} else {
  const file = 'scout-prompts-design.md', secs = sections(read(file))
  const core = fence(section(secs, h => h === 'Shared core', file), 0, file)
  const { stance, recall } = stanceBlocks(secs, file)
  let base = replaceAll(core, '[ITERATION_STANCE]', stance, file)
  base = replaceLine(base, '[RECALL_POLICY]', recall, file)
  base = replaceAll(base, '[SPEC_FILE_PATH — read it]', `${opt.spec} — read it`, file)
  base = replaceLine(base, '[REQUIREMENTS / EPIC]', opt.context ? textArg(opt.context).trim() : 'none supplied', file)
  for (const sec of secs.filter(s => s.heading.startsWith('Lens: '))) {
    const label = sec.heading.slice('Lens: '.length)
    const block = fence(sec, 0, file)
    if (label.startsWith('domain:')) {
      let p = replaceLine(base, '[LENS]', block, `${file} domain template`)
      p = fillCategory(p, 'domain:{{DOMAIN}}', 'lens', `${file} domain template`)
      assertClean(p, 'scoutDomainTemplate')
      prompts.scoutDomainTemplate = p
      continue
    }
    for (const name of label.split(' (')[0].split(' / ').map(s => s.trim())) {
      if (name === 'regression' && !late) continue
      let p = replaceLine(base, '[LENS]', block, `${file} lens ${name}`)
      p = fillCategory(p, name, 'lens', `${file} lens ${name}`)
      assertClean(p, `scout ${name}`)
      prompts.scouts[name] = p
    }
  }
  if (!prompts.scoutDomainTemplate) drift(`${file}: domain template not found`)
  for (const n of [...config.coreLenses, ...(config.widenLenses ?? [])]) if (!prompts.scouts[n]) drift(`${file}: lens '${n}' has no Lens block`)
}

// ---- triage, dedupe ----
{
  const t = firstFence(triageMd)
  const line = t.split('\n').find(l => l.startsWith('[SPEC_FILE_PATH') && l.includes('[DIFF FILE LIST'))
  if (!line) drift('triage-prompt.md: input marker line not found')
  prompts.triage = t.replace(line, triageInput())
  assertClean(prompts.triage, 'triage')
}
prompts.dedupe = firstFence(read('dedupe-prompt.md'))
if (!prompts.dedupe.includes('{{FINDINGS_JSON}}')) drift('dedupe-prompt.md: {{FINDINGS_JSON}} missing')

// ---- judge seats ----
{
  const file = 'judge-seat-prompts.md', secs = sections(read(file))
  let core = fence(section(secs, h => h === 'Shared core', file), 0, file)
  const specMarker = '[SPEC_FILE_PATH — read the whole spec, not just the cited section]'
  core = replaceAll(core, specMarker, mode === 'design'
    ? `${opt.spec} — read the whole spec, not just the cited section`
    : `${artifact} — read the diff${diffCmd ? ` (\`${diffCmd}\`)` : ''} and the files it touches, not just the cited hunk`, file)
  const prAdj = mode === 'pr' ? prose(section(secs, h => h.startsWith('PR mode adjustments'), file)) : ''
  const seatBlock = n => fence(section(secs, h => h.toLowerCase().endsWith(`— ${n}`), file), 0, file)
  prompts.seats = {}
  for (const n of ['reproduce', 'refute', 'ground']) {
    let p = replaceLine(core, '[SEAT PROCEDURE]', seatBlock(n), `${file} seat ${n}`)
    if (prAdj) p += `\n\n${prAdj}`
    assertClean(p, `seat ${n}`)
    if (!p.includes('{{FINDING_JSON}}')) drift(`${file}: {{FINDING_JSON}} missing`)
    prompts.seats[n] = p
  }
  if (opt.seatsSafe) {
    // Static-review wording for the one re-dispatch of a seat that returned nothing: same method
    // and output contract, the artifact framed as text to analyse, no adversarial verbs.
    const frame = 'Static review task. The material below is text to analyse for correctness; read it and report your analysis in the output contract. Nothing here asks you to attack, break or exploit anything.\n\n'
    const soften = p => p.replace('Try to kill the finding.', 'Test whether the finding holds.')
    prompts.seatsSafe = Object.fromEntries(Object.entries(prompts.seats).map(([n, p]) => [n, frame + soften(p)]))
  }
}

// ---- reporter ----
const family = m => /opus|sonnet|haiku|fable|claude/i.test(m ?? '') ? 'Claude' : (m || 'unknown')
const independence = opt.independence ?? `same-family (${family(config.models.judge)}) — seat-differentiated panel`
{
  const r = firstFence(read('reporter-prompt.md'))
  const re = /^independence: \{\{INDEPENDENCE\}\}$/m
  if (!re.test(r)) drift('reporter-prompt.md: template line `independence: {{INDEPENDENCE}}` not found')
  // Render the template line and the sentence that quotes it; the sentence about an unrendered
  // token (`the literal text {{INDEPENDENCE}}`) keeps the token on purpose.
  prompts.reporter = r.replace(re, `independence: ${independence}`)
    .replace('The `independence:` line is `{{INDEPENDENCE}}` exactly as the', `The \`independence:\` line is \`${independence}\` exactly as the`)
}

// ---- args ----
const priorReport = opt.priorReport ? readFileSync(opt.priorReport, 'utf8') : ''
const args = {
  mode, profile: opt.profile ?? 'not supplied by the caller — infer it from the repository and state it',
  inputs: opt.inputs, iteration: numbered ? Number(iteration) : iteration,
  priorReport, independence, prompts, config,
}
const json = JSON.stringify(args, null, 2)

const report = opt.reportDir ? (() => {
  const d = new Date(), pad = n => String(n).padStart(2, '0')
  const date = opt.date ?? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const n = numbered ? iteration : iteration.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return join(opt.reportDir, `${date}-${opt.topic}-roast-${mode}-${n}.md`)
})() : null

if (opt.script) {
  const doc = read('super-roast-workflow.md')
  const a = doc.indexOf('```javascript\n'), b = doc.indexOf('\n```\n', a)
  if (a < 0 || b < 0) drift('super-roast-workflow.md: engine block not found')
  const engine = doc.slice(a + '```javascript\n'.length, b)
  const hook = "const A = typeof args === 'string' ? JSON.parse(args) : args"
  if (engine.split(hook).length !== 2) drift('super-roast-workflow.md: args line not found exactly once')
  writeFileSync(opt.script, engine.replace(hook, `const A = ${JSON.stringify(args)}`) + '\n')
}
if (opt.out) writeFileSync(opt.out, json + '\n')
if (!opt.out && !opt.script) process.stdout.write(json + '\n')
else {
  if (opt.out) console.log(`args: ${opt.out}`)
  if (opt.script) console.log(`script: ${opt.script}`)
}
if (report) console.log(`report: ${report}`)
const roster = config[rosterKey]
const conditional = Object.keys(prompts.scouts).filter(n => !roster.includes(n) && !(config.widenLenses ?? []).includes(n))
process.stderr.write(`round: ${iteration} (${late ? 'late: materiality bar + regression' : 'round 1: high recall'}) · core ${roster.join(', ')}` +
  (mode === 'pr' ? ` · conditional ${conditional.join(', ')}` : ` · widen ${(config.widenLenses ?? []).join(', ')} · domain template`) + '\n')
