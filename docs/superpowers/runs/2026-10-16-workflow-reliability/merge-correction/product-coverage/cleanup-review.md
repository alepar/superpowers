# Task 6 cleanup coverage review

Verdict: **QUALIFIED — two Should-fix gaps remain in the current cleanup contract.** Neither is established as a regression introduced by this diff. The four assigned member blobs were read in full; the current code improves failure propagation and resource retention, but the approved workspace/process invariant cannot be treated as fully established across its load-bearing discovery and caller seams.

Pinned source: `86ce3567e365fed967d50f3f4eeca77783fccf8b`; baseline: `832b051c870ae5c69adfa7f14d770292ab6c1a81`. Source was retrieved with `git show <pin>:<path>` from `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers`. No source, Git index/HEAD, tracker, Herdr or existing process was mutated. This is a bounded cleanup review, not whole-branch readiness, global acceptance, or coverage of pending scheduler/collector/acceptance repairs.

## Findings

### CLEANUP-01 — Should-fix: denied worktree discovery bypasses the nested-root safety guard

At pinned `skills/super-code/scripts/stop-run-processes:48-49`, `git -C "$r" worktree list --porcelain` is piped through `sed` and `|| true`; an empty result immediately continues. The guard therefore makes no distinction between an ordinary nonrepository temporary root and a repository whose inventory lookup failed. The latter can contain nested worktrees that would have forbidden this root. The helper then proceeds with matching and, in default mode, signals matched PIDs at lines 267-280. The added unknown-outcome mechanism starts later and never sees this discovery failure.

A narrow private probe ran the **exact pinned script**, without edits, in `--check` mode. It supplied a simulated process whose cwd is under a simulated nested worktree. With successful mocked Git inventory listing the parent and child, the helper returned **2** and refused the parent. With the same root/process data but mocked Git returning **128**, the helper returned **3**, printed `match: 990001 fixture-nested-owned — cwd .../parent/.worktrees/child`, and printed no `unknown:` fact. All process data were mocked; no process was signalled. The probe proves an inventory failure admits a root the successful guard refuses. The default-mode signal consequence is a static inference from the shared match list and lines 267-280, not a live termination claim.

Evidence: [probe output](cleanup-probe/result.json), [exact script copy](cleanup-probe/stop-run-processes), probe mocks under `cleanup-probe/bin/`, and [pinned/base source excerpts](cleanup-source-evidence.txt). The baseline has the same suppressed-inventory block at lines 43-46. This is an **inherited current-contract gap**, not a newly introduced regression. It remains relevant because the updated contract claims discovery failures stay unknown and ownership boundaries remain intact. Distinguishing verified nonrepository roots from failed repository inventory would preserve temporary-root support while preventing this bypass.

Coverage consequence: existing exact tests cover a successful nested-root refusal and denied `ps`/`lsof` discovery, but do not cover denied Git inventory at this root guard. Do not infer that those tests establish fail-closed root validation.

### CLEANUP-02 — Should-fix: setup conflict/recut callers still bypass retention on helper failure

Pinned `skills/super-code/coordinator.js:2589` tells a stacked-task implementer, after a stack conflict, to run `stop-run-processes`, then directly `git worktree remove --force` and `git branch -D`. Line 2593 gives the same direct cleanup sequence when recutting a previously cancelled attempt. Neither sequence conditions deletion on the stop helper's result or routes removal through the repaired `remove-task-worktree --discard` gate.

The prompt is operationally consumed: `implementPrompt` at lines 2605-2618 includes `workspaceSetup` in `[WORKSPACE_SETUP]`; `skills/super-code/implementer-prompt.md:53-59` says to run it exactly as written before anything else. `implementPrompt` appends process hygiene and permission-refusal guidance, but not `cleanupOutcomeRule()`. Process hygiene at coordinator lines 2498-2505 does not supply a resource-retention gate. The permission guidance at 2471-2476 explicitly distinguishes a tool-call refusal from a command that executed and failed, so it does not close the ordinary helper exit-4 path.

