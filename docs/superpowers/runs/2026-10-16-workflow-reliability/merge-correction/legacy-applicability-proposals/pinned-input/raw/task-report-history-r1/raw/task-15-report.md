Status:IMPLEMENTED

# super-plan-ufz.9 — deterministic reconciled metrics

## Result and source revisions

- id: super-plan-ufz.9
- status: IMPLEMENTED
- branch: task-super-plan-ufz.9
- stacked: true
- original stacked base: 7074121343636addd41f80ef5261de6ffb74ab80
- stack parent supplied/tested: ee4f3cfcd20a6eb8ada40f32e821dbbd6895630b (super-plan-ufz.8.4)
- head: c3bfd1f9e3109f136b091f843d270455b367cad9
- tested base: 7074121343636addd41f80ef5261de6ffb74ab80; no task-side rebase was performed because this is stacked.
- tested rebased base: not applicable; no rebased source was tested here. The parent reported .8.4 landed at 84c0e0cd via 10b7c509, and the integration ref observed before commit was 8ed4be9e1a63c0d52273dd2772e65097c43b7797. The coordinator owns eventual --onto integration handling from the original stacked base; these results make no claim about that future source.
- review/interpretation evidence: evidence/super-plan-ufz.9/metrics-examples.md in this task worktree, committed with the implementation.

## Implementation

The existing ledger-digest now distinguishes missing/unreadable sources from valid empty files. Counting headers remain compatible for existing nonempty inputs; coordinator reads validate exact body/header counts, reject impossible kept/total counts, and classify empty transport or an empty/missing source after confirmed appends as unavailable evidence. Retry behavior preserves independent Git observations and captured review commits. A Git lookup failure has its own landedError and cannot void successful ledger transport.

Finish reconciles available tracker closures and drains their ledger writes before re-reading and deriving Metrics. The four legacy Metrics prefixes/order remain compatible. Additional metricsEvidence carries source status, observed Git IDs, completed IDs, durable fix history, concrete set differences and gaps. Unique task landings and latest per-task completion states are separate from observed legacy fix event lines and deduplicated durable fix records. A clean latest attempt retains historical FIXED evidence. The same Recovery record validator is used at Resume and Finish, so unsupported/oversized Finish-only records retain gaps. Invalid or absent sources do not manufacture zero final totals.

Projection JSON gains additive metrics from the existing --project result. Source/section/position identities and supported dispositions remain the predecessor's contract; exit 3 still retains findings plus gaps. Raw occurrences/groups are distinct from actionable groups, repaired/rejected, outstanding/deferred and other extraction sections. Only supported resolved groups contribute repairs. Raw roast rejected/unverified sections and absent task-review populations are explicit. Existing key-only projection semantics are unchanged; empty keys alone establish no clean result.

The dependent run-digest caller also validates transport and propagates missing/unreadable/invalid status; otherwise its existing exit-0 source handling would have turned the new unavailable statuses into invented landed-zero counts. Other available tracker/profile observations survive. This is the only extra runtime caller beyond the brief's original file list.

Operative instructions use the same source/projection contracts and source-qualified count recipe. A baseAbsorbed record adds zero task landings, and normal Workflow/ordinary mechanism selection adds zero friction events. Profiler generation ownership and invocation/residual/task-slot/all-agent labels are preserved.

## Tests — final commands and output

