# super-auto run — 2026-10-15-coordinator-subagent-compaction

flags: planOneShot=t skipPlanRoast=f skipCodeRoast=f autonomous=f
phase: design
codeMechanism: Workflow

idea: Implement both vision specs in one run: docs/superpowers/specs/2026-10-15-vision-coordinator-compaction.md and docs/superpowers/specs/2026-10-15-vision-subagent-compaction.md. One-shot design; pause once design is done so the user can review the split into beads; fully autonomous after that. Both roasts on. The herdr tabs "coordinator-compaction" and "subagent-compaction" in this workspace authored the visions and can be consulted about decision rationale while writing the design spec.
branch: super-auto/coordinator-subagent-compaction
base: main
spec: 2026-10-15-coordinator-subagent-compaction-design.md
epic: super-plan-goq

approvals:
- top-split · auto · super-plan-goq.1 LEAF, super-plan-goq.2 LEAF, super-plan-goq.3 LEAF, super-plan-goq.4 LEAF, super-plan-goq.5 LEAF, super-plan-goq.6 LEAF, super-plan-goq.7 LEAF, super-plan-goq.8 LEAF, super-plan-goq.9 LEAF, super-plan-goq.10 LEAF, super-plan-goq.11 LEAF, super-plan-goq.12 LEAF, super-plan-goq.13 LEAF, super-plan-goq.14 LEAF, super-plan-goq.15 LEAF, super-plan-goq.16 LEAF, super-plan-goq.17 LEAF, super-plan-goq.18 LEAF
- coverage-round-1 · canonical R-list: R1–R13 per coverage-round-1-requirements.md, plus R14 "a coordinator registers its marker under the session id the hook receives", R15 "an end-to-end smoke shows the re-inject on each hook configuration, with its negative cases", R16 "Codex wait behaviour is explicitly scoped" · requirements: 13 · mapped: 13 · unmapped: 0 · auto GAP "R9 improvised history/assess" → .11 consumes Assembler, dep .12; auto UNOWNED-SEAM "marker session id" → owned in .2, recorded in .1, matched in .7; auto GAP "end-to-end re-inject" → leaf super-plan-goq.19 (Configuration smoke); auto GAP "wiring deps" → deps .9/.10→.2,.4,.5,.18 and .14→.4; auto GAP "R6 keepalive owner" → .9 owns; auto GAP "R4 prune caller" → .2 register prunes; auto GAP "ledger-digest owner" → rejected (existing script, unchanged); auto GAP "Codex idle compaction scope" → spec §A6 note; auto UNOWNED-SEAM "config.contextWindows" → .18 owns shape; auto UNOWNED-SEAM "coordinator card vs rules" → .5 deps .4,.8,.11; auto UNOWNED-SEAM "path handoff" → .11 consumes Final-answer rule; auto UNOWNED-SEAM "report file format" → .4 owns recognised formats, .12/.13 consume; auto GAP "R3 in task lines" → covered by super-plan-goq.19 negative cases
