# Coordinator Workflow (Autonomous Beads Execution)

Reference for the **Workflow-coordinated autonomous mode** of `subagent-driven-development`. Use this when SDD is handed a beads epic **and** the `Workflow` tool is available. The Workflow script is the *mechanical* coordinator; every judgment call is delegated to a short-lived `agent()`.

**Core principle:** tasks coordinate **only** through beads and the integration branch — never through shared session context. Beads is the durable shared state; the integration branch is the durable shared code. This is what prevents the state-drift that is the dominant multi-agent failure mode.

## Key constraint: the script does no I/O

A Workflow script can call only its hooks — `agent()`, `pipeline()`, `parallel()`, `log()`, `phase()`. It has **no shell, no filesystem, no git, no `bd`**. So every side-effect happens *inside* a dispatched agent:

| Side-effect | Who does it |
|-------------|-------------|
| `bd ready`, `bd show`, `bd close`, `bd create` | a dispatched agent (returns structured data via `schema`) |
| git: create worktree, rebase, test, merge | the implementer agent (its own worktree) and the merge agent (integration worktree) |
| decide resolvable vs escalate | the triage agent (opus) |

The script's job is sequencing, fan-out, the concurrency cap, and the serial merge gate.

## Pre-flight (before launching the Workflow)

Done by the main session, not the Workflow:

1. Confirm `bd` is available and identify the epic id(s) for this session. If there is more than one candidate or scope is ambiguous, **confirm scope with the user** before launching.
2. Create the **epic integration branch on its own worktree**, following `superpowers:using-git-worktrees` (project-local `.worktrees/`, verified git-ignored). The user's original worktree stays untouched. Record: epic id, integration branch name, integration worktree path.
3. Choose a concurrency cap (default 4–6; the Workflow tool also caps at `min(16, cores-2)`).
4. Launch the Workflow (background) with these values in `args`. Progress is visible via `/workflows`; the main session is free.

## The coordinator loop

Round-based with refill (each `bd ready` batch is, by definition, mutually independent):

