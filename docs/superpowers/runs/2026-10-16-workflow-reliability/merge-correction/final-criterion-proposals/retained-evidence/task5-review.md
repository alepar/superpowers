# Task 5 independent specification and quality review

Reviewed frozen range `c2c05d28480902f4426c4d6adfc680508415d4b2..7fc5a4ddb2d0913b769484935f79e6daccff966b` in the existing isolated workflow-reliability checkout. Specification verdict: **PASS**. Quality verdict: **PASS**. No concrete Critical or Important findings.

## Specification review

Both missing-sync replay surfaces are repaired: `skills/super-auto/resume.md:77–78` and `skills/super-design/SKILL.md:122–123` route a landed `amend-checked` record into `specs-committed`, whose first action is Amend Mode step 3's sync before filing. This also avoids performing the sync once in each state. The normal commit path and the replay path share the same producer contract at `skills/super-design/SKILL.md:905–912`.

The sync uses committed sections, with section changes determined from the recorded pre-amendment `lastGood` to HEAD. Its unchanged-section guard remains; a previously completed sync is deliberately replayable. The complete existing Decomposition procedure supplies the relevant idempotency rules: committed sections are authoritative and copies are replaced, never appended (`:305–311`); the digest replacement preserves the surrounding Global Constraints and rereads the full description (`:314–330`); owner text uses the same replacement rule, existing `owns:` beads are adopted, and creation is limited to unowned abstractions (`:290–303`, `:331–345`). The patch preserves existing rename, owner-creation and sweep-wiring semantics rather than introducing a second sync mechanism.

The authorized sync-failure exception is explicit at `:911–912`: retain `specs-committed` and failure evidence, retry on resume before filing or advancing. The general second-failure/degraded-`applied` rule now covers only steps 4–6 (`:1002–1006`). Therefore a sync failure cannot produce `applied` via that rule. Both callers retain their existing ownership of the eventual `applied` state: super-design after Amend Mode returns applied (`:767–783`), super-auto after the amend design-roast work (`skills/super-auto/SKILL.md:397–405`). No new caller success outcome is introduced for pending sync.

The changed instructions do not dispatch another designer, alter the goal, increment/reset counters, or start another cycle. The surrounding replay rule explicitly preserves counters and the current cycle (`skills/super-auto/resume.md:73`), and Amend Mode retains its restrictions on budget/counter/goal changes (`skills/super-design/SKILL.md:872–881`, `:1023–1028`). Filing remains title-deduplicated within the recorded redesign label and uses the existing filing sequence.

The one-field fixture addition matches the already-produced `approvals · source-correspondence` field (`skills/super-auto/run-state.md:63`). Inspection of the full four-file diff confirms no fixture deletion, validator change, or test weakening; `test-contract-lint.sh:163–168` still rejects unexpected fields and lost baseline fields. The Task 4 source-correspondence/full-input/captured-source runtime contracts are unchanged in this range.

## Quality review and evidence

Read the Task 5 review package first, then its full brief/Global Constraints, approved workflow-reliability specification, report, source manifest and supplied diff. Inspected all four changed files and the complete affected Key Abstractions/Decomposition procedure, Amend Mode, both replay contracts, and both redesign callers. The source-backed original post-cap finding is consistent with the repaired interruption boundary; it was a static trace, not a live execution.

Independently verified that all four frozen Git blobs match the manifest's SHA-256 and byte counts and the inspected worktree files. The supplied diff matches `git diff` for the frozen range and its recorded SHA-256 `cad78b6231ad5a626b82b41cd4c0e716240492a4803ac3792495785f9e64f1cc`.

Ran only the focused read-only check `node tests/super-auto/resume-sync-contract.mjs`: exit 0, **10 passed / 0 failed**. Its checker and literal mutation controls appropriately establish mechanical instruction-contract coverage. Inspected retained logs confirming the reported initial **9 passed / 1 failed**, focused GREEN **10/0**, and full contract-lint GREEN. Did not repeat the broad suite or recreate behavioral evaluations.

Limits: this review establishes specification correspondence and source-level consistency for the frozen four-file Task 5 range. Neither the extraction test nor this review demonstrates actual `bd` idempotency, tracker effects, agent compliance, hosted execution, or run/root acceptance. Parent-owned prospective behavior evaluations and the actual-helper acceptance case remain separate after Task 6; the sync itself is an agent procedure, so no nonexistent standalone helper was requested. Parent plan/run/evidence changes were outside this review. No product, canonical evidence, tracker, Herdr, root, or index mutations were performed; this temporary report is the sole write.
