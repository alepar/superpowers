# Composed whole-branch review — initial assessment

**Verdict: WITH FIXES / PENDING.** The composed source review establishes five Important findings and three Minor findings. Two additional Important metrics findings remain in the separately owned Task 6 repair/re-review loop. This is the initial composition of one whole-branch review; it is not a READY verdict, a root-acceptance decision, or permission to merge. Current final-source verification and behavior evidence have not yet been supplied.

## Source identity and review method

The source assessment is pinned to base `832b051c870ae5c69adfa7f14d770292ab6c1a81`, head `7b18b0c26b9f19d531c558e112d490743901a13b`, tree `61a8b70d795acd816d348934bd55293264ed5587`. It covers the actual changed tracked range inventoried at that pair: **8,476 paths**, comprising **58 product/test paths and 8,418 other paths**. The head is provisional: Task 6 repairs, final-review repairs, pending documentation and subsequently retained evidence must be rebound before completion assessment. A file read from the working tree is not silently attributed to this head.

This composition retains my complete runtime partition read and incorporates the independently completed harness, source-selection and acceptance partition reports. Those four partitions read every changed hunk in their assigned 43 paths. The remaining 15 metrics/cleanup paths have exact prior-full-read plus Task 6 delta attribution described below; their review is not clean while Task 6 findings remain. The exact 58-path membership is appended. The manifest supplies per-file hashes and exact diff-package identities; it is not merely a filename checklist.

I read all four partition reports, the metrics/cleanup reuse proof, the original complete metrics and cleanup reviews, the initial Task 6 review and implementation report, the three primary documents, and the historical/claiming records identified below. Surrounding product reads in the runtime report were limited to named producer/consumer risks. I did not duplicate all other partition source reads, reread every archived raw byte, run a full suite, or exercise hosted Workflow. The runtime counterexamples are offline deterministic replay; acceptance counterexamples use actual helper producers with synthetic unrelated prerequisites to isolate mechanics.

Evidence anchors:

- [Exact source manifest](manifest.json), [runtime report](runtime-review.md), [harness report](harness-review.md), [source-selection report](source-review-report.md), [acceptance report and probe receipts](acceptance-review.md).
- [Metrics/cleanup reuse proof](metrics-cleanup-reuse-provisional.json); original full reviews at `RUN/merge-correction/product-coverage/{metrics-review.md,cleanup-review.md}`; initial Task 6 review `/private/tmp/ufz-correction-task6-review.md`; implementation report `.superpowers/sdd/2026-10-17-workflow-reliability-merge-correction/task-6-seam-repair-report.md`.
- [Whole changed-path inventory report](/private/tmp/ufz-correction-final-artifact-inventory/REPORT.md), its `tracked-path-inventory.json`, `artifact-manifest.json`, `inventory-self-check.json`, source-bound reuse and pending-adapter provenance files. Here `RUN` means `docs/superpowers/runs/2026-10-16-workflow-reliability` in the inspected checkout.

## Consolidated current findings

No Critical finding is established. IDs below preserve their partition identities; a shared theme is not an automatic identity merge.

### Important R1 — malformed compact Recovery can release work

`skills/super-code/coordinator.js:432–437`, `:451–454`, and `:804`: compact unknown-version, malformed or unparseable Recovery records add gaps but establish neither a scoped hold nor the conservative transport hold used by oversized-record recovery. A valid persisted hold for `bd-101` yields zero implementation/merge dispatches and `recovery-held`. Changing its version to 9, removing evidence, or supplying broken JSON yields an implementation and merge and `ready-drained` while retaining only a gap. The offline probe uses the exact pinned coordinator and real replay engine. This violates hold preservation before admission; later root rejection does not undo dispatched work.

Repair the unresolved-record admission behavior, preserving reliably known scope and retaining unknown scope conservatively. Invalid clear records must not release an existing valid hold. Keep valid-empty/new-run absence distinct. Required regression scope includes compact corrupt records, valid scoped controls and unrelated-work behavior, rather than weakening the existing large-record cap or source checks.

