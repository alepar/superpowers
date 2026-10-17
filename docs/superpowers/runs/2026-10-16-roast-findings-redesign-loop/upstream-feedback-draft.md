# 2026-10-16-roast-findings-redesign-loop: context-preflight reports 1M Claude models as 200K, forcing needless final-review cluster splits

Plugin: 6.4.2-alepar6.0. Run: 38 beads under one root epic (27 work beads landed across 3 super-code invocations), design roast 2 rounds, code roast 2 rounds + post-cap audit, ~2026-10-16/17.

## Defects

### 1. super-code/scripts/context-preflight marks native-1M Claude models as 200K
- **Evidence:** run.md `context: claude · planner=200K/167K · … finalReview=200K/167K · … · warn: planner, finalReview on a 200K model`; the same skill's run-profile context pass reports `claude-opus-5-5 1000K, claude-sonnet-5-5 1000K` and `coordinator 643K/1000K (64%)` (643K cannot fit in 200K). Ledger: `Final review: split (inputs 113K > 40% of 200K) · clusters 8`, `(inputs 189K …) · clusters 10`, `(inputs 225K …) · clusters 29` — all would be single reviews at 1000K (threshold 400K). Final-review agents per invocation 9, 10, 30; time after the last landing 10m, 14m, 29m (the third longer than its 23m task graph). Cause: `read_claude` resolves an alias with no `[1m]` suffix, or a concrete id, to `win=200000` (context-preflight ~lines 143–150) while context-pass.mjs (~lines 58–63) maps claude-opus-5 / claude-sonnet-5 / fable to 1M.
- **Premise to verify:** a bare `opus`/`sonnet` alias (and env-pinned ids) resolve to 1M-native models on current harnesses, and the preflight can see the resolved id.
- **Suggested fix shape:** one shared model→window table used by both context-preflight and context-pass; warn only when the resolved model really is 200K.

### 2. super-auto/scripts/scope-dispositions ignores final-review members of a step-back cluster
- **Evidence:** run.md records `cluster dropped: c3-resume-redesign-replay`, `c7-contract-pinning`, `c8-amend-check-content-guards`, while the same round filed cluster beads for c3/c7/c8 from their final-review Must-fix members (`fixLoop-round-1: filed …`). c3's members were one final-review Must-fix plus two roast Nits; only the Nits are in the scope keys file, so they were punch-listed instead of pulled in with the cluster. SKILL.md §Final-review items puts final-review keys into the step-back keys file, but §Step 2 feeds scope-dispositions only the roast keys.
- **Premise to verify:** final-review Must-fix items are always in-scope in the round they feed (§Final-review items routes them to fix beads), and cluster pull-in is meant to cover them.
- **Suggested fix shape:** pass final-review keys to scope-dispositions as always-in-scope members (e.g. `--final-review KEYS`), count them for pull-in and `cluster dropped`, add a fixture.

### 3. super-roast PR-mode agents can write scratch files into the integration worktree
- **Evidence:** friction.md: `[skill-defect] … super-roast PR round 1: a judge/scout reproduction wrote scratch files (f1.txt, f2.txt, l.md) into the integration worktree root …; they would have held every later merge (integration-blocked). Removed by hand` (a fourth, l2.md, followed). super-roast-workflow.md says roast writes nothing to the repo, but judge-seat-prompts.md / scout-prompts-pr.md give no scratch-location rule for reproductions.
- **Premise to verify:** PR-mode seats run with the integration worktree as cwd, and super-code's merge gate refuses a dirty tree.
- **Suggested fix shape:** one rule in every PR-mode scout/seat prompt (scratch under `mktemp -d`, never the repo) plus a post-roast `git status --porcelain` check that fails loudly.

