# super-plan-ufz.8.4 implementation evidence

Status:IMPLEMENTED

id: super-plan-ufz.8.4
Initial base: 14444f0c6396a132250741eb45e5bab1cf934184
Final base: 0ae5dd86318d7758f441b4d0ad14fee5b9ca6b74
Head: ee4f3cfcd20a6eb8ada40f32e821dbbd6895630b
Branch: task-super-plan-ufz.8.4
Stacked: false
Reopened: false
Worktree: /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.4

## Implementation

Added an independent --project branch to the existing scope-dispositions script, retaining the legacy round/filter/step-back implementation unchanged. Existing approvals records now retain complete extractor JSON, explicit reference links, overlapping owner/fix/deferred facts and supported dispositions. No artifact collector, competing roast ledger, roast triggers, amend workflow or prescribed lifecycle was introduced.

The projection preserves immutable (source,section,position) identities and original key/text. Archive copies add artifact pointers without adding occurrences. Only explicit links combine appearances; ambiguous identical keys/text remain separate. Conflicting immutable extractions retain variants and prevent the affected findings from being resolved. No retained source is an explicit coverage gap; unavailable source artifacts preserve inline occurrences with a gap.

Resolution/rejection requires an existing occurrence reference, explicit supported judgment, nonempty basis and evidence references; resolution additionally requires relevant verification. The owning agent judges semantic support before recording that judgment. Assignment, a fix reference/closed-fix label, success-only unsupported disposition, later ready/silent source or unknown external disposition cannot close a finding. Verified fixes supplied elsewhere and supported rejection do remove findings from the outstanding-deferred view. Key mode is derived from that same view, printing only its distinct original keys; detailed JSON preserves underlying occurrence distinctions.

The historical 2bf1d53 field and format goldens were preserved byte-for-byte. Contract lint now checks their union with the explicitly approved finding-record additions and still rejects missing legacy/approved fields, changed formats and unapproved extras, with mutation coverage.

## Files changed

- skills/super-auto/scripts/scope-dispositions
- skills/super-auto/run-state.md
- tests/super-auto/test-scripts.sh
- tests/super-auto/test-contract-lint.sh
- tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt
- tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt

## Tests

Both final suites ran on the rebased Head above and exited 0. Exact shell commands (the result/tail wrappers preserve the actual test exit status):

```bash
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.4 && env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.4 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.4/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.4/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.4/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.4/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.4/state bash tests/super-auto/test-scripts.sh > .superpowers/task-evidence/super-plan-ufz.8.4/scripts-final.log 2>&1; result=$?; tail -46 .superpowers/task-evidence/super-plan-ufz.8.4/scripts-final.log; exit "$result"
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.4 && env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.4 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.4/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.4/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.4/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.4/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.4/state bash tests/super-auto/test-contract-lint.sh > .superpowers/task-evidence/super-plan-ufz.8.4/contract-final.log 2>&1; result=$?; cat .superpowers/task-evidence/super-plan-ufz.8.4/contract-final.log; exit "$result"
```

Relevant final script output (all legacy round/filter/step-back/status/no-jq assertions also passed):

```text
scope-dispositions: outstanding occurrence projection
  [PASS] projection accepts retained complete extraction and supported dispositions
  [PASS] ambiguous twins remain separate, archive dedupes and original text survives
  [PASS] keys contain deferred A only; verified B, rejected C and active D excluded
  [PASS] explicit reference link accepted
  [PASS] only explicit references combine source appearances
  [PASS] unsupported produces an explicit evidence gap
  [PASS] unsupported cannot delete known open A
  [PASS] bad-ref produces an explicit evidence gap
  [PASS] bad-ref cannot delete known open A
  [PASS] no-basis produces an explicit evidence gap
  [PASS] no-basis cannot delete known open A
  [PASS] malformed produces an explicit evidence gap
  [PASS] malformed cannot delete known open A
  [PASS] bad-link produces an explicit evidence gap
  [PASS] bad-link cannot delete known open A
  [PASS] missing external input reports a gap
  [PASS] missing external input preserves local open evidence
  [PASS] external-malformed external input reports a gap
  [PASS] external-malformed external input preserves local open evidence
  [PASS] external external input reports a gap
  [PASS] external external input preserves local open evidence
  [PASS] supported external verification may resolve explicitly referenced A
  [PASS] verified fix supplied elsewhere leaves punch list
  [PASS] silent ready retry is a valid source without dispositions
  [PASS] assignment, closed fix and later silence retain deferred A
  [PASS] legacy key transport dedupes equal keys across distinct deferred occurrences
  [PASS] changed immutable source reports a gap
  [PASS] conflicting source preserves text variants and blocks resolution
  [PASS] no retained sources is an explicit gap rather than a clean review
  [PASS] projection works without jq
  [PASS] no-jq projection retains identical key output
  [PASS] missing Node gives unavailable status, never a clean empty result
  [PASS] manual fallback preserves continuity obligations
  [PASS] unavailable source artifacts are an explicit gap
  [PASS] retained occurrences survive unavailable source
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
  [PASS] I8 without --keys fails
  [PASS] report-prompt without the null reviewPath rule fails
  [PASS] unapproved added field still fails
  [PASS] changed legacy line format fails
  [PASS] dropping an approved added field fails
  [PASS] changed approved added format fails

All super-auto contract lint tests passed
```

