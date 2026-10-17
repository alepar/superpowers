status: clean [degraded: final review: not ready (cluster must-fixes in 6, 7, 8, 9, 13 and 15 remain open; the amend-checked resume abort and the unparked resumed abort affect both loops; the code loop's amend roast has no field owner or pointer), sweep: 3311a446 — 27 passed, 1 failed, 0 errors, 0 skipped; failing: tests/codex/test-package-codex-plugin.sh (environmental: scripts/package refuses a worktree checkout; passes on the primary main checkout; branch touches no packaging files); command: CLAUDE.md release test list (28 commands) @ 3311a446]
metrics: pending (upstream-feedback not yet run)

# super-auto report — roast findings redesign loop (epic super-plan-59b)

Lead: every bead landed and the sweep passes except one environmental test, but the final seam review says **not ready**: 10 must-fix items remain open (Remaining, tagged `final review`), and the post-cap audit left 1 Should-fix, 1 FYI and 1 Nit unfixed. Do not merge until those are triaged. Branch `super-auto/roast-findings-redesign-loop` vs `main`; final review: `final-review-last.md`; post-cap audit: `2026-10-17-roast-findings-redesign-loop-roast-pr-post-cap-audit.md`.

## Implemented

Spec tasks (phase 4 plan, first super-code invocation):
- super-plan-59b.1 findings-ledger script and tests — commits 5c21263..2952b0f, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.2 move step-back-check to super-design and enforce ledger triggers — c6cb5ee..1f1f252, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.3 amend-check script and tests — 8739879..9134d0f, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.4 step-back prompt: local|redesign with triggers and the ledger — 4c1365d..db11cad, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.5 amend designer prompt template — 61b3207..a886458, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.6 super-design SKILL.md §Amend Mode — db11cad..a6c67a7, after one fix pass 8d9790b..b44cfba (bd; codeBuckets.completed; ledger)
- super-plan-59b.7 super-auto SKILL.md: phase-5 local/redesign rounds and the redesign cycle — 37b6ad2..37382f9, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.8 run-state fields, resume replay and contract-lint baseline — a6c67a7..433c741, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.9 report prompt: redesign cycles, disputes and the ledger — a886458..4c1365d, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.10 super-design SKILL.md: design loop's local/redesign rounds — 433c741..37b6ad2, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.11 Integration sweep — 50e937c..3395206, review clean (bd; codeBuckets.completed; ledger)

Code-roast round-1 fix loop (cluster beads c1–c8 plus one scriptable-subset bead):
- super-plan-59b.19 c1-dissolve-effect — 402ee47..8c2f66e, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.20 c2-redesign-filing-lifecycle — f8a783e..856ba8d, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.21 c3-resume-redesign-replay — 86a4d99..7e1742e, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.22 c4-step-back-check-trigger-parse — 856ba8d..402ee47, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.23 c5-ledger-input-presence — 7e1742e..0313102, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.24 c6-chain-test-order — fca95a1..86a4d99, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.25 c7-contract-pinning — 04d13b8..f8a783e, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.26 c8-amend-check-content-guards — 0313102..04d13b8, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.27 script-test the scriptable subset of spec §7 prose-only behaviours — 8c2f66e..f767f2f, review clean (bd; codeBuckets.completed; ledger)

Regression pass round 2 and final-review exception (one re-entry before phase 6):
- super-plan-59b.31 resume abort paths keep dissolved overrides — 99e4bbc..5e7e3ba, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.32 findings-ledger tells a clean final review from no review — 61b1114..58ab98f, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.33 Amend Mode step 4 supersede ordering — 56d7728..01703fa, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.34 write the redesign step-back line only after the branch is chosen — 58ab98f..56d7728, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.35 the calling loop writes `applied` — 01703fa..a448999, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.36 punch list stays cumulative across a redesign round — b83a766..99e4bbc, review clean (bd; codeBuckets.completed; ledger)
- super-plan-59b.37 design-loop amend beads get the Integration sweep edge — a448999..b83a766, review clean (bd; codeBuckets.completed; ledger)

## Remaining

Final review (`final-review-last.md`, verdict `not ready`; `report-verdict --keys` exits 3 on this seam-review format, so items are read from its `## Must fix before landing` and `## Untested scope` sections):
- [final review] not ready (cluster must-fixes in 6, 7, 8, 9, 13 and 15 remain open; the amend-checked resume abort and the unparked resumed abort affect both loops; the code loop's amend roast has no field owner or pointer) — degraded qualifier (report-status; codeBuckets.review)
- [final review][Must-fix] both loops: the `amend-checked` resume replay re-runs amend-check against HEAD, which after a landed step-3 commit rejects on the empty diff and aborts a committed amendment with beads unfiled; use `--base <lastGood>` or detect the landed commit (final-review-last.md, clusters 8/13)
- [final review][Must-fix] both loops: the `amend-checked` exit-3 route and the `aborted — <reason>` replay must park `degraded-verdict` `redesign aborted — <reason>` idempotently so a resume-time abort reaches Remaining (final-review-last.md, clusters 8/13)
- [final review][Must-fix] run-state.md Field table and item 5 must name super-auto's phase-5 amend roast as a writer of `roastDesignRound`, `findingsLedgerDesign` and `roast-design:`; reword super-auto SKILL.md:224; give step 3 its `findingsLedgerDesign` rebuild invocation (final-review-last.md, clusters 9/6)
- [final review][Must-fix] run-state.md worked example: pointer lists disagree with `roastCodeRound: 3` / `roastDesignRound: 3`; cite the round-3 design report for the `amend roast finding not fixed` park; fix the lead-in (final-review-last.md, cluster 9)
- [final review][Must-fix] super-auto §Redesign cycle step 3 must write amend-roast build tasks to a durable `work:` file, pass it as `$AMEND` to Amend Mode step 4, and point resume's `r<M>` replay at it (final-review-last.md, clusters 6/8/13)
- [final review][Must-fix] disputed-Blocking rule is inconsistent: report-status does not count `disputed` Blocking rows as unresolved while vision §4 and Amend Mode step 5 say it should; pick one rule (a vision deviation needs your human partner's approval) and align fixtures (final-review-last.md, clusters 7/13/15/19/21)
- [final review][Must-fix] report-prompt.md must surface the `lastGood <sha>` of a `thrash — lastGood breach` redesign record (final-review-last.md, cluster 7)
- [final review][Must-fix] super-design §Amend Mode step 4 `id_of` must match JSON-decoded titles (or use `bd create --silent` ids) so supersede and sweep wiring never run with an empty id (final-review-last.md, cluster 13; same defect as the punch-listed SKILL.md:918 item and the audit FYI below)
- [final review][Must-fix] test-redesign-cycle-filing.sh stub `bd list` must emit escaped titles, with a `->`/`&` work-title case filed once, superseded, sweep-wired and deduped on replay (final-review-last.md, cluster 13)
- [final review][Must-fix] amend-check:198 must normalise `owners:`/`amended:` spec paths through `spec_index` before the design-loop reverse-rule lookup, plus a `--loop design` test with `./docs/spec.md` vs `docs/spec.md` (final-review-last.md, cluster 15)
- [final review][untested] no end-to-end redesign cycle test in either loop; every script stage is tested alone or in the chain test, which runs no orchestrator, bd or super-code (final-review-last.md)
- [final review][untested] both loops' resume state dispatch and crash windows are prose only; contract-lint pins wording, not behaviour (final-review-last.md)
- [final review][untested] cap and budget arithmetic is pinned only as spelling (final-review-last.md)
- [final review][untested] Step 1 second-reject paths, ledger exit-2 degrade, lastGood breach as an action and the interactive decline are prose only (final-review-last.md)
- [final review][untested] the code loop's amend design roast is prose only, checked by one pointer grep (final-review-last.md)
- [final review][untested] filing block runs only against a stub bd: real `--json` escaping, `PARENT != ROOT`, `JQ_UNAVAILABLE`, description content and malformed `supersedes:` are untested (final-review-last.md)
- [final review][untested] disputed-Blocking path to `roastCodeCapped:`/`roastDesignCapped:` and report-status is untested (final-review-last.md)
- [final review][untested] no fixture shows a drafted report listing `disputed` rows, the six park texts or redesign records (final-review-last.md)
- [final review][untested] run-state.md "Written by" column, counters and in-place rewrites have no check (final-review-last.md)
- [final review][untested] amend-prompt and revised step-back-prompt have no behaviour eval (final-review-last.md; spec §7 manual replay has since run, see Gotchas)
- [final review][untested] the run executed under plugin 6.4.2-alepar6.0, so no live redesign cycle, findings-ledger, Amend Mode or new step-back-check ran; script and contract-lint evidence only (final-review-last.md)
- [final review][untested] fixture/case gaps in findings-ledger (design-mode report, relocated regression), amend-check (`amended:` outside `--specs`, missing section, malformed `owners:`, non-HEAD `--base`) and step-back-check (invalid `decision:`, bad `scope:`, `defect-type`, spaced evidence, bad-input exits) (final-review-last.md)
- [final review][untested] no test renders a non-default `config.iterationCap` header; check_itercap's super-roast side has no mutation case (final-review-last.md)
- [final review][untested] report-verdict near-miss boundaries pinned only for `localized` (final-review-last.md)
- [final review][untested] test-redesign-chain.sh stale-path guard never scans AGENTS.md text (final-review-last.md)
- [final review][untested] docs/superpowers/specs/INDEX.md has no automated check (final-review-last.md)

Post-cap audit sub-Blocking findings (none fixed; `2026-10-17-roast-findings-redesign-loop-roast-pr-post-cap-audit.md`, verdict Should-fix (3 confirmed) [converged]):
- [Should-fix] skills/super-design/SKILL.md:950 — design-loop Integration-sweep wiring iterates one empty `work:` line when the amend record has none, runs `bd dep add "$sweep" ""` and exits 1 before `beads-filed`; the replay fails the same way and parks `redesign incomplete` (introduced by fix a8e484b0, super-plan-59b.37) (post-cap audit)
- [FYI, two seats rated Should-fix] skills/super-design/SKILL.md:953 — a8e484b0 added an unconditional consumer of the punch-listed `id_of` raw-title lookup, so any `work:` title with `<`, `>`, `&` or `"` now fails filing deterministically plus duplicates on replay [fix-regression] (post-cap audit)
- [Nit] skills/super-auto/SKILL.md:300 (and super-design SKILL.md ~778) — the remove-then-rewrite abort order claims a crash replays the abort, but the `started` replay re-dispatches the designer instead; revert to rewrite-then-remove or detect the partial abort (introduced by a6ecccb5, super-plan-59b.31) (post-cap audit)

Punch-listed, never filed as beads:
- [out of scope (filtered)] [Nit] skills/super-design/scripts/amend-check:244 — Goal-section protection is a hardening the goal does not name (run.md scopeFilter-round-1)
- [out of scope (filtered)] [Nit] skills/super-auto/resume.md:43 — transient git exit 2 on resume is outside the goal; costs at most one re-dispatch (run.md scopeFilter-round-1)
- [out of scope (filtered)] [Nit] skills/super-auto/resume.md:29 — legacy in-flight-run migration is not named by the goal (run.md scopeFilter-round-1)
- [out of scope (filtered)] [Nit] skills/super-auto/SKILL.md:171 — stale super-roast docs for the iterationCap knob; runtime correct, roast cap change is a non-goal (run.md scopeFilter-round-1)
- [out of scope (filtered)] [Nit] skills/super-design/scripts/findings-ledger:157 — cluster override: the panel-capped glob works today; only adds a fixture for a correct branch (run.md scopeFilter-round-1)
- [cluster dropped] c3-resume-redesign-replay — rule: resume handles a redesign round only through its `redesign-<loop>-<K>` record state, legacy lines replay as before, exit 2 retries without restore, only exit 3 restores, in both resume.md and super-design §Re-entry; in-scope members filed as super-plan-59b.21, punch-listed members resume.md:29/:43 left unfixed (run.md cluster dropped; roast-pr-1 step-back file)
- [cluster dropped] c7-contract-pinning — rule: every new record format, token or knob is pinned at its consumer's contract with an asserting fixture; in-scope members filed as super-plan-59b.25, SKILL.md:171 left unfixed (run.md cluster dropped)
- [cluster dropped] c8-amend-check-content-guards — rule: amend-check validates normalised, fence-aware content (Goal body, spec paths, duplicate `owners:`, untracked specs) with a test per input shape; in-scope members filed as super-plan-59b.26, amend-check:244 left unfixed (run.md cluster dropped)
- [punch list] [Should-fix] skills/super-design/SKILL.md:918; :897 — `id_of` title escaping, roast r2, not fix-regression; since re-surfaced worse by the audit FYI above (run.md punchList-exit; roast-pr-2-punch-list.txt)
- [punch list] final-review-fixloop-r1 cluster-2 unreviewed item (24 run-dir files over the review window) and its Untested scope list (run.md punchList-exit; final-review-fixloop-r1.md)
- [punch list] automated security review on amend-check: fail-open git lookup (failed `git cat-file` treated as a new spec, skipping the Goal diff) and non-CommonMark fence parsing letting a Goal edit hide in a fake fence; not roast-confirmed (run.md punchList-exit; friction.md)

Manual acceptance caveats (spec §7 replay, verdict partly; `manual-acceptance.md`):
- no mechanical trigger fires on the replayed run (no Blocking, relocated key), so a redesign would rest on the step-back citing shared cause; the historical step-back saw the same 5 clusters and chose patch (manual-acceptance.md)
- owners resolve only to heading sections (§A/§B), not the bold A1–B6 decision paragraphs (manual-acceptance.md)
- the replayer had read round 2, so some detail is hindsight (manual-acceptance.md)
- the amend design roast was not exercised (manual-acceptance.md)

Sweep:
- sweep: 3311a446 — 27 passed, 1 failed; failing tests/codex/test-package-codex-plugin.sh (environmental: scripts/package refuses a worktree checkout; passes on the primary main checkout; branch touches no packaging files) — degraded qualifier (report-status; codeBuckets.sweep; friction.md)

Empty buckets: escalated none, pendingRetry none, parked none, roastDesignCapped/roastCodeCapped none, parked graph changes none (graph-pass applied 0 parked 0), worktreesKept none, processSweep survivors none, resumeChange none, roastCodeExit converged (not operator-skipped) (run.md)

## Gotchas & surprises

- Design roast r1 came back Blocking (26 confirmed); the step-back chose patch (no recurrence history, rule-level clusters) and r2 converged at Should-fix (13 confirmed), applied as spec+bead fixes in cbf82090 with no re-roast (roast-design-1.md, its step-back file, roast-design-2.md, run.md design-roast exit)
- Coverage gate: R12–R14 unmapped in round 1; L7 deferred to the sweep, L2 and L27 rejected; round 2 created the sweep bead super-plan-59b.11 and left R13 unmapped (run.md approvals)
- Plan defect: super-plan-59b.6 PROMOTE was overruled to a split, labelled `sp:demoted-by-session` (run.md approvals; bd)
- Code roast r1 step-back: patch — 8 clusters (dissolve effect, filing lifecycle, resume replay, trigger parse, ledger input presence, chain test order, contract pinning, amend-check guards); no redesign proposed (run.md stepBackCode-round-1; roast-pr-1 step-back file)
- Phase-3 final review found that a code-loop redesign re-enters super-code against a closed root epic and runs no amend beads; fixed via c2 (super-plan-59b.20) (final-review-phase3.md)
- Spec §7 manual acceptance was routed out of the fix loop to phase 6 because it needs agent dispatches (run.md fixLoop-round-1)
- finalReviewException: 4 final-review Must-fix seams (super-plan-59b.34–.37) were filed and combined with the regression pass (.31–.33) in one re-entry, with a post-cap audit covering what landed; that audit then found two of those fixes introduced new defects (run.md finalReviewException; post-cap audit)
- Manual acceptance verdict: **partly** — the amendment named the decisions round 2 kept circling (Codex child identification, the agent-written file-format contract, split-before-dispatch for the regressed :704, the A4 constraint); caveats listed in Remaining (manual-acceptance.md)
- Stray roast repro files: a super-roast PR round-1 judge/scout reproduction wrote f1.txt, f2.txt and l.md into the integration worktree root instead of a temp dir; they would have blocked every later merge and were removed by hand before the fix-loop re-entry [skill-defect] (friction.md)
- Peer coordination: run super-plan-ufz (workflow-reliability) owns review-artifact preservation; expect overlap in skills/super-auto/resume.md and report-prompt.md at base-drift absorb (friction.md)
- Automated security review flagged amend-check fail-open and fence parsing outside the roast; carried to the punch list, not roast-confirmed (friction.md; run.md punchList-exit)
- test-package-codex-plugin.sh fails in any git worktree because the package script needs `.git` as a directory; no sweep-fix bead filed (friction.md; ledger Task 11 minor)
- Slowness: round 1 graph-bound (depth 3, achievable width 3 vs cap 8, edge audit no changes); merge queue peaked at 4 twice; exit re-entry: skills/super-design/SKILL.md held back two tasks (hot-file cap raised to 4) (run.md codeBuckets.slowness; ledger Edge audit)
- Profile, invocation 1 (wf_2f7123fb): bottleneck super-plan-59b.11, 18m of 42m critical path, 13m in shell; largest what-if (a model estimate): faster .11 → 34m (−8m, 20%) (ledger; profile-wf_2f7123fb-ebe.md)
- Profile, invocation 2 (wf_a94abf64): bottleneck super-plan-59b.19, 28m on path (58%), 15m polling background tests; largest what-if (a model estimate): faster .19 → 37m (−10m, 22%) (ledger; profile-wf_a94abf64-d7b.md)
- Profile, invocation 3 (wf_da377340): bottleneck super-plan-59b.32, 3m (15%); merge lane busy 87%, first try not merged for 6 of 7; largest what-if (a model estimate): unlimited merge lanes or seam work off the lane → 20m (−2m, 11%) (ledger; profile-wf_da377340-41e.md)

## Entrypoints

1. skills/super-design/scripts/findings-ledger — root module; the ledger every step-back and amend decision reads (super-plan-59b.1; diff)
2. skills/super-design/scripts/step-back-check — validates `local|redesign` records against ledger triggers; moved from super-auto/scripts (super-plan-59b.2; diff)
3. skills/super-design/scripts/amend-check — gate on the amend designer's output (super-plan-59b.3; diff)
4. skills/super-design/step-back-prompt.md and skills/super-design/amend-prompt.md — the agent contracts these scripts check (super-plan-59b.4, .5; diff)
5. skills/super-design/SKILL.md §Amend Mode and the design loop's local/redesign rounds — the shared redesign cycle, incl. step 4 filing (`id_of`, sweep wiring) where the open defects sit (super-plan-59b.6, .10; diff)
6. skills/super-auto/SKILL.md §Redesign cycle and Step 1 — primary caller in the code loop (super-plan-59b.7; diff)
7. skills/super-auto/run-state.md, resume.md, report-prompt.md — records, replay and reporting (super-plan-59b.8, .9; diff)
8. tests/super-design/test-findings-ledger.sh, test-step-back-check.sh, test-amend-check.sh, test-redesign-chain.sh, test-redesign-cycle-filing.sh; tests/super-auto/test-contract-lint.sh (diff)

## Smells

- super-plan-59b.6 (§Amend Mode) — the smell: its one review needed a fix pass (terminal `applied | aborted` states unnamed), merged without re-review (ledger Task 6 fix pass FIXED)
- regressionPass-round-2 fixes (super-plan-59b.31–.33: resume abort paths, clean-review resolution, supersede status check) — the smell: merged with no re-roast; only the post-cap audit saw them, and .31's reorder introduced the SKILL.md:300 Nit (run.md regressionPass-round-2; post-cap audit)
- finalReviewException fixes (super-plan-59b.34–.37) — the smell: merged with no re-roast; .37's sweep wiring (a8e484b0) introduced the SKILL.md:950 Should-fix and turned the `id_of` punch-list item into a deterministic failure (run.md finalReviewException; post-cap audit)
- final review: not ready (cluster must-fixes in 6, 7, 8, 9, 13 and 15 remain open; …) — the smell: the branch's own final reviewer did not clear it (report-status qualifier)
- sweep: 3311a446 — 27 passed, 1 failed (tests/codex/test-package-codex-plugin.sh, environmental) — the smell: the release test list is not fully green in the worktree (report-status qualifier)
- parked findings: none; degraded-verdict records: none; DONE_WITH_CONCERNS reports: none; sweepFix: none (run.md codeBuckets; implementer reports)
