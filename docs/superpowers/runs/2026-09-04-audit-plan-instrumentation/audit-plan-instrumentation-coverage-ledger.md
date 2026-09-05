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

## Round 2

Divergence observation: round 1 deduped 12 → round 2 deduped 4 (all novel identities, all reviewer-marked low confidence). Count shrank by two-thirds: converging, not widening.

- CR2-01 · GAP · .8 names no source for dependency edges in the graph table (1/3) — **verified** partially: `bd list --json` does return a `dependencies` array (this run's own coverage dumps used it), but .8's text did not say so; **applied**: .8 states edges come from the dump's `dependencies` array and reasons from `blocked-by` lines.
- CR2-02 · UNOWNED-SEAM · .5's "parked-draft path" has no named owner (1/3) — **verified** pre-existing: upstream-feedback SKILL.md step 5 parks the draft in the run's friction-log directory; **applied**: .5 qualifies it and adds the `metrics: none` fallback.
- CR2-03 · UNSATISFIABLE-ACCEPTANCE prose · .2 description edits the Pragmatism filter while its acceptance forbids changes to it (1/3) — **verified**; **applied**: .2 acceptance restated (Scope unchanged; Pragmatism gains exactly one sentence).
- CR2-04 · UNOWNED-SEAM · fix-loop line keyed by SDD task ordinal N, Merge: line by bead id, no stated correspondence (1/3) — **verified**; **applied**: .10 `owns:` states N is the SDD ordinal already paired with the bead id by the ledger's completion lines; .4 `consumes:` states the two aggregations need no join.
- Check 9: all five round-1 amendments confirmed to close their findings by 3/3 reviewers; introduced items are CR2-02 and CR2-04 above, both applied.

Round 2 summary: 4 deduped · 4 applied · 0 rejected. Loop ends (fixed two rounds; round-2 fixes are not re-reviewed). Root Integration sweep created next, depending on every leaf, carrying CR1-04.

## Design roast round 1 — fixes applied (report: 2026-09-04-audit-plan-instrumentation-roast-design-1.md)

Verdict: Blocking (8 confirmed) [panel-capped: 18 unverified]. Autonomous run: the raised-panelCap re-roast was answered no and parked in run.md as a degraded-verdict record. Escalations: none. All eight confirmed findings map onto existing beads' scope, so the fix rung is inline (spec + bead descriptions); no fix beads created.

- RD1-01 Blocking · §5 default pathspecs never match top-level tests/ — **applied**: new defaults with non-`**/` alternates, bare `**/test*` dropped, fixture-repo assertion added (spec §5, bead .9).
- RD1-02 Should-fix · §8 three reviewers number their own R-lists — **applied**: orchestrator writes the canonical list once, reviewers map by id, `R-new` proposal rule (spec §8, bead .6).
- RD1-03 Should-fix · §1 ground-alone parity is a function of rr/rg/fg — **applied**: replaced by leave-one-out `ground-loo (n=…)` (spec §1, bead .1).
- RD1-04 Should-fix · §4 resumed tasks duplicate fix-round lines — **applied**: parser groups by (bead id, round), keeps last (spec §4, bead .4).
- RD1-05 Should-fix · §3 Merge: line only on success path — **applied**: failure-path line with ` → blocker`, second stub key (spec §3, beads .3, .4).
- RD1-06 Nit · §1 raw agreement without marginals — **applied**: per-seat C/R/U counts on the line (spec §1, bead .1).
- RD1-07 Nit · §1 votes[] positional convention undocumented — **applied**: reporter packet-contract states it (spec §1, bead .1).
- RD1-08 Nit · ledger-append lossiness unstated — **applied**: Error handling caveat + `Metrics: ledger-check` line (spec §4, §Error handling, beads .4, .8).

Applied opportunistically from the 18 unjudged (beyond panel cap) candidates, where plainly true and touching a section already being amended — recorded as applied-unverified, the qualifier itself stays parked: fix-round line uses the coordinator's shape with bead id (LEDGER_LINE_RE); Metrics block is four single-line appends; breaker-tripped/entered sources stated and `K` dropped; every reviewing dispatch (incl. re-reviews) computes its own Test changes block, command-stated, size-capped, post-rebase range for seam review, empty testPaths rejected; `metrics:` pointer written as pending then rewritten after upstream-feedback; scopeFilter key = `[SEV] <location>` prefix, demotion rate on a `scope-filter:` line; `bd list --limit 0`; independence in the Judge panel subsection; arithmetic pinned by a known-ledger replay scenario.

Not applied from the unjudged list (left for the re-roast to judge or already disposed): .5/.6/.7 and .3/.9/.10 shared-file edges (coverage CR1-02/03/09 rejected these); .8 producer edges (CR1-05 rejected; the sweep covers drift); acceptance-only tests for prose components (inherent to prompt-file changes; live run is the measurement, stated in §Testing); edge-reason grandfathering (super-auto phase-5 fix beads and blocker beads render `unstated` by design — §10 says so); scrub opt-in (step 7 already shows the body before filing).

Re-roast decision: design decisions changed and a Blocking was resolved → round 2 with the prior report.

## Design roast round 2 — converged exit (report: 2026-09-04-audit-plan-instrumentation-roast-design-2.md)

Verdict: Should-fix (8 confirmed) [converged]. delta vs prior: 6 new (0 Blocking) · 0 carried · 6 resolved · 2 regressed (0 Blocking). 8 lenses (regression added), 33 raw → 11 deduped → 9 panels / 2 spot, judge completion 100%, no panel cap hit, escalations none. Converged exit fires (zero Blocking of any provenance on a non-degraded round ≥ 2): loop ends, no round 3. The 8 confirmed sub-Blocking findings are the punch list; every one is a text-consistency defect the round-1 fixes introduced or left, so they were applied inline (spec + bead descriptions) rather than filed as tasks — no re-roast, per the converged rule.

- RD2-01 Should-fix · ledger-check compares a both-paths M against `completed` — **applied**: M = success-path lines only, new `merge-failed Mf` count, fixture expects `ledger-check ok` (§4, .4).
- RD2-02 Should-fix · "three lines" vs "four lines" — **applied**: §4 lead + fence + return field say four; .4 and .11 updated.
- RD2-03 Should-fix · .4 `consumes:` still keyed on ordinal N — **applied**: rewritten to bead-id keying, four lines.
- RD2-04 Should-fix · .11 sweep pins superseded literals — **applied**: literals updated; sweep reads current formats from producers' `owns:` lines at sweep time.
- RD2-05 Should-fix · `scope-filter:` aggregate line has no producer — **applied**: super-auto writes it at the end of each `scopeFilter-round-N` block; .5 owns, .8 consumes (§6, .5, .8).
- RD2-06 Should-fix · per-round dedupe keeps abandoned attempts' later rounds — **applied**: dedupe by series (drop lines before the bead's last round-1 line); fixture with attempt 1 → r3, attempt 2 → r1 (§4, .4).
- RD2-07 Should-fix (regressed from RD1-01) · root-level test files still unmatched — **applied**: bare-filename alternates; root-level `main_test.go` in the fixture (§5, .9).
- RD2-08 Nit · canonical R-list not persisted across rounds/resume — **applied**: orchestrator writes the R-list into `coverage-round-<N>`, reads it back (§8, .6).

Prior findings status: RD1-01 resolved then regressed (root-level residue, fixed above); RD1-02..08 resolved; RD1-04 regressed (per-round vs per-series, fixed above).
