#!/usr/bin/env bash
# Configuration smoke for the post-compaction run-block re-inject (no live model session): for each
# harness configuration it registers a run marker with the real run-marker, feeds a compact-source
# SessionStart stdin to every installed hook entry the way the harness would invoke it, and checks the
# emitted JSON, using the real run-digest.
#   Claude Code: both compact entries in hooks/hooks.json, with CLAUDE_PLUGIN_ROOT = the repo root.
#   Codex:       the hook file the packaged plugin's .codex-plugin/plugin.json `hooks` names, from the
#                unpacked package layout (needs zip, unzip and jq; otherwise that half is skipped).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_hasp() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing text: $2"; fi; }
assert_lacks() { if printf '%s\n' "$1" | grep -qF -- "$2"; then fail "$3"; echo "    unexpected: $2"; else pass "$3"; fi; }
assert_lt() { if [ "$1" -lt "$2" ]; then pass "$3 ($1 < $2)"; else fail "$3"; echo "    $1 >= $2"; fi; }

for tool in node jq; do
  command -v "$tool" >/dev/null 2>&1 || { echo "[SKIP] $tool missing: re-inject smoke needs it"; exit 0; }
done

CARD_HEADING=$(head -1 "$REPO_ROOT/skills/super-code/coordinator-card.md")
FALLBACK="Run state unavailable — read run.md's phase and run scripts/ledger-digest."

# --- Fixture run -------------------------------------------------------------------------------
W="$T/W"
mkdir -p "$W/.worktrees/t1" "$T/claude/projects" "$T/codexhome/sessions" "$T/home" "$T/bin" "$T/state"
printf 'phase: code\nstatus: running\n' >"$W/run.md"
{
  printf '# Progress\nLaunch: E 2026-10-15\n'
  i=1
  while [ "$i" -le 9 ]; do
    printf 'Task %s (E.%s): complete, commits aaa%s..bbb%s\n' "$i" "$i" "$i" "$i"
    i=$((i + 1))
  done
  printf 'Task 10 (E.10): complete, note \001ctl\033[31m end\n'
  printf 'Merge: E.1 into run\n'
} >"$W/progress.md"
cat >"$T/bd-dump.json" <<'EOF'
[{"id":"E","status":"open","title":"t"},
 {"id":"E.1","status":"closed","title":"t","parent":"E"},
 {"id":"E.2","status":"open","title":"t","parent":"E"},
 {"id":"E.3","status":"open","title":"t","parent":"E"},
 {"id":"E.4","status":"open","title":"t","parent":"E"},
 {"id":"E.5","status":"closed","title":"t","parent":"E"}]
EOF
printf '#!/usr/bin/env bash\ncat "%s/bd-dump.json"\n' "$T" >"$T/bin/bd"
chmod +x "$T/bin/bd"

export PATH="$T/bin:$PATH"
export HOME="$T/home"
export CLAUDE_CONFIG_DIR="$T/claude"
export CODEX_HOME="$T/codexhome"
export XDG_STATE_HOME="$T/state"
unset CLAUDE_CODE_SESSION_ID CODEX_THREAD_ID CURSOR_PLUGIN_ROOT COPILOT_CLI CLAUDE_PLUGIN_ROOT PLUGIN_ROOT

bash "$REPO_ROOT/skills/super-code/scripts/run-marker" register --session S1 --skill super-auto --worktree "$W" \
  --run-md "$W/run.md" --ledger "$W/progress.md" --epic E --run-tag E-20261015T120000 >/dev/null

now_ms() { node -e 'console.log(Date.now())'; }

