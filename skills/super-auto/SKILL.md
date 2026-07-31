---
name: super-auto
description: Use when taking a feature from a raw idea all the way to finished code in one invocation, optionally unattended. Not for reviewing an existing PR or design (that is super-roast) and not for executing an epic that already has a task tree (that is super-code).
---

# super-auto

Drive a feature from a raw idea to finished, reviewed code in one invocation, by sequencing
`brainstorming` → `super-plan` → `super-roast` (design) → `super-code` → `super-roast` (PR) → a
fix loop → report → `finishing-a-development-branch`, with an optional autonomous mode for
everything from `super-plan`'s coverage loop passing onward.

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

On invocation, look for an existing run: glob `docs/superpowers/runs/*-<slug>/run.md` — the date
prefix is fixed at phase 1 (see Run directory below) and is not today's date on a later resume, so
a lookup that assumes today's date finds nothing and restarts a run that already exists. If a match
exists, resume from its recorded phase (`./run-state.md`) — never restart at phase 1, never re-ask
the flags below, never reset an iteration count. `run.md` is written **after every phase transition
and after every roast round** — a per-transition-only write would leave a roast-round counter
unpersisted for the whole loop it's supposed to cap, since both roast loops run inside a single
phase.

## Inputs

Four flags, collected once, before any phase runs (and skipped entirely on a resume — see
Resume above), in **one batched question** — never four sequential ones — and only asked for
whichever aren't already stated in the invocation.

| Flag | Effect |
|---|---|
| plan one-shot | `brainstorming` runs Mode B instead of Mode A |
| skip plan roast | Declines `super-plan`'s adversarial-review offer |
| skip code roast | Omits the final PR-mode roast entirely |
| autonomous | Suppresses all queries once `super-plan`'s coverage loop passes (see Autonomous mode) |

## Phase sequence

`super-auto` owns every transition explicitly — it never lets a phase chain into the next on its
own, or the flags strand and the sequence is lost. Each row's parenthetical is the exact
`run.md` `phase` token from `./run-state.md`; the two files name the same eight phases.

| # | Phase (`run.md` token) | Skill | Notes |
|---|---|---|---|
| 1 | Spec (`brainstorm`) | `brainstorming` | Mode A/B per flag → approved spec |
| 2 | Plan (`plan`) | `super-plan` | Decompose + coverage loop → settled task tree. `super-auto` tells `super-plan`, in the invocation, that the hand-off is `super-auto`'s to make — `super-plan` completes coverage and its own roast offer, reports the settled tree, and stops rather than chaining into `super-code` itself. Because that report is prose, not a structured payload the way `super-code`'s Finish returns one, `super-auto` itself extracts and records the epic id into `run.md`'s pointers at this transition. |
| 3 | Design roast (`roast-design`) | `super-roast` (design mode) | Via `super-plan`'s own opt-in offer, executing inside the `super-plan` invocation; its own fix loop, cap 3. `super-auto` records each roast report's path into `run.md`'s pointers as it's produced, for the same reason as phase 2. |
| 4 | Code (`code`) | `super-code` | Autonomous or interactive per flag. `super-auto` tells `super-code`, in the invocation, that `super-auto` owns the finish — no config flag for this. |
| 5 | Code roast (`roast-code`) | `super-roast` (PR mode) | Against the epic integration branch, still live |
| 6 | Fix loop (`fix-loop`) | — | Reopen the root epic (`super-code` closed it on termination), file confirmed findings as beads under it — each with `--parent <root-epic-id>` and `-l sp:<root-epic-id>`, matching what `super-plan` itself requires; a bead missing either label never surfaces in `super-code`'s `bd ready` query, so the loop reopens, finds nothing ready, and silently no-ops — re-enter `super-code`, then loop back to phase 5's code roast to check the fix. Mirrors `super-plan`'s loop: cap 3, stop early if a round doesn't shrink the confirmed-Blocking count — that's thrash, not progress |
| 7 | Report (`report`) | — | Write `report.md` per `./report-prompt.md` — **before anything is torn down** |
| 8 | Finish (`finish` → `done`) | `finishing-a-development-branch` | Merge the integration branch and clean up — once, at the very end, **gated on `report.md` existing AND `run.md`'s `phase` having actually reached `report`** |

Phase 7 must precede phase 8: two of the report's five sources — the ledger's completion lines and
the per-task implementer reports — live git-ignored inside the integration worktree that phase 8
removes, so writing the report after teardown reproduces the exact defect that moving the finish
out of `super-code` was meant to fix. Phase 8's gate is two conditions, not one: `report.md` exists,
**and** `run.md`'s `phase` field reads `report` — i.e. the fix loop actually **exited** (clean,
capped out, or skipped), not merely that a report file happens to exist. A cap-out that parks
Blocking findings still advances `phase` to `report` and proceeds to finish (the accepted risk
below); `clean` is itself a loaded verdict token, not a clearance, wherever `super-roast`/
`super-plan` attach a qualifier to it — the gate names the loop's exit, not that token.

