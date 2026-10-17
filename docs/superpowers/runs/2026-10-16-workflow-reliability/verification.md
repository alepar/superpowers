# Integrated workflow reliability verification

This records deterministic integration measurements, separate from super-auto's final acceptance. The tested integration base is `3968cd7bd703518023cdafc618cc65faa7a94cd7`; its repository tree is `c2d4f8f4f760a9a58be9b611419c462f0207c533`. Its `skills/` subtree, `a89cf9f0cfde6e72008d661a7b7196a5ab9cb1d0`, equals the frozen product at `0bb280edcf5fc6a60499fdfdb090d1819a432963`. Task-local changes add integration fixtures and repair test teardown; historical baselines and product instructions are unchanged. Exact tested source hashes and commands are retained under [integration evidence](../../../../evidence/super-plan-ufz.14/).

## Acceptance and evidence

| Spec / acceptance | Producer → consumer exercised | Named evidence and outcome | Kind / limits |
| --- | --- | --- | --- |
| §1 stable source and isolated reproduction | Captured Git commits → PR/task/final/direct-input review prompts | `test-assemble-args.sh`, `test-dispatch-text.sh`, replay stable-source/fallback scenarios; parent [live isolation](live-review-isolation/report.md) | CLI fixtures are live helper execution; coordinator replay is simulated. Parent live two-seat exercise passed observed isolation with concerns. |
| §1 cleanup denial → retained resources → Remaining | Real `stop-run-processes` / `remove-task-worktree` controlled inspection failures → Workflow cleanup result arrays and resource identities | Replay `scripts: cleanup uncertainty` plus `cleanup result propagation`; owned real-process cases and failure-path probe | Live helper calls and controlled fault injection. Unknown, survivor and deliberate retention remain distinct. Native Linux `/proc` integration was not run on this macOS host. |
| §2 interruption and retry | Real ledger digest → persisted landing/head/review/blocker identities → resume reconciliation → admission/closure | Replay `resume: real ledger digest`, `closure recovery: auth refusal`, `recovery resume: durable landing`, post-slot admission and external-readiness cases | Simulated Workflow with actual digest CLI; no repeated implementation/merge; scoped unknown holds retain unrelated eligibility and repeat closure is idempotent. |
| §3 evidence and no-change completion | RESULT records → shared classifier → independent evidence review → closure-only completion → durable resume | Replay `source-bound check evidence` and `independently reviewed verification-only completion`; ordinary dispatch `review --result-file`, `verification-close`, `check-evidence` | Deterministic simulation/CLI fixtures. Required live checks reject simulated/fallback success. No artificial landing; same-source review and evidence are required. Fresh-agent B4 limits remain below. |
| §3 caller and standalone acceptance | Deferred Recovery obligation and completed leaves → caller root gate; standalone helper keeps its own root behavior | Replay `caller-owned root acceptance`, `deferSweep`; actual `close-in-tree-epics` default/`--exclude-root`; `test-scripts.sh` caller gate | Simulated Workflow plus live CLI against fake tracker. A finished leaf or ready review supplies no human acceptance. No real epic was closed by this verification. |
| §3–4 historical finding plus deferred measurement | Interrupted archive → complete source extraction → ready retry → ordinary classified evidence → root gate → supported elsewhere fix | Added `test-scripts.sh` integration fixture: collection → ordinary evidence → caller gate → disposition → metrics | Live deterministic CLI pipeline. Simulated/pass leaves measurement and finding pending; live/pass clears only measurement; supported finding resolution removes its key. Other two findings remain nonblocking and outstanding. |
| §4 identity and finding continuity | Distinct invocation bundles → extractor → shared outstanding projection → resume/status/punch list | Replay invocation/split/stub/null cases; `test-report-verdict.sh`; `test-scripts.sh` interrupted/conflicting archives, missing/null artifacts and repeated collection | Deterministic helpers preserve original occurrence/source/text. Identical replay is unchanged; conflict never overwrites archive bytes. Assignment, success and silence supply no disposition. |
| §5 metrics and diagnosis | Validated ledger + Git/tracker reconciliation + durable fix history + finding projection → reported counts; transcript timing → profiler | Replay metrics transport/identity/Finish reconciliation cases; `test-run-digest.sh`; `test-run-profile.sh`; new integration projection asserts repaired 1 / rejected 1 / outstanding 2 | Partial populations remain explicit. Coordinator does not invent repaired-finding totals without projection. Profiler integration gap and final suite outcomes are recorded below. |

