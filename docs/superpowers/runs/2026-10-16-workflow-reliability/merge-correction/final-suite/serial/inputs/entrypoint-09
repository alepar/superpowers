#!/usr/bin/env bash
# Tests for the redesign-round filing lifecycle: amend-check's `supersedes:` rules, and the filing
# sequence in skills/super-design/SKILL.md §Amend Mode step 4, run against a stub `bd`.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
S="$REPO_ROOT/skills/super-design/scripts"
F="$SCRIPT_DIR/fixtures/redesign-cycle-filing"
FAILURES=0
TMPROOT="$(mktemp -d)"
trap 'rm -rf "$TMPROOT"' EXIT

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

assert_eq() {
  if [ "$1" = "$2" ]; then pass "$3"; else
    fail "$3"
    echo "    expected:"; printf '%s\n' "$2" | sed 's/^/      /'
    echo "    got:";      printf '%s\n' "$1" | sed 's/^/      /'
  fi
}

assert_has() {
  if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else
    fail "$3"
    echo "    expected a line containing: $2"
    echo "    got:"; printf '%s\n' "$1" | sed 's/^/      /'
  fi
}

assert_lacks() {
  if printf '%s\n' "$1" | grep -qF -- "$2"; then
    fail "$3"
    echo "    unexpected line containing: $2"
    echo "    got:"; printf '%s\n' "$1" | sed 's/^/      /'
  else pass "$3"; fi
}

# case_run NAME LOOP RECORD: sets $out (stdout+stderr) and $code.
case_run() {
  local name=$1 loop=$2 record=$3
  local d="$TMPROOT/$name"
  mkdir -p "$d/docs"
  git -C "$d" init -q
  git -C "$d" config user.email t@example.com
  git -C "$d" config user.name t
  cp "$F/spec-base.md" "$d/docs/spec.md"
  git -C "$d" add -A
  git -C "$d" commit -q -m base
  cp "$F/spec-edit-ok.md" "$d/docs/spec.md"
  set +e
  out=$(cd "$d" && bash "$S/amend-check" --loop "$loop" --amend "$F/$record" --ledger "$F/ledger.md" --specs docs/spec.md 2>&1)
  code=$?
  set -e
}

echo "amend-check: supersedes:"
case_run sd design amend-design-ok.md
assert_eq "$out" "ok" "design record with supersedes: passes"
assert_eq "$code" 0 "design ok exit 0"

case_run sb design amend-design-bad-title.md
assert_eq "$code" 3 "supersedes: naming no work: title: exit 3"
assert_has "$out" "reject: supersedes: no work: line titled: No such title" "bad title named"

case_run sc code amend-design-ok.md
assert_eq "$code" 3 "supersedes: under --loop code: exit 3"
assert_has "$out" "reject: supersedes: code loop supersedes nothing: bd-7" "code loop rejects the first item"

case_run sk code amend-code-ok.md
assert_eq "$out" "ok" "code record without supersedes: passes"

case_run se design amend-design-escaped.md
assert_eq "$out" "ok" "design record with <, &, \" and -> in a work: title passes"

case_run sn design amend-design-no-work.md
assert_eq "$out" "ok" "design record with no work: lines passes"

