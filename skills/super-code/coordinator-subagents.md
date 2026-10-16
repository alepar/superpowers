# Ordinary-subagent coordinator

Use this when the calling session has ordinary subagent spawn/wait tools and no `Workflow` tool
(Codex, or Claude Code with Workflow unavailable). The calling session drives the epic itself, a
manual ready-driven loop under the same contract as the Workflow coordinator:
`coordinator-workflow.md` is the spec for the per-task pipeline, gates, ledger line formats and
Finish. How you schedule and track the loop is your call. Do not emulate the script step by
step. The calling session stays the scheduler through Finish, because some harnesses do not let
a subagent spawn a reviewer.

Run the loop as SKILL.md's Parallelism section describes: keep up to `config.concurrency` task
chains in flight, within the hot-file cap, refill from `ready-in-tree` as chains end, and keep one
merge into the integration branch at a time. Write each agent's dispatch with
`bash <skillsRoot>/super-code/scripts/dispatch-text --ledger <ledger> <kind> …` (`--help` lists the
kinds). It writes the text `coordinator.js` would send to a file and prints the path, so spawn the
agent with "Read <path> and follow it exactly." The merge text leaves the ledger lines to you.

Keep the window full. The Workflow coordinator does these, and so do you:

- **Start dependents early** (unless `config.earlyUnblock` is false). When an implementer reports a
  commit and its task has open dependents in the tree (`scripts/tree-deps`), run
  `scripts/review-bead split <id>`. Its dependents become ready; dispatch each with
  `implement --parents <its unmerged in-tree blockers>`. The setup stacks them on those branches.
  A ready review bead (`ready-in-tree`'s `reviews`) re-enters its task at review
  (`implement --reentry`).
  - A stacked task merges only after all its parents have landed, with `merge --stacked --base
    <its reported base>`, so only its own commits are rebased. A split task's merge passes
    `--review-bead <its review bead>`, which the merge closes after the task bead.
  - A parent that ends without merging cancels its stacked dependents, and theirs in turn. Run
    `review-bead reopen <parent>`, stop each dependent's agent or ignore its late report, discard
    its worktree (`remove-task-worktree --discard`), and write a `cancelled (parent <id> …)` line.
    Do not dispatch a ready id whose in-tree blocker failed or awaits a retry this run.
  - `STACK_CONFLICT`: re-dispatch the task fresh once the parents it names have merged.
- **A task that already landed is closed, not failed.** An implementer's `ALREADY_MERGED` or a
  merge reply with `alreadyMerged true` goes to the close-only step (`coordinator-workflow.md`'s
  closure rules): bd first, then the git re-check. Nothing stacked on it is cancelled.
- **Merge what others wait on first.** Among tasks ready to merge, take the one with the most
  live tasks stacked on it or waiting for it; otherwise, the first ready. Triage of a failed merge
  runs beside the merge lane, never in it.
- **Plan the ready set first.** The first planner gets `plan --mode ready`. Dispatch those tasks,
  then run `plan --mode rest` beside them. Split a task only after the rest of the tree is mapped.
- **Add edges at once.** For a planner's `missingEdges` or a triage `waitFor`, run
  `bd dep add <dependent> <blocker>` yourself before the next refill, and write `Edge add:` or
  `waiting on <bead>`. A `waitFor` does not spend the task's retry.
- **Do not idle.** Wait for whichever agent finishes first. Refill after every landing and
  every split. If a file holds back two tasks while a slot is free, raise its cap by one. Write a
  `Detector:` line at each refill, not only at Finish.

**One fresh agent per round.**

- Every fix pass, seam fix, check fix, re-review and re-assessment is a fresh agent; its only memory
  of the earlier round is the paths the dispatch hands it (dispatch-text's `fix` text names them).
- A steering message that adds work is a new round: spawn a fresh agent for it.
- Improvised dispatches (a history reader, an assess pass, a first gate, an absorb, and similar) state
  their input paths, one output file, scope and out-of-scope, a checklist, and "one fresh agent, one
  job". Split a large input across several such agents.
- History and assess passes read assembled inputs: run
  `dispatch-text assemble --consumer history|assess --instance <bead id>` first and point the pass at
  the digest it writes. When the assembler returns nothing or a non-zero exit, give the pass its
  direct inputs and append `assembler: unavailable — <cause>` to the ledger.

Three things keep the run measurable and resumable:

- **Launch line.** Before the Launch line, run the same identity steps as `coordinator-workflow.md`
  §Pre-flight (step 2's run-identity bullets): the `Context:` line, the runTag, and the marker guard —
  register only when `run-marker get … --cwd` finds no live marker; under super-auto neither register
  nor clear. Before the first task dispatch, append `Launch: mechanism ordinary-subagents ·
  epic <id> · runTag <tag> · branch <branch> · integrationWorktree <absolute path> · concurrency <N> ·
  earlyUnblock <on or off> · sweep <command or deferred> · mergeCheck <build-only command or none>`
  to the ledger. Append another one when you resume.
- **Ledger outcomes.** Write each task's `Task …` and `Merge: …` lines in `coordinator-workflow.md`'s
  formats as the task settles, and the `Detector:`, `Sweep:` and four `Metrics:` lines at Finish.
  Resume reads them back, through `scripts/ledger-digest`, together with beads and git
  (`scripts/already-merged --landed <integration branch>` lists the task merges git holds, for
  landings whose ledger lines were lost). Do not write a `Human action:` or `Edge add:` line the
  ledger already has.
- **Dispatch names.** Name every dispatch `<kind>:<bead id>[:<suffix>]` with the Workflow kinds:
  `impl`, `review`, `fix`, `fix:<id>:seam` or `fix:<id>:check`, `seam-review` (`seam-review:<id>:check`
  for a merge-check fix's review), `merge`, `triage`, and `plan`, `plan-rest` or `final-review`
  with no bead. On Codex, task names accept only `[a-z0-9_]`, so write
  `<kind>_<bead id>[_<suffix>]` with every other character as `_` (`seam_review_ht_3bi_3_4`), and
  append `__2`, `__3`, … when a name repeats.

At Finish, record the run profile: `bash <skillsRoot>/super-code/scripts/run-profile --codex
"$CODEX_THREAD_ID"` on Codex, or `--subagents ~/.claude/projects/*/"$CLAUDE_CODE_SESSION_ID"/subagents`
on Claude Code, with `--ledger <ledger> --out <ledger dir>/profile-<session id>`. Append its stdout
to the ledger. If it prints `Profile: unavailable — …` (exit 3), append that line instead.

Then clear the run marker by the same rule as `coordinator-workflow.md` §Finish: `bash
<skillsRoot>/super-code/scripts/run-marker get <session id> --cwd <integration worktree>`, and only
when its `skill:` line is `super-code`, `run-marker clear --worktree <integration worktree>`. Under
super-auto clear nothing.

Every read you make to route the loop follows the read rule in `coordinator-card.md` (re-injected
after compaction): the ledger through `ledger-digest`, child reports through `report-verdict <file>`,
never a report body, plan, spec or diff.
