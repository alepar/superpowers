super-roast verdict: Blocking (7 confirmed)
mode: pr        iteration: 1 of 3
profile (assumed): This is an internal developer workflow plugin that acts on real repositories and run history. Durable evidence integrity, review isolation, context bounds, and finding disposition are in scope; core-purpose and real-data-loss floors apply.
inputs: super-auto/workflow-reliability@ff2f79f62cc34084c8df20edc5c2e4f201a5d630 vs d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5
coverage: scouts 12/12 (correctness, security, premortem, simplicity-design, hot-path-perf, concurrency-async, data-migrations, deploy-safety, api-contract, observability, testing, hygiene-docs) · raw 12 → deduped 9 → panel 9 · spot 0 · promoted 0 · judge completion 100% · remainder-capped: 0
independence: same-family (GPT-6) — seat-differentiated panel · rung: manual fan-out
seat-agreement: panels 9 · rr 0.89 · rg 0.89 · fg 0.78 · unanimous 0.78 · ground-loo 0.88 (n=8) · reproduce 7/2/0 · refute 8/1/0 · ground 8/1/0
lane-yield (found/confirmed/unique/refuted): correctness 2/2/1/0 · security 1/1/1/0 · premortem 1/1/0/0 · simplicity-design 1/0/0/1 · hot-path-perf 1/1/0/0 · concurrency-async 1/1/1/0 · data-migrations 1/1/1/0 · deploy-safety 0/0/0/0 · api-contract 1/1/0/0 · observability 1/1/0/0 · testing 1/1/1/0 · hygiene-docs 1/0/0/1

## Confirmed findings            ← consumed by super-design, one task per finding
- [Should-fix] skills/super-code/coordinator.js:752 — Oversized persisted recovery holds lose their task scope during digest compaction, allowing the held task to run and merge. [lanes: data-migrations]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: Independent frozen-source probes show a valid 173-byte hold blocks bd-101, while the same hold with additive context at 5173 bytes yields one implementation dispatch and merge, clears the obligation, and reports ready-drained. The digest keeps only a gap pointer, which admission does not consult. Probe and receipt: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-0-reproduce/tests/super-code/probe.mjs and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-0-reproduce/receipt.json.
  fix-shape hint: Preserve or recover the held task scope before admitting work when compact transport drops the record.
- [Blocking] skills/super-code/coordinator.js:25 — Omitting the supported invocationId makes Workflow startup call forbidden Date.now() and Math.random() APIs and abort before logging or dispatch. [lanes: concurrency-async]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: The documented contract says the script mints an ID when omitted; official Claude Code Workflow documentation says these clock/random APIs throw inside a script. Frozen-source VM checks show base starts without an ID and head throws before its first log; an explicit ID is a positive control. The documented dryRun examples do include invocationId, correcting the original evidence's contrary claim; the omission path remains explicitly supported. Evidence: https://code.claude.com/docs/en/workflows; docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-1-ground/repro.mjs and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-1-ground/repro-runtime-result.json.
  fix-shape hint: Mint the identifier outside the deterministic Workflow script and pass it through args.
- [Should-fix] skills/super-auto/scripts/report-status:168 — The root acceptance gate trusts persisted collection-complete metadata and accepts corrupted archived review inputs without checking their saved hashes. [lanes: correctness]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: After collection completed, changing only a saved review diff changed its SHA-256, yet --acceptance still returned eligible:true with no gaps; recollection then detected an archive conflict. Reproducer and receipt: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-2-reproduce/probe.py and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-2-reproduce/receipts.json.
  fix-shape hint: Have the acceptance gate verify archived files against their collection records before declaring the run eligible.
- [Should-fix] skills/super-auto/scripts/scope-dispositions:194 — Large finding projections are truncated on piped stdout while exiting successfully, so status and root acceptance cannot consume valid retained findings. [lanes: correctness, api-contract, observability]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: A fixture with 128 retained occurrences produced 203379 bytes on regular stdout but only 65536 bytes through a pipe, with exit 0 and invalid JSON. The actual acceptance consumer then reported projection unavailable; changing only the exit behavior restored full output and eligibility. Probe, acceptance probe, and receipts: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/probe.py, docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/acceptance-probe.py, docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/receipt.json, and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/acceptance-receipt.json.
  fix-shape hint: Deliver the complete projection to the consumer or detect and report incomplete output as a failure.
- [Should-fix] skills/super-auto/scripts/report-status:224 — Committed assembled review archives are re-collected into later full-range reviews, recursively growing their inputs until slice creation fails with errno 63. [lanes: premortem, hot-path-perf]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: Frozen-head repeated review fixtures show unchanged product content copied 1, 2, then 4 times as collected files grow; the fourth assembly fails creating a 281-byte basename with errno 63. Probe and receipt: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-5-reproduce/probe.py and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-5-reproduce/receipt.json.
  fix-shape hint: Exclude prior generated review archives from later full-range assembly or reuse their stable slices.
- [Should-fix] skills/super-auto/scripts/report-status:220 — Review collection follows intermediate directory symlinks and archives files outside the declared source workspace while reporting collection complete. [lanes: security]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: A fixture with workspace/assembled linked to ../outside returned collection complete and archived a sentinel file from outside the workspace. Result: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-7-reproduce/result.json.
  fix-shape hint: Reject symlinked path components while resolving and copying collected review inputs.
- [Should-fix] tests/super-code/test-dispatch-text.sh:10 — The required dispatch-text test suite fails four assertions when TMPDIR ends with a slash. [lanes: testing]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: With the same trailing-slash TMPDIR, the frozen base test exits 0 while head exits 1 with four path assertions; removing the slash makes head pass. The failures compare an unnormalized temporary path with normalized output paths. Evidence: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/head-trailing.log, docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/base-trailing.log, and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/head-no-trailing.log.
  fix-shape hint: Normalize TMPDIR before composing expected artifact paths or construct the test directory with mktemp.

## Not verified (beyond panel cap)   ← severe candidates the panel cap left unverified — listed, never dropped
- none

## Not verified (dedupe failed or judge lost)   ← findings a pipeline failure left unjudged — listed, never dropped
- none

## Beyond remainder cap (count only)   ← low-severity candidates the dedupe remainder cap dropped; the count survives, the claims do not
- none

## Rejected (with reason)        ← so re-roasts don't re-litigate
- The claim that the new measurement aggregation rule is duplicated with conflicting semantics, so super-code reports a required live check as passed while super-auto reports the same retained check evidence as failed (skills/super-code/coordinator.js:354), is rejected. The concrete dissent reproduced pass versus fail for the same evidence, but the majority cited the contract at coordinator-workflow.md:645-657: coordinator pass means matching live/pass evidence is available, while semantic coverage and acceptance remain caller decisions. The acceptance gate separately requires reconciliation of contradictory records. Receipts: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-3-reproduce/producer.json and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-3-reproduce/consumer.json.
- The claim that the new tracked archive of complete assembled inputs makes this branch's required next roast assembly fail with ENAMETOOLONG (skills/super-auto/SKILL.md:400) is rejected on materiality. The concrete dissent verified errno 63 for oversized flattened basenames, establishing the assembly failure. Majority evidence shows the documented fallback runs the roast directly against the same captured base/head and records assembler unavailable, preserving the required review and revision binding. Receipts: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-6-reproduce/receipt.json and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-6-refute/fixture.json.

## Unverified nits (spot-checked)
- none

## Escalations (need human)      ← UNVERIFIED externals, incomplete panels, unsettled panels, material dissent
- none

Execution provenance: This is the same PR round 1 continued after the previous controller failed. All 12 same-round scout results were retained; fresh dedupe and 27 fresh blind seats ran. Required pre-roast assembly failed with errno 63, so the documented DIRECT INPUT frozen-Git fallback was used; the relevant assembly and fallback receipts are docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-6-reproduce/receipt.json and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-6-refute/fixture.json. The cited scripts and receipts were copied and SHA-256 verified; temporary-path prefixes map to durable equivalents in docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/durable-path-map.json.
