# Latest Task 19 fix status

Status: FIXED

Committed d604b8a7cf305bddd29ff1ddd0c42c01a108c2bb on task-super-plan-ufz.22, based on 7c3fec35b9e8039576677ff8a5b91ee5135c76e8; tested tree 0c1a61d28b20d557e0664056906edbafaed34d36. Required checks pass: hold-scope 16 scenarios, full replay 2329 passed / 0 failed, digest all tests passed. Invocation 16 startups and startup/builder 126 checks also pass. Full fix details and structured evidence follow the preserved original report in `## Fix pass` below; task-19-fix-evidence-r1 retains complete raw outputs. Caller final/root acceptance remains pending.

---

# Task 19 / super-plan-ufz.22 implementation report

## Delivery and remaining acceptance

Implemented the scoped recovery transport repair and committed it on task-super-plan-ufz.22. This is code delivery with acceptance pending, not an assertion that all required checks pass. The unchanged replay fixture still has its recorded single failure; a fresh review/fix pass owns the now-recorded same-bead fixture amendment.

ledger-digest keeps its existing compact 4096-byte cap and source pointers. Its new --recovery-line N option reads the requested authoritative Recovery record verbatim with a counting header, retaining additive and unknown fields. The existing read-ledger mechanical response can carry recoveryRecords with exact source/line associations and complete counted payloads. Resume validates ownership, association, transport and the existing Recovery schema before reconstructing obligations in ledger order. No additional agent dispatch, role or engine was added. Missing, empty, truncated, malformed, unknown-version or otherwise unresolved payloads leave a visible gap and an admission hold when task scope cannot safely be recovered. A malformed pointer itself also holds admission. Supported matching clears retain their existing semantics.

The focused fixture uses the existing replay driver and executes the emitted real helper command from the existing reader prompt. It proves 173-byte and 5173-byte task-scoped holds behave identically, preserves full additive records, tests a later matching release, malformed clear, affectedIds, unrelated work after scoped recovery, source status distinctions, and unresolved retrieval cases. The oversized and compact controls have exactly the same agent-call set.

## Source and setup

Original task base: 0981f0af2c1c5c0c9fe888ca5bdfa61de50a28ed (tree 90e37bbfed5bfa419d9708d83c73c048aaf3924b).
Final base: 5bfbb92331652df67d9af367f0f81baa8267f020.
Final head: c79e41c260b5958cd50b9ed923435cb041de3bae.
Final clean tested tree: dba2b60460893a3ffa6658ab79d8419e3e58f73f.

The project has no installation step or declared test dependencies. Node is the system interpreter at /opt/homebrew/bin/node; the test runner is this worktree's tests/super-code/replay-harness.mjs and the package source resolves to this worktree's skills/super-code/coordinator.js. No package/source from another checkout was used for final checks. The explicit temporary base checkout was used only for attribution and removed after its process checks passed.

Integration advanced during implementation. Rebase encountered three narrowly resolved coordinator.js conflicts: reader result fields, LEDGER_TEXT schema and readLedgerPrompt. Both .23 invocation identity and .22 recovery facts were retained, including identityStep and recoveryStep in the same existing reader call. Additional .23 caller/startup checks passed on the composed source. .29 source binding was preserved.

## Assumptions and amendments

Read the current bead description/acceptance and comments before implementation; there were initially no amendments or comments. Re-read the bead after the coordinator recorded recovery-fixture-amendment-r1.json and recovery-fixture-assessment-r1.md in the plan workspace. The current bead permits only the specifically named oversized verification-basis fixture and adjacent replacement cases to change. The coordinator explicitly assigned those amendments to a fresh review/fix pass and directed this pass to return its implementation and exact known failure without editing replay-harness.mjs. No blocker bead is required for that already-recorded same-task fix obligation. This pass used that ownership clarification only; it did not claim the amendment's new acceptance cases have been implemented or verified.

A missing source on a genuinely new run retains the existing normal admission behavior. Missing/truncated targeted transport for a known retained Recovery pointer is not equivalent to that new-run state and remains held. No scope is guessed from neighboring Task lines or a foreign source.

