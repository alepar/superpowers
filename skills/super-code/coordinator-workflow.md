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
path") — it never means "the cheap one." `mechanical` is for dispatches with a fully-specified,
no-improvisation procedure — no branching left to the dispatched agent's judgment, whether that
procedure is a literal CLI echo (`bd ready`, `scripts/task-brief` dispatch, notifications,
recording a clarification) or a short fixed algorithm spelled out with worked examples, such as
the epic-closure fixpoint (`bd epic close-eligible`'s dry-run/filter/close loop — see
`closeEpicsPrompt` below; it outgrew a bare echo once it had to be scoped to this run's tree, but
every branch in it is still a deterministic rule, not a judgment call). Spending opus on any of
these wastes budget against `subagent-driven-development`'s Model Selection guidance and, worse,
blurs "triage" into meaning two different things in the same doc. Keep every dispatch whose every
branch is pre-decided on `mechanical`; keep every dispatch that decides RESOLVE vs ESCALATE on
`triage`.

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
5. **Epic closure** — `bd epic close-eligible` is repo-global: it has no `--label`/`--parent`/
   `--mol` scoping flag (verified via `--help`), so the mutating form is **never** called
   unfiltered — in a repo holding more than one live epic it would close epics belonging to
   unrelated work. Every pass previews with `bd epic close-eligible --dry-run --json`, filters
   the returned ids to this run's tree (membership test below), then closes only the in-tree ids
   individually via `bd close <id>`. **Stop condition: a pass that closes zero in-tree ids** — not
   "the preview is `[]`". Those differ whenever an out-of-tree epic is permanently close-eligible
   (e.g. `super-plan-2c1` sitting in this repo alongside whatever epic this run drives): the
   preview then never empties, since `--dry-run` is stateless and step 3 deliberately leaves
   out-of-tree ids untouched, so "stop on `[]`" would spin forever while "stop on zero closed"
   still reaches the fixpoint, since each pass that closes something can unlock the next level up.
   **Tree-membership test:** `<id> === epicId` is IN-TREE trivially (the root has no parent to
   walk to — checked first, so it can never fall through to the "no parent link found" case below).
   Otherwise, structural parentage — `bd show <id> --json`'s `dependencies` entry with
   `dependency_type: "parent-child"`, followed transitively up to `epicId` — is authoritative; the
   id-prefix convention (`id === epicId` or `id` starts with `epicId.`) is a fast sanity check only
   and is overridden by parentage when the two disagree, since a hand-created bead can violate the
   naming convention but can't fake the recorded parent-child link. Same contract as SKILL.md's
   manual mode — the coordinator changes *who runs it* (a dispatched agent) and adds the scoping
   filter that a human operator applies implicitly by only ever running the command against their
   own tree.
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
`scripts/review-package PLAN_FILE BASE HEAD` → `task-reviewer-prompt.md` (sonnet; single reviewer,
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
// touched files (as groupByDisjointFiles needs it) — see "Plan materialization". This is the
// FULL CUMULATIVE table, every round, not just this round's new rows: the coordinator replaces
// `planned` wholesale each round (it does not merge across rounds), so a round-scoped return
// would drop every earlier id and make ordinalFor(id) resolve to undefined for them — see
// planPrompt below and planner-prompt.md's Report Format.
const PLANNED = { type: 'object', properties: { planPath: {type:'string'}, mapping: { type:'array', items: { type:'object', properties: { n:{type:'integer'}, id:{type:'string'}, files:{type:'array', items:{type:'string'}} }, required:['n','id','files'] } } }, required: ['planPath','mapping'] }
// `finding` is NOT required: a CLEAN result (or any non-review stage) has none. It exists so a
// NEEDS_FIX result carries the actual review finding text across the schema boundary — without it,
// taskReviewPrompt's "attach the finding when NEEDS_FIX" instruction has nowhere to land, and
// fixPrompt has nothing but {id,n,status,files,branch} to build a fix dispatch from.
// `base` is the pre-implementer commit — captured once, by the brief stage, right after the task
// worktree is cut and before the implementer makes any commit (see taskBriefPrompt). It is NOT
// required (only the brief stage's dispatch actually determines it). Unlike `branch`/`n` (which
// the coordinator can derive itself from `taskWorktree(id)`/`ordinalFor(id)` and never needs to
// ask any subagent for — see the implement pipeline stage), `base` is a git commit SHA the
// coordinator has no way to compute or verify on its own (no shell/git access — see "Key
// constraint: the script does no I/O"), so the brief agent's report is its one legitimate source.
// Every stage downstream of the brief then carries it forward via plain JS assignment rather than
// re-asking a later subagent to echo it back (see the implement pipeline stage and reviewAndFix).
// Never derive review-package's BASE arg as `HEAD~1` instead — that silently drops all but the
// last commit of a multi-commit task (subagent-driven-development/SKILL.md:238).
const RESULT  = { type: 'object', properties: { id: {type:'string'}, n: {type:'integer'}, status: {type:'string'}, files: { type: 'array', items: {type:'string'} }, branch: {type:'string'}, base: {type:'string'}, blockerBead: {type:'string'}, finding: {type:'string'} }, required: ['id','status'] }
const TRIAGE  = { type: 'object', properties: { decision: {type:'string'}, detail: {type:'string'} }, required: ['decision','detail'] } // decision: RESOLVE | ESCALATE
const MERGE   = { type: 'object', properties: { id:{type:'string'}, merged:{type:'boolean'}, blockerBead:{type:'string'} }, required: ['id','merged'] }
const CLOSE   = { type: 'object', properties: { rootClosed: {type:'boolean'}, closedThisRun: { type: 'array', items: { type: 'string' } } }, required: ['rootClosed','closedThisRun'] }

const escalated = []
const completed = []

while (true) {
  // MECHANICAL: bd epic close-eligible is repo-global (no --label/--parent/--mol — see
  // closeEpicsPrompt) and closes only one tree level per call — loop dry-run-preview, filter to
  // this run's tree, close the filtered ids, to a fixpoint. Stop condition is "a pass closes zero
  // in-tree ids", NOT "the preview is []" — a permanently-eligible out-of-tree epic (this repo's
  // own super-plan-2c1 is the live example) keeps returning in every preview forever, since
  // --dry-run is stateless and out-of-tree ids are deliberately left untouched; "stop on []" would
  // spin the dispatched agent forever, "stop on zero closed" still reaches the fixpoint. Root is
  // its own tree-membership base case (`id === epicId`, no parent to walk to) — checked before the
  // parent-chain walk, so root is never misclassified OUT-OF-TREE and rootClosed can go true.
  // First iteration is harmless: nothing is eligible yet. `mechanical`, not `triage` — every
  // branch here is a fixed, pre-decided rule, not a judgment call (see "Coordinator contract").
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

  // planner-prompt.md permits leaving a genuinely unplannable bead unmapped (its "Your Job" step
  // 4: BLOCKED, no mapping row, no ## Task <N> section). If such an id is in this round's `ids`
  // and reaches groupByDisjointFiles/taskBriefPrompt anyway, ordinalFor(id) is undefined and
  // `scripts/task-brief <plan> undefined` fails the whole round — the same crash C5 fixed,
  // through a different door. Filter to ids the planner actually mapped before grouping/dispatch;
  // quarantine the rest explicitly (same `escalated` list "Escalation = notify + quarantine +
  // continue" uses) rather than letting them fail silently downstream.
  // TODO(later task): route unmapped ids through full blocked-task/triage handling instead of a
  // bare quarantine — this only stops the crash and surfaces the gap via log().
  const plannedIds = ids.filter(id => ordinalFor(id) !== undefined)
  const unplannedIds = ids.filter(id => ordinalFor(id) === undefined)
  if (unplannedIds.length) {
    log('plan: ' + unplannedIds.length + ' id(s) left unmapped this round by the planner (BLOCKED, no plan.md section) — quarantining, not dispatching: ' + JSON.stringify(unplannedIds))
    escalated.push(...unplannedIds)
  }

  // Group by declared touched-files (from plan.md) so same-file tasks never run as siblings.
  // Only ids with a mapping row reach here (see the filter above) — the "undeclared -> solo
  // bucket" fail-safe below is about a MAPPED id with an empty/missing `files` list, not about an
  // unmapped id (those never reach this call at all).
  const groups = groupByDisjointFiles(plannedIds, planned)  // pure JS, no I/O — reads planned.mapping[].files; solo-buckets anything with undeclared files (fail safe)

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
      // `n`/`branch` are sourced from `ordinalFor(br.id)`/`taskWorktree(br.id)` DIRECTLY — the same
      // pure closures used to build the brief dispatch above — never from `br.n`/`br.branch` (the
      // brief agent's own echo of them). `RESULT` doesn't require either field, so trusting the
      // echo would reproduce C2's "branch: undefined" failure one hop earlier, in a spot the
      // coordinator can make unconditionally correct for free since it already knows both values
      // before it ever dispatches the brief. `base`, by contrast, genuinely cannot be sourced this
      // way: it's a commit SHA captured via `git rev-parse HEAD` inside the task's own worktree
      // (see taskBriefPrompt), and the coordinator has no shell/git access of its own to compute or
      // verify it (see "Key constraint: the script does no I/O") — so `base` is the one field where
      // round-tripping through the brief agent's report is deliberate, not an oversight. Only
      // `status`/`files` are genuinely the implementer's own report.
      async br => {
        const im = await agent(pick(() => implementPrompt(br, integrationBranch), `implement:${br.id}`), { label: `impl:${br.id}`, phase: 'Implement', model: model('implementer'), schema: RESULT })
        return { ...im, n: ordinalFor(br.id), branch: taskWorktree(br.id), base: br.base }
      },
      im  => reviewAndFix(im, planned.planPath),
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
  // MECHANICAL rule-following, not judgment: `bd epic close-eligible` is repo-global — verified
  // via --help, no --label/--parent/--mol exists to scope it — so the mutating form is NEVER
  // called unfiltered. A repo can hold more than one live epic (this one currently does:
  // super-plan-2c1 alongside whatever epic this run drives); calling the mutating form unscoped
  // would silently close the other epic's tree and report its ids as this run's own work. Every
  // pass previews with --dry-run --json, filters to this run's tree, then closes only the
  // filtered ids explicitly via `bd close <id>`. Do not "simplify" this back to the unfiltered
  // mutating form — that is the exact bug this filter exists to prevent.
  //
  // Two edge cases the stop condition and membership test MUST cover (both caught in review, kept
  // here so a future edit can't drop them silently):
  // - The root epic itself has zero `parent-child` dependency entries (verified live: `bd show
  //   <root> --json` on this repo's own root shows `dependencies` count 0 — roots don't have
  //   parents). Without an identity base case, the walk would run out of links on the root and
  //   misclassify it OUT-OF-TREE, so `bd close ${epicId}` would never be issued and rootClosed
  //   would stay false forever. Identity is checked FIRST, before the walk, so it can't fall
  //   through to "no parent link found".
  // - `--dry-run` is stateless and out-of-tree ids are deliberately left untouched, so if any
  //   unrelated epic in the repo is permanently close-eligible (super-plan-2c1 again is the live
  //   example), every preview keeps returning it forever. "Stop when the preview is []" is then
  //   unsatisfiable and the dispatched agent spins with no outer guard to break it. The stop
  //   condition is instead "a pass closes zero in-tree ids" — immune to a permanently-eligible
  //   out-of-tree candidate, and still correct: each pass that closes something can unlock the
  //   next tree level up, so the loop still reaches a real fixpoint.
  return `Loop the following. STOP CONDITION: stop when a pass closes zero in-tree ids — do NOT stop merely because a preview call returns \`[]\`; those are different, see step 4.
1. Run \`bd epic close-eligible --dry-run --json\` and parse the returned array of candidate epic ids. (bd epic close-eligible closes at most one tree level per call, so this loop runs multiple passes even in the simplest case.)
2. For each candidate id, classify it IN-TREE or OUT-OF-TREE using this test, in priority order — do not skip step (a) even when (b) seems obvious:
   a. AUTHORITATIVE, checked in this order:
      - IDENTITY: if id === "${epicId}", it is IN-TREE. Stop here — do not attempt a parent walk on the root; the root has no parent-child dependency entry to find (verified: \`bd show ${epicId} --json\` shows an empty or root-parentless \`dependencies\` array for the root itself), so a walk would wrongly conclude OUT-OF-TREE.
      - PARENT-CHILD WALK (only for id !== "${epicId}"): run \`bd show <id> --json\` and read its \`dependencies\` array for an entry with \`dependency_type: "parent-child"\` — that entry's id is <id>'s parent. If found, repeat the same test (identity check, then walk) on that parent id. If no such entry exists and id !== "${epicId}", it is OUT-OF-TREE (you have reached a different tree's root, or an unparented bead, without ever passing through ${epicId}).
      - Worked examples (epicId = "super-plan-2c1"): id "super-plan-2c1" -> identity match -> IN-TREE, no walk. id "super-plan-2c1.8" -> not identity -> bd show shows parent-child entry to "super-plan-2c1" -> that IS epicId -> IN-TREE, one hop. id "super-plan-2c1.3.1" (nested subepic) -> not identity -> parent-child entry to "super-plan-2c1.3" -> not identity, not epicId itself -> recurse: bd show super-plan-2c1.3 --json has a parent-child entry to "super-plan-2c1" -> that IS epicId -> IN-TREE, two hops. id "acme-9" (an unrelated epic's own root) -> not identity -> bd show acme-9 --json has no parent-child entry at all -> OUT-OF-TREE.
      - Bound the walk to a handful of hops (beads trees are shallow); if you somehow exceed ~10 hops without resolving, treat as OUT-OF-TREE and do not close it — err toward leaving an ambiguous id alone.
   b. SANITY CHECK ONLY, never authoritative: the id-prefix convention (<id> === "${epicId}" or <id> starts with "${epicId}.") should agree with (a). If it ever disagrees — e.g. a hand-created bead was given a lookalike id, or a bead outside the naming convention was parented under this epic — trust (a), not the prefix.
3. Close only the IN-TREE ids from this pass, individually: run \`bd close <id>\` once per id (never the bare, unfiltered \`bd epic close-eligible\` mutating form). Append each closed id to closedThisRun. Leave OUT-OF-TREE ids untouched — they belong to unrelated work sharing this repo, and will keep reappearing in future previews; that is expected, not a bug.
4. If step 3 closed zero ids this pass (whether because the preview was \`[]\`, or because the preview was non-empty but every candidate was OUT-OF-TREE), STOP — the fixpoint is reached. Otherwise, repeat from step 1.
When the loop stops, run \`bd show ${epicId} --json\` and report rootClosed as true iff its status is closed, plus closedThisRun listing only the ids this run actually closed via \`bd close\` across all passes.`
}

// The remaining prompt builders are deliberately minimal — the real prompt content lives in
// ./planner-prompt.md, ./triage-prompt.md, and subagent-driven-development's own templates (see
// "Per-task pipeline" and "The blocker-bead path" above), which each builder points at by name.
// These exist so every agent() call site has a defined, legible dispatch string — not to
// duplicate those files' content. Keep them short; this is a reference skeleton, not the prompt
// library. (Every one of these was previously called-but-undefined — see "dryRun policy" below
// for why a `node --check` pass didn't catch that.)

function planPrompt(epicId, ids) {
  // planner (opus), once per epic then append-only — see "Plan materialization". Follows
  // ./planner-prompt.md verbatim (do not paraphrase it here — that template is what carries the
  // filesTouched-in-section-body requirement and the over-declare-when-uncertain policy that
  // makes groupByDisjointFiles' fail-safe bucketing correct); this builder only supplies the
  // per-dispatch variables that template's "Epic" / "Beads to plan this round" sections need.
  // `ids` is THIS ROUND'S CONFIRMED-READY set (from `bd ready`, filtered — see the `ids` binding
  // above) — it is NOT the planner's full planning scope: `bd ready` structurally never returns a
  // blocked bead, but planner-prompt.md's "Beads to plan this round" requires every ready AND
  // blocked descendant on the first planning round. Passing only `ids` here would silently narrow
  // round-1 planning to ready beads and make that documented behaviour unreachable, so the planner
  // is told explicitly to enumerate the wider set itself on round 1 rather than being handed it.
  // ENUMERATION COMMAND — verified live against this repo, do not swap for `bd show <epic>
  // --json`: `bd show` reports only scalar `dependent_count`/`dependency_count` on an epic, no
  // child ids at all (parent-child edges point upward — a child names its parent, exactly why
  // closeEpicsPrompt's walk above works — the reverse direction is not readable from `bd show`).
  // `bd children <id> --json` is the verified downward-enumeration command, but it is direct
  // children of ONE level only (confirmed: `bd children super-plan-2c1 --json` in this repo
  // returns only super-plan-2c1's immediate children, none of any nested epic's own children) —
  // so a genuine descendant walk must recurse: children of the epic, then children of any of
  // those that is itself epic-typed (`issue_type: "epic"`), repeating until no unexpanded
  // epic-typed child remains.
  return `Follow ./planner-prompt.md for epic ${epicId}. On the FIRST planning round (plan.md has no mapping rows yet), independently enumerate every READY AND BLOCKED descendant bead of ${epicId} and plan all of them: run \`bd children ${epicId} --json\` for its direct children, then run \`bd children <id> --json\` on every one of those children whose \`issue_type\` is "epic" to get its children in turn, repeating until no unexpanded epic-typed child remains (\`bd children\` returns direct children of one level only — do NOT use \`bd show ${epicId} --json\`, which reports only dependent/dependency counts, no child ids, since parent-child edges point upward and it cannot read the downward direction). Do not limit round-1 planning to ready ids only, since \`bd ready\` structurally excludes blocked beads. On a REFILL round, plan only beads that don't already have a mapping row (newly-ready or newly-created, blocker beads included). This round's confirmed-ready ids (a subset of the planning scope above, not the full scope): ${JSON.stringify(ids)}. Run \`bd show <id> --json\` for every bead you plan this round, for "Beads to plan this round". Report per that template's Report Format: planPath, and mapping as the FULL CUMULATIVE table (every row assigned so far in plan.md, including earlier rounds' rows — never only this round's new ones).`
}

function taskBriefPrompt(planPath, n, id, worktree) {
  // MECHANICAL: scripts/task-brief owns the awk extraction and brief-file naming (see "Plan
  // materialization" — do not hand-roll this from the mapping table). n must be the plan
  // ordinal, never the bead id (task-brief's heading regex requires a leading digit).
  // `base` is captured HERE, right after the worktree is cut and before the implementer makes any
  // commit — exactly "the commit you recorded before dispatching the implementer" that SKILL.md's
  // "Handle the report" section requires review-package's BASE to be, instead of `HEAD~1` (which
  // silently drops all but the last commit of a multi-commit task —
  // subagent-driven-development/SKILL.md:238). The coordinator carries it forward from here on
  // (see the implement pipeline stage and reviewAndFix) rather than asking any later subagent to
  // re-derive or echo it.
  return `Create the task worktree at ${worktree}, branched from the epic integration branch (see "Dispatching the implementer"). Run \`scripts/task-brief ${planPath} ${n}\` to produce the brief file. In ${worktree}, run \`git rev-parse HEAD\` to capture the pre-implementer commit. Report id ${id}, n ${n}, branch ${worktree}, base <the commit SHA just captured>, and status BRIEFED (or, on the script's "task not found" failure, status BLOCKED).`
}

function implementPrompt(br, integrationBranch) {
  // subagent-driven-development/implementer-prompt.md + the brief path, unmodified — the two
  // autonomous-mode additions (worktree convention, self-filing blocker beads) are supplied as
  // extra dispatch text here, not by editing the prompt file (see "Dispatching the implementer").
  // The report contract deliberately asks for only id/status/files, not n/branch/base: those three
  // are already coordinator-known (from `br`) and are re-stamped onto this call's result in the
  // pipeline call site regardless of what's reported — asking for them here would just invite a
  // second, ignorable source of truth (see the pipeline call site and RESULT's `base` comment).
  return `Follow subagent-driven-development/implementer-prompt.md against the brief for task ${br.id} (n ${br.n}), working in ${br.branch}, branched from integration branch ${integrationBranch}. If BLOCKED after 3 no-progress fix-loops, file the blocker bead yourself (see "The blocker-bead path") — there is no human partner to escalate to mid-task. Report id, status (IMPLEMENTED or BLOCKED), and files touched.`
}

function taskReviewPrompt(im, planPath) {
  // scripts/review-package PLAN_FILE BASE HEAD -> subagent-driven-development/task-reviewer-prompt.md
  // (single reviewer, spec-compliance + quality in one dispatch — the retired two-stage split
  // never applies here). review-package requires all three positional args and exits 2 with fewer
  // than three — it must never be invoked bare. BASE is `im.base`, the pre-implementer commit the
  // brief stage captured right after cutting the worktree (see taskBriefPrompt) and the coordinator
  // carried forward unchanged since (see the implement pipeline stage) — never `HEAD~1`, which
  // silently drops all but the last commit of a multi-commit task
  // (subagent-driven-development/SKILL.md:238). HEAD is passed literally: run from inside
  // ${im.branch}, where it resolves to that worktree's current tip. The report contract below asks
  // for only id/status/finding, not n/files/branch/base: `reviewAndFix`'s `carried()` re-stamps
  // those four from `im` on every return regardless of what's reported (see `reviewAndFix` above)
  // — this is the C2 fix, since neither this contract nor `reReviewPrompt`'s ever reliably carried
  // `branch`, which is what left `mergePrompt`'s `r.branch` undefined.
  return `In ${im.branch}, run \`scripts/review-package ${planPath} ${im.base} HEAD\` for task ${im.id} (n ${im.n}) and follow subagent-driven-development/task-reviewer-prompt.md over the resulting package. Report id and status CLEAN or NEEDS_FIX — on NEEDS_FIX, put the finding text in the \`finding\` field (fixPrompt builds the fix dispatch from it directly, not from the rest of this result).`
}

function fixPrompt(rv) {
  // Round 1 of the fix loop — resumes the original implementer on the reviewer's finding. Rounds
  // 2-5 and the terminal action at the cap are exactly "The breaker, autonomous variant" above.
  // The finding text (rv.finding), not the whole RESULT object, is the substance of this prompt —
  // stringifying rv wholesale would hand the implementer {id,n,status,files,branch,base} and no
  // finding to actually fix, since none of RESULT's other fields carry the reviewer's finding text.
  // `rv` here is already `carried()`-stamped by reviewAndFix, so `rv.branch` (used for "the
  // worktree for task X") is real, not an echo this function has to trust the reviewer for.
  // Report contract: id and status only — n/files/branch/base are re-stamped by `carried()` again
  // after this call, same reasoning as taskReviewPrompt above.
  return `Resume the original implementer in the worktree ${rv.branch} for task ${rv.id} (n ${rv.n}) and address this review finding: ${rv.finding}. Report id and status FIXED.`
}

function reReviewPrompt(fixed) {
  // subagent-driven-development/re-review-prompt.md, scoped to the fix diff only — not a full
  // re-review of the whole task. `fixed` is `carried()`-stamped by reviewAndFix before reaching
  // here, so `fixed.branch` is real (previously this interpolated a plain fixPrompt-agent echo
  // that fixPrompt's own report contract never asked for — the same C2 gap, one hop earlier).
  // Report contract: id and status only, same reasoning as taskReviewPrompt above.
  return `Follow subagent-driven-development/re-review-prompt.md, scoped to the fix diff for task ${fixed.id} (n ${fixed.n}) in ${fixed.branch}. Report id and status CLEAN (finding ADDRESSED) or NEEDS_FIX (still open).`
}

function mergePrompt(r, integrationBranch, integrationWorktree) {
  // "Serial merge-back": rebase onto the integration branch, run the test command, merge --no-ff
  // and bd close on success; one bounded auto-resolve attempt on conflict/red, else the blocker path.
  return `In ${integrationWorktree}, update ${integrationBranch} and rebase task ${r.id}'s branch ${r.branch} onto it. Run the project test command. If clean, merge --no-ff into ${integrationBranch}, run \`bd close ${r.id}\`, and report merged true. If the rebase conflicts or tests are red, make one bounded auto-resolve attempt; if that also fails, file a blocker bead (see "The blocker-bead path") and report merged false with its id as blockerBead.`
}

function triagePrompt(id, blockerBead) {
  // The one genuine judgment call in this script's blocker handling (opus) — RESOLVE vs
  // ESCALATE — see "The blocker-bead path". Follows ./triage-prompt.md verbatim; this builder
  // only supplies the per-dispatch variables that template's "Blocker bead" / "Originating task
  // plan" sections need. `handleBlocker` below branches on `t.decision === 'RESOLVE'` — exact
  // string equality against the TRIAGE schema's `decision` field — so the bare-token requirement
  // is restated here as a safeguard, not left to the template alone (same lesson as C5/I2: a
  // template-compliant-but-wrong report silently degrades a RESOLVE into a quarantine).
  return `Follow ./triage-prompt.md for the blocker bead ${blockerBead} filed against task ${id}. Run \`bd show ${blockerBead} --json\` for that template's "Blocker bead" section. Look up task ${id}'s ordinal via the plan.md mapping table and paste its "## Task <N>" section for "Originating task plan". Include the relevant spec excerpt. Report per that template's Output Contract: \`decision\` must be the BARE TOKEN "RESOLVE" or "ESCALATE" ONLY — no colon, no clarification text in that field, since the coordinator branches on exact string equality against it — with the clarification (RESOLVE) or summary + decision needed (ESCALATE) in \`detail\`.`
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
async function reviewAndFix(im, planPath) {
  const rv = await agent(pick(() => taskReviewPrompt(im, planPath), `review:${im.id}`),
    { label: `review:${im.id}`, phase: 'Implement', model: model('reviewer'), schema: RESULT })
  // C2's fix: none of taskReviewPrompt's/fixPrompt's/reReviewPrompt's report contracts ask for
  // `branch` (taskReviewPrompt's asks for "id, n, files, and status"; reReviewPrompt's asks for
  // "id, n, and status") — so `rv`/`fixed` never reliably carry it, and reReviewPrompt below
  // interpolates `fixed.branch` into its dispatch text. Re-stamp `n`/`files`/`branch`/`base` from
  // `im` (the implementer's result, itself carried forward from the brief stage — see the pipeline
  // call site) after every hop in this loop, rather than trusting a reviewer/fixer echo. This is
  // also what makes `mergePrompt`'s `r.branch` non-undefined: everything reviewAndFix returns has
  // passed through this re-stamp.
  const carried = result => ({ ...result, n: im.n, files: im.files, branch: im.branch, base: im.base })
  if (rv.status !== 'NEEDS_FIX') return carried(rv)
  const fixed = await agent(pick(() => fixPrompt(carried(rv)), `fix:${rv.id}`),
    { label: `fix:${rv.id}`, phase: 'Implement', model: model('implementer'), schema: RESULT })
  const rr = await agent(pick(() => reReviewPrompt(carried(fixed)), `re-review:${fixed.id}`),
    { label: `re-review:${fixed.id}`, phase: 'Implement', model: model('reviewer'), schema: RESULT })
  return carried(rr)
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
| `brief:bd-101` / `brief:bd-102` / `brief:bd-103` | `{id:"bd-1XX",n:<n>,status:"BRIEFED",files:[...],branch:".worktrees/<integrationBranch>--task-bd-1XX",base:"<40-char-sha>"}` | call-site-qualified per id (a single unqualified `brief` key can't return three different ids/branches); `base` here is the pre-implementer commit taskBriefPrompt now captures — this is where `n`/`branch`/`base` originate for the rest of the pipeline |
| `implement:bd-101` / `implement:bd-102` / `implement:bd-103` | `{id:"bd-1XX",n:<n>,status:"IMPLEMENTED",files:[...],branch:"..."}` | same per-id qualification. This stub's `n`/`branch` are cosmetic only — the pipeline's implement stage re-stamps `n` from `ordinalFor(br.id)` and `branch` from `taskWorktree(br.id)` directly (never trusting the implementer's own echo, nor even the brief agent's — see the pipeline call site); only `base` is carried from the brief result (`br.base`), since that one genuinely can't be recomputed |
| `review:bd-101` | `{id:"bd-101",n:1,status:"NEEDS_FIX",files:["src/a.js"],finding:"missing null check on parsed input in src/a.js:42"}` | the one task whose review returns a finding — `finding` is what `fixPrompt` builds the fix dispatch from, not the rest of the result. No `branch`/`base` here by design: `reviewAndFix`'s `carried()` re-stamps both from `im` regardless of what this report contains, which is the C2 fix |
| `review:bd-102` / `review:bd-103` | `{id:"bd-1XX",n:<n>,status:"CLEAN",files:[...]}` | clean reviews — no fix loop for these two |
| `fix:bd-101` | `{id:"bd-101",n:1,status:"FIXED",files:["src/a.js"]}` | fix round dispatched only for the flagged task; no `branch` here either, by the same design as `review:bd-101` above |
| `re-review:bd-101` | `{id:"bd-101",n:1,status:"CLEAN"}` | finding `ADDRESSED` — scoped re-review over the fix diff; `reviewAndFix` re-stamps `branch`/`base`/`n`/`files` from `im` onto this before it becomes the task's final result, which is what reaches `mergePrompt`'s `r.branch` |
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
- `r.branch` reaching `mergePrompt`'s dispatch text and `im.base` reaching `taskReviewPrompt`'s
  (C2/C6) is verified only by reading `mergePrompt`'s and `taskReviewPrompt`'s definitions — never
  by this or any dryRun's output, for the identical reason the scoping and finding-rendering
  caveats above are (see "What this dryRun proves and does not prove" below): `pick()` is lazy, so
  under `dryRun: true` neither builder is ever called and neither one's template literal ever
  interpolates anything — the text actually sent to the stubbed agent is the literal stub string,
  full stop. A regression that deleted `carried()`, or the brief→implement `taskWorktree`/
  `ordinalFor` re-stamp, would **not** fail this dryRun: agent count stays 22, errors stay 0, and
  neither `completed`/`escalated` nor any schema the loop branches on carries branch/base
  information. What the dryRun *does* exercise, because these are plain JS and not behind `pick()`,
  is the carry-forward assignments themselves running without throwing on every stubbed `im`/`br` —
  that only proves the code path executes, not that its result reaches a dispatch string.

If any assertion fails, fix the script **in this doc** (this doc's script is canonical) and
re-run before committing the fix.

### Passing baseline (recorded, not illustrative)

Run `wf_b1958510-6bf`, 2026-07-30, against an earlier revision of the args below — one that
predates the `base`-carrying fix for C2/C6 (Task 3): that revision's `brief:*` stubs had no `base`
field, `RESULT` had no `base` property, and `reviewAndFix` had no `carried()` re-stamp. **22 agents
dispatched, 0 errors**. Returned `{completed: ["bd-101","bd-102"], escalated: ["bd-103"]}` with the
final review's verdict `conditional-pass`. This confirms every assertion above **except scoping and
finding-rendering** (see "What this dryRun proves and does not prove" below), in the dispatch order
the journal recorded:

1. `close-epics` → `{rootClosed:false, closedThisRun:[]}`
2. `bd-ready` → 3 ids — real evidence the loop got its batch, but **not** evidence of scoping: a
   stub returns its canned ids regardless of what flags the prompt baked in, so this step would
   look identical even if `--exclude-type=epic --label sp:${epicId}` had been deleted from the
   dispatched prompt. The scoping assertion is, and remains, established only by reading that
   prompt's construction at line 458 — confirmed present there — never by this or any dryRun's
   output (see the `bd-ready` stub table entry and "What this dryRun proves" below).
3. `plan` → mapping with `filesTouched`
4–5. `brief:bd-102`, `brief:bd-101` — same bucket, **concurrent**. **Only bucket membership is
   meaningful here, not the order within it**: this run dispatched 102 before 101; the prior run
   (below) dispatched 101 before 102. The two runs are not identical — fix round 2 changed
   `RESULT`/`fixPrompt` and the `review:bd-101` stub between them (see "Prior run, kept as
   history" below) — but the plan stub's file mapping and `groupByDisjointFiles`, the code that
   actually forms buckets, were unchanged across both, so this specific flip is attributable to
   concurrent-sibling scheduling, not to anything we changed. `{bd-101, bd-102}` sharing a bucket
   (disjoint files, `src/a.js`/`src/b.js`), and `bd-103` landing in a *later* bucket, are the
   assertions; completion order among concurrent siblings within one bucket carries no information
   and must never be read as an expected fixed sequence.
6–7. `implement:bd-102`, `implement:bd-101`
8–9. `review:bd-102` → `CLEAN`; `review:bd-101` → `NEEDS_FIX` (+ `finding`)
10–11. `fix:bd-101` → `re-review:bd-101` → `CLEAN` — fix round dispatched **only** for the task
   whose review returned a finding
12–14. `brief`/`implement`/`review` for `bd-103` — **serialized into a later bucket**, because it
   declares `src/a.js`, colliding with `bd-101`
15–17. `merge:bd-101` OK → `merge:bd-102` OK → `merge:bd-103` FAILED (blocker bead `bd-104`) —
   **serial**, one at a time, in dependency/ready order (this cross-bucket/merge order, unlike
   intra-bucket order above, *is* an assertion and *is* meaningful)
18. `triage:bd-103` → `ESCALATE`
19. `notify:bd-103` — the run **continues** rather than halting
20. `close-epics` → `{rootClosed:false, closedThisRun:["bd-101","bd-102"]}`
21. `bd-ready` → `{ids:[]}` — the loop terminates
22. `final-review`

**Not yet re-verified against the current args block below.** Task 3 added `base` to `RESULT`, to
the `brief:*` stubs, and to the args JSON below, plus the `carried()` re-stamp inside
`reviewAndFix` and the brief→implement re-stamp at the pipeline call site. Per "dryRun policy"
above's own data-edit/structural-edit distinction, this is a data-carrying change, not a topology
change — no `agent()` call was added, removed, or reordered, so the dispatch order/count above are
expected to still hold unchanged. That expectation was checked by `node --check` plus a manual
grep of every call site (see the commit), but **not** by an actual re-run: no Workflow-dispatch
tool was available in the environment this task was implemented in. Re-run against the args below
before the next structural edit lands, and replace this recorded run with the fresh one.

**Schema-less dispatches — the harness's "1 empty result" is expected, not a defect.** Two of the
22 calls carry no `schema:` and so return free text rather than structured output: `notify` (line
651) is fire-and-forget — the coordinator never reads its return, so free text (this run's came
back as fenced markdown) is fine and is simply ignored. `final-review` (line 510) is also
schema-less by design — its raw string is returned verbatim as this script's `review` result field,
not parsed. Neither is a bug; a future run reporting one or two empty/unstructured results among
the 22 is exactly this, not a regression, and should not be "fixed" by adding schemas that would
force those two dispatches into a shape they don't need.

**What this dryRun proves and does not prove** (same caveat `super-roast`'s doc states for its own
baselines): it proves **coordinator topology** — dispatch order, the disjoint-file batching (at
the bucket-membership level — see the correction on intra-bucket order above), the serial merge
gate, blocker-bead routing, and loop termination, all of which the sequence above confirms
directly. It proves **nothing** about the real prompts' content, since every agent in this run was
a canned stub, and **nothing** about actual git/`bd` behavior, since `dryRun: true` means no I/O
occurred — a real implementer's fix, a real triage RESOLVE/ESCALATE judgment, and a real merge's
auto-resolve attempt are exercised only by a live run. It also proves **nothing** about `bd ready`
**scoping** specifically, for the same reason: `bd-ready`'s stub returns its canned ids
unconditionally, so a dryRun cannot distinguish a correctly-scoped prompt from one with the
scoping flags silently deleted — that assertion is, and can only ever be, verified by reading the
dispatched prompt's construction at line 458, not by running this or any dryRun (see step 2
above). The identical caveat applies to **finding-rendering**: `pick()` is lazy (fix round 1), so
under `dryRun: true` the real `fixPrompt` is never called, and this run cannot demonstrate that
`rv.finding` actually reaches the fix dispatch text. What it *does* prove is narrower: `RESULT`
carries `finding` across the schema boundary intact — the `review:bd-101` stub returned it and it
survived into `rv` unchanged (step 8–9 above). The rendering itself — that `fixPrompt` interpolates
`rv.finding` into the dispatch string — is verified only by reading line 565, the same way scoping
is verified only by reading line 458. The identical caveat applies a third time, to `branch`/`base`
**carry-forward** (C2/C6): `mergePrompt` and `taskReviewPrompt` are exactly as lazy as `fixPrompt`
under `pick()`, so this run never calls either and never interpolates `r.branch`/`im.base` into any
dispatch text — a regression that deleted the `carried()` re-stamp or the brief→implement
`taskWorktree`/`ordinalFor` re-stamp would still show 22 agents, 0 errors, and identical
`completed`/`escalated`. What *is* narrower and true: the re-stamp assignments are plain JS, not
gated by `pick()`, so they run on every stubbed `im`/`br` in this trace without throwing — but that
only proves the code path executes, not that its output reaches a prompt. Whether `r.branch`
actually reaches `mergePrompt`'s text and `im.base` actually reaches `taskReviewPrompt`'s is, and
can only be, verified by reading those two functions' definitions directly.

**Prior run, kept as history.** Run `wf_d65bc00e-990`, 2026-07-30 (recorded before fix round 2 —
`review:bd-101`'s stub then had no `finding` field), also passed: 22 agents, 0 errors, identical
`completed`/`escalated`/verdict. The only observed difference from the current baseline is
intra-bucket dispatch order (`brief:bd-101` before `brief:bd-102`, vs. `102` before `101` above) —
per the correction above, that is not a regression and the two runs are not "identical," just
both-passing on the dimensions that are actually assertions.

**Journals are session-local.** The run id and the figures above are the durable record; the
journal `wf_b1958510-6bf` itself is not guaranteed to remain inspectable. A future maintainer
re-verifies this baseline by re-running the Workflow tool with the `args` below and comparing the
new run's figures against the ones recorded here (allowing for intra-bucket reordering, per the
correction above) — not by going looking for this run's journal.

To reproduce or re-verify, run the Workflow tool with this script and `args` (unchanged from the
scenario this baseline used):

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
      "brief:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"BRIEFED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-101\",\"base\":\"aaaaaaa1111111111111111111111111111111\"}",
      "brief:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"n\":2,\"status\":\"BRIEFED\",\"files\":[\"src/b.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-102\",\"base\":\"bbbbbbb2222222222222222222222222222222\"}",
      "brief:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"n\":3,\"status\":\"BRIEFED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-103\",\"base\":\"ccccccc3333333333333333333333333333333\"}",
      "implement:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"IMPLEMENTED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-101\"}",
      "implement:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"n\":2,\"status\":\"IMPLEMENTED\",\"files\":[\"src/b.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-102\"}",
      "implement:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"n\":3,\"status\":\"IMPLEMENTED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-103\"}",
      "review:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"NEEDS_FIX\",\"files\":[\"src/a.js\"],\"finding\":\"missing null check on parsed input in src/a.js:42\"}",
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

If a future structural edit changes this script, re-run with these args, confirm the same 22/0
shape (or update it deliberately alongside the edit that changed it), and replace the figures
above — same discipline as `super-roast`'s "Passing baseline (recorded, not illustrative)"
sections.
