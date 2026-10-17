## Verdict
ready — part-04 historical evidence review complete; recorded failures and untested scope retained; this is not current whole-epic readiness.

## Source and scope

Fresh replacement review for invocation `inv-c96916a964634bb0bb5f2bd3b8e1769b`, obligation `review-former-cluster-52`, former cluster ordinal **52**, name `evidence-super-plan-ufz-14`, package `review-obligations-r1/review-former-cluster-52/part-04`. No coverage was inferred from the absent previous part-04 reviewer. The identically named cluster 9, other partitions, current product behavior, and caller/root acceptance are outside this review.

Worktree `W`: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers`. Plan directory `P`: `W/.superpowers/sdd/super-plan-ufz-plan`.

Frozen source range: base `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5`, head `612ea0a7e4d64480bdd01e0ac842b539115342ee`. Their Git trees resolve to `ef726b18218f1f7dbdf3d8cd7dfa78b88690220c` and `dcccf6e7d45f4c72f480a3375fac703da9b6a8f5` respectively. These identify the archived artifact range; they do not imply that every measurement ran at the frozen archive head.

The exact obligation was read from `review-obligations-r1.json` (197,817 bytes; SHA-256 `075c35b3ba6e2eca05cdd63c004af14a6821a07277ac6bbba14edb02bd574b0f`). `review-gap-queue-r1.json` was read in full (2,418 bytes; intake SHA-256 `ae90f030afb0a272b4626fde3f5ee777cfdee6776d51d44ed4663ec52d32c016`); its matching entry names cluster 52 / part 4, status `running`, estimate 139,420 tokens. Queue status is scheduling state, not evidence of review completion. Neither control file was changed.

The original obligation is the historical unreviewed/over-window cluster-52 gap. Its declared partition is file orders **57–89 inclusive**, **33 source files**, **66 physical inputs** including archived slices, **557,678 bytes**, estimate **139,420 tokens**. No other package was reviewed.

## Coverage and method

All assigned physical inputs were read and validated byte-for-byte against their recorded sizes and SHA-256 values: **66/66**, **557,678/557,678 bytes**. Full source-text intake is **33/33 files**, **272,487 bytes**, **4,544 lines**. Sixteen source hygiene logs are genuinely zero-byte files, not omitted intake. The paired archived slices total **285,191 bytes**.

Lossless deduplication was proven before omitting the duplicate text from repeated semantic reading: every slice is a new-file addition; each nonempty slice has one `@@ -0,0 +1[,N] @@` hunk and only addition lines; stripping exactly the leading `+` from every body line reconstructs the paired source bytes exactly. Empty source files have the corresponding header-only new-file diff. Slice headers were inspected, including paths, modes and object IDs. Each complete archived slice also equals fresh read-only `git diff --no-ext-diff --no-color BASE HEAD -- SOURCE_PATH` output exactly. Thus no deleted/context text or alternate source body was dropped.

Every nonempty source was read without truncation. The two long files were read through contiguous, exhaustive character windows: the pre-rebase manifest at `0:20500` and `20500:end`; the replay log at `0:24000`, `24000:48000`, `48000:72000`, `72000:96000`, `96000:120000`, `120000:144000`, and `144000:end` (157,678 Unicode characters, 157,869 UTF-8 bytes). Other assigned source files were read in full. Initial over-wide metadata displays were truncated by the tool; bounded rereads and the exhaustive source reads above supplied all assigned content. The intake claim does not rely on those truncated displays.

Review method: one fresh reviewer, inline evidence inspection and deterministic read-only structural/hash/Git comparisons. No further agents, live behavior runs, test reruns, signals, cleanup, tracker writes, Herdr actions, code edits, or original-artifact edits were performed. The sole output is this report. This is historical evidence review, not a multi-seat independent behavioral evaluation.

## Checks and interpretation

| Check | Result |
| --- | --- |
| Original manifest identity | The retained `assembled/final-review-inv-mvc60k41-xt8p35rk04d-final/clusters.json` is 235,683 bytes with SHA-256 `dcca5573e2b6986d6d580d22ebf052d2631ff7fca98f1c6bc350a4df9c8892cc`, exactly the preparation record's expected hash. Its one-based entry 52 has the exact expected name, full ordered files and full ordered slice paths. The manifest is retained run metadata, not a blob at the frozen head; source and diff identities were independently checked against Git. |
| Partition identity | Inventory indexes are exactly 57–89, each once per kind, in the manifest's order. The package's actual file set equals its 66 declared physical input paths; no undeclared package files or missing inputs. |
| Package integrity | All 66 lengths and SHA-256 values match; source bytes sum to 272,487 and slice bytes to 285,191, totaling 557,678. |
| Frozen source identity | All 33 packaged sources equal both the original `W/evidence/super-plan-ufz.14/...` files and `git show HEAD:evidence/super-plan-ufz.14/...`. All 33 paths are absent at BASE. |
| Archive identity | All 33 packaged slices equal the retained original slices under the preparation record's archive root, and each exactly equals the frozen-range Git diff. All 33 addition payloads reconstruct the paired sources, including all 16 empty files. |
| Pre-rebase source manifest | `source-manifest-pre-rebase.json` records head `3968cd7bd703518023cdafc618cc65faa7a94cd7`, repository tree `c2d4f8f4f760a9a58be9b611419c462f0207c533`, skills tree `a89cf9f0cfde6e72008d661a7b7196a5ab9cb1d0`. Both tree IDs match Git. All 331 hash-entry paths exist at that head; 328 hashes match that commit, and the only three mismatches are exactly the three declared modified sources: `tests/super-auto/test-scripts.sh`, `tests/super-code/replay-harness.mjs`, `tests/super-code/test-report-verdict.sh`. This is a disclosed dirty test snapshot, not a clean-commit measurement claim. |
| Standalone package record | `standalone-package-result.json` records source head `68a1e7425ec3fe238fa51a7c02b5050b40b09095`, repository tree `e308a5638d3a8cd1d096707d31162c5c0b47db66`, skills tree `200b0bc1eb2af88c3604aefcbe86a173075952fc`; both tree IDs match Git. Its command is `bash tests/codex/test-package-codex-plugin.sh`, result pass/exit 0, with explicit log and hygiene pointers. |
| Standalone baseline assertions | The exact SHA-256 values for `scripts/package-codex-plugin.sh` and `tests/codex/test-package-codex-plugin.sh` match Git at both the frozen run baseline and the standalone package source head (4/4 comparisons). The test log contains 33 PASS markers and the final success summary, consistent with that record. This validates the retained assertions, not a fresh package execution. |
| Other recorded outcomes | The replay log contains 2,273 PASS markers and ends `2273 passed, 0 failed`. Thirteen of the fifteen nonempty test logs contain successful summaries; two retain failed assertions. The table below records each count. No all-tests-green conclusion is drawn. |

The unprefixed test logs largely show assertion output, not complete per-command provenance envelopes. Their frozen artifact identity is fully verified; source/configuration/run-time association beyond what each file itself states requires the other assigned historical metadata. The pre-rebase manifest and standalone package record describe different source snapshots and are kept separate. Empty hygiene logs alone do not prove an exit status or authoritative process disappearance. Passing prompt-text, synthetic fixture, dryRun and live-sim assertions retain those evidence kinds; wording inside a PASS label does not turn them into fresh live harness measurements.

## Intake inventory

All paths below have source prefix `review-obligations-r1/review-former-cluster-52/part-04/source/evidence/super-plan-ufz.14/`. Each paired slice has prefix `review-obligations-r1/review-former-cluster-52/part-04/slices/slices/` and filename `evidence__super-plan-ufz.14__<source filename>.diff`. Hashes are full SHA-256 values. Zero source lines/bytes are intentional empty hygiene files.

| Order | Source filename | Source bytes | Source lines | Slice bytes | Source SHA-256 | Slice SHA-256 |
| --- | --- | ---: | ---: | ---: | --- | --- |
| 57 | `source-manifest-pre-rebase.json` | 41,019 | 343 | 41,638 | `c6ee015ead584816fa7406bb21c8f4b9a69de818df0718c4709067b1d1469959` | `6d8a58b9ed579de231908e1a0d05cb288082787329bd70842d94e1c4c4d9c3cb` |
| 58 | `standalone-package-result.json` | 914 | 29 | 1,215 | `31963d3e6df681184ed36259b0fb78ae6ed0d8f3656c0c3c115b529564f8b2b6` | `d1b251cbd415d9d046ae7b6c511b223f6d8096e9b668744caa5cd0f351dd181c` |
| 59 | `standalone-package.hygiene.log` | 0 | 0 | 177 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `20e4f7ef42e52d5c13fbbbad4acab66ba8bf3504cff9273c0631e397ba4c0083` |
| 60 | `standalone-package.log` | 1,666 | 35 | 1,949 | `6c06291c259b9413e507a1eb0a7892cb4a9aa22a91b718f1d913a746cb759d48` | `4678beefeb00df7a60ff85a67d38fa1d1d21b1fbaf23bad4e7e2218a89cd83bd` |
| 61 | `super-auto--test-contract-lint.sh.hygiene.log` | 0 | 0 | 207 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `de308d5fec0c9b35e0b70ab451cfd0a04e2f5807605f2b26a0710c00ae9c90d2` |
| 62 | `super-auto--test-contract-lint.sh.log` | 722 | 18 | 1,033 | `c778e056e99ff44edd70d58554e6f109649274a68a53922ebbd8e299215706bc` | `cad1ac92444ae22b375e4901cfd45e2e136e621012a5864a0c841ab8859c7d01` |
| 63 | `super-auto--test-scripts.sh.hygiene.log` | 0 | 0 | 195 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `17c3d20ae89cc283ceda2494d2ff58619505e42270490fa7e860ff102196371a` |
| 64 | `super-auto--test-scripts.sh.log` | 9,860 | 161 | 10,297 | `9f4b7b113ccc353832f67364d6ef7c685899204c36e9bd247249239b897705a5` | `c9433ced0a8a2f74292b8db4d8466b06b5a36a0cd145cc6caf949567c9b52749` |
| 65 | `super-code--replay-harness.mjs.hygiene.log` | 0 | 0 | 201 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `5bbadbbc8858bb5701d8874f6359fa369e9543e2d49e000d0ee594f36e6ac8af` |
| 66 | `super-code--replay-harness.mjs.log` | 157,869 | 2,681 | 160,836 | `2a3c831a9930ff1e285c86b27c9bc9c140a10a003d534e78d9720adca4a33f73` | `1ba343c65b1dc3f93b941fed8693b7b9a5b7d06b97673a9e8812b5346efc60e8` |
| 67 | `super-code--test-assembled-size.sh.hygiene.log` | 0 | 0 | 209 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `ad575169d9c2226e32850bc314d6c14c5a2e3c2e5f3217401d750714171d8ab7` |
| 68 | `super-code--test-assembled-size.sh.log` | 2,053 | 50 | 2,399 | `7d941b43e57029bc57002135f218698f60aaa1c6d3c66a8468563657deb0c5d2` | `7f291fb86e767b11c00a1985853178523fb37ff0074f8e838dfd685a19270103` |
| 69 | `super-code--test-context-preflight.sh.hygiene.log` | 0 | 0 | 215 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `584e2edc7c2f9adede913db4dbf43362d545cd4f422359dd75ba375d55b3e33a` |
| 70 | `super-code--test-context-preflight.sh.log` | 1,824 | 50 | 2,179 | `fa77d158819862f45f04eb5cbaec4c86f11fa34fe9e31aa10b2a0620d581e3c9` | `78e85afd356f1a7cf463eacaeb8ba17df80ed6ab8b3f36c6fa463f250e4299ec` |
| 71 | `super-code--test-dispatch-text.sh.hygiene.log` | 0 | 0 | 207 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `5baf7c857e071e6cc8191ed45f1d32f5293c7140596f7b5e7fe2b5617af7df9b` |
| 72 | `super-code--test-dispatch-text.sh.log` | 12,900 | 260 | 13,454 | `b1e9b3f4976fd23c6753615fc2e393e4663cde446beaf617096cfbdac98f8e07` | `34700e6789cd5b70a4dff29d2bdd0a89e47aa5f5dedc682f1a8d88071ee79c08` |
| 73 | `super-code--test-report-verdict.sh.hygiene.log` | 0 | 0 | 209 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `d081aebb33006236d431196048c894bdaf485194c10a7bcba9ce09e81c1620d5` |
| 74 | `super-code--test-report-verdict.sh.log` | 7,274 | 182 | 7,753 | `0135806c2d172e5f72ab039c15303f9ded4b99c2bde0eb463464183f8f69028e` | `950c628530223809b161cf8df6ba0a8952ffbcdbbc60edfc8fc2f50d5cd202f7` |
| 75 | `super-code--test-run-digest.sh.hygiene.log` | 0 | 0 | 201 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `70343115134dda7c9aecd009e3d665164311e9e7eaf0252133b936cec17b5e92` |
| 76 | `super-code--test-run-digest.sh.log` | 5,025 | 129 | 5,439 | `cf33ce9fb44ebcb97da70c7ef89a789b9bc95e4a48b0b8518add76c1615bd5a0` | `e746239b9ef297350822e6a54e07c4135fa57a56f2890cf539247f9ccc96d375` |
| 77 | `super-code--test-run-marker.sh.hygiene.log` | 0 | 0 | 201 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `f281d143c5f6d9c3c9cb97a8d71174765f0f0ac1a624cf7dfed80b09eae8f12a` |
| 78 | `super-code--test-run-marker.sh.log` | 4,296 | 118 | 4,699 | `0bb0b8c1aefd425a3a94767c05c3bb542c4dcfcb8c2f731639c7b4db479ab02f` | `ca5d7221713d6273c6916e1b74e1b060b0723d809a5536b5e6a9bce856115462` |
| 79 | `super-code--test-run-profile-in-flight.sh.hygiene.log` | 0 | 0 | 223 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `fefd235276280cb173bb669d5573e660a12a9a587ac80f2d1141fd13fd0e6ece` |
| 80 | `super-code--test-run-profile-in-flight.sh.log` | 812 | 19 | 1,148 | `3e00f86fee7eb1a557df7a42d28385bed57e9f17ceb929d6d5250e3764fe0ad0` | `1922db3eac4795e9259d27dc93e9762447fbf09345eae6d61f9b424d1a55cdd0` |
| 81 | `super-code--test-run-profile.sh.hygiene.log` | 0 | 0 | 203 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `d7db3d91de4075725098dd3a4cb09ec9ac19a363a05973083715df54ed23f739` |
| 82 | `super-code--test-run-profile.sh.log` | 20,635 | 334 | 21,257 | `ada09e1aba73358d12fec589b46682576713058c5e0f3798f824b98526f13095` | `f5fd1f682d1d5c315a9a1dd959d336cb8a39824cc573c372febfd57907c765de` |
| 83 | `super-code--test-split-oversized.sh.hygiene.log` | 0 | 0 | 211 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `947536939c4fd3ff7edcb75cfa3b29250c1cb98201ad1996ab653be4405f16df` |
| 84 | `super-code--test-split-oversized.sh.log` | 2,091 | 51 | 2,441 | `720371d8bfd4cad49bc3723682b700af261ec314cae9e7f9bf1a02bc07d3ea8f` | `ffbdf307db2221104564c531cce2ebb25a2217dff5274a0a55eac79c9d7ab4ab` |
| 85 | `super-code--test-task-surface.sh.hygiene.log` | 0 | 0 | 205 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `348409a08d8f416868fd972205a89840d682323a97f32023216b580dc28d88dd` |
| 86 | `super-code--test-task-surface.sh.log` | 367 | 11 | 668 | `292b2cdf140361ef98744bd06b8ef97b0d3dcf3bdee5a4d840c3a9ff3dd7b831` | `4ed5e6b2867c3b641ee23bd954107ef3978c8b4023452658259718ef867ba25d` |
| 87 | `super-design--test-scripts.sh.hygiene.log` | 0 | 0 | 199 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `9bc4ad25ddcc4940a36be855dd543a28f5d80b34dc2a65e2f84c0e72610f9f4d` |
| 88 | `super-design--test-scripts.sh.log` | 3,160 | 73 | 3,514 | `bafe2bfcbe65955c0cb68474465bd1e43f39d5a677c4f6a539be6e90dcc27a94` | `b64da9add0f4fda29d3ebda6ad34cf65a6c8a6f579761143b23a6aa6789f15e3` |
| 89 | `super-roast--test-assemble-args.sh.hygiene.log` | 0 | 0 | 209 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `e480e046754a8aa3e4b2620e9f8506993c416507176138caadde57829425ded4` |

Recorded PASS-marker counts for the fifteen nonempty logs, in inventory order: standalone package 33; super-auto contract lint 13; super-auto scripts 148 (also separately prints 44 root-acceptance assertions, which are not added to this marker count); replay 2,273; assembled-size 42; context-preflight 45; dispatch-text 244; report-verdict 148 with **5 FAIL**; run-digest 116; run-marker 103; run-profile-in-flight 14; run-profile 312 with **1 FAIL**; split-oversized 45; task-surface 8; super-design scripts 65. These are archived assertion counts, not fresh executions or independent measurements.

## Must fix before landing

None

## Untested scope

- Resolution of the retained historical failures is unverified in this partition. `super-code--test-report-verdict.sh.log:46–53` reports five producer/parser-contract failures: the single-mode dispatch builder returned 2 where 0 was expected, and the four prompt-format assertions then failed; line 182 confirms five failures. `super-code--test-run-profile.sh.log:158–161` reports unclassified coordinator label `resume-check`; line 334 confirms one failure. These remain failed observations. This report neither marks them repaired nor infers their current persistence; later/corrected result artifacts belong to other partitions.
- The three modified test-file contents in the pre-rebase manifest are represented here by their captured hashes and explicit dirty-file list. Their historical execution workspace bytes and any corrected/rebased test association were not reconstructed or reviewed through other partitions. The 331-entry consistency check validates the declared clean/dirty split, not every measurement's source association.
- No live tests, Workflow engine scenarios, ordinary-subagent sessions, process inspections, cleanup, package generation, or behavior evaluations were rerun. Synthetic, dryRun and live-sim evidence in these logs does not establish real resumed-session behavior, permission behavior, live cleanup success, or cross-harness equivalence.
- Other parts 1–3 and 5 of former cluster 52, duplicate-name cluster 9, former cluster 29, surrounding implementation, source-stability/result summaries elsewhere, current branch state, whole-epic acceptance and caller/root closure are outside coverage. The empty `super-roast--test-assemble-args.sh.hygiene.log` at order 89 does not supply its test outcome; that nonempty test log is in part 5 and was not read.

## Deferred OK

- Retain the original failed logs unchanged as historical evidence, alongside independently reviewed later results where available. Their presence does not itself make the evidence archive defective; it does prevent presenting these files as an all-green sweep or silently resolving the underlying failures.
- Preserve the separate source identities and all evidence-kind/availability qualifications. The standalone package pass is supported only as the retained observation at its recorded source and context; the pre-rebase dirty-test manifest, empty hygiene logs and passing simulations supply their stated, narrower evidence.
