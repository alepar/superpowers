requirements:
R1 → super-plan-fqb.1, super-plan-fqb.2
R2 → super-plan-fqb.1
R3 → super-plan-fqb.1, super-plan-fqb.2
R4 → super-plan-fqb.1, super-plan-fqb.2
R5 → super-plan-fqb.1, super-plan-fqb.2
R6 → super-plan-fqb.2, super-plan-fqb.1
R7 → super-plan-fqb.1, super-plan-fqb.2
R8 → super-plan-fqb.1, super-plan-fqb.2
R9 → super-plan-fqb.2
R10 → super-plan-fqb.1, super-plan-fqb.2
R11 → super-plan-fqb.4
R-new: Usage and flags are documented where super-code users and maintainers look (SKILL.md, MAINTENANCE.md, upstream-feedback template) → super-plan-fqb.3
R-new: Agents whose transcripts lack usage data, or are missing or unreadable, are reported as unknown/skipped, and the run does not abort → (unmapped)
R-new: The full-profile mode is checked end to end on at least one real run per harness type → (unmapped)

Findings (summary): GAP real full-profile validation on Claude Code + Codex; GAP degraded/missing usage data; UNOWNED-SEAM line formats/flags (fqb.1/fqb.2 → fqb.3); UNOWNED-SEAM MAINTENANCE subsection (fqb.3 → fqb.4); UNOWNED-SEAM invocation matcher missing from fqb.1 API; UNOWNED-SEAM --context-window precedence and threshold; UNOWNED-SEAM --codex with --context-only; ORPHAN fqb.3 (keep, docs R-new); GAP (ledger cov-1) fixture matrix not listed.
