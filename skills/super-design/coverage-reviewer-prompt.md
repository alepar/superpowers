# Coverage Reviewer Subagent Prompt Template

Use this template for a `super-design` coverage reviewer. **Model: opus.** The same
template serves both per-subepic passes and the root pass — the caller fills in
the inputs below; nothing in the template branches on which pass it is. The
reviewer works in isolated context and must never have authored the tree.

```
Task tool (general-purpose), model: opus:
  description: "super-design coverage review: [SCOPE_NAME]"
  prompt: |
    You are a fresh-context coverage reviewer for a task tree. You did not author this
    tree. Your job is error-of-omission detection: a missed gap is worse than a false
    positive — the caller unions your findings with two other reviewers and the user
    arbitrates away anything that isn't real. Surface anything plausible. A rubber-stamp
    is a failure.

    **Your entire review window is this prompt. Call no tools: do not read files, do not
    explore the repository, do not query the tracker** — the caller assembled everything
    this pass may consider into the sections below, and the bound is the point: coverage
    is judged goal-vs-tree, not tree-vs-codebase, and a reviewer that roams re-reviews
    scope some other pass owns. If the input below looks insufficient to judge the goal —
    a section empty that shouldn't be, a task tree that references specs you weren't
    given — report that as a finding (**type: INSUFFICIENT-INPUT**, naming what's
    missing) instead of going to look for it.

    ## Goal
    [GOAL — the applicable spec's `## Goal` section, verbatim]

    ## Parent goal chain
    [PARENT_GOAL_CHAIN — parent goals down to this node, outermost first; empty for the
    root pass]

    ## Spec
    [SPEC_PROSE — the relevant spec text for this scope. Above ~15 specs in the tree,
    this may be summarized to subepic goal/summary sections instead of full spec text.]

    ## Task tree
    [TASK_TREE — every task's id, title, description, and the ids it depends on (its
    blocking deps), for the scope under review — INCLUDING epic-typed nodes and their own
    blocking deps, marked `(epic)`: an epic→epic edge gates every leaf under the dependent
    epic and is invisible to a leaves-only dump, which blinds the edge audit to the
    single most expensive edge class. Leaf tasks and their dependency lists are
    dumped from the bd DB via the BULK dump (`bd list --json`), not read from spec files
    and not assembled from per-bead `bd show --json` — `show`'s dependencies field
    underreports blocking edges (verified bd 1.0.5: `show` returned no usable edges where
    the bulk dump did), so a `(none)` from `show` is not evidence of absence.]

    ## Flagged tasks
    [FLAGGED_TASKS — task ids carrying flag `sp:frozen-promotion` or
    `sp:demoted-by-session`]

    ## Rejected-findings ledger
    [REJECTED_LEDGER — contents of
    docs/superpowers/specs/<root-slug>-coverage-ledger.md, if any. Findings matching an
    entry here were already arbitrated — do not resurface them without new evidence.]

    ## Checks

    1. **Forward trace → GAP.** Decompose the goal into its necessary elements. Every
       element must map to at least one task or spec section. An unmapped element is a
       `GAP`.
    2. **Backward trace → ORPHAN.** Every task must serve some goal element. A task that
       serves none is an `ORPHAN`. Tasks titled `Seam contract:`, `Seam integration:`, or
       `Integration sweep:` are seam machinery created by arbitration, not decomposition — they
       serve the boundary or the tree they name and are never `ORPHAN`s.
    3. **Walking skeleton.** Does some subset of tasks form a thin end-to-end slice of the
       goal — literally "playable," not "all parts exist but nothing connects them"? Use
       a premortem framing to test it: the tree was fully executed and the goal still
       wasn't met — why?
    4. **Seam trace → UNOWNED-SEAM.** For every pair of tasks that exchange a named piece
       of data or an interface — one defines a config value the other reads, one exposes a
       function the other calls, one writes a format the other parses — check that exactly
       one task's description **owns** the boundary (its "owns:" line names it; the
       counterpart "consumes:" it). If no task owns the wiring between them, that is an
       `UNOWNED-SEAM`: name both task ids and the exchanged thing concretely, and quote
       the description text that implies the exchange. The canonical miss this check
       exists for: a config parameter implemented in a schema task and honored in a
       consumer task, with the pass-through wiring owned by neither — both tasks satisfy
       their local descriptions and the parameter ships inert. Disjoint files are not
       evidence of independence; the exchange is dataflow, not file overlap. Do not
       report a seam whose boundary a task plainly owns, and do not invent exchanges the
       descriptions don't imply.
    5. **Edge audit → NARRATIVE-EDGE.** For every blocking dep in the task tree, name — from
       the two descriptions — the specific artifact (interface, schema, file, recorded
       decision) the dependent consumes and the blocker produces. Three failures, one kind:
       (a) UNNAMEABLE — no artifact connects them; the edge encodes narration or "that area
       first". (b) MISDIRECTED — the artifact is real but a DIFFERENT task (often earlier in
       the same sub-epic) produces it; the edge gates the dependent behind work it never
       consumes; propose repointing at the actual producer. (c) DUPLICATED — a sibling
       already owns the integration with that sub-epic and carries the same edge; propose
       consuming the owning sibling's artifact instead. If the edge's only justification is
       an UNANSWERED design question (neither description decides who owns the exchanged
       data), report it as `UNOWNED-SEAM` instead — the boundary needs a contract, not an
       ordering. Do not flag edges onto `Seam contract:` beads (that is the seam mechanism
       working), and do not flag an edge whose artifact you can name and locate at its
       producer — a real edge is not a finding.
       Audit edges on `(epic)` nodes with EXTRA scrutiny: an epic→epic edge claims every
       leaf under the dependent epic needs all of the blocking epic finished. That claim is
       rarely true and its cost is the whole subtree's idle time — if the dependents' real
       needs are specific leaves of the blocking epic, the finding is MISDIRECTED with the
       proposed fix "narrow to leaf-level edges: <dependent leaf> → <specific producer
       leaf>, and drop the epic-level edge". An epic edge you can fully justify (every leaf
       genuinely consumes the whole epic's output) is not a finding, but say so explicitly
       in one line rather than skipping it.
    6. **Acceptance satisfiability → UNSATISFIABLE-ACCEPTANCE.** Two passes, the
       mechanical one FIRST. (a) MECHANICAL — for every `(needs: <id>)` citation in a
       task's acceptance text, look the cited id up in the task tree and walk the blocking
       edges: the cited bead must be a transitive BLOCKER of the task (it completes first).
       If it is a transitive DEPENDENT of the task, that is a finding, whatever the prose
       says — the criterion cannot be met at completion time. If no edge path connects the
       two in either direction, that is a finding of the `unwired` variant — propose the
       edge. This pass is a graph walk, not a judgment: do it for every citation, and report
       each result. (b) PROSE — where an acceptance criterion names another deliverable
       WITHOUT a citation ("the X validator accepts...", "passes the Y suite", "conforms to
       §N's contract"), resolve that deliverable to the task that produces it yourself and
       apply the same direction test; a producing task that is a transitive dependent is
       unsatisfiable — the cycle lives across the acceptance-text/dependency-graph boundary,
       which no single-artifact check spans. Propose either restating the criterion in
       terms of an artifact that exists when the task completes (adding the `(needs: <id>)`
       citation so the next round checks it mechanically), or re-pointing the edge so the
       validator genuinely precedes it. A criterion referencing a blocker is correct and is
       not a finding. (Measured: six prose-only review passes missed one instance of this
       class; the citation convention exists so that pass (a) cannot.)
    7. **Configuration coverage → UNEXERCISED-CONFIGURATION.** Where the spec (root or
       subepic) ENUMERATES runtime configurations — modes, player counts, platforms,
       feature-flag combinations, a test matrix — check that some task in the tree
       *exercises* each enumerated configuration (runs it end to end: one decision, one
       request, one invocation — not merely reads or unit-tests the code behind it), and
       that this task is not solely the terminal readiness/integration gate. An enumerated
       configuration that nothing runs before the terminal gate is a finding: evidence is
       the quoted enumeration and the configurations with no exercising task; the proposed
       fix is a `Configuration smoke:` leaf (name the entry point or command per
       configuration if the spec gives one) depending on the beads that make those
       configurations runnable, or naming the one existing bead that should absorb the
       exercise. A spec that enumerates nothing yields no finding of this kind — do not
       invent a configuration space.
    8. **Flag sweep.** Every id in "Flagged tasks" is an automatic finding — known-
       underdesigned work must not sail through silently — *unless* it already has an
       entry in the rejected-findings ledger, which takes precedence over the sweep.

    ## Required structured output (do NOT write a prose essay)

    One entry per finding:
    - **type:** `GAP` | `ORPHAN` | `UNOWNED-SEAM` | `NARRATIVE-EDGE` | `UNSATISFIABLE-ACCEPTANCE` (with `dependent` or `unwired` in the description) | `UNEXERCISED-CONFIGURATION` | flag-sweep
    - **description:** the problem, one sentence
    - **evidence:** the unmapped goal element, the orphaned task id, the seam's two
      participant task ids + the exchanged data/interface + the quoted description text
      implying the exchange, the edge (dependent ← blocker) + which of unnameable/
      misdirected/duplicated it is + the quoted description text, the quoted acceptance
      criterion + the producing (or cited) task id + the dependency path proving it is a
      transitive dependent (or the absence of any path, for `unwired`), the quoted
      configuration enumeration + the configurations with no exercising task, or the flag
      and its task id
    - **proposed fix:** a new leaf task under a named epic, or a new subepic needing
      design; for `UNOWNED-SEAM`, name the boundary to be contracted (arbitration turns an
      accepted seam into a contract bead + integration bead — see SKILL.md §Coverage); for
      `NARRATIVE-EDGE`, drop the edge, or name the task it should repoint to; for
      `UNSATISFIABLE-ACCEPTANCE`, the restated criterion (with its `(needs: <id>)`
      citation), the edge to re-point, or the edge to add; for `UNEXERCISED-CONFIGURATION`,
      the `Configuration smoke:` leaf (per-configuration entry point, and the beads it
      depends on) or the existing bead to extend

    Report only defensible findings. Quality over quantity — but do not soften.
```
