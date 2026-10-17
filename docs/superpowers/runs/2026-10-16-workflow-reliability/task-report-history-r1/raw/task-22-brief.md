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

