#!/usr/bin/env node
// Real report/ledger/recovery producers feed an otherwise satisfied root gate.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const scripts=path.join(root,'skills/super-auto/scripts');
const code=path.join(root,'skills/super-code');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'multi-source-correspondence-'));
const tree='a'.repeat(40);
let passed=0,failed=0;
function cli(executable,args,cwd=tmp,want=0){
 const out=cp.spawnSync(executable,args,{cwd,encoding:'utf8'});
 assert.equal(out.status,want,out.stdout+out.stderr);return out.stdout;
}
function test(name,fn){if(process.env.TEST_FILTER&&!name.includes(process.env.TEST_FILTER))return;try{fn();passed++;console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack)}}
function extract(file,source){return JSON.parse(cli('bash',[path.join(code,'scripts/report-verdict'),'--complete','--source',source,file]))}
function fixture(name){
 const dir=path.join(tmp,name);fs.mkdirSync(dir);const run=path.join(dir,'run.md');
 const final=path.join(dir,'final.md');fs.writeFileSync(final,'## Verdict\nready\n## Must fix before landing\nNone\n');
 const snapshot={version:1,owner:'super-auto',sourceTree:tree,requirements:[
  {id:'review',kind:'review',owner:'caller'},
  {id:'suite',kind:'measurement',owner:'caller',command:'suite',configuration:'local',requiredLive:true},
  {id:'human',kind:'human',owner:'human'}],
  evidence:[{sourceTree:tree,command:'suite',configuration:'local',kind:'live',outcome:'pass',location:'fixture-live.log'}],
  reviews:[{id:'review',sourceTree:tree,outcome:'pass',location:final}],
  decisions:[{id:'human',authority:'human',decision:'accept',evidence:['synthetic fixture human decision']}],
  recovery:{obligations:[],gaps:[]},checkEvidence:{records:[],requiredLiveChecks:[],gaps:[]},runFailures:[]};
 const sources=[extract(final,'unrelated/final')],records=[],declarations=[];
 function write(){fs.writeFileSync(run,'flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\n'+declarations.join('\n')+'\napprovals:\n'+sources.map(s=>'- finding-source · '+JSON.stringify(s)+'\n').join('')+records.map(r=>'- '+r.type+' · '+JSON.stringify(r.data)+'\n').join('')+'- root-acceptance · '+JSON.stringify(snapshot)+'\n')}
 function gate(want,pattern){write();const before=fs.readFileSync(run,'utf8');const result=JSON.parse(cli('bash',[path.join(scripts,'report-status'),'--acceptance',run,'--tree',tree],dir,want));assert.equal(fs.readFileSync(run,'utf8'),before,'gate must be read-only');assert.equal(result.eligible,want===0);if(pattern)assert.match(JSON.stringify(result),pattern);return result}
 return {dir,run,snapshot,sources,records,declarations,write,gate};
}
function roast(f,name,body='- [Blocking] same.js:1 — retained original defect'){
 const file=path.join(f.dir,name);fs.writeFileSync(file,'super-roast verdict: '+(body==='None'?'CLEAN':'NEEDS FIX')+'\ninputs: source @'+tree+'\n## Confirmed findings\n'+body+'\n');return file;
}
function relevance(source,effect='nonblocking'){
 return {ref:{source:source.source,section:'Confirmed findings',position:1},judgment:'supported',effect,requirement:'review',basis:'fixture scope judgment of this exact occurrence',evidence:[source.artifact+'#Confirmed findings:1']};
}
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');

