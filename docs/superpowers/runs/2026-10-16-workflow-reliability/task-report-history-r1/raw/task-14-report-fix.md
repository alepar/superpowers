## Fix pass

Status: FIXED

- Task: super-plan-ufz.8.3
- Original stacked base (retained for --onto integration): 44a0c1896f7b52095d4d77b2580ff34c84974533
- Pre-fix head / RED production revision: 9095b2667b4a05fc4f229a725ab266211bce26f7
- Fixed head: efec33f6c7ceb333d695a5163b9d4987116c2fc7
- Commit: fix(super-auto): preserve producer direct review packages
- Interface changes: none. CLI flags, exit meanings, collection record schema, source identities and outstanding projection remain unchanged.

### Finding and narrow correction

Verified the Important finding against `skills/super-code/coordinator.js` finalReviewPrompt: direct review invokes review-package with `${reviewPath}.diff`, while reviewPath defaults to `final-review-ID.md`. The collector's discovery and hasBundle checks incorrectly expected `final-review-ID.diff`. Both now recognize the actual `final-review-ID.md.diff` filename. No producer, root acceptance, measurement, metric, or disposition logic changed.

The fixture now uses that producer filename. Added behavior checks prove that completion inventories it, repeated collection preserves exact bytes and records, an archive conflict returns 3 without overwriting either archive or source, and repair permits completion. A null/no-work result with only that direct package returns 3, archives the available bytes, records both reconciliation and missing-review gaps, and remains idempotently gapped on replay. Existing interrupted-copy, split-input, source-workspace-removal, immutable source/extraction, retained finding and other gap cases still pass. The new assertions catch an omitted package/inventory, incorrect complete result, overwritten source/destination bytes, lost reconciliation/missing-review gaps, or non-idempotent records; none depend on source-text matching.

Files changed in this fix: `skills/super-auto/scripts/report-status` and `tests/super-auto/test-scripts.sh` (two production suffix substitutions plus producer-shaped regressions).

### RED/GREEN evidence

Used systematic-debugging, test-driven-development (including writing-good-tests), and verification-before-completion. Read the current bead description/acceptance and comments before changing code; no comments, amendments, or unresolved conflicts were present.

Exact test commands, run in the owned task worktree with isolated HOME/XDG state:

```bash
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.3 && env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.3 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/state bash tests/super-auto/test-scripts.sh > .superpowers/task-evidence/super-plan-ufz.8.3/scripts-fix-red.log 2>&1; result=$?; tail -60 .superpowers/task-evidence/super-plan-ufz.8.3/scripts-fix-red.log; exit "$result"
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.3 && env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.3 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/state bash tests/super-auto/test-scripts.sh > .superpowers/task-evidence/super-plan-ufz.8.3/scripts-fix-green.log 2>&1; result=$?; tail -54 .superpowers/task-evidence/super-plan-ufz.8.3/scripts-fix-green.log; exit "$result"
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.3 && env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.3 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/state bash tests/super-auto/test-contract-lint.sh > .superpowers/task-evidence/super-plan-ufz.8.3/contract-fix-green.log 2>&1; result=$?; cat .superpowers/task-evidence/super-plan-ufz.8.3/contract-fix-green.log; exit "$result"
```

RED exited 1 before either production edit, with seven expected assertion failures:

```text
  [FAIL] producer direct package archived byte for byte after replay
  [FAIL] completed collection inventories the producer direct package
  [FAIL] conflicting direct package blocks collection completion
    expected: 3
    got:      0
  [FAIL] null no-work with only the producer direct package remains a gap
    expected: 3
    got:      0
  [FAIL] null result still archives the recoverable direct package
  [FAIL] direct-only null bundle records reconciliation and missing review gaps
  [FAIL] direct-only null gap persists on replay
    expected: 3
    got:      0
7 failure(s)
```

GREEN script run exited 0; relevant output:

```text
  [PASS] collection resumes after interrupted copy
  [PASS] resume replays complete collections
  [PASS] second resume changes no records
  [PASS] producer direct package archived byte for byte after replay
  [PASS] completed collection inventories the producer direct package
  [PASS] conflicting direct package blocks collection completion
  [PASS] conflicting direct package is never overwritten
  [PASS] direct package source is preserved through archive conflict
  [PASS] repaired direct package restores verified completion
  [PASS] split assembled input archived
  [PASS] ready silent retry collected independently
  [PASS] collected producer records validate in predecessor projection
  [PASS] one occurrence per source identity and supported disposition survives ready retry
  [PASS] status exposes historical outstanding findings despite latest ready
  [PASS] settled intent history creates no false collection gaps
  [PASS] verified complete archive survives source workspace removal
  [PASS] null review with no work landed preserves null semantics
  [PASS] null no-work with only the producer direct package remains a gap
  [PASS] null result still archives the recoverable direct package
  [PASS] direct-only null bundle records reconciliation and missing review gaps
  [PASS] direct-only null gap persists on replay
  [PASS] direct-only null replay changes no records
  [PASS] null no-work with a partial bundle remains a gap
  [PASS] unexpected null bundle still retains complete extraction
  [PASS] null result never erases discoverable findings
  [PASS] missing declared direct input blocks collection completion
  [PASS] null required review is a durable evidence gap
  [PASS] status exposes collection gaps
  [PASS] missing required bundle remains pending
  [PASS] conflicting archive is not overwritten on replay
  [PASS] conflicting archive bytes retained for recovery
  [PASS] known inline sources remain valid through collection gap
  [PASS] supported rejected item stays off punch list while active defects stay open
  [PASS] unrelated missing collections remain gaps after local archive repair
  [PASS] repaired collection appends completion after an earlier identical completion
All super-auto script tests passed
```

Contract lint exited 0:

```text
contract lint: live tree
  [PASS] skills/super-auto has no contract problems

contract lint: mutations are caught
  [PASS] a broken § pointer fails
  [PASS] a mislabelled run-state item pointer fails
  [PASS] an unknown worked-example field fails
  [PASS] a worked example missing a codeBuckets bucket fails
  [PASS] a numeric list count fails
  [PASS] a renamed field-table field fails the baseline
  [PASS] I8 without projection fails
  [PASS] report-prompt without the null reviewPath rule fails
  [PASS] unapproved added field still fails
  [PASS] changed legacy line format fails
  [PASS] dropping an approved added field fails
  [PASS] changed approved added format fails

All super-auto contract lint tests passed
```

`git diff --check` passed. Comparing both historical 2bf1d53 fixtures against the original stacked base exited 0. Post-commit `git status --short` was empty. No rebase or merge was performed; the original stack base is retained.

### Fix-pass test hygiene and remaining evaluation

No leaked processes were found after RED, GREEN script, or contract-lint runs: each completed outside-root `stop-run-processes --check` exited 0 with no output. The final `stop-run-processes` stop also exited 0 with no output; no match or survived lines occurred, and no background process was started. The first RED launch could not redirect its log under the sandbox and did not execute tests; the authorized escalation then produced the RED evidence above. An initial leak check from inside the target worktree returned its protective exit 2; rerunning from outside the task roots returned 0 with no output. All completed test runs use the prescribed isolated temp state. No agents were spawned and no Herdr writes were made.

The Minor pending-behavior-eval finding remains deferred to the coordinator as instructed. Fresh-agent post evaluation, integrated after/live-isolation evidence, root acceptance and metric decisions remain coordinator-owned; these deterministic tests make no claim to establish them.
