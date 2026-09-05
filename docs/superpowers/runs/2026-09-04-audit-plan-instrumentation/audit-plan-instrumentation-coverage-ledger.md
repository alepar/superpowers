# Coverage ledger — 2026-09-04-audit-plan-instrumentation

Root pass, 3 reviewers (opus), union then verify then dispose. All dispositions auto (autonomous run).

## Round 1

- CR1-01 · flag-sweep · super-plan-qfy.4 sp:demoted-by-session (3/3 reviewers) — **accepted, demotion stands**: reviewer's uncertainty (fix-round lines absent) removed by spec §4 amendment + super-plan-qfy.10; splitting the `metrics` return field off falls below the sizing floor (one field + one assertion).
- CR1-02 · UNOWNED-SEAM · .5/.6 both edit run-state.md item 7 (3/3) — **rejected**: shared file, not a dataflow boundary; each field's owner is explicit (.5 owns scopeFilter record, .6 owns requirements field); execution's hot-file cap + rebase-then-gate handle the textual merge; an edge would name no consumed artifact.
- CR1-03 · UNOWNED-SEAM · .6/.7 both edit coverage-reviewer-prompt.md and super-design SKILL.md (1/3) — **rejected**: same reasoning as CR1-02; .6 inserts a step, .7 edits a different step.
- CR1-04 · GAP · no task checks producer line formats against upstream-feedback's rendering (3/3) — **accepted, satisfied by the root Integration sweep** created at loop end; its description names the five format strings (seat-agreement, Merge:, Metrics:, requirements:, blocked-by) and requires token-for-token agreement between producer files and report-template.md/analyst-prompt.md.
- CR1-05 · UNSATISFIABLE-ACCEPTANCE unwired · .8 consumes five sibling-owned formats with no edges (1/3) — **rejected**: formats are spec-defined (§1, §3, §4, §8, §9) and .8 reads them from the spec; edges would serialize .8 behind five tasks for no artifact it lacks; drift is the sweep's job (CR1-04).
- CR1-06 · GAP · .8 acceptance lacks the `none` / Not-established / standalone-super-design rule (2/3) — **applied**: .8 acceptance amended.
- CR1-07 · GAP · .9 files omit tests/super-code/replay-harness.mjs (2/3) — **applied**: .9 files amended.
- CR1-08 · UNOWNED-SEAM/GAP · .5's `metrics:` line reads run.md `feedback:` which no task owns (2/3) + INSUFFICIENT-INPUT asking the caller to verify the field exists — **verified**: `feedback:` is run-state.md's pre-existing optional eighth field; **applied**: .5 gains a `consumes:` line naming it as pre-existing; new-leaf branch rejected.
- CR1-09 · UNOWNED-SEAM · .3/.4/.9/.10 share coordinator-workflow.md and the replay harness with .9 unordered (2/3) — **rejected**: shared file, not a dataflow boundary; four declarers vs hot-file cap 3 yields one deferral at most; .4 is already ordered by its real artifacts.
- CR1-10 · GAP · .7 acceptance is grep-only; sweep/seam fixed tokens never exercised (1/3) — **applied**: .7 acceptance requires a worked example over all four edge kinds with both fixed tokens.
- CR1-11 · GAP · .5 resume-replay of scopeFilter record not in acceptance (1/3) — **applied**: .5 acceptance amended.
- CR1-12 · GAP · .10 leaves the SDD "trailing fix round = mid-loop" divergence unstated (1/3) — **applied**: .10 acceptance requires the explicit statement in coordinator-workflow.md.

Round 1 summary: 12 deduped findings · 6 applied · 2 accepted without tree change (CR1-01, CR1-04 → sweep) · 4 rejected. Tree changed (5 descriptions amended) → round 2 runs.
