# Final seam review: super-plan-59b (roast-findings-redesign-loop)

Branch: `super-auto/roast-findings-redesign-loop` @ d85675b3 (merge base with main 3f4fdba3).
Epic: super-plan-59b (closed). Spec: `docs/superpowers/runs/2026-10-16-roast-findings-redesign-loop/2026-10-16-roast-findings-redesign-loop-design.md`.
Inputs: the cluster reviews for clusters 1 and 3-10 (the `-cluster-N.md` files stamped 01:47-01:56), `assembled/final-review-roast-findings-redesign-loop-20261017T054231-final/clusters.json`, the epic description from `bd show super-plan-59b --json`, and the cross-cluster hunks in `git diff 3f4fdba3 HEAD`.

Cluster 2 (docs-superpowers-runs, 24 files) has no review in this round because it is over the window. A `-cluster-2.md` file in the same directory is stamped 00:30. It belongs to the earlier final-review pass (the one that numbered clusters differently) and was not used as input here.

## Cluster verdicts carried in

| Cluster | Name | Verdict |
|---|---|---|
| 1 | agents-md | ready |
| 2 | docs-superpowers-runs | unreviewed (over the window) |
| 3 | docs-superpowers-specs | ready |
| 4 | skills-super-auto | not ready (resume legacy-misread window; `applied` writer conflict; punch list not cumulative after a redesign round) |
| 5 | skills-super-code | ready |
| 6 | skills-super-design | not ready (design-loop Amend Mode filing never adds the `Integration sweep:` edge) |
| 7 | skills-super-roast | ready |
| 8 | tests-super-auto | ready |
| 9 | tests-super-code | ready |
| 10 | tests-super-design | ready |

## Previous final-review must-fixes: status

The earlier pass (00:37) raised three must-fix items. All three are resolved on this tip:

- **Closed root epic on re-entry.** Amend Mode step 4's block runs `bd update "$ROOT" --status open` before the first create, and super-auto §Redesign cycle step 4 reopens the epic again.
- **resume.md re-filing a redesign round.** The re-file and scope-filter replay now applies only to "a `local` round".
- **Design-loop supersede.** It now runs through the `supersedes:` amend field, amend-check's `supersedes` rule and step 4's `bd supersede` loop, which skips beads that are already closed.

## Seams checked

Most interfaces run between cluster 4 (super-auto prose) and cluster 6 (super-design scripts, prompts and Amend Mode). Clusters 5 (report-verdict) and 7 (super-roast prose) touch these interfaces, and test clusters 8-10 pin parts of them.

**Interfaces that agree:**
- **findings-ledger CLI (6) vs both loops' Step 1 item 2 (4, 6).** The two loops pass the same flags: `--loop`, `--out`, `--report N=`, `--final-review M=` (code loop only), `--punch-list` and `--overrides`. The per-loop paths in the script header match both SKILL.md files and step-back-prompt.md.
- **step-back-check (6) vs both loops' Step 1 item 5.** Both loops call it with `--step-back --keys --ledger`, and the old `super-auto/scripts/step-back-check` path is gone.
- **amend-check (6) vs Amend Mode step 2 (6) and resume.md `started`/`amend-checked` (4).** Both callers pass `--loop --amend --ledger --specs`, and both treat exit 2 as "fix and re-run, never restore".
- **report-verdict `local` (5) vs step-back-check (6).** report-verdict passes the decision through verbatim, and step-back-check is the only place that maps `patch` to `local`.
- **`config.iterationCap` (4, 6) vs super-roast (7).** The cap reaches the engine only as the computed number. super-roast's engine code is unchanged.
- **resume.md §Redesign cycle replay (4) vs super-design §Re-entry (6).** Both dispatch on state alone and never reset the counters. Both cover the design loop's `beads-filed → applied → post-amendment roast` sequence.
- **Park texts and record formats.** run-state.md and report-prompt.md (4), both SKILL.md files, and the contract-lint fixtures (8) all carry the six new park texts and the `redesign-<loop>-<K>` line with the same wording.

**Seam defects:**

