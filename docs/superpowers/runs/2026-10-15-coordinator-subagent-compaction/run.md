# super-auto run — 2026-10-15-coordinator-subagent-compaction

flags: planOneShot=t skipPlanRoast=f skipCodeRoast=f autonomous=f
phase: roast-design
codeMechanism: Workflow

idea: Implement both vision specs in one run: docs/superpowers/specs/2026-10-15-vision-coordinator-compaction.md and docs/superpowers/specs/2026-10-15-vision-subagent-compaction.md. One-shot design; pause once design is done so the user can review the split into beads; fully autonomous after that. Both roasts on. The herdr tabs "coordinator-compaction" and "subagent-compaction" in this workspace authored the visions and can be consulted about decision rationale while writing the design spec.
branch: super-auto/coordinator-subagent-compaction
base: main
spec: 2026-10-15-coordinator-subagent-compaction-design.md
epic: super-plan-goq
roast-design: 2026-10-15-coordinator-subagent-compaction-roast-design-1.md, 2026-10-15-coordinator-subagent-compaction-roast-design-2.md

approvals:
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
roastDesignExit: converged (round 2: Should-fix 9 [converged], 0 Blocking; round 1 Blocking 1 / Should-fix 9 / Nit 5 all fixed or resolved); punch list of 9 applied inline; escalations parked (8)
