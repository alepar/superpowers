# Task 2 implementation report

Status: implementation committed as `86ce3567e365fed967d50f3f4eeca77783fccf8b` (`fix(super-auto): contain archives and reconcile null review recovery`) after the parent released the shared-index hold. The commit contains only the three owned source/test files. Fresh independent spec/quality reviews remain the parent’s responsibility. This report establishes collection behavior only; it does not close root acceptance or establish whole-branch review readiness.

Worktree: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers`, branch `super-auto/workflow-reliability`. Started from `ff5b1304`; HEAD advanced independently to `f8f2fee8d9209337feeb09d9888196adbb16819f` during source-disjoint scheduler work. I changed only the COLLECTION branch of `skills/super-auto/scripts/report-status`, `tests/super-auto/collection-symlinks-r1.sh`, and new `tests/super-auto/collection-recovery-correction.sh`. No acceptance branch, original run record, raw evidence, root gate, main, installed skill or Herdr state was changed.

## Investigation and retained evidence

Read the Task 2 brief, full correction plan/global constraints, approved workflow-reliability design, systematic-debugging, test-driven-development, writing-good-tests and verification-before-completion guidance.

The retained destination evidence is `...roast-pr-2-stages/judge-0-{reproduce,refute,ground}`. The reproduction receipt records exit 0, `outsideCreated: true`, outside sentinel bytes, and `complete: true`; the grounding receipt independently reproduces it. The implementation checked only the destination leaf and recursively created parents, so a symlink in `reviews/`, the invocation directory or a deeper directory redirected archive hashing/copying outside ownership.

The null-recovery evidence is actually judge **5**, not the brief’s provisional judge 4 index: `judge-5-reproduce/receipt.json`, `judge-5-ground/receipt.json`, and `evidence-api-contract/null-recovery-receipt.json`. Judge 4 concerns provenance-refusal availability instead. These receipts show settled null/UNAVAILABLE -> valid recovered report -> unconditional identity refusal; ordinary replay stays pending, while a fresh direct collection of the same report succeeds. The old settled reviewPath guard treats the null-to-expected-report recovery as an arbitrary source replacement.

## Change and supported API

Destination validation now walks every existing path component below the run directory (`reviews`, invocation ID, nested relative path and leaf) with `lstat` before any destination hash/read/copy. Symlinks are rejected with `unsafe archive path: <relative>`. The copy path is checked again after parent creation and before copying, and before hashing the copied destination. Existing matching outside bytes cannot satisfy an archive claim. Existing safe nested archives still collect and replay successfully after intentional source removal.

Explicit recovery uses:

```bash
bash skills/super-auto/scripts/report-status --collect RUN_MD \
  --invocation ID --workspace DIR --review DIR/final-review-ID.md \
  --verdict ACTUAL_VERDICT [--required RELATIVE_FILE]... --recover-null
