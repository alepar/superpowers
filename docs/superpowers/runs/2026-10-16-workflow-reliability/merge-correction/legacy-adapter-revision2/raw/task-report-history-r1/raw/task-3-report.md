# Task super-plan-ufz.3 implementation

id: super-plan-ufz.3
status: IMPLEMENTED
base: b635541015f4bc0e037ef8621f8d01135ca2b22b
head: 2e65d11c70e9fa011576a27ea0891dba89275066
initialBase: 522c20bc70d234b1f718445902210186a3ecb389
stacked: false
branch: task-super-plan-ufz.3
worktree: /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.3

## Implemented

Queued work remains a scheduler reservation until capacity is acquired and fresh admission succeeds. Every runTask path (initial work, graph/tracker top-up, review re-entry, RESOLVE retry and stack-conflict retry) checks integration hold, start gate, quarantine/retry state and effective dependencies before starting an attempt. Rejection releases the slot in finally, records its admission reason and produces no implementation/fix/merge outcome.

Local implementation nodes retain completed/implDone early-unblock behavior, including a freshly implemented RESOLVE retry parent. External review/blocker/gate/epic/task dependencies use authoritative tracker closure through compact top-up observations. Failed, missing, duplicate or malformed observations invalidate only the affected dependency. Opaque candidates use tracker-ready membership. Queued external/opaque work refreshes facts after capacity; exhausted query budget holds work requiring fresh observations.

One timer at a configurable 30-second default cadence shares the existing serialized top-up and finite topUpQueryCap. External releases can be observed during unrelated in-flight implementation. Queries never await task chains or the merge lane, and quiescence cancels the timer. The detector remains nonnegative after rejected initial reservations. Both coordinator documents carry the same operative protocol.

## Verification

Final tested source: 214a28e8c1dba33b026db6441fd97ef27af55d59 on integration base b635541015f4bc0e037ef8621f8d01135ca2b22b. Final head adds only the retained post-rebase evidence file; `git diff --exit-code 214a28e8c1dba33b026db6441fd97ef27af55d59 HEAD -- skills/super-code/coordinator.js skills/super-code/coordinator-workflow.md skills/super-code/coordinator-subagents.md tests/super-code/replay-harness.mjs` exited 0. `git diff --check` passed and final `git status --short` was empty.

Exact final replay command (from the task worktree):

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.3 HOME=/tmp/sp-bce79baa/super-plan-ufz.3/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.3/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.3/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.3/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.3/state node tests/super-code/replay-harness.mjs
```

Output: `1900 passed, 0 failed` (exit 0). This includes the existing three documented dryRun scenarios, live-sim prompt generation, early-unblock/retry/cancellation contracts, and the new admission/readiness fixtures. Retained task excerpt and verdict: `evidence/super-plan-ufz.3/replay-post-rebase.txt`.

New cases prove:

- An integration hold established while a consumer waits for a slot prevents its implementation, review, fix and merge, with no attempt ledger entry.
- A post-capacity tracker observation holds an external-review consumer and releases the slot to unrelated work.
- External review closure releases a consumer before an unrelated long implementation finishes; the review ID never enters local completed.
- Open human gates, open blockers and an unavailable lookup hold their consumers with explicit reasons while unrelated work progresses.
- Fake cadence drives refresh deterministically; calls remain within the query cap and no fake timer remains at quiescence.
- The mechanical generated prompt requests authoritative status/kind observations and preserves independent lookup errors. Both Workflow and ordinary-subagent contracts were inspected; live ordinary-subagent behavior evaluation remains parent-owned.

The assertions can fail on concrete wrong behavior: an impl/review/fix/merge dispatch for a rejected ID; missing unrelated completion after slot rejection; consumer dispatch after the long task finishes; an open-gate/blocker/unavailable consumer dispatch; missing dependency error text; query count above its cap; or an outstanding timer.

## TDD evidence

RED command: `TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.3 node tests/super-code/replay-harness.mjs`, against initialBase with only new fixtures. Output: `1863 passed, 8 failed` (exit 1). The queued consumer incorrectly dispatched after integration became held; the external-release scenario timed out because no refresh ran during the long implementation. Related reason/contract assertions failed as expected. Retained exact failing excerpt: `evidence/super-plan-ufz.3/replay-red.txt`.

GREEN before rebase: same replay under isolated HOME/XDG/TMPDIR, `1877 passed, 0 failed`, retained in `evidence/super-plan-ufz.3/replay-green.txt`. Final GREEN after rebasing over durable recovery records: `1900 passed, 0 failed` as above. No failing checks remain in the final run. Intermediate verification exposed and resolved the retry-parent admission interaction and a test-local helper initialization mistake.

## Files changed

- skills/super-code/coordinator.js
- skills/super-code/coordinator-workflow.md
- skills/super-code/coordinator-subagents.md
- tests/super-code/replay-harness.mjs
- evidence/super-plan-ufz.3/replay-red.txt
- evidence/super-plan-ufz.3/replay-green.txt
- evidence/super-plan-ufz.3/replay-post-rebase.txt

## Test hygiene

No leaked processes after completed runs; no stopped or survived processes. Completed-run checks and final stop used the canonical stop-run-processes helper from /private/tmp with this task's worktree and /tmp/sp-bce79baa/super-plan-ufz.3 roots, all exit 0 with no match/survived output. One earlier check was run while replay was still active and showed its expected fixture processes; the completed-run check found none. An initial check from inside the task worktree was refused by the helper's ancestor-root guard; subsequent checks ran outside the owned roots. No Herdr writes or subagents were used.

## Assumptions and amendments

Current bead description/acceptance and comments were read before implementation; there were no bead comments or explicit amendments. The supplied frozen brief and current requirements agree. Durable recovery encoding belongs to task 4 and is included only through the clean rebase.

The parent authorized a truthful correction to one existing composed-interface seam fixture after independent triage at /private/tmp/ufz-admission-fixture-triage.md. It formerly advertised a consumer as ready despite an unfinished declared dependency with early unblock disabled, while making that producer await consumer dispatch. The corrected fixture admits both tasks with no known edge, then discovers the dependency through plan-rest.missingEdges after consumer dispatch and before producer landing. Both original seam-review assertions remain; additional ordering assertions preserve the original late-producer-landing purpose. Admission was not weakened.

This is a zero-dependency JavaScript replay project: no package setup/install is needed. The system Node interpreter is /opt/homebrew/Cellar/node/26.9.0/bin/node; runner tests/super-code/replay-harness.mjs and package-under-test skills/super-code/coordinator.js both resolve inside the assigned task worktree. No integration source files were edited.

## Behavior evaluation and concerns

Used writing-skills and TDD for changed behavior content. Parent-owned baseline: docs/superpowers/runs/2026-10-16-workflow-reliability/behavior-baseline/report.md with adjacent manifest/raw/scores (30 trials). Parent reported targeted scheduling clauses passed baseline/control; therefore instructions only describe the minimal implemented mechanism and add no generic stronger prompting. Parent owns integrated post-evaluation and the live ordinary-subagent scenario. These remain pending; deterministic fixtures are simulated evidence, not live instruction validation.

No live Workflow tool was available in this task seat; timer lifecycle and scheduling were exercised through the actual coordinator script in replay. The supported runtime must provide standard setTimeout/clearTimeout, as the Node replay does. Final acceptance belongs to the enclosing coordinator.
