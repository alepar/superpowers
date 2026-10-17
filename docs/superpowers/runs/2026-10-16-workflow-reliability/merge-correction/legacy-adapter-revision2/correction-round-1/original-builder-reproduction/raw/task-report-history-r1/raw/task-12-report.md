# super-plan-ufz.13 — implementation evidence

Status: IMPLEMENTED

- Branch: `task-super-plan-ufz.13`
- Base: `caf187cef8d1769da6184de42332a31bc7e30dcb`
- Head: `9610071921c440aa1debff4b873525b42cf3f217`
- Tested tracked tree: `a9b037fe8c354ce529bdfd79413a6ccfa8df6fa7`
- Stacked: false
- Commit: `fix(super-code): complete reviewed verification-only tasks without commits`
- Worktree: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.13`

## Implementation

An IMPLEMENTED outcome may explicitly select `completionKind: verification-only`, with unchanged full base/head commits, no delivered files, and a tested sourceTree plus the existing .5 evidence arrays. Implementation is the default and retains its commit nudge, delivered-change review and nonempty review-package guards. The implementer template selects the completion kind before its commit section; it no longer unconditionally demands a commit for a no-change task.

The task reviewer has a conditional evidence-review path before package construction. It resolves the captured commits/tree, checks clean source, reads current bead/comments/brief to confirm no-change acceptance, and reviews retained command/configuration/outcome/kind coverage without rerunning tests. An implementation requirement rejects the claim. CLEAN must independently confirm verification-only intent and matching commits/tree and preserve the original reviewed measurements. The coordinator validates these identities and exact records, including every required live check from both producers. Missing, stale, failed, unavailable, fallback-for-live, null, INVALID or rejected review cannot complete. A verification rejection never takes an unreviewed fix-to-merge path; tracker closure alone cannot replace rejected acceptance.

Accepted work writes its compact basis through the existing pending-closure Recovery record and waits for appended:true before tracker closure. The basis includes source, unchanged range, retained check records, report/review references and independent review status. If persistence is unavailable, closure is withheld. It then uses existing closure/status confirmation with a verification-specific close prompt that checks the captured commit/tree instead of claiming a Git landing. Cleanup output remains its actual outcome, including unknown or kept resources. Confirmed task closure completes without a merge, commit nudge, early implementation split or new task landing. Pending closure resumes at closure only. Deferred minors retain their existing class, fingerprint and review-source references. Review/seam/check fix history and root/run acceptance are unchanged.

Ordinary dispatch uses `review --result-file <implementer-result.json>` to carry the same explicit intent and source/evidence into the shared builder. `verification-close --result-file <accepted-basis.json>` validates the accepted record and generates the shared closure prompt. The ordinary reference specifies comparison of both original replies before constructing that accepted basis.

The coordinator approved a minimal additional touched file, ledger-digest: complete lines retain the verification-only discriminator. The existing 4096-byte Recovery cap and gap source pointers remain unchanged. A typed completion with no valid retained basis is a recovery gap, rather than an inferred historical landing/completion; a ready reentry obtains independent review before closing. This preserves task .7's source-pointer contract and does not add a root gate.

## Final verification

No package setup/install is declared for these native Node/Bash checks. Node resolved at `/opt/homebrew/bin/node`; require.resolve located both tests/super-code/replay-harness.mjs and skills/super-code/scripts/dispatch-text.mjs inside this assigned worktree. The package under test and its runners came from this worktree.

The exact final commands were:

```sh
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.13 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.13 HOME=/tmp/sp-bce79baa/super-plan-ufz.13/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/state node tests/super-code/replay-harness.mjs > .superpowers/evidence/super-plan-ufz.13/replay-final.txt 2>&1
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.13 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.13 HOME=/tmp/sp-bce79baa/super-plan-ufz.13/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/state bash tests/super-code/test-dispatch-text.sh > .superpowers/evidence/super-plan-ufz.13/dispatch-final.txt 2>&1
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.13 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.13 HOME=/tmp/sp-bce79baa/super-plan-ufz.13/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/state bash tests/super-code/test-run-digest.sh > .superpowers/evidence/super-plan-ufz.13/digest-final.txt 2>&1
```

All three exited 0. Relevant output:

```text
[PASS] unchanged verification dispatches independent review and confirmed closure
[PASS] verification creates no artificial commit, merge, unreviewed fix or early split
[PASS] durable completion retains source, independent review and evidence basis
[PASS] resume reuses reviewed verification with unchanged source
[PASS] verification completion does not increment task landings or invalidate ledger accounting
[PASS] missing evidence cannot complete unchanged verification
[PASS] stale source cannot complete unchanged verification
[PASS] fallback required live cannot complete unchanged verification
[PASS] unavailable required check cannot complete unchanged verification
[PASS] changed verification cannot complete unchanged verification
[PASS] changed files cannot complete unchanged verification
[PASS] wrong required configuration cannot complete unchanged verification
[PASS] missing reviewer source cannot complete unchanged verification
[PASS] failed required check cannot complete unchanged verification
[PASS] unconfirmed intent cannot complete unchanged verification
[PASS] implementation bead cannot complete unchanged verification
[PASS] null review cannot complete unchanged verification
[PASS] invalid review cannot complete unchanged verification
[PASS] rejected review cannot complete unchanged verification
[PASS] tracker closure alone cannot replace rejected verification acceptance
[PASS] unavailable durable verification write prevents tracker closure
[PASS] a reviewer cannot switch implementation delivery to no-change completion
[PASS] confirmed closure retains unverified cleanup as its actual outcome
[PASS] oversized basis preserves cap/source pointer and verification completion discriminator
[PASS] typed completion with compacted-away basis remains an evidence gap rather than an inferred landing
[PASS] ready reentry with missing basis obtains independent verification review before closure
[PASS] unavailable closure preserves verified basis and remains unconfirmed
[PASS] pending verification resumes closure only without repeating reviewed work
2062 passed, 0 failed

