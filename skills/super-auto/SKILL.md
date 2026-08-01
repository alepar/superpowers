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

On invocation, glob `docs/superpowers/runs/*-<slug>/run.md` — the date prefix is fixed at phase 1,
not today's (see Run directory). No exact match: enumerate `docs/superpowers/runs/*/run.md` and
match by the recorded idea/spec before concluding no run exists — the same idea kebab-cased two
different ways must not read as two different runs. A match resumes from its recorded phase
(`./run-state.md`) — never re-ask the flags, never reset a counter. `run.md` is created the moment
the run directory exists, with `phase: brainstorm` and the four flags already written — before
`brainstorming` itself runs — so a crash mid-Mode-A still resumes without re-asking. Written again
after every phase transition and after every roast round.

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
own, or the flags strand and the sequence is lost. Each row's parenthetical is the exact `run.md`
`phase` token from `./run-state.md`; the two files name the same eight phases.

| # | Phase (`run.md` token) | Skill | Note |
|---|---|---|---|
| 1 | Spec (`brainstorm`) | `brainstorming` | Mode A/B per flag → approved spec. **Say in the invocation that the hand-off out of the spec is `super-auto`'s** — `brainstorming` otherwise invokes `super-plan` itself at the end of every spec, and that invocation carries none of your flags, so `super-plan` chains on to `super-code` and phases 3-8 never happen |
| 2 | Plan (`plan`) | `super-plan` | Coverage loop → settled tree. **Say in the invocation that the hand-off is `super-auto`'s**, or `super-plan` chains into execution and the flags strand. Record the epic id yourself |
| 3 | Design roast (`roast-design`) | `super-roast` (design) | Via `super-plan`'s own offer, inside its invocation; cap-3 fix loop; `super-auto` records each report path itself |
| 4 | Code (`code`) | `super-code` | Name the integration branch `epic-<epicId>-integration` and create it off the base branch before invoking — `super-code` requires `integrationBranch` and derives its worktree from it, but never creates either. | Autonomous or interactive per flag. **Say in the invocation that `super-auto` owns the finish** — there is no config flag; otherwise it merges and deletes the worktree the report needs |
| 5 | Code roast (`roast-code`) | `super-roast` (PR) | Against the live integration branch |
| 6 | Fix loop (`fix-loop`) | — | Reopen the epic, file confirmed findings as beads (shape: see Red Flags), re-enter `super-code`, loop to phase 5; cap 3, stop early if Blocking count doesn't shrink |
| 7 | Report (`report`) | — | Write `report.md` per `./report-prompt.md`, before anything is torn down |
| 8 | Finish (`finish`→`done`) | `finishing-a-development-branch` | Merge + clean up, once, gated per below |

Phase 8's gate is three conditions, not one: `report.md` exists, `run.md`'s `phase` reads `report`,
and its status line does not begin `stalled` — existence alone is not enough. A stall at any phase
still writes `report.md` (`status: stalled at phase X`) but never advances `phase` to `report`; see
`./run-state.md`'s phase-2 entry for the one remaining case (a stall at phase 7 itself) the third
condition exists to close.

## Autonomous mode

> Autonomy begins the moment `super-plan`'s coverage loop passes.

Not the settled tree, which precedes that loop's own human arbitration (accepting GAPs, deciding
ORPHANs) — parking can't serve a decision that hasn't been made yet, so phase 3 (running inside the
`super-plan` invocation, after coverage passes) is already inside the zone.

