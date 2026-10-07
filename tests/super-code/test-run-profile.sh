#!/usr/bin/env bash
# Tests for skills/super-code/scripts/run-profile: per-bead timing from synthetic Workflow run
# directories (run-profile-fixture.mjs builds them from fixtures/run-profile/*.json). The expected
# numbers are worked out by hand from each fixture's timeline; see the comments per scenario.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
P="$REPO_ROOT/skills/super-code/scripts/run-profile"
FX="$SCRIPT_DIR/fixtures/run-profile"
BUILD="$SCRIPT_DIR/run-profile-fixture.mjs"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
# Discovery reads ~/.claude and ~/.codex by default: keep it to the fixtures.
export HOME="$T/home"
mkdir -p "$HOME"
ORD="$SCRIPT_DIR/run-profile-ordinary-fixture.mjs"
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$1" = "$2" ]; then pass "$3"; else fail "$3"; echo "    expected: $2"; echo "    got:      $1"; fi; }
assert_has() { if printf '%s\n' "$1" | grep -qF -- "$2"; then pass "$3"; else fail "$3"; echo "    missing: $2"; echo "    in: $1"; fi; }
run() { set +e; out=$("$@" 2>"$T/err"); code=$?; set -e; }
q() { node -e "const d=JSON.parse(require('fs').readFileSync('$1','utf8')); console.log($2)"; }
build() { node "$BUILD" "$FX/$1.json" "$2"; }

echo "run-profile: chain (A → B, A → C, B+C → D; E alone; cap 2, early unblock)"
# A implements 80–680; B starts at A's implementation (682), C waits for A's slot (742), D starts at
# B's implementation (1284) and lands last at 2004. The path: startup 10 · bd-ready 10 · plan 60 ·
# A 600 · B 2+600 · D 2+600+60+60.
build chain "$T/chain"
run bash "$P" --workflow "$T/chain" --out "$T/chain-p"
assert_eq "$code" 0 "exits 0"
assert_has "$out" "Profile: ep · 1 invocation · 2026-10-01T00:00Z → 2026-10-01T00:35Z · wall 35m (task graph 33m, after the last landing 2m) · agents 26 (timed 26) · beads dispatched 5, landed 5, planned 5" "header line"
assert_eq "$(q "$T/chain-p.json" "d.window.graphMs")" "2004000" "task graph: first dispatch to last landing"
assert_eq "$(q "$T/chain-p.json" "d.criticalPath.ms")" "2004000" "critical path segments sum to the task graph's wall time"
assert_eq "$(q "$T/chain-p.json" "JSON.stringify(d.criticalPath.byCategory)")" '{"startup":10000,"ready":10000,"planning":60000,"implement":1800000,"dispatch":4000,"review":60000,"merge":60000}' "critical path by category"
assert_eq "$(q "$T/chain-p.json" "d.criticalPath.segments.filter(s => s.kind === 'implement').map(s => s.bead).join(',')")" "ep.1,ep.2,ep.4" "realized chain runs A → B → D"
assert_eq "$(q "$T/chain-p.json" "d.bottleneck.bead + ' ' + d.bottleneck.ms")" "ep.4 722000" "bottleneck: D, its dispatch gap, implement, review and merge"
assert_eq "$(q "$T/chain-p.json" "JSON.stringify(d.bottleneck.implByTool)")" '{"test":200000,"poll":200000,"build":50000,"git":2000,"read":1000,"edit":1000}' "implement time by tool category (cd-prefixed test, sleep-loop poll, build, git, Read, Edit)"
assert_eq "$(q "$T/chain-p.json" "d.beads.find(b => b.id === 'ep.4').implToolMs")" "454000" "tool time is the union of tool spans; StructuredOutput excluded"
assert_eq "$(q "$T/chain-p.json" "(b => b.waitCause + ' ' + b.waitMs)(d.beads.find(b => b.id === 'ep.3'))")" "slot 62000" "C waited 62s for a slot (both slots busy when A's freed)"
assert_eq "$(q "$T/chain-p.json" "d.beads.filter(b => b.waitCause !== 'none').length")" "1" "no other bead waited past dispatch latency"
assert_eq "$(q "$T/chain-p.json" "d.beads.filter(b => b.stackParents.length).map(b => b.id).join(',')")" "ep.2,ep.3,ep.4" "B, C and D were cut on unmerged implementations"
assert_eq "$(q "$T/chain-p.json" "[d.simulation.asRunMs, d.simulation.lowerBoundMs, d.simulation.fit].join(' ')")" "2000000 2000000 1" "schedule model reproduces the run; graph-bound"
assert_eq "$(q "$T/chain-p.json" "d.simulation.graphChain.join(',')")" "ep.1,ep.2,ep.4" "the chain behind the graph's bound"
assert_has "$out" "Profile: bound — graph lower bound 33m along ep.1 → ep.2 → ep.4 (unlimited slots and merge lanes) · model of the run 33m (cap 2, one merge lane) vs actual 33m (100%) → graph-bound: the 3-bead dependency chain set the pace — reshaping it is the lever" "bound line"
assert_eq "$(q "$T/chain-p.json" "d.simulation.whatIfs.map(w => w.target + '=' + w.savingMs).filter(x => /faster ep.4|cut ep.2 <- ep.1|cut ep.4 <- ep.2/.test(x)).join(' ')")" "faster ep.4=300000 cut ep.2 <- ep.1=200000 cut ep.4 <- ep.2=180000" "what-ifs: halve D's implement, cut D's or B's blocker edge"
assert_eq "$(q "$T/chain-p.json" "d.simulation.whatIfs.every((w, i, a) => i === 0 || a[i - 1].savingMs >= w.savingMs)")" "true" "what-ifs ranked by saving"
assert_eq "$(q "$T/chain-p.json" "[d.lane.busyMs, d.lane.seamMs, d.lane.queueWaitMs, d.lane.peakQueue].join(' ')")" "280000 0 0 0" "merge lane: busy 280s, no seam work, no queue"
assert_has "$out" "Profile: early unblock — 3 landed beads had in-run blockers · stacked on an implementation 3" "early unblock line"
assert_has "$out" "Profile: unmeasured — none" "nothing unmeasured"
for h in "## Per bead" "## Critical path, step by step" "## Schedule model" '```mermaid' "  section ep.4" "  impl :crit, "; do
  if grep -qF -- "$h" "$T/chain-p.md"; then pass "markdown has: $h"; else fail "markdown has: $h"; fi
