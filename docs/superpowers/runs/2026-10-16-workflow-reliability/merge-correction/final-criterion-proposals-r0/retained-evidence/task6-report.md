# Task 6 — five bounded seam repairs

Implementation delivered for independent review. This report is not current-root acceptance, whole-branch readiness, a full integration-suite result, or a new policy/round allocation. Parent-owned run records and historical evidence remain unstaged and unchanged by this implementer.

## Source and commits

- Base: `7fc5a4ddb2d0913b769484935f79e6daccff966b`.
- Main repair: `9695b0bdcede3426317329f30d73fb11514e671e`, tree `85475fceb7324e617c886d9bcf057ea4ba40905f`.
- Workflow metrics follow-up: `7b18b0c26b9f19d531c558e112d490743901a13b`, tree `61a8b70d795acd816d348934bd55293264ed5587`.
- Exact changed-file Git blobs and SHA-256: `task-6-seam-repair-evidence/source-identities.json`. These identify tested product files; parent-owned dirty documentation is not restamped onto an acceptance claim.
- Original independent reviews remain at `docs/superpowers/runs/2026-10-16-workflow-reliability/merge-correction/product-coverage/{cleanup-review.md,metrics-review.md}` with original probes and pinned identities. Both reports were read in full. The original acceptance output receipt at `merge-correction/acceptance-output-probe/current-receipt.json` remains unchanged (pin `583f2486ebe6b00a5c6fe3b87bc3d5b98ed53533`, 84,284 regular bytes versus 65,536 piped bytes, both exit 0).

## Repairs and evidence

### CLEANUP-01

`stop-run-processes` now retains Git inventory failure as `unknown:`/exit 4 before process matching or signalling. Successful but empty inventory is also unknown. A failed lookup may allow an ordinary nonrepository temporary directory only when Git's canonical C-locale absence diagnostic agrees with an accessible ancestor walk containing no Git metadata. The standard filesystem-boundary absence diagnostic is supported; corrupt working-tree and bare repository metadata remain unknown. Existing nested-worktree refusal remains exit 2.

Initial deterministic RED: denied repository inventory, corrupt `.git` metadata, and unavailable Git incorrectly returned 0. Real valid leaf repository, verified temporary directory and nested-worktree refusal controls passed. An additional boundary RED exposed a standard mount-boundary temporary-directory false refusal and corrupted bare-repository false success; both now pass their intended controls. Final: 8 tests pass in about 3 seconds. Process tools are controlled and any signal is trapped; real Git creates only disposable repositories. This establishes helper outcome/ownership gating, not live process termination or a Linux execution claim.

### CLEANUP-02

Both actual `workspaceSetup` prompts now invoke `remove-task-worktree --discard --tmp ...`, capture its outcome and stop setup with `SETUP_FAILED` on any nonzero exit, retaining remaining resources and output. Recut proceeds only on exit 0; a cleaned stack conflict returns `STACK_CONFLICT` only on exit 0.

Following the parent's explicit extension authorization, the existing discard helper was minimally repaired too. RED proved it returned 0 after failed worktree removal, failed branch deletion (present or already-removed worktree), and denied branch discovery. Failed worktree removal now retains the branch and returns 3; failed branch deletion reports the remaining branch/3; failed inspection or prune returns unknown/4. Successful inspection proving the branch already absent remains success. No replacement cleanup engine or interface was added.

Final: 11 tests pass in about 4 seconds. Tests execute real disposable Git cleanup, the real helper with a controlled process-stop boundary, and the cleanup command extracted from the actual generated recut and stack-conflict prompts. Exit 3 and 4 retain worktree and branch. Controls cover successful discard, already-absent resources, default cleanup under rejection of force commands, dirty-worktree preservation and unmerged-branch preservation. New repositories disable automatic Git maintenance. The tests do not claim agent compliance; the parent owns the separate current-prompt agent supplement.

The replay harness's old source-spelling assertion required the literal `git worktree remove --force "$wt" && echo` expression whose error suppression is the bug. It was replaced by a reference to the real default/discard tests. Existing replay checks for dirty and unmerged retention remain unchanged. The new test proves default cleanup succeeds even when forced commands are rejected, and independently preserves dirty/unmerged resources; no safety expectation was weakened.

### METRICS-1

The digest distinguishes verification-only completion from task landing while retaining independently recorded earlier landing evidence for the same ID. The profile retains verification completion explicitly (`verificationOnlyCompleted`, `VERIFIED` attempt status and summary count), adds no merge for pure verification, and excludes it from failed-landing rework. An earlier timed real merge retains its original timestamp. An earlier ledger landing with no merge timing remains a fact (`landed: true`, `landedAt: null`) and is explicitly excluded from the schedule model; verification does not supply a synthetic historical timestamp.

