---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work
---

# Finishing a Development Branch

## Overview

**Core principle:** Verify tests → Detect environment → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## Step 1: Verify Tests

Run the project's full test suite (`npm test` / `cargo test` / `pytest` / `go test ./...`).

**If tests fail**, report the failures and stop — the menu comes after a green suite:

```
Tests failing (<N> failures). Must fix before completing:

[Show failures]
```

**If tests pass:** continue to Step 1.5.

## Step 1.5: Update the Design Record

Locate the originating design spec via the plan header's `Spec:` line (or, in beads mode, the epic). If a spec exists:

- If implementation involved fixes or adjustments that diverged from the design's assumptions, prepend a short dated **"Changes vs. original design"** summary at the top of the spec's `## Post-Implementation Notes` section (leave any running bullets below it intact).
- Update the spec's row in `docs/superpowers/specs/INDEX.md`: set status to `implemented` (or `superseded-by: <file>` if this design replaced an earlier one).
- Commit these doc edits on the feature branch **now**, so they are included in whatever integration option runs next.

If no spec is found (ad-hoc work with no brainstorming), skip this step.

## Invoked as part of a larger run

An orchestrating skill (the `super-*` family) may invoke this skill at the end of a run it owns.
Two things change, and only two:

- **Merges into that run's own integration branch or worktree are the caller's, not yours.** They
  happen as the run proceeds, without a menu — you are not invoked for them at all. This skill
  governs one merge: the completed work into the base branch.
- **The base branch is supplied, not asked** (Step 3), because the caller recorded which branch the
  integration branch was cut from. Confirm it silently against `git merge-base` and proceed.

**What does not change: the menu.** The integration decision is the human's in every mode,
including a run the user asked to be fully autonomous. Autonomy buys an unattended *run*, not an
unattended *merge* — and a run that has finished all its work and is waiting here is done, not
blocked. Present the report the caller wrote alongside the menu so the choice is made with the
summary in hand.

## Step 2: Detect Environment

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
# Capture now, while still inside the workspace — Step 5 changes directory
# before cleanup (Step 6) needs this value
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

This determines which menu to show and how cleanup works:

| State | Menu | Cleanup |
|-------|------|---------|
| `GIT_DIR == GIT_COMMON` (normal repo) | Standard 3 options | No worktree to clean up |
| `GIT_DIR != GIT_COMMON`, named branch | Standard 3 options | Provenance-based (see Step 6) |
| `GIT_DIR != GIT_COMMON`, detached HEAD | Reduced 2 options (no merge) | Externally managed — leave in place |

## Step 3: Determine Base Branch

The base branch is whatever this work forked from — usually named in the
plan, the conversation, or the branch's upstream. If it is not already
known, ask: "This branch split from <your best guess> - is that correct?"
Confirm before merging: merging into the wrong base is expensive to undo.

## Step 4: Present Options

**Normal repo and named-branch worktree — present exactly these 3 options:**

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)

Which option?
```

**Detached HEAD — present exactly these 2 options:**

```
Implementation complete. You're on a detached HEAD (externally managed workspace).