### Important R2 — newly discovered unplanned work bypasses admission holds

`skills/super-code/coordinator.js:1551`, `:1569–1571`, `:1585–1590`: unplanned ready IDs enter `withSlot` without the fresh admission predicate used by `runTask`. With a valid persisted task hold, the pinned replay still launches `unplanned-blocker`, `triage`, `notify` and `ledger` and escalates the held task. The invocation later returning `recovery-held` does not make those earlier mutations valid.

Check initial unplanned-task admission after capacity acquisition and before creating a blocker or other work. Preserve the ability of already-started work to settle cancellation/failure; adding a blanket check to the shared slot wrapper could create a new deadlock or prevent cleanup. Exercise a hold arriving during the capacity wait plus the unheld positive control.

### Important SR-1 — generated null-seam stub fails complete extraction

`skills/super-code/scripts/report-verdict:117–119`, actual producer `skills/super-code/coordinator.js:2997` after `:2401`, consumer `skills/super-auto/scripts/report-status:491` and `:502–506`: a null seam reviewer causes the real stub prompt to request empty `Untested scope` and `Deferred OK` sections. The strict complete parser rejects those relevant empty sections, so collection produces a gap even with all report/cluster bytes archived. It cannot complete a recoverable incomplete source, and immutable output guards make repeating the same stub no repair.

Keep the complete parser strict. Make the producer emit the real unreviewed scope and explicit valid empty declarations as appropriate, and compose generated stub → complete extraction → collection in a regression retaining cluster reports. The result must remain incomplete/not ready for the unreviewed whole range. Evidence is a concrete static producer/parser/collector trace, not a newly executed stub reproduction.

### Important A1 — declaring all actual final-review inputs prevents acceptance

`skills/super-auto/scripts/report-status:191`, `:231`, `:268`: declaring both an actual roast report and the final-review keys file in `roast-code`, as the complete-input contract requires, initially assigns both kind `roast`. The real ledger identifies the latter as `keys`, causing conflicting kind and retained-kind/correspondence failures, and the reverse check applies the roast parser to the keys file. An otherwise identical producer-backed fixture passes when the keys input is omitted and fails when it is honestly declared. The positive existing fixture omits this actual input.

Preserve input kinds across declared population, actual ledger provenance and supported exact correspondence. Include every actual input in the regression, including genuinely empty ready/none keys where supported. Do not repair the gate by instructing callers to conceal inputs or by treating matching display keys as finding identity. The probe establishes a false rejection, not actual root eligibility.

### Important A2 — acceptance accepts corrupt null-recovery history

`skills/super-auto/scripts/report-status:547`, contrasted with collection history validation at `:398`: read-only status/acceptance checks the latest record's broad shape and archived hashes but does not apply the marker/predecessor transition validation enforced by collection. After an actual null collection and actual `--recover-null`, deleting the latest recovery marker or changing its predecessor hash still yields `eligible:true`, no gaps, exit 0. Collection on an identical separate copy rejects that same state with exit 3 and a malformed-record gap.

Share the pure history/identity validation across collection and read-only acceptance. Keep status/acceptance read-only and retain malformed transitions as gaps even if another valid snapshot or intact archive exists. Extend both producer-backed corruption controls through the final consumer. This is a demonstrated gate inconsistency, not an allegation that the canonical run is corrupt.

### Minor R3 — top-level cleanup result contract omits unknown/retained outcomes

`skills/super-code/SKILL.md:174–180` still describes `processSweep` as `{stopped,survived}` and `worktreesKept` only as dirty/unmerged trees. The implemented/detailed contract includes unknown and kept results and retained temporary/process-blocked resources. Align this entry-point contract so ordinary consumers do not lose the uncertainty the cleanup changes intentionally preserve.

### Minor H1 — per-writer guard test can pass when a writer guard is missing