# --- Harness simulation ------------------------------------------------------------------------
# invoke <hooks-json> <root> <source> <stdin>: select every SessionStart entry whose matcher matches
# <source> (anchored), substitute the plugin-root variable its command names with <root>, run each
# with bash -c on <stdin>. Entry i's stdout lands in $T/out.<i>, its status in $T/rc.<i>, its label
# (runblock | other) in $T/label.<i>; N_ENTRIES is the count.
invoke() {
  local hooks="$1" root="$2" source="$3" stdin="$4" i=0 cmd
  rm -f "$T"/out.* "$T"/rc.* "$T"/label.* "$T"/ms.*
  while IFS= read -r cmd; do
    [ -n "$cmd" ] || continue
    i=$((i + 1))
    case "$cmd" in
      *session-start-runblock*|*session-start-codex*) printf 'runblock' >"$T/label.$i" ;;
      *) printf 'other' >"$T/label.$i" ;;
    esac
    local rc=0 t0 t1
    t0=$(now_ms)
    ( cd "$T" && printf '%s' "$stdin" | bash -c "$cmd" >"$T/out.$i" 2>"$T/err.$i" ) || rc=$?
    t1=$(now_ms)
    printf '%s' "$rc" >"$T/rc.$i"
    printf '%s' $((t1 - t0)) >"$T/ms.$i"
  done < <(node -e '
    const [file, root, source] = process.argv.slice(1);
    const h = JSON.parse(require("fs").readFileSync(file, "utf8"));
    for (const e of h.hooks.SessionStart || []) {
      if (!new RegExp("^(?:" + (e.matcher || ".*") + ")$").test(source)) continue;
      for (const c of e.hooks || []) {
        const m = /\$\{(\w+)\}/.exec(c.command);
        console.log(m ? c.command.split("${" + m[1] + "}").join(root) : c.command);
      }
    }' "$hooks" "$root" "$source")
  N_ENTRIES=$i
}

# entry_ids: 1..N_ENTRIES (seq counts down on macOS when N is 0).
entry_ids() {
  local i=1
  while [ "$i" -le "$N_ENTRIES" ]; do echo "$i"; i=$((i + 1)); done
}

# runblock_outputs: the stdout of the run-block entries of the last invoke, in order, as files.
runblock_files() {
  local i
  for i in $(entry_ids); do
    [ "$(cat "$T/label.$i")" = runblock ] && echo "$T/out.$i"
  done
  return 0
}

# nonempty_runblock_files: the run-block output files of the last invoke that are not empty.
nonempty_runblock_files() {
  local f
  for f in $(runblock_files); do
    if [ -s "$f" ]; then echo "$f"; fi
  done
  return 0
}

# decoded <file>: the additionalContext text of a hook output (fails if it is not valid JSON).
decoded() { jq -r '.hookSpecificOutput.additionalContext' "$1"; }
charlen() { jq -r '.hookSpecificOutput.additionalContext | length' "$1"; }

# max_ms: the slowest entry of the last invoke, in milliseconds.
max_ms() {
  local i m=0 v
  for i in $(entry_ids); do v=$(cat "$T/ms.$i"); [ "$v" -gt "$m" ] && m=$v; done
  echo "$m"
}

all_rc_zero() {
  local i bad=0
  for i in $(entry_ids); do [ "$(cat "$T/rc.$i")" = 0 ] || bad=1; done
  [ "$bad" = 0 ]
}

stdin_for() { # session source cwd [extra-json-fragment]
  printf '{"session_id":"%s","hook_event_name":"SessionStart","source":"%s","cwd":"%s"%s}' "$1" "$2" "$3" "${4:-}"
}

total_bytes() { local f n=0; for f in "$@"; do n=$((n + $(wc -c <"$f"))); done; echo "$n"; }

# Shared negative cases. <name> <hooks> <root> <extra-subagent-fragment>
negative_cases() {
  local name="$1" hooks="$2" root="$3" sub="$4" f any
  echo "$name: no marker"
  XDG_STATE_HOME="$T/state-empty" invoke "$hooks" "$root" compact "$(stdin_for S1 compact "$W")"
  any=$(nonempty_runblock_files)
  assert_eq "$any" "" "no run-block output without a marker"
  all_rc_zero && pass "every entry exits 0" || fail "every entry exits 0"

  echo "$name: startup source"
  invoke "$hooks" "$root" startup "$(stdin_for S1 startup "$W")"
  assert_eq "$(runblock_files)" "" "run-block entries are not selected on startup"

  echo "$name: task-worktree cwd, non-matching session"
  invoke "$hooks" "$root" compact "$(stdin_for S9 compact "$W/.worktrees/t1")"
  any=$(nonempty_runblock_files)
  assert_eq "$any" "" "no output from a task-worktree cwd with another session id"
  all_rc_zero && pass "every entry exits 0" || fail "every entry exits 0"

  echo "$name: subagent / child identifier"
  invoke "$hooks" "$root" compact "$(stdin_for S9 compact "$W" "$sub")"
  any=$(nonempty_runblock_files)
  assert_eq "$any" "" "no output for a subagent id with another session id"
  all_rc_zero && pass "every entry exits 0" || fail "every entry exits 0"
}

