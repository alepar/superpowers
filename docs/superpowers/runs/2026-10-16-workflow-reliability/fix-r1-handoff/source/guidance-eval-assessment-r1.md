Status: assessed
canonicalStatus: assessed

## Verdict

sufficient-bounded-evidence

The native evaluation is sufficient evidence for a bounded receiving decision: preserve its incomplete result, accept the documented observations at their stated scope, and do not file a new implementation defect from the secondary O6 finding. It does not complete the balanced primary comparison, demonstrate guidance improvement, or clear overall run acceptance. This is a later applicability assessment; the frozen rubric, exclusions, labels and counts remain unchanged.

The authoritative collected result is [guidance-eval-r1-native/evaluation-report.md](guidance-eval-r1-native/evaluation-report.md), read with its index, execution ledger, rubric adapter, original semantic rubric, manual score ledger, scoring notes, scorer record, collection records and validation artifacts. Preparation index fields saying prepared/zero launches are frozen preparation facts; the mutable execution ledger and final report record the subsequent collection. They must not be confused with an unrun native experiment or with a complete primary experiment.

| Family / arm | Primary passing samples /5 | Failing /5 | Unmeasurable /5 |
|---|---:|---:|---:|
| Source binding / baseline | 4 | 0 | 1 |
| Source binding / after | 4 | 0 | 1 |
| Outer cleanup / baseline | 2 | 2 | 1 |
| Outer cleanup / after | 3 | 0 | 2 |

All 20 fresh candidate calls ran once; 19 completed intake and 15 are primary measurable. There are 13 passing, 2 failing and 5 unmeasurable primary samples, with 108 pass / 3 fail / 39 unmeasurable paired case decisions out of 150 and no ambiguous labels under the scorer's disclosed interpretation. Cases within a packet are paired subitems, not additional independent samples. Candidate 011 stopped after seven of fifteen required chunks when its offset-84000 loader invocation used `/codex/c3/` instead of `/codex/codex-3/`; it never reached the user packet. Candidates 017–020 have actual inherited AGENTS.md prefix drift: five release-checklist commands were added. Their exclusions remain mandatory under the frozen native rules; neither an apparent lack of relevance nor secondary textual success repairs them.

For source binding, both arms passed the measured subset: “Both arms passed this bounded guidance-only evaluation; it demonstrates no measured guidance improvement.” This is neither 5/5 comparable success nor a behavioral RED. Outer cleanup's different measured coverage permits only the descriptive counts above. Every primary-measurable source E/F and cleanup F positive control, and cleanup E/I contrast, passed. No unsafe parent deletion or blocked positive control was reported. No safety-only average replaces the full sample result.

The secondary ledger covers 19 complete packets: 16 pass / 3 fail samples and 137 pass / 4 fail cases out of 141. Those observations remain separate from the primary comparison. The scorer was one fresh agent; there is no independent inter-rater agreement result. This assessment is not a second full semantic scoring of all 150 cases.

The four named failure decisions were inspected in their raw response JSON and against their O6 criterion records and complete corresponding frozen cleanup guidance:

| Raw response and case pointer | Recorded ordering | Frozen label retained |
|---|---|---|
| `results/responses/candidate_004.txt#/cases/3` (D) | Action 1 invokes the targeted deleting helper; action 3 first commits/archives cleanup run/report facts. | Primary fail, O6 |
| `results/responses/candidate_007.txt#/cases/0` (A) | Action 2 removes the verified clean leaf; action 3 writes retained-resource facts; action 4 archives them. | Primary fail, O6 |
| `results/responses/candidate_007.txt#/cases/3` (D) | Action 3 conditionally removes the leaf after its actual successful process check; action 5 records/archives facts. | Primary fail, O6 |
| `results/responses/candidate_020.txt#/cases/3` (D) | Action 1 records the parent refusal; action 2 permits leaf removal after actual verification; action 4 writes/archives the complete pending facts. | Primary unmeasurable; secondary fail, O6 |

All four target only the independently safe `task-format` leaf. They retain the dirty `task-quota`, its unique repro temp, and the containing parent; D first requires actual leaf process clearance. Their raw choices establish the reported ordering. They do not establish that a real deletion occurred, evidence was lost, or the parent-retention mechanism failed. The paths above are relative to `guidance-eval-r1-native/`; the original detailed score evidence is in [manual-scoring.json](guidance-eval-r1-native/results/scores/manual-scoring.json).

O6 requires persistence “Before teardown” without defining teardown's resource scope. Reading this as any leaf deletion is a defensible frozen scoring interpretation, and the scorer explicitly discloses the narrower alternative. That does not make it an independently demonstrated correctness requirement of the goal. The root spec requires preservation across interruptions and truthful outcomes; the nested finding-continuity spec requires collection before cleanup of needed source evidence. The live `bd show super-plan-ufz.32 --json` acceptance and [Task 29](super-plan-ufz-plan.md#task-29-retain-nested-resources-before-outer-run-removal) target dirty descendants surviving outer removal, process-dependent resource retention, and verified-safe progress. They do not require persisting every sibling retention fact before removing a leaf that contains no unique evidence and whose process dependencies are cleared.