done

echo "run-profile: stack conflict and seam work holding the merge lane (cap 3)"
# Q (kp.4) holds the lane 230–890 (seam review 300s + seam fix 300s); P1 and P2 queue behind it. K's
# first attempt (402) bounces on a stack conflict; it re-cuts after both parents merged (952).
build conflict "$T/conflict"
run bash "$P" --workflow "$T/conflict" --out "$T/conflict-p"
assert_eq "$code" 0 "exits 0"
assert_eq "$(q "$T/conflict-p.json" "(b => [b.waitCause, b.waitMs, b.lateEdges.join('+'), b.attempts.join('/')].join(' '))(d.beads.find(b => b.id === 'kp.3'))")" "stack-conflict 552000 kp.1+kp.2 STACK_CONFLICT/IMPLEMENTED" "K waited 552s after a stack conflict; both parent edges ran late"
assert_eq "$(q "$T/conflict-p.json" "JSON.stringify(d.criticalPath.byCategory)")" '{"startup":4000,"ready":6000,"planning":30000,"implement":460000,"review":60000,"merge":150000,"seam":600000,"dispatch":2000}' "critical path by category: seam work dominates"
assert_eq "$(q "$T/conflict-p.json" "d.criticalPath.laneContentionMs")" "690000" "lane contention: Q's whole lane turn and P1's, which the next merges queued behind"
assert_eq "$(q "$T/conflict-p.json" "d.bottleneck.bead + ' ' + d.bottleneck.ms")" "kp.4 850000" "bottleneck: Q, whose seam work held the lane"
assert_eq "$(q "$T/conflict-p.json" "[d.lane.busyMs, d.lane.seamMs, d.lane.merges, d.lane.firstTryFailed, d.lane.queueWaitMs, d.lane.peakQueue].join(' ')")" "750000 600000 5 1 1010000 2" "merge lane: busy, seam share, merges, first-try failures, queue wait, peak"
assert_has "$out" "Profile: conflicts — src/shared.ts (stack conflicts 1, seam overlaps 1, declared by 2) · src/other.ts (stack conflicts 1, seam overlaps 0, declared by 1)" "conflict files from the stack-conflict finding and the seam overlap"
assert_has "$out" "Profile: early unblock — 1 landed beads had in-run blockers · stacked on an implementation 0 · bounced on a stack conflict then waited for the merge 1 (9m)" "early unblock line counts the bounce"
assert_eq "$(q "$T/conflict-p.json" "[d.simulation.asRunMs, d.simulation.lowerBoundMs].join(' ')")" "1310000 890000" "model 1310s (late edges honoured) vs bound 890s"
assert_has "$out" "→ merge-lane-bound: 7m of the 7m above the graph's bound is the serial merge lane" "verdict: merge-lane-bound"
assert_eq "$(q "$T/conflict-p.json" "['seam work off the merge lane', 'unlimited merge lanes', 'every early unblock taken'].map(t => d.simulation.whatIfs.find(w => w.target === t)?.savingMs).join(' ')")" "420000 420000 330000" "what-ifs: seam off the lane, parallel lanes, no stack conflicts"
assert_has "$out" "Profile: rework — 18s of dispatch time in attempts that did not land — kp.3 18s (STACK_CONFLICT; landed later)" "rework names the bounced attempt"
assert_eq "$(q "$T/conflict-p.json" "d.criticalPath.redo['stack-conflict'].ms + ' ' + d.criticalPath.redo['stack-conflict'].beads")" "550000 kp.3" "redo: K's bounce cost the path up to 550s (402 → 952)"