## Verification commands and source capture

Every final command ran from the absolute task worktree with the environment below. Required tests were not skipped or weakened. Runtime agents are simulated by these deterministic tests; these records mean live execution of the test commands and helper programs, not real-model instruction compliance.

```text
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents
```

Initial dirty-source snapshots were captured by staging the named task changes and git write-tree. The source-bound RED snapshot used an alternate index, preserving the real index:

```sh
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.22/red.index git -C /tmp/sp-bce79baa/super-plan-ufz.22/base read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.22/red.index git -C /tmp/sp-bce79baa/super-plan-ufz.22/base add tests/super-code/recovery-hold-scope-r1.mjs
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.22/red.index git -C /tmp/sp-bce79baa/super-plan-ufz.22/base write-tree
# 92e6d342ee8cc4ebe4428497be5f9400b9699f65
```

That RED tree contains base product code and the then-current regression. All final records use git rev-parse HEAD^{tree} on clean committed source. Final git status --short and git diff BASE HEAD --check produced no output.

## TDD RED

Command: node tests/super-code/recovery-hold-scope-r1.mjs, base product plus regression, source tree 92e6d342ee8cc4ebe4428497be5f9400b9699f65, exit 1.

```text
173-byte hold preserves its task scope
AssertionError [ERR_ASSERTION]: held task must not dispatch
1 !== 0
```

The compact control passed and the 5173-byte hold dispatched: the exact reported defect. The original before-fix run also failed with this assertion. A later separate RED run added malformed-pointer coverage before its five-line decoder fix; it failed at broken-pointer admission with the same 1 !== 0 assertion. That intermediate RED did not have a separately captured full tree, so it is not presented as a source-bound check record. Assertions after the initial failing assertion did not execute in RED; GREEN below measures them.

## Legacy fixture attribution

The original fixture at replay-harness.mjs:594–610 digests a temporary foreign ledger, deletes it, then supplies only a pointer and expects fresh implementation/review. Its missing payload cannot establish whether that pointer contains a scoped hold, a closure or another obligation. No safe inference permits release. The coordinator's retained assessment confirms the narrow fixture defect and records the required replacement cases.

A retained probe extracts the unchanged verification-only scenario from the original replay harness, uses its normal driver/functions and selects product source from the explicit working directory. The exact same probe command was run against original base and task source:

```sh
node /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.22/.superpowers/task-evidence/verification-base.mjs
```

```text
Original task base tree 90e37bbfed5bfa419d9708d83c73c048aaf3924b:
72 passed, 0 failed
Task tree 7941bd301896a6e28d6bc0909563cfd315a3d0eb:
[FAIL] ready reentry with missing basis obtains independent verification review before closure
71 passed, 1 failed
```

This is an observed change in behavior caused by the conservative admission repair, not a claim that the failure predates the task. The original task-base comparison is not a run-start baseline measurement. The amended legacy fixture remains unmodified here and acceptance remains pending.

## Focused final

Command: node tests/super-code/recovery-hold-scope-r1.mjs. Final tree, exit 0.

```text
173-byte hold preserves its task scope
5173-byte hold preserves its task scope
16 recovery hold-scope scenarios passed
```

## Replay final

Command: node tests/super-code/replay-harness.mjs. Final tree, exit 1.

```text
[FAIL] ready reentry with missing basis obtains independent verification review before closure
2294 passed, 1 failed
```

The suite also executes its documented canonical, fix-pass-blocked and parked dryRun scenarios; they passed without changed snapshot/count assertions. The pre-rebase version reported 2276 passed, 1 failed; after .23 composition it reports 2294 passed, 1 failed. Neither result is clean task acceptance.

## Digest final

Command: bash tests/super-code/test-run-digest.sh. Final tree, exit 0.

```text
run-digest: all tests passed
```

One early unchanged digest run missed its initial expected open-beads line. The same command passed at original task base, passed on task-source repetition, passed after final pre-rebase changes and passed after rebase. No digest test or related product code was changed to affect that line. The earliest failing run lacked a complete captured tree; its log is retained, and no causal or blanket pre-existing/flaky classification is asserted.

