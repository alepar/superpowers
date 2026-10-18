#!/usr/bin/env bash
# Tests for skills/super-design/scripts/amend-check. Each case builds a throwaway git repo: the base
# spec is committed, the case's edited spec is left in the working tree, and amend-check runs inside it.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
S="$REPO_ROOT/skills/super-design/scripts"
F="$SCRIPT_DIR/fixtures/amend-check"
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

# case NAME LOOP RECORD SPEC-EDIT [extra amend-check args...]: sets $out (stdout+stderr) and $code.
# Optional env: BASE_SPEC (fixture committed as docs/spec.md, default spec-base.md), SPECS (the --specs
# paths, default docs/spec.md), EXTRA_BASE / EXTRA_WT ("dest=fixture ..." pairs committed in the base
# commit / copied into the working tree afterwards, left untracked).
case_run() {
  local name=$1 loop=$2 record=$3 spec=$4; shift 4
  local d="$TMPROOT/$name"
  mkdir -p "$d/docs"
  git -C "$d" init -q
  git -C "$d" config user.email t@example.com
  git -C "$d" config user.name t
  cp "$F/${BASE_SPEC:-spec-base.md}" "$d/docs/spec.md"
  local pair
  for pair in ${EXTRA_BASE:-}; do cp "$F/${pair#*=}" "$d/${pair%%=*}"; done
  git -C "$d" add -A
  git -C "$d" commit -q -m base
  cp "$F/$spec" "$d/docs/spec.md"
  for pair in ${EXTRA_WT:-}; do cp "$F/${pair#*=}" "$d/${pair%%=*}"; done
  set +e
  out=$(cd "$d" && bash "$S/amend-check" --loop "$loop" --amend "$F/$record" --ledger "$F/ledger.md" --specs ${SPECS:-docs/spec.md} "$@" 2>&1)
  code=$?
  set -e
}

echo "amend-check: ok and parsing"
case_run ok code ok-code.md spec-edit-ok.md
assert_eq "$out" "ok" "ok record under --loop code"
assert_eq "$code" 0 "exit 0"

case_run okd design ok-code.md spec-edit-ok.md
assert_eq "$out" "ok" "the same record under --loop design"

case_run cp code comma-pipe-keys.md spec-edit-ok.md
assert_eq "$out" "ok" "covers: key containing ', ' and key containing ' | ' parsed whole, rN prefix stripped"
assert_eq "$code" 0 "comma/pipe record exit 0"

echo "amend-check: owners both ways"
case_run mo code missing-open.md spec-edit-ok.md
assert_eq "$code" 3 "missing open key: exit 3"
assert_has "$out" "reject: owners: open item missing from owners: [Nit] a | b" "missing open key named"

case_run mr code missing-returned.md spec-edit-ok.md
assert_eq "$code" 3 "missing 'open (returned rN)' key: exit 3"
assert_has "$out" "owners: open item missing from owners: [Should-fix] src/d.sh:3" "returned key named"

case_run mf code missing-final-review.md spec-edit-ok.md
assert_eq "$code" 3 "missing final-review row: exit 3"
assert_has "$out" "owners: open item missing from owners: [Must-fix] reviewer item, with comma" "final-review key named"

case_run no code owners-not-open.md spec-edit-ok.md
assert_eq "$code" 3 "owners: key that is not open: exit 3"
assert_has "$out" "reject: owners: not an open ledger key: [Blocking] src/e.sh:1" "disputed-in-ledger key is not open"

echo "amend-check: work lines and the reverse rule"
case_run wn code work-no-covers.md spec-edit-ok.md
assert_eq "$code" 3 "work: line without covers: exit 3"
assert_has "$out" "reject: work: no covers: Orphan item" "orphan work line named"

case_run rl code reverse-local.md spec-edit-ok.md
assert_eq "$code" 3 "open local key with no work: covers: exit 3"
assert_has "$out" "reject: reverse: open item not covered by a work: line: [Should-fix] src/d.sh:3" "local key named"

case_run rr design reverse-rule.md spec-edit-ok.md
assert_eq "$code" 3 "owner key whose section is not in amended:, no work: covers: exit 3 (design)"
assert_has "$out" "reject: reverse: open item not covered by a work: line: [Blocking] src/a.sh:10" "owner key named"

case_run oc code owner-section-only.md spec-edit-ok.md
assert_eq "$code" 3 "--loop code: key covered only by an amended owner section: exit 3"
assert_has "$out" "reverse: open item not covered by a work: line: [Blocking] src/a.sh:10" "code loop needs a work: line"
case_run od design owner-section-only.md spec-edit-ok.md
assert_eq "$out" "ok" "the same record passes under --loop design"
case_run odd design owner-section-dot-slash.md spec-edit-ok.md
assert_eq "$out" "ok" "--loop design: owner ./docs/spec.md matches amended: docs/spec.md for the reverse rule"

