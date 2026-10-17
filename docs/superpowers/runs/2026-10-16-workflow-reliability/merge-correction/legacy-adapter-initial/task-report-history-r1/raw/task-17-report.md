Status:IMPLEMENTED

id: super-plan-ufz.14
base: 566f0a639c4cad8960bdeff7d62db219f9c1e8f5
head: 0a215b65a7847ff6e936de90e648be0306c90a2f
initialBase: 3968cd7bd703518023cdafc618cc65faa7a94cd7
testedHead: 68a1e7425ec3fe238fa51a7c02b5050b40b09095
testedTree: e308a5638d3a8cd1d096707d31162c5c0b47db66
testedSkillsTree: 200b0bc1eb2af88c3604aefcbe86a173075952fc
branch: task-super-plan-ufz.14
stacked: false
reopened: false
blockerBead: none
humanAction: none
worktree: /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.14

## Implemented

The two real-process replay fixtures now immediately register their positive owned child/orphan PIDs and use independent finally teardown. Teardown signals only those recorded PIDs, skips already observed exited children, waits for child exit events and removes fixture state after process cleanup. Missing ps stdout or another explicit inspection error gives an inspection-unavailable exception instead of a null.trim crash. The implementation preserves every existing ownership, no-kinship-expansion, stop/no-stop, dirty/unmerged and retention assertion. This addresses the task 2 [test-process-leak] and task 5 [test-process-cleanup] minors.

Added a cross-boundary replay check that feeds actual denied remove-task-worktree output into Workflow Finish, preserving its unknown fact and both actual retained resource identities while completed delivery and the caller's deferred measurement remain independent.

Added a real CLI integration fixture consuming settled original/ready-retry collection history through ordinary dispatch-text check-evidence, report-status --acceptance, scope-dispositions --project/--keys, and repeat report-status --collect. Simulated success retains the required live measurement; matching live-kind fixture evidence clears only that obligation; the historical finding still blocks acceptance until an explicit supported elsewhere-fixed disposition. Its key then leaves the punch list, repaired/rejected/outstanding counts become 1/1/2, original occurrence count is preserved and collection replay leaves bytes unchanged. Smoke measurements, support judgments and human decisions are explicit fixture data, not an actual smoke execution or human approval.

Fixed the existing report-verdict producer/parser fixture by adding its required persisted Launch invocationId. No assertion or production missing-ID guard was weakened.

Added verification.md with spec sections 1–5 mapped to actual producer/consumer evidence, Workflow simulation versus ordinary CLI execution, caller/standalone acceptance ownership, coordinator-owned behavior evidence, exact source identities and remaining limitations. No product source or behavior-shaping prose was edited by this task.

The required suite found a real earlier integration gap: the new resume-check dispatch was unclassified by run-profile. The parent routed it to super-plan-ufz.20, reviewed CLEAN and landed e5672164 via c7cdaf40. After committing this task's verified changes, I rebased cleanly onto integration 566f0a63 and reran affected checks. The exact refresh source delta is only run-profile.mjs plus test-run-profile.sh. The fix correctly treats this as run-level readiness observation, preserving label/suffix without inventing a task attempt or occupied slot; my earlier per-bead-association advisory was investigated and is not an additional requirement.

## Exact tests and output