1. Push as new branch and create a Pull Request
2. Keep as-is (I'll handle it later)

Which option?
```

Present the menu exactly as written — concise, with every option coming
from the list above. Discarding the work happens only in response to your
human partner explicitly asking for it (see "If your human partner asks to
discard the work" below). Wait for their answer; the integration decision
is theirs.

## Step 5: Execute Choice

### Option 1: Merge Locally

```bash
# Get main repo root for CWD safety
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"

# Merge first — verify success before removing anything
git checkout <base-branch>
git pull
git merge <feature-branch>

# Verify tests on merged result
<test command>
```

If tests fail on the merged result: stop, leave the worktree and branch in
place, and investigate — nothing has been pushed, so the merge is local
and recoverable.

Once the merged result is green: clean up the worktree (Step 6), then
delete the branch:

```bash
git branch -d <feature-branch>
```

### Option 2: Push and Create PR

```bash
git push -u origin <feature-branch>
# From a detached HEAD, name the new branch on the remote:
# git push origin HEAD:refs/heads/<new-branch>
```

Then create the pull/merge request against <base-branch> with the forge's
tooling — its CLI if one is available, or the creation URL most forges
print when you push — following the repo's PR template and conventions if
present, and report the URL to your human partner.

Once the PR exists the commits are preserved — pushed to the remote and on
a branch in the shared repo — so **clean up the worktree** (Step 6). If PR
feedback later requires changes, re-establish a workspace then.

### Option 3: Keep As-Is

The branch and its commits remain in the shared repo, so they are already
preserved. Report: "Keeping branch <name>." Then **clean up the worktree**
(Step 6) — the branch persists without it; re-establish a workspace later
if you resume work.

### If your human partner asks to discard the work

This path exists only as a response to an explicit request to throw the
work away. Confirm first:

```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for that exact confirmation. When it arrives:

```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
```

Then clean up the worktree (Step 6) and force-delete the branch:

```bash
git branch -D <feature-branch>
```

## Step 6: Cleanup Workspace

**Runs for every option, and for confirmed discards.** The worktree is
disposable scaffolding: by this point the commits are always preserved —
merged locally, pushed via PR, or sitting on a branch in the shared repo —
or intentionally discarded. The superpowers-created worktree goes away in
all cases.

Worktree removal must run from outside the worktree. Option 1 and the
discard path have already changed directory to the main repo root; Options
2 and 3 have not, so `cd` there first:

```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
```

Use the `GIT_DIR`/`GIT_COMMON`/`WORKTREE_PATH` values captured in Step 2,
from before any directory change.

**Before deleting the branch:** if the feature branch is still checked out in a worktree, `git
branch -d` fails. Leave that worktree first — via your platform's workspace-exit tool if it has one,
otherwise from the main repo root — then delete. This bites specifically on the path
`using-git-worktrees` prefers: a native worktree tool places the workspace outside `.worktrees/`,
where the rule below declines to clean it up, and the branch stays checked out.

**If `GIT_DIR == GIT_COMMON`:** Normal repo, no worktree to clean up. Done.

**If `WORKTREE_PATH` is under `.worktrees/` or `worktrees/`:** Superpowers
created this worktree — we own cleanup:

```bash
git worktree remove "$WORKTREE_PATH"
git worktree prune  # Self-healing: clean up any stale registrations
```

**Otherwise:** The host environment owns this workspace — leave it in
place. If your platform provides a workspace-exit tool, use it.

## Quick Reference

| Option | Merge | Push | Cleanup Worktree | Cleanup Branch |
|--------|-------|------|------------------|----------------|
| 1. Merge locally | yes | - | yes | yes |
| 2. Create PR | - | yes | yes | - |
| 3. Keep as-is | - | - | yes | - |
| Discard (explicit request only) | - | - | yes | yes (force) |

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Tests passed earlier this session" | Run the suite on the tree you are about to integrate. A green run only proves the tree it ran on. |
| "They obviously want it merged" | Integration is your human partner's decision. Present the menu and wait. |
| "They seem done with this feature — I'll offer to discard it" | The menu is complete as written. Discard happens only when your human partner asks for it in so many words. |
| "'Yeah, get rid of it' counts as confirmation" | Only the typed word `discard` authorizes deletion. |
| "PR feedback might come back — I'll keep the worktree around" | The commits are on the remote and on a branch. The worktree is disposable scaffolding: remove it, and re-establish a workspace if feedback needs work. |
| "This other worktree looks stale — I'll clean it too" | Clean up only worktrees under `.worktrees/` or `worktrees/`. Everything else belongs to the host. |
| "The merged-result failure is probably flaky" | A failing merged result stops everything. Branch and worktree stay put while you investigate. |
| "The base branch is obviously main" | Confirm the fork point or ask. Merging into the wrong base is expensive to undo. |
| "The caller said the whole run is autonomous, so I'll pick a menu option too" | Autonomy is about not interrupting work in progress. The work is finished; the merge is the human's, same as always. Present the menu and wait. |
| "The push was rejected — force-push will fix it" | A rejected push means the remote moved. Investigate; force-push only on your human partner's explicit request. |
| "The spec is close enough to what we built" | Step 1.5 is not optional when the plan header names a `Spec:`. The next person reads the design doc, not this session. |
