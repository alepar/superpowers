// context-pass.mjs — peak context and compactions per agent, from parsed transcript rows. Imported by
// run-profile.mjs; pure functions only: no file I/O, no printing, nothing imported from run-profile.
// - context-pass owns per-harness reading, the Claude window table, compaction causes, the run summary
//   and every rendering of context data (`Profile: context` lines, the `## Context` Markdown table, the
//   `context` JSON value, the `Baseline: context` line). It does not find, read or label transcripts:
//   run-profile's context targets do. New context logic and new output formats go here.
// - A record (AgentContext) is built only by a harness reader. A null `peak` means unmeasured, never 0.
// Transcript formats are harness-internal and undocumented: a malformed row is skipped, never thrown on.

const K = 1000
const CLAUDE_BUFFER = 33000          // Claude Code's reserved buffer: compaction point = window − 33K
const CLAUDE_DEFAULT_WINDOW = 200000 // any Claude model the table does not name
const WINDOW_SIZES = [200000, 1000000]
const IDLE_MS = 50 * 60000           // a sub-cap auto compaction this long after the last request is idle
const CLAUDE_CAP = 0.95              // of the compaction point
const CODEX_CAP = 0.9                // of the window: Codex caps its auto-compact limit at 90%
const HIGH_PCT = 80                  // the summary's `peak≥80%` count
const AGENT_LINE_PCT = 50            // a per-agent line for every agent that compacted or peaked this high
const AGENT_LINE_CAP = 10
export const CAUSES = Object.freeze(['cap', 'early', 'idle', 'manual', 'unknown'])

const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const tsOf = r => Date.parse(r?.timestamp)
const kTok = n => `${Math.round(n / K)}K`
const textOf = c => typeof c === 'string' ? c : Array.isArray(c) ? c.map(x => (x && typeof x.text === 'string') ? x.text : '').join('\n') : ''
const nameOf = a => a.label ?? (a.file ? String(a.file).split('/').pop() : '?')
const pctOf = (peak, window) => (peak !== null && window ? Math.round(100 * peak / window) : null)
// AgentContext, the uniform per-agent record and the seam to everything downstream (also what --out
// JSON writes): { harness, role, label, file, model, requests, peak, peakAt, first, window,
// windowSource, peakPct, compactions: [{ at, trigger, pre, post, model, window, gapMs, cause }],
// unmeasured }. Tokens throughout. model/window are the peak row's; each compaction carries the model
// and window at its own row plus the raw facts its cause needs (gapMs); `cause` stays null until
// summarizeContext fills it. Built only by a reader below; run-profile hands in label, role and file.
// A new measured fact is a new field set by the readers.
const span = (rows, o = {}) => [Math.max(0, o.fromRow ?? 0), Math.min(rows.length, o.toRow ?? rows.length)]
function blank(harness, o, reason) {
  return { harness, role: o.role ?? 'agent', label: o.label ?? null, file: o.file ?? null, model: null, requests: 0, peak: null, peakAt: null,
    first: null, window: null, windowSource: null, peakPct: null, compactions: [], unmeasured: reason }
}

