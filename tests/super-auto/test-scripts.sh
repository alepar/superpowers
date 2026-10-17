#!/usr/bin/env bash
# Tests for skills/super-auto/scripts; each section below names the script it covers.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
S="$REPO_ROOT/skills/super-auto/scripts/scope-dispositions"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; }

cat > "$T/keys" <<'K'
[Blocking] a.rs:1
[Should-fix] store/mod.rs:838
[Should-fix] seats.rs:702
[Should-fix] hook.rs:716
[Nit] fmt.rs:3
[Should-fix] x.rs:9
[Should-fix] y.rs:4
K
cat > "$T/filter.json" <<'F'
{"findings":[
{"key":"[Blocking] a.rs:1","disposition":"punch-list","reason":"wrong"},
{"key":"[Should-fix] store/mod.rs:838","disposition":"punch-list","reason":"not goal-named"},
{"key":"[Should-fix] seats.rs:702","disposition":"punch-list","reason":"not goal-named","clusterOverride":"seats are bounded at 16"},
{"key":"[Should-fix] hook.rs:716","disposition":"in-scope","reason":"goal path"},
{"key":"[Nit] fmt.rs:3","disposition":"punch-list","reason":"style"},
{"key":"[Should-fix] y.rs:4","disposition":"punch-list","reason":"hardening"}
]}
F
cat > "$T/sb.md" <<'B'
decision: patch
summary: sweep the unbounded scans
pattern: cluster a
clusters:
  - a: r1 [Should-fix] store/mod.rs:838, r2 [Should-fix] store/mod.rs:838, r2 [Should-fix] seats.rs:702, r2 [Should-fix] hook.rs:716 | rule: page every list query with a bounded cursor
  - b: r2 [Should-fix] y.rs:4, r2 [Nit] fmt.rs:3 | rule: no member in scope, so nothing is pulled in
B

echo "scope-dispositions"
run bash "$S" --round 2 --findings "$T/keys" --filter "$T/filter.json" --step-back "$T/sb.md"
assert_eq "$code" 0 "exits 0"
expected='scopeFilter-round-2: [Blocking] a.rs:1 in-scope — Blocking, always in-scope
scopeFilter-round-2: [Should-fix] store/mod.rs:838 in-scope — cluster a
scopeFilter-round-2: [Should-fix] seats.rs:702 punch-list — cluster override: seats are bounded at 16
scopeFilter-round-2: [Should-fix] hook.rs:716 in-scope — goal path
scopeFilter-round-2: [Nit] fmt.rs:3 punch-list — style
scopeFilter-round-2: [Should-fix] x.rs:9 in-scope — unrouted by filter — defaulted in-scope
scopeFilter-round-2: [Should-fix] y.rs:4 punch-list — hardening
cluster dropped: b — no member in scope, so nothing is pulled in
scope-filter: 4 in-scope · 3 punch-listed'
assert_eq "$out" "$expected" "Blocking/unrouted defaults, cluster pull-in, override, all-punch cluster untouched and reported dropped"

run bash "$S" --round 2 --findings "$T/keys" --filter "$T/filter.json"
assert_eq "$(printf '%s\n' "$out" | grep 'store/mod.rs:838')" "scopeFilter-round-2: [Should-fix] store/mod.rs:838 punch-list — not goal-named" "no step-back file: no cluster pull-in"

run bash "$S" --round 3 --findings "$T/keys" --filter "$T/filter.json" --step-back "$T/sb.md"
assert_eq "$(printf '%s\n' "$out" | tail -1)" "scope-filter: 3 in-scope · 4 punch-listed" "cluster members of another round are ignored"
assert_eq "$(printf '%s\n' "$out" | grep -c '^cluster dropped:' || true)" "0" "a cluster with no member in this round is not reported dropped"
printf '[Should-fix] store/mod.rs:838\n[Should-fix] hook.rs:716\n' > "$T/keys-dropped"
printf '{"findings":[{"key":"[Should-fix] store/mod.rs:838","disposition":"punch-list","reason":"x"},{"key":"[Should-fix] hook.rs:716","disposition":"punch-list","reason":"y"}]}\n' > "$T/filter-dropped.json"
run bash "$S" --round 2 --findings "$T/keys-dropped" --filter "$T/filter-dropped.json" --step-back "$T/sb.md"
assert_eq "$(printf '%s\n' "$out" | tail -2)" "cluster dropped: a — page every list query with a bounded cursor
scope-filter: 0 in-scope · 2 punch-listed" "every present member punch-listed: cluster dropped line, with its rule, before the summary"

run bash "$S" --round x --findings "$T/keys" --filter "$T/filter.json"
assert_eq "$code" 2 "non-numeric round exits 2"
run bash "$S" --round 2 --findings "$T/missing" --filter "$T/filter.json"
assert_eq "$code" 2 "missing findings file exits 2"

nojq=$(mktemp -d)
ln -s "$(command -v bash)" "$nojq/bash"
run env PATH="$nojq" bash "$S" --round 2 --findings "$T/keys" --filter "$T/filter.json" --step-back "$T/sb.md"
rm -rf "$nojq"
assert_eq "$code" 4 "missing jq exits 4"
assert_eq "$(printf '%s' "$out" | cut -c1-15)" "JQ_UNAVAILABLE:" "missing jq prints the manual-computation line"
assert_eq "$(printf '%s' "$out" | grep -c 'cluster dropped: <id> — ' || true)" "1" "the manual-computation line includes the cluster dropped rule"

