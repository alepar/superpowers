## Task 29: Retain nested resources before outer run removal

**filesTouched:**
- `skills/super-auto/SKILL.md`
- `skills/finishing-a-development-branch/SKILL.md`
- `skills/super-auto/run-state.md`
- `skills/super-auto/report-prompt.md`
- `tests/super-auto/outer-cleanup-r1.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `skills/super-code/scripts/remove-task-worktree`
- `skills/super-code/scripts/stop-run-processes`
- `tests/super-auto/test-scripts.sh`
- `.superpowers/sdd/super-plan-ufz-plan/final-review-inv-mvc60k41-xt8p35rk04d.cluster-56.md`

**Bead:** super-plan-ufz.32. **Surface:** 57408 tokens at the integration base.

**Scope:** Honor task cleanup exits 3/4 and retained nested worktree/temp resources before any parent removal, and verify owned processes before deleting resources they may still need; unknown/surviving outcomes preserve dependent resources.

### Covered findings (verbatim)

- [Must-fix] [P1; cluster 56] `skills/super-auto/SKILL.md:174`: honor task cleanup exits 3/4 and retained nested worktree/temp resources before allowing parent removal, and verify run-owned processes before deleting resources they may need. The phase-7 caller lists retained resources but still delegates parent deletion before its run-level stop. The cluster's independent Git fixture proves ordinary parent removal exits 0 and destroys a dirty child under ignored `.worktrees/`. Source evidence: cluster-56.md and `/tmp/ufz-review-cluster56-612ea0a7/.review-probes/`; the original finish instruction predates this diff, but this new safety contract remains uncovered. Add outer-finish coverage for retained descendants and unknown/surviving process outcomes.

### Acceptance (verbatim)

- [ ] An outer-finish fixture with dirty ignored nested .worktrees descendants and retained cleanup exits 3/4 keeps the parent and descendant resources intact.
- [ ] Unknown or surviving run-owned processes prevent deleting dependent worktree/temp resources; outcomes remain distinct from verified stopped and deliberately kept.
- [ ] Verified termination with no retained descendants permits ordinary parent cleanup without broadening process ownership matching.
- [ ] Run the focused outer-finish regression and existing super-auto suite unchanged; coordinator owns bounded changed-instruction evaluation before acceptance.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Create tests/super-auto/outer-cleanup-r1.sh around an independent Git fixture with an outer worktree and dirty ignored nested .worktrees descendants. Exercise task cleanup exits 3 and 4, retained temporary resources, unknown/surviving run-owned process inspection and verified termination. The failing baseline must show why parent removal would destroy a retained descendant; no real run resources are used.

2. Amend phase-7 super-auto instructions and finishing-a-development-branch's removal preconditions so run-owned process verification precedes deletion of dependent resources, and retained task cleanup outcomes/descendants block outer parent removal. Preserve all named worktree/temp resources when termination is surviving/unknown and retain deliberately kept outcomes distinctly; do not treat exit-zero empty output as proof of inspection availability.

3. Carry these distinct cleanup facts through existing super-auto run-state/report instructions so delivery can finish while cleanup remains pending, and the human can see exactly what was retained and why. Preserve process ownership matching and allow ordinary cleanup only after verified termination and no retained descendants. Do not broaden kills or add a cleanup engine.

4. Use superpowers:writing-skills for changed operative instruction content. The focused fixture should check the concrete outer-finish decisions against the documented caller contract and resource existence, including positive cleanup and each refusal path. Coordinator owns a bounded fresh-agent changed-instruction evaluation; keep it pending until actual execution.

5. Run bash tests/super-auto/outer-cleanup-r1.sh and bash tests/super-auto/test-scripts.sh unchanged. Deliverable: outer finish preserves nested work and process-dependent resources under retained/unknown outcomes and permits verified-safe removal.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.

## Pending caller and review obligations (not implementation tasks)

These records stay pending after planning and are not added to the ordinal mapping. Full exact inventories and original captured source/artifact identities remain in `fix-beads-r1.json`; the following references preserve their separate ownership and acceptance meaning.

### caller-final-sweep-and-root-acceptance

Owner: super-auto coordinator and human partner. Status: pending.

- [Must-fix] untested: The root's final integrated sweep is explicitly deferred; required acceptance review/measurement/human facts remain caller-owned. All 18 leaves closing supplies no substitute for those facts, and this not-ready final review does not satisfy review acceptance.

- [ ] Run and source-bind the final integrated sweep after fixes at the required final tip; a deferred sweep is pending measurement, not a code-defect bead.
- [ ] Assess the applicable changed-instruction behavioral evidence and required final review independently of helper/replay/text/live-isolation evidence; preserve original B4 failures/ambiguity and native-platform limits.
- [ ] Complete the three separately named bounded review obligations and account for their actual outcomes before claiming required review acceptance.
- [ ] Record actual required measurement, review and human acceptance facts; finished leaves or this not-ready review cannot close the root.
- [ ] Keep root super-plan-ufz open until caller-owned acceptance is actually satisfied; base merge remains the human's choice.

### review-former-cluster-9

Owner: super-auto coordinator. Status: pending. Original manifest ordinal: 9; original name: `evidence-super-plan-ufz-14`. Captured source: `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5..612ea0a7e4d64480bdd01e0ac842b539115342ee`; invocation: `inv-mvc60k41-xt8p35rk04d`; manifest: `.superpowers/sdd/super-plan-ufz-plan/assembled/final-review-inv-mvc60k41-xt8p35rk04d-final/clusters.json`. Full original files/slices/artifacts membership: `fix-beads-r1.json#/reviewObligations/0` (1 files, 1 slices); retain every member under this identity.

