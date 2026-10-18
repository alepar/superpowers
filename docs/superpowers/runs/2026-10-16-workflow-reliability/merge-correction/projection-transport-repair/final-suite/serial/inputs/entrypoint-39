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
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'acceptance-population-'));
const tree='a'.repeat(40), other='b'.repeat(40);
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
function ledger(f,loop,reports,override=true){
 const out=path.join(f.dir,'ledger-'+loop+'.md'),overrides=path.join(f.dir,'overrides-'+loop+'.md');
 fs.writeFileSync(overrides,override?'[Blocking] same.js:1 · disputed@r1 (preserve original disagreement)\n':'');
 cli('bash',[path.join(root,'skills/super-design/scripts/findings-ledger'),'--loop',loop,'--out',out,...reports.flatMap((r,i)=>['--report',`${i+1}=${r}`]),'--overrides',overrides]);
 f.declarations.push(`${loop==='design'?'findingsLedgerDesign':'findingsLedger'}: ${path.basename(out)}`);return out;
}
function relevance(source,effect='nonblocking'){
 return {ref:{source:source.source,section:'Confirmed findings',position:1},judgment:'supported',effect,requirement:'review',basis:'fixture scope judgment of this exact occurrence',evidence:[source.artifact+'#Confirmed findings:1']};
}
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function correspondence(artifact,source){return {version:1,artifact,sha256:sha(artifact),source:source.source,retainedArtifact:source.artifact,retainedSha256:sha(source.artifact),judgment:'supported',basis:'fixture independent review establishes complete original source correspondence',evidence:[artifact+'#raw-review',source.artifact+'#completeness-review']}}

