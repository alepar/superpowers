#!/usr/bin/env bash
# Tests for the Claude Code run-block re-inject: hooks/run-block.sh + hooks/session-start-runblock
# + the two compact entries in hooks/hooks.json. run-digest is stubbed (mode from $T/mode).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILED=1; }
FAILED=0
assert_eq() { if [ "$2" = "$3" ]; then pass "$1"; else fail "$1 (expected: $2, got: $3)"; fi; }
assert_has() { case "$3" in *"$2"*) pass "$1" ;; *) fail "$1 (missing: $2 in: $3)" ;; esac; }

P=$T/plugin
mkdir -p "$P/hooks" "$P/skills/super-code/scripts" "$T/W/sub" "$T/W/.worktrees/t1" "$T/state"
cp "$REPO_ROOT/hooks/run-block.sh" "$REPO_ROOT/hooks/session-start-runblock" "$REPO_ROOT/hooks/session-start-codex" "$REPO_ROOT/hooks/run-hook.cmd" "$P/hooks/"
cp "$REPO_ROOT/skills/super-code/scripts/run-marker" "$P/skills/super-code/scripts/"
printf 'CARD-FILE' >"$P/skills/super-code/coordinator-card.md"
cat >"$P/skills/super-code/scripts/run-digest" <<STUB
#!/usr/bin/env bash
cat >/dev/null
mode=\$(cat "$T/mode")
part=""
while [ \$# -gt 0 ]; do case "\$1" in --part) part="\$2"; shift ;; esac; shift; done
case "\$mode" in
  ok) case "\$part" in card) printf 'CARD-TEXT' ;; all) printf 'CARD-TEXT\n\nSTATE-TEXT' ;; *) printf 'STATE-TEXT' ;; esac ;;
  fail) exit 1 ;;
  hang) sleep 30 ;;
  ctrl) printf 'S\001T\033U\rV "q" back\\\\slash\nline2\ttab' ;;
  bigall) head -c 17900 /dev/zero | tr '\0' 'x' ;;
  big) head -c 9000 /dev/zero | tr '\0' 'x' ;;
  file) cat "$T/payload" ;;
esac
STUB
echo ok >"$T/mode"
echo W >"$T/W/ledger.md"
: >"$T/W/ledger.md"
echo "ledger" >"$T/W/ledger.md"

hook() { # <part> <stdin> [XDG_STATE_HOME]
  printf '%s' "$2" | env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID XDG_STATE_HOME="${3:-$T/state}" \
    bash "$P/hooks/session-start-runblock" "$1"
}
decode() { node -e 'const j=JSON.parse(require("fs").readFileSync(0,"utf8")); process.stdout.write(j.hookSpecificOutput.additionalContext)'; }
register() { env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID XDG_STATE_HOME="$1" \
  bash "$P/skills/super-code/scripts/run-marker" register --session S1 --skill super-code --worktree "$T/W" --ledger "$T/W/ledger.md" >/dev/null; }

echo "== no marker"
for part in card state; do
  out=$(hook $part '{"session_id":"S1","cwd":"/elsewhere"}'; echo "rc=$?")
  assert_eq "no marker, $part: no output, exit 0" "rc=0" "$out"
done

register "$T/state"

echo "== by session id"
out=$(hook card '{"session_id":"S1","cwd":"/elsewhere","source":"compact"}')
assert_eq "card text" "CARD-TEXT" "$(printf '%s' "$out" | decode)"
assert_eq "hookEventName" "SessionStart" "$(printf '%s' "$out" | node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(0,"utf8")).hookSpecificOutput.hookEventName)')"
out=$(hook state '{"session_id":"S1","cwd":"/elsewhere","source":"compact"}')
assert_eq "state text" "STATE-TEXT" "$(printf '%s' "$out" | decode)"

echo "== by cwd"
out=$(hook state "{\"session_id\":\"S9\",\"cwd\":\"$T/W/sub\"}")
assert_eq "cwd match" "STATE-TEXT" "$(printf '%s' "$out" | decode)"

echo "== by own fallback marker"
: >"$T/notadir"
rm -rf "$T/W/.superpowers"
register "$T/notadir"
[ -f "$T/W/.superpowers/run-marker-S1" ] && pass "fallback marker written" || fail "fallback marker written"
mkdir -p "$T/W/a"
out=$(hook state "{\"session_id\":\"S1\",\"cwd\":\"$T/W/a\"}" "$T/notadir")
assert_eq "fallback match" "STATE-TEXT" "$(printf '%s' "$out" | decode)"
rm -rf "$T/W/.superpowers"

echo "== refusals"
out=$(hook state "{\"session_id\":\"S9\",\"cwd\":\"$T/W/.worktrees/t1\"}")
assert_eq "task-worktree cwd: no output" "" "$out"
out=$(hook state "{\"session_id\":\"S9\",\"cwd\":\"$T/W/sub\",\"agent_id\":\"a1\"}")
assert_eq "subagent, other session: no output" "" "$out"
out=$(hook state "{\"session_id\":\"S1\",\"cwd\":\"$T/W/sub\",\"agent_id\":\"a1\"}")
assert_eq "subagent, same session: no output" "" "$out"
out=$(hook state "{\"session_id\":\"S1\",\"cwd\":\"$T/W/sub\",\"agent_id\":\"\"}")
assert_eq "empty agent_id is not a subagent" "STATE-TEXT" "$(printf '%s' "$out" | decode)"

echo "== run-digest modes"
echo fail >"$T/mode"
assert_eq "fail: state fallback" "Run state unavailable — read run.md's phase and run scripts/ledger-digest." \
  "$(hook state '{"session_id":"S1"}' | decode)"
assert_eq "fail: card file" "CARD-FILE" "$(hook card '{"session_id":"S1"}' | decode)"
echo hang >"$T/mode"
start=$(node -e 'process.stdout.write(String(Date.now()))')
out=$(hook state '{"session_id":"S1"}'; echo "rc=$?")
end=$(node -e 'process.stdout.write(String(Date.now()))')
assert_has "hang: state fallback" "Run state unavailable" "$out"
assert_has "hang: exit 0" "rc=0" "$out"
[ $((end - start)) -lt 7000 ] && pass "hang: under 7 s ($((end - start)) ms)" || fail "hang: took $((end - start)) ms"
echo ctrl >"$T/mode"
out=$(hook state '{"session_id":"S1"}')
dec=$(printf '%s' "$out" | decode)
assert_eq "ctrl: no control bytes" "0" "$(printf '%s' "$dec" | LC_ALL=C tr -d '\011\012\040-\377' | LC_ALL=C wc -c | tr -d ' ')"
assert_has "ctrl: text survives" 'S' "$dec"
assert_has "ctrl: quote and backslash survive" '"q" back\slash' "$dec"
echo big >"$T/mode"
out=$(hook state '{"session_id":"S1"}')
len=$(printf '%s' "$out" | node -e 'process.stdout.write(String(JSON.parse(require("fs").readFileSync(0,"utf8")).hookSpecificOutput.additionalContext.length))')
assert_eq "big: 9000 bytes pass through untouched" "9000" "$len"
echo ok >"$T/mode"

echo "== size cut (Claude entry)"
mkpayload() { # <name> <kind> <count>: lines = N lines of L%04d + 74 y + e-acute; mb = x + N e-acute; edge = N x
  case "$2" in
    lines) awk -v n="$3" 'BEGIN { y = sprintf("%74s", ""); gsub(/ /, "y", y); for (i = 1; i <= n; i++) printf "L%04d%s\303\251\n", i, y }' >"$T/payload-$1" ;;
    mb) { printf x; awk -v n="$3" 'BEGIN { for (i = 0; i < n; i++) printf "\303\251" }'; } >"$T/payload-$1" ;;
    edge) head -c "$3" /dev/zero | tr '\0' 'x' >"$T/payload-$1" ;;
  esac
}
# cutinfo <payload name>: reads hook JSON on stdin; prints bytes, prefix, fffd, next char, last line
cutinfo() {
  node -e '
const fs=require("fs");
const ctx=JSON.parse(fs.readFileSync(0,"utf8")).hookSpecificOutput.additionalContext;
const pl=fs.readFileSync(process.argv[1],"utf8");
const last=ctx.split("\n").pop();
console.log([Buffer.byteLength(ctx),pl.startsWith(ctx),ctx.includes("\uFFFD"),JSON.stringify(pl.charAt(ctx.length)),/^L[0-9]{4}y{74}\u00e9$/.test(last)].join(" "));
' "$T/payload-$1"
}
echo file >"$T/mode"
mkpayload edge9500 edge 9500; mkpayload lines lines 120
mkpayload lines-codex lines 220
check_cut() { # <label> <hook output> <cap> <name> <expected bytes or "-"> <line-boundary 0|1>
  local info b pre ff nx ll
  info=$(printf '%s' "$2" | cutinfo "$4")
  set -- "$1" "$3" "$5" "$6" $info
  b=$5; pre=$6; ff=$7; nx=$8; ll=$9
  [ "$b" -le "$2" ] && pass "$1: $b bytes <= $2" || fail "$1: $b bytes > $2"
  assert_eq "$1: output is a prefix of the payload" "true" "$pre"
  assert_eq "$1: no U+FFFD" "false" "$ff"
  [ "$3" = "-" ] || assert_eq "$1: exact byte count" "$3" "$b"
  if [ "$4" = 1 ]; then
    assert_eq "$1: cut at a line boundary" '"\n"' "$nx"
    assert_eq "$1: last line whole" "true" "$ll"
  fi
}
echo file >"$T/mode"
cp "$T/payload-edge9500" "$T/payload"
out=$(hook state '{"session_id":"S1"}')
assert_eq "edge 9500: untouched" "9500" "$(printf '%s' "$out" | cutinfo edge9500 | cut -d' ' -f1)"
cp "$T/payload-lines" "$T/payload"
out=$(hook state '{"session_id":"S1"}')
check_cut "lines over cap" "$out" 9500 lines - 1
[ "$(printf '%s' "$out" | cutinfo lines | cut -d' ' -f1)" -lt 9840 ] && pass "lines over cap: shorter than input" || fail "lines over cap: not shorter than input"
mkpayload mb mb 5000
cp "$T/payload-mb" "$T/payload"
out=$(hook state '{"session_id":"S1"}')
check_cut "multibyte cut" "$out" 9500 mb 9499 0
echo ok >"$T/mode"

echo "== stdin shapes"
out=$(hook state '{
  "session_id": "S1",
  "cwd": "/elsewhere"
}')
assert_eq "pretty-printed stdin" "STATE-TEXT" "$(printf '%s' "$out" | decode)"
start=$(node -e 'process.stdout.write(String(Date.now()))')
node -e '
const {spawn}=require("child_process");
const t=Date.now();
const c=spawn("bash",[process.argv[1],"state"],{stdio:["pipe","pipe","ignore"],env:{...process.env,XDG_STATE_HOME:process.argv[2]}});
let out="";c.stdout.on("data",d=>out+=d);
c.on("close",rc=>{console.log(JSON.stringify({rc,ms:Date.now()-t,out}));process.exit(0)});
' "$P/hooks/session-start-runblock" "$T/state" >"$T/hung.json"
ms=$(node -e 'process.stdout.write(String(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).ms))' "$T/hung.json")
rc=$(node -e 'process.stdout.write(String(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).rc))' "$T/hung.json")
o=$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).out)' "$T/hung.json")
[ "$ms" -lt 3500 ] && pass "never-closing stdin returns in $ms ms" || fail "never-closing stdin took $ms ms"
assert_eq "never-closing stdin: exit 0" "0" "$rc"
assert_eq "never-closing stdin: no output" "" "$o"

echo "== hooks.json"
node -e '
const cur=JSON.parse(require("fs").readFileSync(process.argv[1]+"/hooks/hooks.json","utf8")).hooks.SessionStart;
const first=cur[0];
const ok=first.matcher==="startup|clear|compact" && first.hooks.length===1 &&
  first.hooks[0].command==="\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start" && cur.length===3 &&
  cur.slice(1).every(e=>e.matcher==="compact") &&
  cur[1].hooks[0].command.endsWith("session-start-runblock card") &&
  cur[2].hooks[0].command.endsWith("session-start-runblock state");
process.exit(ok?0:1)' "$REPO_ROOT" && pass "hooks.json: original entry intact, two compact entries" || fail "hooks.json shape"

