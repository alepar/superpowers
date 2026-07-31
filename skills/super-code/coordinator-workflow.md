# Coordinator Workflow (Autonomous Beads Execution)

Reference for the **Workflow-coordinated autonomous mode** of `super-code`. Use this when a
beads epic is handed to the coordinator **and** the `Workflow` tool is available. The Workflow
script is the *mechanical* coordinator; every judgment call is delegated to a short-lived
`agent()`. Per-task mechanics — the brief/review/fix-loop discipline — are not reinvented here:
this doc points at `subagent-driven-development`'s current scripts and prompts by name and
layers only what autonomous, beads-driven execution adds on top: worktree-per-task off an
integration branch, serial merge-back, and the blocker-bead escalation currency.

**Core principle:** tasks coordinate **only** through beads and the integration branch — never
through shared session context. Beads is the durable shared state; the integration branch is the
durable shared code. This is what prevents the state-drift that is the dominant multi-agent
failure mode.

## Coordinator contract

Later tasks in this skill (the prompt files, the Workflow script itself) are written against
this exact shape. Treat it as load-bearing — a differently-spelled key breaks every later task
silently.

```
args = {
  epicId,
  integrationBranch,
  dryRun,
  config: {
    concurrency: 4,
    models: { planner: 'opus', implementer: 'sonnet', reviewer: 'sonnet', triage: 'opus', finalReview: 'opus' },
  },
  prompts: { ... },
}
```

`dryRun: true` swaps every dispatched agent for a canned stub, for the same reason as
`super-roast`'s dryRun policy (see `skills/super-roast/super-roast-workflow.md`): validate the
script's topology — sequencing, fan-out, the concurrency cap, the merge gate — for pennies,
without spending real model budget or touching git/bd. The stub table and dryRun assertions for
this skill's script are a later task's concern; this doc only reserves the field in the contract.

**Per-task pipeline** (the sequence every ready bead runs through once dispatched — see
"Per-task pipeline" below for the full walk-through):

```
task-brief → implementer → review-package → task-reviewer → (fix rounds ≤5 → re-review) → ledger
```

This is `subagent-driven-development`'s current Task Loop (SKILL.md, "The Task Loop" /
"Final Review"), unmodified in substance. Autonomous mode changes *who* drives it (a dispatched
agent per stage instead of the interactive controller) and *what happens when a load-bearing
finding survives the fix-loop cap* (files a blocker bead instead of stopping the session — see
"The breaker, autonomous variant" below). It does not change the review discipline itself.

## Key constraint: the script does no I/O

A Workflow script can call only its hooks — `agent()`, `pipeline()`, `parallel()`, `log()`,
`phase()`. It has **no shell, no filesystem, no git, no `bd`**. So every side-effect happens
*inside* a dispatched agent:

| Side-effect | Who does it |
|-------------|-------------|
| `bd ready`, `bd show`, `bd close`, `bd create` | a dispatched agent (returns structured data via `schema`) |
| `scripts/sdd-workspace`, `scripts/task-brief`, `scripts/review-package` | a dispatched agent (these are shell scripts; the coordinator script cannot invoke them) |
| git: create worktree, rebase, test, merge | the implementer agent (its own worktree) and the merge agent (integration worktree) |
| decide resolvable vs escalate | the triage agent (opus) |

The script's job is sequencing, fan-out, the concurrency cap, and the serial merge gate. Building
a prompt string from a template literal (interpolating a task id, a branch name) is not I/O and
belongs in the script; reading a file's contents to build that string is I/O and belongs in a
dispatched agent.

## Authoring pitfalls (plumbing that crashes the coordinator before real work runs)

These three are *control-plane* bugs, not task logic — each kills the run on round 0–1 with a
misleading symptom. The skeleton below already guards against them; keep the guards when you
adapt it.

- **Validate `args` on the first line, fail loud.** `const { epicId } = args` silently yields
  `undefined` when args didn't arrive as an object (e.g. a stringified value, or a renamed
  field). It then crashes *late and cryptically* — often only when the first **non-empty**
  `.filter()` runs its callback (an empty ready set never invokes the callback, so an
  `undefined`-driven `ALLOWED.includes` looks fine for several rounds, then explodes). Add
  `if (!epicId) throw new Error('args: ' + JSON.stringify(args))` and `log()` the args up front
  so a mis-pass dies on line 1 with the actual value shown.
