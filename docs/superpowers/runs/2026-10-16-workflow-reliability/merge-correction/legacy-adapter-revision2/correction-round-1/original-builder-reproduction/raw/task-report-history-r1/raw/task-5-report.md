# Task super-plan-ufz.5 implementation

Status: IMPLEMENTED
Base: 4744895d50b9350ee5296a372d412af1e01b8533
Head: 6642a5403ad20dd47c963fa6b5dde7efd1094eac
Tested tree: 1eecad5d96cd955951340a71669135b77b53004c
Original fresh-cut base: b635541015f4bc0e037ef8621f8d01135ca2b22b
Branch: task-super-plan-ufz.5
Stacked: false

## Implementation

Added optional typed source-bound evidence and required-live-check identities to RESULT. Every RESULT dispatch records its own check facts separately from implementation/review status; Workflow returns the additive checkEvidence result. Malformed records become explicit gaps. Exact source tree, command, configuration, outcome, output location and kind survive transport. Matching simulated/fallback success never supplies a required live check, and failed/unavailable records remain distinct. Existing delivery routing is unchanged.

The ordinary path uses the same runtime validator/classifier through dispatch-text check-evidence, with retained JSON output. Implementer/fixer and reviewer reports keep the arrays durably; generated dispatch contracts state their shape. Both execution references document the same transport and independent evidence/acceptance boundaries. No new task-completion route, root gate, regression attribution, mandatory phase, or Recovery-record change was added. Landed stable review sources, cleanup outcomes and recovery records remain intact.

## Interfaces for consumers .6, .7 and .13

Producer RESULT fields are optional:

- evidence: [{sourceTree, command, configuration, outcome, location, kind}]. sourceTree is a full lowercase Git tree hash (40 or 64 hex digits). command/configuration/location are nonempty strings. outcome is pass|fail|unavailable; kind is live|simulated|fallback. Clean source uses HEAD^{tree}; dirty source uses an authorized temporary index snapshot with retained capture commands.
- requiredLiveChecks: [{sourceTree, command, configuration}]. The reviewer selects the expected identity against acceptance; no mechanical semantic inference is attempted.

Workflow return: checkEvidence = {records, gaps, requiredLiveChecks}. Each record has the six original fields plus coordinator-stamped task id and dispatch. Each required check has its identity/id/dispatch, outcome, and matches (indices into records). Matching requires the same task and exact tree/command/configuration plus kind live. Outcome describes evidence availability: pass when any matching live/pass exists; otherwise fail when matching live/fail exists; otherwise unavailable. All matching records remain present, including conflicting outcomes; caller/reviewer still judges coverage, relevance and acceptance. The classification is not a run-acceptance decision. Missing optional arrays produce no invented measurements; an explicitly required check without matching evidence remains unavailable. gaps reports malformed arrays/records and producer/field references.

Ordinary path: `bash <skillsRoot>/super-code/scripts/dispatch-text --ledger <ledger> check-evidence --results-file <replies.json>` consumes an array of `{dispatch, result}` replies and writes `dispatch/check-evidence.json` (or uses --out/--stdout). Its JSON shape equals Workflow.checkEvidence. Existing task reports/review artifacts retain source records; existing callers/consumers decide whether particular fields are required. Legacy producers remain compatible.

Concrete producer example (illustrative hash):

```json
{"evidence":[{"sourceTree":"d84541aed84541aed84541aed84541aed84541ae","command":"node smoke.mjs","configuration":"target=staging","outcome":"pass","location":"evidence/smoke.log","kind":"live"}],"requiredLiveChecks":[{"sourceTree":"d84541aed84541aed84541aed84541aed84541ae","command":"node smoke.mjs","configuration":"target=staging"}]}
```

## TDD evidence

Before production changes, the new replay fixtures ran with the same command scope: `TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.5 node tests/super-code/replay-harness.mjs` (outside the sandbox for real process-inspection fixtures). Relevant RED output:

```text
[FAIL] complete evidence survives both RESULT producers without changing provenance
[FAIL] measurement retains its producer separately from task outcome
[FAIL] matching live/pass discharges the explicitly required check
[FAIL] RESULT validates the separate kind and outcome vocabularies
[FAIL] simulated/pass leaves the required live check outstanding
[FAIL] fallback/pass leaves the required live check outstanding
[FAIL] required live fail remains fail
[FAIL] required live unavailable remains unavailable
[FAIL] another source tree, command or configuration cannot satisfy the check
[FAIL] malformed evidence produces an explicit gap
[FAIL] old producers remain compatible without invented evidence
1892 passed, 11 failed
```

These failures were expected: RESULT had no evidence fields and the return had no checkEvidence. The existing routing assertion still passed.

Dispatch RED command: `TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.5 bash tests/super-code/test-dispatch-text.sh`. Its new assertions initially failed because generated implement/review prompts lacked the shared field contract. After adding the ordinary classifier fixture, a second RED run failed with check-evidence exit 2 (the command did not exist), then failed the retained-JSON assertion. Existing dispatch clients continued to pass. The subsequent GREEN runs passed before commit and again after rebase.

## Final tests

