#!/usr/bin/env bash
# Breaks caught: one split final-review cluster with no review file (over the window, or a null
# cluster review) leaving its invocation's collection permanently incomplete, so every later
# range that touches the run's records gets `provenance unavailable` and a forced `not ready`;
# a re-review that rewrites the original reports, writes for the wrong invocation, or loses the
# part reviews it combined. Real scripts, real git, no mocks.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILLS="$REPO_ROOT/skills"
RS="$SKILLS/super-auto/scripts/report-status"
DT="$SKILLS/super-code/scripts/dispatch-text.mjs"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0
export GIT_AUTHOR_NAME=fixture GIT_AUTHOR_EMAIL=fixture@example.test GIT_COMMITTER_NAME=fixture GIT_COMMITTER_EMAIL=fixture@example.test

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; err=$(cat "$T/err"); }
g() { git -c commit.gpgsign=false -c core.hooksPath=/dev/null "$@"; }
# Pin check: a bare git write call would use the ambient identity, signing and hooks.
if grep -nE '(^|[^[:alnum:]_./-])git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?(commit|merge|rebase|cherry-pick|checkout|switch|init|add|rm|tag|branch|worktree|reset|revert|am)([[:space:]]|$)' "$0"; then fail "a bare git write call bypasses g"; else pass "every git write call goes through g"; fi
js() { node -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8"));console.log(new Function("d","return "+process.argv[1])(d))' "$1"; }
latest() { grep '^- review-collection · ' "$RUN" | tail -n 1 | sed 's/^- review-collection · //'; }
review() { # FILE VERDICT: a final-review file in reviewFileFormat() shape
  printf '# Review\n\n## Verdict\n%s\n\n## Must fix before landing\n- none\n\n## Untested scope\n- none\n\n## Deferred OK\n- none\n' "$2" >"$1"
}

R="$T/repo"; mkdir -p "$R"; cd "$R"; g init -q
mkdir -p src
echo '.superpowers/' >.gitignore
echo base >src/a.js; echo base >src/b.js; echo base >src/big.js
g add -A; g commit -qm base; BASE=$(g rev-parse HEAD)
echo 'a change' >>src/a.js; echo 'b change' >>src/b.js
head -c 6000 /dev/zero | tr '\0' x >>src/big.js
g commit -qam product; HEAD_=$(g rev-parse HEAD)

WS="$R/.superpowers/sdd/ep-plan"; mkdir -p "$WS"
RUNDIR="docs/superpowers/runs/r"; RUN="$R/$RUNDIR/run.md"; mkdir -p "$R/$RUNDIR"
ID=inv-a; PREFIX="final-review-$ID"; ASM="$WS/assembled/$PREFIX-final"
LAUNCH_A='Launch: args {"epicId":"ep","integrationBranch":"main","integrationWorktree":"'"$R"'","invocationId":"inv-a","reviewBase":"'"$BASE"'","reviewHead":"'"$HEAD_"'"}'
LAUNCH_B='Launch: args {"epicId":"ep","integrationBranch":"main","integrationWorktree":"'"$R"'","invocationId":"inv-b"}'
printf '%s\n%s\n' "$LAUNCH_A" "$LAUNCH_B" >"$WS/progress.md"

echo "S1 invocation inv-a: split review, cluster 2 over the window, collection gap"
run node "$DT" --ledger "$WS/progress.md" review-inputs --base "$BASE" --head "$HEAD_" --out-dir "$ASM"
assert_eq "$code" 0 "S1 review-inputs selects the product range"
echo '## Spec' >"$ASM/digest.md"; echo none >>"$ASM/digest.md"
node - "$ASM" <<'NODE'
const fs = require('fs'), dir = process.argv[2]
const sel = JSON.parse(fs.readFileSync(dir + '/review-inputs.json', 'utf8'))
const of = p => sel.slices.find(s => s.path === p).slice
fs.writeFileSync(dir + '/clusters.json', JSON.stringify({ changed: sel.changed, clusters: [
  { name: 'core', files: ['src/a.js'], slices: [of('src/a.js')] },
  { name: 'wide', files: ['src/b.js', 'src/big.js'], slices: [of('src/b.js'), of('src/big.js')] } ] }))
NODE
review "$WS/$PREFIX.cluster-1.md" ready
review "$WS/$PREFIX.md" 'not ready (unreviewed: cluster 2 (wide): over the window)'
printf 'phase: code\napprovals:\n' >"$RUN"
run bash "$RS" --collect "$RUN" --invocation "$ID" --workspace "$WS" --review "$WS/$PREFIX.md" --verdict 'not ready (unreviewed: cluster 2 (wide): over the window)'
assert_eq "$code" 3 "S1 collection exits 3: the cluster-2 review file can never appear by itself"
assert_eq "$(latest | js 'd.complete+" "+d.gaps.join(";")')" "false bundle unavailable: $PREFIX.cluster-2.md" "S1 the only gap is the missing cluster-2 file"
g add -A; g commit -qm 'run records with the gap'; GAPPED=$(g rev-parse HEAD)
run node "$DT" --ledger "$WS/progress.md" review-inputs --base "$HEAD_" --head "$GAPPED" --out-dir "$T/sel-gapped"
assert_eq "$code" 3 "S1 control: a later range touching run.md is provenance-unavailable"
grep -q 'incomplete claimed collection' "$T/sel-gapped/review-inputs.json" && pass "S1 control: the gap is the incomplete collection" || fail "S1 control: incomplete collection gap expected"

echo "S2 re-review-cluster addresses only a past invocation's missing cluster"
run node "$DT" --ledger "$WS/progress.md" --invocation-id "$ID" final-review --mode single
[ "$code" = 2 ] && pass "S2 a past invocation id is refused for other kinds" || fail "S2 past invocation id accepted for final-review (exit $code)"
run node "$DT" --ledger "$WS/progress.md" --invocation-id inv-none re-review-cluster --cluster 2 --threshold 100000
[ "$code" = 2 ] && pass "S2 an invocation id with no persisted Launch is refused" || fail "S2 unknown invocation accepted (exit $code)"
run node "$DT" --ledger "$WS/progress.md" --invocation-id "$ID" re-review-cluster --cluster 1 --threshold 100000
[ "$code" = 2 ] && pass "S2 a cluster that already has its review is refused" || fail "S2 reviewed cluster accepted (exit $code)"

echo "S3 the cluster now fits: one cluster review writes the missing file"
run node "$DT" --ledger "$WS/progress.md" --invocation-id "$ID" re-review-cluster --cluster 2 --threshold 100000
assert_eq "$code" 0 "S3 re-review-cluster exits 0"
printf '%s\n' "$out" >"$T/s3.json"
assert_eq "$(js 'd.mode+" "+d.path' <"$T/s3.json")" "single $WS/$PREFIX.cluster-2.md" "S3 single mode targets the invocation's cluster-2 file"
D3=$(js 'd.dispatch' <"$T/s3.json")
grep -qF -- "--invocation-id 'inv-a' --base '$BASE' --head '$HEAD_' --artifact '$WS/$PREFIX.cluster-2.md'" "$D3" && pass "S3 the write guard binds inv-a's captured source and the cluster-2 artifact" || fail "S3 write guard text"
grep -qF "cluster 2 (wide)" "$D3" && pass "S3 the prompt names cluster 2 (wide)" || fail "S3 prompt cluster name"
GUARD=$(grep -o "node '[^\`]*--artifact '[^']*'" "$D3" | head -n 1)
run bash -c "$GUARD"
assert_eq "$code" 0 "S3 the embedded write guard verifies inv-a's persisted source"
run bash -c "${GUARD/$HEAD_/$BASE}"
[ "$code" = 2 ] && pass "S3 the guard refuses a different head for inv-a" || fail "S3 guard accepted another head (exit $code)"
run node "$DT" --ledger "$WS/progress.md" bind-review-source --invocation-id "$ID" --base "$BASE" --head "$HEAD_" --artifact "$WS/$PREFIX.md.diff"
[ "$code" = 2 ] && pass "S3 an earlier invocation guards no artifact but a re-review one" || fail "S3 guard accepted a non-cluster artifact for inv-a (exit $code)"
run node "$DT" --ledger "$WS/progress.md" --invocation-id "$ID" re-review-cluster --cluster 2 --threshold 1
[ "$code" = 2 ] && pass "S3 a threshold that leaves no room beside the digest is refused" || fail "S3 tiny threshold accepted (exit $code)"

echo "S4 the cluster is still over the window: parts by file, then a combine review"
run node "$DT" --ledger "$WS/progress.md" --invocation-id "$ID" re-review-cluster --cluster 2 --threshold 900
assert_eq "$code" 0 "S4 split re-review-cluster exits 0"
printf '%s\n' "$out" >"$T/s4.json"
assert_eq "$(js 'd.mode+" "+d.parts.map(p=>p.part+":"+p.fits+":"+p.files.join(",")).join(" ")' <"$T/s4.json")" "split 1:true:src/b.js 2:false:src/big.js" "S4 b.js is a fitting part; big.js alone is over the window"
RE="$WS/re-review/$PREFIX.cluster-2"
P1=$(js 'd.parts[0].path' <"$T/s4.json")
assert_eq "$P1" "$RE/part-1.md" "S4 part reviews go under the re-review dir"
assert_eq "$(js 'String(d.parts[1].dispatch)' <"$T/s4.json")" "null" "S4 the over-window part gets no dispatch"
grep -qF "$RE/clusters.json" "$(js 'd.parts[0].dispatch' <"$T/s4.json")" && pass "S4 the part prompt reads the re-review manifest" || fail "S4 part prompt manifest"
run node "$DT" --ledger "$WS/progress.md" --invocation-id "$ID" re-review-cluster --cluster 2 --threshold 900
assert_eq "$code" 0 "S4 a repeat split with the same inputs is idempotent"
run node "$DT" --ledger "$WS/progress.md" --invocation-id "$ID" re-review-cluster --cluster 2 --threshold 5000
[ "$code" = 2 ] && pass "S4 a split that disagrees with the saved parts is refused" || fail "S4 conflicting split accepted (exit $code)"
run node "$DT" --ledger "$WS/progress.md" --invocation-id "$ID" re-review-cluster --cluster 2 --combine --reviewed 1
[ "$code" = 2 ] && pass "S4 combine refuses a reviewed part with no review file" || fail "S4 combine accepted a missing part review (exit $code)"
run node "$DT" --ledger "$WS/progress.md" --invocation-id "$ID" re-review-cluster --cluster 2 --combine --reviewed none
assert_eq "$(printf '%s' "$out" | js 'd.unreviewed.length')" "2" "S4 combine with --reviewed none names both parts unreviewed"
review "$P1" ready
run node "$DT" --ledger "$WS/progress.md" --invocation-id "$ID" re-review-cluster --cluster 2 --combine --reviewed 1
assert_eq "$code" 0 "S4 combine exits 0"
printf '%s\n' "$out" >"$T/s4c.json"
DC=$(js 'd.dispatch' <"$T/s4c.json")
grep -qF -- "--artifact '$WS/$PREFIX.cluster-2.md'" "$DC" && pass "S4 the combine review writes the cluster-2 file" || fail "S4 combine artifact"
grep -qF "part 2 (wide-part-2): src/big.js over the window" "$DC" && pass "S4 the combine prompt names the unreviewed part" || fail "S4 combine unreviewed part"
grep -qF "$P1" "$DC" && pass "S4 the combine prompt reads part 1's review" || fail "S4 combine part path"

echo "S5 collection replay closes the gap; the next range is no longer blocked"
review "$WS/$PREFIX.cluster-2.md" 'not ready (unreviewed: part 2 (wide-part-2): src/big.js over the window)'
ORIG=$(shasum -a 256 "$R/$RUNDIR/reviews/$ID/$PREFIX.md" | cut -d' ' -f1)
run bash "$RS" --collect "$RUN"
assert_eq "$code" 0 "S5 collection replay exits 0"
assert_eq "$(latest | js 'd.complete+" "+d.gaps.length')" "true 0" "S5 inv-a's record is complete"
[ -f "$R/$RUNDIR/reviews/$ID/re-review/$PREFIX.cluster-2/part-1.md" ] && pass "S5 the part review is archived" || fail "S5 part review not archived"
assert_eq "$(shasum -a 256 "$R/$RUNDIR/reviews/$ID/$PREFIX.md" | cut -d' ' -f1)" "$ORIG" "S5 the original final report is unchanged"
grep -q '"source":"inv-a/cluster-2"' "$RUN" && pass "S5 the new cluster review is a retained finding source" || fail "S5 no inv-a/cluster-2 finding-source"
g add -A; g commit -qm 'run records after re-review'; FILLED=$(g rev-parse HEAD)
run node "$DT" --ledger "$WS/progress.md" review-inputs --base "$HEAD_" --head "$FILLED" --out-dir "$T/sel-filled"
assert_eq "$code" 0 "S5 a later range touching run.md selects with complete provenance"
assert_eq "$(js 'd.status+" "+d.gaps.length' <"$T/sel-filled/review-inputs.json")" "complete 0" "S5 review-inputs.json is complete with no gaps"
assert_eq "$(js 'd.changed.filter(p=>/\/re-review\/.*\/(digest\.md|slices\/)/.test(p)).length' <"$T/sel-filled/review-inputs.json")" "0" "S5 the re-review's copied inputs are not selected as product changes"
assert_eq "$(js 'd.omitted.filter(o=>/\/re-review\/.*\/slices\//.test(JSON.stringify(o))).length>0' <"$T/sel-filled/review-inputs.json")" "true" "S5 they are omitted as claimed generated inputs"
run node "$DT" --ledger "$WS/progress.md" review-inputs --base "$GAPPED" --head "$FILLED" --out-dir "$T/sel-healed"
assert_eq "$code" 0 "S5 a range based on the gapped records also selects with complete provenance"

[ "$FAILURES" -eq 0 ] || { echo "FAILURES: $FAILURES"; exit 1; }
echo "cluster-re-review: all passed"
