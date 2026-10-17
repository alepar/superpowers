# Task super-plan-ufz.8.2 review

Base: `560a05eb83cdc44013ea528e99854151c2f17d12` (ancestor check passed).
Head: `f38393ed8234df0cfc4c193f2936cae3a48c41a9`.

**Spec compliance:** ✅. Read current bead description/acceptance and comments before the frozen Task 9 brief. No amendments or comments were present. The change adds complete extraction only, with caller-supplied source identity, exact section labels, deterministic section-local positions, duplicate occurrences, uncapped text and continuations, deferred sections and explicit input errors. Archive path is distinct from occurrence identity. Legacy parser branches remain unchanged. Projection, storage and semantic disposition remain outside this task.

**Issues:**
- Critical: none.
- Important: none.
- Minor: none.
- Unverified requirement items: none.

**Test evidence:** The report supplies the full isolated-environment command ending in `bash tests/super-code/test-report-verdict.sh`, run from the task worktree after rebasing onto this base, exit 0. It includes relevant pass output for final-review/roast/task extraction, duplicate positions, continuations, Unicode, archive identity, caps, explicit-empty reviews and malformed inputs, ending `report-verdict: all tests passed`. This plausibly covers the changes. The report also records RED evidence, unchanged legacy assertions, a 26-case stdout/stderr/status compatibility probe against the preimplementation helper, and no leaked processes. No tests were rerun during review.

Test changes commands, both successful, run in the task worktree:

```bash
git diff --stat 560a05eb83cdc44013ea528e99854151c2f17d12..HEAD -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'
git diff 560a05eb83cdc44013ea528e99854151c2f17d12..HEAD -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'
```

Result: one test file, 196 additive lines; no deleted, skipped, loosened or rewritten historical assertions. New expectations specify source values and exercise the real CLI with built-in JSON parsing.

**Focused boundary checks:** Risk: extraction could fail to cover actual source formats or disturb existing recognition/callers. Checked the real final-review and roast fixtures and roast reporter contract against the new relevant-section/parser logic; checked the legacy helper and final-review producer in coordinator.js. The new command reaches the additive branch directly; legacy arguments fall through to unchanged code. A search also named a nonexistent final-review-prompt.md; the actual producer contract was found in coordinator.js and inspected. New consumer integration belongs to downstream .8.4, not this extraction task.

**Strengths:** A separate mode preserves existing compact consumers while giving downstream work a small provenance-preserving JSON interface.
