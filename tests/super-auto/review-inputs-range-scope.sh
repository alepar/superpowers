#!/usr/bin/env bash
# Breaks caught: review-inputs blocking a product-only range on an untouched old run's incomplete
# collection; or, conversely, waiving problems in runs the range touches, the current run, or the
# origin of a touched mirror. Real git fixtures; the real dispatch-text script.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DT="$REPO_ROOT/skills/super-code/scripts/dispatch-text.mjs"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0
export GIT_AUTHOR_NAME=fixture GIT_AUTHOR_EMAIL=fixture@example.test GIT_COMMITTER_NAME=fixture GIT_COMMITTER_EMAIL=fixture@example.test

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
g() { git -c commit.gpgsign=false -c core.hooksPath=/dev/null "$@"; }
sha() { shasum -a 256 "$1" | cut -d' ' -f1; }
# Pin check: a bare git write call would use the ambient identity, signing and hooks.
if grep -nE '(^|[^[:alnum:]_./-])git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?(commit|merge|rebase|cherry-pick|checkout|switch|init|add|rm|tag|branch|worktree|reset|revert|am)([[:space:]]|$)' "$0"; then fail "a bare git write call bypasses g"; else pass "every git write call goes through g"; fi

REC='- review-collection · {"invocationId": "old-inv", "workspace": "/prior/workspace", "reviewPath": null, "review": "no work landed", "required": [], "settled": true, "complete": false, "gaps": ["retained prior failure"], "files": []}'
BAD='- review-collection · {not json'

