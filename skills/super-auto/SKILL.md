---
name: super-auto
description: Use when taking a feature from a raw idea all the way to finished code in one invocation, optionally unattended. Not for reviewing an existing PR or design (that is super-roast) and not for executing an epic that already has a task tree (that is super-code).
---

# super-auto

Drive a feature from a raw idea to finished, reviewed code in one invocation, by sequencing
`super-design` → `super-roast` (design) → `super-code` → `super-roast` (PR) → a
fix loop → report → `finishing-a-development-branch`, with an optional autonomous mode for
everything from `super-design`'s coverage loop passing onward.

**Core principle:** `super-auto` owns sequencing and nothing else. Every phase already has an
owner; this skill invokes them, threads four flags through them, carries parked escalations, and
writes the final report.

## Boundary

> If a change would improve how a *phase* works, it belongs in that phase's skill, not here.
> `super-auto` may only grow in the sequencing dimension.

Never:
- Re-implement `super-design`'s adversarial review loop — opt-in, caps at 3; answer its offer, don't
  duplicate it.
- Decide a finding's severity, or adjudicate a roast finding.
- Copy an artifact another skill owns — hold pointers, per `./run-state.md`.

## Resume

On invocation, glob `docs/superpowers/runs/*-<slug>/run.md` — the date prefix is fixed at phase 1,
not today's (see Run directory). No exact match: enumerate `docs/superpowers/runs/*/run.md` and
match by the recorded idea/spec before concluding no run exists — the same idea kebab-cased two
different ways must not read as two different runs. A match resumes from its recorded phase
(`./run-state.md`) — never re-ask the flags, never reset a counter. `run.md` is created the moment
the run directory exists, with `phase: design` and the four flags already written — before
`super-design` itself runs — so a crash mid-run still resumes without re-asking. Written again
after every phase transition and after every roast round.

**Phases 1 and 2 are one crash-atomic unit.** `super-auto` holds no control between invoking
`super-design` and its return, so nothing can be written to `run.md` while the root brainstorm, the
decomposition, the coverage loop, or the design-roast loop are running. A crash anywhere in there
resumes at `phase: design` and re-enters `super-design` from the top. Two consequences, both
deliberate rather than accidental:

- **Do not treat a resume at `phase: design` as "nothing happened."** The tracker holds the real
  state — the epic, its children, their `sp:needs-design` labels — and `super-design`'s own cursor is
  a query over that, not session memory. Re-entering it resumes the tree where the labels say it is;
  it does not redesign what is already designed.
- **`roastDesignRound` is durable only across the phase-2 boundary, not inside it.** A crash mid
  design-roast loses this run's round count, and the loop restarts at 1. That is the one place this
  file's cap-3 guarantee is weaker than `run-state.md` states it — recorded here rather than left
  for a reader to discover, and the reason `super-design`'s hand-off reports its round count back.

## Inputs

Four flags, collected once, before any phase runs (and skipped entirely on a resume — see
Resume above), in **one batched question** — never four sequential ones — and only asked for
whichever aren't already stated in the invocation.

| Flag | Effect |
|---|---|
| plan one-shot | Stated to `super-design`, which relays it to every `brainstorming` iteration it runs (root spec, each subepic) — Mode B instead of Mode A |
| skip plan roast | Declines **both** design-mode roast offers: `brainstorming`'s on the root spec and `super-design`'s on the settled tree. They are two separate offers; declining only the second still gets the user asked once, after they said to skip it |
| skip code roast | Omits the final PR-mode roast entirely |
| autonomous | No query interrupts work in flight once `super-design`'s coverage loop passes; the run still hands back for the integration decision when every bead is done (see Autonomous mode) |

## Phase sequence

`super-auto` owns every transition explicitly — it never lets a phase chain into the next on its
own, or the flags strand and the sequence is lost. Each row's parenthetical is the exact `run.md`
`phase` token from `./run-state.md`; the two files name the same seven phases.

