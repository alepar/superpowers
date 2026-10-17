# Task super-plan-ufz.4 — IMPLEMENTED

Base: f1fb23d15eaaa70fff95404a97342cd83fb0bdb7
Head: 18a0b359df063617af5c643bb73f2737c8aacbdd
Original implementation base: 01ff39cc0b6fc0effdf559e9b1164273610c24e6
Stacked: false
Reopened: false

## Implementation

Added compact `Recovery: <JSON>` records to the existing progress ledger/digest. Existing Task/Merge/Human action reducers are retained. Records use `{version:1,id,kind,operation,reason,evidence,data}`, with nonempty source/artifact references; kinds are hold, pending-closure, deferred, fix. Record/clear affects only the matching obligation (kind,id). Fix attempts remain append-only and independent of latest terminal task status. Unknown-version/malformed/evidenceless/fix-clear inputs appear as explicit `gaps` with source path, digestLine, reason and a preview capped at 200 characters. Recovery lines over 4096 characters become `Recovery gap: <original source line> <ledger path>` in the digest; complete input remains on disk, and the returned gap is `{source,line,reason}`. Valid compact records retain full evidence; no unbounded raw line is echoed.

Workflow producers use existing noteLedger/queueLedger buffering at merge-lane holds, pending/confirmed closure, caller-owned sweep deferral and review/seam/check fix results. Elided append retries preserve compact Recovery JSON byte-for-byte. Existing chain/Finish drains settle writes before the result returns. The additive return field is `recovery: {obligations,fixHistory,gaps}`. Report bodies and finding prose remain in artifacts, with pointers in records. Dirty hold details are limited to five paths plus total count.

Ordinary-subagent reference text defines the same emission and read contract. No resume routing/reconciliation, root acceptance, attribution or metrics policy was added.

## Downstream field/operation examples

Pending closure fixture (full b SHA, source review/blocker IDs):
```json
{"version":1,"id":"bd-101","kind":"pending-closure","operation":"record","reason":"tracker closure unconfirmed","evidence":["task-1-report.md","bead:bd-112","bead:bd-109"],"data":{"head":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","reviewBead":"bd-112","blockerBead":"bd-109"}}
```
Producer additionally includes exact known `range`, `git:<head>` and `bead:<taskId>` evidence. Confirmed closure appends:
```json
{"version":1,"id":"bd-101","kind":"pending-closure","operation":"clear","reason":"tracker closure confirmed","evidence":["bead:bd-101","bead:bd-112","bead:bd-109"],"data":{}}
```
Fix history fixture:
```json
{"version":1,"id":"bd-101","kind":"fix","operation":"record","reason":"review finding","evidence":["task-1-review.md","task-1-report.md"],"data":{"outcome":"FIXED","reviewPath":"task-1-review.md","head":"ffffffffffffffffffffffffffffffffffffffff"}}
```
Producer fix data also carries phase (review|seam|check), reportPath, known base/head, optional blockerBead, declined/evidenceOnly booleans. Check fixes cite actual merge dispatch/report evidence and omit reviewPath because that artifact does not exist. Unknown commit fields are omitted.

Hold producer ID is `merge-lane`; data has taskId, integrationBranch/integrationWorktree, dirty/dirtyCount or detachedHead. Deferred sweep ID is `<epicId>:sweep:<runTag>`; data has owner=caller, runTag, integrationBranch and declared command when known. Evidence points to the existing ledger Launch for that runTag. Clearing deferred measurements is owned by the measuring caller. No hold is automatically cleared by this task.

## Tests and TDD

All commands ran in `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.4`.

Initial RED, before production changes:
```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.4 node tests/super-code/replay-harness.mjs > evidence-task4-red.log 2>&1
```
Exit 1, approximately 28 seconds (log creation-to-last-write):
```text
[FAIL] digest counts recovery records and gaps along with legacy Task tokens
[FAIL] digest transports complete evidence and uninterpretable recovery lines verbatim
[FAIL] earlier FIXED record survives the clean retry intact
[FAIL] malformed, unknown-version, evidenceless and fix-clear records remain explicit gaps
[FAIL] pending closure preserves exact landing head and range
[FAIL] elided append retry preserves every recovery record and evidence byte
1775 passed, 12 failed
```
Expected failure: baseline digest discarded Recovery records, coordinator had no recovery collections/producers. All original baseline checks remained passing.

