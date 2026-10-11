# super-auto run — 2026-10-10-key-abstractions-design-step

flags: planOneShot=f skipPlanRoast=f skipCodeRoast=f autonomous=t
resumeChange: 2026-10-10 · "interactive design, autonomous after, both roasts on" · autonomous=t from phase 3 (code) onward, flags line updated then; phases 1–2 stay interactive (Mode A, the human approves the top split); both roasts run
phase: fix-loop
codeMechanism: Workflow

idea: Goal: add a light "Key abstractions" design step to super-design, so agent-written code gets the right abstractions up front and stays maintainable. Where and what: - It runs at the root, after the spec is written and before decomposition. - A fresh-context subagent reads the spec, a design distillate and the relevant existing code. It writes a "Key abstractions" section into the spec. - The section answers these questions briefly, skipping what doesn't apply: 1. Which new abstractions are needed, and which existing ones to extend? Read the code first; callers branching on a kind, type or name signal a missing abstraction. 2. Each one's responsibilities, the decision it hides, and what it must not do. 3. Relationships: composition, delegation, a shared interface, or inheritance only for true substitution; and the direction of dependencies. 4. Variation: new kinds keep coming → an interface with one implementation per kind, chosen in one place; fixed kinds with growing operations → a closed enum with match. 5. Lifecycle and ownership: who creates and owns each object, how long it lives, whether it's shared across threads, and what releases its resources. 6. Mutable and global state. 7. Errors crossing each boundary. 8. Walk-throughs: the main use case, plus one likely future change, which should touch one new type and one registration rather than every caller. 9. Restraint: every pattern or layer names the variation it absorbs; no pass-through layers. - When nothing new is needed, the section is one line: "no new abstractions", naming the existing types it extends. - No method signatures. The design distillate: - A one-page reference, written in our own words and loaded only by this step. - Content: - GoF's own caveat (apply a pattern only when its flexibility is needed; start from "what should be able to vary?"); - program to an interface, and prefer composition; - a short problem→pattern table of the recurring patterns; - language notes (closures instead of Strategy/Command, sum types with match instead of Visitor, Rust typestate); - when not to (one-implementation interfaces, pass-through layers, pattern names as a quality signal). - Sources: dossiers D2, D3 and D9 in docs/superpowers/research/2026-10-07-oop-design/dossiers/. Per D9, guidance can push either way: unguided agent code under-abstracts, and more specific OO guidance inflated size and coupling. Questions 8 and 9 balance that. Downstream: - Decomposition uses the section: the bead that creates each abstraction writes a responsibility doc comment on the type, covering what it owns, what it doesn't, and where new behavior goes. - Interactive (Mode A) shows the section to the human before decomposition; autonomous runs rely on the design roast, which reviews it with the spec. - Implementers get the entries their task touches in their brief. - super-auto's code roast receives the root spec path as stated intent, as a pointer only. This is item 2 (probe R-c0) in TODO-OOP-RECOMMENDATIONS.md. With it, the roast can flag logic placed outside its owner. Motivating case. Describe it generically in committed docs: this fork is public, so don't name the project or quote its code. A CLI tool added a second, then a third agent-harness integration. Callers branched on harness-name strings in about 15 places across 7 core files. Even after a later run designed a proper adapter trait and registry, such branches grew to 18 across 11 files. Constraints (human-partner decisions): - No mechanical tests or lints enforcing responsibilities (too strict; it invites awkward workarounds for false positives). - No new review pass or gate. - super-auto's phase set stays unchanged, since this lives inside phase 1. - Keep it proportional. - It revisits rejected option D-a in TODO-OOP-RECOMMENDATIONS.md, so record the decision there as a new item. - Evaluate per writing-skills with a small before/after micro-test, e.g.: - a synthetic CLI adding a third integration should get the missing abstraction and its variation point named; - a small single-unit change should get "no new abstractions". Report the cost. A long replay eval on a real project is a follow-up, out of scope. - Base on main. Never push or tag; the feedback tab cuts releases.
spec: 2026-10-10-key-abstractions-design-step-design.md
epic: super-plan-998
branch: super-auto/key-abstractions-design-step
base: main
roast-design: 2026-10-11-key-abstractions-design-step-roast-design-1.md, 2026-10-11-key-abstractions-design-step-roast-design-2.md
roast-code: 2026-10-11-key-abstractions-design-step-roast-pr-1.md
skillSource: /Users/alepar/.claude/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar4.21/skills @ 0ea4761c565e121b6b21d19f544c8f48af491426 (6.4.2-alepar4.21)

