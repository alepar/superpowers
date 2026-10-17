# Task 27 / super-plan-ufz.30 implementation report

## Implementation

Qualified the historical Markdown bound and corresponding JSON simulation/summary claims. The 17h58m result is now a model-only minimum, not an established historical lower bound; simulation.verdict is inconclusive and diagnosis.dominant is unknown. The retained legacy lowerBoundMs numeric field is explicitly explained. Both representations retain observed timing, unknown readiness, graph-scope limitations, planning context and distinct all-agent/task-slot scope. Counterfactual savings are relative to the modeled baseline. The .14 task-path contribution is distinguished from an established whole-run cause.

The task's two named files are the complete committed diff; no profiler code, general profile change, product test, spec Goal, historical snapshot, run.md, tracker state, root acceptance or Herdr state was changed. Task .27 and its pending human gate/resources were untouched.

## Requirements and source judgment

Read current `bd show super-plan-ufz.30 --json` and `bd comments super-plan-ufz.30` before editing; there are no amendments or comments. The frozen task-27 brief and current acceptance agree. Read the approved workflow reliability spec (especially §5), finding-continuity design, captured cluster-16 review, roast step-back and the profiler's model/diagnosis producer source. Judgment remains bounded by those captured records; rejected measurement-classification and direct frozen-Git fallback materiality findings are not reopened.

The original implementation source was clean c3fac4369c7c737e2e7f9f7250fd253b21442d12. A fresh task worktree and task-super-plan-ufz.30 branch were cut after already-merged returned false. There is no install/setup script or package dependency for this data-only comparison. The comparison runner is the task-local `.superpowers/task-30/compare-profile.mjs`; both artifacts resolve inside this task worktree. Native Node is `/opt/homebrew/bin/node`, an interpreter rather than an installed product/test-runner package.

## Claim-focused RED assessment

This was a pre-edit evidence comparison, not a failing product test or newly added test suite. Its complete retained output follows:


```text
Claim-focused RED assessment (not a product test):
Profile: bound — graph lower bound 17h58m along super-plan-ufz.20 → super-plan-ufz.14 (unlimited slots and merge lanes) · model of the run 17h58m (cap 3, one merge lane) vs actual 17h43m (101%) → graph-bound: the 2-bead dependency chain set the pace — reshaping it is the lever
Profile: diagnosis — planning 5m (0% of first dispatch to last landing)
Profile: redo — on the critical path, up to retries 11m (super-plan-ufz.14) — from a bead's first attempt to its final one; the what-ifs model the real saving
Profile: what-if estimate — cut super-plan-ufz.14 <- super-plan-ufz.20 → 17h42m (−16m, 2%) — payoff if this edge were cut — whether it can be is a design call; first dispatch to last landing, planning retained
Profile: what-if estimate — faster super-plan-ufz.14 → 17h43m (−15m, 1%) — its implement time halved; first dispatch to last landing, planning retained
simulation.verdict: graph-bound diagnosis.dominant: task graph
Modeled lowerBoundMs: 64688059 observed graphMs: 63785002 excess ms: 903057
{"id":"super-plan-ufz.14","createdAt":"2026-10-17T06:01:16.000Z","dispatchedAt":"2026-10-17T08:19:58.131Z","readyAt":null,"dependencyReadyAt":null,"waitMs":null,"lateEdges":[]}
{"id":"super-plan-ufz.20","createdAt":"2026-10-17T08:27:13.000Z","dispatchedAt":"2026-10-17T08:31:40.461Z","readyAt":null,"dependencyReadyAt":null,"waitMs":null,"lateEdges":[]}
Long wait: {"kind":"wait","bead":null,"label":"previous → reliability_design","via":null,"start":"2026-10-16T15:19:02.530Z","ms":51989476}
Concurrency: {"wallMs":63998871,"byActive":{"0":53097429,"1":2549996,"2":4549103,"3":3802343}}
RED: model exceeds observed graph window; final residual edge does not establish historical ordering; readiness and waits remain unknown; 14h26m wait and rounded 83% no-agent time preclude established task-parallelism diagnosis.
```

