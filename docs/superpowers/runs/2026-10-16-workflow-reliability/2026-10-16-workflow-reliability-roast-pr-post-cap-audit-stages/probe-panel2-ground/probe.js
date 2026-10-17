const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const [script,tmp]=process.argv.slice(2),tree='a'.repeat(40),other='b'.repeat(40),file=path.join(tmp,'acceptance.md');
fs.writeFileSync(path.join(tmp,'final.md'),'ready\n');
const source={version:1,source:'inv-a/final',artifact:'final.md',kind:'final-review',verdict:'ready',occurrences:[]};
const sourceLine='- finding-source · '+JSON.stringify(source)+'\n';
const check={sourceTree:tree,command:'suite',configuration:'quiet',kind:'live',outcome:'pass',location:'sweep.log'};
const base={version:1,owner:'super-auto',sourceTree:tree,requirements:[
 {id:'final-review',kind:'review',owner:'super-auto'},
 {id:'sweep',kind:'measurement',owner:'super-auto',command:'suite',configuration:'quiet',requiredLive:true},
 {id:'finish',kind:'human',owner:'human'}],
 evidence:[check],reviews:[{id:'final-review',sourceTree:tree,outcome:'pass',location:'final.md'}],
 decisions:[{id:'finish',authority:'human',decision:'accept',evidence:['user-choice']}],
 recovery:{obligations:[],gaps:[]},checkEvidence:{records:[],requiredLiveChecks:[],gaps:[]},runFailures:[]};
let count=0;
function run(modify,want,needle,tail=''){
 const r=structuredClone(base);modify(r);
 fs.writeFileSync(file,'flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\ncodeBuckets:\n  completed: leaf-A, leaf-B\n  escalated: none\n  pendingRetry: none\n  parked: none\n  stalled: false\n  review: ready\n  sweep: 1 — 1 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: suite @ aaaaaaa\napprovals:\n- root-acceptance · '+JSON.stringify(r)+'\n'+sourceLine+tail);
 const p=cp.spawnSync('bash',[script,'--acceptance',file,'--tree',tree],{encoding:'utf8'});
 assert.equal(p.status,want,p.stdout+p.stderr);const d=JSON.parse(p.stdout);assert.equal(d.eligible,want===0);if(needle)assert.match(JSON.stringify(d),needle);count++;return d;
}

run(()=>{},0);

const results=[];
for(const field of ['none','findingsLedger','findingsLedgerDesign']) for(const ledger of (field==='none'?['ledger.md']:['ledger.md','missing.md'])) {
 run(()=>{},0,null,field==='none'?'':field+': '+ledger+'\n');
 const ordinary=cp.spawnSync('bash',[script,file],{encoding:'utf8'});
 const gate=cp.spawnSync('bash',[script,'--acceptance',file,'--tree',tree],{encoding:'utf8'});
 results.push({field,ledger,status:ordinary.stdout,gateCode:gate.status,gate:gate.stdout});
}
console.log(JSON.stringify(results,null,2));
