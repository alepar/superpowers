#!/usr/bin/env bash
set -euo pipefail
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
T=$(mktemp -d "${TMPDIR:-/tmp}/generated-review-inputs.XXXXXX")
trap 'rm -rf "$T"' EXIT
node - "$ROOT" "$T" <<'JS'
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const [root,tmp]=process.argv.slice(2),repo=path.join(tmp,'repo'),work=path.join(tmp,'work'),run='docs/run/run.md',ledger=path.join(tmp,'progress.md');
fs.mkdirSync(repo,{recursive:true});fs.mkdirSync(work);
const env={...process.env,HOME:path.join(tmp,'home'),XDG_CONFIG_HOME:path.join(tmp,'config'),XDG_CACHE_HOME:path.join(tmp,'cache'),XDG_DATA_HOME:path.join(tmp,'data'),XDG_STATE_HOME:path.join(tmp,'state'),GIT_CONFIG_NOSYSTEM:'1'};
for(const k of ['HOME','XDG_CONFIG_HOME','XDG_CACHE_HOME','XDG_DATA_HOME','XDG_STATE_HOME'])fs.mkdirSync(env[k],{recursive:true});
const exec=(cmd,args,cwd=repo)=>cp.execFileSync(cmd,args,{cwd,env,encoding:'utf8',stdio:['ignore','pipe','pipe']});
const git=(...a)=>exec('git',a).trim();
const write=(p,t)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t)};
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rs=path.join(root,'skills/super-auto/scripts/report-status'),dt=path.join(root,'skills/super-code/scripts/dispatch-text');
write(ledger,'Launch: args '+JSON.stringify({epicId:'fixture',integrationBranch:'fixture',integrationWorktree:repo,invocationId:'fixture'})+'\n');
git('init','-q');git('config','user.email','fixture@example.test');git('config','user.name','Fixture');
write(path.join(repo,run),'flags: skipPlanRoast false, skipCodeRoast false\nphase: code\napprovals:\n');
write(path.join(repo,'product.txt'),'before\n');git('add','.');git('commit','-qm','base');const base=git('rev-parse','HEAD');
const ordinary=['reviews/user-evidence.txt','reviews/space name.txt','reviews/line\nbreak.txt','reviews/[wildcard]*.txt'];
write(path.join(repo,'product.txt'),'after\n');for(const f of ordinary)write(path.join(repo,f),'ordinary product evidence '+JSON.stringify(f)+'\n');
git('add','.');git('commit','-qm','product change');
const saved=new Map(),stats=[];
const payload=f=>/\/assembled\/final-review-[^/]+-final\//.test(f)||/\/final-review-[^/]+\.md\.diff$/.test(f);
function assemble(head,out,from=base,unavailable=false){
 if(process.env.GENERATED_REVIEW_INPUTS_BASELINE==='1'){
  // Retain the original pre-fix assembler recipe for the historical RED reproduction.
  fs.mkdirSync(path.join(out,'slices'),{recursive:true});
  const changed=exec('git',['diff','--name-only','-z',from+'..'+head]).split('\0').filter(Boolean);
  write(path.join(out,'diffstat.txt'),exec('git',['diff','--stat',from+'..'+head]));
  for(const f of changed)write(path.join(out,'slices',f.replaceAll('/','__')+'.diff'),exec('git',['--literal-pathspecs','diff',from+'..'+head,'--',f]));
  return {base:from,head,changed,archives:[]};
 }
 const args=[dt,'review-inputs','--ledger',ledger,'--base',from,'--head',head,'--out-dir',out];
 const r=cp.spawnSync('bash',args,{cwd:repo,env,encoding:'utf8'});
 assert.equal(r.status,unavailable?3:0,r.stderr+'\n'+r.stdout);
 const result=JSON.parse(fs.readFileSync(path.join(out,'review-inputs.json'),'utf8'));
 if(unavailable){assert(result.gaps.length>0,'invalid provenance exposes its gap');assert.equal(result.omitted.length,0,'a refusal supplies no omission authority');assert.match(fs.readFileSync(path.join(out,'generated-input-provenance.md'),'utf8'),/unavailable/)}
 return result;
}
for(let n=1;n<=6;n++){
 if(n===6){write(path.join(repo,'new-product.txt'),'new product edit after repeated collection\n');git('add','.');git('commit','-qm','new product change')}
 const id='inv-'+n,head=git('rev-parse','HEAD'),workspace=path.join(work,id),out=path.join(workspace,'assembled','final-review-'+id+'-final');
 fs.mkdirSync(path.join(out,'slices'),{recursive:true}); // Match the real assembler's empty slices initialization.
 const input=assemble(head,out),slices=fs.readdirSync(path.join(out,'slices'));
 const texts=slices.map(f=>fs.readFileSync(path.join(out,'slices',f),'utf8')),bytes=texts.reduce((sum,t)=>sum+Buffer.byteLength(t),0);
 stats.push({invocation:id,files:input.changed.length,bytes,maxBasename:Math.max(...slices.map(f=>Buffer.byteLength(f)))});console.log(JSON.stringify(stats.at(-1)));
 assert.equal(input.base,base,'keep the original product base');assert.equal(input.head,head,'keep the captured head');
 assert(input.changed.includes('product.txt'),'original product range survives every re-entry');
 for(const f of ordinary)assert(input.changed.includes(f),'ordinary evidence, including unusual names, stays reviewed');
 if(n===6)assert(input.changed.includes('new-product.txt'),'a later product edit enters captured-range review');
 assert(!input.changed.some(payload),'prior generated payloads must not become fresh slices');
 assert.equal(texts.join('\n').split('+after\n').length-1,1,'original product hunk appears once, without recursive copies');
 assert(!texts.some(t=>/^\+diff --git .*\.diff/m.test(t)),'no generated diff copied inside a new slice');
 if(n>1){
  assert.equal(input.archives.length,n-1,'every prior invocation has explicit provenance');
  for(const a of input.archives){
   assert.equal(a.run,run);assert.equal(a.archive,'docs/run/reviews/'+a.invocationId);
   assert(a.files.some(f=>f.path==='final-review-'+a.invocationId+'.md'),'provenance locates original finding report');
   assert(a.files.some(f=>f.path.endsWith('.md.diff')),'direct input provenance stays discoverable');
   assert(input.changed.includes(a.archive+'/final-review-'+a.invocationId+'.md'),'historical findings remain ordinary reviewed content');
   for(const f of a.files)assert.equal(sha(path.join(repo,a.archive,f.path)),f.sha256,'historical hashes remain exact');
  }
  for(const o of input.omitted){assert(payload(o.path));assert(o.run&&o.invocationId&&o.sha256&&o.revision===head);assert.equal(sha(path.join(repo,o.path)),o.sha256)}
 }
 assert.deepEqual(input.slices?.map(s=>s.path)||input.changed,input.changed,'changed membership and slice coverage agree');
 write(path.join(out,'digest.md'),'fixture digest\n');
 if(input.slices)write(path.join(out,'clusters.json'),JSON.stringify({changed:input.changed,clusters:[{name:'fixture',files:input.changed,slices:input.slices.map(s=>s.slice)}]})+'\n');
 const review=path.join(workspace,'final-review-'+id+'.md');
 write(review,'# Final review\n## Verdict\nnot ready\n\n## Must-fix\n- [Must-fix] product.txt:1 — retained historical finding '+id+'\n\n## Should-fix\nnone\n\n## Untested scope\nnone\n');
 write(review+'.diff',input.changed.map(f=>exec('git',['--literal-pathspecs','diff',base+'..'+head,'--',f])).join(''));
 assert.match(exec('bash',[rs,'--collect',path.join(repo,run),'--invocation',id,'--workspace',workspace,'--review',review,'--verdict','not ready']),/collection: complete/);
 const records=fs.readFileSync(path.join(repo,run),'utf8').split('\n').filter(l=>l.startsWith('- review-collection · ')).map(l=>JSON.parse(l.split(' · ')[1]));
 const latest=records.filter(r=>r.invocationId===id).at(-1);assert.equal(latest.complete,true);
 const sources=fs.readFileSync(path.join(repo,run),'utf8').split('\n').filter(l=>l.startsWith('- finding-source · ')).map(l=>JSON.parse(l.split(' · ')[1]));
 assert(JSON.stringify(sources).includes('retained historical finding '+id),'collector retains complete historical finding text');
 for(const f of latest.files){const p=path.join(repo,'docs/run/reviews',id,f.path);saved.set(p,sha(p))}
 git('add','.');git('commit','-qm','collect '+id);
}
// Replay remains possible after producer cleanup; no historical archive is rewritten.
fs.rmSync(work,{recursive:true});assert.match(exec('bash',[rs,'--collect',path.join(repo,run)]),/collection: complete/);
for(const [p,h] of saved)assert.equal(sha(p),h,'collection/re-entry preserves every prior archive byte');
const captured=git('rev-parse','HEAD'),capturedOut=path.join(tmp,'captured');
write(path.join(repo,'advanced.txt'),'not captured\n');write(path.join(repo,run),'mutated checkout without provenance\n');
write(path.join(repo,'docs/run/reviews/untracked/assembled/input.diff'),'untracked archive\n');
const frozen=assemble(captured,capturedOut);
const partial=path.join(tmp,'partial');write(path.join(partial,'retain.txt'),'partial evidence\n');
const partialResult=cp.spawnSync('bash',[dt,'review-inputs','--ledger',ledger,'--base',base,'--head',captured,'--out-dir',partial],{cwd:repo,env,encoding:'utf8'});
assert.equal(partialResult.status,2);assert.equal(fs.readFileSync(path.join(partial,'retain.txt'),'utf8'),'partial evidence\n');
const invalid=cp.spawnSync('bash',[dt,'review-inputs','--ledger',ledger,'--base','f'.repeat(40),'--head',captured,'--out-dir',path.join(tmp,'invalid')],{cwd:repo,env,encoding:'utf8'});
assert.equal(invalid.status,2,'unknown commit objects are refused');
assert.equal(frozen.archives.length,6,'records come from captured Git, not mutated run.md');assert(!frozen.changed.includes('advanced.txt'));assert(!frozen.changed.some(f=>f.includes('/untracked/')));
// Adding ordinary content inside a recognized archive does not grant it an exemption.
git('restore',run);const unclaimed='docs/run/reviews/inv-1/assembled/final-review-inv-1-final/legitimate.txt';
write(path.join(repo,unclaimed),'legitimate new evidence\n');git('add',unclaimed,'advanced.txt');git('commit','-qm','advance checkout');
const advanced=git('rev-parse','HEAD');const selected=assemble(advanced,path.join(tmp,'advanced'));
assert(selected.changed.includes(unclaimed));assert(selected.changed.includes('advanced.txt'));
assert.deepEqual(assemble(captured,path.join(tmp,'frozen-again')),frozen,'advanced branch tip cannot change frozen selection');
const victim=[...saved.keys()].find(p=>p.endsWith('.md.diff')),victimRel=path.relative(repo,victim),original=fs.readFileSync(victim);
write(victim,'corrupted archive\n');git('add',victimRel);git('commit','-qm','corrupt claimed payload');
const bad=assemble(git('rev-parse','HEAD'),path.join(tmp,'corrupt'),base,true);assert(bad.changed.includes(victimRel));assert.match(bad.gaps.join('\n'),/hash|integrity/i);
fs.unlinkSync(victim);git('add',victimRel);git('commit','-qm','remove claimed payload');
const missingHead=git('rev-parse','HEAD');assert(assemble(missingHead,path.join(tmp,'missing'),advanced,true).changed.includes(victimRel),'removed claimed input remains in reviewed range');
write(victim,original);git('add',victimRel);git('commit','-qm','restore archive');
const cleanRun=fs.readFileSync(path.join(repo,run),'utf8');
function recordCase(name,edit,pattern){write(path.join(repo,run),edit(cleanRun));git('add',run);git('commit','-qm',name);const r=assemble(git('rev-parse','HEAD'),path.join(tmp,name),base,true);assert.match(r.gaps.join('\n'),pattern);write(path.join(repo,run),cleanRun);git('add',run);git('commit','-qm','restore run record')}
recordCase('incomplete',t=>t+'- review-collection · '+JSON.stringify({...JSON.parse(t.split('\n').filter(l=>l.startsWith('- review-collection · ')).at(-1).split(' · ')[1]),complete:false,gaps:['incomplete fixture']})+'\n',/incomplete|complete/);
recordCase('malformed',t=>t+'- review-collection · {broken\n',/malformed/);
recordCase('conflicting',t=>t+'- review-collection · '+JSON.stringify({...JSON.parse(t.split('\n').filter(l=>l.startsWith('- review-collection · ')).at(-1).split(' · ')[1]),workspace:'/different-producer'})+'\n',/conflict/);
// A deleted record does not make a removed formerly claimed payload disappear.
write(path.join(repo,run),'approvals:\n');fs.unlinkSync(victim);git('add',run,victimRel);git('commit','-qm','remove provenance and input');
assert(assemble(git('rev-parse','HEAD'),path.join(tmp,'removed-record'),advanced,true).changed.includes(victimRel));
// With no claims at either endpoint ordinary tracked archive-shaped content is still reviewed.
const noClaims=git('rev-parse','HEAD'),ordinaryArchive='docs/unclaimed/reviews/inv-raw/assembled/final-review-inv-raw-final/raw.diff';
write(path.join(repo,ordinaryArchive),'ordinary archive-shaped tracked evidence\n');git('add',ordinaryArchive);git('commit','-qm','unclaimed content');
assert(assemble(git('rev-parse','HEAD'),path.join(tmp,'absent-record'),noClaims).changed.includes(ordinaryArchive));
assert(stats.every(s=>s.maxBasename<200),'no recursive basename amplification');
console.log('PASS: four unchanged-product collection/re-entry cycles, new product, immutable archives, captured source, exact claims, unusual paths and explicit provenance gaps');
JS
