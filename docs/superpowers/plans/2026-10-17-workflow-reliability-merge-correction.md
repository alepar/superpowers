# Workflow reliability merge correction implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair verified merge blockers and reconcile actual acceptance evidence before the authorized local merge of workflow-reliability.

**Architecture:** Extend the existing scheduler, review collection/recovery and acceptance consumers; preserve existing source identities and finding history. This is a separately authorized correction pass from c4c9bf712a0010346bbea0c020f8070d121d597c, not a reset of the ended normal super-auto loop.

**Tech Stack:** Node JavaScript; Bash/Python embedded helpers; Markdown behavior contracts; existing replay and fixture tests.

**Spec:** docs/superpowers/specs/2026-10-16-workflow-reliability-design.md

## Global Constraints

- An actionable finding remains identifiable and accounted for until an explicit, supported disposition changes it. A later review's silence cannot erase it.
- Implementation, review, measurement, and run acceptance are independently supported facts. Completion of one cannot silently stand in for another.
- Dispatch uses a fresh admission decision after capacity waits; dependency meaning is preserved; interrupted work remains recoverable.
- Failed discovery or denied inspection cannot become “nothing running” or “stopped.”
- A required live check remains outstanding when only fallback evidence exists.
- Root remains open until required reviews, measurements and human gates are supported. No push, release, external issue/PR filing or waiver is authorized.
- Preserve original pinned 6.0 super-auto policy, rounds, raw artifacts, failed/unavailable evidence and source identities. Record this user-authorized continuation separately; never restamp old evidence onto new source.
- Work only in existing isolated workflow-reliability checkout; main remains 832b051c until merge gates pass. Do not edit the scout owner's isolated branch or take over its finding-ID/redesign fixes.

## Authority and boundary

Source authorization is main's received message mQ0VuyiMVWeP in d4xcusxkUh1: the user replied “go for it” to bounded repair and acceptance work; the source tab relinquishes concurrent writes. Original root super-plan-ufz and leaf approvals are preserved. Two fresh independent investigations assess policy and acceptance gaps before disputed-policy implementation. Merge permission exists; push/release does not.

### Task 1: Verification-only stacked scheduler settlement

**Files:** skills/super-code/coordinator.js; tests/super-code/replay-harness.mjs (or a focused harness consumer).
**Consumes:** existing startAttempt/parentsMerged/scheduler-slot and verification completion contracts.
**Produces:** a verification-only child awaiting a parent merge does not monopolize the slot needed by failure settlement, cancellation or triage; valid completion still waits for parents and holds/admission correctly.
- [ ] Add a deterministic failing concurrency=1 parent-merge-failure/verification-child regression with bounded deadlock detection and ordinary-child/successful-parent controls.
- [ ] Verify RED against c4 source, then apply the smallest lifecycle fix, keeping slot release/reacquisition/abandon semantics balanced.
- [ ] Run focused regression plus full replay once; record exact commands/results; commit and obtain fresh spec+quality review.

### Task 2: Review archive containment and explicit null-result reconciliation

**Files:** skills/super-auto/scripts/report-status; tests/super-auto/collection-symlinks-r1.sh; focused new correction tests if needed.
**Consumes:** settled invocation identity, collection source binding and archive ownership.
**Produces:** destination path components cannot redirect collection outside its owned archive; a recovered report may explicitly reconcile a settled null result with immutable provenance/history rather than rewriting the original outcome.
- [ ] Read retained round2 probes and actual collection code; reproduce both defects in private fixtures with positive controls.
- [ ] Add failing behavioral tests before fixes; reject unsafe destination components without outside writes and support a narrowly validated recovery transition.
- [ ] Test idempotence, mismatched identity, original null/UNAVAILABLE preservation and supported successful collection; commit/review.

### Task 3: Recovery kinds, contradictory attribution and supported acceptance population

**Files:** skills/super-auto/scripts/report-status; skills/super-code/scripts/dispatch-text.mjs; corresponding focused producer→recovery→acceptance tests.
**Depends:** Task2 for report-status edits; policy review for ledger/retained-source contract.
**Consumes:** immutable reviewSource binding, recovery obligations, runFailure attribution evidence, ledger producers and acceptance criteria.
**Produces:** provenance metadata is not invented measurement work; contradictory same-tree attribution stays a gap even with pre-run classification; ledger-only unresolved findings cannot silently escape applicable root acceptance.
- [ ] Trace real producer/reader/acceptance records; preserve original bindings and historical contradictions.
- [ ] Write failing integrated controls with independently satisfied prerequisites, including missing/malformed provenance, deferred live measurements and disputed ledger-only findings.
- [ ] Apply minimal typed consumer/contract changes after independent policy ruling; no blanket clearance of unknown evidence. Run focused checks; commit/review.

