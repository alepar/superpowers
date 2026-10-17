const fs=require('fs'),path=require('path'),cp=require('child_process');
const scratch=__dirname,source='/tmp/ufz-pr2-controller/source',repo=path.join(scratch,'repo'),work=path.join(scratch,'work');
const write=(p,t)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t)};
fs.mkdirSync(repo,{recursive:true});fs.mkdirSync(work,{recursive:true});
const git=(...a)=>cp.execFileSync('git',a,{cwd:repo,encoding:'utf8'}).trim();
git('init','-q');git('config','user.name','Review Fixture');git('config','user.email','review@example.invalid');
const report='## Verdict\nready\n## Must fix before landing\n- none\n## Untested scope\n- none\n## Deferred OK\n- none\n';
const run=path.join(repo,'docs/run/run.md');write(run,'approvals:\n');
const receipts=[];
function collect(id,required=[]){write(path.join(work,'final-review-'+id+'.md'),report);const r=cp.spawnSync('bash',[source+'/skills/super-auto/scripts/report-status','--collect',run,'--invocation',id,'--workspace',work,'--review',path.join(work,'final-review-'+id+'.md'),'--verdict','ready',...required.flatMap(r=>['--required',r])],{encoding:'utf8'});receipts.push({kind:'collect',id,status:r.status,stdout:r.stdout,stderr:r.stderr});if(r.status!==0)throw Error(JSON.stringify(receipts));}
collect('old');
write(path.join(work,'snapshots/run.md'),fs.readFileSync(run));
collect('new',['snapshots/run.md']);
write(path.join(repo,'product.js'),'module.exports = 1;\n');git('add','.');git('commit','-qm','complete archives produced by collector');const base=git('rev-parse','HEAD');
write(path.join(repo,'product.js'),'module.exports = 2;\n');git('add','.');git('commit','-qm','one product edit');const head=git('rev-parse','HEAD');
const ledger=path.join(scratch,'progress.md');write(ledger,`Launch: args ${JSON.stringify({epicId:'fixture',integrationBranch:'main',integrationWorktree:repo,invocationId:'current'})}\n`);
function select(label,b,h){const out=path.join(scratch,label),r=cp.spawnSync('node',[source+'/skills/super-code/scripts/dispatch-text.mjs','review-inputs','--ledger',ledger,'--base',b,'--head',h,'--out-dir',out],{encoding:'utf8'});receipts.push({kind:'selector',label,status:r.status,stdout:r.stdout,stderr:r.stderr,result:JSON.parse(fs.readFileSync(path.join(out,'review-inputs.json')))});}
select('nested',base,head);
// Remove only archived snapshot in a separate control history. Both run records/archives stay intact.
git('checkout','-qb','control',base);git('rm','-q','docs/run/reviews/new/snapshots/run.md');
// This control would invalidate new's own manifest, so instead use an independent product-only history.
git('checkout','--orphan','product-only');git('rm','-rfq','.');write(path.join(repo,'product.js'),'module.exports = 1;\n');git('add','.');git('commit','-qm','product baseline');const controlBase=git('rev-parse','HEAD');write(path.join(repo,'product.js'),'module.exports = 2;\n');git('add','.');git('commit','-qm','one product edit');select('product-only',controlBase,git('rev-parse','HEAD'));
fs.writeFileSync(path.join(scratch,'receipt.json'),JSON.stringify(receipts,null,2)+'\n');console.log(JSON.stringify(receipts.map(r=>({kind:r.kind,id:r.id,label:r.label,status:r.status,changed:r.result?.changed,slices:r.result?.slices.length,gaps:r.result?.gaps})),null,2));
