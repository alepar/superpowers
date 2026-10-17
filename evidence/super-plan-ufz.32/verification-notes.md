# Verification provenance

Task base: 1d0ab308f09598c8c2826cfbca2af119a631d37a. The prior untracked
outer-red.log was retained unchanged; its provenance is not inferred from its contents.
Current RED evidence is outer-red-resume.log and outer-final-red.log.

All current commands started from the absolute task worktree, except process hygiene checks,
which started from /Users/alepar/AleCode/superpowers to stay outside the checked roots. The
read-only user checkout was used only as that safe cwd. Exact test commands and configurations
are retained in check-records.json; stdout/stderr captures are the named files beside it.
Every test command completed with an actual exit result. No full repository suite was run.

## Source snapshots

Each tested source tree is a full Git tree from a separate temporary index. Test/runtime inputs
include the four changed instruction files, the regression and all baseline tracked source.
Evidence artifacts are not runtime inputs and are excluded from these snapshots. The real
index was never used for capture. Commands (run from the absolute task worktree):

```
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/red-index git read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/red-index git add tests/super-auto/outer-cleanup-r1.sh
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/red-index git write-tree
# e0ff9d1f9c2f33b4067a358b3b12f39fb6f2ca85

GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/green-index git read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/green-index git add skills/super-auto/SKILL.md skills/finishing-a-development-branch/SKILL.md skills/super-auto/run-state.md skills/super-auto/report-prompt.md tests/super-auto/outer-cleanup-r1.sh
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/green-index git write-tree
# 7450ea19db55d3a62688fef3847b3bb69fcec2d2 before physical temp-path correction
# repeated add/write-tree after correction: 7d188a10f723fda698c01cfe674ef16b8b43dc6f

GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/final-red-index git read-tree 1d0ab308f09598c8c2826cfbca2af119a631d37a
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/final-red-index git add tests/super-auto/outer-cleanup-r1.sh
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/final-red-index git write-tree
# ac97310f154d51d5b25565f4fb40c8e9bdda0498

GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/final-green-index git read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/final-green-index git add skills/super-auto/SKILL.md skills/finishing-a-development-branch/SKILL.md skills/super-auto/run-state.md skills/super-auto/report-prompt.md tests/super-auto/outer-cleanup-r1.sh
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/final-green-index git write-tree
# d11ce83faff4120212b1affc7eef3712205f5f05 with plain sleep process
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/final-green-index git add tests/super-auto/outer-cleanup-r1.sh
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/final-green-index git write-tree
# 599620b464c51575f159cf4d3bbf938328f76c4a with clean SIGTERM handler
```

The baseline rerun used a disposable archive of the unchanged task-base instruction files and
skills/super-code/scripts, plus the then-current regression, under the authorized temp root:

```
mkdir -p /tmp/sp-bce79baa/super-plan-ufz.32/baseline/tests/super-auto
git archive 1d0ab308f09598c8c2826cfbca2af119a631d37a skills/super-code/scripts skills/super-auto/SKILL.md skills/finishing-a-development-branch/SKILL.md skills/super-auto/run-state.md skills/super-auto/report-prompt.md | tar -x -C /tmp/sp-bce79baa/super-plan-ufz.32/baseline
cp tests/super-auto/outer-cleanup-r1.sh /tmp/sp-bce79baa/super-plan-ufz.32/baseline/tests/super-auto/outer-cleanup-r1.sh
```

## Results and measurement limits

Both RED runs reproduce ignored dirty-child destruction and fail at the missing phase-7
preconditions assertion. Later assertions were unmeasured in RED. The first changed-source run
and its diagnostic trace fail because Git records physical /private/tmp paths while the fixture
expected /tmp spellings; physicalizing the fixture temp root fixes the test defect. No unrelated
product failure is claimed. The intermediate sleep positive run passed but emitted Bash's
expected Terminated diagnostic; the final fixture uses a clean Node SIGTERM handler and final
output is pristine. Both runs of the existing super-auto suite passed unchanged.

The focused test performs real Git/helper operations, including final termination of its own
fixture process, but its documented caller decisions are simulations. check-records.json retains
both scopes explicitly. It does not measure whether an independent agent follows the revised
instructions. The full caller-owned bounded changed-instruction evaluation remains pending;
instruction-evaluation.md supplies cases and an honest before/after contract review, not results
from model repetitions. No Linux native process-discovery/termination claim is made.

Every assertion has a plausible failing production/contract value: a removed retain row or a
remove action in a refusal row; missing/misordered final checks or durable reporting; helper exit
other than 3/4/0 as applicable; lost parent/child/temp file or changed bytes; missing child Git
registration on refusal; remaining child after successful sweep; absent stopped-PID fact or a
survived/unknown/kept fact after final verification; nonzero clean-shutdown status; parent/temp
still present or outer registration surviving the permitted ordinary removal. The original Git
counterexample deliberately proves the opposite consequence without using caller resources.

## Test hygiene

After each of the thirteen test runs, the exact dispatched stop-run-processes --check command was
run from outside both task roots. Every check exited 0 with no match, survived, unknown or kept
lines. No test leaked a process. The live positive process was stopped by the same narrow helper
and reaped by its fixture before the process root was deleted. Final default-mode verification
is retained in final-hygiene.log. No caller worktree, temp resource or process was removed.

## Final wording clarification

Self-review clarified that *retained* dependent temporary resources block final cleanup; safe
disposable temporary roots can still exist while the helper verifies their processes. Otherwise
"no dependent temporary resources remain" could imply deleting them before verification. The
finisher uses the same retained-resource qualification. No other behavior or tested file changed.
The focused regression and unchanged existing suite were repeated on the clarified source:

```
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/verified-index git read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/verified-index git add skills/super-auto/SKILL.md skills/finishing-a-development-branch/SKILL.md skills/super-auto/run-state.md skills/super-auto/report-prompt.md tests/super-auto/outer-cleanup-r1.sh
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.32/verified-index git write-tree
# 6e108a5656d46e363f458dfb85edc8f23913189b
```

Final output paths are outer-verified.log and auto-suite-verified.log. These are the final
acceptance test runs; earlier captures and their exact historical source identities remain
retained. The final-hygiene.log before this clarification remains the earlier actual result;
final-hygiene-verified.log records the final checked-source process result.

## Required post-rebase verification

After implementation commit 76897a3c, the required task-branch rebase found that integration
had advanced from original task base 1d0ab308f09598c8c2826cfbca2af119a631d37a to
0981f0af2c1c5c0c9fe888ca5bdfa61de50a28ed (task .29 landing). Rebase completed without conflicts;
no integration ref or integration worktree was changed by this agent. The rebased task commit
was 712e3178cbb9d4500b566516af087c7f03f4bfae, with clean committed source tree
0072b6b7c817a2e7fc64943ffe061a729f88deaa, captured by `git rev-parse HEAD^{tree}`.

`git diff --exit-code 6e108a5656d46e363f458dfb85edc8f23913189b HEAD -- skills/super-auto/SKILL.md skills/finishing-a-development-branch/SKILL.md skills/super-auto/run-state.md skills/super-auto/report-prompt.md tests/super-auto/outer-cleanup-r1.sh`
confirmed byte-identical task instruction/test inputs after rebase. Both named checks were
repeated on the rebased source; final records/output are outer-rebased.log and
auto-suite-rebased.log, with final process cleanup in hygiene-rebased.log. Only evidence files
are updated after these runs; no further implementation change is claimed. The report records
the actual final committed head and the updated base separately from the tested source tree.
