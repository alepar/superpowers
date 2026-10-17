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