- **Keep control-flow queries mechanical — never an agent judgment call.** The `bd ready` step
  *decides what runs*; it must be deterministic. An agent told to "return the ready ids" can
  return `{ids:[]}` **despite printing the matching tasks in the same turn**. Have it echo the
  verbatim output of a precise command and forbid reasoning: agents do the *work*, the script
  does the *sequencing*.
- **Don't pipe a CLI's `--json` straight into a schema.** `bd ready --json` (and many `--json`
  flags) can emit the value plus trailing legend/warning text, so the agent's `JSON.parse` throws
  "Extra data". Prefer plain output + a `grep` for the handful of ids you actually need.

## Pre-flight (before launching the Workflow)

Done by the main session, not the Workflow:

1. Confirm `bd` is available and identify the epic id(s) for this session. If there is more than
   one candidate or scope is ambiguous, **confirm scope with the user** before launching.
2. Create the **epic integration branch on its own worktree**, following
   `superpowers:using-git-worktrees` (project-local `.worktrees/`, verified git-ignored). The
   user's original worktree stays untouched. Record: epic id, integration branch name,
   integration worktree path.
3. Choose a concurrency cap (default 4; the Workflow tool also caps at `min(16, cores-2)`).
4. Launch the Workflow (background) with the args from "Coordinator contract" above. Progress is
   visible via `/workflows`; the main session is free.

## The coordinator loop

Round-based with refill (each `bd ready` batch is, by definition, mutually independent):

1. **Query** — an agent runs `bd ready --exclude-type=epic --label sp:<epicId>` (excludes
   epic-type containers, which `bd ready` includes by default, and scopes to this run's tree,
   since `bd ready` is otherwise repo-global) and returns the ready task ids.
2. **Terminate?** — completion is **the root epic (`epicId`) closed**, not an empty ready set:
   run the epic-closure step (below) after each refill cycle and check whether the root closed.
   An empty ready set with the root still open means the remaining work is quarantined blockers
   (see "The blocker-bead path") — that ends the loop too, but as a report, not a clean finish.
3. **Group for parallelism, then pipeline the batch** — group the round's ready ids by the files
   each declares it touches (recorded on the bead body / brief, not derived by the script).
   Dispatch disjoint-file groups concurrently, up to the concurrency cap (default 4); any two
   ready ids that share a file **serialize** within the round — never siblings in the same
   `pipeline()`/`parallel()` call, since concurrent implementers on the same file race each
   other's worktree and merge. Within a group, run the per-task pipeline (below) with **no
   barrier between stages** (a fast task isn't held up by a slow sibling).
4. **Serial merge gate** — completed tasks are merged back into the integration branch **one at
   a time** (never two concurrently), in dependency order. A successful merge does
   `bd close <id>` — a leaf-task close; epic closure is the separate step below.
5. **Epic closure** — `bd epic close-eligible` closes only one tree level per call, so loop it to
   a fixpoint (repeat until a pass closes nothing; with `--json` the stop signal is output
   exactly `[]`, not a `count: 0` object) after each refill cycle, before re-querying ready work.
   Same contract as SKILL.md's manual mode — the coordinator changes *who runs it* (a dispatched
   agent), not the idiom.
6. **Refill** — closing tasks unblocks dependents, so loop back to step 1; the next ready query
   surfaces them, and their worktrees are cut from the now-updated integration branch.

Termination is by the root epic closing, **not** by token budget — there is no budget-based
pause.

## Per-task pipeline

Each ready bead, in its **own worktree branched from the epic integration branch** (fork-specific
— see "What autonomous mode changes" below), runs `subagent-driven-development`'s current Task
Loop:

`scripts/task-brief` (task brief) → `implementer-prompt.md` (sonnet) →
`scripts/review-package BASE HEAD` → `task-reviewer-prompt.md` (sonnet; single reviewer,
spec-compliance **and** quality in one dispatch — SDD's current template, not the retired
two-stage spec/quality split) → on findings, fix rounds (≤5) each ending with a scoped
`re-review-prompt.md` over the fix diff → a completion line in the ledger.