echo
echo "step-back-check"
SBC="$REPO_ROOT/skills/super-auto/scripts/step-back-check"
SF="$SCRIPT_DIR/fixtures/step-back-check"

run bash "$SBC" --step-back "$SF/valid-patch.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "0:ok" "valid patch record (no scope:) is ok"
run bash "$SBC" --step-back "$SF/valid-redesign.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "0:ok" "valid redesign with rN-prefixed, comma-bearing keys is ok"
run bash "$SBC" --step-back "$SF/unknown-key.md" --keys "$SF/keys.txt"
assert_eq "$code" 3 "unknown key exits 3"
assert_eq "$out" "reject: dissolves: unknown key '[Nit] report-prompt.md:40'
reject: dissolves: unknown key 'r3 [Blocking] nowhere.ts:1'" "unprefixed and unknown keys each get a reject line"
run bash "$SBC" --step-back "$SF/missing-decision.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "3:reject: decision: missing" "missing decision: is rejected"
run bash "$SBC" --step-back "$SF/redesign-no-scope.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "3:reject: scope: missing (required for redesign)" "redesign without scope: is rejected"

run bash "$SBC" --step-back "$SF/missing.md" --keys "$SF/keys.txt"
assert_eq "$code" 2 "missing step-back file exits 2"
run bash "$SBC" --step-back "$SF/valid-patch.md"
assert_eq "$code" 2 "missing --keys exits 2"

echo "report-status"
RS="$REPO_ROOT/skills/super-auto/scripts/report-status"
RF="$SCRIPT_DIR/fixtures/report-status"
rs_status() { run bash "$RS" "$@"; printf '%s\n' "$out" | head -1; }

assert_eq "$(rs_status "$RF/clean.md" --tip 3f9c2e1)" "status: clean" "clean run"
run bash "$RS" "$RF/clean.md" --tip 3f9c2e1
assert_eq "$code" 0 "clean run exits 0"
assert_eq "$out" "status: clean" "clean run prints no qualifier lines"
assert_eq "$(rs_status "$RF/degraded-verdict.md")" "status: clean [degraded: low coverage, redesign proposed, not applied]" "degraded-verdict qualifiers come from the part before ' — ' (a bracket in the tail is ignored); beyond-cap and graph-change do not count"
run bash "$RS" "$RF/escalations.md"
assert_eq "$out" "status: completed with 0 unresolved Blocking, 2 escalations [degraded: low coverage, code findings parked]
qualifier: low coverage
qualifier: code findings parked" "parked escalation plus codeBuckets.escalated count as escalations; one qualifier line each"
assert_eq "$(rs_status "$RF/roast-skipped.md")" "status: clean [degraded: plan roast skipped, code roast skipped]" "skipped roasts (t/f flag values) are qualifiers"
assert_eq "$(rs_status "$RF/code-capped.md")" "status: completed with 2 unresolved Blocking, 0 escalations" "roastCodeCapped keys (comma-bearing locations) count as unresolved Blocking"
assert_eq "$(rs_status "$RF/code-thrash.md")" "status: completed with 2 unresolved Blocking, 0 escalations" "roastCodeCapped written at a thrash exit counts its keys"
assert_eq "$(rs_status "$RF/design-capped-proceeded.md")" "status: completed with 2 unresolved Blocking, 0 escalations [degraded: design roast capped-blocking, code roast skipped]" "proceeded design cap counts its keys and leads the qualifiers"
assert_eq "$(rs_status "$RF/design-capped-unparseable.md")" "status: completed with 1 unresolved Blocking, 0 escalations [degraded: design roast capped-blocking]" "design cap with no stopped/proceeded slot counts as proceeded"
run bash "$RS" "$RF/design-capped-stopped.md"
assert_eq "$out" "status: stalled at phase capped-blocking" "phase capped-blocking is a stall; no codeBuckets before phase report adds no qualifier"
assert_eq "$(rs_status "$RF/code-stalled.md")" "status: stalled at phase code" "codeBuckets.stalled true is a stall at code"
assert_eq "$(rs_status "$RF/pending-retry.md")" "status: completed with 0 unresolved Blocking, 0 escalations [degraded: tasks pending retry, final review: Blocking (2 confirmed)]" "pendingRetry forces completed form; non-CLEAN review is a qualifier"
assert_eq "$(rs_status "$RF/no-buckets.md")" "status: clean [degraded: final review: none recorded, sweep: none recorded]" "no codeBuckets block at phase report gives the none-recorded qualifiers"
assert_eq "$(rs_status "$RF/buckets-partial.md" --tip 3f9c2e1)" "status: clean [degraded: escalated bucket: none recorded, pendingRetry bucket: none recorded, parked bucket: none recorded, stalled bucket: none recorded]" "a bucket line missing from codeBuckets is a qualifier"

