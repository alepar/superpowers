Status: IMPLEMENTED

# Task super-plan-ufz.12 — IMPLEMENTED

- id: super-plan-ufz.12
- status: IMPLEMENTED
- base: caf187cef8d1769da6184de42332a31bc7e30dcb
- head: 26cc469e06bab7b6dad98cb726326f949d1c486f
- original base: 15084177065dbaaa4eff1992cfb2fbfb56cee5f8
- stacked: false
- reopened: false
- branch: task-super-plan-ufz.12
- worktree: /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.12
- blockerBead: none

## Implementation

Resume now reconciles active pending-closure Recovery records before affected admission. A single read-only `resume-check:<task>` dispatch verifies the exact persisted 40-character SHA through `already-merged` and independently reads task/review/blocker tracker statuses. A verified landing seeds the existing closure-only machinery with the original head/range and associated bead IDs. No implementation, task review or merge is dispatched again. Already-closed associated beads need no closure repair; partially open sets use the existing close-only step, which independently checks statuses and closes only observed-open beads.

Unknown/denied Git or tracker observations, incomplete/contradictory status sets, missing exact heads and Git/ledger disagreement retain the original obligation/evidence and persist a scoped `hold` record with ID `resume:<task>`. No additional observation retry or implementation attempt is spent. Later successful reconciliation clears only this reconciler's own hold. Tracker-only Finish reconciliation cannot promote an affected Git mismatch to completed.

Other persisted holds and explicitly scoped deferred obligations gate admission for the affected task and its consumers. `merge-lane` holds all admission; task holds can name their task via ID or `data.taskId`; scoped hold/deferred records can use `data.affectedIds`. Unrelated eligible work continues, and unresolved restored admission obligations return `recovery-held`. Unscoped caller-owned sweeps and additive `data.runFailure` diagnostics remain visible obligations without automatic generic repair routing.

All-closed recovery appends its clear(s) and completion together through the existing writer, and updates in-memory obligations only after that append is confirmed. An unavailable append retains the original obligation and explicit hold. Pending-closure updates retain additive top-level/data fields and original evidence. Fix history is neither reduced to the latest Task outcome nor replayed as repair work. Workflow and ordinary-subagent references describe the same ordering, scope and bounded observations.

No ledger-digest change was needed: task 4's landed bounded transport already preserves the required records. No replacement journal, tracker schema or retry engine was added. Historical dryRun/golden fixture blocks remain byte-for-byte unchanged; additive current scenarios extend the replay harness. One existing Recovery round-trip scenario supplies the new observation/closure answers without changing its assertions or expected values.

## Interfaces

Consumes task 4's `Recovery: {version:1,id,kind,operation,reason,evidence,data}` contract and bounded gaps unchanged. Existing `recovery: {obligations,fixHistory,gaps}` return shape is retained. A new read-only dispatch response is `{landed:boolean,closed:string[],open:string[],error?:string}`; missing/incomplete lists remain unknown. The exact pending-closure head is authoritative only after the Git check succeeds, and tracker closure remains a separate observation.

Generated reconciliation hold data includes `taskId`, `recoveryId`, and the current observation when available. Existing holds/deferred obligations have no universal automatic release condition; their owner supplies an explicit matching clear with evidence. Only `resume:<task>` holds are automatically cleared by successful fresh reconciliation. Unknown/additive record fields survive decoding and pending-closure updates. Task 7's `deferred.data.runFailure` diagnostic contract remains intact and does not create generic mandatory repair work.

Read the current bead and comments, task 4's landed record/digest report, task 5's independent evidence interface, the spec, and existing already-merged/closure/admission paths. Invocation identity handling from landed producer 8.1 is unchanged.

## Tests and TDD

All commands below ran in the task worktree named above. Test temporary state used `/tmp/sp-bce79baa/super-plan-ufz.12`.

