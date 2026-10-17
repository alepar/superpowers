Status: NEEDS_FIX

# Legacy interpretation adapter

Adapter-only synthetic labels and item boundaries. Exact raw source, original headings, complete passages, line/byte locators and interpretation limits are recorded in the hash-bound metadata. This document proposes history representation and makes no acceptance, identity-link or resolution decision.

## Concerns — adapter/pending-obligation/raw-section-2/raw-byte-000000440

- ✅ Explicit missing/unreadable/valid-empty/malformed/truncated transport; known-appends validation; qualified partial metrics; Finish reconciliation before counting; unique landing IDs and actual discrepancy IDs; latest completion versus durable history; supported disposition metrics; occurrence/group distinction; projection exit 3; report and run-digest propagation. Base absorption and execution selection do not inflate the stated units. Current bead and comments were read: no amendments/comments changed the supplied requirements. Coordinator-owned fresh-agent interpretation remains pending and is explicitly outside this deterministic task’s verification; committed examples are provided.

## Findings — adapter/review-finding/raw-section-5/raw-byte-000001189

- `skills/super-code/coordinator.js:195-198` — Merge retry results per independent source instead of selecting/spreading whole dispatch objects. For example, the first Finish dispatch can return unavailable ledger transport but a successful `landed` list and complete `reviewBase`/`reviewHead`. If the retry returns valid ledger transport but `landedError` and `reviewError`, line 195 returns only the retry: the successful landing evidence and captured revision pair disappear. Final review then becomes unavailable despite the previously captured immutable source, and metrics loses supported Git evidence. If both ledger transports are unavailable, line 198 can instead retain first.landed alongside retry.landedError; the metrics caller rejects that successful list because of the error. This contradicts the explicit partial-results/independent-source retention contract. Retain each successful Git observation and each coherent complete review pair independently of ledger status, keep failed attempts as qualified gaps, and avoid combining half revision pairs. Add targeted replay cases with success/failure alternating independently across the three sources.
