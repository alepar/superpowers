# super-plan-zhk: where the herdr commit policy escaped

## Evidence available
- Original run artifacts (plan file, frozen briefs, implementer transcripts, pre-rewrite commit objects) are NOT available. The run ran on another machine (/var/home/alepar/...). The local clone ~/AleCode/herdr is at 5608de06. It has no a900f967, no docs/superpowers/runs and no p2-before-msg-rewrite tag.
- Triage bundle: /private/tmp/superpowers-mosh-phase2-triage-9tg/.

## Established facts
1. The policy existed in two places.
   - herdr-AGENTS.md:237: "Use lowercase conventional commits, no emojis, and no AI co-author lines."
   - Epic mosh-hex Global Constraints (task-tree-r2.json, epic description): "Conventional-commit messages without AI co-author lines (repo AGENTS.md)."
2. herdr has AGENTS.md and no CLAUDE.md (checked the local clone; `git show a900f967:CLAUDE.md` is not resolvable, and the master tree has none). Claude Code loads CLAUDE.md, not AGENTS.md. So a Claude Code subagent learns the AGENTS.md rule only from text a prompt gives it.
3. Every offending trailer reads `Co-Authored-By: Claude Sonnet 5.5`. These are the six commits 3c79a360, 84e801c6, b34b4f85, bf412b27, c2705d1b and 952fcdfd, plus 66 Phase 1 commits (final-review inv-caeccbf2 line 24). The run profile sets implementer, reviewer and assembler to the Sonnet tier, and the planner and final review to the Opus tier (run.md:7). friction.md:7 names b34b4f85, bf412b27, c2705d1b and 952fcdfd as implementer commits. Merge commits are not involved: reviewers count "six of the ten Phase 2 non-merge commits" (final-review inv-d1b970ad:29). Four of the ten non-merge commits were clean, so compliance was inconsistent, not absent.
4. The harness instructs agents to add the trailer. The roast's judged Nit (roast-pr-1.md:88) says: "the session's attribution reminder asks for such trailers, but the project's AGENTS.md rule governs commits". Claude Code dispatched agents get the attribution system-reminder ("End git commit messages with: Co-Authored-By: Claude <model>"). That reminder yields only to "CLAUDE.md or memory" rules. It does not name AGENTS.md.
5. The super-code commit-making prompts carry no commit-message policy.
   - skills/super-code/implementer-prompt.md:133-145 ("## Commit"): branch, rebase and clean-status mechanics only. It says nothing about the message, the project's instruction files, or the brief's constraints. The fix pass reuses it (implementer-prompt.md:212, "Commit as in 'Commit'"). That covers the fixer, the seam fixer and the merge-check fixer (coordinator.js:2714-2718).
   - The implementer reads the brief (implementer-prompt.md:56-57), which should contain the Global Constraints. The planner copies them verbatim into each `## Task N` (planner-prompt.md:38-39, 103-104; coordinator-workflow.md:1017). Whether the mosh-hex plan sections actually held the bullet cannot be verified: the plan and briefs are missing.
   - Merge step: `git commit --no-edit` (coordinator.js:2848-2849). Stack merges use an explicit `-m "stack: <p>"` (coordinator.js:2632). Neither is an implicated vector.
   - No super-code prompt tells an agent to read the repo's AGENTS.md or CLAUDE.md commit rules. AGENTS.md appears only for the test sweep envelope (coordinator.js:2820; SKILL.md:138).
6. Grading
   - The task reviewer for mosh-hex.6 logged `[attribution-line]` as a minor. The rubric is task-reviewer-prompt.md:151-164: Important means "a missed requirement..."; Minor means "everything else, including polish, naming ... style". Commit metadata reads naturally as style, and the rubric has no line on violating an explicit constraint carried in the brief.
   - The task reviewer's package lists commits with `git log --oneline` (subagent-driven-development/scripts/review-package:51). That shows subjects only, never bodies or trailers. Detection therefore depends on the reviewer happening to look. Only one of four affected tasks was flagged.
   - The roast confirmed it as a Nit, "Metadata only" (roast-pr-1.md:88; judge-seat-prompts.md:70-75 defines Nit as "real but low-impact"). The scope filter then punch-lists non-goal and style items (super-auto/scope-filter-prompt.md:34).
   - Three final reviews regraded it to Important or must-fix (inv-d1b970ad:29,43; inv-caeccbf2:34 "misgraded"; inv-d659cb48:40). The phase 6 rewrite followed (friction.md:13).

## Root cause verdict
Not fully established. What the evidence supports:
- Most likely: the policy was propagated as passive brief text but did not reach the point of the commit. At commit time the implementer has (a) a commit step with no message guidance and (b) a live harness reminder telling it to add the trailer. AGENTS.md was not auto-loaded, and the reminder does not yield to it. Inconsistent compliance (6 of 10) fits a contested instruction better than an absent one.
- Cannot rule out: the planner dropped or paraphrased the Global Constraints bullet from some task sections (the plan file is unavailable), or 3c79a360 and 84e801c6 came from a fix-bead implementer whose brief differed.
- Ruled out: merge commits and coordinator merge steps (`--no-edit`).
- Not established: the coordinator or orchestrator as author. Every trailer names the Sonnet tier, which the run assigned to implementers. The top-level session model is not recorded.

## Smallest generic correction
1. implementer-prompt.md, "## Commit" (around line 133): add one generic rule. Commit messages follow the commit rules in the repository's instruction files (AGENTS.md, CLAUDE.md, CONTRIBUTING) and in the brief's Global Constraints. Where those rules conflict with a harness default attribution or trailer instruction, the project's rules win. The fix pass inherits this through "Commit as in 'Commit'". This bans nothing globally; it only defers to the project.
2. task-reviewer-prompt.md, Severity (around line 155): violating an explicit project or brief constraint, including commit-message policy, is a missed requirement, so Important, not style. The reviewer should check `git log --format=%B [BASE]..[HEAD]` when the brief carries a commit policy. Alternatively, change review-package:51 to print full messages, a one-line change shared with SDD.
3. Optional: judge-seat-prompts.md severity gets one line: a confirmed violation of an explicit repository instruction is at least Should-fix. Skip this if (2) is judged enough. Final review already graded it correctly.
Excluded per the constraints: a hardcoded trailer ban, any history rewrite, a lint framework.
