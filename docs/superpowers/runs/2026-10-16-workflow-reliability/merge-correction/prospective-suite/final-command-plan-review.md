# Prospective final command plan review

**44 unique serial command groups: 28 current AGENTS + 9 retained focused + 7 new correction. No suite executed.** Proposal: `/private/tmp/ufz-correction-final-command-plan-proposal.json`. Provisional source `7b18b0c26b9f19d531c558e112d490743901a13b`, tree `61a8b70d795acd816d348934bd55293264ed5587`; parent must freeze/recheck any later source.

All44 entrypoints are tracked regular nonsymlink files at that commit and current worktree bytes matched. All commands fit the approved runner: exactly `bash tests/...sh` or `node tests/...mjs`, no flags/arguments. Original37 order and `combined-suite-case-01`…`37` IDs are preserved; append proposed new IDs `38`…`44`. The projection entrypoint appears once (case33), replay once (case01); do not add the wrapper `test-coordinator-replay.sh`, which execs that same harness. CLAUDE.md is a tracked symlink to AGENTS.md, so its effective envelope is the same28.

Approved private runner SHA256 `7e34ddc54f52dc193ed84d07b44bf4e0fda1fa978fbc6e1c7aad053367e0d41d`; approved outer launcher SHA256 `89b2316cdd4773d49fa5db379dabdac55ed7d34c3fbb85d3046ac15faa49c87e`. Neither changed.

## Ordered commands and SHA-256

