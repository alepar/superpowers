# super-plan — Recursive Decomposition & Goal-Coverage Planning

**Status:** Approved (revised after roast BLOCK — see Roast Findings & Revisions)
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
2. **Promotion review** — a fresh-context subagent judges each task (leaf vs. needs its own design pass) *and* whether the child set is a correct, complete decomposition of the parent spec.
3. **Recurse** — each promoted task becomes a subepic and gets a nested brainstorm, which itself ends in super-plan. Recursion is *fully upfront*: the whole tree is designed before execution begins.
4. **Tripwire** — unbounded depth in principle, but crossing a size threshold pauses for a human go/stop/prune on the tree.
5. **Coverage loop** (root invocation only) — fresh-context subagents check the finished tree against the goals, hierarchically (each subepic against its local goal, the root against the root goal); accepted gaps loop back into the machinery; repeats until a round comes back clean.
6. **Hand off** to `superpowers:subagent-driven-development` (beads mode when `bd` is available, plan-file mode otherwise). Two small SDD edits make epic-trees executable (see Hand-off).

All recursion state is **derived from the tracker and spec files, never from session memory** (see Durable State) — the process survives context compaction, session restarts, and mid-tree abandonment.

`brainstorming`'s transition step shrinks to: invoke `superpowers:super-plan`. Always — with or without beads; without beads the same decomposition/promotion/coverage happens on paper (task tables in the spec documents) instead of in a tracker.

## Recursion Shape

Recursion happens through the mutual `brainstorming ↔ super-plan` cycle, not through a central orchestrator:

- Every *brainstormed* spec (the root spec, or a promoted subepic's spec) flows into super-plan for decomposition.
- Simple (leaf) tasks are terminal: never brainstormed, never super-planned.
- Recursion follows promotion edges only. Base case: no child of the current spec qualifies for promotion → subtree done.
- The structure is a tree by construction — each super-plan invocation only ever examines freshly created children, so cycles cannot occur. The tripwire guards breadth/depth *explosion*, not cycles.
- Root vs nested invocation is distinguished by whether a parent spec was handed to super-plan. Only the root invocation runs the coverage loop and the final hand-off.

**Order:** siblings are processed in dependency order; each promoted child's entire subtree completes before the next sibling starts (depth-first). Sequential on purpose: later sibling designs can read earlier siblings' specs, so shared interfaces get designed once. To make that real rather than accidental, a nested brainstorm's stated context is: the parent spec, the chain of ancestor goals, **and the specs of already-designed siblings** (listed by the invoking super-plan).

**Nested brainstorms** run in the main session (Mode A requires user interaction, which subagents can't do) and:

- inherit the session's design mode (Mode A parent → Mode A subepics; Mode B → Mode B; user can override per-subepic with an explicit request),
- open with their own local `## Goal` (seeded from the promotion rationale),
- do not re-offer the visual companion and do **not** offer roast (roast is offered once, at the root, after the coverage loop passes),
- skip Mode B's per-spec user review gate (the human checkpoints in a Mode B tree are: the root spec review, the top-split gate, the tripwire, and coverage arbitration),
- do not create a new worktree (`using-git-worktrees` is idempotent and just verifies the existing one),
- end, as always, by invoking super-plan on the spec they wrote.

## Durable State & Resumability

Long fully-upfront runs **will** hit context compaction, and users abandon sessions mid-tree. The design's answer: the session never *owns* the traversal state — it recomputes it.

- **Beads mode:** every issue created by a run carries a label `sp:<root-epic-id>`; every promoted epic gets metadata `sp-depth=<N>` (set at promotion time) and, until its nested brainstorm completes, a label `sp:needs-design`. Its spec path is recorded on the issue (`--spec-id`/notes) when written.
- **No-beads mode:** the same facts live in the spec documents — each task table row has a stable id (`<epic-slug>.<ordinal>`), a depth column, and promoted rows are marked `sub-plan: <spec file>` (or `needs-design` until written).
- **The traversal cursor is a query, not a memory:** the next work item is the first `sp:needs-design` epic in dependency order (beads: label query scoped to `sp:<root-epic-id>`; no-beads: first `needs-design` row across the spec tables). Any session — fresh, compacted, or resumed days later — re-derives its position the same way. Whether an invocation is root or nested is likewise derivable (the epic with no `sp:`-labeled parent).
- Tripwire counters (subepic count, max depth) are computed from the same labels/metadata, so they are exact and scoped to *this* tree, never polluted by unrelated epics in the repo-global beads DB.

## Decomposition & Promotion Pass

**Decomposition** (per super-plan invocation on a spec): split into rough child tasks — title, short description, files-touched hint — with blocking dependencies, exactly as brainstorming's beads step does today. With beads: `bd create --graph` (or `--parent` + `bd dep`) under the current epic, all children labeled `sp:<root-epic-id>`; root case creates the epic first. Without beads: the same task table written into the spec document.

**Promotion review:** a fresh-context subagent (`skills/super-plan/promotion-reviewer-prompt.md`) receives the spec, the child task list, the chain of ancestor goals, and the sibling specs designed so far. Fresh context deliberately counters author bias — the session that just wrote the tasks will think they're all fine. It returns:

1. Per task, `LEAF` or `PROMOTE` with a one-line rationale, applying:
   - **Uncertainty test:** implementing this task would force design decisions the spec doesn't answer. (The HTN compound-task test.)
   - **Size test:** the task would decompose into ~5+ subtasks or spans multiple subsystems.
   Either triggers promotion.
2. A **decomposition verdict**: is this child set a complete and correct decomposition of the parent spec (nothing in the spec unrepresented, no child contradicting it, no duplicate of a sibling subtree)? Issues here are fixed before promotion proceeds — this catches intermediate-level decomposition errors that goal-level coverage would miss.

The main session sanity-checks the verdicts and may overrule — but an overrule of a `PROMOTE` back to `LEAF` must be recorded on the task (flag `sp:demoted-by-session` + reason), so the coverage pass and the human can see where author-side judgment overrode the fresh reviewer. Under-promotion is the residual risk the design accepts; the decomposition verdict and the hierarchical coverage pass are the second nets.

**Applying a promotion:** with beads, `bd update <id> -t epic` plus `sp-depth` metadata and `sp:needs-design` label — an in-place type change, same issue id; **Spike 0 (see Validation) verifies before implementation** that retyping preserves dependencies and that bd's tree/children/ready semantics behave over ≥3-deep epic nesting. Without beads, the task-table row is marked as a sub-plan entry. Then the nested brainstorm runs.

**Top-split gate (Mode B only):** in Mode A the user shapes the root decomposition collaboratively, but a Mode B root would otherwise design the entire tree one-shot — and a wrong top-level split invalidates every subtree under it ("hallucination snowballing"). So in Mode B, after the *root* decomposition + promotion review and before any descent, the user approves the top-level split (child list + promotion verdicts). One gate, at the level where an error is most expensive. This — not the coverage loop — is the design's top-of-tree validation; coverage is the end-of-tree net.

## Tripwire

Before starting any nested brainstorm, super-plan computes the tree state from the run's labels/metadata (see Durable State): **depth** = the epic's `sp-depth` (promotion edges from root: direct subepics are depth 1), **count** = total `sp:`-labeled epics. The tripwire fires before brainstorming any subepic at **depth 3**, or when the total subepic count would exceed **10**:

- The user is shown the epic tree — what is designed, what still wants promotion, and (because recursion is depth-first) which branches are still unexplored, marked as such.
- They choose **continue** (and set the next checkpoint; default: thresholds double), **stop** (remaining would-be promotions freeze into leaf tasks flagged `sp:frozen-promotion` — the coverage pass surfaces every such task as an automatic finding, since these are known-underdesigned), or **prune** (drop specific branches, or demote an epic back to task — demotion requires the epic to have no children yet; bd silently allows demoting an epic that has children, which would corrupt the tree, so super-plan must check first).
- **Coverage-spawned subtrees count toward the same counters, and the tripwire stays armed during coverage fix rounds** — the gap loop is not a bypass around the only runaway safeguard.

Rationale: the user chose unbounded recursion to genuinely cover extremely vague features; the research literature (ADaPT's depth caps, BabyAGI's runaway task creation, LangGraph recursion limits) uniformly warns that LLM "is this complex enough?" judgment runs away. The tripwire keeps depth unbounded in principle while capping the damage of a runaway split at one checkpoint's worth of work.

## Coverage / Gap Loop (root only)

Runs once the whole tree has settled: every subepic designed, every leaf decomposed, no pending promotions.

**Hierarchical, not monolithic.** A single reviewer ingesting every spec in a large tree in one shot would degrade exactly when the tree is large — the case the design exists for. Instead:

1. **Per-subepic passes:** each subepic's subtree is checked against that subepic's local `## Goal` (one reviewer per subepic, given the subepic's spec, its children, and its parent's goal chain).
2. **Root pass:** checked against the root `## Goal`, given the root spec, the tree structure, and each subepic's spec (reviewers read files themselves; for very large trees the root pass consumes the subepic specs' goal/summary sections rather than full texts).

**Recall over single-sample judgment:** detecting an *unmapped* goal element is error-of-omission detection, where a single LLM judge has documented low recall. So the root pass runs **three independent reviewers in parallel**; their findings are unioned and deduped before arbitration. (Union, not majority — for gap-finding, a miss is worse than a false positive, and the user arbitrates false positives away cheaply.)

**Each reviewer** (`skills/super-plan/coverage-reviewer-prompt.md`, fresh context) runs:

1. **Forward trace (gaps):** decompose the goal into its necessary elements; every element must map to ≥1 task or spec. Unmapped element → `GAP`.
2. **Backward trace (orphans):** every task must serve some goal element. Unmapped task → `ORPHAN`.
3. **Walking skeleton:** does a subset of tasks yield a thin end-to-end slice of the goal — literally "playable", not "all parts exist but nothing connects them"? Plus a premortem framing: "the tree was fully executed and the goal still wasn't met — why?"
4. **Flag sweep:** every `sp:frozen-promotion` and `sp:demoted-by-session` task is surfaced as an automatic finding — known-underdesigned work never sails through silently.

Each finding: type, description, evidence, and a proposed fix (new leaf task under epic X, or new subepic needing design).

**Arbitration loop:** findings are presented to the user, who accepts or rejects each. Accepted `GAP`s: small → leaf task added directly; big → task created → promoted → nested brainstorm (inherited mode) → its own super-plan subtree (tripwire still armed). Accepted `ORPHAN`s: the user picks the resolution — delete the task as scope creep, or add the missing goal element it serves. **Rejected findings go into a ledger that is handed to every subsequent round's reviewers** ("previously rejected — do not resurface without new evidence"), so the loop converges instead of re-litigating. The loop ends when a round yields zero accepted findings — the user reviewing every round is the termination guard; no arbitrary cap.

**Hand-off:** execution is always `subagent-driven-development` — see next section.

## Hand-off & Execution over an Epic Tree

SDD was written for a flat epic; an epic *tree* needs two small, explicit changes (so `skills/subagent-driven-development/SKILL.md` is **edited**, not "unchanged"):

1. **Ready queries exclude containers:** the beads-mode ready loop (manual and Workflow-coordinator) must filter epic-type issues out of claimable work — `bd ready` includes epics by default, so without this the executor dispatches implementer subagents against subepics. (Exact flag — e.g. `--exclude-type=epic` — confirmed in Spike 0.)
2. **Epic closure:** implementers close leaf tasks only; epics would stay open forever and the "epic has no open tasks" finish condition would never fire. After each task close, the controller closes any epic whose children are all closed (`bd epic close-eligible` if the installed bd provides it — Spike 0 — else an explicit query-and-close), cascading up to the root.

Cross-subtree dependencies: where a later sibling's design consumes an earlier sibling's interface, the nested brainstorm/decomposition wires a real blocking dependency between the concrete tasks (not just spec prose), so the execution-time ready order honors it.

**No-beads mode:** `writing-plans` produces one plan per epic covering that epic's leaf tasks (a mixed epic still gets a plan for its leaves). SDD's plan-file mode is invoked **once per plan, in dependency order** (its documented single-plan contract, run N times — not a new multi-plan mode). Task ids and depth live in the spec task tables (see Durable State). This path is accepted extra scope: the user explicitly wants the flow to work without a tracker; it is exercised in Validation, and its known cost (hand-maintained paper state) is acknowledged.

## Conventions

- **`## Goal` section:** every spec (root and nested) opens with one — one or two sentences stating an observable outcome ("a playable game"). Coverage consumes these verbatim (root pass: root goal; per-subepic passes: local goals).
- **Subepic spec naming:** same `docs/superpowers/specs/` directory, named `YYYY-MM-DD-<root-slug>--<sub-slug>-design.md`; deeper levels extend the double-dash chain. Each nested spec's header links to its parent spec and its bead id.
- **INDEX.md:** every nested spec gets its own row, tagged with the root slug so the tree is discoverable from the index.
- Nested brainstorms commit their spec + INDEX row as usual (per-subepic commits are cheap and aid resumability).

## Files Touched

- **`skills/super-plan/SKILL.md`** — new. Decomposition, promotion review, nested-brainstorm orchestration, durable-state labels/metadata, tripwire, root-only hierarchical coverage loop, hand-off. Root-vs-nested derivable from the tracker.
- **`skills/super-plan/promotion-reviewer-prompt.md`** — new. `LEAF`/`PROMOTE` verdicts + decomposition verdict.
- **`skills/super-plan/coverage-reviewer-prompt.md`** — new. Forward/backward trace, walking skeleton, premortem, flag sweep; used by both per-subepic and root passes; consumes the rejected-findings ledger.
- **`skills/brainstorming/SKILL.md`** — edited. Transition step becomes "invoke `superpowers:super-plan`" (both modes, beads or not; epic-creation and `writing-plans` instructions move out); add the `## Goal` requirement; add the nested-invocation note (inherit mode, parent+sibling specs as context, no visual-companion/roast re-offer, skip Mode B per-spec review gate, no worktree re-creation).
- **`skills/subagent-driven-development/SKILL.md`** (+ `coordinator-workflow.md`) — edited: ready-query epic filter; epic-closure cascade.
- Spec + INDEX row for this design itself.

## Validation

**Spike 0 (before any implementation)** — bd nested-epic semantics, in a scratch `bd init` db:
- Create epic E → task T under E → `bd update T -t epic` → task U under T → repeat to depth 3.
- Verify: retyping preserves existing dependencies; children/tree/list queries traverse the full subtree; label + metadata queries work as Durable State assumes; the epic-exclusion flag for `bd ready` exists and works; `bd epic close-eligible` (or equivalent) closes correctly bottom-up; demoting an epic with children is detectable/preventable.
- Kill criteria: if bd cannot represent or traverse ≥3-deep epic nesting correctly, the beads mode must flatten to one level of subepics (depth cap 1 in-tracker, deeper structure carried in specs only) — redesign before implementing.

**Coverage recall spike:** hand-build a synthetic tree (~10 specs, ~60 leaf tasks) with 2 seeded gaps (one missing subsystem, one missing connective/integration task). Run the coverage-reviewer prompt 5×; measure seeded-gap recall and false-positive rate; also run 5× on the complete tree. Kill criteria: <80% detection of seeded gaps, or false positives so numerous that arbitration is noise — redesign the coverage prompt (or panel size) before relying on it.

**Dogfood:** run the full flow on a deliberately huge vague prompt ("build a playable roguelike") in a scratch repo, checking: promotion fires on compound tasks and terminates on simple ones; the tripwire fires at depth 3 / 10 subepics and go/stop/prune work; late-designed subepic specs are not measurably shallower than early ones (context-degradation check — if they are, the per-subtree session handoff described in Durable State needs to become mandatory rather than possible); the no-beads path produces coherent task tables and per-epic plans.

Record results in Post-Implementation Notes.

## Key Decisions & Rationale

- **Fully upfront recursion** (user choice) over rolling-wave/just-in-time. The research favors lazy decomposition (ADaPT: decompose-on-failure beat eager by 27–33%), so the design compensates where the risk actually bites: the Mode B top-split gate validates the most expensive level *before* descent, durable tracker-derived state makes long runs compaction-safe, and the hierarchical coverage loop is the end-of-tree net. (Execution-time feedback that invalidates a design remains out of scope: there is no automatic path from an implementer discovery back into super-plan — the human re-invokes brainstorming on the affected subepic, which is the normal skill entry point.)
- **Mode inheritance** for nested brainstorms (user choice): the session's mode propagates; explicit per-subepic override allowed. Mode B trees keep four human checkpoints (root spec review, top-split gate, tripwire, coverage arbitration) instead of per-spec review gates.
- **Uncertainty OR size** promotion test (user choice). Considered uncertainty-only with size handled by splitting (rejected: user wants big tasks promoted even when mechanical).
- **Unbounded depth + tripwire** (user choice, amended by mutual agreement). Hard caps rejected as contrary to the "extremely vague features" ambition; truly-unbounded rejected as the literature's canonical runaway mode. Coverage-spawned work stays inside the tripwire's jurisdiction.
- **Hierarchical, 3-sample coverage** over a single monolithic reviewer (revised after roast: single-pass ingestion doesn't scale and single-sample omission detection has low recall) and over roast-the-tree (rejected: roast is tuned for single-spec critique; it remains separately offerable at the root) and over an inline checklist (rejected: same-context review misses what it wrote).
- **User arbitrates gap findings, loop till clean, with a rejected-findings ledger** (ledger added after roast: without memory of rejections the loop can re-litigate forever and never converge).
- **Standalone skill (`super-plan`)** over extending brainstorming inline (user choice) and over parallel subagent-dispatched nested designs (rejected for now: siblings couldn't see each other's specs; revisit if sequential proves too slow).
- **Mutual-recursion shape** (brainstorming always ends in super-plan) over a central orchestrator: simpler contract, each level identical by construction — made safe by deriving all traversal state from the tracker instead of session memory.
- **SDD edited, not reused as-is** (revised after roast: `bd ready` surfaces epics as claimable work by default, and nothing would ever close epics — both confirmed against bd 1.0.5 behavior — so the tree is executable only with the ready-filter and closure-cascade changes).

## Roast Findings & Revisions (2026-07-28)

A medium-depth roast (8 lenses, 74→42 deduped findings, 17 verified by 3-judge panels) returned **BLOCK**. All 15 confirmed findings are addressed above; the load-bearing ones:

- `bd ready` includes epics → executors would implement containers (blocker) → ready-filter change in SDD.
- Epics never close → run never terminates → closure cascade in SDD.
- Main-session context accumulation / no resume path → Durable State (tracker-derived cursor, compaction-safe).
- Coverage reviewer can't ingest a huge tree; single-sample omission detection is low-recall → hierarchical + 3-sample union.
- Tripwire counts unscoped in a repo-global DB → `sp:<root-epic-id>` labels + `sp-depth` metadata.
- Coverage-spawned subtrees bypassed the tripwire → same counters, stays armed.
- Mode B inheritance = whole tree unchecked one-shot → top-split gate.
- Under-promotion / wrong-but-goal-complete decomposition undetected → decomposition verdict + flag sweep + demotion audit trail.
- bd deep-nesting semantics unverified (2 escalations: dep preservation on retype; tree-traversal queries) → Spike 0 with kill criteria.

Below-cap findings (25) and judge-raised issues were reviewed; those with cheap fixes are folded in (sibling-spec context, no-beads plan-per-epic invocation contract, nested roast/review-gate suppression, ORPHAN resolution, frozen-promotion surfacing, ledger). Known-accepted residuals: the doubling tripwire default, main-session Mode A time cost for huge trees, and the no-beads path's hand-maintained state.

## Post-Implementation Notes

*As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
