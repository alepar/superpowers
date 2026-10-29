# review-continuity-followups: super-auto's code-roast punch list is not in the form super-roast accepts

Plugin: superpowers 6.4.2-alepar6.6. Run: 36 beads under one epic, 5 super-code invocations, design roast 3 rounds, code roast 5 rounds (2 redesign cycles), ~10h wall clock, 2026-10-28/29.

## Defects

### 1. `scope-dispositions --project --keys` emits punch-list keys that `assemble-args --punch-listed` rejects
- **Evidence:** friction log 19:59Z: "scope-dispositions --project --keys punch list includes final-review untested/deferred keys that assemble-args --punch-listed rejects (not [SEV] <location>); passed only the roast-format keys (filtered copy …punch-roast-r1.txt), original punch-list file unchanged". super-auto §Step 2 names that stdout as the next roast's punch-listed input; every code-roast round 2–5 then ran on a hand-filtered copy ("3 punch-listed (open)").
- **Premise to verify:** final-review `untested:`/deferred keys never belong in a roast's punch-listed input (they are tracked by the projection and the report), or else need a form `assemble-args` accepts.
- **Suggested fix shape:** a roast-format filter on `scope-dispositions --keys` used by super-auto's documented call, or `assemble-args` skipping non-`[SEV] <location>` lines with a warning instead of rejecting.

### 2. The code findings ledger keeps findings `open` after the next roast's delta reports them resolved
- **Evidence:** friction log 20:14Z: "round-1 findings the round-2 roast reports as resolved (delta: 8 resolved, listed with fixing commits) still read 'open' in the code ledger; Amend Mode's code coverage rule then demands work: lines or disputes for already-fixed keys". Both amend cycles disputed already-resolved keys by hand (findings-overrides: 82 `disputed@r2`, 125 `disputed@r4`, many citing "already resolved by <commit>, verified by roast round N").
- **Premise to verify:** a roast's `Prior report tracking` / delta "resolved" entries (key plus fixing commit) are reliable enough to drive ledger status.
- **Suggested fix shape:** `findings-ledger` marks prior-report-tracking resolved keys `resolved` (with commit) when the round is recorded, or `amend-check` exempts them.

### 3. The Amend Mode filing sequence passes the `bd create` title positionally
- **Evidence:** friction log 00:38Z: "a work: title beginning with '--' (here '--repair-check …') is parsed by bd create as a flag; the documented filing sequence passes the title positionally and fails; used --title=". super-design SKILL.md §Amend Mode step 4: `bd create "$title" --parent …`.
- **Premise to verify:** `bd create --title=<t>` is supported by every bd version the skills target.
- **Suggested fix shape:** `--title="$title"` in the documented sequence (and sibling `bd create` calls), plus a fixture whose title starts with `--`.

### 4. ledger-check compares the run ledger against every epic's `task-*` landings in the repository
- **Evidence:** all super-code `Metrics:` blocks: "Metrics: ledger-check ok · append-failed 0 · append-retried 0 · scope: observed ledger; completed after available tracker reconciliation · git-only [super-plan-998.1, super-plan-998.10, super-plan-998.2, super-plan-998.3, super-plan-998.4, super-plan-998.5, super-plan-998.6, super-plan-998.8, super-plan-998.9, super-plan-goq.1, super-plan-goq.10, super-plan-goq.11, super-plan-goq.12, super-plan-go…"; the git-only set is beads of three other epics (998, goq, ufz), not this run's; every invocation therefore reports "gaps: ledger/Git identities differ".
- **Premise to verify:** a landing identity can be attributed to an epic (bead-id prefix or recorded epic membership).
- **Suggested fix shape:** scope the git side of ledger-check to the run's epic tree (`epic-tree`); report out-of-epic identities separately or not at all.

