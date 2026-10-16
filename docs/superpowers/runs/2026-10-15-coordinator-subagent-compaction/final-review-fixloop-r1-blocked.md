**Final whole-epic review: `super-auto/coordinator-subagent-compaction` (epic super-plan-goq), at tip `d4ab8afb`**

No full-suite measurement of this branch exists yet. The caller runs the sweep after this review, so this branch is not to be treated as tested. As spot evidence only, I ran six tests:

| Test | Result |
|---|---|
| `node tests/super-code/replay-harness.mjs` | 1736 passed, 0 failed |
| `tests/hooks/test-run-block.sh` | pass |
| `tests/super-code/test-report-verdict.sh` | pass |
| `tests/super-code/test-run-digest.sh` | pass |
| `tests/super-code/test-dispatch-text.sh` | pass |
| `tests/super-code/test-run-profile.sh` | **fails** (1 failure: `expected: none, got: assemble close-split split`) |

## Step 1: my own findings, before reading the ledger

1. **The round-1 fix beads did not land on this branch.** The tip contains none of the 11 fix beads super-plan-goq.34 to .44.
   - Each one sits on its own unmerged branch `task-super-plan-goq.<n>` with its bead still open. Two of them (.38 and .42) are not based on the current tip.
   - So every one of code roast round 1's 17 confirmed findings is still live on the branch.
2. **The run-block size cut overflows its own cap with multibyte text.** This is in `hooks/session-start-runblock` (the no-newline branch of the cut) and the same line in `hooks/session-start-codex`.
   - The cut runs `iconv -c … || printf '%s' "$cut"`. When the cut ends inside a multibyte character, iconv prints the valid prefix and then exits 1. The `||` then appends the raw cut as well.
   - I reproduced it: "x" followed by 5000 "é" comes out as 18,999 bytes. That breaks the spec's rule (§C) that every `additionalContext` stays under 10,000 characters.
3. **`report-verdict` picks the report kind by the first matching recogniser in a fixed order, not by where the line sits in the file.**
   - Any `Status: <TOKEN>` line anywhere in a final review, even an indented quote of a task report, makes the file a `task-report`. The verdict then becomes that token and the Must-fix items are dropped.
   - I checked a probe file against both the tip and `task-super-plan-goq.36`: both print `verdict: DONE_WITH_CONCERNS` and `kind: task-report`. The goq.36 fix does not cover this.
4. **New, not covered by any fix bead: the read rule contradicts the fix loop's key files.**
   - super-auto I8 says roast reports are read only through `report-verdict`.
   - But super-auto Phase 5 Steps 1 and 2 must write the step-back keys file and the scope keys file from *every* confirmed finding of every severity. The scope filter's `{{CONFIRMED_FINDINGS}}` needs the same findings.
   - `report-verdict`'s roast recogniser emits only `[Blocking]` entries. Run against this run's own `…-roast-pr-1.md` (17 Should-fix/Nit findings), it prints `verdict: Should-fix (17 confirmed)` and **zero items**.
   - Final-review items are also capped: 15 Must-fix items, plus 10 Untested items on the goq.36 branch, with `+N more` for the rest. Any key past the cap cannot be built without reading the body.
   - Under the new rules the orchestrator either breaks I8 or writes incomplete key files, and then `step-back-check` / `scope-dispositions` reject valid output. The only reason this run did not hit it is that it ran the old installed skill version (`6.4.2-alepar5.3`).
5. **Two fixes interact (my inference).**
   - Interaction 1: the keepalive wording from goq.10 says each wake re-runs "§Pre-flight step 4's register command", which has no `--epic` or `--ledger`. `run-marker register` (goq.2) rewrites the whole marker. So every 45-minute wake during phase 3 blanks `epic` and `ledger`, and later re-injects lose the ledger, bead and in-flight sections. goq.39 (unmerged) is what makes this work.
   - Interaction 2: `run-digest` exits 1 on a ledger with no Task lines (`set -e`/`pipefail` around the `grep -v`). The state entry then falls back to "Run state unavailable" at the start of every coding phase. goq.38 (unmerged) fixes it.