The primary RED reproduced ordinary verification being reported landed 1. Raw initial test output includes three assertion failures and one missing-new-field KeyError; the independent preexisting probe separately shows the incorrect profile merge. An additional RED exposed an untimed historical landing being synthesized at the end of later verification; its fix retains the history without synthesizing the merge.

A post-commit producer/consumer check found the same classification bug in Workflow: `completeVerification` uses `close-only:<id>`, which the profile formerly treated as a landing for every CLOSED result. A fresh Workflow journal/transcript fixture reproduced `landed: true` for pure verification. The follow-up profile change recognizes typed verification intent, requires the CLEAN verification review and CLOSED closure to count completion, and prevents that closure from becoming a Git landing. BLOCKED closure remains incomplete; an earlier actual merge remains timed at its original 10 seconds.

Final: 8 cases pass in about 2 seconds (5 ordinary transcript cases, 3 Workflow journal/transcript cases). These use the existing actual fixture producers and metric CLIs, not a duplicate metric model. The profile's existing 325 adjacent assertions also pass after the follow-up.

### METRICS-2

The mandatory feedback report template now uses distinct task-ID reconciliation, lists ledger-only/Git-only/completed-only identities, assigns zero task landings to `baseAbsorbed`, separates verification completion, and names unavailable sources separately. The old raw first-parent merge-count incompleteness instruction is removed.

The RED/GREEN receipt is explicitly a static producer/template contract check. All five parent-owned baseline model responses already handled the two-task-landings plus one-base-absorption example correctly. No behavioral RED or measured improvement is claimed. The parent owns matching after samples; none were duplicated by this implementer.

### ACCEPTANCE-OUTPUT-1

The final acceptance JSON sink uses `process.exitCode` and permits stdout to drain, with an output-error listener that emits an observable diagnostic and changes the exit to 1. It no longer forces immediate process exit after serialization.

New tests RED: successful and gapped large results stopped at 65,536 piped bytes; the closed-pipe producer incorrectly exited 0. Small-output and prior projection controls passed. GREEN: regular-file and pipe outputs are byte-identical for a 99,830-byte eligible result and a 100,022-byte gapped result; expected exits remain 0 and 3. Small eligible output remains 143 bytes/exit 0. Closed pipes produce a nonzero result and diagnostic without mutating input records. All 11 producer/projection/acceptance tests pass in about 3.6 seconds.

## Commands and retained receipts

Run from the isolated worktree:

```bash
bash tests/super-code/test-stop-run-processes-inventory.sh
bash tests/super-code/test-setup-cleanup.sh
bash tests/super-code/test-verification-completion-metrics.sh
bash tests/super-auto/projection-output-r1.sh
bash tests/super-code/test-run-digest.sh
bash tests/super-code/test-run-profile.sh
bash tests/super-code/test-dispatch-text.sh
```

Fresh focused results: 8 inventory + 11 setup + 8 metrics + 11 output tests passed. Adjacent assertions: digest 116 PASS/0 FAIL; dispatch 244 PASS/0 FAIL; final profile 325 PASS/0 FAIL. `git diff --check`, shell syntax checks for changed helpers/tests, and profile JavaScript syntax checks passed. The full replay/release suite was not run by this implementer; the parent retains its one final integration pass.

Raw receipts are under `task-6-seam-repair-evidence/` and `/private/tmp/task6-seam-evidence/`:

- `task6-inventory-red.log`, `task6-inventory-boundary-red.log`, `task6-inventory-green.log`.
- `task6-setup-red.log`, `task6-setup-green.log`.
- `task6-metrics-red.log`, `task6-metrics-history-red.log`, `task6-workflow-metrics-red.log`, `task6-metrics-final-green.log` (intermediate greens retained too).
- `task6-output-red.log`, `task6-output-green.log`.
- `task6-template-red.log`, `task6-template-green.log` (static only).
- `task6-digest-adjacent.log`, `task6-dispatch-adjacent.log`, `task6-profile-final-adjacent.log` (initial profile receipt retained too).

## Operative guidance and generated prompt packet

Only `coordinator.js`'s workspaceSetup conflict/recut instructions and `upstream-feedback/report-template.md` change operative guidance in this task. No SKILL.md, runtime engine policy, admission lifecycle, collection recovery, acceptance correspondence, source-bounded review or sync exception contract was changed.

