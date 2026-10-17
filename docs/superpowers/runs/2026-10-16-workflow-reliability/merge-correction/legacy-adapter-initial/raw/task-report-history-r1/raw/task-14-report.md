Status:IMPLEMENTED

id: super-plan-ufz.8.3
base: 44a0c1896f7b52095d4d77b2580ff34c84974533
head: 9095b2667b4a05fc4f229a725ab266211bce26f7
stacked: true
reopened: false
branch: task-super-plan-ufz.8.3
worktree: /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.3
stack parent: task-super-plan-ufz.8.4 at 84c0e0cd (includes source ee4f3cfcd20a6eb8ada40f32e821dbbd6895630b)
humanAction: none

## Implementation

Extended the existing report-status script with an explicit settled-bundle --collect mode and kept ordinary status mode read-only. The orchestration recipe commits collection intent before launch, passes the persisted invocationId to either coordinator mechanism, and collects at the existing profile/friction boundary only after settlement. No immutable producer artifact, result.reviewPath/null contract, roast ledger, redesign trigger, amend workflow or acceptance/metric engine was changed.

Collection appends exact complete extraction objects in existing approvals, changing only artifact to the committed archive pointer. All occurrences retain their original invocation/logical-source, section, position, key and full text. Final/cluster reviews, direct diff when present, assembled inputs and explicitly declared required files are preserved under reviews/ID. Copies use exclusive creation, byte/hash comparison and atomic run-record replacement. Identical replay leaves records and archive bytes unchanged; conflicting destination bytes are untouched and durable gaps name recovery ownership. A completion following a gap is appended even if an identical complete state existed earlier, so repaired evidence can supersede the gap. Complete archives can be verified after source-worktree removal. Inline occurrences survive a missing artifact; source files are retained until preservation is confirmed.

Resume reconciles unsettled launches against their ledger/result, recovers collection before another invocation/cleanup, then consumes the predecessor's outstanding projection. Latest codeBuckets.review remains descriptive of its own invocation. Final-review routing, phase-5/post-cap punch-list input, Remaining and status qualifiers use the same projection; key mode is only outstanding deferred input. Empty keys, later ready/silent retries, assignment/task success and blanket sweep success supply no disposition. Supported explicit resolution/rejection removes a group from derived views. A sweep can support only its matched measurement obligation. Null/no-work without artifacts introduces no review; null required reviews and contradictory recoverable partial bundles remain explicit gaps, preserving discoverable sources.

Added one approvals record kind and its additive current-contract goldens. Historical 2bf1d53 field/format fixtures remain byte-for-byte unchanged. Replaced the stale latest-review --keys lint with complete-extraction, shared-projection and collection-recovery checks; null safety and all existing legacy/approved-addition mutations remain checked.

## Files changed

- skills/super-auto/SKILL.md
- skills/super-auto/resume.md
- skills/super-auto/report-prompt.md
- skills/super-auto/scripts/report-status
- skills/super-auto/run-state.md
- tests/super-auto/test-scripts.sh
- tests/super-auto/test-contract-lint.sh
- tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt
- tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt

## Tests

Both final suites exited 0. Exact commands (the final script log includes all legacy tests, predecessor producer/projection cases and new collector consumers):

```bash
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.3 && env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.3 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/state bash tests/super-auto/test-scripts.sh > .superpowers/task-evidence/super-plan-ufz.8.3/scripts-final.log 2>&1; result=$?; tail -34 .superpowers/task-evidence/super-plan-ufz.8.3/scripts-final.log; exit "$result"
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.3 && env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.3 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/state bash tests/super-auto/test-contract-lint.sh > .superpowers/task-evidence/super-plan-ufz.8.3/contract-final.log 2>&1; result=$?; cat .superpowers/task-evidence/super-plan-ufz.8.3/contract-final.log; exit "$result"
```

Final relevant script output:

```text
  [PASS] projection works without jq
  [PASS] no-jq projection retains identical key output
  [PASS] missing Node gives unavailable status, never a clean empty result
  [PASS] manual fallback preserves continuity obligations
  [PASS] unavailable source artifacts are an explicit gap
  [PASS] retained occurrences survive unavailable source
review collection and caller continuity
  [PASS] malformed new collection cannot appear clean
  [PASS] collection resumes after interrupted copy
  [PASS] resume replays complete collections
  [PASS] second resume changes no records
  [PASS] bundle diff archived byte for byte
  [PASS] split assembled input archived
  [PASS] ready silent retry collected independently
  [PASS] collected producer records validate in predecessor projection
  [PASS] one occurrence per source identity and supported disposition survives ready retry
  [PASS] status exposes historical outstanding findings despite latest ready
  [PASS] settled intent history creates no false collection gaps
  [PASS] verified complete archive survives source workspace removal
  [PASS] null review with no work landed preserves null semantics
  [PASS] null no-work with a partial bundle remains a gap
  [PASS] unexpected null bundle still retains complete extraction
  [PASS] null result never erases discoverable findings
  [PASS] missing declared direct input blocks collection completion
  [PASS] null required review is a durable evidence gap
  [PASS] status exposes collection gaps
  [PASS] missing required bundle remains pending
  [PASS] conflicting archive is not overwritten on replay
  [PASS] conflicting archive bytes retained for recovery
  [PASS] known inline sources remain valid through collection gap
  [PASS] supported rejected item stays off punch list while active defects stay open
  [PASS] unrelated missing collections remain gaps after local archive repair
  [PASS] repaired collection appends completion after an earlier identical completion
All super-auto script tests passed
```

Final contract output:

```text
contract lint: live tree
  [PASS] skills/super-auto has no contract problems

contract lint: mutations are caught
  [PASS] a broken § pointer fails
  [PASS] a mislabelled run-state item pointer fails
  [PASS] an unknown worked-example field fails
  [PASS] a worked example missing a codeBuckets bucket fails
  [PASS] a numeric list count fails
  [PASS] a renamed field-table field fails the baseline
  [PASS] I8 without projection fails
  [PASS] report-prompt without the null reviewPath rule fails
  [PASS] unapproved added field still fails
  [PASS] changed legacy line format fails
  [PASS] dropping an approved added field fails
  [PASS] changed approved added format fails

All super-auto contract lint tests passed

```

`git diff --check` and `git diff --exit-code -- tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt` passed. `git status --short` was empty after commit. No full-epic sweep was run here.

## TDD evidence

Used test-driven-development, writing-skills and verification-before-completion. All RED runs used the exact isolated environment above with `bash tests/super-auto/test-scripts.sh`, or `bash tests/super-auto/test-contract-lint.sh`, before their corresponding changes. Raw evidence remains git-ignored under the owned task worktree's .superpowers/task-evidence/super-plan-ufz.8.3 directory:

- scripts-red.log: 2 failures; --collect returned usage exit 2 instead of 0. The guarded archive/projection/status assertions were explicitly unmeasured until GREEN.
- scripts-edge-red.log: archive-only resume returned 3 instead of 0. Its second no-work failure was fixture interference from a deliberately pending preceding case; the cases were reordered to test no-work independently, rather than weakening the expected outcome.
- scripts-null-red.log: 1 failure; the actual null/no-work settlement was refused against its planned non-null launch path.
- scripts-partial-null-red.log: 3 failures; contradictory null/no-work with a recoverable bundle returned 0, omitted source extraction and lost discoverable findings.
- scripts-malformed-red.log: 1 failure; malformed complete-looking collection JSON was omitted from status instead of qualifying a gap.
- scripts-repair-red.log: 1 failure; repaired archive completion was globally deduplicated against an older completion, leaving the latest record gapped.
- contract-red.log: 1 failing suite with four live-tree errors: no I8 projection, no retained complete extraction, Remaining not using projection and no resume collection recovery.

Each was observed before its implementation fix; the final GREEN outputs above cover all assertions. The fixtures fail for changed archived bytes, duplicate occurrence identities, missing split/required inputs, lost inline findings, silent resolution, unsupported key clearing, null-clean invention, malformed-clean status, false gaps from valid historical intents or failure to record repaired completion. Tests exercise actual Bash/Node helpers, complete producer extraction and the predecessor projection; no mocks, live tracker mutations or live run artifacts are used.

