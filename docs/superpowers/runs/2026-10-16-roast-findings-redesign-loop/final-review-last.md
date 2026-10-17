# Final seam review: super-plan-59b (roast-findings-redesign-loop)

- **Branch:** `super-auto/roast-findings-redesign-loop` @ 5e7e3ba9. Merge base with main: 3f4fdba3.
- **Epic:** super-plan-59b (closed).
- **Spec:** `docs/superpowers/runs/2026-10-16-roast-findings-redesign-loop/2026-10-16-roast-findings-redesign-loop-design.md`.
- **Vision (binding):** `docs/superpowers/specs/2026-10-16-vision-roast-findings-redesign-loop.md`.
- **Inputs:**
  - the 29 cluster reviews (`-cluster-1.md` … `-cluster-29.md`, all written 02:32–02:49 for this tip);
  - `assembled/final-review-roast-findings-redesign-loop-20261017T054231-final/clusters.json`;
  - the epic's description and Global Constraints / key-abstractions digest (`bd show super-plan-59b --json`);
  - the cross-cluster hunks in `git diff 3f4fdba3 HEAD`.
- **Tests:** on the integrated tree, every suite the branch touches passes: test-scripts, test-findings-ledger, test-step-back-check, test-amend-check, test-redesign-chain and test-redesign-cycle-filing under tests/super-design; test-scripts and test-contract-lint under tests/super-auto; test-report-verdict; test-bash-invocation; test-assemble-args.

This file replaces the earlier 01:59 pass at the same path.

## Cluster verdicts carried in

