# 2026-10-15-coordinator-subagent-compaction: PR-mode super-roast agents run git checkout in the caller's integration worktree

Plugin: 6.4.2-alepar5.3. Run: 36 work beads (+13 review beads), 1 code round + 1 fix round + 2 exception re-entries, ~2026-10-15→16.

## Defects

### 1. In PR mode, super-roast agents can change the caller's integration worktree with `git checkout`; nothing in super-roast stops it
- **Evidence:** friction.md: "a PR-mode roast agent ran `git checkout <base>` then `git checkout <head sha>` inside the caller's integration worktree (reflog HEAD@{3..5}), leaving it detached; three run commits landed detached". Ledger: "Merge: super-plan-goq.42 — … check none → held: integration worktree … not on super-auto/coordinator-subagent-compaction (detached at d4ab8afb)". Profile wf_1b20b5c0: "wall 40m … beads dispatched 11, landed 0", "rework — 1h07m of dispatch time in attempts that did not land". Round 2 needed a workaround: "ran the PR roast against a throwaway detached worktree". The only related text in the installed super-roast-workflow.md is around line 692: "in both modes it writes nothing to the repo itself". That describes the orchestrator, not a rule for scouts or judges. No super-roast prompt mentions checkout or read-only git.
- **Premise to verify:** Scouts and judges really do need base-vs-head file contents, so the fix must give them a working way to get them (git show/diff, or their own worktree), not just a ban.
- **Suggested fix shape:** Give the PR-mode scout and judge prompts a read-only git rule (use `git show <rev>:<path>` and `git diff`, never checkout, switch, reset or stash in the caller's tree). Or have the engine cut its own detached worktree at the head SHA and point agents at it.

### 2. In super-code's `runTask`, the integration-blocked guard runs before `sched.acquire()`, so tasks already waiting for a slot still dispatch after the hold
- **Evidence:** coordinator.js (5.3), line 1182: `if (integrationBlocked) { … not started …; return }`, then `await sched.acquire(id)` with no second check. The same order is still on the branch at line 1271. Profile wf_1b20b5c0: the hold was detected when .42's merge ended (ts 1792140741240). Then ".44 … wait 2m (slot)", implementer started at 1792140841804 (+100 s). ".41 … wait 3m (slot)", started at 1792140924258 (+183 s). The coordinator log at line 826 says "no new task starts".
- **Premise to verify:** A task already holding a slot should still finish implementing (its branch is reused on relaunch, as happened here: relaunch implement times were 15 s to 1 m). Only starts after the hold should be suppressed.
- **Suggested fix shape:** Check `integrationBlocked` again right after `sched.acquire(id)`. If set, release the slot and return.

### 3. After an integration-blocked relaunch, a bead that went through a fix pass in the blocked invocation is counted "review clean"
- **Evidence:** Ledger line 142, blocked invocation: "Task 25 (super-plan-goq.38): fix pass FIXED (…narrower than the brief…)". Line 173, relaunch: "Task 25 (super-plan-goq.38): complete (commits dfadc10..e0fba6d, review clean)". Final Metrics: "completions — review clean 36 · after fix pass 0" next to "fix-pass — entered 1 · FIXED 1". report.md smell: ".38 … ran in the integration-blocked invocation and landed 'review clean' on relaunch". The completion metrics therefore contradict the fix-pass metrics.
- **Premise to verify:** The completion line should reflect the bead's whole history across invocations, not just the last attempt's review. That means reading prior "fix pass" ledger lines for the id on Resume.
- **Suggested fix shape:** On Resume, seed each id's fix-pass history from the ledger. Write "after fix pass" when an earlier attempt had a FIXED fix pass, or add a "re-reviewed after relaunch" qualifier.

### 4. A punch-listed roast key is passed to every later round and to the post-cap audit even after a later fix bead resolved it
- **Evidence:** scopeFilter-round-1 punch-listed "[Should-fix] skills/super-code/coordinator.js:701; …" as out of scope. It was later fixed by .44 (from a final-review Must-fix): "super-plan-goq.44: Fix, run-profile classifies the assemble, split and close-split labels", and the sweep shows "PASS … test-run-profile.sh". It still appears in roast-pr-2-punch-list.txt, and roast r2 reports "1 punch-listed (open)". The post-cap audit reports "4 punch-listed (open)". report.md: "Punch list, stale entry … The roast reports still list it as open, but bead super-plan-goq.44 fixed it". 5.3 super-auto SKILL.md line 271 says to carry "every key punch-listed so far, this round's plus the previous round's file". super-roast SKILL.md line 55 says an unresurfaced punch-listed finding is "never resolved". Reports and the final report keep listing a fixed finding as "punch-listed (open)".
- **Premise to verify:** super-auto knows which fix beads claim which keys (exception and final-review beads cite their source), so it can prune the list. Otherwise super-roast must be allowed to verify a punch-listed key as resolved.
- **Suggested fix shape:** When writing the punch-list file, drop keys that a landed fix bead names as its source. Or let the roast reporter mark a punch-listed key "resolved" when the cited location no longer shows the defect.

### 5. super-roast's `assemble-args --context @file` copies the file's full text into every scout prompt with no size check, pushing the engine script past the Workflow script limit
- **Evidence:** friction.md: "assemble-args --context @file embeds the whole file in every scout prompt; a 49 KB tree pushed the engine script past the Workflow 524,288-byte limit — passed the tree by path in --context instead". assemble-args.mjs line 199 does `replaceLine(base, '[REQUIREMENTS / EPIC]', … textArg(opt.context) …)`, and the script has no length or byte check.
- **Premise to verify:** The 524,288-byte limit is a fixed Workflow-tool limit, and scouts can read a context file by path just as well.
- **Suggested fix shape:** Have assemble-args check the assembled script size against the limit and fail clearly, or pass @file contexts above a threshold to scouts by path instead of inline.

### 6. The super-code recurrence detector groups minor findings by exact tag, so the same process failure under different reviewer wording never forms a "Recurring" cluster
- **Evidence:** Ledger minor tags, each seen once: [red-not-verified], [red-not-run], [red-step-skipped], [missing-red-run], [no-red-first], [tdd-not-followed], [tdd-deviation], plus [missing-test-evidence], [missing-targeted-test-run], [unrun-lint-test]. The only "Recurring minor:" line is "[missing-edge-case-test] ×3". final-review-last.md Step 2: "Six tasks recorded no RED run, and seven did not run or did not show their tests. The recurrence detector keys on exact tags, so it never grouped these."
- **Premise to verify:** Reviewers will keep inventing free-form tags. The fix is either a fixed tag vocabulary for common process classes or grouping by normalized class.
- **Suggested fix shape:** Give task reviewers a short closed list of process-class tags (for example red-not-run, tests-not-shown) to use when one applies, or map synonyms to a class before counting.

### 7. On super-code re-entries, run-profile's `shape` line counts every bead already planned in the epic as width with 0 edges, not the beads this invocation dispatched
- **Evidence:** wf_1b20b5c0: "beads dispatched 11, landed 0, planned 31" with "shape — 31 beads · 0 edges · depth 1 · width 31". wf_8f905992: "dispatched 4 … planned 35" with "35 beads · 0 edges · width 35". wf_960a1f63: "dispatched 1 … planned 36" with "36 beads · 0 edges · width 36". The first invocation reads correctly: "20 beads · 47 edges · depth 5 · width 4". The graph-shape instrument misleads on every re-entry.
- **Premise to verify:** The shape is meant to describe the work this invocation scheduled. If it is meant to describe the whole epic, the edges of closed beads should be kept instead.
- **Suggested fix shape:** Compute the shape over the beads dispatched or open in this invocation, or keep the closed beads' edges so depth and width stay meaningful.

## Run metrics

### Judge panel
- mode: design · iteration: 1 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 41 · rr 0.76 · rg 0.76 · fg 0.61 · unanimous 0.56 · ground-loo 0.74 (n=31) · reproduce 16/21/4 · refute 9/29/3 · ground 23/13/5
- mode: design · iteration: 2 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 11 · rr 0.91 · rg 0.82 · fg 0.73 · unanimous 0.73 · ground-loo 0.80 (n=10) · reproduce 9/2/0 · refute 8/3/0 · ground 10/0/1
- mode: pr · iteration: 1 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 33 · rr 0.91 · rg 0.82 · fg 0.79 · unanimous 0.76 · ground-loo 0.83 (n=30) · reproduce 18/14/1 · refute 15/17/1 · ground 20/12/1
- mode: pr · iteration: 2 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 7 · rr 0.86 · rg 1.00 · fg 0.86 · unanimous 0.86 · ground-loo 1.00 (n=6) · reproduce 6/0/1 · refute 5/1/1 · ground 6/0/1
- mode: pr · iteration: post-cap audit · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: none (no panels: all 13 scouts returned no finding; "judge completion n/a (no panels)")

### Fix loop
- Metrics: completions — review clean 36 · after fix pass 0 · parked 0 · re-entry closes 0 · dispatched early 8 · cancelled 0
- Metrics: fix-pass — entered 1 · FIXED 1 · BLOCKED 0
- Note: "review clean 36 · after fix pass 0" contradicts "fix-pass entered 1 · FIXED 1"; see Defect 3.

### Merge-back
- Metrics: merges 36 · merge-failed 0 · rebase-conflicts 0 · seam-reviews 7 (fixed 0) · check-fails 0 (fixed 0)
- Metrics: ledger-check ok · append-failed 0 · append-retried 0
- `Merge:` lines: 37 in total, 36 success-path plus 1 held (.42: "check none → held: integration worktree … not on super-auto/coordinator-subagent-compaction (detached at d4ab8afb)"). Conflict 0 · seam-review cleared 7 · seam-review fixed 0 · check fail→fixed 0 · check fail 0 · → blocker 0 · → held 1.
- First-parent merge commits: 37 vs 36 success-path `Merge:` lines. The extra commit is the base-absorption merge (98eb7f12, main v6.4.2-alepar5.4), so the ledger is complete.

### Coverage
- coverage-round-1: requirements: 13 · mapped: 13 · unmapped: 0
- coverage-round-2: requirements: 16 · mapped: 15 · unmapped: 1 (R16) · divergence: findings 13 → 15 · novel 9/15 (60%) · widening: yes
- scope-filter (fix round 1): 16 in-scope · 1 punch-listed

### Timing
What-if lines are a schedule model's estimates, not measurements; quote them with the `bound` line's model-vs-actual figure.

**wf_c2841492-7f3** (code round)
- Profile: super-plan-goq · 1 invocation · 2026-10-16T05:24Z → 2026-10-16T08:06Z · wall 2h43m (task graph 2h29m, after the last landing 13m) · agents 136 (timed 136) · beads dispatched 20, landed 20, planned 20
- bound: graph lower bound 2h29m along super-plan-goq.12 → .13 → .16 → .20 (unlimited slots and merge lanes) · model of the run 2h29m (cap 8, one merge lane) vs actual 2h29m (100%) → graph-bound: the 4-bead dependency chain set the pace
- critical path: 2h29m = implement 1h51m · review 1m · merge 2m · seam 3m · planning 30m · ready 8s · startup 34s · dispatch 38s
- bottleneck: super-plan-goq.12 — 36m on the critical path (24%) · implement 36m
- waits: 12m over 2 of 20 landed beads — stack-conflict 12m (2)
- merge lane: busy 31m of 2h15m (23%) · seam reviews and fixes 3m (10% of busy) · 21 merge dispatches, first try not merged for 1 of 20 · queue wait 4m total, peak 1 waiting · stack-parent wait 4m
- what-if (model estimates): cut .13 <- .12 → 1h53m (−36m, 24%) · split .12 → 2h04m (−25m, 17%) · cut .16 <- .13 → 2h08m (−21m, 14%) · cut .20 <- .16 → 2h08m (−21m, 14%) · split .13 → 2h10m (−19m, 13%) · faster .12 → 2h11m (−18m, 12%)

**wf_1b20b5c0-88f** (re-entry, integration-blocked)
- Profile: super-plan-goq · 1 invocation · 2026-10-16T08:32Z → 2026-10-16T09:12Z · wall 40m (task graph 31m, after the last landing 8m) · agents 40 (timed 40) · beads dispatched 11, landed 0, planned 31
- bound: no model: nothing landed
- critical path: 31m = implement 13m · review 29s · planning 17m · ready 6s · startup 52s · dispatch 8s
- bottleneck: super-plan-goq.34 (did not land) — 13m on the critical path (43%)
- waits: 0s over 0 of 0 landed beads
- merge lane: busy 14s of 14s (100%) · seam reviews and fixes 0s (0% of busy) · 1 merge dispatches, first try not merged for unknown (no merge results) · queue wait 0s total, peak 0 waiting
- what-if: none
- rework: 1h07m of dispatch time in attempts that did not land

**wf_d696ed72-940** (fix round)
- Profile: super-plan-goq · 1 invocation · 2026-10-16T09:12Z → 2026-10-16T09:57Z · wall 45m (task graph 23m, after the last landing 22m) · agents 76 (timed 76) · beads dispatched 11, landed 11, planned 31
- bound: graph lower bound 11m (unlimited slots and merge lanes) · model of the run 20m (cap 8, one merge lane) vs actual 23m (89%) → merge-lane-bound: 9m of the 10m above the graph's bound is the serial merge lane
- critical path: 23m = implement 15s · review 36s · merge 12m · seam 5m · planning 1m · ready 7s · startup 52s · dispatch 3m · of which other beads' merge-lane turns 14m
- bottleneck: super-plan-goq.41 — 3m on the critical path (14%) · merge 2m · seam 55s · dispatch 23s
- waits: 31s over 1 of 11 landed beads — unexplained 31s (1)
- merge lane: busy 17m of 20m (86%) · seam reviews and fixes 5m (28% of busy) · 16 merge dispatches, first try not merged for 5 of 11 · queue wait 1h10m total, peak 8 waiting · stack-parent wait 0s
- what-if (model estimates): unlimited merge lanes → 11m (−9m, 45%) · seam work off the merge lane → 16m (−5m, 23%) (an engine change)

**wf_8f905992-f18** (exception re-entry 1)
- Profile: super-plan-goq · 1 invocation · 2026-10-16T10:06Z → 2026-10-16T10:29Z · wall 23m (task graph 13m, after the last landing 10m) · agents 34 (timed 34) · beads dispatched 4, landed 4, planned 35
- bound: graph lower bound 12m (unlimited slots and merge lanes) · model of the run 13m (cap 8, one merge lane) vs actual 13m (98%) → bead-bound: super-plan-goq.45 alone set the pace
- critical path: 13m = implement 3m · review 17s · merge 2m · seam 54s · planning 5m · ready 14s · startup 1m · dispatch 25s · of which other beads' merge-lane turns 48s
- bottleneck: super-plan-goq.46 — 5m on the critical path (36%) · implement 3m · review 17s · merge 48s
- waits: 0s over 0 of 4 landed beads
- merge lane: busy 4m of 5m (84%) · seam reviews and fixes 54s (21% of busy) · 5 merge dispatches, first try not merged for 1 of 4 · queue wait 2m total, peak 1 waiting · stack-parent wait 0s
- what-if: none saves more than 1% of the modelled 13m

**wf_960a1f63-72a** (exception re-entry 2)
- Profile: super-plan-goq · 1 invocation · 2026-10-16T10:30Z → 2026-10-16T11:07Z · wall 37m (task graph 18m, after the last landing 19m) · agents 18 (timed 18) · beads dispatched 1, landed 1, planned 36
- bound: graph lower bound 18m (unlimited slots and merge lanes) · model of the run 18m (cap 8, one merge lane) vs actual 18m (99%) → bead-bound: super-plan-goq.49 alone set the pace
- critical path: 18m = implement 11m · review 27s · merge 37s · planning 5m · ready 7s · startup 1m · dispatch 11s
- bottleneck: super-plan-goq.49 — 12m on the critical path (67%) · implement 11m · review 27s · merge 37s
- waits: 0s over 0 of 1 landed beads
- merge lane: busy 37s of 37s (100%) · seam reviews and fixes 0s (0% of busy) · 1 merge dispatches, first try not merged for 0 of 1 · queue wait 2s total, peak 1 waiting · stack-parent wait 0s
- what-if (model estimate): faster super-plan-goq.49 → 13m (−6m, 31%) — its implement time halved

### Bead graph
| id | type | title | what (first sentence of description) |
| --- | --- | --- | --- |
| super-plan-goq | epic | Coordinator and subagent compaction | Root epic for super-auto run 2026-10-15-coordinator-subagent-compaction. |
| super-plan-goq.1 | task | Spike: Codex and Claude Code compact-hook facts | Verify, before the hook wiring is built, the harness facts §A2/§A3 rest on, and record them in docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/codex-hook-shapes.md (spec §A3 Spike). |
| super-plan-goq.2 | task | run-marker script | Create skills/super-code/scripts/run-marker with `register \| clear \| get \| prune` (spec §A1). |
| super-plan-goq.3 | task | run-profile --in-flight mode | Add `--in-flight --epic <id> --session <id> --harness <claude\|codex>` to skills/super-code/scripts/run-profile.mjs (spec §A4). |
| super-plan-goq.4 | task | report-verdict script | Create skills/super-code/scripts/report-verdict <file> (spec §A5): at most ~20 lines — `verdict: <…>`, blocking / must-fix items one per line (capped, `+N more`), `path: <file>`. |
| super-plan-goq.5 | task | run-digest script and coordinator card | Create skills/super-code/scripts/run-digest and skills/super-code/coordinator-card.md (spec §A4). |
| super-plan-goq.6 | task | Claude Code re-inject: run-block library and two compact hook entries | Add the Claude Code re-inject (spec §A2). |
| super-plan-goq.7 | task | Codex re-inject: Codex-only hook file, entry script, manifest and packaging | Wire the re-inject on Codex (spec §A3) without re-enabling the Claude bootstrap hook. |
| super-plan-goq.8 | task | Final-answer contract on every dispatch; report drafter writes a file | Add the final-answer rule (spec §A5). |
| super-plan-goq.9 | task | super-code coordinator wiring: marker lifecycle, runTag, read rule, keepalive, context pre-flight | Wire coordinator compaction into super-code's docs (spec §A1, §A5, §A6, §B2 runTag, §B5); coordinator.js only passes config through. |
| super-plan-goq.10 | task | super-auto wiring: marker lifecycle, runTag and context fields, read rule, keepalive | Wire coordinator compaction into super-auto (spec §A1, §A5, §A6, §B2 runTag, §B5). |
| super-plan-goq.11 | task | Fresh agent per round and bounded improvised briefs (super-code / super-auto) | Make every super-code / super-auto fix round and re-review a fresh agent, and bound improvised dispatches (spec §B1). |
| super-plan-goq.12 | task | Brief assembler: template, assembled-size, assemble dispatch kind | Create the brief assembler (spec §B2). |
| super-plan-goq.13 | task | Final review size switch with cluster and seam reviewers | Implement the FinalReview step in coordinator.js Finish (spec §B3, §A5). |
| super-plan-goq.14 | task | super-auto consumers: roast-code assembler pre-step and final-review path | Update super-auto to consume the assembler and the final review by path (spec §B2, §A5). |
| super-plan-goq.15 | task | OversizedSplit scripts: task-surface and split-oversized | Create the deterministic sizing and split scripts (spec §B4). |
| super-plan-goq.16 | task | Planner filesToRead, surfaceTokens and oversized handling | Extend the planner and both coordinators (spec §B4, §B6). |
| super-plan-goq.17 | task | super-design shaped units: one feature, one subsystem, acceptance checklists | Shape design leaves (spec §B4), qualitatively, no numbers. |
| super-plan-goq.18 | task | context-preflight script | Create skills/super-code/scripts/context-preflight (spec §B5). |
| super-plan-goq.19 | task | Configuration smoke: compaction re-inject on Claude Code and Codex hook paths | Exercise the whole re-inject path once per harness configuration (spec §A2, §A3, §C), simulated — no live model session. |
| super-plan-goq.20 | task | Integration sweep: coordinator and subagent compaction | Verify the goal's main flows end to end on the landed tree and fix small gaps inline; file blockers for large ones (spec §C). |
| super-plan-goq.34 | task | Fix: ordinary-mode final-review dispatch parity | Cluster bead: may change every instance of its rule, cited or not. |
| super-plan-goq.35 | task | Fix: child/subagent detection uses only documented fields; card tells children to ignore | Cluster bead: may change every instance of its rule, cited or not. |
| super-plan-goq.36 | task | Fix: agent-written report formats fixed by their prompts and parsed robustly | Cluster bead: may change every instance of its rule, cited or not. |
| super-plan-goq.37 | task | Fix: reviewPath is non-null only when the file exists; one stated contract | Cluster bead: may change every instance of its rule, cited or not. |
| super-plan-goq.38 | task | Fix: run-digest exits 0 on a Task-less ledger | Context, not to be changed: everything else in docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/2026-10-16-coordinator-subagent-compaction-roast-pr-1.md, docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/2026- |
| super-plan-goq.39 | task | Fix: run-marker register keeps optional fields on refresh | Context, not to be changed: everything else in docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/2026-10-16-coordinator-subagent-compaction-roast-pr-1.md, docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/2026- |
| super-plan-goq.40 | task | Fix: oversized split cannot race a dispatch; exit 4 handled | Context, not to be changed: everything else in docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/2026-10-16-coordinator-subagent-compaction-roast-pr-1.md, docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/2026- |
| super-plan-goq.41 | task | Fix: assembled-size exit 3 caps the final review only under fits: no | Context, not to be changed: everything else in docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/2026-10-16-coordinator-subagent-compaction-roast-pr-1.md, docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/2026- |
| super-plan-goq.42 | task | Fix: context-preflight reads every settings layer | Context, not to be changed: everything else in docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/2026-10-16-coordinator-subagent-compaction-roast-pr-1.md, docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/2026- |
| super-plan-goq.43 | task | Fix: test the run-block size truncation | Test-defect bead: may change a test the bead names as the defect, and otherwise fixes the code the failing tests exercise. |
| super-plan-goq.44 | task | Fix: run-profile classifies assemble, split and close-split labels | Test-defect bead: may change a test the bead names as the defect, and otherwise fixes the code the failing tests exercise. |
| super-plan-goq.45 | task | Fix: Codex hook reaches its own session-keyed fallback marker | Regression-only pass (fix-regression). |
| super-plan-goq.46 | task | Fix: fallback marker never leaves an untracked file in the worktree | Final-review exception round (autonomous, once). |
| super-plan-goq.47 | task | Fix: coordinator card says the Workflow owns the loop while it runs | Final-review exception round (autonomous, once). |
| super-plan-goq.48 | task | Fix: report-verdict lets the final-review Verdict heading win over a quoted Status line | Final-review exception round (autonomous, once). |
| super-plan-goq.49 | task | Fix: super-auto extracts every finding key without reading report bodies; null reviewPath routed | Final-review exception round (autonomous, once) — completes that round: item 4 of its source review was missed at filing. |

| dependent | blocker | reason (from `blocked-by` line, or `unstated`) |
| --- | --- | --- |
| super-plan-goq.5 | super-plan-goq.8 | consumes Final-answer rule wording (summarised in the card) |
| super-plan-goq.5 | super-plan-goq.4 | consumes report-verdict CLI (named in the card) |
| super-plan-goq.5 | super-plan-goq.3 | consumes run-profile --in-flight output |
| super-plan-goq.5 | super-plan-goq.2 | consumes run-marker get output |
| super-plan-goq.6 | super-plan-goq.2 | consumes run-marker get |
| super-plan-goq.7 | super-plan-goq.6 | consumes RunBlockInjector library |
| super-plan-goq.7 | super-plan-goq.1 | consumes compact-hook facts record |
| super-plan-goq.9 | super-plan-goq.18 | consumes context-preflight CLI and --json shape |
| super-plan-goq.9 | super-plan-goq.2 | consumes run-marker CLI |
| super-plan-goq.9 | super-plan-goq.4 | consumes report-verdict CLI |
| super-plan-goq.9 | super-plan-goq.5 | consumes coordinator card |
| super-plan-goq.10 | super-plan-goq.5 | consumes coordinator card |
| super-plan-goq.10 | super-plan-goq.18 | consumes context-preflight CLI |
| super-plan-goq.10 | super-plan-goq.4 | consumes report-verdict CLI |
| super-plan-goq.10 | super-plan-goq.2 | consumes run-marker CLI |
| super-plan-goq.11 | super-plan-goq.12 | consumes dispatch-text assemble --consumer history\|assess |
| super-plan-goq.12 | super-plan-goq.8 | consumes Final-answer rule helper |
| super-plan-goq.13 | super-plan-goq.12 | consumes assemblePrompt builder and assembled-size |
| super-plan-goq.14 | super-plan-goq.10 | phase-4 assembler pre-step passes run.md's runTag (--run-tag), a field defined in run-state.md and written at pre-flight by .10 |
| super-plan-goq.14 | super-plan-goq.12 | consumes dispatch-text assemble --consumer roast-code |
| super-plan-goq.14 | super-plan-goq.13 | consumes FinalReview step's reviewPath return field |
| super-plan-goq.14 | super-plan-goq.4 | consumes report-verdict CLI |
| super-plan-goq.16 | super-plan-goq.15 | consumes task-surface and split-oversized CLIs |
| super-plan-goq.16 | super-plan-goq.13 | consumes recorded dryRun baselines after the final-review change (both rewrite coordinator-workflow.md's agent counts) |
| super-plan-goq.19 | super-plan-goq.5 | consumes the real run-digest script |
| super-plan-goq.19 | super-plan-goq.7 | consumes Codex hook file and packaging |
| super-plan-goq.19 | super-plan-goq.6 | consumes Claude Code compact hook entries |
| super-plan-goq.20 | super-plan-goq.15 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.16 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.9 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.11 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.5 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.17 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.8 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.13 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.10 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.3 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.6 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.12 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.4 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.19 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.1 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.7 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.2 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.14 | consumes all leaves (integration sweep) |
| super-plan-goq.20 | super-plan-goq.18 | consumes all leaves (integration sweep) |
## Design questions

### Q1. Should super-code's full final review run at the end of every invocation?
super-code runs a full final review (opus, about 7 to 20 min) at the end of every invocation, including one that landed nothing and one-bead re-entries. Under super-auto, a post-cap audit roast then covers the same diff again.
- **Evidence:** The gate is `(completed.size || confirmedLandings.size)` (coordinator.js line 1584), and `completed` is seeded from the ledger on Resume, so the blocked invocation (landed 0) still ran final-review 09:04:33 to 09:11:31. Final-review time per invocation: 12m (c2841492), 7m (1b20b5c0, 0 landed), 20m (d696ed72: "after the last landing 22m" of 45m wall), 8m (8f905992), 17m (960a1f63: "after the last landing 19m" of 37m wall, for one 11m bead). The post-cap audit then ran: "clean (0 nits) [converged]".
- **For gating (for example `deferFinalReview`, like `deferSweep`, with super-auto running one review after its last re-entry):** about 50 min of tail time across the 4 re-entry invocations, and the post-cap audit already covers late changes.
- **Against gating:** per-invocation reviews catch problems while the fix loop can still act (the blocked invocation's review found a real issue, Doc gap D1 item 4), and a single late review moves findings past the roast cap, where they become punch-list lines.
- **Premise to verify:** Whether the extra reviews change outcomes. The blocked invocation's review did find a real issue, so skipping it is not free.
- If upstream decides otherwise, please state the position explicitly so downstream can reconcile against words rather than silence.

### Q2. Should rebase and seam review/fix move off the serial merge lane?
Fix-loop rounds of many small independent beads touching hot files are bound by the merge lane. The single lane does a seam review and fix for every overlapping merge and spends an agent dispatch even on a clean rebase.
- **Evidence:** Profile wf_d696ed72: "merge-lane-bound: 9m of the 10m above the graph's bound is the serial merge lane". "merge lane — busy 17m of 20m (86%) · seam reviews and fixes 5m (28% of busy) · 16 merge dispatches, first try not merged for 5 of 11 · queue wait 1h10m total, peak 8 waiting". Its what-ifs: "unlimited merge lanes → 11m (−9m, 45%)", "seam work off the merge lane → 16m (−5m, 23%) … (an engine change)". Detector: "merge queue peak 9". Most ledger merges read "rebase clean · seam-review none · check pass", yet each lane turn was a 15 s to 1 m dispatch.
- **For moving it off the lane (lane only fast-forwards and re-checks when the tip changed):** the profiler models −5m on a 20m round, and fix rounds always look like this.
- **Against:** a pre-queue seam review is stale once another merge lands, so overlap-heavy rounds may redo it. A cheaper first step is a scripted fast path for a clean fast-forward with no overlap.
- **Premise to verify:** That seam review can be done safely before queueing against a tip that may move. Otherwise it must be redone, which is the reason it sits on the lane now.
- If upstream decides otherwise, please state the position explicitly so downstream can reconcile against words rather than silence.

## Doc gaps

### D1. super-auto has no rule for a final review produced by an integration-blocked invocation
Its unique findings were dropped when fix beads were filed from the relaunch's review, which forced a second "once-per-run" re-entry.
- **Evidence:** Item 4 (I8 vs the Phase-5 keys) appears only in final-review-fixloop-r1-blocked.md. The relaunch's final-review-fixloop-r1.md has no mention of I8. final-review-exception.md: "This was item 4 of …final-review-fixloop-r1-blocked.md. The `finalReviewException` re-entry filed only the `.gitignore`, card-guard and recogniser-order beads". run.md: "finalReviewException-completion: super-plan-goq.49 — … missed at the exception round's filing … one more re-entry". 5.3 super-auto SKILL.md line 289 says "re-enter `super-code` once". The extra re-entry cost 37 min of wall time for 11 min of implementation (profile wf_960a1f63).
- **Premise to verify:** Upstream must decide whether a blocked invocation's final review counts as evidence or is superseded. The branch's .49 ("extracts every finding key without reading report bodies") may cover extraction but not unioning across reviews; check before implementing.
- **Suggested fix shape:** When a super-code invocation returns integration-blocked, its final review is either skipped (see Q1) or its items are unioned into the next filing. Also add a check against a key file before filing exception beads, as roast findings already get from step-back-check and scope-dispositions.

## Already fixed — do not re-litigate
none known upstream.

## Not established
- By default: the coordinator's ledger-append path is fire-and-forget and can lose a line
  without the coordinator noticing, so every ledger-derived count in `## Run metrics` (Fix loop,
  Merge-back) is a lower bound. The `Metrics: ledger-check` line is the one cross-check that
  exists.
- The findings were triaged by an analyst agent running on opus; none was re-derived by a second reader.
- The Codex-side behaviour was never observed live in this run (Codex auth was refused in the spike), so nothing here claims how Codex agents behave.
- Every observation is from a single run. No frequency, rate or default-tuning claim is made, and the what-if figures are a schedule model's estimates, not measurements.

## Verification bar
- Defect 1: a super-roast PR-mode run against a worktree that asserts HEAD and the branch name are unchanged afterwards.
- Defect 2: a replay-harness or `dryRun` scenario for integration-blocked with tasks already waiting on slots, asserting no implementer dispatches after the hold.
- Defect 3: a replay scenario that blocks mid-fix-pass, relaunches, and asserts the completion line reads "after fix pass".
- Defect 4: a super-auto round sequence where a fix bead cites a punch-listed key, asserting the next punch-list file omits it.
- Defect 5: an assemble-args size test with a context file large enough to cross 524,288 bytes, asserting a clear failure or by-path fallback.
- Defect 6: a detector test feeding synonym tags (red-not-run, no-red-first, missing-red-run) and asserting one Recurring cluster.
- Defect 7: a run-profile test on a re-entry ledger asserting shape counts only this invocation's beads.
- Q1, Q2 and D1 are decisions, not tests: a live round is needed after any change to see whether the blocked-review item still reaches the next filing.

---
If a premise above is wrong, stop and say so rather than improvising a larger change.
