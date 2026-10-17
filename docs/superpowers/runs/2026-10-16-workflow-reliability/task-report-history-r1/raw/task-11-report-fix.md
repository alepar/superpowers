## Fix pass

Status: FIXED. Task: super-plan-ufz.12. Exact task base remains `caf187cef8d1769da6184de42332a31bc7e30dcb`; reviewed implementation head was `26cc469e06bab7b6dad98cb726326f949d1c486f`; verified fix head is `07caa440eac3a501d9a18712344f6f2ede2e06d2`. No rebase or merge was performed.

The Important finding is valid. A restored pending-closure with an initially open associated review/blocker took `closeAlreadyMerged` into `confirmClosure`; successful tracker closure immediately reduced recovery state before the buffered task ledger append was confirmed. Null append plus null retry, or an explicit `appended:false`, then returned a completed task with its original recovery record missing.

The fix defers that reduction for restored pending-closure records. `flushLedger` now returns its existing serialized append promise. The partial-close path buffers clear and completion together, awaits that task append, and only then reduces the obligation and settles completed. Failed or unavailable persistence retains the exact original record, including additive fields and evidence, and sets the existing task-scoped resume hold, yielding `recovery-held`. Fresh closure handling retains its existing ordering. No root acceptance, scheduling, admission policy, record schema, or prompt change was added.

Files changed in the fix commit:

- `skills/super-code/coordinator.js`
- `tests/super-code/replay-harness.mjs`

The additive replay fixture begins with the task closed and its associated review/blocker open, observes successful close/check, then tests null append/retry and `appended:false`. It requires no completed result, a scoped held stop, and the exact original obligation. Each fixture restarts from confirmed durable lines only, observes all associated beads now closed, confirms a durable clear, and verifies no close-only, implementation, review or merge repeat. Existing assertions were not removed, loosened or skipped. Counterexamples caught include no closure check, excess retry, premature completed status, lost/changed obligation fields, duplicate restart repair/implementation, and missing successful restart settlement.

### RED/GREEN evidence

Commands ran in the assigned task worktree, with the assigned temporary root. RED ran after adding the fixture and before production edits:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 node tests/super-code/replay-harness.mjs > evidence-task12-fix-red.log 2>&1
```

Exit 1, expected assertion failures in each persistence-failure variant:

```text
[FAIL] failed partial-close append holds recovery instead of reporting completed
[FAIL] failed partial-close append retains the exact original obligation
[FAIL] failed partial-close append holds recovery instead of reporting completed
[FAIL] failed partial-close append retains the exact original obligation
2086 passed, 4 failed
```

Final GREEN and caller regression commands:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 node tests/super-code/replay-harness.mjs > evidence-task12-fix-green.log 2>&1
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 bash tests/super-code/test-dispatch-text.sh > evidence-task12-fix-dispatch.log 2>&1
git diff --check
```

All exited 0. Relevant output:

```text
[PASS] failed partial-close append holds recovery instead of reporting completed
[PASS] failed partial-close append retains the exact original obligation
[PASS] restart after failed partial-close append observes facts without repeating closure or implementation
[PASS] restart settles partial closure after its durable clear is confirmed
2090 passed, 0 failed
[PASS] the help's kinds all parse (missing: none)
dispatch-text: all tests passed
```

Both failure variants pass these assertions. The full replay run covers `confirmClosure`, both `closeAlreadyMerged` re-entry routes and their callers, and the existing buffered-ledger callers; dispatch-text supplies the existing prompt-builder regression. No narrower replay filter is available. Neither command exceeded a few minutes. Task-local logs were removed after recording their commands and relevant output here.

### Test hygiene, assumptions and concerns

Completed-run `stop-run-processes --check` checks after RED, GREEN and dispatch regression exited 0 with empty output: no leaked process. An initial hygiene invocation from inside the task root was refused by the script's own working-directory guard (exit 2); repeating from outside the checked roots succeeded. A first sandboxed RED invocation could not create its task-local output log and did not run the harness; approved task-local escalation then ran it to the RED verdict above. These are command/setup failures, not test verdicts. The final stop/check commands produced no `match:`, `stopped:` or `survived:` lines. No background process remains.

The current bead and comments were read again: no amendments or comments exist, and the task/brief agree. There are no declined or evidence-only findings. Parent-owned fresh-agent evaluation remains pending as stated in the original brief; deterministic replay does not measure agent compliance. Integration was read-only except this explicitly allowed report append. No subagent, Herdr write, acceptance/scheduling expansion, merge, or unrelated edit was performed.
