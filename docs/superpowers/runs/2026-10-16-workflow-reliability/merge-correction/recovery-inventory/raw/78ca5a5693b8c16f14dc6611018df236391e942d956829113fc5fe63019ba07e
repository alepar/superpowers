# Task super-plan-ufz.8.1 implementation evidence

Status: IMPLEMENTED
Initial base: f1fb23d15eaaa70fff95404a97342cd83fb0bdb7
Final base: b635541015f4bc0e037ef8621f8d01135ca2b22b
Head: e794628a03fac3fbd8cb9619de76cb48cc8380cf
Branch: task-super-plan-ufz.8.1
Worktree: /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.1
Stacked: false
Rebase: completed cleanly onto the integration tip; focused suites rerun there.

## Implemented

The existing Launch record now persists invocationId separately from runTag. The Workflow caller may supply a token; an omitted token is minted before Launch. Only explicit unsettled resume reuses a recorded token. A new invocation following a settled return, including a blocked result, mints a new identity even within the same runTag. No new agent dispatch or finding ledger was added.

The existing launch append now carries an appended:boolean structured-output schema and requests a structured acknowledgment. The coordinator awaits it and requires appended:true before any review assembly or review writer. A null or unconfirmed launch write leaves an explicit unavailable review and reviewPath:null. Other ledger appends retain their prior schema-less contract. Both execution references specify caller mint/resume ownership and persistence behavior.

The ordinary dispatch builder reads invocationId from the persisted ordinary or Workflow Launch form. Final assembly and all final-review modes reject missing/unsafe identity. --invocation-id must equal the persisted token, so it cannot authorize an unrecorded replacement. Non-review dispatches remain compatible with older Launch records.

Exact producer schema for downstream .8 tasks (workspace means the existing plan workspace):

- Launch: args JSON includes invocationId; ordinary Launch includes `· invocationId <token> ·`.
- Token grammar: /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.
- Final review, used by single/seam/stub: `<workspace>/final-review-<invocationId>.md`.
- Direct-input package: `<workspace>/final-review-<invocationId>.md.diff`.
- Cluster review: `<workspace>/final-review-<invocationId>.cluster-<n>.md`.
- Assembled final inputs: `<workspace>/assembled/final-review-<invocationId>-final/`.
- Ordinary review dispatch files: `<workspace>/dispatch/final-review-<invocationId>-single.md`, `-cluster-<n>.md`, `-seam.md`, `-stub.md`; final assembly dispatch: `assemble-final-review-<invocationId>-<instance>.md`.

The dot before cluster is deliberate: dots are excluded from tokens, preventing the final review of an ID such as inv-a-cluster-1 from aliasing inv-a's cluster artifact. runTag continues to group the enclosing run/processes and non-final-review assembly. Result.reviewPath keeps its existing final-review-only meaning: null when no work landed, identity persistence/capture failed, or no final writer succeeded; non-null for a written single/seam/stub. A stub reply with written:false now correctly leaves null. Existing captured reviewBase/reviewHead handling and caller-preservation contract are retained.

## Files changed

- skills/super-code/SKILL.md
- skills/super-code/coordinator.js
- skills/super-code/coordinator-workflow.md
- skills/super-code/coordinator-subagents.md
- skills/super-code/scripts/dispatch-text.mjs
- tests/super-code/test-dispatch-text.sh
- tests/super-code/replay-harness.mjs

## Tests and TDD evidence

Each command began with an absolute cd to the task worktree above. All test runs used this environment (XDG_STATE_HOME was also set in the final runs):

```bash
env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.1 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/state
```

The full commands for the final rebased runs were:

```bash
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.1 && env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.1 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/state bash tests/super-code/test-dispatch-text.sh > .superpowers/task-evidence/super-plan-ufz.8.1/dispatch-final.log 2>&1
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.1 && env TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.1 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.1/state node tests/super-code/replay-harness.mjs > .superpowers/task-evidence/super-plan-ufz.8.1/replay-final.log 2>&1
```

Final output excerpts (both exited 0):

