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
    models: { planner: 'opus', implementer: 'sonnet', reviewer: 'sonnet', mechanical: 'sonnet', triage: 'opus', finalReview: 'opus' },
  },
  prompts: { ... },
}
```

`mechanical` and `triage` are deliberately separate roles even though both may resolve to cheap
tiers: `triage` names *only* the opus blocker-resolution judgment call (see "The blocker-bead
path") — it never means "the cheap one." `mechanical` is for the deterministic CLI-echo steps
(`bd ready`, `bd epic close-eligible`, `scripts/task-brief` dispatch, notifications, recording a
clarification) that carry no judgment at all; spending opus on them wastes budget against
`subagent-driven-development`'s Model Selection guidance and, worse, blurs "triage" into meaning
two different things in the same doc. Keep every dispatch that only echoes a command or a fixed
message on `mechanical`; keep every dispatch that decides RESOLVE vs ESCALATE on `triage`.

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
   `superpowers:using-git-worktrees` (project-local `.worktrees/`, verified git-ignored), **at the
   path `.worktrees/<integrationBranch>`** — this fixed naming convention is what lets the
   Workflow script derive the integration worktree path from `integrationBranch` alone (see the
   script skeleton) instead of carrying it as a second, independently-recorded arg that could
   drift out of sync with the branch name. The user's original worktree stays untouched. Record:
   epic id, integration branch name.
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

## Workspace and ledger

This skill's `scripts/sdd-workspace` and the durable ledger it anchors exist to provide one
property: **an interrupted epic resumes from the ledger, not from coordinator memory.** A
Workflow run can be killed, restarted, or simply lose its place across a long epic; the ledger is
what lets the *next* invocation pick up exactly where the last one left off instead of
re-querying beads state and guessing.

- **Workspace:** one per epic, resolved via `scripts/sdd-workspace <workspace>/plan.md` (see
  "Plan materialization" below for how `plan.md` is populated) — home to `plan.md`, every task's
  brief/report/review-package files, and the ledger.
- **Ledger:** `<workspace>/progress.md`, first line `# SDD ledger — plan: <plan file path>`,
  exactly SKILL.md's Setup contract. Every ledger line names **both** the plan ordinal and the
  bead id — `Task <N> (<bead id>): complete (...)`, `Task <N> (<bead id>): fix round <R>/5 (...)`,
  `Task <N> (<bead id>): BLOCKED — <reason>` — because the ordinal is what SDD's scripts key on
  (see "Plan materialization") but the bead id is what `bd` operations and a human resuming the
  run actually need to recognize.
- **Resume behavior**, on any restart: read `<workspace>/progress.md` before re-querying `bd
  ready`. A bead whose ordinal has a `complete` line is done — skip it, never re-dispatch it. A
  bead whose last line is a `fix round <R>/5` entry is mid-loop — resume the fix loop at round
  `R+1`, not from round 1 (re-dispatching from scratch after a partial fix loop is the single
  most expensive failure mode SKILL.md's Setup section warns about, and it applies here
  unchanged). A bead with no ledger line at all is simply not started — indistinguishable from
  "never queried," since the next `bd ready` will surface it again regardless. This is a
  different case from "Escalation = notify + quarantine + continue" below: that section's
  re-invoke covers a *clean drain* where the ready set emptied because of quarantined blockers;
  this section covers resuming a run that stopped mid-flight for any reason (crash, restart,
  manual interruption) while ready work still remained.

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

`scripts/sdd-workspace` and `scripts/task-brief` are written against a hand-authored `PLAN_FILE`
with `## Task <N>` headings — they have no beads awareness. Critically, `scripts/task-brief`'s
heading match (`^#+[ \t]+Task[ \t]+[0-9]+`) requires the token after "Task" to **start with a
digit**: `## Task 3` matches; `## Task bd-20` does not, and `task-brief` reports "task not found."
Real bead ids are prefixed (`bd-20`, `epic.1`) — they are never bare integers — so headings must
use **sequential integer ordinals**, not bead ids. Do not "clean up" the ordinals described below
back to bead ids; they exist because of this exact regex, not by preference, and this was
verified directly against the script, not assumed.

The bridge: once per epic, a **planner (opus)** agent reads the epic's beads tree (`bd show` on
the epic and its ready/blocked descendants) and writes `<workspace>/plan.md` with:

1. An **ordinal ↔ bead-id mapping table** at the top — one row per task, `N` assigned in
   dependency order starting at 1, plus each task's declared `filesTouched` — the durable
   translation every downstream consumer of this file reads from, including the disjoint-file
   grouping described below.
2. One `## Task <N>` section per row, headed by the **ordinal**, carrying the bead's acceptance
   criteria and any Global Constraints from the epic body verbatim — the same content discipline
   SKILL.md expects of a hand-written plan.

`<workspace>` is this skill's `scripts/sdd-workspace plan.md`; because that script requires the
file to already exist, the planner's first action on a fresh epic is to `mkdir -p` the directory
and write an initial `plan.md` (mapping table header, no rows yet) itself before calling
`sdd-workspace` to canonicalize the path and git-ignore it. On refill, the planner agent re-runs
to append new mapping rows and `## Task <N>` sections for newly-ready or newly-created beads
(blocker beads included) — new ordinals continue the existing sequence; an already-assigned
ordinal or section is never renumbered or rewritten, since a fix round may still be pointing at
it.