6. **Minor deviations, fine to defer.**
   - The card hook entry runs `run-digest --part card` instead of printing the static card directly (spec §A2); the fallback covers it.
   - `run-digest`'s shared source deadline is 3 s, not the spec's 4 s (each source 3 s).
   - A crashed standalone super-code leaves its marker live for up to 14 days (its ledger still exists). The cwd fallback can then hand a later session in that worktree a stale run block. The spec accepts this through the age bound.

## Step 2: ledger triage

- **The fix-loop re-entry landed nothing.**
  - The ledger records `Merge: super-plan-goq.42 … → held: integration worktree … not on super-auto/coordinator-subagent-compaction (detached at d4ab8afb)`. The worktree's git history shows the fix-loop commits (`1f7fd432`, `10c1d730`, `d4ab8afb`) were made on a detached HEAD and re-attached at 01:53.
  - The re-entry's Metrics lines (`merges 20`, `review clean 20`) are the first invocation's numbers. Read them as "0 new landings", not as fix-loop progress.
  - Task 25 (goq.38) shows `fix pass FIXED` but never merged.
  - Task 30 (goq.43) is `pending retry` on blocker super-plan-4wz, which is defect 2 above, confirmed by its triage.
- **Recurring minor / Recurring blocker lines:** none.
- **Parked lines:** none.
- **BLOCKED-AUTH lines:** none.
- **One Human action is outstanding:** the Codex live checks (goq.1).
- **Minors that were misgraded and are really must-fix:**
  - goq.4 `[recogniser-order-shadowing]`: a known product defect that silently drops findings (defect 3 above).
  - goq.20 `[known-failing-test]`: `test-run-profile.sh` fails at HEAD (I confirmed it); goq.44, unmerged, fixes it.
  - goq.6 `[subagent-key-overreach]`: `agent_type` counts as a subagent, so a main session started with `--agent` loses the re-inject. goq.35 (unmerged) fixes it.
  - goq.13 `[silent-degrade]`: on a null stub the handoff file may not exist, yet `reviewPath` is returned. goq.37 (unmerged) fixes it.

## Verdict
not ready (the 11 round-1 fix beads never merged because the integration worktree was detached; the branch has a failing release-checklist test, a run-block cut that overflows the 10K cap, the report-verdict recogniser-order defect, and an uncovered contradiction between the I8 read rule and the Phase 5 key files; no full-suite sweep has run)

## Must fix before landing
1. **Land super-plan-goq.34 to .44** with the integration worktree on its branch.
   - .38 and .42 need a rebase onto `d4ab8afb`.
   - Re-dispatch goq.43 with the triage clarification from super-plan-4wz: replace the iconv line in both entry scripts with `*) fixed=$(…iconv -c 2>/dev/null); [ -n "$fixed" ] && cut="$fixed" ;;`.
   - Together these beads cover:
     - run-profile label classification;
     - dispatch-text final-review parity: today the ordinary-mode final review is told "no sweep result", and has no unreviewed list or stub mode;
     - child detection (`agent_type`; Codex children reached through the cwd fallback; the MAINTENANCE.md claim);
     - the report format and parsing, including Untested items;
     - the `reviewPath` contract;
     - `run-digest`'s exit 1;
     - `run-marker register` dropping fields;
     - the plan-rest split race and the exit-4 case;
     - `assembled-size` exit 3 capping a review whose inputs fit;
     - the context-preflight settings layers;
     - a test for the size cut.