## Invocation start seam

Command: node tests/super-code/invocation-start-r1.mjs. Final tree, exit 0.

```text
PASS: omitted-ID and explicit startup, distinct artifacts, resume, missing/unsafe identity, persistence gap, transport retry, recorded-result replay (16 startups; Workflow-like sandbox; mechanical agent simulated)
```

## Startup builder seam

Command: node tests/super-code/startup-builder-seam-r1.mjs. Final tree, exit 0.

```text
PASS: 126 startup/builder seam checks; real CLI, both Launch forms, all ordinary modes, strict review gates, no startup or ledger/artifact mutation
```

## Test hygiene

No match: or survived: lines were returned by the task-root checks or final stop sweep. No background process remains owned by this task. Tests used /tmp/sp-bce79baa/super-plan-ufz.22 with isolated HOME and XDG homes. The first leak-check invocation ran inside its protected root and was refused by the helper's ancestor safety guard (exit 2); rerunning from /tmp succeeded, and every later check ran from /tmp. This was a helper safety guard, not an authorization refusal. The task-owned temporary baseline worktree was removed without force after checks passed. No Herdr mutation, stash, integration write, merge, push, full-suite run or root closure occurred.

The exact check/stop command is bash <integration>/skills/super-code/scripts/stop-run-processes [--check] <task-worktree> /tmp/sp-bce79baa/super-plan-ufz.22, invoked from /tmp; final check and stop both exited 0 with no output.

## Retained raw logs

Raw outputs and the narrow probe remain under this task worktree's .superpowers/task-evidence/: red-source-bound.log, malformed-pointer-red.log, focused-rebased.log, replay-rebased.log, digest-rebased.log, invocation-start-rebased.log, startup-builder-rebased.log, legacy-fixture-base.log and legacy-fixture-task.log. Relevant output excerpts are retained above in this durable plan-workspace report; evidence locations below refer to those report sections so they survive eventual task-worktree cleanup.

## Files changed

- skills/super-code/coordinator.js
- skills/super-code/scripts/ledger-digest
- tests/super-code/recovery-hold-scope-r1.mjs

No specification, frozen historical evidence or legacy replay fixture was edited by this pass.

## Concerns

- The unchanged rebased replay suite reports 2294 passed, 1 failed: ready reentry with missing basis obtains independent verification review before closure. This is not clean completion evidence.
- The same-bead recovery-fixture amendment is recorded, but its bounded replay-fixture edits and replacement verification belong to the fresh review/fix pass; this implementation did not modify replay-harness.mjs.
- Caller-owned changed-instruction evaluation, final sweep, independent review, task acceptance, and root/human acceptance remain pending.
- Targeted Recovery payloads preserve complete unknown/additive fields and may remain large. If their existing-reader transport fails, admission remains conservatively held; no extra reader agent dispatch is added.

## Complete structured result and source-bound records