echo "run-profile: discovery, relaunches, dryRun and foreign runs"
PR="$T/projects"
build disc-r0 "$PR/-w-proj/s1/subagents/workflows/wf_r0"
build disc-r1 "$PR/-w-proj/s1/subagents/workflows/wf_r1"
build disc-r2 "$PR/-w-proj/s1/subagents/workflows/wf_r2"
build disc-dry "$PR/-w-proj/s1/subagents/workflows/wf_dry"
build disc-other "$PR/-w-other/s2/subagents/workflows/wf_oz"
build disc-nc "$PR/-w-proj/s1/subagents/workflows/wf_nc"
run bash "$P" --discover --epic dz --projects "$PR"
assert_eq "$code" 0 "discover exits 0"
assert_has "$out" "Profile: dz · 3 invocations" "discover finds dz's three coordinator runs (not oz's, not the non-coordinator)"
assert_has "$out" "1 dryRun invocation(s) skipped" "the dryRun launch is skipped and named"
run bash "$P" --discover --epic dz --projects "$PR" --latest --out "$T/latest"
assert_has "$out" "Profile: dz · 2 invocations · 2026-10-03T10:00Z" "--latest keeps the newest run and the relaunch that led into it"
assert_eq "$(q "$T/latest.json" "d.criticalPath.segments.filter(s => s.kind === 'relaunch').map(s => s.ms).join(',')")" "123000" "the relaunch gap is a critical-path segment"
run bash "$P" --workflow "$PR/-w-proj/s1/subagents/workflows/wf_nc"
assert_eq "$code" 2 "a non-coordinator workflow is refused"
assert_has "$(cat "$T/err")" "not a super-code coordinator run" "and says why"
run bash "$P" --workflow "$PR/-w-proj/s1/subagents/workflows/wf_r1" --workflow "$PR/-w-other/s2/subagents/workflows/wf_oz"
assert_eq "$code" 2 "runs of two epics are refused"
run bash "$P" --discover --epic nope --projects "$PR"
assert_eq "$code" 3 "no run found: exit 3"
assert_has "$out" "Profile: unavailable — no Workflow run directory found for nope" "and an unavailable line"

echo "run-profile: missing harness files"
node -e "const f='$FX/chain.json',d=JSON.parse(require('fs').readFileSync(f,'utf8'));d.transcripts=false;require('fs').writeFileSync('$T/nt.json',JSON.stringify(d))"
node "$BUILD" "$T/nt.json" "$T/nt"
run bash "$P" --workflow "$T/nt"
assert_eq "$code" 3 "journal but no transcripts: exit 3"
assert_has "$out" "Profile: unavailable — no timed task dispatch" "no timing is reported as unavailable, not as zero"
node -e "const f='$FX/chain.json',d=JSON.parse(require('fs').readFileSync(f,'utf8'));d.journal=false;require('fs').writeFileSync('$T/nj.json',JSON.stringify(d))"
node "$BUILD" "$T/nj.json" "$T/nj"
run bash "$P" --workflow "$T/nj"
assert_eq "$code" 0 "transcripts without a journal still profile"
assert_has "$out" "without journal.jsonl" "and say what is missing"
assert_has "$out" "no planner rows" "no graph without planner results"
node -e "const f='$FX/chain.json',d=JSON.parse(require('fs').readFileSync(f,'utf8'));delete d.launch;require('fs').writeFileSync('$T/nl.json',JSON.stringify(d))"
node "$BUILD" "$T/nl.json" "$T/nl"
run bash "$P" --workflow "$T/nl"
assert_has "$out" "Profile: ep ·" "no Launch: line: the epic comes from the plan path"
assert_has "$out" "no Launch: line" "and the missing line is named"

