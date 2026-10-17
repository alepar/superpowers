super-roast verdict: Should-fix (1 confirmed)
mode: design        iteration: 1 of 3
profile (assumed): Internal local developer tooling. Failures risk developer work and review evidence; no production service or privileged third-party surface is introduced. Stated-purpose and real-data loss severity floors apply.
inputs: docs/superpowers/specs/2026-10-16-workflow-reliability-design.md + nested finding-continuity spec + settled-tree.json @ e0109aa8
coverage: scouts 8/8 (premortem, completeness, yagni, failure-mode, feasibility, domain:workflow-orchestration, domain:distributed-systems, domain:data-pipeline) · raw 6 → deduped 4 → panel 4 · spot 0 · promoted 0 · judge completion 100% · remainder-capped: 0
independence: same-family (OpenAI GPT) — seat-differentiated panel · rung: manual fan-out
seat-agreement: panels 4 · rr 1.00 · rg 1.00 · fg 1.00 · unanimous 1.00 · ground-loo 1.00 (n=4) · reproduce 1/3/0 · refute 1/3/0 · ground 1/3/0
lane-yield (found/confirmed/unique/refuted): premortem 2/1/0/1 · completeness 0/0/0/0 · yagni 0/0/0/0 · failure-mode 2/1/0/1 · feasibility 0/0/0/0 · domain:workflow-orchestration 1/0/0/1 · domain:distributed-systems 1/1/0/0 · domain:data-pipeline 0/0/0/0

## Confirmed findings
- [Should-fix] docs/superpowers/runs/2026-10-16-workflow-reliability/settled-tree.json, super-plan-ufz.8.4 Acceptance; docs/superpowers/specs/2026-10-16-workflow-reliability-design.md:57–61; nested finding-continuity spec:38; docs/superpowers/runs/2026-10-16-workflow-reliability/settled-tree.json, super-plan-ufz.8.4 Acceptance; root spec section 4; nested finding-continuity spec Acceptance; settled-tree.json, super-plan-ufz.8.4 Acceptance; root spec §4; nested finding-continuity spec Acceptance — Task .8.4 requires inclusion of verified fixes supplied elsewhere, contradicting the governing specifications’ removal rule after supported resolution. [lanes: premortem, failure-mode, domain:distributed-systems]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: All three seats confirm that .8.4 requires output that “contains outstanding deferred findings, including verified fixes supplied elsewhere.” Root §4 instead says an item fixed elsewhere “leaves the punch list after verification.” The nested specification and parent task .8 require removal after supported resolution. The refute seat confirms that these criteria prescribe opposite membership for the same supported external fix. The conflicting criterion affects the projection consumed by resume, Remaining and status.
  fix-shape hint: Make .8.4 explicitly require exclusion after supported resolution, including verified fixes supplied elsewhere, and align its acceptance fixture.

## Not verified (beyond panel cap)
- none

## Not verified (dedupe failed or judge lost)
- none

## Beyond remainder cap (count only)
- none

## Rejected (with reason)
- Root spec §1 Workspace and process safety and §2 Scheduling and recovery; settled-tree.json task super-plan-ufz.12 — Resumed admission lacks a survivor-handling rule.
  reason: All three seats reject the claimed gap. Resource preservation, uncertainty reporting and reconciliation already constrain recovery. The failure story additionally assumes conflicting workspace reuse or competing result acceptance, neither required by the artifact. Waiting, holding affected work or isolating a replacement remain compatible implementations under the approved minimal-mechanism scope.
- docs/superpowers/specs/2026-10-16-workflow-reliability-design.md:19–25,43–47; settled-tree.json tasks super-plan-ufz.1, super-plan-ufz.6 and super-plan-ufz.14 — Integration can advance beyond a pinned review without a general review-invalidation rule.
  reason: All three seats reject the claimed gap. Source-bound reviews remain attributable, required reviews retain their acceptance ownership, and integrated-tree measurements are separate evidence. The finding identifies no required review that the artifact actually misattributes or permits measurements to replace. A universal invalidation policy is an additional requirement.
- docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md:16–24; settled-tree.json task super-plan-ufz.8.4 — A later linked actionable occurrence may inherit an earlier resolution.
  reason: All three seats reject the claimed gap. Immutable occurrence identities and semantic support judgments already require a supported disposition to account for actionable evidence. A historical fix does not establish support for resolving a later recurrence. Automatic inheritance despite new actionable evidence would violate the existing contract; the finding establishes no requirement that produces that behavior.

## Unverified nits (spot-checked)
- none

## Escalations (need human)
- none
