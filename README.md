# Superpowers

Superpowers is a complete software development methodology for your coding agents, built on top of a set of composable skills and some initial instructions that make sure your agent uses them.

## ⚠️ Breaking change: the beads machinery moved out into its own skills

**If you used an earlier version of this fork, read this before upgrading.**

This fork used to bolt issue-tracker (beads / `bd`) logic *into* the upstream skills — epic decomposition lived inside `brainstorming`, and epic execution lived inside `subagent-driven-development`. That logic has been **extracted into standalone skills**, and the two upstream skills were restored to stock. `subagent-driven-development` is now byte-identical to upstream again.

| What changed | Before (older fork) | Now |
|---|---|---|
| Epic decomposition | inside `brainstorming` | `super-design` |
| Beads epic execution | inside `subagent-driven-development` | `super-code` |
| `subagent-driven-development` | fork-modified | **byte-identical to upstream** |
| Skill name | `super-plan` | **renamed `super-design`** |
| Plan execution choice | `writing-plans` asked "subagent or inline?" | always subagent-driven; `executing-plans` is an automatic no-subagent fallback |
| Worktree after PR / keep-as-is | kept on disk | **removed** once commits are preserved |

**What you need to update:** any invocation or doc that names `superpowers:super-plan` — it is now `superpowers:super-design`. If you relied on the worktree surviving after a PR was opened, re-establish a workspace when feedback arrives.

**The five new skills**

| Skill | Does |
|---|---|
| `super-design` | Turns a goal or raw idea into a fully-designed task tree — drives `brainstorming` per slice, decomposes, coverage-checks against the goal |
| `super-roast` | Adversarial review of a **design doc** or a **PR/branch/diff** — scouts, then a seat-differentiated judge panel |
| `super-code` | Drives a beads epic to finished, reviewed, merged code — parallel dispatch, per-task worktrees, serial merge-back |
| `super-auto` | Runs the whole lifecycle below in one invocation, optionally unattended |
| `upstream-feedback` | Turns a run's friction into a user-gated GitHub issue on the skill plugin's owning repository |

**A feature's lifecycle, idea to finished implementation**

```
idea
 └─ super-design ──── brainstorming (per slice) → spec
      │               decompose → promotion review → recurse
      └─ goal-coverage check ──────────────────────► task tree (epic)
 └─ super-roast (design mode) ──► findings → fix → re-roast (cap 3)
 └─ super-code ─────────────────► per-task: brief → implement → review → fix (cap 5) → merge
 └─ super-roast (PR mode) ──────► findings → beads → re-enter super-code (cap 3)
 └─ report ─────────────────────► what landed, what didn't, entrypoints, smells
 └─ finishing-a-development-branch ──► merge / PR / keep, then clean up
```

Run it one skill at a time, or hand the whole thing to **`super-auto`**, which owns exactly this sequence and nothing else. Each step is independently useful: `super-roast` reviews a PR from any source, `super-code` executes an epic you decomposed by hand.

## What this fork adds

