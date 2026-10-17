#!/usr/bin/env bash
# Tests for skills/super-code/scripts/split-oversized: refusals, the graph rewrite against a real bd
# in a temp repo, and a simulated mid-filing failure.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
S="$REPO_ROOT/skills/super-code/scripts/split-oversized"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_has() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing: $2"; echo "    in: $1"; fi; }
assert_lacks() { if printf '%s\n' "$1" | grep -qF -- "$2"; then fail "$3"; echo "    unexpected: $2"; else pass "$3"; fi; }
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; err=$(cat "$T/err"); }

echo "split-oversized: no jq"
# A PATH holding only the tools the script needs before its jq check (bash, env), no jq.
mkdir -p "$T/nojq"
for t in bash env dirname cat; do ln -s "$(command -v "$t")" "$T/nojq/$t"; done
printf '{}' > "$T/empty.json"
run env PATH="$T/nojq" "$(command -v bash)" "$S" "$T/empty.json"
assert_eq "$code" 4 "exits 4 without jq"
assert_has "$out" "JQ_UNAVAILABLE:" "prints the JQ_UNAVAILABLE: line"

if ! command -v bd >/dev/null 2>&1; then echo "[SKIP] bd not installed"; [ "$FAILURES" -eq 0 ] && exit 0 || exit 1; fi
if ! command -v jq >/dev/null 2>&1; then echo "[SKIP] jq not installed"; [ "$FAILURES" -eq 0 ] && exit 0 || exit 1; fi

# Keep every bd database under $T.
unset BEADS_DIR BEADS_DB BEADS_DOLT_SERVER_HOST BEADS_DOLT_SERVER_PORT BD_NON_INTERACTIVE 2>/dev/null || true
for v in $(env | sed -n 's/^\(BEADS_[A-Za-z_]*\)=.*/\1/p'); do unset "$v"; done
export HOME="$T/home" XDG_CONFIG_HOME="$T/home" XDG_DATA_HOME="$T/home" XDG_STATE_HOME="$T/home" XDG_CACHE_HOME="$T/home"
mkdir -p "$HOME"
REALBD=$(command -v bd)

R="$T/repo"
mkdir -p "$R"
cd "$R"
git init -q .
git config user.name t
git config user.email t@t
bd init --prefix t --non-interactive --quiet >/dev/null 2>&1 || { echo "[SKIP] bd init failed"; [ "$FAILURES" -eq 0 ] && exit 0 || exit 1; }

mk() { bd create "$@" --silent | tail -n 1; }
E=$(mk "epic" -t epic -l sp:E)
U=$(mk "upstream" --parent "$E" --no-inherit-labels -l sp:E -t task)
ACC=$'- [ ] first item\n- [ ] second item\n- [x] third item'
O=$(mk "original" --parent "$E" --no-inherit-labels -l sp:E -t task \
  -d "orig body
blocked-by $U: consumes the U schema" --acceptance "$ACC" --deps "blocked-by:$U")
D1=$(mk "dep one" --parent "$E" --no-inherit-labels -l sp:E -t task -d "dep one text" --deps "blocked-by:$O")
D2=$(mk "dep two" --parent "$E" --no-inherit-labels -l sp:E -t task -d "dep two text" --deps "blocked-by:$O")
count() { bd list --all --json --limit 0 | jq 'length'; }
before=$(count)

prop() { # extra jq filter on a good proposal
  jq -n --arg id "$O" '{id: $id, reason: "too big",
    filesTouched: ["a.sh"], filesToRead: ["r.md"],
    children: [
      {title: "child A", filesTouched: ["a.sh"], filesToRead: ["r.md"], acceptance: "- [ ] first item\n- [ ] second item"},
      {title: "child B", filesTouched: ["a.sh"], filesToRead: [], acceptance: "- [ ] third item"}]}' |
    jq "$1" > "$T/p.json"
}

echo "split-oversized: bad input"
printf '{"id":"%s","children":[{"title":"x","acceptance":"- [ ] a"}]}' "$O" > "$T/p.json"
run bash "$S" "$T/p.json"
assert_eq "$code" 2 "one child exits 2"
run bash "$S" "$T/nonexistent.json"
assert_eq "$code" 2 "missing proposal file exits 2"

echo "split-oversized: refusals"
prop '.children[1].filesToRead = ["elsewhere.md"]'
run bash "$S" "$T/p.json"
assert_eq "$code" 3 "file outside the original's files: exits 3"
assert_has "$out" 'refused: child "child B" names elsewhere.md, outside the original'"'"'s files' "names the child and the file"
assert_eq "$(count)" "$before" "no beads were filed"
prop '.children[1].acceptance = "- [ ] something else"'
run bash "$S" "$T/p.json"
assert_eq "$code" 3 "missing checklist item: exits 3"
assert_has "$out" 'refused: no child carries checklist item "third item"' "names the missing item (checked item matched without its box)"
assert_eq "$(count)" "$before" "no beads were filed"

