# Source-selection and review-binding partition

## Binding and scope

This is one partition of the composed whole-branch review, not a global readiness verdict.

- Checkout: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers`
- Base: `832b051c870ae5c69adfa7f14d770292ab6c1a81`
- Head verified: `7b18b0c26b9f19d531c558e112d490743901a13b`
- Package: `/private/tmp/ufz-correction-final-source-review/source-review.diff`, all 150485 bytes read across sequential passes; SHA-256 `df61ce104c79ff01224c4eb5b3bec890e87644da3fc1155258e4b260237bed5a` matches manifest.
- All twelve assigned current files match manifest byte lengths and hashes. All changed hunks, including test hunks, were read. No assigned path omitted.
- Requirements read: the approved workflow-reliability design in full, and the corrective implementation plan, including Global Constraints and Task 4/6 boundaries.

Assigned path coverage:

1. `skills/super-code/assembler-prompt.md`
2. `skills/super-code/scripts/dispatch-text.mjs`
3. `skills/super-code/scripts/report-verdict`
4. `skills/super-roast/SKILL.md`
5. `skills/super-roast/judge-seat-prompts.md`
6. `skills/super-roast/scout-prompts-pr.md`
7. `skills/super-roast/scripts/assemble-args.mjs`
8. `tests/super-auto/generated-review-inputs-r1.sh`
9. `tests/super-auto/selection-recovery-correction.mjs`
10. `tests/super-code/test-dispatch-text.sh`
11. `tests/super-code/test-report-verdict.sh`
12. `tests/super-roast/test-assemble-args.sh`

Named cross-contract reads outside this partition: `coordinator.js` Finish selection/fallback dispatch, `assemblePrompt`, source/write guards, final single/cluster/seam/stub builders; `coordinator-subagents.md` final-review source capture and fallback procedure; `report-status` complete-extraction and collection outcome paths. These reads trace selector → actual caller and stub producer → extractor → collector risks only, and are not full reviews of those separately assigned files.

## Strengths

- The selector obtains metadata and payload bytes from captured Git, hashes manifest claims, retains reports/findings/unclaimed files, and removes omission authority on any provenance gap. A malformed copied historical run record remains a gap; it cannot silently exclude source.
- The zero-omission diffstat path avoids redundant path arguments, preserving source availability for the actual wide-range condition targeted by the correction. This does not assert arbitrary-size Git output support or omit the separately retained historical gaps.
- Source binding is persisted through the existing Recovery transport, rejects conflicting bindings and existing partial outputs, and is consumed by the actual final-review write guards. Roast prompts receive resolved commits and explicit review-owned filesystem/reproduction boundaries.
- Bounded review independently rechecks source commits, full changed inventory, and exact hunk headers, preserves the draft and concrete findings, and forces a non-ready result. The actual Workflow caller also wraps the returned verdict as incomplete; ordinary callers have matching instructions.
- Added tests exercise collector-generated recovery history, tampered provenance, advancing caller tips, uncapped occurrence extraction, immutable archive identities, and bounded review through extraction, collection, and a still-ineligible root gate. These are substantive producer/consumer checks, though no tests were executed during this review.

## Issues

### Critical

None found in the assigned scope.

### Important

**SR-1 — The complete extractor rejects the normal generated null-seam fallback stub.**

- Primary changed location: `skills/super-code/scripts/report-verdict:117` (particularly line 119).
- Actual producer: `skills/super-code/coordinator.js:2997`; dispatch trigger at `coordinator.js:2401`.
- Actual consumer: `skills/super-auto/scripts/report-status:491`, with collection outcome at lines 502–506.
- Trigger: split final review completes one or more cluster reviews, the seam reviewer returns null, and the mechanical stub follows `finalReviewStubPrompt` exactly. That prompt explicitly requires an empty `## Untested scope` heading and an empty `## Deferred OK` heading.
- Failure: the new `--complete` parser marks both headings relevant, then `closeSection()` throws whenever a relevant section has no content. It therefore returns exit 2 on the generated stub (`empty finding section: Untested scope`). The collector necessarily invokes this mode for the final report and records `complete extraction unavailable`, yielding `collection: gaps` / exit 3 even when every bundle byte is present and correctly archived.
- Effect: an intentionally incomplete but successfully written fallback report cannot become a complete collected source. The caller must retain resources and block the next invocation/cleanup for a producer/parser mismatch, beyond the legitimate outstanding whole-epic review obligation. Retrying the same deterministic stub cannot repair it; immutable artifact protection also prevents silently replacing that report.
- Repair direction: keep the extractor strict and make the stub emit explicit valid bullets (the actual unreviewed scopes, and explicit `- none` where appropriate), then cover generated stub → `--complete` → collection with cluster-report retention. Do not clear the outstanding review obligation or fabricate a ready verdict.
- Evidence level: direct static producer/consumer trace, not a newly executed reproduction. Existing changed tests check stub prompt/path generation and independently check that empty sections are rejected, but do not compose these two contracts. This is an implementation contract mismatch, not a complaint about pending real-run evidence.

### Minor

None reported.

## Requirements assessment and limits

The assigned selection/source-binding implementation substantially follows the approved safety, finding continuity, and independent-evidence constraints. The bounded route does not convert source availability, collection completeness, or green measurement into whole-range readiness. SR-1 is a concrete recovery integration gap against the requirement that interrupted review work remain recoverable through existing collection/caller boundaries.

The supplied Task 4 scope-clean assessment and actual inventory facts (8725 paths, 707 retained archival gaps, zero omissions, source available) are context from the parent, not independently rerun evidence. This review does not change their status or erase the earlier archival gaps. It does not restamp original 6.0-policy evidence onto the separately authorized correction.

No suite, behavior evaluation, real interruption, selection regeneration, or root gate was run. Those source-bound checks remain the global composer's responsibility, alongside the other review partitions and any later changes. No checkout, index, tracker, Herdr, or product files were mutated; this report is the only written artifact.

**Scoped assessment:** one Important producer/parser integration issue (SR-1) requires disposition. No global ready/merge verdict is issued.
