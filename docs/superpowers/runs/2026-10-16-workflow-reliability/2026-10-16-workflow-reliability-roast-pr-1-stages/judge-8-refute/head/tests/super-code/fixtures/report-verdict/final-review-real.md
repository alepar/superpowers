**Verdict: not ready.** One test is known to fail (test-run-profile.sh), and it is tracked by a bead outside the epic. Codex child agents may also get the coordinator's card after compaction. The full-suite sweep was deferred to the caller, so this branch has no full-suite measurement yet and must not be treated as tested.

## Step 1: own review against the spec

Every spec section, A1 to A6, B1 to B5 and C, has an implementation and a test. I ran a few targeted checks, which is not a sweep:
- These passed: `test-run-block.sh`, `test-session-start.sh`, `test-dispatch-text.sh`, `test-prompt-text-fresh-rounds.sh`, `test-run-marker.sh`, `test-run-digest.sh` and `test-bash-invocation.sh` (250 s).
- The replay harness passed 1736/0.
- `tests/super-code/test-run-profile.sh` fails: `coordinator label kinds are all classified (missing: assemble close-split split)`.

Problems that only show up once all the tasks are merged:

1. **The run block can reach agents that are not the coordinator, through the cwd fallback.**
   - `run-marker get` step 2 matches "the newest live store marker whose worktree contains cwd".
   - The Codex SessionStart input has no `agent_id` (additionalProperties false, per `codex-hook-shapes.md` §8). So `rb_is_subagent`'s `parent_thread_id`/`thread_spawn` keys never fire on Codex, which contradicts `MAINTENANCE.md`.
   - A Codex child thread runs with the coordinator's cwd (the run or integration worktree, not a task worktree). If such a child compacts, its own `session_id` misses the store and the cwd fallback matches.
   - The child then gets the card, whose first line is "You coordinate a super-code or super-auto run … Continue from them". An implementer or final reviewer could then start acting as the coordinator.
   - The same applies on Claude Code to any other non-subagent session opened inside the run worktree.
   - The spike's own A3 conclusion was "rely on the marker lookup … emit nothing when no live marker matches". The cwd fallback goes against that.
   - Firing on a child's compaction is unverified, so this is plausible rather than confirmed.
2. **Ordinary-subagent mode loses the sweep result in the final review.** `dispatch-text final-review --mode single` passes `sweepSummary=null` and `metrics=[]`. The reviewer is told "No sweep result is available" even after a standalone run's sweep has run, and the Metrics lines are dropped.
3. **`dispatch-text final-review --mode seam --clusters N` cannot mark clusters as unreviewed.** It lists cluster files 1..N whether or not each was reviewed or fits the window, and has no way to pass the unreviewed list. There is also no `stub` kind, although `coordinator-subagents.md` names a `final-review:stub` dispatch. Ordinary mode cannot reproduce the Workflow's verdict combination.
4. **`reviewPath` can point at a file that does not exist.** It is returned whenever work landed, including when the single review comes back null (`FINAL REVIEW UNAVAILABLE`). super-auto then runs `report-verdict <reviewPath>`, which exits 2 on a missing file, and nothing says how to handle that. The spec says the file always exists.
5. **A good-sized input can be forced to `not ready`.** In `coordinator.js` Finish, `asm.exit === 3` always selects capped mode, even with `fits: yes`. Since the final-review profile always asks for clusters, a bad clustering of inputs that fit gets the capped verdict. The spec ties capping to `fits: no`.
6. **The final-review threshold may be too high.** `context-preflight`'s Claude reader gives a role 1M when the session settings carry `opus[1m]`, and Workflow agents are dispatched as `opus`. If those agents actually get 200K, the threshold becomes 400K against a 200K reviewer. It also ignores `config.models`.
7. **Codex hook command depends on exec bits.** It runs `run-hook.cmd` directly, without `bash`, which goes against the "invoke through bash" constraint. The archive pins modes, so this is low risk.
8. **Doc drift in `coordinator-workflow.md`.** The replay-count table shows the size-switch row and the CURRENT row with the same counts (48/19/23), and the "size-switch batch's 47 is superseded" sentence contradicts them.

## Step 2: ledger triage

- **Known failing test, recorded as a minor (goq.20 `[known-failing-test]`).** That grading is wrong; it is a must-fix. Its tracking bead, `super-plan-xsa`, is open, labelled only `blocker`, with no parent and no `sp:super-plan-goq` label. It sits outside the epic tree, which was closed with it still open.
- **Recurring classes.** The ledger has no `Recurring` lines, but two signatures each span three or more tasks:
  - **TDD RED step not recorded** (goq.5, .6, .15, .16). A process smell, not a product defect.
  - **Verification implementers left unfinished** (goq.3, .5, .11, .13: `test-bash-invocation.sh` incomplete or timed out; goq.16: dryRun counts not re-checked). Cause: a 250 s lint test that is longer than implementers wait. I ran it and it passes, and the replay harness passes.
