status: completed with 0 unresolved Blocking, 4 escalations [degraded: Global Constraint 'no agent-facing change' overridden by super-plan-fqb.8 (coordinator-workflow.md and coordinator-subagents.md Finish wording: append run-profile's whole stdout), final review: not ready (Must-fix punch-listed: contextResult holds every parsed transcript before reducing, so a very large run can run out of memory and lose all Profile: lines, timing included; human decision on the parked constraint override; see final-review-fix-round.md)]
metrics: pending (upstream-feedback not yet run)

**Decision requested:** (1) confirm or revert the Finish-doc wording change that overrides the "no agent-facing change" constraint (the final review recommends confirming it); (2) decide whether to fix the `contextResult` memory regression before merging. The final review rated it Important and called it a data-loss path. Details under Remaining.

## Implemented

- super-plan-fqb.1: context-pass module (`skills/super-code/scripts/context-pass.mjs`) with harness readers, window table, causes, summary and renderers, plus `tests/super-code/context-pass-unit.mjs`. Commits 19be08a..1a81f13, review clean. (bd; progress.md Task 1)
- super-plan-fqb.3: context pass documented in SKILL.md, MAINTENANCE.md and upstream-feedback report-template.md. Commits 45c4462..cd88ebc, review clean. (bd; progress.md Task 2)
- super-plan-fqb.2: run-profile integration (context targets, `--context-only`/`--session`/`--context-window` flags, output placement, ctx-*.json end-to-end fixtures). Commits ba0eb43..21ca842, review clean. (bd; progress.md Task 3)
- super-plan-fqb.4: validated against 13 real Codex runs and 13 Claude coordinator sessions; MAINTENANCE.md "Validated on" table. No code defect found. Commits 21ca842..f7c5b58, review clean. (bd; progress.md Task 4; task-4-report.md)
- super-plan-fqb.5: integration sweep section in `tests/super-code/test-run-profile.sh` (stdout/JSON/Markdown agreement, threshold and line cap, `--context-window`). Commits 41cee55..fe9af6f, review clean. (bd; progress.md Task 5)
- super-plan-fqb.10: multi-rollout (resumed) Codex coordinator end-to-end test, ctx-codex-resume.json. Commits c67221f..1811431, review clean. (bd; progress.md Task 8)
- super-plan-fqb.8: coordinator Finish docs now append run-profile's whole stdout on every exit path. This is the change that overrides the constraint. Commits 73c71a1..6391d6e, review clean. (bd; progress.md Task 6)
- super-plan-fqb.9: readers take the whole transcript plus `[fromRow, toRow)` spans and carry model, gap and window state from row 0; the `flatMap` concatenation is gone. Commits 6391d6e..7d654c9, review clean. (bd; progress.md Task 7)
- super-plan-fqb.11: final-review fix round. `contextBaseline` no longer double-counts across a run's super-code invocations. Commits 2d76d1e..d0e5b07, review clean. (bd; progress.md Task 9; run.md `finalReviewFixRound`)
- Sweep: 9 passed, 0 failed (the nine AGENTS.md step-1 suites) @ f79cfbf. (run.md `codeBuckets.sweep`)
- Base absorption: de7a58b (v6.4.2-alepar5.3 manifest version bump only) merged as 0eb7905 with 0 conflicted files. The post-cap audit (fdbf97d vs 7a004a0) covered it. (run.md `baseAbsorbed`; post-cap-audit report `inputs:`)

## Remaining

- **parked degraded-verdict:** Global Constraint "no agent-facing change" overridden by super-plan-fqb.8 (Finish wording in coordinator-workflow.md and coordinator-subagents.md). Without it, the exit-3 `Profile: context` lines never reach the ledger. Human to confirm or revert; the final review recommends confirm. (run.md `parked`; final-review-fix-round.md item 3)
- **final review:** memory regression. `contextResult` in run-profile.mjs parses every coordinator and agent transcript and holds all rows before reducing them. Measured 3.70GB peak on the `01a10505` Codex run vs 2.01GB on main, and out-of-memory under 1GB/1.5GB heap caps. An OOM loses every `Profile:` line, including the timing lines main prints today. The final review regraded it from Nit to Important (data loss). Fix recipe: reduce each agent transcript to its record right after `readJsonl` (the scope check needs only `firstTs`), and keep coordinator rows only until their own record is read. (final-review-fix-round.md finding 1 / Must fix 1)
- **final review:** relaunched-Workflow phantom record. A cached agent in a resumed run is listed again under its original ID with no transcript in the new directory, so it is counted twice (`agents 8` → `agents 9`, plus a `transcript missing or unreadable` reason). Fix: dedupe context targets by agent ID across runs, preferring the copy whose transcript exists. (final-review-fix-round.md finding 2)
- **final review:** resumed-Codex noise. A resumed rollout with no invocation of its own adds `coordinator rows counted from the session start (no invocation found)`. The reason is accurate but noisy, and no test asserts on the `Profile: unmeasured` line. (final-review-fix-round.md finding 4)
- **final review:** untested scope. Items:
  - the idle cause was never checked against an outside record;
  - no end-to-end test for Claude Code `coordinator:<k>` labelling;
  - no end-to-end test for a Workflow relaunch with cached agents;
  - a Codex coordinator whose window starts after its first `turn_context` has a unit test only;
  - the integration sweep's agent-line loop passes trivially when no agent lines print;
  - at review time the full suite had not run. It ran later and passed 9/9 @ f79cfbf.
  (final-review-fix-round.md §Untested scope; run.md sweep)
- **fix-regression (post-cap audit, Should-fix):** `contextBaseline` dedupes coordinator records by `file` alone (context-pass.mjs:308-309). Two runs hosted in one coordinator session (disjoint windows) collapse into one agent, which undercounts `agents` and `compacted agents` and drops the lesser run's peak≥80%. fqb.11 introduced this. Fix shape: key the dedupe on file plus window start, or merge only overlapping spans, and add a disjoint-windows unit case. (roast-pr-post-cap-audit.md)
- **out of scope (filtered):** [Nit] run-profile.mjs:674; :671. Every parsed transcript is held in memory before reducing. Reason recorded: "Peak memory use is a performance/quality concern; the goal names no memory requirement and output is correct." The final review later regraded this same issue (see the memory regression above). (run.md `scopeFilter-round-1`; roast-pr-1-punch-list.txt)
- **out of scope (filtered):** [Nit] run-profile.mjs:693. The all-unmeasured `Profile: context — unavailable` line always says `no usage rows in any transcript` and drops per-file reasons. Reason recorded: "diagnostic polish rather than wrong goal-named results." (run.md `scopeFilter-round-1`; roast-pr-1-punch-list.txt)
- **parked escalation:** whether resumed or forked Claude Code sessions replay the parent's `compact_boundary` rows. Unverified; the local corpus has 49 boundary uuids, none duplicated. (run.md `parked`; roast-design-1)
- **parked escalation:** whether Claude Code ever writes a `[1m]` suffix into `message.model`. Unverified; no local 4.6 or `[1m]` transcript. (run.md `parked`; roast-design-1)
- **parked escalation:** the Subagent/Workflow-agent `compact_boundary` format has not been seen locally, because no local subagent ever compacted. It is covered by fixtures only. (run.md `parked`; roast-design-1; task-4-report.md)
- **parked escalation:** whether a resumed Codex thread's later rollout replays earlier `compacted` rows. Unverified; no local thread has two rollouts. (run.md `parked`; roast-design-1)
- codeBuckets escalated / pendingRetry / worktreesKept / processSweep survivors: none. (run.md `codeBuckets`)

## Gotchas & surprises

- The spec's premise that the coordinator "already copies every `Profile:` line" was wrong for exit 3. The Finish docs said to append only the `Profile: unavailable` line, which forced the constraint override in fqb.8. (roast-pr-1.md [Should-fix] run-profile.mjs:895; roast-pr-1-step-back.md exit3-docs cluster)
- Code step-back round 1 (patch, not redesign): readers saw only in-window rows, so model, gap and window state outside the window was lost or carried across excluded rows. The fix was whole transcript plus spans (fqb.9), and design line 379 was revised. (run.md `stepBackCode-round-1`; roast-pr-1-step-back.md reader-windowing cluster)
- Before fqb.9, a Claude compaction placed before the first in-window usage row on a 1M model got the default 200K window and was misclassified `cap`. (roast-pr-1.md [Should-fix] context-pass.mjs:84)
- Design roast round 1 changed the coordinator cutoff. It now uses the earliest super-auto invocation before the first dispatch, else the last super-code invocation; the matcher requires genuine prompt rows or `Skill` tool uses; duplicate targets keep the earliest cutoff. Compactions are now stamped with the window and model of their own row, and null rendering rules were added. (roast-design-1-step-back.md; run.md `stepBackDesign-round-1`)
- Validation surprise: Codex descendants spawned before the invocation row are excluded even when their compactions ran during the window. This is per spec, but 8 of the 13 Codex runs differ from the whole-thread scan for this reason. (task-4-report.md §Concerns)
- fqb.2 reviewer said PROMOTE; overruled (sp:demoted-by-session). (run.md approvals top-split)
- Slowness, invocation 1: graph-bound. The 3 open beads formed one chain, so 1 of 8 slots was usable; the edge audit kept fqb.4 <- fqb.2 as real. (run.md `codeBuckets.slowness`; progress.md Edge audit)
- Planning took 29m of the 52m critical path (plan 10m + plan-rest 19m) for a 5-bead tree. (friction.md; progress.md Profile: critical path)
- Profile: bottleneck, invocation 1: super-plan-fqb.4, 10m on the critical path (20%), half of it shell (a 2m `python3 -I` run). Largest what-if: cutting fqb.4 <- fqb.2 would give 45m (−6m, 12%). This is a model estimate. (progress.md; profile-wf_8dac7f87-858.md)
- Profile: bottleneck, invocation 2: super-plan-fqb.9, 4m (23%). What-if: none saves more than 1%. (progress.md; profile-wf_77b50d82-489.md)
- Profile: bottleneck, invocation 3: super-plan-fqb.11, 2m (33%). What-if: none saves more than 1%. (progress.md; profile-wf_b7c4b414-cb2.md)
- Slow test: `tests/super-auto/test-contract-lint.sh` took 9m over 3 runs. (progress.md Profile: slow tests)

## Entrypoints

1. `skills/super-code/scripts/context-pass.mjs`: `claudeWindow` (:65), `claudeContext` (:79), `codexContext` (:144), `HARNESSES` (:223), `summarizeContext` (:231), the renderers (:259-:289), `contextBaseline` (:297). (diff main...branch; fqb.1, fqb.9, fqb.11)
2. `skills/super-code/scripts/run-profile.mjs`: usage and flags (:26-:89), `contextResult` (:651, where the memory issue lives), the `--summarize` baseline (:757) and `--context-only` (:763). (diff; fqb.2, fqb.9)
3. `skills/super-code/coordinator-workflow.md:1292` and `skills/super-code/coordinator-subagents.md:70`: the Finish caller with the "append its whole stdout" change. (diff; fqb.8)
4. `tests/super-code/test-run-profile.sh`, `tests/super-code/context-pass-unit.mjs` and the `tests/super-code/fixtures/run-profile/ctx-*.json` fixtures. (diff; fqb.1, fqb.2, fqb.5, fqb.10)
5. `skills/super-code/MAINTENANCE.md`: context-pass section and the validation table. (diff; fqb.3, fqb.4)

## Smells

- Parked degraded-verdict: fqb.8 changed agent-facing Finish wording against a Global Constraint. The smell: an autonomous run overrode a stated constraint on its own judgment. (run.md `parked`)
- fqb.11 (the final-review fix) merged after the last code roast tip (7a004a0) and introduced the `contextBaseline` file-only dedupe regression. The smell: the once-per-run fix round shipped a regression that only the post-cap audit caught, and it is still unfixed. (roast-pr-post-cap-audit.md)
- Weak test evidence across four tasks: tdd-red-skipped (fqb.1), thin-test-evidence (fqb.4), vacuous-pass-risk and indirect-assertion (fqb.5), partial-e2e-coverage (fqb.9). The smell: green tests that may not have watched the code fail. (progress.md minor (deferred) lines; final-review-fix-round.md STEP 2)
- Deferred minor codex-first-from-compaction (context-pass.mjs:180). The smell: `first` can come from a compacted row's `pre` rather than a real request. (progress.md Task 1)
- Deferred minor wording-inconsistency (coordinator-workflow.md:1289 still says "append its stdout"). The smell: two phrasings of the same Finish rule sit next to each other. (progress.md Task 6)
- Fix-pass merges without re-review, `DONE_WITH_CONCERNS` reports, regressionPass fixes, sweepFix passes: none. All 9 tasks were review-clean with 0 fix passes. (progress.md Metrics; task-*-report.md)
