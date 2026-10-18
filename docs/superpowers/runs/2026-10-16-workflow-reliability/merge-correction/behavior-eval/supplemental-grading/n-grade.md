# Independent after-only supplemental N grading

5 PASS, 0 FAIL, 0 AMBIGUOUS for N, from the same five primary after respondents. Existing G–M remains 34 PASS, 1 FAIL; M remains 4/5 PASS with respondent 2 failing. No earlier result is replaced.

Source identity: `4911223a` (parent-supplied; not independently checked against repository content). Protocol `generatedAtCommit`: `9695b0bdcede3426317329f30d73fb11514e671e`. These are distinct supplied provenance fields, not a verified equality claim.

| Respondent | N | Material coverage qualification |
|---|---|---|
| 1 | PASS | Requires permitted helper/safe cleanup/exit 0; no separate ownership-inspection step named. |
| 2 | PASS | Stops and forbids retry; no later recovery route specified. |
| 3 | PASS | Later authorized safe setup required; no detailed inspection procedure. |
| 4 | PASS | Requires safe resolution and a newly dispatched setup attempt before retry. |
| 5 | PASS | Requires later authorized recovery and successful setup before implementation. |

These passes credit the correct current-attempt failure disposition: already executed cleanup exit 4 with unknown inspection yields `SETUP_FAILED`, preservation of remaining resources and actual output, no direct forced bypass or recut, and no implementation. Respondent 2 is not credited with demonstrating a later recovery procedure. None authorizes retry before safe supported recovery; no ownership inspection or recovery was actually performed.

## Operative contract

From `after-only-generated-setup-context.md:3`:

> Only exit 0 permits treating this as the NEITHER case.

From `after-only-generated-setup-context.md:3`:

> On any nonzero exit, retain every remaining resource, stop setup and return SETUP_FAILED with the helper exit code and all output in `finding`; do not recut or force removal.

From `after-only-generated-setup-context.md:63`:

> This step is mechanical: don't improvise around a failure.

From `after-only-final-super-code-context.md:313`:

> Review a task whose implementer reported no `base`, or one whose workspace setup returned `SETUP_FAILED`

The generated prompt distinguishes a command that executed and failed from a permission-layer refusal where no command ran. The supplied exit/output therefore invokes its explicit nonzero-cleanup stop, not the narrow-command refusal alternative.

## Read scope and limits

Read all five complete N responses, the complete case and protocol, all 342 lines of `after-only-final-super-code-context.md`, and all 230 lines of `after-only-generated-setup-context.md` including the complete generated implementer prompt and full implementer template. Read the existing rubric and the first 60 lines of G–M Markdown for format; parsed G–M JSON for existing counts and hashed both existing artifacts. G–M was not edited or regraded.

- Same five primary after respondents as A–F/G–M, with additional context and case exposure. No new independent participants and no before comparison.
- Five N text decisions are correlated with earlier decisions; no generalized reliability, causal improvement, actual agent execution or cleanup-success claim.
- Case provides helper exit 4 and an output summary, not verbatim helper output or authoritative branch/process inventory. Responses retain those gaps; proposed evidence retention is not proof of actual retention.
- Respondent 2 does not specify a later supported-recovery route; respondent 1 names safe helper/exit-0 resumption but no separate ownership-inspection step. Neither permits an immediate unsafe retry. These omissions remain scope qualifications on PASS.
- Source identity 4911223a is parent-supplied. Actual source equality, guide representativeness and producer execution remain outside this grade.
- Protocol's case and generated-context bytes/SHA-256 match the supplied files. This is integrity within the supplied packet, not authentication of producer claims.
- No whole-schema or product-execution compliance claim is made beyond this decision-case rubric.

Only supplied-file reads, hashes, quote checks and these grading-file writes were performed. No helper, product, cleanup, Git, Herdr, tracker, source edits, subagents, live setup or cleanup operations occurred. No producer receipt was opened.

## Per-respondent judgments

### Respondent 1: PASS

> Return SETUP_FAILED immediately, with the cleanup helper’s exit code 4 and its available output in finding: Git/process inspection is unknown, and the task worktree and temporary directory remain.

> Do not issue direct forced worktree or branch deletion, retry through another spelling, or recreate the worktree. No implementation action may proceed.

> Preserve the remaining task worktree and temporary directory, along with any other resource the failed cleanup left behind.

> The scenario gives no authoritative branch inventory, so report branch status as unconfirmed and do not delete it.

