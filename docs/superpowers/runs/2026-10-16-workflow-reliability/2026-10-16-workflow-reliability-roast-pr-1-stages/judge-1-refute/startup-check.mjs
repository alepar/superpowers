import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const w='/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers';
const results=[];
for (const rev of ['d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5','ff2f79f62cc34084c8df20edc5c2e4f201a5d630']) {
 const source=execFileSync('git',['-C',w,'show',rev+':skills/super-code/coordinator.js'],{encoding:'utf8'});
 const prefix=source.slice(0,source.indexOf('// Model and reasoning effort per role')).replace('export const meta','const meta');
 for (const supplied of [false,true]) {
  const args={epicId:'epic',integrationBranch:'branch',skillsRoot:'/skills',config:{}};
  if(supplied) args.invocationId='inv-fixed';
  const logs=[];
  const context=vm.createContext({args,log:m=>logs.push(m)});
  vm.runInContext("Date.now=()=>{throw Error('forbidden Date.now')};Math.random=()=>{throw Error('forbidden Math.random')}",context);
  let error=null;
  try {vm.runInContext(prefix,context)}catch(e){error=e.message}
  results.push({rev,supplied,error,logs});
 }
}
writeFileSync('/tmp/ufz-pr1/judge-1-refute/startup-result.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
