## Task 27: Qualify unsupported profile lower-bound and causal claims

**filesTouched:**
- `docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.json`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `skills/super-code/scripts/run-profile.mjs`
- `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-16.md`

**Bead:** super-plan-ufz.30. **Surface:** 88766 tokens at the integration base.

**Scope:** Preserve raw observations while distinguishing model estimates, unknown readiness and established causes; a modeled bound inconsistent with the observed graph window is not an established lower bound or proof of bottleneck cause.

### Covered findings (verbatim)

- [Must-fix] [metrics-causal-claim; cluster 16] `docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.md:7` and matching JSON summary/simulation verdict: qualify or substantiate the claimed graph lower bound and causal diagnosis. The 17h58m modeled bound exceeds the observed 17h43m graph window; .14 dispatch at 08:19:58Z precedes .20 creation at 08:27:13Z; both readiness times are unknown; the window includes 14h26m wait and 83% no-agent time. Source evidence: cluster-16.md and captured profile md/json; preserve raw observations while distinguishing estimates from established causes.

### Acceptance (verbatim)

- [ ] Markdown and matching JSON summary/simulation verdict consistently qualify or substantiate the 17h58m model against the observed 17h43m graph window.
- [ ] The .14 dispatch at 08:19:58Z versus .20 creation at 08:27:13Z and unknown readiness remain explicit; no pre-creation wait or inferred historical dependency is asserted.
- [ ] Retain the 14h26m wait, 83% no-agent observation and planning context as observations, without claiming task parallelism alone established the cause.
- [ ] Raw timeline/evidence, historical results and source snapshots remain unchanged; named claims have exact supporting evidence or explicit uncertainty.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Perform a claim-focused red check before editing: enumerate the Markdown bound/diagnosis/what-if statements and corresponding JSON summary/simulation verdict fields, and compare each with the retained raw timeline. Record the conflict between the 17h58m model and 17h43m observed graph window, .14 dispatch 08:19:58Z before .20 creation 08:27:13Z, unknown readiness, 14h26m wait and 83% no-agent time.

2. Qualify the named Markdown and matching JSON interpretation fields as model estimates with explicit assumptions and inconsistency/unknown-topology limits, unless exact retained evidence substantiates a stronger claim. Remove unsupported assertions that the chain established a causal lower bound or task parallelism alone established the bottleneck cause. Preserve planning context and the distinct all-agent/task-slot meanings.

3. Verify JSON parses and compare all raw timeline/evidence/source-snapshot subtrees before/after for byte or structural equality. Read the Markdown/JSON statements side by side and check each named number and timestamp remains supported and consistently qualified. Use a one-off read-only comparison rather than creating a mirrored product test or changing the profiler.

4. Deliverable: only profile-implementation.md and profile-implementation.json interpretation/claim fields change; observations, historical results, source snapshots and uncertainty stay intact. This is a bounded historical claim correction, not a new measurement or acceptance clearance.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

