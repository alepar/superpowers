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

