# Historical intake handoff

The bounded population is **79 sources**: 74 strict-parser failures and five existing strict parses. All have explicit source classifications and lossless sidecars with original headings, per-section positions, complete text and line/byte locators. The original **24 strict occurrences** are unchanged; five original parsed JSON artifacts are also copied byte for byte.

**26 historical finding/minor appearances** and **four structured renditions** were isolated from the broader contextual population. They are prospective appearances, not a current outstanding-defect total. The two original roast PR rejections retain their reasons and historical rejected state. **121 concern/scope passages, 99 explicit empty declarations, 30 repair narratives and six author disposition assertions** remain separate. No FIXED/DONE/CLEAN claim, later silence or task closure becomes a supported disposition.

All **110** raw inventory hashes and byte counts match. The **33** raw artifacts outside the 79 report population are explicitly classified: 29 input briefs and four supporting JSON artifacts. The three known Task 19 retained references are separately hash-checked. The retained report/review copies are byte-identical to their canonical raw-intake counterparts; no byte mismatch or differing revision is established. No canonical record was registered and no semantic disposition was applied. The retained diff is supporting evidence, not a report.

## Remaining interpretation gaps

- The sidecar representation is prospective. All 74 original strict-parser failures remain visible; none is relabeled a strict parse success.
- Headerless fields and narrative reports retain original null section context. A canonical source/section/position representation for those items requires explicit interpretation; an absent heading never implies None.
- Repeated prose, JSON, fix-report and archive appearances remain separate. Proposed exact-text links are recorded with `applied:false`; semantic identity is unjudged.
- Historical repair and resolution assertions retain their full text and supporting-source context, but their semantic sufficiency has not been judged.
- Task 19 report/review canonical and handoff copies have identical hashes and byte lengths. The earlier differing-bytes claim was mistaken and is withdrawn; see `task19-qualifier-correction.json` for current and frozen-86ce3567 evidence. Byte equality does not imply a supported finding disposition.
- Concern/untested/live-evaluation/parent-ownership passages remain qualifications and obligations for the acceptance owner; no acceptance determination was made.

## Artifacts

- `occurrence-projection.json`: all 79 sources, original 24 occurrences, selected historical findings, structured renditions and separate concerns/declarations/repair claims.
- `occurrence-projection.md`: exact finding/minor text with source line locators.
- `coverage.json` / `coverage.md`: complete source inventory, raw hash/byte counts, dispositions and exclusions.
- `sidecars/`: full original section bytes, all exact units and candidate passages. These contextual passages are not registered as findings.
- `task19-variant-projection.json` / `variants/`: bounded variant evidence and explicitly unjudged repair claims.
- `existing-strict-json/`: exact original parser JSON bytes.
- `verification.json`: successful source/hash/text/identity/segregation checks.
- `adapt_history.py`, `project_occurrences.py`, `finalize.py`: deterministic reproduction, writing only this temporary output directory.

Run the three scripts in that order to reproduce. Product tests were not run. No source code, immutable raw source, run.md, Git state or Herdr state was modified.
