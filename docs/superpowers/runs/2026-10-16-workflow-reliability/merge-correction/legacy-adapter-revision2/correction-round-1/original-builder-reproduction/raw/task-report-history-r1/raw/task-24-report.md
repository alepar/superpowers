status: IMPLEMENTED

## Implementation

Added full source path containment to the existing settled review collector. Every component from the declared workspace root through each discovered or required input is checked with lstat before enumeration, split-manifest reads, hashing or extraction. Symlinked components and resolved paths outside the canonical workspace become explicit unsafe bundle path collection gaps. Existing destination hash checks, immutable archives, append-only extraction, settlement and invocation binding remain intact.

Files changed:
- skills/super-auto/scripts/report-status
- tests/super-auto/collection-symlinks-r1.sh

## Current requirements and assumptions

Read bd show super-plan-ufz.27 --json and bd comments super-plan-ufz.27 before implementation. There were no comments or amendments. The frozen task-24 brief and current bead agreed. Task .26 independently owns generated-input selection; this change only validates collection source paths. Caller/root acceptance and final sweep remain pending.

No dependency setup is required for these Bash scripts and Node built-ins. Bash resolves to /bin/bash, Node to /opt/homebrew/bin/node; these are system interpreters. The test runner file and product script were realpath-checked inside the assigned worktree, with no package resolution or integration-worktree fallback.

## Tests and TDD

All recorded commands ran from /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.27 with this configuration:
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.27; HOME=/tmp/sp-bce79baa/super-plan-ufz.27/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/state

RED command: bash tests/super-auto/collection-symlinks-r1.sh
RED output: 10 passed, 13 failed (exit 1).
The existing collector reported complete for assembled-intermediate, required-deep-intermediate and split-manifest-intermediate inputs and archived sentinel bytes. Direct and nested symlinks already prevented copying in some paths, but did not carry the explicit unsafe-path diagnostic. The normal nested/required and source-cleanup controls passed before the production change. The full failing output is retained in red.log.

GREEN command: bash tests/super-auto/collection-symlinks-r1.sh
GREEN output: 23 passed, 0 failed (exit 0).
Cases cover workspace/assembled symlink, discovered direct file symlink, required deep intermediate symlink, required direct symlink, discovered nested directory symlink, an in-workspace symlink, split manifest intermediate symlink, normal nested and required byte preservation, and completed archive replay after source cleanup.

Existing-suite command: bash tests/super-auto/test-scripts.sh
Output: 44 root acceptance assertions passed; integrated collection -> ordinary evidence -> caller gate -> disposition -> metrics passed; All super-auto script tests passed (exit 0).
This existing file was unchanged.

Preserved .24 gate command: bash tests/super-auto/archive-integrity-r1.sh
Output: archive integrity: 15 scenarios passed (exit 0).
Missing/corrupted final review, cluster, direct diff, manifest, slice and required-input bytes still block the read-only gate, preserving independent human acceptance obligations.

Source checks: git diff --check passed; after task commit/rebase, git status --short was empty. Rebase was a no-op because integration remained at the original task base.

## Assertion failure values

For each rejected-path fixture, status 0 instead of 3, complete:true, an absent unsafe-path gap, absent COLLECTION_GAP output, or any copied sentinel bytes fails its respective behavioral check. For normal controls, a nonzero collector exit, incomplete metadata, nonempty gaps, missing/changed nested or required bytes fails. For source cleanup, a nonzero replay exit or incomplete record fails. These are real CLI invocations and filesystem effects; there are no mocks.

## Test hygiene

No match or survived lines were reported by successful task-root checks. An initial sandboxed check could not inspect ps ancestry (exit 4); an escalated check run from inside the task worktree was refused by the script's own current-directory guard (exit 2). Re-running from /private/tmp with explicit escalation succeeded with no output and exit 0 after RED, GREEN and both acceptance runs. No process was stopped by name or pattern. Task temp/home/XDG state is under /tmp/sp-bce79baa/super-plan-ufz.27.

## Evidence and source identity

Exact capture commands are retained at /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.27/.superpowers/evidence/super-plan-ufz.27/source-capture.txt. RED and GREEN use temporary indexes without altering the real index. The GREEN snapshot equals the clean committed HEAD tree; no tested source changed before commit.

```json
{
  "id": "super-plan-ufz.27",
  "status": "IMPLEMENTED",
  "files": [
    "skills/super-auto/scripts/report-status",
    "tests/super-auto/collection-symlinks-r1.sh"
  ],
  "base": "7c3fec35b9e8039576677ff8a5b91ee5135c76e8",
  "head": "e9c3a9a4825fea50a571aabbeeeb5dd8882f4ad0",
  "stacked": false,
  "reopened": false,
  "completionKind": "implementation",
  "sourceTree": "5263a31e4b3687b598eef5a5d490be067b0d5c2a",
  "evidence": [
    {
      "sourceTree": "10f2aa827e282c7e3dba8f0b69384728ff3dfa57",
      "command": "bash tests/super-auto/collection-symlinks-r1.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.27; HOME=/tmp/sp-bce79baa/super-plan-ufz.27/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/state",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.27/.superpowers/evidence/super-plan-ufz.27/red.log",
      "kind": "live"
    },
    {
      "sourceTree": "5263a31e4b3687b598eef5a5d490be067b0d5c2a",
      "command": "bash tests/super-auto/collection-symlinks-r1.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.27; HOME=/tmp/sp-bce79baa/super-plan-ufz.27/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/state",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.27/.superpowers/evidence/super-plan-ufz.27/green.log",
      "kind": "live"
    },
    {
      "sourceTree": "5263a31e4b3687b598eef5a5d490be067b0d5c2a",
      "command": "bash tests/super-auto/test-scripts.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.27; HOME=/tmp/sp-bce79baa/super-plan-ufz.27/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/state",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.27/.superpowers/evidence/super-plan-ufz.27/test-scripts.log",
      "kind": "live"
    },
    {
      "sourceTree": "5263a31e4b3687b598eef5a5d490be067b0d5c2a",
      "command": "bash tests/super-auto/archive-integrity-r1.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.27; HOME=/tmp/sp-bce79baa/super-plan-ufz.27/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/state",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.27/.superpowers/evidence/super-plan-ufz.27/archive-integrity.log",
      "kind": "live"
    }
  ],
  "requiredLiveChecks": [
    {
      "sourceTree": "5263a31e4b3687b598eef5a5d490be067b0d5c2a",
      "command": "bash tests/super-auto/collection-symlinks-r1.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.27; HOME=/tmp/sp-bce79baa/super-plan-ufz.27/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/state"
    },
    {
      "sourceTree": "5263a31e4b3687b598eef5a5d490be067b0d5c2a",
      "command": "bash tests/super-auto/test-scripts.sh",
      "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.27; HOME=/tmp/sp-bce79baa/super-plan-ufz.27/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.27/state"
    }
  ],
  "reportFile": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-24-report.md",
  "concerns": [
    "Task .26 separately edits collector input selection; preserve both selection and containment when integrating overlapping collector lines."
  ],
  "humanAction": []
}
```

## Concerns

Task .26 separately edits collector input selection; preserve both selection and containment when integrating overlapping collector lines. No broad filesystem privilege or adversarial concurrent filesystem-mutation claim is made.