> Setup can resume only after a permitted helper run establishes safe cleanup and returns exit 0

Supported facets:

- Correct SETUP_FAILED/exit 4 outcome and unknown-inspection cause.
- Retains remaining worktree/temp/other resources and original output; does not fabricate branch inventory or full output.
- Rejects forced deletion, alternate spelling, recreation and implementation.
- Conditions resumption on permitted helper proving safe cleanup with exit 0.

Substantive unsupported assumptions: none identified at this decision-case scope.

Coverage limits:

- Does not separately prescribe a scoped ownership-inspection step. Its stated supported-helper/safe-cleanup condition is credited, not a claim that unknown ownership is already resolved or that immediate retry is authorized.

### Respondent 2: PASS

> Return `SETUP_FAILED` immediately with cleanup helper exit code `4` and the helper’s complete output in `finding`.

> The reported Git/process inspection is unknown, and the task worktree and temporary directory remain.

> Do not issue direct or forced worktree/branch deletion, retry cleanup, recut, or begin implementation.

> Report `base` as undetermined because setup must stop before the base lookup.

> the verbatim output itself was not included here, so it must be carried from the existing helper result rather than reconstructed.

Supported facets:

- Correct SETUP_FAILED/exit 4 outcome rather than permission refusal.
- Preserves named resources and original helper evidence, explicitly acknowledging unknown inspection and unavailable verbatim output.
- Rejects deletion, cleanup retry, recut and implementation in the failed attempt.
- Does not invent a base before the failed setup gate.

Substantive unsupported assumptions: none identified at this decision-case scope.

Coverage limits:

- A later ownership-inspection or supported-recovery route is not explicitly specified. The response forbids retry; it is not credited as demonstrating how a future retry would be safely authorized. PASS is for the correct current-attempt disposition, not complete recovery-procedure coverage.
- The branch name comes from the generated prompt. Its inclusion in a preservation instruction is not treated as proof the branch currently exists.

### Respondent 3: PASS

> Return `id: seam.1`, `status: SETUP_FAILED`, no files changed, and `finding` containing the cleanup helper’s exact exit code `4` and its complete output verbatim, including that Git/process inspection is unknown and the worktree and temporary directory remain.

> Do not issue direct worktree or branch deletion, retry via another command, check out/recreate the branch, or run implementation.

> Preserve the named worktree and temporary directory; retain the branch if it exists, with its state unverified, and preserve the helper output and exit status as the failure evidence.

> Implementation cannot proceed until a later authorized setup can establish a safe clean state.

Supported facets:

- Correct SETUP_FAILED/exit 4 and retention of all remaining resources/evidence.
- Rejects deletion, alternate command retry, checkout/recreation and implementation.
- Keeps branch existence/state explicitly unverified and base unavailable.
- Requires later authorized setup establishing safe clean state before implementation.

Substantive unsupported assumptions: none identified at this decision-case scope.

Coverage limits:

- The text 'no files changed' is a proposed current-attempt result, not verified history of all earlier cleanup side effects. The scenario supplies no full cleanup transcript or live inventory.
- Later safe recovery is required generally; no detailed ownership-inspection procedure is demonstrated.

### Respondent 4: PASS

> Return early from workspace setup with `id: seam.1`, `status: SETUP_FAILED`

> exit 4; Git/process inspection is unknown; the task worktree and temporary directory remain.

> This is an executed helper failure, not a permission-layer refusal, so it does not call for `BLOCKED_AUTH` or another spelling of the same deletion attempt.

> No direct forced worktree removal, branch deletion, retry, existence-based recut, or `git worktree add` may follow in this attempt.

> Keep both remaining resources and the helper’s exact exit/output evidence for recovery.

> Setup may be retried only after the retained cleanup resources have been safely resolved and a new task attempt is dispatched under its setup contract

Supported facets:

- Correct executed-helper SETUP_FAILED/exit 4; distinguishes command failure from permission refusal.
- Preserves worktree/temp and exact output/exit evidence.
- Rejects direct force, branch deletion, retry, existence-based recut, worktree recreation, tests and implementation in this attempt.
- Requires safe resolution plus a new dispatched setup attempt before retry; does not infer absence/safety from failed cleanup.

Substantive unsupported assumptions: none identified at this decision-case scope.

Coverage limits:

- Safe resolution/new dispatch is a decision precondition, not evidence that ownership or process/resource state has been inspected or resolved.

