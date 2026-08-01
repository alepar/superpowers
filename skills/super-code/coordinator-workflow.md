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
    models: { planner: 'opus', implementer: 'sonnet', reviewer: 'sonnet', mechanical: 'sonnet', triage: 'opus', finalReview: 'opus', fixEscalation: 'opus' },
  },
  prompts: { ... },
}
```

`fixEscalation` is **optional** — additive, non-breaking, unlike every other key above (see "a
differently-spelled key breaks every later task silently" just above: that warning is about
*respelling* an existing key, not about adding a new optional one). It names the model rounds 4-5
of the fix loop escalate to (see "The breaker, autonomous variant" and `reviewAndFix` below); if
omitted, the script falls back to `triage`'s tier. It is *not* `triage` itself: escalating a stuck
implementer to a more capable model is a capability bump, not the RESOLVE/ESCALATE judgment call
`triage` names (see immediately below) — conflating the two would make three separate statements
in this doc false at once (this paragraph, `handleBlocker`'s comment, and SKILL.md's tiering
table), which is exactly the trap a prior round of review caught here.

`mechanical` and `triage` are deliberately separate roles even though both may resolve to cheap
tiers: `triage` names the opus **judgment calls** in the blocker path — deciding RESOLVE vs
ESCALATE on a blocker bead (see "The blocker-bead path"), and deciding PARK vs BLOCKED when the
fix-loop breaker trips (see "The breaker, autonomous variant") — it never means "the cheap one,"
and it never means "the fix-loop escalation tier" either (that's `fixEscalation`, above).
`mechanical` is for dispatches with a fully-specified, no-improvisation procedure — no branching
left to the dispatched agent's judgment, whether that procedure is a literal CLI echo (`bd ready`,
`scripts/task-brief` dispatch, notifications, recording a clarification) or a short fixed algorithm
spelled out with worked examples, such as the epic-closure fixpoint (`bd epic close-eligible`'s
dry-run/filter/close loop — see `closeEpicsPrompt` below; it outgrew a bare echo once it had to be
scoped to this run's tree, but every branch in it is still a deterministic rule, not a judgment
call). Spending opus on any of these wastes budget against `subagent-driven-development`'s Model
Selection guidance and, worse, blurs "triage" into meaning more than one thing in the same doc.
Keep every dispatch whose every branch is pre-decided on `mechanical`; keep every dispatch that
decides RESOLVE vs ESCALATE, or PARK vs BLOCKED, on `triage`.

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
agent per stage instead of the interactive controller) and *what happens at the fix-loop cap*: a
dispatched adjudicator, following SDD's own breaker rubric, still decides PARK-with-a-ruling
(merge — the finding wasn't load-bearing) vs BLOCKED (file a blocker bead instead of stopping the
session — see "The breaker, autonomous variant" below). It does not change the review discipline
itself, and it does not reimplement the adjudication rubric — it invokes it.

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

1. **Query** — an agent runs a fast labelled query first, `bd ready --exclude-type=epic --label
   sp:<epicId>` (excludes epic-type containers, which `bd ready` includes by default, and scopes to
   this run's tree via the `sp:` label `super-design` stamps on everything it creates). **An empty
   result here does not mean the tree is empty** (see "Resolved in this branch": the `sp:`-labelling and canonical-args items): the label
   only exists on trees `super-design` created — a hand-made epic, or a sub-epic handed to super-code
   directly (whose members carry the *root* epic's `sp:` label, not their own id's), always comes up
   empty on this query even with real ready work waiting. When it does, the agent falls back to
   `bd ready --exclude-type=epic` (repo-global) and filters the result to this run's tree using the
   same structural parent-child test the epic-closure step below uses — never the id-prefix
   convention alone, which a hand-created or nested-subepic bead can violate. One membership test,
   described once (`treeMembershipTest` in the script skeleton), used by both phases.
2. **Terminate?** — completion is **the root epic (`epicId`) closed**, not an empty ready set:
   run the epic-closure step (below) after each refill cycle and check whether the root closed.
   An empty ready set with the root still open means the remaining work is quarantined blockers
   (see "The blocker-bead path") — that ends the loop too, but as a report, not a clean finish. A
   **third** exit, independent of both: a round that merges no task, closes no epic, gains no
   RESOLVE-pending id, and quarantines no id at all made no forward progress whatsoever and never
   will on its own. A `RESOLVE` triage verdict gets exactly one real re-attempt next round before
   it's bounded into an `ESCALATE` (see "The blocker-bead path") — that bound alone guarantees any
   *single* stuck id eventually terminates, but this guard is the belt-and-suspenders backstop for
   the general case (any future loop-control edge this doc hasn't anticipated). Stop and report
   rather than spin (see the script skeleton's no-progress guard, right after the Integrate phase).
3. **Group for parallelism, then pipeline the batch** — bucket the round's ready ids so no two
   ids in the same bucket share a declared file (recorded on the bead body / brief, not derived
   by the script). **Buckets serialize relative to each other** (never dispatched concurrently
   with one another); **within a bucket**, ids run as concurrent siblings, chunked to the
   concurrency cap (default 4) — this is where the concurrency actually lives, never across
   buckets. Two ready ids that share a file are never siblings in the same `pipeline()`/
   `parallel()` call — put in different buckets and so **serialized** relative to each other —
   since concurrent implementers on the same file race each other's worktree and merge. Within a
   bucket, run the per-task pipeline (below) with **no barrier between stages** (a fast task isn't
   held up by a slow sibling).
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

Termination is by the root epic closing, a quarantine drain, or the no-progress guard tripping —
**not** by token budget: there is no budget-based pause.

## Workspace and ledger

This skill's `scripts/sdd-workspace` and the durable ledger it anchors exist to provide one
property: **an interrupted epic resumes from the ledger, not from coordinator memory.** A
Workflow run can be killed, restarted, or simply lose its place across a long epic; the ledger is
what lets the *next* invocation pick up exactly where the last one left off instead of
re-querying beads state and guessing. (I1: until this fix, no dispatch in the script skeleton ever
wrote or read this file — everything below described intent, not behavior. `readLedgerPrompt` /
`ledgerAppendPrompt` and the Resume-phase block in the script skeleton below are what make it real.)

- **Workspace, one per epic:** I7 fix — every epic's plan file used to be named literally
  `plan.md`, so `scripts/sdd-workspace`'s basename-derived directory
  (`.superpowers/sdd/plan/`) was the *same path for every epic in the repo*: every epic's ledger
  collided on `.superpowers/sdd/plan/progress.md`, which defeats the plan-scoping that script
  exists to provide and would make a resumed run's ledger-skip rule (below) skip a *different*
  epic's tasks entirely. The plan file is now named per epic — `<epicId>-plan.md` — giving
  `sdd-workspace`'s own basename-slug rule a distinct workspace per epic,
  `.superpowers/sdd/<epicId>-plan/`, home to that epic's `plan.md`, every task's
  brief/report/review-package files, and the ledger.
- **Which worktree owns the ledger:** the **integration worktree** (`.worktrees/<integrationBranch>`),
  never a per-task worktree. Per-task worktrees (`.worktrees/<integrationBranch>--task-<bead id>`)
  are where implementer/reviewer/merge agents do one task's own git/bd work and can be quarantined
  or torn down independently of every other task; the integration worktree is the one long-lived,
  single-writer location the whole epic's outcomes converge on — the serial merge gate and the
  blocker-bead path already run there (see "Serial merge-back" and "The blocker-bead path"). A
  git-ignored scratch directory like `.superpowers/sdd/` is a plain path on disk, not shared across
  worktrees the way tracked, committed files are — a task agent reading or writing the ledger from
  its own worktree would see, or produce, a second, divergent copy nothing else in the run ever
  reads. Every ledger read/append dispatch is scoped `In <integration worktree>` for exactly this
  reason.
- **Ledger:** `<workspace>/progress.md`, first line `# SDD ledger — plan: <plan file path>`,
  exactly SKILL.md's Setup contract (the coordinator's `ledgerAppendPrompt` creates this header
  on the first append to a fresh epic's ledger, since there is no separate "create the ledger"
  dispatch). Every ledger line names **both** the plan ordinal and the bead id (an unmapped id —
  see "Plan materialization" — has no ordinal and is logged as `Task ? (<bead id>): ...` instead):
  - `Task <N> (<bead id>): complete (commits <base7>..<head7>, review clean)` — a normal clean
    merge. Fix-round-1 (review): this used to read `complete (merged, review clean)`, dropping
    upstream SKILL.md's own commit-range shape (`Task <N>: complete (commits <base7>..<head7>,
    review clean)`) even though a base commit and the merge agent's own tip commit were both
    available at the merge-gate call site — the range is what lets a later reader name the exact
    commits that survive a context loss, per upstream's own stated reason for it; `mergePrompt` now
    also reports `head` (the pre-merge tip of the task branch) so this line can carry it. Fix 3
    (final fix round, Important): the `<base7>` half of this range is `m.mergeBase` — the
    POST-REBASE merge-base `mergePrompt` captures right before merging — never `r.base` (the brief
    stage's PRE-rebase commit): a rebase moves the task branch's ancestry out from under `r.base`,
    so a range built from it would include every commit any OTHER task merged into the integration
    branch since this worktree was cut, not just this task's own (see the `mergeBase`/`MERGE`
    schema comment). `r.base` remains the correct BASE arg for `scripts/review-package`, which runs
    before this rebase (see `taskReviewPrompt`) — the two fields serve two different call sites at
    two different points in the task's git history and are kept deliberately distinct. `short(sha)`
    is the first 7 characters.
  - `Task <N> (<bead id>): complete (commits <base7>..<head7>, 1 parked — ruling: <ruling> —
    finding: <finding>)` — SKILL.md's `<K> parked` completion-line variant: the breaker capped at
    round 5, the dispatched adjudicator ruled PARK, and the task merged anyway with the overruled
    finding on record (`K` is always 1 here: this coordinator's schema carries the survived finding
    as one bundled string, never a per-finding list — see `RESULT`'s `finding` comment in the script
    skeleton). A parked task IS a completed one, in the ledger as much as in the return value —
    there is no SEPARATE "parked" LINE KIND (no third line shape alongside `complete`/`pending
    retry`/`BLOCKED`); this is the `complete` line's own parked variant, distinguished only by the
    `1 parked — ruling: ... — finding: ...` suffix. Fix-round-1 (review): this line used to carry
    `ruling` without `finding` — a reader learned something was overruled but never what the open
    finding actually was, the exact "silent discard" upstream SKILL.md forbids for an adjudicated
    finding. `r.finding` is available at the same merge-gate call site as `r.parkRuling` (`carried()`
    keeps it sticky through the fix loop — see `reviewAndFix`) and is now included alongside the
    ruling.
  - `Task <N> (<bead id>): pending retry — RESOLVE: <detail>` — a blocker bead got a first-time
    RESOLVE verdict; the task is due exactly one bounded re-attempt next round (see "The
    blocker-bead path"), not yet complete and not quarantined.
  - `Task <N> (<bead id>): BLOCKED — <reason>` — the task is quarantined: triage ESCALATEd (or a
    second RESOLVE for the same id bounced into an ESCALATE), regardless of which of the four
    blocker-path triggers produced it (self-filed by an implementer, a failed merge, the breaker
    cap's adjudicated BLOCKED, or an unmapped planner id) — `handleBlocker` is the single place
    every trigger converges on (see its opening comment) and writes this line once, for all of
    them, rather than duplicating the write at each trigger site.
  - `Task <N> (<bead id>): fix round <R>/5 (...)` — SKILL.md's own mid-loop bookkeeping line.
    **Not currently written by this coordinator's script skeleton** (only the four terminal lines
    above are); see "Resume behavior" below for what that means for a restart mid-fix-loop.
- **Resume behavior**, on any restart: the script's Resume phase reads `<workspace>/progress.md`
  once, before the round loop starts (see the script skeleton), and reconstructs `completed`,
  `parked`, and `pendingRetry` from the **last** ledger line recorded for each bead id (a bead can
  accumulate more than one line over a run's history, e.g. a `pending retry` line followed later by
  `complete` or `BLOCKED`). **Stated plainly, once, to resolve a contradiction an earlier revision of
  this doc carried between this bullet and the script skeleton's own Resume-phase comment (which
  used to end with "Resume's job is to avoid redoing MERGED work"):** after the
  relaxation described below, resume's only dispatch-gating, behavior-affecting reconstruction is
  `pendingRetry` (it seeds C-2's one-bounded-retry check). A `complete` line (with or without
  `parked`) is recorded into `completed`/`parked` for **reporting and the no-progress guard's
  baseline only** — it does not, by itself, remove the id from what gets dispatched: `bd ready` is
  the authority on whether the bead is actually closed, and if `bd close` genuinely succeeded the id
  is already absent from `bd ready`'s output; `bd ready`'s own exclusion, not this script's resume
  reconstruction, is what actually avoids redoing merged work. **The one behavioral exception to
  "reporting only":** a nonzero *resumed* `completed.length` still changes what happens at Finish —
  the opus `final-review` dispatch is gated on `completed.length` being nonzero, and Resume seeds
  that count from prior-run ledger lines before this run's own loop ever executes, so a
  re-invocation whose own rounds land zero new merges can still dispatch the whole-epic final review
  solely because an earlier run's work is recorded there. (Fix-round-1, review: this used to also filter the Ready-phase `ids` by
  `!completed.includes(id)`, as "defense-in-depth" against a merge that landed but whose `bd close`
  failed — but that turns exactly that recoverable crash into a **permanent** deadlock: the bead
  never closes on its own, nothing else in this script closes a leaf bead, and the epic can never
  close. Dropping the filter restores the pre-existing-filter behavior: such an id is simply
  re-dispatched, its already-merged worktree makes the re-run a no-op review/merge, and `bd close`
  actually runs this time — wasteful, self-healing, never a deadlock. This re-dispatch enters at the
  brief stage, which (Fix 1, final fix round) is now IDEMPOTENT — it reuses the existing
  worktree/branch when both are already present instead of assuming a fresh `git worktree add` will
  succeed (see `taskBriefPrompt`). Before that fix, the worktree and branch this same id's earlier
  attempt already created would still be sitting there, `git worktree add [-b]` fails hard on both,
  and "simply re-dispatched" would not actually have worked — best case the brief agent improvised
  with no instruction, worst case it errored or reported BLOCKED and the id got re-quarantined, the
  exact outcome this relaxation exists to prevent. Idempotent worktree/branch handling is what makes
  the self-heal here real rather than aspirational; it is part of the same self-heal contract as
  this paragraph's own claim, not a separate concern.) A `pending retry` line seeds
  `pendingRetry` so C-2's one-bounded-retry check still holds after a restart — the id is **not**
  filtered out of `ids`, since it is due its re-attempt, but a second RESOLVE for it is correctly
  bounced into ESCALATE rather than granted an unbounded second chance. **A `BLOCKED` line is
  deliberately NOT reconstructed into anything that gates dispatch** (fix-round-1, review — this
  used to fold it into `escalated`, the same in-memory list `handleBlocker` populates live during a
  run, which then permanently quarantined the id: no ledger line kind ever clears a `BLOCKED`, so
  every future invocation re-filtered it forever, even after the user fixed the underlying blocker —
  making the documented recovery contract below ("The user resolves the blockers and re-invokes the
  coordinator, which picks up the now-ready work") impossible short of hand-editing `progress.md`,
  which nothing supports). A restart instead gives a previously-BLOCKED id a fresh attempt through
  the full pipeline — safe to re-enter because the brief stage is now idempotent (Fix 1, final fix
  round; see the "wasteful, self-healing, never a deadlock" note above and `taskBriefPrompt`), so
  the worktree/branch this id's prior attempt already created is reused rather than crashing on
  `git worktree add`; if the blocker is genuinely still unresolved, `handleBlocker` re-quarantines it
  (live, via the in-memory `escalated` array, which still does its within-a-run job unchanged) after
  **up to two** wasted pipeline passes, not one — see "Known limitations" below for why
  `pendingRetry` isn't seeded from a `BLOCKED` last line, which is what makes the first blocker-path
  visit of a new run get treated as a first-time RESOLVE-eligible attempt rather than immediately
  bounded — self-healing regardless, not a silent permanent lock, the same trade made for
  `completed` above. `escalated` therefore means something narrower after this fix: "quarantined
  earlier in *this* process," not "ever quarantined, in any process, ledger-wide." A bead with no
  ledger line at all — including one whose *only* line is a `fix round <R>/5` entry — is simply
  not started from this coordinator's perspective: unlike SKILL.md's own interactive resume, which
  can resume a fix loop at round `R+1` because a human controller re-reads its own plan/todo state,
  this script has no dispatch that resumes a fix loop mid-round after a restart (there is no live
  implementer context to hand back into) — the next `bd ready` simply surfaces the id again and it
  re-enters the pipeline from the brief stage, re-running any fix loop from round 1. This is a
  known, coarser-grained resume than SKILL.md's own, and is the current, honest behavior — not an
  aspiration. This is a different case from "Escalation = notify + quarantine + continue" below:
  that section's re-invoke covers a *clean drain* where the ready set emptied because of
  quarantined blockers; this section covers resuming a run that stopped mid-flight for any reason
  (crash, restart, manual interruption) while ready work still remained. Both converge on the same
  fixed point now, though: neither a clean-drain re-invoke nor a mid-flight restart ever
  permanently locks out a fixed id — the difference is only *how much* gets redone (a clean-drain
  re-invoke picks the id up from a true `bd ready` batch with nothing wasted; a mid-flight restart
  may waste up to two pipeline passes on an id that's still genuinely blocked before re-quarantining
  it — see "Known limitations" below).
- **Known limitation: `ledger-append` is dispatched fire-and-forget, with no schema — same tier as
  `notify`/`clarify` (see "Schema-less dispatches" in the dryRun policy section), because that was
  the right tier when the ledger was only a side notification nothing downstream read. It's a
  narrower dependency after fix-round-1 than it was — `escalated`/`completed` are no longer
  reconstructed from it for dispatch-gating purposes (see "Resume behavior" above) — but the ledger
  remains the *only* mechanism by which a restarted run recovers `parked` and `pendingRetry`, and the
  only record of `complete`/`BLOCKED` history for reporting. A `ledger-append` call that silently
  fails — the dispatched agent errors, or a partial write — does not degrade a report the way a lost
  `notify` does. A silently-lost `pending retry` line means a restart never reconstructs
  `pendingRetry` for that id, so C-2's one-bounded-retry bound resets and a bad clarification could
  spin for more than one extra round after a restart. A silently lost `complete (commits <base7>..
  <head7>, 1 parked — ruling: ... — finding: ...)` line means a restart never reconstructs `parked`
  for that id — the adjudicator's ruling and the finding it overruled are both gone, and a later
  observer has no record the finding was ever overruled rather than simply never found. Neither
  failure is currently detected: `agent()`'s return from a schema-less dispatch is never inspected.
  Hardening this (e.g. asking `ledger-append` for a structured confirmation and retrying or
  escalating on failure) is future work, not something this fix attempts — recorded here so whoever
  picks it up knows what a silent failure actually costs, not just that one is theoretically
  possible.

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

The bridge: once per epic, a **planner (opus)** agent, running **in the integration worktree**
(see "Workspace and ledger" above — the same worktree that owns the ledger), reads the epic's
beads tree (`bd show` on the epic and its ready/blocked descendants) and writes
`<workspace>/<epicId>-plan.md` with:

1. An **ordinal ↔ bead-id mapping table** at the top — one row per task, `N` assigned in
   dependency order starting at 1, plus each task's declared `filesTouched` — the durable
   translation every downstream consumer of this file reads from, including the disjoint-file
   grouping described below.
2. One `## Task <N>` section per row, headed by the **ordinal**, carrying the bead's acceptance
   criteria and any Global Constraints from the epic body verbatim — the same content discipline
   SKILL.md expects of a hand-written plan.

`<workspace>` is this skill's `scripts/sdd-workspace <epicId>-plan.md`; because that script
requires the file to already exist, the planner's first action on a fresh epic is to `mkdir -p`
the directory and write an initial `<epicId>-plan.md` (mapping table header, no rows yet) itself
before calling `sdd-workspace` to canonicalize the path and git-ignore it. The plan file is named
**per epic**, not literally `plan.md` — I7: every epic used to name it `plan.md`, so
`sdd-workspace`'s basename-derived workspace directory was the *same path for every epic in the
repo*, colliding every epic's ledger on one file (see "Workspace and ledger" above for the full
consequence). On refill, the planner agent re-runs to append new mapping rows and `## Task <N>`
sections for newly-ready beads — new ordinals continue the existing sequence; an already-assigned
ordinal or section is never renumbered or rewritten, since a fix round may still be pointing at it.
**Blocker beads are never planned and never get a mapping row** (see "Resolved in this
branch": the blocker-bead-planning item): a blocker bead is an escalation record about a task — a `blocker` label and a body stating the
task id, what failed, and what was tried (see "The blocker-bead path") — not a work item, and the
planner's `bd children` tree walk has no `--parent` edge to find it by. A blocker bead reaches a
human or gets acted on exclusively through this run's escalation reporting ("Escalation = notify +
quarantine + continue") and the triage agent's RESOLVE/ESCALATE call on the **original** blocked
task, never through re-planning.

**Every downstream call uses the ordinal**: `scripts/task-brief <epicId>-plan.md <N>`, and the
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
dispatch a fresh implementer on `fixEscalation`'s tier — a capability bump, not a judgment call,
so it is *not* `triage`, see "Coordinator contract"; minors go to the ledger as deferred and never
enter the loop; plan-mandated conflicts are a human decision, same as any plan contradiction).
Read SKILL.md's "The fix loop" for that full mechanics — it applies unchanged.

**What autonomous mode changes is the terminal action at the cap, and who performs the
adjudication.** Spec §3.2 requires adopting *both* of SKILL.md's outcomes at round 5 — park with a
ruling, or stop on a load-bearing finding — not cap-always-blocks; a cap that always blocks
quarantines correct work (and every dependent) whenever the reviewer was wrong or the finding
doesn't matter downstream, which is exactly the case most likely to survive five rounds unchanged
(a real defect usually gets fixed; a contestable one doesn't). SKILL.md's breaker adjudicates this
itself, inline, because there's a human controller present to read the plan and the finding and
decide. A Workflow run has no synchronous human partner to do that reading — so `reviewAndFix`
dispatches a fresh agent (`adjudicatePrompt`) that follows SKILL.md's "The breaker" section
verbatim to make the *same* call: is this finding load-bearing, or contestable/non-load-bearing?
This is a dispatched **invocation** of SDD's rubric, not a coordinator-side reimplementation of
it — the governing rule forbids the latter, not the former (see "Boundary" in SKILL.md).

- **PARK** (contestable or non-load-bearing): `reviewAndFix` returns the task as `CLEAN` with the
  adjudicator's `ruling` attached — it proceeds to `mergePrompt` exactly like any other clean
  review. The ruling reaches the ledger's parked-with-a-ruling note per SKILL.md's line shape
  (`Task <N> (<bead id>): complete (commits <base7>..<head7>, 1 parked — ruling: ... — finding:
  ...)`, both the ruling and the overruled finding — see "Workspace and ledger" above) — written at
  the **merge
  gate** (the Integrate loop's `if (m.merged)` branch), not here inside `reviewAndFix`: a PARK
  ruling only carries *intent* until the merge that follows it actually succeeds (see the merge
  gate's own comment — a PARKed task whose merge later fails must not end up recorded as both
  `parked` and `escalated`/`pendingRetry`).
- **BLOCKED** (load-bearing): the same load-bearing verdict SKILL.md's breaker reaches, but
  Workflow has no synchronous human partner to stop the whole run for — halting would freeze every
  *other*, unrelated ready task behind one stuck bead, which defeats the reason to run
  autonomously at all. So instead:
  1. **Files a blocker bead** instead of stopping the session — same shape as any other blocker
     bead (see "The blocker-bead path"): the task id, the load-bearing finding, the adjudicator's
     ruling, the plan text (from `plan.md`) it collides with, and the fix history from the report
     file. `reviewAndFix`'s `breakerBlockerPrompt` does this and returns `status: 'BLOCKED'`.
  2. **Routes through the same `handleBlocker`/triage path as every other blocker trigger** (see
     the pipeline call site and "The blocker-bead path" below) rather than `mergePrompt` — even a
     breaker-cap BLOCKED gets one triage RESOLVE-vs-ESCALATE pass, the same as a self-filed or
     merge-failure blocker; a RESOLVE here is a real (if less likely) escape from the cap.
  3. **Appends the ledger line and quarantines only once `handleBlocker` reaches an ESCALATE
     verdict** (first-time or bounced-second-RESOLVE) — `Task <N> (<bead id>): BLOCKED — <reason>`,
     SKILL.md's line shape, with the ordinal/bead-id pairing "Workspace and ledger" describes. A
     RESOLVE verdict instead appends a `pending retry` line and leaves the task off `escalated`
     for one bounded re-attempt (see "The blocker-bead path"). Either way the task's branch and
     worktree are left in place, never merged, while the coordinator loop continues with every
     other ready task.

Only the load-bearing exit's *destination* is autonomous-mode-specific — a blocker bead the triage
agent will pick up, not a frozen run. The adjudication call itself (PARK vs BLOCKED) is SDD's own
rubric, dispatched rather than performed inline, in both modes.

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
  itself), a merge that fails its one auto-resolve attempt (the merge agent files the bead), a
  fix-loop breaker tripping on a load-bearing finding at round 5 (see "The breaker, autonomous
  variant" — the coordinator files the bead in this case, since the finding surfaced at
  adjudication, not inside the implementer or merge agent), or the planner leaving a ready id
  unmapped this round (`unplannedBlockerPrompt` — the coordinator files the bead, closing the
  quarantine-only TODO seam Task 2 left in "Plan materialization").
- **Bead shape:** a `bd create` with a `blocker` label, body stating the task id, what failed,
  and what was tried. Confirm flags with `bd create --help`.
- **Triage (opus):** the coordinator dispatches the triage agent (`./triage-prompt.md`) with the
  blocker bead + the task's `plan.md` section + the relevant spec excerpt. It returns exactly one
  of:
  - `RESOLVE: <clarification>` → the coordinator re-dispatches the task with that clarification
    added to its context (next round). Use only when the answer is genuinely derivable from the
    existing plan/beads. **Bounded to one retry per id** (`pendingRetry`, tracked in
    `handleBlocker`): if the *same* id triggers the blocker-bead path again after a RESOLVE — the
    clarification didn't fix it — the second occurrence is treated as `ESCALATE` regardless of
    what this round's triage verdict says, so a bad clarification can spin at most one extra round
    before it quarantines, never indefinitely. This also closes I6: an id parked in `escalated`
    permanently is filtered out of every future `bd ready` batch and guarantees the round-based
    no-progress guard sees real termination, where an unbounded RESOLVE would not.
  - `ESCALATE: <summary + decision needed>` → escalation (below).

## Escalation = notify + quarantine + continue

On `ESCALATE`, the run **does not freeze**:

1. **Notify** the user immediately. From a background workflow, prefer a dispatched notify agent
   (if `PushNotification` / an MCP messaging tool is available) and always `log()` the escalation
   so it surfaces in `/workflows` and the completion notification.
2. **Quarantine** — leave the blocker bead open. The blocked task stays open, and its dependents
   remain unready in beads automatically, so they are skipped without extra bookkeeping.
3. **Continue** — keep driving every other ready task to completion.

When the ready set finally drains, the run ends and reports: tasks completed, quarantined
subtrees (`escalated`), and tasks mid-retry (`pendingRetry` — RESOLVEd once, not yet re-completed
or re-blocked; see the bounded-retry note above). The user resolves the blockers and **re-invokes
the coordinator**, which picks up the now-ready work — this is now actually true of the code, not
just this paragraph's prose (fix-round-1, review): the Resume phase no longer reconstructs
`escalated` from the ledger's `BLOCKED` lines (see "Resume behavior" under "Workspace and ledger"),
so a fixed blocker's task is no longer permanently filtered out of every future `bd ready` batch.

## Finish

When the loop ends (and at least some work landed), dispatch the **final whole-epic review
(opus)** against the integration branch — same package discipline as SKILL.md's "Final Review"
(`scripts/review-package PLAN_FILE MERGE_BASE HEAD`, pointed at each completion line's
parked-with-a-ruling variant — see "Workspace and ledger" above: there is no separate parked LINE
KIND, only the normal `complete` line's own variant — so it can triage what must be fixed before
merge). What happens after that review is **conditional on who owns the finish hand-off**. By
default, hand off to `superpowers:finishing-a-development-branch`, which merges the integration
branch into the user's base branch and cleans up the integration worktree. **When the caller owns
the finish** (e.g. an outer sequencer such as `super-auto`, which still needs this run's ledger and
per-task reports — the only place a PARK ruling's reasoning lives — after this loop ends), the
coordinator does not hand off: it returns the final review's buckets (`completed`, `escalated`,
`pendingRetry`, `parked`, `stalled`, `review`) to the caller and stops, leaving the integration
worktree, its branch, and its ledger intact; the caller decides if and when to invoke
`finishing-a-development-branch` itself. **Not implemented, as of
this doc: "pointed at the ledger's deferred-minor notes."** No ledger line kind this script's
`ledgerLine()` ever writes produces a "deferred-minor" note, and no call site emits one — see
"Known limitations" below. Read this section's own final-review dispatch as pointing the reviewer
at the parked-ruling lines only, not at deferred-minor notes that do not exist yet.

## Known limitations

This section lists what ships **unfixed**, by decision. A future maintainer should read it before
assuming any of these already work. Resolved items are not listed here — they moved to "Resolved in
this branch" below, which exists for a narrower reason: each one was a place where the prose said
something the code did not do, and the risk a maintainer reintroduces it outlives the correction.

1. **Duplicate blocker beads on restart.** Blocker beads are filed with a `blocker` label and no
   dependency edge, and nothing in this script deduplicates them against an existing open blocker
   bead for the same task id. Each re-invocation of a still-blocked task that reaches the
   blocker-bead path again files a **fresh** bead and re-runs `notifyPrompt`/`recordClarificationPrompt`
   — a restart can leave more than one open blocker bead pointing at the same stuck task, and
   re-notify for something already notified. Compounding this: this document's "Resume behavior"
   section (above) used to claim a restart costs exactly "one wasted pipeline pass" on a
   still-BLOCKED id — corrected in this fix round to "up to two," because that figure was an
   undercount. `pendingRetry` (the only ledger-reconstructed state that bounds a RESOLVE to one
   retry — see "Resume behavior" above) is never seeded from a ledger's `BLOCKED` last line, only
   from a `pending retry` one. So the first blocker-path visit of a NEW run for an id whose *last*
   ledger line was `BLOCKED` is treated by `handleBlocker` as a first-time RESOLVE candidate (since
   `pendingRetry.has(id)` is false), not as an already-ESCALATEd id — even though, historically, it
   already got a full triage verdict before. The real cost of resuming a still-genuinely-blocked id
   is therefore **up to two** full pipeline passes (one consuming the fresh RESOLVE slot, a second
   before the bounced-RESOLVE rule quarantines it for good), plus a duplicate blocker bead and a
   duplicate notification for each pass that reaches ESCALATE. This is compounded further by the
   `ledger-append` fire-and-forget limitation documented under "Resume behavior" above (see
   "Workspace and ledger," `:345-363`): `ledger-append` is the *only* mechanism by which a restart
   recovers `parked`/`pendingRetry` at all, and its schema-less, fire-and-forget dispatch is never
   inspected for success — so a silently-lost `pending retry` line does not just cost this item's
   "up to two passes," it can reset `pendingRetry` for that id entirely and let a bad clarification
   spin for more than one extra round after a restart.
2. **`completed` and `parked` are plain arrays, not Sets.** `completed.push(id)` at the merge gate
   runs regardless of whether Resume already seeded `id` into `completed` from a prior run's ledger
   line — so a resumed id that merges again this run is counted twice in `completed` (and, if it
   was previously `parked`, its ruling line is effectively double-recorded in spirit even though the
   ledger append itself only happens once per genuine merge). Worse: a resumed-`complete` id whose
   merge fails THIS run's rebase/test attempt goes through `handleBlocker` and lands in `escalated`
   — while it is already sitting in `completed` from Resume's reconstruction (Resume pushes onto
   `completed`/`parked` for *any* `complete`-kind last line, without regard to what happens to the
   id later in this same run). The result is an id that is simultaneously in `completed` and in
   `escalated`, breaking the "exactly one of merged / quarantined / pending-retry / parked" invariant
   the dryRun section (see "What these three runs collectively prove") asserts holds for every task.
   Deduplicating via `Set` semantics (or filtering `escalated`/`pendingRetry` pushes against
   `completed`, or vice versa) is future work, not attempted in this round.
