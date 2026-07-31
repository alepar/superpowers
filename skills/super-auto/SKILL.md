---
name: super-auto
description: Use when taking a feature from a raw idea all the way to finished code in one invocation, optionally unattended. Not for reviewing an existing PR or design (that is super-roast) and not for executing an epic that already has a task tree (that is super-code).
---

# super-auto

Drive a feature from a raw idea to finished, reviewed code in one invocation, by sequencing
`brainstorming` → `super-plan` → `super-roast` (design) → `super-code` → `super-roast` (PR) → a
fix loop → `finishing-a-development-branch`, with an optional autonomous mode for everything after
design settles.

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

## Inputs

Four flags, collected once, before any phase runs, in **one batched question** — never four
sequential ones — and only asked for whichever aren't already stated in the invocation.

| Flag | Effect |
|---|---|
| plan one-shot | `brainstorming` runs Mode B instead of Mode A |
| skip plan roast | Declines `super-plan`'s adversarial-review offer |
| skip code roast | Omits the final PR-mode roast entirely |
| autonomous | Suppresses all queries from the first roast report onward |

## Phase sequence

`super-auto` owns every transition explicitly — it never lets a phase chain into the next on its
own, or the flags strand and the sequence is lost.

| # | Phase | Skill | Notes |
|---|---|---|---|
| 1 | Spec | `brainstorming` | Mode A/B per flag → approved spec |
| 2 | Plan | `super-plan` | Decompose + coverage loop → settled task tree. Told explicitly the hand-off is `super-auto`'s to make, not `super-plan`'s default. |
| 3 | Design roast | `super-roast` (design mode) | Via `super-plan`'s own opt-in offer; its own fix loop, cap 3 |
| 4 | Code | `super-code` | Autonomous or interactive per flag. Told explicitly, in the invocation, that `super-auto` owns the finish — no config flag for this. |
| 5 | Code roast | `super-roast` (PR mode) | Against the epic integration branch, still live |
| 6 | Fix loop | — | Confirmed findings → beads under the epic → re-enter `super-code`. Mirrors `super-plan`'s loop: cap 3, stop early if a round doesn't shrink the confirmed-Blocking count — that's thrash, not progress |
| 7 | Finish | `finishing-a-development-branch` | Merge the integration branch and clean up — once, at the end, only once the code roast is clean |

Phase 4's explicit statement is not an implementation detail. Left to its default, `super-code`
hands to `finishing-a-development-branch` itself, whose cleanup removes the integration worktree —
destroying the git-ignored ledger that is the *only* record of a PARK ruling's reasoning, and
leaving phase 5 roasting already-merged code. So `super-auto` states, in the same invocation, that
it owns the finish: `super-code` stops after its final review and returns its buckets instead of
handing off; only phase 7, run once by `super-auto` at the very end, merges and tears down.

## Autonomous mode

> Autonomy begins the moment the first roast report exists.

Everything up to and including the settled task tree is interactive. From there on, in the
autonomous zone:
- Fix designs are applied without asking or waiting — the request to run autonomously *is* the
  approval.
- Nested brainstorms triggered by a fix run in Mode B.
- Escalations and beyond-cap items are parked and surfaced, never auto-adjudicated.
- `super-code` runs in its own autonomous mode.

> If a roast fix loop caps out at 3 with Blocking findings unresolved, autonomous mode parks them
> rather than halting. A run can finish having merged code with known Blocking findings — which is
> why the report leads with status.

## Run directory

All artifacts of one run live under `docs/superpowers/runs/YYYY-MM-DD-<slug>/`. `brainstorming` and
`writing-plans` are given this directory as their documented location-preference override;
`super-roast` uses the report-location override added for this. State and report follow the
contracts in `./run-state.md` and `./report-prompt.md` — do not restate them here.

## Red Flags

**Never:**
- Re-implement a phase's behavior instead of invoking it.
- Auto-adjudicate a roast escalation, or fold one into the fix queue.
- Ask a question after the first roast report exists when `autonomous` is set.
- Report "done" without a status line — see `./report-prompt.md`.
- Keep a roast iteration count in session memory instead of `run.md` — see `./run-state.md`.
- Move existing flat `specs/`/`plans/` documents into a run directory.

## Trigger micro-test

Three isolated probe agents (haiku), each shown only the three frontmatter descriptions and
nothing else, asked which one fires:

1. "take this idea and get it to finished code" → fired `super-auto` ✓
2. "review this PR before I merge it" → fired `super-roast` ✓
3. "execute this epic, the tasks are already planned" → fired `super-code` ✓

Result: 3/3, no misfires, no description changes needed.
