# Final whole-epic review (bounded) — super-plan-mlr

Integration branch super-auto/review-continuity-followups, captured base 444f86b266b2208b612e0e91b0f54762576ff95a, head 2d92ee1bfc96d8f9095c9d48dbe8c85a93562c1b (both verified with git rev-parse --verify). Caller checkout observed at head 2d92ee1b with a clean status; it was not switched or modified.

## Scope and method

This is a bounded captured-source review. The dispatch's review-inputs.json reads status unavailable, sourceAvailable true, wholeRangeReady false, 0 omitted, 87 selected, with 2115 gaps, every one of them under docs/superpowers/runs/2026-10-16-workflow-reliability/ (incomplete split bundle for inv-mvc60k41-xt8p35rk04d). The failed assembly and original sidecar were preserved; no whole-range package was built or loaded.

Inspected from captured Git (full hunks): AGENTS.md, docs/superpowers/specs/INDEX.md, all 17 changed files under skills/, tests/super-code/replay-harness.mjs and tests/super-code/test-context-preflight.sh. The remaining 66 changed paths (run artifacts, evidence logs, most new tests and fixtures) were not read hunk by hunk and are listed as unreviewed below.

Executed in a review-owned detached worktree at head (scratchpad, not the caller checkout): tests/super-code/test-report-verdict.sh, test-setup-reuse.sh (13 tests), test-context-preflight.sh, test-dispatch-text.sh, tests/super-auto/review-inputs-range-scope.sh, review-continuity-e2e.sh, and node tests/super-code/replay-harness.mjs (2404 passed, 0 failed). All passed. This is targeted evidence only; it is not the full-suite sweep, which the caller runs after this invocation, so the branch is not measured as a whole.

## Independent review against the spec

Spec: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-design.md, sections 4.1 to 4.8, read before the ledger.

4.1 report format contract (2s3, mlr.1, mlr.5, mlr.6, mlr.15, mlr.16). report-verdict --complete now separates grammar failure (exit 4) from usage and I/O errors (exit 2), rejects a sub-heading or bold label inside a recognized section once it has content, is fence-aware, and fails on an unclosed fence. assembly-archive.cjs strictDraft carries the same sub-heading and fence rules. --repair-check implements checks (i) to (iv); rule (iv) restricts the added marker to unindented non-item, non-heading, non-bold lines and refuses to demote a recognized roast word. reviewFileFormat() states the whole-file rule and the self-check, and the reporter template and super-roast SKILL.md give every section the same body rule plus the checked repair step. The previous bounded review's one Important item (unclosed fence silently refiles later sections with exit 0) is fixed at head: a final review with an open fence under Must fix now exits 4 with "unclosed code fence (opened with ```)", reproduced in the review worktree.

4.2 range-scoped provenance (rsc, mlr.18). The relevance predicate and run-scoped gap sink in dispatch-text.mjs follow the spec, including buffering until both endpoints' origins are authenticated and the "re-read only through a relevant mirror" rule; the digest lists at most 20 outOfRange entries with a count line. Live check: running the head's own review-inputs on this exact range gives 0 gaps from the 2026-10-16 run (1430 informational outOfRange entries) and only two gaps, both for this invocation's own pending record at run.md:154 (expected, since the check ran without the current-run binding). So the bounded status of this dispatch comes from the installed 6.4.2-alepar6.6 dispatch-text, which predates the fix, not from a branch defect. The sidecar given to this review has no outOfRange key, which confirms it was produced by the older script.

4.3 review readiness (tco). The super-roast Inputs table has the readiness row; super-auto phase 4 and the post-cap audit derive it from the round's own assembler result, with outOfRange explicitly not affecting a complete result; super-design states the design-roast rule from a captured SHA with clean spec paths. Prompt text only; behavior is exercised by assemble-args acceptance in the e2e S3 scenario.

4.4 bookkeeping visibility (row, mlr.3, mlr.20). scope-dispositions --project adds the "scope-filter decision without finding-route" gap and the unrouted metric, matching on same-round source, trimmed key, recorded roast-code/roast-design artifact and a route on that occurrence ref; key equality links nothing. Live check: the head's projection on this run's own run.md exits 0 with unrouted 0 and gaps 0 across the 12 recorded round-1 scope decisions. run-state.md defines the reserved "pending human decision:" prefix.

4.5 reused stacked workspace (v94, mlr.17). The drift script follows the spec: parent-not-ancestor or stale stack subject is drift; dirty worktree (excluding .tmp) fails typed; clean rebuilds on a detached integration HEAD with stack merges, then rebase --onto; every git step is fallible through fail(), which aborts, checks the branch back out and reports whether the old head was verifiably restored. Parent refs are resolved once, so a concurrent deletion between check and merge cannot produce a spurious failure. Branch-only and worktree-only cases are explicit and preserve both. Two small observations, neither blocking: REBUILT tells the implementer to report stacked true whenever the task has any parents, even when every parent ref was gone (landed) and no stack merge was made, so the stacked flag can be wrong while base (the integration tip) is still right; and rebase --onto linearizes, so a non-stack merge an earlier attempt made on the task branch after the old base would be flattened. Both are rare, lose no work (old head printed and reachable), and are recorded under Deferred OK.