Initial RED before resume production changes:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 node tests/super-code/replay-harness.mjs > evidence-task12-red.log 2>&1
```

Exit 1:

```text
[FAIL] Recovery-only landing completes without repeated implementation/review/merge
[FAIL] only observed-open closure dispatches repair
[FAIL] resume verifies exact original SHA and all associated tracker statuses
[FAIL] confirmed recovery is drained through durable clear records
[FAIL] mismatch or unavailable observation holds affected work even when tracker claims closed
[FAIL] recovery observation is bounded to one attempt with explicit held stop
[FAIL] unresolved recovery preserves additive record data
[FAIL] Git/tracker discrepancy or unavailable status remains explicit
[FAIL] hold holds only affected work while unrelated work proceeds
[FAIL] deferred holds only affected work while unrelated work proceeds
[FAIL] persisted merge lane hold gates resumed admission until evidence clears it
1966 passed, 24 failed
```

These failures were expected: the baseline decoded Recovery data but did not reconcile pending closures or use restored obligations for admission. First GREEN after implementation/compatibility corrections: `1990 passed, 0 failed`.

Additional interrupted-clear RED:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 node tests/super-code/replay-harness.mjs > evidence-task12-durability-red.log 2>&1
```

Exit 1:

```text
[FAIL] unconfirmed recovery clear append remains unresolved after writer drain
2010 passed, 1 failed
```

Expected failure: the initial implementation cleared the in-memory obligation before its append was confirmed. Combined clear/completion appending with confirmation before reduction fixed this. GREEN: `2011 passed, 0 failed`.

Additional incomplete-observation RED:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 node tests/super-code/replay-harness.mjs > evidence-task12-incomplete-red.log 2>&1
```

Exit 1:

```text
[FAIL] run completes without throwing
TypeError: Cannot read properties of undefined (reading 'includes')
[FAIL] recovery observation is bounded to one attempt with explicit held stop
[FAIL] unresolved recovery preserves additive record data
[FAIL] Git/tracker discrepancy or unavailable status remains explicit
2014 passed, 4 failed
```

Expected failure: a reply missing its closed-status array was not safely classified as unknown. Explicit array guards fixed it. GREEN before rebase: `2018 passed, 0 failed`.

Final verification on head `26cc469e06bab7b6dad98cb726326f949d1c486f`, after clean rebase onto `caf187cef8d1769da6184de42332a31bc7e30dcb`:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 node tests/super-code/replay-harness.mjs > evidence-task12-rebased.log 2>&1
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 bash tests/super-code/test-dispatch-text.sh > evidence-task12-dispatch-rebased.log 2>&1
```

Both commands exited 0:

```text
2074 passed, 0 failed
[PASS] the help's kinds all parse (missing: none)
dispatch-text: all tests passed
```

The rebased count includes the landed process-recurrence task's checks. Replay includes all three documented dryRun scenarios and their expected dispatch counts; no historical expected count or JSON fixture changed. The dispatch-text check covers callers of the coordinator prompt helpers. `git diff --check` passed.

Additive scenarios cover Recovery-only landing with empty readiness and a closed root; fully/partially closed tracker sets; exact original SHA/association lookup; second restart after durable clear; Git mismatch; denied Git/tracker lookups; null and partial observations; release of a persisted reconciliation hold after later verification; failed closure metadata preservation; interrupted clear persistence; scoped hold/deferred admission with unrelated work; merge-lane holds; and diagnostic runFailure preservation. Assertions fail on duplicate implementation/review/merge or closure repair, missing required associations/SHA, incorrectly completed mismatch, extra observation retries, lost obligations/extensions/evidence, cleared foreign holds, affected dispatch, unrelated suppression, or invented generic repair work.

## Files changed

- skills/super-code/coordinator.js
- skills/super-code/coordinator-workflow.md
- skills/super-code/coordinator-subagents.md
- tests/super-code/replay-harness.mjs

## Toolchain provenance