echo "run-profile: --summarize, a baseline over earlier profiles"
run bash "$P" --summarize "$T/chain-p.json" "$T/conflict-p.json"
assert_eq "$code" 0 "summarize exits 0"
assert_has "$out" "Baseline: 2 profiles · 2 invocations · 2 epic(s) · 2026-10-01 → 2026-10-02 · task graph 55m · landed 9 beads" "baseline header"
assert_has "$out" "Baseline: verdicts — graph-bound 1 · merge-lane-bound 1" "verdicts counted per invocation"
assert_has "$out" "Baseline: waits, summed per bead (not wall time) — stack-conflict 9m (1) · slot 1m (1)" "waits summed by cause"
assert_has "$out" "Baseline: redo on the critical path, up to — stack-conflict 9m (1) (of 55m task-graph time)" "redo on the critical path summed"
assert_has "$out" "Baseline: early unblock — 4 landed beads had in-run blockers · stacked on an implementation 3 · bounced on a stack conflict 1 · waited for a merge 0" "early unblock summed"
assert_has "$out" "Baseline: merge lane — busy 17m · seam reviews and fixes 58% of it" "lane load and seam share"
echo '{"version": 2}' > "$T/bad.json"
run bash "$P" --summarize "$T/bad.json"
assert_eq "$code" 2 "a JSON that is not a version-1 profile is refused"

echo "run-profile: predecessor selection and edge cases (regressions from review)"
pd() { build "$1" "$T/$1"; }
# Two invocations; close-epics and bd-ready start together and must not become each other's
# predecessor, or the walk stops and books the first invocation as startup.
pd relaunch-a; pd relaunch-b
run bash "$P" --workflow "$T/relaunch-a" --workflow "$T/relaunch-b" --out "$T/relaunch"
assert_eq "$(q "$T/relaunch.json" "[d.criticalPath.byCategory.startup, d.criticalPath.byCategory.relaunch].join(' ')")" "5000 106000" "relaunch: 5s of startup; relaunch is the 100s between invocations plus the second one's 6s ledger read"
assert_eq "$(q "$T/relaunch.json" "d.criticalPath.segments.filter(s => s.kind === 'implement').map(s => s.bead).join(',')")" "c.1,c.2" "relaunch: both invocations' work is on the path"
assert_eq "$(q "$T/relaunch.json" "(b => b.waitCause + ' ' + b.carriedMs)(d.beads.find(b => b.id === 'c.2'))")" "none 0" "relaunch: no in-run wait blamed for time before the second invocation"
# A failed merge: the blocker path runs after the lane turn, so the chain end is taken before it.
pd failed-merge
run bash "$P" --workflow "$T/failed-merge" --out "$T/fm"
assert_eq "$(q "$T/fm.json" "d.bottleneck.bead + ' ' + Math.round(100 * d.bottleneck.share)")" "m.1 95" "failed merge: the retried bead holds 95% of the path"
assert_eq "$(q "$T/fm.json" "d.criticalPath.byCategory.startup")" "5000" "failed merge: no time lost to startup"
assert_eq "$(q "$T/fm.json" "d.criticalPath.redo.retry.ms + ' ' + d.criticalPath.redo.retry.beads")" "762000 m.1" "failed merge: the retry cost the path up to 762s (60 → 822)"
# An attempt that starts with a blocker filing (no impl) mid-invocation is not a relaunch.
pd blocker-head-a; pd blocker-head-b
run bash "$P" --workflow "$T/blocker-head-a" --workflow "$T/blocker-head-b" --out "$T/bh"
assert_eq "$(q "$T/bh.json" "d.criticalPath.byCategory.relaunch + ' ' + d.bottleneck.bead")" "106000 u.2" "blocker head: relaunch is only the gap between invocations (100s + a 6s ledger read); u.2 is the bottleneck"
# A cycle in the planner rows: no hang, the shape skips it, the model says it failed.
pd cycle
set +e; out=$(perl -e 'alarm 20; exec @ARGV' bash "$P" --workflow "$T/cycle" 2>&1); code=$?; set -e
assert_eq "$code" 0 "cycle: terminates"
assert_has "$out" "Profile: bound — model failed" "cycle: the model reports failure, not a verdict"
assert_has "$out" "dependency cycle(s) in the planner rows" "cycle: named on the unmeasured line"
# Nothing landed: the path still spans the task graph and ends at its last step.
pd no-landing
run bash "$P" --workflow "$T/no-landing" --out "$T/nl2"
assert_eq "$(q "$T/nl2.json" "d.criticalPath.ms === d.window.graphMs")" "true" "no landing: critical path equals the task graph"
assert_has "$out" "Profile: bottleneck — n.1 (did not land)" "no landing: the bead that held it is named"
# A review and a split overlapping: the fix follows the review, which ended last.
pd overlap-split
run bash "$P" --workflow "$T/overlap-split" --out "$T/os"
assert_eq "$(q "$T/os.json" "d.criticalPath.segments.filter(s => s.bead === 'q.1' && s.label.indexOf('→') < 0).map(s => s.kind).join(',')")" "implement,review,fix,merge" "overlap: implement → review → fix → merge, no split on the path"
# A close-only that did not confirm the merge is not a landing.
pd close-unconfirmed
run bash "$P" --workflow "$T/close-unconfirmed"
assert_has "$out" "beads dispatched 1, landed 0" "close-only without CLOSED: not landed"
# Finish-stage time on the path is reported, and the categories add up.
pd finish-on-path
run bash "$P" --workflow "$T/finish-on-path" --out "$T/fp"
assert_has "$out" "finish 5m" "finish time is on the critical-path line"
assert_eq "$(q "$T/fp.json" "Object.values(d.criticalPath.byCategory).reduce((a, b) => a + b, 0) === d.criticalPath.ms")" "true" "categories sum to the path"
# One co-declaring chain is under the hot-file cap: the wait is the ready query that ended just before.
pd hot-below-cap
run bash "$P" --workflow "$T/hot-below-cap"
assert_has "$out" "ready-query 5m (1)" "hot file under its cap: attributed to the ready query"
# An edge cut that landed after the dependent started still bound it in the model.
pd late-cut
run bash "$P" --workflow "$T/late-cut"
assert_has "$out" "vs actual 33m (100%)" "late cut: the model keeps the edge in force at dispatch"
# A planner whose transcript is gone still contributes its rows from the journal.
build chain "$T/np"
id=$(grep '"label":"plan"' "$T/np/journal.jsonl" | sed -E 's/.*"agentId":"([^"]+)".*/\1/')
mv "$T/np/agent-$id.jsonl" "$T/np-plan.jsonl"
run bash "$P" --workflow "$T/np"
assert_has "$out" "Profile: shape — 5 beads · 4 edges" "graph from journal results without the planner's transcript"
# Tool time by sub-command: the weightiest category wins; heredoc bodies and git/read verbs don't
# count as tests.
pd tools
run bash "$P" --workflow "$T/tools" --out "$T/tl"
assert_eq "$(q "$T/tl.json" "JSON.stringify(d.beads[0].implByTool)")" '{"git":10000,"install":10000,"test":60000,"read":20000,"poll":20000,"build":10000,"shell":10000}' "tool categories per sub-command (tests run as target/*/deps binaries, tail -f as polling, a pipe to tail stays shell)"

