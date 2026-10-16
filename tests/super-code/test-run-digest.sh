#!/usr/bin/env bash
# Tests for skills/super-code/scripts/run-digest and skills/super-code/coordinator-card.md: the
# card/state/all parts, budget trimming, the shared source deadline, and the card's size and contents.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SC="$REPO_ROOT/skills/super-code"
FX="$SCRIPT_DIR/fixtures/run-digest"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_has() { if printf '%s\n' "$1" | grep -qxF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing line: $2"; fi; }
assert_hasp() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing text: $2"; fi; }
assert_lacks() { if printf '%s\n' "$1" | grep -qF -- "$2"; then fail "$3"; echo "    unexpected: $2"; else pass "$3"; fi; }
assert_le() { if [ "$1" -le "$2" ]; then pass "$3 ($1 <= $2)"; else fail "$3"; echo "    $1 > $2"; fi; }

# A scripts dir next to a copy of the card, with the real ledger-digest/epic-tree and stubs.
S="$T/sc/scripts"
mkdir -p "$S" "$T/bin" "$T/wt"
cp "$SC/scripts/run-digest" "$SC/scripts/ledger-digest" "$SC/scripts/epic-tree" "$S/"
cp "$SC/coordinator-card.md" "$T/sc/coordinator-card.md"
CARD="$T/sc/coordinator-card.md"
set_profile() { printf '#!/usr/bin/env bash\n%s\n' "$1" >"$S/run-profile"; }
set_profile 'echo "in-flight: impl:E.2 · 25m"; echo "in-flight: review:E.3 · unknown"'
printf '#!/usr/bin/env bash\ncat "$BD_FIXTURE"\n' >"$T/bin/bd"
chmod +x "$T/bin/bd"
export BD_FIXTURE="$FX/bd-list.json"
export PATH="$T/bin:$PATH"

marker() { # ledger-fixture
  printf 'key: S1\nskill: super-auto\nharness: claude\nrun_md: %s/run.md\nledger: %s/%s\nepic: E\nsession: S1\nworktree: %s\nrunTag: E-20261015T120000\n' "$FX" "$FX" "$1" "$T/wt"
}
run_digest() { # part budget (marker on stdin)
  set +e; out=$(bash "$S/run-digest" --part "$1" --budget "$2" 2>"$T/err"); code=$?; set -e
}
now_ms() { node -e 'console.log(Date.now())'; }

echo "run-digest: card part"
set +e; marker progress.md | bash "$S/run-digest" --part card --budget 9000 >"$T/card.out"; code=$?; set -e
assert_eq "$code" 0 "exits 0"
if cmp -s "$T/card.out" "$CARD"; then pass "card is byte-identical to the card file"; else fail "card differs from the card file"; fi
set +e; marker progress.md | bash "$S/run-digest" --part card --budget 10 >"$T/card.out"; set -e
if cmp -s "$T/card.out" "$CARD"; then pass "card is never cut by a small budget"; else fail "card was cut"; fi

echo "run-digest: state part"
run_digest state 9000 < <(marker progress.md)
assert_eq "$code" 0 "exits 0"
assert_has "$out" "## Run state" "heading"
assert_has "$out" "skill super-auto · epic E · phase code · runTag E-20261015T120000" "header line"
assert_has "$out" "scripts: $S" "scripts dir"
assert_has "$out" "ledger: landed 3 · failed/BLOCKED 1 · pending retry 1 · cancelled 1" "last state per id wins in the counts"
assert_hasp "$out" "ledger tail (last " "ledger tail header"
assert_has "$out" "Task 6 (E.6): complete, commits eee555..fff666" "tail carries ledger-digest lines"
assert_has "$out" "open beads: 3 — E.2, E.3, E.5" "open in-tree beads, not the epic, not closed, not out-of-tree"
assert_has "$out" "in-flight: 2" "in-flight count"
assert_has "$out" "in-flight: impl:E.2 · 25m" "in-flight line verbatim"
assert_has "$out" "in-flight: review:E.3 · age unknown" "trailing unknown becomes age unknown"
assert_lacks "$out" "# ledger-digest:" "digest header is dropped"

echo "run-digest: all part"
run_digest all 18000 < <(marker progress.md)
assert_eq "$(printf '%s\n' "$out" | head -n 1)" "$(head -n 1 "$CARD")" "starts with the card's first line"
card_line=$(printf '%s\n' "$out" | grep -nxF "## Run state" | head -n 1 | cut -d: -f1)
last_card_line=$(wc -l <"$CARD" | tr -d ' ')
if [ "$card_line" -gt "$last_card_line" ]; then pass "state comes after the card"; else fail "state is not after the card"; fi
assert_le "$(printf '%s\n' "$out" | wc -c | tr -d ' ')" 18000 "all fits its budget"

echo "run-digest: budgets with a maximal ledger"
set_profile 'i=0; while [ $i -lt 300 ]; do echo "in-flight: impl:E.$i · ${i}m"; i=$((i+1)); done'
export BD_FIXTURE="$FX/bd-list-max.json"
run_digest state 9000 < <(marker progress-max.md)
len=$(printf '%s\n' "$out" | wc -c | tr -d ' ')
assert_le "$len" 9000 "state within 9000"
assert_hasp "$out" "more, see ledger-digest" "dropped in-flight lines are summarised"
assert_has "$out" "in-flight: 300" "in-flight count survives trimming"
run_digest all 18000 < <(marker progress-max.md)
printf '%s\n' "$out" >"$T/all.out"
assert_le "$(wc -c <"$T/all.out" | tr -d ' ')" 18000 "all within 18000"
cardlen=$(wc -c <"$CARD" | tr -d ' ')
if [ "$(head -c "$cardlen" "$T/all.out")" = "$(cat "$CARD")" ]; then pass "all starts with the whole card"; else fail "card was cut inside all"; fi
run_digest state 2000 < <(marker progress-max.md)
assert_le "$(printf '%s\n' "$out" | wc -c | tr -d ' ')" 2000 "state within 2000"
assert_has "$out" "## Run state" "heading survives a small budget"
# bead ids are capped at 40 even with room to spare
set_profile 'true'
run_digest state 30000 < <(marker progress-max.md)
assert_hasp "$out" "open beads: 120 — " "120 open beads counted"
assert_hasp "$out" "+80 more" "ids capped at 40"
set_profile 'echo "in-flight: impl:E.2 · 25m"; echo "in-flight: review:E.3 · unknown"'
export BD_FIXTURE="$FX/bd-list.json"

echo "run-digest: missing fields"
run_digest state 9000 < <(printf 'key: S1\nskill: super-code\nharness: claude\nworktree: %s\n' "$T/wt")
assert_has "$out" "ledger: none yet" "no ledger field"
assert_has "$out" "open beads: none yet" "no epic field"
assert_has "$out" "in-flight: unknown — marker lacks epic/session/harness" "no epic/session"
assert_hasp "$out" "phase super-code" "standalone phase"
run_digest state 9000 </dev/null
assert_eq "$out" "Run state: no marker on stdin" "empty stdin"
run_digest all 18000 </dev/null
assert_eq "$(printf '%s\n' "$out" | head -n 1)" "$(head -n 1 "$CARD")" "card still prints for empty stdin"
assert_has "$out" "Run state: no marker on stdin" "state line after the card"

echo "run-digest: a ledger with no Task lines"
printf '# Progress\nDetector: slow\nLaunch: x\nPlan: y\n' >"$T/ledger-launch.md"
: >"$T/ledger-empty.md"
printf '# SDD ledger — plan: x\n' >"$T/ledger-header.md"
for lf in ledger-launch ledger-empty ledger-header; do
  for part in state all; do
    budget=9000; [ "$part" = all ] && budget=18000
    run_digest "$part" "$budget" < <(printf 'key: S1\nskill: super-code\nharness: claude\nledger: %s\nepic: E\nsession: S1\nworktree: %s\n' "$T/$lf.md" "$T/wt")
    assert_eq "$code" 0 "$lf/$part: exits 0"
    assert_has "$out" "## Run state" "$lf/$part: heading prints"
    assert_has "$out" "ledger: landed 0 · failed/BLOCKED 0 · pending retry 0 · cancelled 0" "$lf/$part: zero counts"
    assert_lacks "$out" "ledger tail (last" "$lf/$part: no tail line"
    if [ "$part" = all ]; then
      assert_eq "$(printf '%s\n' "$out" | head -n 1)" "$(head -n 1 "$CARD")" "$lf/all: starts with the card's first line"
    fi
  done
done

echo "run-digest: a failing source degrades only its section"
printf '#!/usr/bin/env bash\nexit 1\n' >"$T/bin/bd"
run_digest state 9000 < <(marker progress.md)
assert_eq "$code" 0 "exits 0"
assert_has "$out" "open beads: unknown" "failing bd"
assert_has "$out" "in-flight: 2" "other sections still print"
set_profile 'echo "in-flight: unknown — cannot read /x: ENOENT"'
printf '#!/usr/bin/env bash\ncat "$BD_FIXTURE"\n' >"$T/bin/bd"
run_digest state 9000 < <(marker progress.md)
assert_has "$out" "in-flight: unknown — cannot read /x: ENOENT" "run-profile unknown line printed as the section"
assert_lacks "$out" "in-flight: 0" "no count line for it"
set_profile 'exit 3'
run_digest state 9000 < <(marker progress.md)
assert_has "$out" "in-flight: unknown" "failing run-profile"
set_profile 'echo "in-flight: impl:E.2 · 25m"; echo "in-flight: review:E.3 · unknown"'

echo "run-digest: slow sources share one deadline"
slow_case() { # label, slow sources (space-separated: ledger bd profile)
  cp "$SC/scripts/ledger-digest" "$S/ledger-digest"
  printf '#!/usr/bin/env bash\ncat "$BD_FIXTURE"\n' >"$T/bin/bd"
  set_profile 'echo "in-flight: impl:E.2 · 25m"; echo "in-flight: review:E.3 · unknown"'
  for s in $2; do
    case "$s" in
      ledger) printf '#!/usr/bin/env bash\nsleep 10\n' >"$S/ledger-digest" ;;
      bd) printf '#!/usr/bin/env bash\nsleep 10\n' >"$T/bin/bd" ;;
      profile) set_profile 'sleep 10' ;;
    esac
  done
  local t0 t1
  t0=$(now_ms)
  run_digest state 9000 < <(marker progress.md)
  t1=$(now_ms)
  local ms=$((t1 - t0))
  assert_le "$ms" 4500 "$1: finished in ${ms} ms"
  case " $2 " in *" ledger "*) assert_has "$out" "ledger: unknown" "$1: ledger unknown" ;; *) assert_hasp "$out" "ledger: landed" "$1: ledger real" ;; esac
  case " $2 " in *" bd "*) assert_has "$out" "open beads: unknown" "$1: beads unknown" ;; *) assert_hasp "$out" "open beads: 3" "$1: beads real" ;; esac
  case " $2 " in *" profile "*) assert_has "$out" "in-flight: unknown" "$1: in-flight unknown" ;; *) assert_has "$out" "in-flight: 2" "$1: in-flight real" ;; esac
}
slow_case "one slow source" "bd"
slow_case "two slow sources" "ledger profile"
slow_case "three slow sources" "ledger bd profile"
cp "$SC/scripts/ledger-digest" "$S/ledger-digest"