1. **Query** — an agent runs `bd ready --json` (epic-scoped) and returns the ready task ids.
2. **Terminate?** — if the ready set is empty, the loop ends.
3. **Pipeline the batch** — run the ready tasks through the per-task pipeline (below), up to the concurrency cap, with **no barrier between stages** (a fast task isn't held up by a slow sibling).
4. **Serial merge gate** — completed tasks are merged back into the integration branch **one at a time** (never two concurrently). A successful merge does `bd close <id>`.
5. **Refill** — closing tasks unblocks dependents, so loop back to step 1; the next `bd ready` surfaces them, and their worktrees are cut from the now-updated integration branch.

Termination is by the ready set draining, **not** by token budget — there is no budget-based pause.

## Per-task pipeline (model-tiered)

Each task, in its **own worktree branched from the integration branch**:

`plan (opus)` → `implement (sonnet)` → `spec-compliance review (sonnet)` → `code-quality review (sonnet)` → fix-loop (≤3 iterations) → enqueue for serial merge.

The two-stage review order (spec compliance first, then code quality), the fix-loop, and the implementer status handling (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED) are exactly as defined in `SKILL.md` — this mode changes *who orchestrates* them (the Workflow), not the review discipline. Templates: `./planner-prompt.md`, `./implementer-prompt.md`, `./spec-reviewer-prompt.md`, `./code-quality-reviewer-prompt.md`.

## Serial merge-back

In the integration worktree, for one task at a time:

1. Update the integration branch; rebase the task branch onto it.
2. Run the project test command.
3. If clean → merge (`--no-ff`) into the integration branch, then `bd close <id>`.
4. If the rebase conflicts **or** tests are red: make **one bounded auto-resolve attempt** (a fix agent). If that fails → the **blocker-bead path**.

## Blocker-bead path (the escalation currency)

Anything that cannot proceed becomes a beads issue, never a silent retry and never a hard stop:

- **Trigger:** an implementer reporting BLOCKED after 3 no-progress fix-loops (it files the bead itself — see `./implementer-prompt.md`), or a merge that fails its one auto-resolve attempt (the merge agent files the bead).
- **Bead shape:** a `bd create` with a `blocker` label, body stating the task id, what failed, and what was tried. Confirm flags with `bd create --help`.
- **Triage (opus):** the coordinator dispatches the triage agent (`./triage-prompt.md`) with the blocker bead + the task's stored plan + the relevant spec excerpt. It returns exactly one of:
  - `RESOLVE: <clarification>` → the coordinator re-dispatches the task with that clarification added to its context (next round). Use only when the answer is genuinely derivable from the existing spec/beads.
  - `ESCALATE: <summary + decision needed>` → escalation (below).

## Escalation = notify + quarantine + continue

On `ESCALATE`, the run **does not freeze**:

1. **Notify** the user immediately. From a background workflow, prefer a dispatched notify agent (if `PushNotification` / an MCP messaging tool is available) and always `log()` the escalation so it surfaces in `/workflows` and the completion notification.
2. **Quarantine** — leave the blocker bead open. The blocked task stays open, and its dependents remain unready in beads automatically, so they are skipped without extra bookkeeping.
3. **Continue** — keep driving every other ready task to completion.

When the ready set finally drains, the run ends and reports: tasks completed, open `blocker` beads, and quarantined subtrees. The user resolves the blockers and **re-invokes the coordinator**, which picks up the now-ready work.

## Finish

When the loop ends (and at least some work landed), dispatch the **final whole-epic review (opus)** against the integration branch, then hand to `superpowers:finishing-a-development-branch`, which merges the integration branch into the user's base branch and cleans up the integration worktree.

## Annotated script skeleton

Illustrative — adapt names/prompts to the epic. Every `agent()` call carries the real I/O; the script only sequences. `opts.model` is set explicitly per role.

```javascript
export const meta = {
  name: 'beads-epic-coordinator',
  description: 'Autonomously drive a beads epic to completion via worktree-isolated, reviewed task pipelines',
  phases: [
    { title: 'Ready' },        // bd ready query
    { title: 'Implement' },    // plan -> impl -> review per task
    { title: 'Integrate' },    // serial merge-back
    { title: 'Triage' },       // blocker beads
    { title: 'Finish' },
  ],
}

// args: { epicId, integrationBranch, integrationWorktree, cap }
const { epicId, integrationBranch, integrationWorktree, cap } = args
const READY = { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } }, required: ['ids'] }
const RESULT = { type: 'object', properties: { id: {type:'string'}, status: {type:'string'}, branch: {type:'string'}, blockerBead: {type:'string'} }, required: ['id','status'] }
const TRIAGE = { type: 'object', properties: { decision: {type:'string'}, detail: {type:'string'} }, required: ['decision','detail'] } // decision: RESOLVE | ESCALATE
const MERGE = { type: 'object', properties: { id:{type:'string'}, merged:{type:'boolean'}, blockerBead:{type:'string'} }, required: ['id','merged'] }

const escalated = []
const completed = []

while (true) {
  phase('Ready')
  const ready = await agent(
    `Run \`bd ready --json\` scoped to epic ${epicId} and return the ready task ids. Do not start any work.`,
    { label: 'bd-ready', phase: 'Ready', schema: READY, model: 'sonnet' })
  const ids = (ready?.ids ?? []).filter(id => !escalated.includes(id))
  if (ids.length === 0) break

  // Per-task pipeline. NO barrier between stages: a fast task proceeds while a slow sibling lags.
  // plan = opus; implement + reviews = sonnet. Each agent works in its own worktree cut from the
  // integration branch and does its own git/bd I/O (see prompt templates).
  phase('Implement')
  const results = await pipeline(ids,
    id  => agent(planPrompt(id, integrationBranch),       { label: `plan:${id}`,   phase: 'Implement', model: 'opus',   schema: RESULT }),
    pl  => agent(implementPrompt(pl, integrationBranch),  { label: `impl:${pl.id}`, phase: 'Implement', model: 'sonnet', schema: RESULT }),
    im  => agent(specReviewPrompt(im),                    { label: `spec:${im.id}`, phase: 'Implement', model: 'sonnet', schema: RESULT }),
    sr  => agent(qualityReviewPrompt(sr),                 { label: `qual:${sr.id}`, phase: 'Implement', model: 'sonnet', schema: RESULT }),
  )

  // SERIAL merge gate — outside any parallel/pipeline stage so only one merge touches the
  // integration branch at a time. Runs in the integration worktree.
  phase('Integrate')
  for (const r of results.filter(Boolean)) {
    if (r.status === 'BLOCKED') { await handleBlocker(r); continue }
    const m = await agent(mergePrompt(r, integrationBranch, integrationWorktree),
      { label: `merge:${r.id}`, phase: 'Integrate', model: 'sonnet', schema: MERGE })
    if (m.merged) completed.push(r.id)
    else await handleBlocker({ id: r.id, blockerBead: m.blockerBead })
  }
}

phase('Finish')
log(`Completed: ${completed.length}. Escalated: ${escalated.length}.`)
const review = completed.length
  ? await agent(`Final whole-epic review of integration branch ${integrationBranch} for epic ${epicId}.`,
      { label: 'final-review', phase: 'Finish', model: 'opus' })
  : 'no work landed'
return { completed, escalated, review }

// --- helpers ---
async function handleBlocker(r) {
  phase('Triage')
  const t = await agent(triagePrompt(r.id, r.blockerBead),
    { label: `triage:${r.id}`, phase: 'Triage', model: 'opus', schema: TRIAGE })
  if (t.decision === 'RESOLVE') {
    // re-dispatch next round with clarification recorded on the bead; do NOT mark escalated
    await agent(recordClarificationPrompt(r.id, t.detail), { label: `clarify:${r.id}`, phase: 'Triage', model: 'sonnet' })
  } else {
    escalated.push(r.id)                       // quarantine: dependents stay unready in beads
    await agent(notifyPrompt(r.id, t.detail), { label: `notify:${r.id}`, phase: 'Triage', model: 'sonnet' }) // push if available
    log(`ESCALATED ${r.id}: ${t.detail}`)      // always surfaces in /workflows + completion
  }
}
```

> The Workflow tool's built-in `isolation:'worktree'` is **not** used here: it branches from the repo's current HEAD (not our integration branch) and auto-removes worktrees that end up unchanged. We need worktrees cut from the integration branch with controlled merge-back, so the agents create and merge worktrees explicitly (per `superpowers:using-git-worktrees`).
