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

- **Beads mode:** every issue created by a run carries a label `sp:<root-epic-id>` — **including the root epic itself** (root detection: the epic whose own id equals the label's suffix). Every promoted epic gets metadata `sp_depth=<N>` and `sp_order=<per-parent ordinal in dependency order>` (underscores required — bd rejects hyphenated metadata keys) and, until its nested brainstorm completes, a label `sp:needs-design`. Its spec path is recorded on the issue when written. Children are created with `--no-inherit-labels` (bd copies parent labels to children by default, which would smear `sp:needs-design` onto every leaf).
- **No-beads mode:** the same facts live in the spec documents — each task table row has a stable id (`<epic-slug>.<ordinal>`), a depth column, and a **deps column listing blocker row-ids** (dependencies must be machine-readable table data, not prose, or the cursor below is unreconstructable); promoted rows are marked `sub-plan: <spec file>` (or `needs-design` until written).
- **The traversal cursor is a query, not a memory** — and ordering is *stored*, not inferred (bd has no topological sort; label queries return unordered sets): an epic is **eligible for design** iff it carries `sp:needs-design` and every lower-`sp_order` sibling's subtree is fully designed. Next work item: the eligible epic, depth-first. This keeps "later siblings read earlier siblings' *complete* specs" true across any resume. No-beads: same rule over the table columns.
- **Write ordering (crash between the two stores):** the beads DB and git-committed spec files are not transactional. A nested brainstorm commits its spec *before* clearing `sp:needs-design` — the label flip is the single "done" marker. Spike 0 checks whether bd writes need an explicit Dolt commit to survive a killed session.
- Tripwire counters (subepic count, max depth) are computed from the same labels/metadata, so they are exact and scoped to *this* tree, never polluted by unrelated epics in the repo-global beads DB.
- **In-flight interactivity is not durable:** a compaction *mid*-brainstorm loses that one Q&A in progress (resume restarts that subepic's brainstorm from its parent context). Accepted residual — the cursor bounds the loss to one node.

## Decomposition & Promotion Pass

**Decomposition** (per super-plan invocation on a spec): split into rough child tasks — title, short description, files-touched hint — with blocking dependencies, exactly as brainstorming's beads step does today. With beads: `bd create --graph` (or `--parent` + `bd dep`) under the current epic, all children labeled `sp:<root-epic-id>`; root case creates the epic first. Without beads: the same task table written into the spec document.

**Promotion review:** a fresh-context subagent (`skills/super-plan/promotion-reviewer-prompt.md`) receives the spec, the child task list, the chain of ancestor goals, and the sibling specs designed so far. Fresh context deliberately counters author bias — the session that just wrote the tasks will think they're all fine. It returns:

1. Per task, `LEAF` or `PROMOTE` with a one-line rationale, applying:
   - **Uncertainty test:** implementing this task would force design decisions the spec doesn't answer. (The HTN compound-task test.)
   - **Size test:** the task would decompose into ~5+ subtasks or spans multiple subsystems.
   Either triggers promotion.
2. A **decomposition verdict**: is this child set a complete and correct decomposition of the parent spec (nothing in the spec unrepresented, no child contradicting it, no duplicate of a sibling subtree)? Issues here are fixed before promotion proceeds — this catches intermediate-level decomposition errors that goal-level coverage would miss.

The main session sanity-checks the verdicts and may overrule — but an overrule of a `PROMOTE` back to `LEAF` must be recorded on the task (flag `sp:demoted-by-session` + reason), so the coverage pass and the human can see where author-side judgment overrode the fresh reviewer. Under-promotion is the residual risk the design accepts; the decomposition verdict and the hierarchical coverage pass are the second nets.

**Applying a promotion:** with beads, `bd update <id> -t epic` plus `sp_depth`/`sp_order` metadata and `sp:needs-design` label — an in-place type change, same issue id; **Spike 0 (see Validation) verifies before implementation** that retyping preserves dependencies and that bd's tree/children/ready semantics behave over ≥3-deep epic nesting. Without beads, the task-table row is marked as a sub-plan entry. Then the nested brainstorm runs.

**Top-split gate (both modes):** a wrong top-level split invalidates every subtree under it ("hallucination snowballing"), and — since decomposition moved out of brainstorming into super-plan — even a Mode A user never sees the decomposition during the collaborative design. So after the *root* decomposition + promotion review and before any descent, the user approves the top-level split (child list + promotion verdicts), in both modes. One gate, at the level where an error is most expensive. This — not the coverage loop — is the design's top-of-tree validation; coverage is the end-of-tree net.

## Tripwire

Before starting any nested brainstorm, super-plan computes the tree state from the run's labels/metadata (see Durable State): **depth** = the epic's `sp-depth` (promotion edges from root: direct subepics are depth 1), **count** = total `sp:`-labeled epics. The tripwire fires before brainstorming any subepic at **depth 3**, or when the total subepic count would exceed **10**:

- The user is shown the epic tree — what is designed, what still wants promotion, and (because recursion is depth-first) which branches are still unexplored, marked as such.
- They choose **continue** (and set the next checkpoint; default: thresholds double), **stop** (remaining would-be promotions freeze into leaf tasks flagged `sp:frozen-promotion` — the coverage pass surfaces every such task as an automatic finding, since these are known-underdesigned), or **prune** (drop specific branches, or demote an epic back to task — demotion requires the epic to have no children yet; bd silently allows demoting an epic that has children, which would corrupt the tree, so super-plan must check first).
- **Coverage-spawned subtrees count toward the same counters, and the tripwire stays armed during coverage fix rounds** — the gap loop is not a bypass around the only runaway safeguard.

Rationale: the user chose unbounded recursion to genuinely cover extremely vague features; the research literature (ADaPT's depth caps, BabyAGI's runaway task creation, LangGraph recursion limits) uniformly warns that LLM "is this complex enough?" judgment runs away. The tripwire keeps depth unbounded in principle while capping the damage of a runaway split at one checkpoint's worth of work.

## Coverage / Gap Loop (root only)

Runs once the whole tree has settled: every subepic designed, every leaf decomposed, no pending promotions.

**Hierarchical, not monolithic.** A single reviewer ingesting every spec in a large tree in one shot would degrade exactly when the tree is large — the case the design exists for. Instead:

1. **Per-subepic passes:** each subepic's subtree is checked against that subepic's local `## Goal` (given the subepic's spec, its children, and its parent's goal chain).
2. **Root pass:** checked against the root `## Goal`, given the root spec, **the full task tree** (every task's id/title/description — in beads mode dumped from the DB, since leaf tasks live there and not in spec files), and the subepic specs. **Only spec prose may be summarized** for scale (trees above ~15 specs consume subepic goal/summary sections instead of full texts) — the task tree is always passed whole (the walking-skeleton check lives at task granularity, and only this pass sees across subepics).

**Recall over single-sample judgment:** detecting an *unmapped* goal element is error-of-omission detection, where a single LLM judge has documented low recall. So **every coverage pass — per-subepic and root — runs three independent reviewers**, findings unioned and deduped before arbitration. (Union, not majority — for gap-finding, a miss is worse than a false positive, and the user arbitrates false positives away.) A pass with fewer than 3 valid reviewer returns is marked degraded in the round summary, never silently accepted. Panel size is spike-tunable.

**Recall floor & fallback net:** the whole "nothing slips through" promise rides on measured recall. If the coverage-recall spike (see Validation) can't clear its bar after at most two redesign attempts (prompt, panel size, goal-decomposition granularity), the coverage loop is **downgraded to advisory** and the gate becomes a **mandatory human read-through of the goal against the full task tree** before hand-off — disclosed in the round summary, not silently degraded.

**Each reviewer** (`skills/super-plan/coverage-reviewer-prompt.md`, fresh context) runs:

1. **Forward trace (gaps):** decompose the goal into its necessary elements; every element must map to ≥1 task or spec. Unmapped element → `GAP`.
2. **Backward trace (orphans):** every task must serve some goal element. Unmapped task → `ORPHAN`.
3. **Walking skeleton:** does a subset of tasks yield a thin end-to-end slice of the goal — literally "playable", not "all parts exist but nothing connects them"? Plus a premortem framing: "the tree was fully executed and the goal still wasn't met — why?"
4. **Flag sweep:** every `sp:frozen-promotion` and `sp:demoted-by-session` task is surfaced as an automatic finding — known-underdesigned work never sails through silently.

Each finding: type, description, evidence, and a proposed fix (new leaf task under epic X, or new subepic needing design).

**Arbitration loop:** findings are presented deduped to the user, who accepts or rejects each. Accepted `GAP`s: small → leaf task added directly; big → task created → promoted → nested brainstorm (inherited mode) → its own super-plan subtree (tripwire still armed). Accepted `ORPHAN`s: the user picks the resolution — delete the task as scope creep, or add the missing goal element it serves.

**Convergence mechanics:**
- **Ledger:** every arbitrated finding (accepted *and* rejected, including flag-sweep items) is appended with a stable id and one-line description to a committed sidecar file, `docs/superpowers/specs/<root-slug>-coverage-ledger.md`. Subsequent rounds' reviewers receive it ("previously rejected — do not resurface without new evidence"). The ledger takes precedence over the flag sweep: an already-arbitrated flagged task is not re-surfaced.
- **Incremental rounds:** round N+1 re-runs only the per-subepic passes whose subtrees changed since round N, plus the root pass (always). Unchanged subtrees are not re-reviewed.
- The loop ends when a round yields zero accepted findings — the user reviewing every round is the termination guard; no arbitrary cap. The arbitration workload at large scale is an accepted residual: it is the price of the user-arbitrated loop chosen over autonomous triage, and the arbitration-load measurement in the coverage-recall spike is there to quantify it before first real use.

**Hand-off:** execution is always `subagent-driven-development` — see next section.

## Hand-off & Execution over an Epic Tree

SDD was written for a flat epic; an epic *tree* needs two small, explicit changes (so `skills/subagent-driven-development/SKILL.md` is **edited**, not "unchanged"):

1. **Ready queries exclude containers AND scope to this run's tree:** the beads-mode ready loop (manual and Workflow-coordinator paths — both, consistently) must filter epic-type issues out of claimable work (`bd ready` includes epics by default) **and** restrict results to issues labeled `sp:<root-epic-id>` — a bare repo-global `bd ready` in a repo with unrelated epics dispatches implementers against out-of-tree tasks. (Exact mechanics — `--exclude-type=epic`, label filtering support on `bd ready`/`bd list`, or a post-filter — confirmed in Spike 0.)
2. **Epic closure:** implementers close leaf tasks only, so the controller closes epics — and `bd epic close-eligible` closes only **one tree level per invocation** (verified on bd 1.0.5: the root closed only on a second call, after the mid-level epic closed first). A single call does not cascade. The controller therefore **loops close-eligible (or an explicit query-and-close) to a fixpoint** — repeat until a pass closes nothing — after each refill cycle. **Run completion = the root epic is closed** (not "ready set empty", which can be transiently true mid-cascade).

Cross-subtree dependencies: where a later sibling's design consumes an earlier sibling's interface, the nested brainstorm/decomposition wires a real blocking dependency between the concrete tasks (not just spec prose), so the execution-time ready order honors it.

**No-beads mode:** `writing-plans` produces one plan per epic covering that epic's leaf tasks (a mixed epic still gets a plan for its leaves). SDD's plan-file mode is invoked **once per plan, serially, in dependency order** (its documented single-plan contract, run N times — not a new multi-plan mode), which also enforces cross-subtree dependencies at plan granularity. Task ids, deps, and depth live in the spec task tables (see Durable State). This path is accepted extra scope: the user explicitly wants the flow to work without a tracker; it is exercised in Validation, and its known cost (hand-maintained paper state) is acknowledged.

## Conventions

- **`## Goal` section:** every spec (root and nested) opens with one — one or two sentences stating an observable outcome ("a playable game"). Coverage consumes these verbatim (root pass: root goal; per-subepic passes: local goals).
- **Subepic spec naming:** same `docs/superpowers/specs/` directory, named `YYYY-MM-DD-<root-slug>--<sub-slug>-design.md`; deeper levels extend the double-dash chain. Each nested spec's header links to its parent spec and its bead id.
- **INDEX.md:** every nested spec gets its own row, tagged with the root slug so the tree is discoverable from the index.
- Nested brainstorms commit their spec + INDEX row as usual (per-subepic commits are cheap and aid resumability).

## Skill-Writing Altitude

The SKILL.md files carry only what an agent cannot derive on its own:

- **External-tool quirks** — bd's one-level-per-call `close-eligible`, epic-inclusive `bd ready`, default label inheritance, metadata-key syntax, Dolt commit semantics. These are exactly where a well-behaved agent's priors are *wrong*.
- **Chosen policies and thresholds** — promotion tests, tripwire numbers, 3-sample union, recall floor and fallback net, mode inheritance, top-split gate, label-flip-last write ordering.
- **Interface contracts** — label/metadata names, ledger location, spec naming, what each subagent prompt receives and returns.

Everything derivable — how to retry a failed subagent, present findings readably, re-enter idempotently after a crash, format a tree for the user — is left unsaid; a capable agent does these unprompted, and spelling them out buries the load-bearing constraints. This spec's remaining explanatory prose is rationale for the human reviewer, not text to transplant into skills.

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
- Verify: retyping preserves existing dependencies; children/tree/list queries traverse the full subtree; label + metadata queries work as Durable State assumes (`sp_depth`/`sp_order` keys accepted; `--no-inherit-labels` prevents label smear; label filtering usable on `bd ready`/`bd list` or a reliable post-filter exists); the epic-exclusion flag for `bd ready` works; `bd epic close-eligible` looped to fixpoint closes bottom-up through the root; demoting an epic with children is detectable/preventable; **writes survive a killed session** (check Dolt auto-commit state; if off, identify the explicit commit super-plan must issue after each state change).
- Kill criteria: if bd cannot represent or traverse ≥3-deep epic nesting correctly, the beads mode must flatten to one level of subepics — and because that guts the tracker-derived cursor, tripwire depth counting, and label scoping for deeper levels, **flattening triggers a redesign of Durable State and the tripwire for the in-spec deeper levels, not a silent fallback**. Redesign before implementing.

**Coverage recall spike:** hand-build three synthetic tree variants (~10 specs / ~60 leaf tasks each, one sized past the ~15-spec summary-fallback threshold so the summarized root pass is itself tested) with **6 seeded gaps total** across them (missing subsystems and missing connective/integration tasks). Run the 3-reviewer union 5× per variant; measure seeded-gap recall, false-positive rate (also 5× on complete trees), and **total findings the arbitrating human must adjudicate per round** (the arbitration-load number). Kill criteria: recall below ~80% after at most two redesign attempts (prompt, panel size, goal-decomposition granularity), or FP volume that makes arbitration noise → the fallback net activates (coverage advisory + mandatory human read-through as the gate) and the design proceeds with that disclosed weaker guarantee.

**Dogfood:** run the full flow on a deliberately huge vague prompt ("build a playable roguelike") in a scratch repo, checking: promotion fires on compound tasks and terminates on simple ones; the tripwire fires at depth 3 / 10 subepics and go/stop/prune work; late-designed subepic specs are not measurably shallower than early ones (context-degradation check — if they are, the per-subtree session handoff described in Durable State needs to become mandatory rather than possible); the no-beads path produces coherent task tables and per-epic plans.

Record results in Post-Implementation Notes.

## Key Decisions & Rationale

- **Fully upfront recursion** (user choice) over rolling-wave/just-in-time. The research favors lazy decomposition (ADaPT: decompose-on-failure beat eager by 27–33%), so the design compensates where the risk actually bites: the Mode B top-split gate validates the most expensive level *before* descent, durable tracker-derived state makes long runs compaction-safe, and the hierarchical coverage loop is the end-of-tree net. (Execution-time feedback that invalidates a design remains out of scope: there is no automatic path from an implementer discovery back into super-plan — the human re-invokes brainstorming on the affected subepic, which is the normal skill entry point.)
- **Mode inheritance** for nested brainstorms (user choice): the session's mode propagates; explicit per-subepic override allowed. Mode B trees keep four human checkpoints (root spec review, top-split gate, tripwire, coverage arbitration) instead of per-spec review gates. The top-split gate applies in both modes (round-2 roast: once decomposition moved out of brainstorming, even Mode A users never saw the split).
- **Uncertainty OR size** promotion test (user choice). Considered uncertainty-only with size handled by splitting (rejected: user wants big tasks promoted even when mechanical).
- **Unbounded depth + tripwire** (user choice, amended by mutual agreement). Hard caps rejected as contrary to the "extremely vague features" ambition; truly-unbounded rejected as the literature's canonical runaway mode. Coverage-spawned work stays inside the tripwire's jurisdiction.
- **Hierarchical, uniformly 3-sample coverage** over a single monolithic reviewer (revised after roast: single-pass ingestion doesn't scale and single-sample omission detection has low recall; round 2 extended the 3-sample rule to per-subepic passes and pinned the full task tree as non-summarizable root-pass input) and over roast-the-tree (rejected: roast is tuned for single-spec critique; it remains separately offerable at the root — and the user may explicitly roast any individual subepic spec, though no per-subepic adversarial review runs by default). Inline checklist rejected: same-context review misses what it wrote.
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

## Roast Round 2 (2026-07-28) — BLOCK → revised again

Round 2 (8 lenses, 53→34 deduped, 10 verified) verified the round-1 fixes and found two new blockers — both hard bd 1.0.5 facts: `bd epic close-eligible` closes one tree level per call (no cascade), and metadata key `sp-depth` is syntactically invalid (hyphens rejected), which would have silently disabled the tripwire's depth guard. Fixes folded in above:

- Closure cascade → **loop close-eligible to fixpoint**; run completion = root epic closed.
- `sp-depth` → **`sp_depth`** (+ `sp_order`); key validity added to Spike 0.
- Cursor couldn't reconstruct DFS/dependency order from an unordered label query → **stored `sp_order` + recursive eligibility rule**; sibling-completeness now holds across resume. No-beads tables gain a machine-readable deps column.
- Ready queries now scope to the run's label **and** exclude epics, identically in both SDD paths.
- Coverage: 3-sample union extended to per-subepic passes; full task tree always fed to the root pass (only spec prose summarizable, threshold ~15 specs); reviewer-failure re-dispatch + degraded-round disclosure; **recall floor with a fallback net** (advisory coverage + mandatory human read-through) if the spike can't clear ~80% after two redesigns; ledger stored in a committed sidecar file with flag-sweep precedence; incremental rounds (changed subtrees + root only).
- Top-split gate extended to both modes (decomposition is no longer visible in Mode A brainstorming either).
- Write-ordering/idempotency rules for the two non-transactional stores; `--no-inherit-labels`; Dolt persistence check in Spike 0; Spike 0's flatten fallback now explicitly triggers a Durable-State/tripwire redesign rather than a silent degrade.
- Coverage-recall spike strengthened (3 tree variants incl. one past the summary threshold, 6 seeded gaps, arbitration-load measurement).

Per roast policy (~2 iteration cap), no third roast — remaining confirmed-major residuals knowingly accepted: unmeasured coverage recall until the spike runs (mitigated by the fallback net), arbitration workload at large scale (quantified by the spike), mid-brainstorm compaction losing one in-flight Q&A, and no per-subepic adversarial review by default.

## Post-Implementation Notes

*As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