```json
{
  "id": "super-plan-ufz.22",
  "status": "IMPLEMENTED",
  "completionKind": "implementation",
  "files": [
    "skills/super-code/coordinator.js",
    "skills/super-code/scripts/ledger-digest",
    "tests/super-code/recovery-hold-scope-r1.mjs"
  ],
  "base": "5bfbb92331652df67d9af367f0f81baa8267f020",
  "head": "c79e41c260b5958cd50b9ed923435cb041de3bae",
  "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
  "stacked": false,
  "reopened": false,
  "reportFile": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md",
  "acceptancePending": true,
  "concerns": [
    "The unchanged rebased replay suite reports 2294 passed, 1 failed: ready reentry with missing basis obtains independent verification review before closure. This is not clean completion evidence.",
    "The same-bead recovery-fixture amendment is recorded, but its bounded replay-fixture edits and replacement verification belong to the fresh review/fix pass; this implementation did not modify replay-harness.mjs.",
    "Caller-owned changed-instruction evaluation, final sweep, independent review, task acceptance, and root/human acceptance remain pending.",
    "Targeted Recovery payloads preserve complete unknown/additive fields and may remain large. If their existing-reader transport fails, admission remains conservatively held; no extra reader agent dispatch is added."
  ],
  "evidence": [
    {
      "sourceTree": "92e6d342ee8cc4ebe4428497be5f9400b9699f65",
      "command": "node tests/super-code/recovery-hold-scope-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#tdd-red",
      "kind": "live"
    },
    {
      "sourceTree": "90e37bbfed5bfa419d9708d83c73c048aaf3924b",
      "command": "node /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.22/.superpowers/task-evidence/verification-base.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#legacy-fixture-attribution",
      "kind": "live"
    },
    {
      "sourceTree": "7941bd301896a6e28d6bc0909563cfd315a3d0eb",
      "command": "node /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.22/.superpowers/task-evidence/verification-base.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#legacy-fixture-attribution",
      "kind": "live"
    },
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "node tests/super-code/recovery-hold-scope-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#focused-final",
      "kind": "live"
    },
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#replay-final",
      "kind": "live"
    },
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "bash tests/super-code/test-run-digest.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#digest-final",
      "kind": "live"
    },
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "node tests/super-code/invocation-start-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#invocation-start-seam",
      "kind": "live"
    },
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "node tests/super-code/startup-builder-seam-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#startup-builder-seam",
      "kind": "live"
    }
  ],
  "requiredLiveChecks": [
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "node tests/super-code/recovery-hold-scope-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents"
    },
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents"
    },
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "bash tests/super-code/test-run-digest.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents"
    }
  ],
  "humanAction": []
}
```


## Fix pass

canonicalStatus: FIXED

Resolved the independent review's one Important / Missing finding in the specifically named replay fixture and adjacent cases. The source repair delivered by the original implementation remains unchanged. No finding was declined or resolved only through evidence.

### Current requirements and scope

Read current `bd show super-plan-ufz.22 --json` (including description and acceptance), `bd comments super-plan-ufz.22` (none), the amended Task 19 brief, the prior report and review, recovery-fixture-assessment-r1.md and recovery-fixture-amendment-r1.json. The explicit bounded replay exception settles the old unchanged-suite conflict. No schema, scope inference, unknown hold, verification discriminator, source validation, digest-suite, snapshot, specification or historical evidence change was made. The original not-ready missing-basis assertion and pending-closure source/tracker failure assertions remain; their missing-basis input now contains only the valid counted typed completion it actually claims to test.

Before editing, rebased only task-super-plan-ufz.22 from c79e41c260b5958cd50b9ed923435cb041de3bae onto the instructed current integration commit 7c3fec35b9e8039576677ff8a5b91ee5135c76e8. The rebase was clean and produced 5a9843b4dff945688346b200a1b39cbd03ff7bd2, tree 1442e3ffcde702efdae8789ae56513896333dd0e. The inherited .23 invocation identity and .29 captured review source contracts remain composed with the existing reader's recovery transport. There was no integration checkout, branch, tracked-file, ledger-status, Herdr, push or PR mutation.

### Fixture repair

- Kept the real capped helper assertion: actual source-line pointer, typed verification-only discriminator and absence of evidence/live.log in compact text. Kept its deleted foreign-ledger input and added ready replays with no payload and with supplied complete foreign-source payload; both admit zero implementation/review/merge/close-only calls, exclude completion, retain the exact unresolved source/line and stop recovery-held.
- Added an owned integrationWorktree fixture using its actual .superpowers/sdd/bd-100-plan/progress.md. The real helper produces compact and complete counted --recovery-line 1 text while this ledger exists. The existing read-ledger response associates that exact pointer source/line with all original oversized pending-closure bytes, 30 live evidence records, required live checks and additive top-level/nested fields. The reader prompt targets the owned ledger using its legitimate relative path, names the absolute source and adds no recovery dispatch.
- Supplied exact retained source/tracker observations for the only required bead, bd-101: sourceVerified true, landed false, closed [], open [bd-101]. Asserted the captured commit/tree and required bead set in resume-check, reconciliation before close-only, zero impl/review/merge, one close-only, observed closure before completion, preserved evidence/source identity and no remaining resolved transport gap. Unconfirmed closure retains the entire original oversized record. Unavailable, mismatching source, unavailable tracker and contradictory tracker observations retain that record and prevent admission/closure even when a Finish reconciliation claims the bead closed.
- Separated genuinely missing-basis reentry using a valid counted ledger with only `Task 1 (bd-101): complete, verification-only`. Fresh implementation and independent reviewer keep the original source-bound live evidence and requiredLiveChecks. Asserted one implementation, one review, zero merge, one close-only, independent tracker confirmation and durable writing of the newly reviewed basis before closure. An unconfirmed tracker observation cannot complete it; the not-ready missing-basis case retains its evidence gap without inferred completion.

