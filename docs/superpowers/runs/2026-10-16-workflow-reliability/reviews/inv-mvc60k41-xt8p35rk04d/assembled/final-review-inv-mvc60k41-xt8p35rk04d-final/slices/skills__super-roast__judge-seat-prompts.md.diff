diff --git a/skills/super-roast/judge-seat-prompts.md b/skills/super-roast/judge-seat-prompts.md
index 6db31490..6618d09e 100644
--- a/skills/super-roast/judge-seat-prompts.md
+++ b/skills/super-roast/judge-seat-prompts.md
@@ -146,6 +146,12 @@ the finding is also material against the spec's stated requirements and scope.
 In PR mode, "the spec" means the change under review: the diff, its stated intent
 (PR description / commit messages), and the surrounding repository. "Stated
 requirements" include the repository's own conventions and the change's stated intent.
+
+Use the supplied captured base/head for diffs and `git show <head>:<path>` for source. When
+filesystem access is needed, create a unique review-owned detached worktree at that head. A
+mutable reproduction writes only there and in its own output/temp directory. Record caller
+commit/status changes with evidence, without assigning cause from a before/after difference
+alone; never switch or restore the caller checkout.
 You have repo read access — ground internal claims by reading the actual files, not
 just the diff hunk.
 
