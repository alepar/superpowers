// Unit tests for skills/super-code/scripts/context-pass.mjs over synthetic transcript rows. Prints one
// `ok <name>` or `not ok <name>` (then expected/got) line per check; test-run-profile.sh tallies them.
// Usage: node tests/super-code/context-pass-unit.mjs
import { claudeContext, codexContext, claudeWindow, summarizeContext, contextLines, contextMarkdown, contextJson, contextBaseline, HARNESSES } from '../../skills/super-code/scripts/context-pass.mjs'

const T0 = Date.parse('2026-10-01T00:00:00Z')
const at = s => new Date(T0 + s * 1000).toISOString()
const check = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  console.log(g === w ? `ok ${name}` : `not ok ${name}\n    expected: ${w}\n    got:      ${g}`)
}
// Claude rows. ctx is split over the three input fields so the sum is what is tested.
const asst = (s, ctx, { id = `m${s}`, model = 'claude-opus-4-6', content = [{ type: 'text', text: 'x' }] } = {}) =>
  ({ type: 'assistant', timestamp: at(s), message: { id, model, role: 'assistant', content, usage: { input_tokens: 10, cache_read_input_tokens: ctx - 30, cache_creation_input_tokens: 20, output_tokens: 5 } } })
const boundary = (s, trigger, pre, post) => ({ type: 'system', subtype: 'compact_boundary', timestamp: at(s), compactMetadata: { trigger, preTokens: pre, ...(post === undefined ? {} : { postTokens: post }) } })
const user = (s, content, extra = {}) => ({ type: 'user', timestamp: at(s), ...extra, message: { role: 'user', content } })
const sysRow = s => ({ type: 'system', subtype: 'turn_duration', timestamp: at(s) })
// Codex rows.
const meta = (s, extra = {}) => ({ timestamp: at(s), type: 'session_meta', payload: { id: 'thread', ...extra } })
const turn = (s, model) => ({ timestamp: at(s), type: 'turn_context', payload: { model } })
const tc = (s, input, window) => ({ timestamp: at(s), type: 'event_msg', payload: { type: 'token_count', info: { last_token_usage: { input_tokens: input }, total_token_usage: { input_tokens: 9e9 }, ...(window ? { model_context_window: window } : {}) } } })
const tur = (s, input) => ({ timestamp: at(s), type: 'token_usage_record', payload: { usage: { input_tokens: input } } })
const compacted = (s, pre) => ({ timestamp: at(s), type: 'compacted', payload: { message: '', latest_token_usage_record: pre === null ? null : { usage: { input_tokens: pre } } } })
const cxUser = (s, text) => ({ timestamp: at(s), type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } })
const causes = rec => summarizeContext([rec]).agents[0].compactions.map(c => c.cause)

