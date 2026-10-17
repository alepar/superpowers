# Task 6 legacy adapter independent review

Fidelity/spec verdict: **NEEDS_FIX**. Quality verdict: **NEEDS_FIX**. Two concrete selection defects prevent approving this snapshot as a complete interpreted extraction. Byte preservation, strict-occurrence preservation and status separation pass the checks described below. This review grants no registration, correspondence approval, current finding disposition, root acceptance or release authority.

Reviewed snapshot: `/private/tmp/ufz-correction-legacy-adapters/`, also frozen by the parent at `/private/tmp/ufz-correction-legacy-adapters-initial/`.

- `reversible-manifest.json` SHA-256: `20ac4489e3029a2c65394f8b766bdae8bbf441310962edff9288fcb0e93d81cf`.
- `finding-source-record-proposals.json` SHA-256: `ec52ee50d9e0ed8b666db30e4b5014eacd0d00243518796242da020e68f19ca0`.

## Review scope and method

Read REPORT.md, all 79 source-record proposals and their 199 occurrence texts, per-source classifications and original review judgments, manifest, accounting, supplements, unresolved gaps, correspondence drafts, validation/audit evidence and relevant builder/verification code. Used the independent full-raw interpretations in `part-{1,2,3}-review.json` as the semantic input. Reread original raw spans for the disputed mixed passages, metrics example and structured concerns. I did **not** independently reread every byte of the approximately 1 MB original source population; complete original reading is the separately attributed work of those three reviewers.

Compared the correspondence contract with Task 3's `task-3-report.md` under the correction plan in the `02a7/superpowers` worktree. Ran only read-only byte/JSON/accounting checks and a narrow original-parser probe. No product/core test suite ran. No snapshot, original source, run, index, HEAD, tracker, Herdr or process state was changed; this report is the only file written by this reviewer.

## F1 — Important: repair labels suppress actual historical finding appearances

`build_proposal.py:129` overrides selection whenever a passage has `claimed-repair`, keeping it only when another scope/obligation role is present. That drops assertions independently classified **both** `historical-finding` and `claimed-repair`. A claimed repair does not remove the source's historical finding appearance. The complete original text remains in metadata/raw, but the proposed complete extracted source lacks it.

The clearest counterexample is ordinal 17, `task-14-report-fix.md`, raw bytes `[539,986)`, line 14. It explicitly verifies the Important producer/collector filename mismatch (`final-review-ID.md.diff` versus `final-review-ID.diff`) and then describes the correction. Its source record has only the pending-behavior-evaluation occurrence; the verified Important assertion disappears from extraction. Ordinal 18 contains its separately attributed appended appearance and drops that too. The finding in a different source, `task-14-review`, cannot replace either appearance without an explicit identity decision.

Likewise, ordinal 25, `task-16-report.md`, bytes `[7247,7805)`, lines 116–126, reports an actual self-review failure: a verified run-owned failure with conflicting source-history gaps incorrectly returned `eligible:true`. The independent review specifically identified this omission; the new proposal still excludes it. Ordinal 7's missing closed-status-array failure and ordinal 2's earlier-contradiction-loss regression are further concrete counterexamples.

Complete census of passages classified with both roles in the fixed snapshot follows. Offsets are original UTF-8 bytes, zero-based and half-open. These are **13 affected appearances, not 13 independent defects or current outstanding obligations**.

| Ordinal / source basename | Original byte span | Original lines | Proposed occurrence coverage |
|---|---|---|---|
| 2 / task-10-report-fix | `[3014,3613)` | 47–54 | None |
| 3 / task-10-report | `[20452,21051)` | 243–250 | None |
| 7 / task-11-report | `[5758,6278)` | 65–78 | None |
| 7 / task-11-report | `[6279,6985)` | 80–97 | None |
| 11 / task-12-report | `[10301,10750)` | 99 | None |
| 11 / task-12-report | `[16157,17041)` | 169 | None |
| 15 / task-13-report | `[8564,8868)` | 125 | None |
| 15 / task-13-report | `[8869,9295)` | 127 | None |
| 17 / task-14-report-fix | `[539,986)` | 14 | None |
| 18 / task-14-report | `[16071,16518)` | 175 | None |
| 21 / task-15-report | `[21569,21919)` | 247 | None |
| 25 / task-16-report | `[7247,7805)` | 116–126 | None |
| 25 / task-16-report | `[14138,15094)` | 244–258 | Only blocker obligation `[15015,15094)` |

Required correction: replace the blanket mixed-role exclusion with an explicit passage-level judgment that preserves actual asserted findings alongside their repair-claim qualification. Preserve complete substantive boundaries or explicit reversible splits. Do not mechanically promote every TDD failure or repair narrative into a new finding, and do not infer present applicability, supported resolution or cross-source identity. Reconcile the independent reviewers' specific historical-finding judgments before claiming complete extraction. Pure repair/support/example passages can remain metadata.

## F2 — Important: wrong split promotes a metrics example and drops its qualification

