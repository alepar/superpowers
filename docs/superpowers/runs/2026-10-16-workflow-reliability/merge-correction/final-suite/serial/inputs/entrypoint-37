#!/usr/bin/env node
// Catch operational startup during prompt rendering, lost selected-Launch identity,
// and legacy non-review compatibility accidentally authorizing review writers.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const cli = join(root, 'skills/super-code/scripts/dispatch-text.mjs')
const tmp = mkdtempSync(join(os.tmpdir(), 'startup-builder-seam-'))
const base = 'a'.repeat(40), head = 'b'.repeat(40)
let checks = 0
const data = (name, value) => { const p = join(tmp, name); writeFileSync(p, value); return p }
const finding = data('finding', 'confirmed failure'), errors = data('errors', 'compiler error')
const empty = data('replies', '[]'), unreviewed = data('unreviewed', 'missing cluster')
const basis = data('basis', JSON.stringify({ id: 'ep.2', completionKind: 'verification-only', base, head: base, files: [], sourceTree: 'c'.repeat(40), status: 'CLEAN', reviewStatus: 'CLEAN', reportPath: '/retained/report', reviewPath: '/retained/review', acceptance: ['verified'], evidence: [{ sourceTree: 'c'.repeat(40), command: 'true', configuration: 'isolated', outcome: 'pass', location: '/retained/evidence', kind: 'live' }] }))
const common = ['--id','ep.2','--n','2']
const ordinary = [
  [['implement', ...common], 'implementer for task ep.2'],
  [['review', ...common, '--base',base,'--head',head], 'task-reviewer-prompt.md'],
  [['verification-close','--id','ep.2','--result-file',basis], 'verification-only'],
  ...['review','seam','check'].map(kind => [['fix',...common,'--base',base,'--kind',kind,'--finding-file',finding], 'fresh fixer for task ep.2']),
  [['seam-review',...common,'--base',base,'--merge-base',base,'--head',head,'--overlap','src/a'], 'post-rebase seam review'],
  [['check-fix-review',...common,'--pre-fix-head',base,'--head',head,'--errors-file',errors], 'review of a merge-check fix'],
  [['merge',...common,'--base',base], 'ep.2'],
  [['plan','--ids','ep.2'], 'planner-prompt.md'],
  [['triage','--id','ep.2','--blocker','ep.block'], 'triage-prompt.md'],
  [['check-evidence','--results-file',empty], '"requiredLiveChecks": []'],
  ...['roast-code','history','assess'].map(consumer => [['assemble','--consumer',consumer,'--instance','ep.2','--base',base,'--head',head], '/assembled/'+consumer+'-shared-ep.2']),
]
const sensitive = [
  ...['single','cluster','seam','stub'].map(mode => ['final-review','--mode',mode,'--base',base,'--head',head,'--dir','/bundle','--cluster','1','--name','alpha','--reviewed','none','--unreviewed',unreviewed]),
  ['assemble','--consumer','final-review','--instance','all','--base',base,'--head',head],
  ['bind-review-source','--read'],
]
// Instrument only the real loader boundary: if startup executes, fail before it
// can dispatch; check the config consumed by the actual coordinator declarations.
const hook = data('probe.mjs', `import fs from 'node:fs'; import { syncBuiltinESMExports } from 'node:module';
const read = fs.readFileSync; fs.readFileSync = function(path,...args) {
 let text = read.call(this,path,...args);
 if (String(path).endsWith('/super-code/coordinator.js')) {
  text = text.replace("const A = typeof args === 'string' ? JSON.parse(args) : args", "const A = typeof args === 'string' ? JSON.parse(args) : args\\nif (A.invocationId !== (process.env.EXPECT_ID || undefined)) throw new Error('selected Launch identity lost or fabricated')");
  text = text.replace("phase('Resume')", "throw new Error('operational Resume executed while rendering');\\nphase('Resume')");
 }
 return text;
}; syncBuiltinESMExports();
Date.now = () => { throw new Error('forbidden clock') }; Math.random = () => { throw new Error('forbidden random') };
`)
function run(ledger, args, id, overrides = [], stdout = true) {
 return spawnSync(process.execPath, ['--import',hook,cli,'--ledger',ledger,...(stdout ? ['--stdout'] : []),...overrides,...args], { cwd: root, encoding:'utf8', env: { ...process.env, EXPECT_ID: id || '' } })
}
function fixture(form, id, name) {
 const w = join(tmp,name), ws = join(w,'.superpowers/sdd/ep-plan');mkdirSync(ws,{recursive:true})
 const ledger = join(ws,'progress.md'), retained = join(ws,'final-review-older.md')
 const facts = { epicId:'ep',integrationBranch:'feat/x',integrationWorktree:w,runTag:'shared', ...(id === undefined ? {} : {invocationId:id}),config:{} }
 const launch = form === 'json' ? 'Launch: args '+JSON.stringify(facts) : 'Launch: mechanism ordinary-subagents · epic ep · branch feat/x · integrationWorktree '+w+' · runTag shared'+(id === undefined ? '' : ' · invocationId '+id)
 writeFileSync(ledger,'Launch: args '+JSON.stringify({...facts,invocationId:'older-id'})+'\n'+launch+'\n')
 writeFileSync(retained,'retained finding bytes\n')
 return { w,ws,ledger,retained }
}
try {
 for (const form of ['json','ordinary']) for (const id of ['selected-id',undefined]) {
  const f = fixture(form,id,form+'-'+(id || 'legacy')), before = readFileSync(f.ledger), retained = readFileSync(f.retained)
  for (const [args,want] of ordinary) {
   const r = run(f.ledger,args,id); assert.equal(r.status,0,form+'/'+id+'/'+args[0]+': '+r.stderr);assert.ok(r.stdout.includes(want),args[0]+' missing '+want);checks++
  }
  for (const args of sensitive) {
   const r = run(f.ledger,args,id)
   if (id && args[0] !== 'bind-review-source') {
    assert.equal(r.status,0,r.stderr);assert.ok(r.stdout.includes('--invocation-id \'selected-id\''));assert.ok(r.stdout.includes(base) && r.stdout.includes(head));checks++
   } else if (!id) {
    assert.notEqual(r.status,0);assert.match(r.stderr,/persisted filesystem-safe Launch invocationId/);assert.equal(r.stdout,'');checks++
    const override = run(f.ledger,args,id,['--invocation-id','cli-token']);assert.notEqual(override.status,0);assert.equal(override.stdout,'');checks++
   }
  }
  assert.deepEqual(readFileSync(f.ledger),before);assert.deepEqual(readFileSync(f.retained),retained)
  assert.deepEqual(readdirSync(f.ws).sort(),['final-review-older.md','progress.md']);checks++
 }
 // Existing no-Launch overrides remain supported without inventing identity.
 const f = fixture('json',undefined,'overrides');writeFileSync(f.ledger,'# legacy ledger\n')
 const overrides = ['--epic','ep','--branch','feat/x','--worktree',f.w,'--run-tag','shared']
 for (const [args,want] of ordinary) { const r = run(f.ledger,args,undefined,overrides);assert.equal(r.status,0,r.stderr);assert.ok(r.stdout.includes(want));checks++ }
 // Unsafe persisted identity never authorizes review; a CLI token is not persistence.
 const bad = fixture('json','../unsafe','unsafe')
 for (const args of sensitive) { const r = run(bad.ledger,args,undefined);assert.notEqual(r.status,0);assert.match(r.stderr,/persisted filesystem-safe Launch invocationId/);assert.equal(r.stdout,'');checks++ }
 const mismatch = fixture('json','selected-id','mismatch')
 for (const args of sensitive) { const r = run(mismatch.ledger,args,'selected-id',['--invocation-id','different']);assert.notEqual(r.status,0);assert.match(r.stderr,/must match/);checks++ }
 const out = run(f.ledger,['implement',...common],undefined,overrides,false);assert.equal(out.status,0,out.stderr)
 assert.ok(out.stdout.trim().endsWith('/dispatch/impl-ep.2.md'));assert.match(readFileSync(out.stdout.trim(),'utf8'),/implementer for task ep.2/);checks++
 console.log('PASS: '+checks+' startup/builder seam checks; real CLI, both Launch forms, all ordinary modes, strict review gates, no startup or ledger/artifact mutation')
} finally { rmSync(tmp,{recursive:true,force:true}) }
