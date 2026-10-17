## Task 4: Persist recovery obligations and fix history records

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/ledger-digest`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-code/scripts/already-merged`
- `skills/super-auto/run-state.md`

**Bead:** super-plan-ufz.4. **Surface:** 201731 tokens at the integration base.

**Scope:** Durable record/transport contract only. Recovery reconciliation, root acceptance, metrics reconciliation and no-change completion remain separate dependent leaves.

**Interfaces:** Extend the existing progress ledger with compact additive 'Recovery: <JSON>' records: {version:1,id,kind,operation,reason,evidence,data}, where kind is hold|pending-closure|deferred|fix and operation is record|clear. evidence is a nonempty array of source/artifact references for recorded obligations/history; data carries known landing SHA/range, related bead IDs or fix outcome without inventing missing facts. clear names the matching obligation; fix history remains append-only. Retain legacy Task/Merge/Human action lines. Downstream consumers must read the retained history separately from latest terminal task status.

### Acceptance (verbatim)

- [ ] Holds, pending closures, deferred obligations and fix history round-trip through existing durable artifacts/digest with explicit evidence references.
- [ ] Earlier FIXED history remains available after a later clean retry.
- [ ] Record/digest fixtures preserve compatible existing ledger consumers.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add fixtures around ledger-digest plus replay's append/read paths: a hold, landed-but-unclosed task with review/blocker IDs and exact SHA, a caller-owned deferred check, a FIXED record followed by a clean retry, and old-format ledger input. Assert full record round-trip, evidence references, and latest status independently from history. Add malformed/unknown-version behavior that exposes a record gap instead of silently dropping an actionable record.
2. Run the failing digest/record fixture before changing code. Keep the existing digest header count and Task-line compatibility assertions; missing/unreadable/truncation taxonomy is owned by the later metrics leaf, so do not expand that transport policy here.
3. Add narrow encoder/decoder use at existing coordinator state changes (recordPendingClosure/confirmClosure, merge-lane holds, deferred measurement handling and fix-pass results). Append the additive Recovery records through queueLedger/noteLedger; drain records before returning their settled results. Preserve source report/review and commit references even where the elided fallback drops free text. Fix-history records must not be superseded by settle's current terminal bucket.
4. Teach ledger-digest to preserve the recognized compact Recovery lines without truncating their evidence or changing legacy Task reducers. Seed separate recovery/fix-history collections when reading existing records, preserving unknown/uninterpretable records as explicit gaps. Do not implement the later Git/tracker resume reconciliation or close the root from these facts.
5. Document the record fields, ownership and ordinary-subagent emission in the two coordinator references. Include actual examples: a pending-closure record with data {head:<landing SHA>,reviewBead:<ID>}, and a fix record with data {outcome:'FIXED',reviewPath:<artifact>,head:<SHA>}; use real fixture values in tests. Agent protocol field updates should remain short; use writing-skills for changed instructions.
6. Run replay and the direct digest fixtures it includes, check existing consumers still receive their legacy tokens, and commit the contract and producer changes. Report the exact field/operation examples for downstream recovery/metrics planners.

Run:

```bash
node tests/super-code/replay-harness.mjs
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** Existing durable artifacts can retain and transport obligations and all relevant fix attempts without conflating them with latest task completion.

