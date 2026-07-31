# super-auto — Idea to Finished Code (design)

**Date:** 2026-07-31 · **Status:** approved design, pre-implementation

## Goal

Drive a feature from a raw idea to finished, reviewed code in one invocation, by sequencing the
fork's three skills — `super-plan`, `super-roast`, `super-code` — around the standard
`brainstorming` entry point, with an optional fully-autonomous mode for everything after the
design settles.

## Why

The three fork skills already compose in a fixed order, but composing them is manual: the user
invokes each, answers each one's offers, and carries the artifacts between them. That is fine for
one feature and tedious for a queue of them, and it makes an unattended overnight run impossible —
there is no single thing to start and walk away from.

`super-auto` is that single thing. It owns the sequence and nothing else.

## §1 Boundary — what super-auto owns

`super-auto` owns **sequencing**. It invokes `brainstorming` → `super-plan` → `super-roast` →
`super-code` → `super-roast`, threads four flags through them, carries parked escalations between
phases, and writes a final report. It does not decompose, review, execute, or fix — each of those
already has an owner.

**Governing rule (write this into SKILL.md):** if a change would improve how a *phase* works, it
belongs in that phase's skill, not here. `super-auto` may only grow in the sequencing dimension.
This is what stops it becoming a fork of all three.

Concretely, `super-auto` must never:

- Re-implement `super-plan`'s adversarial review loop — it exists, is opt-in, caps at 3, and
  `super-auto` answers its offer rather than duplicating it.
- Decide a finding's severity, or adjudicate a roast finding itself.
- Copy any artifact another skill owns; it holds pointers.

## §2 Inputs

Four flags, collected **once, before any phase runs**, and asked only if not already supplied in
the invocation. They are gathered in one batched question, not four sequential ones — a user
reaching for `super-auto` wants to start a long run, not answer a quiz.

| Input | Effect |
|---|---|
| plan one-shot | `brainstorming` runs in Mode B (one-shot) instead of Mode A (collaborative) |
| skip plan roast | Declines `super-plan`'s adversarial-review offer |
| skip code roast | Omits the final PR-mode roast entirely |
| autonomous | Suppresses all queries *after* the spec and task tree exist (see §4) |

Anything stated in the invocation ("run it autonomously, skip the code roast") is taken as given
and not re-asked.

## §3 Phase sequence

`super-auto` owns every transition explicitly. It does **not** let `super-plan` chain into
execution on its own — that would strand the flags and surrender control of the sequence. It tells
`super-plan` the hand-off is `super-auto`'s to make.

| Phase | Skill | Notes |
|---|---|---|
| 1 | `brainstorming` | Mode A or B per flag → approved spec |
| 2 | `super-plan` | Decompose + coverage loop → settled task tree |
| 3 | `super-roast` (design mode) | Via `super-plan`'s existing opt-in offer; its own fix loop, cap 3 |
| 4 | `super-code` | Autonomous or interactive per flag |
| 5 | `super-roast` (PR mode) | Against the epic integration branch |
| 6 | fix loop | Confirmed findings → beads under the epic → re-enter `super-code` |
| 7 | `finishing-a-development-branch` | Merge the integration branch and clean up — **once, at the end** |

**`super-code` is told not to run its own Finish hand-off.** Left to itself, `super-code`'s Finish
merges the integration branch and hands to `finishing-a-development-branch`, whose cleanup runs
"for every option" and removes the integration worktree. That would destroy the git-ignored
`.superpowers/sdd/` scratch inside it — including the ledger, which is the *only* place a PARK
ruling's reasoning is recorded — and would leave phase 5 roasting already-merged code and phase 6
filing beads against a closed epic.

So `super-auto` owns the finish exactly as it owns the hand-off out of `super-plan` (§3 above):
`super-code` stops when its loop drains, phases 5–6 run against a **live** integration worktree,
and only when the code roast is clean does `super-auto` hand to `finishing-a-development-branch`.
This is what keeps §7's cited sources reachable at report time.

**Step 6 mirrors `super-plan`'s loop deliberately:** cap 3, and stop early if an iteration does not
shrink the confirmed-Blocking count — that is thrash, not progress. Findings become beads rather
than inline edits so fixes inherit per-task worktrees, review, and serial merge-back, and so
everything continues to coordinate through beads rather than session memory.

## §4 Autonomous mode

**Autonomy begins the moment the first roast report exists.** Everything up to and including the
settled task tree is interactive; from the first roast onward, no queries.

In the autonomous zone:

- Fix designs are decided and applied without asking and without waiting for approval — the request
  to run autonomously **is** the approval.
- Nested brainstorms triggered by a fix run in Mode B, no questions.
- Escalations and beyond-panel-cap items are parked, never asked about, and surfaced in the final
  report.
- `super-code` runs in its own autonomous mode. Its blocker-bead path already
  notifies-quarantines-continues, which is compatible.

**Accepted risk, stated plainly:** if a roast fix loop caps out at 3 with Blocking findings still
unresolved, autonomous mode parks them rather than halting. A run can therefore finish having
merged code with known Blocking findings. This is the same trade as the escalation decision above,
and it is why the final report leads with status and never says a bare "done."

### What super-roast's escalations mean here

`super-roast`'s `## Escalations (need human)` section holds findings that reached **no verdict** —
a dead panel seat, an unresolved external premise, or material dissent between seats. Its own skill
is explicit that there is "nothing to auto-fix and nothing to auto-dismiss."