// ---- Claude reader ----
{
  const r = claudeContext([user(0, 'go'), asst(1, 5000, { id: 'a' }), asst(2, 5000, { id: 'a' }), asst(3, 9000, { id: 'b' }), asst(4, 9000, { id: 'b' })])
  check('claude: duplicate rows for one response count one request', [r.requests, r.first, r.peak], [2, 5000, 9000])
}
{
  const r = claudeContext([asst(1, 4000), asst(2, 999999, { model: '<synthetic>' }), asst(3, 6000)])
  check('claude: a <synthetic> row is not a request', [r.requests, r.peak, r.model], [2, 6000, 'claude-opus-4-6'])
}
{
  // 200K window → compaction point 167K; 95% of it is 158,650.
  const rows = [asst(0, 100000), boundary(60, 'auto', 160000, 20000), asst(120, 30000),
    asst(200, 40000), boundary(200 + 3000, 'auto', 60000), asst(3300, 25000),
    boundary(3400, 'manual', 70000, 10000), asst(3500, 15000),
    boundary(3600, 'auto', 90000, 12000)]
  const r = claudeContext(rows)
  check('claude: cap, idle (50-minute gap), manual and sub-cap non-idle boundaries', causes(r), ['cap', 'idle', 'manual', 'early'])
  check('claude: peak takes preTokens; post falls back to the next usage row', [r.peak, r.compactions.map(c => c.post)], [160000, [20000, 25000, 10000, 12000]])
  check('claude: the gap is measured from the last assistant usage row', r.compactions.map(c => c.gapMs), [60000, 3000000, 100000, 100000])
}
{
  // Housekeeping rows written while idle do not reset the gap.
  const r = claudeContext([asst(0, 50000), sysRow(1500), user(2900, 'tick', { isMeta: true }), sysRow(2990), boundary(3000, 'auto', 60000, 9000)])
  check('claude: idle boundary preceded by system/housekeeping rows', [causes(r), r.compactions[0].gapMs], [['idle'], 3000000])
}
{
  check('claude window: Opus 4.6 is 200K', claudeWindow('claude-opus-4-6'), { window: 200000, compactAt: 167000, source: 'table' })
  check('claude window: Opus 4.7 is 1M', claudeWindow('claude-opus-4-7').window, 1000000)
  check('claude window: dated Opus 4 id is 200K', claudeWindow('claude-opus-4-20250514').window, 200000)
  check('claude window: Opus 5.5, Sonnet 5, Haiku 5.5, Fable are 1M', ['claude-opus-5-5', 'claude-sonnet-5', 'claude-haiku-5-5', 'claude-fable-1'].map(m => claudeWindow(m).window), [1e6, 1e6, 1e6, 1e6])
  check('claude window: Haiku 4.5 is 200K', claudeWindow('claude-haiku-4-5-20251001').window, 200000)
  check('claude window: [1m] suffix is 1M', claudeWindow('claude-sonnet-4-6[1m]').window, 1000000)
  check('claude window: unknown model takes the 200K default', claudeWindow(undefined), { window: 200000, compactAt: 167000, source: 'table' })
  check('claude window: --context-window override', claudeWindow('claude-opus-5-5', 400000), { window: 400000, compactAt: 367000, source: 'override' })
  const o = claudeContext([asst(0, 300000, { model: 'claude-opus-5-5' }), boundary(10, 'auto', 360000, 1000)], { contextWindow: 400000 })
  check('claude: override reaches the record and its compactions', [o.window, o.windowSource, o.peakPct, o.compactions[0].window, causes(o)], [400000, 'override', 90, 400000, ['cap']])
  const inf = claudeContext([asst(0, 150000), boundary(30, 'auto', 250000, 20000), asst(40, 260000)])
  check('claude: a peak over the table window is inferred against the next window', [inf.window, inf.windowSource, inf.peakPct, inf.compactions[0].window, causes(inf)], [1000000, 'inferred', 26, 1000000, ['early']])
}
{
  const r = claudeContext([user(0, 'hi'), sysRow(1)])
  check('claude: a readable transcript with no usage rows is unmeasured', [r.peak, r.unmeasured, r.requests], [null, 'no usage rows', 0])
  check('claude: an unreadable transcript is unmeasured', claudeContext(null, { label: 'x' }).unmeasured, 'transcript missing or unreadable')
  const w = claudeContext([asst(0, 1000), user(5, 'go'), asst(10, 7000), asst(20, 8000)], { fromRow: 1, toRow: 3 })
  check('claude: only rows in [fromRow, toRow) are read', [w.first, w.peak, w.requests], [7000, 7000, 1])
}

