---
name: super-auto
description: Use when taking a feature from a raw idea all the way to finished code in one invocation, optionally unattended, in a repo with a beads (`bd`) tracker. Not for reviewing an existing PR or design (that is super-roast) and not for executing an epic that already has a task tree (that is super-code).
---

# super-auto

Drive a feature from a raw idea to finished, reviewed code in one invocation, by sequencing
`super-design` → `super-roast` (design) → `super-code` → `super-roast` (PR) → a
fix loop → report → `finishing-a-development-branch`, with an optional autonomous mode that runs
from launch to the finished report without stopping.

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

## Ending turns in an autonomous run

This is the one statement of the rule; other sections point here. With `autonomous` set, from
launch (once pre-flight passes) until the phase-7 hand-back, nobody is there to answer; with
`planOneShot` alone, the same holds from launch until the design-ready stop (§Autonomous mode). A
message with no tool call ends your turn, and the run stops until someone notices. In that zone,
don't end a turn in any of these ways:

- A summary that announces the next phase instead of starting it. This includes a sibling skill
  returning with its own closing summary or hand-off step. A return is a transition, not a stop:
  record it in `run.md` and start the next phase in the same message.
- An offer to continue, or an invitation to redirect you.
- A list of decisions when none of them blocks the work. Take the best-supported option, record
  the assumption in `run.md` or park it (§Autonomous mode), and carry on.
- A pause because a phase or milestone finished, or because the turn has run long.

Status notes are welcome. Put them in the same message as your next tool call. Context compaction
is automatic, and `run.md` is the state: after one, re-read it and continue from its `phase`.

While a `super-code` Workflow runs (phase 3 and each fix-loop re-entry), watch it for slowness
exactly as `super-code`'s "Unattended runs" says — one cheap action per check from its closed
list, never a re-plan or a stop — and record each action in `<run-dir>/friction.md` as well as
the ledger.

The stops you want form a closed list; under `autonomous` none of them is mid-run:

1. The pre-flight hard stops (no tracker, a stale skill cache) and an ambiguous resume. All of
   these happen before any work is in flight.
2. The phase-7 hand-back. The report is written, every bead is terminal, and the merge into
   `base` is the human's call.
3. With `planOneShot` and without `autonomous`: the design-ready stop at the end of phase 2
   (§Autonomous mode).

Something deliberately protected from you (a refused permission, a protected branch), or a risky
or destructive action outside the run's own branch, never stops the run: don't take it; skip
that work, record it, and report it as uncovered scope. Never edit permission settings yourself.
If nothing at all can move, write `report.md` as `stalled at phase <phase>` and hand back; the
run has ended, not paused. Everything else that would pause the run is answered or parked per
§Autonomous mode.

## Pre-flight

**A beads (`bd`) tracker is required. Check before anything else — before the flags, before the run
directory, before Resume.** Run `bd --version` **and** a real tracker query (`bd list --limit 1`) — the first proves the binary
exists, the second proves this repo has a tracker initialized. If either fails, stop and say so:

> `super-auto` needs a beads tracker and this repo has none. Options: install `bd` and re-invoke, or
> drive it by hand with `superpowers:super-design`, which in no-beads mode plans and executes the
> tree itself.

**Then check that the superpowers skills this session loaded are current.** The skill text you
are following right now came from the plugin cache, and the cache lags the marketplace source
whenever a release landed since the last update. Do this once, before Resume, with three commands:

1. **Loaded version:** the base directory the Skill tool printed for this skill is
   `<cache>/<marketplace>/superpowers/<version>/skills/super-auto` — take `<marketplace>` and
   `<version>` from that path (`~/.claude/plugins/installed_plugins.json` records the same pair
   under `superpowers@<marketplace>`).
2. **Latest version:** the marketplace's source repo is in `~/.claude/plugins/known_marketplaces.json`
   (`<marketplace>.source.repo`). Read `.claude-plugin/plugin.json` from that repo's default
   branch — `gh api repos/<owner>/<repo>/contents/.claude-plugin/plugin.json --jq .content | base64 -d`
   (or the raw GitHub URL) — and take its `version`. Never consult a local checkout of the
   plugin repo: it exists on one machine only and says nothing about what this session loaded.
