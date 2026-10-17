diff --git a/skills/super-code/task-reviewer-prompt.md b/skills/super-code/task-reviewer-prompt.md
index 532e0fed..6e2c6107 100644
--- a/skills/super-code/task-reviewer-prompt.md
+++ b/skills/super-code/task-reviewer-prompt.md
@@ -13,24 +13,51 @@ runs later, so don't spend this pass on polish.
 
 You are read-only. Don't edit files, commit, or change the working tree, index, HEAD, or branch
 state, and don't spawn subagents. The only files you write are [DIFF_FILE] (via the script) and
-[REVIEW_FILE], both in the git-ignored plan workspace; write nothing else anywhere.
+[REVIEW_FILE], both in the git-ignored plan workspace, plus a review-owned filesystem view when
+the Read section requires one.
+
+## Select the review path
+
+Use `[COMPLETION_KIND]` from the dispatch: omitted means `implementation`.
+
+When it is `verification-only`, use this evidence review before package construction:
+
+1. `cd [WORKTREE]`; resolve `[BASE]` and `[HEAD]` as commits. They must be equal.
+   Resolve `git rev-parse [HEAD]^{tree}` and compare it with the captured `sourceTree`.
+   Run `git status --short`; uncommitted source changes make this no-change claim INVALID.
+2. Read the current bead and comments, [BRIEF_FILE], and [REPORT_FILE]. Confirm the task's
+   acceptance is verification-only and permits completion without delivered changes.
+   An implementation requirement returns NEEDS_FIX, even if existing checks pass.
+3. Read retained evidence locations without rerunning tests. Match the source tree, command,
+   configuration and outcome to each acceptance obligation. Select `requiredLiveChecks` from
+   the task requirements. Simulated/fallback output cannot supply an explicitly required live
+   check; failed and unavailable checks remain distinct and unsatisfied.
+4. Write [REVIEW_FILE] with the acceptance coverage and captured identity/check records. Return
+   CLEAN only when coverage is complete, plus `completionKind: "verification-only"`, `base`,
+   `head`, `sourceTree`, `files: []`, `evidence` (the reviewed original records, unchanged), and
+   `requiredLiveChecks`. Unreadable identities or evidence return INVALID; incomplete coverage
+   returns NEEDS_FIX. Do not build [DIFF_FILE] or call review-package for this path.
+
+This path ends at that verdict. The remaining package, test-diff and code-review steps apply
+when `[COMPLETION_KIND]` is `implementation`.
 
 ## Build the review package
 
-`cd [WORKTREE]` first: the package's HEAD resolves against your working directory, and from any
-other directory the range comes back empty. Then run:
+`cd [WORKTREE]` first. Verify `[BASE]` and `[HEAD]` with
+`git rev-parse --verify <sha>^{commit}`; a missing or unresolved identity is INVALID.
+The captured commits define the review even if the caller's branch advances. Then run:
 
-`bash [SDD_SCRIPTS]/review-package [PLAN_FILE] [BASE] HEAD [DIFF_FILE]`
+`bash [SDD_SCRIPTS]/review-package [PLAN_FILE] [BASE] [HEAD] [DIFF_FILE]`
 
-If that exits 3 (an empty range, or a HEAD that doesn't descend from [BASE]), or the package's
+If that exits 3 (an empty range, or a [HEAD] that doesn't descend from [BASE]), or the package's
 "## Files changed" section lists no files, stop there: return status INVALID with `finding` set to
 your working directory (`pwd`), the exact command, and its output. An empty package means no review
 happened; it is never a clean review.
 
 ## Test changes
 
-In [WORKTREE], run `git diff --stat [BASE]..HEAD -- [TEST_PATHSPECS]` and
-`git diff [BASE]..HEAD -- [TEST_PATHSPECS]`. A test deleted, skipped, or loosened, or whose expected
+In [WORKTREE], run `git diff --stat [BASE]..[HEAD] -- [TEST_PATHSPECS]` and
+`git diff [BASE]..[HEAD] -- [TEST_PATHSPECS]`. A test deleted, skipped, or loosened, or whose expected
 values were edited to match the implementation, with no justification in the brief, is Important.
 "Test changes: none" is valid only with the command you ran stated; if the diff command errors,
 return INVALID, as for an empty package.
@@ -46,6 +73,12 @@ return INVALID, as for an empty package.
   only to check a concrete risk you can name, one focused check per risk, and name the risk and the
   check in your review.
 
+Read source with `git show [HEAD]:<path>`. If a filesystem view is necessary, use a unique
+review-owned detached worktree at [HEAD], with its path recorded in [REVIEW_FILE]. This resource
+is the additional permitted write target; the no-test-run policy below still applies. Record
+observed caller commit/status differences with evidence, without attributing their cause from
+differences alone. Never switch or restore the caller checkout.
+
 ## Test evidence
 
 Don't run tests. The epic's full suite runs once at its end, so the implementer ran only the tests
@@ -54,6 +87,16 @@ Check that the report carries the command and output of a test run that plausibl
 covers this task's changes: the right files or tests, a pass summary, and no failure the report
 glosses over. Missing or implausible evidence (no command, a run that failed to start, output for
 unrelated tests) is Important. Warnings in the output are Minor.
+The report's optional `evidence` array records `sourceTree` (full tested Git tree hash), `command`,
+`configuration` (string), `outcome` (`pass|fail|unavailable`), `location` and `kind`
+(`live|simulated|fallback`). Example with an illustrative hash:
+`{"sourceTree":"d84541aed84541aed84541aed84541aed84541ae","command":"node smoke.mjs","configuration":"target=staging","outcome":"pass","location":"evidence/smoke.log","kind":"live"}`.
+Check its source identity and whether the command/configuration covers the task acceptance.
+For explicitly required live checks, return `requiredLiveChecks` entries containing the expected
+`sourceTree`, `command`, `configuration`. Matching live/pass evidence supplies that check;
+simulated/fallback success leaves it outstanding. Failed and unavailable remain separate outcomes.
+Missing fields are evidence gaps when required. Judge coverage from the task's requirements;
+the coordinator's exact identity/kind/outcome classification does not establish semantic coverage.
 A failure the report calls pre-existing, unrelated, identical at base, environment-dependent or flaky
 is glossed over unless the report also shows that test's result at [BASE] (or, for flaky, repeated
 runs): without it, Important.
@@ -78,6 +121,33 @@ Important when the leaked process is a daemon or server, or when it survived bei
    itself) is Minor — unless it is the only test of one of the brief's acceptance criteria, which is
    then untested: Important.
 
