# Design Modes & Beads-Driven Execution Workflow — Design

**Status:** Approved
**Date:** 2026-06-06
**Scope:** Personal/local customization of the Superpowers skill files (not an upstream contribution).

## Overview

This change reshapes the brainstorming → planning → execution pipeline in three ways:

1. **Two design modes** in `brainstorming` — a collaborative default and a one-shot no-questions mode.
2. **A beads-driven execution flow** that replaces the monolithic implementation plan with a beads epic, rough tasks, and per-task plan-then-execute, whenever the `bd` CLI is available.
3. **Always execute via subagents, in parallel where feasible, without asking** — applied to all execution, not only the beads flow.

These are local edits to the existing skill files. Because beads is a third-party dependency, this is intentionally a personal customization, not a core upstream change.

---

## 1. Two Design Modes in `brainstorming`

### Mode A — Collaborative (default)

The current iterative flow, with two changes:

- **Question count scales with design complexity.** Larger or more ambiguous designs warrant more questions. Every ambiguous or contentious part of the design must be covered before the design is presented. Small designs warrant few questions.
- **No final-spec review gate.** Per-section approval still happens during iteration (as today). But once the design has been iterated through together and the spec is written, it is **not** sent back to the user for a separate review pass. Proceed directly to the next step (beads epic creation, or `writing-plans` when beads is unavailable).

### Mode B — One-shot (no questions)

Claude reasons alone — it identifies all decision points, proposes options for each, picks one, and writes the entire spec in a single pass without asking the user any questions. The spec for Mode B has a fixed structure:

1. **Problem description** — one paragraph.
2. **Main challenges** — one paragraph.
3. **Key decisions made** — one paragraph.
4. **Decision points, split by section** — one paragraph per decision point, each stating the **recommended approach** (and why it was chosen) and the **considered approaches** (and why they were discarded).

After the spec is written, the user is asked to review it before proceeding. This is the inverse of Mode A: because there was no collaboration during design, the written spec **requires** a review gate.

### Mode selection

- **Default to Mode A.**
- Use **Mode B** when either: the design complexity is small, or the user explicitly asks for a "one shot design".

---

## 2. Beads-Driven Execution Flow

### Trigger / detection

The beads flow activates when the `bd` CLI is present on PATH. If the repository has no initialized `.beads` database, auto-run `bd init` before proceeding. No prompting — beads is used wherever it is installed.

When beads is unavailable, the existing flow is used unchanged: `writing-plans` produces a single monolithic plan, then execution proceeds.

### Flow

When beads is available, **no monolithic implementation plan is written.** After the design spec is approved:

1. **Create the epic.** Create one beads epic issue that represents the entire spec.
2. **Split into rough tasks.** Decompose the spec into child tasks under the epic. Tasks are *rough*: a title, a short description, and a files-touched hint — not full implementation plans. Establish **blocking dependencies** between tasks so that `bd ready` yields a correct, blocker-aware set of currently-available work. Prefer building the whole graph at once (e.g. `bd create --graph` from a JSON plan) so dependencies are declared atomically.
3. **Execute as tasks become available.** Loop until the epic has no open tasks:
   - **Query ready work** within the epic via `bd ready` (blocker-aware; excludes blocked/in-progress/deferred).
   - **Plan phase (parallel).** Dispatch a **planner subagent** per ready task. Each planner writes a focused implementation plan **into the beads issue** (its `--design`/notes field), including the concrete list of files it will touch. Planners only write to beads, so they are always safe to run in parallel.
   - **Implement phase (parallel where feasible).** Using the file lists declared by the planners, the controller groups the ready tasks by **disjoint files**: tasks whose file sets do not overlap run in parallel implementer subagents (capped at a sane maximum, ~4); tasks with overlapping files are serialized. Each task runs: implementer subagent (TDD against the beads-issue plan) → **spec-compliance review** → **code-quality review** → fix loops until both pass → `bd close` the task.
   - **Refill.** Closing tasks unblocks their dependents; re-query `bd ready` and repeat.
4. **Finish.** When no open tasks remain in the epic, proceed to `finishing-a-development-branch`.

### Per-task plan storage

Each per-task implementation plan lives **in the beads issue** (`--design`/notes), not as a separate plan file. The beads task becomes self-contained for its implementer subagent.

### Per-task review gates

The two-stage review from `subagent-driven-development` is preserved per task: spec-compliance review first, then code-quality review, with fix-and-re-review loops until both pass. Same quality bar as today.

---

## 3. Always Subagent, Parallel, Never Ask

Applies to **all** execution, not only the beads flow:

- **Remove the "use subagents or run inline?" question.** The default is always `subagent-driven-development`. `executing-plans` is used only as an automatic fallback when subagents are unavailable — the user is never asked which to use.
- **Generalize disjoint-file parallelism.** `subagent-driven-development` currently forbids parallel implementer subagents. Replace that with the disjoint-file rule: run tasks in parallel where their file sets don't overlap, serialize where they do. This applies to both the beads flow and the monolithic-plan flow.

### Parallel isolation strategy

Parallelism is made safe via **disjoint-file judgment**: the controller only parallelizes tasks whose declared file sets do not overlap. Overlapping tasks serialize in the same working tree. (Git worktrees per task were considered and rejected as too heavy for a local workflow — see below.)

---

## 4. Files Touched

- **`skills/brainstorming/SKILL.md`** — add the two design modes and mode-selection rule; scale question count to complexity; invert the review gate (Mode A skips it, Mode B requires it); branch the post-spec step (beads epic creation when `bd` is available, otherwise `writing-plans`).
- **`skills/subagent-driven-development/SKILL.md`** (and its prompt files) — add the beads-mode loop (ready-query → parallel planners → disjoint-file parallel implementers → per-task reviews → `bd close`); make subagent execution the unconditional default; replace the no-parallel rule with disjoint-file parallelism.
- **`skills/writing-plans/SKILL.md`** — add a per-task mode that writes a focused plan into a beads issue rather than a standalone plan file.
- **`skills/executing-plans/SKILL.md`** — demote to a silent fallback (used only without subagent support; never offered as a choice).

---

## Key Decisions & Rationale

- **Beads detection = `bd` on PATH + auto-init.** Most automatic; the beads flow activates wherever beads is installed without per-repo opt-in. Considered requiring a pre-existing `.beads` database (rejected: adds a manual setup step).
- **Deps + parallel ready set.** Dependencies make `bd ready` meaningful and let independent work run concurrently. Considered no-deps (rejected: unsafe ordering) and deps + strictly sequential (rejected: needlessly slow).
- **Per-task plan stored in the beads issue.** Keeps each task self-contained and avoids a proliferation of plan files. Considered on-disk plan files (rejected: redundant with the beads record for a local workflow).
- **Keep both per-task reviews.** Preserves the existing quality bar. Considered a lighter single review (rejected: lowers per-task rigor).
- **Disjoint-file judgment for parallel safety.** Lightweight, no worktree overhead. Considered worktree-per-task with merge-slot gates (rejected: too much setup/merge overhead for a local workflow) and same-tree-rely-on-review (rejected: real risk of lost edits).
- **Separate planner subagent.** Planners run parallel-safe (beads-only writes) and produce the file lists the controller needs to schedule implementers; spec review then compares code against a plan written by a different agent. Considered folding planning into the implementer (rejected: loses the parallel-safe planning phase and the independent-plan property).