# --- Configuration 1: Claude Code --------------------------------------------------------------
echo "Claude Code: compact with a live marker"
CC_HOOKS="$REPO_ROOT/hooks/hooks.json"
export CLAUDE_PLUGIN_ROOT="$REPO_ROOT"
invoke "$CC_HOOKS" "$REPO_ROOT" compact "$(stdin_for S1 compact "$W")"
files=$(runblock_files)
assert_eq "$(printf '%s\n' "$files" | grep -c .)" 2 "two run-block entries are selected on compact"
all_rc_zero && pass "every entry exits 0" || fail "every entry exits 0"
card_f=$(printf '%s\n' "$files" | sed -n 1p)
state_f=$(printf '%s\n' "$files" | sed -n 2p)
if card_text=$(decoded "$card_f" 2>/dev/null) && state_text=$(decoded "$state_f" 2>/dev/null); then
  pass "both entries print valid JSON"
  assert_eq "$(printf '%s\n' "$card_text" | head -1)" "$CARD_HEADING" "card entry carries the card heading first"
  assert_hasp "$state_text" "## Run state" "state entry has the Run state heading"
  assert_hasp "$state_text" "epic E" "state names the epic"
  assert_hasp "$state_text" "runTag E-20261015T120000" "state names the runTag"
  assert_hasp "$state_text" "ledger: landed" "state carries the ledger counts"
  assert_lt "$(charlen "$card_f")" 10000 "card additionalContext length"
  assert_lt "$(charlen "$state_f")" 10000 "state additionalContext length"
  assert_eq "$(printf '%s' "$state_text" | tr -d '\n\t' | LC_ALL=C grep -c '[[:cntrl:]]' || true)" 0 "control characters were sanitised out of the state"
  assert_hasp "$state_text" "E.10" "the ledger line with control characters still reaches the state"
else
  fail "both entries print valid JSON"
fi
bootstrap_f=""
for i in $(entry_ids); do [ "$(cat "$T/label.$i")" = other ] && bootstrap_f="$T/out.$i"; done
if [ -n "$bootstrap_f" ]; then
  assert_hasp "$(cat "$bootstrap_f")" "using-superpowers" "the bootstrap entry also fires on compact and emits the bootstrap"
else
  fail "the bootstrap entry also fires on compact"
fi
for f in $files; do
  assert_lacks "$(cat "$f")" "using-superpowers" "run-block entry output is not the bootstrap"
done

negative_cases "Claude Code" "$CC_HOOKS" "$REPO_ROOT" ',"agent_id":"a1"'

# Failing and hanging run-digest, in a copy of the root whose run-digest is replaced.
for mode in failing hanging; do
  echo "Claude Code: $mode run-digest"
  B="$T/broken-cc-$mode"
  mkdir -p "$B/skills"
  cp -R "$REPO_ROOT/hooks" "$B/hooks"
  cp -R "$REPO_ROOT/skills/super-code" "$B/skills/super-code"
  if [ "$mode" = failing ]; then body='exit 1'; else body='sleep 30'; fi
  printf '#!/usr/bin/env bash\n%s\n' "$body" >"$B/skills/super-code/scripts/run-digest"
  invoke "$CC_HOOKS" "$B" compact "$(stdin_for S1 compact "$W")"
  files=$(runblock_files)
  all_rc_zero && pass "every entry exits 0" || fail "every entry exits 0"
  assert_lt "$(max_ms)" 9000 "each entry finishes within its 5 s watchdog plus slack (ms)"
  state_out=$(decoded "$(printf '%s\n' "$files" | sed -n 2p)" 2>/dev/null || echo "<invalid>")
  assert_eq "$state_out" "$FALLBACK" "state entry prints exactly the fallback line"
  card_out=$(decoded "$(printf '%s\n' "$files" | sed -n 1p)" 2>/dev/null || echo "<invalid>")
  assert_eq "$(printf '%s\n' "$card_out" | head -1)" "$CARD_HEADING" "card entry still prints the card"
done
unset CLAUDE_PLUGIN_ROOT

# --- Configuration 2: Codex, from the packaged plugin layout ------------------------------------
echo "Codex: package and unpack"
if ! command -v zip >/dev/null 2>&1 || ! command -v unzip >/dev/null 2>&1; then
  echo "  [SKIP] zip/unzip missing: Codex configuration not exercised"