SW='3f9c2e1 — 412 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: npm test @ 3f9c2e1'
assert_eq "$(rs_status "$RF/sweep-deferred.md")" "status: clean [degraded: sweep: SWEEP DEFERRED (caller-owned)]" "deferred sweep is a qualifier"
assert_eq "$(rs_status "$RF/sweep-failed.md" --tip 7c01d9e)" "status: clean [degraded: sweep: 7c01d9e — 414 passed, 1 failed, 0 errors, 0 skipped; failing: tests/limiter.test.ts::burst; command: npm test @ 7c01d9e]" "a non-zero failed count is a qualifier"
assert_eq "$(rs_status "$RF/sweep-invalid.md" --tip 5d4c3b2)" "status: clean [degraded: sweep: MEASUREMENT INVALID: runner exited before writing its summary @ 5d4c3b2]" "MEASUREMENT INVALID is a qualifier"
assert_eq "$(rs_status "$RF/sweep-fix-passed.md" --tip 7c01d9e)" "status: clean" "a passing sweep-fix re-run rewritten into codeBuckets.sweep keeps clean"
assert_eq "$(rs_status "$RF/sweep-unstamped.md")" "status: clean [degraded: sweep: unstamped — 7fb4cd0 — 860 passed, 0 failed, 0 errors, 0 skipped; command: bash tests/super-code/test-coordinator-replay.sh]" "a passing sweep with no @ <sha> stamp is a qualifier"
sed "s/0 errors, 0 skipped/2 errors, 0 skipped/" "$RF/clean.md" > "$T/sweep-errors.md"
assert_eq "$(rs_status "$T/sweep-errors.md" --tip 3f9c2e1)" "status: clean [degraded: sweep: 3f9c2e1 — 412 passed, 0 failed, 2 errors, 0 skipped; failing: none; command: npm test @ 3f9c2e1]" "a non-zero errors count is a qualifier"
sed "s/^  sweep: .*/  sweep: SWEEP UNAVAILABLE — the sweep dispatch returned null/" "$RF/clean.md" > "$T/sweep-unavailable.md"
assert_eq "$(rs_status "$T/sweep-unavailable.md" --tip 3f9c2e1)" "status: clean [degraded: sweep: SWEEP UNAVAILABLE — the sweep dispatch returned null]" "SWEEP UNAVAILABLE is a qualifier"
sed "s/^  sweep: .*/  sweep: PASS 412 tests @ 3f9c2e1/" "$RF/clean.md" > "$T/sweep-legacy.md"
assert_eq "$(rs_status "$T/sweep-legacy.md" --tip 3f9c2e1)" "status: clean [degraded: sweep: PASS 412 tests @ 3f9c2e1]" "a sweep outside the pinned grammar is a qualifier, never a pass"
assert_eq "$(rs_status "$RF/clean.md" --tip 3f9c2e1a)" "status: clean" "--tip matching the sweep SHA keeps clean"
assert_eq "$(rs_status "$RF/clean.md" --tip abcdef0)" "status: clean [degraded: sweep: not at tip — $SW]" "--tip that does not resolve against the sweep SHA is a qualifier"
# Phase 6 commits run.md, friction.md and report.md after the sweep. Those commits stay inside the
# run directory, so the stamp they follow is still at the tip; a commit anywhere else is not.
G="$T/tip-repo"; GR="$G/docs/superpowers/runs/2026-07-31-per-tenant-rate-limiter"
gitq() { git -C "$G" -c user.name=t -c user.email=t@t -c commit.gpgsign=false -c core.hooksPath=/dev/null "$@" > /dev/null; }
mkdir -p "$GR" "$G/src"
git init -q "$G"
echo 'limit = 10' > "$G/src/limiter.conf"
gitq add -A; gitq commit -q -m code
stamp=$(git -C "$G" rev-parse --short=7 HEAD)
sed "s/3f9c2e1/$stamp/g" "$RF/clean.md" > "$GR/run.md"
gitq add -A; gitq commit -q -m 'run.md: sweep'
echo '- friction' > "$GR/friction.md"; echo 'status: pending' > "$GR/report.md"
gitq add -A; gitq commit -q -m 'report and friction'
run bash "$RS" "$GR/run.md" --tip "$(git -C "$G" rev-parse HEAD)"
assert_eq "$code:$out" "0:status: clean" "only run-directory commits between the sweep stamp and --tip keep clean"
mkdir -p "$G/docs/superpowers/runs/other-run"; echo x > "$G/docs/superpowers/runs/other-run/run.md"
gitq add -A; gitq commit -q -m 'another run directory'
assert_eq "$(rs_status "$GR/run.md" --tip "$(git -C "$G" rev-parse HEAD)")" "status: clean [degraded: sweep: not at tip — ${SW//3f9c2e1/$stamp}]" "a commit outside this run's directory, even under docs/superpowers/runs, is a qualifier"
gitq reset -q --hard HEAD~1
echo 'limit = 20' > "$G/src/limiter.conf"
gitq add -A; gitq commit -q -m 'code after the sweep'
echo '- more' >> "$GR/friction.md"; gitq add -A; gitq commit -q -m friction
assert_eq "$(rs_status "$GR/run.md" --tip "$(git -C "$G" rev-parse HEAD)")" "status: clean [degraded: sweep: not at tip — ${SW//3f9c2e1/$stamp}]" "a code commit between the sweep stamp and --tip is a qualifier"
RV="$RF/degraded-resolves-on-sweep.md"
assert_eq "$(rs_status "$RV" --tip 3f9c2e1)" "status: clean [degraded: panel-capped: 1 unverified]" "a resolves-on: sweep degraded verdict is skipped when the sweep passes at --tip; others stay"
assert_eq "$(rs_status "$RV")" "status: clean [degraded: low coverage, panel-capped: 1 unverified]" "without --tip a resolves-on: sweep degraded verdict keeps its qualifier"
assert_eq "$(rs_status "$RV" --tip abcdef0)" "status: clean [degraded: low coverage, panel-capped: 1 unverified, sweep: not at tip — $SW]" "a sweep not at the tip does not resolve it"
sed "s/^  sweep: .*/  sweep: SWEEP DEFERRED (caller-owned)/" "$RV" > "$T/resolves-deferred.md"
assert_eq "$(rs_status "$T/resolves-deferred.md" --tip 3f9c2e1)" "status: clean [degraded: low coverage, panel-capped: 1 unverified, sweep: SWEEP DEFERRED (caller-owned)]" "a sweep that is not a pass does not resolve it"
sed "s/^  review: .*/  review: not ready (2 Should-fix open)/" "$RF/clean.md" > "$T/review-not-ready.md"
assert_eq "$(rs_status "$T/review-not-ready.md" --tip 3f9c2e1)" "status: clean [degraded: final review: not ready (2 Should-fix open)]" "review: not ready (...) is a qualifier; review: ready is clean"
sed "s/^  review: .*/  review: ready (after the phase-6 sweep @ 3f9c2e1)/" "$RF/clean.md" > "$T/review-ready-after.md"
assert_eq "$(rs_status "$T/review-ready-after.md" --tip 3f9c2e1)" "status: clean" "review: ready (after the phase-6 sweep @ sha) is clean"
assert_eq "$(rs_status --stalled finish "$RF/clean.md")" "status: stalled at phase finish" "--stalled before RUN_MD"
run bash "$RS" "$RF/roast-skipped.md" --stalled roast-code
assert_eq "$out" "status: stalled at phase roast-code
qualifier: plan roast skipped
qualifier: code roast skipped" "--stalled wins; qualifier lines still printed"