`scripts/task-brief` needs a `PLAN_FILE` a beads epic doesn't have on its own — that file is
produced upstream of this sequence by the planner (opus); see "Plan materialization" for why
`planner` sits in `config.models` even though it isn't one of the arrows above.

This is exactly `subagent-driven-development`'s SKILL.md "The Task Loop" and "Final Review"
sections — read those for the review-package/reviewer-inputs/fix-loop mechanics in full; they
are not repeated here. What follows is only what changes for a bead instead of a plan-file task.

### Plan materialization

`scripts/sdd-workspace` and `scripts/task-brief` are written against a hand-authored
`PLAN_FILE` with `## Task <N>` headings — they have no beads awareness. A beads epic has no such
file, so the coordinator materializes one: once per epic, a **planner (opus)** agent reads the
epic's beads tree (`bd show` on the epic and its ready/blocked descendants) and writes
`<workspace>/plan.md`, one `## Task <id>` section per bead, using the bead id as `N` — carrying
the bead's acceptance criteria and any Global Constraints from the epic body verbatim, the same
content discipline SKILL.md expects of a hand-written plan. `<workspace>` is this skill's
`scripts/sdd-workspace plan.md`; because that script requires the file to already exist, the
planner's first action on a fresh epic is to `mkdir -p` the directory and write an initial
`plan.md` itself before calling `sdd-workspace` to canonicalize the path and git-ignore it. On
refill, the planner agent re-runs to append sections for newly-ready or newly-created beads
(blocker beads included) that plan.md doesn't yet carry — append-only, never rewriting a section
`task-brief` has already extracted, since fix rounds may still be pointing at it.

This is a one-time-per-epic (then append-only) opus dispatch, not a per-task judgment call — it
is why `planner` sits in `config.models` even though it does not appear inside the quoted
per-task pipeline sequence: it produces the artifact that sequence's first step,
`scripts/task-brief`, consumes. Bead ids are used as `N` directly, so ledger lines, brief/report
filenames, and review-package names all key off the same id the ready query and merge already
use — no id-translation step anywhere in the loop.

### Dispatching the implementer

The dispatch prompt follows SKILL.md's Task Loop composition (`implementer-prompt.md` path +
the brief path + interfaces from earlier tasks + report contract), with two additions specific to
autonomous mode, both supplied by the coordinator in the dispatch text — `implementer-prompt.md`
itself is unmodified:

- **Worktree:** branch the task's worktree from the **epic integration branch**, not from
  `main`/`master` and not from a plan-file branch — this is what "own worktree branched from the
  integration branch" means throughout this doc.
- **Self-filing blocker beads:** if the implementer reports BLOCKED after 3 no-progress
  fix-loops, it files the blocker bead itself (see "The blocker-bead path") rather than escalating
  to a human partner mid-task — there is no human in the loop to escalate to inside a dispatched
  agent.

## The breaker, autonomous variant

Rounds 1–5, the resume-then-escalate-model structure, and the ADDRESSED/NOT-ADDRESSED scoped
re-review are exactly SKILL.md's fix loop (rounds 1–3 resume the original implementer; rounds 4–5
dispatch a fresh implementer on a more capable model; minors go to the ledger as deferred and
never enter the loop; plan-mandated conflicts are a human decision, same as any plan
contradiction). Read SKILL.md's "The fix loop" for that full mechanics — it applies unchanged.

**What autonomous mode changes is only the terminal action at the cap.** SKILL.md's breaker, on
a real, load-bearing finding at round 5, says: `STOP: report BLOCKED to human partner`. A
Workflow run has no synchronous human partner to stop for — halting the whole script would freeze
every *other*, unrelated ready task behind one stuck bead, which defeats the reason to run
autonomously at all. So here, the same load-bearing verdict instead:

1. Appends `Task <id>: BLOCKED — <reason>` to the ledger, exactly as SKILL.md specifies.
2. **Files a blocker bead** instead of stopping the session — same shape as any other blocker
   bead (see "The blocker-bead path"): the task id, the load-bearing finding, the plan text (from
   `plan.md`) it collides with, and the fix history from the report file.
3. Quarantines the task (leaves its branch and worktree in place, does not merge it) and lets the
   coordinator loop continue with every other ready task.

