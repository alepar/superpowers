# Task 1 independent spec and quality review

Reviewed 2026-10-17 by GPT-6 Codex review subagent. Read-only review of commit `ff5b1304110845f01ec0b0c82aa84b0d4da40a61` against `ab8cff3ee089336896a206c8d9c00167f7c71e1c` in the supplied isolated checkout. No source/index/HEAD changes, Herdr writes, subagents, broad-suite reruns, push, or release.

## Verdict

**Spec Compliance: FAIL — one Important admission requirement remains unsatisfied.**

**Code quality: Needs fixes.**

The targeted deadlock is repaired with balanced slot ownership, but the new reacquisition path does not perform the tracker refresh required for external/opaque dependencies after a capacity wait. The current tests cover a local merge hold, not stale external admission.

## Findings

### Important — Verification reacquisition can use a stale external gate observation

**Location:** `skills/super-code/coordinator.js:1835–1838` (pinned reviewed commit).

After `await sched.acquire(id)`, the new path checks cancellation and calls `admissionReason(id)`, but it omits the external/opaque observation refresh performed by the existing initial-acquisition path at lines 1732–1738. `admissionReason` reads cached `externalStatus` and `trackerReady` (lines 1517–1536); it does not query the tracker. A parent settling successfully does not ensure a fresh observation: `topUpHook` can skip the query when all affected rows are already dispatched (`needsBdTopUp` considers waiting rows).

**Concrete reproduction:** an independently constructed fixture derived from the committed capacity-handoff control gives verification child bd-102 dependencies bd-101 and external gate bd-199. The initial gate observation is closed. After the child releases its slot and its parent settles, task bd-104 occupies the only slot and the external gate becomes open. When bd-104 releases capacity, bd-102 reacquires and dispatches `close-only:bd-102` without another gate lookup. The fixture reports it completed. The reliable coordinator-level observation is the erroneous closure dispatch; actual tracker closure may additionally refuse an open blocker, which is not a substitute for the required admission decision.

Exact probe command:

```sh
node /private/tmp/ufz-task1-external-gate-probe/tests/super-code/replay-harness.mjs --verification-parent-settlement
```

Result: exit 1, **4 passed, 1 failed**. Failed assertion: `reopened external gate holds verification closure after capacity reacquisition`. Diagnostic output:

```json
{"gateObservations":["closed"],"gateOpen":true,"completed":["bd-101","bd-103","bd-102"]}
```

Dispatch counts included `bd-ready-topup: 1`, `review:bd-102: 1`, `impl:bd-104: 1`, and `close-only:bd-102: 1`; no admission hold was logged. This was one new targeted probe for a concrete uncovered lifecycle risk, not a rerun of the existing suite. Production coordinator and support files in the temporary mirror were retrieved with `git show` at the pinned commit; only the temporary harness fixture changed.

**Required correction:** preserve whether reacquisition waited and apply the existing fresh external/opaque observation policy before the admission predicate and closure dispatch. If a required fresh observation cannot be obtained, retain the task with a reason. Add a deterministic capacity-wait regression for a reopened external gate (and ensure the shared policy handles opaque rows), while retaining the existing success, parent-failure, and merge-hold controls.

No Critical or Minor findings identified.

## Confirmed properties

- The failed-parent cycle is real: parent merge failure uses `withSlot` before `failAttempt`, while the old verification path awaited the captured parent promise in its occupied slot.
- The new `sched.release(id); slotHeld = false` occurs before `parentsMerged(att)`, releasing the capacity needed by parent failure settlement.
- `parentsMerged` uses captured `parentAttempts`, preserving actual attempt identity. Parent failure routes through `abandon(att, false)`, whose cleanup acquires/releases its own slot through `withSlot`; the outer finalizer does not release that slot again.
- Successful settlement reacquires capacity, sets `slotHeld`, checks cancellation, and checks current local admission holds. Held completion returns through the slot finalizer and attempt-finalization path without producing a verification completion.
- Review/evidence validation remains before this branch in `reviewAndFix`/`verificationProblem`; missing or inconsistent review evidence is not promoted to CLEAN. The change does not bypass parent failure or create an unreviewed completion route.
- The bounded cap=1 regression includes ordinary-child, successful-parent, cap=2, and active-capacity/merge-hold controls. These are meaningful assertions against coordinator outcomes, not source-text mirrors.

## Evidence assessed and limits

Read the supplied task brief, implementation report, full pinned review-package diff, approved design sections 2 and 3, and named adjacent lifecycle functions. All Git source reads used explicit commit identities. The actual commit stat matches the supplied two-file scope: 11 coordinator lines changed and 114 harness lines added.

Independently verified Git blob identities:

- RED coordinator at both ab8cff3e and c4c9bf712a0010346bbea0c020f8070d121d597c: `92a654c834e6a348f6fcdb92cef438a806d12982`.
- GREEN coordinator: `0698a0ad3da9b7dae19429300196d1d2286b3e5a`.
- GREEN harness: `294cce0d3c9515763582fba1e74583a35647d534`.

Inspected `/private/tmp/superpowers-task1-full-replay-approved.log`: its first six new scenarios contain all **37 passing assertions**, and its final summary is **2366 passed, 0 failed**. Inspected `/private/tmp/superpowers-task1-full-replay.log`: it retains the reported `process inspection unavailable for fixture PID 44695` failure. Neither log was regenerated. The report's RED **22/5** and intermediate GREEN **27/0** counts remain implementer-reported execution evidence; raw separate RED/intermediate logs were not supplied or independently executed during this review. Source inspection independently supports the old deadlock mechanism.

These results establish in-process fixture behavior only, not hosted/live Workflow evidence or root acceptance. Existing historical findings, outstanding measurements, reviews and human gates remain independently open as applicable. This review neither resets nor waives them.
