# Task 20 / super-plan-ufz.23

Status: IMPLEMENTED, with a confirmed unresolved caller compatibility seam; this is not an acceptance-ready claim for both execution paths.

## Implementation

Omitted invocationId is acquired by the existing read-ledger Resume mechanical dispatch. Its prompt runs uuidgen outside the Workflow VM and returns inv-<trimmed UUID> as structured invocationId. The coordinator validates the token before constructing Launch and awaits the existing structured appended acknowledgment before authorizing review artifacts. Explicit IDs do not request minting. Missing/unsafe acquired IDs throw before Launch or artifact output. Ledger transport reconstruction preserves a valid already selected token and does not request another mint for that retry. No agent/role, dispatch, global escape, engine or identity-only call was added.

Workflow and ordinary-subagent caller instructions describe the external boundary, fresh launch, explicit unsettled resume, settled relaunch, and persistence gating. Only the named omitted-ID tail of the invocation-bundles replay scenario was amended: old ledger text and omitted args remain; fresh-a/single and fresh-b/split supply different mechanical result tokens and verify exact persisted IDs, distinct emitted paths, schema, and startup order. All other scenarios, global defaults, runtime stubs, prior assertions and dispatch counts are unchanged.

## Requirements and assumptions

The live bd show super-plan-ufz.23 --json and bd comments were read; there were no comments. Current Task 20 and explicit fixture-amendment-r1.json supersede the earlier unchanged-fixture restriction, using invocation-fixture-assessment-r1.md's narrow amendment. The task brief was regenerated at its named location. Existing task worktree and branch were reused without discarding work. Base and integration tip both remained 1d0ab308f09598c8c2826cfbca2af119a631d37a, so no rebase or base-branch operation was needed.

The parent expressly directed that dispatch-text.mjs remain untouched after the caller seam was found; the parent owns the fresh seam assessment. Task .29 separately owns captured-source binding. No integration source, root state, status ledger, Herdr membership/message, main branch, merge, push, full-suite sweep, or root/human acceptance was changed.

## Verification and TDD

