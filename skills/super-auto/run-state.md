# run.md — the run-state contract

A `super-auto` run crosses multiple skill hand-offs, and spans hours, context
compaction, session restarts, and machine restarts. `run.md` is the single committed
file that lets a resumed run pick up exactly where it left off instead of guessing.
(The phase sequence itself — which skill runs at which phase — is `SKILL.md`'s
contract, not this file's; this file only says what state must persist and how
re-entry uses it.)

It lives at `docs/superpowers/runs/YYYY-MM-DD-<slug>/run.md` and is committed alongside the
other artifacts of the run (spec, plan, roast reports). It is not scratch state —
every field in it is read back on resume and trusted.

## The seven required contents

`run.md` MUST hold exactly these seven things (plus the optional `feedback:` pointer below) **as they become known**. At creation,
before phase 1 runs, five exist — `flags`, `phase`, `idea`, `branch`, and `base`, the last two
because the caller created the workspace in pre-flight — and each of the rest is added as the phase
that produces it returns. Omitted is not the same
as empty: a resume reading no `epic:` line knows phase 1 never got that far, where
an `epic:` with a blank value reads as a malformed file. Each one is load-bearing:
drop it and
a resume can silently redo work or violate a decision that was already made.

1. **The four flags** — `planOneShot`, `skipPlanRoast`, `skipCodeRoast`, `autonomous`.
   These were answered once, at the start of the run. Recording them means a
   resumed run never re-asks — re-asking mid-run would let a resume flip a
   decision the run is already partway through acting on.

   A resume message that itself changes a flag or amends the goal is recorded, never
   dropped: one `resumeChange: YYYY-MM-DD · "<the ask, verbatim>" · <what it changes>` line
   per change, appended below `flags:`. The `flags:` line is updated for a flag change, and
   `idea:` is never rewritten (`SKILL.md` §Resume says how each kind applies).

2. **Current phase** — one of `design | roast-design | capped-blocking | code | roast-code
   | fix-loop | report | finish | done`, matching `SKILL.md`'s seven phases plus
   `done` and the design-roast stop state: `capped-blocking` means the design roast's
   extension round still ended Blocking and a run without `autonomous` stopped before code
   (see `SKILL.md`'s roast-cap note; an autonomous run records `roastDesignCapped` and never
   enters this phase). It is terminal for the run like a stall, and a later
   human-relaunched run that chooses to execute the tree anyway must first append an
   acknowledgment line (`capped-blocking acknowledged: <human's reason>`) to its own
   ledger before entering phase 3. A phase that does not run — skipped by flag, or with no work to do
   (`fix-loop` after a clean roast) — is still written, with `(skipped)`
   appended, then advanced past: a bare jump is unreadable as
   skipped-versus-never-reached. `finish` means phase 7 started but is not
   confirmed complete — a resume reading it must verify the merge, not treat the
   run as over. `done` means the human answered the menu, whichever option they
   chose; "keep the branch as-is" ends the run as surely as a merge.

   **A stall at phase 1–5 never advances `phase` to `report`** — it still writes
   `report.md` (`status: stalled at phase <phase>`, naming whatever `phase` already
   held), but leaves that field where it was. A stall *at* phase 6 itself is the
   one case where `phase` legitimately already reads `report` with a `stalled`
   status line — which is why phase 7's gate (`SKILL.md`'s Phase sequence) checks
   three things, not two: `report.md` exists, `phase` reads `report`, **and** the
   status line does not begin `stalled`. Only the third condition closes that
   remaining case.

3. **Pointers** — the raw idea text, spec path, epic id, integration branch, the
   **base branch** the run merges back into — the repo branch this run's worktree was cut
   from, usually `main` — and the roast report paths. `branch` is this run's own
   branch, which is also the integration branch `super-code` merges into. There is no plan pointer: a
   tracker is required (`SKILL.md` §Pre-flight), so the epic is the plan and
   `epic` already points at it. `base` is written in pre-flight, when this run's
   worktree is created, and exists so phase 7 can supply it instead of asking: this skill's
   finish step asks for the base only "if it is not already known," and a resumed
   run has no other way to know it. Pointers only,
   never inline content: `run.md` says *where* the spec and reports live and never
   restates them. One exception to "pointers only," deliberate: `idea`
   carries the raw idea verbatim, because the resume rule's fallback matches on it
   and a run whose session dies during phase 1 has no spec to match on yet. There is
   no `plan` pointer at all — a tracker is required, so the epic and its beads are
   the plan, and a `plan:` line would only send a resume looking for a file that was
   never meant to exist. Optional `skillSource: <abs skills path> @ <sha>[+dirty:<hash>] (<version>)`
   appears only after a mid-run definitions switch (`SKILL.md` §Pre-flight); a resume
   reads skills from it, and `migrated:` lines beside it map fields the new contract dropped.

   All path-valued pointers are given **relative to the run directory**
   (`docs/superpowers/runs/YYYY-MM-DD-<slug>/`) — never bare filenames, never full
   repo-relative paths. There is no second convention to pick between, which is
   what keeps two implementations of this contract from producing incompatible
   files.

   **Record the filename the producing skill actually wrote — never a name this
   contract wishes it had used.** `brainstorming` writes
   `YYYY-MM-DD-<topic>-design.md`; `super-roast` writes
   `YYYY-MM-DD-<topic>-roast-<mode>-N.md`. Redirecting the directory does not
   rename the file. A pointer invented to look tidy (`design.md`, `roast-code-1.md`)
   is a dangling pointer, and the report is sourced through these pointers — the
   sections that read them come back empty and the report reads thinner than the
   run actually was.

   **Eighth field, OPTIONAL: `feedback: <issue-url>`.** Written by `superpowers:upstream-feedback`
   via `super-auto` when phase 6's analysis pass results in a filed issue; absent when it didn't
   (a clean run, a declined proposal, or a parked-not-yet-filed draft). Unlike the seven required
   fields, its absence is not a sign of an interrupted run — it is the normal outcome whenever
   nothing was filed.

