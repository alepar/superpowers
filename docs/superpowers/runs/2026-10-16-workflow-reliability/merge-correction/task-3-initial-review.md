# Task 3 independent specification and quality review

Specification verdict: **FAIL — one Blocking acceptance-population finding remains.**
Quality verdict: **CHANGES REQUIRED — the same finding prevents clearance; no separate confirmed quality defect.**

Reviewed pinned `87166167a4414189497d4b8877fdc44eb71e76a6` against `ac2a20fab3c854cd1f2133d3be4fcaa7f7a6cb6e`, 2026-10-17. This is an independent inline review by a fresh Codex reviewer, not a multi-seat or cross-family panel. It does not establish root acceptance, merge permission, a new review round/cap, or any waiver. The original caps, pinned 6.0 operational policy, retained historical gaps, and human gates remain in force.

Read the task brief first, full implementation report, COMPLETE supplied review-package diff, full independent policy review, approved design (especially evidence/acceptance, finding continuity, and truncated-versus-valid-empty invariants), and pinned producer/consumer source. Source reads used `git show`; parent planning/evidence changes were not treated as committed implementation. Only report and isolated probe artifacts under `/private/tmp` were written. No source/index/HEAD/tracker/Herdr/process mutation, subagent dispatch, push, release, or broad test rerun occurred.

## Confirmed finding

**T3-R1 — Blocking: header-only truncated ledgers can clear source-population acceptance.**

Location at the pin: `skills/super-auto/scripts/report-status:201–204` (header acceptance), `:204–226` (population discovered only from remaining rows), `:285–298` (declared-source reconciliation).

The ledger reader accepts a four-line header as a complete ledger without validating whether its own retained summary proves that finding rows are missing. A real producer ledger containing one open Blocking finding has:

```text
# findings ledger — design — through r1
triggers: none
blocking: r0=- r1=1 carriedB=- regressedB=- degraded=none not-computable=no-progress,returned,regressed
ignored-overrides: 0
- [Blocking] same.js:1 · raised r1@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa · open · source roast · text <original.md>
```

Truncating that producer output immediately after `ignored-overrides` leaves `r1=1` visible but discovers no source. With the already-retained unrelated valid-empty final review and independently satisfied synthetic review/measurement/human prerequisites, the gate returns exit 0, `eligible:true`, empty pending/gaps. The intact ledger returns exit 3 with `source coverage: declared report has no retained source extraction`. This reproduces for BOTH real `--loop design` and `--loop code` outputs at the final pinned implementation.

Evidence: `/private/tmp/ufz-task3-review-8g12hjc7/receipt.json`; original full ledgers `original-ledger-design.md` and `original-ledger-code.md`; truncated inputs `ledger-design.md` and `ledger-code.md`; exact run records `run-design.md` and `run-code.md`; source report `original.md`; pinned helper copies under that directory's `skills/`. Probe report-status SHA-256 is `ad81889b839875520be411a2b5e618a30ba5a21cefe9aac6e4949b90b3a06a82`, matching the reviewed blob/report. The synthetic base came from the retained passing `acceptance-population-dyYvsM/empty/run.md` fixture; its actual source file remains available. No actual-run acceptance record was used or changed.

This violates the task's ledger-only accounting purpose and the approved distinction between truncated and genuinely empty evidence. Severity is Blocking because an unsupported root-close eligibility result defeats the artifact's stated core purpose; it is not a claim that a positive ordinary Blocking count must universally veto acceptance.

**Bounded correction:** reject internally contradictory/incomplete ledger transport as a named coverage gap. Preserve supported nonblocking, resolved, and rejected occurrence judgments after complete source reconciliation. Add producer-to-gate controls for this header-only truncation in both loops and a genuine empty-ledger control. Do not infer semantic identities or dispositions from keys or recomputed raw counts.

### Completeness limit within the same finding

A second narrow control used a real Should-fix-only producer ledger. Its truncated four-line header is byte-identical to a genuinely empty producer ledger header, in both loops. The gate also returns eligible for that ledger-only truncation. Unlike `r1=1` with no rows, this missing population cannot be detected from the existing header alone: the producer records no total row count or complete input manifest there.

The receipt contains `should-fix-ledger-only`, `should-fix-declared`, `empty-ledger-only`, and `empty-declared` cases for each loop. An actual `roast-design`/`roast-code` declaration of the Should-fix report restores the missing-extraction gap. A genuine empty producer plus declared complete empty extraction passes. Thus complete caller declarations and reconciliation are a required boundary, not optional paperwork; Task 4 must address the ledger-only completeness case explicitly. This review does not demand invented counts, a new general ledger, or universal rejection of valid-empty sources. A header consistency fix alone must not be described as proving all ledger-only source completeness.

## Specification assessment of the implemented seams

