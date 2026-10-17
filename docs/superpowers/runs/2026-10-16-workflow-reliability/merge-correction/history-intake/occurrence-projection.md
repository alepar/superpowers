# Occurrence-oriented historical projection

All **79** sources are accounted for. The **24** original strict occurrence objects are unchanged. This view separates **26 new historical finding/minor appearances** and **4 structured finding/minor renditions** from **121 scope/concern passages**, **99 explicit empty declarations**, and **30 historical repair passages.**

These are prospective source appearances, not a current outstanding-defect total. No canonical records were registered, repetitions were not consolidated, and no source claim of FIXED/resolution was accepted as proof. The original roast rejection texts retain their state and basis.

## Finding and minor appearances

### inv-mvc60k41-xt8p35rk04d/task-10-review

- Original section `Issues`, lines 18–18; historical-finding-or-minor; no disposition applied by intake.

> Important — skills/super-code/coordinator.js:432: The verification guard compares verified.sourceTree only against the current event's observed record. A normal verification-only reply omits observed, so !observed makes the guard true even if that exact source tree and command/configuration already has a retained live/fail observation. Concrete history: the existing fixture establishes baseline a/pass, A source b/fail and owner bd-A; append a reply with evidence [b/live/pass] and an association containing verification:0 but no observed/runBaseline. The reducer retains the original b/fail comparison, sets state=verified, and records no contradiction gap. This is the same immutable tested source as the recorded failure, not evidence of a repaired source; the contradictory outcomes need reconciliation. Callers explicitly retire the qualifier on this verified state, so the open repair can disappear. Compare the verification source/outcome against retained linked observations (and other associated outcomes), preserve ownership/open state with a contradiction gap when they conflict, and add a deterministic fixture for verification-only contradiction after durable re-entry. If repeat measurements are intentionally reconciled, require explicit supported reconciliation rather than silently accepting the later pass. The within-one-event baseline/observed same-tree guard does not cover this durable-history path.

### inv-mvc60k41-xt8p35rk04d/task-11-review-seam-round-1

- Original section `None`, lines 6–6; historical-finding-or-minor; no disposition applied by intake.

> finding: The new diagnostic-deferral fixture in tests/super-code/replay-harness.mjs:1722 uses the old unconstrained data.runFailure shape. Sibling 97ee30a1 added readRecovery's validRunFailure check: nonempty configuration is required, and every history event needs dispatch, an identity-matching claim and an evidence array. This fixture lacks all of those. It is therefore retained as an invalid-run-failure gap, never inserted into recovery.obligations; the exact-obligation assertion at line 1732 necessarily fails for both hold/deferred variants. This also leaves the claimed compatibility coverage without a valid diagnostic history. Smallest reconciliation: replace only that diagnostic fixture with a schema-valid unscoped deferred runFailure (matching failure/command/configuration, complete task/dispatch/claim/evidence history, preferably an actual baseline pass and failing observation linked to an introducing owner). Keep the existing exact-preservation and unrelated-admission assertions; assert the returned runFailures owner/history state if needed to establish the intended diagnostic compatibility. Do not weaken readRecovery validation or turn the malformed record into an admission hold. Malformed history belongs in gaps under the sibling contract.

### inv-mvc60k41-xt8p35rk04d/task-11-review

- Original section `None`, lines 13–14; historical-finding-or-minor; no disposition applied by intake.

> skills/super-code/coordinator.js:1511 — Resumed records whose tracker beads are partly open enter closeAlreadyMerged, which calls confirmClosure. That function calls clearPendingClosure at line 1246; noteRecovery/readRecovery remove the pending-closure obligation immediately, before the buffered ledger:<id> append is confirmed. closeAlreadyMerged then settles completed at line 1270. If ledger:<id> and its retry return null (or report appended:false), drainLedger merely drains the chain and the run returns completed with the recovery obligation absent. The new confirmation-aware Resume fast path at lines 724–731 only protects records observed fully closed at the first observation. This violates the brief's requirement to drain confirmed closure/updated obligation records before treating recovery as settled, and the report's claim that in-memory obligations change only after confirmed append. Route partial-close completion through the same confirmed durable transaction, retaining the original record and a scoped recovery-held result on failed append. Add a targeted fixture with an initially open associated bead, successful close/check, and failed ledger:<id> append/retry; assert recovery remains unresolved and a subsequent restart observes facts rather than blindly repeating closure.
> Minor: none.

