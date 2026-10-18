# Historical failed assembly archive contract implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Allow authenticated preservation of honest failed bounded reviews to coexist with subsequent fresh reviews.

**Architecture:** A shared pure contract validator distinguishes a bounded failed-selection archive from successful assembled inputs. Producer and selector use the same evidence validation; historical report bytes and all existing identity, hash and required-input gates remain authoritative. Bounded partial sidecars grant no omission authority.

**Tech Stack:** Node builtins, Bash wrappers, real Git fixture tests.

**Spec:** none — authoritative handoff mQ0V7hYHOwVe in dKvDR9Ss7r5; retained triage /private/tmp/test-reliability-peer-historical-digest-triage/report.md.

## Global Constraints

- Preserve e1ee751 current pending-intent correction.
- No main merge/push/release, cache edits or real consumer mutations.
- Preserve saved hashes, identity/history, required inputs, source pair, bounded report/draft/coverage correspondence and original verdict.
- Bounded preservation grants no omission, readiness, acceptance or retroactive coverage.
- Successful bundle digest and split completeness failures remain hard gaps.
- Existing archive migration must retain original records and payloads; no settled-null relabel or old-ID recapture.

### Task 1: Shared producer/selector contract and regression

Files: new `skills/super-code/scripts/assembly-archive.cjs`; modify `skills/super-code/scripts/dispatch-text.mjs` and `skills/super-auto/scripts/report-status`; new `tests/super-auto/failed-assembly-archive.mjs`.

Interface: shared validator consumes collection identity, hash manifest, archived bytes and exact captured Git source callback; returns typed failed bounded preservation only after validating all evidence, or throws. No failed partial sidecar enters omission claims. Any persisted type must be validated rather than trusted.

- [ ] Build real Git fixture: pending intent, deliberately failed selection, strict draft + actual hunk coverage, real bounded-review, actual collector, fresh invocation selection. Assert preserved files and verdict unchanged and full partial evidence remains selected. Run before implementation: expect missing digest failure.
- [ ] Implement shared validation using the existing Coverage record and source-bound evidence; require failed selection inventory equals captured Git diff, nonempty gaps, zero omissions, sourceAvailable true, wholeRangeReady false, hashes and original workspace paths agree, inspected hunks match captured source, final report is exact bounded transformation of retained strict draft. Reject arbitrary missing digest and split artifacts.
- [ ] Add producer type to collected records and support safe legacy interpretation only by full equivalent validation. Maintain digest requirement for successful claims, including historical saved digest commitments.
- [ ] Run negatives for evidence forgery/hash changes, identity/history, required bundle loss, digest deletion/corruption, split loss; run current-review-selection, generated-review-inputs-r1.sh, selection-recovery-correction.mjs and collection/archive suites.
- [ ] Record exact source-bound RED/GREEN, commit implementation, and request independent task review for spec compliance and quality.

### Task 2: Historical replay and handoff proof

Files: scratch evidence and a committed handoff report; no real consumer edits.

- [ ] Replay retained peer source pair in independent no-hardlink normal clones; validate both historical archives and inv42 from immutable captured sources. Preserve original failures, report selection status and qualifications honestly.
- [ ] Exercise ordinary and Workflow construction paths as applicable; mechanical proof is not native skill efficacy or consumer acceptance.
- [ ] Obtain broad independent branch review, resolve material findings, retain exact base/head/tree/patch and test hashes in handoff.
