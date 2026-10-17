# Workflow reliability across interruptions and retries

## Goal

Runs preserve work and evidence across interruptions, denied operations, and retries, and accurately report what remains before acceptance. Repairs address the confirmed failure mechanisms without adding a new workflow engine or expanding routine agent ceremony.

## Scope and approach

This is the approved five-category vision, simplified after a manual prompting-guide antipattern scan. Each category specifies an invariant, a smallest proposed mechanism, and acceptance examples. Mechanisms may be replaced by simpler implementations that preserve those guarantees; the examples describe observable behavior, not mandatory runtime checklists.

Extend existing coordinator, review, cleanup, run-state, and reporting components. Preserve compact coordinator inputs, the existing Workflow and ordinary-subagent execution paths, and super-auto ownership of final sweep and acceptance. Enforce mechanical checks and calculations in code; use agent judgment for semantic findings, uncertain matches, and causal diagnosis. Skill text carries the operative contract and a short reason; incident history belongs in evidence and maintenance documentation.

The investigation baseline is d84541ae (v6.4.2-alepar6.0). Supporting triage is in the original checkout at `/Users/alepar/AleCode/superpowers/docs/superpowers/feedback/2026-10-16-accumulated-triage/README.md` with linked dossiers and reproductions. That untracked evidence directory is not part of this spec commit. The triage's 37 entries are an evidence inventory, not automatic authorization to implement every historical complaint or unresolved policy question.

## 1. Workspace and process safety

**Invariant.** A review examines a stable revision without modifying its caller's checkout or sharing mutable reproduction outputs. Cleanup distinguishes verified termination, a surviving process, an unknown result, and deliberate preservation.

**Smallest proposed mechanism.** Bind review inputs to commit identities. Read-only Git retrieval is sufficient when reviewers only need source and diffs; use a review-owned detached worktree by default when filesystem access is required. Builds or reproductions that mutate files use isolated outputs or a separate temporary workspace. Reviewers do not switch the caller's branch or reset its files.

A before/after checkout comparison can reveal changes but cannot attribute them to a reviewer: integration may legitimately advance concurrently. Report unexplained changes with their evidence; never automatically restore a snapshot over someone else's work.

Return cleanup outcomes through existing helpers and callers. Failed discovery or denied inspection cannot become “nothing running” or “stopped.” Preserve workspaces and temporary resources still needed by surviving or unverified owned processes, and identify them in the report. Code delivery and incomplete cleanup can coexist as separate reported outcomes. Keep existing ownership boundaries so cleanup does not target unrelated processes.

**Acceptance examples.** A review remains pinned while integration advances. A mutating reproduction leaves caller files untouched. Denied process inspection yields an unknown result and retained resources; verified termination permits cleanup. Legitimate caller changes are not labeled reviewer damage merely because they differ from the initial snapshot.

## 2. Scheduling and recovery

**Invariant.** Dispatch uses a fresh admission decision after capacity waits; dependency meaning is preserved; interrupted work remains recoverable.

**Smallest proposed mechanism.** Recheck holds, cancellation, and dependency satisfaction after acquiring a slot and before starting work. Failed admission releases the slot without pretending an attempt ran. Use authoritative tracker observations for dependencies outside the coordinator's task-completion sets: implementation completion, review closure, blocker resolution, and human gates have different satisfaction conditions.

Refresh external readiness at bounded opportunities while work is in flight, so progress does not depend solely on another task finishing. Choose cadence within the existing coordinator; this does not require a new scheduler or transactional guarantee against tracker changes after observation. A failed lookup holds the affected work with a reason while unrelated eligible work continues.

Persist pending closures, holds, deferred obligations, and relevant fix history using existing run artifacts. Resume reconciles those facts with Git and tracker state before admitting affected work, reuses valid completed work, and preserves unexplained discrepancies.

**Acceptance examples.** A hold established during a slot wait prevents dispatch. A closed review dependency releases its consumer even when the review ID is not an implementation-task ID. External releases become visible during a long-running task. Restart after landing but before tracker closure reconciles the pending closure without repeating valid implementation.

## 3. Evidence and acceptance

**Invariant.** Implementation, review, measurement, and run acceptance are independently supported facts. Completion of one cannot silently stand in for another.

