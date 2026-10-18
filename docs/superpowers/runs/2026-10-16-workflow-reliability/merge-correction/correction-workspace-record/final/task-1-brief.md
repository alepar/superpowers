# Task 1: Verification-only stacked scheduler settlement

**Files:** skills/super-code/coordinator.js; tests/super-code/replay-harness.mjs (or a focused harness consumer).
**Consumes:** existing startAttempt/parentsMerged/scheduler-slot and verification completion contracts.
**Produces:** a verification-only child awaiting a parent merge does not monopolize the slot needed by failure settlement, cancellation or triage; valid completion still waits for parents and holds/admission correctly.
- [ ] Add a deterministic failing concurrency=1 parent-merge-failure/verification-child regression with bounded deadlock detection and ordinary-child/successful-parent controls.
- [ ] Verify RED against c4 source, then apply the smallest lifecycle fix, keeping slot release/reacquisition/abandon semantics balanced.
- [ ] Run focused regression plus full replay once; record exact commands/results; commit and obtain fresh spec+quality review.


## Global Constraints

- An actionable finding remains identifiable and accounted for until an explicit, supported disposition changes it. A later review's silence cannot erase it.
- Implementation, review, measurement, and run acceptance are independently supported facts. Completion of one cannot silently stand in for another.
- Dispatch uses a fresh admission decision after capacity waits; dependency meaning is preserved; interrupted work remains recoverable.
- Failed discovery or denied inspection cannot become “nothing running” or “stopped.”
- A required live check remains outstanding when only fallback evidence exists.
- Root remains open until required reviews, measurements and human gates are supported. No push, release, external issue/PR filing or waiver is authorized.
- Preserve original pinned 6.0 super-auto policy, rounds, raw artifacts, failed/unavailable evidence and source identities. Record this user-authorized continuation separately; never restamp old evidence onto new source.
- Work only in existing isolated workflow-reliability checkout; main remains 832b051c until merge gates pass. Do not edit the scout owner's isolated branch or take over its finding-ID/redesign fixes.
