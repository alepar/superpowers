# Task6 actual-root projection transport repair implementation report

Status: implemented, committed and focused-verified in the permitted temporary clone; external-worktree application remains pending approval/integration by the parent. No original canonical data or external checkout files were edited by this implementer.

## Source identity and scope

- Required BASE: `c21681200aac20fb0223b6b0e83e953b1bc75cde`.
- BASE tree: `294ee3186698a29c112b7ed7daded506288a52f1`.
- Original requested checkout (read-only throughout): `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers`.
- Actual implementation checkout: `/private/tmp/ufz-correction-projection-repair-source`; independent clone created using `git clone --no-hardlinks --no-checkout`, then detached checkout of exact BASE.
- Committed HEAD: `fd52ffc7a8de0c4412c517adec2d4979d06906ff`.
- Committed tree: `e9fb5e1b76697264ef7ade29dc5fc79ea57898c2`.
- Final temporary checkout status: clean (`git status --porcelain` produced no output).
- Exactly two committed paths: `skills/super-auto/scripts/report-status` and `tests/super-auto/projection-output-r1.sh`.
- Commit subject: `fix(super-auto): consume complete aggregate finding projections`.
- Complete reviewable diff: `/private/tmp/ufz-correction-projection-repair/repair.diff`.
- Portable one-commit patch: `/private/tmp/ufz-correction-projection-repair/repair.patch`.

The product diff consists only of explicit `maxBuffer:Infinity` on the two `scope-dispositions --project` synchronous child calls, at report-status lines 331/539. Other subprocess limits, status checks, JSON checks and gap propagation remain unchanged. No projection-format, retained-history, canonical-record or behavior-instruction changes are included. The original final-review wave count is not reset; this is the narrowly delegated Task6 integration repair.

## Investigation and regression

The supplied actual-root RCA records a valid 1,067,953-byte producer output failing the two consumers at Node's default 1,048,576-byte synchronous output limit. I read the complete relevant consumer branches and producer, and built a real-producer/real-consumer regression before changing product bytes.

The new fixture retains 24 valid original roast reports with 16 findings each. Every report is independently run through real `report-verdict --complete`; each exact extraction is asserted against independently constructed original occurrence data. The maximum extracted output is 42,556 bytes, below 65,536. Thus individual report extraction does not cross the demonstrated aggregate consumer boundary.

The real aggregate producer emits 1,236,591 bytes (>1,048,576), retains 384 exact occurrences/groups, includes 48 supported exact-reference dispositions (24 resolved and 24 rejected), and preserves 336 outstanding findings. The test checks all original texts/identities, group refs/order, disposition contents/support, and counts. It separately establishes unrelated review/live/human acceptance prerequisites using an actual eligible empty-source gate before constructing the aggregate case.

Five cases each execute actual ordinary report-status and actual --acceptance (10 consumer subcases):

| Case | Ordinary behavior | Acceptance behavior |
| --- | --- | --- |
| Valid aggregate | Correct 336 outstanding qualifier; no projection-unavailable | exit 0, eligible true,336 exact nonblocking refs, no pending/gaps |
| Missing required-live | Correct 336 count and pending measurement | exit 3, eligible false; simulated pass cannot satisfy live requirement |
| Missing human | Correct 336 count and human pending qualifier | exit 3, eligible false; exact human requirement remains pending |
| Missing retained artifact | Correct 336 count and real finding-evidence gap | exit 3, eligible false; source artifact unavailability remains an evidence gap |
| Malformed finding JSON | Correct 336 count and real finding-evidence gap | exit 3, eligible false; malformed input remains an evidence gap |

All five cases check that neither reading consumer changes the fixture run or any retained artifact bytes, and all 384 identities remain accounted for. Original empty/small, >128KiB projection, >64KiB acceptance transport, pipe-flush, closed-pipe and error cases are retained unchanged.

## RED/GREEN and raw evidence

