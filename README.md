# Superpowers (alepar fork)

A fork of [Superpowers](https://github.com/obra/superpowers), a skill library for coding agents, based on upstream v6.4.2. It supports two harnesses (the agent CLI or app that runs the skills): Claude Code and Codex.

Superpowers for large-scope autonomous software development. Give it a vision and it designs the system, breaks it into a tree of tasks, builds them in parallel and reviews its own work adversarially at each stage. A typical run lasts 12 hours or more and dispatches over a hundred subagents, so it uses a lot of tokens; a high-usage plan is recommended.

## How a run works

<!-- Diagram source: docs/images/lifecycle.mmd, rendered with pele 1.6.0 (https://pele.run) into light and dark SVGs. -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/lifecycle-dark.svg">
    <img alt="A run's lifecycle: a goal or vision doc goes into super-design, which brainstorms a spec, names key abstractions and decomposes it into tasks, looping back to brainstorm any task too big to build directly, then checks the task tree against the goal. super-roast reviews the design; findings go to a step back or fix and back to review. Once clean, super-code runs tasks in parallel (plan, implement, review, merge), then super-roast reviews the code, with findings again going to step back or fix and back to super-code. Once clean, the run writes a report and you choose to merge, open a PR or keep the branch." src="docs/images/lifecycle-light.svg" width="535">
  </picture>
</p>

`super-auto` runs this whole sequence from one invocation, and can run it autonomously, without stopping for questions. Each step also works on its own: `super-roast` reviews any PR or design doc, and `super-code` executes an epic (a beads parent task with child tasks) you decomposed by hand.

- **Recursive design.** `super-design` turns a goal into a spec and decomposes the spec into a task tree. Any task too large to build directly gets its own spec and decomposition, recursively. Before execution starts, the finished tree is checked against the original goal.
- **Seams and interfaces up front.** Before each spec is decomposed, a fresh agent names its key abstractions so each one gets a single owner. Tasks that share an interface declare which one owns it and which consume it, and `super-code` reviews each seam again before merging, after rebasing onto sibling changes.
- **Adversarial review.** `super-roast` reviews designs before they are built and code before it is merged. Scouts hunt for defects and unverified assumptions, then three judges check each serious candidate by different methods (reproduce, refute, ground); minor ones get a single spot check. Severity is scaled to the project, so a prototype is not held to a payments-service bar.
- **Redesign step-backs.** Before each fix round, a fresh agent asks whether a higher-level change to the design would remove findings that local fixes keep failing to close, and if so the run redesigns instead of patching again.
- **Parallel execution with task splitting.** Each task runs in its own git worktree, so up to 14 run at once (the harness runs at most 16 agents, fewer on small machines, and two slots stay free for merges). A task's dependents start as soon as it is implemented. Tasks too large for one session are split before dispatch, and `super-design` cuts dependencies that only fix an order, so the longest chain gets shorter.
- **Test reliability and cost.** When a reviewed change touches tests or test infrastructure, `super-roast` adds reviewers for timing-dependent tests, tests that interfere with each other, and avoidable test overhead such as idle sleeps and repeated setup. Their fixes keep what each test checks: no retries, skips or weaker assertions.
- **State is stored in beads.** The task tree and run state are kept in [beads](https://github.com/gastownhall/beads) (`bd`), an issue tracker built for coding agents, rather than in the conversation, so a run survives context compaction and session restarts.

## Quick start

**Prerequisite for `super-auto` and `super-code`:** install [beads](https://github.com/gastownhall/beads) (`bd`), for example `brew install beads`, then run `bd init` in the repository you want to work on. `super-roast` needs nothing extra.

**Claude Code** (slash commands, typed inside Claude Code):

```text
/plugin marketplace add alepar/superpowers
/plugin install superpowers@superpowers-alepar
```

**Codex** (CLI; the Codex app uses the same plugins):

```bash
codex plugin marketplace add alepar/superpowers
codex plugin add superpowers@superpowers-alepar
```

**Two things to try first:**

1. **Review code you already have.** Ask your agent: *"Use super-roast to review this branch against main."* Nothing is changed. You get a report of verified findings ranked by severity.
2. **Hand over a small project.** Write a short vision doc (what to build, for whom, what done looks like), then ask: *"Use super-auto on docs/vision.md, autonomous."* Expect the run to take hours. It ends with a report and asks you whether to merge.

## Other harnesses (best effort)

The fork also ships manifests for these harnesses. They are not tested with the fork. If one breaks, please [open an issue](https://github.com/alepar/superpowers/issues).

| Harness | Install the fork |
|---|---|
| Antigravity | `agy plugin install https://github.com/alepar/superpowers` |
| Devin CLI | `devin plugins install alepar/superpowers` |
| Gemini CLI | `gemini extensions install https://github.com/alepar/superpowers` |
| GitHub Copilot CLI | `copilot plugin marketplace add alepar/superpowers`, then `copilot plugin install superpowers@superpowers-alepar` |
| Hermes Agent | `hermes plugins install alepar/superpowers --enable` |
| Kimi Code | `/plugins install https://github.com/alepar/superpowers` ([details](docs/README.kimi.md)) |
| OpenCode | Tell OpenCode: `Fetch and follow instructions from https://raw.githubusercontent.com/alepar/superpowers/refs/heads/main/.opencode/INSTALL.md` ([details](docs/README.opencode.md)) |
| Pi | `pi install git:github.com/alepar/superpowers` |
| Cursor | Cursor's marketplace lists upstream Superpowers, not this fork. Clone this repository and load it as a local plugin. |

## Skills

Skills are used when you ask for them, for example *"Use super-roast…"*. Routine coding proceeds without them.

| Skill | What it does |
|---|---|
| **Added by this fork** | |
| `super-auto` | Runs the whole lifecycle above from one goal, optionally autonomous |
| `super-design` | Turns a goal into a recursively designed task tree in beads |
| `super-roast` | Adversarial review of a design doc, or of a PR, branch or diff |
| `super-code` | Executes a beads epic with parallel tasks in separate worktrees |
| `upstream-feedback` | Drafts an issue for the skill repository about problems a run hit with the skills, filed only with your approval |
| **From upstream Superpowers** | |
| `brainstorming` | Refines a rough idea into a written design through questions |
| `writing-plans` | Breaks an approved design into small, verifiable tasks |
| `subagent-driven-development` | Executes a plan with a fresh subagent and a review per task |
| `executing-plans` | Executes a plan task by task in this session, stopping on blockers (used when subagents aren't available) |
| `test-driven-development` | Red, green, refactor |
| `systematic-debugging` | Finds the root cause before fixing |
| `verification-before-completion` | Checks that something works before claiming it does |
| `requesting-code-review`, `receiving-code-review` | Asking for review, and responding to it |
| `using-git-worktrees` | Isolated workspaces on new branches |
| `dispatching-parallel-agents` | Runs independent tasks concurrently |
| `finishing-a-development-branch` | Merge, PR or keep, then clean up |
| `writing-skills` | Creates and tests new skills |
| `using-superpowers` | Overview of the skills and when to use them |

## Upstream

Upstream [Superpowers](https://github.com/obra/superpowers) is by Jesse Vincent and Prime Radiant. For the methodology behind the upstream skills, community, commercial support and contributing, see the upstream repository. Issues with this fork go to [alepar/superpowers](https://github.com/alepar/superpowers/issues).

## License

MIT License - see LICENSE file for details
