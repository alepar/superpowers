R1 For every agent of a run (coordinator and each dispatched agent) run-profile reports peak context, window, peak% and first-request context
R2 Every compaction is reported with its cause: cap, early, idle or manual
R3 It works on Claude Code Workflow runs (Workflow agents plus the coordinator session)
R4 It works on Claude Code ordinary-subagent runs (subagents plus the calling session)
R5 It works on Codex runs: coordinator plus spawn_agent descendants, forked children counted only from their own history start, compaction requests included, window tracked over time
R6 The coordinator is counted from its super-auto/super-code invocation row
R7 Ledger-ready per-agent lines (agents over threshold or compacted) and a run summary line are printed
R8 --out writes the context data as a Markdown table and in the JSON
R9 A context-only mode measures any session without a profiled super-code run
R10 Fixture tests in tests/super-code/test-run-profile.sh cover every transcript format
R11 The pass is validated against the 13 real Codex super-auto runs
R12 The context lines, flags and maintenance notes are documented where super-code, super-auto and upstream-feedback readers look (SKILL.md, MAINTENANCE.md, the upstream-feedback report template)
R13 Agents whose transcripts lack usage data, or are missing or unreadable, are reported as unmeasured and never abort the run
R14 The full profile (not only context-only) is checked on real runs of each harness type
R15 Existing run-profile outputs, exit codes and --out layout are unchanged apart from the added context data
