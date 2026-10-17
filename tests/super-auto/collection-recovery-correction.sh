#!/usr/bin/env bash
# Regressions: settled null reports require explicit, source-bound recovery; immutable
# non-null results and original unavailable history must survive every retry.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
node - "$REPO_ROOT/skills/super-auto/scripts/report-status" "$T" <<'NODE'
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const [script,tmp]=process.argv.slice(2),report='## Verdict\nready\n## Must-fix\nnone\n## Deferred OK\nnone\n## Untested scope\nnone\n';
let failures=0,checks=0;
function check(name,fn){checks++;try{fn();console.log('[PASS] '+name)}catch(e){failures++;console.error('[FAIL] '+name+': '+e.message)}}
function records(f){return fs.readFileSync(f.run,'utf8').split('\n').filter(l=>l.startsWith('- review-collection · ')).map(l=>JSON.parse(l.slice('- review-collection · '.length)))}
const last=f=>records(f).at(-1),digest=r=>crypto.createHash('sha256').update(JSON.stringify(r)).digest('hex');
function collect(f,opts={}){return cp.spawnSync('bash',[script,'--collect',f.run,...(opts.replay?[]:['--invocation',opts.id||'probe','--workspace',opts.workspace||f.workspace,'--review',opts.review===undefined?f.review:opts.review,'--verdict',opts.verdict||'ready',...(opts.required||['inputs/required.txt']).flatMap(p=>['--required',p]),...(opts.recover?['--recover-null']:[])])],{encoding:'utf8'})}
function fixture(name){
 const root=path.join(tmp,name),workspace=path.join(root,'workspace'),run=path.join(root,'run.md'),review=path.join(workspace,'final-review-probe.md');
 fs.mkdirSync(path.join(workspace,'inputs'),{recursive:true});fs.writeFileSync(path.join(workspace,'inputs/required.txt'),'required source bytes\n');fs.writeFileSync(run,'flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n');
 const f={root,workspace,run,review};assert.equal(collect(f,{review:'none',verdict:'UNAVAILABLE'}).status,3);f.original=fs.readFileSync(run,'utf8');f.nullRecord=last(f);return f;
}
const f=fixture('recover');fs.writeFileSync(f.review,report);
check('plain replay cannot promote a null result from file presence',()=>{assert.equal(collect(f,{replay:true}).status,3);assert.equal(last(f).reviewPath,null)});
check('ordinary settlement cannot replace a settled null result',()=>{assert.equal(collect(f).status,3);assert.equal(last(f).reviewPath,null)});
// Name the break: without explicit null-recovery admission a valid recovered report
// remains permanently pending despite intact identity and complete extraction.
f.nullRecord=last(f);const before=fs.readFileSync(f.run,'utf8'),result=collect(f,{recover:true});
check('explicit recovered report collects with unchanged invocation and inputs',()=>{assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(last(f).complete,true);assert.equal(last(f).reviewPath,f.review);assert.equal(last(f).review,'ready');assert.equal(fs.readFileSync(path.join(f.root,'reviews/probe/inputs/required.txt'),'utf8'),'required source bytes\n')});
check('recovery retains original unavailable events and binds their exact predecessor',()=>{assert.ok(fs.readFileSync(f.run,'utf8').includes(before.trimEnd()));const r=last(f);assert.deepEqual(r.recovery,{kind:'settled-null',recordSha256:digest(f.nullRecord),review:'UNAVAILABLE'});assert.ok(records(f).some(r=>r.reviewPath===null&&r.review==='UNAVAILABLE'&&r.gaps?.some(g=>g.includes('recover'))))});
check('repeated explicit recovery and plain replay are byte-idempotent',()=>{const stable=fs.readFileSync(f.run,'utf8');assert.equal(collect(f,{recover:true}).status,0);assert.equal(collect(f,{replay:true}).status,0);assert.equal(fs.readFileSync(f.run,'utf8'),stable)});
// A recovery marker without its exact retained null predecessor cannot establish
// source identity. These are real replay checks, not source-text/schema assertions.
{
 const stable=fs.readFileSync(f.run,'utf8');
 for(const [name,mutate] of [
  ['unretained predecessor',r=>{r.recovery.recordSha256='0'.repeat(64)}],
  ['different unavailable verdict',r=>{r.recovery.review='another result'}],
  ['unsupported recovery kind',r=>{r.recovery.kind='replacement'}],
  ['changed recovered bundle',r=>{r.required=[]}]
 ]){
  const changed=stable.split('\n').map(line=>{if(!line.startsWith('- review-collection · '))return line;const r=JSON.parse(line.slice('- review-collection · '.length));if(r.recovery)mutate(r);return '- review-collection · '+JSON.stringify(r)}).join('\n');
  fs.writeFileSync(f.run,changed);const result=collect(f,{replay:true});
  check('replay rejects '+name,()=>assert.equal(result.status,3,result.stdout+result.stderr));
 }
 fs.writeFileSync(f.run,stable);
}
check('recovered archive remains useful after intentional source removal',()=>{fs.rmSync(f.workspace,{recursive:true});assert.equal(collect(f,{replay:true}).status,0);assert.equal(last(f).complete,true);assert.equal(fs.readFileSync(path.join(f.root,'reviews/probe/final-review-probe.md'),'utf8'),report)});
for(const [name,options] of [
 ['workspace',{workspace:path.join(tmp,'different-workspace')}],['required-inputs',{required:[]}],['unexpected-review-path',{review:path.join(tmp,'elsewhere.md')}],['null-again',{review:'none'}],['missing-invocation',{id:'other'}],['verdict-mismatch',{verdict:'CLEAN'}]
]){
 const f=fixture('reject-'+name);fs.writeFileSync(f.review,report);const before=fs.readFileSync(f.run,'utf8');const result=collect(f,{recover:true,...options});
 check('recovery rejects '+name+' without replacing null history',()=>{assert.equal(result.status,3,result.stdout+result.stderr);assert.equal(last(f).reviewPath,null);assert.equal(fs.readFileSync(f.run,'utf8'),before)});
}
for(const mode of ['missing','symlink','malformed']){
 const f=fixture('reject-'+mode);
 if(mode==='symlink'){const outside=path.join(f.root,'outside.md');fs.writeFileSync(outside,report);fs.symlinkSync(outside,f.review)}
 if(mode==='malformed')fs.writeFileSync(f.review,'unrecognized report\n');
 const before=fs.readFileSync(f.run,'utf8'),result=collect(f,{recover:true});
 check('recovery rejects '+mode+' report before rebinding',()=>{assert.equal(result.status,3,result.stdout+result.stderr);assert.equal(fs.readFileSync(f.run,'utf8'),before)});
}
{
 const f=fixture('settled-non-null');fs.writeFileSync(f.review,report);
 // Build a normal non-null settled fixture through the production CLI.
 fs.writeFileSync(f.run,'flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n');assert.equal(collect(f).status,0);
 const before=fs.readFileSync(f.run,'utf8');const result=collect(f,{recover:true});
 check('recovery cannot relabel already settled non-null source',()=>{assert.equal(result.status,3,result.stdout+result.stderr);assert.equal(fs.readFileSync(f.run,'utf8'),before)});
 fs.writeFileSync(f.review,report.replace('ready','not ready'));
 const changed=collect(f,{verdict:'not ready'});
 check('changed settled source bytes never replace archived source',()=>{assert.equal(changed.status,3);assert.equal(fs.readFileSync(path.join(f.root,'reviews/probe/final-review-probe.md'),'utf8'),report)});
}
console.log(`${checks-failures} passed, ${failures} failed`);process.exit(failures?1:0);
NODE