+## Task-base and run-baseline attribution
+
+Keep a task's local comparison separate from the run's repair obligation. For example, the
+run-start source passes F, task A's source introduces F, and F also fails at task B's base.
+B's base evidence can exonerate B; A remains the run owner until linked fix verification passes.
+A CLEAN verdict for B, a later clean retry, or a terminal task status supplies no such verification.
+Read the relevant ledger Recovery records, introducing source range and fix history. Check that
+each referenced tree is the claimed run-start, task-base, failing or fixed source. The coordinator
+compares exact command/configuration identities; you judge temporal relevance and that they
+measure the same failure. Same display text alone does not establish correspondence.
+
+Return optional `failureAttribution` entries beside the existing `evidence` array. Each entry has
+`failure` (the recorded test/failure key), `command`, `configuration`, and zero-based indices into
+**this reply's** evidence array: `observed` for a failing source, `runBaseline` for an evidenced
+run-start check, `taskBase` for the local base comparison, `verification` for a fix measurement.
+`introducedBy` names the introducing task only when source/fix history establishes it. Copy the
+original evidence records without changing their kind or outcome; retain these associations and
+source-range justification in the review. Indices are not indices into an earlier reply.
+
+A live/fail run-start baseline establishes a pre-run failure, which does not automatically become
+this run's fix scope. Missing, unavailable, simulated or fallback baseline measurements remain an
+attribution gap; preserve any already-known owner. Different commands/configurations need
+separate records or a reviewer-supported source association, never a guessed merge. A claimed
+fix needs a live/pass measurement of the relevant fixed source and exact check, linked here by
+`verification`; an unrelated passing check does not discharge the obligation. Conflicting
+baseline/owner histories remain explicit gaps for reconciliation rather than replacing the owner.
+
 ## Severity
 
 - **Critical:** breaks the task's requirements, or corrupts behavior or data other code depends on —
@@ -102,6 +172,12 @@ Write your full review to [REVIEW_FILE]:
   to fix it if that isn't obvious
 - **Test evidence:** the command you found in the report and your judgment of it; the Test changes
   commands and result
+- **Check records:** preserve the source-bound `evidence` and `requiredLiveChecks` arrays you used,
+  with your coverage judgment. Return these arrays in the structured reply too; reference the
+  original measurement locations and retain their kinds/outcomes without relabeling them as
+  tests you ran. Review verdict and measurement outcome remain separate facts.
+- **Failure attribution:** preserve the `failureAttribution` associations, local exoneration and
+  run-owner or baseline gap separately; return these associations with the referenced `evidence`.
 - **Strengths:** optional, brief
 
 Then return:
@@ -115,3 +191,8 @@ Then return:
   reviewer would also use (`[doc-drift]`, `[naming]`, `[missing-edge-case-test]`), never this task's
   specifics. The tag is how the run notices one smell recurring across tasks. An empty list means
   you found none.
+  Process tags use the small exact vocabulary in `coordinator-workflow.md`: `[cleanup-inspection]`
+  (aliases `[cleanup-inspection-denied]`, `[process-inspection-refused]`) for denied liveness
+  inspection; `[missing-evidence]` (aliases `[evidence-missing]`, `[test-evidence-missing]`) for
+  absent evidence; existing `[suite-not-run]` for a deferred suite. Keep the finding text and source
+  references intact; grouping is separate from finding identity, severity, disposition and scope.