dispatch-text: all tests passed
run-digest: all tests passed
```

Existing missing-commit and implementation empty-range INVALID assertions remain unchanged and passed. The run-digest suite was added to the required two because it is the caller of ledger-digest; the replay also invokes the actual reducer for ordinary and oversized Recovery roundtrips. Source identity and final source review assertions remain green. git diff --check returned 0. The final tests exercised the tracked bytes committed at head; the subsequent rebase reported the task branch already up to date, and git status --short was empty.

These are deterministic fixture results. Replay's Workflow/agent replies are simulated, including the live-sim-labelled scenarios; they are not a fresh-agent behavior evaluation. The dispatch and digest suites run actual local commands against fixture state. No required fresh-agent live evaluation is relabeled passed here.

## TDD evidence

Used writing-skills and test-driven-development. Parent supplied the prior fresh-agent baseline at docs/superpowers/runs/2026-10-16-workflow-reliability/behavior-baseline/report.md: valid verification-only completion failed 3/5 installed-guidance trials versus 0/5 controls. The supplied traces attribute the failure to unconditional empty-diff INVALID instructions. The change is a conditional protocol/mechanism for that evidence-backed contrast, rather than stronger general judgment prose. Parent owns the same-pack post evaluation.

Before production changes, added verification replay and ordinary dispatch fixtures. The exact replay/dispatch commands matched the final commands above with output names replay-red.txt and dispatch-red.txt. Both exited 1:

```text
[FAIL] unchanged verification dispatches independent review and confirmed closure
[FAIL] verification creates no artificial commit, merge, unreviewed fix or early split
[FAIL] evidence review receives intent, fixed source and retained measurements
[FAIL] verification closure uses reviewed basis and tracker status rather than a merge claim
[FAIL] durable completion retains source, independent review and evidence basis
[FAIL] ledger records verification basis before completion
[FAIL] resume reuses reviewed verification with unchanged source
[FAIL] unavailable closure preserves verified basis and remains unconfirmed
[FAIL] pending verification resumes closure only without repeating reviewed work
2030 passed, 9 failed

dispatch-text: 5 failure(s)
```

The dispatch failures were missing explicit intent, fixed tree, retained evidence references, evidence-review selection and default implementation intent. After the initial change, all new cases passed; one unchanged existing metrics assertion failed because a new zero-valued field changed its exact output. Production now retains the exact old metrics line when there are no verification-only completions; the existing assertion was not loosened.

Self-review added and observed three further RED regressions before their fixes. Each used the same replay command/environment with the indicated output file:

```text
persistence-red.txt:
[FAIL] unavailable durable verification write prevents tracker closure
2054 passed, 1 failed

rejection-red.txt:
[FAIL] tracker closure alone cannot replace rejected verification acceptance
2056 passed, 1 failed