No installation/setup step is needed by this zero-dependency replay harness. Node realpaths confirmed both the test runner and package-under-test inside this task worktree. The product coordinator runs through the replay AsyncFunction runtime; no live product invocation or ad-hoc product probe used the real HOME. Tests used the assigned TMPDIR. Logs were task-local and removed after preserving the exact commands and relevant outputs in this report.

## Test hygiene

Every completed-run process check exited 0 with empty output: no leaked process. Final `stop-run-processes --check <task worktree> /tmp/sp-bce79baa/super-plan-ufz.12` and `stop-run-processes <same roots>` both exited 0 with empty output; there were no stopped/survived lines and no remaining background process.

One early check was accidentally made while initial RED replay was still running. Its `match:` lines named the active harness PID 61224 and temporary fixture PIDs 93513, 93543, 97709 and 97712. They were ongoing tests, not post-run leaks, and exited naturally before the completed-run check. No process was stopped by name or pattern.

## Assumptions

Current task description/acceptance and frozen brief agree; `bd comments super-plan-ufz.12` returned no comments, so no amendments were applied. Caller-owned sweep deferrals remain caller-owned; they do not hold arbitrary unrelated rows. Explicit task/affected-ID scope is used for deferred admission gates. Existing owner holds are never inferred resolved from silence or missing branches. Legacy Task-only replay behavior is retained; active additive Recovery facts supply the new reconciliation gates. Parent owns fresh-agent resume behavior evaluation, as the brief explicitly states.

## Concerns

No deterministic task-local failure remains. Fresh-agent live evaluation of the ordinary resume instructions is pending with the parent coordinator; these simulated replay/prompt checks do not claim to measure agent compliance. Suggested parent scenarios are the new `recovery resume: durable landing reconciles before admission and closure is idempotent` and `recovery resume: durable scoped holds preserve unrelated eligibility and diagnostic deferrals` cases. No agent or Herdr write was performed by this implementer, and integration was read-only throughout.

## Fix pass

Status: FIXED. Task: super-plan-ufz.12. Exact task base remains `caf187cef8d1769da6184de42332a31bc7e30dcb`; reviewed implementation head was `26cc469e06bab7b6dad98cb726326f949d1c486f`; verified fix head is `07caa440eac3a501d9a18712344f6f2ede2e06d2`. No rebase or merge was performed.

The Important finding is valid. A restored pending-closure with an initially open associated review/blocker took `closeAlreadyMerged` into `confirmClosure`; successful tracker closure immediately reduced recovery state before the buffered task ledger append was confirmed. Null append plus null retry, or an explicit `appended:false`, then returned a completed task with its original recovery record missing.

The fix defers that reduction for restored pending-closure records. `flushLedger` now returns its existing serialized append promise. The partial-close path buffers clear and completion together, awaits that task append, and only then reduces the obligation and settles completed. Failed or unavailable persistence retains the exact original record, including additive fields and evidence, and sets the existing task-scoped resume hold, yielding `recovery-held`. Fresh closure handling retains its existing ordering. No root acceptance, scheduling, admission policy, record schema, or prompt change was added.

Files changed in the fix commit:

- `skills/super-code/coordinator.js`
- `tests/super-code/replay-harness.mjs`

The additive replay fixture begins with the task closed and its associated review/blocker open, observes successful close/check, then tests null append/retry and `appended:false`. It requires no completed result, a scoped held stop, and the exact original obligation. Each fixture restarts from confirmed durable lines only, observes all associated beads now closed, confirms a durable clear, and verifies no close-only, implementation, review or merge repeat. Existing assertions were not removed, loosened or skipped. Counterexamples caught include no closure check, excess retry, premature completed status, lost/changed obligation fields, duplicate restart repair/implementation, and missing successful restart settlement.

### RED/GREEN evidence

