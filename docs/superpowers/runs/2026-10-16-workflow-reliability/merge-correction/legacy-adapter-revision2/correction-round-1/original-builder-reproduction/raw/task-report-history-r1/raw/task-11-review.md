Status: NEEDS_FIX
Task: super-plan-ufz.12
Base: caf187cef8d1769da6184de42332a31bc7e30dcb
Head: 26cc469e06bab7b6dad98cb726326f949d1c486f

Spec compliance: ❌ Partial-close resume can report recovery settled before its clear/completion append is confirmed. Other inspected requirements are implemented: Recovery-only entry, exact persisted SHA observation, separate associated tracker status observations, missing/incomplete observations held, bounded observation per restart, scoped holds/deferred admission, unrelated work, and diagnostic runFailure preservation.

Current requirements: bd show super-plan-ufz.12 --json and bd comments super-plan-ufz.12 were read; no amendments or comments exist. The current bead and brief agree. The base ancestor check passed. Reviewed the immutable range above. Package generation initially encountered a sandbox write denial; the approved artifact-only escalation succeeded and produced a nonempty package listing four files.

Issues:
Critical: none.
Important:
- skills/super-code/coordinator.js:1511 — Resumed records whose tracker beads are partly open enter closeAlreadyMerged, which calls confirmClosure. That function calls clearPendingClosure at line 1246; noteRecovery/readRecovery remove the pending-closure obligation immediately, before the buffered ledger:<id> append is confirmed. closeAlreadyMerged then settles completed at line 1270. If ledger:<id> and its retry return null (or report appended:false), drainLedger merely drains the chain and the run returns completed with the recovery obligation absent. The new confirmation-aware Resume fast path at lines 724–731 only protects records observed fully closed at the first observation. This violates the brief's requirement to drain confirmed closure/updated obligation records before treating recovery as settled, and the report's claim that in-memory obligations change only after confirmed append. Route partial-close completion through the same confirmed durable transaction, retaining the original record and a scoped recovery-held result on failed append. Add a targeted fixture with an initially open associated bead, successful close/check, and failed ledger:<id> append/retry; assert recovery remains unresolved and a subsequent restart observes facts rather than blindly repeating closure.
Minor: none.

Focused checks outside the diff:
- Risk: newly seeded landed entries might miss the common admission gate or use an obsolete closure route. Traced Resume -> pendingClosures -> planned rows -> runTask admissionReason -> closeAlreadyMerged, and searched sibling closeAlreadyMerged call sites.
- Risk: closure settlement may precede durable reduction. Read confirmClosure, clearPendingClosure, noteRecovery/readRecovery, queueLedger/appendLedger/drainLedger, and Finish reconciliation; this established the Important finding above without running tests.
- Risk: the exact SHA verifier might require a surviving branch. Read already-merged; full-SHA second-parent and landing-merge checks support the stated deleted-branch recovery behavior.

Test evidence: Implementer reports TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 node tests/super-code/replay-harness.mjs (2074 passed, 0 failed) and TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 bash tests/super-code/test-dispatch-text.sh (all tests passed), both exit 0 at reviewed HEAD. Commands, pass counts, targeted RED evidence, and process hygiene are plausible. No tests were run by this reviewer. The interrupted-append fixture covers only the initially all-closed fast path, leaving the partial-close durability failure uncovered. Parent-owned fresh-agent evaluation remains explicitly deferred by the brief/report.

Test changes: Ran git diff --stat caf187cef8d1769da6184de42332a31bc7e30dcb..26cc469e06bab7b6dad98cb726326f949d1c486f and git diff for that range with the dispatch's complete TEST_PATHSPECS ('tests/**', 'test/**', 'spec/**', recursive variants, *_test.*, *.test.*, test_*.*, *_spec.*, *.spec.* and recursive variants). Both commands succeeded. tests/super-code/replay-harness.mjs has 83 additions and 1 deletion; the deletion replaces a canned response setup without changing assertions. New scenarios are additive; no skipped, deleted or weakened assertions found.

Strengths: Separate Git and tracker observations prevent tracker-only closure from concealing a resumed Git mismatch. Scoped gates preserve unrelated progress and additive recovery evidence.