1. **The step-back template's state word is written before the branch exists, and the legacy replay rule reads it as an instruction to patch in place. Both loops are affected.**
   - **The template (6).** `step-back-prompt.md:26` makes the caller record `stepBack<Design|Code>-round-<N>: redesign — <applied | parked | declined>: …`. There is no word for a budget-spent park, a thrash exit or an aborted cycle.
   - **The code loop (4).** It writes that line at Step 1 item 5, on check `ok`, before item 6 (the interactive decline) and item 7 (the budget, scope and record write).
   - **The design loop (6).** It writes the line even earlier, at Step 1 item 4, before the check runs (`skills/super-design/SKILL.md:729`).
   - **The legacy rule.** Both resume texts keep it: `skills/super-auto/resume.md:31` and `skills/super-design/SKILL.md:120`. A `redesign — applied` line with no `redesign-<loop>-<K>` record "replays as before: the recorded redesign is applied from that line if its spec change is not yet committed".
   - **The failure.** A crash anywhere between the line write and the `started` record therefore resumes through the in-place spec patch that §Redesign cycle and Amend Mode now forbid. It also bypasses amend-check and leaves the budget unaccounted for.
   - **Other effects.** The same early write leaves a stale `applied` line on rounds that end up parked, declined (where item 6 appends a second line) or budget-spent.
   - **Scope beyond cluster 4.** Cluster 4 found this for the code loop only. The design loop has the same window, and the root cause is the template contract, not one caller.

2. **Two clusters disagree on who writes state `applied`, and when (4 vs 6).**
   - **Amend Mode's side (6).** Step 7 (`skills/super-design/SKILL.md:946`) says "The orchestrator writes state `applied` here", and the Outcomes paragraph (`:968`) repeats it.
   - **super-auto's side (4).** §Redesign cycle step 1 writes only `amend-checked`, `specs-committed` and `beads-filed`, and writes `applied` in step 4, after the code loop's amend design roast. resume.md replays the `designRoast` sub-states only from `beads-filed`, never from `applied`.
   - **The failure.** An orchestrator that follows Amend Mode's own text writes `applied` before `designRoast r<M>`. A crash during the amend roast then resumes at `applied` ("nothing to replay"), so the amend roast and its fixes are silently lost.
   - **What a fix must keep.** The fix belongs in super-design Amend Mode step 7 and its Outcomes line: the calling loop writes `applied` when its own remaining steps finish. Contract-lint (`tests/super-auto/test-contract-lint.sh:294`) only requires step 7 to contain `Return` and `applied`, so that rewording keeps the lint green.

3. **The punch-list producer does not honour the ledger's input contract after a redesign round (4 vs 6).**
   - **The contract (6).** findings-ledger's header says "The caller passes the latest existing punch list, because a redesign round writes none". super-auto's phase-4 row, Step 4 and §Redesign cycle step 5 follow it.
   - **The producer (4).** super-auto Step 2 (`skills/super-auto/SKILL.md:285`) still builds each punch-list file from "this round's plus the previous round's file". The first `local` round after a redesign round therefore merges nothing from before the redesign.
   - **The failure.** Keys that were punch-listed earlier drop out of the cumulative list, lose their `punch-listed` status in the ledger, and come back as `open`. They can then be re-scoped, re-filed, or counted toward the triggers.

4. **The loop table and the filing block disagree on design-loop amend beads (cluster 6 internal, with a cross-cluster effect).**
   - **The disagreement.** The Amend Mode loop table says design-loop amend beads are "wired under the existing `Integration sweep:`". The step 4 block has no `bd dep add <sweep> <id>` and no `blocked-by … (integration sweep)` description line.
   - **The test gap.** The filing test's design-loop fixture has no sweep bead (cluster 10), so this path is not exercised.
   - **The cross-cluster effect.** super-auto's code loop explicitly opts out ("no sweep edges"), so only the design loop is affected. There the sweep can close before the amended work exists.

**Interface gaps that are not blocking.** These are listed under Deferred OK.
- **Amend Mode step 5 vs both loops' Step 1 item 2.** Step 5 handles a ledger exit 2 "as that loop's Step 1 item 2". After the spec commit that would mean `local — gate not computable`, which contradicts "after the commit nothing aborts".
- **Amend Mode step 4's block vs super-auto §Redesign cycle step 3.** Step 3 files amend-roast tasks "with step 4's filing sequence", but that block reads only `work:` lines from `$AMEND`, and the amend roast has no amend record or input contract.
- **`dissolved@r<N>` lines vs resume.** Both loops write these overrides after `started`, and neither resume text (resume.md `started`, super-design §Re-entry `started`) re-appends them.

## Verdict
not ready (resume can replay an interrupted redesign through the legacy in-place patch in both loops; Amend Mode and super-auto disagree on when `applied` is written; punch list stops being cumulative after a redesign round; design-loop amend beads miss the Integration sweep edge; cluster 2 unreviewed)

