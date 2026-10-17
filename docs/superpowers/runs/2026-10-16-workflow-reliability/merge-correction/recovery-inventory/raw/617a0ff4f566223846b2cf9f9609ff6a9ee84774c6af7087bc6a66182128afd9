# Workflow reliability execution plan

## Mapping

| N | Bead | Files touched |
|---|---|---|

## Planning context (ready set)

Spec: `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`. Integration base: `444ae642f59a22886526b41538eafadd8ff9faca`. Source mechanics are unchanged from the recorded d84541ae replay baseline (1770 passing assertions); do not rerun unchanged baseline solely for planning. New source behavior uses failing focused fixtures before implementation. Operative skill text changes use `superpowers:writing-skills`; fresh-agent evaluations are owned by the enclosing coordinator, and evaluation evidence is not fabricated by implementers.

The broad measured surfaces include large shared coordinator/reference/replay files. They are context measurements, not new scope: use the named function/fixture neighborhoods below. The coordinator, execution references and replay harness are genuinely shared write targets and subject to the existing hot-file cap; file overlap alone is no dependency. No task extracts a replacement engine or copies every contract into every prompt. No-change completion remains .13, distinct from evidence transport .5. This round plans only the nine confirmed-ready leaves; all other tree scope remains for the next planner.

## Mapping (continued)

| N | Bead | Task | Files touched | Files to read | Surface tokens | Dependency facts |
|---|---|---|---|---|---|---|
| 1 | super-plan-ufz.1 | Pin review inputs and isolate mutable reproductions | `skills/super-roast/SKILL.md`, `skills/super-roast/scout-prompts-pr.md`, `skills/super-roast/judge-seat-prompts.md`, `skills/super-roast/scripts/assemble-args.mjs`, `skills/super-code/coordinator.js`, `skills/super-code/task-reviewer-prompt.md`, `skills/super-code/scripts/dispatch-text.mjs`, `skills/super-code/assembler-prompt.md`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `tests/super-roast/test-assemble-args.sh`, `tests/super-code/test-dispatch-text.sh`, `tests/super-code/replay-harness.mjs` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `skills/subagent-driven-development/scripts/review-package` | 229403 | deps: []; opaque: false |
| 2 | super-plan-ufz.2 | Propagate cleanup uncertainty and retain needed resources | `skills/super-code/scripts/stop-run-processes`, `skills/super-code/scripts/remove-task-worktree`, `skills/super-code/coordinator.js`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `skills/super-auto/run-state.md`, `skills/super-auto/report-prompt.md`, `tests/super-code/replay-harness.mjs` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `skills/super-auto/scripts/report-status` | 208711 | deps: []; opaque: false |
| 3 | super-plan-ufz.3 | Recheck admission and refresh external dependency readiness | `skills/super-code/coordinator.js`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `tests/super-code/replay-harness.mjs` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `skills/super-code/scripts/tree-deps`, `skills/super-code/scripts/ready-in-tree`, `skills/super-code/scripts/review-bead` | 197104 | deps: []; opaque: false |
| 4 | super-plan-ufz.4 | Persist recovery obligations and fix history records | `skills/super-code/coordinator.js`, `skills/super-code/scripts/ledger-digest`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `tests/super-code/replay-harness.mjs` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `skills/super-code/scripts/already-merged`, `skills/super-auto/run-state.md` | 201731 | deps: []; opaque: false |
| 5 | super-plan-ufz.5 | Record source-bound evidence and check outcomes | `skills/super-code/coordinator.js`, `skills/super-code/implementer-prompt.md`, `skills/super-code/task-reviewer-prompt.md`, `skills/super-code/scripts/dispatch-text.mjs`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `tests/super-code/replay-harness.mjs`, `tests/super-code/test-dispatch-text.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `skills/super-auto/run-state.md` | 214205 | deps: []; opaque: false |
| 6 | super-plan-ufz.10 | Correct profiler availability bounds and bottleneck claims | `skills/super-code/scripts/run-profile.mjs`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `skills/super-auto/SKILL.md`, `skills/super-auto/report-prompt.md`, `tests/super-code/run-profile-fixture.mjs`, `tests/super-code/run-profile-ordinary-fixture.mjs`, `tests/super-code/test-run-profile.sh`, `tests/super-code/test-run-profile-in-flight.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `skills/super-code/scripts/run-profile`, `skills/super-auto/run-state.md` | 128122 | deps: []; opaque: false |
| 7 | super-plan-ufz.11 | Normalize recurring process classes without merging defects | `skills/super-code/coordinator.js`, `skills/super-code/scripts/ledger-digest`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `skills/super-code/task-reviewer-prompt.md`, `tests/super-code/replay-harness.mjs` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md` | 195977 | deps: []; opaque: false |
| 8 | super-plan-ufz.8.1 | Preserve distinct invocation review artifacts | `skills/super-code/SKILL.md`, `skills/super-code/coordinator.js`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `skills/super-code/scripts/dispatch-text.mjs`, `tests/super-code/test-dispatch-text.sh`, `tests/super-code/replay-harness.mjs` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md` | 215574 | deps: []; opaque: false |
| 9 | super-plan-ufz.8.2 | Extract complete source finding occurrences | `skills/super-code/scripts/report-verdict`, `tests/super-code/test-report-verdict.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `skills/super-roast/reporter-prompt.md`, `tests/super-code/fixtures/report-verdict/final-review-real.md`, `tests/super-code/fixtures/report-verdict/roast-report.md` | 17681 | deps: []; opaque: false |

## Task 1: Pin review inputs and isolate mutable reproductions

**filesTouched:**
- `skills/super-roast/SKILL.md`
- `skills/super-roast/scout-prompts-pr.md`
- `skills/super-roast/judge-seat-prompts.md`
- `skills/super-roast/scripts/assemble-args.mjs`
- `skills/super-code/coordinator.js`
- `skills/super-code/task-reviewer-prompt.md`
- `skills/super-code/scripts/dispatch-text.mjs`
- `skills/super-code/assembler-prompt.md`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-roast/test-assemble-args.sh`
- `tests/super-code/test-dispatch-text.sh`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/subagent-driven-development/scripts/review-package`

**Bead:** super-plan-ufz.1. **Surface:** 229403 tokens at the integration base.

**Scope:** Stable source identities and isolated review-owned writes across task/final and adversarial reviews. Leave finding ledgers, roast triggers and redesign/amend policy to their owners.

**Interfaces:** Capture a verified base/head SHA pair before review dispatch, carry it in existing launch/dispatch inputs, and use it for diffs and source reads. runTag/invocation naming is owned separately by Task 8; this task only consumes a supplied artifact destination.

### Acceptance (verbatim)

- [ ] A review remains pinned to its captured SHAs while the caller integration branch advances.
- [ ] A reproduction that writes files leaves the caller checkout and another review's mutable outputs untouched.
- [ ] A changed caller checkout is reported with evidence without attributing damage solely from before/after differences or restoring the old snapshot.
- [ ] The coordinator records representative fresh-agent evaluation of changed review instructions; deterministic input/dispatch fixtures pass.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add failing dispatch/assembler fixtures using a temporary Git repository: capture base/head, advance the caller branch, regenerate the review prompt, and assert its diff and source reads still name the captured commits. Extend replay's oneTaskCanned/live-sim fixtures with an explicit implementation head; test task, final single/cluster/seam and roast PR inputs. Use two review-owned directories for a mutating reproduction and assert caller files plus the other directory remain byte-identical.
2. Run the focused shell suites below and record the failing assertions before editing producers. For coordinator mechanics, add the failing replay scenario first; the known baseline is 1770 passing assertions at unchanged source d84541ae, so there is no need to rerun the unmodified full baseline.
3. In assemble-args.mjs resolve PR base/head once with git rev-parse --verify <ref>^{commit}; compute its diff/stat and every rendered source command from those identities, rejecting unresolved inputs. In coordinator.js carry verified implementation/final-review head and base into taskReviewPrompt, finalReviewPrompt, finalClusterReviewPrompt and finalSeamReviewPrompt. The assembler takes fixed BASE/HEAD, and opening source uses git show <head>:<path> or the review-owned detached worktree. dispatch-text must supply the same values as Workflow, with explicit SHA options/launch values rather than re-resolving moving refs inside a reviewer.
4. Replace mutable HEAD/branch reads in task-reviewer-prompt.md and the relevant roast/assembler protocol blocks with the captured identities. If a filesystem view is necessary, create a unique review-owned detached worktree at the captured head; mutable reproductions also get their own output/temp directory. Preserve task review's existing no-test-run policy. Permit writes only to declared review artifacts and review-owned resources; never checkout/reset/restore the caller. A caller before/after comparison reports observed commits/status and unexplained differences without assigning causality from difference alone.
5. Update ordinary-subagent/Workflow invocation instructions only where new SHA parameters and review-resource ownership must cross the existing interface. Follow writing-skills for changed operative instruction text. Prepare the advancing-integration/two-reproductions scenario and evidence pointers for the enclosing coordinator's fresh-agent evaluation; do not create another evaluation agent or stronger generic judgment prose.
6. Run the tests below. Inspect the actual generated prompts and diff for any remaining mutable review range; fix and rerun affected checks. Commit only the task's implementation and fixtures, recording changed interfaces and evaluation still owned by the coordinator.

Run:

```bash
bash tests/super-roast/test-assemble-args.sh
bash tests/super-code/test-dispatch-text.sh
node tests/super-code/replay-harness.mjs
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** Review builders and ordinary dispatch emit captured source identities; deterministic advancing-branch and isolated-output fixtures establish stability and caller preservation.

## Task 2: Propagate cleanup uncertainty and retain needed resources

**filesTouched:**
- `skills/super-code/scripts/stop-run-processes`
- `skills/super-code/scripts/remove-task-worktree`
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-auto/run-state.md`
- `skills/super-auto/report-prompt.md`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-auto/scripts/report-status`

**Bead:** super-plan-ufz.2. **Surface:** 208711 tokens at the integration base.

**Scope:** Keep the existing process ownership/matching rules; repair discovery certainty, cleanup ordering and result propagation together.

**Interfaces:** Keep existing stopped:/survived:/kept: lines. Add unknown: <root-or-pid> — <failed inspection> and retained resource facts. Exit 0 means verified completion, 3 means a known survivor or deliberate retention, 4 means inspection/termination is unverified; exit 2 remains bad input. processSweep retains stopped/survived arrays and adds unknown/kept arrays. The resource paths must survive to worktreesKept/run reporting.

### Acceptance (verbatim)

- [ ] Denied discovery or status inspection cannot produce stopped or a verified nothing-running result.
- [ ] A surviving or unverified owned process retains the worktree/temp resources it may still need and those resources are identified in the result.
- [ ] Verified termination permits normal cleanup; deliberately preserved resources remain distinguishable.
- [ ] Unrelated processes remain outside cleanup targets, and code delivery can be reported alongside incomplete cleanup.
- [ ] Signal-safe deterministic denial/survivor fixtures and result-propagation checks pass; the coordinator owns fresh-agent behavior evaluation where instructions changed.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Extend replay-harness.mjs's existing script fixtures with PATH-controlled ps/lsof/kill wrappers in temporary directories. Denial/survivor tests must use inert fake PIDs and fake kill, never signal live user processes. Cover failed initial discovery, failed status-after-signal, signal failure followed by an observable live process, verified disappearance, intentional interactive retention, and an unrelated process. Assert both exit/output and whether the worktree/temp directory still exists.
2. Run the new fixtures before the implementation and retain the failure. For the real-process success case reuse the existing narrowly owned sleeper fixture and its teardown; do not broaden process roots.
3. In stop-run-processes, preserve command status instead of converting discovery and status errors into empty output. Distinguish verified absence from denied/failed inspection (ps exit status alone may need a second successful authoritative enumeration to prove absence). Accumulate unknown facts for incomplete discovery; do not claim stopped for a PID whose status cannot be verified. Keep the current cwd/executable/HOME/TMPDIR/orphan-argument matching and interactive exclusions.
4. In remove-task-worktree replace stop_processes's unconditional success with outcome propagation. Stop and verify all resources to be removed before git worktree remove, branch deletion or rm -rf. A survivor, unknown result or deliberate preservation retains every owned worktree/temp resource it may need, including --discard/--sweep paths; default worktree dirty/unmerged guards still apply. Propagate exit 3/4 without erasing output.
5. Extend coordinator cleanup result parsing, merge/discard/close-only prompts and worktreeSweepPrompt so normal retained/unknown outcomes are data rather than fabricated success. Preserve code-delivery completion separately from cleanup completion. Missing dispatch, scriptError and missing processLines are explicit unknowns; never interpret them as a verified empty sweep. Update ordinary-subagent instructions, run-state fields and report-prompt Remaining sources to carry the same arrays and resource identities.
6. Add replay fixtures for a successful landing with unknown cleanup, known survivor, deliberate retention, complete verified cleanup and unavailable sweep dispatch. Assert completed code can coexist with retained cleanup obligations. Use writing-skills for the changed caller protocol and prepare the denied-inspection acceptance scenario for the coordinator-owned evaluation. Run the suite below after changes and commit the bounded fix.

Run:

```bash
node tests/super-code/replay-harness.mjs
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** A denied or surviving process can no longer lose its workspace, and Finish/reporting distinguish known survivors, unknown inspection, deliberate retention and verified cleanup.

## Task 3: Recheck admission and refresh external dependency readiness

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-code/scripts/tree-deps`
- `skills/super-code/scripts/ready-in-tree`
- `skills/super-code/scripts/review-bead`

**Bead:** super-plan-ufz.3. **Surface:** 197104 tokens at the integration base.

**Scope:** Fresh dispatch admission and bounded tracker refresh inside the existing scheduler; do not introduce a scheduler replacement or strengthen unrelated agent judgment.

**Interfaces:** Local implementation dependencies may be usable at implDone under the current early-unblock contract. Review, blocker, human-gate and out-of-tree dependencies require authoritative tracker status. A failed observation produces a per-task admission hold/reason, not a run-global failure. This leaf may use transient admission state; durable recovery encoding belongs to Task 4, so neither leaf waits for the other.

### Acceptance (verbatim)

- [ ] A hold established during a slot wait prevents dispatch; the slot is released and no implementation attempt is falsely reported.
- [ ] A closed external review dependency releases its consumer even when its ID is absent from implementation completion sets.
- [ ] An external release becomes visible while a long-running task remains in flight.
- [ ] A failed dependency lookup keeps affected work held with a reason while unrelated eligible work continues.
- [ ] Deterministic Workflow replay covers both execution-path contracts; coordinator-owned live evaluation checks changed ordinary-subagent instructions.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add replay scenarios using the harness's async canned functions and waitFor(label), with cap 1 or 2: hold a first task in flight, queue a consumer for a slot, establish integration/parent cancellation or tracker hold before releasing the slot, and assert no impl:<consumer> dispatch. Assert slot capacity is reclaimed and no implementation/fix/merge attempt is counted for rejected admission.
2. Add independent cases for a closed review ID absent from completed/implDone, a blocker/human gate that remains open, an unavailable lookup affecting only one consumer, and an external dependency released while a long-running task has not completed. Use bounded fake cadence/events in the replay; no wall-clock sleeps are needed to establish ordering. Run and retain the failing case before implementation.
3. Move creation of a live implementation attempt behind sched.acquire and the admission check, or represent waiting reservations separately so denied admission is never reported as an attempt. Immediately before implementation, recheck integrationBlocked, cancellation/quarantine and effective dependencies; release the slot in finally on every rejection. Apply the same admission predicate to initial, graph-top-up, tracker-top-up, retry and review re-entry paths without breaking stacked parent cancellation.
4. Extend the existing mechanical tracker observation/top-up contract to return the status/type/relationship needed to satisfy external review/blocker/gate dependencies. Keep completed/implDone as authority only for local implementation nodes. Failed/malformed observations hold the affected task with an explicit reason and permit unrelated eligible work.
5. Add a bounded readiness opportunity while chains remain in flight, serialized with existing topUps and limited by the existing topUpQueryCap or a documented finite cadence/budget. It must not await a task completion to observe external release, spin on ready work, leak timers after quiescence, or create an await cycle with the merge lane. Preserve compact results; do not echo tracker bodies.
6. Document the same post-capacity admission and external-status protocol in coordinator-workflow.md/coordinator-subagents.md. Use writing-skills for changed instructions and hand the live ordinary-subagent scenario to the enclosing coordinator. Run replay, inspect both paths' generated contract, and commit the mechanics plus fixtures.

Run:

```bash
node tests/super-code/replay-harness.mjs
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** Queued work is admitted from fresh facts, external closure can release it during an unrelated long task, and failed observations isolate their hold.

## Task 4: Persist recovery obligations and fix history records

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/ledger-digest`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-code/scripts/already-merged`
- `skills/super-auto/run-state.md`

**Bead:** super-plan-ufz.4. **Surface:** 201731 tokens at the integration base.

**Scope:** Durable record/transport contract only. Recovery reconciliation, root acceptance, metrics reconciliation and no-change completion remain separate dependent leaves.

**Interfaces:** Extend the existing progress ledger with compact additive 'Recovery: <JSON>' records: {version:1,id,kind,operation,reason,evidence,data}, where kind is hold|pending-closure|deferred|fix and operation is record|clear. evidence is a nonempty array of source/artifact references for recorded obligations/history; data carries known landing SHA/range, related bead IDs or fix outcome without inventing missing facts. clear names the matching obligation; fix history remains append-only. Retain legacy Task/Merge/Human action lines. Downstream consumers must read the retained history separately from latest terminal task status.

### Acceptance (verbatim)

- [ ] Holds, pending closures, deferred obligations and fix history round-trip through existing durable artifacts/digest with explicit evidence references.
- [ ] Earlier FIXED history remains available after a later clean retry.
- [ ] Record/digest fixtures preserve compatible existing ledger consumers.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add fixtures around ledger-digest plus replay's append/read paths: a hold, landed-but-unclosed task with review/blocker IDs and exact SHA, a caller-owned deferred check, a FIXED record followed by a clean retry, and old-format ledger input. Assert full record round-trip, evidence references, and latest status independently from history. Add malformed/unknown-version behavior that exposes a record gap instead of silently dropping an actionable record.
2. Run the failing digest/record fixture before changing code. Keep the existing digest header count and Task-line compatibility assertions; missing/unreadable/truncation taxonomy is owned by the later metrics leaf, so do not expand that transport policy here.
3. Add narrow encoder/decoder use at existing coordinator state changes (recordPendingClosure/confirmClosure, merge-lane holds, deferred measurement handling and fix-pass results). Append the additive Recovery records through queueLedger/noteLedger; drain records before returning their settled results. Preserve source report/review and commit references even where the elided fallback drops free text. Fix-history records must not be superseded by settle's current terminal bucket.
4. Teach ledger-digest to preserve the recognized compact Recovery lines without truncating their evidence or changing legacy Task reducers. Seed separate recovery/fix-history collections when reading existing records, preserving unknown/uninterpretable records as explicit gaps. Do not implement the later Git/tracker resume reconciliation or close the root from these facts.
5. Document the record fields, ownership and ordinary-subagent emission in the two coordinator references. Include actual examples: a pending-closure record with data {head:<landing SHA>,reviewBead:<ID>}, and a fix record with data {outcome:'FIXED',reviewPath:<artifact>,head:<SHA>}; use real fixture values in tests. Agent protocol field updates should remain short; use writing-skills for changed instructions.
6. Run replay and the direct digest fixtures it includes, check existing consumers still receive their legacy tokens, and commit the contract and producer changes. Report the exact field/operation examples for downstream recovery/metrics planners.

Run:

```bash
node tests/super-code/replay-harness.mjs
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** Existing durable artifacts can retain and transport obligations and all relevant fix attempts without conflating them with latest task completion.

