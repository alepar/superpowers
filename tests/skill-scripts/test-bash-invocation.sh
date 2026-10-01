#!/usr/bin/env bash
# Skill helper scripts can lose their exec bit on install (marketplace unpacking, copied skill
# dirs), so every helper-to-helper call goes through an interpreter: `bash <path>`,
# `"${BASH:-bash}" <path>`, or `node <path>` — never a direct `"$dir/<helper>"` exec.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FAILURES=0
checked=0
names=$(for h in "$REPO_ROOT"/skills/*/scripts/*; do b=${h##*/}; case "$b" in (*.*) ;; (*) echo "$b" ;; esac; done | sort -u)

for f in "$REPO_ROOT"/skills/*/scripts/*; do
  [ -f "$f" ] || continue
  head -1 "$f" | grep -q 'bash' || continue
  checked=$((checked + 1))
  while IFS= read -r line; do
    case "$line" in \#*) continue ;; esac
    for n in $names; do
      if printf '%s\n' "$line" | grep -Eq "(^|[;&|(\`]|\\\$\\(|then|do|else)[[:space:]]*\"?\\\$[A-Za-z_{}]*[^ ]*/$n\\b"; then
        echo "  [FAIL] ${f#"$REPO_ROOT"/}: direct exec of $n: $line"
        FAILURES=$((FAILURES + 1))
      fi
    done
  done < "$f"
done

echo "  checked $checked bash helper scripts"
if [ "$FAILURES" -eq 0 ]; then echo "All helper invocations go through an interpreter"; else echo "$FAILURES direct invocation(s)"; exit 1; fi