echo "filing sequence (stub bd)"
BIN="$TMPROOT/bin"; ST="$TMPROOT/bd-state"
mkdir -p "$BIN"
cat > "$BIN/bd" <<'STUB'
#!/usr/bin/env bash
# Stub bd: one file per bead under $BD_STATE (lines: status=, parent=, labels=, title=, epic=, deps=).
set -u
echo "$*" >> "$BD_STATE/calls.log"
get() { sed -n "s/^$2=//p" "$BD_STATE/bead-$1" 2>/dev/null; }
put() { grep -v "^$2=" "$BD_STATE/bead-$1" > "$BD_STATE/tmp" 2>/dev/null || true; echo "$2=$3" >> "$BD_STATE/tmp"; mv "$BD_STATE/tmp" "$BD_STATE/bead-$1"; }
cmd=$1; shift
case "$cmd" in
  update)
    id=$1
    case "$2" in
      --status) put "$id" status "$3" ;;
      --description) printf '%s' "$3" > "$BD_STATE/desc-$id" ;;
      *) exit 1 ;;
    esac ;;
  dep) [ "$1" = add ] || exit 1
    [ -n "$2" ] && [ -n "$3" ] || { echo 'Error: resolving dependency ID : no issue found matching ""' >&2; exit 1; }
    echo "$2 $3" >> "$BD_STATE/deps.log" ;;
  list)
    label=''; while [ $# -gt 0 ]; do [ "$1" = --label ] && label=$2; shift; done
    echo "["; first=1
    for f in "$BD_STATE"/bead-*; do
      [ -e "$f" ] || continue; id=${f##*/bead-}
      case ",$(get "$id" labels)," in *",$label,"*) ;; *) continue ;; esac
      [ $first = 1 ] || echo "  ,"; first=0
      # Go-style JSON escaping, as bd 1.3.0 prints titles: \ and " backslashed, < > & as \u00XX.
      title=$(get "$id" title | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/</\\u003c/g' -e 's/>/\\u003e/g' -e 's/&/\\u0026/g')
      printf '  {\n    "id": "%s",\n    "title": "%s"\n  }\n' "$id" "$title"
    done
    echo "]" ;;
  create)
    title=$1; shift; parent='' labels=''
    while [ $# -gt 0 ]; do
      case "$1" in --parent) parent=$2; shift 2 ;; -l) labels=$2; shift 2 ;; -d) shift 2 ;; *) shift ;; esac
    done
    n=$(( $(ls "$BD_STATE" | grep -c '^bead-') + 1 )); id="new-$n"
    printf 'status=open\nparent=%s\nlabels=%s\ntitle=%s\n' "$parent" "$labels" "$title" > "$BD_STATE/bead-$id"
    echo "$id" ;;
  show)
    # Like bd 1.3.0: the bead's own fields at 4 spaces, each dependency's id/status at 8 spaces.
    desc=$(cat "$BD_STATE/desc-$1" 2>/dev/null | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' | awk 'NR > 1 { printf "\\n" } { printf "%s", $0 }')
    printf '[\n  {\n    "id": "%s",\n    "status": "%s",\n    "description": "%s",\n    "dependencies": [' "$1" "$(get "$1" status)" "$desc"
    sep=''
    for dep in $(get "$1" deps | tr ',' ' '); do
      printf '%s\n      {\n        "id": "%s",\n        "status": "%s"\n      }' "$sep" "$dep" "$(get "$dep" status)"; sep=','
    done
    printf '\n    ]\n  }\n]\n' ;;
  supersede) [ "$2" = --with ] && [ -n "${3:-}" ] || { echo 'Error: --with needs an issue id' >&2; exit 1; }
    put "$1" status closed ;;
  ready)
    echo "["; first=1
    for f in "$BD_STATE"/bead-*; do
      [ -e "$f" ] || continue; id=${f##*/bead-}
      [ "$(get "$id" status)" = open ] && [ "$(get "$id" epic)" != 1 ] || continue
      [ "$(get "$(get "$id" parent)" status)" = open ] || continue
      [ $first = 1 ] || echo "  ,"; first=0
      printf '  {\n    "id": "%s"\n  }\n' "$id"
    done
    echo "]" ;;
  *) exit 1 ;;
esac
STUB
chmod +x "$BIN/bd"

# The block under test is the first fenced bash block after Amend Mode step 4's heading line.
block=$(awk '/^4\. \*\*File the/ { on = 1 } on && /^ *```bash/ { inb = 1; next } inb && /^ *```/ { exit } inb { sub(/^   /, ""); print }' "$REPO_ROOT/skills/super-design/SKILL.md")
if [ -n "$block" ]; then pass "filing block extracted from SKILL.md"; else fail "filing block extracted from SKILL.md"; fi

