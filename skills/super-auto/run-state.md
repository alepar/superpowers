# run.md — the run-state contract

A `super-auto` run crosses multiple skill hand-offs, and spans hours, context
compaction, session restarts, and machine restarts. `run.md` is the single committed
file that lets a resumed run pick up exactly where it left off instead of guessing.
The phase sequence is SKILL.md §Phase sequence; this file says what state persists and how re-entry uses it.

It lives at `docs/superpowers/runs/YYYY-MM-DD-<slug>/run.md` and is committed alongside the
other artifacts of the run (spec, plan, roast reports). It is not scratch state —
every field in it is read back on resume and trusted.

## Field table

The schema home for `run.md`: every field's name and line format. The numbered items under §Required contents say what each field means and when it is written. A `|` inside a format separates alternatives.

| Field | Line format | Item | Written by |
|---|---|---|---|
| `flags` | `flags: planOneShot=<t/f> skipPlanRoast=<t/f> skipCodeRoast=<t/f> autonomous=<t/f>` | 1 | super-auto, at creation |
| `resumeChange` | `resumeChange: YYYY-MM-DD · "<the ask, verbatim>" · <what it changes>`, one line per change, below `flags:` | 1 | super-auto, on resume |
| `phase` | `phase: <token>`, token one of `design \| roast-design \| capped-blocking \| code \| roast-code \| fix-loop \| report \| finish \| done`, with ` (skipped)` appended for a phase that did not run | 2 | super-design (`design`, `roast-design`); super-auto (the rest, plus `roast-design (skipped)` and `capped-blocking`) |
| `idea` | `idea: <the invocation's idea text, verbatim>` | 3 | super-auto, at creation |
| `spec` | `spec: <spec filename, relative to the run directory>` | 3 | super-design |
| `epic` | `epic: <root epic id>` | 3 | super-design |
| `branch` | `branch: super-auto/<slug>` | 3 | super-auto, at creation |
| `base` | `base: <the branch this run merges back into>` | 3 | super-auto, at creation |
| `roast-design` | `roast-design: <report path>, <report path>, …` | 3 | super-design |
| `roast-code` | `roast-code: <report path>, <report path>, …` | 3 | super-auto |
| `skillSource` | `skillSource: <abs skills path> @ <sha>[+dirty:<hash>] (<version>)`, only after a mid-run definitions switch | 3 | super-auto |
| `migrated` | `migrated: <recorded field or ledger line> → <what it maps to now, or dropped>`, beside `skillSource` | 3 | super-auto |
| `feedback` | `feedback: <issue-url>`, optional: present only when upstream-feedback filed an issue | 3 | super-auto, from `superpowers:upstream-feedback` |
| `parked` | `parked:` then one `- <source report> · <kind> · "<text>"` line per item; kind one of `escalation \| beyond-cap \| degraded-verdict \| graph-change` (source `graph-pass` for a graph change) | 4 | super-design (phases 1–2); super-auto (phase 3 on) |
| `graph-pass` | owned by `super-design` §Parallelism Pass (root only) | 4 | super-design |
| `roastDesignRound` | `roastDesignRound: <N>` | 5 | super-design, every round |
| `roastCodeRound` | `roastCodeRound: <N>` | 5 | super-auto, every round |
| `roastDesignCapped` | `roastDesignCapped: <unresolved finding ids> · <extension report path> · stopped \| proceeded` | 5 | super-design |
| `roastCodeCapped` | `roastCodeCapped: <unresolved finding ids> · <final round's report path> · <authority the next step needs>`, with any `post-cap audit` report path appended | 5 | super-auto (SKILL.md §Cap disposition) |
| `codeBuckets` | `codeBuckets:` then one indented line per bucket below | 6 | super-auto |
| `codeBuckets.completed` | `  completed: <bead ids>` | 6 | super-auto |
| `codeBuckets.escalated` | `  escalated: <bead ids>` | 6 | super-auto |
| `codeBuckets.pendingRetry` | `  pendingRetry: <bead ids>` | 6 | super-auto |
| `codeBuckets.parked` | `  parked: <bead ids>` | 6 | super-auto |
| `codeBuckets.stalled` | `  stalled: true \| false` | 6 | super-auto |
| `codeBuckets.review` | `  review: CLEAN`, or `  review: <verdict> (<N> confirmed)` | 6 | super-auto |
| `codeBuckets.sweep` | `  sweep: <one-line result> @ <sha>`, the result in `super-code`'s sweep form, `<sha7> — <P> passed, <F> failed, <E> errors, <S> skipped; failing: <ids, or none>; command: <command>`, or `MEASUREMENT INVALID: <cause>`; `  sweep: SWEEP DEFERRED (caller-owned)` until phase 6 | 6 | super-auto (SKILL.md §Phase 6 — report steps 1 and 2) |
| `codeBuckets.slowness` | `  slowness: <items>`, appended across invocations | 6 | super-auto |
| `sweepFix` | `sweepFix: <N> failing → <fix bead ids> · re-run <result> @ <sha>`, `<result>` in the `codeBuckets.sweep` form | 6 | super-auto |
| `approvals` | `approvals:` then one `- <record>` line per decision below | 7 | super-design; super-auto (`design-review`) |
| `approvals · top-split` | `- top-split · human \| auto · <child id> LEAF \| PROMOTE, …` | 7 | super-design |
| `approvals · design-review` | `- design-review · pending \| approved` | 7 | super-auto |
| `approvals · coverage-round-<N>` | `- coverage-round-<N> · <each finding's disposition, marked auto \| human>`; round 1 also carries the canonical R-list and the `requirements: N · mapped: M · unmapped: K (…)` line | 7 | super-design |
| `stepBack-round-<N>` | the line format `super-design/step-back-prompt.md` defines | 7 | super-auto (code roast); super-design (design roast) |
| `scopeFilter-round-<N>` | `scopeFilter-round-<N>: [SEV] <location> in-scope \| punch-list — <reason>`, one line per finding | 7 | super-auto |
| `scope-filter` | `scope-filter: <in-scope> in-scope · <punch> punch-listed`, ending each round's block | 7 | super-auto |
| `regressionPass-round-<N>` | `regressionPass-round-<N>: <K> filed · <keys> · no re-roast` | 7 | super-auto |

