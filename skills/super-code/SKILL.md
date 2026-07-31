---
name: super-code
description: Use when executing a beads (`bd`) epic as a work queue — autonomous or interactive. Not for running a hand-written plan file task by task (that is subagent-driven-development) and not for ad-hoc parallel investigation with no shared epic or work queue (that is dispatching-parallel-agents).
---

# super-code

Drive a beads epic to completion: an epic-scoped `bd ready` loop, disjoint-file parallel dispatch, per-task worktrees off an epic integration branch with serial merge-back, and blocker beads for anything that can't proceed — autonomous (Workflow-coordinated) or interactive (manual ready-driven loop), same contract either way.

**Core principle:** tasks coordinate only through beads and the integration branch, never through session memory. An interrupted epic resumes from the ledger, not from coordinator memory.

## Boundary

**Governing rule:** *If a change would improve per-task review quality, it belongs upstream in `subagent-driven-development`, not here. super-code may only grow in the epic-level dimension.*

| super-code owns | Delegates to `subagent-driven-development` |
|---|---|
| The coordinator (Workflow-coordinated autonomous loop, or the manual ready-driven fallback) | `task-brief` → implementer → `review-package` → task-reviewer → scoped re-review → ledger |
| The epic-scoped `bd ready` loop, refilled to a fixpoint | |
| The fix loop's autonomous **sequencing** — round counting, dispatching every fix/re-review round, invoking the cap's adjudicator (a dispatched agent) rather than adjudicating inline, filing the blocker bead on a BLOCKED verdict | The fix loop's **rubric** — the resume-then-escalate-model structure, the ADDRESSED/NOT-ADDRESSED vocabulary, and the load-bearing-vs-park criteria the cap adjudicator follows verbatim (`subagent-driven-development/SKILL.md`'s "The fix loop" / "The breaker") |
| Disjoint-file batching for parallel dispatch | The helper scripts (`scripts/task-brief`, `scripts/review-package`, `scripts/sdd-workspace`) |
| Per-task worktrees off the epic integration branch + serial merge-back | The plan-scoped workspace / ledger format |
| Blocker beads (the escalation currency: notify + quarantine + continue) | |
| Model tiering across the coordinator's roles (below) | |

## Trigger rule

Any beads-backed execution. `subagent-driven-development` handles plan-file execution. The moment there is a `bd` epic, super-code runs it — autonomous or interactive, same coordinator contract.

## Worktree topology

Per-task worktrees branch from the epic integration branch (not from `main`, not from a plan-file branch); on pass, each is merged back into the integration branch **serially**, in dependency order. New ready tasks branch from the updated integration branch, so dependents inherit prior work. Full three-layer topology (user's worktree / integration worktree / per-task worktrees) and the Workflow-coordinated procedure: `./coordinator-workflow.md`.

## Model tiering

Every role below is set explicitly in `config.models` — except `fixEscalation`, which is optional and additive (falls back to `triage`'s tier when omitted; see `./coordinator-workflow.md`'s "Coordinator contract") — least powerful model that can handle the judgment the role requires. The table is the source of truth for the count; do not restate it as a number in prose:

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

Concurrent dispatch only when declared file sets are disjoint (`filesTouched`, from the planner's per-task mapping). Two ready tasks that share a file serialize — never siblings in the same dispatch. A task with no declared files runs alone (fail safe: an incomplete declaration costs serialization, never a write collision). Buckets of disjoint-file tasks serialize relative to each other; concurrency within a bucket is capped at `config.concurrency` (default 4) — a bucket larger than the cap runs as sequential sub-batches, not one unbounded dispatch.

## Red Flags

**Never:**
- Edit `skills/subagent-driven-development/` — it must stay byte-identical to upstream.
- Copy SDD's reviewer prompts into this skill, or reinvent per-task review mechanics here.
- Query `bd ready` without `--exclude-type=epic --label sp:<epicId>` — bare `bd ready` is repo-global and epic-inclusive.
- Treat an empty ready set as run completion — completion is the root epic (`epicId`) closed; an empty set with the root still open means the remaining work is quarantined blockers, not done.
- Silently drop a blocked task — file a blocker bead (notify + quarantine + continue; the run never hard-stops on one stuck task).
- Let a fix loop run past SDD's five-round breaker — at the cap, dispatch the adjudicator and either park with a ruling or file a blocker bead, never retry past round 5.
- Treat any re-review verdict other than the literal token `CLEAN` as safe to merge — fail closed: an unrecognized or differently-worded verdict keeps looping (bounded by the round cap), it never falls through to `mergePrompt`.
- Dispatch parallel implementers whose declared file sets overlap.
- Patch `scripts/task-brief` to accept bead ids directly, or collapse the ordinal ↔ bead-id mapping — SDD's `task-brief` only matches integer `## Task <N>` headings, not bead ids.

## Reference

- `./coordinator-workflow.md` — full Workflow-coordinated autonomous procedure: coordinator contract, the coordinator loop, plan materialization, per-task pipeline, the breaker's autonomous variant, serial merge-back, the blocker-bead path, finish.
- `./planner-prompt.md` — dispatch the per-epic planner (opus) that materializes `plan.md` from the beads tree.
- `./triage-prompt.md` — dispatch the blocker triage agent (opus): RESOLVE vs ESCALATE.

## Trigger micro-test

Three fresh haiku subagents, each given *only* this skill's frontmatter description plus one scenario, asked "would you invoke this skill? yes/no." Re-run all three on any miss.

| Probe | Scenario | Expected | Result |
|---|---|---|---|
| (a) | "run the epic in beads — build out all the ready tasks" | yes | yes |
| (b) | "execute this implementation plan task by task, review between tasks" | no (that is SDD) | no |
| (c) | "spin up a few agents to investigate why these three tests are flaky" | no (that is dispatching-parallel-agents) | no |

All three matched on the first pass; the description was not tightened. A future editor changing the description should re-run this probe set before merging.
