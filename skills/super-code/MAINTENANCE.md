# super-code maintenance notes

Maintenance-only; nothing here is read at run time. These notes hold the history and long-form
rationale behind the coordinator's design choices: incidents, measured numbers and superseded
designs. They were moved out of the runtime script (`coordinator.js`) and the procedure doc
(`coordinator-workflow.md`), which keep only one-line, present-tense reasons. The git history
has the original text in place.

## Resolved defects (kept as guardrails)

- **issue #5 (measured on run 2026-09-04-audit-plan-instrumentation: eleven false-premise blocker
  beads, three merged tasks escalated, a 7.8 h resume for two beads).** One root: the coordinator let
  agents derive identities it owns. The task worktree path was relative and resolved against
  different roots; the branch name was the brief agent's to pick; the reported `id` was trusted into
  buckets. Two legitimate empty-range cases (an uncommitted implementer; a re-entered, already-merged
  task) were then indistinguishable from a defect at the review stage's INVALID-twice rule. Fixed by:
  `taskWorktree`/`taskBranch` pinned by the coordinator; `id` re-stamped at every hop; the brief stage's
  `alreadyMerged` short-circuit to a close-only dispatch; the implementer's `head` report plus one
  commit nudge; `blockerBeadOf` closing a RESOLVEd bead at the merge that lands the retry; and a
  Finish-phase `reconcile-buckets` dispatch that moves tracker-closed ids out of
  `escalated`/`pendingRetry`. Harness: five `live-sim: issue #5` scenarios.
  **Defects 7–9 (same run):** the recurring-pattern detector saw review minors only and missed a
  six-instance false-blocker cluster; ledger appends were fire-and-forget and lost 4 of 9 completion
  lines; two mechanical dispatches were classifier-refused for quoting triage free text. Fixed by
  `noteRecurrence()` (minors and triaged blockers, keyed on the new TRIAGE `cause` field, one
  threshold), `appendLedger()` (one retry with the free text elided, then a `ledger-append-failed`
  marker, count and return field), and a notify retry with the detail elided. Harness: three more
  `live-sim: issue #5 defect 7/8/9` scenarios.

These were real contradictions between this document and its own script, corrected in place. They
are recorded — not deleted — because each names a specific wrong belief a future editor could
re-adopt from a stale reading. None of them is an open gap.

1. **This document previously contradicted itself on what resume is for**, resolved in this fix
   round (see "Workspace and ledger" and the Resume-phase code comments above — no separate action
   needed here beyond noting it was fixed by clarifying the prose, not the code): stated plainly,
   resume's only dispatch-gating, behavior-affecting reconstruction after the earlier relaxation is
   `pendingRetry`; `completed`/`parked` are otherwise informational (reporting and the no-progress
   guard's baseline). The one behavioral use of resumed `completed` that is easy to miss: the
   Finish-phase final-review gate reads `completed.size` *after* Resume has already seeded it, so
   a re-invocation that lands zero new merges of its own still dispatches the opus whole-epic
   review, solely because an earlier run's completions are recorded in the ledger.
2. **The `sp:` labelling precondition used to be stated nowhere, and the Ready phase trusted it as
   the only signal.** Fixed in this round (see "The coordinator loop" step 1, and `readyPrompt` in
   the script skeleton): the Query step and the dispatched `bd-ready` prompt used to require
   `bd ready --exclude-type=epic --label sp:${epicId}` with nothing anywhere saying that label only
   exists on trees `super-design` created. A hand-made epic, or a **sub-epic** handed to super-code
   directly (whose members carry the *root* epic's `sp:` label, not their own id's), used to yield
   an empty round 1: `ids.length === 0` → the empty-ready-set quarantine exit → `break` → Finish
   reports `completed: 0`, `review: 'no work landed'` — indistinguishable from a legitimate
   quarantine-drain finish, having done nothing. This was the highest-consequence item in this
   section before the fix: a silent no-op on a plausible, easy-to-hit invocation, not a degraded
   feature. The Ready phase now treats an empty labelled result as inconclusive and falls back to
   the same structural parent-child test `closeEpicsPrompt` already used for epic closure
   (then `treeMembershipTest`, now the shipped `scripts/epic-tree` — never the id-prefix convention alone). Confirmed
   independently during the fix cycle that produced this document: this repo's own real epic
   carries no `sp:` labels — exactly the case the fallback now handles.
3. **"Newly-created beads (blocker beads included)" was a promise the design never meant to keep.**
   `:417` and `planPrompt` used to say the planner re-plans "newly-ready or newly-created beads
   (blocker beads included)" on refill, which reads as: a blocker bead gets its own `## Task <N>`
   mapping section and, by the same mechanism as any other mapped bead, could end up handed to
   `scripts/task-brief`/the implementer. That was never reachable as written — every `bd create` in
   this document (`missingBlockerBeadPrompt`, `unplannedBlockerPrompt`, `breakerBlockerPrompt`, and
   the self-filing implementer described under "Dispatching the implementer") files a bead with
   only a `blocker` label, no `--parent`, so the planner's `bd children` tree walk never discovers
   it and it never gets planned at all. Making it reachable the way the old prose implied would
   have been worse than the gap: a blocker bead is an **escalation record about a task**, not a
   work item — its body states the task id, what failed, and what was tried, for a human or the
   triage agent to read, never acceptance criteria for an implementer to satisfy. Fixed in this
   round by correcting the promise, not the code: `:417` and `planPrompt` no longer claim blocker
   beads get planned or given a mapping row. A blocker bead reaches a human or gets acted on
   exclusively through this run's escalation reporting ("Escalation = notify + quarantine +
   continue") and the triage agent's RESOLVE/ESCALATE call on the **original** blocked task (see
   "The blocker-bead path") — never through re-planning, and never through `bd ready`.