```text
[PASS] distinct ordinary invocation bundles preserve prior artifact contents, including suffix-like IDs
dispatch-text: all tests passed

[PASS] 48 agent dispatches (got 48)
[PASS] 19 agent dispatches (got 19)
[PASS] 23 agent dispatches (got 23)
[PASS] launch acknowledgment is requested as structured output from the runtime
[PASS] launch append asks its writer for the structured acknowledgment it consumes
[PASS] second invocation leaves the earlier synthetic bundle unchanged
[PASS] single and split bundles have disjoint paths
[PASS] explicitly resumed invocation reuses its recorded identity
[PASS] fresh invocation mints its own token instead of copying the last launch
[PASS] unconfirmed identity persistence suppresses assembly and final review
[PASS] a writer reporting written false cannot authorize a final-review path
1916 passed, 0 failed
```

The documented dryRun scenarios were executed by replay-harness, preserving their expected counts of 48, 19 and 23. Other final-review split scenarios preserve their documented 22/24/25/23 counts. The inherited review-source/caller-advance fixtures pass. `git diff --check HEAD~1 HEAD` passed and `git status --short` was empty after rebase.

RED evidence, before each corresponding implementation:

1. `bash tests/super-code/test-dispatch-text.sh` (same task test environment): `dispatch-text: 24 failure(s)`. New cases observed final-review-shared-run instead of invocation paths, and accepted unsafe/missing identities and unpersisted override (exit 0 versus expected 2). The fixture's initial Bash empty-array setup error was corrected before this measured RED run.
2. `node tests/super-code/replay-harness.mjs`: `1784 passed, 21 failed`. It emitted final-review-shared-run.md and assembled/final-review-shared-run-final for distinct IDs. The actual synthetic second write overwrote the first bundle; retention/disjointness/resume/mint/persistence-gap/unsafe-token assertions failed as expected.
3. A new actual ordinary bundle retention fixture then reproduced the suffix collision: `AssertionError: a later invocation preserves every earlier artifact`, actual `inv-a-cluster-1`, expected `inv-a`. The cluster delimiter was changed only after observing that failure.
4. Failed-writer RED replay: `1806 passed, 1 failed`; written:false incorrectly returned final-review-inv-failed-writer.md. Requiring written:true fixed that measured case.
5. Structured acknowledgment RED replay: `1807 passed, 4 failed`; both invocation cases lacked the runtime schema and asked for a text final answer while their result was consumed as structured data. Attaching the schema to the existing launch call and switching that call's final-answer contract fixed it without adding calls.

An intermediate full run caught a template-span-count change from a newly introduced minting template literal. The mint now uses string concatenation; the established count assertion was retained unchanged. Pre-rebase final verification reached `1811 passed, 0 failed`; the increased final total (`1916`) includes newly inherited cleanup-task checks after rebase.

Raw RED/GREEN logs are retained under the task worktree's git-ignored `.superpowers/task-evidence/super-plan-ufz.8.1/` (dispatch-red.log, replay-red.log, collision-red.log, writer-red.log, ack-red.log, dispatch-green.log, replay-green.log, dispatch-final.log, replay-final.log). They were not added to the commit.

## Test hygiene

None: every completed test-run leak check returned exit 0 with no match lines. The first check was run from the task cwd and correctly refused a root containing its own process; checks were thereafter run from /tmp. The final check and final stop both ran from /tmp using:

```bash
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.1 /tmp/sp-bce79baa/super-plan-ufz.8.1
bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.1 /tmp/sp-bce79baa/super-plan-ufz.8.1
```

Both exited 0 without matches or survived lines. No background service remains. Test scratch uses the required short temp root; dispatch fixture mktemp explicitly honors TMPDIR.

## Assumptions

Current bead description/acceptance and comments were read before implementation. There were no comments or amendments overriding the frozen task brief. The nested continuity spec is compatible with this artifact-only producer change; extraction/projection/collection and external roast-ledger policy remain owned by other .8 tasks. Caller-provided identity is fresh for a new invocation or explicitly restored for unsettled resume, as the approved caller-boundary contract requires.

No dependency install/setup is required for this zero-dependency Node/Bash harness. The harness file and coordinator package-under-test both resolve inside the assigned task worktree; the host Node interpreter is /opt/homebrew/bin/node.

## Concerns

Fresh-agent before/after behavior evaluation, interrupted invocation evaluation and changed-instruction evaluation are coordinator-owned per dispatch and were not independently run here. No additional agents were spawned. The implementation supplies executable deterministic fixtures for both paths and updates operative protocol references; the parent retains the live behavior measurement obligation.

This task does not implement archival collection or finding disposition. Downstream consumers must retain source identity and treat unavailable bundles as evidence gaps; the producer paths and Launch field above are the handoff contract.
