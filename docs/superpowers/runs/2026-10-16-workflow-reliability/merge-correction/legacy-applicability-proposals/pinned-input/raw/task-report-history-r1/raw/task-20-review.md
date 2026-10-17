# Task 20 review — super-plan-ufz.23

Verdict: NEEDS_FIX

## Spec compliance

❌ The global requirement to preserve Workflow and ordinary-subagent paths is not satisfied: ordinary dispatch builder rendering now aborts (Important issue below).

✅ The bounded Workflow startup repair implements external identity acquisition through the existing Resume read-ledger dispatch, safe-token validation, explicit-ID preservation, retry selection, and the existing awaited Launch acknowledgment. It adds no startup dispatch, clock/random fallback, or replacement engine. The two guidance files distinguish fresh launch, explicit unsettled resume, and settled relaunch.

✅ Applied amendments: current `bd show super-plan-ufz.23 --json`, corrected Task 20 brief/plan, and `fixture-amendment-r1.json` explicitly authorize only the named omitted-ID replay tail to receive fresh-a/fresh-b boundary tokens and strengthened identity/persistence/path assertions. `bd comments super-plan-ufz.23` returned no comments. The diff preserves its prior ledger and omitted args; no unrelated scenario, runtime default, expected dispatch count, skip, or loosened assertion was changed. The explicit-resume added no-mint assertion is compatible with the amendment's requirement. Separate captured-source binding remains .29-owned; no combined repair is assumed.

⚠️ Fresh-agent changed-instruction evaluation remains pending with the enclosing coordinator, exactly as the amended acceptance permits. Root sweep/human acceptance remain pending and are not cleared by this review.

## Issues

### Critical

None.

### Important

skills/super-code/coordinator.js:745 (caller: skills/super-code/scripts/dispatch-text.mjs:101-111,133-135): New required Resume identity aborts ordinary non-review builder rendering. loadBuilders executes startup with a null-returning agent, while its caller forwards the persisted ID only for reviewOutput. Thus implement, task review, verification-close, fix, seam/check-fix review, merge, plan, triage, check-evidence and non-final assembly throw before producing output, including current ledgers with valid IDs. Preserve strict live startup and separate internal builder initialization from operational Resume/Launch; forward genuine selected-Launch IDs consistently and retain identity-free legacy non-review rendering without minting or fabricating tokens. Keep persisted-ID review gates strict. Verify the actual ordinary dispatch suite plus both startup/replay checks on the integrated fix.

The report itself acknowledges the confirmed caller failure. Parent direction to leave dispatch-text untouched bounds the implementation scope; it does not waive the global preservation requirement or make the captured tree safe to integrate. The separate `startup-builder-seam-assessment-r1.md` recommends a follow-on seam repair but supplies neither delivered code nor passing verification. A genuine ID handoff repairs current-ID ledgers only; legacy identity-free non-review builder loading also needs separation from operational startup. Do not weaken live Resume validation, add synthetic identities, or treat a CLI override as persisted identity.

### Minor / deferred coverage

[missing-evidence] skills/super-code/coordinator-workflow.md:72 and skills/super-code/coordinator-subagents.md:155: Fresh-agent changed-instruction evaluation remains explicitly caller-owned and pending; mechanical fixture/replay evidence does not establish agent compliance. This is a deferred coverage warning, not an additional task-local blocker.

## Test evidence

No tests were run by this reviewer, as required by the review policy. Retained implementer logs were read directly:

- `node tests/super-code/invocation-start-r1.mjs`: 16 startups pass, with a Workflow-like VM denying Date.now/Math.random and a simulated mechanical agent invoking external uuidgen. The focused fixture uses real coordinator declarations/startup and exercises selected-token retention, retries, missing/unsafe identities, explicit resume, replayed result and failed persistence. This is credible local command evidence, not live Workflow/fresh-agent evaluation.
- `node tests/super-code/replay-harness.mjs`: 2295 passed, 0 failed; counts 48/19/23 retained. Real scenario coverage includes review assembly/writer persistence gates and null paths beyond the focused fixture's returned builders.
- `bash tests/super-code/test-dispatch-text.sh`: retained fail, exit 1, ordinary classification/review/closure and implement failures; suite terminates before summary when impl-ep.2.md is absent. Later cases are unmeasured. This remains unsatisfied.
- Startup RED shows forbidden Date.now at the original allocation. Hygiene log is empty with exit 0 reported; no leaked process finding is warranted.