`task-6-seam-repair-evidence/setup-prompt/` (also `/private/tmp/task6-seam-evidence/setup-prompt/`) contains the complete 11,168-byte actual generated implementer prompt, complete unchanged `implementer-prompt.md`, fixture ledger, producer stderr, and a generation receipt with exact CLI args and source SHA-256/Git blobs. Prompt SHA-256: `c7f0c372f3492897a3bb9d0006d6c5c15b12c853b7131b4e77b2fea6157ecb44`. It was generated at `9695b0bd`; the follow-up changes only profile/tests, so the generation identity is preserved rather than restamped. The parent may use it for the requested current-only denied-helper/retain/SETUP_FAILED supplement.

## Limits and outstanding review

Fresh independent source review, matching behavior samples, the current-only setup prompt supplement, actual interrupted-helper phase, final parent integration and current run/root acceptance remain the parent's work. No external filing, push, release, Herdr/tracker mutation, or original cap/policy reset was performed. All requested filesystem/Git escalations for this task were approved; no permission refusal was represented as a pass.

Profile evidence remains source-scoped. The new Workflow classification uses retained typed implementation/review results and closure outcome. A resume-only close-only journal lacking those typed results does not itself identify verification intent under the current producer contract; that evidence-absent case was reported to the parent for independent scrutiny, not claimed covered by the paired-result fixture. No live Workflow/hosted-agent execution, generalized agent-compliance improvement, complete historical graph reconstruction, or global acceptance claim follows from these tests.


## Independent review fix round 1 (supersedes the Workflow claims and limitation above)

The independent review `/private/tmp/ufz-correction-task6-review.md` returned spec FAIL / quality Needs fixes at `7b18b0c26b9f19d531c558e112d490743901a13b`. Both Important findings were read in full and reproduced. TASK6-METRICS-R1 is a supported closure-only verification resume, not merely missing historical evidence. TASK6-METRICS-R2 shows that CLEAN review plus CLOSED repair does not establish independent tracker closure or durable settlement. The earlier report's paired-result completion claim and resume-only limitation are superseded by this repair; original source, fixtures and raw measurements remain in history.

Fix commit: `2091eb4910e73273f06586bb653eddc750639e23`; tree `0f5b6749c3504bf4c2bbdc595df2ec8d641436d3`; base `7b18b0c26b9f19d531c558e112d490743901a13b`. Exact five changed-file blobs and SHA-256 are in `task-6-seam-repair-evidence/review-round-1-source-identities.json` (also `/private/tmp/task6-seam-evidence/`). Owned files: coordinator.js, run-profile.mjs, replay-harness.mjs, test-verification-completion-metrics.sh, and new test-verification-settlement-profile.mjs. No operative skill or prompt guidance changed in this round.

The coordinator stamps its existing close dispatch label with `:verification` or `:landed`, retaining identity even when recovery dispatches no implementer or reviewer. Existing completion-ledger dispatches use `ledger:<id>:verification-settlement`; this dispatch occurs only after independent tracker confirmation with the previously persisted reviewed basis. The profiler counts verification completion only from its acknowledged `appended:true` result (or ordinary ledger-derived VERIFIED status), including the existing append retry. Failed, unavailable, or unacknowledged writes remain incomplete. Untyped legacy standalone closure is explicitly unknown rather than a manufactured landing. A genuine earlier real merge remains the landing at its original time, and actual already-merged closure still counts as such.

The same producer contract applies to both supported reconciliation paths: all-closed resume now strictly requires the acknowledged typed append, and Finish verification reconciliation appends completion and its matching recovery clear together before settling. A failed append retains the reviewed basis/pending closure. Implementation landing/reconciliation behavior remains on its existing path. These are bounded changes to the existing closure/ledger interface; no new dispatch stage, dependency, engine or persistence system was added.

The new test imports the existing replay runtime, executes the actual coordinator with deterministic external-agent results, preserves actual raw dispatch labels/results, writes Workflow journal/transcript fixtures with the existing fixture producer, then runs the actual profile CLI. Fixture ticks model ordering only; they are not live elapsed measurements. Replay logical-label aliases preserve existing canned scenarios while `records` retain the exact typed producer labels. The earlier three Workflow metric fixtures now include close-check and acknowledged settlement, correcting the prior test oracle rather than treating CLOSED as enough.

