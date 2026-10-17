#!/usr/bin/env bash
# Contract lint for skills/super-auto: (a) run-state.md's worked run.md example against its
# §Field table; (b) every §<Heading>, <file> §<Heading> and run-state.md item <N> (<label>)
# pointer resolves; (c) no numeric count in runtime prose points at a list; (R7) the field
# table's names and line formats and SKILL.md's phase sequence match the pre-epic baseline
# (fixtures from 2bf1d53, plus fields added deliberately since — codeBuckets.worktreesKept, codeBuckets.processSweep, friction, roastCodeExit, codeMechanism, runTag, context, findingsLedger, findingsLedgerDesign, redesignCycles-code, redesignCycles-design, redesign-<loop>-<K>, stepBackCode-round-<N>, stepBackDesign-round-<N>, approvals · coverage-amend-<loop>-<K>; the appended format lines pin the redesign record, its state and designRoast vocabulary, and the step-back decision forms); example status lines have a shape report-status prints; (keys) I8 and the Phase 5 key steps name report-verdict --keys and SKILL.md and report-prompt.md carry the null reviewPath rule; (step1) both loops' Step 1 items appear in order with their branch outcomes, Amend Mode's steps 1-7 appear in order, and the effective-cap formula is spelled one way everywhere. Then it
# mutates a copy of the skill and checks each mutation is caught. Pure bash and awk.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FIX="$SCRIPT_DIR/fixtures/contract-lint"
RSF="$SCRIPT_DIR/fixtures/report-status"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0
TAB=$(printf '\t')
RUNTIME="SKILL.md run-state.md resume.md report-prompt.md scope-filter-prompt.md"

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

headings() {
  awk '/^[ \t]*(```|~~~)/ { f = !f; next } !f && /^#+ / { h = $0; sub(/^#+ +/, "", h); sub(/[ \t#]+$/, "", h); print h }' "$1"
}
field_names() {
  awk '/^## / { t = ($0 == "## Field table"); next } t && /^\| `/ { c = $0; sub(/^\| `/, "", c); print substr(c, 1, index(c, "`") - 1) }' "$1"
}
field_table_text() {
  awk '/^## / { t = ($0 == "## Field table"); next } t { gsub(/\\\|/, "|"); printf "%s ", $0 }' "$1" | tr -s ' \t' ' '
}
collapse() { tr -s ' \t\n' ' ' | sed 's/^ //; s/ $//'; }
shape() { sed -E 's/\[degraded: [^]]*\]/[degraded: Q]/; s/phase (<phase>|[a-z-]+)/phase P/; s/<[NM]>|[0-9]+/N/g'; }

check_example() { # SKILL_DIR
  local rs="$1/run-state.md" kinds
  field_names "$rs" > "$T/fields"
  [ -s "$T/fields" ] || { echo "super-auto/run-state.md: no §Field table rows found"; return; }
  awk '/^## File format — worked example/ { s = 1; next } s && /^## / { s = 0 } s && /^```/ { if (b) exit; b = 1; next } b' "$rs" > "$T/example.md"
  [ -s "$T/example.md" ] || { echo "super-auto/run-state.md: no fenced block under §File format — worked example"; return; }
  kinds=" $(awk '/^\| `parked`/' "$rs" | sed 's/[`|\;,()]/ /g') "
  awk -v fields="$T/fields" -v kinds="$kinds" -v F="super-auto/run-state.md" '
    BEGIN {
      while ((getline l < fields) > 0) {
        if (index(l, " · ")) { split(l, a, " · "); rec[a[2]] = 1 }
        else if (index(l, ".")) { split(l, a, "."); bucket[a[2]] = 1 }
        else top[l] = 1
      }
    }
    function norm(s) { gsub(/-round-[0-9]+/, "-round-<N>", s); sub(/-(code|design)-[0-9]+$/, "-<loop>-<K>", s); return s }
    /^#/ || /^[ \t]*$/ { next }
    /^[A-Za-z][A-Za-z0-9-]*:/ {
      k = norm(substr($0, 1, index($0, ":") - 1)); block = k
      if (!(k in top)) print F ": worked example field `" k "` is not in §Field table"
      next
    }
    block == "codeBuckets" && /^[ \t]+[A-Za-z]+:/ {
      k = $0; sub(/^[ \t]+/, "", k); k = substr(k, 1, index(k, ":") - 1); seen[k] = 1
      if (!(k in bucket)) print F ": worked example bucket `" k "` is not in §Field table"
      next
    }
    block == "approvals" && /^- / {
      k = substr($0, 3); i = index(k, " · "); if (i) k = substr(k, 1, i - 1); k = norm(k)
      if (!(k in rec)) print F ": worked example approvals record `" k "` is not in §Field table"
      next
    }
    block == "parked" && /^- / {
      n = split($0, p, " · "); kind = p[2]; gsub(/^[ \t]+|[ \t]+$/, "", kind)
      if (n < 3 || kind == "" || index(kinds, " " kind " ") == 0) print F ": worked example parked line has no known kind: " $0
      next
    }
    { print F ": worked example line not covered by §Field table: " $0 }
    END { for (b in bucket) if (!(b in seen)) print F ": worked example codeBuckets block lacks `" b "`" }
  ' "$T/example.md"
}

