#!/usr/bin/env bash
# Tests for skills/super-code/scripts/assembled-size: size/fits/cluster-fits lines, cluster coverage,
# --clusters-required, and the report-verdict hand-off.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
S="$REPO_ROOT/skills/super-code/scripts/assembled-size"
RV="$REPO_ROOT/skills/super-code/scripts/report-verdict"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_has() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing: $2"; fi; }
assert_lacks() { if printf '%s\n' "$1" | grep -qF -- "$2"; then fail "$3"; echo "    unexpected: $2"; else pass "$3"; fi; }
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; }
bytes() { head -c "$2" /dev/zero | tr '\0' 'x' > "$1"; }

# A fitting dir: digest 4000 bytes (1000 tokens), slices/a.diff 2000 (500), diffstat 400 (100).
D="$T/fit"
mkdir -p "$D/slices"
bytes "$D/digest.md" 4000; bytes "$D/slices/a.diff" 2000; bytes "$D/diffstat.txt" 400

echo "assembled-size: size and fits lines"
run bash "$S" "$D" --threshold 2000
assert_eq "$code" 0 "exits 0 when it fits"
assert_has "$out" "size: diffstat.txt 100" "size line for diffstat.txt (bytes / 4)"
assert_has "$out" "size: digest.md 1000" "size line for digest.md"
assert_has "$out" "size: slices/a.diff 500" "size line for a slice, path relative to the dir"
assert_has "$out" "fits: yes (1500 of 2000)" "fits: yes; total is digest + slices, not diffstat"
sizes=$(printf '%s\n' "$out" | grep '^size:' | awk '{print $2}' | tr '\n' ' ')
assert_eq "$sizes" "diffstat.txt digest.md slices/a.diff " "size lines are sorted by path"
run bash "$S" "$D" --threshold 1000
assert_eq "$code" 0 "exits 0 when it does not fit"
assert_has "$out" "fits: no (1500 of 1000)" "fits: no when over the threshold"
run bash "$S" "$D" --threshold 1500
assert_has "$out" "fits: yes (1500 of 1500)" "total equal to the threshold fits"
run bash "$S" "$D" --threshold 2000
assert_lacks "$out" "cluster-fits" "no clusters.json: no cluster-fits lines"
run bash "$S" "$D" --threshold 2000
printf '%s\n' "$out" > "$T/o.txt"
rv=$(bash "$RV" "$T/o.txt")
assert_has "$rv" "kind: assembled" "output is recognised by report-verdict"
assert_has "$rv" "verdict: fits: yes (1500 of 2000)" "report-verdict reads the fits verdict"

echo "assembled-size: clusters"
C="$T/cl"; mkdir -p "$C/slices"
bytes "$C/digest.md" 400; bytes "$C/slices/a.diff" 800; bytes "$C/slices/b.diff" 4000; bytes "$C/diffstat.txt" 40
cat > "$C/clusters.json" <<'J'
{"changed":["src/a.js","src/b.js","lib/c.js"],
 "clusters":[{"name":"src","files":["src/a.js","src/b.js"],"slices":["slices/a.diff","slices/b.diff"]},
             {"name":"lib","files":["lib/c.js"],"slices":["slices/missing.diff"]}]}
J
run bash "$S" "$C" --threshold 1000
assert_eq "$code" 0 "valid clusters: exit 0"
assert_has "$out" "cluster-fits: src no (1200 of 1000)" "cluster sum over its slices; over threshold is no"
assert_has "$out" "cluster-fits: lib yes (0 of 1000)" "a missing slice file counts 0"
order=$(printf '%s\n' "$out" | grep '^cluster-fits:' | awk '{print $2}' | tr '\n' ' ')
assert_eq "$order" "src lib " "cluster-fits lines are in file order"
assert_lacks "$out" "size: clusters.json" "clusters.json is not a size line"
printf '%s\n' "$out" > "$T/o.txt"
rv=$(bash "$RV" "$T/o.txt")
assert_has "$rv" "cluster-fits: src no" "report-verdict surfaces a cluster reported no as an item"

cat > "$C/clusters.json" <<'J'
{"changed":["src/a.js","src/b.js"],
 "clusters":[{"name":"x","files":["src/a.js","src/b.js"],"slices":[]},{"name":"y","files":["src/b.js"],"slices":[]}]}
