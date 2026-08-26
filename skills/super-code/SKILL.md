---
name: super-code
description: Use when executing a beads (`bd`) epic as a work queue — autonomous or interactive. Not for running a hand-written plan file task by task (that is subagent-driven-development) and not for ad-hoc parallel investigation with no shared epic or work queue (that is dispatching-parallel-agents).
---

# super-code

Drive a beads epic to completion: an epic-scoped `bd ready` loop, sliding-window parallel dispatch with single-flight merge-back, per-task worktrees off an epic integration branch, and blocker beads for anything that can't proceed — autonomous (Workflow-coordinated) or interactive (manual ready-driven loop), same contract either way.

**Core principle:** tasks coordinate only through beads and the integration branch, never through session memory. An interrupted epic resumes from the ledger, not from coordinator memory.

## Boundary

**Governing rule:** *If a change would improve per-task review quality, it belongs upstream in `subagent-driven-development`, not here. super-code may only grow in the epic-level dimension.*

| super-code owns | Delegates to `subagent-driven-development` |
|---|---|
| The coordinator (Workflow-coordinated autonomous loop, or the manual ready-driven fallback) | `task-brief` → implementer → `review-package` → task-reviewer → scoped re-review → ledger |
| The epic-scoped `bd ready` loop, refilled to a fixpoint | |
| The fix loop's autonomous **sequencing** — round counting, dispatching every fix/re-review round, invoking the cap's adjudicator (a dispatched agent) rather than adjudicating inline, filing the blocker bead on a BLOCKED verdict | The fix loop's **rubric** — the resume-then-escalate-model structure, the ADDRESSED/NOT-ADDRESSED vocabulary, and the load-bearing-vs-park criteria the cap adjudicator follows verbatim (`subagent-driven-development/SKILL.md`'s "The fix loop" / "The breaker") |
| Sliding-window parallel dispatch (concurrency cap + hot-file cap) | The helper scripts (`scripts/task-brief`, `scripts/review-package`, `scripts/sdd-workspace`) |
| Per-task worktrees off the epic integration branch + single-flight merge-back | The plan-scoped workspace / ledger format |
| Blocker beads (the escalation currency: notify + quarantine + continue) | |
| Model tiering across the coordinator's roles (below) | |

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
| `config.models`, `config.concurrency`, `config.hotFileCap` | optional; see Model tiering and Parallelism below for what they default to and why an explicit map is preferred |

It returns six buckets — `completed`, `escalated`, `pendingRetry`, `parked`, `stalled`, `review` —
covering **the epic's whole tree as of return, not only the tasks this invocation dispatched** (a
resumed epic's previously-closed tasks appear in `completed`) — **plus the ledger path** inside the
integration worktree, because a caller's report cites ledger completion lines and no other channel
names where they live.
Every task lands in exactly one of the first four; `parked` is a modifier on `completed` (merged
over an overruled review finding), not a fifth outcome. A caller that records run state records
these verbatim. The return also carries **`stopReason`** — `root-closed` (the one true
completion), `ready-drained` (empty ready set, root still open: quarantined blockers remain),
`stalled` (no-progress guard), or `ready-unavailable` / `plan-unavailable` (infrastructure outage:
the `bd ready` or planner dispatch kept dying on terminal API errors). The last two are **never**
completion — never treat a stop as "done" without checking `stopReason`
(`./coordinator-workflow.md`'s "Null dispatch policy").

## Worktree topology

Per-task worktrees branch from the epic integration branch (not from `main`, not from a plan-file branch); on pass, each is merged back into the integration branch through the **single-flight merge queue** — exactly one merge in flight, in completion order, enqueued the instant a task's own chain ends (a `bd ready` batch is mutually independent, so within-round order carries no dependency meaning). New ready tasks branch from the updated integration branch, so dependents inherit prior work. Full three-layer topology (user's worktree / integration worktree / per-task worktrees) and the Workflow-coordinated procedure: `./coordinator-workflow.md`.

