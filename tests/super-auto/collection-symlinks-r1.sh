#!/usr/bin/env bash
# Regression: collection must reject source and destination symlinks before reading/copying bytes.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
node - "$REPO_ROOT/skills/super-auto/scripts/report-status" "$T" <<'NODE'
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const [script,tmp]=process.argv.slice(2),sentinel='OUTSIDE WORKSPACE SENTINEL must never be archived\n';
let failures=0,checks=0;
function check(name,fn){checks++;try{fn();console.log('[PASS] '+name)}catch(e){failures++;console.error('[FAIL] '+name+': '+e.message)}}
function fixture(name){
 const root=path.join(tmp,name),workspace=path.join(root,'workspace'),outside=path.join(root,'outside'),run=path.join(root,'run.md'),prefix='final-review-probe';
 fs.mkdirSync(workspace,{recursive:true});fs.mkdirSync(outside);fs.writeFileSync(run,'flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n');fs.writeFileSync(path.join(workspace,prefix+'.md'),'## Verdict\nready\n## Must-fix\nnone\n## Deferred OK\nnone\n## Untested scope\nnone\n');
 return {root,workspace,outside,run,prefix};
}
function collect(f,required=[]){return cp.spawnSync('bash',[script,'--collect',f.run,'--invocation','probe','--workspace',f.workspace,'--review',path.join(f.workspace,f.prefix+'.md'),'--verdict','ready',...required.flatMap(p=>['--required',p])],{encoding:'utf8'})}
function latest(f){return fs.readFileSync(f.run,'utf8').split('\n').filter(l=>l.startsWith('- review-collection · ')).map(l=>JSON.parse(l.slice('- review-collection · '.length))).at(-1)}
function archivedBytes(root){if(!fs.existsSync(root))return '';return fs.readdirSync(root).map(n=>{const p=path.join(root,n);return fs.statSync(p).isDirectory()?archivedBytes(p):fs.readFileSync(p,'utf8')}).join('')}
function rejected(name,setup){
 const f=fixture(name),required=setup(f)||[],result=collect(f,required),record=latest(f);
 check(name+' exits with collection gap',()=>assert.equal(result.status,3,result.stdout+result.stderr));
 check(name+' stays incomplete with an explicit unsafe path gap',()=>{assert.equal(record.complete,false);assert.ok(record.gaps.some(g=>g.startsWith('unsafe bundle path: ')),JSON.stringify(record.gaps));assert.match(result.stderr,/COLLECTION_GAP:/)});
 check(name+' never archives sentinel bytes',()=>assert.ok(!archivedBytes(path.join(f.root,'reviews')).includes(sentinel)));
}
rejected('assembled-intermediate',f=>{
 fs.mkdirSync(path.join(f.outside,f.prefix+'-final'));fs.writeFileSync(path.join(f.outside,f.prefix+'-final','sentinel.txt'),sentinel);
 fs.symlinkSync(f.outside,path.join(f.workspace,'assembled'));
});
rejected('discovered-direct-file',f=>{
 fs.writeFileSync(path.join(f.outside,'sentinel.txt'),sentinel);fs.symlinkSync(path.join(f.outside,'sentinel.txt'),path.join(f.workspace,f.prefix+'.md.diff'));
});
rejected('required-deep-intermediate',f=>{
 fs.mkdirSync(path.join(f.workspace,'inputs'));fs.mkdirSync(path.join(f.outside,'nested'));fs.writeFileSync(path.join(f.outside,'nested','sentinel.txt'),sentinel);
 fs.symlinkSync(f.outside,path.join(f.workspace,'inputs','linked'));return ['inputs/linked/nested/sentinel.txt'];
});
rejected('required-direct-file',f=>{
 fs.writeFileSync(path.join(f.outside,'sentinel.txt'),sentinel);fs.symlinkSync(path.join(f.outside,'sentinel.txt'),path.join(f.workspace,'required.txt'));return ['required.txt'];
});
rejected('discovered-nested-directory',f=>{
 const assembled=path.join(f.workspace,'assembled',f.prefix+'-final');fs.mkdirSync(assembled,{recursive:true});fs.writeFileSync(path.join(f.outside,'sentinel.txt'),sentinel);fs.symlinkSync(f.outside,path.join(assembled,'linked'));
});
rejected('in-workspace-symlink',f=>{
 fs.writeFileSync(path.join(f.workspace,'real.txt'),sentinel);fs.symlinkSync('real.txt',path.join(f.workspace,'required.txt'));return ['required.txt'];
});
rejected('split-manifest-intermediate',f=>{
 fs.mkdirSync(path.join(f.outside,f.prefix+'-final'));fs.writeFileSync(path.join(f.outside,f.prefix+'-final','clusters.json'),JSON.stringify({clusters:[{slices:['sentinel.txt']}]}));fs.writeFileSync(path.join(f.outside,f.prefix+'-final','sentinel.txt'),sentinel);
 fs.symlinkSync(f.outside,path.join(f.workspace,'assembled'));fs.writeFileSync(path.join(f.workspace,f.prefix+'.cluster-1.md'),'## Verdict\nready\n## Must-fix\nnone\n## Deferred OK\nnone\n## Untested scope\nnone\n');
});
// A missing component guard would redirect writes through archive-owned directories.
for(const component of ['reviews','invocation','nested','leaf']){
 const f=fixture('destination-'+component),rel='payload/deep/input.txt';
 fs.mkdirSync(path.dirname(path.join(f.workspace,rel)),{recursive:true});fs.writeFileSync(path.join(f.workspace,rel),'review input bytes\n');
 fs.writeFileSync(path.join(f.outside,'sentinel.txt'),sentinel);
 const archive=path.join(f.root,'reviews','probe');
 if(component==='reviews')fs.symlinkSync(f.outside,path.join(f.root,'reviews'));
 else if(component==='invocation'){fs.mkdirSync(path.dirname(archive));fs.symlinkSync(f.outside,archive)}
 else if(component==='nested'){fs.mkdirSync(path.join(archive,'payload'),{recursive:true});fs.symlinkSync(f.outside,path.join(archive,'payload','deep'))}
 else {fs.mkdirSync(path.join(archive,'payload','deep'),{recursive:true});fs.symlinkSync(path.join(f.outside,'sentinel.txt'),path.join(archive,rel))}
 const before=fs.readdirSync(f.outside),result=collect(f,[rel]),record=latest(f);
 check('destination-'+component+' rejects escaped collection',()=>{assert.equal(result.status,3,result.stdout+result.stderr);assert.equal(record.complete,false);assert.ok(record.gaps.some(g=>g.startsWith('unsafe archive path: ')),JSON.stringify(record.gaps))});
 check('destination-'+component+' leaves outside bytes and entries untouched',()=>{assert.deepEqual(fs.readdirSync(f.outside),before);assert.equal(fs.readFileSync(path.join(f.outside,'sentinel.txt'),'utf8'),sentinel)});
}
// An existing matching external file must not be trusted as an owned archive copy.
{
 const f=fixture('destination-existing-file'),rel='payload/input.txt';
 fs.mkdirSync(path.join(f.workspace,'payload'));fs.writeFileSync(path.join(f.workspace,rel),'same bytes\n');
 fs.writeFileSync(path.join(f.outside,'input.txt'),'same bytes\n');fs.mkdirSync(path.join(f.root,'reviews','probe'),{recursive:true});fs.symlinkSync(f.outside,path.join(f.root,'reviews','probe','payload'));
 const result=collect(f,[rel]);
 check('matching outside file cannot satisfy archive completeness',()=>{assert.equal(result.status,3,result.stdout+result.stderr);assert.equal(latest(f).complete,false);assert.ok(!latest(f).files.some(entry=>entry.path===rel))});
}
const normal=fixture('normal'),relative='assembled/'+normal.prefix+'-final/nested/input.txt';
fs.mkdirSync(path.dirname(path.join(normal.workspace,relative)),{recursive:true});fs.writeFileSync(path.join(normal.workspace,relative),'normal nested bytes\n');
fs.mkdirSync(path.join(normal.workspace,'inputs'));fs.writeFileSync(path.join(normal.workspace,'inputs','required.txt'),'normal required bytes\n');
const result=collect(normal,['inputs/required.txt']);
check('normal nested and required files collect',()=>{assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(latest(normal).complete,true);assert.deepEqual(latest(normal).gaps,[]);assert.equal(fs.readFileSync(path.join(normal.root,'reviews','probe',relative),'utf8'),'normal nested bytes\n');assert.equal(fs.readFileSync(path.join(normal.root,'reviews','probe','inputs','required.txt'),'utf8'),'normal required bytes\n')});
fs.rmSync(normal.workspace,{recursive:true});const replay=cp.spawnSync('bash',[script,'--collect',normal.run],{encoding:'utf8'});
check('completed archive survives intentional source cleanup',()=>{assert.equal(replay.status,0,replay.stdout+replay.stderr);assert.equal(latest(normal).complete,true)});
console.log(`${checks-failures} passed, ${failures} failed`);process.exit(failures?1:0);
NODE
