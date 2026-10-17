Status: NEEDS_FIX

# Legacy interpretation adapter

Adapter-only synthetic labels and item boundaries. Exact raw source, original headings, complete passages, line/byte locators and interpretation limits are recorded in the hash-bound metadata. This document proposes history representation and makes no acceptance, identity-link or resolution decision.

## Findings — adapter/review-finding/raw-section-3/raw-byte-000001511

- Important / Missing — tests/super-code/replay-harness.mjs:594. The legacy fixture at 594–610 remains unchanged and deletes its foreign temporary ledger after producing only capped transport. Line 610 expects ready independent-review reentry despite the unresolved Recovery pointer. This is exactly the recorded test defect. The required recovered pending-closure reuse, valid missing-basis reentry, unrecoverable-pointer ready admission hold and foreign-source supplied-payload rejection are not added by the pinned diff. Their absence leaves amended acceptance unimplemented and the required replay suite failing.

Required bounded fix:

  - Preserve line 603's real helper assertion: actual source-line pointer, typed verification-only Task discriminator, and no evidence/live.log in compact transport.
  - Add a recovered pending-closure case using a configured integrationWorktree's actual ledger. Generate compact and complete counted `--recovery-line 1` output while that ledger exists; provide the exact pointer source/line through the existing read-ledger recoveryRecords. Preserve the entire original oversized pending-closure record, evidence and additive fields. Assert the existing reader prompt targets that ledger/line and adds no read-recovery dispatch. Supply exact retained source/tracker observations (`sourceVerified: true`, `landed: false`, `closed: []`, `open: ['bd-101']` only if that is the exact required bead set). Assert resume-check precedes closure, impl/review/merge are zero, close-only is one, completed requires confirmed closure, evidence/source identity survives, and the resolved transport gap disappears. Retain negative pending-closure source/tracker cases.
  - Separately use a valid counted ledger containing only `Task 1 (bd-101): complete, verification-only` for fresh missing-basis reentry, with no unresolved pointer or surviving basis. Preserve original live evidence and requiredLiveChecks in fresh impl/review responses. Assert impl/review are one, merge zero, confirmed close-only closure, completion only afterward, and durable new reviewed basis before closure. Retain the not-ready missing-basis gap assertion without inferred completion.
  - Add ready replay of the original deleted foreign-source capped text with no recoveryRecords. Assert impl/review/merge/close-only are zero, completed excludes bd-101, stopReason is recovery-held, and recovery.gaps retains exact unresolved source/line. Do not infer unrelated scope. Add supplied-foreign-source recoveryRecords coverage proving ownership cannot be bypassed, while retaining the current-ledger missing/truncated/empty/malformed cases.
  - Run exactly the three required commands on the fixed task source, record revision/diff and complete results, and require all assertions to pass. Do not alter unrelated replay assertions, snapshot baselines, digest tests, schema, specs or historical evidence, or add a recovery-reader dispatch.

## Findings — adapter/structured-finding-appearance/raw-section-7/raw-byte-000011561/json-pointer-/finding

- tests/super-code/replay-harness.mjs:594: Important / Missing — Implement the recorded bounded fixture amendment. The pinned range leaves lines 594–610 unchanged: a deleted foreign-ledger pointer still expects implementation/review reentry, and the required recovered-basis, genuinely missing-basis, unrecoverable-pointer and supplied-foreign-payload ownership cases are absent. Preserve the real cap assertion; add the three semantically separate replays and foreign-source rejection using the current bead requirements, then rerun all three named commands on the resulting source and retain complete source-bound outcomes. The current replay result is 2294 passed / 1 failed and cannot satisfy acceptance.
