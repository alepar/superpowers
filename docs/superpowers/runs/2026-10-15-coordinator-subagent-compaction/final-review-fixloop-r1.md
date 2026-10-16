The branch is not ready to land: I found three cheap defects to fix first. The full-suite sweep hasn't run on this branch yet, so it is unmeasured, not green.

**Tests I ran myself (no file changes):** all of these pass.
- The 18 new and touched test scripts in the worktree.
- In a scratch clone: `node tests/super-code/replay-harness.mjs` (1770 passed, 0 failed), `test-package-codex-plugin.sh` (33 checks), `test-bash-invocation.sh`, plus the super-design, super-roast, super-auto and codex-plugin-sync tests.
- `test-package-codex-plugin.sh` refuses to run inside a linked worktree. That check (`scripts/package-codex-plugin.sh:145`) was already there before this branch, which is why I used a clone.
- `test-bash-invocation.sh` takes about 250 seconds. It timed out once at 300 seconds under load, then passed.

**Step 1: problems where tasks meet**

1. **The sandbox fallback marker makes every merge refuse (confirmed).** When `run-marker register` can't write `~/.local/state`, it writes the marker file plus `<worktree>/.superpowers/.gitignore`, containing only `run-marker-*`. That `.gitignore` doesn't ignore itself. In any project that doesn't already git-ignore `.superpowers/` (`sdd-workspace` only ignores `.superpowers/sdd/`), the integration worktree then shows `?? .superpowers/.gitignore`. The merge prompt's pre-merge clean check requires `git status --porcelain --untracked-files=all` to be empty, so every merge refuses.
   - I reproduced it in a scratch repo with an unwritable state directory: the register printed `wrote fallback …` and `git status` showed `?? .superpowers/.gitignore`.
   - The fallback is the expected path for a sandboxed coordinator, such as Codex in workspace-write mode or Claude Code with its sandbox on.
   - Fix options: add `.gitignore` to that file's pattern, put the fallback under `.superpowers/sdd/` (already ignored), or use the git info/exclude file.
   - This repo's own test misses it because this repo ignores `.superpowers/` at the top level.