Commands ran in the assigned task worktree, with the assigned temporary root. RED ran after adding the fixture and before production edits:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 node tests/super-code/replay-harness.mjs > evidence-task12-fix-red.log 2>&1
```

Exit 1, expected assertion failures in each persistence-failure variant:

```text
[FAIL] failed partial-close append holds recovery instead of reporting completed
[FAIL] failed partial-close append retains the exact original obligation
[FAIL] failed partial-close append holds recovery instead of reporting completed
[FAIL] failed partial-close append retains the exact original obligation
2086 passed, 4 failed
```

Final GREEN and caller regression commands:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 node tests/super-code/replay-harness.mjs > evidence-task12-fix-green.log 2>&1
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 bash tests/super-code/test-dispatch-text.sh > evidence-task12-fix-dispatch.log 2>&1
git diff --check
```

All exited 0. Relevant output:

```text
[PASS] failed partial-close append holds recovery instead of reporting completed
[PASS] failed partial-close append retains the exact original obligation
[PASS] restart after failed partial-close append observes facts without repeating closure or implementation
[PASS] restart settles partial closure after its durable clear is confirmed
2090 passed, 0 failed
[PASS] the help's kinds all parse (missing: none)
dispatch-text: all tests passed
```

Both failure variants pass these assertions. The full replay run covers `confirmClosure`, both `closeAlreadyMerged` re-entry routes and their callers, and the existing buffered-ledger callers; dispatch-text supplies the existing prompt-builder regression. No narrower replay filter is available. Neither command exceeded a few minutes. Task-local logs were removed after recording their commands and relevant output here.

### Test hygiene, assumptions and concerns

Completed-run `stop-run-processes --check` checks after RED, GREEN and dispatch regression exited 0 with empty output: no leaked process. An initial hygiene invocation from inside the task root was refused by the script's own working-directory guard (exit 2); repeating from outside the checked roots succeeded. A first sandboxed RED invocation could not create its task-local output log and did not run the harness; approved task-local escalation then ran it to the RED verdict above. These are command/setup failures, not test verdicts. The final stop/check commands produced no `match:`, `stopped:` or `survived:` lines. No background process remains.

The current bead and comments were read again: no amendments or comments exist, and the task/brief agree. There are no declined or evidence-only findings. Parent-owned fresh-agent evaluation remains pending as stated in the original brief; deterministic replay does not measure agent compliance. Integration was read-only except this explicitly allowed report append. No subagent, Herdr write, acceptance/scheduling expansion, merge, or unrelated edit was performed.

## Seam fix

Status: FIXED. Task: `super-plan-ufz.12`. Integration/merge base: `14444f0c6396a132250741eb45e5bab1cf934184`. Reviewed rebased head: `28a722c5b68c431cde222cae4ee0dc01c8d6c826`. Final committed head: `fd00d4da69a2a7b4b22540769acd60871efdfdba`. Original frozen task base: `caf187cef8d1769da6184de42332a31bc7e30dcb`. Branch: `task-super-plan-ufz.12`. No rebase, integration mutation, merge, subagent, or Herdr write was performed.

The finding in `task-11-review-seam.md` is valid. Sibling `97ee30a1` requires a nonempty failure/command/configuration identity, plus task, dispatch, an identity-matching claim and an evidence array for every durable runFailure history event. The task's new diagnostic-deferral fixture lacked configuration and the event fields. `readRecovery` correctly classified it as a gap, so the exact diagnostic-obligation preservation assertion failed for both hold/deferred variants.

The repair changes only `tests/super-code/replay-harness.mjs` (9 insertions, 1 deletion). Its unscoped caller-owned diagnostic now carries a matching identity, complete review history, live passing run baseline at source a, and live failing observation at source b linked to introducing owner `bd-old`. Existing exact-obligation preservation, affected hold, unrelated admission and held-finish assertions remain unchanged. Two additional assertions per variant verify that resumed runFailures retain the open introducing owner without attribution gaps and expose the exact original baseline/failing source records. A dropped diagnostic, owner loss/reassignment, invented verification, misclassification, attribution gap, or lost/replaced comparison evidence fails these assertions. JSON equality compares returned coordinator state to independently supplied input evidence; it does not use a production builder to compute expectations.

