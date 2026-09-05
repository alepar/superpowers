status: clean [degraded: panel-capped: 18 unverified (design roast round 1, proceeded), code roast skipped, final review: LAND (1 minor deferred)]
metrics: docs/superpowers/runs/2026-09-04-audit-plan-instrumentation/upstream-feedback-draft.md (parked draft — proposed, not filed; 9 defects, 3 design questions, 2 doc gaps, Run metrics with the bead graph)

# super-auto run — 2026-09-04-audit-plan-instrumentation

Branch `super-auto/audit-plan-instrumentation` at `7fb4cd0`, to merge into `main`. Epic `super-plan-qfy`, 11 leaves, all closed. Sweep at the tip: 860 passed, 0 failed (`bash tests/super-code/test-coordinator-replay.sh`). Reader: decide whether to merge; the status line above is the whole risk summary.

## Implemented

Sourced from the closed beads under `super-plan-qfy`, `run.md`'s `codeBuckets.completed`, and the ledger's completion lines (`.superpowers/sdd/super-plan-qfy-plan/progress.md`). Diff: 16 files, +1041/−95.

- **super-plan-qfy.1** — super-roast reporter emits a `seat-agreement:` header line (rr/rg/fg pairwise agreement, unanimous, leave-one-out `ground-loo (n=…)`, per-seat C/R/U counts); `votes[]` seat order documented in the packet contract. Commit `835e4b3`. Ledger: `Task 1: complete (835e4b3..835e4b3, review clean)`.
- **super-plan-qfy.2** — super-roast PR `testing` lane gains three integrity hunts (hardcoded expected values; weakened/removed assertions; deleted, renamed-away, or skipped tests) and one pragmatism sentence (a documented test refactor is not a finding). Commit `add969a`, merged at `7fb4cd0`. The implementer's edit sat uncommitted after a classifier refusal; the sequencer committed it and the coordinator reviewed and merged it on relaunch.
- **super-plan-qfy.3** — super-code appends a `Merge:` ledger line per serial merge on both the success path and the blocker path (`→ blocker`), with rebase/seam-review/gate outcome; `mergePrompt` reports `rebaseConflictFiles`. Commit `9d026ba`. Ledger: `Task 3: complete (81a69d7..9d026ba, review clean)`.
- **super-plan-qfy.4** — super-code Finish appends the four-line `Metrics:` block (merges/merge-failed/conflicts/seam-reviews/gate-fails; fix-loop yield per round with series dedupe; breaker-tripped; `ledger-check`) and returns `metrics`. Commit `4a070fa`. Ledger: `Task 6: complete (321b3cc..4a070fa, review clean)`.
- **super-plan-qfy.5** — super-auto phase-5 scope filter (`scope-filter-prompt.md`, Blocking always in-scope), `scopeFilter-round-N` run.md records with the `scope-filter:` aggregate line, and the `metrics:` pointer in `report.md` with the pending-then-rewrite rule. Commits `16deb53`, `30ba31c`.
- **super-plan-qfy.6** — super-design coverage: the orchestrator writes a canonical requirement list per round into `run.md`; reviewers map by id and may propose `R-new`; the `requirements: N · mapped: M · unmapped: K` line. Commit `44fabab`. Ledger: `Task 8: complete (7fb4cd0..7fb4cd0, review clean)`.
- **super-plan-qfy.7** — super-design pairs every `bd dep add` with a `blocked-by <id>: consumes <artifact>` line in the dependent's description, with fixed tokens for sweep and seam edges and a worked example over four edge kinds; the NARRATIVE-EDGE check reads it. Commit `64488f6`.
- **super-plan-qfy.8** — upstream-feedback gathers the new metrics and a bead-graph dump (`bd list … --limit 0`) and renders a `## Run metrics` section (Judge panel, Fix loop, Merge-back, Coverage, Bead graph) between Defects and Design questions; `none` plus a Not-established note when a source is absent. Commit `589f798`. Ledger: `Task 10: complete (ccf5b0a..589f798, review clean)`.
- **super-plan-qfy.9** — super-code reviewer, re-review, and seam-review dispatches each compute a `## Test changes` block (new default pathspecs including bare-filename and top-level forms, command-stated rule, 400-line cap, post-rebase range for seam review); `config.testPaths` replaces the defaults, empty array rejected. Commit `ec91178`. Ledger: `Task 5: complete (2187683..ec91178, review clean)`.
- **super-plan-qfy.10** — super-code `reviewAndFix` appends a per-round fix-loop ledger line in the coordinator's shape (`Task <N> (<bead-id>): fix round <R>/5 (…)`); resume behaviour stated unchanged. Commits `2fe9e10`, `3df7d13`. Ledger: `Task 4: complete (7fb4cd0..7fb4cd0, review clean)`.
- **super-plan-qfy.11** — Integration sweep: all five format strings verified token-for-token between producer files and upstream-feedback's three consumer files; zero drift; no code change. Ledger: `Task 11 (super-plan-qfy.11): sweep note — integration tip 7fb4cd0 …`.

Replay harness grew by 335 lines (new stub keys, prompt-text assertions, fixture-repo pathspec assertion, pinned-arithmetic Metrics scenario): 702 → 860 passing.

## Remaining