**Every downstream call uses the ordinal**: `scripts/task-brief plan.md <N>`, and the
brief/report/review-package filenames that follow from it. **The bead id remains the durable
identity for every `bd` command** (`bd show`, `bd close`, `bd create`) — the coordinator never
substitutes an ordinal into a `bd` call, and the ledger records both (see "Workspace and ledger"
above) so a resumed run never has to re-derive the mapping from `plan.md` alone. A stage that
needs both — the brief-dispatch stage reads by ordinal but must hand the bead id on to every later
stage — looks the id up by ordinal once and carries it forward on the result object (see the
script skeleton's `ordinalFor` helper and the `RESULT` schema's `id`/`n` pair).

This is a one-time-per-epic (then append-only) opus dispatch, not a per-task judgment call — it
is why `planner` sits in `config.models` even though it does not appear inside the quoted
per-task pipeline sequence: it produces the artifact that sequence's first step,
`scripts/task-brief`, consumes. **Do not patch `scripts/task-brief` to accept bead ids
directly** — `subagent-driven-development` must stay byte-identical to upstream — and do not
abandon the delegation by hand-rolling briefs from the mapping table instead of calling the
script: `task-brief` still owns the awk extraction, the brief-file naming, and the "task not
found" failure signal; the mapping table only supplies the `N` it needs.

### Dispatching the implementer

The dispatch prompt follows SKILL.md's Task Loop composition (`implementer-prompt.md` path +
the brief path + interfaces from earlier tasks + report contract), with two additions specific to
autonomous mode, both supplied by the coordinator in the dispatch text — `implementer-prompt.md`
itself is unmodified:

- **Worktree:** branch the task's worktree from the **epic integration branch**, not from
  `main`/`master` and not from a plan-file branch — this is what "own worktree branched from the
  integration branch" means throughout this doc. The coordinator names the target path by
  convention rather than inventing a fresh one per dispatch or threading it through `args`:
  `.worktrees/<integrationBranch>--task-<bead id>` (bead id, not the plan ordinal — ordinals are
  plan-file bookkeeping; the worktree name should stay meaningful and stable even if `plan.md`
  is ever regenerated). This is pure string derivation from `integrationBranch` + the task id,
  the same convention the script skeleton uses for the integration worktree itself.
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

1. Appends `Task <N> (<bead id>): BLOCKED — <reason>` to the ledger — SKILL.md's line shape, with
   the ordinal/bead-id pairing described in "Workspace and ledger" above.
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

// args: { epicId, integrationBranch, dryRun, config } — see "Coordinator contract" above.
// No `integrationWorktree` here: it is NOT a contract field. Requiring it as a fifth arg is
// exactly the "Authoring pitfalls" failure this script guards against elsewhere — a caller
// following the stated contract to the letter would omit it and crash on line 1. It is derived
// below, by convention, from `integrationBranch` alone.
const A = typeof args === 'string' ? JSON.parse(args) : args
const { epicId, integrationBranch, config, dryRun = false, prompts } = A || {}
// Fail fast: undefined args crash late + cryptically (see "Authoring pitfalls"). Validate + log here.
if (!epicId || !integrationBranch || !config) throw new Error('coordinator args missing: ' + JSON.stringify(A))
log('coordinator: epic=' + epicId + ' branch=' + integrationBranch + ' dryRun=' + !!dryRun)
const model = role => dryRun ? 'haiku' : config.models[role]
// dryRun swaps every dispatched prompt for a canned stub from prompts.stubs (see "dryRun policy"
// below) — same swap as super-roast's `pick()`, with two differences, both hard-won:
// 1. `pick` takes a THUNK (`() => real`), not the built prompt itself, and calls it only on the
//    non-dryRun branch. A prompt builder is a plain function call, and JS evaluates a function's
//    ARGUMENTS before the function runs — `pick(realPromptFn(...), key)` would build the real
//    prompt unconditionally, even under dryRun, before `pick` ever gets a chance to short-circuit
//    to the stub. That eager evaluation is exactly what turned "10 undefined prompt-builder
//    helpers" into a dryRun-time crash instead of a real-run-time one (see "dryRun policy" below)
//    — the same trap super-roast's build hit and lost a round to. Passing a thunk defers the call
//    until `pick` has already decided dryRun is false.
// 2. A stub value may be an ARRAY, consumed one entry per call to that key and clamped to the
//    last entry once exhausted. Reason: this script has a `while(true)` round loop (super-roast's
//    pipeline is linear) whose Close/Ready checks call the SAME stub key every round — a single
//    canned value would either break out on round 1 (never exercising the per-task pipeline) or
//    never empty the ready set (infinite loop). The array form is how the recorded baseline below
//    drains in exactly two rounds.
const stubCallCounts = {}
function pick(buildReal, stubKey) {
  if (!dryRun) return buildReal()
  const raw = prompts?.stubs?.[stubKey]
  if (raw === undefined) throw new Error('dryRun: no stub for key ' + stubKey)
  if (!Array.isArray(raw)) return raw
  const i = stubCallCounts[stubKey] ?? 0
  stubCallCounts[stubKey] = i + 1
  return raw[Math.min(i, raw.length - 1)]
}
// Pure string derivation, no I/O — matches the fixed path Pre-flight step 2 creates the
// integration worktree at, and the per-task convention "Dispatching the implementer" describes.
const integrationWorktree = `.worktrees/${integrationBranch}`
const taskWorktree = id => `.worktrees/${integrationBranch}--task-${id}`

