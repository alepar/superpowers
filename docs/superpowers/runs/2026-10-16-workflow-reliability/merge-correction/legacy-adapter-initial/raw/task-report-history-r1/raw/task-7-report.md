Status: IMPLEMENTED

# super-plan-ufz.11 — IMPLEMENTED

- Branch: `task-super-plan-ufz.11`
- Worktree: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.11`
- Initial base: `599b30303e6cf43e154ee7fd55c9f57cb9f114cf`
- Final base after clean rebase: `c70245ce4e73d3895062cdc42515c05a50a38844`
- Head tested and submitted: `a5b8f0c6f9caff12fa184ef607743431ff969be1`
- Stacked: false. Reopened: false. Working tree clean.

## Implementation

A seven-entry exact process-tag lookup groups `cleanup-inspection`, `cleanup-inspection-denied`, and `process-inspection-refused` under `cleanup-inspection`; `missing-evidence`, `evidence-missing`, and `test-evidence-missing` under `missing-evidence`; and preserves the existing `suite-not-run` process class. Live and resumed recurrence both use the same `recurrenceSig` lookup. The blocker cause field accepts the same exact values. No substring, fuzzy category, termination-failure, survived-process or failed-live-measurement matching was added. Ambiguous `cleanup-denied` remains distinct.

Unknown tags and free text now retain numeric/path/assertion distinctions through an exact-text UTF-8 fingerprint. The existing specific untagged `review-package resolved HEAD in <path> (<N> bytes)` process message retains bounded legacy normalization. No other free text loses numbers or paths.

Original ledger/report records stay authoritative and are never rewritten by reconstruction. Raw class spelling, including case, survives compact transport and elided append retries. Recurrence only emits a grouped observation: previous automatic shared-defect/shared-fix conclusions were replaced, without changing severity, task disposition or fix routing. The ordinary-subagent protocol references the same exact vocabulary as Workflow; ordinary dispatch generation remains tested. Representative fresh-agent semantic evaluation is owned by the enclosing coordinator.

## Compact fields and provenance

The digest transports a minor as `Task N (ID): minor [RAW-TAG, when present] [recurrence-id: v1-BYTES-HASH-HASH] [source-line: L]`.

- `recurrence-id` is bounded transport metadata: byte length plus two polynomial byte hashes modulo 2147483647 and 2147483629, with bases 31 and 131. AWK runs with `LC_ALL=C`; the coordinator hashes the same UTF-8 bytes. It preserves exact-text distinctions without echoing prose and survives elided append retries. It is not an authoritative finding ID.
- `source-line` is the physical line in the source ledger supplied to `ledger-digest`; the retained Task ID and that ledger/line identify the original record. Blocker cause records retain their raw cause plus this same line pointer.
- `process-class` appears only on a `Recurring minor:`/`Recurring blocker:` observation as an additional canonical grouping fact. It changes no original tag or audit identity.

These suffixes occur after the original class/state fields and contain colons, so the original leading `[class]` matcher cannot consume them as process labels. Replay verifies that Task status remains unchanged. Unknown untagged minors now transport a compact fingerprint/source pointer instead of disappearing from resume. No finding database or general-purpose record schema was added.

## Tests

Final commands ran at the exact submitted head, after rebasing onto current integration (including source-bound check evidence):

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.11 node tests/super-code/replay-harness.mjs
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.11 bash tests/super-code/test-run-digest.sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.11 bash tests/super-code/test-dispatch-text.sh
```

Final output (all exit 0):

```text
2007 passed, 0 failed
run-digest: all tests passed
dispatch-text: all tests passed
```

The replay command includes the documented dryRun scenarios and their agent-count expectations. `git diff --check HEAD^ HEAD` also passed. The repository has no dependency install step for these zero-dependency runners. `/opt/homebrew/bin/node` is the system interpreter; both the replay runner and resolved coordinator source are inside this task worktree.

Task-focused excerpt from the final replay:

