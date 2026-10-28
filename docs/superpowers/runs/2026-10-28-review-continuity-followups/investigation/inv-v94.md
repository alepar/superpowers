# super-plan-v94 investigation: reused task branches vs. current prerequisites

Repo: /Users/alepar/AleCode/superpowers/.worktrees/super-auto-review-continuity-followups (read-only; nothing edited).

## 1. workspaceSetup and its cases

`skills/super-code/coordinator.js:2624-2645` `workspaceSetup(planPath, n, id, worktree, branchName, integrationBranch, briefFile, { parents, reentry, recut })`. It returns prompt TEXT that the implementer runs as step 0 (`implementer-prompt.md:52-60`). Only `implementPrompt` calls it (2647-2660). The ordinary-subagent mode uses the same builder: `scripts/dispatch-text.mjs:113-118` loads coordinator.js and `:566` calls `B.implementPrompt(... { parents, reentry, recut })`. One prompt fix covers both modes. `coordinator-subagents.md:54-67` is prose only (`implement --parents`, `--reentry`, `--recut`).

The cases:
- **stackStep** (2631-2633): when `parents.length`, it runs `git merge --no-ff -m "stack: <p>" task-<p>` once per parent, in order, in the worktree. It merges each parent's current branch tip and never rebases. On a conflict it runs `git merge --abort`, then `remove-task-worktree --discard`; helper exit 0 gives STACK_CONFLICT, any nonzero exit gives SETUP_FAILED and keeps everything. Afterwards base is `git rev-parse HEAD`, and setup reports `stacked true`. Without parents, base is HEAD of the fresh cut.
- **recutStep** (2634-2636): only when `recut` is set, which means `discardFailed.has(id)`. It runs `remove-task-worktree --discard` if either the worktree or the branch exists, and exit 0 then means "treat as NEITHER".
- **NEITHER** (2637-2639): non-reentry runs already-merged and then `git worktree add -b ... <integration>` plus **stackStep**. Reentry runs `bd reopen`, does a fresh cut and implements, with no stackStep.
- **BOTH, non-reentry** (2642), "a restart re-dispatching this task": it reuses the worktree and branch as they are and continues from the earlier committed or uncommitted work. base is the newest first-parent `stack: ` commit, which gives `stacked true`, or else the merge-base with the integration branch. **stackStep is not included. `parents` is never consulted, and nothing checks for ancestry or drift.**
- **BOTH, reentry** (2640-2641): review only. It uses the same base rule plus empty-range and already-merged guards.
- **Branch-only / worktree-only:** the text has no explicit case for either. It names only NEITHER and BOTH (2644: "Check whether ... already exist"). An implementer that finds only one of the two has to improvise, and `implementer-prompt.md:56` says "don't improvise around a failure". That makes SETUP_FAILED likely, which is one plausible, unproven source of a historical SETUP_FAILED.

How the result is handled (1778-1801): SETUP_FAILED is rewritten to BLOCKED ("workspace setup failed before implementation: ...") and goes to the blocker and triage path. STACK_CONFLICT releases the slot, waits for the parents to merge (`parentsMerged`), then calls `runTask(id)` fresh.

## 2. How a retry or resume reaches reuse, and what "prerequisite" means

The current prerequisite is `att.parents = effDeps(row).filter(d => implDone.has(d))` (`startAttempt`, 1649-1657). These are in-tree blockers that are implemented and split but not merged, and they are stacked through their `task-<p>` branch tips. Blockers that have already merged are reached through the integration branch. A reentry attempt has `parents = []`. A fix pass on a parent moves `task-<p>`, and its merge lands a reviewed version on the integration branch.

Paths that reach BOTH while the prerequisite has drifted:
- **RESOLVE retry in the same invocation:** `failAttempt(att, {failure:'blocked', reopen:true})` at 1853 has no discard, so the worktree and branch survive. The retry calls `runTask` again and computes a new `att.parents`. If the first attempt stacked on P's pre-review tip and P has since been fixed or merged, setup reuses the stale `stack: P` content.
- **Restart or resume:** non-terminal ledger lines (`stacked on`, `fix pass`) re-enter from setup (862-863). `pending retry` seeds `pendingRetry` (857/870). A `cancelled` resume line (861) increments a counter only. **`discardFailed` (610) is in memory only and is never rebuilt on resume**, so a cancelled task whose discard did not run or failed before a restart gets BOTH reuse in the next invocation, not a recut. That is the "recut state is invocation-local" gap.
- **Merge stage:** this does not break merging. A stacked merge runs `git rebase --onto <integration> <r.base> <br>` (2837-2840), which drops whatever sits below base. The damage is to implementation and review: the implementer builds on, and the reviewer reviews against, the pre-review parent code.

What the evidence supports, kept separate from what it does not:
- Verified code gap: the BOTH path ignores `parents`, and `discardFailed` is invocation-local.
- Not proven: why mosh-hex.5 hit SETUP_FAILED. In the evidence directory, mosh-hex.5 depends on .1, .3 and .4 (task-tree-r2.json). The local copy has no setup output, no prior refs and no "stale pre-review parent" ledger line (grep found none). triage.json claim 4 reads "Static stale branch reuse gap confirmed; exact incident refs/setup output pending".