seed() { # seed: root epic closed, bd-7 open under it with closed dependency bd-9, bd-9 closed
  rm -rf "$ST"; mkdir -p "$ST"
  printf 'status=closed\nparent=\nlabels=sp:ep-1\ntitle=root\nepic=1\n' > "$ST/bead-ep-1"
  printf 'status=open\nparent=ep-1\nlabels=sp:ep-1\ntitle=old retry\ndeps=bd-9\n' > "$ST/bead-bd-7"
  printf 'status=closed\nparent=ep-1\nlabels=sp:ep-1\ntitle=old b\n' > "$ST/bead-bd-9"
}
seed_sweep() { # add the Integration sweep bead sw-1 (two-line description) on top of seed
  printf 'status=open\nparent=ep-1\nlabels=sp:ep-1\ntitle=Integration sweep: root goal\n' > "$ST/bead-sw-1"
  printf 'Sweep the root goal.\nblocked-by bd-7: consumes all leaves (integration sweep)' > "$ST/desc-sw-1"
  : > "$ST/deps.log"
}
file_beads() { # file_beads LOOP LABEL RECORD: sets $out and $code
  set +e
  out=$(cd "$TMPROOT" && BD_STATE="$ST" PATH="$BIN:$PATH" ROOT=ep-1 PARENT=ep-1 LABEL="$2" LOOP="$1" AMEND="$F/$3" CONTEXT="flags: I3" bash -c "$block" 2>&1)
  code=$?
  set -e
}
status_of() { sed -n 's/^status=//p' "$ST/bead-$1"; }
calls() { cat "$ST/calls.log"; }
ready_ids() { BD_STATE="$ST" "$BIN/bd" ready --json | grep -c '"id"' || true; }

seed
file_beads design sp:redesign-design-1 amend-design-ok.md
assert_eq "$code" 0 "design loop: block exits 0"
assert_eq "$(status_of ep-1)" open "design loop: closed root epic is reopened"
first_update=$(calls | grep -n '^update ep-1 --status open' | head -1 | cut -d: -f1)
first_create=$(calls | grep -n '^create ' | head -1 | cut -d: -f1)
if [ -n "$first_update" ] && [ -n "$first_create" ] && [ "$first_update" -lt "$first_create" ]; then pass "reopen precedes the first create"; else fail "reopen precedes the first create ($first_update vs $first_create)"; fi
listing=$(BD_STATE="$ST" "$BIN/bd" list --label sp:redesign-design-1 --all --json)
assert_has "$listing" '"title": "New retry wrapper"' "bead titled New retry wrapper filed under the label"
assert_has "$listing" '"title": "Drop per-call retries"' "bead titled Drop per-call retries filed under the label"
for f in "$ST"/bead-new-*; do
  assert_eq "$(sed -n 's/^parent=//p' "$f")" ep-1 "${f##*/}: parent is the root epic"
done
new_wrapper=$(grep -l '^title=New retry wrapper$' "$ST"/bead-new-* | sed 's|.*/bead-||')
assert_has "$(calls)" "supersede bd-7 --with $new_wrapper" "bd-7 superseded by the New retry wrapper bead"
assert_eq "$(status_of bd-7)" closed "bd-7 closed by the supersede"
assert_lacks "$(calls)" "supersede bd-9" "already-closed bd-9 is not superseded"
assert_eq "$(ready_ids)" 2 "both amend beads are ready when super-code re-enters"

creates_before=$(calls | grep -c '^create ' || true)
file_beads design sp:redesign-design-1 amend-design-ok.md
assert_eq "$code" 0 "resume replay: block exits 0"
assert_eq "$(calls | grep -c '^create ' || true)" "$creates_before" "resume replay files no duplicate (title dedupe)"

seed; seed_sweep
file_beads design sp:redesign-design-1 amend-design-ok.md
assert_eq "$code" 0 "design loop with sweep: block exits 0"
new_ids=$(ls "$ST" | sed -n 's/^bead-\(new-.*\)$/\1/p')
assert_eq "$(printf '%s\n' "$new_ids" | grep -c .)" 2 "design loop with sweep: two beads filed"
for id in $new_ids; do
  assert_has "$(cat "$ST/deps.log")" "sw-1 $id" "sweep depends on $id"
  assert_has "$(cat "$ST/desc-sw-1")" "blocked-by $id: consumes all leaves (integration sweep)" "sweep description names $id"
done
assert_has "$(cat "$ST/desc-sw-1")" "Sweep the root goal." "sweep description keeps its first line"
assert_has "$(cat "$ST/desc-sw-1")" "blocked-by bd-7: consumes all leaves (integration sweep)" "sweep description keeps its old blocked-by line"
assert_eq "$(wc -l < "$ST/desc-sw-1" | tr -d ' ')" 3 "sweep description gained exactly one line per bead (newline count)"
deps_before=$(wc -l < "$ST/deps.log" | tr -d ' ')
desc_before=$(cat "$ST/desc-sw-1")
file_beads design sp:redesign-design-1 amend-design-ok.md
assert_eq "$code" 0 "sweep replay: block exits 0"
assert_eq "$(wc -l < "$ST/deps.log" | tr -d ' ')" "$deps_before" "sweep replay adds no dep add"
assert_eq "$(cat "$ST/desc-sw-1")" "$desc_before" "sweep replay leaves the description unchanged"