echo "run-profile: bookkeeping re-entries, older coordinators, test time"
# A merged bead whose close was lost comes back at the next round only to close: its landing is the
# merge, and the close is counted apart.
pd reentry-close
run bash "$P" --workflow "$T/reentry-close" --out "$T/rc"
assert_eq "$(q "$T/rc.json" "(b => [b.landedAt.slice(11, 19), b.attempts.length, b.waitCause].join(' '))(d.beads.find(b => b.id === 'rc.1'))")" "00:04:00 2 none" "re-entry close: the landing is the merge at 240s, not the close at 330s"
assert_eq "$(q "$T/rc.json" "d.window.graphMs")" "240000" "re-entry close: the task graph ends at the last real merge"
assert_has "$out" "1 merged bead(s) re-dispatched only to close (a lost bead close), 1m after their merge" "re-entry close: counted on the rework line"
assert_eq "$(q "$T/rc.json" "JSON.stringify(d.criticalPath.redo.retry)")" '{"ms":0,"beads":[]}' "re-entry close: not a retry on the critical path"
# Older coordinators dispatched `brief:` before `impl:`; both are one attempt's implement time.
pd brief-step
run bash "$P" --workflow "$T/brief-step" --out "$T/br"
assert_eq "$(q "$T/br.json" "(b => b.attempts.length + ' ' + b.implMs)(d.beads[0])")" "1 180000" "brief step: one attempt, implement 10s + 170s"
# Test time across implementers and fixers.
assert_has "$(cat "$T/chain-p.md")" "Profile: tests — implementers and fixers, summed: 3m running tests and 3m polling background runs, 17% of their 40m · 0 Bash call(s) ran into the 10-minute tool limit" "tests line: summed test and poll time over every implementer"
# Slow tests: one test command's runs grouped across the implementer and the fixer, worktree and temp
# paths, redirections and the test-binary hash normalized away, a $VAR binary resolved; runs whose
# longest is under a minute stay in the JSON but off the line.
pd slow-tests
run bash "$P" --workflow "$T/slow-tests" --out "$T/st"
assert_has "$out" "Profile: slow tests — cargo test --locked --lib store:: 5m (2 runs, longest 3m) · target/debug/deps/svc-* --test-threads 1 5m (1 run, longest 5m)" "slow tests line: summed per normalized command, slowest first"
assert_eq "$(q "$T/st.json" "d.slowTests.map(e => e.cmd + ' ' + e.ms + ' ' + e.runs).join(' | ')")" "cargo test --locked --lib store:: 300000 2 | target/debug/deps/svc-* --test-threads 1 290000 1 | npm test 30000 1" "slow tests JSON: every test command, with summed time and runs"
assert_has "$(cat "$T/chain-p.md")" "Profile: slow tests — cargo test --lib 3m (1 run, longest 3m)" "slow tests line: the cd prefix is dropped"
run bash "$P" --workflow "$T/brief-step"
if printf '%s\n' "$out" | grep -q "Profile: slow tests"; then fail "no slow tests line without test calls"; else pass "no slow tests line without test calls"; fi
run bash "$P" --summarize "$T/chain-p.json" "$T/st.json"
assert_has "$out" "Baseline: slow tests — cargo test --locked --lib store:: 5m (2 runs, longest 3m) · target/debug/deps/svc-* --test-threads 1 5m (1 run, longest 5m) · cargo test --lib 3m (1 run, longest 3m)" "summarize: slow tests merged across profiles"