Contestable-or-non-load-bearing findings at the cap are parked with a ruling exactly as SKILL.md
describes — parking is not autonomous-mode-specific and needs no change. Only the load-bearing
exit differs, and only in *where the stop lands*: a blocker bead the triage agent will pick up,
not a frozen run.

## Serial merge-back

In the integration worktree, for one task at a time, in dependency order:

1. Update the integration branch; rebase the task branch onto it.
2. Run the project test command.
3. If clean → merge (`--no-ff`) into the integration branch, then `bd close <id>` (a leaf-task
   close; epic closure is the separate fixpoint step in "The coordinator loop").
4. If the rebase conflicts **or** tests are red: make **one bounded auto-resolve attempt** (a fix
   agent). If that fails → the blocker-bead path.

## The blocker-bead path (the escalation currency)

Anything that cannot proceed becomes a beads issue, never a silent retry and never a hard stop:

- **Triggers:** an implementer reporting BLOCKED after 3 no-progress fix-loops (files the bead
  itself), a merge that fails its one auto-resolve attempt (the merge agent files the bead), or a
  fix-loop breaker tripping on a load-bearing finding at round 5 (see "The breaker, autonomous
  variant" — the coordinator files the bead in this case, since the finding surfaced at
  adjudication, not inside the implementer or merge agent).
- **Bead shape:** a `bd create` with a `blocker` label, body stating the task id, what failed,
  and what was tried. Confirm flags with `bd create --help`.
- **Triage (opus):** the coordinator dispatches the triage agent (`./triage-prompt.md`) with the
  blocker bead + the task's `plan.md` section + the relevant spec excerpt. It returns exactly one
  of:
  - `RESOLVE: <clarification>` → the coordinator re-dispatches the task with that clarification
    added to its context (next round). Use only when the answer is genuinely derivable from the
    existing plan/beads.
  - `ESCALATE: <summary + decision needed>` → escalation (below).

## Escalation = notify + quarantine + continue

On `ESCALATE`, the run **does not freeze**:

1. **Notify** the user immediately. From a background workflow, prefer a dispatched notify agent
   (if `PushNotification` / an MCP messaging tool is available) and always `log()` the escalation
   so it surfaces in `/workflows` and the completion notification.
2. **Quarantine** — leave the blocker bead open. The blocked task stays open, and its dependents
   remain unready in beads automatically, so they are skipped without extra bookkeeping.
3. **Continue** — keep driving every other ready task to completion.

When the ready set finally drains, the run ends and reports: tasks completed, open `blocker`
beads, and quarantined subtrees. The user resolves the blockers and **re-invokes the
coordinator**, which picks up the now-ready work.

## Finish

When the loop ends (and at least some work landed), dispatch the **final whole-epic review
(opus)** against the integration branch — same package discipline as SKILL.md's "Final Review"
(`scripts/review-package PLAN_FILE MERGE_BASE HEAD`, pointed at the ledger's deferred-minor and
parked lines so it can triage what must be fixed before merge) — then hand to
`superpowers:finishing-a-development-branch`, which merges the integration branch into the user's
base branch and cleans up the integration worktree.

## What autonomous mode changes (summary)

Everything in `subagent-driven-development`'s Task Loop / Final Review is inherited unchanged:
the brief/report contract, the review-package discipline, the five-round fix breaker's structure,
minor-deferral to a ledger, and plan-conflict-is-a-human-decision. Fork-specific, kept from this
skill's predecessor:

- Per-task worktrees branched off the **epic integration branch** (not off `main` and not off a
  local plan-file branch).
- **Serial merge-back in dependency order**, one task at a time, never concurrent merges.
- The **blocker-bead escalation path** — notify, quarantine, continue — that lets a Workflow run
  survive a stuck task instead of freezing.
- The breaker's terminal action on a load-bearing finding: **file a blocker bead**, not stop the
  session — the one place where this doc's fix-loop diverges from SKILL.md's wording, because
  autonomous mode has no synchronous human partner to stop for.

## Annotated script skeleton

Illustrative — adapt names/prompts to the epic. Every `agent()` call carries the real I/O; the
script only sequences. `opts.model` is set explicitly per role, pulled from `config.models`.

