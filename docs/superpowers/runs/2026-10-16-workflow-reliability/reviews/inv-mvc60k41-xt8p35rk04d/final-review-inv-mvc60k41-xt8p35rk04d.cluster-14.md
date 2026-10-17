# Cluster 14 review: skills-super-roast

Reviewed captured base `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5` and head `612ea0a7e4d64480bdd01e0ac842b539115342ee`, both verified with `git rev-parse --verify <sha>^{commit}`. Scope is the two files and their slices listed under `skills-super-roast`: `skills/super-roast/scripts/assemble-args.mjs` and `tests/super-roast/test-assemble-args.sh`. Read the assembled digest, epic `bd show super-plan-ufz --json`, and captured `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`. Read captured scout and judge templates only to verify the named risk that the generated source commands and filesystem isolation instructions reach their consumers.

The change resolves supplied PR refs into verified commit identities, rejects incomplete or unresolvable supplied source pairs, renders shell-quoted repository paths, and uses the captured identities in triage and reviewer commands. Patch-only input remains supported with an explicit requirement to capture source identities before accessing repository source. The additive source record and prompt assembly preserve existing design-mode and mock-engine contracts. No material defect found within this cluster.

Verification: `bash tests/super-roast/test-assemble-args.sh` exited 0 on an isolated detached worktree at the captured head, including source capture after caller advancement, independent mutable reproduction worktrees, rejection of an unresolved head despite supplied stat, prior-round assembly, literal replacement metacharacters, and all five existing mock-engine scenarios. The review worktree remained clean and was removed afterward. The first sandboxed worktree creation ran and failed with a filesystem permission error; the authorized escalated creation succeeded. No harness command refusal occurred.

Caller observations before and after verification: HEAD `68c8a0623ba78a75cb5b8b8e40c17236cf81f92e`, clean `git status --short`. The review remained bound to `612ea0a7`; the caller descendant was not used as source. No attribution of caller changes is made.

## Verdict
ready

## Must fix before landing
- none

## Untested scope
- This review ran deterministic assembly and mock-engine tests; it did not independently run hosted Workflow agents or establish live reviewers' adherence to the rendered isolation instructions.

## Deferred OK
- none