echo "amend-check: spec diff"
case_run au code amended-untouched.md spec-edit-ok.md
assert_eq "$code" 3 "amended: section the diff does not touch: exit 3"
assert_has "$out" "reject: amended: no changed line in section: docs/spec.md §Unchanged behavior" "untouched section named"

case_run gd code ok-code.md spec-edit-goal.md
assert_eq "$code" 3 "## Goal diff: exit 3"
assert_has "$out" "reject: goal: ## Goal changed in docs/spec.md" "goal change named"

case_run nu code ok-code.md spec-no-unchanged.md
assert_eq "$code" 3 "missing ## Unchanged behavior: exit 3"
assert_has "$out" "reject: unchanged: root spec docs/spec.md has no ## Unchanged behavior section" "missing section named"

echo "amend-check: normalised content"
case_run gi code ok-code.md spec-goal-heading-inserted.md
assert_eq "$code" 3 "heading inserted right after ## Goal: exit 3"
assert_has "$out" "reject: goal: ## Goal changed in docs/spec.md" "moved Goal body named"

BASE_SPEC=spec-base-fenced-goal.md case_run fg code ok-code.md spec-edit-fenced-goal.md
assert_eq "$out" "ok" "edit inside a fenced '## Goal' example is not a Goal change"

case_run od2 code owners-duplicate.md spec-edit-ok.md
assert_eq "$code" 3 "duplicate owners: key: exit 3"
assert_has "$out" "reject: owners: duplicate key: [Should-fix] src/d.sh:3" "duplicate key named"

case_run ds code ok-dot-slash.md spec-edit-ok.md
assert_eq "$out" "ok" "./docs/spec.md in amended: matches --specs docs/spec.md"
SPECS=./docs/spec.md case_run sd code ok-code.md spec-edit-ok.md
assert_eq "$out" "ok" "docs/spec.md in amended: matches --specs ./docs/spec.md"

case_run dl design design-local-no-work.md spec-edit-ok.md
assert_eq "$code" 3 "design loop: local key with no work: line: exit 3"
assert_has "$out" "reject: reverse: open item not covered by a work: line: [Should-fix] src/d.sh:3" "uncovered local key named"

SPECS="docs/spec.md docs/nested.md" EXTRA_WT="docs/nested.md=spec-nested-new.md" case_run un code amend-nested-new.md spec-edit-ok.md
assert_eq "$out" "ok" "untracked new nested spec: its amended section counts as changed"

SPECS="docs/nested.md docs/spec.md" EXTRA_BASE="docs/nested.md=spec-nested-base.md" case_run mu code ok-code.md spec-edit-ok.md
assert_eq "$code" 3 "multi --specs: first spec is the root"
assert_has "$out" "reject: unchanged: root spec docs/nested.md has no ## Unchanged behavior section" "root choice follows --specs order"

SPECS="docs/spec.md docs/nested.md" EXTRA_BASE="docs/nested.md=spec-nested-base.md" EXTRA_WT="docs/nested.md=spec-nested-goal-edit.md" case_run mg code ok-code.md spec-edit-ok.md
assert_eq "$code" 3 "## Goal change in the second spec: exit 3"
assert_has "$out" "reject: goal: ## Goal changed in docs/nested.md" "nested Goal change named"

echo "amend-check: bad input and git failure"
case_run gf code ok-code.md spec-edit-ok.md --base no-such-rev
assert_eq "$code" 2 "unknown --base: exit 2, never a reject"
case_run nf code ok-code.md spec-edit-ok.md
set +e
(cd "$TMPROOT/nf" && bash "$S/amend-check" --loop code --amend "$F/nope.md" --ledger "$F/ledger.md" --specs docs/spec.md >/dev/null 2>&1)
code=$?
(cd "$TMPROOT/nf" && bash "$S/amend-check" --loop sideways --amend "$F/ok-code.md" --ledger "$F/ledger.md" --specs docs/spec.md >/dev/null 2>&1)
code2=$?
(cd "$TMPROOT" && bash "$S/amend-check" --loop code --amend "$F/ok-code.md" --ledger "$F/ledger.md" --specs "$TMPROOT/nf/docs/spec.md" >/dev/null 2>&1)
code3=$?
set -e
assert_eq "$code" 2 "missing amend file: exit 2"
assert_eq "$code2" 2 "bad --loop: exit 2"
assert_eq "$code3" 2 "not in a git repository: exit 2"

echo
if [ "$FAILURES" -eq 0 ]; then echo "All amend-check tests passed"; else echo "$FAILURES amend-check test(s) failed"; exit 1; fi