`super-auto` therefore never auto-adjudicates them and never folds them into a fix queue. It parks
each one, continues, and surfaces all of them at the end. The same applies to
`## Not verified (beyond panel cap)` — an unverified Blocking candidate is not a cleared one.

## §5 Run directory

All artifacts of one run live in one directory:

```
docs/superpowers/runs/YYYY-MM-DD-<slug>/
  design.md          # brainstorming's spec
  plan.md            # writing-plans' implementation plan
  subepics/          # nested specs super-plan promotes
  roast-design-N.md  # plan-phase roast reports
  roast-code-N.md    # branch-phase roast reports
  run.md             # super-auto state (§6)
  report.md          # final summary (§7)
```

Three decisions worth recording:

- **`runs/`, not `specs/`.** The directory holds a plan, roast reports, state and a report; calling
  it `specs/` misnames most of its contents. `specs/INDEX.md` stays where it is; its row for a
  super-auto run links to `../runs/<slug>/design.md`.
- **Scoped to `super-auto` runs only.** Standalone `brainstorming` and `writing-plans` keep writing
  flat to `specs/` and `plans/`. This is additive — no migration, nothing existing moves.
- **`run.md` is committed, not git-ignored.** Unlike `super-code`'s scratch ledger, a
  `super-auto` run spans hours and its state is part of the record; committing it means a resume
  survives a clone or a different machine.

### How redirection works without violating §1

`brainstorming` and `writing-plans` both already document a location override — *"User preferences
for spec/plan location override this default."* `super-auto` supplies the run directory as that
preference. No reaching in, no forking.

`super-roast` is the exception: it hardcodes
`docs/superpowers/reviews/YYYY-MM-DD-<topic>-roast-N.md` with no override. **This design amends
`super-roast` to add the same override hook its two siblings already have** — a one-line change
that makes it consistent rather than special-cased.

## §6 Run state and resume

`run.md` exists to make a resume *correct*, not merely possible. It holds:

1. **The four flags** — so a resumed run never re-asks.
2. **Current phase** — where to re-enter.
3. **Pointers to each phase's own artifact** — spec path, epic id, integration branch, roast report
   paths. Pointers only; `super-auto` never copies what another skill owns.
4. **Parked escalations and beyond-cap items** accumulated so far.
5. **Roast iteration counts, per loop.**

Item 5 is load-bearing: **a cap that lives in session memory is not a cap.** If a restart resets the
counter, the cap-3 loop can run indefinitely. The counts must be durable or the guarantee is
fiction.

On invocation, an existing `run.md` for the same spec means resume from its recorded phase rather
than restart.

## §7 Final report contract

`report.md` is written for someone returning to a run they did not watch. Its job is to make review
efficient: where to start, and what to distrust. **Every section is sourced from a durable
artifact, never from the writing agent's recollection** — a report that narrates from memory is how
a run with parked Blocking findings ends up reading as "done."

It leads with status on one line: `clean` / `completed with N unresolved Blocking, M escalations` /
`stalled at phase X`. Never a bare "done."

**An unresolved escalation forces a non-clean status, even with zero Blocking findings.** An
escalation reached no verdict by construction (§4), so a run carrying one has not been cleared;
reporting `clean` would claim a resolution that never happened — the precise failure this contract
exists to prevent. `clean` requires **both** counts at zero.

| Section | Content | Sourced from |
|---|---|---|
| **Implemented** | What landed, task by task | beads closed under the epic, `super-code`'s `completed`, ledger completion lines with commit ranges |
| **Remaining** | What did not land, and why each one didn't | `escalated`, `pendingRetry`, parked escalations, unresolved Blocking at cap-out |
| **Gotchas & surprises** | Where reality diverged from the design | roast findings that changed a design decision, triaged blocker beads, plan-defect findings, anything that forced a nested brainstorm |
| **Entrypoints** | Where to start reading, in order | the task tree's dependency order — root-most module, public interface, primary caller |
| **Smells** | Code the run is uneasy about, each with a one-line *"the smell"* | parked findings, `DONE_WITH_CONCERNS` reports, tasks needing 4–5 fix rounds, tasks that tripped the breaker |

Two properties of the smells section matter:

- They are **derived, not guessed**. `super-code` already tracks every signal meaning "this was
  hard" — a parked ruling is by definition code merged over a live review finding, and a task that
  burned four fix rounds is one the implementer could not see its way through.
- It is the one place the report deliberately surfaces work that **passed** review. A parked finding
  cleared the gate, but a human reading the diff should know a judge argued against it and was
  overruled.

Entrypoints are ordered for reading, not by importance: start at the front door and follow the
dependency order the task tree already encodes.

## §8 Validation

- **Trigger micro-test** on the frontmatter description — three probes: "take this idea to finished
  code" (expect fire), "review this PR" (expect no fire — `super-roast`), "execute this epic"
  (expect no fire — `super-code`).
- **One cheap end-to-end run:** a trivial feature with both roasts skipped and autonomous off.
  Exercises the whole sequence, every hand-off, and the run directory, without paying for two
  roasts. It is the only test that proves the phases actually chain.
- **A resume test:** interrupt after phase 2, re-invoke, confirm re-entry at phase 3 with flags and
  iteration counts intact rather than a restart.

**Not claimed:** that `super-auto` is validated against a full roast-fix cycle or an autonomous
run. Those cost what a live multi-phase run costs; asserting them without evidence is the failure
mode this fork's own history is a long argument against.

## Out of scope

- Changing how any phase skill works internally (§1).
- Migrating existing flat `specs/` and `plans/` documents into run directories (§5).
- Parallelising the phases — they are strictly serial by construction.
