# Task super-plan-ufz.7 implementation

Status: IMPLEMENTED
Branch: task-super-plan-ufz.7
Original fresh-cut base: c70245ce4e73d3895062cdc42515c05a50a38844
Final base: 15084177065dbaaa4eff1992cfb2fbfb56cee5f8
Final head: e1591cca16ce4a4d7f96f865e0ba3fb6e03ea5c6
Tested tree: 1cf494abcac471f52d2f5309064579dd66a50f47
Stacked: false

## Implementation

Added optional failure/check associations to the existing RESULT path. They reference indices in the same reply's existing source-bound evidence array; no second evidence schema or compulsory baseline phase was introduced. Workflow retains these associations and their evidence in existing Recovery deferred records, independent of latest task status. It returns reduced runFailures alongside checkEvidence and recovery.

A passing recorded run baseline plus a failing introducing source retains the source-supported task owner. A later task can establish its own base exoneration without releasing that owner. A recorded failing run-start source is classified pre-run, without manufacturing a new repair owner. Missing, unavailable, non-live, differently configured or unassociated measurements become explicit gaps. Same display text with different command/configuration stays separate. Contradictory outcomes at the same tree cannot establish a source introduction. Known ownership survives clean retries and incomplete/conflicting later comparisons. Explicit linked live/pass fix verification marks the measurement obligation verified while preserving introducing history; a later linked failing observation reopens it.

Reviewer handoffs provide a bounded owner preview plus the complete ledger pointer; the reviewer checks temporal/source relevance against source ranges and fix history. Ordinary-subagent instructions use the same association/Recovery contract and retain source references separately from task completion. Super-auto preserves open run-regression/gap references in existing parked degraded-verdict records across bucket replacement, re-entry and existing repair passes. These records never use the broad resolves-on: sweep shortcut. Remaining surfaces ownership and evidence independently of a later task's exoneration. Pre-run failures do not automatically become this run's repair scope, and existing retry caps are unchanged.

No task-completion route, root acceptance, no-change behavior, finding lifecycle, Recovery kind or run-state top-level field changed. Both historical run-state fixture files remain byte-for-byte unchanged. Because existing parked fields carry these facts, no added-field/additional-format goldens or lint-schema amendments were needed. Existing contract lint passed, including mutation checks.

## Interface for consumers

Optional RESULT.failureAttribution is an array of associations:

- failure, command, configuration: nonempty strings; the complete triple identifies one recorded failure.
- observed, runBaseline, taskBase, verification: optional zero-based indices into THIS reply's evidence array. These associate the failing source, recorded run-start measurement, task-base comparison, and fixed-source measurement respectively.
- introducedBy: optional introducing task id, selected only from supported source/fix history.

Exact sourceTree/command/configuration/outcome/location/kind records remain the landed .5 schema. Runtime checks command/configuration, source identity shape, kind and outcome. Reviewers remain responsible for establishing that each source is the claimed baseline/base/fix and measures the same failure.

Persistence uses the landed .4 Recovery envelope, kind deferred, id `run-failure:` plus JSON.stringify([failure,command,configuration]). data.runFailure contains {failure,command,configuration,history}; history contains {task,dispatch,claim,evidence} events. Each update preserves earlier events. Recovery evidence points to original output locations, or the producer dispatch when none exists. Malformed histories become Recovery gaps without replacing a known valid record. Existing oversized-digest handling remains an explicit source-pointer gap.

Workflow.runFailures returns id, failure, command, configuration, classification (run-introduced|pre-run|gap), owner (or null), state (open|verified), separate taskExonerations, comparisons, gaps and evidence pointers. A pre-run diagnostic record must not be interpreted as a compulsory repair merely because its history is carried in Recovery; consumers judge classification/state and the relevant obligation. Conflicting source histories preserve known ownership with a reconciliation gap rather than guessing which baseline is authoritative.

## TDD evidence

All commands ran from the assigned task worktree with the isolated environment below. Before production changes:

`node tests/super-code/replay-harness.mjs > evidence-task7-red.log 2>&1`

Exit 1. Relevant expected RED output:

```text
[FAIL] passing run baseline and recorded introducing task establish A ownership
[FAIL] run attribution retains source-bound evidence in existing Recovery records
[FAIL] B base exoneration retains A run ownership after durable re-entry
[FAIL] missing baseline on later comparison stays explicit alongside known ownership
[FAIL] clean retry without linked verification cannot erase A obligation
[FAIL] failure evidenced before run remains historical without a manufactured fix owner
[FAIL] missing run baseline reports attribution gap rather than invented success
[FAIL] same failure display text with different configuration never inherits an unrelated owner
[FAIL] unassociated command cannot overwrite existing ownership
[FAIL] linked live fix verification resolves obligation while retaining introducing owner history
[FAIL] simulated fix verification cannot resolve live run regression
[FAIL] review dispatch carries attribution contract and existing run owner
1953 passed, 12 failed
```

Expected cause: baseline coordinator had no associations, durable attribution or runFailures result. Existing routes still ran. The initial caller RED command was:

`bash tests/super-auto/test-scripts.sh > evidence-task7-auto-red.log 2>&1`

Exit 1; existing report-status behavior retained the constructed parked qualifiers, but the three operative contract assertions failed:

```text
[FAIL] SKILL.md carries regression and missing-baseline obligations
[FAIL] run-state.md carries regression and missing-baseline obligations
[FAIL] report-prompt.md carries regression and missing-baseline obligations
3 failure(s)
```

The first GREEN replay passed 1965/0; the caller suite and contract lint passed. Self-review expanded coverage for same-tree contradictions, different commands, unavailable baseline, malformed histories, combined before/after measurement, repeated exoneration and later recurrence. Final rebased checks below supersede those intermediate results.

## Final verification

Every final command ran from:

`/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.7`