## Interface for downstream super-plan-ufz.6

The validated predecessor interface remains exactly:

```bash
bash skills/super-auto/scripts/scope-dispositions --project RUN_MD
bash skills/super-auto/scripts/scope-dispositions --project RUN_MD --keys
bash skills/super-auto/scripts/scope-dispositions --project RUN_MD --external FILE
```

JSON retains `{version:1,findings:[...],gaps:[...]}`; metric-task additive fields may coexist. Check each group's `outstanding`/`deferred`, original `ref`, occurrences and supported dispositions; this task does not recompute or replace that engine. Exit 0 validates projection, 3 retains findings plus gaps, 2/4 establishes no projection. Keys alone cannot establish clean acceptance. Full source records retain known occurrences even when their archive pointer is unavailable.

New explicit preservation interface:

```bash
bash skills/super-auto/scripts/report-status --collect RUN_MD --invocation ID --workspace WORKSPACE --review FILE_OR_none --verdict REVIEW [--required RELATIVE_FILE]...
bash skills/super-auto/scripts/report-status --collect RUN_MD
```

The caller confirms settlement from persisted Launch/result, supplies the exact invocationId and actual reviewPath/null result, and preserves any declared required-input inventory. Collection returns 0 only when preservation is confirmed; 3 retains gaps and blocks later invocation/cleanup; 2/4 means no collection established. The initial intent in approvals contains invocationId/workspace/reviewPath/review/required/settled:false; settled/completion records append facts with complete/files(path,sha256)/gaps. The last record per invocation describes preservation progress only. It never closes a finding or root acceptance obligation. Archived source IDs are ID/final and ID/cluster-N; artifact pointers are reviews/ID/... relative to RUN_MD. Existing finding-route/link/disposition records are preserved.

Ordinary `report-status RUN_MD [--tip SHA] [--stalled PHASE]` keeps all legacy status forms/output where new data is absent. New records add `outstanding findings: N`, `review collections pending: N`, `review collection gaps: N`, `finding evidence gaps: N`, or an unavailable qualifier. Ordinary status exit 0 is a successfully rendered status, not an acceptance/cleanup approval: task .6 must inspect the projection, collection outcomes and its own caller-owned review/measurement/human obligations. This task deliberately adds no root-closing option or acceptance engine.

## Test hygiene

None. Completed runs were followed by stop-run-processes --check; final --check and stop both exited 0 with no match or survived lines. No background server/daemon/watcher was started and no process was stopped outside the task roots. Tests used TMPDIR plus HOME and XDG_CONFIG_HOME/DATA_HOME/CACHE_HOME/STATE_HOME under /tmp/sp-bce79baa/super-plan-ufz.8.3. The test runner and package-under-test resolved inside the owned worktree; system Node is /opt/homebrew/bin/node. No dependency installation/setup is required for these built-in Node/Bash tools.

## Assumptions

Current bead description/acceptance and comments were read before the frozen brief. No explicit amendments, comments or unresolved requirement conflicts were present. Consumed exact task-13-report interfaces from predecessor .8.4 and the landed .8.1/.8.2 identity/extraction contracts. Integration and the user's checkout remained read-only; only the assigned report was written outside the owned worktree (apart from prescribed isolated temporary test state). No agents were spawned and no Herdr writes were made.

## Concerns and coordinator evaluation

Coordinator reports the archived paired 30-trial baseline pack (behavior-baseline/report.md, manifest/scores/raw), including F17 retention, no-change validity, source/cleanup, partial metrics and attribution composites. This supports the minimal structural consumer correction. That baseline does not establish behavior of this newly introduced collector.