- [Must-fix] Unreviewed cluster 9 `evidence-super-plan-ufz-14`: authoritative reason is ambiguous duplicate cluster name with over-window cluster 52. Obtain an unambiguous bounded review; no clean verdict is inferred from adjacent reviewed evidence.

Independent bounded review and coverage accounting; split large file/slice inventories into uniquely identified review chunks tied to the original manifest ordinal and captured source. This is a coordinator review obligation, not a demonstrated code defect. No new agent role or engine is required.

- [ ] Identify this scope by original ordinal, full file/slice membership and captured base/head; duplicate cluster names cannot stand in for that identity.
- [ ] Read/review every listed captured source artifact in bounded chunks with explicit per-chunk coverage and findings; preserve complete membership even when a large file needs smaller ranges.
- [ ] Retain source-bound review results and remaining limits in a successor record that explicitly accounts for the original unreviewed obligation; placeholder not-ready records and adjacent ready evidence do not clear it.
- [ ] Preserve failed/ambiguous historical results and evidence-kind limits; archive fidelity is not live behavior acceptance.

No source repair or build/repack product defect is established by the authoritative evidence. Coordinator may prepare bounded uniquely named read-only review inputs from the retained captured artifacts; retain their original membership and hashes rather than file a fake implementation task.

### review-former-cluster-29

Owner: super-auto coordinator. Status: pending. Original manifest ordinal: 29; original name: `docs-superpowers-runs-2026-10-16-workflow-reliability-live-review-isolation-evidence-14`. Captured source: `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5..612ea0a7e4d64480bdd01e0ac842b539115342ee`; invocation: `inv-mvc60k41-xt8p35rk04d`; manifest: `.superpowers/sdd/super-plan-ufz-plan/assembled/final-review-inv-mvc60k41-xt8p35rk04d-final/clusters.json`. Full original files/slices/artifacts membership: `fix-beads-r1.json#/reviewObligations/1` (30 files, 30 slices); retain every member under this identity.

- [Must-fix] Unreviewed cluster 29 `docs-superpowers-runs-2026-10-16-workflow-reliability-live-review-isolation-evidence-14`: authoritative reason is over-window after one recluster. Its command logs support limited named checks in other reviews but do not constitute a completed review of this entire cluster.

Independent bounded review and coverage accounting; split large file/slice inventories into uniquely identified review chunks tied to the original manifest ordinal and captured source. This is a coordinator review obligation, not a demonstrated code defect. No new agent role or engine is required.

- [ ] Identify this scope by original ordinal, full file/slice membership and captured base/head; duplicate cluster names cannot stand in for that identity.
- [ ] Read/review every listed captured source artifact in bounded chunks with explicit per-chunk coverage and findings; preserve complete membership even when a large file needs smaller ranges.
- [ ] Retain source-bound review results and remaining limits in a successor record that explicitly accounts for the original unreviewed obligation; placeholder not-ready records and adjacent ready evidence do not clear it.
- [ ] Preserve failed/ambiguous historical results and evidence-kind limits; archive fidelity is not live behavior acceptance.