`tests/super-code/invocation-source-binding-r1.mjs:56`, `:61`, `:158–163`: guard execution is conditional on a regex match, but a snapshot is recorded regardless. Removing a cluster/seam/stub guard while retaining the assembler guard leaves the binding already present and the assertions can pass. Current product prompts do contain guards. Require every expected guard match and exercise each writer's existing-output refusal before claiming individual writer protection.

### Minor H2 — fixture liveness observer treats a denied lookup as absence

`tests/super-code/replay-harness.mjs:57–61`: status 1 plus empty stdout returns false without considering a denial diagnostic. A `ps` denial can therefore satisfy fixture assertions that an owned process is dead. Fail the observer on diagnostic failure or confirm absence through an independently successful enumeration. This limits test evidence; it does not establish a false product termination result.

## Task 6 remains a separate open repair scope

The original metrics review fully read nine files and cleanup review fully read four files at `86ce3567e365fed967d50f3f4eeca77783fccf8b`. The 15-path reuse manifest proves seven members exactly unchanged and eight Task 6 members covered by subsequent changed-body review (four had prior full reads and four are new in Task 6). It checks that the pre-Task-6 source equals the earlier reviewed bytes, so no unexplained intermediate changes are being skipped. The initial Task 6 review covers its complete 1,001-line/12-path delta through `7b18b0c2`, including overlaps with other partitions.

Its two Important findings are still open at this pin:

- **TASK6-METRICS-R1**, `skills/super-code/scripts/run-profile.mjs:1171`, `:1192`: resumed verification can dispatch only an untyped close result. The profiler classifies that `CLOSED` result as a landing, although the coordinator's resumed path at `:1750` enters verification completion without an implementation/review attempt and uses the same close label. Producer `:2663` does not yet require a discriminator. Preserve unknown where kind is unsupported; a close-only event cannot invent a Git landing. Retain a real already-merged positive control.
- **TASK6-METRICS-R2**, `run-profile.mjs:1173–1176`, `:1201`, `:1301`: typed CLEAN review plus any CLOSED result becomes completed verification before the coordinator has accepted close checks and durably appended/settled completion (`coordinator.js:1435–1474`). Failed close checks or append failure can therefore produce false completed-verification metrics. Require actual supported settlement, with negative controls for both failures and a successful producer-to-journal-to-profile control.

Earlier Task 6 improvements to unknown Git inventory, safe setup/recut removal, discard error reporting, digest/report-template counts and output draining are supported by the scoped reviews and retained focused outcomes. They do not resolve these two distinct metrics triggers. The sole Task 6 implementer owns their repair; do not duplicate or pre-dismiss that work. Any added standalone regression changes the final test/path envelope and must be added to the source manifest and suite plan. The parent now anticipates a 45th command plus two separately mapped targeted TMPDIR variants; neither the earlier 44-command proposal nor the prospective final envelope is an executed result. The parent reports a subsequent Task 6 fix at 2091eb49 with a five-file delta and focused settlement results; that delta is awaiting scoped re-review and is not silently included in this 7b18 assessment.

## Cross-partition judgment

The source review covers the intended architectural boundaries rather than isolated file styles: admission and capacity release/reacquisition; early-unblock parent settlement; external dependency observation; Recovery persistence and scoped holds; captured review source and immutable writer outputs; review extraction/collection; original occurrence identity versus transport keys; independent root acceptance; safe resource retention; and verification completion versus landing/metrics.

The important remaining seams are concrete. R1/R2 must prevent fresh admission while permitting already-started settlement. SR-1 must make an incomplete report collectable without upgrading its review verdict. A1 must reconcile the actual complete producer population without hiding inputs. A2 must use the same recovery history semantics at write and read-only acceptance. Task 6 must consume actual settled completion, including resumed paths, and not infer it from leaf statuses. H1/H2 limit how strongly the later suite can substantiate guard and cleanup claims until corrected or explicitly qualified.