echo "run-profile: ordinary-subagent coordinator on Codex (one chain at a time; outcomes from the ledger, graph from bd)"
# cx.2 needs cx.1. plan 0–60; cx.1 impl 60–360, review 362–422, the coordinator merges 425–507 (its
# first `git rebase` naming task-cx.1 to the ledger append naming cx.1); cx.2 impl 510–1110, review,
# fix to 1272, merge 1275–1335; cx.3 impl 1340–1640, review, merge 1705–1745; cx.4 blocked twice
# (impl, triage, impl__2); final_review 1900–1960. A scratch_probe child (two tasks, 2–12 and 1000–1010)
# follows no naming rule; a grandchild and a guardian are not the coordinator's dispatches.
COORD=$(node "$ORD" "$FX/ordinary.json" codex "$T/ord")
run bash "$P" --codex "$COORD" --codex-home "$T/ord/codex" --ledger "$T/ord/progress.md" --beads "$T/ord/beads.json" --out "$T/ox"
assert_eq "$code" 0 "exits 0"
assert_has "$out" "Profile: cx · 1 invocation · 2026-10-01T00:00Z → 2026-10-01T00:32Z · wall 33m (task graph 29m, after the last landing 4m) · agents 14 (timed 14) · beads dispatched 4, landed 3, planned 4" "header: 14 task spans of direct children; cx.4 (BLOCKED in the ledger) did not land; bd's 4 in-tree leaves"
assert_eq "$(q "$T/ox.json" "d.beads.map(b => b.id + '<' + b.deps.join('+')).join(' ')")" "cx.1< cx.2<cx.1 cx.3< cx.4<" "graph from bd: in-tree leaves only (no epic, blocker or out-of-tree bead), cx.2 blocked by cx.1"
assert_eq "$(q "$T/ox.json" "d.window.graphMs + ' ' + d.criticalPath.ms")" "1745000 1745000" "task graph ends at cx.3's merge (1745s), and the path spans it"
assert_eq "$(q "$T/ox.json" "JSON.stringify(d.criticalPath.byCategory)")" '{"planning":60000,"implement":1200000,"dispatch":18000,"review":180000,"merge":182000,"fix":100000,"slot":5000}' "critical path: three chains back to back; merges 82+60+40s; cx.3 waited 5s for cx.2's chain to end"
assert_eq "$(q "$T/ox.json" "d.criticalPath.segments.filter(s => s.kind === 'merge').map(s => s.start.slice(14, 19) + '+' + s.ms / 1000).join(' ')")" "07:05+82 21:15+60 28:25+40" "coordinator merges: first git rebase/merge naming task-<id> to the last command naming the bead (bd show cx.10 does not count)"
assert_eq "$(q "$T/ox.json" "d.bottleneck.bead + ' ' + d.bottleneck.ms")" "cx.2 828000" "bottleneck: cx.2 (600s implement, review, fix, merge and the gaps before them)"
assert_eq "$(q "$T/ox.json" "JSON.stringify(d.bottleneck.implByTool)")" '{"test":200000,"edit":10000,"poll":60000}' "Codex tool calls: exec_command test, apply_patch edit, write_stdin poll"
assert_eq "$(q "$T/ox.json" "d.beads.find(b => b.id === 'cx.1').implByTool.test")" "100000" "a forked child's replayed call at its spawn instant is not its own"
assert_has "$out" "Profile: slow tests — cargo test 5m (2 runs, longest 3m)" "slow tests from Codex exec_command calls, the cd prefix dropped"
assert_eq "$(q "$T/ox.json" "(b => b.waitCause + ' ' + b.waitMs)(d.beads.find(b => b.id === 'cx.3'))")" "slot 1280000" "cx.3, ready at planning, waited 1280s for the one chain slot (held through cx.2's merge)"
assert_eq "$(q "$T/ox.json" "d.beads.find(b => b.id === 'cx.2').waitCause")" "none" "cx.2 started 3s after cx.1 merged: no early unblock in this mode"
assert_eq "$(q "$T/ox.json" "[d.cap, d.earlyUnblock, d.simulation.asRunMs, d.simulation.lowerBoundMs, d.simulation.unlimitedSlotsMs, d.simulation.fit].join(' ')")" "1 false 1600000 1322000 1322000 0.92" "model: cap 1, merges before dependents; 1600s vs a 1322s bound"
assert_has "$out" "→ slot-bound: 5m of the 5m above the graph's bound is the slot cap" "verdict: slot-bound (one chain at a time)"
assert_eq "$(q "$T/ox.json" "['unlimited slots', 'faster cx.2'].map(t => d.simulation.whatIfs.find(w => w.target === t)?.savingMs).join(' ')")" "278000 300000" "what-ifs: parallel chains, a faster cx.2"
assert_eq "$(q "$T/ox.json" "d.beads.find(b => b.id === 'cx.4').attempts.join(',')")" ",BLOCKED" "cx.4: two attempts (impl_cx_4, impl_cx_4__2), the last BLOCKED per the ledger"
assert_has "$out" "Profile: rework — 2m of dispatch time in attempts that did not land — cx.4 2m" "rework names the blocked bead"
assert_eq "$(q "$T/ox.json" "JSON.stringify(d.concurrency.byActive) + ' ' + d.concurrency.dispatches + ' ' + d.concurrency.busyMs")" '{"0":220000,"1":1720000,"2":20000} 14 1740000' "concurrency over 1960s: 220s idle, 1720s one dispatch, 20s two (scratch_probe's two tasks)"
assert_has "$out" "Profile: concurrency — 14 dispatches over 33m · a dispatch running 29m (89%) · dispatches at once: 0 for 11% · 1 for 88% · 2 for 1% of the time · peak 2" "concurrency line"
assert_has "$out" "Profile: dispatch time by kind, summed — impl 22m (5) · review 3m (3) · fix 2m (1) · plan 1m (1) · final-review 1m (1) · triage 30s (1) · not named for a bead: scratch 20s (2) · merges run by the coordinator 3m (3)" "time per kind; unnamed dispatches apart; the coordinator's own merges"
assert_has "$out" "2 dispatch(es) not named for a bead of cx" "unnamed dispatches are named on the unmeasured line"
run bash "$P" --codex "$(ls "$T"/ord/codex/sessions/*/*/*/*"$COORD".jsonl)" --codex-home "$T/ord/codex" --ledger "$T/ord/progress.md" --beads "$T/ord/beads.json"
assert_has "$out" "Profile: cx · 1 invocation" "the coordinator's rollout file works as input too"
run bash "$P" --codex 01c0ffee-dead --codex-home "$T/ord/codex" --epic cx
assert_eq "$code" 2 "an unknown thread: exit 2"
run bash "$P" --codex "$COORD" --codex-home "$T/ord/codex" --beads "$T/ord/beads.json"
assert_eq "$code" 2 "no epic and no ledger: exit 2"
run bash "$P" --codex "$COORD" --codex-home "$T/ord/codex" --beads "$T/ord/beads.json" --epic cx --out "$T/onl"
assert_eq "$(q "$T/onl.json" "d.beads.filter(b => b.landed).length")" "3" "no ledger: every coordinator merge counts as landed"
assert_has "$out" "no ledger (--ledger)" "and says so"
run bash "$P" --codex "$COORD" --codex-home "$T/ord/codex" --ledger "$T/ord/progress.md" --beads "$HOME/none.json"
assert_eq "$code" 2 "an unreadable --beads: exit 2"
echo '[]' > "$T/nobeads.json"
run bash "$P" --codex "$COORD" --codex-home "$T/ord/codex" --ledger "$T/ord/progress.md" --beads "$T/nobeads.json"
assert_has "$out" "Profile: cx · 1 invocation" "bead ids from the ledger alone still map the names"
assert_has "$out" "no dependency graph" "and the missing graph is named"

