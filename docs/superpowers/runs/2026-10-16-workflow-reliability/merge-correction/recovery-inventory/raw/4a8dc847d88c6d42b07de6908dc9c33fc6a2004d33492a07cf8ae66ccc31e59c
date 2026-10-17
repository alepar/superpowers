## Task 8: Preserve distinct invocation review artifacts

**filesTouched:**
- `skills/super-code/SKILL.md`
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/scripts/dispatch-text.mjs`
- `tests/super-code/test-dispatch-text.sh`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`

**Bead:** super-plan-ufz.8.1. **Surface:** 215574 tokens at the integration base.

**Scope:** Invocation identity and artifact bundle production only. Extraction, outstanding-finding projection and super-auto collection are separate .8 children.

**Interfaces:** runTag remains the enclosing run. Add invocationId to the existing launch record and args/ordinary dispatch contract; persist it before any review output. A resumed unsettled invocation reuses its recorded identity; a newly settled invocation followed by another invocation receives a new one. Use invocationId in single, cluster, seam, stub and assembled final-review paths. reviewPath still points to this invocation's final review only when one was written, else null.

### Acceptance (verbatim)

- [ ] Two invocations sharing runTag retain distinct artifact bundles including split reviews.
- [ ] Invocation identity is persisted before review creation and replayed on resume.
- [ ] reviewPath and null retain existing meanings; both execution paths pass focused fixtures.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add replay and dispatch-text fixtures for two fresh invocations sharing runTag but using distinct invocationId values. Assert disjoint final-review, cluster, seam/stub and assembler directories, then assert a resumed invocation reuses its identity. Cover no-landed-work/null reviewPath, failed writer/null reviewPath, written stub and split review outcomes.
2. Run the failing fixtures before edits. Test artifact retention by writing two small synthetic bundles to distinct paths and checking the earlier contents remain unchanged; do not rely only on string assertions for overwrite protection.
3. Extend coordinator.js resolved args/Launch: args and ordinary launch protocol to require or mint a fresh per-invocation token at the caller boundary. Persist launch identity and wait for confirmed persistence before dispatching review/artifact creation; an unavailable identity write is an explicit gap and cannot authorize overwriting a prior bundle. Reuse only an explicitly resumed launch identity, never the last settled identity solely because runTag matches.
4. Replace final-review and assembled-final paths derived only from runTag with the persisted invocationId across single/cluster/seam/stub branches and dispatch-text.mjs. Validate filesystem-safe tokens and keep all artifacts inside the existing plan workspace. Do not reinterpret result.reviewPath or manufacture a review when no work landed.
5. Document token mint/resume ownership and new dispatch fields in super-code/SKILL.md and both execution references. Follow the nested spec's source identity contract. Do not add super-auto collection/projection edits or an external roast ledger here; a downstream consumer can archive the immutable bundle under its original identity.
6. Use writing-skills for operative protocol changes, run replay/dispatch tests below, and commit the artifact identity contract plus overwrite/resume fixtures. Report exact path pattern and launch field to the following .8 planner.

Run:

```bash
bash tests/super-code/test-dispatch-text.sh
node tests/super-code/replay-harness.mjs
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** Repeated invocations retain independent immutable review bundles, resume uses the original identity, and reviewPath/null behavior remains compatible.