## Run metrics
### Judge panel
- 2026-10-16-roast-findings-redesign-loop-design.md:  ·  · seat-agreement: none
- 2026-10-16-roast-findings-redesign-loop-roast-design-1.md: mode: design        iteration: 1 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 46 · rr 0.65 · rg 0.72 · fg 0.63 · unanimous 0.50 · ground-loo 0.77 (n=30) · reproduce 23/23/0 · refute 17/29/0 · ground 32/14/0
- 2026-10-16-roast-findings-redesign-loop-roast-design-2.md: mode: design        iteration: 2 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 17 · rr 0.59 · rg 0.82 · fg 0.65 · unanimous 0.53 · ground-loo 0.90 (n=10) · reproduce 15/2/0 · refute 8/9/0 · ground 14/3/0
- 2026-10-17-roast-findings-redesign-loop-roast-pr-1.md: mode: pr        iteration: 1 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 23 · rr 0.78 · rg 0.83 · fg 0.78 · unanimous 0.70 · ground-loo 0.89 (n=18) · reproduce 12/11/0 · refute 9/14/0 · ground 14/9/0
- 2026-10-17-roast-findings-redesign-loop-roast-pr-2.md: mode: pr        iteration: 2 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 4 · rr 1.00 · rg 1.00 · fg 1.00 · unanimous 1.00 · ground-loo 1.00 (n=4) · reproduce 4/0/0 · refute 4/0/0 · ground 4/0/0
- 2026-10-17-roast-findings-redesign-loop-roast-pr-post-cap-audit.md: mode: pr        iteration: post-cap audit · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 4 · rr 1.00 · rg 0.75 · fg 0.75 · unanimous 0.75 · ground-loo 0.75 (n=4) · reproduce 3/1/0 · refute 3/1/0 · ground 4/0/0
### Fix loop
Metrics: completions — review clean 10 · after fix pass 1 · parked 0 · re-entry closes 0 · dispatched early 2 · cancelled 0
Metrics: fix-pass — entered 1 · FIXED 1 · BLOCKED 0
Metrics: completions — review clean 19 · after fix pass 1 · parked 0 · re-entry closes 0 · dispatched early 2 · cancelled 0
Metrics: fix-pass — entered 1 · FIXED 1 · BLOCKED 0
Metrics: completions — review clean 26 · after fix pass 1 · parked 0 · re-entry closes 0 · dispatched early 2 · cancelled 0
Metrics: fix-pass — entered 1 · FIXED 1 · BLOCKED 0
### Merge-back
Metrics: merges 11 · merge-failed 0 · rebase-conflicts 0 · seam-reviews 1 (fixed 0) · check-fails 0 (fixed 0)
Metrics: ledger-check ok · append-failed 0 · append-retried 0
Metrics: merges 20 · merge-failed 0 · rebase-conflicts 0 · seam-reviews 2 (fixed 0) · check-fails 0 (fixed 0)
Metrics: ledger-check ok · append-failed 0 · append-retried 0
Metrics: merges 27 · merge-failed 0 · rebase-conflicts 0 · seam-reviews 8 (fixed 0) · check-fails 0 (fixed 0)
Metrics: ledger-check ok · append-failed 0 · append-retried 0
Merge: lines 27 · conflict 0 · seam-review fired 8 · check fail→fixed 0 · → blocker 0
### Coverage
- - coverage-round-1 · canonical R-list: docs/superpowers/runs/2026-10-16-roast-findings-redesign-loop/coverage-round-1-requirements.md (R1–R14) · requirements: 14 · mapped: 12 · unmapped: 3 (R12, R13, R14) · auto: L2 rejected; L3–L6, L8–L13 applied (bead amendments to .1 .2 .4 .6 .7 .8 .10); L7 deferred to integration sweep
- - coverage-round-2 · requirements: 14 · mapped: 13 · unmapped: 1 (R13) · findings: 12 → 14 novel: 11/14 (79%) widening: yes  · auto: L14–L25 applied (sweep super-plan-59b.11 created; bead amendments .1 .2 .4 .5 .6 .7 .8 .10); L26 kept; L27 rejected
- scope-filter: 7 in-scope · 5 punch-listed
### Timing
Profile: super-plan-59b · 1 invocation · 2026-10-17T06:44Z → 2026-10-17T07:37Z · wall 53m (task graph 42m, after the last landing 10m) · agents 94 (timed 94) · beads dispatched 11, landed 11, planned 11
Profile: shape — 11 beads · 11 edges · depth 3 · width 3.7 · beads per level 9/1/1 · widest fan-out super-plan-59b.6 (2 direct, 2 transitive dependents)
Profile: bound — graph lower bound 42m along super-plan-59b.1 → super-plan-59b.11 (unlimited slots and merge lanes) · model of the run 42m (cap 8, one merge lane) vs actual 42m (100%) → graph-bound: the 2-bead dependency chain set the pace — reshaping it is the lever
Profile: critical path — 42m = implement 30m · review 23s · merge 32s · planning 11m · ready 5s · startup 55s · dispatch 13s
Profile: critical chain — bd-ready ready 5s → plan planning 11m → super-plan-59b.1 implement 13m → super-plan-59b.11 implement+review+merge 18m
Profile: bottleneck — super-plan-59b.11 — 18m on the critical path (42%) · implement 17m · review 23s · merge 32s · dispatch 9s · implement on the path 17m: test 4s · git 2s · bd 1s · read 5s · shell 13m · model 4m (longest: "W=/Users/alepar/AleCode/superpowers/.worktrees/roast-findin…" 8m, "W=/Users/alepar/AleCode/superpowers/.worktrees/roast-findin…" 5m) · dependents 0
Profile: waits — ready→start, summed per bead (beads wait at the same time, so not wall time): 1m over 1 of 11 landed beads — unexplained 1m (1)
Profile: early unblock — 2 landed beads had in-run blockers · stacked on an implementation 2 · bounced on a stack conflict then waited for the merge 0 (0s) · waited for a merge without one 0
Profile: tests — implementers and fixers, summed: 22m running tests and 5m polling background runs, 42% of their 1h04m · 0 Bash call(s) ran into the 10-minute tool limit
Profile: slow tests — bash tests/skill-scripts/test-bash-invocation.sh 6m (2 runs, longest 4m) · bash tests/skill-scripts/test-bash-invocation.sh) 4m (1 run, longest 4m) · bash tests/$t.sh 4m (2 runs, longest 2m) · bash tests/super-design/test-findings-ledger.sh 2m (2 runs, longest 2m)
Profile: merge lane — busy 7m of 29m (23%) · seam reviews and fixes 35s (8% of busy) · 12 merge dispatches, first try not merged for 1 of 11 · queue wait 3m total, peak 2 waiting · stack-parent wait 2m
Profile: conflicts — skills/super-design/SKILL.md (stack conflicts 0, seam overlaps 1, declared by 2)
Profile: runtime — peak 10 agents at once of 10 runtime slots · full 1% of the run · slot cap 8
Profile: what-if — faster super-plan-59b.11 → 34m (−8m, 20%) — its implement time halved
Profile: context — agents 95 (measured 95) · peak≥80% 0 · compacted 0 agents, 0 compactions · coordinator 565K/1000K (57%), 0 compactions · max coordinator 57%
Profile: context agent — coordinator peak 565K/1000K (57%) · first 253K · compactions 0
Profile: unmeasured — Claude context windows from the model table: claude-opus-5-5 1000K, claude-sonnet-5-5 1000K
Profile: super-plan-59b · 1 invocation · 2026-10-17T07:57Z → 2026-10-17T08:59Z · wall 1h02m (task graph 48m, after the last landing 14m) · agents 78 (timed 78) · beads dispatched 9, landed 9, planned 20
Profile: shape — 20 beads · 3 edges · depth 2 · width 10 · beads per level 19/1 · widest fan-out super-plan-59b.19 (1 direct, 1 transitive dependents)
Profile: bound — graph lower bound 47m along super-plan-59b.19 → super-plan-59b.27 (unlimited slots and merge lanes) · model of the run 47m (cap 8, one merge lane) vs actual 48m (99%) → graph-bound: the 2-bead dependency chain set the pace — reshaping it is the lever
Profile: critical path — 48m = implement 31m · review 1m · merge 2m · seam 22s · planning 12m · ready 6s · startup 1m · dispatch 24s
Profile: critical chain — close-epics ready 6s → plan planning 12m → super-plan-59b.19 implement+review+merge+seam 27m → super-plan-59b.27 implement+review+merge 7m
Profile: bottleneck — super-plan-59b.19 — 28m on the critical path (58%) · implement 25m · review 31s · merge 1m · seam 22s · dispatch 10s · implement on the path 25m: test 5m · poll 15m · read 6s · shell 4m · model 2m (longest: "bash tests/skill-scripts/test-bash-invocation.sh > $TMPDIR/…" 2m, "python3 - <<'E'" 2m) · dependents 1 direct, 1 transitive
Profile: waits — ready→start, summed per bead (beads wait at the same time, so not wall time): 2m over 1 of 9 landed beads — stack-conflict 2m (1)
Profile: early unblock — 1 landed beads had in-run blockers · stacked on an implementation 0 · bounced on a stack conflict then waited for the merge 1 (2m) · waited for a merge without one 0
Profile: rework — 18s of dispatch time in attempts that did not land — super-plan-59b.27 18s (STACK_CONFLICT; landed later)
Profile: tests — implementers and fixers, summed: 23m running tests and 50m polling background runs, 71% of their 1h43m · 0 Bash call(s) ran into the 10-minute tool limit
Profile: slow tests — bash tests/skill-scripts/test-bash-invocation.sh 7m (7 runs, longest 2m) · bash tests/super-auto/test-contract-lint.sh 5m (6 runs, longest 1m) · bash tests/super-design/test-amend-check.sh 4m (4 runs, longest 2m) · bash tests/super-design/test-redesign-cycle-filing.sh 2m (1 run, longest 2m)
Profile: redo — on the critical path, up to stack-conflict re-cuts 2m (super-plan-59b.27) — from a bead's first attempt to its final one; the what-ifs model the real saving
Profile: merge lane — busy 6m of 33m (20%) · seam reviews and fixes 22s (6% of busy) · 10 merge dispatches, first try not merged for 1 of 9 · queue wait 40s total, peak 1 waiting · stack-parent wait 0s
Profile: conflicts — tests/super-design/test-step-back-check.sh (stack conflicts 1, seam overlaps 1, declared by 3) · skills/super-design/scripts/step-back-check (stack conflicts 0, seam overlaps 1, declared by 3)
Profile: runtime — peak 10 agents at once of 10 runtime slots · full 1% of the run · slot cap 8
Profile: what-if — faster super-plan-59b.19 → 37m (−10m, 22%) — its implement time halved
Profile: what-if — cut super-plan-59b.27 <- super-plan-59b.19 → 41m (−7m, 14%) — payoff if this edge were cut — whether it can be is a design call
Profile: what-if — split super-plan-59b.19 → 41m (−7m, 14%) — its 1 dependent(s) wait only for a contract slice ≈30% of its implement time
Profile: what-if — faster super-plan-59b.27 → 45m (−3m, 6%) — its implement time halved
Profile: what-if — every early unblock taken → 45m (−2m, 4%) — no stack conflicts: dependents stack on implemented blockers instead of waiting for their merge
Profile: context — agents 79 (measured 79) · peak≥80% 0 · compacted 0 agents, 0 compactions · coordinator 617K/1000K (62%), 0 compactions · max coordinator 62%
Profile: context agent — coordinator peak 617K/1000K (62%) · first 253K · compactions 0
Profile: unmeasured — Claude context windows from the model table: claude-opus-5-5 1000K, claude-sonnet-5-5 1000K
Profile: super-plan-59b · 1 invocation · 2026-10-17T09:06Z → 2026-10-17T09:58Z · wall 52m (task graph 23m, after the last landing 29m) · agents 88 (timed 88) · beads dispatched 7, landed 7, planned 27
Profile: shape — 27 beads · 0 edges · depth 1 · width 27 · beads per level 27
Profile: bound — graph lower bound 20m (unlimited slots and merge lanes) · model of the run 22m (cap 8, one merge lane) vs actual 23m (96%) → merge-lane-bound: 2m of the 2m above the graph's bound is the serial merge lane
Profile: critical path — 23m = implement 2m · review 24s · merge 6m · seam 3m · planning 8m · ready 6s · startup 1m · dispatch 1m · of which other beads' merge-lane turns 6m
Profile: critical chain — close-epics ready 6s → plan planning 8m → super-plan-59b.32 implement+review+merge 3m → merge lane ×6 8m (seam 3m)
Profile: bottleneck — super-plan-59b.32 — 3m on the critical path (15%) · implement 2m · review 24s · merge 28s · dispatch 8s · implement on the path 2m: test 1m · shell 7s · model 52s (longest: "python3 - <<'EOF'" 1m, "wc -c fr-empty/fr-2.txt" 9s) · dependents 0
Profile: waits — ready→start, summed per bead (beads wait at the same time, so not wall time): 3m over 2 of 7 landed beads — hot-file 1m (1) · unexplained 1m (1)
Profile: early unblock — 0 landed beads had in-run blockers · stacked on an implementation 0 · bounced on a stack conflict then waited for the merge 0 (0s) · waited for a merge without one 0
Profile: tests — implementers and fixers, summed: 12m running tests and 0s polling background runs, 53% of their 23m · 0 Bash call(s) ran into the 10-minute tool limit
Profile: slow tests — bash tests/super-auto/test-contract-lint.sh 6m (5 runs, longest 1m) · bash tests/$t.sh 3m (3 runs, longest 1m) · bash tests/super-design/test-redesign-cycle-filing.sh 2m (13 runs, longest 1m) · bash tests/super-design/$t.sh 1m (1 run, longest 1m)
Profile: merge lane — busy 9m of 10m (87%) · seam reviews and fixes 3m (34% of busy) · 13 merge dispatches, first try not merged for 6 of 7 · queue wait 11m total, peak 3 waiting · stack-parent wait 0s
Profile: conflicts — skills/super-design/SKILL.md (stack conflicts 0, seam overlaps 4, declared by 10) · skills/super-auto/SKILL.md (stack conflicts 0, seam overlaps 3, declared by 9) · skills/super-auto/resume.md (stack conflicts 0, seam overlaps 1, declared by 5) · tests/super-design/test-redesign-cycle-filing.sh (stack conflicts 0, seam overlaps 1, declared by 3)
Profile: runtime — peak 8 agents at once of 10 runtime slots · full 0% of the run · slot cap 8
Profile: what-if — unlimited merge lanes → 20m (−2m, 11%) — merges in parallel, each still after its stack parents
Profile: what-if — seam work off the merge lane → 20m (−2m, 11%) — rebase and seam review/fix before queueing; the lane only merges (an engine change)
Profile: what-if — faster super-plan-59b.33 → 21m (−1m, 5%) — its implement time halved
Profile: what-if — faster super-plan-59b.34 → 21m (−1m, 5%) — its implement time halved
Profile: context — agents 89 (measured 89) · peak≥80% 0 · compacted 0 agents, 0 compactions · coordinator 643K/1000K (64%), 0 compactions · max coordinator 64%
Profile: context agent — coordinator peak 643K/1000K (64%) · first 253K · compactions 0
Profile: unmeasured — Claude context windows from the model table: claude-opus-5-5 1000K, claude-sonnet-5-5 1000K

