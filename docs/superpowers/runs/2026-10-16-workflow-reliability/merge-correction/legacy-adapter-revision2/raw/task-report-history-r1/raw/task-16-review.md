# Task super-plan-ufz.6 review

Status: CLEAN
Base: bee2526cd249be60632281f092ab48e1667b8747
Head: 232d3ca4adefafd4d757e8930fc10260159bafae
Review bead: super-plan-ufz.19

## Spec compliance

✅ Current `bd show super-plan-ufz.6 --json` and `bd comments super-plan-ufz.6` read before the brief. No task amendments or comments. Applied compatible frozen requirements and the parent clarification: supported caller assessment may classify a disclosed finding/group as nonblocking without resolving it or requiring extra human ceremony. Actual stacked Ready/recheck queries are read-only; checked every actual closure helper rather than imposing the older brief's assumption that Ready mutates.

✅ Explicit `rootAcceptance: "caller"` is separate from deferSweep, persisted in Launch, and passed through the existing Workflow and ordinary-subagent instructions, initial launches, all re-entry paths and resume. Both actual coordinator helper callers (`closeEpicsPrompt`, `topUpPrompt`) append `--exclude-root`. The helper excludes only the root and preserves fixpoint inner-epic closure, including manual no-jq instructions. Default ownership and no-option standalone behavior remain intact.

✅ Caller mode cannot stop on rootClosed; the existing empty-frontier path returns ready-drained normally. Leaves can finish independently of caller acceptance. Super-auto retains root closure until the existing final human choice and specified requirements are supported.

✅ Required review, exact-source/command/configuration measurement, live-check kind, Recovery holds/pending closures/deferred obligations, run-owned repair and retained attribution gaps, pending collections, and validated outstanding findings are consumed independently. A matched passing sweep does not resolve a requirement-linked code defect. Missing supported relevance judgments remain gaps. Explicitly linked occurrences can share one supported judgment; nonblocking acceptance effects preserve outstanding original refs and the punch list. No blanket extra human gate was introduced.

✅ Pending acceptance survives resume/status, including keep/cancel versus accepted finish. Historical requirements omitted later remain required. Historical run-state fixture files have an empty diff; only approved additive fields/formats changed. The inherited contract lint already checks the historical-plus-additions union and mutations, so no duplicate lint implementation was required.

## Issues

Critical: none.
Important: none.
Minor: none.

## Test evidence

No tests run by this reviewer, as required. Implementer report supplies targeted commands and relevant output:

- `node tests/super-code/replay-harness.mjs`: 2202 passed, 0 failed. Includes fake-bd root exclusion, normal standalone root closure, no-jq fallback, all actual closure callers, Launch persistence and open-root ready-drained.
- `bash tests/super-auto/test-scripts.sh`: 44 root acceptance assertions passed; all super-auto script tests passed. Covers independent gates, exact measurement matching, finding relevance/group assessment, run attribution gaps and status qualification.
- `bash tests/super-auto/test-contract-lint.sh`: all contract lint tests passed, including unapproved additions, changed legacy formats, omitted approved fields and changed approved formats.

The report identifies source/worktree/toolchain and exact environment prefix, distinguishes deterministic evidence from live behavior evaluation, and records a settled empty process check. Evidence is plausible and relevant; no failed final test is glossed over.

Test changes inspected with both `git diff --stat BASE..HEAD -- PATHSPECS` and `git diff BASE..HEAD -- PATHSPECS`, using the full dispatch TEST_PATHSPECS and immutable identities above. Result: four test/fixture files, 106 additions, no deletions or weakened historical expectations. Both historical 2bf1d53 fixture paths separately have an empty range diff. The existing lint implementation was inspected specifically to verify reuse of additive union and mutation checks.

## Focused reachability checks

Risk: missed closure caller or standalone regression. Searched coordinator.js for close-in-tree-epics/rootClosed/rootAcceptance and inspected the loop and both prompt builders in the task worktree. Close and refill/top-up are the only helper callers; Ready/recheck are read-only. Default coordinator ownership retains the previous rootClosed exit.

Risk: prerequisite evidence contract mismatch. Inspected the existing checkEvidence producer/classification and Recovery/runFailures projections. The gate consumes the returned IDs, full tree/command/configuration identities, kind/outcome records and retained failure gaps rather than treating a latest-ready verdict as acceptance.

Risk: collection qualifiers lost across the acceptance boundary. Inspected ordinary status qualifier production and the acceptance-mode recursive read-only call with RS_SKIP_ACCEPTANCE. Pending collection and finding coverage qualifiers become acceptance gaps.

## Remaining enclosing-run obligations

Fresh-agent scenarios are prepared in evidence/super-plan-ufz.6/acceptance-scenarios.md. Their execution, parent final evaluation/review and full sweep remain explicitly coordinator-owned and are not claimed complete by this task review. The real epic remains unaccepted; this review performs no tracker mutation, source/test edits, agent spawning or Herdr writes.

The initial package write was denied by the sandbox; repeating the same authorized artifact generation with escalation succeeded (2 commits, 98793 bytes). The package is nonempty and HEAD matches the captured immutable head. Base ancestry check passed.