| Cluster | Name | Verdict |
|---|---|---|
| 1 | root (AGENTS.md) | ready |
| 2 | docs-runs | ready |
| 3 | docs-run-profiles | ready |
| 4 | docs-specs | ready |
| 5 | super-auto MAINTENANCE.md | ready |
| 6 | super-auto SKILL.md | not ready (amend-roast tasks have no `$AMEND` work list) |
| 7 | super-auto report-prompt.md | not ready (disputed Blocking: clean status vs Remaining; `lastGood` not reported) |
| 8 | super-auto resume.md | not ready (`amend-checked` resume aborts a committed amendment; resumed aborts park nothing) |
| 9 | super-auto run-state.md | not ready (no writer/pointer for the code loop's amend roast; worked example inconsistent) |
| 10 | super-auto scripts (removed step-back-check) | ready |
| 11 | super-code report-verdict | ready |
| 12 | super-design MAINTENANCE.md | ready |
| 13 | super-design SKILL.md | not ready (`id_of` misses HTML-escaped bd titles) |
| 14 | super-design amend-prompt.md | ready |
| 15 | super-design scripts | not ready (amend-check reverse rule compares spec paths unnormalised) |
| 16 | super-design step-back-prompt.md | ready |
| 17 | super-roast SKILL.md | ready |
| 18 | super-roast-workflow.md | ready |
| 19–29 | test clusters | ready |

## Previous final-review must-fixes: status

All five must-fixes from the 01:59 pass are resolved on this tip:

- **Cluster 2 unreviewed.** It is now reviewed: cluster 2, ready.
- **Step-back line written before the branch, plus the legacy in-place replay.**
  - Both loops now write the `stepBack…-round-<N>` line as part of the branch's own run-state write. The code loop does it at super-auto Step 1 item 7; the design loop at super-design Step 1 item 7.
  - The legacy `redesign — applied` replay now applies only when no `redesign-<loop>-<K>` record exists anywhere. See resume.md "Resuming at a phase" and super-design §Re-entry.
- **Who writes `applied`.** Amend Mode step 7 and its Outcomes paragraph now say the calling loop writes it. super-auto writes it at §Redesign cycle step 4; resume.md `beads-filed` agrees.
- **Punch list after a redesign round.** Step 2 and the phase-4 row now use the latest existing punch-list file (c24fd272).
- **Design-loop sweep edge.** Amend Mode step 4 now wires each filed bead under the `Integration sweep:` bead, with `bd dep add` and a `blocked-by` description line.

## Seams checked

**Interfaces that agree:**

- **findings-ledger CLI (15) and both loops' Step 1 item 2 (6, 13).** The flags match, the per-loop output and overrides paths match, and the "latest existing punch list" input contract now matches its producer, super-auto Step 2.
- **step-back-check (15) and both loops' Step 1 item 5 (6, 13), resume.md (8) and step-back-prompt.md (16).**
  - `--step-back --keys --ledger` is used everywhere.
  - `patch` is read as `local` in exactly one script. report-verdict (11) passes the decision through verbatim.
  - The old super-auto path is gone (10).
- **amend-check (15) and its callers (Amend Mode step 2, resume `started`/`amend-checked` in both loops).** The flags are the same everywhere, and every caller treats exit 2 as "fix and re-run, never restore".
- **Redesign budget.**
  - `config.iterationCap` reaches super-roast (17, 18) only as the computed `3 + redesignCycles-<loop>`.
  - The counters are never reset.
  - Both loops record `lastGood` as the pre-amendment HEAD before writing `started`.
- **Park texts and record formats.** The six park texts and the `redesign-<loop>-<K>` line agree across:
  - run-state.md (9) and report-prompt.md (7);
  - both SKILL.md files (6, 13);
  - the contract-lint baselines (19, 20).
- **Abort ordering.** Both loops' §Redesign cycle and both resume texts remove the round's `dissolved@r<N>` lines and rebuild the ledger before writing `aborted`. Contract-lint pins this.

**Seam defects** (cluster findings that turn out to span clusters, plus one of my own):

1. **The code loop's amend design roast is owned by no schema (clusters 6, 9, and SKILL.md:224 in cluster 6).** This is wider than cluster 9's finding.
   - **What the cycle does.** super-auto §Redesign cycle step 3:
     - increments `roastDesignRound`;
     - rebuilds `findingsLedgerDesign`;
     - takes "the run's latest `roast-design` report" as the prior report;
     - hands the spec fixer "every `roast-design` report".
   - **What the schema says.**
     - run-state.md's Field table and item 5 name only super-design as the writer of those fields.
     - super-auto SKILL.md:224 says the two skills' field ownership "does not overlap … Neither rewrites the other's fields".
     - Nothing tells the code loop to append its amend-roast report to `roast-design:`.
     - Nothing gives the `findingsLedgerDesign` rebuild an invocation: the `findings-overrides-design.md` path and a report set that includes round M.
   - **The effects.**
     - A second cycle's amend roast takes the wrong prior report.
     - The rebuilt design ledger leaves out round M.
     - resume.md `beads-filed`'s "`r<M>` with/without its report" check has no recorded pointer to look up.
     - Under `skipPlanRoast`, the code loop is the only writer of fields the schema says it never writes.
2. **An `amend-checked` resume can abort a committed amendment, in both loops (clusters 8 and 13).**
   - **The crash window.** Amend Mode step 3 commits the specs, then rewrites the state.
   - **The failure.** A crash between the two leaves `amend-checked` with an empty `git diff HEAD`. amend-check (default `--base HEAD`) then rejects every `amended:` section with "no changed line". Both resume.md and super-design §Re-entry `amend-checked` route that to `aborted — amend rejected on resume`. The amendment stays committed and its `work:` beads are never filed.
   - **Who flagged it.** Cluster 8 found this for super-auto. super-design SKILL.md §Re-entry carries the same bullet, and cluster 13 did not flag it.
   - **The fix.** Both loops record `lastGood` as the pre-amendment HEAD, so the fix can be uniform: re-run the check with `--base <lastGood>`.
3. **Resumed aborts are never parked, in both loops (clusters 7, 8 and 13).**
   - **Where the park is missing.** The `amend-checked` exit-3 route and the `aborted — <reason>` replay bullet do not park `redesign aborted — <reason>`. This holds in resume.md and in super-design §Re-entry. Cluster 13 noted the design-loop side only as a minor.
   - **Why it matters.** report-prompt.md's Remaining row (7) lists parked `redesign aborted` items, so a resume-time abort appears only as a record state under Gotchas.
4. **Disputed Blocking findings: three clusters state three rules (clusters 7, 13, 15, 19, 21).**
   - **Amend Mode step 5 (13):** "A disputed Blocking finding stays unresolved and is listed in Remaining." This matches vision §4.
   - **findings-ledger (15):** `disputed` is sticky.
   - **report-prompt.md:67 (7):** "If the roast stops confirming it, the roast resolved it. `report-status` therefore needs no change."
   - **The test clusters (19, 21):** they pin `status: clean` for a disputed key under a `stopped` design cap.
   - **The failure.** After a converged exit, a disputed Blocking that the roast no longer confirms gets a clean status line, while Remaining lists it as unresolved.
5. **Amend-roast filing has no input contract (clusters 6, 8, 13).**
   - **The two texts.** super-auto §Redesign cycle step 3 files the roast's build tasks with "Amend Mode step 4's filing sequence". That sequence reads `work:` lines only from `$AMEND`, which super-design defines as the amend record.
   - **The failure.** Followed literally, the step re-files the amendment's own `work:` items under `sp:redesign-code-<K>-roast` and never files the roast's tasks. resume.md's `r<M>` replay ("tasks deduped by title under `sp:redesign-code-<K>-roast`") has no durable title list to dedupe against.
6. **`id_of` title matching affects both loops' filing (cluster 13, consumed by 6 and 8).** The escaped-title miss breaks:
   - the design loop's supersede and sweep wiring, under `set -e`;
   - the `specs-committed` title dedupe in both loops, which resume.md and super-design §Re-entry rely on so that "a resume never files a bead twice".

**Interface gaps that do not block landing** (listed under Deferred OK):

- **Amend Mode step 5 after the commit.** It handles a ledger exit 2 "as that loop's Step 1 item 2", which means `local — gate not computable`. That contradicts "after the commit nothing aborts". The retry-then-`redesign incomplete` path should apply instead.
- **`declined` in step-back-prompt.md (16).** The template still offers `redesign — declined`, while both loops write `local — redesign declined by human`. The `declined` value is dead.
- **The abort parenthetical.** "a crash after the removal resumes into a state whose replay repeats it" appears in both loops' abort bullet (6, 13). It is inaccurate: the replay re-runs Amend Mode. The result is still consistent.

## Verdict
not ready (cluster must-fixes in 6, 7, 8, 9, 13 and 15 remain open; the amend-checked resume abort and the unparked resumed abort affect both loops; the code loop's amend roast has no field owner or pointer)

## Must fix before landing
- Seam, both loops (cluster 8, widened to cluster 13): resume.md §Redesign cycle replay `amend-checked`, super-design SKILL.md §Re-entry `amend-checked` and spec §5 re-run amend-check against HEAD, which after a landed step-3 commit rejects on the empty diff and aborts a committed amendment with its beads unfiled; run the check with `--base <lastGood>` (both loops record lastGood as the pre-amendment HEAD) or detect the landed commit and continue at `specs-committed`.
- Seam, both loops (cluster 8, widened to cluster 13): the `amend-checked` exit-3 route and the `aborted — <reason>` replay bullet in resume.md and in super-design §Re-entry must park the `degraded-verdict` `redesign aborted — <reason>` idempotently, so a resume-time or crash-interrupted abort reaches report.md's Remaining as report-prompt.md requires.
- Seam (cluster 9, widened to cluster 6): skills/super-auto/run-state.md Field table and item 5 must list super-auto (phase-5 amend roast, SKILL.md §Redesign cycle step 3) as a writer of `roastDesignRound`, `findingsLedgerDesign` and `roast-design:`, with a rule that the amend-roast report path is appended to `roast-design:`; reword skills/super-auto/SKILL.md:224's "does not overlap … Neither rewrites the other's fields" to admit that exception, and give step 3 its `findingsLedgerDesign` rebuild invocation (design overrides file, report set including round M).
- skills/super-auto/run-state.md worked example (cluster 9): list `roast-pr-1..3` under `roast-code:` and the round-3 amend-roast report under `roast-design:` to match `roastCodeRound: 3`, `roastDesignRound: 3` and `designRoast r3 fixed`; cite that design report as the source of the `amend roast finding not fixed` park with a key matching the `amended` spec name; fix the "one round into code roast" lead-in.
- Seam (cluster 6, with clusters 8 and 13): skills/super-auto/SKILL.md §Redesign cycle step 3 must write the amend-roast build tasks to a durable work-list file in `work:` line format (e.g. `<run-dir>/amend-code-<K>-roast.md`), pass that file as `$AMEND` to Amend Mode step 4's filing sequence, and point resume.md's `r<M>` replay at it for title dedupe.
- Seam (cluster 7, with clusters 13, 15, 19, 21): reconcile the disputed-Blocking rule; either have report-status count `disputed` Blocking ledger rows as unresolved, as vision §4 and Amend Mode step 5 state, or change report-prompt.md:67 and Amend Mode step 5 to one stated rule for a disputed Blocking the roast no longer confirms, with your human partner's approval of the vision deviation; align the disputed-* report-status fixtures with whichever rule is chosen.
- skills/super-auto/report-prompt.md (cluster 7): require the report to surface the `lastGood <sha>` of a `redesign-<loop>-<K>` record in state `thrash — lastGood breach` (vision §4), in the Gotchas field list or as a Remaining item.
- skills/super-design/SKILL.md §Amend Mode step 4 `id_of` (cluster 13, used by both loops): match JSON-decoded titles (bd escapes `<` `>` `&` as < > &, plus `\"` and `\\`) or use the ids `bd create --silent` returns, so supersede and sweep wiring do not run with an empty id under `set -e` and the `specs-committed` dedupe holds.
- tests/super-design/test-redesign-cycle-filing.sh (cluster 13): make the stub `bd list` emit Go-style escaped titles and add a case with a `->` or `&` work title that is filed once, superseded, wired to the sweep and deduped on replay.
- skills/super-design/scripts/amend-check:198 (cluster 15): normalise the `owners:` and `amended:` spec paths through `spec_index` before the design-loop reverse-rule lookup, and add a `--loop design` case in tests/super-design/test-amend-check.sh where the two spell the same spec differently (`./docs/spec.md` vs `docs/spec.md`).

## Untested scope
- No test runs a redesign cycle end to end across clusters in either loop (Step 1 branch, Amend Mode, bead filing, super-code re-entry, next roast); every script stage is tested alone or in the chain test, which runs no orchestrator, bd or super-code.
- Both loops' resume state dispatch (`started`, `amend-checked`, `specs-committed`, `beads-filed` with its `designRoast` sub-states, `aborted`) and the crash windows between a durable output and its state rewrite are prose only; contract-lint pins wording, not behaviour.
- The orchestrator's cap and budget arithmetic (counter increment before the cap test, a cycle started on the cap round, the design loop's extension interaction) is pinned only as spelling.
- The Step 1 second-reject paths (forced redesign, thrash with the budget spent, `local` fallback), the ledger exit-2 degrade, the lastGood breach as an action and the interactive decline are prose only in both loops.
- The code loop's amend design roast (gate, `designRoast` markers, spec-fixer dispatch, `findingsLedgerDesign` rebuild, `sp:redesign-code-<K>-roast` filing) is prose only and is checked by one pointer grep.
- The filing block runs only against a stub bd: real `bd list --json` escaping, the `PARENT != ROOT` subepic path, the `JQ_UNAVAILABLE` branch, filed-description content and `supersedes:` with the ASCII arrow or a malformed line are untested.
- The disputed-Blocking path from dispute to `roastCodeCapped:`/`roastDesignCapped:` and to report-status is untested; the disputed-* fixtures hold no dispute status report-status reads.
- No fixture shows a drafted report listing `disputed` rows, the six park texts or the redesign records; report-prompt's contracts are pinned as token presence only.
- run-state.md's "Written by" column, single-valued counters and in-place record rewrites have no check; the worked example's counters are not checked against its pointer lists.
- The amend-prompt and the revised step-back-prompt as agent behaviour have no eval, and spec §7's manual replay acceptance (2026-10-15 round-1 code roast through findings-ledger and the amend designer) was routed to the report phase and has not run.
- This run executed under plugin 6.4.2-alepar6.0, so no live redesign cycle, findings-ledger, Amend Mode or new step-back-check ran; the feature has only script and contract-lint evidence.
- findings-ledger has no fixture for a design-mode super-roast report shape or a relocated regression; amend-check has no case for `amended:` outside `--specs`, a missing section, a malformed `owners:` line or `--base` with a valid non-HEAD revision; step-back-check has no case for an invalid `decision:`, a bad `scope:` prefix, `defect-type`, spaced trigger evidence or bad-input exits.
- super-roast has no test rendering a non-default `config.iterationCap` header (`iteration: K of N`), and the super-roast side of check_itercap has no mutation case.
- report-verdict near-miss boundaries are pinned only for `localized`, not for `patch`/`redesign` near-misses, hyphenated suffixes or CRLF/trailing-text `local` lines.
- The stale-path guard in test-redesign-chain.sh greps the CLAUDE.md symlink and never scans AGENTS.md text.
- docs/superpowers/specs/INDEX.md has no automated check.

## Deferred OK
- Amend Mode step 5 handles a ledger exit 2 "as that loop's Step 1 item 2", which after the commit means `local — gate not computable`; state that after the commit it takes the retry-then-`redesign incomplete` path.
- Both loops' abort bullet says "a crash after the removal resumes into a state whose replay repeats it"; the replay actually re-runs Amend Mode, which is consistent but worded wrong.
- Both loops' resume `started` should re-append the round's validated `dissolves:` lines lost to a crash between the `started` write and the overrides write; today it fails safe (the designer must own those keys).
- step-back-prompt.md still offers `redesign — declined`, while both loops record `local — redesign declined by human`; drop the dead value, and add the `local — step-back record rejected` form to the template's caller-written list.
- Final-review ledger rows point `text` at a keys file with no body, and the step-back template has no slot for `reviewPath`; this gap predates the branch.
- A Blocking key disputed by Amend Mode and later re-confirmed is still routed in-scope by a later `local` round's scope filter; the spec is silent.
- In an interactive code-loop run an outside-scope redesign is presented twice (Step 1 items 6 and 7).
- An aborted cycle leaves its `redesign — applied` stepBack line beside the `aborted` record; nothing reads the pair wrongly today, but resume could say how to read it.
- The Fix-bead template's "applied-redesign bead" kind clause is stale now that Amend Mode files those beads.
- A re-dispatched step-back after a first `step-back-check` reject has no stated save path.
- resume.md "The rest of this paragraph" points at the next paragraph; `started` with an amend file and no spec diff is unstated; `specs-committed` skips the Key Abstractions sync after a crash between commit and sync; `beads-filed` dispute lines skip the ledger rebuild.
- run-state.md item 7 should mention resume.md's legacy in-place replay; the writer of `approvals · coverage-amend-<loop>-<K>` in the code loop is super-auto, not super-design.
- report-prompt.md:67's `roastDesignCapped:` claim omits the `stopped` exception; its "needs no change" rationale belongs in MAINTENANCE.md; add a dedupe note for items reachable from two Remaining sources; `stepBackDesign-round-<N>` is missing from its sources (pre-existing).
- The filing block depends on its list indentation being stripped (`EOF2` heredoc, embedded newline), and `id_of` lacks `--limit 0`.
- amend-prompt.md: align the first-dispatch `[REJECTS]` wording and the tree-dump `--limit 0` with SKILL.md, and tell the designer that `work:` titles are unique, contain no ` | `, and spell `owners:` spec paths as in `amended:`.
- amend-check: `work:` `covers:` keys are not checked against the ledger; `spec_index` resolves a shared basename to the first spec; indented fences are not recognised; the file is mode 644.
- step-back-check rejects spaced trigger evidence (one retry) and accepts an empty `triggers:` as `none`; findings-ledger collapses same-location findings, which fails safe as not-computable.
- skills/super-roast/reporter-prompt.md:225 keeps `iteration: N of 3` under the "super-roast unchanged" constraint; super-roast-workflow.md:1017 names only super-design as loop owner; the `config.iterationCap` paragraph could move to a mode-neutral note.
- super-design MAINTENANCE.md: give the Amend Mode entry its own heading, record the `patch` synonym's one-release sunset, and record the dissolves-placement departure; super-auto MAINTENANCE.md does not log this epic's SKILL.md removals (provenance lives in git and the design doc).
- At finish, write the spec's Post-Implementation "Changes vs. original design" (dissolve lines only in a taken redesign and removed on abort; final-review `review:` header; amend `supersedes:` field and new rejects; step-back line written with its record; latest-existing punch-list input), and soften Goal bullet 4's "all covered by script tests".
- run.md's `cluster dropped:` lines for c3, c7 and c8 contradict the closed beads .21, .25 and .26; the round-1 punch list carries Nits later fixed; the report must re-check them against the tip.
- Flip both 2026-10-16 INDEX.md rows to `implemented` at finish and correct the design row's test-home summary to the per-script super-design suites.
- Commit the profile for the third super-code re-entry (beads .31–.37) with the run's next chore commit.
- Unused fixtures (`step-back-check/local-under-trigger.md`, `findings-ledger/ignored-overrides/r3-dropped.md`, `redesign-chain/dropped-override/r3-dropped.md`) and EOF blank lines in about ten fixtures are cosmetic.
- Whoever cuts the release must run super-roast-workflow.md's dryRun scenarios, since this branch touches that file.
- Older audit snapshots under docs/superpowers/research/2026-10-07-oop-design/audit/ still cite the removed super-auto step-back-check path; they are dated records.
