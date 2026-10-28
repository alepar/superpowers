# Final review — epic super-plan-z1k (bounded)

Branch: super-auto/autonomous-default-both-roasts · base 444f86b266b2208b612e0e91b0f54762576ff95a · head b4c1fb9e1e060fdcd549bec575393bb14a87595b (both verified with `git rev-parse --verify <sha>^{commit}`).

Route: bounded captured-source review. The review-inputs sidecar reports status:unavailable, sourceAvailable:true, wholeRangeReady:false, zero omissions and 2115 provenance gaps. Every gap concerns captured files of an archived earlier invocation (inv-mvc60k41-xt8p35rk04d under docs/superpowers/runs/2026-10-16-workflow-reliability/...), not a path this range changes. The changed-path inventory is 20 files, 281 insertions, 16 deletions; every path and every hunk was read from captured Git (`git diff base..head`, `git show head:<path>`), so the source of the range itself was reviewed whole even though the package provenance was not.

Caller checkout observed at head b4c1fb9e, `git status` clean apart from the git-ignored run `evals/` directory and the `.superpowers/sdd` bundle.

## Step 1 — own view against the spec

Spec: docs/superpowers/runs/2026-10-28-autonomous-default-both-roasts/2026-10-28-super-auto-autonomous-default-design.md. Epic constraints: smallest change, no new flag/mode/field/script, only default-mode hunks in skills/super-auto, I5 unchanged.

Spec decisions and where they landed:

- §Inputs defaults and collection: SKILL.md §Inputs gains a Default column (`autonomous` `true`, others `false`), removes the batched launch question, and states that unstated flags take defaults without a question. Matches.
- §Inputs opt-outs: one sentence maps "interactive" / "not autonomous" / bare "ask me" to `autonomous=false`, keeps "ask me only about X" as a reserved topic with `autonomous=true`, maps "stop for design review" and bare `planOneShot` to `planOneShot=true, autonomous=false`, maps both skip phrases, and states the contradiction tie-break (explicit `autonomous` wins, named in the first status note). Matches the spec as amended after design roast r1.
- §Autonomous mode confirmation text: "Say this when confirming the flags" becomes "Say this in the status note that names the resolved flags (§Inputs)"; the "Neither flag" bullet stays. Matches.
- Resume: §Inputs and run-state.md item 1 both say a resume reads the recorded `flags:` line and never re-applies defaults; resume.md's `resumeChange` path is referenced. `flags:` line format at SKILL.md pre-flight step 4 is unchanged. Matches.
- Merge authority: the `autonomous` row adds "It never covers the merge into `base` (§Invariants I5 (human-owned merge))". I5 text unchanged. Matches.
- Entry points: frontmatter description ("unattended by default"), opening paragraph, README feature line, example 2 and skills table all updated. skills/using-superpowers/SKILL.md unchanged, as the spec says. MAINTENANCE.md bullet added; 2026-07-31 spec gets a dated Post-Implementation Note; INDEX.md gets a row. Matches.
- No new flag, mode, run.md field or script: confirmed; the only skill files touched are SKILL.md, run-state.md and MAINTENANCE.md under skills/super-auto.

Cross-section consistency sweep at head (grep for "batched", "defaults to `false`", "confirming the flags", "launch question", "optionally", "re-ask", "asked once", "already answered", "run it autonomously" across skills/, README.md): no remaining text instructs a batched flag question or describes autonomy as optional. Residual wording found:

- [Minor] skills/super-auto/SKILL.md:156 (skip plan roast row) still justifies pre-deciding the roast offer with "so the user, who already answered here, is never asked again". Under defaults the user usually answered nothing; behavior (pre-decided, never re-asked) is still correct, only the rationale is stale.
- [Minor] skills/super-auto/SKILL.md:586-587 (§Autonomous mode) still says fix designs are applied without asking because "the request to run autonomously is the approval". A default run carries no such request; the rule's behavior is intended by the spec, but its stated justification no longer holds for an unqualified invocation.
- [Minor] docs/superpowers/specs/INDEX.md: the new row's Status is `draft` while the implementation has landed on this branch; other implemented specs read `implemented`.

Integration seams: single-leaf epic (super-plan-z1k.1), so there is no cross-task composition inside this range. The one real seam is outside it: a parallel readiness/continuity branch owns other hunks in the same skills/super-auto files (epic constraint; coverage-ledger cov-5, cov-10). This review cannot see that branch.

Spec requirements no task covered: the spec's §Evaluation before/after probes are deliberately orchestrator-owned (epic description, cov-1) and held by root acceptance `before-after-evals` (source: user, requiredLive). At head:

- [Important] The behavioral evidence is not in the branch and is incomplete. docs/superpowers/runs/2026-10-28-autonomous-default-both-roasts/evals/ is git-ignored (.gitignore:13 `evals/`, the drill-harness checkout rule), so `git ls-files` shows no eval file in the range. On disk it holds only `probe.md` and `before-summary.md`; the before summary covers scenarios S1–S6 in three sessions, while the amended spec defines ten probes (adds "autonomous, stop for design review", bare "one-shot", "ask me only about X", "skip the design roast" parity) and requires both before and after at two or more fresh sessions each. No "after" results exist. CLAUDE.md "Skill Changes Require Evaluation" and the root-acceptance entry both require this evidence before the change lands.

Mechanical checks I ran (review-owned detached worktree at b4c1fb9e, under the session scratchpad): `bash tests/super-auto/test-contract-lint.sh` → "All super-auto contract lint tests passed"; `bash tests/super-auto/test-scripts.sh` → exit 0, "All super-auto script tests passed". These are the root-acceptance `final-suite` command's two parts; the full fork test list in CLAUDE.md was not run, and the caller's deferred full-suite sweep has not run, so the branch is not treated as fully tested.

## Step 2 — ledger triage

Ledger: .superpowers/sdd/super-plan-z1k-plan/progress.md. One task, merged clean, review clean; no parked completions, no parked findings, no BLOCKED-AUTH lines, no Recurring minor/blocker clusters.

- minor (deferred), super-plan-z1k.1 [missing-evidence]: task report states test-scripts.sh and test-contract-lint.sh results without verbatim commands or output, and the test-scripts.sh pass predates the edits. Triage: it names unverified test evidence, so it was treated as must-verify rather than cosmetic; verified here by running both suites at head (both pass). Resolved for those two suites; Deferred OK.
- Metrics: ledger-check ok; the `git-only` identity list (super-plan-998.*, -goq.*, -ufz.*) names beads of earlier epics whose commits sit in base history, and "gaps: ledger/Git identities differ" is recorded as a provenance gap, not read as clean.
- Design-phase parked items in run.md (coverage round 2 widening, design roast r1 `[low coverage] [review readiness incomplete]` qualifier from an empty readiness basis): both are degraded-verdict qualifiers with complete stage coverage; Deferred OK.
- Design roast r1 rejected FYI with a ground-seat Should-fix dissent: the skill is model-selectable (no `disable-model-invocation`), so an agent-chosen invocation now starts an hours-long unattended run. The majority rejected it as pre-existing and within the literal request; I5 bounds it. Not a landing blocker; a decision for the human as a follow-up.

## Verdict
not ready (before/after behavioral evals outstanding and not tracked in Git; bounded review; full suite not yet measured)

## Must fix before landing
- Run and record the spec §Evaluation before/after behavioral probes for all ten scenarios (two or more fresh sessions per version), and store the evidence where Git tracks it: run-dir evals/ is ignored by .gitignore:13, only before results for S1–S6 exist, and root acceptance `before-after-evals` (source: user) is open.

## Untested scope
- Caller-deferred full-suite sweep: no full-suite measurement of b4c1fb9e exists; only tests/super-auto/test-contract-lint.sh and tests/super-auto/test-scripts.sh were run by this review (both pass).
- Review-package provenance: review-inputs.json status unavailable with 2115 gaps, all missing captured files of archived invocation inv-mvc60k41-xt8p35rk04d under docs/superpowers/runs/2026-10-16-workflow-reliability; no whole-range package was built or reviewed.
- Ledger/Git identity gap: Metrics `git-only` lists beads of earlier epics (super-plan-998.*, super-plan-goq.*, super-plan-ufz.*); not reconciled here.
- Integration with the parallel readiness/continuity branch that edits the same skills/super-auto files: not visible to this review; the epic's hand-back item (re-run super-plan-z1k.1's sweep grep on the integrated result) is still owed by the main coordinator.
- docs/superpowers/runs/2026-10-28-autonomous-default-both-roasts/findings-overrides-design.md is added empty (no hunks), so there was nothing to inspect.
- Behavioral effect of the new defaults on a live run (actual absence of a launch question, top-split auto-apply under default autonomy): covered only by the outstanding probes, not by any test.

## Deferred OK
- skills/super-auto/SKILL.md:156 skip-plan-roast row keeps the stale rationale "the user, who already answered here"; behavior unchanged.
- skills/super-auto/SKILL.md:586-587 "the request to run autonomously is the approval" no longer describes a default run; behavior intended by the spec, wording only.
- docs/superpowers/specs/INDEX.md new row status is `draft` though implemented on this branch.
- Ledger minor [missing-evidence] for super-plan-z1k.1 test results: both named suites re-run at head by this review and pass.
- run.md parked degraded verdicts (coverage round 2 widening; design roast r1 `[low coverage] [review readiness incomplete]` from an empty readiness basis with full stage coverage).
- Design roast r1 rejected FYI with Should-fix dissent on model-initiated entry (no `disable-model-invocation`): follow-up decision for the human, not a regression introduced here.
