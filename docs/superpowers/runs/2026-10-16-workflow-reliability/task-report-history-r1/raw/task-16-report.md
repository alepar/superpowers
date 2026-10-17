Status:FIXED

id: super-plan-ufz.6
branch: task-super-plan-ufz.6
base: 549545dd696f02f4db7e5187f5fca7292f2c15a8
head: 0bb280edcf5fc6a60499fdfdb090d1819a432963
stacked: false
originalStackParent: task-super-plan-ufz.8.3 @ 9095b2667b4a05fc4f229a725ab266211bce26f7
sourceTree: 87567e36e0dde251b05a76381473ff3330b50d22
worktree: /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.6

## Implementation and ownership

Added explicit top-level coordinator argument `rootAcceptance: "caller"`; omitted/default is
`"coordinator"`. This is independent of `deferSweep`. Launch persists it, caller mode ignores root
closure as an implementation-completion signal, and an empty implementation frontier returns
`ready-drained` normally. Existing pending-closure and recovery reconciliation remain in force.

Added optional `close-in-tree-epics EPIC --exclude-root`. Inner epics still close to fixpoint;
root is never passed to bd close. Its no-jq candidate predicate explicitly excludes the root, with
no contradictory root-inclusion instruction. The unchanged no-option invocation closes the root
normally. All real helper callers are updated: `closeEpicsPrompt` and `topUpPrompt` (including its
preliminary close). In this stacked source, `readyPrompt` and the post-closure recheck are read-only
`ready-in-tree` queries, not closure callers; tests explicitly verify that fact. No unnecessary
preliminary Ready mutation was introduced to satisfy the older brief's naming assumption.

Workflow and ordinary-subagent references carry the same caller ownership through initial code,
fix-loop, final-SHA, regression, sweep-fix, final-review and interrupted re-entry. Super-auto owns
the eventual root close; standalone ownership remains unchanged.

## Final acceptance gate semantics

The existing approvals block gains one additive `root-acceptance` JSON record, with explicit
requirements and owners plus source-bound evidence, review/decision facts, Recovery,
checkEvidence and runFailures from the prerequisite contracts. Historical snapshots remain.
Required review/measurement/human criteria are independent of implementation or merge status;
omitting a requirement in a later snapshot does not drop it. Existing phase-7 choice and actually
reserved human gates are recorded, without introducing a new approval ceremony.

`report-status --acceptance RUN_MD --tree FULL_GIT_TREE` is read-only. Exit 0 with `eligible:true`
permits the existing caller to close the root only after supported final acceptance; exit 3
reports pending obligations/gaps, while 2/4 establishes no acceptance. The caller resolves and
confirms the final reviewed/measured source before supplying its tree. Ordinary status qualifies
pending caller acceptance when the new record exists; legacy output is unchanged without it.

The gate checks required reviews at the recorded final source, exact tree/command/configuration
measurements, live kind where required, explicit deferred-Recovery ID bindings, holds/pending
closures, required live checks, collection integrity, run-owned failure state and attribution gaps,
and the shared validated outstanding finding projection. Failed and unavailable evidence remain
distinct. A matching passing measurement discharges only its matching measurement obligation;
it never clears a requirement-linked code finding, another measurement or a human choice.
Evidenced pre-run failures remain diagnostic unless an explicit requirement independently asks
for their repair. A verified run-owned fix with retained source-history gaps still blocks
acceptance; those gaps are not erased by the verified state.

Existing caller assessment supplies supported `findingAcceptance` judgments, with exact original
ref, basis/evidence and effect `required` (names its blocking requirement) or `nonblocking`.
Explicitly linked duplicates form one projected group and require one supported group judgment;
all original refs remain available. Unknown relevance is an acceptance gap. Nonblocking judgments
permit disclosed follow-up without resolving the original finding or removing it from the punch
list. Explicitly non-actionable source sections are assessed truthfully, not automatically treated
as code defects. Human authority is required only for genuinely human decisions already reserved
by the task/spec and phase-7 choice. Keep/cancel can end the run while root acceptance stays open.

The live epic and task were not accepted or closed. All acceptance testing used disposable
fixtures. Post-change behavior evaluation, final reviews and the enclosing full sweep remain
coordinator-owned prerequisites; this implementation does not claim them complete.

## Interfaces consumed

Read current bead description/acceptance and comments (no amendments/comments), frozen task 16,
approved spec, prerequisite code and downstream report interfaces for tasks 4, 5, 10, 13 and 14.