2. **The run-block cut overflow** (`hooks/session-start-runblock`, `hooks/session-start-codex`): 18,999 bytes against the 10,000-character cap. This is goq.43, still pending retry.
3. **`report-verdict` recogniser order** (`skills/super-code/scripts/report-verdict`, the `status_re` grep over the whole file, which wins first): a quoted or indented `Status:` line in a final review or roast report hijacks the kind. Anchor task-report detection to the report's own status line, for example the first few lines or column 0, or choose the recogniser by the file's heading structure. Add a final-review fixture that quotes a status line.
4. **I8 versus the Phase 5 key files** (`skills/super-auto/SKILL.md` I8 and §Phase 5 Steps 1 and 2; `report-verdict`'s roast recogniser and item caps): give the orchestrator a sanctioned, uncapped way to extract keys without reading the body. Two options: a `report-verdict --keys` mode (every `- [SEV] <location>` key under `## Confirmed findings`, plus every final-review Must-fix and Untested item, with no cap), or an explicit I8 carve-out naming the extraction command. Pin it with a test against this run's real roast report.

## Untested scope
- **Full suite:** none run. The `deferSweep` sweep belongs to the caller. My spot runs are the six in the table at the top.
- **Codex re-inject is unverified live in every respect.** Status: `unverified (source)`, with the Human action from goq.1 outstanding. That covers:
  - the stdin and stdout shape;
  - whether stdin `session_id` equals `$CODEX_THREAD_ID`;
  - whether `additionalContextLimit: 6000` applies, and in what unit, against a block of up to 17,500 bytes;
  - whether `${PLUGIN_ROOT}` is expanded;
  - whether `plugin.json` accepts `hooks` as a path;
  - how far a malformed `hooks` value reaches;
  - whether the trust hash stays stable.
- **Claude Code facts not observed:**
  - whether idle compaction fires SessionStart with `compact`;
  - whether subagent or Workflow-agent compaction fires the hook, and with which fields;
  - the 10K cap itself, which was never exercised live.
- **Tests not measured or not runnable here:**
  - `tests/skill-scripts/test-bash-invocation.sh` was not completed in goq.3 (it leaked processes), .5, .11 and .13.
  - `tests/codex/test-package-codex-plugin.sh` cannot run in a linked worktree.
  - `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh` failed once (flaky, cause not identified).
  - `tests/hooks/test-reinject-smoke.sh` exits 0 and skips the Codex half when node, jq, zip or unzip is missing.
- **Covered only by simulated replay-harness scenarios, never on a real tracker:**
  - the oversized split (no dryRun fixture has an `oversized` entry);
  - the split final review (cluster, seam and stub modes);
  - the recorded counts 40/29/30/28 were not re-checked by the task reviewer, though the harness passes as a whole.
- **Live compaction checks and the Codex profiling run** are post-merge follow-ons in the spec.

## Deferred OK
- goq.3: the run-profile Codex tail window is fixed at 256 KB; the unreadable-root case is untested.
- goq.2: `get` step 3 does not refuse a fallback marker whose own worktree is a task worktree. This is an unusual layout.
- goq.8: the drafter's closing line sits mid-section.
- goq.18: `set -e` relies on guarded probes.
- goq.4: the loose `Verdict` regex. This is tightened by goq.36.
- goq.15: TDD order not followed. Also, after an exit-5 partial split, dependents keep `blocked-by` lines pointing at closed children; harmless, since closed blockers do not block.
- goq.6 and goq.5: redundant test setup, no RED runs, stub-only coverage (superseded by the goq.19 smoke test).
- goq.10: the ledger path can't be confirmed from the diff alone; it matches the existing convention.
- goq.7: the limit unit is unconfirmed. This belongs to the Codex live verification under Untested scope.
- goq.19: loose timing bound; packaging from a clone.
- goq.12 and goq.11: template style drift; `assemblePrompt` is now wired; the check-kind wording.
- goq.13: the seam reviewer runs with zero clusters; the seam gets only existing cluster files.
- goq.16: rows depending on a split original become opaque; RED step skipped.
- goq.20: the worktree environment failure in `test-package-codex-plugin.sh`; consider `-e` in place of `-d .git`.
- My own minor deviations from Step 1, item 6 (the card entry running `run-digest`, the 3 s deadline, the 14-day stale standalone marker).