echo "run-digest: bad arguments"
set +e; bash "$S/run-digest" --part nope --budget 9000 </dev/null >/dev/null 2>&1; c1=$?
bash "$S/run-digest" --part state </dev/null >/dev/null 2>&1; c2=$?
bash "$S/run-digest" --budget 9000 </dev/null >/dev/null 2>&1; c3=$?
bash "$S/run-digest" --part state --budget abc </dev/null >/dev/null 2>&1; c4=$?
set -e
assert_eq "$c1" 2 "bad --part exits 2"
assert_eq "$c2" 2 "missing --budget exits 2"
assert_eq "$c3" 2 "missing --part exits 2"
assert_eq "$c4" 2 "non-numeric --budget exits 2"

echo "coordinator-card: size and contents"
REAL="$SC/coordinator-card.md"
size=$(wc -c <"$REAL" | tr -d ' ')
if [ "$size" -ge 6000 ] && [ "$size" -le 9000 ]; then pass "card is $size bytes (6000-9000)"; else fail "card is $size bytes, outside 6000-9000"; fi
assert_eq "$(head -n 1 "$REAL")" "# Coordinator card (re-injected after compaction)" "card heading"
for needle in run_in_background 'sleep 2700' 'Claude Code only' wait_agent list_agents report-verdict ledger-digest run-digest \
  ready-in-tree epic-tree run-marker 'one merge' refill 'early unblock' 'fresh agent' 'one fresh agent, one job' run-state.md \
  'never re-invoke super-auto' '§Phase 5' '§Final-review items' '§Finish'; do
  if grep -qF -- "$needle" "$REAL"; then pass "card mentions: $needle"; else fail "card lacks: $needle"; fi
done
KEEPALIVE='**Workflow keepalive (Claude Code only).** While a coordinator or roast Workflow runs, keep one `run_in_background` `sleep 2700` armed. When it fires before the Workflow'"'"'s notification, take one cheap progress look (the newest ledger lines), refresh the run marker with the same `run-marker register` command the run registered with, and re-arm. Do not re-arm once the Workflow has returned. No idle trigger is known on Codex: there, block on `wait_agent` in 5–10 minute stretches and never poll `list_agents`.'
READRULE='**Read rule.** Read only what you need to route work: the ledger through `ledger-digest`; run state through `run-digest` or `run.md`'"'"'s fields; child and roast reports through `report-verdict <file>` (verdict, blocking items, path). Plans, specs, source, diffs and full child reports are read by children, never by you to route.'
if grep -qxF -- "$KEEPALIVE" "$REAL"; then pass "keepalive paragraph verbatim"; else fail "keepalive paragraph differs"; fi
if grep -qxF -- "$READRULE" "$REAL"; then pass "read rule paragraph verbatim"; else fail "read rule paragraph differs"; fi

echo
if [ "$FAILURES" -gt 0 ]; then echo "run-digest: $FAILURES failure(s)"; exit 1; fi
echo "run-digest: all tests passed"