### inv-mvc60k41-xt8p35rk04d/task-12-seam-findings

- Original section `Important`, lines 4–4; historical-finding-or-minor; no disposition applied by intake.

> [rebase-conflict] No-change source9610071921c440aa1debff4b873525b42cf3f217 at basecaf187cef8d1769da6184de42332a31bc7e30dcb conflicts rebasing onto integration43f18740e270d4d5a2730d4194e47f4eac04be39 in skills/super-code/coordinator.js and tests/super-code/replay-harness.mjs. Rebase aborted cleanly; task/integration clean. Resolve in own task worktree preserving independently reviewed verification-only evidence/typed digest closure, landed regression owner/contradiction history, and landed durable recovery/confirmed append ordering. Run meaningful combined checks; no broader changes or merge.

### inv-mvc60k41-xt8p35rk04d/task-14-review

- Original section `Important`, lines 26–26; historical-finding-or-minor; no disposition applied by intake.

> skills/super-auto/scripts/report-status:107 — Discover and archive the actual direct-review package `final-review-ID.md.diff`. The collector discovers only `prefix+'.diff'`, while the real Workflow producer at skills/super-code/coordinator.js:2757 invokes review-package with `${reviewPath}.diff` and reviewPath is `final-review-ID.md`. A settled direct review can therefore return collection complete without preserving its input diff, allowing cleanup to destroy that source. The same incorrect suffix in hasBundle (:93) can classify a null/no-work return with a leftover actual direct package as artifact-free. Update discovery and null bundle detection to match the producer, and use producer-shaped .md.diff fixtures (tests/super-auto/test-scripts.sh:352 currently invents the shorter .diff filename). Retain byte-for-byte/idempotent archive assertions for that real filename.

- Original section `Minor`, lines 30–30; historical-finding-or-minor; no disposition applied by intake.

> [pending-behavior-eval] Coordinator-owned fresh-agent post behavior evaluation for super-plan-ufz.8 remains pending; see the implementer report's evaluation section.

### inv-mvc60k41-xt8p35rk04d/task-15-review

- Original section `Important`, lines 21–21; historical-finding-or-minor; no disposition applied by intake.

> `skills/super-code/coordinator.js:195-198` — Merge retry results per independent source instead of selecting/spreading whole dispatch objects. For example, the first Finish dispatch can return unavailable ledger transport but a successful `landed` list and complete `reviewBase`/`reviewHead`. If the retry returns valid ledger transport but `landedError` and `reviewError`, line 195 returns only the retry: the successful landing evidence and captured revision pair disappear. Final review then becomes unavailable despite the previously captured immutable source, and metrics loses supported Git evidence. If both ledger transports are unavailable, line 198 can instead retain first.landed alongside retry.landedError; the metrics caller rejects that successful list because of the error. This contradicts the explicit partial-results/independent-source retention contract. Retain each successful Git observation and each coherent complete review pair independently of ledger status, keep failed attempts as qualified gaps, and avoid combining half revision pairs. Add targeted replay cases with success/failure alternating independently across the three sources.

### inv-mvc60k41-xt8p35rk04d/task-15-seam-findings

- Original section `Important`, lines 4–4; historical-finding-or-minor; no disposition applied by intake.

> [rebase-conflict] Metrics source548a0b08d7b02a7fdfcb67f4e6899013b6276b9d conflicts in skills/super-code/coordinator.js rebasing onto integration6c332aa22824c185dc474b0fb5055b465cbd1412. Prior rebase aborted clean. Original STACKED base7074121343636addd41f80ef5261de6ffb74ab80 must be --onto boundary: replay only metrics own commits, never parent projection. Preserve latest verified review fix (independent supported source observations/coherent capture pairs), landed no-change completion and durable recovery, and collection/reporting consumer. Run meaningful combined checks, no broad changes or merge.