```javascript
export const meta = {
  name: 'beads-epic-coordinator',
  description: 'Autonomously drive a beads epic to completion via worktree-isolated, reviewed task pipelines',
  phases: [
    { title: 'Close' },        // close-eligible fixpoint; root-closed check
    { title: 'Ready' },        // bd ready query
    { title: 'Plan' },         // plan.md materialization (once per epic, then append-only)
    { title: 'Implement' },    // task-brief -> implementer -> review-package -> task-reviewer -> fix loop
    { title: 'Integrate' },    // serial merge-back
    { title: 'Triage' },       // blocker beads
    { title: 'Finish' },
  ],
}

// args: { epicId, integrationBranch, integrationWorktree, config }
const A = typeof args === 'string' ? JSON.parse(args) : args
const { epicId, integrationBranch, integrationWorktree, config } = A || {}
// Fail fast: undefined args crash late + cryptically (see "Authoring pitfalls"). Validate + log here.
if (!epicId || !integrationBranch || !integrationWorktree || !config) throw new Error('coordinator args missing: ' + JSON.stringify(A))
log('coordinator: epic=' + epicId + ' branch=' + integrationBranch)
const model = role => config.models[role]

const READY   = { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } }, required: ['ids'] }
const PLANNED = { type: 'object', properties: { planPath: {type:'string'}, ids: { type: 'array', items: { type: 'string' } } }, required: ['planPath','ids'] }
const RESULT  = { type: 'object', properties: { id: {type:'string'}, status: {type:'string'}, files: { type: 'array', items: {type:'string'} }, branch: {type:'string'}, blockerBead: {type:'string'} }, required: ['id','status'] }
const TRIAGE  = { type: 'object', properties: { decision: {type:'string'}, detail: {type:'string'} }, required: ['decision','detail'] } // decision: RESOLVE | ESCALATE
const MERGE   = { type: 'object', properties: { id:{type:'string'}, merged:{type:'boolean'}, blockerBead:{type:'string'} }, required: ['id','merged'] }
const CLOSE   = { type: 'object', properties: { rootClosed: {type:'boolean'}, closedThisRun: { type: 'array', items: { type: 'string' } } }, required: ['rootClosed','closedThisRun'] }

const escalated = []
const completed = []

while (true) {
  // MECHANICAL: bd epic close-eligible closes only one tree level per call — loop it to a
  // fixpoint (stop when a pass closes nothing) before checking whether the root closed.
  // First iteration is harmless: nothing is eligible yet.
  phase('Close')
  const closed = await agent(closeEpicsPrompt(epicId),
    { label: 'close-epics', phase: 'Close', schema: CLOSE, model: model('triage') })
  if (closed.rootClosed) break

  phase('Ready')
  const ready = await agent(
    // MECHANICAL: echo the command output verbatim — no judgment, no --json (see "Authoring pitfalls").
    `Run exactly: \`bd ready --exclude-type=epic --label sp:${epicId} 2>&1 | grep -oE '${epicId}[.0-9]*' | sort -u\` and return its output lines verbatim as ids. Do NOT use \`--json\`. Do NOT reason about or filter readiness or scope — the command's flags already exclude epics and out-of-tree issues; just return what the command prints (empty output → {ids: []}). Do not start any work.`,
    { label: 'bd-ready', phase: 'Ready', schema: READY, model: model('triage') })
  const ids = (ready?.ids ?? []).filter(id => !escalated.includes(id))
  // Quarantine exit: the root isn't closed (checked above) but nothing is ready — remaining
  // work is blocked/escalated. Not a clean finish; report below distinguishes the two cases.
  if (ids.length === 0) break

  // Plan materialization — once per epic, append-only on refill (see "Plan materialization").
  // scripts/sdd-workspace and scripts/task-brief need PLAN_FILE with ## Task <id> headings;
  // beads has no such file, so the planner (opus) is the bridge.
  phase('Plan')
  const planned = await agent(planPrompt(epicId, ids),
    { label: 'plan', phase: 'Plan', model: model('planner'), schema: PLANNED })

  // Group by declared touched-files (from plan.md) so same-file tasks never run as siblings.
  const groups = groupByDisjointFiles(ids, planned)  // pure JS, no I/O — files are already in `planned`

  // Per-task pipeline. NO barrier between stages: a fast task proceeds while a slow sibling lags.
  // implementer + reviewer = sonnet. Each agent works in its own worktree cut from the
  // integration branch and does its own git/bd I/O (see prompt templates).
  phase('Implement')
  const results = []
  for (const group of groups) {  // disjoint-file groups serialize relative to each other; tasks within a group don't share files
    const groupResults = await pipeline(group,
      id  => agent(taskBriefPrompt(planned.planPath, id),         { label: `brief:${id}`,   phase: 'Implement', model: model('triage'), schema: RESULT }),
      br  => agent(implementPrompt(br, integrationBranch),        { label: `impl:${br.id}`, phase: 'Implement', model: model('implementer'), schema: RESULT }),
      im  => agent(taskReviewPrompt(im),                          { label: `review:${im.id}`, phase: 'Implement', model: model('reviewer'), schema: RESULT }),
      // fix rounds (<=5) + scoped re-review live inside taskReviewPrompt's resolution loop —
      // see "The breaker, autonomous variant" for the terminal action at the cap.
    )
    results.push(...groupResults)
  }

  // SERIAL merge gate — outside any parallel/pipeline stage so only one merge touches the
  // integration branch at a time, in dependency order. Runs in the integration worktree. Merges
  // close leaf tasks only (bd close <id>); epic closure happens at the top of the next iteration.
  phase('Integrate')
  for (const r of results.filter(Boolean)) {
    if (r.status === 'BLOCKED') { await handleBlocker(r); continue }
    const m = await agent(mergePrompt(r, integrationBranch, integrationWorktree),
      { label: `merge:${r.id}`, phase: 'Integrate', model: model('reviewer'), schema: MERGE })
    if (m.merged) completed.push(r.id)
    else await handleBlocker({ id: r.id, blockerBead: m.blockerBead })
  }
}

