// run-profile-ordinary-fixture.mjs — write a synthetic ordinary-subagent coordinator run (coordinator-
// subagents.md) from a compact scenario, for test-run-profile.sh: a Codex coordinator rollout and its
// children's under <out>/codex/sessions, or a Claude Code session transcript and its subagents/
// directory under <out>/projects; plus <out>/progress.md and <out>/beads.json when the scenario has them.
// Usage: node run-profile-ordinary-fixture.mjs <scenario.json> <codex|claude> <out dir>
// Scenario: { t0: ISO, end, epic, cwd, ledger?: [line…], beads?: [bd list entries],
//   caller: [{ cmd, start, end }]                      the coordinator's own shell commands
//   agents: [{ codex: <task name>, label: <Agent description>, start, end, tasks?: [[s, e]…],
//              tools?: [{ kind: exec|apply_patch|write_stdin, cmd?, start, end }],
//              inherited?: true (a forked child: a replayed call at its spawn instant),
//              parent?: <codex name of another agent> (a grandchild), guardian?: true }] }
// Times are seconds after t0. On Claude Code each task is its own agent.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const [scenarioPath, harness, out] = process.argv.slice(2)
const sc = JSON.parse(readFileSync(scenarioPath, 'utf8'))
const t0 = Date.parse(sc.t0)
const at = s => new Date(t0 + Math.round(s * 1000)).toISOString()
const jsonl = (file, rows) => writeFileSync(file, rows.map(r => JSON.stringify(r)).join('\n') + '\n')
mkdirSync(out, { recursive: true })
if (sc.ledger) writeFileSync(join(out, 'progress.md'), sc.ledger.join('\n') + '\n')
if (sc.beads) writeFileSync(join(out, 'beads.json'), JSON.stringify(sc.beads))
const tasksOf = a => a.tasks ?? [[a.start, a.end]]