| # | Phase (`run.md` token) | Skill | Note |
|---|---|---|---|
| 1 | Design (`design`) | `super-design` | Invoked with the goal or raw idea; drives the root brainstorm, decomposition, every subepic brainstorm, and the coverage loop itself → settled tree. **Say in the invocation that the hand-off is `super-auto`'s**, or `super-design` chains into execution and the flags strand. Record the epic id yourself |
| 2 | Design roast (`roast-design`) | `super-roast` (design) | Runs **inside** phase 1's `super-design` invocation, via its own offer; cap-3 fix loop. `super-auto` holds no control while it runs, so `phase: roast-design`, the report paths and `roastDesignRound` are all written **on return**, from what `super-design` hands back (§Hand-off). Phases 1–2 are therefore one crash-atomic unit — see below. |
| 3 | Code (`code`) | `super-code` | Name the integration branch `epic-<epicId>-integration`; create it off the design branch if absent, **verify it if it already exists** (a resume must never re-create it); cut it from the design branch and record `branch` in `run.md` (`base` was recorded at phase 1) — `super-code` requires `integrationBranch` and derives its worktree from it, but never creates either. Autonomous or interactive per flag. **Say in the invocation that `super-auto` owns the finish** — there is no config flag, and without it `super-code` merges and deletes the worktree the report still needs. |
| 4 | Code roast (`roast-code`) | `super-roast` (PR) | Against the live integration branch |
| 5 | Fix loop (`fix-loop`) | — | Reopen the epic, file confirmed findings as beads (shape: see Red Flags), re-enter `super-code`, loop to phase 4; cap 3, stop early if Blocking count doesn't shrink |
| 6 | Report (`report`) | — | Write `report.md` per `./report-prompt.md`, before anything is torn down |
| 7 | Finish (`finish`→`done`) | `finishing-a-development-branch` | Merge + clean up, once, gated per below. Supply `run.md`'s `base` so the base-branch question is not asked, and present `report.md` alongside the menu. **The menu itself is always the human's, autonomous or not** — see "Where the zone ends". |

Phase 7's gate is three conditions, not one: `report.md` exists, `run.md`'s `phase` reads `report`,
and its status line does not begin `stalled` — existence alone is not enough. A stall at any phase
still writes `report.md` (`status: stalled at phase X`) but never advances `phase` to `report`; see
`./run-state.md`'s phase-2 entry for the one remaining case (a stall at phase 6 itself) the third
condition exists to close.

## Autonomous mode

> Autonomy begins the moment `super-design`'s coverage loop passes.

Not the settled tree, which precedes that loop's own human arbitration (accepting GAPs, deciding
ORPHANs) — parking can't serve a decision that hasn't been made yet, so phase 2 (running inside the
`super-design` invocation, after coverage passes) is already inside the zone.