// ---- Codex reader ----
{
  const r = codexContext([meta(0), turn(1, 'gpt-6-sol'), tc(2, 100000, 258400), tur(2, 100000), tc(3, 0, 258400), tur(4, 244000), compacted(5, 253000), tc(6, 0, 258400), tc(7, 30000, 258400)])
  check('codex: the compaction request exceeds every token_count', [r.peak, r.requests, r.window, r.windowSource, r.model, r.first], [253000, 2, 258400, 'transcript', 'gpt-6-sol', 100000])
  check('codex: pre from the compacted row, post from the next nonzero token_count', [r.compactions[0].pre, r.compactions[0].post, causes(r)], [253000, 30000, ['cap']])
}
{
  // Window 100K, then 400K. 95K under the 100K window is cap even though the record's window is 400K.
  const r = codexContext([meta(0), tc(1, 60000, 100000), compacted(2, 95000), tc(3, 20000, 400000), tc(4, 200000, 400000), compacted(5, 210000), tc(6, 10000, 400000)])
  check('codex: a mid-session window change: record window is the peak row\'s', [r.peak, r.window, r.peakPct], [210000, 400000, 53])
  check('codex: an earlier compaction is classified against its own window', [r.compactions.map(c => c.window), causes(r)], [[100000, 400000], ['cap', 'early']])
  const firstAfter = codexContext([meta(0), compacted(1, 50000), tc(2, 10000, 200000)])
  check('codex: before any window row, the first window after applies', firstAfter.compactions[0].window, 200000)
}
{
  // A forked child: rows 1–4 replay the parent (its session_meta and a compacted row); its own rows start at 5.
  const rows = [meta(0, { subagent_history_start_ordinal: 5 }), meta(0, { id: 'parent' }), tc(0, 180000, 258400), compacted(0, 240000), tc(0, 30000, 258400),
    turn(1, 'gpt-6-sol'), tc(2, 35000, 258400), tc(3, 50000, 258400)]
  const r = codexContext(rows)
  check('codex: a forked child does not count replayed rows or their compaction', [r.peak, r.first, r.requests, r.compactions.length], [50000, 35000, 2, 0])
  const r2 = codexContext([meta(0, { subagent_history_start_ordinal: 3 }), meta(0, { id: 'parent', subagent_history_start_ordinal: 1 }), compacted(0, 240000), tc(1, 40000, 258400)])
  check('codex: only the first session_meta supplies the ordinal (replayed one differs)', [r2.compactions.length, r2.peak], [0, 40000])
  const r3 = codexContext([meta(0, { subagent_history_start_ordinal: 3 }), meta(0, { id: 'parent' }), compacted(0, 240000), tc(1, 40000, 258400)])
  check('codex: only the first session_meta supplies the ordinal (replayed one has none)', [r3.compactions.length, r3.peak], [0, 40000])
  check('codex: fromRow below the ordinal still starts at the ordinal', codexContext(rows, { fromRow: 2 }).peak, 50000)
}
{
  const r = codexContext([meta(0), tc(1, 120000), compacted(2, 150000), tc(3, 20000)])
  const s = summarizeContext([{ ...r, label: 'impl:x' }])
  check('codex: no window recorded: measured, pct null, cause unknown', [r.peak, r.window, r.peakPct, s.agents[0].compactions[0].cause, s.measured], [150000, null, null, 'unknown', 1])
  check('codex: no window: reason on the unmeasured line only', [r.unmeasured, s.reasons], [null, ['no context window recorded for impl:x']])
  check('codex: no window renders as window unknown', contextLines(s)[1], 'Profile: context agent — impl:x peak 150K (window unknown) · first 120K · compactions 1 (unknown 1)')
}

// ---- invocation matchers and the coordinator's run rows ----
{
  const C = HARNESSES.claude
  const forms = [user(0, '<command-name>/super-auto</command-name>'), user(0, [{ type: 'text', text: '<command-message>x</command-message>\n<command-name>/superpowers:super-code</command-name>' }]),
    asst(0, 1, { content: [{ type: 'tool_use', id: 't', name: 'Skill', input: { skill: 'superpowers:super-auto' } }] }), asst(0, 1, { content: [{ type: 'tool_use', id: 't', name: 'Skill', input: { skill: 'super-code' } }] })]
  check('claude matcher: every marker form', forms.map(C.invocation), ['super-auto', 'super-code', 'super-auto', 'super-code'])
  const not = [user(0, [{ type: 'tool_result', tool_use_id: 't', content: '<command-name>/super-code</command-name>' }]), user(0, '<command-name>/super-code</command-name>', { isMeta: true }),
    user(0, 'please run /super-code'), asst(0, 1, { content: [{ type: 'tool_use', id: 't', name: 'Skill', input: { skill: 'super-design' } }] })]
  check('claude matcher: tool_result, isMeta, plain mention and other skills are not invocations', not.map(C.invocation), [null, null, null, null])
  const X = HARNESSES.codex
  check('codex matcher: $-mentions and the injected skill block', [cxUser(0, 'run $super-auto on this'), cxUser(0, '$superpowers:super-code epic'), cxUser(0, '<skill>\n<name>superpowers:super-auto</name>'), cxUser(0, 'no $super-autox here'), { ...cxUser(0, '$super-code'), payload: { ...cxUser(0, '$super-code').payload, role: 'assistant' } }].map(X.invocation), ['super-auto', 'super-code', 'super-auto', null, null])
  // rows: 0 old super-auto (s 0) · 2 super-code (s 100) · 3 super-auto (s 200) · 5 super-code in phase 3 (s 400) · 7 next super-auto (s 900)
  const rows = [user(0, '<command-name>/super-auto</command-name>'), asst(10, 1000), user(100, '<command-name>/super-code</command-name>'), user(200, '<command-name>/super-auto</command-name>'),
    asst(300, 2000), asst(400, 3000, { content: [{ type: 'tool_use', id: 't', name: 'Skill', input: { skill: 'superpowers:super-code' } }] }), asst(500, 4000), user(900, '<command-name>/super-auto</command-name>'), asst(950, 5000)]
  check('run rows: latest super-auto at or before T0; phase-3 super-code does not move it; ends at the next super-auto', C.runRows(rows, Date.parse(at(450))), { fromRow: 3, toRow: 7, reason: null })
  check('run rows: T0 before the second super-auto starts at the first', C.runRows(rows, Date.parse(at(150))), { fromRow: 0, toRow: 3, reason: null })
  check('run rows: no T0 is the session end', C.runRows(rows, undefined), { fromRow: 7, toRow: 9, reason: null })
  const sc = [asst(0, 1), user(5, '<command-name>/super-code</command-name>'), asst(6, 1), user(9, '<command-name>/super-code</command-name>'), asst(10, 1)]
  check('run rows: no super-auto: the latest super-code at or before T0', C.runRows(sc, Date.parse(at(7))), { fromRow: 1, toRow: 5, reason: null })
  check('run rows: none found starts at row 0 with a reason', C.runRows([asst(0, 1), asst(5, 1)], Date.parse(at(9))), { fromRow: 0, toRow: 2, reason: 'coordinator rows counted from the session start (no invocation found)' })
  check('run rows: codex', X.runRows([meta(0), cxUser(1, '$super-auto go'), tc(2, 10, 1000), cxUser(3, '$super-auto again')], Date.parse(at(2))), { fromRow: 1, toRow: 3, reason: null })
}

