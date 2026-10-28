# Final review (bounded): super-auto/review-continuity-followups, epic super-plan-mlr

Invocation inv-20261028T203458. Captured source: base 444f86b266b2208b612e0e91b0f54762576ff95a, head 487992e13f06783e1f6c0ee85eb5002a7e5a7c34, both verified with git rev-parse --verify. Source binding succeeded (bind-review-source exit 0).

## Scope and method

This is a bounded captured-source review, not a whole-range review. The assembler sidecar (assembled/final-review-inv-20261028T203458-final/review-inputs.json) reads status unavailable, sourceAvailable true, wholeRangeReady false, 103 changed paths, 0 slices, 0 omitted and 2115 provenance gaps, all from the untouched historical run docs/superpowers/runs/2026-10-16-workflow-reliability/ (inv-mvc60k41-xt8p35rk04d, incomplete split bundle, missing clusters.json and diffstat.txt). The failed assembly and that sidecar are preserved unchanged.

Inspected: every hunk of the 24 product, skill-text, spec and test paths listed in bounded-coverage.json (all script changes in report-verdict, dispatch-text.mjs, assembly-archive.cjs, context-preflight, context-pass.mjs, scope-dispositions and coordinator.js; all skill and prompt text changes; the root design spec; four test files). Read against the spec (bd show super-plan-mlr and the run's design doc, sections 4.1 to 4.8 and Unchanged behavior).

Executed at the captured head in a review-owned detached worktree (scratchpad frv-203458/wt, own TMPDIR), all exit 0: tests/super-code/test-report-verdict.sh, tests/super-code/test-setup-reuse.sh, tests/super-auto/review-inputs-range-scope.sh, tests/super-auto/review-continuity-e2e.sh, tests/super-code/test-context-preflight.sh, node tests/super-code/replay-harness.mjs (2404 passed, 0 failed), tests/super-code/test-coordinator-replay.sh, tests/super-code/test-dispatch-text.sh, tests/super-auto/test-scripts.sh, tests/super-auto/test-contract-lint.sh, tests/super-roast/test-assemble-args.sh. That is eleven targeted runs, not the full release suite.

Integration probes at the captured head:
- The branch's own dispatch-text review-inputs over this exact range (with a scratch copy of the ledger, no caller run binding) routes 1430 historical-run problems to the informational outOfRange list and leaves exactly 2 gaps, both for this run's own pending inv-20261028T203458 collection intent, which a caller-bound --review-run-file would exempt as pristine. So the range-scoping fix (super-plan-rsc) works on the real repository; the gaps that forced this bounded route come from the installed 6.4.2-alepar6.6 review-inputs, which predates it.
- The branch's scope-dispositions --project on this run's own run.md exits 0 with 0 gaps and unrouted 0: every recorded scope-filter decision has a finding-route, so the new bookkeeping check (super-plan-row) passes on the run that introduced it.
- report-verdict --repair-check probes: marking an unmarked Confirmed finding line is accepted; the same pair under a directory whose name contains a colon is rejected (see below).

## Own view (STEP 1)

Cross-task seams checked and found consistent:
- The two grammar copies (report-verdict --complete and assembly-archive.cjs strictDraft) implement the same fence rule, the same sibling versus sub-heading discriminator and the same unclosed-fence error; --classify reuses the --complete state machine rather than a second copy, as the spec requires.
- --repair-check (iii) and (iv) match the amended spec 4.1(c): (iii) compares the repair's --keys output with its Confirmed findings occurrences and skips non-roast kinds; (iv) aligns kept lines by --classify role and checks section and fence state. All --complete callers (report-status, dispatch-text bounded-review, super-auto and super-roast text) test for any nonzero status, so the 2 to 4 exit split for grammar failures breaks no caller.
- The review-inputs gap sink buffers run-attributed problems until both authenticateOrigins passes finish, and claims and saved hashes are skipped only for irrelevant runs whose archives lie under dirname(run)/reviews, which a changed path there would make relevant; no omission authority leaks from out-of-range runs.
- claude_window mirrors CLAUDE_WINDOWS row for row, and the parity test with the row-count check passes.
- The drift fragment, the branch-only and worktree-only cases and the landed-parent exclusion (b973f41e) match spec 4.5; no reset, -D, --force, stash or WIP commit appears in the setup text, and the recut path is unchanged. The replay-harness template-literal baseline moved 455 to 464 with a recorded reason, and the replay of the documented dryRun scenarios is green.
- Commit-policy text (implementer Commit step, fix-pass reword rule, reviewer Read list and Important grading) matches spec 4.7 and names no trailer.

Defects and risks I found (none blocks landing; all listed under Deferred OK):
- skills/super-code/scripts/report-verdict --repair-check builds "path:tmpfile" pairs and splits them on the first colon, so an ORIGINAL or REPAIR path that contains a colon is classified from a truncated path and its output redirected to a mangled relative path; a valid repair is then rejected with a misleading "(iv) cannot classify" error (reproduced). Report paths in run directories carry no colon today.
- skills/super-code/coordinator.js reviewFileFormat() tells final, cluster and seam reviewers to fix the formatting on exit 4 but "never by replacing existing partial contents (the write guard above holds)", while the guard says existing partial contents must never be replaced. A strict reader cannot repair its own just-written file, so the self-check degrades to a note and the loud "complete extraction unavailable" gap. Nothing is lost silently.
- The drift script treats a current stack parent whose branch ref no longer resolves as landed without running already-merged, so a rebuild can silently omit an unlanded parent whose branch was deleted, where the fresh-cut stack step would fail loudly. Unlikely in practice; work is never lost.
- report-verdict --complete (and the keys_roast awk) still treat a bullet line inside a fenced block within a recognized section as a new item, so a finding that quotes a markdown list in a code fence is split at the fence (reproduced: a fenced "- [Nit] fake" line becomes its own occurrence and key). The spec's "ordinary item or continuation text" allows this, and it is not a silent drop.
- The run.md projection keeps one routed round-1 Should-fix (skills/super-code/scripts/report-verdict:229, fix bead super-plan-mlr.16) outstanding with no finding-disposition, although mlr.21 replaced the markable() logic it names. That is caller bookkeeping: it stays outstanding until a supported disposition is recorded.

## Ledger triage (STEP 2)

No parked completion, parked finding, Recurring minor, Recurring blocker or BLOCKED-AUTH lines are present. The Metrics lines show 22 merges, 0 merge failures, 2 completions after a fix pass, 0 parked, and a "ledger/Git identities differ" gap with git-only ids from earlier epics (super-plan-998, goq, ufz), so ledger completeness is not independently established here.

Misgrading check: Task 22 [suite-not-run] names unrun documented Workflow dryRun scenarios, which triages as must-fix by rule. This review ran the offline replay of those scenarios (replay-harness.mjs and test-coordinator-replay.sh, which coordinator-workflow.md names as the source of the current row's counts): all green. A Workflow-hosted dryRun is still not run and is listed as untested. Task 16 [test-passes-before-fix] names tests that passed before their fix; that is a disclosed coverage gap, not a skipped test or product defect.

Minors resolved at head by later tasks: Task 1 [fence-state-global] (an unclosed fence is now a grammar error), Task 9 [prefix-rule-breadth] and Task 15 [over-broad-guard] (markable() removed; (iv) now uses --classify roles), and Task 6 [prose-dependent-execution]'s "missing parent branch counts as drift" (now treated as landed; see my drift note above). Task 6 [check-ordering] is largely neutralised by the landed-parent exclusion: a landed task's stale stack parents are landed, so it shows no drift, reuses, and reaches the ALREADY-MERGED CHECK.

All other minors are acceptable to defer, as listed below.

## Verdict
not ready (bounded review only: whole-range review outstanding, no full-suite sweep measured)

## Must fix before landing
- none

## Untested scope
- Whole-range review outstanding: this review is bounded because the installed 6.4.2-alepar6.6 review-inputs reported 2115 provenance gaps; a whole-range review of 444f86b2..487992e1 assembled with the branch's own scripts (which route those entries to outOfRange) is still required for acceptance.
- All 2115 provenance gaps in assembled/final-review-inv-20261028T203458-final/review-inputs.json (historical run docs/superpowers/runs/2026-10-16-workflow-reliability/, inv-mvc60k41-xt8p35rk04d, incomplete split bundle and missing captured files) are unreviewed; none was selected or waived.
- Full-suite sweep not run: no full-suite measurement of this branch exists yet; only the eleven targeted runs named in Scope and method were executed at the captured head.
- Workflow-hosted dryRun of coordinator.js not run; only the offline replay (replay-harness.mjs, test-coordinator-replay.sh) was executed, green.
- Skill and prompt text changes (super-auto, super-roast, super-design, implementer, task-reviewer and reporter prompts) carry prompt-text assertions only; no drill pressure eval evidence was seen, which the project's skill-change rule asks for.
- Drift-check reconciliation depends on the implementer agent saving and running the emitted script and acting on its last line; test-setup-reuse.sh proves the script, not agent compliance.
- Ledger/Git identity metrics gap (git-only ids from earlier epics): ledger completeness for this epic was not independently established.
- Executed but not read as diffs: tests/super-code/test-report-verdict.sh, tests/super-code/test-setup-reuse.sh, tests/super-auto/review-inputs-range-scope.sh, tests/super-auto/review-continuity-e2e.sh, tests/super-code/test-context-preflight.sh, tests/super-auto/test-scripts.sh; their hunks are unreviewed.
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-1-step-back-keys.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-1-step-back.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-1.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-2.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-3.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1-final-review-keys.refmap.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1-final-review-keys.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1-punch-list.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1-scope-keys.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1-step-back-keys.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1-step-back.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-2-final-review-keys.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-2-step-back-keys.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-2-step-back.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-2.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/amend-code-1-roast.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/amend-code-1.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-findings-round-1.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-findings-round-2.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-ledger.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-1-requirements.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-1-review-1.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-1-review-2.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-2-requirements.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-2-review-1.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-2-review-2.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/design-roast-1-tree.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/design-roast-2-tree.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/design-roast-3-tree.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/findings-ledger-design.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/findings-ledger.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/findings-overrides-design.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/findings-overrides.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/friction.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-1s3.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-2s3.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-rsc.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-tco-row.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-v94.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-zhk.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/rsc-proto.diff
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/rsc-scenarios.sh
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/profile-inv-20261028T162628.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/profile-inv-20261028T162628.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/profile-inv-20261028T192155.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/profile-inv-20261028T192155.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T162628/assembled/final-review-inv-20261028T162628-final/bounded-coverage.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T162628/assembled/final-review-inv-20261028T162628-final/bounded-draft.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T162628/assembled/final-review-inv-20261028T162628-final/diffstat.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T162628/assembled/final-review-inv-20261028T162628-final/generated-input-provenance.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T162628/assembled/final-review-inv-20261028T162628-final/review-inputs.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T162628/final-review-inv-20261028T162628.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T192155/assembled/final-review-inv-20261028T192155-final/bounded-coverage.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T192155/assembled/final-review-inv-20261028T192155-final/bounded-draft.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T192155/assembled/final-review-inv-20261028T192155-final/diffstat.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T192155/assembled/final-review-inv-20261028T192155-final/generated-input-provenance.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T192155/assembled/final-review-inv-20261028T192155-final/review-inputs.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T192155/final-review-inv-20261028T192155.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/run.md
- Unreviewed path (no hunk inspected): evidence/super-plan-1s3/final-run.log
- Unreviewed path (no hunk inspected): evidence/super-plan-mlr.6/summary.log
- Unreviewed path (no hunk inspected): evidence/super-plan-mlr.6/test-assemble-args.sh.log
- Unreviewed path (no hunk inspected): evidence/super-plan-mlr.6/test-contract-lint.sh.log
- Unreviewed path (no hunk inspected): evidence/super-plan-mlr.6/test-report-verdict.sh.log
- Unreviewed path (no hunk inspected): evidence/super-plan-mlr.6/test-scripts.sh.log
- Unreviewed path (no hunk inspected): tests/super-auto/review-continuity-e2e.sh
- Unreviewed path (no hunk inspected): tests/super-auto/review-inputs-range-scope.sh
- Unreviewed path (no hunk inspected): tests/super-auto/test-scripts.sh
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/findings-prose-preamble.md
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/mismatched-fence.md
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/narrative-findings-subheadings.md
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/roast-template-shaped.md
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/roast-unverified-nits-prose.md
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/unclosed-fence.md
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/whole-file-rule.md
- Unreviewed path (no hunk inspected): tests/super-code/test-context-preflight.sh
- Unreviewed path (no hunk inspected): tests/super-code/test-report-verdict.sh
- Unreviewed path (no hunk inspected): tests/super-code/test-setup-reuse.sh

## Deferred OK
- skills/super-code/scripts/report-verdict --repair-check splits its path:tmpfile pairs on the first colon, so a report path containing a colon is misclassified and the repair wrongly rejected (fails safe, misleading error); no run path carries a colon today.
- skills/super-code/coordinator.js reviewFileFormat(): the exit-4 self-repair instruction conflicts with the write guard's never-replace rule, so a strict reviewer notes rather than repairs; the result is the existing loud extraction gap, never a silent loss.
- skills/super-code/coordinator.js drift script: a current parent with no resolvable branch is treated as landed without the already-merged check, so a rebuild can omit an unlanded deleted parent; work is preserved and the case is unlikely.
- skills/super-code/scripts/report-verdict --complete and keys_roast: a bullet line inside a fenced block in a recognized section starts a new item, splitting a finding that quotes a markdown list; spec-permitted, not a silent drop.
- run.md projection: routed round-1 Should-fix report-verdict:229 (fix bead super-plan-mlr.16, logic replaced by mlr.21) has no finding-disposition and stays outstanding until the caller records a supported one.
- Ledger Task 6 check-ordering: drift check runs before the ALREADY-MERGED CHECK; the landed-parent exclusion means a landed task shows no drift, and work is preserved in every branch.
- Ledger Task 22 suite-not-run: offline dryRun replay ran green in this review; the Workflow-hosted run is listed as untested scope.
- Ledger Task 2 unquoted review path in the reviewFileFormat() self-check command (breaks only on a path with spaces), reconstructed fixtures, and prompt-text assertion location.
- Ledger Task 14 bare fence toggles in sibling run.md/prompt parsers (including the scope-decision scanner in scope-dispositions) and its boundary-test gap; Task 17 provenance-sample boundary test; Task 19 trim-only key normalization.
- Ledger Task 16 tests that passed before their fix (disclosed coverage gap, not a skipped test).
- Ledger Task 1 missing edge-case fixtures for ATX-after-bold and shallower siblings; Task 1 fence-state, Task 9 prefix-breadth and Task 15 markable items are resolved at head.
- Ledger Task 8, 10, 11, 12, 13, 20 and 21 items (prose flow, brittle prompt assertions, close-note items, committed evidence logs per existing convention, wording-presence tests, collect interpretation, stray blank line, coarse env checks, partial env pins).