3. **Compare.** Equal: say so in one line and go on. Different: the cache is behind. Run
   `claude plugin marketplace update <marketplace>` then `claude plugin update superpowers@<marketplace> -y`,
   then **stop** — the CLI applies an update only on restart, and the skill text already in this
   session is the stale one. Tell the user which version was loaded, which was installed, and
   to start a new session and re-invoke `super-auto`. This happens before the run directory
   exists, so nothing is left half-written; in autonomous mode it is the one pre-flight stop
   that needs no answer, only a restart. Degrade-don't-stop governs the run from launch onward;
   pre-flight checks are the deliberate exception, because a human is present at launch and
   continuing would run the whole job on known-stale instructions. Lookup failed (offline, no `gh`): warn with both
   commands' errors and continue on the loaded version — a stale skill is a degraded run, not a
   blocked one.

**Switching definitions mid-run** happens only when the human explicitly points the run at another
skill source (for example a local checkout under test); that instruction overrides step 2's
local-checkout rule for this run. Record `skillSource: <absolute skills path> @ <sha> (<version>)`
in `run.md` — if `git -C <repo> status --porcelain -- <skills path>` is non-empty, write `<sha>+dirty:<hash>` with `<hash>` = `(cd <skills path> && find . -type f -print0 | sort -z | xargs -0 shasum | shasum | cut -c1-12)`, so the record names the text actually read — then re-read `./run-state.md` and every sibling contract you will write from the new
source, and carry the run on from its recorded phase. A recorded field or ledger line the new
contract no longer defines stays in `run.md` as history, with one `migrated:` line saying what it
maps to now (or `dropped`). Pass the same source as `skillsRoot` to every skill you invoke after
the switch.

Once `bd` and the skill version are confirmed, work in this order — it matters, because two of
these steps write to the repo and the other two decide whether they should:

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

**A resume message that changes something is recorded, not dropped.** If it sets a flag differently
or amends the goal ("…and run it unattended", "skip the code roast", "also cover the admin API"),
append a `resumeChange:` line to `run.md` (`./run-state.md` item 1) and say in one line what it
changes. A flag change applies from the resumed phase onward. A phase already done is not redone,
so when the flag only mattered there (`planOneShot` after design), say that it changes nothing. A
goal change never rewrites `idea:`. At `phase: design`, hand it to `super-design` with the recorded
idea as the human's amendment. From `code` onward, it goes to the report's Remaining as follow-up
scope unless the human asks for a redesign.

A resume at `phase: fix-loop` re-queries the open fix beads under the epic and re-enters
`super-code` with them; findings recorded in the latest `roast-code` report but missing as beads
are re-filed first — the report is durable, the filing may not have finished. **Existing
`stepBack-round-<N>` and `scopeFilter-round-<N>` records for the round are replayed, never
re-dispatched.** A recorded redesign whose spec amendment is not yet committed is applied from its
record. For the scope filter, match each
report finding on its `[SEV] <location>` key exactly against the recorded entries and route by
the recorded disposition. Findings the recorded step-back dissolved are skipped; only findings
with no matching record go through the scope-filter pass.

