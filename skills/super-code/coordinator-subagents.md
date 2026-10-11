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
merge into the integration branch at a time. A dependent starts only after its blocker merges.
There is no early unblock in this mode.

Three things keep the run measurable and resumable:

- **Launch line.** Before the first task dispatch, append `Launch: mechanism ordinary-subagents ·
  epic <id> · branch <branch> · integrationWorktree <absolute path> · concurrency <N> · sweep
  <command or deferred> · mergeCheck <build-only command or none>` to the ledger. Append another
  one when you resume.
- **Ledger outcomes.** Write each task's `Task …` and `Merge: …` lines in `coordinator-workflow.md`'s
  formats as the task settles, and the `Detector:`, `Sweep:` and four `Metrics:` lines at Finish.
  Resume reads them back, through `scripts/ledger-digest`, together with beads and git.
- **Dispatch names.** Name every dispatch `<kind>:<bead id>[:<suffix>]` with the Workflow kinds:
  `impl`, `review`, `fix`, `fix:<id>:seam` or `fix:<id>:check`, `seam-review`, `triage`, and
  `plan` or `final-review` with no bead. On Codex, task names accept only `[a-z0-9_]`, so write
  `<kind>_<bead id>[_<suffix>]` with every other character as `_` (`seam_review_ht_3bi_3_4`), and
  append `__2`, `__3`, … when a name repeats.

At Finish, record the run profile: `bash <skillsRoot>/super-code/scripts/run-profile --codex
"$CODEX_THREAD_ID"` on Codex, or `--subagents ~/.claude/projects/*/"$CLAUDE_CODE_SESSION_ID"/subagents`
on Claude Code, with `--ledger <ledger> --out <ledger dir>/profile-<session id>`. Append its stdout
to the ledger. If it prints `Profile: unavailable — …` (exit 3), append that line instead.
