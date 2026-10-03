# Coordinator Workflow (Autonomous Beads Execution)

Reference for `super-code`'s coordinator, which runs every epic, autonomous or interactive. The
`Workflow` tool is required (SKILL.md's "Trigger rule"): there is no hand-driven fallback. The Workflow
script is the *mechanical* coordinator; every judgment call is delegated to a short-lived
`agent()`. The per-task prompts are this skill's own (`./implementer-prompt.md`,
`./task-reviewer-prompt.md`); the brief, review-package and workspace scripts are
`subagent-driven-development`'s, invoked by absolute path. On top of that sit worktree-per-task off
an integration branch, serial merge-back, and the blocker-bead escalation currency.

**Core principle:** tasks coordinate **only** through beads and the integration branch — never
through shared session context. Beads is the durable shared state; the integration branch is the
durable shared code. This is what prevents the state-drift that is the dominant multi-agent
failure mode.

## Coordinator contract

Later tasks in this skill (the prompt files, the Workflow script itself) are written against
this exact shape. Treat it as load-bearing — a differently-spelled key breaks every later task
silently.

```
args = {
  epicId,
  integrationBranch,
  integrationWorktree,   // optional — see below
  skillsRoot,            // required — see below
  deferSweep,            // optional — see below
  processRoots,          // optional — see below
  dryRun,
  config: {
    concurrency: 16,
    runtimeSlots: 10,     // optional — see below; resolved by pre-flight
    hotFileCap: 3,        // optional — see below
    topUpQueryCap: 40,    // optional — see below
    earlyUnblock: true,   // optional — see below
    edgeAuditCap: 3,      // optional — see below
    edgeCuts: 'apply-safe',  // optional — see below; autonomous runs only
    mergeCheck: '<exact build-only command>',  // optional — see below; never a test command
    sweep: '<exact full-suite test command>',  // optional — see below
    testPaths: ['tests/**', '...'],  // optional — REPLACES the default test pathspecs, see below
    models: { planner: 'opus', implementer: 'sonnet', reviewer: 'sonnet', mechanical: 'sonnet', triage: 'opus', finalReview: 'opus' },
    efforts: { mechanical: 'low' },  // optional — per-role reasoning effort overrides, see below
  },
  prompts: { ... },
}
```

`runtimeSlots` is **optional**: the Workflow runtime's agent slots per workflow, `min(16, cores-2)`,
which pre-flight resolves (the script cannot read the core count). The scheduler cap becomes
`min(concurrency, runtimeSlots - 2)`: the runtime queues every agent call over its slots in one
queue, so admitting more chains than that parks the merge, top-up and ledger dispatches behind
implementers. The two free slots are for the merge lane and the top-up/ledger work. Without it the
cap is `concurrency` as given, and a log line says it was not checked.

`efforts` is **optional**: per-role reasoning-effort overrides (`low`, `medium`, `high`, `xhigh`,
`max`) passed beside each dispatch's model. Defaults: `mechanical` low; `planner`, `triage` and
`finalReview` high; `implementer` and `reviewer` (which also runs the merge) inherit the session's
effort. dryRun stubs take none.

`hotFileCap` is **optional** — additive, defaulting to 3: how many in-flight tasks may declare
the same `filesTouched` file at once (the scheduling constraint that replaced disjoint-file
bucketing — see "The coordinator loop" step 3 and SKILL.md §Parallelism).

`topUpQueryCap` is **optional** — additive, defaulting to 40: the per-round budget of `bd ready`
top-up re-queries ("The coordinator loop" step 4). Mid-round readiness is normally computed in JS
from the planner's `deps` rows at no agent cost; the top-up query runs only where JS cannot see
readiness — a mapping with no `deps` rows, or a waiting row marked `opaque` — and there it still
costs one mechanical agent per landing, which this caps. Exhaustion degrades to the ordinary
round-boundary refill (no work lost), and the detector line reports usage.

`earlyUnblock` is **optional**, default `true`: a task with open in-tree dependents is **split**
when its implementer reports a commit. A mechanical dispatch (`scripts/review-bead split`) creates a
`review: <id>` bead (label `sp:review`, the task's parent and `sp:` labels, blocked by the task) and
then closes the task bead; the task's review, fix and merge continue under the review bead, which
its merge closes. Its dependents dispatch at once, each on a worktree cut with the task's branch
merged in (its **stack parent**), and merge only after it merged; a stack parent that does not merge
cancels them (see "The coordinator loop" step 4). `false` keeps dependents waiting for the merge,
with no review beads. Early unblock needs the planner's `deps` rows; without them nothing is split.

`sweep` is **optional**: the exact full-suite command Finish runs once, against the integration
tip, before the final review. The string carries the project's execution envelope
(`nice`/`ionice`, `OMP_NUM_THREADS`-style caps from `AGENTS.md`) so it is written once. When a
caller doesn't declare it, the pre-flight session resolves the project's full test command and
passes it here, so the `Launch:` line records what ran; a launch without it falls back to the sweep
agent finding the command itself. The sweep is mandatory whenever work landed, unless
`deferSweep` is set.

`processRoots` is **optional**: absolute paths the caller owns for this run (super-auto passes its
run directory), added to the Finish process sweep's roots beside every task worktree and the run
temp root `<integration worktree>/.superpowers/sdd/<epic>-plan/tmp/`. A process whose cwd,
executable, arguments or HOME/TMPDIR is under any root is the run's and gets stopped, so a root is
never a shared location.

`deferSweep` is **optional**: `true` means the caller runs the full-suite sweep itself (super-auto
runs one after its fix loop exits). Finish then skips the sweep, tells the final reviewer it was
deferred, and returns `sweep: "SWEEP DEFERRED (caller-owned)"`.

`mergeCheck` is **optional**: the exact BUILD-ONLY command — compile or typecheck, envelope
included (`cargo check --all-targets`, `tsc --noEmit`, `go build ./...`) — the merge agent runs on
the merged tree at every serial merge. It is never a test command: no tests run per merge. It
catches cross-branch compile seams no task's own tests can see (a sibling changed an API this task
still calls; a fixture lacks a column a parallel task added) before more merges stack on top. A
failing check gets one merge-check fix and a scoped review of it before the blocker path (see
"Serial merge-back"). When
a caller doesn't declare it, pre-flight resolves the project's build/typecheck command; a project
with none gets `'none'`, and no check runs. The `Launch:` line records the resolved command or
`none`. A `config.gate` from an older caller is ignored with a log line. Which command ran is on the ledger's `Launch:` and
`Sweep:` lines.

`edgeAuditCap` is **optional** — additive: how many dependency-edge audits one invocation may
dispatch, default 3, `0` disables. Armed by two consecutive rounds whose peak in-flight stayed under
the cap while mapped beads were still open (a drained graph has nothing to audit), or once, as soon
as the graph is known, when it is graph-bound — checked again when round 1's second planner maps
the rest of the tree, since before that the mapping holds only the first planner's rows; see "The
coordinator loop" step 7. Each audit carries earlier "safe no" verdicts rather than re-judging them.

`edgeCuts` is **optional**: `'apply-safe'` lets an audit's safe-class changes be applied mid-run
(an autonomous run passes it); absent or anything else, every audit is report-only (an
interactive run leaves it unset, so a human decides). Pre-flight probes `bd dep` and `bd update`
when it is set.

`testPaths` is **optional** — additive: an array of git pathspecs that **replaces** the
built-in default list wholesale (it is not merged with the defaults). Both reviewing dispatches on
a task — the task review and the post-rebase seam review — run a stat diff and a full diff of
their range restricted to these pathspecs (see "Per-task pipeline" below and `taskReviewPrompt` /
`seamReviewPrompt`). An empty array (`testPaths: []`) is rejected at
pre-flight: the defaults are retained and a warning is logged, since an empty pathspec list
would silently turn off the Test-changes check rather than widen it. Pre-flight also runs
`git ls-files -- <the pathspecs>` once: when the defaults (or the declared list) match no tracked
file, as in a language whose tests live inline in source files (Rust `#[cfg(test)]`), every
`Test changes: none` is vacuous — declare `testPaths` (for inline tests, the source globs that
hold them) or note in friction that the check is blind for this project.

`sweepBaseline` is **optional**: `true` runs the sweep once at the starting tip, before any work
(a `Sweep baseline:` ledger line), and the Finish sweep then names the tests that fail now but did
not at the start. Off by default (it doubles the sweep cost) and never under `deferSweep`.

`integrationWorktree` is **optional** — additive and non-breaking: the path of the integration branch's checkout. When omitted, the script derives it from
`integrationBranch` alone by the fixed pre-flight convention (see "Pre-flight" below), with any
`/` in the branch name collapsed to `-`. A caller that created the integration worktree itself
**must** pass it: `super-auto`'s run branch is `super-auto/<slug>` and its worktree is wherever
`using-git-worktrees` (often a native tool) put it — a path no string derivation from the branch
name can recover. Before this field existed, every `super-auto` → `super-code` handoff derived
`.worktrees/super-auto/<slug>` (a path containing a slash) while the real worktree collapsed the
slash to a hyphen or lived under a native tool's directory — mismatched by construction on every
handoff.

`skillsRoot` is **required**: the absolute path of the superpowers `skills/` directory the
running super-code was loaded from (the parent of this skill's base directory). The pre-flight
session resolves it. Every dispatched agent works in a project worktree, where a relative
`./planner-prompt.md` or `scripts/task-brief` resolves into the project, not the skill, so every
template and script path in a dispatch is built from `skillsRoot`. A missing `skillsRoot` fails the
launch on line 1.

`mechanical` and `triage` are deliberately separate roles: `triage` names the opus **judgment
calls** — RESOLVE vs ESCALATE on a blocker bead (see "The blocker-bead path") and the edge
audit's change judgment — and never means "the cheap one". `mechanical` is for dispatches with a fully-specified, no-improvisation procedure — no branching
left to the dispatched agent's judgment: a literal CLI or script echo (`scripts/ready-in-tree`,
`scripts/close-in-tree-epics`, `scripts/review-bead`, notifications,
recording a clarification, discarding a cancelled task's worktree, applying an audit's safe edge
cuts after re-checking them).
Deterministic multi-step procedures (the ready fallback's tree filter, the epic-closure fixpoint,
the edge audit's graph numbers, each bead's leaf blockers, the early-unblock split) live in shipped
scripts, not in prompt prose. Keep every dispatch
whose every branch is pre-decided on `mechanical`, and the RESOLVE vs ESCALATE call on `triage`.

`dryRun: true` swaps every dispatched agent for a canned stub, for the same reason as
`super-roast`'s dryRun policy (see `skills/super-roast/super-roast-workflow.md`): validate the
script's topology — sequencing, fan-out, the concurrency cap, the merge gate — for pennies,
without spending real model budget or touching git/bd. The stub table and dryRun assertions for
this skill's script are a later task's concern; this doc only reserves the field in the contract.

**Per-task pipeline** (the sequence every ready bead runs through once dispatched — see
"Per-task pipeline" below for the full walk-through):

```
implementer (workspace setup + task-brief, then task-relevant tests, once) → [split, when it has open dependents]
  → review-package → task review (one, light) → [Critical/Important: one fix pass]
  → [wait for stack parents' merges] → serial merge (build-only mergeCheck, no tests) → ledger
```

One review per task, at most one fix pass, no re-review, and no per-merge tests (only the build-only
`mergeCheck`); Finish runs the
full suite once (the sweep) and the final whole-epic review. See SKILL.md's "Review and test
policy" and "Review and fix pass" below.

## Key constraint: the script does no I/O

A Workflow script can call only its hooks — `agent()`, `pipeline()`, `parallel()`, `log()`,
`phase()`. It has **no shell, no filesystem, no git, no `bd`**. So every side-effect happens
*inside* a dispatched agent:

| Side-effect | Who does it |
|-------------|-------------|
| `bd ready`, `bd show`, `bd close`, `bd create` | a dispatched agent (returns structured data via `schema`) |
| `scripts/sdd-workspace`, `scripts/task-brief`, `scripts/review-package`, `scripts/already-merged`, `scripts/ledger-digest`, `scripts/ready-in-tree`, `scripts/close-in-tree-epics`, `scripts/tree-shape`, `scripts/tree-deps`, `scripts/review-bead` (and `scripts/epic-tree`, which the tree scripts share) | a dispatched agent, via `bash <abs path>` (these are shell scripts; the coordinator script cannot invoke them) |
| git: create worktree, commit, rebase, merge | the implementer (its workspace setup and commits, in the task worktree) and the merge agent (task and integration worktrees) |
| decide resolvable vs escalate | the triage agent (opus) |

The script's job is sequencing, fan-out, the concurrency cap, and the serial merge gate. Building
a prompt string from a template literal (interpolating a task id, a branch name) is not I/O and
belongs in the script; reading a file's contents to build that string is I/O and belongs in a
dispatched agent.

## Null dispatch policy (`agent()` can return null)

The Workflow runtime returns **null** from `agent()` when a dispatched subagent dies on a terminal
API error after retries (a 529 mid-run is enough). This never happens under `dryRun: true` — stubs
always answer — which is exactly why the first live run was the first thing to hit it: a single
null merge result crashed a run in which 21 of 22 agents had already completed
(`null is not an object (evaluating 'm.merged')`), and a null `bd ready` result, "handled" as
`ready?.ids ?? []`, exited the loop reporting the epic drained — an API failure converted into a
false success indistinguishable from real completion.

Two rules, both mandatory in `./coordinator.js`:

1. **Every `await agent(...)` goes through `dispatch()`**, a thin wrapper that logs each swallowed
   null by label and phase — so a swallowed failure is visible in `/workflows` instead of looking
   like progress — and counts it toward the round's null tally. A script-echo dispatch
   (`bd-ready*`, `close-epics`, `edge-audit`) whose script failed returns `scriptError` instead of
   a result, and `dispatch()` turns that into the same logged null, so a failed script takes the
   row below for its class and is never read as "nothing ready" or "nothing to close".
2. **There is no blanket default.** Each dispatch class has its own null semantic, because most
   defaults would fabricate an outcome no agent produced:

| Dispatch class | On null |
|---|---|
| `merge` | **No merge happened**: no `bd close`, no `complete` ledger line, no bucket — and **not** the blocker path (a transient API error is not blocker-worthy). The task stays open in `bd` and re-enters via the next round's ready batch. |
| `implement` / `review` / `fix` | Not CLEAN, not BLOCKED — "no progress this round." The task's pipeline result is null (filtered before Integrate) and the next ready query re-surfaces it. A null fix pass never merges the task unfixed. |
| `triage` | **Unsettled**: ESCALATE is terminal quarantine and RESOLVE burns the one-retry allowance — neither judgment was made, so neither cost is paid. No bucket, no ledger line; re-enters next round. |
| blocker-filing (`missing-blocker` / `unplanned-blocker`) | The task proceeds without a bead id; `handleBlocker`'s missing-bead fallback files one, and if **that** also nulls, the task is left unsettled this round. |
| `close-epics` | **Closed zero epics — never `rootClosed`**: defaulting `rootClosed` true would declare an unfinished epic done. |
| `bd-ready` | **Not completion.** An explicit `stopReason: 'ready-unavailable'` after the bounded retry below — never the drained exit. |
| `bd-ready-topup` (the `bd ready` re-query after a landing, where JS cannot see readiness) | **Opportunistic**: a null skips this top-up — logged, no bounded retry, never a stopReason. The next round's `bd-ready` remains the authority; the missed bead dispatches then. |
| `review-bead` (the early-unblock split) | **The task stays unsplit in bd**: no review bead, its task bead closes at its merge. Its dependents dispatch from the graph regardless — JS, not bd, decides mid-round readiness — and the merge closes only the task bead. Logged. |
| `reopen` (a split task that did not merge) | **The task bead stays closed**, so bd may report its dependents ready next round; the round head holds back any ready id whose in-tree blocker is quarantined or awaiting its retry. Logged. |
| `discard` (a cancelled task's worktree) | **The stale worktree may remain**: the task's next workspace setup is told to remove it and cut fresh, so a re-dispatch never reuses work built on a stack parent that did not land. Logged. |
| `edge-audit` / `edge-cuts` (the background dependency-edge audit and its apply step) | **Opportunistic**: nothing gates on either. A null audit records nothing; a null apply leaves the safe changes unapplied and returns them as a `slowness` item. Logged. |
| `bd-ready-recheck` (the post-closure re-query when Close reported in-tree closures) | **Opportunistic**: a null keeps the original concurrent ready result — logged, never a stopReason. |
| `plan` | **Degrade first**: ready ids an earlier round already mapped still dispatch on the retained plan, and only the unmapped ids wait for a later round's planner (never the unplanned-blocker path). With nothing mapped the round is abandoned; three consecutive such planner nulls stop the run with `stopReason: 'plan-unavailable'`. |
| `plan-rest` (round 1's second planner) | **Opportunistic**: logged; the beads it would have mapped are planned by later rounds' refill planning. Never a stopReason. |
| `read-ledger` | Retried once (`read-ledger:retry`). A second null: Resume reconstructs nothing, loudly: `bd ready` remains the authority on closed work, but prior-run `pendingRetry` bounds are lost for this run — logged, not silent. |
| `read-ledger:finish` (the Metrics re-read) | Retried once (`read-ledger:finish:retry`). A second null is logged as a NULL dispatch; the four `Metrics:` lines are then written as `Metrics: UNAVAILABLE — the Finish ledger re-read returned null` rather than as zero counts. |
| `final-review` | `review` is an explicit UNAVAILABLE string — **never** "no findings". |
| `worktree-sweep` | `worktreesKept` is `['WORKTREE SWEEP UNAVAILABLE — …']` and `processSweep.survived` is `['PROCESS SWEEP UNAVAILABLE — …']` — **never** empty lists, which would read as nothing left behind. |
| ledger writes (`ledger:<id>` — one per task chain, carrying every line the task noted — plus `ledger-append:<kind>` and `ledger-recurring:<k>`; all via `appendLedger` on the ledger chain) | **Retried once, then marked**: a null append is re-dispatched once — with the lines' agent-authored free text elided where the call site has an elided variant (ids and outcome token kept) — and a second null is recorded by label in `ledgerAppendFailed` (returned), logged as `ledger-append-failed: <label>`, and counted on the Finish-phase `Metrics: ledger-check` line. Never silent, never fatal. |
| `notify` | Retried once with the detail elided (ids and the blocker bead only); a second null is logged and the run continues — the ledger's BLOCKED line and the bead carry the record. |
| `clarify` | Fire-and-forget: logged and continued. The clarification IS the payload, so there is no elided form; the retry then runs without it (a known cost, recorded here). |

**Bounded null-retry (2 rounds).** A round that made no forward progress *while swallowing at least
one null* is retried up to two consecutive times before the no-progress guard stalls the run — one
transient failure costs a round, not a run, while a permanently failing dispatch still terminates
through the same stall guard once the bound is spent. The counter resets on any round that makes
real progress. The `bd-ready` and `plan` stops each count only their own consecutive nulls (three
attempts), so a mixed outage cannot trip either stop early, and each is still bounded. Both stops
happen at a round boundary: a round drains its chains, top-ups and merge queue before the next
round's Ready and Plan, so nothing is in flight and the caller relaunches without asking
(SKILL.md "Unattended runs").

## Authoring pitfalls (plumbing that crashes the coordinator before real work runs)

These three are *control-plane* bugs, not task logic — each kills the run on round 0–1 with a
misleading symptom. `./coordinator.js` already guards against them; keep the guards when you
adapt it.

- **Validate `args` on the first line, fail loud.** `const { epicId } = args` silently yields
  `undefined` when args didn't arrive as an object (e.g. a stringified value, or a renamed
  field). It then crashes *late and cryptically* — often only when the first **non-empty**
  `.filter()` runs its callback (an empty ready set never invokes the callback, so an
  `undefined`-driven `ALLOWED.includes` looks fine for several rounds, then explodes). Add
  `if (!epicId) throw new Error('args: ' + JSON.stringify(args))` and `log()` the args up front
  so a mis-pass dies on line 1 with the actual value shown.
- **Keep control-flow queries mechanical — never an agent judgment call.** The `bd ready` step
  *decides what runs*; it must be deterministic. An agent told to "return the ready ids" can
  return `{ids:[]}` **despite printing the matching tasks in the same turn**. Have it echo the
  verbatim output of a precise command and forbid reasoning: agents do the *work*, the script
  does the *sequencing*.
- **Don't pipe a CLI's `--json` straight into a schema.** `bd ready --json` (and many `--json`
  flags) can emit the value plus trailing legend/warning text, so the agent's `JSON.parse` throws
  "Extra data". Prefer plain output + a `grep` for the handful of ids you actually need.

## Pre-flight (before launching the Workflow)

Done by the main session, not the Workflow:

1. Confirm `bd` is available and identify the epic. When a caller named the epic (`super-auto`
   always does), use it. Otherwise, if there is more than one candidate or the scope is ambiguous,
   **confirm scope with the user** before launching. Resolve `skillsRoot` (the parent of this
   skill's base directory) for the launch args, and — when the caller declared no `config.sweep`
   and no `deferSweep` — the project's full test command (from `AGENTS.md`, the README, or CI
   config, with its execution envelope) as `config.sweep`; and, when no `config.mergeCheck` was
   declared, the project's build-only compile/typecheck command (never a test command) as
   `config.mergeCheck`, or `'none'` when the project has no such step. Read it off the CI build
   matrix when there is one, and cover every build configuration CI compiles, chained with `&&`
   (for Cargo at least the default features and `--all-features`: either alone misses a break the
   other catches). Whether resolved or declared, if `mergeCheck` covers fewer configurations than
   CI builds, say which are missing in a friction note before launching.
2. Create the **epic integration branch on its own worktree**, following
   `superpowers:using-git-worktrees` (project-local `.worktrees/`, verified git-ignored), **at the
   path `.worktrees/<integrationBranch>`, with any `/` in the branch name replaced by `-`** —
   this fixed naming convention is what lets the Workflow script derive the integration worktree
   path from `integrationBranch` alone (see `./coordinator.js`) when the caller doesn't pass
   `integrationWorktree`. The slash rule is load-bearing, not cosmetic: worktree tools do not
   reliably create nested directories for slashed branch names (native tools collapse or relocate
   them), so a derivation that interpolates the branch name verbatim produces a path that exists
   for no slashed branch — the exact `super-auto/<slug>` mismatch the `integrationWorktree`
   contract field exists to fix. When the integration worktree **already exists** (a caller like
   `super-auto` created it as its run worktree), skip creation entirely and pass its real path as
   `integrationWorktree` — never re-derive it. The user's original worktree stays untouched.
   Record: epic id, integration branch name, and (when not derivable) the worktree path.
3. Resolve the runtime's agent slots and choose a concurrency cap. Read the core count
   (`sysctl -n hw.ncpu` on macOS, `nproc` on Linux) and pass `config.runtimeSlots = min(16, cores-2)`
   — the Workflow runtime's per-workflow agent cap, which the script cannot read itself. The script
   caps chains at `min(config.concurrency, runtimeSlots - 2)`, keeping two slots for the merge lane
   and the top-up/ledger work: the runtime queues every call over its slots in one queue, so an
   over-admitting cap would park merges behind implementers. `config.concurrency` defaults to 16;
   pass a smaller value only to throttle further (budget, or a repo where many concurrent
   worktrees hurt).
4. Run step 5's permission check, then launch the Workflow (background) from the shipped script.
   The Workflow tool refuses a `scriptPath` in the plugin cache ("must be a script path this tool
   returned, or a file you can already read"), so first copy it, byte for byte, to your scratchpad
   (or the integration workspace, which is git-ignored) and launch the copy:
   `Workflow({scriptPath: '<copy>/coordinator.js', args})`, with the args from "Coordinator
   contract" above. Relaunches reuse that copy; make a fresh one only after a definitions switch. Progress is visible via `/workflows`. The main session stays on
   the run and does not end its turn at launch (SKILL.md's "Unattended runs"): it appends
   friction-log entries from the coordinator's log (Finish, "Friction capture"), and when the
   Workflow returns it reads `stopReason` — `root-closed`, `ready-drained` or `stalled` go on to
   Finish; an agent-budget-cap end or a first outage stop gets a relaunch with `resumeFromRunId`.
   Recovery is driven by the ledger and `bd ready`, not the Workflow cache: `resumeFromRunId` replays
   only the agent calls before the first concurrent fan-out, so it is an optimization, not the
   recovery path.
5. **Permission check (mandatory).** Every dispatched agent runs commands under the harness
   permission layer, and a refusal there is a dead end: the command never executes and no agent
   can ask anyone. Before launching, probe each operation class the run uses, side-effect-free,
   from the integration worktree:
   - worktree add/remove and `branch -D`: `git worktree add .worktrees/preflight-probe -b preflight-probe`,
     then `git worktree remove .worktrees/preflight-probe` and `git branch -D preflight-probe`;
   - `git rebase` and `git merge --no-ff`: in that throwaway worktree before removing it,
     `git rebase <integrationBranch>` and `git merge --no-ff --no-edit <integrationBranch>` (both
     no-ops against its own base);
   - `bd create` / `bd close` / `bd comment`: each with `--help`; with `config.edgeCuts:
     'apply-safe'`, also `bd dep` and `bd update`;
   - the project's setup step, the `mergeCheck` build command, and the sweep command (or the project's test runner): each tool
     with `--help` or a collect-only flag.
   Never probe with a real push, delete, or close. If a class is refused, ask the user to allow it
   before launching; never edit permission settings yourself. Mid-run, the decided policy is *work
   around once, then accept the loss*: an agent that is refused takes the narrow path to the same result (one file edit per hunk, one
   plain git command, `scripts/stop-run-processes` — never a re-spelled bulk command); refused
   again, it reports `BLOCKED_AUTH`, the coordinator logs it, quarantines that task for the run,
   and continues (see "Escalation = notify + quarantine + continue"). The coverage loss is
   reported as untested scope.

### Quiesce before a planned relaunch (decided policy — issue #2 design question C)

A Workflow loads its script once, so every coordinator edit costs stop + relaunch — and a
`TaskStop` mid-round destroys the in-flight implementers and gates it interrupts:
`resumeFromRunId` returns cached results for *completed* agents only, never running ones
(measured live: ~30 minutes of destroyed in-flight work per relaunch, four relaunches paid, on a
run that expects 4-6 relaunches for the agent-budget cap alone). For a **planned** relaunch —
a coordinator edit, a config change — quiesce instead of killing:

1. Do not stop mid-round. Watch `/workflows` (or the per-round detector line) for the in-flight
   count to drain — the natural window is after a round's last merge, before the next round's
   dispatches.
2. Stop in that window, edit, relaunch with `resumeFromRunId` — every completed agent replays
   from cache; nothing running was killed, so nothing is re-paid.
3. An **unplanned** stop (the script is wrong *now*) is the exception that justifies killing
   mid-round: pay the in-flight loss, but say so in the relaunch note rather than absorbing it
   silently.

The waiting is idle time by construction — it converts destroyed work into a bounded delay and
needs no runtime change. Budget-cap relaunches are the session's own job, done without asking
(SKILL.md's "Unattended runs").

**Edit-driven relaunches (issue #3 design question A — position stated, not left silent).** The
measured run paid six mid-run coordinator edits at ~30 minutes of destroyed in-flight work each.
The two alternatives on the table were a deferred-edit queue and adopting running agents on
resume. The position: the round boundary above *is* the deferred-edit queue — an edit that can
wait for the drain window costs nothing; and adopting running agents is a Workflow-runtime
capability (durable agent handles, reconciliation of half-finished ledger state) this skill
cannot provide from the script side and will not fake. So an urgent mid-round edit is a
deliberate trade, taken knowingly: kill, pay the in-flight loss, and record it in the relaunch
note. What this skill *does* reduce is the number of relaunches: the agent-budget cap is the
usual reason for one, so the `Launch:` ledger line (issue #2) makes each relaunch cheap to
compose, and `resumeFromRunId` makes it cheap to replay. A run that expects many relaunches
should size its budget guard so that the boundary comes at a round end, not mid-round.

## The coordinator loop

Round-based with refill (each `bd ready` batch is, by definition, mutually independent):

1. **Query** — an agent runs `scripts/ready-in-tree <epicId>`, which tries a fast labelled query
   first, `bd ready --exclude-type=epic --exclude-label blocker --label sp:<epicId> --limit 500` (excludes epic-type containers, which `bd ready`
   includes by default; excludes blocker beads, which are escalation records and never work items —
   see "The blocker-bead path" for the live loop that dispatching one causes; scopes to
   this run's tree via the `sp:` label `super-design` stamps on everything it creates; and
   overrides `bd ready`'s silent default of `--limit 100` with its repo-global priority sort,
   under which a busy repo starves this epic's beads out of the result entirely — a returned
   count equal to the limit means truncation, and the script re-runs with the limit doubled). **An empty
   result here does not mean the tree is empty** (see `./MAINTENANCE.md`, "Resolved defects": the `sp:`-labelling and canonical-args items): the label
   only exists on trees `super-design` created — a hand-made epic, or a sub-epic handed to super-code
   directly (whose members carry the *root* epic's `sp:` label, not their own id's), always comes up
   empty on this query even with real ready work waiting. When it does, the script falls back to
   the repo-global ready set and filters it to this run's tree using the same structural
   parent-child test the epic-closure step below uses — never the id-prefix convention alone, which
   a hand-created or nested-subepic bead can violate. One membership test, `scripts/epic-tree`,
   used by the Ready fallback, epic closure, and the edge audit.
   The Close pass and this query dispatch **concurrently** (they are independent except for
   epic-dependent tasks); when Close reports in-tree closures, one opportunistic re-check
   refreshes the ready result so epic-dependents join this round.
   **Review beads come back apart from work.** The query excludes `sp:review` beads from `ids` and
   lists each ready one in `reviews` with the task its title names: a task split at
   implementation-done whose merge never landed (a restart, or a null merge). That task re-enters
   at its review stage on its existing branch — never re-planned, never re-implemented — and a
   dependent bd reports ready alongside it stacks on it. The round head also holds back a ready id
   whose in-tree blocker this run quarantined or left awaiting its retry: bd sees that blocker's
   task bead closed only when a reopen was lost. A round whose every ready id is held back ends
   like an empty ready set (`ready-drained`).
2. **Terminate?** — completion is **the root epic (`epicId`) closed**, not an empty ready set:
   run the epic-closure step (below) after each refill cycle and check whether the root closed.
   An empty ready set with the root still open means the remaining work is quarantined blockers
   (see "The blocker-bead path") — that ends the loop too, but as a report, not a clean finish. A
   **third** exit, independent of both: a round that merges no task, closes no epic, gains no
   RESOLVE-pending id, and quarantines no id at all made no forward progress whatsoever and never
   will on its own. A `RESOLVE` triage verdict gets exactly one real re-attempt next round before
   it's bounded into an `ESCALATE` (see "The blocker-bead path") — that bound alone guarantees any
   *single* stuck id eventually terminates, but this guard is the belt-and-suspenders backstop for
   the general case (any future loop-control edge this doc hasn't anticipated). Stop and report
   rather than spin (see `./coordinator.js`'s no-progress guard, right after the Integrate phase).
3. **Dispatch the batch under a sliding window** — every planned id dispatches as soon as a slot
   frees, bounded by the concurrency cap (`min(config.concurrency, runtimeSlots - 2)`, so every
   admitted chain is a running agent and two runtime slots stay free for merges and top-ups), with
   one file-based scheduling constraint:
   at most `config.hotFileCap` (default 3) in-flight tasks may declare the same file
   (`filesTouched`, from the planner's mapping — a churn bound for shared barrel/index/registry
   files, not a dispatch gate). No batch or wave barriers anywhere: a straggler never delays the
   next task's dispatch, and the per-task chain has **no barrier between stages** either (a fast
   task isn't held up by a slow sibling at any point, including its merge — see step 4).
   Disjoint-file bucketing used to gate dispatch here; it was removed on live measurement — see
   SKILL.md §Parallelism and the Implement-phase comment in `./coordinator.js` for
   the numbers and the recorded counter-evidence.
4. **Single-flight merge queue** — each task's integration is enqueued **the instant its own
   chain ends** and drains in completion order, with **exactly one merge in flight, ever**
   (guaranteed by promise chaining, not batching — see `enqueueIntegration` in `./coordinator.js`).
   Completion order loses nothing dependency-wise: a `bd ready` batch is mutually independent by
   definition (step 1), and a task dispatched on an unmerged parent (below) enqueues only after
   that parent merged. A successful merge does `bd close <id>` — a leaf-task close, plus the
   task's review bead when it was split; epic closure is the separate step below. Only merge
   work rides the queue: a BLOCKED or permission-refused task, an unmapped id, and an
   already-merged re-entry are handled where the chain ends, beside the merges and inside a
   concurrency slot like any chain (none touches the integration branch, and `bd` writes are safe
   beside a merge); a merge that fails releases the queue before its triage runs. Ledger lines never hold it either (see "Workspace and ledger").
   **Mid-round readiness is computed, not queried.** The planner's mapping rows carry each open
   bead's in-tree leaf blockers (`deps`, from `scripts/tree-deps`) and whether anything else gates
   it (`opaque`: an epic-level or out-of-tree blocker, a hand claim). Every landing — and, with
   `earlyUnblock`, every split task's implementation — runs `readyFromGraph()` in JS: a row whose
   blockers have all landed, at least one of them this round, dispatches into this round's
   scheduler with no agent spent. The `bd ready` top-up (epic closure, then a ready re-query) runs
   after a landing only where JS cannot see readiness: a mapping with no `deps` rows at all, or a
   waiting `opaque` row (see the top-up block in `./coordinator.js` for the bounds: dedup set,
   re-entrancy coalescing, mapping-row gate, quiescence before the drain).
   **Early unblock** (`config.earlyUnblock`, default on). A task with open in-tree dependents is
   split when its implementer reports a commit: `scripts/review-bead split` creates its
   `review: <id>` bead, then closes its task bead — beside the review, never before the dependents
   dispatch, and after its own stack parents' splits (bd refuses to close a bead whose blocker is
   open). Each dependent is cut from the integration tip with its implemented-but-unmerged
   blockers' branches merged in (`stack: <id>` commits), so its base is the commit after them and
   its review package shows only its own diff. It waits for every stack parent to merge before it
   enqueues — outside the queue, never at its head — and its merge rebases only its own commits
   (`git rebase --onto <integration> <stacked base>`), so a parent's pre-review commits are never
   replayed; its seam check compares against the stacked base, which counts every file the
   parent's fix pass changed. A parent whose attempt ends without merging cancels every live task
   stacked on it, transitively: each stops at its next step, gets a `cancelled (parent <id> …)`
   ledger line, and has its worktree discarded; a terminal failure (BLOCKED, BLOCKED_AUTH, a failed
   merge) also reopens the parent's task bead so bd blocks its dependents again, while a null leaves
   it closed so its review bead brings it back at the review stage. A cancelled task is not
   escalated: it dispatches again once its parent is implemented again (a RESOLVE retry, or a later
   round). Two stack parents whose branches conflict make the implementer's workspace setup return `STACK_CONFLICT` before implementing: the
   task waits for both to merge, then cuts fresh.
5. **Epic closure** — `bd epic close-eligible` is repo-global: it has no `--label`/`--parent`/
   `--mol` scoping flag (verified via `--help`), so the mutating form is **never** called
   unfiltered — in a repo holding more than one live epic it would close epics belonging to
   unrelated work. An agent runs `scripts/close-in-tree-epics <epicId>`: every pass previews with
   `bd epic close-eligible --dry-run --json`, keeps the candidates `scripts/epic-tree` places in
   this run's tree, and closes those individually via `bd close <id>`. **Stop condition: a pass that
   closes zero in-tree ids** — not "the preview is `[]`": an out-of-tree epic that is permanently
   close-eligible reappears in every stateless preview, so "stop on `[]`" would spin forever, while
   each pass that closes something can unlock the next level up.
   **Tree-membership test** (`scripts/epic-tree`): `<id> === epicId` is IN-TREE (the root has no
   parent to walk to); otherwise recorded parent-child links (`bd list --all --json`'s
   `dependencies` entries with `type: "parent-child"`), followed transitively, must reach `epicId`.
   The id-prefix convention is never consulted — a hand-created bead can violate the naming but
   can't fake the recorded link. The scoping filter does what a human operator does implicitly by
   only ever running `bd ready` against their own tree. (bd 1.2.2 omits `.parent` from `bd show`;
   the scripts read both it and the `parent-child` dependency.)
6. **Refill** — landing tasks unblocks dependents; most dispatch mid-round via step 4's graph
   readiness (or its top-up), and the loop back to step 1 remains the authority for the rest:
   beads a null top-up missed, beads whose `deps` the planner did not report, and beads with no
   mapping row yet (created mid-round), which wait for the next round's planner pass. Their
   worktrees are cut from the now-updated integration branch.
7. **Round end — detector, persisted; edge audit, conditional; neither holds the next round.**
   After the drain, the round's ledger lines are flushed and the ledger chain drained, then the
   parallelism detector line is logged and queued to the ledger (`Detector: round N — …`; a line
   that lives only in `log()` output is unrecoverable after the fact). Besides ready, topped-up,
   cap and peak in-flight it names where the time went: the merge queue's peak depth, idle slots,
   rows still waiting on deps, and any hot-file cap raised this round.
   **The coordinator acts on what it can fix cheaply, and records the rest as `slowness` items**
   (logged as `SLOWNESS:`, returned):
   - **Hot file.** A file that holds back two tasks while a slot is free gets its hot-file cap
     raised by one for the rest of the round (once per file per round).
   - **Graph-bound.** As soon as the round's graph is known, if the open rows' longest chain
     (`deps`, in JS) makes the achievable width less than half the cap, one edge audit arms at
     once — once per invocation — instead of after two under-cap rounds.
   - **Under-cap streak.** Two consecutive rounds with the dispatched frontier under the cap arm
     one audit too. Both paths share `config.edgeAuditCap`.
   - **Merge backlog.** A merge-queue peak of 3 or more is a `slowness` item (once per invocation):
     the serial lane, not the cap, is binding.
   - **Recurring blocker.** A `Recurring blocker:` cluster is a `slowness` item: one cause costing a
     triage per task.

   The **edge audit** runs in the background (`edgeAuditPrompt`, `triage` tier; Finish awaits any
   still running). `scripts/tree-shape` runs super-design's `graph-shape` over the open tree
   (review beads dropped) for the numbers and candidate edges; the coordinator derives the
   achievable width in JS; the agent judges each candidate by super-design's
   `graph-pass-prompt.md` (its checklist and its **safe** class) and returns `drop` / `narrow` /
   `repoint` changes, each marked safe or not. Every change goes to the ledger (`Edge audit: …`).
   With `config.edgeCuts: 'apply-safe'`, the safe ones go to one mechanical `edge-cuts:<k>`
   dispatch that re-checks each against the live graph and applies it (`bd dep remove`/`add`, the
   dependents' `blocked-by` lines); each outcome is an `Edge cut: … · applied | skipped` ledger
   line, and graph readiness honors the applied cuts at once (a freed row dispatches in the live
   round). Unsafe changes, and every change in a report-only run, are left for an operator as a
   `slowness` item. Depth, not the cap, is usually what binds: three audits took one run's critical
   path 16 → 11 → 9 → 8 rounds while width sat at one agent per bead in flight.

Termination is by the root epic closing, a quarantine drain, the no-progress guard tripping, or a
bounded infrastructure-outage stop (`ready-unavailable`/`plan-unavailable` — see "Null dispatch
policy") — **not** by token budget: there is no budget-based pause. Which one happened is returned
as `stopReason`, so a caller never has to infer it from the buckets.

## Workspace and ledger

This skill's `scripts/sdd-workspace` and the durable ledger it anchors exist to provide one
property: **an interrupted epic resumes from the ledger, not from coordinator memory.** A
Workflow run can be killed, restarted, or simply lose its place across a long epic; the ledger is
what lets the *next* invocation pick up exactly where the last one left off instead of
re-querying beads state and guessing. `readLedgerPrompt` / `ledgerAppendPrompt` and the
Resume-phase block in `./coordinator.js` implement it. Both reads (Resume and the Finish Metrics
re-read) echo `scripts/ledger-digest`, never the file itself: it keeps the `Merge:` lines and each
`Task` line's state tokens and drops the free text (`minor (deferred)` prose, reasons, notes), which
is most of a long ledger. A verbatim echo of a ~90 KB ledger was refused by model safeguards on
every launch once the epic grew; the digest of the same ledger is ~12 KB, and the coordinator's
parsers read it exactly as they read the raw file. Its first line, `# ledger-digest: <kept> of
<total> lines`, lets the coordinator tell an empty ledger from a lost or truncated echo: text
without that header, or with fewer lines than it counts, is an unavailable read (retried once),
never content — an empty echo once seeded 1 of 29 completions on Resume. The digest also keeps
each minor's `[class]` tag and each blocker's `[cause: …]`, from which Resume re-seeds the
recurrence counts.

- **Workspace, one per epic:** I7 fix — every epic's plan file used to be named literally
  `plan.md`, so `scripts/sdd-workspace`'s basename-derived directory
  (`.superpowers/sdd/plan/`) was the *same path for every epic in the repo*: every epic's ledger
  collided on `.superpowers/sdd/plan/progress.md`, which defeats the plan-scoping that script
  exists to provide and would make a resumed run's ledger-skip rule (below) skip a *different*
  epic's tasks entirely. The plan file is now named per epic — `<epicId>-plan.md` — giving
  `sdd-workspace`'s own basename-slug rule a distinct workspace per epic,
  `.superpowers/sdd/<epicId>-plan/`, home to that epic's `plan.md`, every task's
  brief/report/review-package files, and the ledger.
- **Which worktree owns the ledger:** the **integration worktree** (`.worktrees/<integrationBranch>`),
  never a per-task worktree. Per-task worktrees (`<integrationWorktree>/.worktrees/<integrationBranch>--task-<bead id>`,
  with any `/` in the branch name collapsed to `-` — same slash rule as the integration worktree
  derivation — on the branch named exactly `task-<bead id>`; issue #5: the path is rooted under the
  integration worktree and is absolute whenever the caller passed an absolute `integrationWorktree`,
  and the branch name is the coordinator's, because a relative path resolved against each agent's own
  cwd and an agent-chosen branch name produced two worktrees for one task and probes that could not
  find finished work)
  are where implementer/reviewer/merge agents do one task's own git/bd work and can be quarantined
  or torn down independently of every other task; the integration worktree is the one long-lived,
  single-writer location the whole epic's outcomes converge on — the serial merge gate and the
  blocker-bead path already run there (see "Serial merge-back" and "The blocker-bead path"). A
  git-ignored scratch directory like `.superpowers/sdd/` is a plain path on disk, not shared across
  worktrees the way tracked, committed files are — a task agent reading or writing the ledger from
  its own worktree would see, or produce, a second, divergent copy nothing else in the run ever
  reads. Every ledger read/append dispatch is scoped `In <integration worktree>` for exactly this
  reason.
- **Ledger:** `<workspace>/progress.md`, first line `# SDD ledger — plan: <plan file path>`,
  exactly `subagent-driven-development/SKILL.md`'s Setup contract (the coordinator's `ledgerAppendPrompt` creates this header
  on the first append to a fresh epic's ledger, since there is no separate "create the ledger"
  dispatch). Every ledger line names **both** the plan ordinal and the bead id (an unmapped id —
  see "Plan materialization" — has no ordinal and is logged as `Task ? (<bead id>): ...` instead):
  - `Task <N> (<bead id>): complete (commits <base7>..<head7>, review clean)` — merged; the task
    review found no Critical/Important issue. `<base7>` is `m.mergeBase`, the POST-rebase
    merge-base the merge agent captures, never `r.base` (the pre-rebase base the implementer's workspace setup found): after
    the rebase, `r.base..head` would include every commit other tasks merged meanwhile. `r.base`
    stays the BASE arg for `review-package`, which runs before the rebase. `short(sha)` is the
    first 7 characters.
  - `Task <N> (<bead id>): complete (commits <base7>..<head7>, fix pass)` — merged after the one
    fix pass addressed every Critical/Important finding.
  - `Task <N> (<bead id>): complete (commits <base7>..<head7>, fix pass, 1 parked — reason: <declined> — finding: <finding>)`
    — merged with findings the fix pass declined (wrong, or plan-mandated), with the fixer's
    reasons. This is the `complete` line's parked variant, not a separate line kind; resume reads
    it into `completed` and `parked`, and the final review triages it.
  - `Task <N> (<bead id>): complete (already merged into <integration branch> …)` — a re-entered
    task whose branch had already merged; the bead was closed, nothing re-reviewed.
  - `Task <N> (<bead id>): pending retry — RESOLVE: <detail>` — a blocker bead got a first-time
    RESOLVE verdict; the task gets exactly one bounded re-attempt — same-round via the RESOLVE
    retry hook when it has a mapping row, next round otherwise (see "The blocker-bead path").
  - `Task <N> (<bead id>): BLOCKED — <reason>` — the task is quarantined: triage ESCALATEd (or a
    second RESOLVE for the same id bounced into an ESCALATE), whichever trigger produced the
    blocker. `handleBlocker` writes this line once for every trigger.
  - `Task <N> (<bead id>): fix pass <FIXED | BLOCKED> (<finding>; commits <a7>..<b7>)` — written by
    `reviewAndFix` after the fix pass returns, alongside the terminal lines above. Informational
    for Metrics; resume does not use it (a restart re-runs the task from its workspace setup).
  - `Task <N> (<bead id>): minor (deferred): <one-liner>` — one per Minor/⚠️ item, written at the
    merge gate.
  - `Task <N> (<bead id>): stacked on <id>[, <id>] (dispatched at implementation-done)` — the task
    was cut on the named implemented-but-unmerged tasks (early unblock). Informational for Metrics.
  - `Task <N> (<bead id>): cancelled (parent <id> <blocked | unsettled | cancelled>)` — a task it was
    stacked on did not merge, so its attempt stopped and its worktree was discarded. Not terminal:
    resume treats a `cancelled` last line as "not started", and the task dispatches again once bd
    reports it ready.
  - Run-level lines that are not `Task` lines, so Resume and Metrics skip them: `Launch:`,
    `Detector: round N — …`, `Edge audit: round N — …` (every proposed change, marked safe or not),
    `Edge cut: <dependent> <- <blocker> · <kind> · applied | skipped (<reason>)`, `Recurring
    <kind>: …`, `Sweep: …`, and `Slowness: <signal> → <action>` (written by the watching session,
    SKILL.md's "Unattended runs").
- **Resume behavior**, on any restart: the script's Resume phase reads `<workspace>/progress.md`
  once, before the round loop starts (see `./coordinator.js`), and reconstructs `completed`,
  `parked`, and `pendingRetry` from the **last** ledger line recorded for each bead id (a split
  task whose merge never landed comes back through bd instead: its task bead is closed and its
  review bead ready, so the ready query reports it under `reviews` and it re-enters at its review
  stage — "The coordinator loop" step 1) (a bead can
  accumulate more than one line over a run's history, e.g. a `pending retry` line followed later by
  `complete` or `BLOCKED`). **Stated plainly:** after the
  relaxation described below, resume's only dispatch-gating, behavior-affecting reconstruction is
  `pendingRetry` (it seeds C-2's one-bounded-retry check). A `complete` line (with or without
  `parked`) is recorded into `completed`/`parked` for **reporting and the no-progress guard's
  baseline only** — it does not, by itself, remove the id from what gets dispatched: `bd ready` is
  the authority on whether the bead is actually closed, and if `bd close` genuinely succeeded the id
  is already absent from `bd ready`'s output; `bd ready`'s own exclusion, not this script's resume
  reconstruction, is what actually avoids redoing merged work. **The one behavioral exception to
  "reporting only":** a nonzero *resumed* `completed.size` still changes what happens at Finish —
  the opus `final-review` dispatch is gated on `completed.size` being nonzero, and Resume seeds
  that count from prior-run ledger lines before this run's own loop ever executes, so a
  re-invocation whose own rounds land zero new merges can still dispatch the whole-epic final review
  solely because an earlier run's work is recorded there. Resume does not filter the ready ids
  by `completed`: a merge that landed but whose `bd close` failed would otherwise leave the epic
  unclosable, whereas re-dispatching makes the re-run's workspace setup reuse the existing worktree
  and branch (it is idempotent), find the branch already merged, and close the bead. A `pending
  retry` line seeds `pendingRetry`, so a second RESOLVE after a restart still bounces into ESCALATE.
  **A `BLOCKED` line gates nothing:** a fixed blocker's task must be re-dispatchable on the next
  invocation, so a restart gives a previously-BLOCKED id a fresh attempt, and a still-blocked one
  is re-quarantined live after up to two wasted passes (see "Known limitations"). `escalated` means
  "quarantined in this process". A bead with no terminal ledger line re-enters the pipeline from its
  workspace setup. **One re-entry case runs nothing but a close:** when the setup finds the task
  branch already merged into the integration branch (its tip is the second parent of a merge
  there), it returns `ALREADY_MERGED` and the coordinator dispatches a close-only step instead of a
  review of an empty diff. A clean-drain re-invoke ("Escalation = notify + quarantine + continue"
  below) and a mid-flight restart converge on the same fixed point: neither permanently locks out a
  fixed id; a restart may only redo more.
- **Who writes ledger lines, and when — never on the critical path.** The success-path `Merge:`
  line and the completion line are written by the merge agent itself, inside the integration
  worktree, right after it commits the merge and closes the bead (it fills only what it measured:
  the rebase field and the commit range; it reports `ledgerAppended`). Every other line a task
  produces — its fix-pass line, minors, a parked completion line (it carries fixer free text), a
  failed merge's `Merge: … → blocker` line, its blocker outcome — is buffered per task and written
  by **one** `ledger:<id>` append when the task's chain ends; when the merge agent did not report
  writing its lines, the coordinator adds them to that flush. Run-level lines (`Launch:`,
  `Detector:`, `Edge audit:`, `Edge cut:`, `Recurring …:`, `Sweep:`) are their own appends. All appends run on
  one serialized ledger chain that no merge or chain awaits; the round end and Finish drain it, and
  per-id order is preserved. A throw inside a queued append (an unregistered dryRun stub key) is
  surfaced at the next drain — fatal under dryRun, logged live.
- **Ledger appends are retried once, then marked.** Every coordinator append goes through
  `appendLedger()`: a null dispatch is re-dispatched once, and a second null is recorded by label in
  `ledgerAppendFailed` (returned to the caller), logged as `ledger-append-failed: <label>`, and
  counted on the Finish-phase `Metrics: ledger-check` line — the prevention half of what that
  line's `M≠completed` check detects after the fact. The ledger is the only mechanism by which a
  restarted run recovers `parked` and `pendingRetry`, so a line that fails both attempts still costs
  what it always did (a `pending retry` loss resets C-2's one-retry bound on restart; a
  parked-completion loss drops the reason and the finding) — the loss is named, by label, where a
  reader and a resume both see it. **The retry elides agent-authored free text**: a harness
  classifier can refuse a dispatch for the wording it quotes (triage detail about weakened or
  deleted tests, say) before any agent spawns. Each line that interpolates triage detail, a parked
  reason/finding, a review minor, a fix-pass finding or a sweep/audit summary carries an elided
  variant that keeps the ids and the outcome token (`pending retry — RESOLVE (clarification elided
  — recorded on bead <id> …; blocker bead <bead>)`, `BLOCKED — detail elided (blocker bead <bead>;
  triage …)`, …) and drops the prose, so the second attempt cannot be refused for the first
  attempt's wording; the same shape applies to `notify`. Still open: a dispatch that *completes*
  while failing to write (a partial append, a wrong path) reports nothing the coordinator inspects.

## Per-task pipeline

Each ready bead, in its **own worktree branched from the epic integration branch**, runs:

implementer (`./implementer-prompt.md`, sonnet; its step 0 sets the workspace up and writes the
brief with `task-brief`, then it implements and runs the task-relevant tests once, pasting the
command and output into its report) → `review-package PLAN_FILE BASE
HEAD` → one task review (`./task-reviewer-prompt.md`, sonnet; spec compliance and obvious
correctness, test evidence checked, tests not re-run) → on NEEDS_FIX, one fix pass
(`./implementer-prompt.md`'s "Fix pass") → serial merge → a completion line in the ledger. A task
with open in-tree dependents is split right after its implementer's commit (early unblock, "The
coordinator loop" step 4), so its dependents start while this pipeline continues.

`task-brief` needs a `PLAN_FILE` a beads epic doesn't have on its own — the planner (opus)
produces it; see "Plan materialization". The SDD scripts are always run as
`bash <skillsRoot>/subagent-driven-development/scripts/<name>`.

Rules the dispatched agents carry, each from a measured failure:

- **The review package is built from inside the task worktree, and an empty one is INVALID, not
  clean.** `review-package … HEAD` resolves `HEAD` against the cwd; from the integration worktree
  the range is empty. The script exits 3 on an empty range, and a reviewer that gets one reports
  status `INVALID`, meaning *the review did not happen*. The coordinator re-dispatches it once; a
  second `INVALID` becomes `BLOCKED` through the ordinary blocker path, so triage sees a pipeline
  defect. `INVALID` never reaches the fix pass.
- **Bulk commands are named as forbidden in every task prompt** (`authRefusalRule`): scripted
  multi-file edits over conflicted files, rewriting a branch ref other than the task's own, and
  stopping processes by name or pattern (`pkill`, `killall`). Live runs saw each refused and
  quarantined as `BLOCKED-AUTH` although a narrow path (a per-hunk edit, reporting the state, the
  stop script) existed.
  Decided for conflicts in a shared file such as a test runner two tasks appended to: the merge
  agent resolves them hunk by hunk with file edits. The planner does not serialize beads that
  touch one test file (the hot-file cap already bounds that churn, and serializing gives up the
  width it allows), and a refused resolution is not re-implemented on the new base: the refusals
  seen live were of scripted bulk rewrites, which the narrow rule removes.
- **A permission refusal is `BLOCKED_AUTH`, not `BLOCKED`**: the narrow path is tried, then the
  agent stops and reports the refused command; no blocker bead. See Pre-flight step 5 and
  "Escalation = notify + quarantine + continue".
- **Assertion discipline and reachability** are in the implementer's and reviewer's briefs.
- **Both reviewing dispatches run a `Test changes` check** (the task review and the post-rebase
  seam review): a stat diff and a full diff of their range restricted to `config.testPaths` or,
  absent that, a built-in default pathspec list covering `tests/**`, `test/**`, `spec/**`, nested
  `**/tests/**` etc., and bare/nested `*_test.*`/`*.test.*`/`test_*.*`/`*_spec.*`/`*.spec.*`
  filename patterns (bare patterns catch a root-level `main_test.go`). A test deleted, skipped,
  loosened, or whose expected values were edited to match the implementation, with no justification
  in the brief, is Important. `Test changes: none` is valid only with the command stated; a
  diff-command error is `INVALID`.

### Plan materialization

`scripts/sdd-workspace` and `scripts/task-brief` are written against a hand-authored `PLAN_FILE`
with `## Task <N>` headings — they have no beads awareness. Critically, `scripts/task-brief`'s
heading match (`^#+[ \t]+Task[ \t]+[0-9]+`) requires the token after "Task" to **start with a
digit**: `## Task 3` matches; `## Task bd-20` does not, and `task-brief` reports "task not found."
Real bead ids are prefixed (`bd-20`, `epic.1`) — they are never bare integers — so headings must
use **sequential integer ordinals**, not bead ids. Do not "clean up" the ordinals described below
back to bead ids; they exist because of this exact regex, not by preference, and this was
verified directly against the script, not assumed.

The bridge: once per epic, a **planner (opus)** agent, running **in the integration worktree**
(see "Workspace and ledger" above — the same worktree that owns the ledger), reads the epic's
beads tree (`bd show` on the epic and its ready/blocked descendants) and writes
`<workspace>/<epicId>-plan.md` with:

1. An **ordinal ↔ bead-id mapping table** at the top — one row per task, `N` assigned in
   dependency order starting at 1, plus each task's declared `filesTouched` — the durable
   translation every downstream consumer of this file reads from, including the scheduler's
   hot-file cap described below.
2. One `## Task <N>` section per row, headed by the **ordinal**, carrying the bead's acceptance
   criteria and any Global Constraints from the epic body verbatim — the same content discipline
   `subagent-driven-development/SKILL.md` expects of a hand-written plan.

`<workspace>` is this skill's `scripts/sdd-workspace <epicId>-plan.md`; because that script
requires the file to already exist, the planner's first action on a fresh epic is to `mkdir -p`
the directory and write an initial `<epicId>-plan.md` (mapping table header, no rows yet) itself
before calling `sdd-workspace` to canonicalize the path and git-ignore it. The plan file is named
**per epic**, not literally `plan.md` — I7: every epic used to name it `plan.md`, so
`sdd-workspace`'s basename-derived workspace directory was the *same path for every epic in the
repo*, colliding every epic's ledger on one file (see "Workspace and ledger" above for the full
consequence). On refill, the planner re-runs ONLY when some ready id lacks a mapping row (the coordinator
retains the cumulative mapping across rounds and skips the dispatch otherwise — see the Plan
phase's planner-skip comment); when it does run, it appends new mapping rows and `## Task <N>`
sections for newly-ready beads — new ordinals continue the existing sequence; an already-assigned
ordinal or section is never renumbered or rewritten, since a task in flight may still be pointing at it.
**An invocation's first round plans in two steps**, so implementers do not wait for the whole tree
to be mapped: the first planner (`plan`) plans only the round's ready ids, and their tasks dispatch
as soon as it returns; a second planner (`plan-rest`) then maps every other ready or blocked
descendant beside them, appending one `## Mapping (continued)` table and its sections to the end of
the file (never rewriting what running tasks read). Its new rows merge into the mapping by id; a row
whose ordinal is already bound to another bead is dropped and planned in a later round, and its rows
whose blockers already landed dispatch from the graph at once. A task's early-unblock split waits
for `plan-rest` to return, since its dependents may not have rows before then. A null `plan-rest`
is logged and leaves the rest to later rounds' refill planning.
**Every planning dispatch also reports each open bead's dependency facts**: the planner runs
`scripts/tree-deps <epicId>` and copies its `deps` (the bead's open in-tree leaf blockers) and
`opaque` (gated by anything else — an epic-level or out-of-tree blocker, a hand claim or defer)
onto the mapping row of every bead the script lists. That is what lets the coordinator compute
mid-round readiness in JS ("The coordinator loop" step 4). A script failure leaves both off every
row, and the coordinator falls back to `bd ready` top-ups. **Review beads are never planned** (label
`sp:review`, title `review: <task id>`): they track a task that is already implemented.
**Blocker beads are never planned and never get a mapping row** (see "Resolved in this
branch": the blocker-bead-planning item): a blocker bead is an escalation record about a task — a `blocker` label and a body stating the
task id, what failed, and what was tried (see "The blocker-bead path") — not a work item, and the
planner's `bd children` tree walk has no `--parent` edge to find it by. A blocker bead reaches a
human or gets acted on exclusively through this run's escalation reporting ("Escalation = notify +
quarantine + continue") and the triage agent's RESOLVE/ESCALATE call on the **original** blocked
task, never through re-planning.

**Every downstream call uses the ordinal**: `scripts/task-brief <epicId>-plan.md <N>`, and the
brief/report/review-package filenames that follow from it. **The bead id remains the durable
identity for every `bd` command** (`bd show`, `bd close`, `bd create`) — the coordinator never
substitutes an ordinal into a `bd` call, and the ledger records both (see "Workspace and ledger"
above) so a resumed run never has to re-derive the mapping from `plan.md` alone. A stage that
needs both — the implementer's `task-brief` call reads by ordinal, while every later stage needs the
bead id — looks the id up by ordinal once and carries it forward on the result object (see the
`./coordinator.js`'s `ordinalFor` helper and the `RESULT` schema's `id`/`n` pair).

This is a one-time-per-epic (then append-only) opus dispatch, not a per-task judgment call — it
is why `planner` sits in `config.models` even though it does not appear inside the quoted
per-task pipeline sequence: it produces the artifact that sequence's first step,
`scripts/task-brief`, consumes. **Do not patch `scripts/task-brief` to accept bead ids
directly** — `subagent-driven-development` must stay byte-identical to upstream — and do not
abandon the delegation by hand-rolling briefs from the mapping table instead of calling the
script: `task-brief` still owns the awk extraction, the brief-file naming, and the "task not
found" failure signal; the mapping table only supplies the `N` it needs.

### Dispatching the implementer

One dispatch per task sets the workspace up and implements. It names `./implementer-prompt.md` by
absolute path (`<skillsRoot>/super-code/…`) and fills its parameters: task id, ordinal, brief and
report paths, worktree, branch, integration branch, and `[WORKSPACE_SETUP]` — the exact setup
commands for this attempt (fresh cut, stacked cut, re-cut after a cancellation, reuse on a restart,
or a review re-entry). The template's step 0 runs them before anything else: cut or reuse the
worktree and branch, merge any stack parents, find `base`, run `scripts/already-merged` on a reused
branch, write the brief with `task-brief`, and check that the toolchain resolves inside the
worktree. It returns before implementing with `ALREADY_MERGED` (closed by a close-only step),
`STACK_CONFLICT` (the task waits for its parents to merge) or `SETUP_FAILED` (routed to the blocker
path like any BLOCKED, the cause as its finding); a review re-entry whose branch exists returns
`IMPLEMENTED` with `base` and `head` and implements nothing. An `IMPLEMENTED` report without `base`
is treated as BLOCKED, since the review package diffs from it. The template carries the rest of the
autonomous-mode contract (unattended default reading, status tokens, test evidence, scope fence,
blocker filing, commit last). Two conventions the coordinator owns:

- **Worktree and branch:** the task's worktree is
  `<integrationWorktree>/.worktrees/<integrationBranch>--task-<bead id>` (any `/` in the branch name
  collapsed to `-`; bead id, not the plan ordinal) on the branch named exactly `task-<bead id>`,
  cut from the **epic integration branch**. Pure string derivation, the same convention as the
  integration worktree itself; dispatches state the path is never to be resolved against the
  agent's own cwd. A task dispatched on implemented-but-unmerged blockers (early unblock) is cut the
  same way and then has each blocker's branch merged in (`git merge --no-ff -m "stack: <id>"`); its
  `base` is the commit after those merges, and its implementer is told it builds on unmerged code.
  A setup that re-enters an existing stacked branch finds that base again from the newest
  first-parent `stack: ` commit.
- **Commit is the implementer's last step:** the implementer reports `head` (`git rev-parse HEAD`
  after its commit, with `git status --short` empty); a `head` equal to the `base` its setup found means
  nothing was committed, and the coordinator sends one bounded commit nudge before treating the
  task as BLOCKED with a finding that names the cause.

An implementer that cannot proceed within its own dispatch (a missing dependency, a plan
contradiction) files the blocker bead itself and reports BLOCKED with its id; the coordinator's
missing-bead fallback files one if it didn't.

## Review and fix pass

Each task gets **one** review and **at most one** fix pass; there is no re-review and no round
loop. Detailed code review is `super-roast`'s job; this review checks that the task does what its
brief asks and is safe to build on.

1. **Review** (`taskReviewPrompt`, reviewer tier): the reviewer builds the package, checks the
   implementer's reported test evidence without re-running it, writes its full review to
   `task-<N>-review.md` in the workspace, and returns `CLEAN`, `NEEDS_FIX` (with every ❌ and
   Critical/Important item in `finding`), or `INVALID`. Minor and ⚠️ items come back in `minors`
   and go to the ledger at the merge gate.
2. **Fix pass** (`fixPrompt`, implementer tier, a fresh agent), on any verdict other than `CLEAN` —
   an unrecognized verdict gets the fix pass too, never a silent merge. The fixer reads the brief,
   the report and the review file, makes the smallest change per finding, runs the tests covering
   what it changed once, appends a "Fix pass" entry to the report, and commits. It may decline a
   finding that is wrong or plan-mandated, with a technical reason; the task then merges as
   **parked** (the `complete` line's parked variant carries the reason and the finding, and the
   final review triages it). A plan-mandated conflict is a human decision, and in an autonomous run
   the final review is where the human sees it.
3. **Merge** after the fix pass (`FIXED`), with no re-review. A fixer that reports `BLOCKED` goes to
   the blocker path; `BLOCKED_AUTH` to `handleAuthRefusal`; a null fix pass is no progress this
   round, never an unfixed merge.

## Serial merge-back

In the integration worktree, for **one task at a time — exactly one merge in flight, ever** —
in completion order off the single-flight queue ("The coordinator loop" step 4; completion order
is safe because a `bd ready` batch is mutually independent by definition):

1. Update the integration branch; rebase the task branch onto it — a stacked task (early unblock)
   rebases only its own commits, `git rebase --onto <integration> <stacked base> <task branch>`,
   since its stack parents have merged their reviewed versions by then (it enqueues only after they
   did). On conflicts, the merge agent makes one bounded attempt that resolves the conflicted hunks
   only, keeping both sides' intent; it edits nothing outside those hunks.
2. **Seam check:** if the integration branch moved since the task branched *and* the sibling
   commits it moved onto touched files this task also changed, the merge agent stops before
   merging and reports the overlap. The coordinator runs **one scoped seam review** of the rebased
   branch on exactly those files (the task review approved the task against a base the branch has
   since left), dispatches at most one fix on `NEEDS_FIX` (the fixer runs the tests covering the
   overlapping files once and records them), then re-dispatches the merge as seam-cleared. No
   overlap → no extra dispatch. The seam review is an integration check, not a second task review:
   it looks only at how the task composes with what landed meanwhile. A rebase whose conflicts the
   merge agent resolved always overlaps, so the resolution itself gets this review. **A consumed
   producer counts as overlap too:** when an in-tree blocker this task depends on (not a stack
   parent, whose code it was cut on) landed after the task branched, the merge agent reports a
   `consumes <id>` entry even with no file in common, and the seam review checks the consumer
   against the interface that producer now presents. Composition defects sit in the consumers of an
   interface, not in its file, and before this only the whole-epic review ever saw them.
3. **Clean integration worktree, then a verified merge.** Before merging, `git status --porcelain
   --untracked-files=all` in the integration worktree must be empty (git-ignored files don't appear;
   projects should gitignore build artefacts rather than have them special-cased here). The one
   thing the merge agent may remove is an untracked file the merge brings in with byte-identical
   content (`git show <task branch>:<path> | cmp -s - <path>`); each removal is listed on a
   `Merge-cleanup:` ledger line. Anything else left is a merge failure: nothing is merged or
   deleted, and the remaining status lines go to the blocker bead. The merge
   (`git merge --no-ff --no-commit`) must exit 0 **and** leave a `MERGE_HEAD`; the agent reports
   both (`mergeExit`, `mergeHead`), and the coordinator fails closed on a `merged` or `check` result
   that lacks them — a refused or no-op merge is a failure, never `check pass` on an unchanged tree.
4. **Build-only merge check, no tests.** After the rebase (and any conflict resolution or seam
   fix), with the merge staged, the merge agent runs `config.mergeCheck`
   exactly as declared on the merged tree. It compiles or typechecks; it never runs tests (the
   implementer ran the task's tests; the sweep at Finish runs the full suite). No declared check →
   nothing runs. A check killed before its verdict (the agent's tool timeout, a signal) is
   `check aborted`: no result, never a failure — the merge is re-dispatched once with no fix,
   triage or blocker, and a second abort leaves the task unsettled for the next round (a slowness
   item). A killed test gate once read as a failure and escalated finished work. **A failing check
   routes to the seam machinery first**, because it is usually a
   semantic seam in a file this task did not touch (another task's test or call site still using a
   signature this task changed), which the textual merge and the same-file seam review both miss.
   The merge agent aborts and reports the error output (no bead). The coordinator dispatches one
   **merge-check fix** (implementer tier: the check command, the errors, the brief and report paths;
   it may edit whatever files the errors name, with the smallest change; adapting a call site, test
   call or fixture to the new signature is the intended case; no deleted, skipped or loosened
   assertion), then one scoped read-only **review of that fix**, then re-dispatches the merge,
   which re-runs the check. This is the task's one seam fix: if a same-file seam fix already ran for
   this merge, a failing check goes straight to the blocker path.
5. On a passing check (or none), commit the merge into the integration branch, then `bd close <id>`
   (a leaf-task close; epic closure is the separate fixpoint step in "The coordinator loop") and,
   for a split task, `bd close <review bead>` after it — first stopping the task's processes with
   `scripts/stop-run-processes <task worktree>`, so nothing a task started outlives its close. Then,
   still in the same dispatch, the merge agent removes the finished task's worktree with
   `scripts/remove-task-worktree`: it stops every process belonging to the worktree (cwd,
   executable, arguments or HOME/TMPDIR under it, and their children — test daemons, private
   servers with temp homes, a `tail -f`), then runs `git worktree remove`
   and `git branch -d`, never `--force` or `-D`, and keeps anything uncommitted or unmerged (exit
   3). A split task passes `--keep-branch`: a dependent being cut at that moment may still merge its
   branch by name, so only the worktree goes now and the Finish sweep deletes the branch. The outcome
   lines go on a `Cleanup: <id> — …` ledger line, which the Resume and Metrics parsers skip. An
   already-merged re-entry close runs the same script, and a cancelled task's discard runs it with
   `--discard` (force, because that work is abandoned by design).
6. Held, not blocked: a dirty integration worktree, or one not on its branch, is a run-wide
   condition, so the first merge that reports it (`dirty` / `detachedHead`) holds the merge lane:
   no blocker bead, no triage, a `Merge: … → held: <cause>` ledger line, no further merge or new
   task this run, and `stopReason: 'integration-blocked'` at the round boundary. One cause once cost
   six triage passes and six blocker beads when it was triaged per task.
   Blocker path: a failed / no-op merge files the bead through the
   coordinator's missing-bead fallback, with the diagnosis. Otherwise: if the conflict resolution fails, the merge agent files a blocker bead
   (label-only rule, as in every filing prompt) stating the merge-base SHA and the conflicted
   files. If the merge check still fails after its fix, or the fix reports BLOCKED, or its review
   rejects it, or the seam fix was already spent, the coordinator's missing-bead fallback files the
   bead (unless the fixer filed one) with the check command, its errors and the diagnosis. Nobody
   edits code or tests at the merge to go green.

**A `Merge:` ledger line records every merge attempt:**

```
Merge: <bead-id> — rebase <clean | conflict: N files> · seam-review <none | cleared | fixed> · check <pass | fail→fixed | fail | none>
```

with a trailing ` → blocker` on the failure path, or ` → auth-refused` when the permission layer
refused the merge agent's commands (written before the quarantine, so an unresolved rebase conflict
still counts). On success the merge agent appends it itself,
with the completion line, as the last step of its dispatch (`mergePrompt`'s LEDGER step: the
coordinator hands it both lines with `<REBASE>` and `<RANGE>` left for the values only it
measures, and leaves out the completion line for a parked task, whose line carries fixer free
text); a merge agent that does not report `ledgerAppended` gets the same lines written from its
reported fields in the task's `ledger:<id>` flush. The failure-path line always goes in that
flush, before the blocker outcome. It is raw rather than built by `ledgerLine()` (that helper's
`Task <N> (<id>):` prefix names a task outcome; this line names a merge attempt). `rebase` is the merge agent's `rebaseConflictFiles`
report (0 → `clean`); `seam-review` is `none` unless step 2 ran (`cleared` when it came back CLEAN,
`fixed` when its one fix ran); a merge that removed byte-identical untracked copies first adds a
`Merge-cleanup: <id> — removed … : <paths>` line in the same dispatch; `check` is the merge check's result: `pass`, `fail→fixed` (failed, the
merge-check fix and its review passed, the re-run passed), `fail` (failed and went to the blocker
path), or `none` (no check declared, or the attempt failed before reaching it). A merge the
coordinator rejects after its agent reported writing success lines (missing merge evidence, a
missing commit range) is logged; the blocker-path line that follows supersedes them on resume, and
Metrics' `ledger-check` shows the gap.

## The blocker-bead path (the escalation currency)

Anything that cannot proceed becomes a beads issue, never a silent retry and never a hard stop:

- **Triggers:** an implementer or fixer that cannot proceed within its dispatch (it files the
  bead itself), a merge whose conflict resolution fails (the merge agent files the bead), a
  review package invalid twice or an uncommitted implementer (the coordinator's missing-bead
  fallback files it with the diagnosed cause), or the planner leaving a ready id unmapped
  (`unplannedBlockerPrompt`, carrying the planner's `missingDecision`).
- **Not a trigger: a harness permission refusal** (issue #3 defect 3). A refused command never
  executed and no agent can lift the refusal, so a bead about it only spends a triage pass to
  learn that (measured: the same blocker re-filed four times across two invocations). The agent
  reports `BLOCKED_AUTH` instead; `handleAuthRefusal` logs, quarantines the task for this run,
  and continues — no bead, no triage. Nor is a second `INVALID` review package a trigger in its
  own right: it becomes an ordinary `BLOCKED` (the missing-bead fallback files the bead), because
  there a triage agent genuinely has something to decide.
- **Bead shape:** a `bd create` with **the `blocker` label and NOTHING else — no `sp:` label, no
  `--parent`, no other label** — body stating the task id, what failed, and what was tried.
  Confirm flags with `bd create --help`. The label-only rule is what keeps a blocker bead
  unreachable as work: the ready query excludes it by label (`--exclude-label blocker`, both the
  fast path and the fallback — see `scripts/ready-in-tree`) and the planner's `bd children` walk can't find
  it without a parent edge. Both halves failed live before this rule was enforced in the filing
  prompts: filing agents added an `sp:` label **and** a `--parent`, the ready query (which did not
  exclude the label) dispatched the blocker bead as work, the planner correctly refused to map it,
  `unplannedBlockerPrompt` then filed a blocker bead ABOUT the blocker bead, and triage ran — one
  new bead per round, indefinitely (reproduced live: durak-9rj → durak-hgr.18). Belt and
  suspenders, deliberately: the query-side exclusion alone survives a non-compliant filing agent,
  and the label-only filing alone survives a query that loses its flag — either regression alone
  no longer loops.
- **Triage (opus):** the coordinator dispatches the triage agent (`./triage-prompt.md`) with the
  blocker bead + the task's plan-file section + the epic's spec (the epic bead body via
  `bd show <epicId>`, plus any design doc it references). It returns exactly one of:
  - `RESOLVE: <clarification>` → the clarification is recorded on the bead (`bd comment`; the
    implement dispatch tells every implementer to read `bd comments <id>` as binding context) and
    the task is re-dispatched — **in the same round** when it has a mapping row (the RESOLVE
    retry hook in `./coordinator.js`), next round otherwise. Use only when the answer is genuinely derivable from the
    existing plan/beads. **Bounded to one retry per id** (`pendingRetry`, tracked in
    `handleBlocker`): if the *same* id triggers the blocker-bead path again after a RESOLVE — the
    clarification didn't fix it — the second occurrence is treated as `ESCALATE` regardless of
    what this round's triage verdict says, so a bad clarification can spin at most one extra round
    before it quarantines, never indefinitely. This also closes I6: an id parked in `escalated`
    permanently is filtered out of every future `bd ready` batch and guarantees the round-based
    no-progress guard sees real termination, where an unbounded RESOLVE would not.
  - `RESOLVE` with `waitFor: <bead>` → the task needs that in-tree bead to land first, not a
    clarification. The coordinator adds the edge (below), writes `waiting on <bead>` to the ledger,
    and holds the task until the bead lands; the one-retry budget is not spent. Before this, a
    correct "re-dispatch only after X merges" was re-dispatched at once, blocked again, and the
    one-retry bound quarantined it.
  - `ESCALATE: <summary + decision needed>` → escalation (below).

**Added edges.** A dependency the bead graph lacks — a planner's `missingEdges` entry, or a triage
`waitFor` — is honored in memory the moment it is reported: the dependent is held out of every
dispatch path (round head, `bd ready` top-up) until its blocker merges, then graph readiness
releases it. A background `edge-add:<k>` dispatch writes it to bd (`bd dep add` plus a
`blocked-by` line, after checking both beads are open), an `Edge add: <dependent> <- <blocker>
(<source>) — <reason>` line goes to the ledger, and Finish awaits the writes. Adding an edge counts
as progress for the no-progress guard.

**Edge-audit memory.** An edge an audit judged not safe is not judged again: each audit reads the
ledger's earlier `Edge audit:` lines and is handed this run's own unsafe verdicts, and returns such
an edge only when one of its beads' text changed in a way that bears on the reason. The same edge
was otherwise re-judged "safe no" on every launch. The safe class itself stays as super-design's
graph pass defines it: a wait on a name the spec fixes (a heading, a key) is not safe to cut, since
a rename during implementation would surface only at the end.

## Escalation = notify + quarantine + continue

On `ESCALATE`, the run **does not freeze**:

1. **Notify** the user immediately. From a background workflow, prefer a dispatched notify agent
   (if `PushNotification` / an MCP messaging tool is available) and always `log()` the escalation
   so it surfaces in `/workflows` and the completion notification.
2. **Quarantine** — leave the blocker bead open. The blocked task stays open, and its dependents
   remain unready in beads automatically, so they are skipped without extra bookkeeping.
3. **Continue** — keep driving every other ready task to completion.

When the ready set finally drains, the run ends and reports: tasks completed, quarantined
subtrees (`escalated`), and tasks mid-retry (`pendingRetry` — RESOLVEd once, not yet re-completed
or re-blocked; see the bounded-retry note above). The user resolves the blockers and **re-invokes
the coordinator**, which picks up the now-ready work — this is now actually true of the code, not
just this paragraph's prose (fix-round-1, review): the Resume phase no longer reconstructs
`escalated` from the ledger's `BLOCKED` lines (see "Resume behavior" under "Workspace and ledger"),
so a fixed blocker's task is no longer permanently filtered out of every future `bd ready` batch.

**`BLOCKED-AUTH` is quarantine without escalation** (issue #3 defect 3, decided policy: work
around once, then accept the loss). A task whose agent was refused by the permission layer — the
command and its narrow path both declined, nothing executed — is settled into
`escalated` for this run (its dependents stay unready), gets a `BLOCKED-AUTH — permission
refused, coverage lost this run: <command>` ledger line and a loud log line, and is listed in the
return value's `authRefused`. No blocker bead, no triage, no notification: there is no judgment
to make and nobody to make it. The run continues with everything else. Resume treats the line
as a historical `BLOCKED`, so once the operation class is granted (Pre-flight step 5) the next
invocation simply re-attempts the task. A caller's report lists these ids as **untested scope**,
never as findings and never as done.

## Finish

After the final review and the bucket reconciliation, one mechanical `worktree-sweep` dispatch
runs `scripts/remove-task-worktree --sweep` over every task worktree still under the integration
worktree's `.worktrees/` (the backstop for anything the per-task cleanup missed), plus `git branch -d`
on split tasks' kept branches. It keeps anything uncommitted or unmerged, never forces, and its
`kept:` lines are returned as `worktreesKept`. The same dispatch then runs the final process
sweep, `scripts/stop-run-processes` over the task-worktree root, the run temp root and any
`processRoots`, appends a `Process sweep: <N> stopped · <M> survived` ledger line, and its lines
are returned as `processSweep` (`stopped`, `survived`). It runs whoever owns the finish, because
task worktrees and the processes started in them are this skill's, not the caller's.

When the loop ends (and at least some work landed), run the sweep (below), then dispatch the
**final whole-epic review (opus)** against the integration branch. It is report-only, reviews the
branch diff against the epic's spec on its own terms first, and only then reads the ledger's
deferred minors, parked lines, recurring clusters, `BLOCKED-AUTH` lines and the sweep result. What
happens after that review is **conditional on who owns the finish hand-off**. By default, hand off
to `superpowers:finishing-a-development-branch`, which merges the integration branch into the
user's base branch and cleans up the integration worktree. **When the caller owns the finish**
(e.g. `super-auto`, which still needs this run's ledger and per-task reports after this loop ends),
the coordinator returns its buckets (`completed`, `escalated`, `pendingRetry`, `parked`, `stalled`,
`review`, plus `stopReason` and `slowness` — the slowness signals it noticed and what it did about
each) to the caller and stops, leaving the integration worktree, its branch,
and its ledger intact. **Deferred minors reach the final reviewer through the ledger.** The task
review reports Minor and ⚠️ items in `RESULT.minors`, and the merge gate writes one
`Task <N> (<id>): minor (deferred): <one-liner>` line per item, in the task's one ledger flush. They
are written at the merge gate, alongside `parked`, because a minor on a task that never merges is
part of a blocked task's open state, which the blocker path already carries.
**Recurring minors are clustered, run-wide** (issue #3 defect 2): the coordinator normalises each
minor's text (numbers, hashes, paths, quoting stripped) into a signature and counts it across
tasks; a signature seen ≥5 times or on ≥3 distinct tasks is reported once — a `Recurring minor:
×N across M task(s) — <sample>` ledger line and a `RECURRING MINOR` log line — and the Finish
reviewer is told to triage those lines *first* and name the class. Measured: 1,335 individually
correct deferrals on one run hid a single line recurring ~40 times — the pipeline reporting its
own empty-review-package defect once per merge, never heard — and ~30 unfalsifiable-assertion
findings that nobody owned as a class; per-epic triage would not have surfaced either, since the
distribution was even across nine sub-epics. The key is the reviewer's `[class]` tag on each minor
(two to four task-independent words, `./task-reviewer-prompt.md`), else the normalised text:
free-text matching never clustered one class worded five ways ("full suite not run",
"whole-suite tests not run", …) on a run where it hit seven tasks. The counts survive relaunches:
minors and pending-retry/BLOCKED lines carry their tag on the ledger, and Resume seeds the clusters
from them.
**Blocker entries feed the same detector** (issue #5 defect 7): every triaged blocker — RESOLVE or
ESCALATE — is counted under the triage agent's `cause` (a short root-cause phrase the TRIAGE schema
now carries; `detail` is the fallback), in its own `blocker:` namespace with the same threshold,
reported as a `Recurring blocker:` line. Measured: six false-premise blockers across four tasks on
one run (the implementer looking the report up under the bead id instead of the plan ordinal;
finished work left uncommitted) were each RESOLVEd correctly and never counted, because the
detector only saw review minors.

**The sweep runs here, once, before the final review — mandatory whenever work landed, unless the
caller set `deferSweep`** (then no sweep dispatches, the final reviewer is told it was deferred, and
`sweep` returns `SWEEP DEFERRED (caller-owned)`). It runs
`config.sweep` exactly as declared, or, undeclared, the project's full test command under the
project's execution envelope. Its one-line summary starts with the tip SHA it measured (or reads
`MEASUREMENT INVALID: <cause>`), is appended to the ledger as a `Sweep:` line, returned as `sweep`,
and handed to the final reviewer as the branch's only full-suite measurement. **The sweep measures
the landed subset:** an escalated or pending-retry leaf's code is not in the tip, so the summary
names those ids as `not in this measurement` — a green sweep is evidence for what merged, never for
the epic.

**Metrics: a run-wide tally, written right before the final review, unconditionally.** One
mechanical dispatch re-reads the ledger fresh (this run's own appends since Resume's one-time read
are not in that variable); the script computes four lines from it and one `ledgerAppendPrompt`
dispatch appends them, in this order:

```
Metrics: merges M · merge-failed Mf · rebase-conflicts C · seam-reviews S (fixed F) · check-fails G (fixed H)
Metrics: completions — review clean A · after fix pass B · parked P · re-entry closes R · dispatched early E · cancelled K
Metrics: fix-pass — entered E · FIXED X · BLOCKED Y
Metrics: ledger-check <ok | landed≠completed: L vs N — <likeliest cause> | METRICS INVALID — …> · append-failed K · append-retried J
```

Stub keys: `read-ledger:finish` and `ledger-append:metrics`. It runs even on a run that merged
nothing. A null re-read (after its one retry) writes `Metrics: UNAVAILABLE …` lines instead of
zero counts, each carrying this invocation's own buckets, labelled `this invocation only`.

- `M` counts success-path `Merge:` lines (no trailing marker); `Mf` counts the ` → blocker` and
  ` → auth-refused` lines. `C`, `S`, `F` come from `Merge:` lines on both paths; `G` counts lines whose check failed
  at least once (`fail` and `fail→fixed`), `H` the `fail→fixed` ones.
- `A`/`B`/`P`/`R` count `complete` lines by variant: `review clean`, `fix pass` (parked included),
  `parked`, `already merged`. `E` counts `stacked on` lines (tasks dispatched on an unmerged
  parent), `K` counts `cancelled` lines (stacked attempts stopped because a parent did not merge).
- `E`/`X`/`Y` count `fix pass` lines, all of them (a retried task's second fix pass is a real
  dispatch).
- `ledger-check` cross-checks the ids the ledger shows landed — success-path `Merge:` lines plus
  re-entry closes, which land without a `Merge:` line — against the in-memory `completed.size`,
  rather than treating the lossy ledger as authoritative. A mismatch names its likeliest cause: a
  failed append, a completion settled without its line, an incomplete Resume read (the ledger shows
  more), or — no landing lines at all while tasks completed — a failed reader, written `METRICS
  INVALID` because every count on the block is then wrong. Before this split, every legitimate
  re-entry close read as a mismatch.

The return carries `metrics`, the same four strings.

**Friction capture is the invoking session's job, not the Workflow script's.** The Workflow script
itself cannot write files — it has no I/O (see "Key constraint: the script does no I/O") — so it
cannot append to a friction log no matter how interesting an event is. In Workflow-coordinated
runs, the INVOKING session is the one with a filesystem: it watches the coordinator's own log
output and appends what it sees to the run's friction log — NULL-dispatch log lines, STALLED /
stall-guard events, null-retry rounds, detector-line anomalies (peak in-flight far below the
concurrency cap, exhausted top-up query budgets), and any `stopReason` other than `root-closed`.
The detector lines themselves no longer depend on that capture: every completed round appends
its own `Detector: round N — …` line to the ledger (issue #3 defect 6), so the analysis pass
reads them from the worktree. **Enumerate what should be there, not only what is:** a ledger
with `complete` lines for round N but no `Detector: round N` line means the round's parallelism
is *unmeasured*, and the friction log should say so — "absent" reads as clean, "missing" does not.
When that same invoking session owns the finish (§Finish above, "when the caller owns the finish"
does not apply — this is the default-finish case), it runs `superpowers:upstream-feedback` **before**
merging and deleting the integration worktree, since the worktree's ledger and per-task reports are
inputs the analysis pass needs and cannot recover once they are gone.
Context compaction handles long runs: keep watching until the Workflow returns rather than wrapping
up as context fills. Friction entries already written to the log survive compaction.

## Local adaptations (porting the script to a project)

A project run typically adapts `./coordinator.js` — extra reporters, project gates, tuned prompts.
Rules from measured adaptations (a 198-bead run, issue #2; its second half, issue #3; a 100-bead
training-preflight run, issue #4), for the adapting session:

- **Write targets in any dispatch you compose go inside the task's own worktree.** Give a
  write-capable task agent the paths it should WRITE (code, evidence, reports, scratch) relative to
  its task worktree, or as absolute paths inside it; the only other write targets are the
  git-ignored plan-workspace files the script names. An integration-worktree absolute path may
  appear in a task dispatch only as a read-only reference, labelled as such (the script's
  `writeFence()` does this). An agent told to write "under ${RUN}/…" with RUN the integration
  worktree writes untracked files there, and the next `git merge` refuses — every later task then
  fails at the merge's clean check. Keep build artefacts gitignored; the clean check does not
  special-case them.

- **A measurement of record needs a validity floor.** Any reporter you add whose numbers feed
  decisions (bisect candidates, baselines, round gates) must assert its own sample validity
  before printing a counts line: collected/sampled count checked against the recorded baseline or
  the previous round, and `MEASUREMENT INVALID: <cause>` emitted instead of counts when the check
  fails. Measured live: a full-suite reporter printed `0 passed / 1 failed` for ten straight
  rounds against a ~7,900-test suite — a collection error, not a result — and nothing compared it
  to the recorded 4,425-pass baseline; a run collecting ~0.01% of the suite is worse than no
  measurement because it is indistinguishable from a green one. For pytest-family suites, pass
  `--continue-on-collection-errors` and carry the collection-error count as a first-class field.
- **Port upstream's hunks; don't rebuild and re-graft.** When the script advances under a
  live adaptation, compare sizes before choosing a direction: the script's delta (hunks
  changed) versus your local adaptations' line count. Measured live: script delta 13 hunks
  (+224/−34) against local adaptations rewriting ~80% of a 1,479-line base — the targeted hunk
  port reached the identical end state with ~5× less transcription and left the live-validated
  remainder byte-identical, provable by diff. Rebuild-and-re-graft is the worse path whenever
  the adaptation outweighs the delta.
- **Stamp the adaptation with its script source.** Record the plugin tag this script was
  ported from as a logged constant next to the launch log line (e.g.
  `log('coordinator script: <tag>')`). The installed plugin cache can lag the marketplace repo
  (measured: cache at one version while the repo had advanced seven) — the stamp dates every
  journal against the code that actually ran, making cache-vs-repo skew visible instead of
  inferred.
- **Read dependency edges from the bulk dump only.** `bd show --json`'s dependencies field
  underreports blocking edges (verified bd 1.0.5: per-bead `show` returned no usable edges where
  `bd list --json` did) — a `(none)` from `show` is not evidence of absence. Any adaptation that
  reasons about the graph reads edges from `bd list --json`.
- **A gate that diffs failing sets needs a known-red artifact and a merge-base stamp** (issue #3
  defects 4 and 5). The script runs no per-merge gate; an adaptation that adds one and compares
  the branch's failing node ids against the merge-base's must also carry (a) a run-scoped
  `expected-failures` artifact of `{node id, owning bead, ruling}` for tests left red *by
  ruling* — the gate reports such an id as `known-red (bead X)` rather than blocking, and
  **errors when the owning bead closes while the entry remains** (never a general mute); and
  (b) the merge-base SHA on every gate verdict and every blocker it files, with the merge-base
  failing set measured once per run into an artifact rather than assumed. Measured: a test red
  by ruling was recorded only in a commit message and bead comments, so a fresh agent re-derived
  the whole analysis within the hour and filed a blocker against a merge-base already
  superseded; separately, the recorded standing baseline understated the true one by one
  failure — the branch had fixed a test nobody knew was failing — until a late ad-hoc check ran
  the file at the merge-base.
- **Concurrent test runs need disjoint, pre-created, disk-backed scratch directories** (issue #4
  defect 2). A generated test command that shares a scratch root across concurrent shards, or
  points at a nested path whose parent does not exist, fails in ways that look like product
  defects: measured — 22 setup errors after 555 passes from a missing `--basetemp` parent;
  timeouts and vanishing fixtures from two shards reusing one `.test-tmp`; false failures from a
  worktree-local scratch root that changed an authenticated-path fixture's geometry. Allocate
  one unique scratch directory per command or shard, outside the source root, and never run two
  collision-sensitive selections against the same one.
- **A long reporter must publish incrementally or be sharded** (issue #4 defect 4). A single
  process that finalizes its report only at exit leaves *nothing* when it is terminated at 84%
  or hangs on one node for 16 minutes (both measured). Bound reporters into shards whose partial
  results persist as they complete, and make an incomplete run report its node accounting as
  explicitly incomplete — the same validity floor as the first bullet, applied to duration.
- **Expensive once-per-branch reporters run after the final adversarial review, against the SHA
  that lands** (issue #4 defects 7 and 8). A reporter started after the last merge but before
  the whole-branch roast measures a tree that may not land: measured, one was stopped mid-run
  because the roast then found Blocking defects. Order: final roast → fix → sweep/reporter,
  stamp every reporter result with the tip SHA it ran against, and treat a stamp that no longer
  matches the branch tip as invalid rather than stale-but-fine. When the branch does not land
  alone (a prerequisite branch lands with it), materialise the combined candidate tree first —
  measured: two independently reviewed branches produced 13 conflicts plus dead tests and stale
  runbook policy from *clean* auto-merges — review the conflicts and the relevant clean merges,
  and run the sweep against that exact SHA.

## Known limitations

This section lists what ships **unfixed**, by decision. A future maintainer should read it before
assuming any of these already work. Resolved items are not listed here — they moved to "Resolved in
this branch" below, which exists for a narrower reason: each one was a place where the prose said
something the code did not do, and the risk a maintainer reintroduces it outlives the correction.

1. **Duplicate blocker beads on restart.** Every blocker-path entry does a `bd create` with a
   `blocker` label and no dedup against an existing open bead for the same task, so each
   re-invocation of a still-stuck task files a fresh bead and re-notifies. The clean fix is not
   deduplication — it is not creating a second artifact at all: annotate the blocked task in place
   (`bd note <id>` to append why it is stuck, `bd update <id> -t decision` to drop it out of
   `bd ready --exclude-type=epic,decision` until it gets another design pass). Verified available
   in `bd`; **designed, not yet implemented.** Until it is, a restart can leave several open beads
   pointing at one stuck task.
2. **Restart still costs up to two wasted pipeline passes on a still-blocked id.** `pendingRetry`
   is reconstructed only from a `pending retry` ledger line, never from a `BLOCKED` one, so the
   first blocker-path visit of a new run for an id whose last line was `BLOCKED` is treated as a
   first-time RESOLVE candidate even though it already got a full triage verdict in the prior run.
   Seeding `pendingRetry` from `BLOCKED` lines would fix it; not attempted here because the same
   restart path is being reworked by the blocked-task redesign (item 1).
3. **`ALREADY_MERGED` is relayed by an agent, not computed by the coordinator.** The check is
   `scripts/already-merged` (git only: the branch tip is the second parent of a merge on the
   integration branch); the coordinator cannot run git itself. A relayed false positive did close
   a headline bead with no work done on a live run, so the close-only dispatch now re-runs the
   script before `bd close` and closes nothing when it does not print true, and a review re-entry
   whose branch has no commits past the integration branch trusts only the script (else
   `SETUP_FAILED`). Two agents would have to misreport the same git fact for a false close. The
   same holds for `base`, which only the setup can find; a base that is not a hex commit id reaches
   the reviewer as `UNVERIFIED`, and its BASE CHECK recomputes it.
4. **A cancelled stacked task's work is discarded, not salvaged.** When a stack parent does not
   merge, every task stacked on it loses its worktree and re-implements from scratch on the
   parent's next attempt — even when the parent's eventual fix would not have touched what the
   dependent built on. The cost is bounded by how often a parent fails after implementation; the
   alternative (rebasing a dependent across a parent's rewrite) moves the risk into the merge agent.
5. **The dependency graph is read once per planning dispatch.** `deps`/`opaque` come from
   `scripts/tree-deps` when the planner runs; an edge a human adds mid-run is invisible to
   `readyFromGraph()` until the next planning round. Graph dispatch only fires for a row whose last
   blocker landed this round, so a row bd already refused at the round head is never dispatched on
   graph state alone, but a new mid-round edge into a row JS considers satisfied is missed until
   the next planning round re-reads the graph.

## Positions on proposals not adopted

- **The final review's must-fix items are not filed as beads by super-code.** The final review is
  report-only; a caller that owns a fix loop (super-auto phase 5) consumes them. A standalone run
  hands them to the human with the finish menu.
- **No exclusive file ownership.** `hotFileCap` stays a count. Ordering two beads that rewrite one
  file's body goes through the dependency graph (`missingEdges`, a triage `waitFor`, or the design's
  own edge), not a per-file lock.
- **Deferred minors stay minors.** No new severity floor: the reviewer rubric already grades a
  weakened or skipped test Important and data loss Critical, with explicit examples; a minor that
  names one is a misclassification the final review is told to look for. Minors are tagged by
  class (for recurrence), handed to a later task whose files they name, and counted in the report.
- **Deferred and operational work stays out of the tree.** The tree stops at merge-ready work
  (super-design §Decomposition); holds go behind gate beads (super-auto). super-code drains what is
  in the tree and has no notion of a deferred child.

## What autonomous mode changes (summary)

super-code runs its own per-task pipeline (one light review, at most one fix pass, no per-merge
tests beyond a build-only merged-tree check, a full-suite sweep at Finish) with prompts it owns, on top of SDD's brief, review-package
and workspace scripts. Kept from this skill's predecessor:

- Per-task worktrees branched off the **epic integration branch** (not off `main` and not off a
  local plan-file branch).
- **Single-flight merge-back in completion order**, exactly one merge in flight ever, enqueued
  per task the instant its chain ends — never concurrent merges, and never a round barrier.
- The **blocker-bead escalation path** — notify, quarantine, continue — that lets a Workflow run
  survive a stuck task instead of freezing, because autonomous mode has no synchronous human
  partner to stop for.

## The coordinator script

**Canonical, not illustrative:** `./coordinator.js` is the executable Workflow script every dryRun
baseline in this document was recorded against, and the one the coordinator launches
(`Workflow({scriptPath: '<copy>/coordinator.js', args})` on a scratchpad copy — see Pre-flight step 4). Adapt names/prompts to
the epic; the structure is not a sketch. Every `agent()` call carries the real I/O; the script only
sequences. Model and effort are set per role from `config.models` / `config.efforts`.

> The Workflow tool's built-in `isolation:'worktree'` is **not** used here: it branches from the
> repo's current HEAD (not our integration branch) and auto-removes worktrees that end up
> unchanged. We need worktrees cut from the integration branch with controlled merge-back, so the
> agents create and merge worktrees explicitly (per `superpowers:using-git-worktrees`).

## dryRun policy

`dryRun: true` swaps every dispatched agent for a haiku stub returning canned JSON, validating
the **script's topology** — round sequencing, the sliding-window scheduler/concurrency cap, the
serial merge gate, the blocker-triage routing, schemas — for pennies, without spending real
planner/implementer/reviewer/triage budget and without touching git or `bd` (see the `pick()`
helper and the `model()` dryRun branch in `./coordinator.js`; same mechanism as `super-roast`'s
`pick()`, see `skills/super-roast/super-roast-workflow.md`).

**Revision history of these baselines.** Every row below is a superseded run, kept as a one-line
record because this document's own rule ("a recorded baseline is evidence only for the exact script
revision it ran against") makes the *sequence* meaningful: each structural edit forced a full re-run,
and every re-run landed on the same three counts, which is why an unexpected count is a signal. The
narratives that used to accompany each row are in git history; nothing here depends on them.

| Script revision | canonical | cap-tripping | PARK |
|---|---|---|---|
| through Task 4 | `wf_ddba38c0-72d` 26/0 | `wf_e189dd5a-a5f` 22/0 | `wf_058c4b83-631` 21/0 |
| post-Task-5 (ledger, concurrency, per-epic workspace) | `wf_b337b535-bd4` 31/0 | `wf_453a6604-52e` 24/0 | `wf_941e256b-10b` 23/0 |
| post-fix-round-2 (divergence-guard predicate) | `wf_fc56493c-a69` 31/0 | `wf_18710e4f-50a` 24/0 | `wf_1e32bcd1-71f` 23/0 |
| final fix round (brief idempotence, merge-base) | `wf_ea0a2284-96b` 31/0 | `wf_3c881af8-70b` 24/0 | `wf_ac3e6fae-171` 23/0 |
| scope fix | `wf_cb63ecb9-492` 31/0 | `wf_caf8953e-374` 24/0 | `wf_f18d307b-83e` 23/0 |
| limitations fix (Sets, guard, minors, merge range) | `wf_97164f71-a3c` 32/0 | `wf_527ad491-790` 24/0 | `wf_4203efd4-84d` 23/0 |
| live-run fixes (null-dispatch guard, stopReason, reviewer file plumbing, blocker exclusion, integrationWorktree) | replay 32/0 | replay 24/0 | replay 23/0 |
| relax-sequencing (sliding-window scheduler + hot-file cap, single-flight completion-order merge queue, parallelism detector) | replay 32/0 | replay 24/0 | replay 23/0 |
| mid-round top-up (inter-round barrier removal: ready re-query per successful merge, quiescence loop) | replay 34/0 | replay 24/0 | replay 24/0 |
| top-up corrections (per-round query cap `topUpQueryCap`, frontier hint keyed on dispatched not planned, logged unmapped skips) | replay 34/0 | replay 24/0 | replay 24/0 |
| round-head parallelism (planner skip on fully-mapped rounds, Close∥Ready + post-closure re-check, same-round RESOLVE retry + `bd comments` clarification plumbing) | replay 40/0 | replay 24/0 | replay 24/0 |
| issue #2 batch (ready-query `--limit` + truncation rule, top-up epic-close phase, `ledger-append:launch` args record) | replay 41/0 | replay 25/0 | replay 25/0 |
| issue #3/#4 batch (`ledger-append:detector` per round; INVALID review packages; `BLOCKED_AUTH`; recurring-minor clusters; conditional edge audit; declared `gate`/`sweep`; post-rebase seam review) | replay 42/0 | replay 26/0 | replay 26/0 |
| Task 3 (per-merge `Merge:` ledger line, success and blocker-bead failure paths) | replay 45/0 | replay 26/0 | replay 27/0 |
| Tasks 4–6 (per-round fix-loop line, `Test changes` block, Finish `Metrics:` block) | replay 51/0 | replay 36/0 | replay 37/0 |
| issue #5 defects 1–6 (coordinator-owned identities: absolute task worktree + pinned branch + id re-stamp; already-merged short-circuit; commit nudge; blocker-bead close; Finish bucket reconciliation) | replay 52/0 | replay 37/0 | replay 37/0 |
| issue #5 defects 7–9 (`appendLedger` retry-then-mark; elided retries for free-text lines and `notify`; `noteRecurrence` over minors AND triaged blockers via TRIAGE `cause`) | replay 52/0 | replay 37/0 | replay 37/0 |
| D4 loop (one review, one fix pass, no re-review/round cap/adjudicator, no per-merge tests (build-only `mergeCheck`), mandatory sweep with `deferSweep` opt-out, batched ledger appends, `skillsRoot`); columns 2–3 are now fix-pass-blocked / parked | replay 50/0 | replay 19/0 | replay 22/0 |
| Off-critical-path batch (blocker handling and already-merged closes off the merge queue; merge agent writes its own success ledger lines; one `ledger:<id>` flush per task chain on a ledger chain nothing awaits; `runtimeSlots` cap; per-role `effort`; background edge audit and unawaited detector append; no unplanned-filing barrier) | replay 44/0 | replay 18/0 | replay 20/0 |
| Early unblock + graph readiness (planner `deps`/`opaque` rows from `scripts/tree-deps`; `readyFromGraph()` replaces the per-merge `bd ready` top-up wherever JS can see readiness; split at implementation-done via `scripts/review-bead`; stacked dependents with merge ordering and cancellation; review-bead re-entry on resume); the canonical scenario gains `bd-105`, stacked on `bd-102` | replay 48/0 | replay 18/0 | replay 20/0 |
| Proactive slowness (hot-file cap raised for a file holding back two tasks with a slot free; graph-bound early edge-audit arming; merge-queue peak, idle slots and waiting rows on the detector line; act-capable edge audit over `scripts/tree-shape` + super-design's graph-pass rules, applying safe cuts under `config.edgeCuts: 'apply-safe'`; `slowness` return field) | replay 48/0 | replay 18/0 | replay 20/0 |
| **Script in `./coordinator.js` (comments trimmed, history to `./MAINTENANCE.md`); round-1 planning split (`plan` for the ready ids, `plan-rest` for the rest of the tree beside them); workspace setup folded into the implementer (no `brief:<id>` dispatch; `SETUP_FAILED` / `ALREADY_MERGED` / `STACK_CONFLICT` early returns) | replay 43/0 | replay 18/0 | replay 20/0 |
| **Task-worktree cleanup (merge agent runs `scripts/remove-task-worktree` after the merge and bead close — processes stopped, `git worktree remove` + `git branch -d`, never forced, `--keep-branch` for split tasks; close-only re-entries clean up too; discards go through `--discard`; Finish `worktree-sweep` backstop returning `worktreesKept`)** | replay 44/0 | replay 19/0 | replay 21/0 |
| **Process cleanup (scripts/stop-run-processes: cwd, executable or exact HOME=/TMPDIR= under a run root, orphan argument paths, no kinship expansion, interactive terminals kept, epic/integration roots refused; task temp state in a short `/tmp/sp-<hash>/<task id>` root, removed with the worktree (`remove-task-worktree --tmp`); implementer/fixer leak check after test runs; processes stopped before a task's bead closes; the Finish `worktree-sweep` dispatch also runs the final process sweep and writes the `Process sweep:` ledger line, returning `processSweep`) — CURRENT** | **replay 44/0** | **replay 19/0** | **replay 21/0** |

The current row's figures come from the offline replay harness (`tests/super-code/`): it replays
the three `args` blocks below and runs the live-sim, null-injection, parallelism, seam,
merge-check, sweep, Metrics, off-queue, ledger-batching, effort, runtime-slot and early-unblock
scenarios against this script (0 failures). Every fixture gains one `worktree-sweep` dispatch at Finish (43 → 44, 18 → 19, 20 → 21); per-task cleanup rides the merge dispatch and adds none. Before that, canonical 48 → 43: every task's separate brief
dispatch is gone (−6, counting bd-104's retry) and round 1 adds the `plan-rest` planner (+1); the
other two fixtures trade one brief for one `plan-rest` and keep their counts. Before that, 44 → 48: its mapping now carries `deps`
rows, so the two per-merge `bd-ready-topup` dispatches are gone (−2), and the new `bd-105` (stacked
on `bd-102`) adds `review-bead:bd-102`, its own brief, implement, review and merge, and one
`ledger:bd-105` flush for its `stacked on` line (+6). The other two fixtures carry no `deps` rows,
so they keep the per-merge top-up and their counts. The off-critical-path row's drop from the D4
row is all ledger traffic: canonical 50 → 44 (ten per-line appends become four per-task flushes —
`bd-102`'s merge agent wrote both of its lines, so it needs none), fix-pass-blocked 19 → 18,
parked 22 → 20. Every paragraph below that
describes fix rounds, the round cap, re-review, the adjudicator, a per-merge gate, or one ledger
dispatch per line describes a superseded revision.

The issue #3/#4 row's +1 on every scenario is exactly the persisted detector line — one
`ledger-append:detector` per round that reaches the drain (each scenario's second round exits at
`ready-drained` before it). Every other new path in that batch (INVALID retry, `BLOCKED_AUTH`,
recurring minors, edge audit, sweep, seam review) is exercised by dedicated replay-harness
scenarios, not by these three fixtures, whose stub tables would otherwise have to grow a key per
path they never take.

**Task 3's row** adds one `Merge:` ledger line per merge attempt: canonical +3 (`bd-101`,
`bd-102` success; `bd-103` failure), cap-tripping +0 (its one task never reaches `mergePrompt` —
BLOCKED before the merge gate), PARK +1 (`bd-301`'s single successful merge).

The relax-sequencing row is a **structural** edit (dispatch scheduling and merge sequencing both
changed shape), re-verified by replay: all three recorded scenarios land on identical dispatch
counts and terminal shapes — the relaxation adds no dispatches and changes no outcome on these
fixtures, only *when* work is allowed to run. The replay harness additionally grew dedicated
parallelism scenarios that no canned-count fixture can express: the live-incident shape (12
siblings' merges observed dispatched **and completed** while the 13th task's implementer is
still running — the old round barrier deadlocks this fixture into the harness timeout), a
sliding-window straggler (a later id dispatches through a slot freed mid-round, impossible under
the old chunk waves), a hot-file-cap firing case (same-file task defers, disjoint task
overtakes, detector names the file), the unplanned-id triage riding the merge queue (since moved beside the implementers, off the queue) instead of
stalling dispatch, and a mechanical `maxOpen.merge === 1` check that the single-flight invariant
held in every one of them.

**The current row's figures come from the offline replay harness, not Workflow runs.**
`tests/super-code/replay-harness.mjs` loads the canonical script (`./coordinator.js`), stubs the
runtime's `agent`/`log`/`phase`/`pipeline`/`parallel` hooks in-process, and replays all three
scenarios from the exact `args` blocks recorded below, answering each stub prompt with its
embedded JSON — the same counts, deterministically, with zero model spend. All three landed on
the prior row's counts unchanged (the null-guard edit adds no dispatches on a happy path), and
their terminal shapes now additionally carry `stopReason: "ready-drained"` (every scenario ends
on an empty ready set with the root open — none ever closes the root). The `wf_*` run-ids above
remain real history for the revisions they ran against and are superseded as evidence about the
current script, per this section's own standing rule. The harness also runs what no dryRun —
Workflow-hosted or replayed — can express: **live-sim scenarios** (`dryRun: false`, canned answers
keyed by dispatch label) where the real prompt builders execute, so the file-parameter plumbing,
the `--exclude-label blocker` scoping, and the label-only blocker-filing text are asserted against
actual dispatch strings rather than left "inspection-only"; and **null-injection scenarios**
(any label's answer can be null, transiently or permanently) covering every class in the "Null
dispatch policy" table, plus a stall-guard-reachability fixture with non-empty resume ledger text.
Run it with `tests/super-code/test-coordinator-replay.sh` after any edit to the script block —
structural or prompt-text alike, since it now checks both.

Two runs are deliberately absent from the table because neither is a baseline. `wf_171ab5c1-339`
executed against a script whose return value had no `parked` array at all, so it is not evidence
about any code that ships here. `wf_79a00109-4ff` never completed: it died on its first Plan
dispatch, and that is the point of keeping it — see below.

**An executed dryRun caught a defect that both `node --check` and a review pass missed.** Fix-round-1
added a Plan-phase guard comparing the planner's reported directory to `workspace` by exact string
equality. `workspace` is repo-root-relative while the planner works inside the integration worktree,
so a *correct* planner could never satisfy it. The guard read as plausible in review and parsed
clean; `wf_79a00109-4ff` died on its very first Plan dispatch. Fix-round-2 replaced equality with a
separator-anchored suffix check, verified in both directions — it accepts the worktree-prefixed path
a real planner returns, **and still rejects** a planner writing into the old shared directory. That
second half matters as much as the first: a guard loosened into a no-op would have "fixed" the
failure while silently reopening the cross-epic collision it exists to catch.

**What no dryRun in this file can validate, and what would.** Three fixes shipped here — the idempotent
workspace setup (`workspaceSetup`), merge-base-derived `base` on a re-entered worktree, and `mergeBase`-derived ledger
ranges — live in dispatch TEXT and in real git semantics, and `pick()` never builds a real prompt
builder under `dryRun: true`. Each one's defect only exists the SECOND time a piece of git state is
touched, which a canned stub cannot model: the first needs a restart where the task worktree and its
branch already exist on disk, so `git worktree add` would have failed without the reuse check; the
second needs that re-entered branch to already carry a prior attempt's commits, so `HEAD` is
demonstrably not a pre-implementer commit; the third needs a live rebase where another task merged
into the integration branch between this worktree's cut and this task's merge, so `r.base..head`
would provably include that other task's commits and `mergeBase..head` would not. These are
properties of a real git history over many real dispatches. The next step for anyone wanting them
corroborated is a live epic run through a genuine restart, not another scenario added to this file.

**One edit landed after those three runs, and it is named here rather than left for a reader to
discover by diffing.** Merging the `super-auto` branch renamed the `super-plan` skill to
`super-design`, which touched this script in exactly three places: two comments in `readyPrompt`
and one identifier inside its returned prompt string. The three run-ids above are still cited as
current, and the justification is stronger than the usual "topology unchanged" — the changed lines
sit inside a function body `pick()` never invokes under `dryRun: true`, so the code these runs
executed is not merely equivalent to the current script, it is byte-identical to it. Verified by
diffing the current block against the exact `.js` the three runs consumed: the rename is the whole
delta. Any future edit that reaches an executed line, however small it looks, requires a re-run —
that is the standing rule, and this is a stated exception to its letter, not a loophole in it.

**What this guard, and these re-runs, do NOT prove.** The predicate accepts a well-formed,
worktree-prefixed planner path — that is a fact about the `if` statement, checked directly (see
above) and now exercised by three passing dryRuns. It does **not** prove that a real planner
*produces* that path: `planPrompt` correctly supplies `planFileName` as `planner-prompt.md`'s
parameter, and the template no longer hardcodes the literal `plan.md` (fix-round-1's other change)
— but whether a real opus dispatch actually honors that parameter, rather than falling back to a
stale cached copy of the template or improvising a different filename, is a live-run-only question
no dryRun can touch: `pick()` never builds the real `planPrompt`/`planner-prompt.md` dispatch text
under `dryRun: true` (same structural limit as every other prompt-TEXT claim in this section — see
"None of the three proves anything about prompt TEXT" further below). This is the residual risk
behind I7 that the guard reduces but cannot eliminate: it catches a divergence once one has
happened, it does not make the planner incapable of causing one. Stated here, next to the guard,
rather than left implied by the guard's mere existence.

**What the three re-runs establish, precisely.** Each re-run hit the exact predicted count computed
by hand before any run occurred (31, 24, 23 — see each scenario's "Expected dispatch count," which
was arithmetic *before* these runs and is now confirmed arithmetic). The entire delta over the
pre-Task-5 counts (26→31, 22→24, 21→23) is ledger traffic: one `read-ledger` plus exactly one
`ledger-append:<id>` per terminal outcome, no more and no less. Hitting the predicted number is
therefore a real assertion about I1, not a tautology: **every terminal outcome in all three
scenarios wrote its ledger line.** Had any outcome's `ledger-append` call been skipped, the run
would have dispatched one fewer agent than predicted. Fix-round-1 (review): a prior draft of this
paragraph claimed a *duplicate* `ledger-append` call for one of these ids would instead raise
`dryRun: no stub for key ledger-append:<id>` — that mechanism is wrong. `pick()` (see the script
above) throws only when a stub key is **entirely absent** from `prompts.stubs`; a duplicate call
reuses a key this scenario's table already defines and `pick()` happily returns the same canned
`{appended:true}` value again, no throw. What actually catches a duplicate is the same signal that
catches a skip, from the other direction: an extra call lands the run at 32 dispatches, not 31 —
the count-matches-exactly assertion still holds, just via the dispatch tally, not a thrown
exception. (A call for an id genuinely outside a scenario's stub table — e.g. `ledger-append:bd-105`
under the canonical scenario's four ids — would still throw for the ordinary missing-key reason;
that's a different case from "an extra one fired" for an id already in the table.) Neither a skip
nor a duplicate happened in any of the three runs.

**What these three re-runs do NOT establish — read this before citing them for more than dispatch
counting.** Every `read-ledger` and `ledger-append` call in all three runs was answered by a canned
stub (`{text:""}` for every `read-ledger`, `{appended:true}` for every `ledger-append`), per this
section's own dryRun mechanics — `pick()` never calls a real prompt builder under `dryRun: true`.
These runs prove the dispatches fire **at the right points, in the right number** (see above). They
prove **nothing** about:
- the ledger **line format** actually rendered — `readLedgerPrompt`/`ledgerAppendPrompt` were never
  called for real, so the exact `Task <N> (<bead id>): ...` text these functions build was never
  produced or inspected by any of these runs (same caveat as this doc's existing scoping/
  finding-rendering/branch-carry-forward caveats: verified only by reading the function definitions);
- a real file actually being written to or read from disk — `dryRun: true` means no I/O occurs at
  all (see "Key constraint: the script does no I/O" and the intro to this section);
- **resume actually reconstructing state from real ledger content** — every `read-ledger` stub in
  all three runs returned `{text:""}` (a fresh epic), so the Resume-phase parsing logic
  (`resumed.set(...)`/the four `if (kind === ...)` branches) never ran against non-empty text in any
  of these runs. A genuine resumed-run scenario — a `read-ledger` stub returning multi-line text with
  a mix of `complete`/`BLOCKED`/`pending retry` entries, asserting the correct ids land in
  `completed`/`escalated`/`pendingRetry` and that already-escalated/completed ids are excluded from
  `ids` — remains **unwritten and unrun**. Given this document's history of overclaiming a baseline's
  coverage (four prior findings, all named under "dryRun policy" below), this gap is stated
  explicitly rather than left to be inferred from "the ledger is wired up and the baselines pass."

**What a dryRun can and cannot prove.** It proves what the *script* owns: round order, the Close
fixpoint check, the `bd ready` scoping flags baked into the dispatched prompt text, disjoint-file
bucketing, and the pipeline/merge/triage sequencing. It does **not** prove the schemas: a stub
returns its canned object whatever `schema:` the dispatch passed, so a dispatch that lost its
schema (and would return free text live) passes every dryRun — that is how a schema-less ledger
read zeroed every Finish `Metrics:` line on a live run. It proves nothing about the
judgment calls made *inside* a dispatched agent — whether an implementer's fix actually addresses
a finding, whether a triage verdict is the *correct* RESOLVE/ESCALATE call, whether a merge's
auto-resolve attempt would really succeed. Those are exercised only by a live run; the canned
stubs return a fixed verdict regardless of what a real agent would have concluded.

**A parse check is not a runnability check.** `node --check` on the extracted script only proves
the syntax is valid — it does not catch undefined references, because those are resolved at
*call* time, not parse time. This doc's first draft of this section verified the script with only
`node --check` and shipped with 10 of its 11 prompt-builder helpers (everything except
`closeEpicsPrompt`) called but never defined; the gap wasn't caught until an actual dryRun run
died with `planPrompt is not defined` two agents in. Worse, it would have died even on a
*correctly*-stubbed dryRun, because `pick(real, stubKey)` — as first written — took the already-
built prompt, not a thunk: `pick(planPrompt(...), 'plan')` evaluates `planPrompt(...)` as a
function-call argument before `pick` is ever entered, so the broken builder ran regardless of
`dryRun`. `pick` now takes `() => real` and only invokes it on the non-dryRun branch (see the
`./coordinator.js`), which stops a broken or still-undefined prompt builder from crashing a dryRun that
was never going to need its output — but that fix narrows the blast radius, it doesn't replace
verification. Before trusting a structural edit to this script, do more than `node --check`: grep
the called identifiers against the defined ones (`function <name>` and top-level `const <name> =`)
and confirm every call site resolves, then actually run the dryRun — a parse pass and a stub-key
lookup are not proof the script executes.

**And a parse check is not a literal-boundary check either** (issue #2 defect 7, distinct from
the undefined-helper failure above). A raw backtick inside prose inserted into a template literal
terminates the literal early: the rest of the prompt becomes code, or code becomes prompt, and
the file frequently REMAINS syntactically valid JavaScript — `node --check` is right to pass it,
and then either the Workflow runtime rejects what node accepted or, worse, the prompt content is
silently wrong. The check that catches it is span accounting, not parsing: the replay harness's
template-literal scan (`scanTemplateSpans`, section 0) tokenizes the script with a
string/comment/template-aware state machine and compares the top-level literal count against a
recorded baseline — an unintended count change is the signature. After ANY edit that inserts
prose into the script: escape every backtick in the inserted text (backslash before backtick), then run the harness; if
the span count moved and you did not deliberately add or remove a literal, the edit broke a
boundary. Update the baseline only alongside a deliberate literal add/remove, the same
recorded-not-illustrative discipline as the dispatch counts. (For a from-scratch coordinator with
no baseline to compare against, the applicable form is the escaping rule alone: no raw backtick
in any inserted prose, ever.)

Required **once at implementation** and **after any structural coordinator edit**: loop order,
the Close/Ready round shape, the scheduler, merge-back sequencing, review/fix-pass routing, or
blocker routing.
**Data edits skip it** — roster/prompt/tier edits (which model a role uses, prompt wording, the
concurrency cap's numeric value) are trivial by construction and can't silently break topology.

**A recorded baseline is evidence only for the exact script revision it ran against.** Every
"Confirmed" run-id/agent-count/return-value writeup in this doc is tied to the script as it existed
at the commit that run executed against — not to "the coordinator script" in the abstract, and not
to any later revision, however small the diff looks. Citing a prior run as if it covers a
subsequently-restructured engine is an overclaim **even when the figures themselves are real and
unaltered** — the run genuinely happened, genuinely passed, and is still not evidence about code it
never executed. This document has produced this exact overclaim more than once (most recently: a
canonical-scenario baseline cited across the commits that added the `pendingRetry`/`parked` return
keys, when the cited run predated both and could never have contained them). The fix is procedural,
not a one-time cleanup: after any structural edit, either re-run every baseline this doc cites and
replace its figures, or mark it explicitly superseded/historical and stop citing it as current —
never carry a stale run-id forward as if the intervening diff didn't happen.

The orchestrator should pass `args` as an actual JSON value wherever the harness supports it —
the string-tolerance in the script (`typeof args === 'string' ? JSON.parse(args) : args`) exists
as a defensive fallback for harness paths that stringify `args`, not as license to always
stringify by default.

**Every stub key a scenario can reach must be registered — including the mid-round keys.** The
top-up (`bd-ready-topup`) and the post-closure re-check (`bd-ready-recheck`) are deliberately
distinct keys from `bd-ready`, so scenarios control them independently — which also means a
scenario whose fixture merges anything without `deps` rows, or with a waiting `opaque` row (top-up
fires), or closes in-tree epics (re-check fires) MUST register them or `pick()` throws. Under
`dryRun` that throw is deliberately fatal (the adjudicated rethrow policy in `./coordinator.js`'s
quiescence block); in a live run the same failure is swallowed and logged. The canonical scenario
carries `deps` rows and no opaque row, so it never reaches `bd-ready-topup` and does not register
it; the other two register both keys.

**Stub phrasing is exact, not a paraphrase.** Every stub prompt MUST use the literal wording

```
You are a stub. Call no tools. Return exactly this JSON as your structured output: <json>
```

A shortened variant — e.g. "Return this JSON exactly, nothing else:" — cost `super-roast`'s build
two wasted runs: haiku answered in prose instead of invoking the structured-output tool, every
stubbed agent call returned nothing, and the dryRun silently tested the dead-agent path instead of
the intended topology. A malformed stub doesn't error — it quietly converts the run into an
accidental failure-path test, which can *look* like a passing run (dead-agent/`BLOCKED` handling
*is* exercised) while asserting nothing about what you actually meant to validate. Use the exact
phrasing above, every time, for every stub in the table below.

**One addition this coordinator needs that `super-roast` doesn't: array-valued stubs.**
`super-roast`'s engine is a linear pipeline — each stub key is called at most once per stage, so a
single canned value per key is enough. This coordinator has a `while(true)` round loop, and the
Close/Ready checks at the top of every round call the *same* stub key on every iteration. A single
canned value for `close-epics` or `bd-ready` would either report the root closed on round 1 (the
loop exits before the per-task pipeline ever runs) or report the same non-empty ready set forever
(the loop never drains). `pick()` resolves this by letting a stub value be an **array**: each call
to that key consumes the next entry, clamped to the last entry once exhausted. The recorded
scenario below uses this to drain in exactly two rounds — round 1 does the real work, round 2's
Close/Ready calls report nothing left to do.

## Stub table

Each stub prompt is `You are a stub. Call no tools. Return exactly this JSON as your structured
output: <json>` (exact phrasing — see "dryRun policy" above). The set below is the canonical
topology scenario: **four** ready tasks under one epic, all dispatched under the sliding window
(cap 4; `bd-101` and `bd-103` share `src/a.js`, under the default `hotFileCap: 3`), plus a fifth,
`bd-105`, blocked by `bd-102`. The mapping carries `deps` rows, so `bd-102` (it has an open
dependent) is split when its implementer reports a commit, and `bd-105` dispatches right then,
stacked on `bd-102`'s unmerged branch, and merges after it. `bd-101`'s
review returns NEEDS_FIX with one minor, so it runs the one fix pass and merges without re-review.
`bd-102` reviews CLEAN and merges. `bd-103` reviews CLEAN but its merge fails (blocker bead filed by
the merge agent) → triage ESCALATE → notify → quarantine, and the run **continues**. `bd-104`'s
**implementer self-reports BLOCKED**: no `review:bd-104` key exists, because that dispatch must
never happen; triage RESOLVEs it, the same-round retry re-runs implement, the retry reports
BLOCKED again, and the second RESOLVE is bounced into ESCALATE by the one-retry bound. Two tasks
land, so the mandatory sweep and the final review both dispatch. The args declare no
`mergeCheck`, so every `Merge:` line reads `check none`; the check's pass / fail / none paths are
exercised by the replay harness's live-sim scenarios.

| Stub key | Canned output (`<json>` content) | Exercises |
|---|---|---|
| `read-ledger` | `{text:""}` | the one-time Resume-phase read; empty text = a fresh epic, nothing reconstructed |
| `ledger-append:launch` | `{appended:true}` | the `Launch:` args record, once per launch |
| `ledger-append:detector` | `{appended:true}` | the persisted `Detector: round N — …` line, once per round that reaches the drain (round 1 here; round 2 exits at `ready-drained` first). Keys this scenario never takes — `bd-ready-topup`, `review:<id>:retry`, `seam-review:<id>`, `merge:<id>:seam-cleared`, `fix:<id>:seam`, `edge-audit:<k>`, `edge-cuts:<k>`, `ledger-append:edge-cuts:<k>`, `ledger-recurring:<k>`, `ledger:bd-102`, `reopen:<id>`, `discard:<id>` — would throw `dryRun: no stub for key …` at the next ledger drain or dispatch if a regression routed onto them |
| `close-epics` (array, 2) | `{rootClosed:false,closedThisRun:[]}` then `{rootClosed:false,closedThisRun:["bd-101","bd-102"]}` | root stays open both rounds; round 2's in-tree closures fire the post-closure re-check |
| `bd-ready` (array, 2) | `{ids:["bd-101","bd-102","bd-103","bd-104"]}` then `{ids:[]}` | round 1's batch; round 2 drains. Scoping flags are a property of the prompt text, not this return |
| `bd-ready-recheck` | `{ids:[]}` | the post-closure re-check, once |
| `plan` | `{planPath:"...", mapping:[5 rows, files, deps, opaque]}` | the ordinal↔bead-id↔files mapping every `ordinalFor` and the hot-file cap consume; `bd-105`'s `deps: ["bd-102"]` drives graph readiness and the split |
| `plan-rest` | the same mapping | round 1's second planner; it adds no new row here, so the merge is a no-op (the merge itself is covered by the replay harness) |
| `implement:bd-101..103` | `{id,n,status:"IMPLEMENTED",files,branch,base:"<40-char-sha>"}` | per-id; the implementer's workspace setup finds `base`; `n`/`branch` are re-stamped by the coordinator |
| `implement:bd-104` | `{status:"BLOCKED",blockerBead:"bd-109"}` | the implementer's own BLOCKED skips review and routes to `handleBlocker` |
| `review-bead:bd-102` | `{reviewBead:"bd-112",implClosed:true,created:true}` | the split at `bd-102`'s implementation (it has an open dependent); its merge then closes `bd-112` too |
| `implement:bd-105` / `review:bd-105` | IMPLEMENTED `{…,stacked:true}` / CLEAN | the graph dispatch of `bd-105`, stacked on `bd-102`, before `bd-102` merges |
| `merge:bd-105` / `ledger:bd-105` | merged, `ledgerAppended:true` / `{appended:true}` | `bd-105` merges only after `bd-102`; its one flush carries its `stacked on bd-102` line |
| `review:bd-101` | `{status:"NEEDS_FIX",finding:"…src/a.js:42",minors:["…"]}` | the one review that triggers the fix pass; its minor is noted at the merge gate and goes out in `ledger:bd-101` |
| `review:bd-102` / `review:bd-103` | `{status:"CLEAN"}` | clean reviews — no fix pass. **No `review:bd-104` key** |
| `fix:bd-101` | `{status:"FIXED",head:"<40-char-sha>"}` | the one fix pass; `head` renders the fix-pass line's commit range. No re-review key exists — a regression that re-reviewed would throw |
| `merge:bd-101` / `merge:bd-102` | `{merged:true,head,mergeBase,rebaseConflictFiles:0,ledgerAppended:true}` | successful serial merges; each merge agent wrote its own `Merge:` and completion lines |
| `ledger:bd-101` | `{appended:true}` | bd-101's one flush: its fix-pass line and its minor |
| `merge:bd-103` | `{merged:false,blockerBead:"bd-108",rebaseConflictFiles:2}` | conflict resolution failed → blocker path. **No `merge:bd-104` key** |
| `ledger:bd-103` | `{appended:true}` | bd-103's one flush: the failure-path `Merge: … → blocker` line, then `BLOCKED` |
| `triage:bd-103` / `triage:bd-104` | ESCALATE / RESOLVE (reused) | bd-104's second visit is bounced from RESOLVE into ESCALATE |
| `notify:bd-103` / `notify:bd-104` / `clarify:bd-104` / `ledger:bd-104` | fixed | notify on ESCALATE; clarification on RESOLVE; bd-104 flushes once per chain — `pending retry`, then `BLOCKED` |
| `sweep` / `ledger-append:sweep` | `{summary:"f00dbee — 12 passed, …"}` / `{appended:true}` | the mandatory full-suite sweep at Finish (work landed); the summary names bd-103/bd-104 as not in the measurement |
| `read-ledger:finish` / `ledger-append:metrics` | `{text:""}` / `{appended:true}` | the Metrics re-read and the one dispatch appending all four lines |
| `reconcile-buckets` | `{closed:[]}` | Finish reconciliation of escalated ids against the tracker |
| `worktree-sweep` | `{lines:[]}` | the Finish task-worktree backstop (always dispatched) |
| `final-review` | `{summary,verdict}` | dispatched because `completed.size` is 2 |

**Stub keys are call-site qualified** (`implement:<id>`, `review:<id>`, `fix:<id>`, `merge:<id>`,
`triage:<id>`, …): a single unqualified key can't return four different task ids, or CLEAN for two
tasks and NEEDS_FIX for a third. The unmapped-planner-id path (`unplanned-blocker:<id>`) and the
missing-bead fallback (`missing-blocker:<id>`) are not exercised by these scenarios.

## Assertions for the canonical dryRun

- `bd ready` is scoped to the epic tree and away from blocker beads (`--exclude-type=epic
  --exclude-label blocker --label sp:<epicId>`) — a property of the dispatched prompt text, which
  `pick()` never builds under `dryRun: true`; verified by reading `scripts/ready-in-tree`, or by
  `tests/super-code/`'s script cases.
- `bd-101`/`bd-102`/`bd-103` run implement → review; only `bd-101` runs `fix:bd-101`, once,
  and merges with no further review.
- **`bd-104` never reaches `review:bd-104`, `fix:bd-104`, or `merge:bd-104`.**
- Merge-back is single-flight: four `merge:<id>` calls, never two in flight.
- `bd-102` alone is split (`review-bead:bd-102` once); `impl:bd-105` dispatches after
  `impl:bd-102` and before `merge:bd-102`, and `merge:bd-105` after `merge:bd-102`. No
  `bd-ready-topup` dispatch: readiness came from the `deps` rows.
- The blocker path fires on `bd-103`'s failed merge (triage ESCALATE → notify → quarantine) and the
  run continues; on `bd-104` it exercises RESOLVE, the same-round retry, and the one-retry bound.
- No path reaches `mergePrompt` except after a CLEAN review or a completed fix pass.
- The sweep dispatches exactly once, before `read-ledger:finish`, because work landed.
- Ledger writes never wait in the merge queue: bd-101 and bd-102's success lines come from their
  merge agents; every other task line goes out in one `ledger:<id>` flush per chain.
- Expected dispatch count: `read-ledger` 1 + `ledger-append:launch` 1 + `close-epics` 2 +
  `bd-ready` 2 + `bd-ready-recheck` 1 + `plan` 1 + `plan-rest` 1 + `implement` 6 + `review-bead` 1 +
  `review` 4 + `fix` 1 + `merge` 4 + `triage` 3 + `notify` 2 + `clarify` 1 + task ledger flushes 5
  (`ledger:bd-101`, `ledger:bd-103`, `ledger:bd-104` ×2, `ledger:bd-105`) + `ledger-append:detector` 1 +
  `sweep` 1 + `ledger-append:sweep` 1 + `read-ledger:finish` 1 + `ledger-append:metrics` 1 +
  `final-review` 1 + `reconcile-buckets` 1 + `worktree-sweep` 1 = **44 agent calls, 0 errors**, terminal shape
  `{completed:["bd-102","bd-101","bd-105"], escalated:["bd-103","bd-104"], pendingRetry:[], parked:[],
  stalled:false, stopReason:"ready-drained"}` (bucket order follows completion order).

If any assertion fails, fix `./coordinator.js` (the canonical script) and
re-run before committing the fix.

### Baselines for the canonical scenario (recorded, not illustrative)

**Confirmed for the current revision by the offline replay harness**
(`tests/super-code/replay-harness.mjs`, run via `test-coordinator-replay.sh`): 44 agent calls,
0 errors, the terminal shape above. No Workflow-hosted run has been recorded against this
revision yet. (The script-in-file batch's 43 is superseded by this one's added `worktree-sweep`; the early-unblock batch's 48 by the script-in-file batch; the off-critical-path
batch's 44 by the early-unblock batch; the D4 loop's 50 by the off-critical-path batch.)

Superseded by the D4 loop (pre-D4 script: five-round fix loop, per-merge gate). Recorded then: run `wf_97164f71-a3c`: **32 agents dispatched, 0 errors**
— one MORE than the 31 every prior revision hit, and the +1 is load-bearing: it is the new
`ledger-minor:bd-101:1` dispatch, firing because this scenario's `review:bd-101` stub now returns a
`minors` array. That is a real assertion about the deferred-minor mechanism, not a topology
accident — had the writer been skipped, the run would have landed back on 31. Superseded detail
from the scope-fix run (`wf_cb63ecb9-492`, 31/0), terminal shape `{completed:["bd-101","bd-102"],
escalated:["bd-103"], pendingRetry:["bd-104"], parked:[], stalled:false}` — identical count and
shape to its predecessor (see the revision table under "dryRun policy"). The scope fix extracted
`treeMembershipTest(epicId)` out of `closeEpicsPrompt`, added `readyPrompt(epicId)` (labelled
`sp:` query as fast path, structural parent-child walk as fallback), and retired the id-prefix
grep; the blocker-bead-planning fix was prose-only, leaving the three bead-creation builders byte-for-byte untouched.
**Why this run was worth doing even though the count could not change:** the edit introduced a
newly extracted helper referenced from two builders, and `node --check` parses without resolving
references — an undefined-reference defect of exactly the `planPrompt is not defined` class would
have killed the run on its first Ready dispatch, as `wf_79a00109-4ff` did on its first Plan
dispatch. It did not. **What it does not prove, stated with the same precision as the paragraph
above:** the fix's entire substance is prompt TEXT — the membership rule the Ready and Close agents
are told to apply — and `pick()` never builds `readyPrompt` or `closeEpicsPrompt` under
`dryRun: true`. Every `bd-ready`/`close-epics` call here is a canned stub, so this run cannot
distinguish the fixed script from one whose fallback rule is wrong, inverted, or absent. Retiring
the id-prefix grep is what keeps the `bd-100`/`bd-101..104` ids in these args valid on scoping
grounds; it does not make them exercised. Only a live epic — specifically one whose beads carry no
`sp:` label, forcing the fallback path — can corroborate the rule itself.

**Where the "evidence only for the revision it ran against" rule came from.** A prior revision of
this doc cited `wf_171ab5c1-339` as covering the post-restructure engine. It could not have: it ran
against commit `9576d7f`, before `reviewAndFix`, `handleBlocker`, and the return value were
restructured, so its returned object predates the `parked` key entirely and could not have contained
it even by coincidence. The figures were real and unaltered — and still not evidence about code the
run never executed. That is the failure the rule generalizes.

**Schema-less dispatches — the harness's "N empty results" is expected, not a defect.** `notify`,
`clarify`, the ledger appends (`ledger:<id>`, `ledger-append:*`, `ledger-recurring:*`) and
`final-review` carry no `schema:`. The coordinator reads the first three only for null; `final-review`'s
string is returned verbatim as `review`. `sweep` carries `SWEEP_SUMMARY`, and its line must match a
measurement form (counts, `PASS|FAIL` for a non-test command, or `MEASUREMENT INVALID:`) or it is
recorded as `SWEEP UNAVAILABLE` — an agent's interim status once reached the final reviewer as the
branch's measurement. Don't add schemas to force the rest into a shape they don't need.

**What this dryRun proves and does not prove:** it proves **coordinator topology** — dispatch
order, the sliding-window scheduler, the serial merge gate, blocker-bead routing (ESCALATE and
RESOLVE), the review-stage BLOCKED guard, the one-fix-pass routing, and loop termination. It proves
nothing about the real prompts' content (every agent is a canned stub, and `pick()` never builds a
real prompt builder under `dryRun: true`), and nothing about git/`bd` behavior (no I/O occurs). The
re-stamping of `n`/`branch`/`base` and the fail-closed routing of a non-CLEAN verdict are plain JS
and do execute here; whether their values reach a dispatch string is verified by reading the
builders, or by a live-sim replay (`dryRun: false` with canned answers keyed by label).

**Journals are session-local.** Run ids and the figures recorded against them are the durable
record; journals themselves are not guaranteed to remain inspectable. A future maintainer
re-verifies the current baseline by re-running the Workflow tool with the `args` below and
recording the new run's figures here — not by going looking for any prior run's journal.

To reproduce or re-verify after a structural edit, run the Workflow tool with this script and this
`args` block:

```json
{
  "epicId": "bd-100",
  "integrationBranch": "epic-bd-100-integration",
  "skillsRoot": "/abs/superpowers/skills",
  "dryRun": true,
  "config": {
    "concurrency": 4,
    "models": { "planner": "opus", "implementer": "sonnet", "reviewer": "sonnet", "mechanical": "sonnet", "triage": "opus", "finalReview": "opus" }
  },
  "prompts": {
    "stubs": {
      "read-ledger": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
      "ledger-append:launch": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "ledger-append:detector": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "close-epics": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[\"bd-101\",\"bd-102\"]}"
      ],
      "bd-ready": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[\"bd-101\",\"bd-102\",\"bd-103\",\"bd-104\"]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[]}"
      ],
      "bd-ready-recheck": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[]}",
      "plan": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"planPath\":\".worktrees/epic-bd-100-integration/.superpowers/sdd/bd-100-plan/bd-100-plan.md\",\"mapping\":[{\"n\":1,\"id\":\"bd-101\",\"files\":[\"src/a.js\"],\"deps\":[],\"opaque\":false},{\"n\":2,\"id\":\"bd-102\",\"files\":[\"src/b.js\"],\"deps\":[],\"opaque\":false},{\"n\":3,\"id\":\"bd-103\",\"files\":[\"src/a.js\"],\"deps\":[],\"opaque\":false},{\"n\":4,\"id\":\"bd-104\",\"files\":[\"src/c.js\"],\"deps\":[],\"opaque\":false},{\"n\":5,\"id\":\"bd-105\",\"files\":[\"src/d.js\"],\"deps\":[\"bd-102\"],\"opaque\":false}]}",
      "plan-rest": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"planPath\":\".worktrees/epic-bd-100-integration/.superpowers/sdd/bd-100-plan/bd-100-plan.md\",\"mapping\":[{\"n\":1,\"id\":\"bd-101\",\"files\":[\"src/a.js\"],\"deps\":[],\"opaque\":false},{\"n\":2,\"id\":\"bd-102\",\"files\":[\"src/b.js\"],\"deps\":[],\"opaque\":false},{\"n\":3,\"id\":\"bd-103\",\"files\":[\"src/a.js\"],\"deps\":[],\"opaque\":false},{\"n\":4,\"id\":\"bd-104\",\"files\":[\"src/c.js\"],\"deps\":[],\"opaque\":false},{\"n\":5,\"id\":\"bd-105\",\"files\":[\"src/d.js\"],\"deps\":[\"bd-102\"],\"opaque\":false}]}",
      "implement:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"IMPLEMENTED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-101\",\"base\":\"aaaaaaa1111111111111111111111111111111\"}",
      "implement:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"n\":2,\"status\":\"IMPLEMENTED\",\"files\":[\"src/b.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-102\",\"base\":\"bbbbbbb2222222222222222222222222222222\"}",
      "implement:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"n\":3,\"status\":\"IMPLEMENTED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-103\",\"base\":\"ccccccc3333333333333333333333333333333\"}",
      "implement:bd-104": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-104\",\"n\":4,\"status\":\"BLOCKED\",\"files\":[\"src/c.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-104\",\"blockerBead\":\"bd-109\"}",
      "implement:bd-105": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-105\",\"n\":5,\"status\":\"IMPLEMENTED\",\"files\":[\"src/d.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-105\",\"base\":\"5555555aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"stacked\":true}",
      "review:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"NEEDS_FIX\",\"files\":[\"src/a.js\"],\"finding\":\"missing null check on parsed input in src/a.js:42\",\"minors\":[\"variable name x in src/a.js:17 is uninformative\"]}",
      "review:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"n\":2,\"status\":\"CLEAN\",\"files\":[\"src/b.js\"]}",
      "review:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"n\":3,\"status\":\"CLEAN\",\"files\":[\"src/a.js\"]}",
      "review:bd-105": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-105\",\"n\":5,\"status\":\"CLEAN\",\"files\":[\"src/d.js\"]}",
      "review-bead:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"reviewBead\":\"bd-112\",\"implClosed\":true,\"created\":true}",
      "fix:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/a.js\"],\"head\":\"fefefef1111111111111111111111111111111\"}",
      "ledger:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "merge:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"merged\":true,\"mergeExit\":0,\"mergeHead\":true,\"head\":\"a1a1a1a1111111111111111111111111111111\",\"mergeBase\":\"aaaaaaa1111111111111111111111111111111\",\"rebaseConflictFiles\":0,\"ledgerAppended\":true}",
      "merge:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"merged\":true,\"mergeExit\":0,\"mergeHead\":true,\"head\":\"b2b2b2b2222222222222222222222222222222\",\"mergeBase\":\"bbbbbbb2222222222222222222222222222222\",\"rebaseConflictFiles\":0,\"ledgerAppended\":true}",
      "merge:bd-105": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-105\",\"merged\":true,\"mergeExit\":0,\"mergeHead\":true,\"head\":\"e5e5e5e5555555555555555555555555555555\",\"mergeBase\":\"b2b2b2b2222222222222222222222222222222\",\"rebaseConflictFiles\":0,\"ledgerAppended\":true}",
      "ledger:bd-105": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "merge:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"merged\":false,\"blockerBead\":\"bd-108\",\"rebaseConflictFiles\":2}",
      "ledger:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "triage:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"decision\":\"ESCALATE\",\"detail\":\"rebase conflict on src/a.js survived one bounded resolution attempt\"}",
      "triage:bd-104": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"decision\":\"RESOLVE\",\"detail\":\"implementer needs the missing config constant named explicitly; re-plan and re-attempt\"}",
      "notify:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"sent\":true}",
      "notify:bd-104": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"sent\":true}",
      "clarify:bd-104": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"recorded\":true}",
      "ledger:bd-104": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "worktree-sweep": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"lines\":[]}",
      "read-ledger:finish": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
      "ledger-append:metrics": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "reconcile-buckets": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"closed\":[]}",
      "sweep": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"summary\":\"f00dbee \\u2014 12 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: <project test command>\"}",
      "ledger-append:sweep": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "final-review": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"summary\":\"stub: 2/4 tasks merged; bd-103 and bd-104 quarantined\",\"verdict\":\"conditional-pass\"}"
    }
  }
}
```

## Fix-pass-blocked dryRun scenario (separate baseline)

Superseded by the D4 loop: the cap-tripping scenario (five NEEDS_FIX rounds, the cap adjudicator
ruling BLOCKED; last recorded replay 37/0, last Workflow-hosted run `wf_527ad491-790` 24/0) tested a
round cap that no longer exists.

This scenario covers the fix pass's blocked exit: **one** epic, **one** ready task whose review
returns NEEDS_FIX and whose fixer reports BLOCKED (it filed `bd-210`: the fix needs a decision the
brief doesn't make). The task routes to `handleBlocker` → triage ESCALATE → notify → quarantine.
Nothing merges, so neither the sweep nor the final review dispatches.

| Stub key | Canned output | Exercises |
|---|---|---|
| `review:bd-201` | `{status:"NEEDS_FIX",finding:"race condition … src/x.js:17"}` | the review that starts the fix pass |
| `fix:bd-201` | `{status:"BLOCKED",blockerBead:"bd-210",finding:"…"}` | the fixer's own BLOCKED, with the bead it filed |
| `ledger:bd-201` | `{appended:true}` | the one flush: `Task 1 (bd-201): fix pass BLOCKED (…)`, then `BLOCKED` |
| `triage:bd-201` / `notify:bd-201` | ESCALATE / fixed | the ordinary blocker path; no `merge:bd-201` key exists |
| `read-ledger:finish` / `ledger-append:metrics` / `reconcile-buckets` / `worktree-sweep` | fixed | Metrics are written unconditionally; bd-201 is reconciled; the worktree sweep always runs |

**Assertions:** exactly one `fix:bd-201`; no `merge:bd-201`, `sweep`, or `final-review`
dispatch; `completed` `[]`, `escalated` `["bd-201"]`, `pendingRetry` `[]`, `parked` `[]`,
`stalled` false. Expected dispatch count: **19 agent calls, 0 errors** — confirmed by the offline
replay harness at the current revision.

```json
{
  "epicId": "bd-200",
  "integrationBranch": "epic-bd-200-integration",
  "skillsRoot": "/abs/superpowers/skills",
  "dryRun": true,
  "config": {
    "concurrency": 4,
    "models": { "planner": "opus", "implementer": "sonnet", "reviewer": "sonnet", "mechanical": "sonnet", "triage": "opus", "finalReview": "opus" }
  },
  "prompts": {
    "stubs": {
      "read-ledger": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
      "ledger-append:launch": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "ledger-append:detector": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "close-epics": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[]}"
      ],
      "bd-ready": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[\"bd-201\"]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[]}"
      ],
      "bd-ready-topup": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[]}",
      "bd-ready-recheck": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[]}",
      "plan": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"planPath\":\".worktrees/epic-bd-200-integration/.superpowers/sdd/bd-200-plan/bd-200-plan.md\",\"mapping\":[{\"n\":1,\"id\":\"bd-201\",\"files\":[\"src/x.js\"]}]}",
      "plan-rest": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"planPath\":\".worktrees/epic-bd-200-integration/.superpowers/sdd/bd-200-plan/bd-200-plan.md\",\"mapping\":[{\"n\":1,\"id\":\"bd-201\",\"files\":[\"src/x.js\"]}]}",
      "implement:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"IMPLEMENTED\",\"files\":[\"src/x.js\"],\"branch\":\".worktrees/epic-bd-200-integration--task-bd-201\",\"base\":\"eeeeeee5555555555555555555555555555555\"}",
      "review:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"NEEDS_FIX\",\"files\":[\"src/x.js\"],\"finding\":\"race condition writing the shared cache in src/x.js:17\"}",
      "fix:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"BLOCKED\",\"files\":[\"src/x.js\"],\"blockerBead\":\"bd-210\",\"finding\":\"the fix needs a decision on the caching strategy the brief does not make\"}",
      "ledger:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "triage:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"decision\":\"ESCALATE\",\"detail\":\"the caching strategy is a design decision the spec does not settle\"}",
      "notify:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"sent\":true}",
      "worktree-sweep": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"lines\":[]}",
      "read-ledger:finish": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
      "ledger-append:metrics": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "reconcile-buckets": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"closed\":[]}"
    }
  }
}
```

## Parked dryRun scenario (separate baseline)

Superseded by the D4 loop: the PARK scenario (five NEEDS_FIX rounds, the cap adjudicator ruling
PARK; last recorded replay 37/0, last Workflow-hosted run `wf_4203efd4-84d` 23/0) tested an
adjudicator that no longer exists.

This scenario covers the fix pass declining a finding: **one** task whose review returns a
plan-mandated Important finding; the fixer declines it with a reason (`declined`) and reports
FIXED. The task merges as **parked**: `parked` holds it alongside `completed`, the completion line is
the parked variant carrying the reason and the finding, and the final review triages it.

| Stub key | Canned output | Exercises |
|---|---|---|
| `review:bd-301` | `{status:"NEEDS_FIX",finding:"… (plan-mandated)"}` | a finding the fixer will decline |
| `fix:bd-301` | `{status:"FIXED",head,declined:"… plan-mandated …"}` | `declined` non-empty → `parkReason` |
| `merge:bd-301` | merged, `ledgerAppended:true` | the merge agent writes the `Merge:` line only — a parked completion line carries fixer free text |
| `ledger:bd-301` | `{appended:true}` | the one flush: the fix-pass line, then `Task 1 (bd-301): complete (commits …, fix pass, 1 parked — reason: … — finding: …)` |
| `sweep` / `ledger-append:sweep` / `final-review` | fixed | work landed, so both dispatch |
| `worktree-sweep` | `{lines:[]}` | the Finish task-worktree backstop |

**Assertions:** no `triage`, `notify`, or blocker-filing key dispatches (a declined finding never
reaches the blocker path); `completed` `["bd-301"]`, `parked` `["bd-301"]`, `escalated` `[]`,
`pendingRetry` `[]`; the Finish log line reads `Parked (merged with fix-pass-declined findings): 1`.
Expected dispatch count: **21 agent calls, 0 errors** — confirmed by the offline replay harness at
the current revision.

```json
{
  "epicId": "bd-300",
  "integrationBranch": "epic-bd-300-integration",
  "skillsRoot": "/abs/superpowers/skills",
  "dryRun": true,
  "config": {
    "concurrency": 4,
    "models": { "planner": "opus", "implementer": "sonnet", "reviewer": "sonnet", "mechanical": "sonnet", "triage": "opus", "finalReview": "opus" }
  },
  "prompts": {
    "stubs": {
      "read-ledger": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
      "ledger-append:launch": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "ledger-append:detector": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "close-epics": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[]}"
      ],
      "bd-ready": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[\"bd-301\"]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[]}"
      ],
      "bd-ready-topup": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[]}",
      "bd-ready-recheck": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[]}",
      "plan": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"planPath\":\".worktrees/epic-bd-300-integration/.superpowers/sdd/bd-300-plan/bd-300-plan.md\",\"mapping\":[{\"n\":1,\"id\":\"bd-301\",\"files\":[\"src/y.js\"]}]}",
      "plan-rest": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"planPath\":\".worktrees/epic-bd-300-integration/.superpowers/sdd/bd-300-plan/bd-300-plan.md\",\"mapping\":[{\"n\":1,\"id\":\"bd-301\",\"files\":[\"src/y.js\"]}]}",
      "implement:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"IMPLEMENTED\",\"files\":[\"src/y.js\"],\"branch\":\".worktrees/epic-bd-300-integration--task-bd-301\",\"base\":\"fffffff6666666666666666666666666666666\"}",
      "review:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"NEEDS_FIX\",\"files\":[\"src/y.js\"],\"finding\":\"the retry backoff constant is duplicated verbatim in src/y.js:12 and src/y.js:40 (plan-mandated)\"}",
      "fix:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/y.js\"],\"head\":\"dddddd1111111111111111111111111111111d\",\"declined\":\"duplicated backoff constant \\u2014 plan-mandated: the brief requires each call site to carry its own constant\"}",
      "ledger:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "merge:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"merged\":true,\"mergeExit\":0,\"mergeHead\":true,\"head\":\"f6f6f6f6666666666666666666666666666666\",\"mergeBase\":\"eeeeeee5555555555555555555555555555555\",\"rebaseConflictFiles\":0,\"ledgerAppended\":true}",
      "worktree-sweep": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"lines\":[]}",
      "read-ledger:finish": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
      "ledger-append:metrics": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "reconcile-buckets": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"closed\":[]}",
      "sweep": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"summary\":\"f00dbee \\u2014 12 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: <project test command>\"}",
      "ledger-append:sweep": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "final-review": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"summary\":\"stub: 1/1 task merged; bd-301 parked (fix pass declined a plan-mandated finding)\",\"verdict\":\"conditional-pass\"}"
    }
  }
}
```
