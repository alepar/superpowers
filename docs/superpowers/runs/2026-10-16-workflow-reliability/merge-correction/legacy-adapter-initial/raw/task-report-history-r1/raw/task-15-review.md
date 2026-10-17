# Task review: super-plan-ufz.9

Status: NEEDS_FIX
Base: 7074121343636addd41f80ef5261de6ffb74ab80
Head: c3bfd1f9e3109f136b091f843d270455b367cad9

## Spec compliance

❌ Preserve independently successful source observations across a ledger retry. `readLedger` can discard the first attempt’s successful Git landing lookup and coherent captured review revision pair when only the ledger transport needs retrying (coordinator.js:195-198).

✅ Explicit missing/unreadable/valid-empty/malformed/truncated transport; known-appends validation; qualified partial metrics; Finish reconciliation before counting; unique landing IDs and actual discrepancy IDs; latest completion versus durable history; supported disposition metrics; occurrence/group distinction; projection exit 3; report and run-digest propagation. Base absorption and execution selection do not inflate the stated units. Current bead and comments were read: no amendments/comments changed the supplied requirements. Coordinator-owned fresh-agent interpretation remains pending and is explicitly outside this deterministic task’s verification; committed examples are provided.

## Issues

### Critical

None.

### Important

- `skills/super-code/coordinator.js:195-198` — Merge retry results per independent source instead of selecting/spreading whole dispatch objects. For example, the first Finish dispatch can return unavailable ledger transport but a successful `landed` list and complete `reviewBase`/`reviewHead`. If the retry returns valid ledger transport but `landedError` and `reviewError`, line 195 returns only the retry: the successful landing evidence and captured revision pair disappear. Final review then becomes unavailable despite the previously captured immutable source, and metrics loses supported Git evidence. If both ledger transports are unavailable, line 198 can instead retain first.landed alongside retry.landedError; the metrics caller rejects that successful list because of the error. This contradicts the explicit partial-results/independent-source retention contract. Retain each successful Git observation and each coherent complete review pair independently of ledger status, keep failed attempts as qualified gaps, and avoid combining half revision pairs. Add targeted replay cases with success/failure alternating independently across the three sources.

### Minor

None.

## Test evidence

The implementer reports final commands from the owned worktree with isolated HOME/XDG/TMPDIR:

- `node tests/super-code/replay-harness.mjs`: 2152 passed, 0 failed, exit 0.
- `bash tests/super-auto/test-scripts.sh`: all script tests passed, exit 0; supported metrics, raw/actionable distinction, linked identities and exit-3 cases shown.
- `bash tests/super-auto/test-contract-lint.sh`: all contract lint tests passed, exit 0, including legacy/additive mutation checks.
- `bash tests/super-code/test-run-digest.sh`: all tests passed, exit 0, including source-status and truncated-transport cases.
- Optional invocation lint and `git diff --check` also report exit 0. Hygiene reports no leaked processes.

This evidence plausibly covers the changed deterministic producers and consumers. No tests were run during this review. The new replay cases exercise simultaneous repeated source outcomes, not the alternating independent-source outcomes identified above.

Test changes inspected using both `git diff --stat BASE..HEAD -- TEST_PATHSPECS` and `git diff BASE..HEAD -- TEST_PATHSPECS`, where BASE/HEAD are the immutable revisions above and TEST_PATHSPECS are the full supplied tests/test/spec globs. Commands exited 0: three files, 107 insertions and 15 deletions. Existing expectations change for the requested transport markers, labelled fix-event metrics, exact identity discrepancy output and additive qualification. No unjustified deleted/skipped tests found.

## Reachability and focused checks

- Traced Finish through `readLedger`, `metricsEvidence` and `finalSource` into final review dispatch: independently captured revisions remain consumed when ledger transport fails on both reads, but retry selection has the Important gap above.
- Checked Resume’s `readRecovery` and Finish’s use of the same validator for the concrete risk of unsupported or oversized records silently dropping history/gaps. The shared validation and gap paths are present.
- Checked `report-verdict --complete` section names against projection actionable groups for the concrete risk of counting raw Rejected/Not verified sections as actionable. Those raw occurrences remain separate while the full projection retains their evidence.
- Searched sibling `ledger-digest` callers: the runtime `run-digest` consumer now validates transport and preserves independent tracker/profile observations; ordinary coordinator instructions use the same contract. Projection exit 3 remains unchanged.

## Strengths

The change clearly separates observed counts, units, source populations and unknown totals. Concrete discrepant IDs replace unsupported causal guesses, and historical fixes survive later clean outcomes. Historical contract fixtures need no edits because no run.md field/format was introduced.
