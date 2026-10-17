# Harness partition review

Assessment: no Critical or Important finding in this partition; two Minor coverage limitations below. This is one partition of the composed whole-branch review, not a global readiness or acceptance verdict. The parent's exact-source combined verification remains pending; I did not rerun suites or claim hosted Workflow evidence.

## Scope and pin

- Base: `832b051c870ae5c69adfa7f14d770292ab6c1a81`; inspected HEAD: `7b18b0c26b9f19d531c558e112d490743901a13b`.
- Read the complete `harness.diff`, lines 1–2695, in contiguous bounded reads. Package: 247203 bytes, SHA-256 `fb4be9d04de4022a098962c11ec1d2a3e0c1c91ba7c29a3a6e5c6ba0f044c4f5`.
- Reviewed all five assigned paths: `tests/super-code/replay-harness.mjs`, `invocation-source-binding-r1.mjs`, `invocation-start-r1.mjs`, `recovery-hold-scope-r1.mjs`, and `startup-builder-seam-r1.mjs`. All five current file byte counts and SHA-256 values match the supplied manifest. Review covers every changed hunk, with selected unchanged harness infrastructure and dryRun assertions read for context, not an assertion that every unchanged legacy line was rereviewed.
- Read the requested reviewer prompt, approved workflow-reliability spec, and corrective plan including Global Constraints. Source checkout/index/tracker/Herdr were not mutated. Only this report was written.
- One initial broad filename discovery output was truncated; it was not used as review evidence. The complete assigned diff was subsequently read without truncation. No assigned diff portion remains unread.

## Strengths and contract checks

- The scheduler regression drives the real coordinator with explicit dispatch barriers and an event-loop handoff. It checks failure settlement, successful-parent and ordinary-child controls, capacity reacquisition, new merge holds, fresh external observations, unavailable observations, and exhausted lookup budgets. Assertions examine completion, closure/discard routing and evidence, beyond dispatch totals.
- External readiness uses injected timers and checks release while unrelated implementation remains active, per-consumer gate/blocker/lookup holds, bounded query count and timer cancellation. Rejected admissions are checked for absence of attempt/merge/ledger outcomes and for released capacity reaching unrelated work.
- Recovery tests execute the real digest and targeted recovery helper. They retain original records/additive fields and source pointers, distinguish missing/empty/malformed/truncated data, require source/tracker reconciliation before closure, and preserve pending obligations when observation or persistence fails. Known finding/fix/run-failure history is tested across clean retry, contradiction, verification and reentry.
- Startup fixtures execute actual coordinator startup with forbidden clock/random globals and simulated mechanical outputs. The builder fixture invokes the real CLI, instruments only its loader boundary, covers both Launch forms, and checks that prompt rendering neither runs operational Resume nor fabricates review identity.
- Invocation tests exercise real source-binding CLI refusal, persistence before initial writes, explicit resume, distinct invocation paths, retained partial bytes, null/failed writers, and preserved null reviewPath semantics. See the per-writer coverage qualification below.
- Existing documented dryRun counts remain exact: canonical 48, fix-pass-blocked 19, parked 23. Current assertions at replay-harness.mjs:899–961 also check terminal completion/escalation/parked buckets, blocked-task routing, one fix pass, merge serialization and ordering. These are simulated topology checks, not live hosted execution.
- Old checks were not materially weakened by the changed assertions: source ranges become pinned SHAs; metrics retain numeric/event assertions while adding history and explicit identity discrepancies; Recovery filtering preserves the older task-line assertions while new assertions inspect Recovery separately. The removed brittle cleanup source-string assertion is replaced with real-Git default/discard, dirty, unmerged and rejected-force behavior in the focused cleanup suite.

## Issues

### Critical

None found.

### Important

None found.

### Minor

1. **Writer snapshots do not establish that every writer guard executed.** `tests/super-code/invocation-source-binding-r1.mjs:56` makes guard execution conditional on a regex match; line 61 still records a snapshot when no guard was found. Assertions at lines 158–163 then describe those snapshots as executed assembly/review/seam/stub guards. Trigger: omit the guard from a cluster, seam or stub prompt while retaining the assembler guard. The assembler has already persisted the binding, so all writer snapshots can retain the expected binding and those assertions still pass. The existing collision retry is rejected at assembly and never reaches these writers. This limits the claim of independently exercised per-writer destructive refusal, although the inspected current product emits the guard. Require a matched command for each expected writer and add existing-output refusal controls for individual writer destinations before treating that stronger claim as established.

2. **The fixture liveness observer still accepts an ambiguous failed lookup as absence.** `tests/super-code/replay-harness.mjs:57` accepts exit status 1 with empty stdout without examining diagnostic output or confirming absence through successful enumeration. Trigger: the fixture's `ps -o stat= -p PID` returns status 1, empty stdout, and an inspection-denied diagnostic. Line 61 returns false, so the real-process cleanup assertions can treat an unavailable observation as a dead process. The separate inert denial tests protect the product's uncertainty contract; this helper should likewise throw on diagnostic failure or confirm absence through an independent successful enumeration. This is a test-observer limitation, not evidence that the product currently reports false termination.

## Named cross-part inspections and questions

- Outside the assigned diff I read `tests/super-code/test-setup-cleanup.sh` to resolve the explicitly requested risk that removal of the force-source assertion weakened default cleanup protection. Its real-Git fixture rejects force operations and checks default success plus dirty/unmerged preservation; this resolves that concern at behavioral scope.
- Read only relevant documented Workflow dryRun sections to compare expected counts and terminal contracts.
- Searched source-guard call sites in `skills/super-code/coordinator.js` and `skills/super-code/scripts/dispatch-text.mjs` for the concrete per-writer coverage risk above. The current coordinator's `reviewSourceGuard` emits the real immutable binding/artifact guard; no product defect is alleged from this test gap. Runtime/source-review partitions retain responsibility for every product writer's use of that guard.
- No remaining cross-part source question blocks this partition. Composer should qualify any claim that every writer's existing-output refusal was individually tested, and retain simulated-versus-live boundaries for all replay results.