4. **Parked items** — four kinds, each with its source report:
   - **escalations** — a roast finding that reached no verdict at all;
   - **beyond-cap** — a severe finding the panel cap left unjudged, or one under the report's
     `## Not verified (dedupe failed or judge lost)` heading;
   - **degraded-verdict** — a sibling's own mandated pause that autonomous mode
     answered on the human's behalf instead of asking: a declined
     re-roast-at-raised-`config.panelCap` offer, or a `clean [low coverage]` /
     `clean [panel-capped: N unverified]` verdict autonomous mode proceeded past.
     Recorded with which branch was taken, e.g. `"clean [low coverage] — proceeded"`.
     A goal- or scope-changing redesign the phase-5 step-back proposed and autonomous mode
     did not apply is this kind too: `"redesign proposed, not applied — <one line>"`.
   - **graph-change** — an edge change or proposal from super-design's parallelism pass that
     was not applied (outside the safe class), as super-design recorded it beside its
     `graph-pass:` line.

   **Parking is mode-independent.** A `beyond-cap` or `degraded-verdict` item is
   recorded the same way whether autonomous mode answered the question or a human
   did — including when the human answers "proceed anyway." Only the recorded
   branch differs (`"— proceeded, not re-roasted"` either way; note who chose).
   Recording only the autonomous answers would mean an interactive run can decline
   a panel-cap re-roast, proceed, and still report a bare `clean` — the exact
   outcome the status line exists to make impossible. The question was raised and
   an unverified Blocking candidate survived it; who answered does not change that.

   These are decisions already surfaced during design or code roast — or, for
   degraded-verdict entries, decisions a sibling skill would have put to a human
   and autonomous mode made instead — that a human (or a later phase) still needs
   to see. If they're not carried in `run.md`, a resume loses track of open
   concerns or self-made calls that a roast round or fix loop the current session
   never saw raised or made.

5. **Roast iteration counts, per loop** — `roastDesignRound`, `roastCodeRound`.
   **Both are written per round, by whichever skill is running that round** —
   `roastCodeRound` by the sequencer, `roastDesignRound` by `super-design`, whose
   loop runs inside its own invocation where the sequencer has no control. A count
   written only when a loop finishes is not durable, which is the whole point of
   the paragraph below.
   Both roast fix loops (design and code) are capped at 3 iterations. That cap is
   only real if the count survives a restart:

   > A cap that lives in session memory is not a cap: if a restart resets the
   > counter, the cap-3 loop can run indefinitely.

   Persisting `roastDesignRound` / `roastCodeRound` in `run.md` is what makes the
   cap durable across any restart, not just within one session.

   **`roastDesignCapped`** — written by `super-design` when the design roast's extension round
   still ends Blocking: `roastDesignCapped: <unresolved finding ids> · <extension report path> ·
   stopped | proceeded`. `stopped` is a run without `autonomous` (phase `capped-blocking`);
   `proceeded` is an autonomous run that parked each of those findings and went on to phase 3.

   **`roastCodeCapped`** — written by the sequencer the moment the
   code-roast cap trips with Blocking findings still confirmed, before those findings
   are parked into the punch list: the unresolved finding ids (as the report lists
   them), the path of the round-3 report, and one line on what authority the next
   step needs (an operator ruling, a scope decision, a dependency outside the run).
   Absent when the loop converged or the cap tripped clean. A resume that reads
   `phase: roast-code` with `roastCodeCapped` present knows the review budget is
   exhausted and must not start round 4; one that reads the phase without it is
   mid-loop. A whole-branch roast run after this point — a post-cap audit — is
   invoked with iteration `post-cap audit` and its report path is appended here,
   never counted as a fourth round.