// ---- Claude Code ----
// Model ids → window, first match wins. Opus 4.7+, Opus 5, Sonnet 5, Fable and Haiku 5.5 have 1M; a
// `[1m]` suffix asks for 1M; everything else, Opus/Sonnet 4.6 and older included, has 200K.
const CLAUDE_WINDOWS = Object.freeze([
  [/\[1m\]$/i, 1000000],
  [/claude-opus-4-(?:[7-9]|\d{2})(?!\d)/, 1000000],
  [/claude-opus-5(?!\d)/, 1000000],
  [/claude-sonnet-5(?!\d)/, 1000000],
  [/claude-haiku-5-5(?!\d)/, 1000000],
  [/fable/i, 1000000],
])
export function claudeWindow(model, override) {
  const o = Number(override)
  if (override != null && o > 0) return { window: o, compactAt: o - CLAUDE_BUFFER, source: 'override' }
  const hit = CLAUDE_WINDOWS.find(([re]) => re.test(String(model ?? '')))
  const window = hit ? hit[1] : CLAUDE_DEFAULT_WINDOW
  return { window, compactAt: window - CLAUDE_BUFFER, source: 'table' }
}
const claudeUsage = r => {
  const u = r?.type === 'assistant' ? r.message?.usage : null
  if (!u || r.message.model === '<synthetic>') return null
  const parts = [u.input_tokens, u.cache_read_input_tokens, u.cache_creation_input_tokens].map(num)
  return parts.every(x => x === null) ? null : parts.reduce((s, x) => s + (x ?? 0), 0)
}
// opts: { fromRow, toRow, contextWindow, label, role, file }. Rows outside [fromRow, toRow) are not read.
export function claudeContext(rows, opts = {}) {
  if (!Array.isArray(rows)) return blank('claude', opts, 'transcript missing or unreadable')
  const [lo, hi] = span(rows, opts)
  const ids = new Set(), comps = []
  let peak = null, peakAt = null, peakModel = null, first = null, model = null, lastUsageT = null, waiting = null
  const see = (ctx, at, m) => { if (peak === null || ctx > peak) { peak = ctx; peakAt = at; peakModel = m } }
  for (let i = lo; i < hi; i++) {
    const r = rows[i]
    const ctx = claudeUsage(r)
    if (ctx !== null) {
      ids.add(r.message.id ?? `row${i}`)
      model = r.message.model ?? model
      if (first === null) first = ctx
      see(ctx, r.timestamp ?? null, model)
      if (Number.isFinite(tsOf(r))) lastUsageT = tsOf(r)
      if (waiting) { waiting.post = ctx; waiting = null }
    } else if (r?.type === 'system' && r.subtype === 'compact_boundary') {
      const m = r.compactMetadata ?? {}, t = tsOf(r)
      const c = { at: r.timestamp ?? null, trigger: m.trigger ?? null, pre: num(m.preTokens), post: num(m.postTokens), model,
        window: claudeWindow(model, opts.contextWindow).window, gapMs: lastUsageT !== null && Number.isFinite(t) ? t - lastUsageT : null, cause: null }
      if (c.pre !== null) see(c.pre, c.at, model)
      comps.push(c)
      waiting = c.post === null ? c : null
    }
  }
  if (peak === null) return { ...blank('claude', opts, 'no usage rows'), compactions: comps }
  let { window, source } = claudeWindow(peakModel, opts.contextWindow)
  if (source === 'table' && peak > window) {
    const up = WINDOW_SIZES.find(w => w >= peak && w > window)
    if (up) {
      window = up; source = 'inferred'
      for (const c of comps) c.window = Math.max(c.window, up)
    }
  }
  return { harness: 'claude', role: opts.role ?? 'agent', label: opts.label ?? null, file: opts.file ?? null, model: peakModel, requests: ids.size,
    peak, peakAt, first, window, windowSource: source, peakPct: pctOf(peak, window), compactions: comps, unmeasured: null }
}
function claudeCause(c) {
  if (c.trigger === 'manual') return 'manual'
  if (!c.window) return 'unknown'
  if (c.pre !== null && c.pre >= CLAUDE_CAP * (c.window - CLAUDE_BUFFER)) return 'cap'
  if (c.gapMs !== null && c.gapMs >= IDLE_MS) return 'idle'
  return 'early'
}
const SKILL_RE = /^(?:superpowers:)?(super-auto|super-code)$/
const COMMAND_RE = /<command-name>\s*\/?(?:superpowers:)?(super-auto|super-code)\s*<\/command-name>/
function claudeInvocation(r) {
  const c = r?.message?.content
  if (r?.type === 'user' && !r.isMeta) {
    if (Array.isArray(c) && c.some(x => x?.type === 'tool_result')) return null
    return COMMAND_RE.exec(textOf(c))?.[1] ?? null
  }
  if (r?.type === 'assistant' && Array.isArray(c)) {
    for (const x of c) if (x?.type === 'tool_use' && x.name === 'Skill') { const m = SKILL_RE.exec(String(x.input?.skill ?? '')); if (m) return m[1] }
  }
  return null
}

