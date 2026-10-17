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