## Task 5: Record source-bound evidence and check outcomes

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/implementer-prompt.md`
- `skills/super-code/task-reviewer-prompt.md`
- `skills/super-code/scripts/dispatch-text.mjs`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/replay-harness.mjs`
- `tests/super-code/test-dispatch-text.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-auto/run-state.md`

**Bead:** super-plan-ufz.5. **Surface:** 214205 tokens at the integration base.

**Scope:** Add source-bound evidence fields and classification. Do not implement no-change task completion (.13), root acceptance (.6), or task/run-baseline attribution (.7) here.

**Interfaces:** Add optional evidence records to existing RESULT/dispatch/report transport: {sourceTree,command,configuration,outcome,location,kind}, where kind is live|simulated|fallback and outcome is pass|fail|unavailable. sourceTree names the tested Git tree or resolvable commit with its tree; command/configuration and location retain concrete provenance. Optional fields preserve old producers, but absence is an evidence gap when a task explicitly requires them. A required live check is discharged only by matching live/pass evidence, never by fallback/simulated success.

### Acceptance (verbatim)

- [ ] Evidence retains tested source tree, command/configuration, outcome and location.
- [ ] Fallback/simulated evidence cannot satisfy an explicitly required live check.
- [ ] Failed and unavailable checks remain distinct.
- [ ] Record/dispatch fixtures pass; coordinator owns representative fresh-agent evidence classification evaluation.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add replay/dispatch fixtures that preserve a complete evidence record from implementer/reviewer response to durable report/result; include live/pass, simulated/pass, fallback/pass, fail and unavailable. Assert fail differs from unavailable and an explicitly required live criterion remains outstanding for simulated/fallback output. Exercise old responses without evidence to confirm existing task routing is unchanged.
2. Run the new fixtures before edits and retain failures. Use the existing oneTaskCanned/RESULT test conventions; no artificial phase or commit should be created merely to test evidence.
3. Extend RESULT and any necessary existing completion/report record to transport the optional evidence array. Keep typed validation and deterministic classification in coordinator.js/dispatch-text; do not ask a model to calculate counts or infer that a fallback equals live. Preserve exact tested tree, command/configuration, outcome and location rather than a single green summary string.
4. Update implementer-prompt and task-reviewer-prompt's evidence/report fields plus their generated parameter contracts, with one concrete complete record and the three kind/outcome vocabularies. Keep semantic judgment of whether the check covers acceptance with the reviewer. Retain current test scope and source/base comparison rules; leave the no-commit INVALID/review-package change to .13.
5. Carry the same additive evidence fields in Workflow and ordinary-subagent protocol references. Use writing-skills for changed instruction text and prepare classification cases for the parent-owned fresh-agent evaluation; baseline control success is not a reason to add generic admonitions.
6. Run the focused suites below, check that existing dispatch clients remain compatible, and commit records/fixtures/field documentation. Report outstanding evaluation coverage separately from code/test status.

Run:

```bash
bash tests/super-code/test-dispatch-text.sh
node tests/super-code/replay-harness.mjs
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** Evidence transport states what tree/check was measured and whether it was live, simulated, fallback, failed or unavailable without changing completion policy.

## Task 6: Correct profiler availability bounds and bottleneck claims

**filesTouched:**
- `skills/super-code/scripts/run-profile.mjs`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-auto/SKILL.md`
- `skills/super-auto/report-prompt.md`
- `tests/super-code/run-profile-fixture.mjs`
- `tests/super-code/run-profile-ordinary-fixture.mjs`
- `tests/super-code/test-run-profile.sh`
- `tests/super-code/test-run-profile-in-flight.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-code/scripts/run-profile`
- `skills/super-auto/run-state.md`

**Bead:** super-plan-ufz.10. **Surface:** 128122 tokens at the integration base.

**Scope:** Correct deterministic profiling facts, labels and settled-invocation generation ownership. Retain the existing profiler and models; historical graph reconstruction is outside scope.

**Interfaces:** Keep createdAt, mappingReadyAt and dependencyReadyAt as separately sourced optional timestamps in per-bead output; readyAt may only claim what is established. Unknown remains null/unknown. Any lower bound for a measured wait or modeled release includes evidenced task creation, mapping availability, invocation boundary and known dependency release. Label observed graph scope and separate overall-agent concurrency from task-slot concurrency. The invoking session generates after each settled invocation; super-auto copies those artifacts and does not claim coordinator.js generated them.

### Acceptance (verbatim)

- [ ] A late-created task is never assigned wait time before its creation; unavailable timestamps remain unknown.
- [ ] Creation, mapping-ready and dependency-ready evidence retain their actual meanings throughout waits and schedule estimates.
- [ ] A planning-dominated timeline does not claim task parallelism alone removes the bottleneck; counterfactuals are labeled estimates.
- [ ] Graph labels describe observed invocation/residual scope without inventing historical topology, and all-agent/task-slot concurrency have separate labels.
- [ ] Profiles are generated after settled invocations by a named owner, then appended and copied without contradictory Finish/caller ownership.
- [ ] Workflow and ordinary-subagent deterministic profiler fixtures pass; the coordinator owns fresh-agent diagnosis checks if instruction behavior changes.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Extend run-profile-fixture.mjs and run-profile-ordinary-fixture.mjs to accept per-bead created_at evidence and unknown creation/readiness without backfilling a guessed timestamp. Add inline scenarios to the existing shell tests: a bead created well after initial planning; a residual tracker graph on resume; unknown creation/dependency timing; long planning with short implementation; and an in-flight snapshot.
2. Assert exact timestamp/wait bounds in JSON and human labels in stdout/Markdown. For a bead created at 600 seconds and dispatched at 660 seconds, supported wait cannot include any time before 600 seconds; when no availability observation establishes readiness, report the unmeasured gap rather than a known historical ready time. Run and retain failing assertions.
3. In run-profile.mjs preserve creation evidence when loading tracker/--beads observations; separate it from planner mapping completion and dependency usability. Apply those semantics to final-attempt waits, carried time and simInput release. Remove unconditional historical-readiness implications from ordinary graph fallback. Existing mapping timestamp still means mapping available, not task creation or proof of every dependency's prior state.
4. Keep planning in the critical-path/whole-run diagnosis and schedule model; explicitly label counterfactuals estimates and their measurement window. If planning dominates, report that fact alongside task bottlenecks rather than letting 'bottleneck bead' imply the whole run was task-dominated. Label graph union as observed invocation/residual graph, and name all-agent versus implementation-slot concurrency separately in JSON and prose.
5. Reconcile coordinator-workflow.md, coordinator-subagents.md, super-auto/SKILL.md and report-prompt.md ownership: the invoking session runs run-profile after a settled Workflow return or ordinary invocation (including qualified/unavailable output), appends stdout once and produces md/json beside ledger; super-auto copies that invocation's artifacts into the committed run directory after collection. Correct SKILL's current claim that Finish writes them; avoid duplicate generation/appending. Do not alter invocation artifact identity or collection contracts owned by .8 children.
6. Use writing-skills for any changed interpretation instructions, preparing planning-dominated and unknown-timestamp scenarios for the coordinator's evaluation. Run both profiler shell suites below and commit the calculations, builders and protocol wording.

Run:

```bash
bash tests/super-code/test-run-profile.sh
bash tests/super-code/test-run-profile-in-flight.sh
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** Profiles report only evidenced availability/waits, include planning in diagnosis, label estimates/graph/concurrency correctly and have one coherent generation owner.

## Task 7: Normalize recurring process classes without merging defects

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/ledger-digest`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/task-reviewer-prompt.md`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`

**Bead:** super-plan-ufz.11. **Surface:** 195977 tokens at the integration base.

**Scope:** Small deterministic aliases for recurring process classes; preserve original defect identity and provenance. Do not introduce a finding database or broaden product-failure pooling.

**Interfaces:** Extend existing classTag/recurrenceSig/seedRecurrence/noteRecurrence handling with a narrow explicit alias map for process failures, such as cleanup denied/cleanup inspection denied -> cleanup-inspection, evidence missing/test evidence missing -> missing-evidence. Canonical grouping does not alter each finding text, source/task ID, severity or disposition. Unknown classes/free text preserve their own identity; all test failures must never normalize to one catch-all class.

### Acceptance (verbatim)

- [ ] Equivalent process tags group under a common class while original text/provenance remains available.
- [ ] Unrelated defects and unrelated test failures remain distinct rather than forming one catch-all recurrence class.
- [ ] Recurrence supports reassessment but does not itself merge findings, escalate severity or enlarge scope.
- [ ] Alias/provenance/negative-case fixtures pass; the coordinator owns representative fresh-agent semantic tagging evaluation.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add replay/digest fixtures for two accepted aliases of one process class, distinct original text/task/source references, an unknown tag, two unrelated product bugs, and unrelated failing tests. Assert aliases share recurrence counts after resume while each original record survives; negatives must remain separate. Assert a threshold crossing emits a grouped observation without merging, escalating or creating fix scope.
2. Run the failing scenarios before implementation. Avoid broad normalization designed to make arbitrary examples merge; the acceptance asks for a small explicit common vocabulary.
3. Add the narrow canonical alias lookup adjacent to classTag/recurrenceSig; use the same lookup for live and seedRecurrence reconstruction. Keep existing records' raw class/text available, with canonical class as an additional grouping fact. Do not use numeric/path erasure to equate semantically unrelated product/test defects; use existing free-text behavior only where it does not pool such negatives.
4. Extend the compact digest's recurrence transport only enough to retain raw tag plus source/task provenance alongside canonical grouping when needed. Keep original ledger/report text authoritative. This can coexist with Task 4's Recovery records without consuming its new schema or requiring an execution dependency.
5. Update task-reviewer and coordinator reference protocol with the small allowed process-class vocabulary and alias examples. State recurrence is evidence for reassessment; disposition/severity/scope are separate decisions. Remove any existing recurrence auto-conclusion that forces a shared defect solely from counts, rather than adding repeated generic warnings. Use writing-skills and prepare the semantic alias/negative cases for the enclosing coordinator.
6. Run replay including digest reconstruction and commit the deterministic normalization, fixtures and short protocol reference.

Run:

```bash
node tests/super-code/replay-harness.mjs
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** Equivalent process-class aliases group consistently across resume while defects and original evidence remain separate.

## Task 8: Preserve distinct invocation review artifacts

**filesTouched:**
- `skills/super-code/SKILL.md`
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/scripts/dispatch-text.mjs`
- `tests/super-code/test-dispatch-text.sh`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`

**Bead:** super-plan-ufz.8.1. **Surface:** 215574 tokens at the integration base.

**Scope:** Invocation identity and artifact bundle production only. Extraction, outstanding-finding projection and super-auto collection are separate .8 children.

**Interfaces:** runTag remains the enclosing run. Add invocationId to the existing launch record and args/ordinary dispatch contract; persist it before any review output. A resumed unsettled invocation reuses its recorded identity; a newly settled invocation followed by another invocation receives a new one. Use invocationId in single, cluster, seam, stub and assembled final-review paths. reviewPath still points to this invocation's final review only when one was written, else null.

### Acceptance (verbatim)

- [ ] Two invocations sharing runTag retain distinct artifact bundles including split reviews.
- [ ] Invocation identity is persisted before review creation and replayed on resume.
- [ ] reviewPath and null retain existing meanings; both execution paths pass focused fixtures.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add replay and dispatch-text fixtures for two fresh invocations sharing runTag but using distinct invocationId values. Assert disjoint final-review, cluster, seam/stub and assembler directories, then assert a resumed invocation reuses its identity. Cover no-landed-work/null reviewPath, failed writer/null reviewPath, written stub and split review outcomes.
2. Run the failing fixtures before edits. Test artifact retention by writing two small synthetic bundles to distinct paths and checking the earlier contents remain unchanged; do not rely only on string assertions for overwrite protection.
3. Extend coordinator.js resolved args/Launch: args and ordinary launch protocol to require or mint a fresh per-invocation token at the caller boundary. Persist launch identity and wait for confirmed persistence before dispatching review/artifact creation; an unavailable identity write is an explicit gap and cannot authorize overwriting a prior bundle. Reuse only an explicitly resumed launch identity, never the last settled identity solely because runTag matches.
4. Replace final-review and assembled-final paths derived only from runTag with the persisted invocationId across single/cluster/seam/stub branches and dispatch-text.mjs. Validate filesystem-safe tokens and keep all artifacts inside the existing plan workspace. Do not reinterpret result.reviewPath or manufacture a review when no work landed.
5. Document token mint/resume ownership and new dispatch fields in super-code/SKILL.md and both execution references. Follow the nested spec's source identity contract. Do not add super-auto collection/projection edits or an external roast ledger here; a downstream consumer can archive the immutable bundle under its original identity.
6. Use writing-skills for operative protocol changes, run replay/dispatch tests below, and commit the artifact identity contract plus overwrite/resume fixtures. Report exact path pattern and launch field to the following .8 planner.

Run:

```bash
bash tests/super-code/test-dispatch-text.sh
node tests/super-code/replay-harness.mjs
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** Repeated invocations retain independent immutable review bundles, resume uses the original identity, and reviewPath/null behavior remains compatible.

## Task 9: Extract complete source finding occurrences

**filesTouched:**
- `skills/super-code/scripts/report-verdict`
- `tests/super-code/test-report-verdict.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `skills/super-roast/reporter-prompt.md`
- `tests/super-code/fixtures/report-verdict/final-review-real.md`
- `tests/super-code/fixtures/report-verdict/roast-report.md`

**Bead:** super-plan-ufz.8.2. **Surface:** 17681 tokens at the integration base.

**Scope:** Complete additive finding occurrence extraction only; no storage, semantic matching, disposition, scope routing or external roast-ledger ownership.

**Interfaces:** Add report-verdict --complete --source <immutable-source-id> FILE emitting JSON {version:1,source,artifact,kind,verdict,occurrences:[{section,position,key,text}]}. source is caller-supplied immutable identity, artifact preserves caller path, position is deterministic section-local occurrence position and text is original uncapped finding text (including continuations). Existing default and --keys output/exit semantics stay byte-compatible. Complete mode rejects missing/unreadable/unrecognized or malformed source as an explicit nonzero error, never an empty clean result.

### Acceptance (verbatim)

- [ ] Complete additive extraction includes all relevant finding sections including deferred items and preserves occurrence/source references and original text.
- [ ] Existing default and --keys outputs retain their semantics.
- [ ] Repeated parsing of the same source retains stable occurrences; malformed/missing source is explicit, not an empty clean review.
- [ ] Focused extraction fixtures pass.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Extend test-report-verdict.sh with temporary report fixtures containing Must fix, Untested scope, Deferred OK, all roast Confirmed finding severities and deferred findings, repeated identical lines, nested continuations, unicode, quoted status text, and a valid explicitly empty review. Call complete mode twice with the same immutable source and compare occurrence identities/text; archive-path changes must preserve source/section/position identity rather than treating the copy as a new occurrence.
2. Keep all existing default and --keys fixture assertions. Add missing --source, missing/unreadable file, unknown format and malformed recognized review cases; assert they cannot return successful empty occurrences. Run the failing suite before editing the helper.
3. Extend argument parsing additively, using the existing recognition priority (an exact Verdict heading still wins over quoted task Status). Enumerate every relevant finding section, including deferred and untested entries, without default mode's caps, severity filters or truncation. Preserve raw key/text and section/position for duplicates instead of deduping by wording. Source validation establishes a supplied reference, not semantic matching or trust in a disposition.
4. Emit correctly escaped JSON from complete mode, using repository-available tooling without adding dependencies; reject missing required source fields explicitly. Leave default/--keys parser branches untouched unless sharing a proven compatible recognizer. A valid empty review is empty only with a recognized valid verdict/format and source; unknown/malformed is not clean.
5. Run the shell suite below and compare legacy output byte-for-byte for existing fixtures. Commit the extractor and tests. Report the exact CLI/JSON schema for the downstream .8.4 projection task; no fresh-agent judgment eval is needed for a deterministic extraction-only change.

Run:

```bash
bash tests/super-code/test-report-verdict.sh
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** The helper can return every source finding occurrence with stable provenance, including deferred entries, while current coordinator summary/key consumers retain their behavior.



## Mapping (continued)

