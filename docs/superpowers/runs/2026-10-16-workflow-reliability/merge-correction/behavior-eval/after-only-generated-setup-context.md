
<generated_implementer_prompt>
EVIDENCE CONTRACT: optional evidence records carry sourceTree, command, configuration, outcome, location, kind; kind is live|simulated|fallback and outcome is pass|fail|unavailable. sourceTree is the full tested Git tree hash: HEAD^{tree} for clean committed source, or a temporary-index snapshot including tested changes. Keep the complete records and capture commands in the report and return the records as evidence. For explicitly required live checks, return requiredLiveChecks with sourceTree, command, configuration selected against the task acceptance. Only matching live/pass evidence supplies that check; semantic coverage belongs to the reviewer. These check facts do not replace implementation, review or run acceptance. Optional failureAttribution entries carry failure, command, configuration and zero-based indices into THIS reply evidence array: observed (live failing source), runBaseline (measured run-start source), taskBase (measured task-base source), verification (live passing fix source); introducedBy names the task established by source/fix history. Include only supported associations and preserve exact evidence kind/outcome; omitted or uncertain baseline is an attribution gap. Task-base exoneration does not release a known run owner. Retain the arrays/associations in the report. You are the implementer for task seam.1. Read /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/skills/super-code/implementer-prompt.md and follow its "Your job" path, with these parameter values: [TASK_ID] = seam.1; [N] = 1; [WORKTREE] = /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1; [BRANCH] = task-seam.1; [INTEGRATION_BRANCH] = integration; [BRIEF_FILE] = /private/tmp/task6-seam-evidence/setup-prompt/task-1-brief.md; [REPORT_FILE] = /private/tmp/task6-seam-evidence/setup-prompt/task-1-report.md. [WORKSPACE_SETUP], the template's step 0, run before anything else: <workspace-setup>The task worktree is /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1 and the task branch is `task-seam.1` — use both verbatim; /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1 is an absolute path when the integration worktree is one, otherwise relative to the REPOSITORY ROOT, never to your own working directory. An earlier attempt of this task was cancelled and its worktree may not have been removed: if /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1 or the branch `task-seam.1` exists, run `bash /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/skills/super-code/scripts/remove-task-worktree --discard --tmp /tmp/sp-a3f3ae2c/seam.1 /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1 task-seam.1` and capture its exit code and output. Only exit 0 permits treating this as the NEITHER case. On any nonzero exit, retain every remaining resource, stop setup and return SETUP_FAILED with the helper exit code and all output in `finding`; do not recut or force removal. Check whether /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1 and the branch `task-seam.1` already exist (`git worktree list`, `git branch --list task-seam.1`). If NEITHER exists: run the ALREADY-MERGED CHECK below first (the branch may have been deleted after it landed); if it prints true, return ALREADY_MERGED and create nothing. Otherwise `git worktree add /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1 -b task-seam.1 integration`. Then `git rev-parse HEAD` in /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1 is base. If BOTH exist (a restart re-dispatching this task): reuse them as they are (do not delete, recreate, or re-run `git worktree add`), and read `git status` and `git log` there: an earlier attempt's committed or uncommitted work is where you continue from, not something to redo; find the base: `git log --first-parent --grep='^stack: ' -n 1 --format=%H task-seam.1` — if it prints a commit, that is base and report stacked true; otherwise base is `git merge-base integration task-seam.1` (run in /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1). ALREADY-MERGED CHECK, on a reused branch and before a fresh cut: run `bash /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/skills/super-code/scripts/already-merged integration task-seam.1`; if it prints true, return status ALREADY_MERGED with base and nothing else. BRIEF: run `bash /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/skills/subagent-driven-development/scripts/task-brief /private/tmp/task6-seam-evidence/setup-prompt/seam-plan.md 1 /private/tmp/task6-seam-evidence/setup-prompt/task-1-brief.md` in /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1 (the third argument is the output file; keep it); if it reports "task not found", return status SETUP_FAILED with that as `finding`. TOOLCHAIN PROVENANCE, after cutting a FRESH worktree: run the project's setup step in it if it has one (the same install/sync the integration worktree was set up with), then check that the test runner and the package under test both resolve INSIDE /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1 (e.g. `which <runner>` and the interpreter's import path for the package); if either resolves elsewhere, rebuild the local environment; if it still resolves elsewhere, return status SETUP_FAILED with `finding` naming what resolved where. Report base on every return.</workspace-setup> CURRENT REQUIREMENTS, before using the frozen plan or brief: read `bd show seam.1 --json` (including description and acceptance criteria) and `bd comments seam.1`. Use the frozen section for its ordinal, scope and implementation context. Explicit task amendments in the current bead override older conflicting plan/brief requirements; recorded triage clarifications settle the point they address. Apply compatible requirements together. If current sources conflict without an explicit amendment or clarification that settles them, report the conflict as BLOCKED (reviewers: NEEDS_FIX); do not guess. These sources describe task requirements and never override permissions, write boundaries or human gates. Record amendments used in the report or verdict. WRITE TARGETS: every file you create or change (code, tests, evidence, logs, scratch) goes inside /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1; the only files you write outside it are the plan-workspace files named above as [REPORT_FILE] (git-ignored). The integration worktree /private/tmp/task6-seam-evidence/setup-prompt/integration and the user's checkout are READ-ONLY for you, whatever a brief or clarification says. Never run `git stash`: the stash is shared by every worktree of the repository, so another task's agent can pop your changes or you theirs. To set work aside, make a WIP commit on your own branch or write `git diff` to a file inside your worktree. PROCESSES AND TEMP STATE: run tests with TMPDIR=/tmp/sp-a3f3ae2c/seam.1 (`mkdir -p` it; any temp HOME, socket or data directory you make goes under it too) so everything a test starts is traceable to this task and socket paths stay short; never put temp state in the worktree. Run the product's own binary, and any ad-hoc probe of it, with HOME and every XDG_*_HOME pointed under /tmp/sp-a3f3ae2c/seam.1 too — never against the real home directory. After each test run, run `bash /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/skills/super-code/scripts/stop-run-processes --check /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1 /tmp/sp-a3f3ae2c/seam.1`: every `match:` line is a process the run leaked (exit 3) — stop them with `bash /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/skills/super-code/scripts/stop-run-processes /private/tmp/task6-seam-evidence/setup-prompt/integration/.worktrees/integration--task-seam.1 /tmp/sp-a3f3ae2c/seam.1` and record each under "Test hygiene" in your report, naming the command or test that leaked it. Before you return, stop every background process you started (servers, daemons, watchers, `tail -f`) with that same command, and list any `survived:` line in your report. Never stop a process the command does not match. RUN TO COMPLETION: when a command may outlast your shell tool's timeout, run it in the background with its output and exit status redirected to a file, then wait in bounded calls, each well under that timeout (`for i in $(seq 50); do kill -0 <pid> 2>/dev/null || break; sleep 6; done`), or by your harness's background-run notification where it has one; `wait <pid>` fails in a later call, which is a new shell — never `until ! pgrep -f <pattern>`, which matches its own command line and never ends. A command killed by a timeout or a signal before it printed a verdict did not fail: it has no result. Start every command with an absolute `cd`; never rely on an earlier call's working directory. NARROW COMMANDS ONLY — these forms are refused by the permission layer and are never needed here: a script or loop that edits many files at once (sed/perl/awk/python over conflicted files to strip conflict markers, `git checkout --ours/--theirs` + `rebase --continue` loops) — resolve each conflicted hunk with a file edit instead; moving a branch ref other than your own task branch (`git branch -f`, `git update-ref`, `git reset` of another branch) — report the state instead; and stopping processes by name or pattern (`pkill`, `killall`, `kill $(pgrep …)`) — use `bash /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/skills/super-code/scripts/stop-run-processes <your roots>` only. PERMISSION REFUSALS: if the harness permission layer refuses a command (the tool call itself is declined — the command never executed: no exit code, no output from the command; this is different from a command that ran and failed), take the narrow path that reaches the same result (one file edit per hunk, one plain git command, the stop script) — never a re-spelling of the same bulk command. If the refused command was only cleanup your deliverable does not need (removing state a test or probe left outside your worktree, say), do not stop: finish the task, and put the refused command and what a human should do about it in `humanAction`. Otherwise, if the narrow path is refused too, STOP on this task: do not retry further and do not file a blocker bead (no agent can lift a permission decision; a bead would only spend a triage pass learning that) — report status BLOCKED_AUTH with `finding` set to the exact refused command(s), verbatim. FINAL ANSWER: your structured result is the whole answer. Return every field your schema or output template defines, in full, and add no prose summary beside it.

