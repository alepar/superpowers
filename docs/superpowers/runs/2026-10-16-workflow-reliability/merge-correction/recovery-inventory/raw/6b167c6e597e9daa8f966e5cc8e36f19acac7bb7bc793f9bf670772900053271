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

