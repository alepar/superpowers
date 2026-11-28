#!/usr/bin/env bash
# Tests for skills/super-code/scripts/added-bytes: history bytes a branch adds, including files
# deleted or compressed after they were committed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
S="$REPO_ROOT/skills/super-code/scripts/added-bytes"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_has() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing: $2"; fi; }
assert_lacks() { if printf '%s\n' "$1" | grep -qF -- "$2"; then fail "$3"; echo "    unexpected: $2"; else pass "$3"; fi; }
run() { set +e; out=$(cd "$R" && bash "$S" "$@" 2>"$T/err"); code=$?; set -e; }
bytes() { head -c "$2" /dev/zero | tr '\0' "$3" > "$1"; }
g() { git -C "$R" -c user.name=t -c user.email=t@example.invalid "$@"; }

R="$T/repo"
git init -q "$R"
bytes "$R/base.txt" 100 b
g add -A; g commit -qm base; g branch -q base
g checkout -qb task
bytes "$R/code.txt" 300 c
g add -A; g commit -qm code

echo "added-bytes: under the limit"
run base task
assert_eq "$code" 0 "exits 0"
assert_eq "$out" "added: 300 of 5242880 (ok)" "counts only the branch's new blob, default limit"

echo "added-bytes: a raw file committed, then deleted, still counts"
mkdir -p "$R/evidence/t1"
bytes "$R/evidence/t1/raw.log" 2000 r
g add -A; g commit -qm raw
g rm -q evidence/t1/raw.log; g commit -qm drop
run base task --limit 1000
assert_eq "$code" 0 "exits 0 when over"
assert_has "$out" "added: 2300 of 1000 (over)" "deleted blob still in the total"
assert_has "$out" "blob: 2000 evidence/t1/raw.log" "largest blob listed with its path"
first=$(printf '%s\n' "$out" | sed -n 2p)
assert_eq "$first" "blob: 2000 evidence/t1/raw.log" "blobs largest first"
assert_has "$out" "blob: 300 code.txt" "smaller blob listed too"

echo "added-bytes: equal to the limit is ok"
run base task --limit 2300
assert_eq "$out" "added: 2300 of 2300 (ok)" "total equal to the limit is ok"
assert_lacks "$out" "blob:" "no blob lines when ok"

echo "added-bytes: base commits are not counted"
run task task
assert_eq "$out" "added: 0 of 5242880 (ok)" "empty range is 0"

echo "added-bytes: bad usage"
run base
assert_eq "$code" 2 "one argument exits 2"
run base task --limit 5x
assert_eq "$code" 2 "non-numeric limit exits 2"
run base nosuchref
assert_eq "$code" 2 "unknown ref exits 2"

if [ "$FAILURES" -ne 0 ]; then echo "FAILED: $FAILURES"; exit 1; fi
echo "All added-bytes tests passed."