The integration fixture uses the original collected invocation sources, adds a ready silent retry, and independently consumes real `dispatch-text check-evidence`, `report-status --acceptance`, `scope-dispositions --project [--keys]` and `report-status --collect`. It checks unchanged source-occurrence counts after resolution and byte-identical replay after the dispositions. All smoke measurements (including records tagged `live`), supported judgments and human decisions are fixture inputs; only helper execution is live. No actual smoke check or human acceptance is claimed by this fixture.

## Required regression measurement

All required suites run sequentially through `node evidence/super-plan-ufz.14/run-required-suites.mjs`. The runner records each exact command, exit, elapsed seconds, complete output and subsequent hygiene result in [required-results.json](../../../../evidence/super-plan-ufz.14/required-results.json). Each test runs in the task worktree with:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.14
HOME=$TMPDIR/home
XDG_CONFIG_HOME=$TMPDIR/config
XDG_DATA_HOME=$TMPDIR/data
XDG_CACHE_HOME=$TMPDIR/cache
XDG_STATE_HOME=$TMPDIR/state
```

The runner changes its own cwd to `/tmp` before launching each test with the task-worktree cwd. After each finished suite it runs the prescribed canonical `stop-run-processes --check` against only the assigned task worktree and temp root. Process-inspection checks run with authorized sandbox escalation. Node is `/opt/homebrew/bin/node`; this repository has no dependencies or install step, and all runners/packages-under-test resolve inside the task worktree.

Replay completed with **2273 passed, 0 failed**. Its three documented dryRuns measured **48, 19 and 23** dispatches, matching current `coordinator-workflow.md`. These are simulated runtime observations, not hosted Workflow or live ordinary-agent execution. The historical 1770 baseline remains historical.

The first complete required run finished **20/23 suites passing**, with **23/23 post-suite hygiene checks verified empty**. The Bash invocation audit passed in 559.911 seconds; it was the slowest command and was allowed to finish. Original failures remain in the logs:

- `test-run-profile.sh`: one failure, unclassified new `resume-check` dispatch kind. The parent routed this producer/consumer gap to task `super-plan-ufz.20`, whose `e5672164` fix classifies the pre-admission observation as run-level readiness without inventing a task attempt or occupied slot. No expectation was loosened.
- `test-report-verdict.sh`: five assertions failed after its generated final-review producer exited 2. The fixture's Launch omitted the now-required persisted invocation ID. This task adds `invocationId ep-parser-contract`; all prompt/parser assertions remain intact, and the product missing-ID guard is unchanged.
- `test-package-codex-plugin.sh`: exit 9 after the existing package script rejected a linked worktree's `.git` file because it requires a `.git` directory. The missing archive then makes extraction unavailable. Both script and test are byte-identical to run baseline `d84541ae`; this is an existing checkout-layout limitation, not a new reliability source change. A standalone checkout is required for that suite and is measured separately below.

Each failure was independently reproduced in a detached throwaway checkout of exact task base `3968cd7b`, then that checkout was removed. [base-profile.log](../../../../evidence/super-plan-ufz.14/base-profile.log), [base-verdict.log](../../../../evidence/super-plan-ufz.14/base-verdict.log), and [base-package.log](../../../../evidence/super-plan-ufz.14/base-package.log) retain the complete outputs. Reproducing the profiler gap at this task's base does not exonerate the earlier run introduction; the parent's task 20 owns and fixes it.

An intermediate new seam assertion expected the `unknown:` classifier prefix in `processSweep.unknown`. The established consumer removes that prefix and preserves the fact text. The new assertion was corrected to compare the exact fact after documented prefix removal; original assertions were untouched. That intermediate 2276-pass/1-fail result remains in the pre-rebase log. Final post-refresh results follow below.

## Fixture failure teardown

The actual two replay fixture bodies are exercised by [fixture-failure-probe.mjs](../../../../evidence/super-plan-ufz.14/fixture-failure-probe.mjs), injecting a helper exception or unavailable `ps` stdout. Against the unchanged baseline, all four cases failed: the worktree cases leaked one owned sleeper each and process cases leaked six owned processes each. The probe's independent oracle stopped every recorded fixture PID. This is the reproduced test-hygiene defect, not an unverified product-cleanup claim.

The fix registers children and orphan PIDs immediately, signals only those owned PIDs in `finally`, waits for owned child exits, and removes fixture state after teardown. An unavailable `ps` response throws an explicit inspection-unavailable error. All existing successful-path ownership, stop/no-stop and resource-retention assertions remain. The corrected probe reports **4 passed, 0 failed**, zero live fixture PIDs, no retained fixture directories, and an unregistered live sentinel preserved in every case. The oracle then stops its own sentinel. No process-name matching or unrelated process kill is used.

## Coordinator-owned behavioral evidence and limits

The parent retained original evidence under [behavior-baseline](behavior-baseline/report.md), [behavior-after](behavior-after/report.md), and [live-review-isolation](live-review-isolation/report.md). These are separate from the deterministic suite results:

| Scenario / claims | Before | Frozen after | Interpretation |
| --- | --- | --- | --- |
| A1–A5: stable review/caller isolation/unknown cleanup/resources | Each installed and no-tested-guidance arm 5/5 pass | Each 5/5 pass | Bounded text decisions; A2 does not establish separate live mutable outputs because the reused-path scenario is ambiguous. |
| B1–B3, B5: root acceptance/caller measurement/finding retention/evidence | Each arm 5/5 pass | Each 5/5 pass | Regression observations. Controls already succeeded; no need for stronger general guidance is inferred. |
| B4: accept reviewed no-change verification without artificial commit | Installed 2 pass / 3 fail; control 5 pass | **0 pass / 2 fail / 3 ambiguous** | Frozen V9 lacks newly required sourceTree and clean-status metadata. Recognition of the verification-only path is 5/5, but unconditional completion is not demonstrated. Original scores remain unchanged. |
| Separate protocol-complete V9 / mismatched V10 diagnostic | New installed arm accepts supported V9 0/5; refuses mismatched V10 5/5 | Final arm accepts V9 5/5, refuses V10 5/5, rejects artificial commits 5/5; controls match | [Separate diagnostic](nochange-diagnostic/report.md), constructed after observing frozen B4 with its own pretrial freeze. Fictional complete observations establish a bounded decision result, not live no-change completion. |
| C1–C8: attribution/history/counts/partial metrics/readiness/concurrency/planning/classes | Each arm 5/5 pass | Each 5/5 pass | Bounded decisions, no production failure-rate estimate. |
| Live independent PR and final-review seats, caller advancing twice | No paired baseline | PASS observed source/resource isolation; DONE_WITH_CONCERNS; verifier 24/24 | Actual generated review prompts, separate mutable outputs and captured Git identities. Controlled assembler exit exercises behavior after fallback selection, not the entire real coordinator transition. Task-review no-test policy and arbitrary detached-descendant absence were not established. Global `ps` was denied in that separate exercise. |

The source freeze is `0bb280ed`; parent artifacts contain exact full-file/excerpt hashes and the recheck. Samples use gpt-6.1-sol / medium / fresh context. Frozen AFTER has 15 respondents and 90 claim decisions (85 pass, 2 fail, 3 ambiguous); baseline has 30 counted respondents and its retained excluded pilot. The separate diagnostic adds 15 respondents and 60 claim decisions (55 pass, 5 fail), with no retries or exclusions. Evaluation is manually scored, unblinded and small. The diagnostic supports identifying the installed empty-package obstacle; matching control success supplies no demonstrated benefit over ordinary judgment. It cannot overwrite frozen B4 scores, prove live completion, or establish exact workflow-stage routing; its collateral answer errors remain recorded.

Super-auto still owns the final integrated sweep, whole-epic review, code roast, behavioral assessment and required human acceptance. This integration report does not close those obligations or the real root epic.