### inv-mvc60k41-xt8p35rk04d/task-16-seam-findings

- Original section `Important`, lines 4–4; historical-finding-or-minor; no disposition applied by intake.

> [rebase-conflict] Root-acceptance source232d3ca4adefafd4d757e8930fc10260159bafae conflicts in skills/super-auto/SKILL.md applying1a1360fb onto integration549545dd696f02f4db7e5187f5fca7292f2c15a8. Rebase aborted clean. Original STACKED basebee2526cd249be60632281f092ab48e1667b8747 must be --onto boundary; replay only own root-acceptance commits, never old collector parent. Preserve current metrics/collection source-truth guidance and all independently reviewed caller-owned acceptance behavior. Blocker super-plan-8fn was mechanically filed for this conflict; retain until verified merge, no duplicate. No real epic acceptance. Run relevant combined checks and report actual rebased base/head; no merge.

### inv-c96916a964634bb0bb5f2bd3b8e1769b/task-19-review

- Original section `Findings`, lines 17–17; historical-finding-or-minor; no disposition applied by intake.

> Important / Missing — tests/super-code/replay-harness.mjs:594. The legacy fixture at 594–610 remains unchanged and deletes its foreign temporary ledger after producing only capped transport. Line 610 expects ready independent-review reentry despite the unresolved Recovery pointer. This is exactly the recorded test defect. The required recovered pending-closure reuse, valid missing-basis reentry, unrecoverable-pointer ready admission hold and foreign-source supplied-payload rejection are not added by the pinned diff. Their absence leaves amended acceptance unimplemented and the required replay suite failing.

- Original JSON field `/finding` in block lines 75–185; separate rendition, no automatic link.

> tests/super-code/replay-harness.mjs:594: Important / Missing — Implement the recorded bounded fixture amendment. The pinned range leaves lines 594–610 unchanged: a deleted foreign-ledger pointer still expects implementation/review reentry, and the required recovered-basis, genuinely missing-basis, unrecoverable-pointer and supplied-foreign-payload ownership cases are absent. Preserve the real cap assertion; add the three semantically separate replays and foreign-source rejection using the current bead requirements, then rerun all three named commands on the resulting source and retain complete source-bound outcomes. The current replay result is 2294 passed / 1 failed and cannot satisfy acceptance.

### inv-mvc60k41-xt8p35rk04d/task-2-review

- Original section `Issues`, lines 19–19; historical-finding-or-minor; no disposition applied by intake.

> Minor: tests/super-code/replay-harness.mjs:3771 — the report records three real sleeper fixtures leaked by an intermediate failed run. Canonical teardown subsequently stopped them and final checks were empty, so this is not a surviving daemon finding. The real-process fixtures should have failure-path teardown independent of the cleanup helper being tested.

### inv-c96916a964634bb0bb5f2bd3b8e1769b/task-20-review

- Original section `Important`, lines 23–25; historical-finding-or-minor; no disposition applied by intake.

> skills/super-code/coordinator.js:745 (caller: skills/super-code/scripts/dispatch-text.mjs:101-111,133-135): New required Resume identity aborts ordinary non-review builder rendering. loadBuilders executes startup with a null-returning agent, while its caller forwards the persisted ID only for reviewOutput. Thus implement, task review, verification-close, fix, seam/check-fix review, merge, plan, triage, check-evidence and non-final assembly throw before producing output, including current ledgers with valid IDs. Preserve strict live startup and separate internal builder initialization from operational Resume/Launch; forward genuine selected-Launch IDs consistently and retain identity-free legacy non-review rendering without minting or fabricating tokens. Keep persisted-ID review gates strict. Verify the actual ordinary dispatch suite plus both startup/replay checks on the integrated fix.
> 
> The report itself acknowledges the confirmed caller failure. Parent direction to leave dispatch-text untouched bounds the implementation scope; it does not waive the global preservation requirement or make the captured tree safe to integrate. The separate `startup-builder-seam-assessment-r1.md` recommends a follow-on seam repair but supplies neither delivered code nor passing verification. A genuine ID handoff repairs current-ID ledgers only; legacy identity-free non-review builder loading also needs separation from operational startup. Do not weaken live Resume validation, add synthetic identities, or treat a CLI override as persisted identity.

