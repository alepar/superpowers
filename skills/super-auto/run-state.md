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
| `roast-design` | `roast-design: <report path>, <report path>, …` | 3 | super-design; super-auto (appends each phase-5 amend design roast report, SKILL.md §Redesign cycle step 3) |
| `roast-code` | `roast-code: <report path>, <report path>, …` | 3 | super-auto |
| `findingsLedger` | `findingsLedger: <path>`, the code loop's findings ledger | 3 | super-auto, when the loop first builds its ledger |
| `findingsLedgerDesign` | `findingsLedgerDesign: <path>`, the design loop's findings ledger | 3 | super-design, when the loop first builds its ledger; super-auto, when a phase-5 amend design roast builds it first (SKILL.md §Redesign cycle step 3) |
| `skillSource` | `skillSource: <abs skills path> @ <sha>[+dirty:<hash>] (<version>)`, only after a mid-run definitions switch or a pre-flight that proceeded on the updated cache | 3 | super-auto |
| `codeMechanism` | `codeMechanism: Workflow \| ordinary-subagents`, chosen from the calling session's loaded tools, updated before a code re-entry when capability changes | 3 | super-auto |
| `runTag` | `runTag: <slug>-<UTC yyyymmddThhmmss>`, minted once; passed to every super-code invocation as `args.runTag` | 3 | super-auto, at pre-flight |
| `context` | `context: <the context-preflight line, verbatim>` | 3 | super-auto, at pre-flight |
| `migrated` | `migrated: <recorded field or ledger line> → <what it maps to now, or dropped>`, beside `skillSource` | 3 | super-auto |
| `feedback` | `feedback: <issue-url>`, optional: present only when upstream-feedback filed an issue | 3 | super-auto, from `superpowers:upstream-feedback` |
| `friction` | `friction: <N> events \| none recorded` | 3 | super-auto (SKILL.md §Phase 6 — report step 4) |
| `parked` | `parked:` then one `- <source report> · <kind> · "<text>"` line per item, a `degraded-verdict` line optionally ending ` · resolves-on: sweep`; kind one of `escalation \| beyond-cap \| degraded-verdict \| graph-change` (source `graph-pass` for a graph change) | 4 | super-design (phases 1–2); super-auto (phase 3 on) |
| `graph-pass` | owned by `super-design` §Parallelism Pass (root only) | 4 | super-design |
| `roastDesignRound` | `roastDesignRound: <N>` | 5 | super-design, every round; super-auto, for each phase-5 amend design roast (SKILL.md §Redesign cycle step 3) |
| `roastCodeRound` | `roastCodeRound: <N>` | 5 | super-auto, every round |
| `roastDesignCapped` | `roastDesignCapped: <unresolved finding ids> · <extension report path> · stopped \| proceeded` | 5 | super-design |
| `redesignCycles-code` | `redesignCycles-code: <K>`, single-valued | 5 | super-auto, when Step 1 starts a cycle |
| `redesignCycles-design` | `redesignCycles-design: <K>`, single-valued | 5 | super-design, when Step 1 starts a cycle |
| `roastCodeCapped` | `roastCodeCapped: <unresolved finding ids> · <final round's report path> · <authority the next step needs>`, with any `post-cap audit` report path appended | 5 | super-auto (SKILL.md §Cap disposition) |
| `roastCodeExit` | `roastCodeExit: converged \| thrash \| capped \| operator-skipped (<reason>)` | 5 | super-auto (SKILL.md §Loop exits) |
| `codeBuckets` | `codeBuckets:` then one indented line per bucket below | 6 | super-auto |
| `codeBuckets.completed` | `  completed: <bead ids>` | 6 | super-auto |
| `codeBuckets.escalated` | `  escalated: <bead ids>` | 6 | super-auto |
| `codeBuckets.pendingRetry` | `  pendingRetry: <bead ids>` | 6 | super-auto |
| `codeBuckets.parked` | `  parked: <bead ids>` | 6 | super-auto |
| `codeBuckets.stalled` | `  stalled: true \| false` | 6 | super-auto |
| `codeBuckets.review` | `  review: ready \| not ready (<summary>)`, or `  review: ready (after the phase-6 sweep @ <sha>)` when the review's only blocker was the unmeasured branch; `  review: CLEAN` and `  review: <verdict> (<N> confirmed)` are older forms, read as `ready` and `not ready` | 6 | super-auto |
| `codeBuckets.sweep` | `  sweep: <one-line result> @ <sha>`, the result in `super-code`'s sweep form, `<sha7> — <P> passed, <F> failed, <E> errors, <S> skipped; failing: <ids, or none>; command: <command>`, or `MEASUREMENT INVALID: <cause>`; `  sweep: SWEEP DEFERRED (caller-owned)` until phase 6 | 6 | super-auto (SKILL.md §Phase 6 — report steps 1 and 2) |
| `codeBuckets.slowness` | `  slowness: <items>`, appended across invocations | 6 | super-auto |
| `codeBuckets.worktreesKept` | `  worktreesKept: <worktree-or-temp-root — reason>, …` (empty after verified resource cleanup; unavailable cleanup names unchecked roots) | 6 | super-auto |
| `codeBuckets.processSweep` | `  processSweep: stopped <N> · survived <M> · unknown <U> · kept <K>[ — survived: <fact>; unknown: <root-or-pid — failed inspection>; kept: <pid command — reason>; …]` (preserve stopped/survived/unknown/kept facts; unavailable sweep or missing output is unknown) | 6 | super-auto |
| `sweepFix` | `sweepFix: <N> failing → <fix bead ids> · re-run <result> @ <sha>`, then ` · regression <K> failing → <fix bead id> · re-run <result> @ <sha>` when the regression-only bead ran; `<result>` in the `codeBuckets.sweep` form | 6 | super-auto |
| `approvals` | `approvals:` then one `- <record>` line per decision below | 7 | super-design; super-auto (`design-review`) |
| `approvals · top-split` | `- top-split · human \| auto · <child id> LEAF \| PROMOTE, …` | 7 | super-design |
| `approvals · design-review` | `- design-review · pending \| approved` | 7 | super-auto |
| `approvals · review-collection` | `- review-collection · <JSON invocation/workspace/review/required/settlement/archive facts>` | 7 | super-auto, before launch and after settled collection |
| `approvals · root-acceptance` | `- root-acceptance · <JSON requirements/evidence/recovery/checkEvidence/runFailures/decisions>` | 7 | super-auto, before code and after settlement or acceptance evidence changes |
| `approvals · source-correspondence` | `- source-correspondence · <supported hash-bound correspondence JSON>` | 7 | super-auto, at settled handoff/resume when direct artifact matching is insufficient |
| `approvals · finding-source` | `- finding-source · <complete extraction JSON>` | 7 | super-auto, on source collection |
| `approvals · finding-link` | `- finding-link · <JSON refs and basis>` | 7 | super-auto, after judging an explicit match |
| `approvals · finding-route` | `- finding-route · <JSON ref and owner/fix/deferred>` | 7 | super-auto, when routing a finding |
| `approvals · finding-disposition` | `- finding-disposition · <JSON ref and supported disposition/basis>` | 7 | super-auto, after judging verification or rejection support |
| `approvals · coverage-round-<N>` | `- coverage-round-<N> · <each finding's disposition, marked auto \| human>`; round 1 also carries the canonical R-list and the `requirements: N · mapped: M · unmapped: K (…)` line | 7 | super-design |
| `approvals · coverage-amend-<loop>-<K>` | `- coverage-amend-<loop>-<K> · <each finding's disposition, marked auto \| human>`, the `coverage-round-<N>` line format | 7 | super-design (Amend Mode's coverage step) |
| `redesign-<loop>-<K>` | `redesign-<code\|design>-<K>: round <N> · triggers <list> · amended <§s\|none> · lastGood <sha\|-> · designRoast <r<M>\|r<M> fixed\|skipped — design cap spent\|none\|-> · state <started\|amend-checked\|specs-committed\|beads-filed\|applied\|aborted — <reason>\|thrash — lastGood breach>`, one line per K, rewritten in place | 7 | the calling loop's orchestrator (super-auto code loop; super-design design loop), at each transition |
| `baseAbsorbed` | `baseAbsorbed: <base sha> → <merge sha>, <N> conflicted files`, one line per absorption | 7 | super-auto |
| `stepBackCode-round-<N>` | the line format `super-design/step-back-prompt.md` defines, its decision `local \| redesign` (`patch` is accepted on read as `local`), including the `local — gate not computable: <reason>`, `redesign — forced: step-back record rejected: <reject lines>` and `local — redesign declined by human` forms | 7 | super-auto |
| `stepBackDesign-round-<N>` | the line format `super-design/step-back-prompt.md` defines, its decision `local \| redesign` (`patch` is accepted on read as `local`), including the forms listed for `stepBackCode-round-<N>` | 7 | super-design |
| `scopeFilter-round-<N>` | `scopeFilter-round-<N>: [SEV] <location> in-scope \| punch-list — <reason>`, one line per finding, then any `cluster dropped: <cluster id> — <rule>` lines verbatim from `scripts/scope-dispositions` | 7 | super-auto |
| `scope-filter` | `scope-filter: <in-scope> in-scope · <punch> punch-listed`, ending each round's block | 7 | super-auto |
| `regressionPass-round-<N>` | `regressionPass-round-<N>: <K> filed · <keys> · no re-roast` | 7 | super-auto |

## Required contents

`run.md` holds the fields in §Field table as they become known. At creation, before phase 1, it holds `flags`, `phase`, `codeMechanism`, `runTag`, `context`, `idea`, `branch` and `base` (the caller created the workspace in pre-flight); each other field is added when the phase that produces it returns. Omitted is not the same as empty: a resume reading no `epic:` line knows phase 1 never got that far, while an `epic:` with a blank value is a malformed file. Every field is read back on resume and trusted, so dropping one lets a resume redo work or reverse a decision already made.

1. **Flags** — `planOneShot`, `skipPlanRoast`, `skipCodeRoast`, `autonomous`, asked once per SKILL.md §Inputs and recorded so a resume never re-asks: re-asking would let a resume flip a decision the run is partway through acting on.

   A resume message that changes a flag or amends the goal is recorded, not dropped: one `resumeChange` line per change below `flags:`, with `flags:` updated for a flag change and `idea:` never rewritten (resume.md §Resume messages that change something).

2. **Current phase** — one of the tokens in §Field table, matching SKILL.md §Phase sequence plus `done` and the design-roast stop state `capped-blocking`. `capped-blocking` means the design roast's extension round still ended Blocking and a run without `autonomous` stopped before code (SKILL.md §Roast caps; an autonomous run records `roastDesignCapped` and never enters this phase). It is terminal for the run like a stall, and a later human-relaunched run that chooses to execute the tree anyway first appends an acknowledgment line (`capped-blocking acknowledged: <human's reason>`) to its own ledger before entering phase 3. A phase that does not run, skipped by flag or with no work to do (`fix-loop` after a clean roast), is still written with `(skipped)` appended and then advanced past, because a bare jump reads as skipped-versus-never-reached. `finish` means phase 7 started but is not confirmed complete, so a resume reading it verifies the merge instead of treating the run as over. `done` means the human answered the menu, whichever option they chose; "keep the branch as-is" ends the run as surely as a merge.

   A stall at phases 1–5 writes `report.md` (status line per report-prompt.md §The status block) but leaves `phase` where it was. A stall at phase 6 leaves `phase: report` with a `stalled` status line, which is why the phase-7 gate also checks the status line (SKILL.md §Invariants I2 (phase-7 gate)).

3. **Pointers** — the raw idea text, spec path, epic id, integration branch, the base branch the run merges back into (the repo branch this run's worktree was cut from, usually `main`), and the roast report paths. `branch` is this run's own branch, which is also the integration branch `super-code` merges into. There is no plan pointer: a tracker is required (SKILL.md §Pre-flight), so the epic and its beads are the plan, and a `plan:` line would send a resume looking for a file that does not exist. `base` is written in pre-flight, when this run's worktree is created, so phase 7 can supply it instead of asking; a resumed run has no other way to know it. `findingsLedger` and `findingsLedgerDesign` point to the loops' findings ledgers (built by `super-design/scripts/findings-ledger`), each written when its loop first builds one. `roast-design:` lists every design roast report in round order: phase 2's rounds, then each phase-5 amend design roast report, which `super-auto` appends when that round's report is written (SKILL.md §Redesign cycle step 3), so the list always matches `roastDesignRound`. Pointers only, never inline content: `run.md` says where the spec and reports live and does not restate them. Finding-source records retain complete extraction JSON under approvals so unavailable artifacts cannot erase known occurrences. The other exception is `idea`, which carries the raw idea verbatim because resume.md §Finding a run matches on it, and a run that dies during phase 1 has no spec yet. `runTag` groups this run and its run marker; each super-code invocation separately persists `invocationId` in its Launch before producing its immutable final-review bundle; `context` records each role's context window at pre-flight. `skillSource` appears only after a mid-run definitions switch or a pre-flight that proceeded on the updated cache instead of restarting (SKILL.md §Pre-flight), and a resume reads skills from it; `migrated` lines beside it map fields the new contract dropped (resume.md §Switching definitions mid-run).

   Path-valued pointers are relative to the run directory (`docs/superpowers/runs/YYYY-MM-DD-<slug>/`), never bare filenames or full repo-relative paths: one convention, so two writers produce compatible files.

   Record the filename the producing skill actually wrote: `brainstorming` writes `YYYY-MM-DD-<topic>-design.md` and `super-roast` writes `YYYY-MM-DD-<topic>-roast-<mode>-N.md`, wherever the directory is redirected. An invented name is a dangling pointer, and the report sections sourced through it come back empty.

   `feedback` is written via `superpowers:upstream-feedback` when phase 6's analysis files an issue; absent is the normal outcome when nothing was filed, not a sign of an interrupted run.

   `friction` is written at phase 6, before the report: the count of event lines in `<run-dir>/friction.md`, or `none recorded` when the file holds only its header. Pre-flight creates that file with its header, so a missing file means the log was never kept, which upstream-feedback reports as `not recorded`.

4. **Parked items** — each with its source report:
   - escalations: a roast finding that reached no verdict at all;
   - beyond-cap: a severe finding the panel cap left unjudged, or one under the report's `## Not verified (dedupe failed or judge lost)` heading;
   - degraded-verdict: a sibling's own mandated pause that autonomous mode answered on the human's behalf instead of asking, such as a declined re-roast-at-raised-`config.panelCap` offer, or a `clean [low coverage]` / `clean [panel-capped: N unverified]` verdict autonomous mode proceeded past. Recorded with which branch was taken, e.g. `"clean [low coverage] — proceeded"`. A goal- or scope-changing redesign the phase-5 step-back proposed and autonomous mode did not apply is this kind too: `"redesign proposed, not applied — <one line>"`. The redesign cycle adds the park texts below, each recorded as a `degraded-verdict`: `"redesign budget spent"`, `"redesign gate not computable — <reason>"`, `"redesign declined by human — <triggers>"`, `"redesign aborted — <reason>"`, `"redesign incomplete — <step>: <cause>"` and `"amend roast finding not fixed — <key>"`;
   - graph-change: an edge change or proposal from super-design's parallelism pass that was not applied (outside the safe class), as super-design recorded it beside its `graph-pass:` line.

   Run attribution uses these existing records, without a new top-level field: retain an open
   `run-regression` or `attribution gap` as `degraded-verdict` with the super-code ledger's Recovery
   id, introducing owner (when known), exact command/configuration and source-output pointers.
   A task-base exoneration is a separate fact and does not clear the run owner. Preserve these
   entries across code bucket replacement and later clean invocations; update the same source
   entry rather than duplicating it. Only linked live/pass fix verification retires the open
   qualifier, retaining its durable history and verification pointer in Recovery. These entries
   never use `resolves-on: sweep`. A recorded pre-run failure stays distinct and does not by
   itself assign this run repair work. Missing baseline evidence remains an attribution gap.

   A `degraded-verdict` line may end ` · resolves-on: sweep`: the qualifier stands only until the phase-6 sweep passes, and `scripts/report-status` skips it once `codeBuckets.sweep` is a pass stamped at the tip. Phase 6 adds the key when it parks a final review that read `not ready` only because the deferred sweep left the branch unmeasured (SKILL.md §Phase 6 — report step 4).

   Parking is mode-independent: a `beyond-cap` or `degraded-verdict` item is recorded the same way whether autonomous mode or a human answered, noting who chose, because the question was raised and an unverified Blocking candidate survived it either way. These items carry open concerns and self-made calls a resumed session never saw raised.

5. **Roast iteration counts** — `roastDesignRound` and `roastCodeRound`, each written every round by the skill running that round (`roastDesignRound` by `super-design`, whose loop runs inside its own invocation, and by `super-auto` for a phase-5 amend design roast, SKILL.md §Redesign cycle step 3, which increments it and so spends the design loop's cap; `roastCodeRound` by `super-auto`), so a restart never resets a cap. Each loop owns its cap and thrash rules in its exits: SKILL.md §Loop exits for the code loop, and for the design loop `super-design` §Adversarial Review Loop (root only). This file does not restate them.

   `redesignCycles-code` and `redesignCycles-design` count the redesign cycles each loop has started. Each is single-valued, written by the loop that owns it the moment its Step 1 starts a cycle, and never reset: a restart, a resume and a later cycle only raise it. They are what the loops' caps are computed from, so a lost or reset counter would hand a run back budget it already spent.

   `roastDesignCapped` is written by `super-design` when the extension round still ends Blocking; `stopped` is a run without `autonomous` (phase `capped-blocking`), `proceeded` an autonomous run that parked each finding and went on to phase 3.

   `roastCodeCapped` is written by `super-auto` the moment the code-roast loop exits with Blocking findings still confirmed, at the cap or at thrash (SKILL.md §Cap disposition), before they are parked; absent when the loop converged or ended with no Blocking open. A resume reading `phase: roast-code` with it present must not start another round, because the loop has ended; without it the loop is mid-way. A later whole-branch roast is invoked with iteration `post-cap audit` and its report path is appended here, never counted as a round.

   `roastCodeExit` is written by `super-auto` the moment the phase-5 loop ends (SKILL.md §Loop exits): `converged`, `thrash`, `capped`, or `operator-skipped (<reason>)` when the operator ended it early. Any value means the loop has ended, and a resume starts no further round (resume.md §Resuming at a phase). Absent when the loop never ran (`skipCodeRoast`) or has not ended.

6. **Code buckets** — `completed`, `escalated`, `pendingRetry`, `parked`, `stalled`, `review`, `sweep`, `slowness` (appended across invocations, not overwritten), `worktreesKept`, `processSweep`, recorded verbatim at every phase 3→4 transition and overwritten on each fix-loop re-entry, because the latest `super-code` return is the current truth. The exception is `sweep`, which phase 6 rewrites after each sweep it runs (SKILL.md §Phase 6 — report). `super-code` returns them once and does not persist them, and report-prompt.md §Sections and their sources reads them. `completed` describes delivered code; `worktreesKept` and `processSweep` independently describe cleanup. Preserve unknown inspection, known survivors and deliberate retention with their resource paths even when code landed. Older processSweep lines without unknown/kept counts leave those outcomes unrecorded, rather than verified empty.

   Refresh them from the tracker as phase 3 proceeds, so a session that ends inside phase 3 resumes with the last completed round: closed task beads under the epic are `completed`, quarantined ones `escalated`. A `review: <id>` bead (label `sp:review`) is `super-code`'s bookkeeping, never a task, and a task whose review bead is still open is in flight. When `super-code` returns, overwrite the buckets with its returned fields verbatim.

   `review` records the verdict of `super-code`'s final whole-epic review: `ready` or `not ready (<summary>)`. A `run.md` written before this form has `CLEAN` or `<verdict> (<N> confirmed)`; read them as `ready` and `not ready`. Under `deferSweep` each invocation's review is informational; the report describes the latest verdict after the phase-6 sweep, while its outstanding items come from the accumulated projection per SKILL.md §Final-review items. That review is mandatory even when `skipCodeRoast` is set.

   `sweep` is the run's one full-suite result in the §Field table form, stamped with the SHA it measured; it reads `SWEEP DEFERRED (caller-owned)` until phase 6. `scripts/report-status` counts it as a pass only in that form with zero failed and zero errors, stamped at the report's tip as report-prompt.md §The status block defines it; any other value becomes a qualifier.

   `sweepFix` is written when a failing phase-6 sweep gets its one fix pass, e.g. `sweepFix: 3 failing → bd-431, bd-432 · re-run 7c01d9e — 415 passed, 0 failed, 0 errors, 2 skipped; failing: none; command: npm test @ 7c01d9e`. The re-run result also replaces `sweep`. Present means the pass was spent: a resume re-runs the sweep if the re-run result is missing and never files a second pass. A ` · regression …` segment records the one regression-only bead for tests the pass turned red (SKILL.md §Phase 6 — report step 2); present, it too is spent.

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
   - `stepBackCode-round-<N>` — the phase-5 step-back decision for that code-roast round, one
     line in the format `super-design/step-back-prompt.md` defines, written before the scope
     filter runs. The full output sits beside that round's report as
     `…-roast-pr-<N>-step-back.md`, and every fix bead of the round links it:

     ```
     stepBackCode-round-2: redesign — applied: token refresh in each handler → one refresh middleware (dissolves 3)
     ```

     The design roast's step-back records are `stepBackDesign-round-<N>`, written by `super-design`;
     the two loops count rounds separately, so one shared key would collide. A `run.md` written
     before this split has `stepBack-round-<N>` for both: a resume reads the code round's decision
     from its `…-roast-pr-<N>-step-back.md` file instead.

     A resume replays it: a recorded step-back is not re-dispatched. A redesign it chose runs as a redesign cycle, replayed from its `redesign-<loop>-<K>` record, not from this line.
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

     A cluster whose members were all punch-listed adds a `cluster dropped: <cluster id> — <rule>` line, copied from `scripts/scope-dispositions` before the aggregate line; the report surfaces its rule in Remaining. A finding pulled in by its cluster (SKILL.md §Step 2 — scope filter) records
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

   - `coverage-amend-<loop>-<K>` — the disposition applied to each finding in the one coverage round Amend Mode runs after redesign cycle K, in the `coverage-round-<N>` line format. Present means the round is spent: a resume never re-runs it.
   - `redesign-<loop>-<K>` — the redesign cycle's record, a top-level line (not an approval) beside the counters, one per cycle K of the loop (`code` or `design`):

     ```
     redesign-code-1: round 3 · triggers no-progress · amended 2026-07-31-per-tenant-rate-limiter-design.md §Retry policy · lastGood 3f9c2e1 · designRoast r3 fixed · state applied
     ```

     `round` is the roast round whose Step 1 started the cycle, `triggers` the ledger's list, `amended` the spec sections the amendment changed (`none` until known), and `lastGood` the HEAD SHA recorded when the cycle started, after any uncommitted spec changes are committed (the pre-amendment state, in both loops; never `-`, since the `amend-checked` replay diffs against it). `designRoast` is `-` until the code loop reaches its amend roast, then `r<M>` (written with the `roastDesignRound` increment, before the roast runs), then `r<M> fixed` once its fixes are committed; `skipped — design cap spent` when that cap leaves no round, `none` when the amendment amended nothing. `state` is `started`, `amend-checked`, `specs-committed`, `beads-filed`, `applied`, `aborted — <reason>` or `thrash — lastGood breach`.

     The record is the cycle's single state field: one line per K, rewritten in place by the calling loop's orchestrator at each transition (it runs Amend Mode inline, so it also writes the states inside it), never appended. Resume dispatches an interrupted cycle only from `state` (resume.md §Redesign cycle replay).

   Anything not recorded was never approved. Never widen a replay into a blanket
   "the human approved this run", because that turns one approval into consent for work
   they never saw, which is the failure mode this record exists to prevent, arrived
   at from the other direction.

## Review collection records

Use existing `approvals:` records, with one JSON object per line after `- review-collection · `.
Before launch commit `{"invocationId":"inv-a","workspace":"<absolute workspace>","reviewPath":"<absolute workspace>/final-review-inv-a.md","review":"pending","required":[],"settled":false}`. Pass that ID to either coordinator mechanism; runTag remains the enclosing run identity. The caller adds relative `required` files when a known direct input is required beyond discovered `.diff`/assembled/split inputs. These are collection facts, not new producer result fields.

After confirmed settlement, `report-status --collect RUN_MD --invocation ID --workspace WORKSPACE --review PATH_OR_none --verdict REVIEW [--required RELATIVE_FILE]...` appends the settled intent before copying. Preserve the exact original required-input list. `reviewPath:null` records a null result: only `review:"no work landed"` permits collection without a review. Any other null/missing review leaves an evidence gap, owned by the orchestrator; no clean review/source is invented. Unexpected recoverable bundle artifacts with a null result are still extracted and archived, with a gap requiring reconciliation.

The helper appends complete extraction JSON under `finding-source`, preserving immutable `ID/final` and `ID/cluster-N` identities and every section/position/key/text, with an archive pointer under `reviews/ID/`. It copies final/cluster review files, the direct `.diff` when present, and the complete assembled input directory, checking declared files and split manifest slices. An interrupted copy is replayable before completion. Identical copies do not change; conflicting bytes remain untouched. Completion adds `complete:true`, `files:[{"path":"<bundle-relative path>","sha256":"<hash>"}]` and `gaps:[]`; missing/incomplete/conflicting artifacts add `complete:false` and nonempty `gaps`. Earlier records and supported finding dispositions remain append-only. The last collection record per invocation describes recovery progress; it never disposes a finding.

A caller-confirmed recovered null report uses the same settlement command with `--recover-null`.
It requires the exact original invocation/workspace/ordered required inputs, the expected
`final-review-ID.md`, and a regular strict-extractable report with the actual supplied verdict.
It appends `recovery:{"kind":"settled-null","recordSha256":"<hash>","review":"<old verdict>"}`;
the hash is SHA-256 of UTF-8 `JSON.stringify` of the immediately preceding valid settled-null
record in parsed property order. Every later snapshot retains that marker and recovered path/
verdict. Plain replay/file presence does not promote null; malformed/missing markers and arbitrary
source changes remain gaps. Preserve every original unavailable event. This recovery reconciles
preservation only: a new bounded review is a fresh invocation/artifact, not a fabricated original
whole-range result.

For a bounded captured-source report, write new `bounded-draft.md` and `bounded-coverage.json`
inside its existing `assembled/final-review-ID-final/` directory so normal bundle collection
preserves them without changing the launch required-input list. Retain the original failed
selection sidecar and provenance in place. The final report carries full base/head, hash-bound sidecar/draft/coverage references,
the complete changed-path inventory, actual inspected hunk headers, remaining paths/hunks and
all original gaps. `dispatch-text bounded-review` validates source and writes the expected final
report exclusively with forced `not ready` and whole-epic untested scope. Collection completion
means those bytes were preserved; whole-range acceptance remains pending.

`report-status --collect RUN_MD` replays all retained collections. It verifies complete archive hashes even after source cleanup. Exit 0 confirms preservation; exit 3 leaves pending/gaps and requires preserving the source workspace plus archive before later invocation or cleanup; exit 2/4 establishes no collection. Unsettled intents require ledger/result confirmation, not inference from artifact presence. A missing source extraction retains known inline occurrences and exposes unavailable coverage. Ordinary `report-status RUN_MD` is read-only: with new records it adds `outstanding findings: N`, `review collections pending: N`, `review collection gaps: N` and/or `finding evidence gaps: N` qualifiers as applicable, derived from this collection history and the shared outstanding projection. Unavailable tooling/projection is qualified explicitly. Without new records legacy status output is unchanged.

## Caller-owned root acceptance

Every super-auto launch and re-entry supplies `rootAcceptance: "caller"` independently of
`deferSweep`. All helper closures use `close-in-tree-epics EPIC --exclude-root`. Completed leaves,
Git landing, an empty ready set, and a ready review each establish their own facts; the root stays
open while caller acceptance is pending. Standalone super-code keeps its default root ownership.

The existing `approvals:` block carries `root-acceptance` JSON snapshots, version 1, owner
`super-auto`. Each has `sourceTree` (the full Git tree of the reviewed/measured code), `requirements`,
`evidence`, `reviews`, `decisions`, `recovery`, `checkEvidence`, and `runFailures`. Write the initial
snapshot before code, with pending requirements and empty evidence/decisions. After each settled
invocation, preserve its returned Recovery obligations/gaps, source-bound checkEvidence records,
requiredLiveChecks/gaps, and runFailures classification/state, using the exact prerequisite
contracts. Carry still-open facts forward on bucket replacement; reconcile them from their durable
ledger before removing them from a later snapshot. Earlier snapshots stay as evidence history.

Each requirement has `id`, `kind` (`review`, `measurement`, `human`), and `owner`. Include the final
whole-epic review, final full-suite measurement, existing phase-7 human choice, and every additional
acceptance criterion or reserved human gate the run actually requires. This record describes those
existing obligations; it introduces no additional approval ceremony. Measurement requirements add
`command`, `configuration`, `requiredLive` (boolean), and optionally `sourceTree` for a check tied
to a particular earlier tree. Without that override they measure the snapshot's final tree.
Optional `obligations: [<exact Recovery ids>]` binds deferred final-suite records to that final
measurement. Preserve a declared Recovery command; a different command cannot discharge it.
Other deferred measurements need their own command/configuration/source binding. Requirements
omitted in a later snapshot remain required; an amendment changes the existing requirement by ID
with its authority/evidence retained in approvals. Never erase a required check by omission.

`evidence` uses the existing sourceTree/command/configuration/outcome/location/kind records.
`reviews` entries are `{id, sourceTree, outcome, location}`: `pass` means the required review's
coverage and supported dispositions were verified, rather than copying a ready verdict over
unresolved findings. `decisions` entries are `{id, authority:"human", decision, evidence:[...]}`.
Only an actual human's `accept` decision satisfies a human requirement. `keep` and `cancel` preserve
those outcomes and leave acceptance open, even when the run phase is `done`. Never invent an agent
decision or infer acceptance from child closure. Retain every reserved human gate separately.

Optional `findingAcceptance` entries carry `{ref, judgment:"supported", effect, basis, evidence}`.
The existing caller assessment judges `effect:"required"` with the named `requirement` it blocks,
or `effect:"nonblocking"` with evidence supporting its exclusion from required acceptance. Judge
each outstanding projected finding/group once using an exact original source ref; explicit links
make duplicate occurrences one group, while all their original refs remain available. A deferred
or explicitly non-actionable source item is not automatically a required code defect. Missing or
unsupported relevance is an acceptance gap. This judgment changes only its acceptance effect:
nonblocking findings remain outstanding in the shared projection and punch list. It never invents
a resolution or demands new human approval for every minor; human authority is required only for
the human decisions already reserved by the task/spec and phase-7 menu.

`report-status --acceptance RUN_MD --tree FULL_GIT_TREE` is a read-only root-close gate: exit 0 and
`eligible:true` establish that recorded obligations are satisfied; exit 3 returns `pending`/`gaps`;
2/4 establish no acceptance. Resolve the reviewed/measured source identity and confirm it still
matches the final code (run-directory-only commits may be excluded per
report-prompt.md §The status block) before passing that tree. Ordinary status also qualifies pending root acceptance when the
record is present, using its recorded tree. Legacy status without the record is unchanged.

The gate independently checks required reviews, matching measurements (live when required),
Recovery holds/pending closures/deferred obligations, source-bound required live checks, run-owned
failures, collection integrity and supported requirement relevance in the shared outstanding finding projection. A passing measurement
discharges only its matching obligation. Failed and unavailable outcomes stay distinct; simulated
or fallback evidence cannot satisfy live requirements. A contradictory pass/fail at the same tree
requires reconciliation. An open run-introduced failure retains its owner; a missing attribution
remains a gap. Evidenced pre-run failures are diagnostic unless a requirement separately calls for
repair. A valid empty finding projection can pass; an empty key stream or missing extraction cannot.

Only after the existing final choice and all required gates are supported, rerun this gate against
the final code identity and explicitly close the root on exit 0. A passing gate never closes a bead
or supplies a human decision. A report/hand-back may still describe delivered leaves with pending
acceptance; keep the root open and name each owner and evidence gap.

## Finding continuity records and projection

Append the finding records below to the existing `approvals:` block. Preserve earlier records
across code bucket replacement; the latest review verdict describes its own invocation, while
this projection accounts for outstanding findings from every retained source. These additive
facts are independent: ownership, fix-task reference and deferral can coexist with verification.
They impose no state sequence and do not replace the externally owned roast ledger.

**Source.** Use `bash skills/super-code/scripts/report-verdict --complete --source
'<invocationId>/<logical-artifact>' FILE`. The invocation token comes from the persisted
super-code Launch, separate from runTag; e.g. `inv-a/final` identifies
`final-review-inv-a.md`. Split artifacts have their own logical suffix (e.g. `inv-a/cluster-1`).
Retain the exact returned object as one JSON line after `- finding-source · `, including
`version:1`, `source`, `artifact`, `kind`, `verdict`, and every occurrence's `section`, `position`,
`key` and `text`. JSON escapes preserve multiline text and keys with commas or Unicode.
Keep the original artifact alongside the extraction. Relative artifact paths resolve from the
run.md directory; when archiving, update only `artifact` to the retained copy, preserving
`source` and the complete occurrence array. Source identity is never derived from archive paths.
An unavailable artifact reports a gap while its inline extraction still preserves known findings.
Extraction failure is a gap, never a replacement empty source. An explicit clean recognized
review may have `occurrences:[]`; a run with no retained sources has unknown coverage.

**Declared producer population.** `roast-design` and `roast-code` retain the complete actual
settled report/input lists consumed by their respective ledger producers, including earlier,
amend, keys-only and genuinely empty inputs. At handoff/resume the outer owner collects complete
original extractions for every declared input. A ledger requires its matching-loop declaration;
even a genuine zero-row header cannot prove which inputs were consumed. Missing/ambiguous inputs,
truncated ledgers, unavailable original bytes and incomplete extraction remain coverage gaps.
The gate checks report-key membership against ledger rows in both directions for transport
consistency only; this never supplies occurrence identity, links, relevance or resolution.

**Optional source correspondence.** Directly registered original reports need no association.
When exact archival/keys/legacy correspondence needs an explicit owner judgment, append this
single JSON object after `- source-correspondence · ` in `approvals:`:

```json
{"version":1,"artifact":"<original declared report or keys file>","sha256":"<original bytes SHA-256>","source":"<existing immutable source ID>","retainedArtifact":"<registered retained report or adapter>","retainedSha256":"<retained bytes SHA-256>","judgment":"supported","basis":"<why this exact source correspondence is complete>","evidence":["<raw/retained inspection evidence>"],"lines":[{"line":2,"refs":[{"source":"<same named source>","section":"Must fix before landing","position":1}]}]}
```

Both artifacts resolve from the run directory (absolute paths also work), must remain readable,
and must match their hashes. `source` is already registered at `retainedArtifact`; the gate
freshly re-extracts that artifact and compares the complete extraction. Keep every original raw
artifact and parser failure. This record creates no source, link, relevance or disposition.
Malformed, unsupported or conflicting associations remain gaps even beside a valid association.

For keys-only input, `lines` maps each actual nonempty key line exactly once, using its original
1-based physical line number and nonempty exact occurrence refs from this one retained source.
A first `review: ready|not ready|none` header and blank lines are excluded. Missing, duplicate,
header, unknown, cross-source or uncovered mappings fail. A single keys file spanning multiple
source identities remains a gap; matching display keys alone supply no correspondence.
For same-byte archived reports, omit `lines`; original and retained full extraction must match.
Repeated exact associations and identical archived copies are allowed, conflicting source,
content or line mappings are not.

For a malformed historical report requiring a judged retained interpretation, add:

```json
{"interpretation":{"kind":"legacy-adapter","originalVerdict":"<actual original compact-parser verdict>","limitations":["<original strict-extraction failure and interpretation limits>"]}}
```

Original strict extraction must fail while the compact parser still recognizes its kind/verdict.
The adapter kind/verdict and `originalVerdict` must match that historical outcome. Keep failure
receipts and independent completeness judgment in `evidence`; limitations identify interpretation.
A valid ordinary report cannot take this rewrite route, and an unrecognized source remains a gap.
The gate validates bytes, refs and parser outcomes; the owner must support semantic completeness.
A valid-empty adapter cannot authorize refs into another source or replace an unknown population.

**Reference and link.** An occurrence reference is exactly
`{"source":"inv-a/final","section":"Deferred OK","position":1}`. Section and source strings
match exactly, and position is the extractor's positive section-local integer. Source path,
wording, severity and key alone do not link appearances. Append
`- finding-link · {"refs":[<ref>,<other-ref>],"basis":"why these appearances are the same obligation"}`
only after judging the explicit match. Links combine referenced occurrences transitively.
Ambiguous matches remain separate. Archive copies with identical source/section/position and
text deduplicate; conflicting extractions retain text variants, expose a gap and keep affected
findings outstanding even if a disposition claims resolution.

**Routing.** Append `- finding-route · {"ref":<ref>,"owner":"<bead>","fix":"<fix bead>",
"deferred":"<reason>"}` as one JSON line, with any nonempty subset of owner/fix/deferred.
Deferral is explicit routing, not inferred from a section name. A fix-task assignment, closed
bead, success claim or a later silent/ready review leaves the finding outstanding.

**Supported disposition.** Append
`- finding-disposition · {"ref":<ref>,"disposition":"resolved","judgment":"supported",
"basis":"why the fix addresses this finding","evidence":["verification.log @ <sha>"],
"verification":"exact relevant check and observed repaired behavior"}` as one JSON line.
A rejection uses `"disposition":"rejected"`, keeps its reasoning in `basis` and supporting
references in the nonempty `evidence` array, and does not require `verification`. Helpers validate
references and required fields. The owning agent first judges whether the evidence semantically
supports this particular fix or rejection, then records `judgment:"supported"`; a nonempty
file name or a successful task is insufficient. Verification of a fix supplied by another task
uses the same contract. A passing sweep settles only the measurement obligation it establishes;
it cannot stand in for verification of unrelated actionable findings. Unsupported disposition
records remain visible with a gap and do not resolve findings. A supported disposition applies
to the explicitly linked group; other appearances remain independent.

**CLI and output.** Run `bash skills/super-auto/scripts/scope-dispositions --project RUN_MD`
for JSON `{version:1,findings:[...],gaps:[{origin,message}]}`. Each finding holds its first retained
`ref`, original `occurrences` (including source/artifact/section/position/key/text), all archive
`artifacts`, conflicting `variants`, explicit `links`, `routes`, `dispositions` with mechanically
validated `supported`, and booleans `outstanding`/`deferred`. Source order is deterministic.
No source/disposition is removed from run.md by projection. Append-only history stays available
even after a supported disposition makes a finding no longer outstanding.

Add `--keys` for the legacy punch-list transport: one exact original key per line, from only
outstanding deferred groups, deduplicated in first appearance order. Resolved/rejected findings
and active nondeferred findings are excluded. This is derived from the same validated projection;
an empty key stream alone cannot establish clean acceptance. Detailed JSON retains all distinct
occurrences despite equal printed keys. Consumers must check exit status and gaps, and use the
full projection for Remaining/resume/status rather than treating the latest ready verdict as
clearance of earlier findings.

Optional `--external FILE` consumes a supplementary JSON object
`{"version":1,"records":[{"type":"finding-link",...},{"type":"finding-disposition",...}]}`.
Each record has the same refs/basis/support fields as the local counterpart and can reference
only retained local occurrences. This is a consumer seam, not a new roast-ledger API or policy.
Unsupported/unknown types (including silence-based dissolution), absent files, malformed or
incomplete records produce gaps without replacing local evidence; valid supplementary records
are applied individually. Omitting this optional argument does not imply an external disposition.

Exit 0 means projection validated; 3 means projection returned retained findings plus explicit
gaps; 2 means bad CLI or unreadable run record and no projection; 4 means Node unavailable.
In key mode gaps go to stderr as `FINDING_GAP:`; JSON mode includes them in `gaps`.
No jq is required by projection (the legacy round mode still uses its existing jq/manual fallback).
If Node is unavailable, `NODE_UNAVAILABLE:` is printed on stderr and no projection is established:
retain all known occurrences, manually follow explicit links and supported dispositions, and
list every unresolved deferred key plus any evidence gaps. Never interpret unavailable output
as an empty punch list or a clean review.

Projection JSON also carries additive `metrics` over retained sources: raw `occurrences`,
`occurrenceGroups`, actionable `findings`, supported `repaired`/`rejected`, `outstanding`,
outstanding `deferred`, `otherSectionGroups`, source kinds, section labels and gap count.
Actionable groups have an occurrence in Confirmed findings, Must fix, Deferred, Concerns,
Blockers, Findings or Untested scope; other extraction sections remain separately visible.
A group counts as repaired only with a supported resolved disposition and no outstanding
conflict. Rejection/deferral contributes zero repairs. Explicit links can reduce group counts
without reducing raw occurrence counts. Exit 3 retains these supported partial metrics and gaps.
The scope is retained sources: absent task-report/roast/final-review populations remain
unestablished rather than supplying zero run-wide findings. No new run.md field is required.

Report sources preserve the latest invocation verdict separately from durable Recovery fix
history and the finding projection. A `baseAbsorbed` record supplies zero task landings;
normal execution-mechanism selection supplies zero friction events. An unavailable ledger can
still supply known invocation results, labelled with a run-total gap.

## File format — worked example

An illustrative `run.md` mid-run: the design phase went through two roast
rounds (one still parked as an escalation), then code roast ran three rounds.
Round 3's step-back started redesign cycle 1, whose amend design roast ran as
design roast round 3; that cycle is now applied, and code roast round 4 is next.

```markdown
# super-auto run — 2026-07-31-per-tenant-rate-limiter

flags: planOneShot=false skipPlanRoast=false skipCodeRoast=false autonomous=true
phase: roast-code
codeMechanism: ordinary-subagents
runTag: per-tenant-rate-limiter-20260731T091500
context: Context: claude · planner=1M/967K · implementer=200K/167K · reviewer=200K/167K · finalReview=1M/967K · assembler=200K/167K · warn: implementer, reviewer, assembler on a 200K model → set ANTHROPIC_DEFAULT_SONNET_MODEL=<model>[1m] or config.models.<role> to a 1M model

idea: add a per-tenant rate limiter to the public API
spec: 2026-07-31-per-tenant-rate-limiter-design.md
epic: bd-412
branch: super-auto/per-tenant-rate-limiter
base: main
roast-design: 2026-07-31-per-tenant-rate-limiter-roast-design-1.md, 2026-07-31-per-tenant-rate-limiter-roast-design-2.md, 2026-08-01-per-tenant-rate-limiter-roast-design-3.md
roast-code: 2026-08-01-per-tenant-rate-limiter-roast-pr-1.md, 2026-08-01-per-tenant-rate-limiter-roast-pr-2.md, 2026-08-01-per-tenant-rate-limiter-roast-pr-3.md
findingsLedger: findings-ledger.md
findingsLedgerDesign: findings-ledger-design.md

roastDesignRound: 3
roastCodeRound: 3
redesignCycles-code: 1
redesignCycles-design: 0
redesign-code-1: round 3 · triggers no-progress · amended 2026-07-31-per-tenant-rate-limiter-design.md §Retry policy · lastGood 3f9c2e1 · designRoast r3 fixed · state applied
stepBackCode-round-3: redesign — applied: per-handler quota checks → one quota middleware (dissolves 2)

approvals:
- root-acceptance · {"version":1,"owner":"super-auto","sourceTree":"1111111111111111111111111111111111111111","requirements":[{"id":"final-review","kind":"review","owner":"super-auto"},{"id":"sweep","kind":"measurement","owner":"super-auto","command":"npm test","configuration":"quiet host","requiredLive":true,"obligations":["bd-412:sweep:rate-limiter-20260731T120000"]},{"id":"finish","kind":"human","owner":"human"}],"evidence":[],"reviews":[],"decisions":[],"recovery":{"obligations":[],"gaps":[]},"checkEvidence":{"records":[],"requiredLiveChecks":[],"gaps":[]},"runFailures":[]}
- review-collection · {"invocationId":"inv-a","workspace":"/work/project/.superpowers/sdd/bd-root-plan","reviewPath":"/work/project/.superpowers/sdd/bd-root-plan/final-review-inv-a.md","review":"pending","required":[],"settled":false}
- top-split · auto · bd-413 PROMOTE, bd-414 PROMOTE, bd-415 LEAF, bd-416 LEAF
- finding-source · {"version":1,"source":"inv-a/final","artifact":"final-review-inv-a.md","kind":"final-review","verdict":"not ready","occurrences":[{"section":"Deferred OK","position":1,"key":"[Nit] lib/format.ts:12 — inconsistent formatting","text":"[Nit] lib/format.ts:12 — inconsistent formatting"}]}
- finding-source · {"version":1,"source":"inv-b/final","artifact":"final-review-inv-b.md","kind":"final-review","verdict":"not ready","occurrences":[{"section":"Deferred OK","position":1,"key":"[Nit] lib/format.ts:12 — same formatting obligation","text":"[Nit] lib/format.ts:12 — same formatting obligation"}]}
- finding-link · {"refs":[{"source":"inv-a/final","section":"Deferred OK","position":1},{"source":"inv-b/final","section":"Deferred OK","position":1}],"basis":"reviewed as the same source location and defect"}
- finding-route · {"ref":{"source":"inv-a/final","section":"Deferred OK","position":1},"owner":"bd-421","fix":"bd-421","deferred":"formatting lies outside the goal"}
- finding-disposition · {"ref":{"source":"inv-a/final","section":"Deferred OK","position":1},"disposition":"resolved","judgment":"supported","basis":"bd-422 supplied the formatting fix","evidence":["format-verification.log @ 1a2b3c4"],"verification":"formatter check passes on both affected ranges"}
- coverage-round-1 · canonical R-list: R1 "enforce per-tenant request quota", R2 "reject over-quota requests with 429", R3 "expose current quota usage to callers" · requirements: 3 · mapped: 2 · unmapped: 1 (R3) · auto GAP "no backpressure path" → leaf bd-417; auto ORPHAN "metrics exporter" → kept, goal element added; auto UNOWNED-SEAM "tenant-id propagation" → contract bd-418 / integration bd-419; auto unstated "bd-411<-bd-405" → edge dropped (no artifact to name); auto GAP "R3 unmapped — usage exposure" → leaf bd-420
- coverage-amend-code-1 · auto GAP "quota middleware has no owner" → leaf bd-421

parked:
- ../../../../.superpowers/sdd/bd-412-plan/progress.md#run-failure-F · degraded-verdict · "run-regression F owner bd-413; command npm test -- F; configuration target=staging; run-start/A/B-base evidence in Recovery; bd-414 task-base exonerated"
- ../../../../.superpowers/sdd/bd-412-plan/progress.md#run-failure-G · degraded-verdict · "attribution gap G: missing run baseline; evidence/G.log"
- 2026-07-31-per-tenant-rate-limiter-roast-design-2.md · escalation · "cache invalidation premise unverified — no valid judge votes"
- 2026-07-31-per-tenant-rate-limiter-roast-design-2.md · degraded-verdict · "clean [low coverage] — proceeded, not re-roasted"
- 2026-08-01-per-tenant-rate-limiter-roast-pr-1.md · beyond-cap · "Blocking candidate left unjudged at panel cap"
- 2026-08-01-per-tenant-rate-limiter-roast-design-3.md · degraded-verdict · "amend roast finding not fixed — [Should-fix] 2026-07-31-per-tenant-rate-limiter-design.md §Retry policy"

codeBuckets:
  completed: bd-413, bd-414
  escalated:
  pendingRetry:
  parked: bd-415
  stalled: false
  review: ready
  sweep: SWEEP DEFERRED (caller-owned)
  slowness:
  worktreesKept:
  processSweep: stopped 0 · survived 0 · unknown 0 · kept 0
```

## Phase-7 cleanup facts

The existing `codeBuckets.worktreesKept` and `codeBuckets.processSweep` also carry phase-7 cleanup
results. Before finishing can remove the outer worktree, refresh these facts from actual helper
results and the retained-resource inventory (SKILL.md §Phase 7 — cleanup preconditions).
Retain each task cleanup exit 3 or 4 with its exact worktree/temp paths and reason, and include
containing parent paths that cannot be removed. Refused roots, pending final parent inspection,
unavailable invocations and missing results are unknown/unchecked, not verified empty.

Keep stopped (verified terminated), survived (observed alive), unknown (inspection/termination
unverified) and kept (deliberately preserved) facts distinct, with their resource dependencies.
A verified no-match helper invocation can establish zero processes; an unconfirmed exit-zero
empty wrapper output cannot. A successful leaf sweep establishes only its own resources' safety;
final parent verification must happen after no retained descendants remain and before deletion.
Clear a retained fact only after its named resource has been freshly verified safe, not because
another invocation returned zero. Existing phase-3 bucket replacement must preserve unresolved
phase-7 cleanup facts if implementation is re-entered.

Write these facts and update report.md Remaining before teardown; preserve required unarchived
evidence. `phase: done` can record completed delivery and the human's branch choice while cleanup
remains pending. On resume, inspect these retained paths before attempting cleanup again; do not
re-merge or delete a preserved parent merely because the delivery phase is done. No new field,
cleanup engine or change to root acceptance is introduced.

## The resume rule

Resume from the recorded `phase`; never re-ask the flags and never reset a counter (SKILL.md §Resume).
