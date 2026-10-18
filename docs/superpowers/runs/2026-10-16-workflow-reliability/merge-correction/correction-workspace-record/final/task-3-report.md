# Task 3 implementation and self-review

Status: implementation and focused verification committed as `87166167a4414189497d4b8877fdc44eb71e76a6` (`fix(super-auto): reconcile retained source population at acceptance`). Fresh independent review remains the parent’s responsibility. This is a corrective implementation result, not actual-run acceptance, a policy waiver, or evidence that the outstanding historical/live/human gates passed.

Worktree: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers`; branch `super-auto/workflow-reliability`; base `ac2a20fab3c854cd1f2133d3be4fcaa7f7a6cb6e`. Ownership: ACCEPTANCE branch in `skills/super-auto/scripts/report-status` and new `tests/super-auto/acceptance-population-correction.mjs`. No dispatch-text/coordinator changes were needed. No SKILL or run-state instructions were edited; their narrow writer follow-up belongs to Task 4. No root run record, root acceptance, tracker, Herdr membership/message, main, push, release, or external issue/PR was changed.

## Investigation and decisions

Read the task brief first, full independent policy review, approved design invariants, Task 2 implementation/review-correction report, systematic-debugging, test-driven-development, writing-good-tests and verification-before-completion guidance. Traced real `findings-ledger --loop design|code`, report-verdict complete/keys/default consumers, scope-dispositions projection, actual `bind-review-source` producer, check-evidence producer and coordinator `classifyRunFailure` implementation. The pre-run producer control executes the actual unmodified classifier function extracted from coordinator.js; it does not claim a live Workflow session.

Confirmed three original seams with otherwise satisfied synthetic review/measurement/human prerequisites:

1. `pre-run` classification continued before importing retained `runFailure.gaps`, hiding a same-source contradiction recorded by the real classifier.
2. The real immutable `data.reviewSource` Recovery record carries no command/configuration and was incorrectly routed through deferred measurement evaluation.
3. The gate’s registered-source projection ignored declared roast and ledger source population. A real disputed ledger in either producer loop plus an unrelated valid-empty final source yielded eligible.

The parent explicitly coordinated a narrow `source-correspondence` association for keys-only inputs and judged legacy adapters, and confirmed ledger key membership is permitted only as transport consistency, never occurrence identity, linking or resolution. The parent retains caller/documentation ownership and independent review.

## Implementation

All run-failure gaps are imported before diagnostic `pre-run` repair classification. A supported pre-run result with no gap still passes; no new repair owner or blanket defect is manufactured.

Review-source obligations are recognized by the reserved `review-source:` ID or explicit `data.reviewSource` field, validated across all root snapshots, and exempted only from measurement interpretation. Validation requires deferred/record version 1, reason/evidence, data containing only reviewSource, matching filesystem-safe invocation ID, reserved obligation ID and full base/head hashes. Conflicting historical bindings remain gaps. A malformed or removed binding cannot acquire the metadata exemption. Real deferred measurements still require matching live evidence.

The gate reads declared `roast-design` and `roast-code` pointers plus both findings ledgers. Ledger headers/rows must parse, original text pointers must resolve unambiguously, and each ledger key must still occur in the referenced real report producer’s `--keys` output (or original keys file). This last check validates transport only. It does not associate findings by display key. All complete retained occurrences still pass independently through existing exact-ref relevance, explicit links and supported disposition logic.

Every known report needs a complete retained extraction with exact source/artifact correspondence and a fresh extractor comparison of version/source/kind/verdict/all occurrences, or the explicit supported correspondence below. Missing, malformed, truncated, forged-empty, ambiguous or unreconciled inputs remain named source coverage gaps. Caller-owned collection remains outside the gate. Exact report artifact comparison canonicalizes filesystem aliases, including macOS `/var` versus `/private/var`; source identity remains the retained source string. Verified duplicate archive copies of one source/content do not become different source identities.

Ordinary unresolved Blocking counts are not an acceptance veto. Tests show nonblocking outstanding occurrences, supported resolution and supported rejection can pass while the external ledger remains disputed. Later ledger `resolved@r2` from silence does not supply local resolution. Explicit links assess a group once while retaining both original refs.

## Narrow writer contract for Task 4

Add this optional caller-owned record to the existing approvals block after the owner has judged exact correspondence and completeness:

```text
- source-correspondence · {"version":1,"artifact":"<original declared report or keys file>","sha256":"<original bytes SHA-256>","source":"<existing immutable source ID>","retainedArtifact":"<registered retained report or adapter>","retainedSha256":"<retained bytes SHA-256>","judgment":"supported","basis":"<why this exact source correspondence is complete>","evidence":["<raw/retained inspection evidence>"],"lines":[{"line":2,"refs":[{"source":"<same named source>","section":"Must fix before landing","position":1}]}]}
```

`artifact` and `retainedArtifact` resolve from the run directory (absolute paths are also supported). Both files and hashes must remain available. `source` must already be registered by `finding-source` at retainedArtifact. The gate freshly re-extracts that retained artifact and compares the complete extraction; a token valid-empty file cannot authorize refs into another source. An association does not create source records, link findings, change relevance, or dispose findings. Unsupported/malformed/conflicting associations stay gaps even if a separate valid association exists.

For keys-only input, `lines` is required: each nonempty actual key line, with its original 1-based physical line number, must appear exactly once, each with nonempty existing occurrence refs from the single named retained source. A first `review: ready|not ready|none` header and blank lines are not key lines. Missing, duplicate, header, unknown, cross-source or uncovered line mappings fail. The original keys file and ledger are preserved. This bounded format intentionally does not support one keys file mapped to multiple independent retained source identities; such input remains a gap pending a separately designed contract.

For same-byte archived reports, `lines` is unnecessary. The original and retained full extraction must match. Repeated associations and additional exact archive copies with the same source/content are permitted; different source identity/content/line correspondence conflicts.

For a legacy malformed report whose interpreted retained representation differs from the raw bytes, add:

```json
{"interpretation":{"kind":"legacy-adapter","originalVerdict":"<actual original compact-parser verdict>","limitations":["<explicit original strict-extraction failure and interpretation limits>"]}}
```

The original strict extraction must actually fail; its compact parser must still recognize the declared historical kind/verdict. The adapter’s kind/verdict and interpretation.originalVerdict must match that original outcome. Do not fabricate readiness, silently normalize the original, or use an ordinary valid report as a rewrite opportunity. Keep the original parser failure evidence and independent completeness judgment in evidence; `limitations` labels the representation as an interpretation. A genuinely unrecognized declared source cannot pass this route. The gate validates structure, bytes, source references and parser outcomes; semantic completeness is the existing owner’s explicit evidence-backed judgment, not inferred from a successful parser.

The ordinary direct source route needs no new record when the original report itself is the registered artifact. Task 4 should tell the outer owner to reconcile all settled design/code sources at the existing handoff/resume boundary, preserve exact source IDs and raw artifacts, and append supported correspondence only when needed. Task 3 never writes these records into the actual run.

## RED/GREEN evidence and actual source identities

All logs are raw local `/tmp` artifacts, not relabeled actual-run evidence. Fixtures with `KEEP_FIXTURES=1` remain under the exact temporary paths printed at the end of each log.

- Initial RED against base `ac2a20f`: `/tmp/workflow-task3-red.log`, 4 passed / 14 failed; one native-check test had a test-driver `--stdout` omission. That driver was corrected, and the positive resume controls were separated from the initial negative before implementation. The meaningful corrected RED is `/tmp/workflow-task3-red-valid-controls.log`: **7 passed / 11 failed**, all expected three-seam/population failures. Fixture root `.../T/acceptance-population-yJRoVZ`.
- Initial seam GREEN: `/tmp/workflow-task3-green-initial.log`, **18 passed / 0 failed**.
- Association extension RED: `/tmp/workflow-task3-correspondence-red.log`, **18 passed / 2 failed**, specifically supported adapter and complete keys correspondence still refused before implementation. GREEN `/tmp/workflow-task3-correspondence-green.log`: **20 passed / 0 failed**.
- Path controls exposed a real `/private/var` canonicalization failure: `/tmp/workflow-task3-final-green.log` is **21 passed / 1 failed**, despite its provisional filename; it is not passing evidence. Separate archive-copy RED `/tmp/workflow-task3-archive-copy-red.log`: **0 passed / 1 failed**, showing a second exact copy incorrectly produced a source conflict.
- After the path fixes, `/tmp/workflow-task3-final-acceptance-green.log`: **23 passed / 0 failed**, fixture root `.../T/acceptance-population-dyYvsM`. Tested report-status SHA-256 `b108d2451243436050e0909259a670e37581f6d35b730a259b1e37bbb8fbb8a6` and test SHA-256 `71ba6ca2b44a9778a24b12c9976fd73bbd57c818bc4c3b2232998b8e5f5da1ef`.
- Final bounded transport-consistency change: `TEST_FILTER='stale ledger pointer' KEEP_FIXTURES=1 node tests/super-auto/acceptance-population-correction.mjs`, RED `/tmp/workflow-task3-ledger-consistency-red.log`: **0 passed / 2 failed** for both real loops after their report was replaced by a clean report. Final affected checks `TEST_FILTER='ledger'` at `/tmp/workflow-task3-ledger-consistency-green.log`: **8 passed / 0 failed**; `TEST_FILTER='resumed declared source'` at `/tmp/workflow-task3-ledger-dispositions-green.log`: **2 passed / 0 failed**. These include complete keys mapping, repo-relative producer paths, missing/malformed ledgers, and positive nonblocking/resolved/rejected controls against real disputed design/code ledgers. They do not restamp the prior 23-scenario result onto the final source.

Final source/test SHA-256 identities:

- report-status: `ad81889b839875520be411a2b5e618a30ba5a21cefe9aac6e4949b90b3a06a82`
- acceptance-population-correction.mjs: `758cad7299ccaca05cc91b04cdeb3f395f5464379a002fa065649a08d21a0900`

The authorized commit contains only those two owned files. Precommit hashes matched the verified source, staged names/whitespace were checked, and postcommit blobs are report-status `2ca51b5db223e9056c8b38caf19c297e43d2b5bb` and test `b5cde231e3384fcad8e73fe0b2a3fe10d8197901`. Postcommit worktree state retains the parent’s modified correction plan and untracked correction-evidence directory; neither was staged or changed by this task.

The test file now has 25 named scenarios; its entire 23-scenario predecessor passed before the final consistency change, followed by the targeted 10 affected scenarios above. `TEST_FILTER` selects names by literal substring; absent the variable, the whole focused file runs. `KEEP_FIXTURES` retains source reports, raw ledgers, run records, bindings and check inputs for inspection.

Affected existing checks ran once: `bash tests/super-auto/test-scripts.sh` at `/tmp/workflow-task3-test-scripts.log`, exit 0, **145 shell PASS assertions** plus its integrated producer-to-gate control; `collection-recovery-correction.sh` at `/tmp/workflow-task3-collection-recovery.log`, exit 0, **24 passed**; `collection-symlinks-r1.sh` at `/tmp/workflow-task3-collection-symlinks.log`, exit 0, **32 passed**. These ran before the final path/consistency refinements. The complete COLLECTION and ordinary-status suffix is byte-identical to base `ac2a20f`, SHA-256 `f40f74c87c6523f558400192c1f809beaa6a86fe11905ef1a3d87350847de481`; no Task 2 logic was touched. Final `bash -n`, `node --check` and `git diff --check` pass. No full repository suite or live model eval was run.

## Self-review and limitations

Reviewed changes against each global invariant: provenance stays typed/immutable; genuine measurement/live obligations remain separate; diagnostic classification cannot erase uncertainty; known source population remains accounted for; silence and ledger dispute status never supply local disposition; no original refs are rewritten; and acceptance remains read-only. Source records, exact refs and optional one-source correspondence extend existing transports rather than creating a general finding database.

No selector null-recovery authority changed; Task 4 still owns its Task 2 producer-to-selector integration. Task 4 also owns documentation/schema writer instructions for the association above. Real source adapters, original historical gaps, final review coverage, live measurements and human gates require separate actual-run work. The scoped synthetic controls prove mechanical integration only. The parent must perform the fresh independent review and acceptance reconciliation before any merge gate can be claimed satisfied.

## Task 3 review correction — round 1 of 5

Fresh independent review `/private/tmp/ufz-correction-task3-review.md` returned specification **FAIL** and quality **CHANGES REQUIRED** against `87166167a4414189497d4b8877fdc44eb71e76a6`, with Blocking T3-R1: **“header-only truncated ledgers can clear source-population acceptance.”** Read the complete review and `/private/tmp/ufz-task3-review-8g12hjc7/receipt.json` with receiving-code-review guidance before implementation. The finding is confirmed. The earlier original implementation status above is historical; it did not pass independent review.

Real design/code ledgers can lose all rows after their four-line header. A positive retained `r1=1` header then contradicts the missing rows, but the gate previously found no source population to reconcile. More subtly, a Should-fix-only truncated header can be byte-identical to a genuine empty ledger header. Header counts cannot establish a complete producer input set. This is a transport/population defect, not a reason to turn disputed Blocking counts into a universal acceptance veto.

The parent approved a bounded correction using existing caller declarations. ACCEPTANCE now preserves explicit `roast-design` and `roast-code` input sets independently of paths discovered from ledger rows. Every declared ledger requires a nonempty matching-loop caller input population, since the real ledger CLI always requires report input. Missing declarations produce `ledger input population unavailable`; zero rows plus retained positive round Blocking counts produce `ledger header contradicts missing finding rows`. For each declared report, the gate reads the actual producer’s `--keys` output and requires its keys to remain represented in the ledger’s row population. A failed key read remains unavailable rather than becoming empty. Missing rows of any severity produce `ledger population incomplete for declared report`.

Both membership directions are strictly transport checks. They do not establish semantic identity, link occurrences, downgrade severity, resolve findings, recompute ledger trigger/dispute semantics, or rewrite any ledger/report/count. All original retained source occurrences still require the existing exact-ref relevance/disposition path. Complete source extraction plus supported nonblocking relevance does not waive truncated ledger transport. With intact declared input/transport, supported nonblocking, resolved and rejected controls still pass while the external ledger remains disputed.

Added 12 real-producer scenarios across both `--loop design` and `--loop code`: Blocking/Should-fix truncation with ledger-only unknown population; the same truncations after complete extraction and supported nonblocking relevance, preceded by successful intact-ledger controls; genuine empty ledger-only unknown input; and genuine empty producer output with complete declared empty extraction. Existing repo-relative and keys-only positive fixtures now supply the real caller roast declaration and complete clean roast extraction that their ledger invocation actually consumed. These are required producer facts, not invented empty measurements. Test logs now embed exact HEAD and source/test SHA-256 identities before execution.

Exact RED command, against reviewed report-status SHA-256 `ad81889b839875520be411a2b5e618a30ba5a21cefe9aac6e4949b90b3a06a82` and new test SHA-256 `16f46da7a5abd18f8463a0a0dd9026b647d8b001b257dc284349efd986b2e0c0`:

```bash
TEST_FILTER='ledger' KEEP_FIXTURES=1 node tests/super-auto/acceptance-population-correction.mjs > /tmp/workflow-task3-r1-red.log 2>&1
```

Exit 1: **10 passed, 10 failed**. The failures are exactly both severities’ truncations in both loops (with/without declared supported sources) and both genuine-empty ledger-only unknown-population controls. The genuine-empty declared controls, actual keys-only correspondence, repo-relative inputs and prior relevant ledger checks pass before the source correction. Raw fixtures remain at `/var/folders/d3/rsgv6zk54y5dd7137_cmcc100000gn/T/acceptance-population-aMuu3f`.

GREEN on corrected source, with the same test file and embedded source identities:

```bash
TEST_FILTER='ledger' KEEP_FIXTURES=1 node tests/super-auto/acceptance-population-correction.mjs > /tmp/workflow-task3-r1-green.log 2>&1
TEST_FILTER='resumed declared source' KEEP_FIXTURES=1 node tests/super-auto/acceptance-population-correction.mjs > /tmp/workflow-task3-r1-dispositions-green.log 2>&1
TEST_FILTER='later silent' KEEP_FIXTURES=1 node tests/super-auto/acceptance-population-correction.mjs > /tmp/workflow-task3-r1-silence-green.log 2>&1
```

All exit 0: **20/0**, **2/0**, **2/0**, respectively. The disposition controls exercise missing relevance, required relevance, supported nonblocking, idempotent exact extraction, preserved outstanding refs, supported resolution and rejection, and ordinary disputed counts. The silence controls preserve earlier findings despite `resolved@r2` ledger silence. Fixture roots are respectively `.../T/acceptance-population-UIK7UX`, `.../T/acceptance-population-9AzGbA`, and `.../T/acceptance-population-jRczVV`. The current file has 37 named scenarios; this round ran the **24 affected scenarios**, not a full 37-scenario sweep or repository suite. Previous validation remains bound to its original source.

Corrected report-status SHA-256: `fa4d68570f93fa59ba91f98952c71e6d9d7c4869da58b1b1a6fae4cb1f2f34f7`. Test SHA-256: `16f46da7a5abd18f8463a0a0dd9026b647d8b001b257dc284349efd986b2e0c0`. Final `bash -n skills/super-auto/scripts/report-status`, `node --check tests/super-auto/acceptance-population-correction.mjs`, and `git diff --check` exit 0. The COLLECTION and ordinary-status suffix is byte-identical to reviewed `87166167` (and original Task 2 base); no collector regression rerun was needed for this acceptance-only change.

Task 4 writer requirement: preserve **every actual report input** of each design/code ledger invocation in its matching existing `roast-design`/`roast-code` declaration, including genuine empty reports, then collect/reconcile every declared source. A ledger header or surviving row subset is not an input manifest; the gate does not infer total populations from zero Blocking counts or extrapolate missing report paths. Missing matching-loop declarations remain an explicit unknown-population gap. The existing format cannot independently prove that a caller omitted no otherwise undisclosed report from its input declarations, so those declarations must be the actual complete producer input list, not a reconstructed guess. Known report pointers, keys-only associations, historical sources and explicit completeness judgments remain subject to the existing checks. No new database, producer/ledger algorithm change, scout identity work, root acceptance or policy waiver was introduced.

T3-R1 implementation is committed as `583f2486ebe6b00a5c6fe3b87bc3d5b98ed53533` (`fix(super-auto): require declared ledger input completeness`), parent `87166167a4414189497d4b8877fdc44eb71e76a6`, and ready for fresh scoped review. Staged names contained only the two owned files; staged whitespace and precommit hashes matched the verified source. Final Git blobs: report-status `e1bc3a31b00c23121ef42b47c5662bf8489362a2`, test `443d79b2d03f69bc10594f61022452c07698226f`. Postcommit status retains only the parent’s modified correction plan and untracked correction-evidence directory; neither was staged or changed by this correction. No acceptance, main change, push or release was performed.