| Case / requirement ID suffix | Command | SHA-256 |
|---|---|---|
| 01 | `node tests/super-code/replay-harness.mjs` | `8e540e28b28a2b7a80f8921940e871408464c3d0c0936555a3075ac29a04e06f` |
| 02 | `bash tests/super-code/test-run-profile.sh` | `127a5aa66a3bc8956228867732a82a0b3d94b9a13e902250fc9001a2cc7f35b1` |
| 03 | `bash tests/super-code/test-dispatch-text.sh` | `d48e7c7bc404b09ee053e45a9056c02b7912ef08b0d8ed48b4384539495e72b7` |
| 04 | `bash tests/super-design/test-scripts.sh` | `bdc00605267a07966a49aa1e0adf7094773e9a0bde237205b119179ea5ae8b34` |
| 05 | `bash tests/super-design/test-findings-ledger.sh` | `adc438054c325a5d12addcda054083751cab475b93a87b3219622c27446bbc37` |
| 06 | `bash tests/super-design/test-step-back-check.sh` | `42c7b1cc1f00bbb0c6c87ac13f2a41d18d082f0ff32d5e880690ca01d60efdc0` |
| 07 | `bash tests/super-design/test-amend-check.sh` | `38229bed4bd4aa1b0a100447a509329d4e9ded756bb0c085be53f7d0a8d6761a` |
| 08 | `bash tests/super-design/test-redesign-chain.sh` | `de98d95a580341f32d83c1347285b3bd39d92d860404858867fbba2f53f43401` |
| 09 | `bash tests/super-design/test-redesign-cycle-filing.sh` | `7c8fe4ca1415d1ca110285a826031192286a8eb165a7b2d2f2bb23787196b891` |
| 10 | `bash tests/super-roast/test-assemble-args.sh` | `39046913137a6202d12cfc8ab1e333229c5d73c218d4171fd8ec1dce17e53454` |
| 11 | `bash tests/super-auto/test-scripts.sh` | `425a60cf07538e100c13643e3b2aaa8c772753ba819283dc53f1629409e5e26e` |
| 12 | `bash tests/super-auto/test-contract-lint.sh` | `d0bc031e5be20049f3f6dd45bf32d4c44762e6f2fb3d95f96100ac52f0304e95` |
| 13 | `bash tests/skill-scripts/test-bash-invocation.sh` | `faf3ef8e7df14236be0e2c8f40ae1d2c04b5405b62c0c24c5e204a200038afa4` |
| 14 | `bash tests/codex/test-marketplace-manifest.sh` | `da5877bc966dd3192de769c5557f23252048b5eae6a86845b4989e0491729b15` |
| 15 | `bash tests/super-code/test-run-marker.sh` | `4282f9bede10c088b88bf1f6c13ca63b2832515bbfbdc0fb25570e02e095cdde` |
| 16 | `bash tests/super-code/test-run-profile-in-flight.sh` | `028fc0f4d8193ce71b1ce3513cb99b581998dc15d5404589503cd18ab78a283d` |
| 17 | `bash tests/super-code/test-report-verdict.sh` | `d5a8118819f7097d08be1736af18793ad83ba70d54f9f37d3aefb43500e4797c` |
| 18 | `bash tests/super-code/test-run-digest.sh` | `ae18759dde95d630bc665dd198b985ed9d15265b4c31a55cd8f6338243ef40fa` |
| 19 | `bash tests/super-code/test-task-surface.sh` | `ae01b0e5e3595d576866bc44e1fc27a859e587735898d3da49a7a7919bcf974b` |
| 20 | `bash tests/super-code/test-split-oversized.sh` | `33fc26eae80667348ae408535b5d0176e8f97d9236e2330c440b0076e9e3abb5` |
| 21 | `bash tests/super-code/test-context-preflight.sh` | `2b587f475b0df50bb4f2428b7a6e9484229a04f68581bfbb821e31d95d0c8bf1` |
| 22 | `bash tests/super-code/test-assembled-size.sh` | `3d2ccaec537d09fbbdb5936e26d40c5a15d84a806493da36aad2babbeeb75cc3` |
| 23 | `bash tests/hooks/test-session-start.sh` | `3267341676ad09ca998a6ecc0a58e0c6a90b55729d42960bf2abbe5989753a4e` |
| 24 | `bash tests/hooks/test-run-block.sh` | `4af69bfe823bf945f5f52736d249322701917b92d09488f33070d5ec765d5f68` |
| 25 | `bash tests/hooks/test-reinject-smoke.sh` | `7d61bf6af7e4b46f4c9b97d41a577ddbcd5491e64a5f57e4caed7bb0c4a5be92` |
| 26 | `bash tests/codex/test-package-codex-plugin.sh` | `01b0ea28197a38e2142125b199e67637bfb5ec123f03af0918a2a86a316cbab9` |
| 27 | `bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh` | `f13e38b0a0fcb955bd362c1c91868b47e29c0e7717017e2d145f4069e5096e2c` |
| 28 | `bash tests/skill-scripts/test-prompt-text-fresh-rounds.sh` | `e13fce67e8b23ac85212e2446beb17cb42b4c46547205fc13cc5262424da8f0b` |
| 29 | `bash tests/super-auto/archive-integrity-r1.sh` | `21285fda3051e7dd001ca757310c128d55d29fdd630cd4b38ec19f56d828085c` |
| 30 | `bash tests/super-auto/collection-symlinks-r1.sh` | `3e7eff204bbeb8502d41ea3cb4d3fce94240da278f573a3971457b10d6d39754` |
| 31 | `bash tests/super-auto/generated-review-inputs-r1.sh` | `a7da9f3718adf97186d277859164ae6dda6675ff463a448a91ff1d7192129b0c` |
| 32 | `bash tests/super-auto/outer-cleanup-r1.sh` | `41277da48b5000b487ac63ec6b39ec6eb449d2f982a835537c8c82a1e81e9ee4` |
| 33 | `bash tests/super-auto/projection-output-r1.sh` | `514f03a926217fc2ac6b3dfae8fc15a8a70ff45bcf36b4cac88dc3758fce12ff` |
| 34 | `node tests/super-code/invocation-source-binding-r1.mjs` | `96bc655d4e7fbe6375f21285bcefd15769a9f15b01de96620d581e1391e37ff7` |
| 35 | `node tests/super-code/invocation-start-r1.mjs` | `8a4fb6034007e494e4cb9926519a3aaf01e6d1ef04e58afe973a05a388aeefe2` |
| 36 | `node tests/super-code/recovery-hold-scope-r1.mjs` | `45aca60f8cba478195e0a7113ff1c9595249822c0b4bc2776188a7d481bee77b` |
| 37 | `node tests/super-code/startup-builder-seam-r1.mjs` | `29bd8940eadbe2b67089a7ba5c3938a68cd7eebbf72425355c719e5d0c01e013` |
| 38 | `bash tests/super-auto/collection-recovery-correction.sh` | `12b343f3c63151718f57ed6bd5ed863fb635770cc542d919976399153040879c` |
| 39 | `node tests/super-auto/acceptance-population-correction.mjs` | `16f46da7a5abd18f8463a0a0dd9026b647d8b001b257dc284349efd986b2e0c0` |
| 40 | `node tests/super-auto/selection-recovery-correction.mjs` | `d46d2814f4c332d7d25bac5393738f7fc6b52244c74bfe04d36593408cb10e7d` |
| 41 | `node tests/super-auto/resume-sync-contract.mjs` | `acdf27fed2346f2793b19abd2e9ed27c9ca87007494a508ad90a0a0915cab051` |
| 42 | `bash tests/super-code/test-setup-cleanup.sh` | `85dbbeab6b281e3240607de672aa2fd4c591ec6e0277d68a8dbf2c945e398e12` |
| 43 | `bash tests/super-code/test-stop-run-processes-inventory.sh` | `4b7b5f17f8bef2af08f991e26a7759d3d8f1a9e63a15db164cc070b882e6ea7a` |
| 44 | `bash tests/super-code/test-verification-completion-metrics.sh` | `b9962101de239173f7bc412ad82e14c980a6d4fb0dc21f75fb8d140dce98ce5f` |