`git diff --check HEAD~1 HEAD` passed. `git diff --exit-code -- tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt` passed. `git status --short` was empty after commit and rebase.

## TDD evidence

Used test-driven-development and writing-skills. The coordinator owns fresh-agent baseline/post behavior evaluations; no agents were spawned here.

RED 1: the same isolated environment and `bash tests/super-auto/test-scripts.sh`, before helper changes, produced `20 failure(s)`. New valid --project calls returned usage exit 2 and no keys instead of the expected projection/keys; unsupported/missing external cases likewise returned 2 instead of retained results plus gap status 3. Existing assertions passed. The two JSON-dependent assertion bodies were guarded and unmeasured during this RED, then passed during GREEN. An empty-output assertion following a failed status check was not sufficient evidence and was only accepted after the corresponding status check passed in GREEN.

```text
[FAIL] projection accepts retained complete extraction and supported dispositions
  expected: 0
  got:      2
[FAIL] keys contain deferred A only; verified B, rejected C and active D excluded
  expected: [Nit] café,format.ts:1 — A
  got:
20 failure(s)
```

RED 2: added the absent-retained-source fixture before adding its check. The script suite produced `1 failure(s)`, with `no retained sources is an explicit gap rather than a clean review` returning 0 instead of 3. All other edge fixtures passed. Adding the explicit unknown-coverage gap made this GREEN.

RED 3: contract lint's approved-additions fixtures preceded operative run-state documentation. It produced `1 super-auto contract lint test(s) failed`, identifying the missing approvals finding-source/link/route/disposition fields and exact line formats. All mutation checks passed. Adding field-table rows, worked examples and the operative record/CLI instructions made this GREEN. The final rebased runs above passed again.

Raw RED/GREEN evidence remains git-ignored inside this task worktree under `.superpowers/task-evidence/super-plan-ufz.8.4/`: scripts-red.log, scripts-edge-red.log, scripts-green.log, contract-red.log, scripts-final.log, contract-final.log. Final log files reflect the rebased head. These deterministic fixtures would fail if appearances auto-merged, archive paths created new identities, supported dispositions stayed on the punch list, active nondeferred findings leaked into keys, unsupported input dropped A, source text/positions were lost or unavailable tooling appeared clean.

## Interface for super-plan-ufz.8.3 and super-plan-ufz.9

Consume .8.1's persisted invocation token rather than runTag to construct an immutable logical source such as `inv-a/final`; the actual artifact is `final-review-inv-a.md`, with split artifacts such as `final-review-inv-a.cluster-1.md` using a different logical source such as `inv-a/cluster-1`. The exact landed .8.2 producer is:

```bash
bash skills/super-code/scripts/report-verdict --complete --source 'inv-a/final' '<artifact-path>'
```

It returns `{version:1,source,artifact,kind,verdict,occurrences:[{section,position,key,text}]}`. Retain all occurrences. When archiving, preserve source/section/position/key/text and update only artifact to the archive copy; relative artifact paths resolve from RUN_MD's directory. This task does not collect artifacts or append records automatically.

Append these one-line JSON record forms in the existing `approvals:` block (examples are complete producer records, not a separate file format):

```text
approvals:
- finding-source · {"version":1,"source":"inv-a/final","artifact":"final-review-inv-a.md","kind":"final-review","verdict":"not ready","occurrences":[{"section":"Deferred OK","position":1,"key":"[Nit] café,format.ts:1 — A","text":"[Nit] café,format.ts:1 — A\n  original continuation"}]}
- finding-source · {"version":1,"source":"inv-b/final","artifact":"final-review-inv-b.md","kind":"final-review","verdict":"not ready","occurrences":[{"section":"Deferred OK","position":1,"key":"[Nit] café,format.ts:1 — A","text":"[Nit] café,format.ts:1 — A\n  original continuation"}]}
- finding-link · {"refs":[{"source":"inv-a/final","section":"Deferred OK","position":1},{"source":"inv-b/final","section":"Deferred OK","position":1}],"basis":"verified same obligation"}
- finding-route · {"ref":{"source":"inv-a/final","section":"Deferred OK","position":1},"owner":"bd-fix","fix":"bd-fix","deferred":"outside the current goal"}
- finding-disposition · {"ref":{"source":"inv-a/final","section":"Deferred OK","position":1},"disposition":"resolved","judgment":"supported","basis":"another task supplied the relevant fix","evidence":["verification.log @ abc123"],"verification":"focused reproduction now passes against repaired code"}
```

