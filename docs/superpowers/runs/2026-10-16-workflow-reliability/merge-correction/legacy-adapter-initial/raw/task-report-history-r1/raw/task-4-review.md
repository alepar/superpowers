Status: CLEAN

# Task 4 review — CLEAN

Task: super-plan-ufz.4; review tracking: super-plan-ufz.17.
Immutable range: f1fb23d15eaaa70fff95404a97342cd83fb0bdb7..18a0b359df063617af5c643bb73f2737c8aacbdd.
The supplied base is an ancestor of the reviewed head. Current bead description and acceptance were read with `bd show super-plan-ufz.4 --json`; `bd comments super-plan-ufz.4` returned no comments. No amendments apply.

## Spec compliance

✅ Durable hold, pending-closure, deferred and fix records use the requested additive fields and evidence references. Clear affects only the matching obligation; fix history stays separate from terminal Task status. Existing Task/Merge/Human action reducers remain compatible. Both coordinator references describe the shared ordinary-subagent contract and contain the concrete pending-closure and FIXED examples.

✅ Malformed/unknown compact records produce explicit gaps with source, digestLine, reason and a preview capped at 200 characters. The digest replaces records above 4096 characters with an original ledger path/line pointer, preserving full evidence on disk. Added fixtures cover malformed, unknown-version and valid structured oversized records without echoing their bodies. Report/finding prose is not added to Recovery payloads.

✅ Scope remains durable transport and producers; later recovery reconciliation, acceptance and metrics consumers are not implemented here.

## Issues

Critical: none.
Important: none.
Minor: none.

## Focused reachability checks

Risk: the new records might not reach the existing durable writer or might be returned before flushing. Checked the real task chain at coordinator.js:1420 through reviewAndFix and its noteFixHistory call; runTask finally flushes at :1448, and round completion flushes remaining buffers and drains at :1585-1586. Merge-lane holds and pending-closure producers likewise use noteRecovery/noteLedger. Deferred sweep records queue directly and drain at :1668; Finish closure clears queue directly and drain at :1852. Checked sibling review/seam/check fixer dispatches: each non-null result reaches noteFixHistory. Identical elided Recovery fallbacks retain source/commit facts.

Risk: new durable data could inflate the mechanical reader or be silently lost by the digest. Checked readLedgerPrompt at coordinator.js:2309 and ledger-digest:40-44: the actual reader invokes the modified digest, while oversized lines become source pointers and compact invalid lines reach the explicit decoder gap path. Legacy reducers are unchanged.

## Test evidence

No tests rerun, as instructed. The implementation report records final commands on the reviewed immutable head:

- `TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.4 node tests/super-code/replay-harness.mjs > evidence-task4-final.log 2>&1` — exit 0, `1802 passed, 0 failed`.
- `TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.4 bash tests/super-code/test-dispatch-text.sh > evidence-task4-dispatch.log 2>&1` — exit 0, `dispatch-text: all tests passed`.

These commands plausibly cover the real digest subprocess, additive producer/read paths, bounded gaps, exact landing evidence, FIXED history across clean retries, and retry preservation. The report includes failing-before-change evidence and final process hygiene with no leaks. Live agent evaluation is explicitly parent-owned rather than claimed by this leaf.

Test changes commands executed successfully in the task worktree: `git diff --stat BASE..HEAD -- PATHSPECS` and `git diff BASE..HEAD -- PATHSPECS`, with BASE=f1fb23d15eaaa70fff95404a97342cd83fb0bdb7, HEAD=18a0b359df063617af5c643bb73f2737c8aacbdd and PATHSPECS=`'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'`.
Result: replay-harness.mjs, 96 additions and 3 deletions. Existing expected assertions remain; helper filtering preserves the legacy Task/Merge assertion view while new recovery-aware assertions examine the complete additive stream. No unjustified deletion, skip or weakened expected value found.

## Review artifacts

The initial sandboxed review-package invocation could not create its output; the same command was rerun successfully with approved escalation. The final package contains one commit and all five changed files. No source or test files were modified during review.
