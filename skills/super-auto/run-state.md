# run.md — the run-state contract

A `super-auto` run crosses multiple skill hand-offs, and spans hours, context
compaction, session restarts, and machine restarts. `run.md` is the single committed
file that lets a resumed run pick up exactly where it left off instead of guessing.
(The phase sequence itself — which skill runs at which phase — is `SKILL.md`'s
contract, not this file's; this file only says what state must persist and how
re-entry uses it.)

It lives at `docs/superpowers/runs/<slug>/run.md` and is committed alongside the
other artifacts of the run (spec, plan, roast reports). It is not scratch state —
every field in it is read back on resume and trusted.

## The six required contents

`run.md` MUST hold exactly these six things. Each one is load-bearing: drop it and
a resume can silently redo work or violate a decision that was already made.

1. **The four flags** — `planOneShot`, `skipPlanRoast`, `skipCodeRoast`, `autonomous`.
   These were answered once, at the start of the run. Recording them means a
   resumed run never re-asks — re-asking mid-run would let a resume flip a
   decision the run is already partway through acting on.

2. **Current phase** — one of `design | roast-design | code | roast-code
   | fix-loop | report | finish | done`. This is the resume pointer: it says which
   stage of the pipeline was in flight when the run last stopped, so re-entry knows
   what to do next instead of what to do first. The set names exactly `SKILL.md`'s
   seven phases (`design`=1 … `finish`=7), plus `done`: `finish` means phase 7
   (merge + cleanup) started but hasn't been confirmed complete — a resume reading
   `finish` must resume or verify the merge, not treat the run as over; `done` means
   phase 7 actually completed. Reading `done` when phase 7 never ran (skipping
   straight from `report` to `done`) is exactly the failure this enumeration exists
   to rule out — it would resume as "nothing left to do" while the integration
   branch sits unmerged.

   **A stall at phase 1–5 never advances `phase` to `report`** — it still writes
   `report.md` (`status: stalled at phase <phase>`, naming whatever `phase` already
   held), but leaves that field where it was. A stall *at* phase 6 itself is the
   one case where `phase` legitimately already reads `report` with a `stalled`
   status line — which is why phase 7's gate (`SKILL.md`'s Phase sequence) checks
   three things, not two: `report.md` exists, `phase` reads `report`, **and** the
   status line does not begin `stalled`. Only the third condition closes that
   remaining case.

3. **Pointers** — spec path, plan path, epic id, integration branch, roast report
   paths. Pointers only, never inline content. `run.md` says *where* the spec,
   plan, and reports live; it never restates their contents. Content lives in its
   own file and can grow or be re-read independently of the state file.

   All path-valued pointers are given **relative to the run directory**
   (`docs/superpowers/runs/<slug>/`) — never bare filenames, never full
   repo-relative paths. A `spec:` of `design.md` and a `roast-design:` of
   `roast-design-1.md` both resolve against the same run directory; there is no
   second convention to pick between. This is the one rule that keeps two
   implementations of this contract from producing incompatible files.

4. **Parked items** — three kinds, each with its source report:
   - **escalations** — a roast finding that reached no verdict at all;
   - **beyond-cap** — a severe finding the panel cap left unjudged;
   - **degraded-verdict** — a sibling's own mandated pause that autonomous mode
     answered on the human's behalf instead of asking: a declined
     re-roast-at-raised-`config.panelCap` offer, or a `clean [low coverage]` /
     `clean [panel-capped: N unverified]` verdict autonomous mode proceeded past.
     Recorded with which branch was taken, e.g. `"clean [low coverage] — proceeded"`.

   These are decisions already surfaced during design or code roast — or, for
   degraded-verdict entries, decisions a sibling skill would have put to a human
   and autonomous mode made instead — that a human (or a later phase) still needs
   to see. If they're not carried in `run.md`, a resume loses track of open
   concerns or self-made calls that a roast round or fix loop the current session
   never saw raised or made.

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

6. **`super-code`'s returned buckets** — `completed`, `escalated`, `pendingRetry`,
   `parked`, `stalled`, `review`, recorded verbatim at the phase 3→4 transition.
   `super-code` returns these once, to the calling session, and does not itself
   persist them; `report-prompt.md`'s Implemented and Remaining sections are
   sourced from them, and its own sourcing rule anticipates the writing agent may
   not be the one that ran phase `code`. Unrecorded, these buckets exist only in a
   session that may have already compacted or ended by the time `report` runs.

## File format — worked example

The following is a real `run.md` mid-run: the design phase went through two roast
rounds (one still parked as an escalation) and the run is now one round into
code roast.

```markdown
# super-auto run — 2026-07-31-rate-limiter

flags: planOneShot=false skipPlanRoast=false skipCodeRoast=false autonomous=true
phase: roast-code

spec: design.md
plan: plan.md
epic: bd-412
branch: epic-bd-412-integration
roast-design: roast-design-1.md, roast-design-2.md
roast-code: roast-code-1.md

roastDesignRound: 2
roastCodeRound: 1

parked:
- roast-design-2.md · escalation · "cache invalidation premise unverified — no valid judge votes"
- roast-design-2.md · degraded-verdict · "clean [low coverage] — proceeded, not re-roasted"
- roast-code-1.md · beyond-cap · "Blocking candidate left unjudged at panel cap"

codeBuckets:
  completed: bd-413, bd-414
  escalated:
  pendingRetry:
  parked: bd-415
  stalled: false
  review: CLEAN
```

Every field above is one of the six required contents: `flags` and `phase` are
items 1 and 2; `spec`/`plan`/`epic`/`branch`/`roast-design`/`roast-code` are the
pointers of item 3 (each one names a path or id, never inline content) —
`spec`, `plan`, `roast-design`, and `roast-code` are paths, given relative to the
run directory as stated above; `epic` and `branch` are identifiers, not paths,
so the relative-path rule doesn't apply to them — `roastDesignRound`/
`roastCodeRound` are item 5; `parked` is item 4, with each entry naming its
source report and its kind (`escalation` / `beyond-cap` / `degraded-verdict`);
`codeBuckets` is item 6, recorded once, at the phase 3→4 transition.

## The resume rule

> On invocation, an existing `run.md` for the same spec means **resume from its recorded phase**, not restart. Re-entry reads the flags and iteration counts
> from the file and continues; it never re-asks the flags and never resets a
> counter.

This is the failure the rule exists to prevent: a resumed run that restarts at
phase 1 re-brainstorms an already-approved spec and re-executes work that has
already been merged.
