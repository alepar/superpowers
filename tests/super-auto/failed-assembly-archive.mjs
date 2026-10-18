// A genuine failed assembly may be preserved without granting omission or readiness.
// Removing the bounded archive contract must fail fresh invocation selection here.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=process.cwd(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'failed-assembly-archive-')),repo=path.join(tmp,'repo');
const runRel='docs/run/run.md',run=path.join(repo,runRel),ws=path.join(repo,'.superpowers/sdd/fixture-plan'),ledger=path.join(ws,'progress.md');
const dt=path.join(root,'skills/super-code/scripts/dispatch-text'),rs=path.join(root,'skills/super-auto/scripts/report-status');
const write=(p,t)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t)};
const git=(...a)=>cp.execFileSync('git',['-c','maintenance.auto=false','-c','gc.auto=0',...a],{cwd:repo,encoding:'utf8'}).trim();
const cli=(...a)=>cp.spawnSync('bash',[dt,'--ledger',ledger,...a],{cwd:repo,encoding:'utf8'});
const hash=b=>createHash('sha256').update(b).digest('hex');
const record=r=>'- review-collection · '+JSON.stringify(r)+'\n';
const intent=id=>({invocationId:id,workspace:ws,reviewPath:path.join(ws,'final-review-'+id+'.md'),review:'pending',required:[],settled:false});
const launch=id=>write(ledger,'Launch: args '+JSON.stringify({epicId:'fixture',integrationBranch:'fixture',integrationWorktree:repo,invocationId:id,reviewRunFile:runRel})+'\n');
let seq=0,passed=0,failed=0;
const commit=()=>{git('add','.');git('commit','--allow-empty','-qm','snapshot '+seq++);return git('rev-parse','HEAD')};
const select=(base,head,out=path.join(ws,'select-'+seq++))=>{const r=cli('review-inputs','--base',base,'--head',head,'--out-dir',out,'--review-run-file',runRel);return {...r,out,data:JSON.parse(fs.readFileSync(path.join(out,'review-inputs.json')))}};
const check=(name,fn)=>{try{fn();passed++;console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+': '+e.stack)}};
fs.mkdirSync(repo,{recursive:true});git('init','-q');git('config','user.email','fixture@example.test');git('config','user.name','Fixture');
write(path.join(repo,'.gitignore'),'.superpowers/\n');write(run,'phase: code\napprovals:\n');write(path.join(repo,'product.txt'),'before\n');const base=commit();
// Failed source is an authentic captured pending intent with no current run authority.
write(run,'phase: code\napprovals:\n'+record(intent('bounded')));write(path.join(repo,'product.txt'),'after\n');const sourceHead=commit();
write(ledger,'Launch: args '+JSON.stringify({epicId:'fixture',integrationBranch:'fixture',integrationWorktree:repo,invocationId:'bounded'})+'\n');
assert.equal(cli('bind-review-source','--base',base,'--head',sourceHead).status,0);
const partial=select(base,sourceHead,path.join(ws,'assembled/final-review-bounded-final'));
assert.equal(partial.status,3);assert.equal(partial.data.sourceAvailable,true);assert.equal(partial.data.omitted.length,0);
const draft='## Verdict\nready\n## Must fix before landing\n- product.txt:1 — retained finding\n## Untested scope\nnone\n';
write(path.join(partial.out,'bounded-draft.md'),draft);write(path.join(partial.out,'bounded-coverage.json'),JSON.stringify({inspected:[{path:'product.txt',hunks:['@@ -1 +1 @@']}]}));
const report=intent('bounded').reviewPath;
const bounded=cli('bounded-review','--base',base,'--head',sourceHead,'--selection',path.join(partial.out,'review-inputs.json'),'--draft',path.join(partial.out,'bounded-draft.md'),'--coverage',path.join(partial.out,'bounded-coverage.json'),'--out',report);
assert.equal(bounded.status,0,bounded.stderr);const verdict=JSON.parse(bounded.stdout).verdict,reportBytes=fs.readFileSync(report);
const collected=cp.spawnSync('bash',[rs,'--collect',run,'--invocation','bounded','--workspace',ws,'--review',report,'--verdict',verdict],{cwd:repo,encoding:'utf8'});
assert.equal(collected.status,0,collected.stdout+collected.stderr);
const collectionText=fs.readFileSync(run,'utf8'),collection=JSON.parse(collectionText.split('\n').filter(l=>l.startsWith('- review-collection · ')).at(-1).split(' · ')[1]);
assert.equal(collection.files.length,6);assert(!collection.files.some(f=>f.path.endsWith('/digest.md')));
const archiveRel='docs/run/reviews/bounded/',archive=path.join(repo,archiveRel);
fs.appendFileSync(run,record(intent('fresh')));launch('fresh');const freshText=fs.readFileSync(run,'utf8'),freshHead=commit();
check('fresh invocation selects every preserved partial sidecar and keeps forced verdict',()=>{
 const s=select(base,freshHead);assert.equal(s.status,0,s.data.gaps.join('\n'));assert.equal(s.data.wholeRangeReady,false);assert.deepEqual(s.data.omitted,[]);
 for(const f of collection.files){assert(s.data.changed.includes(archiveRel+f.path),f.path+' remains selected');assert(s.data.slices.some(v=>v.path===archiveRel+f.path));assert.equal(hash(fs.readFileSync(path.join(archive,f.path))),f.sha256)}
 assert.deepEqual(fs.readFileSync(path.join(archive,'final-review-bounded.md')),reportBytes);assert.equal(collection.review,verdict);
});
// Execute the actual prompt builders' REVIEW_INPUTS commands after collection.
// Final review has a fresh pending intent; roast-code captures settled history and
// a later product change, since it has no current-final-review intent exemption.
for(const consumer of ['final-review','roast-code'])for(const mode of ['ordinary','Workflow'])check(mode+' '+consumer+' builder selects retained bounded archive without omission',()=>{
 try{
  let head=freshHead;
  if(consumer==='roast-code'){
   write(run,collectionText);write(path.join(repo,'product.txt'),'new code after bounded review\n');head=commit();
  }
  const instance='post-bounded-'+mode.toLowerCase();let prompt;
  if(mode==='ordinary'){
   const p=cli('assemble','--consumer',consumer,'--instance',instance,'--base',base,'--head',head,'--stdout');assert.equal(p.status,0,p.stderr);prompt=p.stdout;
  }else{
   const script=fs.readFileSync(path.join(root,'skills/super-code/coordinator.js'),'utf8'),cut=script.search(/^\/\/ Resume from the ledger, read once before the round loop:/m);assert(cut>0,'real Workflow operational boundary');
   const body=(script.slice(0,cut)+'return assemblePrompt(args.builderConsumer,args.builderInstance,{base:args.reviewBase,head:args.reviewHead});\n'+script.slice(cut)).replace(/^export const meta/m,'const meta');
   const file=path.join(tmp,'workflow-'+consumer+'.cjs');
   write(file,'const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;new AsyncFunction("args","log",'+JSON.stringify(body)+')('+JSON.stringify({epicId:'fixture',integrationBranch:'fixture',integrationWorktree:repo,invocationId:'fresh',reviewRunFile:runRel,skillsRoot:path.join(root,'skills'),config:{},reviewBase:base,reviewHead:head,builderConsumer:consumer,builderInstance:instance})+',()=>{}).then(t=>process.stdout.write(t));');
   prompt=cp.execFileSync('node',[file],{encoding:'utf8'});
  }
  const command=prompt.match(/\[REVIEW_INPUTS\] = (.*?); \[LEDGER\]/);assert(command,'actual builder selection command');
  const selected=cp.spawnSync('sh',['-c',command[1]],{cwd:repo,encoding:'utf8'});assert.equal(selected.status,0,selected.stdout+selected.stderr);
  const receipt=JSON.parse(selected.stdout),data=JSON.parse(fs.readFileSync(path.join(receipt.dir,'review-inputs.json')));
  assert.deepEqual(data.gaps,[]);assert.deepEqual(data.omitted,[]);assert.equal(data.wholeRangeReady,false);
  for(const f of collection.files){assert(data.changed.includes(archiveRel+f.path));assert(data.slices.some(s=>s.path===archiveRel+f.path));assert.equal(hash(fs.readFileSync(path.join(archive,f.path))),f.sha256)}
  assert.deepEqual(fs.readFileSync(path.join(archive,'final-review-bounded.md')),reportBytes);
  console.log('builder receipt '+JSON.stringify({mode,consumer,base,head,exit:selected.status,selected:receipt.selected,omitted:data.omitted.length,wholeRangeReady:data.wholeRangeReady}));
 }finally{write(run,freshText);write(path.join(repo,'product.txt'),'after\n')}
});

