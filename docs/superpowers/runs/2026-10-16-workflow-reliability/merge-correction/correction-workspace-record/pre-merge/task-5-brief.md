# Task 5: Idempotent Key Abstractions synchronization during resume

**Files:** skills/super-auto/resume.md; matching super-design/caller contracts only if needed; tests/super-auto/test-contract-lint.sh or a focused extraction/execution regression.
**Consumes:** persisted specs-committed state and existing Key Abstractions sync requirements.
**Produces:** resumed path cannot advance to filing/implementation with stale abstractions after a crash between spec commit and sync.
- [ ] Trace both amendment replay paths and prepare a failing regression for required sync before downstream advance.
- [ ] Apply minimal idempotent sync requirement; run focused checks and fresh instruction/spec review. Do not modify scout owner identity/dissolution scope. Commit/review.


## Global Constraints

- An actionable finding remains identifiable and accounted for until an explicit, supported disposition changes it. A later review's silence cannot erase it.
- Implementation, review, measurement, and run acceptance are independently supported facts. Completion of one cannot silently stand in for another.
- Dispatch uses a fresh admission decision after capacity waits; dependency meaning is preserved; interrupted work remains recoverable.
- Failed discovery or denied inspection cannot become “nothing running” or “stopped.”
- A required live check remains outstanding when only fallback evidence exists.
- Root remains open until required reviews, measurements and human gates are supported. No push, release, external issue/PR filing or waiver is authorized.
- Preserve original pinned 6.0 super-auto policy, rounds, raw artifacts, failed/unavailable evidence and source identities. Record this user-authorized continuation separately; never restamp old evidence onto new source.
- Work only in existing isolated workflow-reliability checkout; main remains 832b051c until merge gates pass. Do not edit the scout owner's isolated branch or take over its finding-ID/redesign fixes.