Consequently, a cancelled attempt can be retained by `remove-task-worktree --discard` because inspection is unknown, then encounter a recut instruction that again runs the stop helper but directly removes the same workspace regardless of its unknown result. The helper fix does not enforce retention for that caller. Stack-conflict cleanup has the same missing condition. This conclusion is **static contract evidence**; no fresh-agent execution, real process signal, forced Git removal, or observed end-user data-loss claim is made.

Evidence: [source excerpts](cleanup-source-evidence.txt) contain current and baseline prompt builders plus the consuming template. Baseline coordinator lines 1942 and 1945 contain the identical direct-cleanup sequences. This is an **inherited caller-seam gap**, outside the four member blobs but directly invoking the changed helper. The repaired merge, reconciliation, cancellation and sweep prompts do use the outcome rule/helper. Their checks do not demonstrate safe behavior for these setup paths. Carry a nonzero/unknown result into retained resources and a safe setup outcome, or route these paths through the existing guarded removal helper.

## Exact membership coverage

| Member | Pinned Git blob | Read coverage |
|---|---|---|
| `skills/super-code/scripts/stop-run-processes` | `57e6ffc1d062bd7d7d272701e358a9b60ce384d3` | Entire 294-line body |
| `skills/super-code/scripts/remove-task-worktree` | `0d9db1337f21949715c16ad3075de1cc83fabe28` | Entire 167-line body |
| `skills/finishing-a-development-branch/SKILL.md` | `44a2aae37a55eba5042473e85f6f9b92c68c87f7` | Entire 306-line body |
| `tests/super-auto/outer-cleanup-r1.sh` | `1c26a0c4f7642f31fc9c145f3ec7c18b7cf4abbb` | Entire 175-line body |

All four IDs were checked against the supplied membership file using the pinned Git object identities. **No member lines are unread.** The supplied directory contains `cleanup-review.diff`, which was read; the task's literal `COMPLETEcleanup-review.diff` filename does not exist. The complete pinned bodies, not adjacent diff context alone, are the review basis.

The approved `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md` was read in full. Supplemental reads cover super-auto's complete Phase 7 cleanup preconditions, durable cleanup facts and report updates; coordinator setup/merge/closure/discard/sweep builders and cleanup/process/permission rules; the implementer setup consumer; and replay-harness cleanup propagation and direct helper tests. [Machine coverage identities](cleanup-coverage.json) give each supplemental blob and exact read ranges. Other ranges of those larger supplemental files remain unread and are not claimed covered.

## What the changed bodies establish and what the tests actually cover

`stop-run-processes` now separates nonzero process discovery, ancestry, terminal inspection and termination-status checks from absence; absent-PID verification requires successful all-PID enumeration. Interactive preservation contributes exit 3, and uncertainty takes exit 4 precedence. `remove-task-worktree` now requires successful process cleanup before worktree/temp removal in ordinary, discard and sweep paths and preserves both resource names on failed cleanup. Finisher preconditions retain containing parents and unarchived evidence and explicitly separate completed delivery/branch choice from pending cleanup. No member-local newly introduced regression was established in this inspection.

`tests/super-auto/outer-cleanup-r1.sh` contains real disposable Git consequences, a denied-`ps` sweep scenario, real parent-root refusal, deterministic decision-table simulations, and a live-owned-process positive path. Its header and ending correctly limit the evidence: this is not fresh-agent instruction compliance. Its parsed Markdown decision table drives the negative retention simulations; those simulations cannot prove that an agent independently follows the complete finisher instructions.

The exact replay-harness sections inspected include denied ancestry/lsof/environment/tty/status cases, failed signals, survivors, interactive retention, disappearance and valid-empty results; resource preservation for ordinary/discard/sweep calls; path-based ownership and no kinship expansion; ordinary worktree guards; and result propagation keeping code completion separate from cleanup. These were **source inspections only**. No broad suite was rerun and no historical pass was adopted as a fresh result.

Only the targeted mocked `--check` root-guard probe was executed for this review. No Linux `/proc` execution or fresh-agent finisher compliance evaluation was performed. Historical notes in the approved spec are attributed historical claims, not independent evidence from this review. The review provides no root acceptance, release, merge or global ready verdict.
