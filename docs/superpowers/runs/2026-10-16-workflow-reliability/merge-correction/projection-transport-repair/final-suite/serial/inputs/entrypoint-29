#!/usr/bin/env bash
# The read-only caller gate must catch missing or changed retained archive bytes.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
T=$(mktemp -d "${TMPDIR:-/tmp}/archive-integrity.XXXXXX")
trap 'rm -rf "$T"' EXIT
node - "$REPO_ROOT/skills/super-auto/scripts/report-status" "$T" <<'NODE'
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const [script,tmp]=process.argv.slice(2),id='integrity',prefix='final-review-'+id,tree='a'.repeat(40);
const workspace=path.join(tmp,'work'),dir=path.join(tmp,'run'),run=path.join(dir,'run.md'),archive=path.join(dir,'reviews',id);
fs.mkdirSync(workspace,{recursive:true});fs.mkdirSync(dir,{recursive:true});
const review='## Verdict\nready\n## Must-fix\nnone\n## Deferred OK\nnone\n## Untested scope\nnone\n';
const files=new Map([
 [prefix+'.md.diff','direct package original\n'],
 [prefix+'.md',review],
 [prefix+'.cluster-1.md',review],
 ['assembled/'+prefix+'-final/clusters.json','{"clusters":[{"name":"core","slices":["slices/core.diff"]}]}\n'],
 ['assembled/'+prefix+'-final/slices/core.diff','assembled input original\n'],
 ['required-input.diff','declared input original\n']
]);
for(const [rel,bytes]of files){const file=path.join(workspace,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes)}
const acceptance={version:1,owner:'super-auto',sourceTree:tree,requirements:[
 {id:'review',kind:'review',owner:'super-auto'},
 {id:'sweep',kind:'measurement',owner:'super-auto',command:'suite',configuration:'quiet',requiredLive:true},
 {id:'finish',kind:'human',owner:'human'}],
 evidence:[{sourceTree:tree,command:'suite',configuration:'quiet',kind:'live',outcome:'pass',location:'sweep.log'}],
 reviews:[{id:'review',sourceTree:tree,outcome:'pass',location:'reviews/'+id+'/'+prefix+'.md'}],
 decisions:[{id:'finish',authority:'human',decision:'accept',evidence:['human-choice']}],
 recovery:{obligations:[],gaps:[]},checkEvidence:{records:[],requiredLiveChecks:[],gaps:[]},runFailures:[]};
fs.writeFileSync(run,'flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\ncodeBuckets:\n  escalated: none\n  pendingRetry: none\n  parked: none\n  stalled: false\n  review: ready\n  sweep: 1 — 1 passed, 0 failed, 0 errors; command: suite @ aaaaaaa\napprovals:\n- root-acceptance · '+JSON.stringify(acceptance)+'\n');
function cli(args,want){const p=cp.spawnSync('bash',[script,...args],{encoding:'utf8'});assert.equal(p.status,want,p.stdout+p.stderr);assert.equal(p.stderr,'');return p.stdout}
cli(['--collect',run,'--invocation',id,'--workspace',workspace,'--review',path.join(workspace,prefix+'.md'),'--verdict','ready','--required','required-input.diff'],0);
const collection=fs.readFileSync(run,'utf8').split('\n').filter(l=>l.startsWith('- review-collection · ')).map(l=>JSON.parse(l.slice('- review-collection · '.length))).at(-1);
assert.equal(collection.complete,true);
assert.deepEqual(collection.files.map(f=>f.path).sort(),[...files.keys()].sort(),'fixture must retain direct, cluster, assembled and declared files');
function snapshot(){const result=[];function walk(dir){for(const name of fs.readdirSync(dir).sort()){const file=path.join(dir,name),st=fs.statSync(file);result.push([path.relative(tmp,file),st.mtimeMs,st.mode,st.isFile()?fs.readFileSync(file).toString('base64'):null]);if(st.isDirectory())walk(file)}}walk(tmp);return result}
function gate(want,expectedGap){const before=snapshot();const d=JSON.parse(cli(['--acceptance',run,'--tree',tree],want));assert.equal(d.eligible,want===0);assert.deepEqual(d.pending,[]);if(expectedGap)assert.ok(d.gaps.includes(expectedGap),JSON.stringify(d));else assert.deepEqual(d.gaps,[]);assert.deepEqual(snapshot(),before,'acceptance must preserve run text, bytes, mtimes and inventory');return d}
gate(0);
console.log('PASS: complete matching archive remains eligible and unchanged');
// The archive must stand alone after collection; no recollection or source repair is allowed.
fs.renameSync(workspace,workspace+'-removed');
gate(0);
console.log('PASS: matching archive remains eligible after source cleanup');
for(const [rel,bytes]of files){
 const file=path.join(archive,rel);
 for(const mode of ['missing','corrupted']){
  if(mode==='missing')fs.unlinkSync(file);else fs.writeFileSync(file,'changed archive bytes\n');
  const message='review collection gap: '+id+': '+(mode==='missing'?'archive unavailable: ':'archive integrity mismatch: ')+rel;
  gate(3,message);
  const before=snapshot(),ordinary=cli([run],0);
  assert.ok(ordinary.includes('qualifier: '+message),ordinary);
  assert.match(ordinary,/qualifier: review collections pending: 1/);
  assert.deepEqual(snapshot(),before,'ordinary status must also remain read-only');
  console.log('PASS: '+mode+' '+rel+' blocks acceptance with a specific gap');
  fs.writeFileSync(file,bytes);
  gate(0);
 }
}
// An integrity gap must not replace independent pending acceptance obligations.
fs.unlinkSync(path.join(archive,prefix+'.md.diff'));
acceptance.decisions=[];
fs.appendFileSync(run,'- root-acceptance · '+JSON.stringify(acceptance)+'\n');
const before=snapshot(),pending=JSON.parse(cli(['--acceptance',run,'--tree',tree],3));
assert.equal(pending.eligible,false);assert.deepEqual(pending.pending,['finish: human decision pending; owner: human']);
assert.ok(pending.gaps.includes('review collection gap: '+id+': archive unavailable: '+prefix+'.md.diff'));
assert.deepEqual(snapshot(),before);
console.log('PASS: integrity gaps preserve independent human acceptance obligations');
console.log('archive integrity: 15 scenarios passed');
NODE
