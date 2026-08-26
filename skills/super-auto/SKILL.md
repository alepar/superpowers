---
name: super-auto
description: Use when taking a feature from a raw idea all the way to finished code in one invocation, optionally unattended, in a repo with a beads (`bd`) tracker. Not for reviewing an existing PR or design (that is super-roast) and not for executing an epic that already has a task tree (that is super-code).
---

# super-auto

Drive a feature from a raw idea to finished, reviewed code in one invocation, by sequencing
`super-design` → `super-roast` (design) → `super-code` → `super-roast` (PR) → a
fix loop → report → `finishing-a-development-branch`, with an optional autonomous mode for
everything from `super-design`'s coverage loop passing onward.

**Core principle:** `super-auto` owns sequencing and nothing else. Every phase already has an
owner; this skill invokes them, threads four flags through them, carries parked escalations, and
writes the final report.

## Boundary

> If a change would improve how a *phase* works, it belongs in that phase's skill, not here.
> `super-auto` may only grow in the sequencing dimension.

Never:
- Re-implement `super-design`'s adversarial review loop — opt-in, caps at 3; answer its offer, don't
  duplicate it.
- Decide a finding's severity, or adjudicate a roast finding.
- Copy an artifact another skill owns — hold pointers, per `./run-state.md`.

## Pre-flight

**A beads (`bd`) tracker is required. Check before anything else — before the flags, before the run
directory, before Resume.** Run `bd --version` **and** a real tracker query (`bd list --limit 1`) — the first proves the binary
exists, the second proves this repo has a tracker initialized. If either fails, stop and say so:

> `super-auto` needs a beads tracker and this repo has none. Options: install `bd` and re-invoke, or
> drive it by hand with `superpowers:super-design`, which in no-beads mode plans and executes the
> tree itself.

Once `bd` is confirmed, work in this order — it matters, because two of these steps write to the
repo and the other two decide whether they should:

1. **Resume glob** (§Resume). A run already in flight is resumed, and everything below is skipped.
2. **Flags** (§Inputs) — fresh runs only; a resume never re-asks.
3. **Create this run's workspace and branch** (§Run directory).
4. **Create the run directory and `run.md`** inside that worktree, on that branch. Write exactly
   this, filled in — copy the shape, do not compose your own:

   ```markdown
   # super-auto run — YYYY-MM-DD-<slug>

   flags: planOneShot=<t/f> skipPlanRoast=<t/f> skipCodeRoast=<t/f> autonomous=<t/f>
   phase: design

   idea: <the invocation's idea text, verbatim>
   branch: super-auto/<slug>
   base: <the branch this run merges back into>
   ```

   Every later field is added under these, with the names and shapes `./run-state.md` defines —
   **its field names are the contract, not a suggestion**: `epic`, `spec`, `roast-design`,
   `roast-code`, `roastDesignRound`, `roastCodeRound`, `parked`, `approvals`, `codeBuckets`, and the
   phase tokens from its enum. Inventing a clearer-looking name or a richer phase word makes the
   file unreadable to every later phase, to the report, and to a resume — all of which read these
   names literally.

Creating the branch before step 1 would collide a resumed run with its own existing branch, and
`run.md` cannot be written before step 2 because the flags are among the first things it records.

Hard stop, not a fallback: every load-bearing structure here — the epic, `run.md`'s pointers,
phase 5's fix beads, the report's `codeBuckets` — is a tracker structure. Sequencing a no-tracker
run is a different skill's job, not a degraded mode of this one.

