import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
const root='/tmp/ufz-pr1/evidence-concurrency-async/';
const result=[];
for (const role of ['base','head']) {
 const source=readFileSync(root+role+'/skills/super-code/coordinator.js','utf8');
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
