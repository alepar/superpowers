# Cluster 11 review: required-suite evidence runner

Reviewed only `evidence/super-plan-ufz.14/run-required-suites.mjs` and its assembled diff, pinned to verified base `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5` and head `612ea0a7e4d64480bdd01e0ac842b539115342ee`. The epic and integration-task acceptance criteria require truthful, source-bound regression measurements and preservation of process ownership. Named-risk cross-checks used the pinned verification report, initial/final result records, and cleanup helper ownership contract.

The 23-command inventory matches the repository's required-suite list. Execution is sequential; complete stdout/stderr goes to per-suite files; exit status, signal, duration and hygiene outcomes remain separate. Unknown or failed hygiene never counts as verified empty, and even successful cleanup after an initial match does not rewrite that original observation into success. The initial 20/23 and refreshed 6/6 records preserve failed measurements rather than silently replacing them. External source manifests and the verification report provide provenance and explicitly qualify the combined measurements and standalone packaging exception. No landing-blocking defect was established in this one-off evidence runner.

Validation: parsing the exact captured script through `node --input-type=module --check` passed. I did not execute the suite runner, which writes committed evidence paths and uses the original run's fixed temp root. Full suite execution, current-tree acceptance, and composition with other clusters are outside this review.

Caller observations: HEAD was `68c8a0623ba78a75cb5b8b8e40c17236cf81f92e` with empty `git status --short` at the start and end of source inspection. Review inputs remained captured Git objects; no caller branch, tracked source, process, or tracker record was changed. These observations do not attribute caller history to any agent.

## Verdict
ready

## Must fix before landing
- none

## Untested scope
- This review did not rerun the runner or exercise spawn failure, signal interruption, nonempty hygiene, unknown inspection, or cleanup failure branches; retained measurements exercise the ordinary suite-completion and empty-hygiene path.

## Deferred OK
- The runner retains the original run's fixed temp directory and installed canonical cleanup-helper path; portability, concurrent reruns, fresh environment setup, and preserving repeated same-prefix measurements would require additional work before treating it as a general-purpose test runner.