roastDesignRound: 2
roastCodeRound: 1
graph-pass: depth 2→2 · width 3.5→3.5 · applied 0 · parked 0

approvals:
- top-split · human · super-plan-998.1 LEAF, super-plan-998.2 LEAF, super-plan-998.3 LEAF, super-plan-998.4 LEAF, super-plan-998.5 LEAF, super-plan-998.6 LEAF
- coverage-round-1 · canonical R-list: see coverage-round-1-requirements.md (R1–R12) · requirements: 12 · mapped: 10 · unmapped: 3 (R6, R9, R12) · auto GAP R12 → applied (sweep + acceptance); auto GAP R9 → applied (.4 ownership); auto UNOWNED-SEAM stated-intent handoff → applied (.4); auto GAP R6 → applied (.3); auto GAP R8 → applied (.3); auto GAP R4 → applied (.3); auto GAP brief carry → rejected (verified); auto UNOWNED-SEAM contract ordering → rejected (spec fixes it); auto UNOWNED-SEAM roast format → rejected; auto GAP R10 → applied (epic acceptance); auto UNOWNED-SEAM TODO writers → applied (.6)
- coverage-round-2 · R-list read back from round 1, R13–R14 appended (coverage-round-2-requirements.md) · requirements: 14 · mapped: 14 · unmapped: 1 (R13) · divergence: findings 11 → 12, novel 10/12 (83%), widening: yes (cap holds; the design roast reviews the settled tree) · auto GAP eval behaviour → applied (root acceptance); auto GAP R7 → applied (.3); auto GAP R14 → applied (.3, .4); auto GAP nested digests → applied (.3); auto UNOWNED-SEAM .5 placeholders → applied (.5); auto UNOWNED-SEAM TODO item 2 → applied (sweep); auto GAP baseline → applied (.5); auto GAP prompt relay → rejected (assemble-args.mjs:182, :240); auto GAP named fixtures → applied (.5); auto UNOWNED-SEAM nested spec paths → applied (.4); auto UNOWNED-SEAM writing-plans handoff → applied (.3); auto ORPHAN .6 → rejected (serves R11)
- stepBackDesign-round-1: redesign — applied: digest as an add-only copy written at separate triggers → specs' sections as the single source, one sync regenerating the epic digest, owner-bead entries, no-beads plans and designer input (dissolves 4)
- design-roast-1 escalation · human · re-entry runs the step when a committed spec lacks the section; a nested sp:needs-design is cleared only after apply and sync
- design-roast-2 · converged · punch list (4: 3 Should-fix, 1 Nit) · human · applied inline, no re-roast

parked:
- final review (super-code) · degraded-verdict · "super-plan-998.7 integration sweep closed by the orchestrator without a commit (verification-only, no no-change completion path); phase-6 sweep re-measures" · resolves-on: sweep

codeBuckets:
  completed: super-plan-998.1, super-plan-998.2, super-plan-998.3, super-plan-998.4, super-plan-998.5, super-plan-998.6
  escalated: super-plan-998.7 (closed by the orchestrator: verification-only, no commit)
  pendingRetry:
  parked:
  stalled: false
  review: not ready (two Important text gaps: §Root Brainstorm still routes to §Decomposition; rubric X1 vs extend-only (c); plus .7 resolution)
  sweep: SWEEP DEFERRED (caller-owned)
  slowness: graph-bound (critical path 26m, 15m planning); 19m in the no-commit sweep attempts
  worktreesKept:
  processSweep: stopped 0 · survived 0