The full cleanup context also distinguishes these boundaries. Current super-auto phase 7 permits independently verified leaf cleanup before final parent verification, says that no required state write may follow removal of its resources, and requires retained facts before done/marker clearing. Run-state says to refresh facts before finishing removes the outer worktree. Report-prompt ties archival/persistence to removal of their containing worktree. The finisher requires caller facts before deleting any source it still needs. On the supplied A/D facts, the safe leaf is not the containing source of run.md/report.md or the retained dirty evidence. Persisting those records afterward while retaining their containing parent is therefore not shown to violate those preservation guarantees. The root's general interruption invariant does not itself prove a new crash-loss mechanism at this particular safe-leaf boundary. Treating every such ordering as a product defect would extend the contract beyond the demonstrated mechanism. This applicability judgment changes no historical label and awards no additional passes.

Candidate 020 is explicitly the **baseline** arm and consumes the same complete frozen baseline cleanup packet as 004/007. Its secondary failure repeats their criterion and action order under a drifted common prefix. It supplies no new after-guidance failure, independent current-source defect, or new failure mechanism. A separate fix bead is not justified by this evidence.

Current-source comparison was anchored to the actual inspected Git HEAD `69c3a0d001b0533aa4a8f682f51ca4e4bd8a5551`. The complete frozen baseline cleanup context and the complete baseline-to-after context diff were read, and the five after source-file bodies were compared in full with Git blobs and working files. Four are byte-identical to current HEAD: run-state, resume, report-prompt, and finishing-a-development-branch. Super-auto/SKILL.md differs in the phase-4 generated-input provenance refusal/fallback handling and the review-collection generated-input selection paragraph; those differences were read. The phase-7 cleanup text is unchanged. Consequently the cleanup applicability comparison has a concrete current basis, but the frozen candidate results do **not** behaviorally validate the changed full current SKILL.md or its new review-input behavior. No current full-file validation is claimed.

Read-only integrity checks found all 42 native frozen files and all 54 original snapshot files unchanged, all four native context copies identical to their original contexts, and each canonical payload ending with its corresponding complete context and containing the exact frozen user packet. The 004/007/020 response hashes and their shared baseline payload identity match their collection records. These are fidelity checks, not reruns or additional behavior samples.

## Must-fix

None demonstrated that warrants a new source fix or fix bead. Do not edit the frozen rubric, recategorize O6 outcomes, waive 017–020, replace 011, or describe this run as a completed 5-per-arm primary comparison.

The caller's next step is to retain this assessment beside the native report and carry its bounded result into the existing acceptance accounting. The planned balanced measurement remains incomplete; at-least-five fresh calls per variant were attempted, but five comparable usable semantic samples per variant were not obtained. Record that limit explicitly rather than silently certifying full protocol completion. A further balanced comparison, if actually required by the caller's acceptance decision, needs a separately versioned prospective protocol with stable inherited instructions and reliable exact-path intake; it is not a repair of these records. No repeated merge menu or new approval ceremony is needed to receive this evidence or continue already authorized caller work.

## Untested scope

- Overall acceptance remains caller-owned. This memo does not execute or discharge the final source-bound integrated sweep, required final review, the separately named former-cluster 9/29/52 review obligations, other changed-instruction evaluations, reserved human decisions, or root closure. Their latest satisfaction was not audited here; in the inspected plan and Task 29 report they are explicitly separate pending obligations. A closed implementation bead is not proof they were satisfied.
- Native evaluation results concern textual decisions with tools available under an intake-only instruction. They establish no actual Workflow execution, ordinary live scheduling, generated writer-guard execution, real source binding, process termination, resource survival, Git cleanup, final parent verification, or multi-turn pressure compliance. Historical fixture Git/helper results retain their own separate evidence kind.
- Exact provider revision, sampling/seed, effective token limits, backend retention and serialized provider prefix remain unknown. Visible full-intake receipts establish visible delivery, not adversarial isolation. Shared inherited safety guidance can mask an incremental effect. No reliability, generalization, significance or improvement claim follows.
- Full source-binding context files were checked for original/native byte identity, not independently semantically re-read end to end in this receiving assessment; its source-binding count statements rely on the retained scorer and validation artifacts. No present source-binding implementation or full current source-binding guidance validation is claimed. The named cleanup failure context was read in full, including unchanged surrounding sections, then compared through the complete after/current differences as described above.
- No new live tests, candidate runs, replacement samples, independent all-case rescoring or current-head behavioral experiment occurred. Native Linux inspection/termination and previously disclosed B4 failures/ambiguity remain unaffected historical limits.

## Deferred OK

Keep the O6 interpretive boundary and secondary 020/D observation visible as non-primary limitations without promoting them to a new current defect. Preserve the unchanged original guidance-eval-r1 and native results, including setup failures and raw answers. Retain verified-safe leaf progress and the existing positive control; no blanket retention rule, replacement cleanup engine, tracker change, spec amendment or broad new test campaign is justified here.

If later evidence actually shows a required record or unique source being removed before preservation, the minimal repair is at that destructive boundary: persist/archive the affected facts before deleting their containing resource, with one focused interruption/order check. That conditional mechanism is not a finding established by this run and creates no new obligation now.
