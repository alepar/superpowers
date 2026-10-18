// Real-Git lifecycle regression: current intent must not require its own future result.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
const root=process.cwd(), tmp=fs.mkdtempSync(path.join(os.tmpdir(),'current-review-selection-'));
const repo=path.join(tmp,'repo'), runFile='docs/run/run.md', run=path.join(repo,runFile), ws=path.join(repo,'.superpowers/sdd/fixture-plan'), ledger=path.join(ws,'progress.md');
const dt=path.join(root,'skills/super-code/scripts/dispatch-text'), rs=path.join(root,'skills/super-auto/scripts/report-status');
const write=(p,t)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t)};
const git=(...a)=>cp.execFileSync('git',['-c','maintenance.auto=false','-c','gc.auto=0',...a],{cwd:repo,encoding:'utf8'}).trim();
const cli=(...a)=>cp.spawnSync('bash',[dt,'--ledger',ledger,...a],{cwd:repo,encoding:'utf8'});
const collect=(id,report,...extra)=>cp.spawnSync('bash',[rs,'--collect',run,'--invocation',id,'--workspace',ws,'--review',report,'--verdict','not ready',...extra],{encoding:'utf8'});
let n=0,passed=0,failed=0;
const commit=()=>{git('add','.');git('commit','--allow-empty','-qm','fixture '+n++);return git('rev-parse','HEAD')};
const launch=(id,extra={})=>write(ledger,'Launch: args '+JSON.stringify({epicId:'fixture',integrationBranch:'fixture',integrationWorktree:repo,invocationId:id,reviewRunFile:runFile,...extra})+'\n');
const intent=(id,extra={})=>({invocationId:id,workspace:ws,reviewPath:path.join(ws,'final-review-'+id+'.md'),review:'pending',required:[],settled:false,...extra});
const record=r=>'- review-collection · '+JSON.stringify(r)+'\n';
const select=(base,head,extra=[])=>{const out=path.join(ws,'selection-'+n++),r=cli('review-inputs','--base',base,'--head',head,'--out-dir',out,'--review-run-file',runFile,...extra);return {...r,out,data:fs.existsSync(path.join(out,'review-inputs.json'))?JSON.parse(fs.readFileSync(path.join(out,'review-inputs.json'))):null}};
const good=s=>{assert.equal(s.status,0,s.stderr+s.stdout);assert.deepEqual(s.data.gaps,[]);assert.equal(s.data.wholeRangeReady,false);assert(s.data.changed.includes('product.txt'));assert(s.data.slices.some(x=>x.path==='product.txt'))};
const bad=s=>{assert.notEqual(s.status,0,s.stdout);if(s.data){assert.equal(s.data.omitted.length,0);assert(s.data.gaps.length)}};
const check=(name,f)=>{try{f();passed++;console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+' '+e.stack)}};
fs.mkdirSync(repo,{recursive:true});git('init','-q');git('config','user.email','fixture@example.test');git('config','user.name','Fixture');write(path.join(repo,'.gitignore'),'.superpowers/\n');write(run,'phase: code\napprovals:\n');write(path.join(repo,'product.txt'),'before\n');const base=commit();write(path.join(repo,'product.txt'),'after\n');
const pending=intent('current',{required:['plan.md']});write(path.join(ws,'plan.md'),'required exact plan\n');const text='phase: code\napprovals:\n'+record(pending);write(run,text);const head=commit();launch('current');
check('ordinary authenticated pending intent selects real source without acceptance',()=>good(select(base,head)));
check('nonempty required commitment is enforced later by actual collector',()=>{
 write(pending.reviewPath,'## Verdict\nnot ready\n## Untested scope\nnone\n');
 fs.unlinkSync(path.join(ws,'plan.md'));
 const missing=collect('current',pending.reviewPath,'--required','plan.md');assert.equal(missing.status,3,missing.stdout+missing.stderr);assert.match(missing.stdout+missing.stderr,/required|plan.md/);
 write(path.join(ws,'plan.md'),'required exact plan\n');fs.unlinkSync(pending.reviewPath);write(run,text);
 // This collector diagnostic is retained as a real failed attempt, not a fabricated complete archive.
 const archive=path.join(repo,'docs/run/reviews/current');if(fs.existsSync(archive))fs.rmSync(archive,{recursive:true});
});
check('selection alone cannot grant caller acceptance',()=>{
 const tree=git('rev-parse',head+'^{tree}'), gate=cp.spawnSync('bash',[rs,'--acceptance',run,'--tree',tree],{encoding:'utf8'});
 assert.equal(gate.status,3,gate.stdout+gate.stderr);assert.equal(JSON.parse(gate.stdout).eligible,false);
});
// Caller construction must propagate the same context in ordinary and actual Workflow builders.
const commandFrom=text=>{const m=text.match(/\[REVIEW_INPUTS\] = (.*?); \[LEDGER\]/);assert(m,'actual assembler selection command');return m[1]};
const runCommand=command=>cp.spawnSync('sh',['-c',command],{cwd:repo,encoding:'utf8'});
check('source guard binds current captured source before assembly',()=>{
 const r=cli('bind-review-source','--base',base,'--head',head);assert.equal(r.status,0,r.stderr);
 const changed=cli('assemble','--consumer','final-review','--instance','wrong','--base',head,'--head',head,'--stdout');assert.equal(changed.status,2,changed.stdout+changed.stderr);
});
check('ordinary assembler supplies authenticated current context to selector',()=>{const p=cli('assemble','--consumer','final-review','--instance','ordinary','--base',base,'--head',head,'--stdout');assert.equal(p.status,0,p.stderr);const s=runCommand(commandFrom(p.stdout));assert.equal(s.status,0,s.stdout+s.stderr)});
// Execute the real Workflow builder with only its external runtime entry stubbed, as dispatch-text does.
check('real Workflow assembly selection executes successfully',()=>{
 const script=fs.readFileSync(path.join(root,'skills/super-code/coordinator.js'),'utf8'),cut=script.search(/^\/\/ Resume from the ledger, read once before the round loop:/m);
 const body=(script.slice(0,cut)+'return assemblePrompt("final-review","workflow",{base:args.reviewBase,head:args.reviewHead});\n'+script.slice(cut)).replace(/^export const meta/m,'const meta');
 const file=path.join(tmp,'workflow-builder.cjs');write(file,'const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;new AsyncFunction("args","log",'+JSON.stringify(body)+')('+JSON.stringify({epicId:'fixture',integrationBranch:'fixture',integrationWorktree:repo,invocationId:'current',reviewRunFile:runFile,skillsRoot:path.join(root,'skills'),config:{},reviewBase:base,reviewHead:head})+',()=>{}).then(t=>process.stdout.write(t));');
 const prompt=cp.execFileSync('node',[file],{encoding:'utf8'});const s=runCommand(commandFrom(prompt));assert.equal(s.status,0,s.stdout+s.stderr);
});
check('unbound caller and foreign authoritative path fail closed',()=>{launch('current',{reviewRunFile:undefined});bad(select(base,head));launch('current',{reviewRunFile:'fixtures/run.md'});bad(select(base,head));launch('current')});
for(const [name,edit] of [
 ['foreign invocation',r=>r.invocationId='foreign'],['foreign workspace',r=>r.workspace=tmp],['wrong report',r=>r.reviewPath=path.join(ws,'other.md')],['settled incomplete',r=>r.settled=true],['null report',r=>r.reviewPath=null],['saved claim',r=>r.files=[]],['completion claim',r=>r.complete=false],['gap claim',r=>r.gaps=[]],['recovery claim',r=>r.recovery={}],['nonpending verdict',r=>r.review='ready']
])check(name+' stays unavailable',()=>{const r=structuredClone(pending);edit(r);write(run,'phase: code\napprovals:\n'+record(r));bad(select(base,commit()));write(run,text)});
check('copied current intent in another captured run is not authenticated',()=>{write(path.join(repo,'fixtures/run.md'),text);bad(select(base,commit()));fs.rmSync(path.join(repo,'fixtures'),{recursive:true});write(run,text)});
check('conflicting predecessor is not hidden by pristine latest intent',()=>{write(run,'phase: code\napprovals:\n'+record({...pending,workspace:tmp})+record(pending));bad(select(base,commit()));write(run,text)});
check('claimed predecessor is not hidden by pristine latest intent',()=>{write(run,'phase: code\napprovals:\n'+record({...pending,files:[]})+record(pending));bad(select(base,commit()));write(run,text)});
check('unclaimed archive cannot be hidden by pending classification',()=>{write(path.join(repo,'docs/run/reviews/current/forged.txt'),'unvalidated archive\n');bad(select(base,commit()));fs.rmSync(path.join(repo,'docs/run/reviews'),{recursive:true});write(run,text)});
check('captured endpoint change cannot erase required commitments',()=>{
 write(run,text);const b=commit();write(run,'phase: code\napprovals:\n'+record({...pending,required:[]}));bad(select(b,commit()));write(run,text);
});
check('explicit worktree override cannot authenticate foreign source',()=>{
 launch('current',{integrationWorktree:tmp});bad(select(base,head,['--worktree',repo]));launch('current');
});
check('current pristine intent at both captured endpoints works',()=>{const b=commit();write(path.join(repo,'product.txt'),'third\n');good(select(b,commit()))});
check('actual settlement then fresh reentry retains history and enforces required inputs',()=>{
 const cycle=intent('cycle',{required:['plan.md']});write(run,'phase: code\napprovals:\n'+record(cycle));const h=commit();launch('cycle');
 assert.equal(cli('bind-review-source','--base',base,'--head',h).status,0);
 const prompt=cli('assemble','--consumer','final-review','--instance','final','--base',base,'--head',h,'--stdout');assert.equal(prompt.status,0,prompt.stderr);
 const assembly=runCommand(commandFrom(prompt.stdout));assert.equal(assembly.status,0,assembly.stdout+assembly.stderr);
 const out=path.join(ws,'assembled/final-review-cycle-final');
 const selected=JSON.parse(fs.readFileSync(path.join(out,'review-inputs.json')));assert(selected.slices.some(s=>s.path==='product.txt'));
 write(path.join(out,'digest.md'),'actual fixture assembly digest\n');
 const report=cycle.reviewPath;write(report,'## Verdict\nnot ready\n## Must fix before landing\n- product.txt:1 — retained fixture finding\n## Untested scope\nnone\n');
 assert.equal(collect('cycle',report,'--required','plan.md').status,0);
 const collected=fs.readFileSync(run,'utf8');assert.match(collected,/"complete":true/);assert.match(collected,/"required":\["plan.md"\]/);
 fs.appendFileSync(run,record(intent('next')));const h2=commit();launch('next');good(select(base,h2));
 const archived=path.join(repo,'docs/run/reviews/cycle/plan.md');assert.equal(fs.readFileSync(archived,'utf8'),'required exact plan\n');
 fs.unlinkSync(archived);bad(select(base,commit()));write(archived,'corrupt\n');bad(select(base,commit()));
});
console.log(JSON.stringify({passed,failed,tmp,sourceHead:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()}));process.exitCode=failed?1:0;
