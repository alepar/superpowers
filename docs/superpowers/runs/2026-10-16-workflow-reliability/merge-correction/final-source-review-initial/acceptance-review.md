# Acceptance/caller partition — final source review

**Partition verdict: With fixes — two Important findings.** This is one partition of the composed whole-branch review, not a global merge-readiness or root-acceptance verdict.

Base: `832b051c870ae5c69adfa7f14d770292ab6c1a81`.
Reviewed head: `7b18b0c26b9f19d531c558e112d490743901a13b`.
Product source tree supplied by the parent: `61a8b70d795acd816d348934bd55293264ed5587`.

## Strengths

- The caller contracts preserve original occurrence identities, separate explicit links from display keys, and require supported dispositions before removing findings. The executable projection retains conflicts and unavailable artifacts as gaps.
- Acceptance separates measurements, required live checks, review coverage, Recovery obligations, and actual reserved human decisions. Current-source deferred measurement evidence does not automatically clear a code finding.
- The collection path now checks destination components and retains the original unavailable event during explicit null-report recovery. Resume routes both amendment replay cases through the same idempotent Key Abstractions sync; sync failure retains `specs-committed` before downstream work.
- The new tests distinguish mechanics from agent behavior and include meaningful archive corruption, ledger truncation, fallback/live, and output-transport controls. The two findings below are uncovered producer/consumer inconsistencies, not absence-of-evaluation findings.

## Important findings

### A1 — A contract-complete declaration of final-review keys cannot pass acceptance

**Location:** `skills/super-auto/scripts/report-status:191`, with the conflicting consumer at `:231` and correspondence dispatch at `:268`.

**Trigger:** A code-loop ledger consumes both a roast report and a final-review keys file. The caller follows `run-state.md`'s “Declared producer population” and `super-auto/SKILL.md`'s Review collection instructions by including both actual inputs in `roast-code`. It retains the original final-review extraction and supplies the required hash-bound, exact line-to-occurrence correspondence for the keys file.

**Fault:** Every `roast-code`/`roast-design` pointer is initially registered as kind `roast`. When a real `source final-review` ledger row points at the declared keys input, the reader identifies it as `keys`, reports `conflicting report kind`, and leaves the earlier `roast` classification in place. The supported correspondence then fails because its retained source has kind `final-review`, not `roast`. The reverse population check also calls the roast `--keys` parser on the key file. Thus complying with the new complete-input contract turns a supported acceptance state into a permanent coverage gap. Omitting the keys input from the declared population, as the current positive test does, succeeds.

**Reproduction:** [probe.mjs](acceptance-probes/probe.mjs) uses the exact captured `report-verdict` to produce the keys and `findings-ledger` to produce the code ledger. With independently satisfied synthetic review, measurement, human, and finding-relevance prerequisites:

- Control `roast-code: clean-roast.md`: exit 0, `eligible:true`.
- Identical state with `roast-code: clean-roast.md, review.keys`: exit 3, `eligible:false`, including `conflicting report kind .../review.keys` and `retained report kind differs from declaration`.

The actual key line is mapped once to its exact retained occurrence, with both hashes valid. No missing source or unresolved required finding masks the discrepancy. The existing `acceptance-population-correction.mjs` positive case “real final-review keys ledger requires supported exact complete line mapping” declares only the roast report, so it cannot catch this caller-contract failure.

**Effect/severity:** Important. An ordinary code-loop input population cannot satisfy the documented root-close gate without omitting an actual producer input. This is a false rejection, not evidence that the real root is eligible.

**Recommended repair:** Preserve input kind while reconciling the complete declared population. Use the supported keys transport/correspondence path for explicitly declared final-review key inputs, including genuinely empty `review: none`/ready inputs where applicable; do not require callers to hide them. Add a producer-to-gate test whose declared population includes every actual input.

### A2 — Read-only acceptance skips the null-recovery history validation enforced by collection

**Location:** `skills/super-auto/scripts/report-status:547` (shape-only latest-record selection), contrasted with the collection history validator at `:398`.

**Trigger:** A settled null/UNAVAILABLE review has been recovered through the real `--recover-null` producer. A later retained collection snapshot has a missing recovery marker or an incorrect `recordSha256` predecessor. Original null history, earlier recovery records, archived report bytes, and hashes remain present.

**Fault:** `--collect` verifies the exact retained settled-null predecessor and requires the same recovery marker in every subsequent snapshot. The ordinary STATUS reader validates only the broad collection shape and assigns the newest snapshot to `latest`; it never checks the recovery marker, predecessor, or transition history. `--acceptance` delegates collection validation to that weaker read-only status reader. If archive hashes still match, it returns `eligible:true`, despite the same history being explicitly rejected by collection replay. This conflicts with the new recovery contract's requirement that missing/malformed markers remain gaps.

**Reproduction:** The same [probe.mjs](acceptance-probes/probe.mjs) creates an actual settled-null result with `--collect`, creates a strict-extractable ready report, and invokes the actual `--recover-null` path. Controls establish that the null case is pending and the valid recovered case passes. For each otherwise unchanged copy of that valid state:

- Delete only the final snapshot's `recovery` property, or change only its `recovery.recordSha256` to an unretained hash.
- `--acceptance ... --tree <fixture-tree>` returns exit 0 with `eligible:true`, `pending:[]`, and `gaps:[]`, without modifying the input.
- `--collect` on an identical separate copy returns exit 3 with `COLLECTION_GAP: malformed collection record; retain sources`.

Both are bounded corrupt-history cases already represented in `collection-recovery-correction.sh`, but those tests invoke the collector only. No arbitrary replacement report or manufactured empty extraction is needed for this counterexample.

**Effect/severity:** Important. The final read-only root-close gate can authorize closure from recovery metadata its preservation validator deems unsupported. This is a gate-consistency fault; the probe does not claim that the actual run's recovery metadata is corrupt.

**Recommended repair:** Reuse the same pure history/identity validator in collection and read-only status/acceptance, retaining the read-only behavior of the latter. A corrupted marker or predecessor must remain an explicit gap even when archive hashes match or another valid snapshot exists. Extend both corruption controls through the final acceptance consumer.

## Verification and evidence

Only the two bounded counterexample fixtures were executed, with the parent's explicit authorization. No suite was rerun, no product fix was made, and no checkout/index/tracker/canonical-run/Herdr state was mutated.

Command: `node /private/tmp/ufz-correction-final-source-review/acceptance-probes/probe.mjs`.
Observed exit: 0 (the probe asserts the two current defects and their positive/negative controls).

- [Complete command arguments, raw stdout/stderr and exit statuses](acceptance-probes/raw-output.json).
- [Captured helper hashes and exact head](acceptance-probes/source-hashes.json).
- [Probe source](acceptance-probes/probe.mjs).
- Disposable fixtures and exact helper copies remain beneath `acceptance-probes/`.

The report-status SHA-256 is `617756710014244672373b5ad471d23bb35d229dcca26aa938ce43461d66d5e4`, matching the review manifest. Helpers were read via `git show <exact-head>:<path>` into the private fixture tree. Child processes use controlled Git configuration and clear `NODE_OPTIONS`, `BASH_ENV`, `ENV`, `GIT_DIR`, and `GIT_WORK_TREE` overrides.

The measurement/human/relevance prerequisites in these fixtures are explicitly synthetic records used to isolate mechanics. These results establish neither live Workflow execution nor a real human decision nor satisfaction of the actual run's acceptance criteria. Failed/unavailable controls remain recorded in raw output.

## Read coverage and cross-partition checks

Read the reviewer instructions, the full approved `2026-10-16-workflow-reliability-design.md`, and the corrective plan including Global Constraints and task boundaries. Read all 3,522 lines / 349,863 bytes of `acceptance.diff` in bounded chunks. Initial oversized reads were reread in smaller chunks; no assigned changed hunk remained truncated. Package SHA-256 matches the manifest: `7a3bd1188efdf371bc8fc2513ea6cb7438f2c3f97c3d58aecd25afe41ecc0b32`.

All 19 assigned paths were covered:

- `skills/finishing-a-development-branch/SKILL.md`
- `skills/super-auto/SKILL.md`
- `skills/super-auto/report-prompt.md`
- `skills/super-auto/resume.md`
- `skills/super-auto/run-state.md`
- `skills/super-auto/scripts/report-status`
- `skills/super-auto/scripts/scope-dispositions`
- `skills/super-design/SKILL.md`
- `tests/super-auto/acceptance-population-correction.mjs`
- `tests/super-auto/archive-integrity-r1.sh`
- `tests/super-auto/collection-recovery-correction.sh`
- `tests/super-auto/collection-symlinks-r1.sh`
- `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt`
- `tests/super-auto/outer-cleanup-r1.sh`
- `tests/super-auto/projection-output-r1.sh`
- `tests/super-auto/resume-sync-contract.mjs`
- `tests/super-auto/test-contract-lint.sh`
- `tests/super-auto/test-scripts.sh`

Named cross-contract checks: original report/key producer → real findings ledger → declared population/correspondence → acceptance; collection/null recovery → read-only status → acceptance; immutable occurrence identity/link/disposition → projection → acceptance relevance; required live/source-bound evidence and contradictory pre-run attribution → gate; caller root ownership and measurement/finding separation; design/amend resume → idempotent sync/failure hold; leaf/parent cleanup preconditions → finisher/reporting. Additional surrounding reads were limited to the relevant existing findings-ledger input contract and finisher choice/teardown ordering. Actual report-verdict and ledger producer paths were exercised, not replaced with mock parsers.

The source-selector, runtime scheduler, metrics, and complete harness partitions remain other reviewers' scope. This partition does not independently inventory historical sources or judge the pending exact-ref applicability decisions. A later product correction requires rebinding/reviewing its changed source; this report remains pinned to the head above.

## Assessment limits

No Critical or Minor findings established in this partition. Resolve A1 and A2 before treating this partition as clear. Combined suite results, representative instruction-behavior evidence, actual interruption evidence, complete historical applicability accounting, and the real root gate remain the global composer's pending work. Those pending acceptance facts are not reported as code defects, and no global READY conclusion is issued here.
