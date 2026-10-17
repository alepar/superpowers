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
