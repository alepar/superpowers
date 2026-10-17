# Finding continuity across invocations

Bead: super-plan-ufz.8
Parent: ../../specs/2026-10-16-workflow-reliability-design.md

## Goal

Preserve actionable invocation-review findings and deferred findings across retries and interruptions until an explicit, supported disposition accounts for them. Keep the latest review verdict separate from outstanding findings.

## Chosen contract

Keep runTag as the enclosing run identity. Give each super-code invocation a distinct identity, persisted in its existing launch record before producing review artifacts. Single, cluster, seam and stub artifacts include that identity. result.reviewPath retains its current meaning and null behavior, pointing to this invocation's review.

Super-auto appends invocation/source pointers and finding dispositions to existing run records rather than replacing history with the latest codeBuckets.review. Preserve the settled review bundle in the committed run directory at the existing profile-collection boundary. Resume collects completed but uncollected bundles before another invocation or cleanup. Missing/incomplete artifacts are evidence gaps.

Add a complete extraction mode to report-verdict that preserves section and occurrence identity, including deferred items; preserve existing default and --keys behavior. Extend scope-dispositions to project outstanding findings mechanically from source, routing and disposition records. Its existing key-only punch-list consumer format is generated from outstanding deferred findings, replacing the historical union.

## Identity and supported disposition

An occurrence retains its immutable source identity: invocation/report, artifact, section and occurrence position, original key and text. Archive copies preserve that identity. Merge appearances only through explicit references; identical wording, severity or location alone does not merge uncertain matches.

Existing records can hold assignment, fix-task link, deferral reason and verification evidence together. Assignment, task closure, success claims, silence and proposed redesign do not resolve a finding. Resolution names the finding and supporting verification of the relevant fix; rejection retains its reasoning or evidence. A fix supplied elsewhere follows the same rule.

Helpers validate references and evidence fields; the agent judges whether the evidence supports the semantic disposition. A passing sweep clears only the measurement obligation it establishes. No mandatory six-state lifecycle or general-purpose finding database is introduced.

## External ownership and failure behavior

The parallel roast-redesign run owns its roast ledger, triggers and amend workflow. This subtree introduces none of those. Existing roast reports and scope decisions remain source records.

Supported external projections may provide attributed links and disposition evidence, supplementary to retained local evidence. Absent, unsupported, malformed or incomplete input cannot remove or resolve a finding. Dissolution based only on later silence is unsupported under the parent invariant. The local guarantee does not depend on the external interface's eventual syntax; integration can use explicit source references and retain unresolved evidence when it cannot interpret a projection.

## Acceptance

- Two invocations sharing runTag preserve distinct single/split review artifacts and current reviewPath/null semantics.
- A blocked review followed by a silent or ready retry retains earlier actionable findings and their source.
- Interrupted collection resumes without overwriting artifacts, duplicating occurrences or losing supported dispositions.
- Complete extraction includes deferred items without changing existing --keys output.
- Deferred findings leave the punch list only after explicit supported resolution or rejection, including fixes supplied elsewhere.
- Task success, closed fix beads and silence alone leave findings outstanding.
- Explicit references link appearances; uncertain matches remain separate; rejection retains its basis.
- Missing artifacts and unsupported projections retain unresolved evidence and expose the gap.
- Resume, Remaining and status qualifiers consume the same outstanding projection; latest ready cannot conceal earlier findings.
- Deterministic producer/extraction/projection fixtures cover both execution paths. The enclosing coordinator owns fresh-agent interrupted-invocation and changed-instruction evaluations.

## Key abstractions

No new abstractions; extends existing super-code invocation review artifacts and extraction, super-auto run-state and finding/task records, scope-disposition projection, resume and acceptance reporting. These are the existing components named by the parent design.

## Post-Implementation Notes

*As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