Ordinal 21, `task-15-report.md`, independently reviewed mixed passage `[5322,5840)`, contains an introductory label, illustrative JSON and a final population qualification. `build_proposal.py:149` uses `split('\n\n')[-2]`, selecting the JSON block `[5358,5650)` as a `scope-or-coverage-qualification` occurrence. The adapter therefore contains example values such as `sources:3`, `findings:5` and `gaps:0`, without even the original “Actual emitted projection example” label.

The actual substantive qualification, bytes `[5652,5840)`, line 70, is omitted from extraction:

> Task-report coverage is absent from this retained population, not a zero run-wide task-review total. The full projection retains the two other-section groups for Remaining/interpretation.

A later generic counting paragraph does not preserve that exact population-specific qualification. Metadata preserves the full original, but the selected occurrence contradicts REPORT.md's claim that illustrative examples remain metadata and the map's claim that it isolates a substantive qualification.

Required correction: select the exact final qualification paragraph as the occurrence and keep the fenced metrics example as explicitly labelled contextual evidence. Update all dependent mappings, proposal records, hashes and counts. No actual run metric or finding count follows from those example numbers.

## Positive checks and their limits

- All 79 raw copies match their recorded hashes/lengths and current original artifact bytes. All retained-artifact and interpretation-metadata hashes match the manifest. The copied input reviews match their original review files and recorded hashes.
- All 484 reviewed passage spans match exact raw bytes. All 175 adapter occurrence maps match both raw spans and proposed text/section/position. The six selected decoded JSON fields agree with their original values; the knownLimits list's newline-joined representation is explicit. Separately verified all 20 structured input blocks/pointers or exact JSON-value spans against the independent review records.
- The five strict sources preserve all **24** original occurrence objects, source identities, order, section, position, key and text exactly, including full multiline tails. Raw strict reports are byte-identical. Their record artifact paths use equivalent run-relative paths in place of original absolute paths; they resolve to the same originals and do not change occurrence identities.
- A fresh narrow `report-verdict --complete` probe of all **74** original legacy raw copies returned exit **2** for every one, with no unexpected success. The supplied validation and independent structural audit retain successful extraction evidence for the 74 separate adapters plus five strict artifacts. Passing extraction is representation evidence, not semantic completeness; F1/F2 survive those checks.
- All seven zero-occurrence adapters have explicit reviewed scoped-empty bases: ordinals **4, 9, 12, 22, 26, 31, 34**. Their exact raw declarations survive. The null at ordinal 26 is justified only by the complete scoped CLEAN review and its substantive evidence; null is not a general empty rule. I found no empty adapter inferred solely from status, absence, parser failure or task closure.
- All **105** accounting passages retain exact original text and valid proposed refs where present. Explicit pending obligations survive selected mixed-passage splits. This is coverage of the independently classified passage inventory, not proof that overlap alone establishes complete semantic coverage. The builder's overlap assertion cannot detect the wrong-selection defect in F2 or missing finding-only spans in F1.
- All **29** strict supplements remain exact explicit qualifications outside strict24, distributed **4/4/14/7** across ordinals 75/76/77/78. All **35** source-level unresolved gaps and four global gap categories remain open. Supplements and gaps require owner reconciliation; they are not silently resolved or additional current-defect totals.
- The **69** supported-correspondence drafts have Task 3's required shape and preserve original compact-recognized kind/verdict and exact hashes. Original parser-failure evidence is retained through the sidecars. They remain proposals: “supported” in a draft cannot override this failed completeness review. For the **five** unknown original outcomes (ordinals **1, 47, 49, 53, 73**), no supported judgment is fabricated. NEEDS_CONTEXT is explicitly the adapter's conservative status; original raw fields remain separately preserved. Roast markers remain exact.
- The current **73** finding-source records equal the snapshot's retained current records, and run.md retains SHA-256 `146ecea08d9164d1f0d62db48eb52fa58c6deb3fccdb18a0325cf9ea43333ffd`. Independently checked no source-ID, original-artifact-path or raw-hash overlap with the 79 proposed historical sources. This proves no such transport overlap, **not** semantic disjointness or absence of repeated defects.
- No applied identity links or dispositions occur in the proposal metadata. Task 19's corrected same-byte report/review pairs do not provide finding identity or resolution. Strict rejected claims retain their historical reasons without being converted into new supported rejection decisions.

## Explicit representation limits for the parent

Two structured concern renditions are retained only in metadata: ordinal 43 `/concerns/0`, exact JSON string bytes `[9651,9791)`, and ordinal 49 `/concerns/0`, `[22349,22581)`. The latter reiterates caller-owned evaluation/review/sweep/root/human obligations. Their prose counterparts are extracted, and exact JSON pointers, values and blocks remain separately retained. I do not count this as a third proven loss of obligation meaning or a silently applied identity link: the independent source review expressly required separate provenance and prohibited treating repetition alone as an independent defect. The parent should explicitly settle whether the intended registration contract requires these additional structured concern appearances as occurrences; the current 199 count is not exhaustive of every structured/prose rendition.

After F1/F2 corrections, fresh semantic review must assess the changed selection and resulting records before registration or correspondence approval. Keep the failed initial snapshot, all 73 existing registrations, strict24, source gaps, supplements and original bytes intact. Current applicability, semantic cross-source identities, repair/rejection sufficiency, mapping to the current requirement inventory and root acceptance remain parent-owned and unestablished by this review.