Each command had this exact execution prefix:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.7 HOME=/tmp/sp-bce79baa/super-plan-ufz.7/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.7/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.7/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.7/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.7/state
```

With that prefix, these exact final commands all exited 0 on final head e1591cca16ce4a4d7f96f865e0ba3fb6e03ea5c6:

```sh
node tests/super-code/replay-harness.mjs > evidence-task7-replay-final.log 2>&1
bash tests/super-code/test-dispatch-text.sh > evidence-task7-dispatch-final.log 2>&1
bash tests/super-auto/test-scripts.sh > evidence-task7-auto-final.log 2>&1
bash tests/super-auto/test-contract-lint.sh > evidence-task7-lint-final.log 2>&1
```

Relevant replay output:

```text
[PASS] passing run baseline and recorded introducing task establish A ownership
[PASS] run attribution retains source-bound evidence in existing Recovery records
[PASS] B base exoneration retains A run ownership after durable re-entry
[PASS] missing baseline on later comparison stays explicit alongside known ownership
[PASS] clean retry without linked verification cannot erase A obligation
[PASS] failure evidenced before run remains historical without a manufactured fix owner
[PASS] missing run baseline reports attribution gap rather than invented success
[PASS] same failure display text with different configuration never inherits an unrelated owner
[PASS] unassociated command cannot overwrite existing ownership
[PASS] linked live fix verification resolves obligation while retaining introducing owner history
[PASS] simulated fix verification cannot resolve live run regression
[PASS] opposite outcomes at one source tree cannot invent an introducing task
[PASS] same failure display text with different command remains independently unattributed
[PASS] unavailable baseline is never treated as passing
[PASS] malformed associations and durable histories remain explicit gaps without discarding known owner
[PASS] one before/after reply preserves introduction and linked verified fix independently
[PASS] repeated valid local exoneration stays distinct without a spurious attribution gap
[PASS] later linked failing observation reopens repair while retaining introducing history
[PASS] review dispatch carries attribution contract and existing run owner
1972 passed, 0 failed
```

The replay also ran the documented dryRun scenarios and matched canonical 48, fix-pass-blocked 19 and parked 23 dispatches. No template-literal count changed. Replay includes actual digest/process script fixtures but simulated Workflow agent replies.

Other final output:

```text
[PASS] the help's kinds all parse (missing: none)
dispatch-text: all tests passed
[PASS] caller run.md accepts durable regression and gap pointers in existing parked records
[PASS] clean latest buckets preserve run owner and attribution gap qualifiers
[PASS] SKILL.md carries regression and missing-baseline obligations
[PASS] run-state.md carries regression and missing-baseline obligations
[PASS] report-prompt.md carries regression and missing-baseline obligations
All super-auto script tests passed
[PASS] report-prompt without the null reviewPath rule fails
All super-auto contract lint tests passed
```

The new reducer assertions fail on concrete production regressions: dropping/changing owner, accepting absent/non-live baseline as success, allowing a mismatched command/configuration to inherit ownership, erasing the history on clean retry, treating simulated fix evidence as live, discarding malformed input silently, or clearing a recurrence. Caller behavior assertions fail if report-status loses the existing parked owner/gap qualifiers despite clean latest buckets. Contract assertions enforce the operative instruction seam; they are not claimed as agent behavior tests.

`git diff --check 15084177065dbaaa4eff1992cfb2fbfb56cee5f8...HEAD` passed. The historical fixture diff was empty. System node resolves through /opt/homebrew/bin/node; the zero-dependency test script and package-under-test coordinator.js resolve inside the assigned task worktree. There is no project install/sync step for these direct script tests.

## Rebase and self-review

Committed the task, then rebased onto 15084177065dbaaa4eff1992cfb2fbfb56cee5f8. One report-prompt.md table hunk conflicted with the landed profiler task. Resolution retained the integration's full new planning-aware Gotchas/profile row and this task's Remaining owner/gap row. Other overlaps auto-merged. Re-ran all four focused commands after rebase. Final task delta remains nine files, 268 insertions and 7 deletions. No integration worktree edits, merges, tracker changes, agents or Herdr writes were performed. Test logs are removed after preserving evidence here; task git status is clean.

## Files changed

- skills/super-code/coordinator.js
- skills/super-code/task-reviewer-prompt.md
- skills/super-code/coordinator-workflow.md
- skills/super-code/coordinator-subagents.md
- skills/super-auto/SKILL.md
- skills/super-auto/run-state.md
- skills/super-auto/report-prompt.md
- tests/super-code/replay-harness.mjs
- tests/super-auto/test-scripts.sh

## Test hygiene

Completed test runs' checks and the final stop all exited 0 with empty output; no leaked process or survivor remained. One prematurely ordered check ran after the caller RED suite while the replay RED suite was still deliberately running, and listed that active run's processes:

```text
match: 47379 node tests/super-code/replay-harness.mjs — cwd <assigned task worktree>
match: 76175 ? — cwd /private/tmp/sp-bce79baa/super-plan-ufz.7/rtw-h8vabr/.worktrees/integ
match: 76206 ? — cwd /private/tmp/sp-bce79baa/super-plan-ufz.7/rtw-h8vabr/.worktrees/integ
```

These were active replay/fixture processes, not post-run leftovers; the completed replay's subsequent check was empty. Subsequent suites ran sequentially with checks after completion. No process had to be stopped and no survived line was produced. All checks and the final stop ran from outside the owned roots, using:

```sh
cd /Users/alepar/AleCode/superpowers
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.7 /tmp/sp-bce79baa/super-plan-ufz.7
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.7 /tmp/sp-bce79baa/super-plan-ufz.7
```

## Assumptions and amendments

Read current bd show super-plan-ufz.7 --json and bd comments super-plan-ufz.7 before implementation: description/acceptance matched the frozen task, with no comments/amendments. Read the landed task-4/task-5 reports and their actual code contracts. Applied compatible .4 Recovery and .5 source-bound checkEvidence interfaces. No replacement engine or finding-ledger lifecycle was introduced. The parent dispatch explicitly assigns fresh-agent attribution evaluation and the broad sweep to the coordinator; this agent owns deterministic fixtures and changed examples. Applied writing-skills, TDD and verification-before-completion within that boundary.

The reviewer must establish source chronology and semantic check correspondence. A source-tree hash plus a display label alone cannot prove introduction; the runtime deliberately does not infer unrecorded historical measurements. Conflicting histories are exposed as gaps with known ownership preserved.

## Fixture artifacts and parent-owned behavior evaluation

The executable A/B, pre-run and absent-baseline artifacts are in tests/super-code/replay-harness.mjs under the scenario `run attribution retains introducing owner independently of task-base exoneration`. The existing temporary run.md caller fixture is in tests/super-auto/test-scripts.sh under `run attribution: caller retention`. These use synthetic tree identities and canned agent replies: even a fixture record whose kind is live is simulated test input, not a real live product measurement.

Concrete scenario for a fresh reviewer/coordinator evaluation:

1. The same exact command `node smoke.mjs --case F` and configuration `target=staging` passes at recorded run-start source a*40, fails after task A at b*40, and fails at task B's base b*40 and head c*40. Retain original output locations run-start.log/A.log/B-base.log/B.log and the reviewed A source range. B can be CLEAN/exonerated against its base while run owner bd-A remains open and assigned for repair.
2. Re-enter with those Recovery records and a clean latest task result or replacement code buckets. The same introducing owner remains. A missing baseline in B's new local comparison is an explicit gap, not an erasure of earlier evidence.
3. Change the recorded run-start outcome to live/fail: this failure is pre-run and must not automatically create a goal repair assignment. Remove usable run-start evidence instead: report an attribution gap and invent neither a passing baseline nor exoneration of a known owner.
4. Reuse display key F with a different command or target=local: it cannot inherit the staging owner's identity. Supply simulated/pass instead of live/pass fixed-source evidence: it cannot discharge the live repair. Supply linked live/pass evidence at reviewed fixed source e*40: verified while retaining the A history.

The actual fixture association is {failure:'F',command:'node smoke.mjs --case F',configuration:'target=staging',observed:1,runBaseline:0,introducedBy:'bd-A'} beside [run-start live/pass, A live/fail]. The later B association references its own [B-base live/fail, B-head live/fail] array with observed:1 and taskBase:0, leaving runBaseline/introducedBy omitted. This is sufficient to reproduce the deterministic case without machine paths.

Fresh-agent evaluation, ordinary-agent compliance under pressure, and the enclosing whole-run sweep remain parent-owned and unmeasured here. All required task-local deterministic checks passed; no failed/unavailable deterministic check, permission rejection, blocker or humanAction remains.


## Fix pass

Status: FIXED
Task: super-plan-ufz.7
Base: 15084177065dbaaa4eff1992cfb2fbfb56cee5f8
Reviewed implementation head: e1591cca16ce4a4d7f96f865e0ba3fb6e03ea5c6
Fix head: 340d4ef85fbe59dbf55950d3c5e6c44df5d11d28
Tested tree: 4790bbe2d53e9418423b55cc9f9e399ddc6757ec

### Finding and correction

Verified the Important finding against the current bead, brief, retained Recovery history and reducer. A verification-only reply omitted `observed`, so the original guard accepted b/live/pass despite the retained b/live/fail observation for the exact same command/configuration and run-failure identity. The deterministic reproduction retained owner bd-A but incorrectly returned `state:verified` with no contradiction gap, allowing caller qualification to disappear.

The reducer now collects failing source trees only from validated live records linked by observed/runBaseline/taskBase/verification associations for this failure's exact command/configuration. After reducing the complete retained history, it checks every otherwise supported passing verification against these linked failures. A conflicting active verification leaves the owner intact and the obligation open, and records a contradiction gap naming the immutable source tree and verification dispatch. Earlier contradictory attempts remain gaps even after a different supported fixed source verifies the repair. Later associated failure evidence can also reopen a conflicting earlier verification. No automatic repeat-measurement reconciliation was added.

Only skills/super-code/coordinator.js and tests/super-code/replay-harness.mjs changed in this fix. No instruction content, evidence schema, root acceptance rules, ordinary-agent path, run-state fields or integration branch changed. No findings declined or resolved by evidence alone.

### RED/GREEN evidence

All test commands ran from the assigned task worktree:

`/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.7`

Each command used the exact isolation prefix:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.7 HOME=/tmp/sp-bce79baa/super-plan-ufz.7/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.7/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.7/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.7/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.7/state
```