## 3. Minimal fix

A trap any fix has to avoid: the BOTH-path base is the newest first-parent `stack: ` commit. Simply running `git merge --no-ff -m "stack: P"` on top of the task's own commits would put those commits below the new base, and the stacked merge's `rebase --onto <integration> <base>` would silently drop them. Reconciling therefore has to put the task's own commits back on top of a new stack base.

Proposed BOTH (non-reentry) drift check, run before any implementing:
1. Compute oldBase with the existing rule. Drift exists when any of these holds:
   (a) some current parent p has `git merge-base --is-ancestor task-<p> <branch>` failing (the parent moved);
   (b) the branch has a first-parent `stack: X` merge where X is not among the current parents (X landed or was cancelled; the branch holds pre-review X);
   (c) optional, and arguably out of scope: an unstacked branch that is missing a blocker that has since merged. An unstacked implementer already rebases onto the integration branch before it reports (coordinator-workflow.md:1174).
2. No drift: behave exactly as today.
3. Drift with a dirty worktree (`git status --porcelain`, ignoring `.tmp/`, as `remove-task-worktree`'s `exclude_tmp` does): stop. Return SETUP_FAILED with a typed finding along the lines of "prerequisite drift: <ids>; uncommitted work preserved in <worktree>; nothing reset". Do not commit WIP. Do not use `--autostash`, which writes to the stash stack shared across worktrees. The task then goes to the blocker path with everything kept.
4. Drift with a clean worktree: record `oldHead`. On a detached HEAD at `<integration>`, merge each current parent with `git merge --no-ff -m "stack: p" task-<p>`; that commit is newBase, or `<integration>` itself when there are no parents. Then run `git checkout <branch> && git rebase --onto <newBase> <oldBase>`. Any merge or rebase conflict: run `git merge --abort` or `git rebase --abort`, check the branch out again (which restores it to oldHead), and return SETUP_FAILED naming the parent, the files and oldHead. **Never take the STACK_CONFLICT discard path here**: it runs `remove-task-worktree --discard`, which force-deletes committed task work. On success base = newBase, which keeps the newest-first-parent-`stack:` invariant, and setup reports `stacked` when there are parents, oldHead and newHead.
5. Optional one-liner: seed `discardFailed.add(id)` for a resumed `cancelled` line (861). This brings back the in-invocation recut semantics after a restart (a cancelled attempt's work is discarded by design). It is independent of points 1-4.

Where it lives: the text in `both` at line 2642. Preferably the git logic goes into a new script `skills/super-code/scripts/<stack-reconcile>`, in the same style as `already-merged` and `remove-task-worktree`, with one-fact output lines and exit codes, and the setup text calls it. That keeps the logic deterministic and runnable against real git; prompt-only logic cannot be executed in tests. No new dispatch is needed, and the JS routing is unchanged (SETUP_FAILED already goes to BLOCKED). Docs to update: coordinator-workflow.md:1147-1169 and the "reuse" text at 902-903, plus coordinator-subagents.md:57.

## 4. Tests

- `tests/super-code/test-dispatch-text.sh:95-100` asserts the setup text for `--parents` and `--reentry`. Add assertions for the reuse-drift wording and the script invocation.
- `tests/super-code/test-setup-cleanup.sh` is the template to follow: a real-git fixture (python unittest) that renders `dispatch-text ... implement --parents ep.0`, pulls the emitted command out of `<workspace-setup>` and runs it. Note: **this test is not in CLAUDE.md's release test list.** A new test should build: integration -> task-P (v1) -> task-T cut and stacked on P v1 with its own commit (plus a dirty variant) -> task-P advanced (fix commit) -> run the reconcile. Assert: the own commit is on top of the new `stack: P` base, oldHead is still reachable, dirty work is untouched and the result is SETUP_FAILED, a conflict aborts and leaves the branch at oldHead, and no `-D` or `--force` is used.
- `tests/super-code/replay-harness.mjs` live-sim mode can only assert prompt text and routing, using canned `impl:<id>` answers. Near-models: 4147 (RESOLVE retry re-dispatch), 4167 (resume re-entry plus a stacked dependent) and 1124 (SETUP_FAILED routes like a blocker). A new scenario could give a parent `review NEEDS_FIX -> fix` while the dependent's first impl returns BLOCKED, then RESOLVE. It would assert that the retry's `impl:` prompt carries the drift check together with `stack: <parent>`. For fix 5, a resume ledger with `cancelled (parent ...)` should give `recut` text in the impl prompt.
- dryRun counts: `pick()` never builds prompt text under dryRun (coordinator-workflow.md:1955-1966), and the fix adds no dispatch. The recorded counts (19 agent calls at 2420, 23 at 2489, and the canonical/fix-pass-blocked/parked replays at harness 913-961) do not change. They would change only if reconciliation became a separate mechanical dispatch, which is not recommended.
