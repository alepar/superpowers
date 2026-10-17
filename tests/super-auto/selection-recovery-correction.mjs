import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import cp from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'selection-correction-')),repo=path.join(tmp,'repo'),ws=path.join(tmp,'workspace');
fs.mkdirSync(repo);fs.mkdirSync(ws);
const run=path.join(repo,'runs/current/run.md'),ledger=path.join(ws,'progress.md'),dt=path.join(root,'skills/super-code/scripts/dispatch-text'),rs=path.join(root,'skills/super-auto/scripts/report-status');
const write=(p,t)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t)};
const exec=(c,a,cwd=repo)=>cp.execFileSync(c,a,{cwd,encoding:'utf8'}).trim();
const git=(...a)=>exec('git',a),cli=(...a)=>cp.spawnSync('bash',[dt,...a],{cwd:repo,encoding:'utf8'});
let failed=0,passed=0,n=0;
function check(name,f){if(process.env.TEST_FILTER&&!name.includes(process.env.TEST_FILTER))return;try{f();passed++;console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+': '+e.stack)}}
function commit(){git('add','.');git('commit','-qm','snapshot '+n++);return git('rev-parse','HEAD')}
function selection(head,out=path.join(tmp,'selection-'+n++)){const r=cli('review-inputs','--ledger',ledger,'--base',base,'--head',head,'--out-dir',out);return {...r,out,data:JSON.parse(fs.readFileSync(path.join(out,'review-inputs.json')))}}
function collect(...a){return cp.spawnSync('bash',[rs,'--collect',run,...a],{encoding:'utf8'})}
console.log('implementation identities: '+JSON.stringify({head:exec('git',['rev-parse','HEAD'],root),dispatchSha256:createHash('sha256').update(fs.readFileSync(path.join(root,'skills/super-code/scripts/dispatch-text.mjs'))).digest('hex'),coordinatorSha256:createHash('sha256').update(fs.readFileSync(path.join(root,'skills/super-code/coordinator.js'))).digest('hex')}));
const report='## Verdict\nready\n## Must fix before landing\n- product.txt:1 — retained concrete finding\n## Untested scope\n- none\n## Deferred OK\n- none\n';
git('init','-q');git('config','user.email','fixture@example.test');git('config','user.name','Fixture');
write(run,'flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n');write(path.join(repo,'product.txt'),'before\n');const base=commit();
write(ledger,'Launch: args '+JSON.stringify({epicId:'fixture',integrationBranch:'fixture',integrationWorktree:repo,invocationId:'bounded'})+'\n');
const args=['--invocation','probe','--workspace',ws,'--review','none','--verdict','UNAVAILABLE'];assert.equal(collect(...args).status,3);
const old=fs.readFileSync(run,'utf8');const source=path.join(ws,'final-review-probe.md');write(source,report);
assert.equal(collect('--invocation','probe','--workspace',ws,'--review',source,'--verdict','ready','--recover-null').status,0);
assert(fs.readFileSync(run,'utf8').includes(old.trimEnd()));write(path.join(repo,'product.txt'),'after\n');const recovered=fs.readFileSync(run,'utf8'),head=commit();
check('real recovered collector history grants only validated omission authority',()=>{const s=selection(head);assert.equal(s.status,0,s.stdout+s.stderr);assert.deepEqual(s.data.gaps,[])});
for(const mode of ['all markers','last marker','forged predecessor','changed recovered verdict','changed required','changed path'])check('reject '+mode,()=>{
 const lines=recovered.split('\n'),indices=lines.flatMap((l,i)=>l.startsWith('- review-collection · ')?[i]:[]),last=indices.at(-1);
 for(const i of indices){const r=JSON.parse(lines[i].split(' · ')[1]);if(r.recovery){if(mode==='all markers'||(mode==='last marker'&&i===last))delete r.recovery;else if(mode==='forged predecessor')r.recovery.recordSha256='0'.repeat(64);else if(mode==='changed recovered verdict'&&i===last)r.review='not ready';else if(mode==='changed required')r.required=['different'];else if(mode==='changed path')r.reviewPath=path.join(ws,'other.md')};lines[i]='- review-collection · '+JSON.stringify(r)}
 write(run,lines.join('\n'));const s=selection(commit());assert.equal(s.status,3);assert.equal(s.data.omitted.length,0);assert(s.data.gaps.length);write(run,recovered);
});
check('reject hash-linked but invalid complete null predecessor',()=>{
 const lines=recovered.split('\n'),records=lines.flatMap((line,i)=>line.startsWith('- review-collection · ')?[{i,r:JSON.parse(line.split(' · ')[1])}]:[]);
 const predecessor=records.filter(({r})=>r.reviewPath===null).at(-1);predecessor.r.complete=true;predecessor.r.gaps=[];
 const digest=createHash('sha256').update(JSON.stringify(predecessor.r)).digest('hex');
 for(const record of records){if(record.r.recovery)record.r.recovery.recordSha256=digest;lines[record.i]='- review-collection · '+JSON.stringify(record.r)}
 write(run,lines.join('\n'));const invalid=selection(commit());assert.equal(invalid.status,3);assert.equal(invalid.data.omitted.length,0);write(run,recovered);
});
write(run,recovered);
// This actual copied run record has no sibling archive. Its name cannot authorize omission,
// but the captured independent product hunk is still available for a bounded review.
write(path.join(repo,'fixtures/captured/run.md'),recovered);const nestedHead=commit();
assert.equal(cli('bind-review-source','--ledger',ledger,'--base',base,'--head',nestedHead).status,0);
const s=selection(nestedHead,path.join(ws,'assembled/final-review-bounded-final'));
fs.appendFileSync(run,'- review-collection · '+JSON.stringify({invocationId:'bounded',workspace:ws,reviewPath:path.join(ws,'final-review-bounded.md'),review:'pending',required:[],settled:false})+'\n');
check('nested historical provenance retains source availability without omission or whole-range readiness',()=>{assert.equal(s.status,3);assert.equal(s.data.sourceAvailable,true);assert.equal(s.data.wholeRangeReady,false);assert(s.data.changed.includes('product.txt'));assert.equal(s.data.omitted.length,0);assert(s.data.gaps.some(g=>g.includes('fixtures/captured/run.md')))});
const draft=path.join(s.out,'bounded-draft.md'),coverage=path.join(s.out,'bounded-coverage.json'),output=path.join(ws,'final-review-bounded.md');write(draft,report);write(coverage,JSON.stringify({inspected:[{path:'product.txt',hunks:['@@ -1 +1 @@']}]}));
const finalize=(extra=[])=>cli('bounded-review','--ledger',ledger,'--base',base,'--head',nestedHead,'--selection',path.join(s.out,'review-inputs.json'),'--draft',draft,'--coverage',coverage,'--out',output,...extra);
check('bounded report forces incomplete verdict and survives extraction and collection',()=>{
 const r=finalize();assert.equal(r.status,0,r.stdout+r.stderr);const text=fs.readFileSync(output,'utf8');assert.match(text,/not ready/);assert.match(text,/retained concrete finding/);assert.match(text,/fixtures\/captured\/run.md/);assert.equal(fs.readFileSync(draft,'utf8'),report);
 const extracted=JSON.parse(exec('bash',[path.join(root,'skills/super-code/scripts/report-verdict'),'--complete','--source','bounded/final',output]));assert.match(extracted.verdict,/not ready/);assert(extracted.occurrences.some(o=>JSON.stringify(o).includes('retained concrete finding')));assert(extracted.occurrences.some(o=>JSON.stringify(o).includes('whole-epic')));
 const result=collect('--invocation','bounded','--workspace',ws,'--review',output,'--verdict',extracted.verdict);assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(fs.readFileSync(path.join(repo,'runs/current/reviews/bounded/assembled/final-review-bounded-final/bounded-draft.md'),'utf8'),report);assert.deepEqual(fs.readFileSync(path.join(repo,'runs/current/reviews/bounded/assembled/final-review-bounded-final/bounded-coverage.json')),fs.readFileSync(coverage));assert.match(exec('bash',[rs,run]),/whole-epic|outstanding|unresolved|pending|not ready/);
 const tree=git('rev-parse',nestedHead+'^{tree}'), snapshot={version:1,owner:'super-auto',sourceTree:tree,requirements:[{id:'whole-review',kind:'review',owner:'caller'},{id:'suite',kind:'measurement',owner:'caller',command:'suite',configuration:'fixture',requiredLive:true},{id:'human',kind:'human',owner:'human'}],evidence:[{sourceTree:tree,command:'suite',configuration:'fixture',kind:'live',outcome:'pass',location:'fixture.log'}],reviews:[{id:'whole-review',sourceTree:tree,outcome:'unavailable',location:output}],decisions:[{id:'human',authority:'human',decision:'accept',evidence:['fixture human decision']}],recovery:{obligations:[],gaps:[]},checkEvidence:{records:[],requiredLiveChecks:[],gaps:[]},runFailures:[],findingAcceptance:[]};
 const sources=fs.readFileSync(run,'utf8').split('\n').filter(l=>l.startsWith('- finding-source · ')).map(l=>JSON.parse(l.split(' · ')[1]));
 for(const source of sources)for(const occurrence of source.occurrences)snapshot.findingAcceptance.push({ref:{source:source.source,section:occurrence.section,position:occurrence.position},judgment:'supported',effect:occurrence.section==='Untested scope'?'required':'nonblocking',requirement:'whole-review',basis:'fixture exact scope judgment',evidence:[source.artifact]});
 fs.appendFileSync(run,'- root-acceptance · '+JSON.stringify(snapshot)+'\n');const gate=cp.spawnSync('bash',[rs,'--acceptance',run,'--tree',tree],{encoding:'utf8'});assert.equal(gate.status,3,gate.stdout+gate.stderr);assert.equal(JSON.parse(gate.stdout).eligible,false);assert.match(gate.stdout,/whole-review/);assert.match(gate.stdout,/pending|remains required/);assert.doesNotMatch(gate.stdout,/missing measurement|missing human|relevance unproven/);
});
check('bounded writer preserves existing report',()=>{const before=fs.existsSync(output)?fs.readFileSync(output):null;const r=finalize();assert.equal(r.status,2);if(before)assert.deepEqual(fs.readFileSync(output),before)});
check('bounded writer rejects source mismatch',()=>assert.equal(finalize(['--head',head]).status,2));
// Remove only the fresh fixture output after the preservation check so negative writer
// controls cannot pass merely because the existing-output guard fires first.
if(fs.existsSync(output))fs.renameSync(output,output+'.saved');
const selectionFile=path.join(s.out,'review-inputs.json'),selectionBytes=fs.readFileSync(selectionFile);
for(const [name,edit] of [
 ['claimed omission',v=>v.omitted.push({path:'product.txt'})],
 ['incomplete inventory',v=>v.changed=v.changed.filter(p=>p!=='product.txt')],
 ['source unavailable',v=>v.sourceAvailable=false],
 ['missing gaps',v=>v.gaps=[]],
 ['wrong captured source',v=>v.head=head]
])check('bounded writer rejects '+name,()=>{const value=JSON.parse(selectionBytes);edit(value);write(selectionFile,JSON.stringify(value));const r=finalize();assert.equal(r.status,2,r.stdout+r.stderr);assert(!fs.existsSync(output));write(selectionFile,selectionBytes)});
check('bounded writer rejects invented inspected hunk',()=>{write(coverage,JSON.stringify({inspected:[{path:'product.txt',hunks:['@@ -99 +99 @@']}]}));assert.equal(finalize().status,2);assert(!fs.existsSync(output));write(coverage,JSON.stringify({inspected:[{path:'product.txt',hunks:['@@ -1 +1 @@']}]}))});
check('bounded writer refuses missing captured commit object',()=>{const saved=fs.readFileSync(ledger,'utf8');write(ledger,saved.replaceAll(nestedHead,'f'.repeat(40)));assert.equal(finalize(['--head','f'.repeat(40)]).status,2);assert(!fs.existsSync(output));write(ledger,saved)});
check('ordinary prompt exposes bounded source route',()=>{const r=cli('final-review','--ledger',ledger,'--base',base,'--head',nestedHead,'--mode','single','--stdout');assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/bounded-review/);assert.match(r.stdout,/inspected/);assert.doesNotMatch(r.stdout,/carrying selection\/evidence gaps, preserve that explicit gap and return unavailable/)});
check('large captured range does not lose source to redundant diffstat argv',()=>{
 // Enough real long Git paths to exceed this host's argument limit. Selection must
 // ask Git for the whole range directly when no path has omission authority.
 const prefix=Array.from({length:4},(_,i)=>('segment'+i+'-').padEnd(180,'x')).join('/');
 const limit=Number(exec('getconf',['ARG_MAX'])),count=Math.ceil(limit/(prefix.length+12))+80;
 console.log('large range fixture: '+JSON.stringify({argMax:limit,files:count,pathPrefixBytes:prefix.length}));
 for(let i=0;i<count;i++)write(path.join(repo,prefix,'file-'+i+'.txt'),'captured source '+i+'\n');
 const wide=selection(commit());assert.equal(wide.status,3,wide.stderr);assert.equal(wide.data.sourceAvailable,true,wide.data.gaps.at(-1));assert.equal(wide.data.omitted.length,0);assert(wide.data.changed.length>=count);assert(!wide.data.gaps.some(g=>g.includes('E2BIG')));
});
console.log(JSON.stringify({passed,failed,tmp,base,head:nestedHead,sourceHead:git('rev-parse','HEAD')}));if(!process.env.KEEP_FIXTURES&&!failed)fs.rmSync(tmp,{recursive:true,force:true});process.exitCode=failed?1:0;