Before the production correction:

```sh
node tests/super-code/replay-harness.mjs > evidence-task7-fix-red.log 2>&1
```

Exit 1, expected behavior failures (not execution errors):

```text
[FAIL] verification-only pass at retained failing source preserves open owner
[FAIL] verification-only same-source contradiction exposes source-bound reconciliation gap
[FAIL] durable clean re-entry retains same-source contradiction and open owner
[FAIL] verification cannot bypass contradictory associated runBaseline outcome
[FAIL] verification cannot bypass contradictory associated taskBase outcome
1974 passed, 5 failed
```

The initial correction passed 1979/0. Self-review then added history-order coverage. Command `node tests/super-code/replay-harness.mjs > evidence-task7-fix-order-red.log 2>&1` exited 1 with:

```text
[FAIL] supported different-source repair retains earlier verification contradiction in history
1980 passed, 1 failed
```

That RED showed the first correction checked only the latest verification and could drop an earlier contradiction gap when a genuinely different fixed source passed. The final correction checks every retained verification and only reopens the currently active conflicting one.

Final exact commands with the isolation prefix above, all exit 0 on the committed tree:

```sh
node tests/super-code/replay-harness.mjs > evidence-task7-fix-replay-final.log 2>&1
bash tests/super-code/test-dispatch-text.sh > evidence-task7-fix-dispatch-final.log 2>&1
bash tests/super-auto/test-scripts.sh > evidence-task7-fix-auto-final.log 2>&1
bash tests/super-auto/test-contract-lint.sh > evidence-task7-fix-lint-final.log 2>&1
```

