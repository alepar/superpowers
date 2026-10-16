#!/usr/bin/env bash
# shellcheck disable=SC2034  # constants are consumed by the sourcing entry scripts
# Sourced library for the post-compaction run-block hooks (RunBlockInjector). Defines functions and
# constants only: it never exits and never prints on its own. Entry scripts (session-start-runblock,
# session-start-codex) source it. Every failure path ends in "no output"; it is an optimisation,
# never a gate.

RB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RB_SCRIPTS="$RB_ROOT/skills/super-code/scripts"
RB_CARD="$RB_ROOT/skills/super-code/coordinator-card.md"
RB_STATE_FALLBACK="Run state unavailable — read run.md's phase and run scripts/ledger-digest."
RB_INPUT=""
RB_MARKER=""

# rb_run_bounded <seconds> <outfile> <cmd...>: run cmd with stdout to outfile (stderr discarded) under
# a portable watchdog (macOS has no `timeout`). stdin is /dev/null unless RB_IN_FD names an open fd.
# Returns the command's status, or 124 on timeout.
rb_run_bounded() {
  local secs="$1" out="$2" pid ticks=0 max rc
  shift 2
  max=$((secs * 10))
  if [ -n "${RB_IN_FD:-}" ]; then
    "$@" >"$out" 2>/dev/null <&"$RB_IN_FD" &
  else
    "$@" >"$out" 2>/dev/null </dev/null &
  fi
  pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$ticks" -ge "$max" ]; then
      pkill -TERM -P "$pid" 2>/dev/null || true
      kill -TERM "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      return 124
    fi
    sleep 0.1
    ticks=$((ticks + 1))
  done
  rc=0
  wait "$pid" 2>/dev/null || rc=$?
  return "$rc"
}

# rb_read_stdin: set RB_INPUT from the hook's stdin, bounded to 2 s and 64 KiB; empty on a terminal.
rb_read_stdin() {
  local tmp
  RB_INPUT=""
  [ -t 0 ] && return 0
  tmp=$(mktemp "${TMPDIR:-/tmp}/rb-in.XXXXXX" 2>/dev/null) || return 0
  exec 3<&0
  RB_IN_FD=3 rb_run_bounded 2 "$tmp" head -c 65536 || true
  exec 3<&-
  RB_INPUT=$(cat "$tmp" 2>/dev/null || true)
  rm -f "$tmp"
  return 0
}

# rb_field <name>: first string value of "<name>" in RB_INPUT.
rb_field() {
  printf '%s' "$RB_INPUT" | tr '\n' ' ' \
    | grep -o "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" 2>/dev/null | head -1 \
    | sed 's/^[^:]*:[[:space:]]*"\(.*\)"$/\1/'
}

# rb_is_subagent: status 0 when RB_INPUT names a subagent or child thread (a non-empty, non-null,
# non-false value under any identifying key).
rb_is_subagent() {
  local k v flat
  flat=$(printf '%s' "$RB_INPUT" | tr '\n' ' ')
  for k in agent_id agent_type parent_thread_id thread_spawn subagent; do
    v=$(printf '%s' "$flat" | grep -o "\"$k\"[[:space:]]*:[[:space:]]*[^,}]*" 2>/dev/null | head -1 \
      | sed 's/^[^:]*:[[:space:]]*//; s/[[:space:]]*$//')
    case "$v" in
      ''|'""'|null|false) ;;
      *) return 0 ;;
    esac
  done
  return 1
}

# rb_resolve <session_id> <cwd>: set RB_MARKER from `run-marker get`; status 0 only on a hit.
rb_resolve() {
  local sid="${1:-}" cwd="${2:-}" out
  local args=()
  RB_MARKER=""
  [ -n "$sid" ] || [ -n "$cwd" ] || return 1
  args+=(get)
  args+=("${sid:-none}")
  [ -n "$cwd" ] && args+=(--cwd "$cwd")
  rb_is_subagent && args+=(--subagent)
  out=$(bash "$RB_SCRIPTS/run-marker" "${args[@]}" 2>/dev/null) || return 1
  [ -n "$out" ] || return 1
  RB_MARKER="$out"
  return 0
}

# rb_digest <part> <budget> <seconds>: print the run-digest part; status 0 only on exit 0 with output.
rb_digest() {
  local part="$1" budget="$2" secs="$3" out inp rc=0 text
  out=$(mktemp "${TMPDIR:-/tmp}/rb-out.XXXXXX" 2>/dev/null) || return 1
  inp=$(mktemp "${TMPDIR:-/tmp}/rb-mk.XXXXXX" 2>/dev/null) || { rm -f "$out"; return 1; }
  printf '%s\n' "$RB_MARKER" >"$inp"
  exec 4<"$inp"
  RB_IN_FD=4 rb_run_bounded "$secs" "$out" bash "$RB_SCRIPTS/run-digest" --part "$part" --budget "$budget" || rc=$?
  exec 4<&-
  text=$(cat "$out" 2>/dev/null || true)
  rm -f "$out" "$inp"
  [ "$rc" -eq 0 ] && [ -n "$text" ] || return 1
  printf '%s' "$text"
}

# rb_sanitize: drop U+0000-U+001F except tab and newline (CR goes too).
rb_sanitize() { LC_ALL=C tr -d '\000-\010\013-\037'; }

# Escape string for JSON embedding (copy of hooks/session-start's function).
escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

# rb_emit_claude <text>: print Claude Code's SessionStart additionalContext JSON (printf, not a
# heredoc: bash 5.3 heredoc hang, see hooks/session-start).
rb_emit_claude() {
  local clean esc
  clean=$(printf '%s' "$1" | rb_sanitize)
  esc=$(escape_for_json "$clean")
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$esc"
}
