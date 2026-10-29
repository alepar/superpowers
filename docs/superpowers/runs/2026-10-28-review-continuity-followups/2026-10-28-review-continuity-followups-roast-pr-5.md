super-roast verdict: clean (0 nits) [low coverage] [review readiness incomplete]
mode: pr        iteration: 5 of 5
profile (assumed): The artifact is the alepar fork of the superpowers skills plugin for Claude Code and Codex: prompt text plus local bash/node/git helpers that run inside the single maintainer's own repositories and worktrees. There is no network-exposed surface, no external user population, and no real money or customer data at stake; the helpers run with the invoker's own privileges. Rollback is a plugin version pin or a git revert, and the blast radius of a defect is a degraded, blocked or mis-reported autonomous run in the operator's own checkout. Resilience, observability and cost findings are weighed accordingly; correctness of the review-continuity bookkeeping is the change's own stated purpose and is not down-weighted.
inputs: super-auto/review-continuity-followups@c7fb9388 vs main@444f86b2
delta vs prior: 0 new confirmed (0 Blocking) · 0 carried (0 Blocking) · 1 resolved · 0 regressed (0 Blocking) · 3 punch-listed (open)
coverage: scouts 15/15 (correctness, security, premortem, simplicity-design, hot-path-perf, concurrency-async, regression, api-contract, observability, testing, test-causality-lifecycle, test-isolation-environment, test-suite-cost, hygiene-docs, deploy-safety) · raw 1 → deduped 1 → panel 1 · spot 0 · promoted 0 · judge completion 100% · remainder-capped: 0 · review readiness: coverage bounded, provenance unavailable — basis: "review input selection: provenance unavailable; captured source available — .superpowers/sdd/super-plan-mlr-plan/assembled/roast-code-review-continuity-followups-20261028T151257-r5/review-inputs.json (exit 3, 2115 gaps, all historical run payloads under docs/superpowers/runs/2026-10-16-workflow-reliability/ outside the changed paths; selected 138, omitted 0). Inspected: every changed path in the captured diff 444f86b266b2208b612e0e91b0f54762576ff95a..c7fb93887a5fcb3f85ff5c75018e3a732e001e54 read directly from the repo. Unreviewed: the claimed-payload provenance of the 2115 gap entries; whole-range acceptance stays unavailable."
independence: same-family (Claude) — seat-differentiated panel · rung: Workflow
seat-agreement: panels 1 · rr 1.00 · rg 0.00 · fg 0.00 · unanimous 0.00 · ground-loo 0.00 (n=1) · reproduce 0/1/0 · refute 0/1/0 · ground 1/0/0
lane-yield (found/confirmed/unique/refuted): correctness 0/0/0/0 · security 0/0/0/0 · premortem 0/0/0/0 · simplicity-design 0/0/0/0 · hot-path-perf 0/0/0/0 · concurrency-async 0/0/0/0 · regression 1/0/0/1 · api-contract 0/0/0/0 · observability 0/0/0/0 · testing 0/0/0/0 · test-causality-lifecycle 0/0/0/0 · test-isolation-environment 0/0/0/0 · test-suite-cost 0/0/0/0 · hygiene-docs 0/0/0/0 · deploy-safety 0/0/0/0

## Confirmed findings
- none

## Not verified (beyond panel cap)
- none

## Not verified (dedupe failed or judge lost)
- none

## Beyond remainder cap (count only)
- none

