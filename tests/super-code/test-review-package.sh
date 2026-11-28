#!/usr/bin/env bash
# Tests for skills/super-code/scripts/review-package: SDD's review package with run records,
# evidence and vendored trees out of review scope (the globs the coordinator passes to
# `dispatch-text review-inputs`), one "excluded:" line per tree, and the whole range when every
# changed path is out of scope.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RP="$REPO_ROOT/skills/super-code/scripts/review-package"
SDD_RP="$REPO_ROOT/skills/subagent-driven-development/scripts/review-package"
T=$(mktemp -d "${TMPDIR:-/tmp}/review-package.XXXXXX")
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_has() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing: $2"; fi; }
assert_lacks() { if printf '%s\n' "$1" | grep -qF -- "$2"; then fail "$3"; echo "    unexpected: $2"; else pass "$3"; fi; }
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; }

G=(git -c user.email=t@example.com -c user.name=t -c commit.gpgsign=false)
R="$T/repo"
mkdir -p "$R"
cd "$R"
git init -q
printf 'plan\n' > plan.md
printf 'a\n' > src.js
"${G[@]}" add . && "${G[@]}" commit -qm base
BASE=$(git rev-parse HEAD)

echo "review-package: out-of-scope trees are listed, not diffed"
mkdir -p src docs/superpowers/runs/2026-11-27-x/reviews evidence vendor/lib third_party/dep
printf 'b\n' > src.js
printf 'code\n' > src/new.js
printf 'record\n' > docs/superpowers/runs/2026-11-27-x/run.md
printf 'archived review\n' > docs/superpowers/runs/2026-11-27-x/reviews/r1.md
printf 'spec\n' > docs/superpowers/runs/2026-11-27-x/2026-11-27-x-design.md
printf 'log\n' > evidence/run.log
printf 'vendored\n' > vendor/lib/a.c
printf 'third\n' > third_party/dep/b.c
"${G[@]}" add . && "${G[@]}" commit -qm mixed
HEAD1=$(git rev-parse HEAD)
run bash "$RP" plan.md "$BASE" "$HEAD1" "$T/mixed.diff"
assert_eq "$code" 0 "a mixed range packages"
pkg=$(cat "$T/mixed.diff")
assert_has "$pkg" "diff --git a/src.js b/src.js" "product code is diffed"
assert_has "$pkg" "diff --git a/src/new.js b/src/new.js" "new product code is diffed"
assert_has "$pkg" "2026-11-27-x-design.md" "a run's dated design spec is kept"
assert_lacks "$pkg" "run.md" "run records are not diffed or stat'ed"
assert_lacks "$pkg" "reviews/r1.md" "archived reviews are not diffed"
assert_lacks "$pkg" "evidence/run.log" "evidence is not diffed"
assert_lacks "$pkg" "vendor/lib/a.c" "vendor is not diffed"
assert_lacks "$pkg" "third_party/dep/b.c" "third_party is not diffed"
assert_has "$pkg" "## Out of review scope" "the package has an out-of-scope section"
assert_has "$pkg" "- excluded: docs/superpowers/runs/ (2 files changed)" "one runs line, the kept spec not counted"
assert_has "$pkg" "- excluded: evidence/ (1 files changed)" "one evidence line"
assert_has "$pkg" "- excluded: vendor/ (1 files changed)" "one vendor line"
assert_has "$pkg" "- excluded: third_party/ (1 files changed)" "one third_party line"
assert_has "$pkg" "## Commits" "the commit list is kept"
assert_has "$out" "5 path(s) out of scope" "the summary line counts the out-of-scope paths"

echo "review-package: --exclude and --keep add to the defaults"
run bash "$RP" --exclude 'src/**' --keep 'vendor/lib/*.c' plan.md "$BASE" "$HEAD1" "$T/extra.diff"
assert_eq "$code" 0 "extra globs package"
pkg=$(cat "$T/extra.diff")
assert_lacks "$pkg" "src/new.js" "an extra --exclude glob leaves its tree out"
assert_has "$pkg" "- excluded: src/ (1 files changed)" "an extra --exclude glob gets its own line"
assert_has "$pkg" "diff --git a/vendor/lib/a.c b/vendor/lib/a.c" "an extra --keep glob keeps a path inside a default exclude"
assert_lacks "$pkg" "excluded: vendor/" "a fully kept tree gets no excluded line"
assert_lacks "$pkg" "run.md" "the defaults still apply"

echo "review-package: a range wholly inside out-of-scope trees is packaged whole"
printf 'vendored 2\n' > vendor/lib/a.c
"${G[@]}" commit -qam vendor-only
HEAD2=$(git rev-parse HEAD)
run bash "$RP" plan.md "$HEAD1" "$HEAD2" "$T/vendor.diff"
assert_eq "$code" 0 "a vendor-only range packages"
pkg=$(cat "$T/vendor.diff")
assert_has "$pkg" "diff --git a/vendor/lib/a.c b/vendor/lib/a.c" "the vendor patch is diffed"
assert_has "$pkg" "this package covers the whole range" "the package says why it is whole"
assert_has "$pkg" "- excluded: vendor/ (1 files changed)" "the tree is still named"

echo "review-package: a range with nothing out of scope matches SDD's package"
printf 'c\n' > src.js
"${G[@]}" commit -qam plain
HEAD3=$(git rev-parse HEAD)
run bash "$RP" plan.md "$HEAD2" "$HEAD3" "$T/plain.diff"
assert_eq "$code" 0 "a plain range packages"
bash "$SDD_RP" plan.md "$HEAD2" "$HEAD3" "$T/plain-sdd.diff" >/dev/null
if cmp -s "$T/plain.diff" "$T/plain-sdd.diff"; then pass "byte-identical to SDD's package"; else fail "byte-identical to SDD's package"; diff "$T/plain-sdd.diff" "$T/plain.diff" | head; fi

echo "review-package: SDD's guards and defaults hold"
run bash "$RP" plan.md "$HEAD3" "$HEAD3" "$T/empty.diff"
assert_eq "$code" 3 "an empty commit range exits 3"
run bash "$RP" plan.md "$HEAD3" "$BASE" "$T/back.diff"
assert_eq "$code" 3 "a HEAD that does not descend from BASE exits 3"
"${G[@]}" commit -q --allow-empty -m noop
run bash "$RP" plan.md "$HEAD3" HEAD "$T/noop.diff"
assert_eq "$code" 3 "a range with no net diff exits 3"
assert_has "$(cat "$T/err")" "EMPTY RANGE" "and says so"
[ ! -e "$T/noop.diff" ] && pass "no header-only package is written" || fail "no header-only package is written"
run bash "$RP" "$BASE" "$HEAD1"
assert_eq "$code" 2 "missing args exit 2"
run bash "$RP" --exclude plan.md "$BASE" "$HEAD1"
assert_eq "$code" 2 "--exclude consumes its GLOB, so plan.md is not read as PLAN_FILE"
run bash "$RP" --bogus plan.md "$BASE" "$HEAD1"
assert_eq "$code" 2 "an unknown option exits 2"
run bash "$RP" plan.md "$BASE" "$HEAD1"
assert_eq "$code" 0 "the default OUTFILE works"
case "$out" in "wrote $R/.superpowers/sdd/plan/review-"*.diff:*) pass "the default OUTFILE lands in the plan's SDD workspace" ;; *) fail "the default OUTFILE lands in the plan's SDD workspace"; echo "    got: $out" ;; esac

if [ "$FAILURES" -eq 0 ]; then echo "All review-package tests passed"; else echo "$FAILURES failure(s)"; exit 1; fi
