const fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm'),path=require('node:path');
const src='/tmp/ufz-pr2-controller/source',scratch=__dirname;
const ledger=path.join(scratch,'progress.md'),tree='a'.repeat(40);
fs.writeFileSync(ledger,'Launch: args '+JSON.stringify({epicId:'probe',integrationBranch:'probe',integrationWorktree:scratch,invocationId:'refute3'})+'\n');
const producer=cp.spawnSync(process.execPath,[src+'/skills/super-code/scripts/dispatch-text.mjs','--ledger',ledger,'bind-review-source','--base','b'.repeat(40),'--head','c'.repeat(40)],{encoding:'utf8'});
if(producer.status!==0)throw Error(producer.stderr);
const line=fs.readFileSync(ledger,'utf8').split('\n').find(l=>l.startsWith('Recovery:'));
const coordinator=fs.readFileSync(src+'/skills/super-code/coordinator.js','utf8');
const recovery=coordinator.slice(coordinator.indexOf('function recoveryProblem('),coordinator.indexOf('function recoveryGap('));
const scope={line};vm.createContext(scope);vm.runInContext('const recoveryObligations=new Map(),fixHistory=[],verificationCompletions=new Map(),reviewBeadOf=new Map(),blockerBeadOf=new Map();function recoveryGap(){throw Error("invalid recovery")}\n'+recovery+'\nreadRecovery(line); result=[...recoveryObligations.values()]',scope);
const requirement={id:'sweep',kind:'measurement',owner:'caller',command:'suite',configuration:'default',requiredLive:true};
const record={version:1,owner:'super-auto',sourceTree:tree,requirements:[requirement,{id:'review',kind:'review',owner:'caller'},{id:'human',kind:'human',owner:'human'}],evidence:[{sourceTree:tree,command:'suite',configuration:'default',kind:'live',outcome:'pass',location:'test-log'}],reviews:[{id:'review',sourceTree:tree,outcome:'pass',location:'review.md'}],decisions:[{id:'human',authority:'human',decision:'accept',evidence:['user decision']}],runFailures:[],recovery:{obligations:[],gaps:[]},checkEvidence:{records:[],gaps:[],requiredLiveChecks:[]}};
const report=fs.readFileSync(src+'/skills/super-auto/scripts/report-status','utf8');const acceptance=report.split("<<'ACCEPTANCE'\n")[1].split('\nACCEPTANCE')[0];
fs.writeFileSync(path.join(scratch,'acceptance.cjs'),acceptance);
const preload=`const cp=require('node:child_process');cp.spawnSync=()=>({status:0,stdout:JSON.stringify({findings:[],gaps:[]})});`;
fs.writeFileSync(path.join(scratch,'controls.cjs'),preload);
function run(name){const runFile=path.join(scratch,name+'.md');fs.writeFileSync(runFile,'approvals:\n- root-acceptance · '+JSON.stringify(record)+'\n');const r=cp.spawnSync(process.execPath,['--require',path.join(scratch,'controls.cjs'),'-',src+'/skills/super-auto/scripts','--acceptance',runFile],{input:acceptance,encoding:'utf8'});return {exit:r.status,stdout:r.stdout,stderr:r.stderr};}
const control=run('control');record.recovery.obligations=scope.result;const withBinding=run('with-binding');
// Test the closest alternate mechanism: explicitly bind the provenance ID as a sweep.
record.requirements[0].obligations=[scope.result[0].id];const manuallyBoundToSweep=run('manually-bound-to-sweep');
const receipt={producer:{exit:producer.status,stdout:producer.stdout},recovered:scope.result,control,withBinding,manuallyBoundToSweep,limits:'Satisfied review/measurement/human are synthetic fixtures; projection and status are mocked clean. Actual immutable source producer, recovery reader and acceptance code are executed.'};
fs.writeFileSync(path.join(scratch,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt,null,2));
