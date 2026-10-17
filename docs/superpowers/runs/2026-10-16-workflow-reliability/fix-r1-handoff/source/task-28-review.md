# Task 28 / super-plan-ufz.31 independent review

Status: CLEAN
Base: 69c3a0d001b0533aa4a8f682f51ca4e4bd8a5551
Head: 7d5abfe28d01de5153d5905e48f057869ceb2a5e
Head tree: f062b7c7ec1b967aa64952fad937ff6982cdb084

## Spec compliance

✅ All four current acceptance obligations are satisfied within archival retention scope. Read current `bd show super-plan-ufz.31 --json` and `bd comments super-plan-ufz.31`; there are no comments or amendments. Frozen task 28, the brief and the current bead agree.

Exactly five original artifacts and the allowed retained-equivalents/provenance.json were added. Each artifact is restored at its original manifest identity, so no substitute mapping or manifest/report edit is required. All 81 captured Git blobs match the original manifest SHA-256 values. All original 76 present blobs, the manifest and the historical report are byte-identical to both the captured review base and the provenance's initial baseline.

The five retained blobs match all five original files still available under /private/tmp/ufz-live-isolation byte for byte, including their individually distinct original hashes and lengths (30, 4072, 436, 597, 72 bytes). This verifies actual original byte streams rather than a reconstruction from prose or reuse of the final-review duplicate for other artifacts. All five are explicit mode-100644 Git blobs although `git check-ignore --no-index` confirms their paths match ignore rules. Future checkout retention therefore does not depend on the temporary originals.

The actual final review, package, ledger, plan and caller output now resolve at the historical identities. Provenance names each original source path and expected/source/retained hash; every one of its 81 audit rows was checked against captured blobs, byte lengths, identities and manifest hashes. Its baseline commit resolves to its stated tree and its original manifest digest matches. No extra product, instruction, source-revision, historical-report, manifest or spec changes occur.

Historical limitations remain explicit: representative original source only, no baseline/control or repeated-run certification, controlled assembler failure versus successful review-package distinction, no task-review policy coverage, initial verifier false positives, sampled observations, denied global process inspection, and absent full sweep. Neither this review nor restoration supplies a new historical behavioral claim, reverses rejected measurement/fallback dispositions, or grants root acceptance. Caller-owned sweeps, behavioral assessment, wider review and human acceptance remain pending. Task .27 and its closure hold were untouched.

## Issues

Critical: none.
Important: none.
Minor: none.
Warnings/unverified acceptance items: none within this task's bounded retention scope.

## Test evidence

No product tests or historical exercise were run by this reviewer. The implementer's `TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.31 python3 -` has its complete stdin script and exit-zero output in task-28-report.md. It checks the historical red state separately from final restored integrity, all 81 Git blobs, original temp-source bytes, provenance identities, unchanged original bytes and the six-path addition boundary. It plausibly and directly covers this archived-data-only task. The baseline `fail` describes the actual 76/81 archive-integrity defect; the combined script's exit zero does not reclassify the baseline or certify the historical exercise.

Reviewer additionally performed authorized read-only mechanical source/evidence integrity validation using `python3 -` with Python stdlib hashlib/json/pathlib and subprocess Git reads. For every manifest entry it read `git show <head>:<archive-path>`, hashed the bytes, compared the manifest and corresponding provenance audit record, and compared the original base/baseline bytes. For each restored entry it also read its original `sourceLocation`, compared bytes and hashes, checked absence at captured historical head 612ea0a7e4d64480bdd01e0ac842b539115342ee, and checked tracked Git entries and ignored-path matching. It asserted only the five originals plus provenance were added. Exit 0: 81 entries, 81 hash matches, 76 original byte-identical entries, all 81 provenance rows verified, five original temp files byte-identical, unchanged manifest/report, only six allowed additions. This is a retention validation, not product-test or historical behavior evidence.

Test changes: none. Both commands exited 0 with empty output:

```bash
git diff --stat 69c3a0d001b0533aa4a8f682f51ca4e4bd8a5551..7d5abfe28d01de5153d5905e48f057869ceb2a5e -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'
git diff 69c3a0d001b0533aa4a8f682f51ca4e4bd8a5551..7d5abfe28d01de5153d5905e48f057869ceb2a5e -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'
```

## Review identities and package

`git merge-base --is-ancestor <base> <head>` exited 0. Each commit was resolved individually with `git rev-parse --verify <sha>^{commit}`. Review-package exited 0, one commit, 45754 bytes, six files; package retained at task-28-review-initial.diff. Task worktree HEAD equals captured head and status is empty. Caller integration HEAD was base 69c3a0d001b0533aa4a8f682f51ca4e4bd8a5551 with empty status; this observed difference changes no captured review identity and implies no cause.

Two initial read invocation errors were corrected: rev-parse --verify requires one revision per invocation, and frozen-plan metadata lives at the absolute integration plan path rather than task-worktree-relative path. Both identities and the complete task-28 frozen section were subsequently read successfully. No required read or validation remains unavailable.

## Check records and coverage

The following original implementer records are preserved unchanged. The final live/pass record matches the required integrity check and captured head tree. The initial live/fail record remains fail at the original pre-restoration tree, not the rebase base. These records establish archival integrity only. Full measurement script and output remain at their original report location.

```json
{
  "evidence": [
    {
      "sourceTree": "79fc403800ff3b89c60012d61d7e55f5f0e7099d",
      "command": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.31 python3 -",
      "configuration": "baseline-red-integrity; captured e3749b014f6939cb82f5e79a33dc020f5b3961f0; exact stdin script in report Tests",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-28-report.md",
      "kind": "live"
    },
    {
      "sourceTree": "f062b7c7ec1b967aa64952fad937ff6982cdb084",
      "command": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.31 python3 -",
      "configuration": "restored-git-tree-integrity; all 81 historical manifest identities; exact stdin script in report Tests",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-28-report.md",
      "kind": "live"
    }
  ],
  "requiredLiveChecks": [
    {
      "sourceTree": "f062b7c7ec1b967aa64952fad937ff6982cdb084",
      "command": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.31 python3 -",
      "configuration": "restored-git-tree-integrity; all 81 historical manifest identities; exact stdin script in report Tests"
    }
  ]
}
```

## Failure attribution

`failureAttribution: []`. Relevant progress history contains no Recovery failure-attribution records and no recorded run failure history was supplied. The original archive-integrity gap is measured at initial baseline tree 79fc403800ff3b89c60012d61d7e55f5f0e7099d and fixed at the captured head tree; no new introducing-task or run-start ownership is inferred. No behavioral failure is discharged by this restoration.

## Structured result

```json
{
  "id": "super-plan-ufz.31",
  "status": "CLEAN",
  "finding": "",
  "minors": [],
  "base": "69c3a0d001b0533aa4a8f682f51ca4e4bd8a5551",
  "head": "7d5abfe28d01de5153d5905e48f057869ceb2a5e",
  "sourceTree": "f062b7c7ec1b967aa64952fad937ff6982cdb084",
  "evidence": [
    {
      "sourceTree": "79fc403800ff3b89c60012d61d7e55f5f0e7099d",
      "command": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.31 python3 -",
      "configuration": "baseline-red-integrity; captured e3749b014f6939cb82f5e79a33dc020f5b3961f0; exact stdin script in report Tests",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-28-report.md",
      "kind": "live"
    },
    {
      "sourceTree": "f062b7c7ec1b967aa64952fad937ff6982cdb084",
      "command": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.31 python3 -",
      "configuration": "restored-git-tree-integrity; all 81 historical manifest identities; exact stdin script in report Tests",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-28-report.md",
      "kind": "live"
    }
  ],
  "requiredLiveChecks": [
    {
      "sourceTree": "f062b7c7ec1b967aa64952fad937ff6982cdb084",
      "command": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.31 python3 -",
      "configuration": "restored-git-tree-integrity; all 81 historical manifest identities; exact stdin script in report Tests"
    }
  ],
  "failureAttribution": []
}
```