Historical supported repairs are not blanket clearance of these new triggers. The earlier oversized-hold repair (history judgment H18) does not establish compact malformed-record behavior in R1. Historical fixture teardown repairs H11/H16 do not establish the denial behavior in H2. Archive hash integrity support H20 does not establish recovery-chain integrity in A2. These are separate scopes, not reasons to rewrite the older reviews as false or merge finding identities by shared filenames.

The retained runtime/detailed ordinary contracts otherwise preserve root acceptance as caller-owned and prevent task closure alone from meaning epic acceptance. The concrete findings above show why complete population, strict extraction and successful archive hashing still need composed producer/consumer checks. No additional defect is inferred solely because fresh agent evaluations or a final suite have not yet run.

## Actual changed-scope accounting and historical reuse

The inventory's exact changed-set equality and hashes bind all 8,476 tracked paths to the pinned range; its 58 product hashes match the source-review manifest. It records 1,141 exact duplicate groups with 6,374 member paths, 293 claiming records, 35,241 structural path references, and 7,248 matching hash claims out of 7,551 comparisons. There are 1,378 matching Git-blob claims out of 1,408. Nonmatches include alternative relative candidates and historical representations and are not automatically product defects. Conversely, successful hash/reference checks do not establish the truth of claims in the referenced source.

This is full changed-scope **accounting**, combined with explicit substantive review and attributed reuse; it is not a claim of fresh semantic reading of all 8,476 files. No path is excluded solely for living under an archive, evidence or run directory. The following classifications govern what the composition consumes:

| Artifact role | Supported treatment | Limit or remaining judgment |
| --- | --- | --- |
| Current product/test source | All assigned changed hunks reviewed; metrics/cleanup full-read plus exact delta reuse | Current findings and later deltas still require repair/re-review. |
| Exact copied historical source and derived review diffs | Use verified Git/blob/byte identity to recognize the same source at its named revision; retain every path/role | Equality supplies provenance and avoids redundant reading, not new product behavior or permission to omit a selector input. |
| Prior semantically reviewed source/slice membership | Reuse the exact completed reviewers' scopes and retained qualifications | Only the stated member union, source pin and obligations receive that reuse. |
| Raw command logs, observations, empty output and binary/packed transport | Retain as evidence of the named captured observation; verify descriptor/member/decoded byte binding where used | No general pass, global process absence, causal attribution or executable behavior follows from an empty file, archive listing or hash. |
| Probe/controller/reconstruction source | Treat as inert supporting source unless the current acceptance claim relies on its actual operation | Read the relevant producer and receipt together for a relied-upon measurement; a copied script is not a measurement and need not become a new product entrypoint. |
| Reports, reviews, coverage manifests, extraction/projection records | Assess original source, scope, role, verdict and precise claim; reuse established semantic review with attribution | Extraction completeness, a ready historical subset, deduplication and structural counts cannot supply current whole-range acceptance. |
| Run state, authority, acceptance and current documentary claims | Read the actual claiming record and its authority/evidence boundary | These are load-bearing when used to amend requirements, adopt dispositions or authorize closure; filename-based archival treatment is insufficient. |

The 242-member reuse proof matches all 121 historical sources and their 121 archived slices at this head. I read the complete 37,357-byte historical aggregate and its cross-part judgment, and inspected its exact attribution matrix and reuse proof. It incorporates 11 completed full partition reviews for former cluster ordinals 9, 29 and 52, frozen historical product range `d84541ae…612ea0a7…`. I do not claim to have reread those 11 raw reports or their entire corpus. The attributed reviews plus exact preserved member identity legitimately satisfy those three missing-historical-coverage obligations. They do not cover current implementation or erase other historical/current obligations. Their simulated tests, dirty-source measurements, failed attempts, limited process observations and unavailable chronology remain qualified.

