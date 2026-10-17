# Runtime/contracts partition review

Assessment: **with fixes within this partition**. Two Important admission defects reproduced on the pinned runtime; one Minor entrypoint-contract mismatch. This is one partition of the composed whole-branch review, not an independent merge-readiness judgment.

## Source and checked coverage

- Base: `832b051c870ae5c69adfa7f14d770292ab6c1a81`.
- Reviewed source head: `7b18b0c26b9f19d531c558e112d490743901a13b` (manifest source tree `61a8b70d795acd816d348934bd55293264ed5587`). No claim that this is the final frozen source.
- Full assigned package read: `/private/tmp/ufz-correction-final-source-review/runtime.diff`, 422,914 bytes, 4,272 lines, manifest SHA-256 `dc6d94bc6a33776233f34e58fa97d56d271976a6d10c030926f6d56397111613`. Read in bounded sequential chunks; truncated portions were reread explicitly (100–210 and 3550–3620). All changed hunks/contracts in the following exact seven manifest paths were inspected:
  1. `skills/super-code/SKILL.md`
  2. `skills/super-code/coordinator-subagents.md`
  3. `skills/super-code/coordinator-workflow.md`
  4. `skills/super-code/coordinator.js`
  5. `skills/super-code/implementer-prompt.md`
  6. `skills/super-code/scripts/close-in-tree-epics`
  7. `skills/super-code/task-reviewer-prompt.md`
- Requirements read: approved `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`; corrective plan `docs/superpowers/plans/2026-10-17-workflow-reliability-merge-correction.md`, including Global Constraints and task/boundary descriptions; requested code-reviewer instructions.
- Additional focused source reads, all for named concrete risks: pinned coordinator lines 407–457 and 782–821 (compact versus retained Recovery validation), 945–1090 (round admission and root closure), 1520–1725 and 1885–1930 (unplanned routing, slot ownership, early-unblock cancellation and re-entry ordering); pinned SKILL 168–184 and Workflow 782–809 (cleanup result shape and recovery hold contract).
- Test-support read scope: pinned `tests/super-code/recovery-hold-scope-r1.mjs` in full, to compare its existing compact/oversized hold controls; pinned `tests/super-code/replay-harness.mjs` runtime/extraction prefix through line 344, with focused reading of shared fixtures. These were supporting checks, not a claim to cover the harness partition.

## Strengths

- Verification-only completion has an independent evidence-review branch, exact captured identities, required live-check matching, durable acceptance basis before closure, and distinct completion accounting.
- Capacity-wait admission now occurs before attempt creation on the main work path. The corrected verification-child path releases its slot while waiting for parents and reacquires before completion.
- Caller root ownership is explicit and reaches both normal and no-jq epic-closure paths. Invocation source bindings, immutable bundle naming, and cleanup unknown/kept facts are carried through the major runtime contracts.

## Critical

None established in this partition.

## Important

### R1 — Invalid compact Recovery records lose their admission constraint

**Location:** `skills/super-code/coordinator.js:432`–437, `:451`–454, and Resume dispatch at `:804`; compare retained-record handling at `:784`–795 and admission at `:920` onward.

**Trigger:** Resume reads a compact `Recovery:` record describing an outstanding hold, but its version is unsupported or its required fields are malformed. For example, a `hold` for task `bd-101`, reason `human gate pending`, with `data.taskId: "bd-101"`, arrives with `version: 9` or an empty `evidence` array. A broken-JSON record also loses any recoverable admission scope.

**Mechanism/effect:** `readRecovery` records a diagnostic and returns null. It neither restores a scoped hold nor sets `recoveryTransportHeld`. The normal work path therefore admits, implements, reviews and merges `bd-101`, despite not having reconciled the retained hold. The return reports a gap but `stopReason: ready-drained`. The oversized-record path explicitly holds admission when the same record cannot be validated; the compact path changes execution safety merely because the record fits in the digest.

**Evidence:** A focused offline probe used the pinned coordinator and the pinned replay harness runtime prefix with the existing `liveArgs`/`oneTaskCanned` controls. It performed no real Git/tracker mutation. Results:

| Resume record | impl calls | merge calls | stopReason | retained gap |
| --- | ---: | ---: | --- | --- |
| valid v1 task hold | 0 | 0 | recovery-held | none |
| identical hold, version 9 | 1 | 1 | ready-drained | unsupported recovery version |
| identical hold, evidence [] | 1 | 1 | ready-drained | invalid recovery fields or missing evidence |
| Recovery: {broken | 1 | 1 | ready-drained | invalid JSON |

This is a concrete admission result, not a claim that malformed-record tests do not exist. The supporting hold-scope test already exercises invalid *retrieval of an oversized pointer*; that path sets the hold correctly.

**Required correction:** Reconcile invalid compact recovery before admitting work that may be governed by it. Preserve known scope where it can be established safely; otherwise retain an explicit unresolved-scope admission hold, as for failed oversized retrieval. Invalid clear records must continue to leave valid existing obligations intact. Cover compact unsupported/malformed records and valid-clear controls through the actual Resume path.

### R2 — Unplanned task routing bypasses durable holds and post-capacity admission

**Location:** `skills/super-code/coordinator.js:1551`, `:1569`–1571, `:1585`–1590. Contract: `skills/super-code/coordinator-workflow.md:789`–793; ordinary coordinator's admission contract.

**Trigger:** A ready task has a valid persisted task hold (or a merge-lane/global recovery hold), but the planner cannot map it and lists it as unplanned. The existing unplanned path includes it regardless of recovery state, then acquires capacity through `withSlot`.

**Mechanism/effect:** Only `runTask` invokes the new post-capacity admission predicate. `withSlot` immediately runs its callback after acquisition, so an unplanned held task still dispatches `unplanned-blocker:<id>`, files a new blocker, dispatches triage and can consume retry/quarantine state. A hold is supposed to preserve affected work for its owner; it should not manufacture a blocker outcome merely because planning could not produce a row. The later `recovery-held` return does not undo these mutations.

**Evidence:** Same pinned-source offline runtime probe, valid hold control above, but `plan.mapping: []` and `plan.unplanned: [{id:"bd-101",missingDecision:"scope unresolved"}]`. Observed exactly one each of `unplanned-blocker:bd-101`, `triage:bd-101`, `notify:bd-101`, and `ledger:bd-101`; returned `escalated: ["bd-101"]`, `stopReason: recovery-held`. The valid mapped-hold control dispatched no implementation or merge and did not manufacture the blocker outcome.

**Required correction:** Apply a fresh admission check to newly initiated unplanned work after its slot acquisition, preserving the reservation-only rejection semantics. Distinguish that new work from already-started failure/cancellation settlement sharing `withSlot`, which may need to run to release resources. Add a mapped/unmapped held-task control and a hold established while unplanned work waits for capacity.

## Minor

### R3 — Top-level result contract still describes only two cleanup arrays

**Location:** `skills/super-code/SKILL.md:174`–180.

The entrypoint still documents `processSweep` as `{ stopped, survived }` and instructs callers to list survivors. The implementation and detailed ordinary/Workflow contracts now return four arrays, with `unknown` representing denied/unverified inspection and `kept` representing deliberately retained processes. It also describes `worktreesKept` only as dirty/unmerged task worktrees, although the new contract includes process-blocked resources and temp roots. A caller following the primary skill contract can omit the new unresolved cleanup facts. Update this summary to match the detailed contract; existing outer caller behavior is covered by another partition, so this is a documentation mismatch, not a claim that that consumer currently drops data.

## Probe method and limitations

The focused command was an in-memory Node ESM probe. It read coordinator.js and the replay-harness prefix with `git show <head>:<path>`, replaced only the harness's `scriptBody` assignment with that exact pinned coordinator (and the harness directory for resolving its inert document/template imports), then imported the prefix plus exports for `run`, `liveArgs`, and `oneTaskCanned`. It supplied the records and mapping variations described above. `run` exercised the real runtime and prompt builders with canned agent answers. No suite rerun, tracker operations, Herdr mutation, canonical run artifacts, index or Git-state changes occurred. An initial probe-construction attempt failed because a JavaScript string replacement interpreted replacement metacharacters; the corrected callback replacement produced the results above. That setup failure supplied no product evidence.

These probes establish simulated runtime mechanics only. They do not establish hosted/native Workflow execution, real agent obedience, actual tracker behavior or historical occurrence of these exact malformed/unplanned cases.

## Cross-part seams and evidence still required

- The source-binding partition owns the separate producer/consumer issue involving `finalReviewStubPrompt`'s empty section bodies and `report-verdict --complete`/collection. I read the producer but did not duplicate that finding or claim independent consumer coverage.
- Metrics/profile and cleanup helper changes remain under concurrent Task 6/partition review; this report does not assert those repairs are frozen or accepted.
- Final source-bound combined suite results, documented changed-engine scenarios, representative changed-instruction behavior evidence, finding/disposition reconciliation, and independent root acceptance are not established by this partition. Their absence here is a scope/evidence boundary, not an unsupported code defect or a claim that tests do not exist.
- The composer must bind this review to later source changes, all other partitions, and final validation before evaluating whole-branch acceptance or the authorized local merge gate.

Recommendation: repair or explicitly adjudicate R1/R2, carry R3 into the contract consistency pass, and return this partition to the final composer with the exact source identity retained.