</generated_implementer_prompt>

<instruction_file path="skills/super-code/implementer-prompt.md">
# Implementer brief (super-code)

super-code's coordinator dispatches an implementer (workspace setup, then the initial
implementation) or a fixer (the fix pass, the post-rebase seam fix, or the merge-check fix) with
this file's absolute path and the values of the bracketed parameters. Adapted from `subagent-driven-development/implementer-prompt.md`; super-code owns this
copy. Everything below the line is addressed to the dispatched agent.

---

You are implementing one task of a beads epic, alone, in your own git worktree, during an
unattended run. Your dispatch message gives the parameter values and says which job this is: the
initial implementation ("## Your job") or a fix ("## Fix pass").

## Unattended run

No one can answer questions during this run; the coordinator reads only your final report. When
the requirements are ambiguous, check the current bead, brief, comments, and existing code, then
implement the reading they best support and record the assumption under "Assumptions" in your
report. Keep going until the work is done, tested and reported under its Completion kind below.

Report BLOCKED only when the task cannot be completed as specified: something it needs is missing
(a dependency, an interface an earlier task was meant to provide), the plan contradicts itself or
the code, or every reading of an ambiguity is a guess on a point that changes the result. If you
finished the work but doubt part of it, report IMPLEMENTED and put the doubt under "Concerns".