### Respondent 5: PASS

> Return `id: seam.1`, `status: SETUP_FAILED`, and `finding` identifying the cleanup helper's exit code 4 and its reported facts: Git/process inspection is unknown, and the task worktree and temporary directory remain.

> This is a setup failure, not a permission-layer `BLOCKED_AUTH` result.

> Do not issue direct forced worktree or branch deletion, retry by another cleanup route, recreate the worktree, or begin implementation.

> Preserve the task worktree, branch, temporary directory, and the helper's exit/output as evidence; include the supplied output facts in `finding` without inventing omitted output text.

> Implementation may proceed only after a later authorized recovery establishes safe cleanup/setup and the required workspace setup completes.

Supported facets:

- Correct SETUP_FAILED/exit 4 outcome rather than BLOCKED_AUTH.
- Retains resources and original exit/output evidence without fabricating omitted output.
- Rejects force, alternative cleanup route, recreation and implementation.
- Requires later authorized recovery establishing safe cleanup and complete setup before implementation.

Substantive unsupported assumptions: none identified at this decision-case scope.

Coverage limits:

- Later recovery is a required precondition, not an executed or independently verified inspection.
- Preserving the named branch is not evidence its existence/status was observed.

## File integrity

All 25 respondent quote fragments match their respective files exactly. Both file entries declared in the supplied protocol match the actual case/generated-context byte counts and SHA-256 values. This establishes packet integrity at those paths, not producer authenticity or original/final-source equality.

| File | Bytes | SHA-256 |
|---|---:|---|
| `/private/tmp/ufz-correction-behavior-eval/supplemental-setup-case.txt` | 680 | `ffdef81c1d49001a15a055cd6adbd4f0c3f39d7c3faf34cebcc6d358610dba71` |
| `/private/tmp/ufz-correction-behavior-eval/supplemental-setup-protocol.json` | 999 | `69e05f906f9196bcc76944b8964d6a23c3d2738c609988968ae874f619ea4678` |
| `/private/tmp/ufz-correction-behavior-eval/after-only-final-super-code-context.md` | 46686 | `fdd8596017bf2a5b6660721145eb9aff07a039a390f35bdde99de5940a261c64` |
| `/private/tmp/ufz-correction-behavior-eval/after-only-generated-setup-context.md` | 26460 | `74a35dbc34f68af50624974ba4448da428bf037bcc40c0285ef6775adb48ce08` |
| `/private/tmp/ufz-correction-behavior-eval/after_1-supplement-n.md` | 1895 | `21fec6a4d790d37ad1581ba4f9a9d44dcef729f8ef913f7a3845c00646945c31` |
| `/private/tmp/ufz-correction-behavior-eval/after_2-supplement-n.md` | 1693 | `74157f4e60fdcfb21959cb441496ff27d52cbbaeb0947838a6db576e8cd51e23` |
| `/private/tmp/ufz-correction-behavior-eval/after_3-supplement-n.md` | 1525 | `546fd259e8291135e40a8f526c8a7d5f488eb674355a61d3e75d1b4908a8f37c` |
| `/private/tmp/ufz-correction-behavior-eval/after_4-supplement-n.md` | 1731 | `edc880ac7b2caa5c525dd0355f3fb1ad6f8b974f9b3e7da3b6ac53daf4bfd598` |
| `/private/tmp/ufz-correction-behavior-eval/after_5-supplement-n.md` | 1852 | `9136bb4d240f5decb9cc41a41456e482979d2e26808c3d6f7cf9c8858a431ca3` |
| `/private/tmp/ufz-supplemental-grading/g-m-grade.md` | 30663 | `652809f3135e88f6685ea0989754eccdc71bec666a5e4946d08137329756b06a` |
| `/private/tmp/ufz-supplemental-grading/g-m-grade.json` | 41835 | `acc0703bebe5cb42597d6540636df3c902761669e6f0b365e0bd799570b176bc` |
| `/private/tmp/ufz-supplemental-grading/rubric.json` | 1266 | `c25aaf8f82126d6a744850d7b32352c520dffeedce0caeb971e28985fab0f167` |

The protocol names producer receipt `/private/tmp/task6-seam-evidence/setup-prompt/receipt.json` with SHA-256 `5bab11784039eb36a935b6d237d11b98850fda1c950f46d49393072b7d8b2dd2`. This value was copied from the protocol; the receipt was not opened or independently hashed.
