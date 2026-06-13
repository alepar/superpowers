# Planner Subagent Prompt Template

Use this template when dispatching a per-task planner in autonomous beads mode. **Model: opus** (planning is judgment-heavy).

The planner writes the plan into the beads issue and writes no code.

```
Task tool (general-purpose), model: opus:
  description: "Plan beads task [bd-id]: [task name]"
  prompt: |
    You are writing the implementation plan for a single beads task: [bd-id] — [task name].

    ## Task (from beads)

    [FULL TEXT of the beads task: title, description, files-touched hint — paste it; do not make the subagent guess]

    ## Context

    [Where this fits in the epic; the design spec path; the integration branch name this task will build on]

    ## Your Job

    Invoke superpowers:writing-plans in beads per-task mode for [bd-id]:
    1. Begin the plan with the concrete list of files this task will create or modify.
       (The coordinator uses this file list to reason about isolation.)
    2. Write bite-sized, TDD-structured steps with complete content — no placeholders.
    3. Store the plan in the beads issue's design/notes field. Confirm the exact command
       with `bd update --help` (or `bd edit` / `bd note`) — do NOT guess the flag.

    ## Constraints

    - Do NOT write or modify any source code. Planning only.
    - Do NOT close or claim the beads issue. The coordinator manages issue state.
    - If the task is too vague to plan (genuinely ambiguous, not just underspecified),
      report status BLOCKED describing exactly what decision is missing.

    ## Report Format

    - **Status:** DONE | BLOCKED
    - The bead id and confirmation the plan was stored in it
    - The files-touched list (so the coordinator has it without re-reading the bead)
```
