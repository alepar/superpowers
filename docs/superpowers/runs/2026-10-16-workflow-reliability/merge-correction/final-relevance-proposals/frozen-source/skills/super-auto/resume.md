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

Re-register the run marker (SKILL.md §Pre-flight step 4's register command, with `--epic` and `--ledger` when run.md records an epic and phase 3 has started): the session id changed, and register drops the old session's marker for the same run.md.

Hand `super-design` the recorded `idea:`, not the words the user just typed. A resume is phrased as a resume ("keep going on the X work"); passing that verbatim points the root brainstorm at a meta-instruction instead of the goal.

## Resume messages that change something

A resume message that changes something is recorded, not dropped. If it sets a flag differently or amends the goal ("…and run it unattended", "skip the code roast", "also cover the admin API"), append a `resumeChange:` line to `run.md` (run-state.md item 1 (Flags)) and say in one line what it changes. A flag change applies from the resumed phase onward. A phase already done is not redone, so when the flag only mattered there (`planOneShot` after design), say that it changes nothing. A goal change never rewrites `idea:`. At `phase: design`, hand it to `super-design` with the recorded idea as the human's amendment. From `code` onward, it goes to the report's Remaining as follow-up scope unless the human asks for a redesign.

## Recovering review collection

Before any later super-code invocation, report or cleanup, reconcile every `review-collection` intent in `approvals:` against its persisted Launch and settled ledger/result (run-state.md §Review collection records). If the invocation is still active, resume it with that same invocationId. When settlement is confirmed but unrecorded, run the explicit `report-status --collect RUN_MD --invocation ID --workspace WORKSPACE --review REVIEW_PATH_OR_none --verdict RETURNED_REVIEW` command from SKILL.md §Review collection, retaining any declared `--required` inputs. Then run `report-status --collect RUN_MD` to replay all collections. A copy without completion is replayed; identical archive bytes and exact source records remain unchanged. An archived complete bundle can be checked from its retained hashes after the source worktree is gone.

At the settled design/code handoff, reconcile the complete original producer input sets in
`roast-design` and `roast-code` with both ledger pointers, including amend/earlier rounds and
recognized empty reports. If a producer persisted its pointer before outer collection, preserve
that owned gap and append each original source's complete extraction with its existing identity
before acceptance. Replay identical records idempotently. Missing declarations, unknown empty
headers, extraction failures and unsupported correspondence remain gaps. Use run-state.md's
`source-correspondence` schema only for evidence-backed exact correspondence; display-key
membership checks transport, never identity, linking or disposition.

Exit 3 preserves a pending collection/gap with the orchestrator as recovery owner; exit 2/4 establishes no collection. Keep source and archive copies, record the recovery reason and defer later invocation/cleanup until preservation succeeds. A required null or missing review stays a `final review` evidence gap; null with `no work landed` introduces no review source. Replay finding routes and supported dispositions from approvals without rewriting them.

Run `scope-dispositions --project RUN_MD` next. Use every outstanding group's original occurrence refs for active work and Remaining; use its `--keys` output only for outstanding deferred punch-list input, checking status/gaps even when empty. The latest `codeBuckets.review` remains the latest invocation's verdict. It cannot clear earlier findings, and a task success or ready retry adds no resolution evidence. Do not reconstruct the view from the latest review or the historical union of `scopeFilter` punch-list keys. Preserve unavailable inline source occurrences and report their gaps.

## Resuming at a phase

Restore `rootAcceptance: "caller"` on every Workflow or ordinary super-code invocation, including
fix-loop, final-SHA, sweep-fix and final-review re-entry; `deferSweep` alone supplies no ownership.
Reconcile the existing `approvals · root-acceptance` snapshots from their durable Recovery/check
and decision references per run-state.md §Caller-owned root acceptance. Preserve missing reviews,
required live checks, deferred measurements, run-owned failures and reserved human gates even when
all implementation leaves are closed. An empty implementation frontier returns to the remaining
caller phases normally; it cannot accept the root. A historical closed root does not establish
caller acceptance: still reconcile required reviews, measurements, findings and human decisions.
Before any root close, re-run `report-status --acceptance RUN_MD --tree FULL_GIT_TREE` against the
confirmed final code identity. Exit 3 keeps the root open; 2/4 establishes no acceptance. Never
infer a human choice from `phase: done`: a kept branch or cancelled run can be done with acceptance
pending. Resume the actual recorded finish outcome and do not repeat its human menu.

A resume at `phase: fix-loop` re-queries the open fix beads under the epic and re-enters `super-code` with them. A round that has a `redesign-code-<K>` record whose `round` is that round and whose state is not `aborted — …` is a redesign round: resume it only through that record's `state` (§Redesign cycle replay). It re-files no finding from the report and runs no scope filter: Amend Mode's `sp:redesign-code-<K>` beads (deduped by title in its `specs-committed` replay) are the round's fix work. The rest of this paragraph applies to a `local` round: one with no such record, or whose record is `aborted — …` (an aborted cycle runs the round `local`).

In a `local` round, findings recorded in the latest `roast-code` report but missing as beads are re-filed first, because the report is durable and the filing may not have finished. Existing `stepBackCode-round-<N>` and `scopeFilter-round-<N>` records for the round are replayed, never re-dispatched (a `run.md` from before the key split has `stepBack-round-<N>` lines that may be the design roast's: read the code round's decision from its `…-roast-pr-<N>-step-back.md` file instead). A `run.md` written before redesign records existed may hold `stepBackCode-round-<N>: redesign — applied: …` with no `redesign-code-<K>` record for round N. Replay it in place only when `run.md` holds no `redesign-code-<K>` record anywhere, meaning the run predates the records: a redesign whose spec amendment is not yet committed is applied from that line, and the round is not re-filed through the local path. In any other run such a line is never applied as an in-place spec patch; it is treated as no decision, and the round's Step 1 re-runs from item 5 on its saved step-back file (re-check, never re-dispatch). For the scope filter (SKILL.md §Step 2 — scope filter), match each report finding on its `[SEV] <location>` key exactly against the recorded entries and route by the recorded disposition. For local filing, the ledger's `dissolved@r<M>` from a non-aborted earlier redesign follows SKILL.md §Step 2 — scope filter; an aborted cycle skips none of its own `dissolves:`. Retain the original occurrences in the outstanding projection until a supported explicit disposition accounts for them; a step-back dissolution alone supplies no such support. Findings with supported recorded dispositions are skipped; only findings with no matching record go through the scope-filter pass. When the round has a `regressionPass-round-<N>` record, only the findings it lists count as fix work (the rest of that report is punch list), and once their beads close the run goes to phase 6, not back to phase 4 (SKILL.md §Regression-only pass).

A `roastCodeExit:` line, whatever its value (`converged`, `thrash`, `capped`, `operator-skipped (<reason>)`), means the loop has ended: at `phase: roast-code` or `fix-loop`, start no further roast round and file no further round's beads. Finish any re-entry a recorded `regressionPass-round-<N>` started, then go on to what follows the loop (the final-SHA gate, base drift, phase 6).

A resume at `phase: code` whose epic is already closed has nothing to dispatch: `bd ready` comes back empty by construction. Skip to phase 4 and source Implemented from the closed beads (skip super-code's `review: <id>` bookkeeping beads, label `sp:review`); do not read an empty ready set as a failed run.

A resume that finds `design-review · pending` skips `super-design` and takes the resume message as the answer: go-ahead, unless it asks for changes.

A resume at `phase: design` re-enters `super-design` at step 1: the recorded state is durable, but re-entry is not idempotent, and knowing that `spec:` and `epic:` already exist is not the same as `super-design` skipping the work that produced them, since that guard lives in `super-design`, not here. The recorded pointers plus the tracker (the epic, its children, their `sp:needs-design` labels) say where the tree actually is, and `super-design`'s cursor is a query over that rather than session memory.

## Redesign cycle replay

A `redesign-<loop>-<K>` record (run-state.md item 7 (Design decisions)) whose `state` is not final means a redesign cycle was interrupted. Dispatch it only from `state`: a durable output (an amend file, a spec diff, a bead, a report) is checked within a state to decide how to carry it out, and is never used to infer which state the cycle is in. Counters (`redesignCycles-code`, `redesignCycles-design`) are never reset, and a replay never starts a cycle of its own: the cycle that was started is the one that finishes.

- `started`: with an `amend-<loop>-<K>.md` file and a spec diff, run `amend-check` on them (`bash <skills-root>/super-design/scripts/amend-check --loop <loop> --amend <record> --ledger <ledger> --specs <paths>`); exit 0 (`ok`) continues at the commit; exit 3 (`reject:`) restores the `--specs` files to HEAD (`git checkout HEAD -- <paths>`) and re-runs super-design's Amend Mode section from its dispatch; exit 2 is a bad invocation or a git failure: fix it and run `amend-check` again, never restoring (as Amend Mode step 2). With no amend file, restore and re-run the same way.
- `amend-checked`: first check whether Amend Mode step 3's commit already landed: `git diff --quiet <lastGood> HEAD -- <spec paths>` exits 1 when the specs at HEAD differ from the record's `lastGood`, the pre-amendment HEAD both loops record. Landed: do not re-run `amend-check` (against HEAD it sees an empty diff and rejects, and nothing aborts after the commit); rewrite the state to `specs-committed` and continue at that bullet, including step 3's sync. Not landed: re-run `amend-check` before committing anything. exit 0 goes on to the commit; exit 3 restores the specs and rewrites the state to `aborted — amend rejected on resume`, then finishes the abort as the `aborted — <reason>` bullet does: remove from the loop's overrides file the `dissolved@r<N>` lines Step 1 wrote for this round's record, rebuild the ledger with the loop's `findings-ledger` invocation, and park the `degraded-verdict` (`redesign aborted — amend rejected on resume`) (the round then runs `local`); exit 2: fix and re-run, no restore.
- `specs-committed`: first replay Amend Mode step 3's Key Abstractions sync, then file only the `work:` items whose titles are missing from the beads labelled `sp:redesign-<loop>-<K>`; that label is the dedupe key, so a resume never files a bead twice.
- `beads-filed`: write any dispute line missing from the overrides file, run the coverage-amend round unless the `coverage-amend-<loop>-<K>` approvals line exists, then the calling loop's remaining steps. In the code loop they depend on `designRoast`:
  - `-`: run the amend-roast step, with its design-cap gate;
  - `r<M>` and no round-M design roast report: run roast round M without incrementing `roastDesignRound` again;
  - `r<M>` and its report: finish the fix step (spec fixes; tasks from the work-list file `<run-dir>/amend-code-<K>-roast.md`, written first when absent, filed only for its titles missing from the beads labelled `sp:redesign-code-<K>-roast`; commit) and write `r<M> fixed`;
  - `r<M> fixed`, `skipped — design cap spent` or `none`: go on.

  `applied` is written only after these remaining steps (for the code loop, the `designRoast` sub-states), so a record still at `beads-filed` always replays the amend roast steps; Amend Mode's return never wrote it early. Then write state `applied`, re-enter `super-code`, and run the next numbered round. The design loop's `redesign-design-<K>` has no `designRoast` step: after the coverage round it writes `applied`, and its next round is the post-amendment design roast.
- `aborted — <reason>`: the round runs `local`; before it does, finish the abort (the live abort writes this state first and then runs these same steps, so a crash anywhere in them replays here): park the `degraded-verdict` (`redesign aborted — <reason>`) unless `parked:` already holds it, and remove any `dissolved@r<N>` line for this round's record still in the overrides file and rebuild the ledger with the loop's `findings-ledger` invocation. Both writes are idempotent: with the park present and no such line, nothing is written.
- `applied`, `thrash — lastGood breach`: nothing to replay; the loop continues from its other records.

The same rules apply to `redesign-design-<K>`, replayed through `super-design`'s re-entry. A recorded step-back's `redesign` is not re-dispatched: `<skills-root>/super-design/scripts/step-back-check --step-back … --keys … --ledger …` is re-run only when a round's step-back has no record yet.

## Switching definitions mid-run

A `skillSource:` line recorded at pre-flight (the run proceeded on the updated plugin cache instead of restarting, SKILL.md §Pre-flight) is followed the same way: read every skill file from that path, never from the session-loaded text.

Switching happens only when the human explicitly points the run at another skill source (for example a local checkout under test); that instruction overrides the local-checkout rule in SKILL.md §Pre-flight for this run. Record `skillSource: <absolute skills path> @ <sha> (<version>)` in `run.md` — if `git -C <repo> status --porcelain -- <skills path>` is non-empty, write `<sha>+dirty:<hash>` with `<hash>` = `(cd <skills path> && find . -type f -print0 | sort -z | xargs -0 shasum | shasum | cut -c1-12)`, so the record names the text actually read — then re-read `./run-state.md` and every sibling contract you will write from the new source, and carry the run on from its recorded phase. A recorded field or ledger line the new contract does not define stays in `run.md` as history, with one `migrated:` line saying what it maps to now (or `dropped`). Pass the same source as `skillsRoot` to every skill you invoke after the switch. The super-code ledger carries on across the switch: it is append-only, and its Resume and Metrics parsers skip lines in a format they do not read. On each code re-entry, select Workflow or the supported ordinary-subagent procedure from the calling session's capabilities, record any change in `codeMechanism:`, and reconcile the ledger before dispatch. Both paths write `Merge:` and `Metrics:` lines for the report and upstream-feedback.
