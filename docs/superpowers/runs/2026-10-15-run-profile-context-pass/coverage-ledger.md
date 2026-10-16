cov-1 · r1 · flag-sweep · super-plan-fqb.2 · kept as leaf — every decision is in the spec; one-file integration; a split would serialize on run-profile.mjs
cov-2 · r1 · GAP · R14 · applied — fqb.4 widened to full-profile checks on a real Claude Workflow run, a Claude subagent session and a Codex run
cov-3 · r1 · GAP · R13 · applied — fqb.1 (unknown model → 200K default) and fqb.2 (missing/unreadable target → unmeasured record) acceptance
cov-4 · r1 · GAP · R10 · applied — fqb.2 acceptance lists the fixture matrix per format and cause
cov-5 · r1 · GAP · R8 · applied — fqb.2 owns --out integration incl. context-only
cov-6 · r1 · GAP · R11 · rejected — fqb.4's description names cx_out2.txt (the 13 runs with expected counts) and how to find the thread ids
cov-7 · r1 · UNOWNED-SEAM · Profile: context line formats and flags · applied — fqb.1 owns the formats (spec §Output lines is the contract); fqb.4 re-checks the docs after any fix
cov-8 · r1 · UNOWNED-SEAM · MAINTENANCE.md Context pass subsection · applied — fqb.3 owns it with a Validation slot for fqb.4
cov-9 · r1 · UNOWNED-SEAM · invocation matcher and window override · applied — in fqb.1's API owns line, override is Claude-only; fqb.2 consumes it
cov-10 · r1 · UNOWNED-SEAM · --codex with --context-only · applied — fqb.2 owns context-only combined with the existing --codex/--subagents/--workflow inputs
cov-11 · r1 · UNOWNED-SEAM · existing run-profile output contract · applied — fqb.2 owns backward compatibility (lines, order, exit codes, --out layout)
cov-12 · r1 · ORPHAN · super-plan-fqb.3 · applied (kept) — serves R12 (documentation), added to the canonical list
cov-13 · r2 · GAP · R13 · applied — fqb.1 owns the unmeasured state (no usage rows → peak null + reason) and its rendering; fqb.2 matrix adds a no-usage transcript
cov-14 · r2 · GAP · R9 · applied — fqb.2: no invocation found → rows from the session's first row, noted on the unmeasured line; fixture added to the matrix
cov-15 · r2 · GAP · R14 · applied — fqb.4 names sources: this run's own Workflow code phase, the Claude coordinator sessions in cc_coord_out.txt, any local subagents/ session, one of the 13 Codex runs; absent kinds recorded as uncovered
cov-16 · r2 · UNOWNED-SEAM · fqb.4 consumed interfaces · applied — fqb.4 consumes full-profile and context-only inputs; fixes land in the owning module with a regression fixture
cov-17 · r2 · UNOWNED-SEAM · flag names · applied — fqb.2: spec sections are the flag contract; a change updates the spec
cov-18 · r2 · GAP · R3 · applied — fqb.2 states the workflow lister finds <session>.jsonl three levels up (already in spec §Which agents and the Context targets digest; made explicit)
cov-19 · r2 · GAP · R5 · applied — fqb.1 owns compaction-request accounting and window over time (its acceptance already had both cases; owns line added); fqb.2 matrix adds both
cov-20 · r2 · UNOWNED-SEAM · AgentContext unmeasured variant · applied — merged with cov-13
cov-21 · r2 · UNOWNED-SEAM · Codex fork point · applied — codexContext detects replayed history itself from session_meta; caller passes no fork point
cov-22 · r2 · UNOWNED-SEAM · coordinator cutoff argument · applied — readers take an inclusive fromRow index computed with the matcher
cov-23 · r2 · GAP · R12 · applied — fqb.3 states super-auto readers reach run-profile through super-code; no super-auto doc change
cov-24 · r2 · GAP · ledger-ready lines reach the ledger · rejected — super-code's Finish already records every run-profile `Profile:` line on the ledger (SKILL.md, spec §Documentation); the new lines are `Profile:` lines
cov-25 · graph · GRAPH-EDGE · super-plan-fqb.4 <- super-plan-fqb.2 · kept — fqb.4 runs the CLI flags and wiring fqb.2 lands
cov-26 · graph · GRAPH-EDGE · super-plan-fqb.2 <- super-plan-fqb.1 · kept — fqb.2 consumes the context-pass module API and matchers