The 79 newly registered historical report sources have exact original raw copies, 79 corrected operational adapters, full interpreted source reviews and a scoped adapter-fidelity re-review. I read the correction re-review and provenance/registration claims; I did not reinterpret all 79 originals again. The correction retains 213 exact appearances (189 interpreted and 24 strict), 29 supplemental qualifications, 35 source qualifications and five genuinely unknown original outcomes. The registration receipt's 486 appearances / 469 groups / zero structural gaps is a projection result, not acceptance. Reversible transport does not invent original wrappers/verdicts, create finding identity links, or supply repair dispositions. The provisional manifest's pre-registration counters and later receipt are distinct chronological records, not a contradiction to resolve by overwriting either.

The format-specific inventory covers **10 committed binary/packed paths**: two compressed diffs, four Git-metadata tar files and four seat-worktree tar.gz paths (two originals and two retained copies). The initial role histogram assigns eight to the binary/packed role and the two original seat archives to prior-review-attributed identity; eight is therefore a role count, not the total format inventory. I checked this exact path/role correspondence. Descriptor, member and decoded-byte accounting supplies transport attribution, not a new semantic read of expanded historical diffs. Exact duplicate material can be read once at its role, with all occurrences retained. Identical bytes used in different semantic roles still require role-aware interpretation.

The completed [role addendum](/private/tmp/ufz-correction-final-artifact-inventory/role-assessment-addendum.md) resolves the 18 initially unestablished roles and all 364 normative-looking candidates. I read its full report, all 18 role/read-limit/current-claim records, and the two unique README bodies, and independently matched every output size/hash in its manifest. The documentation candidates are 49 exact-byte groups: 353 copied-source paths in 40 identified Git-source groups; four exact historical diffs in four groups; four README copies in two fully read protocol/fixture groups; and the three primary documents reviewed here. These groups have no exact semantic-membership overlap with the 79-source or 242-member reuse sets, so I do not borrow those reviews for them. Identifying an old guide copy does not create a fresh operative policy change or certify its old behavior.

All 18 role records contain bounded historical claims: merge preservation/coordination, eight retained carry links, acceptance retention and an explicitly negative old gate, old-source suite publication and stale final verification, packaging receipts, failed assembler/fallback records, and feedback intake/graph/header/candidate material. Their exact claimed identities and scopes can be retained without treating every draft, header extract or tracker field as another settled finding. The old gate remains false with 46 pending/9 gaps; the 37-command publication remains tied to f726f0e9/tree35e91189; packaging success is not review success. The eight preexisting identity-link bases remain attributed original semantic judgments, not newly approved links or dispositions from this inventory. Current acceptance must use supported occurrence accounting rather than mere record presence.

One explicit unread body remains: 108,859 bytes of tracker descriptions plus full acceptance/notes/closure prose in the historical feedback export were not semantically read in full (nor were all copied guides or raw logs freshly reread). The graph/IDs/statuses are classified as diagnostic history; they are **not used here as authority for source correctness, a present requirement amendment or task/root acceptance**. If a later decision relies on a particular unread assertion, that assertion and its underlying settled source must be assessed. This is a concrete use boundary, not a blanket assertion that the archive is clean or an automatic demand to reread the entire export. The new README bodies assert only limited text-decision protocol and a cents-formatting fixture, with no current product-pass claim; their scopes are appropriate.

Retained selector evidence has **zero authorized omissions**. The original 690-gap sidecar and later 707-gap sidecars are preserved at their own different source ranges. No selector was freshly executed at `7b18b0c2` by this composition, so neither 707 nor an earlier path count is restamped here. The independent policy review explicitly prohibits bounded-incomplete review from becoming whole READY. The composed review supplies additional attributable coverage; it does not authorize an archive directory exclusion or declare failed historical omission claims valid.

## Primary documents and operative claims