The assertions reject concrete observable breaks: admission with unresolved/foreign payloads; repeated implementation/review after valid recovery; missing/reordered source reconciliation; wrong required bead set; lost retained evidence/additive/source fields; missing durable basis before closure; completion without observed closure; unreleased resolved gaps; and rewriting authoritative ledger bytes. They drive the actual coordinator and real helper, with canned Workflow dispatch responses at the external agent boundary.

### Verification and exact source capture

Before edits, the full replay on the rebased source reproduced the recorded defect: 2294 passed, 1 failed (exit 1). The complete log is retained as fix-replay-before-r1.log. This is a measured rebased task source, not a run-start or task-base exoneration.

The first amended-fixture draft (tree d7e35e1983bede9f930e96dbf1735da94829b134) focused run reported 86 passed, 20 failed (exit 1). It exposed two fixture setup mistakes: the targeted helper truthfully counts the two-line source as `1 of 2`, and the canned planner still reported the default foreign workspace after integrationWorktree was explicitly configured. Corrected the fixture's hand-counted header and planner path, without changing production behavior. The next focused verification-only scenario reported 106 passed, 0 failed (exit 0). Both complete outputs are retained. Later assertions are measured only in that passing focused run and final full replay.

Capture commands in the task worktree were `git add tests/super-code/replay-harness.mjs` and `git write-tree`. They produced draft d7e35e1983bede9f930e96dbf1735da94829b134 and final tested tree 0c1a61d28b20d557e0664056906edbafaed34d36. The real index staged only the named fixture file. After verification, committed d604b8a7cf305bddd29ff1ddd0c42c01a108c2bb and checked `git rev-parse HEAD^{tree}` equals that final tested tree. `git status --short` is empty; `git diff --cached --check` passed before commit. No source was changed after final measurements. The complete fix-only diff is retained as task-19-fixture-fix-r1.diff (74 additions, 5 deletions in one named fixture file); full task source versus the rebased integration consists of the original three-file repair and this one-file test correction.

All commands started from the absolute task worktree. Tests used TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22 and HOME plus XDG_CONFIG_HOME, XDG_DATA_HOME, XDG_CACHE_HOME and XDG_STATE_HOME beneath that root, exactly as the evidence records specify; Node v26.9.0. Every final named command below completed with exit 0. Full outputs, including every assertion and final exit status, are in task-19-fix-evidence-r1:

```
node tests/super-code/recovery-hold-scope-r1.mjs
173-byte hold preserves its task scope
5173-byte hold preserves its task scope
16 recovery hold-scope scenarios passed
Exit status: 0

node tests/super-code/replay-harness.mjs
2329 passed, 0 failed
Exit status: 0

bash tests/super-code/test-run-digest.sh
run-digest: all tests passed
Exit status: 0

node tests/super-code/invocation-start-r1.mjs
PASS: omitted-ID and explicit startup, distinct artifacts, resume, missing/unsafe identity, persistence gap, transport retry, recorded-result replay (16 startups; Workflow-like sandbox; mechanical agent simulated)
Exit status: 0

node tests/super-code/startup-builder-seam-r1.mjs
PASS: 126 startup/builder seam checks; real CLI, both Launch forms, all ordinary modes, strict review gates, no startup or ledger/artifact mutation
Exit status: 0
```

The full replay covers the existing task/final review source binding and its documented dryRun scenarios without changing their counts or baselines. The two startup seams additionally confirm inherited .23 composition. No full repository suite or real-model instruction evaluation was run.

