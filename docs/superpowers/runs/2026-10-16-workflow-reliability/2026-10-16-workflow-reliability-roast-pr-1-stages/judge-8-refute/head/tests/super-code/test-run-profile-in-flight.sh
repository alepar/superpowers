#!/usr/bin/env bash
# Tests for `run-profile --in-flight`: the dispatches of ONE session that started and have not
# finished, on Claude Code (Workflow run dirs and ordinary subagents) and Codex (child rollouts).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
P="$REPO_ROOT/skills/super-code/scripts/run-profile"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
export HOME="$T/home"
mkdir -p "$HOME"
export RUN_PROFILE_NOW=2026-10-01T01:00:00Z
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_has() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing: $2"; echo "    in: $1"; fi; }
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; }

# ---- fixtures ----
node - "$T" <<'JS'
const { mkdirSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')
const T = process.argv[2]
const jl = rows => rows.map(r => JSON.stringify(r)).join('\n') + '\n'
const put = (f, s) => { mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, s) }
const asst = (ts, content) => ({ type: 'assistant', timestamp: ts, message: { role: 'assistant', content } })
const tool = { type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'ls' } }
const text = { type: 'text', text: 'done' }

// Claude: session S1
const sub = join(T, 'claude/projects/-w-proj/S1/subagents')
const wf1 = join(sub, 'workflows/wf_1')
put(join(wf1, 'journal.jsonl'), jl([
  { type: 'started', agentId: 'a1', label: 'plan' }, { type: 'result', agentId: 'a1', result: {} },
  { type: 'started', agentId: 'a2', label: 'impl:ep.2' },
  // Creation is not evidence of dispatch start when this in-flight agent has no transcript.
  { type: 'started', agentId: 'a3', label: 'review:ep.3', created_at: '2026-10-01T00:10:00Z' },
  { type: 'note', text: 'see /w/.superpowers/sdd/ep-plan/progress.md' },
]))
put(join(wf1, 'agent-a2.jsonl'), jl([asst('2026-10-01T00:35:00Z', [tool]), asst('2026-10-01T00:40:00Z', [tool])]))
const wf2 = join(sub, 'workflows/wf_2')
put(join(wf2, 'journal.jsonl'), jl([
  { type: 'started', agentId: 'b1', label: 'impl:other.1' },
  { type: 'note', text: '/w/.superpowers/sdd/other-plan/progress.md' },
]))
put(join(sub, 'agent-x.meta.json'), JSON.stringify({ description: 'impl:ep.4' }))
put(join(sub, 'agent-x.jsonl'), jl([asst('2026-10-01T00:59:30Z', [tool]), asst('2026-10-01T00:59:40Z', [tool])]))
put(join(sub, 'agent-y.meta.json'), JSON.stringify({ description: 'impl:ep.5' }))
put(join(sub, 'agent-y.jsonl'), jl([asst('2026-10-01T00:50:00Z', [tool]), asst('2026-10-01T00:55:00Z', [text])]))

// Claude: 3000 unrelated sessions
for (let i = 0; i < 3000; i++) put(join(T, `claude/projects/-p${i}/Z${i}/subagents/workflows/wf_x/journal.jsonl`), jl([{ type: 'started', agentId: 'q', label: 'impl:z' }]))

