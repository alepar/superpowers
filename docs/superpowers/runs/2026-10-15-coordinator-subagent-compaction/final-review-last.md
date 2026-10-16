Final whole-epic review of super-auto/coordinator-subagent-compaction (epic super-plan-goq), at tip 251b07dd (fork point b0ae5c81, 100 commits, 111 files)

The full-suite sweep is deferred to the caller and has not run, so no full-suite measurement of this branch exists yet and it must not be treated as tested. I ran every test on the AGENTS.md release checklist at this tip as spot evidence. That list is not the caller's sweep. Every test passed:
- `node tests/super-code/replay-harness.mjs`: 1770 passed, 0 failed.
- These passed in the worktree: run-marker, run-digest, report-verdict, run-block, dispatch-text, split-oversized, assembled-size, context-preflight, task-surface, marketplace-manifest, prompt-text-fresh-rounds, session-start and run-profile, plus the super-design, super-roast and super-auto script tests.
- These passed in a scratch clone of the branch:
  - `test-package-codex-plugin.sh`, which cannot run in a linked worktree because of an existing `-d .git` check;
  - `test-sync-to-codex-plugin.sh`;
  - `test-reinject-smoke.sh`: 59 PASS, 0 SKIP;
  - `test-contract-lint.sh`;
  - `test-run-profile-in-flight.sh`;
  - `test-bash-invocation.sh`: 221 s, no processes left behind.

I also installed the branch into a scratch `CODEX_HOME` with Codex 0.163.0. No login was needed and nothing under `~/.codex` was touched. I queried the app-server:
- The path-form `"hooks": "./hooks/hooks-codex.json"` parses with no warnings or errors.
- The plugin is installed and enabled, and its 24 skills load.
- Exactly one hook is registered: the compact-matcher `session-start-codex`. `hooks/hooks.json` is not auto-discovered next to it.
- `${PLUGIN_ROOT}` expands to the installed plugin root.
- `additionalContextLimit: 6000` is accepted, and `trustStatus` is `untrusted`, which is the accepted trust-prompt cost.

That settles the previous review's must-fix item about checking the Codex manifest before release.

## Step 1: my own review against the spec

Every spec section (A1–A6, B1–B6, C) has an implementation and a test. All 36 task branches (.1–.20 and .34–.49) are merged, and no bead under `sp:super-plan-goq` is open. Every must-fix item from the three earlier final reviews is resolved at this tip:
- the multibyte size cut now stays at 9,499 bytes and valid UTF-8;
- `report-verdict` puts the `## Verdict` heading first and has an uncapped `--keys` mode, which gives 17 keys on `roast-pr-1`;
- a null `reviewPath` is routed in super-auto and in report-prompt;
- the Codex entry uses `--own-only`, and the card carries a line telling child agents to ignore it;
- `test-run-profile.sh` passes;
- dispatch-text's final-review modes now match the Workflow's.

New findings, none of which blocks landing:
1. **The run block has no paths.**
   - `run-digest` prints the skill, epic, phase and runTag, but not the marker's `run_md`, `ledger` or `worktree`.
   - The card tells the coordinator to re-read `run.md`, run `ledger-digest <ledger>`, and re-run "the same register command".
   - On Codex, where the skill's loop is lost on compaction, the coordinator has to go looking for both files.
   - It meets the spec (A4 lists only the header fields), and the fix is three lines in `render()`.
2. **A null seam review composes badly with `--keys`.**
   - `finalReviewStubPrompt` puts a `Cluster files:` line and its path bullets under `## Must fix before landing`.
   - I confirmed that `report-verdict --keys` emits each cluster path as `[Must-fix] /…/cluster-N.md`.
   - The clusters' own must-fix items are never carried into `final-review-<runTag>.md`, so super-auto keys path bullets instead of the actual findings.
   - It is a rare path (the seam dispatch returns null after retries), and the verdict still reads not ready.
3. **The Claude Code cwd store scan (run-marker `get` step 2) can reach sessions that are not the coordinator.**
   - Any top-level session inside the run worktree whose payload has no `agent_id` gets "You coordinate a … run".
   - It also happens for up to 14 days after a stalled run.
   - The spec mandates this (A1). The card's ignore line covers only dispatched children.
   - The spike verified that `session_id` equals `$CLAUDE_CODE_SESSION_ID`, so on Claude Code the scan adds risk and little else. This needs your decision.
4. **`context-preflight`'s Claude reader contradicts its own fix text.**
   - It gives an `opus`/`sonnet` role a 1M window when the session model is `opus[1m]`.
   - Its own warning then tells you to set `ANTHROPIC_DEFAULT_OPUS_MODEL=<model>[1m]`.
   - If Workflow `opus` agents actually run at 200K, the final-review threshold becomes 400K against a 200K reviewer.
5. **`planner-prompt.md`'s `oversized` return bullet sits after the closing fence of the prompt block.**
   - The dispatch says "do what its prompt block says".
   - Step 7 inside the block and the dispatch text already cover it, so this is cosmetic.
6. **The final review's assembler-failure path is thinner than spec B2.**
   - It writes `Final review: single (assembler unavailable)` but never records `asm.cause`.
   - Assembler exit 4 with `fits: no` runs uncapped.
   - These are minor gaps against B2.

## Step 2: ledger triage

