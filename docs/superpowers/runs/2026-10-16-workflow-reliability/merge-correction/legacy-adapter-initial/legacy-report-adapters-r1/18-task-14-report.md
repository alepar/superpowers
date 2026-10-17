Status: IMPLEMENTED

# Legacy interpretation adapter

Adapter-only synthetic labels and item boundaries. Exact raw source, original headings, complete passages, line/byte locators and interpretation limits are recorded in the hash-bound metadata. This document proposes history representation and makes no acceptance, identity-link or resolution decision.

## Concerns — adapter/pending-obligation/raw-section-3/raw-byte-000007840

- `git diff --check` and `git diff --exit-code -- tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt` passed. `git status --short` was empty after commit. No full-epic sweep was run here.

## Concerns — adapter/scope-or-coverage-qualification/raw-section-5/raw-byte-000010629

- JSON retains `{version:1,findings:[...],gaps:[...]}`; metric-task additive fields may coexist. Check each group's `outstanding`/`deferred`, original `ref`, occurrences and supported dispositions; this task does not recompute or replace that engine. Exit 0 validates projection, 3 retains findings plus gaps, 2/4 establishes no projection. Keys alone cannot establish clean acceptance. Full source records retain known occurrences even when their archive pointer is unavailable.

New explicit preservation interface:

```bash
bash skills/super-auto/scripts/report-status --collect RUN_MD --invocation ID --workspace WORKSPACE --review FILE_OR_none --verdict REVIEW [--required RELATIVE_FILE]...
bash skills/super-auto/scripts/report-status --collect RUN_MD
```

The caller confirms settlement from persisted Launch/result, supplies the exact invocationId and actual reviewPath/null result, and preserves any declared required-input inventory. Collection returns 0 only when preservation is confirmed; 3 retains gaps and blocks later invocation/cleanup; 2/4 means no collection established. The initial intent in approvals contains invocationId/workspace/reviewPath/review/required/settled:false; settled/completion records append facts with complete/files(path,sha256)/gaps. The last record per invocation describes preservation progress only. It never closes a finding or root acceptance obligation. Archived source IDs are ID/final and ID/cluster-N; artifact pointers are reviews/ID/... relative to RUN_MD. Existing finding-route/link/disposition records are preserved.

Ordinary `report-status RUN_MD [--tip SHA] [--stalled PHASE]` keeps all legacy status forms/output where new data is absent. New records add `outstanding findings: N`, `review collections pending: N`, `review collection gaps: N`, `finding evidence gaps: N`, or an unavailable qualifier. Ordinary status exit 0 is a successfully rendered status, not an acceptance/cleanup approval: task .6 must inspect the projection, collection outcomes and its own caller-owned review/measurement/human obligations. This task deliberately adds no root-closing option or acceptance engine.

## Concerns — adapter/pending-obligation/raw-section-8/raw-byte-000014276

- Representative fresh-agent post behavior evaluation is REQUIRED and remains coordinator-owned/pending, as does integrated same-pack after/live-isolation evidence. This implementer cannot spawn agents per dispatch. Deterministic RED/GREEN helper fixtures are not claimed as fresh-agent behavior verification.

## Concerns — adapter/pending-obligation/raw-section-8/raw-byte-000014948

- Semantic sufficiency of a fix/rejection remains the owning agent's judgment before recording supported disposition; structural fields alone are not a semantic oracle. The collector cannot infer a missing optional direct input from absence alone, so callers must declare known required direct inputs with --required; split manifest and discovered assembled files are checked mechanically. Collection must run after confirmed settlement and serially with run.md writes, as the operative recipe specifies. Acceptance ownership, metrics and the full epic sweep remain outside this task.

## Concerns — adapter/pending-obligation/raw-section-12/raw-byte-000024709

- The Minor pending-behavior-eval finding remains deferred to the coordinator as instructed. Fresh-agent post evaluation, integrated after/live-isolation evidence, root acceptance and metric decisions remain coordinator-owned; these deterministic tests make no claim to establish them.