else
  META="$T/metadata-source"
  find "$REPO_ROOT/skills" -mindepth 1 -maxdepth 1 -type d | while read -r d; do
    s=$(basename "$d")
    mkdir -p "$META/skills/$s/agents"
    printf 'interface:\n  display_name: "%s"\n' "$s" >"$META/skills/$s/agents/openai.yaml"
  done
  # The package script wants a git checkout whose .git is a directory; a linked worktree has a file.
  PKG_ROOT="$REPO_ROOT"
  if [ ! -d "$REPO_ROOT/.git" ]; then
    PKG_ROOT="$T/pkg-clone"
    git clone -q --no-hardlinks "$REPO_ROOT" "$PKG_ROOT"
  fi
  if bash "$PKG_ROOT/scripts/package-codex-plugin.sh" --allow-dirty --metadata-source "$META" --output "$T/pkg.zip" >"$T/pkg.log" 2>&1; then
    pass "package script exits successfully"
  else
    fail "package script exits successfully"; sed 's/^/      /' "$T/pkg.log"
  fi
  mkdir -p "$T/codex"
  unzip -q "$T/pkg.zip" -d "$T/codex"
  hook_rel=$(jq -r '.hooks' "$T/codex/.codex-plugin/plugin.json")
  CX_HOOKS="$T/codex/${hook_rel#./}"
  if [ -f "$CX_HOOKS" ]; then pass "the unpacked manifest names a hook file that exists ($hook_rel)"; else fail "hook file $hook_rel exists in the package"; fi
  assert_lacks "$hook_rel" "hooks/hooks.json" "the Codex manifest does not resolve to the Claude hook file"

  echo "Codex: compact with a live marker"
  invoke "$CX_HOOKS" "$T/codex" compact "$(stdin_for S1 compact "$W")"
  files=$(runblock_files)
  assert_eq "$(printf '%s\n' "$files" | grep -c .)" 1 "one hook entry is selected on compact"
  assert_eq "$N_ENTRIES" 1 "the Codex hook file carries no other entry (no bootstrap)"
  all_rc_zero && pass "the entry exits 0" || fail "the entry exits 0"
  f=$(printf '%s\n' "$files" | sed -n 1p)
  if text=$(decoded "$f" 2>/dev/null); then
    pass "the entry prints valid JSON"
    assert_eq "$(printf '%s\n' "$text" | head -1)" "$CARD_HEADING" "text starts with the card heading"
    assert_hasp "$text" "## Run state" "text carries the Run state block"
    case "$text" in
      "$CARD_HEADING"*"## Run state"*) pass "card comes before state" ;;
      *) fail "card comes before state" ;;
    esac
    assert_hasp "$text" "ledger: landed" "state carries the ledger counts"
    assert_lt "$(charlen "$f")" 18000 "additionalContext length"
    assert_lacks "$text" "using-superpowers" "the bootstrap text never appears"
    assert_eq "$(printf '%s' "$text" | tr -d '\n\t' | LC_ALL=C grep -c '[[:cntrl:]]' || true)" 0 "control characters were sanitised out"
  else
    fail "the entry prints valid JSON"
  fi

  negative_cases "Codex" "$CX_HOOKS" "$T/codex" ',"thread_spawn":{"parent_thread_id":"S1"}'

  for mode in failing hanging; do
    echo "Codex: $mode run-digest"
    B="$T/broken-cx-$mode"
    mkdir -p "$B/skills"
    cp -R "$T/codex/hooks" "$B/hooks"
    cp -R "$T/codex/skills/super-code" "$B/skills/super-code"
    if [ "$mode" = failing ]; then body='exit 1'; else body='sleep 30'; fi
    printf '#!/usr/bin/env bash\n%s\n' "$body" >"$B/skills/super-code/scripts/run-digest"
    invoke "$CX_HOOKS" "$B" compact "$(stdin_for S1 compact "$W")"
    all_rc_zero && pass "the entry exits 0" || fail "the entry exits 0"
    assert_lt "$(max_ms)" 9000 "the entry finishes within its 5 s watchdog plus slack (ms)"
    f=$(runblock_files | sed -n 1p)
    out=$(decoded "$f" 2>/dev/null || echo "<invalid>")
    assert_eq "$(printf '%s\n' "$out" | head -1)" "$CARD_HEADING" "card is still printed"
    assert_eq "$(printf '%s\n' "$out" | tail -1)" "$FALLBACK" "card is followed by the state fallback line"
  done
fi

if [ "$FAILURES" -gt 0 ]; then
  echo "test-reinject-smoke: $FAILURES failure(s)"
  exit 1
fi
echo "test-reinject-smoke: all tests passed"
