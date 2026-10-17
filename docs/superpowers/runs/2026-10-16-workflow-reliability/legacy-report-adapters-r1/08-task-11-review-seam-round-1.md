Status: NEEDS_FIX

# Legacy interpretation adapter

Adapter-only synthetic labels and item boundaries. Exact raw source, original headings, complete passages, line/byte locators and interpretation limits are recorded in the hash-bound metadata. This document proposes history representation and makes no acceptance, identity-link or resolution decision.

## Findings — adapter/review-finding/raw-section-0/raw-byte-000000135

- finding: The new diagnostic-deferral fixture in tests/super-code/replay-harness.mjs:1722 uses the old unconstrained data.runFailure shape. Sibling 97ee30a1 added readRecovery's validRunFailure check: nonempty configuration is required, and every history event needs dispatch, an identity-matching claim and an evidence array. This fixture lacks all of those. It is therefore retained as an invalid-run-failure gap, never inserted into recovery.obligations; the exact-obligation assertion at line 1732 necessarily fails for both hold/deferred variants. This also leaves the claimed compatibility coverage without a valid diagnostic history. Smallest reconciliation: replace only that diagnostic fixture with a schema-valid unscoped deferred runFailure (matching failure/command/configuration, complete task/dispatch/claim/evidence history, preferably an actual baseline pass and failing observation linked to an introducing owner). Keep the existing exact-preservation and unrelated-admission assertions; assert the returned runFailures owner/history state if needed to establish the intended diagnostic compatibility. Do not weaken readRecovery validation or turn the malformed record into an admission hold. Malformed history belongs in gaps under the sibling contract.
