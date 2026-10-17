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

