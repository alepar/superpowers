## Task 1: Pin review inputs and isolate mutable reproductions

**filesTouched:**
- `skills/super-roast/SKILL.md`
- `skills/super-roast/scout-prompts-pr.md`
- `skills/super-roast/judge-seat-prompts.md`
- `skills/super-roast/scripts/assemble-args.mjs`
- `skills/super-code/coordinator.js`
- `skills/super-code/task-reviewer-prompt.md`
- `skills/super-code/scripts/dispatch-text.mjs`
- `skills/super-code/assembler-prompt.md`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-roast/test-assemble-args.sh`
- `tests/super-code/test-dispatch-text.sh`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/subagent-driven-development/scripts/review-package`

**Bead:** super-plan-ufz.1. **Surface:** 229403 tokens at the integration base.

**Scope:** Stable source identities and isolated review-owned writes across task/final and adversarial reviews. Leave finding ledgers, roast triggers and redesign/amend policy to their owners.

**Interfaces:** Capture a verified base/head SHA pair before review dispatch, carry it in existing launch/dispatch inputs, and use it for diffs and source reads. runTag/invocation naming is owned separately by Task 8; this task only consumes a supplied artifact destination.

### Acceptance (verbatim)

- [ ] A review remains pinned to its captured SHAs while the caller integration branch advances.
- [ ] A reproduction that writes files leaves the caller checkout and another review's mutable outputs untouched.
- [ ] A changed caller checkout is reported with evidence without attributing damage solely from before/after differences or restoring the old snapshot.
- [ ] The coordinator records representative fresh-agent evaluation of changed review instructions; deterministic input/dispatch fixtures pass.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add failing dispatch/assembler fixtures using a temporary Git repository: capture base/head, advance the caller branch, regenerate the review prompt, and assert its diff and source reads still name the captured commits. Extend replay's oneTaskCanned/live-sim fixtures with an explicit implementation head; test task, final single/cluster/seam and roast PR inputs. Use two review-owned directories for a mutating reproduction and assert caller files plus the other directory remain byte-identical.
2. Run the focused shell suites below and record the failing assertions before editing producers. For coordinator mechanics, add the failing replay scenario first; the known baseline is 1770 passing assertions at unchanged source d84541ae, so there is no need to rerun the unmodified full baseline.
3. In assemble-args.mjs resolve PR base/head once with git rev-parse --verify <ref>^{commit}; compute its diff/stat and every rendered source command from those identities, rejecting unresolved inputs. In coordinator.js carry verified implementation/final-review head and base into taskReviewPrompt, finalReviewPrompt, finalClusterReviewPrompt and finalSeamReviewPrompt. The assembler takes fixed BASE/HEAD, and opening source uses git show <head>:<path> or the review-owned detached worktree. dispatch-text must supply the same values as Workflow, with explicit SHA options/launch values rather than re-resolving moving refs inside a reviewer.
4. Replace mutable HEAD/branch reads in task-reviewer-prompt.md and the relevant roast/assembler protocol blocks with the captured identities. If a filesystem view is necessary, create a unique review-owned detached worktree at the captured head; mutable reproductions also get their own output/temp directory. Preserve task review's existing no-test-run policy. Permit writes only to declared review artifacts and review-owned resources; never checkout/reset/restore the caller. A caller before/after comparison reports observed commits/status and unexplained differences without assigning causality from difference alone.
5. Update ordinary-subagent/Workflow invocation instructions only where new SHA parameters and review-resource ownership must cross the existing interface. Follow writing-skills for changed operative instruction text. Prepare the advancing-integration/two-reproductions scenario and evidence pointers for the enclosing coordinator's fresh-agent evaluation; do not create another evaluation agent or stronger generic judgment prose.
6. Run the tests below. Inspect the actual generated prompts and diff for any remaining mutable review range; fix and rerun affected checks. Commit only the task's implementation and fixtures, recording changed interfaces and evaluation still owned by the coordinator.

Run:

```bash
bash tests/super-roast/test-assemble-args.sh
bash tests/super-code/test-dispatch-text.sh
node tests/super-code/replay-harness.mjs
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** Review builders and ordinary dispatch emit captured source identities; deterministic advancing-branch and isolated-output fixtures establish stability and caller preservation.

