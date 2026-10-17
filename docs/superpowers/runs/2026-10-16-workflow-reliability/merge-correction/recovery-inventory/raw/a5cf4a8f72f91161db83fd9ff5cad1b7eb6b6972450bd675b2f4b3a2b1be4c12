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

