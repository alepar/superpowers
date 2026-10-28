# super-auto — autonomous by default, both roasts on

## Goal

An unqualified `/super-auto <idea>` runs fully autonomous (no questions from launch to the
phase-7 hand-back) with both the design roast and the code roast enabled, while an explicit
request for interactive mode, a design-review stop, or skipping either roast still takes effect,
and a resumed run keeps the flags it recorded.

Literal request: "also $ht handoff to claude-2 to make fully autonomous mode, both roasts on the
default mode of /super-auto".

## Problem description

`skills/super-auto/SKILL.md` §Inputs collects four flags (`planOneShot`, `skipPlanRoast`,
`skipCodeRoast`, `autonomous`) "in one batched question, asking only for those the invocation
leaves open; each defaults to `false`". An unqualified invocation therefore stops at launch to ask,
and if the human accepts the defaults the run is interactive (Mode A design, top-split approval)
with both roasts on. The human wants the unqualified invocation to be the fully autonomous run.
The entry-point wording (the skill's `description`, its opening paragraph, README) also calls
autonomy "optional", which would then be wrong.

## Main challenges

Changing one default touches text other parts of the skill rely on: the flag-collection rule
(there is no longer anything "left open", so the batched question disappears for an unqualified
invocation), the confirmation wording in §Autonomous mode, and resume semantics (a resume must read
the recorded `flags:` line and never fall back to the new defaults). The explicit opt-outs must stay
reachable by plain words, including the `planOneShot`-without-`autonomous` design-review stop,
which under the new default needs `autonomous` explicitly off. Default autonomy must not be read as
authority to merge into `base` or to release: §Invariants I5 keeps that merge the human's in every
mode, and nothing here changes it.

## Key decisions made

`autonomous` defaults to `true`; `skipPlanRoast`, `skipCodeRoast` and `planOneShot` default to
`false` (`autonomous` already forces Mode B). Flags the invocation does not state take their
defaults without a question; the run states the resolved flags in one line in its first status
note. Explicit words override: interactive → `autonomous=false`; a design-review stop →
`planOneShot=true, autonomous=false`; skip either roast → the matching skip flag. `run.md`'s
`flags:` line format is unchanged and still records all four values explicitly, so resume reads
them as before and old runs are unaffected. No new flag, mode, field or script.

## Decision points, by section

**§Inputs — defaults and collection.** Recommended: replace "in one batched question … each
defaults to `false`" with a defaults column in the flag table (`autonomous` `true`, the others
`false`) and the rule that flags the invocation does not state take their defaults without asking;
the resolved flags are named in the run's first status note together with what they mean
(§Autonomous mode). Considered: keep the batched question but pre-fill `autonomous=true` — rejected,
since a launch question is exactly the stop "fully autonomous" removes. Considered: a new named mode
("default mode") — rejected as a new abstraction the four flags already express.

**§Inputs — opt-outs.** Recommended: one sentence mapping plain requests to flag values:
"interactive" / "not autonomous" / a bare "ask me" → `autonomous=false` ("ask me only about X" is a reserved topic, §Autonomous mode Reserved decisions, and keeps `autonomous=true`); "stop for design review" (or
`planOneShot` stated without `autonomous`) → `planOneShot=true, autonomous=false`; "skip the
plan/design roast" → `skipPlanRoast=true`; "skip the code roast" → `skipCodeRoast=true`. An
invocation that states both `autonomous` and a design-review stop is contradictory; take the
explicit `autonomous` value as stated and say so in the status note (no question: a reserved-topic
question is still the only pre-launch ask, §Autonomous mode Reserved decisions). Considered:
treating `planOneShot=true` alone as still autonomous — rejected, it would make the design-review
stop unreachable without the user knowing a second flag.

**§Autonomous mode — confirmation text.** Recommended: "Say this when confirming the flags" becomes
"Say this in the status note that names the resolved flags", keeping the existing meaning lines,
and the "Neither flag" bullet stays (it now arises only from an explicit interactive request).
Considered: deleting the confirmation — rejected, the human still needs to see that the run will
not ask anything.

**Resume.** Recommended: no behavior change; add one clause to §Inputs and run-state.md item 1 that
a resume reads the recorded `flags:` line and never re-applies defaults. resume.md's
`resumeChange:` path already handles a resume message that changes a flag. Considered: migrating
older `run.md` files — rejected; every `flags:` line already carries all four keys
(`scripts/report-status` exits 2 otherwise).

**Merge and release authority.** Recommended: add to the `autonomous` row that it never covers the
merge into `base` (§Invariants I5); no other change. I5 already says "in every mode".

**Entry points.** Recommended: the SKILL.md `description` ("optionally unattended" → "unattended
by default"), its opening paragraph ("an optional autonomous mode" → autonomous by default, with an
interactive opt-out), README's super-auto mentions (feature line, "Hand over a small project"
example, skills table). `skills/using-superpowers/SKILL.md` names no mode and is unchanged. One
`MAINTENANCE.md` bullet records the change (SKILL.md carries no history). Historical specs and
INDEX rows are not rewritten; the 2026-07-31 super-auto spec gets a dated Post-Implementation Note.

**Evaluation.** Recommended: before/after behavioral probes run by the orchestrator (not a leaf:
they need fresh agents), each giving a fresh subagent the SKILL.md text (pre-change from `base`,
post-change from the branch) and an invocation, asking for the `flags:` line it would write and
whether it would ask anything before phase 1, and whether it would stop anywhere before the phase-7 hand-back (the existing §Autonomous mode answers the design- and code-roast pauses; the probe checks that they still do under the default): (1) unqualified idea; (2) "…, interactive"; (3) "…,
skip the code roast"; (4) "…, one-shot, stop for design review"; (5) a resume whose `run.md` records
`autonomous=f`; (6) "…, autonomous"; (7) "…, autonomous, stop for design review"; (8) "…, one-shot" with no
`autonomous` stated; (9) "…, ask me only about the database schema"; (10) "…, skip the design roast" — and whether the default run would merge into `base` without
the human. Expected after: (1) `autonomous=t`, both skips `f`, no question; (2) `autonomous=f`;
(3) `skipCodeRoast=t, autonomous=t`; (4) `planOneShot=t, autonomous=f`; (5) recorded flags kept;
(6) unchanged; (7) `autonomous=t` with the contradiction named in the status note; (8) `planOneShot=t,
autonomous=f`; (9) `autonomous=t` with the reserved topic recorded under `approvals:`; (10) `skipPlanRoast=t,
autonomous=t`; no unattended merge; and (1), (3), (6), (9), (10) stop nowhere before the phase-7 hand-back. Run each probe in at least two fresh sessions. The project's
drill harness (`evals/`) is not checked out here; the probes are the evidence and are labeled as
subagent micro-tests, not drill evals. Mechanical: the existing `tests/super-auto` suites stay green.

## Key abstractions

No new abstractions; extends the `super-auto` §Inputs flag table (which gains a defaults column, with `autonomous` defaulting to `true`, and one rule mapping plain-word opt-outs to flag values), the §Autonomous mode flag-confirmation text (which moves into the run's first status note) and the `run.md` `flags:` line (format unchanged, and on resume it is still the only source of the flags).

## Post-Implementation Notes

*As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
