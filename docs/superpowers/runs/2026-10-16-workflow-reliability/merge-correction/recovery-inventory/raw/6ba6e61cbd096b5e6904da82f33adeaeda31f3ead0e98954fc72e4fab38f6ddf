## Task 19: Preserve held task scope through oversized recovery transport

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/ledger-digest`
- `tests/super-code/recovery-hold-scope-r1.mjs`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `tests/super-code/replay-harness.mjs`
- `tests/super-code/test-run-digest.sh`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-0-reproduce/tests/super-code/probe.mjs`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-0-reproduce/receipt.json`

**Bead:** super-plan-ufz.22. **Surface:** 192564 tokens at the integration base.

**Scope:** Compact or oversized persisted recovery transport must preserve or recover the affected task identities before admitting work; missing transport is an evidence gap that holds affected work, not permission to drop its hold.

### Bounded fixture exception

Named test defect and bounded fixture amendment (recovery-fixture-assessment-r1.md): tests/super-code/replay-harness.mjs:594–610, the legacy oversized verification-basis fixture, digests a foreign temporary ledger that is subsequently deleted and supplies only capped text with an unresolved Recovery pointer, yet expects ready independent-review reentry. Only that fixture and adjacent focused replacement cases may change; no unrelated replay assertions, snapshot baselines, digest-suite changes, schema relaxation, inferred scope, new recovery-reader dispatches, specification changes or historical evidence edits are authorized.

Preserve the real ledger-digest cap assertion: the oversized basis emits the actual source-line pointer and typed verification-only Task discriminator without leaking evidence/live.log. Do not fabricate an inline Recovery record or erase the pointer to admit work.

For recovered oversized pending-closure coverage, configure integrationWorktree and use its actual .superpowers/sdd/bd-100-plan/progress.md (or legitimate relative ledger path). While that file exists, generate compact text and complete counted targeted output with bash skills/super-code/scripts/ledger-digest and --recovery-line 1 from that same ledger. Supply recoveryRecords: [{ source: <exact emitted pointer source>, line: 1, text: <complete counted targeted output> }] in the existing read-ledger canned response. Preserve the entire original oversized pending-closure record, evidence and additive fields; no replacement kind, clear operation or invented narrow affectedIds. Assert the existing reader prompt includes the recovery command for that exact ledger/line and no additional read-recovery dispatch occurs. Provide resume-check:bd-101 with sourceVerified: true, landed: false, closed: [], open: ['bd-101'] only when bd-101 is the sole required bead, observing the retained head/tree and exact required beads. Assert resume-check precedes closure; impl:bd-101 = 0, review:bd-101 = 0, merge:bd-101 = 0, close-only:bd-101 = 1, and completed includes bd-101 only after confirmed closure. Retain recovered evidence/source identity and clear only the resolved transport gap. Preserve pending-closure source/tracker failure cases; unsupported observations never close work.

Separately retain ready missing-basis reentry using a valid counted ledger containing only Task 1 (bd-101): complete, verification-only, with no unresolved Recovery pointer or surviving pending-closure basis. Fresh impl and independent reviewer responses must supply the original source-bound live evidence and requiredLiveChecks. Assert impl:bd-101 = 1, review:bd-101 = 1, confirmed close-only closure, completed includes bd-101, merge:bd-101 = 0, and durable writing of the new reviewed basis before closure. Preserve the not-ready missing-basis evidence gap and no inferred completion.

Add an unrecoverable-pointer ready replay using the legacy capped text, its deleted foreign temporary source and no recoveryRecords: impl:bd-101 = 0, review:bd-101 = 0, merge:bd-101 = 0, close-only:bd-101 = 0, completed excludes bd-101, stopReason = recovery-held, and recovery.gaps retains the unresolved source/line. Do not infer unrelated admission scope. Retain current-ledger missing/truncated/empty/malformed retrieval coverage and reject a supplied foreign-source payload as an ownership bypass.

Run exactly the three named verification commands in the task worktree and record source revision/diff and complete outcomes. The prior reported 2276 passes / 1 failure is not completion evidence; all assertions above must pass. Rejected measurement-classification and direct frozen-Git fallback materiality findings remain rejected. Caller final sweep and root/human acceptance remain pending.

### Covered findings (verbatim)

- [Should-fix] skills/super-code/coordinator.js:752

### Acceptance (verbatim)

- [ ] An oversized persisted hold with additive context still blocks its identified task after resume; no implementation dispatch or merge occurs until its supported release.
- [ ] A valid compact hold and unrelated eligible work retain their expected behavior; missing/truncated transport remains distinguishable from a valid empty record.
- [ ] Add focused regression tests for the reported 173-byte versus 5173-byte hold. Run node tests/super-code/recovery-hold-scope-r1.mjs, node tests/super-code/replay-harness.mjs and bash tests/super-code/test-run-digest.sh. The replay suite may change only the oversized verification-basis fixture and adjacent focused cases to supply authoritative retained recovery bytes and independently assert recovered-basis reuse, valid missing-basis reentry, and unrecoverable-pointer admission hold; all other existing assertions and the digest suite remain unchanged.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Create tests/super-code/recovery-hold-scope-r1.mjs using the existing coordinator replay driver and the real ledger-digest helper. Persist the same task-scoped hold in the reported compact 173-byte form and a 5173-byte form containing additive context. Resume each and assert the affected task neither dispatches nor merges, while an unrelated eligible task can proceed. Also cover a supported release, valid-empty input, missing input and truncated input. Run the focused fixture first and retain the failing assertions.

2. Trace ledger-digest's oversized Recovery record handling into coordinator.js's Recovery gap parser and readRecovery/admission sets. Preserve the task identity in compact transport when possible, or recover it from the authoritative retained record before scheduling. A pointer with no safely recoverable task scope must remain a visible hold/evidence gap; never treat the missing payload as a supported release.

3. Keep the existing Recovery schema, release semantics and task-scoped admission checks. Do not discard additive fields, weaken identity validation, invent an empty obligation list or hold unrelated identifiable work merely because one record is large.

4. Add focused regression tests for the reported 173-byte versus 5173-byte hold. Run node tests/super-code/recovery-hold-scope-r1.mjs, node tests/super-code/replay-harness.mjs and bash tests/super-code/test-run-digest.sh. The replay suite may change only the oversized verification-basis fixture and adjacent focused cases to supply authoritative retained recovery bytes and independently assert recovered-basis reuse, valid missing-basis reentry, and unrecoverable-pointer admission hold; all other existing assertions and the digest suite remain unchanged. Report the source tree and outcomes, separating recovered holds from unresolved transport gaps. Deliverable: oversized recovery facts retain their admission effect through the real digest/resume boundary.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