```text
[PASS] cleanup-inspection: live aliases share exactly one count
[PASS] cleanup-inspection: each original finding and task survives
[PASS] cleanup-inspection: threshold creates no fix scope or severity change
[PASS] cleanup-inspection: counts do not assert shared defect identity
[PASS] cleanup-inspection: digest retains raw labels and source line provenance
[PASS] cleanup-inspection: digest/resume reconstructs canonical count and task provenance
[PASS] cleanup-inspection: compact reconstruction never rewrites original evidence
[PASS] missing-evidence: live aliases share exactly one count
[PASS] missing-evidence: each original finding and task survives
[PASS] missing-evidence: threshold creates no fix scope or severity change
[PASS] missing-evidence: digest/resume reconstructs canonical count and task provenance
[PASS] distinct details remain distinct after resume: [test-failure] expected 101 in src/a.test.js
[PASS] distinct details remain distinct after resume: [unknown-tag] product bug 101 in src/a.js
[PASS] distinct details remain distinct after resume: product bug 101 in src/a.js
[PASS] distinct details remain distinct after resume: [cleanup-denied] termination denied
[PASS] distinct details remain distinct after resume: [evidence-missing] command absent
[PASS] raw causes and live triage reconstruct one process class
[PASS] raw blocker tags, tasks and original line pointers survive
[PASS] grouping neither overrides triage nor creates shared fix scope
[PASS] same exact identity reconstructs after raw append: [unknown-tag] missing café evidence ⚠️ at src/é.js:12
[PASS] same exact identity reconstructs after elided append: [unknown-tag] missing café evidence ⚠️ at src/é.js:12
[PASS] same exact identity reconstructs after raw append: missing café evidence ⚠️ at src/é.js:12
[PASS] same exact identity reconstructs after elided append: missing café evidence ⚠️ at src/é.js:12
[PASS] source pointers do not alter Task status or manufacture a defect
```

Full final logs are retained, git-ignored, in this task worktree under `.superpowers/evidence/super-plan-ufz.11/`: `replay-rebased.txt`, `run-digest-rebased.txt`, and `dispatch-text-rebased.txt`.

## TDD evidence

Before production changes, the same replay command exited 1 with `1959 passed, 11 failed`. The expected failures were the two process alias groups failing to share live/resumed counts, missing raw-tag/source-line transport, and catch-all grouping of distinct `[test-failure]`, `[unknown-tag]`, and untagged numeric/path details. These exposed missing aliases and excessive normalization rather than missing tooling. The original RED log is `.superpowers/evidence/super-plan-ufz.11/evidence-red.txt`.

After implementation, focused fixtures also exposed an untagged compact-ID parser bug (the fingerprint began at column zero after removing `minor `); the corrected parser accepts both that position and a suffix after a raw class. UTF-8 and elided-retry positive reconstruction now pass. One intermediate added fixture had a syntax error; that run exercised no product behavior and was corrected before the final passing runs. The deliberately changed digest expectation now includes raw case, source pointers, and the previously omitted untagged fingerprint. The template-literal baseline changed by exactly -1 because Resume consumes the whole compact record instead of rebuilding a tag literal; no existing assertion was weakened.

## Files changed

- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/ledger-digest`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/task-reviewer-prompt.md`
- `tests/super-code/replay-harness.mjs`

## Test hygiene

None: neutral-directory checks after test runs returned 0 with no `match:` lines. The final ownership-scoped stop command also returned 0 with no `survived:` lines. No background processes remain. One initial check was refused by the helper because its cwd was inside the checked root; repeating it from `/private/tmp` performed the actual successful inspection. All test temporary state used `/tmp/sp-bce79baa/super-plan-ufz.11`; evidence files remain inside the task worktree.

Final check/stop used:

```sh
cd /private/tmp
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.11 /tmp/sp-bce79baa/super-plan-ufz.11
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.11 /tmp/sp-bce79baa/super-plan-ufz.11
```

## Assumptions and amendments

Current bead and comments were read before implementation; there were no bead amendments or comments. The coordinator explicitly clarified: exact process-tag aliases only, ambiguous cleanup denial must not be conflated with inspection denial, raw label/task/line provenance must remain, and the smallest additive compact fingerprint/provenance suffix is allowed. Those clarifications narrow the frozen brief's illustrative `cleanup-denied` candidate: that candidate stays distinct. The coordinator owns integrated sweep and fresh-agent semantic evaluation. The supplied behavior baseline passed process-alias judgment in both arms, so prompt edits are limited to the operative vocabulary/transport reference and replacement of the existing automatic shared-defect conclusion; no generic judgment prompting or new agent round was added.

## Concerns

No unresolved deterministic failures. Live ordinary-subagent process tagging and the enclosing after-implementation behavior evaluation were not run here; those remain explicitly parent-owned. Old compact digests that already discarded unknown finding prose cannot recover that lost exact text; regeneration from the authoritative raw ledger supplies the new fingerprint/provenance fields. The bounded legacy untagged review-package normalization remains an existing special case; the new process alias guarantee uses documented tags.