Nothing did not land. `codeBuckets.escalated` and `pendingRetry` are empty after reconciliation against the tracker: the coordinator's own return listed `.3`, `.9`, `.11` as escalated and `task-9` as pending retry, but every one was implemented, reviewed, merged, and closed; the entries came from false-premise blocker beads (see Smells). The one parked record in `run.md` is a `degraded-verdict`, not an escalation: design roast round 1 returned `Blocking (8 confirmed) [panel-capped: 18 unverified]`, and the autonomous run declined the raised-cap re-roast and proceeded; the 18 unjudged candidates are listed in `2026-09-04-audit-plan-instrumentation-roast-design-1.md` under "Not verified (beyond panel cap)", and the plainly-true ones touching amended sections were applied unverified (coverage ledger, roast round 1 section). Round 2 hit no cap and converged. No `scopeFilter-round-N` records exist (no code roast ran).

## Gotchas & surprises

Sourced from the two design-roast reports, the coverage ledger, the ledger's triage lines, and the final review.

- **The default test pathspecs were wrong for git twice.** Round 1 found `'**/tests/**'` never matches a top-level `tests/` tree (this repo's own suite was invisible to the guard). The fix added top-level forms; round 2 found root-level test files (`main_test.go`) still unmatched by `'**/*_test.*'`, so bare-filename alternates were added and the fixture assertion covers all three cases. Both were reproduced in a scratch repo by the judges.
- **"ground-alone parity" was an algebraic identity** of the three pairwise agreements, (1 − rr + rg + fg)/2, and carried no information for the R4 decision it was meant to inform. Replaced by a leave-one-out statistic.
- **super-code never wrote SDD's per-round fix line**, so the Metrics block would have parsed lines that did not exist. The promotion reviewer caught it; bead `.10` was added and `.4` re-pointed. The line uses the coordinator's shape (ordinal plus bead id), not SDD's verbatim shape, because the coordinator's ledger regex requires the bead id.
- **Two round-1 fixes interacted:** a both-paths `Merge:` count compared against the `completed` bucket would report a false ledger mismatch on every run with a failed merge. Round 2 caught it; M now counts success-path lines and `merge-failed Mf` is separate.
- **Dedupe by round versus by series:** the round-1 resume rule kept rounds 2–3 of an abandoned attempt. Fixed to drop every line before a bead's last round-1 line.
- **A safety classifier refused agents whose prompts quoted bead `.2`'s wording** (hunting for weakened or hardcoded tests), including two mechanical ledger appends. The implementer's edit was complete on disk; the sequencer committed it.

## Entrypoints

In the tree's dependency order, root-most first.

1. `docs/superpowers/runs/2026-09-04-audit-plan-instrumentation/2026-09-04-audit-plan-instrumentation-design.md` — the spec, §1–§10, with every roast amendment inline.
2. `skills/upstream-feedback/report-template.md` — the `## Run metrics` section is the consumer contract every producer feeds; read it first to see what a filed issue will carry.
3. `skills/super-code/coordinator-workflow.md` — the `Merge:` line (§Serial merge-back), the per-round fix line in `reviewAndFix`, the Finish `Metrics:` block, and the `## Test changes` block in the review, re-review and seam-review prompts.
4. `skills/super-roast/reporter-prompt.md` — the seat-agreement step and worked example.
5. `skills/super-design/SKILL.md` §Decomposition and §Coverage — the `blocked-by` line and the canonical requirement list.
6. `skills/super-auto/scope-filter-prompt.md`, `run-state.md` item 7, `report-prompt.md` status block.
7. `tests/super-code/replay-harness.mjs` — the new scenarios and assertions.

## Smells

Derived from the ledger, the final review, `run.md`, and `friction.md`; nothing re-judged.

- **Six false-premise blocker beads on four completed tasks** (`.3` twice, `.7`, `.9`, `.11` twice, plus two on `.2` and one each on `.1`/`.8` in round 1). Cause named by the final reviewer: completion-detection prompts resolve task artifacts by the wrong address (task worktree instead of the integration workspace; `task-<bead-suffix>-report.md` instead of `task-<ordinal>-report.md`; dash-only branch form while `.7` landed on `task/…`). Three tasks burned the one-retry bound to BLOCKED while already merged. All eleven blocker beads are closed with that reason. This is a super-code defect to file upstream, not a defect in this branch.
- **The recurring-minor detector did not fire** on that six-instance cluster; it counts review minors, not blocker beads. This branch instruments recurrence and still missed its own run's dominant pattern.
- **The ledger holds completion lines for 6 of 11 tasks.** Fire-and-forget appends lost the rest, two of them to the classifier. The final reviewer reconstructed completions from `git log`. The `Metrics: ledger-check` line this branch adds is the first cross-check for exactly this.
- **Implementers report IMPLEMENTED without committing** (`.8` and `.2`). Both were recovered; neither pipeline's brief makes the commit an explicit terminal step.
- **The relaunch to finish two beads took 7.8 hours and 107 agents**, almost all of it the false-blocker churn above.
- **One deferred minor**, accepted by the final review: `tests/super-code/replay-harness.mjs` has no scenario reaching the `roundFinding ?? 'no finding recorded'` fallback string in `reviewAndFix`.
- **Design roast round 1 left 18 severe candidates unjudged** at the default panel cap of 12 on a 52-finding dedupe. A design spec plus a settled tree yields more severe candidates than a code PR; the default cap may be tuned for the latter.
- **This run predates its own instrumentation.** The coordinator that executed it was the pre-change script, so no `Merge:`/`Metrics:` lines, no `seat-agreement:` line, and no `requirements:` line exist for this run; the `## Run metrics` section of the upstream-feedback issue will read `none` for those and carry only the bead graph.