### Task 4: Authoritative review selection with explicit incomplete direct review

**Files:** skills/super-code/scripts/dispatch-text.mjs; skills/super-code/coordinator.js only named selection/fallback consumers; skills/super-code/assembler-prompt.md and related review contracts if required; focused selector/recovery tests.
**Depends:** Tasks1/3 for shared code; independent policy review.
**Consumes:** immutable Git review source, live run archive manifests and retained historical run.md snapshots.
**Produces:** archived fixture snapshots cannot acquire current omission authority; invalid provenance never authorizes exclusion, while independently available bounded product source can receive a source-bound explicitly incomplete review and retains all gaps.
- [ ] Reproduce nested run.md authority failure with a valid product edit and invalid archived reference; establish authoritative producer boundary from approved spec/evidence.
- [ ] Add failing tests proving no unsafe omission and no false clean whole-branch verdict; implement bounded correction with explicit evidence and fresh independent policy review.
- [ ] Refresh actual selection against the branch, preserve old690gaps, and distinguish newly usable source review from validated archive evidence. Commit/review.

### Task 5: Idempotent Key Abstractions synchronization during resume

**Files:** skills/super-auto/resume.md; matching super-design/caller contracts only if needed; tests/super-auto/test-contract-lint.sh or a focused extraction/execution regression.
**Consumes:** persisted specs-committed state and existing Key Abstractions sync requirements.
**Produces:** resumed path cannot advance to filing/implementation with stale abstractions after a crash between spec commit and sync.
- [ ] Trace both amendment replay paths and prepare a failing regression for required sync before downstream advance.
- [ ] Apply minimal idempotent sync requirement; run focused checks and fresh instruction/spec review. Do not modify scout owner identity/dissolution scope. Commit/review.

### Task 6: Actual evidence reconciliation, final validation and merge gate

**Files:** dedicated correction artifacts under docs/superpowers/runs/2026-10-16-workflow-reliability/merge-correction/; existing report/run/spec/index updated only through explicit additions/dispositions.
**Consumes:** reviewed Tasks1–5; independent acceptance inventory; original root criteria, immutable reports, raw measurements and new source identity.
**Produces:** auditable corrected finding dispositions, complete/qualified source inventory, per-criterion acceptance judgment, fresh meaningful source review and exact source-bound suite/behavior evidence. No retroactive initial snapshot or fictional live evidence.
- [ ] Record policy rulings with independent evidence; reconcile historical extraction/unregistered sources and actual review scope, retaining unavailable inputs explicitly.
- [ ] Reuse valid old evidence only for its original source; rerun changed mechanics and representative instruction behavior, obtain fresh independent finding-continuity and changed-instruction assessment.
- [ ] Run declared combined suite and documented changed-engine scenarios on exact final source; reconcile aggregate command identity instead of merely restamping old37passes.
- [ ] Obtain final whole-branch review with bounded packages covering actual changed product contracts and evidence gaps. Repair load-bearing findings only within recorded continuation authority.
- [ ] Evaluate real root gate, separately reserve human choice facts, and merge locally only if ready review, required evidence and acceptance are supported. If a non-reconstructable required gate remains, report its precise missing evidence/operator intent; no waiver.

## Pre-flight interface scan

| Pair/task | Shared surface/contract | Assessment |
| --- | --- | --- |
|1 self|slot lifecycle vs verification parent gate|same scheduler contract, regression controls needed|
|2 self|collector destination vs recovery record|separate checks sharing collection state; keep original result immutable|
|3 self|typed recovery vs acceptance provenance|reader changes need real producer fixtures and independent policy ruling|
|4 self|selection authority vs incomplete review|no omission is authorized by an invalid archive; incomplete source review cannot claim global readiness|
|5 self|commit-state sync vs filing|idempotent sync must precede downstream advance|
|6 self|evidence vs merge gate|mechanics green does not imply semantic root acceptance|
|1/4|coordinator.js|sequential edits; separate diff/review scopes|
|2/3|report-status|sequential edits, preserve collection identity|
|3/4|dispatch-text|sequential edits, source binding shared|
|3/6|root eligibility|gate contract remains strict; assessor supplies actual judgments|
|4/6|review inputs|new source selection must not erase historical coverage gaps|
|5/6|instruction evidence|fresh source-specific sync behavior check required|