## Measurement amendment boundary

`final-suite` continues to identify the historical aggregate in the existing record; this proposal does not satisfy or mutate it. Existing37 case IDs need explicit versioned same-ID command/configuration/source amendments for newly measured final-source execution; append38–44 as new measurements. Preserve every earlier snapshot, old37 success at f726f0e/tree35e91189, old aggregate mismatch, failures and uncertainty. Old evidence cannot become a new-source pass. Do not silently omit requirements or substitute exact declared Recovery commands. The new aggregate identity must name the actual approved launcher/runner/frozen plan invocation and exact runtime configuration/outcome.

Authority is the parent-supplied user scope: bounded repair/acceptance and conditional local merge, no waiver; owner may amend known outdated measurement intent with honest versioned evidence. Pinned6.0 phase6:314 uses AGENTS fallback because actual Launch never names config.sweep. Current run-state caller acceptance explicitly permits same-ID amendment with retained authority/evidence. This seat lacks the original user message verbatim: exact approval receipt and owner amendment remain null/pending for parent freeze. No authority to waive review/evaluation/Recovery/history/human gates or infer root closure is supplied by this proposal.

## Documented Workflow check

Case01 already executes the doc’s exact three JSON dryRun args. Fresh output must show canonical48, fix-pass-blocked19 and parked23 actual dispatch counts, each `[PASS] run completes without throwing`, passing terminal/bucket assertions, final zero-failure summary and exit0. Bind logs/receipt to final head/tree and doc/harness/implementation hashes. If individual assertions are not printed, preserve scenario machine receipts/traces proving each assertion executed with those actual values; an aggregate pass count alone is insufficient. This is offline canned-runtime replay, with no hosted Workflow/live-agent inference. AGENTS triggers engine-specific checks when an engine changes; roast engine’s distinct documented counts are22/23/22 if applicable, not48/19/23.

## Unfilled final-freeze inputs

`checkout`, `output`, `reviewReference`, final runtime configuration, exact authority receipt, owner amendment and quiet-host facts are deliberately null. Runner rejects this proposal as supplied. Parent must resolve the reviewed final commit/tree, rehash source entries, prepare a clean standalone clone and new disjoint owned inner/outer roots, freeze the canonical plan, and supply fresh no-roast/no-coordinator-Workflow-in-flight facts. Approved launcher/runner determine and retain actual executable hashes, controlled environments, cwd, timestamps, exit outcomes and configuration identities. Keep all roots/errors/timeouts for separate scoped inspection; no cleanup/process absence claim follows from proposal preparation.

Read-only checks only: Git object/ls-tree reads, file/hash comparison, JSON/AST parsing. No test, product/index, original owner record, Herdr or tracker writes.
