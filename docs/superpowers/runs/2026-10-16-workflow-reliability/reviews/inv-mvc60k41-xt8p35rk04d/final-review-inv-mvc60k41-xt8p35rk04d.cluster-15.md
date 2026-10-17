# Cluster 15: tests-super-auto

Reviewed only `tests/super-auto/test-contract-lint.sh` and its supplied slice against the workflow reliability spec. Verified both captured commits, then inspected `git diff d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5..612ea0a7e4d64480bdd01e0ac842b539115342ee` and the captured file with `git show`. Read the assembly digest and epic `super-plan-ufz`. The additional field/format fixtures were inspected specifically to verify that the new concatenation inputs exist and enumerate approved additions.

The lint retains the historical field-name and line-format contracts while allowing explicit finding/acceptance additions. New negative fixtures verify rejection of an unapproved field, a changed legacy format, removal of an approved field, and a changed approved format. The instruction checks now follow complete extraction, the shared projection, and collection recovery, matching the finding-continuity requirements. No actionable defect was found in this cluster.

Validation: `bash tests/super-auto/test-contract-lint.sh` ran against captured head `612ea0a7e4d64480bdd01e0ac842b539115342ee` in review-owned detached worktree `/private/tmp/ufz-cluster15-review-612ea0a7`; exit 0, live-tree lint and all 12 mutation cases passed. The review worktree remained clean. An initial sandboxed worktree creation returned an OS permission error; the same narrow creation succeeded with approved escalation. No caller files or branches were switched or restored.

Caller observations: HEAD was `68c8a0623ba78a75cb5b8b8e40c17236cf81f92e` and `git status --short` was empty both before and after validation. Review inputs remained pinned to `612ea0a7`; no caller changes were inferred or attributed.

## Verdict
ready
## Must fix before landing
- none
## Untested scope
- The phrase-presence checks establish documented command references, not semantic correctness of collection/projection behavior or live agent adherence; those require their owning clusters and integrated evaluation.
- This execution used the host macOS Bash environment; native Linux execution was not performed.
## Deferred OK
- none
