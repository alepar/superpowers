## Subagent dispatch requires multi-agent support

Add to your Codex config (`~/.codex/config.toml`):

```toml
[features]
multi_agent = true
```

This enables the multi-agent tools that skills like
`dispatching-parallel-agents` and `subagent-driven-development` use.
Which tools you get depends on the multi-agent version your model
preset selects (current presets run V2; older ones run V1). Trust your
actual tool list over any table — including this one — when they
disagree.

- **Spawning:** give children a clean context with
  `spawn_agent {fork_turns: "none"}`; the default `"all"` copies your
  entire transcript into the child. On Codex 0.145+, role files under
  `~/.codex/agents/` attach to isolated forks via `agent_type`.
  Full-history forks accept `model` and `reasoning_effort` overrides
  (only `agent_type` is refused there) — isolated forks are the SDD
  default for context hygiene, not because overrides require them.
- **Fix rounds (super-code and super-auto):** every fix pass, seam fix,
  check fix, re-review and re-assessment is a new
  `spawn_agent {fork_turns: "none"}` handed paths, never a resumed
  agent. `followup_task` only chases or clarifies a report the same job
  still owes; never use it for new work, a new round, or steering that
  changes scope. `subagent-driven-development` keeps its own bounded
  design: it resumes the implementer with `followup_task` for fix
  rounds 1–3 and dispatches a fresh one from round 4.
- **Lifecycle:** V2 has no `close_agent`. Finished children are
  evicted automatically when slots are needed; leaving them unclosed
  costs nothing. Only V1 sessions have `close_agent` — there, close
  reviewers when their review returns, and close each implementer
  after its task's review passes.
- **Model names:** never copy a model name from a skill, table, or old
  session into `spawn_agent` without checking it against your current
  spawn allowlist — V2 accepts only V2-capable presets and hard-errors
  on the rest.

## Approval and sandbox in unattended runs

Children run under their coordinator's approval policy and sandbox.
Codex copies the spawning turn's live `approval_policy` and sandbox onto
every `spawn_agent` child, after any role file is applied. A role file
(`[agents.<role>] config_file`), a spawn argument or a profile cannot
set them per child (Codex 0.169). A child's approval prompt is shown in
the child's thread only: the coordinator never sees it, so in a run
nobody is watching, one prompt hangs the run.

So launch the coordinator of an unattended run (super-auto, super-code,
an eval) with no approvals inside a write-limited sandbox:

```toml
approval_policy = "never"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
writable_roots = ["<each resolved root below>"]
```

Every child inherits it. A command outside the writable roots then
fails, and the model sees the failure: a visible error beats an
invisible prompt. The writable roots must cover every place the run
writes routinely, resolved from the repo, not guessed: in a linked
worktree `.git` is a pointer file, and the writes land elsewhere.

- the run's worktree, its task worktrees and the plan workspace;
- `git rev-parse --path-format=absolute --git-common-dir` (objects,
  refs and `worktrees/`), and for a linked worktree
  `git rev-parse --absolute-git-dir` (its index and HEAD);
- the bd store: the first line of `bd where`;
- the project's build and test caches (for example, in a Go repo,
  `go env GOCACHE GOMODCACHE`);
- `TMPDIR` (else `/tmp`).

Add each as a root, or point it inside the run's roots before launch
(for example `GOCACHE`, `GOMODCACHE` and `TMPDIR` under the run dir). In
interactive `codex`, pass each root as `--add-dir <path>` with
`-a never -s workspace-write`. With approvals off, a child cannot
escalate: a command the sandbox blocks is a blocked failure, reported
as such. Sessions a person drives and answers stay on `on-request`.

### Commands Codex refuses with approvals off

Codex's own dangerous-command check runs before the sandbox and ignores
paths. With `approval_policy = "never"` it refuses outright a command
that `on-request` would have asked about (Codex 0.169):

- `rm` with a force option before `--`: `--force`, or any short cluster
  holding `f` (`-f`, `-rf`, `-fr`, `-r -f`, `rm x -f`, `/bin/rm -rf`).
  Codex answers:
  `` `<command>` rejected: rm -f style commands are not permitted. Use a safer approach ``.
  One such line anywhere in a
  `bash -c` / `-lc` script (a newline, `&&`, an `if` body, `$(...)`)
  refuses the whole script, as does one reached through `sudo`, `env`
  or `trap`.
- A command nested more than eight wrappers deep:
  `` rejected: blocked by policy ``.

Everything else runs inside the sandbox, `git` included. When the
rejection is the `rm -f` one, it refuses the form of the command, not
the cleanup: if the same effect on the same files is still authorized,
use the equivalent on exactly those files and carry on: `rm` without
`-f` (`rm`, `rm -r`, `rmdir`), `git restore <paths>`, or
`git clean -f -- <paths>`. Never a bare `git clean` over the worktree,
which deletes untracked work the cleanup was not about. Any other refusal stands.
A refused command is never a request for user authorization, since
nobody is there to grant one; when no equivalent applies, report the
refusal verbatim as the blocker cause.

## Waiting on children

`wait_agent` is an event subscription, not a poll: a long wait wakes
the moment a child produces mailbox activity, with the same latency as
a short one. Short-timeout polling buys nothing and costs a tool call —
and a context rebill — per poll. In measured sessions, roughly
two-thirds of all wait calls were short polls that timed out.

- While you still have local work, do not wait at all. A completed
  child's final answer is pushed into your mailbox and arrives with
  your next turn.
- When you are genuinely idle with children outstanding, wait in
  bounded stretches: `wait_agent` with `timeout_ms` 300000-600000
  (5-10 minutes). After each stretch — wake or timeout — post one
  status line, run `list_agents`, and chase any child that finished
  without reporting. Never stack polls shorter than five minutes; the
  event subscription wakes a bounded stretch just as fast as a short
  one.
- Completion mail cannot wake an idle controller (it is delivered
  without triggering a turn); covering that idle window is
  `wait_agent`'s only job. A stretch that times out with no activity
  is your cue to reconcile, not to shorten the next stretch.

## Model routing on spawns

Every `spawn_agent` you issue — including when you are yourself a
spawned child running a fan-out — sets `model` AND `reasoning_effort`
explicitly, per the Model Selection rules of the skill you are
executing. Setting `model` alone is a trap: the child's effort
silently resets to that model's default, not to yours.

Ask your human partner to add a machine-level backstop to
`~/.codex/config.toml` so any spawn that slips through still routes to
a deliberate tier instead of silently inheriting the session's most
expensive model:

```toml
[agents]
default_subagent_model = "<a mid-tier model from your spawn allowlist>"
default_subagent_reasoning_effort = "medium"
```

## Environment Detection

Skills that create worktrees or finish branches should detect their
environment with read-only git commands before proceeding:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` → already in a linked worktree (skip creation)
- `BRANCH` empty → detached HEAD (cannot branch/push/PR from sandbox)

See `using-git-worktrees` Step 0 and `finishing-a-development-branch`
Step 2 for how each skill uses these signals.

## Codex App Finishing

When the sandbox blocks branch/push operations (detached HEAD in an
externally managed worktree), the agent commits all work and informs
the user to use the App's native controls:

- **"Create branch"** — names the branch, then commit/push/PR via App UI
- **"Hand off to local"** — transfers work to the user's local checkout

The agent can still run tests, stage files, and output suggested branch
names, commit messages, and PR descriptions for the user to copy.