| N | Bead | Task | Files touched | Files to read | Surface tokens | Dependency facts |
|---|---|---|---|---|---|---|
| 10 | super-plan-ufz.7 | Retain run-regression ownership after task exoneration | `skills/super-code/coordinator.js`, `skills/super-code/task-reviewer-prompt.md`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `skills/super-auto/SKILL.md`, `skills/super-auto/run-state.md`, `skills/super-auto/report-prompt.md`, `tests/super-code/replay-harness.mjs`, `tests/super-auto/test-scripts.sh`, `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`, `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt`, `tests/super-auto/test-contract-lint.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `skills/super-code/implementer-prompt.md`, `skills/super-code/scripts/ledger-digest`, `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`, `tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt` | 230486 | deps: ["super-plan-ufz.4", "super-plan-ufz.5"]; opaque: false |
| 11 | super-plan-ufz.12 | Reconcile persisted recovery facts before resumed admission | `skills/super-code/coordinator.js`, `skills/super-code/scripts/ledger-digest`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `tests/super-code/replay-harness.mjs` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `skills/super-code/scripts/already-merged`, `skills/super-code/scripts/review-bead`, `skills/super-code/scripts/tree-deps` | 197779 | deps: ["super-plan-ufz.4"]; opaque: false |
| 12 | super-plan-ufz.13 | Complete reviewed verification-only tasks without artificial commits | `skills/super-code/coordinator.js`, `skills/super-code/implementer-prompt.md`, `skills/super-code/task-reviewer-prompt.md`, `skills/super-code/scripts/dispatch-text.mjs`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `tests/super-code/replay-harness.mjs`, `tests/super-code/test-dispatch-text.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `skills/subagent-driven-development/scripts/review-package`, `skills/super-auto/run-state.md` | 214852 | deps: ["super-plan-ufz.5"]; opaque: false |
| 13 | super-plan-ufz.8.4 | Project outstanding findings and supported dispositions | `skills/super-auto/run-state.md`, `skills/super-auto/scripts/scope-dispositions`, `tests/super-auto/test-scripts.sh`, `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`, `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt`, `tests/super-auto/test-contract-lint.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `skills/super-code/scripts/report-verdict`, `skills/super-code/coordinator.js`, `tests/super-code/test-report-verdict.sh`, `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`, `tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt` | 84306 | deps: ["super-plan-ufz.8.1", "super-plan-ufz.8.2"]; opaque: false |
| 14 | super-plan-ufz.8.3 | Carry findings through collection resume and reports | `skills/super-auto/SKILL.md`, `skills/super-auto/resume.md`, `skills/super-auto/report-prompt.md`, `skills/super-auto/scripts/report-status`, `skills/super-auto/run-state.md`, `tests/super-auto/test-scripts.sh`, `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`, `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt`, `tests/super-auto/test-contract-lint.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `skills/super-auto/scripts/scope-dispositions`, `skills/super-code/scripts/report-verdict`, `skills/super-code/coordinator.js`, `skills/super-code/scripts/run-profile`, `skills/super-auto/scripts/step-back-check`, `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`, `tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt` | 103681 | deps: ["super-plan-ufz.8.4"]; opaque: false |
| 15 | super-plan-ufz.9 | Report deterministic reconciled metrics with evidence gaps | `skills/super-code/coordinator.js`, `skills/super-code/scripts/ledger-digest`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `skills/super-auto/SKILL.md`, `skills/super-auto/run-state.md`, `skills/super-auto/report-prompt.md`, `skills/upstream-feedback/SKILL.md`, `tests/super-code/replay-harness.mjs`, `tests/super-auto/test-scripts.sh`, `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`, `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt`, `tests/super-auto/test-contract-lint.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `skills/super-auto/scripts/scope-dispositions`, `skills/super-code/scripts/already-merged`, `skills/super-code/scripts/report-verdict`, `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`, `tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt` | 232788 | deps: ["super-plan-ufz.8.4", "super-plan-ufz.4"]; opaque: false |
| 16 | super-plan-ufz.6 | Keep super-auto root acceptance caller-owned | `skills/super-auto/SKILL.md`, `skills/super-auto/run-state.md`, `skills/super-auto/resume.md`, `skills/super-auto/scripts/report-status`, `skills/super-code/scripts/close-in-tree-epics`, `skills/super-code/coordinator.js`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `tests/super-code/replay-harness.mjs`, `tests/super-auto/test-scripts.sh`, `tests/super-auto/test-contract-lint.sh`, `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`, `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `skills/super-auto/report-prompt.md`, `skills/super-auto/scripts/scope-dispositions`, `skills/super-code/SKILL.md`, `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`, `tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt` | 242801 | deps: ["super-plan-ufz.8.3", "super-plan-ufz.5", "super-plan-ufz.4"]; opaque: false |
| 17 | super-plan-ufz.14 | Integration sweep: workflow reliability | `tests/super-code/replay-harness.mjs`, `tests/super-auto/test-scripts.sh`, `tests/super-auto/test-contract-lint.sh`, `tests/super-code/test-dispatch-text.sh`, `tests/super-code/test-report-verdict.sh`, `docs/superpowers/runs/2026-10-16-workflow-reliability/verification.md` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `skills/super-code/coordinator.js`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `skills/super-code/scripts/stop-run-processes`, `skills/super-code/scripts/remove-task-worktree`, `skills/super-code/scripts/ledger-digest`, `skills/super-code/scripts/close-in-tree-epics`, `skills/super-code/scripts/run-profile.mjs`, `skills/super-auto/SKILL.md`, `skills/super-auto/run-state.md`, `skills/super-auto/resume.md`, `skills/super-auto/report-prompt.md`, `skills/super-auto/scripts/report-status`, `skills/super-auto/scripts/scope-dispositions`, `skills/super-roast/scripts/assemble-args.mjs`, `skills/upstream-feedback/SKILL.md`, `AGENTS.md` | 286107 | deps: ["super-plan-ufz.4", "super-plan-ufz.8.3", "super-plan-ufz.7", "super-plan-ufz.13", "super-plan-ufz.12", "super-plan-ufz.2", "super-plan-ufz.10", "super-plan-ufz.9", "super-plan-ufz.3", "super-plan-ufz.6", "super-plan-ufz.5", "super-plan-ufz.8.2", "super-plan-ufz.1", "super-plan-ufz.11", "super-plan-ufz.8.4", "super-plan-ufz.8.1"]; opaque: false |

These remaining leaves use the same integration base 560a05eb83cdc44013ea528e99854151c2f17d12. Broad surfaces reflect existing large coordinator/replay/reference files, not permission to refactor them. The downstream tasks must read the landed predecessor contracts; the interface bounds below do not create alternate producer schemas. Each section is independently dispatchable. All fresh-agent behavior evaluations remain owned by the enclosing coordinator.

## Task 10: Retain run-regression ownership after task exoneration

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/task-reviewer-prompt.md`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-auto/SKILL.md`
- `skills/super-auto/run-state.md`
- `skills/super-auto/report-prompt.md`
- `tests/super-code/replay-harness.mjs`
- `tests/super-auto/test-scripts.sh`
- `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt`
- `tests/super-auto/test-contract-lint.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-code/implementer-prompt.md`
- `skills/super-code/scripts/ledger-digest`
- `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt`

**Bead:** super-plan-ufz.7. **Surface:** 230486 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Keep task-local exoneration separate from the run-level owner of the same recorded failure; do not create a compulsory new baseline phase or claim missing historical measurements.

**Interfaces:** Consume the actual Recovery/fix-history records delivered by .4 and evidence array delivered by .5. Correlate failures using concrete test/command/source references; uncertain correspondence stays a gap. Preserve the task base, evidenced run-start baseline, introducing-task ownership, and later verification as separate facts in existing run records. No second evidence schema.

### Acceptance (verbatim)

- [ ] Task B can prove a failure predates its own base without erasing task A ownership for the failure introduced earlier in this run (needs: super-plan-ufz.4, super-plan-ufz.5).
- [ ] A failure known to predate the run remains distinguishable from a run-introduced failure.
- [ ] Absent baseline evidence is reported as an attribution gap instead of invented success or exoneration.
- [ ] Deterministic attribution fixtures pass; the coordinator owns representative fresh-agent task-base versus run-baseline evaluation.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add failing replay/caller fixtures for three cases using source-bound command outcomes: run-start passes then task A introduces failure F and task B has F at its own base; F already fails at evidenced run-start; and no usable run-start measurement. The first case must retain A as run owner even when B's reviewer correctly exonerates B; the second must label pre-run failure; the third must show an attribution gap. Include same display text with a different command/configuration to prevent an unsupported merge of evidence.
2. Run `node tests/super-code/replay-harness.mjs` and the new attribution section of `bash tests/super-auto/test-scripts.sh`; retain the failing assertions. Reuse existing live-sim run/canned-answer functions and temporary run.md fixtures, with .4/.5's landed record examples. A simulated replay establishes mechanics only.
3. In taskReviewPrompt/review handling and task-reviewer-prompt.md, preserve the task-local comparison result and evidence pointer without treating it as a run-level resolution. In the existing coordinator record/result path, retain the earlier introducing-task owner until supported fix verification or an evidenced pre-run classification changes it. If source/command association or baseline evidence is absent, preserve known ownership and report the missing attribution evidence rather than guessing success.
4. In super-auto's code/sweep-fix handling and run-state, retain the same failure/owner references across re-entry, later clean attempts and bucket replacement. Update report-prompt Remaining to identify the run-owned regression or explicit attribution gap, independent of a later task's exoneration. Do not force unrelated evidenced pre-run failures into the goal's fix scope or add new retry rounds.
5. Update both execution references and operative skill/reviewer instructions using writing-skills. Supply the A/B and absent-baseline fixture artifacts plus a concrete behavior scenario to the enclosing coordinator; it owns fresh-agent evaluation. Run the named suites, inspect rendered dispatch/current records for lost ownership, and commit the task implementation and fixtures.

**Contract fixture upkeep:** Preserve both historical 2bf1d53 fixture files byte-for-byte. If the task adds run-state fields/formats, represent them in Field table/worked example and record their exact current additions in the declared run-state-added-fields.txt/run-state-added-formats.txt fixtures. Extend test-contract-lint.sh to validate the union of unchanged historical expectations and these explicit approved additions; keep rejection of dropped legacy fields, changed legacy formats and unapproved extra fields, with mutation coverage. Reuse this same additive-fixture contract when a predecessor has installed it; no top-level field is needed where an existing record holds the fact. These small current-contract goldens are tests, not a second runtime schema.

Run:

```bash
node tests/super-code/replay-harness.mjs
bash tests/super-auto/test-scripts.sh
bash tests/super-auto/test-contract-lint.sh
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** A task can be exonerated against its own base while evidenced run-introduced failures retain an owner, and absent baseline evidence remains explicit.

## Task 11: Reconcile persisted recovery facts before resumed admission

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/ledger-digest`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-code/scripts/already-merged`
- `skills/super-code/scripts/review-bead`
- `skills/super-code/scripts/tree-deps`

**Bead:** super-plan-ufz.12. **Surface:** 197779 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Resume behavior only: reconcile existing durable facts before affected admission. The .4 producer owns record encoding and digest round-trip; .3 owns ordinary fresh admission and external readiness.

**Interfaces:** Read the actual additive recovery records/digest delivered by .4. Reuse existing landed/landedRanges, pendingRetry, holds and closure associations plus already-merged and authoritative tracker status. Terminal task completion, valid Git landing and review/blocker closure remain separate observations; failed queries retain the affected hold with a reason. Do not add a replacement journal.

### Acceptance (verbatim)

- [ ] Restart after valid landing but before tracker closure reconciles without repeating implementation (needs: super-plan-ufz.4).
- [ ] Persisted holds and deferred obligations constrain resumed affected work; Git/tracker disagreement remains explicit (needs: super-plan-ufz.4).
- [ ] Deterministic partial-close, hold and mismatch fixtures pass; coordinator owns fresh-agent resume evaluation.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Extend the existing landed-but-unclosed replay scenarios with .4's real records: valid landed SHA + open task/review/blocker; fully closed tracker + verified landing; persisted hold/deferred check + otherwise ready task; ledger says landed but Git does not; and denied tracker/Git lookup. Assert the valid landing causes no implement/review/merge re-dispatch, only required closure; unrelated work remains eligible while an affected unresolved record is held.
2. Run `node tests/super-code/replay-harness.mjs` with the added scenarios before editing resume handling and retain the failures. Reuse the existing run/oneTaskCanned functions, temporary ledger fixtures, read-ledger answers, landed evidence and close-check trace assertions. Add a second resume from the resulting closure records to prove idempotence.
3. In Resume, decode .4's records, obtain the existing authoritative Git landed evidence and tracker task/review/blocker observations, and reconcile them before the affected mapping row can reach implementation dispatch. Seed already-landed work from verified original SHA/range rather than reimplementing. Route pending tracker closure through existing closeAlreadyMerged/reconciliation machinery; close only observed-open associated beads and preserve script/lookup failures as unknown facts.
4. Restore persisted holds and deferred obligations before admission. Keep record evidence and current observation together when they disagree; do not erase an obligation on silence, lack of a task branch, or the last clean Task line. Preserve per-record gaps while unrelated rows progress. Drain the confirmed closure/updated obligation records through .4's existing append path before considering the recovery settled.
5. Change ledger-digest only if the landed .4 fields needed for reconciliation are being lost, preserving old digest consumers. Align Workflow and ordinary resume instructions with the same ordering and bounded lookups, using writing-skills for operative changes. Prepare interruption/hold scenarios for parent-owned fresh-agent evaluation, run replay, and commit the resume behavior and fixtures.



Run:

```bash
node tests/super-code/replay-harness.mjs
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** A restart reconciles valid landed work, pending closures and holds before affected dispatch, preserving mismatches without duplicate implementation.

## Task 12: Complete reviewed verification-only tasks without artificial commits

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/implementer-prompt.md`
- `skills/super-code/task-reviewer-prompt.md`
- `skills/super-code/scripts/dispatch-text.mjs`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/replay-harness.mjs`
- `tests/super-code/test-dispatch-text.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/subagent-driven-development/scripts/review-package`
- `skills/super-auto/run-state.md`

**Bead:** super-plan-ufz.13. **Surface:** 214852 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Allow acceptance-supported verification-only completion with unchanged HEAD, while retaining all implementation-task delivery and invalid-review protections.

**Interfaces:** Consume the exact source-bound evidence transport from .5. Make the verification-only intent explicit in the existing task outcome and dispatch inputs; a reviewer must confirm that intent against the bead acceptance, matching source tree and required check kind. Add only the minimal additive discriminator/result routing needed. Use a distinct evidence-review path before the nonempty-diff package guard; preserve review-package guards for implementation reviews and do not weaken them globally.

### Acceptance (verbatim)

- [ ] Verification-only unchanged-HEAD task completes on reviewed acceptance evidence, without an artificial commit (needs: super-plan-ufz.5).
- [ ] An implementation task still requires delivered-change evidence.
- [ ] Outcome fixtures pass; coordinator owns representative fresh-agent no-change evaluation.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add failing live-sim cases for an explicitly verification-only bead with unchanged base/head and complete live/pass evidence accepted by a reviewer; the same outcome rejected for an implementation bead; missing/stale/fallback evidence for a required live check; and null/INVALID review. Assert a successful verification case dispatches review and closure, completes with no merge or ensure-commit dispatch, and writes durable evidence-backed completion without incrementing task landings. Retain the existing empty-range implementation INVALID and missing-commit tests.
2. Add ordinary dispatch fixtures carrying the same verification intent and evidence references through implement and review. Run `bash tests/super-code/test-dispatch-text.sh` and `node tests/super-code/replay-harness.mjs` before implementation. Use the actual additive .5 evidence fields; source tree and reviewer coverage are checked, never inferred from an unchanged branch alone.
3. Extend the existing RESULT/report contract minimally for an explicit verification-only outcome. Verify the declared task acceptance permits no-change verification. In the unchanged-head routing, send that outcome to evidence review instead of ensure-commit or nonempty-diff packaging; implementation outcomes keep their current commit recovery and invalid-package protections. The alternate review reads the bead/brief, fixed source identity and evidence and emits the existing review verdict with the evidence basis; no tests are rerun by the reviewer.
4. On accepted verification, use existing tracker status/closure confirmation, ledger/result completion and cleanup paths without a synthetic Git merge or commit. Preserve unavailable closure/cleanup results as their actual facts; retain review identity/evidence in durable completion so resume reuses the verified work. Rejected or absent review cannot count complete. Keep terminal buckets and fixed/regression history compatible with .4/.5 consumers.
5. Update implementer/reviewer templates and both execution references, plus dispatch-text plumbing only where it transports this discriminator/evidence. Keep review-package read-only for this task by choosing the evidence-review branch before calling it. Use writing-skills, prepare the no-change/implementation contrast for parent-owned behavior evaluation, run both named suites, and commit.



Run:

```bash
bash tests/super-code/test-dispatch-text.sh
node tests/super-code/replay-harness.mjs
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** Verification-only no-change tasks complete only after acceptance review of source-bound evidence, while implementation tasks still require delivered change.

## Task 13: Project outstanding findings and supported dispositions

**filesTouched:**
- `skills/super-auto/run-state.md`
- `skills/super-auto/scripts/scope-dispositions`
- `tests/super-auto/test-scripts.sh`
- `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt`
- `tests/super-auto/test-contract-lint.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `skills/super-code/scripts/report-verdict`
- `skills/super-code/coordinator.js`
- `tests/super-code/test-report-verdict.sh`
- `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt`

**Bead:** super-plan-ufz.8.4. **Surface:** 84306 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Own the durable finding/disposition extension and its deterministic outstanding projection. Collection, caller routing and status consumers belong to .8.3; roast redesign/ledger policy remains external.

**Interfaces:** Consume the immutable invocation/artifact identity actually delivered by .8.1 and report-verdict complete occurrence output delivered by .8.2. Existing planned extractor interface is --complete --source <immutable-source-id> FILE; inspect its landed output before coding rather than introducing an alternate extractor schema. Extend run-state with the smallest additive occurrence/link/disposition records and scope-dispositions with additive projection and key-only modes. This task owns and documents the resulting CLI/record contract for .8.3 and .9. Helpers validate source references and required basis fields; the agent judges semantic support.

### Acceptance (verbatim)

- [ ] Explicit references link occurrences; ambiguous matches stay separate.
- [ ] Supported resolution/rejection explicitly references findings and basis; assignment/success/silence do not resolve.
- [ ] Missing or unsupported external input leaves known evidence open.
- [ ] Key-only punch-list output contains only outstanding deferred findings and excludes findings with supported resolved or rejected dispositions, including verified fixes supplied elsewhere.
- [ ] Projection/record validation fixtures pass; source identity and extraction consumed from predecessors (needs: super-plan-ufz.8.1, super-plan-ufz.8.2).

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add failing scope-dispositions projection fixtures in test-scripts.sh using complete extraction from the landed .8.2 helper and .8.1 immutable invocation IDs. Include duplicate-looking occurrences from two sources, an explicit cross-source link, ambiguous wording without a link, an unresolved deferral, assignment/closed-fix/success-only/silent retry, supported fix verification supplied by another task, and supported rejection with basis. Assert only explicit links combine occurrences, raw source text/positions survive, and known obligations remain open for unsupported inputs.
2. Run `bash tests/super-auto/test-scripts.sh` before modifying the helper. Keep every existing --round/--findings/--filter/--step-back output/exit assertion byte-compatible. Add malformed/absent external projection, unknown finding reference, missing evidence/basis, malformed record and unavailable source cases; none may delete a previously known open occurrence. Include source keys with commas/Unicode and archive copies with original source identity.
3. Define the smallest additive record lines in run-state.md for source/occurrence pointer, explicit link, owner/fix reference, deferral and supported disposition/basis. Reuse predecessor source/section/position identities and existing run record conventions. Allow assignment, deferral and verification to coexist; no mandatory state chain. Document that helpers check referential structure while the owning agent records its semantic support judgment and evidence. Unsupported semantic claims cannot become resolutions merely because they include a nonempty evidence field.
4. Add an explicit projection mode to scope-dispositions that reads those records and retained local source extractions, validates source/occurrence references and disposition basis, and returns outstanding/deferred rows plus explicit gaps. Preserve local evidence when an external projection is absent, malformed, unsupported or incomplete. Only validated explicit linking combines identities; keep uncertain matches separate. Archive copies must not duplicate occurrences; unsupported resolution/rejection remains outstanding with its gap.
5. Add a key-only output mode derived from that same validated projection. Include only outstanding deferred findings, excluding supported resolved/rejected findings, including fixes verified elsewhere. A bare successful task, assignment or missing latest mention stays open. Deterministically dedupe the printed keys only for legacy transport while preserving all distinct underlying occurrences. Add exact output assertions for open deferred A, verified-fixed deferred B, rejected deferred C and active nondeferred D: keys contain A only.
6. Document actual CLI flags, record examples, supported disposition validation, exit/gap behavior and no-jq fallback in run-state.md; downstream .8.3/.9 must consume this contract. Use writing-skills for operative record instructions, run the named suite plus contract lint, and commit records/helper/fixtures. Return exact producer examples; do not build artifact collection or a competing roast ledger.