// ---- Codex ----
// opts: { fromRow, toRow, label, role, file }. A forked child's rows before its first session_meta's
// subagent_history_start_ordinal are its ancestors' replayed history (compactions included): skipped.
export function codexContext(rows, opts = {}) {
  if (!Array.isArray(rows)) return blank('codex', opts, 'transcript missing or unreadable')
  const meta = rows.find(r => r?.type === 'session_meta')
  const ord = Math.max(0, num(meta?.payload?.subagent_history_start_ordinal) ?? 0)
  const [from, hi] = span(rows, opts)
  const lo = Math.max(from, ord)
  const wins = []
  for (let i = lo; i < hi; i++) {
    const w = rows[i]?.type === 'event_msg' && rows[i].payload?.type === 'token_count' ? num(rows[i].payload.info?.model_context_window) : null
    if (w) wins.push([i, w])
  }
  const windowAt = i => (wins.findLast(([j]) => j <= i) ?? wins.find(([j]) => j > i))?.[1] ?? null
  const comps = []
  let peak = null, peakAt = null, peakI = -1, peakModel = null, first = null, model = null, requests = 0, waiting = null
  const see = (ctx, i) => {
    if (first === null) first = ctx
    if (peak === null || ctx > peak) { peak = ctx; peakAt = rows[i].timestamp ?? null; peakI = i; peakModel = model }
  }
  for (let i = lo; i < hi; i++) {
    const r = rows[i], p = r?.payload
    if (!p) continue
    if (r.type === 'turn_context') model = p.model ?? model
    else if (r.type === 'event_msg' && p.type === 'token_count') {
      const ctx = num(p.info?.last_token_usage?.input_tokens)
      if (!ctx) continue
      requests++
      see(ctx, i)
      if (waiting) { waiting.post = ctx; waiting = null }
    } else if (r.type === 'token_usage_record') {
      const ctx = num(p.usage?.input_tokens)
      if (ctx) see(ctx, i)
    } else if (r.type === 'compacted') {
      const pre = num(p.latest_token_usage_record?.usage?.input_tokens) || null
      if (pre !== null) see(pre, i)
      const c = { at: r.timestamp ?? null, trigger: null, pre, post: null, model, window: windowAt(i), gapMs: null, cause: null }
      comps.push(c)
      waiting = c
    }
  }
  if (peak === null) return { ...blank('codex', opts, 'no usage rows'), compactions: comps }
  const window = windowAt(peakI)
  return { harness: 'codex', role: opts.role ?? 'agent', label: opts.label ?? null, file: opts.file ?? null, model: peakModel, requests,
    peak, peakAt, first, window, windowSource: window ? 'transcript' : null, peakPct: pctOf(peak, window), compactions: comps, unmeasured: null }
}
function codexCause(c) {
  if (!c.window || c.pre === null) return 'unknown'
  return c.pre >= CODEX_CAP * c.window ? 'cap' : 'early'
}
const CODEX_INVOKE_RE = /(?<![\w-])\$(?:superpowers:)?(super-auto|super-code)(?![\w-])|<name>\s*(?:superpowers:)?(super-auto|super-code)\s*<\/name>/
function codexInvocation(r) {
  const p = r?.payload
  if (r?.type !== 'response_item' || p?.type !== 'message' || p.role !== 'user') return null
  const m = CODEX_INVOKE_RE.exec(textOf(p.content))
  return m ? (m[1] ?? m[2]) : null
}

// The coordinator's run rows [fromRow, toRow) for anchor time t0 (ms; not finite = the session's end):
// from the latest super-auto invocation at or before t0, else the latest super-code one, to the next
// super-auto invocation after it, else the session's end. None found: from row 0, with a reason.
function runRows(invocation, rows, t0) {
  const limit = Number.isFinite(t0) ? t0 : Infinity
  const hits = []
  let t = -Infinity
  ;(rows ?? []).forEach((r, i) => {
    if (Number.isFinite(tsOf(r))) t = tsOf(r)
    const kind = invocation(r)
    if (kind) hits.push({ i, kind, t })
  })
  const before = hits.filter(h => h.t <= limit)
  const start = before.findLast(h => h.kind === 'super-auto') ?? before.findLast(h => h.kind === 'super-code')
  const fromRow = start?.i ?? 0
  const next = hits.find(h => h.i > fromRow && h.kind === 'super-auto')
  return { fromRow, toRow: next?.i ?? (rows ?? []).length, reason: start ? null : 'coordinator rows counted from the session start (no invocation found)' }
}