resolve() { # TOKEN CURRENT_FILE SKILLS_ROOT REPO_ROOT
  local t=$1 cur=$2 skills=$3 repo=$4
  case "$t" in
    ./*.md) echo "$(dirname "$cur")/${t#./}" ;;
    skills/*.md) echo "$repo/$t" ;;
    */*.md) echo "$skills/$t" ;;
    *.md) echo "$(dirname "$cur")/$t" ;;
    super-design|super-code|super-roast|super-auto|upstream-feedback|finishing-a-development-branch|brainstorming|using-git-worktrees|subagent-driven-development|writing-plans|using-superpowers)
      echo "$skills/$t/SKILL.md" ;;
    *) echo "$cur" ;;
  esac
}

check_pointers() { # SKILLS_ROOT REPO_ROOT
  local skills=$1 repo=$2 f rel line tok rest target ok h nxt n lab
  for f in "$skills"/super-auto/*.md; do
    rel="super-auto/$(basename "$f")"
    awk -v q="'" '
      /^[ \t]*(```|~~~)/ { fence = !fence; next }
      fence { next }
      {
        s = $0; pre = ""
        while ((i = index(s, "§")) > 0) {
          pre = pre substr(s, 1, i - 1); rest = substr(s, i + length("§")); s = rest
          ticks = pre; nt = gsub(/`/, "", ticks)
          if (nt % 2 == 1 || rest ~ /^[<0-9]/) { pre = pre "§"; continue }
          tok = pre; sub(/[ \t(]+$/, "", tok); n = split(tok, w, /[ \t(]+/); t = (n ? w[n] : "")
          gsub(/`/, "", t); if (substr(t, length(t) - 1) == q "s") t = substr(t, 1, length(t) - 2)
          sub(/^superpowers:/, "", t); if (t == "") t = "-"
          printf "%d\t%s\t%s\n", FNR, t, rest
          pre = pre "§"
        }
      }' "$f" > "$T/ptrs"
    while IFS="$TAB" read -r line tok rest; do
      target=$(resolve "$tok" "$f" "$skills" "$repo")
      if [ ! -f "$target" ]; then echo "$rel:$line: pointer target file not found for '$tok'"; continue; fi
      ok=0
      while IFS= read -r h; do
        [ -n "$h" ] || continue
        case "$rest" in
          "$h") ok=1; break ;;
          "$h"*) nxt=${rest:${#h}:1}; case "$nxt" in [A-Za-z0-9]) ;; *) ok=1; break ;; esac ;;
        esac
      done < <(headings "$target")
      [ "$ok" = 1 ] || echo "$rel:$line: pointer §${rest%%[.,;:)|]*} matches no heading in ${target#"$repo"/}"
    done < "$T/ptrs"
    awk '/^[ \t]*(```|~~~)/ { f = !f; next } f { next } {
      s = $0
      while (match(s, /run-state\.md`? item [0-9]+/)) {
        m = substr(s, RSTART, RLENGTH); s = substr(s, RSTART + RLENGTH); n = m; sub(/.* item /, "", n)
        lab = "-"; if (match(s, /^ \([^)]+\)/)) lab = substr(s, 3, RLENGTH - 3)
        printf "%d\t%s\t%s\n", FNR, n, lab
      }
    }' "$f" > "$T/items"
    while IFS="$TAB" read -r line n lab; do
      if [ "$lab" = "-" ]; then echo "$rel:$line: run-state.md item $n has no (<label>)"; continue; fi
      awk -v want="$n. **$lab**" 'index($0, want) == 1 { found = 1 } END { exit !found }' "$skills/super-auto/run-state.md" \
        || echo "$rel:$line: run-state.md item $n ($lab) matches no numbered item"
    done < "$T/items"
  done
}

check_counts() { # SKILL_DIR
  local b
  for b in $RUNTIME; do
    [ -f "$1/$b" ] || continue
    awk -v F="super-auto/$b" '
      BEGIN {
        num = "(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|[2-9]|[1-9][0-9]+)"
        noun = "(things?|items?|fields?|flags?|states?|phases?|sections?|conditions?|kinds?|stops?|sources?|forms?|contents|buckets?|rules?|steps?|values?|requirements?|roles?|parts?|commands?|questions?|checks?|columns?|rows?|status(es)?)"
        re1 = "(^|[^a-z0-9-])" num "[ -](of (these|the|those) )?(required |optional )?" noun "([^a-z]|$)"
        re2 = "(^|[^a-z])all " num "([^a-z0-9]|$)"
      }
      /^[ \t]*(```|~~~)/ { f = !f; next }
      f { next }
      {
        s = tolower($0); gsub(/`[^`]*`/, "", s)
        if (match(s, re1) || match(s, re2)) print F ":" FNR ": numeric count points at a list: \"" substr(s, RSTART, RLENGTH) "\""
      }' "$1/$b"
  done
}

check_baseline() { # SKILL_DIR
  local l
  field_names "$1/run-state.md" | LC_ALL=C sort -u > "$T/now-fields"
  LC_ALL=C sort -u "$FIX/run-state-fields-2bf1d53.txt" > "$T/base-fields"
  LC_ALL=C comm -23 "$T/base-fields" "$T/now-fields" | sed 's|^|super-auto/run-state.md: §Field table lost baseline field: |'
  LC_ALL=C comm -13 "$T/base-fields" "$T/now-fields" | sed 's|^|super-auto/run-state.md: §Field table adds a field not in the baseline: |'
  field_table_text "$1/run-state.md" > "$T/table.txt"
  while IFS= read -r l; do
    [ -n "$l" ] || continue
    l=$(printf '%s' "$l" | collapse)
    grep -qF -- "$l" "$T/table.txt" || echo "super-auto/run-state.md: §Field table lacks baseline line format: $l"
  done < "$FIX/run-state-formats-2bf1d53.txt"
  awk '/^## / { s = ($0 == "## Phase sequence"); next } s && /^\| *[0-9]+ *\|/ { split($0, c, "|"); x = c[3]; if (match(x, /\(`[^)]*\)/)) { x = substr(x, RSTART + 1, RLENGTH - 2); gsub(/`/, "", x); print x } }' "$1/SKILL.md" > "$T/now-phases"
  diff "$FIX/phase-sequence-2bf1d53.txt" "$T/now-phases" > /dev/null \
    || echo "super-auto/SKILL.md: §Phase sequence tokens differ from the 2bf1d53 baseline: $(tr '\n' ' ' < "$T/now-phases")"
}

check_status_examples() { # SKILL_DIR
  local rs="$1/scripts/report-status" f b l st out
  [ -f "$rs" ] || { echo "super-auto/scripts/report-status: missing"; return; }
  bash "$rs" "$T/example.md" > /dev/null 2>&1 || echo "super-auto/run-state.md: report-status rejects the worked example"
  : > "$T/shapes"
  for f in "$RSF"/*.md; do
    if out=$(bash "$rs" "$f" 2>/dev/null); then printf '%s\n' "$out" | head -1 | shape >> "$T/shapes"; fi
  done
  bash "$rs" --stalled code "$RSF/clean.md" | head -1 | shape >> "$T/shapes"
  for b in report-prompt.md run-state.md; do
    [ -f "$1/$b" ] || continue
    awk '{ s = $0; while (match(s, /status: (clean|completed|stalled)[^`]*/)) { print FNR "\t" substr(s, RSTART, RLENGTH); s = substr(s, RSTART + RLENGTH) } }' "$1/$b" > "$T/sx"
    while IFS="$TAB" read -r l st; do
      st=$(printf '%s' "$st" | sed -E 's/[ ]+$//' | shape)
      grep -qxF -- "$st" "$T/shapes" || echo "super-auto/$b:$l: example status line has a shape report-status never prints: $st"
    done < "$T/sx"
  done
}