In the autonomous zone, `super-plan`'s and `super-roast`'s own mandated human pauses are answered,
not asked, and the road not taken is parked (`run-state.md`'s `degraded-verdict` kind):

- **The offer to invoke `super-roast` at all** (phase 3): accepted without asking.
- **"Re-roast with a raised `config.panelCap`?"** (a beyond-cap finding): answered **no** — proceed
  with the findings in hand; the unexplored raise is parked, not silently dropped.
- **The `clean [low coverage]` / `clean [panel-capped: N unverified]` three-way gate**, at both
  roasts: answered **proceed**; the qualifier is parked.
- **"Both exits pause and summarize for the human"** (both loops): satisfied by recording whatever
  was open in `run.md` and surfacing it in the report, not by pausing.
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

All artifacts of one run live under `docs/superpowers/runs/YYYY-MM-DD-<slug>/`. **Slug and date are
both fixed once, kebab-cased from the raw idea, before phase 1** — `brainstorming` has not produced
a title yet, and the directory must exist to be handed to it as an override. `brainstorming` and `writing-plans` take this directory as their documented
location-preference override; `super-roast` uses the report-location override added for this.
State and report follow `./run-state.md` and `./report-prompt.md` — do not restate them here.

## Red Flags

**Never:**
- Re-implement a phase's behavior instead of invoking it.
- Auto-adjudicate a roast escalation or a sibling's mandated pause, or fold either into the fix
  queue.
- Ask a question, or wait on a sibling's mandated pause, once `super-plan`'s coverage loop has
  passed and `autonomous` is set.
- Re-ask the four flags, or reset an iteration count, when a resumable `run.md` already exists.
- Wait until phase 1 completes to create `run.md` — a crash inside `brainstorming`'s Mode A would
  then restart and re-ask the flags, which every rule above promises never happens.
- Look for a resumable run by assuming today's date in the run directory's path, or give up after
  one glob miss without also matching on the recorded idea/spec.
- File a phase-6 fix bead without all three of `--parent <root-epic-id>`, `--no-inherit-labels`,
  and `-l sp:<root-epic-id>` together — the same shape `super-plan` mandates for every `bd create`.
  Omitting `--parent` does **not** hide the bead from `bd ready` (that query is gated by the label
  alone); it leaves the bead outside the epic's descendant tree, so `bd epic close-eligible` sees
  the epic as closable and **closes it mid-fix**. Omitting `--no-inherit-labels` smears the
  parent's own labels onto the child.
- Invoke `finishing-a-development-branch` on anything less than all three of phase 8's gate
  conditions.
- Rely on `super-code`'s returned buckets from session memory once phase 4 has transitioned — read
  `run.md`'s recorded `codeBuckets` instead.
- Report "done" without a status line, or report bare `clean` when a `degraded-verdict` record is
  parked or a roast was skipped — see `./report-prompt.md`.
- Keep a roast iteration count in session memory instead of `run.md` — see `./run-state.md`.
- Move existing flat `specs/`/`plans/` documents into a run directory.

## Known limitations

Shipped as documented gaps this round, not fixed:

- **Gate order is convention, not enforcement.** Nothing catches an agent that writes `phase:
  finish` before actually confirming phase 8's three conditions; the rule is evaluate, then write.
- **A beyond-cap finding has no status consequence outside autonomous mode.** A human can decline
  the panelCap re-roast interactively and proceed anyway; nothing records that choice the way
  `degraded-verdict` does in autonomous mode, so `clean` can hide it.
- **Resume can't distinguish a stall from a plain interruption.** Both leave `phase` at whatever was
  in flight; nothing marks *why* the run stopped there.
- **Sibling artifacts can omit the date prefix the resume glob needs.** `specs/INDEX.md`'s
  documented link format for a run (`../runs/<slug>/design.md`) omits the `YYYY-MM-DD-` prefix the
  real directory carries; nothing enforces adding it back.
- **`plan:` has no referent in beads mode.** `run-state.md` lists a plan-path pointer
  unconditionally, but `plan.md` is a no-beads-mode-only artifact (`super-plan`'s Hand-off).
- **`super-plan`'s Red Flag contradicts the autonomous answer, and sits closer to the decision.**
  Its Red Flags forbid treating a `clean` verdict carrying `[low coverage]` or
  `[panel-capped: N unverified]` as a clearance — "the user decides whether to proceed." Phase 3
  runs *inside* the `super-plan` invocation, so that Red Flag is adjacent while this file's
  "answer proceed, park the qualifier" resolution is far up-context. Nothing in `super-plan` marks
  the caller-owned exception.
- **A skipped code roast leaves phase 6 unmarked on the `phase` field.** With `skipCodeRoast` set,
  `phase` jumps `code` → `report`. The flags themselves are durable in `run.md`, so a reader can
  infer skipped-by-flag from them — but the phase field alone does not distinguish skipped from
  not-yet-reached.
- **The two state files key resume on different things.** `run-state.md`'s resume rule keys on "the
  same spec"; this file's Resume section keys on the run directory plus an idea/spec-text fallback.
  Not yet reconciled to name one operation.