# n=0 counter and last results, set by sel (not run in a subshell so they persist).
n=0 code=0 json=
sel() { # base head [extra review-inputs args]; fixture repo is the cwd
  local base=$1 head=$2; shift 2
  n=$((n + 1))
  set +e
  node "$DT" --ledger "$T/ledger.md" review-inputs --base "$base" --head "$head" --out-dir "$T/out-$n" "$@" >"$T/stdout-$n" 2>&1
  code=$?
  set -e
  json="$T/out-$n/review-inputs.json"
}
jq_() { node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(eval(process.argv[2]))' "$json" "$1"; }
expect() { # name want-exit
  if [ "$code" = "$2" ]; then pass "$1 (exit $2)"; else fail "$1: expected exit $2, got $code"; cat "$T/stdout-$n"; fi
}

launch() { printf 'Launch: args %s\n' "$1" >"$T/ledger.md"; }

new_repo() {
  rm -rf "$T/repo"; mkdir -p "$T/repo"; cd "$T/repo"; g init -q
  launch '{"epicId":"t","integrationBranch":"main","integrationWorktree":"'"$PWD"'","invocationId":"new-inv"}'
  echo zero >product.txt; g add -A; g commit -qm zero; ZERO=$(g rev-parse HEAD)
  mkdir -p docs/prior/reviews/old-inv
  printf '# Prior run\napprovals:\n%s\n' "$REC" >docs/prior/run.md
  echo old >docs/prior/reviews/old-inv/final-review-old-inv.md
  echo one >product.txt; g add -A; g commit -qm prior; PRIOR=$(g rev-parse HEAD)
}

echo "Plain prior run"
new_repo
echo two >product.txt; g commit -qam product; P=$(g rev-parse HEAD)
sel "$PRIOR" "$P"
expect "A product-only range, untouched incomplete prior run" 0
[ "$(jq_ 'j.status+" "+j.gaps.length+" "+(j.outOfRange.length>0)')" = "complete 0 true" ] && pass "A reports outOfRange, no gaps" || fail "A outOfRange/gaps"
grep -q 'Outside captured range (informational; neither selected nor waived): .*incomplete claimed collection' "$T/out-$n/generated-input-provenance.md" && pass "A provenance digest labels it informational" || fail "A provenance digest line"

echo x >>docs/prior/run.md; g commit -qam touch-run; B=$(g rev-parse HEAD)
sel "$P" "$B"; expect "B range edits the prior run.md" 3
[ "$(jq_ 'j.outOfRange.length')" = "0" ] && pass "B problem is a blocking gap, not outOfRange" || fail "B outOfRange should be empty"

echo changed >docs/prior/reviews/old-inv/final-review-old-inv.md; g commit -qam touch-archive; C=$(g rev-parse HEAD)
sel "$B" "$C"; expect "C range edits a file under the prior reviews/" 3

printf 'approvals:\n%s\n' "$BAD" >docs/prior/run.md; g commit -qam corrupt; D=$(g rev-parse HEAD)
sel "$C" "$D"; expect "D range corrupts the prior run.md" 3

g rm -q docs/prior/run.md; g commit -qm delete; E=$(g rev-parse HEAD)
sel "$D" "$E"; expect "E range deletes the corrupt run.md" 3

g checkout -q -b broad "$PRIOR"; echo b >product.txt; g commit -qam broad; BROAD=$(g rev-parse HEAD)
sel "$ZERO" "$BROAD"; expect "F broad range whose base predates the prior run" 3

echo "Current run"
new_repo
launch '{"epicId":"t","integrationBranch":"main","integrationWorktree":"'"$PWD"'","invocationId":"new-inv","reviewRunFile":"docs/prior/run.md"}'
echo two >product.txt; g commit -qam product; P=$(g rev-parse HEAD)
sel "$PRIOR" "$P" --review-run-file docs/prior/run.md
expect "current run with incomplete history stays guarded on a product-only range" 3

echo "Mirror and origin"
mirror_repo() { # $1 = tag naming the case; builds origin with a malformed record plus a mirror copy
  new_repo
  rm -rf docs/prior; mkdir -p docs/origin
  printf '# Origin\napprovals:\n%s\n' "$BAD" >docs/origin/run.md
  g add -A; g commit -qm origin; ORIGIN=$(g rev-parse HEAD)
}
write_mirror() {
  mkdir -p fixtures/mirror
  { cat docs/origin/run.md; echo 'Proposal commentary.'; } >fixtures/mirror/run.md
  node -e 'const fs=require("fs"),c=require("crypto"),h=f=>c.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
    fs.writeFileSync("fixtures/mirror/run.md.collection-origin.json",JSON.stringify({version:1,kind:"collection-history-mirror",copySha256:h("fixtures/mirror/run.md"),origin:{commit:process.argv[1],run:"docs/origin/run.md",sha256:h("docs/origin/run.md")}})+"\n")' "$ORIGIN"
}

mirror_repo; BASE=$ORIGIN
write_mirror; g add -A; g commit -qm mirror; M=$(g rev-parse HEAD)
echo two >product.txt; g commit -qam product; P=$(g rev-parse HEAD)
sel "$M" "$P"
expect "M2 untouched mirror and origin pair, product-only range" 0
[ "$(jq_ 'j.gaps.length+" "+j.outOfRange.some(t=>/malformed collection record/.test(t))')" = "0 true" ] && pass "M2 origin problem is outOfRange" || fail "M2 origin problem should be outOfRange"
[ "$(jq_ 'j.outOfRange.some(t=>/invalid collection origin/.test(t))')" = "true" ] && pass "M2 declaration authentication gap is outOfRange" || fail "M2 declaration gap should be outOfRange"

sel "$BASE" "$M"
expect "M1 range adds the mirror run.md, origin untouched" 3
[ "$(jq_ 'j.gaps.some(t=>/docs\/origin\/run.md:.*malformed collection record/.test(t))')" = "true" ] && pass "M1 origin snapshot problem blocks" || fail "M1 origin snapshot problem should be a gap"

echo "Many out-of-range runs"
new_repo
for i in $(seq 1 25); do
  mkdir -p "docs/prior-$i/reviews/old-inv-$i"
  printf '# Prior run\napprovals:\n%s\n' "${REC//old-inv/old-inv-$i}" >"docs/prior-$i/run.md"
  echo old >"docs/prior-$i/reviews/old-inv-$i/final-review-old-inv-$i.md"
done
g add -A; g commit -qm many-prior; MANY=$(g rev-parse HEAD)
echo two >product.txt; g commit -qam product; P=$(g rev-parse HEAD)
sel "$MANY" "$P"
expect "N many untouched incomplete prior runs, product-only range" 0
[ "$(jq_ 'j.status+" "+(j.outOfRange.length>=25)')" = "complete true" ] && pass "N full outOfRange list stays in review-inputs.json" || fail "N review-inputs.json outOfRange"
PROV="$T/out-$n/generated-input-provenance.md"
[ "$(grep -c '^- Outside captured range (informational; neither selected nor waived): ' "$PROV")" = "20" ] && pass "N provenance digest lists exactly the sample cap" || fail "N provenance sample cap"
TOTAL=$(jq_ 'j.outOfRange.length')
grep -q "^- Outside captured range: $TOTAL informational entries .*review-inputs.json" "$PROV" && pass "N count line names the total and review-inputs.json" || fail "N provenance count line"

[ "$FAILURES" -eq 0 ] || { echo "FAILURES: $FAILURES"; exit 1; }
echo "review-inputs-range-scope: all passed"
