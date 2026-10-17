## Fix pass

Status: FIXED
Task: super-plan-ufz.7
Base: 15084177065dbaaa4eff1992cfb2fbfb56cee5f8
Reviewed implementation head: e1591cca16ce4a4d7f96f865e0ba3fb6e03ea5c6
Fix head: 340d4ef85fbe59dbf55950d3c5e6c44df5d11d28
Tested tree: 4790bbe2d53e9418423b55cc9f9e399ddc6757ec

### Finding and correction

Verified the Important finding against the current bead, brief, retained Recovery history and reducer. A verification-only reply omitted `observed`, so the original guard accepted b/live/pass despite the retained b/live/fail observation for the exact same command/configuration and run-failure identity. The deterministic reproduction retained owner bd-A but incorrectly returned `state:verified` with no contradiction gap, allowing caller qualification to disappear.

The reducer now collects failing source trees only from validated live records linked by observed/runBaseline/taskBase/verification associations for this failure's exact command/configuration. After reducing the complete retained history, it checks every otherwise supported passing verification against these linked failures. A conflicting active verification leaves the owner intact and the obligation open, and records a contradiction gap naming the immutable source tree and verification dispatch. Earlier contradictory attempts remain gaps even after a different supported fixed source verifies the repair. Later associated failure evidence can also reopen a conflicting earlier verification. No automatic repeat-measurement reconciliation was added.

Only skills/super-code/coordinator.js and tests/super-code/replay-harness.mjs changed in this fix. No instruction content, evidence schema, root acceptance rules, ordinary-agent path, run-state fields or integration branch changed. No findings declined or resolved by evidence alone.

### RED/GREEN evidence

All test commands ran from the assigned task worktree:

`/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.7`

Each command used the exact isolation prefix:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.7 HOME=/tmp/sp-bce79baa/super-plan-ufz.7/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.7/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.7/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.7/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.7/state
```

Before the production correction:

```sh
node tests/super-code/replay-harness.mjs > evidence-task7-fix-red.log 2>&1
```

Exit 1, expected behavior failures (not execution errors):

```text
[FAIL] verification-only pass at retained failing source preserves open owner
[FAIL] verification-only same-source contradiction exposes source-bound reconciliation gap
[FAIL] durable clean re-entry retains same-source contradiction and open owner
[FAIL] verification cannot bypass contradictory associated runBaseline outcome
[FAIL] verification cannot bypass contradictory associated taskBase outcome
1974 passed, 5 failed
```

The initial correction passed 1979/0. Self-review then added history-order coverage. Command `node tests/super-code/replay-harness.mjs > evidence-task7-fix-order-red.log 2>&1` exited 1 with:

```text
[FAIL] supported different-source repair retains earlier verification contradiction in history
1980 passed, 1 failed
```

That RED showed the first correction checked only the latest verification and could drop an earlier contradiction gap when a genuinely different fixed source passed. The final correction checks every retained verification and only reopens the currently active conflicting one.

Final exact commands with the isolation prefix above, all exit 0 on the committed tree:

```sh
node tests/super-code/replay-harness.mjs > evidence-task7-fix-replay-final.log 2>&1
bash tests/super-code/test-dispatch-text.sh > evidence-task7-fix-dispatch-final.log 2>&1
bash tests/super-auto/test-scripts.sh > evidence-task7-fix-auto-final.log 2>&1
bash tests/super-auto/test-contract-lint.sh > evidence-task7-fix-lint-final.log 2>&1
```

Relevant final output:

```text
[PASS] verification-only pass at retained failing source preserves open owner
[PASS] verification-only same-source contradiction exposes source-bound reconciliation gap
[PASS] durable clean re-entry retains same-source contradiction and open owner
[PASS] verification cannot bypass contradictory associated runBaseline outcome
[PASS] verification cannot bypass contradictory associated taskBase outcome
[PASS] supported different-source repair retains earlier verification contradiction in history
[PASS] later associated failure reopens contradictory earlier verification
[PASS] linked live fix verification resolves obligation while retaining introducing owner history
[PASS] simulated fix verification cannot resolve live run regression
[PASS] one before/after reply preserves introduction and linked verified fix independently
1981 passed, 0 failed

dispatch-text: all tests passed
All super-auto script tests passed
All super-auto contract lint tests passed
```

The full replay also passed the documented dryRun scenarios with canonical 48, fix-pass-blocked 19 and parked 23 dispatches. Producer/dispatch checks and super-auto caller/reporting/contract suites cover consumers of the returned run state. No existing test expectation was deleted, skipped, loosened or changed. `git diff --check` passed.

Each new behavioral assertion has a concrete failure value: a missing/changed owner or `state:verified` for contradictory evidence; an absent source-specific contradiction gap; a clean durable retry losing owner/open/gap; an associated baseline/task-base conflict silently verifying; a valid different-source repair failing to verify or dropping the earlier contradiction gap; or a later associated failure leaving earlier verification closed. The two added no-throw checks fail on reducer execution errors. All assertions executed in the final run.

### Test hygiene

Every completed test run (initial RED, first GREEN, history-order RED, final replay, dispatch, super-auto scripts, contract lint) was followed sequentially by the mandated `stop-run-processes --check` command. All seven checks exited 0 with empty output: no match line, leaked process or survivor. Final `stop-run-processes` also exited 0 with empty output. Checks and final stop ran from `/Users/alepar/AleCode/superpowers`, outside the owned task/temp roots, targeting only the assigned task worktree and `/tmp/sp-bce79baa/super-plan-ufz.7`. No processes needed stopping. Scratch output is removed after preserving relevant evidence here.

### Assumptions and concerns

Read current `bd show super-plan-ufz.7 --json` and `bd comments super-plan-ufz.7` before changes. There were no amendments, triage comments or unresolved requirement conflicts. The fix does not presume a historical pass or infer reconciliation of nondeterministic measurements; contradictory immutable-source outcomes remain explicit. All work was in the assigned task worktree, with this report as the sole authorized outside write. No rebase, integration write, merge, tracker mutation, spawned agent or Herdr write occurred. No permission refusals or human actions remain.

These are deterministic simulated Workflow fixtures, including synthetic records labeled live; they establish reducer/caller mechanics, not actual agent behavior or live product measurement. The pending fresh-agent attribution evaluation and whole-run acceptance remain parent-owned and unmeasured by this fix pass.
