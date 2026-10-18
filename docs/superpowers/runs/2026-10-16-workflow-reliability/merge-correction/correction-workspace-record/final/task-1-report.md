# Task 1 implementation report

Status: DONE (implementation and self-review); fresh independent spec and quality review remain parent-owned gates.

Commit: `ff5b1304110845f01ec0b0c82aa84b0d4da40a61` — `fix(super-code): release verification slot during parent settlement`.
Base: `ab8cff3ee089336896a206c8d9c00167f7c71e1c` on `super-auto/workflow-reliability`.
Worktree: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers`.

## Scope and source identities

Only committed files:

- `skills/super-code/coordinator.js`: GREEN Git blob `0698a0ad3da9b7dae19429300196d1d2286b3e5a`.
- `tests/super-code/replay-harness.mjs`: GREEN Git blob `294cce0d3c9515763582fba1e74583a35647d534`.

RED coordinator blob was `92a654c834e6a348f6fcdb92cef438a806d12982`. Read-only comparison confirmed this exact blob at both ab8cff3e and the correction baseline c4c9bf712a0010346bbea0c020f8070d121d597c. No historical evidence was rebound to corrected source.

## Root cause and correction

Read plan/spec Global Constraints and retained judge-1 reproduce/refute/ground probes. They agree with the observed scheduler cycle: a CLEAN verification-only child awaited `parentsMerged` while retaining its scheduler slot. A failed parent merge routes failure settlement through `withSlot`, so concurrency=1 prevented `failAttempt` from resolving the parent's merge promise and cancelling the child.

Stacked verification children now release their slot before waiting for their captured parent attempts. A failed/cancelled parent uses `abandon(att, false)`, which acquires its cleanup slot itself. Successful parent settlement reacquires the child slot, rechecks cancellation and `admissionReason`, then records reviewed evidence and closes. The existing slot finalizer releases only a held slot. Unstacked verification completion retains its existing path. No required-evidence validation or dependency ordering was weakened.

## RED/GREEN commands and results

All replay commands ran from the isolated worktree above.

1. RED: `node tests/super-code/replay-harness.mjs --verification-parent-settlement` against the original coordinator blob: exit 1, **22 passed, 5 failed**. The cap=1 failed-parent/verification-child case reached both child review and parent merge return, then hit the bounded 1000ms deadlock detector without reopen, triage or discard. The ordinary-child, successful-parent and cap=2 controls all passed. Production code was untouched until this expected failure was observed.
2. Initial GREEN, same command after lifecycle correction: exit 0, **27 passed, 0 failed**.
3. Final focused GREEN, same command after adding capacity/admission controls: exit 0, **37 passed, 0 failed**. The added controls prove another task uses the released slot, closure waits to reacquire capacity, and a merge hold established during that wait prevents completion with an explicit admission reason.
4. Sandbox full replay: `node tests/super-code/replay-harness.mjs > /private/tmp/superpowers-task1-full-replay.log 2>&1`: exit 1 because the existing process-helper fixture could not inspect owned fixture PID44695 under the sandbox. Exact error: `process inspection unavailable for fixture PID 44695`. This is retained environment-limited evidence, not a product pass.
5. Approved full replay outside sandbox, with CLI-only prefix rule `["node","tests/super-code/replay-harness.mjs"]`: `node tests/super-code/replay-harness.mjs > /private/tmp/superpowers-task1-full-replay-approved.log 2>&1`: exit 0, **2366 passed, 0 failed**. This is the prior2329 assertion baseline plus37 new assertions; includes existing recorded dryRun replay scenarios and process-helper tests.
6. `git diff --check` and staged `git diff --cached --check`: exit 0, no whitespace errors. Staged diff contained only the two owned files.

The regression uses runtime dispatch barriers plus a full event-loop turn to force the child to wait before the parent result; 1000ms is a bounded watchdog, not a scheduling sleep or inflated existing timeout. Assertions cover actual coordinator outcomes, task buckets, closure/discard dispatches, preserved evidence, cancellation ledger and hidden chain failures.

## Self-review and limits

Reviewed balanced acquire/release paths for parent failure, successful reacquisition, cancellation at both boundaries and admission hold. Reacquisition cannot close outside the task cap; a hold retains work and withholds the verification completion. Source-bound evidence requirements remain enforced by existing review/verification contracts and the full suite.

These are in-process Workflow replays with canned external agents, not hosted/live Workflow evidence. No instruction or policy content changed in this task. Root acceptance, remaining tasks, live measurements, independent reviews and human gates remain independently outstanding. No push, release, root closure, policy repin, waiver, branch switch, main write, subagent spawn or Herdr mutation occurred. Parent-owned untracked `docs/superpowers/runs/2026-10-16-workflow-reliability/merge-correction/` artifacts were left untouched.


## Task 1 fix round 1 — fresh external/opaque admission after reacquisition

Status: DONE (implementation and self-review); parent-owned fresh scoped independent re-review remains required. This is Task1 correction round1/5 and does not reset any original run policy/cap or erase the failed review.

Independent spec+quality review `/private/tmp/ufz-correction-task1-review.md` found an Important remaining admission defect in ff5b1304: the new reacquisition checked cached `admissionReason` without applying initial dispatch's external/opaque observation refresh. Its retained probe `/private/tmp/ufz-task1-external-gate-probe/tests/super-code/replay-harness.mjs` observed a gate changing from closed to open while another task occupied capacity, yet the verification child closed after only one lookup. The review was read fully when available; its finding was verified with new tests before this correction.

Commit: `f8f2fee8d9209337feeb09d9888196adbb16819f` — `fix(super-code): refresh tracker admission on verification reacquisition`.
Parent/source: `ff5b1304110845f01ec0b0c82aa84b0d4da40a61`.
Only owned coordinator and replay-harness files were committed. Concurrent collection-worker edits were left untouched.

The existing observation refresh and admission decision now live in one shared `admitAfterCapacity(id, waited)` helper. Initial acquisition retains its original dispatched-reservation cleanup; verification reacquisition preserves the scheduler's actual `waited` result and invokes the same helper before any completion basis or closure. Query budgets and start gates still require an observationSeq advance; a null/unavailable dependency lookup invalidates cached readiness through the existing producer. Opaque tracker readiness uses the same shared policy. No duplicate tracker-refresh implementation was introduced.

Exact verification, from the same isolated worktree:

- RED: `node tests/super-code/replay-harness.mjs --verification-parent-settlement > /private/tmp/superpowers-task1-review-red.log 2>&1`, exit1: **54 passed,12 failed**. The original coordinator blob `0698a0ad3da9b7dae19429300196d1d2286b3e5a` passed prior controls but incorrectly closed children under reopened/unavailable/exhausted/opaque tracker conditions; the fresh-closed positive control exposed the missing second lookup. Raw log retained.
- GREEN: `node tests/super-code/replay-harness.mjs --verification-parent-settlement > /private/tmp/superpowers-task1-review-green.log 2>&1`, exit0: **66 passed,0 failed**. Eleven scenarios include the original parent-failure/capacity/merge-hold controls plus reopened external gate, unavailable fresh lookup, exhausted lookup budget, changed opaque readiness and a fresh-closed positive control. Watchdog remains1000ms; observations are forced with dispatch barriers/event-loop turns.
- Full replay with the preapproved CLI-only unsandboxed Node rule: `node tests/super-code/replay-harness.mjs > /private/tmp/superpowers-task1-review-full-green.log 2>&1`, exit0: **2395 passed,0 failed**. This rerun was warranted by changing the shared initial-admission path as well as verification reacquisition.
- `git diff --check` and `git diff --cached --check`: exit0. Staged/committed diff contained only the two owned files.

Verified GREEN Git blobs: coordinator `1d6c710f943c4f52c65cba9373f2bfb958417b5d`; replay harness `ed4527e7f59790fd323d8cc5e30fe020d3475b79`. The complete replay tested those source blobs; concurrent collection changes are outside this task's verified scope.

Self-review confirmed both callers use one bounded refresh policy, failed refreshes cannot use old gate observations, opaque holds withhold closure, released/reacquired slots remain balanced, and prior failed-parent cancellation/evidence controls still pass. No remaining known Task1 implementation concern; this does not stand in for independent re-review, hosted/live Workflow evidence or root acceptance. Original sandbox-limited and independent-failed-review evidence remain intact. No push/release, main/Herdr mutation, subagent spawn, historical rewrite, waiver or policy reset occurred.