The optional narrow probe command was `node --input-type=module` with this exact stdin on both draft and final trees (outputs fix-verification-fixture-r1.log and fix-verification-fixture-r2.log):

```js
import { readFileSync } from 'node:fs'
import path from 'node:path'
const source = readFileSync('tests/super-code/replay-harness.mjs', 'utf8')
const prefix = source.slice(0, source.indexOf('async function main() {')).replace('const here = path.dirname(fileURLToPath(import.meta.url))', 'const here = ' + JSON.stringify(path.resolve('tests/super-code')))
const start = source.indexOf("  scenario('live-sim: independently reviewed verification-only")
const end = source.indexOf("  scenario('review source identities:", start)
await import('data:text/javascript;base64,' + Buffer.from(prefix + source.slice(start, end) + '\nconsole.log(`${passes} passed, ${failures} failed`); process.exitCode = failures ? 1 : 0').toString('base64'))
```

### Failure attribution and immutable history

The original eight source-bound evidence records are copied unchanged into the result below. Original report text and its prior IMPLEMENTED/acceptance-pending claims are preserved below the new latest-status header as history. The original raw failed/passing logs were copied before any worktree cleanup to task-19-original-evidence-r1; task-19-fix-evidence-r1 also retains them alongside every new output and cleanup log.

The recorded .22 failure retains its established owner. The original narrow probe's observed failure remains at evidence index 2, with no invented same-command verification or measured run-start/task-base association. The original full replay observed index 4 now links to the actual same-command passing fix at index 12. The newly reproduced rebased full replay observed index 8 also links to verification 12. No failing record was reclassified as pass, simulated evidence, pre-existing or exonerated. Draft fixture setup failure index 9 and passing focused probe index 10 are separately retained; they do not substitute for any required command.

### Test hygiene

After each baseline, draft, focused, required and seam test command, invoked from /tmp:

```
bash /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.22 /tmp/sp-bce79baa/super-plan-ufz.22
```

All checks returned exit 0 with no match lines. The final same-root helper without --check also returned 0 with no survived lines. No background process remains owned by this fixer. Final check/stop results are retained in fix-hygiene-final-r1.log. No authorization refusal or human action remains.

### Files, assumptions and concerns

Fix-only tracked change: tests/super-code/replay-harness.mjs. No product function changed in this pass. The current task amendment explicitly authorizes this named fixture correction. No further assumption was needed. Caller-owned final sweep, independent final acceptance and root/human acceptance remain pending; passing deterministic agent simulations do not claim real-model instruction compliance or root completion.

### Full fix result

