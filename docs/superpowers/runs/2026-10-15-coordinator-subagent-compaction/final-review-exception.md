## Verdict

not ready (the read rule I8 still contradicts the fix loop's key files, an open finding from the earlier blocked final review that no fix bead picked up; the Codex `plugin.json` hooks form has never been checked against a real Codex, and landing triggers a release; no full-suite sweep of this branch has run)

The full-suite sweep is deferred to the caller, so this branch has no full-suite measurement yet and must not be read as tested. To check particular claims I ran only `tests/super-code/test-run-profile.sh` (it passes) and a scratch-store probe of `run-marker` → `session-start-runblock` / `session-start-codex` (JSON shapes, the subagent refusal and Codex own-only refusal all behave as specified).

**Step 1, my own view (diff against the spec):**
- **I8 versus Phase 5 keys (composes wrong once every task is merged).**
  - I8 in `skills/super-auto/SKILL.md:28` says roast reports and final reviews are read only through `report-verdict`.
  - Phase 5 (`SKILL.md:244`, `:267`, `:292`) needs every confirmed finding of every severity for the step-back keys file and the scope keys file.
  - `report-verdict`'s roast recogniser emits only `[Blocking]` items. On this run's own `…-roast-pr-1.md` (17 Should-fix findings) it prints `verdict: Should-fix (17 confirmed)` and zero items.
  - Final-review Must-fix items stop at 15 (plus 10 Untested), then `+N more`. In split mode the seam reviewer carries every cluster's must-fix items forward, so 15 is easy to exceed.
  - Result: an orchestrator that obeys I8 writes incomplete keys files, and `step-back-check` / `scope-dispositions` then reject valid output. This was item 4 of `.superpowers/sdd/super-plan-goq-plan/final-review-fixloop-r1-blocked.md`. The `finalReviewException` re-entry filed only the `.gitignore`, card-guard and recogniser-order beads, so this one is still live.
- **reviewPath null is unhandled downstream.** super-auto `SKILL.md:292`, `:317` and `report-prompt.md:18` run `report-verdict <reviewPath>` with no rule for null. Null happens on a null single review, or a null seam review plus a null stub. `report-verdict` then exits 2.
- **The stub's cluster paths are read as Must-fix items.** `finalReviewStubPrompt` (`coordinator.js` around line 2272) writes a `Cluster files:` line plus bullets under `## Must fix before landing`. `report-verdict` does not treat that line as a section boundary, so the paths become Must-fix items that super-auto then keys. Roast round 2 punch-listed this as a Nit.
- **Codex re-inject is wired entirely on unverified facts.** These are:
  - the `"hooks": "./hooks/hooks-codex.json"` path form;
  - `${PLUGIN_ROOT}` expansion (not even among the spike's 8 questions);
  - the `additionalContextLimit` unit;
  - whether stdin `session_id` equals `$CODEX_THREAD_ID`. If it doesn't, the `--own-only` design means Codex never re-injects (documented in MAINTENANCE.md).
  - The blast radius of a malformed hooks value (hooks only, or the whole plugin including skills) is unknown. run.md's approvals say landing goes straight to a major release.
- **The Claude cwd store scan reaches sessions that are not the coordinator.** Any session whose cwd is inside the integration worktree and whose payload has no `agent_id` gets "You coordinate a super-code run". My probe showed it for a different session id: the card entry emitted 6,665 bytes. Examples are a human's second session in that worktree, or a Workflow agent whose payload lacks `agent_id`. The spec (A1) mandates this, and the card's ignore line mitigates it only for children.
- **Small spec deviations, acceptable.**
  - The card entry runs `run-digest --part card` rather than printing the file directly (it falls back to the file).
  - The shared source deadline is 3 s, not 4 s.
  - The global constraint was breached: `run-profile.mjs` `stageOf` gained three cases outside `--in-flight` (recorded as run.md `decision-run-profile-cases`).

**Step 2, ledger triage:**
- **Recurring minor `[missing-edge-case-test]` (×3, across .42, .35, .43).** The class is brief-named negative and edge cases shipping untested:
  - `context-preflight` settings-layer precedence;
  - the card's ignore line;
  - the iconv-empty fallback in both hook entries.
- **An unclustered class, bigger.** Six tasks recorded no RED run (`[tdd-deviation]`, `[missing-red-run]`, `[tdd-not-followed]`, `[red-step-skipped]`, `[red-not-verified]`, `[no-red-first]`). Seven tasks did not complete or show test runs (`[test-hygiene]`, `[unverified-invocation-check]`, `[unrun-lint-test]`, `[unmeasured-test]`, `[missing-targeted-test-run]`, `[stale-test-evidence]`, `[missing-test-evidence]`).
  - This is a pipeline defect: the recurrence detector keys on exact tags, so it never clustered these.
  - `test-bash-invocation.sh` keeps being skipped or timing out. In task 3 it leaked processes.
- **`[known-failing-test]` (Task 20, test-run-profile.sh):** resolved. Bead super-plan-xsa is closed as superseded, and I ran the test: it passes.
- **`[unguarded-null-consumer]` (Task 24):** still open. It is Must-fix item 2 below.
- **`[silent-skip]` (Task 19):** the smoke prints `[SKIP]` and exits 0, so it is visible rather than silent. Deferred, but the sweep reader must check for it.
- No parked, BLOCKED-AUTH or recurring-blocker lines. The Metrics lines are consistent (35 landed = 35 completed).

## Must fix before landing

- I8 versus the Phase 5 keys files (`skills/super-auto/SKILL.md` I8 at line 28, Phase 5 steps 1 and 2 at lines 244 and 267, Final-review items at line 292; `skills/super-code/scripts/report-verdict`): give the orchestrator an uncapped way to extract keys without reading the body. Two options:
  - a `report-verdict --keys` mode: every `- [SEV] <location>` under `## Confirmed findings`, plus every final-review Must-fix and Untested item, with no cap;
  - an explicit I8 carve-out naming the extraction command.
  - Pin it with a test against `…-roast-pr-1.md`. Without this, a compliant orchestrator drops every non-Blocking finding, and every Must-fix item past the 15th, from the fix loop.
- Null `reviewPath` (super-auto `SKILL.md:292`, `:317`, `report-prompt.md:18`): state that a null `reviewPath` means no review file exists. Route the `FINAL REVIEW UNAVAILABLE` verdict as a `[Must-fix] untested: whole-epic review` key instead of calling `report-verdict` on null.
- Before the release this landing triggers: install the Codex package in a scratch `CODEX_HOME` (no login needed for this) and confirm that:
  - `"hooks": "./hooks/hooks-codex.json"` parses;
  - skills still load;
  - `${PLUGIN_ROOT}` expands in the hook command.
  - MAINTENANCE.md itself says "validate against Codex before each release". A bad value may disable the whole plugin for every Codex user.
- Get a passing full-suite sweep that includes `tests/skill-scripts/test-bash-invocation.sh`. No task completed that test on this branch, it timed out and leaked processes in task 3, and nine new scripts are invoked through `bash`.

## Untested scope

- No full-suite sweep: it is deferred to the caller and the branch is unmeasured. Check the sweep output for `[SKIP]` lines from `tests/hooks/test-reinject-smoke.sh` (zip, unzip, jq or node missing) and from `test-package-codex-plugin.sh`, which cannot run in a linked worktree.
- Codex re-inject has never run live. Unchecked:
  - the stdin and stdout shapes;
  - `session_id` == `$CODEX_THREAD_ID` (if they differ, no re-inject);
  - the `additionalContextLimit` unit;
  - trust-hash stability;
  - whether a child-thread compaction fires the hook;
  - `wait_agent` waits.
  - The goq.1 Human action is still outstanding.
- Claude Code, not checked live:
  - the 10,000-character cap with two compact entries;
  - subagent and Workflow-agent compaction payloads, and whether they carry `agent_id`;
  - idle compaction firing `source: compact`;
  - whether the `sleep 2700` keepalive actually prevents idle compaction.
- `context-preflight` assumes an `opus` Workflow agent inherits the session's `[1m]` window. If it doesn't, `contextWindows.finalReview` = 1M sets a 400K threshold for a 200K reviewer, and a single-mode review overflows.
- Covered only by canned replay scenarios, never with a real assembler or tracker:
  - split final review (cluster, seam, stub);
  - real `clusters.json` output;
  - the roast-code assembler pre-step;
  - the history/assess assembler route;
  - `split-oversized` against a real `bd` graph;
  - the `run-profile --in-flight` Codex path against real rollouts.
- Brief-named edge cases with no test:
  - `context-preflight` layer precedence (the goq.42 fix);
  - the card's ignore line;
  - the iconv-empty fallback in `session-start-runblock` and `session-start-codex`.
- `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh` had one unexplained failure (it then passed 4 of 4 reruns).
- The spec's live checks (forced compaction on both harnesses, a profiled Codex run) are post-merge follow-ons.

## Deferred OK

- The Claude cwd store-scan fallback reaching non-coordinator sessions in the same worktree. The spec mandates it and the card's ignore line mitigates it. Revisit after the live compaction check, since Claude's `session_id` is proven to equal `$CLAUDE_CODE_SESSION_ID`, which makes the scan mostly unnecessary there.
- Stub cluster paths keyed as Must-fix (punch-listed Nit). Use a boundary heading for `Cluster files:` when convenient.
- `run-profile.mjs` `stageOf` cases outside `--in-flight`: a recorded autonomous decision, three lines, easy to merge with the context-pass branch.
- The card entry runs `run-digest --part card` (falls back to the static card); the shared deadline is 3 s instead of 4 s.
- `[partial-rewire-on-failure]` (split-oversized exit 5): leftover child edges are closed by `close-split`; the original's edges keep readiness correct.
- `[unreviewed-edge-case]` (fallback marker whose worktree is itself a task worktree): no task-worktree session ever registers.
- `[stale-ledger-line]` (`lastSweep` in a reused ledger): ordinary-mode Finish appends `Sweep:` before `final-review`.
- `[wasted-dispatch]` and `[silent-degrade]` in Finish split mode: the verdict already reads not ready and the log records it.
- `[fixed-tail-window]`, `[narrow-error-coverage]`, `[exit-code-robustness]`, `[loose-marker-match]`, `[recogniser-order-shadowing]` (now covered by the `## Verdict`-first rule), `[subagent-key-overreach]` (`agent_type` removed), `[unit-unconfirmed-limit]` (documented), `[opaque-dependent-readiness]`, `[doc-table-overlap]`, `[doc-formatting]`, `[long-lines]`, `[duplicated-branch]`, `[loose-heading-match]`, `[template-style-drift]`, `[doc-placement]`, `[doc-drift]`, `[test-layout-deviation]`, `[redundant-test-setup]`, `[loose-timing-bound]`, `[worktree-package-fallback]`, `[worktree-env-failure]`: cosmetic, or robustness with no failure path today.

Files: `/Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/skills/super-auto/SKILL.md`, `/Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/skills/super-auto/report-prompt.md`, `/Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/skills/super-code/scripts/report-verdict`, `/Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/skills/super-code/coordinator.js`, `/Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/.codex-plugin/plugin.json`, `/Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/hooks/hooks-codex.json`, `/Users/alepar/AleCode/superpowers/.worktrees/super-auto-coordinator-subagent-compaction/.superpowers/sdd/super-plan-goq-plan/final-review-fixloop-r1-blocked.md`