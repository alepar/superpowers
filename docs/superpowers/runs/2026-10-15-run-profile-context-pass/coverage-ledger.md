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