Concrete RED at the old product source: `task6-r1-red.log` has 1 passing positive control / 10 failures. `task6-r1-expanded-red.log` adds both reconciliation paths and has 1 pass / 13 failures, including premature coordinator completion on failed all-closed resume and Finish append. Genuine already-merged closure passes in both. GREEN: `task6-r1-final-green.log` has 17 passes / 0 failures: fresh and resumed success, failed/unavailable tracker check, Finish success/failed append, resume-already-closed success/failed or missing acknowledgement, fresh failed/missing/unavailable append, successful append retry, resumed failed append, earlier real merge, real already-merged closure, and legacy unknown closure. The three extra acknowledgement/retry controls were added after the initial repair; no pre-fix failure is claimed for them.

Commands run in the isolated worktree:

```bash
node tests/super-code/test-verification-settlement-profile.mjs
bash tests/super-code/test-verification-completion-metrics.sh
node tests/super-code/replay-harness.mjs --verification-parent-settlement
bash tests/super-code/test-run-profile.sh
```

Results: 17/17 new settlement cases; 8/8 existing metrics cases; 66/66 focused parent-settlement assertions; 325/325 profile assertions. Logs: `task6-r1-final-green.log`, `task6-r1-metrics-final-green.log`, `task6-r1-parent-green.log`, `task6-r1-profile-adjacent.log`. Intermediate greens remain (`task6-r1-green.log`, `task6-r1-metrics-green.log`). All are retained in the report evidence directory and `/private/tmp/task6-seam-evidence/`, with raw originals at `/private/tmp/`. JavaScript syntax checks and `git diff --check` passed. A bounded read-only invocation importing `run` and parsing the first three JSON argument blocks in coordinator-workflow.md executed the documented dryRun scenarios; `task6-r1-dryrun.log` records 48/19/23 dispatches, matching their documented expectations and completed/escalated buckets. No full replay or broad integration suite was rerun. The new standalone .mjs is not invoked by the full replay and is a unique additional final-suite command (parent informed).

The complete setup prompt was regenerated by the actual dispatch-text producer at final head using the original exact command/cwd/ledger fixture. New packet: `task-6-seam-repair-evidence/setup-prompt-final-head/` and `/private/tmp/task6-seam-evidence/setup-prompt-final-head/`. Its receipt pins `2091eb49`, current producer file hashes and original fixture arguments; the original `9695b0bd` packet remains unchanged. Current output is byte-identical: 11,168 bytes, SHA-256 `c7f0c372f3492897a3bb9d0006d6c5c15b12c853b7131b4e77b2fea6157ecb44`. This is an actual current-producer check, not a restamped old receipt.

No live Workflow host execution or general agent-compliance improvement is claimed. Legacy untyped journals cannot reconstruct an absent completion identity and now disclose that uncertainty. Fresh independent review, parent-owned behavior samples/current-prompt supplement, actual interrupted-helper execution, final integration, and root acceptance remain separate. No source writes are planned while independent review runs.


## Independent review fix round 2 — TASK6-METRICS-R3

Scoped rereview `/private/tmp/ufz-correction-task6-rereview.md` found R1/R2 addressed and a new Important R3 regression. The complete finding, all four exact probe inputs, raw selected outputs, reproduce.py and source identities under `/private/tmp/ufz-correction-task6-r1-probe/` were read. Reproduction before edits matched both reported regressions at base `2091eb4910e73273f06586bb653eddc750639e23`: adding typed verification to the old delivery attempt removed the parent's implementation release (child readiness 20 seconds / wait 5 seconds became unknown), and removed a genuine earlier ALREADY_MERGED/landed closure at 22 seconds. Original reviewer evidence remains untouched.

### Bounded step-back before editing

The actual producer supplies labels and structured results; parseLabel/stageOf classify events; existing per-bead grouping starts an attempt only for impl/brief; attempt status supplies implEndAgent; implementedBy/usableBy supplies the child's dependencyReadyAt/readyAt/waitMs. The same attempt-wide verification classification gates close-only landing, while b.final selects the evidenced landing and the verification counter aggregates completed verification attempts. Round 1 correctly added producer identity and acknowledged settlement evidence but attached closure-only resume to the preceding delivery attempt. Its status rewrite and landing gate therefore erased different, independently evidenced historical facts. The original earlier-real-merge test asserted its timestamp/count but missed the downstream implementation release and already-merged closure paths.

Before edits, this data flow and the chosen correction were sent to the parent: preserve the existing attempt model, but start a separate attempt at the first typed verification event when the prior attempt has no verification evidence. Reuse the same identity predicate for grouping and classification. Preserve original impl/brief grouping, completion acknowledgement, unknown legacy closure, and event timestamps. This addresses the grouping source of the regression rather than adding exceptions to readiness and landing consumers. No new graph-history engine, database, coordinator protocol, policy, or general audit was introduced.