// ---- summary and renderers ----
const rec = (label, peak, window, comps = [], extra = {}) => ({ harness: 'claude', role: 'agent', label, file: `/x/${label}.jsonl`, model: 'claude-opus-4-6', requests: 3, peak, peakAt: at(0), first: peak === null ? null : 10000,
  window: peak === null ? null : window, windowSource: peak === null ? null : 'table', peakPct: peak === null ? null : Math.round(100 * peak / window), compactions: comps, unmeasured: peak === null ? 'no usage rows' : null, ...extra })
const comp = (pre, trigger = 'auto', gapMs = 1000) => ({ at: at(0), trigger, pre, post: 20000, model: 'claude-opus-4-6', window: 200000, gapMs, cause: null })
{
  const agents = [rec('coord', 190000, 200000, [comp(165000), comp(60000, 'auto', 4e6)], { role: 'coordinator' }), rec('impl:a', 120000, 200000), rec('impl:b', 40000, 200000, [comp(90000, 'manual')]), rec('review:a', 20000, 200000)]
  const s = summarizeContext(agents)
  const lines = contextLines(s)
  check('summary line: zero-count causes left out', lines[0], 'Profile: context — agents 4 (measured 4) · peak≥80% 1 · compacted 2 agents, 3 compactions (cap 1 · idle 1 · manual 1) · coordinator 190K/200K (95%), 2 compactions · max coord 95%')
  check('agent lines: compacted or ≥50%, ordered by compactions then peak%', lines.slice(1), [
    'Profile: context agent — coord peak 190K/200K (95%) · first 10K · compactions 2 (cap 1, idle 1)',
    'Profile: context agent — impl:b peak 40K/200K (20%) · first 10K · compactions 1 (manual 1)',
    'Profile: context agent — impl:a peak 120K/200K (60%) · first 10K · compactions 0'])
  check('summary: reasons name the table windows once', s.reasons, ['Claude context windows from the model table: claude-opus-4-6 200K'])
  const many = Array.from({ length: 13 }, (_, i) => rec(`impl:${String(i).padStart(2, '0')}`, 100000 + i * 2000, 200000))
  const ml = contextLines(summarizeContext(many))
  check('agent lines: at most 10, then a more line', [ml.length, ml[1].slice(0, 42), ml.at(-1)], [12, 'Profile: context agent — impl:12 peak 124K', 'Profile: context agent — 3 more in --out'])
  check('summary line: no compactions prints no cause list', ml[0], 'Profile: context — agents 13 (measured 13) · peak≥80% 0 · compacted 0 agents, 0 compactions · max impl:12 62%')
}
{
  const s = summarizeContext([rec('coord', null, null, [], { role: 'coordinator' }), rec('impl:a', 100000, 200000)])
  check('summary: an unmeasured coordinator', contextLines(s)[0], 'Profile: context — agents 2 (measured 1) · peak≥80% 0 · compacted 0 agents, 0 compactions · coordinator unmeasured · max impl:a 50%')
  check('summary: unmeasured agents are a reason', s.reasons[0], 'context unmeasured for 1 agent(s): coord (no usage rows)')
  const s2 = summarizeContext([rec('impl:a', 100000, 200000)], { reasons: ['coordinator rows counted from the session start (no invocation found)'] })
  check('summary: no coordinator record leaves the segment out', contextLines(s2)[0], 'Profile: context — agents 1 (measured 1) · peak≥80% 0 · compacted 0 agents, 0 compactions · max impl:a 50%')
  check('summary: caller reasons are appended', s2.reasons.at(-1), 'coordinator rows counted from the session start (no invocation found)')
}
{
  const un = claudeContext([user(0, 'hi')], { label: 'scout', role: 'agent', file: '/x/agent-1.jsonl' })
  const s = summarizeContext([un, rec('impl:a', 30000, 200000)])
  const md = contextMarkdown(s)
  check('unmeasured transcript: counted as unmeasured on the summary line', contextLines(s)[0].includes('agents 2 (measured 1)'), true)
  check('unmeasured transcript: a Markdown row with its reason', md.includes('| scout | agent | — | 0 | unmeasured: no usage rows | — | — | — | — | 0 |'), true)
  check('unmeasured transcript: the JSON record keeps peak null and the reason', JSON.parse(JSON.stringify(contextJson(s))).agents[0].peak === null && contextJson(s).agents[0].unmeasured === 'no usage rows', true)
  check('nothing measured: an unavailable line', contextLines(summarizeContext([un])), ['Profile: context — unavailable — no usage rows in any transcript'])
}
{
  const a = codexContext([meta(0), tc(1, 100000, 258400), compacted(2, 240000), tc(3, 20000, 258400)], { role: 'coordinator', label: 'rollout 1' })
  const b = codexContext([meta(0), tc(1, 180000, 258400), compacted(2, 120000), tc(3, 10000, 258400), compacted(4, 130000), tc(5, 10000, 258400)], { role: 'coordinator', label: 'rollout 2' })
  const s = summarizeContext([a, b])
  check('two coordinator records: largest peak, summed compactions', s.coordinator, { peak: 240000, window: 258400, peakPct: 93, compactions: 3 })
}
{
  const s = summarizeContext([rec('coord', 190000, 200000, [comp(165000)], { role: 'coordinator' })])
  const j = contextJson(s)
  check('json: { agents, summary }', [Object.keys(j), j.summary.byCause.cap, j.agents[0].compactions[0].cause], [['agents', 'summary'], 1, 'cap'])
  const j2 = contextJson(summarizeContext([rec('coord2', 190000, 200000, [comp(165000)], { role: 'coordinator' })]))
  check('baseline: aggregates compactions by cause over profiles with a context key', contextBaseline([j, undefined, j2]), 'Baseline: context — 2 profile(s) · agents 2 (measured 2) · peak≥80% 2 · compacted 2 agents, 2 compactions (cap 2)')
  check('baseline: none with a context key', contextBaseline([undefined]), null)
}
{
  // Two super-code invocations of one super-auto run: both profiles carry the same coordinator file and
  // its one compaction; the second invocation's record covers more rows. Each implementer is its own.
  const coordA = rec('coord', 190000, 200000, [comp(165000)], { role: 'coordinator', requests: 5 })
  const coordB = rec('coord', 190000, 200000, [comp(165000)], { role: 'coordinator', requests: 7 })
  const pA = contextJson(summarizeContext([coordA, rec('impl:a', 120000, 200000)]))
  const pB = contextJson(summarizeContext([coordB, rec('impl:b', 170000, 200000, [comp(90000, 'manual')])]))
  check('baseline: a coordinator file and compaction shared by two profiles count once',
    contextBaseline([pA, pB]), 'Baseline: context — 2 profile(s) · agents 3 (measured 3) · peak≥80% 2 · compacted 2 agents, 2 compactions (cap 1 · manual 1)')
  const wide = rec('coord', 190000, 200000, [comp(165000), { ...comp(60000, 'auto', 4e6), at: at(100) }], { role: 'coordinator', requests: 9 })
  check('baseline: a compaction only the wider record saw still counts',
    contextBaseline([pA, contextJson(summarizeContext([wide]))]), 'Baseline: context — 2 profile(s) · agents 2 (measured 2) · peak≥80% 1 · compacted 1 agents, 2 compactions (cap 1 · idle 1)')
  const nofile = contextJson(summarizeContext([rec('scout', 30000, 200000, [], { file: null })]))
  check('baseline: records with no file are never merged', contextBaseline([nofile, nofile]), 'Baseline: context — 2 profile(s) · agents 2 (measured 2) · peak≥80% 0 · compacted 0 agents, 0 compactions')
}

