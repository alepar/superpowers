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

### 2026-07-28 — Coverage-recall spike (super-plan-2c1.4)

Ran the spike specified above with the following scale, deliberately reduced from
"~10 specs / ~60 leaf tasks" for tractability within one autonomous run (documented
deviation, not a silent one): 3 synthetic domains (recipe-sharing app, kanban board,
multiplayer trivia game), **10 / 12 / 17 specs** and **32–43 leaf tasks** each,
complete + gapped forms, **6 seeded gaps** (3 subsystem, 3 connective), **5 iterations
× 3 reviewers per variant per form = 90 headless `claude -p --model sonnet` calls**
(root-pass shape only — single flat tree per the 2c1.3 template, not the hierarchical
per-subepic passes). Variant C (17 specs) exercises the >~15-spec summarized-prose path.

**Result: 30/30 seeded-gap detections = 100% recall**, all 6 gaps (A-G1/A-G2, B-G1/B-G2,
C-G1/C-G2) caught by the 3-reviewer union in every one of their 5 iterations, zero
degraded rounds (all 3 reviewers returned valid structured findings every time, 90/90).
This clears the ~80% bar comfortably on the **first attempt**, on **sonnet** — the
spike's deliberately conservative floor model (opus, the template's nominal model, is
expected to clear it too). **No redesign attempt was needed; `coverage-reviewer-prompt.md`
is unchanged from the 2c1.3 draft** — "no change needed" per the design's own allowance.

**False-positive / arbitration load** (mean unioned findings per round, raw sum across
the 3 reviewers, not semantically deduped — an upper bound):
- Complete trees (FP measurement — every finding is a false positive by construction):
  A-recipe 14.6, B-kanban 8.2, C-trivia 5.4 (overall mean 9.4/round, n=15 rounds).
- Gapped trees (arbitration load including the seeded gaps): A-recipe 11.2, B-kanban
  10.0, C-trivia 11.8 (overall mean 11.0/round, n=15 rounds).
- A manual dedup pass on one sample round (B-kanban gapped iter4: raw 13 findings
  across 3 reviewers) found **6 distinct issues** — the 3 reviewers converged heavily
  on the same real gaps (both seeded gaps found by all 3; an unseeded "team switcher
  missing" and "no bootstrap team-creation path" finding independently surfaced by
  2–3 reviewers each). True post-dedup arbitration load is plausibly roughly half the
  raw sum reported above, not the raw sum itself.
- Manual spot-checks of several complete-tree runs confirmed the "false positives" are
  not noise or hallucination — they are defensible design gaps in the hand-built
  fixtures that a real user would in fact want to arbitrate (e.g., missing cascade-
  delete cleanup, an unenforced "must have viewed recipe" precondition, a websocket
  channel with no permission check). The FP number measures reviewer thoroughness
  against an imperfect "complete" fixture, not false-alarm noise.

**Fixture defect found and fixed mid-spike (not a prompt redesign attempt):** Variant
A's original Goal sentence never actually stated the notification requirement (A-G1
removed the `notif` subsystem, but nothing in the Goal text promised notifications), so
the forward-trace check correctly had nothing to detect — round 1 showed A-G1 caught in
only 1/5 iterations, a fixture bug, not a reviewer recall failure (confirmed by reading
all 4 "miss" transcripts — none mentioned notifications at all, consistent with a
goal element that was never actually stated). Fixed the Goal sentence to state the
notification requirement explicitly and reran all 30 of Variant A's calls (both forms,
all 5 iterations); corrected result is 5/5 for both A-G1 and A-G2, included in the
30/30 total above. This was a test-fixture correction, not one of the two sanctioned
redesign levers, and is tracked separately from the (unused) redesign budget.

