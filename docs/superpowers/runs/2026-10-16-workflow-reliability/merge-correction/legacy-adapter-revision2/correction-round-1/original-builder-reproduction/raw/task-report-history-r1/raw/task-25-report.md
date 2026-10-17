# Task 25 — Normalize temporary path expectations in dispatch-text tests

Status: IMPLEMENTED. Completion kind: implementation.
Initial task base: 5bbc02c6b754ed94b6fa50f5c1225d75664c2a99.
Rebased base: c3fac4369c7c737e2e7f9f7250fd253b21442d12.
Head: 357c00590d5d0a5284b4fa0e2694cb6f6c3bb10e.
Final tested source tree: 79fc403800ff3b89c60012d61d7e55f5f0e7099d.

## Implementation

The shared temporary-directory fixture now applies Node's built-in path.resolve to the directory returned by mktemp before deriving expected artifact paths. This matches the dispatch consumer's lexical directory spelling without resolving symlinks to a different physical prefix. The only tracked change is two added lines in tests/super-code/test-dispatch-text.sh. No production code or assertion changed.

All invocation-specific filenames and equality assertions remain intact. The existing caller-advance fixture and prior-bundle-content fixture still execute in each full targeted suite; both passed in all three final configurations. An incorrect task ordinal, dispatch label, invocation identity, captured Git source, or overwritten prior bundle would still fail the existing assertions.

## Current requirements and assumptions

Read bd show super-plan-ufz.28 --json and bd comments super-plan-ufz.28 before implementation. There were no comments or explicit amendments and no requirements conflict. The current bead expressly identifies this test expectation as the defect and permits changing only that named test.

The inherited macOS TMPDIR case was run unchanged to meet the explicit supported-default-environment acceptance. The explicit trailing and slash-free cases use the same physical task-scoped temporary directory, /tmp/sp-bce79baa/super-plan-ufz.28, to preserve the dispatch's temp-state ownership rule rather than writing their fixtures into a shared unscoped /private/tmp directory. HOME and all relevant XDG home directories were isolated under that task root for every run.

This shell/Node test has no dependency-install or build setup. The runner is /bin/bash and the Node runtime is /opt/homebrew/bin/node; these are runtime executables, not another checkout's test/package. Both the test script and the dispatch binary/package under test resolve inside the assigned task worktree, recorded in the focused runner's logs.

## Tests and retained output

Every check ran the full named targeted suite, not the repository-wide suite. Exact suite command: bash tests/super-code/test-dispatch-text.sh. Concrete configurations appear in the evidence records below. The retained run-focused.sh records the environment, runs that command, captures its complete output and exit status, and checks owned processes afterward.

Baseline RED on the initial committed source tree 0c1a61d28b20d557e0664056906edbafaed34d36:
- inherited macOS TMPDIR: exit 1, dispatch-text: 4 failure(s).
- explicit trailing TMPDIR: exit 1, dispatch-text: 4 failure(s).
- equivalent slash-free TMPDIR: exit 0, dispatch-text: all tests passed.

The four RED failures were:
[FAIL] evidence review reads the existing report
[FAIL] writes <ledger dir>/dispatch/<label>.md and prints only its path
[FAIL] artifacts in the ledger's directory, by ordinal
[FAIL] stub dispatch name includes its invocation identity

The emitted dispatch paths had one slash; the expected fixture paths had two. This reproduced the named defect before editing. No new mirror regression tests were added.

Pre-commit GREEN on source tree 1e8641caa6a1ef1252f07d412a8d7694982e274d, explicit trailing TMPDIR:
dispatch-text: all tests passed
exit=0
test exit=0; hygiene exit=0

Final runs after committing and rebasing the task branch onto current integration:
- inherited macOS TMPDIR: dispatch-text: all tests passed; exit=0; hygiene exit=0.
- explicit trailing TMPDIR: dispatch-text: all tests passed; exit=0; hygiene exit=0.
- equivalent slash-free TMPDIR: dispatch-text: all tests passed; exit=0; hygiene exit=0.

Each final output also contains:
[PASS] regenerated task/assembly/single/cluster/seam prompts preserve captured source across two caller advances
[PASS] distinct ordinary invocation bundles preserve prior artifact contents, including suffix-like IDs

Final git diff --check passed. Git status --short was empty, and the task diff against the rebased base contains only the named test file with two insertions.

## Source capture commands

Initial committed source:
git rev-parse HEAD
git rev-parse 'HEAD^{tree}'

For dirty pre-commit and final checks, run-focused.sh preserves the real index and snapshots the tested inputs using:
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.28/test-source.index git read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.28/test-source.index git add -- tests/super-code/test-dispatch-text.sh
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.28/test-source.index git write-tree

For final clean committed source, git rev-parse 'HEAD^{tree}' independently matched 79fc403800ff3b89c60012d61d7e55f5f0e7099d. No relevant untracked test input exists: the retained runner only supplies environment and capture operations, and the complete script is preserved beside its logs. These are real executions of the named deterministic suite, not fresh-agent instruction-behavior evaluations or root acceptance.