Additional RED for truthful merge-check source references, before fixing the invented check review path:
```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.4 node tests/super-code/replay-harness.mjs > evidence-task4-contract-red.log 2>&1
```
Exit 1, approximately 29 seconds:
```text
[FAIL] merge-check fix retains its error source and range without inventing a review artifact
1788 passed, 1 failed
```
Corrected to actual merge dispatch/report evidence and omitted the nonexistent reviewPath.

GREEN before final compact-gap correction (historical):
```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.4 node tests/super-code/replay-harness.mjs > evidence-task4-final.log 2>&1
```
Exit 0, approximately 28 seconds:
```text
[PASS] digest counts recovery records and gaps along with legacy Task tokens
[PASS] digest transports complete evidence and uninterpretable recovery lines verbatim
[PASS] earlier FIXED record survives the clean retry intact
[PASS] clears only matching hold and confirmed pending closure; deferred obligation stays owned by caller
[PASS] malformed, unknown-version, evidenceless and fix-clear records remain explicit gaps
[PASS] elided append retry preserves every recovery record and evidence byte
[PASS] seam fix retains its source without inventing an unreported head
[PASS] merge-check fix retains its error source and range without inventing a review artifact
1789 passed, 0 failed
```
Includes real digest subprocesses, simulated coordinator append/read/closure paths, old-format input and all three documented dryRun scenarios with their expected dispatch counts. Legacy test extraction defaults to Task/Merge lines; `recovery:true` exposes complete additive transport to the new independent recovery assertions. No existing assertion or expected value was removed/changed.

Caller check:
```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.4 bash tests/super-code/test-dispatch-text.sh > evidence-task4-dispatch.log 2>&1
```
Exit 0, approximately 6 seconds:
```text
[PASS] the help's kinds all parse (missing: none)
dispatch-text: all tests passed
```
`git diff --check` passed. The first rebase was up to date; integration subsequently moved to f1fb23d1. Final rebase retained both reviewBase/reviewHead fields from integration and recovery append support in the single conflicting fixture hunk. All product-source changes auto-merged. Final replay and caller checks were rerun on head 18a0b359; their result is recorded below.

Assertions catch missing/truncated Recovery JSON, incorrect header accounting, overwritten FIXED history, unrelated-obligation clearing, missing gap evidence, missing clear emission, abbreviated/wrong landing SHA/range, missing source refs, differing elided fallback, missing caller ownership, invented seam head and invented check review artifact. Tests use hand-authored records and real digest output; expected values are independent of the producer.

## Toolchain provenance

No setup/install step is required by the zero-dependency Node replay harness. Both test runner `tests/super-code/replay-harness.mjs` and package-under-test `skills/super-code/coordinator.js` resolve inside this task worktree. Node interpreter resolves to `/opt/homebrew/Cellar/node/26.9.0/bin/node`; this is the interpreter, not another checkout's runner/package. Product source is executed by the replay's AsyncFunction runtime; no live product invocation accessed the real home directory.

## Files changed

- skills/super-code/coordinator.js
- skills/super-code/scripts/ledger-digest
- skills/super-code/coordinator-workflow.md
- skills/super-code/coordinator-subagents.md
- tests/super-code/replay-harness.mjs

## Test hygiene

