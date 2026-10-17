#!/usr/bin/env bash
set -euo pipefail
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
T=$(mktemp -d "${TMPDIR:-/tmp}/generated-review-inputs.XXXXXX")
trap 'rm -rf "$T"' EXIT
node - "$ROOT" "$T" <<'JS'
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const [root,tmp]=process.argv.slice(2),repo=path.join(tmp,'repo'),work=path.join(tmp,'work'),run='docs/run/run.md';
fs.mkdirSync(repo,{recursive:true});fs.mkdirSync(work);
const env={...process.env,HOME:path.join(tmp,'home'),XDG_CONFIG_HOME:path.join(tmp,'config'),XDG_CACHE_HOME:path.join(tmp,'cache'),XDG_DATA_HOME:path.join(tmp,'data'),XDG_STATE_HOME:path.join(tmp,'state'),GIT_CONFIG_NOSYSTEM:'1'};
for(const k of ['HOME','XDG_CONFIG_HOME','XDG_CACHE_HOME','XDG_DATA_HOME','XDG_STATE_HOME'])fs.mkdirSync(env[k],{recursive:true});
const exec=(cmd,args,cwd=repo)=>cp.execFileSync(cmd,args,{cwd,env,encoding:'utf8',stdio:['ignore','pipe','pipe']});
const git=(...a)=>exec('git',a).trim();
const write=(p,t)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t)};
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rs=path.join(root,'skills/super-auto/scripts/report-status');
git('init','-q');git('config','user.email','fixture@example.test');git('config','user.name','Fixture');
write(path.join(repo,run),'flags: skipPlanRoast false, skipCodeRoast false\nphase: code\napprovals:\n');
write(path.join(repo,'product.txt'),'before\n');git('add','.');git('commit','-qm','base');const base=git('rev-parse','HEAD');
write(path.join(repo,'product.txt'),'after\n');write(path.join(repo,'reviews/user-evidence.txt'),'product evidence under an ordinary reviews directory\n');
git('add','.');git('commit','-qm','product change');
const saved=new Map(),stats=[];
function assemble(head,out){
 if(process.env.GENERATED_REVIEW_INPUTS_BASELINE==='1'){
  // Execute the pre-fix assembler-prompt's steps 2 and 4 against captured commits.
  fs.mkdirSync(path.join(out,'slices'),{recursive:true});
  const changed=exec('git',['diff','--name-only','-z',base+'..'+head]).split('\0').filter(Boolean);
  write(path.join(out,'diffstat.txt'),exec('git',['diff','--stat',base+'..'+head]));
  for(const f of changed)write(path.join(out,'slices',f.replaceAll('/','__')+'.diff'),exec('git',['diff',base+'..'+head,'--',f]));
  return {base,head,changed,archives:[]};
 }
 exec('bash',[rs,'--review-inputs',repo,base,head,out]);
 return JSON.parse(fs.readFileSync(path.join(out,'review-inputs.json'),'utf8'));
}
for(let n=1;n<=5;n++){
 if(n===5){write(path.join(repo,'new-product.txt'),'new product edit after repeated collection\n');git('add','.');git('commit','-qm','new product change')}
 const id='inv-'+n,head=git('rev-parse','HEAD'),workspace=path.join(work,id),out=path.join(workspace,'assembled','final-review-'+id+'-final');
 const input=assemble(head,out),slices=fs.readdirSync(path.join(out,'slices'));
 const bytes=slices.reduce((sum,f)=>sum+fs.statSync(path.join(out,'slices',f)).size,0);
 stats.push({invocation:id,files:input.changed.length,bytes,maxBasename:Math.max(...slices.map(f=>Buffer.byteLength(f)))});
 console.log(JSON.stringify(stats.at(-1)));
 assert.equal(input.base,base,'keep the original product base');assert.equal(input.head,head,'keep the captured head');
 assert(input.changed.includes('product.txt'),'original product range survives every re-entry');
 assert(input.changed.includes('reviews/user-evidence.txt'),'ordinary product evidence named reviews is included');
 if(n===5)assert(input.changed.includes('new-product.txt'),'a later product edit enters captured-range review');
 assert(!input.changed.some(f=>f.startsWith('docs/run/reviews/')),'prior collected packages must not become fresh slices');
 if(n>1){
  assert.equal(input.archives.length,n-1,'every prior invocation has an explicit provenance reference');
  for(const a of input.archives){
   assert.equal(a.run,run);assert.equal(a.archive,'docs/run/reviews/'+a.invocationId);
   assert(a.files.some(f=>f.path==='final-review-'+a.invocationId+'.md'),'provenance locates the complete original finding');
   assert(a.files.some(f=>f.path.endsWith('.md.diff')),'direct input provenance remains discoverable');
   for(const f of a.files)assert.equal(sha(path.join(repo,a.archive,f.path)),f.sha256,'historical archive hash remains exact');
  }
 }
 write(path.join(out,'digest.md'),'fixture digest\n');
 const review=path.join(workspace,'final-review-'+id+'.md');
 write(review,'# Final review\n## Verdict\nnot ready\n\n## Must-fix\n- [Must-fix] product.txt:1 — retained historical finding '+id+'\n\n## Should-fix\nnone\n\n## Untested scope\nnone\n');
 write(review+'.diff',exec('git',['diff',base+'..'+head,'--',...input.changed]));
 const collected=exec('bash',[rs,'--collect',path.join(repo,run),'--invocation',id,'--workspace',workspace,'--review',review,'--verdict','not ready']);
 assert.match(collected,/collection: complete/);
 const records=fs.readFileSync(path.join(repo,run),'utf8').split('\n').filter(l=>l.startsWith('- review-collection · ')).map(l=>JSON.parse(l.split(' · ')[1]));
 const latest=records.filter(r=>r.invocationId===id).at(-1);assert.equal(latest.complete,true);
 const sources=fs.readFileSync(path.join(repo,run),'utf8').split('\n').filter(l=>l.startsWith('- finding-source · ')).map(l=>JSON.parse(l.split(' · ')[1]));
 assert(JSON.stringify(sources).includes('retained historical finding '+id),'the collector retains the complete historical finding text');
 for(const f of latest.files){const p=path.join(repo,'docs/run/reviews',id,f.path);saved.set(p,sha(p))}
 git('add','.');git('commit','-qm','collect '+id);
}
// A complete collection can be replayed from immutable archives after producer cleanup.
fs.rmSync(work,{recursive:true});assert.match(exec('bash',[rs,'--collect',path.join(repo,run)]),/collection: complete/);
for(const [p,h] of saved)assert.equal(sha(p),h,'collection and re-entry never rewrite historical raw bytes');
assert(stats.every(s=>s.maxBasename<200),'generated archive names never enter slice basenames');
assert(stats[3].bytes<stats[0].bytes+30000,'four re-entries have bounded provenance growth, without recursive package amplification');
console.log('PASS: four unchanged-product collection/re-entry cycles, later product edit, exact archives and provenance');
JS
