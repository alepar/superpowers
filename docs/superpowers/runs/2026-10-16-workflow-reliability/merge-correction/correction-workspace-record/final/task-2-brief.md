# Task 2: Review archive containment and explicit null-result reconciliation

**Files:** skills/super-auto/scripts/report-status; tests/super-auto/collection-symlinks-r1.sh; focused new correction tests if needed.
**Consumes:** settled invocation identity, collection source binding and archive ownership.
**Produces:** destination path components cannot redirect collection outside its owned archive; a recovered report may explicitly reconcile a settled null result with immutable provenance/history rather than rewriting the original outcome.
- [ ] Read retained round2 probes and actual collection code; reproduce both defects in private fixtures with positive controls.
- [ ] Add failing behavioral tests before fixes; reject unsafe destination components without outside writes and support a narrowly validated recovery transition.
- [ ] Test idempotence, mismatched identity, original null/UNAVAILABLE preservation and supported successful collection; commit/review.


## Global Constraints

- An actionable finding remains identifiable and accounted for until an explicit, supported disposition changes it. A later review's silence cannot erase it.
- Implementation, review, measurement, and run acceptance are independently supported facts. Completion of one cannot silently stand in for another.
- Dispatch uses a fresh admission decision after capacity waits; dependency meaning is preserved; interrupted work remains recoverable.
- Failed discovery or denied inspection cannot become “nothing running” or “stopped.”
- A required live check remains outstanding when only fallback evidence exists.
- Root remains open until required reviews, measurements and human gates are supported. No push, release, external issue/PR filing or waiver is authorized.
- Preserve original pinned 6.0 super-auto policy, rounds, raw artifacts, failed/unavailable evidence and source identities. Record this user-authorized continuation separately; never restamp old evidence onto new source.
- Work only in existing isolated workflow-reliability checkout; main remains 832b051c until merge gates pass. Do not edit the scout owner's isolated branch or take over its finding-ID/redesign fixes.

## Concrete reproduction starting points
Retained source evidence is under the run's roast-pr-2-stages/judge-0-{reproduce,refute,ground} for destination escape and judge-4-* for null recovery (verify exact corresponding findings before assuming indices). Existing tests/super-auto/collection-symlinks-r1.sh covers SOURCE symlinks; add destination reviews/, invocation-dir and nested-dir symlinks with outside sentinel/no-write controls. Existing collection CLI refuses any settled reviewPath change, including null→actual recovered final-review-<inv>.md. Recovery must be explicitly caller-requested, validate unchanged invocation/workspace/required bundle and expected review path, preserve immutable original null/UNAVAILABLE event, reject replacing an already non-null settled report, and keep repeat recovery idempotent. Use existing records/helper boundaries; do not invent measured source or fabricate verdicts. Own report-status only for collection branch, not acceptance branch (Task3 follows). No original run.md edits, no gates/root closure, no installed skill changes.
