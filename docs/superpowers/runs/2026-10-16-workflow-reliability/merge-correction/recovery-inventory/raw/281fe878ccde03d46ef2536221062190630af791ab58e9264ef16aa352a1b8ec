## Task 11: Reconcile persisted recovery facts before resumed admission

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/ledger-digest`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-code/scripts/already-merged`
- `skills/super-code/scripts/review-bead`
- `skills/super-code/scripts/tree-deps`

**Bead:** super-plan-ufz.12. **Surface:** 197779 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Resume behavior only: reconcile existing durable facts before affected admission. The .4 producer owns record encoding and digest round-trip; .3 owns ordinary fresh admission and external readiness.

**Interfaces:** Read the actual additive recovery records/digest delivered by .4. Reuse existing landed/landedRanges, pendingRetry, holds and closure associations plus already-merged and authoritative tracker status. Terminal task completion, valid Git landing and review/blocker closure remain separate observations; failed queries retain the affected hold with a reason. Do not add a replacement journal.

### Acceptance (verbatim)

- [ ] Restart after valid landing but before tracker closure reconciles without repeating implementation (needs: super-plan-ufz.4).
- [ ] Persisted holds and deferred obligations constrain resumed affected work; Git/tracker disagreement remains explicit (needs: super-plan-ufz.4).
- [ ] Deterministic partial-close, hold and mismatch fixtures pass; coordinator owns fresh-agent resume evaluation.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Extend the existing landed-but-unclosed replay scenarios with .4's real records: valid landed SHA + open task/review/blocker; fully closed tracker + verified landing; persisted hold/deferred check + otherwise ready task; ledger says landed but Git does not; and denied tracker/Git lookup. Assert the valid landing causes no implement/review/merge re-dispatch, only required closure; unrelated work remains eligible while an affected unresolved record is held.
2. Run `node tests/super-code/replay-harness.mjs` with the added scenarios before editing resume handling and retain the failures. Reuse the existing run/oneTaskCanned functions, temporary ledger fixtures, read-ledger answers, landed evidence and close-check trace assertions. Add a second resume from the resulting closure records to prove idempotence.
3. In Resume, decode .4's records, obtain the existing authoritative Git landed evidence and tracker task/review/blocker observations, and reconcile them before the affected mapping row can reach implementation dispatch. Seed already-landed work from verified original SHA/range rather than reimplementing. Route pending tracker closure through existing closeAlreadyMerged/reconciliation machinery; close only observed-open associated beads and preserve script/lookup failures as unknown facts.
4. Restore persisted holds and deferred obligations before admission. Keep record evidence and current observation together when they disagree; do not erase an obligation on silence, lack of a task branch, or the last clean Task line. Preserve per-record gaps while unrelated rows progress. Drain the confirmed closure/updated obligation records through .4's existing append path before considering the recovery settled.
5. Change ledger-digest only if the landed .4 fields needed for reconciliation are being lost, preserving old digest consumers. Align Workflow and ordinary resume instructions with the same ordering and bounded lookups, using writing-skills for operative changes. Prepare interruption/hold scenarios for parent-owned fresh-agent evaluation, run replay, and commit the resume behavior and fixtures.



Run:

```bash
node tests/super-code/replay-harness.mjs
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** A restart reconciles valid landed work, pending closures and holds before affected dispatch, preserving mismatches without duplicate implementation.