Every test ran from the absolute task worktree with this inline environment prefix:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.9 HOME=/tmp/sp-bce79baa/super-plan-ufz.9/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/state
```

The commands below were each executed with that prefix, after `cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.9`:

1. `node tests/super-code/replay-harness.mjs` — exit 0; final source including shared Recovery validation, 29 seconds.

```text
[PASS] lost or invalid transport never supplies zero run totals
[PASS] known durable fix history survives unavailable Finish ledger
[PASS] duplicate durable fix records retain one supported historical attempt
[PASS] Finish-only unsupported and oversized recovery facts remain explicit gaps
[PASS] equal-sized ledger/Git sets expose actual distinct IDs
[PASS] Finish reconciliation precedes deterministic metrics
[PASS] Finish-only closure is reflected in the actual Metrics lines
2152 passed, 0 failed
```

2. `bash tests/super-auto/test-scripts.sh` — exit 0; 3 seconds.

```text
[PASS] deterministic metrics separate repaired rejected deferred and outstanding
[PASS] raw rejected and unverified sections are separate from actionable finding counts
[PASS] linked occurrences count once as a finding but retain raw occurrence count
[PASS] metric projection preserves gap exit
[PASS] partial projection retains supported metrics with explicit scope
All super-auto script tests passed
```

Actual emitted projection example:

```json
{"scope":"retained sources","sources":3,"sourceKinds":["final-review","roast"],"occurrences":7,"occurrenceGroups":7,"findings":5,"otherSectionGroups":2,"sections":["Must fix","Deferred OK","Rejected","Not verified"],"repaired":1,"rejected":1,"outstanding":3,"deferred":1,"gaps":0}
```

Task-report coverage is absent from this retained population, not a zero run-wide task-review total. The full projection retains the two other-section groups for Remaining/interpretation.

3. `bash tests/super-auto/test-contract-lint.sh` — exit 0; 38 seconds.

```text
[PASS] skills/super-auto has no contract problems
[PASS] unapproved added field still fails
[PASS] changed legacy line format fails
[PASS] dropping an approved added field fails
[PASS] changed approved added format fails
All super-auto contract lint tests passed
```

Both historical 2bf1d53 fixture files and predecessor-approved additive fixtures remain byte-for-byte unchanged. No run.md field or line format was added.

4. `bash tests/super-code/test-run-digest.sh` — exit 0; 14 seconds.

```text
[PASS] missing is retained independently from other sources
[PASS] missing never supplies zero totals
[PASS] unreadable is retained independently from other sources
[PASS] unreadable never supplies zero totals
[PASS] truncated transport never supplies partial authoritative totals
run-digest: all tests passed
```

5. Optional broader `bash tests/skill-scripts/test-bash-invocation.sh` — exit 0; slow, 392 seconds (6m32s). It exhaustively compares every Bash helper line against helper names; no setup or code change was made to speed it up.

```text
  checked 33 bash helper scripts