run bash "$RS" "$RF/clean.md" --stalled bogus
assert_eq "$code" 2 "unknown --stalled phase exits 2"
run bash "$RS" "$RF/clean.md" --tip XYZ
assert_eq "$code" 2 "non-SHA --tip exits 2"
run bash "$RS" "$RF/missing.md"
assert_eq "$code" 2 "missing run.md exits 2"
run bash "$RS" "$RF/no-phase.md"
assert_eq "$code" 2 "run.md without phase: exits 2"
run bash "$RS" "$RF/bad-phase.md"
assert_eq "$code" 2 "a phase: value that is not a run-state.md token exits 2"
run bash "$RS" "$RF/no-flags.md"
assert_eq "$code" 2 "run.md without flags: exits 2"
run bash "$RS" "$RF/flags-incomplete.md"
assert_eq "$code" 2 "a flags: line missing skipCodeRoast= exits 2"
run bash "$RS"
assert_eq "$code" 2 "no arguments exits 2"

nojq=$(mktemp -d)
ln -s "$(command -v bash)" "$nojq/bash"
ln -s "$(command -v awk)" "$nojq/awk"
run env PATH="$nojq" bash "$SBC" --step-back "$SF/valid-redesign.md" --keys "$SF/keys.txt"
assert_eq "$code:$out" "0:ok" "step-back-check runs with only bash and awk on PATH (no jq)"
run env PATH="$nojq" bash "$RS" "$RF/escalations.md"
assert_eq "$code" 0 "report-status runs with only bash and awk on PATH (no jq)"
rm -rf "$nojq"

# Run attribution uses the existing durable parked source, independently of replaced code buckets.
echo "run attribution: caller retention"
cp "$RF/clean.md" "$T/attribution-run.md"
cat >> "$T/attribution-run.md" <<'ATTR'

parked:
- progress.md#run-failure-F · degraded-verdict · "run-regression F owner bd-A; task bd-B exonerated; evidence/A.log"
- progress.md#run-failure-G · degraded-verdict · "attribution gap G: missing run baseline; evidence/G.log"
ATTR
run bash "$RS" "$T/attribution-run.md" --tip 3f9c2e1
assert_eq "$code" 0 "caller run.md accepts durable regression and gap pointers in existing parked records"
case "$out" in *"run-regression F owner bd-A"*"attribution gap G"*) pass "clean latest buckets preserve run owner and attribution gap qualifiers" ;; *) fail "clean latest buckets preserve run owner and attribution gap qualifiers" ;; esac
for contract in "$REPO_ROOT/skills/super-auto/SKILL.md" "$REPO_ROOT/skills/super-auto/run-state.md" "$REPO_ROOT/skills/super-auto/report-prompt.md"; do
  if grep -qF 'run-regression' "$contract" && grep -qF 'attribution gap' "$contract"; then pass "$(basename "$contract") carries regression and missing-baseline obligations"; else fail "$(basename "$contract") carries regression and missing-baseline obligations"; fi