try{
 console.log('test source identities: '+JSON.stringify({head:cli('git',['rev-parse','HEAD'],root).trim(),reportStatusSha256:sha(path.join(scripts,'report-status')),testSha256:sha(fileURLToPath(import.meta.url))}));
 test('recognized empty source and independent prerequisites pass',()=>fixture('empty').gate(0));
 for(const loop of ['design','code']){
  for(const severity of ['Blocking','Should-fix']){
   test(`${loop}: ${severity} ledger truncation cannot supply ledger-only population`,()=>{
    const f=fixture(loop+'-'+severity+'-ledger-only'),original=roast(f,'original.md',`- [${severity}] same.js:1 — preserved concern`),file=ledger(f,loop,[original],false);
    fs.writeFileSync(file,fs.readFileSync(file,'utf8').split('\n').slice(0,4).join('\n')+'\n');
    f.gate(3,/ledger.*(population|incomplete|contradic)/i);
   });
   test(`${loop}: ${severity} ledger truncation remains gap after supported source relevance`,()=>{
    const f=fixture(loop+'-'+severity+'-declared'),original=roast(f,'original.md',`- [${severity}] same.js:1 — preserved concern`),file=ledger(f,loop,[original],false);
    const source=extract(original,`roast-${loop}/round-1`);f.sources.push(source);f.declarations.push(`roast-${loop}: original.md`);f.snapshot.findingAcceptance=[relevance(source)];
    f.gate(0);fs.writeFileSync(file,fs.readFileSync(file,'utf8').split('\n').slice(0,4).join('\n')+'\n');
    f.gate(3,/ledger.*(population|incomplete|contradic)/i);
   });
  }
  test(`${loop}: genuine empty ledger without caller population stays unknown`,()=>{
   const f=fixture(loop+'-empty-unknown'),original=roast(f,'original.md','None');ledger(f,loop,[original],false);
   f.gate(3,/ledger.*population/i);
  });
  test(`${loop}: genuine empty ledger with complete declared source passes`,()=>{
   const f=fixture(loop+'-empty-declared'),original=roast(f,'original.md','None');ledger(f,loop,[original],false);
   f.declarations.push(`roast-${loop}: original.md`);f.sources.push(extract(original,`roast-${loop}/round-1`));f.gate(0);
  });
  test(`${loop}: real disputed ledger cannot hide behind unrelated clean review`,()=>{
   const f=fixture(loop+'-disputed'),original=roast(f,'round-1.md'),ledgerFile=ledger(f,loop,[original]);
   assert.match(fs.readFileSync(ledgerFile,'utf8'),/disputed@r1/);
   f.gate(3,/coverage|population|reconcil/i);
  });
  test(`${loop}: resumed declared source needs exact extraction and relevance`,()=>{
   const f=fixture(loop+'-resume'),original=roast(f,'round-1.md');ledger(f,loop,[original]);
   f.declarations.push(`roast-${loop}: round-1.md`);
   const source=extract(original,`roast-${loop}/round-1`);f.sources.push(source);
   f.gate(3,/relevance unproven/);
   f.snapshot.findingAcceptance=[relevance(source,'required')];f.gate(3,/remains required/);
   f.snapshot.findingAcceptance=[relevance(source)];
   const result=f.gate(0);assert.deepEqual(result.nonblockingFindings,[relevance(source).ref]);
   const status=cli('bash',[path.join(scripts,'report-status'),f.run]);assert.match(status,/1 unresolved Blocking/);
   // Idempotent caller append retains exactly the same immutable occurrence.
   f.sources.push(structuredClone(source));f.gate(0);
   const projection=JSON.parse(cli('bash',[path.join(scripts,'scope-dispositions'),'--project',f.run]));assert.equal(projection.findings.length,1);assert.equal(projection.findings[0].outstanding,true);
   f.snapshot.findingAcceptance=[];f.records.push({type:'finding-disposition',data:{ref:relevance(source).ref,disposition:'resolved',judgment:'supported',basis:'fixture verified repair',evidence:['repair.log'],verification:'exact regression passed against repaired source'}});f.gate(0);
   f.records[0].data.disposition='rejected';delete f.records[0].data.verification;f.gate(0);
  });
  test(`${loop}: later silent round never supplies local disposition`,()=>{
   const f=fixture(loop+'-silence'),one=roast(f,'one.md'),two=roast(f,'two.md','None');
   const file=ledger(f,loop,[one,two],false);assert.match(fs.readFileSync(file,'utf8'),/resolved@r2/);
   f.declarations.push(`roast-${loop}: one.md, two.md`);
   const source=extract(one,`roast-${loop}/round-1`);f.sources.push(source,extract(two,`roast-${loop}/round-2`));
   f.gate(3,/relevance unproven/);f.snapshot.findingAcceptance=[relevance(source,'required')];f.gate(3,/remains required/);
  });
  test(`${loop}: stale ledger pointer to now-clean report is inconsistent evidence`,()=>{
   const f=fixture(loop+'-stale'),original=roast(f,'original.md');ledger(f,loop,[original]);
   roast(f,'original.md','None');f.sources.push(extract(original,`roast-${loop}/round-1`));
   f.gate(3,/ledger.*(consistency|inconsistent|key)|key.*ledger/i);
  });
 }
 for(const variant of ['missing-ledger','malformed-ledger','missing-report','unknown-empty','truncated-report','forged-empty-extraction','same-key-other-path'])test(variant+' remains explicit source coverage gap',()=>{
  const f=fixture(variant);
  if(variant.endsWith('ledger')){
   f.declarations.push('findingsLedgerDesign: absent.md');
   if(variant==='malformed-ledger')fs.writeFileSync(path.join(f.dir,'absent.md'),'# findings ledger — design — through r1\n- truncated\n');
  }else{
   f.declarations.push('roast-design: original.md');
   if(variant==='unknown-empty')fs.writeFileSync(path.join(f.dir,'original.md'),'');
   if(variant==='truncated-report')fs.writeFileSync(path.join(f.dir,'original.md'),'super-roast verdict: CLEAN\n## Confirmed findings\n');
   if(variant==='forged-empty-extraction'||variant==='same-key-other-path'){
    const original=roast(f,'original.md');
    const source=extract(variant==='same-key-other-path'?roast(f,'unrelated.md'):original,'roast-design/round-1');
    if(variant==='forged-empty-extraction')source.occurrences=[];
    f.sources.push(source);f.snapshot.findingAcceptance=[relevance(source)];
   }
  }
  f.gate(3,/coverage|population|reconcil/i);
 });
 test('explicit linked occurrences retain both original refs without duplicate judgment',()=>{
  const f=fixture('linked'),a=roast(f,'one.md'),b=roast(f,'two.md');f.declarations.push('roast-code: one.md, two.md');
  const sources=[extract(a,'roast-code/round-1'),extract(b,'roast-code/round-2')];f.sources.push(...sources);
  f.snapshot.findingAcceptance=[relevance(sources[0])];f.gate(3,/relevance unproven/);
  f.records.push({type:'finding-link',data:{refs:sources.map(s=>relevance(s).ref),basis:'reviewed explicit repeated occurrence'}});
  assert.equal(f.gate(0).nonblockingFindings.length,2);
 });
 test('same-byte retained archive needs explicit correspondence and rejects conflicting identities',()=>{
  const f=fixture('archive'),original=roast(f,'original.md'),retained=path.join(f.dir,'archive.md');fs.copyFileSync(original,retained);
  const source=extract(retained,'roast-code/round-1');f.sources.push(source);f.declarations.push('roast-code: original.md');f.snapshot.findingAcceptance=[relevance(source)];
  f.gate(3,/coverage/);
  const association=correspondence(original,source);f.records.push({type:'source-correspondence',data:association});f.gate(0);
  f.records.push({type:'source-correspondence',data:structuredClone(association)});f.gate(0);
  const unrelated=extract(retained,'unrelated/round-1');f.sources.push(unrelated);f.snapshot.findingAcceptance.push(relevance(unrelated));
  f.records.push({type:'source-correspondence',data:correspondence(original,unrelated)});f.gate(3,/conflicting immutable source correspondence/);
 });
 test('additional verified archive copy preserves the same source identity',()=>{
  const f=fixture('archive-copy'),original=roast(f,'original.md'),copy=path.join(f.dir,'copy.md');fs.copyFileSync(original,copy);
  const source=extract(copy,'roast-design/round-1');f.sources.push(source);f.declarations.push('roast-design: original.md');f.snapshot.findingAcceptance=[relevance(source)];
  f.records.push({type:'source-correspondence',data:correspondence(original,source)});f.gate(0);
  const next=path.join(f.dir,'copy-next.md');fs.copyFileSync(copy,next);const duplicate=extract(next,source.source);f.sources.push(duplicate);
  f.records.push({type:'source-correspondence',data:correspondence(original,duplicate)});f.gate(0);
 });
 test('real ledger repo-relative text pointer resolves independently of caller cwd',()=>{
  const f=fixture('repo-relative');cli('git',['init','-q',f.dir]);
  fs.mkdirSync(path.join(f.dir,'reports'));const original=roast(f,'reports/round.md');
  cli('bash',[path.join(root,'skills/super-design/scripts/findings-ledger'),'--loop','design','--out','ledger.md','--report','1=reports/round.md'],f.dir);
  const runDir=path.join(f.dir,'run');fs.mkdirSync(runDir);fs.copyFileSync(path.join(f.dir,'ledger.md'),path.join(runDir,'ledger.md'));
  f.declarations.push('findingsLedgerDesign: ledger.md','roast-design: ../reports/round.md');const source=extract(original,'roast-design/round-1');f.sources.push(source);f.snapshot.findingAcceptance=[relevance(source)];f.write();
  const run=path.join(runDir,'run.md');fs.copyFileSync(f.run,run);
  const result=JSON.parse(cli('bash',[path.join(scripts,'report-status'),'--acceptance',run,'--tree',tree],tmp));assert.equal(result.eligible,true);
 });
 test('supported legacy adapter preserves original source and verdict with both hashes',()=>{
  const f=fixture('adapter'),original=roast(f,'original.md','- None\n  retained historical explanatory text');
  const retained=roast(f,'retained.md','- [Blocking] same.js:1 — complete interpreted original concern');
  const source=extract(retained,'roast-design/round-1');f.sources.push(source);f.declarations.push('roast-design: original.md');
  const raw=fs.readFileSync(original,'utf8');f.snapshot.findingAcceptance=[relevance(source)];f.gate(3,/coverage/);
  const association={...correspondence(original,source),interpretation:{kind:'legacy-adapter',originalVerdict:'NEEDS FIX',limitations:['Original strict extraction fails on mixed None/explanation; this is a reviewed interpretation, not the raw report.']}};
  f.records.push({type:'source-correspondence',data:association});f.gate(0);
  assert.equal(fs.readFileSync(original,'utf8'),raw);
  for(const mutate of [a=>a.sha256='0'.repeat(64),a=>a.retainedSha256='0'.repeat(64),a=>a.judgment='unsupported',a=>a.evidence=[],a=>delete a.interpretation,a=>a.interpretation.originalVerdict='CLEAN',a=>a.source='unrelated/final']){
   const invalid=structuredClone(association);mutate(invalid);f.records[0].data=invalid;f.gate(3,/coverage|correspondence/);
  }
  f.records[0].data=association;f.sources[1].occurrences=[];f.gate(3,/coverage|correspondence/);
 });
 test('real final-review keys ledger requires supported exact complete line mapping',()=>{
  const f=fixture('keys'),original=roast(f,'clean-roast.md','None'),final=path.join(f.dir,'original-final.md');
  fs.writeFileSync(final,'## Verdict\nnot ready\n## Must fix before landing\n- first defect\n- second defect\n## Untested scope\nNone\n');
  const source=extract(final,'inv-keys/final');f.sources.push(source);
  const refs=source.occurrences.map(o=>({source:source.source,section:o.section,position:o.position}));
  f.snapshot.findingAcceptance=refs.map(ref=>({...relevance(source),ref}));
  const keys=path.join(f.dir,'review.keys');fs.writeFileSync(keys,'review: not ready\n'+cli('bash',[path.join(code,'scripts/report-verdict'),'--keys',final]));
  const out=path.join(f.dir,'ledger.md');cli('bash',[path.join(root,'skills/super-design/scripts/findings-ledger'),'--loop','code','--out',out,'--report','1='+original,'--final-review','1='+keys]);
  f.declarations.push('findingsLedger: ledger.md','roast-code: clean-roast.md, review.keys');f.sources.push(extract(original,'roast-code/round-1'));f.gate(3,/coverage|correspondence/);
  const association={...correspondence(keys,source),lines:[{line:2,refs:[refs[0]]},{line:3,refs:[refs[1]]}]};
  f.records.push({type:'source-correspondence',data:association});f.gate(0);
  const completeDeclaration=f.declarations.at(-1);
  f.declarations[f.declarations.length-1]='roast-code: clean-roast.md';f.gate(3,/population|undeclared/);
  f.declarations[f.declarations.length-1]=completeDeclaration;
  for(const mutate of [a=>a.lines.pop(),a=>a.lines.push(a.lines[0]),a=>a.lines[0].line=1,a=>a.lines[0].refs=[],a=>a.lines[0].refs[0].source='unrelated/final',a=>a.source='unrelated/final',a=>a.sha256='0'.repeat(64)]){
   const invalid=structuredClone(association);mutate(invalid);f.records[0].data=invalid;f.gate(3,/coverage|correspondence/);
  }
  f.records[0].data=association;fs.appendFileSync(keys,'[Must-fix] later unaccounted concern\n');f.gate(3,/coverage|correspondence/);
 });
 for(const review of ['ready','none'])test('declared empty final-review keys '+review+' retain typed correspondence',()=>{
  const f=fixture('empty-keys-'+review),original=roast(f,'clean-roast.md','None'),final=path.join(f.dir,'retained.md'),keys=path.join(f.dir,'unhelpful-name.data');
  fs.writeFileSync(final,'## Verdict\n'+(review==='none'?'no work landed':'ready')+'\n## Must fix before landing\n- none\n## Untested scope\n- none\n## Deferred OK\n- none\n');
  const source=extract(final,'empty-'+review+'/final');f.sources.push(source,extract(original,'roast-code/round-1'));
  fs.writeFileSync(keys,'review: '+review+'\n'+cli('bash',[path.join(code,'scripts/report-verdict'),'--keys',final]));
  const out=path.join(f.dir,'ledger.md');cli('bash',[path.join(root,'skills/super-design/scripts/findings-ledger'),'--loop','code','--out',out,'--report','1='+original,'--final-review','1='+keys]);
  f.declarations.push('findingsLedger: ledger.md','roast-code: clean-roast.md, unhelpful-name.data');
  f.gate(3,/correspondence|coverage/);
  f.records.push({type:'source-correspondence',data:{...correspondence(keys,source),lines:[]}});f.gate(0);
  f.records[0].data.lines=[{line:1,refs:[]}];f.gate(3,/correspondence/);
 });
 test('actual immutable reviewSource producer is metadata, not a measurement',()=>{
  const f=fixture('source-binding'),progress=path.join(f.dir,'progress.md');
  fs.writeFileSync(progress,`Launch: mechanism ordinary-subagents · epic fixture · branch fixture · integrationWorktree ${f.dir} · invocationId inv-fixture\n`);
  cli('node',[path.join(code,'scripts/dispatch-text.mjs'),'--ledger',progress,'bind-review-source','--base',tree,'--head',other]);
  const record=JSON.parse(fs.readFileSync(progress,'utf8').split('\n').find(l=>l.startsWith('Recovery: ')).slice(10));
  f.snapshot.recovery.obligations=[record];f.gate(0);
  for(const mutate of [r=>delete r.data.reviewSource,r=>r.data.reviewSource=null,r=>r.id='wrong',r=>r.data.reviewSource.invocationId='other',r=>r.data.reviewSource.base='x',r=>r.kind='hold',r=>r.data.command='native']){
   const malformed=structuredClone(record);mutate(malformed);f.snapshot.recovery.obligations=[malformed];f.gate(3,/review.source|provenance/i);
  }
  f.snapshot.recovery.obligations=[record];f.write();const earlier=fs.readFileSync(f.run,'utf8');
  const conflict=structuredClone(f.snapshot);conflict.recovery.obligations[0].data.reviewSource.head=tree;
  fs.appendFileSync(f.run,'- root-acceptance · '+JSON.stringify(conflict)+'\n');
  const result=JSON.parse(cli('bash',[path.join(scripts,'report-status'),'--acceptance',f.run],f.dir,3));assert.match(JSON.stringify(result),/conflict.*review.source|review.source.*conflict/i);assert(fs.readFileSync(f.run,'utf8').startsWith(earlier));
 });
 test('genuine deferred live check still requires matching live evidence',()=>{
  const f=fixture('live-check'),progress=path.join(f.dir,'progress.md'),results=path.join(f.dir,'results.json');
  fs.writeFileSync(progress,`Launch: mechanism ordinary-subagents · epic fixture · branch fixture · integrationWorktree ${f.dir} · invocationId inv-live\n`);
  const identity={id:'leaf',sourceTree:tree,command:'native',configuration:'hardware'};
  const obligation={version:1,id:'native-deferred',kind:'deferred',operation:'record',reason:'required hardware check',evidence:['review.md'],data:identity};
  f.snapshot.recovery.obligations=[obligation];
  for(const kind of ['fallback','live']){
   fs.writeFileSync(results,JSON.stringify([{dispatch:'review:leaf',result:{id:'leaf',evidence:[{...identity,kind,outcome:'pass',location:'native.log'}],requiredLiveChecks:[identity]}}]));
   f.snapshot.checkEvidence=JSON.parse(cli('node',[path.join(code,'scripts/dispatch-text.mjs'),'--ledger',progress,'--stdout','check-evidence','--results-file',results]));
   f.gate(kind==='live'?0:3,kind==='fallback'?/native/:undefined);
  }
 });
 test('actual pre-run attribution retains earlier same-tree contradiction gaps',()=>{
  // Load the unchanged real attribution producer, without dispatching a Workflow session.
  const source=fs.readFileSync(path.join(code,'coordinator.js'),'utf8');
  const classify=new Function(source.slice(source.indexOf('function classifyRunFailure('),source.indexOf('\nfunction runFailures('))+'\nreturn classifyRunFailure;')();
  const identity={failure:'F',command:'smoke',configuration:'local'};
  const record=(sourceTree,outcome)=>({sourceTree,outcome,command:'smoke',configuration:'local',location:outcome+'.log',kind:'live'});
  const history=[{task:'leaf',dispatch:'review:leaf',claim:{...identity,observed:0,runBaseline:1},evidence:[record(tree,'fail'),record(tree,'pass')]},
   {task:'later',dispatch:'review:later',claim:{...identity,observed:0,runBaseline:1},evidence:[record(other,'fail'),record(tree,'fail')]}];
  const f=fixture('pre-run');const failure={id:'F',...classify({...identity,history})};
  assert.equal(failure.classification,'pre-run');assert.match(failure.gaps.join('\n'),/opposite outcomes at the same source tree/);
  f.snapshot.runFailures=[failure];f.gate(3,/opposite outcomes at the same source tree/);
  f.snapshot.runFailures=[{id:'F',...classify({...identity,history:history.slice(1)})}];f.gate(0);
 });
}finally{
 console.log(`${passed} passed, ${failed} failed; fixture artifacts: ${tmp}`);
 if(!process.env.KEEP_FIXTURES)fs.rmSync(tmp,{recursive:true,force:true});
}
process.exitCode=failed?1:0;