All commands start with absolute cd to the assigned task worktree; environment for tests was:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.23
HOME=/tmp/sp-bce79baa/super-plan-ufz.23/home
XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.23/config
XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.23/data
XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.23/cache
XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.23/state
```

These variables were passed as environment assignments before each command. Final runs used /usr/bin/time -p immediately before the named interpreter; full output/timing is retained in the evidence locations below.

RED: node tests/super-code/invocation-start-r1.mjs exited 1 on untouched product source, before logging or dispatch: "omitted-ID startup survives forbidden clock/random globals: forbidden Date.now". This is the expected top-level allocation defect. No later assertion in that run is claimed measured. The original startup-red.log was preserved, and a fresh startup-red-resume.log plus temporary-index tree capture retained. On reaching the real dispatch after repair, the inherited fixture exposed its own missing hoisted prompt-builder extraction; the fixture now includes the coordinator's real builder declarations. An intermediate new replay assertion used a helper scoped to a different block; it was corrected locally to a direct label-array comparison before the final run. Neither intermediate failure is presented as passing evidence.

GREEN: node tests/super-code/invocation-start-r1.mjs exited 0 (0.08 seconds):

```text
PASS: omitted-ID and explicit startup, distinct artifacts, resume, missing/unsafe identity, persistence gap, transport retry, recorded-result replay (16 startups; Workflow-like sandbox; mechanical agent simulated)
```

The 16 startups exercise clock/random prohibition, identical prior-ledger/runTag inputs with distinct external UUIDs, persisted-token equality, single/assembly identity, explicit identity/resume, replay of recorded mechanical output, absent/unsafe identity, repaired transport, null retry after valid identity, acquisition after null first dispatch, missing/unsafe retry result, unsolicited replacement rejection, explicit-ID retry, and failed acknowledgment. These are deterministic VM/mechanical boundary simulations, not fresh-agent behavior evaluations or a live Workflow execution.

GREEN: node tests/super-code/replay-harness.mjs exited 0 (28.00 seconds):

```text
[PASS] 48 agent dispatches (got 48)
[PASS] 19 agent dispatches (got 19)
[PASS] 23 agent dispatches (got 23)
2295 passed, 0 failed
```

This replay includes all three documented dryRun scenarios, agent ordering constraints, existing explicit single/split/stub retention, explicit resume, unsafe IDs, persistence-gap suppression, and reviewPath/null checks. No expected count was altered.

FAIL, retained concern: bash tests/super-code/test-dispatch-text.sh exited 1 (0.74 seconds). Non-review builder calls fail before producing their dispatch file; the final excerpt includes "[FAIL] exits 0", expected 0/got 1, and cat reporting no impl-ep.2.md. This is a confirmed caller regression caused by the new fail-closed omitted-ID startup behavior, not an unrelated/pre-existing failure. The suite exits before its final summary, so later tests were unmeasured. See Concerns.

`git diff --check` passed. The task commit's tree exactly matches the final temporary-index snapshot. Evidence kind live refers to actual execution of the named local test commands; it does not claim real dispatched agent/Workflow runtime execution.

## Assertions and pressure limits

A forbidden Date.now/Math.random call fails the first startup. A repeated/borrowed inv-prior token fails fresh equality/inequality checks. A wrong Launch token, shared assembly/review path, reordered/extra startup dispatch, missing identity schema or omitted mint request fails the corresponding real-builder assertion. Replacing explicit identity or requesting minting on explicit resume/retry fails its equality/prompt assertions. Accepting ../escape or a.b, allocating a missing fallback, or appending Launch after missing/unsafe acquisition fails error/trace checks. Dropping inv-selected/inv-before-null during retry or replacing inv-kept with inv-replacement fails the selected-token equality checks. Treating appended:false as confirmed fails invocationPersisted. Replay tests additionally exercise actual assembly/writer suppression and null path semantics rather than only builders.

Combined mechanical pressure scenarios preserve selected identity while ledger transport is malformed, retry is null, or a retry returns a competing token. No pressure result from a fresh instruction-following agent is claimed. Per explicit acceptance, the enclosing coordinator still owns and must measure fresh-agent changed-instruction/interrupted-invocation evaluation. No new agent was spawned.

## Test hygiene

No test leaked a matched process; completed checks from the integration cwd returned 0 with no match lines. An initial check run from the inspected task worktree returned 2 because its safety guard refuses a root containing the caller cwd; re-running from the integration cwd succeeded. Final check output is retained (empty stdout, exit 0). No background server/daemon/watcher was started; the tool sessions for the synchronous replay commands completed. No survived lines or refused permission commands. No cleanup or process names/patterns were used to stop unrelated processes.

## Concerns

1. Confirmed ordinary-subagent caller seam remains unresolved by parent direction: dispatch-text.mjs loadBuilders executes coordinator startup with agent always returning null. Its config currently passes persisted invocationId only for reviewOutput modes. Non-review ordinary-subagent modes therefore now encounter missing identity and throw; the caller suite measures this. The existing fixtures already have persisted identities, but legacy/no-identity compatibility also needs the parent's bounded assessment. The two-path preservation obligation cannot be claimed satisfied until that seam is repaired and tested. dispatch-text.mjs was not edited.
2. Fresh-agent changed-instruction evaluation is caller-owned and pending. Mechanical tests do not establish uuidgen instruction compliance by a real agent, nor real Workflow resume recording semantics.
3. Captured-source binding is task .29-owned. Full suite, independent review, caller acceptance, root closure and human approval remain pending. No baseline exoneration is claimed for the caller failure.

## Files changed

- skills/super-code/coordinator.js
- skills/super-code/coordinator-workflow.md
- skills/super-code/coordinator-subagents.md
- tests/super-code/invocation-start-r1.mjs
- tests/super-code/replay-harness.mjs

## Source capture commands

The real index was preserved. From the task worktree, RED snapshot commands were:

```sh
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.23/red.index git read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.23/red.index git add tests/super-code/invocation-start-r1.mjs
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.23/red.index git write-tree
```

Final snapshot commands were:

```sh
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.23/final.index git read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.23/final.index git add skills/super-code/coordinator.js skills/super-code/coordinator-workflow.md skills/super-code/coordinator-subagents.md tests/super-code/invocation-start-r1.mjs tests/super-code/replay-harness.mjs
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.23/final.index git write-tree
```

Committed source was checked with git rev-parse HEAD^{tree}. It equals the final snapshot; no product/test edits followed final testing.

## Structured result and evidence

```json
{
  "id": "super-plan-ufz.23",
  "status": "IMPLEMENTED",
  "files": [
    "skills/super-code/coordinator.js",
    "skills/super-code/coordinator-workflow.md",
    "skills/super-code/coordinator-subagents.md",
    "tests/super-code/invocation-start-r1.mjs",
    "tests/super-code/replay-harness.mjs"
  ],
  "base": "1d0ab308f09598c8c2826cfbca2af119a631d37a",
  "head": "b8b46857b723b73817bf6fc82ad1998de60fed74",
  "stacked": false,
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
    }
  ]
}
```