// Exercise the same contract independently of selector history, using retained real
// archived bytes and Git objects. Re-signing a forged manifest must not authorize it.
const {validateFailedAssembly,TYPE}=await import('../../skills/super-code/scripts/assembly-archive.cjs');
const {collectionHistory}=await import('../../skills/super-auto/scripts/collection-records.cjs');
const original=new Map(collection.files.map(f=>[f.path,fs.readFileSync(path.join(archive,f.path))]));
const assembled='assembled/final-review-bounded-final/',reportRel='final-review-bounded.md';
const capturedSource=(b,h)=>{assert.equal(git('rev-parse',b+'^{commit}'),b);assert.equal(git('rev-parse',h+'^{commit}'),h);return {changed:cp.execFileSync('git',['diff','--no-renames','--name-only','-z',b+'..'+h],{cwd:repo,encoding:'utf8'}).split('\0').filter(Boolean),diff:p=>cp.execFileSync('git',['diff','--no-renames',b+'..'+h,'--',p],{cwd:repo,encoding:'utf8'})}};
const fixture=()=>({r:structuredClone(collection),bytes:new Map([...original].map(([p,b])=>[p,Buffer.from(b)]))});
const evidenceOf=f=>JSON.parse(f.bytes.get(reportRel).toString().match(/^Coverage record: (.+)$/m)[1]);
const evidence=(f,edit)=>{const e=evidenceOf(f);edit(e);f.bytes.set(reportRel,Buffer.from(f.bytes.get(reportRel).toString().replace(/^Coverage record: .+$/m,'Coverage record: '+JSON.stringify(e))))};
const json=(f,name,edit)=>{const p=assembled+name,obj=JSON.parse(f.bytes.get(p));edit(obj);f.bytes.set(p,Buffer.from(JSON.stringify(obj)))};
const resign=f=>{f.r.files=[...f.bytes].map(([p,b])=>({path:p,sha256:hash(b)}))};
const bindSidecars=f=>evidence(f,e=>{for(const [key,name]of Object.entries({selection:'review-inputs.json',draft:'bounded-draft.md',coverage:'bounded-coverage.json'}))e[key+'Sha256']=hash(f.bytes.get(assembled+name))});
const validate=f=>validateFailedAssembly({record:f.r,read:p=>{assert(f.bytes.has(p),'manifest bytes exist');return f.bytes.get(p)},capturedSource});
check('producer marks authenticated failed bounded preservation',()=>assert.equal(collection.assemblyArchive,TYPE));
check('strict legacy interpretation accepts identical untyped archived bytes',()=>{const f=fixture();delete f.r.assemblyArchive;assert.equal(validate(f).kind,TYPE)});
check('optional coverage metadata accepts honest identity and source',()=>{const f=fixture();json(f,'bounded-coverage.json',v=>Object.assign(v,{version:1,invocationId:'bounded',base,head:sourceHead,wholeRangeReady:false,remaining:[],allOriginalGaps:partial.data.gaps,testsExecuted:['fixture'],note:'retained'}));bindSidecars(f);resign(f);assert.equal(validate(f).kind,TYPE)});
const forgeries=[
 ['forged type',f=>f.r.assemblyArchive='successful'],
 ['wrong saved hash',f=>f.r.files[0].sha256='0'.repeat(64),false],
 ['missing coverage',f=>f.bytes.delete(assembled+'bounded-coverage.json')],
 ['missing required plan',f=>f.r.required=['plan.md']],
 ['wrong workspace',f=>f.r.workspace+='/foreign'],
 ['wrong invocation',f=>f.r.invocationId='foreign'],
 ['changed verdict',f=>f.r.review='ready'],
 ['foreign evidence path',f=>evidence(f,e=>e.coverage='/foreign/bounded-coverage.json')],
 ['forged embedded hash',f=>evidence(f,e=>e.draftSha256='0'.repeat(64))],
 ['changed report finding',f=>f.bytes.set(reportRel,Buffer.from(f.bytes.get(reportRel).toString().replace('retained finding','forged finding')))],
 ['changed draft finding',f=>{f.bytes.set(assembled+'bounded-draft.md',Buffer.from(draft.replace('retained finding','hidden finding')));bindSidecars(f)}],
 ['invalid strict draft',f=>{f.bytes.set(assembled+'bounded-draft.md',Buffer.from(draft.replace('- product.txt','product.txt')));bindSidecars(f)}],
 ['changed captured source',f=>{json(f,'review-inputs.json',v=>v.head=base);evidence(f,e=>e.head=base);bindSidecars(f)}],
 ['incomplete captured inventory',f=>{json(f,'review-inputs.json',v=>v.changed=['product.txt']);evidence(f,e=>{e.changed=['product.txt'];e.unreviewedPaths=[]});bindSidecars(f)}],
 ['source unavailable',f=>{json(f,'review-inputs.json',v=>v.sourceAvailable=false);bindSidecars(f)}],
 ['selection readiness',f=>{json(f,'review-inputs.json',v=>v.wholeRangeReady=true);bindSidecars(f)}],
 ['claimed omission',f=>{json(f,'review-inputs.json',v=>v.omitted=[{path:'product.txt'}]);bindSidecars(f)}],
 ['no original gaps',f=>{json(f,'review-inputs.json',v=>v.gaps=[]);evidence(f,e=>e.gaps=[]);bindSidecars(f)}],
 ['invented hunk',f=>{json(f,'bounded-coverage.json',v=>v.inspected[0].hunks=['@@ -99 +99 @@']);evidence(f,e=>e.inspected[0].hunks=['@@ -99 +99 @@']);bindSidecars(f)}],
 ['false unreviewed complement',f=>evidence(f,e=>e.unreviewedPaths=[])],
 ['changed original gaps',f=>evidence(f,e=>e.gaps=['different gap'])],
 ['coverage invocation mismatch',f=>{json(f,'bounded-coverage.json',v=>v.invocationId='foreign');bindSidecars(f)}],
 ['coverage source mismatch',f=>{json(f,'bounded-coverage.json',v=>v.head=base);bindSidecars(f)}],
 ['coverage readiness',f=>{json(f,'bounded-coverage.json',v=>v.wholeRangeReady=true);bindSidecars(f)}],
 ['successful digest claim',f=>f.bytes.set(assembled+'digest.md',Buffer.from('claimed success'))],
 ['split manifest claim',f=>f.bytes.set(assembled+'clusters.json',Buffer.from('{"clusters":[]}'))],
 ['split report claim',f=>f.bytes.set('final-review-bounded.cluster-1.md',Buffer.from(draft))],
 ['claimed selection slice',f=>{json(f,'review-inputs.json',v=>v.slices=[{path:'product.txt',slice:'slices/1.diff'}]);bindSidecars(f)}],
];
for(const [name,edit,rehash=true]of forgeries)check('contract rejects '+name,()=>{const f=fixture();edit(f);if(rehash)resign(f);assert.throws(()=>validate(f))});
// Selector integration: replace every historical manifest hash so semantic forgery
// cannot pass merely because an older saved hash catches it first.
const install=(f,legacy=false)=>{
 for(const p of original.keys())if(!f.bytes.has(p))fs.unlinkSync(path.join(archive,p));
 for(const [p,b]of f.bytes)write(path.join(archive,p),b);
 write(run,freshText.split('\n').map(line=>{if(!line.startsWith('- review-collection · '))return line;const r=JSON.parse(line.split(' · ')[1]);if(r.invocationId!=='bounded')return line;if(r.files)r.files=f.r.files;if(r.files&&f.r.assemblyArchive)r.assemblyArchive=f.r.assemblyArchive;if(legacy)delete r.assemblyArchive;return record(r).trimEnd()}).join('\n'));
};
const restore=()=>{fs.rmSync(archive,{recursive:true,force:true});for(const [p,b]of original)write(path.join(archive,p),b);write(run,freshText)};
const unavailable=s=>{assert.equal(s.status,3,s.stdout+s.stderr);assert.deepEqual(s.data.omitted,[]);assert(s.data.gaps.length)};
check('selector authenticates original legacy record with no archive rewrite',()=>{install(fixture(),true);const s=select(base,commit());assert.equal(s.status,0,s.data.gaps.join('\n'));assert.deepEqual(s.data.omitted,[]);restore()});
for(const name of ['foreign evidence path','changed report finding','invented hunk','false unreviewed complement','coverage readiness'])check('selector rejects rehashed '+name,()=>{const f=fixture();forgeries.find(v=>v[0]===name)[1](f);resign(f);install(f);unavailable(select(base,commit()));restore()});
check('selector cannot lose a saved digest commitment behind latest bounded record',()=>{
 const previous={...collection,files:[...collection.files,{path:assembled+'digest.md',sha256:hash('previous digest')}]};
 write(run,freshText.replace(record(collection),record(previous)+record(collection)));
 const s=select(base,commit());unavailable(s);assert(s.data.gaps.some(g=>g.includes('previously saved claim lost')));restore();
});
check('collector cannot hide an earlier saved digest behind its latest record',()=>{
 const prior={...collection,files:[...collection.files,{path:assembled+'digest.md',sha256:hash('previous digest')}]};
 write(run,collectionText.replace(record(collection),record(prior)+record(collection)));
 const r=cp.spawnSync('bash',[rs,'--collect',run],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,3,r.stdout+r.stderr);assert.match(r.stderr,/saved claim|collection record/);restore();
});
check('previous bounded sidecar deletion stays a gap even if record is removed',()=>{
 fs.rmSync(archive,{recursive:true});write(run,'phase: code\napprovals:\n'+record(intent('fresh')));unavailable(select(freshHead,commit()));restore();
});
check('collector rejects a rehashed invented-hunk bundle before declaring preservation',()=>{
 const f=fixture();forgeries.find(v=>v[0]==='invented hunk')[1](f);resign(f);
 for(const [p,b]of f.bytes)write(path.join(ws,p),b);
 const forgedRun=path.join(repo,'producer/run.md');write(forgedRun,'phase: code\napprovals:\n'+record(intent('bounded')));
 const r=cp.spawnSync('bash',[rs,'--collect',forgedRun,'--invocation','bounded','--workspace',ws,'--review',report,'--verdict',verdict],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,3,r.stdout+r.stderr);assert.match(r.stderr,/inspected hunk absent/);
 for(const [p,b]of original)write(path.join(ws,p),b);
});

