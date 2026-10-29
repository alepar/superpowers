# Final review (bounded) — epic super-plan-mlr, inv-20261028T235807

Captured source: base 444f86b266b2208b612e0e91b0f54762576ff95a, head 4f617f6b534a398a58179d6e8d92193014de04c6 (both verified as commits; caller checkout observed at the same head, status clean, unchanged during this review).

## Scope and method

Bounded captured-source review. review-inputs.json reports status unavailable, sourceAvailable true, wholeRangeReady false, 0 omitted, 117 changed paths, 2115 provenance gaps (all from the historical run docs/superpowers/runs/2026-10-16-workflow-reliability/, inv-mvc60k41-xt8p35rk04d, incomplete split bundle). No whole-range package was built.

The prior bounded final review (inv-20261028T203458, head 487992e1) and code roast round 3 (head b9918d23) covered the product files up to 487992e1. Product delta since then is two commits: c1d11e2e (mlr.26, --repair-check rejects non-roast repairs) and fc134cb2 (mlr.27, --repair-check (iv) rejects an unmarked line folded into a continuation), touching only skills/super-code/scripts/report-verdict and tests/super-code/test-report-verdict.sh. I inspected those two files' changed hunks at head in a detached review worktree, ran tests/super-code/test-report-verdict.sh there (all passed), and probed --repair-check with hand-built roast reports.

## Spec check (own view)

- mlr.26 restores design §4.1(c) "a repair whose kind is not `roast` is rejected"; the only --repair-check caller (skills/super-roast/SKILL.md:236) passes roast reports, so nothing else regresses. Round-3 Nit report-verdict:253 is resolved.
- mlr.27 closes round-3 Nit report-verdict:290 (two consecutive unmarked findings, only the first marked), but the new rule is too broad and regresses the §4.1(c) recovery path, see below.

## Findings

- [Important] skills/super-code/scripts/report-verdict:298 — the mlr.27 rule `ra.role === 'unmarked' && b === a && rb.role === 'continuation'` rejects every marker-only repair of a stranded confirmed finding that has continuation lines, and the reporter template (skills/super-roast/reporter-prompt.md:247-250) gives every confirmed finding three indented continuation lines (verdict:, evidence:, fix-shape hint:). Repro at head: an original whose Confirmed findings body is `[Should-fix] a.sh:1 — first claim (new) [lanes: correctness]` / `  verdict: confirmed (reproduce ✓)` / `  evidence: seats reproduced` (no `- ` marker) fails --complete with exit 4. The correct repair, `- ` on the first line only, passes --complete with exactly one keyed occurrence, but --repair-check exits 4 with `(iv) line 5 unmarked line becomes a continuation:   verdict: confirmed (reproduce ✓)`. Marking every line instead fails (iii). So no marker-only repair can pass. At 487992e1 the same pair was accepted (exit 0). The cause: --classify labels every line after the first unmarked line as `unmarked`, because no item is open, so the indented continuation lines of the stranded finding are indistinguishable from a second stranded finding. Impact: design §4.1(c) says "a stranded confirmed finding can be recovered". For the template shape it now never can be, and the round falls back to the loud `complete extraction unavailable` gap. This fails safe (original stands, nothing silently lost), but it disables the feature's main use case. The suite stays green because every stranded-finding fixture (test-report-verdict.sh:719-728, :801-802) is single-line. Fix shape: limit the new rejection to lines that would be keyed findings themselves (e.g. a roast `[SEV] location` lead in Confirmed findings) or to unindented lines, and add a test that repairs a multi-line template-shaped stranded finding.

## Ledger triage

No parked findings, no Recurring clusters and no BLOCKED-AUTH lines in the ledger. mlr.26 and mlr.27 added no minor (deferred) lines. The earlier minors were triaged by the prior bounded review, and I re-checked that triage against the ledger text. None names a skipped test, a known product defect or a data-loss path that the branch leaves unaddressed, so all stay Deferred OK. Ledger records a human-action note from mlr.26: one unrelated `claude --output-format stream-json` process (pid 57095) was observed in a task worktree and left running; observed, cause not attributed.