- Original section `Minor / deferred coverage`, lines 29–29; historical-finding-or-minor; no disposition applied by intake.

> [missing-evidence] skills/super-code/coordinator-workflow.md:72 and skills/super-code/coordinator-subagents.md:155: Fresh-agent changed-instruction evaluation remains explicitly caller-owned and pending; mechanical fixture/replay evidence does not establish agent compliance. This is a deferred coverage warning, not an additional task-local blocker.

- Original JSON field `/finding` in block lines 68–151; separate rendition, no automatic link.

> skills/super-code/coordinator.js:745 (caller: skills/super-code/scripts/dispatch-text.mjs:101-111,133-135): New required Resume identity aborts ordinary non-review builder rendering. loadBuilders executes startup with a null-returning agent, while its caller forwards the persisted ID only for reviewOutput. Thus implement, task review, verification-close, fix, seam/check-fix review, merge, plan, triage, check-evidence and non-final assembly throw before producing output, including current ledgers with valid IDs. Preserve strict live startup and separate internal builder initialization from operational Resume/Launch; forward genuine selected-Launch IDs consistently and retain identity-free legacy non-review rendering without minting or fabricating tokens. Keep persisted-ID review gates strict. Verify the actual ordinary dispatch suite plus both startup/replay checks on the integrated fix.

- Original JSON field `/minors/0` in block lines 68–151; separate rendition, no automatic link.

> [missing-evidence] skills/super-code/coordinator-workflow.md:72 and skills/super-code/coordinator-subagents.md:155: Fresh-agent changed-instruction evaluation remains explicitly caller-owned and pending; mechanical fixture/replay evidence does not establish agent compliance. This is a deferred coverage warning, not an additional task-local blocker.

### inv-c96916a964634bb0bb5f2bd3b8e1769b/task-29-review

- Original section `Minor / deferred observation`, lines 41–41; historical-finding-or-minor; no disposition applied by intake.

> [deferred-evaluation] `evidence/super-plan-ufz.32/instruction-evaluation.md:34`: The required fresh-agent changed-instruction evaluation is pending with the super-plan-ufz coordinator, as the brief explicitly permits. Retain that pending obligation before root acceptance; do not infer behavior from instruction string checks or helper results.

- Original JSON field `/minors/0` in block lines 82–261; separate rendition, no automatic link.

> [deferred-evaluation] evidence/super-plan-ufz.32/instruction-evaluation.md:34 — Fresh-agent before/after changed-instruction evaluation remains explicitly assigned to the super-plan-ufz coordinator before root acceptance; deterministic contract replay and this source review do not satisfy it.

### inv-mvc60k41-xt8p35rk04d/task-4-seam-findings

- Original section `Important`, lines 4–4; historical-finding-or-minor; no disposition applied by intake.

> [rebase-conflict] Recovery task 18a0b359df063617af5c643bb73f2737c8aacbdd conflicts in skills/super-code/coordinator.js while rebasing onto integration 522c20bc. Prior merge agent aborted rebase; own task worktree is clean. Rebase and resolve preserving landed stable review inputs and truthful cleanup, plus reviewed durable recovery contract. Do not broaden into resume/acceptance/metrics routing. Run focused meaningful checks for the resolution and report exact source revisions.

### inv-mvc60k41-xt8p35rk04d/task-5-review

- Original section `Issues`, lines 18–18; historical-finding-or-minor; no disposition applied by intake.

> Minor: [test-process-cleanup] tests/super-code/replay-harness.mjs:4019 — The implementer reports an initial sandbox-aborted replay left its detached `sleep 300` fixture alive until the authorized cleanup helper stopped it. This is a test-suite hygiene defect under the review rubric, though no process survived final cleanup. Ensure this fixture cleans up in a finally block even when process inspection fails, and handle missing ps stdout explicitly.