No source repair or build/repack product defect is established by the authoritative evidence. Coordinator may prepare bounded uniquely named read-only review inputs from the retained captured artifacts; retain their original membership and hashes rather than file a fake implementation task.

### review-former-cluster-52

Owner: super-auto coordinator. Status: pending. Original manifest ordinal: 52; original name: `evidence-super-plan-ufz-14`. Captured source: `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5..612ea0a7e4d64480bdd01e0ac842b539115342ee`; invocation: `inv-mvc60k41-xt8p35rk04d`; manifest: `.superpowers/sdd/super-plan-ufz-plan/assembled/final-review-inv-mvc60k41-xt8p35rk04d-final/clusters.json`. Full original files/slices/artifacts membership: `fix-beads-r1.json#/reviewObligations/2` (90 files, 90 slices); retain every member under this identity.

- [Must-fix] Unreviewed cluster 52 `evidence-super-plan-ufz-14`: authoritative reason is over-window after one recluster. Complete its bounded review separately from the duplicate-name cluster 9; source/evaluation evidence already cited remains qualified.

Independent bounded review and coverage accounting; split large file/slice inventories into uniquely identified review chunks tied to the original manifest ordinal and captured source. This is a coordinator review obligation, not a demonstrated code defect. No new agent role or engine is required.

- [ ] Identify this scope by original ordinal, full file/slice membership and captured base/head; duplicate cluster names cannot stand in for that identity.
- [ ] Read/review every listed captured source artifact in bounded chunks with explicit per-chunk coverage and findings; preserve complete membership even when a large file needs smaller ranges.
- [ ] Retain source-bound review results and remaining limits in a successor record that explicitly accounts for the original unreviewed obligation; placeholder not-ready records and adjacent ready evidence do not clear it.
- [ ] Preserve failed/ambiguous historical results and evidence-kind limits; archive fidelity is not live behavior acceptance.

No source repair or build/repack product defect is established by the authoritative evidence. Coordinator may prepare bounded uniquely named read-only review inputs from the retained captured artifacts; retain their original membership and hashes rather than file a fake implementation task.

## Retained rejected findings and historical limits

- **rejected: Measurement-classification semantic duplication at coordinator.js:354.** Coordinator matching live/pass evidence availability and caller acceptance have distinct contract meanings; contradictory records still require caller reconciliation.
- **rejected: Direct next-roast frozen-Git fallback materiality at super-auto/SKILL.md:400.** The documented captured-source fallback preserves required review despite assembler unavailability; repairing repeated generated-input recursion does not overturn that narrower judgment.

The following remain punch-listed limitations, not newly filed product defects:

- [Must-fix] untested: This seam review executes the collector/assembly feedback fixture only; it does not rerun the full coordinator, hosted Workflow, ordinary live scheduling/recovery, live verification-only completion, or the full required suite. Existing source-bound helper, replay, text-decision and live-isolation evidence retains the separate meanings described above.
  Punch-list — this records the seam review's bounded coverage rather than a demonstrated missing goal-required check; preserve the separate existing evidence and let the caller assess applicable behavioral and sweep obligations.
- [Must-fix] untested: Native Linux `/proc` inspection/termination remains untested in the supplied macOS evidence. Exit-zero/empty-stdout Finish process records do not independently resolve inspection availability or verify all resource safety; preserve the raw observations and caller-owned follow-up.
  Punch-list — native Linux coverage is an expressly disclosed platform limit, not a specified requirement for an additional platform exercise; retain unknown inspection outcomes and caller follow-up without claiming cleanup success.
- [Must-fix] untested: Archived fixed temporary paths, source excerpts and replay drivers were reviewed as historical evidence; general-purpose rerun portability, concurrency and unrecorded agent side effects were not established. Original B4 failures/ambiguity and live-exercise limits remain unmodified.
  Punch-list — general-purpose rerun portability, concurrency and unrecorded effects of historical evidence archives are outside the specified preservation guarantee; retain original limitations and failed or ambiguous measurements unchanged.

Archive-copy scope limits remain qualified historical evidence. The three punch-listed keys are preserved and not filed. This report creates no source edits, spec changes, implementation/tests or acceptance clearance.