## Required contents

`run.md` holds the fields in §Field table as they become known. At creation, before phase 1, it holds `flags`, `phase`, `idea`, `branch` and `base` (the caller created the workspace in pre-flight); each other field is added when the phase that produces it returns. Omitted is not the same as empty: a resume reading no `epic:` line knows phase 1 never got that far, while an `epic:` with a blank value is a malformed file. Every field is read back on resume and trusted, so dropping one lets a resume redo work or reverse a decision already made.

1. **Flags** — `planOneShot`, `skipPlanRoast`, `skipCodeRoast`, `autonomous`, asked once per SKILL.md §Inputs and recorded so a resume never re-asks: re-asking would let a resume flip a decision the run is partway through acting on.

   A resume message that changes a flag or amends the goal is recorded, not dropped: one `resumeChange` line per change below `flags:`, with `flags:` updated for a flag change and `idea:` never rewritten (resume.md §Resume messages that change something).

2. **Current phase** — one of the tokens in §Field table, matching SKILL.md §Phase sequence plus `done` and the design-roast stop state `capped-blocking`. `capped-blocking` means the design roast's extension round still ended Blocking and a run without `autonomous` stopped before code (SKILL.md §Roast caps; an autonomous run records `roastDesignCapped` and never enters this phase). It is terminal for the run like a stall, and a later human-relaunched run that chooses to execute the tree anyway first appends an acknowledgment line (`capped-blocking acknowledged: <human's reason>`) to its own ledger before entering phase 3. A phase that does not run, skipped by flag or with no work to do (`fix-loop` after a clean roast), is still written with `(skipped)` appended and then advanced past, because a bare jump reads as skipped-versus-never-reached. `finish` means phase 7 started but is not confirmed complete, so a resume reading it verifies the merge instead of treating the run as over. `done` means the human answered the menu, whichever option they chose; "keep the branch as-is" ends the run as surely as a merge.

   A stall at phases 1–5 writes `report.md` (status line per report-prompt.md §The status block) but leaves `phase` where it was. A stall at phase 6 leaves `phase: report` with a `stalled` status line, which is why the phase-7 gate also checks the status line (SKILL.md §Invariants I2 (phase-7 gate)).

3. **Pointers** — the raw idea text, spec path, epic id, integration branch, the base branch the run merges back into (the repo branch this run's worktree was cut from, usually `main`), and the roast report paths. `branch` is this run's own branch, which is also the integration branch `super-code` merges into. There is no plan pointer: a tracker is required (SKILL.md §Pre-flight), so the epic and its beads are the plan, and a `plan:` line would send a resume looking for a file that does not exist. `base` is written in pre-flight, when this run's worktree is created, so phase 7 can supply it instead of asking; a resumed run has no other way to know it. Pointers only, never inline content: `run.md` says where the spec and reports live and does not restate them. The exception is `idea`, which carries the raw idea verbatim because resume.md §Finding a run matches on it, and a run that dies during phase 1 has no spec yet. `skillSource` appears only after a mid-run definitions switch, and a resume reads skills from it; `migrated` lines beside it map fields the new contract dropped (resume.md §Switching definitions mid-run).

   Path-valued pointers are relative to the run directory (`docs/superpowers/runs/YYYY-MM-DD-<slug>/`), never bare filenames or full repo-relative paths: one convention, so two writers produce compatible files.

   Record the filename the producing skill actually wrote: `brainstorming` writes `YYYY-MM-DD-<topic>-design.md` and `super-roast` writes `YYYY-MM-DD-<topic>-roast-<mode>-N.md`, wherever the directory is redirected. An invented name is a dangling pointer, and the report sections sourced through it come back empty.

   `feedback` is written via `superpowers:upstream-feedback` when phase 6's analysis files an issue; absent is the normal outcome when nothing was filed, not a sign of an interrupted run.

4. **Parked items** — each with its source report:
   - escalations: a roast finding that reached no verdict at all;
   - beyond-cap: a severe finding the panel cap left unjudged, or one under the report's `## Not verified (dedupe failed or judge lost)` heading;
   - degraded-verdict: a sibling's own mandated pause that autonomous mode answered on the human's behalf instead of asking, such as a declined re-roast-at-raised-`config.panelCap` offer, or a `clean [low coverage]` / `clean [panel-capped: N unverified]` verdict autonomous mode proceeded past. Recorded with which branch was taken, e.g. `"clean [low coverage] — proceeded"`. A goal- or scope-changing redesign the phase-5 step-back proposed and autonomous mode did not apply is this kind too: `"redesign proposed, not applied — <one line>"`;
   - graph-change: an edge change or proposal from super-design's parallelism pass that was not applied (outside the safe class), as super-design recorded it beside its `graph-pass:` line.

   Parking is mode-independent: a `beyond-cap` or `degraded-verdict` item is recorded the same way whether autonomous mode or a human answered, noting who chose, because the question was raised and an unverified Blocking candidate survived it either way. These items carry open concerns and self-made calls a resumed session never saw raised.