## Run metrics
### Judge panel
- 2026-10-28-review-continuity-followups-roast-design-1.md: mode: design iteration: 1 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 36 · rr 0.83 · rg 0.81 · fg 0.75 · unanimous 0.69 · ground-loo 0.83 (n=30) · reproduce 7/29/0 · refute 5/31/0 · ground 12/24/0
- 2026-10-28-review-continuity-followups-roast-design-2.md: mode: design iteration: 2 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 9 · rr 0.78 · rg 0.78 · fg 0.78 · unanimous 0.67 · ground-loo 0.86 (n=7) · reproduce 5/4/0 · refute 5/4/0 · ground 5/4/0
- 2026-10-28-review-continuity-followups-roast-design-3.md: mode: design iteration: 3 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 7 · rr 0.71 · rg 0.71 · fg 0.71 · unanimous 0.57 · ground-loo 0.80 (n=5) · reproduce 6/1/0 · refute 4/3/0 · ground 6/1/0
- 2026-10-28-review-continuity-followups-roast-pr-1.md: mode: pr iteration: 1 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 26 · rr 0.88 · rg 0.88 · fg 0.77 · unanimous 0.77 · ground-loo 0.87 (n=23) · reproduce 12/14/0 · refute 9/17/0 · ground 15/11/0
- 2026-10-28-review-continuity-followups-roast-pr-2.md: mode: pr iteration: 2 of 3 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 4 · rr 1.00 · rg 1.00 · fg 1.00 · unanimous 1.00 · ground-loo 1.00 (n=4) · reproduce 3/1/0 · refute 3/1/0 · ground 3/1/0
- 2026-10-28-review-continuity-followups-roast-pr-3.md: mode: pr iteration: 3 of 4 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 2 · rr 0.50 · rg 1.00 · fg 0.50 · unanimous 0.50 · ground-loo 1.00 (n=1) · reproduce 2/0/0 · refute 1/1/0 · ground 2/0/0
- 2026-10-28-review-continuity-followups-roast-pr-4.md: mode: pr iteration: 4 of 4 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 1 · rr 1.00 · rg 1.00 · fg 1.00 · unanimous 1.00 · ground-loo 1.00 (n=1) · reproduce 1/0/0 · refute 1/0/0 · ground 1/0/0
- 2026-10-28-review-continuity-followups-roast-pr-5.md: mode: pr iteration: 5 of 5 · independence: same-family (Claude) — seat-differentiated panel · rung: Workflow · seat-agreement: panels 1 · rr 1.00 · rg 0.00 · fg 0.00 · unanimous 0.00 · ground-loo 0.00 (n=1) · reproduce 0/1/0 · refute 0/1/0 · ground 1/0/0
### Fix loop
Metrics: completions — review clean 23 · after fix pass 2 · parked 0 · re-entry closes 0 · dispatched early 6 · cancelled 0
Metrics: fix-pass — entered 2 · FIXED 2 · BLOCKED 0 (legacy event lines); durable attempts 4 · historical FIXED 4; repaired findings unavailable (use scope-dispositions --project)
### Merge-back
Metrics: merges 25 · merge-failed 0 · rebase-conflicts 1 · seam-reviews 8 (fixed 2) · check-fails 0 (fixed 0)
Metrics: ledger-check ok · append-failed 0 · append-retried 0 · scope: observed ledger; completed after available tracker reconciliation · git-only [super-plan-998.1, super-plan-998.10, super-plan-998.2, super-plan-998.3, super-plan-998.4, super-plan-998.5, super-plan-998.6, super-plan-998.8, super-plan-998.9, super-plan-goq.1, super-plan-goq.10, super-plan-goq.11, super-plan-goq.12, super-plan-goq.13, super-plan-goq.14, super-plan-goq.15, super-plan-goq.16, super-plan-goq.17, super-plan-goq.18, super-plan-goq.19, super-plan-goq.2, super-plan-goq.20, super-plan-goq.3, super-plan-goq.34, super-…
- Merge: lines 25; seam-review fired and fixed/cleared 8; all rebases clean except where noted in the merges line.
- Landed task IDs (ledger and Git agree for the epic): super-plan-1s3, 2s3, rsc, tco, row, v94, zhk, mlr.1, mlr.3–6, mlr.15–24, mlr.26–28. Git-only IDs are other epics' (see defect 4); ledger-only: none.
### Coverage
- coverage-round-1 · canonical R-list: docs/superpowers/runs/2026-10-28-review-continuity-followups/coverage-round-1-requirements.md (R1–R11) · requirements: 11 · mapped: 10 · unmapped: 1 (R11) · auto flag-sweep 2s3/row/v94 → kept as leaves (cl-1..3); auto GAP R11 → rejected, already in v94/zhk acceptance (cl-4); auto GAP R10 → zhk retitled (cl-5); auto GAP tests-registered → sweep super-plan-mlr.
- coverage-round-2 · requirements: 13 · mapped: 13 · unmapped: 0 · divergence: findings 9 → 12, novel 9/12 (75%), widening: yes (cap stays 2; design roast reviews the settled tree) · auto GAP R3 → mlr.1 owns strictDraft (cl-13); auto GAP R13 → mlr.2 super-roast dryRun guard (cl-14); auto GAP R1 → rejected (cl-15); auto GAP repaired roast e2e → sweep (cl-16); auto GAP collection isolation → rejecte
- coverage-amend-code-1 · auto UNOWNED-SEAM repair-check ownership → mlr.21 owns rule (iv) + --classify, replaces mlr.16 logic, keeps fixtures; auto UNOWNED-SEAM --classify vs --complete parser → mlr.21 consumes mlr.1 parser, byte-identical --complete on existing fixtures; auto GAP strictDraft parity → mlr.21 fixture through both copies, rule (iv) report-verdict-only; auto GAP mlr.22 files → named
- coverage-amend-code-2 · auto GAP (iii) count source → applied, mlr.28 consumes (ii) byte-identical header, drop-and-decrement fixture; auto GAP (iv) fold/content → rejected, rationale on mlr.28 (byte-identity + (iii) count; §4.1(a) residual); auto GAP fixture continuity → applied, mlr.28 acceptance; auto UNOWNED-SEAM (iii)/(iv) ownership → applied, mlr.28 owns (supersedes mlr.23 (iii), mlr.27 (i
scope-filter: 9 in-scope · 3 punch-listed
scope-filter: 2 in-scope · 0 punch-listed
### Timing
Profile: bound — graph lower bound 2h06m along super-plan-mlr.6 → super-plan-mlr.3 → super-plan-mlr.4 (unlimited slots and merge lanes) · model of the run 2h06m (cap ∞, one merge lane) vs actual 2h08m (99%) → graph-bound: the 3-bead dependency chain set the pace — reshaping it is the lever
Profile: critical path — 2h08m = implement 42m · review 1m · merge 5m · seam 3m · planning 17m · ready 21s · startup 2m · dispatch 2m · relaunch 56m · of which other beads' merge-lane turns 5m
Profile: bottleneck — super-plan-mlr.4 — 19m on the critical path (15%) · implement 17m · review 41s · merge 42s · dispatch 8s · implement on the path 17m: test 1m · poll 12m · git 5s · read 6s · shell 20s · model 4m (longest: "for i in $(seq 50)" 2m, "for i in $(seq 17)" 2m) · dependents 0
Profile: waits — ready→start, summed per bead (beads wait at the same time, so not wall time): 4m over 1 of 12 landed beads — stack-conflict 4m (1)
Profile: merge lane — busy 14m of 50m (29%) · seam reviews and fixes 4m (27% of busy) · 16 merge dispatches, first try not merged for 4 of 12 · queue wait 6m total, peak 2 waiting · stack-parent wait 2m
Profile: what-if estimate — cut super-plan-mlr.4 <- super-plan-mlr.3 → 1h52m (−15m, 12%) — payoff if this edge were cut — whether it can be is a design call; first dispatch to last landing, planning retained
Profile: what-if estimate — split super-plan-mlr.3 → 1h57m (−9m, 7%) — its 1 dependent(s) wait only for a contract slice ≈30% of its implement time; first dispatch to last landing, planning retained
Profile: what-if estimate — faster super-plan-mlr.4 → 1h58m (−9m, 7%) — its implement time halved; first dispatch to last landing, planning retained
Profile: what-if estimate — cut super-plan-mlr.3 <- super-plan-mlr.6 → 1h59m (−8m, 6%) — payoff if this edge were cut — whether it can be is a design call; first dispatch to last landing, planning retained
Profile: what-if estimate — faster super-plan-mlr.3 → 2h00m (−6m, 5%) — its implement time halved; first dispatch to last landing, planning retained
Profile: what-if estimate — split super-plan-mlr.6 → 2h00m (−6m, 5%) — its 2 dependent(s) wait only for a contract slice ≈30% of its implement time; first dispatch to last landing, planning retained
Profile: context — agents 122 (measured 118) · peak≥80% 0 · compacted 0 agents, 0 compactions · coordinator 435K/1000K (44%), 0 compactions · max coordinator 44%
Profile: bound — graph lower bound 20m (unlimited slots and merge lanes) · model of the run 21m (cap ∞, one merge lane) vs actual 21m (97%) → bead-bound: super-plan-mlr.15 alone set the pace — split it or make it faster
Profile: critical path — 21m = implement 5m · review 30s · merge 3m · seam 1m · planning 10m · ready 8s · startup 2m · dispatch 44s · of which other beads' merge-lane turns 3m
Profile: bottleneck — super-plan-mlr.17 — 6m on the critical path (28%) · implement 5m · review 30s · merge 54s · dispatch 10s · implement on the path 5m: test 2m · read 1s · shell 8s · model 2m (longest: "node tests/super-code/replay-harness.mjs > $TMPDIR/replay.l…" 46s, "python3 - <<'EOF'" 44s) · dependents 0
Profile: waits — ready→start, summed per bead (beads wait at the same time, so not wall time): 0s over 0 of 6 landed beads
Profile: merge lane — busy 6m of 8m (76%) · seam reviews and fixes 1m (16% of busy) · 7 merge dispatches, first try not merged for 1 of 6 · queue wait 5m total, peak 2 waiting · stack-parent wait 0s
Profile: what-if estimate — faster super-plan-mlr.15 → 19m (−1m, 7%) — its implement time halved; first dispatch to last landing, planning retained
Profile: what-if estimate — unlimited merge lanes → 20m (−1m, 6%) — merges in parallel, each still after its stack parents; first dispatch to last landing, planning retained
Profile: what-if estimate — faster super-plan-mlr.20 → 20m (−1m, 5%) — its implement time halved; first dispatch to last landing, planning retained
Profile: context — agents 48 (measured 48) · peak≥80% 0 · compacted 0 agents, 0 compactions · coordinator 501K/1000K (50%), 0 compactions · max coordinator 50%
Profile: context agent — coordinator peak 501K/1000K (50%) · first 64K · compactions 0
Profile: bound — graph lower bound 2h49m along super-plan-mlr.21 → super-plan-mlr.23 (unlimited slots and merge lanes) · model of the run 2h49m (cap ∞, one merge lane) vs actual 2h49m (100%) → planning-bound: planning dominates the measured task window; task parallelism retains this planning time
Profile: critical path — 2h49m = implement 11m · review 46s · fix 4m · merge 1m · seam 5m · planning 2h25m · ready 7s · startup 2m · dispatch 27s
Profile: bottleneck — super-plan-mlr.21 — 16m on the critical path (9%) · implement 11m · review 46s · fix 4m · merge 31s · dispatch 9s · implement on the path 11m: test 5m · poll 4m · edit 1s · shell 14s · model 2m (longest: "W=$PWD" 2m, "for i in $(seq 18)" 2m) · dependents 1 direct, 1 transitive
Profile: waits — ready→start, summed per bead (beads wait at the same time, so not wall time): 0s over 0 of 4 landed beads
Profile: merge lane — busy 11m of 19m (57%) · seam reviews and fixes 7m (62% of busy) · 6 merge dispatches, first try not merged for 2 of 4 · queue wait 1m total, peak 1 waiting · stack-parent wait 9s
Profile: what-if estimate — cut super-plan-mlr.23 <- super-plan-mlr.21 → 2h43m (−6m, 3%) — payoff if this edge were cut — whether it can be is a design call; first dispatch to last landing, planning retained
Profile: what-if estimate — split super-plan-mlr.21 → 2h43m (−6m, 3%) — its 1 dependent(s) wait only for a contract slice ≈30% of its implement time; first dispatch to last landing, planning retained
Profile: what-if estimate — faster super-plan-mlr.21 → 2h43m (−6m, 3%) — its implement time halved; first dispatch to last landing, planning retained
Profile: context — agents 48 (measured 48) · peak≥80% 0 · compacted 1 agents, 1 compactions (idle 1) · coordinator 592K/1000K (59%), 1 compactions · max coordinator 59%
Profile: context agent — coordinator peak 592K/1000K (59%) · first 64K · compactions 1 (idle 1)
Profile: bound — graph lower bound 14m (unlimited slots and merge lanes) · model of the run 14m (cap ∞, one merge lane) vs actual 14m (98%) → bead-bound: super-plan-mlr.27 alone set the pace — split it or make it faster
Profile: critical path — 14m = implement 3m · review 23s · merge 1m · seam 46s · planning 6m · ready 6s · startup 3m · dispatch 23s · of which other beads' merge-lane turns 27s
Profile: bottleneck — super-plan-mlr.26 — 4m on the critical path (25%) · implement 3m · review 23s · merge 27s · dispatch 6s · implement on the path 3m: test 2m · git 2s · shell 10s · model 51s (longest: "python3 - <<'EOF'" 56s, "python3 - <<'EOF'" 20s) · dependents 0
Profile: waits — ready→start, summed per bead (beads wait at the same time, so not wall time): 0s over 0 of 2 landed beads
Profile: merge lane — busy 2m of 2m (89%) · seam reviews and fixes 46s (39% of busy) · 3 merge dispatches, first try not merged for 1 of 2 · queue wait 36s total, peak 1 waiting · stack-parent wait 0s
Profile: what-if estimate — faster super-plan-mlr.27 → 13m (−1m, 10%) — its implement time halved; first dispatch to last landing, planning retained
Profile: context — agents 28 (measured 28) · peak≥80% 0 · compacted 1 agents, 1 compactions (idle 1) · coordinator 592K/1000K (59%), 1 compactions · max coordinator 59%
Profile: context agent — coordinator peak 592K/1000K (59%) · first 64K · compactions 1 (idle 1)

### Bead graph
| id | type | title | what (first sentence of description) |
| --- | --- | --- | --- |
| super-plan-mlr.2 | bug | super-roast report body rule and format repair | Split from super-plan-2s3 (spec docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-design.md §4.1 b, c — super- |
| super-plan-mlr.1 | bug | Report extractor: reject sub-headings inside recognized sections | Split from super-plan-2s3 (spec docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-design.md §4.1 d): a sub-hea |
| super-plan-2s3 | bug | Validate generated review report format before collection | D1/D2: malformed final/cluster review headings or prose in roast sections make complete extraction fail and degrade subsequent source collection. |
| super-plan-mlr.28 | task | --repair-check (iii) anchored to the verdict header count; drop the (iv) fold rejection | Implements amended spec §4.1(c) in the two --repair-check node blocks of skills/super-code/scripts/report-verdict (dissolved keys r4 [Should-fix] report-verdict |
| super-plan-mlr.27 | bug | Fix: --repair-check rule (iv) rejects an unmarked line that becomes a continuation | Covers: [Nit] skills/super-code/scripts/report-verdict:290 |
| super-plan-mlr.26 | bug | Fix: --repair-check rule (iii) rejects non-roast repairs as design §4.1(c) states | Covers: [Nit] skills/super-code/scripts/report-verdict:253 |
| super-plan-mlr.25 | task | review: super-plan-mlr.21 | Review, fix and merge of super-plan-mlr.21, tracked separately so super-plan-mlr.21's dependents can start once it is implemented. |
| super-plan-mlr.24 | task | Drift check: a landed stack parent is not drift | Owns the stale-`stack:` trigger of the workspaceSetup drift fragment in skills/super-code/coordinator.js (`driftCheck`, the `for x in $(git log --first-parent - |
| super-plan-mlr.23 | task | repair-check (iii): every Confirmed finding keyed | Owns check (iii) of `report-verdict --repair-check` per amended spec §4.1(c): replace the `--keys` equality (and exit-code comparison) with "the repair's `--key |
| super-plan-mlr.22 | task | Pin git identity, signing and hooks in the new test fixtures | Owns the git invocation helpers of the three new test files: every git call and the emitted drift-check script run carry GIT_AUTHOR_NAME/EMAIL and GIT_COMMITTER |
| super-plan-mlr.21 | task | report-verdict --repair-check rule (iv) from the --complete parse | Owns the --repair-check rule (iv) decision in skills/super-code/scripts/report-verdict per amended spec §4.1(c): add the internal `--classify FILE` mode that ru |
| super-plan-mlr.20 | bug | Fix: scope-dispositions key normalization for the missing-route gap | Covers: [Nit] skills/super-auto/scripts/scope-dispositions:185 |
| super-plan-mlr.19 | bug | Fix: review-continuity e2e S2/S5 assertions must fail when projection never ran | Covers: [Should-fix] tests/super-auto/review-continuity-e2e.sh:113 |
| super-plan-mlr.18 | bug | Fix: provenance digest must not inline the full outOfRange list | Covers: [Should-fix] skills/super-code/scripts/dispatch-text.mjs:422 |
| super-plan-mlr.16 | bug | Fix: --repair-check rule (iv) prefix escape | Covers: [Should-fix] skills/super-code/scripts/report-verdict:229; [Should-fix] skills/super-code/scripts/report-verdict:223; skills/super-code/scripts/report-v |
| super-plan-mlr.17 | bug | Fix: drift-check script treats every git step as fallible | Covers: [Nit] skills/super-code/coordinator.js:2654; skills/super-code/coordinator.js:2652; [Nit] skills/super-code/coordinator.js:2646; [Nit] skills/super-code |
| super-plan-mlr.15 | bug | Fix: unclosed fence must fail loudly in both report grammar copies | Covers: [Should-fix] skills/super-code/scripts/report-verdict:140; [Must-fix] final review: unclosed fence (inv-20261028T162628/final Must fix before landing #1 |
| super-plan-mlr.14 | task | review: super-plan-mlr.3 | Review, fix and merge of super-plan-mlr.3, tracked separately so super-plan-mlr.3's dependents can start once it is implemented. |
| super-plan-mlr.13 | task | review: super-plan-tco | Review, fix and merge of super-plan-tco, tracked separately so super-plan-tco's dependents can start once it is implemented. |
| super-plan-mlr.12 | task | review: super-plan-mlr.6 | Review, fix and merge of super-plan-mlr.6, tracked separately so super-plan-mlr.6's dependents can start once it is implemented. |
| super-plan-mlr.11 | task | review: super-plan-mlr.5 | Review, fix and merge of super-plan-mlr.5, tracked separately so super-plan-mlr.5's dependents can start once it is implemented. |
| super-plan-mlr.10 | task | review: super-plan-2s3 | Review, fix and merge of super-plan-2s3, tracked separately so super-plan-2s3's dependents can start once it is implemented. |
| super-plan-mlr.9 | task | review: super-plan-row | Review, fix and merge of super-plan-row, tracked separately so super-plan-row's dependents can start once it is implemented. |
| super-plan-mlr.8 | task | review: super-plan-rsc | Review, fix and merge of super-plan-rsc, tracked separately so super-plan-rsc's dependents can start once it is implemented. |
| super-plan-mlr.7 | task | review: super-plan-mlr.1 | Review, fix and merge of super-plan-mlr.1, tracked separately so super-plan-mlr.1's dependents can start once it is implemented. |
| super-plan-mlr.6 | task | super-roast report body rule, format-repair write step and caller report-path sentences | Split from super-plan-mlr.2: Two independent groups: a new report-verdict --repair-check mode with four mechanical checks and about 14 accept/reject fixtures (s |
| super-plan-mlr.5 | task | report-verdict --repair-check mode and its fixtures | Split from super-plan-mlr.2: Two independent groups: a new report-verdict --repair-check mode with four mechanical checks and about 14 accept/reject fixtures (s |
| super-plan-mlr.4 | task | Integration sweep: review continuity followups | Root integration sweep for run super-plan-mlr (spec docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-design.m |
| super-plan-mlr.3 | bug | super-auto caller finding-route and pending-human records | Split from super-plan-row (spec docs/superpowers/runs/2026-10-28-review-continuity-followups/2026-10-28-review-continuity-followups-design.md §4.4 — caller side |
| super-plan-mlr | epic | Review continuity followups (mosh triage P1/P2) | Root epic for super-auto run docs/superpowers/runs/2026-10-28-review-continuity-followups/ (branch super-auto/review-continuity-followups). |
| super-plan-zhk | task | Carry project commit policy to the implementer commit step and task-review severity | Source: Herdr mosh Phase2 report mnSGIFED8uqR, alepar/herdr@a900f96707d42ba28fdec87a1fc03afbb12a7b31. |
| super-plan-row | bug | Persist caller finding continuity and pending human escalation identity | Source: Herdr mosh Phase2 report mnSGIFED8uqR, alepar/herdr@a900f96707d42ba28fdec87a1fc03afbb12a7b31. |
| super-plan-v94 | bug | Revalidate reused stacked task branches against current prerequisites | Source: Herdr mosh Phase2 report mnSGIFED8uqR, alepar/herdr@a900f96707d42ba28fdec87a1fc03afbb12a7b31. |
| super-plan-rsc | bug | Scope review provenance checks to the captured review range | Source: Herdr mosh Phase2 report mnSGIFED8uqR, alepar/herdr@a900f96707d42ba28fdec87a1fc03afbb12a7b31. |
| super-plan-tco | bug | Carry review readiness in canonical super-auto/design roast invocations | G3: super-roast requires explicit reviewReadiness with source basis; canonical super-auto/super-design text never names reviewReadiness/--review-readiness. |
| super-plan-1s3 | bug | Reconcile context-preflight and profiler model-window resolution | D5 reproduced on6.6: CLAUDE_CODE_SUBAGENT_MODEL=claude-opus-5-5 yields200000 from context-preflight but1000000 from context-pass.claudeWindow. |

| dependent | blocker | reason (from `blocked-by` line, or `unstated`) |
| --- | --- | --- |
| super-plan-mlr.2 | super-plan-mlr.1 | mlr.2's format-repair trigger is --complete exit 4 and its test asserts the retained Unverified-nits shape fails with ex |
| super-plan-2s3 | super-plan-mlr.1 | 2s3 acceptance needs its retained failing fixtures to exit 4 and its reviewer self-check to repair only on exit 4; mlr.1 |
| super-plan-mlr.25 | super-plan-mlr.21 | unstated |
| super-plan-mlr.23 | super-plan-mlr.21 | consumes --repair-check rule (iv) from the --complete parse (same mode, file and test block) |
| super-plan-mlr.14 | super-plan-mlr.3 | unstated |
| super-plan-mlr.13 | super-plan-tco | unstated |
| super-plan-mlr.12 | super-plan-mlr.6 | unstated |
| super-plan-mlr.11 | super-plan-mlr.5 | unstated |
| super-plan-mlr.10 | super-plan-2s3 | unstated |
| super-plan-mlr.9 | super-plan-row | unstated |
| super-plan-mlr.8 | super-plan-rsc | unstated |
| super-plan-mlr.7 | super-plan-mlr.1 | unstated |
| super-plan-mlr.6 | super-plan-mlr.1 | Split from super-plan-mlr.2, which was blocked by super-plan-mlr.1; the split dropped the edge. The format-repair trigge |
| super-plan-mlr.5 | super-plan-mlr.1 | Split from super-plan-mlr.2, which was blocked by super-plan-mlr.1; the split dropped the edge. --repair-check check (i) |
| super-plan-mlr.4 | super-plan-mlr.5 | consumes split of super-plan-mlr.2 |
| super-plan-mlr.4 | super-plan-2s3 | consumes all leaves (integration sweep) |
| super-plan-mlr.4 | super-plan-rsc | consumes all leaves (integration sweep) |
| super-plan-mlr.4 | super-plan-zhk | consumes all leaves (integration sweep) |
| super-plan-mlr.4 | super-plan-row | consumes all leaves (integration sweep) |
| super-plan-mlr.4 | super-plan-mlr.2 | consumes all leaves (integration sweep) |
| super-plan-mlr.4 | super-plan-tco | consumes all leaves (integration sweep) |
| super-plan-mlr.4 | super-plan-mlr.6 | consumes split of super-plan-mlr.2 |
| super-plan-mlr.4 | super-plan-mlr.3 | consumes all leaves (integration sweep) |
| super-plan-mlr.4 | super-plan-1s3 | consumes all leaves (integration sweep) |
| super-plan-mlr.4 | super-plan-mlr.1 | consumes all leaves (integration sweep) |
| super-plan-mlr.4 | super-plan-v94 | consumes all leaves (integration sweep) |
| super-plan-mlr.3 | super-plan-row | consumes scope-dispositions bookkeeping gap kinds and message text |
| super-plan-mlr.3 | super-plan-mlr.6 | mlr.3's Step 2 runs report-verdict --complete --source roast-code/round-N on the round's report path (accepted ...-forma |
| super-plan-tco | super-plan-rsc | consumes review-inputs.json outOfRange field |

## Design questions
### Implementers poll background test runs instead of running short tests in the foreground
Evidence: invocation 1 profile: implementers spent 27m running tests and 32m polling background runs (62% of 1h35m); the bottleneck bead had poll 12m vs test 1m; test-report-verdict.sh ran 9 and then 16 times per invocation (longest 2m). For foreground: a test that finishes inside the tool timeout costs no polling turns and returns its result in one call. For background: long suites exceed the timeout and parallel model work continues meanwhile. Premise: the polling comes from implementer-prompt/harness guidance the skills control, not harness-only behaviour.
If upstream decides otherwise, please state the position explicitly so downstream can reconcile against words rather than silence.

## Doc gaps
none

## Already fixed — do not re-litigate
- Review-input provenance validated every run.md in the repo, so 2115 historical gaps from an unrelated earlier run made every code roast and final review in this run bounded / `[low coverage] [review readiness incomplete]` — fixed on this run's branch by super-plan-rsc (scope provenance to the captured range); the run ran on the installed 6.6 skills, so it could not benefit.
- context-preflight reported 200K windows for models the profiler measured at 1000K — fixed on this run's branch by super-plan-1s3.

## Not established
- By default: the coordinator's ledger-append path is fire-and-forget and can lose a line without the coordinator noticing, so every ledger-derived count in `## Run metrics` (Fix loop, Merge-back) is a lower bound. The `Metrics: ledger-check` line is the one cross-check that exists.
- The rsc/1s3 fixes are claimed by this branch's tests only; no fresh run on the released version has confirmed them.
- Residual-graph planning time (invocation 3: planning 2h25m, 86% of first dispatch to last landing, 4 beads dispatched of 23 planned) may include amend/design time outside planner work; not attributed, so not filed.
- Single run; no cross-run comparison of the polling cost.
- Analyst model: opus.

## Verification bar
- Defect 1: run super-auto's documented Step 2 → phase 4 handoff on a run whose final review has untested items; `assemble-args --punch-listed <scope-dispositions --keys output>` exits 0.
- Defect 2: a fixture with a round-2 roast whose prior-report tracking lists a round-1 key resolved; the rebuilt ledger shows it `resolved`, and `amend-check --loop code` does not demand a work line for it.
- Defect 3: the filing sequence with a `work:` title starting `--` files the bead.
- Defect 4: ledger-check in a repo holding another epic's merged `task-*` branches reports no identity gap for a clean run.

---
If a premise above is wrong, stop and say so rather than improvising a larger change.
