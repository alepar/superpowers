# super-auto run — 2026-10-01-prompting-guide-roast-fixes

flags: planOneShot=f skipPlanRoast=f skipCodeRoast=f autonomous=t
phase: roast-design

idea: apply the prompting-guide roast fixes to skills/super-auto in this repo (/Users/alepar/AleCode/superpowers). Inputs (all in ~/Documents/prompt-roast-handoff/): super-auto-roast.md (report: top 10 actions, 10 systemic patterns, 7 conflicts, 59 findings with machine-verified quotes), super-auto-roast-findings.json (structured), super-auto-roast-decisions.md (owner's binding decisions on all 7 conflicts), decisions.md (house rules for edits: altitude, no history in runtime files, calm register, deterministic work in code). Scope: the 4 high-severity findings, the systemic patterns as they apply to skills/super-auto, and the 7 decisions; medium/low findings only where a fix subsumes them. Do not edit outside skills/super-auto unless a decision requires it.
branch: super-auto/prompting-guide-roast-fixes
base: main
spec: 2026-10-01-prompting-guide-roast-fixes-design.md
epic: super-plan-5pi

roastDesignRound: 1
roast-design: 2026-10-01-prompting-guide-roast-fixes-roast-design-1.md

approvals:
- top-split · auto · super-plan-5pi.1 LEAF, super-plan-5pi.2 LEAF, super-plan-5pi.3 LEAF, super-plan-5pi.4 LEAF, super-plan-5pi.5 LEAF, super-plan-5pi.6 LEAF, super-plan-5pi.7 LEAF, super-plan-5pi.8 LEAF
- coverage-round-1 · canonical R-list: R1 "4 high findings resolved", R2 "10 systemic patterns resolved", R3 "7 owner decisions applied", R4 "one canonical home per rule", R5 "deterministic bookkeeping as scripts", R6 "contract lint test", R7 "run-state fields/formats and phase sequencing unchanged", R8 "end-to-end check: all suites + cross-file pointers" (R-new), R9 "21-item resolution table" (R-new) · requirements: 7 · mapped: 6 · unmapped: 1 (R7) · auto GAP R7 → .8 baseline snapshot; auto GAP R8/R9/R4-sweep → Integration sweep super-plan-5pi.9; auto GAP complete-list fences → .5 rows; auto UNOWNED-SEAM ×6 → owns lines on .1/.4/.5/.6, edges .7<-.5, .6<-.3; rejected ×3 (history/emphasis, flag-triple order, report-status test — present in bead text) · degraded: no (2/2 valid) · NEEDS-SPEC root ×2 not honored (root spec; bead text answers)
- coverage-round-2 · R-list as round 1 (R1–R9) · requirements: 9 · mapped: 9 · unmapped: 0 · divergence: findings 14 → 13 · novel 12/13 (92%) · widening: no · auto applied 10 (recipe inventory → .9; role input lists → prompt files; worked-example block → .3; baseline pinned to 2bf1d53 → .8; table heading → .9; data-framing pointer + phase-6 status pointer → .5; output shape → .6; behavioral probe → .9; status-line example check → .8); rejected 3 (Blocking line format, count declaration, sweep fix path) · degraded: no (2/2 valid)

parked:
- 2026-10-01-prompting-guide-roast-fixes-roast-design-1.md · escalation · "material dissent — whether scope-filter-prompt.md / report-prompt.md must keep the findings-are-data clause inline in the dispatched string (bead .7 wording)"