All helper invocations go through an interpreter
```

6. `git diff --check` — exit 0, no output. Historical contract-fixture diff against the stacked base was empty.

No project setup/install step is declared: the package is zero-dependency. The runtime interpreter is /opt/homebrew/bin/node; the actual test runner and coordinator package source resolved within this task worktree. Tests executed the owned files, not installed plugin copies.

## TDD evidence

- Initial replay before producer changes: `node tests/super-code/replay-harness.mjs` with the same isolated environment produced `2134 passed, 11 failed`. It reproduced accepted empty/invalid transport, duplicate/old completion counting, missing durable historical counts, absent discrepant IDs, and Finish reconciliation occurring after metrics. All failures were expected new requirement fixtures.
- With explicit missing/empty/unreadable producer fixtures added, unchanged producers produced `2133 passed, 14 failed`. Inert awk failure returned no explicit unreadable status; missing/empty outputs were indistinguishable. No permissions were changed or bypassed.
- `bash tests/super-auto/test-scripts.sh` before projection metrics produced `3 failure(s)` for missing deterministic metric output. Adding raw Rejected/Not verified sources then produced `1 failure(s)` until raw occurrence/group counts were separated from actionable populations. Final GREEN is shown above.
- Known partial history fixture produced `2149 passed, 1 failed`: unreadable Finish transport dropped metricsEvidence.fixHistory even though Resume retained a supported FIXED record. Final GREEN retains the historical result with explicit partial scope.
- `bash tests/super-code/test-run-digest.sh` produced `run-digest: 5 failure(s)` with correct independent tracker fixture setup: missing/unreadable statuses supplied landed-zero, and truncated transport supplied counts. Final GREEN is shown above. An earlier new-fixture setup retained the preceding slow-source mock; that fixture error was corrected before accepting RED evidence.
- A narrow executable probe using the existing replay runner before the last shared-validator correction printed `FAIL: Finish-only unsupported/oversized recovery records silently lose evidence gaps`, exit 1. After the correction it printed `PASS: Finish-only unsupported/oversized recovery gaps retained`, exit 0. The corresponding case is committed in the official replay and passed in the final 2152/0 run. The disposable probe is removed before return.

## Files changed

- skills/super-code/coordinator.js
- skills/super-code/scripts/ledger-digest
- skills/super-code/scripts/run-digest
- skills/super-code/coordinator-workflow.md
- skills/super-code/coordinator-subagents.md
- skills/super-auto/scripts/scope-dispositions
- skills/super-auto/SKILL.md
- skills/super-auto/run-state.md
- skills/super-auto/report-prompt.md
- skills/upstream-feedback/SKILL.md
- tests/super-code/replay-harness.mjs
- tests/super-code/test-run-digest.sh
- tests/super-auto/test-scripts.sh
- evidence/super-plan-ufz.9/metrics-examples.md

## Test hygiene

Completed test runs followed by the prescribed --check had no leaked matches. Two overlapping checks saw still-active tests (PIDs 72863/73488 during the script suite, and 6147 during the optional invocation lint); they were active test processes, not leftover leaks, and were allowed to complete. No server/daemon/watcher was started. Final prescribed --check and stop both exited 0 with no output: no match or survived lines. Every completed test has a verdict; none was killed or timed out. Scratch logs and the narrow disposable probe are removed; the actual interpretation examples remain committed.

## Assumptions and amendments

Read current `bd show super-plan-ufz.9 --json` and `bd comments super-plan-ufz.9`: no comments or conflicting current amendments. Consumed the exact task-13-report.md Interfaces: supported projection exit 3 retains results plus gaps; --keys has no clean-result authority; explicit links/support remain the source of finding identity and disposition. Consumed task .4's durable Recovery contract, preserving history independently from latest status. The parent explicitly assigned fresh-agent interpretation evaluation to the coordinator and supplied a passing baseline control; guidance therefore stays a compact positive source/count contract rather than adding behavioral prohibitions. No agents were spawned and no Herdr writes occurred.

The original stacked base is intentionally preserved for coordinator integration. No integration or parent branch was modified.

## Concerns and limits

Fresh-agent report interpretation/pressure evaluation belongs to the coordinator and was not run here. Concrete generated examples and qualified summary candidates are committed at evidence/super-plan-ufz.9/metrics-examples.md. Deterministic producer/consumer checks are complete independently of that evaluation.

Counts retain their observed units and populations: legacy fix lines are event lines; durable history counts retained records; supported repaired groups require the separate disposition projection. Absent task reports or unavailable ledger sources cannot establish run-wide totals. Ordinary execution metadata has no friction event producer here; its zero-friction interpretation is stated in the relevant consumers. Profiler generation remains with its existing owner.

## Final hygiene and worktree verification

The final process checks ran from /Users/alepar/AleCode/superpowers, outside the owned roots:

```sh
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.9 /tmp/sp-bce79baa/super-plan-ufz.9
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.9 /tmp/sp-bce79baa/super-plan-ufz.9
```

Both exited 0, output empty. Final git status is verified after removing only task-owned scratch logs/probe; head remains c3bfd1f9e3109f136b091f843d270455b367cad9.


## Fix pass

Status: FIXED

- Finding: task15-review Important, independent source observations across the bounded ledger retry. Reproduced and fixed; no findings declined or resolved by report evidence alone.
- Original stacked base: `7074121343636addd41f80ef5261de6ffb74ab80` (unchanged).
- Pre-fix head: `c3bfd1f9e3109f136b091f843d270455b367cad9`.
- Committed fix head: `548a0b08d7b02a7fdfcb67f4e6899013b6276b9d`.
- Branch: `task-super-plan-ufz.9`; stacked: true. No rebase, integration mutation, delegation, or Herdr write occurred. The original base remains the coordinator's future `--onto` boundary. Tests exercise this task branch, not a future rebased source.

### Change and self-review

`readLedger` now selects the ledger transport, successful Git landing observation, and successful complete review revision pair independently after its one bounded retry. The retry's successful source is preferred when both attempts succeed. A successful empty Git list is retained, and no failed attempt's `landedError` or `reviewError` is attached to a retained successful source. Review base/head must come together from one successful capture and pass the existing full-commit shape check; opposite partial captures cannot create a review source. Failed ledger/Git/review attempts, including null dispatches, remain labelled source gaps. Finish's `metricsEvidence.gaps` includes those retained observations from both Resume and Finish reads.

Changed files:

- `skills/super-code/coordinator.js`
- `tests/super-code/replay-harness.mjs`

The replay covers ledger recovery and repeated ledger failure independently from Git/review success, failures alternating in both directions, opposite half revision pairs, a partial retry following a complete capture, a complete retry following a partial capture, and a null retry following successful empty Git/review capture. The Git fixture uses `bd-999` so fallback to this invocation's confirmed `bd-101` cannot satisfy the assertion. Review assertions inspect the dispatched immutable capture, rather than merely the presence of response fields. Existing assertions were not changed, removed, skipped or loosened.

### RED/GREEN evidence and final verification

All executable replay runs used this isolated environment after the absolute task-worktree `cd`:

```sh
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.9
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.9 HOME=/tmp/sp-bce79baa/super-plan-ufz.9/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/state node tests/super-code/replay-harness.mjs
```

1. RED, unchanged coordinator, full replay: exit 1, about 99 seconds, `2179 passed, 12 failed`. New assertions reproduced dropped Git/review observations and lost failed-attempt gaps; the existing replay checks stayed green. This initial full run had the partial-review fixtures on the recovered-ledger branch.
2. RED, unchanged coordinator, exact new scenario extracted into a disposable `tests/super-code/.retry-replay.mjs`: same environment prefix followed by `node tests/super-code/.retry-replay.mjs`; exit 1, `26 passed, 13 failed`. Before this focused run, the partial-review fixtures were narrowed to repeated ledger failure so the previous object-spread branch demonstrably fabricated a mixed review pair. Relevant output:

```text
[FAIL] ledger recovers; first Git and review succeed: successful Git source survives without a failed attempt error
[FAIL] ledger recovers; first Git and review succeed: final review uses the complete successful capture
[FAIL] ledger stays unavailable; first Git and review succeed: successful Git source survives without a failed attempt error
[FAIL] both independent sources recover with unavailable ledger: successful Git source survives without a failed attempt error
[FAIL] opposite half pairs: no mixed-attempt review pair
[FAIL] partial retry after complete capture: no mixed-attempt review pair
26 passed, 13 failed
```

3. GREEN, the same exact focused scenario with the production fix: same prefix and `node tests/super-code/.retry-replay.mjs`; exit 0, `39 passed, 0 failed`.
4. Final GREEN, full replay with the final committed source: the full exact command above, exit 0, about 64 seconds. Relevant output:

```text
[PASS] 48 agent dispatches (got 48) — the doc's "Expected dispatch count" arithmetic
[PASS] 19 agent dispatches (got 19)
[PASS] 23 agent dispatches (got 23)
[PASS] ledger recovers; first Git and review succeed: successful Git source survives without a failed attempt error
[PASS] ledger recovers; first Git and review succeed: final review uses the complete successful capture
[PASS] ledger stays unavailable; first Git and review succeed: successful Git source survives without a failed attempt error
[PASS] Git recovers while review fails on retry: final review uses the complete successful capture
[PASS] review recovers while Git fails on retry: successful Git source survives without a failed attempt error
[PASS] both independent sources recover with unavailable ledger: failed source attempts remain qualified gaps
[PASS] opposite half pairs: no mixed-attempt review pair
[PASS] partial retry after complete capture: no mixed-attempt review pair
[PASS] complete retry after partial capture: no mixed-attempt review pair
[PASS] null retry retains successful empty Git observation
[PASS] null retry retains coherent review capture
2191 passed, 0 failed
```

The replay exercises both `readLedger` callers (Resume and Finish), downstream Metrics and final review dispatch, and all three documented dryRun scenarios. Canonical/fix-blocked/parked expected counts stay 48/19/23. No producer script or operative skill prose changed in this fix pass, so the earlier script/contract evidence remains as recorded above. `git diff --check` exited 0 with no output. After commit, `git status --short` was empty and `git merge-base --is-ancestor 7074121343636addd41f80ef5261de6ffb74ab80 HEAD` exited 0. Disposable extraction and scratch logs were removed after their relevant output was recorded here.

### Test hygiene

Completed-run hygiene checks and the final prescribed stop both exited 0 with no output: no leaked matches and no `survived:` lines. They ran from `/Users/alepar/AleCode/superpowers`, outside the two owned roots:

```sh
cd /Users/alepar/AleCode/superpowers
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.9 /tmp/sp-bce79baa/super-plan-ufz.9
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.9 /tmp/sp-bce79baa/super-plan-ufz.9
```

One earlier check was inadvertently started before the full RED replay had completed. It listed active replay/cleanup-fixture processes, PIDs 16249, 16268, 31386, 31552, 31615, 31762, 31764, 31765, 31766 and 31793. That scan was not a post-run leak result. The replay and its fixtures completed naturally; after completion, the prescribed check found none. The focused extraction itself starts no external subprocess. No server, daemon or watcher was started by this fix pass, and no test was terminated before its verdict.

### Assumptions, amendments and concerns

Read current `bd show super-plan-ufz.9 --json` and `bd comments super-plan-ufz.9` before changing anything: no amendments or comments change the requirements. The review finding agrees with the independent supported-partial-results contract. No additional behavior or workflow policy was introduced. Coordinator-owned fresh-agent interpretation evaluation remains outside this deterministic fix, as already recorded above. No new concerns.

## Seam fix

Status: FIXED

Resolved the quoted `rebase-conflict` finding. The named `task-15-review-seam.diff` file was absent; the complete finding in the dispatch was available and matched the reproduced coordinator.js conflict. Read the current bead, comments (none), frozen brief, existing report, and `task-15-report-fix.md` before edits. No amendments changed the scope.

### Exact source identities and boundary

- Original stacked boundary: `7074121343636addd41f80ef5261de6ffb74ab80`.
- Original metrics head: `548a0b08d7b02a7fdfcb67f4e6899013b6276b9d`.
- Rebase command: `git rebase --onto 6c332aa22824c185dc474b0fb5055b465cbd1412 7074121343636addd41f80ef5261de6ffb74ab80` on `task-super-plan-ufz.9` in its assigned worktree.
- Final base: `6c332aa22824c185dc474b0fb5055b465cbd1412`.
- Final head: `9b41133178416096df0b16a390342d81eeb0f690`.
- Own commits above final base: `8c52a3ed` (metrics), `e06f6170` (independent retry fix), `9b411331` (narrow seam regressions). No stacked parent commits were replayed. `git range-diff` marks the independent retry fix unchanged (`548a0b08 = e06f6170`). No integration branch/ref, other task branch, or user's checkout was changed; no merge, delegation or Herdr write occurred.

### Resolution and overlapping files

Only `skills/super-code/coordinator.js` conflicted. Its explicit hunk resolution preserves independent successful Git observations and coherent complete review capture pairs, including failed-attempt gaps, from the latest verified retry fix. The shared recovery validator retains the landed verification-completion basis checks for both Resume and Finish. The guarded verification-aware tracker reconciliation now runs before metrics; rejected/unaccepted verification still cannot complete from tracker closure alone. Latest per-task metrics retain verification-only completion counts while landing discrepancies compare only completed tasks with actual Git landings. Durable fix history and concrete discrepancy IDs remain independent from latest task state.

The exact overlap between the original metrics changes and integration changes since the stacked boundary is:

- `skills/super-auto/SKILL.md`
- `skills/super-auto/report-prompt.md`
- `skills/super-auto/run-state.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/ledger-digest`
- `tests/super-auto/test-scripts.sh`
- `tests/super-code/replay-harness.mjs`

All other overlap merged automatically and was reviewed. The landed finding-collection/Remaining contract survives alongside metrics. Integration's `report-status`, `resume.md`, implementer/reviewer prompts, `dispatch-text.mjs`, and approved additive contract fixtures are byte-for-byte unchanged relative to the captured integration base. Added only eight lines of replay coverage beyond the resolved/replayed task commits: observed verification completion without missing landing, and Finish-only verification closure before metric capture with zero fictitious landing discrepancies. A missing completion or a nonempty landing/discrepancy list fails those assertions; no existing assertion was removed, loosened or skipped.

### Final combined verification

Each command ran after this absolute `cd`:

```sh
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.9
```

Every test command below used this exact inline prefix:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.9 HOME=/tmp/sp-bce79baa/super-plan-ufz.9/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.9/state
```