3. **The workspace-divergence guard (Plan phase) accepts planning from a task worktree.** The guard
   (see the Plan-phase call site above) only checks that `plannedDir` equals `workspace` or ends
   with `/${workspace}` — it never checks *which* worktree prefixes that suffix. A planner
   mistakenly dispatched to run inside `taskWorktree(id)` (`.worktrees/<integrationBranch>--task-<id>`)
   instead of `integrationWorktree` would report a `planPath` that still ends with
   `/.superpowers/sdd/<epicId>-plan/<epicId>-plan.md` and would still pass this guard, even though
   `planPrompt`'s own dispatch text explicitly says "do not plan from a task's own worktree" (see
   "Plan materialization"). This splits the plan file from the ledger just as surely as the
   wrong-epic-workspace case this guard exists to catch — the guard was built for the wrong
   dimension of "which directory," not "which worktree."
4. **Finish points the final reviewer at "deferred-minor" ledger notes that nothing writes.** See
   the "Finish" section above, updated in this round to say so directly: no line kind `ledgerLine()`
   produces is a deferred-minor note, and no call site in this script ever asks for one to be
   written. The prose has been corrected to stop promising it; the underlying gap (SDD's Final
   Review wanting a place to read deferred minors from) remains unimplemented.
5. **`short(undefined)` yields `""`.** A merge agent that reports `merged: true` without `head`
   and/or `mergeBase` is schema-valid (neither is `required` on `MERGE` — see that schema's comment
   above) and passes silently; `short()` degrades a missing SHA to an empty string rather than
   throwing, so the resulting ledger line (e.g. `commits abc1234..` or `commits ..def5678`) still
   matches `LEDGER_LINE_RE` and parses as an ordinary `complete` line on a future resume — a
   non-compliant merge dispatch degrades the ledger's commit-range invariant instead of failing
   loud. Hardening this (e.g. asserting both fields are present before building the ledger line, or
   escalating instead of degrading) is future work.

## Resolved in this branch (kept as guardrails)

These were real contradictions between this document and its own script, corrected in place. They
are recorded — not deleted — because each names a specific wrong belief a future editor could
re-adopt from a stale reading. None of them is an open gap.

1. **This document previously contradicted itself on what resume is for**, resolved in this fix
   round (see "Workspace and ledger" and the Resume-phase code comments above — no separate action
   needed here beyond noting it was fixed by clarifying the prose, not the code): stated plainly,
   resume's only dispatch-gating, behavior-affecting reconstruction after the earlier relaxation is
   `pendingRetry`; `completed`/`parked` are otherwise informational (reporting and the no-progress
   guard's baseline). The one behavioral use of resumed `completed` that is easy to miss: the
   Finish-phase final-review gate reads `completed.length` *after* Resume has already seeded it, so
   a re-invocation that lands zero new merges of its own still dispatches the opus whole-epic
   review, solely because an earlier run's completions are recorded in the ledger.
2. **The `sp:` labelling precondition used to be stated nowhere, and the Ready phase trusted it as
   the only signal.** Fixed in this round (see "The coordinator loop" step 1, and `readyPrompt` in
   the script skeleton): the Query step and the dispatched `bd-ready` prompt used to require
   `bd ready --exclude-type=epic --label sp:${epicId}` with nothing anywhere saying that label only
   exists on trees `super-design` created. A hand-made epic, or a **sub-epic** handed to super-code
   directly (whose members carry the *root* epic's `sp:` label, not their own id's), used to yield
   an empty round 1: `ids.length === 0` → the empty-ready-set quarantine exit → `break` → Finish
   reports `completed: 0`, `review: 'no work landed'` — indistinguishable from a legitimate
   quarantine-drain finish, having done nothing. This was the highest-consequence item in this
   section before the fix: a silent no-op on a plausible, easy-to-hit invocation, not a degraded
   feature. The Ready phase now treats an empty labelled result as inconclusive and falls back to
   the same structural parent-child test `closeEpicsPrompt` already used for epic closure
   (`treeMembershipTest`, shared by both — never the id-prefix convention alone). Confirmed
   independently during the fix cycle that produced this document: this repo's own real epic
   carries no `sp:` labels — exactly the case the fallback now handles.
3. **"Newly-created beads (blocker beads included)" was a promise the design never meant to keep.**
   `:417` and `planPrompt` used to say the planner re-plans "newly-ready or newly-created beads
   (blocker beads included)" on refill, which reads as: a blocker bead gets its own `## Task <N>`
   mapping section and, by the same mechanism as any other mapped bead, could end up handed to
   `scripts/task-brief`/the implementer. That was never reachable as written — every `bd create` in
   this document (`missingBlockerBeadPrompt`, `unplannedBlockerPrompt`, `breakerBlockerPrompt`, and
   the self-filing implementer described under "Dispatching the implementer") files a bead with
   only a `blocker` label, no `--parent`, so the planner's `bd children` tree walk never discovers
   it and it never gets planned at all. Making it reachable the way the old prose implied would
   have been worse than the gap: a blocker bead is an **escalation record about a task**, not a
   work item — its body states the task id, what failed, and what was tried, for a human or the
   triage agent to read, never acceptance criteria for an implementer to satisfy. Fixed in this
   round by correcting the promise, not the code: `:417` and `planPrompt` no longer claim blocker
   beads get planned or given a mapping row. A blocker bead reaches a human or gets acted on
   exclusively through this run's escalation reporting ("Escalation = notify + quarantine +
   continue") and the triage agent's RESOLVE/ESCALATE call on the **original** blocked task (see
   "The blocker-bead path") — never through re-planning, and never through `bd ready`.
