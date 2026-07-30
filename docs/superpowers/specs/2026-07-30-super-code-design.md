# super-code — Autonomous Beads-Driven Execution (design)

**Date:** 2026-07-30 · **Status:** approved design, pre-implementation
**Source content:** branch `pre-upstream-merge-backup` (the fork's pre-merge
`skills/subagent-driven-development/`), preserved when that skill was restored to upstream
6.2.0 in merge commit `ca62a0f`.

## Goal

Carry the fork's autonomous beads-driven execution capability in its own skill, so that
`subagent-driven-development` can stay byte-identical to upstream and keep inheriting upstream's
improvements, while the fork keeps the coordinator, worktree topology, and blocker-escalation
machinery it actually uses.

## Why

The fork had grown 8 commits of beads-mode content inside `subagent-driven-development`. Upstream
rewrote that skill substantially (239 commits: a scoped re-review prompt, a five-round fix
breaker, a plan-scoped `.superpowers/sdd/<plan>` workspace with a durable ledger, helper scripts,
and a different reviewer-prompt structure). Keeping the fork's additions inside that file meant
carrying a permanent, conflict-heavy divergence in a file upstream actively develops. Extracting
them removes the divergence entirely — the merge that motivated this restored SDD to upstream with
zero fork delta.

Two callers were left pointing at the removed capability; this design reclaims one and deletes
the other (see §4).

## §1 Boundary — what super-code owns

`skills/super-code/` owns **epic-level autonomous execution**. Upstream
`subagent-driven-development` continues to own **per-task mechanics**, unchanged and unforked.

**super-code owns:**
- The Workflow-script coordinator (pre-flight, the loop, serial merge-back, blocker path).
- The `bd ready` loop, scoped to an epic tree, with a close-eligible fixpoint.
- Disjoint-file parallel batching — tasks whose file sets do not overlap run concurrently,
  tasks touching the same file serialize; concurrency capped at ~4.
- Per-task worktree topology: worktrees branched off an epic integration branch, serial
  merge-back in dependency order.
- Blocker-bead escalation: notify, quarantine the blocked task, continue the rest.
- Autonomous model tiering: opus for planning, blocker triage, and the final whole-epic review;
  sonnet for implementation and the per-task reviews.

**super-code calls, and does not copy, SDD's per-task loop:**
`task-brief` → implementer → `review-package` → task-reviewer → scoped re-review → ledger,
including the five-round breaker and its adjudication rules, plus SDD's helper scripts and its
plan-scoped workspace.

**Governing rule (write this into SKILL.md):** if a change would improve *per-task review
quality*, it belongs upstream in `subagent-driven-development`, not here. super-code may only
grow in the epic-level dimension. This is what prevents it from re-growing into a fork of the
whole skill.

**Trigger:** any beads-backed execution. `subagent-driven-development` handles plan-file
execution; the moment there is a `bd` epic to execute, super-code runs it — autonomous or
interactive.

## §2 File layout

```
skills/super-code/
  SKILL.md                 # triggers, boundary, tiering, worktree topology, red flags
  coordinator-workflow.md  # coordinator reference: pre-flight, loop, per-task pipeline,
                           # serial merge-back, blocker-bead path, authoring pitfalls
  planner-prompt.md        # per-task planner (opus)
  triage-prompt.md         # blocker-bead triage / coordinator-brain (opus)
```

Ported from `pre-upstream-merge-backup:skills/subagent-driven-development/` and reconciled per
§3. **No reviewer prompts** — those come from SDD, by reference.

## §3 Reconciliation against current SDD

Porting the files is mechanical; reconciling them is the real work. The fork's content was
written against the pre-merge SDD and references machinery that no longer exists.

1. **Reviewer prompts.** `coordinator-workflow.md`'s per-task pipeline dispatches
   `spec-reviewer-prompt.md` then `code-quality-reviewer-prompt.md`. Both are deleted upstream.
   It must dispatch SDD's `task-reviewer-prompt.md`, then `re-review-prompt.md` against the
   scoped fix diff.
2. **Fix rounds.** The fork's loop had no cap. Adopt upstream's five-round breaker and its
   adjudication rules (park with a ruling, or stop on a load-bearing finding), so a task cannot
   loop indefinitely inside an autonomous run.
3. **Workspace and artifacts.** Use SDD's `scripts/sdd-workspace`, `scripts/task-brief`, and
   `scripts/review-package` rather than hand-rolled artifact paths, and write completion lines
   into SDD's durable ledger so an interrupted epic resumes from the ledger rather than from
   coordinator memory.
4. **Worktree topology stays fork-specific.** SDD assumes a single workspace; super-code's
   per-task worktrees off an epic integration branch, and the serial merge-back that follows,
   remain super-code's own and are not pushed upstream.

Where the fork's wording and upstream's wording collide, upstream's structure wins and the
fork's *intent* is re-expressed inside it — the same rule used to resolve the `ca62a0f` merge.

## §4 Callers

- **`skills/super-plan/SKILL.md` (lines 148, 183)** — currently hands off to
  `superpowers:subagent-driven-development` expecting a beads mode that no longer exists. Rewire:
  invoke `superpowers:super-code` when there is a beads epic; fall back to
  `superpowers:subagent-driven-development` (plan-file mode) in no-beads mode.
- **`skills/dispatching-parallel-agents/SKILL.md` (line 135)** — its beads-epic paragraph is
  **deleted**, not repointed. That skill is for ad-hoc independent investigation and debugging
  fan-out; routing structured implementation execution was out of its remit, and removing the
  pointer is the correct fix rather than redirecting it.

## §5 Validation and testing

- **Coordinator dryRun** with stubbed agents (the pattern that surfaced three real defects during
  the super-roast build), asserting: `bd ready` ordering scoped to the epic tree; disjoint-file
  batching (two same-file tasks serialize, two disjoint tasks parallelize); per-task pipeline
  dispatch in the correct sequence; serial merge-back order; and the blocker-bead path notifying
  and continuing rather than freezing the run.
- **No live epic execution.** A real multi-task run costs on the order of the super-roast live
  runs; the dryRun covers the structural failure class that actually bites.
- **Trigger micro-test** on the frontmatter description — three probes: beads-epic execution
  (expect fire), plan-file plan execution (expect no fire, SDD's job), ad-hoc parallel
  investigation (expect no fire).
- **Reference integrity check:** no live reference anywhere to the deleted
  `spec-reviewer-prompt.md` / `code-quality-reviewer-prompt.md`, and
  `skills/subagent-driven-development/` remains byte-identical to `upstream/main`.

## Out of scope

- Changing SDD itself. Any per-task improvement goes upstream, not into this fork.
- Live multi-task epic validation (see §5).
- Re-litigating the merge decisions in `ca62a0f`.
