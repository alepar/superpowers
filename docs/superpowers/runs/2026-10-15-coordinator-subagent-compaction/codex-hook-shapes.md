# Compact-hook facts: Claude Code and Codex

Date: 2026-10-15. Harness versions found: Claude Code 2.1.301, codex-cli 0.162.1.

Method:
- Claude Code: live. A scratch `claude -p --settings <scratch>/settings.json` session (session id
  chosen with `--session-id`), a `compact`-matcher SessionStart hook that saves stdin and env and
  emits a random token as `additionalContext`, then `--resume` with `/compact`, then a question
  asking for the token. Scratch state lived under `/tmp/sp-4d3bafd8/super-plan-goq.1/spike`
  (removed afterwards). The session transcript was written by Claude Code to its normal projects
  directory; no settings file was edited.
- Codex: NOT live. The brief's live path copies `~/.codex/auth.json` into a scratch `CODEX_HOME`.
  The permission layer refused the first command that touched `~/.codex` (reason given:
  "Credential Exploration"), so no credential was copied and no `codex exec` ran. Every Codex entry
  is answered from the 0.162.1 binary's strings (`strings -a` on
  `~/.codex/packages/standalone/releases/0.162.1-aarch64-apple-darwin/bin/codex`, which embeds the
  hook JSON schemas) and is marked `unverified (source)`. A human can unblock the live run by
  supplying a scratch `CODEX_HOME` with its own login. Nothing under `~/.codex` was written.
- Claude Code binary strings: `strings -a` on `~/.local/share/claude/versions/2.1.301`.

Consequence summary for the wiring: A2 is confirmed live. A3 ships on the source-agnostic fallback
that the spec already defines (parse by pattern, emit `hookSpecificOutput.additionalContext`), with
the gap recorded in `MAINTENANCE.md`.

## Claude Code

### 1. Does a compact-matcher SessionStart hook's additionalContext reach the model?

Yes.

status: verified (live)

evidence: Hook command `bash <scratch>/capture.sh`, matcher `compact`, printed
`{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"SPIKE-TOKEN-0e16658c0b79d4d5"}}`.
After `claude -p --resume <uuid> "/compact"` the hook's stdin file existed. A following
`claude -p --resume <uuid> "Repeat any SPIKE-TOKEN string present in your context, verbatim, or say NONE."`
answered `SPIKE-TOKEN-0e16658c0b79d4d5`. The token existed only in the hook script's scratch file,
so the model got it through the hook. The session had run only an "ok" prompt and one Bash call
before compaction, so the token was not in the pre-compaction history.

consequence for the wiring: confirms A2 (a compact-only entry's string reaches the post-compaction
context). The 10,000-character cap was not exercised; A2's two-entry split rests on the documented
cap, not on this run.

### 2. Does idle compaction fire SessionStart with source `compact`?

Not observed. The binary has an idle-compaction path that calls the same host compaction as a
manual one. The source enum for the hook input is fixed.

status: unverified (source)

evidence: In 2.1.301 the SessionStart input schema is
`hook_event_name:"SessionStart", source: one of startup|resume|clear|compact|fork, agent_type?,
model?, session_title?, ...` (no separate idle source). The idle path is a class with
`#n(...)` that, once the 1-hour prompt-cache TTL is nearly spent and the mode is on, calls
`y.compact()` and reports telemetry `tengu_idle_compact_fired` (outcome `started`,
`would_compact` or `no_host`); trigger label `compact_idle`. It is gated (`mode` `off`/`log`/
`compact_on_return`, cache TTL `1h`, token minimum), so it does not fire in a short session. The
hook builder is called with the compaction's `source` argument and short-circuits only on
`n==="compact"` bookkeeping, so a host compaction runs the hooks with `source: compact`. Idle
compaction could not be waited out in a spike.

consequence for the wiring: A2 stays correct on the strength of the shared compaction path. If idle
compaction ever skipped the hook, the coordinator would lose the block only until its next turn;
the read rule (a separate task) covers that case.

### 3. Does `$CLAUDE_CODE_SESSION_ID` equal the hook's stdin `session_id` and survive compaction?

Yes, both.

status: verified (live)