No post-run leaked process and no survived line. Final check and stop commands each exited 0 with empty output:
```sh
cd /Users/alepar/AleCode/superpowers && bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.4 /tmp/sp-bce79baa/super-plan-ufz.4
cd /Users/alepar/AleCode/superpowers && bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.4 /tmp/sp-bce79baa/super-plan-ufz.4
```
One early check ran from inside the owned worktree and exited 2 by the stop script's ancestor protection; it was corrected to an outside cwd. A diagnostic check made while RED replay was still running observed active harness/fixture PIDs 70867, 74618, 74629, 74630, 74632, 74633, 74720, 74933. These were ongoing RED replay/stop-run-processes test children, not post-run leaks; they all exited naturally. The required post-RED and subsequent post-run checks found no matches. No process was stopped by name/pattern.

## Assumptions

Current bead description and acceptance match the frozen brief; `bd comments` returned no comments, so no amendments applied. Clear operations also require nonempty observed evidence. The caller owns deferred sweep clearing. Parent owns live fresh-agent evaluation; this leaf limits changed reference content to the explicit data/transport contract.

## Concerns

No task-local test failure remains. Live harness execution/agent-behavior evaluation is not claimed by these simulated producer tests; the parent run owns it. Resume reconciliation and downstream acceptance/attribution/metrics remain dependent leaves, as specified. Failed ledger append status continues to be exposed through the existing ledgerAppendFailed return field; no replacement durability engine was introduced.

## Compact-gap correction and final rebased evidence

Parent review required bounded transport even for malformed/unknown records. Added an oversized malformed line, unknown-version JSON and oversized structured obligation fixture. Each keeps its full body on disk and produces only original source/line gap pointers. The 4096-character transport ceiling bounds coordinator input; compact malformed records return source/digestLine and a 200-character preview. This narrows the record contract without changing missing/unreadable transport taxonomy.

RED command (same task cwd):
```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.4 node tests/super-code/replay-harness.mjs > evidence-task4-size-red.log 2>&1
```
Exit 1, approximately 28 seconds for the completed run:
```text
[FAIL] malformed, unknown-version, evidenceless and fix-clear records remain explicit gaps
[FAIL] evidence remains on disk while digest transports bounded gap references
[FAIL] malformed, unknown and oversized structured records expose original source line references without full raw content
1790 passed, 3 failed
```
Expected failure: the pre-correction digest echoed arbitrary raw bodies and decoder gaps lacked bounded previews/source pointers. A prior attempt at the new assertion raised a TypeError on the missing baseline source field; it was corrected to optional access before the successful RED run above. That failed-start assertion is not counted as RED evidence.

GREEN before rebase was 1793 passed, 0 failed; dispatch-text all tests passed.

Final commands on rebased head 18a0b359df063617af5c643bb73f2737c8aacbdd and base f1fb23d15eaaa70fff95404a97342cd83fb0bdb7:
```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.4 node tests/super-code/replay-harness.mjs > evidence-task4-final.log 2>&1
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.4 bash tests/super-code/test-dispatch-text.sh > evidence-task4-dispatch.log 2>&1
```
Both commands exited 0:
```text
1802 passed, 0 failed
dispatch-text: all tests passed
```
Replay approximately 28 seconds; dispatch-text approximately 6 seconds. The higher rebased count includes integration's nine new review-identity assertions. Final post-run process --check and stop each exited 0 with empty output: no matches, stops or survivors. `git diff --check` passed. Task-owned test logs were removed after preserving their command/output evidence here. Final git status is clean.


## Seam fix

Status: FIXED. Finding: rebase-conflict.

Source revisions:
- Original task tip: `18a0b359df063617af5c643bb73f2737c8aacbdd`.
- Original task base: `f1fb23d15eaaa70fff95404a97342cd83fb0bdb7`.
- Integration target and final merge-base: `522c20bc70d234b1f718445902210186a3ecb389`.
- Rebased task tip: `2826a7d56d1537aa0ff21e53b915ec07eebf0327` on `task-super-plan-ufz.4`.
- Integration still resolved to `522c20bc70d234b1f718445902210186a3ecb389` at final inspection. This agent did not write to integration, merge, close beads or remove the task worktree.

Read current `bd show super-plan-ufz.4 --json` and `bd comments super-plan-ufz.4` before modifying source. Description/acceptance match the frozen contract; no comments or amendments. The named `task-4-review-seam.diff` artifact did not exist; the dispatch's complete quoted conflict finding was used and independently reproduced.