echo "run-profile: ordinary-subagent coordinator on Claude Code (the same run, Agent descriptions as labels)"
SUB=$(node "$ORD" "$FX/ordinary.json" claude "$T/ordc")
run bash "$P" --subagents "$SUB" --ledger "$T/ordc/progress.md" --beads "$T/ordc/beads.json" --out "$T/oc"
assert_eq "$code" 0 "exits 0"
assert_eq "$(q "$T/oc.json" "JSON.stringify([d.criticalPath.byCategory, d.bottleneck.ms, d.bottleneck.implByTool, d.simulation.asRunMs, d.concurrency.byActive])")" "$(q "$T/ox.json" "JSON.stringify([d.criticalPath.byCategory, d.bottleneck.ms, d.bottleneck.implByTool, d.simulation.asRunMs, d.concurrency.byActive])")" "the same profile as the Codex run"
run bash "$P" --discover --epic cx --projects "$T/ordc/projects" --codex-home "$T/ord/codex" --ledger "$T/ord/progress.md" --beads "$T/ord/beads.json"
assert_has "$out" "Profile: cx · 2 invocations" "discover finds both coordinators by the ledger path their commands name"
run bash "$P" --subagents "$SUB" --beads "$T/ordc/beads.json" --epic cx
assert_has "$out" "no ledger (--ledger)" "the ledger path the coordinator named is not on disk: no ledger"

