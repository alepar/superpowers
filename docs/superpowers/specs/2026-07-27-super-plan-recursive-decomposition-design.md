# super-plan — Recursive Decomposition & Goal-Coverage Planning

**Status:** Approved
**Date:** 2026-07-27
**Scope:** Personal/local customization of the Superpowers skill files (not an upstream contribution).
**Related:** [Design Modes & Beads Workflow](2026-06-06-design-modes-and-beads-workflow-design.md), [Workflow-Coordinated Autonomous Implementation](2026-06-13-workflow-coordinated-autonomous-implementation-design.md), [roast](2026-06-13-roast-adversarial-design-review-design.md)

## Goal

Brainstorming can take a huge or extremely vague feature ("build a playable roguelike") and reliably produce a complete, fully-designed task tree: every complex part gets its own design pass, and nothing needed to reach the stated goal slips through the cracks before execution starts.

## Problem

The current pipeline runs one brainstorm → one spec → one epic of rough tasks. For large features this systematically under-specs: rough tasks hide unresolved design decisions (an implementer then improvises them), and the single spec has no check that its task list actually adds up to the goal — connective tissue (wiring, integration, the "main loop") is the classic casualty. The skill's only current answer is a suggestion to "decompose into sub-projects" by hand.

## Solution Overview

A new skill, **`superpowers:super-plan`**, owns everything between "spec approved" and "execution starts":

1. **Decompose** the spec into rough child tasks (this moves out of brainstorming).
2. **Promotion review** — a fresh-context subagent judges each task: leaf, or complex enough to deserve its own design pass.
3. **Recurse** — each promoted task becomes a subepic and gets a nested brainstorm, which itself ends in super-plan. Recursion is *fully upfront*: the whole tree is designed before execution begins.
4. **Tripwire** — unbounded depth in principle, but crossing a size threshold pauses for a human go/stop/prune on the tree.
5. **Coverage loop** (root invocation only) — a fresh-context subagent checks the finished tree against the root goal; accepted gaps loop back into the machinery; repeats until a round comes back clean.
6. **Hand off** to `superpowers:subagent-driven-development` (beads mode when `bd` is available, plan-file mode otherwise).

`brainstorming`'s transition step shrinks to: invoke `superpowers:super-plan`. Always — with or without beads; without beads the same decomposition/promotion/coverage happens on paper (task tables in the spec documents) instead of in a tracker.

## Recursion Shape

Recursion happens through the mutual `brainstorming ↔ super-plan` cycle, not through a central orchestrator:

- Every *brainstormed* spec (the root spec, or a promoted subepic's spec) flows into super-plan for decomposition.
- Simple (leaf) tasks are terminal: never brainstormed, never super-planned.
- Recursion follows promotion edges only. Base case: no child of the current spec qualifies for promotion → subtree done.
- The structure is a tree by construction — each super-plan invocation only ever examines freshly created children, so cycles cannot occur. The tripwire guards breadth/depth *explosion*, not cycles.
- Root vs nested invocation is distinguished by whether a parent spec was handed to super-plan. Only the root invocation runs the coverage loop and the final hand-off.

**Order:** siblings are processed in dependency order; each promoted child's entire subtree completes before the next sibling starts (depth-first — falls out of the mutual recursion). Sequential on purpose: later sibling designs can read earlier siblings' specs, so shared interfaces get designed once.

**Nested brainstorms** run in the main session (Mode A requires user interaction, which subagents can't do) and:

- inherit the session's design mode (Mode A parent → Mode A subepics; Mode B → Mode B; user can override per-subepic with an explicit request),
- take the parent spec as context and open with their own local `## Goal` (seeded from the promotion rationale),
- do not re-offer the visual companion,
- do not create a new worktree (`using-git-worktrees` is idempotent and just verifies the existing one),
- end, as always, by invoking super-plan on the spec they wrote.

## Decomposition & Promotion Pass

**Decomposition** (per super-plan invocation on a spec): split into rough child tasks — title, short description, files-touched hint — with blocking dependencies, exactly as brainstorming's beads step does today. With beads: `bd create --graph` (or `--parent` + `bd dep`) under the current epic; root case creates the epic first. Without beads: the same task table written into the spec document.

**Promotion review:** a fresh-context subagent (`skills/super-plan/promotion-reviewer-prompt.md`) receives the spec, the child task list, and the chain of ancestor goals. Fresh context deliberately counters author bias — the session that just wrote the tasks will think they're all fine. Per task it returns `LEAF` or `PROMOTE` with a one-line rationale, applying:

- **Uncertainty test:** implementing this task would force design decisions the spec doesn't answer. (The HTN compound-task test.)
- **Size test:** the task would decompose into ~5+ subtasks or spans multiple subsystems.

Either triggers promotion. The main session sanity-checks the verdicts and may overrule with a stated reason — the reviewer advises, the session decides.

**Applying a promotion:** with beads, `bd update <id> -t epic` — an in-place type change, same issue id, dependencies preserved. Without beads, the task is marked as a sub-plan entry in the document. Then the nested brainstorm runs.

## Tripwire

Before starting any nested brainstorm, super-plan derives the global tree state (beads: epic count and nesting depth from `bd` queries; no-beads: spec count). **Depth** counts promotion edges from the root: direct subepics are depth 1, sub-subepics depth 2, and so on. The tripwire fires before brainstorming any subepic at **depth 3**, or when the total subepic count would exceed **10**:

- The user is shown the epic tree — what is designed, what still wants promotion.
- They choose **continue** (and set the next checkpoint; default: thresholds double), **stop** (remaining would-be promotions freeze into leaf tasks flagged "wanted promotion, stopped at tripwire"), or **prune** (drop or demote specific branches).

Rationale: the user chose unbounded recursion to genuinely cover extremely vague features; the research literature (ADaPT's depth caps, BabyAGI's runaway task creation, LangGraph recursion limits) uniformly warns that LLM "is this complex enough?" judgment runs away. The tripwire keeps depth unbounded in principle while capping the damage of a runaway split at one checkpoint's worth of work.

## Coverage / Gap Loop (root only)

Runs once the whole tree has settled: every subepic designed, every leaf decomposed, no pending promotions.

**Inputs:** the root spec's `## Goal`, every spec in the tree, and the full task tree (beads: `bd` tree dump; no-beads: the task tables in the specs).

**The coverage reviewer** (`skills/super-plan/coverage-reviewer-prompt.md`, fresh-context subagent) runs three named checks:

1. **Forward trace (gaps):** decompose the goal into its necessary elements; every element must map to ≥1 task or spec. Unmapped element → `GAP`.
2. **Backward trace (orphans):** every task must serve some goal element. Unmapped task → `ORPHAN` (scope creep, or a goal element nobody wrote down).
3. **Walking skeleton:** does a subset of tasks yield a thin end-to-end slice of the goal — literally "playable", not "all parts exist but nothing connects them"? The prompt also carries a premortem framing: "the tree was fully executed and the goal still wasn't met — why?"

Each finding: type, description, evidence (which goal element / which specs were checked), and a proposed fix (new leaf task under epic X, or new subepic needing design).

**Arbitration loop:** findings are presented to the user, who accepts or rejects each. Accepted small gaps become leaf tasks added to the right epic directly. Accepted big gaps enter the normal machinery: task created → promoted → nested brainstorm (inherited mode) → its own super-plan subtree. Then a **fresh** coverage reviewer re-runs. The loop ends when a round yields zero accepted findings — the user reviewing every round is the termination guard; no arbitrary cap.

**Hand-off:** execution is always `subagent-driven-development`. With beads: beads mode on the root epic. Without: `writing-plans` produces one plan per epic covering that epic's leaf tasks (an epic with both leaf tasks and subepics still gets its own plan for the leaves), plans ordered by the dependency graph, and subagent-driven-development executes those plan files.

## Conventions

- **`## Goal` section:** every spec (root and nested) opens with one — one or two sentences stating an observable outcome ("a playable game"). The coverage pass consumes the root one verbatim; nested ones are local goals seeded from the promotion rationale. This is a new requirement on `brainstorming`.
- **Subepic spec naming:** same `docs/superpowers/specs/` directory, named `YYYY-MM-DD-<root-slug>--<sub-slug>-design.md`; deeper levels extend the double-dash chain. Each nested spec's header links to its parent spec and its bead id.
- **INDEX.md:** every nested spec gets its own row, tagged with the root slug so the tree is discoverable from the index.

## Files Touched

- **`skills/super-plan/SKILL.md`** — new. Decomposition, promotion review, nested-brainstorm orchestration, tripwire, root-only coverage loop, hand-off. Root-vs-nested distinguished by presence of a parent spec.
- **`skills/super-plan/promotion-reviewer-prompt.md`** — new. Fresh-context `LEAF`/`PROMOTE` verdicts with rationale.
- **`skills/super-plan/coverage-reviewer-prompt.md`** — new. Forward/backward trace, walking skeleton, premortem.
- **`skills/brainstorming/SKILL.md`** — edited. Transition step becomes "invoke `superpowers:super-plan`" (both modes, beads or not; epic-creation and `writing-plans` instructions move out); add the `## Goal` requirement; add a short nested-invocation note (inherit mode, parent spec as context, no visual-companion re-offer, no worktree re-creation).
- **`skills/subagent-driven-development/SKILL.md`** — unchanged (already accepts an epic or plan files).

## Validation

Dogfood super-plan on a deliberately huge vague prompt (e.g. "build a playable roguelike") in a scratch repo, checking:

- promotion fires on genuinely compound tasks and terminates on simple ones,
- the tripwire triggers at depth 3 / 10 subepics and the go/stop/prune paths work,
- the coverage pass catches a seeded gap (delete an obvious subsystem from the spec before the coverage round; confirm it is found),
- the no-beads path produces coherent task tables and per-leaf-epic plans.

Record results in Post-Implementation Notes.

## Key Decisions & Rationale

- **Fully upfront recursion** (user choice) over rolling-wave/just-in-time. The research favors lazy decomposition (ADaPT: decompose-on-failure beat eager by 27–33%; "hallucination snowballing" — a wrong high-level split invalidates its subtree), so the design compensates: fresh-context promotion review, the tripwire, and hardest validation at the top of the tree via the coverage loop.
- **Mode inheritance** for nested brainstorms (user choice): the session's mode propagates; explicit per-subepic override allowed. Considered always-Mode-B-with-roast and escalation-based (rejected: user wants mode continuity).
- **Uncertainty OR size** promotion test (user choice). Considered uncertainty-only with size handled by splitting (rejected: user wants big tasks promoted even when mechanical).
- **Unbounded depth + tripwire** (user choice, amended by mutual agreement). Hard caps rejected as contrary to the "extremely vague features" ambition; truly-unbounded rejected as the literature's canonical runaway mode. The tripwire is the negotiated middle: unbounded in principle, human-checked at scale.
- **Dedicated coverage pass** over roast-the-tree (rejected: roast is tuned for single-spec critique, not cross-spec coverage; it remains separately offerable per-spec) and over an inline checklist (rejected: same-context review misses what it wrote — the blind spot roast exists for).
- **User arbitrates gap findings, loop till clean** over capped rounds or autonomous triage (rejected: false-positive gaps generating unsupervised design work is worse than another review round; the user in the loop is the natural terminator).
- **Standalone skill (`super-plan`)** over extending brainstorming inline (user choice; keeps brainstorming's SKILL.md lean) and over parallel subagent-dispatched nested designs (rejected for now: siblings couldn't see each other's specs, breaking shared-interface coherence; revisit if sequential proves too slow).
- **Mutual-recursion shape** (brainstorming always ends in super-plan) over a central orchestrator owning the whole tree: simpler contract, and each level's machinery is identical by construction.

## Post-Implementation Notes

*As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