## Test hygiene

The first inherited baseline check invoked stop-run-processes from inside the task worktree; it refused because the root contained its own working directory. That refusal is retained in base-inherited-hygiene.log. Repeating the check from the integration directory completed with exit 0 and no matches (base-inherited-hygiene-retry.log).

The trailing baseline check reported matches for PIDs 16825 and 16851 with task-worktree working directories while a separate source-inspection command was running there. It did not identify their commands; attribution to the test is unproven. Subsequent checks ran without concurrent source-inspection commands in that directory. The slash-free baseline hygiene check was clean. The required explicit stop after the reported matches completed with exit 0, no remaining matches and no survived lines (base-trailing-stop.log).

The pre-commit GREEN and all three final hygiene checks completed with exit 0 and no matches. The final stop-run-processes invocation also completed with exit 0, no matches and no survived lines (final-stop.log). No background process remains known to this task. The task worktree is retained for its scheduled review, and all logs were copied to the plan workspace before handoff.

## Files changed

- tests/super-code/test-dispatch-text.sh

## Concerns

None for this bounded fixture repair. Caller-owned final sweep, independent task review, behavior evaluation, and root/human acceptance remain outside this task. No ledger, tracker status, main/base branch, Herdr state, or integration content was changed by this implementer.

## Evidence

```json
[
  {
    "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "inherited; TMPDIR=/var/folders/d3/rsgv6zk54y5dd7137_cmcc100000gn/T/; HOME=/tmp/sp-bce79baa/super-plan-ufz.28/home; XDG_*_HOME under /tmp/sp-bce79baa/super-plan-ufz.28",
    "outcome": "fail",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-25-evidence/base-inherited.log",
    "kind": "live"
  },
  {
    "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "trailing; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.28/; HOME=/tmp/sp-bce79baa/super-plan-ufz.28/home; XDG_*_HOME under /tmp/sp-bce79baa/super-plan-ufz.28",
    "outcome": "fail",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-25-evidence/base-trailing.log",
    "kind": "live"
  },
  {
    "sourceTree": "0c1a61d28b20d557e0664056906edbafaed34d36",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "slashfree; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.28; HOME=/tmp/sp-bce79baa/super-plan-ufz.28/home; XDG_*_HOME under /tmp/sp-bce79baa/super-plan-ufz.28",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-25-evidence/base-slashfree.log",
    "kind": "live"
  },
  {
    "sourceTree": "1e8641caa6a1ef1252f07d412a8d7694982e274d",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "trailing; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.28/; HOME=/tmp/sp-bce79baa/super-plan-ufz.28/home; XDG_*_HOME under /tmp/sp-bce79baa/super-plan-ufz.28",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-25-evidence/green-trailing.log",
    "kind": "live"
  },
  {
    "sourceTree": "79fc403800ff3b89c60012d61d7e55f5f0e7099d",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "inherited; TMPDIR=/var/folders/d3/rsgv6zk54y5dd7137_cmcc100000gn/T/; HOME=/tmp/sp-bce79baa/super-plan-ufz.28/home; XDG_*_HOME under /tmp/sp-bce79baa/super-plan-ufz.28",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-25-evidence/final-inherited.log",
    "kind": "live"
  },
  {
    "sourceTree": "79fc403800ff3b89c60012d61d7e55f5f0e7099d",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "trailing; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.28/; HOME=/tmp/sp-bce79baa/super-plan-ufz.28/home; XDG_*_HOME under /tmp/sp-bce79baa/super-plan-ufz.28",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-25-evidence/final-trailing.log",
    "kind": "live"
  },
  {
    "sourceTree": "79fc403800ff3b89c60012d61d7e55f5f0e7099d",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "slashfree; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.28; HOME=/tmp/sp-bce79baa/super-plan-ufz.28/home; XDG_*_HOME under /tmp/sp-bce79baa/super-plan-ufz.28",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-25-evidence/final-slashfree.log",
    "kind": "live"
  }
]
```

## Required live checks

```json
[
  {
    "sourceTree": "79fc403800ff3b89c60012d61d7e55f5f0e7099d",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "inherited; TMPDIR=/var/folders/d3/rsgv6zk54y5dd7137_cmcc100000gn/T/; HOME=/tmp/sp-bce79baa/super-plan-ufz.28/home; XDG_*_HOME under /tmp/sp-bce79baa/super-plan-ufz.28"
  },
  {
    "sourceTree": "79fc403800ff3b89c60012d61d7e55f5f0e7099d",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "trailing; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.28/; HOME=/tmp/sp-bce79baa/super-plan-ufz.28/home; XDG_*_HOME under /tmp/sp-bce79baa/super-plan-ufz.28"
  },
  {
    "sourceTree": "79fc403800ff3b89c60012d61d7e55f5f0e7099d",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "slashfree; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.28; HOME=/tmp/sp-bce79baa/super-plan-ufz.28/home; XDG_*_HOME under /tmp/sp-bce79baa/super-plan-ufz.28"
  }
]
```
