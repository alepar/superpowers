# One scoped final fix re-review

Verdict: **PASS for the reviewed fix scope; all eight original findings addressed.** No new Critical, Important, or Minor defect was demonstrated in this eleven-path change. This is the scoped re-review requested after the single final fix wave, not a whole-branch READY decision. Final source-bound suite execution, behavior evidence, actual helper interruption evidence, and independent root acceptance remain separate obligations of the global composition.

## Exact source and read scope

- Repository: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers`.
- Base: `9e4e057136d449348135bfc18d1f084cb6e4c303`.
- Head: `4911223a98c2abd1ac1060e644053bf99ed7da0d`.
- Tree: `9d74c04d6a465e02439dc08e2076395d8e791583`.
- Reviewed package: `/private/tmp/ufz-correction-final-fix-review/manifest.json` and `fix.diff`; diff SHA-256 `0cba1e6c2f4e1ddca6544fad5d2e517ed4fc32fa030603388e98b894a7957d36`.

I read all 696 lines / 68,378 bytes of the fix diff in contiguous bounded chunks. I independently checked that Git's changed-path set equals the manifest's eleven paths, that the head resolves to the stated tree, and that each manifest file's length and SHA-256 match both the pinned Git source and the current working copy. This is complete changed-hunk review, not a claim to have reread every unchanged line in these large files.

Exact checked path population:

1. `skills/super-auto/scripts/collection-records.cjs`
2. `skills/super-auto/scripts/report-status`
3. `skills/super-code/SKILL.md`
4. `skills/super-code/coordinator.js`
5. `tests/super-auto/acceptance-population-correction.mjs`
6. `tests/super-auto/collection-recovery-correction.sh`
7. `tests/super-code/fixture-liveness-final-wave.mjs`
8. `tests/super-code/invocation-source-binding-r1.mjs`
9. `tests/super-code/recovery-hold-scope-r1.mjs`
10. `tests/super-code/replay-harness.mjs`
11. `tests/super-code/unplanned-admission-final-wave.mjs`

Relevant surrounding context read or revisited for named seams: coordinator recovery parsing and admission (roughly 412–505, 935–1020), all `withSlot` call sites and post-capacity admission (1225–1227, 1535–1768, 1865), final-review fallback and finish disposition (2350–2457, stub producer around 3035); report-status entry routing, declared-population parsing and correspondence (1–75, 135–325), collector history consumption (355–430), and read-only history/acceptance consumption (510–575). The complete new shared CJS file and new test bodies were read. Packaging was inspected only for the concrete new-module inclusion risk: `scripts/package-codex-plugin.sh:237–248` archives the entire tracked `skills` tree. The relevant collection-history parser previously embedded in the collector was compared through the complete removal/addition hunks. This does not expand into a new packaging review.

I read the complete worker report `/private/tmp/ufz-correction-final-fix-wave-report.md`, its committed-source identity receipt, H1 mutation receipt, the focused result logs listed below, and the final replay summary plus the three documented dry-run result sections. I did not rerun broad tests or fresh-review historical artifact populations.

## Original finding dispositions

| Finding | Original severity | Disposition and concrete support |
|---|---|---|
| R1: malformed compact recovery fails open | Important | **Addressed.** `coordinator.js:432–447` converts malformed recovery into admission constraints while retaining diagnostic data. Recoverable task identifiers constrain those tasks through `invalidRecoveryScopes`; unavailable/unsafe scope or merge-lane scope holds global admission. `:939–940` enforces these constraints before work. Invalid records do not become validated obligations or discharge earlier holds. `:2457` retains a recovery-held finish outcome for these constraints and current hold records. Both compact and oversized forms preserve scope; valid unrelated task work remains possible when scope is actually known. |
| R2: unplanned task bypasses post-capacity admission | Important | **Addressed.** `coordinator.js:1586–1591` makes new work explicitly opt into `admitAfterCapacity` after the slot is obtained. The unplanned route opts in at `:1608–1614`, so a task/global hold present initially or acquired during the wait prevents the blocker/triage route from starting. Existing settlement call sites remain settlement operations, avoiding a blanket hold that would strand legitimate cleanup/reconciliation. The common admission routine at `:1745` also rechecks applicable start-gate, quarantine, dependency, and recovery state. |
| SR1: null seam fallback produces a report rejected by strict collection | Important | **Addressed.** `coordinator.js:3035` now writes explicit nonempty Must-fix and Untested-scope content and `- none` for Deferred OK. Reviewed cluster files are metadata outside finding sections. The caller records the unavailable seam before generating the stub, so its untested population is nonempty. The revised source-binding test extracts the actual producer payload and passes it through the actual strict parser and collector, retaining the original cluster finding independently. It does not weaken `--complete`. |
| A1: declared final-review keys misclassified as roast inputs | Important | **Addressed.** `report-status:177–189` recognizes typed keys grammar, including explicitly typed empty ready/none populations. `:206`, `:235–262` preserve declared kind and require ledger inputs to belong to the declared population. `:287–294` still require complete, exact physical-line correspondence to retained final-review source extraction, including genuine empty input with an explicit empty mapping. Empty/untyped arbitrary input cannot become an accepted source simply through filename or ledger appearance. |
| A2: read-only readers accept collection history the collector rejects | Important | **Addressed.** `collection-records.cjs:16–36` supplies the collector's history/provenance rule to both `report-status:385–386` and `:517–518`. Null-to-report transitions and every subsequent recovery snapshot require the retained predecessor, matching invocation/bundle, permitted transition, and recovery marker. Parser errors remain gaps even if an earlier record is usable; silently dropping a corrupt latest record does not make acceptance clean. Tests exercise both read-only status/acceptance and collector replay against the same corruption cases. |
| R3: top-level cleanup result contract stale | Minor | **Addressed.** `skills/super-code/SKILL.md:174–180` documents the four cleanup result arrays and the resource-retention/unknown-state boundary. Empty arrays are not represented as independent proof that all resources were inspected. |
| H1: optional guard extraction hides missing writer guards | Minor | **Addressed.** `tests/super-code/invocation-source-binding-r1.mjs` requires each guard to exist and each execution status to be an integer before asserting refusal. Six writer routes are checked, including cluster, seam, and stub. The six mutation controls demonstrate that removal of each corresponding guard now fails the test; the previously missed cluster/seam/stub controls no longer pass. Existing bytes are snapshotted before attempted writes and checked after refusal. |
| H2: process-inspection denial counted as absence | Minor | **Addressed.** `tests/super-code/replay-harness.mjs:57` treats nonempty inspection stderr as unavailable rather than absent, alongside existing execution/error/status checks. `fixture-liveness-final-wave.mjs` distinguishes alive, zombie, genuine absence, denial, failure, and empty-success output using controlled subprocess responses. |

## Specification and quality assessment

The fixes preserve the approved boundaries: uncertainty in retained recovery evidence cannot authorize new work; a slot is capacity, not admission permission; unavailable seam review remains an explicit incomplete finding population; read-only acceptance applies the same recovery provenance rule as collection; and process-inspection uncertainty cannot become cleanup success. The added shared module uses Node built-ins and introduces no third-party dependency.

The shared CJS is a real runtime dependency of both collector and readers. Its path is derived from the existing script-directory argument, not the caller's current directory. The normal tracked skills package contains it. Any deliberately frozen helper snapshot for subsequent acceptance testing must copy and hash `collection-records.cjs` with `report-status`, `scope-dispositions`, and `report-verdict`; using a three-helper snapshot would not test this source's complete helper closure. This is an evidence setup requirement, not a new defect in the reviewed implementation.

No newly demonstrated load-bearing breakage was found at the producer/consumer seams above. This verdict does not assert that every conceivable malformed history or agent response has been exhaustively tested.

## Malformed-recovery replay changes

The old replay expectations are not weakened to conceal the original defect:

- The former combined malformed-attribution/malformed-durable-recovery scenario is separated. The valid-durable scenario still requires malformed check-evidence attribution to be surfaced and keeps the expected task owner. The malformed-durable scenario still requires its recovery gap and owner, and now requires held admission with no implementer dispatch. Retaining its former work-dispatch expectation would contradict the repaired fail-closed contract.
- The large digest scenario still transports the same four malformed raw lines. A separately identified valid-history control removes precisely those malformed lines and continues to check clean retry, pending-closure clearing, fix history, and deferred obligations. The original malformed text instead requires no implementation or close-only dispatch, preserves the pending closure and fix history, retains all four bounded diagnostics, and checks that the raw ledger file was not rewritten.
- The changed template-expression count (456 to 455) follows the actual stub producer rewrite to joined strings; it is not a deletion of a behavioral obligation.

The valid-history controls therefore continue to protect progress and settlement while the corrupt-history controls protect admission. The test split makes the intended distinction observable.

## Verification evidence and final-plan inclusion

These are worker-executed receipts inspected during review, not newly executed reviewer tests:

| Receipt in `/private/tmp/ufz-correction-final-fix-wave-logs` | Observed result |
|---|---|
| `R1-final.log` | 22 recovery hold-scope scenarios passed |
| `R2-final.log` | Four unplanned-admission cases passed, including hold acquired during wait |
| `H2-final.log` | Six liveness classifications passed |
| `SR1-H1-final.log` | 17 invocation source-binding scenarios passed |
| `A1-green.log` | 39 acceptance-population scenarios passed |
| `focused-final-3.log` | 32 collection recovery cases passed |
| `focused-final-4.log` | report-verdict suite passed, including strict incomplete-input rejection |
| `focused-final-5.log` | dispatch-text suite passed |
| `focused-final-6.log` | 32 collection symlink cases passed |
| `focused-final-7.log` | 15 archive-integrity scenarios passed |
| `replay-final-corrected-controls.log` | 2404 passed, 0 failed; documented dry-run dispatch counts 48, 19, and 23 observed |

The acceptance-population receipt names the precommit base head but records the final report-status and test SHA-256 values, which match this manifest. That supports those tested file bytes; it does not retroactively turn that receipt into a final whole-tree run. The committed-source identity receipt and independently checked manifest bind the reviewed implementation. Earlier RED receipts and the sandbox inspection limitation remain recorded in the worker report; the corrected replay receipt does not erase them or reinterpret denied process inspection as absence.

The two new wave tests are not transitively run by `replay-harness.mjs` or existing `test-*.sh` wrappers and need explicit final-plan entries:

- `node tests/super-code/unplanned-admission-final-wave.mjs`
- `node tests/super-code/fixture-liveness-final-wave.mjs`

The parent's stated prospective entries 46 and 47 provide that coverage. Revised recovery-hold and invocation-source-binding scripts already occupy entries 36 and 34, respectively; they need final-source execution but no duplicate entry. The earlier Task6 settlement test is the third focused standalone test and remains in the existing 45-entry population. Thus the stated final plan is 47 distinct entrypoints plus its two separately identified targeted TMPDIR configurations, not evidence that those commands have already run. No extra broad rerun was requested or performed by this reviewer.

## Retained attribution and remaining global decision

The initial whole-branch report `/private/tmp/ufz-correction-final-source-review/composed-initial-review.md` remains the attribution record for the original complete changed scope and qualified historical evidence. Its old source pin and WITH-FIXES/PENDING verdict are not rewritten. This report supplies the complete eleven-path delta review needed to advance that composition to the stated head. Task6's separately completed scoped metrics/cleanup review is retained; this task does not reopen or replace it. Later source changes require a further exact delta binding rather than borrowing this head's result.

The separate M assessment remains candid: 34/35 supplemental G–M decisions passed, complete M compliance was 4/5, and after_2's missing-work assertion failed. The full filing procedure was sufficient; no source defect was established by that response. Correct sync/owner-adoption/persistent-failure-hold facets remain usable bounded textual evidence, and actual tool behavior was not established by those answers. Neither this code re-review nor subsequent N evidence erases that observation.

Final whole-branch acceptance must combine the retained full-scope attribution, clean Task6 review, this scoped fix review, the actual final source/config-bound suite receipts, the behavior evidence with its qualifications, actual helper interruption evidence, and independent root acceptance. Those facts are not supplied by a clean fix-diff verdict alone.