echo "run-profile: dispatch names that follow no rule (an older Codex run)"
# implement 0–100, review 100–150, implement 120–300, adapter 400–500: 100s idle, 370s one, 30s two.
COORD2=$(node "$ORD" "$FX/ordinary-adhoc.json" codex "$T/adhoc")
run bash "$P" --codex "$COORD2" --codex-home "$T/adhoc/codex" --beads "$T/adhoc/beads.json" --epic cx --out "$T/ah"
assert_eq "$code" 0 "exits 0 with the run-level lines"
assert_has "$out" "Profile: concurrency — 4 dispatches over 8m · a dispatch running 7m (80%) · dispatches at once: 0 for 20% · 1 for 74% · 2 for 6% of the time · peak 2" "concurrency"
assert_has "$out" "Profile: dispatch time by kind, summed — not named for a bead: implement 5m (2) · adapter 2m (1) · review 50s (1)" "time per name's first word"
assert_has "$out" "Profile: unmeasured — no per-bead profile: no dispatch is named for a bead of cx" "and why there is no more"
assert_eq "$(q "$T/ah.json" "d.partial + ' ' + JSON.stringify(d.concurrency.byActive)")" 'true {"0":100000,"1":370000,"2":30000}' "a partial --out profile"
run bash "$P" --summarize "$T/ah.json"
assert_eq "$code" 2 "a partial profile cannot join a baseline"

echo "run-profile: arguments"
run bash "$P" --help
assert_eq "$code" 0 "--help exits 0"
run bash "$P"
assert_eq "$code" 2 "no input: exit 2"
run bash "$P" --discover
assert_eq "$code" 2 "--discover without --epic: exit 2"
run bash "$P" --workflow "$T/does-not-exist"
assert_eq "$code" 2 "missing directory: exit 2"

echo "run-profile: every coordinator dispatch label is one it knows"
# A label kind the profiler does not know would be timed as `other` and drop out of every bead's
# timeline. Literal `label:` templates in coordinator.js, plus the labels it builds indirectly.
kinds=$( { grep -oE "label: [\`'][a-z][a-z-]*" "$REPO_ROOT/skills/super-code/coordinator.js" | sed -E "s/label: [\`']//"; printf '%s\n' review ledger read-ledger; } | sort -u)
missing=""
for k in $kinds; do grep -qF "case '$k'" "$REPO_ROOT/skills/super-code/scripts/run-profile.mjs" || missing="$missing $k"; done
assert_eq "${missing:-none}" "none" "coordinator label kinds are all classified (missing:${missing:- none})"

echo
if [ "$FAILURES" -eq 0 ]; then echo "run-profile: all tests passed"; else echo "run-profile: $FAILURES failure(s)"; exit 1; fi