1. `node tests/super-code/replay-harness.mjs` — exit 0:

```text
[PASS] reconciled metrics retain verification completion without a fictitious missing landing
[PASS] Finish-only verification closure is reconciled before metric source capture
[PASS] Finish-only verification contributes a completion and zero missing landings
[PASS] 48 agent dispatches (got 48) — the doc's "Expected dispatch count" arithmetic
[PASS] 19 agent dispatches (got 19)
[PASS] 23 agent dispatches (got 23)
[PASS] ledger recovers; first Git and review succeed: successful Git source survives without a failed attempt error
[PASS] both independent sources recover with unavailable ledger: failed source attempts remain qualified gaps
[PASS] opposite half pairs: no mixed-attempt review pair
[PASS] partial retry after complete capture: no mixed-attempt review pair
[PASS] null retry retains successful empty Git observation
[PASS] null retry retains coherent review capture
[PASS] Finish-only unsupported and oversized recovery facts remain explicit gaps
2263 passed, 0 failed
```

This exercises both readLedger callers (Resume/Finish), both recoveryProblem callers, Metrics/final-review consumers, landed no-change and durable recovery cases, and all three documented dryRun scenarios (48/19/23). An initial run stopped before the full suite with `ReferenceError: same is not defined` in the new seam assertion; the helper is scoped elsewhere. Replaced it with explicit JSON comparisons, then ran the entire suite to the passing verdict above. The initial incomplete run supplies no full-suite result.