A resume at `phase: code` whose epic is already closed has nothing to dispatch — `bd ready` comes
back empty by construction. Skip to phase 4 and source Implemented from the closed beads (skip
super-code's `review: <id>` bookkeeping beads, label `sp:review`); do not read an empty ready set as
a failed run.

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
roast report, the roast round count and each gate decision **as each becomes true**, plus the
`roast-design` phase token when that stage begins. (`branch` and `base` are already recorded — you
created the workspace in pre-flight.)

Field ownership is split and does not overlap: `super-design` writes what phases 1–2 produce;
`super-auto` writes everything from phase 3 on (`codeBuckets`, `roast-code`, `roastCodeRound`, and
every phase token from `code` onward) — plus `roast-design (skipped)` when `skipPlanRoast` is set,
since a stage that never begins is one `super-design` never writes a token for, and
`capped-blocking` when `super-design` returns stopped on it. Neither rewrites
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
When confirming, say what the pair means (§Autonomous mode).

Four flags, collected once, before any phase runs (and skipped entirely on a resume — see
Resume above), in **one batched question** — never four sequential ones — and only asked for
whichever aren't already stated in the invocation.

| Flag | Effect |
|---|---|
| plan one-shot | Stated to `super-design`, which relays it to every `brainstorming` iteration it runs (root spec, each subepic) — Mode B instead of Mode A (`autonomous` forces Mode B regardless). Without `autonomous`, the top split is applied without asking and the run stops after phase 2 for design review (§Autonomous mode) |
| skip plan roast | **Stated to `super-design`, either way** — it pre-decides the adversarial-review offer on the settled tree (skip or run), so the user, who already answered here, is never asked again |
| skip code roast | Omits the final PR-mode roast entirely |
| autonomous | **Stated to `super-design`** — it owns the design gates and its own roast loop, and its unattended behavior is conditional on being told. No stop from launch to the phase-7 hand-back; the top split is applied, not asked (§Autonomous mode) |

## Phase sequence

`super-auto` owns every transition explicitly — it never lets a phase chain into the next on its
own, or the flags strand and the sequence is lost. Each row's parenthetical is the exact `run.md`
`phase` token from `./run-state.md`; the two files name the same seven phases.

| # | Phase (`run.md` token) | Skill | Note |
|---|---|---|---|
| 1 | Design (`design`) | `super-design` | Pass all seven: the goal (**on a resume, `run.md`'s recorded `idea:`**), the artifact-directory override, the `run.md` path **together with `./run-state.md`, whose field names and formats govern every write** (a co-writer that never sees the contract invents an incompatible one), the `roast-design` phase token to write when that stage begins, the design mode (Mode B when `planOneShot` or `autonomous` is set), `autonomous` and `skipPlanRoast`, and — resuming mid-roast — the starting round. **Say the hand-off is `super-auto`'s.** It drives the root brainstorm, decomposition, every subepic brainstorm, the coverage loop and the design roast, recording into `run.md` as it goes. |
| 2 | Design roast (`roast-design`) | `super-roast` (design) | Runs **inside** phase 1's `super-design` invocation, via its own offer; cap-3 fix loop with the capped-Blocking extension (the roast-cap note under §Autonomous mode). In a one-shot run without `autonomous`, the run stops after this phase for design review (§Autonomous mode). `super-auto` holds no control while it runs, so `super-design` writes `phase: roast-design`, the report paths and `roastDesignRound` into `run.md` itself, per its §Run-State File contract — see above. After the roast loop, `super-design`'s parallelism pass reshapes the bead graph (safe edge cuts applied, the rest parked as `graph-change` items) and records its `graph-pass:` line before handing back. |
| 3 | Code (`code`) | `super-code` | The integration branch **is this run's branch**, and its integration worktree **is this run's worktree** — both exist already, from pre-flight (§Run directory). Create nothing; pass them — **the worktree's real path explicitly, as `integrationWorktree`**, never left for `super-code` to derive: the run branch `super-auto/<slug>` contains a slash, and `super-code`'s no-arg fallback derives a slash-collapsed `.worktrees/` path that matches no worktree this run ever created (mismatched by construction on every handoff before this field existed). (`branch` was recorded at run-directory creation.) Autonomous or interactive per flag; under `autonomous`, pass `config.edgeCuts: 'apply-safe'` so the coordinator's edge audit may apply safe edge cuts. **Say in the invocation that `super-auto` owns the finish** — there is no config flag, and without it `super-code` merges and deletes the worktree the report still needs. Also pass the friction-log path (`<run-dir>/friction.md`) so phase 3 can append to it, and `deferSweep: true` on this and every fix-loop re-entry: the one full-suite sweep runs in phase 6 (each merge inside `super-code` still runs its build-only `mergeCheck` — compile/typecheck, no tests). |
| 4 | Code roast (`roast-code`) | `super-roast` (PR) | Against the live integration branch, diffed against `run.md`'s `base`. Pass the run directory as the report-location override, **the iteration number from `roastCodeRound`** (without it round 2's report overwrites round 1's file), **`autonomous` when the run is** (without it super-roast pauses for a human at its loop exits), and on rounds ≥2 the prior report — without which the round re-litigates what the last one already cleared |
| 5 | Fix loop (`fix-loop`) | — | Per round: step-back, scope filter, file fix beads, re-enter `super-code`, loop to phase 4. Cap 3, with early exits and a recorded cap disposition. See §Phase 5 — the code fix loop below. |
| 6 | Report (`report`) | — | **Sweep first:** every `super-code` invocation ran with `deferSweep: true` (its `sweep` reads `SWEEP DEFERRED (caller-owned)`; its merges ran only the build-only `mergeCheck`, no tests), so the run's one full-suite sweep happens here, after phase 5 exits, against the tip the roast cleared. Use the command `super-code`'s ledger `Launch:` line records (the declared `config.sweep`, else the project's full test command under its `AGENTS.md` envelope), so both agree. Stamp the one-line result with that SHA and record it as `codeBuckets.sweep`. A stamp that no longer matches the tip is invalid, not stale-but-fine. Any other expensive once-per-branch verification, such as a readiness gate, likewise runs after phase 5 exits, against that tip. When this branch does not land alone (a prerequisite branch lands with it, or the base moved materially), materialise the combined candidate tree first, review its conflicts *and* the relevant clean auto-merges, which can carry dead tests and stale policy between independently reviewed branches, and run the sweep against that exact SHA. Then write `report.md` per `./report-prompt.md`, before anything is torn down — its status block's `metrics:` line reads `metrics: pending (upstream-feedback not yet run)` on this first write, because upstream-feedback has not run yet. Then invoke `superpowers:upstream-feedback` (this run is the outermost invocation — its analysis pass runs here, once; in an autonomous run the proposal parks and surfaces at the phase-7 menu, never mid-run; an attended run is asked directly). **After it returns, rewrite `report.md`'s `metrics:` line in place** — nothing else in the file — to the issue URL, the parked-draft path, or `metrics: none (clean run, nothing filed)`, sourced from `run.md`'s `feedback:` field or the parked-draft path per `./report-prompt.md`. Throughout all phases: append friction events to `<run-dir>/friction.md` the moment they happen, per that skill's format, and commit it with the run.md writes |
| 7 | Finish (`finish`→`done`) | `finishing-a-development-branch` | Merge + clean up, once, gated per below. Invoke it **from this run's worktree**, supplying `run.md`'s `branch` as the feature branch to merge and `base` as its destination, so neither is asked nor inferred from the cwd. Present `report.md` alongside the menu, and, if phase 6 parked an upstream-feedback draft, present it at the same menu. **The menu itself is always the human's, autonomous or not** — see "Where the zone ends". If the suite fails there, rewrite `report.md`'s status line to `stalled at phase finish` before stopping — the report already on disk says otherwise. |

Phase 7's gate is three conditions, not one: `report.md` exists, `run.md`'s `phase` reads `report`,
and its status line does not begin `stalled` — existence alone is not enough. A stall at any phase
still writes `report.md` (`status: stalled at phase X`) but never advances `phase` to `report`; see
`./run-state.md`'s phase-2 entry for the one remaining case (a stall at phase 6 itself) the third
condition exists to close.

### Phase 5 — the code fix loop

Each round starts from the round's roast report. **Exit first:** the loop ends without fixing when
the roast verdict carries `[converged]` (zero Blocking of any provenance on a non-degraded round;
remaining sub-Blocking findings go to `report.md` as a punch list), when the Blocking count did not
shrink from the last round (thrash), or when round 3 is done (the cap). Otherwise, in order:

1. **Step back.** Dispatch one fresh-context `opus` agent (`fable` where available) that has
   written none of the fixes, per `super-design`'s template
   `<skills-root>/super-design/step-back-prompt.md` (`<skills-root>` is this skill's base
   directory's parent), in its `code` mode. Fill it with absolute paths: the root spec, the
   branch and base with their SHAs, the epic id, every `roast-code` report so far (not only the
   latest), and every prior step-back file. Save its output verbatim beside the round's report
   as `…-roast-pr-<N>-step-back.md`, then record the template's `stepBack-round-<N>` line in
   `run.md` (`./run-state.md` item 7).
   - `patch`: continue with every confirmed finding.
   - `redesign` with `scope: inside`, autonomous run: apply it. Amend the spec and commit. The
     findings it dissolves (the file's `dissolves:`) are not filed. The redesign itself is filed as
     fix bead(s), and the remaining findings continue below.
   - `redesign` with `scope: outside`, autonomous run: record it as `parked`, park it as a
     `degraded-verdict` (`redesign proposed, not applied`), and continue this round as `patch`.
     The report and the phase-7 menu surface it.
   - `redesign` in an interactive run: present it with your recommendation and follow the
     human's choice (`applied` or `declined`).

   The step-back also runs when the loop exits at thrash or the cap with Blocking findings open.
   There a redesign is recorded as `parked` and surfaced, never applied.
2. **Scope filter.** Dispatch one fresh-context sonnet pass per `./scope-filter-prompt.md` over the
   confirmed findings the step-back did not dissolve, against the root spec's `## Goal` and stated
   scope/non-goals. Treat its JSON as data. Match its keys one to one against those findings on
   the exact `[SEV] <location>` key. Every `[Blocking]` key is in-scope whatever came back, and a
   finding with no exact-key entry routes in-scope (`unrouted by filter — defaulted in-scope`).
   Record `scopeFilter-round-<N>` in `run.md` (`./run-state.md` item 7), then the aggregate line,
   counted from the recorded dispositions and not from the filter's own counts. Punch-list findings
   go to `report.md`'s Remaining, tagged `out of scope (filtered)`, and are never filed.
3. **File.** Reopen the epic (`bd update <epicId> --status open`). File in-scope findings and any
   applied redesign as beads, using `super-design`'s §Decomposition four fields (title, short
   description, **files-touched hint**, blocking deps; without the files hint every fix bead runs
   alone) and Red Flags' flag triple. **Each fix bead's description links every `roast-code` report
   so far and the step-back record**, and the amended spec section when a redesign applies, so the
   implementer sees every round's findings and not just the latest.
4. **Re-enter `super-code`** with the new beads and `deferSweep: true`, then loop to phase 4.

**When the cap trips with Blocking findings still confirmed**, record the disposition before
parking: write `roastCodeCapped:` to `run.md` with the unresolved finding ids, the round-3 report
path, and what authority the next step needs (`./run-state.md` item 5). A resume and the operator
can then tell "cap exhausted with Blocking open" from "converged" without reading prose. Any later
whole-branch roast outside this loop, such as a post-cap audit or a re-review after an operator
ruling, is invoked with iteration `post-cap audit`, which `super-roast`'s header accepts, never with
a fabricated `N of 3`.

## Autonomous mode

> Autonomy begins at launch, once pre-flight passes, and ends at the phase-7 hand-back.

**The design gates are `super-design`'s (its §Gates by Mode); the flags pick the row.**

- `autonomous`: the top split is applied as recommended, recorded, and named in the next
  summary, and the run goes straight on into phase 3.
- `planOneShot` without `autonomous`: the top split is applied the same way, and the run **stops
  at the end of phase 2**, before phase 3, for the human's design review. Present the root spec,
  the settled tree, the design roast's exit summary and everything parked, and record
  `design-review · pending` under `approvals:`. The human's go-ahead is recorded as
  `design-review · approved` and phase 3 starts; changes they ask for go to `super-design` as an
  amendment. A resume that finds `design-review · pending` skips `super-design` and takes the
  resume message as the answer: go-ahead, unless it asks for changes.
- Neither flag: the human approves the top split when `super-design` asks.

**Say this when confirming the flags.** `autonomous` means no questions from launch to the
finished report; it implies one-shot (Mode B) design. `planOneShot` alone means no questions until the design is ready, then a
stop for review.

Everything in phases 1 and 2 runs inside the `super-design` invocation: the nested brainstorms,
the coverage loop (a fixed two rounds that verifies and applies its own findings), and the design
roast.

In the autonomous zone, `super-design`'s and `super-roast`'s own mandated human pauses are answered,
not asked, and the road not taken is parked (`run-state.md`'s `degraded-verdict` kind):

- **The offer to invoke `super-roast` at all** (phase 2): accepted without asking — **unless `skipPlanRoast` is set, which wins.** An explicit flag beats a mode default; otherwise the flag would be unreachable in exactly the configuration (`skipPlanRoast` + `autonomous`) the cheap validation run uses.
- **"Re-roast with a raised `config.panelCap`?"** (a beyond-cap finding): answered **no** — proceed
  with the findings in hand; the unexplored raise is parked, not silently dropped.
- **The `clean [low coverage]` / `clean [panel-capped: N unverified]` three-way gate**, at both
  roasts: answered **proceed**; the qualifier is parked.
- **Loop-exit pauses** (both loops): `super-design`'s §Unattended Runs already records and hands
  back instead of pausing when the caller owns the hand-off; whatever was open lands in `run.md` and
  the report.
- Fix designs are applied without asking or waiting — the request to run autonomously *is* the
  approval.
- Nested brainstorms triggered by a fix run in Mode B.
- Escalations and beyond-cap items are parked and surfaced **in the final report**, never
  auto-adjudicated and never queried about mid-run.
- **Capped Blocking** (phase 2): parked, not a stop — the roast-cap note below.
- `super-code` runs in its own autonomous mode.

**Recorded decisions replay.** Every top-split decision (human or applied) and design-review
answer is recorded in `run.md` (`./run-state.md` item 7) with the shape it covers. A resumed run
**replays** a matching record rather than re-deciding; a session that ends after the design was
approved must not come back and re-solicit it. Replay only on an exact match: if the child set or
the verdicts changed since, decide again per `super-design` §Gates by Mode and say what changed.
Anything unrecorded was never approved, and a replay is never widened into "the human approved
this run."

**Where the zone ends: when the work is done, not at a phase number.** Autonomy means no question
interrupts work that is still in progress. It does **not** mean the run merges itself. Once every
bead under the epic has reached a terminal state and `report.md` is written, the run has finished
what it was asked to do — it presents the report and hands control back, and the merge of the
integration branch into the base branch is the human's call like any other.

That hand-back is the last wanted stop in §Ending turns in an autonomous run. A run sitting at the
integration decision is *done*, not blocked. None of the bullets above licenses merging to the
base branch unattended, which is the one action in this pipeline a human cannot cheaply undo.

Merges *into* the run's own integration branch are a different thing and need no confirmation:
`super-code` performs them itself, serially, and never presents a menu for them.

> The two roasts cap out differently. The **design roast** (phase 2): a still-Blocking round 3
> extends the cap by exactly one round, and a still-Blocking extension records
> `roastDesignCapped:` (`./run-state.md` item 5). Without `autonomous` the run stops there as
> `phase: capped-blocking`, and no code phase runs on a kernel three-plus rounds called defective
> with unverified last fixes (super-design's §Adversarial Review Loop owns the mechanics; a later
> human-relaunched run that executes anyway first acknowledges the recorded state in its ledger).
> Under `autonomous` it is recorded as `proceeded`, each unresolved Blocking finding is parked,
> phase 3 starts, and the report's status line leads with it (`./report-prompt.md`). The **code
> roast** (phase 5): capping at 3 with Blocking findings unresolved parks them rather than halting — the code exists and was
> reviewed; a run can finish having merged code with known Blocking findings, which is why the
> report leads with status. Parking is recorded, not implied: `run.md` gets `roastCodeCapped:`
> with the unresolved ids (`./run-state.md` item 5), the report's status line names the count,
> and any whole-branch roast the operator runs afterwards carries iteration `post-cap audit`.

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
- End a turn in the autonomous zone other than at a wanted stop — §Ending turns in an autonomous run.
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
