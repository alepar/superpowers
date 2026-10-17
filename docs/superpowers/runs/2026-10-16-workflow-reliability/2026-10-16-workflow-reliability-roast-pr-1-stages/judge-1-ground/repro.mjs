import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
const root='/tmp/ufz-pr1/judge-1-ground/';
const result=[];
for (const role of ['base','head']) {
 const source=execFileSync('git',['-C','/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers','show',(role==='base'?'d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5':'ff2f79f62cc34084c8df20edc5c2e4f201a5d630')+':skills/super-code/coordinator.js'],{encoding:'utf8'});
 const prefix=source.slice(0, source.indexOf('// Model and reasoning effort per role')).replace('export const meta','const meta');
 const records=[];
 const context=vm.createContext({args:{epicId:'epic',integrationBranch:'branch',skillsRoot:'/skills',config:{}},log:x=>records.push(x)});
 vm.runInContext(`Date.now=()=>{throw new Error('Date.now() / new Date() are unavailable in workflow scripts (breaks resume). Stamp results after the workflow returns, or pass timestamps via args.')}; Math.random=()=>{throw new Error('Math.random() is unavailable in workflow scripts (breaks resume).')}`,context);
 let error=null;
 try { vm.runInContext(prefix,context) } catch(e) {error=e.message}
 result.push({role,error,logs:records,bannedMemberLines:source.split('\n').flatMap((line,i)=>/Date\.now|Math\.random/.test(line)?[{line:i+1,text:line}]:[])});
}
writeFileSync(root+'repro-runtime-result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