done

echo
echo "scope-dispositions: outstanding occurrence projection"
cat > "$T/final-review-inv-a.md" <<'REVIEW'
## Verdict
not ready
## Must fix
- [Must-fix] active.ts:9 — D
## Untested scope
- none
## Deferred OK
- [Nit] café,format.ts:1 — A
  original continuation
- [Nit] fixed.ts:2 — B
- [Nit] rejected.ts:3 — C
REVIEW
cat > "$T/final-review-inv-b.md" <<'REVIEW'
## Verdict
ready
## Must fix
- none
## Untested scope
- none
## Deferred OK
- [Nit] café,format.ts:1 — A
  original continuation
REVIEW
bash "$REPO_ROOT/skills/super-code/scripts/report-verdict" --complete --source 'inv-a/final' "$T/final-review-inv-a.md" > "$T/a.json"
bash "$REPO_ROOT/skills/super-code/scripts/report-verdict" --complete --source 'inv-b/final' "$T/final-review-inv-b.md" > "$T/b.json"
node - "$T" <<'NODE'
const fs=require('node:fs'), p=process.argv[2];
const a=JSON.parse(fs.readFileSync(p+'/a.json')), b=JSON.parse(fs.readFileSync(p+'/b.json'));
const ref=(position,source='inv-a/final',section='Deferred OK')=>({source,section,position});
const line=(type,data)=>`- finding-${type} · ${JSON.stringify(data)}\n`;
let records='approvals:\n'+line('source',a)+line('source',b)+line('source',{...a,artifact:p+'/archive.md'});
fs.copyFileSync(a.artifact,p+'/archive.md');
for(let i=1;i<=3;i++)records+=line('route',{ref:ref(i),deferred:'outside goal',owner:'fix-'+i,fix:'closed-fix-'+i});
records+=line('disposition',{ref:ref(2),disposition:'resolved',judgment:'supported',basis:'another task supplied the fix',evidence:['verification.log @ abc123'],verification:'focused reproduction passes against repaired code'});
records+=line('disposition',{ref:ref(3),disposition:'rejected',judgment:'supported',basis:'contract permits this case',evidence:['spec.md#contract']});
fs.writeFileSync(p+'/projection.md',records);
fs.writeFileSync(p+'/linked.md',records+line('link',{refs:[ref(1),ref(1,'inv-b/final')],basis:'verified same obligation'}));
fs.writeFileSync(p+'/unsupported.md',records+line('disposition',{ref:ref(1),disposition:'resolved',basis:'task succeeded',evidence:['success']}));
fs.writeFileSync(p+'/bad-ref.md',records+line('disposition',{ref:ref(99),disposition:'resolved',judgment:'supported',basis:'claimed',evidence:['v'],verification:'v'}));
fs.writeFileSync(p+'/no-basis.md',records+line('disposition',{ref:ref(1),disposition:'resolved',judgment:'supported',evidence:[],verification:'v'}));
fs.writeFileSync(p+'/malformed.md',records+'- finding-route · {broken\n');
fs.writeFileSync(p+'/silent.md',records+line('source',{version:1,source:'inv-c/final',artifact:b.artifact,kind:'final-review',verdict:'ready',occurrences:[]}));
fs.writeFileSync(p+'/conflict.md',records+line('source',{...a,occurrences:a.occurrences.map(o=>({...o,text:o.text+' changed'}))}));
fs.writeFileSync(p+'/empty.md','approvals:\n');
fs.writeFileSync(p+'/dedupe.md',records+line('route',{ref:ref(1,'inv-b/final'),deferred:'independently deferred'}));
fs.writeFileSync(p+'/bad-link.md',records+line('link',{refs:[ref(1),ref(99)],basis:'invalid target'}));
fs.writeFileSync(p+'/external.json',JSON.stringify({version:1,records:[{type:'finding-disposition',ref:ref(1),disposition:'dissolved',basis:'later review silent'}]}));
fs.writeFileSync(p+'/external-supported.json',JSON.stringify({version:1,records:[{type:'finding-disposition',ref:ref(1),disposition:'resolved',judgment:'supported',basis:'verified external fix',evidence:['external.log'],verification:'reproduction now passes'}]}));
fs.writeFileSync(p+'/external-malformed.json','{broken');
NODE
run bash "$S" --project "$T/projection.md"
assert_eq "$code" 0 "projection accepts retained complete extraction and supported dispositions"
if [ "$code" -eq 0 ]; then
  if node -e 'const p=JSON.parse(process.argv[1]); const a=p.findings.filter(f=>f.outstanding); if(p.findings.length!==5||a.length!==3||a.filter(f=>f.deferred).length!==1)process.exit(1); const first=p.findings.find(f=>f.ref.section==="Deferred OK"&&f.ref.position===1); if(first.occurrences.length!==1||first.occurrences[0].text!=="[Nit] café,format.ts:1 — A\n  original continuation"||first.artifacts.length!==2)process.exit(1)' "$out"; then pass "ambiguous twins remain separate, archive dedupes and original text survives"; else fail "ambiguous twins remain separate, archive dedupes and original text survives"; fi
