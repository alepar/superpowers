Status: CLEAN
Task: super-plan-ufz.27 (Task 24)
Base: 7c3fec35b9e8039576677ff8a5b91ee5135c76e8
Head: e9c3a9a4825fea50a571aabbeeeb5dd8882f4ad0
Source tree: 5263a31e4b3687b598eef5a5d490be067b0d5c2a

## Spec compliance
✅ Current bead description and acceptance plus frozen brief agree; bd comments reports no comments. No amendments used. Only the named collector and new focused regression file changed. Intermediate assembled directory links, required deep/direct links, discovered direct/nested links, and split-manifest links receive explicit unsafe-path gaps before source bytes are hashed, extracted or copied. Normal nested and required inputs and archive replay after source cleanup remain supported. The separately owned .26 recursive selection work is absent and was not assumed.

## Issues
Critical: none.
Important: none.
Minor: none.

## Focused source checks and reachability
Risk: leaf-only validation could still follow intermediate symlinks in required inputs, discovered input enumeration, or split manifest parsing. Read captured HEAD skills/super-auto/scripts/report-status:210-264. source() lstat-checks the workspace and each descendant component, then compares canonical resolutions; walk(), root enumeration, assembled traversal, manifest reading and the per-file hash path use it. The source hash guards subsequent extraction/copy. Unsafe source paths retain a gap even when an earlier archive is available. Missing optional assembled trees remain optional; missing required entries remain explicit gaps. This is a source-boundary check, with no broader filesystem privilege or concurrent-mutation guarantee claimed.

Risk: a wrapper-only fix or sibling call site could leave the actual workflow unprotected. git grep at captured HEAD for report-status.*--collect located the real entrypoint in skills/super-auto/SKILL.md:458 and resume.md:29; both dispatch the changed script. The --collect branch at report-status:180-267 is the shared collector; all source-byte reads within it use the validated source path. hasBundle only checks candidate presence for null-review reconciliation and does not archive input bytes.

Risk: regression of task .24 independent archive integrity gate. Read captured HEAD report-status:288-328 and --acceptance path. Ordinary status still hashes retained archived bytes at lines 311-316; --acceptance incorporates that read-only status. Those paths are unchanged by the diff, as are destination hash/conflict rules at lines 246-255. Retained archive-integrity evidence covers missing/corrupt final review, cluster, direct diff, manifest, slice and required bytes, plus independent human obligations.

## Test evidence
No product tests run by reviewer. Read original source-capture.txt and red.log, green.log, test-scripts.log and archive-integrity.log at the measurement locations below. RED shows 10 passed / 13 failed and concretely demonstrates intermediate escape bytes archived before the fix. GREEN shows 23 passed / 0 failed. Existing suite reports 44 root acceptance assertions, integrated collection/evidence/gate/disposition/metrics pass, and All super-auto script tests passed. Archive integrity reports 15 scenarios passed. These are plausible focused live measurements for this task; no failures are glossed over or attributed away. Source capture describes temporary indexes and binds GREEN to the captured committed HEAD tree; git rev-parse HEAD identity and tree checks confirm the captured identities. Caller worktree status was empty when observed.

Test changes commands (both succeeded):
- git diff --stat 7c3fec35b9e8039576677ff8a5b91ee5135c76e8..e9c3a9a4825fea50a571aabbeeeb5dd8882f4ad0 -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'
- git diff 7c3fec35b9e8039576677ff8a5b91ee5135c76e8..e9c3a9a4825fea50a571aabbeeeb5dd8882f4ad0 -- same pathspec list
Only tests/super-auto/collection-symlinks-r1.sh was added (58 lines); existing tests were not edited, removed, skipped or weakened. The new tests invoke the real collector and assert exit status, explicit incomplete metadata/gaps and absence of archived sentinel bytes, with positive byte-preservation and cleanup replay controls.

## Review integrity
merge-base --is-ancestor BASE HEAD exited 0. Both captured identities independently resolve with git rev-parse --verify <sha>^{commit}. Package construction succeeded (1 commit, 2 changed files); named DIFF_FILE is task-24-review-initial.diff. An initial attempt to pass both identities to one rev-parse --verify invocation returned Needed a single revision; corrected independent commands both passed. No missing-identity or skipped-check gap remains. No source, bead, branch, index or Herdr mutation; no review-owned worktree or reproduction was needed.

## Check records
Original records retained unchanged below; required live checks are supplied by matching live/pass GREEN and existing-suite measurements. The RED measurement is an intentional pre-fix demonstration, not a passing check. Archive-integrity evidence adds coverage of the preservation constraint.

```json
{
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
  "failureAttribution": []
}
```

## Failure attribution
No recorded run failure history or relevant Recovery ownership records were present. No pre-existing-failure exoneration, run owner or discharge is inferred. RED is a source snapshot of the pre-fix collector with the new regression test, not a measured run-start baseline. No attribution associations asserted.

## Strengths
The containment helper covers every existing collection source path without changing input selection or the independent archive gate. The focused fixture includes both escaped-source failures and valid-path/source-cleanup controls.
