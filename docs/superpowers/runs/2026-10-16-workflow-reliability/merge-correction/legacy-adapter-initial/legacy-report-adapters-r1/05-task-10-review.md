Status: NEEDS_FIX

# Legacy interpretation adapter

Adapter-only synthetic labels and item boundaries. Exact raw source, original headings, complete passages, line/byte locators and interpretation limits are recorded in the hash-bound metadata. This document proposes history representation and makes no acceptance, identity-link or resolution decision.

## Concerns — adapter/pending-obligation/raw-section-1/raw-byte-000000742

- Current bd show/acceptance and bd comments were read; there are no amendments or triage comments. The coordinator owns the pending fresh-agent evaluation; its absence from implementer evidence is not a task-local failure.

## Findings — adapter/review-finding/raw-section-2/raw-byte-000000993

- Important — skills/super-code/coordinator.js:432: The verification guard compares verified.sourceTree only against the current event's observed record. A normal verification-only reply omits observed, so !observed makes the guard true even if that exact source tree and command/configuration already has a retained live/fail observation. Concrete history: the existing fixture establishes baseline a/pass, A source b/fail and owner bd-A; append a reply with evidence [b/live/pass] and an association containing verification:0 but no observed/runBaseline. The reducer retains the original b/fail comparison, sets state=verified, and records no contradiction gap. This is the same immutable tested source as the recorded failure, not evidence of a repaired source; the contradictory outcomes need reconciliation. Callers explicitly retire the qualifier on this verified state, so the open repair can disappear. Compare the verification source/outcome against retained linked observations (and other associated outcomes), preserve ownership/open state with a contradiction gap when they conflict, and add a deterministic fixture for verification-only contradiction after durable re-entry. If repeat measurements are intentionally reconciled, require explicit supported reconciliation rather than silently accepting the later pass. The within-one-event baseline/observed same-tree guard does not cover this durable-history path.
