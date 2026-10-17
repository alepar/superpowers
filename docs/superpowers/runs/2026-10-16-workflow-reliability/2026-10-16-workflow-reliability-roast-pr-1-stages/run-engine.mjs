import fs from 'node:fs';
const dir='/tmp/ufz-pr1';
const args=JSON.parse(fs.readFileSync(dir+'/assembled-args.json','utf8'));
const results=JSON.parse(fs.readFileSync(dir+'/results.json','utf8'));
let code=fs.readFileSync(dir+'/engine.mjs','utf8').replace('export const meta =','const meta =');
const stage=process.argv[2];
if(stage==='dedupe')code=code.slice(0,code.indexOf('// Dedupe —'))+'\nreturn {raw,scoutNames,scoutResults,triage};';
if(stage==='dedupe-prompt')code=code.slice(0,code.indexOf('  const dedupeOnce ='))+'\nreturn {dedupePrompt};}';
if(stage==='judge')code=code.slice(0,code.indexOf('const judgedRaw ='))+'\nreturn {raw,deduped,toJudge,dedupeOrphans,beyondCap,beyondPanelCap,dedupeDead};';
if(stage==='reporter')code=code.slice(0,code.indexOf('const reporterOnce ='))+'\nreturn {reporterPrompt,packets,coverage,coverageLine,seatAgreement,routeCounts,laneYieldLine};';
const logs=[],manifest=[];
async function agent(prompt,opts){const key=opts.label;const file=dir+'/dispatch-'+key.replaceAll(':','_').replaceAll('#','-')+'.md';fs.writeFileSync(file,prompt);manifest.push({...opts,promptPath:file});if(!Object.hasOwn(results,key))throw Error('Missing stage result '+key);return results[key];}
const parallel=thunks=>Promise.all(thunks.map(async f=>await f()));
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const out=await new AsyncFunction('args','agent','parallel','log','phase',code)(args,agent,parallel,x=>logs.push(x),()=>{});
fs.writeFileSync(dir+'/'+stage+'-state.json',JSON.stringify(out,null,2));fs.writeFileSync(dir+'/'+stage+'-logs.json',JSON.stringify(logs,null,2));fs.writeFileSync(dir+'/'+stage+'-manifest.json',JSON.stringify(manifest,null,2));
if(out.reporterPrompt)fs.writeFileSync(dir+'/reporter-live.md',out.reporterPrompt);
if(out.reportMarkdown)fs.writeFileSync(dir+'/report-final.md',out.reportMarkdown+'\n');
console.log(JSON.stringify({stage,raw:out.raw?.length,deduped:out.deduped?.length,toJudge:out.toJudge?.length,verdict:out.verdict,coverage:out.coverage,routeCounts:out.routeCounts},null,2));
