diff --git a/skills/super-roast/SKILL.md b/skills/super-roast/SKILL.md
index ef2b8d18..c5df4189 100644
--- a/skills/super-roast/SKILL.md
+++ b/skills/super-roast/SKILL.md
@@ -72,8 +72,13 @@ and `regression` lane from the prompt files below.
 In PR mode with a stated intent (Inputs), pass `--artifact "<branch@sha> vs <base@sha> — stated intent: <stated intent>"`, the default naming with the stated intent appended; without one, leave `--artifact` off and it defaults to `--inputs`.
 
 1. **Pre-flight** — resolve mode, inputs, and the project's environment profile (blast radius:
-   prototype / internal / production / regulated). PR inputs are the branch diff + working
-   tree, or a PR number resolved via `gh` when `gh` is available and a number was supplied.
+   prototype / internal / production / regulated). For PR source, pass `--repo`, `--base` and
+   `--head` together: the assembler resolves both refs once to verified commit identities and
+   renders all diff/source commands from them. A PR number is resolved via `gh` when available.
+   Supplied `--diff-stat` patch data remains supported; repository reads require captured commits.
+   Filesystem views and mutable reproductions use unique review-owned detached worktrees at the
+   captured head plus separate output/temp directories. Record caller commit/status differences
+   with evidence, without assigning cause from differences alone; never switch or restore it.
    Profile is auto-detected and stated in the report header — never asked.
 2. **Triage (sonnet, 1)** — design mode: name 1–3 domains for domain-expert scouts. PR mode:
    activate conditional lanes on top of the always-on core lanes. It runs alongside the core
