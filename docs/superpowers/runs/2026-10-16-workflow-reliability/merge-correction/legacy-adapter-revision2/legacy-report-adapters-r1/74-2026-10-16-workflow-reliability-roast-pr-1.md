super-roast verdict: Blocking (7 confirmed)

# Legacy interpretation adapter

Adapter-only synthetic labels and item boundaries. Exact raw source, original headings, complete passages, line/byte locators and interpretation limits are recorded in the hash-bound metadata. This document proposes history representation and makes no acceptance, identity-link or resolution decision.

## Findings — adapter/review-finding/raw-section-1/raw-byte-000001423

- [Should-fix] skills/super-code/coordinator.js:752 — Oversized persisted recovery holds lose their task scope during digest compaction, allowing the held task to run and merge. [lanes: data-migrations]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: Independent frozen-source probes show a valid 173-byte hold blocks bd-101, while the same hold with additive context at 5173 bytes yields one implementation dispatch and merge, clears the obligation, and reports ready-drained. The digest keeps only a gap pointer, which admission does not consult. Probe and receipt: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-0-reproduce/tests/super-code/probe.mjs and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-0-reproduce/receipt.json.
  fix-shape hint: Preserve or recover the held task scope before admitting work when compact transport drops the record.

## Findings — adapter/review-finding/raw-section-1/raw-byte-000002439

- [Blocking] skills/super-code/coordinator.js:25 — Omitting the supported invocationId makes Workflow startup call forbidden Date.now() and Math.random() APIs and abort before logging or dispatch. [lanes: concurrency-async]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: The documented contract says the script mints an ID when omitted; official Claude Code Workflow documentation says these clock/random APIs throw inside a script. Frozen-source VM checks show base starts without an ID and head throws before its first log; an explicit ID is a positive control. The documented dryRun examples do include invocationId, correcting the original evidence's contrary claim; the omission path remains explicitly supported. Evidence: https://code.claude.com/docs/en/workflows; docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-1-ground/repro.mjs and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-1-ground/repro-runtime-result.json.
  fix-shape hint: Mint the identifier outside the deterministic Workflow script and pass it through args.

## Findings — adapter/review-finding/raw-section-1/raw-byte-000003635

- [Should-fix] skills/super-auto/scripts/report-status:168 — The root acceptance gate trusts persisted collection-complete metadata and accepts corrupted archived review inputs without checking their saved hashes. [lanes: correctness]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: After collection completed, changing only a saved review diff changed its SHA-256, yet --acceptance still returned eligible:true with no gaps; recollection then detected an archive conflict. Reproducer and receipt: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-2-reproduce/probe.py and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-2-reproduce/receipts.json.
  fix-shape hint: Have the acceptance gate verify archived files against their collection records before declaring the run eligible.

## Findings — adapter/review-finding/raw-section-1/raw-byte-000004576

- [Should-fix] skills/super-auto/scripts/scope-dispositions:194 — Large finding projections are truncated on piped stdout while exiting successfully, so status and root acceptance cannot consume valid retained findings. [lanes: correctness, api-contract, observability]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: A fixture with 128 retained occurrences produced 203379 bytes on regular stdout but only 65536 bytes through a pipe, with exit 0 and invalid JSON. The actual acceptance consumer then reported projection unavailable; changing only the exit behavior restored full output and eligibility. Probe, acceptance probe, and receipts: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/probe.py, docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/acceptance-probe.py, docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/receipt.json, and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/acceptance-receipt.json.
  fix-shape hint: Deliver the complete projection to the consumer or detect and report incomplete output as a failure.

## Findings — adapter/review-finding/raw-section-1/raw-byte-000005938

- [Should-fix] skills/super-auto/scripts/report-status:224 — Committed assembled review archives are re-collected into later full-range reviews, recursively growing their inputs until slice creation fails with errno 63. [lanes: premortem, hot-path-perf]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: Frozen-head repeated review fixtures show unchanged product content copied 1, 2, then 4 times as collected files grow; the fourth assembly fails creating a 281-byte basename with errno 63. Probe and receipt: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-5-reproduce/probe.py and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-5-reproduce/receipt.json.
  fix-shape hint: Exclude prior generated review archives from later full-range assembly or reuse their stable slices.

## Findings — adapter/review-finding/raw-section-1/raw-byte-000006876

- [Should-fix] skills/super-auto/scripts/report-status:220 — Review collection follows intermediate directory symlinks and archives files outside the declared source workspace while reporting collection complete. [lanes: security]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: A fixture with workspace/assembled linked to ../outside returned collection complete and archived a sentinel file from outside the workspace. Result: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-7-reproduce/result.json.
  fix-shape hint: Reject symlinked path components while resolving and copying collected review inputs.

## Findings — adapter/review-finding/raw-section-1/raw-byte-000007582

- [Should-fix] tests/super-code/test-dispatch-text.sh:10 — The required dispatch-text test suite fails four assertions when TMPDIR ends with a slash. [lanes: testing]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: With the same trailing-slash TMPDIR, the frozen base test exits 0 while head exits 1 with four path assertions; removing the slash makes head pass. The failures compare an unnormalized temporary path with normalized output paths. Evidence: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/head-trailing.log, docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/base-trailing.log, and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/head-no-trailing.log.
  fix-shape hint: Normalize TMPDIR before composing expected artifact paths or construct the test directory with mktemp.

## Rejected — adapter/historically-rejected-claim/raw-section-5/raw-byte-000009093

- The claim that the new measurement aggregation rule is duplicated with conflicting semantics, so super-code reports a required live check as passed while super-auto reports the same retained check evidence as failed (skills/super-code/coordinator.js:354), is rejected. The concrete dissent reproduced pass versus fail for the same evidence, but the majority cited the contract at coordinator-workflow.md:645-657: coordinator pass means matching live/pass evidence is available, while semantic coverage and acceptance remain caller decisions. The acceptance gate separately requires reconciliation of contradictory records. Receipts: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-3-reproduce/producer.json and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-3-reproduce/consumer.json.

## Rejected — adapter/historically-rejected-claim/raw-section-5/raw-byte-000010005

- The claim that the new tracked archive of complete assembled inputs makes this branch's required next roast assembly fail with ENAMETOOLONG (skills/super-auto/SKILL.md:400) is rejected on materiality. The concrete dissent verified errno 63 for oversized flattened basenames, establishing the assembly failure. Majority evidence shows the documented fallback runs the roast directly against the same captured base/head and records assembler unavailable, preserving the required review and revision binding. Receipts: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-6-reproduce/receipt.json and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-6-refute/fixture.json.