phase('Finish')
log(`Completed: ${completed.length}. Escalated: ${escalated.length}.`)
const review = completed.length
  ? await agent(`Final whole-epic review of integration branch ${integrationBranch} for epic ${epicId}.`,
      { label: 'final-review', phase: 'Finish', model: model('finalReview') })
  : 'no work landed'
return { completed, escalated, review }

// --- helpers ---
function closeEpicsPrompt(epicId) {
  // MECHANICAL: loop bd epic close-eligible to a fixpoint (stop when a pass closes nothing —
  // with --json the stop signal is output exactly `[]`, not a `count: 0` object). No readiness
  // judgment: the agent runs the command and reports what happened, it doesn't decide what's eligible.
  return `Run \`bd epic close-eligible --json\` repeatedly, looping until a call's output is exactly \`[]\` (that's the fixpoint — it closes at most one tree level per call, so a single call is not enough). Collect every id closed across all calls into closedThisRun. Then run \`bd show ${epicId} --json\` and report rootClosed as true iff its status is closed.`
}

function groupByDisjointFiles(ids, planned) {
  // Pure computation over data already returned by the planner agent — no I/O. Illustrative:
  // real implementation buckets ids so no two ids in the same bucket share a declared file,
  // capped at config.concurrency buckets running concurrently.
  return [ids]  // placeholder: replace with the real disjoint-set grouping
}

async function handleBlocker(r) {
  phase('Triage')
  const t = await agent(triagePrompt(r.id, r.blockerBead),
    { label: `triage:${r.id}`, phase: 'Triage', model: model('triage'), schema: TRIAGE })
  if (t.decision === 'RESOLVE') {
    // re-dispatch next round with clarification recorded on the bead; do NOT mark escalated
    await agent(recordClarificationPrompt(r.id, t.detail), { label: `clarify:${r.id}`, phase: 'Triage', model: model('implementer') })
  } else {
    escalated.push(r.id)                       // quarantine: dependents stay unready in beads
    await agent(notifyPrompt(r.id, t.detail), { label: `notify:${r.id}`, phase: 'Triage', model: model('implementer') }) // push if available
    log(`ESCALATED ${r.id}: ${t.detail}`)      // always surfaces in /workflows + completion
  }
}
```

> The Workflow tool's built-in `isolation:'worktree'` is **not** used here: it branches from the
> repo's current HEAD (not our integration branch) and auto-removes worktrees that end up
> unchanged. We need worktrees cut from the integration branch with controlled merge-back, so the
> agents create and merge worktrees explicitly (per `superpowers:using-git-worktrees`).
