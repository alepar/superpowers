# super-auto run — 2026-10-15-coordinator-subagent-compaction

flags: planOneShot=t skipPlanRoast=f skipCodeRoast=f autonomous=f
resumeChange: 2026-10-15 · "one-shot design … fully autonomous after" + "lgtm" · autonomous=t from phase 3 onward (no stops until the phase-7 hand-back)
phase: fix-loop
codeMechanism: Workflow

idea: Implement both vision specs in one run: docs/superpowers/specs/2026-10-15-vision-coordinator-compaction.md and docs/superpowers/specs/2026-10-15-vision-subagent-compaction.md. One-shot design; pause once design is done so the user can review the split into beads; fully autonomous after that. Both roasts on. The herdr tabs "coordinator-compaction" and "subagent-compaction" in this workspace authored the visions and can be consulted about decision rationale while writing the design spec.
branch: super-auto/coordinator-subagent-compaction
base: main
spec: 2026-10-15-coordinator-subagent-compaction-design.md
epic: super-plan-goq
roast-code: 2026-10-16-coordinator-subagent-compaction-roast-pr-1.md, 2026-10-16-coordinator-subagent-compaction-roast-pr-2.md
roast-design: 2026-10-15-coordinator-subagent-compaction-roast-design-1.md, 2026-10-15-coordinator-subagent-compaction-roast-design-2.md

approvals:
- design-review · approved (2026-10-15, "lgtm" — after the two authoring tabs' review; their findings applied: subagent-in-worktree refusal, two Claude Code compact entries with a full-size card, SDD left unchanged, oversized as judgment, roast-code digest without self-reports, stale bead text regenerated)
- graph-change · human · applied: drop super-plan-goq.5 <- super-plan-goq.11; narrow super-plan-goq.6 <- super-plan-goq.5 to super-plan-goq.19 <- super-plan-goq.5 (depth 8→5)
- finish · human (2026-10-15, mid-run message) · once the integration branch is ready with all changes, nudge the herdr "main" tab to merge it into main and cut a release with a major version bump
- top-split · auto · super-plan-goq.1 LEAF, super-plan-goq.2 LEAF, super-plan-goq.3 LEAF, super-plan-goq.4 LEAF, super-plan-goq.5 LEAF, super-plan-goq.6 LEAF, super-plan-goq.7 LEAF, super-plan-goq.8 LEAF, super-plan-goq.9 LEAF, super-plan-goq.10 LEAF, super-plan-goq.11 LEAF, super-plan-goq.12 LEAF, super-plan-goq.13 LEAF, super-plan-goq.14 LEAF, super-plan-goq.15 LEAF, super-plan-goq.16 LEAF, super-plan-goq.17 LEAF, super-plan-goq.18 LEAF
- coverage-round-1 · canonical R-list: R1–R13 per coverage-round-1-requirements.md, plus R14 "a coordinator registers its marker under the session id the hook receives", R15 "an end-to-end smoke shows the re-inject on each hook configuration, with its negative cases", R16 "Codex wait behaviour is explicitly scoped" · requirements: 13 · mapped: 13 · unmapped: 0 · auto GAP "R9 improvised history/assess" → .11 consumes Assembler, dep .12; auto UNOWNED-SEAM "marker session id" → owned in .2, recorded in .1, matched in .7; auto GAP "end-to-end re-inject" → leaf super-plan-goq.19 (Configuration smoke); auto GAP "wiring deps" → deps .9/.10→.2,.4,.5,.18 and .14→.4; auto GAP "R6 keepalive owner" → .9 owns; auto GAP "R4 prune caller" → .2 register prunes; auto GAP "ledger-digest owner" → rejected (existing script, unchanged); auto GAP "Codex idle compaction scope" → spec §A6 note; auto UNOWNED-SEAM "config.contextWindows" → .18 owns shape; auto UNOWNED-SEAM "coordinator card vs rules" → .5 deps .4,.8,.11; auto UNOWNED-SEAM "path handoff" → .11 consumes Final-answer rule; auto UNOWNED-SEAM "report file format" → .4 owns recognised formats, .12/.13 consume; auto GAP "R3 in task lines" → covered by super-plan-goq.19 negative cases
- coverage-round-2 · R-list read back from round 1, plus R17 "planner tasks are shaped as one feature in one subsystem with checkable acceptance checklists" · requirements: 16 · mapped: 15 · unmapped: 1 (R16) · divergence: findings 13 → 15 · novel 9/15 (60%) · widening: yes · auto GAP "R16" → card owns keepalive wording (.5), .9 places it; auto GAP "R17" → .16 planner shaping; auto UNOWNED-SEAM "subsystem cluster key" → .13; auto UNOWNED-SEAM "filesToRead/surfaceTokens shape" → .16 owns; auto UNOWNED-SEAM "fits: line" → .12 owns; auto UNOWNED-SEAM "marker session id" → .2 get --cwd fallback, .6/.7; auto GAP "R14 Claude id" → .1 scope; auto UNOWNED-SEAM "nested marker" → .2/.9; auto UNOWNED-SEAM "card ordering" → wording to .5; auto GAP "R3 Cursor/Copilot" → .6; auto UNOWNED-SEAM "contextWindows" → .13 line; auto GAP "R5 read rule scope" → .9/.10; auto UNOWNED-SEAM "report format" → .8/.13; kept ".16<-.13"; rejected "live end-to-end check" (follow-on)
roastDesignRound: 2
stepBackDesign-round-1: patch — Round 1 with no recurrence history; 15 findings form four local clusters plus three standalone fixes; the §A2 single-string run block is a local flip inside one section, not a redesign.
stepBackDesign-round-2: patch — not dispatched: round 2 exited [converged] (0 Blocking); its 9 sub-Blocking findings were applied inline as spec/bead text as the punch list, no re-roast
parked:
- 2026-10-15-coordinator-subagent-compaction-roast-design-1.md · escalation · "§A1/§A3 whether a subagent's compaction fires SessionStart(source=compact) and with which session id — unverified external"
- 2026-10-15-coordinator-subagent-compaction-roast-design-1.md · escalation · "§A2 Claude Code compact-source SessionStart additionalContext injection reported silently dropped (claudeissues #28305, closed not planned) — unverified on the installed version; spike .1 now checks it"
- 2026-10-15-coordinator-subagent-compaction-roast-design-1.md · escalation · "§A6 whether a run_in_background sleep completing during a Workflow resets the idle-compaction timer — unverified; follow-on live check"
- 2026-10-15-coordinator-subagent-compaction-roast-design-1.md · escalation · "§A3 what the Codex per-hook trust hash covers — unverified; spike .1 now checks it"
- 2026-10-15-coordinator-subagent-compaction-roast-design-1.md · escalation · "§A3 effect of a malformed plugin.json hooks value on the whole plugin — unverified; spike .1 now checks it"
- 2026-10-15-coordinator-subagent-compaction-roast-design-1.md · escalation · "§A2 5 s watchdog vs run-profile discovery measured at 5–10.6 s — material dissent; addressed by session-scoped --in-flight and per-source timeouts"
- 2026-10-15-coordinator-subagent-compaction-roast-design-2.md · escalation · "§A3 whether Codex counts additionalContextLimit by tokenizer or bytes/4 — unverified; limit raised to 4000 for margin, spike .1 records honouring"
- 2026-10-15-coordinator-subagent-compaction-roast-design-2.md · escalation · "§A3 additionalContextLimit margin — engine-added duplicate of the above"
- graph-pass · graph-change · "drop super-plan-goq.5 <- super-plan-goq.11 (safe no): the card only summarises spec §B1; alone takes depth 8→6"
- graph-pass · graph-change · "narrow super-plan-goq.6 <- super-plan-goq.5 to super-plan-goq.19 <- super-plan-goq.5 (safe no): .6 stubs the spec-fixed run-digest CLI; with the drop above, depth 8→5"
- graph-pass · graph-change · "drop super-plan-goq.11 <- super-plan-goq.12 (safe no): only matters if .5 <- .11 stays"
- graph-pass · graph-change · "proposal: seam contract for hooks/run-block.sh between .6 and .7 (optional)"
roastDesignExit: converged (round 2: Should-fix 9 [converged], 0 Blocking; round 1 Blocking 1 / Should-fix 9 / Nit 5 all fixed or resolved); punch list of 9 applied inline; escalations parked (8)
graph-pass: depth 8→8 · width 2.5→2.5 · applied 0 · parked 4
graph-pass-human: depth 8→5 · width 2.5→4.0 · applied 2 (human) · declined 2 (moot drop .11<-.12; optional seam contract)
codeBuckets:
  completed: super-plan-goq.1–.20, super-plan-goq.34–.44 (31)
  escalated: 
  pendingRetry: 
  parked: 
  stalled: false
  review: not ready (fix round 1: fallback marker .gitignore not self-ignored breaks merges; Codex hook never reads the fallback marker; card lacks a Workflow-mode guard; report-verdict recogniser order; no sweep yet)
  sweep: SWEEP DEFERRED (caller-owned)
  slowness: round 1 graph-bound (depth 5, width 3 vs cap 8; edge audit: no changes); round 1 merge queue peaked at 3
  worktreesKept: 
  processSweep: stopped 0 · survived 0
roastCodeRound: 2
decision-run-profile-cases: autonomous — allow three label-kind case entries (assemble, split, close-split) in run-profile.mjs outside --in-flight so the release-checklist test passes; trivially mergeable with super-auto/run-profile-context-pass; supersedes the off-epic bead super-plan-xsa (to be closed in favour of an in-epic fix bead)
stepBackCode-round-1: patch — Round 1 found 21 independent-to-loosely-clustered defects, no recurrence; patch with five rule clusters, keep the design.
scopeFilter-round-1: [Should-fix] skills/super-code/coordinator.js:701; tests/super-code/test-run-profile.sh:337; docs/superpowers/runs/2026-10-15-coordinator-subagent-compaction/final-review-phase3.md:1 punch-list — Concerns run-profile.mjs timing classification of labels, which is out of scope (run-profile.mjs); the goal-named assemble/split behavior itself is not wrong.
scopeFilter-round-1: [Should-fix] skills/super-code/scripts/run-digest:95 in-scope — run-digest aborts on a Task-less ledger.
scopeFilter-round-1: [Should-fix] skills/super-code/scripts/run-marker:139-143 in-scope — Marker refresh drops epic/ledger.
scopeFilter-round-1: [Should-fix] skills/super-code/coordinator.js:1401; skills/super-code/coordinator.js:1402 in-scope — Split race.
scopeFilter-round-1: [Should-fix] skills/super-code/coordinator.js:1677 in-scope — Fitting inputs forced to capped.
scopeFilter-round-1: [Should-fix] skills/super-code/scripts/report-verdict:116 in-scope — Untested scope omitted.
scopeFilter-round-1: [Should-fix] skills/super-code/scripts/report-verdict:73 in-scope — Garbled verdict on a real review.
scopeFilter-round-1: [Should-fix] skills/super-code/scripts/context-preflight:121 in-scope — Wrong windows.
scopeFilter-round-1: [Should-fix] skills/super-code/scripts/dispatch-text.mjs:198; skills/super-code/scripts/dispatch-text.mjs:206 in-scope — Final-review dispatch drops arguments.
scopeFilter-round-1: [Should-fix] tests/hooks/test-run-block.sh:161 in-scope — Invented child payload.
scopeFilter-round-1: [Should-fix] tests/hooks/test-run-block.sh:109 in-scope — No truncation test.
scopeFilter-round-1: [Nit] hooks/run-block.sh:69; hooks/run-block.sh:66 in-scope — --agent main session misclassified.
scopeFilter-round-1: [Nit] skills/super-code/coordinator.js:1674 in-scope — Whitespace cluster names.
scopeFilter-round-1: [Nit] skills/super-code/coordinator.js:1775 in-scope — reviewPath without file.
scopeFilter-round-1: [Nit] skills/super-code/coordinator.js:723 in-scope — Exit 4 split path.
scopeFilter-round-1: [Nit] skills/super-code/coordinator.js:1775; skills/super-code/SKILL.md:143 in-scope — Stale SKILL.md contract.
scopeFilter-round-1: [Nit] skills/super-code/MAINTENANCE.md:1266 in-scope — Child-detection doc claim.
cluster dropped: runprofile-labels — Fix it once: add `case` entries for `assemble`, `split` and `close-split` to the run-profile.mjs kind switch; bring bead super-plan-xsa under epic super-plan-goq and close it with that fix; then check that every label coordinator.js dispatches is classified, so test-run-profile.sh passes.
scope-filter: 16 in-scope · 1 punch-listed
fixBeads-round-1: super-plan-goq.34–super-plan-goq.44 (5 cluster beads, 6 single; .44 from final-review Must-fix bead super-plan-xsa, closed as superseded)
roastCodeExit: converged
regressionPass-round-2: [Should-fix] hooks/session-start-codex:17; hooks/session-start-codex:19 + [Should-fix] hooks/session-start-codex:17 → one fix bead (Codex fallback marker); no step-back, no scope filter, no re-roast
finalReviewException: autonomous once-per-run — Must-fix correctness items from final-review-fixloop-r1.md in goal-named paths filed as fix beads (fallback-marker .gitignore, card Workflow guard, report-verdict order incl. roast r2 [Should-fix] report-verdict:152), one re-entry before the phase-6 sweep; covered by the post-cap audit