A rejection uses disposition `rejected` with the same supported judgment, basis and nonempty evidence; verification is optional for rejection. A source record's payload is the exact complete extraction object, not a key-only reconstruction. For final reviews, keys retain the full original first finding line; roast keys use the producer's before-em-dash convention. Source/section/position refs remain authoritative independently of the legacy printed key.

CLI:

```bash
bash skills/super-auto/scripts/scope-dispositions --project RUN_MD
bash skills/super-auto/scripts/scope-dispositions --project RUN_MD --keys
bash skills/super-auto/scripts/scope-dispositions --project RUN_MD --external SUPPLEMENTARY_JSON
```

JSON output is `{version:1,findings:[...],gaps:[{origin,message}]}`. Each finding has first-retained `ref`, original `occurrences` including source/artifact/section/position/key/text, all `artifacts`, conflicting `variants`, explicit `links`, `routes`, retained `dispositions` with validated `supported`, and `outstanding`/`deferred` booleans. Groups and keys are deterministic in source appearance order. Route and disposition records can reference an occurrence appearing anywhere in retained source records; no mandatory event chain is imposed.

Exit 0: validated projection. Exit 3: retained projection plus evidence/record gaps. Exit 2: invalid CLI or unavailable run.md, no projection established. Exit 4: Node unavailable, no projection established. JSON includes gaps; key mode emits only deduplicated outstanding-deferred keys on stdout and `FINDING_GAP:` diagnostics on stderr. An empty key stream alone cannot mean acceptance is clean. Neither jq nor external packages are needed for this projection; the legacy round mode keeps its existing jq/manual fallback. Without Node, stderr `NODE_UNAVAILABLE:` directs manual conservative projection while retaining evidence.

Optional supplementary input is `{version:1,records:[{type:"finding-link",refs,basis},{type:"finding-disposition",ref,disposition,judgment,basis,evidence,verification?}]}`. This is a local consumer seam, not a proposed external roast ledger contract. Only references to retained local occurrences are accepted. Absent/malformed/unknown/incomplete inputs report gaps; silence/dissolved/success-only records do not resolve. Valid attributed explicit supported records can supplement the same projection; owning agents must judge semantic support before writing or adapting them. External source/routing replacement is refused. Any external record worth retaining durably should be recorded in local approvals after that judgment.

.8.3 should collect the immutable artifact bundles, append source/route/supported-disposition records without overwriting previous ones, preserve gap outcomes and route Remaining/resume/status through this projection. .9 can measure outstanding groups, outstanding deferred groups and gaps separately from latest invocation verdict and task success; archive copies and duplicate printed keys are not separate resolved/remaining obligations. This task does not implement those consumers.

## Test hygiene

No leaked processes remained after any completed run, and final --check plus stop both exited 0 with no matches or survived lines. No server, daemon or watcher was started. One check was inadvertently issued while the first contract RED run was still active; it listed PIDs 11652, 11664, 25452 and 26614 under that running test's worktree. The test was allowed to complete and the immediate post-completion check was empty; these were active test processes, not surviving test leaks. No unrelated process was stopped.

Final commands, run from outside the owned roots:

```bash
cd /Users/alepar/AleCode/superpowers && bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.4 /tmp/sp-bce79baa/super-plan-ufz.8.4
cd /Users/alepar/AleCode/superpowers && bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.4 /tmp/sp-bce79baa/super-plan-ufz.8.4
```

## Assumptions

Current bead description/acceptance and comments were read before the frozen brief. No comments/amendments or unresolved conflicts were present. The nested continuity spec and root invariant are authoritative and compatible. Predecessor task-8/task-9 reports supplied the invocation and occurrence contracts actually consumed here.

There is no dependency installation/setup for these Node built-in/Bash scripts. The runner `tests/super-auto/test-scripts.sh` and package-under-test `skills/super-auto/scripts/scope-dispositions` both resolved inside /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.4; system Node is /opt/homebrew/bin/node. Tests and product helper invocations used the prescribed TMPDIR plus isolated HOME and all XDG config/data/cache/state homes. Integration and the user's checkout remained read-only; only this report was written outside the task worktree. No subagents or Herdr writes were used.

## Concerns

Semantic sufficiency of a fix/rejection cannot be proved by these structural helpers. The owning agent must assess the evidence and explicitly record the supported judgment; mere presence of evidence text is not a semantic oracle. This is the specified helper/agent boundary.

Coordinator-owned fresh-agent interrupted-invocation and changed-instruction baseline/post evaluations remain pending outside this task. Collection/routing/resume/status integration belongs to .8.3 and acceptance metrics to .9. The full epic sweep was not run here. No PR was opened, no tracker closure was performed and no external ledger policy was introduced.
