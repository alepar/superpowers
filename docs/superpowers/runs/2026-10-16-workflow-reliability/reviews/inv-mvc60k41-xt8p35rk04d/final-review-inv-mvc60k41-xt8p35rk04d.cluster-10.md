# Cluster 10 review: fixture failure probe

Reviewed only `evidence/super-plan-ufz.14/fixture-failure-probe.mjs`, using the assigned cluster slice and the captured Git diff from `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5` to `612ea0a7e4d64480bdd01e0ac842b539115342ee`. Both commit objects were verified before source retrieval. Read the epic and its referenced workflow reliability spec, plus the assembled digest for context.

The probe extracts the actual replay fixture bodies, injects helper exceptions and unavailable process inspection separately, and requires an explicit error, no surviving fixture-owned process, removed fixture directories, and preservation of an independently created sentinel. These observations remain separate from the fixture's own assertions. The final oracle stops only recorded fixture children and its own sentinel. The injected inspection failure suppresses real helper stop mode, so fixture teardown must supply the observed termination. This is appropriate deterministic evidence for the fixture-teardown repair; it does not claim live agent behavior or native Linux coverage.

Opened only the captured replay harness's `withFixtureProcesses`, `fixtureProcessAlive`, and the two selected fixture bodies to check extraction boundaries, injected calls, and owned-process teardown. The extraction markers match this captured revision, and those fixture bodies use the injected functions. Source retrieved from the captured head passed `node --check --input-type=module` through stdin. No process-spawning reproduction was run during this review.

Caller observations before and after review were identical: HEAD `68c8a0623ba78a75cb5b8b8e40c17236cf81f92e`, with empty `git status --short`. This differs from the captured review head; the review remained pinned to `612ea0a7e4d64480bdd01e0ac842b539115342ee`. No cause is inferred from that difference.

## Verdict
ready
## Must fix before landing
- none
## Untested scope
- This review checked syntax and source behavior; it did not rerun the four real-process fault-injection cases or independently verify their saved execution logs.
- An unexpected failure of the outer oracle's real process inspection or teardown is outside the two injected fixture failure modes and was not exercised here.
## Deferred OK
- The evidence probe relies on exact replay-source markers; explicit extraction-boundary assertions would make future fixture renaming failures clearer, while the markers match the captured revision reviewed here.