I reviewed the complete changed content of `docs/superpowers/plans/2026-10-17-workflow-reliability-merge-correction.md`, `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, and `docs/superpowers/specs/INDEX.md`. I also read the working plan checkbox changes and the dated working spec append separately. They are parent-owned dirty changes, outside the `7b18b0c2` source pin, and must be included in the final binding.

The approved spec keeps safety, concurrency, attribution, metrics and acceptance distinct. It permits supported partial results, unknown cleanup with retained resources and bounded representative validation; it does not require reconstructing a complete causal historical graph. The corrective plan preserves the separate authorization, original caps and histories, ownership boundaries and final independent acceptance. The index's implemented workflow entry describes delivered implementation; the adjacent spec explicitly retains pending acceptance. I found no new substantive defect in these three documents at the inspected versions. This does not authenticate unavailable historical approval timing or make the checked task boxes evidence that Task 6/final gates passed.

I read the complete policy review, acceptance inventory, independent history judgments, Recovery applicability report and prospective suite reconciliation report. Their claims are scoped consistently when read together: permission to repair is not acceptance; the historical late checkpoint is not a before-code snapshot; old wrapper/callback loss and unproved output aliases remain unavailable; actual known requirements remain requirements. The history judgment's 16 supported repair claims, four historical integration conflicts and two retained rejections have source-specific support; four fresh-agent evaluation obligations explicitly remain open. The later narrow tracker-closure corroboration in the relevance proposal can update that bookkeeping qualification without closing the root.

I parsed the Recovery obligation map and inspected all 33 actual task/source/command/configuration live declarations and every distinct current-evidence route. Its 23 typed failures, six attribution associations, four aggregate-runner failures and 18 unproved aliases remain attributed populations, not an asserted count of every historical shell failure. Failed old-source checks are not made passed by a new-source run. A supported fix correspondence and current equivalent evidence can address their present obligation while retaining the failed measurement. The three inherited/trailing/slash-free TMPDIR variants remain separate configurations; old task-specific artifact integrity and cleanup observations are not current global certifications.

I read the final-relevance proposal report and audit and inspected all 29 supplemental / 35 source-qualification basis, criterion and dependency mappings (the five unknown outcomes are members of the 35, not five extra gaps). This is proposal review, not canonical adoption of its 239 candidate entries. Its distinction between outstanding nonblocking historical qualifications and required current checks is supported. Its current behavioral summaries remain conditional where this review found R1/R2/SR-1/A1/A2 or Task 6 metrics faults. Parent adoption must bind actual final evidence and exact refs; the helper's `required` entries do not clear merely because a criterion review is added. I did not inspect every repeated raw excerpt or individually approve all 213 proposed dispositions; the proposal itself supplies relevance, not repair/rejection dispositions.

## Remaining load-bearing completion work

1. **Repair and rebind source.** Complete the owned Task 6 loop, then the consolidated final fixes and one scoped producer/consumer re-review. Bind all later product/test/document changes, including new tests, to a final source/tree. Prior review remains valid only for byte-identical unchanged spans with its original limits. A newer head or task-complete status is not a substitute for this delta accounting.
2. **Adopt supported current relevance with the completed role assessment.** The inventory and role addendum account for every path and resolve the named role queues; they do not semantically clear every historical claim. The claiming records consumed here support the qualified historical uses above, not current acceptance from closed tracker rows, raw drafts, link-record presence or old pass counts. Preserve unavailable wrappers, timing, aliases and original failures as historical qualifications; do not turn them into invented empty/current-pass facts or an unspecified perpetual certification demand. Adopt exact-ref relevance/dispositions only with original evidence and current requirements considered, and explicitly retain the narrow unread-use boundary above. This initial report does not supply that canonical adoption.
3. **Execute the actual final suite under the reviewed envelope.** The original runner review's six issues have a scoped R1 re-review: runner hash `7e34ddc54f52dc193ed84d07b44bf4e0fda1fa978fbc6e1c7aad053367e0d41d`, attributed identical-source toy RED 3/19 and GREEN 22/0. The outer launcher's failure-accounting re-review clears hash `89b2316cdd4773d49fa5db379dabdac55ed7d34c3fbb85d3046ac15faa49c87e` at source-inspection scope. I read both re-reviews. They do not supply actual project runs, quiet-host facts or final plan/source/configuration binding. Retain exact prelaunch inputs, outer receipt, per-case source checks, command/configuration identities and failure history. Explicitly amend/reconcile the historical aggregate requirement by ID with authority and predecessor preserved; do not stamp old 37 records as the new command or silently omit old case IDs. Final command count is to be frozen after all corrections.
4. **Assess representative changed-instruction behavior and actual interruption.** The parent-owned fresh-context after samples (5+5 as planned), applicable before/after/pressure assessment and actual interrupted helper collection/resume have not run at the final source. Preserve strict historical AFTER 0 pass / 2 fail / 3 ambiguous separately from diagnostic observations. Cover the concrete updated admission/hold, source isolation, owner retention, no-change completion, amendment resume, unknown cleanup and root boundaries under realistic operative context. Pure replay or scripted decision fixtures do not establish fresh-agent compliance. Retain offline Workflow 48/19/23 assertions and terminal checks as mechanics evidence; do not claim hosted execution.
5. **Make the independent caller acceptance judgment.** Reconcile the complete declared source population, all retained actual required live checks, findings and supported dispositions, final review coverage, final source measurements and existing human condition. Consume the repaired read-only gate without using it as a substitute for semantic evidence judgment. The existing conditional local-merge authorization may satisfy its own human condition once its actual prerequisites are established; no new approval menu is invented here, and no push/release authority follows.
6. **Report actual owned-resource outcomes.** Inspect the current caller/review-owned resources and retain evidence. Unknown/surviving resources stay retained. Supported unknown+retained can satisfy truthful cleanup reporting under the spec; deletion still requires verified safety. No global process-absence, hosted Workflow, Linux certification or complete historical causal reconstruction is added as an unstated gate.

These are precise outstanding evidence/adoption boundaries, separate from the code-grounded findings. The final follow-up should assess the repaired delta and actual evidence against them, not restart a broad historical raw-log review or promote this initial composition to READY.

## Exact product membership

The following list is copied mechanically from the source manifest; group names identify the review attribution, not independent whole-branch verdicts.


### runtime (7)

- `skills/super-code/SKILL.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator.js`
- `skills/super-code/implementer-prompt.md`
- `skills/super-code/scripts/close-in-tree-epics`
- `skills/super-code/task-reviewer-prompt.md`

### harness (5)

- `tests/super-code/invocation-source-binding-r1.mjs`
- `tests/super-code/invocation-start-r1.mjs`
- `tests/super-code/recovery-hold-scope-r1.mjs`
- `tests/super-code/replay-harness.mjs`
- `tests/super-code/startup-builder-seam-r1.mjs`

### acceptance (19)

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

### source-review (12)

- `skills/super-code/assembler-prompt.md`
- `skills/super-code/scripts/dispatch-text.mjs`
- `skills/super-code/scripts/report-verdict`
- `skills/super-roast/SKILL.md`
- `skills/super-roast/judge-seat-prompts.md`
- `skills/super-roast/scout-prompts-pr.md`
- `skills/super-roast/scripts/assemble-args.mjs`
- `tests/super-auto/generated-review-inputs-r1.sh`
- `tests/super-auto/selection-recovery-correction.mjs`
- `tests/super-code/test-dispatch-text.sh`
- `tests/super-code/test-report-verdict.sh`
- `tests/super-roast/test-assemble-args.sh`

### metrics-cleanup (15)

- `skills/super-code/scripts/ledger-digest`
- `skills/super-code/scripts/remove-task-worktree`
- `skills/super-code/scripts/run-digest`
- `skills/super-code/scripts/run-profile.mjs`
- `skills/super-code/scripts/stop-run-processes`
- `skills/upstream-feedback/SKILL.md`
- `skills/upstream-feedback/report-template.md`
- `tests/super-code/run-profile-fixture.mjs`
- `tests/super-code/run-profile-ordinary-fixture.mjs`
- `tests/super-code/test-run-digest.sh`
- `tests/super-code/test-run-profile-in-flight.sh`
- `tests/super-code/test-run-profile.sh`
- `tests/super-code/test-setup-cleanup.sh`
- `tests/super-code/test-stop-run-processes-inventory.sh`
- `tests/super-code/test-verification-completion-metrics.sh`

## Consumed composition-input identities

| Input | SHA-256 |
| --- | --- |
| `/private/tmp/ufz-correction-final-source-review/manifest.json` | `34a9c2088e20773479aa412035834cec7f6e0eabfefbfd5d516b99005eae902c` |
| `/private/tmp/ufz-correction-final-source-review/runtime-review.md` | `2b9dbc06c97580cc43cea83b189a5a44bc6058250d76504c23589e7a09a29c41` |
| `/private/tmp/ufz-correction-final-source-review/harness-review.md` | `386c26a1c05b4cb48cfda056462dfa580cfe1c3fca4cb7c18b5fed27f35b2c5b` |
| `/private/tmp/ufz-correction-final-source-review/source-review-report.md` | `a8e4193c90983d604dd5a987a3520e2835a5ac25093164a60fdc6abbcfc0abab` |
| `/private/tmp/ufz-correction-final-source-review/acceptance-review.md` | `ac1182c52b0a754488c8fccc5b1d1f0b222df9e77084de845df2549f39a8e6b1` |
| `/private/tmp/ufz-correction-final-source-review/metrics-cleanup-reuse-provisional.json` | `9b843e841381eccdd66ac8fbaa6d6b78f133e9a88af417e177e007c10c04967a` |
| `/private/tmp/ufz-correction-final-artifact-inventory/REPORT.md` | `6eb190eae7bf941492712470a4ea6716bf9c0b48c8edbe3e27c586d49260e1a2` |
| `/private/tmp/ufz-correction-final-artifact-inventory/artifact-manifest.json` | `f70790cb005225583b7d4eeb26a10ee8120378e2d08e4950545c5a18266b7f3a` |
| `/private/tmp/ufz-correction-final-artifact-inventory/inventory-self-check.json` | `3ee6ce538994bc8e816f5709b0c6dadf1842802223618287b52dd8f8395c51fd` |
| `/private/tmp/ufz-correction-final-artifact-inventory/source-bound-reuse-proof.json` | `fe4b60e8ee5d1ac842f6d8022d7cbd1f04f3336356034bfc6f63a71ff291caa7` |
| `/private/tmp/ufz-correction-final-artifact-inventory/pending-adapter-provenance.json` | `05356bd3c048457161a2760399d839481e6ee03136f9e92ee7c4b6dd1c561dfd` |
| `/private/tmp/ufz-correction-final-relevance-proposals/REPORT.md` | `c538a42878471b8e338386faf16571aca661609db56326a7ca37143240c7774a` |
| `/private/tmp/ufz-correction-final-relevance-proposals/adoption-audit.json` | `da174c26cc8139743f083bd75c3efeeca32edaf7ad6b8df475fdd0a01ba0ed99` |
| `/private/tmp/ufz-correction-final-relevance-proposals/historical-qualification-map.json` | `ff2452b359f3fa726578a459be4a4c8fcda0b8f00164d541aa6ff6ecbdcbe69c` |
| `/private/tmp/ufz-correction-final-artifact-inventory/role-assessment-addendum.md` | `e97c745ea754aba9c4e4c6c9d61ae0d77e8cf2e3f295e809cb357b5040706389` |
| `/private/tmp/ufz-correction-final-artifact-inventory/role-assessment-addendum.json` | `55605b0c73f238fb61c7719b75e78f5d4b28d362f4ea8fc9551efd8d373c393a` |
| `/private/tmp/ufz-correction-final-artifact-inventory/role-assessment-addendum-manifest.json` | `57c057bc7cc21a91ec1b7bf89fd92c8fbb47dbe4fa837bfe1a2610de04e38152` |

Only this composed report was written during composition. Prior runtime probes/report remain separately attributed. No canonical source/run/index/tracker/Herdr mutations or broad tests were performed.
