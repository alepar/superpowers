## Task 2: Propagate cleanup uncertainty and retain needed resources

**filesTouched:**
- `skills/super-code/scripts/stop-run-processes`
- `skills/super-code/scripts/remove-task-worktree`
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-auto/run-state.md`
- `skills/super-auto/report-prompt.md`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-auto/scripts/report-status`

**Bead:** super-plan-ufz.2. **Surface:** 208711 tokens at the integration base.

**Scope:** Keep the existing process ownership/matching rules; repair discovery certainty, cleanup ordering and result propagation together.

**Interfaces:** Keep existing stopped:/survived:/kept: lines. Add unknown: <root-or-pid> — <failed inspection> and retained resource facts. Exit 0 means verified completion, 3 means a known survivor or deliberate retention, 4 means inspection/termination is unverified; exit 2 remains bad input. processSweep retains stopped/survived arrays and adds unknown/kept arrays. The resource paths must survive to worktreesKept/run reporting.

### Acceptance (verbatim)

- [ ] Denied discovery or status inspection cannot produce stopped or a verified nothing-running result.
- [ ] A surviving or unverified owned process retains the worktree/temp resources it may still need and those resources are identified in the result.
- [ ] Verified termination permits normal cleanup; deliberately preserved resources remain distinguishable.
- [ ] Unrelated processes remain outside cleanup targets, and code delivery can be reported alongside incomplete cleanup.
- [ ] Signal-safe deterministic denial/survivor fixtures and result-propagation checks pass; the coordinator owns fresh-agent behavior evaluation where instructions changed.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Extend replay-harness.mjs's existing script fixtures with PATH-controlled ps/lsof/kill wrappers in temporary directories. Denial/survivor tests must use inert fake PIDs and fake kill, never signal live user processes. Cover failed initial discovery, failed status-after-signal, signal failure followed by an observable live process, verified disappearance, intentional interactive retention, and an unrelated process. Assert both exit/output and whether the worktree/temp directory still exists.
2. Run the new fixtures before the implementation and retain the failure. For the real-process success case reuse the existing narrowly owned sleeper fixture and its teardown; do not broaden process roots.
3. In stop-run-processes, preserve command status instead of converting discovery and status errors into empty output. Distinguish verified absence from denied/failed inspection (ps exit status alone may need a second successful authoritative enumeration to prove absence). Accumulate unknown facts for incomplete discovery; do not claim stopped for a PID whose status cannot be verified. Keep the current cwd/executable/HOME/TMPDIR/orphan-argument matching and interactive exclusions.
4. In remove-task-worktree replace stop_processes's unconditional success with outcome propagation. Stop and verify all resources to be removed before git worktree remove, branch deletion or rm -rf. A survivor, unknown result or deliberate preservation retains every owned worktree/temp resource it may need, including --discard/--sweep paths; default worktree dirty/unmerged guards still apply. Propagate exit 3/4 without erasing output.
5. Extend coordinator cleanup result parsing, merge/discard/close-only prompts and worktreeSweepPrompt so normal retained/unknown outcomes are data rather than fabricated success. Preserve code-delivery completion separately from cleanup completion. Missing dispatch, scriptError and missing processLines are explicit unknowns; never interpret them as a verified empty sweep. Update ordinary-subagent instructions, run-state fields and report-prompt Remaining sources to carry the same arrays and resource identities.
6. Add replay fixtures for a successful landing with unknown cleanup, known survivor, deliberate retention, complete verified cleanup and unavailable sweep dispatch. Assert completed code can coexist with retained cleanup obligations. Use writing-skills for the changed caller protocol and prepare the denied-inspection acceptance scenario for the coordinator-owned evaluation. Run the suite below after changes and commit the bounded fix.

Run:

```bash
node tests/super-code/replay-harness.mjs
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** A denied or surviving process can no longer lose its workspace, and Finish/reporting distinguish known survivors, unknown inspection, deliberate retention and verified cleanup.