## Verdict
not ready (mlr.27 repair-check rule blocks recovery of every multi-line stranded confirmed finding; whole-range review outstanding)
## Must fix before landing
- skills/super-code/scripts/report-verdict:298 (mlr.27): the new (iv) "unmarked line becomes a continuation" rejection blocks every marker-only repair of a stranded confirmed finding with continuation lines (the reporter template's normal shape), regressing design §4.1(c) recovery that 487992e1 accepted; narrow the rule to finding-shaped lines and add a multi-line stranded-finding test.
## Untested scope
- whole-epic review incomplete; bounded inspected hunks only; all remaining hunks and provenance gaps remain unreviewed
- Whole-range review outstanding: installed 6.4.2-alepar6.6 review-inputs reported 2115 provenance gaps (historical run docs/superpowers/runs/2026-10-16-workflow-reliability/, inv-mvc60k41-xt8p35rk04d, incomplete split bundle and missing captured files); none was selected or waived, all unreviewed.
- Full-suite sweep not run: no full-suite measurement of this branch exists yet (deferred to the caller); only tests/super-code/test-report-verdict.sh was executed at the captured head, green.
- Workflow-hosted dryRun of coordinator.js not run in this review.
- Skill and prompt text changes carry prompt-text assertions only; no drill pressure eval evidence was seen, which the project's skill-change rule asks for.
- Drift-check reconciliation depends on the implementer agent running the emitted script and acting on its last line; tests prove the script, not agent compliance.
- Ledger/Git identity metrics gap (git-only ids from earlier epics): ledger completeness for this epic was not independently established.
- In skills/super-code/scripts/report-verdict, only hunks @@ -47,20 +47,45 @@ and @@ -118,42 +144,166 @@ were inspected; hunks @@ -71,7 +96,7 @@, @@ -81,11 +106,11 @@ and @@ -100,6 +125,7 @@ are unreviewed in this invocation.
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
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/profile-inv-20261028T203458.json
- Unreviewed path (no hunk inspected): docs/superpowers/runs/2026-10-28-review-continuity-followups/profile-inv-20261028T203458.md
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
- skills/super-code/scripts/report-verdict --repair-check splits its path:tmpfile pairs on the first colon, so a report path containing a colon is misclassified and the repair wrongly rejected (fails safe); no run path carries a colon today.
- skills/super-code/coordinator.js reviewFileFormat(): exit-4 self-repair instruction conflicts with the write guard's never-replace rule; the result is the existing loud extraction gap, never a silent loss.
- skills/super-code/coordinator.js drift script: a current parent with no resolvable branch is treated as landed without the already-merged check; work is preserved and the case is unlikely.
- skills/super-code/scripts/report-verdict --complete and keys_roast: a bullet line inside a fenced block in a recognized section starts a new item; spec-permitted, not a silent drop.
- run.md projection: routed round-1 Should-fix report-verdict:229 (fix bead super-plan-mlr.16, logic replaced by mlr.21) has no finding-disposition and stays outstanding until the caller records a supported one.
- Ledger Task 6 check-ordering (drift check before ALREADY-MERGED CHECK) and prose-dependent drift execution; work is preserved in every branch.
- Ledger Task 22 suite-not-run (Workflow dryRun scenarios); offline replay recorded green, Workflow-hosted run listed as untested scope.
- Ledger Task 2 unquoted review path in the reviewFileFormat() self-check command, reconstructed fixtures, and prompt-text assertion location.
- Ledger Task 14 bare fence toggles in sibling run.md/prompt parsers and its boundary-test gap; Task 17 provenance-sample boundary test; Task 19 trim-only key normalization.
- Ledger Task 16 tests that passed before their fix (disclosed coverage gap, not a skipped test).
- Ledger Task 1 missing edge-case fixtures and fence-state assumption; Task 9 prefix-rule breadth; Task 15 over-broad bold guard (logic since replaced by --classify).
- Ledger Task 8, 10, 11, 12, 13, 20 and 21 items (prose flow, brittle prompt assertions, close-note items, committed evidence logs per existing convention, wording-presence tests, collect interpretation, stray blank line, coarse env check, partial env pins).
