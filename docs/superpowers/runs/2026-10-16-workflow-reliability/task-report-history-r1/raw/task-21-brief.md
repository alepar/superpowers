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