- Task 4: existing Recovery v1 envelope and `recovery:{obligations,fixHistory,gaps}`. Deferred sweep
  IDs retain caller ownership and Launch evidence; explicit requirement bindings associate those
  exact IDs with the caller's final source-bound measurement.
- Task 5: `checkEvidence:{records,gaps,requiredLiveChecks}` and complete six-field source-bound
  evidence, retaining task identity for required checks and exact kind/outcome distinctions.
- Task 10: classified runFailures plus deferred Recovery runFailure history. Consume classification,
  state, owner and gaps; pre-run diagnostic history is not compulsory repair.
- Tasks 13/14: shared projection exit 0 versus gap-bearing 3 versus unavailable 2/4; never accept
  empty key output by itself. Review collection records preserve invocation IDs and integrity;
  collection does not establish root acceptance. No second finding or metrics engine was added.

## TDD evidence

Before closure-contract changes, ran the three required suites. RED replay command from the
task worktree: `TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.6 node tests/super-code/replay-harness.mjs`.
Relevant output:

```text
[FAIL] Close, Ready and refill/recheck closures preserve caller root ownership
[FAIL] Launch durably records caller root ownership
[FAIL] caller-owned root stays open while eligible inner epics close to fixpoint
       {"code":2,"stdout":"","stderr":"usage: close-in-tree-epics EPIC_ID\n"}
[FAIL] manual no-jq fallback preserves root exclusion
2196 passed, 4 failed
```

Expected: caller ownership/flag did not exist. The standalone fixture still passed. RED status
command: `TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.6 bash tests/super-auto/test-scripts.sh`:

```text
[FAIL] source-bound required reviews, measurements, recovery and human gates control caller root acceptance
  expected: 0
  got:      1
1 failure(s)
```

The new acceptance mode was absent. Baseline contract lint passed after creating the task temp
root (the first parallel lint launch raced that mkdir and had no test result). During GREEN an
added call-site test wrongly assumed Ready itself closed epics; inspecting the actual builders
corrected the new fixture to assert both real closure callers and read-only Ready/recheck.
No existing assertion was removed or weakened.

Self-review against task 10 added a second RED case: a `run-introduced`, `verified` failure with
`gaps:["conflicting source history"]` incorrectly returned:

```text
AssertionError [ERR_ASSERTION]: {"owner":"super-auto","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","eligible":true,"pending":[],"gaps":[],"nonblockingFindings":[]}
0 !== 3
1 failure(s)
```

Retaining those run-owned attribution gaps fixed it; the final status suite below was rerun
after this bounded follow-up. No coordinator or skill wording changed after the final replay/lint.

## Final verification

All commands ran in the task worktree with this exact environment prefix:

```sh
HOME=/tmp/sp-bce79baa/super-plan-ufz.6/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.6/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.6/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.6/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.6/state TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.6
```

With that prefix, the final commands and results were:

```sh
node tests/super-code/replay-harness.mjs > evidence-task6-final-replay.log 2>&1
bash tests/super-auto/test-contract-lint.sh > evidence-task6-final-lint.log 2>&1
bash tests/super-auto/test-scripts.sh > .superpowers/task-super-plan-ufz.6/evidence-task6-final-status.log 2>&1
```

All test commands completed normally. The final replay and lint shell calls preserved and returned
the test exit code; final status also exited 0. Earlier root-level logs were subsequently moved to
the task's ignored `.superpowers/task-super-plan-ufz.6/` directory. Relevant final output:

```text
## caller-owned root acceptance: every closure prompt excludes root, empty frontier finishes normally
[PASS] run completes without throwing
[PASS] Close, Ready and refill/recheck closures preserve caller root ownership
[PASS] ownership exercised through every actual closure caller
[PASS] Ready and recheck remain read-only queries
[PASS] finished leaves return normally with an open caller-owned root
[PASS] Launch durably records caller root ownership
[PASS] deferSweep alone preserves standalone root ownership
[PASS] caller-owned root stays open while eligible inner epics close to fixpoint
[PASS] root is never passed to bd close under caller ownership
[PASS] manual no-jq fallback preserves root exclusion without contradictory root inclusion
[PASS] S then R closed across two passes; root reported closed
2202 passed, 0 failed

[PASS] source-bound required reviews, measurements, recovery and human gates control caller root acceptance
44 root acceptance assertions passed
All super-auto script tests passed

[PASS] skills/super-auto has no contract problems
[PASS] unapproved added field still fails
[PASS] changed legacy line format fails
[PASS] dropping an approved added field fails
[PASS] changed approved added format fails
All super-auto contract lint tests passed
```

