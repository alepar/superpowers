# Task 19 / super-plan-ufz.22 independent review

Status: NEEDS_FIX

## Spec compliance

❌ The current amended acceptance is incomplete at tests/super-code/replay-harness.mjs:594. The specifically permitted replay-fixture amendment and replacement semantic coverage have not been delivered. The implementer explicitly says this is implementation with acceptance pending; that qualification is accurate but does not satisfy the task.

✅ The delivered product repair preserves complete Recovery records through the existing read-ledger response, validates exact owned source/line associations and counted payloads, reuses the existing Recovery schema and ordered readRecovery path, and holds admission when opaque transport cannot be recovered. The focused regression checks the 173-byte / 5173-byte pair, additive fields, matching release, affectedIds, unrelated eligible work after scoped recovery, and several unavailable/malformed retrieval forms. This bounded source review found no additional must-fix product defect.

Amendment used: current `bd show super-plan-ufz.22 --json`, current comments (none), the amended Task 19 plan/brief, recovery-fixture-assessment-r1.md and recovery-fixture-amendment-r1.json. The explicit bounded fixture exception supersedes the old unchanged-replay requirement. There is no unresolved requirements conflict. It authorizes only the named fixture and adjacent focused cases; it does not authorize admission from a foreign opaque pointer.

## Findings

Critical: none.

Important / Missing — tests/super-code/replay-harness.mjs:594. The legacy fixture at 594–610 remains unchanged and deletes its foreign temporary ledger after producing only capped transport. Line 610 expects ready independent-review reentry despite the unresolved Recovery pointer. This is exactly the recorded test defect. The required recovered pending-closure reuse, valid missing-basis reentry, unrecoverable-pointer ready admission hold and foreign-source supplied-payload rejection are not added by the pinned diff. Their absence leaves amended acceptance unimplemented and the required replay suite failing.

Required bounded fix:

- Preserve line 603's real helper assertion: actual source-line pointer, typed verification-only Task discriminator, and no evidence/live.log in compact transport.
- Add a recovered pending-closure case using a configured integrationWorktree's actual ledger. Generate compact and complete counted `--recovery-line 1` output while that ledger exists; provide the exact pointer source/line through the existing read-ledger recoveryRecords. Preserve the entire original oversized pending-closure record, evidence and additive fields. Assert the existing reader prompt targets that ledger/line and adds no read-recovery dispatch. Supply exact retained source/tracker observations (`sourceVerified: true`, `landed: false`, `closed: []`, `open: ['bd-101']` only if that is the exact required bead set). Assert resume-check precedes closure, impl/review/merge are zero, close-only is one, completed requires confirmed closure, evidence/source identity survives, and the resolved transport gap disappears. Retain negative pending-closure source/tracker cases.
- Separately use a valid counted ledger containing only `Task 1 (bd-101): complete, verification-only` for fresh missing-basis reentry, with no unresolved pointer or surviving basis. Preserve original live evidence and requiredLiveChecks in fresh impl/review responses. Assert impl/review are one, merge zero, confirmed close-only closure, completion only afterward, and durable new reviewed basis before closure. Retain the not-ready missing-basis gap assertion without inferred completion.
- Add ready replay of the original deleted foreign-source capped text with no recoveryRecords. Assert impl/review/merge/close-only are zero, completed excludes bd-101, stopReason is recovery-held, and recovery.gaps retains exact unresolved source/line. Do not infer unrelated scope. Add supplied-foreign-source recoveryRecords coverage proving ownership cannot be bypassed, while retaining the current-ledger missing/truncated/empty/malformed cases.
- Run exactly the three required commands on the fixed task source, record revision/diff and complete results, and require all assertions to pass. Do not alter unrelated replay assertions, snapshot baselines, digest tests, schema, specs or historical evidence, or add a recovery-reader dispatch.

Minor: none.

## Pinned review and source checks

Review worktree: /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.22.

`git merge-base --is-ancestor 5bfbb92331652df67d9af367f0f81baa8267f020 c79e41c260b5958cd50b9ed923435cb041de3bae` exited 0. Separate `git rev-parse --verify <sha>^{commit}` calls resolved both captured commits. `git rev-parse c79e41c260b5958cd50b9ed923435cb041de3bae^{tree}` returned dba2b60460893a3ffa6658ab79d8419e3e58f73f, matching final evidence. Caller status was clean; no observed caller identity/source differences are attributed.

The authorized review-package command with the absolute plan path succeeded, producing task-19-review-initial.diff, one commit, three changed files and 33,655 bytes. An initial relative-plan invocation failed because the git-ignored plan is not in the task checkout; it was corrected with the dispatch's absolute path before reviewing. An initial combined --verify invocation was invalid Git syntax; both identities were then resolved separately successfully. Neither error left a required check unperformed.

Read the diff once. Focused outside-diff checks were made with `git show c79e41c2:<path>` and source-line selection:

- Risk: targeted retrieval might accept incomplete transport or a foreign payload. Checked coordinator.js:233–254 and 773–804. checkDigest strips unavailable text; the new decoder requires one counted Recovery record, exact source/line equality, an owned relative/absolute ledger path, safe positive line and one payload; unresolved pointers keep a gap and admission hold. There is no narrowed inferred task scope.
- Risk: recovered records might bypass normal schema/order/clear rules or manufacture a verification landing. Checked coordinator.js:417–449 and 823–919. The new path invokes the existing validated readRecovery in ledger order, reconstructs verification basis, and uses the existing source/tracker reconciler before closure reuse.
- Reachability: the real Resume reader goes through readLedger at 194–230, the same readLedgerPrompt supplies targeted helper instructions, decoding at 773–804 feeds recoveryObligations/recoveryTransportHeld, and admissionReason at 1524–1535 consults recoveryAdmissionReason before task admission. The sibling retained-pointer forms are handled as valid pointers or explicit malformed-pointer holds. The added helper mode does not replace the capped normal helper path.
- Risk: composition could discard .23 invocation identity or .29 captured review binding. Checked readLedger:194–230 and the changed readLedgerPrompt. The identity step and recovery step coexist in the existing call; retry identity retention and complete review base/head selection are preserved. The report also retains passing invocation-start and startup-builder seam evidence. No extra recovery-reader role or dispatch was introduced.

## Test evidence

No tests or probes were run by this reviewer, as required by the task reviewer policy. All following execution facts are retained implementer measurements, not independent test runs:

- `node tests/super-code/recovery-hold-scope-r1.mjs`: final pinned tree, exit 0, 16 scenarios passed. Relevant to the core hold transport repair.
- `node tests/super-code/replay-harness.mjs`: final pinned tree, exit 1, 2294 passed / 1 failed, specifically the unchanged ready missing-basis fixture. Required acceptance is unsatisfied. The report does not gloss over this failure or claim completion.
- `bash tests/super-code/test-run-digest.sh`: final pinned tree, exit 0, all tests passed.
- `node tests/super-code/invocation-start-r1.mjs`: final pinned tree, exit 0, 16 startups passed; simulated mechanical agent with real helpers.
- `node tests/super-code/startup-builder-seam-r1.mjs`: final pinned tree, exit 0, 126 startup/builder seam checks passed.

The focused hold scenarios do not substitute for missing oversized verification-basis recovery/closure coverage. The required command identities match records below, but the replay record remains live/fail. Semantic amended coverage is also missing.

Test changes commands run successfully in the task worktree:

```
git diff --stat 5bfbb923..c79e41c2 -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'
git diff 5bfbb923..c79e41c2 -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'
```

Result: only the new recovery-hold-scope-r1.mjs, 134 added lines. No existing test was deleted, skipped, loosened, or rebaselined. replay-harness.mjs and digest tests are unchanged; the former's specifically required amendment is absent.

## Failure attribution

Read relevant progress.md records, especially current Task 19 implementation/fixture-fix reservation and the .23/.29 composition history. No Recovery runFailure records establish a run-start baseline for this failure. The retained narrow probe passed on the original pre-rebase task base tree 90e37bbfed5bfa419d9708d83c73c048aaf3924b and failed on task tree 7941bd301896a6e28d6bc0909563cfd315a3d0eb; this is evidence of the conservative .22 repair changing the legacy fixture behavior, not a claim of a pre-run failure. The full final replay shows the same unchanged assertion failing at final tree dba2b60460893a3ffa6658ab79d8419e3e58f73f. The report explicitly assigns same-bead amendment repair to the fresh fix pass. Thus .22 retains the repair obligation; this is an authorized fixture correction, not an instruction to weaken product admission.

The retained probe's original task-base pass is evidence index 1 below, but it is not a measurement of the current pinned base 5bfbb923, nor a run-start baseline. No taskBase or runBaseline index is assigned to either failure association. The probe and full replay remain separate exact command identities; their associations are supported by the unchanged fixture/source history, not merged as identical commands. No verification index exists: neither final full replay nor the missing replacement coverage has passed. Earlier digest transient output lacked a captured full tree and is not assigned a cause or blanket flaky/pre-existing classification.

## Check records and structured result

The evidence array below copies all original source-bound records unchanged, including original measurement locations, kinds and outcomes. The requiredLiveChecks are selected from the amended task's three required commands. Two have live/pass evidence; replay has live/fail. Passing invocation/startup seams are supplementary and do not release the replay obligation. The final check capture command is `git rev-parse HEAD^{tree}` on clean source; the report retains the alternate-index RED snapshot capture commands and exact environment.

```json
{
  "id": "super-plan-ufz.22",
  "status": "NEEDS_FIX",
  "finding": "tests/super-code/replay-harness.mjs:594: Important / Missing \u2014 Implement the recorded bounded fixture amendment. The pinned range leaves lines 594\u2013610 unchanged: a deleted foreign-ledger pointer still expects implementation/review reentry, and the required recovered-basis, genuinely missing-basis, unrecoverable-pointer and supplied-foreign-payload ownership cases are absent. Preserve the real cap assertion; add the three semantically separate replays and foreign-source rejection using the current bead requirements, then rerun all three named commands on the resulting source and retain complete source-bound outcomes. The current replay result is 2294 passed / 1 failed and cannot satisfy acceptance.",
  "minors": [],
  "base": "5bfbb92331652df67d9af367f0f81baa8267f020",
  "head": "c79e41c260b5958cd50b9ed923435cb041de3bae",
  "sourceTree": "dba2b60460893a3ffa6658ab79d8419e3e58f73f",
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
      "introducedBy": "super-plan-ufz.22"
    }
  ],
  "reviewFile": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-19-review.md"
}
```
