# Coverage Reviewer Subagent Prompt Template

Use this template for a `super-design` coverage reviewer. **Model: opus.** The same
template serves both per-subepic passes and the root pass — the caller fills in
the inputs below; the only pass-specific part is the canonical requirements section,
which is empty for per-subepic passes and turns off check 0. The
reviewer works in isolated context and must never have authored the tree.

```
Task tool (general-purpose), model: opus:
  description: "super-design coverage review: [SCOPE_NAME]"
  prompt: |
    You are a fresh-context coverage reviewer for a task tree. You did not author this
    tree. Your job is error-of-omission detection: a missed gap is worse than a false
    positive — the caller unions your findings with two other reviewers and verifies each
    one's evidence against these same inputs before applying it, so anything unsupported
    is filtered there. Surface anything plausible, and make the evidence checkable: a
    finding whose cited ids or quoted text don't hold up is dropped without a fix.

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

    ## Precomputed graph checks
    [PRECHECK — the `coverage-precheck` output for this round: `flag-sweep:`,
    `unstated:` and `citation:` lines over the whole tree.] Every `flag-sweep`, `unstated`,
    and `citation` line other than `blocker` is already a finding the caller filed; do not
    re-report it. Use the `citation:` lines as resolved facts.

    ## Changes since the previous round
    [CHANGED_TASKS — task ids created or amended by the previous round's applied fixes,
    each with the finding it answers. EMPTY on round 1.]

    ## Coverage ledger (every previously disposed finding, applied or rejected)
    [COVERAGE_LEDGER — contents of the coverage ledger in the run's artifact directory,
    if any.] If a finding of yours matches an entry here, still report it, tagged
    `ledger: <entry id>`, and say what evidence is new, if any — the caller drops true
    duplicates.

    ## Requirements (canonical)
    [REQUIREMENTS_CANONICAL — the orchestrator's R1…Rn list (root pass only; EMPTY for a
    per-subepic pass — skip check 0 entirely when this is empty), derived once per round
    from the root `## Goal` and root spec, one observable outcome per id. Stable across
    rounds and resumes: never renumber an existing id.]

    ## Checks

    0. **Requirement mapping (root pass only).** Do check 1's decomposition of the goal
       first, from the Goal and Spec alone, before reading the canonical list. Then, for
       each canonical requirement, list the task ids that deliver it, and propose every
       element of your own decomposition the list lacks as `R-new: <text>` — the
       orchestrator appends it to next round's list; never renumber or reuse an existing
       id yourself. Every canonical requirement with no mapped task is **also** reported
       as a `GAP` in the findings list below (check 1 still applies; this makes the
       omission explicit rather than folding it silently into the forward trace). Emit
       this mapping as the `requirements` output block, **before** the findings list.

    1. **Forward trace → GAP.** Decompose the goal into its necessary elements. Every
       element must map to at least one task or spec section. An unmapped element is a
       `GAP`.
    2. **Backward trace → ORPHAN.** Every task must serve some goal element. A task that
       serves none is an `ORPHAN`. Tasks titled `Seam contract:`, `Seam integration:`, or
       `Integration sweep:` are seam machinery created by coverage disposition, not decomposition — they
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
    5. **Edge audit → NARRATIVE-EDGE.** For every blocking dep in the task tree, read the
       dependent's `blocked-by <blocker-id>: consumes <artifact>` line for this edge's blocker
       (an edge with no such line is an `unstated:` line under Precomputed graph checks). A line
       whose `<artifact>` cannot be resolved to something the blocker actually delivers (its own
       description, acceptance, or fixed token: `all leaves (integration sweep)` for a sweep
       edge, `boundary contract` for a seam-contract edge) is a finding: report it with
       `unstated` in the evidence, naming the edge (dependent ← blocker) and the unresolvable
       line. When the line resolves, use it (plus the two descriptions) to name the specific artifact
       the dependent consumes and the blocker produces, and check for three further failures, one
       kind: (a) UNNAMEABLE — no artifact connects them; the edge encodes narration or "that area
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
    6. **Acceptance satisfiability → UNSATISFIABLE-ACCEPTANCE.** `(needs: <id>)` citations
       are already resolved (Precomputed graph checks). Your pass covers the uncited ones:
       where an acceptance criterion names another deliverable WITHOUT a citation ("the X
       validator accepts...", "passes the Y suite", "conforms to §N's contract"), resolve
       that deliverable to the task that produces it and walk the blocking edges: the
       producer must be a transitive BLOCKER of the task (it completes first). A producer
       that is a transitive DEPENDENT makes the criterion unsatisfiable at completion time,
       whatever the prose says; one no edge path connects is the `unwired` variant. Propose
       either restating the criterion in terms of an artifact that exists when the task
       completes (adding the `(needs: <id>)` citation so the next round's precheck resolves
       it), re-pointing the edge so the validator genuinely precedes it, or adding the
       missing edge. A criterion referencing a blocker is correct and is not a finding.
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
    8. **Previous round's fixes.** Every task named in "Changes since the previous round"
       was created or amended by this run's own coverage loop and has been read by no one.
       Run checks 1-7 over them as over any other task, and answer the two questions only
       these raise: does the fix actually close the finding it claims to (if not, re-report
       the original finding, with the shortfall as evidence), and did the fix introduce a
       seam, edge, or acceptance criterion of its own that checks 4-6 would flag? An empty
       section means this is round 1 — skip this check; its emptiness is NOT an
       INSUFFICIENT-INPUT.

    ## Required structured output (do NOT write a prose essay)

    **Root pass only:** first, a `requirements` block mapping every canonical id to the
    task ids that deliver it (`R-new: <text>` entries appended for any you propose) —
    this comes **before** the findings list, one line per requirement:

    ```
    requirements:
    R1 → bd-101, bd-104
    R2 → (unmapped)
    R-new: <text> → bd-107
    ```

    Then, one entry per finding:
    - **type:** `GAP` | `ORPHAN` | `UNOWNED-SEAM` | `NARRATIVE-EDGE` | `UNSATISFIABLE-ACCEPTANCE` (with `dependent` or `unwired` in the description) | `UNEXERCISED-CONFIGURATION` | `INSUFFICIENT-INPUT`
    - **description:** the problem, one sentence
    - **evidence:** the unmapped goal element, the orphaned task id, the seam's two
      participant task ids + the exchanged data/interface + the quoted description text
      implying the exchange, the edge (dependent ← blocker) + which of unstated/unnameable/
      misdirected/duplicated it is + the quoted description text (or the absence of a
      `blocked-by` line, for `unstated`), the quoted acceptance
      criterion + the producing (or cited) task id + the dependency path proving it is a
      transitive dependent (or the absence of any path, for `unwired`), the quoted
      configuration enumeration + the configurations with no exercising task, or what
      input is missing (`INSUFFICIENT-INPUT`)
    - **proposed fix:** a new leaf task under a named epic, or a new subepic needing
      design; for `ORPHAN`, delete the task or name the goal element to add that it
      serves; for `UNOWNED-SEAM`, name the boundary to be contracted; for
      `NARRATIVE-EDGE`, drop the edge, or name the task it should repoint to; for
      `UNSATISFIABLE-ACCEPTANCE`, the restated criterion (with its `(needs: <id>)`
      citation), the edge to re-point, or the edge to add; for `UNEXERCISED-CONFIGURATION`,
      the `Configuration smoke:` leaf (per-configuration entry point, and the beads it
      depends on) or the existing bead to extend

    State each finding at full strength and do not soften it. Filtering happens downstream:
    the caller verifies every finding against these inputs, so do not pre-filter by
    importance or certainty.
```