// Existing successful admission keeps its digest and split completeness gates.
check('collector cannot replace a deleted saved sidecar from changed workspace bytes',()=>{
 restore();write(run,collectionText);
 const relative=assembled+'diffstat.txt';fs.unlinkSync(path.join(archive,relative));write(path.join(ws,relative),'changed source bytes');
 const r=cp.spawnSync('bash',[rs,'--collect',run],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,3,r.stdout+r.stderr);assert(!fs.existsSync(path.join(archive,relative)),'changed source must not replace saved archive');
 write(path.join(ws,relative),original.get(relative));restore();
});
check('collector rejects a typed settled-null archive while preserving legitimate untyped no-work results',()=>{
 const dir=path.join(repo,'typed-null'),workspace=path.join(dir,'gone-workspace');
 const empty={invocationId:'typed-null',workspace,reviewPath:null,review:'no work landed',required:[],settled:true};
 for(const typed of [false,true]){
  const file=path.join(dir,typed?'typed/run.md':'untyped/run.md');write(file,'phase: code\napprovals:\n'+record({...empty,...(typed?{assemblyArchive:TYPE}:{})}));
  const r=cp.spawnSync('bash',[rs,'--collect',file],{cwd:repo,encoding:'utf8'});
  const history=collectionHistory(fs.readFileSync(file,'utf8')),latest=history.latest.get('typed-null');
  console.log('typed-null receipt '+JSON.stringify({typed,exit:r.status,complete:latest.complete,stderr:r.stderr}));
  if(typed)fs.rmSync(dir,{recursive:true});
  assert.equal(r.status,typed?3:0,r.stdout+r.stderr);assert.equal(latest.complete,!typed);assert.equal(history.errors,0);
  if(typed)assert(latest.gaps.some(g=>g.includes('invalid failed assembly archive')));
 }
});
for(const damage of ['missing','corrupt'])check('collector retains saved commitments through '+damage+' required-file recovery',()=>{
 const dir=path.join(tmp,'retry-'+damage),workspace=path.join(dir,'workspace'),retryRun=path.join(dir,'run.md');
 const review=path.join(workspace,'final-review-retry.md'),required=path.join(workspace,'required.txt'),saved=path.join(dir,'reviews/retry/required.txt');
 const requiredBytes='original required bytes\n',extra='final-review-retry.md.diff';
 write(retryRun,'phase: code\napprovals:\n');write(review,draft);write(required,requiredBytes);
 const collect=(...args)=>cp.spawnSync('bash',[rs,'--collect',retryRun,...args],{cwd:repo,encoding:'utf8'});
 const snapshots=()=>fs.readFileSync(retryRun,'utf8').split('\n').filter(l=>l.startsWith('- review-collection · ')).map(l=>JSON.parse(l.split(' · ')[1]));
 const first=collect('--invocation','retry','--workspace',workspace,'--review',review,'--verdict','ready','--required','required.txt');
 assert.equal(first.status,0,first.stdout+first.stderr);const commitments=snapshots().at(-1).files;
 if(damage==='missing')fs.unlinkSync(saved);else write(saved,'corrupt archived bytes\n');
 write(required,'changed source bytes\n');write(path.join(workspace,extra),'new retained diff\n');
 const damaged=collect(),incomplete=snapshots().at(-1);
 write(required,requiredBytes);
 const sourceRestored=collect();
 if(damage==='corrupt')write(saved,requiredBytes);
 const repaired=damage==='missing'?sourceRestored:collect(),repeated=collect();
 const history=collectionHistory(fs.readFileSync(retryRun,'utf8'));
 console.log('retry receipt '+JSON.stringify({damage,exits:[first.status,damaged.status,sourceRestored.status,repaired.status,repeated.status],historyErrors:history.errors,stderr:[damaged.stderr,sourceRestored.stderr,repaired.stderr,repeated.stderr]}));
 assert.equal(damaged.status,3,damaged.stdout+damaged.stderr);
 assert.equal(sourceRestored.status,damage==='missing'?0:3,sourceRestored.stdout+sourceRestored.stderr);
 assert.equal(repaired.status,0,repaired.stdout+repaired.stderr);assert.equal(repeated.status,0,repeated.stdout+repeated.stderr);
 assert.equal(history.errors,0,'collector must only append valid monotonic history');
 for(const snapshot of [incomplete,history.latest.get('retry')]){
  for(const f of commitments)assert.deepEqual(snapshot.files.find(v=>v.path===f.path),f,'saved hash commitment survives retry');
  assert(snapshot.files.some(f=>f.path===extra&&f.sha256===hash('new retained diff\n')),'validated new files merge with saved commitments');
 }
 assert.equal(incomplete.complete,false);assert(incomplete.gaps.some(g=>g.includes('required.txt')));
 assert.equal(history.latest.get('retry').complete,true);assert.equal(hash(fs.readFileSync(saved)),hash(requiredBytes));
});
for(const damage of ['missing','corrupt'])check('previously complete required archive recovers '+damage+' bytes after source removal',()=>{
 const dir=path.join(tmp,'archive-only-'+damage),workspace=path.join(dir,'workspace'),retryRun=path.join(dir,'run.md');
 const review=path.join(workspace,'final-review-retry.md'),saved=path.join(dir,'reviews/retry/required.txt'),bytes='original archive-only required bytes\n';
 write(retryRun,'phase: code\napprovals:\n');write(review,draft);write(path.join(workspace,'required.txt'),bytes);
 const collect=(...args)=>cp.spawnSync('bash',[rs,'--collect',retryRun,...args],{cwd:repo,encoding:'utf8'});
 const first=collect('--invocation','retry','--workspace',workspace,'--review',review,'--verdict','ready','--required','required.txt');assert.equal(first.status,0,first.stdout+first.stderr);
 const originalText=fs.readFileSync(retryRun,'utf8'),commitments=collectionHistory(originalText).latest.get('retry').files;
 fs.rmSync(workspace,{recursive:true});const archiveOnly=collect();
 if(damage==='missing')fs.unlinkSync(saved);else write(saved,'corrupt bytes\n');
 const damaged=collect();write(saved,'wrong restoration\n');const wrong=collect();
 write(saved,bytes);const repaired=collect(),repeated=collect(),text=fs.readFileSync(retryRun,'utf8'),history=collectionHistory(text);
 console.log('archive-only receipt '+JSON.stringify({kind:'required',damage,exits:[first.status,archiveOnly.status,damaged.status,wrong.status,repaired.status,repeated.status],historyErrors:history.errors,stderr:[repaired.stderr,repeated.stderr]}));
 assert.deepEqual([first.status,archiveOnly.status,damaged.status,wrong.status,repaired.status,repeated.status],[0,0,3,3,0,0]);
 assert.equal(history.errors,0);assert(text.startsWith(originalText.trimEnd()),'original history stays unchanged');
 assert.deepEqual(history.latest.get('retry').files,commitments);assert.equal(hash(fs.readFileSync(saved)),hash(bytes));assert(!fs.existsSync(workspace));
});
for(const damage of ['missing','corrupt'])check('previously complete bounded archive recovers '+damage+' bytes after source removal',()=>{
 restore();write(run,collectionText);const originalText=fs.readFileSync(run,'utf8'),backup=path.join(tmp,'removed-bounded-workspace-'+damage),relative=assembled+'diffstat.txt',saved=path.join(archive,relative);
 const collect=()=>cp.spawnSync('bash',[rs,'--collect',run],{cwd:repo,encoding:'utf8'});
 fs.renameSync(ws,backup);
 try{
  const archiveOnly=collect();if(damage==='missing')fs.unlinkSync(saved);else write(saved,'corrupt bounded bytes\n');
  const damaged=collect();write(saved,'wrong restoration\n');const wrong=collect();
  write(saved,original.get(relative));const repaired=collect(),repeated=collect(),text=fs.readFileSync(run,'utf8'),history=collectionHistory(text),latest=history.latest.get('bounded');
  console.log('archive-only receipt '+JSON.stringify({kind:'bounded',damage,exits:[archiveOnly.status,damaged.status,wrong.status,repaired.status,repeated.status],historyErrors:history.errors,stderr:[repaired.stderr,repeated.stderr]}));
  assert.deepEqual([archiveOnly.status,damaged.status,wrong.status,repaired.status,repeated.status],[0,3,3,0,0]);
  assert.equal(history.errors,0);assert(text.startsWith(originalText.trimEnd()),'original bounded history stays unchanged');
  assert.deepEqual(latest.files,collection.files);assert.equal(latest.assemblyArchive,TYPE);assert.equal(latest.review,verdict);assert.equal(latest.complete,true);
  for(const f of collection.files)assert.equal(hash(fs.readFileSync(path.join(archive,f.path))),f.sha256);assert(!fs.existsSync(ws));
 }finally{fs.renameSync(backup,ws);restore()}
});
check('archive-only collection cannot promote a never-completed manifest',()=>{
 const dir=path.join(tmp,'never-completed'),workspace=path.join(dir,'workspace'),retryRun=path.join(dir,'run.md'),review=path.join(workspace,'final-review-retry.md');
 write(retryRun,'phase: code\napprovals:\n');write(review,'unverified malformed report\n');write(path.join(workspace,'required.txt'),'retained required bytes\n');
 const collect=(...args)=>cp.spawnSync('bash',[rs,'--collect',retryRun,...args],{cwd:repo,encoding:'utf8'});
 const first=collect('--invocation','retry','--workspace',workspace,'--review',review,'--verdict','ready','--required','required.txt');assert.equal(first.status,3);
 const before=collectionHistory(fs.readFileSync(retryRun,'utf8'));assert.equal(before.latest.get('retry').files.length,2,'saved hashes alone must not establish completion');
 fs.rmSync(workspace,{recursive:true});const retry=collect(),repeated=collect(),history=collectionHistory(fs.readFileSync(retryRun,'utf8'));
 assert.deepEqual([retry.status,repeated.status],[3,3]);assert.equal(history.errors,0);assert.equal(history.latest.get('retry').complete,false);
 assert.deepEqual(history.latest.get('retry').files,before.latest.get('retry').files);
});
check('archive-only completion proof cannot authorize files added only during an incomplete retry',()=>{
 const dir=path.join(tmp,'never-completed-addition'),workspace=path.join(dir,'workspace'),retryRun=path.join(dir,'run.md'),review=path.join(workspace,'final-review-retry.md'),saved=path.join(dir,'reviews/retry/required.txt');
 write(retryRun,'phase: code\napprovals:\n');write(review,draft);write(path.join(workspace,'required.txt'),'original required bytes\n');
 const collect=(...args)=>cp.spawnSync('bash',[rs,'--collect',retryRun,...args],{cwd:repo,encoding:'utf8'});
 const first=collect('--invocation','retry','--workspace',workspace,'--review',review,'--verdict','ready','--required','required.txt');assert.equal(first.status,0);
 write(saved,'corrupt required bytes\n');write(path.join(workspace,'final-review-retry.md.diff'),'only saved during failed retry\n');
 const damaged=collect();assert.equal(damaged.status,3);const before=collectionHistory(fs.readFileSync(retryRun,'utf8')).latest.get('retry');assert.equal(before.files.length,3);
 fs.rmSync(workspace,{recursive:true});write(saved,'original required bytes\n');const retry=collect(),repeated=collect(),history=collectionHistory(fs.readFileSync(retryRun,'utf8'));
 assert.deepEqual([retry.status,repeated.status],[3,3]);assert.equal(history.errors,0);assert.equal(history.latest.get('retry').complete,false);assert.deepEqual(history.latest.get('retry').files,before.files);
 assert.match(retry.stderr,/bundle unavailable: final-review-retry.md.diff/);
});
check('archive-only completion proof cannot authorize a changed result identity',()=>{
 const dir=path.join(tmp,'changed-completed-result'),workspace=path.join(dir,'workspace'),retryRun=path.join(dir,'run.md'),review=path.join(workspace,'final-review-retry.md');
 write(retryRun,'phase: code\napprovals:\n');write(review,draft);write(path.join(workspace,'required.txt'),'original required bytes\n');
 const collect=(...args)=>cp.spawnSync('bash',[rs,'--collect',retryRun,...args],{cwd:repo,encoding:'utf8'});
 const first=collect('--invocation','retry','--workspace',workspace,'--review',review,'--verdict','ready','--required','required.txt');assert.equal(first.status,0);
 const originalText=fs.readFileSync(retryRun,'utf8'),completed=collectionHistory(originalText).latest.get('retry');
 fs.rmSync(workspace,{recursive:true});fs.appendFileSync(retryRun,record({...completed,review:'not ready',complete:false,gaps:['retained incomplete result']}));
 const retry=collect(),repeated=collect(),history=collectionHistory(fs.readFileSync(retryRun,'utf8'));
 assert.deepEqual([retry.status,repeated.status],[3,3]);assert.equal(history.errors,0);assert.equal(history.latest.get('retry').complete,false);assert.deepEqual(history.latest.get('retry').files,completed.files);
});
check('successful assembly retains digest and split completeness requirements',()=>{
 fs.rmSync(path.join(repo,'producer'),{recursive:true});restore();
 write(run,'phase: code\napprovals:\n'+record(intent('success')));launch('success');const h=commit();
 const selected=select(base,h,path.join(ws,'assembled/final-review-success-final'));assert.equal(selected.status,0,selected.data.gaps.join('\n'));
 write(path.join(selected.out,'digest.md'),'actual successful fixture assembly\n');
 write(path.join(selected.out,'clusters.json'),JSON.stringify({clusters:[{name:'fixture',slices:selected.data.slices.map(s=>s.slice)}]}));
 write(intent('success').reviewPath,draft);write(path.join(ws,'final-review-success.cluster-1.md'),draft);
 const result=cp.spawnSync('bash',[rs,'--collect',run,'--invocation','success','--workspace',ws,'--review',intent('success').reviewPath,'--verdict','ready'],{cwd:repo,encoding:'utf8'});assert.equal(result.status,0,result.stdout+result.stderr);
 fs.appendFileSync(run,record(intent('next')));launch('next');const complete=fs.readFileSync(run,'utf8'),completeHead=commit();
 const admitted=select(base,completeHead);assert.equal(admitted.status,0,admitted.data.gaps.join('\n'));assert(admitted.data.omitted.some(p=>p.path.endsWith('/digest.md')));
 const successArchive=path.join(repo,'docs/run/reviews/success'),prefix='assembled/final-review-success-final/';
 for(const [relative,expected]of [[prefix+'digest.md','incomplete assembled bundle: digest.md'],[prefix+'clusters.json','incomplete split bundle'],[prefix+selected.data.slices[0].slice,'incomplete split bundle']]){
  const file=path.join(successArchive,relative),saved=fs.readFileSync(file);fs.unlinkSync(file);
  // Remove every saved commitment to isolate structural admission validation.
  write(run,complete.split('\n').map(line=>{if(!line.startsWith('- review-collection · '))return line;const r=JSON.parse(line.split(' · ')[1]);if(r.invocationId==='success'&&r.files)r.files=r.files.filter(f=>f.path!==relative);return record(r).trimEnd()}).join('\n'));
  const s=select(base,commit());unavailable(s);assert(s.data.gaps.some(g=>g.includes(expected)),s.data.gaps.join('\n'));
  write(file,saved);write(run,complete);
 }
 const cluster=path.join(successArchive,'final-review-success.cluster-1.md'),clusterBytes=fs.readFileSync(cluster);fs.unlinkSync(cluster);unavailable(select(base,commit()));write(cluster,clusterBytes);
 const digest=path.join(successArchive,prefix+'digest.md'),saved=fs.readFileSync(digest);write(digest,'corrupt digest');const s=select(base,commit());unavailable(s);assert(s.data.gaps.some(g=>g.includes('saved hash mismatch')));write(digest,saved);
});
console.log(JSON.stringify({passed,failed,tmp,base,sourceHead,freshHead}));process.exitCode=failed?1:0;
