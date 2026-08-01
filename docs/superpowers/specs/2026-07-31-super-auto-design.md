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
`super-code` → `super-roast` → fix loop → report → `finishing-a-development-branch` (§3), threads
four flags through them, and carries parked escalations between phases. It does not decompose, review, execute, or fix — each of those
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
| 6 | fix loop | Reopen the root epic, file confirmed findings as beads under it, re-enter `super-code`, re-roast |
| 7 | report | Write `report.md` per §7 — **before** anything is torn down |
| 8 | `finishing-a-development-branch` | Merge the integration branch and clean up — **once, at the very end** |

**Phase 7 must precede phase 8, and that ordering is the whole point.** Two of §7's five sources —
the ledger's completion lines and the per-task implementer reports — live git-ignored inside the
integration worktree, and phase 8 removes it. Writing the report after the teardown reproduces
exactly the defect that moving the finish out of `super-code` was meant to fix. Phase 8 is gated on
`report.md` existing.

**Phase 6 reopens the root epic first.** `super-code` terminates when the root epic closes, and its
close-eligible fixpoint runs inside the loop — so by the time the code roast returns findings, the
epic `super-code` just drained is closed. Filing beads under it and re-invoking would hit a loop
whose first termination check has already fired. Reopen, then file, then re-enter.

**`super-code` is told not to run its own Finish hand-off.** Left to itself, `super-code`'s Finish
merges the integration branch and hands to `finishing-a-development-branch`, whose cleanup runs
"for every option" and removes the integration worktree. That would destroy the git-ignored
`.superpowers/sdd/` scratch inside it — including the ledger, which is the *only* place a PARK
ruling's reasoning is recorded — and would leave phase 5 roasting already-merged code and phase 6
filing beads against a closed epic.

So `super-auto` owns the finish exactly as it owns the hand-off out of `super-plan` (§3 above):
`super-code` stops when its loop drains, phases 5–6 run against a **live** integration worktree,
and `super-auto` hands to `finishing-a-development-branch` once phase 8's gate passes. That gate is
**three conditions**, not the fix loop's exit alone: `report.md` exists, `run.md`'s `phase` reads
`report`, and `report.md`'s status line does not begin `stalled`. Two conditions are not enough — a
stall recorded exactly at phase 7 can otherwise leave both `phase: report` and a `report.md`
present without the fix loop having actually exited (clean, capped out, or skipped); the third
condition is what closes that case. `clean` is itself a loaded verdict token in `super-roast`/
`super-plan` (a `clean [low coverage]` qualifier is explicitly not a clearance), so the gate never
treats that token as sufficient on its own either: a cap-out that parks Blocking findings still
proceeds to finish, which is what §4's accepted risk describes.
This is what keeps §7's cited sources reachable at report time.

**Step 6 mirrors `super-plan`'s loop deliberately:** cap 3, and stop early if an iteration does not
shrink the confirmed-Blocking count — that is thrash, not progress. Findings become beads rather
than inline edits so fixes inherit per-task worktrees, review, and serial merge-back, and so
everything continues to coordinate through beads rather than session memory.

## §4 Autonomous mode

**Autonomy begins the moment `super-plan`'s coverage loop passes.** Everything up to and including
that point is interactive; from there on, no queries.

The anchor is the coverage loop, not "the settled tree" — `super-plan` uses *settled* to mean the
state **before** its coverage loop runs, so borrowing the word would put the coverage loop's own
human arbitration (accepting GAPs, deciding ORPHANs, the recall-floor read-through) inside the
autonomous zone, where parking cannot serve it: an accepted GAP that is merely parked never becomes
a task.

**Phase 3 is inside the autonomous zone.** `super-plan`'s adversarial-review offer and its fix loop
execute within the `super-plan` invocation, after the coverage loop — so in autonomous mode
`super-auto` accepts the offer without asking and the loop's pauses are parked, which is what the
request ("performs all roast fixes without asking") specifies.

An earlier draft anchored this to "the first roast report exists." That anchor breaks whenever a
roast is skipped: with both `skipPlanRoast` and `skipCodeRoast` set and `autonomous` on, no roast
report is ever produced, so autonomy would never begin and the flag would be inert for the whole
run. The coverage loop passing is well-defined in every flag combination, which is why it, not a
roast report, is the anchor.

### Sibling skills mandate human pauses inside the autonomous zone

`super-plan` and `super-roast` both require a human at points that now fall *after* the boundary:
`super-plan` "pause[s] and summarize[s] for the human" at both loop exits and says "surface every
entry to the human before starting fix work"; `super-roast` states "both the cap-out and the clean
exit pause for the human." In autonomous mode an agent would otherwise face a direct contradiction
between the skill it is running and the skill it invoked.

**Resolution:** in autonomous mode, a sibling's mandated human pause is satisfied by **recording the
item as parked in `run.md` and surfacing it in the final report** — not by querying. This is the
same trade already made for escalations: nothing is auto-adjudicated and nothing is discarded, but
the human reads it at the end rather than mid-run. Outside autonomous mode the siblings' pauses
happen normally.

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
2. **Current phase** — one of `brainstorm | plan | roast-design | code | roast-code | fix-loop |
   report | finish | done`, matching §3's eight phases 1:1 plus the terminal `done`. `finish` means
   phase 8 started but isn't confirmed complete; `done` means it is. A stall leaves `phase` at
   whatever value was in flight rather than advancing it to `report` — see §3's three-condition
   gate.
3. **Pointers to each phase's own artifact** — spec path, epic id, integration branch, roast report
   paths. Pointers only; `super-auto` never copies what another skill owns.
4. **Parked items, three kinds** — escalations and beyond-cap findings (as before), plus
   degraded-verdict records: a sibling's own mandated pause (a declined raised-panelCap re-roast, a
   `clean [qualifier]` proceed decision) that autonomous mode answered instead of asking, recorded
   with which branch was taken.
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

It leads with status on one line, one of **four**: `clean` / `clean [degraded: ...]` / `completed
with N unresolved Blocking, M escalations` / `stalled at phase X`. Never a bare "done."

**An unresolved escalation forces a non-clean status, even with zero Blocking findings.** An
escalation reached no verdict by construction (§4), so a run carrying one has not been cleared;
reporting `clean` would claim a resolution that never happened — the precise failure this contract
exists to prevent. Bare `clean` requires both counts at zero **and** zero parked degraded-verdict
records (§6 item 4).

**`clean [degraded: ...]` is the fourth status, not a variant of `clean`.** Zero Blocking and zero
escalations no longer means nothing was left for a human: a degraded-verdict record means a
sibling's own gate was answered on the human's behalf instead of asked. A roast skipped by flag is
the same case by extension — nothing was adversarially reviewed, so zero findings means "never
checked," not "checked and clean." With both roasts skipped, the status is
`clean [degraded: plan roast skipped, code roast skipped]`, never bare `clean`.

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
  Note this configuration deliberately does **not** exercise autonomous mode — with autonomy off the
  boundary anchor is inert, so this run proves the phases chain and nothing about §4. A second run
  with `autonomous` on is what would test the boundary; it is not part of this plan's validation.
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
