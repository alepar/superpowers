# Cluster 56 review: skills-super-auto

Reviewed the `skills-super-auto` cluster listed by the supplied clusters.json against epic `super-plan-ufz` and `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`. Both captured commits resolve: base `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5`, head `612ea0a7e4d64480bdd01e0ac842b539115342ee`. Review used their diff and captured-head source, not the caller's later HEAD.

Caller observations before and after review: HEAD `68c8a0623ba78a75cb5b8b8e40c17236cf81f92e`, clean `git status --short`. No caller checkout state was restored or attributed to another agent. The unique detached review worktree is `/tmp/ufz-review-cluster56-612ea0a7`; mutable fixtures and outputs were confined to its `.review-probes/` directory. It remains available for inspecting the reproductions.

Validation: `bash tests/super-auto/test-scripts.sh` passed, including 44 root-acceptance assertions and collection/projection integration checks. `bash tests/super-code/test-report-verdict.sh` passed. Those suites do not cover the two failure cases below.

For the phase-7 resource risk, I additionally inspected `skills/finishing-a-development-branch/SKILL.md:220`, which supplies the parent-worktree removal explicitly invoked by the cluster. An isolated Git fixture created an integration worktree with an ignored `.worktrees/` directory, a registered task worktree below it, and a dirty tracked file in that task. `git status --short` in the child returned ` M file`. `git worktree remove <parent>` then exited 0 and deleted the child, including its dirty file. This reproduces the consequence of proceeding after the task cleanup helper reports retention; no real caller worktree was used. The phase-7 instruction predates this diff, so this is an uncovered requirement of the new safety contract, not a claim that this patch introduced the original instruction.

For the acceptance risk, a fixture used the captured `report-status --collect` to archive a valid ready review and its direct `.md.diff` input; collection returned 0 and `collection: complete`. After changing the archived direct input, `report-status --acceptance RUN_MD --tree <matching tree>` still returned 0 with `eligible:true`, `pending:[]`, and `gaps:[]`. Replaying `--collect` immediately afterward returned 3 with `COLLECTION_GAP: probe: archive conflict: final-review-probe.md.diff`. Thus the recorded hashes can identify the corruption, but the final acceptance gate does not verify them.

## Verdict
not ready (phase-7 cleanup can delete retained resources, and root acceptance does not verify current archive integrity)

## Must fix before landing
- [P1] `skills/super-auto/SKILL.md:174`: Phase 7 tells the caller merely to list resources retained by `remove-task-worktree --sweep`, then permits the finishing skill to remove their parent worktree; the run-level process sweep occurs afterward. Honor exits 3/4 and every retained nested worktree/temp resource before parent removal, and verify run-owned processes before deleting the resources they may need. The isolated Git reproduction above proves that ordinary parent removal can destroy a dirty child under ignored `.worktrees/`; the new helper's retention guarantee therefore does not survive this caller path. Add an outer-finish regression case covering retained descendants and unknown/surviving process outcomes.
- [P2] `skills/super-auto/scripts/report-status:168`: `--acceptance` delegates collection validation to ordinary status, whose lines 293–296 only inspect persisted `complete`/`gaps` metadata and never verify current archived files against `files[].sha256`. A previously complete but subsequently corrupted or missing direct input can therefore authorize root closure, contrary to run-state.md's stated independent collection-integrity check. Perform read-only archive existence/hash verification at the gate and return a gap on mismatch; cover archive corruption/deletion after successful collection without requiring a separate mutating `--collect` replay.

## Untested scope
- Native Linux `/proc` process discovery/termination was not exercised in this review; the supplied digest also explicitly qualifies that platform coverage.
- Live Workflow/ordinary-agent behavior evaluations were not independently rerun; this review validates the captured cluster's source and focused deterministic fixtures, not other clusters' aggregate acceptance evidence.

## Deferred OK
- none