check_keys_rule() { # SKILL_DIR
  local a b
  grep '^- I8 ' "$1/SKILL.md" | grep -qF 'report-verdict --keys' || echo "SKILL.md: I8 does not name report-verdict --keys"
  for a in 'First write the step-back keys file' 'Write the scope keys file' 'Its Must-fix and untested-scope items'; do
    grep -F -- "$a" "$1/SKILL.md" | grep -qF 'report-verdict --keys' || echo "SKILL.md: '$a' does not use report-verdict --keys"
  done
  for b in SKILL.md report-prompt.md; do
    { grep -qF 'null `reviewPath`' "$1/$b" && grep -qF '[Must-fix] untested: whole-epic review' "$1/$b"; } || echo "$b: no null reviewPath rule"
  done
}

check_disputed() { # SKILL_DIR
  local para cap
  para=$(awk '/^## / { s = ($0 == "## Disputed Blocking findings"); next } s' "$1/report-prompt.md")
  [ -n "$para" ] || { echo "(disputed) report-prompt.md: no §Disputed Blocking findings paragraph"; return; }
  printf '%s' "$para" | grep -qF 'roastCodeCapped:' || echo "(disputed) report-prompt.md: disputed route does not name roastCodeCapped:"
  printf '%s' "$para" | grep -qF 'roastDesignCapped:' || echo "(disputed) report-prompt.md: disputed route does not name roastDesignCapped:"
  printf '%s' "$para" | grep -qF 'counts every Blocking row of either findings ledger whose status is `disputed`' || echo "(disputed) report-prompt.md: disputed route does not count disputed ledger rows"
  cap=$(awk '/^#+ / { s = ($0 == "#### Cap disposition"); next } s' "$1/SKILL.md")
  printf '%s' "$cap" | grep -qF 'roastCodeCapped:' || echo "(disputed) SKILL.md: §Cap disposition does not write roastCodeCapped:"
}