```json
{
  "id": "super-plan-ufz.22",
  "status": "FIXED",
  "canonicalStatus": "FIXED",
  "completionKind": "implementation",
  "files": [
    "tests/super-code/replay-harness.mjs"
  ],
  "base": "7c3fec35b9e8039576677ff8a5b91ee5135c76e8",
  "head": "d604b8a7cf305bddd29ff1ddd0c42c01a108c2bb",
  "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
  "reportFile": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md",
  "acceptancePending": false,
  "findingsFixed": [
    "Implemented the bounded oversized verification-basis fixture amendment: authoritative pending-closure reuse, valid missing-basis independent review, unrecoverable-pointer admission hold and supplied foreign-source rejection; preserved helper cap/source discriminator and original negative source/tracker coverage."
  ],
  "amendmentsUsed": [
    "Current bd show super-plan-ufz.22 --json and comments (none)",
    "Task 19 amended brief",
    "recovery-fixture-assessment-r1.md",
    "recovery-fixture-amendment-r1.json"
  ],
  "evidence": [
    {
      "sourceTree": "92e6d342ee8cc4ebe4428497be5f9400b9699f65",
      "command": "node tests/super-code/recovery-hold-scope-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#tdd-red",
      "kind": "live"
    },
    {
      "sourceTree": "90e37bbfed5bfa419d9708d83c73c048aaf3924b",
      "command": "node /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.22/.superpowers/task-evidence/verification-base.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#legacy-fixture-attribution",
      "kind": "live"
    },
    {
      "sourceTree": "7941bd301896a6e28d6bc0909563cfd315a3d0eb",
      "command": "node /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.22/.superpowers/task-evidence/verification-base.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#legacy-fixture-attribution",
      "kind": "live"
    },
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "node tests/super-code/recovery-hold-scope-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#focused-final",
      "kind": "live"
    },
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#replay-final",
      "kind": "live"
    },
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "bash tests/super-code/test-run-digest.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#digest-final",
      "kind": "live"
    },
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "node tests/super-code/invocation-start-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#invocation-start-seam",
      "kind": "live"
    },
    {
      "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
      "command": "node tests/super-code/startup-builder-seam-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-report.md#startup-builder-seam",
      "kind": "live"
    },
    {
      "sourceTree": "1442e3ffcde702efdae8789ae56513896333dd0e",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-fix-evidence-r1/fix-replay-before-r1.log",
      "kind": "live"
    },
    {
      "sourceTree": "d7e35e1983bede9f930e96dbf1735da94829b134",
      "command": "node --input-type=module",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents; stdin=verification-only scenario extraction retained in task-19-report.md Fix pass",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-fix-evidence-r1/fix-verification-fixture-r1.log",
      "kind": "live"
    },
    {
      "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
      "command": "node --input-type=module",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents; stdin=verification-only scenario extraction retained in task-19-report.md Fix pass",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-fix-evidence-r1/fix-verification-fixture-r2.log",
      "kind": "live"
    },
    {
      "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
      "command": "node tests/super-code/recovery-hold-scope-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-fix-evidence-r1/fix-focused-final-r1.log",
      "kind": "live"
    },
    {
      "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-fix-evidence-r1/fix-replay-final-r1.log",
      "kind": "live"
    },
    {
      "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
      "command": "bash tests/super-code/test-run-digest.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-fix-evidence-r1/fix-digest-final-r1.log",
      "kind": "live"
    },
    {
      "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
      "command": "node tests/super-code/invocation-start-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-fix-evidence-r1/fix-invocation-final-r1.log",
      "kind": "live"
    },
    {
      "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
      "command": "node tests/super-code/startup-builder-seam-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-fix-evidence-r1/fix-startup-final-r1.log",
      "kind": "live"
    }
  ],
  "requiredLiveChecks": [
    {
      "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
      "command": "node tests/super-code/recovery-hold-scope-r1.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents"
    },
    {
      "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents"
    },
    {
      "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
      "command": "bash tests/super-code/test-run-digest.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents"
    }
  ],
  "failureAttribution": [
    {
      "failure": "ready reentry with missing basis obtains independent verification review before closure",
      "command": "node /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.22/.superpowers/task-evidence/verification-base.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "observed": 2,
      "introducedBy": "super-plan-ufz.22"
    },
    {
      "failure": "ready reentry with missing basis obtains independent verification review before closure",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "observed": 4,
      "introducedBy": "super-plan-ufz.22",
      "verification": 12
    },
    {
      "failure": "ready reentry with missing basis obtains independent verification review before closure",
      "command": "node tests/super-code/replay-harness.mjs",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.22; HOME=TMPDIR/home; XDG_CONFIG_HOME=TMPDIR/config; XDG_DATA_HOME=TMPDIR/data; XDG_CACHE_HOME=TMPDIR/cache; XDG_STATE_HOME=TMPDIR/state; Node v26.9.0; real helper commands, simulated Workflow agents",
      "observed": 8,
      "verification": 12,
      "introducedBy": "super-plan-ufz.22"
    }
  ],
  "originalEvidenceDirectory": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-original-evidence-r1",
  "fixEvidenceDirectory": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-fix-evidence-r1",
  "fixDiffFile": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-fixture-fix-r1.diff",
  "testHygiene": {
    "leaked": [],
    "survived": [],
    "finalCheckExit": 0,
    "finalStopExit": 0
  },
  "concerns": [
    "Caller-owned final sweep, independent final acceptance and root/human acceptance remain pending. Deterministic replay uses simulated Workflow agents; no real-model instruction compliance is claimed."
  ],
  "humanAction": []
}
```
