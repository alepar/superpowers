# report.md — the final report contract

`report.md` is produced at phase `report` and lives at
`docs/superpowers/runs/<slug>/report.md`, committed alongside the run's other
artifacts. It is written for one reader: a human who did not watch the run and is
now deciding what to do with it — merge, dig further, or intervene. That reader has
no context except this file, `run.md`, and the diff.

An autonomous run can finish having merged code with known Blocking findings, or
with an escalation that never reached a verdict — both are accepted, documented
risks of the design, not bugs. This file's whole job is to make sure that outcome
is never mistaken for "everything's fine." A report that reads clean when a
Blocking finding was parked, or an escalation left unresolved, is the exact
failure this contract exists to prevent.

## The status line

`report.md` opens with exactly one status line, and it MUST be exactly one of:

```
status: clean
status: clean [degraded: <qualifier>, ...]
status: completed with <N> unresolved Blocking, <M> escalations
status: stalled at phase <phase>
```

An escalation is a distinct outcome class from a Blocking finding: it is a case
that reached no verdict at all, not a case that reached a Blocking verdict. Both
counts are tracked because either one alone can make "clean" a lie: **an
unresolved escalation forces a non-clean status even at zero Blocking findings**,
and bare `clean` requires `<N>` and `<M>` both zero **and** zero parked
`degraded-verdict` records (`run-state.md` item 4).

**`clean [degraded: ...]` is the fourth status, not a variant of `clean`.**
Autonomous mode answers a sibling's own gate on the human's behalf — declining a
raised-`config.panelCap` re-roast, or proceeding past a `clean [low coverage]` /
`clean [panel-capped: N unverified]` verdict — and parks the road not taken
(`run-state.md`'s `degraded-verdict` kind) rather than asking. Zero Blocking and
zero escalations no longer means nothing was left for a human: it can mean a
human's call was made *for* them. Reporting bare `clean` when a degraded-verdict
record exists is the same lie as reporting `clean` over an unresolved escalation
— list every qualifier that was parked, e.g. `clean [degraded: low coverage]`.

**A skipped roast is also a degraded qualifier**, sourced from `run.md`'s own
`skipPlanRoast`/`skipCodeRoast` flags rather than a parked record: nothing was
adversarially reviewed, so zero Blocking and zero escalations means "never
checked," not "checked and clean." With both flags set, the status line is
`clean [degraded: plan roast skipped, code roast skipped]`, never bare `clean` —
that configuration is also what the cheap end-to-end validation run uses, so
it is the first status line anyone reading this contract's output will see.

The prohibition: never a bare "done." "Done" says nothing about which of the four
states above actually happened, and a run that parked Blocking findings, or left
an escalation unresolved, and reports "done" is indistinguishable, at a glance,
from a run that has neither. If the run stalled, name the phase it stalled at
(e.g. `stalled at phase roast-code`) — that phase name comes straight from
`run.md`'s `phase` field, not from memory of how the run went.

## The five sections, and where each one comes from

The report has exactly five sections. Every one names, in its own text, the
durable artifact it was built from — not because it reads better, but because that
naming is what lets a reader check the report against the artifact instead of
taking it on faith.

This is only possible because `report.md` is written **before** the integration
worktree is torn down: the ledger and implementer reports these sources cite live
git-ignored inside that worktree, and are gone once it's removed — so a future
edit that lets `super-code` run its own Finish (worktree removal included) before
`report` runs would silently cut off two of the five sources below.

| Section | Content | Sourced from |
|---|---|---|
| Implemented | What landed, task by task | beads closed under the run's epic; `super-code`'s `completed` bucket, recorded in `run.md`'s `codeBuckets` (item 6) at the phase 4→5 transition — not session memory; ledger completion lines, each with its commit range |
| Remaining | What did not land, and why each didn't | `codeBuckets`' `escalated` and `pendingRetry`; parked escalations carried in `run.md`; unresolved Blocking findings still open at panel cap-out |
| Gotchas & surprises | Where reality diverged from the design | roast findings that changed a design decision; blocker beads that were triaged; plan-defect findings; anything that forced a nested brainstorm |
| Entrypoints | Where to start reading, in order | the task tree's dependency order: root-most module first, then its public interface, then the primary caller |
| Smells | Code the run is uneasy about, each with a one-line "the smell" | parked findings; parked `degraded-verdict` records (a road not taken because autonomous mode answered a sibling's gate itself); `DONE_WITH_CONCERNS` implementer reports; tasks that needed 4-5 fix rounds; tasks that tripped the fix-loop breaker |

## Smells: the section that surfaces what passed

Two properties of the Smells section are load-bearing and easy to lose in a rewrite:

> Smells are **derived, not guessed**. `super-code` already tracks every signal
> that means "this was hard": a parked ruling is by definition code that was merged
> over a live review finding, and a task that burned four fix rounds is one the
> implementer could not see its way through cleanly. Populating this section means
> reading those signals back, not re-judging the code from scratch.

> This is the one section that deliberately surfaces work that **passed** review.
> Every other section can restrict itself to what's still open or what broke. A
> parked finding cleared the gate — the code is merged, the task is `completed` —
> but a human reading the diff should still know a judge argued against it and was
> overruled. Leaving parked-but-passed work out of the report because it "isn't a
> problem anymore" is exactly how a run with known-argued-over code ends up reading
> as unremarkable.

## The sourcing prohibition

> Every section is sourced from a durable artifact — a bead, a ledger line, a
> `run.md` pointer, a roast report, `run.md`'s recorded `codeBuckets` — never
> from the writing agent's recollection of how the run felt, and never from
> `super-code`'s return value directly, which is not itself durable. If a fact
> cannot be traced to one of those artifacts, it does not go in the report.

This is what keeps the report honest under compaction and restart: the agent
writing `report.md` may not be the agent (or even the session) that ran phase
`code` or `roast-code`. It has no memory of that work beyond what those phases
wrote down. A report narrated from recollection is exactly how a run with parked
findings ends up reading as "done."