// Mutation targets: rejecting genuine multi-source transport; accepting omitted,
// duplicated, reassigned or stale refs; treating correspondence as disposition.
const exactRef=(s,position=1)=>({source:s.source,section:'Must fix before landing',position});
function selectedFixture(name,{empty=false,duplicateKeys=false}={}){
 const f=fixture(name),ss=[];
 for(let i=0;i<3;i++){
  const file=path.join(f.dir,`source-${i}.md`);
  fs.writeFileSync(file,'## Verdict\n'+(empty?'ready':'not ready')+'\n## Must fix before landing\n'+(empty?'None':'- shared concern'+(i===0?'\n- independently repaired concern':'')+(i===1?'\n- other concern':''))+'\n## Untested scope\nNone\n');
  ss.push(extract(file,`inv-${i}/final`));
 }
 f.sources.push(...ss);
 const refs=empty?[]:[exactRef(ss[0]),exactRef(ss[1]),exactRef(ss[2]),exactRef(ss[1],2)];
 const keys=path.join(f.dir,'aggregate.keys');
 fs.writeFileSync(keys,'review: '+(empty?'ready':'not ready')+'\n'+(empty?'':duplicateKeys?'[Must-fix] shared concern\n[Must-fix] shared concern\n[Must-fix] other concern\n':'[Must-fix] shared concern\n[Must-fix] other concern\n'));
 const producer=path.join(f.dir,'original-producer-refmap.json');
 fs.writeFileSync(producer,JSON.stringify(refs.map((ref,i)=>({ref,key:i===3?'[Must-fix] other concern':'[Must-fix] shared concern',...(duplicateKeys?{line:i<2?2:i===2?3:4}:{})}))));
 const lines=empty?[]:duplicateKeys?[{line:2,refs:refs.slice(0,2)},{line:3,refs:[refs[2]]},{line:4,refs:[refs[3]]}]:[{line:2,refs:refs.slice(0,3)},{line:3,refs:[refs[3]]}];
 const a={version:2,artifact:keys,sha256:sha(keys),sources:ss.map(s=>({source:s.source,retainedArtifact:s.artifact,retainedSha256:sha(s.artifact)})),population:{artifact:producer,sha256:sha(producer)},judgment:'supported',basis:'Independent fixture judgment of original producer selection and exact physical line refs',evidence:[producer,...ss.map(s=>s.artifact)],lines};
 const clean=roast(f,'clean.md','None');f.sources.push(extract(clean,'roast-code/round-1'));
 const ledger=path.join(f.dir,'ledger.md');cli('bash',[path.join(root,'skills/super-design/scripts/findings-ledger'),'--loop','code','--out',ledger,'--report','1='+clean,'--final-review','1='+keys]);
 f.declarations.push('findingsLedger: ledger.md','roast-code: clean.md, aggregate.keys');
 f.snapshot.findingAcceptance=refs.map(ref=>({...relevance(ss[0]),ref}));
 if(!empty)f.records.push({type:'finding-disposition',data:{ref:exactRef(ss[0],2),disposition:'resolved',judgment:'supported',basis:'Independent repair of omitted raw occurrence',evidence:['repair.log'],verification:'Targeted check verified independent repair'}});
 f.records.push({type:'source-correspondence',data:a});
 return {f,a,ss,producer,refs,keys};
}
try{
 test('producer key-ref tuples cannot be reassigned to different physical keys',()=>{
  const {f,a,producer,refs}=selectedFixture('producer-key-swap');
  fs.writeFileSync(producer,JSON.stringify(refs.map((ref,i)=>({key:i===3?'[Must-fix] other concern':'[Must-fix] shared concern',ref}))));
  a.population.sha256=sha(producer);
  [a.lines[0].refs[0],a.lines[1].refs[0]]=[a.lines[1].refs[0],a.lines[0].refs[0]];
  f.gate(3,/correspondence/);
 });
 for(const [name,mutate,duplicateKeys] of [
  ['missing',rows=>{delete rows[0].key}],
  ['malformed key',rows=>rows[0].key=17],
  ['malformed line',rows=>rows[0].line='2'],
  ['unknown line',rows=>rows[0].line=99],
  ['blank line',rows=>rows[0].line=4],
  ['header line',rows=>rows[0].line=1],
  ['contradictory key and line',rows=>rows[0].line=3],
  ['ambiguous equal keys',rows=>rows.forEach(r=>delete r.line),true],
 ])test('producer binding '+name+' rejected',()=>{
  const {f,a,producer}=selectedFixture('producer-binding-'+name.replaceAll(' ','-'),{duplicateKeys});
  const rows=JSON.parse(fs.readFileSync(producer));mutate(rows);fs.writeFileSync(producer,JSON.stringify(rows));a.population.sha256=sha(producer);f.gate(3,/correspondence/);
 });
 test('explicit producer lines prevent swaps between equal display keys',()=>{
  const {f,a}=selectedFixture('equal-key-swap',{duplicateKeys:true});
  [a.lines[0].refs[0],a.lines[1].refs[0]]=[a.lines[1].refs[0],a.lines[0].refs[0]];f.gate(3,/correspondence/);
 });
 test('producer binding line-only exact tuples accepted',()=>{
  const {f,a,producer}=selectedFixture('line-only');
  const rows=JSON.parse(fs.readFileSync(producer));rows.forEach((r,i)=>{delete r.key;r.line=i===3?3:2});fs.writeFileSync(producer,JSON.stringify(rows));a.population.sha256=sha(producer);f.gate(0);
 });
 test('three source producer selection closes transport and retains shared-line multiplicity',()=>{
  const {f,a,producer}=selectedFixture('genuine');
  const producerRefs=JSON.parse(fs.readFileSync(producer)).map(r=>r.ref);
  const mappedRefs=a.lines.flatMap(l=>l.refs);
  assert.deepEqual(mappedRefs,producerRefs);
  const result=f.gate(0);assert.equal(result.eligible,true);
  const projection=JSON.parse(cli('bash',[path.join(scripts,'scope-dispositions'),'--project',f.run]));
  assert.equal(projection.findings.length,5);
  assert.equal(projection.findings.filter(x=>x.outstanding).length,4);
  assert.equal(projection.findings.find(x=>x.ref.source==='inv-0/final'&&x.ref.position===2).outstanding,false);
 });
 const mutations=[
  ['missing association',(a,f)=>f.records.pop()],
  ['shared mapped ref removed',a=>a.lines[0].refs.pop()],
  ['self declared subset cannot override producer',a=>{a.lines[0].refs.pop();a.sources[2].refs=[]}],
  ['duplicate mapping in same line',a=>a.lines[0].refs.push(a.lines[0].refs[0])],
  ['duplicate mapping across lines',a=>a.lines[1].refs.push(a.lines[0].refs[0])],
  ['unselected but known ref',a=>a.lines[0].refs.push({source:'inv-0/final',section:'Must fix before landing',position:2})],
  ['unknown ref',a=>a.lines[0].refs[0].position=99],
  ['unknown section',a=>a.lines[0].refs[0].section='Deferred OK'],
  ['source reassignment',a=>a.lines[0].refs[0].source='inv-1/final'],
  ['unknown source',a=>a.lines[0].refs[0].source='absent/final'],
  ['missing physical line',a=>a.lines.pop()],
  ['duplicate physical line',a=>a.lines.push(a.lines[0])],
  ['header line',a=>a.lines[0].line=1],
  ['blank line',a=>a.lines[0].line=4],
  ['unknown physical line',a=>a.lines[0].line=99],
  ['empty refs',a=>a.lines[0].refs=[]],
  ['keys hash',a=>a.sha256='0'.repeat(64)],
  ['retained hash',a=>a.sources[0].retainedSha256='0'.repeat(64)],
  ['population hash',a=>a.population.sha256='0'.repeat(64)],
  ['missing population',a=>delete a.population],
  ['unsupported judgment',a=>a.judgment='unsupported'],
  ['missing evidence',a=>a.evidence=[]],
  ['missing source registration',(a,f)=>{f.sources.splice(1,1)}],
  ['registered extraction mismatch',(a,f)=>{f.sources[1].occurrences[0].text='different extraction'}],
  ['source text conflict',(a,f)=>{const conflict=structuredClone(f.sources[1]);conflict.occurrences[0].text='conflicting raw';f.sources.push(conflict)}],
  ['duplicate source',a=>a.sources.push(a.sources[0])],
  ['conflicting association',(a,f)=>{const other=structuredClone(a),file=path.join(f.dir,'extra-source.md');fs.writeFileSync(file,'## Verdict\nready\n## Must fix before landing\nNone\n');const extra=extract(file,'inv-extra/final');f.sources.push(extra);other.sources.push({source:extra.source,retainedArtifact:file,retainedSha256:sha(file)});f.records.push({type:'source-correspondence',data:other})}],
  ['malformed legacy alongside valid',(a,f)=>f.records.push({type:'source-correspondence',data:{version:1,artifact:a.artifact}})],
 ];
 for(const [name,mutate] of mutations)test(name+' remains a gap',()=>{
  const {f,a}=selectedFixture('negative-'+name.replaceAll(' ','-'));mutate(a,f);f.gate(3,/coverage|correspondence|finding evidence/);
 });
 for(const [name,rows] of [
  ['duplicate population',r=>[...r,r[0]]],
  ['unknown population',r=>[...r,{ref:{source:'absent/final',section:'Must fix before landing',position:1}}]],
  ['malformed population',()=>[{}]],
 ])test(name+' rejected even with fresh manifest hash',()=>{
  const {f,a,producer}=selectedFixture(name.replaceAll(' ','-'));
  fs.writeFileSync(producer,JSON.stringify(rows(JSON.parse(fs.readFileSync(producer)))));a.population.sha256=sha(producer);f.gate(3,/correspondence/);
 });
 test('producer bytes cannot be shortened under original hash',()=>{
  const {f,a,producer}=selectedFixture('shortened');const rows=JSON.parse(fs.readFileSync(producer));rows.splice(2,1);a.lines[0].refs.pop();fs.writeFileSync(producer,JSON.stringify(rows));f.gate(3,/hash/);
 });
 test('duplicate display keys on distinct physical lines retain distinct refs',()=>selectedFixture('duplicate-keys',{duplicateKeys:true}).f.gate(0));
 test('typed empty producer selection permits transport only',()=>{
  const {f}=selectedFixture('empty-selection',{empty:true});f.gate(0);f.snapshot.decisions=[];f.gate(3,/human decision/);
 });
 test('untyped empty input cannot pass through v2',()=>{
  const {f,a,keys}=selectedFixture('untyped-empty',{empty:true});fs.writeFileSync(keys,'');a.sha256=sha(keys);f.gate(3,/correspondence/);
 });
 test('exact repeated association is idempotent',()=>{
  const {f,a}=selectedFixture('repeat');f.records.push({type:'source-correspondence',data:structuredClone(a)});f.gate(0);
 });
 test('equivalent source and ref orderings are idempotent',()=>{
  const {f,a}=selectedFixture('equivalent-order');const equivalent=structuredClone(a);equivalent.sources.reverse();equivalent.lines.reverse();equivalent.lines.forEach(l=>l.refs.reverse());f.records.push({type:'source-correspondence',data:equivalent});f.gate(0);
 });
 test('correspondence does not settle relevance, dispositions, readiness or native evidence',()=>{
  const {f}=selectedFixture('independent-gates');f.gate(0);
  const judgments=f.snapshot.findingAcceptance;f.snapshot.findingAcceptance=[];f.gate(3,/relevance/);
  f.snapshot.findingAcceptance=judgments.map(j=>({...j,effect:'required'}));f.gate(3,/remains required/);
  f.snapshot.findingAcceptance=judgments;f.snapshot.evidence=[];f.gate(3,/suite/);
 });
}finally{
 console.log(`${passed} passed, ${failed} failed; fixture artifacts: ${tmp}`);
 if(!process.env.KEEP_FIXTURES)fs.rmSync(tmp,{recursive:true,force:true});
}
process.exitCode=failed?1:0;