**Smallest proposed mechanism.** Extend existing outcomes and evidence records only where information is missing; do not introduce four compulsory phases. Evidence identifies the tested source tree, relevant command/configuration, outcome, and evidence location. Distinguish live, simulated, and fallback evidence, and failed or unavailable checks. A required live check remains outstanding when only fallback evidence exists.

Caller-owned deferred sweeps remain visible measurement obligations with an owner; they do not manufacture a code defect or hide actual code findings. A verification-only task may establish that no change is needed, with reviewed evidence against its acceptance criteria and no artificial commit.

Keep task-base attribution separate from run-baseline attribution. A regression predating task B exonerates B only; if introduced earlier in this run, the run retains an owner for resolution. Under super-auto, finished leaves do not close the root until required reviews, measurements, and human gates are satisfied. Preserve standalone callers' existing acceptance ownership.

**Acceptance examples.** Deferred sweep produces an explicit pending obligation while code findings remain actionable. A no-change task completes with appropriate evidence. A failure introduced by task A remains owned after task B proves it existed at B's base. All leaves can be done while root acceptance remains pending.

## 4. Finding continuity

**Invariant.** An actionable finding remains identifiable and accounted for until an explicit, supported disposition changes it. A later review's silence cannot erase it.

**Smallest proposed mechanism.** Preserve each invocation's review artifact under a unique identity. Link repeated appearances to the same finding through explicit references where available; keep uncertain matches separate pending judgment. Use existing finding/task records to retain disposition, ownership, deferral reason, and verification evidence. These are facts that may overlap, not a prescribed six-state transition chain: a deferred finding can still have an owner, and an assigned fix can still await verification.

Treat the punch list as a view of outstanding deferred findings. Resolution requires evidence supporting the fix, including when another task or later release supplied it; a fix task's success claim alone is insufficient. Rejection retains its reasoning or evidence.

Keep defect identity separate from recurring process classes. A small set of common classes and aliases can group equivalent process failures while preserving original text. Recurrence supports reassessment; it does not automatically merge defects, escalate severity, or expand scope. No new general-purpose finding database is required.

**Acceptance examples.** A blocked review followed by a silent retry retains the earlier unresolved item. A deferred item fixed elsewhere leaves the punch list after verification. An unsupported resolution claim leaves the obligation open. Equivalent process tags group together without pooling unrelated defects or all test failures.

## 5. Metrics and diagnosis

**Invariant.** Reports distinguish observed facts, incomplete evidence, and estimates, with consistent meanings across producers and consumers.

**Smallest proposed mechanism.** Existing helpers validate ledger transport and calculate deterministic counts before agent interpretation. Missing, unreadable, truncated, and valid-empty inputs remain distinguishable. Reconcile available Git/tracker evidence before claiming authoritative final totals; when reconciliation is incomplete, still report supported partial results and explicit gaps.

Separate latest-attempt outcomes from run history, repaired findings from deferred or rejected ones, and task landings from base-absorption merges. Waiting time cannot begin before task creation. Label readiness timestamps and graph scope according to what is actually known; historical graph reconstruction is not required. Distinguish overall agent concurrency from task-slot concurrency. Unknown timestamps remain unknown.

Include planning time when diagnosing bottlenecks or modeling improvements, and label counterfactuals as estimates. Show actual ID discrepancies before proposing their causes. Keep normal execution metadata separate from friction. Structured results feed concise human summaries, with semantic interpretation reserved for the agent.

**Acceptance examples.** A late-created task acquires no pre-creation wait. A clean latest review does not erase earlier repairs. Base merges do not inflate task counts. Missing ledger evidence yields a qualified partial report. Planning-dominated timelines do not support a claim that task parallelism alone removes the bottleneck.

## Delivery and verification boundaries

These categories can be implemented separately, with boundary checks where outcomes cross components: cleanup to finish/reporting, admission to tracker state, findings to acceptance, and reconciled records to metrics. Planning should identify those producers and consumers without introducing a shared replacement engine or copying full contracts into every prompt.

Use focused deterministic fixtures for mechanics and representative behavior evaluations for changed agent instructions. The acceptance examples guide that selection; they do not require every agent to run every check on every task. Broaden validation when changes, failures, or unresolved concerns justify it. Retain source evidence for historical claims and do not relabel already-fixed mechanisms as new defects.

## Post-Implementation Notes

*As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