### Bead graph
| id | type | title | what (first sentence of description) |
| --- | --- | --- | --- |
| super-plan-59b.37 | task | Final-review fix: design-loop amend beads get the Integration sweep edge | Covers: [Must-fix] skills/super-design/SKILL.md §Amend Mode step 4 filing block, design loop (final review fix |
| super-plan-59b.36 | task | Final-review fix: punch list stays cumulative across a redesign round | Covers: [Must-fix] Seam, skills/super-auto/SKILL.md:285 Step 2 vs findings-ledger's --punch-list contract (fin |
| super-plan-59b.35 | task | Final-review fix: the calling loop writes `applied` | Covers: [Must-fix] Seam, skills/super-design/SKILL.md:946 and :968 vs skills/super-auto/SKILL.md §Redesign cyc |
| super-plan-59b.33 | task | Regression fix: Amend Mode step 4 supersede ordering | Covers: [Should-fix] skills/super-design/SKILL.md:929; skills/super-design/SKILL.md:930 (roast r2, fix-regress |
| super-plan-59b.34 | task | Final-review fix: write the redesign step-back line only after the branch is chosen | Covers: [Must-fix] Seam, both loops: step-back-prompt.md:26 redesign line written before the branch is chosen; |
| super-plan-59b.32 | task | Regression fix: findings-ledger tells a clean final review from no review | Covers: [Should-fix] skills/super-design/scripts/findings-ledger:237 (roast r2, fix-regression) |
| super-plan-59b.31 | task | Regression fix: resume abort paths keep dissolved overrides | Covers: [Should-fix] skills/super-auto/resume.md:46; skills/super-auto/resume.md:31 (roast r2, fix-regression) |
| super-plan-59b.26 | task | Fix: c8-amend-check-content-guards (code roast r1) | Covers: [Nit] skills/super-design/scripts/amend-check:244, [Must-fix] untested: amend-check has no case for: a |
| super-plan-59b.27 | task | Fix: script-test the scriptable subset of spec §7 prose-only behaviours | Covers: [Must-fix] untested: Everything spec §7 lists as prose-only … (final review, r1) |
| super-plan-59b.25 | task | Fix: c7-contract-pinning (code roast r1) | Covers: [Nit] skills/super-auto/SKILL.md:171, [Must-fix] untested: run-state-formats-2bf1d53.txt does not pin  |
| super-plan-59b.24 | task | Fix: c6-chain-test-order (code roast r1) | Covers: [Nit] tests/super-design/test-redesign-chain.sh:89, [Must-fix] untested: test-redesign-chain.sh runs a |
| super-plan-59b.23 | task | Fix: c5-ledger-input-presence (code roast r1) | Covers: [Should-fix] skills/super-design/scripts/findings-ledger:245, [Nit] skills/super-design/scripts/findin |
| super-plan-59b.21 | task | Fix: c3-resume-redesign-replay (code roast r1) | Covers: [Must-fix] skills/super-auto/resume.md:29: limit "findings … missing as beads are re-filed" and "only  |
| super-plan-59b.22 | task | Fix: c4-step-back-check-trigger-parse (code roast r1) | Covers: [Nit] skills/super-design/scripts/step-back-check:100, [Nit] skills/super-design/scripts/step-back-che |
| super-plan-59b.20 | task | Fix: c2-redesign-filing-lifecycle (code roast r1) | Covers: [Must-fix] skills/super-auto/SKILL.md §Redesign cycle (with super-design §Amend Mode's code-loop row): |
| super-plan-59b.19 | task | Fix: c1-dissolve-effect (code roast r1) | Covers: [Should-fix] skills/super-auto/SKILL.md:263, [Should-fix] skills/super-design/scripts/step-back-check: |
| super-plan-59b.11 | task | Integration sweep: roast findings redesign loop | Verify the goal's main flow end to end and add the integration tests no per-bead test covers. |
| super-plan-59b.10 | task | super-design SKILL.md: design loop's local/redesign rounds | Per spec §3b (the design loop's own Step 1, exits and redesign cycle), §2 and spec §1's overrides rule (docs/s |
| super-plan-59b.9 | task | report prompt: redesign cycles, disputes and the ledger | Per spec §5 (docs/superpowers/runs/2026-10-16-roast-findings-redesign-loop/2026-10-16-roast-findings-redesign- |
| super-plan-59b.8 | task | run-state fields, resume replay and contract-lint baseline for the redesign budget | Per spec §5 (docs/superpowers/runs/2026-10-16-roast-findings-redesign-loop/2026-10-16-roast-findings-redesign- |
| super-plan-59b.6 | task | super-design SKILL.md: §Amend Mode | Per spec §4 (docs/superpowers/runs/2026-10-16-roast-findings-redesign-loop/2026-10-16-roast-findings-redesign- |
| super-plan-59b.7 | task | super-auto SKILL.md: phase-5 local/redesign rounds and the redesign cycle | Per spec §3 (docs/superpowers/runs/2026-10-16-roast-findings-redesign-loop/2026-10-16-roast-findings-redesign- |
| super-plan-59b.5 | task | amend designer prompt template | Create skills/super-design/amend-prompt.md: the amend designer dispatched by §Amend Mode (spec §4 step 1, docs |
| super-plan-59b.3 | task | amend-check script and tests | Build skills/super-design/scripts/amend-check per spec §4 step 2 (docs/superpowers/runs/2026-10-16-roast-findi |
| super-plan-59b.4 | task | step-back prompt: local/redesign with triggers and the ledger | Update skills/super-design/step-back-prompt.md per spec §2 (docs/superpowers/runs/2026-10-16-roast-findings-re |
| super-plan-59b.2 | task | Move step-back-check to super-design and enforce ledger triggers | Per spec §2 and §6 (docs/superpowers/runs/2026-10-16-roast-findings-redesign-loop/2026-10-16-roast-findings-re |
| super-plan-59b.1 | task | findings-ledger script and tests | Build skills/super-design/scripts/findings-ledger per spec §1 (docs/superpowers/runs/2026-10-16-roast-findings |
| super-plan-59b | epic | Roast findings redesign loop | Implement the roast findings redesign loop in both roast fix loops (super-auto phase 5 code loop, super-design |
| super-plan-59b.30 | task | review: super-plan-59b.19 | Review, fix and merge of super-plan-59b.19, tracked separately so super-plan-59b.19's dependents can start onc |
| super-plan-59b.29 | task | review: super-plan-59b.20 | Review, fix and merge of super-plan-59b.20, tracked separately so super-plan-59b.20's dependents can start onc |
| super-plan-59b.28 | task | review: super-plan-59b.25 | Review, fix and merge of super-plan-59b.25, tracked separately so super-plan-59b.25's dependents can start onc |
| super-plan-59b.18 | task | review: super-plan-59b.1 | Review, fix and merge of super-plan-59b.1, tracked separately so super-plan-59b.1's dependents can start once  |
| super-plan-59b.17 | task | review: super-plan-59b.2 | Review, fix and merge of super-plan-59b.2, tracked separately so super-plan-59b.2's dependents can start once  |
| super-plan-59b.16 | task | review: super-plan-59b.3 | Review, fix and merge of super-plan-59b.3, tracked separately so super-plan-59b.3's dependents can start once  |
| super-plan-59b.15 | task | review: super-plan-59b.7 | Review, fix and merge of super-plan-59b.7, tracked separately so super-plan-59b.7's dependents can start once  |
| super-plan-59b.14 | task | review: super-plan-59b.10 | Review, fix and merge of super-plan-59b.10, tracked separately so super-plan-59b.10's dependents can start onc |
| super-plan-59b.13 | task | review: super-plan-59b.8 | Review, fix and merge of super-plan-59b.8, tracked separately so super-plan-59b.8's dependents can start once  |
| super-plan-59b.12 | task | review: super-plan-59b.6 | Review, fix and merge of super-plan-59b.6, tracked separately so super-plan-59b.6's dependents can start once  |

| dependent | blocker | reason (from `blocked-by` line, or `unstated`) |
| --- | --- | --- |
| super-plan-59b.27 | super-plan-59b.25 | .27 updates spec §7's script-verified list, which claims contract-lint verifies the run-state record formats; .25 adds those pins to run-state-formats-2bf1d53.txt; both also edit tests/super-auto/test-contract-lint.sh. |
| super-plan-59b.27 | super-plan-59b.20 | .27's contract-lint assertion on Amend Mode sequencing checks step 4's filing sequence that .20 rewrites, and its spec §7 split must list .20's new test-redesign-cycle-filing.sh as script-verified. |
| super-plan-59b.27 | super-plan-59b.19 | .27's contract-lint assertions pin the Step 1 ordering in both SKILL.md files that .19 rewrites (dissolved-line write moves into the redesign branch), and its lastGood-breach fixtures assume .19's findings-ledger count rule (an @rN override reduces only later rounds). |
| super-plan-59b.11 | super-plan-59b.10 | consumes all leaves (integration sweep) |
| super-plan-59b.11 | super-plan-59b.2 | consumes all leaves (integration sweep) |
| super-plan-59b.11 | super-plan-59b.8 | consumes all leaves (integration sweep) |
| super-plan-59b.11 | super-plan-59b.5 | consumes all leaves (integration sweep) |
| super-plan-59b.11 | super-plan-59b.1 | consumes all leaves (integration sweep) |
| super-plan-59b.11 | super-plan-59b.9 | consumes all leaves (integration sweep) |
| super-plan-59b.11 | super-plan-59b.3 | consumes all leaves (integration sweep) |
| super-plan-59b.11 | super-plan-59b.6 | consumes all leaves (integration sweep) |
| super-plan-59b.11 | super-plan-59b.7 | consumes all leaves (integration sweep) |
| super-plan-59b.11 | super-plan-59b.4 | consumes all leaves (integration sweep) |
| super-plan-59b.7 | super-plan-59b.6 | super-plan-59b.7 writes super-design §Amend Mode pointers into skills/super-auto/SKILL.md and tests/super-auto/test-contract-lint.sh check_pointers fails on any pointer naming no existing heading, so it cannot pass until super-plan-59b.6 creates ## Amend Mode in skills/super-design/SKILL.md. |
| super-plan-59b.30 | super-plan-59b.19 | unstated |
| super-plan-59b.29 | super-plan-59b.20 | unstated |
| super-plan-59b.28 | super-plan-59b.25 | unstated |
| super-plan-59b.18 | super-plan-59b.1 | unstated |
| super-plan-59b.17 | super-plan-59b.2 | unstated |
| super-plan-59b.16 | super-plan-59b.3 | unstated |
| super-plan-59b.15 | super-plan-59b.7 | unstated |
| super-plan-59b.14 | super-plan-59b.10 | unstated |
| super-plan-59b.13 | super-plan-59b.8 | unstated |
| super-plan-59b.12 | super-plan-59b.6 | unstated |

## Design questions

### Re-entry planning on the critical path
Every super-code re-entry runs a full planning pass (8–12m) before any dispatch, even when fix beads arrive fully specified from super-auto §Step 3: `Profile: critical path — 23m = implement 2m · … · planning 8m` on a 7-bead re-entry; earlier invocations `planning 11m` (of 42m) and `planning 12m` (of 48m) — 31m of 113m critical path across the three. For skipping: fix beads already carry Decomposition fields and files-touched hints, so the planner pays little back on 2–3m beads. For keeping: the planner pass makes hot-file and edge decisions (third invocation: `hot-file deferrals: skills/super-design/SKILL.md (2)`, merge lane first-try-not-merged 6 of 7). Premise: the profile does not show whether the planner re-plans every leaf or only the new open beads (`planned 27`, `dispatched 7`).

If upstream decides otherwise, please state the position explicitly so downstream can reconcile against words rather than silence.

## Doc gaps
none

## Already fixed — do not re-litigate
none

## Not established
- By default: the coordinator's ledger-append path is fire-and-forget and can lose a line without the coordinator noticing, so every ledger-derived count in `## Run metrics` (Fix loop, Merge-back) is a lower bound. The `Metrics: ledger-check` line is the one cross-check that exists.
- Excluded by triage (not skill machinery or not general): the cross-run peer relay; an automated security review of this run's own new amend-check code; tests/codex/test-package-codex-plugin.sh failing inside any git worktree (this repo's packaging script, not a skill); background-test polling time (50m polling vs 23m test runs, indistinguishable from real waiting).
- Analyst model: opus.
- Defect 1's savings (fewer final-review agents, shorter tail) are inferred from the threshold arithmetic, not measured.

## Verification bar
- Defect 1: run context-preflight under each harness model alias and a `[1m]`-pinned id and compare with context-pass's table; a super-code dryRun whose final-review inputs exceed 80K but stay under 400K must not split.
- Defect 2: a scope-dispositions fixture whose cluster's only in-scope member is a final-review key must pull the roast members in and print no `cluster dropped`.
- Defect 3: a PR-mode roast on a scratch repo must leave `git status --porcelain` empty.

---
If a premise above is wrong, stop and say so rather than improvising a larger change.
