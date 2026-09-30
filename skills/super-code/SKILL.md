---
name: super-code
description: Use when executing a beads (`bd`) epic as a work queue — autonomous or interactive. Not for running a hand-written plan file task by task (that is subagent-driven-development) and not for ad-hoc parallel investigation with no shared epic or work queue (that is dispatching-parallel-agents).
---

# super-code

Drive a beads epic to completion: an epic-scoped `bd ready` loop, sliding-window parallel dispatch with single-flight merge-back, per-task worktrees off an epic integration branch, and blocker beads for anything that can't proceed — autonomous (Workflow-coordinated) or interactive (manual ready-driven loop), same contract either way.

**Core principle:** tasks coordinate only through beads and the integration branch, never through session memory. An interrupted epic resumes from the ledger, not from coordinator memory.

## Unattended runs: when to end your turn

In autonomous mode nobody is watching your turn, and ending it stops the run. Keep working until
the run reaches a terminal state. Don't end a turn to report progress, to announce the next phase,
at a milestone (a Workflow launched, a relaunch done, Finish reached), or with a list of decisions
that don't block you; put status in the same message as your next tool call. A Workflow returning,
a subagent's report, or a sibling skill handing back is not completion: read `stopReason`. Context
is compacted automatically, so a long run is no reason to stop early.

End your turn only for:
1. **A question only the user can answer, before launch:** an ambiguous epic scope when no caller
   named the epic, or an operation class the permission check (Pre-flight step 5 in
   `./coordinator-workflow.md`) found not allowed.
2. **A protected resource:** the base-branch merge in `finishing-a-development-branch`.
3. **A risky or destructive action** outside the declared operation classes.
4. **This skill's hard stops:** Finish completed after `stopReason` `root-closed`, `ready-drained`
   or `stalled`, or a second consecutive `ready-unavailable`/`plan-unavailable` stop.

When the Workflow ends on the agent-budget cap (no return value, no `stopReason`) or with a first
`ready-unavailable`/`plan-unavailable`, relaunch it yourself with `resumeFromRunId` and the ledger's
`Launch:` args, without asking. Other copies of this rule are pointers here.

## Boundary

super-code owns the epic-level machinery and its per-task prompts; it uses
`subagent-driven-development`'s helper scripts but not its Task Loop.

| super-code owns | Uses from `subagent-driven-development` |
|---|---|
| The coordinator (Workflow-coordinated autonomous loop, or the manual ready-driven fallback) | The helper scripts `scripts/task-brief`, `scripts/review-package`, `scripts/sdd-workspace`, always invoked as `bash <abs path>/scripts/<name>` |
| The per-task pipeline: `task-brief` → implementer → `review-package` → one task review → at most one fix pass → merge | The plan-scoped workspace and ledger header format |
| Its implementer and task-reviewer prompts (`./implementer-prompt.md`, `./task-reviewer-prompt.md`), adapted from SDD's | |
| The epic-scoped `bd ready` loop, refilled to a fixpoint | |
| Sliding-window parallel dispatch (concurrency cap + hot-file cap) | |
| Per-task worktrees off the epic integration branch + single-flight merge-back | |
| Blocker beads (the escalation currency: notify + quarantine + continue) | |
| Model tiering across the coordinator's roles (below) | |

**Review and test policy.** Each task gets one deliberately light review; detailed code review is
`super-roast`'s job (PR mode), not this skill's. Critical and Important findings get one fix pass,
then the task merges with no re-review; Minor findings go to the ledger. Tests run once per task, in
the implementer step, and only the task-relevant ones; the reviewer checks the reported evidence and
does not re-run them. No tests run per merge; each merge runs only a build-only compile/typecheck on the merged tree (`config.mergeCheck`), which catches cross-branch compile seams no task's own tests can see. Finish runs the full suite once (the sweep), unless the caller owns it (`deferSweep`).

## Trigger rule

Any beads-backed execution. `subagent-driven-development` handles plan-file execution. The moment there is a `bd` epic, super-code runs it — autonomous or interactive, same coordinator contract.

## Invocation

A caller supplies these — none are inferable from the repo:

| Input | Meaning |
|---|---|
| `epicId` | the root epic to drain, and **the epic whose closure means this run is done**. It is the root the design used — **never a child narrowed to at execution time**: draining a sub-epic closes the sub-epic and leaves the real root open, so the run can never report completion however much work landed (`super-design`'s §The run's root epic). Its tree is the scope — see `./coordinator-workflow.md`'s Ready phase for how membership is resolved when the `sp:` label is absent |
| `integrationBranch` | conventionally `epic-<epicId>-integration`. **The caller creates the branch; this skill creates neither it nor its worktree**, and fails if either is missing |
| integration worktree | the checkout of `integrationBranch` this skill works in — passed as `integrationWorktree` in the coordinator contract (optional, additive). A caller that created the worktree itself (`super-auto`'s run worktree, any native-tool worktree) **must pass its path**: when omitted, the coordinator derives `.worktrees/<integrationBranch>` with any `/` in the branch name collapsed to `-`, which only matches worktrees created by this skill's own pre-flight convention — a slashed branch like `super-auto/<slug>` makes the derived path wrong by construction for any externally-created worktree (`./coordinator-workflow.md`'s "Coordinator contract") |
| mode | autonomous or interactive. Same contract either way — mode changes who answers a blocked task, never what gets reviewed |
| who owns the finish | **state it explicitly if the caller owns it.** There is no config flag. Left unsaid, this skill runs its own Finish: it merges the integration branch and deletes the worktree — taking the ledger and the per-task reports with it, which is where a caller's report gets its sources |
| `config.models`, `config.concurrency`, `config.hotFileCap`, `config.topUpQueryCap`, `config.edgeAuditCap` | optional; see Model tiering and Parallelism below for what they default to and why an explicit map is preferred |
| `config.sweep` | optional: the exact full-suite command Finish runs once against the integration tip, envelope included (`nice`, thread caps — whatever `AGENTS.md` requires of every command). Undeclared, pre-flight resolves the project's full test command into it, so the `Launch:` line records it. The sweep always runs when work landed (`./coordinator-workflow.md`'s "Finish"). There is no per-merge gate; a `config.gate` is ignored with a log line |
| `config.mergeCheck` | optional: the exact BUILD-ONLY command (compile/typecheck, envelope included — `cargo check --all-targets`, `tsc --noEmit`, `go build ./...`) the merge agent runs on the merged tree at every serial merge. **Never a test command.** Undeclared, pre-flight resolves the project's build/typecheck step into it, or `'none'` when the project has none (then no check runs); the `Launch:` line records which. A failing check takes the merge-failure blocker path |
| `deferSweep` | optional: `true` when the caller runs the full-suite sweep itself (`super-auto` does, after its fix loop). Finish skips the sweep, the final review is told it was deferred, and `sweep` returns `SWEEP DEFERRED (caller-owned)` |
| `config.testPaths` | optional, additive: an array of git pathspecs that **replaces** the default test-file pathspec list wholesale for the `Test changes` check the task review and the seam review run. An empty array is rejected at pre-flight (defaults retained, a warning logged) rather than silently disabling the check |
| standing authorisation | the operation classes every dispatched agent will run — worktree add/remove, rebase, `merge --no-ff`, `branch -D`, `bd create`/`close`/`comment`, the project's setup step, build/typecheck (`mergeCheck`) and test commands — must be allowed before launch. Pre-flight step 5 probes each one side-effect-free. A refusal mid-run is not recoverable by any agent: the task is quarantined for the run with a `BLOCKED-AUTH` ledger line and reported as untested scope |

It returns six buckets — `completed`, `escalated`, `pendingRetry`, `parked`, `stalled`, `review` —
covering **the epic's whole tree as of return, not only the tasks this invocation dispatched** (a
resumed epic's previously-closed tasks appear in `completed`) — **plus the ledger path** inside the
integration worktree, because a caller's report cites ledger completion lines and no other channel
names where they live.
Every task lands in exactly one of the first four; `parked` is a modifier on `completed` (merged
with a Critical/Important review finding the fix pass declined, reason on the ledger), not a fifth
outcome. A caller that records run state records
these verbatim. The return also carries **`stopReason`** — `root-closed` (the one true
completion), `ready-drained` (empty ready set, root still open: quarantined blockers remain),
`stalled` (no-progress guard), or `ready-unavailable` / `plan-unavailable` (infrastructure outage:
the `bd ready` or planner dispatch kept dying on terminal API errors). The last two are **never**
completion — never treat a stop as "done" without checking `stopReason`
(`./coordinator-workflow.md`'s "Null dispatch policy"). Three additive fields: **`authRefused`** —
tasks quarantined because the harness permission layer refused their commands (also in
`escalated`); a caller's report lists them as untested scope — **`sweep`**, the full-suite
sweep's one-line result, starting with the tip SHA it measured, whenever work landed
(`MEASUREMENT INVALID: …`, `SWEEP UNAVAILABLE …` or `SWEEP DEFERRED (caller-owned)` mean the branch
is unmeasured here, not green) —
and **`metrics`**, an array of exactly four `Metrics:` ledger-line strings (merge/rebase/seam/
check-failure counts; completion kinds; fix-pass outcomes; and a ledger-check cross-checking the merge count
against `completed.size`), written unconditionally at Finish, before the final review
(`./coordinator-workflow.md`'s "Finish").

## Worktree topology

Per-task worktrees branch from the epic integration branch (not from `main`, not from a plan-file branch); on pass, each is merged back into the integration branch through the **single-flight merge queue** — exactly one merge in flight, in completion order, enqueued the instant a task's own chain ends (a `bd ready` batch is mutually independent, so within-round order carries no dependency meaning). New ready tasks branch from the updated integration branch, so dependents inherit prior work. The merge rebases first; when the rebase lands the task on sibling commits that touched the **same files**, one scoped **seam review** of the rebased branch runs before the merge (and at most one fix) — the task review approved the task against a base the branch has since left. No tests run at merge; the merge agent runs only the build-only `config.mergeCheck` on the merged tree before committing the merge. Every merge attempt — success or the blocker-bead failure path — appends one `Merge: <id> — rebase <clean | conflict: N files> · seam-review <none | cleared | fixed> · check <pass | fail | none>` ledger line (trailing ` → blocker` on the failure path); see `./coordinator-workflow.md`'s "Serial merge-back". A fresh task worktree is not "isolated" until its test runner and the package under test resolve *inside* it: the brief step runs the project's setup there and checks provenance before the implementer is dispatched (a worktree whose entrypoints import another checkout tests the wrong code). Full three-layer topology (user's worktree / integration worktree / per-task worktrees) and the Workflow-coordinated procedure: `./coordinator-workflow.md`.

## Model tiering

Every role below has a tier; a caller may override any of them via `config.models` — least powerful model that can handle the judgment the role requires. The table is the source of truth for the count; do not restate it as a number in prose:

| Role | Model | Why |
|---|---|---|
| `planner` | opus | Materializes `<epicId>-plan.md` from the beads tree once per epic (judgment: dependency ordering, `filesTouched` extraction, ordinal assignment) |
| `triage` | opus | RESOLVE vs ESCALATE on a blocker bead, and the report-only dependency-edge audit |
| `finalReview` | opus | Whole-epic review against the integration branch before hand-off |
| `implementer` | sonnet | Per-task implementation, the fix pass, and the seam fix |
| `reviewer` | sonnet | The per-task review, the seam review, and the merge agent |
| `mechanical` | sonnet | Deterministic, no-improvisation dispatches that carry no judgment: `bd ready` queries, `task-brief` extraction, notifications, recording a clarification, ledger reads/appends, the sweep, filing a blocker bead once BLOCKED has already been decided, and the epic-closure fixpoint (`./scripts/close-in-tree-epics`) |

`mechanical` and `triage` are deliberately separate: `triage` names the opus judgment calls; `mechanical` is everything with a fully-specified procedure. A `config.models.fixEscalation` key from older callers is ignored (there are no escalation rounds).

## Parallelism

**`subagent-driven-development`'s "Never dispatch multiple implementation subagents in parallel
(conflicts)" does not apply here.** That rule is correct for SDD, where every task shares one
working tree. Here each task gets its own worktree off the integration branch, so concurrent
implementers cannot collide on disk, and merges stay serial.

**Dispatch is not gated on file overlap, and rounds do not gate refill.** Every ready task dispatches as soon as a slot frees,
bounded by `config.concurrency` (default 16, matching the Workflow runtime's fixed per-workflow
agent cap of `min(16, cores-2)` — the runtime queues anything over-admitted, so the effective
default is exactly that formula on every machine) as a **sliding window** — never as batches with
barriers between them — and each task's integration joins a **single-flight merge queue the
instant its own chain ends**, draining in completion order while siblings still run. Exactly one
merge touches the integration branch at any moment, guaranteed by chaining, not batching.
`filesTouched` (from the planner's per-task mapping) survives as one scheduling constraint: at
most `config.hotFileCap` (default 3) in-flight tasks may declare the same file, which bounds
worst-case rebase churn on a shared barrel/index/registry without collapsing the frontier. A task
with no declared files dispatches normally — isolation makes dispatch-time collision impossible.
Each successful merge fires a **mid-round top-up** — an epic-close pass (the just-closed bead may
have been its epic's last open child, and an unclosed epic hides every epic-edge dependent)
followed by a ready re-query that dispatches newly-unblocked, already-mapped beads into the same
round's window, so dependents overlap the merge drain instead of waiting for the next round.
The round head is overlapped too: Close and Ready dispatch concurrently (with one post-closure
re-check when Close closed in-tree epics), the opus planner is skipped on rounds whose ready ids
are all already mapped, and a RESOLVE-triaged blocker retries within the round it was triaged in.
A `Seam contract:` bead (super-design's §Coverage) legitimately declares files on **both** sides
of its boundary — that is its job, not over-declaration; it merges before its dependents by
construction, so its span never contends with them.

**Serialization is a cost, and it has a detector.** Every round the coordinator logs
effective parallelism against the cap (`parallelism: N ready · cap C · peak in-flight P`) with
hot-file deferrals named per file, and points at the cause when it degrades: over-declared
`filesTouched` (`./planner-prompt.md`), dependency edges encoding narrative order rather than
genuine blocking (`super-design`'s §Decomposition), or one shared file — a barrel, an index, a
registry — that every task touches and that should be split or assigned to a single task.
A ready set that stays small against many open beads has one more cause the leaf graph cannot
show: an **epic-level edge** — `bd ready` honors epic→epic blocking, so a leaf whose own deps
are all closed can still be refused for days (measured: 11.4 days on one leaf). When ready looks
starved, check the open leaves' ancestor epics for blocking deps (`bd show <epic> --json`); a
whole-epic gate whose dependents really need specific leaves is a design defect — narrow it to
leaf-level edges (super-design's fifth edge rule) rather than waiting it out.
The detector line is persisted to the ledger every round (`Detector: round N — …`), so a run's
parallelism is recoverable after the fact — and a round with no line is *unmeasured*, not clean.
**Depth, not width, is the usual ceiling** — measured: 1.00 agents per bead in flight over two
hours, and raising a cap 4 → 14 bought 1.5×, not 3.5× — so when the frontier stays under the cap
for two consecutive rounds the coordinator dispatches one **report-only edge audit**
(`config.edgeAuditCap`, default 3 per invocation): remaining critical-path depth, the achievable
width (open leaves / depth) against the cap, and suspect edges by super-design's edge rules,
written to the ledger. It removes nothing; three operator-applied audits on one run took the
critical path 16 → 11 → 9 → 8 rounds, and that reshaping stays the operator's decision.
Rationale, measured evidence, and counter-evidence for this dispatch model:
`./coordinator-workflow.md`'s Implement-phase relaxation comment.

## Red Flags

**Never:**
- Edit `skills/subagent-driven-development/` — it must stay byte-identical to upstream. Adapt this skill's own `./implementer-prompt.md` / `./task-reviewer-prompt.md` instead.
- Query `bd ready` and trust its output as scoped to this epic without either the `--label
  sp:<epicId>` fast path or, when that comes up empty, the structural parent-child fallback filter
  (`./scripts/ready-in-tree`, which filters through `./scripts/epic-tree`) — bare `bd ready` is
  repo-global and epic-inclusive, and an empty labelled result does not by itself mean the tree has
  no ready work (the label only exists on trees `super-design` created).
- Treat an empty ready set as run completion — completion is the root epic (`epicId`) closed; an empty set with the root still open means the remaining work is quarantined blockers, not done.
- Silently drop a blocked task — file a blocker bead (notify + quarantine + continue; the run never hard-stops on one stuck task).
- Give a task a second review or a second fix pass — one review, at most one fix pass (Critical/Important only), then merge.
- Merge a task whose review verdict is anything but `CLEAN` without its fix pass — an unrecognized verdict gets the fix pass, never a silent merge.
- Run tests at merge time, or have a reviewer or merge agent re-run a task's tests — no per-merge tests; the merge runs only the build-only `mergeCheck`. The implementer's reported run is the task's evidence, and Finish's sweep is the branch's.
- Declare a test command as `config.mergeCheck`, or edit code or tests at the merge to make a failing check pass — a failing check is a blocker bead.
- Run two merges into the integration branch concurrently, or let anything bypass the single-flight merge queue — exactly one merge in flight, ever, is the invariant that makes concurrent implementers safe.
- Hold completed tasks' merges behind a batch or round barrier — each task's integration is enqueued the instant its own chain ends; a straggler must never block its finished siblings from merging.
- Exceed `config.hotFileCap` concurrently-dispatched tasks declaring the same file — overlap is allowed, unbounded hot-file pile-ups are not.
- Patch `scripts/task-brief` to accept bead ids directly, or collapse the ordinal ↔ bead-id mapping — SDD's `task-brief` only matches integer `## Task <N>` headings, not bead ids.
- Treat a null `agent()` result as a result — the Workflow runtime returns null when a subagent dies on a terminal API error after retries, and every dispatch class has its own explicit null semantic (`./coordinator-workflow.md`'s "Null dispatch policy"); most defaults fabricate success (a null merge is not a failed merge, a null ready query is not an empty ready set, a null close-epics never closed the root).
- File a blocker bead with anything besides the bare `blocker` label — an `sp:` label or a `--parent` makes the escalation record reachable as work and starts a self-sustaining blocker-filing loop (one new bead per round, reproduced live).
- Dispatch a reviewer without [BRIEF_FILE]/[REPORT_FILE]/[DIFF_FILE]/[REVIEW_FILE] filled with absolute, integration-workspace paths — a reviewer without the implementer's report reviews blind, and a fixer without the review file fixes blind.

## Friction log & upstream feedback

Throughout a run, append friction events (defects hit, workarounds, guidance that read wrong, visible stalls) to the enclosing run's friction log — `<workspace>/friction.md` beside the ledger when this skill is the outermost invocation — per `superpowers:upstream-feedback`'s format, the moment they happen. When this skill is the outermost invocation and owns its own Finish, invoke `superpowers:upstream-feedback` after the final review; when a caller owns the finish, only append — the caller's own hook runs the analysis. **When nested under a caller** (e.g. `super-auto`'s phase 3), append to the friction-log path the caller passed — `super-auto` passes `<run-dir>/friction.md`. **When no path was passed, skip appending** rather than inventing a location — a nested invocation has no committed directory of its own to write into.

## Reference

- `./coordinator-workflow.md` — full Workflow-coordinated autonomous procedure: coordinator contract, the coordinator loop, plan materialization, per-task pipeline, serial merge-back, the blocker-bead path, finish. Its "Known limitations" section lists real, shipped gaps — read it before assuming any of them already work. Validation is dryRun/replay-based (`tests/super-code/test-coordinator-replay.sh` — replays the recorded scenarios plus null-injection and prompt-text checks no dryRun can express); anything beyond what that harness asserts is live-run territory. Its "Finish" section documents a caller-owned-finish mode: a caller may keep the merge-and-cleanup hand-off for itself, in which case the coordinator stops after its final review and leaves the integration worktree and ledger intact.
- `./planner-prompt.md` — dispatch the per-epic planner (opus) that materializes `<epicId>-plan.md` from the beads tree.
- `./implementer-prompt.md` — the implementer's brief (sonnet), including the fix pass.
- `./task-reviewer-prompt.md` — the per-task reviewer's brief (sonnet).
- `./triage-prompt.md` — dispatch the blocker triage agent (opus): RESOLVE vs ESCALATE.
- `./scripts/already-merged` — `bash` helper the brief stage runs to answer whether a re-entered task branch is already merged.
- `./scripts/epic-tree`, `./scripts/ready-in-tree`, `./scripts/close-in-tree-epics`, `./scripts/edge-stats` — `bash` helpers for structural tree membership, the epic-scoped ready query, the in-tree epic-closure fixpoint, and the edge audit's graph numbers. They parse `bd` JSON with `jq` when it is installed; without it they print a `JQ_UNAVAILABLE:` line telling the agent how to compute the same result by hand.
- `./trigger-micro-test.md` — the frontmatter description's probe set; re-run it before changing the description. Maintenance-only, deliberately outside this file.