4. **The shipped canonical args used to be inconsistent with the ready-query regex.** Fixed in this
   round by retiring the regex, not by changing the args: the canonical scenario's `args` block
   still uses `epicId: "bd-100"` with children `bd-101`…`bd-104` (`:2444` and surrounding) — flat
   siblings, illustrative shorthand for the dryRun's JSON shapes, never a template for a real
   epic's id scheme (real `bd` ids are hierarchical, e.g. `super-plan-2c1.8`). The old dispatched
   grep, `grep -oE 'bd-100[.0-9]*'`, could never match `bd-101` through `bd-104` (no shared prefix
   beyond `bd-10`, and the trailing digit isn't a `.`-delimited suffix of `bd-100`) — the dryRun
   never ran it (`bd-ready` is stubbed in every scenario in this doc), so the mismatch passed
   silently forever, and a maintainer copying these args as a mental model for a real epic would
   have gotten a scoping scheme that yields zero ids against a real `bd ready`. The fix (see the `sp:`-labelling item
   above and `readyPrompt`) removes the grep from the Ready phase entirely rather than reconciling
   it with these ids: the fast path is the bare `--label sp:${epicId}` query, and the structural
   fallback needs no naming convention at all. The canonical args are therefore unchanged **on id
   grounds** — but this round was still a structural edit, so all three baselines were re-run
   against it regardless (see the revision table under "dryRun policy" for that round's figures;
   see each scenario's "Confirmed against the scope-fix script" writeup). Unchanged args are not a
   licence to carry a run-id across a diff. Flagged here so a future reader still doesn't copy the
   flat id scheme as a template for a real epic's ids.
5. **The parallelism prose used to claim the opposite of what the code does.** Fixed in this round
   (see "The coordinator loop," step 3, above) — it previously said "dispatch disjoint-file groups
   concurrently," which reads as *buckets* running concurrently with each other. The code actually
   serializes *across* buckets (the `for (const group of groups)` loop, `:1188`) and only chunks to
   the concurrency cap *within* one bucket (`:1193`); SKILL.md's Parallelism section (`:52`) had it
   right all along, this document did not. Noted here, not just fixed in place, because getting
   this backwards is a genuine write-collision risk for anyone reimplementing the loop from this
   document's prose alone — which the "Annotated script skeleton" section (`:743`) explicitly
   invites a future maintainer to do. **Superseded (2026-08-22): buckets no longer exist at all**
   — disjoint-file bucketing was removed on live measurement in favor of the sliding-window
   scheduler + hot-file cap ("The coordinator loop" step 3, and the Implement-phase relaxation
   comment in the skeleton). Kept because its lesson generalizes: prose and code drifting on
   *which* things serialize is exactly how both the bucket collapse and the round barrier went
   unnoticed.
6. **"Illustrative" vs. "canonical" was self-contradictory.** Fixed in this round: the script
   skeleton's own header, in the "Annotated script skeleton" section (`:743`), used to open with
   "Illustrative — adapt names/prompts to the epic," while the dryRun policy section (`:2202`, "If
   any assertion fails, fix the script in this doc") called the same script "canonical." Resolved in
   favor of canonical — it is the only executable artifact in this document, every recorded baseline
   was run against it verbatim, and "adapt names/prompts to the epic" was never actually license to
   restructure it. A maintainer who took the old "illustrative" framing at face value and rewrote
   the script's structure while adapting it to a real epic would silently invalidate every baseline
   recorded in this document without any signal that they had done so.

## Resume rationale (moved from coordinator-workflow.md's "Workspace and ledger")

> (Fix-round-1, review: this used to also filter the Ready-phase `ids` by
> `!completed.includes(id)`, as "defense-in-depth" against a merge that landed but whose `bd close`
> failed — but that turns exactly that recoverable crash into a **permanent** deadlock: the bead
> never closes on its own, nothing else in this script closes a leaf bead, and the epic can never
> close. Dropping the filter restores the pre-existing-filter behavior: such an id is simply
> re-dispatched, its already-merged worktree makes the re-run a no-op review/merge, and `bd close`
> actually runs this time — wasteful, self-healing, never a deadlock. This re-dispatch enters at the
> brief stage, which (Fix 1, final fix round) is now IDEMPOTENT — it reuses the existing
> worktree/branch when both are already present instead of assuming a fresh `git worktree add` will
> succeed (see `taskBriefPrompt`). Before that fix, the worktree and branch this same id's earlier
> attempt already created would still be sitting there, `git worktree add [-b]` fails hard on both,
> and "simply re-dispatched" would not actually have worked — best case the brief agent improvised
> with no instruction, worst case it errored or reported BLOCKED and the id got re-quarantined, the
> exact outcome this relaxation exists to prevent. Idempotent worktree/branch handling is what makes
> the self-heal here real rather than aspirational; it is part of the same self-heal contract as
> this paragraph's own claim, not a separate concern.) A `pending retry` line seeds
> `pendingRetry` so C-2's one-bounded-retry check still holds after a restart — the id is **not**
> filtered out of `ids`, since it is due its re-attempt, but a second RESOLVE for it is correctly
> bounced into ESCALATE rather than granted an unbounded second chance. **A `BLOCKED` line is
> deliberately NOT reconstructed into anything that gates dispatch** (fix-round-1, review — this
> used to fold it into `escalated`, the same in-memory list `handleBlocker` populates live during a
> run, which then permanently quarantined the id: no ledger line kind ever clears a `BLOCKED`, so
> every future invocation re-filtered it forever, even after the user fixed the underlying blocker —
> making the documented recovery contract below ("The user resolves the blockers and re-invokes the
> coordinator, which picks up the now-ready work") impossible short of hand-editing `progress.md`,
> which nothing supports). A restart instead gives a previously-BLOCKED id a fresh attempt through
> the full pipeline — safe to re-enter because the brief stage is now idempotent (Fix 1, final fix
> round; see the "wasteful, self-healing, never a deadlock" note above and `taskBriefPrompt`), so
> the worktree/branch this id's prior attempt already created is reused rather than crashing on
> `git worktree add`; if the blocker is genuinely still unresolved, `handleBlocker` re-quarantines it
> (live, via the in-memory `escalated` array, which still does its within-a-run job unchanged) after
> **up to two** wasted pipeline passes, not one — see "Known limitations" below for why
> `pendingRetry` isn't seeded from a `BLOCKED` last line, which is what makes the first blocker-path
> visit of a new run get treated as a first-time RESOLVE-eligible attempt rather than immediately
> bounded — self-healing regardless, not a silent permanent lock, the same trade made for
> `completed` above. `escalated` therefore means something narrower after this fix: "quarantined
> earlier in *this* process," not "ever quarantined, in any process, ledger-wide." A bead with no
> ledger line at all — including one whose *only* line is a `fix pass` entry — is simply
> not started from this coordinator's perspective: the next `bd ready` surfaces the id again and it
> re-enters the pipeline from the brief stage, re-running its review and fix pass. **One re-entry case no longer re-runs anything (issue #5 defect 6):** when the brief
> stage finds the task branch already merged into the integration branch (its tip is the second
> parent of a merge there — the "merge landed, `bd close` lost" case the `completed` relaxation
> below describes as wasteful-but-self-healing), the coordinator skips implement/review/merge and
> dispatches a close-only step; before this, that re-entry reviewed an EMPTY diff, the INVALID-twice
> rule reported BLOCKED, and a blocker bead was filed against finished work. This is a different case from "Escalation = notify + quarantine + continue" below:
> that section's re-invoke covers a *clean drain* where the ready set emptied because of
> quarantined blockers; this section covers resuming a run that stopped mid-flight for any reason
> (crash, restart, manual interruption) while ready work still remained. Both converge on the same
> fixed point now, though: neither a clean-drain re-invoke nor a mid-flight restart ever
> permanently locks out a fixed id — the difference is only *how much* gets redone (a clean-drain
> re-invoke picks the id up from a true `bd ready` batch with nothing wasted; a mid-flight restart
> may waste up to two pipeline passes on an id that's still genuinely blocked before re-quarantining
> it — see "Known limitations" below).

## Run profile (`scripts/run-profile`)

**Why after the fact.** A Workflow script throws on `Date.now()` (it would break resume), and the
ledger carries no timestamps, so the coordinator cannot time anything. Stamping times through
agents would cost a dispatch or a prompt change per event in tuned prompts. The Workflow runtime
already records what timing needs, so the profile reads it after the run and changes nothing in
the run.

**What it reads, and how it breaks.** Per run directory: `journal.jsonl` (`started` rows with
`agentId`, `label`, `phase`; `result` and `failed` rows), `agent-<id>.meta.json` (`description` is
the label, plus `workflowPhase` and `model`) and `agent-<id>.jsonl` (a timestamp on every row;
`tool_use` / `tool_result` pairs give tool spans). From results it uses PLANNED rows (`deps`,
`files`, `opaque`) as the graph, RESULT `status` (`IMPLEMENTED`, `STACK_CONFLICT`), MERGE `merged`
and `seamOverlap`, and EDGE_CUTS `applied`. From the launch append's prompt it reads `Launch: args`
(`epicId`, `config.concurrency`, `runtimeSlots`, `earlyUnblock`, `dryRun`). These files are
harness-internal and undocumented. The tests use synthetic copies, so a harness change passes them.
After a Claude Code or Codex update, re-check against a real run (`--discover --epic <recent epic>`).

**Coupling to the coordinator.** Timing per bead depends on the label grammar
`<kind>:<bead>[:<suffix>]` and on `stageOf()`'s map from kind to stage. The merge lane is
`merge`, `seam-review` and suffixed `fix` (`:seam`, `:check`). The test's last check fails when
`coordinator.js` gains a literal `label:` kind the profiler does not classify. The labels built
indirectly (`review:`, `ledger:`, `read-ledger`) are listed in that check by hand.

**The schedule model's assumptions.** Landed beads only, with their final attempt's measured
times. A slot is held from the implementer's start to the end of review and fix. One FIFO merge
lane, with a task's seam work inside its lane turn. A stacked task merges after its parents.
Dependents start at a blocker's implementation, except over edges where this run's dependent
waited for the merge (a stack conflict, or early unblock not taken). Planner timing is kept as it
ran. Hot-file caps, the top-up query budget, runtime-slot queueing and attempts that never landed
are not modelled. The `Profile: bound` line prints the model's makespan against the measured one.

**Validated on 2026-10-07**, after an independent review fixed the critical-path walk: a
predecessor must start before its step, attempt heads get slot, ready-query and planner
candidates, and waits are clamped to their invocation. The check ran against the 52 coordinator
runs still on the maintainer's disk, from 2026-10-01 to 2026-10-03: 34 real invocations across nine
epics in four projects, plus 18 small fixture runs. None crashed. On 30 of the 32 real invocations
that landed work, the model came within 10% of the measured task graph. The worst fit (60%) was a
run whose critical path ran through a bead that never landed; the model leaves such attempts out.
The next was 85%. `--summarize` over the 34 real profiles gives the baseline:
- Implement is 65% of critical-path time and the planners 20%.
- Stack conflicts bounced 32 of the 112 landed beads that had in-run blockers.
- Seam work took 55% of the merge lane's busy time.
- Tests plus polling for background test runs took 65% of the bottleneck beads' implement time,
  and 60% of all implementer and fixer time. Almost all of it was focused runs: 28 of about 2,600
  test commands were unfiltered whole-suite runs, and 197 of 198 backgrounded runs were targeted.

On the largest run (76 planned beads, 455 agents, a 7h55m task graph), the model reached 96% of
actual once late edges were calibrated. Before that it was 83%, because it assumed early unblock
always applied. That run's profile also surfaced:
- Stack conflicts bounced 16 of the 29 dependents dispatched at an implementation, costing 7h43m
  of summed waiting.
- Seam reviews and seam fixes took 70% of the merge lane's busy time.
- The modelled saving from taking every early unblock was −1h04m.

**Ordinary-subagent runs** (`--codex`, `--subagents`). There is no journal, so each input comes
from somewhere else:
- **Dispatches.** On Codex, the coordinator's rollout is
  `~/.codex/sessions/YYYY/MM/DD/rollout-<ts>-<thread id>.jsonl`. Its children are the rollouts whose
  first row (`session_meta`) has `source.subagent.thread_spawn.parent_thread_id` equal to that
  thread id. The task name is the last segment of `agent_path`. Guardian reviewers
  (`source.subagent.other`) and grandchildren are left out. A dispatch is one task, from
  `task_started` to `task_complete` or `turn_aborted`, so a `followup_task` adds a second dispatch
  under the same name. A forked child replays its parent's history at its spawn instant, so
  calls that open and close at that instant are dropped. Tool spans pair `function_call` and
  `custom_tool_call` rows with their `*_output` rows by `call_id`. Code mode's `exec` cell is
  JavaScript, so its commands are read out of the `tools.exec_command({cmd: …})` calls inside it.
  The coordinator's `spawn_agent` messages are encrypted and are not read.
- **Claude Code.** The calling session's `<session>/subagents/agent-<id>.{jsonl,meta.json}` have the
  Workflow format without a journal. The session's own transcript is `<session>.jsonl`.
- **Labels.** Labels come from the names in `coordinator-subagents.md`'s rule. Codex rejects any
  task name outside `[a-z0-9_]` ("agent_name must use only lowercase letters, digits, and
  underscores", 0.160.1). So `codexLabel()` matches `<kind>_<normalized id>` against the epic's ids
  (bd's leaves plus the ledger's ids), takes the longest id that matches, and drops ids that
  normalize alike. Names that follow no rule (every Codex run before 2026-10-07) get only the
  run-level `concurrency` and `dispatch time by kind` lines. There, the kind is the name's first
  word.
- **Outcomes and graph.** Outcomes come from `--ledger`: a success `Merge:` line or `Task … complete`
  means landed, and `Task … BLOCKED` means blocked. By default the ledger is the `progress.md`
  path that the coordinator's commands name. The graph is `bd list --all --json --limit 0`, run in
  the coordinator's directory, or `--beads`. It follows tree-deps' rules over every status, because
  the beads are closed by then.
- **Merges.** The coordinator merges itself, so a lane turn is synthesized from its own commands.
  It runs from the first `git merge|rebase` that names `task-<id>` to the last command that names
  the bead before the next dispatch. A seam review splits it into two turns.
- **Schedule model.** The run has cap 1 and no early unblock. A slot is held through the merge.

Validated read-only on 2026-10-07 against Codex 0.160.1 sessions on the maintainer's disk.
herdr-threads coordinator `01a10505-dd5c-…` had 518 dispatches by 326 children over 87.5h. At most
one dispatch was running 91.6% of the time: none for 56.8% and one for 34.8%. Its names follow no
rule, so it profiles at run level only. No Claude Code fallback run existed to check against.

## Rationale archived from the coordinator script

Each entry is the comment that used to sit above the named line of `coordinator.js`.

### `const A = typeof args === 'string' ? JSON.parse(args) : args`

> args: { epicId, integrationBranch, integrationWorktree?, skillsRoot, dryRun, config } — see
> "Coordinator contract" above. `integrationWorktree` is OPTIONAL and additive (never required — requiring it
> would be the "Authoring pitfalls" failure of crashing a caller who follows the stated contract):
> when omitted it is derived below, by the pre-flight convention, from `integrationBranch` alone.
> A caller that created the worktree itself (super-auto's run worktree, any native-tool worktree)
> passes the real path here, because no string derivation can recover it (see "Coordinator
> contract" on the slashed-branch mismatch this fixes).

### `const stubCallCounts = {}`

> dryRun swaps every dispatched prompt for a canned stub from prompts.stubs (see "dryRun policy"
> below) — same swap as super-roast's `pick()`, with two differences, both hard-won:
> 1. `pick` takes a THUNK (`() => real`), not the built prompt itself, and calls it only on the
>    non-dryRun branch. A prompt builder is a plain function call, and JS evaluates a function's
>    ARGUMENTS before the function runs — `pick(realPromptFn(...), key)` would build the real
>    prompt unconditionally, even under dryRun, before `pick` ever gets a chance to short-circuit
>    to the stub. That eager evaluation is exactly what turned "10 undefined prompt-builder
>    helpers" into a dryRun-time crash instead of a real-run-time one (see "dryRun policy" below)
>    — the same trap super-roast's build hit and lost a round to. Passing a thunk defers the call
>    until `pick` has already decided dryRun is false.
> 2. A stub value may be an ARRAY, consumed one entry per call to that key and clamped to the
>    last entry once exhausted. Reason: this script has a `while(true)` round loop (super-roast's
>    pipeline is linear) whose Close/Ready checks call the SAME stub key every round — a single
>    canned value would either break out on round 1 (never exercising the per-task pipeline) or
>    never empty the ready set (infinite loop). The array form is how the recorded baseline below
>    drains in exactly two rounds.

### `const branchSlug = String(integrationBranch).replace(/\//g, '-')`

> Pure string derivation, no I/O — matches the fixed path Pre-flight step 2 creates the
> integration worktree at, and the per-task convention "Dispatching the implementer" describes.
> Slash-safe (defect 5, live): a branch name may contain `/` (super-auto's `super-auto/<slug>`),
> and worktree tools do not create nested directories for it — the pre-flight convention collapses
> `/` to `-`, so the derivation must too. And when the caller supplied `integrationWorktree`
> (a worktree the coordinator's convention never created — see "Coordinator contract"), the
> explicit path wins outright: deriving anything for it would rebuild the exact mismatch the
> field exists to fix.

### `const taskWorktree = id => '${integrationWorktree}/.worktrees/${branchSlug}--task-${id}'`

> issue #5 defects 1–2 (measured: eleven false-premise blocker beads, three merged tasks
> escalated, a 7.8 h resume for two beads): the task worktree used to be a RELATIVE path that
> each dispatched agent resolved against its own cwd — the repo root for some, the integration
> worktree for others — so one task ended up with two worktrees, reviewers reported "directory
> does not exist", and completion probes looked in the wrong place. Rooted under the
> integration worktree now (absolute whenever the caller passed an absolute
> `integrationWorktree`, which super-auto always does), and the branch NAME is pinned here too:
> the brief agent used to pick it ("on a new branch"), and picked both `task-<id>` and
> `task/<id>` in one run, so any probe that checked one form concluded the work was missing.

### `const planFileName = '${epicId}-plan.md'`

> I7: per-epic plan filename + workspace pinned to the INTEGRATION worktree. Every epic used to
> name its plan file literally "plan.md", so scripts/sdd-workspace's basename-derived directory
> (".superpowers/sdd/plan/") was the SAME path for every epic in the repo — every epic's ledger
> collided on ".superpowers/sdd/plan/progress.md", defeating the plan-scoping that script exists
> to provide and making the resume rule below (I1) skip a DIFFERENT epic's tasks. Naming the plan
> file per-epic (`${epicId}-plan.md`) gives sdd-workspace's own basename-slug rule a distinct
> directory per epic (".superpowers/sdd/<epicId>-plan/") for free — this is pure string derivation
> replicating that rule, not a second, independent naming scheme; planPrompt passes the planner
> this same `planFileName` value as the parameter planner-prompt.md's template expects (fix-round-1,
> review: the template used to hardcode the literal "plan.md" in eleven places, three inside literal
> shell commands, and planPrompt papered over that with one prose override sentence that directly
> contradicted the template's own "follow it verbatim" comment a few lines below — see planPrompt).
> Fix-round-1 (review): the prior comment here claimed the coordinator's own `workspace` derivation
> and the planner's returned `planned.planPath` "can never drift apart" — that was an overclaim
> stated, not verified: `planned.planPath` comes back from a dispatched agent's own report and was
> never actually compared against `workspace` anywhere in this script. If a planner instance ever
> answers from the template's unparameterized default (a stale planner-prompt.md cached in an
> agent's context, a manual invocation that skips this parameter) the plan/briefs/reports land in
> `.superpowers/sdd/plan/` while `workspace`/`ledgerPath` here still point at
> `.superpowers/sdd/<epicId>-plan/` — silently, in a live run only, and only a dryRun's stubbed
> `planPath` would ever hide it. The Plan-phase call site (below) now asserts the two agree on every
> dispatch and throws loud rather than let them silently split.
> The ledger lives inside that per-epic workspace, anchored to the INTEGRATION worktree — never a
> per-task worktree. taskWorktree(id) above is where an implementer/reviewer/merge agent does its
> own git/bd work for ONE task and may be quarantined or torn down independently; integrationWorktree
> is the one long-lived, single-writer location every task's outcome converges on (the serial merge
> gate and handleBlocker both already run there — see "Serial merge-back"). Every ledger read/append
> dispatch below explicitly runs `In ${integrationWorktree}`, never in a taskWorktree(id): a
> git-ignored scratch directory like `.superpowers/sdd/` is a plain path on disk, not shared across
> worktrees the way tracked, committed files are, so writing it from a task's own worktree would
> produce a second, divergent copy no other stage ever reads.

### `const runtimeSlots = Number(config.runtimeSlots) > 0 ? Math.floor(Number(config.runtimeSlots)) : null`

> config.concurrency bounds concurrent per-task chains, enforced by `makeScheduler` (helpers
> below) as a sliding window — a slot frees, the next id dispatches — never as batches.
> The Workflow runtime runs at most min(16, cores-2) agents per workflow and queues the rest in
> one shared queue, so admitting more chains than that parks the merge, top-up and ledger
> dispatches behind implementers. Pre-flight resolves that slot count into `config.runtimeSlots`
> (the script cannot read the core count); the cap keeps two slots free for the merge lane and
> the top-up/ledger work, so every admitted chain is a running agent.

### `const topUpQueryCap = Math.max(0, Number(config.topUpQueryCap) || 40)`

> Top-up query budget, PER ROUND (optional, additive contract key — the counter lives in the
> round loop, so every round gets a fresh allowance). Readiness is computed in JS from the
> planner's `deps` rows (readyFromGraph); the `bd ready` top-up runs only where JS cannot see
> readiness — a mapping with no `deps` rows, or a waiting row marked `opaque` (an epic-level or
> out-of-tree blocker) — and in those graphs it still costs one mechanical agent per merge, so it
> keeps a per-round cap. Exhausting it degrades to the round-boundary refill: no work is lost.

### `const defaultTestPathspecs = [`

> Test-changes pathspecs (optional, additive contract key): both reviewing dispatches (the task
> review and the seam review) restrict their stat/full diff to these pathspecs (see
> taskReviewPrompt / seamReviewPrompt below). The bare
> (non-`**/`-prefixed) alternates exist because a root-level file (`main_test.go`) matches
> neither a `**/`-prefixed glob nor `'**/test*'` (which also matches prose, not just tests) under
> git pathspec rules — both gaps were roast findings against an earlier draft of this list.

### `let nullsThisRound = 0`

> Null-dispatch guard (live-run defect: see "Null dispatch policy"). agent() returns null when a
> dispatched subagent dies on a terminal API error after retries; a single 529 on a merge dispatch
> used to throw `null is not an object (evaluating 'm.merged')` and kill a run in which 21 of 22
> agents had already completed. EVERY `await agent(...)` in this script goes through dispatch():
> the central guard logs each swallowed null by label and phase — a swallowed failure must be
> visible in /workflows, never look like progress — and counts it toward the round's null tally
> for the bounded null-retry (see the no-progress guard). Call sites keep the per-class semantics
> ("Null dispatch policy" table): there is deliberately NO blanket default value here, because
> most defaults fabricate an outcome no agent produced (a null merge is not a failed merge; a
> null triage is not an ESCALATE; a null close-epics never closed the root).

### `const canStartWork = () => true`

> ADAPTATION POINT (2nd downstream feedback round, defect #2): "the top-up must not spend a query
> when the coordinator would refuse to start the work it would find." This reference skeleton has
> no budget concept, so the predicate is constant-true — but a project coordinator with a budget
> or a capacity reserve replaces THIS ONE FUNCTION (e.g. `() => !budgetStopped &&
> budgetHeadroom(...) >= PIPELINE_COST`) instead of forking runTopUp/resolveRetryHook. It cannot
> arrive via `args` — args is pure JSON, functions never cross that boundary — which is why it is
> a named function in the skeleton rather than a config key. Gates BOTH mid-round work starters:
> the top-up query (a query whose results are unusable is waste) and the same-round RESOLVE retry
> (which starts work directly, no query). The round-boundary refill is deliberately NOT gated
> here — what happens at a budget stop between rounds is the adaptation's own policy.

### `const ledgerAppendFailed = []`

> issue #5 defects 8–9 (measured: 4 of 9 completion lines lost on one run; two mechanical
> appends refused by the harness classifier before any agent spawned, because their line quoted
> triage free text about hunting weakened/deleted tests): every ledger write goes through here.
> A null is a FAILURE, not a shrug — retried exactly once, with `elidedLine` when the call site
> has one (ids and outcome token kept, agent-authored free text dropped, so a prompt refused for
> its wording gets a second chance that cannot be refused for the same reason); a second null is
> recorded by label in `ledgerAppendFailed` (returned, logged as `ledger-append-failed: <label>`,
> and counted on the Finish-phase `Metrics: ledger-check` line) so the gap is visible instead of
> silent. Same stub key both times (dryRun stubs never return null, so the retry never fires
> there); the retry's label carries a `:retry` suffix so a trace tells the two apart.
> `line` may be one string or an array of strings (several lines written by one dispatch, in
> order — e.g. a task's minors, or the four Metrics lines). Each line is flattened to one physical
> line here, in JS, so the dispatched agent never has to sanitize.

### `let ledgerChain = Promise.resolve()`

> Ledger writes off the critical path. `queueLedger` serializes appends on their own chain, which
> nothing on the merge path awaits; the round end and Finish drain it. A task's lines (fix pass,
> merge, minors, blocker outcome) are buffered per id with `noteLedger` and written by ONE append
> when the task's chain ends (`flushLedger`, label `ledger:<id>`); each line keeps its elided
> variant, so the retry elides only the free text. Per-id order is preserved: one buffer per id,
> flushed FIFO onto one chain.
> A throw inside a queued append (an unregistered dryRun stub key, a broken prompt builder — a
> null is appendLedger's own business) is kept and surfaced at the next drain: fatal under dryRun,
> logged in a live run, where a lost line is already counted by appendLedger's marks.

### `const PLANNED = { type: 'object', properties: { planPath: {type:'string'}, mapping: { type:'array', items: { type:'objec`

> mapping: ordinal (N, as scripts/task-brief needs it) <-> bead id (as bd needs it) <-> declared
> touched files (as the scheduler's hot-file cap needs it) — see "Plan materialization". This is the
> FULL CUMULATIVE table, every round, not just this round's new rows: the coordinator replaces
> `planned` wholesale each round (it does not merge across rounds), so a round-scoped return
> would drop every earlier id and make ordinalFor(id) resolve to undefined for them — see
> planPrompt below and planner-prompt.md's Report Format.
> `unplanned`: beads the planner left out for a missing decision; the coordinator files a blocker
> bead per id carrying `missingDecision` (optional — absent means none).
> `deps` / `opaque` (from scripts/tree-deps, on rows of OPEN beads only): the bead's open in-tree
> leaf blockers, and whether anything else gates it (an epic-level or out-of-tree blocker, a hand
> claim). They let readyFromGraph dispatch a dependent the moment its blockers land, with no
> `bd ready` round-trip. A mapping with no `deps` on any row falls back to the per-merge top-up.

### `const RESULT_STATUSES = ['BRIEFED', 'IMPLEMENTED', 'BLOCKED', 'BLOCKED_AUTH', 'CLEAN', 'NEEDS_FIX', 'INVALID', 'FIXED', `

> `finding` is NOT required: a CLEAN result (or any non-review stage) has none. It exists so a
> NEEDS_FIX result carries the actual review finding text across the schema boundary — without it,
> taskReviewPrompt's "attach the finding when NEEDS_FIX" instruction has nowhere to land, and
> fixPrompt has nothing but {id,n,status,files,branch} to build a fix dispatch from.
> `base` is the commit `scripts/review-package`'s BASE arg needs — captured once, by the brief
> stage. Which commit it actually is now depends on whether the task worktree/branch were freshly
> cut or already existed (Fix 1, final fix round — see taskBriefPrompt for the full reasoning): on
> a FRESH cut it's the pre-implementer commit, right after the worktree is cut and before the
> implementer makes any commit; on a RE-ENTERED worktree (a restart re-dispatching a
> previously-quarantined or previously-completed id — see "Resume behavior") it's
> `git merge-base <integrationBranch> <task branch>` instead, since HEAD there is a prior
> attempt's tip, not a pre-implementer commit. It is NOT required (only the brief stage's dispatch
> actually determines it). Unlike `branch`/`n` (which the coordinator can derive itself from
> `taskWorktree(id)`/`ordinalFor(id)` and never needs to ask any subagent for — see the implement
> pipeline stage), `base` is a git commit SHA the coordinator has no way to compute or verify on
> its own (no shell/git access — see "Key constraint: the script does no I/O"), so the brief
> agent's report is its one legitimate source. Every stage downstream of the brief then carries it
> forward via plain JS assignment rather than re-asking a later subagent to echo it back (see the
> implement pipeline stage and reviewAndFix). Never derive review-package's BASE arg as `HEAD~1`
> instead — that silently drops all but the last commit of a multi-commit task
> (subagent-driven-development/SKILL.md §"Review the task"). NOTE: `base` feeds `review-package` only, which runs
> BEFORE the merge-gate's rebase — the ledger's own commit-range completion line uses a DIFFERENT,
> post-rebase value instead (`m.mergeBase`, on `MERGE` below), precisely because that rebase moves
> the task branch's history out from under `base` (see the `mergeBase`/`MERGE` comment and the
> merge-gate ledger-append call site — Fix 3, final fix round).
> `head`: the implementer's (and the fixer's) commit tip after committing — `git rev-parse HEAD`.
> `declined`: the fix pass's findings it did not fix, one line each with the reason (wrong, or
> plan-mandated); a non-empty value merges the task as parked.
> `stacked`: the brief found (or cut) a branch carrying its stack parents' merges, so `base` is the
> commit after them. `reopened`: a review re-entry found no branch and reopened the task bead — the
> task is implemented afresh.
> `status` is an enum of every token any RESULT-shaped dispatch may return; which subset applies is
> stated in each dispatch.

### `const MERGE   = { type: 'object', properties: { id:{type:'string'}, merged:{type:'boolean'}, blockerBead:{type:'string'}`

> `head` (fix-round-1, review): the pre-merge tip commit of the task branch, captured by the merge
> agent (`git rev-parse <branch>`, same "the coordinator has no shell/git access of its own" reason
> `base` is captured by the brief stage rather than derived here — see the `base` comment above).
> `mergeBase` (Fix 3, final fix round): the POST-REBASE merge-base of the integration branch and
> the task branch — `git merge-base <integrationBranch> <branch>`, captured by the merge agent
> right after the rebase succeeds, before merging. This is deliberately NOT the same value as
> `RESULT.base` above (the pre-rebase commit the brief stage captured): once `mergePrompt` rebases
> the task branch onto the integration branch, `base` is no longer an ancestor of the rebased
> history — so `git log base..head` would name this task's commits PLUS every commit any OTHER
> task merged into the integration branch since this worktree was cut, not just this task's own
> (the canonical four-task scenario's `bd-103` would falsely cite `bd-101`'s and `bd-102`'s commits
> as its own). After a successful rebase, `git merge-base <integrationBranch> <branch>` is exactly
> the integration branch's tip at rebase time — the one point the rebased task branch and the
> integration branch actually share — so `mergeBase..head` names only this task's own commits.
> `base` remains correct, and is kept, for `review-package` (which runs BEFORE this rebase, at the
> task-review stage — see `taskReviewPrompt`): the two fields serve two different call sites at two
> different points in the task's git history and are kept deliberately distinct, not merged into
> one. NOT required, on schema, exactly like `base` on `RESULT` above — a failed merge
> (`merged: false`) has no head/mergeBase worth recording, so neither can be a blanket requirement
> — but the merge agent IS asked (in `mergePrompt`'s dispatch text) to report both whenever
> `merged` is true, since the ledger's completion line now names the commit range
> (`commits <mergeBase7>..<head7>`, upstream SKILL.md's own shape) instead of the bare word
> "merged" (see the merge-gate ledger-append call site and "Workspace and ledger" above). Concern,
> stated here rather than only in a task report: unlike `base` (whose absence would already have
> failed the review/fix stages that depend on it before ever reaching `mergePrompt`), a merge
> agent that reports `merged: true` without `head`/`mergeBase` is schema-valid and passes silently
> — `short(undefined)` (see `short()` in the helpers section) degrades to `""`, so the ledger line
> would read `commits ..<head7>` or `commits <mergeBase7>..` with an empty half instead of failing
> loud. This is not exercised by any dryRun (every `merge:<id>` stub in this doc's scenarios that
> reports `merged:true` includes both `head` and `mergeBase`) and is a real, if narrow, gap: a
> non-compliant merge dispatch degrades the ledger's commit-range invariant instead of erroring —
> see "Known limitations" above.
> `authRefused` (issue #3 defect 3): the exact command the harness permission layer refused —
> twice, the porcelain form and one equivalent — so the merge never executed. NOT a failed merge
> and NOT the blocker path: see `handleAuthRefusal`. `seamOverlap` (issue #4 design question 1):
> files the rebase found changed on BOTH sides (this task's diff and the sibling commits that
> landed on the integration branch since the task branched) — the merge agent stops before
> merging and reports them, so the coordinator can run one scoped seam review first (see
> `integrateOne`'s seam branch). `head`/`mergeBase` accompany it, post-rebase.
> Task 3 (`Merge:` ledger line): `rebaseConflictFiles` — the number of files the rebase reported
> as conflicting (0 for a clean rebase) — reported on EVERY merge attempt, success or failure,
> so the per-merge ledger line's `rebase <clean | conflict: N files>` field always has a source.
> `ledgerAppended`: the merge agent wrote the success-path ledger lines itself (see mergePrompt);
> absent or false, the coordinator writes the same lines from the reported fields.

### `const EDGE_CHANGE = { type:'object', properties:{ dependent:{type:'string'}, blocker:{type:'string'}, kind:{type:'string`

> The read-only dependency-edge audit's return shape — see `edgeAuditPrompt`. openLeaves and depth
> are copied from scripts/tree-shape (super-design's graph-shape over this tree); achievableWidth
> (ceil(openLeaves / depth)) is computed in JS. `changes` use super-design's graph-pass vocabulary
> (drop / narrow / repoint, each judged safe or not by its safe class); `keep` verdicts are not
> returned. Only with `config.edgeCuts: 'apply-safe'` are the safe ones applied (EDGE_CUTS);
> everything else is recorded for an operator.

### `const LEDGER_TEXT = { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] }`

> I1: the mechanical ledger read/append contract. `read-ledger` returns the text `scripts/ledger-digest`
> prints — the raw file's `Merge:` lines and `Task` state tokens, free text dropped (empty
> string if the ledger doesn't exist yet — a fresh epic, or one whose first task hasn't merged or
> blocked yet) so parsing stays pure JS in this script (see the Resume-phase block below) rather
> than asking an agent to interpret ledger semantics — the same "mechanical extraction, judgment
> stays in the script" split the scheduler already uses for the planner's file mapping.
> Ledger appends are schema-less (see "Schema-less dispatches" in the dryRun policy section): the
> coordinator reads only whether the call returned null (appendLedger's retry-then-mark).

### `const LEDGER_LINE_RE = /^Task\s+(\S+)\s+\(([^)]+)\):\s*(.*)$/`

> Fix-round-1 (review, "Strongly suggested structure"): the ONE shape every ledger line writer
> (`ledgerLine()`, in the helpers section below — hoisted, so it's usable above its textual
> definition) and the Resume-phase reader (above) agree on: `Task <ordinal-or-?> (<bead id>): <rest>`.
> Keeping the regex here, beside the other module-level constants the Resume phase reads before
> the helpers section is ever reached, and naming it once, is what stops writer and reader from
> silently drifting the way two independently-hand-rolled string templates could — previously they
> agreed only by coincidence, and no dryRun could catch drift because both sides of the ledger are
> stubbed under `dryRun: true` (see "dryRun policy").

### `const escalated = new Set()`

> Terminal-outcome buckets. **Sets, not arrays, and every write goes through `settle()`.** Resume
> seeds these from a prior run's ledger, and this run can legitimately reach a DIFFERENT terminal
> outcome for the same id — Resume deliberately does not filter `ids` by `completed` (see the
> Resume phase's own comment on why a fixed blocker's task must be re-dispatchable). With plain
> arrays and bare `.push`, a resumed-`complete` id whose merge fails THIS run landed in `escalated`
> while still sitting in `completed`: one id in two terminal buckets, contradicting the
> "exactly one of merged / quarantined / pending-retry / parked" invariant the dryRun section
> asserts for every task. Arrays also double-counted an id that resumed complete and merged again.

### `const authRefused = []`

> issue #3 defect 3: tasks whose pipeline hit a harness permission refusal (porcelain form AND
> one equivalent refused; the command never executed). Quarantined for THIS run like an
> escalation — dependents stay unready — but never a blocker bead and never a triage dispatch:
> no agent can lift a permission decision, so the only honest outcomes are "log it, accept the
> coverage loss, keep going" and a pre-flight that grants the operation class up front (see
> Pre-flight step 5). Returned to the caller so the run's end state names the gap.

### `const reviewBeadOf = new Map()`

> Early unblock, run-wide. A task with open in-tree dependents is SPLIT when its implementer reports
> a commit: `review-bead split` creates a `review: <id>` bead (blocked by the task) and closes the
> task bead, and the dependents dispatch at once on a worktree cut with the task's branch merged in
> (its stack parent). Each chain run is an ATTEMPT: `merged` settles true when its merge lands and
> false when the attempt ends any other way; a dependent waits on its stack parents' `merged` before
> it may enqueue its own merge, and is cancelled (worktree discarded, re-dispatched later) when one
> settles false. `implDone`: implemented, not-yet-merged split tasks → their live attempt (the stack
> parents a dependent is cut on). `reviewBeadOf` / `implClosed`: a split task's review bead and
> whether its task bead is closed — the merge closes both, a failed attempt reopens the task bead.

### `const minorClusters = new Map()   // '<kind>:<signature>' -> { count, tasks:Set, sample, reported }`

> issue #3 defect 2: run-wide deferred-minor clustering. 1,335 individually-correct deferrals
> hid one line recurring ~40 times (the pipeline reporting its own defect once per merge) for a
> fortnight because nothing counted recurrences. Signature = the minor's text with numbers,
> hashes, paths and quoting normalised away — catches verbatim/near-verbatim recurrence, which
> is the shape a systemic defect takes; it does not try to cluster paraphrases (an agent could,
> but a mechanical count that fires is worth more than a fuzzy one nobody trusts). Threshold:
> ≥5 occurrences OR ≥3 distinct tasks, reported once per signature (a `Recurring minor:` ledger
> line + log), and the Finish reviewer is told to triage those lines first.

### `function noteRecurrence(kind, id, text, phase) {`

> issue #5 defect 7: the detector used to see review minors ONLY. A six-instance false-blocker
> cluster across four tasks (the implementer reporting BLOCKED because it looked the report up
> under the bead id instead of the plan ordinal, or because finished work sat uncommitted) ran
> through `handleBlocker` unnoticed — each RESOLVE was individually correct and nothing counted
> them. Every blocker-path entry now feeds the same clusters, keyed on the triage agent's `cause`
> (a short root-cause phrase, TRIAGE schema; `detail` is the fallback when it is absent) and
> namespaced by kind so minors and blockers never merge into one cluster. Threshold semantics
> unchanged: ≥5 occurrences OR ≥3 distinct tasks, reported once per signature, as a
> `Recurring <kind>:` ledger line (a non-Task line the Resume reader ignores, like `Launch:`) plus a
> `RECURRING <KIND>` log line. Stub key qualified by report ordinal (predictable), not by the
> signature text (agent-produced, so no dryRun block could ever declare it).

### `phase('Resume')`

> I1: resume-from-ledger — the skill's stated Core principle (SKILL.md §Overview) — until this fix, no
> dispatch ever wrote or read this file (see "Workspace and ledger" above): a restarted run had no
> way to tell a completed task from an untouched one, or a quarantined/pending-retry id from a
> fresh one, other than re-querying `bd ready` and guessing (upstream calls a controller losing its
> place this way "the single most expensive failure observed"). Read exactly ONCE, before the round
> loop starts, not per round: the ledger only changes when THIS run appends to it, and every append
> from that point on is already reflected in this process's own in-memory `completed`/`escalated`/
> `parked`/`pendingRetry`. Runs `In ${integrationWorktree}` — the one worktree that owns the ledger
> (see the `ledgerPath` comment above).

### `}`

> Fix-round-1 (review): a `BLOCKED` line is deliberately NOT folded into `escalated` here. It
> used to be — but that made every invocation, crash-restart or deliberate re-invoke alike,
> re-seed `escalated` from every BLOCKED line the ledger has EVER recorded, with no line kind
> that ever clears one. The doc's own recovery contract ("Escalation = notify + quarantine +
> continue": "The user resolves the blockers and re-invokes the coordinator, which picks up the
> now-ready work") requires a fixed blocker's task to be re-dispatchable on the very next
> invocation — permanently filtering it out of `ids` (below) made that impossible short of
> hand-editing progress.md, which nothing documents or supports. `escalated` still does its job
> WITHIN a single run (handleBlocker pushes onto it live, and that's what the `ids` filter below
> actually needs to prevent an immediate re-dispatch loop this same run — see "The blocker-bead
> path"): what's removed is only the RESUME-time reconstruction of it from old ledger lines.
> The cost: a restart re-attempts a still-genuinely-blocked task's full pipeline up to TWICE
> (not once — see "Known limitations" above for why `pendingRetry` isn't seeded from a `BLOCKED`
> last line, which is what lets the first blocker-path visit of a new run consume a fresh
> first-time-RESOLVE slot before `handleBlocker` re-quarantines it) before it settles back into
> `escalated` (live) for the rest of this run — wasteful, exactly like the pre-existing-by-design
> cost of `completed`'s own resume relaxation below, but self-healing, not a permanent deadlock.
> STATED PLAINLY (resolving a contradiction a prior revision of this doc carried — this very
> comment used to end with "Resume's job is to avoid redoing MERGED work," directly contradicting
> "Resume behavior"'s own prose a few lines above it, which calls `completed`/`parked` "reporting
> and the no-progress guard's baseline only"): after this relaxation, resume's ONE dispatch-gating,
> behavior-affecting output is `pendingRetry` (C-2's one-bounded-retry check). `completed` and
> `parked` are otherwise purely informational — `bd ready` alone is what actually prevents
> redoing merged work, by excluding a genuinely-closed bead from its own output, with or without
> this script's resume reconstruction. The one exception, easy to miss: a nonzero *resumed*
> `completed.size` still changes behavior at Finish (below) — it makes the opus
> `final-review` dispatch even on a re-invocation whose OWN rounds land zero new merges, since
> that gate reads `completed.size` after Resume has already seeded it from prior-run ledger
> lines, not only from this run's own `completed.push` calls.

### `let stopReason = null`

> Why the run stopped — returned to the caller so no two stop causes are ever conflated again
> (defect 2, live: a null `bd ready`, written `ready?.ids ?? []`, used to exit this loop on a stop
> shape indistinguishable from real completion). Values: 'root-closed' (the one true completion),
> 'ready-drained' (empty ready set, root still open — quarantined blockers remain), 'stalled'
> (no-progress guard), 'ready-unavailable' / 'plan-unavailable' (infrastructure outage after the
> bounded null-retry — NEVER completion; the epic may still hold ready work).

### `phase('Close')`

> MECHANICAL echo of scripts/close-in-tree-epics (the in-tree epic-closure fixpoint — see
> "The coordinator loop" step 5 and closeEpicsPrompt). First iteration is harmless: nothing is
> eligible yet.
> ROUND HEAD, OVERLAPPED: Close and Ready used to run serially (two full dispatch latencies
> with zero work in flight). They are independent except in one case — a task depending on an
> EPIC bead becomes ready only once Close closes that epic — so they now dispatch
> concurrently, and when Close reports in-tree closures the Ready result is refreshed by one
> opportunistic re-check (distinct stub key `bd-ready-recheck`, same prompt) so
> epic-dependent tasks join this round instead of waiting a full round.

### `if (!ready) {`

> Defect 2 (live, silent false completion — worse than the crash class): this used to be
> `(ready?.ids ?? []).filter(...)`, which LOOKS handled — but a null here crashes nothing and
> exits the loop reporting the epic drained, on a stop shape indistinguishable from real
> completion. Optional chaining converted an API failure into a false success. A null ready is
> NOT "nothing ready": it is "the query never ran." Explicit branch, own stop reason, bounded
> retry per "Null dispatch policy".

### `const reentries = (ready.reviews ?? []).filter(rv => rv && rv.id && rv.task && !escalated.has(rv.task))`

> Fix-round-1 (review): `!completed.includes(id)` used to also gate this filter, as
> "defense-in-depth" against a ready id that was recorded `complete` on the ledger but never
> actually got `bd close`d (e.g. the run crashed between the merge and the close inside
> `mergePrompt`'s single dispatch). That reasoning was backwards: `bd ready` is the one authority
> that actually knows whether the bead is closed — a task whose `bd close` genuinely succeeded is
> already excluded by `bd ready` itself, making the `completed` check a no-op precisely in the
> case it was meant to help. In the case it was meant to catch (merge landed, `bd close` failed),
> filtering by `completed` instead makes the epic PERMANENTLY unclosable: the bead never closes on
> its own, nothing else in this script closes a leaf bead, and every future round drops the id
> before it ever reaches `mergePrompt` again. Before this filter existed, that id was simply
> re-dispatched: the worktree's already-merged content makes the re-run a no-op review/merge that
> succeeds and actually calls `bd close` this time — wasteful (one redundant pipeline pass) but
> self-healing, the same trade this fix makes for `escalated` above. `completed`/`parked` (from
> the Resume-phase reconstruction above) are kept for REPORTING and the no-progress guard's
> baseline only, never for this filter. `pendingRetry` ids were never filtered here either —
> they're due their one bounded re-attempt (see "The blocker-bead path"), which is the entire
> point of a RESOLVE verdict. `escalated` (live, this-run-only after the fix above) is the one
> list still legitimately gating dispatch, since it's what stops an immediate re-dispatch loop
> for a task this same run already quarantined.
> Ready review beads: a task split at implementation-done in an earlier run (or this one, when its
> merge never landed) whose task bead is closed and whose review bead is not. It re-enters at its
> review stage on its existing branch — never planned again, never re-implemented.

### `let planned = lastPlanned`

> PLANNER SKIP: dispatch the planner only when some ready id lacks a mapping row. On a refill
> round whose ids are all covered by the retained cumulative mapping (`lastPlanned`, above),
> the dispatch — an opus round-trip — is skipped outright; the plan file already exists on
> disk from the round that wrote it, so every downstream consumer (task-brief, artifacts) is
> unaffected. The divergence guard below still runs on the retained value: it is a pure
> string check, and re-asserting it each round is cheaper than reasoning about staleness.

### `const plannedDir = planned.planPath.replace(/\/[^/]*$/, '').replace(/\/+$/, '')`

> Fix-round-1 (review): `planned.planPath` is the planner AGENT's own report of where it wrote
> the plan file — it was never checked against `workspace` (derived above by an independent,
> purely-string rule) anywhere in this script, despite the removed comment near `workspace`
> above once claiming the two "can never drift apart." If the planner ever answers from
> planner-prompt.md's unparameterized literal-"plan.md" default instead of the `planFileName`
> this round's `planPrompt` dispatch supplies, the plan/briefs/reports land in
> `.superpowers/sdd/plan/` while the ledger this run reads/writes stays at `workspace`
> (`.superpowers/sdd/${epicId}-plan/`) — colliding across epics exactly the way I7 exists to
> prevent, silently, in a live run only (a dryRun's `plan` stub always returns whatever literal
> path the args hardcode, so this divergence is unreachable under `dryRun: true` by construction
> — this assertion is a live-run-only guard, like the rest of this comment's claim once was).
> Checked on every Plan dispatch, not just the epic's first: a refill-round planner answering
> from a different workspace would be just as broken. Fail loud rather than let the two paths
> silently split — same "validate and fail fast" discipline as the `epicId`/`integrationBranch`/
> `config` check on line 1 (see "Authoring pitfalls"). This is deliberately a hard `throw`, not a
> blocker-bead escalation: a workspace divergence is a whole-epic misconfiguration (every task's
> brief/report path is affected, not one task's), so there is no per-task recovery to route it
> through — do not "fix" this into `handleBlocker` later; that would quarantine one task while
> every other task keeps writing into a split workspace.
>
> Fix-round-1-followup (review, caught by an actual dryRun run): the FIRST version of this check
> compared `plannedDir` against `workspace` for EXACT STRING EQUALITY — and fired on every
> correct run, including the canonical dryRun, never once catching a real divergence. `workspace`
> is a repo-root-relative constant, but `planPrompt` (below) explicitly dispatches the planner
> to work "in the integration worktree" (see "Workspace and ledger"), and `scripts/sdd-workspace`
> resolves its canonicalized path against `git rev-parse --show-toplevel` of the INVOKING cwd —
> which, inside a worktree, is that worktree's own root, never the main repo's. A CORRECT planner
> therefore legitimately reports a path prefixed by the integration worktree (e.g.
> `.worktrees/<integrationBranch>/.superpowers/sdd/<epicId>-plan/<epicId>-plan.md`, or an
> absolute path with the same shape in a real run), which can never be byte-identical to the bare
> `workspace` string. The check now asserts what actually matters — that `plannedDir` RESOLVES TO
> this epic's workspace — not that the two strings match exactly: `plannedDir` must equal
> `workspace` outright (the unusual case of a planner already running from the repo root) OR end
> with `/${workspace}` (the integration-worktree-prefixed case `planPrompt` actually produces).
> Anchored on that leading `/`: the matched suffix is the FULL `.superpowers/sdd/<epicId>-plan`
> segment, not a bare substring of `epicId`, so a different epic id that happens to share this
> one's tail as raw text (e.g. epicId `100` vs `bd-100`) can't accidentally satisfy it — the
> character immediately before the matched segment must be a path separator, which only a
> genuine `.superpowers/sdd/` directory boundary provides. Trailing slashes are stripped from
> `plannedDir` before comparing, since a planner could report either form.

### `const expected = '${integrationWorktree}/${workspace}'`

> Limitation 3: it is not enough that the path ENDS WITH this epic's workspace — a planner
> wrongly dispatched into a TASK worktree reports
> `.worktrees/<integrationBranch>--task-<id>/.superpowers/sdd/<epicId>-plan`, which satisfies any
> suffix-only test while splitting the plan file from the ledger exactly as the wrong-epic case
> would. The guard now pins the prefix too: the only acceptable locations are the repo root
> itself and THIS epic's integration worktree.

### `const artifacts = id => {`

> Defect 3 (live: review ran blind on every run). SDD's templates hard-require three file
> parameters — task-reviewer-prompt.md needs [BRIEF_FILE], [REPORT_FILE], [DIFF_FILE];
> implementer-prompt.md needs [REPORT_FILE] ("Write your full report to [REPORT_FILE]") — and
> this skeleton used to supply NONE of them: every reviewer was handed unfilled template
> parameters and reviewed with no implementer report to check claims against (14 of 24 review
> dispatches in the first live run recorded a missing report file). The coordinator now derives
> all of them from the planner's reported plan directory and passes them into every dispatch.
> Path discipline, load-bearing: these live under the git-ignored `.superpowers/` workspace,
> which is NOT shared across worktrees — a task-worktree-relative path (or the scripts' own
> cwd-derived default OUTFILE, which resolves against the TASK worktree's git root) writes a
> divergent copy nothing downstream ever reads. So every path is rooted at the INTEGRATION
> worktree's workspace and must be absolute in a live run — `planPrompt` requires the planner to
> report `planPath` absolute (sdd-workspace prints the absolute canonical path, so the planner
> has it), and the divergence guard above has already vetted the directory these derive from.
> Naming follows SDD's own conventions: brief `task-<N>-brief.md` (task-brief's default name,
> passed explicitly as OUTFILE so it lands in the integration workspace), report
> `task-<N>-report.md` (SKILL.md's "name the report file after the brief"), diff per-range-ish
> `task-<N>-review-<tag>.diff` (explicit OUTFILE per review, so the seam review never reads the
> task review's package), and the reviewer's full written review `task-<N>-review.md`, which the
> fix pass reads.

### `let topUpHook = () => {}`

> Single-flight merge queue: each task's integration joins it the instant the task's chain
> ends, and exactly one merge touches the integration worktree at a time — guaranteed by one
> queue worker (`pumpMerge`), not batching. Drain order is completion order (a `bd ready` batch is
> mutually independent), except that the next merge is the queued task with the most live
> attempts waiting on its landing (stacked on it, or bounced on a stack conflict), first-come
> among equals. `mergeChain` is a promise that settles when the lane is idle and empty. Only merge work rides the queue: blocker triage, permission refusals
> and already-merged closes run outside it (none touches the integration branch, and `bd`
> writes are safe beside a merge), and ledger lines go to the ledger chain. A merge that ends
> on the blocker path returns that follow-up as a thunk, which runs after the queue moves on.
> Mid-round top-up hook (assigned in the dispatch section): fired without awaiting after each
> landing (a merge, or an already-merged close), so a bead the landing unblocked dispatches into
> this round — from the graph in JS, plus the `bd ready` top-up where JS cannot see readiness.
> Awaiting it inside integrateOne would serialize that work into the merge queue.

### `if (m && !m.merged && Array.isArray(m.seamOverlap) && m.seamOverlap.length) {`

> Post-rebase seam check: a rebase that moved the task onto sibling changes touching the SAME
> files gets exactly one scoped seam review before merging — the task review ran pre-rebase
> against a base the integration branch has since left. The merge agent reports the overlap
> and stops short of merging (merged:false + seamOverlap); a NEEDS_FIX gets ONE fix dispatch;
> either way the merge is re-dispatched with `seamCleared`. This holds the single-flight queue
> for one review (+ one fix). Tasks whose rebase touched no overlapping file skip it.

### `phase('Implement')`

> Dispatch is a sliding window, not file-overlap buckets: every planned id dispatches the moment
> a slot frees, bounded by `cap`. Each task runs in its own worktree, so concurrent implementers
> cannot collide on disk; the only conflict point is the rebase at the serial merge gate, with
> the bounded conflict resolution, the seam review, the merge check and the blocker path behind
> it. `filesTouched` is one scheduling constraint: at most `hotFileCap` in-flight tasks may
> declare the same file, which bounds rebase churn on a shared barrel/index/registry. Cost,
> stated: two textually disjoint edits that merge cleanly and compose wrong are not caught at
> dispatch time; the seam review (same files), the Finish sweep and the final review catch them.
>
> Per-task chain, per id, with no barrier between stages or tasks: a fast task proceeds all the
> way through its own merge while a slow sibling lags. `n`/`branch` come from
> `ordinalFor(id)`/`taskWorktree(id)`, never from an agent's echo; `base` is the one git fact
> the brief agent reports, because the coordinator has no git access. A brief or implementer
> BLOCKED never reaches review; it goes to `handleBlocker`, the single convergence point for
> every blocker trigger.

### `else if (br.alreadyMerged === true) {`

> issue #5 defect 6: a re-entered task whose branch is ALREADY merged into the integration
> branch (the resume relaxation's "wasteful but self-healing" case: merge landed, `bd close`
> did not) has nothing to implement and an EMPTY diff to review — which the review stage's
> INVALID-twice rule then reported as BLOCKED, filing a blocker bead against finished work
> (three of the measured run's six). The brief stage answers `alreadyMerged` from git (the
> branch tip is the second parent of a merge on the integration branch); the coordinator
> skips implement/review/merge and goes straight to closing the bead.

### `if (im.status === 'IMPLEMENTED' && im.head && br.base && im.head === br.base) {`

> issue #5 defect 3: an implementer that reports IMPLEMENTED with its edits UNCOMMITTED
> (two on the measured run, one whose report even claimed a commit) leaves the task
> branch at `base`, so the review package's base..HEAD range is empty and the review
> stage's INVALID-twice rule filed a blocker bead against correct, unreviewed work. The
> implementer now reports `head`; a head equal to the brief's base means nothing was
> committed. One bounded nudge — commit what is there — then a diagnosed BLOCKED whose
> finding names the cause, so triage reads "uncommitted", not "reported BLOCKED".

### `if (r?.status === 'BLOCKED') { await failAttempt(att, { failure: 'blocked', reopen: true }); await handleBlocker(r, plan`

> The chain's outcome. Blocker, permission-refusal and already-merged outcomes never touch
> the integration branch: they are handled here, inside this task's slot (a triage is an
> agent like any other, so it counts against the cap). Only a merge candidate leaves the
> slot, for the single-flight queue. A null result (a dead dispatch above) does nothing this
> round — the next ready batch re-surfaces the id. The attempt ends before the blocker path,
> so a RESOLVE retry starts from a settled one.

### `const dispatched = new Set([...plannedIds, ...reentryPlanned])`

> Mid-round dispatch beyond the round head. Each landing (and, with early unblock, each split
> task's implementation) runs `readyFromGraph()` in JS: a row whose in-tree blockers have all
> landed dispatches at once, with no agent spent. The `bd ready` top-up runs only where JS cannot
> see readiness (`needsBdTopUp`). Its newly-ready, already-mapped ids dispatch into this round's
> scheduler. An id with no mapping row is skipped and waits for the next round's planner pass.
> Bounds: `dispatched` only grows (a cancelled id leaves it to be re-dispatched once) and only
> mapped ids dispatch, so chains ≤ the mapping size plus cancellations; one top-up query in flight
> at a time (a landing mid-query re-runs it once); a top-up never awaits mergeChain and
> integrateOne never awaits a top-up, so there is no cycle. A null top-up query just skips that
> top-up — the next round's ready query is the authority.

### `let topUpFailure = null`

> A top-up promise created DURING a quiescence await has no handler attached until the next
> loop iteration — attach the catch at push time, or a rejection in that window (e.g. a
> scenario missing the stub key) is an unhandled rejection that kills the process instead of
> failing the round loudly. The first failure is kept; what happens to it after quiescence was
> ADJUDICATED with the downstream adaptation (2nd feedback round, item #3) and the position is
> stated here deliberately, not left silent: **rethrow under `dryRun`, swallow-and-log in a
> live run.** The throws this catches are configuration errors (an unregistered stub key, a
> broken prompt builder) — exactly what a dryRun exists to surface loudly and cheaply. In a
> LIVE run the same rethrow would abort a round of real work — merges already queued included —
> to report a component that gates nothing: a top-up's worst failure mode is the pre-top-up
> behaviour, work waiting for the next round's refill. A slowdown, not a loss.

### `resolveRetryHook = id => {`

> Same-round RESOLVE retry: re-push the task's chain immediately. The id stays in `dispatched`
> (top-ups must not triple-dispatch it); the deliberate second runTask is this retry itself,
> and C-2 bounds RESOLVEs to one per id, so at most one retry chain per task per run. Gated on
> a mapping row for the same reason the top-up is — an unmapped id (e.g. an unplanned-path
> RESOLVE, whose verdict usually means "re-plan") briefs against an undefined ordinal and
> fails the chain; it waits for the next round's planner pass instead, as before.

### `for (;;) {`

> QUIESCENCE, then drain. A chain's promise resolves only after its own integration completed
> (runTask awaits enqueueIntegration), and an integration may have fired a top-up that is
> still querying — so await chains AND top-ups together, and loop until NEITHER array grew
> while awaiting (checking chains alone is not enough: a top-up pushed during the await could
> otherwise be left unawaited and its work unaccounted). Terminates by the recursion bound
> above. Blocker jobs live in `chains` too, so quiescence covers them; mergeChain is already
> settled by then (every integration is awaited by its chain) — awaited once more as a guard.

### `if (completed.size === completedBefore && closed.closedThisRun.length === 0 &&`

> I6/C-2: no-progress guard. A round that made no forward progress at all — no task merged, no
> epic closed, no id newly quarantined, AND no id newly RESOLVEd-pending-retry — stops rather
> than spins. `pendingRetry` growing counts as progress in its own right (C-2): `handleBlocker`
> deliberately does NOT push a first-time RESOLVE onto `escalated`, since the whole point is to
> give the task one real re-attempt next round — without counting that as progress here, this
> guard would trip after round 1 of a legitimate RESOLVE and never let the re-attempt happen at
> all. A grown `escalated` (ESCALATE, an unmapped-id blocker bead, a failed merge, or a
> SECOND RESOLVE for an id already in `pendingRetry` — see handleBlocker's one-retry bound)
> already guarantees eventual termination on its own via the `escalated` filter on `ids` above,
> so it counts as progress here too, not just merges/closures.
> `closed.closedThisRun` is this iteration's Close pass, computed at the TOP of this same
> iteration — it reflects the PRIOR round's merges (Close runs before Ready/Implement/Integrate
> every iteration), one round lagged from the other three signals' own before/after snapshot.
> That lag doesn't weaken the guard: a run making genuine progress always has at least one of
> the four signals non-empty in any given round once work starts landing; a run making none of
> the four, in any round, has nothing left that will change next round's outcome either.

### `const unsettledIds = [...new Set([...escalated, ...pendingRetry])]`

> `authRefused` is additive: the ids whose coverage was lost to a permission refusal, with the
> refused command — a caller's report lists them as untested scope. They are ALSO in `escalated`
> (quarantined this run), so the four-bucket invariant is unchanged.
> Reconcile against the tracker before returning: a bead the tracker reports closed is
> `completed` whatever the ledger's BLOCKED history says — a caller records these buckets
> verbatim. A split task's closed task bead means implemented, not merged: it counts only when its
> review bead is closed too. Mechanical (`bd show` per id); null → buckets returned as-is, logged.

### `return 'PERMISSION REFUSALS: if the harness permission layer refuses a command (the tool call itself is declined — the c`

> issue #3 defect 3, shared by every dispatch that runs git/bd commands (brief, implementer,
> fixer, merge — the merge agent maps the outcome onto its own report shape, see mergePrompt).
> "Refused" means the HARNESS declined the tool call — distinguishable at the tool boundary from
> a command that ran and failed (no exit code, no output from the command itself). One
> equivalent form is allowed (decided policy: work around if possible); after that, stop and
> report — never a blocker bead, never an open-ended retry. The coordinator's handleAuthRefusal
> logs it, quarantines the task for this run, and moves on.

### ``

> The remaining prompt builders fill parameters; the real prompt content lives in this skill's
> templates (implementer-prompt.md, task-reviewer-prompt.md, planner-prompt.md, triage-prompt.md),
> which each builder names by absolute path (built from `skillsRoot`). Every dispatch string is
> self-contained: it names no coordinator-internal function or doc section the agent cannot see.
> Agent-written text interpolated into a dispatch (a review finding, a triage clarification, a
> coordinator-diagnosed cause) is wrapped in tags and marked as data.

### `const reentry = reentryIds.length ? ' Review re-entries this round (each was implemented in an earlier run; its task bea`

> planner (opus), once per epic then append-only — see "Plan materialization". The template
> carries the planning rules; this builder supplies its parameters and the enumeration command.
> `ids` is THIS ROUND'S CONFIRMED-READY set — not the planning scope: round 1 plans every ready
> AND blocked descendant, and `bd ready` never returns blocked beads, so the planner enumerates
> the wider set itself. ENUMERATION COMMAND (verified): `bd show <epic> --json` has no child ids;
> `bd children <id> --json` lists one level only, so the walk recurses into epic-typed children.
> `deps`/`opaque` come from scripts/tree-deps verbatim, on every dispatch, for open beads only.

### `const stackStep = parents.length`

> MECHANICAL. `worktree` is the coordinator's path and `branchName` its pinned name — the agent
> creates or reuses exactly these. IDEMPOTENT: a restart re-dispatching a previously-quarantined
> or previously-completed id lands here with both already present, and `git worktree add` fails
> on an existing path or branch, so the agent reuses them. `base` is the pre-implementer commit
> on a fresh cut, and on a re-entered one the newest first-parent `stack: ` merge (a stacked
> branch) or `git merge-base <integration> <task branch>` (HEAD there is a prior attempt's tip;
> using it would drop that attempt's commits from review). Never `HEAD~1`, which drops all but
> the last commit of a multi-commit task. `alreadyMerged` comes from scripts/already-merged (git
> only) so a re-entry after a lost `bd close` closes the bead instead of reviewing an empty diff.
> task-brief gets an explicit OUTFILE in the integration workspace: its default resolves against
> the task worktree's git root, whose .superpowers/ no other dispatch reads.
> `parents` (early unblock): the implemented, not-yet-merged tasks this one is stacked on — a
> fresh cut merges each one's branch, so `base` is the commit after those merges and the review
> package shows only this task's own diff. `reentry`: a review re-entry, whose implementation must
> already be on the branch. `recut`: a cancelled attempt's worktree may still exist; remove it.

### `const beadClose = resolvedBead ? ' and \'bd close ${resolvedBead} --reason "resolved: task ${r.id} merged"\' (the blocke`

> Serial merge-back: rebase onto the integration branch, bounded conflict resolution (conflicted
> hunks only), the post-rebase seam check, merge --no-ff and bd close. NO tests: the implementer
> ran the task's tests and the sweep runs the full suite at Finish. `head` and `mergeBase` are
> captured post-rebase for the ledger's commit range; `rebaseConflictFiles` on every attempt for
> the `Merge:` line. `resolvedBead` is the blocker bead a RESOLVE verdict left open for this
> task's retry; the merge that lands the retry closes it.

### `const cleanStep = 'PRE-MERGE CLEAN CHECK, in ${integrationWorktree}: run \'git status --porcelain --untracked-files=all\`

> The build-only merged-tree check: compile/typecheck only, never tests. It catches cross-branch
> compile seams (a sibling changed an API this task still calls) that each task's own tests
> cannot see. A failure is the ordinary merge-failure blocker path, never an in-place fix.
> Pre-merge cleanliness and merge-evidence contract: an untracked file in the integration
> worktree makes `git merge` refuse, and a refused or no-op merge must never be followed by a
> check that "passes" on the unchanged tree. The agent reports the evidence (status lines,
> mergeExit, mergeHead) and the coordinator validates it (fail closed).

### `const flat = String(rest).replace(/\s+/g, ' ').trim()`

> Fix-round-1 (review, "Strongly suggested structure"): the SINGLE writer every ledger-line call
> site in this script now goes through — paired with `LEDGER_LINE_RE` (near the other top-level
> schema constants, read by the Resume phase before this function's textual definition, but
> reachable there via normal `function` hoisting) so the writer and the reader agree on the same
> shape by construction, not by two independently-hand-rolled string templates staying in sync by
> coincidence. Collapses any run of whitespace (including embedded newlines) in `rest` to a single
> space: `rest` regularly interpolates free text an agent produced (`t.detail`, `r.parkRuling`,
> `r.finding`), any of which could in principle be multi-line, and the ledger's one-line-per-
> outcome invariant — which the Resume-phase reader depends on to treat each line independently —
> would otherwise silently break on the first such value.

### `if (!sha) throw new Error('short(): missing SHA — a merge report reached the ledger without a commit range')`

> Fails loud on a missing SHA. It used to return `''` for `undefined`, which produced a
> ledger line like `commits abc1234..` that STILL matched `LEDGER_LINE_RE` and parsed as an
> ordinary `complete` line on a future resume — the commit-range invariant degraded silently
> instead of failing. The merge gate now rejects such a report before reaching here (see its
> `!m.head || !m.mergeBase` branch); this throw is the backstop for any future call site that
> forgets to.

### `let active = 0`

> Pure JS, no I/O — the sliding-window dispatch scheduler that replaced disjoint-file
> bucketing and `chunk()`'s inter-batch barriers (see the Implement phase's relaxation
> comment for the measured evidence). Two constraints, enforced at acquire time:
> - at most `cap` chains in flight (strict FIFO for the cap: when the window is full,
>   nothing overtakes — deterministic, and `bd ready` order stays dispatch order);
> - at most `hotFileCap` in-flight chains declaring the same file (an id blocked ONLY by a
>   hot file is skipped and later ids may overtake it — that is the point: one hot file must
>   not stall the whole frontier; the skipped id dispatches when the file drains).
> `stats` feeds the round's parallelism detector line: `peak` is the high-water mark of
> in-flight chains; `hotFileDeferrals` counts, once per id per file, the ids that had to wait
> on a hot file — the observable trace of over-declared filesTouched or a genuinely shared
> barrel/index/registry.
> A file that has held back two ids while a slot sat free gets its cap raised by one for the rest
> of this scheduler's round (once per file): a free slot is lost throughput, one more rebase on
> that file is cheap. `stats.hotFileRaised` and `onRaise` report it.

### `const cmd = String(refused || 'command not reported').replace(/\s+/g, ' ').trim()`

> issue #3 defect 3 (decided policy): a harness permission refusal is not a command failure —
> the command never executed — and no pipeline stage can lift it: the measured run re-filed the
> same blocker four times across two invocations while the epic's highest-value bead (gating
> 23 of 30 remaining) sat unmerged, until an operator told the invoking session the operation
> class was pre-authorised. The agent already tried one equivalent form (authRefusalRule). So:
> log it loudly, quarantine the id for THIS run (its dependents stay unready — the same
> `escalated` set, so the ready filter and the buckets need no new case), record it, continue.
> No blocker bead, no triage dispatch, no notify: there is no judgment to make. The ledger line
> starts with `BLOCKED` so Resume treats it as `blockedHistorically` — a fresh attempt next run,
> once Pre-flight step 5's grant is in place. Accepting the coverage loss is the policy, not an
> accident: a run that stops for a permission prompt nobody is watching loses everything.

### `if (!t) {`

> Null triage ("Null dispatch policy"): UNSETTLED — neither judgment was made. ESCALATE is
> terminal quarantine and RESOLVE burns the one-retry allowance, so defaulting to either would
> spend a cost no agent decided to spend. No bucket, no ledger line; the id re-enters via the
> next ready batch and triage is re-attempted then (the blocker bead already filed is reused —
> r.blockerBead survives on the bead itself in bd, and a re-entry without it files a fresh one,
> the pre-existing "duplicate blocker beads" limitation, not a new cost of this guard).

### `if (t.decision === 'RESOLVE' && !pendingRetry.has(r.id)) {`

> C-2: bound RESOLVE to exactly one retry per id. A first-time RESOLVE gets a real re-attempt
> next round (pendingRetry.add, below) — that's the whole point of RESOLVE. But if the SAME id
> lands back in handleBlocker after that (pendingRetry already has it), the clarification didn't
> fix it; a second RESOLVE is treated as ESCALATE regardless of what this round's triage verdict
> says, so a bad clarification can spin at most one extra round before it quarantines — never
> indefinitely. This is also what makes the outer no-progress guard's `pendingRetry.size` signal
> meaningful: without a bound, RESOLVE growth could recur forever without ever converging.

### `noteLedger(r.id, ledgerLine(r.n, r.id, 'BLOCKED — ${detail}'),`

> I1: ledger records the terminal quarantine — SKILL.md's `BLOCKED` line shape — so a resumed
> run reconstructs `escalated` and the `ids` filter (see the Ready-phase block) skips this id
> instead of re-dispatching quarantined work. Written here, once, for EVERY blocker-path
> trigger that ends in ESCALATE (self-filed blocker, failed merge, an unmapped planner id, or a
> bounced second RESOLVE), since `handleBlocker` is the single point every trigger converges
> on. Built through `ledgerLine()`
> (see the merge-gate call site's comment) so `detail` — which can itself embed `t.detail`,
> free text from the triage agent — can't break the one-line-per-outcome shape with a newline.
