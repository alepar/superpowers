## Goal

Let super-auto and super-code finish a beads run in a session with ordinary subagent tools and no Workflow tool, while retaining their existing design, review, integration, resume, and human finish gates.

## Decision

Select the orchestration mechanism once per invocation from the calling session's loaded tools: Workflow when present; otherwise ordinary subagent spawn, follow-up, and wait tools. Super-roast already supports manual fan-out, and super-design can run its own design loop in the calling session, so no second implementation of those phases is needed. Record the selected mechanism in the super-code ledger and super-auto run state. A later invocation may switch mechanism; the same epic, integration worktree, beads graph, plan, and ledger carry forward.

The ordinary-subagent path is a **separate, explicit procedure** in `skills/super-code/coordinator-subagents.md`. A direct adapter of `coordinator.js` is infeasible in this harness: its `agent()` and `log()` hooks run only inside Workflow, while ordinary subagent calls are available only to the calling model. The procedure therefore uses the existing prompts, scripts, artifact paths, ledger vocabulary, and gates, with the calling session as the scheduler. It uses a conservative serial task schedule. This changes throughput, not the approval criteria: a dependent starts only after its blocker merges, and one integration merge/build check runs at a time.

## Execution contract

The calling session owns ready queries, task dispatch, merge admission, ledger appends, and Finish. Each task uses `task-<id>` in its own worktree off the integration branch. A fresh implementer writes the report and runs task-relevant tests; a different fresh reviewer checks the review package and base evidence; a fresh fixer gets at most one pass for Critical/Important findings. A rebase that overlaps sibling files, resolves a conflict, or consumes a newly landed producer gets a new seam reviewer and at most one seam fix. A failed build-only merge check shares that seam-fix allowance and gets an independent fix review. The merge is committed and the bead closed only after the check passes. Failed work is triaged through blocker beads, never silently marked complete.

The existing ignored workspace ledger (`.superpowers/sdd/<epic>-plan/progress.md`) is the durable journal. After the planner creates the plan, the caller writes `Fallback:` checkpoints before each task-stage dispatch and after each result, including branch/head, artifact pointers, and fix/check counters. It writes the existing `Task`, `Merge`, `Detector`, `Sweep`, and four `Metrics` line shapes as work advances. On resume it reads the raw ledger and `scripts/ledger-digest`, re-queries `bd ready` and the task/review beads, and checks git branch/worktree/merge evidence. It never assumes that a dispatched agent completed because it was launched. A completed merge with an open bead takes the existing close-only path; an unmerged task re-enters with a fresh agent only where the bounded pass allowance permits. The ledger is kept in the integration worktree across invocations.

Finish runs one full-suite sweep against the integration tip when super-code owns it, or records `SWEEP DEFERRED (caller-owned)` when super-auto owns its phase-6 sweep. It checks ledger merge counts against completion counts, records any missing measurements as invalid, runs a fresh whole-epic reviewer with the same deferred-minor and blocker intake, and returns the existing code buckets. The final merge into the user's base remains the human-owned `finishing-a-development-branch` gate; a caller's explicit authorization to merge is an answer to that gate.

## Alternatives considered

- A Node wrapper around `coordinator.js` would need a callable ordinary-subagent API exposed to Node. Neither Codex nor the other harness contracts here provide one, so it would create an untested harness dependency.
- Deleting Workflow checks and asking an agent to improvise the loop would recreate the missing-artifact failure that motivated the Workflow-only policy.
- A separate orchestrator with its own state schema would drift from the existing ledger and run-state readers. The documented procedure instead writes their current artifacts.

## Verification

Run the existing script suites and Workflow replay, plus behavior probes in fresh sessions with Workflow absent: ordinary fallback selection, interrupted dispatch/resume, reviewer independence/base evidence, merge/build failure, permission refusal, and finish ownership. Inspect the artifacts, not only agent claims. A baseline test failure must be recorded separately from regressions.

## Post-Implementation Notes

Implemented as a separate ordinary-subagent procedure, selected by capability in super-code and super-auto. Workflow and its coordinator remain unchanged. The fallback runs one task chain at a time, so it does not provide Workflow's throughput, early unblock, or optional background edge audit. The current user request superseded the prior Workflow-only fork policy for this supported path.

Evidence: [evaluation record](../plans/eval/2026-10-03-ordinary-subagent-fallback-eval.md) and [live transcript](../plans/eval/2026-10-03-ordinary-subagent-fallback-live-transcript.md). A disposable one-task run exercised planning, implementation, independent task and final reviews, merge/build check, sweep, ledger/Metrics, bead closure, and finish handback. Interrupted merge recovery and refusal decisions were simulated in read-only probes; seam fixes and multi-task dependencies were specified and contract-reviewed but not exercised. No gate-parity claim is made for those unexercised branches.
