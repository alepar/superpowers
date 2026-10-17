## Fix pass

Status: FIXED

- Finding: task15-review Important, independent source observations across the bounded ledger retry. Reproduced and fixed; no findings declined or resolved by report evidence alone.
- Original stacked base: `7074121343636addd41f80ef5261de6ffb74ab80` (unchanged).
- Pre-fix head: `c3bfd1f9e3109f136b091f843d270455b367cad9`.
- Committed fix head: `548a0b08d7b02a7fdfcb67f4e6899013b6276b9d`.
- Branch: `task-super-plan-ufz.9`; stacked: true. No rebase, integration mutation, delegation, or Herdr write occurred. The original base remains the coordinator's future `--onto` boundary. Tests exercise this task branch, not a future rebased source.

### Change and self-review

`readLedger` now selects the ledger transport, successful Git landing observation, and successful complete review revision pair independently after its one bounded retry. The retry's successful source is preferred when both attempts succeed. A successful empty Git list is retained, and no failed attempt's `landedError` or `reviewError` is attached to a retained successful source. Review base/head must come together from one successful capture and pass the existing full-commit shape check; opposite partial captures cannot create a review source. Failed ledger/Git/review attempts, including null dispatches, remain labelled source gaps. Finish's `metricsEvidence.gaps` includes those retained observations from both Resume and Finish reads.

Changed files:

- `skills/super-code/coordinator.js`
- `tests/super-code/replay-harness.mjs`

The replay covers ledger recovery and repeated ledger failure independently from Git/review success, failures alternating in both directions, opposite half revision pairs, a partial retry following a complete capture, a complete retry following a partial capture, and a null retry following successful empty Git/review capture. The Git fixture uses `bd-999` so fallback to this invocation's confirmed `bd-101` cannot satisfy the assertion. Review assertions inspect the dispatched immutable capture, rather than merely the presence of response fields. Existing assertions were not changed, removed, skipped or loosened.

### RED/GREEN evidence and final verification

All executable replay runs used this isolated environment after the absolute task-worktree `cd`:

```sh
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.9
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.9 HOME=/tmp/sp-bce79baa/super-plan-ufz.9/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/state node tests/super-code/replay-harness.mjs
```

1. RED, unchanged coordinator, full replay: exit 1, about 99 seconds, `2179 passed, 12 failed`. New assertions reproduced dropped Git/review observations and lost failed-attempt gaps; the existing replay checks stayed green. This initial full run had the partial-review fixtures on the recovered-ledger branch.
2. RED, unchanged coordinator, exact new scenario extracted into a disposable `tests/super-code/.retry-replay.mjs`: same environment prefix followed by `node tests/super-code/.retry-replay.mjs`; exit 1, `26 passed, 13 failed`. Before this focused run, the partial-review fixtures were narrowed to repeated ledger failure so the previous object-spread branch demonstrably fabricated a mixed review pair. Relevant output:

```text
[FAIL] ledger recovers; first Git and review succeed: successful Git source survives without a failed attempt error
[FAIL] ledger recovers; first Git and review succeed: final review uses the complete successful capture
[FAIL] ledger stays unavailable; first Git and review succeed: successful Git source survives without a failed attempt error
[FAIL] both independent sources recover with unavailable ledger: successful Git source survives without a failed attempt error
[FAIL] opposite half pairs: no mixed-attempt review pair
[FAIL] partial retry after complete capture: no mixed-attempt review pair
26 passed, 13 failed
```

3. GREEN, the same exact focused scenario with the production fix: same prefix and `node tests/super-code/.retry-replay.mjs`; exit 0, `39 passed, 0 failed`.
4. Final GREEN, full replay with the final committed source: the full exact command above, exit 0, about 64 seconds. Relevant output:

```text
[PASS] 48 agent dispatches (got 48) — the doc's "Expected dispatch count" arithmetic
[PASS] 19 agent dispatches (got 19)
[PASS] 23 agent dispatches (got 23)
[PASS] ledger recovers; first Git and review succeed: successful Git source survives without a failed attempt error
[PASS] ledger recovers; first Git and review succeed: final review uses the complete successful capture
[PASS] ledger stays unavailable; first Git and review succeed: successful Git source survives without a failed attempt error
[PASS] Git recovers while review fails on retry: final review uses the complete successful capture
[PASS] review recovers while Git fails on retry: successful Git source survives without a failed attempt error
[PASS] both independent sources recover with unavailable ledger: failed source attempts remain qualified gaps
[PASS] opposite half pairs: no mixed-attempt review pair
[PASS] partial retry after complete capture: no mixed-attempt review pair
[PASS] complete retry after partial capture: no mixed-attempt review pair
[PASS] null retry retains successful empty Git observation
[PASS] null retry retains coherent review capture
2191 passed, 0 failed
```

The replay exercises both `readLedger` callers (Resume and Finish), downstream Metrics and final review dispatch, and all three documented dryRun scenarios. Canonical/fix-blocked/parked expected counts stay 48/19/23. No producer script or operative skill prose changed in this fix pass, so the earlier script/contract evidence remains as recorded above. `git diff --check` exited 0 with no output. After commit, `git status --short` was empty and `git merge-base --is-ancestor 7074121343636addd41f80ef5261de6ffb74ab80 HEAD` exited 0. Disposable extraction and scratch logs were removed after their relevant output was recorded here.

### Test hygiene

Completed-run hygiene checks and the final prescribed stop both exited 0 with no output: no leaked matches and no `survived:` lines. They ran from `/Users/alepar/AleCode/superpowers`, outside the two owned roots:

```sh
cd /Users/alepar/AleCode/superpowers
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.9 /tmp/sp-bce79baa/super-plan-ufz.9
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.9 /tmp/sp-bce79baa/super-plan-ufz.9
```

One earlier check was inadvertently started before the full RED replay had completed. It listed active replay/cleanup-fixture processes, PIDs 16249, 16268, 31386, 31552, 31615, 31762, 31764, 31765, 31766 and 31793. That scan was not a post-run leak result. The replay and its fixtures completed naturally; after completion, the prescribed check found none. The focused extraction itself starts no external subprocess. No server, daemon or watcher was started by this fix pass, and no test was terminated before its verdict.

### Assumptions, amendments and concerns

Read current `bd show super-plan-ufz.9 --json` and `bd comments super-plan-ufz.9` before changing anything: no amendments or comments change the requirements. The review finding agrees with the independent supported-partial-results contract. No additional behavior or workflow policy was introduced. Coordinator-owned fresh-agent interpretation evaluation remains outside this deterministic fix, as already recorded above. No new concerns.