check_report_rows() { # SKILL_DIR
  local rp="$1/report-prompt.md" row t
  row=$(grep '^| Remaining |' "$rp" || true)
  [ -n "$row" ] || { echo "(report rows) report-prompt.md: no Remaining row"; return; }
  for t in '`disputed`' 'redesign budget spent' 'redesign gate not computable' 'redesign declined by human' 'redesign aborted' 'redesign incomplete' 'amend roast finding not fixed'; do
    printf '%s' "$row" | grep -qF -- "$t" || echo "(report rows) report-prompt.md: Remaining row lacks $t"
  done
  row=$(grep '^| Gotchas & surprises |' "$rp" || true)
  [ -n "$row" ] || { echo "(report rows) report-prompt.md: no Gotchas & surprises row"; return; }
  for t in 'redesign-<code|design>-<K>' '`state`' '`designRoast`'; do
    printf '%s' "$row" | grep -qF -- "$t" || echo "(report rows) report-prompt.md: Gotchas & surprises row lacks $t"
  done
}

check_itercap() { # SKILLS_ROOT
  local all ok
  grep -qF 'config.iterationCap' "$1/super-roast/SKILL.md" || echo "(iterationCap) super-roast/SKILL.md does not name config.iterationCap"
  all=$(grep -o 'config\.iterationCap' "$1/super-auto/SKILL.md" | wc -l)
  ok=$(grep -oE 'config\.iterationCap` = `3 \+ redesignCycles-(code|design)`' "$1/super-auto/SKILL.md" | wc -l)
  [ "$all" -gt 0 ] || echo "(iterationCap) super-auto/SKILL.md never names config.iterationCap"
  [ "$all" = "$ok" ] || echo "(iterationCap) super-auto/SKILL.md: $((all - ok)) config.iterationCap mention(s) do not read 3 + redesignCycles-code|design"
}

