const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const w='/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers',dir=__dirname;
const status=path.join(w,'skills/super-auto/scripts/report-status'),rv=path.join(w,'skills/super-code/scripts/report-verdict');
const cli=(p,args)=>{const r=cp.spawnSync('bash',[p,...args],{encoding:'utf8'});return {exit:r.status,stdout:r.stdout,stderr:r.stderr}};
const fixture=path.join(w,'tests/super-design/fixtures/findings-ledger/disputed-reconfirmed');
fs.copyFileSync(path.join(fixture,'r1.md'),path.join(dir,'r1.md'));fs.copyFileSync(path.join(fixture,'overrides.md'),path.join(dir,'overrides.md'));
const ledger=cli(path.join(w,'skills/super-design/scripts/findings-ledger'),['--loop','code','--out',path.join(dir,'ledger.md'),'--report','1='+path.join(dir,'r1.md'),'--overrides',path.join(dir,'overrides.md')]);
const tree='a'.repeat(40),check={sourceTree:tree,command:'suite',configuration:'quiet',kind:'live',outcome:'pass',location:'sweep.log'};
const snapshot={version:1,owner:'super-auto',sourceTree:tree,requirements:[{id:'final-review',kind:'review',owner:'super-auto'},{id:'sweep',kind:'measurement',owner:'super-auto',command:'suite',configuration:'quiet',requiredLive:true},{id:'finish',kind:'human',owner:'human'}],evidence:[check],reviews:[{id:'final-review',sourceTree:tree,outcome:'pass',location:'final.md'}],decisions:[{id:'finish',authority:'human',decision:'accept',evidence:['user-choice']}],recovery:{obligations:[],gaps:[]},checkEvidence:{records:[],requiredLiveChecks:[],gaps:[]},runFailures:[]};
fs.writeFileSync(path.join(dir,'final.md'),'ready\n');
const source={version:1,source:'inv-a/final',artifact:'final.md',kind:'final-review',verdict:'ready',occurrences:[]};
const body='flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\ncodeBuckets:\n  completed: leaf-A\n  escalated: none\n  pendingRetry: none\n  parked: none\n  stalled: false\n  review: ready\n  sweep: 1 passed, 0 failed, 0 errors @ aaaaaaa\napprovals:\n- root-acceptance · '+JSON.stringify(snapshot)+'\n- finding-source · '+JSON.stringify(source)+'\n';
const result={ledger};
for(const mode of ['baseline','ledger-only','retained-roast']){
 let input=body;if(mode!=='baseline')input='findingsLedger: ledger.md\n'+input;
 if(mode==='retained-roast') {const r=cli(rv,['--complete','--source','roast-code/round-1',path.join(dir,'r1.md')]);if(r.exit)throw Error(JSON.stringify(r));const extraction=JSON.parse(r.stdout);extraction.artifact='r1.md';input+='- finding-source · '+JSON.stringify(extraction)+'\n';}
 const file=path.join(dir,mode+'.md');fs.writeFileSync(file,input);result[mode]={status:cli(status,[file]),acceptance:cli(status,['--acceptance',file,'--tree',tree])};
}
fs.writeFileSync(path.join(dir,'receipt.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(result).filter(([k])=>k!=='ledger').map(([k,v])=>[k,{statusExit:v.status.exit,acceptanceExit:v.acceptance.exit,acceptance:JSON.parse(v.acceptance.stdout)}])),null,2));
