# Task 1 fix round 1 — independent spec and quality re-review

Reviewed 2026-10-17 by GPT-6 Codex review subagent. Reviewed commit `f8f2fee8d9209337feeb09d9888196adbb16819f` against follow-up base `ff5b1304110845f01ec0b0c82aa84b0d4da40a61`. Source reads used pinned `git show` in the supplied isolated worktree; concurrent collection changes were excluded.

## Verdict

**Spec compliance: PASS for the Task 1 follow-up scope.**

**Code quality: PASS. No Critical, Important, or Minor findings identified in the scoped change and relevant adjacent contracts.**

The prior Important finding, stale external/opaque admission after a verification child's capacity wait, is resolved by the shared admission helper and deterministic regression coverage. This verdict does not waive historical findings, root acceptance, live measurements, or human gates.

## Prior finding disposition and source evidence

- `skills/super-code/coordinator.js:1841–1843` now retains the scheduler's `waited` result and passes it into `admitAfterCapacity` before the completion basis is created or closure is dispatched. `makeScheduler.acquire` returns whether actual queuing occurred (`3066–3069`), so this uses the real capacity-wait signal.
- The shared helper (`1723–1733`) refreshes external dependencies and opaque readiness under the same conditions as initial admission. It requires `observationSeq` to advance when a fresh query is needed; budget/start-gate suppression produces a hold, rather than authorizing cached readiness. It then applies `admissionReason`, including merge/recovery/start/quarantine/dependency and opaque holds (`1524–1536`). Initial dispatch uses the same helper at `1747`, retaining its original `dispatched.delete(id)` behavior on refused admission.
- The unchanged refresh producer bounds queries and respects the start gate (`1954–1965`). It clears tracker readiness and replaces every requested external dependency observation, including invalidating prior success after a null/malformed lookup (`1968–1980`). The new verification caller uses this producer directly, so it no longer depends on `topUpHook` noticing a waiting row.
- The regression in `tests/super-code/replay-harness.mjs:458–532` changes tracker state while bd-104 occupies the released slot, then checks that reopened, unavailable, exhausted-budget, and opaque cases do not dispatch closure or claim completion. It checks explicit reasons and lookup counts. The fresh-closed control permits completion after two closed observations. These exercise coordinator outcomes and dispatch ordering, rather than mirroring implementation text.

## Adjacent contracts preserved

- The child still releases its slot before waiting on captured parent-attempt promises (`1839–1840`, `1714–1718`). Failed settlement still calls `abandon(att, false)`, whose cleanup acquires its own slot (`1703–1711`), preserving the original cap=1 deadlock repair.
- Successful settlement reacquires capacity and checks cancellation before admission (`1841–1843`). Both admission refusal and successful completion release exactly the held slot through the existing finalizer (`1862–1864`); an unfinished attempt still settles through `failAttempt` and is removed from `attemptOf` (`1873–1878`).
- Parent capture, failure/cancellation propagation, evidence validation, completion-basis persistence, and closure logic were not changed by this follow-up. No new completion bypass or independently implemented refresh policy was introduced. The original failed-parent, ordinary-child, successful-parent, cap=2, active-capacity, and merge-hold controls remain in the focused suite and pass in the supplied GREEN log.

## Evidence assessed

Read the task brief and full implementation/fix-round report, approved design sections 2 and 3 (including bounded refresh and the explicit absence of a transactional tracker guarantee), original failed review, the complete supplied follow-up diff, and pinned adjacent coordinator/harness contracts. The actual Git diff contains only the two scoped files: 47 insertions and 19 deletions. `git diff --check ff5b1304110845f01ec0b0c82aa84b0d4da40a61 f8f2fee8d9209337feeb09d9888196adbb16819f` passed during this review.

Independently checked pinned blob identities:

- RED coordinator: `0698a0ad3da9b7dae19429300196d1d2286b3e5a`.
- GREEN coordinator: `1d6c710f943c4f52c65cba9373f2bfb958417b5d`.
- GREEN harness: `ed4527e7f59790fd323d8cc5e30fe020d3475b79`.

Inspected the raw focused RED/GREEN logs and counted PASS/FAIL records across all supplied logs, confirming their summaries:

- `/private/tmp/superpowers-task1-review-red.log`: **54 passed, 12 failed**. Failures specifically expose stale closure and missing refresh in the new cases while original controls pass.
- `/private/tmp/superpowers-task1-review-green.log`: **66 passed, 0 failed**.
- `/private/tmp/superpowers-task1-review-full-green.log`: **2395 passed, 0 failed**.

## Limits

The replay logs are retained implementer execution evidence; this re-review independently checked their contents and pinned source identities but did not rerun the focused or broad suites. No concrete unresolved concern warranted another suite run or private probe. These are in-process fixtures with canned agents, not hosted/live Workflow evidence. No source/index/HEAD, Herdr, tracker, push, or release mutation occurred; the only written artifact is this review report. Historical failed review and unavailable evidence remain retained. Root acceptance remains outside this review's authority.
