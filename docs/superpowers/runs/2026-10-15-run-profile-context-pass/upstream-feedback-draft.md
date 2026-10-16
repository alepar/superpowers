# 2026-10-15-run-profile-context-pass: base-branch regressions can't reach the fix loop; planning dominates small trees and run-profile doesn't see it

Draft parked by super-auto's finish hook (autonomous run). Target repo: alepar/superpowers. Not filed. Plugin 6.4.2-alepar5.2.

## Defects

### 1. run-profile counts no planning wait, and its bound line points at the graph when planning was the bigger lever
- Evidence: fqb.2's only blocker landed at +13m, but fqb.2 dispatched at +30m, waiting on `plan-rest`. Its wait column reads `-`, and `Profile: waits — 0s over 0 of 5 landed beads`. `Profile: bound — … graph-bound … reshaping it is the lever` while `critical path — 52m = … planning 29m`. No what-if line models planning. The slowness detector armed only an edge audit.
- Fix shape: classify "blockers usable → start" waits caused by a missing mapping row as `wait (planning)`; when planning is the largest share of the critical path, name it in `bound` and emit a planning what-if.

### 2. The run-profile `shape` line on a re-entry counts beads planned by earlier invocations
- Evidence: invocation 2 reported `beads dispatched 3, landed 3, planned 8` and `shape — 8 beads · 0 edges · depth 1 · width 8`. Invocation 3 reported `planned 9 · shape — 9 beads · 0 edges`. Invocation 1 had reported `5 beads · 7 edges · depth 4` for the same first five beads.
- Fix shape: compute `shape` over the beads this invocation dispatched, or label the line as cumulative.

### 3. super-roast's rung records inflate super-auto's friction count
- Evidence: friction.md holds 3 `- [` lines; two are `super-roast … · rung: Workflow` records (super-roast SKILL.md: "append that rung to the run's friction log"). run.md then reads `friction: 3 events`, counted from those `- [` lines (super-auto SKILL.md §Phase 6 step 4).
- Fix shape: log the rung only when it fell back from Workflow, or use a line format the count skips.

## Run metrics

### Judge panel
- design 1: same-family (Claude), rung Workflow · seat-agreement: panels 34 · rr 0.79 · rg 0.68 · fg 0.47 · unanimous 0.47
- design 2: same-family · panels 8 · rr 0.75 · rg 1.00 · fg 0.75 · [converged]
- PR 1: same-family · panels 11 · rr 0.82 · rg 0.82 · fg 0.82 · unanimous 0.73
- PR 2: no panels (empty late round, [converged])
- PR post-cap audit: panels 1 · unanimous 1.00

### Fix loop
- Metrics: completions — review clean 9 · after fix pass 0 · parked 0 (cumulative at the last invocation) · fix-pass entered 0

### Merge-back
- Metrics: merges 9 total across 3 invocations · merge-failed 0 · rebase-conflicts 0 · check-fails 0; git: 10 merge commits = 9 `Merge:` lines + 1 base merge

### Coverage
- coverage round 1: requirements 11 · mapped 11 · unmapped 0; round 2 widened (11 → 12 findings, 83% novel)
- code fix round 1: scope-filter 3 in-scope · 2 punch-listed

### Timing
- invocation 1: wall 57m, task graph 52m · bound: graph-bound (chain fqb.2 → fqb.4 → fqb.5) · critical path planning 29m, implement 21m · bottleneck fqb.4 10m
- invocation 2: task graph 18m · bead-bound (fqb.9) · critical path planning 13m of 18m
- invocation 3: critical path planning 4m of 6m

### Bead graph
- 9 work beads (5 designed + 4 fix), depth 4 in the design tree, 7 edges; all edges carry `blocked-by` reasons.

## Design questions

### A. Should a bead whose blockers have landed be planned on demand rather than wait for whole-tree `plan-rest`?
- For: here it would have saved about 17m of 52m. The coordinator already refills planning when `plan-rest` is null.
- Against: more planner dispatches and more concurrent appends to one plan file; the whole-tree mapping supplies the `deps`/`opaque` facts that mid-round readiness uses.
If upstream decides otherwise, please state the position explicitly so downstream can stop re-raising it.

### B. Should a fix-loop re-entry skip the planner, or plan at the mechanical tier, when every ready bead is a template-filed fix bead?
- For: planning was 72% and 67% of the two re-entries' critical paths, while their implementations totalled about 5m and 1m.
- Against: the planner also produces the file and dependency mapping behind hot-file deferral and readiness, and a fix bead can be underspecified.
If upstream decides otherwise, please state the position explicitly so downstream can stop re-raising it.

## Doc gaps

### The scope filter has no clause for regressions against `base`
- A finding showing the change breaks or loses behavior that works on `base` is punch-listed unless the goal names that behavior. Here a memory regression (3.70GB vs 2.01GB on main; OOM loses every `Profile:` line, including the timing lines main prints today) was punch-listed in round 1 ("the goal names no memory requirement"). The final review regraded it as data loss after the loop, when the rules route everything to the punch list, so it shipped open.
- Fix shape: add an in-scope clause to scope-filter-prompt.md and to §Final-review items' fix-round test: a change that breaks or loses behavior that works on `base` is in scope whatever the goal says.

## Already fixed — do not re-litigate
- none

## Not established
- The 17m planning saving is read off timestamps; no re-run measured it.
- The analyst ran on opus. Dropped as single-run or repo-specific: a slow contract-lint suite, the yagni lane's yield, and the bounded final-review fix round shipping a regression the post-cap audit caught (it is by design).

## Verification bar
- run-profile defects: fixture tests in tests/super-code/test-run-profile.sh (a planning-gated wait; a re-entry invocation's shape), then `run-profile --workflow` on a real multi-invocation run.
- Design questions: a replay of the coordinator harness with timing, or a live epic comparing critical paths.
