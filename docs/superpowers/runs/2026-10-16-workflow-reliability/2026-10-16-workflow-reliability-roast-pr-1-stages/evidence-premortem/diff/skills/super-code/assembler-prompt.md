diff --git a/skills/super-code/assembler-prompt.md b/skills/super-code/assembler-prompt.md
index 28d5638c..341b7c79 100644
--- a/skills/super-code/assembler-prompt.md
+++ b/skills/super-code/assembler-prompt.md
@@ -14,7 +14,10 @@ Parameters: [CONSUMER], [INSTANCE], [OUT_DIR], [WORKTREE], [BASE], [HEAD], [SECT
 `name: definition` line per digest section), [CLUSTERS] (yes or no), [THRESHOLD] (tokens),
 [ASSEMBLED_SIZE] (the size script's command), [LEDGER], [WORKSPACE], [SPEC_PATHS].
 
-1. `cd [WORKTREE]`. Resolve [BASE] if it is a command. Empty the instance directory first:
+1. `cd [WORKTREE]`. Review consumers (`final-review`, `roast-code`) receive captured commit
+   identities as [BASE] and [HEAD]; verify both with `git rev-parse --verify <sha>^{commit}`.
+   Other consumers resolve command-valued inputs once before collecting their data.
+   Empty the instance directory first:
    `rm -rf [OUT_DIR] && mkdir -p [OUT_DIR]/slices`.
 2. `git diff --stat [BASE]..[HEAD] > [OUT_DIR]/diffstat.txt`.
 3. Write `[OUT_DIR]/digest.md` with one `## <name>` heading per [SECTIONS] line, in that order, each
@@ -22,6 +25,7 @@ Parameters: [CONSUMER], [INSTANCE], [OUT_DIR], [WORKTREE], [BASE], [HEAD], [SECT
    nothing gets the line `none`.
 4. Slices: one file per changed source file, `git diff [BASE]..[HEAD] -- <file>` written to
    `[OUT_DIR]/slices/<path with each / replaced by __>.diff`.
+   Open source with `git show [HEAD]:<path>` so a concurrent caller advance cannot change it.
 5. When [CLUSTERS] is yes, group the changed files by import and call edges between them (an edge
    when one changed file imports or calls a symbol another defines), else by top-level directory,
    never by a count of files. Write `[OUT_DIR]/clusters.json`:
