# super-auto run — 2026-10-15-run-profile-context-pass

flags: planOneShot=t skipPlanRoast=f skipCodeRoast=f autonomous=t
phase: roast-design
spec: 2026-10-15-run-profile-context-pass-design.md
epic: super-plan-fqb
roastDesignRound: 2
roast-design: 2026-10-15-run-profile-context-pass-roast-design-1.md
codeMechanism: Workflow

idea: Add a per-agent context pass to skills/super-code/scripts/run-profile.mjs — per agent peak context, window, peak%, first-request context, compactions with cause (cap/early/idle/manual) — for Claude Code (root session, ordinary subagents, Workflow agents) and Codex (coordinator + spawn_agent children, forked children counted from subagent_history_start_ordinal, compaction requests included, window tracked over time; coordinator counted from the super-auto invocation row). Output `Context:` lines per agent over threshold or compacted and a `Metrics: context` summary line, plus Markdown/JSON. Fixture tests in tests/super-code/test-run-profile.sh. Method and exact field paths: ~/Documents/Agent_Context_Peak_Research_20261015/final_report.md; validated against the 13 real Codex super-auto runs (scan: ~/Documents/Agent_Context_Peak_Research_20261015/cx_compact.py, cx_out2.txt).
branch: super-auto/run-profile-context-pass
base: main

approvals:
- top-split · auto · super-plan-fqb.1 LEAF, super-plan-fqb.2 LEAF (reviewer PROMOTE, overruled: sp:demoted-by-session), super-plan-fqb.3 LEAF, super-plan-fqb.4 LEAF
- coverage-round-1 · R1–R11 canonical (coverage-round-1-requirements.md), R12–R15 appended from r-new · requirements: 11 · mapped: 11 · unmapped: 0 · cov-1 flag-sweep kept auto · cov-2..cov-5 GAP applied auto · cov-6 GAP rejected auto · cov-7..cov-11 UNOWNED-SEAM applied auto · cov-12 ORPHAN kept auto
- coverage-round-2 · cov-13..cov-23 applied auto · cov-24 rejected auto · divergence: findings 11 → 12, novel 10/12 (83%), widening: yes (cap kept at two rounds; the design roast reviews round 2's fixes) · NEEDS-SPEC super-plan-fqb.1 answered by owns lines pointing at the spec sections (no re-dispatch) · integration sweep super-plan-fqb.5 created

parked:
- 2026-10-15-run-profile-context-pass-roast-design-1.md · escalation · "Resumed/forked Claude Code sessions may replay parent compact_boundary rows (unverified; local corpus: 49 boundary uuids, none duplicated across files)"
- 2026-10-15-run-profile-context-pass-roast-design-1.md · escalation · "Whether Claude Code ever writes a [1m] suffix into message.model is unverified (no local 4.6 or [1m] transcript)"
- 2026-10-15-run-profile-context-pass-roast-design-1.md · escalation · "Subagent/Workflow-agent compact_boundary format unobserved locally (docs state it is logged; no local subagent ever compacted)"
- 2026-10-15-run-profile-context-pass-roast-design-1.md · escalation · "Whether a resumed Codex thread's later rollout replays earlier compacted rows is unverified (no local thread has two rollouts)"

stepBackDesign-round-1: patch — Round 1's 11 findings are independent spec gaps in three clusters (coordinator cutoff, per-row window/model, null and unmeasured rendering) plus two one-off fixes; sweep each cluster with one rule and keep the design