Test-change commands (executed read-only in the assigned worktree):

`git diff --stat 1d0ab308f09598c8c2826cfbca2af119a631d37a..b8b46857b723b73817bf6fc82ad1998de60fed74 -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'`

`git diff 1d0ab308f09598c8c2826cfbca2af119a631d37a..b8b46857b723b73817bf6fc82ad1998de60fed74 -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'`

Both exit 0. Two test files: 149 insertions, 4 deletions. The deletions replace only the expressly amended omitted-ID case; assertions are strengthened rather than weakened.

## Captured source and focused reachability check

`git merge-base --is-ancestor 1d0ab308f09598c8c2826cfbca2af119a631d37a b8b46857b723b73817bf6fc82ad1998de60fed74` exited 0; both commits resolve. `git rev-parse b8b46857b723b73817bf6fc82ad1998de60fed74^{tree}` returned 6a82c1133dce4fc3f9e7c7cf5c8f533e8326da06, matching final test evidence. `git status --short` was empty. Source reads used git show at the captured head; no detached filesystem view or product mutation was needed.

Review package command:

`bash /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/skills/subagent-driven-development/scripts/review-package /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/super-plan-ufz-plan.md 1d0ab308f09598c8c2826cfbca2af119a631d37a b8b46857b723b73817bf6fc82ad1998de60fed74 /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-20-review-initial.diff`

Initial sandbox attempt could not write the authorized diff despite script exit 0; retried with approved narrow escalation and verified the readable 40337-byte package, 1 commit, 5 changed files. This permission gap was resolved before review.

Concrete risk examined outside the diff: dispatch-text extracts builders by executing all coordinator initialization before the round loop. Checked captured-head dispatch-text lines 78–136 and coordinator lines 734–754 with `git show ... | nl -ba`. Real CLI parse -> selected last Launch -> conditional reviewOutput config -> loadBuilders AsyncFunction with agent returning null -> Resume null/retry -> line 745 throw proves reachability. Sibling non-review kinds share that loader, so this is not limited to a single implement prompt. `git diff BASE HEAD -- skills/super-code/scripts/dispatch-text.mjs` is empty; task-base coordinator still contains the old random fallback. The new exception and identity deferral create the incompatibility against that unchanged loader.

## Failure attribution

Read progress.md, including round-1 Launch, usage-limit recovery, amended fixture record and Task 20 unresolved-seam entry, plus startup-builder-seam-assessment-r1.md and implementer concerns. The observed failing record below is exact final-tree evidence index 3. Source history and the implementer's explicit diagnosis establish .23 as introducing this particular startup incompatibility. No measured run-start or task-base caller-suite result was supplied; those baseline comparisons remain gaps, not inferred pass results. No fix verification exists; passing startup/replay evidence does not discharge the caller regression. The separate .29 work and a proposed future seam bead do not exonerate or resolve it.

## Check records and structured result

Evidence records below are copied unchanged from the implementer, including live command outcomes for simulated VM/agent configurations. The first two required checks have matching live/pass records and plausible semantic coverage. The caller suite is additionally required to verify the preserved ordinary path and currently has live/fail evidence. Full capture commands (temporary-index RED/final snapshots and committed HEAD tree check) remain in task-20-report.md; this review did not execute or alter those measurements. The RED tree is a temporary-index snapshot including its focused test, not a claim of an unchanged task-base commit.

