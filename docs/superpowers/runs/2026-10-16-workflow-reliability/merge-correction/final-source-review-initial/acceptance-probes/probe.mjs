import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(here,'captured');
const status=path.join(root,'skills/super-auto/scripts/report-status');
const extractor=path.join(root,'skills/super-code/scripts/report-verdict');
const ledger=path.join(root,'skills/super-design/scripts/findings-ledger');
const fixtures=path.join(here,'fixtures');fs.mkdirSync(fixtures,{recursive:true});
const env={...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',RS_SKIP_ACCEPTANCE:'0'};
delete env.NODE_OPTIONS;delete env.BASH_ENV;delete env.ENV;delete env.GIT_DIR;delete env.GIT_WORK_TREE;
const events=[];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function cli(label,script,args,cwd){
 const r=cp.spawnSync('/bin/bash',[script,...args],{cwd,env,encoding:'utf8',maxBuffer:8*1024*1024});
 const event={label,script,args,status:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message};events.push(event);
 return event;
}
const tree='a'.repeat(40);
function acceptance(final){return {version:1,owner:'super-auto',sourceTree:tree,
 requirements:[{id:'review',kind:'review',owner:'fixture-caller'},
 {id:'suite',kind:'measurement',owner:'fixture-caller',command:'fixture-suite',configuration:'fixture-local',requiredLive:true},
 {id:'human',kind:'human',owner:'fixture-human'}],
 evidence:[{sourceTree:tree,command:'fixture-suite',configuration:'fixture-local',kind:'live',outcome:'pass',location:'synthetic-fixture-pass.log'}],
 reviews:[{id:'review',sourceTree:tree,outcome:'pass',location:final}],
 decisions:[{id:'human',authority:'human',decision:'accept',evidence:['synthetic fixture decision; no actual user authorization asserted']}],
 recovery:{obligations:[],gaps:[]},checkEvidence:{records:[],requiredLiveChecks:[],gaps:[]},runFailures:[]};}
function extraction(file,source){const r=cli('extract '+source,extractor,['--complete','--source',source,file],path.dirname(file));assert.equal(r.status,0,JSON.stringify(r));return JSON.parse(r.stdout)}
function gate(label,run,want){const r=cli(label,status,['--acceptance',run,'--tree',tree],path.dirname(run));assert.equal(r.status,want,JSON.stringify(r));const value=JSON.parse(r.stdout);assert.equal(value.eligible,want===0);return value;}

try{
 const dir=path.join(fixtures,'keys-declaration');fs.mkdirSync(dir,{recursive:true});
 const roast=path.join(dir,'clean-roast.md'),final=path.join(dir,'original-final.md'),keys=path.join(dir,'review.keys'),run=path.join(dir,'run.md');
 fs.writeFileSync(roast,'super-roast verdict: CLEAN\ninputs: fixture @'+tree+'\n## Confirmed findings\nNone\n');
 fs.writeFileSync(final,'## Verdict\nnot ready\n## Must fix before landing\n- formatting suggestion\n## Untested scope\nNone\n');
 const s=extraction(final,'fixture-final/final'),r=extraction(roast,'roast-code/round-1');
 const keyResult=cli('produce final-review keys',extractor,['--keys',final],dir);assert.equal(keyResult.status,0);
 fs.writeFileSync(keys,'review: not ready\n'+keyResult.stdout);
 const produced=cli('produce real code ledger',ledger,['--loop','code','--out',path.join(dir,'ledger.md'),'--report','1='+roast,'--final-review','1='+keys],dir);assert.equal(produced.status,0,JSON.stringify(produced));
 const ref={source:s.source,section:s.occurrences[0].section,position:1};
 const a=acceptance(final);a.findingAcceptance=[{ref,judgment:'supported',effect:'nonblocking',basis:'Synthetic exact occurrence is outside fixture acceptance scope',evidence:['fixture-scope-judgment']}];
 const correspondence={version:1,artifact:keys,sha256:sha(keys),source:s.source,retainedArtifact:final,retainedSha256:sha(final),judgment:'supported',basis:'Exact source key generated above with complete one-line mapping',evidence:[final,keys],lines:[{line:2,refs:[ref]}]};
 const common='flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\nfindingsLedger: ledger.md\n';
 const records='approvals:\n- finding-source · '+JSON.stringify(s)+'\n- finding-source · '+JSON.stringify(r)+'\n- source-correspondence · '+JSON.stringify(correspondence)+'\n- root-acceptance · '+JSON.stringify(a)+'\n';
 fs.writeFileSync(run,common+'roast-code: clean-roast.md\n'+records);
 gate('KEYS CONTROL: incomplete declaration accepted as existing test does',run,0);
 fs.copyFileSync(run,path.join(dir,'control-run.md'));
 fs.writeFileSync(run,common+'roast-code: clean-roast.md, review.keys\n'+records);
 const d=gate('KEYS COUNTEREXAMPLE: contract-complete declaration rejected',run,3);
 assert(d.gaps.some(g=>g.includes('conflicting report kind')));assert(d.gaps.some(g=>g.includes('retained report kind differs')));
 console.log('CONFIRMED keys declaration: control eligible; adding required actual keys input creates false kind/correspondence gaps.');

 const recoveryDir=path.join(fixtures,'recovery-history');fs.mkdirSync(recoveryDir,{recursive:true});
 const workspace=path.join(recoveryDir,'workspace');fs.mkdirSync(workspace,{recursive:true});
 const recoveryRun=path.join(recoveryDir,'run.md'),review=path.join(workspace,'final-review-recovery.md');
 const snapshot=acceptance(review);
 fs.writeFileSync(recoveryRun,'flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\napprovals:\n- root-acceptance · '+JSON.stringify(snapshot)+'\n');
 function collect(label,file,extra=[]){return cli(label,status,['--collect',file,...extra],recoveryDir)}
 const settlement=['--invocation','recovery','--workspace',workspace,'--review','none','--verdict','UNAVAILABLE'];
 assert.equal(collect('produce settled null unavailable',recoveryRun,settlement).status,3);
 gate('RECOVERY NEGATIVE CONTROL: settled null stays pending',recoveryRun,3);
 fs.writeFileSync(review,'## Verdict\nready\n## Must fix before landing\nNone\n## Deferred OK\nNone\n## Untested scope\nNone\n');
 assert.equal(collect('produce supported null recovery',recoveryRun,['--invocation','recovery','--workspace',workspace,'--review',review,'--verdict','ready','--recover-null']).status,0);
 gate('RECOVERY POSITIVE CONTROL: valid hash-bound recovery',recoveryRun,0);
 const valid=fs.readFileSync(recoveryRun,'utf8');fs.writeFileSync(path.join(recoveryDir,'valid-run.md'),valid);
 for(const [name,mutate] of [['missing-marker',r=>{delete r.recovery}],['incorrect-predecessor',r=>{r.recovery.recordSha256='0'.repeat(64)}]]){
  const lines=valid.split('\n');
  const index=lines.map((l,i)=>l.startsWith('- review-collection · ')?i:-1).filter(i=>i>=0).at(-1);
  const record=JSON.parse(lines[index].slice('- review-collection · '.length));mutate(record);lines[index]='- review-collection · '+JSON.stringify(record);
  const file=path.join(recoveryDir,name+'.md');fs.writeFileSync(file,lines.join('\n'));
  const before=fs.readFileSync(file,'utf8');
  const d=gate('RECOVERY COUNTEREXAMPLE '+name+': gate admits malformed provenance',file,0);assert.deepEqual(d.gaps,[]);assert.deepEqual(d.pending,[]);
  assert.equal(fs.readFileSync(file,'utf8'),before,'gate must remain read-only');
  const replayFile=path.join(recoveryDir,name+'-replay.md');fs.writeFileSync(replayFile,before);
  const replay=collect('COLLECT CONTROL '+name+': same input is rejected by preservation validator',replayFile);assert.equal(replay.status,3,JSON.stringify(replay));assert.match(replay.stderr,/malformed collection record/);
 }
 console.log('CONFIRMED recovery history: valid and unavailable controls behave correctly; malformed final recovery metadata still yields eligible:true while collect rejects it.');
 console.log('Limits: synthetic satisfied requirements and human/evidence records; actual captured producer/parser/gate paths, no live Workflow or real root acceptance claim.');
}finally{fs.writeFileSync(path.join(here,'raw-output.json'),JSON.stringify(events,null,2)+'\n')}