```

The flag is boolean and may appear among the arguments. All four identity/result arguments remain required. Ordinary settlement and file presence alone still cannot promote a settled null result.

Admission requires a previously settled invocation, unchanged workspace and ordered required-input array, and exactly the expected report path. The expected source must be a regular file, pass existing full-component source symlink checks, extract successfully with `report-verdict --complete`, be a `final-review`, and have the exact supplied verdict. Missing/unsafe/malformed reports or mismatched verdicts/identity return 3 before appending a recovery transition. A previously settled non-null source cannot be relabeled; an identical repeat is allowed only for an already recorded supported recovery. Required files are still collected and validated normally; report recovery does not manufacture their availability.

The transition appends a new `review-collection`; every original null/UNAVAILABLE record remains verbatim. It adds:

```json
{"recovery":{"kind":"settled-null","recordSha256":"<sha256>","review":"UNAVAILABLE"}}
```

`recordSha256` is SHA-256 of UTF-8 `JSON.stringify(exact immediately preceding valid settled-null review-collection object)`, retaining the object’s parsed property order. It is not the hash of the raw line including prefix/whitespace. `review` preserves the predecessor’s actual verdict, not a fixed fabricated value. The new record retains invocation/workspace/required identity and uses the expected actual report path/verdict. Existing file manifests from a partial null collection are retained for conflict/integrity checks.

Collection replay validates recovery provenance: the referenced record must already occur in history; it must be settled/null with the same invocation/workspace/required array and original verdict; the recovered record must be settled at the expected path. At the first transition the referenced null record must be the latest predecessor for that invocation. Subsequent snapshots must retain the same recovery metadata, report path and recovered verdict. A malformed transition remains an explicit collection gap. Repeat explicit recovery and plain replay are byte-idempotent.

## RED, GREEN and meaningful controls

Logs are retained under `/tmp` (not original run evidence):

- `bash tests/super-auto/collection-symlinks-r1.sh`: RED exit 1, 24 passed / 8 failed at `/tmp/workflow-task2-symlinks-red.log`. Existing source-symlink/normal controls passed; missing destination protection caused outside entries and false completeness. GREEN exit 0, 32 passed / 0 failed at `/tmp/workflow-task2-symlinks-green.log`.
- `bash tests/super-auto/collection-recovery-correction.sh`: RED exit 1, 3 passed / 14 failed at `/tmp/workflow-task2-recovery-red.log` (new flag unsupported; ordinary settled-null refusal already reproduced in positive-prerequisite steps). GREEN exit 0, 21 passed / 0 failed at `/tmp/workflow-task2-recovery-green.log`. One assertion initially assumed every historical null record had a gaps array; fixed it to skip the initial gap-less event before final GREEN.
- The final recovery test against a private baseline `ff5b1304` script exits 1 at `/tmp/workflow-task2-recovery-baseline.log`. A private mutant removing only the newly added history-validation block exits 1 with exactly four provenance-replay failures at `/tmp/workflow-task2-recovery-provenance-mutant.log`; all other checks pass. This confirms those new checks exercise missing validation, rather than inheriting failure from unavailable recovery admission.
- `bash tests/super-auto/test-scripts.sh`: run once, exit 0, 145 shell PASS assertions plus its integrated collection-to-gate scenario at `/tmp/workflow-task2-test-scripts.log`.
- `bash -n skills/super-auto/scripts/report-status tests/super-auto/collection-symlinks-r1.sh tests/super-auto/collection-recovery-correction.sh`: exit 0. `git diff --check`: exit 0.

Coverage includes source symlink guards; destination reviews/invocation/nested/leaf links with outside sentinel/no-entry-change controls; existing matching outside file refusal; ordinary nested inputs and source-cleanup replay; explicit vs automatic recovery; original event/digest retention; repeated recovery/replay; changed workspace, required inputs, invocation, report path, null re-promotion and verdict; missing, symlinked or malformed report; corrupted/mismatched recovery provenance; non-null relabel refusal; and preservation of archived bytes when a settled source changes.

## Consumer seam and actual fixture manifest

A durable private fixture is at:

`/var/folders/d3/rsgv6zk54y5dd7137_cmcc100000gn/T/workflow-task2-selector-fixture-tvspyery/fixture-manifest.json`

Its location is also recorded in `/tmp/workflow-task2-selector-fixture-path.txt`. It contains the actual CLI commands/results, every appended collection record, predecessor null object, Git base/head and selector command. The fixture’s `runs/current/run.md` and `reviews/probe` archive are committed in its own temporary Git repository with a simple real product edit. Null settlement returns 3; explicit recovery returns 0; the current historical selector returns 3 with the sole gap `conflicting collection identity probe` (selected 3, omitted 0).

Tasks 3/4 must validate this supported transition in `dispatch-text.mjs` before treating it as identity-consistent: mirror the exact retained-predecessor validation above, preserve all original null events and saved hashes, and continue rejecting arbitrary settled non-null replacement, missing/forged recovery metadata, changed invocation/workspace/required input bundle and invalid expected report paths. Add a real collection -> captured-Git selector regression using this fixture contract. I deliberately did not change selector or ordinary-status/acceptance consumers outside COLLECTION ownership.

## Self-review and remaining concerns

The code uses only existing Node built-ins and existing extractor/record boundaries. The source guard was factored only to share it with recovery preflight; original source-symlink regressions remain green. Destination checks precede hashing/extraction/copying for each archive file and do not modify outside sentinels. Recovery produces preservation provenance, not a measurement or readiness verdict; it requires the actual extracted report verdict. Source cleanup remains supported only after complete, hash-validated preservation.

The component checks protect the observed static symlink cases; they are not an atomic filesystem transaction against another process actively replacing directories between synchronous syscalls. Existing orchestration must retain sole archive ownership. Ordinary status and captured-Git consumers must validate their own recovered history; the selector seam above stays explicitly pending for the next source owner. No global/full suite was run, no root acceptance was claimed, and no push/release/PR was attempted.

Owned review diff: `/tmp/workflow-task2-owned.diff` (includes the untracked new test without staging). File hashes below bind the reviewed implementation. Parent-authorized commit: `86ce3567e365fed967d50f3f4eeca77783fccf8b`. Precommit file hashes matched the tested versions exactly; staged names and staged diff whitespace were checked before commit. Postcommit status retained only the unrelated untracked correction-evidence directory.

- `skills/super-auto/scripts/report-status`: `340f8ddd6a5643ac4004d15ed82ced654d321e289cd525e11d4c5c000cb1209e`
- `tests/super-auto/collection-symlinks-r1.sh`: `3e7eff204bbeb8502d41ea3cb4d3fce94240da278f573a3971457b10d6d39754`
- `tests/super-auto/collection-recovery-correction.sh`: `798c434a923251e33e765c1aa0cd7fc699b38fb6abd55299601fa3bbd734e059`


## Task 2 review correction — round 1 of 5

Fresh independent spec/quality review at `/private/tmp/ufz-correction-task2-review.md` returned NEEDS CHANGES for P2 must-fix T2-R1 against `86ce3567e365fed967d50f3f4eeca77783fccf8b`. Read the complete review and `/private/tmp/ufz-task2-review-wpe1vbyw/receipt.json`, using receiving-code-review guidance before implementation. The finding is verified: history replay validated recovery metadata only when the new record contained it, so dropping every marker or only the final snapshot’s marker bypassed the provenance checks and returned collection complete.

Added real CLI regressions that begin with successful explicit recovery and retained original null records, then independently remove all recovered markers or only the final completed snapshot’s marker. Both failed against the reviewed source for the expected reason (exit 0 instead of 3). Added an explicit ordinary non-null replay control to ensure legacy collection does not gain a universal marker requirement.

The smallest parser correction hoists predecessor lookup and enters existing provenance validation when the new record has metadata, its predecessor already has metadata, or a settled-null predecessor transitions to a non-null path. Consequently omission is validated as strictly as malformed metadata. The existing validator continues checking exact predecessor, invocation, workspace, ordered required inputs, expected path, settled state, original verdict and stable recovery snapshots. Ordinary non-null collections remain legitimate without recovery metadata.

Exact RED command (source `86ce3567`, original report-status SHA-256 `340f8ddd6a5643ac4004d15ed82ced654d321e289cd525e11d4c5c000cb1209e`, new regression test):

```bash
bash tests/super-auto/collection-recovery-correction.sh > /tmp/workflow-task2-r1-recovery-red.log 2>&1
```

RED exit 1: **22 passed, 2 failed**, exactly `replay rejects all omitted recovery markers` and `replay rejects omitted final snapshot recovery marker`; both printed `collection: complete`, `0 !== 3`. Successful recovery, exact predecessor retention, idempotence and ordinary non-null replay controls passed before the source correction.

Exact GREEN commands against the corrected source:

```bash
bash tests/super-auto/collection-recovery-correction.sh > /tmp/workflow-task2-r1-recovery-green.log 2>&1
bash tests/super-auto/collection-symlinks-r1.sh > /tmp/workflow-task2-r1-symlinks-green.log 2>&1
bash -n skills/super-auto/scripts/report-status tests/super-auto/collection-recovery-correction.sh
git diff --check
```

All exit 0: recovery **24 passed, 0 failed**; affected existing symlink/archive/source-cleanup controls **32 passed, 0 failed**; syntax/whitespace clean. No broader suite rerun: this round changes only collector replay admission; the focused runs cover the corrected omission cases and affected ordinary/recovered history, successful collection, idempotence, source cleanup and destination containment. Prior broad script-suite results remain explicitly bound to their original source; they are not restamped as this round’s evidence.

Committed only the two changed owned source/test files as **`ac2a20fab3c854cd1f2133d3be4fcaa7f7a6cb6e`**, `fix(super-auto): retain recovery provenance across replay snapshots`, parent `86ce3567e365fed967d50f3f4eeca77783fccf8b`. Source blob `20f4182cff1ae7e656a0fb780eb065943d847395`; recovery-test blob `b4ec62502ad26fb80b98e34eab8355958f1c6d86`. SHA-256 hashes: report-status `2eebe2f00276002faa613666eaec25d39c5763509c9e8f1ccf8342f47777e053`; recovery test `12b343f3c63151718f57ed6bd5ed863fb635770cc542d919976399153040879c`. Staged names and staged whitespace were checked before commit. Postcommit worktree status retained only the unrelated untracked correction-evidence directory.

Self-review: the conditional now recognizes missing metadata from history rather than trusting field presence. Initial recovered records stripped of all metadata cannot enter latest from a settled null predecessor; later stripped snapshots cannot displace the validated recovery predecessor. Rejected historical lines remain present and keep a durable malformed-collection gap, even if replay can preserve valid preceding bytes. No selector/Task 4 changes, root closure, historical counter reset, push or release. T2-R1 implementation is ready for the parent’s fresh scoped re-review; the cross-task selector integration obligation remains pending.