# (step1) The ordered procedures the loops run from prose. item N of a section = the text from the
# line starting "N. " up to the next numbered line; item_has asserts each key sits in the item of
# its number, so a swapped, merged or deleted item moves a key out of its place and is caught.
section() { # FILE START_REGEX END_REGEX
  awk -v a="$2" -v b="$3" 's == 0 && $0 ~ a { s = 1; print; next } s && $0 ~ b { exit } s { print }' "$1"
}
item_text() { # SECTION_FILE N
  awk -v n="$2" '$0 ~ /^[0-9]+\. / { cur = $0; sub(/\..*/, "", cur); on = (cur == n) } on { print }' "$1" | collapse
}
item_has() { # LABEL SECTION_FILE N KEY...
  local label=$1 sec=$2 n=$3 txt k; shift 3
  txt=$(item_text "$sec" "$n")
  [ -n "$txt" ] || { echo "(step1) $label: item $n is missing"; return; }
  for k in "$@"; do
    case "$txt" in *"$k"*) ;; *) echo "(step1) $label: item $n lacks '$k'" ;; esac
  done
}
check_step1() { # SKILLS_ROOT
  local sa="$1/super-auto/SKILL.md" sd="$1/super-design/SKILL.md" f i txt a b
  # super-auto §Step 1 — step back
  f="$T/s1-auto"; section "$sa" '^#### Step 1 — step back$' '^#### Step 2' > "$f"
  item_has "super-auto Step 1" "$f" 1 'step-back keys file'
  item_has "super-auto Step 1" "$f" 2 'findings-ledger'
  item_has "super-auto Step 1" "$f" 3 'thrash — lastGood breach' 'redesign-code-<K>' 'higher than the previous round'
  item_has "super-auto Step 1" "$f" 4 'step-back-prompt.md'
  item_has "super-auto Step 1" "$f" 5 'step-back-check' 'exit 0' 'exit 3' 'exit 2'
  item_has "super-auto Step 1" "$f" 6 'redesign declined by human'
  item_has "super-auto Step 1" "$f" 7 'Choose the branch' '`local`' 'scope: inside' 'scope: outside' 'redesign budget spent' 'thrash exit' 'dissolved@r'
  for i in 1 2 3 4 5 6; do
    case "$(item_text "$f" $i)" in *'dissolved@r<N>'*) echo "(step1) super-auto Step 1: item $i writes a dissolved line before the branch item" ;; esac
  done
  # super-design §Adversarial Review Loop, Step 1
  f="$T/s1-design"; section "$sd" '^\*\*Step 1 — before fixing\.\*\*' '^\*\*Redesign cycle\.\*\*' > "$f"
  item_has "super-design Step 1" "$f" 1 'Keys file'
  item_has "super-design Step 1" "$f" 2 'Ledger' 'findings-ledger'
  item_has "super-design Step 1" "$f" 3 'Last-known-good breach' 'thrash — lastGood breach' 'higher than the previous round'
  item_has "super-design Step 1" "$f" 4 'Step-back' 'step-back-prompt.md'
  item_has "super-design Step 1" "$f" 5 'Check' 'step-back-check' 'Exit 0' 'Exit 3' 'Exit 2'
  item_has "super-design Step 1" "$f" 6 'Interactive runs' 'redesign declined by human'
  item_has "super-design Step 1" "$f" 7 'Branch' '`local`' 'scope `inside`' 'scope `outside`' 'redesign budget spent' 'thrash exit' 'dissolved@r'
  for i in 1 2 3 4 5 6; do
    case "$(item_text "$f" $i)" in *'dissolved@r<N>'*) echo "(step1) super-design Step 1: item $i writes a dissolved line before the branch item" ;; esac
  done
  # super-design §Amend Mode steps 1-7
  f="$T/s1-amend"; section "$sd" '^## Amend Mode$' '^## Parallelism' > "$f"
  item_has "Amend Mode" "$f" 1 'Dispatch the amend designer'
  item_has "Amend Mode" "$f" 2 'Validate' 'amend-check' 'exit 2' 'git checkout HEAD --' 'aborted — amend rejected'
  txt=$(item_text "$f" 2)
  case "${txt%%On \`ok\`*}" in *estore*) echo "(step1) Amend Mode: step 2 restores on exit 2 (bad input), which is not a reject" ;; esac
  item_has "Amend Mode" "$f" 3 'Commit' 'specs-committed'
  item_has "Amend Mode" "$f" 4 'File the' 'bd update' 'bd create' 'beads-filed'
  txt=$(item_text "$f" 4); a=${txt%%bd update*}; b=${txt%%bd create*}
  [ "${#a}" -lt "${#b}" ] || echo "(step1) Amend Mode: step 4 files with bd create before it reopens with bd update"
  item_has "Amend Mode" "$f" 5 'Disputes' 'disputed@r'
  item_has "Amend Mode" "$f" 6 'Coverage' 'coverage-amend-<loop>-<K>'
  item_has "Amend Mode" "$f" 7 'Return' 'applied'
  # the effective cap and the budget compare are spelled one way in both loops
  for f in "$sa" "$sd"; do
    txt=$(collapse < "$f")
    printf '%s' "$txt" | grep -oE 'redesignCycles(-[a-z*]+)?' | sort -u | grep -vxE 'redesignCycles-(code|design|\*)' \
      | sed "s|^|(step1) ${f#"$1"/}: redesignCycles is not suffixed -code or -design: |" || true
    printf '%s' "$txt" | grep -oE '3 *\+ *`?redesignCycles[^ ]*' | sed 's/[`,.;:)]*$//' | grep -vE '^3 \+ `?redesignCycles-(code|design)$' \
      | sed "s|^|(step1) ${f#"$1"/}: effective cap is not spelled 3 + redesignCycles-<loop>: |" || true
    printf '%s' "$txt" | grep -oE 'redesignCycles-(code|design)` *< *[0-9]+' | grep -vE '< 2$' \
      | sed "s|^|(step1) ${f#"$1"/}: redesign budget compare is not < 2: |" || true
  done
  grep -oE '3 *\+ *`?redesignCycles[^ ]*' "$1/super-auto/run-state.md" | sed 's/[`,.;:)]*$//' | grep -vE '^3 \+ `?redesignCycles-(code|design)$' \
    | sed 's|^|(step1) super-auto/run-state.md: effective cap is not spelled 3 + redesignCycles-<loop>: |' || true
}