4. **The shipped canonical args used to be inconsistent with the ready-query regex.** Fixed in this
   round by retiring the regex, not by changing the args: the canonical scenario's `args` block
   still uses `epicId: "bd-100"` with children `bd-101`…`bd-104` (`:2444` and surrounding) — flat
   siblings, illustrative shorthand for the dryRun's JSON shapes, never a template for a real
   epic's id scheme (real `bd` ids are hierarchical, e.g. `super-plan-2c1.8`). The old dispatched
   grep, `grep -oE 'bd-100[.0-9]*'`, could never match `bd-101` through `bd-104` (no shared prefix
   beyond `bd-10`, and the trailing digit isn't a `.`-delimited suffix of `bd-100`) — the dryRun
   never ran it (`bd-ready` is stubbed in every scenario in this doc), so the mismatch passed
   silently forever, and a maintainer copying these args as a mental model for a real epic would
   have gotten a scoping scheme that yields zero ids against a real `bd ready`. The fix (see the `sp:`-labelling item
   above and `readyPrompt`) removes the grep from the Ready phase entirely rather than reconciling
   it with these ids: the fast path is the bare `--label sp:${epicId}` query, and the structural
   fallback needs no naming convention at all. The canonical args are therefore unchanged **on id
   grounds** — but this round was still a structural edit, so all three baselines were re-run
   against it regardless (`wf_cb63ecb9-492` 31/0, `wf_caf8953e-374` 24/0, `wf_f18d307b-83e` 23/0;
   see each scenario's "Confirmed against the scope-fix script" writeup). Unchanged args are not a
   licence to carry a run-id across a diff. Flagged here so a future reader still doesn't copy the
   flat id scheme as a template for a real epic's ids.
5. **The parallelism prose used to claim the opposite of what the code does.** Fixed in this round
   (see "The coordinator loop," step 3, above) — it previously said "dispatch disjoint-file groups
   concurrently," which reads as *buckets* running concurrently with each other. The code actually
   serializes *across* buckets (the `for (const group of groups)` loop, `:1188`) and only chunks to
   the concurrency cap *within* one bucket (`:1193`); SKILL.md's Parallelism section (`:52`) had it
   right all along, this document did not. Noted here, not just fixed in place, because getting
   this backwards is a genuine write-collision risk for anyone reimplementing the loop from this
   document's prose alone — which the "Annotated script skeleton" section (`:743`) explicitly
   invites a future maintainer to do.
6. **"Illustrative" vs. "canonical" was self-contradictory.** Fixed in this round: the script
   skeleton's own header, in the "Annotated script skeleton" section (`:743`), used to open with
   "Illustrative — adapt names/prompts to the epic," while the dryRun policy section (`:2202`, "If
   any assertion fails, fix the script in this doc") called the same script "canonical." Resolved in
   favor of canonical — it is the only executable artifact in this document, every recorded baseline
   was run against it verbatim, and "adapt names/prompts to the epic" was never actually license to
   restructure it. A maintainer who took the old "illustrative" framing at face value and rewrote
   the script's structure while adapting it to a real epic would silently invalidate every baseline
   recorded in this document without any signal that they had done so.


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

**Canonical, not illustrative** — this is the actual executable script every dryRun baseline in
this document was recorded against (see "Known limitations" below on why the reverse claim used to
appear elsewhere in this doc, and why canonical wins: it is the only executable artifact here and
it carries the baselines). Adapt names/prompts to the epic; the structure itself is not a sketch.
Every `agent()` call carries the real I/O; the script only sequences. `opts.model` is set
explicitly per role, pulled from `config.models`.

```javascript
export const meta = {
  name: 'beads-epic-coordinator',
  description: 'Autonomously drive a beads epic to completion via worktree-isolated, reviewed task pipelines',
  phases: [
    { title: 'Resume' },       // I1: one-time ledger read, before the round loop starts
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
// I-5: fix-loop escalation (rounds 4-5, see reviewAndFix/fixPrompt) is a distinct role from
// `triage` — a capability bump for a stuck implementer, not the RESOLVE/ESCALATE or PARK/BLOCKED
// judgment call `triage` names (see "Coordinator contract"). `fixEscalation` is optional/additive
// to the contract, so this falls back to `triage`'s tier when a caller's config predates the key.
const fixEscalationModel = () => dryRun ? 'haiku' : (config.models.fixEscalation ?? config.models.triage)
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
// I7: per-epic plan filename + workspace pinned to the INTEGRATION worktree. Every epic used to
// name its plan file literally "plan.md", so scripts/sdd-workspace's basename-derived directory
// (".superpowers/sdd/plan/") was the SAME path for every epic in the repo — every epic's ledger
// collided on ".superpowers/sdd/plan/progress.md", defeating the plan-scoping that script exists
// to provide and making the resume rule below (I1) skip a DIFFERENT epic's tasks. Naming the plan
// file per-epic (`${epicId}-plan.md`) gives sdd-workspace's own basename-slug rule a distinct
// directory per epic (".superpowers/sdd/<epicId>-plan/") for free — this is pure string derivation
// replicating that rule, not a second, independent naming scheme; planPrompt passes the planner
// this same `planFileName` value as the parameter planner-prompt.md's template expects (fix-round-1,
// review: the template used to hardcode the literal "plan.md" in eleven places, three inside literal
// shell commands, and planPrompt papered over that with one prose override sentence that directly
// contradicted the template's own "follow it verbatim" comment a few lines below — see planPrompt).
// Fix-round-1 (review): the prior comment here claimed the coordinator's own `workspace` derivation
// and the planner's returned `planned.planPath` "can never drift apart" — that was an overclaim
// stated, not verified: `planned.planPath` comes back from a dispatched agent's own report and was
// never actually compared against `workspace` anywhere in this script. If a planner instance ever
// answers from the template's unparameterized default (a stale planner-prompt.md cached in an
// agent's context, a manual invocation that skips this parameter) the plan/briefs/reports land in
// `.superpowers/sdd/plan/` while `workspace`/`ledgerPath` here still point at
// `.superpowers/sdd/<epicId>-plan/` — silently, in a live run only, and only a dryRun's stubbed
// `planPath` would ever hide it. The Plan-phase call site (below) now asserts the two agree on every
// dispatch and throws loud rather than let them silently split.
// The ledger lives inside that per-epic workspace, anchored to the INTEGRATION worktree — never a
// per-task worktree. taskWorktree(id) above is where an implementer/reviewer/merge agent does its
// own git/bd work for ONE task and may be quarantined or torn down independently; integrationWorktree
// is the one long-lived, single-writer location every task's outcome converges on (the serial merge
// gate and handleBlocker both already run there — see "Serial merge-back"). Every ledger read/append
// dispatch below explicitly runs `In ${integrationWorktree}`, never in a taskWorktree(id): a
// git-ignored scratch directory like `.superpowers/sdd/` is a plain path on disk, not shared across
// worktrees the way tracked, committed files are, so writing it from a task's own worktree would
// produce a second, divergent copy no other stage ever reads.
const planFileName = `${epicId}-plan.md`
const workspace = `.superpowers/sdd/${epicId}-plan`
const ledgerPath = `${workspace}/progress.md`
// I3: config.concurrency bounds per-bucket fan-out. It's read from `args`, documented in the
// contract, SKILL.md, and spec §1 as the thing that stops a bucket of N disjoint-file tasks from
// dispatching N concurrent implementers and N worktrees — but until this fix nothing in the script
// ever read the key, so a 12-task disjoint bucket dispatched all 12 concurrently regardless of its
// value. Applied in the Implement phase's group loop (below): each disjoint-file bucket is chunked
// into sub-batches of at most `cap` ids before being handed to pipeline() — sub-batches serialize
// relative to each other, the same way buckets already did; only a bucket's dispatch SIZE changes.
const cap = Math.max(1, Number(config.concurrency) || 4)

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
// `base` is the commit `scripts/review-package`'s BASE arg needs — captured once, by the brief
// stage. Which commit it actually is now depends on whether the task worktree/branch were freshly
// cut or already existed (Fix 1, final fix round — see taskBriefPrompt for the full reasoning): on
// a FRESH cut it's the pre-implementer commit, right after the worktree is cut and before the
// implementer makes any commit; on a RE-ENTERED worktree (a restart re-dispatching a
// previously-quarantined or previously-completed id — see "Resume behavior") it's
// `git merge-base <integrationBranch> <task branch>` instead, since HEAD there is a prior
// attempt's tip, not a pre-implementer commit. It is NOT required (only the brief stage's dispatch
// actually determines it). Unlike `branch`/`n` (which the coordinator can derive itself from
// `taskWorktree(id)`/`ordinalFor(id)` and never needs to ask any subagent for — see the implement
// pipeline stage), `base` is a git commit SHA the coordinator has no way to compute or verify on
// its own (no shell/git access — see "Key constraint: the script does no I/O"), so the brief
// agent's report is its one legitimate source. Every stage downstream of the brief then carries it
// forward via plain JS assignment rather than re-asking a later subagent to echo it back (see the
// implement pipeline stage and reviewAndFix). Never derive review-package's BASE arg as `HEAD~1`
// instead — that silently drops all but the last commit of a multi-commit task
// (subagent-driven-development/SKILL.md:238). NOTE: `base` feeds `review-package` only, which runs
// BEFORE the merge-gate's rebase — the ledger's own commit-range completion line uses a DIFFERENT,
// post-rebase value instead (`m.mergeBase`, on `MERGE` below), precisely because that rebase moves
// the task branch's history out from under `base` (see the `mergeBase`/`MERGE` comment and the
// merge-gate ledger-append call site — Fix 3, final fix round).
const RESULT  = { type: 'object', properties: { id: {type:'string'}, n: {type:'integer'}, status: {type:'string'}, files: { type: 'array', items: {type:'string'} }, branch: {type:'string'}, base: {type:'string'}, blockerBead: {type:'string'}, finding: {type:'string'} }, required: ['id','status'] }
const TRIAGE  = { type: 'object', properties: { decision: {type:'string'}, detail: {type:'string'} }, required: ['decision','detail'] } // decision: RESOLVE | ESCALATE
// `head` (fix-round-1, review): the pre-merge tip commit of the task branch, captured by the merge
// agent (`git rev-parse <branch>`, same "the coordinator has no shell/git access of its own" reason
// `base` is captured by the brief stage rather than derived here — see the `base` comment above).
// `mergeBase` (Fix 3, final fix round): the POST-REBASE merge-base of the integration branch and
// the task branch — `git merge-base <integrationBranch> <branch>`, captured by the merge agent
// right after the rebase succeeds, before merging. This is deliberately NOT the same value as
// `RESULT.base` above (the pre-rebase commit the brief stage captured): once `mergePrompt` rebases
// the task branch onto the integration branch, `base` is no longer an ancestor of the rebased
// history — so `git log base..head` would name this task's commits PLUS every commit any OTHER
// task merged into the integration branch since this worktree was cut, not just this task's own
// (the canonical four-task scenario's `bd-103` would falsely cite `bd-101`'s and `bd-102`'s commits
// as its own). After a successful rebase, `git merge-base <integrationBranch> <branch>` is exactly
// the integration branch's tip at rebase time — the one point the rebased task branch and the
// integration branch actually share — so `mergeBase..head` names only this task's own commits.
// `base` remains correct, and is kept, for `review-package` (which runs BEFORE this rebase, at the
// task-review stage — see `taskReviewPrompt`): the two fields serve two different call sites at two
// different points in the task's git history and are kept deliberately distinct, not merged into
// one. NOT required, on schema, exactly like `base` on `RESULT` above — a failed merge
// (`merged: false`) has no head/mergeBase worth recording, so neither can be a blanket requirement
// — but the merge agent IS asked (in `mergePrompt`'s dispatch text) to report both whenever
// `merged` is true, since the ledger's completion line now names the commit range
// (`commits <mergeBase7>..<head7>`, upstream SKILL.md's own shape) instead of the bare word
// "merged" (see the merge-gate ledger-append call site and "Workspace and ledger" above). Concern,
// stated here rather than only in a task report: unlike `base` (whose absence would already have
// failed the review/fix-loop stages that depend on it before ever reaching `mergePrompt`), a merge
// agent that reports `merged: true` without `head`/`mergeBase` is schema-valid and passes silently
// — `short(undefined)` (see `short()` in the helpers section) degrades to `""`, so the ledger line
// would read `commits ..<head7>` or `commits <mergeBase7>..` with an empty half instead of failing
// loud. This is not exercised by any dryRun (every `merge:<id>` stub in this doc's scenarios that
// reports `merged:true` includes both `head` and `mergeBase`) and is a real, if narrow, gap: a
// non-compliant merge dispatch degrades the ledger's commit-range invariant instead of erroring —
// see "Known limitations" above.
const MERGE   = { type: 'object', properties: { id:{type:'string'}, merged:{type:'boolean'}, blockerBead:{type:'string'}, head:{type:'string'}, mergeBase:{type:'string'} }, required: ['id','merged'] }
const CLOSE   = { type: 'object', properties: { rootClosed: {type:'boolean'}, closedThisRun: { type: 'array', items: { type: 'string' } } }, required: ['rootClosed','closedThisRun'] }
// I-9: the fix-loop breaker's cap adjudication (PARK vs BLOCKED) — a dispatched INVOCATION of
// SDD's own breaker rubric (see adjudicatePrompt/"The breaker, autonomous variant"), not a
// coordinator-side reimplementation of it. `ruling` carries the adjudicator's reasoning either way
// (ledger note on PARK, blocker-bead body on BLOCKED).
const ADJUDICATE = { type: 'object', properties: { id: {type:'string'}, decision: {type:'string'}, ruling: {type:'string'} }, required: ['id','decision','ruling'] } // decision: PARK | BLOCKED
// I1: the mechanical ledger read/append contract. `read-ledger` returns raw file text (empty
// string if the ledger doesn't exist yet — a fresh epic, or one whose first task hasn't merged or
// blocked yet) so parsing stays pure JS in this script (see the Resume-phase block below) rather
// than asking an agent to interpret ledger semantics — the same "mechanical extraction, judgment
// stays in the script" split groupByDisjointFiles already uses for the planner's file mapping.
// `ledger-append` is schema-less and fire-and-forget, same tier as `notify`/`clarify` (see
// "Schema-less dispatches" in the dryRun policy section below) — the coordinator never reads its
// return value, only whether the call errored.
const LEDGER_TEXT = { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] }
// Fix-round-1 (review, "Strongly suggested structure"): the ONE shape every ledger line writer
// (`ledgerLine()`, in the helpers section below — hoisted, so it's usable above its textual
// definition) and the Resume-phase reader (above) agree on: `Task <ordinal-or-?> (<bead id>): <rest>`.
// Keeping the regex here, beside the other module-level constants the Resume phase reads before
// the helpers section is ever reached, and naming it once, is what stops writer and reader from
// silently drifting the way two independently-hand-rolled string templates could — previously they
// agreed only by coincidence, and no dryRun could catch drift because both sides of the ledger are
// stubbed under `dryRun: true` (see "dryRun policy").
const LEDGER_LINE_RE = /^Task\s+(\S+)\s+\(([^)]+)\):\s*(.*)$/

const escalated = []
const completed = []
// I-9 (review round 3, Critical): tasks the cap adjudicator PARKed — merged despite a known open
// finding the adjudicator ruled non-load-bearing. Before this, `adjudicatePrompt`'s `ruling` was
// written to a `parkRuling` field on the return value that nothing else in the script read: not
// `mergePrompt` (interpolates only `id`/`branch`), not the script's own return value, not `log()`
// — so a PARKed merge was indistinguishable in every report from a task that came back clean on
// the first pass, exactly the "silent discard" `subagent-driven-development/SKILL.md:377` forbids.
// `parked` and the ledger note it maps to (I1: the merge gate's `ledger-append` dispatch, below)
// are what make an overruled finding visible instead. Pushed at the MERGE GATE (the Integrate loop's
// `if (m.merged)` branch), not back in `reviewAndFix` at adjudication time — a PARK ruling only
// carries INTENT (`r.parkRuling`) until the merge that follows it actually succeeds; gating the
// push on `m.merged` is what keeps a task whose merge later fails from ending up in `parked` and
// `escalated`/`pendingRetry` at once (review round 4).
const parked = []
// C-2/I6: ids RESOLVEd once by triage, awaiting their one bounded re-attempt (see handleBlocker
// and "The blocker-bead path"). Membership here is what lets the no-progress guard tell a
// legitimate first-time RESOLVE (real, if temporary, progress) apart from a round that truly did
// nothing — and what bounds a RESOLVE that never actually fixes anything to exactly one extra
// round before `handleBlocker` forces it into `escalated` instead.
const pendingRetry = new Set()
let stalled = false  // I6: set true if a round makes no progress at all — see the guard below

// I1: resume-from-ledger — the skill's stated Core principle (SKILL.md:10) — until this fix, no
// dispatch ever wrote or read this file (see "Workspace and ledger" above): a restarted run had no
// way to tell a completed task from an untouched one, or a quarantined/pending-retry id from a
// fresh one, other than re-querying `bd ready` and guessing (upstream calls a controller losing its
// place this way "the single most expensive failure observed"). Read exactly ONCE, before the round
// loop starts, not per round: the ledger only changes when THIS run appends to it, and every append
// from that point on is already reflected in this process's own in-memory `completed`/`escalated`/
// `parked`/`pendingRetry`. Runs `In ${integrationWorktree}` — the one worktree that owns the ledger
// (see the `ledgerPath` comment above).
phase('Resume')
const ledger = await agent(pick(() => readLedgerPrompt(integrationWorktree, ledgerPath), 'read-ledger'),
  { label: 'read-ledger', phase: 'Resume', schema: LEDGER_TEXT, model: model('mechanical') })
// Pure JS parse — no judgment, no further I/O (the text is already fetched above). Ledger lines are
// append-only, so a bead id can have MORE THAN ONE line over a run's history (e.g. a "pending retry"
// line followed later by a "complete" or "BLOCKED" one) — keep only the LAST line per id, the same
// "last line governs" rule SKILL.md's own resume section states for `fix round` lines ("A bead whose
// last line is a fix round entry is mid-loop... resume the fix loop at round R+1").
const resumed = new Map()  // id -> kind: 'complete' | 'parked' | 'pendingRetry' | 'blockedHistorically'
for (const raw of (ledger.text || '').split('\n')) {
  const line = raw.trim()
  const m = LEDGER_LINE_RE.exec(line)
  if (!m) continue  // the identity header line, a blank line, or noise
  const [, , id, rest] = m
  if (rest.startsWith('complete')) resumed.set(id, rest.includes('parked') ? 'parked' : 'complete')
  else if (rest.startsWith('pending retry')) resumed.set(id, 'pendingRetry')
  else if (rest.startsWith('BLOCKED')) resumed.set(id, 'blockedHistorically')
  // else: a `fix round <R>/5` line (mid-loop) — not a terminal state this coordinator's resume
  // reconstructs into a top-level list; the id simply isn't marked done/quarantined/pending here,
  // so the next `bd ready` surfaces it again and it re-enters the pipeline (re-running the fix loop
  // from round 1 rather than resuming mid-round — a known, coarser-grained resume than SKILL.md's
  // own round-R+1 resume, and out of scope for this fix: no dispatch here can resume a fix loop
  // whose original implementer's live context is already gone).
}
let blockedHistoricallyCount = 0
for (const [id, kind] of resumed) {
  if (kind === 'complete') completed.push(id)
  else if (kind === 'parked') { completed.push(id); parked.push(id) }
  else if (kind === 'pendingRetry') pendingRetry.add(id)
  else if (kind === 'blockedHistorically') blockedHistoricallyCount++
  // Fix-round-1 (review): a `BLOCKED` line is deliberately NOT folded into `escalated` here. It
  // used to be — but that made every invocation, crash-restart or deliberate re-invoke alike,
  // re-seed `escalated` from every BLOCKED line the ledger has EVER recorded, with no line kind
  // that ever clears one. The doc's own recovery contract ("Escalation = notify + quarantine +
  // continue": "The user resolves the blockers and re-invokes the coordinator, which picks up the
  // now-ready work") requires a fixed blocker's task to be re-dispatchable on the very next
  // invocation — permanently filtering it out of `ids` (below) made that impossible short of
  // hand-editing progress.md, which nothing documents or supports. `escalated` still does its job
  // WITHIN a single run (handleBlocker pushes onto it live, and that's what the `ids` filter below
  // actually needs to prevent an immediate re-dispatch loop this same run — see "The blocker-bead
  // path"): what's removed is only the RESUME-time reconstruction of it from old ledger lines.
  // The cost: a restart re-attempts a still-genuinely-blocked task's full pipeline up to TWICE
  // (not once — see "Known limitations" above for why `pendingRetry` isn't seeded from a `BLOCKED`
  // last line, which is what lets the first blocker-path visit of a new run consume a fresh
  // first-time-RESOLVE slot before `handleBlocker` re-quarantines it) before it settles back into
  // `escalated` (live) for the rest of this run — wasteful, exactly like the pre-existing-by-design
  // cost of `completed`'s own resume relaxation below, but self-healing, not a permanent deadlock.
  // STATED PLAINLY (resolving a contradiction a prior revision of this doc carried — this very
  // comment used to end with "Resume's job is to avoid redoing MERGED work," directly contradicting
  // "Resume behavior"'s own prose a few lines above it, which calls `completed`/`parked` "reporting
  // and the no-progress guard's baseline only"): after this relaxation, resume's ONE dispatch-gating,
  // behavior-affecting output is `pendingRetry` (C-2's one-bounded-retry check). `completed` and
  // `parked` are otherwise purely informational — `bd ready` alone is what actually prevents
  // redoing merged work, by excluding a genuinely-closed bead from its own output, with or without
  // this script's resume reconstruction. The one exception, easy to miss: a nonzero *resumed*
  // `completed.length` still changes behavior at Finish (below) — it makes the opus
  // `final-review` dispatch even on a re-invocation whose OWN rounds land zero new merges, since
  // that gate reads `completed.length` after Resume has already seeded it from prior-run ledger
  // lines, not only from this run's own `completed.push` calls.
}
if (resumed.size) log(`resume: reconstructed from ${ledgerPath} — ${completed.length} complete (${parked.length} parked), ${pendingRetry.size} pending retry, ${blockedHistoricallyCount} previously-BLOCKED id(s) found (not re-quarantined — each gets a fresh attempt this run; see the resume-reconstruction comment above)`)

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
    // MECHANICAL rule-following, not judgment (same tier as closeEpicsPrompt): a fast labelled
    // query, with a structural fallback when it comes up empty — never a bare echo trusted alone
    // anymore. See "Resolved in this branch" (the `sp:`-labelling and canonical-args items) for why the label-only query used to be
    // treated as authoritative, and `readyPrompt`'s own comment for the fallback mechanics.
    pick(() => readyPrompt(epicId), 'bd-ready'),
    { label: 'bd-ready', phase: 'Ready', schema: READY, model: model('mechanical') })
  // Fix-round-1 (review): `!completed.includes(id)` used to also gate this filter, as
  // "defense-in-depth" against a ready id that was recorded `complete` on the ledger but never
  // actually got `bd close`d (e.g. the run crashed between the merge and the close inside
  // `mergePrompt`'s single dispatch). That reasoning was backwards: `bd ready` is the one authority
  // that actually knows whether the bead is closed — a task whose `bd close` genuinely succeeded is
  // already excluded by `bd ready` itself, making the `completed` check a no-op precisely in the
  // case it was meant to help. In the case it was meant to catch (merge landed, `bd close` failed),
  // filtering by `completed` instead makes the epic PERMANENTLY unclosable: the bead never closes on
  // its own, nothing else in this script closes a leaf bead, and every future round drops the id
  // before it ever reaches `mergePrompt` again. Before this filter existed, that id was simply
  // re-dispatched: the worktree's already-merged content makes the re-run a no-op review/merge that
  // succeeds and actually calls `bd close` this time — wasteful (one redundant pipeline pass) but
  // self-healing, the same trade this fix makes for `escalated` above. `completed`/`parked` (from
  // the Resume-phase reconstruction above) are kept for REPORTING and the no-progress guard's
  // baseline only, never for this filter. `pendingRetry` ids were never filtered here either —
  // they're due their one bounded re-attempt (see "The blocker-bead path"), which is the entire
  // point of a RESOLVE verdict. `escalated` (live, this-run-only after the fix above) is the one
  // list still legitimately gating dispatch, since it's what stops an immediate re-dispatch loop
  // for a task this same run already quarantined.
  const ids = (ready?.ids ?? []).filter(id => !escalated.includes(id))
  // Quarantine exit: the root isn't closed (checked above) but nothing is ready — remaining
  // work is blocked/escalated. Not a clean finish; report below distinguishes the two cases.
  if (ids.length === 0) break
  // I6/C-2: snapshot before this round's Plan/Implement/Integrate work so the no-progress guard
  // below (after Integrate) can tell whether THIS round moved anything forward. Captured here,
  // before the unplannedIds quarantine below can touch `escalated`/`pendingRetry`, so that
  // quarantine (or a first-time RESOLVE) counts as progress too — not just a later
  // Integrate-phase escalation.
  const completedBefore = completed.length
  const escalatedBefore = escalated.length
  const pendingRetryBefore = pendingRetry.size

  // Plan materialization — once per epic, append-only on refill (see "Plan materialization").
  // scripts/sdd-workspace and scripts/task-brief need PLAN_FILE with ## Task <N> headings keyed
  // by sequential integer ordinal (task-brief's regex requires a leading digit — a bead id like
  // "bd-20" never matches); beads has no such file, so the planner (opus) is the bridge and
  // returns the ordinal<->bead-id mapping alongside the plan path.
  phase('Plan')
  const planned = await agent(pick(() => planPrompt(epicId, ids, planFileName), 'plan'),
    { label: 'plan', phase: 'Plan', model: model('planner'), schema: PLANNED })
  // Fix-round-1 (review): `planned.planPath` is the planner AGENT's own report of where it wrote
  // the plan file — it was never checked against `workspace` (derived above by an independent,
  // purely-string rule) anywhere in this script, despite the removed comment near `workspace`
  // above once claiming the two "can never drift apart." If the planner ever answers from
  // planner-prompt.md's unparameterized literal-"plan.md" default instead of the `planFileName`
  // this round's `planPrompt` dispatch supplies, the plan/briefs/reports land in
  // `.superpowers/sdd/plan/` while the ledger this run reads/writes stays at `workspace`
  // (`.superpowers/sdd/${epicId}-plan/`) — colliding across epics exactly the way I7 exists to
  // prevent, silently, in a live run only (a dryRun's `plan` stub always returns whatever literal
  // path the args hardcode, so this divergence is unreachable under `dryRun: true` by construction
  // — this assertion is a live-run-only guard, like the rest of this comment's claim once was).
  // Checked on every Plan dispatch, not just the epic's first: a refill-round planner answering
  // from a different workspace would be just as broken. Fail loud rather than let the two paths
  // silently split — same "validate and fail fast" discipline as the `epicId`/`integrationBranch`/
  // `config` check on line 1 (see "Authoring pitfalls"). This is deliberately a hard `throw`, not a
  // blocker-bead escalation: a workspace divergence is a whole-epic misconfiguration (every task's
  // brief/report path is affected, not one task's), so there is no per-task recovery to route it
  // through — do not "fix" this into `handleBlocker` later; that would quarantine one task while
  // every other task keeps writing into a split workspace.
  //
  // Fix-round-1-followup (review, caught by an actual dryRun run): the FIRST version of this check
  // compared `plannedDir` against `workspace` for EXACT STRING EQUALITY — and fired on every
  // correct run, including the canonical dryRun, never once catching a real divergence. `workspace`
  // is a repo-root-relative constant, but `planPrompt` (below) explicitly dispatches the planner
  // to work "in the integration worktree" (see "Workspace and ledger"), and `scripts/sdd-workspace`
  // resolves its canonicalized path against `git rev-parse --show-toplevel` of the INVOKING cwd —
  // which, inside a worktree, is that worktree's own root, never the main repo's. A CORRECT planner
  // therefore legitimately reports a path prefixed by the integration worktree (e.g.
  // `.worktrees/<integrationBranch>/.superpowers/sdd/<epicId>-plan/<epicId>-plan.md`, or an
  // absolute path with the same shape in a real run), which can never be byte-identical to the bare
  // `workspace` string. The check now asserts what actually matters — that `plannedDir` RESOLVES TO
  // this epic's workspace — not that the two strings match exactly: `plannedDir` must equal
  // `workspace` outright (the unusual case of a planner already running from the repo root) OR end
  // with `/${workspace}` (the integration-worktree-prefixed case `planPrompt` actually produces).
  // Anchored on that leading `/`: the matched suffix is the FULL `.superpowers/sdd/<epicId>-plan`
  // segment, not a bare substring of `epicId`, so a different epic id that happens to share this
  // one's tail as raw text (e.g. epicId `100` vs `bd-100`) can't accidentally satisfy it — the
  // character immediately before the matched segment must be a path separator, which only a
  // genuine `.superpowers/sdd/` directory boundary provides. Trailing slashes are stripped from
  // `plannedDir` before comparing, since a planner could report either form.
  const plannedDir = planned.planPath.replace(/\/[^/]*$/, '').replace(/\/+$/, '')
  const workspaceSuffix = `/${workspace}`
  if (plannedDir !== workspace && !plannedDir.endsWith(workspaceSuffix)) {
    throw new Error(`workspace divergence: planner reported planPath "${planned.planPath}" (directory "${plannedDir}"), which does not resolve to this coordinator's workspace "${workspace}" (expected it to equal that path, or end with "${workspaceSuffix}"). Refusing to continue — the plan file and the ledger would silently split across two directories. Check that planner-prompt.md's plan-file-name parameter was actually honored by this dispatch.`)
  }
  const ordinalFor = id => planned.mapping.find(m => m.id === id)?.n

  // planner-prompt.md permits leaving a genuinely unplannable bead unmapped (its "Your Job" step
  // 4: BLOCKED, no mapping row, no ## Task <N> section). If such an id is in this round's `ids`
  // and reaches groupByDisjointFiles/taskBriefPrompt anyway, ordinalFor(id) is undefined and
  // `scripts/task-brief <plan> undefined` fails the whole round — the same crash C5 fixed,
  // through a different door. Filter to ids the planner actually mapped before grouping/dispatch;
  // quarantine the rest explicitly (same `escalated` list "Escalation = notify + quarantine +
  // continue" uses) rather than letting them fail silently downstream.
  // Closes the TODO seam Task 2 left here: route each unmapped id through the SAME blocker-bead +
  // triage flow as every other blocker trigger (see "The blocker-bead path"), instead of a bare
  // quarantine — a `RESOLVE` verdict (e.g. "re-plan with this clarification") gets a real chance
  // next round; only an `ESCALATE` actually quarantines (handleBlocker's own logic, unchanged).
  const plannedIds = ids.filter(id => ordinalFor(id) !== undefined)
  const unplannedIds = ids.filter(id => ordinalFor(id) === undefined)
  if (unplannedIds.length) {
    log('plan: ' + unplannedIds.length + ' id(s) left unmapped this round by the planner (BLOCKED, no plan.md section) — routing through the blocker-bead path: ' + JSON.stringify(unplannedIds))
    for (const id of unplannedIds) {
      const bead = await agent(pick(() => unplannedBlockerPrompt(id, epicId), `unplanned-blocker:${id}`),
        { label: `unplanned-blocker:${id}`, phase: 'Plan', model: model('mechanical'), schema: RESULT })
      await handleBlocker({ id, blockerBead: bead.blockerBead }, planned.planPath)
    }
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
   // I3: chunk each bucket to `cap` before dispatch — see the `cap` comment above. A bucket larger
   // than `cap` (e.g. 12 mutually disjoint-file ids under a concurrency cap of 4) still runs to
   // completion, just as 3 sequential sub-batches of ≤4 concurrent siblings each, instead of 12
   // concurrent implementers/worktrees at once. `chunk(group, cap)` is pure JS, no I/O.
   for (const sub of chunk(group, cap)) {
    const groupResults = await pipeline(sub,
      id  => agent(pick(() => taskBriefPrompt(planned.planPath, ordinalFor(id), id, taskWorktree(id), integrationBranch), `brief:${id}`), { label: `brief:${id}`,   phase: 'Implement', model: model('mechanical'), schema: RESULT }),
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
      // I-8: symmetric guard at the brief hop. A brief that reports BLOCKED (task-brief's "task
      // not found" failure) must not be handed to the implementer — dispatching against a brief
      // that was never produced is nonsensical, and it's exactly the path C4's "no path reaches
      // mergePrompt with a status other than a clean review result" assertion didn't cover. Pass
      // the BLOCKED brief straight through with `n`/`branch` stamped, same as every other hop; a
      // brief failure never self-files a blocker bead the way implementPrompt's BLOCKED case does,
      // but it doesn't need to — see the I-7 note on `handleBlocker` below.
      async br => {
        if (br.status === 'BLOCKED') return { ...br, n: ordinalFor(br.id), branch: taskWorktree(br.id) }
        const im = await agent(pick(() => implementPrompt(br, integrationBranch), `implement:${br.id}`), { label: `impl:${br.id}`, phase: 'Implement', model: model('implementer'), schema: RESULT })
        return { ...im, n: ordinalFor(br.id), branch: taskWorktree(br.id), base: br.base }
      },
      // C4: guard the review stage on the incoming status. Without this, an implementer's own
      // BLOCKED (self-filed bead, see implementPrompt) gets handed to reviewAndFix anyway, whose
      // CLEAN/NEEDS_FIX verdict overwrites `status` and erases BLOCKED before the Integrate stage's
      // `if (r.status === 'BLOCKED')` check ever sees it — routing blocked work to `mergePrompt`.
      // Skip review entirely and pass the implementer's result straight through unchanged. Review
      // round 3 (Important, I-7): this used to also fall back to `missingBlockerBeadPrompt` right
      // here when `im.blockerBead` was missing — but that only covered THIS one hop of blocker
      // entry. `handleBlocker` (below) is the single place all blocker-path entries converge — the
      // implementer/brief-BLOCKED case via the Integrate loop's `if (r.status === 'BLOCKED')`
      // branch, the breaker cap's adjudicated BLOCKED, a failed merge, AND an unmapped planner id —
      // so the fallback is hoisted there instead, covering all of them with one check instead of
      // duplicating it at every call site (see `handleBlocker`'s first lines).
      im => im.status === 'BLOCKED' ? im : reviewAndFix(im, planned.planPath),
    )
    results.push(...groupResults)
   }
  }

  // SERIAL merge gate — outside any parallel/pipeline stage so only one merge touches the
  // integration branch at a time, in dependency order. Runs in the integration worktree. Merges
  // close leaf tasks only (bd close <id>); epic closure happens at the top of the next iteration.
  phase('Integrate')
  for (const r of results.filter(Boolean)) {
    if (r.status === 'BLOCKED') { await handleBlocker(r, planned.planPath); continue }
    const m = await agent(pick(() => mergePrompt(r, integrationBranch, integrationWorktree), `merge:${r.id}`),
      { label: `merge:${r.id}`, phase: 'Integrate', model: model('reviewer'), schema: MERGE })
    if (m.merged) {
      completed.push(r.id)
      pendingRetry.delete(r.id)  // a RESOLVEd id that then succeeds clears its retry-pending mark (C-2)
      // Review round 4 (Important): `parked` is recorded HERE, alongside `completed.push`, not back
      // in `reviewAndFix` at adjudication time — `r.parkRuling` (set by the PARK branch there) is
      // only a carried-forward INTENT until the merge that just succeeded confirms it. Had this
      // pushed unconditionally at adjudication time instead, a PARKed task whose merge later failed
      // its bounded auto-resolve would end up in `parked` AND `escalated`/`pendingRetry`
      // simultaneously, absent from `completed` — contradicting "a parked task IS a completed one"
      // below. Gating on `m.merged` makes that invariant hold by construction.
      if (r.parkRuling) { parked.push(r.id); log(`PARKED ${r.id}: ${r.parkRuling} (open finding, merged anyway: ${r.finding})`) }
      // I1: mechanical dispatch appends the completion line — SKILL.md's own line shape
      // (`Task <N>: complete (...)`), with the ordinal/bead-id pairing "Workspace and ledger"
      // specifies. A PARK ruling gets upstream's `<K> parked` variant of that same line (K is
      // always 1 here: this coordinator's schema carries the survived finding as one bundled
      // string, never a per-finding list — see `RESULT`'s `finding` comment) instead of a second,
      // separate ledger entry — "a parked task IS a completed one" holds in the ledger too, not
      // only in the return value.
      // Fix-round-1 (review): the completion line now names a commit range instead of the bare
      // word "merged" upstream SKILL.md specifies. Fix 3 (final fix round, Important): that range
      // is `m.mergeBase`..`m.head` — BOTH captured by the merge dispatch, post-rebase — never
      // `r.base` (the brief stage's PRE-rebase commit). `r.base` is only valid ancestry before
      // `mergePrompt`'s rebase runs; after it, `git log r.base..m.head` would include every commit
      // any OTHER task merged into the integration branch since this worktree was cut, not just
      // this task's own (see the `mergeBase`/`MERGE` schema comment above for the full reasoning
      // and the four-task canonical scenario this would otherwise break). The parked variant still
      // also carries `r.finding` alongside the ruling — before that fix a reader learned a finding
      // was overruled but never what it was, the exact silent discard upstream SKILL.md:377
      // forbids. Built through `ledgerLine()` (below), the single writer helper the Resume-phase
      // reader's `LEDGER_LINE_RE` (above) is kept in sync with, which also collapses any embedded
      // newlines in the interpolated free text (`r.parkRuling`/`r.finding` are agent-authored and
      // could in principle be multi-line) to the one-line-per-outcome shape the reader depends on.
      await agent(pick(() => ledgerAppendPrompt(integrationWorktree, ledgerPath, planFileName,
          r.parkRuling
            ? ledgerLine(r.n, r.id, `complete (commits ${short(m.mergeBase)}..${short(m.head)}, 1 parked — ruling: ${r.parkRuling} — finding: ${r.finding})`)
            : ledgerLine(r.n, r.id, `complete (commits ${short(m.mergeBase)}..${short(m.head)}, review clean)`)),
        `ledger-append:${r.id}`), { label: `ledger-append:${r.id}`, phase: 'Integrate', model: model('mechanical') })
    }
    // `n: r.n` carried forward here so a failed-merge blocker's eventual ledger line (in
    // handleBlocker) can still cite the plan ordinal — `r` already carries it (stamped by
    // reviewAndFix/the pipeline call site); the bare object built here previously dropped it.
    else await handleBlocker({ id: r.id, n: r.n, blockerBead: m.blockerBead }, planned.planPath)
  }

  // I6/C-2: no-progress guard. A round that made no forward progress at all — no task merged, no
  // epic closed, no id newly quarantined, AND no id newly RESOLVEd-pending-retry — stops rather
  // than spins. `pendingRetry` growing counts as progress in its own right (C-2): `handleBlocker`
  // deliberately does NOT push a first-time RESOLVE onto `escalated`, since the whole point is to
  // give the task one real re-attempt next round — without counting that as progress here, this
  // guard would trip after round 1 of a legitimate RESOLVE and never let the re-attempt happen at
  // all. A grown `escalated` (ESCALATE, an unmapped-id blocker bead, a breaker-cap BLOCKED, or a
  // SECOND RESOLVE for an id already in `pendingRetry` — see handleBlocker's one-retry bound)
  // already guarantees eventual termination on its own via the `escalated` filter on `ids` above,
  // so it counts as progress here too, not just merges/closures.
  // `closed.closedThisRun` is this iteration's Close pass, computed at the TOP of this same
  // iteration — it reflects the PRIOR round's merges (Close runs before Ready/Implement/Integrate
  // every iteration), one round lagged from the other three signals' own before/after snapshot.
  // That lag doesn't weaken the guard: a run making genuine progress always has at least one of
  // the four signals non-empty in any given round once work starts landing; a run making none of
  // the four, in any round, has nothing left that will change next round's outcome either.
  if (completed.length === completedBefore && closed.closedThisRun.length === 0 &&
      escalated.length === escalatedBefore && pendingRetry.size === pendingRetryBefore) {
    stalled = true
    log(`STALLED: round completed 0 tasks, closed 0 epics, quarantined 0 new ids, and RESOLVEd 0 new ids — stopping to avoid an infinite loop. Still-ready ids this round: ${JSON.stringify(ids)}`)
    break
  }
}

phase('Finish')
log(`Completed: ${completed.length}. Escalated: ${escalated.length}. Pending retry: ${pendingRetry.size}. Parked (merged with an overruled finding): ${parked.length}.${stalled ? ' Stalled: true — see the STALLED log line above.' : ''}`)
const review = completed.length
  ? await agent(pick(() => `Final whole-epic review of integration branch ${integrationBranch} for epic ${epicId}.`, 'final-review'),
      { label: 'final-review', phase: 'Finish', model: model('finalReview') })
  : 'no work landed'
return { completed, escalated, pendingRetry: [...pendingRetry], parked, stalled, review }

// --- helpers ---
function treeMembershipTest(epicId) {
  // Shared, single source for the one membership test this document uses in two places: the
  // epic-closure fixpoint (closeEpicsPrompt, below) and the Ready phase's structural fallback
  // (readyPrompt, below) — see "Resolved in this branch" (the `sp:`-labelling and canonical-args items) on why the Ready phase needed
  // this test too, not just closeEpicsPrompt. Described once, reused verbatim, so the two phases
  // can never silently drift onto different tree-membership rules.
  return `      - IDENTITY: if id === "${epicId}", it is IN-TREE. Stop here — do not attempt a parent walk on the root; the root has no parent-child dependency entry to find (verified: \`bd show ${epicId} --json\` shows an empty or root-parentless \`dependencies\` array for the root itself), so a walk would wrongly conclude OUT-OF-TREE.
      - PARENT-CHILD WALK (only for id !== "${epicId}"): run \`bd show <id> --json\` and read its \`dependencies\` array for an entry with \`dependency_type: "parent-child"\` — that entry's id is <id>'s parent. If found, repeat the same test (identity check, then walk) on that parent id. If no such entry exists and id !== "${epicId}", it is OUT-OF-TREE (you have reached a different tree's root, or an unparented bead, without ever passing through ${epicId}).
      - Worked examples (epicId = "super-plan-2c1"): id "super-plan-2c1" -> identity match -> IN-TREE, no walk. id "super-plan-2c1.8" -> not identity -> bd show shows parent-child entry to "super-plan-2c1" -> that IS epicId -> IN-TREE, one hop. id "super-plan-2c1.3.1" (nested subepic) -> not identity -> parent-child entry to "super-plan-2c1.3" -> not identity, not epicId itself -> recurse: bd show super-plan-2c1.3 --json has a parent-child entry to "super-plan-2c1" -> that IS epicId -> IN-TREE, two hops. id "acme-9" (an unrelated epic's own root) -> not identity -> bd show acme-9 --json has no parent-child entry at all -> OUT-OF-TREE.
      - Bound the walk to a handful of hops (beads trees are shallow); if you somehow exceed ~10 hops without resolving, treat as OUT-OF-TREE and do not close it — err toward leaving an ambiguous id alone.`
}

function readyPrompt(epicId) {
  // FAST PATH: the `sp:` label `super-design` stamps on every bead it creates lets a single scoped
  // query answer this in one shot, cheaper than the structural fallback below. FIX (Known
  // the `sp:`-labelling and canonical-args items under "Resolved in this branch"): the id-prefix grep this used to pipe through
  // (`grep -oE '${epicId}[.0-9]*'`) is RETIRED as an authority — the canonical-args item found it silently
  // mismatches real hierarchical ids (and this document's own flat illustrative canonical-scenario
  // ids), and it was never anything but a weaker restatement of what `--label` already scopes; it
  // is not run at all anymore, not even as a pre-filter. FALLBACK (the `sp:`-labelling item): an empty
  // labelled result does not mean the tree is empty — the `sp:` label only exists on trees
  // `super-design` created; a hand-made epic, or a sub-epic handed to super-code directly (whose
  // members carry the *root* epic's `sp:` label, not their own id's), always comes up empty above
  // even with real ready work waiting. So an empty fast path falls back to the same structural
  // parent-child test `closeEpicsPrompt` uses for epic closure (`treeMembershipTest`, shared by
  // both) — never the id-prefix convention alone, which a hand-created or nested-subepic bead can
  // violate.
  return `Run \`bd ready --exclude-type=epic --label sp:${epicId}\` and parse the returned ids (do NOT use \`--json\`; do NOT reason about or filter readiness or scope — the flags already exclude epics and out-of-label issues). If it returns at least one id, report those ids verbatim as \`ids\` and stop here — this is the fast path, do not run the fallback below.
If it returns NONE, do not conclude the tree has no ready work: the \`sp:\` label only exists on trees \`super-design\` created — a hand-made epic, or a sub-epic handed to super-code directly (whose members carry the ROOT epic's \`sp:\` label, not their own id's), will always come up empty on the query above even when real ready work is waiting. Fall back to the structural test instead, the same one the epic-closure step uses:
1. Run \`bd ready --exclude-type=epic\` (repo-global — this can return ready work from unrelated epics sharing this repo; that is expected, filtered in step 2 below, not a bug) and parse the returned ids.
2. For each returned id, classify it IN-TREE or OUT-OF-TREE using this test, in priority order — do not skip the identity/walk check even when the id "looks like" it belongs:
${treeMembershipTest(epicId)}
3. Report only the IN-TREE ids from this fallback pass as \`ids\` (empty array if none). Do not start any work.`
}

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
   a. AUTHORITATIVE, checked in this order (same test as the Ready phase's structural fallback —
      see \`treeMembershipTest\`, shared by both):
${treeMembershipTest(epicId)}
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

function planPrompt(epicId, ids, planFileName) {
  // planner (opus), once per epic then append-only — see "Plan materialization". Follows
  // ./planner-prompt.md verbatim (do not paraphrase it here — that template is what carries the
  // filesTouched-in-section-body requirement and the over-declare-when-uncertain policy that
  // makes groupByDisjointFiles' fail-safe bucketing correct); this builder only supplies the
  // per-dispatch variables that template's "Epic" / "Plan file name" / "Beads to plan this round"
  // sections need. Fix-round-1 (review): `planFileName` is now supplied as the value of
  // planner-prompt.md's own "Plan file name" parameter (the template was edited to reference
  // `[plan file name]` throughout instead of hardcoding the literal `plan.md`, including inside its
  // three literal shell-command examples) — this builder no longer overrides the template with a
  // one-sentence naming instruction that contradicted its own "follow it verbatim" contract above;
  // it just fills in the parameter the template now asks for, the same as `epicId`/`ids` below.
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
  return `Working directory: the integration worktree (see "Workspace and ledger" — the same worktree that owns the ledger; do not plan from a task's own worktree). Follow ./planner-prompt.md for epic ${epicId}. Plan file name (the template's "Plan file name" parameter — use this exact name everywhere the template says \`[plan file name]\`, including inside its \`mkdir -p\`/initial-file-write/\`sdd-workspace\` shell-command steps; never the literal \`plan.md\`): \`${planFileName}\` — every epic must use its own plan filename so \`scripts/sdd-workspace ${planFileName}\` resolves to a workspace directory distinct from every other epic's (a shared \`plan.md\` name collides every epic's workspace, including its ledger, on one path; this coordinator also asserts the planner's reported \`planPath\` actually landed in that directory — see the Plan-phase call site). On the FIRST planning round (${planFileName} has no mapping rows yet), independently enumerate every READY AND BLOCKED descendant bead of ${epicId} and plan all of them: run \`bd children ${epicId} --json\` for its direct children, then run \`bd children <id> --json\` on every one of those children whose \`issue_type\` is "epic" to get its children in turn, repeating until no unexpanded epic-typed child remains (\`bd children\` returns direct children of one level only — do NOT use \`bd show ${epicId} --json\`, which reports only dependent/dependency counts, no child ids, since parent-child edges point upward and it cannot read the downward direction). Do not limit round-1 planning to ready ids only, since \`bd ready\` structurally excludes blocked beads. On a REFILL round, plan only newly-ready beads that don't already have a mapping row — never a blocker bead: a blocker bead is an escalation record about a task, not a work item, and is never planned or given a mapping row (see "The blocker-bead path"). This round's confirmed-ready ids (a subset of the planning scope above, not the full scope): ${JSON.stringify(ids)}. Run \`bd show <id> --json\` for every bead you plan this round, for "Beads to plan this round". Report per that template's Report Format: planPath, and mapping as the FULL CUMULATIVE table (every row assigned so far in ${planFileName}, including earlier rounds' rows — never only this round's new ones).`
}

function taskBriefPrompt(planPath, n, id, worktree, integrationBranch) {
  // MECHANICAL: scripts/task-brief owns the awk extraction and brief-file naming (see "Plan
  // materialization" — do not hand-roll this from the mapping table). n must be the plan
  // ordinal, never the bead id (task-brief's heading regex requires a leading digit).
  //
  // Fix 1 (final fix round, Critical): IDEMPOTENT worktree/branch handling. Resume no longer
  // filters a previously-quarantined or previously-completed id out of `ids` forever (see "Resume
  // behavior" below) — such an id is simply re-dispatched, and re-dispatch enters HERE first. Both
  // `worktree` and its branch may already exist from an earlier attempt (a prior BLOCKED/
  // pending-retry pass, or an already-merged task being re-dispatched because its `bd close` never
  // landed last time). `git worktree add [-b]` fails hard on an existing path AND on an existing
  // branch name — so this dispatch must check first and REUSE what's already there, rather than
  // assume a fresh cut and improvise (or error, or self-report BLOCKED) when it isn't. Without this,
  // the self-heal the resume relaxation exists to provide could not actually run: every restart
  // would refail at worktree creation and get re-quarantined, the exact outcome the relaxation was
  // meant to prevent (see "Resume behavior").
  //
  // `base` is captured HERE, and which commit it names now depends on which of the two cases above
  // applies:
  // - FRESH worktree/branch (neither exists yet): `base` is the pre-implementer commit — `git
  //   rev-parse HEAD` right after the worktree is cut and before the implementer makes any commit —
  //   exactly "the commit you recorded before dispatching the implementer" that SKILL.md's "Handle
  //   the report" section requires review-package's BASE to be, instead of `HEAD~1` (which silently
  //   drops all but the last commit of a multi-commit task —
  //   subagent-driven-development/SKILL.md:238).
  // - RE-ENTERED worktree/branch (both already exist): HEAD there is a PRIOR attempt's tip, not a
  //   pre-implementer commit — using it as `base` would truncate `scripts/review-package`'s range
  //   (see `taskReviewPrompt`) to only commits made after this restart, silently dropping the prior
  //   attempt's commits from review even though they still get merged (Fix 2, final fix round; the
  //   same class of defect as the `HEAD~1` mistake just above). `base` must instead be
  //   `git merge-base ${integrationBranch} <the task branch>` — the point where the task branch
  //   actually diverged from the integration branch, which review-package's own BASE..HEAD range
  //   then correctly spans regardless of how many attempts already landed commits on it.
  // The coordinator carries `base` forward from here on (see the implement pipeline stage and
  // reviewAndFix) rather than asking any later subagent to re-derive or echo it. This `base` feeds
  // `review-package` only — the ledger's own commit-range line uses a different, post-rebase value
  // captured later at the merge gate (see the `mergeBase`/`MERGE` comment, Fix 3, final fix round).
  return `Check whether the task worktree at ${worktree} AND a branch for task ${id} already exist (\`git worktree list\` / \`git branch --list\`) — a restart re-dispatching a previously-quarantined or previously-completed id lands here with both already present; that is EXPECTED, not an error. If NEITHER exists: create the task worktree at ${worktree} on a new branch, branched from the epic integration branch ${integrationBranch} (see "Dispatching the implementer") — then, in ${worktree}, run \`git rev-parse HEAD\` and report that as base (the pre-implementer commit). If BOTH already exist: do NOT delete or recreate them — REUSE the existing worktree and branch as-is (do not attempt \`git worktree add\` again, it will fail), and in that worktree run \`git merge-base ${integrationBranch} <the task branch>\` and report that as base instead, since HEAD there is a prior attempt's tip, not a pre-implementer commit. Either way, then run \`scripts/task-brief ${planPath} ${n}\` (in ${worktree}) to (re-)produce the brief file. Report id ${id}, n ${n}, branch ${worktree}, base <the base commit SHA determined above>, and status BRIEFED (or, on the script's "task not found" failure, status BLOCKED).`
}

function implementPrompt(br, integrationBranch) {
  // subagent-driven-development/implementer-prompt.md + the brief path, unmodified — the two
  // autonomous-mode additions (worktree convention, self-filing blocker beads) are supplied as
  // extra dispatch text here, not by editing the prompt file (see "Dispatching the implementer").
  // The report contract deliberately asks for only id/status/files, not n/branch/base: those three
  // are already coordinator-known (from `br`) and are re-stamped onto this call's result in the
  // pipeline call site regardless of what's reported — asking for them here would just invite a
  // second, ignorable source of truth (see the pipeline call site and RESULT's `base` comment).
  return `Follow subagent-driven-development/implementer-prompt.md against the brief for task ${br.id} (n ${br.n}), working in ${br.branch}, branched from integration branch ${integrationBranch}. If BLOCKED after 3 no-progress fix-loops, file the blocker bead yourself (see "The blocker-bead path") — there is no human partner to escalate to mid-task. Report id, status (IMPLEMENTED or BLOCKED), files touched, and — only on BLOCKED — blockerBead with the id of the bead you just filed (handleBlocker's triage dispatch needs it; see the pipeline call site's status guard).`
}

function taskReviewPrompt(im, planPath) {
  // scripts/review-package PLAN_FILE BASE HEAD -> subagent-driven-development/task-reviewer-prompt.md
  // (single reviewer, spec-compliance + quality in one dispatch — the retired two-stage split
  // never applies here). review-package requires all three positional args and exits 2 with fewer
  // than three — it must never be invoked bare. BASE is `im.base`, the base commit the brief stage
  // captured (see taskBriefPrompt for the fresh-vs-re-entered-worktree distinction, Fix 1/2, final
  // fix round) and the coordinator carried forward unchanged since (see the implement pipeline
  // stage) — never `HEAD~1`, which silently drops all but the last commit of a multi-commit task
  // (subagent-driven-development/SKILL.md:238). HEAD is passed literally: run from inside
  // ${im.branch}, where it resolves to that worktree's current tip. The report contract below asks
  // for only id/status/finding, not n/files/branch/base: `reviewAndFix`'s `carried()` re-stamps
  // those four from `im` on every return regardless of what's reported (see `reviewAndFix` above)
  // — this is the C2 fix, since neither this contract nor `reReviewPrompt`'s ever reliably carried
  // `branch`, which is what left `mergePrompt`'s `r.branch` undefined.
  return `In ${im.branch}, run \`scripts/review-package ${planPath} ${im.base} HEAD\` for task ${im.id} (n ${im.n}) and follow subagent-driven-development/task-reviewer-prompt.md over the resulting package. Report id and status CLEAN or NEEDS_FIX — on NEEDS_FIX, put the finding text in the \`finding\` field (fixPrompt builds the fix dispatch from it directly, not from the rest of this result).`
}

function fixPrompt(rv, round) {
  // The fix loop (C3, SKILL.md's "The fix loop"): rounds 1-3 resume the original implementer —
  // its context is intact, it knows the task, the code, and its own choices. Rounds 4-5 dispatch a
  // FRESH implementer on `fixEscalationModel()`'s tier (reviewAndFix passes it via opts.model —
  // this text only needs to say so) with SKILL.md's own framing: a prior implementer attempted the
  // task and didn't resolve it; fresh eyes own it now.
  // The finding text (rv.finding), not the whole RESULT object, is the substance of this prompt —
  // stringifying rv wholesale would hand the implementer {id,n,status,files,branch,base} and no
  // finding to actually fix, since none of RESULT's other fields carry the reviewer's finding text.
  // `rv` here is already `carried()`-stamped by reviewAndFix, so `rv.branch` (used for "the
  // worktree for task X") is real, not an echo this function has to trust the reviewer for.
  // Report contract: id and status only — n/files/branch/base are re-stamped by `carried()` again
  // after this call, same reasoning as taskReviewPrompt above.
  return round <= 3
    ? `Resume the original implementer in the worktree ${rv.branch} for task ${rv.id} (n ${rv.n}), fix round ${round}/5, and address this review finding: ${rv.finding}. Report id and status FIXED.`
    : `A prior implementer attempted task ${rv.id} (n ${rv.n}) ${round - 1} time(s) without resolving the open finding. Dispatch a FRESH implementer in the worktree ${rv.branch} — it owns the task now; read the report file for what was tried, then address this review finding (fix round ${round}/5): ${rv.finding}. Report id and status FIXED.`
}

function reReviewPrompt(fixed) {
  // subagent-driven-development/re-review-prompt.md, scoped to the fix diff only — not a full
  // re-review of the whole task. `fixed` is `carried()`-stamped by reviewAndFix before reaching
  // here, so `fixed.branch` is real (previously this interpolated a plain fixPrompt-agent echo
  // that fixPrompt's own report contract never asked for — the same C2 gap, one hop earlier).
  // C-3 fix: upstream's actual template vocabulary (subagent-driven-development/re-review-prompt.md)
  // is PER-FINDING "ADDRESSED"/"NOT ADDRESSED" with a round verdict, not the bare round-level
  // CLEAN/NEEDS_FIX token this coordinator branches on — a re-reviewer that follows the template
  // literally could report something this coordinator's `rv.status === 'NEEDS_FIX'` check (the
  // pre-fix code) would read as false, exiting the loop with the finding still open and merging it.
  // This file already learned this exact lesson once for `triagePrompt` ("since the coordinator
  // branches on exact string equality against it"); state the same mapping and bare-token
  // requirement explicitly here, and reviewAndFix's loop now also fails CLOSED (loops on anything
  // that isn't literally "CLEAN", rather than looping only on literally "NEEDS_FIX") as a second
  // line of defense against a template-compliant-but-differently-worded report.
  // C-1 fix: also ask for `finding` on NEEDS_FIX. Previously this contract asked for "id and status
  // only" — so from round 2 on, `carried()` had nothing but a stale-or-undefined finding to hand
  // `fixPrompt`/`breakerBlockerPrompt`/`adjudicatePrompt`, and every later round told an
  // implementer to "address this review finding: undefined". reviewAndFix's `carried()` now also
  // keeps the LAST non-empty finding sticky across rounds (`result.finding || lastFinding` — `||`,
  // not `??`: this contract's own "omit or leave it blank" instruction below means a re-reviewer
  // that thinks it's clean but emits a non-"CLEAN" token — the exact case C-3's fail-closed loop
  // exists for — can legitimately report `finding: ""`, and `??` only falls back on null/undefined,
  // not on that empty string) as a second line of defense if a re-reviewer ever omits it, or blanks
  // it, on a genuine NEEDS_FIX-equivalent.
  return `Follow subagent-driven-development/re-review-prompt.md, scoped to the fix diff for task ${fixed.id} (n ${fixed.n}) in ${fixed.branch}. That template's own vocabulary is per-finding "ADDRESSED"/"NOT ADDRESSED" with a round verdict — map it to a single BARE TOKEN this round's overall \`status\`: "CLEAN" if every finding is ADDRESSED, "NEEDS_FIX" if any finding remains open — no other value, no colon, no extra text in that field, since the coordinator branches on exact string equality against it and fails CLOSED (treats anything that isn't literally "CLEAN" as still open) on anything else. Report id, that status token, and — whenever status is NEEDS_FIX — finding with the still-open finding text verbatim (fixPrompt and, at the cap, breakerBlockerPrompt/adjudicatePrompt build their dispatch from this field directly; omit or leave it blank only when status is CLEAN).`
}

function mergePrompt(r, integrationBranch, integrationWorktree) {
  // "Serial merge-back": rebase onto the integration branch, run the test command, merge --no-ff
  // and bd close on success; one bounded auto-resolve attempt on conflict/red, else the blocker path.
  // Fix-round-1 (review): also capture `head` — the rebased task branch's tip commit, right before
  // merging — so the ledger's completion line can name the commit range upstream SKILL.md
  // specifies, instead of the bare word "merged" this coordinator used to write. Captured here, not
  // derived by the coordinator: same "no shell/git access of its own" reasoning as `base` (see the
  // `base`/`RESULT` comment above).
  // Fix 3 (final fix round, Important): also capture `mergeBase` — `git merge-base
  // ${integrationBranch} ${r.branch}`, run right after the rebase succeeds (so it reflects the
  // POST-rebase ancestry) and before merging. `r.base` (the brief stage's pre-rebase commit) is no
  // longer an ancestor of the rebased branch once this rebase runs, so a ledger range built from it
  // would span every commit any OTHER task merged into ${integrationBranch} between this
  // worktree's cut and now, not just this task's own — see the `mergeBase`/`MERGE` schema comment
  // above for the full reasoning. The rebase moves ${r.branch}'s effective base to wherever
  // ${integrationBranch} pointed at when the rebase ran, which is exactly what `git merge-base`
  // recovers.
  return `In ${integrationWorktree}, update ${integrationBranch} and rebase task ${r.id}'s branch ${r.branch} onto it. Run the project test command. If clean: run \`git merge-base ${integrationBranch} ${r.branch}\` to capture the POST-REBASE merge-base (do this before merging, while ${r.branch}'s rebased-but-not-yet-merged history still lets you distinguish it from ${integrationBranch}'s own tip), then run \`git rev-parse ${r.branch}\` to capture the rebased branch's tip commit, merge --no-ff into ${integrationBranch}, run \`bd close ${r.id}\`, and report merged true with head as the tip commit just captured and mergeBase as the merge-base just captured. If the rebase conflicts or tests are red, make one bounded auto-resolve attempt; if that also fails, file a blocker bead (see "The blocker-bead path") and report merged false with its id as blockerBead.`
}

function missingBlockerBeadPrompt(r) {
  // I-7 fallback, hoisted into `handleBlocker`'s first lines (review round 3) so it covers ALL
  // FOUR ways a blocker-path entry can arrive without a bead, not just the implementer/brief hop:
  // implementPrompt asks a self-filing implementer for `blockerBead`, but RESULT doesn't REQUIRE
  // it; a BLOCKED brief (I-8) never had anything to self-file; `MERGE` requires only
  // `['id','merged']`, so a merge agent reporting `{id, merged:false}` with no bead is schema-valid;
  // and `unplannedBlockerPrompt`'s own report could in principle omit it too. Any of these would
  // otherwise reach `triagePrompt(r.id, r.blockerBead)` reading "the blocker bead undefined". File
  // one coordinator-side here instead. `r` may or may not carry `n` (some call sites build a bare
  // `{id, blockerBead}` object) — the dispatch text below tolerates either.
  return `Task ${r.id}${r.n !== undefined ? ` (n ${r.n})` : ''} was reported BLOCKED, but no blocker bead id is available. File one now: run \`bd create\` with a \`blocker\` label (confirm flags with \`bd create --help\`) and a body stating the task id, that it was reported BLOCKED without a bead, and — if the task's report file exists — what was tried. Report id ${r.id}, status BLOCKED, and blockerBead as the newly created bead's id.`
}

function unplannedBlockerPrompt(id, epicId) {
  // Closes the plan-materialization TODO seam Task 2 left behind (see the `unplannedIds` loop
  // above): an id the planner left unmapped this round (planner-prompt.md's "Your Job" step 4 —
  // BLOCKED, no plan.md section) now files a real blocker bead — same shape as every other
  // trigger in "The blocker-bead path" — instead of going straight into `escalated` with no chance
  // at triage's RESOLVE path. MECHANICAL: `bd create` with a fixed shape, not a judgment call —
  // the judgment (RESOLVE vs ESCALATE) is `handleBlocker`'s triage dispatch, downstream of this.
  return `File a blocker bead for task ${id} under epic ${epicId}: run \`bd create\` with a \`blocker\` label (confirm flags with \`bd create --help\`) and a body stating the task id and that the planner left it unmapped this round (BLOCKED — no "## Task <N>" section was written to plan.md for it). Report id ${id}, status BLOCKED, and blockerBead as the newly created bead's id.`
}

function adjudicatePrompt(rv, planPath) {
  // I-9: the governing rule forbids REIMPLEMENTING SDD's rubric, not INVOKING it (see "The
  // breaker, autonomous variant" and SKILL.md's Boundary) — so the cap's park-vs-stop call is a
  // DISPATCHED agent following subagent-driven-development/SKILL.md's "The breaker" section
  // verbatim, not a coordinator-side heuristic. Spec §3.2: "adopt upstream's five-round breaker
  // and its adjudication rules (park with a ruling, or stop on a load-bearing finding)" — both
  // outcomes, not cap-always-blocks.
  // Review round 3 (Important): this prompt used to GLOSS the load-bearing test — "a real defect
  // that would bite downstream" vs "contestable... or nothing downstream depends on it" — and that
  // gloss silently dropped SKILL.md's actual criterion (a later task depends on it, OR it reveals a
  // plan defect). A finding that reveals a plan defect with no CURRENT dependent mapped to PARK
  // under the old gloss and to STOP under the section this prompt claims to follow — the exact
  // reimplementation-not-invocation failure this function exists to avoid. Deleted the gloss
  // entirely; the dispatched agent reads SKILL.md's own wording, not a paraphrase of it. Also added
  // the any-finding-is-load-bearing rule below: `rv.finding` may bundle more than one open item
  // (SDD's re-reviewer adjudicates findings individually; this coordinator's schema carries only
  // one string), and a bundle must not round down to PARK just because some items in it are minor.
  return `Follow subagent-driven-development/SKILL.md's "The breaker" section (inside "The fix loop") to adjudicate task ${rv.id} (n ${rv.n})'s open finding, which survived all 5 fix/re-review rounds: ${rv.finding}. You hold the plan and cross-task context the reviewer lacks — read the "## Task ${rv.n}" section of ${planPath} and the task's report/fix history for that context, and apply SKILL.md's breaker section exactly as written there — do not use any other criterion for load-bearing than the one it states. If the finding text above bundles more than one open item, decide BLOCKED if ANY one of them is load-bearing by that test — never round a mixed bundle down to PARK. Report id ${rv.id}, decision as the BARE TOKEN "PARK" (safe to merge, record a ruling) or "BLOCKED" (do not merge) — no other value, since the coordinator branches on exact string equality against it — and ruling with your reasoning either way (this becomes the ledger's parked-with-a-ruling note on PARK, or the blocker bead's body on BLOCKED).`
}

function breakerBlockerPrompt(rv, planPath, ruling) {
  // "The breaker, autonomous variant": the cap adjudicator (adjudicatePrompt, above) ruled BLOCKED
  // — file a blocker bead with the same shape as any other blocker bead (see "The blocker-bead
  // path"): the task id, the load-bearing finding, the adjudicator's ruling, the plan text it
  // collides with, and the fix history. MECHANICAL: `bd create` with a fixed, fully-specified
  // shape — the judgment call (load-bearing or not) already happened in `adjudicatePrompt`; this
  // builder only files the bead it decided on.
  return `File a blocker bead for task ${rv.id} (n ${rv.n}): run \`bd create\` with a \`blocker\` label (confirm flags with \`bd create --help\`) and a body stating: the task id; the review finding that survived all 5 fix/re-review rounds — ${rv.finding}; the adjudicator's ruling that it's load-bearing — ${ruling}; the "## Task ${rv.n}" section of ${planPath} it collides with (paste it); and the fix history from the task's report file. Report id ${rv.id}, status BLOCKED, and blockerBead as the newly created bead's id.`
}

function triagePrompt(id, blockerBead, planPath) {
  // One of two genuine judgment calls in this script's blocker handling (opus) — RESOLVE vs
  // ESCALATE, once a blocker bead already exists (the other is adjudicatePrompt's PARK vs BLOCKED
  // call, which decides whether one gets filed in the first place at the fix-loop cap) — see "The
  // blocker-bead path". Follows ./triage-prompt.md verbatim; this builder
  // only supplies the per-dispatch variables that template's "Blocker bead" / "Originating task
  // plan" sections need. `handleBlocker` below branches on `t.decision === 'RESOLVE'` — exact
  // string equality against the TRIAGE schema's `decision` field — so the bare-token requirement
  // is restated here as a safeguard, not left to the template alone (same lesson as C5/I2: a
  // template-compliant-but-wrong report silently degrades a RESOLVE into a quarantine).
  // Final fix round: `planPath` is now threaded in from `handleBlocker`'s caller (`planned.planPath`
  // — see the three call sites in the coordinator loop) instead of this prompt telling the agent to
  // look up "the plan.md mapping table" — I7 renamed the plan file per epic (`<epicId>-plan.md`),
  // so a literal `plan.md` reference here would send a real triage agent looking for a file that
  // does not exist.
  return `Follow ./triage-prompt.md for the blocker bead ${blockerBead} filed against task ${id}. Run \`bd show ${blockerBead} --json\` for that template's "Blocker bead" section. Look up task ${id}'s ordinal via ${planPath}'s mapping table and paste its "## Task <N>" section for "Originating task plan". Include the relevant spec excerpt. Report per that template's Output Contract: \`decision\` must be the BARE TOKEN "RESOLVE" or "ESCALATE" ONLY — no colon, no clarification text in that field, since the coordinator branches on exact string equality against it — with the clarification (RESOLVE) or summary + decision needed (ESCALATE) in \`detail\`.`
}

function recordClarificationPrompt(id, detail) {
  // MECHANICAL: recording a RESOLVE clarification on the bead is a fixed write, not a judgment call.
  return `Record this clarification on bead ${id} (e.g. \`bd comment ${id} "..."\` or the project's equivalent) so the next dispatch round picks it up: ${detail}`
}

function notifyPrompt(id, detail) {
  // MECHANICAL: a fixed notification on ESCALATE — see "Escalation = notify + quarantine + continue".
  return `Send a notification (PushNotification or the configured messaging tool, if available) that task ${id} is ESCALATED: ${detail}. Report sent true/false.`
}

function readLedgerPrompt(integrationWorktree, ledgerPath) {
  // I1, MECHANICAL: a verbatim read, no interpretation — parsing happens in this script as plain JS
  // (see the Resume-phase block near the top), the same "mechanical extraction, judgment stays in
  // the script" split `bd ready`'s own prompt forbids reasoning about readiness for.
  return `Working directory: ${integrationWorktree} — the integration worktree owns the ledger (see "Workspace and ledger"). Run \`cat ${ledgerPath} 2>/dev/null || true\` and report its exact, complete contents verbatim as \`text\` (empty string if the file does not exist yet — do NOT create it, do NOT reason about or summarize its contents).`
}

function ledgerAppendPrompt(integrationWorktree, ledgerPath, planFileName, line) {
  // I1, MECHANICAL: appending one exact line is a fixed, no-judgment write — same tier as
  // `recordClarificationPrompt`/`notifyPrompt` above. Ensures the ledger's identity header exists
  // first (SKILL.md's Setup contract: `# SDD ledger — plan: <plan file path>`, exactly) so the
  // FIRST append to a fresh epic's ledger also creates it correctly, without a separate "create the
  // ledger" dispatch this script would otherwise need at Plan-materialization time. Idempotent on
  // every later call: the header is written only if the file doesn't already exist.
  // Fix-round-1 (review): `line` is now always built through `ledgerLine()` (below), which already
  // collapses embedded whitespace/newlines to single spaces before this function ever sees it — but
  // the payload is still fenced here, delimiter lines the dispatched agent is told are NOT part of
  // the ledger content, as a second line of defense: a future call site that ever bypasses
  // `ledgerLine()` and hands this an unsanitized multi-line string (e.g. a raw `t.detail`) still
  // gets an explicit, unambiguous "the line is everything between these fences, collapse it to one
  // physical line" instruction instead of a silently multi-line ledger entry that breaks the reader's
  // one-line-per-outcome parsing (`LEDGER_LINE_RE`, in the Resume phase).
  return `Working directory: ${integrationWorktree} — the integration worktree owns the ledger (see "Workspace and ledger"); never write it from a task's own worktree. If ${ledgerPath} does not exist yet, create its parent directory and the file with this exact first line: "# SDD ledger — plan: ${planFileName}". Then append, as a SINGLE new physical line, exactly the text between the fences below (the ~~~LEDGER_LINE~~~ markers are delimiters only — never write them to the file; if the payload somehow still contains a blank line or embedded newline, strip it so the appended line stays one physical line):\n~~~LEDGER_LINE~~~\n${line}\n~~~LEDGER_LINE~~~\nReport nothing beyond confirming the append succeeded — this dispatch is fire-and-forget, same as notifyPrompt/recordClarificationPrompt above.`
}

function ledgerLine(n, id, rest) {
  // Fix-round-1 (review, "Strongly suggested structure"): the SINGLE writer every ledger-line call
  // site in this script now goes through — paired with `LEDGER_LINE_RE` (near the other top-level
  // schema constants, read by the Resume phase before this function's textual definition, but
  // reachable there via normal `function` hoisting) so the writer and the reader agree on the same
  // shape by construction, not by two independently-hand-rolled string templates staying in sync by
  // coincidence. Collapses any run of whitespace (including embedded newlines) in `rest` to a single
  // space: `rest` regularly interpolates free text an agent produced (`t.detail`, `r.parkRuling`,
  // `r.finding`), any of which could in principle be multi-line, and the ledger's one-line-per-
  // outcome invariant — which the Resume-phase reader depends on to treat each line independently —
  // would otherwise silently break on the first such value.
  const flat = String(rest).replace(/\s+/g, ' ').trim()
  return `Task ${n ?? '?'} (${id}): ${flat}`
}

function short(sha) {
  // Fix-round-1 (review): the ledger's completion line now names a commit RANGE
  // (`commits <base7>..<head7>`, upstream SKILL.md's own shape), not the bare word "merged" — this
  // is the shared 7-character abbreviation used for both ends of that range at every call site.
  return String(sha || '').slice(0, 7)
}

function chunk(arr, size) {
  // I3, pure JS, no I/O: splits an array into consecutive sub-arrays of at most `size` — used to
  // bound a disjoint-file bucket's fan-out to `config.concurrency` before it's handed to pipeline()
  // (see the `cap` comment near `integrationWorktree`/`taskWorktree` and the Implement-phase loop).
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function groupByDisjointFiles(ids, planned) {
  // Pure computation over data already returned by the planner agent (planned.mapping[].files) —
  // no I/O. Buckets ids so no two ids in the same bucket share a declared file; ids within a
  // bucket run as concurrent siblings via pipeline() below, with `chunk(group, cap)` (I3, see that
  // helper above) bounding how many run at once to `config.concurrency` — buckets themselves still
  // serialize relative to each other (see the `for (const group of groups)` loop above). FAIL SAFE, per Global Constraints ("dispatch
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

// The five-round fix-loop breaker (C3/C-1/C-3/I-9). Loops fix -> scoped re-review while the
// verdict is anything but CLEAN, up to 5 rounds total — exactly "The breaker, autonomous variant"
// above and SDD's SKILL.md "The fix loop": rounds 1-3 resume the original implementer, rounds 4-5
// dispatch a fresh implementer on `fixEscalationModel()`'s tier, minors never extend the loop (the
// reviewer/re-reviewer defer them to the ledger themselves — see taskReviewPrompt/reReviewPrompt —
// so a non-CLEAN verdict that survives to here is never a bare minor). At the cap, a dispatched
// adjudicator — following SDD's own breaker rubric, not a coordinator-side reimplementation of it
// — decides PARK (merge, with a ruling) or BLOCKED (file a blocker bead and quarantine — NEVER
// merge).
async function reviewAndFix(im, planPath) {
  // C2's fix: none of taskReviewPrompt's/fixPrompt's/reReviewPrompt's report contracts ask for
  // `branch` (taskReviewPrompt's asks for "id, n, files, and status"; reReviewPrompt's asks for
  // "id, n, and status") — so `rv`/`fixed` never reliably carry it, and reReviewPrompt below
  // interpolates `fixed.branch` into its dispatch text. Re-stamp `n`/`files`/`branch`/`base` from
  // `im` (the implementer's result, itself carried forward from the brief stage — see the pipeline
  // call site) after every hop in this loop, rather than trusting a reviewer/fixer echo. This is
  // also what makes `mergePrompt`'s `r.branch` non-undefined: everything reviewAndFix returns has
  // passed through this re-stamp.
  // C-1 fix: `finding` was NOT among the re-stamped fields, and reReviewPrompt's OLD contract never
  // asked for it either — so from round 2 on, `rv.finding` silently went `undefined`, and every
  // later round's `fixPrompt`/`breakerBlockerPrompt` interpolated "address this review finding:
  // undefined" into a real dispatch. `lastFinding` keeps the most recent non-empty finding sticky
  // across every hop, as a second line of defense on top of reReviewPrompt's now-explicit "report
  // finding on NEEDS_FIX" contract (the two together mean a single omitted report can't lose it).
  let lastFinding
  const carried = result => {
    // `||`, not `??`: `??` only falls back on null/undefined, so an EMPTY-STRING finding (which
    // reReviewPrompt's own contract explicitly permits on a clean verdict — "omit or leave it
    // blank") would overwrite a real `lastFinding` with `""` if a re-reviewer ever reports a
    // non-"CLEAN" status with a blanked finding (the exact malformed-report shape C-3's fail-closed
    // loop was added to tolerate). `||` treats that empty string as "no finding reported" instead.
    lastFinding = result.finding || lastFinding
    // A CLEAN result never carries a finding forward, even if `lastFinding` is non-empty from an
    // earlier round — this is a GENUINE resolution (a real re-review returned CLEAN), not the
    // PARK-with-a-ruling case below, which builds its own return value and deliberately keeps
    // `rv.finding` intact as evidence of what was overruled. Without this, a stale finding would
    // survive on every clean-after-fix task, which nothing currently reads but would silently
    // corrupt the ledger writer (below) if it ever keyed "parked" off "finding is non-empty"
    // instead of the explicit `parked` list.
    return { ...result, n: im.n, files: im.files, branch: im.branch, base: im.base, finding: result.status === 'CLEAN' ? undefined : lastFinding }
  }
  let rv = carried(await agent(pick(() => taskReviewPrompt(im, planPath), `review:${im.id}`),
    { label: `review:${im.id}`, phase: 'Implement', model: model('reviewer'), schema: RESULT }))
  // C-3 fix: fail CLOSED. The pre-fix loop condition was `rv.status === 'NEEDS_FIX'` — so ANY
  // status that isn't the exact literal "NEEDS_FIX" (including upstream re-review-prompt.md's own
  // native vocabulary, "NOT ADDRESSED" — see reReviewPrompt) exits the loop as if the review were
  // clean. Loop on the negative instead: only a literal "CLEAN" exits early; anything else,
  // recognized or not, keeps looping until the round cap forces adjudication.
  for (let round = 1; round <= 5 && rv.status !== 'CLEAN'; round++) {
    // Fix-loop escalation (SDD's Model Selection: "rounds 4-5... a model at least one tier above
    // the implementer that got stuck") is `fixEscalationModel()` — a capability bump, not the
    // RESOLVE/ESCALATE-or-PARK/BLOCKED judgment call `triage` names (see "Coordinator contract";
    // this used to borrow `model('triage')` directly, which was reverted because it falsified that
    // section, `handleBlocker`'s own comment, and SKILL.md's tiering table all at once — see I-5).
    const fixModel = round <= 3 ? model('implementer') : fixEscalationModel()
    const fixed = carried(await agent(pick(() => fixPrompt(rv, round), `fix:${rv.id}:${round}`),
      { label: `fix:${rv.id}:${round}`, phase: 'Implement', model: fixModel, schema: RESULT }))
    rv = carried(await agent(pick(() => reReviewPrompt(fixed), `re-review:${fixed.id}:${round}`),
      { label: `re-review:${fixed.id}:${round}`, phase: 'Implement', model: model('reviewer'), schema: RESULT }))
  }
  if (rv.status === 'CLEAN') return rv
  // Breaker tripped: round 5's re-review still leaves the finding open (or returned something this
  // coordinator doesn't recognize — C-3 routes that here too, not to merge). I-9: adjudicate via a
  // DISPATCHED agent invoking SDD's own breaker rubric (adjudicatePrompt) — PARK (merge, with a
  // ruling) or BLOCKED (file a blocker bead and quarantine, never merge). This is the ONE place a
  // NEEDS_FIX-at-the-cap can still legitimately reach `mergePrompt`: via a PARK ruling, not by
  // silently falling through.
  const adj = await agent(pick(() => adjudicatePrompt(rv, planPath), `adjudicate:${rv.id}`),
    { label: `adjudicate:${rv.id}`, phase: 'Implement', model: model('triage'), schema: ADJUDICATE })
  if (adj.decision === 'PARK') {
    // Review round 3 (Critical): PARK used to write `parkRuling` to the return value and clear
    // `finding` — but nothing else in the script ever read `parkRuling` (not `mergePrompt`, not the
    // script's own return value, not any `log()`), and clearing `finding` erased the one piece of
    // evidence that a review finding was overruled rather than genuinely resolved. The result: a
    // task merges with a KNOWN open finding and the run reports it identically to a task that was
    // clean on the first pass — the exact "silent discard" subagent-driven-development/SKILL.md:377
    // forbids ("Every adjudication is a ledger entry"). `finding` is deliberately left INTACT (not
    // cleared) so the merged result still carries what was overruled.
    // Review round 4 (Important): the FIRST fix pushed to `parked` right here, at adjudication
    // time — but this function returns `status: 'CLEAN'` and hands off to the SEPARATE, LATER merge
    // gate (the Integrate loop below); `mergePrompt` can still fail its rebase or tests after its
    // one bounded auto-resolve attempt, in which case `completed.push` never runs and the id goes
    // to `handleBlocker` instead — `escalated` or `pendingRetry`. Pushing here unconditionally would
    // leave that id in `parked` FOREVER even though it never merged, contradicting "a parked task IS
    // a completed one" below by construction. `parked` is populated ONLY at the merge gate now,
    // alongside `completed.push` (see the Integrate loop's `if (m.merged)` branch) — "this task
    // merged" and "it merged with an overruled finding" are both established at that one point, so
    // recording them together there makes the invariant hold by construction, not convention.
    log(`PARK ruling for ${rv.id}: ${adj.ruling} — proceeding to the merge gate with the open finding intact: ${rv.finding}`)
    return { ...rv, status: 'CLEAN', parkRuling: adj.ruling }
  }
  // Load-bearing: file a blocker bead and quarantine. Returning `status: 'BLOCKED'` here is what
  // the Integrate stage's `if (r.status === 'BLOCKED')` check routes to `handleBlocker` instead of
  // `mergePrompt` (see the pipeline call site).
  const bead = await agent(pick(() => breakerBlockerPrompt(rv, planPath, adj.ruling), `breaker-blocker:${rv.id}`),
    { label: `breaker-blocker:${rv.id}`, phase: 'Implement', model: model('mechanical'), schema: RESULT })
  return { ...rv, status: 'BLOCKED', blockerBead: bead.blockerBead }
}

async function handleBlocker(r, planPath) {
  phase('Triage')
  // I-7 (review round 3): every blocker-path entry converges here — the implementer/brief-BLOCKED
  // case (via the Integrate loop's `if (r.status === 'BLOCKED')` branch), the breaker cap's
  // adjudicated BLOCKED (reviewAndFix), a merge that failed its auto-resolve attempt, and an
  // unmapped planner id (the `unplannedIds` loop) — FOUR call sites, THREE of which were passing a
  // `blockerBead` no schema actually requires (`RESULT` and `MERGE` both leave it optional). A
  // missing bead would reach `triagePrompt(r.id, r.blockerBead)` below as "the blocker bead
  // undefined". Ensuring it here, once, covers all four call sites instead of duplicating the
  // fallback at each one (the prior revision only guarded the implementer/brief hop).
  // Final fix round: `planPath` is now a required second argument, threaded from `planned.planPath`
  // at all three call sites in the coordinator loop below (`planned` is scoped to the round loop,
  // not visible to this top-level function, so it must be passed in) — see `triagePrompt`'s own
  // comment for why the prior "plan.md" literal was wrong after I7's per-epic rename.
  if (!r.blockerBead) {
    const bead = await agent(pick(() => missingBlockerBeadPrompt(r), `missing-blocker:${r.id}`),
      { label: `missing-blocker:${r.id}`, phase: 'Triage', model: model('mechanical'), schema: RESULT })
    r = { ...r, blockerBead: bead.blockerBead }
  }
  // Genuine judgment call: RESOLVE vs ESCALATE. This is one of two dispatches in this script that
  // legitimately spend `triage` (opus) — the other is reviewAndFix's cap adjudication
  // (adjudicatePrompt, PARK vs BLOCKED) — see "Coordinator contract" on why `triage` and
  // `mechanical` (and `fixEscalation`) are not interchangeable.
  const t = await agent(pick(() => triagePrompt(r.id, r.blockerBead, planPath), `triage:${r.id}`),
    { label: `triage:${r.id}`, phase: 'Triage', model: model('triage'), schema: TRIAGE })
  // C-2: bound RESOLVE to exactly one retry per id. A first-time RESOLVE gets a real re-attempt
  // next round (pendingRetry.add, below) — that's the whole point of RESOLVE. But if the SAME id
  // lands back in handleBlocker after that (pendingRetry already has it), the clarification didn't
  // fix it; a second RESOLVE is treated as ESCALATE regardless of what this round's triage verdict
  // says, so a bad clarification can spin at most one extra round before it quarantines — never
  // indefinitely. This is also what makes the outer no-progress guard's `pendingRetry.size` signal
  // meaningful: without a bound, RESOLVE growth could recur forever without ever converging.
  if (t.decision === 'RESOLVE' && !pendingRetry.has(r.id)) {
    pendingRetry.add(r.id)
    // re-dispatch next round with clarification recorded on the bead; do NOT mark escalated.
    // Recording a clarification is a mechanical write, not a judgment call.
    await agent(pick(() => recordClarificationPrompt(r.id, t.detail), `clarify:${r.id}`), { label: `clarify:${r.id}`, phase: 'Triage', model: model('mechanical') })
    // I1: ledger records the RESOLVE-pending state so a resumed run reconstructs `pendingRetry`
    // (and therefore C-2's one-bounded-retry check above) instead of treating this id as untouched
    // — without this, a restart would let a bad clarification get a second, unbounded RESOLVE.
    // Built through `ledgerLine()` (see the merge-gate call site's comment) so `t.detail` — free
    // text from the triage agent — can't embed a newline and break the one-line-per-outcome shape.
    await agent(pick(() => ledgerAppendPrompt(integrationWorktree, ledgerPath, planFileName,
        ledgerLine(r.n, r.id, `pending retry — RESOLVE: ${t.detail}`)),
      `ledger-append:${r.id}`), { label: `ledger-append:${r.id}`, phase: 'Triage', model: model('mechanical') })
  } else {
    const bounced = t.decision === 'RESOLVE'  // second RESOLVE for this id — bounced into ESCALATE
    pendingRetry.delete(r.id)
    escalated.push(r.id)                       // quarantine: dependents stay unready in beads
    const detail = bounced
      ? `Second RESOLVE for ${r.id} without resolving — escalating per the one-retry bound (C-2). Latest triage detail: ${t.detail}`
      : t.detail
    // Sending a fixed notification is mechanical, same reasoning as the clarification write above.
    await agent(pick(() => notifyPrompt(r.id, detail), `notify:${r.id}`), { label: `notify:${r.id}`, phase: 'Triage', model: model('mechanical') }) // push if available
    log(`ESCALATED ${r.id}: ${detail}`)      // always surfaces in /workflows + completion
    // I1: ledger records the terminal quarantine — SKILL.md's `BLOCKED` line shape — so a resumed
    // run reconstructs `escalated` and the `ids` filter (see the Ready-phase block) skips this id
    // instead of re-dispatching quarantined work. Written here, once, for EVERY blocker-path
    // trigger that ends in ESCALATE (self-filed blocker, failed merge, breaker-cap BLOCKED, an
    // unmapped planner id, or a bounced second RESOLVE) — not only the breaker-cap case "The
    // breaker, autonomous variant" describes, since `handleBlocker` is the single point every
    // trigger converges on (see the I-7-review-round-3 comment above this function) and writing it
    // anywhere else would duplicate the call at every trigger site. Built through `ledgerLine()`
    // (see the merge-gate call site's comment) so `detail` — which can itself embed `t.detail`,
    // free text from the triage agent — can't break the one-line-per-outcome shape with a newline.
    await agent(pick(() => ledgerAppendPrompt(integrationWorktree, ledgerPath, planFileName,
        ledgerLine(r.n, r.id, `BLOCKED — ${detail}`)),
      `ledger-append:${r.id}`), { label: `ledger-append:${r.id}`, phase: 'Triage', model: model('mechanical') })
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

**Task 5 (I1/I3/I7 — the ledger, `config.concurrency`, and the per-epic workspace) was a structural
edit to this script**, per the rule further below ("A recorded baseline is evidence only for the
exact script revision it ran against"): it added a one-time `read-ledger` dispatch before the round
loop, a `ledger-append:<id>` dispatch at every merge/pending-retry/BLOCKED outcome, and chunked each
disjoint-file bucket to `config.concurrency` before dispatch. All three scenarios have since been
re-run against the post-Task-5 script and are recorded as confirmed baselines below
(`wf_b337b535-bd4`, `wf_453a6604-52e`, `wf_941e256b-10b`) — the pre-Task-5 run-ids
(`wf_ddba38c0-72d`, `wf_e189dd5a-a5f`, `wf_058c4b83-631`) remain kept as superseded history in each
section, the same discipline this doc already applies to `wf_171ab5c1-339`.

**Fix-round-1 (a review pass on Task 5) was itself another structural edit**, layered on top of the
same script `wf_b337b535-bd4`/`wf_453a6604-52e`/`wf_941e256b-10b` ran against: it changed what the
Resume phase reconstructs from the ledger (no more folding `BLOCKED` lines into `escalated`, no
more filtering `ids` by `completed`), added the Plan-phase `planned.planPath`/`workspace`
divergence check, and changed the merge/ledger-line dispatches (`mergePrompt`/`MERGE` gained
`head`; every ledger-append call site now builds its line through the new `ledgerLine()` helper,
and the completion line's shape itself changed — a commit range instead of the bare word "merged,"
and the parked variant now carries `r.finding`). Per the "evidence only for the exact revision it
ran against" rule, that made all three of those baselines stale — a state this doc carried
explicitly for one round.

**Fix-round-2 fixed a defect fix-round-1's own divergence check introduced, and an EXECUTED dryRun
is what caught it — not review, not `node --check`.** The first version of the `plannedDir`/
`workspace` comparison used exact string equality; `workspace` is repo-root-relative but the
planner is dispatched to work inside the integration worktree, whose own git root
`scripts/sdd-workspace` resolves against is never the main repo's — so a CORRECT planner always
returns a path prefixed by the integration worktree, which can never equal the bare `workspace`
string. The canonical dryRun, run `wf_79a00109-4ff`, died on its very first Plan dispatch with the
divergence error, before a single task was ever briefed. **This run is kept below as history, not
deleted**, for the same reason `planPrompt is not defined` (see "A parse check is not a
runnability check," further below) is kept: it is this document's clearest other example of a
defect that only an *executed* dryRun could find. `node --check` had already passed against
fix-round-1's script (syntax only, per that section's own warning); reading the guard's code in
isolation reads as plausible without independently re-deriving what path shape `scripts/sdd-workspace`
actually produces from inside a worktree. Static review is not a substitute for running the thing.

Fix-round-2 replaced the equality check with a suffix check anchored on the leading path separator
(`plannedDir === workspace || plannedDir.endsWith('/' + workspace)`) — see the Plan-phase call
site's own comment for the full reasoning. **This was independently verified both directions before
the re-run below, and both matter equally:** the predicate now accepts the worktree-prefixed path a
real planner returns (the failure `wf_79a00109-4ff` exposed), **and it still rejects** a planner
that writes into the old, unparameterized shared directory (`.superpowers/sdd/plan`) — i.e. the
exact I7 collision this guard exists to catch in the first place. Stating this second half
explicitly matters: a guard that had simply stopped firing altogether (e.g. by deleting the check,
or loosening it into a no-op) would have "fixed" the run failure while silently reopening the
cross-epic collision it was written to prevent — a strictly worse outcome than the loud failure it
replaced, since a stopped-firing guard gives no signal at all. Re-running all three scenarios against
the fixed guard (below) hit the SAME counts as the pre-fix-round-1 baselines (31, 24, 23) —
confirming the guard fix changed only the predicate's correctness, not the script's dispatch
topology, exactly as expected for a one-`if`-condition fix.

**The final fix round (Fixes 1–3: idempotent `taskBriefPrompt`, merge-base-derived `base` on a
re-entered worktree, and `mergeBase`-derived ledger ranges) is itself another structural edit — the
coordinator re-ran all three scenarios against the fixed script, and every one landed at the exact
same count and shape as its pre-fix predecessor** (canonical `wf_ea0a2284-96b` 31/0, cap-tripping
`wf_3c881af8-70b` 24/0, PARK `wf_ac3e6fae-171` 23/0 — see each scenario's own "Confirmed against the
final-fix-round script" writeup below for the full figures). **Read that identical result correctly:
it is not evidence the three fixes work.** Fixes 1–3 live entirely in `taskBriefPrompt`'s and
`mergePrompt`'s dispatch TEXT and in real git semantics (whether `git worktree add` fails on an
existing path/branch, whether a post-rebase `git merge-base` actually lands where this doc claims) —
`pick()` never builds either function's real dispatch text under `dryRun: true`, so an unchanged
count confirms only that the fixes did not perturb dispatch topology, the identical narrow claim
fix-round-2's unchanged counts made for its own one-`if`-condition fix. See "Confirmed against the
final-fix-round script — and why that is not validation" further below (after the PARK scenario) for
the full accounting, including what a live-run validation of each fix would actually require.

**The scope fix (the scope fix — see "Resolved in this branch") is the most recent structural edit, and all three
scenarios were re-run against it** — canonical `wf_cb63ecb9-492` 31/0, cap-tripping
`wf_caf8953e-374` 24/0, PARK `wf_f18d307b-83e` 23/0, each matching its predecessor exactly. These
are the current baselines; the final-fix-round ids above are superseded history. The edit extracted
`treeMembershipTest(epicId)` shared by `closeEpicsPrompt` and a new `readyPrompt(epicId)`, and
retired the id-prefix grep. Read the unchanged counts the same narrow way as every round before:
the fix's substance is prompt TEXT, which `pick()` never builds under `dryRun: true`. What the
re-run genuinely establishes is that a newly extracted helper referenced from two builders resolves
at runtime — the defect class `node --check` cannot see and an executed dryRun catches on the first
dispatch.

**One edit landed after those three runs, and it is named here rather than left for a reader to
discover by diffing.** Merging the `super-auto` branch renamed the `super-plan` skill to
`super-design`, which touched this script in exactly three places: two comments in `readyPrompt`
and one identifier inside its returned prompt string. The three run-ids above are still cited as
current, and the justification is stronger than the usual "topology unchanged" — the changed lines
sit inside a function body `pick()` never invokes under `dryRun: true`, so the code these runs
executed is not merely equivalent to the current script, it is byte-identical to it. Verified by
diffing the current block against the exact `.js` the three runs consumed: the rename is the whole
delta. Any future edit that reaches an executed line, however small it looks, requires a re-run —
that is the standing rule, and this is a stated exception to its letter, not a loophole in it.

**What this guard, and these re-runs, do NOT prove.** The predicate accepts a well-formed,
worktree-prefixed planner path — that is a fact about the `if` statement, checked directly (see
above) and now exercised by three passing dryRuns. It does **not** prove that a real planner
*produces* that path: `planPrompt` correctly supplies `planFileName` as `planner-prompt.md`'s
parameter, and the template no longer hardcodes the literal `plan.md` (fix-round-1's other change)
— but whether a real opus dispatch actually honors that parameter, rather than falling back to a
stale cached copy of the template or improvising a different filename, is a live-run-only question
no dryRun can touch: `pick()` never builds the real `planPrompt`/`planner-prompt.md` dispatch text
under `dryRun: true` (same structural limit as every other prompt-TEXT claim in this section — see
"None of the three proves anything about prompt TEXT" further below). This is the residual risk
behind I7 that the guard reduces but cannot eliminate: it catches a divergence once one has
happened, it does not make the planner incapable of causing one. Stated here, next to the guard,
rather than left implied by the guard's mere existence.

**What the three re-runs establish, precisely.** Each re-run hit the exact predicted count computed
by hand before any run occurred (31, 24, 23 — see each scenario's "Expected dispatch count," which
was arithmetic *before* these runs and is now confirmed arithmetic). The entire delta over the
pre-Task-5 counts (26→31, 22→24, 21→23) is ledger traffic: one `read-ledger` plus exactly one
`ledger-append:<id>` per terminal outcome, no more and no less. Hitting the predicted number is
therefore a real assertion about I1, not a tautology: **every terminal outcome in all three
scenarios wrote its ledger line.** Had any outcome's `ledger-append` call been skipped, the run
would have dispatched one fewer agent than predicted. Fix-round-1 (review): a prior draft of this
paragraph claimed a *duplicate* `ledger-append` call for one of these ids would instead raise
`dryRun: no stub for key ledger-append:<id>` — that mechanism is wrong. `pick()` (see the script
above) throws only when a stub key is **entirely absent** from `prompts.stubs`; a duplicate call
reuses a key this scenario's table already defines and `pick()` happily returns the same canned
`{appended:true}` value again, no throw. What actually catches a duplicate is the same signal that
catches a skip, from the other direction: an extra call lands the run at 32 dispatches, not 31 —
the count-matches-exactly assertion still holds, just via the dispatch tally, not a thrown
exception. (A call for an id genuinely outside a scenario's stub table — e.g. `ledger-append:bd-105`
under the canonical scenario's four ids — would still throw for the ordinary missing-key reason;
that's a different case from "an extra one fired" for an id already in the table.) Neither a skip
nor a duplicate happened in any of the three runs.

**What these three re-runs do NOT establish — read this before citing them for more than dispatch
counting.** Every `read-ledger` and `ledger-append` call in all three runs was answered by a canned
stub (`{text:""}` for every `read-ledger`, `{appended:true}` for every `ledger-append`), per this
section's own dryRun mechanics — `pick()` never calls a real prompt builder under `dryRun: true`.
These runs prove the dispatches fire **at the right points, in the right number** (see above). They
prove **nothing** about:
- the ledger **line format** actually rendered — `readLedgerPrompt`/`ledgerAppendPrompt` were never
  called for real, so the exact `Task <N> (<bead id>): ...` text these functions build was never
  produced or inspected by any of these runs (same caveat as this doc's existing scoping/
  finding-rendering/branch-carry-forward caveats: verified only by reading the function definitions);
- a real file actually being written to or read from disk — `dryRun: true` means no I/O occurs at
  all (see "Key constraint: the script does no I/O" and the intro to this section);
- **resume actually reconstructing state from real ledger content** — every `read-ledger` stub in
  all three runs returned `{text:""}` (a fresh epic), so the Resume-phase parsing logic
  (`resumed.set(...)`/the four `if (kind === ...)` branches) never ran against non-empty text in any
  of these runs. A genuine resumed-run scenario — a `read-ledger` stub returning multi-line text with
  a mix of `complete`/`BLOCKED`/`pending retry` entries, asserting the correct ids land in
  `completed`/`escalated`/`pendingRetry` and that already-escalated/completed ids are excluded from
  `ids` — remains **unwritten and unrun**. Given this document's history of overclaiming a baseline's
  coverage (four prior findings, all named under "dryRun policy" below), this gap is stated
  explicitly rather than left to be inferred from "the ledger is wired up and the baselines pass."

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

**A recorded baseline is evidence only for the exact script revision it ran against.** Every
"Confirmed" run-id/agent-count/return-value writeup in this doc is tied to the script as it existed
at the commit that run executed against — not to "the coordinator script" in the abstract, and not
to any later revision, however small the diff looks. Citing a prior run as if it covers a
subsequently-restructured engine is an overclaim **even when the figures themselves are real and
unaltered** — the run genuinely happened, genuinely passed, and is still not evidence about code it
never executed. This document has produced this exact overclaim more than once (most recently: a
canonical-scenario baseline cited across the commits that added the `pendingRetry`/`parked` return
keys, when the cited run predated both and could never have contained them). The fix is procedural,
not a one-time cleanup: after any structural edit, either re-run every baseline this doc cites and
replace its figures, or mark it explicitly superseded/historical and stop citing it as current —
never carry a stale run-id forward as if the intervening diff didn't happen.

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
the canonical topology scenario: **four** ready tasks under one epic — `bd-101`, `bd-102`, and
`bd-104` touch disjoint files (`src/a.js`, `src/b.js`, `src/c.js`) and dispatch **concurrently**;
`bd-103` also touches `src/a.js`, so it **serializes** after that group. `bd-101`'s review returns
a finding and goes through one fix round + re-review (`ADDRESSED`) — fix-loop stub keys are now
**round-suffixed** (`fix:<id>:<round>`, `re-review:<id>:<round>`), since `reviewAndFix` can now run
up to 5 rounds and the same unqualified key would otherwise be ambiguous across rounds. `bd-103`'s
merge fails its one auto-resolve attempt, exercising the blocker-bead path end to end: triage
`ESCALATE`, notify, quarantine, **continue** (`bd-101`/`bd-102` still merge). `bd-104`'s
**implementer self-reports `BLOCKED`** (C4's fix): the pipeline's review stage is guarded on that
incoming status and skips entirely — there is no `review:bd-104` stub, because that dispatch must
never happen — and `bd-104` routes straight to `handleBlocker`, whose triage call returns
`RESOLVE` this time: `clarify:bd-104` is dispatched instead of `notify:bd-104`, and `bd-104` is
**not** pushed onto `escalated` — instead it's added to `pendingRetry` (C-2's one-bounded-retry
tracking; see `handleBlocker`), which the no-progress guard also reads as real progress. This
closes the two gaps the prior three-task scenario could not catch by construction: no stub ever
returned `BLOCKED` at implement, and the `RESOLVE` branch of `handleBlocker` was never exercised.
**What this scenario still can't prove**, because `pick()` never calls a real prompt builder under
`dryRun: true` (see "dryRun policy" above): whether a real re-reviewer's finding survives to round
5 (`carried()`'s sticky `lastFinding`, C-1) and whether an unrecognized re-review verdict correctly
fails closed instead of falling through to merge (C-3) — this scenario's lone fix round returns the
literal token `CLEAN` on round 1, so the loop never runs a second round at all. Both remain
inspection-only, verified by reading `reviewAndFix`'s definition directly, in every scenario. The
cap adjudicator (PARK vs BLOCKED, I-9) is exercised by a dedicated second scenario instead — see
"Cap-tripping dryRun scenario" below — since tripping it here would mean `bd-101` never resolves in
round 1, changing every downstream assertion this scenario makes about bucketing and merge order.

| Stub key | Canned output (`<json>` content) | Exercises |
|---|---|---|
| `read-ledger` | `{text:""}` | I1: the one-time Resume-phase read, before the round loop starts — empty text means a fresh epic with no prior ledger, so nothing is reconstructed into `completed`/`escalated`/`parked`/`pendingRetry` (a resumed-run scenario, with non-empty ledger text, is not covered by this scenario — see "What this dryRun still can't prove" additions below) |
| `close-epics` (array, 2 entries) | `{rootClosed:false,closedThisRun:[]}` then `{rootClosed:false,closedThisRun:["bd-101","bd-102"]}` | root stays open both rounds (quarantined `bd-103` and unresolved `bd-104` block closure) — round 1 doesn't exit early, round 2 doesn't loop forever |
| `bd-ready` (array, 2 entries) | `{ids:["bd-101","bd-102","bd-103","bd-104"]}` then `{ids:[]}` | round 1 supplies the batch; round 2's empty set drains the loop (a canned value, not real `bd` continuity — see "What this dryRun proves and does not prove" below on why a RESOLVE'd `bd-104` not reappearing in round 2 is not itself an assertion). The **scoping** assertion (`--exclude-type=epic --label sp:<epicId>`) is a property of the dispatched prompt text itself, not of this canned return — verified by reading the prompt, same as `super-roast`'s reporter-arithmetic caveat above |
| `plan` | `{planPath:"...", mapping:[{n:1,id:"bd-101",files:["src/a.js"]},{n:2,id:"bd-102",files:["src/b.js"]},{n:3,id:"bd-103",files:["src/a.js"]},{n:4,id:"bd-104",files:["src/c.js"]}]}` | ordinal↔bead-id↔files mapping that `groupByDisjointFiles` and every `ordinalFor` lookup consumes |
| `brief:bd-101` / `brief:bd-102` / `brief:bd-103` / `brief:bd-104` | `{id:"bd-1XX",n:<n>,status:"BRIEFED",files:[...],branch:".worktrees/<integrationBranch>--task-bd-1XX",base:"<40-char-sha>"}` | call-site-qualified per id (a single unqualified `brief` key can't return four different ids/branches); `base` here is the pre-implementer commit taskBriefPrompt now captures — this is where `n`/`branch`/`base` originate for the rest of the pipeline |
| `implement:bd-101` / `implement:bd-102` / `implement:bd-103` | `{id:"bd-1XX",n:<n>,status:"IMPLEMENTED",files:[...],branch:"..."}` | same per-id qualification. This stub's `n`/`branch` are cosmetic only — the pipeline's implement stage re-stamps `n` from `ordinalFor(br.id)` and `branch` from `taskWorktree(br.id)` directly (never trusting the implementer's own echo, nor even the brief agent's — see the pipeline call site); only `base` is carried from the brief result (`br.base`), since that one genuinely can't be recomputed |
| `implement:bd-104` | `{id:"bd-104",n:4,status:"BLOCKED",files:["src/c.js"],branch:".worktrees/epic-bd-100-integration--task-bd-104",blockerBead:"bd-109"}` | **C4**: the implementer itself reports BLOCKED and has already self-filed the bead (`blockerBead`), per implementPrompt's report contract — `n`/`branch` are re-stamped by the pipeline as usual, but `status`/`blockerBead` are this stub's own and must survive the pipeline call site's guard unmodified |
| `review:bd-101` | `{id:"bd-101",n:1,status:"NEEDS_FIX",files:["src/a.js"],finding:"missing null check on parsed input in src/a.js:42"}` | the one task whose review returns a finding — `finding` is what `fixPrompt` builds the fix dispatch from, not the rest of the result. No `branch`/`base` here by design: `reviewAndFix`'s `carried()` re-stamps both from `im` regardless of what this report contains, which is the C2 fix |
| `review:bd-102` / `review:bd-103` | `{id:"bd-1XX",n:<n>,status:"CLEAN",files:[...]}` | clean reviews — no fix loop for these two. **No `review:bd-104` key exists** — that dispatch must never fire (see C4 above); its absence from this table is itself part of the test: a regression that dropped the pipeline's status guard would throw `dryRun: no stub for key review:bd-104` |
| `fix:bd-101:1` | `{id:"bd-101",n:1,status:"FIXED",files:["src/a.js"]}` | round 1 of the fix loop, dispatched only for the flagged task; no `branch` here either, by the same design as `review:bd-101` above. Round-suffixed (`:1`) because `reviewAndFix`'s loop can now run up to 5 rounds and each round is its own stub key |
| `re-review:bd-101:1` | `{id:"bd-101",n:1,status:"CLEAN"}` | finding `ADDRESSED` on round 1 — the loop exits immediately since `rv.status === 'CLEAN'` (C-3's fail-closed condition; this is the ONE way out of the loop besides the round cap), so no `fix:bd-101:2`/`re-review:bd-101:2` stub is needed or dispatched; `reviewAndFix` re-stamps `branch`/`base`/`n`/`files` from `im` onto this before it becomes the task's final result, which is what reaches `mergePrompt`'s `r.branch` |
| `merge:bd-101` / `merge:bd-102` | `{id:"bd-1XX",merged:true,head:"<40-char-sha>",mergeBase:"<40-char-sha>"}` | successful serial merges — `head` (fix-round-1) is the rebased branch's tip commit, `mergeBase` (Fix 3, final fix round) is the post-rebase merge-base; both together render the ledger's commit-range completion line below (`mergeBase..head`, never `base..head`) |
| `ledger-append:bd-101` / `ledger-append:bd-102` | `{appended:true}` | I1: the merge-gate `ledger-append` dispatch — `Task <n> (bd-1XX): complete (commits <mergeBase7>..<head7>, review clean)` (fix-round-1: was `complete (merged, review clean)`, dropping the commit range upstream SKILL.md specifies; Fix 3, final fix round: the range's first half is `mergeBase`, not `base` — see the `mergeBase`/`MERGE` schema comment) (schema-less, like `notify`/`clarify` — the coordinator never reads this return) |
| `merge:bd-103` | `{id:"bd-103",merged:false,blockerBead:"bd-108"}` | merge fails its bounded auto-resolve attempt → blocker path. **No `merge:bd-104` key exists** — `bd-104` never reaches `mergePrompt` at all, since its BLOCKED status routes it to `handleBlocker` directly at the top of the Integrate loop (see the `if (r.status === 'BLOCKED')` check); its absence is part of the test, same reasoning as `review:bd-104`'s absence above |
| `triage:bd-103` | `{decision:"ESCALATE",detail:"rebase conflict on src/a.js survived one auto-resolve attempt"}` | the judgment dispatch in `handleBlocker`, ESCALATE branch — notify + quarantine |
| `triage:bd-104` | `{decision:"RESOLVE",detail:"implementer needs the missing config constant named explicitly; re-plan and re-attempt"}` | the judgment dispatch in `handleBlocker`, **RESOLVE branch** — the one branch the prior three-task scenario never exercised. This is `bd-104`'s FIRST time through `handleBlocker`, so `pendingRetry` doesn't have it yet and C-2's one-retry bound doesn't fire (that requires a SECOND blocker-path visit for the same id, which this scenario doesn't stage — see the round-2 `bd-ready` note above) |
| `notify:bd-103` | `{sent:true}` | fixed-notification mechanical dispatch on the ESCALATE branch |
| `ledger-append:bd-103` | `{appended:true}` | I1: `handleBlocker`'s ESCALATE branch appends `Task 3 (bd-103): BLOCKED — <detail>` so a resumed run reconstructs `escalated` for this id |
| `clarify:bd-104` | `{recorded:true}` | fixed-clarification-recording mechanical dispatch on the RESOLVE branch (schema-less, like `notify` — see "Schema-less dispatches" below); this is also what makes `pendingRetry` grow, which the no-progress guard reads as this round's progress signal (C-2) |
| `ledger-append:bd-104` | `{appended:true}` | I1: `handleBlocker`'s RESOLVE branch appends `Task 4 (bd-104): pending retry — RESOLVE: <detail>` so a resumed run reconstructs `pendingRetry` (and C-2's one-retry bound) for this id |
| `final-review` | `{summary:"stub: 2/4 tasks merged; bd-103 quarantined, bd-104 resolved pending re-attempt",verdict:"conditional-pass"}` | whole-epic review dispatched once at least one task landed |

**Stub keys are call-site qualified** (`brief:<id>`, `review:<id>`, `merge:<id>`, `triage:<id>`,
`fix:<id>:<round>`, `re-review:<id>:<round>`, ...) for the same reason `super-roast`'s are
qualified by `seat:<name>:<site>`: a single unqualified key can't return four different task
ids/branches, or a `CLEAN` for two tasks and a `NEEDS_FIX` for the third, with one fixed value —
and, now that the fix loop can run multiple rounds, can't distinguish round 1's verdict from round
2's either. Qualifying by call site (and, for the fix loop, by round) removes the ambiguity — each
task gets its own deterministic path through the pipeline. The breaker cap itself (a non-`CLEAN`
verdict surviving all 5 rounds, the `adjudicate:<id>`/`breaker-blocker:<id>` dispatches) is **not**
exercised by this scenario — see "Cap-tripping dryRun scenario" below, a separate dryRun, the same
way `super-roast` runs its panel-cap and dead-dedupe scenarios as additional baselines rather than
folding them into the canonical one. The unmapped-planner-id path (`unplanned-blocker:<id>`) and
the missing-`blockerBead`/brief-stage-BLOCKED fallback (`missing-blocker:<id>`, I-7/I-8) remain
untested by any scenario in this doc — inspection-only, same as C-1/C-3 above.

## Assertions for the canonical dryRun

- `bd ready` is scoped to the epic tree (`--exclude-type=epic --label sp:<epicId>`), not the whole
  repo — verified by inspecting the dispatched `bd-ready` prompt text (see the stub table note
  above; the stub's *return value* can't prove this, only the prompt construction can). This
  scenario's canned `bd-ready` stub is always non-empty on round 1, so `readyPrompt`'s structural
  fallback (former "Resolved in this branch" (the `sp:`-labelling and canonical-args items)) is never exercised by this or any dryRun in this
  document — that fallback is verified only by reading `readyPrompt`'s and `treeMembershipTest`'s
  definitions directly, same tier as the scoping assertion itself.
- The three disjoint-file tasks (`bd-101`, `bd-102`, `bd-104`) dispatch as one `pipeline()` group —
  **concurrently**; `bd-103` (shares `src/a.js` with `bd-101`) is bucketed alone by
  `groupByDisjointFiles` and its group runs strictly after the first group's `pipeline()` call
  resolves — **serialized**, never a sibling in the same call.
- `bd-101`/`bd-102`/`bd-103` run the full pipeline in order — brief → implementer →
  review-package (task-reviewer) — and `bd-101` additionally runs one fix round + a scoped
  re-review that reports the finding `ADDRESSED` (see `reviewAndFix` in the script above).
- **`bd-104` never reaches `review:bd-104`, `fix:bd-104:*`, `re-review:bd-104:*`, or
  `merge:bd-104`** (C4): its implementer reports BLOCKED, the pipeline's status guard passes that
  result straight through unmodified, and it lands directly in the Integrate loop's
  `if (r.status === 'BLOCKED')` branch. If this dryRun ever dispatches any of those four keys for
  `bd-104`, the guard has regressed — that is the failure mode this scenario exists to catch.
- Merge-back is **serial**: three `merge:<id>` calls (`bd-101`, `bd-102`, `bd-103` — never
  `bd-104`), one at a time, in dependency/ready order, never two concurrently.
- The blocker path fires on `bd-103`'s failed merge: a blocker bead reference (`blockerBead`) is
  returned, `handleBlocker` dispatches `triage:bd-103` → `ESCALATE` → `notify:bd-103`, `bd-103` is
  pushed onto `escalated` (quarantined, not closed) — and the run **continues**: `bd-101`/`bd-102`
  still merge and close.
- The blocker path also fires on `bd-104`'s implement-stage BLOCKED: `handleBlocker` dispatches
  `triage:bd-104` → `RESOLVE` (first time for this id, so C-2's one-retry bound doesn't fire) →
  `clarify:bd-104` (not `notify:bd-104`) — and `bd-104` is **not** pushed onto `escalated`, but IS
  added to `pendingRetry`, per `handleBlocker`'s RESOLVE branch. The run proceeds to round 2
  instead of halting either way; the no-progress guard doesn't fire this round regardless, since
  `bd-101`/`bd-102` also merge (real progress on the `completed` signal alone).
- No path reaches `mergePrompt` with a status other than a clean (`CLEAN`, after however many fix
  rounds, or a PARK ruling — see "Cap-tripping dryRun scenario" below for that path) review result:
  `bd-101`/`bd-102`/`bd-103` are the only three `merge:<id>` dispatches, and each is reached only
  after `reviewAndFix` returned a `CLEAN` result (this is Step 4's verification target — confirmed
  by inspection of the pipeline call site and `reviewAndFix`'s return paths, not by this scenario
  alone, since `bd-104` is the only stubbed BLOCKED case here and this scenario's fix loop never
  reaches the round-5 cap or the adjudicator).
- Expected dispatch count (I1: `read-ledger` 1 + `close-epics` 2 + `bd-ready` 2 + `plan` 1 +
  `brief` 4 + `implement` 4 + `review` 3 + `fix` 1 + `re-review` 1 + `merge` 3 + `ledger-append` 4
  (`bd-101`, `bd-102`, `bd-103`, `bd-104` — one per terminal outcome) + `triage` 2 + `notify` 1 +
  `clarify` 1 + `final-review` 1 = **31 agent calls, 0 errors** (`final-review` dispatches because
  `completed.length` is 2, not 0) — **confirmed by re-run**, see below; this was computed by hand
  before that run and matched exactly. The pre-Task-5 script's confirmed count was 26 (see the
  superseded baseline below) — the +5 is exactly the new `read-ledger` (1) and `ledger-append` (4)
  dispatches; nothing else in this scenario's topology changed.
- `r.branch` reaching `mergePrompt`'s dispatch text and `im.base` reaching `taskReviewPrompt`'s
  (C2/C6) is verified only by reading `mergePrompt`'s and `taskReviewPrompt`'s definitions — never
  by this or any dryRun's output, for the identical reason the scoping and finding-rendering
  caveats above are (see "What this dryRun proves and does not prove" below): `pick()` is lazy, so
  under `dryRun: true` neither builder is ever called and neither one's template literal ever
  interpolates anything — the text actually sent to the stubbed agent is the literal stub string,
  full stop. A regression that deleted `carried()`, or the brief→implement `taskWorktree`/
  `ordinalFor` re-stamp, would **not** fail this dryRun: agent count stays 26, errors stay 0, and
  neither `completed`/`escalated` nor any schema the loop branches on carries branch/base
  information. What the dryRun *does* exercise, because these are plain JS and not behind `pick()`,
  is the carry-forward assignments themselves running without throwing on every stubbed `im`/`br` —
  that only proves the code path executes, not that its result reaches a dispatch string.

If any assertion fails, fix the script **in this doc** (this doc's script is canonical) and
re-run before committing the fix.

### Baselines for the canonical scenario (recorded, not illustrative)

Run `wf_b1958510-6bf`, 2026-07-30, against an earlier revision of the args below — one that
predates the `base`-carrying fix for C2/C6 (Task 3): that revision's `brief:*` stubs had no `base`
field, `RESULT` had no `base` property, and `reviewAndFix` had no `carried()` re-stamp. **22 agents
dispatched, 0 errors**. Returned `{completed: ["bd-101","bd-102"], escalated: ["bd-103"]}` with the
final review's verdict `conditional-pass`. **Superseded, kept as history — read the rest of this
run's writeup with that in mind, not as the current baseline** (see "Superseded by Task 4" below:
this run predates the five-round breaker, the C4 guard, and `bd-104`, and is confirmed only against
the revision it actually ran against). At that revision, it confirmed every assertion above **except
scoping and finding-rendering** (see "What this dryRun proves and does not prove" below), in the
dispatch order the journal recorded:

1. `close-epics` → `{rootClosed:false, closedThisRun:[]}`
2. `bd-ready` → 3 ids — real evidence the loop got its batch, but **not** evidence of scoping: a
   stub returns its canned ids regardless of what flags the prompt baked in, so this step would
   look identical even if `--exclude-type=epic --label sp:${epicId}` had been deleted from the
   dispatched prompt. The scoping assertion is, and remains, established only by reading that
   prompt's construction, confirmed present there — never by this or any dryRun's output (see the
   `bd-ready` stub table entry and "What this dryRun proves" below).
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
   whose review returned a finding (unqualified-by-round keys — predates the round-suffix change)
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

**Superseded by Task 4.** This 22-agent, three-task run predates: the five-round breaker loop (C3,
round-suffixed `fix`/`re-review` keys), the review-stage status guard (C4, `bd-104`'s BLOCKED
implement path), and the no-progress guard (I6). It provably could not have caught any of those
three defects — no stub ever returned `BLOCKED` at implement, and the fix loop never had more than
one round to loop. It's kept here as history of the *prior* scenario, not as evidence for the
current script.

**Confirmed against the script as it stood through Task 4 — superseded by the post-Task-5 run
below.** Run `wf_ddba38c0-72d`: **26 agents dispatched, 0 errors** — matching that revision's
expected count exactly. Returned `{completed:["bd-101","bd-102"], escalated:["bd-103"],
pendingRetry:["bd-104"], parked:[]}`. Compare this to the intermediate run `wf_171ab5c1-339` (also
26/0, cited in earlier revisions of this section) — **`bd-104` now appears in `pendingRetry`**,
where under the engine `wf_171ab5c1-339` ran against it vanished from every bucket entirely
(neither `completed`, `escalated`, nor anything else — the reporting hole review round 2 found).
`wf_ddba38c0-72d` is what proved that fix end to end, against the script current *at that time*;
`wf_171ab5c1-339` cannot, because it never ran against a script that had a `pendingRetry`/`parked`
return shape at all. Kept here as history of the pre-Task-5 engine, same discipline as
`wf_171ab5c1-339` below it.

**Confirmed against the post-Task-5, pre-fix-round-1 script — superseded, kept as history.** Run
`wf_b337b535-bd4`: **31 agents dispatched, 0 errors** — the exact count predicted by hand above,
before this run occurred (see "Expected dispatch count"). Returned
`{completed:["bd-101","bd-102"], escalated:["bd-103"], pendingRetry:["bd-104"], parked:[],
stalled:false}` — identical terminal-outcome shape to `wf_ddba38c0-72d` above, plus the 5 new
ledger dispatches (1 `read-ledger`, 4 `ledger-append:<id>` — one per
`bd-101`/`bd-102`/`bd-103`/`bd-104`). Hitting the predicted count exactly is itself the assertion
this run establishes for I1: since the entire +5 delta over the pre-Task-5 count is one
`read-ledger` plus one `ledger-append` per terminal outcome, and no more, matching 31 on the nose
means **every one of this scenario's four terminal outcomes wrote its ledger line** — a missed
append would have landed at 30, and an extra (duplicate) one would have landed at 32, not thrown
(see "What the three re-runs establish, precisely" above for the corrected mechanism — `pick()`
throws only on a stub key entirely absent from the table, not on a repeated call to one already
defined). **What this run does not prove:** the ledger line format, real file I/O, or resumed-run
reconstruction from real content — see "What these three re-runs do NOT establish" under "dryRun
policy" above; every `read-ledger` and `ledger-append` here was a canned stub (`{text:""}` /
`{appended:true}`), never a real dispatch. Fix-round-1 (Resume-phase reconstruction, the
`planned.planPath`/`workspace` divergence check, `MERGE`'s `head` field, the `ledgerLine()`
rewrite) made this run's script revision obsolete; it is kept here as history, same discipline as
`wf_ddba38c0-72d` above it, not cited as current evidence for anything past that point.

**`wf_79a00109-4ff` — the canonical dryRun run immediately after fix-round-1, died on its first
Plan dispatch.** Kept as history, not deleted, because it is this document's clearest other example
(alongside `planPrompt is not defined`, see "A parse check is not a runnability check" further
below) of a defect an EXECUTED dryRun caught that neither code review nor `node --check` did:
fix-round-1's first version of the Plan-phase divergence check compared `plannedDir` against
`workspace` for exact string equality, and `workspace` is repo-root-relative while a correctly
working planner — dispatched, by this same script, to work inside the integration worktree — always
reports a worktree-prefixed path, which can never be byte-identical to the bare `workspace` string.
The check therefore threw on the very first Plan dispatch of this run, before a single task was
ever briefed, 0 tasks completed. Fix-round-2 corrected the predicate (see the Plan-phase call site's
own comment for the fix and the paragraph above "Baselines for the canonical scenario" for why an
executed run, not inspection, is what surfaced this). The other two scenarios below were not
separately run against the broken predicate — the defect is in code every scenario's first Plan
dispatch reaches identically, so there was no need to reproduce it three times once the canonical
scenario had.

**Confirmed against the current (post-fix-round-2) script.** Run `wf_fc56493c-a69`: **31 agents
dispatched, 0 errors** — the SAME count as the now-superseded `wf_b337b535-bd4` above, which is
itself an assertion, not a coincidence: fix-round-2 changed only the divergence guard's comparison
predicate (an `if` condition), not the existence or count of any dispatch site, so an unchanged
agent count is exactly what a correct, topology-preserving fix should produce. Returned
`{completed:["bd-101","bd-102"], escalated:["bd-103"], pendingRetry:["bd-104"], parked:[],
stalled:false}` — identical terminal-outcome shape to every prior confirmed run of this scenario.
**What this run newly proves, on top of everything `wf_b337b535-bd4` already established:** the
fixed divergence guard's predicate does not fire a false positive against a well-formed,
worktree-prefixed planner path — the exact case `wf_79a00109-4ff` proved it wrongly rejected.
**What it does not prove:** independently of this run, the predicate was also checked by hand
against a planner path that SHOULD fail (the old, unparameterized `.superpowers/sdd/plan`
directory) and still correctly rejects it — that check is by inspection, not by this or any dryRun,
since no stub table in this doc supplies a deliberately-wrong `planPath` to exercise the reject
branch; a dryRun that did (a scenario whose `plan` stub returns a path that does NOT resolve to
`workspace`) remains unwritten, same category of gap as the resumed-run scenario noted elsewhere.
Nor does this run prove that a REAL planner dispatch produces the well-formed path in the first
place — `pick()` never builds `planPrompt`'s real dispatch text under `dryRun: true`, so whether a
live opus agent actually honors `planner-prompt.md`'s now-parameterized plan-file-name is a
live-run-only question (see the "What this guard, and these re-runs, do NOT prove" paragraph
earlier in this section). This run also does not prove the ledger line format, real file I/O, or
resumed-run reconstruction from real content, for the same reasons as every prior run in this
section — every `read-ledger`/`ledger-append` here was still a canned stub.

**Confirmed against the final-fix-round script — and why that is not validation.** Run
`wf_ea0a2284-96b`: **31 agents dispatched, 0 errors** — the SAME count and terminal-outcome shape
(`{completed:["bd-101","bd-102"], escalated:["bd-103"], pendingRetry:["bd-104"], parked:[],
stalled:false}`) as the now-superseded `wf_fc56493c-a69` above. This is the last recording on this
scenario; the fix cycle that produced it is closed by decision, so this figure is what the branch
ships with. **State this precisely, right next to the figure, so it is never read out of context:**
this identical count is **not** evidence that Fixes 1–3 (idempotent `taskBriefPrompt`, the
merge-base-derived `base` on a re-entered worktree, the `mergeBase`-derived ledger range) work. All
three live in `taskBriefPrompt`'s and `mergePrompt`'s dispatch TEXT and in real git semantics —
`pick()` never builds either function's real prompt under `dryRun: true` (every `brief:<id>`/
`merge:<id>` call in this scenario is answered by a canned stub, exactly as before this round's
edits), so this run could not have distinguished the fixed script from a version where
`taskBriefPrompt` still unconditionally tried to create an already-existing worktree, or where
`mergePrompt` never captured `mergeBase` at all. An unchanged count confirms only what fix-round-2's
own unchanged counts confirmed for its one-`if`-condition change: the edit did not perturb dispatch
topology (call sites, ordering, schema-level field additions) — nothing more. **What would actually
validate Fixes 1–3, and why no dryRun scenario in this file can do it:** each fix's defect only
exists on the SECOND time a specific piece of git state is touched, which a canned stub can't
model. Fix 1 needs a real restart where `.worktrees/<integrationBranch>--task-<id>` and its branch
already exist on disk before the brief dispatch runs, so `git worktree add` would have failed
without the reuse check. Fix 2 needs that same re-entered branch to already carry a prior attempt's
real commits, so `HEAD` is demonstrably not a pre-implementer commit and `git merge-base` must be
computed to recover the true divergence point. Fix 3 needs a live rebase where at least one OTHER
task has genuinely merged into the integration branch between this worktree's cut and this task's
own merge, so `r.base..head` would provably include that other task's commits and `mergeBase..head`
provably would not. None of these is a scenario `pick()`'s stub mechanism can be extended to cover
— they are properties of a real git history over multiple real dispatches, not of a single canned
JSON response. The next step for anyone who wants Fixes 1–3 actually corroborated is a live epic run
through a genuine restart, not another dryRun scenario added to this file.

**Confirmed against the scope-fix script (the scope fix — see "Resolved in this branch").** Run `wf_cb63ecb9-492`:
**31 agents dispatched, 0 errors**, terminal shape `{completed:["bd-101","bd-102"],
escalated:["bd-103"], pendingRetry:["bd-104"], parked:[], stalled:false}` — identical count and
shape to `wf_ea0a2284-96b` above, which now becomes superseded history. The scope fix extracted
`treeMembershipTest(epicId)` out of `closeEpicsPrompt`, added `readyPrompt(epicId)` (labelled
`sp:` query as fast path, structural parent-child walk as fallback), and retired the id-prefix
grep; the blocker-bead-planning fix was prose-only, leaving the three bead-creation builders byte-for-byte untouched.
**Why this run was worth doing even though the count could not change:** the edit introduced a
newly extracted helper referenced from two builders, and `node --check` parses without resolving
references — an undefined-reference defect of exactly the `planPrompt is not defined` class would
have killed the run on its first Ready dispatch, as `wf_79a00109-4ff` did on its first Plan
dispatch. It did not. **What it does not prove, stated with the same precision as the paragraph
above:** the fix's entire substance is prompt TEXT — the membership rule the Ready and Close agents
are told to apply — and `pick()` never builds `readyPrompt` or `closeEpicsPrompt` under
`dryRun: true`. Every `bd-ready`/`close-epics` call here is a canned stub, so this run cannot
distinguish the fixed script from one whose fallback rule is wrong, inverted, or absent. Retiring
the id-prefix grep is what keeps the `bd-100`/`bd-101..104` ids in these args valid on scoping
grounds; it does not make them exercised. Only a live epic — specifically one whose beads carry no
`sp:` label, forcing the fallback path — can corroborate the rule itself.

**`wf_171ab5c1-339` is kept only as superseded history, not current evidence.** It executed against
commit `9576d7f` — the state of this script **before** the `4a3e3bc` and `9855503` commits
restructured `reviewAndFix`, `handleBlocker`, and the return value (the C-1/C-2/C-3/I-9/I-7 fixes
and the `parked` array). Its returned object predates `parked` entirely and couldn't have contained
the key even by coincidence. A prior revision of this doc cited `wf_171ab5c1-339` as if it covered
the post-restructure engine — that was citing a run of *different code*, the exact overclaim shape
"dryRun policy" above now names generally ("A recorded baseline is evidence only for the exact
script revision it ran against"): a baseline is not evidence about code it never executed, even
when its own figures are real and unaltered.

**Schema-less dispatches — the harness's "N empty results" is expected, not a defect.** Three of
the 26 calls in the current scenario carry no `schema:` and so return free text rather than
structured output: `notify` and `clarify` are fire-and-forget — the coordinator never reads their
return, so free text is fine and is simply ignored. `final-review` is also schema-less by design —
its raw string is returned verbatim as this script's `review` result field, not parsed. None of the
three is a bug; a future run reporting empty/unstructured results among the 26 for exactly these
three is expected, not a regression, and should not be "fixed" by adding schemas that would force
them into a shape they don't need.

**What this dryRun proves and does not prove** (same caveat `super-roast`'s doc states for its own
baselines): it proves **coordinator topology** — dispatch order, the disjoint-file batching (at
the bucket-membership level — see the correction on intra-bucket order above), the serial merge
gate, blocker-bead routing (both ESCALATE and RESOLVE), the review-stage BLOCKED guard, and loop
termination. It proves **nothing** about the real prompts' content, since every agent in this run
is a canned stub, and **nothing** about actual git/`bd` behavior, since `dryRun: true` means no I/O
occurs — a real implementer's fix, a real triage RESOLVE/ESCALATE judgment, and a real merge's
auto-resolve attempt are exercised only by a live run. It also proves **nothing** about `bd ready`
**scoping** specifically, for the same reason: `bd-ready`'s stub returns its canned ids
unconditionally, so a dryRun cannot distinguish a correctly-scoped prompt from one with the scoping
flags silently deleted — that assertion is, and can only ever be, verified by reading the
dispatched prompt's construction, not by running this or any dryRun. The identical caveat applies
to **finding-rendering**: `pick()` is lazy, so under `dryRun: true` the real `fixPrompt` is never
called, and this run cannot demonstrate that `rv.finding` actually reaches the fix dispatch text.
What it *does* prove is narrower: `RESULT` carries `finding` across the schema boundary intact —
the `review:bd-101` stub returned it and it survived into `rv` unchanged. The rendering itself —
that `fixPrompt` interpolates `rv.finding` into the dispatch string — is verified only by reading
`fixPrompt`'s definition, the same way scoping is verified only by reading the `bd-ready` dispatch.
The identical caveat applies again to `branch`/`base` **carry-forward** (C2/C6): `mergePrompt` and
`taskReviewPrompt` are exactly as lazy as `fixPrompt` under `pick()`, so this run never calls
either and never interpolates `r.branch`/`im.base` into any dispatch text — a regression that
deleted the `carried()` re-stamp or the brief→implement `taskWorktree`/`ordinalFor` re-stamp would
still show the same agent count, 0 errors, and identical `completed`/`escalated`. What *is*
narrower and true: the re-stamp assignments are plain JS, not gated by `pick()`, so they run on
every stubbed `im`/`br` in this trace without throwing — but that only proves the code path
executes, not that its output reaches a prompt. Whether `r.branch` actually reaches `mergePrompt`'s
text and `im.base` actually reaches `taskReviewPrompt`'s is, and can only be, verified by reading
those two functions' definitions directly. **The same caveat applies a fourth time, to the C4
status guard and the I6 no-progress guard**: both are plain JS `if` checks, not behind `pick()`, so
a real run exercises the actual branch (this scenario's `bd-104` genuinely never reaches
`review:bd-104`) — but the no-progress guard specifically is **not exercised by this scenario at
all**, since `bd-101`/`bd-102` merge in round 1 (real progress), so `completed.length` grows and
the guard's condition is never true. Proving the no-progress guard actually stops a spinning run
requires a *separate* scenario — an all-RESOLVE-no-merge round — which this canonical scenario
deliberately does not attempt to also be. **The same caveat applies a fifth time, to C-1's sticky
`lastFinding` and C-3's fail-closed loop condition**: the `carried()` closure and the `for` loop's
`rv.status !== 'CLEAN'` test are plain JS, not behind `pick()`, so this run genuinely exercises
them — `bd-101`'s single round assigns `lastFinding` and the loop condition genuinely evaluates the
literal `"CLEAN"` token from `re-review:bd-101:1` to exit early — but neither proves what a *real*
re-reviewer would actually return, or that `rv.finding` survives to round 5 unmangled, since the
real `fixPrompt`/`reReviewPrompt`/`breakerBlockerPrompt`/`adjudicatePrompt` template literals are
never built under `dryRun: true`. See "Cap-tripping dryRun scenario" below for the scenario that at
least exercises the round-5 boundary itself (still not the finding/vocabulary caveats — those stay
inspection-only in every scenario, per that section's own note).

**Prior run, kept as history.** Run `wf_d65bc00e-990`, 2026-07-30 (recorded before fix round 2 —
`review:bd-101`'s stub then had no `finding` field), also passed: 22 agents, 0 errors, identical
`completed`/`escalated`/verdict. The only observed difference from the (then-current) baseline was
intra-bucket dispatch order (`brief:bd-101` before `brief:bd-102`, vs. `102` before `101` above) —
per the correction above, that is not a regression and the two runs are not "identical," just
both-passing on the dimensions that are actually assertions.

**Journals are session-local.** Run ids and the figures recorded against them are the durable
record; journals themselves are not guaranteed to remain inspectable. A future maintainer
re-verifies the current baseline by re-running the Workflow tool with the `args` below and
recording the new run's figures here — not by going looking for any prior run's journal.

The current baseline (`wf_cb63ecb9-492`, 31 agents, 0 errors — see "Confirmed against the scope-fix
script" above) is verified against the scope-fix script, the most recent structural edit. To
reproduce it, or to re-verify after any future structural edit, run the Workflow tool with this
script and this `args` block:

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
      "read-ledger": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
      "close-epics": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[\"bd-101\",\"bd-102\"]}"
      ],
      "bd-ready": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[\"bd-101\",\"bd-102\",\"bd-103\",\"bd-104\"]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[]}"
      ],
      "plan": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"planPath\":\".worktrees/epic-bd-100-integration/.superpowers/sdd/bd-100-plan/bd-100-plan.md\",\"mapping\":[{\"n\":1,\"id\":\"bd-101\",\"files\":[\"src/a.js\"]},{\"n\":2,\"id\":\"bd-102\",\"files\":[\"src/b.js\"]},{\"n\":3,\"id\":\"bd-103\",\"files\":[\"src/a.js\"]},{\"n\":4,\"id\":\"bd-104\",\"files\":[\"src/c.js\"]}]}",
      "brief:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"BRIEFED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-101\",\"base\":\"aaaaaaa1111111111111111111111111111111\"}",
      "brief:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"n\":2,\"status\":\"BRIEFED\",\"files\":[\"src/b.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-102\",\"base\":\"bbbbbbb2222222222222222222222222222222\"}",
      "brief:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"n\":3,\"status\":\"BRIEFED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-103\",\"base\":\"ccccccc3333333333333333333333333333333\"}",
      "brief:bd-104": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-104\",\"n\":4,\"status\":\"BRIEFED\",\"files\":[\"src/c.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-104\",\"base\":\"ddddddd4444444444444444444444444444444\"}",
      "implement:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"IMPLEMENTED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-101\"}",
      "implement:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"n\":2,\"status\":\"IMPLEMENTED\",\"files\":[\"src/b.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-102\"}",
      "implement:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"n\":3,\"status\":\"IMPLEMENTED\",\"files\":[\"src/a.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-103\"}",
      "implement:bd-104": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-104\",\"n\":4,\"status\":\"BLOCKED\",\"files\":[\"src/c.js\"],\"branch\":\".worktrees/epic-bd-100-integration--task-bd-104\",\"blockerBead\":\"bd-109\"}",
      "review:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"NEEDS_FIX\",\"files\":[\"src/a.js\"],\"finding\":\"missing null check on parsed input in src/a.js:42\"}",
      "review:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"n\":2,\"status\":\"CLEAN\",\"files\":[\"src/b.js\"]}",
      "review:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"n\":3,\"status\":\"CLEAN\",\"files\":[\"src/a.js\"]}",
      "fix:bd-101:1": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/a.js\"]}",
      "re-review:bd-101:1": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"n\":1,\"status\":\"CLEAN\"}",
      "merge:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-101\",\"merged\":true,\"head\":\"a1a1a1a1111111111111111111111111111111\",\"mergeBase\":\"aaaaaaa1111111111111111111111111111111\"}",
      "ledger-append:bd-101": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "merge:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-102\",\"merged\":true,\"head\":\"b2b2b2b2222222222222222222222222222222\",\"mergeBase\":\"bbbbbbb2222222222222222222222222222222\"}",
      "ledger-append:bd-102": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "merge:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-103\",\"merged\":false,\"blockerBead\":\"bd-108\"}",
      "triage:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"decision\":\"ESCALATE\",\"detail\":\"rebase conflict on src/a.js survived one auto-resolve attempt\"}",
      "triage:bd-104": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"decision\":\"RESOLVE\",\"detail\":\"implementer needs the missing config constant named explicitly; re-plan and re-attempt\"}",
      "notify:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"sent\":true}",
      "ledger-append:bd-103": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "clarify:bd-104": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"recorded\":true}",
      "ledger-append:bd-104": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "final-review": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"summary\":\"stub: 2/4 tasks merged; bd-103 quarantined, bd-104 resolved pending re-attempt\",\"verdict\":\"conditional-pass\"}"
    }
  }
}
```

If a future structural edit changes this script, re-run with these args, confirm the same shape (or
update it deliberately alongside the edit that changed it), and replace the figures above — same
discipline as `super-roast`'s "Passing baseline (recorded, not illustrative)" sections. Fix-round-1
(Resume phase, the Plan-phase divergence check, `MERGE`'s `head`, the ledger-line shape),
fix-round-2 (the divergence guard's corrected predicate), and the final fix round (Fixes 1–3 —
idempotent `taskBriefPrompt`, merge-base-derived `base`, `mergeBase`-derived ledger range) were all
exactly such structural edits, each re-run in turn: **`wf_b337b535-bd4`'s 31/0 is superseded
history** (see "Confirmed against the post-Task-5, pre-fix-round-1 script" above),
**`wf_fc56493c-a69`'s 31/0 is likewise superseded** (see "Confirmed against the current
(post-fix-round-2) script" above), **`wf_ea0a2284-96b`'s 31/0 is superseded by the scope fix** (see
"Confirmed against the final-fix-round script" above), and the CURRENT confirmed shape is **31 agent
calls, 0 errors** (run `wf_cb63ecb9-492`, see "Confirmed against the scope-fix script" above — read
that writeup's own caveat before citing this number for anything beyond dispatch-count/topology) —
the intervening `wf_79a00109-4ff` run is kept as history of the fix-round-2 defect itself, not as a
baseline (it died before completing). The 26/0 figures in the two writeups above `wf_b337b535-bd4`
remain pre-Task-5 history, unaffected by this restatement.

## Cap-tripping dryRun scenario (separate baseline)

The canonical scenario above never runs the fix loop past round 1 (`bd-101` resolves immediately),
so it cannot exercise the round cap, the adjudicator (`adjudicatePrompt`, I-9's PARK-vs-BLOCKED
call), or `breakerBlockerPrompt` receiving a ruling. Folding a cap-trip into the canonical scenario
would mean `bd-101` never merges in round 1, which changes every downstream assertion the canonical
scenario makes about bucketing and merge order — so, same reasoning as keeping the RESOLVE-vs-
ESCALATE and panel-cap-style scenarios separate elsewhere in this doc, this is its own minimal
dryRun: **one** epic, **one** ready task, five NEEDS_FIX fix/re-review rounds, ending in a BLOCKED
adjudication.

**What this scenario proves, on top of the canonical one:** the round counter actually stops at 5
(not before, not after), `reviewAndFix` dispatches the adjudicator exactly once at the cap (not
per-round), a BLOCKED adjudication reaches `breakerBlockerPrompt` and then `handleBlocker`/`triage`
— never `mergePrompt` — and the `completed.length ? ... : 'no work landed'` branch this doc's other
recorded runs have never exercised (this scenario merges nothing, so `final-review` is **not**
dispatched at all).

**What it still cannot prove**, for the same `pick()`-laziness reason stated throughout this doc:
whether `rv.finding` genuinely survives all 5 rounds unmangled into `breakerBlockerPrompt`'s and
`adjudicatePrompt`'s dispatch text (C-1), and whether a re-reviewer that returns something other
than the literal tokens `CLEAN`/`NEEDS_FIX` (e.g. upstream's native `NOT ADDRESSED`) is correctly
treated as still-open by the fail-closed loop condition (C-3) rather than falling through. Every
`re-review:bd-201:*` stub below returns the literal `NEEDS_FIX` — a real run following the
template's native vocabulary is the only way to exercise C-3's fail-closed branch for real, and
reading `reviewAndFix`'s definition directly (the loop condition is `rv.status !== 'CLEAN'`, never
`rv.status === 'NEEDS_FIX'`) is the only way to verify it today. Both remain inspection-only.

| Stub key | Canned output (`<json>` content) | Exercises |
|---|---|---|
| `read-ledger` | `{text:""}` | I1: the one-time Resume-phase read — fresh epic, nothing reconstructed |
| `close-epics` (array, 2 entries) | `{rootClosed:false,closedThisRun:[]}` twice | root never closes — `bd-201` never merges in this scenario |
| `bd-ready` (array, 2 entries) | `{ids:["bd-201"]}` then `{ids:[]}` | round 1 supplies the one task; round 2's empty set drains the loop (`bd-201` is excluded from round 2 anyway, via the `escalated` filter, once triage ESCALATEs it below) |
| `plan` | `{planPath:"...", mapping:[{n:1,id:"bd-201",files:["src/x.js"]}]}` | single-task, single-bucket mapping |
| `brief:bd-201` | `{id:"bd-201",n:1,status:"BRIEFED",files:["src/x.js"],branch:".worktrees/epic-bd-200-integration--task-bd-201",base:"<40-char-sha>"}` | brief stage, unblocked |
| `implement:bd-201` | `{id:"bd-201",n:1,status:"IMPLEMENTED",files:["src/x.js"],branch:"..."}` | implement stage, unblocked (contrast with the canonical scenario's `bd-104`, which tests the BLOCKED path instead) |
| `review:bd-201` | `{id:"bd-201",n:1,status:"NEEDS_FIX",files:["src/x.js"],finding:"race condition writing the shared cache in src/x.js:17"}` | the initial review that starts the fix loop |
| `fix:bd-201:1` … `fix:bd-201:5` | `{id:"bd-201",n:1,status:"FIXED",files:["src/x.js"]}` (all 5 identical in shape) | all 5 rounds of the fix loop dispatch — rounds 1-3 on `implementer`'s tier, rounds 4-5 on `fixEscalationModel()`'s tier (a property of the dispatched prompt/`opts.model`, not of this canned return — verified by reading `reviewAndFix`, same caveat as scoping elsewhere in this doc) |
| `re-review:bd-201:1` … `re-review:bd-201:5` | `{id:"bd-201",n:1,status:"NEEDS_FIX",finding:"race condition writing the shared cache in src/x.js:17"}` (all 5) | the verdict that keeps the loop going every round — never `CLEAN`, so the loop runs the full 5 rounds and never exits early |
| `adjudicate:bd-201` | `{id:"bd-201",decision:"BLOCKED",ruling:"real race condition with no test coverage for the interleaving; must not merge"}` | the cap adjudicator (I-9) — dispatched exactly once, after round 5, never once per round |
| `breaker-blocker:bd-201` | `{id:"bd-201",status:"BLOCKED",blockerBead:"bd-210"}` | the blocker bead filed on a BLOCKED ruling — `breakerBlockerPrompt` now takes the adjudicator's `ruling` as a third argument (verified by reading the definition, not this canned return) |
| `triage:bd-201` | `{decision:"ESCALATE",detail:"race condition confirmed load-bearing by the breaker adjudicator; needs a human decision on the caching strategy"}` | `handleBlocker`'s normal triage dispatch, reached via the Integrate loop's `if (r.status === 'BLOCKED')` branch — same path any other BLOCKED result takes, confirming the breaker's BLOCKED exit isn't a special case downstream |
| `notify:bd-201` | `{sent:true}` | fixed-notification mechanical dispatch on the ESCALATE branch |
| `ledger-append:bd-201` | `{appended:true}` | I1: `handleBlocker`'s ESCALATE branch appends `Task 1 (bd-201): BLOCKED — <detail>` — the breaker-cap BLOCKED case reaches the ledger through the SAME `handleBlocker` write every other blocker trigger uses, not a special-cased write inside `reviewAndFix` |

**No `merge:bd-201` and no `final-review` key exist in this scenario's args** — both are part of
the test. `bd-201` never reaches `mergePrompt` (it's BLOCKED, never CLEAN); `completed.length` stays
`0` for the whole run, so the `? ... : 'no work landed'` ternary in the Finish phase takes its
`false` branch and `final-review` is never dispatched. If either key is ever requested under this
scenario, something regressed: `merge:bd-201` would mean a BLOCKED task reached the merge gate;
`final-review` would mean `completed.length` was nonzero despite nothing merging.

**Assertions:**
- Exactly 5 `fix:bd-201:<round>` / `re-review:bd-201:<round>` pairs dispatch, rounds 1 through 5 —
  not 4, not 6. `reviewAndFix`'s `for` loop is bounded `round <= 5`.
- `adjudicate:bd-201` dispatches exactly **once**, strictly after `re-review:bd-201:5` and strictly
  before `breaker-blocker:bd-201` — never mid-loop, never more than once.
- `breaker-blocker:bd-201` dispatches only because `adjudicate:bd-201` returned `BLOCKED` — a `PARK`
  return (not exercised by this scenario's stubs, but confirmed by reading the code) would instead
  return `{...rv, status:'CLEAN', ...}` from `reviewAndFix` and skip `breaker-blocker:bd-201`
  entirely, reaching `mergePrompt` instead.
- The task's final status reaching the Integrate loop is `BLOCKED` with `blockerBead: "bd-210"` —
  routed to `handleBlocker`, never to `mergePrompt`.
- `completed` is `[]`, `escalated` is `["bd-201"]`, `pendingRetry` is `[]` (triage ESCALATEd, not
  RESOLVEd, so `handleBlocker`'s `pendingRetry.add` branch never fires), `parked` is `[]` (the task
  never merges, so the Integrate loop's `if (r.parkRuling)` push never runs — not that `adj.decision`
  was ever `PARK` here in the first place), `stalled` is `false` (the round that quarantines
  `bd-201` grows `escalated`, which the no-progress guard reads as progress).
- Expected dispatch count (I1: `read-ledger` 1 + `close-epics` 2 + `bd-ready` 2 + `plan` 1 +
  `brief` 1 + `implement` 1 + `review` 1 + `fix` 5 + `re-review` 5 + `adjudicate` 1 +
  `breaker-blocker` 1 + `triage` 1 + `notify` 1 + `ledger-append` 1 (`bd-201`) = **24 agent calls,
  0 errors** — and, distinctly from every other scenario in this doc, **no `final-review`
  dispatch**, since `completed.length` is `0`) — **confirmed by re-run**, see below; this was
  computed by hand before that run and matched exactly. The pre-Task-5 confirmed count was 22
  (below); the +2 is exactly `read-ledger` and `ledger-append:bd-201`.

**Confirmed against the script as it stood through Task 4 — superseded by the post-Task-5 run
below.** Run `wf_e189dd5a-a5f`: **22 agents dispatched, 0 errors** — matching that revision's
expected count exactly, including the absent `merge:bd-201`/`final-review` dispatches (neither was
ever requested). 5 fix rounds, 5 still-open re-reviews, 1 adjudicator call, 1 blocker bead filed, 1
triage call (`ESCALATE`), 0 merge dispatches. Returned `{completed:[], escalated:["bd-201"],
pendingRetry:[], parked:[], stalled:false}`. Kept here as history of the pre-Task-5 engine.

**Confirmed against the post-Task-5, pre-fix-round-1 script — superseded, kept as history.** Run
`wf_453a6604-52e`: **24 agents dispatched, 0 errors** — the exact count predicted by hand above,
before this run occurred. Returned `{completed:[], escalated:["bd-201"], pendingRetry:[],
parked:[], stalled:false}`, review `"no work landed"` — the same terminal-outcome shape as
`wf_e189dd5a-a5f` above, plus the 2 new ledger dispatches (`read-ledger`, `ledger-append:bd-201`).
Hitting 24 exactly means the run's one terminal outcome (ESCALATE, via `handleBlocker`) wrote its
`BLOCKED` ledger line — a skipped append would have landed at 23. This confirms the round-cap
boundary (5, not 4 or 6), the adjudicator dispatching exactly once at the cap rather than
per-round, the BLOCKED path never touching `mergePrompt`, and — new for I1 — that a breaker-cap
BLOCKED reaches the ledger through the same `handleBlocker` write every other blocker trigger uses
(see "The breaker, autonomous variant"), not a special-cased write inside `reviewAndFix`. **It does
not confirm the PARK arm** — this scenario's `adjudicate:bd-201` stub only ever returns `BLOCKED`;
see "PARK dryRun scenario" below. It also does not confirm C-1/C-3 (inspection-only regardless of
how many scenarios pass, see "What it still cannot prove" above), nor the ledger's line format,
real file I/O, or resumed-run reconstruction from real content (`read-ledger` returned `{text:""}`
here too) — see "What these three re-runs do NOT establish" under "dryRun policy" above.
Fix-round-1's Resume-phase change is exactly the case this scenario's `escalated`/`BLOCKED` outcome
touches (a ledger `BLOCKED` line is no longer folded into `escalated` on restart — though this run
never exercised a restart itself, its lone `read-ledger` stub returning `{text:""}`), so this run's
script revision is obsolete; kept here as history, same discipline as `wf_e189dd5a-a5f` above it.

**Confirmed against the current (post-fix-round-2) script.** Run `wf_18710e4f-50a`: **24 agents
dispatched, 0 errors** — the SAME count as the now-superseded `wf_453a6604-52e` above, confirming
fix-round-2's guard-predicate correction (see the canonical scenario's own "confirmed against the
current script" writeup above for why an unchanged count is the expected, correct outcome of that
fix) left this scenario's topology untouched. Returned `{completed:[], escalated:["bd-201"],
pendingRetry:[], parked:[], stalled:false}`, review `"no work landed"` — identical terminal-outcome
shape to every prior confirmed run of this scenario. This scenario's own `plan`/`bd-ready`/Plan-phase
dispatches never touch the divergence guard's reject branch (its `plan` stub, like every stub in
this doc, always returns a well-formed path), so — same caveat as the canonical scenario's own
"confirmed against the current script" writeup — this run adds no new evidence about the guard
itself; it establishes only that the round-cap/breaker/blocker-path assertions above still hold
against the current script.

**Confirmed against the final-fix-round script — and why that is not validation.** Run
`wf_3c881af8-70b`: **24 agents dispatched, 0 errors** — the SAME count and terminal-outcome shape
(`{completed:[], escalated:["bd-201"], pendingRetry:[], parked:[], stalled:false}`, review "no work
landed") as the now-superseded `wf_18710e4f-50a` above. This is the last recording on this scenario;
the fix cycle is closed by decision. Same caveat as the canonical scenario's own
"Confirmed against the final-fix-round script — and why that is not validation" writeup, stated here
too rather than only cross-referenced, since this is exactly where a reader could otherwise take
"all pass, unchanged" as corroboration: this identical count is **not** evidence that Fixes 1–3 work
— this scenario's single task (`bd-201`) never merges at all (it's BLOCKED at the breaker cap), so
neither `taskBriefPrompt`'s reuse branch nor `mergePrompt`'s `mergeBase` capture is ever even
dispatched here, stubbed or otherwise. An unchanged count confirms only that adding Fixes 1–3 didn't
add, remove, or reorder any dispatch this scenario exercises. Validating the fixes themselves needs
a live restart with pre-existing git state (see the canonical scenario's writeup for exactly what
each fix needs), which no stub scenario — this one included — can provide.

**Confirmed against the scope-fix script (the scope fix — see "Resolved in this branch").** Run `wf_caf8953e-374`:
**24 agents dispatched, 0 errors**, terminal shape `{completed:[], escalated:["bd-201"],
pendingRetry:[], parked:[], stalled:false}`, review "no work landed" — identical to
`wf_3c881af8-70b` above, which becomes superseded history. What this re-run adds over the canonical
one is narrow and specific: the blocker-bead-planning fix was prose-only precisely so that `breakerBlockerPrompt`
and the two other bead-creation builders stayed byte-for-byte unchanged, and this is the only
scenario that dispatches the breaker's blocker-bead path at all. The unchanged count and shape
confirm that path's call sites survived the edit intact. It confirms nothing about the blocker
bead's TEXT — same `pick()` limit as everywhere else in this section.

```json
{
  "epicId": "bd-200",
  "integrationBranch": "epic-bd-200-integration",
  "dryRun": true,
  "config": {
    "concurrency": 4,
    "models": { "planner": "opus", "implementer": "sonnet", "reviewer": "sonnet", "mechanical": "sonnet", "triage": "opus", "finalReview": "opus", "fixEscalation": "opus" }
  },
  "prompts": {
    "stubs": {
      "read-ledger": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
      "close-epics": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[]}"
      ],
      "bd-ready": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[\"bd-201\"]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[]}"
      ],
      "plan": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"planPath\":\".worktrees/epic-bd-200-integration/.superpowers/sdd/bd-200-plan/bd-200-plan.md\",\"mapping\":[{\"n\":1,\"id\":\"bd-201\",\"files\":[\"src/x.js\"]}]}",
      "brief:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"BRIEFED\",\"files\":[\"src/x.js\"],\"branch\":\".worktrees/epic-bd-200-integration--task-bd-201\",\"base\":\"eeeeeee5555555555555555555555555555555\"}",
      "implement:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"IMPLEMENTED\",\"files\":[\"src/x.js\"],\"branch\":\".worktrees/epic-bd-200-integration--task-bd-201\"}",
      "review:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"NEEDS_FIX\",\"files\":[\"src/x.js\"],\"finding\":\"race condition writing the shared cache in src/x.js:17\"}",
      "fix:bd-201:1": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/x.js\"]}",
      "re-review:bd-201:1": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"NEEDS_FIX\",\"finding\":\"race condition writing the shared cache in src/x.js:17\"}",
      "fix:bd-201:2": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/x.js\"]}",
      "re-review:bd-201:2": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"NEEDS_FIX\",\"finding\":\"race condition writing the shared cache in src/x.js:17\"}",
      "fix:bd-201:3": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/x.js\"]}",
      "re-review:bd-201:3": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"NEEDS_FIX\",\"finding\":\"race condition writing the shared cache in src/x.js:17\"}",
      "fix:bd-201:4": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/x.js\"]}",
      "re-review:bd-201:4": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"NEEDS_FIX\",\"finding\":\"race condition writing the shared cache in src/x.js:17\"}",
      "fix:bd-201:5": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/x.js\"]}",
      "re-review:bd-201:5": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"n\":1,\"status\":\"NEEDS_FIX\",\"finding\":\"race condition writing the shared cache in src/x.js:17\"}",
      "adjudicate:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"decision\":\"BLOCKED\",\"ruling\":\"real race condition with no test coverage for the interleaving; must not merge\"}",
      "breaker-blocker:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-201\",\"status\":\"BLOCKED\",\"blockerBead\":\"bd-210\"}",
      "triage:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"decision\":\"ESCALATE\",\"detail\":\"race condition confirmed load-bearing by the breaker adjudicator; needs a human decision on the caching strategy\"}",
      "notify:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"sent\":true}",
      "ledger-append:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}"
    }
  }
}
```

If a future structural edit changes this script, re-run with these args, confirm the same shape (or
update it deliberately alongside the edit that changed it), and replace the figures above — same
discipline as the canonical scenario's own baseline. Fix-round-1, fix-round-2, and the final fix
round were all such edits: **`wf_453a6604-52e`'s 24/0 is superseded history** (see "Confirmed
against the post-Task-5, pre-fix-round-1 script" above), **`wf_18710e4f-50a`'s 24/0 is likewise
superseded** (see "Confirmed against the current (post-fix-round-2) script" above),
**`wf_3c881af8-70b`'s 24/0 is superseded by the scope fix**, and the CURRENT confirmed shape is
**24 agent calls, 0 errors** (run `wf_caf8953e-374`, see "Confirmed against the scope-fix script"
above). The 22/0 figure above `wf_453a6604-52e` remains pre-Task-5 history, unaffected by this
restatement.

## PARK dryRun scenario (separate baseline)

Review round 3's Critical finding: no run had ever executed the PARK branch (`reviewAndFix`'s
`if (adj.decision === 'PARK')` arm) — both prior scenarios stub the adjudicator as `BLOCKED`. This
is the third, minimal scenario dedicated to it: same one-epic, one-task, five-round shape as the
cap-tripping scenario above, but the adjudicator rules `PARK` instead of `BLOCKED`.

**What this scenario is for:** confirming that a PARK ruling actually reaches `mergePrompt` (the
ONE place a task with a known-open finding legitimately merges), that `parked`/`log()` fire instead
of `breaker-blocker`/`handleBlocker`/`triage`/`notify`, and that the Finish-phase return value and
log line surface the parked id — the exact gap review round 3 found (a `parkRuling` field nothing
read, and a cleared `finding` erasing the evidence). It reuses `bd-301` under a fresh epic
(`bd-300`) rather than reusing `bd-201`, so this scenario's args are fully independent of the
cap-tripping scenario's and can be run on its own.

**What it still cannot prove:** the same C-1/C-3 inspection-only caveat as every other scenario in
this doc (`pick()` never builds `adjudicatePrompt`'s or `mergePrompt`'s real dispatch text under
`dryRun: true`) — plus, specifically, whether a *real* adjudicator dispatch actually renders the
"apply SKILL.md's breaker section exactly as written, do not use any other criterion" and "BLOCKED
if ANY open finding is load-bearing" instructions into its prompt text; that is verified only by
reading `adjudicatePrompt`'s definition directly, same as `fixPrompt`'s finding-rendering caveat
above. **It also does not exercise a malformed adjudicator response.** This scenario's
`adjudicate:bd-301` stub returns the exact, well-formed token `"PARK"` — it says nothing about what
happens if a real adjudicator returns anything else (a paraphrase, a typo, an empty string). By
inspection, `reviewAndFix`'s `if (adj.decision === 'PARK') { ... } else { ...file a blocker bead...
}` means anything that isn't the literal string `"PARK"` falls to the `BLOCKED` branch — the safe
direction, matching C-3's fail-closed philosophy elsewhere in this file — but no dryRun demonstrates
that; it is, and remains, verified only by reading the `if` statement itself.

| Stub key | Canned output (`<json>` content) | Exercises |
|---|---|---|
| `read-ledger` | `{text:""}` | I1: the one-time Resume-phase read — fresh epic, nothing reconstructed |
| `close-epics` (array, 2 entries) | `{rootClosed:false,closedThisRun:[]}` twice | root stays open (this scenario's canned world doesn't bother modeling epic closure after the one child merges — same simplification the other two scenarios make) |
| `bd-ready` (array, 2 entries) | `{ids:["bd-301"]}` then `{ids:[]}` | round 1 supplies the one task; round 2's empty set drains the loop |
| `plan` | `{planPath:"...", mapping:[{n:1,id:"bd-301",files:["src/y.js"]}]}` | single-task, single-bucket mapping |
| `brief:bd-301` | `{id:"bd-301",n:1,status:"BRIEFED",files:["src/y.js"],branch:".worktrees/epic-bd-300-integration--task-bd-301",base:"<40-char-sha>"}` | brief stage, unblocked |
| `implement:bd-301` | `{id:"bd-301",n:1,status:"IMPLEMENTED",files:["src/y.js"],branch:"..."}` | implement stage, unblocked |
| `review:bd-301` | `{id:"bd-301",n:1,status:"NEEDS_FIX",files:["src/y.js"],finding:"the retry backoff constant is a magic number instead of a named config value"}` | the initial review — a deliberately contestable, non-load-bearing-flavored finding (unlike the cap scenario's race condition), motivating the PARK outcome below |
| `fix:bd-301:1` … `fix:bd-301:5` | `{id:"bd-301",n:1,status:"FIXED",files:["src/y.js"]}` (all 5 identical in shape) | all 5 rounds dispatch, same as the cap scenario |
| `re-review:bd-301:1` … `re-review:bd-301:5` | `{id:"bd-301",n:1,status:"NEEDS_FIX",finding:"the retry backoff constant is a magic number instead of a named config value"}` (all 5) | never `CLEAN`, so the loop runs the full 5 rounds |
| `adjudicate:bd-301` | `{id:"bd-301",decision:"PARK",ruling:"style-only finding, not load-bearing and doesn't reveal a plan defect; safe to merge as-is"}` | **the PARK arm** — the one branch neither other scenario exercises |
| `merge:bd-301` | `{id:"bd-301",merged:true,head:"<40-char-sha>",mergeBase:"<40-char-sha>"}` | the PARK ruling reaches `mergePrompt` — a task with a known-open finding merging, the ONE legitimate path for that in this script; `head` (fix-round-1) and `mergeBase` (Fix 3, final fix round) together render the ledger's commit-range line below |
| `ledger-append:bd-301` | `{appended:true}` | I1: the merge-gate `ledger-append` dispatch — `Task 1 (bd-301): complete (commits <mergeBase7>..<head7>, 1 parked — ruling: ... — finding: ...)`, SKILL.md's `<K> parked` completion-line variant (fix-round-1: now also carries `r.finding`, not only the ruling, and the commit range instead of the bare word "merged"; Fix 3, final fix round: the range's first half is `mergeBase`, not `base`) |
| `final-review` | `{summary:"stub: 1/1 task merged; bd-301 parked with a ruling",verdict:"conditional-pass"}` | dispatched because `completed.length` is 1, not 0 |

**No `breaker-blocker:bd-301`, `triage:bd-301`, or `notify:bd-301` key exists in this scenario's
args** — all three are part of the test. A PARK ruling never reaches `handleBlocker` at all (it
returns `{...rv, status:'CLEAN', ...}` directly from `reviewAndFix`, the same shape a genuinely
clean review returns), so none of the blocker-path dispatches should ever fire. If any of the three
is ever requested under this scenario, something regressed: the adjudicator's PARK decision failed
to short-circuit the blocker path.

**Assertions:**
- `adjudicate:bd-301` dispatches exactly once, after `re-review:bd-301:5`.
- `merge:bd-301` dispatches — this is the assertion that distinguishes this scenario from the cap
  scenario: a PARK ruling reaches `mergePrompt`, a BLOCKED one never does.
- `completed` is `["bd-301"]`, `parked` is `["bd-301"]` (both — a parked task IS a completed one;
  `parked` marks WHICH completed tasks merged despite a known-open finding, it isn't a separate
  quarantine list the way `escalated` is), `escalated` is `[]`, `pendingRetry` is `[]`.
- The Finish-phase log line reads `... Parked (merged with an overruled finding): 1.` and a
  `PARKED bd-301: ...` line was logged earlier, from inside `reviewAndFix`, distinct from and
  earlier than the Finish-phase summary line.
- Expected dispatch count (I1: `read-ledger` 1 + `close-epics` 2 + `bd-ready` 2 + `plan` 1 +
  `brief` 1 + `implement` 1 + `review` 1 + `fix` 5 + `re-review` 5 + `adjudicate` 1 + `merge` 1 +
  `ledger-append` 1 (`bd-301`) + `final-review` 1 = **23 agent calls, 0 errors**) — **confirmed by
  re-run**, see below; this was computed by hand before that run and matched exactly. The
  pre-Task-5 confirmed count was 21 (below); the +2 is exactly `read-ledger` and
  `ledger-append:bd-301`.

**Confirmed against the script as it stood through Task 4 — superseded by the post-Task-5 run
below.** Run `wf_058c4b83-631`: **21 agents dispatched, 0 errors** — matching that revision's
expected count exactly. Returned `{completed:["bd-301"], escalated:[], pendingRetry:[],
parked:["bd-301"], stalled:false}` — `bd-301` appears in **both** `completed` and `parked`, exactly
the distinction the Critical fix exists to make: a task that merged with an adjudicator-overruled
finding is now visibly different from one that reviewed clean on the first pass, where before it
was indistinguishable. This branch had never executed before that run. Kept here as history of the
pre-Task-5 engine.

**Confirmed against the post-Task-5, pre-fix-round-1 script — superseded, kept as history.** Run
`wf_941e256b-10b`: **23 agents dispatched, 0 errors** — the exact count predicted by hand above,
before this run occurred. Returned `{completed:["bd-301"], escalated:[], pendingRetry:[],
parked:["bd-301"], stalled:false}` — the same terminal-outcome shape as `wf_058c4b83-631` above,
plus the 2 new ledger dispatches (`read-ledger`, `ledger-append:bd-301`). Hitting 23 exactly means
the run's one terminal outcome (PARK, merged) wrote its `complete (merged, 1 parked — ruling: ...)`
line (the line shape as this script stood when this run executed — see below for how it's changed
since) — a skipped append would have landed at 22. **This does not prove the ledger line format,
real file I/O, or resumed-run reconstruction** — `read-ledger` returned `{text:""}` here too; see
"What these three re-runs do NOT establish" under "dryRun policy" above. This scenario is exactly
where the parked-completion-line fix landed: `r.finding` is now interpolated into that line
alongside `r.parkRuling`, `mergePrompt`/`MERGE` gained `head`, and the line is built through
`ledgerLine()` (fix-round-1) — this run predates all three changes, so it's kept here as history,
same discipline as `wf_058c4b83-631` above it.

**Confirmed against the current (post-fix-round-2) script.** Run `wf_1e32bcd1-71f`: **23 agents
dispatched, 0 errors** — the SAME count as the now-superseded `wf_941e256b-10b` above, confirming
fix-round-2's guard-predicate correction left this scenario's topology untouched (same reasoning as
the canonical scenario's own "confirmed against the current script" writeup above). Returned
`{completed:["bd-301"], escalated:[], pendingRetry:[], parked:["bd-301"], stalled:false}` — the
same terminal-outcome shape as every prior confirmed run of this scenario, now against the script
that also renders the completion line's parked variant with the commit range and `r.finding`
included (unverified by this dryRun's stubbed ledger dispatches, same caveat as always — see
"What these three re-runs do NOT establish"). Like the cap-tripping scenario's own current-script
run, this scenario's `plan` stub always returns a well-formed path, so this run exercises the
divergence guard's ACCEPT path only trivially (by never reaching its reject branch) and adds no new
evidence about the guard beyond what the canonical scenario's `wf_fc56493c-a69` already establishes.

**Confirmed against the final-fix-round script — and why that is not validation.** Run
`wf_ac3e6fae-171`: **23 agents dispatched, 0 errors** — the SAME count and terminal-outcome shape
(`{completed:["bd-301"], escalated:[], pendingRetry:[], parked:["bd-301"], stalled:false}`) as the
now-superseded `wf_1e32bcd1-71f` above. This is the last recording on this scenario; the fix cycle
is closed by decision. Same caveat as the canonical scenario's own writeup of the same name, stated
here as well: this identical count is **not** evidence that Fixes 1–3 work. `mergePrompt`'s stub for
`merge:bd-301` in this scenario's own args (below) was updated in this fix round to include a
`mergeBase` value alongside `head` — the fact that adding an optional field to an already-passing
stub changes nothing about the dispatch count or shape is expected and unremarkable, not a
confirmation that a *real* merge agent computes `mergeBase` correctly, since `pick()` never builds
`mergePrompt`'s real dispatch text under `dryRun: true` regardless of what the stub table says.
Validating Fix 3 specifically, for this scenario's shape, would need a live epic where `bd-301`'s
task branch is rebased after at least one *other* task has already merged into the integration
branch — exactly the case this scenario's single-task setup cannot represent no matter how its stub
is edited.

**Confirmed against the scope-fix script (the scope fix — see "Resolved in this branch").** Run `wf_f18d307b-83e`:
**23 agents dispatched, 0 errors**, terminal shape `{completed:["bd-301"], escalated:[],
pendingRetry:[], parked:["bd-301"], stalled:false}` — identical to `wf_ac3e6fae-171` above, which
becomes superseded history. Its logs carry the PARK ruling and the merge-gate `PARKED bd-301: …
(open finding, merged anyway: …)` line, so the parked-with-a-ruling path survived the edit
intact. The scope fix touched neither adjudication nor the merge gate; this run is here because
the document's own rule requires it, not because a change was expected.

**All three scenarios have since been re-run against the scope-fix script and land at the same
three counts** (`wf_cb63ecb9-492` 31/0, `wf_caf8953e-374` 24/0, `wf_f18d307b-83e` 23/0). The
paragraphs immediately below were written for the final-fix-round runs; every claim and every
non-claim in them carries over unchanged, since the scope fix moved prompt TEXT and left dispatch
topology alone.

**All three baselines were confirmed against the final-fix-round script — the last recording
before the scope fix; that fix cycle is closed by decision.** The canonical scenario (`wf_ea0a2284-96b`, 31
agents, 0 errors), the cap-tripping scenario (`wf_3c881af8-70b`, 24 agents, 0 errors), and this PARK
scenario (`wf_ac3e6fae-171`, 23 agents, 0 errors) each hit exactly the same count and
terminal-outcome shape as their now-superseded post-fix-round-2 predecessor (`wf_fc56493c-a69` 31,
`wf_18710e4f-50a` 24, `wf_1e32bcd1-71f` 23) — which themselves matched their post-Task-5/
pre-fix-round-1 predecessor before that (`wf_b337b535-bd4` 31, `wf_453a6604-52e` 24,
`wf_941e256b-10b` 23). `wf_79a00109-4ff` — the canonical scenario run against fix-round-1's
still-broken predicate, which died on the first Plan dispatch before any task was briefed — remains
kept as history of that specific defect (see "the canonical dryRun run immediately after
fix-round-1" above), not as a baseline for anything. The full superseded-history chain for each
scenario (pre-Task-5 → post-Task-5/pre-fix-round-1 → post-fix-round-2 → final) remains recorded
above each scenario's own writeup, same discipline this doc has applied since `wf_171ab5c1-339`.

**State this precisely, here where the final figures are recorded, not only inside each scenario's
own writeup: these three unchanged counts are not evidence that Fixes 1–3 work.** Fixes 1–3
(idempotent `taskBriefPrompt`, merge-base-derived `base` on a re-entered worktree, `mergeBase`-derived
ledger ranges) live entirely in `taskBriefPrompt`'s and `mergePrompt`'s dispatch TEXT and in real git
semantics — `pick()` never builds either function's real prompt under `dryRun: true`, so all three
re-runs could not have told the fixed script apart from a version where `taskBriefPrompt` still
unconditionally attempted a fresh `git worktree add` or `mergePrompt` never captured `mergeBase` at
all. What an unchanged count across all three scenarios *does* confirm — the same narrow claim
fix-round-2's own unchanged counts made for its one-`if`-condition fix — is that Fixes 1–3 did not
perturb dispatch topology: no call site was added, removed, or reordered, and the one schema change
(`mergeBase` on `MERGE`) is additive and optional. Nothing more.

**What would actually validate Fixes 1–3, stated once here plainly, since it cannot be a dryRun
scenario in this file:** each defect these fixes address only manifests on the SECOND touch of a
specific piece of real git state, which a canned `pick()` stub cannot model. Fix 1 needs a genuine
restart where the task's worktree path and branch already exist on disk when the brief dispatch
runs. Fix 2 needs that same re-entered branch to already carry a prior attempt's real commits, so
`HEAD` is demonstrably not a pre-implementer commit. Fix 3 needs a live rebase where at least one
OTHER task has actually merged into the integration branch between this worktree's cut and this
task's own merge, so the old `r.base..head` range would provably span that other task's commits and
`mergeBase..head` provably would not. None of these can be added to this file as a new stub
scenario — they are properties of a real, multi-dispatch git history, not of one canned JSON
response. The next step for corroborating Fixes 1–3 is a live epic run through an actual restart,
not another entry in the stub table below.

**What these three runs collectively prove, and what they still don't.** Together they confirm
terminal-outcome routing (a task reaches exactly one of: merged clean, quarantined BLOCKED,
resolved-pending-retry, or merged-with-a-parked-ruling), the round-cap arithmetic (exactly 5 rounds,
the adjudicator dispatched exactly once at the cap either way), and that each outcome leaves its own
distinct artifact in the return value (`completed`/`escalated`/`pendingRetry`/`parked`) rather than
collapsing into an indistinguishable shape. **None of the three proves anything about prompt
TEXT**, for the same structural reason repeated at every scenario above: `pick()` never calls a
real prompt builder under `dryRun: true`, so no number of passing dryRuns — three, or three hundred
— can ever demonstrate that the sticky finding (C-1) actually reaches a real dispatch string, that a
real re-reviewer's differently-worded verdict is correctly handled by the fail-closed loop condition
(C-3), or that a real adjudicator dispatch actually receives SDD's rubric by reference rather than a
paraphrase of it (the de-glossed `adjudicatePrompt`, review round 3). This is not a gap these
scenarios could ever be extended to close — it is what `dryRun: true` structurally cannot prove, by
design (see "dryRun policy" and "What this dryRun proves and does not prove" above). Those three
claims remain, and will always remain, verified only by reading the relevant function definitions
directly, or by a live run. **A fourth claim joins that list with Task 5's ledger work**: all three
runs' `read-ledger`/`ledger-append` dispatches were canned stubs, so together they confirm only that
each terminal outcome dispatches its ledger write at the right point and in the right count (see
"What the three re-runs establish, precisely" and "What these three re-runs do NOT establish" under
"dryRun policy" above) — never the line format actually rendered, never a real file being written or
read, and never a resumed run actually reconstructing `completed`/`escalated`/`parked`/`pendingRetry`
from real ledger content (every `read-ledger` stub across all three runs returned empty text). A
resumed-run scenario with non-empty, multi-outcome ledger content remains unwritten. **A fifth claim
joins that list with fix-round-2's divergence guard**: all three current-script runs' `plan` stubs
return a well-formed, already-resolved `planPath` (that's what a stub is — a canned value, not a
computation), so none of them exercises the guard's reject branch, and none of them proves a REAL
planner dispatch produces a path the guard accepts in the first place — only that the guard's `if`
condition, given such a path, doesn't wrongly reject it (verified directly against the canonical
scenario's `wf_fc56493c-a69`, and by hand-checking the predicate both directions before that re-run
— see "What this guard, and these re-runs, do NOT prove" earlier in this section). Whether a live
opus planner dispatch honors `planner-prompt.md`'s parameterized filename remains a live-run-only
question, same structural limit as the other four claims above.

```json
{
  "epicId": "bd-300",
  "integrationBranch": "epic-bd-300-integration",
  "dryRun": true,
  "config": {
    "concurrency": 4,
    "models": { "planner": "opus", "implementer": "sonnet", "reviewer": "sonnet", "mechanical": "sonnet", "triage": "opus", "finalReview": "opus", "fixEscalation": "opus" }
  },
  "prompts": {
    "stubs": {
      "read-ledger": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
      "close-epics": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"rootClosed\":false,\"closedThisRun\":[]}"
      ],
      "bd-ready": [
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[\"bd-301\"]}",
        "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"ids\":[]}"
      ],
      "plan": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"planPath\":\".worktrees/epic-bd-300-integration/.superpowers/sdd/bd-300-plan/bd-300-plan.md\",\"mapping\":[{\"n\":1,\"id\":\"bd-301\",\"files\":[\"src/y.js\"]}]}",
      "brief:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"BRIEFED\",\"files\":[\"src/y.js\"],\"branch\":\".worktrees/epic-bd-300-integration--task-bd-301\",\"base\":\"fffffff6666666666666666666666666666666\"}",
      "implement:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"IMPLEMENTED\",\"files\":[\"src/y.js\"],\"branch\":\".worktrees/epic-bd-300-integration--task-bd-301\"}",
      "review:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"NEEDS_FIX\",\"files\":[\"src/y.js\"],\"finding\":\"the retry backoff constant is a magic number instead of a named config value\"}",
      "fix:bd-301:1": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/y.js\"]}",
      "re-review:bd-301:1": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"NEEDS_FIX\",\"finding\":\"the retry backoff constant is a magic number instead of a named config value\"}",
      "fix:bd-301:2": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/y.js\"]}",
      "re-review:bd-301:2": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"NEEDS_FIX\",\"finding\":\"the retry backoff constant is a magic number instead of a named config value\"}",
      "fix:bd-301:3": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/y.js\"]}",
      "re-review:bd-301:3": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"NEEDS_FIX\",\"finding\":\"the retry backoff constant is a magic number instead of a named config value\"}",
      "fix:bd-301:4": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/y.js\"]}",
      "re-review:bd-301:4": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"NEEDS_FIX\",\"finding\":\"the retry backoff constant is a magic number instead of a named config value\"}",
      "fix:bd-301:5": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"FIXED\",\"files\":[\"src/y.js\"]}",
      "re-review:bd-301:5": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"n\":1,\"status\":\"NEEDS_FIX\",\"finding\":\"the retry backoff constant is a magic number instead of a named config value\"}",
      "adjudicate:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"decision\":\"PARK\",\"ruling\":\"style-only finding, not load-bearing and doesn't reveal a plan defect; safe to merge as-is\"}",
      "merge:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"merged\":true,\"head\":\"f6f6f6f6666666666666666666666666666666\",\"mergeBase\":\"eeeeeee5555555555555555555555555555555\"}",
      "ledger-append:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
      "final-review": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"summary\":\"stub: 1/1 task merged; bd-301 parked with a ruling\",\"verdict\":\"conditional-pass\"}"
    }
  }
}
```

If a future structural edit changes this script, re-run with these args, confirm the same shape (or
update it deliberately alongside the edit that changed it), and replace the figures above — same
discipline as the other two scenarios' baselines. Fix-round-1, fix-round-2, and the final fix round
were all such edits (the final round's own edit here was data-only — adding `mergeBase` to the
`merge:bd-301` stub — but the round is still listed for the same reason "recorded, not illustrative"
demands it): **`wf_941e256b-10b`'s 23/0 and `wf_1e32bcd1-71f`'s 23/0 are both superseded history**
(see "Confirmed against the post-Task-5, pre-fix-round-1 script" and "Confirmed against the current
(post-fix-round-2) script" above), **`wf_ac3e6fae-171`'s 23/0 is superseded by the scope fix**, and
the CURRENT confirmed shape is **23 agent calls, 0 errors** (run `wf_f18d307b-83e`, see "Confirmed
against the scope-fix script" above). The 21/0 figure above `wf_941e256b-10b` remains pre-Task-5
history, unaffected by this restatement.
