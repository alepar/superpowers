super-roast verdict: Should-fix (1 confirmed) [converged]
mode: PR        iteration: post-cap audit
profile (assumed): The artifact is the alepar fork of the Superpowers plugin (Claude Code / Codex skills library, v6.4.2-alepar5.3), a public MIT repo maintained by one operator. The change under review is the fqb.11 fix to `contextBaseline` in `skills/super-code/scripts/context-pass.mjs`, part of `run-profile.mjs`, a short-lived Node CLI that runs at the end of a super-auto/super-code run and emits advisory `Profile:` / `Baseline:` lines to a ledger and committed run docs. No external users consume its output at runtime, no money or third-party data is at stake, and rollback is a git revert. Wrong numbers mislead the maintainer's own cross-run diagnostics; nothing crashes or loses data.
inputs: super-auto/run-profile-context-pass@fdbf97d vs 7a004a0 (tip the last code roast reviewed)
delta vs prior: 1 new confirmed (0 Blocking) · 0 carried (0 Blocking) · 0 resolved · 0 regressed (0 Blocking) · 2 punch-listed (open)
coverage: scouts 12/12 (correctness, security, premortem, simplicity-design, hot-path-perf, concurrency-async, regression, testing, dependency, hygiene-docs, observability, api-contract) · raw 5 → deduped 1 → panel 1 · spot 0 · promoted 0 · judge completion 100% · remainder-capped: 0
independence: same-family (Claude) — seat-differentiated panel · rung: Workflow
seat-agreement: panels 1 · rr 1.00 · rg 1.00 · fg 1.00 · unanimous 1.00 · ground-loo 1.00 (n=1) · reproduce 1/0/0 · refute 1/0/0 · ground 1/0/0
lane-yield (found/confirmed/unique/refuted): correctness 1/1/0/0 · security 0/0/0/0 · premortem 0/0/0/0 · simplicity-design 1/1/0/0 · hot-path-perf 0/0/0/0 · concurrency-async 0/0/0/0 · regression 1/1/0/0 · testing 1/1/0/0 · dependency 0/0/0/0 · hygiene-docs 0/0/0/0 · observability 0/0/0/0 · api-contract 1/1/0/0

## Confirmed findings
- [Should-fix] skills/super-code/scripts/context-pass.mjs:308; skills/super-code/scripts/context-pass.mjs:309 — `contextBaseline` dedupes coordinator records by `file` alone and keeps the one with the most requests, so profiles from different runs hosted in the same coordinator session (disjoint row windows) collapse into one agent, undercounting `agents` / `compacted agents` and dropping the lesser-request run's peak≥80%. [fix-regression] [lanes: correctness, simplicity-design, regression, testing, api-contract]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: context-pass.mjs:308-310 — `const key = a.file ?? Symbol('no file')` then `if ((a.requests ?? 0) > (f.a.requests ?? 0)) f.a = a`; `high` and `measured` are computed only from the surviving `f.a`. `runRows` (context-pass.mjs:~204-217) ends each run's window at the next super-auto invocation, and MAINTENANCE.md:421 says a coordinator session "usually predates the run and may host several", so two runs in one session yield records with the same `file` and disjoint windows. The `--summarize` seenRuns filter (run-profile.mjs:702-707) drops only repeated runIds, so both profiles reach `contextBaseline`. Scout repro: run A (50 requests, peakPct 90, one cap compaction) and run B (80 requests, peakPct 30, one cap compaction at a different `at`) on the same file → `agents 1 (measured 1) · peak≥80% 0 · compacted 1 agents, 2 compactions (cap 2)`; expected `agents 2 · peak≥80% 1 · compacted 2`. Compactions survive via the `(file, at)` key, so the line can report more compactions than compacted agents. The pre-fqb.11 code (base 7a004a0) summed per-profile summaries and counted this case correctly, so the change introduced the undercount. The new unit cases at tests/super-code/context-pass-unit.mjs:181-195 cover only overlapping records (the wide record is a superset) and `file:null`; no test covers disjoint windows over one file. The comment at context-pass.mjs:294 states the same-run premise only.
  severity note: seats split Nit / Should-fix / Should-fix. Held at Should-fix: it is a correctness regression in the cross-run aggregation that `--summarize` exists for, in a case the maintenance doc calls normal, not a resilience/observability/cost finding the low-blast-radius profile would down-weight. The advisory-only output is what keeps it below Blocking.
  fix-shape hint: key the dedupe on file plus the record's window start (fromRow / first span) or merge only when two records' row spans overlap; add a unit case with two disjoint windows on one file where the lower-request record holds the ≥80% peak.

Prior confirmed findings, tracked per Step 3 (the prior report confirmed none this iteration; its own tracked list is carried forward):
- resolved (unchanged since iteration 2) — [Should-fix] skills/super-code/scripts/run-profile.mjs:895; skills/super-code/coordinator-workflow.md:1292 — Finish docs on exit 3. Not re-surfaced by any lane.
- resolved (unchanged since iteration 2) — [Should-fix] skills/super-code/scripts/context-pass.mjs:84 — default 200K stamp before first in-window usage row. Not re-surfaced by any lane.
- resolved (unchanged since iteration 2) — [Nit] skills/super-code/scripts/run-profile.mjs:685; skills/super-code/scripts/run-profile.mjs:686 — disjoint windows spliced with `flatMap(slice)`. Not re-surfaced by any lane. Distinct from the new finding above, which is in the baseline aggregation, not the reader input.
- punch-listed (open) — [Nit] skills/super-code/scripts/run-profile.mjs:674; skills/super-code/scripts/run-profile.mjs:671 — every parsed transcript held in memory before reducing. Caller's scope filter left it unfixed; not re-surfaced. Still open.
- punch-listed (open) — [Nit] skills/super-code/scripts/run-profile.mjs:693 — all-unmeasured `Profile: context — unavailable` line discards per-file reasons. Caller's scope filter left it unfixed; not re-surfaced. Still open.

## Not verified (beyond panel cap)
- none

## Not verified (dedupe failed or judge lost)
- none

## Beyond remainder cap (count only)
- none

## Rejected (with reason)
- none this iteration. The six rejections from iteration 1 (run-profile.mjs:644 T0 anchor, context-pass.mjs:198 same-session resume, run-profile.mjs:1574 no isolation, run-profile.mjs:702 `--summarize` refusal, run-profile.mjs:649 memoized state, run-profile.mjs:662/664 missing coordinator transcript) stand; no scout re-surfaced them. The confirmed finding above is not the iteration-1 `--summarize` rejection: that one concerned refusing to summarize, this one concerns the fqb.11 dedupe key added at d0e5b07 after the last roast tip.

## Unverified nits (spot-checked)
- none this iteration.

## Escalations (need human)
- none