**Contract fixture upkeep:** Preserve both historical 2bf1d53 fixture files byte-for-byte. If the task adds run-state fields/formats, represent them in Field table/worked example and record their exact current additions in the declared run-state-added-fields.txt/run-state-added-formats.txt fixtures. Extend test-contract-lint.sh to validate the union of unchanged historical expectations and these explicit approved additions; keep rejection of dropped legacy fields, changed legacy formats and unapproved extra fields, with mutation coverage. Reuse this same additive-fixture contract when a predecessor has installed it; no top-level field is needed where an existing record holds the fact. These small current-contract goldens are tests, not a second runtime schema.

Run:

```bash
bash tests/super-auto/test-scripts.sh
bash tests/super-auto/test-contract-lint.sh
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** One validated projection retains source occurrences and supported dispositions and generates keys only for outstanding deferred findings.

## Task 14: Carry findings through collection resume and reports

**filesTouched:**
- `skills/super-auto/SKILL.md`
- `skills/super-auto/resume.md`
- `skills/super-auto/report-prompt.md`
- `skills/super-auto/scripts/report-status`
- `skills/super-auto/run-state.md`
- `tests/super-auto/test-scripts.sh`
- `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt`
- `tests/super-auto/test-contract-lint.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `skills/super-auto/scripts/scope-dispositions`
- `skills/super-code/scripts/report-verdict`
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/run-profile`
- `skills/super-auto/scripts/step-back-check`
- `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt`

**Bead:** super-plan-ufz.8.3. **Surface:** 103681 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Collect immutable settled invocation bundles and route every caller view through the predecessor projection. Preserve latest review separately from accumulated obligations.

**Interfaces:** Use the exact immutable bundle/launch identity from .8.1, complete extraction from .8.2, and projection CLI/run records from .8.4. Their dependencies are already transitive through .8.4. Reuse the settled profile/friction collection boundary and existing committed run directory; record original source identities plus archive pointers without changing occurrence identity. Do not prescribe new producer field names or change result.reviewPath/null meaning.

### Acceptance (verbatim)

- [ ] Blocked review followed by ready/silent retry preserves prior actionable findings.
- [ ] Collection resumes idempotently before later invocation or cleanup; missing bundle is an evidence gap.
- [ ] Resume, Remaining and status use the same outstanding projection.
- [ ] Latest ready review cannot conceal earlier unresolved findings.
- [ ] Coordinator runs representative fresh-agent behavior evaluation; producer/consumer fixtures pass.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Extend temporary run/producer-consumer fixtures in test-scripts.sh using the actual .8.4 projection CLI: invocation I1 has a blocked review with finding F, I2 is ready/silent, then collection is interrupted after copying an artifact but before recording completion. Resume twice and assert unchanged archive bytes, one occurrence per original source/section/position, retained F, retained supported dispositions, and latest review I2 still separately ready. Include split review bundles and null reviewPath behavior, distinguishing no-work-landed from missing required review.
2. Add missing/incomplete bundle and conflicting destination cases: known findings remain open, the evidence gap is durable and visible, and no later invocation or cleanup is authorized to erase the only recoverable source. Use temp directories for the boundary fixtures; no live run artifacts or tracker mutations. Run `bash tests/super-auto/test-scripts.sh` before editing consumers and retain failures.
3. Update super-auto's existing settled profile/friction collection boundary to archive the complete immutable review bundle and original invocation/source pointers inside the committed run directory before proceeding. Reuse predecessor identity/path patterns. Record collection intent and completion in existing run records so a restart can discover settled-but-uncollected bundles; copying the same source is idempotent and an existing different destination is a gap, never overwritten. Keep source artifacts until preservation is confirmed.
4. In resume.md, reconcile pending collections before starting a later super-code invocation or cleanup. Extract source occurrences with report-verdict complete mode and invoke the predecessor projection; do not reconstruct history from the last codeBuckets.review or parse a historical union of punch-list keys. Keep missing source evidence and outstanding findings in the projection when collection cannot finish, with an explicit owner/recovery reason.
5. Route Final-review items, phase-5/post-cap punch-list input, report Remaining and report-status qualifiers through the same validated outstanding projection/key-only output. The latest verdict remains descriptive of its own invocation. A later ready review cannot erase prior findings, while a supported resolved/rejected deferred item leaves every derived punch-list view. A passing sweep clears only the measured obligation it supports; do not blanket-clear code findings.
6. Update run-state's collection/consumer examples and short operative instructions using writing-skills. Preserve legacy status forms and exact report-status outputs where the new outstanding data is absent; malformed/gapped new input cannot be treated as empty. Run script tests and contract lint, prepare the interrupted/ready-retry scenario for coordinator-owned fresh-agent evaluation, and commit the consumer/collection changes.

**Contract fixture upkeep:** Preserve both historical 2bf1d53 fixture files byte-for-byte. If the task adds run-state fields/formats, represent them in Field table/worked example and record their exact current additions in the declared run-state-added-fields.txt/run-state-added-formats.txt fixtures. Extend test-contract-lint.sh to validate the union of unchanged historical expectations and these explicit approved additions; keep rejection of dropped legacy fields, changed legacy formats and unapproved extra fields, with mutation coverage. Reuse this same additive-fixture contract when a predecessor has installed it; no top-level field is needed where an existing record holds the fact. These small current-contract goldens are tests, not a second runtime schema. Update test-contract-lint.sh only where its current report-verdict --keys-only consumer rule conflicts with the new complete-extraction/projection path: replace it with an assertion of the landed producer/consumer contract and retain the null-reviewPath safety mutations.

Run:

```bash
bash tests/super-auto/test-scripts.sh
bash tests/super-auto/test-contract-lint.sh
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** Settled review bundles survive collection interruption and every caller view preserves accumulated outstanding findings independently of the latest verdict.

## Task 15: Report deterministic reconciled metrics with evidence gaps

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/ledger-digest`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-auto/SKILL.md`
- `skills/super-auto/run-state.md`
- `skills/super-auto/report-prompt.md`
- `skills/upstream-feedback/SKILL.md`
- `tests/super-code/replay-harness.mjs`
- `tests/super-auto/test-scripts.sh`
- `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt`
- `tests/super-auto/test-contract-lint.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-auto/scripts/scope-dispositions`
- `skills/super-code/scripts/already-merged`
- `skills/super-code/scripts/report-verdict`
- `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt`

**Bead:** super-plan-ufz.9. **Surface:** 232788 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Validate transport and derive deterministic counts after available Git/tracker reconciliation. Keep established Metrics consumers compatible and report supported partial observations when evidence is incomplete.

**Interfaces:** Consume the actual .4 recovery/fix history and .8.4 supported-disposition projection. Extend existing readLedger/digest and Metrics output with transport status and explicit discrepancy identities as needed, while preserving compact output. Keep latest per-task outcome separate from all supported history; only an explicit supported disposition can contribute to a repaired-finding total. Do not count base absorption as a task landing or normal execution metadata as friction.

### Acceptance (verbatim)

- [ ] An unexplained empty transport after known ledger appends is unavailable evidence, distinct from a valid-empty or fresh-missing ledger.
- [ ] Missing/unreadable/truncated inputs yield qualified supported partial results instead of invented final totals.
- [ ] Finish reconciliation is reflected in reported totals and actual discrepant task IDs are shown before causes are proposed (needs: super-plan-ufz.4).
- [ ] A clean latest attempt retains earlier repaired history; deferred/rejected items are not counted as repaired (needs: super-plan-ufz.4, super-plan-ufz.8.4).
- [ ] Base-absorption merges do not inflate task-landings, and ordinary Workflow selection metadata does not inflate friction events.
- [ ] Deterministic producer/consumer fixtures pass; the coordinator owns representative fresh-agent report interpretation evaluation.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add failing ledger-digest/replay fixtures distinguishing a genuinely fresh missing ledger, valid empty digest, unreadable ledger, malformed/missing counting header, truncated echo, and an empty echo after confirmed appends. Use inert command mocks for permission errors so no permission workaround is needed. Assert unavailable transport never produces invented zero final totals and known in-memory/Git observations remain qualified supported partial results.
2. Add Metrics fixtures: a FIXED history record followed by a clean retry; deferred/rejected versus verified repaired findings; duplicate attempts; one valid task landing plus a base-absorption merge; equal count but different landed/completed ID sets; closure confirmed only during Finish reconciliation; and Workflow/ordinary launch metadata with zero friction events. Assert actual discrepant IDs, not just counts or a conjectured cause. Run replay and test-scripts before producer changes.
3. Extend ledger-digest/readLedger's existing compact transport to expose explicit missing/unreadable/valid-empty/truncated status without breaking .4's recognized records and legacy Task parsing. Validate the header/count and known-appends expectation at reads; a successful mechanical dispatch carrying an unexplained empty text is not proof of an empty ledger. Keep a failed landed lookup independent from successful ledger transport, with its own gap.
4. Compute the existing deterministic Metrics only after available Finish Git/tracker reconciliation has updated known buckets. For incomplete reconciliation keep supported counts labelled by their observed scope and list evidence gaps. Compare actual ID sets and show ledger-only/Git-only/tracker-only or equivalent concrete differences before optional agent diagnosis. Keep latest task/attempt classifications distinct from .4 history; use .8.4's supported disposition projection to distinguish repaired from deferred/rejected. Deduplicate by the proper task/occurrence/attempt identities rather than counting every appearance as a new repair or landing.
5. Update ordinary-subagent Metrics instructions to invoke the same existing helper/projection contracts and carry observed source/status facts before interpretation. Update super-auto run-state/report sources and upstream-feedback's count/friction semantics with short examples: a baseAbsorbed record contributes zero task landings; a normal execution-mechanism selection contributes zero friction; an unavailable ledger permits this-invocation known results with an explicit run-total gap. Do not write semantic causal guesses into deterministic producers.
6. Use writing-skills for changed operative instructions, run replay and caller script tests plus contract lint, and inspect the final generated Metrics/Remaining status from each fixture. Supply concrete discrepant-ID/partial-evidence report examples to the coordinator for its fresh-agent interpretation check, then commit.

**Contract fixture upkeep:** Preserve both historical 2bf1d53 fixture files byte-for-byte. If the task adds run-state fields/formats, represent them in Field table/worked example and record their exact current additions in the declared run-state-added-fields.txt/run-state-added-formats.txt fixtures. Extend test-contract-lint.sh to validate the union of unchanged historical expectations and these explicit approved additions; keep rejection of dropped legacy fields, changed legacy formats and unapproved extra fields, with mutation coverage. Reuse this same additive-fixture contract when a predecessor has installed it; no top-level field is needed where an existing record holds the fact. These small current-contract goldens are tests, not a second runtime schema.

Run:

```bash
node tests/super-code/replay-harness.mjs
bash tests/super-auto/test-scripts.sh
bash tests/super-auto/test-contract-lint.sh
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** Deterministic counts reflect available reconciliation/history and expose transport/identity gaps without invented authoritative totals or friction.

## Task 16: Keep super-auto root acceptance caller-owned

**filesTouched:**
- `skills/super-auto/SKILL.md`
- `skills/super-auto/run-state.md`
- `skills/super-auto/resume.md`
- `skills/super-auto/scripts/report-status`
- `skills/super-code/scripts/close-in-tree-epics`
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/replay-harness.mjs`
- `tests/super-auto/test-scripts.sh`
- `tests/super-auto/test-contract-lint.sh`
- `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-auto/report-prompt.md`
- `skills/super-auto/scripts/scope-dispositions`
- `skills/super-code/SKILL.md`
- `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt`

**Bead:** super-plan-ufz.6. **Surface:** 242801 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Keep measurement obligations caller-owned and preserve super-auto root acceptance after leaf completion. Standalone execution retains its current root ownership.

**Interfaces:** Consume .4 durable obligations, .5 evidence and .8.3 accumulated outstanding findings. Use an explicit existing-launch option/protocol parameter identifying caller-owned root acceptance; deferSweep alone is not that ownership signal. A narrow optional exclude-root flag on close-in-tree-epics is a bounded implementation choice, preserving its no-option behavior. Carry the same ownership to Workflow and ordinary calls, including every fix-loop re-entry and root-close path.

### Acceptance (verbatim)

- [ ] A deferred sweep remains an explicit pending measurement with an owner and does not hide actual code findings (needs: super-plan-ufz.4, super-plan-ufz.5).
- [ ] All implementation leaves can finish while the super-auto root remains open for required review, measurement or human acceptance (needs: super-plan-ufz.4, super-plan-ufz.5, super-plan-ufz.8.3).
- [ ] Standalone callers retain their existing acceptance ownership.
- [ ] Deterministic gate/status fixtures pass; the coordinator owns fresh-agent deferred-sweep and final-acceptance scenarios.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add a fake-bd closure fixture (inside the existing replay script-test harness) with every implementation leaf closed and an eligible inner epic plus the root. Under caller-owned acceptance assert only the inner epic closes and rootClosed remains false; under the unchanged standalone invocation assert normal root closure. Cover the helper's manual no-jq instructions so fallback cannot close an excluded root. Add replay cases that propagate ownership into Close, Ready and every other helper caller.
2. Add caller run/status fixtures with an owned deferred sweep and actual code finding together, then a supported passing measurement that clears only its matching measurement obligation. Test required review, unavailable/failed/live-required measurement and open human gate independently while leaves finish. Assert a root stays open until its actual caller acceptance obligations and reserved human choice are satisfied; no agent auto-closes a human gate. Run replay, test-scripts and contract lint before editing the closure contract.
3. Carry explicit caller-owned-root acceptance through the existing Workflow args/Launch and ordinary launch protocol. Change close-in-tree-epics additively to skip the root when that ownership is supplied, while retaining fixpoint inner-epic closure and existing standalone defaults. Pass the ownership at every coordinator helper invocation, including readyPrompt's preliminary close pass. Empty implementation frontier under caller-owned acceptance ends implementation normally; it must not require rootClosed true or spin into false stall/completion.
4. In super-auto code and re-entry invocation instructions, always supply the same root acceptance ownership. Retain required pending review/measurement/human obligations with owner and evidence using .4/.5, and consume .8.3's outstanding projection when deciding what remains. The final sweep discharges only source-matched measurement evidence; actual code findings retain their routing/disposition even when unmeasured status is resolved. Do not replace acceptance with child-count or latest-ready checks.
5. Update resume/run-state/report-status handling to preserve pending caller acceptance across interruption and qualify completed leaves accordingly. Keep the existing phase-7 human decision and finish semantics: caller-owned root closes only after its specified obligations and authorized final acceptance; cancelled/kept-branch outcomes remain distinguishable. Standalone callers retain their existing finish ownership and defaults.
6. Use writing-skills for operative acceptance/gate instructions. Prepare the deferred-sweep plus code-defect and all-leaves-done/open-human-gate scenarios for coordinator-owned fresh-agent evaluation. Run the three named suites and commit helper/caller changes, reporting the exact ownership option and every call site updated.

**Contract fixture upkeep:** Preserve both historical 2bf1d53 fixture files byte-for-byte. If the task adds run-state fields/formats, represent them in Field table/worked example and record their exact current additions in the declared run-state-added-fields.txt/run-state-added-formats.txt fixtures. Extend test-contract-lint.sh to validate the union of unchanged historical expectations and these explicit approved additions; keep rejection of dropped legacy fields, changed legacy formats and unapproved extra fields, with mutation coverage. Reuse this same additive-fixture contract when a predecessor has installed it; no top-level field is needed where an existing record holds the fact. These small current-contract goldens are tests, not a second runtime schema.

Run:

```bash
node tests/super-code/replay-harness.mjs
bash tests/super-auto/test-scripts.sh
bash tests/super-auto/test-contract-lint.sh
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** Leaves can complete while the super-auto root awaits caller-owned review, measurement or human acceptance, with standalone closure unchanged.

## Task 17: Integration sweep: workflow reliability

**filesTouched:**
- `tests/super-code/replay-harness.mjs`
- `tests/super-auto/test-scripts.sh`
- `tests/super-auto/test-contract-lint.sh`
- `tests/super-code/test-dispatch-text.sh`
- `tests/super-code/test-report-verdict.sh`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/verification.md`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/scripts/stop-run-processes`
- `skills/super-code/scripts/remove-task-worktree`
- `skills/super-code/scripts/ledger-digest`
- `skills/super-code/scripts/close-in-tree-epics`
- `skills/super-code/scripts/run-profile.mjs`
- `skills/super-auto/SKILL.md`
- `skills/super-auto/run-state.md`
- `skills/super-auto/resume.md`
- `skills/super-auto/report-prompt.md`
- `skills/super-auto/scripts/report-status`
- `skills/super-auto/scripts/scope-dispositions`
- `skills/super-roast/scripts/assemble-args.mjs`
- `skills/upstream-feedback/SKILL.md`
- `AGENTS.md`

**Bead:** super-plan-ufz.14. **Surface:** 286107 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Verify cross-boundary integrated behavior and record evidence. Do not implement roast-redesign policy, mint stronger live claims, or relaunch parent-owned behavior evaluations.

**Interfaces:** All implementation leaves are prerequisites. Use their landed producer/consumer contracts and the coordinator-provided evaluation artifacts. Named tests plus verification.md are the write surface; inspect the source producers listed below. Repair fixture/doc gaps within this surface; a source fix outside it requires the coordinator to route the small correction to its owner or update the declared surface before editing. Larger behavior failures become blockers with concrete reproduction/evidence.

### Acceptance (verbatim)

- [ ] Main flow preserves work/evidence through denial, interruption and retry with truthful remaining obligations.
- [ ] Both execution paths and standalone/super-auto acceptance ownership are checked with named evidence.
- [ ] Fresh-agent changed-instruction before/after evidence is recorded by coordinator; gaps are explicit.
- [ ] Cross-boundary regression checks and required repository suites pass against the integrated tree; no unsupported live claims.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Read all landed leaf contract summaries and coordinator-owned behavior-evaluation artifacts before selecting gaps. Build a concise acceptance-to-evidence table in verification.md covering root spec sections 1-5, both execution paths, caller/standalone ownership and every fresh-agent scenario. Record source tree, exact command/configuration, outcome, artifact and live/simulated/fallback kind; absent before/after or live evidence is an explicit gap rather than a fabricated pass.
2. Add failing integration fixtures for the actual producer/consumer seams: denied process inspection -> retained resources -> reported unknown cleanup; landed-but-unclosed recovery -> fresh admission -> no duplicate implementation; verification-only reviewed evidence -> completion without artificial landing; deferred measurement plus unresolved finding -> ready retry -> collected projection -> open caller root/status; and supported elsewhere-fixed disposition -> key-only punch-list removal -> reconciled repaired metrics. Include ordinary generated dispatch/record inputs and Workflow replay traces using the same concrete values.
3. Run the affected focused suites before correcting any seam fixture or doc gap. Exercise the actual landed scripts via temporary files/fake tracker commands; avoid duplicate model-owned semantic tests or static string checks as the sole evidence of a cross-boundary effect. Check baseline record compatibility, invocation null/path semantics and repeat resume/collection idempotence along the integrated flow.
4. Resolve small fixture/contract-documentation gaps within this task's declared files and rerun affected checks. For a source implementation defect provide the smallest failing case and exact producer/consumer discrepancy to the coordinator; update write ownership before any out-of-surface source edit. File larger blockers through the task's normal reporting route with command, source SHA and artifact. No implementation of external roast-redesign triggers/amend policy is authorized.
5. Run all required repository suites listed below against the integrated source tree, with quiet host timing-sensitive sweeps coordinated by the parent. Since coordinator.js changes, replay its documented canonical dryRun scenarios and compare actual agent counts to the current coordinator-workflow.md expectations. Record exact completed results and source identity; timeout, denied operation or unrun fresh-agent evaluation stays unavailable. Run broadened verification once the integrated changes justify it; do not relabel the historical 1770 baseline as current evidence.
6. Finalize verification.md with acceptance coverage, focused and required-suite results, coordinator-provided changed-instruction before/after evaluation links, remaining obligations and limitations. If an actual gap remains, report it precisely rather than claiming root acceptance. Commit integration fixtures/evidence only; super-auto still owns final acceptance and finish.



Run:

```bash
node tests/super-code/replay-harness.mjs
bash tests/super-code/test-run-profile.sh
bash tests/super-code/test-dispatch-text.sh
bash tests/super-design/test-scripts.sh
bash tests/super-roast/test-assemble-args.sh
bash tests/super-auto/test-scripts.sh
bash tests/super-auto/test-contract-lint.sh
bash tests/skill-scripts/test-bash-invocation.sh
bash tests/codex/test-marketplace-manifest.sh
bash tests/super-code/test-run-marker.sh
bash tests/super-code/test-run-profile-in-flight.sh
bash tests/super-code/test-report-verdict.sh
bash tests/super-code/test-run-digest.sh
bash tests/super-code/test-task-surface.sh
bash tests/super-code/test-split-oversized.sh
bash tests/super-code/test-context-preflight.sh
bash tests/super-code/test-assembled-size.sh
bash tests/hooks/test-session-start.sh
bash tests/hooks/test-run-block.sh
bash tests/hooks/test-reinject-smoke.sh
bash tests/codex/test-package-codex-plugin.sh
bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
bash tests/skill-scripts/test-prompt-text-fresh-rounds.sh
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** Named integrated mechanics/dispatch fixtures and source-bound verification evidence establish the approved invariants, with parent-owned evaluation gaps visible.


## Mapping (continued)

| N | Bead | Task | Files touched | Files to read | Surface tokens | Dependency facts |
|---|---|---|---|---|---|---|
| 18 | super-plan-ufz.20 | Classify resume-check dispatch in run profile | `skills/super-code/scripts/run-profile.mjs`, `tests/super-code/test-run-profile.sh` | `skills/super-code/coordinator.js`, `skills/super-code/scripts/run-profile`, `tests/super-code/run-profile-fixture.mjs`, `tests/super-code/run-profile-ordinary-fixture.mjs`, `tests/super-code/test-run-profile-in-flight.sh`, `tests/super-code/fixtures/run-profile/chain.json`, `tests/super-code/fixtures/run-profile/ordinary.json`, `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md` | 130756 | deps: []; opaque: false |

## Task 18: Classify resume-check dispatch in run profile

**filesTouched:**
- `skills/super-code/scripts/run-profile.mjs`
- `tests/super-code/test-run-profile.sh`

**filesToRead:**
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/run-profile`
- `tests/super-code/run-profile-fixture.mjs`
- `tests/super-code/run-profile-ordinary-fixture.mjs`
- `tests/super-code/test-run-profile-in-flight.sh`
- `tests/super-code/fixtures/run-profile/chain.json`
- `tests/super-code/fixtures/run-profile/ordinary.json`
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`

**Bead:** super-plan-ufz.20. **Surface:** 130756 tokens at integration base `7a030486713f985ba8d02cc57c542f9d333756b8`. Read the classifier, ordinary label decoding, actual resume dispatch/prompt, and named fixture neighborhoods. This is the single integration fix discovered by super-plan-ufz.14, not a replan of earlier work.

**Failure and interfaces:** `test-run-profile.sh` lines 331–337 enumerate literal coordinator dispatch label kinds and require a matching classifier `case`. The observed failure is `resume-check` missing. Keep that valid assertion unchanged. The Resume phase in `coordinator.js` dispatches `resume-check:<id>` before admission to reconcile pending-closure obligations. `resumeCheckPrompt(record, required)`, including its verification-only branch, only observes exact Git source/landing and tracker status and forbids implementation, review, merge, closure and cleanup. This belongs to the existing run-level `ready` stage. The ID identifies the observed obligation; it must not produce a new implementation attempt or occupy a task slot. Extend `stageOf` and `RUN_KINDS`; preserve `parseLabel`, `BEAD_KINDS`, `IN_SLOT`, other categories and output schemas. Existing fixture builders already support arbitrary labels and need no changes.

### Acceptance (bead text verbatim)

Done when: the profiler classifies the actual resume-check dispatch consistently with its resume/readiness observation role, existing run-profile and in-flight suites pass, and other labels/populations are unchanged. Add only a focused meaningful regression if existing label coverage does not exercise semantics.

Historical fixtures remain byte-for-byte. Parent final sweep and behavior evidence remain pending. No real epic acceptance.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Read the exact failing assertion and actual `resumeCheckPrompt` before editing. Run `bash tests/super-code/test-run-profile.sh` and retain the existing `coordinator label kinds are all classified (missing: resume-check)` failure. Its source-string coverage does not exercise semantics, so a focused behavioral regression is necessary. Integration replay was reported 2273/0; this task does not rerun replay or weaken acceptance to accommodate a missing category.
2. Add the following focused temporary variants beside the label-coverage check in `test-run-profile.sh`. The suite already creates `$T/chain-p.json`, `$T/ox.json` and `$T/oc.json` as unchanged baselines. Keep fixture files/builders unmodified; construct scenarios in `$T` only:

```bash
node - "$FX" "$T" <<'JS'
const fs = require('node:fs'), [FX, T] = process.argv.slice(2)
const workflow = JSON.parse(fs.readFileSync(`${FX}/chain.json`, 'utf8'))
const observation = workflow.agents.find(a => a.label === 'bd-ready')
observation.label = 'resume-check:ep.1'
observation.phase = 'Resume'
observation.result = { landed: true, sourceVerified: false, closed: ['ep.1'], open: [] }
fs.writeFileSync(`${T}/resume-label-workflow.json`, JSON.stringify(workflow))
const ordinary = JSON.parse(fs.readFileSync(`${FX}/ordinary.json`, 'utf8'))
ordinary.agents.push({ codex: 'resume_check_cx_1', label: 'resume-check:cx.1', start: 0, end: 10 })
fs.writeFileSync(`${T}/resume-label-ordinary.json`, JSON.stringify(ordinary))
JS
node "$BUILD" "$T/resume-label-workflow.json" "$T/resume-label-workflow"
run bash "$P" --workflow "$T/resume-label-workflow" --out "$T/resume-label-w"
assert_eq "$code" 0 "resume observation Workflow profile exits 0"
assert_eq "$(q "$T/resume-label-w.json" "JSON.stringify(d.criticalPath.segments.filter(s => s.label === 'resume-check:ep.1').map(s => [s.kind,s.bead,s.ms]))")" '[["ready",null,10000]]' "resume observation is run-level ready time"
assert_eq "$(q "$T/resume-label-w.json" "JSON.stringify(d.beads)")" "$(q "$T/chain-p.json" "JSON.stringify(d.beads)")" "resume observation creates no task attempt or task timing"
assert_eq "$(q "$T/resume-label-w.json" "JSON.stringify(d.taskSlots)")" "$(q "$T/chain-p.json" "JSON.stringify(d.taskSlots)")" "resume observation uses no task slot"
RC=$(node "$ORD" "$T/resume-label-ordinary.json" codex "$T/resume-label-codex")
run bash "$P" --codex "$RC" --codex-home "$T/resume-label-codex/codex" --ledger "$T/resume-label-codex/progress.md" --beads "$T/resume-label-codex/beads.json" --out "$T/resume-label-x"
assert_eq "$code" 0 "resume observation Codex profile exits 0"
RS=$(node "$ORD" "$T/resume-label-ordinary.json" claude "$T/resume-label-claude")
run bash "$P" --subagents "$RS" --ledger "$T/resume-label-claude/progress.md" --beads "$T/resume-label-claude/beads.json" --out "$T/resume-label-c"
assert_eq "$code" 0 "resume observation Claude profile exits 0"
for pair in 'x ox' 'c oc'; do
  read -r variant baseline <<< "$pair"
  assert_eq "$(q "$T/resume-label-$variant.json" "JSON.stringify(d.concurrency.kinds.filter(k => k.kind === 'resume-check').map(k => [k.mapped,k.n,k.ms]))")" '[[true,1,10000]]' "ordinary resume observation is mapped ($variant)"
  assert_eq "$(q "$T/resume-label-$variant.json" "JSON.stringify(d.beads)")" "$(q "$T/$baseline.json" "JSON.stringify(d.beads)")" "ordinary resume observation preserves bead population and attempts ($variant)"
  assert_eq "$(q "$T/resume-label-$variant.json" "JSON.stringify(d.taskSlots)")" "$(q "$T/$baseline.json" "JSON.stringify(d.taskSlots)")" "ordinary resume observation preserves task slots ($variant)"
done
```

Run the suite and observe the new semantic assertions failing on the current classifier. These cover category, both ordinary decoders and task populations; do not substitute assertions that merely search for implementation strings.
3. Apply the smallest classifier change in `run-profile.mjs`:

```js
// Extend only stageOf's existing ready case group:
case 'bd-ready': case 'bd-ready-topup': case 'bd-ready-recheck': case 'blocker-check': case 'close-epics': case 'resume-check': return 'ready'
```

Add `'resume-check'` once to the existing `RUN_KINDS` array. Keep it out of `BEAD_KINDS` and `IN_SLOT`. The ordinary decoder should recognize `resume_check_cx_1` with `kind: resume-check`, `bead: null`, and the obligation identifier as the run-level suffix. Do not alter coordinator semantics, timing bounds, behavior prose, acceptance gates or unrelated tests.
4. Run the current profiler checks and retain actual results:

```bash
bash tests/super-code/test-run-profile.sh
bash tests/super-code/test-run-profile-in-flight.sh
node --check skills/super-code/scripts/run-profile.mjs
```

All existing historical expectations and the exact original label-coverage assertion must pass unchanged. The in-flight suite keeps its existing unfinished-dispatch and truthful-age behavior. Review the diff to ensure only the two declared files changed and fixture files remain byte-for-byte. Report the fix and evidence to the coordinator. The genuine graph edge `.14` blocked-by `.20` means the held integration profiler check consumes this correction; do not stop or reorder `.14`'s unaffected suites. Root acceptance and the broader final sweep remain coordinator-owned.

**Independently testable deliverable:** Resume-check becomes mapped run-level `ready` work, adds no implementation attempt or task-slot occupancy, and both existing profiler suites pass with historical labels/populations retained.

## Mapping (continued)

| N | Bead | Task | Files touched | Files to read | Surface tokens | Dependency facts |
|---|---|---|---|---|---|---|
| 19 | super-plan-ufz.22 | Preserve held task scope through oversized recovery transport | `skills/super-code/coordinator.js`, `skills/super-code/scripts/ledger-digest`, `tests/super-code/recovery-hold-scope-r1.mjs` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`, `tests/super-code/replay-harness.mjs`, `tests/super-code/test-run-digest.sh`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-0-reproduce/tests/super-code/probe.mjs`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-0-reproduce/receipt.json` | 192564 | deps: []; opaque: false |
| 20 | super-plan-ufz.23 | Start Workflow without forbidden clock or random calls | `skills/super-code/coordinator.js`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `tests/super-code/invocation-start-r1.mjs` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`, `tests/super-code/replay-harness.mjs`, `skills/super-code/scripts/dispatch-text.mjs`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-1-ground/repro.mjs`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-1-ground/repro-runtime-result.json` | 248550 | deps: []; opaque: false |
| 21 | super-plan-ufz.24 | Validate retained archive bytes at read-only acceptance | `skills/super-auto/scripts/report-status`, `tests/super-auto/archive-integrity-r1.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`, `skills/super-auto/run-state.md`, `tests/super-auto/test-scripts.sh`, `skills/super-auto/scripts/scope-dispositions`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-2-reproduce/probe.py`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-2-reproduce/receipts.json`, `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-56.md` | 43156 | deps: []; opaque: false |
| 22 | super-plan-ufz.25 | Flush complete finding projections to piped consumers | `skills/super-auto/scripts/scope-dispositions`, `tests/super-auto/projection-output-r1.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`, `skills/super-auto/scripts/report-status`, `skills/super-auto/run-state.md`, `tests/super-auto/test-scripts.sh`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/probe.py`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/acceptance-probe.py`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/receipt.json` | 43069 | deps: []; opaque: false |
| 23 | super-plan-ufz.26 | Exclude collected generated inputs from repeated review assembly | `skills/super-code/assembler-prompt.md`, `skills/super-code/coordinator.js`, `skills/super-auto/scripts/report-status`, `skills/super-auto/SKILL.md`, `tests/super-auto/generated-review-inputs-r1.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`, `skills/super-roast/scripts/assemble-args.mjs`, `skills/super-auto/run-state.md`, `tests/super-auto/test-scripts.sh`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-5-reproduce/probe.py`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-5-reproduce/receipt.json` | 134936 | deps: []; opaque: false |
| 24 | super-plan-ufz.27 | Keep collected review inputs inside the declared workspace | `skills/super-auto/scripts/report-status`, `tests/super-auto/collection-symlinks-r1.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`, `skills/super-auto/run-state.md`, `tests/super-auto/test-scripts.sh`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-7-reproduce/result.json` | 38419 | deps: []; opaque: false |
| 25 | super-plan-ufz.28 | Normalize temporary path expectations in dispatch-text tests | `tests/super-code/test-dispatch-text.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`, `skills/super-code/scripts/dispatch-text.mjs`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/head-trailing.log`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/base-trailing.log`, `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-13.md` | 24670 | deps: []; opaque: false |
| 26 | super-plan-ufz.29 | Bind resumed review invocations to immutable captured source | `skills/super-code/coordinator.js`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/coordinator-subagents.md`, `skills/super-code/scripts/dispatch-text.mjs`, `tests/super-code/invocation-source-binding-r1.mjs` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`, `skills/super-code/assembler-prompt.md`, `skills/super-code/scripts/ledger-digest`, `tests/super-code/replay-harness.mjs`, `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-13.md` | 250089 | deps: []; opaque: false |
| 27 | super-plan-ufz.30 | Qualify unsupported profile lower-bound and causal claims | `docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.json` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`, `skills/super-code/scripts/run-profile.mjs`, `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-16.md` | 88766 | deps: []; opaque: false |
| 28 | super-plan-ufz.31 | Restore five missing live-isolation evidence artifacts | `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/artifact-manifest.json`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/report.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/build/caller-output.txt`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/progress.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md.diff`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/ufz-live-review-plan.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/caller-output.txt`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/final-review-seat-b-live.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/progress.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/final-review-seat-b-live.md.diff`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/ufz-live-review-plan.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/provenance.json` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/evidence/seat-b-final-response.txt`, `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-25.md` | 9611 | deps: []; opaque: false |
| 29 | super-plan-ufz.32 | Retain nested resources before outer run removal | `skills/super-auto/SKILL.md`, `skills/finishing-a-development-branch/SKILL.md`, `skills/super-auto/run-state.md`, `skills/super-auto/report-prompt.md`, `tests/super-auto/outer-cleanup-r1.sh` | `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`, `skills/super-code/scripts/remove-task-worktree`, `skills/super-code/scripts/stop-run-processes`, `tests/super-auto/test-scripts.sh`, `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-56.md` | 57408 | deps: []; opaque: false |

## Planning context (phase-5 patch round r1)

Invocation: `inv-c96916a964634bb0bb5f2bd3b8e1769b`. Integration base for every new surface measurement: `1d0ab308f09598c8c2826cfbca2af119a631d37a`. The previous 18 mapping rows and task sections remain unchanged. Only the eleven confirmed-ready bounded fixes .22–.32 receive ordinals 19–29. Shared coordinator/report-status files impose the existing hot-file cap, not dependencies; all eleven live tree-deps records have deps [] and opaque false. No fix consumes another new fix's output. Measured whole-file context includes large existing replay/coordinator files; implement only the named mechanism and focused regression neighborhood. These bounded fixes do not have independent scope groups needing a split.

The authoritative scope/evidence inventory is `fix-beads-r1.json` in this plan workspace, including exact covered keys, original review membership, source identities and pending caller obligations. The linked step-back decision is patch. Read captured failure output as evidence. The spec, run.md, original measurements and unrelated historical archives are not repair targets. New mechanics use failing focused regressions followed by the named unchanged suites. Changed operative instructions require superpowers:writing-skills; actual bounded behavior evaluations remain coordinator-owned, and helper/replay/text evidence does not discharge them.

## Task 19: Preserve held task scope through oversized recovery transport

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/ledger-digest`
- `tests/super-code/recovery-hold-scope-r1.mjs`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `tests/super-code/replay-harness.mjs`
- `tests/super-code/test-run-digest.sh`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-0-reproduce/tests/super-code/probe.mjs`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-0-reproduce/receipt.json`