**Caveats for the real (non-spike) coverage loop:**
- The 6 seeded gaps are "loud" (one whole missing subsystem or one clearly-named
  missing connective task each, per the design's two gap kinds). The spike validates
  recall for that class; it does not test subtler gaps (partial coverage, edge-case
  omissions within an existing subsystem).
- This spike tested the **root-pass shape only** (single flat tree, matching the
  2c1.3 template's placeholders) — the per-subepic passes were not separately
  exercised, since the design plan's Step 1 built trees "in the exact shape the
  reviewer prompt consumes" as one flat structure per variant.
- One of 90 raw reviewer outputs (A-recipe gapped iter1 reviewer1, pre-fix run)
  referenced "the prior trivia-game review" — a genuine cross-call context leak,
  most likely a project-level memory/observation tool auto-injecting prior-session
  content into the headless `claude -p` process rather than true isolated fresh
  context. Grep across all 90 outputs found no other genuine cross-variant reference
  (a `grep -l 'trivia'` hit in another recipe-variant file was a false positive
  matching "trivially"). Manual read confirmed this one leak did not drive the
  finding — the cited evidence was self-contained and independently defensible — but
  it is a real threat to the "fresh, isolated context" premise the design's coverage
  reviewer relies on. Worth checking, before relying on this measurement for a large
  real tree, whether the production dispatch path (Task tool subagent, not headless
  CLI) is similarly exposed to memory-injection plugins, and disabling/excluding that
  for coverage-reviewer dispatch if so.
- Spike model was sonnet throughout (per the issue's mechanism note); numbers are a
  floor, not a ceiling.

Scratch corpus, driver scripts, and raw run logs (90 + 30 rerun `claude -p` outputs)
live outside the repo; not committed. Numbers also recorded in the beads issue notes
for super-plan-2c1.4.

### Spike 0 (2026-07-28) — bd nested-epic semantics: PASS, kill criteria not triggered

Verified against bd 1.0.5 (Homebrew) in a scratch `bd init` db (E→T→U→V, 3 promotion edges via `bd update -t epic`, plus a pre-existing blocking dep and an unrelated decoy tree). Full command/output evidence is in issue `super-plan-2c1.1`'s notes. bd represents and traverses ≥3-deep epic nesting correctly; no flatten/redesign of Durable State or the tripwire is required. Confirmed exactly as this spec assumed: dependency preservation on retype, `sp_depth`/`sp_order` underscore keys (hyphens rejected), default label inheritance + `--no-inherit-labels`, `bd ready` epic-inclusive by default + `--exclude-type=epic`/`--label` scoping, `bd epic close-eligible` closing one tree level per call (fixpoint loop needed), and silent epic-with-children demotion (no bd-side guard).

Corrections/additions to carry into 2c1.5/2c1.7 implementation:

- **`--no-inherit-labels` strips ALL parent labels, not just `sp:needs-design`.** Every child creation needs both flags together: `bd create ... --no-inherit-labels -l sp:<root-epic-id>` — relying on inheritance for the root label doesn't work once `--no-inherit-labels` is set.
- **No `bd tree` command exists** in bd 1.0.5 (this spec's Validation section assumed one). `bd dep tree` walks blocking dependencies, not parent-child hierarchy — wrong tool. For a human-readable transitive subtree, use `bd list --parent <root> --pretty --status all` (confirmed transitive). Plain `bd list --parent <id>` / `bd children <id>` (JSON) are **one level only** — not transitive. Machine subtree traversal should go through label scoping (`bd list --label sp:<root-epic-id> --json --status all`), which is already the design's plan for the root-pass task-tree dump; there's no id-prefix filter to fall back on.
- **`bd epic close-eligible --json` fixpoint stop condition**: output shape changes on "nothing closed" — a bare `[]`, not `{"closed":[],"count":0}`. The loop needs to check for that, not just `count`.
- **No explicit Dolt commit step is needed.** Despite `--dolt-auto-commit` defaulting to `off`, writes survived a `kill -9` of the underlying dolt sql-server process (confirmed: bd auto-starts and reuses one long-lived server process across CLI invocations, not a fresh isolated process per call). Per-write durability is independent of Dolt's git-like "commit" concept. Do not configure `--dolt-auto-commit=batch` — that mode's pending writes survive only graceful `SIGTERM`/`SIGHUP`, not a hard kill.