const READY   = { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } }, required: ['ids'] }
// mapping: ordinal (N, as scripts/task-brief needs it) <-> bead id (as bd needs it) <-> declared
// touched files (as groupByDisjointFiles needs it) — see "Plan materialization".
const PLANNED = { type: 'object', properties: { planPath: {type:'string'}, mapping: { type:'array', items: { type:'object', properties: { n:{type:'integer'}, id:{type:'string'}, files:{type:'array', items:{type:'string'}} }, required:['n','id','files'] } } }, required: ['planPath','mapping'] }
const RESULT  = { type: 'object', properties: { id: {type:'string'}, n: {type:'integer'}, status: {type:'string'}, files: { type: 'array', items: {type:'string'} }, branch: {type:'string'}, blockerBead: {type:'string'} }, required: ['id','status'] }
const TRIAGE  = { type: 'object', properties: { decision: {type:'string'}, detail: {type:'string'} }, required: ['decision','detail'] } // decision: RESOLVE | ESCALATE
const MERGE   = { type: 'object', properties: { id:{type:'string'}, merged:{type:'boolean'}, blockerBead:{type:'string'} }, required: ['id','merged'] }
const CLOSE   = { type: 'object', properties: { rootClosed: {type:'boolean'}, closedThisRun: { type: 'array', items: { type: 'string' } } }, required: ['rootClosed','closedThisRun'] }

const escalated = []
const completed = []

while (true) {
  // MECHANICAL: bd epic close-eligible closes only one tree level per call — loop it to a
  // fixpoint (stop when a pass closes nothing) before checking whether the root closed.
  // First iteration is harmless: nothing is eligible yet. `mechanical`, not `triage` — this is a
  // deterministic CLI-echo, not a judgment call (see "Coordinator contract").
  phase('Close')
  const closed = await agent(pick(() => closeEpicsPrompt(epicId), 'close-epics'),
    { label: 'close-epics', phase: 'Close', schema: CLOSE, model: model('mechanical') })
  if (closed.rootClosed) break

  phase('Ready')
  const ready = await agent(
    // MECHANICAL: echo the command output verbatim — no judgment, no --json (see "Authoring pitfalls").
    pick(() => `Run exactly: \`bd ready --exclude-type=epic --label sp:${epicId} 2>&1 | grep -oE '${epicId}[.0-9]*' | sort -u\` and return its output lines verbatim as ids. Do NOT use \`--json\`. Do NOT reason about or filter readiness or scope — the command's flags already exclude epics and out-of-tree issues; just return what the command prints (empty output → {ids: []}). Do not start any work.`, 'bd-ready'),
    { label: 'bd-ready', phase: 'Ready', schema: READY, model: model('mechanical') })
  const ids = (ready?.ids ?? []).filter(id => !escalated.includes(id))
  // Quarantine exit: the root isn't closed (checked above) but nothing is ready — remaining
  // work is blocked/escalated. Not a clean finish; report below distinguishes the two cases.
  if (ids.length === 0) break

  // Plan materialization — once per epic, append-only on refill (see "Plan materialization").
  // scripts/sdd-workspace and scripts/task-brief need PLAN_FILE with ## Task <N> headings keyed
  // by sequential integer ordinal (task-brief's regex requires a leading digit — a bead id like
  // "bd-20" never matches); beads has no such file, so the planner (opus) is the bridge and
  // returns the ordinal<->bead-id mapping alongside the plan path.
  phase('Plan')
  const planned = await agent(pick(() => planPrompt(epicId, ids), 'plan'),
    { label: 'plan', phase: 'Plan', model: model('planner'), schema: PLANNED })
  const ordinalFor = id => planned.mapping.find(m => m.id === id)?.n

  // Group by declared touched-files (from plan.md) so same-file tasks never run as siblings.
  const groups = groupByDisjointFiles(ids, planned)  // pure JS, no I/O — reads planned.mapping[].files; solo-buckets anything undeclared (fail safe)

  // Per-task pipeline. NO barrier between stages: a fast task proceeds while a slow sibling lags.
  // Each agent works in its own worktree cut from the integration branch (taskWorktree(id)) and
  // does its own git/bd I/O (see prompt templates). The brief stage dispatches on `mechanical`
  // (task-brief is a deterministic extraction, not judgment); implement/review stay on their
  // config-tiered roles.
  phase('Implement')
  const results = []
  for (const group of groups) {  // disjoint-file groups serialize relative to each other; tasks within a group don't share files
    const groupResults = await pipeline(group,
      id  => agent(pick(() => taskBriefPrompt(planned.planPath, ordinalFor(id), id, taskWorktree(id)), `brief:${id}`), { label: `brief:${id}`,   phase: 'Implement', model: model('mechanical'), schema: RESULT }),
      br  => agent(pick(() => implementPrompt(br, integrationBranch), `implement:${br.id}`),                          { label: `impl:${br.id}`, phase: 'Implement', model: model('implementer'), schema: RESULT }),
      im  => reviewAndFix(im),
    )
    results.push(...groupResults)
  }

  // SERIAL merge gate — outside any parallel/pipeline stage so only one merge touches the
  // integration branch at a time, in dependency order. Runs in the integration worktree. Merges
  // close leaf tasks only (bd close <id>); epic closure happens at the top of the next iteration.
  phase('Integrate')
  for (const r of results.filter(Boolean)) {
    if (r.status === 'BLOCKED') { await handleBlocker(r); continue }
    const m = await agent(pick(() => mergePrompt(r, integrationBranch, integrationWorktree), `merge:${r.id}`),
      { label: `merge:${r.id}`, phase: 'Integrate', model: model('reviewer'), schema: MERGE })
    if (m.merged) completed.push(r.id)
    else await handleBlocker({ id: r.id, blockerBead: m.blockerBead })
  }
}

