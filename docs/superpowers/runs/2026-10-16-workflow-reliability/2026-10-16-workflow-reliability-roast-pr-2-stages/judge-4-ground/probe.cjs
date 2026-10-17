const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const scratch=__dirname, repo=path.join(scratch,'repo'), source='/tmp/ufz-pr2-controller/source';
fs.mkdirSync(repo,{recursive:true});
function git(...args){return cp.execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim()}
function write(p,t){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t)}
git('init','-q');git('config','user.name','Ground fixture');git('config','user.email','ground@example.test');
write(path.join(repo,'product.js'),'module.exports=1\n');git('add','.');git('commit','-qm','base');const base=git('rev-parse','HEAD');
write(path.join(repo,'product.js'),'module.exports=2\n');git('add','.');git('commit','-qm','edit');const productHead=git('rev-parse','HEAD');
const id='historical', prefix='final-review-'+id;
const record={invocationId:id,workspace:'/old/workspace',reviewPath:'/old/workspace/'+prefix+'.md',review:'not ready',settled:true,required:[],complete:true,gaps:[],files:[{path:prefix+'.md',sha256:crypto.createHash('sha256').update('report\n').digest('hex')}]};
const historical='docs/run/reviews/old/snapshots/run.md';write(path.join(repo,historical),'approvals:\n- review-collection · '+JSON.stringify(record)+'\n');git('add','.');git('commit','-qm','archive snapshot');const head=git('rev-parse','HEAD');
const ledger=path.join(scratch,'progress.md');write(ledger,'Launch: args '+JSON.stringify({epicId:'fixture',integrationBranch:'fixture',integrationWorktree:repo,invocationId:'current'})+'\n');
const results=[];for(const [name,end] of [['control',productHead],['historical',head]]){const out=path.join(scratch,name);const r=cp.spawnSync('node',[source+'/skills/super-code/scripts/dispatch-text.mjs','review-inputs','--ledger',ledger,'--base',base,'--head',end,'--out-dir',out],{encoding:'utf8'});results.push({name,exit:r.status,stdout:r.stdout,stderr:r.stderr,sidecar:JSON.parse(fs.readFileSync(path.join(out,'review-inputs.json'),'utf8'))})}
fs.writeFileSync(path.join(scratch,'receipt.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