fi
run bash "$S" --project "$T/projection.md" --keys
assert_eq "$out" '[Nit] café,format.ts:1 — A' "keys contain deferred A only; verified B, rejected C and active D excluded"
run bash "$S" --project "$T/linked.md"
assert_eq "$code" 0 "explicit reference link accepted"
if [ "$code" -eq 0 ]; then
  if node -e 'const p=JSON.parse(process.argv[1]); if(p.findings.length!==4||!p.findings.some(f=>f.occurrences.length===2&&f.outstanding&&f.deferred))process.exit(1)' "$out"; then pass "only explicit references combine source appearances"; else fail "only explicit references combine source appearances"; fi
fi
for bad in unsupported bad-ref no-basis malformed bad-link; do
  run bash "$S" --project "$T/$bad.md" --keys
  assert_eq "$code" 3 "$bad produces an explicit evidence gap"
  assert_eq "$out" '[Nit] café,format.ts:1 — A' "$bad cannot delete known open A"
done
for external in missing external-malformed external; do
  run bash "$S" --project "$T/projection.md" --external "$T/$external.json" --keys
  assert_eq "$code" 3 "$external external input reports a gap"
  assert_eq "$out" '[Nit] café,format.ts:1 — A' "$external external input preserves local open evidence"
done
run bash "$S" --project "$T/projection.md" --external "$T/external-supported.json" --keys
assert_eq "$code" 0 "supported external verification may resolve explicitly referenced A"
assert_eq "$out" '' "verified fix supplied elsewhere leaves punch list"
run bash "$S" --project "$T/silent.md" --keys
assert_eq "$code" 0 "silent ready retry is a valid source without dispositions"
assert_eq "$out" '[Nit] café,format.ts:1 — A' "assignment, closed fix and later silence retain deferred A"
run bash "$S" --project "$T/dedupe.md" --keys
assert_eq "$out" '[Nit] café,format.ts:1 — A' "legacy key transport dedupes equal keys across distinct deferred occurrences"
run bash "$S" --project "$T/conflict.md"
assert_eq "$code" 3 "changed immutable source reports a gap"
if [ "$code" -eq 3 ]; then
  if node -e 'const p=JSON.parse(process.argv[1]);if(p.findings.filter(f=>f.ref.source==="inv-a/final"&&f.outstanding).length!==4||!p.findings.some(f=>f.variants.length))process.exit(1)' "$out"; then pass "conflicting source preserves text variants and blocks resolution"; else fail "conflicting source preserves text variants and blocks resolution"; fi
fi
run bash "$S" --project "$T/empty.md"
assert_eq "$code" 3 "no retained sources is an explicit gap rather than a clean review"
mkdir "$T/projection-tools"
ln -s "$(command -v node)" "$T/projection-tools/node"
run env PATH="$T/projection-tools" /bin/bash "$S" --project "$T/projection.md" --keys
assert_eq "$code" 0 "projection works without jq"
assert_eq "$out" '[Nit] café,format.ts:1 — A' "no-jq projection retains identical key output"
run env PATH="$T/nonexistent-tools" /bin/bash "$S" --project "$T/projection.md" --keys
assert_eq "$code" 4 "missing Node gives unavailable status, never a clean empty result"
if grep -q 'NODE_UNAVAILABLE:.*retain all known occurrences' "$T/err"; then pass "manual fallback preserves continuity obligations"; else fail "manual fallback preserves continuity obligations"; fi
rm "$T/final-review-inv-a.md" "$T/archive.md"
run bash "$S" --project "$T/projection.md" --keys
assert_eq "$code" 3 "unavailable source artifacts are an explicit gap"
assert_eq "$out" '[Nit] café,format.ts:1 — A' "retained occurrences survive unavailable source"

echo "review collection and caller continuity"
cp "$RF/clean.md" "$T/malformed-collection.md"
printf 'approvals:\n- review-collection · {"invocationId":"bad","reviewPath":null,"complete":true,"gaps":[]}\n' >> "$T/malformed-collection.md"
run bash "$RS" "$T/malformed-collection.md"
[[ "$out" == *'review collection gaps:'* ]] && pass "malformed new collection cannot appear clean" || fail "malformed new collection cannot appear clean"
mkdir -p "$T/collect/work/assembled/final-review-inv-one-final/slices" "$T/collect/run/reviews/inv-one"
CW="$T/collect/work"
CR="$T/collect/run/run.md"
cp "$RF/clean.md" "$CR"
cat > "$CW/final-review-inv-one.md" <<'REVIEW'
## Verdict
not ready
## Must-fix
- repair the auth guard
## Deferred OK
- [Nit] ui.ts:1 — keep the label
## Untested scope
none
REVIEW
cp "$CW/final-review-inv-one.md" "$CW/final-review-inv-one.cluster-1.md"
# finalReviewPrompt passes `${reviewPath}.diff` to review-package.
printf 'diff original\n' > "$CW/final-review-inv-one.md.diff"
printf '{"clusters":[{"name":"auth","slices":["slices/auth.diff"]}]}\n' > "$CW/assembled/final-review-inv-one-final/clusters.json"
printf 'slice original\n' > "$CW/assembled/final-review-inv-one-final/slices/auth.diff"
# The copy exists, but no completion or source record survived the interruption.
cp "$CW/final-review-inv-one.md" "$T/collect/run/reviews/inv-one/final-review-inv-one.md"
run bash "$RS" --collect "$CR" --invocation inv-one --workspace "$CW" --review "$CW/final-review-inv-one.md" --verdict 'not ready'
assert_eq "$code" 0 "collection resumes after interrupted copy"
if [ "$code" -eq 0 ]; then
  node - "$CR" <<'ROUTE'
