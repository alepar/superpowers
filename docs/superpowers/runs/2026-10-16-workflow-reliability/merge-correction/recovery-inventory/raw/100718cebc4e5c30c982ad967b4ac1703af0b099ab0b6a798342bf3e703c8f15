## Task 3: Recheck admission and refresh external dependency readiness

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-code/scripts/tree-deps`
- `skills/super-code/scripts/ready-in-tree`
- `skills/super-code/scripts/review-bead`

**Bead:** super-plan-ufz.3. **Surface:** 197104 tokens at the integration base.

**Scope:** Fresh dispatch admission and bounded tracker refresh inside the existing scheduler; do not introduce a scheduler replacement or strengthen unrelated agent judgment.

**Interfaces:** Local implementation dependencies may be usable at implDone under the current early-unblock contract. Review, blocker, human-gate and out-of-tree dependencies require authoritative tracker status. A failed observation produces a per-task admission hold/reason, not a run-global failure. This leaf may use transient admission state; durable recovery encoding belongs to Task 4, so neither leaf waits for the other.

### Acceptance (verbatim)

- [ ] A hold established during a slot wait prevents dispatch; the slot is released and no implementation attempt is falsely reported.
- [ ] A closed external review dependency releases its consumer even when its ID is absent from implementation completion sets.
- [ ] An external release becomes visible while a long-running task remains in flight.
- [ ] A failed dependency lookup keeps affected work held with a reason while unrelated eligible work continues.
- [ ] Deterministic Workflow replay covers both execution-path contracts; coordinator-owned live evaluation checks changed ordinary-subagent instructions.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add replay scenarios using the harness's async canned functions and waitFor(label), with cap 1 or 2: hold a first task in flight, queue a consumer for a slot, establish integration/parent cancellation or tracker hold before releasing the slot, and assert no impl:<consumer> dispatch. Assert slot capacity is reclaimed and no implementation/fix/merge attempt is counted for rejected admission.
2. Add independent cases for a closed review ID absent from completed/implDone, a blocker/human gate that remains open, an unavailable lookup affecting only one consumer, and an external dependency released while a long-running task has not completed. Use bounded fake cadence/events in the replay; no wall-clock sleeps are needed to establish ordering. Run and retain the failing case before implementation.
3. Move creation of a live implementation attempt behind sched.acquire and the admission check, or represent waiting reservations separately so denied admission is never reported as an attempt. Immediately before implementation, recheck integrationBlocked, cancellation/quarantine and effective dependencies; release the slot in finally on every rejection. Apply the same admission predicate to initial, graph-top-up, tracker-top-up, retry and review re-entry paths without breaking stacked parent cancellation.
4. Extend the existing mechanical tracker observation/top-up contract to return the status/type/relationship needed to satisfy external review/blocker/gate dependencies. Keep completed/implDone as authority only for local implementation nodes. Failed/malformed observations hold the affected task with an explicit reason and permit unrelated eligible work.
5. Add a bounded readiness opportunity while chains remain in flight, serialized with existing topUps and limited by the existing topUpQueryCap or a documented finite cadence/budget. It must not await a task completion to observe external release, spin on ready work, leak timers after quiescence, or create an await cycle with the merge lane. Preserve compact results; do not echo tracker bodies.
6. Document the same post-capacity admission and external-status protocol in coordinator-workflow.md/coordinator-subagents.md. Use writing-skills for changed instructions and hand the live ordinary-subagent scenario to the enclosing coordinator. Run replay, inspect both paths' generated contract, and commit the mechanics plus fixtures.

Run:

```bash
node tests/super-code/replay-harness.mjs
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** Queued work is admitted from fresh facts, external closure can release it during an unrelated long task, and failed observations isolate their hold.

