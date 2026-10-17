diff --git a/skills/super-auto/resume.md b/skills/super-auto/resume.md
index f2bf9676..dc9812d8 100644
--- a/skills/super-auto/resume.md
+++ b/skills/super-auto/resume.md
@@ -24,9 +24,30 @@ Hand `super-design` the recorded `idea:`, not the words the user just typed. A r
 
 A resume message that changes something is recorded, not dropped. If it sets a flag differently or amends the goal ("…and run it unattended", "skip the code roast", "also cover the admin API"), append a `resumeChange:` line to `run.md` (run-state.md item 1 (Flags)) and say in one line what it changes. A flag change applies from the resumed phase onward. A phase already done is not redone, so when the flag only mattered there (`planOneShot` after design), say that it changes nothing. A goal change never rewrites `idea:`. At `phase: design`, hand it to `super-design` with the recorded idea as the human's amendment. From `code` onward, it goes to the report's Remaining as follow-up scope unless the human asks for a redesign.
 
+## Recovering review collection
+
+Before any later super-code invocation, report or cleanup, reconcile every `review-collection` intent in `approvals:` against its persisted Launch and settled ledger/result (run-state.md §Review collection records). If the invocation is still active, resume it with that same invocationId. When settlement is confirmed but unrecorded, run the explicit `report-status --collect RUN_MD --invocation ID --workspace WORKSPACE --review REVIEW_PATH_OR_none --verdict RETURNED_REVIEW` command from SKILL.md §Review collection, retaining any declared `--required` inputs. Then run `report-status --collect RUN_MD` to replay all collections. A copy without completion is replayed; identical archive bytes and exact source records remain unchanged. An archived complete bundle can be checked from its retained hashes after the source worktree is gone.
+
+Exit 3 preserves a pending collection/gap with the orchestrator as recovery owner; exit 2/4 establishes no collection. Keep source and archive copies, record the recovery reason and defer later invocation/cleanup until preservation succeeds. A required null or missing review stays a `final review` evidence gap; null with `no work landed` introduces no review source. Replay finding routes and supported dispositions from approvals without rewriting them.
+
+Run `scope-dispositions --project RUN_MD` next. Use every outstanding group's original occurrence refs for active work and Remaining; use its `--keys` output only for outstanding deferred punch-list input, checking status/gaps even when empty. The latest `codeBuckets.review` remains the latest invocation's verdict. It cannot clear earlier findings, and a task success or ready retry adds no resolution evidence. Do not reconstruct the view from the latest review or the historical union of `scopeFilter` punch-list keys. Preserve unavailable inline source occurrences and report their gaps.
+
 ## Resuming at a phase
 
-A resume at `phase: fix-loop` re-queries the open fix beads under the epic and re-enters `super-code` with them; findings recorded in the latest `roast-code` report but missing as beads are re-filed first, because the report is durable and the filing may not have finished. Existing `stepBackCode-round-<N>` and `scopeFilter-round-<N>` records for the round are replayed, never re-dispatched (a `run.md` from before the key split has `stepBack-round-<N>` lines that may be the design roast's: read the code round's decision from its `…-roast-pr-<N>-step-back.md` file instead). A recorded redesign whose spec amendment is not yet committed is applied from its record. For the scope filter (SKILL.md §Step 2 — scope filter), match each report finding on its `[SEV] <location>` key exactly against the recorded entries and route by the recorded disposition. Findings the recorded step-back (SKILL.md §Step 1 — step back) dissolved are skipped; only findings with no matching record go through the scope-filter pass. When the round has a `regressionPass-round-<N>` record, only the findings it lists count as fix work (the rest of that report is punch list), and once their beads close the run goes to phase 6, not back to phase 4 (SKILL.md §Regression-only pass).
+Restore `rootAcceptance: "caller"` on every Workflow or ordinary super-code invocation, including
+fix-loop, final-SHA, sweep-fix and final-review re-entry; `deferSweep` alone supplies no ownership.
+Reconcile the existing `approvals · root-acceptance` snapshots from their durable Recovery/check
+and decision references per run-state.md §Caller-owned root acceptance. Preserve missing reviews,
+required live checks, deferred measurements, run-owned failures and reserved human gates even when
+all implementation leaves are closed. An empty implementation frontier returns to the remaining
+caller phases normally; it cannot accept the root. A historical closed root does not establish
+caller acceptance: still reconcile required reviews, measurements, findings and human decisions.
+Before any root close, re-run `report-status --acceptance RUN_MD --tree FULL_GIT_TREE` against the
+confirmed final code identity. Exit 3 keeps the root open; 2/4 establishes no acceptance. Never
+infer a human choice from `phase: done`: a kept branch or cancelled run can be done with acceptance
+pending. Resume the actual recorded finish outcome and do not repeat its human menu.
+
+A resume at `phase: fix-loop` re-queries the open fix beads under the epic and re-enters `super-code` with them; findings recorded in the latest `roast-code` report but missing as beads are re-filed first, because the report is durable and the filing may not have finished. Existing `stepBackCode-round-<N>` and `scopeFilter-round-<N>` records for the round are replayed, never re-dispatched (a `run.md` from before the key split has `stepBack-round-<N>` lines that may be the design roast's: read the code round's decision from its `…-roast-pr-<N>-step-back.md` file instead). A recorded redesign whose spec amendment is not yet committed is applied from its record. For the scope filter (SKILL.md §Step 2 — scope filter), match each report finding on its `[SEV] <location>` key exactly against the recorded entries and route by the recorded disposition. Findings with a supported explicit disposition in the outstanding projection are skipped; a step-back dissolution alone supplies no such support; only findings with no matching record go through the scope-filter pass. When the round has a `regressionPass-round-<N>` record, only the findings it lists count as fix work (the rest of that report is punch list), and once their beads close the run goes to phase 6, not back to phase 4 (SKILL.md §Regression-only pass).
 
 A `roastCodeExit:` line, whatever its value (`converged`, `thrash`, `capped`, `operator-skipped (<reason>)`), means the loop has ended: at `phase: roast-code` or `fix-loop`, start no further roast round and file no further round's beads. Finish any re-entry a recorded `regressionPass-round-<N>` started, then go on to what follows the loop (the final-SHA gate, base drift, phase 6).
 