**A run ends at the merge.** Idea → design → code → review → fixes → merged is the whole scope.
Work that only begins once the code is live — deploying it, activating it in production, running a
campaign on it, operating it toward a target — is follow-on work outside any `super-*` invocation,
and must not be in the epic phase 3 drains (`super-design`'s §Decomposition). An epic holding such
tasks cannot drain and cannot close, so the run can never report completion however well every
other phase went.

## Resume

On invocation, glob `docs/superpowers/runs/*-<slug>/run.md` — in the current checkout **and in every path `git worktree list` reports**, since a run's directory lives on its own branch and a session started from `base` cannot otherwise see it. (On a resume phrased as a resume, this glob usually misses — the `idea:` scan below is the primary matcher, not the fallback.) — the date prefix is fixed at phase 1,
not today's (see Run directory). No exact match: enumerate `docs/superpowers/runs/*/run.md` **across the same
places — the current checkout and every `git worktree list` path** — read each `idea:` line, and
compare it against this invocation's text before concluding no run exists — the
same idea kebab-cased two different ways must not read as two different runs. **Resolve the
comparison, don't leave it to feel:** exactly one candidate sharing a content noun phrase with the
invocation resumes; zero starts a fresh run; **two or more stops and asks which** — that is not a
mid-run question, no work is in flight yet, and picking wrong resumes the wrong feature. **A worktree is not the only place a run can be.** If both globs come up empty, check the branches
directly — `git for-each-ref --format='%(refname:short)' refs/heads/super-auto/`, then
`git ls-tree --name-only <branch> docs/superpowers/runs/` to learn the directory name (its date
prefix is the run's, not today's), then `git show <branch>:docs/superpowers/runs/<dir>/run.md` —
before concluding no run exists. A worktree
that was pruned, a fresh clone, or a different machine leaves the branch intact and the worktree
gone; discovery that only looks at worktrees calls that run missing and starts a second one over
live work.

**On a match, switch into that run's worktree before writing anything** — or re-create one on
`run.md`'s `branch` if it is gone (`git worktree add <path> <branch>` — **no `-b`**: the branch
exists, and the `-b` form fails on it). Every later write (specs, roast reports, `run.md`, `report.md`)
must land on that branch, and a resume that stays in the checkout it was invoked from puts all of it
on the default branch, where phase 7 will not merge it.

**Hand `super-design` the recorded `idea:`, not the words the user just typed.** A resume is phrased
as a resume ("keep going on the X work"); passing that verbatim points the root brainstorm at a
meta-instruction instead of the goal.

A resume at `phase: fix-loop` re-queries the open fix beads under the epic and re-enters
`super-code` with them; findings recorded in the latest `roast-code` report but missing as beads
are re-filed first — the report is durable, the filing may not have finished.

A resume at `phase: code` whose epic is already closed has nothing to dispatch — `bd ready` comes
back empty by construction. Skip to phase 4 and source Implemented from the closed beads; do not
read an empty ready set as a failed run.

A match resumes from its recorded phase
(`./run-state.md`) — never re-ask the flags, never reset a counter. `run.md` is created the moment
the run directory exists, with `phase: design` and the four flags already written — before
`super-design` itself runs — so a crash mid-run still resumes without re-asking. Written again
after every phase transition and after every roast round — by `super-auto` for phases 3–7, and by `super-design` for phases 1–2, which run inside its invocation (see below).

**Phases 1 and 2 run inside one `super-design` invocation, so `super-design` writes `run.md` during
them.** `super-auto` holds no control between invoking it and its return — which is the longest,
most expensive stretch of a run, and the likeliest place for a session to end. Rather than leave that
window unrecorded, **hand `super-design` the `run.md` path** along with the artifact-directory
override; its §Run-State File contract has it record the spec path, the epic id, each
roast report, the roast round count and each gate answer **as each becomes true**, plus the
`roast-design` phase token when that stage begins. (`branch` and `base` are already recorded — you
created the workspace in pre-flight.)

Field ownership is split and does not overlap: `super-design` writes what phases 1–2 produce;
`super-auto` writes everything from phase 3 on (`codeBuckets`, `roast-code`, `roastCodeRound`, and
every phase token from `code` onward) — plus `roast-design (skipped)` when `skipPlanRoast` is set,
since a stage that never begins is one `super-design` never writes a token for. Neither rewrites
the other's fields.

**This makes the state durable; it does not make re-entry idempotent.** A resumed run still re-enters
`super-design` at step 1, and knowing that `spec:` and `epic:` already exist is not the same as
`super-design` skipping the work that produced them — that guard lives in `super-design`, not here.
Treat a resume at `phase: design` accordingly: the recorded pointers plus the tracker (the epic, its
children, their `sp:needs-design` labels) say where the tree actually is, and `super-design`'s cursor
is a query over that rather than session memory.

