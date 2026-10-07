---
name: using-superpowers
description: Use when you want an overview of the available Superpowers skills or help choosing an optional workflow.
---

# Superpowers skills

Superpowers is a collection of optional workflows for design, implementation, debugging, and review. Routine coding and debugging can proceed with the agent's normal reasoning and tools, without a first-response skill check, automatic brainstorming, or an extra design or permission pause.

For substantial work combining design and implementation, consider `super-auto` if a structured end-to-end workflow would help. It uses a beads (`bd`) task tracker and coordinates design, review, implementation, and finishing. It is an option, not a prerequisite.

## Available workflows

- **Design and planning:** `brainstorming` for collaborative idea refinement; `writing-plans` for implementation plans; `super-design` for designing and decomposing a goal into a task tree.
- **Implementation:** `executing-plans` for a written plan with checkpoints; `subagent-driven-development` for independent plan tasks in this session; `super-code` for executing an existing beads epic; `super-auto` for combined design and implementation.
- **Quality:** `test-driven-development` for a test-first approach; `systematic-debugging` for root-cause investigation; `verification-before-completion` for checking completion claims.
- **Review:** `requesting-code-review` and `receiving-code-review` for review and feedback; `super-roast` for adversarial review of a design or code change.
- **Workspace and delivery:** `using-git-worktrees` for isolated work; `dispatching-parallel-agents` for independent tasks; `finishing-a-development-branch` for integration and cleanup.
- **Skill maintenance:** `writing-skills` for developing and evaluating skills; `upstream-feedback` for explicitly requested upstream skill feedback or a selected workflow's finish hook.

When the user explicitly requests a skill, or a selected workflow calls another skill, load it through the harness's skill mechanism and follow that workflow. Its own checkpoints still apply, subject to the user's instructions. The catalog alone does not select a workflow.

## Harness references

If you choose a workflow and need tool mappings, see the relevant reference:

- Codex: `references/codex-tools.md`
- Pi: `references/pi-tools.md`
- Antigravity: `references/antigravity-tools.md`
- Hermes Agent: `references/hermes-tools.md`
- Gemini CLI: `references/gemini-tools.md`