const fs=require('fs'),p=process.argv[2];let s=fs.readFileSync(p,'utf8');const r={source:'inv-one/final',section:'Deferred OK',position:1};s+='- finding-route · '+JSON.stringify({ref:r,deferred:'outside goal'})+'\n';s+='- finding-disposition · '+JSON.stringify({ref:r,disposition:'rejected',judgment:'supported',basis:'intentional label',evidence:['decision @ abc123']})+'\n';fs.writeFileSync(p,s);
ROUTE
  cp "$CR" "$T/collect/before.md"
  run bash "$RS" --collect "$CR"
  assert_eq "$code" 0 "resume replays complete collections"
  cmp -s "$CR" "$T/collect/before.md" && pass "second resume changes no records" || fail "second resume changes no records"
  cmp -s "$CW/final-review-inv-one.md.diff" "$T/collect/run/reviews/inv-one/final-review-inv-one.md.diff" && pass "producer direct package archived byte for byte after replay" || fail "producer direct package archived byte for byte after replay"
  if node - "$CR" <<'DIRECT'
const fs=require('fs');const r=fs.readFileSync(process.argv[2],'utf8').split('\n').filter(l=>l.startsWith('- review-collection · ')).map(l=>JSON.parse(l.slice('- review-collection · '.length))).filter(r=>r.invocationId==='inv-one').at(-1);if(!r.complete||!r.files.some(f=>f.path==='final-review-inv-one.md.diff'))process.exit(1);
DIRECT
  then pass "completed collection inventories the producer direct package"; else fail "completed collection inventories the producer direct package"; fi
  printf 'conflicting direct package\n' > "$T/collect/run/reviews/inv-one/final-review-inv-one.md.diff"
  run bash "$RS" --collect "$CR"
  assert_eq "$code" 3 "conflicting direct package blocks collection completion"
  assert_eq "$(cat "$T/collect/run/reviews/inv-one/final-review-inv-one.md.diff")" 'conflicting direct package' "conflicting direct package is never overwritten"
  assert_eq "$(cat "$CW/final-review-inv-one.md.diff")" 'diff original' "direct package source is preserved through archive conflict"
  cp "$CW/final-review-inv-one.md.diff" "$T/collect/run/reviews/inv-one/final-review-inv-one.md.diff"
  run bash "$RS" --collect "$CR"
  assert_eq "$code" 0 "repaired direct package restores verified completion"
  cmp -s "$CW/assembled/final-review-inv-one-final/slices/auth.diff" "$T/collect/run/reviews/inv-one/assembled/final-review-inv-one-final/slices/auth.diff" && pass "split assembled input archived" || fail "split assembled input archived"
  printf '## Verdict\nready\n## Must-fix\nnone\n## Deferred OK\nnone\n## Untested scope\nnone\n' > "$CW/final-review-inv-two.md"
  run bash "$RS" --collect "$CR" --invocation inv-two --workspace "$CW" --review "$CW/final-review-inv-two.md" --verdict ready
  assert_eq "$code" 0 "ready silent retry collected independently"
  run bash "$S" --project "$CR"
  assert_eq "$code" 0 "collected producer records validate in predecessor projection"
  if node -e 'const p=JSON.parse(process.argv[1]);if(p.findings.length!==4||p.findings.filter(f=>f.outstanding).length!==3||!p.findings.some(f=>!f.outstanding&&f.dispositions.length))process.exit(1)' "$out"; then pass "one occurrence per source identity and supported disposition survives ready retry"; else fail "one occurrence per source identity and supported disposition survives ready retry"; fi
  run bash "$RS" "$CR"
  [[ "$out" == *'outstanding findings: 3'* ]] && pass "status exposes historical outstanding findings despite latest ready" || fail "status exposes historical outstanding findings despite latest ready"
  [[ "$out" != *'review collection gaps:'* ]] && pass "settled intent history creates no false collection gaps" || fail "settled intent history creates no false collection gaps"
  mv "$CW" "$T/collect/source-held"
  run bash "$RS" --collect "$CR"
  assert_eq "$code" 0 "verified complete archive survives source workspace removal"
  mv "$T/collect/source-held" "$CW"
  node - "$CR" "$CW" <<'INTENT'