No production behavior or function signature changed. `git diff --exit-code 28a722c5b68c431cde222cae4ee0dc01c8d6c826 -- skills/super-code/coordinator.js skills/super-code/coordinator-workflow.md skills/super-code/coordinator-subagents.md` exited 0. Thus readRecovery validation, malformed-history gaps, pending-closure durable confirmation ordering, diagnostic ownership, repair routing and alias identity are preserved.

### RED/GREEN and overlap verification

All commands ran from the assigned task worktree. Every test used the following environment prefix (HOME and all configured XDG homes remain task-local):

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 HOME=/tmp/sp-bce79baa/super-plan-ufz.12/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/state
```

Exact RED command before editing:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 HOME=/tmp/sp-bce79baa/super-plan-ufz.12/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/state node tests/super-code/replay-harness.mjs > evidence-task12-seam-red.log 2>&1
```

Exit 1, exactly the expected two schema-incompatibility failures:

```text
[FAIL] runFailure diagnostics survive without becoming generic repair work
[FAIL] runFailure diagnostics survive without becoming generic repair work
2118 passed, 2 failed
```

Exact final GREEN and overlapping prompt-surface regression commands:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 HOME=/tmp/sp-bce79baa/super-plan-ufz.12/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/state node tests/super-code/replay-harness.mjs > evidence-task12-seam-green.log 2>&1
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.12 HOME=/tmp/sp-bce79baa/super-plan-ufz.12/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.12/state bash tests/super-code/test-dispatch-text.sh > evidence-task12-seam-dispatch.log 2>&1
git diff --check
```

All exited 0. Relevant GREEN output (the three diagnostic assertions run for both variants):

```text
[PASS] runFailure diagnostics survive without becoming generic repair work
[PASS] unscoped diagnostic retains its open introducing owner alongside unrelated admission
[PASS] resumed diagnostic exposes the original source-bound baseline and failing observation
[PASS] failed partial-close append holds recovery instead of reporting completed
[PASS] failed partial-close append retains the exact original obligation
[PASS] restart after failed partial-close append observes facts without repeating closure or implementation
[PASS] B base exoneration retains A run ownership after durable re-entry
[PASS] cleanup-inspection: live aliases share exactly one count
[PASS] missing-evidence: live aliases share exactly one count
2124 passed, 0 failed
[PASS] the help's kinds all parse (missing: none)
dispatch-text: all tests passed
```

The full replay exercises overlapping coordinator behavior and workflow dryRun scenarios, pending-closure writer failure/restart paths, ownership and malformed diagnostic history contracts, and alias recurrence identity. Dispatch-text exercises existing prompt builders and callers. There is no narrower replay filter. Neither command exceeded a few minutes. Captured scratch logs were removed after preserving commands and verdicts here. Final task working tree is clean.

### Test hygiene

After each completed RED, GREEN and dispatch run, the following command ran from `/Users/alepar/AleCode/superpowers` (outside the checked roots):

```sh
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.12 /tmp/sp-bce79baa/super-plan-ufz.12
```

Each exited 0 with empty output: no match, no leak. Final task-scoped stop command with the same roots and without `--check` also exited 0 with empty output; no stopped or survived lines. No background process remains.

### Assumptions and concerns

Read current `bd show super-plan-ufz.12 --json` and `bd comments super-plan-ufz.12` before changes: no amendments, no comments, and current task requirements agree with the brief. The diagnostic remains unscoped and caller-owned, while explicit hold/deferred task scope gates admission; no generic repair or new admission rule was introduced. No declined or evidence-only findings, permission refusals, or task-local unresolved failures. Parent-owned fresh-agent evaluation remains separate from deterministic replay as recorded previously.
