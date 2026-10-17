Status: IMPLEMENTED

# Legacy interpretation adapter

Adapter-only synthetic labels and item boundaries. Exact raw source, original headings, complete passages, line/byte locators and interpretation limits are recorded in the hash-bound metadata. This document proposes history representation and makes no acceptance, identity-link or resolution decision.

## Concerns — adapter/scope-or-coverage-qualification/raw-section-2/raw-byte-000001614

- Other persisted holds and explicitly scoped deferred obligations gate admission for the affected task and its consumers. `merge-lane` holds all admission; task holds can name their task via ID or `data.taskId`; scoped hold/deferred records can use `data.affectedIds`. Unrelated eligible work continues, and unresolved restored admission obligations return `recovery-held`. Unscoped caller-owned sweeps and additive `data.runFailure` diagnostics remain visible obligations without automatic generic repair routing.

## Concerns — adapter/scope-or-coverage-qualification/raw-section-3/raw-byte-000003572

- Generated reconciliation hold data includes `taskId`, `recoveryId`, and the current observation when available. Existing holds/deferred obligations have no universal automatic release condition; their owner supplies an explicit matching clear with evidence. Only `resume:<task>` holds are automatically cleared by successful fresh reconciliation. Unknown/additive record fields survive decoding and pending-closure updates. Task 7's `deferred.data.runFailure` diagnostic contract remains intact and does not create generic mandatory repair work.

## Findings — adapter/historical-defect-assertion/raw-section-4/raw-byte-000005758

- Additional interrupted-clear RED:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 node tests/super-code/replay-harness.mjs > evidence-task12-durability-red.log 2>&1
```

Exit 1:

```text
[FAIL] unconfirmed recovery clear append remains unresolved after writer drain
2010 passed, 1 failed
```

Expected failure: the initial implementation cleared the in-memory obligation before its append was confirmed. Combined clear/completion appending with confirmation before reduction fixed this. GREEN: `2011 passed, 0 failed`.

## Findings — adapter/historical-defect-assertion/raw-section-4/raw-byte-000006279

- Additional incomplete-observation RED:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 node tests/super-code/replay-harness.mjs > evidence-task12-incomplete-red.log 2>&1
```

Exit 1:

```text
[FAIL] run completes without throwing
TypeError: Cannot read properties of undefined (reading 'includes')
[FAIL] recovery observation is bounded to one attempt with explicit held stop
[FAIL] unresolved recovery preserves additive record data
[FAIL] Git/tracker discrepancy or unavailable status remains explicit
2014 passed, 4 failed
```

Expected failure: a reply missing its closed-status array was not safely classified as unknown. Explicit array guards fixed it. GREEN before rebase: `2018 passed, 0 failed`.

## Concerns — adapter/pending-obligation/raw-section-8/raw-byte-000010014

- Current task description/acceptance and frozen brief agree; `bd comments super-plan-ufz.12` returned no comments, so no amendments were applied. Caller-owned sweep deferrals remain caller-owned; they do not hold arbitrary unrelated rows. Explicit task/affected-ID scope is used for deferred admission gates. Existing owner holds are never inferred resolved from silence or missing branches. Legacy Task-only replay behavior is retained; active additive Recovery facts supply the new reconciliation gates. Parent owns fresh-agent resume behavior evaluation, as the brief explicitly states.

## Concerns — adapter/pending-obligation/raw-section-9/raw-byte-000010617

- No deterministic task-local failure remains. Fresh-agent live evaluation of the ordinary resume instructions is pending with the parent coordinator; these simulated replay/prompt checks do not claim to measure agent compliance. Suggested parent scenarios are the new `recovery resume: durable landing reconciles before admission and closure is idempotent` and `recovery resume: durable scoped holds preserve unrelated eligibility and diagnostic deferrals` cases. No agent or Herdr write was performed by this implementer, and integration was read-only throughout.

## Findings — adapter/historical-defect-assertion/raw-section-10/raw-byte-000011480

- The Important finding is valid. A restored pending-closure with an initially open associated review/blocker took `closeAlreadyMerged` into `confirmClosure`; successful tracker closure immediately reduced recovery state before the buffered task ledger append was confirmed. Null append plus null retry, or an explicit `appended:false`, then returned a completed task with its original recovery record missing.

## Concerns — adapter/pending-obligation/raw-section-12/raw-byte-000015981

- The current bead and comments were read again: no amendments or comments exist, and the task/brief agree. There are no declined or evidence-only findings. Parent-owned fresh-agent evaluation remains pending as stated in the original brief; deterministic replay does not measure agent compliance. Integration was read-only except this explicitly allowed report append. No subagent, Herdr write, acceptance/scheduling expansion, merge, or unrelated edit was performed.

## Findings — adapter/historical-defect-assertion/raw-section-13/raw-byte-000016891

- The finding in `task-11-review-seam.md` is valid. Sibling `97ee30a1` requires a nonempty failure/command/configuration identity, plus task, dispatch, an identity-matching claim and an evidence array for every durable runFailure history event. The task's new diagnostic-deferral fixture lacked configuration and the event fields. `readRecovery` correctly classified it as a gap, so the exact diagnostic-obligation preservation assertion failed for both hold/deferred variants.

## Concerns — adapter/pending-obligation/raw-section-16/raw-byte-000022959

- Read current `bd show super-plan-ufz.12 --json` and `bd comments super-plan-ufz.12` before changes: no amendments, no comments, and current task requirements agree with the brief. The diagnostic remains unscoped and caller-owned, while explicit hold/deferred task scope gates admission; no generic repair or new admission rule was introduced. No declined or evidence-only findings, permission refusals, or task-local unresolved failures. Parent-owned fresh-agent evaluation remains separate from deterministic replay as recorded previously.