6. **`super-code`'s returned buckets** — `completed`, `escalated`, `pendingRetry`,
   `parked`, `stalled`, `review`, `sweep`, and `slowness` (appended across invocations, not
   overwritten), recorded verbatim at **every** phase 3→4 transition —
   overwritten on each fix-loop re-entry, not written once. `super-code` runs again
   for every fix round, and the buckets it returns then are the current truth; keeping
   only the first run's would leave every fix bead out of the report's Implemented
   section and every fix-loop quarantine out of its escalation count, which is exactly
   how a run reports `clean` over an escalation.
   `super-code` returns these once, to the calling session, and does not itself
   persist them; `report-prompt.md`'s Implemented and Remaining sections are
   sourced from them, and its own sourcing rule anticipates the writing agent may
   not be the one that ran phase `code`. Unrecorded, these buckets exist only in a
   session that may have already compacted or ended by the time `report` runs.

   **Do not wait for the return to start writing them.** Phase 3 is the longest
   stretch of a run, and a return-only write records nothing across it: a session
   that ends inside phase 3 resumes knowing only `phase: code`. Refresh
   `codeBuckets` from the tracker as the phase proceeds — closed beads under the
   epic are `completed`, quarantined ones are `escalated` — so the file always
   reflects the last completed round. A `review: <id>` bead (label `sp:review`) is
   super-code's bookkeeping, never a task: skip it, and count a task whose
   review bead is still open as in flight, not completed. Same fields, written more often; not a
   second schema.

   **`review` records what the final whole-epic review found, not only that it
   ran.** `CLEAN` when it found nothing; otherwise the verdict and its finding
   count (`Blocking (10 confirmed)`). That review is mandatory in `super-code`
   even when `skipCodeRoast` omitted the PR-mode roast, and its findings are
   fixed the same way phase 5's are — **as beads under the epic**, carrying the
   parent link and `sp:` label, never as ad-hoc branches. A fix campaign that
   leaves no beads is invisible to the tree, to `codeBuckets`, and to the report,
   which then describes a run that reviewed clean.

   **`sweep` is the run's one full-suite result**, verbatim with the SHA it measured.
   `super-code` runs with `deferSweep: true`, so until phase 6 this field reads
   `SWEEP DEFERRED (caller-owned)`. Phase 6 runs the sweep after phase 5 exits and overwrites
   it; the report cites it only when that SHA is the tip it describes (`SKILL.md`'s phase 6).

   **`sweepFix:`** — written when a failing phase-6 sweep gets its one fix pass: the failing
   count, the fix beads filed, and, once the re-run is back, its result
   (`sweepFix: 3 failing → bd-431, bd-432 · re-run PASS 415 tests @ 7c01d9e`). Present means the
   pass was spent: a resume re-runs the sweep if the re-run result is missing, and never files a
   second pass.

7. **Design decisions already made, and what each one covered.** Each is made
   **once**, by the human or by the run per `super-design` §Gates by Mode. A resumed
   run replays a recorded decision instead of re-making it; without this, a session
   that ends after the design was approved comes back and asks for the same approval
   again.

   **An approval is bound to what it approved, and a record that cannot be checked
   is not an approval.** Record enough to tell whether the thing changed:

   - `top-split · human | auto` — the child ids and their `LEAF`/`PROMOTE` verdicts,
     as approved (`human`) or applied (`auto`). On resume, replay only if the current
     set is identical; if it changed, decide again per `super-design` §Gates by Mode
     and say what changed.
   - `design-review · pending | approved` — a one-shot run's stop at the end of phase 2
     (`SKILL.md` §Autonomous mode): `pending` when it stops, `approved` on the human's
     go-ahead.
   - `coverage-round-<N>` — the disposition applied to each finding in that round,
     each marked `auto` or `human` (`super-design` disposes automatically; only an
     `ORPHAN`, and only in an interactive run, is the human's). Replay these rather than re-applying them, and read the highest N
     as how many of the loop's two rounds are already spent. Findings a later
     round newly surfaces are covered by no earlier round's record.
     Round 1's record also carries the canonical requirement list the orchestrator
     derived for the root pass (R-id + text; any `R-new` a reviewer proposed is
     appended here for round 2) and the `requirements: N · mapped: M · unmapped: K
     (…)` line unioned by id from the two reviewers. Round 2 reads the R-list
     back from round 1's record rather than re-deriving it, appending only new
     `R-new` ids — existing ones are never renumbered.
   - `stepBack-round-<N>` — the phase-5 step-back decision for that code-roast round, one
     line in the format `super-design/step-back-prompt.md` defines, written before the scope
     filter runs. The full output sits beside that round's report as
     `…-roast-pr-<N>-step-back.md`, and every fix bead of the round links it:

     ```
     stepBack-round-2: redesign — applied: token refresh in each handler → one refresh middleware (dissolves 3)
     ```

     A resume replays it: a recorded step-back is not re-dispatched, and an `applied`
     redesign's spec amendment is applied from the record if it is not yet committed.
   - `scopeFilter-round-<N>` — one line per confirmed roast finding from that fix-loop
     round that the step-back did not dissolve, keyed on the finding's `[SEV] <location>`
     prefix carried verbatim (the roast report defines no finding id; this prefix is its
     stable key), each marked
     `in-scope` or `punch-list` with a one-line reason:

     ```
     scopeFilter-round-1: [Blocking] auth/token-refresh.ts:88 in-scope — Blocking, always in-scope
     scopeFilter-round-1: [Nit] lib/format.ts:12 punch-list — goal doesn't mention formatting
     scope-filter: 1 in-scope · 1 punch-listed
     ```

     A finding pulled in by its cluster (`SKILL.md` §Phase 5 step 2) records
     `in-scope — cluster <id>`; a member kept out by the filter's `clusterOverride` records
     `punch-list — cluster override: <reason>`.

     The block **ends** with one aggregate line, `scope-filter: <in-scope> in-scope · <punch>
     punch-listed`, written by `super-auto` in the same phase-5 step — not by the scope-filter
     pass itself. A resume matches each round's findings against this record exactly on the
     `[SEV] <location>` key and replays the disposition rather than re-dispatching the filter.
   - `regressionPass-round-<N>` — the one regression-only fix pass a `[converged]` round with
     `[fix-regression]` findings gets (`SKILL.md` §Phase 5): the count filed, each finding's
     `[SEV] <location>` key verbatim, and `no re-roast`:

     ```
     regressionPass-round-2: 2 filed · [Should-fix] src/client/seat.ts:41, [Should-fix] src/rejections.ts:88 · no re-roast
     ```

     Written when the beads are filed. A resume that finds it does not file again; the beads'
     own state says whether the `super-code` re-entry finished.

   Anything not recorded was never approved. **Never widen a replay into a blanket
   "the human approved this run"** — that turns one approval into consent for work
   they never saw, which is the failure mode this record exists to prevent, arrived
   at from the other direction.

## File format — worked example

The following is a real `run.md` mid-run: the design phase went through two roast
rounds (one still parked as an escalation) and the run is now one round into
code roast.

```markdown
# super-auto run — 2026-07-31-per-tenant-rate-limiter

flags: planOneShot=false skipPlanRoast=false skipCodeRoast=false autonomous=true
phase: roast-code

idea: add a per-tenant rate limiter to the public API
spec: 2026-07-31-per-tenant-rate-limiter-design.md
epic: bd-412
branch: super-auto/per-tenant-rate-limiter
base: main
roast-design: 2026-07-31-per-tenant-rate-limiter-roast-design-1.md, 2026-07-31-per-tenant-rate-limiter-roast-design-2.md
roast-code: 2026-08-01-per-tenant-rate-limiter-roast-pr-1.md

roastDesignRound: 2
roastCodeRound: 1

approvals:
- top-split · auto · bd-413 PROMOTE, bd-414 PROMOTE, bd-415 LEAF, bd-416 LEAF
- coverage-round-1 · canonical R-list: R1 "enforce per-tenant request quota", R2 "reject over-quota requests with 429", R3 "expose current quota usage to callers" · requirements: 3 · mapped: 2 · unmapped: 1 (R3) · auto GAP "no backpressure path" → leaf bd-417; auto ORPHAN "metrics exporter" → kept, goal element added; auto UNOWNED-SEAM "tenant-id propagation" → contract bd-418 / integration bd-419; auto unstated "bd-411<-bd-405" → edge dropped (no artifact to name); auto GAP "R3 unmapped — usage exposure" → leaf bd-420

parked:
- 2026-07-31-per-tenant-rate-limiter-roast-design-2.md · escalation · "cache invalidation premise unverified — no valid judge votes"
- 2026-07-31-per-tenant-rate-limiter-roast-design-2.md · degraded-verdict · "clean [low coverage] — proceeded, not re-roasted"
- 2026-08-01-per-tenant-rate-limiter-roast-pr-1.md · beyond-cap · "Blocking candidate left unjudged at panel cap"

codeBuckets:
  completed: bd-413, bd-414
  escalated:
  pendingRetry:
  parked: bd-415
  stalled: false
  review: CLEAN
  sweep: PASS 412 tests @ 3f9c2e1
```

## The resume rule

Normative in `SKILL.md` §Resume, restated here only as a pointer: resume from the recorded phase;
never re-ask the flags, never reset a counter.