evidence: `--session-id 0b9a0d13-c82d-4166-9807-fceacec7a0ac`. Before compaction a Bash tool call
(`echo $CLAUDE_CODE_SESSION_ID`) printed `0b9a0d13-c82d-4166-9807-fceacec7a0ac`. The compact hook's
stdin carried `"session_id":"0b9a0d13-c82d-4166-9807-fceacec7a0ac"` and its env (the `env` line
appended by the capture script) carried
`CLAUDE_CODE_SESSION_ID=0b9a0d13-c82d-4166-9807-fceacec7a0ac`. After compaction the same Bash call
printed the same value ("The session ID is the same as before you ran `/compact`").

consequence for the wiring: confirms A1/A2: the marker key (`session_id`) can be the coordinator's
`$CLAUDE_CODE_SESSION_ID`, and the id survives compaction.

### 4. Does compaction fire the hook for subagents or Workflow agents, and which stdin fields identify them?

The subagent did not receive the hook output. Whether a subagent's own compaction would fire the
hook was not reachable. The hook payload can carry `agent_id` and `agent_type`.

status: unverified (source)

evidence: Live part: from the scratch session (hook already armed, token present in the parent's
context) a general-purpose subagent was spawned with "repeat any SPIKE-TOKEN string"; it answered
`NONE`, and no new stdin file appeared (only the one from the parent's `/compact`). So a parent's
compaction does not inject into its subagents. Source part: the shared hook-input builder in 2.1.301
returns `session_id, transcript_path, cwd, prompt_id, permission_mode, agent_id: <agentContext.agentId>,
agent_type, effort`: `agent_id` is set (and `session_id` is the parent's id) when the hook runs
inside an agent context, undefined for the main thread. The SessionStart-specific schema adds
`source` and `agent_type`. Separate `SubagentStart` / `SubagentStop` events carry
`agent_id` and `agent_type`. A subagent's own compaction firing SessionStart `compact` was not
reached in a spike; the field names above are from the bundle, not from an observed payload.
Workflow agents were not exercised.

consequence for the wiring: changes A2 slightly: the run-block hook must treat a payload with a
non-empty `agent_id` as not-the-coordinator and emit nothing (same `session_id`, wrong audience);
parse `agent_id` by pattern like the other fields.

### 5. Is `cwd` on stdin?

Yes.

status: verified (live)

evidence: Captured compact stdin:
`{"session_id":"0b9a0d13-...","transcript_path":"/Users/alepar/.aisw/profiles/claude/claude-1/projects/-private-tmp-sp-4d3bafd8-super-plan-goq-1-spike/0b9a0d13-....jsonl","cwd":"/private/tmp/sp-4d3bafd8/super-plan-goq.1/spike","prompt_id":"9030b677-...","hook_event_name":"SessionStart","source":"compact","model":"claude-opus-5-5"}`.
Note `cwd` is the physical path (`/private/tmp/...`), not the symlinked `/tmp/...` the launcher used.

consequence for the wiring: confirms A2's marker-by-`cwd` fallback; compare paths after resolving
symlinks, since a macOS `/tmp` cwd arrives as `/private/tmp`.

## Codex

All eight entries were answered from the 0.162.1 binary's strings and embedded hook JSON schemas
because the live run was refused (see Method). None was observed.

### 1. Real stdin on a compact-source SessionStart (session_id, source, cwd)

status: unverified (source)

evidence: Embedded schema `session-start.command.input` (additionalProperties false): required
`cwd`, `hook_event_name` ("SessionStart"), `model`, `permission_mode`, `session_id`, `source`
(enum startup|resume|clear|compact|fork), `transcript_path` (string or null). No `agent_id`. Sibling
schemas `pre-compact.command.input` and `post-compact.command.input` exist with `trigger`
(manual|auto), `turn_id`, and optional-looking `agent_id`/`agent_type`.

consequence for the wiring: confirms A3's stdin assumptions (`session_id`, `cwd`, `source`).
Codex also has PreCompact/PostCompact events; A3 keeps SessionStart `compact` as spec'd.

### 2. The stdout JSON that injects context

status: unverified (source)

evidence: Schema `session-start.command.output`: `continue`, `stopReason`, `suppressOutput`,
`systemMessage`, and `hookSpecificOutput` = `{"hookEventName":"SessionStart","additionalContext":"<string>"}`
(additionalProperties false, `hookEventName` required).

consequence for the wiring: confirms A3's fallback shape, the same
`hookSpecificOutput.additionalContext` JSON Claude Code takes. Plain text on stdout was not tested
and is not relied on.

### 3. Does stdin `session_id` equal the coordinator's `$CODEX_THREAD_ID`?

status: unverified (source)

evidence: The binary exports `CODEX_THREAD_ID` into exec'd shells (it is in the env pass-through list
beside `SHELL`, `PATH`). The hook schemas call the field `session_id`; no string settles whether the
two are the same value, so equality is unproven.

consequence for the wiring: keeps A3's "stdin `session_id`, falling back to `$CODEX_THREAD_ID`"
wording, but the marker key a Codex coordinator writes (its `$CODEX_THREAD_ID`) may differ from the
hook's `session_id`; the cwd fallback (A1) is then the only reliable match. Verify live before
trusting the session-id path.

### 4. Is `additionalContextLimit` on a hook entry honoured?

status: unverified (source)

evidence: The field exists on command hook entries (`HookHandlerConfig::Command` with 6 elements:
command, timeoutSec, async, statusMessage, additionalContextLimit; also in `hooks/list` output as
`additionalContextLimit`). A log string reads "ignoring additionalContextLimit for <event> hook in
<path>: this event cannot emit additionalContext", so it is honoured for events that can emit
context and ignored for those that cannot. The head-and-tail preview behaviour and whether the unit
is tokens or bytes were not found in the strings.

consequence for the wiring: confirms A3 sets it on the SessionStart entry; the unit and the
2,500-token default are taken from the spec, unconfirmed here.

### 5. What does the per-hook trust hash cover?

status: unverified (source)

evidence: Config shape `[hooks.state."<key>"] trusted_hash = "..."`; `hooks/list` reports
`currentHash`, `trustStatus` (managed|untrusted|trusted|modified), `sourcePath`, `source`, `pluginId`.
Which inputs feed the hash (command string, matcher, timeout, plugin version, path) is not
recoverable from strings. The `modified` status implies a content hash that changes when the entry
changes. No two-install diff was possible.

consequence for the wiring: unchanged: A3 relies on a fixed command string for hash stability and
that is unproven. Treat the "one trust prompt at install" claim as a hypothesis; check it live.

### 6. What does a malformed plugin.json `hooks` value do to the rest of the plugin?

status: unverified (source)

evidence: Strings include "failed to parse plugin.json:", "failed to parse plugin hooks config",
"failed to read plugin hooks config", "plugin.json#hooks[" (a path-style diagnostic for a `hooks`
entry), and "loading hooks from both <a> and <b> ... prefer a single representation for this
layer". Whether the failure drops only hooks or the whole plugin (skills) is not stated.

consequence for the wiring: unchanged: the packaging step must validate `plugin.json` hooks with a
Codex-side check before release, since the blast radius is unknown.

### 7. Accepted `hooks` manifest forms

status: unverified (source)

evidence: The repo's own manifest uses `"hooks": {}`. The "loading hooks from both ... prefer a
single representation" message implies both a file (`hooks/hooks.json` discovered by convention, and
a path in the manifest) and inline hook objects are accepted, and that supplying both is warned
about. A bare path string versus inline object was not tried.

consequence for the wiring: A3 points `plugin.json` `hooks` at a path to `hooks/hooks-codex.json`;
that form is unconfirmed. Note the discovery of `hooks/hooks.json` is why `"hooks": {}` exists today
(the spec's "considered, discarded" item).

### 8. Does compaction fire the hook for child threads, and what identifies them?

status: unverified (source)

evidence: Child threads are tracked as thread-spawn edges (`parent_thread_id`, `child_thread_id`)
and a `SubAgentSource::ThreadSpawn` with `depth`. `PreCompact`/`PostCompact` and `SubagentStart`
inputs carry `agent_id` and `agent_type`; the `session-start.command.input` schema has no
`agent_id`, so a child thread's SessionStart payload is not distinguishable from a parent's by that
event alone. Whether a child compaction fires SessionStart at all was not observed.

consequence for the wiring: changes A3: the hook cannot tell a child from the coordinator by
`agent_id`. It must rely on the marker lookup (a child's `session_id` is not the coordinator's
marker key) and emit nothing when no live marker matches. If the child's `session_id` equals the
parent's, a child compaction would receive the block; accepted as harmless.