cap-red.txt:
[FAIL] oversized basis preserves cap/source pointer and verification completion discriminator
[FAIL] typed completion with compacted-away basis remains an evidence gap rather than an inferred landing
[FAIL] ready reentry with missing basis obtains independent verification review before closure
2059 passed, 3 failed
```

Final GREEN covers every one. Example failing values for the assertions are a commit-nudge/merge dispatch on the accepted unchanged task; a completion despite null/CLEAN-with-wrong-tree/fallback-for-live review; a rewritten provenance location; a missing Recovery basis or lost verification token; a close dispatch after failed append; a task landing count of 1 instead of 0; or a completed bucket populated only by tracker closure after review rejection. The fixtures check real coordinator routing, emitted prompts, result/ledger contents and the actual digest output, rather than asserting canned reply shapes against themselves.

Full logs remain git-ignored inside .superpowers/evidence/super-plan-ufz.13/ in the assigned worktree.

## Files changed

- skills/super-code/coordinator.js
- skills/super-code/implementer-prompt.md
- skills/super-code/task-reviewer-prompt.md
- skills/super-code/scripts/dispatch-text.mjs
- skills/super-code/scripts/ledger-digest (parent-approved minimal scope extension)
- skills/super-code/coordinator-workflow.md
- skills/super-code/coordinator-subagents.md
- tests/super-code/replay-harness.mjs
- tests/super-code/test-dispatch-text.sh

## Test hygiene

None: ownership-scoped checks after completed test batches returned 0 with no match: lines. Every test/probe used TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.13 and isolated HOME/XDG homes. Test fixtures created their own temporary directories beneath that root. No background server, daemon, watcher or agent was started. Final stop/check commands run from neutral /private/tmp use only the assigned worktree and task temp roots; there are no survived: lines.

The check command was:

```sh
cd /private/tmp && bash /Users/alepar/.codex/plugins/cache/superpowers-alepar/superpowers/6.4.2-alepar6.0/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.13 /tmp/sp-bce79baa/super-plan-ufz.13
```

## Assumptions and amendments

Read current bd show super-plan-ufz.13 --json and bd comments before implementation; there were no comments or conflicting bead amendments. Applied the frozen task-12 brief and .5 source-bound evidence contract. Explicit no-change intent and independent semantic coverage are required; unchanged Git history alone does not establish acceptance.

Parent explicitly approved preserving the minimal verification-only discriminator in ledger-digest with focused cap/reentry fixtures, while retaining the 4096 bound, truthful gaps and existing source pointers. review-package is unchanged and read-only for this task. No integration/user-checkout source files were written; only the explicitly assigned brief generator and this report used plan-workspace write targets. No subagents were spawned and no Herdr operations were performed.

## Concerns and remaining evaluation

No unresolved deterministic failures. Fresh-agent no-change/implementation contrast and the same-pack post behavior evaluation remain parent-owned, as do independent root acceptance and final integration review/sweep. The change deliberately leaves oversized or missing accepted-basis records as gaps; a retained source pointer or ready reentry is required to recover review coverage, and no evidence body is forced through the compact transport limit. Legacy complete lines without a verification discriminator retain legacy semantics.

## Seam fix

Status: FIXED

- Original task base: `caf187cef8d1769da6184de42332a31bc7e30dcb`.
- Original task source: `9610071921c440aa1debff4b873525b42cf3f217`.
- Exact rebase target and final merge-base: `43f18740e270d4d5a2730d4194e47f4eac04be39`.
- Final committed head: `70854e385736ce425a65d027a629ae0c1d58263c`.
- Tested committed tree: `ab08708333a5454aca375c8b87d905fd8784fb7a`.
- Conflict files: `skills/super-code/coordinator.js`, `tests/super-code/replay-harness.mjs`.
- Overlap with intervening integration changes: those two files plus `skills/super-code/coordinator-subagents.md`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/task-reviewer-prompt.md`. The three Markdown overlaps merged automatically; their independent evidence review and run-failure/recovery guidance remain present.

Rebased only the assigned task branch onto the exact target. Resolved each conflict preserving the verification-only result discriminator, independent source/evidence review, typed digest/resume evidence gaps, failureAttribution schema, durable introducing-owner/contradiction history, and resumed admission/Finish hold gates. Both previously independent replay scenario groups remain intact.

