# Final seam review: super-plan-59b (roast-findings-redesign-loop)

Branch: `super-auto/roast-findings-redesign-loop` @ 33952061 (merge base with main 3f4fdba3).
Epic: super-plan-59b. Spec: `docs/superpowers/runs/2026-10-16-roast-findings-redesign-loop/2026-10-16-roast-findings-redesign-loop-design.md`.
Inputs: the eight cluster reviews, `clusters.json`, and the cross-cluster hunks found with `git diff 3f4fdba3 HEAD`.

## Cluster verdicts carried in

| Cluster | Name | Verdict |
|---|---|---|
| 1 | agents-md | ready |
| 2 | docs-superpowers | ready |
| 3 | skills-super-auto | not ready (resume.md:29 re-files and scope-filters a redesign round's findings on resume) |
| 4 | skills-super-code | ready |
| 5 | skills-super-design | not ready (design-loop Amend Mode has no procedure or record field for `bd supersede`) |
| 6 | tests-super-auto | ready |
| 7 | tests-super-code | ready |
| 8 | tests-super-design | ready |

## Seams checked

Most of the cross-cluster interfaces run between cluster 3 (super-auto prose) and cluster 5 (super-design scripts and Amend Mode). A few more run into cluster 4 (report-verdict) and the test clusters.

- **findings-ledger CLI and output (5) vs super-auto Step 1 items 2, 3, 6 and 8 (3).**
  - The flags agree: `--loop code`, `--out`, `--report N=`, `--final-review M=`, `--punch-list` and `--overrides`.
  - Step 2's punch-list file (`[SEV] <location>` per line) matches the ledger's `--punch-list` grammar.
  - The final-review keys file (`[Must-fix] …` lines with no `rN `) matches `--final-review`.
  - The `blocking: r<N-1>= r<N>=` line feeds item 3's breach test.
  - The `findings-ledger: bad input: <path>` stderr line names the input that item 2 drops.
  - The code-loop paths in the script header (`<run-dir>/findings-ledger.md`, `<run-dir>/findings-overrides.md`) match SKILL.md, step-back-prompt.md and I8.
- **step-back-check (5) vs super-auto item 5 and the dispatch row (3).** The interfaces agree:
  - `--step-back`, `--keys` and `--ledger` all match.
  - The old `<this skill's dir>/scripts/step-back-check` path is gone from skills/ and tests/, and the chain test guards against it coming back.
  - The "may name only keys in" line that super-auto used to add now lives in step-back-prompt.md as `[KEYS_FILE]`, and the dispatch row passes that file and `[LEDGER_PATH]`.
- **report-verdict `local` (4) vs step-back-check and findings-ledger (5).** The mapping is consistent:
  - report-verdict passes the decision through verbatim.
  - step-back-check is the one place that maps `patch` to `local`.
  - findings-ledger treats a step-back file as bad input, because `--keys` exits 3, and cluster 7 pins that refusal for `step-back-local`.
- **Amend Mode (5) vs super-auto §Redesign cycle and §Fix-bead template (3).**
  - The amend record path `<run-dir>/amend-code-<K>.md` matches.
  - The label `sp:redesign-code-<K>` matches.
  - Amend Mode is the single filer, and the orchestrator writes every state.
  - The `aborted` path falls back to `local`, and spec restore stays inside Amend Mode.
  - The clean-spec precondition is met by item 8's commit before `started`.
- **run-state.md (3) vs super-design §Run-State File (5).**
  - The `findingsLedgerDesign`, `redesignCycles-design`, `redesign-design-<K>` and `stepBackDesign-round-<N>` formats agree.
  - The six new `degraded-verdict` park texts read the same in run-state.md, report-prompt.md, super-auto SKILL.md and super-design SKILL.md.
- **resume.md §Redesign cycle replay (3) vs super-design §Re-entry (5).** The state dispatch agrees for both loops, including the design loop's `beads-filed → applied → post-amendment roast`.
- **`config.iterationCap` (3, 5) vs super-roast (unchanged).** `super-roast-workflow.md` already reads `config.iterationCap`, so the Global Constraint that super-roast does not change holds.
- **Test clusters (6, 7, 8) vs scripts (3, 4, 5).** All suites pass at the tip, per each cluster review. AGENTS.md (1) lists all four new super-design suites.

## Cross-cluster defect found

**After a code-loop redesign cycle, the super-code re-entry runs against a closed root epic and exits at once with `stopReason: root-closed`. No amend beads execute.**

- The only `bd update <epicId> --status open` in super-auto is in §Step 3 — file fix beads (`skills/super-auto/SKILL.md:290`, cluster 3).
- Cluster 3's new §Redesign cycle skips Step 3 on purpose: "a redesign is never … filed through §Step 3", and a redesign round skips per-finding filing.
- Bead filing moved into super-design §Amend Mode step 4 (cluster 5, `skills/super-design/SKILL.md:896-899`). That step files the `work:` beads "per §Decomposition" under the root epic, and it never reopens the epic.
- The amend-roast tasks the loop files (`sp:redesign-code-<K>-roast`, §Redesign cycle step 3) bypass Step 3 the same way.
- By phase 5, the root epic has already been closed by the preceding super-code run. That is why Step 3 has to reopen it.
- I checked bd 1.3.0 in a scratch repo: `bd create --parent <closed epic>` creates the child and leaves the epic `closed`.
- `super-code/scripts/close-in-tree-epics` reports `rootClosed` straight from the epic's status. `coordinator.js:602` breaks out of the first round with `root-closed` whenever `rootClosed` is true and nothing is pending.
- So §Redesign cycle step 4's "re-enter `super-code`" does no work. The next roast then re-validates an unchanged tree, and the cycle has spent budget for nothing.
- No single cluster owns this. Cluster 3 removed the redesign from the step that reopens the epic, and cluster 5's Amend Mode files beads without that step. The spec has the same gap (§3 step 4, §4 step 4).
- A cheap fix: in super-auto §Redesign cycle, reopen the epic (`bd update <epicId> --status open`) before Amend Mode's bead step, or at the latest before the step-4 super-code re-entry, so the amend-roast tasks are covered too. Alternatively, add the reopen to Amend Mode's `code` row in the loop table. Either way, the `beads-filed` resume path then runs it as well.

## Smaller seam observations (non-blocking)

- **No punch-list file after a redesign round.** A redesign round skips Step 2, so it writes no `…-roast-pr-<N>-punch-list.txt`. The phase-4 row still says to pass "the prior round's punch-list file" to the next round, and §Redesign cycle step 5 names only the prior report. The next roast should get the latest existing punch-list file (Step 1 item 2 already says "latest"). The text does not say so.
- **Amend Mode inputs vs §Redesign cycle step 1.** Amend Mode's Inputs list the root epic id, the spec paths, the roast report paths and the mode flags. super-auto §Redesign cycle step 1 omits all four. The orchestrator runs Amend Mode inline and already holds them, so this is wording drift, not a broken handoff.
- **A ledger exit 2 inside Amend Mode.** Amend Mode step 5 handles a ledger exit 2 "as that loop's Step 1 item 2". In super-auto, a second exit 2 at item 2 records `stepBackCode-round-<N>: local — gate not computable` and runs Steps 2–4. After the spec commit, that conflicts with "after the commit nothing aborts". Read literally, it would re-scope a round whose redesign was already applied. The intended reading, retry once and then park `redesign incomplete`, is not stated where the two texts meet.

## Verdict
not ready (super-code re-entry after a code-loop redesign hits a closed root epic and runs no amend beads; plus cluster 3 resume.md and cluster 5 supersede must-fixes)

## Must fix before landing
- skills/super-auto/SKILL.md §Redesign cycle (with super-design §Amend Mode's code-loop row): reopen the root epic (`bd update <epicId> --status open`) before Amend Mode files its beads, or before the step-4 super-code re-entry. Today the only reopen is in §Step 3, which a redesign round skips. super-code then sees `rootClosed` (close-in-tree-epics reads the epic's status, and bd does not reopen a closed parent on `bd create --parent`), stops with `root-closed`, and no `sp:redesign-code-<K>` or `sp:redesign-code-<K>-roast` bead runs.
- skills/super-auto/resume.md:29: limit "findings … missing as beads are re-filed" and "only findings with no matching record go through the scope-filter pass" to rounds with no non-aborted `redesign-code-<K>` record for that round. Then a resume of a redesign round neither duplicates Amend Mode's `sp:redesign-code-<K>` beads nor runs the scope filter (spec §3, "Skipped in a redesign round"). (From cluster 3.)
- skills/super-design/SKILL.md §Amend Mode step 4 and skills/super-design/amend-prompt.md: make the spec §4 design-loop supersede executable. Have the designer name the obsoleted open bead ids, for example in a design-only `supersedes:` field, and have step 4 run `bd supersede` on each one, skipping beads already closed. Today only a loop-table cell mentions it, so the beads for the replaced decision stay open beside the new work beads. (From cluster 5.)

## Untested scope
- The code-loop redesign path end to end has no test: Step 1 starts a cycle, Amend Mode files beads, super-code re-enters on the run's epic, and the beads execute. That gap is how the closed-epic defect went unseen. Every script stage is tested only in isolation or in the chain test, which runs no bd or super-code.
- Everything spec §7 lists as prose-only, for both loops, has no script test: Step 1 ordering against the exit tests, forced redesign or thrash after two rejects, the ledger exit-2 degrade, the interactive decline, budget and effective-cap arithmetic, the lastGood breach, the extension-round replacement rule, Amend Mode's sequence (clean-spec precondition, restore, retry, no abort after the commit), title-deduped bead filing, coverage-amend outside the cap, and resume and Re-entry state dispatch. (Clusters 2, 3, 5, 8.)
- Spec §7's manual acceptance has not run yet: replaying the 2026-10-15 coordinator-subagent-compaction round-1 code roast through findings-ledger and the amend designer. The spec assigns it to the report phase. (Clusters 2, 3, 5.)
- The roast round after a redesign round has no defined punch-list input, because the redesign round writes no punch-list file. Nothing checks what super-auto passes as `--punch-listed` there.
- run-state-formats-2bf1d53.txt does not pin the `redesign-<loop>-<K>` line format, its state and `designRoast` vocabulary, or the changed `stepBack…-round-<N>` forms. So contract-lint does not verify the record formats that spec lines 284-285 claim it does. (Cluster 6.)
- The disputed-Blocking route before `roastCodeCapped:` is prose only. disputed-capped.md tests only report-status counting the key, and no fixture covers a disputed key in `roastDesignCapped:`. (Cluster 6.)
- report-prompt.md's new Remaining and Gotchas sources have no fixture checking that a drafted report lists `disputed` rows or the six new park texts. (Cluster 3.)
- findings-ledger has no fixture for: a key first raised in a degraded round, a missing round N-1, the `[panel-capped: N unverified]` qualifier, a returned Nit not firing recurrence, duplicate final-review rounds, or an override targeting a final-review row. (Clusters 5, 8.)
- amend-check has no case for: a newly created untracked spec, a duplicate `owners:` key, `./`-prefixed vs bare spec paths, a `## Goal` heading inside a code fence, a design-loop `local` item without a `work:` line, or a multi-`--specs` root choice. (Clusters 5, 8.)
- step-back-check has no case for: cited triggers carrying parenthesised evidence with commas, a misspelled semantic trigger, or an unknown key in `remains:`. (Clusters 5, 8.)
- test-redesign-chain.sh runs amend-check against the pre-dissolve ledger (`L2-pre.md`), not the post-dissolve ledger that Step 1 actually hands Amend Mode. (Cluster 8.)
- test-report-verdict.sh does not assert the exit code of the `decision: local` case, and has no near-miss token case such as `localized`. (Cluster 7.)

## Deferred OK
- Name the punch-list input for the roast round after a redesign round (the latest existing punch-list file) in the super-auto phase-4 row or §Redesign cycle step 5.
- Make super-auto §Redesign cycle step 1 list the same inputs as Amend Mode's Inputs: root epic id, spec paths, roast report paths, mode flags.
- State that a ledger exit 2 during Amend Mode step 5 after the spec commit takes the retry-then-`redesign incomplete` path, not Step 1 item 2's gate-not-computable `local` branch.
- docs/superpowers/specs/INDEX.md row: replace `tests/super-design/test-scripts.sh` with the four per-script suites, and drop "single design-roast round", when finish flips the row to `implemented`. (Cluster 2.)
- Spec §5 resume `amend-checked` has no rule for a spec commit that landed before `specs-committed` was written. (Cluster 2.)
- The round-2 rejected-with-residual Nits (r4 `open (returned)` fixture, key-drift spike, final per-key status wording, forbidding new spec files) are not carried into the spec. (Cluster 2.)
- The step-back record's "six clusters / 25 findings" counts are a cosmetic slip in the historical record. (Cluster 2.)
- run-state.md worked example: the pointer lists lag `roastCodeRound: 3` and `designRoast r3 fixed`, the amend-roast park cites `roast-pr-3.md`, and the ledger filenames differ from the paths the procedures write. (Cluster 3.)
- Move report-prompt.md's "`report-status` therefore needs no change" rationale to MAINTENANCE.md. (Cluster 3.)
- Disputed Blocking keys are not excluded from Step 2's scope keys file, so later `local` rounds file fix beads for them. The spec says nothing on this. (Cluster 3.)
- Step 1 item 8 increments `redesignCycles-code` before writing `redesign-code-<K>`. This is the order the spec prescribes, but a crash between the two writes loses a budget unit. (Cluster 3.)
- The Step 1 item 3 breach compare has no stated behaviour when `r<N-1>=` is `-`. (Cluster 3.)
- §Redesign cycle step 3 does not say to append the amend roast report to `roast-design:`, nor name the design overrides file for the `findingsLedgerDesign` rebuild. (Cluster 3.)
- super-auto MAINTENANCE.md does not record the removed thrash-by-count rule, the step-back at exit or the in-place redesign patch, and its inventory does not list findings-ledger. (Cluster 3.)
- findings-ledger: fix the false `open (returned rN)` label after a degraded first confirmation by adding `first[k] < p` to the returned condition. (Cluster 5.)
- step-back-check: parse the cited `triggers:` paren-aware. (Cluster 5.)
- step-back-prompt.md: drop the `redesign — declined` form. The run-state.md example `stepBackCode-round-2: redesign — applied: …` uses the same template. (Cluster 5.)
- super-design SKILL.md §Hand-off still says "cap-3 loop". (Cluster 5.)
- Wording mismatch on `[REJECTS]`: "empty" in SKILL.md vs "none — first attempt" in amend-prompt.md. (Cluster 5.)
- Amend Mode step 4 does not repeat spec §4's parent rule (root epic, or the subepic that owns the amended spec). (Cluster 5.)
- amend-check: reject duplicate `owners:` keys, and normalise `./` spec paths. (Cluster 5.)
- amend-prompt.md: the `covers:` description does not note that keys may contain `, ` or ` | `. (Cluster 5.)
- findings-ledger: pipefail/SIGPIPE on `printf | grep -q` cannot fire in practice. (Cluster 5.)
- Add the new record and stepBack formats to run-state-formats-2bf1d53.txt; a norm() mutation case is optional. (Cluster 6.)
- Add `assert_eq "$code" 0` to the local and redesign step-back cases; a word boundary in report-verdict's decision regex is optional. (Cluster 7.)
- The test-step-back-check.sh temp files are not covered by a `trap`, and the test-amend-check.sh throwaway repos inherit global git config. (Cluster 8.)
- amend-check accepts a `covers:` key that is not an open ledger key. The spec does not require rejecting it. (Cluster 8.)
- The mixed executable bits on the new test files are harmless, because AGENTS.md runs every test with `bash`. (Cluster 1.)
- test-package-codex-plugin.sh fails inside linked worktrees. This predates the epic, and the release runs on a clean main. (Cluster 1.)
