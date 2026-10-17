Status: CLEAN
Task: super-plan-ufz.8.1 (review bead super-plan-ufz.8.6)
Base: b635541015f4bc0e037ef8621f8d01135ca2b22b
Head: e794628a03fac3fbd8cb9619de76cb48cc8380cf

## Spec compliance

✅ Current bead description and acceptance criteria, frozen Task 8 brief and nested continuity design are compatible. bd comments reported no comments; no amendments were applied.

✅ invocationId is separate from runTag, validated before dispatch, persisted in Launch args, and its structured appended:true acknowledgment is awaited before final assembly or review writers. Missing/unconfirmed persistence yields an explicit unavailable review and null reviewPath.

✅ The caller contract reuses the recorded identity only on explicit unsettled resume and mints a fresh identity after a settled return. Workflow fallback minting does not infer identity from runTag or an earlier Launch.

✅ Single, cluster, seam, stub, direct-input .diff, assembly and ordinary dispatch artifact producers carry invocation identity. The .cluster delimiter cannot alias a legal invocation token. Both execution references explain ownership and retention.

✅ reviewPath retains its written-final-review meaning. No landed work, missing source commits, identity persistence failure, null review and unsuccessful stub writing keep it null. Captured source base/head and caller-checkout preservation remain intact.

## Issues

Critical: none.
Important: none.
Minor: none.

## Test evidence

The implementation report records final rebased runs of:
- bash tests/super-code/test-dispatch-text.sh
- node tests/super-code/replay-harness.mjs

Both ran in the assigned worktree with task-scoped TMPDIR and HOME/XDG roots. Reported output: dispatch-text: all tests passed; 1916 passed, 0 failed. I read the retained final log tails and confirmed those summaries. Tests were not rerun.

Evidence plausibly covers both execution paths: actual synthetic bundle contents retained across distinct identities sharing runTag, suffix-like identity collision, explicit replay, fresh minting, unsafe identity rejection, persisted override mismatch, structured acknowledgment, persistence gaps, failed stub writing and inherited no-work/source-capture fixtures. Existing documented dispatch counts remain checked. Test hygiene reports no leaked processes.

Test changes reviewed using:
git diff --stat b635541015f4bc0e037ef8621f8d01135ca2b22b..e794628a03fac3fbd8cb9619de76cb48cc8380cf -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'
git diff b635541015f4bc0e037ef8621f8d01135ca2b22b..e794628a03fac3fbd8cb9619de76cb48cc8380cf -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'

Result: two test files, 151 insertions and 20 deletions. Existing expected path changes implement the requested identity contract; no skipped/deleted behavioral coverage or unjustified loosening found.

## Focused reachability checks

Risk: acknowledgment schema could be dropped before reaching the runtime. Read coordinator dispatch/queueLedger/appendLedger chain: opts.schema reaches agent and Launch prompt requests structured output.

Risk: sibling producers could retain runTag-derived final paths. Traced Workflow Finish through assemblePrompt and single/cluster/seam/stub builders; traced ordinary bash dispatch-text entrypoint through dispatch-text.mjs to shared builders. Searched sibling super-code call sites for old final-review runTag forms; none remain in producer paths.

Risk: captured source identity or reviewPath semantics could regress. Read finalSource gate, reviewWritten assignment and final return; ordinary Launch parsing and source forwarding retain reviewBase/reviewHead. Artifact identity is the only source-path change.

## Scope limits

Fresh-agent interrupted-invocation and changed-instruction evaluation remains explicitly coordinator-owned by the brief. Extraction, finding projection, archival collection and external roast-ledger policy are separate child tasks, outside this producer review.

## Strengths

The persistence acknowledgment is required by both prompt and runtime schema. Retention fixtures materialize emitted paths and verify earlier contents, so path separation is tested beyond string matching.
