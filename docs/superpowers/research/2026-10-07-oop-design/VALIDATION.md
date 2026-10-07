# Validation results — delivered package

Run on 2026-10-07 against the final versions of `report.md`, `recommendations.md` (v2), the nine
dossiers and the canonical ledgers. Skill scripts are from `~/.claude/skills/deep-research/scripts/`;
lead tools are in `tools/`. Validators check structure and identity, not semantic entailment; the
lead reviewed material claims for entailment separately, and the critique stage re-checked the plan's
evidence (see [critique/refinement-log.md](critique/refinement-log.md)).

| Check | Command | Result |
|---|---|---|
| Coverage and stop consistency | `verify_coverage.py --dir . --require-stop` | `{"status": "ok", "errors": [], "rounds_checked": 5}` |
| Claim support (all dossier and report claims) | `verify_claim_support.py verify --dir . --strict` | pass — 1222 claims, 1222 `supported`, 0 factual unsupported |
| Layered package (facet markers, dossier links and IDs, anchors, bibliographies) | `validate_report_package.py --dir . --delivery` | `{"status": "ok", "errors": []}` |
| Markdown surface checks | `validate_report.py --report …` on `report.md`, `recommendations.md`, `dossiers/D1`–`D9` | 11 × PASS (6 checks each) |
| Bibliography identity (network) | `verify_citations.py --report report.md` | PASSED — 69/73 verified (27 by DOI, 42 by URL); 3 unverifiable because the publisher returned HTTP 403 ([33], [34], [201]); 1 flagged "suspicious" ([167]) — a false alarm: the DOI `10.1145/1414004.1414008` resolves to Cataldo, Herbsleb & Carley, ESEM 2008, under the short title "Socio-technical congruence" (checked against doi.org CSL metadata) |
| Repository citations in the documents | `tools/check_doc_citations.py <repo> report.md recommendations.md audit/README.md critique/refinement-log.md` | 215 checked, 214 resolve; the 1 "missing file" is `skills/super-design/scripts/contract-digest`, a file the plan proposes to create (expected) |
| Repository citations in the audit evidence | `tools/check_audit_citations.py <repo> audit` | 617 citations: 596 at the cited lines, 1 line drift, 20 non-verbatim summary excerpts reviewed by hand ([audit/VERIFICATION.md](audit/VERIFICATION.md)) |
| Evidence quotes vs fetched text | `tools/merge_workers.py` at join time | 972 worker candidates accepted (exact, 5-gram fuzzy, or despaced for PDF artifacts; 13 by lead inspection), 9 rejected; lead residual-round passages verified by `tools/lead_register.py` before registration |

## Corrections made during validation

- Placeholder-check false positives: quoted words "TODO"/"FIXME" (from Yuan et al.'s handler patterns
  and MAST's verifier description) were hyphenated in D5, D6, D7, D8 and the plan, and the affected
  claim IDs were recomputed and re-registered.
- A duplicate Yuan et al. source (same paper, different URL) created during lead registration was
  removed and its passages re-pointed to the canonical source before any document cited it.
- A non-idempotent re-run of `tools/finalize_rounds.py` duplicated query rows; the tool was fixed and
  the ledger rebuilt (coverage re-validated).
- After critique 1: wrong line ranges in the v1 plan and in `audit/VERIFICATION.md` were corrected
  (see the refinement log).
