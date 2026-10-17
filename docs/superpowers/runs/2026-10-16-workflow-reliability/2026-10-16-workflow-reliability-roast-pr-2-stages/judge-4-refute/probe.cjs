const fs=require('fs'),p=require('path'),cp=require('child_process'),crypto=require('crypto');
const scratch=__dirname,repo=p.join(scratch,'fixture'),source='/tmp/ufz-pr2-controller/source';
fs.mkdirSync(repo,{recursive:true});
function run(cmd,args){return cp.spawnSync(cmd,args,{cwd:repo,encoding:'utf8',maxBuffer:8*1024*1024})}
function git(...a){const r=run('git',a);if(r.status)throw Error(r.stderr);return r.stdout.trim()}
function write(name,text){const file=p.join(repo,name);fs.mkdirSync(p.dirname(file),{recursive:true});fs.writeFileSync(file,text)}
git('init','-q');git('config','user.email','fixture@example.invalid');git('config','user.name','Fixture');
write('product.js','module.exports = 1\n');git('add','.');git('commit','-qm','base');const base=git('rev-parse','HEAD');
write('product.js','module.exports = 2\n');git('add','.');git('commit','-qm','edit');const controlHead=git('rev-parse','HEAD');
const prefix='final-review-historical',record={invocationId:'historical',workspace:'/old/work',reviewPath:'/old/work/'+prefix+'.md',review:'not ready',settled:true,required:[],complete:true,gaps:[],files:[{path:prefix+'.md',sha256:crypto.createHash('sha256').update('report\n').digest('hex')}]};
write('docs/run/reviews/example/snapshots/run.md','approvals:\n- review-collection · '+JSON.stringify(record)+'\n');git('add','.');git('commit','-qm','historical snapshot');const head=git('rev-parse','HEAD');
const ledger=p.join(scratch,'progress.md');fs.writeFileSync(ledger,'Launch: args '+JSON.stringify({epicId:'fixture',integrationBranch:'fixture',integrationWorktree:repo,invocationId:'fixture'})+'\n');
const cases=[];
for(const [name,h] of [['control',controlHead],['historical',head]]){
const out=p.join(scratch,name);const result=run('node',[p.join(source,'skills/super-code/scripts/dispatch-text.mjs'),'--ledger',ledger,'review-inputs','--base',base,'--head',h,'--out-dir',out]);
cases.push({name,exit:result.status,stdout:result.stdout,stderr:result.stderr,selection:JSON.parse(fs.readFileSync(p.join(out,'review-inputs.json')))});
}
fs.writeFileSync(p.join(scratch,'receipt.json'),JSON.stringify(cases,null,2));console.log(JSON.stringify(cases.map(c=>({name:c.name,exit:c.exit,status:c.selection.status,changed:c.selection.changed,slices:c.selection.slices.length,omitted:c.selection.omitted.length,gaps:c.selection.gaps})),null,2));