2. **On Codex, the fallback marker is never read.** `hooks/session-start-codex` resolves by session id only and never passes `--cwd`. Lookup step 3 (the caller's own session-keyed fallback marker) is only reached with `--cwd`. So a sandboxed Codex coordinator writes a marker its own hook can't find, and never gets the run block back after compaction. That is the harness the epic mainly targets (228 compactions measured).
   - The spec (A1/A3) intended the fallback to be found from the hook's `cwd`. The implementation dropped `cwd` to keep the block away from child threads.
   - Step 3 is already keyed by session id, so Codex could use it safely if `run-marker get` skipped only step 2 (newest marker whose worktree contains `cwd`).
   - This needs a human decision. `MAINTENANCE.md` records only the session_id-mismatch gap, not this one.
3. **The coordinator card has no Workflow-mode guard.** The card's Loop section tells the session to "refill from `ready-in-tree`: start every ready task a free slot allows". On Claude Code in Workflow mode, the Workflow script runs that loop. A session that compacts during a Workflow wait (the case this epic targets) gets an instruction that can double-dispatch tasks the Workflow is also running. Nothing in the run-state header says which mechanism is in use. A one-line guard is enough: "while a coordinator Workflow runs, it owns this loop; you wait, watch and keep the keepalive."
4. **`report-verdict` can misread a final review.** The task-report recogniser is tried first and matches any line starting `Status: <TOKEN>`. A final-review file that quotes a task report's status line on its own line would be classified as a task report: verdict `DONE` and no Must-fix items. Final-review files are now how super-auto picks up its Must-fix items (§Final-review items, Phase 6 step 4).
   - I ran it over every roast and step-back report in `docs/superpowers/runs`; all classify correctly today. The trigger is plausible but not yet seen.
   - The ledger graded this minor because the brief mandated the order. Since it is a known defect on the main handoff, I'm treating it as must-fix. Fix: let the exact `## Verdict` heading the final-review prompts require win before the Status line.
5. **Spec deviations that look acceptable:**
   - The card hook entry runs `run-digest --part card` under the watchdog, falling back to the card file. It behaves the same as the spec's direct read.
   - super-auto doesn't re-register at each refill; the keepalive wakes cover it.
   - Task goq.44 changed `stageOf()` in `run-profile.mjs`, outside the `--in-flight`-only constraint. It is two lines, needed to fix `test-run-profile.sh`, but will touch the context-pass branch.
6. **Everything else composes correctly:**
   - `run-marker get` output feeds `run-digest` on stdin.
   - The workspace and runTag paths match between `coordinator.js` and `dispatch-text`.
   - The `split:` / `refused:` / `filed:` lines are parsed in both arrow forms.
   - `ledger-digest` drops the `Context:`, `Surface:`, `Split:` and `Final review:` lines (checked).
   - The `assembled-size` exit and `fits:` combinations route to the right final-review mode, and the replay harness covers all of them.

**Step 2: ledger triage**

- **Recurring cluster:** `[missing-edge-case-test]` appears 3 times across 3 tasks. With its untagged relatives it forms one larger problem in the implementer pipeline:
  - six tasks skipped the failing-test-first (RED) step (goq.15, .6, .5, .16, .38, .41);
  - five entries say a targeted test wasn't run, timed out or is stale, mostly `test-bash-invocation.sh`.

  The causes are tests written after the code, and a lint test so slow (about 250 seconds, from a lines × helper-names grep loop) that implementers skip it. This doesn't block the branch, since everything passes when I run it. The slow test is worth fixing separately.
- **Minors I'm promoting:** goq.4's recogniser-order item (Step 1, point 4).
- **Minors already resolved:** the goq.20 known-failing `test-run-profile.sh` (fixed by goq.44, passes now). The goq.6 `agent_type` overreach (current code checks only `agent_id`). `test-package-codex-plugin.sh` passes in a clone.
- **Parked, BLOCKED-AUTH and Metrics:** no parked lines and no BLOCKED-AUTH lines. The Metrics are consistent (31 merges, 31 clean completions).

## Verdict
not ready (the sandbox fallback marker leaves an untracked `.gitignore` that makes every merge refuse; the Codex hook never reads that fallback; the card lacks a Workflow-mode guard; `report-verdict` can misread a final review; no full-suite sweep has run on this branch)

## Must fix before landing
- `skills/super-code/scripts/run-marker` `cmd_register` fallback: `.superpowers/.gitignore` with only `run-marker-*` leaves `?? .superpowers/.gitignore`, which fails the merge prompt's pre-merge clean check on every merge in projects that don't ignore `.superpowers/`. Make it ignore itself, or move the fallback under `.superpowers/sdd/`, and add a test in a repo without a top-level `.superpowers/` ignore.
- Human decision: `hooks/session-start-codex` drops `--cwd`, so the fallback marker (the sandboxed Codex path) is never resolved and Codex re-inject is dead in that configuration. Either let Codex use lookup step 3 only (session-keyed fallback, skipping step 2's worktree match) or record the gap in `MAINTENANCE.md` and the spec.
- `skills/super-code/coordinator-card.md` Loop section: add a line saying that while a coordinator Workflow runs, it owns the loop and the session only waits, watches and keeps the keepalive. Without it the card tells a compacted Workflow-mode session to dispatch ready tasks itself.
- `skills/super-code/scripts/report-verdict`: an exact `## Verdict` heading (the format the final-review prompts mandate) must win over a stray `Status:` line, so a final review that quotes a task status isn't read as a task report with no Must-fix items. Add a fixture.

## Untested scope
- No full-suite sweep: the sweep was deferred to the caller, so the branch is unmeasured.
- Codex, none of it verified live: the stdin and stdout shapes, `${PLUGIN_ROOT}` expansion, the `plugin.json` `"hooks": "./hooks/hooks-codex.json"` path form (a malformed value could break the whole plugin), the `additionalContextLimit` unit, trust-hash stability, and whether the hook's `session_id` equals `$CODEX_THREAD_ID`. Verify on a live Codex before cutting a release.
- Claude Code: the 10,000-character cap with two separate compact entries was not tried live. Also unverified: subagent and Workflow-agent compaction payloads (whether `agent_id` is present), and idle compaction firing SessionStart with `compact`.
- `context-preflight` assumes an `opus` Workflow agent inherits the session's 1M window. If not, the final-review threshold (400K) can exceed a 200K reviewer.
- The split-mode final review, the assembler's real clustering and output, and the super-auto roast-code assembler step have run only as canned replay or prose, never live.
- Live forced compaction on both harnesses (a spec follow-on).
- Tests that are missing or never observed failing: `context-preflight` settings-layer precedence, the iconv-empty fallback in both hook entries, the card's "ignore if you are a child" line, and the fallback-marker `.gitignore` above. Six tasks never observed their new tests failing first.
- `test-package-codex-plugin.sh` can't run in a linked worktree (an existing check at `package-codex-plugin.sh:145`). It was verified only in a clone.

## Deferred OK
- The `run-profile.mjs` `stageOf` additions (goq.44) go outside the `--in-flight`-only constraint. They are two lines; reconcile them when the context-pass branch lands.
- super-auto reads `reviewPath` through `report-verdict` with no stated handling for null (goq.37). The verdict line already carries `FINAL REVIEW UNAVAILABLE`, but a one-clause note is cheap.
- `dispatch-text` `lastSweep` can pick up a stale `Sweep:` line from a reused ledger in ordinary mode (goq.34). This is unlikely under super-auto, where every invocation defers the sweep.
- Split partial: dependents stay rewired onto closed children (goq.15). Harmless, because they still depend on the original.
- A fallback marker whose recorded worktree is itself a task worktree (goq.2) is an edge case.
- The fixed 256KB tail window for Codex rollouts and the unknown line for missing roots only (goq.3).
- Split-path waste: the seam reviewer runs with zero cluster files, and a null stub only logs (goq.13). Both are recorded and the verdict is still forced to not ready.
- The doc-table overlap in `coordinator-workflow.md` around line 1284, one overlong line, and the assembler template not being in a fence.
- The smoke test skips the Codex half when tools are missing, the 9-second hang bound, and the worktree clone fallback (goq.19).
- `test-sync-to-codex-plugin.sh` failed once and passed four reruns (goq.20). Keep an eye on it.
- The slow `test-bash-invocation.sh` (about 250 seconds) is a pipeline problem to fix separately.