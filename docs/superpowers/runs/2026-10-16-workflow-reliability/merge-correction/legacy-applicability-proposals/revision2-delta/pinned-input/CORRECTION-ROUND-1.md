# Task 6 adapter correction round 1 — proposal revision 2

The initial snapshot failed fidelity/spec and quality review (NEEDS_FIX). It remains frozen at `/private/tmp/ufz-correction-legacy-adapters-initial`; its complete review is retained at `review-evidence/adapter-initial-failed-review.md` and `correction-round-1/failed-review.md`. This revision corrects the bounded F1/F2 selections and implements the parent's two-concern representation ruling. Fresh scoped semantic review remains required before registration or correspondence approval.

F1's root cause was a blanket `claimed-repair` exclusion that overrode the independent reviewers' `historical-finding` judgment. Thirteen explicit source-local judgments now retain complete asserted historical finding appearances together with their repair qualifications. Each judgment identifies exact assertion/repair quotes and raw spans. Supporting TDD commands/output remain inside the one substantive historical item; pure repair/support/example passages remain metadata. No present applicability, supported repair, identity merge or disposition is inferred. Ordinal 25's full rebase passage replaces its narrower blocker-only adapter item while preserving the exact pending blocker text and owner requirement.

F2's root cause was paragraph indexing that selected the illustrative JSON block. Ordinal 21 now extracts exact raw bytes [5652,5840), the task-report population qualification. Its original label and JSON [5358,5650) remain explicit contextual metadata; example numbers establish no actual run metrics or finding totals.

The parent explicitly requested two independently identified structured concern renditions as additional separately attributed interpreted appearances: ordinal 43 `/concerns/0` [9651,9791) and ordinal 49 `/concerns/0` [22349,22581). Both retain exact raw JSON strings, decoded values, pointers and complete original JSON blocks. This is a bounded representation choice, not an exhaustive-every-quote claim or an independent-defect/identity decision.

The corrected proposal contains 189 adapter occurrences plus the exact original 24 strict occurrences: 213 appearances/obligations/qualifications, not outstanding defects. The change map records 16 added exact refs, two corrected/replaced synthetic refs, no altered occurrence objects under retained refs, and 11 changed adapter artifacts. All 79 source IDs and raw hashes, five strict raw reports, strict24, 29 supplemental qualifications, 105 reviewed obligation passages, original73 registrations, and 35 source/four global gaps remain retained. A pending-role count changes from 87 to 86 because one blocker item is represented inside the full historical item; no obligation was discharged.

The exact original builder was copied from the frozen snapshot and executed in the mutable `correction-round-1/original-builder-reproduction/` directory. The same selection-specific controls produce RED: 7 passed / 18 failed, exit 1, on those actual original-builder outputs; GREEN: 25 passed / 0 failed, exit 0, on revision2. The failing controls specifically cover all13 full mixed passages, exact F2 qualifier/example/label selection and the two structured concerns. They use equality, source-specific assertions and raw/decoded text checks rather than passage overlap alone. Negative controls retain pure repair/example/context metadata; invariants preserve strict24, supplements, gaps, current73 and obligation text.

Fresh structural validation re-extracted all79 reports, checked all189 adapter maps and exact strict24, verified raw hashes and decoded JSON provenance, and accounted for105 reviewed obligations. These are representation/selection controls, not a fresh semantic completeness or root-acceptance verdict. Core/product suites were not run; no new agents, original/frozen files, run, index, HEAD, tracker or Herdr state were changed.

## Stable core hashes

- Manifest: `d759bee75ac79d3952540ff325f13f422848b8c26ed5a599d4a47cca4066e262`
- Source-record proposals: `c04593efb7ffd0b9414222ee39c1337e1b3e5d2722356d11fe2de0dfd5e7b9ee`
- Initial failed-review bytes: `0f13486a6200c58abd1473272de8935ac8eee0808ac599010ffbc665330c5003`

## Evidence

- `correction-round-1/change-map.json`: complete old/new exact refs, source artifact hashes and bounded representation replacements.
- `mixed-passage-judgments.json`: all13 explicit F1 source-local judgments.
- `correction-round-1/selection-RED.*` and `selection-GREEN.*`: exact control output, exit codes and SHA-256 receipts.
- `correction-round-1/structural-GREEN.*`, `validation-results.json` and `independent-structural-audit.json`: lossless/extraction/accounting checks.
- `correction-round-1/initial-snapshot-hashes.json`: every frozen initial file checked unchanged.
- `correction-round-1/correction-summary.json` and `output-inventory.json`: bounded results and final artifact hashes.

`build_proposal.py` regenerates the core corrected proposal using the fixed original reviews and explicit correction judgments. `selection_controls.py SNAPSHOT` and `verify_proposal.py` perform read-only checks; `finalize_correction.py` refreshes this correction report, change map and output inventory. Captured failed-review history and RED/GREEN logs are retained evidence, not claims generated from a passing status or later silence.