The combined code exposed an additional seam: the landed pending-closure reconciler required a Git landing head, which a verification-only record intentionally lacks. Its additive verification branch now resolves the retained unchanged commit/tree and observes all associated tracker statuses through `sourceVerified`; it never manufactures a landing or increments merge counts. Unavailable, mismatched or contradictory facts hold recovery even when a later tracker response claims closure. Verification closure now appends its clear and typed completion with structured `appended: true` confirmation before reducing the obligation or settling completed; failed writes retain the accepted basis and hold recovery. Cleanup observations preserve additive existing Recovery fields and evidence. Existing implementation landing reconciliation and regression classification remain intact.

Added focused seam assertions for verification source/tracker recovery, already-closed verification recovery, and null/false closure append results. Values that fail these assertions include a missing sourceVerified observation, a fabricated already-merged prompt, a completion after failed append, a discarded accepted basis, or a merge count above zero. The existing recovered verification fixture now supplies the required explicit read-only source/tracker observation instead of assuming it. No assertion was deleted or weakened.

### Seam verification

The RED run used the replay command below with `seam-red.txt` as its output file. It exited 1 with `2189 passed, 3 failed`:

```text
[FAIL] pending verification resumes closure only without repeating reviewed work
[FAIL] verification resume checks captured commit/tree without inventing a landing
[FAIL] already closed verification resume confirms durable typed completion without a landing
```

Final exact commands (all exited 0):

```sh
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.13 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.13 HOME=/tmp/sp-bce79baa/super-plan-ufz.13/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/state node tests/super-code/replay-harness.mjs > .superpowers/evidence/super-plan-ufz.13/seam-replay-final.txt 2>&1
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.13 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.13 HOME=/tmp/sp-bce79baa/super-plan-ufz.13/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/state bash tests/super-code/test-dispatch-text.sh > .superpowers/evidence/super-plan-ufz.13/seam-dispatch-final.txt 2>&1
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.13 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.13 HOME=/tmp/sp-bce79baa/super-plan-ufz.13/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.13/state bash tests/super-code/test-run-digest.sh > .superpowers/evidence/super-plan-ufz.13/seam-digest-final.txt 2>&1
```

Relevant combined output:

```text
[PASS] durable clean re-entry retains same-source contradiction and open owner
[PASS] supported different-source repair retains earlier verification contradiction in history
[PASS] unchanged verification dispatches independent review and confirmed closure
[PASS] durable completion retains source, independent review and evidence basis
[PASS] typed completion with compacted-away basis remains an evidence gap rather than an inferred landing
[PASS] pending verification resumes closure only without repeating reviewed work
[PASS] verification resume checks captured commit/tree without inventing a landing
[PASS] unverified source or tracker holds verification recovery despite tracker closure claims
[PASS] failed verification closure append preserves accepted basis before settlement
[PASS] already closed verification resume confirms durable typed completion without a landing
[PASS] partial recovery confirms tracker closure before attempting its durable clear
2192 passed, 0 failed
dispatch-text: all tests passed
run-digest: all tests passed
```

Replay exercises all internal callers of the additive queueLedger/flushLedger confirmation option, confirmClosure, and resumeCheckPrompt; an rg call-site search found no callers outside coordinator.js. Dispatch and digest suites cover the ordinary execution/evidence transport and typed durable reduction. These remain deterministic fixtures, not fresh-agent behavior evals. Parent-owned no-change/implementation behavior evaluation remains unchanged. `git diff --check` passed, rebase completed successfully, and final `git status --short` was empty. The rebase continuation committed the tested bytes without changing them.

### Seam test hygiene

Final checks after RED and the combined GREEN batch returned exit 0 with no match lines. An earlier check was accidentally run while RED was still executing and matched its active runner PID 43680 and active remove-task-worktree fixtures PIDs 46279/46284; all exited with the completed replay, and the subsequent completed-run checks matched none. No leaked process required termination. The final ownership-scoped stop/check uses the same assigned worktree and `/tmp/sp-bce79baa/super-plan-ufz.13`; no survived lines. No agent, server or watcher was started.

### Seam assumptions and concerns

Read current `bd show super-plan-ufz.13 --json` and `bd comments super-plan-ufz.13`; there were no comments or requirement amendments. The named standalone seam-review diff file was absent, so this pass used the exact rebase-conflict finding embedded in the dispatch. No declined findings. No integration/source checkout writes, branch merges, tracker mutations, subagents or Herdr writes. Only the task worktree and this authorized report were changed. No unresolved deterministic failures; fresh-agent evaluation and integration acceptance remain parent-owned.