```json
{
  "id": "super-plan-ufz.23",
  "status": "NEEDS_FIX",
  "finding": "skills/super-code/coordinator.js:745 (caller: skills/super-code/scripts/dispatch-text.mjs:101-111,133-135): New required Resume identity aborts ordinary non-review builder rendering. loadBuilders executes startup with a null-returning agent, while its caller forwards the persisted ID only for reviewOutput. Thus implement, task review, verification-close, fix, seam/check-fix review, merge, plan, triage, check-evidence and non-final assembly throw before producing output, including current ledgers with valid IDs. Preserve strict live startup and separate internal builder initialization from operational Resume/Launch; forward genuine selected-Launch IDs consistently and retain identity-free legacy non-review rendering without minting or fabricating tokens. Keep persisted-ID review gates strict. Verify the actual ordinary dispatch suite plus both startup/replay checks on the integrated fix.",
  "minors": [
    "[missing-evidence] skills/super-code/coordinator-workflow.md:72 and skills/super-code/coordinator-subagents.md:155: Fresh-agent changed-instruction evaluation remains explicitly caller-owned and pending; mechanical fixture/replay evidence does not establish agent compliance. This is a deferred coverage warning, not an additional task-local blocker."
  ],
  "base": "1d0ab308f09598c8c2826cfbca2af119a631d37a",
  "head": "b8b46857b723b73817bf6fc82ad1998de60fed74",
  "sourceTree": "6a82c1133dce4fc3f9e7c7cf5c8f533e8326da06",
  "completionKind": "implementation",
  "evidence": [
    {
      "sourceTree": "e1810a117ad08c4617bdd077797b8532656484ca",
      "command": "node tests/super-code/invocation-start-r1.mjs",
      "configuration": "Node v26.9.0; Workflow-like VM with forbidden Date.now/Math.random; mechanical Resume simulated with external uuidgen; isolated TMPDIR/HOME/XDG under /tmp/sp-bce79baa/super-plan-ufz.23",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.23/.superpowers/task23-evidence/startup-red-resume.log",
      "kind": "live"
    },
    {
      "sourceTree": "6a82c1133dce4fc3f9e7c7cf5c8f533e8326da06",
      "command": "node tests/super-code/invocation-start-r1.mjs",
      "configuration": "Node v26.9.0; Workflow-like VM with forbidden Date.now/Math.random; mechanical Resume simulated with external uuidgen; isolated TMPDIR/HOME/XDG under /tmp/sp-bce79baa/super-plan-ufz.23",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.23/.superpowers/task23-evidence/startup-green.log",
      "kind": "live"
    },
    {
      "sourceTree": "6a82c1133dce4fc3f9e7c7cf5c8f533e8326da06",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "offline documented dryRun plus live-sim canned subagent replies; isolated TMPDIR/HOME/XDG under /tmp/sp-bce79baa/super-plan-ufz.23",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.23/.superpowers/task23-evidence/replay-green.log",
      "kind": "live"
    },
    {
      "sourceTree": "6a82c1133dce4fc3f9e7c7cf5c8f533e8326da06",
      "command": "bash tests/super-code/test-dispatch-text.sh",
      "configuration": "ordinary-subagent dispatch-text caller suite; isolated TMPDIR/HOME/XDG under /tmp/sp-bce79baa/super-plan-ufz.23",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.23/.superpowers/task23-evidence/dispatch-final.log",
      "kind": "live"
    },
    {
      "sourceTree": "6a82c1133dce4fc3f9e7c7cf5c8f533e8326da06",
      "command": "bash skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.23 /tmp/sp-bce79baa/super-plan-ufz.23",
      "configuration": "run from integration worktree outside inspected task roots; check-only",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.23/.superpowers/task23-evidence/hygiene-final.log",
      "kind": "live"
    }
  ],
  "requiredLiveChecks": [
    {
      "sourceTree": "6a82c1133dce4fc3f9e7c7cf5c8f533e8326da06",
      "command": "node tests/super-code/invocation-start-r1.mjs",
      "configuration": "Node v26.9.0; Workflow-like VM with forbidden Date.now/Math.random; mechanical Resume simulated with external uuidgen; isolated TMPDIR/HOME/XDG under /tmp/sp-bce79baa/super-plan-ufz.23"
    },
    {
      "sourceTree": "6a82c1133dce4fc3f9e7c7cf5c8f533e8326da06",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "offline documented dryRun plus live-sim canned subagent replies; isolated TMPDIR/HOME/XDG under /tmp/sp-bce79baa/super-plan-ufz.23"
    },
    {
      "sourceTree": "6a82c1133dce4fc3f9e7c7cf5c8f533e8326da06",
      "command": "bash tests/super-code/test-dispatch-text.sh",
      "configuration": "ordinary-subagent dispatch-text caller suite; isolated TMPDIR/HOME/XDG under /tmp/sp-bce79baa/super-plan-ufz.23"
    }
  ],
  "failureAttribution": [
    {
      "failure": "ordinary-subagent dispatch-text builder initialization aborts on missing Resume invocationId",
      "command": "bash tests/super-code/test-dispatch-text.sh",
      "configuration": "ordinary-subagent dispatch-text caller suite; isolated TMPDIR/HOME/XDG under /tmp/sp-bce79baa/super-plan-ufz.23",
      "observed": [
        3
      ],
      "introducedBy": "super-plan-ufz.23"
    }
  ]
}
```