if (harness === 'codex') {
  const dir = join(out, 'codex', 'sessions', sc.t0.slice(0, 4), sc.t0.slice(5, 7), sc.t0.slice(8, 10))
  mkdirSync(dir, { recursive: true })
  const coord = sc.coordinator ?? '01c0ffee-0000-7000-8000-000000000000'
  const idOf = a => `01c0ffee-0000-7000-8000-${String(sc.agents.indexOf(a) + 1).padStart(12, '0')}`
  const file = id => join(dir, `rollout-${sc.t0.slice(0, 19).replace(/:/g, '-')}-${id}.jsonl`)
  const item = (t, payload) => ({ timestamp: at(t), type: 'response_item', payload })
  const event = (t, type) => ({ timestamp: at(t), type: 'event_msg', payload: { type } })
  let n = 0
  const call = (start, end, name, input) => {
    const id = `call_${n++}`
    return [item(start, { type: 'custom_tool_call', call_id: id, name, input }), item(end, { type: 'custom_tool_call_output', call_id: id, output: [{ type: 'input_text', text: 'Script completed' }] })]
  }
  const exec = x => x.kind === 'apply_patch' ? 'text(await tools.apply_patch("*** Begin Patch\\n*** End Patch"));'
    : x.kind === 'write_stdin' ? 'text(await tools.write_stdin({session_id:3,chars:""}));'
    : `text(await tools.exec_command({cmd:${JSON.stringify(x.cmd)},max_output_tokens:4000}));`
  const crows = [{ timestamp: at(-100), type: 'session_meta', payload: { id: coord, session_id: coord, cwd: sc.cwd, source: 'cli', cli_version: '0.160.1' } }, event(-100, 'task_started')]
  for (const c of sc.caller ?? []) crows.push(...call(c.start, c.end, 'exec', exec({ kind: 'exec', cmd: c.cmd })))
  for (const a of sc.agents) {
    const spawn = tasksOf(a)[0][0]
    const id = idOf(a)
    if (!a.parent && !a.guardian) {
      const k = `call_${n++}`
      crows.push(item(spawn, { type: 'function_call', call_id: k, name: 'spawn_agent', arguments: JSON.stringify({ task_name: a.codex, fork_turns: 'all', message: 'gAAAAAencrypted' }) }),
        item(spawn, { type: 'function_call_output', call_id: k, output: JSON.stringify({ task_name: `/root/${a.codex}` }) }))
    }
    const parent = a.parent ? idOf(sc.agents.find(x => x.codex === a.parent)) : coord
    const source = a.guardian ? { subagent: { other: 'guardian' } }
      : { subagent: { thread_spawn: { parent_thread_id: parent, depth: a.parent ? 2 : 1, agent_path: `/root/${a.parent ? `${a.parent}/` : ''}${a.codex}`, agent_nickname: 'Nick', agent_role: null } } }
    const rows = [{ timestamp: at(spawn), type: 'session_meta', payload: { id, ...(a.guardian ? { parent_thread_id: coord } : {}), cwd: sc.cwd, source, cli_version: '0.160.1' } }]
    if (a.inherited) rows.push({ timestamp: at(spawn), type: 'session_meta', payload: { id: coord, cwd: sc.cwd, source: 'cli' } }, ...call(spawn, spawn, 'exec', exec({ kind: 'exec', cmd: 'cargo test --workspace' })))
    for (const [s, e] of tasksOf(a)) {
      rows.push(event(s, 'task_started'))
      for (const x of (a.tools ?? []).filter(x => x.start >= s && x.start < e)) rows.push(...call(x.start, x.end, 'exec', exec(x)))
      rows.push(event(e, 'task_complete'))
    }
    jsonl(file(id), rows.sort((x, y) => Date.parse(x.timestamp) - Date.parse(y.timestamp)))
  }
  crows.push(event(sc.end, 'task_complete'))
  jsonl(file(coord), crows.sort((x, y) => Date.parse(x.timestamp) - Date.parse(y.timestamp)))
  console.log(coord)
} else if (harness === 'claude') {
  const sid = sc.session ?? 'c0ffee00-0000-4000-8000-000000000000'
  const pd = join(out, 'projects', '-w-proj')
  const sub = join(pd, sid, 'subagents')
  mkdirSync(sub, { recursive: true })
  let n = 0
  const pair = (start, end, name, input, extra = {}) => {
    const id = `toolu_${n++}`
    return [{ type: 'assistant', timestamp: at(start), cwd: sc.cwd, ...extra, message: { role: 'assistant', content: [{ type: 'tool_use', id, name, input }] } },
      { type: 'user', timestamp: at(end), cwd: sc.cwd, ...extra, message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: 'ok' }] } }]
  }
  const rows = [{ type: 'user', timestamp: at(-100), cwd: sc.cwd, message: { role: 'user', content: `Run super-code on epic ${sc.epic}` } }]
  for (const c of sc.caller ?? []) rows.push(...pair(c.start, c.end, 'Bash', { command: c.cmd }))
  jsonl(join(pd, `${sid}.jsonl`), rows.sort((x, y) => Date.parse(x.timestamp) - Date.parse(y.timestamp)))
  let k = 0
  for (const a of sc.agents.filter(a => !a.parent && !a.guardian)) {
    for (const [s, e] of tasksOf(a)) {
      const id = `a${String(k++).padStart(16, '0')}`
      writeFileSync(join(sub, `agent-${id}.meta.json`), JSON.stringify({ agentType: 'general-purpose', description: a.label, toolUseId: `toolu_x${k}`, spawnDepth: 1 }))
      const extra = { agentId: id, isSidechain: true }
      const ar = [{ type: 'user', timestamp: at(s), ...extra, message: { role: 'user', content: 'task brief' } }]
      for (const x of (a.tools ?? []).filter(x => x.start >= s && x.start < e)) {
        const [name, input] = x.kind === 'apply_patch' ? ['Edit', { file_path: '/w/src/a.rs' }] : x.kind === 'write_stdin' ? ['BashOutput', { bash_id: 'b1' }] : ['Bash', { command: x.cmd }]
        ar.push(...pair(x.start, x.end, name, input, extra))
      }
      ar.push({ type: 'assistant', timestamp: at(e), ...extra, message: { role: 'assistant', content: [{ type: 'text', text: 'done' }] } })
      jsonl(join(sub, `agent-${id}.jsonl`), ar)
    }
  }
  console.log(sub)
} else {
  console.error('usage: run-profile-ordinary-fixture.mjs <scenario.json> <codex|claude> <out dir>')
  process.exit(2)
}