echo "split-oversized: mid-filing failure"
mkdir -p "$T/shim"
cat > "$T/shim/bd" <<SHIM
#!/usr/bin/env bash
if [ "\${1:-}" = create ]; then
  n=\$(cat "$T/create-count" 2>/dev/null || echo 0); n=\$((n + 1)); echo \$n > "$T/create-count"
  if [ "\$n" = 2 ]; then echo "simulated create failure" >&2; exit 1; fi
fi
exec "$REALBD" "\$@"
SHIM
chmod +x "$T/shim/bd"
prop '.'
run env PATH="$T/shim:$PATH" bash "$S" "$T/p.json"
assert_eq "$code" 5 "failure before supersede exits 5"
assert_has "$out" "filing failed: create child 2 — simulated create failure" "names the failed step and bd's reason"
filed1=$(printf '%s\n' "$out" | sed -n 's/^filed: //p')
assert_eq "$(printf '%s' "$filed1" | grep -c "^t-")" 1 "lists the one child filed"
assert_eq "$(bd show "$O" --json | jq -r '.[0].status')" open "the original is still open (not superseded)"
assert_eq "$(count)" "$((before + 1))" "exactly the listed child exists"
bd close "$filed1" >/dev/null 2>&1 || true

echo "split-oversized: success"
prop '.'
run bash "$S" "$T/p.json"
assert_eq "$code" 0 "exits 0"
assert_has "$out" "split: $O → " "prints the split line"
ids=$(printf '%s\n' "$out" | sed -n 's/^split: [^ ]* → //p')
C1=${ids%%,*}
C2=${ids##*,}
assert_eq "$(printf '%s' "$ids" | tr ',' '\n' | grep -c .)" 2 "two children"
for c in "$C1" "$C2"; do
  j=$(bd show "$c" --json)
  assert_eq "$(printf '%s' "$j" | jq -r '.[0].parent')" "$E" "$c: parent is the original's parent"
  assert_eq "$(printf '%s' "$j" | jq -c '.[0].labels')" '["sp:E"]' "$c: labels exactly sp:E"
  assert_eq "$(printf '%s' "$j" | jq -r --arg u "$U" '[.[0].dependencies[] | select(.dependency_type=="blocks") | .id] | index($u) != null')" true "$c: depends on the original's upstream"
  assert_has "$(printf '%s' "$j" | jq -r '.[0].description')" "blocked-by $U: consumes the U schema" "$c: copied blocked-by line with the original's reason"
  assert_has "$(printf '%s' "$j" | jq -r '.[0].description')" "Split from $O: too big" "$c: description says what it split from"
done
assert_has "$(bd show "$C1" --json | jq -r '.[0].acceptance_criteria')" "first item" "child A carries its acceptance"
for d in "$D1" "$D2"; do
  j=$(bd show "$d" --json)
  for c in "$C1" "$C2"; do
    assert_eq "$(printf '%s' "$j" | jq -r --arg c "$c" '[.[0].dependencies[] | select(.dependency_type=="blocks") | .id] | index($c) != null')" true "$d depends on $c"
    assert_has "$(printf '%s' "$j" | jq -r '.[0].description')" "blocked-by $c: consumes split of $O" "$d: blocked-by line for $c"
  done
done
assert_has "$(bd show "$D1" --json | jq -r '.[0].description')" "dep one text" "D1 keeps its old description text"
assert_has "$(bd show "$D2" --json | jq -r '.[0].description')" "dep two text" "D2 keeps its old description text"
assert_eq "$(bd show "$O" --json | jq -r '.[0].status')" closed "the original is superseded (closed)"
ready=$(bd ready --json --limit 0 | jq -r '.[].id')
assert_lacks "$ready" "$D1" "D1 is not ready"
assert_lacks "$ready" "$D2" "D2 is not ready"
assert_lacks "$ready" "$C1" "a child is blocked while the upstream is open"
bd close "$U" >/dev/null
ready=$(bd ready --json --limit 0 | jq -r '.[].id')
assert_has "$ready" "$C1" "a child is ready once the upstream closes"
assert_lacks "$ready" "$D1" "D1 stays not ready while the children are open"

[ "$FAILURES" -eq 0 ] || { echo "split-oversized: $FAILURES failure(s)"; exit 1; }
echo "split-oversized: all tests passed"