esc='Wire <loop> & "q" -> p'
seed; seed_sweep
file_beads design sp:redesign-design-1 amend-design-escaped.md
assert_eq "$code" 0 "escaped title: block exits 0"
esc_id=$(grep -lxF "title=$esc" "$ST"/bead-new-* | sed 's|.*/bead-||')
assert_eq "$(printf '%s\n' "$esc_id" | grep -c .)" 1 "escaped title: filed once"
listing=$(BD_STATE="$ST" "$BIN/bd" list --label sp:redesign-design-1 --all --json)
assert_has "$listing" '"title": "Wire \u003cloop\u003e \u0026 \"q\" -\u003e p"' "stub bd list prints the title Go-escaped"
assert_has "$(calls)" "supersede bd-7 --with $esc_id" "escaped title: bd-7 superseded by its bead"
assert_has "$(cat "$ST/deps.log")" "sw-1 $esc_id" "escaped title: sweep depends on its bead"
assert_has "$(cat "$ST/desc-sw-1")" "blocked-by $esc_id: consumes all leaves (integration sweep)" "escaped title: sweep description names its bead"
creates_before=$(calls | grep -c '^create ' || true)
deps_before=$(wc -l < "$ST/deps.log" | tr -d ' ')
file_beads design sp:redesign-design-1 amend-design-escaped.md
assert_eq "$code" 0 "escaped title replay: block exits 0"
assert_eq "$(calls | grep -c '^create ' || true)" "$creates_before" "escaped title replay files no duplicate"
assert_eq "$(wc -l < "$ST/deps.log" | tr -d ' ')" "$deps_before" "escaped title replay adds no dep add"

seed; seed_sweep
file_beads design sp:redesign-design-1 amend-design-no-work.md
assert_eq "$code" 0 "no work: lines with sweep: block exits 0"
assert_lacks "$(calls)" "create " "no work: lines: nothing filed"
assert_eq "$(wc -c < "$ST/deps.log" | tr -d ' ')" 0 "no work: lines: no dep add"
assert_eq "$(cat "$ST/desc-sw-1")" "Sweep the root goal.
blocked-by bd-7: consumes all leaves (integration sweep)" "no work: lines: sweep description unchanged"
assert_eq "$(status_of bd-7)" open "no work: lines: nothing superseded"

seed; seed_sweep
file_beads code sp:redesign-code-1 amend-code-ok.md
assert_eq "$code" 0 "code loop with sweep: block exits 0"
assert_eq "$(wc -c < "$ST/deps.log" | tr -d ' ')" 0 "code loop with sweep: no dep add"
assert_eq "$(cat "$ST/desc-sw-1")" "Sweep the root goal.
blocked-by bd-7: consumes all leaves (integration sweep)" "code loop with sweep: sweep description unchanged"

seed
file_beads code sp:redesign-code-1 amend-code-ok.md
assert_eq "$code" 0 "code loop: block exits 0"
assert_eq "$(status_of ep-1)" open "code loop: closed root epic is reopened"
assert_eq "$(ready_ids)" 3 "code loop: both amend beads plus the still-open bd-7 are ready"
assert_lacks "$(calls)" "supersede" "code loop: no supersede call"

echo "super-auto pointers"
SA="$REPO_ROOT/skills/super-auto/SKILL.md"
cycle=$(awk '/^#### Redesign cycle/ { on = 1; next } on && /^#### / { exit } on' "$SA")
step3=$(printf '%s\n' "$cycle" | grep -F 'sp:redesign-code-<K>-roast')
assert_has "$step3" "Amend Mode step 4" "step 3 points at Amend Mode step 4's filing sequence"
step4=$(printf '%s\n' "$cycle" | grep '^4\. ')
case "$step4" in
  *'bd update <epicId> --status open'*'re-enter `super-code`'*) pass "step 4 reopens the epic before re-entering super-code" ;;
  *) fail "step 4 reopens the epic before re-entering super-code"; echo "    got: $step4" ;;
esac

echo
if [ "$FAILURES" -eq 0 ]; then echo "All redesign-cycle-filing tests passed"; else echo "$FAILURES redesign-cycle-filing test(s) failed"; exit 1; fi
