// Pure preservation contract. Callers supply captured bytes and captured Git source;
// neither a type label nor a missing digest grants omission or review authority.
const {posix:path}=require('node:path');
const {createHash}=require('node:crypto');
const TYPE='failed-bounded-assembly-v1';
const VERDICT='not ready (unreviewed: whole-epic coverage and omission provenance remain incomplete)';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const safe=p=>typeof p==='string'&&p!==''&&!p.includes('\\')&&!p.includes('\0')&&!path.isAbsolute(p)&&p.split('/').every(s=>s&&s!=='.'&&s!=='..');
const text=bytes=>new TextDecoder('utf-8',{fatal:true}).decode(bytes);
function requireThat(ok,message){if(!ok)throw Error(message)}

// The strict final-review grammar used by report-verdict --complete: finding
// sections contain list items or an explicit none, never unstructured prose.
function strictDraft(draft){
 requireThat(/^## Verdict\r?$/m.test(draft)&&/^## Untested scope\r?$/m.test(draft),'bounded draft must use strict final-review headings');
 const lines=draft.replace(/\r\n?/g,'\n').split('\n');
 const index=lines.findIndex(l=>/^## Verdict$/.test(l));
 const verdict=lines.slice(index+1).find(l=>l.trim());
 requireThat(verdict&&!/^(?:#+[ \t]|\*\*| ?(?:[-*]|[0-9]+[.)])[ \t])/.test(verdict),'missing draft verdict');
 const none=t=>t.toLowerCase().replace(/[ \t.*_`]+/g,'')==='none';
 let active=false,content=false,item=null;
 const flush=()=>{if(item&&none(item[0]))requireThat(!item.slice(1).some(l=>l.trim()),'none marker has finding text');item=null};
 const close=()=>{flush();requireThat(!active||content,'empty draft finding section')};
 for(const line of lines){
  const h=line.match(/^#+[ \t]+(.*)$/)||line.match(/^\*\*([^*]+)\*\*/);
  if(h){close();active=/^(?:deferred\b|concerns?\b|blockers?\b|findings?\b|untested scope\b|must[- ]fix\b)/i.test(h[1]);content=false;continue}
  if(!active)continue;
  const bullet=line.match(/^ ?(?:[-*]|[0-9]+[.)])[ \t]+(.*)$/);
  if(bullet){flush();requireThat(bullet[1].trim(),'empty draft finding item');item=[bullet[1]];content=true}
  else if(item)item.push(line);
  else if(none(line))content=true;
  else requireThat(!line.trim(),'draft finding text without a list marker');
 }
 close();
}
function boundedReport(draft,evidence){
 strictDraft(draft);
 const body=draft.replace(/(^## Verdict\r?\n)([\s\S]*?)(?=^## |$(?![\s\S]))/m,'$1'+VERDICT+'\n')
  .replace(/^## Untested scope\r?$/m,'## Untested scope\n- whole-epic review incomplete; bounded inspected hunks only; all remaining hunks and provenance gaps remain unreviewed');
 return '# Bounded captured-source review\n\nCoverage record: '+JSON.stringify(evidence)+'\n\n'+body;
}
function validateFailedAssembly({record,read,capturedSource}){
 const {invocationId:id,workspace,reviewPath,files}=record;
 requireThat(/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id)&&typeof workspace==='string'&&path.isAbsolute(workspace)&&path.normalize(workspace)===workspace,'invalid bounded identity');
 const prefix='final-review-'+id,assembled='assembled/'+prefix+'-final/';
 requireThat(record.assemblyArchive===undefined||record.assemblyArchive===TYPE,'unknown assembly archive contract');
 requireThat(record.settled===true&&record.review===VERDICT&&reviewPath===path.join(workspace,prefix+'.md'),'bounded report identity or verdict mismatch');
 requireThat(Array.isArray(files)&&Array.isArray(record.required),'missing bounded manifest');
 const manifest=new Map();
 for(const f of files){
  requireThat(f&&safe(f.path)&&/^[a-f0-9]{64}$/.test(f.sha256)&&!manifest.has(f.path),'invalid bounded manifest');
  const bytes=read(f.path);requireThat(sha(bytes)===f.sha256,'bounded saved hash mismatch: '+f.path);manifest.set(f.path,bytes);
 }
 const get=p=>{requireThat(manifest.has(p),'missing bounded evidence: '+p);return manifest.get(p)};
 for(const p of record.required){requireThat(safe(p),'unsafe required input');get(p)}
 // A partial failed selection has no successful assembly/split claims to exempt.
 requireThat(!files.some(f=>f.path===prefix+'.md.diff'||f.path.startsWith(prefix+'.cluster-')||f.path===assembled+'digest.md'||f.path===assembled+'clusters.json'||f.path.startsWith(assembled+'slices/')),'failed bounded archive contains successful assembly or split claims');
 get(assembled+'diffstat.txt');get(assembled+'generated-input-provenance.md');
 const report=text(get(prefix+'.md'));
 const match=report.match(/^# Bounded captured-source review\n\nCoverage record: ([^\n]+)\n\n/);
 requireThat(match,'missing bounded Coverage record');
 const evidence=JSON.parse(match[1]);
 const refs={selection:'review-inputs.json',draft:'bounded-draft.md',coverage:'bounded-coverage.json'},bytes={};
 for(const [key,name]of Object.entries(refs)){
  requireThat(evidence[key]===path.join(workspace,assembled,name),'bounded evidence path outside invocation: '+key);
  bytes[key]=get(assembled+name);requireThat(evidence[key+'Sha256']===sha(bytes[key]),'bounded evidence hash mismatch: '+key);
 }
 const selection=JSON.parse(text(bytes.selection)),coverage=JSON.parse(text(bytes.coverage)),draft=text(bytes.draft);
 requireThat(/^[a-f0-9]{40,64}$/.test(evidence.base)&&/^[a-f0-9]{40,64}$/.test(evidence.head),'invalid bounded captured source');
 requireThat(selection.base===evidence.base&&selection.head===evidence.head&&selection.status==='unavailable'&&selection.sourceAvailable===true&&selection.wholeRangeReady===false&&Array.isArray(selection.omitted)&&!selection.omitted.length&&Array.isArray(selection.gaps)&&selection.gaps.length&&selection.gaps.every(g=>typeof g==='string'&&g.trim()),'invalid failed bounded selection');
 requireThat(selection.slices===undefined||(Array.isArray(selection.slices)&&!selection.slices.length),'failed selection claims slices');
 for(const object of [selection,coverage,evidence]){
  for(const [key,value]of Object.entries({invocationId:id,workspace,base:evidence.base,head:evidence.head,wholeRangeReady:false,sourceAvailable:true}))if(Object.hasOwn(object,key))requireThat(same(object[key],value),'bounded optional declaration mismatch: '+key);
 }
 const source=capturedSource(evidence.base,evidence.head);
 requireThat(Array.isArray(source.changed)&&source.changed.every(safe)&&same(selection.changed,source.changed)&&same(evidence.changed,source.changed),'bounded captured inventory mismatch');
 const changed=source.changed,seen=new Set();
 requireThat(Array.isArray(coverage.inspected)&&coverage.inspected.length&&same(evidence.inspected,coverage.inspected),'invalid bounded inspected coverage');
 for(const item of coverage.inspected){
  requireThat(item&&changed.includes(item.path)&&!seen.has(item.path)&&Array.isArray(item.hunks)&&item.hunks.length,'invalid bounded inspected path');
  const headers=source.diff(item.path).split('\n');
  for(const h of item.hunks)requireThat(typeof h==='string'&&h.startsWith('@@ ')&&headers.includes(h),'inspected hunk absent from captured source');
  seen.add(item.path);
 }
 requireThat(same(evidence.unreviewedPaths,changed.filter(p=>!seen.has(p)))&&same(evidence.gaps,selection.gaps)&&evidence.wholeRangeReady===false,'bounded coverage complement or original gaps mismatch');
 requireThat(report===boundedReport(draft,evidence),'bounded report differs from deterministic draft transformation');
 return {kind:TYPE,base:evidence.base,head:evidence.head,wholeRangeReady:false};
}
module.exports={TYPE,VERDICT,boundedReport,validateFailedAssembly};
