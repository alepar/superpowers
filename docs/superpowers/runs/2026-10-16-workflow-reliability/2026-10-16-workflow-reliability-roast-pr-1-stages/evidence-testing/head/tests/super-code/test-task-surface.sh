#!/usr/bin/env bash
# Tests for skills/super-code/scripts/task-surface: bytes/4 of files at the base commit.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
S="$REPO_ROOT/skills/super-code/scripts/task-surface"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_has() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing: $2"; fi; }
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; err=$(cat "$T/err"); }

R="$T/repo"
mkdir -p "$R"
cd "$R"
git init -q .
git config user.name t
git config user.email t@t
head -c 400 /dev/zero | tr '\0' a > a.txt
head -c 100 /dev/zero | tr '\0' b > b.txt
git add . && git commit -qm base
base=$(git rev-parse HEAD)
head -c 4000 /dev/zero | tr '\0' a > a.txt
head -c 50 /dev/zero | tr '\0' c > c.txt
git add c.txt && git commit -qm later

echo "task-surface: sizes"
run bash "$S" --base "$base" a.txt b.txt
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "125" "sums the sizes at the base commit, not the working tree (400+100)/4"
run bash "$S" --base "$base" a.txt c.txt
assert_eq "$out" "100" "a file missing at the base counts 0"
assert_has "$err" "not at $base: c.txt" "the missing file is named on stderr"
run bash "$S" --base "$base" b.txt
assert_eq "$out" "25" "a single file"

echo "task-surface: bad input"
run bash "$S" --base deadbeefdeadbeef a.txt
assert_eq "$code" 2 "unknown sha exits 2"
run bash "$S" --base "$base"
assert_eq "$code" 2 "no paths exits 2"
run bash "$S"
assert_eq "$code" 2 "no arguments exits 2"

[ "$FAILURES" -eq 0 ] || { echo "task-surface: $FAILURES failure(s)"; exit 1; }
echo "task-surface: all tests passed"