// One entry per harness: everything that differs by harness. Callers look an entry up by
// record.harness / target.harness and never test the harness name themselves. A new harness is one
// new entry here.
export const HARNESSES = Object.freeze({
  claude: Object.freeze({ read: claudeContext, cause: claudeCause, invocation: claudeInvocation, runRows: (rows, t0) => runRows(claudeInvocation, rows, t0) }),
  codex: Object.freeze({ read: codexContext, cause: codexCause, invocation: codexInvocation, runRows: (rows, t0) => runRows(codexInvocation, rows, t0) }),
})

// ---- summary ----
// Classifies every compaction (its harness entry's cause rule) and builds the run summary. opts.reasons:
// caller-side context reasons (e.g. runRows' no-invocation reason), appended to the summary's reasons.
export function summarizeContext(agents, opts = {}) {
  const as = (agents ?? []).map(a => ({ ...a, compactions: a.compactions.map(c => ({ ...c, cause: HARNESSES[a.harness]?.cause(c) ?? 'unknown' })) }))
  const byCause = Object.fromEntries(CAUSES.map(k => [k, 0]))
  for (const a of as) for (const c of a.compactions) byCause[c.cause]++
  const measured = as.filter(a => a.peak !== null)
  const coords = as.filter(a => a.role === 'coordinator')
  const best = coords.filter(a => a.peak !== null).sort((x, y) => y.peak - x.peak)[0]
  const coordinator = !coords.length ? null : best
    ? { peak: best.peak, window: best.window, peakPct: best.peakPct, compactions: coords.reduce((s, a) => s + a.compactions.length, 0) }
    : { peak: null, window: null, peakPct: null, compactions: coords.reduce((s, a) => s + a.compactions.length, 0) }
  const top = measured.filter(a => a.peakPct !== null).sort((x, y) => y.peakPct - x.peakPct)[0]
  const reasons = []
  const un = as.filter(a => a.peak === null)
  if (un.length) reasons.push(`context unmeasured for ${un.length} agent(s): ${un.slice(0, 3).map(a => `${nameOf(a)} (${a.unmeasured})`).join(', ')}${un.length > 3 ? `, +${un.length - 3} more` : ''}`)
  const nw = measured.filter(a => a.window === null)
  if (nw.length) reasons.push(`no context window recorded for ${nw.slice(0, 3).map(nameOf).join(', ')}${nw.length > 3 ? `, +${nw.length - 3} more` : ''}`)
  const table = new Map(measured.filter(a => a.windowSource === 'table').map(a => [String(a.model ?? 'unknown model'), a.window]))
  if (table.size) reasons.push(`Claude context windows from the model table: ${[...table].sort().map(([m, w]) => `${m} ${kTok(w)}`).join(', ')}`)
  for (const r of opts.reasons ?? []) if (r && !reasons.includes(r)) reasons.push(r)
  return { agents: as, n: as.length, measured: measured.length, high: measured.filter(a => (a.peakPct ?? 0) >= HIGH_PCT).length,
    compacted: as.filter(a => a.compactions.length).length, compactions: CAUSES.reduce((s, k) => s + byCause[k], 0), byCause,
    coordinator, max: top ? { label: nameOf(top), peakPct: top.peakPct } : null, reasons }
}

