#!/usr/bin/env bash
# remove-task-worktree excludes /.tmp/ in WORKTREE's own repository, never in a path relative to
# the caller's cwd: `git rev-parse --git-common-dir` prints a relative `.git` for a main checkout.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
RTW="$ROOT/skills/super-code/scripts/remove-task-worktree"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
export GIT_AUTHOR_NAME=x GIT_AUTHOR_EMAIL=x@x GIT_COMMITTER_NAME=x GIT_COMMITTER_EMAIL=x@x
fail=0
pass() { echo "  [PASS] $1"; }
bad() { echo "  [FAIL] $1"; fail=1; }

for r in caller target; do
  git init -q -b main "$T/$r"
  git -C "$T/$r" commit -q --allow-empty -m base
  git -C "$T/$r" branch task
done
mkdir "$T/caller/sub"

# Called from another repository's subdirectory on a target that is a main checkout: the guards
# keep the target, and the exclude lands in the target's repository only.
(cd "$T/caller/sub" && bash "$RTW" "$T/target" task main) >/dev/null 2>&1 || true
if grep -qx '/.tmp/' "$T/target/.git/info/exclude"; then pass "the exclude is written to the target's repository"; else bad "the exclude is written to the target's repository"; fi
if [ ! -e "$T/caller/sub/.git" ] && ! grep -qx '/.tmp/' "$T/caller/.git/info/exclude" 2>/dev/null; then
  pass "nothing is written relative to the caller's cwd"
else bad "nothing is written relative to the caller's cwd"; fi

[ "$fail" = 0 ] && echo "all passed" || { echo "failures"; exit 1; }