Relevant final output:

```text
[PASS] verification-only pass at retained failing source preserves open owner
[PASS] verification-only same-source contradiction exposes source-bound reconciliation gap
[PASS] durable clean re-entry retains same-source contradiction and open owner
[PASS] verification cannot bypass contradictory associated runBaseline outcome
[PASS] verification cannot bypass contradictory associated taskBase outcome
[PASS] supported different-source repair retains earlier verification contradiction in history
[PASS] later associated failure reopens contradictory earlier verification
[PASS] linked live fix verification resolves obligation while retaining introducing owner history
[PASS] simulated fix verification cannot resolve live run regression
[PASS] one before/after reply preserves introduction and linked verified fix independently
1981 passed, 0 failed

dispatch-text: all tests passed
All super-auto script tests passed
All super-auto contract lint tests passed
```

The full replay also passed the documented dryRun scenarios with canonical 48, fix-pass-blocked 19 and parked 23 dispatches. Producer/dispatch checks and super-auto caller/reporting/contract suites cover consumers of the returned run state. No existing test expectation was deleted, skipped, loosened or changed. `git diff --check` passed.

Each new behavioral assertion has a concrete failure value: a missing/changed owner or `state:verified` for contradictory evidence; an absent source-specific contradiction gap; a clean durable retry losing owner/open/gap; an associated baseline/task-base conflict silently verifying; a valid different-source repair failing to verify or dropping the earlier contradiction gap; or a later associated failure leaving earlier verification closed. The two added no-throw checks fail on reducer execution errors. All assertions executed in the final run.

### Test hygiene

Every completed test run (initial RED, first GREEN, history-order RED, final replay, dispatch, super-auto scripts, contract lint) was followed sequentially by the mandated `stop-run-processes --check` command. All seven checks exited 0 with empty output: no match line, leaked process or survivor. Final `stop-run-processes` also exited 0 with empty output. Checks and final stop ran from `/Users/alepar/AleCode/superpowers`, outside the owned task/temp roots, targeting only the assigned task worktree and `/tmp/sp-bce79baa/super-plan-ufz.7`. No processes needed stopping. Scratch output is removed after preserving relevant evidence here.

### Assumptions and concerns

Read current `bd show super-plan-ufz.7 --json` and `bd comments super-plan-ufz.7` before changes. There were no amendments, triage comments or unresolved requirement conflicts. The fix does not presume a historical pass or infer reconciliation of nondeterministic measurements; contradictory immutable-source outcomes remain explicit. All work was in the assigned task worktree, with this report as the sole authorized outside write. No rebase, integration write, merge, tracker mutation, spawned agent or Herdr write occurred. No permission refusals or human actions remain.

These are deterministic simulated Workflow fixtures, including synthetic records labeled live; they establish reducer/caller mechanics, not actual agent behavior or live product measurement. The pending fresh-agent attribution evaluation and whole-run acceptance remain parent-owned and unmeasured by this fix pass.