4.6 window parity (1s3). claude_window mirrors CLAUDE_WINDOWS row for row; the parity test runs matching and boundary ids through both resolvers and asserts equal row counts. Bare alias without settings stays unknown; same-family alias inherits from the session id.

4.7 commit policy (zhk). The implementer Commit step and the task-reviewer rubric carry the project-rule-wins sentence, full-message inspection and Important severity; the reword-only remedy is limited to the task's own unmerged commits. No trailer is named or banned.

4.8 validation and constraints. The three new suites were added to the AGENTS.md release list (CLAUDE.md is a symlink to it). The replay-harness template-literal baseline moved from 455 to 464 with a recorded reason. coordinator-workflow.md's dryRun agent counts are unchanged in text, but the dryRun scenarios themselves were not run here.

Cross-task seams checked: the bounded-report path (strictDraft) and report-verdict --complete now share the sub-heading and fence rules, so a draft that passes one passes the other on those rules; super-auto's "round's report path" (accepted repair, else original) is the same artifact scope-dispositions requires for a matching roast source; readiness derivation reads the outOfRange field that 4.2 introduced. No composition defect was found in the inspected hunks.

## Ledger triage

Read after the independent pass. Metrics: 18 merges, 18 completions review-clean, 0 parked, 0 fix passes, 0 BLOCKED-AUTH; no Recurring minor or Recurring blocker lines. The ledger/Git identity gap is from earlier epics' git-only ids, so absence of lines is not read as clean.

Each minor (deferred) line, judged:
- Task 6 check-ordering (drift check before ALREADY-MERGED on a reused branch): deferred OK. For a branch already merged, integ..branch is empty, so the stale-subject loop finds nothing; drift needs a current parent that is not an ancestor, and a clean rebuild or typed failure preserves the old head.
- Task 6 prose-dependent execution and "missing parent ends SETUP_FAILED": the second half is superseded by mlr.17 (missing parent counts as landed, tested); agent compliance stays untested scope.
- Task 1 fence-state-global: fixed by mlr.15 (verified above).
- Task 9 prefix-rule-breadth: fixed by mlr.16 (markable excludes headings, items and bold).
- Task 15 over-broad markable guard: stricter than the rule text, rejects more repairs, loses nothing; deferred OK.
- Task 2 unquoted review path in the self-check command: deferred OK for generated workspace paths; a workspace path with spaces would break the self-check command.
- Task 14 unchecked sibling fence toggles (scope-dispositions:58 and :175, report-status, amend-check, assemble-args, task-brief): deferred OK, but note scope-dispositions:175 is the new decision scanner and a stray unmatched fence in run.md would hide later scope decisions from the unrouted check; run.md is machine-written, so this is a follow-up, not a blocker.
- Task 19 partial key normalization: deferred OK; both sides come from the same extracted key text.
- Task 17 and Task 14 missing boundary tests (exact-20 sample, shorter closer, closer with trailing text): deferred OK.
- Task 16 tests that passed before the fix: disclosed coverage gap; deferred OK.
- Task 8 prose flow, brittle prompt assertions, close-note pending; Task 10 committed evidence logs (an existing repo convention: evidence/ exists at base); Task 11 wording-presence tests and post-cap pointer; Task 12 text-independent projection block; Task 13 collect interpretation and close-note mapping; Task 2 reconstructed fixtures and test location: all deferred OK. None names a skipped test, a known product defect or a data-loss path.

## Verdict
not ready (bounded captured-source review; whole-range review and full-suite sweep outstanding)

## Must fix before landing
- none

