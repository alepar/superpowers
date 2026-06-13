# Superpowers Design Specs — Index

Catalog of the design specs in this directory, newest first. The brainstorming look-around reads this to find adjacent prior designs and resurface past decisions, so keep summaries and tags meaningful.

**Status vocabulary:** `draft` (written, not yet implemented) · `implemented` (built and integrated) · `superseded-by: <file>` (replaced by a later design).

**Maintenance:** brainstorming adds a row with status `draft` when it writes a spec; finishing-a-development-branch flips the status to `implemented` (or `superseded-by`) when the work completes.

| Date | Title | Spec | Summary | Status | Tags |
|------|-------|------|---------|--------|------|
| 2026-06-13 | Workflow-Coordinated Autonomous Implementation | [link](2026-06-13-workflow-coordinated-autonomous-implementation-design.md) | A background dynamic Workflow coordinates a `bd ready` loop: per-task worktrees branched from an epic integration branch, model-tiered plan(opus)→impl/review(sonnet) pipeline, serial merge-back, blocker-bead escalation that notifies+quarantines+continues rather than freezing. Refines subagent-driven-development beads mode. | draft | beads, subagent, parallel, workflow, worktrees, autonomous, coordinator |
| 2026-06-08 | Design Continuity & Worktree Lifecycle | [link](2026-06-08-design-continuity-and-worktree-lifecycle-design.md) | INDEX + read adjacent designs on look-around; post-implementation notes folded back into specs; brainstorming starts in an isolated worktree, cleaned up once commits are preserved. | implemented | brainstorming, worktrees, spec-lifecycle, INDEX, design-memory |
| 2026-06-06 | Design Modes & Beads-Driven Execution Workflow | [link](2026-06-06-design-modes-and-beads-workflow-design.md) | Two brainstorming design modes (collaborative/one-shot); beads epic execution when bd is available; always-subagent, disjoint-file parallel execution. | implemented | brainstorming, design-modes, beads, subagent, parallel |
| 2026-04-06 | Worktree Rototill: Detect-and-Defer | [link](2026-04-06-worktree-rototill-design.md) | Defer to harness-native worktree support instead of hardcoded superpowers paths/commands. | implemented | worktrees, harness, detect-and-defer |
| 2026-03-23 | Codex App Compatibility | [link](2026-03-23-codex-app-compatibility-design.md) | Make the worktree and finishing skills work in the Codex App's sandboxed worktree environment. | implemented | codex, worktrees, finishing, compatibility |
| 2026-03-11 | Zero-Dependency Brainstorm Server | [link](2026-03-11-zero-dep-brainstorm-server-design.md) | Replace the brainstorm companion server's vendored node_modules with a single zero-dependency server.js using Node built-ins. | implemented | brainstorm-server, zero-dependency, node |
| 2026-02-19 | Visual Brainstorming Refactor | [link](2026-02-19-visual-brainstorming-refactor-design.md) | Browser shows visuals while the terminal stays free for user input during visual brainstorming. | implemented | brainstorming, visual-companion, browser, tui |
| 2026-01-22 | Document Review System | [link](2026-01-22-document-review-system-design.md) | Add spec-review and code-review stages to the superpowers workflow. | implemented | review, workflow, spec-review, code-review |