# (abort) Every abort route removes the round's dissolved override lines before the state reads
# `aborted`, so a crash resumes into a state whose replay repeats the removal.
bullet_text() { # FILE START_REGEX -> the bullet from its first line to the next bullet or blank line
  awk -v a="$2" 's == 0 && $0 ~ a { s = 1; print; next } s && (/^- / || /^$/) { exit } s { print }' "$1" | collapse
}
abort_has() { # LABEL TEXT KEY...
  local label=$1 txt=$2 k; shift 2
  [ -n "$txt" ] || { echo "(abort) $label: bullet is missing"; return; }
  for k in "$@"; do
    case "$txt" in *"$k"*) ;; *) echo "(abort) $label: lacks '$k'" ;; esac
  done
}
abort_before() { # LABEL TEXT FIRST SECOND
  local a=${2%%"$3"*} b=${2%%"$4"*}
  case "$2" in *"$3"*"$4"*) ;; *) echo "(abort) $1: '$3' does not come before '$4'"; return ;; esac
  [ "${#a}" -lt "${#b}" ] || echo "(abort) $1: '$3' does not come before '$4'"
}
check_abort() { # SKILLS_ROOT
  local sa="$1/super-auto/SKILL.md" sd="$1/super-design/SKILL.md" rs="$1/super-auto/resume.md" f txt
  f="$T/ab-auto"; section "$sa" '^#### Redesign cycle$' '^#### ' > "$f"
  txt=$(item_text "$f" 2)
  abort_has "super-auto Redesign cycle item 2" "$txt" 'dissolved@r<N>' 'rebuild'
  abort_before "super-auto Redesign cycle item 2" "$txt" 'dissolved@r<N>' '`aborted — <reason>`'
  txt=$(bullet_text "$sd" '^- `aborted — <reason>`')
  abort_has "super-design Redesign cycle aborted bullet" "$txt" 'dissolved@r<N>' 'rebuild'
  abort_before "super-design Redesign cycle aborted bullet" "$txt" 'dissolved@r<N>' 'rewrite the state'
  f="$T/ab-resume"; section "$rs" '^## Redesign cycle replay$' '^## ' > "$f"
  txt=$(bullet_text "$f" '^- `amend-checked`')
  abort_has "resume.md amend-checked bullet" "$txt" 'dissolved@r<N>'
  abort_before "resume.md amend-checked bullet" "$txt" 'dissolved@r<N>' 'aborted — amend rejected on resume'
  txt=$(bullet_text "$f" '^- `aborted — <reason>`')
  abort_has "resume.md aborted bullet" "$txt" 'dissolved@r<N>' 'rebuild'
  f="$T/ab-reentry"; section "$sd" '^\*\*Resuming a redesign cycle\*\*' '^\*\*A partially-written' > "$f"
  abort_has "super-design Re-entry amend-checked bullet" "$(bullet_text "$f" '^- `amend-checked`')" 'dissolved@r<N>'
  abort_has "super-design Re-entry aborted bullet" "$(bullet_text "$f" '^- `aborted — …`')" 'dissolved@r<N>'
  f="$T/ab-phase"; section "$rs" '^## Resuming at a phase$' '^## ' > "$f"
  txt=$(grep -F 'dissolved' "$f" | collapse)
  case "$txt" in *aborted*) ;; *) echo "(abort) resume.md: the dissolved-skip rule does not name a non-aborted record" ;; esac
}

lint() { # SKILLS_ROOT REPO_ROOT -> one "file[:line]: message" per problem
  check_example "$1/super-auto"
  check_pointers "$1" "$2"
  check_counts "$1/super-auto"
  check_baseline "$1/super-auto"
  check_status_examples "$1/super-auto"
  check_keys_rule "$1/super-auto"
  check_disputed "$1/super-auto"
  check_report_rows "$1/super-auto"
  check_itercap "$1"
  check_step1 "$1"
  check_abort "$1"
}

echo "contract lint: live tree"
out=$(lint "$REPO_ROOT/skills" "$REPO_ROOT")
if [ -z "$out" ]; then pass "skills/super-auto has no contract problems"
else fail "skills/super-auto has contract problems:"; printf '%s\n' "$out" | sed 's/^/    /'; fi

