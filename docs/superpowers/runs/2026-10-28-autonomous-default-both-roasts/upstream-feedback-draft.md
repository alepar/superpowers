# 2026-10-28-autonomous-default-both-roasts: review provenance is computed over base history, so unrelated archive gaps make every later review "provenance unavailable"

Plugin: 6.4.2-alepar6.6. Run: 2 beads (1 implementation + 1 fix-loop bead), 1 design roast round, 2 code roast rounds, 2 coordinator invocations (21m and 22m wall), 2026-10-28.

## Defects

### 1. Whole-range review provenance is computed over base history, not the run's own range
- **Evidence:** both code-roast assemblies (r1 at ed7eb8d4, r2 at ca849334, base 444f86b2) returned `review input selection: provenance unavailable; captured source available` with "2115 gaps, all missing captured files of archived invocation inv-mvc60k41-xt8p35rk04d" in an earlier run's directory on base (2026-10-16-workflow-reliability, run.md:87). Both coordinator final reviews read `not ready (unreviewed: whole-epic coverage and omission provenance remain incomplete)`. The run therefore had only bounded direct reviews, none of which can count toward root acceptance.
- **Premise to verify:** `dispatch-text review-inputs` walks every archived `review-collection` record reachable in the captured tree, including invocations committed before `base`. Those invocations don't contribute to `git diff base...head`.
- **Suggested fix shape:** limit provenance gaps to invocations whose collection records were added in base..head. Report base-history gaps once as an informational line that does not block readiness.

### 2. The ledger-check metric uses all history and flags earlier epics' beads as "git-only"
- **Evidence:** both invocations' `Metrics: ledger-check` line lists about 75 git-only ids from earlier epics (super-plan-998.*, -goq.*, -ufz.*) plus `gaps: ledger/Git identities differ`. Each final review then carried that as an Untested-scope item the run had to route.
- **Premise to verify:** the git-only set comes from bead ids in commit trailers across all reachable history.
- **Suggested fix shape:** compute git-only and ledger-only over base..head, or over the epic's own bead ids.

### 3. `[review readiness incomplete]` and `[low coverage]` are attached whenever no readiness basis is passed, design mode included
- **Evidence:** all three roasts show `review readiness: coverage unknown, provenance unknown — basis: ""` beside full stage coverage (design r1: scouts 8/8, judge completion 100%; pr r1: 10/10, 100%; pr r2: 14/14, zero candidates). Design mode has no basis to supply. On pr r2, a round ≥ 2 with zero findings of any severity could not be marked `[converged]`, and the loop exit had to be recorded as `operator-skipped`.
- **Premise to verify:** a readiness basis applies only to PR-mode source provenance.
- **Suggested fix shape:** treat readiness as not applicable in design mode, and keep `[low coverage]` for real stage shortfalls. Decide separately whether a bounded direct review with a declared inspected-path basis can support convergence.

### 4. The roast reporter can emit a report its own extractor rejects
- **Evidence:** `report-verdict --complete` on design r1 failed with "finding text without a list marker in Unverified nits (spot-checked)". The reporter had written an unbulleted prose line under that heading. The round's source extraction was left as a coverage gap.
- **Premise to verify:** nothing in the roast engine runs `report-verdict --complete` before the report is returned.
- **Suggested fix shape:** validate the report with the extractor inside the engine and re-dispatch the reporter once on failure, or have the extractor accept prose lines in section preambles.

### 5. "none this iteration" placeholder bullets are extracted as findings
- **Evidence:** pr r2 wrote `- none this iteration. …` under `## Rejected` and `## Unverified nits`. `report-verdict --complete` extracted both as occurrences, and the outstanding projection counted them until they were rejected by hand.
- **Premise to verify:** the extractor treats every bullet as an occurrence and recognizes only the exact `- none` form as empty.
- **Suggested fix shape:** have the reporter write a bare `- none`, or have the extractor recognize a leading `none` as the empty marker.

### 6. Two helpers disagree on punch-list key format
- **Evidence:** `scope-dispositions --project --keys` emitted final-review prose keys alongside `[SEV] <location>` roast keys. `super-roast assemble-args --punch-listed` exited with "not a sub-Blocking `[SEV] <location>` key". SKILL.md phase 4 pipes the first into the second, and the run had to filter the input by hand.
- **Premise to verify:** the punch-list contract covers both final-review and roast keys, but assemble-args only knows the roast form.
- **Suggested fix shape:** add a roast-only filter to `--keys`, or have assemble-args skip and count non-`[SEV]` lines.

### 7. The profiler's "longest command" label shows the first line of a compound command
- **Evidence:** `longest: "mkdir -p $TMPDIR" 2m`, and `"python3 - <<'EOF'" 2m`, in windows where the time went to test runs (`test 6m` of a 9m implement).
- **Premise to verify:** the label takes line one of a multi-line command.
- **Suggested fix shape:** label by the slowest recognized sub-command (a test path when one is present).

