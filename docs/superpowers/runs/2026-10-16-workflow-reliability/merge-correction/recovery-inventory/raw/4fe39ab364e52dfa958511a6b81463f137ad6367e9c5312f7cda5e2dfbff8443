## Task 26: Bind resumed review invocations to immutable captured source

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/scripts/dispatch-text.mjs`
- `tests/super-code/invocation-source-binding-r1.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `skills/super-code/assembler-prompt.md`
- `skills/super-code/scripts/ledger-digest`
- `tests/super-code/replay-harness.mjs`
- `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-13.md`

**Bead:** super-plan-ufz.29. **Surface:** 250089 tokens at the integration base.

**Scope:** Persist each invocation's captured source identities before producing review artifacts and preserve its partial bundle on unsettled resume; advancing integration must never reuse that identity to overwrite findings with a different source.

### Covered findings (verbatim)

- [Must-fix] [P1; cluster 13] `skills/super-code/coordinator.js:2256`: bind each persisted invocation identity to captured source before writing review artifacts and preserve existing partial contents on unsettled resume. The cluster's real-builder replay reused `final-review-resume-same.cluster-1.md` and the assembly path with heads `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` then `cccccccccccccccccccccccccccccccccccccccc`; persisted Launch records retained neither source binding. Findings can disappear after integration advances. Source evidence: cluster-13.md and its retained probe `/private/tmp/ufz-cluster13-review-612ea0a7-20261017/tests/super-code/.cluster13-resume-probe.mjs`; preserve a finding-bearing partial artifact through advance/resume and test it.

### Acceptance (verbatim)

- [ ] A finding-bearing partial cluster artifact survives advance/resume with the same persisted invocation ID and original source binding.
- [ ] Persisted Launch/recovery facts retain captured base/head before artifact writes; same-ID mismatched source is refused or reconciled without overwriting existing partial inputs.
- [ ] Single, split, seam and stub review paths plus current reviewPath/null semantics retain the invocation/source binding on supported execution paths.
- [ ] The focused real-builder resume fixture and unchanged coordinator replay pass; no new engine, finding lifecycle or identity-cause conflation.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Create tests/super-code/invocation-source-binding-r1.mjs using the real final-review prompt builder and existing replay harness conventions. Launch a persisted invocation at head bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb, leave a finding-bearing partial cluster/package/assembly bundle, advance integration to cccccccccccccccccccccccccccccccccccccccc, and resume the same unsettled ID. Assert the original bytes and captured source survive. Observe the current overwrite before repairing it.

2. Persist the invocation's captured base/head before authorizing assembly/review artifact writes using existing Launch/recovery facts; reread those durable facts on resume. Reuse the original source binding for an unsettled invocation, or explicitly refuse/reconcile a mismatched source without overwriting its partial artifacts. A fresh source capture requires a fresh identity, and missing binding is a named evidence gap.

3. Carry that binding through coordinator.js, dispatch-text and the existing Workflow/ordinary caller instructions for single, split, seam and stub paths. Preserve current reviewPath/null semantics and existing partial cluster content when a seam/cluster dispatch is unavailable. Do not derive findings from silence or redesign finding states.

4. Extend the focused fixture with persisted-source visibility before writes, same-ID mismatched-source refusal/reconciliation, fresh-ID new source, missing persistence, and each review mode's source/path arguments. Use superpowers:writing-skills for operative instruction changes and return bounded behavior evaluation to the coordinator as pending.

5. Run node tests/super-code/invocation-source-binding-r1.mjs and node tests/super-code/replay-harness.mjs unchanged. Deliverable: an invocation cannot overwrite a finding-bearing partial bundle by silently changing the reviewed source on resume.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