2. `bash tests/super-auto/test-scripts.sh` — exit 0:

```text
[PASS] deterministic metrics separate repaired rejected deferred and outstanding
[PASS] raw rejected and unverified sections are separate from actionable finding counts
[PASS] linked occurrences count once as a finding but retain raw occurrence count
[PASS] metric projection preserves gap exit
[PASS] collection resumes after interrupted copy
[PASS] completed collection inventories the producer direct package
[PASS] ready silent retry collected independently
[PASS] known inline sources remain valid through collection gap
[PASS] supported rejected item stays off punch list while active defects stay open
[PASS] repaired collection appends completion after an earlier identical completion
All super-auto script tests passed
```

3. `bash tests/super-auto/test-contract-lint.sh` — exit 0:

```text
[PASS] changed legacy line format fails
[PASS] dropping an approved added field fails
[PASS] changed approved added format fails
All super-auto contract lint tests passed
```

4. `bash tests/super-code/test-run-digest.sh` — exit 0: `run-digest: all tests passed`.
5. `bash tests/super-code/test-dispatch-text.sh` — exit 0:

```text
[PASS] ordinary review transports explicit verification intent
[PASS] verification closure claims no Git landing
[PASS] unreviewed verification cannot dispatch closure
dispatch-text: all tests passed
```

`git diff --check` exited 0. The final base is verified by `git merge-base 6c332aa22824c185dc474b0fb5055b465cbd1412 HEAD`. Only the original two own commits plus the narrow seam test commit are above that base. No broader suite or fresh-agent report interpretation evaluation was run; the latter remains coordinator-owned as before.

### Test hygiene, assumptions and concerns

After every completed or stopped test command, ran the prescribed `stop-run-processes --check` from `/Users/alepar/AleCode/superpowers`, outside both owned roots. Every check exited 0 with empty output: no `match:` lines. Final check and final stop also exited 0 with no output and no `survived:` lines. No background server/daemon/watcher was started. Scratch test logs were removed after their output was recorded here. All complete test runs reached their own verdict; none was timed out or killed. No declined findings or evidence-only findings; no new concerns.
