# Task 2 fix-round-1 independent re-review

Reviewed pin: `ac2a20fab3c854cd1f2133d3be4fcaa7f7a6cb6e`, compared with `86ce3567e365fed967d50f3f4eeca77783fccf8b`, in `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers`.

**T2-R1 disposition: ADDRESS (addressed).**

**Spec verdict: PASS for this scoped correction. Quality verdict: PASS for this scoped correction. New Critical/Important findings in the fix diff: none.**

Read the exact Task 2 brief/global constraints, full implementation report including fix round 1, original independent finding at `/private/tmp/ufz-correction-task2-review.md`, and complete `task-2-fix-round-1-review-package.diff`. Inspected pinned source and the complete pinned recovery test using `git show`. The review-package diff exactly matches `git diff --unified=25` between the specified commits. The changed-file set is only the collector script and its recovery regression test (12 insertions, 3 deletions); the acceptance branch and selector are unchanged by this fix.

## Why T2-R1 is addressed

At `skills/super-auto/scripts/report-status:224-233`, predecessor lookup now happens independently of the incoming recovery field. Existing provenance validation runs if the incoming record has a marker, the predecessor has one, or the predecessor is settled/null and the incoming path is non-null.

- Removing every recovered marker now reaches validation on the first null-to-non-null transition. The absent marker fails `!recovery`; the rejected record cannot replace `latest` or enter `history`. Later stripped recovered snapshots therefore cannot bypass that predecessor check.
- Removing only the final snapshot's marker now reaches validation because the last validated predecessor has recovery metadata. The absent marker is rejected before the latest projection changes.
- The existing `malformed` flag remains set after either rejection, so a later valid record cannot erase the collection gap during that replay. The malformed historical line remains in the persisted history.
- Ordinary non-null collections have neither a recovered predecessor nor a settled-null-to-non-null transition. They still bypass the recovery-specific validator legitimately. No arbitrary marker requirement was imposed on ordinary collections.

The body of the validator is unchanged: valid explicit recovery still binds the retained null predecessor, invocation, workspace, ordered required array, expected report path and original verdict; later valid recovered snapshots must retain the same provenance and recovered identity. The fix reuses these checks rather than adding a competing identity rule. Destination containment and archive handling are unchanged.

## Evidence assessment

Read all three retained round-1 logs:

- `/tmp/workflow-task2-r1-recovery-red.log`: **22 passed / 2 failed**, with exactly the two missing-marker replay cases failing because the CLI returned `collection: complete`, exit 0 rather than 3.
- `/tmp/workflow-task2-r1-recovery-green.log`: **24 passed / 0 failed**. Both omission cases pass, alongside explicit recovery, exact predecessor retention, repeat recovery/replay byte-idempotence, malformed provenance rejection, source-cleanup replay, identity refusal and ordinary non-null replay without a marker.
- `/tmp/workflow-task2-r1-symlinks-green.log`: **32 passed / 0 failed**, including source/destination symlink refusal, outside-byte/entry preservation, valid nested collection and completed-archive source cleanup.

The new tests operate through the real CLI against a previously successful recovery and retain the original null history. The final-snapshot mutation is built from the saved valid history, independently of the all-markers mutation. The ordinary replay control verifies marker absence, successful replay and byte stability. These assertions exercise observable behavior and distinguish this fix from simply requiring markers on every non-null record.

The retained logs are implementation-run evidence reviewed here, not new execution results. No covered behavioral suite was rerun. Static inspection identified no concrete uncovered regression requiring a narrow behavioral probe. Independently verified the pinned source/test SHA-256 values against the report and confirmed the pinned diff has no whitespace errors:

- report-status: `2eebe2f00276002faa613666eaec25d39c5763509c9e8f1ccf8342f47777e053`
- recovery test: `12b343f3c63151718f57ed6bd5ed863fb635770cc542d919976399153040879c`

## Scope and acceptance boundaries

The known Task 4 collector-to-selector integration obligation remains outstanding and is not waived by this verdict. The collector's supported recovery must still be consumed and validated by the selector under that task's contract. This review establishes the disposition of T2-R1 and the quality/spec assessment of this fix diff only; it does not claim whole-branch readiness or root acceptance.

Historical caps, original findings outside this disposition, pinned 6.0 policy, rounds, raw/failed/unavailable evidence, source identities and original run.md remain unchanged. No historical evidence was restamped. Root stays open until all independently required reviews, measurements, live checks and human gates are supported. No source/index/HEAD/tracker/Herdr/process mutation, delegation, push, release or issue/PR filing occurred. Only this requested review artifact was written.
