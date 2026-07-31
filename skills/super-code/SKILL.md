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
| The epic-scoped `bd ready` loop, refilled to a fixpoint | The five-round fix-loop breaker |
| Disjoint-file batching for parallel dispatch | The helper scripts (`scripts/task-brief`, `scripts/review-package`, `scripts/sdd-workspace`) |
| Per-task worktrees off the epic integration branch + serial merge-back | The plan-scoped workspace / ledger format |
| Blocker beads (the escalation currency: notify + quarantine + continue) | |
| Model tiering across the coordinator's roles (below) | |

## Trigger rule

Any beads-backed execution. `subagent-driven-development` handles plan-file execution. The moment there is a `bd` epic, super-code runs it — autonomous or interactive, same coordinator contract.

## Worktree topology

Per-task worktrees branch from the epic integration branch (not from `main`, not from a plan-file branch); on pass, each is merged back into the integration branch **serially**, in dependency order. New ready tasks branch from the updated integration branch, so dependents inherit prior work. Full three-layer topology (user's worktree / integration worktree / per-task worktrees) and the Workflow-coordinated procedure: `./coordinator-workflow.md`.

## Model tiering

Every role below is set explicitly in `config.models` (the table is the source of truth for the count — do not restate it as a number in prose) — least powerful model that can handle the judgment the role requires:

| Role | Model | Why |
|---|---|---|
| `planner` | opus | Materializes `plan.md` from the beads tree once per epic (judgment: dependency ordering, `filesTouched` extraction, ordinal assignment) |
| `triage` | opus | Decides RESOLVE vs ESCALATE on a blocker bead — the one genuine judgment call in the escalation path |
| `finalReview` | opus | Whole-epic review against the integration branch before hand-off |
| `implementer` | sonnet | Per-task implementation |
| `reviewer` | sonnet | Per-task spec-compliance + quality review, and the merge agent |
| `mechanical` | sonnet | Deterministic CLI-echo dispatches that carry no judgment: `bd epic close-eligible`, `bd ready` queries, `task-brief` extraction, notifications, recording a clarification |

`mechanical` and `triage` are deliberately separate: `triage` names only the opus RESOLVE/ESCALATE call; `mechanical` is everything that just echoes a command or a fixed message. Full rationale: `./coordinator-workflow.md` ("Coordinator contract").

## Parallelism

Concurrent dispatch only when declared file sets are disjoint (`filesTouched`, from the planner's per-task mapping). Two ready tasks that share a file serialize — never siblings in the same dispatch. A task with no declared files runs alone (fail safe: an incomplete declaration costs serialization, never a write collision). Buckets of disjoint-file tasks serialize relative to each other; concurrency within a bucket is capped at ~4.

## Red Flags

**Never:**
- Edit `skills/subagent-driven-development/` — it must stay byte-identical to upstream.
- Copy SDD's reviewer prompts into this skill, or reinvent per-task review mechanics here.
- Silently drop a blocked task — file a blocker bead (notify + quarantine + continue; the run never hard-stops on one stuck task).
- Let a fix loop run past SDD's five-round breaker — at the cap, file a blocker bead instead of retrying.
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