The conflict is directly supported: 64,688,059 ms modeled versus 63,785,002 ms observed; .14 dispatch precedes .20 creation by 434,869 ms. Unknown readiness and null waitMs remain unknown. The retained 51,989,476 ms wait rounds to 14h26m, and zero-agent occupancy rounds to 83% of the 63,998,871 ms wall window. No cause is inferred from the idle observation.

## Verification command

Executed once after the final edits (exit 0, about 0.46 seconds); no edits or source changes followed. The task branch rebase was a no-op because integration remained at the original base.


```sh
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.30 node .superpowers/task-30/compare-profile.mjs > .superpowers/task-30/claim-green.log && cat .superpowers/task-30/claim-green.log
```

## One-off comparison source

This ignored local evidence helper only reads the two profiles and Git source; it is not a delivered product test or a prose-mirroring regression test. Every assertion can fail on changed raw/numeric source, an unexpected interpretation field, a changed timeline/table, a mismatched summary or unsupported timestamp ordering. It prints qualified prose for semantic self-review rather than asserting expected sentences.

```js
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const base='c3fac4369c7c737e2e7f9f7250fd253b21442d12';
const root='docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation';
const oldText=ext=>execFileSync('git',['show',`${base}:${root}.${ext}`],{encoding:'utf8'});
const before=JSON.parse(oldText('json'));
const after=JSON.parse(fs.readFileSync(`${root}.json`,'utf8'));
const mdBefore=oldText('md'),mdAfter=fs.readFileSync(`${root}.md`,'utf8');
const flatten=(v,path='',out={})=>{if(v&&typeof v==='object'){for(const[k,x]of Object.entries(v))flatten(x,`${path}/${k}`,out);}else out[path]=v;return out;};
const b=flatten(before),a=flatten(after);
const changed=[...new Set([...Object.keys(b),...Object.keys(a)])].filter(k=>!Object.is(b[k],a[k]));
const allowed=['/diagnosis/dominant','/simulation/verdict','/simulation/qualification','/simulation/whatIfs/0/note','/simulation/whatIfs/1/note',...[3,5,7,12,18,19].map(i=>`/summary/${i}`)];
assert.deepEqual(changed.sort(),allowed.sort());
const numeric=o=>Object.fromEntries(Object.entries(o).filter(([,v])=>typeof v==='number'));
assert.deepEqual(numeric(a),numeric(b));
let rawCount=0;
for(const key of Object.keys(before))if(!['diagnosis','simulation','summary'].includes(key)){assert.deepEqual(after[key],before[key]);rawCount++;}
for(const key of ['planningMs','windowMs'])assert.equal(after.diagnosis[key],before.diagnosis[key]);
const rawSimulation=o=>{const x=structuredClone(o);delete x.verdict;delete x.qualification;for(const w of x.whatIfs)delete w.note;return x;};
assert.deepEqual(rawSimulation(after.simulation),rawSimulation(before.simulation));
const middle=s=>s.slice(s.indexOf('## Per bead'),s.indexOf('## Schedule model'));
const tail=s=>s.slice(s.indexOf('## Timeline'));
assert.equal(middle(mdAfter),middle(mdBefore));assert.equal(tail(mdAfter),tail(mdBefore));
const scenarios=s=>s.slice(s.indexOf('| scenario |'),s.indexOf('## Timeline')).trim().split('\n').map(r=>r.split('|').slice(2));
assert.deepEqual(scenarios(mdAfter),scenarios(mdBefore));
assert.deepEqual(mdAfter.split('```')[1].trim().split('\n'),after.summary);
const late=after.beads.filter(x=>['super-plan-ufz.14','super-plan-ufz.20'].includes(x.id));
const a14=late.find(x=>x.id.endsWith('.14')),a20=late.find(x=>x.id.endsWith('.20'));
assert.ok(Date.parse(a14.dispatchedAt)<Date.parse(a20.createdAt));
for(const x of late){assert.equal(x.readyAt,null);assert.equal(x.waitMs,null);}
const changedFiles=execFileSync('git',['diff','--name-only',base],{encoding:'utf8'}).trim().split('\n').sort();
assert.deepEqual(changedFiles,[`${root}.json`,`${root}.md`].sort());
console.log(`PASS: JSON parses; ${Object.keys(numeric(a)).length} numeric leaves unchanged; ${rawCount} complete raw top-level subtrees, diagnosis timings and simulation results unchanged.`);
console.log('PASS: Markdown raw per-bead/critical-path/tool sections and entire timeline/context/unmeasured suffix are byte-identical; schedule table numeric columns unchanged.');
console.log(`PASS: ${after.summary.length} Markdown/JSON summary lines identical; only ${changed.length} authorized interpretation leaves changed; only the two named tracked files changed.`);
console.log('Observed support:',JSON.stringify({modelMs:after.simulation.lowerBoundMs,graphMs:after.window.graphMs,excessMs:after.simulation.lowerBoundMs-after.window.graphMs,planningMs:after.diagnosis.planningMs,longWait:after.criticalPath.segments.find(s=>s.ms>14*3600000),noAgentPercent:Math.round(after.concurrency.byActive['0']/after.concurrency.wallMs*100),wallMs:after.concurrency.wallMs,allAgentPeak:after.concurrency.peak,taskSlotPeak:after.taskSlots.peak,taskSlotCap:after.taskSlots.cap}));
console.log('Late task records:',JSON.stringify(late.map(x=>({id:x.id,createdAt:x.createdAt,dispatchedAt:x.dispatchedAt,readyAt:x.readyAt,waitMs:x.waitMs,lateEdges:x.lateEdges,stackParents:x.stackParents}))));
console.log('Qualified interpretations for semantic self-review:');
console.log('diagnosis.dominant:',after.diagnosis.dominant,'simulation.verdict:',after.simulation.verdict);
console.log(after.simulation.qualification);
for(const i of [3,5,7,12,18,19])console.log(after.summary[i]);
console.log('PASS: bounded historical qualification comparison complete; no product code or behavior tests run.');
```

## Verification output

```text
PASS: JSON parses; 1818 numeric leaves unchanged; 22 complete raw top-level subtrees, diagnosis timings and simulation results unchanged.
PASS: Markdown raw per-bead/critical-path/tool sections and entire timeline/context/unmeasured suffix are byte-identical; schedule table numeric columns unchanged.
PASS: 24 Markdown/JSON summary lines identical; only 11 authorized interpretation leaves changed; only the two named tracked files changed.
Observed support: {"modelMs":64688059,"graphMs":63785002,"excessMs":903057,"planningMs":285704,"longWait":{"kind":"wait","bead":null,"label":"previous → reliability_design","via":null,"start":"2026-10-16T15:19:02.530Z","ms":51989476},"noAgentPercent":83,"wallMs":63998871,"allAgentPeak":6,"taskSlotPeak":3,"taskSlotCap":3}
Late task records: [{"id":"super-plan-ufz.14","createdAt":"2026-10-17T06:01:16.000Z","dispatchedAt":"2026-10-17T08:19:58.131Z","readyAt":null,"waitMs":null,"lateEdges":[],"stackParents":["super-plan-ufz.20"]},{"id":"super-plan-ufz.20","createdAt":"2026-10-17T08:27:13.000Z","dispatchedAt":"2026-10-17T08:31:40.461Z","readyAt":null,"waitMs":null,"lateEdges":[],"stackParents":[]}]
Qualified interpretations for semantic self-review:
diagnosis.dominant: unknown simulation.verdict: inconclusive
Model-only minimum 17h58m (lowerBoundMs retained as a legacy model field) exceeds the observed 17h43m graph window by 903,057 ms; it is not an established historical lower bound or causal diagnosis. The model uses the observed residual .20 → .14 edge and dispatch release boundaries where readiness is unknown. .14 dispatch 2026-10-17T08:19:58.131Z precedes .20 creation 2026-10-17T08:27:13.000Z and dispatch 08:31:40.461Z; both readiness and waits remain unknown. No enforced historical dependency or pre-creation wait is inferred. Planning 5m remains included; the critical-path record contains a 14h26m wait and all-agent concurrency has 83% no-agent time over the 17h47m wall window. These observations do not establish the delay cause or task parallelism alone as a remedy. All-agent peak 6 and task-slot peak/cap 3 retain distinct meanings; what-if savings are relative to the model baseline, not demonstrated actual reductions.
Profile: bound — model-only minimum 17h58m along super-plan-ufz.20 → super-plan-ufz.14 (unlimited slots and merge lanes) · model of the run 17h58m (cap 3, one merge lane) vs observed 17h43m (101%) → inconclusive: model exceeds the observed graph window; no established historical lower bound or causal bottleneck
Profile: diagnosis — planning 5m (0% of first dispatch to last landing); the window includes a 14h26m wait and 83% no-agent time (all-agent wall window); cause unknown, task parallelism alone is not an established remedy
Profile: bottleneck — observed task-path contribution, not an established causal bottleneck — super-plan-ufz.14 — 34m on the critical path (3%) · implement 31m · review 1m · merge 58s · dispatch 28s · wait 58s · implement on the path 31m: test 14s · poll 7m · git 4s · read 1s · edit 29s · shell 42s · other 2s · model 22m (longest: "wait_agent" 45s, "wait_agent" 30s) · 2 attempts (?, IMPLEMENTED) · dependents 0
Profile: redo — on the critical path, up to retries 11m (super-plan-ufz.14) — from a bead's first attempt to its final one; the what-if savings are model-relative estimates, not established elapsed-time savings
Profile: what-if estimate — cut super-plan-ufz.14 <- super-plan-ufz.20 → 17h42m (−16m, 2%) — model-relative saving if this residual edge were cut; historical enforcement and feasibility unknown; first dispatch to last landing, planning retained
Profile: what-if estimate — faster super-plan-ufz.14 → 17h43m (−15m, 1%) — its implement time halved in the model; model-relative saving, not a demonstrated actual reduction; first dispatch to last landing, planning retained
PASS: bounded historical qualification comparison complete; no product code or behavior tests run.
```

## Source-tree capture

Before verification the tested dirty source was captured through a temporary index, preserving the real index:


```sh
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.30/source.index git read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.30/source.index git add docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.md docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.json
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.30/source.index git write-tree
```

Output: `d807eeb58c5aefe49829da9e56d36cf16ee0f6a4`. After commit and no-op rebase, `git rev-parse HEAD^{tree}` returned exactly the same tree. `git diff --check` passed. `git status --short` was empty after commit/rebase.

## Self-review and acceptance coverage

- The modeled minimum is explicitly inconsistent with the observed window, and both Markdown and JSON qualify the lower-bound and causal claims.
- Exact .14 dispatch and .20 creation timestamps and .20 dispatch remain explicit. Unknown readiness/waits, residual edge, stack-parent and late-edge records are preserved; no historical dependency enforcement or pre-creation wait is inferred.
- The 14h26m wait, 83% no-agent time and 5m planning observation remain, with wall/graph windows and agent/slot scopes distinguished. Cause and parallelism remedy remain unknown.
- All 1,818 numerical JSON leaves, 22 complete raw top-level subtrees, diagnosis timing fields, simulation numeric results and topology are unchanged. Markdown raw sections/timeline are byte-identical, and schedule table values are unchanged. Raw JSON equality covers source/provenance/context and historical records. Only the 11 enumerated interpretation leaves differ.
- The Markdown summary and JSON summary have the same 24 lines. All altered claims were read side by side against the recorded raw facts; the full comparison output is retained above for independent semantic review.

## Test hygiene

No servers, daemons, watchers or background processes were started. The first hygiene invocation from inside the target worktree exited 2 with `refusing root ...: it contains the working directory of this process or an ancestor`; that was a helper guard, not proof of a clean process state. The check was then run from the read-only integration cwd, outside the target roots:


```sh
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers && bash skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30 /tmp/sp-bce79baa/super-plan-ufz.30 > /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30/.superpowers/task-30/hygiene-final.log && cat /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30/.superpowers/task-30/hygiene-final.log
```

Exit 0; output empty, no `match:` lines. Final `stop-run-processes` without `--check` ran from the same outside cwd against these same task-only roots and exited 0 with no output or `survived:` lines. No process leak was observed. No resources from other tasks were targeted. No permission refusal occurred. A null-unaware exploratory key listing initially errored on null runtimeSlots; it was corrected for inspection and was not used as verification evidence.

## Assumptions

The retained final/residual graph and dispatch release boundaries are model assumptions, not historical graph reconstruction. Legacy numeric keys and all raw observations are preserved, while the expressly named interpretation fields may be qualified. Native data comparison is sufficient for this documentation-only scope; no product code or agent instruction behavior changed.

## Concerns

This delivers historical claim qualification only. It does not supply new live workflow measurement, root final sweep, changed-instruction evaluation, independent review or human acceptance. Those remain caller-owned. No broader suite, workflow-engine dryRun, extra agent, merge, push or base/main change was performed.

## Structured result


```json
{
  "id": "super-plan-ufz.30",
  "status": "IMPLEMENTED",
  "canonicalStatus": "IMPLEMENTED",
  "completionKind": "implementation",
  "files": [
    "docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.md",
    "docs/superpowers/runs/2026-10-16-workflow-reliability/profile-implementation.json"
  ],
  "base": "c3fac4369c7c737e2e7f9f7250fd253b21442d12",
  "head": "0b3ff13eb7894c36625e4320eb426fc366b4953c",
  "stacked": false,
  "reopened": false,
  "sourceTree": "d807eeb58c5aefe49829da9e56d36cf16ee0f6a4",
  "report": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-27-report.md",
  "evidence": [
    {
      "sourceTree": "d807eeb58c5aefe49829da9e56d36cf16ee0f6a4",
      "command": "cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.30 node .superpowers/task-30/compare-profile.mjs > .superpowers/task-30/claim-green.log && cat .superpowers/task-30/claim-green.log",
      "configuration": "baseline=c3fac4369c7c737e2e7f9f7250fd253b21442d12; native Node; two historical profile artifacts; no product execution",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-27-report.md#verification-output",
      "kind": "live"
    },
    {
      "sourceTree": "d807eeb58c5aefe49829da9e56d36cf16ee0f6a4",
      "command": "cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers && bash skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30 /tmp/sp-bce79baa/super-plan-ufz.30 > /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30/.superpowers/task-30/hygiene-final.log && cat /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30/.superpowers/task-30/hygiene-final.log",
      "configuration": "exact task .30 worktree and /tmp/sp-bce79baa/super-plan-ufz.30 roots; cwd outside target roots",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-27-report.md#test-hygiene",
      "kind": "live"
    }
  ],
  "requiredLiveChecks": [
    {
      "sourceTree": "d807eeb58c5aefe49829da9e56d36cf16ee0f6a4",
      "command": "cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.30 node .superpowers/task-30/compare-profile.mjs > .superpowers/task-30/claim-green.log && cat .superpowers/task-30/claim-green.log",
      "configuration": "baseline=c3fac4369c7c737e2e7f9f7250fd253b21442d12; native Node; two historical profile artifacts; no product execution"
    },
    {
      "sourceTree": "d807eeb58c5aefe49829da9e56d36cf16ee0f6a4",
      "command": "cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers && bash skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30 /tmp/sp-bce79baa/super-plan-ufz.30 > /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30/.superpowers/task-30/hygiene-final.log && cat /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.30/.superpowers/task-30/hygiene-final.log",
      "configuration": "exact task .30 worktree and /tmp/sp-bce79baa/super-plan-ufz.30 roots; cwd outside target roots"
    }
  ],
  "humanAction": [],
  "concerns": [
    "Bounded historical interpretation correction only; independent review, final sweep, changed-instruction evaluation and root/human acceptance remain caller-owned. No historical graph reconstruction or new measurement was performed."
  ]
}
```