phase('Finish')
log(`Completed: ${completed.length}. Escalated: ${escalated.length}.`)
const review = completed.length
  ? await agent(pick(() => `Final whole-epic review of integration branch ${integrationBranch} for epic ${epicId}.`, 'final-review'),
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

// The remaining prompt builders are deliberately minimal — the real prompt content lives in
// ./planner-prompt.md, ./triage-prompt.md, and subagent-driven-development's own templates (see
// "Per-task pipeline" and "The blocker-bead path" above), which each builder points at by name.
// These exist so every agent() call site has a defined, legible dispatch string — not to
// duplicate those files' content. Keep them short; this is a reference skeleton, not the prompt
// library. (Every one of these was previously called-but-undefined — see "dryRun policy" below
// for why a `node --check` pass didn't catch that.)

function planPrompt(epicId, ids) {
  // planner (opus), once per epic then append-only — see "Plan materialization". Reads the
  // epic's beads tree and (re)writes <workspace>/plan.md with the ordinal<->bead-id<->files
  // mapping every downstream call in this script keys off of.
  return `You are the planner for epic ${epicId}. This round's ready ids: ${JSON.stringify(ids)}. Run \`bd show ${epicId} --json\` and \`bd show <id> --json\` for each ready/blocked descendant. Use scripts/sdd-workspace to resolve <workspace>/plan.md (mkdir -p and write an initial file first if it doesn't exist). For any id not already mapped, append a mapping row {n, id, files} — n continues the existing sequence, never renumber an existing row — plus a "## Task <n>" section carrying that bead's acceptance criteria and any epic-level Global Constraints verbatim. Return planPath and the full mapping array.`
}

function taskBriefPrompt(planPath, n, id, worktree) {
  // MECHANICAL: scripts/task-brief owns the awk extraction and brief-file naming (see "Plan
  // materialization" — do not hand-roll this from the mapping table). n must be the plan
  // ordinal, never the bead id (task-brief's heading regex requires a leading digit).
  return `Create the task worktree at ${worktree}, branched from the epic integration branch (see "Dispatching the implementer"). Run \`scripts/task-brief ${planPath} ${n}\` to produce the brief file. Report id ${id}, n ${n}, branch ${worktree}, and status BRIEFED (or, on the script's "task not found" failure, status BLOCKED).`
}

function implementPrompt(br, integrationBranch) {
  // subagent-driven-development/implementer-prompt.md + the brief path, unmodified — the two
  // autonomous-mode additions (worktree convention, self-filing blocker beads) are supplied as
  // extra dispatch text here, not by editing the prompt file (see "Dispatching the implementer").
  return `Follow subagent-driven-development/implementer-prompt.md against the brief for task ${br.id} (n ${br.n}), working in ${br.branch}, branched from integration branch ${integrationBranch}. If BLOCKED after 3 no-progress fix-loops, file the blocker bead yourself (see "The blocker-bead path") — there is no human partner to escalate to mid-task. Report id, n, status (IMPLEMENTED or BLOCKED), files touched, and branch.`
}

function taskReviewPrompt(im) {
  // scripts/review-package BASE HEAD -> subagent-driven-development/task-reviewer-prompt.md
  // (single reviewer, spec-compliance + quality in one dispatch — the retired two-stage split
  // never applies here).
  return `Run \`scripts/review-package\` for task ${im.id} (n ${im.n}) in ${im.branch} and follow subagent-driven-development/task-reviewer-prompt.md over the resulting package. Report id, n, files, and status CLEAN or NEEDS_FIX (attach the finding when NEEDS_FIX).`
}

function fixPrompt(rv) {
  // Round 1 of the fix loop — resumes the original implementer on the reviewer's finding. Rounds
  // 2-5 and the terminal action at the cap are exactly "The breaker, autonomous variant" above.
  return `Resume the original implementer in the worktree for task ${rv.id} (n ${rv.n}) and address this review finding: ${JSON.stringify(rv)}. Report id, n, status FIXED, and files touched.`
}

function reReviewPrompt(fixed) {
  // subagent-driven-development/re-review-prompt.md, scoped to the fix diff only — not a full
  // re-review of the whole task.
  return `Follow subagent-driven-development/re-review-prompt.md, scoped to the fix diff for task ${fixed.id} (n ${fixed.n}) in ${fixed.branch}. Report id, n, and status CLEAN (finding ADDRESSED) or NEEDS_FIX (still open).`
}

function mergePrompt(r, integrationBranch, integrationWorktree) {
  // "Serial merge-back": rebase onto the integration branch, run the test command, merge --no-ff
  // and bd close on success; one bounded auto-resolve attempt on conflict/red, else the blocker path.
  return `In ${integrationWorktree}, update ${integrationBranch} and rebase task ${r.id}'s branch ${r.branch} onto it. Run the project test command. If clean, merge --no-ff into ${integrationBranch}, run \`bd close ${r.id}\`, and report merged true. If the rebase conflicts or tests are red, make one bounded auto-resolve attempt; if that also fails, file a blocker bead (see "The blocker-bead path") and report merged false with its id as blockerBead.`
}

function triagePrompt(id, blockerBead) {
  // The one genuine judgment call in this script's blocker handling (opus) — RESOLVE vs
  // ESCALATE — see "The blocker-bead path".
  return `Run \`bd show ${blockerBead} --json\` for the blocker bead filed against task ${id}, plus that task's plan.md section and the relevant spec excerpt. Decide RESOLVE (only when the answer is genuinely derivable from the existing plan/beads — give the clarification) or ESCALATE (give a summary and the decision needed). Report decision and detail.`
}

function recordClarificationPrompt(id, detail) {
  // MECHANICAL: recording a RESOLVE clarification on the bead is a fixed write, not a judgment call.
  return `Record this clarification on bead ${id} (e.g. \`bd comment ${id} "..."\` or the project's equivalent) so the next dispatch round picks it up: ${detail}`
}

function notifyPrompt(id, detail) {
  // MECHANICAL: a fixed notification on ESCALATE — see "Escalation = notify + quarantine + continue".
  return `Send a notification (PushNotification or the configured messaging tool, if available) that task ${id} is ESCALATED: ${detail}. Report sent true/false.`
}

function groupByDisjointFiles(ids, planned) {
  // Pure computation over data already returned by the planner agent (planned.mapping[].files) —
  // no I/O. Buckets ids so no two ids in the same bucket share a declared file; ids within a
  // bucket run as concurrent siblings via pipeline() below, with config.concurrency (~4) bounding
  // how many run at once — buckets themselves still serialize relative to each other (see the
  // `for (const group of groups)` loop above). FAIL SAFE, per Global Constraints ("dispatch
  // concurrently only when file sets are disjoint"): an id with no declared files, or any id
  // whose disjointness can't be established, must run alone in its own singleton bucket rather
  // than default into a parallel batch — an incomplete files declaration must cost
  // serialization, never risk a write collision. Illustrative pairwise grouping, not a tuned
  // disjoint-set implementation:
  const filesFor = id => planned.mapping.find(m => m.id === id)?.files
  const buckets = []
  for (const id of ids) {
    const files = filesFor(id)
    if (!files || !files.length) { buckets.push([id]); continue }  // fail safe: undeclared -> solo bucket
    const bucket = buckets.find(b => b.every(other => {
      const otherFiles = filesFor(other)
      return otherFiles && otherFiles.length && !otherFiles.some(f => files.includes(f))
    }))
    if (bucket) bucket.push(id)
    else buckets.push([id])
  }
  return buckets
}

// Round 1 of the fix loop, made concrete (the illustrative skeleton previously left this as a
// comment — "fix rounds live inside taskReviewPrompt's resolution loop"). Rounds 2-5 and the
// breaker's terminal action at the cap are exactly "The breaker, autonomous variant" above,
// unmodified in substance; this function only shows the shape of round 1 so a dryRun stub can
// exercise "one fix round + re-review" concretely (see the Stub table / Assertions below).
async function reviewAndFix(im) {
  const rv = await agent(pick(() => taskReviewPrompt(im), `review:${im.id}`),
    { label: `review:${im.id}`, phase: 'Implement', model: model('reviewer'), schema: RESULT })
  if (rv.status !== 'NEEDS_FIX') return rv
  const fixed = await agent(pick(() => fixPrompt(rv), `fix:${rv.id}`),
    { label: `fix:${rv.id}`, phase: 'Implement', model: model('implementer'), schema: RESULT })
  return agent(pick(() => reReviewPrompt(fixed), `re-review:${fixed.id}`),
    { label: `re-review:${fixed.id}`, phase: 'Implement', model: model('reviewer'), schema: RESULT })
}

async function handleBlocker(r) {
  phase('Triage')
  // Genuine judgment call: RESOLVE vs ESCALATE. This is the one dispatch in this script that
  // legitimately spends `triage` (opus) — see "Coordinator contract" on why `triage` and
  // `mechanical` are not interchangeable.
  const t = await agent(pick(() => triagePrompt(r.id, r.blockerBead), `triage:${r.id}`),
    { label: `triage:${r.id}`, phase: 'Triage', model: model('triage'), schema: TRIAGE })
  if (t.decision === 'RESOLVE') {
    // re-dispatch next round with clarification recorded on the bead; do NOT mark escalated.
    // Recording a clarification is a mechanical write, not a judgment call.
    await agent(pick(() => recordClarificationPrompt(r.id, t.detail), `clarify:${r.id}`), { label: `clarify:${r.id}`, phase: 'Triage', model: model('mechanical') })
  } else {
    escalated.push(r.id)                       // quarantine: dependents stay unready in beads
    // Sending a fixed notification is mechanical, same reasoning as the clarification write above.
    await agent(pick(() => notifyPrompt(r.id, t.detail), `notify:${r.id}`), { label: `notify:${r.id}`, phase: 'Triage', model: model('mechanical') }) // push if available
    log(`ESCALATED ${r.id}: ${t.detail}`)      // always surfaces in /workflows + completion
  }
}
```

> The Workflow tool's built-in `isolation:'worktree'` is **not** used here: it branches from the
> repo's current HEAD (not our integration branch) and auto-removes worktrees that end up
> unchanged. We need worktrees cut from the integration branch with controlled merge-back, so the
> agents create and merge worktrees explicitly (per `superpowers:using-git-worktrees`).

## dryRun policy

`dryRun: true` swaps every dispatched agent for a haiku stub returning canned JSON, validating
the **script's topology** — round sequencing, the disjoint-file grouping/concurrency cap, the
serial merge gate, the blocker-triage routing, schemas — for pennies, without spending real
planner/implementer/reviewer/triage budget and without touching git or `bd` (see the `pick()`
helper and the `model()` dryRun branch in the script above; same mechanism as `super-roast`'s
`pick()`, see `skills/super-roast/super-roast-workflow.md`).

**What a dryRun can and cannot prove.** It proves what the *script* owns: round order, the Close
fixpoint check, the `bd ready` scoping flags baked into the dispatched prompt text, disjoint-file
bucketing, the pipeline/merge/triage sequencing, and every schema. It proves nothing about the
judgment calls made *inside* a dispatched agent — whether an implementer's fix actually addresses
a finding, whether a triage verdict is the *correct* RESOLVE/ESCALATE call, whether a merge's
auto-resolve attempt would really succeed. Those are exercised only by a live run; the canned
stubs return a fixed verdict regardless of what a real agent would have concluded.

**A parse check is not a runnability check.** `node --check` on the extracted script only proves
the syntax is valid — it does not catch undefined references, because those are resolved at
*call* time, not parse time. This doc's first draft of this section verified the script with only
`node --check` and shipped with 10 of its 11 prompt-builder helpers (everything except
`closeEpicsPrompt`) called but never defined; the gap wasn't caught until an actual dryRun run
died with `planPrompt is not defined` two agents in. Worse, it would have died even on a
*correctly*-stubbed dryRun, because `pick(real, stubKey)` — as first written — took the already-
built prompt, not a thunk: `pick(planPrompt(...), 'plan')` evaluates `planPrompt(...)` as a
function-call argument before `pick` is ever entered, so the broken builder ran regardless of
`dryRun`. `pick` now takes `() => real` and only invokes it on the non-dryRun branch (see the
script above), which stops a broken or still-undefined prompt builder from crashing a dryRun that
was never going to need its output — but that fix narrows the blast radius, it doesn't replace
verification. Before trusting a structural edit to this script, do more than `node --check`: grep
the called identifiers against the defined ones (`function <name>` and top-level `const <name> =`)
and confirm every call site resolves, then actually run the dryRun — a parse pass and a stub-key
lookup are not proof the script executes.

Required **once at implementation** and **after any structural coordinator edit**: loop order,
the Close/Ready round shape, disjoint-file batching, merge-back sequencing, or blocker routing.
**Data edits skip it** — roster/prompt/tier edits (which model a role uses, prompt wording, the
concurrency cap's numeric value) are trivial by construction and can't silently break topology.

The orchestrator should pass `args` as an actual JSON value wherever the harness supports it —
the string-tolerance in the script (`typeof args === 'string' ? JSON.parse(args) : args`) exists
as a defensive fallback for harness paths that stringify `args`, not as license to always
stringify by default.

**Stub phrasing is exact, not a paraphrase.** Every stub prompt MUST use the literal wording

```
You are a stub. Call no tools. Return exactly this JSON as your structured output: <json>
```

A shortened variant — e.g. "Return this JSON exactly, nothing else:" — cost `super-roast`'s build
two wasted runs: haiku answered in prose instead of invoking the structured-output tool, every
stubbed agent call returned nothing, and the dryRun silently tested the dead-agent path instead of
the intended topology. A malformed stub doesn't error — it quietly converts the run into an
accidental failure-path test, which can *look* like a passing run (dead-agent/`BLOCKED` handling
*is* exercised) while asserting nothing about what you actually meant to validate. Use the exact
phrasing above, every time, for every stub in the table below.

**One addition this coordinator needs that `super-roast` doesn't: array-valued stubs.**
`super-roast`'s engine is a linear pipeline — each stub key is called at most once per stage, so a
single canned value per key is enough. This coordinator has a `while(true)` round loop, and the
Close/Ready checks at the top of every round call the *same* stub key on every iteration. A single
canned value for `close-epics` or `bd-ready` would either report the root closed on round 1 (the
loop exits before the per-task pipeline ever runs) or report the same non-empty ready set forever
(the loop never drains). `pick()` resolves this by letting a stub value be an **array**: each call
to that key consumes the next entry, clamped to the last entry once exhausted. The recorded
scenario below uses this to drain in exactly two rounds — round 1 does the real work, round 2's
Close/Ready calls report nothing left to do.

## Stub table

Each stub prompt is `You are a stub. Call no tools. Return exactly this JSON as your structured
output: <json>` (exact phrasing — see "dryRun policy" above). The set below is the one used for
the canonical topology scenario: three ready tasks under one epic — `bd-101` and `bd-102` touch
disjoint files (`src/a.js`, `src/b.js`) and dispatch **concurrently**; `bd-103` also touches
`src/a.js`, so it **serializes** after that group. `bd-101`'s review returns a finding and goes
through one fix round + re-review (`ADDRESSED`). `bd-103`'s merge fails its one auto-resolve
attempt, exercising the blocker-bead path end to end: triage `ESCALATE`, notify, quarantine,
**continue** (`bd-101`/`bd-102` still complete).

| Stub key | Canned output (`<json>` content) | Exercises |
|---|---|---|
| `close-epics` (array, 2 entries) | `{rootClosed:false,closedThisRun:[]}` then `{rootClosed:false,closedThisRun:["bd-101","bd-102"]}` | root stays open both rounds (quarantined `bd-103` blocks closure) — round 1 doesn't exit early, round 2 doesn't loop forever |
| `bd-ready` (array, 2 entries) | `{ids:["bd-101","bd-102","bd-103"]}` then `{ids:[]}` | round 1 supplies the batch; round 2's empty set drains the loop. The **scoping** assertion (`--exclude-type=epic --label sp:<epicId>`) is a property of the dispatched prompt text itself, not of this canned return — verified by reading the prompt, same as `super-roast`'s reporter-arithmetic caveat above |
| `plan` | `{planPath:"...", mapping:[{n:1,id:"bd-101",files:["src/a.js"]},{n:2,id:"bd-102",files:["src/b.js"]},{n:3,id:"bd-103",files:["src/a.js"]}]}` | ordinal↔bead-id↔files mapping that `groupByDisjointFiles` and every `ordinalFor` lookup consumes |
| `brief:bd-101` / `brief:bd-102` / `brief:bd-103` | `{id:"bd-1XX",n:<n>,status:"BRIEFED",files:[...],branch:".worktrees/<integrationBranch>--task-bd-1XX"}` | call-site-qualified per id (a single unqualified `brief` key can't return three different ids/branches) |
| `implement:bd-101` / `implement:bd-102` / `implement:bd-103` | `{id:"bd-1XX",n:<n>,status:"IMPLEMENTED",files:[...],branch:"..."}` | same per-id qualification |
| `review:bd-101` | `{id:"bd-101",n:1,status:"NEEDS_FIX",files:["src/a.js"]}` | the one task whose review returns a finding |
| `review:bd-102` / `review:bd-103` | `{id:"bd-1XX",n:<n>,status:"CLEAN",files:[...]}` | clean reviews — no fix loop for these two |
| `fix:bd-101` | `{id:"bd-101",n:1,status:"FIXED",files:["src/a.js"]}` | fix round dispatched only for the flagged task |
| `re-review:bd-101` | `{id:"bd-101",n:1,status:"CLEAN"}` | finding `ADDRESSED` — scoped re-review over the fix diff |
| `merge:bd-101` / `merge:bd-102` | `{id:"bd-1XX",merged:true}` | successful serial merges |
| `merge:bd-103` | `{id:"bd-103",merged:false,blockerBead:"bd-104"}` | merge fails its bounded auto-resolve attempt → blocker path |
| `triage:bd-103` | `{decision:"ESCALATE",detail:"rebase conflict on src/a.js survived one auto-resolve attempt"}` | the judgment dispatch in `handleBlocker` |
| `notify:bd-103` | `{sent:true}` | fixed-notification mechanical dispatch on the ESCALATE branch |
| `final-review` | `{summary:"stub: 2/3 tasks merged; bd-103 quarantined",verdict:"conditional-pass"}` | whole-epic review dispatched once at least one task landed |

**Stub keys are call-site qualified** (`brief:<id>`, `review:<id>`, `merge:<id>`, `triage:<id>`,
...) for the same reason `super-roast`'s are qualified by `seat:<name>:<site>`: a single
unqualified key can't return three different task ids/branches, or a `CLEAN` for two tasks and a
`NEEDS_FIX` for the third, with one fixed value. Qualifying by call site removes the ambiguity —
each of the three tasks gets its own deterministic path through the pipeline. The `RESOLVE` branch
of `handleBlocker` (and its `clarify:<id>` stub) is **not** exercised by this scenario, since
`bd-103`'s triage returns `ESCALATE`; a `RESOLVE`-path scenario is a separate dryRun, the same way
`super-roast` runs its panel-cap and dead-dedupe scenarios as additional baselines rather than
folding them into the canonical one.

## Assertions for the canonical dryRun

- `bd ready` is scoped to the epic tree (`--exclude-type=epic --label sp:<epicId>`), not the whole
  repo — verified by inspecting the dispatched `bd-ready` prompt text (see the stub table note
  above; the stub's *return value* can't prove this, only the prompt construction can).
- The two disjoint-file tasks (`bd-101`, `bd-102`) dispatch as one `pipeline()` group —
  **concurrently**; `bd-103` (shares `src/a.js` with `bd-101`) is bucketed alone by
  `groupByDisjointFiles` and its group runs strictly after the first group's `pipeline()` call
  resolves — **serialized**, never a sibling in the same call.
- Each task runs the full pipeline in order — brief → implementer → review-package (task-reviewer)
  — and `bd-101` additionally runs one fix round + a scoped re-review that reports the finding
  `ADDRESSED` (see `reviewAndFix` in the script above).
- Merge-back is **serial**: three `merge:<id>` calls, one at a time, in the order
  `bd-101, bd-102, bd-103` (dependency/ready order), never two concurrently.
- The blocker path fires on `bd-103`'s failed merge: a blocker bead reference (`blockerBead`) is
  returned, `handleBlocker` dispatches `triage:bd-103` → `ESCALATE` → `notify:bd-103`, `bd-103` is
  pushed onto `escalated` (quarantined, not closed) — and the run **continues**: `bd-101`/`bd-102`
  still merge and close, and the loop proceeds to round 2 instead of halting.
- Expected dispatch count: `close-epics` 2 + `bd-ready` 2 + `plan` 1 + `brief` 3 + `implement` 3 +
  `review` 3 + `fix` 1 + `re-review` 1 + `merge` 3 + `triage` 1 + `notify` 1 + `final-review` 1 =
  **22 agent calls, 0 errors** (`final-review` dispatches because `completed.length` is 2, not 0).

If any assertion fails, fix the script **in this doc** (this doc's script is canonical) and
re-run before committing the fix.

### Passing baseline — PENDING EXECUTION

Not yet recorded: the Workflow tool was not available in the session that authored this section
(task 4 of the `super-code` build). Do not treat the assertions above as validated until a run has
actually been executed and its figures recorded here — per this doc's own ledger philosophy,
figures are the durable record, not the fact that a scenario was designed on paper.

To record the baseline, run the Workflow tool with this script and `args`:

```json
{
  "epicId": "bd-100",
  "integrationBranch": "epic-bd-100-integration",
  "dryRun": true,
  "config": {
    "concurrency": 4,
    "models": { "planner": "opus", "implementer": "sonnet", "reviewer": "sonnet", "mechanical": "sonnet", "triage": "opus", "finalReview": "opus" }
  },
  "prompts": {
    "stubs": {
      "close-epics": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[\"bd-101\",\"bd-102\"]}"
      ],
      "bd-ready": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[\"bd-101\",\"bd-102\",\"bd-103\"]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[]}"
      ],
      "plan": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"planPath\":\".worktrees/epic-bd-100-integration/.sdd/bd-100/plan.md\",\"mapping\":[{\"n\":1,\"id\":\"bd-101\",\"files\":[\"src/a.js\"]},{\"n\":2,\"id\":\"bd-102\",\"files\":[\"src/b.js\"]},{\"n\":3,\"id\":\"bd-103\",\"files\":[\"src/a.js\"]}]}",
      "brief:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"BRIEFED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-101\"}",
      "brief:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"n\":2,\"status\":\"BRIEFED\",\"files\":[\"src/b.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-102\"}",
      "brief:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"n\":3,\"status\":\"BRIEFED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-103\"}",
      "implement:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"IMPLEMENTED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-101\"}",
      "implement:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"n\":2,\"status\":\"IMPLEMENTED\",\"files\":[\"src/b.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-102\"}",
      "implement:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"n\":3,\"status\":\"IMPLEMENTED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-103\"}",
      "review:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"NEEDS_FIX\",\"files\":[\"src/a.js\"]}",
      "review:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"n\":2,\"status\":\"CLEAN\",\"files\":[\"src/b.js\"]}",
      "review:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"n\":3,\"status\":\"CLEAN\",\"files\":[\"src/a.js\"]}",
      "fix:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/a.js\"]}",
      "re-review:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"CLEAN\"}",
      "merge:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"merged\":true}",
      "merge:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"merged\":true}",
      "merge:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"merged\":false,\"blockerBead\":\"bd-104\"}",
      "triage:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"decision\":\"ESCALATE\",\"detail\":\"rebase conflict on src/a.js survived one auto-resolve attempt\"}",
      "notify:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"sent\":true}",
      "final-review": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"summary\":\"stub: 2/3 tasks merged; bd-103 quarantined\",\"verdict\":\"conditional-pass\"}"
    }
  }
}
```

Once run, replace this subsection with the recorded run ID, actual agent/error counts, and
confirmation of each assertion above — same discipline as `super-roast`'s "Passing baseline
(recorded, not illustrative)" sections.