`git rebase 522c20bc70d234b1f718445902210186a3ecb389` reproduced exactly one conflicted file: `skills/super-code/coordinator.js`, one hunk at the final cleanup summary/return. The original task-versus-sibling overlap was:
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator.js`
- `tests/super-code/replay-harness.mjs`

Resolution retained integration's entire truthful cleanup block: combined process observations, distinct stopped/survived/unknown/kept facts, unknown for null/scriptError/missing processLines, retained resource references and cleanup prompt rules. It added only the previously reviewed `recovery: {obligations,fixHistory,gaps}` field to that return. The other three overlapping files auto-merged. Stable captured review inputs from landed task 1 remain intact. Durable recovery records, evidence references, bounded gaps, append-only fix history, pending closure handling and digest compatibility from task 4 remain intact. No resume/acceptance/metrics routing was added.

`git range-diff f1fb23d15eaaa70fff95404a97342cd83fb0bdb7..18a0b359df063617af5c643bb73f2737c8aacbdd 522c20bc70d234b1f718445902210186a3ecb389..2826a7d56d1537aa0ff21e53b915ec07eebf0327` shows the original patch unchanged except the cleanup context surrounding this same additive return field. The rebased task delta remains five files, 229 insertions and 10 deletions. No new tests, instructions or production behavior were introduced by the resolution.

### Focused verification

Tests executed against the resolved tree, then `git rebase --continue` committed that exact source as the rebased tip above. Source was unchanged between verification and commit; final `git diff --check` passed and tracked diff was empty.

Both test commands ran from:
`/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.4`

Exact replay command:
```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.4 HOME=/tmp/sp-bce79baa/super-plan-ufz.4/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.4/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.4/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.4/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.4/state node tests/super-code/replay-harness.mjs > evidence-task4-seam-replay.log 2>&1
```
Exit 0. Relevant output:
```text
[PASS] 48 agent dispatches (got 48) — the doc's "Expected dispatch count" arithmetic
[PASS] 19 agent dispatches (got 19)
[PASS] 23 agent dispatches (got 23)
[PASS] earlier FIXED record survives the clean retry intact
[PASS] malformed, unknown-version, evidenceless and fix-clear records remain explicit gaps
[PASS] malformed, unknown and oversized structured records expose original source line references without full raw content
[PASS] pending closure preserves exact landing head and range
1884 passed, 0 failed
```
Replay includes real digest subprocess fixtures, the stable review-input fixtures, cleanup summary/prompt fixtures, helper tests for unverified/surviving/interactive cleanup and resource retention, plus the documented dryRun scenarios. Dispatch counts match coordinator-workflow.md: canonical 48, fix-pass-blocked 19, parked 23.

Exact caller command:
```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.4 HOME=/tmp/sp-bce79baa/super-plan-ufz.4/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.4/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.4/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.4/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.4/state bash tests/super-code/test-dispatch-text.sh > evidence-task4-seam-dispatch.log 2>&1
```
Exit 0:
```text
[PASS] the help's kinds all parse (missing: none)
dispatch-text: all tests passed
```
This checks the ordinary-subagent caller of the unchanged prompt-builder interfaces. No function signature changed in the seam resolution. Full-suite/live-agent behavior evaluation remains parent-owned; this report claims the completed focused deterministic checks only. Temporary evidence logs were removed after their commands and result excerpts were retained here.

### Test hygiene

After each completed test, the following command ran from `/Users/alepar/AleCode/superpowers`, outside the owned roots, and exited 0 with empty output:
```sh
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.4 /tmp/sp-bce79baa/super-plan-ufz.4
```
Final stop command from the same outside cwd also exited 0 with empty output:
```sh
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.4 /tmp/sp-bce79baa/super-plan-ufz.4
```
No leaked matches, stopped processes or survivors. No background process remains from this fix. No declined finding, evidence-only resolution, authorization blocker or new concern.
