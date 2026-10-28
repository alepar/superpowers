# Bounded final review: epic super-plan-mlr (review continuity followups)

Integration branch `super-auto/review-continuity-followups`. Captured source: base 444f86b266b2208b612e0e91b0f54762576ff95a, head 776fd88942f70a9805e9379cec2d283407481bc7 (both verified with `git rev-parse --verify <sha>^{commit}`). Invocation inv-20261028T162628; `bind-review-source` succeeded before any write.

## Scope and method

This is a bounded captured-source review, not a whole-range review. The installed 6.4.2-alepar6.6 assembler returned `review-inputs.json` with status unavailable, sourceAvailable true, wholeRangeReady false, 68 changed paths, 0 omitted, and 2115 gaps of the form "incomplete split bundle: missing or non-regular captured file" for historical run payloads (docs/superpowers/runs/2026-10-16-workflow-reliability/...). The failed assembly and the original sidecar were preserved unchanged.

I read the full changed-path inventory (68 paths) and inspected every hunk of the 20 paths listed in bounded-coverage.json: every product script and skill-text path under skills/, AGENTS.md, tests/super-code/replay-harness.mjs and the epic's design spec. The other 48 paths (run-directory artifacts, evidence logs, specs INDEX, and the new and changed test files other than replay-harness.mjs) were not read line by line; they are listed below as unreviewed.

Read-only probes ran in a review-owned detached worktree at the captured head (scratchpad `rv-776fd88`), with outputs in its own scratch directory. The caller checkout was not switched or modified apart from the authorized binding append.

Targeted suites executed at the captured head, all exit 0: tests/super-code/test-report-verdict.sh, tests/super-code/test-context-preflight.sh, tests/super-code/test-setup-reuse.sh, tests/super-auto/review-inputs-range-scope.sh, tests/super-auto/review-continuity-e2e.sh, tests/super-roast/test-assemble-args.sh, tests/super-auto/test-scripts.sh, tests/super-auto/test-contract-lint.sh, tests/super-code/test-dispatch-text.sh, tests/super-code/replay-harness.mjs (2404 passed, 0 failed). This is not the full-suite sweep. The caller runs that after this invocation, and no full-suite measurement of this branch exists yet.

## Spec conformance by issue

2s3 (report format): `reviewFileFormat(file)` now states the whole-file rule and the `report-verdict --complete --source format-check` self-check (repair only on exit 4). The reporter template and the super-roast SKILL.md mirror state the body rule. `--complete` separates exit 4 (grammar) from exit 2 (usage, source id, I/O). `--repair-check` implements checks (i)-(iv). The sibling/sub-heading discriminator is present in both `report-verdict` and `strictDraft`. A probe confirmed that a bold-opened section is ended by an ATX heading and that a shallower ATX sibling ends a deeper-opened section. The fence handling has a regression, described under Must fix below.

rsc (range scoping): the relevance rule and the run-scoped gap sink match §4.2. The sink buffers until both `authenticateOrigins` calls finish, then classifies the buffer. An origin is relevant only through a path-relevant mirror. Claims and saved hashes are skipped for irrelevant runs, which is consistent because archives live under `dirname(run)/reviews/`. A direct check: the branch's own `dispatch-text review-inputs` on this exact range moves the historical problems to `outOfRange` (1430 entries). Only 2 gaps remain, both for this invocation's own pending `review-collection` record at run.md:30, because my probe passed no persisted `--review-run-file` binding. So the bounded route this review is on is an artifact of the installed pre-fix plugin, and the branch appears to remove it.

tco (readiness): there is an Inputs row in super-roast. The code-roast derivation is in super-auto phase 4 and is cited by the post-cap audit. The design-roast rule is in super-design and is cited by the amend design roast. `assemble-args.mjs` already accepts provenance `unknown`, so the design rule's `unknown`/`unknown` value validates.

row (bookkeeping): the `scope-dispositions --project` pass adds `scope-filter decision without finding-route: round <N> <key>` and the `unrouted` metric. The key is used only to detect a missing record, and the pass requires the occurrence's artifact to be a recorded `roast-code:`/`roast-design:` path. Caller instructions for Step 2 and Step 3 and the human-gated `pending human decision:` prefix are present. The cross-reference "§Cap disposition's human-gated rule" resolves to the paragraph under that heading.

v94 (workspace reuse): the drift script matches §4.5. It checks ancestry and stale `stack:` commits, fails typed when the worktree is dirty, rebuilds the base on a detached integration HEAD, and runs `rebase --onto newBase oldBase br`. On a conflict it aborts and restores the branch. Branch-only and worktree-only are explicit cases. test-setup-reuse.sh runs the emitted script against real git.