echo "== session-start-codex"
chook() { # <stdin> [env assignments...]
  local in="$1"; shift
  printf '%s' "$in" | env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID XDG_STATE_HOME="$T/state" "$@" \
    bash "$P/hooks/session-start-codex"
}
register "$T/state"
out=$(chook '{"session_id":"S1","cwd":"/elsewhere","source":"compact"}')
assert_eq "codex: card then state" "$(printf 'CARD-TEXT\n\nSTATE-TEXT')" "$(printf '%s' "$out" | decode)"
assert_eq "codex: hookEventName" "SessionStart" "$(printf '%s' "$out" | node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(0,"utf8")).hookSpecificOutput.hookEventName)')"
out=$(chook '{"cwd":"/elsewhere"}' CODEX_THREAD_ID=S1)
assert_eq "codex: CODEX_THREAD_ID fallback, no source field" "$(printf 'CARD-TEXT\n\nSTATE-TEXT')" "$(printf '%s' "$out" | decode)"
out=$(chook "{\"session_id\":\"S9\",\"cwd\":\"$T/W/sub\"}")
assert_eq "codex: no cwd fallback (child with own id and coordinator cwd): no output" "" "$out"
out=$(chook '{"session_id":"S9","cwd":"/elsewhere","source":"compact"}'; echo "rc=$?")
assert_eq "codex: non-matching id: no output, exit 0" "rc=0" "$out"
out=$(chook "{\"session_id\":\"C9\",\"cwd\":\"$T/W\",\"source\":\"compact\"}")
assert_eq "codex: realistic child payload (own session_id, coordinator cwd): no output" "" "$out"
out=$(chook "{\"session_id\":\"C9\",\"cwd\":\"$T/W/.worktrees/t1\"}")
assert_eq "codex: task-worktree cwd, other id: no output" "" "$out"
out=$(chook '{}' CODEX_THREAD_ID=)
assert_eq "codex: no id, no cwd: no output" "" "$out"
echo bigall >"$T/mode"
out=$(chook '{"session_id":"S1"}')
len=$(printf '%s' "$out" | node -e 'process.stdout.write(String(JSON.parse(require("fs").readFileSync(0,"utf8")).hookSpecificOutput.additionalContext.length))')
assert_eq "codex: 17900-byte newline-free payload cut to exactly 17500" "17500" "$len"
echo file >"$T/mode"
cp "$T/payload-lines-codex" "$T/payload"
out=$(chook '{"session_id":"S1"}')
check_cut "codex lines over cap" "$out" 17500 lines-codex - 1
mkpayload mb-codex mb 9000
cp "$T/payload-mb-codex" "$T/payload"
out=$(chook '{"session_id":"S1"}')
check_cut "codex multibyte cut" "$out" 17500 mb-codex 17499 0
echo ctrl >"$T/mode"
dec=$(chook '{"session_id":"S1"}' | decode)
assert_eq "codex: ctrl: no control bytes" "0" "$(printf '%s' "$dec" | LC_ALL=C tr -d '\011\012\040-\377' | LC_ALL=C wc -c | tr -d ' ')"
echo fail >"$T/mode"
dec=$(chook '{"session_id":"S1"}' | decode)
assert_eq "codex: fail: card file then fallback" "$(printf 'CARD-FILE\n\nRun state unavailable — read run.md'"'"'s phase and run scripts/ledger-digest.')" "$dec"
echo hang >"$T/mode"
start=$(node -e 'process.stdout.write(String(Date.now()))')
out=$(chook '{"session_id":"S1"}'; echo "rc=$?")
end=$(node -e 'process.stdout.write(String(Date.now()))')
assert_has "codex: hang: card file" "CARD-FILE" "$out"
assert_has "codex: hang: fallback line" "Run state unavailable" "$out"
assert_has "codex: hang: exit 0" "rc=0" "$out"
[ $((end - start)) -lt 7000 ] && pass "codex: hang under 7 s ($((end - start)) ms)" || fail "codex: hang took $((end - start)) ms"
echo ok >"$T/mode"

echo "== hooks-codex.json"
node -e '
const j=JSON.parse(require("fs").readFileSync(process.argv[1]+"/hooks/hooks-codex.json","utf8"));
const ss=j.hooks.SessionStart;
const h=ss&&ss[0]&&ss[0].hooks;
const ok=Object.keys(j.hooks).length===1 && ss.length===1 && ss[0].matcher==="compact" && h.length===1 &&
  h[0].type==="command" && h[0].additionalContextLimit===6000 &&
  h[0].command==="\"${PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start-codex";
process.exit(ok?0:1)' "$REPO_ROOT" && pass "hooks-codex.json: one compact entry, limit 6000, fixed command" || fail "hooks-codex.json shape"

[ "$FAILED" = 0 ] || exit 1
echo "test-run-block: all tests passed"