## Inputs

**All four default to `false`.** Ask only for the ones the invocation leaves genuinely open, and
take the default for anything the user shows no interest in rather than turning a start into a quiz.
Note what `autonomous=false` on its own does *not* mean: with `planOneShot=false` the design phase is
collaborative regardless, so "run it autonomously" still buys an interactive design and an unattended
everything-after — say so when confirming, since the opposite is the natural reading.

Four flags, collected once, before any phase runs (and skipped entirely on a resume — see
Resume above), in **one batched question** — never four sequential ones — and only asked for
whichever aren't already stated in the invocation.

| Flag | Effect |
|---|---|
| plan one-shot | Stated to `super-design`, which relays it to every `brainstorming` iteration it runs (root spec, each subepic) — Mode B instead of Mode A |
| skip plan roast | **Stated to `super-design`, either way** — it pre-decides the adversarial-review offer on the settled tree (skip or run), so the user, who already answered here, is never asked again |
| skip code roast | Omits the final PR-mode roast entirely |
| autonomous | **Stated to `super-design`** — it owns both design gates and its own roast loop, and its autonomous behavior is conditional on being told. You are needed at the design gates (top split, coverage arbitration); after the design is approved no query interrupts work in flight, and a resume replays those approvals rather than re-asking. The run still hands back for the integration decision when every bead is done (see Autonomous mode) |

## Phase sequence

`super-auto` owns every transition explicitly — it never lets a phase chain into the next on its
own, or the flags strand and the sequence is lost. Each row's parenthetical is the exact `run.md`
`phase` token from `./run-state.md`; the two files name the same seven phases.

| # | Phase (`run.md` token) | Skill | Note |
|---|---|---|---|
| 1 | Design (`design`) | `super-design` | Pass all seven: the goal (**on a resume, `run.md`'s recorded `idea:`**), the artifact-directory override, the `run.md` path **together with `./run-state.md`, whose field names and formats govern every write** (a co-writer that never sees the contract invents an incompatible one), the `roast-design` phase token to write when that stage begins, the design mode from `planOneShot`, `autonomous` and `skipPlanRoast`, and — resuming mid-roast — the starting round. **Say the hand-off is `super-auto`'s.** It drives the root brainstorm, decomposition, every subepic brainstorm, the coverage loop and the design roast, recording into `run.md` as it goes. |
| 2 | Design roast (`roast-design`) | `super-roast` (design) | Runs **inside** phase 1's `super-design` invocation, via its own offer; cap-3 fix loop. `super-auto` holds no control while it runs, so `super-design` writes `phase: roast-design`, the report paths and `roastDesignRound` into `run.md` itself, per its §Run-State File contract — see above. |
| 3 | Code (`code`) | `super-code` | The integration branch **is this run's branch**, and its integration worktree **is this run's worktree** — both exist already, from pre-flight (§Run directory). Create nothing; pass them — **the worktree's real path explicitly, as `integrationWorktree`**, never left for `super-code` to derive: the run branch `super-auto/<slug>` contains a slash, and `super-code`'s no-arg fallback derives a slash-collapsed `.worktrees/` path that matches no worktree this run ever created (mismatched by construction on every handoff before this field existed). (`branch` was recorded at run-directory creation.) Autonomous or interactive per flag. **Say in the invocation that `super-auto` owns the finish** — there is no config flag, and without it `super-code` merges and deletes the worktree the report still needs. |
| 4 | Code roast (`roast-code`) | `super-roast` (PR) | Against the live integration branch, diffed against `run.md`'s `base`. Pass the run directory as the report-location override, **the iteration number from `roastCodeRound`** (without it round 2's report overwrites round 1's file), **`autonomous` when the run is** (without it super-roast pauses for a human at its loop exits), and on rounds ≥2 the prior report — without which the round re-litigates what the last one already cleared |
| 5 | Fix loop (`fix-loop`) | — | Reopen the epic (`bd update <epicId> --status open`), file confirmed findings as beads — `super-design`'s §Decomposition four fields (title, short description, **files-touched hint**, blocking deps; without the files hint every fix bead runs alone) with Red Flags' flag triple — re-enter `super-code`, loop to phase 4; cap 3, stop early if Blocking count doesn't shrink (thrash), **or when the roast verdict carries `[converged]`** (zero Blocking of any provenance on a non-degraded round — the roast's own convergence signal; park remaining sub-Blocking findings into `report.md` as a punch list instead of another fix round) |
| 6 | Report (`report`) | — | Write `report.md` per `./report-prompt.md`, before anything is torn down. Then invoke `superpowers:upstream-feedback` (this run is the outermost invocation — its analysis pass runs here, once; the proposal surfaces at the phase-7 menu, never mid-run). Throughout all phases: append friction events to `<run-dir>/friction.md` the moment they happen, per that skill's format |
| 7 | Finish (`finish`→`done`) | `finishing-a-development-branch` | Merge + clean up, once, gated per below. Invoke it **from this run's worktree**, supplying `run.md`'s `branch` as the feature branch to merge and `base` as its destination, so neither is asked nor inferred from the cwd. Present `report.md` alongside the menu. **The menu itself is always the human's, autonomous or not** — see "Where the zone ends". If the suite fails there, rewrite `report.md`'s status line to `stalled at phase finish` before stopping — the report already on disk says otherwise. |

