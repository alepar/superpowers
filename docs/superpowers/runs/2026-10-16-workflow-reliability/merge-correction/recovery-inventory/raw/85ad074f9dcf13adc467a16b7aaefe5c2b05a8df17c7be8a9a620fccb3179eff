Status: NEEDS_FIX
Task: super-plan-ufz.7
Base: 15084177065dbaaa4eff1992cfb2fbfb56cee5f8
Head: e1591cca16ce4a4d7f96f865e0ba3fb6e03ea5c6

## Spec compliance

❌ Contradictory source-bound evidence can close a retained run repair obligation without being exposed as a gap (coordinator.js:432).

✅ The A/B comparison keeps task exoneration separate from introducing ownership. Pre-run failures and absent baseline evidence are distinct. Exact command/configuration identity, durable history, ordinary-subagent instructions and caller parked records are present. No new root acceptance gate, mandatory baseline phase or compulsory pre-run repair was introduced. Existing run-state fields suffice, so additive contract goldens need no changes.

Current bd show/acceptance and bd comments were read; there are no amendments or triage comments. The coordinator owns the pending fresh-agent evaluation; its absence from implementer evidence is not a task-local failure.

## Issues

Critical: none.

Important — skills/super-code/coordinator.js:432: The verification guard compares verified.sourceTree only against the current event's observed record. A normal verification-only reply omits observed, so !observed makes the guard true even if that exact source tree and command/configuration already has a retained live/fail observation. Concrete history: the existing fixture establishes baseline a/pass, A source b/fail and owner bd-A; append a reply with evidence [b/live/pass] and an association containing verification:0 but no observed/runBaseline. The reducer retains the original b/fail comparison, sets state=verified, and records no contradiction gap. This is the same immutable tested source as the recorded failure, not evidence of a repaired source; the contradictory outcomes need reconciliation. Callers explicitly retire the qualifier on this verified state, so the open repair can disappear. Compare the verification source/outcome against retained linked observations (and other associated outcomes), preserve ownership/open state with a contradiction gap when they conflict, and add a deterministic fixture for verification-only contradiction after durable re-entry. If repeat measurements are intentionally reconciled, require explicit supported reconciliation rather than silently accepting the later pass. The within-one-event baseline/observed same-tree guard does not cover this durable-history path.

Minor: none.

## Test evidence

The implementer reports final runs on the immutable head: node tests/super-code/replay-harness.mjs (1972 passed, 0 failed); bash tests/super-code/test-dispatch-text.sh (all passed); bash tests/super-auto/test-scripts.sh (all passed); bash tests/super-auto/test-contract-lint.sh (all passed). Commands, exact isolated execution prefix, worktree, output summaries and simulated-mechanics limitation are provided. This plausibly covers the task changes but omits the contradictory verification-only case above. RED evidence is also provided. No tests were run by this reviewer, as required.

Test changes commands: git diff --stat 15084177065dbaaa4eff1992cfb2fbfb56cee5f8..e1591cca16ce4a4d7f96f865e0ba3fb6e03ea5c6 -- [all supplied TEST_PATHSPECS], and git diff with the same immutable range and all supplied TEST_PATHSPECS. Both succeeded. Only additions: tests/super-code/replay-harness.mjs (56 lines), tests/super-auto/test-scripts.sh (16 lines). No deleted, skipped, loosened or rewritten existing expectations.

## Focused reachability/risk checks

Risk: a reducer that is unreachable from real review handling would not implement ownership. Traced reviewAndFix -> validReview -> dispatch(schema RESULT) -> recordCheckEvidence/recordFailureAttribution -> noteRecovery, and final return -> runFailures. Searched sibling RESULT dispatches: the centralized dispatch hook applies to them as well. Read only this focused caller and the changed classifier to check the source-conflict risk. The classifier at lines 410-435 confirms that verification-only events bypass the sole same-source guard; durable prior evidence is available in data.history but is not consulted by that guard.

## Strengths

The additive Recovery envelope preserves introducing events across clean retries; the test/report claims clearly distinguish simulated mechanics from parent-owned agent behavior.