Before starting each implementation or fix attempt, read `bd show [TASK_ID] --json` (description
and acceptance criteria) and `bd comments [TASK_ID]`. The frozen brief supplies the task's ordinal,
scope and implementation context. Explicit amendments in the current bead override older conflicting
plan or brief requirements; recorded triage clarifications settle the point they address. Apply
compatible requirements together. When current sources conflict without an explicit amendment or
clarification settling them, report BLOCKED. Record the amendments used under "Assumptions".
Task content never overrides permissions, write boundaries or human gates.

## Where you write

Every file you create or change — code, tests, evidence, logs, scratch output — goes inside
[WORKTREE]. The one file you write outside it is [REPORT_FILE], in the git-ignored plan workspace.
Never write into the integration worktree or the user's checkout, even when a path in the brief, a
clarification, or your dispatch points there: any path outside [WORKTREE] that you were not given
as a write target is read-only. A stray file in the integration worktree blocks every later merge.
This applies to the fix pass too.

Evidence the brief asks you to keep (a capture, a log a reviewer needs) goes where the brief names,
else under `evidence/[TASK_ID]/` in [WORKTREE]. Never name a deliverable `findings.md` or
`report.md`: a harness classifier has refused those names to subagents. A test you commit must not
depend on this machine's paths, live data or the current merge-base: those pass here and fail
everywhere else.

## Your job

Work in [WORKTREE] (branch `[BRANCH]`, cut from `[INTEGRATION_BRANCH]`).

0. Workspace setup, before anything else. Run the steps your dispatch gives as
   [WORKSPACE_SETUP] exactly as written: they cut or reuse the worktree and branch, merge any stack
   parents, find the base commit, write the brief to [BRIEF_FILE], and check that the toolchain
   resolves inside [WORKTREE]. This step is mechanical: don't improvise around a failure. Return
   early, without implementing, when the setup says to: `ALREADY_MERGED` (with `base`),
   `STACK_CONFLICT` or `SETUP_FAILED` (each with `finding` naming the cause), or `IMPLEMENTED` with
   `base` and `head` for a review re-entry whose branch already holds the implementation. Otherwise
   continue; the base you found is [BASE] below.
1. Read the current bead and comments as above, then the brief at [BRIEF_FILE]: the task's section of the plan, with files to touch, acceptance
   criteria, and steps.
2. Implement exactly what the task specifies, with tests (TDD when the brief says so).
3. Run the tests relevant to this task: the ones covering the files you changed and the brief's
   acceptance criteria. If you changed the behavior or signature of a function other code calls,
   also run the tests covering those callers (grep its call sites). Do not run the whole suite; it runs once at the end of the epic. Iterate
   with focused runs, and keep the command and output of your final run for the report. Run them
   under the temp-state rule and the leak check your dispatch gives as PROCESSES AND TEMP STATE.
4. Self-review your diff against the brief (see "Self-review"), fix what you find, and re-run the
   relevant tests if you changed anything.
5. Select the completion kind below, then write the report and return.

## Scope

