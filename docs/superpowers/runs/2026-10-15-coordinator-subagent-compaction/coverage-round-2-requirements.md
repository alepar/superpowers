R1 After a compaction on Claude Code, a super-auto or super-code coordinator receives the run's live state and core rules through the SessionStart hook
R2 After a compaction on Codex, a super-auto or super-code coordinator receives the run's live state and core rules through a Codex hook, without re-registering the Claude bootstrap
R3 The re-inject hook never breaks a session: output is unchanged with no live marker or a non-compact source, and a failing or slow digest yields a fallback block
R4 Run markers are registered, refreshed and cleared across the super-auto and standalone super-code run lifecycles, and stale markers expire
R5 The coordinator reads only what it needs to route work: children return a verdict line plus a report path, and the coordinator reads child reports through a verdict extractor
R6 Coordinator Workflow waits on Claude Code no longer trigger idle compaction
R7 Every fix round, re-review and re-assessment is a fresh agent with a path handoff, on Codex and in the ordinary-subagent coordinator
R8 Improvised coordinator dispatches carry bounded briefs (inputs, one output, scope, checklist, one job)
R9 Read-heavy reviewers (roast-code, the final review, improvised history and assess passes) work from assembled inputs, falling back to direct inputs when assembly fails
R10 The whole-epic final review runs as one reviewer under 40% of its window and splits into cluster plus seam reviewers above it, keeping the ready/not ready verdict and treating failed cluster reviews as unreviewed
R11 Design leaves are one feature in one subsystem with checkable acceptance checklists
R12 Planner tasks carry filesToRead and surfaceTokens, and oversized beads can be split through a validated proposal in both coordinators
R13 A warn-only context pre-flight records each role's window in the ledger and run.md and feeds the final review's window
R14 A coordinator registers its run marker under the same session id the compaction hook receives, on Claude Code and Codex
R15 An end-to-end smoke shows the re-inject on each hook configuration, with its negative cases
R16 Codex wait behaviour is explicitly scoped
R17 Planner tasks are shaped as one feature in one subsystem with checkable acceptance checklists