All commands ran in the task worktree. Final execution prefix, verbatim:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.5 HOME=/tmp/sp-bce79baa/super-plan-ufz.5/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.5/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.5/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.5/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.5/state
```

With that prefix:

```sh
bash tests/super-code/test-dispatch-text.sh > /tmp/sp-bce79baa/super-plan-ufz.5/dispatch-final.log 2>&1
node tests/super-code/replay-harness.mjs > /tmp/sp-bce79baa/super-plan-ufz.5/replay-final.log 2>&1
```

Both final commands exited 0 after the clean rebase. Relevant dispatch output:

```text
[PASS] ordinary record classification exits 0
[PASS] ordinary results preserve provenance, failed/unavailable and required-live gaps
[PASS] implementer RESULT carries optional evidence
[PASS] implementer dispatch names the complete provenance contract
[PASS] review dispatch carries explicit live-check identities
[PASS] review dispatch carries the shared evidence contract
[PASS] the help's kinds all parse (missing: none)
dispatch-text: all tests passed
```

Relevant replay output:

```text
[PASS] complete evidence survives both RESULT producers without changing provenance
[PASS] measurement retains its producer separately from task outcome
[PASS] matching live/pass discharges the explicitly required check
[PASS] additive records preserve existing completion routing
[PASS] RESULT validates the separate kind and outcome vocabularies
[PASS] simulated/pass leaves the required live check outstanding
[PASS] fallback/pass leaves the required live check outstanding
[PASS] required live fail remains fail
[PASS] required live unavailable remains unavailable
[PASS] another source tree, command or configuration cannot satisfy the check
[PASS] malformed evidence produces an explicit gap
[PASS] old producers remain compatible without invented evidence
1935 passed, 0 failed
```

Each assertion can fail on a concrete changed production value: dropped/rewritten provenance, absent producer identities, non-live success supplying a live requirement, fail/unavailable collapse, mismatched tree/command/configuration acceptance, silently discarded malformed records, or altered legacy routing. The schema assertion fails if either enum changes or disappears. The ordinary fixture parses actual CLI output and checks provenance/count/outcomes rather than echoing an expected object.

`git diff --check 4744895d50b9350ee5296a372d412af1e01b8533..6642a5403ad20dd47c963fa6b5dde7efd1094eac` passed; final git status was empty. The zero-dependency runner tests/super-code/replay-harness.mjs and package-under-test skills/super-code/coordinator.js both resolve inside the assigned worktree. Node is the system interpreter /opt/homebrew/Cellar/node/26.9.0/bin/node; no project environment/install step exists for these direct script tests.

## Files changed

- skills/super-code/coordinator.js
- skills/super-code/implementer-prompt.md
- skills/super-code/task-reviewer-prompt.md
- skills/super-code/scripts/dispatch-text.mjs
- skills/super-code/coordinator-workflow.md
- skills/super-code/coordinator-subagents.md
- tests/super-code/replay-harness.mjs
- tests/super-code/test-dispatch-text.sh

## Test hygiene

The first sandboxed RED replay aborted in the existing remove-task-worktree fixture when its `ps` probe provided no stdout and `.trim()` threw. The task-owned sleep fixture remained:

```text
match: 64960 ? — cwd /private/tmp/sp-bce79baa/super-plan-ufz.5/rtw-ad2lDJ/.worktrees/integ/.worktrees/t1
stopped: 64960 sleep 300 — cwd /private/tmp/sp-bce79baa/super-plan-ufz.5/rtw-ad2lDJ/.worktrees/integ/.worktrees/t1
```

The authorized stop-run-processes helper stopped it. An initial --check from inside the owned worktree refused that root because it contained its own working directory; checks were then correctly run from the integration worktree (read-only cwd). Complete RED/GREEN/final runs used real process inspection. The final `bash <canonical skillsRoot>/super-code/scripts/stop-run-processes --check <assigned worktree> /tmp/sp-bce79baa/super-plan-ufz.5` exited 0 with empty output. No surviving process was reported. No other background processes were started.

## Assumptions and amendments

Read current `bd show super-plan-ufz.5 --json` and `bd comments super-plan-ufz.5`; there were no comments or amendments. Read the frozen brief/spec and the dependent .6/.7/.13 sections; the additive transport is compatible with their consumption boundaries. Source tree is represented by its actual Git tree identity, a narrower concrete form permitted by the brief. Configuration is an explicit string to make equality deterministic. Reports retain complete records; no new Recovery kind or ledger parsing schema was introduced.

Applied writing-skills and test-driven-development: the existing baseline report documents B1/B2/B5 passing 5/5 in both arms. Therefore prompt changes are structural record slots and vocabulary, with no new generic judgment admonitions. Deterministic RED evidence establishes the missing mechanical contract; parent owns post-change fresh-agent classification evaluation. Verification-before-completion informed final checks.

## Concerns and remaining evaluation

No required deterministic check remains failed or unavailable. Replay is a simulated Workflow runtime; ordinary dispatch fixtures exercise the real CLI against fixtures, not a live multi-agent run. Parent-owned post-change fresh-agent evaluation remains outstanding and must not be reported as passed by this implementation.

Classification cases ready for that evaluation: complete live/pass supplies only its exact source/command/configuration; simulated/pass and fallback/pass remain insufficient for an explicitly live criterion; live/fail differs from unavailable; mismatched source/configuration/command remains unavailable; CLEAN review/finished implementation does not itself establish missing measurements or caller acceptance. Preserve all conflicting outcome records and ask for semantic coverage rather than accepting a green existence classification alone. Use the unchanged baseline B case and actual frozen changed source for comparison, as the parent directs.
