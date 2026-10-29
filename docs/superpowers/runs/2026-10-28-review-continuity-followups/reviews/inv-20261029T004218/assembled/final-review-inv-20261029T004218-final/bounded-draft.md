# Final review (bounded) — epic super-plan-mlr, inv-20261029T004218

Captured source: base 444f86b266b2208b612e0e91b0f54762576ff95a, head 1531284460d66cc415b7a9ba1d46d8e7350923b2 (both verified as commits; caller checkout observed at the same head, status clean, unchanged during this review). Review-source binding persisted to the ledger before any artifact write.

## Scope and method

Bounded captured-source review. review-inputs.json reports status unavailable, sourceAvailable true, wholeRangeReady false, 0 omitted, base/head matching, 130 changed paths, 0 slices, 2115 provenance gaps (historical run docs/superpowers/runs/2026-10-16-workflow-reliability/, inv-mvc60k41-xt8p35rk04d, incomplete split bundle and missing captured files). No whole-range package was built; the failed assembly and the original sidecar were left untouched.

The prior bounded final review (inv-20261028T235807, head 4f617f6b) covered the product delta to 4f617f6b. Product delta since then is one commit, 053298f2 (mlr.28: --repair-check (iii) compares the Confirmed findings occurrence count with the verdict header's `(n confirmed)` count, 0 for `clean (n nits)`, and drops the mlr.27 (iv) fold rejection), touching only skills/super-code/scripts/report-verdict and tests/super-code/test-report-verdict.sh; the rest of the delta is run bookkeeping under docs/superpowers/runs/2026-10-28-review-continuity-followups/ (design §4.1(c) amendment for redesign code cycle 2, round-4 roast report, ledgers, run.md). I inspected all report-verdict hunks and the test hunk that holds the --repair-check cases at head in a review-owned detached worktree, and read the amended design §4.1(c) text and skills/super-roast/SKILL.md:229-239 (the only --repair-check caller).

Evidence gathered at head:
- tests/super-code/test-report-verdict.sh: all tests passed.
- Red phase reconstructed: the head test file run against the pre-fix script (4f617f6b) fails exactly the new cases (template-shaped stranded finding marked once, header count 3, clean header with a Confirmed finding, verdict with no count, folded-second-finding stderr), so the tests guard the change.
- The new (iii) count rule run against every `super-roast verdict:` report under docs/ that passes --complete: all 7 roast reports of this run (design 1-3, PR 1-4) satisfy it, including iteration 2-4 reports whose prior-finding tracking lives in a separate `## Prior report tracking` section. Mismatches appear only in older-format reports (2026-10-15 run, which listed resolved prior findings inside Confirmed findings) and copied test fixtures; for those the rule fails safe (the original stands and a friction line is written).

## Spec check (own view)

- mlr.28 implements amended design §4.1(c) check (iii) as written: verdict line read from the --complete JSON, `(\d+) confirmed` or `clean (\d+ nits?)` required, occurrence count compared before the key comparison; (ii) keeps the verdict line byte-identical, so the count ties the repair to the original.
- The round-4 Must-fix (report-verdict:298, mlr.27 rule rejecting every multi-line stranded confirmed-finding repair) is resolved: the rule is gone, and the template-shaped case (finding plus verdict/evidence/fix-shape continuation lines) now repairs with exit 0.
- The round-3 fold case (two consecutive unmarked confirmed findings, only the first marked) is still rejected, now by (iii) `confirmed finding count 1 differs from verdict 2`.
- Header comment in report-verdict and the design text agree; no stale "unmarked line becomes a continuation" wording remains in skills/ or tests/.
- Residual (accepted by design §4.1(a)): --complete itself still folds an unindented `[SEV] ...` line written after an open item into that item, even after a blank line, with no key of its own; the original then passes --complete, so --repair-check is never reached and the header-count invariant is not applied. Verified at head and identical on base. The design names this an accepted residual guarded by the producer rule; applying the same roast header-count comparison inside --complete would close it cheaply, which is a follow-up rather than a landing blocker.

## Findings

- none new in the inspected scope.

## Ledger triage

No parked findings, no Recurring clusters and no BLOCKED-AUTH lines. mlr.28 completed review clean with one minor (deferred): missing red phase. I reconstructed the red phase (see above), so it stays Deferred OK. The earlier minors were triaged by the prior bounded reviews; none names a skipped test, a known product defect or a data-loss path the branch leaves unaddressed. Metrics show a ledger/Git identity gap (git-only ids from earlier epics super-plan-998, -goq, -ufz), so ledger completeness for this epic was not independently established.

## Verdict
not ready (bounded review only: no defects in the mlr.28 delta, but the whole-range review and the full-suite sweep are outstanding)
## Must fix before landing
- none
## Untested scope
- Whole-range review outstanding: installed 6.4.2-alepar6.6 review-inputs reported 2115 provenance gaps (historical run docs/superpowers/runs/2026-10-16-workflow-reliability/, inv-mvc60k41-xt8p35rk04d, incomplete split bundle and missing captured files); none was selected or waived, all unreviewed.
- Full-suite sweep not run: no full-suite measurement of this branch exists yet (deferred to the caller); only tests/super-code/test-report-verdict.sh was executed at the captured head, green.
- Workflow-hosted dryRun of coordinator.js not run in this review.
- Skill and prompt text changes carry prompt-text assertions only; no drill pressure eval evidence was seen, which the project's skill-change rule asks for.
- Drift-check reconciliation depends on the implementer agent running the emitted script and acting on its last line; tests prove the script, not agent compliance.
- Ledger/Git identity metrics gap (git-only ids from earlier epics): ledger completeness for this epic was not independently established.
- In tests/super-code/test-report-verdict.sh, hunk @@ -122,6 +122,28 @@ is unreviewed in this invocation.
- Unreviewed path (no hunk inspected): AGENTS.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-design.md
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
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-3-final-review-keys.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-3-punch-list.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-3-scope-keys.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-3-step-back-keys.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-3-step-back.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-3.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-4-final-review-keys.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-4-step-back-keys.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-4-step-back.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-pr-4.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/amend-code-1-roast.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/amend-code-1.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/amend-code-2.md
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
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/profile-inv-20261028T203458.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/profile-inv-20261028T203458.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/profile-inv-20261028T235807.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/profile-inv-20261028T235807.md
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
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T203458/assembled/final-review-inv-20261028T203458-final/bounded-coverage.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T203458/assembled/final-review-inv-20261028T203458-final/bounded-draft.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T203458/assembled/final-review-inv-20261028T203458-final/diffstat.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T203458/assembled/final-review-inv-20261028T203458-final/generated-input-provenance.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T203458/assembled/final-review-inv-20261028T203458-final/review-inputs.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T203458/final-review-inv-20261028T203458.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T235807/assembled/final-review-inv-20261028T235807-final/bounded-coverage.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T235807/assembled/final-review-inv-20261028T235807-final/bounded-draft.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T235807/assembled/final-review-inv-20261028T235807-final/diffstat.txt
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T235807/assembled/final-review-inv-20261028T235807-final/generated-input-provenance.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T235807/assembled/final-review-inv-20261028T235807-final/review-inputs.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/reviews/inv-20261028T235807/final-review-inv-20261028T235807.md
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/run.md
- Unreviewed path (no hunk inspected): docs/superpowers/specs/INDEX.md
- Unreviewed path (no hunk inspected): evidence/super-plan-1s3/final-run.log
- Unreviewed path (no hunk inspected): evidence/super-plan-mlr.6/summary.log
- Unreviewed path (no hunk inspected): evidence/super-plan-mlr.6/test-assemble-args.sh.log
- Unreviewed path (no hunk inspected): evidence/super-plan-mlr.6/test-contract-lint.sh.log
- Unreviewed path (no hunk inspected): evidence/super-plan-mlr.6/test-report-verdict.sh.log
- Unreviewed path (no hunk inspected): evidence/super-plan-mlr.6/test-scripts.sh.log
- Unreviewed path (no hunk inspected): skills/super-auto/SKILL.md
- Unreviewed path (no hunk inspected): skills/super-auto/run-state.md
- Unreviewed path (no hunk inspected): skills/super-auto/scripts/scope-dispositions
- Unreviewed path (no hunk inspected): skills/super-code/MAINTENANCE.md
- Unreviewed path (no hunk inspected): skills/super-code/coordinator-subagents.md
- Unreviewed path (no hunk inspected): skills/super-code/coordinator-workflow.md
- Unreviewed path (no hunk inspected): skills/super-code/coordinator.js
- Unreviewed path (no hunk inspected): skills/super-code/implementer-prompt.md
- Unreviewed path (no hunk inspected): skills/super-code/scripts/assembly-archive.cjs
- Unreviewed path (no hunk inspected): skills/super-code/scripts/context-pass.mjs
- Unreviewed path (no hunk inspected): skills/super-code/scripts/context-preflight
- Unreviewed path (no hunk inspected): skills/super-code/scripts/dispatch-text.mjs
- Unreviewed path (no hunk inspected): skills/super-code/task-reviewer-prompt.md
- Unreviewed path (no hunk inspected): skills/super-design/SKILL.md
- Unreviewed path (no hunk inspected): skills/super-roast/SKILL.md
- Unreviewed path (no hunk inspected): skills/super-roast/reporter-prompt.md
- Unreviewed path (no hunk inspected): tests/super-auto/review-continuity-e2e.sh
- Unreviewed path (no hunk inspected): tests/super-auto/review-inputs-range-scope.sh
- Unreviewed path (no hunk inspected): tests/super-auto/test-contract-lint.sh
- Unreviewed path (no hunk inspected): tests/super-auto/test-scripts.sh
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/findings-prose-preamble.md
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/mismatched-fence.md
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/narrative-findings-subheadings.md
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/roast-template-shaped.md
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/roast-unverified-nits-prose.md
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/unclosed-fence.md
- Unreviewed path (no hunk inspected): tests/super-code/fixtures/report-verdict/whole-file-rule.md
- Unreviewed path (no hunk inspected): tests/super-code/replay-harness.mjs
- Unreviewed path (no hunk inspected): tests/super-code/test-context-preflight.sh
- Unreviewed path (no hunk inspected): tests/super-code/test-dispatch-text.sh
- Unreviewed path (no hunk inspected): tests/super-code/test-setup-reuse.sh
- Unreviewed path (no hunk inspected): tests/super-roast/test-assemble-args.sh
## Deferred OK
- skills/super-code/scripts/report-verdict --complete: an unindented `[SEV]` line after an open item (even after a blank line) folds into that item with no key, so the roast header-count invariant is never applied; accepted residual per design §4.1(a), pre-existing on base; follow-up: apply the (iii) header-count comparison to roast reports in --complete.
- skills/super-code/scripts/report-verdict --repair-check (iii): an original whose header count disagrees with its own Confirmed findings body (older reporter format listing resolved prior findings there, or a reporter miscount) can never be repaired; fails safe, the original stands with a friction line, and every current-format report of this run satisfies the rule.
- Ledger Task 26 (mlr.28) missing red phase: reconstructed in this review, the new tests fail against the pre-fix script.
- skills/super-code/scripts/report-verdict --repair-check splits its path:tmpfile pairs on the first colon, so a report path containing a colon is misclassified and the repair wrongly rejected (fails safe); no run path carries a colon today.
- skills/super-code/coordinator.js reviewFileFormat(): exit-4 self-repair instruction conflicts with the write guard's never-replace rule; the result is the existing loud extraction gap, never a silent loss.
- skills/super-code/coordinator.js drift script: a current parent with no resolvable branch is treated as landed without the already-merged check; work is preserved and the case is unlikely.
- skills/super-code/scripts/report-verdict --complete and keys_roast: a bullet line inside a fenced block in a recognized section starts a new item; spec-permitted, not a silent drop.
- run.md projection: routed round-1 Should-fix report-verdict:229 (fix bead super-plan-mlr.16, logic replaced by mlr.21) has no finding-disposition and stays outstanding until the caller records a supported one.
- Punch-listed (open) roast items carried through round 4: tests/super-code/test-setup-reuse.sh:26 ambient git identity, tests/super-auto/review-inputs-range-scope.sh:16 gpgsign/hooksPath pin, skills/super-code/dispatch-text.mjs:348 hashing every archived file (pre-existing on base).
- Ledger Task 6 check-ordering (drift check before ALREADY-MERGED CHECK) and prose-dependent drift execution; work is preserved in every branch.
- Ledger Task 22 suite-not-run (Workflow dryRun scenarios); offline replay recorded green, Workflow-hosted run listed as untested scope.
- Ledger Task 2 unquoted review path in the reviewFileFormat() self-check command, reconstructed fixtures, and prompt-text assertion location.
- Ledger Task 14 bare fence toggles in sibling run.md/prompt parsers and its boundary-test gap; Task 17 provenance-sample boundary test; Task 19 trim-only key normalization.
- Ledger Task 16 tests that passed before their fix (disclosed coverage gap, not a skipped test).
- Ledger Task 1 missing edge-case fixtures and fence-state assumption; Task 9 prefix-rule breadth; Task 15 over-broad bold guard (logic since replaced by --classify).
- Ledger Task 8, 10, 11, 12, 13, 20 and 21 items (prose flow, brittle prompt assertions, close-note items, committed evidence logs per existing convention, wording-presence tests, collect interpretation, stray blank line, coarse env check, partial env pins).
