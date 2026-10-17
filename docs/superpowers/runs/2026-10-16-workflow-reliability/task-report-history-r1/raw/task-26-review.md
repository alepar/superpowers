# Task 26 independent review — super-plan-ufz.29

Status: CLEAN
Base: 1d0ab308f09598c8c2826cfbca2af119a631d37a
Head: 7db21aaec321ce133ad792f9ffc0e05879e4cf40

## Spec compliance

✅ Current `bd show super-plan-ufz.29 --json` and `bd comments super-plan-ufz.29` read: acceptance matches the brief; no comments or amendments. Frozen task 26 brief, implementation report, parent reliability spec, finding-continuity design, and relevant progress entries read. No conflicting requirement found.

✅ The existing Recovery record carries immutable invocationId/base/head before output writers. Finish reuses the compact persisted source, and the authoritative producer guard rejects mismatched source, unbound partial bundles and existing output paths. The first assembly creates the binding; cluster/seam/single/stub guards reread it. No new agent, engine or finding lifecycle introduced.

✅ The regression preserves finding-bearing cluster, assembly digest and direct package bytes on same-ID advance/resume and checks original source prompts, explicit mismatch refusal, new identity capture, absent launch persistence and unavailable/confirmed reviewPath behavior. It executes real source guards emitted by real builders while agent replies and remaining writer steps are simulated, as disclosed.

✅ Both operative coordinator documents carry the binding and refusal/fallback contract. Fresh live changed-instruction evaluation is caller-owned and pending per brief and progress, not supplied by the fixture or this review. This review does not release caller acceptance, final sweep or root/human acceptance.

## Issues

Critical: none.
Important: none.
Minor: none.

## Reachability and focused source checks

Risk: persisted binding might be omitted by compact ledger reads. Checked captured `ledger-digest`: Recovery records are retained verbatim under its existing size cap; the new small record fits, and the coordinator reads Resume/Finish facts before selecting final source. The helper rereads the full ledger before writer authorization.

Risk: one writer or ordinary caller might still omit source or overwrite partial outputs. Traced Finish -> assemblePrompt -> reviewWriteGuard -> dispatch-text bind-review-source; checked single, cluster, seam and stub sibling builders, and ordinary dispatch-text final-review/assemble calls. All use the shared guard and source pair. Assembler source refusal stops direct fallback; ordinary assembler failure retains fallback. Refused seam/cluster writes preserve files with unconfirmed paths remaining null as applicable.

Risk: malformed/conflicting source facts might silently select the newest head. Checked coordinator's recoveryProblem/source loop and helper's Launch/Recovery comparison: valid matching facts retain the old pair, conflict refuses output. Launch-only binding can cause Workflow refusal rather than recapture; refusal is allowed by acceptance.

The adjacent .23 startup fix is absent from this captured tree and was not required here. The separate combined-tree startup-builder seam assessment remains separately applicable; no claim is made that this review validates that combined integration.

## Review commands and identity isolation

All source reads used captured `git show 7db21aae:<path>` and `git diff 1d0ab308..7db21aae`, never mutable checkout source. No product tests, reproductions, source writes, tracker mutations, Herdr actions, checkout changes or detached worktree were performed. Report/brief/current requirements/progress are task control records, not substituted product source.

`git merge-base --is-ancestor 1d0ab308f09598c8c2826cfbca2af119a631d37a 7db21aaec321ce133ad792f9ffc0e05879e4cf40` passed. Each captured commit resolved with its own `git rev-parse --verify <sha>^{commit}`. An initial combined two-operand --verify command returned 'Needed a single revision'; corrected independent checks both passed.

`bash <SDD_SCRIPTS>/review-package <PLAN_FILE> 1d0ab308f09598c8c2826cfbca2af119a631d37a 7db21aaec321ce133ad792f9ffc0e05879e4cf40 <DIFF_FILE>` passed: one commit, 254512-byte package; named initial diff generated and inspected along with focused Git diffs. Package contains 11 changed files.

## Test evidence

Retained evidence inspected with captured Git reads. Focused command `node tests/super-code/invocation-source-binding-r1.mjs`: 11 scenarios passed. Unchanged `node tests/super-code/replay-harness.mjs`: 2277 passed, 0 failed. Unchanged `bash tests/super-code/test-dispatch-text.sh`: all tests passed. RED log records the intended missing-durable-source assertion failure. It does not establish later assertions ran before the fix.

The final measurement tree b92dfaf4bbf2e897fe1b190a435e0a872564916e resolves. `git diff --stat b92dfaf4bbf2e897fe1b190a435e0a872564916e 7db21aae^{tree}` shows only six retained evidence additions: reviewed source, instructions and regression match the tested snapshot. The local command executions are live; canned agent replies are not fresh live-agent evaluations. Evidence is plausible for mechanical acceptance with exactly that limitation.