### inv-mvc60k41-xt8p35rk04d/task-6-review

- Original section `Issues`, lines 27–27; historical-finding-or-minor; no disposition applied by intake.

> [deferred-live-evaluation] `skills/super-auto/report-prompt.md:60`: the changed instructions consume planning/unknown-readiness qualifications, but fresh-agent interpretation remains an explicitly deferred coordinator obligation under super-plan-ufz. Keep it open in integration evidence; this task review does not certify instruction behavior.

### inv-mvc60k41-xt8p35rk04d/roast-code-round-1

- Original section `Confirmed findings            ← consumed by super-design, one task per finding`, lines 11–14; historical-finding-or-minor; no disposition applied by intake.

> [Should-fix] skills/super-code/coordinator.js:752 — Oversized persisted recovery holds lose their task scope during digest compaction, allowing the held task to run and merge. [lanes: data-migrations]
>   verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
>   evidence: Independent frozen-source probes show a valid 173-byte hold blocks bd-101, while the same hold with additive context at 5173 bytes yields one implementation dispatch and merge, clears the obligation, and reports ready-drained. The digest keeps only a gap pointer, which admission does not consult. Probe and receipt: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-0-reproduce/tests/super-code/probe.mjs and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-0-reproduce/receipt.json.
>   fix-shape hint: Preserve or recover the held task scope before admitting work when compact transport drops the record.

- Original section `Confirmed findings            ← consumed by super-design, one task per finding`, lines 15–18; historical-finding-or-minor; no disposition applied by intake.

> [Blocking] skills/super-code/coordinator.js:25 — Omitting the supported invocationId makes Workflow startup call forbidden Date.now() and Math.random() APIs and abort before logging or dispatch. [lanes: concurrency-async]
>   verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
>   evidence: The documented contract says the script mints an ID when omitted; official Claude Code Workflow documentation says these clock/random APIs throw inside a script. Frozen-source VM checks show base starts without an ID and head throws before its first log; an explicit ID is a positive control. The documented dryRun examples do include invocationId, correcting the original evidence's contrary claim; the omission path remains explicitly supported. Evidence: https://code.claude.com/docs/en/workflows; docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-1-ground/repro.mjs and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-1-ground/repro-runtime-result.json.
>   fix-shape hint: Mint the identifier outside the deterministic Workflow script and pass it through args.

- Original section `Confirmed findings            ← consumed by super-design, one task per finding`, lines 19–22; historical-finding-or-minor; no disposition applied by intake.

> [Should-fix] skills/super-auto/scripts/report-status:168 — The root acceptance gate trusts persisted collection-complete metadata and accepts corrupted archived review inputs without checking their saved hashes. [lanes: correctness]
>   verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
>   evidence: After collection completed, changing only a saved review diff changed its SHA-256, yet --acceptance still returned eligible:true with no gaps; recollection then detected an archive conflict. Reproducer and receipt: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-2-reproduce/probe.py and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-2-reproduce/receipts.json.
>   fix-shape hint: Have the acceptance gate verify archived files against their collection records before declaring the run eligible.

- Original section `Confirmed findings            ← consumed by super-design, one task per finding`, lines 23–26; historical-finding-or-minor; no disposition applied by intake.

> [Should-fix] skills/super-auto/scripts/scope-dispositions:194 — Large finding projections are truncated on piped stdout while exiting successfully, so status and root acceptance cannot consume valid retained findings. [lanes: correctness, api-contract, observability]
>   verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
>   evidence: A fixture with 128 retained occurrences produced 203379 bytes on regular stdout but only 65536 bytes through a pipe, with exit 0 and invalid JSON. The actual acceptance consumer then reported projection unavailable; changing only the exit behavior restored full output and eligibility. Probe, acceptance probe, and receipts: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/probe.py, docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/acceptance-probe.py, docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/receipt.json, and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-4-reproduce/acceptance-receipt.json.
>   fix-shape hint: Deliver the complete projection to the consumer or detect and report incomplete output as a failure.

