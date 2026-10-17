diff --git a/skills/super-code/implementer-prompt.md b/skills/super-code/implementer-prompt.md
index bd2b4b10..7a212997 100644
--- a/skills/super-code/implementer-prompt.md
+++ b/skills/super-code/implementer-prompt.md
@@ -16,7 +16,7 @@ initial implementation ("## Your job") or a fix ("## Fix pass").
 No one can answer questions during this run; the coordinator reads only your final report. When
 the requirements are ambiguous, check the current bead, brief, comments, and existing code, then
 implement the reading they best support and record the assumption under "Assumptions" in your
-report. Keep going until the work is done, tested and committed.
+report. Keep going until the work is done, tested and reported under its Completion kind below.
 
 Report BLOCKED only when the task cannot be completed as specified: something it needs is missing
 (a dependency, an interface an earlier task was meant to provide), the plan contradicts itself or
@@ -68,7 +68,7 @@ Work in [WORKTREE] (branch `[BRANCH]`, cut from `[INTEGRATION_BRANCH]`).
    under the temp-state rule and the leak check your dispatch gives as PROCESSES AND TEMP STATE.
 4. Self-review your diff against the brief (see "Self-review"), fix what you find, and re-run the
    relevant tests if you changed anything.
-5. Commit (see "Commit"), then write the report and return.
+5. Select the completion kind below, then write the report and return.
 
 ## Scope
 
@@ -116,6 +116,20 @@ Re-read your diff against the brief: every requirement implemented, nothing extr
 patterns followed, and tests that cover the acceptance criteria and the task's edge cases by
 exercising real behavior rather than mocks.
 
+## Completion kind
+
+If the current task acceptance explicitly permits verification without delivered changes and
+all required checks pass on unchanged, clean source, return `status: IMPLEMENTED` with
+`completionKind: "verification-only"`, `files: []`, the equal captured `base` and `head`, and
+`sourceTree` from `git rev-parse HEAD^{tree}`. Retain the source-bound `evidence` and
+`requiredLiveChecks` in the report and reply. Explain which acceptance obligations permit this
+completion. Make no artificial commit and do not rebase the tested source after capture. The
+independent reviewer must confirm the task intent, source identity and acceptance coverage
+before the coordinator closes the task.
+
+If acceptance requires delivered changes, use `completionKind: "implementation"` (the default)
+and the Commit steps below. Passing existing checks alone does not supply delivered changes.
+
 ## Commit
 
 COMMIT IS THE LAST STEP. Commit on `[BRANCH]` in [WORKTREE]. Then, unless step 0 reported stacked,
@@ -127,7 +141,7 @@ your final run for the report; fix and commit anything it shows. Your base is no
 `git merge-base [INTEGRATION_BRANCH] HEAD`; report that. A stacked branch is never rebased here: it
 carries its parents' unmerged commits, and its merge replays only its own. Then `git status --short`
 must come back empty (commit anything it lists that belongs to this task). Then
-`git rev-parse HEAD` is the `head` you report. A head equal to the base you report means nothing was committed; the coordinator checks this,
+`git rev-parse HEAD` is the `head` you report. For implementation completion, a head equal to the base you report means nothing was committed; the coordinator checks this,
 and uncommitted work is never reviewed or merged.
 
 ## Blocked
@@ -146,6 +160,19 @@ workspace, which is where the reviewer reads it; don't write a copy anywhere els
 - What you implemented (or attempted, if blocked)
 - Tests: the exact command of your final run and its output (the relevant excerpt, including the
   summary line). The reviewer does not re-run tests, so this is the task's only test evidence.
+- `evidence`: retain source-bound check records in the report and return the same array in the
+  structured reply. Each record carries `sourceTree` (the full tested Git tree hash), `command`,
+  `configuration` (a concrete string; `default` when no options apply), `outcome`
+  (`pass|fail|unavailable`), `location` (the retained output path), and `kind`
+  (`live|simulated|fallback`). Example with an illustrative hash:
+  `{"sourceTree":"d84541aed84541aed84541aed84541aed84541ae","command":"node smoke.mjs","configuration":"target=staging","outcome":"pass","location":"evidence/smoke.log","kind":"live"}`.
+  `git rev-parse HEAD^{tree}` identifies clean committed source. For dirty source, use a temporary
+  Git index under your authorized temp root to snapshot the tested inputs with `git write-tree`;
+  retain the capture commands and include relevant untracked inputs. Preserve the real index.
+  Keep failed and unavailable required checks as those outcomes. For explicitly required live
+  checks, return `requiredLiveChecks` entries with `sourceTree`, `command`, `configuration`; the
+  reviewer judges their coverage. These optional fields add no tests or phases. Their absence is
+  an evidence gap when the task requires them.
 - TDD evidence, when the brief required TDD: the RED command, its failing output and why that
   failure was expected; the GREEN command and its passing output
 - Files changed
@@ -156,7 +183,8 @@ workspace, which is where the reviewer reads it; don't write a copy anywhere els
 
 Then return: `id`, `status` (IMPLEMENTED or BLOCKED, or BLOCKED_AUTH per your dispatch's
 permission rule), `files` touched, `base` (from step 0, or after the rebase in "Commit"), `head`, `stacked` / `reopened` when step 0
-reported them, and `blockerBead` when BLOCKED.
+reported them, `blockerBead` when BLOCKED, the `completionKind` (and `sourceTree` for verification-only), and the report's optional `evidence` and
+`requiredLiveChecks` arrays.
 
 ## Fix pass
 
@@ -189,4 +217,5 @@ too.
 
 Return: `id`, `status` FIXED (or BLOCKED / BLOCKED_AUTH), `head`, `declined`: one line per
 declined finding with its reason (omit it when you declined nothing), and `evidenceOnly`: one line
-per finding resolved in the report alone (omit it when there is none).
+per finding resolved in the report alone (omit it when there is none), plus the fix report's
+optional `evidence` and `requiredLiveChecks` arrays.