- **Flaky test** (`test-sync-to-codex-plugin.sh`, goq.20): unattributed; needs a look but does not block.
- **`[unit-unconfirmed-limit]`, `[codex-live-unverified]`, `[unverified-claim]`:** untested scope, listed below.
- **Ledger counts:** no parked findings, no fix passes and no BLOCKED-AUTH lines. The Metrics are consistent: 20 merges and 20 completions.

## Verdict
not ready (known-failing `test-run-profile.sh`, tracked off-epic; coordinator card can reach non-coordinator Codex children; no full-suite measurement exists yet)

## Must fix before landing
1. **The failing test, `tests/super-code/test-run-profile.sh`.** `run-profile.mjs` has no kind for the `assemble`, `split` and `close-split` labels.
   - Its bead `super-plan-xsa` is outside the epic (`[Must-fix] bead super-plan-xsa`). File it under the epic per I3.
   - **This needs your decision:** the epic limits changes to `run-profile.mjs` to `--in-flight`. Either allow three `case` entries outside it, or hold this branch until the context-pass branch lands. The new test is in the release checklist, so a release cannot go out while it fails.
2. **Stop the run block from reaching agents that aren't the coordinator.** The `--cwd` fallback in `run-marker get` (`skills/super-code/scripts/run-marker`) plus the opening line of `coordinator-card.md`. At minimum:
   - make the card's first line conditional: "if you were dispatched as a child agent, ignore this block";
   - or keep the cwd fallback out of the Codex entry until a live check confirms whether `session_id` equals `$CODEX_THREAD_ID`;
   - and correct `MAINTENANCE.md`'s claim that `parent_thread_id`/`thread_spawn` identify Codex children.
3. **Pass the sweep result to the ordinary-mode final review.** `dispatch-text final-review` should take `--sweep`/`--metrics` (or read the `Sweep:`/`Metrics:` lines from the ledger) so the reviewer is not told "no sweep" after a sweep ran.

## Untested scope
- **No full-suite sweep** of this branch has run.
- **Everything about the Codex hook is unverified (source only, no live run):**
  - the stdin and stdout shapes;
  - `session_id` versus `$CODEX_THREAD_ID`;
  - whether `additionalContextLimit` is honoured, and its unit;
  - trust-hash stability;
  - the path form of `plugin.json` `hooks`, and whether `hooks/hooks.json` is still auto-discovered next to it in git-marketplace installs;
  - whether a child's compaction fires SessionStart.
  - The Codex binary is now 0.163.0; the spike read 0.162.1. Its strings do include `PLUGIN_ROOT` expansion.
- **On Claude Code:**
  - whether idle compaction fires the hook;
  - whether a Workflow or subagent's own compaction fires the hook;
  - whether `run_in_background` keepalive resets the idle timer;
  - Workflow agents' real context window compared with what `context-preflight` reports.
- **The split final-review path** (cluster, seam and stub) is covered only by the replay harness's canned scenarios. No live assembler has produced `clusters.json`.
- **`split-oversized`** filing against a real `bd` graph beyond the fixtures.

## Deferred OK
- **Hook and digest edge cases:**
  - `rb_is_subagent` treats `agent_type` as a subagent, which silences a main session started with `--agent`;
  - `run-digest` counts no `parked` state.
- **Final-review edge cases:**
  - the seam reviewer runs with zero clusters when none fit;
  - a null stub only logs;
  - exit 3 with `fits: yes` forces the capped verdict;
  - `reviewPath` is returned after a null single review;
  - `dispatch-text` has no seam unreviewed list and no stub kind.
- **Recogniser and parser details:**
  - `report-verdict`'s loose `Verdict` match;
  - its first-match order (task-report wins);
  - the 256 KB Codex tail window in `run-profile` `--in-flight`.
- **Partial split rewire:** a step-2 failure leaves extra edges on the dependents, but they stay blocked by the original, so it is harmless.
- **Tests and docs:**
  - Codex packaging and its test fail in linked worktrees, a pre-existing issue (the release runs on clean `main`);
  - the smoke test silently skips when tools are missing;
  - a loose timing bound;
  - redundant test setup;
  - the assembler template is not fenced;
  - the drafter's closing bullet sits mid-section;
  - the replay-count doc drift (item 8 above);
  - the `context-preflight` set -e robustness note.
- **The two process classes** (RED step not recorded; long lint test left unfinished): fix the pipeline, not this branch.

The review package is at `/Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/.superpowers/sdd/super-plan-goq-plan/review-b0ae5c81..81831222.diff`, and the ledger at `/Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/.superpowers/sdd/super-plan-goq-plan/progress.md`.