- **Retained pre-run contradictions:** correct within the supplied run-failure contract. Lines 152–153 import retained `f.gaps` before skipping diagnostic pre-run repair status. The test uses the real unchanged `classifyRunFailure` function and both contradictory and supported pre-run histories. It is correctly labeled a producer-function control, not a hosted Workflow execution.
- **Review-source metadata versus measurement:** correct in the reviewed implementation. Reserved IDs or explicit `data.reviewSource` identify the record, validation covers every retained root snapshot, conflicting invocation/base/head bindings remain gaps, and malformed bindings cannot silently earn clearance. Valid producer metadata skips only measurement interpretation. The real `bind-review-source` producer emits the tested record shape. The genuine deferred live-check test still refuses fallback-only evidence and accepts matching live evidence.
- **Declared source population:** substantial correct coverage, but incomplete because of T3-R1. Real design/code disputed ledgers cannot ordinarily hide behind an unrelated clean final source. Direct source coverage uses full fresh extraction, original source identity, and artifact correspondence; missing/unknown/truncated reports and forged-empty extraction fail. Later silence does not provide a local disposition. Outstanding nonblocking, explicitly resolved, and explicitly rejected findings can pass while ordinary ledger dispute counts remain visible.
- **Association contract:** the implementation binds actual original/retained bytes and hashes, an existing immutable source, supported basis/evidence, and fresh complete retained extraction. It does not create or dispose findings. Keys-only input requires complete physical-line coverage with existing refs in the one named source; refs are checked structurally, with semantic correspondence left to the explicit supported owner judgment. Ledger key membership is only transport consistency. Equal keys do not link sources; explicit finding links retain both original refs.
- **Archive/legacy handling:** filesystem aliases are canonicalized for artifact matching without changing source identity. Exact additional archive copies preserve the same source/content identity. Different-byte legacy adapters require actual strict-extraction failure, explicit interpretation limits, and agreement with the original compact kind/verdict. This is interpreted historical evidence, not a newly successful historical review.

The policy review's original ledger-omission FYI/pre-existing attribution remains intact. T3-R1 is a finding about the correction's remaining acceptance behavior; it does not retroactively relabel that original historical attribution.

## Quality and verification assessment

The complete diff has only two files: the acceptance branch of `report-status` and the focused 212-line test. The collection/ordinary-status suffix is byte-identical to the base, independently confirmed from Git blobs. No dispatch-text/coordinator selection authority changed. The new code is compact and local; the tests use real ledger/report/recovery producers with independently satisfied gate prerequisites, including positive resume/disposition cases. The main uncovered quality issue is the incomplete ledger transport validation described above, not test-count inflation or a fabricated success claim.

I inspected the retained RED/GREEN logs. Their stated counts are accurate:

- Corrected baseline RED: `workflow-task3-red-valid-controls.log`, 7 passed / 11 failed; meaningful producer/gate failures include both disputed ledgers, metadata wrongly treated as measurement, and pre-run contradiction clearance. The earlier driver-error RED is explicitly disclaimed by the report.
- Initial GREEN: 18/0. Correspondence extension RED/GREEN: 18/2 then 20/0.
- Provisional `final-green` is correctly reported as 21/1, not successful. Separate archive-copy RED is 0/1.
- Full predecessor focused file: `workflow-task3-final-acceptance-green.log`, 23/0, associated in the implementation report with report-status SHA-256 `b108d2451243436050e0909259a670e37581f6d35b730a259b1e37bbb8fbb8a6` and test SHA-256 `71ba6ca2b44a9778a24b12c9976fd73bbd57c818bc4c3b2232998b8e5f5da1ef`.
- Final consistency change RED: 0/2. Final affected checks: `ledger-consistency-green` 8/0 and `ledger-dispositions-green` 2/0.

The final source has **25 scenarios, a 23-scenario predecessor full pass, and 10 affected checks at final source**. There is no claimed or independently established full 25-scenario pass at final source. The retained logs generally identify fixture locations, not an embedded source snapshot; predecessor hash/run associations are explicitly the implementation report's provenance, not a new reviewer measurement. I independently matched the final committed file hashes: report-status `ad81889b839875520be411a2b5e618a30ba5a21cefe9aac6e4949b90b3a06a82`, test `758cad7299ccaca05cc91b04cdeb3f395f5464379a002fa065649a08d21a0900`.

Existing-check receipts show the reported script-suite success, collection recovery 24/0, and symlink controls 32/0; they precede final path/consistency refinements as disclosed. They were not rerun. This review ran only the concrete uncovered ledger-truncation probe and its closely related completeness/valid-empty controls. No live model evaluation or repository-wide passing claim is made.

## Outstanding integration and acceptance boundaries

Task 4 writer/schema instructions must establish complete settled design/code source reconciliation at handoff/resume, exact source-correspondence semantics, preservation of original artifacts/identities and legacy interpretation limits, and the explicit ledger-only completeness boundary above. Task 2 recovery-to-selector compatibility remains Task 4 work. Neither is waived by the parts of this Task 3 implementation that pass review.

After the scoped correction, obtain a fresh task review against its exact source. Actual historical source adapters, collection/provenance gaps, final whole-range review coverage, required live measurements, root reconciliation, and reserved human choice remain separate work. This report cannot close the root or reset the original review/fix caps.