## Model tiering

Every role below has a tier; a caller may override any of them via `config.models` — `fixEscalation` is additionally optional and additive (falls back to `triage`'s tier when omitted; see `./coordinator-workflow.md`'s "Coordinator contract") — least powerful model that can handle the judgment the role requires. The table is the source of truth for the count; do not restate it as a number in prose:

| Role | Model | Why |
|---|---|---|
| `planner` | opus | Materializes `plan.md` from the beads tree once per epic (judgment: dependency ordering, `filesTouched` extraction, ordinal assignment) |
| `triage` | opus | The two genuine judgment calls in the blocker path: RESOLVE vs ESCALATE on a blocker bead, and PARK vs BLOCKED when the fix-loop breaker caps at round 5 |
| `finalReview` | opus | Whole-epic review against the integration branch before hand-off |
| `implementer` | sonnet | Per-task implementation |
| `reviewer` | sonnet | Per-task spec-compliance + quality review, and the merge agent |
| `mechanical` | sonnet | Deterministic, no-improvisation dispatches that carry no judgment: `bd ready` queries, `task-brief` extraction, notifications, recording a clarification, filing a blocker bead once BLOCKED has already been decided, and the epic-closure fixpoint (a stated filter + a fixed stop rule, not a bare CLI echo — see `./coordinator-workflow.md`'s `closeEpicsPrompt`) |
| `fixEscalation` | opus (optional; defaults to `triage`'s tier) | Rounds 4-5 of the fix loop, dispatched on a fresh implementer — a capability bump for a stuck implementer, **not** a judgment call, so it is deliberately not `triage` even though the default tier is the same |

`mechanical`, `triage`, and `fixEscalation` are deliberately separate: `triage` names only the opus RESOLVE/ESCALATE and PARK/BLOCKED judgment calls; `fixEscalation` names the fix loop's model-capability bump, which carries no judgment of its own; `mechanical` is everything with a fully-specified, no-branching-on-judgment procedure — whether that's a literal command echo or a short fixed algorithm with worked examples removing all ambiguity. Full rationale: `./coordinator-workflow.md` ("Coordinator contract").

## Parallelism

**This skill overrides `subagent-driven-development`'s "Never dispatch multiple implementation
subagents in parallel (conflicts)" — read this before dispatching anything.** That rule is correct
*for SDD*, where every task shares one working tree, so two implementers collide on the tree itself
whatever files they touch. Here each task gets **its own worktree** off the integration branch, so
the premise does not hold and the prohibition does not carry. The override is scoped to **dispatch
concurrency only**: every other part of SDD's Task Loop — the brief, the report contract, the review
package, the five-round fix breaker, serial merge-back — is inherited unchanged. Left unstated, an
agent following this skill's own instruction to run SDD's per-task pipeline reads an absolute
prohibition on the one thing this skill exists to do, and silently serializes the epic.

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
Each successful merge fires a **mid-round top-up** — a ready re-query that dispatches
newly-unblocked, already-mapped beads into the same round's window, so dependents overlap the
merge drain instead of waiting for the next round.
A `Seam contract:` bead (super-design's §Coverage) legitimately declares files on **both** sides
of its boundary — that is its job, not over-declaration; it merges before its dependents by
construction, so its span never contends with them.

**Serialization is a cost, and it has a detector.** Every round the coordinator logs
effective parallelism against the cap (`parallelism: N ready · cap C · peak in-flight P`) with
hot-file deferrals named per file, and points at the cause when it degrades: over-declared
`filesTouched` (`./planner-prompt.md`), dependency edges encoding narrative order rather than
genuine blocking (`super-design`'s §Decomposition), or one shared file — a barrel, an index, a
registry — that every task touches and that should be split or assigned to a single task.
Rationale, measured evidence, and counter-evidence for this dispatch model:
`./coordinator-workflow.md`'s Implement-phase relaxation comment.

## Red Flags

**Never:**
- Edit `skills/subagent-driven-development/` — it must stay byte-identical to upstream.
- Copy SDD's reviewer prompts into this skill, or reinvent per-task review mechanics here.
- Query `bd ready` and trust its output as scoped to this epic without either the `--label
  sp:<epicId>` fast path or, when that comes up empty, the structural parent-child fallback filter
  (`./coordinator-workflow.md`'s `readyPrompt`/`treeMembershipTest`) — bare `bd ready` is
  repo-global and epic-inclusive, and an empty labelled result does not by itself mean the tree has
  no ready work (the label only exists on trees `super-design` created).
- Treat an empty ready set as run completion — completion is the root epic (`epicId`) closed; an empty set with the root still open means the remaining work is quarantined blockers, not done.
- Silently drop a blocked task — file a blocker bead (notify + quarantine + continue; the run never hard-stops on one stuck task).
- Let a fix loop run past SDD's five-round breaker — at the cap, dispatch the adjudicator and either park with a ruling or file a blocker bead, never retry past round 5.
- Treat any re-review verdict other than the literal token `CLEAN` as safe to merge — fail closed: an unrecognized or differently-worded verdict keeps looping (bounded by the round cap), it never falls through to `mergePrompt`.
- Run two merges into the integration branch concurrently, or let anything bypass the single-flight merge queue — exactly one merge in flight, ever, is the invariant that makes concurrent implementers safe.
- Hold completed tasks' merges behind a batch or round barrier — each task's integration is enqueued the instant its own chain ends; a straggler must never block its finished siblings from merging.
- Exceed `config.hotFileCap` concurrently-dispatched tasks declaring the same file — overlap is allowed, unbounded hot-file pile-ups are not.
- Patch `scripts/task-brief` to accept bead ids directly, or collapse the ordinal ↔ bead-id mapping — SDD's `task-brief` only matches integer `## Task <N>` headings, not bead ids.
- Treat a null `agent()` result as a result — the Workflow runtime returns null when a subagent dies on a terminal API error after retries, and every dispatch class has its own explicit null semantic (`./coordinator-workflow.md`'s "Null dispatch policy"); most defaults fabricate success (a null merge is not a failed merge, a null ready query is not an empty ready set, a null close-epics never closed the root).
- File a blocker bead with anything besides the bare `blocker` label — an `sp:` label or a `--parent` makes the escalation record reachable as work and starts a self-sustaining blocker-filing loop (one new bead per round, reproduced live).
- Dispatch a reviewer without [BRIEF_FILE]/[REPORT_FILE]/[DIFF_FILE] filled with absolute, integration-workspace paths — SDD's reviewer templates hard-require all three, and a reviewer without the implementer's report reviews blind.

## Reference

- `./coordinator-workflow.md` — full Workflow-coordinated autonomous procedure: coordinator contract, the coordinator loop, plan materialization, per-task pipeline, the breaker's autonomous variant, serial merge-back, the blocker-bead path, finish. Its "Known limitations" section lists real, shipped gaps — read it before assuming any of them already work. Validation is dryRun/replay-based (`tests/super-code/test-coordinator-replay.sh` — replays the recorded scenarios plus null-injection and prompt-text checks no dryRun can express); anything beyond what that harness asserts is live-run territory. Its "Finish" section documents a caller-owned-finish mode: a caller may keep the merge-and-cleanup hand-off for itself, in which case the coordinator stops after its final review and leaves the integration worktree and ledger intact.
- `./planner-prompt.md` — dispatch the per-epic planner (opus) that materializes `plan.md` from the beads tree.
- `./triage-prompt.md` — dispatch the blocker triage agent (opus): RESOLVE vs ESCALATE.
- `./trigger-micro-test.md` — the frontmatter description's probe set; re-run it before changing the description. Maintenance-only, deliberately outside this file.