5. **Roast iteration counts** — `roastDesignRound` and `roastCodeRound`, each written every round by the skill running that round (`roastDesignRound` by `super-design`, whose loop runs inside its own invocation; `roastCodeRound` by `super-auto`), so a restart never resets a cap. The code roast fix loop is capped at 3 rounds. The design roast is capped at 3 rounds plus exactly one extension round when round 3 still ends Blocking.

   `roastDesignCapped` is written by `super-design` when the extension round still ends Blocking; `stopped` is a run without `autonomous` (phase `capped-blocking`), `proceeded` an autonomous run that parked each finding and went on to phase 3.

   `roastCodeCapped` is written by `super-auto` the moment the code-roast loop exits with Blocking findings still confirmed, at the cap or at thrash (SKILL.md §Cap disposition), before they are parked; absent when the loop converged or ended with no Blocking open. A resume reading `phase: roast-code` with it present must not start another round, because the loop has ended; without it the loop is mid-way. A later whole-branch roast is invoked with iteration `post-cap audit` and its report path is appended here, never counted as a round.

6. **Code buckets** — `completed`, `escalated`, `pendingRetry`, `parked`, `stalled`, `review`, `sweep`, `slowness` (appended across invocations, not overwritten), recorded verbatim at every phase 3→4 transition and overwritten on each fix-loop re-entry, because the latest `super-code` return is the current truth. The exception is `sweep`, which phase 6 rewrites after each sweep it runs (SKILL.md §Phase 6 — report). `super-code` returns them once and does not persist them, and report-prompt.md §Sections and their sources reads them.

   Refresh them from the tracker as phase 3 proceeds, so a session that ends inside phase 3 resumes with the last completed round: closed task beads under the epic are `completed`, quarantined ones `escalated`. A `review: <id>` bead (label `sp:review`) is `super-code`'s bookkeeping, never a task, and a task whose review bead is still open is in flight. When `super-code` returns, overwrite the buckets with its returned fields verbatim.

   `review` records what the final whole-epic review found: `CLEAN`, or the verdict and its finding count. That review is mandatory even when `skipCodeRoast` is set, and its findings are fixed as beads under the epic per SKILL.md §Fix-bead template, so the fix campaign stays visible to the tree and the report.

   `sweep` is the run's one full-suite result in the §Field table form, stamped with the SHA it measured; it reads `SWEEP DEFERRED (caller-owned)` until phase 6. `scripts/report-status` counts it as a pass only in that form with zero failed and zero errors, stamped at the report's tip as report-prompt.md §The status block defines it; any other value becomes a qualifier.

   `sweepFix` is written when a failing phase-6 sweep gets its one fix pass, e.g. `sweepFix: 3 failing → bd-431, bd-432 · re-run 7c01d9e — 415 passed, 0 failed, 0 errors, 2 skipped; failing: none; command: npm test @ 7c01d9e`. The re-run result also replaces `sweep`. Present means the pass was spent: a resume re-runs the sweep if the re-run result is missing and never files a second pass.

