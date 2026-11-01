# Final review (bounded) — epic super-plan-z1k, super-auto/autonomous-default-both-roasts

Range: 444f86b266b2208b612e0e91b0f54762576ff95a..d9e65f79003883c35e0983ac475d96154adbf9ed (both verified as commits). Bounded route: review-inputs.json is status:unavailable, sourceAvailable:true, wholeRangeReady:false, 42 selected, 0 omitted, 2115 gaps (all historical payloads of archived invocation inv-mvc60k41-xt8p35rk04d under docs/superpowers/runs/2026-10-16-workflow-reliability/). No whole-range package was built. Captured Git was read directly; a review-owned detached worktree at d9e65f79 was used only to run tests.

## Scope inspected

Every product hunk in the range was inspected: README.md (3 hunks), skills/super-auto/SKILL.md (4 hunks), skills/super-auto/run-state.md, skills/super-auto/MAINTENANCE.md, tests/super-auto/test-contract-lint.sh (3 hunks), docs/superpowers/specs/2026-07-31-super-auto-design.md, docs/superpowers/specs/INDEX.md. Of the run artifacts, the design spec, the code roast r1 report and punch list, and probes/after-summary.md were read in full. The remaining run-dir artifacts (design roast reports, coverage rounds, ledgers, profile JSON/MD, the archived inv-8369280e bounded review bundle including its 9193-line review-inputs.json and 2120-line provenance file, run.md, friction.md, before-summary.md, probe.md) were not inspected hunk by hunk.

## Step 1 — own view against the spec

- Spec decisions all land: §Inputs gains a Default column (`autonomous` `true`, the rest `false`), the batched launch question is gone, unstated flags take defaults without asking, the plain-word opt-out sentence matches the spec's mapping including the "ask me only about X" reserved-topic carve-out, the `autonomous` row names I5, the confirmation text moved into the first status note, run-state.md item 1 says a resume reads the recorded `flags:` line and never re-applies defaults, the description/opening paragraph/README entry points say autonomous by default, MAINTENANCE.md records the change, and the 2026-07-31 spec gets a dated Post-Implementation Note.
- Code roast r1's two confirmed Nits were closed by super-plan-z1k.2: the contradiction sentence now fixes the recorded value (`planOneShot=true, autonomous=true`) and test-contract-lint.sh's new check_flag_defaults pins all four defaults, the opt-out phrases and the contradiction rule, with a mutation case flipping the `autonomous` default. The stale "the user, who already answered here" clause in the `skip plan roast` row is replaced.
- Cross-task seams: z1k.1 (behavior change) and z1k.2 (fix bead) touch the same §Inputs paragraph; the merged text at d9e65f79 is coherent, the lint keys match the merged sentence verbatim (lint passes), and §Autonomous mode's stop list (stops 3 and 4 keyed on "planOneShot without autonomous") still agrees with the new mapping. No stale "batched question", "each defaults to false" or "optionally unattended" wording remains in skills/ or README.md (grep at head); the only hit is the historical plan docs/superpowers/plans/2026-07-31-super-auto.md, which the spec says is not rewritten.
- Residual wording drift outside the epic's owned hunks: skills/super-design/SKILL.md:684 still justifies the pre-decided roast offer with "the caller's user already answered it once", which is not literally true for a defaulted run. Behavior is unaffected (the resolved flag is passed); the bead's constraint limits this epic to default-mode hunks in skills/super-auto.
- MAINTENANCE.md's bullet says "a design-review stop sets `autonomous=false`" without the contradiction exception; SKILL.md is the canonical home and states it, so this is a summary simplification, not a conflict.
- docs/superpowers/specs/INDEX.md's new row is `draft`; per INDEX convention finishing-a-development-branch flips it, so not a defect on this unmerged branch.
- Tests run here at d9e65f79: `bash tests/super-auto/test-contract-lint.sh` (All super-auto contract lint tests passed) and `bash tests/super-auto/test-scripts.sh` (All super-auto script tests passed). The caller-deferred full-suite sweep has not run: no full-suite measurement of this branch exists.

## Step 2 — ledger triage

- Task 1 minor (deferred) [missing-evidence]: task report gave test results without verbatim commands/output. Process evidence only; both suites were re-run green in this review. Deferred OK.
- Task 2 minor (deferred) [no-red-run]: lint check and fix landed in one commit with no recorded failing run. The mutation case in the lint suite demonstrates the check catches a flipped default. Deferred OK.
- No parked completions, parked findings, Recurring lines or BLOCKED-AUTH lines in the ledger.
- Metrics: ledger-check ok, but the identity scope lists many git-only beads from earlier epics (super-plan-998.*, goq.*, ufz.*); ledger and Git identities differ, so ledger absence is not read as clean for those.

## Verdict
ready

## Must fix before landing
- none

## Untested scope
- Caller-deferred full-suite sweep: no full-suite measurement of d9e65f79 exists; only tests/super-auto/test-contract-lint.sh and tests/super-auto/test-scripts.sh were run by this review (both pass).
- Whole-range review incomplete: bounded review of captured Git only; review-inputs.json status unavailable with 2115 provenance gaps (missing captured payloads of archived invocation inv-mvc60k41-xt8p35rk04d under docs/superpowers/runs/2026-10-16-workflow-reliability/).
- Run-dir artifacts not inspected hunk by hunk: design roast reports and keys, coverage rounds and ledger, findings ledgers, profile JSON/MD, run.md, friction.md, probes/before-summary.md, probes/probe.md, roast-pr-1 keys/scope files, and the archived inv-8369280e bounded review bundle.
- Behavioral probes ran against b4c1fb9e (before z1k.2 fixed the contradiction's recorded planOneShot value); no probe session ran against d9e65f79, and the probes are subagent micro-tests, not drill evals of live runs.
- Integration with the parallel readiness/continuity branch editing skills/super-auto is not visible here; the epic's hand-back item (re-run super-plan-z1k.1's sweep grep on the integrated result) is still owed by the main coordinator.
- Ledger/Git identity gap: Metrics git-only lists beads of earlier epics (super-plan-998.*, super-plan-goq.*, super-plan-ufz.*), not reconciled here.

## Deferred OK
- skills/super-design/SKILL.md:684 "the caller's user already answered it once" is stale wording for a defaulted run; behavior unaffected and outside this epic's owned hunks.
- skills/super-auto/MAINTENANCE.md bullet omits the autonomous+design-review-stop contradiction exception; SKILL.md §Inputs is canonical and correct.
- docs/superpowers/specs/INDEX.md new row status `draft`; flipped to implemented by finishing-a-development-branch per INDEX convention.
- Ledger minor [missing-evidence] (task 1): test results recorded without verbatim commands; suites re-run green here.
- Ledger minor [no-red-run] (task 2): no recorded red run before the lint fix; the mutation case covers the flipped default.
- Code roast r1 rejected FYIs (no launch-time checkpoint, closed opt-out phrase list, model-initiated entry without disable-model-invocation) are spec-mandated by the literal request; model-initiated entry remains a human follow-up decision, not a regression.