Phase 6 reopens the epic before filing beads because `super-code` terminates on root-epic close —
re-invoking it, or filing beads, against an epic it just closed would hit a termination check that
already fired.

**A stall at any phase still writes `report.md`, but never advances `phase` to `report`.** If a
phase can't proceed (an unresolved blocker bead that keeps re-escalating, an unrecoverable error),
write `report.md` with `status: stalled at phase <phase>` — `<phase>` read from `run.md`'s own
`phase` field at the moment of the stall, per `./report-prompt.md` — then stop, **leaving `run.md`'s
`phase` at that same stalled value.** This is deliberate, not an oversight: `report-prompt.md`
sources the stalled phase name from `run.md`'s `phase` field, so overwriting it to `report` would
both falsify that source and — since phase 8's gate checks `phase == report` — accidentally clear
the way to finish a run that never actually exited its fix loop. A stall reaches phase 7's *action*
(writing the report) without ever reaching phase 7's *state* (`phase: report`), which is exactly
what keeps it from reaching phase 8.

## Autonomous mode

> Autonomy begins the moment `super-plan`'s coverage loop passes.

Not "the settled tree": `super-plan` uses *settled* for the state **before** its coverage loop, so
anchoring there would put that loop's own human arbitration (accepting GAPs, deciding ORPHANs)
inside the autonomous zone, where parking cannot serve it — an accepted GAP that is merely parked
never becomes a task. Interactive: everything through the coverage loop passing. Autonomous: phase
3 onward, including phase 3 itself, since `super-plan`'s adversarial-review offer and fix loop
execute inside the `super-plan` invocation, after coverage passes.

In the autonomous zone, `super-plan`'s and `super-roast`'s own mandated human pauses are answered,
not asked, and the road not taken is parked (`run-state.md`'s `degraded-verdict` kind) rather than
surfaced mid-run:

- **The offer to invoke `super-roast` at all** (phase 3): accepted without asking.
- **"Re-roast with a raised `config.panelCap`?"** (a beyond-panel-cap finding): answered **no** —
  proceed with the findings already in hand. The unexplored raise is parked as a degraded-verdict
  record, not silently dropped.
- **The `clean [low coverage]` / `clean [panel-capped: N unverified]` three-way gate** (proceed /
  re-roast / dig in), at both the design roast (via `super-plan`) and the code roast (phase 5):
  answered **proceed**. The qualifier is parked as a degraded-verdict record.
- **"Both the cap-out and the clean exit pause and summarize for the human"** (both loops):
  satisfied by recording whatever was open — escalations, beyond-cap items, degraded-verdict
  records — in `run.md` and surfacing it in the final report, not by pausing.
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

All artifacts of one run live under `docs/superpowers/runs/YYYY-MM-DD-<slug>/`. The slug **and**
the date are fixed once, from the raw idea itself (kebab-cased), before phase 1 runs —
`brainstorming` hasn't produced a title yet at that point, so the directory can't wait for one; it
must already exist to hand to `brainstorming` as its location preference. The date is the run's
start date, not "today": a resume weeks later still targets the original directory (see Resume
above for the glob that finds it without knowing that date in advance). `brainstorming` and
`writing-plans` take this directory as their documented location-preference override; `super-roast`
uses the report-location override added for this. State and report follow `./run-state.md` and
`./report-prompt.md` — do not restate them here.

## Red Flags

**Never:**
- Re-implement a phase's behavior instead of invoking it.
- Auto-adjudicate a roast escalation or a sibling's mandated pause, or fold either into the fix
  queue.
- Ask a question, or wait on a sibling's mandated pause, once `super-plan`'s coverage loop has
  passed and `autonomous` is set.
- Re-ask the four flags, or reset an iteration count, when a resumable `run.md` already exists.
- Look for a resumable run by assuming today's date in the run directory's path.
- File a phase-6 fix bead without both `--parent <root-epic-id>` and `-l sp:<root-epic-id>` — it
  will never surface in `super-code`'s ready query.
- Invoke `finishing-a-development-branch` before `report.md` exists, or because `report.md` exists
  on a run that stalled rather than exited its fix loop.
- Report "done" without a status line, or report bare `clean` when a `degraded-verdict` record is
  parked — see `./report-prompt.md`.
- Keep a roast iteration count in session memory instead of `run.md` — see `./run-state.md`.
- Move existing flat `specs/`/`plans/` documents into a run directory.

## Trigger micro-test

Three isolated probe agents (haiku), each shown only the three frontmatter descriptions and
nothing else, asked which one fires:

1. "take this idea and get it to finished code" → fired `super-auto` ✓
2. "review this PR before I merge it" → fired `super-roast` ✓
3. "execute this epic, the tasks are already planned" → fired `super-code` ✓

Result: 3/3, no misfires, no description changes needed. (Frontmatter description unchanged across
both review rounds, so the micro-test has not been re-run since — per the coordinator's own
instruction to re-run it only if the description changes.)