In the autonomous zone, `super-design`'s and `super-roast`'s own mandated human pauses are answered,
not asked, and the road not taken is parked (`run-state.md`'s `degraded-verdict` kind):

- **The offer to invoke `super-roast` at all** (phase 2): accepted without asking — **unless `skipPlanRoast` is set, which wins.** An explicit flag beats a mode default; otherwise the flag would be unreachable in exactly the configuration (`skipPlanRoast` + `autonomous`) the cheap validation run uses.
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

**Where the zone ends: when the work is done, not at a phase number.** Autonomy means no question
interrupts work that is still in progress. It does **not** mean the run merges itself. Once every
bead under the epic has reached a terminal state and `report.md` is written, the run has finished
what it was asked to do — it presents the report and hands control back, and the merge of the
integration branch into the base branch is the human's call like any other.

That hand-back is **not** a violation of "no questions," because there is no work left to
interrupt: a run sitting at the integration decision is *done*, not blocked. Read it the other way
round and the rule is sharper — **never stop for a question while a bead is still unresolved.**
Every bullet above exists to keep a mid-run pause from happening; none of them licenses merging to
the base branch unattended, which is the one action in this pipeline a human cannot cheaply undo.

Merges *into* the run's own integration branch are a different thing and need no confirmation:
`super-code` performs them itself, serially, and never presents a menu for them.

> If a roast fix loop caps out at 3 with Blocking findings unresolved, autonomous mode parks them
> rather than halting. A run can finish having merged code with known Blocking findings — which is
> why the report leads with status.

## Run directory

All artifacts of one run live under `docs/superpowers/runs/YYYY-MM-DD-<slug>/`. **Slug and date are
both fixed once, kebab-cased from the raw idea, before phase 1** — `brainstorming` has not produced
a title yet, and the directory must exist to be handed to `super-design` as an override at phase 1's
invocation, which relays it to every `brainstorming` iteration it runs (root and nested). `writing-plans`
(invoked directly by `super-auto`, in no-beads mode) takes the same directory as its documented
location-preference override; `super-roast` uses the report-location override added for this.
State and report follow `./run-state.md` and `./report-prompt.md` — do not restate them here.

**Which working tree the run directory lives in, and the one merge that keeps it whole.**
`brainstorming` creates an isolated worktree as its first act, before it writes the spec — so
without a rule here, `run.md` (created before phase 1, in whatever checkout you were invoked from)
and every spec (written inside that worktree) end up in different trees, and `run.md`'s
run-directory-relative pointers resolve to nothing. Two rules settle it:

- **Create the run directory and `run.md` in the checkout you were invoked from**, and take the
  worktree `brainstorming` creates as this run's working tree from phase 1 onward. Everything after
  that — specs, roast reports, further `run.md` writes, `report.md` — is written and committed
  there.
- **At phase 3, cut the integration branch from the branch carrying the design work**, not from
  `base`. The specs, the `INDEX.md` row, and `run.md` were committed on it; branch off `base`
  instead and every design artifact is stranded on a branch nothing ever merges — including the
  `report.md` sources and the run state a resume needs. Because the design branch itself came off
  `base`, the integration branch still forks from `base` transitively, which is what phase 7 needs.

**`base` is the branch the whole run merges back into** — the repo branch the design worktree was
cut from, usually `main`. Record it in `run.md` (`./run-state.md` item 3) at phase 1, when that
worktree is created, not at phase 3. It is the one branch name phase 7 hands to
`finishing-a-development-branch`, and it is deliberately **not** the integration branch's immediate
parent: the design branch is a fork point, `base` is a destination, and merging the finished work
into its own design branch would leave it exactly as unmerged as before.

**Every link into a run directory carries the full `YYYY-MM-DD-<slug>` name, never the bare slug.**
That includes the `specs/INDEX.md` row for this run, which links to
`../runs/YYYY-MM-DD-<slug>/<the spec's actual filename>` — `brainstorming` names it
`YYYY-MM-DD-<topic>-design.md`, and redirecting the directory does not rename the file, so never
hard-code `design.md`. The date prefix on the directory is not decoration: Resume globs
`runs/*-<slug>/run.md`, so a link written without it points at a directory that does not exist, and
a human following that link concludes the run is missing while the run is sitting on disk.

## Red Flags

**Never:**
- Re-implement a phase's behavior instead of invoking it.
- Auto-adjudicate a roast escalation or a sibling's mandated pause, or fold either into the fix
  queue.
- Ask a question, or wait on a sibling's mandated pause, **while any bead is still unresolved**,
  once `super-design`'s coverage loop has passed and `autonomous` is set. Presenting the finished
  report and the integration decision is not this — that is the run handing back, with no work
  left in flight.
- Merge the integration branch into the base branch without the human's explicit choice, in any
  mode. `autonomous` buys an unattended *run*, never an unattended *merge*.
- Re-ask the four flags, or reset an iteration count, when a resumable `run.md` already exists.
- Wait until phase 1 completes to create `run.md` — a crash inside `super-design`'s root brainstorm
  Mode A would then restart and re-ask the flags, which every rule above promises never happens.
- Look for a resumable run by assuming today's date in the run directory's path, or give up after
  one glob miss without also matching on the recorded idea/spec.
- File a phase-5 fix bead without all three of `--parent <root-epic-id>`, `--no-inherit-labels`,
  and `-l sp:<root-epic-id>` together — the same shape `super-design` mandates for every `bd create`.
  Omitting `--parent` does **not** hide the bead from `bd ready` (that query is gated by the label
  alone); it leaves the bead outside the epic's descendant tree, so `bd epic close-eligible` sees
  the epic as closable and **closes it mid-fix**. Omitting `--no-inherit-labels` smears the
  parent's own labels onto the child.
- Invoke `finishing-a-development-branch` on anything less than all three of phase 7's gate
  conditions. The gate governs *entering* phase 7; a resume already reading `phase: finish` is past it — resume or verify the merge rather than re-testing a gate its own phase value cannot satisfy.
- Rely on `super-code`'s returned buckets from session memory once phase 3 has transitioned — read
  `run.md`'s recorded `codeBuckets` instead.
- Report "done" without a status line, or report bare `clean` when a `degraded-verdict` record is
  parked or a roast was skipped — see `./report-prompt.md`.
- Keep a roast iteration count in session memory instead of `run.md` — see `./run-state.md`.
- Move existing flat `specs/`/`plans/` documents into a run directory.

## Known limitations

- **The dry walk's remaining open questions.** A cold walk of these files alone (2026-07-31) completed
  a run and a resume, but only by inventing answers at twelve points the files leave open. The ones
  most likely to bite: the slug rule says "kebab-cased from the raw idea" while the worked example
  shows a condensed topic, and a resume phrased "continue the X work" slugs differently again; the
  four flags have no stated defaults; the resume fallback says
  "match by the recorded idea/spec" without saying what counts as a match — substring, token overlap,
  or judgement — which is a coin flip once more than one run exists; and phase 2 runs *inside* phase
  1's `super-design` invocation, so `phase: roast-design` and `roastDesignRound` can only ever be
  written retroactively, leaving a crash mid-design-roast to resume as `phase: design` and restart
  the root brainstorm. Two of the original twelve are closed: `run.md` now records the raw `idea`,
  and `super-design` relays an artifact-directory override to `super-roast`.

Shipped as documented gaps this round, not fixed:

- **Gate order is convention, not enforcement.** Nothing catches an agent that writes `phase:
  finish` before actually confirming phase 7's three conditions; the rule is evaluate, then write.
- **Resume can't distinguish a stall from a plain interruption.** Both leave `phase` at whatever was
  in flight; nothing marks *why* the run stopped there.