## Rejected (with reason)
- [FYI] skills/super-code/scripts/report-verdict:258 — 053298f2 deleted the (iv) "unmarked line becomes a continuation" rejection, so `--repair-check` now accepts a repair that marks only the first of two stranded `## Escalations (need human)` entries and folds the second into it (same for Rejected and Unverified nits); claimed to contradict the amended design's "Folds are caught by the count in (iii)". [lanes: regression] [fix-regression]
  panel: reproduce REJECT (FYI) / refute REJECT (FYI) / ground CONFIRM (Should-fix). Default route rejected (2 REJECT); no overrule, no escalation.
  reason: The mechanism is undisputed. All three seats agree that at head a marker-only repair of two unmarked Escalations lines passes `--repair-check` and yields one occurrence holding both lines. The seats disagree on whether that violates a stated requirement, and the majority's evidence answers the minority's citations.
  - The reproduce seat quotes design §4.1(c): check (iii) is defined as "the repair recovers exactly the original's confirmed findings", and the sentence "Folds are caught by the count in (iii)" sits in the passage about stranded confirmed findings (the `(2 confirmed)` example). amend-code-2.md:137 likewise names only the `(2 confirmed)` two-finding fold. No spec text promises fold protection for Rejected, Unverified nits or Escalations.
  - Both rejecting seats cite design §4.1(a)'s accepted residual: an unindented finding line after an item is folded into the preceding item's text, "kept verbatim in that occurrence, not dropped, but given no key of its own". That residual applies to every recognized section and already exists under plain `--complete` with no repair involved. The repaired Escalations shape is exactly that accepted residual; no text is lost.
  - The refute seat notes §4.1(c) gives the rationale for dropping (iv) outright: the per-line rule cannot tell a folded sibling from a template continuation line, and that rationale holds in every section. Narrowing the rule to non-Confirmed sections is not specified.
  - The ground seat's dissent cites super-auto/SKILL.md:399 and :454 (each Escalations entry gets its own `finding-route` and `parked:` line by occurrence ref, so a folded second escalation gets no human gate) and argues §4.1(a) governs the extractor, not the repair gate. The majority addresses this directly: the routing consequence is a downstream effect of the §4.1(a) residual the design already accepts, not a new requirement violation. The dissent's remaining citations (design §4.1(c), amend-code-2.md:137) are the same text the majority read in context, so the seat evidence does not leave the point unsettled.
  - Preconditions are narrow: the reporter must strand two Escalations entries unmarked and the repair agent must mark only one; the producer rule that each finding is its own `- ` item is the guard.
  - What survives, per the refute seat, is a documentation and test-coverage observation, not a confirmed defect: the design's "Folds are caught by the count in (iii)" sentence and amend-code-2.md:137's "repairs they reject stay rejected, except the two-finding fold" are literally true only for Confirmed findings, and no fixture exercises a non-Confirmed fold. If the maintainer wants fold protection outside Confirmed findings, that is a new requirement to write into the design, not a regression against it.
  - Not pre-existing on base: main@444f86b2 has no `--repair-check` at all.

## Unverified nits (spot-checked)
- none

## Escalations (need human)
- none

## Prior report tracking (iteration 4 confirmed findings)
- [Should-fix] skills/super-code/scripts/report-verdict:298 (rule (iv) rejected every marker-only repair of a template-shaped stranded confirmed finding) — resolved by 053298f2. Verified at head c7fb9388: the "becomes a continuation" rejection no longer exists in the script; check (iii) now counts Confirmed-findings occurrences against the verdict header's `(<n> confirmed)` (report-verdict:256-260). The current packet states the template-shaped Confirmed-findings repair that mlr.28 targeted works at head and does not dispute it. The regression lane's one candidate against that fix (the non-Confirmed fold above) was rejected 2-1 and is recorded there; it does not reopen this entry.
- [Nit] tests/super-code/test-setup-reuse.sh:26 (ambient git identity) — punch-listed (open); not re-surfaced.
- [Nit] tests/super-auto/review-inputs-range-scope.sh:16 (no gpgsign/hooksPath pin) — punch-listed (open); not re-surfaced.
- [FYI] skills/super-code/scripts/dispatch-text.mjs:348; :349 (hashes every archived file of every run) — punch-listed (open); pre-existing on base; not re-surfaced.
- Iteration 3's resolved :253 (non-roast repair exit 0) and :290 (two-finding Confirmed fold) remain resolved; the `rc_cf` fold fixture still expects exit 4 per the current packet. Not re-surfaced.
- Iteration 2's rejected [FYI] report-verdict:173 (unclosed fence can never be repaired) and its spot-checked :2656 / :1173 nits were not re-surfaced; the rejection stands.
- Iteration 2's resolved :226 findings (fence delimiter, lazy continuation, bold clause) remain resolved; not re-surfaced.

Note on qualifiers: `[low coverage]` and `[review readiness incomplete]` are carried because the engine's review readiness states coverage bounded and provenance unavailable (whole-range acceptance of the 2115 gap entries under docs/superpowers/runs/2026-10-16-workflow-reliability/ remains unreviewed); stage coverage itself was 15/15 scouts with 100% judge completion. `convergenceEligible` is false, so `[converged]` is not asserted even though nothing confirmed this round.