// ---- renderers ----
const causeList = (counts, sep) => CAUSES.filter(k => counts[k]).map(k => `${k} ${counts[k]}`).join(sep)
const peakText = a => a.peak === null ? 'unmeasured' : a.window ? `${kTok(a.peak)}/${kTok(a.window)} (${a.peakPct}%)` : `${kTok(a.peak)} (window unknown)`
const order = (x, y) => y.compactions.length - x.compactions.length || (y.peakPct ?? -1) - (x.peakPct ?? -1) || nameOf(x).localeCompare(nameOf(y))
export function contextLines(s, opts = {}) {
  if (!s.measured) return [`Profile: context — unavailable — ${opts.why ?? (s.n ? 'no usage rows in any transcript' : 'no transcripts found')}`]
  const causes = causeList(s.byCause, ' · ')
  const parts = [`agents ${s.n} (measured ${s.measured})`, `peak≥80% ${s.high}`, `compacted ${s.compacted} agents, ${s.compactions} compactions${causes ? ` (${causes})` : ''}`]
  if (s.coordinator) parts.push(s.coordinator.peak === null ? 'coordinator unmeasured' : `coordinator ${peakText(s.coordinator)}, ${s.coordinator.compactions} compactions`)
  if (s.max) parts.push(`max ${s.max.label} ${s.max.peakPct}%`)
  const out = [`Profile: context — ${parts.join(' · ')}`]
  const shown = s.agents.filter(a => a.compactions.length || (a.peakPct ?? -1) >= AGENT_LINE_PCT).sort(order)
  for (const a of shown.slice(0, AGENT_LINE_CAP)) {
    const counts = {}
    for (const c of a.compactions) counts[c.cause] = (counts[c.cause] ?? 0) + 1
    const cs = causeList(counts, ', ')
    out.push(`Profile: context agent — ${nameOf(a)} peak ${peakText(a)} · first ${a.first === null ? 'unmeasured' : kTok(a.first)} · compactions ${a.compactions.length}${cs ? ` (${cs})` : ''}`)
  }
  if (shown.length > AGENT_LINE_CAP) out.push(`Profile: context agent — ${shown.length - AGENT_LINE_CAP} more in --out`)
  return out
}
const cell = v => String(v ?? '—').replace(/\|/g, '\\|')
export function contextMarkdown(s) {
  const lines = ['## Context', '', ...contextLines(s).map(l => `- ${l}`), '',
    '| agent | role | model | requests | first | peak | window | source | peak% | compactions |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |']
  const rows = [...s.agents].sort((x, y) => (y.role === 'coordinator') - (x.role === 'coordinator') || order(x, y))
  for (const a of rows) {
    if (a.peak === null) { lines.push(`| ${cell(nameOf(a))} | ${a.role} | ${cell(a.model)} | ${a.requests} | unmeasured: ${cell(a.unmeasured)} | — | — | — | — | ${a.compactions.length} |`); continue }
    const cs = a.compactions.map(c => `${c.cause} ${c.pre === null ? '?' : kTok(c.pre)}→${c.post === null ? '?' : kTok(c.post)}`).join(', ')
    lines.push(`| ${cell(nameOf(a))} | ${a.role} | ${cell(a.model)} | ${a.requests} | ${a.first === null ? '—' : kTok(a.first)} | ${kTok(a.peak)} | ${a.window ? kTok(a.window) : 'unknown'} | ${a.windowSource ?? '—'} | ${a.peakPct === null ? '—' : `${a.peakPct}%`} | ${a.compactions.length}${cs ? `: ${cs}` : ''} |`)
  }
  return lines.join('\n') + '\n'
}
export function contextJson(s) {
  const { agents, ...summary } = s
  return { agents, summary }
}
// One `Baseline: context` line over the `context` values of several --out profiles; null when none has one.
export function contextBaseline(contexts) {
  const cs = (contexts ?? []).filter(c => c?.summary)
  if (!cs.length) return null
  const t = k => cs.reduce((s, c) => s + (c.summary[k] ?? 0), 0)
  const by = Object.fromEntries(CAUSES.map(k => [k, cs.reduce((s, c) => s + (c.summary.byCause?.[k] ?? 0), 0)]))
  const causes = causeList(by, ' · ')
  return `Baseline: context — ${cs.length} profile(s) · agents ${t('n')} (measured ${t('measured')}) · peak≥80% ${t('high')} · compacted ${t('compacted')} agents, ${t('compactions')} compactions${causes ? ` (${causes})` : ''}`
}