This is a personal fork ([alepar/superpowers](https://github.com/alepar/superpowers)) that extends upstream Superpowers with a handful of additions. Everything below is on top of the standard skills described later in this README.

**New skills**

- **`super-roast` — dual-mode adversarial review.** Reviews either a **design doc** before you build it or a **PR/branch/diff** before you merge it. Parallel adversarial scouts hunt for gaps, unverified load-bearing assumptions, and defects; a **seat-differentiated judge panel** (three seats that verify by different *method* — reproduce, refute, ground — not three copies of one judge) verifies each candidate against evidence; and severity is **calibrated to the project's blast radius**, so a prototype and a payments service don't get the same bar. Catch expensive mistakes while they're still cheap to fix.
- **`super-design` — recursive spec decomposition.** Sits between an approved spec and execution: decomposes it into a task tree, runs a promotion review on each candidate, recursively brainstorms the subepics that earn their own design, and goal-coverage-checks the finished tree before hand-off. All traversal state lives in the tracker (or in the spec's task tables when `bd` isn't available), so a run survives context compaction and session restart.
- **`super-code` — beads epic execution.** Drives a beads (`bd`) epic to completion: an epic-scoped `bd ready` loop with disjoint-file parallel dispatch, per-task worktrees off an epic integration branch with serial merge-back, a five-round fix breaker that parks or blocks by upstream's own adjudication rules, and blocker beads for anything that can't proceed — autonomous or interactive, same contract either way. Delegates the per-task brief/implement/review pipeline to `subagent-driven-development` rather than reimplementing it. Hardened against live runs of real ~190-bead epics; a replay harness (`tests/super-code/`) covers the coordinator offline.
- **`super-auto` — idea to finished code, one invocation.** Sequences `super-design` (which drives `brainstorming` itself, once per slice) → `super-roast` (design) → `super-code` → `super-roast` (PR) → a fix loop → a final report → `finishing-a-development-branch`, threading four flags through every phase without reimplementing any of them. An optional autonomous mode stops asking once `super-design`'s coverage loop passes, parking escalations and beyond-cap findings for the final report instead of auto-adjudicating them. It buys an unattended **run**, not an unattended **merge**: the run drives every bead to a terminal state, writes the report, and then hands back for the integration decision, which stays the human's in every mode.

**Brainstorming & design flow**

- **Two design modes.** Mode A (collaborative, default — iterate one question at a time) vs Mode B (one-shot — the agent decides every point alone and writes the whole spec for you to review). Match the ceremony to the stakes of the design.
- **Optional `super-roast` gate.** After a spec is written, brainstorming offers to run `super-roast` on it before handing off to implementation — a heavyweight pass for designs where getting it wrong is costly. `super-design` makes the same offer once a decomposed task tree has settled, and drives the fix + re-roast loop from the report.

**Design continuity**

- **Spec INDEX + Post-Implementation Notes.** Every spec is catalogued in `specs/INDEX.md` and ends with a standing notes section; brainstorming surfaces adjacent prior designs up front, and `finishing-a-development-branch` writes back what diverged from the original. Design decisions stay discoverable across sessions instead of rotting.

**Worktree lifecycle**

- **Worktree-at-start.** An isolated worktree is created at the very beginning of brainstorming, so the spec and all subsequent work stay off your main checkout from the first file written.
- **Disposable-worktree cleanup.** `finishing-a-development-branch` now cleans up the worktree for *every* option once the commits are safely preserved (merged, pushed, or kept on a branch), instead of leaving stale worktrees behind.

**Execution defaults**

- **Always-subagent, no prompts.** `writing-plans` no longer asks "subagent or inline?" — subagent-driven execution is the default and `executing-plans` is an automatic fallback used only when the platform has no subagents. One fewer decision per run.

## Table of Contents

- [How it works](#how-it-works)
- [Commercial Services](#commercial-services)
- [Getting Started](#installation)
  - [Claude Code](#claude-code)
  - [Antigravity](#antigravity)
  - [Codex App](#codex-app)
  - [Codex CLI](#codex-cli)
  - [Cursor](#cursor)
  - [Devin CLI](#devin-cli)
  - [Factory Droid](#factory-droid)
  - [Gemini CLI](#gemini-cli)
  - [GitHub Copilot CLI](#github-copilot-cli)
  - [Grok Build CLI](#grok-build-cli)
  - [Kimi Code](#kimi-code)
  - [OpenCode](#opencode)
  - [Pi](#pi)
  - [Hermes Agent](#hermes-agent)
- [The Basic Workflow](#the-basic-workflow)
- [Community](#community)
- [What's Inside](#whats-inside)
- [Philosophy](#philosophy)
- [Contributing](#contributing)
- [Updating](#updating)
- [License](#license)
- [Visual companion telemetry](#visual-companion-telemetry)

## How it works

It starts from the moment you fire up your coding agent. As soon as it sees that you're building something, it *doesn't* just jump into trying to write code. Instead, it steps back and asks you what you're really trying to do. 

Once it's teased a spec out of the conversation, it shows it to you in chunks short enough to actually read and digest. 

After you've signed off on the design, your agent puts together an implementation plan that's clear enough for an enthusiastic junior engineer with poor taste, no judgement, no project context, and an aversion to testing to follow. It emphasizes true red/green TDD, YAGNI (You Aren't Gonna Need It), and DRY. 

Next up, once you say "go", it launches a *subagent-driven-development* process, having agents work through each engineering task, inspecting and reviewing their work, and continuing forward. It's not uncommon for your agent to work autonomously for a couple hours at a time without deviating from the plan you put together.

There's a bunch more to it, but that's the core of the system. And because the skills trigger automatically, you don't need to do anything special. Your coding agent just has Superpowers.

## Commercial Services

If you're using Superpowers in enterprise and could benefit from commercial support, additional tooling, or managed spending, please don't hesitate to drop us a line at sales@primeradiant.com.

## Installation

Installation differs by harness. If you use more than one, install Superpowers separately for each one.

> **Note:** This is a personal fork ([alepar/superpowers](https://github.com/alepar/superpowers)), published as a Claude Code marketplace named `superpowers-alepar`. Harnesses that can install from a git URL (Claude Code, Gemini, Factory Droid, Copilot, OpenCode) can pull the fork directly. Harnesses that only install from a central marketplace (Codex CLI/App, Cursor) list **upstream** Superpowers, not this fork — use a local clone for those.

### Claude Code

This fork is published as its own marketplace — the repository itself is the marketplace.

- Register the marketplace:

  ```bash
  /plugin marketplace add alepar/superpowers
  ```

- Install the plugin:

  ```bash
  /plugin install superpowers@superpowers-alepar
  ```

- Update later (after pushing changes to the fork):

  ```bash
  /plugin marketplace update superpowers-alepar
  ```

### Antigravity

Install Superpowers as a plugin from this repository:

```bash
agy plugin install https://github.com/alepar/superpowers
```

Antigravity runs the plugin's session-start hook, so Superpowers is active from
the first message. Reinstall with the same command to update.

### Codex App

Superpowers is available via the [official Codex plugin marketplace](https://github.com/openai/plugins).

- In the Codex app, click on Plugins in the sidebar.
- You should see `Superpowers` in the Coding section.
- Click the `+` next to Superpowers and follow the prompts.

That marketplace lists **upstream** Superpowers, not this fork, and there is no in-app way to install an arbitrary fork — use the Codex CLI from a local clone (below) if you need the fork.

### Codex CLI

The official Codex plugin marketplace lists **upstream** Superpowers, not this fork. To use the fork, clone the repo (it ships a `.codex-plugin/` manifest) and load it as a local plugin per Codex's local-plugin instructions:

  ```bash
  git clone https://github.com/alepar/superpowers.git
  ```

(If you only want upstream Superpowers, run `/plugins`, search `superpowers`, and select `Install Plugin`.)

### Cursor

Cursor's `/add-plugin superpowers` installs **upstream** Superpowers from Cursor's marketplace, not this fork. The repo ships a `.cursor-plugin/` manifest; to use the fork, clone it and load it as a local plugin per Cursor's docs:

  ```bash
  git clone https://github.com/alepar/superpowers.git
  ```

### Devin CLI

- Install the plugin from this repository:

  ```bash
  devin plugins install alepar/superpowers
  ```

- Update to the latest version with:

  ```bash
  devin plugins update superpowers
  ```

### Factory Droid

- Register the marketplace:

  ```bash
  droid plugin marketplace add https://github.com/alepar/superpowers
  ```

- Install the plugin:

  ```bash
  droid plugin install superpowers@superpowers-alepar
  ```

### Gemini CLI

- Install the extension:

  ```bash
  gemini extensions install https://github.com/alepar/superpowers
  ```

- Update later:

  ```bash
  gemini extensions update superpowers
  ```

### GitHub Copilot CLI

- Register the marketplace:

  ```bash
  copilot plugin marketplace add alepar/superpowers
  ```

- Install the plugin:

  ```bash
  copilot plugin install superpowers@superpowers-alepar
  ```

### Grok Build CLI

Superpowers is available via the [official Grok plugin marketplace](https://github.com/xai-org/plugin-marketplace).

- Install the plugin from xAI's official marketplace:

  ```bash
  grok plugin install superpowers@xai-official --trust
  ```

- Or open the marketplace in the TUI, search for Superpowers, and install it:

  ```text
  /marketplace
  ```

### Kimi Code

Superpowers is available in Kimi Code's plugin marketplace.

- Open Kimi Code's plugin manager:

  ```text
  /plugins
  ```

- Go to `Marketplace` > `Superpowers` and install it.

- Or install directly from this repository:

  ```text
  /plugins install https://github.com/alepar/superpowers
  ```

- Detailed docs: [docs/README.kimi.md](docs/README.kimi.md)

### OpenCode

OpenCode uses its own plugin install; install Superpowers separately even if you
already use it in another harness.

- Tell OpenCode:

  ```
  Fetch and follow instructions from https://raw.githubusercontent.com/alepar/superpowers/refs/heads/main/.opencode/INSTALL.md
  ```

- Detailed docs: [docs/README.opencode.md](docs/README.opencode.md)

### Pi

Install Superpowers as a Pi package from this repository:

```bash
pi install git:github.com/alepar/superpowers
```

For local development, run Pi with this checkout loaded as a temporary package:

```bash
pi -e /path/to/superpowers
```

The Pi package loads the Superpowers skills and a small extension that injects the `using-superpowers` bootstrap at session startup and again after compaction. Pi has native skills, so no compatibility `Skill` tool is required. Subagent and task-list tools remain optional Pi companion packages.

### Hermes Agent

Install Superpowers as a Hermes plugin from this repository:

```bash
hermes plugins install alepar/superpowers --enable
```

Restart any active Hermes sessions after installing. Note: Hermes has no
post-compaction hook, so a very long session that compacts over its first
turn loses the bootstrap — start a fresh session if skills stop triggering.

## The Basic Workflow

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.

2. **using-git-worktrees** - Activates after design approval. Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.

3. **writing-plans** - Activates with approved design. Breaks work into bite-sized tasks (2-5 minutes each). Every task has exact file paths, complete code, verification steps.

4. **subagent-driven-development** or **executing-plans** - Activates with plan. Dispatches fresh subagent per task with a task review (spec compliance + code quality) plus a broad final review, or executes in batches with human checkpoints.

5. **test-driven-development** - Activates during implementation. Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit. Deletes code written before tests.

6. **requesting-code-review** - Activates between tasks. Reviews against plan, reports issues by severity. Critical issues block progress.

7. **finishing-a-development-branch** - Activates when tasks complete. Verifies tests, presents options (merge/PR/keep/discard), cleans up worktree.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.

## Community

Superpowers is built by [Jesse Vincent](https://blog.fsck.com) and the rest of the folks at [Prime Radiant](https://primeradiant.com).

- **Discord**: [Join us](https://discord.gg/35wsABTejz) for community support, questions, and sharing what you're building with Superpowers
- **Issues**: https://github.com/alepar/superpowers/issues
- **Release announcements**: [Sign up](https://primeradiant.com/superpowers/) to get notified about new versions

## What's Inside

### Skills Library

**Testing**
- **test-driven-development** - RED-GREEN-REFACTOR cycle (includes testing anti-patterns reference)

**Debugging**
- **systematic-debugging** - 4-phase root cause process (includes root-cause-tracing, defense-in-depth, condition-based-waiting techniques)
- **verification-before-completion** - Ensure it's actually fixed

**Collaboration** 
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with per-task review (spec compliance + code quality) plus a broad final review

**Meta**
- **writing-skills** - Create new skills following best practices (includes testing methodology)
- **using-superpowers** - Introduction to the skills system

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

Read [the original release announcement](https://blog.fsck.com/2025/10/09/superpowers/).

## Contributing

The general contribution process for Superpowers is below. Keep in mind that we don't generally accept contributions of new skills and that any updates to skills must work across all of the coding agents we support.

1. Fork the repository
2. Switch to the 'dev' branch
3. Create a branch for your work
4. Follow the `writing-skills` skill for creating and testing new and modified skills
5. Submit a PR, being sure to fill in the pull request template.

Skill-behavior tests use the drill eval harness from [superpowers-evals](https://github.com/prime-radiant-inc/superpowers-evals/), cloned into `evals/` — see `evals/README.md` for setup. Plugin-infrastructure tests live at `tests/` and run via the relevant `run-*.sh` or `npm test`.

See `skills/writing-skills/SKILL.md` for the complete guide.

## Updating

Superpowers updates are somewhat coding-agent dependent, but are often automatic.

## License

MIT License - see LICENSE file for details

## Visual companion telemetry

Because skills and plugins don't provide any feedback to creators, we have no idea how many of you are using Superpowers. By default, the Prime Radiant logo on brainstorming's optional visual companion feature is loaded from our website. It includes the version of Superpowers in use. It does not include any details about your project, prompt, or coding agent. We don't see your clicks or anything about what you're building. This helps us have a rough idea of how many folks are using Superpowers and which version of Superpowers they're using. It's 100% optional. To disable this, set the environment variable `SUPERPOWERS_DISABLE_TELEMETRY` to any true value. Superpowers also honors Claude Code's `DISABLE_TELEMETRY` and `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` opt-outs.