- Original section `Confirmed findings            ← consumed by super-design, one task per finding`, lines 27–30; historical-finding-or-minor; no disposition applied by intake.

> [Should-fix] skills/super-auto/scripts/report-status:224 — Committed assembled review archives are re-collected into later full-range reviews, recursively growing their inputs until slice creation fails with errno 63. [lanes: premortem, hot-path-perf]
>   verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
>   evidence: Frozen-head repeated review fixtures show unchanged product content copied 1, 2, then 4 times as collected files grow; the fourth assembly fails creating a 281-byte basename with errno 63. Probe and receipt: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-5-reproduce/probe.py and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-5-reproduce/receipt.json.
>   fix-shape hint: Exclude prior generated review archives from later full-range assembly or reuse their stable slices.

- Original section `Confirmed findings            ← consumed by super-design, one task per finding`, lines 31–34; historical-finding-or-minor; no disposition applied by intake.

> [Should-fix] skills/super-auto/scripts/report-status:220 — Review collection follows intermediate directory symlinks and archives files outside the declared source workspace while reporting collection complete. [lanes: security]
>   verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
>   evidence: A fixture with workspace/assembled linked to ../outside returned collection complete and archived a sentinel file from outside the workspace. Result: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-7-reproduce/result.json.
>   fix-shape hint: Reject symlinked path components while resolving and copying collected review inputs.

- Original section `Confirmed findings            ← consumed by super-design, one task per finding`, lines 35–38; historical-finding-or-minor; no disposition applied by intake.

> [Should-fix] tests/super-code/test-dispatch-text.sh:10 — The required dispatch-text test suite fails four assertions when TMPDIR ends with a slash. [lanes: testing]
>   verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
>   evidence: With the same trailing-slash TMPDIR, the frozen base test exits 0 while head exits 1 with four path assertions; removing the slash makes head pass. The failures compare an unnormalized temporary path with normalized output paths. Evidence: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/head-trailing.log, docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/base-trailing.log, and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-8-reproduce/head-no-trailing.log.
>   fix-shape hint: Normalize TMPDIR before composing expected artifact paths or construct the test directory with mktemp.

- Original section `Rejected (with reason)        ← so re-roasts don't re-litigate`, lines 50–50; historically-rejected.

> The claim that the new measurement aggregation rule is duplicated with conflicting semantics, so super-code reports a required live check as passed while super-auto reports the same retained check evidence as failed (skills/super-code/coordinator.js:354), is rejected. The concrete dissent reproduced pass versus fail for the same evidence, but the majority cited the contract at coordinator-workflow.md:645-657: coordinator pass means matching live/pass evidence is available, while semantic coverage and acceptance remain caller decisions. The acceptance gate separately requires reconciliation of contradictory records. Receipts: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-3-reproduce/producer.json and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-3-reproduce/consumer.json.

- Original section `Rejected (with reason)        ← so re-roasts don't re-litigate`, lines 51–51; historically-rejected.

> The claim that the new tracked archive of complete assembled inputs makes this branch's required next roast assembly fail with ENAMETOOLONG (skills/super-auto/SKILL.md:400) is rejected on materiality. The concrete dissent verified errno 63 for oversized flattened basenames, establishing the assembly failure. Majority evidence shows the documented fallback runs the roast directly against the same captured base/head and records assembler unavailable, preserving the required review and revision binding. Receipts: docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-6-reproduce/receipt.json and docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-6-refute/fixture.json.

## Remaining interpretation limits

Narrative source classification is explicit in each source record. A missing standardized heading or parser failure never yields a None inference. Some source prose pairs an explicit no-task-local-finding assertion with pending parent obligations; the complete qualified text is retained in scope/concern passages. All exact original sections, units, byte offsets and line positions remain in the sidecars.

Task 19 handoff variants have different raw hashes than canonical intake copies. They remain in `variants/` with the same original task/invocation name reference and a raw-byte qualifier. Assigning them over a canonical source ID would discard history; this projection does not do that.

See `coverage.json` for every source disposition and `occurrence-projection.json` for full machine-readable text and qualifiers.