const fs=require('fs'),p=process.argv[2],w=process.argv[3];fs.appendFileSync(p,'- review-collection · '+JSON.stringify({invocationId:'inv-empty',workspace:w,reviewPath:w+'/final-review-inv-empty.md',review:'pending',required:[],settled:false})+'\n');
INTENT
  run bash "$RS" --collect "$CR" --invocation inv-empty --workspace "$CW" --review none --verdict 'no work landed'
  assert_eq "$code" 0 "null review with no work landed preserves null semantics"
  cp "$RF/clean.md" "$T/collect/null-direct.md"
  printf 'recoverable direct package\n' > "$CW/final-review-inv-direct.md.diff"
  run bash "$RS" --collect "$T/collect/null-direct.md" --invocation inv-direct --workspace "$CW" --review none --verdict 'no work landed'
  assert_eq "$code" 3 "null no-work with only the producer direct package remains a gap"
  cmp -s "$CW/final-review-inv-direct.md.diff" "$T/collect/reviews/inv-direct/final-review-inv-direct.md.diff" && pass "null result still archives the recoverable direct package" || fail "null result still archives the recoverable direct package"
  if node - "$T/collect/null-direct.md" <<'NULL_DIRECT'
const fs=require('fs');const r=fs.readFileSync(process.argv[2],'utf8').split('\n').filter(l=>l.startsWith('- review-collection · ')).map(l=>JSON.parse(l.slice('- review-collection · '.length))).at(-1);if(r.complete||!r.gaps.includes('null review has recoverable bundle artifacts; reconcile returned result')||!r.gaps.includes('bundle unavailable: final-review-inv-direct.md'))process.exit(1);
NULL_DIRECT
  then pass "direct-only null bundle records reconciliation and missing review gaps"; else fail "direct-only null bundle records reconciliation and missing review gaps"; fi
  cp "$T/collect/null-direct.md" "$T/collect/null-direct-before.md"
  run bash "$RS" --collect "$T/collect/null-direct.md"
  assert_eq "$code" 3 "direct-only null gap persists on replay"
  cmp -s "$T/collect/null-direct.md" "$T/collect/null-direct-before.md" && pass "direct-only null replay changes no records" || fail "direct-only null replay changes no records"
  cp "$RF/clean.md" "$T/collect/null-partial.md"
  cp "$CW/final-review-inv-one.md" "$CW/final-review-inv-ghost.md"
  run bash "$RS" --collect "$T/collect/null-partial.md" --invocation inv-ghost --workspace "$CW" --review none --verdict 'no work landed'
  assert_eq "$code" 3 "null no-work with a partial bundle remains a gap"
  run bash "$S" --project "$T/collect/null-partial.md"
  assert_eq "$code" 0 "unexpected null bundle still retains complete extraction"
  if node -e 'const p=JSON.parse(process.argv[1]);if(!p.findings.some(f=>f.outstanding&&f.ref.source==="inv-ghost/final"))process.exit(1)' "$out"; then pass "null result never erases discoverable findings"; else fail "null result never erases discoverable findings"; fi
  run bash "$RS" --collect "$CR" --invocation inv-partial --workspace "$CW" --review "$CW/final-review-inv-partial.md" --verdict 'not ready' --required absent-input.diff
  assert_eq "$code" 3 "missing declared direct input blocks collection completion"
  run bash "$RS" --collect "$CR" --invocation inv-null --workspace "$CW" --review none --verdict 'not ready'
  assert_eq "$code" 3 "null required review is a durable evidence gap"
  run bash "$RS" "$CR"
  [[ "$out" == *'review collection gaps:'* ]] && pass "status exposes collection gaps" || fail "status exposes collection gaps"
  run bash "$RS" --collect "$CR" --invocation inv-missing --workspace "$CW" --review "$CW/final-review-inv-missing.md" --verdict 'not ready'
  assert_eq "$code" 3 "missing required bundle remains pending"
  printf 'changed destination\n' > "$T/collect/run/reviews/inv-one/final-review-inv-one.md"
  run bash "$RS" --collect "$CR"
  assert_eq "$code" 3 "conflicting archive is not overwritten on replay"
  assert_eq "$(cat "$T/collect/run/reviews/inv-one/final-review-inv-one.md")" 'changed destination' "conflicting archive bytes retained for recovery"
  run bash "$S" --project "$CR" --keys
  assert_eq "$code" 0 "known inline sources remain valid through collection gap"
  assert_eq "$out" '' "supported rejected item stays off punch list while active defects stay open"
  cp "$CW/final-review-inv-one.md" "$T/collect/run/reviews/inv-one/final-review-inv-one.md"
  run bash "$RS" --collect "$CR"
  assert_eq "$code" 3 "unrelated missing collections remain gaps after local archive repair"
  if node - "$CR" <<'REPAIRED'
const fs=require('fs');const r=fs.readFileSync(process.argv[2],'utf8').split('\n').filter(l=>l.startsWith('- review-collection · ')).map(l=>JSON.parse(l.slice('- review-collection · '.length))).filter(r=>r.invocationId==='inv-one').at(-1);if(!r.complete||r.gaps.length)process.exit(1);
REPAIRED
  then pass "repaired collection appends completion after an earlier identical completion"; else fail "repaired collection appends completion after an earlier identical completion"; fi
else
  fail "collection-dependent archive/projection/status assertions unmeasured"
fi

if [ "$FAILURES" -eq 0 ]; then echo "All super-auto script tests passed"; else echo "$FAILURES failure(s)"; exit 1; fi
