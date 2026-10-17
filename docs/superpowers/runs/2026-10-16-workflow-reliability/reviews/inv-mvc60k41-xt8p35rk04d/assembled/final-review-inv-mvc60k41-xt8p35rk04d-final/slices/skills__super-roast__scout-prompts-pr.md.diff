diff --git a/skills/super-roast/scout-prompts-pr.md b/skills/super-roast/scout-prompts-pr.md
index 675b2b15..9e455d51 100644
--- a/skills/super-roast/scout-prompts-pr.md
+++ b/skills/super-roast/scout-prompts-pr.md
@@ -22,6 +22,12 @@ You are an adversarial PR reviewer. Your stance: **assume this diff has a proble
 it.** Find the strongest objections, not the polite ones. [ITERATION_STANCE]
 
 ## Inputs
+
+The supplied captured base/head commits define all diff and source reads. Use the rendered
+`git diff` and `git show` commands. A filesystem view belongs in a unique review-owned detached
+worktree at the captured head; mutable reproductions also get their own output/temp directory.
+Report observed caller commit/status changes with evidence; differences alone do not identify
+their cause. Never switch or restore the caller checkout.
 - The diff (patch/hunks) under review.
 - Full repo access.
 - The PR description and its comments, when present.