## Run metrics
### Judge panel
- design r1 · same-family (Claude) seat-differentiated · rung: Workflow · seat-agreement: panels 14 · rr 0.86 · rg 0.71 · fg 0.57 · unanimous 0.57 · ground-loo 0.67 (n=12)
- pr r1 · same-family (Claude) seat-differentiated · rung: Workflow · seat-agreement: panels 9 · rr 0.78 · rg 0.67 · fg 0.67 · unanimous 0.56 · ground-loo 0.71 (n=7)
- pr r2 · same-family (Claude) seat-differentiated · rung: Workflow · seat-agreement: none (no panels; 0 candidates)
### Fix loop
- Invocation 1: `Metrics: completions — review clean 1 · after fix pass 0 · parked 0`; `fix-pass — entered 0 · FIXED 0 · BLOCKED 0`
- Invocation 2: `Metrics: completions — review clean 2 · after fix pass 0 · parked 0`; `fix-pass — entered 0 · FIXED 0 · BLOCKED 0`
- Outstanding projection (scope-dispositions): 4 sources, 20 outstanding groups, all deferred with owners, 0 gaps
### Merge-back
- `Metrics: merges 2 · merge-failed 0 · rebase-conflicts 0 · seam-reviews 0 · check-fails 0`; landed: super-plan-z1k.1, super-plan-z1k.2; ledger-only none; completed-only none; git-only: earlier epics' ids (defect 2)
### Coverage
- coverage round 1: requirements 8 · mapped 8 · unmapped 0; round 2 ran (5 findings, 3 rejected on evidence, `widening: yes`)
- scope-filter round 1: 2 in-scope · 0 punch-listed
### Timing
- Invocation 1: wall 21m (task graph 12m, after the last landing 9m) · bound: model 12m vs actual 12m (99%) · critical path 12m = implement 7m · planning 2m · startup 2m · bottleneck super-plan-z1k.1 implement 7m (test 4m, poll 3m) · what-if: faster z1k.1 → 8m (estimate) · context: coordinator 327K/1000K, 0 compactions
- Invocation 2: wall 22m (task graph 13m, after the last landing 9m) · bound: model 13m vs actual 13m (99%) · bottleneck super-plan-z1k.2 implement 9m (test 6m) · context: coordinator 402K/1000K, 0 compactions

### Bead graph
| id | type | title | what (first sentence of description) |
| --- | --- | --- | --- |
| super-plan-z1k | epic | super-auto: autonomous by default, both roasts on | Root epic for the run. |
| super-plan-z1k.1 | task | super-auto defaults: autonomous on, both roasts on, explicit opt-outs | Implement the spec in the super-auto runtime text and entry points. |
| super-plan-z1k.2 | task | Fix: S7 recorded planOneShot value; lint pins autonomous default and opt-outs; stale wording | Fix-loop bead for two code-roast Nits and two final-review wording items. |

| dependent | blocker | reason (from `blocked-by` line, or `unstated`) |
| --- | --- | --- |
| none | none | none |

## Design questions
### Context-window sources disagree
Preflight resolved every role to 200K (`Context: claude · planner=200K/167K …` with "set …[1m]" warnings), and the coordinator launch passed `contextWindows` of 200000. The profiler's model table lists claude-opus-5-5 and claude-sonnet-5-5 at 1000K and measured the coordinator at 402K/1000K. One of them is wrong for dispatched subagents. If subagents really have 200K, the profiler's per-role percentages mislead. If they have 1M, the preflight warnings are false and 167K budgets over-split work. If upstream decides otherwise, please state the position explicitly so downstream can reconcile against words rather than silence.

## Doc gaps
- A Workflow engine script assembled into a session scratchpad is lost when the session ends. Resuming with `resumeFromRunId` then means regenerating a byte-identical script. Recording the script path and hash in the run directory beside the Workflow run id, and pointing resume guidance at it, would make that durable.

## Already fixed — do not re-litigate
none

## Not established
- Single-run observations; no other run's assembler output was compared, so whether every run on this base hits the same 2115 gaps is inferred from the mechanism, not measured.
- By default: the coordinator's ledger-append path is fire-and-forget and can lose a line without the coordinator noticing, so every ledger-derived count above is a lower bound; `Metrics: ledger-check` is the one cross-check.
- Task-review findings are absent from the outstanding projection, which retained only roast and final-review sources.
- Detector, Slowness and Edge lines: none in the ledger (a two-bead run with no edges).

## Verification bar
- Re-run `dispatch-text assemble --consumer roast-code` on a branch cut from a base whose history contains an incomplete archived bundle. It should report selection available, with the base-history gaps reported as informational.
- `report-verdict --complete` over a reporter-produced report with a preamble line and a `none this iteration` section should extract cleanly with zero placeholder occurrences.
- Pipe `scope-dispositions --project --keys` straight into `assemble-args --punch-listed` for a run that has both final-review and roast punch items.
