const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root='/tmp/ufz-pr2-controller/source',scratch=__dirname,repo=path.join(scratch,'repo'),dt=path.join(root,'skills/super-code/scripts/dispatch-text.mjs');
fs.mkdirSync(repo,{recursive:true});
const run=(cmd,args,cwd=repo)=>cp.spawnSync(cmd,args,{cwd,encoding:'utf8',env:{...process.env,GIT_CONFIG_NOSYSTEM:'1'},maxBuffer:20*1024*1024});
const ok=(cmd,args,cwd)=>{const r=run(cmd,args,cwd);assert.equal(r.status,0,r.stderr);return r.stdout.trim()};
const git=(...a)=>ok('git',a);
const write=(p,t)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t)};
git('init','-q');git('config','user.email','regression@example.test');git('config','user.name','Regression Fixture');
write(path.join(repo,'product.js'),'module.exports = 1\n');git('add','.');git('commit','-qm','base');const base=git('rev-parse','HEAD');
write(path.join(repo,'product.js'),'module.exports = 2\n');git('add','.');git('commit','-qm','product');const productHead=git('rev-parse','HEAD');
const ledger=path.join(scratch,'progress.md'),launch={epicId:'fixture',integrationBranch:'fixture',integrationWorktree:repo,invocationId:'regression-probe'};
write(ledger,'Launch: args '+JSON.stringify(launch)+'\n');
const producer=run('node',[dt,'--ledger',ledger,'bind-review-source','--base',base,'--head',productHead]);assert.equal(producer.status,0,producer.stderr);
const recoveryLine=fs.readFileSync(ledger,'utf8').split('\n').find(l=>l.startsWith('Recovery:'));
let coordinator=fs.readFileSync(path.join(root,'skills/super-code/coordinator.js'),'utf8').replace(/^export const meta/m,'const meta');
const cut=coordinator.indexOf('// Resume from the ledger, read once before the round loop:');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const fn=new AsyncFunction('args','agent','log','phase','pipeline','parallel','budget','workflow',coordinator.slice(0,cut)+'return {readRecovery,recoveryObligations};\n'+coordinator.slice(cut));
(async()=>{
 const noDispatch=()=>{throw Error('unexpected operational dispatch')};
 const state=await fn({...launch,skillsRoot:path.join(root,'skills'),config:{}},noDispatch,()=>{},noDispatch,noDispatch,noDispatch,undefined,undefined);
 state.readRecovery(recoveryLine);const obligations=[...state.recoveryObligations.values()];assert.equal(obligations.length,1);
 const tree=git('rev-parse',productHead+'^{tree}');
 const controls={version:1,owner:'super-auto',sourceTree:tree,requirements:[{id:'review',kind:'review',owner:'caller'},{id:'sweep',kind:'measurement',owner:'caller',command:'test',configuration:'fixture',requiredLive:true},{id:'decision',kind:'human',owner:'human'}],evidence:[{sourceTree:tree,command:'test',configuration:'fixture',outcome:'pass',location:'probe:synthetic-positive-control',kind:'live'}],reviews:[{id:'review',sourceTree:tree,outcome:'pass',location:'probe:synthetic-positive-control'}],decisions:[{id:'decision',authority:'human',decision:'accept',evidence:['probe:synthetic-positive-control']}],recovery:{obligations:[],gaps:[]},checkEvidence:{records:[],gaps:[],requiredLiveChecks:[]},runFailures:[]};
 const accept=fs.readFileSync(path.join(root,'skills/super-auto/scripts/report-status'),'utf8').split("<<'ACCEPTANCE'\n")[1].split('\nACCEPTANCE')[0];
 const cases=[];
 for(const [name,obs] of [['without-source-binding',[]],['with-produced-and-recovered-binding',obligations]]){
  const logs=[],snapshot={...controls,recovery:{obligations:obs,gaps:[]}};
  const context={require:n=>n==='node:fs'?{readFileSync:()=> 'approvals:\n- root-acceptance · '+JSON.stringify(snapshot)+'\n'}:n==='node:child_process'?{spawnSync:(_cmd,args)=>({status:0,stdout:args.includes('--project')?JSON.stringify({findings:[],gaps:[]}):''})}:require(n),console:{log:x=>logs.push(x),error:x=>logs.push('error:'+x)},process:{argv:['node','-',path.join(root,'skills/super-auto/scripts'),'--acceptance','/memory/run.md','--tree',tree],env:{},exit:code=>{throw {exitCode:code}}}};
  let status;try{vm.runInNewContext(accept,context)}catch(e){if(e.exitCode===undefined)throw e;status=e.exitCode}
  cases.push({name,status,result:JSON.parse(logs[0])});
 }
 assert.equal(cases[0].result.eligible,true);assert.equal(cases[1].result.eligible,false);assert.deepEqual(cases[1].result.gaps,['review-source:regression-probe: measurement identity unavailable']);
 write(path.join(scratch,'binding-receipt.json'),JSON.stringify({producer,recoveryLine,obligations,cases,limits:'Acceptance prerequisite facts and filesystem/projection/status consumers are synthetic controls. Producer and recovery reader are actual frozen product code.'},null,2)+'\n');
 const fixtureRun='docs/run/reviews/historical-probe/snapshots/run.md',id='archived-inv',prefix='final-review-'+id;
 const collection={invocationId:id,workspace:'/historical/workspace',reviewPath:'/historical/workspace/'+prefix+'.md',review:'not ready',settled:true,required:[],complete:true,gaps:[],files:[{path:prefix+'.md',sha256:crypto.createHash('sha256').update('historical report\n').digest('hex')}]};
 write(path.join(repo,fixtureRun),'approvals:\n- review-collection · '+JSON.stringify(collection)+'\n');git('add','.');git('commit','-qm','ordinary archived run snapshot');const head=git('rev-parse','HEAD');
 const out=path.join(scratch,'nested-assembly');const selection=run('node',[dt,'--ledger',ledger,'review-inputs','--base',base,'--head',head,'--out-dir',out]);assert.equal(selection.status,3,selection.stderr);
 const selected=JSON.parse(fs.readFileSync(path.join(out,'review-inputs.json'),'utf8'));assert(selected.changed.includes('product.js'));assert.equal(selected.slices.length,0);assert.equal(selected.omitted.length,0);assert(selected.gaps.some(g=>g.includes(fixtureRun)));
 const controlOut=path.join(scratch,'control-assembly');const control=run('node',[dt,'--ledger',ledger,'review-inputs','--base',base,'--head',productHead,'--out-dir',controlOut]);assert.equal(control.status,0,control.stderr);const controlData=JSON.parse(fs.readFileSync(path.join(controlOut,'review-inputs.json'),'utf8'));assert.equal(controlData.slices.length,1);
 const reviewPrompt=run('node',[dt,'--ledger',ledger,'--stdout','final-review','--mode','single','--base',base,'--head',productHead]);assert.equal(reviewPrompt.status,0,reviewPrompt.stderr);write(path.join(scratch,'direct-review-prompt.md'),reviewPrompt.stdout);assert(reviewPrompt.stdout.includes('return unavailable without writing a verdict or a direct package'));
 // Execute the exact current refusal condition with the assembler protocol specified by assembler-prompt.md.
 const condition=coordinator.match(/if \(asm\?\.exit === 2 && .* frSourceRefusal = asm\.cause/)[0];
 const finish=vm.runInNewContext('let frSourceRefusal=null; const asm='+JSON.stringify({exit:2,cause:'review input selection: '+selected.gaps[0]})+'; '+condition+'; frSourceRefusal');assert(finish);
 write(path.join(scratch,'nested-receipt.json'),JSON.stringify({base,productHead,head,fixtureRun,selection,control:{status:control.status,slices:controlData.slices},selected,exactFinishCondition:condition,finishRefusal:finish,promptHasUnconditionalUnavailable:true},null,2)+'\n');
 console.log(JSON.stringify({binding:cases,nested:{status:selection.status,slices:selected.slices.length,changed:selected.changed,gaps:selected.gaps,finishRefusal:finish},control:{status:control.status,slices:controlData.slices.length}},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
