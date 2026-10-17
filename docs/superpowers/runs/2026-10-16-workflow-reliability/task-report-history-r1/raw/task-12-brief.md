## Task 12: Complete reviewed verification-only tasks without artificial commits

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/implementer-prompt.md`
- `skills/super-code/task-reviewer-prompt.md`
- `skills/super-code/scripts/dispatch-text.mjs`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/replay-harness.mjs`
- `tests/super-code/test-dispatch-text.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/subagent-driven-development/scripts/review-package`
- `skills/super-auto/run-state.md`

**Bead:** super-plan-ufz.13. **Surface:** 214852 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Allow acceptance-supported verification-only completion with unchanged HEAD, while retaining all implementation-task delivery and invalid-review protections.

**Interfaces:** Consume the exact source-bound evidence transport from .5. Make the verification-only intent explicit in the existing task outcome and dispatch inputs; a reviewer must confirm that intent against the bead acceptance, matching source tree and required check kind. Add only the minimal additive discriminator/result routing needed. Use a distinct evidence-review path before the nonempty-diff package guard; preserve review-package guards for implementation reviews and do not weaken them globally.

### Acceptance (verbatim)

- [ ] Verification-only unchanged-HEAD task completes on reviewed acceptance evidence, without an artificial commit (needs: super-plan-ufz.5).
- [ ] An implementation task still requires delivered-change evidence.
- [ ] Outcome fixtures pass; coordinator owns representative fresh-agent no-change evaluation.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add failing live-sim cases for an explicitly verification-only bead with unchanged base/head and complete live/pass evidence accepted by a reviewer; the same outcome rejected for an implementation bead; missing/stale/fallback evidence for a required live check; and null/INVALID review. Assert a successful verification case dispatches review and closure, completes with no merge or ensure-commit dispatch, and writes durable evidence-backed completion without incrementing task landings. Retain the existing empty-range implementation INVALID and missing-commit tests.
2. Add ordinary dispatch fixtures carrying the same verification intent and evidence references through implement and review. Run `bash tests/super-code/test-dispatch-text.sh` and `node tests/super-code/replay-harness.mjs` before implementation. Use the actual additive .5 evidence fields; source tree and reviewer coverage are checked, never inferred from an unchanged branch alone.
3. Extend the existing RESULT/report contract minimally for an explicit verification-only outcome. Verify the declared task acceptance permits no-change verification. In the unchanged-head routing, send that outcome to evidence review instead of ensure-commit or nonempty-diff packaging; implementation outcomes keep their current commit recovery and invalid-package protections. The alternate review reads the bead/brief, fixed source identity and evidence and emits the existing review verdict with the evidence basis; no tests are rerun by the reviewer.
4. On accepted verification, use existing tracker status/closure confirmation, ledger/result completion and cleanup paths without a synthetic Git merge or commit. Preserve unavailable closure/cleanup results as their actual facts; retain review identity/evidence in durable completion so resume reuses the verified work. Rejected or absent review cannot count complete. Keep terminal buckets and fixed/regression history compatible with .4/.5 consumers.
5. Update implementer/reviewer templates and both execution references, plus dispatch-text plumbing only where it transports this discriminator/evidence. Keep review-package read-only for this task by choosing the evidence-review branch before calling it. Use writing-skills, prepare the no-change/implementation contrast for parent-owned behavior evaluation, run both named suites, and commit.



Run:

```bash
bash tests/super-code/test-dispatch-text.sh
node tests/super-code/replay-harness.mjs
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** Verification-only no-change tasks complete only after acceptance review of source-bound evidence, while implementation tasks still require delivered change.

