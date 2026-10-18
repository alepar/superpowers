#!/usr/bin/env node
// Breaks caught: treating captured history copies as independent archive owners;
// trusting unverifiable mirror declarations; allowing mirrors to weaken source validation.
// All collection manifests and archived reports below come from the real collector.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'collection-origin-selection-'));
const repo=path.join(tmp,'repo'), workspace=path.join(tmp,'workspace');
const run='docs/source/run.md', copy='fixtures/proposal/run.md', sidecar=copy+'.collection-origin.json';
const ledger=path.join(tmp,'progress.md');
const dt=path.join(root,'skills/super-code/scripts/dispatch-text');
const collector=path.join(root,'skills/super-auto/scripts/report-status');
const write=(relative,text)=>{const file=path.join(repo,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text)};
const sha=text=>createHash('sha256').update(text).digest('hex');
const git=(...args)=>cp.execFileSync('git',['-c','maintenance.auto=false','-c','gc.auto=0',...args],{cwd:repo,encoding:'utf8'}).trim();
let serial=0, passed=0, failed=0;
function commit(){git('add','.');git('commit','--allow-empty','-qm','fixture '+serial++);return git('rev-parse','HEAD')}
function test(name,body){if(process.env.TEST_FILTER&&!name.includes(process.env.TEST_FILTER))return;git('reset','--hard',origin);git('clean','-fdq');launch();try{body();passed++;console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack)}}
function launch(invocationId='reviewer',reviewRunFile){fs.writeFileSync(ledger,'Launch: args '+JSON.stringify({epicId:'fixture',integrationBranch:'fixture',integrationWorktree:repo,invocationId,reviewRunFile})+'\n')}
function select(base,head,extra=[]){
 const out=path.join(tmp,'selection-'+serial++);
 const result=cp.spawnSync('bash',[dt,'review-inputs','--ledger',ledger,'--base',base,'--head',head,'--out-dir',out,...extra],{cwd:repo,encoding:'utf8'});
 assert(fs.existsSync(path.join(out,'review-inputs.json')),result.stdout+result.stderr);
 return {result,data:JSON.parse(fs.readFileSync(path.join(out,'review-inputs.json'),'utf8'))};
}
function good(selection){assert.equal(selection.result.status,0,selection.result.stdout+selection.result.stderr);assert.deepEqual(selection.data.gaps,[]);assert.equal(selection.data.wholeRangeReady,false);return selection.data}
function bad(selection){assert.equal(selection.result.status,3,selection.result.stdout+selection.result.stderr);assert(selection.data.gaps.length,'invalid declaration must expose an evidence gap');assert.deepEqual(selection.data.omitted,[],'refusal grants no omission authority');assert.equal(selection.data.wholeRangeReady,false)}
function declaration(text=copyText){return {version:1,kind:'collection-history-mirror',copySha256:sha(text),origin:{commit:origin,run,sha256:sha(sourceText)}}}
function mirror(text=copyText,decl=declaration(text)){write(copy,text);write(sidecar,JSON.stringify(decl)+'\n')}
function head(){return commit()}
function collect(id){
 fs.mkdirSync(workspace,{recursive:true});
 const report=path.join(workspace,'final-review-'+id+'.md');
 fs.writeFileSync(report,'## Verdict\nnot ready\n## Must fix before landing\n- product.txt:1 — original concern '+id+'\n## Untested scope\nnone\n');
 fs.writeFileSync(report+'.diff','diff --git a/product.txt b/product.txt\n--- a/product.txt\n+++ b/product.txt\n@@ -1 +1 @@\n-before\n+after\n');
 fs.writeFileSync(path.join(workspace,'plan.md'),'required exact plan\n');
 const result=cp.spawnSync('bash',[collector,'--collect',path.join(repo,run),'--invocation',id,'--workspace',workspace,'--review',report,'--verdict','not ready','--required','plan.md'],{cwd:repo,encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+result.stderr);
 assert.match(result.stdout,/collection: complete/);
}
fs.mkdirSync(repo,{recursive:true});git('init','-q');git('config','user.email','fixture@example.test');git('config','user.name','Fixture');
fs.writeFileSync(ledger,'Launch: args '+JSON.stringify({epicId:'fixture',integrationBranch:'fixture',integrationWorktree:repo,invocationId:'reviewer'})+'\n');
write(run,'phase: code\napprovals:\n');write('product.txt','before\n');const productBase=commit();
write('product.txt','after\n');collect('one');commit();collect('two');const origin=commit();
const sourceText=fs.readFileSync(path.join(repo,run),'utf8');
const collectionLines=sourceText.split('\n').filter(line=>line.startsWith('- review-collection'));
assert(collectionLines.length>=2,'real collector produced complete ordered history');
const copyText='# Schema proposal: captured run example\n'+sourceText+'\nProposal commentary outside collection history.\n';
const archive='docs/source/reviews/one';
const report=archive+'/final-review-one.md', required=archive+'/plan.md';

// Baseline control proves the fixture is a genuinely valid archive, independent of mirrors.
test('real collector history validates without any mirror',()=>{
 const data=good(select(productBase,origin));assert(data.archives.some(a=>a.run===run&&a.invocationId==='one'));assert(data.changed.includes(report));assert(data.changed.includes(required));assert(data.omitted.some(o=>o.path===archive+'/final-review-one.md.diff'));
});
test('declared proposal copy preserves source archives and ordinary changed inputs',()=>{
 mirror();const data=good(select(productBase,head()));
 for(const p of ['product.txt',run,copy,sidecar,report,required])assert(data.changed.includes(p),'retains '+p);
 assert(data.archives.every(a=>a.run===run),'mirror grants no independent archive authority');
 assert(data.archives.some(a=>a.invocationId==='two'));
 assert(data.omitted.length>0);assert(data.omitted.every(o=>o.run===run));
});
test('captured reviews symlink is preserved without dereferencing its absolute target',()=>{
 mirror();fs.symlinkSync('/unavailable/absolute/archive',path.join(repo,'fixtures/proposal/reviews'));
 const data=good(select(productBase,head()));assert(data.changed.includes('fixtures/proposal/reviews'));
});
test('captured declaration ignores mutated uncommitted mirror and sidecar',()=>{
 mirror();const captured=head();write(copy,'broken checkout');write(sidecar,'invalid checkout');good(select(productBase,captured));
});
test('origin history may append later complete collection records',()=>{
 mirror();collect('three');good(select(productBase,head()));
});
test('exact identical base copy may recover its declaration from captured head',()=>{
 write(copy,copyText);const base=head();write(sidecar,JSON.stringify(declaration())+'\n');
 const data=good(select(base,head()));assert(data.changed.includes(sidecar));
});
test('head declaration cannot classify a different base copy',()=>{
 write(copy,copyText+'different base prose\n');const base=head();mirror();bad(select(base,head()));
});
test('head declaration cannot suppress independently corrupt base source archive',()=>{
 write(copy,copyText);write(required,'corrupt base required input\n');const base=head();
 write(required,'required exact plan\n');write(sidecar,JSON.stringify(declaration())+'\n');bad(select(base,head()));
});
for(const [name,mutate] of [
 ['copy hash mismatch',d=>d.copySha256='0'.repeat(64)],
 ['source blob hash mismatch',d=>d.origin.sha256='0'.repeat(64)],
 ['unavailable origin commit',d=>d.origin.commit='f'.repeat(40)],
 ['abbreviated origin commit',d=>d.origin.commit=origin.slice(0,12)],
 ['unsafe source path',d=>d.origin.run='../source/run.md'],
 ['noncanonical source path',d=>d.origin.run='docs/./source/run.md'],
 ['missing source path',d=>d.origin.run='missing/run.md'],
 ['wrong declaration kind',d=>d.kind='collection-copy'],
 ['unsupported declaration version',d=>d.version=2]
])test(name+' fails closed',()=>{const d=declaration();mutate(d);mirror(copyText,d);bad(select(productBase,head()))});
test('malformed JSON declaration fails closed',()=>{mirror();write(sidecar,'{broken');bad(select(productBase,head()))});
test('untracked declaration supplies no captured authority',()=>{write(copy,copyText);const captured=head();write(sidecar,JSON.stringify(declaration()));bad(select(productBase,captured))});
test('partial source history cannot masquerade as a complete mirror',()=>{
 const text=copyText.replace(collectionLines[0]+'\n','');mirror(text);bad(select(productBase,head()));
});
test('reordered history cannot masquerade as a complete mirror',()=>{
 const text=copyText.replace(collectionLines[0],'PLACEHOLDER').replace(collectionLines[1],collectionLines[0]).replace('PLACEHOLDER',collectionLines[1]);mirror(text);bad(select(productBase,head()));
});
test('raw record rewriting is not exact history even with equivalent JSON',()=>{
 const text=copyText.replace(collectionLines[0],'- review-collection · '+JSON.stringify(JSON.parse(collectionLines[0].split(' · ')[1]),null,0).replaceAll(':',': '));mirror(text);bad(select(productBase,head()));
});
test('malformed mirror collection is still parsed and refused',()=>{const text=copyText+'- review-collection · {broken\n';mirror(text);bad(select(productBase,head()))});
test('conflicting historical mirror identity is still refused',()=>{
 const r=JSON.parse(collectionLines[0].split(' · ')[1]);r.workspace='/different/workspace';
 const text=copyText+'- review-collection · '+JSON.stringify(r)+'\n';mirror(text);bad(select(productBase,head()));
});
test('origin history replacement cannot be hidden by immutable earlier source',()=>{
 mirror();write(run,sourceText.replace(collectionLines[0]+'\n',''));bad(select(productBase,head()));
});
test('copy cannot authenticate as its own source',()=>{
 write(copy,copyText);const own=head();const d=declaration();d.origin={commit:own,run:copy,sha256:sha(copyText)};write(sidecar,JSON.stringify(d));bad(select(productBase,head()));
});
test('available but nonancestor origin commit is refused',()=>{
 // The object exists locally, but is not in the captured endpoint ancestry.
 const tree=git('rev-parse',origin+'^{tree}');
 const detached=git('commit-tree',tree,'-p',productBase,'-m','unmerged sibling origin');
 const d=declaration();d.origin.commit=detached;mirror(copyText,d);bad(select(productBase,head()));
});
test('source run must be a captured regular file',()=>{
 fs.mkdirSync(path.join(repo,'source-link'));fs.symlinkSync('/unavailable/source/run.md',path.join(repo,'source-link/run.md'));
 const linked=head();const d=declaration();d.origin={commit:linked,run:'source-link/run.md',sha256:sha('/unavailable/source/run.md')};
 mirror(copyText,d);bad(select(productBase,head()));
});
test('mirror chain cannot manufacture a second archive owner',()=>{
 mirror();const first=head();
 const second='fixtures/second/run.md', secondText='# second proposal\n'+copyText;
 write(second,secondText);write(second+'.collection-origin.json',JSON.stringify({version:1,kind:'collection-history-mirror',copySha256:sha(secondText),origin:{commit:first,run:copy,sha256:sha(copyText)}}));
 bad(select(productBase,head()));
});
test('current run cannot be declared a mirror',()=>{
 const d=declaration(sourceText);write(run+'.collection-origin.json',JSON.stringify(d));bad(select(productBase,head()));
});
test('duplicate nonmirror source identities remain ambiguous',()=>{
 mirror();write('other/run.md',sourceText);fs.cpSync(path.join(repo,'docs/source/reviews'),path.join(repo,'other/reviews'),{recursive:true});bad(select(productBase,head()));
});
test('mirror with regular sibling archive subtree is refused',()=>{mirror();write('fixtures/proposal/reviews/unclaimed.txt','ordinary but conflicting archive ownership');bad(select(productBase,head()))});
test('mirror with regular sibling reviews root is refused',()=>{mirror();write('fixtures/proposal/reviews','file');bad(select(productBase,head()))});
for(const [name,edit] of [
 ['missing source report',()=>fs.unlinkSync(path.join(repo,report))],
 ['corrupt source report',()=>write(report,'corrupt report')],
 ['missing required source input',()=>fs.unlinkSync(path.join(repo,required))],
 ['corrupt required source input',()=>write(required,'corrupt plan')]
])test(name+' remains unavailable despite exact declared mirror',()=>{mirror();edit();bad(select(productBase,head()))});
test('real nested independent run is validated and retained',()=>{
 const nested='docs/source/examples/nested/run.md';write(nested,'phase: code\napprovals:\n');
 const saved=fs.readFileSync(path.join(repo,run));
 // Use a separately produced identity and archive, then relocate its canonical bundle.
 collect('nested');const appended=fs.readFileSync(path.join(repo,run),'utf8').slice(saved.length);
 write(run,saved);write(nested,'phase: code\napprovals:\n'+appended);
 fs.mkdirSync(path.join(repo,'docs/source/examples/nested/reviews'),{recursive:true});
 fs.renameSync(path.join(repo,'docs/source/reviews/nested'),path.join(repo,'docs/source/examples/nested/reviews/nested'));
 mirror();const data=good(select(productBase,head()));assert(data.archives.some(a=>a.run===nested));
 assert(data.changed.includes('docs/source/examples/nested/reviews/nested/final-review-nested.md'));
});
// These cases distinguish validation of the immutable source from validation
// of an endpoint that happens to contain the same collection lines.
test('bound current caller run cannot mirror a distinct valid canonical source',()=>{
 mirror();launch('reviewer',copy);bad(select(productBase,head(),['--review-run-file',copy]));
});
test('historical pending origin cannot borrow current caller pending exemption',()=>{
 const pending={invocationId:'current',workspace,reviewPath:path.join(workspace,'final-review-current.md'),review:'pending',required:[],settled:false};
 const text=sourceText+'- review-collection · '+JSON.stringify(pending)+'\n';
 write(run,text);const pendingOrigin=head();
 const copied='# pending source proposal\n'+text;
 const d=declaration(copied);d.origin={commit:pendingOrigin,run,sha256:sha(text)};
 mirror(copied,d);launch('current',run);bad(select(productBase,head(),['--review-run-file',run]));
});
test('corrupt immutable origin archive remains invalid after endpoint repair',()=>{
 write(required,'corrupt immutable origin plan\n');const corruptOrigin=head();
 write(required,'required exact plan\n');const d=declaration();d.origin.commit=corruptOrigin;
 mirror(copyText,d);bad(select(productBase,head()));
});
test('endpoint latest manifest cannot lose an earlier saved source claim',()=>{
 mirror();const previous=collectionLines.map(line=>JSON.parse(line.split(' · ')[1])).find(r=>r.invocationId==='one'&&r.complete);
 previous.files=previous.files.filter(f=>f.path!=='final-review-one.md.diff');
 write(run,sourceText+'- review-collection · '+JSON.stringify(previous)+'\n');bad(select(productBase,head()));
});
test('invalid base declaration cannot borrow valid head declaration',()=>{
 const d=declaration();d.copySha256='0'.repeat(64);mirror(copyText,d);const base=head();
 write(sidecar,JSON.stringify(declaration()));bad(select(base,head()));
});
test('different valid base and head declarations cannot rebind identical copied bytes',()=>{
 mirror();const base=head();write(run,sourceText+'\nnew source prose\n');const later=head();
 const d=declaration();d.origin={commit:later,run,sha256:sha(sourceText+'\nnew source prose\n')};
 write(sidecar,JSON.stringify(d));bad(select(base,head()));
});
test('base recovery cannot borrow an origin commit newer than that endpoint',()=>{
 write(copy,copyText);const base=head();const laterText=sourceText+'\nsource prose after base\n';
 write(run,laterText);const later=head();const d=declaration();d.origin={commit:later,run,sha256:sha(laterText)};
 write(sidecar,JSON.stringify(d));bad(select(base,head()));
});
test('orphan captured sidecar is refused',()=>{write(sidecar,JSON.stringify(declaration()));bad(select(productBase,head()))});
test('captured symlink declaration is refused without dereferencing',()=>{
 write(copy,copyText);fs.symlinkSync('/unavailable/sidecar.json',path.join(repo,sidecar));bad(select(productBase,head()));
});
test('historical canonical origin cannot become a declared mirror at endpoint',()=>{
 mirror();const other='other/run.md';write(other,sourceText);
 fs.cpSync(path.join(repo,'docs/source/reviews'),path.join(repo,'other/reviews'),{recursive:true});const available=head();
 const d=declaration(sourceText);d.origin={commit:available,run:other,sha256:sha(sourceText)};
 write(run+'.collection-origin.json',JSON.stringify(d));bad(select(productBase,head()));
});
test('partial alternate canonical history cannot create ambiguous source ownership',()=>{
 mirror();write('other/run.md',sourceText.replace(collectionLines[0]+'\n',''));
 fs.cpSync(path.join(repo,'docs/source/reviews'),path.join(repo,'other/reviews'),{recursive:true});bad(select(productBase,head()));
});
// Invalid UTF-8 must not collapse unequal raw collection bytes to U+FFFD.
for (const [name,sourceByte,copyByte] of [
 ['different invalid bytes',0x80,0x81],
 ['identical invalid bytes',0x80,0x80],
 ['invalid source and valid replacement character',0x80,null]
])test('invalid UTF8 mirror authentication refuses '+name,()=>{
 const invalid=byte=>{
  if(byte===null)return Buffer.from(sourceText.replaceAll('not ready','\ufffd'));
  return Buffer.from(Buffer.from(sourceText).toString('hex').replaceAll(Buffer.from('not ready').toString('hex'),byte.toString(16)),'hex');
 };
 const source=invalid(sourceByte),copied=invalid(copyByte);
 write(run,source);const sourceCommit=head();
 mirror(copied,{version:1,kind:'collection-history-mirror',copySha256:sha(copied),origin:{commit:sourceCommit,run,sha256:sha(source)}});
 const selection=select(productBase,head());bad(selection);
 assert(selection.data.gaps.some(g=>g.includes('invalid UTF-8')),'explicit UTF-8 authentication gap');
 assert.deepEqual(selection.data.collectionOrigins,[]);
});
console.log(JSON.stringify({passed,failed,tmp}));process.exitCode=failed?1:0;
