status: clean
metrics: pending (upstream-feedback not yet run)

# super-auto report — 2026-10-10-key-abstractions-design-step

Spec: [2026-10-10-key-abstractions-design-step-design.md](2026-10-10-key-abstractions-design-step-design.md) · epic super-plan-998 · branch `super-auto/key-abstractions-design-step` vs `main` (fork point 0ea4761) · design interactive, then autonomous from phase 3 (`run.md` resumeChange).

## Implemented

- super-plan-998.1 — one-page design distillate, `skills/super-design/design-distillate.md` (4c5a7f5) — beads, ledger
- super-plan-998.2 — designer prompt template, `skills/super-design/key-abstractions-prompt.md` (b7d88d1) — beads, ledger
- super-plan-998.3 — the Key abstractions step in super-design: process step 2, §Key Abstractions, owner beads, the single-source digest sync, promotion-review criterion (daa7171) — beads, ledger
- super-plan-998.4 — code roast receives the run's specs as stated intent (super-roast input + super-auto phase 4/5 lines) (1ec7408) — beads, ledger
- super-plan-998.5 — eval fixtures, rubric and procedure, `tests/super-design/key-abstractions-eval/` (b7fb765) — beads, ledger
- super-plan-998.6 — TODO-OOP-RECOMMENDATIONS.md: item K, D-a revisited, item 2 done, Related rows fixed (d97b796) — beads, ledger
- super-plan-998.8 — fix: stale hand-offs routed through Key abstractions (cluster stale-step-routing) (fbb1893) — beads, `scopeFilter-round-1`
- super-plan-998.9 — fix: the sync creates owner beads only after decomposition, wired into the sweep (cluster sync-owner-bead-path) (ad93122) — beads, `scopeFilter-round-1`
- super-plan-998.10 — fix: rubric X1 and the template agree on extend-only answers (cluster rubric-extend-only) (445f766) — beads, `scopeFilter-round-1`
- Phase-6 eval: all three cases pass (2/3, 3/3, 3/3), 15 runs, 772k tokens — [key-abstractions-eval.md](key-abstractions-eval.md); summary in `skills/super-design/MAINTENANCE.md` (92e38a7)
- Sweep: 8 of 8 release suites pass @ 92e38a7 — `run.md` codeBuckets.sweep

## Remaining

- [Nit] skills/super-design/SKILL.md:74; skills/super-design/SKILL.md:176 — out of scope (filtered): clarity issue only; Precedence is unconditional — `scopeFilter-round-1`
- [Nit] skills/super-design/SKILL.md:293-296; skills/super-design/SKILL.md:293; skills/super-design/key-abstractions-prompt.md:119 — out of scope (filtered): template-wording improvement — `scopeFilter-round-1`
- [Nit] skills/super-design/promotion-reviewer-prompt.md:63 — out of scope (filtered): extra hardening (the reviewer's input contract should name `owns:` lines) — `scopeFilter-round-1`
- [Nit] skills/super-design/SKILL.md:306 — out of scope (filtered): owner-bead entry has no splice markers — `scopeFilter-round-1`
- [Nit] skills/super-design/SKILL.md:452 — out of scope (filtered): no-beads design-pending marker — `scopeFilter-round-1` (fbb1893 may have covered it under its cluster rule; round 2 still lists it as punch-listed open)
- [Nit] skills/super-design/SKILL.md:424 — a handed-in root epic has no stated first sync — roast-pr-2 (converged; punch list)
- [Nit] tests/super-design/key-abstractions-eval/rubric.md:17 — C1 cannot fully grade an extend-only one-liner — roast-pr-2 (converged; punch list)
- Not roast-reviewed: 92e38a7 (eval results, `skills/super-design/MAINTENANCE.md`, TODO status), landed after the code-roast loop; documentation only — git log
- Follow-up scope: a replay eval on a real project (the motivating case) — spec §Out of scope; eval §Before vs after
- Not exercised by any test: the mode flows, re-entry, digest placement and the owner-bead rules (spec §5) — spec, final review

## Gotchas & surprises

- Design roast round 1 → step-back redesign, applied with the human's approval: the specs' sections became the single source with one sync regenerating every copy (dissolved 4 findings) — `stepBackDesign-round-1`, roast-design-1-step-back
- Design roast escalation (crash between spec commit and the step) settled by the human: re-entry runs a skipped step — `run.md` approvals
- The root integration sweep (super-plan-998.7) could not complete: a verification-only bead has no commit, super-code filed blocker super-plan-zvd; the orchestrator closed both and relied on the phase-6 sweep — `run.md` parked, friction.md
- The eval's before arm already named the backend abstraction on (a) in 3 of 3 reps, so this fixture does not show the step catching a missed abstraction — key-abstractions-eval.md
- Profile (code phase): graph-bound, critical path 26m of which 15m planning; bottleneck super-plan-998.6, 5m; largest what-if (a model estimate): cutting super-plan-998.4 <- super-plan-998.3 → −3m — profile-wf_b0490192-1ca.md
- Profile (fix round): bead-bound, super-plan-998.8 set the pace — profile-wf_e589716d-a1a.md
- The fix-round re-entry returned root-closed although the root epic's acceptance (eval, sweep) was still owed — friction.md

## Entrypoints

1. `skills/super-design/SKILL.md` §The Process step 2 and §Key Abstractions — the step, its sync and precedence — diff
2. `skills/super-design/key-abstractions-prompt.md` — the designer's questions, rules and output contract — diff
3. `skills/super-design/design-distillate.md` — the reference the designer reads — diff
4. `skills/super-design/SKILL.md` §Decomposition (owner beads, digest) and `promotion-reviewer-prompt.md` — how the section reaches the beads — diff
5. `skills/super-roast/SKILL.md` (stated intent input) and `skills/super-auto/SKILL.md` phase 4/5 rows — how it reaches the code roast — diff
6. `tests/super-design/key-abstractions-eval/` and [key-abstractions-eval.md](key-abstractions-eval.md) — the evidence — diff

## Smells

- super-plan-998.7 closed by hand without a commit; the sweep it owned ran in phase 6 instead — the smell: the tracker's "integration sweep done" rests on the orchestrator, not the coordinator — `run.md` parked
- Implementer reports across four tasks gave suite verdicts without command output — the smell: per-task test evidence is thin; the phase-6 sweep is the only real measurement — final review (ledger triage)
- No task needed a fix pass and nothing was parked by a reviewer — ledger Metrics
