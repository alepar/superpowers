#!/usr/bin/env node
// Execute the actual coordinator, preserve its dispatch labels/results in Workflow journals,
// then consume them with the real profiler. Timestamps are bounded fixture ticks, not live timings.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { run, liveArgs, oneTaskCanned, extractLedgerLines } from './replay-harness.mjs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const tmp = mkdtempSync('/private/tmp/verification-settlement-')
const sha = x => x.repeat(40)
const identity = { sourceTree:sha('d'), command:'node smoke.mjs', configuration:'target=fixture' }
const basis = { completionKind:'verification-only', base:sha('a'), head:sha('a'), files:[],
  sourceTree:identity.sourceTree, evidence:[{...identity,kind:'live',outcome:'pass',location:'evidence/live.log'}], requiredLiveChecks:[identity] }
const canned = extra => oneTaskCanned({
  'impl:bd-101':{...basis,status:'IMPLEMENTED'}, 'review:bd-101':{...basis,status:'CLEAN'},
  'close-only:bd-101':{id:'bd-101',status:'CLOSED'}, 'close-check:bd-101':{closed:['bd-101']},
  'missing-blocker:bd-101':null, ...extra,
})
const args = liveArgs({rootAcceptance:'caller',deferSweep:true})
const replay = async extra => {
  const out = await run({args,canned:canned(extra)})
  assert.equal(out.error,null,out.error?.stack)
  return out
}
function profile(name,out, prior=false) {
  const dir=join(tmp,name);mkdirSync(dir)
  const agents=out.records.map(r=>({label:r.label,phase:r.phase,start:r.start,end:r.end,result:r.result}))
  if(prior) agents.unshift({label:'impl:bd-101',start:-10,end:-5,result:{status:'IMPLEMENTED'}},
                          {label:'merge:bd-101',start:-4,end:-2,result:{merged:true}})
  const scenario={t0:'2026-10-01T00:00:00Z',launch:{epicId:'bd',config:{concurrency:1}},agents}
  const file=join(dir,'scenario.json');writeFileSync(file,JSON.stringify(scenario))
  let p=spawnSync(process.execPath,[join(root,'tests/super-code/run-profile-fixture.mjs'),file,join(dir,'wf')],{encoding:'utf8'})
  assert.equal(p.status,0,p.stderr)
  p=spawnSync(process.execPath,[join(root,'skills/super-code/scripts/run-profile.mjs'),'--workflow',join(dir,'wf'),'--out',join(dir,'profile')],{encoding:'utf8'})
  assert.equal(p.status,0,p.stderr)
  return {data:JSON.parse(readFileSync(join(dir,'profile.json'),'utf8')),text:p.stdout}
}
let failures=0, passed=0
function check(name,fn){try{fn();console.log('PASS '+name);passed++}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack)}}
try {
  const pending=await replay({'close-only:bd-101':null})
  const retained=pending.trace.filter(t=>/^ledger/.test(t.label)).flatMap(t=>extractLedgerLines(t.prompt)).join('\n')
  assert(retained.includes('reviewed verification-only'))
  const resume={ 'read-ledger':{text:retained},'bd-ready':{ids:[]},
    'resume-check:bd-101':{landed:false,sourceVerified:true,closed:[],open:['bd-101']} }
  const cases=[
    ['fresh-success',{},true],
    ['resume-success',resume,true],
    ['close-check-failed',{'close-check:bd-101':{closed:[]}},false],
    ['close-check-unavailable',{'close-check:bd-101':null},false],
    ['finish-reconciled',{'close-check:bd-101':{closed:[]},'reconcile-buckets':{closed:['bd-101']}},true],
    ['finish-append-false',{'close-check:bd-101':{closed:[]},'reconcile-buckets':{closed:['bd-101']},'ledger:bd-101':{appended:false}},false],
    ['resume-already-closed-append-false',{...resume,'resume-check:bd-101':{landed:false,sourceVerified:true,closed:['bd-101'],open:[]},'ledger:bd-101':{appended:false}},false],
    ['append-unacknowledged',{'ledger:bd-101':{}},false],
    ['append-retry-success',{'ledger:bd-101':null,'ledger:bd-101:retry':{appended:true}},true],
    ['resume-already-closed-unacknowledged',{...resume,'resume-check:bd-101':{landed:false,sourceVerified:true,closed:['bd-101'],open:[]},'ledger:bd-101':{}},false],
    ['append-false',{'ledger:bd-101':{appended:false}},false],
    ['append-unavailable',{'ledger:bd-101':null,'ledger:bd-101:retry':null},false],
    ['resume-append-false',{...resume,'ledger:bd-101':{appended:false}},false],
    ['resume-already-closed',{...resume,'resume-check:bd-101':{landed:false,sourceVerified:true,closed:['bd-101'],open:[]}},true],
  ]
  for(const [name,extra,expected] of cases){
    const out=await replay(extra)
    check(name,()=>{
      assert.equal(out.result.completed.includes('bd-101'),expected,'coordinator settlement')
      if(name.startsWith('resume'))assert(!out.counts['impl:bd-101']&&!out.counts['review:bd-101'],'resume must exercise closure-only producer path')
      const {data,text}=profile(name,out), b=data.beads?.find(b=>b.id==='bd-101')
      assert(b,'task identity must survive the resumed settlement journal')
      assert.equal(b.landed,false,'verification is never a Git landing')
      assert.equal(b.landedAt,null)
      assert.equal(data.lane.merges,0)
      assert.equal(b.verificationOnlyCompleted,expected,'only durable coordinator settlement completes verification')
      assert.equal(text.includes('verification-only 1'),expected)
      const receipts=out.records.filter(r=>/^ledger:bd-101:verification-settlement(?::retry)?$/.test(r.label))
      if(expected)assert(receipts.some(r=>r.result?.appended===true),'completion requires typed acknowledged settlement')
      if(name.includes('close-check-'))assert.equal(receipts.length,0,'failed observation must not dispatch settlement')
    })
  }
  const done=await replay(resume)
  check('earlier-real-merge-preserved',()=>{const {data}=profile('prior',done,true),b=data.beads.find(b=>b.id==='bd-101');assert.equal(b.landed,true);assert.equal(b.landedAt,'2026-09-30T23:59:58.000Z');assert.equal(data.lane.merges,1);assert.equal(b.verificationOnlyCompleted,true)})
  const real=await replay({'impl:bd-101':{status:'ALREADY_MERGED',base:sha('a'),head:sha('b')}})
  check('real-already-merged-closure',()=>{const {data}=profile('landed',real),b=data.beads.find(b=>b.id==='bd-101');assert.equal(b.landed,true);assert.equal(b.verificationOnlyCompleted,false)})
  check('legacy-untyped-close-remains-unknown',()=>{const {data}=profile('legacy',{records:[{label:'plan',start:0,end:1,result:{mapping:[{id:'bd-101',n:1,deps:[]}]}},{label:'close-only:bd-101',start:2,end:3,result:{status:'CLOSED'}}]}),b=data.beads.find(b=>b.id==='bd-101');assert.equal(b.landed,false);assert.equal(b.verificationOnlyCompleted,false);assert(data.unmeasured.some(x=>x.includes('closure kind unknown')))})
} finally {rmSync(tmp,{recursive:true,force:true})}
console.log(`${passed} passed, ${failures} failed`)
process.exitCode=failures?1:0
