Status: NEEDS_CONTEXT

# Legacy interpretation adapter

Adapter-only synthetic labels and item boundaries. Exact raw source, original headings, complete passages, line/byte locators and interpretation limits are recorded in the hash-bound metadata. This document proposes history representation and makes no acceptance, identity-link or resolution decision.

## Concerns — adapter/scope-or-coverage-qualification/raw-section-4/raw-byte-000000820

- **Test evidence:** The report supplies the full isolated-environment command ending in `bash tests/super-code/test-report-verdict.sh`, run from the task worktree after rebasing onto this base, exit 0. It includes relevant pass output for final-review/roast/task extraction, duplicate positions, continuations, Unicode, archive identity, caps, explicit-empty reviews and malformed inputs, ending `report-verdict: all tests passed`. This plausibly covers the changes. The report also records RED evidence, unchanged legacy assertions, a 26-case stdout/stderr/status compatibility probe against the preimplementation helper, and no leaked processes. No tests were rerun during review.
