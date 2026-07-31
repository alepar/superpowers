---
name: super-auto
description: Use when taking a feature from a raw idea all the way to finished code in one invocation, optionally unattended. Not for reviewing an existing PR or design (that is super-roast) and not for executing an epic that already has a task tree (that is super-code).
---

# super-auto

Drive a feature from a raw idea to finished, reviewed code in one invocation, by sequencing
`brainstorming` → `super-plan` → `super-roast` (design) → `super-code` → `super-roast` (PR) → a
fix loop → report → `finishing-a-development-branch`, with an optional autonomous mode for
everything after the task tree settles.

**Core principle:** `super-auto` owns sequencing and nothing else. Every phase already has an
owner; this skill invokes them, threads four flags through them, carries parked escalations, and
writes the final report.

## Boundary

> If a change would improve how a *phase* works, it belongs in that phase's skill, not here.
> `super-auto` may only grow in the sequencing dimension.

Never:
- Re-implement `super-plan`'s adversarial review loop — opt-in, caps at 3; answer its offer, don't
  duplicate it.
- Decide a finding's severity, or adjudicate a roast finding.
- Copy an artifact another skill owns — hold pointers, per `./run-state.md`.

## Resume

On invocation, check for an existing `run.md` for this spec (`./run-state.md`). If one exists,
resume from its recorded phase — never restart at phase 1, never re-ask the flags below, never
reset an iteration count. `run.md` is written **after every phase transition**; that cadence is
what makes the resume pointer and the roast-round caps durable across a restart.

## Inputs

Four flags, collected once, before any phase runs (and skipped entirely on a resume — see
Resume above), in **one batched question** — never four sequential ones — and only asked for
whichever aren't already stated in the invocation.

| Flag | Effect |
|---|---|
| plan one-shot | `brainstorming` runs Mode B instead of Mode A |
| skip plan roast | Declines `super-plan`'s adversarial-review offer |
| skip code roast | Omits the final PR-mode roast entirely |
| autonomous | Suppresses all queries once the task tree has settled (phase 2 complete) |

## Phase sequence

`super-auto` owns every transition explicitly — it never lets a phase chain into the next on its
own, or the flags strand and the sequence is lost.

| # | Phase | Skill | Notes |
|---|---|---|---|
| 1 | Spec | `brainstorming` | Mode A/B per flag → approved spec |
| 2 | Plan | `super-plan` | Decompose + coverage loop → settled task tree. `super-auto` tells `super-plan`, in the invocation, that the hand-off out of the settled tree is `super-auto`'s to make — `super-plan` does not chain into execution on its own. |
| 3 | Design roast | `super-roast` (design mode) | Via `super-plan`'s own opt-in offer; its own fix loop, cap 3 |
| 4 | Code | `super-code` | Autonomous or interactive per flag. `super-auto` tells `super-code`, in the invocation, that `super-auto` owns the finish — no config flag for this. |
| 5 | Code roast | `super-roast` (PR mode) | Against the epic integration branch, still live |
| 6 | Fix loop | — | Reopen the root epic (`super-code` closed it on termination), file confirmed findings as beads under it, re-enter `super-code`, then loop back to phase 5's code roast to check the fix. Mirrors `super-plan`'s loop: cap 3, stop early if a round doesn't shrink the confirmed-Blocking count — that's thrash, not progress |
| 7 | Report | — | Write `report.md` per `./report-prompt.md` — **before anything is torn down** |
| 8 | Finish | `finishing-a-development-branch` | Merge the integration branch and clean up — once, at the very end, **gated on `report.md` existing** |

Phase 7 must precede phase 8: two of the report's five sources — the ledger's completion lines and
the per-task implementer reports — live git-ignored inside the integration worktree that phase 8
removes, so writing the report after teardown reproduces the exact defect that moving the finish
out of `super-code` was meant to fix. Phase 8's gate is the fix loop having **exited** — clean,
capped out, or skipped — not "the roast is clean": a cap-out that parks Blocking findings still
proceeds to finish (the accepted risk below), and `clean` is itself a loaded verdict token, not a
clearance, wherever `super-roast`/`super-plan` attach a qualifier to it.

Phase 6 reopens the epic before filing beads because `super-code` terminates on root-epic close —
re-invoking it, or filing beads, against an epic it just closed would hit a termination check that
already fired.

## Autonomous mode

> Autonomy begins once the task tree has settled — the moment phase 2 completes.

Everything up to and including the settled task tree is interactive. From there on, in the
autonomous zone:
- `super-plan`'s and `super-roast`'s own mandated human pauses (loop exits, cap-outs, "surface
  every entry before starting fix work") are satisfied by **recording the item as parked in
  `run.md` and surfacing it in the final report** — not by querying. Same trade as the escalation
  decision below; it is what resolves the contradiction those pauses would otherwise create here.
- Fix designs are applied without asking or waiting — the request to run autonomously *is* the
  approval.
- Nested brainstorms triggered by a fix run in Mode B.
- Escalations and beyond-cap items are parked and surfaced **in the final report**, never
  auto-adjudicated and never queried about mid-run.
- `super-code` runs in its own autonomous mode.

> If a roast fix loop caps out at 3 with Blocking findings unresolved, autonomous mode parks them
> rather than halting. A run can finish having merged code with known Blocking findings — which is
> why the report leads with status.

## Run directory

All artifacts of one run live under `docs/superpowers/runs/YYYY-MM-DD-<slug>/`. The slug is derived
from the raw idea itself (kebab-cased), **before phase 1 runs** — `brainstorming` hasn't produced a
title yet at that point, so the directory can't wait for one; it must already exist to hand
`brainstorming` as its location preference. `brainstorming` and `writing-plans` take this directory
as their documented location-preference override; `super-roast` uses the report-location override
added for this. State and report follow `./run-state.md` and `./report-prompt.md` — do not restate
them here.

## Red Flags

**Never:**
- Re-implement a phase's behavior instead of invoking it.
- Auto-adjudicate a roast escalation or a sibling's mandated pause, or fold either into the fix
  queue.
- Ask a question, or wait on a sibling's mandated pause, once the task tree has settled and
  `autonomous` is set.
- Re-ask the four flags, or reset an iteration count, when a resumable `run.md` already exists.
- Invoke `finishing-a-development-branch` before `report.md` exists.
- Report "done" without a status line — see `./report-prompt.md`.
- Keep a roast iteration count in session memory instead of `run.md` — see `./run-state.md`.
- Move existing flat `specs/`/`plans/` documents into a run directory.

## Trigger micro-test

Three isolated probe agents (haiku), each shown only the three frontmatter descriptions and
nothing else, asked which one fires:

1. "take this idea and get it to finished code" → fired `super-auto` ✓
2. "review this PR before I merge it" → fired `super-roast` ✓
3. "execute this epic, the tasks are already planned" → fired `super-code` ✓

Result: 3/3, no misfires, no description changes needed. (Frontmatter description unchanged in
this revision, so the micro-test was not re-run — see the coordinator's own instruction.)