- **`Recurring minor: [missing-edge-case-test]` (×3: goq.42, goq.35, goq.43).** The class: fix-bead tests are narrower than the edge cases their briefs named, and task reviewers grade that as minor. Three cases have no test:
  - `context-preflight` settings-layer precedence;
  - the card's child-ignore line, which no test pins even though it is the only guard for children (and finding 3);
  - the iconv-empty fallback in both hook entries.
- **An unclustered process class.** Six tasks recorded no RED run, and seven did not run or did not show their tests. The recurrence detector keys on exact tags, so it never grouped these. This is a pipeline smell; my run of the full checklist covers this branch.
- **Resolved or moot:**
  - `[known-failing-test]` (goq.20): the test passes now.
  - `[unguarded-null-consumer]` (goq.37): fixed by goq.49.
  - `[recogniser-order-shadowing]` (goq.4): fixed by the `## Verdict`-first rule.
  - `[subagent-key-overreach]` (goq.6): `agent_type` is no longer checked.
  - `[silent-degrade]` (goq.13): `reviewPath` is null when no file was written.
  - `[test-hygiene]` and the leaked processes (goq.3): the test ran clean here.
  - `[flaky-test]` (goq.20): `test-sync-to-codex-plugin.sh` passed here.
- **Other lines:**
  - No parked, BLOCKED-AUTH or `Recurring blocker` lines.
  - The Metrics are consistent: merges 36 = review clean 36, and the one fix pass (goq.38) returned FIXED.
  - The goq.1 Human action is only partly closed. My scratch-home probe answered the parts that need no login; the live compaction parts are still open.

## Verdict
not ready (no full-suite sweep has measured this branch yet; every AGENTS.md release-checklist test passes at 251b07dd in spot runs and nothing else blocks landing)

## Must fix before landing
- none

## Untested scope
- No full-suite sweep has run at the tip. My spot runs covered every AGENTS.md checklist test and are not a substitute for the caller's sweep.
- Codex live compaction is unverified: the stdin and stdout shapes, whether `session_id` equals `$CODEX_THREAD_ID` (if not, Codex never re-injects), whether `additionalContextLimit` 6000 holds a 17,500-byte block, whether a child-thread compaction fires the hook, and trust-hash stability across versions.
- On Claude Code, these were not observed live: whether idle compaction fires SessionStart `compact`, whether Workflow and subagent compaction payloads carry `agent_id`, whether the `sleep 2700` keepalive prevents idle compaction, and the 10,000-character cap with two compact entries.
- `context-preflight` assumes an `opus` Workflow agent inherits the session's `[1m]` window. If it does not, the final-review threshold is 400K against a 200K reviewer.
- These are covered only by canned replay scenarios: the split final review (cluster, seam, stub), a real assembler's `clusters.json`, the roast-code and history/assess assembler steps, `split-oversized` against a real bd graph, and `run-profile --in-flight` against real Codex rollouts.
- Edge cases their briefs named have no test: `context-preflight` layer precedence, the card's child-ignore line, and the iconv-empty fallback in `hooks/session-start-runblock` and `hooks/session-start-codex`.

## Deferred OK
- The run block omits the run.md, ledger and worktree paths. Add them to run-digest's header from the marker fields it already parses; Codex coordinators benefit most.
- The null-seam stub keys cluster paths as Must-fix and drops the cluster findings. Give `Cluster files:` its own heading, or have the stub copy each cluster's Must-fix items.
- The Claude Code cwd store scan reaching non-coordinator sessions is spec-mandated (A1) and needs your decision. Revisit it after the live compaction check.
- `planner-prompt.md`'s `oversized` bullet sits outside the fence (cosmetic). The assembler-failure path does not record `asm.cause`, and exit 4 with `fits: no` runs uncapped.
- `run-profile.mjs` `stageOf` gained three cases outside `--in-flight`. That was an autonomous relaxation of a global constraint (run.md `decision-run-profile-cases`); note it when the context-pass branch merges.
- The Codex hook command executes `run-hook.cmd` directly. The 755 mode is kept in git and in the archive, and the installed hook registered correctly.
- The card entry runs `run-digest --part card` instead of printing the file (it falls back to the file), and the shared source deadline is 3 s rather than 4 s.
- `test-package-codex-plugin.sh` fails in linked worktrees (existing `-d .git` check; `-e` would fix it).
- The process class (no RED runs, test runs not shown) should be fixed in the pipeline's recurrence keying, not on this branch.
- The remaining ledger minors are cosmetic, or harden code with no failure path today: fixed-tail-window, narrow-error-coverage, exit-code-robustness, loose-marker-match, loose-heading-match, duplicated-branch, partial-rewire-on-failure, unreviewed-edge-case, opaque-dependent-readiness, stale-ledger-line, partial-parity-check, wasted-dispatch, spec-deviation, doc-table-overlap, doc-formatting, long-lines, template-style-drift, doc-placement, doc-drift, test-layout-deviation, test-fragility, redundant-test-setup, loose-timing-bound, silent-skip (0 skips in my run), worktree-package-fallback, unit-unconfirmed-limit.

Files referenced:
- /Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/.superpowers/sdd/super-plan-goq-plan/review-b0ae5c81..251b07dd.diff
- /Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/.superpowers/sdd/super-plan-goq-plan/progress.md
- /Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/skills/super-code/scripts/run-digest
- /Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/skills/super-code/coordinator.js
- /Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/skills/super-code/scripts/run-marker
- /Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/skills/super-code/scripts/context-preflight
- /Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/skills/super-code/planner-prompt.md