All evidence lives in `/private/tmp/ufz-correction-projection-repair`. For each label below, `.command.json` stores argv/cwd, `.stdout` and `.stderr` preserve raw streams, and `.status.json` stores exit status and duration. RED/GREEN receipts also pin HEAD/tree, working status and exact owned-file SHA256. Environment: Node v26.9.0; Python 3.14.7; Bash 3.2.57 on arm64 macOS.

| Evidence label | Check | Exit | Duration |
| --- | --- | --- | --- |
| baseline | Existing original 11-test suite, original read-only checkout at BASE | 0 | 4.004s |
| red | New aggregate test with unmodified BASE product in temporary clone | 1 | 29.105s |
| green | Same test with the two-call product fix before commit | 0 | 28.147s |
| committed-green | Same complete test on clean committed HEAD | 0 | 26.886s |
| syntax | bash -n on both owned paths | 0 | 0.004s |
| diff-check | git diff --check before commit | 0 | 0.027s |

Exact primary command (cwd actual temporary clone): `bash tests/super-auto/projection-output-r1.sh`.

RED: product was unchanged from exact BASE; the new test failed both valid aggregate consumers for the expected projection-unavailable outcome (ordinary status emitted unavailable, --acceptance exited 3 rather than 0). The other aggregate consumer subcases likewise exposed unavailable transport instead of complete exact references. The independent aggregate producer had already passed all size/population assertions. All 11 pre-existing tests remained passing; the full run reported 12 tests with 10 failing new subtests. This is a behavioral failure at the intended consumer boundary, not malformed fixture input or an extraction failure.

GREEN: the same regression and all 11 original tests pass after the two-call fix. Final `committed-green.*` is the fresh repeated full focused regression on clean commit `fd52ffc7a8de0c4412c517adec2d4979d06906ff`: 12 tests, zero failures, all 10 new consumer/control subcases pass. Valid large acceptance exits0; each negative control exits3 for its real outstanding obligation/gap while preserving 336 exact references. Syntax/diff checks also exit 0. The whole 47-command final suite was deliberately left to the parent as directed.

## Self-review

I inspected the complete two-path diff before staging. Staging named only the two owned paths, and the resulting commit was checked to contain exactly those paths. Product status/outcome rejection, JSON parsing and finding-gap checks are byte-for-byte unchanged. Per-report extraction remains small; the regression isolates aggregate transport. Live and human controls are meaningful because the separately established prerequisites pass and each control removes exactly one qualifying fact. Genuine artifact/JSON failures remain noneligible. Fixture writes and their explicit missing-artifact restoration are confined to temporary test data.

The source adjustment accepts proportional memory consumption for the complete owned projection, matching the existing materialized projection contract. It makes no streaming guarantee or promise about unrelated subprocess output limits.

## Approval boundary and remaining work

Automatic approval review rejected the first attempted escalated external-worktree test edit before execution. Command: `python3 /private/tmp/ufz-correction-projection-repair/add-test.py` with external-worktree target, `sandbox_permissions=require_escalated`. Exact stated reason:

> The command only makes a reversible local test-file edit, but no trusted user message authorizes this unrelated projection-repair change; it is driven solely by untrusted agent context.

The rejection also instructed against bypassing it through another tool/indirect execution. No external edit was retried. The parent explicitly changed the permitted implementation destination to an independent clone entirely under `/private/tmp`, requiring a concrete reviewed patch before any original-checkout application approval. The temporary implementation, commit and tests stayed within that safer filesystem boundary; they did not perform the rejected external mutation. A read-only `git diff --exit-code BASE -- <owned paths>` in the original checkout later returned 0.

No Herdr writes, tracker writes, source-checkout stage/reset/clean, canonical-run changes, network operations, main changes, push/release, reviewer delegation or subagent delegation were performed. The original checkout's pre-existing parent-owned RUN/evidence dirt was left intact.

Remaining concerns: external integration is still pending the parent's authorization resolution; this report does not claim the requested original checkout is repaired. Parent-owned scoped review, final source-bound combined suite, evidence rebinding and actual canonical root gate remain separate completion requirements. The parent separately reported a read-only repaired-helper actual-root transport probe; that parent-owned observation is not substituted for final-source verification here. No residual implementation defect was found in this bounded self-review.