**Bead:** super-plan-ufz.22. **Surface:** 192564 tokens at the integration base.

**Scope:** Compact or oversized persisted recovery transport must preserve or recover the affected task identities before admitting work; missing transport is an evidence gap that holds affected work, not permission to drop its hold.

### Bounded fixture exception

Named test defect and bounded fixture amendment (recovery-fixture-assessment-r1.md): tests/super-code/replay-harness.mjs:594–610, the legacy oversized verification-basis fixture, digests a foreign temporary ledger that is subsequently deleted and supplies only capped text with an unresolved Recovery pointer, yet expects ready independent-review reentry. Only that fixture and adjacent focused replacement cases may change; no unrelated replay assertions, snapshot baselines, digest-suite changes, schema relaxation, inferred scope, new recovery-reader dispatches, specification changes or historical evidence edits are authorized.

Preserve the real ledger-digest cap assertion: the oversized basis emits the actual source-line pointer and typed verification-only Task discriminator without leaking evidence/live.log. Do not fabricate an inline Recovery record or erase the pointer to admit work.

For recovered oversized pending-closure coverage, configure integrationWorktree and use its actual .superpowers/sdd/bd-100-plan/progress.md (or legitimate relative ledger path). While that file exists, generate compact text and complete counted targeted output with bash skills/super-code/scripts/ledger-digest and --recovery-line 1 from that same ledger. Supply recoveryRecords: [{ source: <exact emitted pointer source>, line: 1, text: <complete counted targeted output> }] in the existing read-ledger canned response. Preserve the entire original oversized pending-closure record, evidence and additive fields; no replacement kind, clear operation or invented narrow affectedIds. Assert the existing reader prompt includes the recovery command for that exact ledger/line and no additional read-recovery dispatch occurs. Provide resume-check:bd-101 with sourceVerified: true, landed: false, closed: [], open: ['bd-101'] only when bd-101 is the sole required bead, observing the retained head/tree and exact required beads. Assert resume-check precedes closure; impl:bd-101 = 0, review:bd-101 = 0, merge:bd-101 = 0, close-only:bd-101 = 1, and completed includes bd-101 only after confirmed closure. Retain recovered evidence/source identity and clear only the resolved transport gap. Preserve pending-closure source/tracker failure cases; unsupported observations never close work.

Separately retain ready missing-basis reentry using a valid counted ledger containing only Task 1 (bd-101): complete, verification-only, with no unresolved Recovery pointer or surviving pending-closure basis. Fresh impl and independent reviewer responses must supply the original source-bound live evidence and requiredLiveChecks. Assert impl:bd-101 = 1, review:bd-101 = 1, confirmed close-only closure, completed includes bd-101, merge:bd-101 = 0, and durable writing of the new reviewed basis before closure. Preserve the not-ready missing-basis evidence gap and no inferred completion.

Add an unrecoverable-pointer ready replay using the legacy capped text, its deleted foreign temporary source and no recoveryRecords: impl:bd-101 = 0, review:bd-101 = 0, merge:bd-101 = 0, close-only:bd-101 = 0, completed excludes bd-101, stopReason = recovery-held, and recovery.gaps retains the unresolved source/line. Do not infer unrelated admission scope. Retain current-ledger missing/truncated/empty/malformed retrieval coverage and reject a supplied foreign-source payload as an ownership bypass.

Run exactly the three named verification commands in the task worktree and record source revision/diff and complete outcomes. The prior reported 2276 passes / 1 failure is not completion evidence; all assertions above must pass. Rejected measurement-classification and direct frozen-Git fallback materiality findings remain rejected. Caller final sweep and root/human acceptance remain pending.

### Covered findings (verbatim)

- [Should-fix] skills/super-code/coordinator.js:752

### Acceptance (verbatim)

- [ ] An oversized persisted hold with additive context still blocks its identified task after resume; no implementation dispatch or merge occurs until its supported release.
- [ ] A valid compact hold and unrelated eligible work retain their expected behavior; missing/truncated transport remains distinguishable from a valid empty record.
- [ ] Add focused regression tests for the reported 173-byte versus 5173-byte hold. Run node tests/super-code/recovery-hold-scope-r1.mjs, node tests/super-code/replay-harness.mjs and bash tests/super-code/test-run-digest.sh. The replay suite may change only the oversized verification-basis fixture and adjacent focused cases to supply authoritative retained recovery bytes and independently assert recovered-basis reuse, valid missing-basis reentry, and unrecoverable-pointer admission hold; all other existing assertions and the digest suite remain unchanged.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Create tests/super-code/recovery-hold-scope-r1.mjs using the existing coordinator replay driver and the real ledger-digest helper. Persist the same task-scoped hold in the reported compact 173-byte form and a 5173-byte form containing additive context. Resume each and assert the affected task neither dispatches nor merges, while an unrelated eligible task can proceed. Also cover a supported release, valid-empty input, missing input and truncated input. Run the focused fixture first and retain the failing assertions.

2. Trace ledger-digest's oversized Recovery record handling into coordinator.js's Recovery gap parser and readRecovery/admission sets. Preserve the task identity in compact transport when possible, or recover it from the authoritative retained record before scheduling. A pointer with no safely recoverable task scope must remain a visible hold/evidence gap; never treat the missing payload as a supported release.

3. Keep the existing Recovery schema, release semantics and task-scoped admission checks. Do not discard additive fields, weaken identity validation, invent an empty obligation list or hold unrelated identifiable work merely because one record is large.

4. Add focused regression tests for the reported 173-byte versus 5173-byte hold. Run node tests/super-code/recovery-hold-scope-r1.mjs, node tests/super-code/replay-harness.mjs and bash tests/super-code/test-run-digest.sh. The replay suite may change only the oversized verification-basis fixture and adjacent focused cases to supply authoritative retained recovery bytes and independently assert recovered-basis reuse, valid missing-basis reentry, and unrecoverable-pointer admission hold; all other existing assertions and the digest suite remain unchanged. Report the source tree and outcomes, separating recovered holds from unresolved transport gaps. Deliverable: oversized recovery facts retain their admission effect through the real digest/resume boundary.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

## Task 20: Start Workflow without forbidden clock or random calls

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/invocation-start-r1.mjs`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `tests/super-code/replay-harness.mjs`
- `skills/super-code/scripts/dispatch-text.mjs`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-1-ground/repro.mjs`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-1-ground/repro-runtime-result.json`

**Bead:** super-plan-ufz.23. **Surface:** 248550 tokens at the integration base.

**Scope:** Obtain invocation identity through the existing Workflow-safe caller/argument or dispatched-mechanical boundary: omitted IDs are minted externally by the existing read-ledger Resume dispatch, returned as structured invocationId, validated and persisted by the existing awaited Launch append before review output. Preserve distinct invocation identities, explicit unsettled resume and the supported omitted-ID startup path without Date.now or Math.random inside a Workflow script.

### Covered findings (verbatim)

- [Blocking] skills/super-code/coordinator.js:25

### Acceptance (verbatim)

- [ ] With Date.now and Math.random throwing inside a Workflow-like VM, omitted invocationId starts, logs and reaches the existing Resume dispatch. That dispatch mints externally and returns a safe identity; the existing awaited Launch append persists exactly it before review output. No additional dispatch is introduced.
- [ ] Explicit invocationId remains unchanged; explicit unsettled resume reuses it. Two fresh omitted-ID launches sharing runTag and prior-ledger contents consume different boundary tokens and produce distinct single/split review identities. Existing preservation and reviewPath/null semantics remain covered.
- [ ] Missing or unsafe acquired identity fails visibly without a fabricated Launch or artifact write. Unconfirmed Launch persistence continues to suppress review assembly/writers. Existing ledger retry behavior preserves a selected valid identity or reports its absence explicitly.
- [ ] Caller/ordinary-subagent instructions state exactly where fresh IDs are minted and passed, distinguish fresh launch from explicit unsettled resume, and retain both execution paths. The enclosing coordinator owns the bounded changed-instruction evaluation and records it pending until measured.
- [ ] Run `node tests/super-code/invocation-start-r1.mjs` and `node tests/super-code/replay-harness.mjs`. The replay is unchanged except the named omitted-ID fixture response and strengthened assertions below. All other scenarios/assertions remain intact. Immutable source/resume binding remains Task 26 / .29; root sweep and human acceptance remain caller-owned.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Create tests/super-code/invocation-start-r1.mjs around the real coordinator builder in a Workflow-like sandbox where Date.now and Math.random throw. Exercise omitted invocationId through the documented supported startup path and an explicit ID. Assert execution reaches logging and dispatch; capture two fresh launches and verify their review destinations differ. Run the fixture to expose the current top-level identity expression.

2. Use the existing read-ledger mechanical Resume agent as the omitted-ID acquisition boundary: it executes the documented uuidgen command outside the Workflow VM and returns inv-<uuid> in structured invocationId. Extend its request/schema and validate the returned identity before constructing Launch; explicit arguments never trigger minting. Missing/unsafe acquired identity fails visibly before Launch or artifact authorization and never borrows a previous Launch identity. Preserve a selected valid identity through existing ledger-read retry/result reconstruction; reuse Workflow-recorded results on replay. Explicit unsettled resume passes its persisted token; settled relaunch acquires a fresh token. Keep successful startup to exactly read-ledger then ledger-append:launch; no added agents, runtime-global escape or extra dispatch. Preserve the focused fixture's forbidden Date.now/Math.random, distinct fresh identities, explicit identity/resume, missing identity, unsafe identity and persistence-gap coverage; also cover unsafe mechanically returned identity and changed retry transport. Do not conflate invocation identity with its separately owned captured source binding.

3. Update coordinator-workflow.md and coordinator-subagents.md only where needed to state exactly which existing caller boundary mints the ID, how it is passed, and how unsettled resume reuses it. Retain both execution paths. Use superpowers:writing-skills for changed operative instructions; the coordinator owns fresh-agent changed-instruction evaluation and records it as pending until measured.

4. Named test defect and amendment: In `tests/super-code/replay-harness.mjs`, only the omitted-ID tail of scenario `invocation review bundles: shared runTag, split/stub retention and explicit resume` (assessment lines 1603–1607) lacks the deterministic boundary output required for a fresh invocation. Keep `liveArgs({ runTag: 'shared-run', invocationId: undefined })` and prior-ledger text `Launch: args {"runTag":"shared-run","invocationId":"inv-first"}`. Extend that case's `read-ledger` canned output with structured `invocationId: 'inv-fresh-a'`; run a second omitted-ID launch with identical runTag/old ledger text and `invocationId: 'inv-fresh-b'`. Adjust only those cases' existing assembler/reviewer canned paths consistently with their expected token where required. Retain inequalities and strengthen assertions: both launches succeed, persisted Launch tokens equal the respective supplied tokens, emitted review/assembly destinations differ and use those tokens, and neither token copies inv-first or shared-run. Assert Resume requests minting only for omission and requests the structured identity field before the acknowledged Launch append. Keep explicit single/split/stub retention, explicit resume, unsafe-token, failed-persistence and reviewPath/null tests intact. No unrelated scenario/assertion, runtime stub, global default or dispatch-count change is authorized. The deterministic tokens represent external mint operations; no runtime bypass, random generation inside the replayed script, hidden harness fallback or identity-only dispatch is permitted.

5. Run node tests/super-code/invocation-start-r1.mjs and node tests/super-code/replay-harness.mjs with only the named fixture amendment above. Deliverable: supported startup survives forbidden clock/random globals and fresh invocations retain distinct safe identities; Task 26/.29 independently owns immutable source/resume binding.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

### Task 20 fix-pass scope and acceptance amendment

Fix-pass scope amendment (authorized coordinator direction; task-20-review.md NEEDS_FIX and startup-builder-seam-assessment-r1.md): additionally own skills/super-code/scripts/dispatch-text.mjs and tests/super-code/startup-builder-seam-r1.mjs. Separate internal builder initialization from operational Resume/Launch, forward the selected last Launch safe persisted invocationId to every builder mode, and preserve identity-free legacy non-review rendering without minting or fabricated identity. Preserve real Workflow missing/unsafe-ID failure and awaited persistence, .29 immutable source-binding guards, strict persisted review identity/override equality, ordinary review paths and deterministic runtime. Verify actual ordinary dispatch suite, focused combined loader matrix, startup, replay and source-binding fixtures on the rebased integrated source. Preserve prior evidence; changed-instruction evaluation/root sweep/human acceptance remain caller-owned and pending. No other task/status/Goal/run.md/ledger/dependency changes.

## Task 21: Validate retained archive bytes at read-only acceptance

**filesTouched:**
- `skills/super-auto/scripts/report-status`
- `tests/super-auto/archive-integrity-r1.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `skills/super-auto/run-state.md`
- `tests/super-auto/test-scripts.sh`
- `skills/super-auto/scripts/scope-dispositions`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-2-reproduce/probe.py`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-2-reproduce/receipts.json`
- `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-56.md`

**Bead:** super-plan-ufz.24. **Surface:** 43156 tokens at the integration base.

**Scope:** At the existing read-only status/acceptance boundary, validate every retained collection file against its saved existence and hash before trusting complete metadata; missing or changed bytes remain evidence gaps without requiring recollection.

### Covered findings (verbatim)

- [Should-fix] skills/super-auto/scripts/report-status:168
- [Must-fix] [P2; cluster 56] `skills/super-auto/scripts/report-status:168`: validate current archived existence/hashes at the read-only acceptance gate. Lines 293–296 inspect only persisted collection complete/gaps metadata. After valid collection, the cluster corrupted the direct `.md.diff`; acceptance still returned exit 0, `eligible:true`, empty pending/gaps, while collection replay returned exit 3 with `archive conflict`. Source evidence: cluster-56.md and its owned fixture; test missing/corrupted archive inputs without requiring mutating recollection first.

### Acceptance (verbatim)

- [ ] After valid collection, deleting or corrupting any retained direct package or assembled input makes read-only acceptance ineligible with a specific evidence gap.
- [ ] A complete matching archive remains eligible when its other obligations are satisfied; acceptance does not mutate archives or require recollection.
- [ ] Cover missing and corrupted artifacts in the focused regression and run the existing super-auto script suite unchanged.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Create tests/super-auto/archive-integrity-r1.sh using a disposable run/workspace and the real --collect and --acceptance commands. First collect a valid direct final review, companion .md.diff and required assembled inputs; satisfy the fixture's other acceptance requirements. Independently delete and corrupt each retained file after collection. Read-only acceptance must return ineligible with the exact missing/hash gap, without calling --collect again.

2. Extend existing ordinary status/collection validation reused by --acceptance to inspect every saved file entry in the retained invocation archive and compare its current bytes against sha256. Validate direct review/package files and assembled inputs, preserving missing versus changed evidence and all prior pending obligations. Do not trust complete:true alone or mutate run.md/archives from a status read.

3. Add the positive case for a complete matching archive and assert hashes/mtimes/run text remain unchanged across acceptance. Leave collection settlement, source bindings and finding relevance judgments under their existing contracts; this fix establishes archive integrity only.

4. Run bash tests/super-auto/archive-integrity-r1.sh and bash tests/super-auto/test-scripts.sh unchanged. Deliverable: acceptance detects tampering/missing archive bytes at read time and remains read-only.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

## Task 22: Flush complete finding projections to piped consumers

**filesTouched:**
- `skills/super-auto/scripts/scope-dispositions`
- `tests/super-auto/projection-output-r1.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `skills/super-auto/scripts/report-status`
- `skills/super-auto/run-state.md`
- `tests/super-auto/test-scripts.sh`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/probe.py`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/acceptance-probe.py`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/receipt.json`

**Bead:** super-plan-ufz.25. **Surface:** 43069 tokens at the integration base.

**Scope:** Emit the complete retained-finding projection before successful exit, including piped stdout; an incomplete write must not be reported as success or erase outstanding findings.

### Covered findings (verbatim)

- [Should-fix] skills/super-auto/scripts/scope-dispositions:194

### Acceptance (verbatim)

- [ ] The reported 128-occurrence projection exceeds the pipe buffer, exits successfully and parses completely with all occurrences preserved through a pipe.
- [ ] The actual report-status acceptance consumer reads that projection rather than reporting it unavailable due to truncated JSON.
- [ ] Add a focused piped-output regression and run the existing super-auto scripts unchanged.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Create tests/super-auto/projection-output-r1.sh using the retained 128-occurrence reproducer as data. Build a projection larger than the pipe buffer, pipe scope-dispositions --project into a JSON parser, and assert successful producer exit, complete valid JSON and every original occurrence. Repeat through report-status --acceptance so the real consumer must read the complete projection. Run to reproduce the truncation.

2. Change only scope-dispositions' projection output/exit handling so successful completion occurs after stdout has accepted/flushed the complete serialized projection. Preserve the projection schema and gap-dependent status codes. Output errors or incomplete writes remain observable failures; do not suppress findings or shrink the record to fit a buffer.

3. Cover valid-empty and gap-bearing projections as controls and preserve each occurrence's identity/order and explicit supported dispositions. Acceptance's remaining legitimate finding obligations may remain pending; assert specifically that no spurious unavailable-projection gap arises from truncation.

4. Run bash tests/super-auto/projection-output-r1.sh and bash tests/super-auto/test-scripts.sh unchanged. Deliverable: large projections survive the pipe into the actual acceptance reader without lost occurrences.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

## Task 23: Exclude collected generated inputs from repeated review assembly