J
run bash "$S" "$C" --threshold 1500
assert_eq "$code" 3 "a changed file in two clusters: exit 3"
assert_has "$out" "coverage: src/b.js in 2 clusters" "names the file and its cluster count"
run bash "$S" "$C" --threshold 6000
assert_eq "$code" 3 "bad coverage with inputs under the threshold: still exit 3"
assert_has "$out" "fits: yes (" "exit 3 still prints a valid fits: yes line"
fl=$(printf '%s\n' "$out" | grep -n '^fits:' | head -1 | cut -d: -f1)
cl=$(printf '%s\n' "$out" | grep -n '^coverage:' | head -1 | cut -d: -f1)
[ -n "$fl" ] && [ -n "$cl" ] && [ "$fl" -lt "$cl" ] && echo "ok: fits line precedes the first coverage line" || { echo "FAIL: fits line must precede coverage (fits=$fl coverage=$cl)"; exit 1; }
assert_lacks "$out" "cluster-fits" "no cluster-fits lines on bad coverage"
cat > "$C/clusters.json" <<'J'
{"changed":["src/a.js","src/b.js"],"clusters":[{"name":"x","files":["src/a.js"],"slices":[]}]}
J
run bash "$S" "$C" --threshold 1500
assert_eq "$code" 3 "a changed file in no cluster: exit 3"
assert_has "$out" "coverage: src/b.js in 0 clusters" "names the uncovered file"
cat > "$C/clusters.json" <<'J'
{"changed":["src/a.js"],"clusters":[{"name":"x","files":["src/a.js","src/z.js"],"slices":[]}]}
J
run bash "$S" "$C" --threshold 1500
assert_eq "$code" 3 "a cluster file that is not changed: exit 3"
assert_has "$out" "coverage: src/z.js" "names the stray cluster file"

echo "assembled-size: --clusters-required"
run bash "$S" "$D" --threshold 2000 --clusters-required
assert_eq "$code" 3 "no clusters.json: exit 3"
assert_has "$out" "clusters: required but missing or empty" "says so"
assert_has "$out" "fits: yes (1500 of 2000)" "after the size and fits lines"
echo '{"changed":[],"clusters":[]}' > "$D/clusters.json"
run bash "$S" "$D" --threshold 2000 --clusters-required
assert_eq "$code" 3 "empty clusters array: exit 3"
assert_has "$out" "clusters: required but missing or empty" "says so for an empty array"
run bash "$S" "$D" --threshold 2000
assert_eq "$code" 0 "an empty clusters.json without --clusters-required is fine"
echo 'not json' > "$D/clusters.json"
run bash "$S" "$D" --threshold 2000 --clusters-required
assert_eq "$code" 3 "unparsable clusters.json with --clusters-required: exit 3"
rm "$D/clusters.json"

echo "assembled-size: no jq"
mkdir -p "$T/bin"
for t in find wc sort sed tr awk cat dirname basename head; do ln -sf "$(command -v $t)" "$T/bin/$t"; done
echo '{"changed":[],"clusters":[{"name":"x","files":[],"slices":[]}]}' > "$D/clusters.json"
set +e; out=$(PATH="$T/bin" "$(command -v bash)" "$S" "$D" --threshold 2000 2>"$T/err"); code=$?; set -e
assert_eq "$code" 4 "clusters.json without jq: exit 4"
assert_has "$out" "JQ_UNAVAILABLE:" "prints the JQ_UNAVAILABLE line"
rm "$D/clusters.json"
set +e; out=$(PATH="$T/bin" "$(command -v bash)" "$S" "$D" --threshold 2000 2>"$T/err"); code=$?; set -e
assert_eq "$code" 0 "no clusters.json needs no jq"

echo "assembled-size: bad usage"
run bash "$S" "$T/nope" --threshold 2000
assert_eq "$code" 2 "missing dir: exit 2"
run bash "$S" "$D" --threshold abc
assert_eq "$code" 2 "non-integer threshold: exit 2"
run bash "$S" "$D"
assert_eq "$code" 2 "no threshold: exit 2"
run bash "$S" "$D" --threshold 10 --bogus
assert_eq "$code" 2 "unknown option: exit 2"
run bash "$S"
assert_eq "$code" 2 "no arguments: exit 2"

echo
if [ "$FAILURES" -eq 0 ]; then echo "assembled-size: all tests passed"; else echo "assembled-size: $FAILURES failure(s)"; exit 1; fi
