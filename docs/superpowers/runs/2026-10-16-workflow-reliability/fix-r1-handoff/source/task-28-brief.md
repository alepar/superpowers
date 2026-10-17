## Task 28: Restore five missing live-isolation evidence artifacts

**filesTouched:**
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/artifact-manifest.json`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/report.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/build/caller-output.txt`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/progress.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md.diff`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/ufz-live-review-plan.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/caller-output.txt`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/final-review-seat-b-live.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/progress.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/final-review-seat-b-live.md.diff`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/ufz-live-review-plan.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/provenance.json`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/evidence/seat-b-final-response.txt`
- `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-25.md`

**Bead:** super-plan-ufz.31. **Surface:** 9611 tokens at the integration base.

**Scope:** Restore the five missing manifest artifacts, or retain hash-verified equivalent bytes with explicit provenance; do not fabricate unavailable historical artifacts or rewrite the original exercise observations.

### Covered findings (verbatim)

- [Must-fix] [P2; cluster 25] `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/artifact-manifest.json:76`: restore or replace with retained hash-verified equivalents the five absent manifest entries: `caller/build/caller-output.txt` plus `caller/.superpowers/sdd/ufz-live-review-plan/{final-review-seat-b-live.md,progress.md,final-review-seat-b-live.md.diff,ufz-live-review-plan.md}`. The cluster found 76 of 81 entries present and hash-matching; all five captured-head Git reads fail although report lines 26/45 claim their retention. The seat-B response duplicates only the final review's hash, leaving package/ledger evidence missing. Source evidence: cluster-25.md, captured manifest/report; repair retention without rewriting historical observations.

### Acceptance (verbatim)

- [ ] All five named missing artifacts are present and hash-verified against original manifest records, or equivalent retained copies explicitly map each original identity and hash.
- [ ] Manifest and retention claim links resolve to the complete package, ledger, plan, output and final-review evidence; validate all 81 original entries rather than only the 76 previously present.
- [ ] A duplicated final-review hash alone does not discharge the other four missing artifacts; unrecoverable evidence remains a named gap.
- [ ] Preserve source revisions, historical failures and live-exercise limitations; record restoration verification without relabeling historical observations.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Start with a read-only red audit of all 81 original artifact-manifest entries: resolve each against the retained tree and compare SHA-256; enumerate the exact five absent identities separately from the 76 present matches. Record original manifest hashes before any retention repair, and inspect captured archives/Git objects and the seat-B response without assuming a duplicated final-review hash supplies the package, ledger, plan or output.

2. Recover the five original byte streams from retained originals or hash-verified equivalent artifacts. Prefer restoring the five named original paths. If equivalent locations are necessary, use only the five explicitly declared retained-equivalents basenames and provenance.json to map every original identity/hash to its retained source/location/hash. Do not reconstruct historical output from prose or invent missing bytes.

3. Update only the manifest's explicit equivalent mapping and report's specific retention claim/verification qualification as required; keep original expected hashes and original exercise observations, source revisions, failures and live limitations. Any artifact that cannot be recovered remains a named gap with an honest claim qualification; do not claim this bead's full acceptance passed or substitute a rerun for the missing historical evidence.

4. Repeat the independent SHA-256 audit over all 81 original identities through their original/equivalent mappings and check every retention link. Assert the original 76 bytes/hashes remain unchanged and each restored/equivalent artifact matches its original hash. Save the audit/provenance only in the declared provenance.json or report, without creating unrelated archive files.

5. Deliverable: a complete verifiable retained package, or precise retained gap evidence for coordinator escalation; no fabricated historical bytes. The six concrete retained-equivalents paths replace the bead's wildcard solely as contingency targets for this task.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

