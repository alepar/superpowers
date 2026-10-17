# Workflow-Coordinated Autonomous Implementation

**Date:** 2026-06-13
**Status:** draft
**Refines:** `subagent-driven-development` (beads mode), with a light cross-reference from `dispatching-parallel-agents`. Builds on [2026-06-06 Design Modes & Beads-Driven Execution Workflow](2026-06-06-design-modes-and-beads-workflow-design.md).

## Problem

Once brainstorming produces a beads epic of designed, dependency-ordered tasks, the current path (`subagent-driven-development` beads mode) has the **main session** act as the coordinator: it runs the `bd ready` loop and dispatches implementer/reviewer subagents inline. This ties up the session, grows the controller's context over a long run, and parallelizes only by grouping disjoint files inside a single shared workspace. We want **parallel-where-possible, long unattended execution that drives an entire scoped set of epics/tasks to completion**, while **minimizing conflicts with concurrent human sessions** in the same repo.

The desired shape: hand the whole designed set to a coordinator that loops over `bd ready`, runs one isolated implementation pipeline per ready task in its own worktree (plan → implement → review), merges finished work back itself, and never cuts the session short — pausing only when a genuine blocker needs human attention.

## Main Challenges

1. **Harness nesting limit.** A dispatched subagent generally cannot dispatch its own subagents on Claude Code, so the literal "coordinator subagent → impl subagent → review subagents" three-level tree won't run. The native **Workflow tool** is the orchestration primitive built for this (background execution, deterministic loop/fan-out, per-agent worktree isolation, per-agent model override).
2. **State drift is the #1 multi-agent failure mode (~37% of failures across AutoGen/CrewAI/LangGraph).** Agents must coordinate through durable shared state, not ad-hoc context passing. Beads is that shared state.
3. **Dependency timing through git.** A dependent task only becomes `bd ready` after its blocker closes, *and* its worktree must branch from a base that already contains the blocker's code. So merge-back is not end-of-run cleanup — it is what correctly unblocks dependents.
4. **Conflict cost concentrates at integration.** Per-task worktrees maximize isolation but push conflict risk to merge-back time. Prevention (dependency ordering + isolated bases) beats recovery; the residual must be handled without freezing an unattended run.
5. **Unattended ≠ interactive.** A background run cannot block mid-stream waiting for a human to type an answer.

## Key Decisions