Phase 7's gate is three conditions, not one: `report.md` exists, `run.md`'s `phase` reads `report`,
and its status line does not begin `stalled` — existence alone is not enough. A stall at any phase
still writes `report.md` (`status: stalled at phase X`) but never advances `phase` to `report`; see
`./run-state.md`'s phase-2 entry for the one remaining case (a stall at phase 6 itself) the third
condition exists to close.

## Autonomous mode

> Autonomy begins the moment the design is approved — `super-design`'s coverage loop passing is that moment on a first run, and a replayed approval is that moment on a resume.

Not the settled tree, which precedes that loop's own human arbitration (accepting GAPs, ruling on
ORPHANs, ruling on UNOWNED-SEAMs and NARRATIVE-EDGEs) — parking can't serve a decision that hasn't been made yet, so
phase 2 (running inside the `super-design` invocation, after coverage passes) is already inside
the zone.

In the autonomous zone, `super-design`'s and `super-roast`'s own mandated human pauses are answered,
not asked, and the road not taken is parked (`run-state.md`'s `degraded-verdict` kind):

- **The offer to invoke `super-roast` at all** (phase 2): accepted without asking — **unless `skipPlanRoast` is set, which wins.** An explicit flag beats a mode default; otherwise the flag would be unreachable in exactly the configuration (`skipPlanRoast` + `autonomous`) the cheap validation run uses.
- **"Re-roast with a raised `config.panelCap`?"** (a beyond-cap finding): answered **no** — proceed
  with the findings in hand; the unexplored raise is parked, not silently dropped.
- **The `clean [low coverage]` / `clean [panel-capped: N unverified]` three-way gate**, at both
  roasts: answered **proceed**; the qualifier is parked.
- **"Both exits pause and summarize for the human"** (both loops): satisfied by recording whatever
  was open in `run.md` and surfacing it in the report, not by pausing.
- Fix designs are applied without asking or waiting — the request to run autonomously *is* the
  approval.
- Nested brainstorms triggered by a fix run in Mode B.
- Escalations and beyond-cap items are parked and surfaced **in the final report**, never
  auto-adjudicated and never queried about mid-run.
- `super-code` runs in its own autonomous mode.

**Where the zone begins: when the design is approved, not at a phase number.** The design gates
are the human's — `super-design`'s top-split gate (the child list and its `LEAF`/`PROMOTE` verdicts)
and its coverage arbitration (accepting `GAP`s, ruling on `ORPHAN`s, ruling on `UNOWNED-SEAM`s
and `NARRATIVE-EDGE`s).
None of the four is auto-answerable: an `ORPHAN` asks whether a task is scope creep or the goal
was underspecified, an `UNOWNED-SEAM` asks who should own a boundary neither side claimed, and a
`NARRATIVE-EDGE` asks whether a recorded ordering was ever real —
none is a question a run can answer about itself; the same replay rules apply
(a recorded disposition replays, an unrecorded one is asked). **Say this when confirming the flags** — `autonomous` means
"I will need you at the design gates, then it runs to the end unattended," and a user who reads it
as "no questions at all" is surprised at the first gate.

**They are the human's once, not once per session.** Every gate answer is recorded in `run.md`
(`./run-state.md` item 7) with the shape it approved. A resumed run **replays** a matching approval
rather than re-asking — a session that ends after the design was approved must not come back and
re-solicit it. Replay only on an exact match: if the child set or the verdicts changed since, the
approval is stale, so ask again and say what changed. Anything unrecorded was never approved, and a
replay is never widened into "the human approved this run."

**Where the zone ends: when the work is done, not at a phase number.** Autonomy means no question
interrupts work that is still in progress. It does **not** mean the run merges itself. Once every
bead under the epic has reached a terminal state and `report.md` is written, the run has finished
what it was asked to do — it presents the report and hands control back, and the merge of the
integration branch into the base branch is the human's call like any other.

That hand-back is **not** a violation of "no questions," because there is no work left to
interrupt: a run sitting at the integration decision is *done*, not blocked. Read it the other way
round and the rule is sharper — **never stop for a question while a bead is still unresolved.**
Every bullet above exists to keep a mid-run pause from happening; none of them licenses merging to
the base branch unattended, which is the one action in this pipeline a human cannot cheaply undo.

Merges *into* the run's own integration branch are a different thing and need no confirmation:
`super-code` performs them itself, serially, and never presents a menu for them.

> If a roast fix loop caps out at 3 with Blocking findings unresolved, autonomous mode parks them
> rather than halting. A run can finish having merged code with known Blocking findings — which is
> why the report leads with status.

## Run directory

All artifacts of one run live under `docs/superpowers/runs/YYYY-MM-DD-<slug>/`. **Slug and date are both fixed once, before phase 1**:
take the idea's **content words, drop stopwords and any flag clause, keep the first three to five,
kebab-case them** — "add a per-tenant rate limiter to the public API, run it autonomously" gives
`per-tenant-rate-limiter`. Concrete because Resume globs on it: two sessions that slug one idea
differently create two runs for one feature, which is the failure Resume's fallback exists to catch — `brainstorming` has not produced
a title yet, and the directory must exist to be handed to `super-design` as an override at phase 1's
invocation, which relays it to every `brainstorming` iteration it runs (root and nested). `super-roast` uses the report-location
override added for this.
State and report follow `./run-state.md` and `./report-prompt.md` — do not restate them here.

**One workspace, one branch, for the whole run.** Create them yourself, in pre-flight, *before*
phase 1 — via `superpowers:using-git-worktrees`, on a branch named for the run (`super-auto/<slug>`). **State
the workspace decision as a declared preference when you invoke it** — that skill asks for consent
only when no preference was given, and asking is the first thing a user who said "run it
autonomously" would see.
Record the branch it was cut from as `base`. Then create the run directory and `run.md` **inside that
worktree, on that branch**, and do every subsequent write there: specs, roast reports, further
`run.md` writes, `report.md`.

Creating it here — not letting `brainstorming` do it — is what keeps `run.md` singular and the
whole run on one mergeable branch. Two facts to get right at creation:

- **`base` is observed from git, not from intent**: a native worktree tool picks its own base ref
  (often `origin/<default>`, not your checkout's HEAD). After the workspace exists, record **the
  branch name** the run merges back into, confirming the fork point against it with
  `git merge-base <run-branch> <that-branch>` — merge-base yields a commit, which verifies the
  choice but is not the value: phase 7 needs a branch it can check out and merge into.
- **This worktree is yours to remove once phase 7 completes.** `finishing-a-development-branch`'s
  cleanup only owns workspaces under `.worktrees/`; a native tool's lives elsewhere and is declined.
  After the menu is answered, exit the worktree (platform exit tool) and remove it — a branch still
  checked out in a surviving worktree cannot be deleted.

**The integration branch is this same branch.** Pass it to `super-code` as `integrationBranch`, and
this worktree's **real path** as `integrationWorktree` — an explicit contract field, not an
ambient fact `super-code` can infer: its no-arg fallback derives `.worktrees/<branch>` with the
slash in `super-auto/<slug>` collapsed to `-`, which cannot match a worktree created here by
`using-git-worktrees` (native tools put worktrees wherever they put them). `super-code` cuts
per-task worktrees off the branch and merges them back into it serially, exactly as it does for
any caller. (Its `epic-<epicId>-integration` naming is a convention, not a requirement — and the
branch has to exist before the epic id does.)
Nothing about parallel dispatch changes: per-task worktrees still fan out from the integration
branch and still serialize on shared files.

**`base` is the branch the whole run merges back into** — the repo branch this run's worktree was cut
from, usually `main`. It is the one branch name phase 7 hands to `finishing-a-development-branch`,
which merges the run branch into it, once, from this worktree.

**Every link into a run directory carries the full `YYYY-MM-DD-<slug>` name, never the bare slug.**
That includes the `specs/INDEX.md` row for this run, which links to
`../runs/YYYY-MM-DD-<slug>/<the spec's actual filename>` — `brainstorming` names it
`YYYY-MM-DD-<topic>-design.md`, and redirecting the directory does not rename the file, so never
hard-code `design.md`. The date prefix on the directory is not decoration: Resume globs
`runs/*-<slug>/run.md`, so a link written without it points at a directory that does not exist, and
a human following that link concludes the run is missing while the run is sitting on disk.

## Red Flags

**Never:**
- Re-implement a phase's behavior instead of invoking it.
- Auto-adjudicate a roast escalation or a sibling's mandated pause, or fold either into the fix
  queue.
- Ask a question, or wait on a sibling's mandated pause, **while any bead is still unresolved**,
  once `super-design`'s coverage loop has passed and `autonomous` is set. Presenting the finished
  report and the integration decision is not this — that is the run handing back, with no work
  left in flight.
- Merge the integration branch into the base branch without the human's explicit choice, in any
  mode. `autonomous` buys an unattended *run*, never an unattended *merge*.
- Re-ask the four flags, or reset an iteration count, when a resumable `run.md` already exists —
  which is also why `run.md` is created before phase 1, never after it.
- Look for a resumable run by assuming today's date in the run directory's path, or give up after
  one glob miss without also matching on the recorded idea/spec.
- File a phase-5 fix bead without all three of `--parent <root-epic-id>`, `--no-inherit-labels`,
  and `-l sp:<root-epic-id>` together — the same shape `super-design` mandates for every `bd create`.
  Omitting `--parent` does **not** hide the bead from `bd ready` (that query is gated by the label
  alone); it leaves the bead outside the epic's descendant tree, so `bd epic close-eligible` sees
  the epic as closable and **closes it mid-fix**. Omitting `--no-inherit-labels` smears the
  parent's own labels onto the child.
- Invoke `finishing-a-development-branch` on anything less than all three of phase 7's gate
  conditions. The gate governs *entering* phase 7; a resume already reading `phase: finish` is past it — resume or verify the merge rather than re-testing a gate its own phase value cannot satisfy.
- Rely on `super-code`'s returned buckets from session memory once phase 3 has transitioned — read
  `run.md`'s recorded `codeBuckets` instead.
- Report "done" without a status line, or report bare `clean` when a `degraded-verdict` record is
  parked or a roast was skipped — see `./report-prompt.md`.
- Keep a roast iteration count in session memory instead of `run.md` — see `./run-state.md`.
- Move existing flat `specs/`/`plans/` documents into a run directory.

## Known limitations

- **Nothing enforces the workspace rule.** Pre-flight creating the run's worktree and branch is
  the load-bearing assumption behind one `run.md`, an observable `base`, and a phase-7 merge that
  carries the whole run. Nothing checks it happened, and a run that skips it fails far downstream —
  at phase 7, with the report on an unmerged branch.

Documented gaps, deliberately not fixed:

- **Gate order is convention, not enforcement.** Nothing catches an agent that writes `phase:
  finish` before actually confirming phase 7's three conditions; the rule is evaluate, then write.
- **Resume can't distinguish a stall from a plain interruption.** Both leave `phase` at whatever was
  in flight; nothing marks *why* the run stopped there.
