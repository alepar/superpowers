# Planner Subagent Prompt Template

Use this template when dispatching the epic planner in autonomous beads mode. **Model: opus**
(planning is judgment-heavy). This is a **once-per-epic dispatch, then append-only on refill** —
not a per-ready-task dispatch inside the main coordinator loop. See `coordinator-workflow.md`'s
"Plan materialization" for why the planner sits in `config.models` even though it isn't one of
the arrows in the per-task pipeline.

The planner writes the plan into `<workspace>/plan.md` (see "Plan file" below) and writes no code.

```
Task tool (general-purpose), model: opus:
  description: "Plan epic [epic id]: [epic name]"
  prompt: |
    You are materializing the implementation plan for a beads epic into a plan file that
    `subagent-driven-development`'s `scripts/task-brief` can read. `task-brief`'s heading match
    requires the token after "Task" to start with a digit, so real bead ids (e.g. `bd-20`) can
    never be plan headings — every task section is headed by a **sequential integer ordinal**,
    with an ordinal-to-bead-id mapping recorded in a table so the bead id remains the durable
    identity for every `bd` command (`bd show`, `bd close`, `bd create`).

    ## Epic

    [epic id] — [epic name]. [FULL TEXT of `bd show` on the epic: description and any
    Global Constraints in the epic body — paste it; do not make the subagent guess]

    ## Beads to plan this round

    [FULL TEXT of `bd show` for every ready/blocked descendant bead that does not yet have a
    plan.md section — title, description, acceptance criteria, any files-touched hint, paste
    each in full. On the epic's first planning round this is every ready/blocked descendant;
    on a refill round it is only the newly-ready or newly-created beads (blocker beads included)]

    ## Plan file

    [path to <workspace>/plan.md, e.g. the output of `scripts/sdd-workspace plan.md`]

    ## Your Job

    1. `scripts/sdd-workspace` errors if `plan.md` does not already exist — it does not create
       it for you. So if `plan.md` does not exist yet: `mkdir -p` the workspace directory
       yourself and write an initial `plan.md` there (mapping table header only, no data rows
       yet), *then* run `scripts/sdd-workspace plan.md` to canonicalize the path and git-ignore
       it, before continuing to step 2.
    2. For each bead listed in "Beads to plan this round" that does not already have a mapping
       row:
       - Assign it the next ordinal **in dependency order**, continuing the existing sequence
         (starting at 1 on a fresh plan.md). Never reuse or reassign an ordinal already bound to
         a different bead.
       - Determine this task's **`filesTouched: string[]`** — the concrete list of every file it
         will create or modify. This is your best declaration from the bead and the repo, and it
         is required, not a hint: the coordinator uses it to decide which tasks may run
         concurrently (same-file tasks must never run as siblings), so an incomplete list
         degrades parallel safety. When you are uncertain whether a file belongs, over-declare
         rather than under-declare — over-declaring only costs serialization; under-declaring
         costs a write collision.
       - Append one row to the mapping table: ordinal, bead id, task name, `filesTouched`.
       - Append a `## Task <N>` section, headed by the **ordinal** (never the bead id), containing:
         - The `filesTouched` list, stated first, in the section body itself (not only in the
           mapping table) — `scripts/task-brief` extracts only this section, so the implementer
           never sees the mapping table and needs the list here too.
         - The bead's acceptance criteria and any epic-level Global Constraints, carried verbatim.
         - Bite-sized, TDD-structured implementation steps with complete content — no placeholders.
         - An independently testable deliverable. This plan is consumed directly by
           `scripts/task-brief` and the implementer/reviewer loop that follows it — do not write
           a two-stage spec-then-quality review contract; SDD's current Task Loop reviews spec
           compliance and quality together, in one reviewer dispatch.
    3. Never renumber or rewrite an ordinal or `## Task <N>` section already present in `plan.md`,
       even if you would word it differently now — a fix round may still be pointing at it.
    4. If a bead is genuinely too ambiguous to plan (not merely underspecified — a real missing
       decision), leave it out of the mapping table and this round's sections, and report it as
       BLOCKED with exactly what decision is missing. Do not invent scope to force a plan.

    ## Constraints

    - Do NOT write or modify any source code. Planning only.
    - Do NOT close or claim any beads issue. The coordinator manages issue state.
    - Do NOT touch a `## Task <N>` section or mapping row for a bead outside "Beads to plan
      this round" — those belong to a different planning round or a task already in flight.

    ## Report Format

    - **Status:** DONE | PARTIAL | BLOCKED
    - `planPath`: the `plan.md` path
    - `mapping`: one entry per bead planned this round — `{n: <ordinal>, id: <bead id>,
      files: <filesTouched list>}`. `files` is required on every entry; it is how the
      coordinator's disjoint-file grouping stays safe.
    - Any beads left unplanned as BLOCKED, and exactly what decision is missing for each
```