Replay and mutation lint were the longer checks (minutes each); exact durations were not captured.
The status suite exercises the actual report-status/projection/helper scripts against fixtures;
replay simulates Workflow runtime behavior and exercises real fake-bd closure effects. These are
deterministic tests, not live fresh-agent acceptance. `git diff --check` passed. Both historical
2bf1d53 contract fixture files are byte-identical to the stacked base; only their declared additive
field/format union gained the new approvals record. The existing union/mutation harness was reused.

## Toolchain provenance

No install/setup is required for this zero-dependency Node/Bash repository. Node interpreter is
`/opt/homebrew/bin/node`; the actual runner `tests/super-code/replay-harness.mjs` and package-under-test
`skills/super-code/coordinator.js` resolve inside this task worktree. Replay reads that local source
through its AsyncFunction runtime. No live bd mutation or product probe used the real home directory.

## Files changed

- skills/super-auto/SKILL.md
- skills/super-auto/resume.md
- skills/super-auto/run-state.md
- skills/super-auto/scripts/report-status
- skills/super-code/coordinator-subagents.md
- skills/super-code/coordinator-workflow.md
- skills/super-code/coordinator.js
- skills/super-code/scripts/close-in-tree-epics
- tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt
- tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt
- tests/super-auto/test-scripts.sh
- tests/super-code/replay-harness.mjs
- evidence/super-plan-ufz.6/acceptance-scenarios.md

## Test hygiene

No quiescent post-run leaked match or surviving process. Required checks ran from the outside cwd
`/Users/alepar/AleCode/superpowers` with:

```sh
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.6 /tmp/sp-bce79baa/super-plan-ufz.6
```

An early check from inside the task worktree was correctly refused by ancestor protection and
was repeated from outside. One observation made before the concurrent final lint had settled
reported task-cwd PIDs 16880, 93450, 93453; the subsequent settled check had empty output/exit 0.
No process was killed while a test was still running. A narrow ps diagnostic was denied by the
sandbox (`operation not permitted: ps`), so it established no additional process identity. Final
post-status check also exited 0 with empty output. Final stop command uses the same roots without
`--check`; no `survived:` line remains. No name/pattern kill, Herdr write, subagent or tracker
mutation was performed.

## Assumptions, clarifications and remaining evaluation

No conflicting bead amendment was found. Coordinator clarification was applied: disclose and
preserve nonblocking deferred findings rather than requiring zero outstanding items; supported
acceptance relevance belongs to the existing caller assessment, one judgment per linked group,
with genuinely human decisions remaining human-owned. The new snapshot is an additive consumer
record under existing approvals, not a replacement recovery/finding engine. Canonical current
Recovery/check facts are reconciled from durable source records before a caller changes them.

Fresh-agent scenarios are prepared in `evidence/super-plan-ufz.6/acceptance-scenarios.md` for the
coordinator-owned post-change evaluation. Required live behavior evaluation, whole-epic final
reviews, final sweep and actual human acceptance remain outstanding at the enclosing run level.
The coordinator reported a separate task-8.3 collection diff-suffix correction in progress; this
task neither duplicates that fix nor replays its parent commits. No other deterministic check is
failed or unavailable. No integration worktree/user-checkout edits were made.


## Seam fix

Status:FIXED

Resolved `[rebase-conflict]` by running exactly:

```sh
git rebase --onto 549545dd696f02f4db7e5187f5fca7292f2c15a8 bee2526cd249be60632281f092ab48e1667b8747
```

Only task-owned root-acceptance commits `1a1360fb` and `232d3ca4` were replayed,
as `6e82092c` and `0bb280ed`. The old collector parent was not replayed.
The single conflict in `skills/super-auto/SKILL.md` was resolved by keeping the integrated
metrics/source-population paragraph and the independently reviewed caller-owned acceptance
block, both verbatim, separated by a blank line. Current collection/source-truth guidance
remains present. No new behavior or instruction rewrite was introduced in this seam pass.
`git range-diff` shows only the changed insertion context for the first commit; the second
commit is patch-equivalent. No integration ref, tracker state, task 17, or real epic acceptance
was changed; blocker `super-plan-8fn` remains for the parent to close after verified merge.