The coordinator is a **dynamic Workflow script** (mechanical loop) that delegates judgment to short-lived agents. It drives a `bd ready` loop, runs a model-tiered pipeline per task in a per-task worktree branched from an **epic integration branch** (itself on its own worktree, keeping the user's original worktree untouched), and merges finished tasks back **serially**. The **blocker bead** is the single escalation currency: anything that can't proceed is written up as a beads issue and triaged by an opus "coordinator-brain" agent, which either self-resolves (clarify spec, re-dispatch) or escalates. Escalation **never freezes the run** — it notifies, quarantines the blocked subtree, and keeps driving all other ready work to completion, then reports. The carefully-tuned existing pieces (two-stage review, implementer status handling, model-selection philosophy) are preserved.

## Decision Points

### Coordinator: dynamic Workflow script (capability-selected)

**Recommended.** The Workflow tool *is* the coordinator. The main session, after brainstorming produces the epic, kicks off a **background Workflow** scoped to that epic and is then free; progress is visible via `/workflows`. The script is the mechanical coordinator; LLM judgment is delegated to short-lived `agent()` calls. Selection is by **capability, never asked**:

- **Workflow tool available** → Workflow-coordinated autonomous mode (new primary path).
- **Subagents but no Workflow** → current manual dispatch loop (today's beads mode), retained as fallback.
- **No subagents** → `executing-plans` inline (existing fallback).

*Considered and discarded:* (a) **Main session coordinates** — simplest and unchanged, but ties up the session and grows controller context over a long run; demoted to fallback. (b) **A dedicated coordinator LLM subagent that dispatches impl subagents** — closest to the original phrasing but harness-blocked (subagents can't spawn subagents); it would need a Workflow underneath anyway.

### Coordinator loop

The Workflow script loops:
1. `bd ready` (epic-scoped) → current unblocked task set; the dependency graph does the scheduling.
2. Pull tasks into an active pool up to a concurrency cap (~4–6; the Workflow tool also caps concurrency at `min(16, cores-2)`), each dispatched through the per-task pipeline, each in its own worktree.
3. As a task passes review, queue it for **serial** merge-back into the integration branch.
4. After each successful merge, re-run `bd ready` to pull newly-unblocked tasks into the pool — **continuous refill**, not rigid rounds (pipeline over barrier).
5. Repeat until nothing is ready and the pool is empty → finish.

*Considered and discarded:* strict **round-based** scheduling (await a whole `bd ready` batch before merging/refilling) — simpler mental model but wastes wall-clock when tasks in a round finish at different times.

### Worktree topology: three layers

- **Original worktree** — the user's; untouched as long as possible.
- **Epic integration worktree** — its own worktree on an `epic integration branch`; the coordinator's evolving base. Keeping it off the original worktree is what protects concurrent human sessions.
- **Per-task worktrees** — each branched *from the integration branch*; on pass, rebased on latest integration → tested → merged back serially. New ready tasks branch from the updated integration branch so dependents inherit prior work.
- **Finish** — `finishing-a-development-branch` merges the integration branch into the user's base branch, where they pick merge / PR / keep / discard.

*Implementation note:* the Workflow tool's built-in `isolation:'worktree'` is **insufficient** here — it branches from the repo's current HEAD and auto-removes unchanged worktrees, whereas we need worktrees branched from *our integration branch* with a *controlled* merge-back. So worktrees are managed explicitly (following `using-git-worktrees` conventions) while the Workflow tool handles orchestration.

*Considered and discarded:* (a) **Merge straight to base as tasks finish** — fewer branches, but the base moves under concurrent human sessions and in-flight tasks rebase against a busier branch. (b) **Collect branches, human merges at end** — safest, but breaks dependency unblocking (dependents can't build on un-merged work) and isn't "unattended to completion."

### Per-task pipeline (model-tiered)

`plan (opus)` → `implement (sonnet)` → `spec-compliance review (sonnet)` → `code-quality review (sonnet)` → fix-loop (≤3 iterations) → serial merge-back. Fresh agent per stage; tasks communicate **only** through beads + the integration branch — no shared session context. This is the anti-state-drift design (challenge 2). The two-stage review order (spec compliance first, then code quality) and the implementer status handling (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED) are unchanged from the current skill.

### Escalation: the blocker bead is the currency

Nothing freezes the run. When an agent cannot proceed — **3 fix-loop iterations with no meaningful progress**, *or* an **unresolvable merge conflict** during merge-back — it **files a blocker bead** describing the problem and hands it back. A **coordinator-brain triage agent (opus)** reads the blocker bead + spec and decides:

- **Self-resolve** → clarify the spec / provide missing context, then re-dispatch the task.
- **Cannot resolve** → escalate. The escalating cases are a genuine **BLOCKED decision** the coordinator can't supply, or **work discovered outside the beads graph** (a new requirement/dependency the user should see rather than have silently absorbed).

*Considered and discarded:* hard-stopping the workflow on the first blocker (defeats unattended operation); pausing on **token budget** (explicitly out — no budget-based pausing). A per-task fix-loop iteration cap and a kill switch remain as non-negotiable safety mechanisms; the iteration cap routes through the blocker-bead path rather than aborting.

### Pause semantics: notify + quarantine + keep going + report

A background run cannot interactively block. On an unresolvable blocker the coordinator: **push-notifies the user immediately**, leaves the blocker bead open, **quarantines that task and anything depending on it**, and **keeps driving all other ready work to completion**. The run ends when nothing else is ready, and reports completed work + open blocker beads. The user resolves the blockers and **re-invokes the coordinator** to pick up the now-unblocked work.

*Considered and discarded:* (a) quarantine *silently* with no mid-run notification — quietest but the user can't react early to a blocker holding up a large subtree; (b) hard-stop and wait — only sensible if actively watching, and wastes the parallelism.

### Model tiering

opus for **plan**, **triage**, and the **final whole-epic review**; sonnet for **implement** and the **per-task spec/quality reviews**. This is the stated split plus opus on the two judgment-heavy bookends, consistent with the skill's existing "least powerful model that can handle each role" philosophy and the 80–95%-cheap / escalate-hard tiering pattern.

### Final review retained

The current end-of-run whole-implementation review is kept, run against the **integration branch** with opus, before handing off to `finishing-a-development-branch`.

### Scope selection

The coordinator targets the epic(s) created during the current brainstorming session. If there is more than one candidate epic or scope is ambiguous, the main session confirms scope with the user **before** launching the background Workflow.

## Post-Implementation Notes

**2026-06-13 — Implemented as designed.** No divergence from the design. The implementation is skill-prose only, under `skills/`: a new `coordinator-workflow.md` reference, `planner-prompt.md` and `triage-prompt.md`, a worktree + 3-iteration blocker-bead protocol added to `implementer-prompt.md`, the capability-selected autonomous beads mode (+ worktree topology, model tiering, red flags) in `subagent-driven-development/SKILL.md`, and cross-references in `finishing-a-development-branch` and `dispatching-parallel-agents`.

One accuracy constraint shaped the reference doc: a Workflow script has no shell/filesystem access (only its orchestration hooks), so all `bd`/git side-effects are performed inside dispatched agents and the script only sequences, caps concurrency, and serializes the merge gate. Verified by writing-skills pressure tests (`../plans/eval/2026-06-13-sdd-autonomous-eval.md`): all four behavior scenarios plus two adversarial prompts pass. Project integration tests under `tests/claude-code/` were not run — they exercise the installed plugin cache, not working-tree edits, so they cannot validate this change; the pressure-test eval is the applicable verification for behavior-shaping content.