**filesTouched:**
- `skills/super-code/assembler-prompt.md`
- `skills/super-code/coordinator.js`
- `skills/super-auto/scripts/report-status`
- `skills/super-auto/SKILL.md`
- `tests/super-auto/generated-review-inputs-r1.sh`
- `skills/super-code/scripts/dispatch-text.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `skills/super-roast/scripts/assemble-args.mjs`
- `skills/super-auto/run-state.md`
- `tests/super-auto/test-scripts.sh`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-5-reproduce/probe.py`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-5-reproduce/receipt.json`

**Bead:** super-plan-ufz.26. **Surface:** 134936 tokens at the integration base.

**Scope:** Use an additive deterministic review-input selection and slice-writing mode in existing dispatch-text.mjs to omit only exact manifest-claimed generated payload paths whose hashes verify against captured Git, preserving the original captured range, immutable archive bytes, ordinary review reports/findings and explicit provenance on every final-review/roast-code re-entry.

### Covered findings (verbatim)

- [Should-fix] skills/super-auto/scripts/report-status:224
- [Must-fix] [P2; seam] `skills/super-auto/scripts/report-status:223` / `skills/super-auto/SKILL.md:400` → `skills/super-code/assembler-prompt.md:26`: prevent committed generated review inputs from recursively re-entering subsequent full-branch assemblies while retaining historical provenance. The fresh-identity real-helper fixture above produces 21,204 → 46,851 → 104,901 slice bytes with unchanged product, then an actual invocation-4 311-byte basename failure, errno 63. Source evidence: captured collector/assembler/caller source, `/private/tmp/ufz-seam-amplification-probe.py`, owned `.review-probes/recursive-archive-result.json`, and this report's companion package; cover repeated successful collection/re-entry without further code changes.

### Acceptance (verbatim)

- [ ] Existing dispatch-text.mjs provides one additive mechanical mode (for example review-inputs --ledger ... --base <captured commit> --head <captured commit> --out-dir ...), verifies commit objects and writes deterministic selected diffstat/slices and provenance under the authorized output directory. It never initializes coordinator/dispatch or interprets findings; assembler retains semantic clustering, digest extraction and existing size checks. No new helper executable, schema/database, role, agent call or replacement engine.
- [ ] Enumerate the original full captured Git BASE/HEAD range with argument arrays and NUL-delimited paths. Read tracked run-file collection records, membership and archives from captured Git, deriving each archive from its own run-file directory and safe invocation identity; never trust mutable run.md, checkout/branch tip or a record-supplied source workspace. Exclude only exact review-collection manifest-claimed assembled/final-review-<ID>-final/ input files and final-review-<ID>.md.diff whose saved SHA-256 matches the captured blob. Unclaimed descendants, collection metadata, final/cluster review reports, findings and unrelated source/evidence remain ordinary review content.
- [ ] Both final-review and roast-code digest profiles expose generated-input provenance tied to captured record/invocation, archive path and saved hash, with readable original report/archive references at the captured revision and selected diffstat distinguished from omitted payloads. Historical archive bytes, findings, identity/disposition and scope-dispositions projection remain unchanged; omission never resolves a finding or supplies a verdict.
- [ ] Malformed/conflicting records, incomplete claimed bundles, missing claimed files or hash mismatch cannot authorize omission: preserve the inputs, expose an explicit selection/evidence gap and return unavailable rather than silently incomplete clean assembly. Inspect both captured endpoints when needed for removed/changed formerly claimed payloads; deletion/corruption remains reviewable evidence. Absent records supply no exemption. Unclaimed tracked reviews content stays ordinary; if it prevents assembly report actual unavailable scope. Untracked archives are neither captured input nor exclusion authority. Existing fallback must retain any invalid-provenance refusal/gap.
- [ ] The existing assemblePrompt path invokes the same selection operation for final-review and roast-code; Workflow and ordinary-subagent rendering produce the same operative command/contract. Changed-file list, slices, diffstat and cluster coverage agree on selected membership. Preserve immutable source/invocation binding and partial-artifact refusal; leave history/assess, general task review-package and direct frozen-Git fallback design unchanged absent demonstrated owned-boundary use.
- [ ] The focused fixture exercises the real collector and real deterministic selection operation through at least four successful fresh-ID collection/commit/re-entry cycles with unchanged product. Assert no prior generated slice/direct package enters or is recopied into new slices, the original product hunk occurs once, no nested .diff.diff amplification/basename failure, and every prior archive byte/hash remains unchanged. Bound generated-payload membership and recursive copies; do not require constant total bytes as metadata/distinct review reports accumulate. Add new-product-edit, captured-head-versus-advanced-checkout, corrupt/missing/incomplete claimed provenance, ordinary/unclaimed reviews content and untracked-archive controls.
- [ ] Run bash tests/super-auto/generated-review-inputs-r1.sh, unchanged bash tests/super-auto/test-scripts.sh and unchanged bash tests/super-code/test-dispatch-text.sh. Use superpowers:writing-skills for operative instruction edits; the enclosing coordinator owns changed-instruction evaluation and must record it pending until actually executed. Current owner is limited to RED fixture/proposal work; a fresh owner implements after this amendment, and this amendment makes no test or implementation success claim.
- [ ] Report-status changes are limited to reader-required provenance, reusing existing review-collection.files path/hash records and derived identities. Keep complete immutable assembled/direct bundle copying, collection replay and independently owned archive-integrity/symlink-safety repairs. No truncation, old manifest rewrite, slice deletion, broad archive/path blacklist, filename-shortening-only repair or generated-finding lifecycle. Preserve rejected measurement-classification and narrower direct frozen-Git fallback materiality findings. Both spec Goals, run.md, historical raw evidence and root acceptance remain untouched; caller-owned sweep/review/human acceptance remains pending.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

Assessment: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/recursive-input-boundary-assessment-r1.md` (existing-component). The exact recommended bounded contract is:

- Amend Task 23 / `super-plan-ufz.26` scope only to add `skills/super-code/scripts/dispatch-text.mjs` to its existing named files: `skills/super-code/assembler-prompt.md`, `skills/super-code/coordinator.js`, `skills/super-auto/scripts/report-status`, `skills/super-auto/SKILL.md`, and `tests/super-auto/generated-review-inputs-r1.sh`. Do not add a new executable, replacement archive engine, general registry, finding lifecycle, agent role or dispatch. Leave both specification Goals, historical evidence, unrelated fixtures and root acceptance unchanged. This assessment itself does not amend the tracker or plan.
- Add one explicit mechanical mode, for example `dispatch-text review-inputs --ledger ... --base <captured commit> --head <captured commit> --out-dir ...`, which verifies commit objects, enumerates the original full captured range, determines the verified generated-input exclusions, and writes the selected diffstat/slices plus a provenance sidecar under the already authorized output directory. Reuse existing argument and error conventions. This mode must not initialize the coordinator or dispatch an agent. The assembler still owns semantic import/call-edge clustering, digest extraction and the existing size check; the helper owns only deterministic selection and Git extraction. A separate output schema or artifact database is unnecessary.
- Read membership, collection records and archive bytes from the captured Git commit, never mutable `run.md`, the current checkout, the current branch tip or a source workspace mentioned by a record. Discover retained `review-collection` records in tracked run files from that captured tree and derive archive locations from each record's own run-file directory plus its safe invocation identity. Preserve the captured BASE/HEAD and original product range. Verify saved SHA-256 against the corresponding captured Git blob before treating a file as retained generated input. Handle paths through Git argument arrays and NUL-delimited enumeration; do not use shell pathspec interpolation or line-based filename splitting.
- Exclude only manifest-claimed generated payload files: the invocation's `assembled/final-review-<ID>-final/` input files and its `final-review-<ID>.md.diff` direct package. Match exact claimed paths and hashes, not every descendant of a directory or every path containing `reviews`, `assembled` or `.diff`. Keep collection metadata, final and cluster review reports, findings and unrelated source/evidence eligible for ordinary captured-range review. An unclaimed file under an otherwise recognized archive tree remains ordinary content. This exact-file boundary also avoids accidentally hiding later legitimate additions inside that tree.
- Emit explicit provenance for each omitted payload, tied to its captured run-record/invocation, archive path and saved hash; grouped references may point to the retained file manifest instead of duplicating its full contents. Include an obvious generated-input provenance section in both final-review and roast-code digest profiles, and distinguish selected product/input diffstat from omitted historical payloads. Readers must be able to open the original report and archive at the captured revision. No omission resolves a finding, supplies a verdict or changes `scope-dispositions` projection. Preserve the final/cluster reports themselves in the normal changed-file set so findings do not become invisible behind an unexplained exclusion.
- Treat invalid claimed provenance honestly. A malformed/conflicting collection record, incomplete claimed bundle, missing claimed file or saved-hash mismatch cannot authorize exclusion. Report an explicit selection/evidence gap and preserve the inputs; return unavailable rather than delivering a silently incomplete clean assembly. Inspect both captured endpoints when needed to recognize a removed or changed previously claimed payload: deletion/corruption is reviewable evidence, not permission to erase its history. A completely absent record supplies no exemption: unclaimed tracked `reviews` content remains ordinary content. Do not infer missing provenance from a directory name. If that content still makes assembly impossible, report the actual unavailable scope; do not claim bounded exclusion was established. Untracked archives are outside captured Git input and neither justify exclusions nor become new review inputs.
- Use the same selection operation in the existing `assemblePrompt` path for both `final-review` and `roast-code`; Workflow and ordinary-subagent rendering must produce the same operative command/contract. The changed-file list, slices, diffstat and cluster coverage must all agree on the selected set. Keep history/assess semantics unchanged unless their actual use demonstrates the same owned generated-input boundary. Preserve existing immutable invocation/source binding and partial-artifact refusal. An invalid-provenance refusal must retain its explicit gap in any existing fallback path; fallback must not silently discard the refusal. This does not require redesigning direct frozen-Git fallback, changing its historical materiality judgment or changing the general task `review-package` helper.
- Keep `report-status` changes limited to additional provenance strictly necessary for the reader. Its existing `review-collection.files` path/hash records and derived archive identities already supply the core boundary. Continue copying complete assembled/direct bundles immutably; do not truncate archives, stop collecting original payloads, rewrite old manifests, delete old slices, or replace provenance with a filename blacklist. Preserve collection replay and independently owned archive-integrity/symlink-safety repairs.
- Require the focused fixture to exercise the real collector and new real deterministic operation for at least four successful fresh-ID collection/commit/re-entry cycles with unchanged product. Assert no prior generated slice/package is selected or recopied into new slices, the original product hunk remains present once, no nested `.diff.diff` payload amplification or basename failure occurs, and all prior archived bytes/hashes remain unchanged. Bound generated-payload membership and recursive copies, rather than falsely demanding constant total bytes while collection metadata and distinct review reports legitimately accumulate. Add a new-product-edit control and captured-head-versus-advanced-checkout control, plus claimed corrupt/missing/incomplete provenance, ordinary/unclaimed `reviews` content and untracked-archive controls. Run `bash tests/super-auto/generated-review-inputs-r1.sh` and the unchanged `bash tests/super-auto/test-scripts.sh`; because dispatch rendering changes, also run the existing dispatch-text suite unchanged. Keep changed-instruction evaluation with the enclosing coordinator and qualify it pending until executed. Do not add a standalone filename-shortening repair or broaden this task into other rejected findings.

Current-owner boundary: RED fixture/proposal only; implementation is handed to a fresh owner after this amendment. No production implementation occurs in this amendment.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

## Task 24: Keep collected review inputs inside the declared workspace

**filesTouched:**
- `skills/super-auto/scripts/report-status`
- `tests/super-auto/collection-symlinks-r1.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `skills/super-auto/run-state.md`
- `tests/super-auto/test-scripts.sh`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-7-reproduce/result.json`

**Bead:** super-plan-ufz.27. **Surface:** 38419 tokens at the integration base.

**Scope:** Reject symlinked path components and outside-workspace resolutions during retained review-input collection; collection completeness cannot certify bytes outside its declared source boundary.

### Covered findings (verbatim)

- [Should-fix] skills/super-auto/scripts/report-status:220

### Acceptance (verbatim)

- [ ] An intermediate directory symlink from workspace/assembled to an outside sentinel is rejected with a collection gap and never archives the sentinel.
- [ ] Normal in-workspace files still collect; direct and nested symlink cases cannot bypass the boundary.
- [ ] The focused symlink fixture and existing super-auto suite pass unchanged.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Create tests/super-auto/collection-symlinks-r1.sh with an external sentinel and a declared workspace. Make workspace/assembled an intermediate symlink to the sentinel tree, then test a directly symlinked file and a deeper intermediate symlink. Invoke the real collector and assert a specific collection gap, incomplete collection and no archived sentinel bytes. Run these cases before editing collection traversal.

2. Validate every path component between the declared workspace root and each discovered/required input using lstat or an equivalent existing filesystem boundary check; reject symlinked components and outside-root resolved paths. Apply the same check to normal discovered inputs and --required entries. Check before reading/copying bytes, keeping collection failures explicit.

3. Add normal nested in-workspace files as a successful control and retain existing settlement/invocation rules. Do not follow a directory symlink during recursive enumeration, certify escaped bytes as complete or broaden this repair into unrelated filesystem cleanup.

4. Run bash tests/super-auto/collection-symlinks-r1.sh and bash tests/super-auto/test-scripts.sh unchanged. Deliverable: both direct and intermediate symlinks cannot make collection certify bytes outside its source boundary.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

## Task 25: Normalize temporary path expectations in dispatch-text tests

**filesTouched:**
- `tests/super-code/test-dispatch-text.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `skills/super-code/scripts/dispatch-text.mjs`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/head-trailing.log`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/base-trailing.log`
- `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-13.md`

**Bead:** super-plan-ufz.28. **Surface:** 24670 tokens at the integration base.

**Scope:** Construct expected temporary artifact paths using the same normalized directory as the dispatch consumer, including inherited TMPDIR values with trailing slashes throughout this test suite.

### Covered findings (verbatim)

- [Should-fix] tests/super-code/test-dispatch-text.sh:10
- [Must-fix] [P2; cluster 13] `tests/super-code/test-dispatch-text.sh:10`: normalize the trailing TMPDIR slash. The cluster ran the required suite with inherited macOS TMPDIR and observed four path-assertion failures because mktemp returned a double-slash path while dispatch resolves it; `TMPDIR=/private/tmp` passed. Source evidence: cluster-13.md; retain supported default-environment coverage.

### Acceptance (verbatim)

- [ ] The required dispatch-text suite passes with inherited macOS TMPDIR, an explicit trailing-slash TMPDIR and an equivalent no-trailing-slash TMPDIR.
- [ ] Assertions still compare the correct invocation-specific artifact paths rather than weakening or removing those checks.
- [ ] Only the named defective test changes; no production normalization workaround or environment exclusion substitutes for fixing its expectation.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Read the real dispatch-text path normalization and the four failing captured assertions. Reproduce the named suite with the inherited macOS TMPDIR and with the same physical temporary directory spelled with and without a trailing slash. Keep the failing assertion evidence; this bead fixes the named test's expectation.

2. Normalize the temporary directory returned by mktemp in tests/super-code/test-dispatch-text.sh before constructing expected invocation-specific paths, using the physical/canonical directory spelling consistent with the consumer. Apply it to all affected expectations. Preserve the explicit invocation filenames and equality assertions.

3. Run bash tests/super-code/test-dispatch-text.sh in the inherited environment, TMPDIR=/private/tmp/ bash tests/super-code/test-dispatch-text.sh and TMPDIR=/private/tmp bash tests/super-code/test-dispatch-text.sh. Do not change production dispatch-text, remove path checks or exclude the default environment. Deliverable: the suite validates the same correct artifact identity under all three supported spellings.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

## Task 26: Bind resumed review invocations to immutable captured source

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/scripts/dispatch-text.mjs`
- `tests/super-code/invocation-source-binding-r1.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `skills/super-code/assembler-prompt.md`
- `skills/super-code/scripts/ledger-digest`
- `tests/super-code/replay-harness.mjs`
- `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-13.md`

**Bead:** super-plan-ufz.29. **Surface:** 250089 tokens at the integration base.

**Scope:** Persist each invocation's captured source identities before producing review artifacts and preserve its partial bundle on unsettled resume; advancing integration must never reuse that identity to overwrite findings with a different source.

### Covered findings (verbatim)

- [Must-fix] [P1; cluster 13] `skills/super-code/coordinator.js:2256`: bind each persisted invocation identity to captured source before writing review artifacts and preserve existing partial contents on unsettled resume. The cluster's real-builder replay reused `final-review-resume-same.cluster-1.md` and the assembly path with heads `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` then `cccccccccccccccccccccccccccccccccccccccc`; persisted Launch records retained neither source binding. Findings can disappear after integration advances. Source evidence: cluster-13.md and its retained probe `/private/tmp/ufz-cluster13-review-612ea0a7-20261017/tests/super-code/.cluster13-resume-probe.mjs`; preserve a finding-bearing partial artifact through advance/resume and test it.

### Acceptance (verbatim)

- [ ] A finding-bearing partial cluster artifact survives advance/resume with the same persisted invocation ID and original source binding.
- [ ] Persisted Launch/recovery facts retain captured base/head before artifact writes; same-ID mismatched source is refused or reconciled without overwriting existing partial inputs.
- [ ] Single, split, seam and stub review paths plus current reviewPath/null semantics retain the invocation/source binding on supported execution paths.
- [ ] The focused real-builder resume fixture and unchanged coordinator replay pass; no new engine, finding lifecycle or identity-cause conflation.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Create tests/super-code/invocation-source-binding-r1.mjs using the real final-review prompt builder and existing replay harness conventions. Launch a persisted invocation at head bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb, leave a finding-bearing partial cluster/package/assembly bundle, advance integration to cccccccccccccccccccccccccccccccccccccccc, and resume the same unsettled ID. Assert the original bytes and captured source survive. Observe the current overwrite before repairing it.

2. Persist the invocation's captured base/head before authorizing assembly/review artifact writes using existing Launch/recovery facts; reread those durable facts on resume. Reuse the original source binding for an unsettled invocation, or explicitly refuse/reconcile a mismatched source without overwriting its partial artifacts. A fresh source capture requires a fresh identity, and missing binding is a named evidence gap.

3. Carry that binding through coordinator.js, dispatch-text and the existing Workflow/ordinary caller instructions for single, split, seam and stub paths. Preserve current reviewPath/null semantics and existing partial cluster content when a seam/cluster dispatch is unavailable. Do not derive findings from silence or redesign finding states.

4. Extend the focused fixture with persisted-source visibility before writes, same-ID mismatched-source refusal/reconciliation, fresh-ID new source, missing persistence, and each review mode's source/path arguments. Use superpowers:writing-skills for operative instruction changes and return bounded behavior evaluation to the coordinator as pending.

5. Run node tests/super-code/invocation-source-binding-r1.mjs and node tests/super-code/replay-harness.mjs unchanged. Deliverable: an invocation cannot overwrite a finding-bearing partial bundle by silently changing the reviewed source on resume.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

## Task 27: Qualify unsupported profile lower-bound and causal claims

**filesTouched:**
- `docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.json`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `skills/super-code/scripts/run-profile.mjs`
- `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-16.md`

**Bead:** super-plan-ufz.30. **Surface:** 88766 tokens at the integration base.

**Scope:** Preserve raw observations while distinguishing model estimates, unknown readiness and established causes; a modeled bound inconsistent with the observed graph window is not an established lower bound or proof of bottleneck cause.

### Covered findings (verbatim)

- [Must-fix] [metrics-causal-claim; cluster 16] `docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.md:7` and matching JSON summary/simulation verdict: qualify or substantiate the claimed graph lower bound and causal diagnosis. The 17h58m modeled bound exceeds the observed 17h43m graph window; .14 dispatch at 08:19:58Z precedes .20 creation at 08:27:13Z; both readiness times are unknown; the window includes 14h26m wait and 83% no-agent time. Source evidence: cluster-16.md and captured profile md/json; preserve raw observations while distinguishing estimates from established causes.

### Acceptance (verbatim)

- [ ] Markdown and matching JSON summary/simulation verdict consistently qualify or substantiate the 17h58m model against the observed 17h43m graph window.
- [ ] The .14 dispatch at 08:19:58Z versus .20 creation at 08:27:13Z and unknown readiness remain explicit; no pre-creation wait or inferred historical dependency is asserted.
- [ ] Retain the 14h26m wait, 83% no-agent observation and planning context as observations, without claiming task parallelism alone established the cause.
- [ ] Raw timeline/evidence, historical results and source snapshots remain unchanged; named claims have exact supporting evidence or explicit uncertainty.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Perform a claim-focused red check before editing: enumerate the Markdown bound/diagnosis/what-if statements and corresponding JSON summary/simulation verdict fields, and compare each with the retained raw timeline. Record the conflict between the 17h58m model and 17h43m observed graph window, .14 dispatch 08:19:58Z before .20 creation 08:27:13Z, unknown readiness, 14h26m wait and 83% no-agent time.

2. Qualify the named Markdown and matching JSON interpretation fields as model estimates with explicit assumptions and inconsistency/unknown-topology limits, unless exact retained evidence substantiates a stronger claim. Remove unsupported assertions that the chain established a causal lower bound or task parallelism alone established the bottleneck cause. Preserve planning context and the distinct all-agent/task-slot meanings.

3. Verify JSON parses and compare all raw timeline/evidence/source-snapshot subtrees before/after for byte or structural equality. Read the Markdown/JSON statements side by side and check each named number and timestamp remains supported and consistently qualified. Use a one-off read-only comparison rather than creating a mirrored product test or changing the profiler.

4. Deliverable: only profile-implementation.md and profile-implementation.json interpretation/claim fields change; observations, historical results, source snapshots and uncertainty stay intact. This is a bounded historical claim correction, not a new measurement or acceptance clearance.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

## Task 28: Restore five missing live-isolation evidence artifacts

**filesTouched:**
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/artifact-manifest.json`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/report.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/build/caller-output.txt`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/progress.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md.diff`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/ufz-live-review-plan.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/caller-output.txt`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/final-review-seat-b-live.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/progress.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/final-review-seat-b-live.md.diff`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/ufz-live-review-plan.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/provenance.json`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/evidence/seat-b-final-response.txt`
- `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-25.md`