Actual rebased base: `549545dd696f02f4db7e5187f5fca7292f2c15a8`.
Actual committed head: `0bb280edcf5fc6a60499fdfdb090d1819a432963`.
Actual source tree: `87567e36e0dde251b05a76381473ff3330b50d22`.
The original implementation source was `232d3ca4adefafd4d757e8930fc10260159bafae`
(tree `4ebd490346563cdddf4144587934298550ecf1d5`) above stack base
`bee2526cd249be60632281f092ab48e1667b8747`; earlier report sections describe that round.
Exactly two task commits remain above the rebased base. Final `git status --short` is empty
and `git diff --check` passes. Both historical 2bf1d53 fixtures remain byte-identical.

Actual overlap between task changes and integrated changes since the original stack base:

- `skills/super-auto/SKILL.md` (the only conflicted file)
- `skills/super-auto/run-state.md`
- `skills/super-auto/scripts/report-status`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator.js`
- `tests/super-auto/test-scripts.sh`
- `tests/super-code/replay-harness.mjs`

### Combined verification

All commands ran from the assigned task worktree against the committed rebased source with:

```sh
HOME=/tmp/sp-bce79baa/super-plan-ufz.6/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.6/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.6/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.6/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.6/state TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.6
```

Exact test commands (with that environment prefix; the last three use `/usr/bin/time -p env`
before that prefix):

```sh
node tests/super-code/replay-harness.mjs > .superpowers/task-super-plan-ufz.6/seam-replay.log 2>&1
bash tests/super-auto/test-scripts.sh > .superpowers/task-super-plan-ufz.6/seam-status.log 2>&1
bash tests/super-auto/test-contract-lint.sh > .superpowers/task-super-plan-ufz.6/seam-lint.log 2>&1
bash tests/super-code/test-run-digest.sh > .superpowers/task-super-plan-ufz.6/seam-run-digest.log 2>&1
```

All four completed normally with exit 0. Final output excerpts:

```text
[PASS] 48 agent dispatches (got 48) — the doc's "Expected dispatch count" arithmetic
[PASS] 19 agent dispatches (got 19)
[PASS] 23 agent dispatches (got 23)
[PASS] Close, Ready and refill/recheck closures preserve caller root ownership
[PASS] finished leaves return normally with an open caller-owned root
[PASS] deferSweep alone preserves standalone root ownership
[PASS] caller-owned root stays open while eligible inner epics close to fixpoint
2273 passed, 0 failed

[PASS] source-bound required reviews, measurements, recovery and human gates control caller root acceptance
44 root acceptance assertions passed
[PASS] deterministic metrics separate repaired rejected deferred and outstanding
[PASS] partial projection retains supported metrics with explicit scope
[PASS] collection resumes after interrupted copy
[PASS] completed collection inventories the producer direct package
[PASS] conflicting direct package blocks collection completion
[PASS] supported rejected item stays off punch list while active defects stay open
All super-auto script tests passed
real 24.71

[PASS] unapproved added field still fails
[PASS] changed legacy line format fails
[PASS] dropping an approved added field fails
[PASS] changed approved added format fails
All super-auto contract lint tests passed
real 50.95

run-digest: all tests passed
real 14.97
```

Replay took 74.95 seconds measured from this new evidence log's creation to its final output.
It includes all three documented dryRun scenarios with expected dispatch counts 48/19/23,
plus actual helper caller/fake-bd closure coverage. Status tests combine all 44 acceptance
assertions with the integrated collection and metrics fixtures; run-digest verifies the
integrated source-fact transport. No behavior/signature was changed beyond the reviewed task
commits; their coordinator/helper callers are covered by replay and status suites.
These checks are deterministic/simulated evidence, not real epic acceptance or fresh-agent
behavior evaluation. Coordinator-owned live evaluations remain outstanding.

### Test hygiene

After each of the four suites, this exact check ran from outside the task worktree:

```sh
cd /Users/alepar/AleCode/superpowers
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.6 /tmp/sp-bce79baa/super-plan-ufz.6
```

Every check returned exit 0 with empty output: no leaked `match:` lines. The final stop command
with the same roots and no `--check` also returned exit 0 with empty output; no `survived:` lines.
No background process remains from this seam pass.

### Assumptions and concerns

Current bead and comments were reread; no amendments/comments exist. The named seam-review
file does not exist on disk, so the complete quoted `[rebase-conflict]` finding in the dispatch
was used. This did not prevent reproducing and resolving the exact reported single conflict.
Writing-skills and verification-before-completion guidance were applied without changing
reviewed behavior or spawning agents; fresh-agent acceptance stays coordinator-owned per dispatch.
No declined finding or permission refusal occurred. No merge, blocker closure, or actual
caller acceptance was performed.