All commands below start in the task worktree unless another cwd is stated. The runner executes each named test with that absolute cwd and this environment:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.14
HOME=/tmp/sp-bce79baa/super-plan-ufz.14/home
XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.14/config
XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.14/data
XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.14/cache
XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.14/state
```

Final refreshed command:

```sh
node evidence/super-plan-ufz.14/run-required-suites.mjs tests/super-code/replay-harness.mjs tests/super-code/test-run-profile.sh tests/super-code/test-dispatch-text.sh tests/super-code/test-run-profile-in-flight.sh tests/super-code/test-report-verdict.sh tests/super-code/test-run-digest.sh
```

Exit 0. Complete commands/exits/timings/log pointers: evidence/super-plan-ufz.14/final-required-results.json. Relevant output:

```text
2277 passed, 0 failed
[PASS] 48 agent dispatches (got 48) — the doc's Expected dispatch count arithmetic
[PASS] 19 agent dispatches (got 19)
[PASS] 23 agent dispatches (got 23)
run-profile: all tests passed                      # 325 PASS / 0 FAIL
dispatch-text: all tests passed
run-profile-in-flight: all tests passed           # 14 PASS / 0 FAIL
report-verdict: all tests passed                    # 153 PASS / 0 FAIL
run-digest: all tests passed
required suites: 6/6 passed; hygiene: 6/6 verified empty
```

Individual final suite durations: replay 26.401s, profile 17.339s, dispatch 10.170s, in-flight 5.237s, verdict 2.697s, digest 14.416s. Raw final-*.log files retain exact output formatting and all assertions; annotations above are explicit PASS-line counts, not combined independent test totals.

Full first required run:

```sh
node evidence/super-plan-ufz.14/run-required-suites.mjs
```

This executed all 23 required repository commands sequentially, retaining exact commands and complete outputs in evidence/super-plan-ufz.14/required-results.json and its log pointers. Result: 20/23 suites passed; 23/23 post-suite hygiene checks verified empty. Failures were profiler(1 assertion), verdict producer fixture(5 assertions) and packaging exit 9 described below. The Bash helper invocation audit passed after 559.911s; it was the only command taking several minutes and was not interrupted or replaced. Historical 1770 evidence was not relabeled as current.

The new auto integration fixture was also run directly with the environment above:

```sh
bash tests/super-auto/test-scripts.sh > evidence/super-plan-ufz.14/focused-auto.log 2>&1
```

Exit 0; the same suite passed again in the required run, 34.101s:

```text
integrated collection -> ordinary evidence -> caller gate -> disposition -> metrics passed
[PASS] integrated ready retry retains measurement and findings until independently supported outcomes
All super-auto script tests passed
```

After final documentation/evidence-only changes, all 331 skill/test source hashes still match the measured snapshot: evidence/super-plan-ufz.14/final-source-stability.json. No code changed after final measurements. Final git status --short was empty and git diff --check passed.

### Packaging qualification

The unchanged package script requires a .git directory and rejects linked worktrees' .git files before producing an archive. Both scripts/package-codex-plugin.sh and tests/codex/test-package-codex-plugin.sh are byte-identical to run baseline d84541ae; the provenance record contains their hashes. The initial linked-worktree exit 9 remains a failure, not a waived worktree pass.

Created a self-owned local standalone clone of exact tested commit 68a1e742 under /tmp/sp-bce79baa/super-plan-ufz.14/package-source, verified HEAD/tree/skills-tree equality, then ran with the same isolated environment:

```sh
cd /tmp/sp-bce79baa/super-plan-ufz.14/package-source
bash tests/codex/test-package-codex-plugin.sh > /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.14/evidence/super-plan-ufz.14/standalone-package.log 2>&1
```

Exit 0, `All Codex package archive tests passed`. Post-test canonical hygiene exited0 with empty output. The owned clone was removed afterward. See standalone-package-result.json and standalone-package.hygiene.log.

Combined evidence therefore supplies passing measurements for all 23 named commands: 16 unaffected initial suites, six refreshed affected suites, and package testing in a standalone checkout. This is not a claim that a fresh single 23-suite run passed in a linked worktree at the final commit. Parent phase 6 still owns its final sweep.

## RED/GREEN and baseline reproduction

Definitive RED used a detached throwaway checkout at 3968cd7bd703518023cdafc618cc65faa7a94cd7 under assigned temp/base, then removed it after checks. The final probe extracts the actual old fixture bodies, injects a helper exception or ps stdout unavailability, records owned PIDs independently, verifies an unregistered sentinel survives, and independently stops its own processes.

With the environment above, from the task worktree:

```sh
node evidence/super-plan-ufz.14/fixture-failure-probe.mjs /tmp/sp-bce79baa/super-plan-ufz.14/base > evidence/super-plan-ufz.14/fixture-base-red.log 2>&1
```

Exit 1, expected:

```text
FAIL worktree/helper-throws: leaked=[5054] retained-fixture-dirs=1 sentinel-preserved=true error=injected helper failure
FAIL worktree/ps-unavailable: leaked=[5785] retained-fixture-dirs=1 sentinel-preserved=true error=Cannot read properties of null (reading 'trim')
FAIL processes/helper-throws: leaked=[6335,6349,6352,6353,6354,6355] retained-fixture-dirs=1 sentinel-preserved=true error=injected helper failure
FAIL processes/ps-unavailable: leaked=[7200,7212,7214,7216,7218,7219] retained-fixture-dirs=1 sentinel-preserved=true error=Cannot read properties of null (reading 'trim')
fixture failure probe: 0 passed, 4 failed
```

This is the real fixture failure being fixed, not a fabricated cleanup-helper failure claim. An earlier pre-fix RED observed the same 1/1/6/6 leaks and is retained in fixture-red.log. The first prototype probe had an invalid Function parameter from spreading the fs namespace; it created no fixture-body processes, was corrected before the retained RED, and is not counted as defect evidence.

Final GREEN against committed changed fixture bodies at 68a1e742:

```sh
node evidence/super-plan-ufz.14/fixture-failure-probe.mjs > evidence/super-plan-ufz.14/fixture-final-green.log 2>&1
```

Exit 0:

```text
PASS worktree/helper-throws: leaked=[] retained-fixture-dirs=0 sentinel-preserved=true error=injected helper failure
PASS worktree/ps-unavailable: leaked=[] retained-fixture-dirs=0 sentinel-preserved=true error=process inspection unavailable for fixture PID 12202
PASS processes/helper-throws: leaked=[] retained-fixture-dirs=0 sentinel-preserved=true error=injected helper failure
PASS processes/ps-unavailable: leaked=[] retained-fixture-dirs=0 sentinel-preserved=true error=process inspection unavailable for fixture PID 12429
fixture failure probe: 4 passed, 0 failed
```

Raw logs contain exact PID spacing and assertions-before-error counts. Each assertion can fail on a concrete defect: an owned sleeper still alive, a fixture directory retained, a sentinel killed, an unexpected/missing exception, a dropped/changed unknown fact or resource path, lost deferred obligation, a silent retry clearing history, simulated evidence discharging live requirements, unsupported disposition clearing a key, wrong repaired/rejected counts, or non-idempotent collection bytes.

The three required-run failures were each repeated at exact task base with these commands (same environment, cwd temp/base):

```sh
bash tests/super-code/test-run-profile.sh
bash tests/super-code/test-report-verdict.sh
bash tests/codex/test-package-codex-plugin.sh
```

Outputs retained as base-profile.log(exit 1,1 failure), base-verdict.log(exit 1,5 failures) and base-package.log(exit 9,.git-directory guard). Reproducing the profiler issue at this task base exonerates only this task; the earlier run introduction remained owned and was repaired by parent task 20. The verdict fixture's first required failure is its RED evidence; final 153/0 is GREEN after adding invocation identity. No original assertion was deleted or loosened.

An intermediate new helper-output-to-Finish assertion expected the `unknown:` prefix in the already-classified result array and failed 2276/1. Source tracing showed the existing classifier strips only that prefix. The new assertion now compares the exact fact after that documented normalization; corrected pre-rebase replay passed 2277/0, then passed again after refresh. The intermediate output is preserved in pre-rebase-super-code--replay-harness.mjs.log.

## Files changed

- tests/super-code/replay-harness.mjs
- tests/super-auto/test-scripts.sh
- tests/super-code/test-report-verdict.sh
- docs/superpowers/runs/2026-10-16-workflow-reliability/verification.md
- evidence/super-plan-ufz.14/: four executable evidence utilities, source/hash/provenance JSON, complete initial/base/intermediate/final test logs and empty canonical hygiene logs. 98 total changed files including these preserved artifacts; product source changes from parent task 20 are already in base and are not this task's diff.

## Test hygiene

Canonical post-suite leak checks found no match: lines. The initial 23 and final 6 checks all exited0 with empty output. Independent probe oracles intentionally observed pre-fix leaks (14 PIDs in each retained RED run) and stopped every PID they explicitly created; PID lists are in the RED logs. These processes did not survive their probe command or reach the following canonical check. All final GREEN probe cases had zero live fixtures and zero retained fixture dirs, preserving the external sentinel until its owning oracle stopped it.

Final commands, from /tmp:

```sh
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.14 /tmp/sp-bce79baa/super-plan-ufz.14
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.14 /tmp/sp-bce79baa/super-plan-ufz.14
```

Both exit 0, empty output, recorded in final-stop.log and final-hygiene.log. survived: lines: none. Remaining owned background processes: none discovered under assigned roots. No process name/pattern kill or unrelated PID signal was used. The baseline worktree and standalone clone were removed. The task worktree is retained for parent review.

## Assumptions and amendments used

Read current bd show/comments and frozen Task 17 before implementation; current bead explicitly assigns task 2 failure-teardown follow-through. Parent additionally assigned task 5's same minor, fresh clean integrated base3968, no unmerged stack parents, preservation of all assertions/historical baselines, macOS/Linux qualification, and parent ownership of behavioral evaluation/final phase 6/code roast/review/acceptance. These compatible requirements were applied together. Later parent steering explicitly approved the scoped invocationId test-fixture correction and separately routed the profiler source fix; no out-of-surface source edit was made here.

All tests launched with assigned TMPDIR/HOME/XDG. The existing --tmp-validator fixtures retain unique /tmp/sp-<hex>[/child] paths, as the earlier task 2 report records parent approval for their interface-compatible layout; this task makes their teardown reliable without widening the validator. Existing untemplated native mktemp in the unchanged packaging test used Darwin per-user temp despite assigned TMPDIR, as its original failure log shows; its own EXIT trap removes that transient test root. No global process-absence claim is made beyond observed owned roots.

No setup/install step exists; no dependencies were installed. Node interpreter is /opt/homebrew/bin/node. Runner/helper/package source resolution is inside the assigned worktree, and standalone packaging uses the exact committed clone of it. No agents were spawned; no Herdr/tracker membership, acceptance, ACK or state mutation was performed. No actual root epic was closed.

## Concerns and parent-owned acceptance

- Native Linux /proc integration was not run on this macOS host. Deterministic forced-lsof denial fixtures do not establish native Linux process integration.
- Hosted Workflow and end-to-end live ordinary coordination were not run by this task. Replay is a simulated runtime; ordinary fixtures execute real helpers with controlled records/tracker replies. Synthetic live-kind smoke records are not actual live smoke measurements.
- Frozen behavioral AFTER remains 0 pass / 2 fail / 3 ambiguous for strict B4; its other 17 claims passed 5/5 each. Separate protocol-complete diagnostic final/control arms accept V9/refuse mismatched V10/reject artificial commits 5/5; installed guidance accepts V9 0/5. Original scores are unchanged, not pooled or relabeled. The supplement is a post-outcome diagnostic with fictional supplied observations, small samples and manual unblinded scoring, retaining its collateral answer errors. It does not prove live no-change completion or exact workflow-stage routing.
- Parent live review isolation is DONE_WITH_CONCERNS: observed owned Git/file/worktree checks passed 24/24; global ps observation was denied there, arbitrary detached-descendant absence is not established, assembler failure was controlled and task-review no-test policy was not exercised. These limits remain in verification.md.
- Selected frozen behavior full-file/excerpt entries were rechecked after profiler refresh: 17/17 match (eval-source-recheck.json). The exact profiler module/test hash delta is separately recorded, not hidden by a blanket equivalence claim.
- Packaging retains the pre-run linked-worktree limitation. Its exact-source standalone pass is qualified separately; no fresh single 23-suite linked-worktree success is claimed.
- Parent still owns final phase 6 sweep, whole-epic review/code roast, semantic evaluation assessment and required human acceptance. This task provides integration evidence and does not close those obligations.
