// run-profile-fixture.mjs — write a synthetic Workflow run directory (journal.jsonl, agent-<id>.jsonl
// transcripts, agent-<id>.meta.json) from a compact scenario, for test-run-profile.sh.
// Usage: node run-profile-fixture.mjs <scenario.json> <out dir>
// Scenario: { t0: ISO, idPrefix, launch?: <Launch args>, journal?: false, transcripts?: false,
//   agents: [{ label, phase?, start, end (seconds after t0), result?, failed?,
//              tools?: [{ name, command?, description?, start, end }] }] }
// The `ledger-append:launch` agent's prompt carries `Launch: args <launch>`, as the coordinator's does.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const [scenarioPath, out] = process.argv.slice(2)
const sc = JSON.parse(readFileSync(scenarioPath, 'utf8'))
mkdirSync(out, { recursive: true })
const t0 = Date.parse(sc.t0)
const at = s => new Date(t0 + Math.round(s * 1000)).toISOString()
const agents = sc.agents.map((a, i) => ({ ...a, id: `a${sc.idPrefix ?? 'f'}${String(i).padStart(4, '0')}` }))

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
  writeFileSync(join(out, `agent-${a.id}.jsonl`), rows.map(r => JSON.stringify(r)).join('\n') + '\n')
}