## Untested scope
- Whole-range review outstanding: this review is bounded (provenance unavailable from the installed 6.4.2-alepar6.6 review-inputs); a whole-range review of 444f86b2..2d92ee1b is still required for acceptance. The branch's own review-inputs clears the historical gaps for this range, so a review assembled with the branch's scripts should be able to run the normal route.
- All 2115 provenance gaps in assembled/final-review-inv-20261028T192155-final/review-inputs.json (historical run docs/superpowers/runs/2026-10-16-workflow-reliability/, inv-mvc60k41-xt8p35rk04d, incomplete split bundle and missing captured files) are unreviewed; none was selected or waived.
- Full-suite sweep not run: no full-suite measurement of this branch exists yet; only the seven targeted runs listed in Scope and method were executed at the captured head.
- coordinator.js changed and its documented dryRun scenarios and agent counts (coordinator-workflow.md) were not run in this review.
- Skill and prompt text changes (super-auto, super-roast, super-design, implementer and task-reviewer prompts, reporter prompt) have prompt-text assertions only; no drill pressure eval evidence was seen, which the project's skill-change rule asks for.
- Drift-check reconciliation relies on the implementer agent saving and running the emitted script and acting on its last line; test-setup-reuse.sh proves the script, not agent compliance.
- Ledger/Git identity metrics gap (git-only ids from earlier epics): ledger completeness for this epic was not independently established.
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-design.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-1-step-back-keys.txt
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-1-step-back.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-1.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-2.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1-final-review-keys.refmap.json
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1-final-review-keys.txt
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1-punch-list.txt
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1-scope-keys.txt
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1-step-back-keys.txt
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1-step-back.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-1.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-findings-round-1.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-findings-round-2.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-ledger.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-1-requirements.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-1-review-1.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-1-review-2.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-2-requirements.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-2-review-1.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-2-review-2.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/design-roast-1-tree.json
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/design-roast-2-tree.json
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/findings-ledger-design.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/findings-ledger.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/findings-overrides-design.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/findings-overrides.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/friction.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-1s3.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-2s3.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-rsc.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-tco-row.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-v94.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-zhk.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/rsc-proto.diff
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/rsc-scenarios.sh
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/profile-inv-20261028T162628.json
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/profile-inv-20261028T162628.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T162628/assembled/final-review-inv-20261028T162628-final/bounded-coverage.json
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T162628/assembled/final-review-inv-20261028T162628-final/bounded-draft.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T162628/assembled/final-review-inv-20261028T162628-final/diffstat.txt
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T162628/assembled/final-review-inv-20261028T162628-final/generated-input-provenance.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T162628/assembled/final-review-inv-20261028T162628-final/review-inputs.json
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T162628/final-review-inv-20261028T162628.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/run.md
- Unreviewed path: evidence/super-plan-1s3/final-run.log
- Unreviewed path: evidence/super-plan-mlr.6/summary.log
- Unreviewed path: evidence/super-plan-mlr.6/test-assemble-args.sh.log
- Unreviewed path: evidence/super-plan-mlr.6/test-contract-lint.sh.log
- Unreviewed path: evidence/super-plan-mlr.6/test-report-verdict.sh.log
- Unreviewed path: evidence/super-plan-mlr.6/test-scripts.sh.log
- Unreviewed path: tests/super-auto/review-continuity-e2e.sh
- Unreviewed path: tests/super-auto/review-inputs-range-scope.sh
- Unreviewed path: tests/super-auto/test-contract-lint.sh
- Unreviewed path: tests/super-auto/test-scripts.sh
- Unreviewed path: tests/super-code/fixtures/report-verdict/findings-prose-preamble.md
- Unreviewed path: tests/super-code/fixtures/report-verdict/mismatched-fence.md
- Unreviewed path: tests/super-code/fixtures/report-verdict/narrative-findings-subheadings.md
- Unreviewed path: tests/super-code/fixtures/report-verdict/roast-template-shaped.md
- Unreviewed path: tests/super-code/fixtures/report-verdict/roast-unverified-nits-prose.md
- Unreviewed path: tests/super-code/fixtures/report-verdict/unclosed-fence.md
- Unreviewed path: tests/super-code/fixtures/report-verdict/whole-file-rule.md
- Unreviewed path: tests/super-code/test-dispatch-text.sh
- Unreviewed path: tests/super-code/test-report-verdict.sh
- Unreviewed path: tests/super-code/test-setup-reuse.sh
- Unreviewed path: tests/super-roast/test-assemble-args.sh

## Deferred OK
- skills/super-code/coordinator.js drift script: REBUILT says report stacked true whenever parents exist, even when every parent ref was gone and no stack merge was made; base is still correct.
- skills/super-code/coordinator.js drift script: rebase --onto flattens any non-stack merge an earlier attempt made on the task branch after the old base; no work lost, old head printed.
- Ledger Task 6 check-ordering: drift check runs before the ALREADY-MERGED CHECK on a reused branch; a landed branch rarely shows drift and work is preserved.
- Ledger Task 2 unquoted review path in the reviewFileFormat() self-check command (breaks only on a path with spaces).
- Ledger Task 14 bare fence toggles elsewhere, including the new scope-decision scanner at scope-dispositions:175 (a stray fence in run.md would hide later decisions from the unrouted check); follow-up.
- Ledger Task 15 over-broad markable guard; Task 19 trim-only key normalization; Task 14 and Task 17 boundary-test gaps; Task 16 tests that passed before the fix.
- Ledger Task 8, 10, 11, 12, 13 and remaining Task 2 items (prose flow, brittle prompt assertions, close-note items, committed evidence logs per existing convention, wording-presence tests, reconstructed fixtures, test location).