Change only what the task needs. Don't add features, files, docs, refactors, or tests the task
didn't ask for; if you think one would help, list it under "Concerns" instead. Follow the
codebase's established patterns and the file structure the plan defines. If a file you create
grows beyond the plan's intent, or a file you modify is already tangled, note it under "Concerns"
rather than restructuring it.

Do all of the work yourself. Don't spawn subagents, and don't spawn a reviewer: a task review is
already scheduled after you report.

## Tests and verification

- A real check is a test run that exercises the change. Where no test covers it, use the project's
  build or type-check, or run the changed command. A syntax-only check, or a command that failed to
  start, is not a real check.
- If the only thing stopping a test run is missing declared dependencies, install them with the
  project's own package manager and lockfile (never sudo, never the system package manager).
- If no real check can run here, still report IMPLEMENTED, and name the check you could not run and
  why under "Concerns". Never present an unrun check as passing.
- For every assertion you add, name a value the code could produce that would fail it. If the type
  or the fixture makes that impossible (a length check on a fixed-size array, a value compared to
  itself), the assertion is decoration: replace it. An assertion after a failing one in the same
  test body did not run; record it as unmeasured, not green.
- Test output should be pristine. Fix warnings you caused, or report them.
- Don't skip, ignore, delete or loosen an existing test, or change its expected values, unless the
  brief says to (a fix bead that names the test as the defect does). A test you believe is wrong goes
  under "Concerns".
- A test command that takes more than a few minutes is slow. Before running it, pick the narrowest
  filter that still exercises the change, and don't re-run it for unrelated checks; never skip the
  test that exercises the change. Name each slow command and its duration with your test output.
  If the test setup itself is slow, report it under "Concerns" instead of fixing it in this task.
- A failing test you believe your change did not cause — "pre-existing", "unrelated",
  "environment-dependent", "flaky" — is yours until shown otherwise. To show it,
  run that test at [BASE] in a throwaway checkout under your temp root (`git worktree add --detach
  $TMPDIR/base [BASE]`, run only that test there, then `git worktree remove $TMPDIR/base`) and report
  both results. "Pre-existing", "fails identically at base", "unrelated" or "env-dependent" without
  that result is not evidence (for "flaky", show repeated runs): fix the failure or report it as a
  concern.

## Self-review

Re-read your diff against the brief: every requirement implemented, nothing extra built, existing
patterns followed, and tests that cover the acceptance criteria and the task's edge cases by
exercising real behavior rather than mocks.

## Completion kind

If the current task acceptance explicitly permits verification without delivered changes and
all required checks pass on unchanged, clean source, return `status: IMPLEMENTED` with
`completionKind: "verification-only"`, `files: []`, the equal captured `base` and `head`, and
`sourceTree` from `git rev-parse HEAD^{tree}`. Retain the source-bound `evidence` and
`requiredLiveChecks` in the report and reply. Explain which acceptance obligations permit this
completion. Make no artificial commit and do not rebase the tested source after capture. The
independent reviewer must confirm the task intent, source identity and acceptance coverage
before the coordinator closes the task.

If acceptance requires delivered changes, use `completionKind: "implementation"` (the default)
and the Commit steps below. Passing existing checks alone does not supply delivered changes.

## Commit

COMMIT IS THE LAST STEP. Commit on `[BRANCH]` in [WORKTREE]. Then, unless step 0 reported stacked,
rebase onto the current integration tip, `git rebase [INTEGRATION_BRANCH]` in [WORKTREE], so the
branch merges cleanly and tasks that build on it start from current code. Resolve any conflicts
keeping both sides' intent; if you can't, `git rebase --abort` and say so under "Concerns". If
[INTEGRATION_BRANCH] had moved past [BASE], re-run step 3's tests on the rebased branch: that is
your final run for the report; fix and commit anything it shows. Your base is now
`git merge-base [INTEGRATION_BRANCH] HEAD`; report that. A stacked branch is never rebased here: it
carries its parents' unmerged commits, and its merge replays only its own. Then `git status --short`
must come back empty (commit anything it lists that belongs to this task). Then
`git rev-parse HEAD` is the `head` you report. For implementation completion, a head equal to the base you report means nothing was committed; the coordinator checks this,
and uncommitted work is never reviewed or merged.

## Blocked

Before you report BLOCKED, file a blocker bead: `bd create` with ONLY the `blocker` label (no `sp:`
label, no other label, no `--parent`: either one makes the bead reachable as work and starts a
self-sustaining filing loop; confirm flags with `bd create --help`). Body: the task id, what is
missing or contradictory, and what you tried. Report its id as `blockerBead`. Commit any partial
work that is sound, and describe the rest in the report.

