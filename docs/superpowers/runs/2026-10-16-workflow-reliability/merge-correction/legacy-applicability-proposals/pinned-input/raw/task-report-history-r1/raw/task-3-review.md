# Task review: super-plan-ufz.3

Status: CLEAN
Base: b635541015f4bc0e037ef8621f8d01135ca2b22b
Head: 2e65d11c70e9fa011576a27ea0891dba89275066

## Spec compliance

✅ Current bead description and acceptance agree with the frozen brief. `bd comments super-plan-ufz.3` returned no comments; no requirement amendment was applied. The independently triaged composed-review fixture correction was authorized and preserves the original coverage.

✅ Capacity waits remain reservations. The common runTask boundary acquires capacity, refreshes external/opaque observations when required, applies integration/start/quarantine/effective-dependency admission, then creates the attempt. Rejected admission releases capacity through finally and never reaches attempt creation or implementation/review/fix/merge outcomes.

✅ Local implementation dependencies retain completed/implDone semantics. External observations require closed tracker status with a recognized kind; missing, duplicate, failed or malformed observations invalidate only the corresponding dependency. Opaque readiness retains tracker-ready authority.

✅ The serialized top-up and its finite query budget serve landings, capacity waits and a single in-flight timer. The timer can observe a release before an unrelated chain finishes and is cancelled in the quiescence finally block. Both execution-path documents specify the protocol. Live ordinary-subagent evaluation is explicitly parent-owned and remains a run-level acceptance obligation, as authorized by the brief.

## Issues

Critical: none.
Important: none.
Minor: none.

## Test evidence

The implementer reports the task-worktree command `TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.3 HOME=/tmp/sp-bce79baa/super-plan-ufz.3/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.3/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.3/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.3/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.3/state node tests/super-code/replay-harness.mjs`: 1900 passed, 0 failed, exit 0. The retained post-rebase evidence identifies source 214a28e8c1dba33b026db6441fd97ef27af55d59 and the review base. Head adds retained evidence only. This is plausible targeted evidence for admission, slot release, independent external lookup errors, external release during long work, query bounds, timer cleanup and generated protocol. RED evidence is also retained. No tests were rerun during review.

Test-change commands (both exited 0): `git diff --stat b635541015f4bc0e037ef8621f8d01135ca2b22b..HEAD -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'` and the same command without `--stat`. Result: replay-harness.mjs, 71 insertions and 5 deletions. Timer injection adds a deterministic seam. No tests were deleted or skipped and no expected result was relaxed.

The composed-interface fixture originally admitted a consumer despite an unfinished known dependency with early unblock disabled and made the producer wait for consumer dispatch. The correction models a supported late-discovered edge through plan-rest.missingEdges. Both original assertions remain unchanged: the merge prompt identifies a producer that landed after branching, and seam review checks its interface. Added assertions require both tasks to complete, consumer implementation before edge installation, edge installation before consumer merge, and no stacked consumer implementation. This preserves the target while removing the fixture admission cycle.

## Focused reachability and risk checks

- Shared-boundary reachability: traced round-head planned and review-reentry loops, graphTopUp, tracker top-up, RESOLVE retry and stack-conflict retry into runTask; searched all runTask call sites. All use the new post-capacity predicate. Existing withSlot calls perform non-implementation bookkeeping, rather than bypassing implementation admission.
- Cancellation risk from moving attempt creation: checked startAttempt, failAttempt and cancelStackedOn. Failed parent attempts remove implDone before their dependents can pass fresh dependency admission; active stacked attempts retain existing cancellation handling.
- External meaning risk: checked the planner/tree-deps interface. Ordinary nonlocal blocker/review dependencies are represented as opaque and retain bd-ready authority; explicit external dependency IDs use compact observations. Planner excludes blocker/review/gate beads from implementation work.
- Refresh deadlock risk: checked runTopUp/performTopUp and drain. Top-ups enqueue chains without awaiting them or the merge lane; coalescing returns the active query promise and stays budget bounded.
- Fixture reachability: checked plan-rest installs missingEdges and the existing composed-review merge path. The fixture uses the real late-edge route, rather than an unused wrapper.

The first review-package attempt encountered sandbox write denial; the authorized artifact was then generated successfully through an approved escalation. The package is nonempty (two commits, seven files). No review checks remain unavailable. No source, branch, tracker, or Herdr state was changed.