1s3 (window): `claude_window` mirrors `CLAUDE_WINDOWS` and is used by the explicit-id fallthrough and the same-family alias branch. The bare alias without a settings source stays unknown. The parity test checks the row count and per-row ids.

zhk (commit policy): the implementer's Commit step names the project-rule precedence. The fix pass allows rewording only the task's own unmerged commits. The reviewer reads the instruction files and the full `%B` messages, and grades a violation as Important.

## Ledger triage

The ledger shows 12 merges, all review-clean, 0 parked, 0 fix passes, 1 rebase conflict and 4 seam reviews (cleared). It has no Recurring or BLOCKED-AUTH lines. The Metrics report a ledger/Git identity gap: git-only identities from earlier epics (super-plan-998.*, goq.*, ufz.*) and an empty ledger-only-git list, so the absence of ledger lines there is not read as clean.

Task 1 (mlr.1) [fence-state-global] was graded minor, but it names a product defect. A probe confirmed silent misfiling with exit 0, which base did not do. It moves to Must fix.

Task 6 (v94) [check-ordering] (the drift check runs before the ALREADY-MERGED CHECK): I judge this acceptable for now, with the reasoning recorded under Deferred OK.

## Verdict
not ready (unclosed code fence in a recognized section silently misfiles later sections' items with exit 0; whole-range review and full-suite sweep outstanding)

## Must fix before landing
- [Important] skills/super-code/scripts/report-verdict (--complete loop, `inFence` toggle) and skills/super-code/scripts/assembly-archive.cjs strictDraft (`fence` toggle): an unclosed fence is never reported, so every later heading is hidden and the following sections' items are filed under the section that opened the fence, with exit 0. Reproduced at head: a final review with a "  ```" continuation line under "## Must fix before landing" and no closing fence extracts the "## Untested scope" item as Must fix position 2, swallows "## Deferred OK", and exits 0; base 444f86b files the same item under Untested scope. In a roast report, an unclosed fence in "## Rejected" would refile the "## Escalations (need human)" entries as Rejected, so human-gated items lose their routing. This contradicts the epic goal "extract completely or fail loudly"; ledger minor Task 1 [fence-state-global] was misgraded. Fix: raise a grammar error (exit 4 / thrown strictDraft error) when a fence is still open at end of file, in both copies, with one shared fixture run against both.

## Untested scope
- Whole-range review outstanding: this is a bounded captured-source review (forced not-ready); a whole-range review of 444f86b..776fd88 is still required for acceptance, even though the branch's own review-inputs appears to clear the historical provenance gaps.
- All 2115 provenance gaps recorded in .superpowers/sdd/super-plan-mlr-plan/assembled/final-review-inv-20261028T162628-final/review-inputs.json (historical run payloads under docs/superpowers/runs/2026-10-16-workflow-reliability/, "incomplete split bundle: missing or non-regular captured file") are unreviewed; none was waived or selected.
- Full-suite sweep not run: no full-suite measurement of this branch exists; only the ten targeted suites listed in Scope and method were executed at the captured head.
- coordinator.js changed, and its documented dryRun scenarios and agent counts (coordinator-workflow.md) were not run in this review; replay-harness template-literal count moved 455 to 464 with a recorded reason.
- Skill and prompt text changes (super-auto, super-roast, super-design, implementer and task-reviewer prompts, reporter prompt) have prompt-text assertions only; no drill pressure eval evidence was seen, which the project's skill-change rule asks for.
- Drift-check reconciliation depends on an implementer agent saving and running the emitted script and acting on its last line; test-setup-reuse.sh proves the script, not agent compliance.
- Ledger/Git identity metrics gap (git-only identities from earlier epics) means ledger completeness for this epic was not independently established.
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-1-step-back-keys.txt
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-1-step-back.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-1.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-roast-design-2.md
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
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/findings-overrides-design.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/friction.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-1s3.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-2s3.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-rsc.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-tco-row.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-v94.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/inv-zhk.md
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/rsc-proto.diff
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/investigation/rsc-scenarios.sh
- Unreviewed path: docs/superpowers/runs/2026-10-28-review-continuity-followups/run.md
- Unreviewed path: docs/superpowers/specs/INDEX.md
- Unreviewed path: evidence/super-plan-1s3/final-run.log
- Unreviewed path: evidence/super-plan-mlr.6/summary.log
- Unreviewed path: evidence/super-plan-mlr.6/test-assemble-args.sh.log
- Unreviewed path: evidence/super-plan-mlr.6/test-contract-lint.sh.log
- Unreviewed path: evidence/super-plan-mlr.6/test-report-verdict.sh.log
- Unreviewed path: evidence/super-plan-mlr.6/test-scripts.sh.log
- Unreviewed path (executed, passed): tests/super-auto/review-continuity-e2e.sh
- Unreviewed path (executed, passed): tests/super-auto/review-inputs-range-scope.sh
- Unreviewed path (executed, passed): tests/super-auto/test-contract-lint.sh
- Unreviewed path (executed, passed): tests/super-auto/test-scripts.sh
- Unreviewed path: tests/super-code/fixtures/report-verdict/findings-prose-preamble.md
- Unreviewed path: tests/super-code/fixtures/report-verdict/narrative-findings-subheadings.md
- Unreviewed path: tests/super-code/fixtures/report-verdict/roast-template-shaped.md
- Unreviewed path: tests/super-code/fixtures/report-verdict/roast-unverified-nits-prose.md
- Unreviewed path: tests/super-code/fixtures/report-verdict/whole-file-rule.md
- Unreviewed path (executed, passed): tests/super-code/test-context-preflight.sh
- Unreviewed path (executed, passed): tests/super-code/test-dispatch-text.sh
- Unreviewed path (executed, passed): tests/super-code/test-report-verdict.sh
- Unreviewed path (executed, passed; read only in part): tests/super-code/test-setup-reuse.sh
- Unreviewed path (executed, passed): tests/super-roast/test-assemble-args.sh

## Deferred OK
- Task 6 (v94) [check-ordering] drift check before ALREADY-MERGED CHECK: a landed task's branch is rebased in place and merged --no-ff, so it is an ancestor of integration (no stale `stack:` commits in `$integ..$br`) and its parents have landed (not passed as current parents), so drift is 0 and the check proceeds; residual risk is a hand-landed or partially merged branch, which ends in REBUILT then ALREADY_MERGED or a typed SETUP_FAILED, never data loss; worth one fixture later.
- Task 6 (v94) [prose-dependent-execution] script executed by the agent from prose; a missing parent branch counts as drift and ends SETUP_FAILED with work preserved, which is the safe direction.
- Task 8 (zhk) [prose-flow] "Then, unless step 0 reported stacked," reads awkwardly after the inserted policy sentence; wording only.
- Task 8 (zhk) [brittle-prompt-assertion] exact-string prompt asserts in test-dispatch-text.sh; maintenance cost, not a defect.
- Task 8 (zhk) [close-note-pending] established-vs-inferred producer close note is a closure-time item.
- Task 1 (mlr.1) [missing-edge-case-test] no fixture for ATX ending a bold-opened section or a shallower ATX sibling; probed at head, both behave per §4.1(d); add fixtures with the fence fix.
- Task 9 (mlr.5) [prefix-rule-breadth] (iv) accepts "- " plus any non-list line, including a heading; spec-literal, and checks (i)/(iii) catch boundary changes in practice.
- Task 2 (2s3) [reconstructed-fixtures] fixtures reconstructed from investigation descriptions; acceptable with the originals gone.
- Task 2 (2s3) [unquoted-path] coordinator.js reviewFileFormat interpolates the review path unquoted into the self-check command; current workspace paths contain no spaces, but quoting it is a one-character follow-up.
- Task 2 (2s3) [test-location] prompt-text assertions in test-report-verdict.sh; brief permitted.
- Task 10 (mlr.6) [evidence-logs-committed] evidence/ logs in the tree; base already carries evidence/super-plan-ufz.* directories, so this follows existing repo practice.
- Task 11 (tco) [mirror-text-test] contract tests mostly assert wording; assemble-args transport is the behavioral check.
- Task 11 (tco) [doc-drift] post-cap audit cites "as in phase 4"; indirect but correct.
- Task 12 (mlr.3) [behavior-test-text-independent] projection test independent of the new SKILL.md text; text covered by lint only.
- Task 13 (mlr.4) [roast-collect-interpretation] e2e asserts pointer plus finding-source retention rather than report-status --collect of roast reports; matches what collect actually handles.
- Task 13 (mlr.4) [close-note-unverified-mapping] close-note test mapping derived from changed files; closure-time documentation.
- Own observation: scope-dispositions treats both roast-code/round-N and roast-design/round-N as matching sources for a code scopeFilter-round-N decision, so an equal key in a same-numbered design round could mask an unrouted gap; code and design keys use different location forms, so a collision is unlikely.
