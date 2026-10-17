# Cluster 16 review

Reviewed only `docs-superpowers-runs-2026-10-16-workflow-reliability`, the 31 files and corresponding slices named by the captured cluster manifest, against epic `super-plan-ufz` and its referenced approved design. Both base `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5` and head `612ea0a7e4d64480bdd01e0ac842b539115342ee` verified as commits. Source reads used `git show` and the exact captured range; all 31 assembled slices match that range. Eight JSON documents parse and all 18 local Markdown link destinations exist at the captured head.

The historical task snapshots preserve the pre-roast contradiction and its separately recorded correction. The corrected snapshot differs from the original only in task .8.4's supported-disposition criterion and update time. Those immutable historical artifacts need no retroactive rewrite. The verification report accurately keeps deterministic helper execution separate from simulated observations, retains original failed suites, qualifies the separate standalone packaging pass, and leaves caller acceptance pending. Its 20/23 initial results, six refreshed successes, package provenance and 17-entry source recheck agree with the specifically referenced evidence records inspected for those claims.

One material metrics claim is unsupported by this cluster's own recorded observations. `profile-implementation.md:7` calls 17h58m a graph lower bound for a run that actually completed its measured graph window in 17h43m, then concludes that the .20 → .14 dependency chain set the pace and reshaping it is the lever. The JSON records the same conclusion as `simulation.verdict = graph-bound`. Yet its recorded .14 dispatch is 08:19:58Z, while .20 was created at 08:27:13Z and dispatched at 08:31:40Z: the final observed graph cannot be treated as an enforced dependency ordering for the earlier .14 implementation. The JSON explicitly has unknown readiness for both tasks. In addition, the measured window begins the previous day and includes a 14h26m wait (`profile-implementation.md:61`); the summary reports no active dispatched agent for 83% of that window. An estimated schedule retaining unknown releases can still be useful, but these observations do not support the categorical causal diagnosis or an empirical lower-bound claim. This violates spec §5's separation of observations, gaps and estimates. Qualify the inference and model bound, or regenerate the artifact using a model/window that supports the claim; preserve the raw observations. No historical graph reconstruction is required.

Caller HEAD was `68c8a0623ba78a75cb5b8b8e40c17236cf81f92e` and `git status --short` was empty at both observations. The reviewed source remained the captured `612ea0a7` throughout. No caller source files, branches, tracker records or Herdr state were changed; this report is the sole write.

## Verdict
not ready (the recorded profile makes an unsupported causal bottleneck and lower-bound claim)

## Must fix before landing
- [metrics-causal-claim] `docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.md:7` and the matching JSON summary/simulation verdict must distinguish the estimated schedule from an observed graph bound: 17h58m exceeds the actual 17h43m, .14 starts before .20 exists, readiness is unknown, and most of the window is idle; qualify or substantiate the claim that this dependency chain set the pace.

## Untested scope
- Product suites were not rerun for this documentation-only cluster review; named result records were checked for consistency, without independently reproducing their original sessions.
- The documented native Linux process-inspection gap, live no-change completion gap, and hosted Workflow limitations remain explicit; root final sweep and human acceptance remain caller-owned.

## Deferred OK
- Historical proposed/settled task snapshots retain the original .8.4 wording because the corrected successor snapshot and disposition record preserve the actual change.
- Combined source-bound regression coverage and separate standalone packaging coverage are clearly qualified rather than presented as one fresh final-commit linked-worktree run.
