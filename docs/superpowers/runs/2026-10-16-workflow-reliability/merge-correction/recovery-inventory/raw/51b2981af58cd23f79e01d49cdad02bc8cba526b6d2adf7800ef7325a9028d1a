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