## Must fix before landing
- Unreviewed: cluster 2 (docs-superpowers-runs, 24 files including the epic's design spec, run.md, roast reports and coverage files) was over the review window and has no review in this round; the stale 00:30 cluster-2 file is from the earlier pass and does not cover this tip.
- Seam, both loops (cluster 4 finding widened): step-back-prompt.md:26's `redesign — <applied | parked | declined>` line is written before the branch is chosen (super-auto Step 1 item 5; super-design Step 1 item 4, before the check), and resume.md:31 plus super-design SKILL.md:120 replay a `redesign — applied` line with no `redesign-<loop>-<K>` record as a legacy in-place spec patch; defer the redesign line until item 7 has written the record (counter, record and line in one run-state write) or gate the legacy replay on something a new-style run never has, in both loops.
- Seam, skills/super-design/SKILL.md:946 and :968 vs skills/super-auto/SKILL.md §Redesign cycle steps 1 and 4 and resume.md `beads-filed`: Amend Mode step 7 tells the orchestrator to write state `applied`, which in the code loop lands before the amend design roast, so a crash in that roast resumes at `applied` and loses it; make step 7 and the Outcomes line say the calling loop writes `applied` when its remaining steps finish (design loop: immediately; code loop: §Redesign cycle step 4).
- Seam, skills/super-auto/SKILL.md:285 Step 2 vs findings-ledger's `--punch-list` contract: the punch-list file merges "the previous round's file", which a redesign round never writes, so pre-redesign punch-listed keys drop out and reappear as open; use "the latest existing punch-list file" as the phase-4 row, Step 4 and §Redesign cycle step 5 already do.
- skills/super-design/SKILL.md §Amend Mode step 4 filing block, design loop (from cluster 6): when an `Integration sweep:` bead exists for the root, run `bd dep add <sweep> <new-id>` for each filed bead and add the matching `blocked-by <new-id>: consumes all leaves (integration sweep)` line to the sweep's description, as the loop table and spec §4 require; extend test-redesign-cycle-filing.sh's design-loop fixture with a sweep and assert the edge.

## Untested scope
- No test runs a redesign cycle across clusters end to end (Step 1 branch → Amend Mode → beads → super-code re-entry → next roast) in either loop; every script stage is tested alone or in the chain test, which runs no orchestrator, bd or super-code.
- The crash windows between the step-back line, the `redesignCycles-<loop>` increment, the `started` record and the `dissolved@r<N>` writes have no resume test in either loop.
- Code-loop amend design roast end to end (report location, `roast-design:` pointer, `findingsLedgerDesign` rebuild inputs and overrides file, `designRoast` markers) is prose only (cluster 4).
- Filing `sp:redesign-code-<K>-roast` tasks through Amend Mode step 4's block, which has no `$AMEND` input contract for amend-roast tasks, is untested (clusters 4, 6).
- resume.md §Redesign cycle replay and super-design §Re-entry state dispatch, and the Step 1 forced-redesign, gate-not-computable and interactive-decline paths, are pinned only as wording by contract lint (clusters 4, 6, 8).
- Design-loop amend filing against a tree that already has an `Integration sweep:` bead has no fixture (clusters 6, 10).
- The filing block's `id_of` title dedupe and supersede lookup against titles that real `bd list --json` escapes (`<`, `>`, `&`, `"`, `\`); the stub bd prints titles raw (clusters 6, 10).
- amend-check's design-loop reverse rule when `owner:` and `amended:` spell the same spec differently (`./docs/x.md` vs `docs/x.md`) (cluster 6).
- The amend-prompt and the revised step-back-prompt as agent behaviour have no eval, and spec §7's manual replay acceptance was routed to the report phase (cluster 6).
- No report-verdict fixture shows a `local` or `patch` record carrying `changes:`/`scope:` emits only `summary:`, and the near-miss word boundary is pinned only for `localized`, not `patch`/`redesign` near-misses (clusters 5, 9).
- No super-roast test asserts that `--config '{"iterationCap":N}'` with N > 3 renders `iteration: K of N`, and whether the reporter copies reporter-prompt.md:225's literal `N of 3` rests on prose (cluster 7).
- Contract lint has no mutation case for the dissolved-before-branch guard, the Amend Mode step 2 restore guard, super-design Step 1 item order, check_report_rows' `disputed` term, check_itercap's super-roast branch or the run-state.md cap-spelling grep (cluster 8).
- The design loop's cap disposition writing disputed keys into `roastDesignCapped:`, and the park texts in run-state.md's parked row and both SKILL.md files, are not linted; resume.md and report-prompt.md are not scanned for the cap spelling (cluster 8).
- step-back-check has no case for an invalid `decision:` value, a `scope:` not starting with `inside`/`outside`, or a `local` record citing a mechanical trigger the ledger lacks (fixture `local-under-trigger.md` is unused) (cluster 10).
- amend-check has no case for a malformed `owners:` line, `amended:` naming a spec missing from `--specs` or a section that does not exist, or malformed `amended:`/`supersedes:` lines (cluster 10).
- The filing test never runs the subepic-parent branch (`PARENT != ROOT`), and the chain test does not chain Amend Mode step 5's disputed owner → overrides line → ledger rebuild (cluster 10).
- docs/superpowers/specs/INDEX.md has no automated check; its link, ordering and summary were verified by hand only (cluster 3).

## Deferred OK
- Amend Mode step 5 handles a ledger exit 2 "as that loop's Step 1 item 2", which after the spec commit would mean `local — gate not computable`; state that after the commit it takes the retry-then-`redesign incomplete` path (carried from the earlier pass; still present).
- Define the input contract for the code loop's amend-roast tasks (a `work:`-format file the orchestrator writes, and its path for resume dedupe) since Amend Mode step 4's block reads only `$AMEND` (clusters 4, 6).
- Both loops' resume `started` action should re-append the round's validated `dissolves:` lines when missing; today the keys stay open and the designer must account for them, which fails safe (clusters 4, 6).
- The filing block's `id_of` should match a JSON-decoded title and pass `--limit 0`; with an escaped title the design-loop `bd supersede --with ""` fails even on the first pass, not only on resume, but no current bead title contains `<`, `>` or `&` (clusters 6, 10).
- Add a Post-Implementation Note to the design spec recording that `dissolved@rN` lines are written only in a taken redesign and removed on abort (commit 746f0c13) (clusters 4, 6).
- super-auto SKILL.md:224 field ownership and run-state.md's field table do not say super-auto writes `roastDesignRound` and `findingsLedgerDesign` during the code loop's amend roast (cluster 4).
- super-auto MAINTENANCE.md F45/D6 rows still name run-state.md item 5 as the cap's one home, and its recipe inventory lacks findings-ledger (cluster 4).
- run-state.md example: ledger file name differs from `<run-dir>/findings-ledger.md`, the amend-roast park cites a roast-pr report, and `roast-code:` lists one report at round 3 (cluster 4).
- super-auto Step 1 item 2's "skip items 3–7, and run Steps 2–4" reads as bypassing the cap test; §Loop exits' ordering sentence governs (cluster 4).
- A disputed Blocking key is still routed in-scope by the scope filter in later `local` rounds; the spec is silent and report-prompt's disputed route stays correct (cluster 4).
- amend-check should normalise `owner:` spec paths as it does `amended:` and `--specs` paths (cluster 6).
- Replace "spec §4's parent" in super-design SKILL.md with the rule itself, add `--limit 0` to amend-prompt.md's task-tree dump, make step-back-check's trigger-name scanner reject capitalised names clearly, and pin amend-check's `## Unchanged behavior` test to a level-2 heading (cluster 6).
- reporter-prompt.md:225 keeps the literal `iteration: N of 3` under the Global Constraint that super-roast is unchanged; the label is cosmetic since no consumer parses it (cluster 7).
- super-roast SKILL.md's Inputs table does not list `config.iterationCap` or the `assemble-args --config` route, matching how its other config keys are documented (cluster 7).
- Contract lint's copy() symlinks sibling skills, the budget-compare check matches only the backticked `< N` form, the disputed-design-capped-stopped case pins `status: clean` for a stopped cap, and the header comment misattributes two stepBack fields as post-2bf1d53 (cluster 8).
- Report-verdict near-miss fixtures for `patches`/`redesigned` and a `changes:` line in step-back-local.md would harden the test; report-verdict's default output omitting `triggers:` is by spec (clusters 5, 9).
- test-redesign-chain.sh's stale-path guard greps the CLAUDE.md symlink and so never searches AGENTS.md; `ledger-recurrence.md` uses an evidence shape findings-ledger never emits; `local-under-trigger.md` is dead (cluster 10).
- The AGENTS.md release test list is hand-curated with no check that every tests/**/test-*.sh is listed; pre-existing (cluster 1).
- Flip both 2026-10-16 roast-findings-redesign-loop INDEX.md rows to `implemented` at finish, and optionally widen the design row's summary to name the per-script super-design suites (cluster 3).
