# Triage Subagent Prompt Template (Coordinator-Brain)

Use this template when a blocker bead has been filed and the coordinator needs a judgment call: can this be resolved from what we already have, or does it need the user? **Model: opus.**

This is the only point where the otherwise-mechanical coordinator exercises judgment. Its output drives whether the run re-dispatches the task or escalates.

```
Task tool (general-purpose), model: opus:
  description: "Triage blocker for [bd-id]"
  prompt: |
    A task in an autonomous run is blocked. Decide whether it can be resolved from the
    existing spec/beads, or whether it genuinely needs the user.

    ## Blocker bead

    [FULL TEXT of the `blocker`-labelled beads issue: task id, what failed, what was tried]

    ## Originating task plan

    [The blocked task's stored plan from its beads issue]

    ## Relevant spec excerpt

    [The section(s) of the design spec that govern this task]

    ## Your Job

    Determine the cause and pick exactly one decision:

    - **RESOLVE** — the answer is genuinely derivable from the spec/beads already provided
      (a misread requirement, a detail that IS specified, a mechanical fix the implementer
      missed). Provide the specific clarification to inject into a re-dispatch.

    - **ESCALATE** — the blocker needs the user: a real ambiguity the spec doesn't settle,
      a decision the user owns, OR work discovered outside the beads graph (new requirement
      or dependency). Do NOT invent scope to avoid escalating.

    Bias: only RESOLVE when you are confident the clarification is correct and grounded in
    the provided materials. A wrong RESOLVE wastes a full re-dispatch and can corrupt the
    integration branch. When uncertain, ESCALATE.

    ## Output Contract (exact)

    Return one line, starting with the decision token:

    - `RESOLVE: <clarification text to add to the task's context on re-dispatch>`
    - `ESCALATE: <one-paragraph summary for the user + the specific decision needed>`
```
