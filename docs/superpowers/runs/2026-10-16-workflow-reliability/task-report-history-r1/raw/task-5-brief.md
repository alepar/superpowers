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

