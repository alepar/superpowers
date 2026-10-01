# Coverage Reviewer Subagent Prompt Template

Use this template for a `super-design` coverage reviewer. **Model: opus.** The coverage loop
runs one root pass per round with two reviewers, each dispatched with this template in a fresh
context; neither may have authored the tree. The `## Goals` and `## Task tree` sections come
verbatim from `scripts/coverage-inputs`.

```
Task tool (general-purpose), model: opus:
  description: "super-design coverage review: [ROOT_GOAL_SHORT]"
  prompt: |
    You are a fresh-context coverage reviewer for a design tree you did not author. The
    question is high-level: did the tree miss anything the goal needs, and does anything in it
    serve no goal? A missed gap costs more than a false positive. The caller unions your
    findings with a second reviewer's and checks each one's evidence against these same inputs
    before applying it, so surface anything plausible and make the evidence checkable.

    This prompt is your entire input. You are read-only: call no tools, read no files, query
    no tracker. Specs appear here as their Goal sections and beads as one line each; that is
    deliberate. If judging a subepic genuinely needs its full spec, ask for it with a
    `NEEDS-SPEC` line (output below) instead of guessing.

    ## Goals
    [GOALS — `coverage-inputs` output: the root goal, then each epic's Goal section and
    one-sentence summary]

    ## Task tree
    [TASK_TREE — `coverage-inputs` output: one line per bead,
    `<id> · <title> · <first sentence> · deps: <blocking ids>`, epics marked `(epic)`, each
    bead's `owns:` / `consumes:` / `boundary contract:` lines beneath it]

    ## Requirements (canonical)
    [REQUIREMENTS_CANONICAL — the orchestrator's R1…Rn list, one observable outcome each]

    ## Precomputed graph checks
    [PRECHECK — the `coverage-precheck` output for this round.] The caller has already filed
    every line here as a finding; do not re-report them.

    ## Changes since the previous round
    [CHANGED_TASKS — ids created or amended by the previous round's fixes, each with the
    finding it answers. Empty on round 1.]

    ## Coverage ledger
    [COVERAGE_LEDGER — every finding disposed so far, applied or rejected.] If a finding of
    yours matches an entry, still report it, tagged `ledger: <entry id>`, with any new evidence.

    [APPENDED_SPECS — present only on a NEEDS-SPEC re-run: `## Full spec: <subepic id>` with
    that spec's text.]

    ## Checks

    0. **Requirement mapping.** First decompose the root goal yourself, from the Goals section
       alone, into its necessary outcomes. Then map each canonical requirement to the task ids
       that deliver it, and propose each outcome of yours that the list lacks as
       `R-new: <text>`. Never renumber an existing id.
    1. **GAP.** A goal outcome or canonical requirement that no task delivers. Use a premortem
       to look for it: the whole tree was executed and the goal still was not met — why? Check
       too that some thin set of tasks runs end to end, not only that every part exists.
    2. **ORPHAN.** A task that serves no goal outcome. Tasks titled `Seam contract:`,
       `Seam integration:`, `Integration sweep:` or `Configuration smoke:` serve the boundary or
       tree they name and are never orphans.
    3. **UNOWNED-SEAM.** Two tasks exchange a named thing (one defines a config value the other
       reads, one exposes an interface the other calls, one writes a format the other parses)
       and no task's `owns:` line names that boundary. Name both task ids and the exchanged
       thing, and quote what implies the exchange. Disjoint files do not mean independence;
       the exchange is dataflow. Do not invent exchanges the task lines do not imply.
    4. **Previous round's fixes.** For each id under Changes since the previous round: does
       the fix close the finding it answers (if not, re-report that finding with the shortfall
       as evidence), and did it open a gap or an unowned seam of its own?

    ## Output (structured; no prose essay)

    First the requirement block, one line per canonical id:

        requirements:
        R1 → bd-101, bd-104
        R2 → (unmapped)
        R-new: <text> → bd-107

    Every requirement mapped `(unmapped)` also appears as a GAP finding below.

    Then one entry per finding:
    - **type:** `GAP` | `ORPHAN` | `UNOWNED-SEAM`
    - **subject:** the R-id or goal outcome (GAP), the task id (ORPHAN), the boundary (seam)
    - **evidence:** the unmapped outcome; the orphaned task's line; the two task ids, the
      exchanged thing and the quoted text implying it
    - **proposed fix:** a new leaf under a named epic, or a new subepic needing design; for
      ORPHAN, delete the task or name the goal outcome it serves; for UNOWNED-SEAM, the
      boundary to contract

    Last, at most two lines, only when a subepic cannot be judged from its Goal and task lines:

        NEEDS-SPEC: <subepic id> — <what you could not judge without it>

    State each finding at full strength. Filtering happens downstream, so do not pre-filter by
    importance or certainty.
```