### Change and source

Commit `9e4e057136d449348135bfc18d1f084cb6e4c303`, tree `6e110b20c90d547016321ccc217d68720a0548bc`, based on `2091eb4910e73273f06586bb653eddc750639e23`. Only `skills/super-code/scripts/run-profile.mjs` and `tests/super-code/test-verification-completion-metrics.sh` changed. File blobs/SHA-256: `task-6-seam-repair-evidence/review-round-2-source-identities.json`, also in `/private/tmp/task6-seam-evidence/`. No coordinator or operative guide change was necessary.

The profile now keeps the earlier IMPLEMENTED or ALREADY_MERGED attempt, with later verification in a separate VERIFIED/VERIFICATION_PENDING attempt. Original implementation release and landing derivations remain unchanged. Fresh verification's typed implementation/review/closure remains together; the existing brief+implementation grouping also remains together. R1/R2 acknowledgement and unknown-classification rules are unchanged.

### RED/GREEN and limits

`python3 /private/tmp/ufz-correction-task6-r1-probe/reproduce.py` before edits: `task6-r2-review-reproduction.log` reproduces both exact control/probe pairs. Test-first `bash tests/super-code/test-verification-completion-metrics.sh`: `task6-r2-red.log` records 18 tests, 8 failures and 10 passes. Both baseline controls and all eight preexisting cases passed; both history families failed after settled, pending, failed-settlement, and settlement-only verification. All eight failures were the reported lost historical landing or dependency-release assertions.

A direct check of the existing brief boundary after the first draft added one more control before finalizing: `task6-r2-brief-red.log` records 19 tests, one failure/18 passes because the draft split brief from a typed implementation. Restricting the new boundary to non-impl events preserves the original implementation/brief rule. This was a caught draft regression, not a failure claimed against the base product or an extra review finding. Intermediate `task6-r2-green.log` remains retained.

Final commands/results:

```bash
bash tests/super-code/test-verification-completion-metrics.sh
node tests/super-code/test-verification-settlement-profile.mjs
bash tests/super-code/test-run-profile.sh
python3 /private/tmp/ufz-correction-task6-r1-probe/reproduce.py
git diff --check
node --check skills/super-code/scripts/run-profile.mjs
```

- Metrics: 19/19 pass (`task6-r2-final-green.log`), including exact history pairs, pending/failed settlement, settlement-only resume, and the legacy brief control.
- Actual coordinator→journal→profile settlement: 17/17 pass (`task6-r2-settlement-final-green.log`; earlier `task6-r2-settlement-green.log` retained). Pure verification, failed tracker check, failed/missing/unavailable append, retry, resume, genuine landing and legacy unknown controls remain covered.
- Adjacent profile: 325/325 assertions pass (`task6-r2-profile-adjacent.log`).
- Exact reviewer reproduction after fix: `task6-r2-review-green.log` preserves child dependencyReadyAt and readyAt at 20 seconds/wait 5000ms and original real merge at 40 seconds; prior landed closure stays at 22 seconds. Attempt statuses retain delivery plus later VERIFIED. Reported model fit remains the baseline 44%/55% in these fixtures, not an improved performance claim.
- Syntax/diff checks pass. No broad suite, full replay, coordinator dryRun repeat, or new final-suite command was needed for these profile-only changes. Final integrated suite remains parent-owned.

All round-2 logs above are retained at `/private/tmp/`, `/private/tmp/task6-seam-evidence/`, and the report evidence directory. The exact independent fixture inputs/probe remain at their original reviewer path. These are bounded deterministic fixture timings, not live Workflow measurements.

Current setup prompt was regenerated at `9e4e0571` into new `setup-prompt-round-2-head/` under both evidence roots using the original exact producer command/cwd/ledger args. Its receipt records current source identities and byte equality: 11,168 bytes, SHA-256 `c7f0c372f3492897a3bb9d0006d6c5c15b12c853b7131b4e77b2fea6157ecb44`. Both older packets remain unchanged. The prompt producer/operative guidance itself did not change this round.

Source is frozen for independent review. Parent-owned dirty plan/spec/run and historical evidence remain unstaged; no tracker/Herdr/external writes, push, release, original-policy reset or root-acceptance claim was made. The parent's independent review, after samples, live helper phase and final integration/acceptance remain outstanding separate work.