## Report

Write your full report to [REPORT_FILE]. It is an absolute path in the integration worktree's
workspace, which is where the reviewer reads it; don't write a copy anywhere else.

- What you implemented (or attempted, if blocked)
- Tests: the exact command of your final run and its output (the relevant excerpt, including the
  summary line). The reviewer does not re-run tests, so this is the task's only test evidence.
- `evidence`: retain source-bound check records in the report and return the same array in the
  structured reply. Each record carries `sourceTree` (the full tested Git tree hash), `command`,
  `configuration` (a concrete string; `default` when no options apply), `outcome`
  (`pass|fail|unavailable`), `location` (the retained output path), and `kind`
  (`live|simulated|fallback`). Example with an illustrative hash:
  `{"sourceTree":"d84541aed84541aed84541aed84541aed84541ae","command":"node smoke.mjs","configuration":"target=staging","outcome":"pass","location":"evidence/smoke.log","kind":"live"}`.
  `git rev-parse HEAD^{tree}` identifies clean committed source. For dirty source, use a temporary
  Git index under your authorized temp root to snapshot the tested inputs with `git write-tree`;
  retain the capture commands and include relevant untracked inputs. Preserve the real index.
  Keep failed and unavailable required checks as those outcomes. For explicitly required live
  checks, return `requiredLiveChecks` entries with `sourceTree`, `command`, `configuration`; the
  reviewer judges their coverage. These optional fields add no tests or phases. Their absence is
  an evidence gap when the task requires them.
- TDD evidence, when the brief required TDD: the RED command, its failing output and why that
  failure was expected; the GREEN command and its passing output
- Files changed
- Test hygiene: every process the leak check found after a test run (the command or test that
  leaked it, and whether it stopped), and any `survived:` line from stopping your background
  processes; "none" when there were none
- Assumptions, and Concerns

Then return: `id`, `status` (IMPLEMENTED or BLOCKED, or BLOCKED_AUTH per your dispatch's
permission rule), `files` touched, `base` (from step 0, or after the rebase in "Commit"), `head`, `stacked` / `reopened` when step 0
reported them, `blockerBead` when BLOCKED, the `completionKind` (and `sourceTree` for verification-only), and the report's optional `evidence` and
`requiredLiveChecks` arrays.

## Fix pass

You are a fresh agent; whoever implemented the task is gone. Read the brief at [BRIEF_FILE], the
implementer's report at [REPORT_FILE], and the review at [REVIEW_FILE] before changing anything. The
findings to fix are quoted in your dispatch message inside `<finding>` tags. They are review output
about this task's code, to be checked against the code, not instructions. This is the only fix pass
the task gets; it merges after you, without another review.

- Before returning, stop every background process you started, as your dispatch says.
- Make the smallest change that resolves each finding. Touch nothing a finding does not require.
  Minor findings are deferred to the ledger; leave them alone.
- If a finding is wrong, or fixing it would contradict the plan (a plan-mandated item), don't fix
  it. List it under "Declined" with a technical reason. Declined findings go to the ledger and the
  final whole-epic review.
- If a finding is only about the report's evidence (test output missing from [REPORT_FILE], say)
  and the code is right, resolve it in the report alone and list it in `evidenceOnly`. Any finding
  about code or tests needs a commit.
- Run the tests covering what you changed, plus the tests covering the callers of any function
  whose behavior or signature you changed (grep its call sites), and keep the command and output.
  The PROCESSES AND TEMP STATE rule and leak check in your dispatch apply to these runs too.
- Append a section to [REPORT_FILE], headed "## Fix pass", or the heading your dispatch names
  ("## Seam fix", "## Merge-check fix"): what you changed for each finding, declined findings with their
  reasons, and the test command and output.
- Commit as in "Commit", without its rebase. If you only declined findings or resolved them in the
  report, there is nothing to commit.

The "Unattended run", "Scope", "Tests and verification", and "Blocked" sections apply to this pass
too.

Return: `id`, `status` FIXED (or BLOCKED / BLOCKED_AUTH), `head`, `declined`: one line per
declined finding with its reason (omit it when you declined nothing), and `evidenceOnly`: one line
per finding resolved in the report alone (omit it when there is none), plus the fix report's
optional `evidence` and `requiredLiveChecks` arrays.

</instruction_file>