Representative fresh-agent post behavior evaluation is REQUIRED and remains coordinator-owned/pending, as does integrated same-pack after/live-isolation evidence. This implementer cannot spawn agents per dispatch. Deterministic RED/GREEN helper fixtures are not claimed as fresh-agent behavior verification. Recommended post scenario: I1 blocked with an active and deferred finding, I2 ready/silent, interrupted copy before completion; fresh resume twice must preserve bytes/refs/dispositions, expose I1, keep I2 separately ready and refuse cleanup for missing/partial/null-required evidence. Also cover null/no-work with no artifact and contradictory partial artifacts.

Semantic sufficiency of a fix/rejection remains the owning agent's judgment before recording supported disposition; structural fields alone are not a semantic oracle. The collector cannot infer a missing optional direct input from absence alone, so callers must declare known required direct inputs with --required; split manifest and discovered assembled files are checked mechanically. Collection must run after confirmed settlement and serially with run.md writes, as the operative recipe specifies. Acceptance ownership, metrics and the full epic sweep remain outside this task.

## Fix pass

Status: FIXED

- Task: super-plan-ufz.8.3
- Original stacked base (retained for --onto integration): 44a0c1896f7b52095d4d77b2580ff34c84974533
- Pre-fix head / RED production revision: 9095b2667b4a05fc4f229a725ab266211bce26f7
- Fixed head: efec33f6c7ceb333d695a5163b9d4987116c2fc7
- Commit: fix(super-auto): preserve producer direct review packages
- Interface changes: none. CLI flags, exit meanings, collection record schema, source identities and outstanding projection remain unchanged.

### Finding and narrow correction

Verified the Important finding against `skills/super-code/coordinator.js` finalReviewPrompt: direct review invokes review-package with `${reviewPath}.diff`, while reviewPath defaults to `final-review-ID.md`. The collector's discovery and hasBundle checks incorrectly expected `final-review-ID.diff`. Both now recognize the actual `final-review-ID.md.diff` filename. No producer, root acceptance, measurement, metric, or disposition logic changed.

The fixture now uses that producer filename. Added behavior checks prove that completion inventories it, repeated collection preserves exact bytes and records, an archive conflict returns 3 without overwriting either archive or source, and repair permits completion. A null/no-work result with only that direct package returns 3, archives the available bytes, records both reconciliation and missing-review gaps, and remains idempotently gapped on replay. Existing interrupted-copy, split-input, source-workspace-removal, immutable source/extraction, retained finding and other gap cases still pass. The new assertions catch an omitted package/inventory, incorrect complete result, overwritten source/destination bytes, lost reconciliation/missing-review gaps, or non-idempotent records; none depend on source-text matching.

Files changed in this fix: `skills/super-auto/scripts/report-status` and `tests/super-auto/test-scripts.sh` (two production suffix substitutions plus producer-shaped regressions).

### RED/GREEN evidence

Used systematic-debugging, test-driven-development (including writing-good-tests), and verification-before-completion. Read the current bead description/acceptance and comments before changing code; no comments, amendments, or unresolved conflicts were present.

Exact test commands, run in the owned task worktree with isolated HOME/XDG state:

```bash
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.3 && env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.3 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/state bash tests/super-auto/test-scripts.sh > .superpowers/task-evidence/super-plan-ufz.8.3/scripts-fix-red.log 2>&1; result=$?; tail -60 .superpowers/task-evidence/super-plan-ufz.8.3/scripts-fix-red.log; exit "$result"
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.3 && env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.3 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/state bash tests/super-auto/test-scripts.sh > .superpowers/task-evidence/super-plan-ufz.8.3/scripts-fix-green.log 2>&1; result=$?; tail -54 .superpowers/task-evidence/super-plan-ufz.8.3/scripts-fix-green.log; exit "$result"
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.3 && env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.3 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.3/state bash tests/super-auto/test-contract-lint.sh > .superpowers/task-evidence/super-plan-ufz.8.3/contract-fix-green.log 2>&1; result=$?; cat .superpowers/task-evidence/super-plan-ufz.8.3/contract-fix-green.log; exit "$result"
```

RED exited 1 before either production edit, with seven expected assertion failures:

```text
  [FAIL] producer direct package archived byte for byte after replay
  [FAIL] completed collection inventories the producer direct package
  [FAIL] conflicting direct package blocks collection completion
    expected: 3
    got:      0
  [FAIL] null no-work with only the producer direct package remains a gap
    expected: 3
    got:      0
  [FAIL] null result still archives the recoverable direct package
  [FAIL] direct-only null bundle records reconciliation and missing review gaps
  [FAIL] direct-only null gap persists on replay
    expected: 3
    got:      0
7 failure(s)
```

GREEN script run exited 0; relevant output:

```text
  [PASS] collection resumes after interrupted copy
  [PASS] resume replays complete collections
  [PASS] second resume changes no records
  [PASS] producer direct package archived byte for byte after replay
  [PASS] completed collection inventories the producer direct package
  [PASS] conflicting direct package blocks collection completion
  [PASS] conflicting direct package is never overwritten
  [PASS] direct package source is preserved through archive conflict
  [PASS] repaired direct package restores verified completion
  [PASS] split assembled input archived
  [PASS] ready silent retry collected independently
  [PASS] collected producer records validate in predecessor projection
  [PASS] one occurrence per source identity and supported disposition survives ready retry
  [PASS] status exposes historical outstanding findings despite latest ready
  [PASS] settled intent history creates no false collection gaps
  [PASS] verified complete archive survives source workspace removal
  [PASS] null review with no work landed preserves null semantics
  [PASS] null no-work with only the producer direct package remains a gap
  [PASS] null result still archives the recoverable direct package
  [PASS] direct-only null bundle records reconciliation and missing review gaps
  [PASS] direct-only null gap persists on replay
  [PASS] direct-only null replay changes no records
  [PASS] null no-work with a partial bundle remains a gap
  [PASS] unexpected null bundle still retains complete extraction
  [PASS] null result never erases discoverable findings
  [PASS] missing declared direct input blocks collection completion
  [PASS] null required review is a durable evidence gap
  [PASS] status exposes collection gaps
  [PASS] missing required bundle remains pending
  [PASS] conflicting archive is not overwritten on replay
  [PASS] conflicting archive bytes retained for recovery
  [PASS] known inline sources remain valid through collection gap
  [PASS] supported rejected item stays off punch list while active defects stay open
  [PASS] unrelated missing collections remain gaps after local archive repair
  [PASS] repaired collection appends completion after an earlier identical completion
All super-auto script tests passed
```

Contract lint exited 0:

```text
contract lint: live tree
  [PASS] skills/super-auto has no contract problems

contract lint: mutations are caught
  [PASS] a broken § pointer fails
  [PASS] a mislabelled run-state item pointer fails
  [PASS] an unknown worked-example field fails
  [PASS] a worked example missing a codeBuckets bucket fails
  [PASS] a numeric list count fails
  [PASS] a renamed field-table field fails the baseline
  [PASS] I8 without projection fails
  [PASS] report-prompt without the null reviewPath rule fails
  [PASS] unapproved added field still fails
  [PASS] changed legacy line format fails
  [PASS] dropping an approved added field fails
  [PASS] changed approved added format fails

All super-auto contract lint tests passed
```

`git diff --check` passed. Comparing both historical 2bf1d53 fixtures against the original stacked base exited 0. Post-commit `git status --short` was empty. No rebase or merge was performed; the original stack base is retained.

### Fix-pass test hygiene and remaining evaluation

No leaked processes were found after RED, GREEN script, or contract-lint runs: each completed outside-root `stop-run-processes --check` exited 0 with no output. The final `stop-run-processes` stop also exited 0 with no output; no match or survived lines occurred, and no background process was started. The first RED launch could not redirect its log under the sandbox and did not execute tests; the authorized escalation then produced the RED evidence above. An initial leak check from inside the target worktree returned its protective exit 2; rerunning from outside the task roots returned 0 with no output. All completed test runs use the prescribed isolated temp state. No agents were spawned and no Herdr writes were made.

The Minor pending-behavior-eval finding remains deferred to the coordinator as instructed. Fresh-agent post evaluation, integrated after/live-isolation evidence, root acceptance and metric decisions remain coordinator-owned; these deterministic tests make no claim to establish them.