// ---- spans: the whole transcript, counted only inside [fromRow, toRow) spans in original row indices ----
{
  // Rows 0–1 precede the span: the 1M model and the last request's time carry in. The span opens
  // with a compaction before its first usage row.
  const o5 = { model: 'claude-opus-5-5' }
  const r = claudeContext([asst(0, 100000, o5), asst(100, 170000, o5), boundary(160, 'auto', 180000, 20000), asst(170, 25000, o5), asst(200, 40000, o5)], { spans: [[2, 5]] })
  check('claude spans: a compaction before the first in-span usage row takes the model and gap from earlier rows',
    [r.model, r.window, r.peak, r.peakPct, r.requests, r.first, r.compactions.map(c => [c.model, c.window, c.gapMs]), causes(r)],
    ['claude-opus-5-5', 1000000, 180000, 18, 2, 25000, [['claude-opus-5-5', 1000000, 60000]], ['early']])
}
{
  // Spans [0, 4) and [7, 9); rows 4–6 are another run's. Row 3's compaction has no postTokens and ends
  // its span still waiting: its post stays null, not row 7's request.
  const r = claudeContext([user(0, 'go'), asst(10, 40000), asst(100, 60000), boundary(200, 'auto', 70000),
    user(1000, 'other'), asst(1100, 150000), asst(4000, 80000), asst(4100, 20000), asst(4200, 100000)], { spans: [[0, 4], [7, 9]] })
  check('claude spans: rows between two spans are not counted', [r.requests, r.peak, r.first], [4, 100000, 40000])
  check('claude spans: a post is never taken across a span end', r.compactions.map(c => [c.post, c.gapMs]), [[null, 100000]])
}
{
  // Spans [0, 3) and [5, 7): row 5's gap runs from row 4's request (outside both spans), not row 2's.
  const r = claudeContext([user(0, 'go'), asst(10, 40000), asst(100, 60000), user(1000, 'other'), asst(4000, 80000),
    boundary(4200, 'auto', 90000, 10000), asst(4300, 20000)], { spans: [[0, 3], [5, 7]] })
  check('claude spans: the idle gap is measured from the latest request before the boundary, in or out of a span', [r.compactions[0].gapMs, causes(r), r.requests, r.peak], [200000, ['early'], 3, 90000])
}
{
  // The span [3, 7) opens after the rollout's turn_context and its first window row: both carry in.
  const r = codexContext([meta(0), turn(1, 'gpt-6-sol'), tc(2, 60000, 100000), cxUser(3, '$super-auto go'), compacted(4, 95000), tc(5, 20000, 400000), tc(6, 30000, 400000)], { spans: [[3, 7]] })
  check('codex spans: model and window carry in from before the span',
    [r.model, r.peak, r.window, r.peakPct, r.requests, r.compactions.map(c => [c.model, c.window]), causes(r)],
    ['gpt-6-sol', 95000, 100000, 95, 2, [['gpt-6-sol', 100000]], ['cap']])
  const two = codexContext([meta(0), tc(1, 50000, 258400), compacted(2, 240000), tc(3, 200000, 258400), tc(4, 60000, 258400),
    tc(5, 30000, 258400), compacted(6, 100000), tc(7, 10000, 258400)], { spans: [[0, 3], [5, 8]] })
  check('codex spans: two spans; a post is never taken across a span end', [two.requests, two.peak, two.compactions.map(c => c.post)], [3, 240000, [null, 10000]])
}
