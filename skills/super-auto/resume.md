# Resuming a super-auto run

Read this on invocation, before the flags (SKILL.md §Resume), and when the human points a run at another skill source.

## Finding a run

Look in the current checkout and in every path `git worktree list` reports (a run's directory lives on its own branch, so a session started from `base` cannot otherwise see it), in this order, stopping at the first step that finds a candidate:

1. Slug glob: `docs/superpowers/runs/*-<slug>/run.md`, with `<slug>` derived per SKILL.md §Run directory; the date prefix is the run's, fixed at phase 1, not today's.
2. Idea match: read the `idea:` line of every `docs/superpowers/runs/*/run.md` in the same places and compare it with this invocation's text. A resume phrased as a resume usually misses the slug glob, so this is the usual matcher.
3. Branches: list `git for-each-ref --format='%(refname:short)' refs/heads/super-auto/`, find each branch's run directory with `git ls-tree --name-only <branch> docs/superpowers/runs/`, and read its `run.md` with `git show <branch>:docs/superpowers/runs/<dir>/run.md`. A pruned worktree, a fresh clone or another machine leaves the branch and loses the worktree.

Decide on the candidates by idea match: exactly one sharing a content noun phrase with the invocation resumes; none starts a fresh run; two or more stop and ask which, a pre-flight question since no work is in flight yet.

## Entering the run

On a match, switch into that run's worktree before writing anything, or re-create one on `run.md`'s `branch` if it is gone (`git worktree add <path> <branch>`, with no `-b`: the branch exists, and the `-b` form fails on it). Every later write (specs, roast reports, `run.md`, `report.md`) must land on that branch, and a resume that stays in the checkout it was invoked from puts all of it on the default branch, where phase 7 will not merge it.

Hand `super-design` the recorded `idea:`, not the words the user just typed. A resume is phrased as a resume ("keep going on the X work"); passing that verbatim points the root brainstorm at a meta-instruction instead of the goal.

## Resume messages that change something

A resume message that changes something is recorded, not dropped. If it sets a flag differently or amends the goal ("…and run it unattended", "skip the code roast", "also cover the admin API"), append a `resumeChange:` line to `run.md` (run-state.md item 1 (Flags)) and say in one line what it changes. A flag change applies from the resumed phase onward. A phase already done is not redone, so when the flag only mattered there (`planOneShot` after design), say that it changes nothing. A goal change never rewrites `idea:`. At `phase: design`, hand it to `super-design` with the recorded idea as the human's amendment. From `code` onward, it goes to the report's Remaining as follow-up scope unless the human asks for a redesign.

## Resuming at a phase

A resume at `phase: fix-loop` re-queries the open fix beads under the epic and re-enters `super-code` with them; findings recorded in the latest `roast-code` report but missing as beads are re-filed first, because the report is durable and the filing may not have finished. Existing `stepBackCode-round-<N>` and `scopeFilter-round-<N>` records for the round are replayed, never re-dispatched (a `run.md` from before the key split has `stepBack-round-<N>` lines that may be the design roast's: read the code round's decision from its `…-roast-pr-<N>-step-back.md` file instead). A recorded redesign whose spec amendment is not yet committed is applied from its record. For the scope filter (SKILL.md §Step 2 — scope filter), match each report finding on its `[SEV] <location>` key exactly against the recorded entries and route by the recorded disposition. Findings the recorded step-back (SKILL.md §Step 1 — step back) dissolved are skipped; only findings with no matching record go through the scope-filter pass. When the round has a `regressionPass-round-<N>` record, only the findings it lists count as fix work (the rest of that report is punch list), and once their beads close the run goes to phase 6, not back to phase 4 (SKILL.md §Regression-only pass).

A `roastCodeExit:` line, whatever its value (`converged`, `thrash`, `capped`, `operator-skipped (<reason>)`), means the loop has ended: at `phase: roast-code` or `fix-loop`, start no further roast round and file no further round's beads. Finish any re-entry a recorded `regressionPass-round-<N>` started, then go on to what follows the loop (the final-SHA gate, base drift, phase 6).

A resume at `phase: code` whose epic is already closed has nothing to dispatch: `bd ready` comes back empty by construction. Skip to phase 4 and source Implemented from the closed beads (skip super-code's `review: <id>` bookkeeping beads, label `sp:review`); do not read an empty ready set as a failed run.

A resume that finds `design-review · pending` skips `super-design` and takes the resume message as the answer: go-ahead, unless it asks for changes.

A resume at `phase: design` re-enters `super-design` at step 1: the recorded state is durable, but re-entry is not idempotent, and knowing that `spec:` and `epic:` already exist is not the same as `super-design` skipping the work that produced them, since that guard lives in `super-design`, not here. The recorded pointers plus the tracker (the epic, its children, their `sp:needs-design` labels) say where the tree actually is, and `super-design`'s cursor is a query over that rather than session memory.

## Switching definitions mid-run

A `skillSource:` line recorded at pre-flight (the run proceeded on the updated plugin cache instead of restarting, SKILL.md §Pre-flight) is followed the same way: read every skill file from that path, never from the session-loaded text.

Switching happens only when the human explicitly points the run at another skill source (for example a local checkout under test); that instruction overrides the local-checkout rule in SKILL.md §Pre-flight for this run. Record `skillSource: <absolute skills path> @ <sha> (<version>)` in `run.md` — if `git -C <repo> status --porcelain -- <skills path>` is non-empty, write `<sha>+dirty:<hash>` with `<hash>` = `(cd <skills path> && find . -type f -print0 | sort -z | xargs -0 shasum | shasum | cut -c1-12)`, so the record names the text actually read — then re-read `./run-state.md` and every sibling contract you will write from the new source, and carry the run on from its recorded phase. A recorded field or ledger line the new contract does not define stays in `run.md` as history, with one `migrated:` line saying what it maps to now (or `dropped`). Pass the same source as `skillsRoot` to every skill you invoke after the switch. The super-code ledger carries on across the switch: it is append-only, and its Resume and Metrics parsers skip lines in a format they do not read. Work after the switch still goes through the super-code Workflow; lanes run by hand are outside the contract and leave no `Merge:` or `Metrics:` lines for the report and upstream-feedback to count.
