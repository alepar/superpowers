# Triage Subagent Prompt Template (Coordinator-Brain)

Use this template when a blocker bead has been filed and the coordinator needs a judgment call:
can this be resolved from what we already have, or does it need the user? **Model: opus.**

This is the only point where the otherwise-mechanical autonomous coordinator exercises judgment.
Its output drives whether the run re-dispatches the task or escalates. See
`coordinator-workflow.md`'s "The blocker-bead path" and "Escalation = notify + quarantine +
continue" for how the coordinator acts on each decision below.

**Autonomous-mode contract:** triage never silently drops a blocked task. Every blocker bead
triage handles ends in exactly one of two outcomes — returned to the ready queue with a changed
approach (RESOLVE), or left quarantined with the reason recorded on the bead (ESCALATE) — never
a third outcome, and triage itself never closes, abandons, or silently reprioritizes the bead.

```
Task tool (general-purpose), model: opus:
  description: "Triage blocker for [bd-id]"
  prompt: |
    A task in an autonomous run is blocked. Decide whether it can be resolved from the
    existing plan/beads, or whether it genuinely needs the user. Whatever you decide, this
    task is never silently dropped: it is either returned to the ready queue with a changed
    approach, or left quarantined — open, with the reason recorded — for the user to resolve.

    ## Blocker bead

    [FULL TEXT of the `blocker`-labelled beads issue: task id, what failed, what was tried]

    ## Originating task plan

    [The blocked task's `## Task <N>` section from `plan.md` — look up its ordinal via the
    mapping table using the bead id — files-to-touch, acceptance criteria, implementation steps]

    ## Relevant spec excerpt

    [The section(s) of the design spec that govern this task]

    ## Your Job

    Determine the cause and pick exactly one decision:

    - **RESOLVE** — the answer is genuinely derivable from the plan/spec/beads already provided
      (a misread requirement, a detail that IS specified, a mechanical fix the implementer
      missed). Provide the specific clarification to inject into a re-dispatch.

    - **ESCALATE** — the blocker needs the user: a real ambiguity the spec doesn't settle,
      a decision the user owns, OR work discovered outside the beads graph (new requirement
      or dependency). Do NOT invent scope to avoid escalating.

    Bias: only RESOLVE when you are confident the clarification is correct and grounded in
    the provided materials. A wrong RESOLVE wastes a full re-dispatch and can corrupt the
    integration branch. When uncertain, ESCALATE.

    ## Constraints

    - Do NOT write or modify any source code, plan.md, or beads issue state yourself. Report
      your decision; the coordinator re-dispatches or quarantines based on it.

    ## Output Contract (exact)

    Return structured output with exactly two fields, `decision` and `detail`:

    - `decision`: the **bare token** `RESOLVE` or `ESCALATE` and nothing else — no colon, no
      appended text. The coordinator branches on exact string equality against this field; any
      other content (e.g. `"RESOLVE: the flag was ambiguous"`) fails that comparison and is
      silently treated as an ESCALATE.
    - `detail`:
      - when `decision` is `RESOLVE`: the clarification text to add to the task's context on
        re-dispatch.
      - when `decision` is `ESCALATE`: a one-paragraph summary for the user + the specific
        decision needed.
```
