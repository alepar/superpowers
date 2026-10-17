// Reuse the existing replay harness's unchanged runtime and doc fixtures; skip unrelated suites.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const p=resolve('tests/super-code/replay-harness.mjs');
const source=readFileSync(p,'utf8').split('async function main() {')[0].replaceAll('import.meta.url',JSON.stringify(pathToFileURL(p).href));
const suffix=`
const fixtures=extractJsonBlocks();
for(const [n,want] of [[0,48],[1,19],[2,23]]){
 const out=await run({args:fixtures[n]});
 if(out.error||out.trace.length!==want)throw Error('dryRun '+n+': '+(out.error?.stack||out.trace.length+' dispatches, expected '+want));
 console.log('PASS dryRun '+n+': '+want+' agent dispatches, 0 errors');
}
const blocked=await run({args:liveArgs(),canned:oneTaskCanned({'assemble:final':{dir:'/captured/assembly',exit:2,fits:'unavailable',clusterFits:[],clusters:0,cause:'review input selection: saved hash mismatch: archived-payload'}})});
if(blocked.error)throw blocked.error;
if(blocked.trace.some(t=>/^final-review/.test(t.label)))throw Error('invalid provenance reached fallback reviewer');
if(!blocked.result?.review?.includes('review input selection: saved hash mismatch: archived-payload'))throw Error('selection gap disappeared from returned review');
console.log('PASS live-sim selection refusal: no final-review fallback dispatch; explicit hash gap retained');
`;
await import('data:text/javascript;base64,'+Buffer.from(source+suffix).toString('base64'));
