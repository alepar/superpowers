import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import vm from 'node:vm';
const w='/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers';
const revisions={base:'d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5',head:'ff2f79f62cc34084c8df20edc5c2e4f201a5d630'};
const results=[];
for (const [revision,sha] of Object.entries(revisions)) {
 const source=execFileSync('git',['-C',w,'show',sha+':skills/super-code/coordinator.js'],{encoding:'utf8'});
 const startup=source.slice(0,source.indexOf('// Model and reasoning effort per role')).replace('export const meta','const meta');
 for (const mode of ['omitted','explicit']) {
  const args={epicId:'fixture',integrationBranch:'fixture-branch',skillsRoot:'/fixture/skills',config:{},dryRun:true,...(mode==='explicit'?{invocationId:'inv-fixture-001'}:{})};
  const logs=[];const context=vm.createContext({args,log:x=>logs.push(x)});
  vm.runInContext(`Date.now=()=>{throw new Error('Date.now() unavailable: breaks resume')};Math.random=()=>{throw new Error('Math.random() unavailable: breaks resume')}`,context);
  let error=null;try {vm.runInContext(startup,context)}catch(e){error=e.message}
  results.push({revision,sha,mode,error,logs,bannedSourceLines:source.split('\n').flatMap((text,i)=>/Date\.now|Math\.random/.test(text)?[{line:i+1,text}]:[])});
 }
}
writeFileSync('/tmp/ufz-pr1/judge-1-reproduce/result.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
if(results[0].error!==null||results[2].error===null||results[2].logs.length!==0||results[3].error!==null)process.exitCode=1;