Test changes inspected using both `git diff --stat 1d0ab308..7db21aae -- <TEST_PATHSPECS>` and `git diff 1d0ab308..7db21aae -- <TEST_PATHSPECS>`, where TEST_PATHSPECS were the full dispatch list ('tests/**', 'test/**', 'spec/**', '**/tests/**', '**/test/**', '**/spec/**', '*_test.*', '*.test.*', 'test_*.*', '*_spec.*', '*.spec.*', '**/*_test.*', '**/*.test.*', '**/test_*.*', '**/*_spec.*', '**/*.spec.*'). Both succeeded; one new 172-line regression, no existing tests weakened/deleted/skipped. No tests were rerun.

## Check records

The following original records are preserved without relabeling. Both required local checks have matching live/pass records. Their scope is deterministic mechanics, not instruction behavior. Capture commands and environment prefix are retained verbatim below.

```json
{
  "evidence": [
    {
      "sourceTree": "9e544a4b64d593c254cef710d0fb55ff862cff38",
      "command": "node tests/super-code/invocation-source-binding-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; real builders/helper; injected coordinator agent replies; original RED fixture",
      "outcome": "fail",
      "location": "evidence/super-plan-ufz.29/red.log",
      "kind": "live"
    },
    {
      "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
      "command": "node tests/super-code/invocation-source-binding-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; real builders/helper; injected coordinator agent replies",
      "outcome": "pass",
      "location": "evidence/super-plan-ufz.29/focused-final.log",
      "kind": "live"
    },
    {
      "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; unchanged replay; canned agent replies plus real helper fixtures",
      "outcome": "pass",
      "location": "evidence/super-plan-ufz.29/replay-final.log",
      "kind": "live"
    },
    {
      "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
      "command": "bash tests/super-code/test-dispatch-text.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; unchanged ordinary-dispatch callers; real CLI and prompt builders",
      "outcome": "pass",
      "location": "evidence/super-plan-ufz.29/dispatch-final.log",
      "kind": "live"
    }
  ],
  "requiredLiveChecks": [
    {
      "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
      "command": "node tests/super-code/invocation-source-binding-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; real builders/helper; injected coordinator agent replies"
    },
    {
      "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; unchanged replay; canned agent replies plus real helper fixtures"
    }
  ],
  "captureCommands": [
    "cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.29",
    "mkdir -p /tmp/sp-bce79baa/super-plan-ufz.29",
    "GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.29/red.index git read-tree HEAD",
    "GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.29/red.index git add tests/super-code/invocation-source-binding-r1.mjs",
    "GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.29/red.index git write-tree # 9e544a4b64d593c254cef710d0fb55ff862cff38",
    "GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.29/final.index git read-tree HEAD",
    "GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.29/final.index git add skills/super-code/coordinator.js skills/super-code/coordinator-workflow.md skills/super-code/coordinator-subagents.md skills/super-code/scripts/dispatch-text.mjs tests/super-code/invocation-source-binding-r1.mjs",
    "GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.29/final.index git write-tree # b92dfaf4bbf2e897fe1b190a435e0a872564916e"
  ],
  "executionPrefix": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29",
  "scope": "Live local test-command execution. Workflow replies are simulated; no fresh live-agent behavior evaluation is claimed."
}
```

## Failure attribution

`failureAttribution: []`. Relevant progress entries record usage-limit recovery and pending caller evaluation, but no recorded run-failure ownership association requiring adjudication. The retained RED demonstrates this defect; it is not a measured run-start baseline or a full task-base exoneration record. No unsupported association or run-owner release inferred.

## Structured result

```json
{
  "id": "super-plan-ufz.29",
  "status": "CLEAN",
  "base": "1d0ab308f09598c8c2826cfbca2af119a631d37a",
  "head": "7db21aaec321ce133ad792f9ffc0e05879e4cf40",
  "finding": "",
  "minors": [],
  "evidence": [
    {
      "sourceTree": "9e544a4b64d593c254cef710d0fb55ff862cff38",
      "command": "node tests/super-code/invocation-source-binding-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; real builders/helper; injected coordinator agent replies; original RED fixture",
      "outcome": "fail",
      "location": "evidence/super-plan-ufz.29/red.log",
      "kind": "live"
    },
    {
      "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
      "command": "node tests/super-code/invocation-source-binding-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; real builders/helper; injected coordinator agent replies",
      "outcome": "pass",
      "location": "evidence/super-plan-ufz.29/focused-final.log",
      "kind": "live"
    },
    {
      "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; unchanged replay; canned agent replies plus real helper fixtures",
      "outcome": "pass",
      "location": "evidence/super-plan-ufz.29/replay-final.log",
      "kind": "live"
    },
    {
      "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
      "command": "bash tests/super-code/test-dispatch-text.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; unchanged ordinary-dispatch callers; real CLI and prompt builders",
      "outcome": "pass",
      "location": "evidence/super-plan-ufz.29/dispatch-final.log",
      "kind": "live"
    }
  ],
  "requiredLiveChecks": [
    {
      "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
      "command": "node tests/super-code/invocation-source-binding-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; real builders/helper; injected coordinator agent replies"
    },
    {
      "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; unchanged replay; canned agent replies plus real helper fixtures"
    }
  ],
  "failureAttribution": [],
  "reviewFile": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-26-review.md",
  "instructionEvaluation": "caller-pending"
}
```