// Codex
const meta = (ts, id, parent, path) => ({ timestamp: ts, type: 'session_meta', payload: { id, source: parent ? { subagent: { thread_spawn: { parent_thread_id: parent, agent_path: path } } } : 'cli' } })
const ev = (ts, type) => ({ timestamp: ts, type: 'event_msg', payload: { type } })
const day = join(T, 'codex/sessions/2026/10/01')
put(join(day, 'rollout-2026-10-01T00-00-00-C1.jsonl'), jl([meta('2026-10-01T00:00:00Z', 'C1'), ev('2026-10-01T00:00:00Z', 'task_started')]))
put(join(day, 'rollout-2026-10-01T00-40-00-A.jsonl'), jl([meta('2026-10-01T00:40:00Z', 'A', 'C1', '/root/impl_ep_2'), ev('2026-10-01T00:40:00Z', 'task_started'), ev('2026-10-01T00:45:00Z', 'task_complete'), ev('2026-10-01T00:50:00Z', 'task_started')]))
put(join(day, 'rollout-2026-10-01T00-41-00-B.jsonl'), jl([meta('2026-10-01T00:41:00Z', 'B', 'C1', '/root/impl_ep_3'), ev('2026-10-01T00:41:00Z', 'task_started'), ev('2026-10-01T00:55:00Z', 'task_complete')]))
put(join(day, 'rollout-2026-10-01T00-42-00-C.jsonl'), jl([meta('2026-10-01T00:42:00Z', 'C', 'C9', '/root/impl_ep_4'), ev('2026-10-01T00:42:00Z', 'task_started')]))
// Codex: 3000 unrelated rollouts, older days and the same day
for (let i = 0; i < 3000; i++) {
  const d = i % 2 ? join(T, `codex/sessions/2026/09/${String(1 + (i % 28)).padStart(2, '0')}`) : day
  put(join(d, `rollout-2026-09-01T00-00-00-U${i}.jsonl`), jl([meta('2026-09-01T00:00:00Z', `U${i}`, 'C8', '/root/z'), ev('2026-09-01T00:00:00Z', 'task_started')]))
}
JS

echo "run-profile --in-flight: Claude Code"
export CLAUDE_CONFIG_DIR="$T/claude"
run bash "$P" --in-flight --epic ep --session S1 --harness claude
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "in-flight: impl:ep.2 · 25m
in-flight: impl:ep.4 · 30s
in-flight: review:ep.3 · unknown" "unfinished dispatches only, oldest first, unknown ages last; other epic's run and finished agents skipped"
run bash "$P" --in-flight --epic ep --session S9 --harness claude
assert_eq "$code:$out" "0:" "another session: no lines, exit 0"

echo "run-profile --in-flight: Codex"
export CODEX_HOME="$T/codex"
run bash "$P" --in-flight --epic ep --session C1 --harness codex
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "in-flight: impl_ep_2 · 10m" "only the child whose last task event is task_started"
run bash "$P" --in-flight --epic ep --session NOPE --harness codex
assert_eq "$code:$out" "0:" "unknown coordinator: no lines"

echo "run-profile --in-flight: unreadable roots and bad args"
CLAUDE_CONFIG_DIR="$T/nope" run bash "$P" --in-flight --epic ep --session S1 --harness claude
assert_eq "$code" 0 "claude: exits 0"
assert_has "$out" "in-flight: unknown — cannot read" "claude: unreadable root"
CODEX_HOME="$T/nope" run bash "$P" --in-flight --epic ep --session C1 --harness codex
assert_eq "$code" 0 "codex: exits 0"
assert_has "$out" "in-flight: unknown — cannot read" "codex: unreadable root"
run bash "$P" --in-flight --epic ep --session S1
assert_eq "$code" 2 "missing --harness exits 2"
run bash "$P" --in-flight --epic ep --session S1 --harness bogus
assert_eq "$code" 2 "bad --harness exits 2"

echo "run-profile --in-flight: scans only the named session (3000 unrelated sessions and rollouts present)"
ms=$(node -e '
const { execFileSync } = require("node:child_process"); const P = process.argv[1]
const t = Date.now()
execFileSync("bash", [P, "--in-flight", "--epic", "ep", "--session", "S1", "--harness", "claude"])
execFileSync("bash", [P, "--in-flight", "--epic", "ep", "--session", "C1", "--harness", "codex"], { env: { ...process.env } })
console.log(Date.now() - t)' "$P")
if [ "$ms" -lt 2000 ]; then pass "both harnesses in ${ms} ms (< 2000)"; else fail "took ${ms} ms"; fi

node --check "$REPO_ROOT/skills/super-code/scripts/run-profile.mjs" && pass "run-profile.mjs parses" || fail "run-profile.mjs syntax"

if [ "$FAILURES" -gt 0 ]; then echo "run-profile-in-flight: $FAILURES failure(s)"; exit 1; fi
echo "run-profile-in-flight: all tests passed"
