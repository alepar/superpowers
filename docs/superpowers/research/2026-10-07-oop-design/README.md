# OOP design incentives and enforcement — research package (2026-10-07)

Research, audit, synthesis and recommendation for encouraging good OOP/software design during
`super-design`/`super-code` and enforcing it during `super-roast`, including the contract-first
interface-bead hypothesis. **Research artefacts only: no production skill, engine, test, version or
install was changed.** Branch `research/oop-design-scouts`, base `main` eb0462b (6.4.2-alepar4.16).

## Read in this order

1. [report.md](report.md) — final synthesis: direct answer, per-facet findings with anchored citations,
   repository audit synthesis, limitations, bibliography, methodology.
2. [recommendations.md](recommendations.md) — decision summary, options with trade-offs, draft lane
   and lens briefs, design-time changes, contract-first assessment, phased plan, costs, evaluation
   plan, risks, decisions for the human partner, verified-vs-recommended ledger.
3. [critique/](critique/) — independent adversarial critique and the refinement log.
4. [audit/README.md](audit/README.md) — repository coverage and evidence map (eight auditor reports,
   lead spot-checks in [audit/VERIFICATION.md](audit/VERIFICATION.md), machine check of all citations).
5. [dossiers/](dossiers/) — nine facet dossiers (D1–D9) with anchored evidence.

## Canonical research record (deep-research skill format)

| File | Content |
|---|---|
| `run_manifest.json` | question, mode, assumptions, search preflight, retrieval stop, reporting/dossier map |
| `coverage.json` | facets (initial and current), statuses, contested positions, completed rounds, stop |
| `queries.jsonl` | every search attempt with facet, family, round, results considered, yield |
| `retrievals.jsonl` | every original-document fetch attempt, including failures |
| `sources.jsonl` | source registry (display number = registry order) |
| `evidence.jsonl` | verbatim evidence passages with locators (append-only) |
| `claims.jsonl` | anchored claims for dossiers and the final report, with support status |
| `candidate_map.jsonl`, `source_aliases.json` | lead join record: worker candidate → canonical source/evidence, verification tier, rejections |
| [retrieval-failures.md](retrieval-failures.md) | failed fetches, recovered vs inaccessible |
| [VALIDATION.md](VALIDATION.md) | validator outputs for the delivered package |
| [research-plan.md](research-plan.md) | facets, worker assignment, stop rule |

## Working files

- `workers/` — retrieval-worker protocol, per-worker query/retrieval/candidate logs, summaries, claim proposals.
- `audit/` — auditor protocol, reports `A1`–`A8`, evidence rows, verification log, citation check.
- `tools/` — lead tooling: `merge_workers.py` (join + quote verification), `finalize_rounds.py`
  (rounds/coverage), `claim_tool.py` (claim IDs, anchors, bibliography), `lead_register.py`,
  `lead_reverify.py`, `screen_probe.py`, `check_audit_citations.py`, decision files.

Raw fetched page text stayed in the session scratchpad and is not committed.
