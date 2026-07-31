# run.md — the run-state contract

`super-auto` orchestrates `brainstorming` → `super-plan` → `super-roast` (design) →
`super-code` → `super-roast` (PR) as one run. A run spans hours and crosses context
compaction, session restarts, and machine restarts. `run.md` is the single committed
file that lets a resumed run pick up exactly where it left off instead of guessing.

It lives at `docs/superpowers/runs/<slug>/run.md` and is committed alongside the
other artifacts of the run (spec, plan, roast reports). It is not scratch state —
every field in it is read back on resume and trusted.

## The five required contents

`run.md` MUST hold exactly these five things. Each one is load-bearing: drop it and
a resume can silently redo work or violate a decision that was already made.

1. **The four flags** — `planOneShot`, `skipPlanRoast`, `skipCodeRoast`, `autonomous`.
   These were answered once, at the start of the run. Recording them means a
   resumed run never re-asks — re-asking mid-run would let a resume flip a
   decision the run is already partway through acting on.

2. **Current phase** — one of `brainstorm | plan | roast-design | code | roast-code
   | report | done`. This is the resume pointer: it says which stage of the
   pipeline was in flight when the run last stopped, so re-entry knows what to do
   next instead of what to do first.

3. **Pointers** — spec path, plan path, epic id, integration branch, roast report
   paths. Pointers only, never inline content. `run.md` says *where* the spec,
   plan, and reports live; it never restates their contents. Content lives in its
   own file and can grow or be re-read independently of the state file.

4. **Parked items** — escalations and beyond-panel-cap findings accumulated so far,
   each with its source report. These are decisions already surfaced during design
   or code roast that a human (or a later phase) still needs to see. If they're
   not carried in `run.md`, a resume loses track of open concerns that were raised
   in a roast round the current session never saw.

5. **Roast iteration counts, per loop** — `roastDesignRound`, `roastCodeRound`.
   Both roast fix loops (design and code) are capped at 3 iterations. That cap is
   only real if the count survives a restart:

   > A cap that lives in session memory is not a cap: if a restart resets the
   > counter, the cap-3 loop can run indefinitely.

   Concretely: an autonomous run that restarts mid-roast-loop with the round
   counter reset to zero will run the fix-and-reroast cycle for another 3 rounds,
   and another 3 after the next restart, without limit — burning the most
   expensive model in the pipeline on a loop that was supposed to terminate.
   Persisting `roastDesignRound` / `roastCodeRound` in `run.md` is what makes the
   cap durable across any restart, not just within one session.

## File format — worked example

The following is a real `run.md` mid-run: the design phase went through two roast
rounds (one still parked as an escalation) and the run is now one round into
code roast.

```markdown
# super-auto run — 2026-07-31-rate-limiter

flags: planOneShot=false skipPlanRoast=false skipCodeRoast=false autonomous=true
phase: roast-code

spec: docs/superpowers/runs/2026-07-31-rate-limiter/design.md
plan: docs/superpowers/runs/2026-07-31-rate-limiter/plan.md
epic: bd-412
branch: epic-bd-412-integration
roast-design: roast-design-1.md, roast-design-2.md
roast-code: roast-code-1.md

roastDesignRound: 2
roastCodeRound: 1

parked:
- roast-design-2.md · escalation · "cache invalidation premise unverified — no valid judge votes"
- roast-code-1.md · beyond-cap · "Blocking candidate left unjudged at panel cap"
```

Every field above is one of the five required contents: `flags` and `phase` are
items 1 and 2; `spec`/`plan`/`epic`/`branch`/`roast-design`/`roast-code` are the
pointers of item 3 (each one names a path or id, never inline content);
`roastDesignRound`/`roastCodeRound` are item 5; `parked` is item 4, with each
entry naming its source report.

## The resume rule

> On invocation, an existing `run.md` for the same spec means **resume from its recorded phase**, not restart. Re-entry reads the flags and iteration counts
> from the file and continues; it never re-asks the flags and never resets a
> counter.

This is the failure the rule exists to prevent: a resumed run that restarts at
phase 1 re-brainstorms an already-approved spec and re-executes work that has
already been merged.