copy() {
  rm -rf "$T/skills"; mkdir -p "$T/skills"
  cp -R "$REPO_ROOT/skills/super-auto" "$T/skills/"
  for d in "$REPO_ROOT"/skills/*/; do
    n=$(basename "$d"); [ "$n" = super-auto ] || ln -s "$d" "$T/skills/$n"
  done
}
expect_caught() { # DESCRIPTION EXPECTED_SUBSTRING
  local got; got=$(lint "$T/skills" "$REPO_ROOT")
  if printf '%s\n' "$got" | grep -qF -- "$2"; then pass "$1"; else fail "$1"; echo "    expected a problem containing: $2"; fi
}
SA="$T/skills/super-auto"

echo
echo "contract lint: mutations are caught"
copy; printf '\nSee §No such heading here.\n' >> "$SA/SKILL.md"
expect_caught "a broken § pointer fails" "No such heading here"
copy; printf '\nSee run-state.md item 5 (No such label).\n' >> "$SA/SKILL.md"
expect_caught "a mislabelled run-state item pointer fails" "item 5 (No such label)"
copy; awk '{ print } /^phase: roast-code$/ { print "bogusField: 1" }' "$REPO_ROOT/skills/super-auto/run-state.md" > "$SA/run-state.md"
expect_caught "an unknown worked-example field fails" "bogusField"
copy; awk '/^  slowness:/ && !d { d = 1; next } { print }' "$REPO_ROOT/skills/super-auto/run-state.md" > "$SA/run-state.md"
expect_caught "a worked example missing a codeBuckets bucket fails" 'lacks `slowness`'
copy; printf '\nCollect all seven flags at once.\n' >> "$SA/SKILL.md"
expect_caught "a numeric list count fails" "numeric count points at a list"
copy; sed 's/^| `roastCodeRound` |/| `roastCodeRounds` |/' "$REPO_ROOT/skills/super-auto/run-state.md" > "$SA/run-state.md"
expect_caught "a renamed field-table field fails the baseline" "lost baseline field: roastCodeRound"
copy; sed '/^- I8 /s/report-verdict --keys/report-verdict/g' "$REPO_ROOT/skills/super-auto/SKILL.md" > "$SA/SKILL.md"
expect_caught "I8 without --keys fails" "I8 does not name report-verdict --keys"
copy; grep -vF 'whole-epic review' "$REPO_ROOT/skills/super-auto/report-prompt.md" > "$SA/report-prompt.md"
expect_caught "report-prompt without the null reviewPath rule fails" "report-prompt.md: no null reviewPath rule"

copy; sed 's/^| `redesign-<loop>-<K>` |\(.*\)beads-filed\\|/| `redesign-<loop>-<K>` |\1/' "$REPO_ROOT/skills/super-auto/run-state.md" > "$SA/run-state.md"
expect_caught "a redesign record row missing the beads-filed state fails the baseline" "lacks baseline line format: redesign-<code|design>-<K>"
copy; sed 's/`local \\| redesign`/`patch \\| redesign`/g' "$REPO_ROOT/skills/super-auto/run-state.md" > "$SA/run-state.md"
expect_caught "a step-back decision vocabulary without local fails the baseline" 'lacks baseline line format: its decision `local | redesign`'
copy; sed '/^## Disputed Blocking findings/,/^## Smells/s/ or `roastDesignCapped:`//' "$REPO_ROOT/skills/super-auto/report-prompt.md" > "$SA/report-prompt.md"
expect_caught "a disputed route that drops roastDesignCapped fails" "disputed route does not name roastDesignCapped:"
copy; sed '/^## Disputed Blocking findings/,/^## Smells/s/of either findings ledger/of the code ledger/' "$REPO_ROOT/skills/super-auto/report-prompt.md" > "$SA/report-prompt.md"
expect_caught "a disputed route that stops counting disputed ledger rows fails" "disputed route does not count disputed ledger rows"
copy; sed 's/`redesign incomplete`/`redesign unfinished`/' "$REPO_ROOT/skills/super-auto/report-prompt.md" > "$SA/report-prompt.md"
expect_caught "a Remaining row that drops redesign incomplete fails" "Remaining row lacks redesign incomplete"
copy; sed '/^| Gotchas/s/ and its `designRoast`//' "$REPO_ROOT/skills/super-auto/report-prompt.md" > "$SA/report-prompt.md"
expect_caught "a Gotchas row that drops designRoast fails" 'Gotchas & surprises row lacks `designRoast`'
copy; sed 's/config.iterationCap` = `3 + redesignCycles-code`/config.iterationCap` = `3`/' "$REPO_ROOT/skills/super-auto/SKILL.md" > "$SA/SKILL.md"
expect_caught "a super-auto config.iterationCap that is a bare 3 fails" "config.iterationCap mention(s) do not read"

copy; sed -e 's/^4\. Dispatch the step-back/5. Dispatch the step-back/' -e 's/^5\. Check it with/4. Check it with/' "$REPO_ROOT/skills/super-auto/SKILL.md" > "$SA/SKILL.md"
expect_caught "swapping two Step 1 items fails" "super-auto Step 1: item 4 lacks 'step-back-prompt.md'"
copy; awk '/^6\. Interactive runs: a `redesign`/ { next } { print }' "$REPO_ROOT/skills/super-auto/SKILL.md" > "$SA/SKILL.md"
expect_caught "deleting the interactive-decline item fails" "super-auto Step 1: item 6 is missing"
copy; sed 's/3 + redesignCycles-code/3 + redesignCycles/' "$REPO_ROOT/skills/super-auto/SKILL.md" > "$SA/SKILL.md"
expect_caught "a bare 3 + redesignCycles in super-auto fails" "redesignCycles is not suffixed"
copy; sed 's/`redesignCycles-code` < 2/`redesignCycles-code` < 3/' "$REPO_ROOT/skills/super-auto/SKILL.md" > "$SA/SKILL.md"
expect_caught "a redesign budget compare other than < 2 fails" "redesign budget compare is not < 2"
copy; sed 's/^\(.*\)\(thrash exit\)/\1thrash stop/' "$REPO_ROOT/skills/super-auto/SKILL.md" > "$SA/SKILL.md"
expect_caught "a branch item that loses its thrash outcome fails" "item 7 lacks 'thrash exit'"
copy; rm "$T/skills/super-design"; cp -R "$REPO_ROOT/skills/super-design" "$T/skills/super-design"
awk '/^3\. \*\*Commit\*\*/ { three = $0; next } /^4\. \*\*File the/ && three != "" { print; next } { print }' "$REPO_ROOT/skills/super-design/SKILL.md" > "$T/skills/super-design/SKILL.md"
expect_caught "a missing Amend Mode step 3 fails" "Amend Mode: item 3"
copy; rm "$T/skills/super-design"; cp -R "$REPO_ROOT/skills/super-design" "$T/skills/super-design"
sed 's/bd update/bd reopen/g' "$REPO_ROOT/skills/super-design/SKILL.md" > "$T/skills/super-design/SKILL.md"
expect_caught "an Amend Mode step 4 that no longer reopens first fails" "Amend Mode: item 4 lacks 'bd update'"
copy; rm "$T/skills/super-design"; cp -R "$REPO_ROOT/skills/super-design" "$T/skills/super-design"
sed '/^7\. \*\*Branch/,/^\*\*Redesign cycle/s/`redesignCycles-design` < 2/`redesignCycles-design` < 4/' "$REPO_ROOT/skills/super-design/SKILL.md" > "$T/skills/super-design/SKILL.md"
expect_caught "a super-design budget compare other than < 2 fails" "super-design/SKILL.md: redesign budget compare is not < 2"

copy; awk '/^2\. On `aborted`/ { gsub(/remove from `<run-dir>\/findings-overrides.md` the `dissolved@r<N>` lines Step 1 wrote for this round.s record and rebuild the ledger \(Step 1 item 2.s invocation\), /, ""); gsub(/dissolved@r<N>/, "dropped") } { print }' "$REPO_ROOT/skills/super-auto/SKILL.md" > "$SA/SKILL.md"
expect_caught "a super-auto Redesign cycle item 2 without the removal fails" "super-auto Redesign cycle item 2: lacks 'dissolved@r<N>'"
copy; sed '/^- `amend-checked`/s/dissolved@r<N>/dropped/g' "$REPO_ROOT/skills/super-auto/resume.md" > "$SA/resume.md"
expect_caught "a resume amend-checked bullet without the removal fails" "resume.md amend-checked bullet: lacks 'dissolved@r<N>'"
copy; rm "$T/skills/super-design"; cp -R "$REPO_ROOT/skills/super-design" "$T/skills/super-design"
awk '/^- `aborted — <reason>`/ { on = 1 } on && /^$/ { on = 0 } on { gsub(/dissolved@r<N>/, "dropped") } { print }' "$REPO_ROOT/skills/super-design/SKILL.md" > "$T/skills/super-design/SKILL.md"
expect_caught "a super-design aborted bullet without the removal fails" "super-design Redesign cycle aborted bullet: lacks 'dissolved@r<N>'"

echo
if [ "$FAILURES" -eq 0 ]; then
  echo "All super-auto contract lint tests passed"
  exit 0
else
  echo "$FAILURES super-auto contract lint test(s) failed"
  exit 1
fi