7. **Design decisions** — each made once, by the human or by the run per `super-design` §Gates by Mode; a resume replays a recorded decision instead of re-making it.

   An approval is bound to what it approved, and a record that cannot be checked is not an approval. Record enough to tell whether the thing changed:

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
     as how many of the loop's rounds are already spent. Findings a later
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

     A finding pulled in by its cluster (SKILL.md §Step 2 — scope filter) records
     `in-scope — cluster <id>`; a member kept out by the filter's `clusterOverride` records
     `punch-list — cluster override: <reason>`.

     The block ends with one aggregate line, `scope-filter: <in-scope> in-scope · <punch>
     punch-listed`, written by `super-auto` in the same phase-5 step — not by the scope-filter
     pass itself. A resume matches each round's findings against this record exactly on the
     `[SEV] <location>` key and replays the disposition rather than re-dispatching the filter.
   - `regressionPass-round-<N>` — the one regression-only fix pass a `[converged]` round with
     `[fix-regression]` findings gets (SKILL.md §Regression-only pass): the count filed, each finding's
     `[SEV] <location>` key verbatim, and `no re-roast`:

     ```
     regressionPass-round-2: 2 filed · [Should-fix] src/client/seat.ts:41, [Should-fix] src/rejections.ts:88 · no re-roast
     ```

     Written when the beads are filed. A resume that finds it does not file again; the beads'
     own state says whether the `super-code` re-entry finished.

   Anything not recorded was never approved. Never widen a replay into a blanket
   "the human approved this run", because that turns one approval into consent for work
   they never saw, which is the failure mode this record exists to prevent, arrived
   at from the other direction.

## File format — worked example

An illustrative `run.md` mid-run: the design phase went through two roast
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
  sweep: SWEEP DEFERRED (caller-owned)
  slowness:
```

## The resume rule

Resume from the recorded `phase`; never re-ask the flags and never reset a counter (SKILL.md §Resume).