**Bead:** super-plan-ufz.31. **Surface:** 9611 tokens at the integration base.

**Scope:** Restore the five missing manifest artifacts, or retain hash-verified equivalent bytes with explicit provenance; do not fabricate unavailable historical artifacts or rewrite the original exercise observations.

### Covered findings (verbatim)

- [Must-fix] [P2; cluster 25] `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/artifact-manifest.json:76`: restore or replace with retained hash-verified equivalents the five absent manifest entries: `caller/build/caller-output.txt` plus `caller/.superpowers/sdd/ufz-live-review-plan/{final-review-seat-b-live.md,progress.md,final-review-seat-b-live.md.diff,ufz-live-review-plan.md}`. The cluster found 76 of 81 entries present and hash-matching; all five captured-head Git reads fail although report lines 26/45 claim their retention. The seat-B response duplicates only the final review's hash, leaving package/ledger evidence missing. Source evidence: cluster-25.md, captured manifest/report; repair retention without rewriting historical observations.

### Acceptance (verbatim)

- [ ] All five named missing artifacts are present and hash-verified against original manifest records, or equivalent retained copies explicitly map each original identity and hash.
- [ ] Manifest and retention claim links resolve to the complete package, ledger, plan, output and final-review evidence; validate all 81 original entries rather than only the 76 previously present.
- [ ] A duplicated final-review hash alone does not discharge the other four missing artifacts; unrecoverable evidence remains a named gap.
- [ ] Preserve source revisions, historical failures and live-exercise limitations; record restoration verification without relabeling historical observations.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Start with a read-only red audit of all 81 original artifact-manifest entries: resolve each against the retained tree and compare SHA-256; enumerate the exact five absent identities separately from the 76 present matches. Record original manifest hashes before any retention repair, and inspect captured archives/Git objects and the seat-B response without assuming a duplicated final-review hash supplies the package, ledger, plan or output.

2. Recover the five original byte streams from retained originals or hash-verified equivalent artifacts. Prefer restoring the five named original paths. If equivalent locations are necessary, use only the five explicitly declared retained-equivalents basenames and provenance.json to map every original identity/hash to its retained source/location/hash. Do not reconstruct historical output from prose or invent missing bytes.

3. Update only the manifest's explicit equivalent mapping and report's specific retention claim/verification qualification as required; keep original expected hashes and original exercise observations, source revisions, failures and live limitations. Any artifact that cannot be recovered remains a named gap with an honest claim qualification; do not claim this bead's full acceptance passed or substitute a rerun for the missing historical evidence.

4. Repeat the independent SHA-256 audit over all 81 original identities through their original/equivalent mappings and check every retention link. Assert the original 76 bytes/hashes remain unchanged and each restored/equivalent artifact matches its original hash. Save the audit/provenance only in the declared provenance.json or report, without creating unrelated archive files.

5. Deliverable: a complete verifiable retained package, or precise retained gap evidence for coordinator escalation; no fabricated historical bytes. The six concrete retained-equivalents paths replace the bead's wildcard solely as contingency targets for this task.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

## Task 29: Retain nested resources before outer run removal

**filesTouched:**
- `skills/super-auto/SKILL.md`
- `skills/finishing-a-development-branch/SKILL.md`
- `skills/super-auto/run-state.md`
- `skills/super-auto/report-prompt.md`
- `tests/super-auto/outer-cleanup-r1.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `skills/super-code/scripts/remove-task-worktree`
- `skills/super-code/scripts/stop-run-processes`
- `tests/super-auto/test-scripts.sh`
- `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-56.md`

**Bead:** super-plan-ufz.32. **Surface:** 57408 tokens at the integration base.

**Scope:** Honor task cleanup exits 3/4 and retained nested worktree/temp resources before any parent removal, and verify owned processes before deleting resources they may still need; unknown/surviving outcomes preserve dependent resources.

### Covered findings (verbatim)

- [Must-fix] [P1; cluster 56] `skills/super-auto/SKILL.md:174`: honor task cleanup exits 3/4 and retained nested worktree/temp resources before allowing parent removal, and verify run-owned processes before deleting resources they may need. The phase-7 caller lists retained resources but still delegates parent deletion before its run-level stop. The cluster's independent Git fixture proves ordinary parent removal exits 0 and destroys a dirty child under ignored `.worktrees/`. Source evidence: cluster-56.md and `/tmp/ufz-review-cluster56-612ea0a7/.review-probes/`; the original finish instruction predates this diff, but this new safety contract remains uncovered. Add outer-finish coverage for retained descendants and unknown/surviving process outcomes.

### Acceptance (verbatim)

- [ ] An outer-finish fixture with dirty ignored nested .worktrees descendants and retained cleanup exits 3/4 keeps the parent and descendant resources intact.
- [ ] Unknown or surviving run-owned processes prevent deleting dependent worktree/temp resources; outcomes remain distinct from verified stopped and deliberately kept.
- [ ] Verified termination with no retained descendants permits ordinary parent cleanup without broadening process ownership matching.
- [ ] Run the focused outer-finish regression and existing super-auto suite unchanged; coordinator owns bounded changed-instruction evaluation before acceptance.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Create tests/super-auto/outer-cleanup-r1.sh around an independent Git fixture with an outer worktree and dirty ignored nested .worktrees descendants. Exercise task cleanup exits 3 and 4, retained temporary resources, unknown/surviving run-owned process inspection and verified termination. The failing baseline must show why parent removal would destroy a retained descendant; no real run resources are used.

2. Amend phase-7 super-auto instructions and finishing-a-development-branch's removal preconditions so run-owned process verification precedes deletion of dependent resources, and retained task cleanup outcomes/descendants block outer parent removal. Preserve all named worktree/temp resources when termination is surviving/unknown and retain deliberately kept outcomes distinctly; do not treat exit-zero empty output as proof of inspection availability.

3. Carry these distinct cleanup facts through existing super-auto run-state/report instructions so delivery can finish while cleanup remains pending, and the human can see exactly what was retained and why. Preserve process ownership matching and allow ordinary cleanup only after verified termination and no retained descendants. Do not broaden kills or add a cleanup engine.

4. Use superpowers:writing-skills for changed operative instruction content. The focused fixture should check the concrete outer-finish decisions against the documented caller contract and resource existence, including positive cleanup and each refusal path. Coordinator owns a bounded fresh-agent changed-instruction evaluation; keep it pending until actual execution.

5. Run bash tests/super-auto/outer-cleanup-r1.sh and bash tests/super-auto/test-scripts.sh unchanged. Deliverable: outer finish preserves nested work and process-dependent resources under retained/unknown outcomes and permits verified-safe removal.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

## Pending caller and review obligations (not implementation tasks)

These records stay pending after planning and are not added to the ordinal mapping. Full exact inventories and original captured source/artifact identities remain in `fix-beads-r1.json`; the following references preserve their separate ownership and acceptance meaning.

### caller-final-sweep-and-root-acceptance

Owner: super-auto coordinator and human partner. Status: pending.

- [Must-fix] untested: The root's final integrated sweep is explicitly deferred; required acceptance review/measurement/human facts remain caller-owned. All 18 leaves closing supplies no substitute for those facts, and this not-ready final review does not satisfy review acceptance.

- [ ] Run and source-bind the final integrated sweep after fixes at the required final tip; a deferred sweep is pending measurement, not a code-defect bead.
- [ ] Assess the applicable changed-instruction behavioral evidence and required final review independently of helper/replay/text/live-isolation evidence; preserve original B4 failures/ambiguity and native-platform limits.
- [ ] Complete the three separately named bounded review obligations and account for their actual outcomes before claiming required review acceptance.
- [ ] Record actual required measurement, review and human acceptance facts; finished leaves or this not-ready review cannot close the root.
- [ ] Keep root super-plan-ufz open until caller-owned acceptance is actually satisfied; base merge remains the human's choice.

### review-former-cluster-9

Owner: super-auto coordinator. Status: pending. Original manifest ordinal: 9; original name: `evidence-super-plan-ufz-14`. Captured source: `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5..612ea0a7e4d64480bdd01e0ac842b539115342ee`; invocation: `inv-mvc60k41-xt8p35rk04d`; manifest: `.superpowers/sdd/super-plan-ufz-plan/assembled/final-review-inv-mvc60k41-xt8p35rk04d-final/clusters.json`. Full original files/slices/artifacts membership: `fix-beads-r1.json#/reviewObligations/0` (1 files, 1 slices); retain every member under this identity.

- [Must-fix] Unreviewed cluster 9 `evidence-super-plan-ufz-14`: authoritative reason is ambiguous duplicate cluster name with over-window cluster 52. Obtain an unambiguous bounded review; no clean verdict is inferred from adjacent reviewed evidence.

Independent bounded review and coverage accounting; split large file/slice inventories into uniquely identified review chunks tied to the original manifest ordinal and captured source. This is a coordinator review obligation, not a demonstrated code defect. No new agent role or engine is required.

- [ ] Identify this scope by original ordinal, full file/slice membership and captured base/head; duplicate cluster names cannot stand in for that identity.
- [ ] Read/review every listed captured source artifact in bounded chunks with explicit per-chunk coverage and findings; preserve complete membership even when a large file needs smaller ranges.
- [ ] Retain source-bound review results and remaining limits in a successor record that explicitly accounts for the original unreviewed obligation; placeholder not-ready records and adjacent ready evidence do not clear it.
- [ ] Preserve failed/ambiguous historical results and evidence-kind limits; archive fidelity is not live behavior acceptance.

No source repair or build/repack product defect is established by the authoritative evidence. Coordinator may prepare bounded uniquely named read-only review inputs from the retained captured artifacts; retain their original membership and hashes rather than file a fake implementation task.

### review-former-cluster-29

Owner: super-auto coordinator. Status: pending. Original manifest ordinal: 29; original name: `docs-superpowers-runs-2026-10-16-workflow-reliability-live-review-isolation-evidence-14`. Captured source: `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5..612ea0a7e4d64480bdd01e0ac842b539115342ee`; invocation: `inv-mvc60k41-xt8p35rk04d`; manifest: `.superpowers/sdd/super-plan-ufz-plan/assembled/final-review-inv-mvc60k41-xt8p35rk04d-final/clusters.json`. Full original files/slices/artifacts membership: `fix-beads-r1.json#/reviewObligations/1` (30 files, 30 slices); retain every member under this identity.

- [Must-fix] Unreviewed cluster 29 `docs-superpowers-runs-2026-10-16-workflow-reliability-live-review-isolation-evidence-14`: authoritative reason is over-window after one recluster. Its command logs support limited named checks in other reviews but do not constitute a completed review of this entire cluster.

Independent bounded review and coverage accounting; split large file/slice inventories into uniquely identified review chunks tied to the original manifest ordinal and captured source. This is a coordinator review obligation, not a demonstrated code defect. No new agent role or engine is required.

- [ ] Identify this scope by original ordinal, full file/slice membership and captured base/head; duplicate cluster names cannot stand in for that identity.
- [ ] Read/review every listed captured source artifact in bounded chunks with explicit per-chunk coverage and findings; preserve complete membership even when a large file needs smaller ranges.
- [ ] Retain source-bound review results and remaining limits in a successor record that explicitly accounts for the original unreviewed obligation; placeholder not-ready records and adjacent ready evidence do not clear it.
- [ ] Preserve failed/ambiguous historical results and evidence-kind limits; archive fidelity is not live behavior acceptance.

No source repair or build/repack product defect is established by the authoritative evidence. Coordinator may prepare bounded uniquely named read-only review inputs from the retained captured artifacts; retain their original membership and hashes rather than file a fake implementation task.

### review-former-cluster-52

Owner: super-auto coordinator. Status: pending. Original manifest ordinal: 52; original name: `evidence-super-plan-ufz-14`. Captured source: `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5..612ea0a7e4d64480bdd01e0ac842b539115342ee`; invocation: `inv-mvc60k41-xt8p35rk04d`; manifest: `.superpowers/sdd/super-plan-ufz-plan/assembled/final-review-inv-mvc60k41-xt8p35rk04d-final/clusters.json`. Full original files/slices/artifacts membership: `fix-beads-r1.json#/reviewObligations/2` (90 files, 90 slices); retain every member under this identity.

- [Must-fix] Unreviewed cluster 52 `evidence-super-plan-ufz-14`: authoritative reason is over-window after one recluster. Complete its bounded review separately from the duplicate-name cluster 9; source/evaluation evidence already cited remains qualified.

Independent bounded review and coverage accounting; split large file/slice inventories into uniquely identified review chunks tied to the original manifest ordinal and captured source. This is a coordinator review obligation, not a demonstrated code defect. No new agent role or engine is required.

- [ ] Identify this scope by original ordinal, full file/slice membership and captured base/head; duplicate cluster names cannot stand in for that identity.
- [ ] Read/review every listed captured source artifact in bounded chunks with explicit per-chunk coverage and findings; preserve complete membership even when a large file needs smaller ranges.
- [ ] Retain source-bound review results and remaining limits in a successor record that explicitly accounts for the original unreviewed obligation; placeholder not-ready records and adjacent ready evidence do not clear it.
- [ ] Preserve failed/ambiguous historical results and evidence-kind limits; archive fidelity is not live behavior acceptance.

No source repair or build/repack product defect is established by the authoritative evidence. Coordinator may prepare bounded uniquely named read-only review inputs from the retained captured artifacts; retain their original membership and hashes rather than file a fake implementation task.

## Retained rejected findings and historical limits

- **rejected: Measurement-classification semantic duplication at coordinator.js:354.** Coordinator matching live/pass evidence availability and caller acceptance have distinct contract meanings; contradictory records still require caller reconciliation.
- **rejected: Direct next-roast frozen-Git fallback materiality at super-auto/SKILL.md:400.** The documented captured-source fallback preserves required review despite assembler unavailability; repairing repeated generated-input recursion does not overturn that narrower judgment.

The following remain punch-listed limitations, not newly filed product defects:

- [Must-fix] untested: This seam review executes the collector/assembly feedback fixture only; it does not rerun the full coordinator, hosted Workflow, ordinary live scheduling/recovery, live verification-only completion, or the full required suite. Existing source-bound helper, replay, text-decision and live-isolation evidence retains the separate meanings described above.
  Punch-list — this records the seam review's bounded coverage rather than a demonstrated missing goal-required check; preserve the separate existing evidence and let the caller assess applicable behavioral and sweep obligations.
- [Must-fix] untested: Native Linux `/proc` inspection/termination remains untested in the supplied macOS evidence. Exit-zero/empty-stdout Finish process records do not independently resolve inspection availability or verify all resource safety; preserve the raw observations and caller-owned follow-up.
  Punch-list — native Linux coverage is an expressly disclosed platform limit, not a specified requirement for an additional platform exercise; retain unknown inspection outcomes and caller follow-up without claiming cleanup success.
- [Must-fix] untested: Archived fixed temporary paths, source excerpts and replay drivers were reviewed as historical evidence; general-purpose rerun portability, concurrency and unrecorded agent side effects were not established. Original B4 failures/ambiguity and live-exercise limits remain unmodified.
  Punch-list — general-purpose rerun portability, concurrency and unrecorded effects of historical evidence archives are outside the specified preservation guarantee; retain original limitations and failed or ambiguous measurements unchanged.

Archive-copy scope limits remain qualified historical evidence. The three punch-listed keys are preserved and not filed. This report creates no source edits, spec changes, implementation/tests or acceptance clearance.
