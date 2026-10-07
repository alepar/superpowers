# OOP design incentives and enforcement — research package (2026-10-07)

Research, audit, synthesis and recommendation for encouraging good OOP/software design during
`super-design`/`super-code` and enforcing it during `super-roast`, including the contract-first
interface-bead hypothesis. **Research artefacts only: the research changed no production skill,
engine, test, version or install.** It was done on branch `research/oop-design-scouts` (commit
`a4ee3d5`), against base `main` eb0462b (6.4.2-alepar4.16).

This directory on `main` holds the synthesized documents only. They are copied unchanged from
`a4ee3d5`, except that links to files not copied here became plain text naming the branch. The
actionable list, with each recommendation's current status, is
[TODO-OOP-RECOMMENDATIONS.md](../../../../TODO-OOP-RECOMMENDATIONS.md) at the repository root.

## Read in this order

1. [report.md](report.md) — final synthesis: direct answer, per-facet findings with anchored citations,
   repository audit synthesis, limitations, bibliography, methodology.
2. [recommendations.md](recommendations.md) — decision summary, options with trade-offs, draft lane
   and lens briefs, design-time changes, contract-first assessment, phased plan, costs, evaluation
   plan, risks, decisions for the human partner, verified-vs-recommended ledger.
3. [critique/](critique/) — the independent adversarial critique ([critique-1.md](critique/critique-1.md))
   and the [refinement log](critique/refinement-log.md).
4. [audit/README.md](audit/README.md) — repository coverage and evidence map: eight auditor reports
   (A1–A8), with the lead's spot-checks in [audit/VERIFICATION.md](audit/VERIFICATION.md).
5. [dossiers/](dossiers/) — nine facet dossiers (D1–D9) with anchored evidence.

Also here: [VALIDATION.md](VALIDATION.md) (validator outputs for the delivered package) and
[retrieval-failures.md](retrieval-failures.md) (failed fetches, recovered vs inaccessible).

## On the research branch only

These files are on branch `research/oop-design-scouts` at commit `a4ee3d5`, which is not on `main`.
As of 2026-10-07 the branch is not on `origin` either. Read one without checking the branch out with
`git show a4ee3d5:docs/superpowers/research/2026-10-07-oop-design/<path>`.

| Path | Content |
|---|---|
| `run_manifest.json` | question, mode, assumptions, search preflight, retrieval stop, reporting/dossier map |
| `coverage.json` | facets (initial and current), statuses, contested positions, completed rounds, stop |
| `queries.jsonl` | every search attempt with facet, family, round, results considered, yield |
| `retrievals.jsonl` | every original-document fetch attempt, including failures |
| `sources.jsonl` | source registry (display number = registry order) |
| `evidence.jsonl` | verbatim evidence passages with locators (append-only) |
| `claims.jsonl` | anchored claims for dossiers and the final report, with support status |
| `candidate_map.jsonl`, `source_aliases.json` | lead join record: worker candidate → canonical source/evidence, verification tier, rejections |
| `research-plan.md` | facets, worker assignment, stop rule |
| `workers/` | retrieval-worker protocol, per-worker query/retrieval/candidate logs, summaries, claim proposals |
| `tools/` | lead tooling: `merge_workers.py` (join + quote verification), `finalize_rounds.py` (rounds/coverage), `claim_tool.py` (claim IDs, anchors, bibliography), `lead_register.py`, `lead_reverify.py`, `screen_probe.py`, `check_audit_citations.py`, `check_doc_citations.py`, decision files |
| `audit/PROTOCOL.md`, `audit/A*-evidence.jsonl`, `audit/citation-check.txt` | auditor protocol, per-auditor evidence rows, machine citation check output |
| `critique/recommendations-v1.md`, `critique/report-v1.md` | the superseded v1 drafts the critique reviewed |

The documents here name some of these files in backticks, for example the ledgers in
[report.md](report.md)'s methodology and the tools in [VALIDATION.md](VALIDATION.md); those files are
on the branch. The `<!-- claim: … -->` anchors in [report.md](report.md) and the dossiers name rows
in `claims.jsonl`, `evidence.jsonl` and `sources.jsonl`.

Raw fetched page text stayed in the session scratchpad and is not committed anywhere.
