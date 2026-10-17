// run-profile-fixture.mjs — write a synthetic Workflow run directory (journal.jsonl, agent-<id>.jsonl
// transcripts, agent-<id>.meta.json) from a compact scenario, for test-run-profile.sh.
// Usage: node run-profile-fixture.mjs <scenario.json> <out dir>
// Scenario: { t0: ISO, idPrefix, launch?: <Launch args>, journal?: false, transcripts?: false,
//   agents: [{ label, phase?, start, end (seconds after t0), result?, failed?,
//              tools?: [{ name, command?, description?, start, end }] }] }
// Context rows (optional): agents[].context: [[s, ctx]…] assistant usage rows whose input side sums
//   to ctx; agents[].compact: [[s, trigger, pre, post]…] compact_boundary rows; agents[].model
//   (usage rows' model, default claude-opus-4-6). session: [[kind, s, …]…] writes the owning session
//   <out>/../../..jsonl (out is <session>/subagents/workflows/wf_<id>), rows in the order given:
//   ["prompt", s, text] · ["meta", s, text] (isMeta) · ["result", s, text] (a tool_result) ·
//   ["skill", s, name] (a Skill tool use) · ["usage", s, ctx] · ["compact", s, trigger, pre, post].
//   sideAgents: [{ id, label, start, end, context?, compact? }] ordinary subagents of that session.
// The `ledger-append:launch` agent's prompt carries `Launch: args <launch>`, as the coordinator's does.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

const [scenarioPath, out] = process.argv.slice(2)
const sc = JSON.parse(readFileSync(scenarioPath, 'utf8'))
mkdirSync(out, { recursive: true })
const t0 = Date.parse(sc.t0)
const at = s => new Date(t0 + Math.round(s * 1000)).toISOString()
if (sc.beads) writeFileSync(join(out, 'beads.json'), JSON.stringify(sc.beads.map(b => ({ ...b, ...(typeof b.created_at === 'number' ? { created_at: at(b.created_at) } : {}) }))))
const agents = sc.agents.map((a, i) => ({ ...a, id: `a${sc.idPrefix ?? 'f'}${String(i).padStart(4, '0')}` }))
const usageRow = (s, ctx, id, model = 'claude-opus-4-6', extra = {}) => ({ type: 'assistant', timestamp: at(s), ...extra,
  message: { id, model, role: 'assistant', content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 10, cache_read_input_tokens: ctx - 30, cache_creation_input_tokens: 20, output_tokens: 5 } } })
const boundaryRow = (s, trigger, pre, post, extra = {}) => ({ type: 'system', subtype: 'compact_boundary', timestamp: at(s), ...extra, compactMetadata: { trigger, preTokens: pre, postTokens: post } })
const byTime = rows => rows.sort((x, y) => Date.parse(x.timestamp) - Date.parse(y.timestamp))
const sessionRow = ([kind, s, x, y, z], k) => kind === 'prompt' ? { type: 'user', timestamp: at(s), message: { role: 'user', content: x } }
  : kind === 'meta' ? { type: 'user', isMeta: true, timestamp: at(s), message: { role: 'user', content: x } }
  : kind === 'result' ? { type: 'user', timestamp: at(s), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: `tr${k}`, content: x }] } }
  : kind === 'skill' ? { type: 'assistant', timestamp: at(s), message: { id: `sk${k}`, role: 'assistant', content: [{ type: 'tool_use', id: `sk${k}`, name: 'Skill', input: { skill: x } }] } }
  : kind === 'usage' ? usageRow(s, x, `s${k}`)
  : kind === 'compact' ? boundaryRow(s, x, y, z)
  : (() => { throw new Error(`unknown session row kind: ${kind}`) })()

if (sc.journal !== false) {
  const rows = [{ type: 'launched' }]
  for (const a of [...agents].sort((x, y) => x.start - y.start)) rows.push({ type: 'started', key: `v2:${a.id}`, agentId: a.id, label: a.label, phase: a.phase ?? 'Implement' })
  for (const a of [...agents].sort((x, y) => x.end - y.end)) rows.push(a.failed ? { type: 'failed', key: `v2:${a.id}`, agentId: a.id } : { type: 'result', key: `v2:${a.id}`, agentId: a.id, result: a.result ?? {} })
  writeFileSync(join(out, 'journal.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + '\n')
}
for (const a of agents) {
  writeFileSync(join(out, `agent-${a.id}.meta.json`), JSON.stringify({ agentType: 'workflow-subagent', description: a.label, workflowPhase: a.phase ?? 'Implement', model: 'sonnet' }))
  if (sc.transcripts === false) continue
  const row = (t, type, content) => ({ type, timestamp: at(t), agentId: a.id, isSidechain: true, message: { role: type, content } })
  const rows = [row(a.start, 'user', '[Workflow harness — user request] fixture run')]
  if (a.label === 'ledger-append:launch' && sc.launch) rows.push(row(a.start, 'user', `In /w, append to /w/progress.md:\n<ledger-line>Launch: args ${JSON.stringify(sc.launch)}</ledger-line>`))
  ;(a.tools ?? []).forEach((x, k) => {
    rows.push(row(x.start, 'assistant', [{ type: 'tool_use', id: `tu${k}`, name: x.name, input: x.name === 'Bash' ? { command: x.command, ...(x.description ? { description: x.description } : {}) } : { file_path: '/w/src/a.ts' } }]))
    rows.push(row(x.end, 'user', [{ type: 'tool_result', tool_use_id: `tu${k}`, content: 'ok' }]))
  })
  rows.push(row(a.end - 0.5, 'assistant', [{ type: 'tool_use', id: 'tuF', name: 'StructuredOutput', input: a.result ?? {} }]))
  rows.push(row(a.end, 'user', [{ type: 'tool_result', tool_use_id: 'tuF', content: 'ok' }]))
  if (a.context || a.compact) {
    const extra = { agentId: a.id, isSidechain: true }
    ;(a.context ?? []).forEach(([s, ctx], k) => rows.push(usageRow(s, ctx, `${a.id}-m${k}`, a.model, extra)))
    for (const [s, trigger, pre, post] of a.compact ?? []) rows.push(boundaryRow(s, trigger, pre, post, extra))
    byTime(rows)
  }
  writeFileSync(join(out, `agent-${a.id}.jsonl`), rows.map(r => JSON.stringify(r)).join('\n') + '\n')
}
if (sc.session || sc.sideAgents) {
  const subDir = dirname(dirname(out))
  if (sc.session) writeFileSync(`${dirname(subDir)}.jsonl`, sc.session.map((r, k) => JSON.stringify(sessionRow(r, k))).join('\n') + '\n')
  for (const g of sc.sideAgents ?? []) {
    const extra = { agentId: g.id, isSidechain: true }
    writeFileSync(join(subDir, `agent-${g.id}.meta.json`), JSON.stringify({ agentType: 'general-purpose', description: g.label }))
    const rows = [{ type: 'user', timestamp: at(g.start), ...extra, message: { role: 'user', content: 'task brief' } },
      ...(g.context ?? []).map(([s, ctx], k) => usageRow(s, ctx, `${g.id}-m${k}`, g.model, extra)),
      ...(g.compact ?? []).map(([s, trigger, pre, post]) => boundaryRow(s, trigger, pre, post, extra)),
      { type: 'assistant', timestamp: at(g.end), ...extra, message: { role: 'assistant', content: [{ type: 'text', text: 'done' }] } }]
    writeFileSync(join(subDir, `agent-${g.id}.jsonl`), byTime(rows).map(r => JSON.stringify(r)).join('\n') + '\n')
  }
}
