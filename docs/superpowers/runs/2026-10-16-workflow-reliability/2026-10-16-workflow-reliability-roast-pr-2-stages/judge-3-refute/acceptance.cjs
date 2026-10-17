const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const [scripts,,run,...args]=process.argv.slice(2);
if(!run || (args.length && (args.length!==2 || args[0]!=='--tree'))){console.error('usage: report-status --acceptance RUN_MD [--tree FULL_GIT_TREE]');process.exit(2)}
const tree=args[1],pending=[],gaps=[],requirements=new Map(),snapshots=[],nonblockingFindings=[];
const text=v=>typeof v==='string'&&v.trim()!=='',hash=v=>typeof v==='string'&&/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(v);
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const gap=s=>gaps.push(s),wait=s=>pending.push(s);
let input;try{input=fs.readFileSync(run,'utf8')}catch(e){console.error(e.message);process.exit(2)}
let approvals=false;
for(const line of input.split(/\r?\n/)){
 if(/^[A-Za-z][A-Za-z0-9-]*:/.test(line))approvals=line==='approvals:';
 if(!line.startsWith('- root-acceptance'))continue;
 try{
  if(!approvals||!line.startsWith('- root-acceptance · '))throw Error('outside approvals or malformed record');
  const r=JSON.parse(line.slice('- root-acceptance · '.length));
  if(!object(r)||r.version!==1||r.owner!=='super-auto'||!hash(r.sourceTree))throw Error('invalid source/owner/version');
  if(!Array.isArray(r.requirements)||!r.requirements.length)throw Error('missing acceptance requirements');
  for(const q of r.requirements){
   if(!object(q)||!text(q.id)||!text(q.owner)||!['review','measurement','human'].includes(q.kind))throw Error('invalid acceptance requirements');
   if(q.kind==='measurement'&&(!text(q.command)||!text(q.configuration)||typeof q.requiredLive!=='boolean'))throw Error('invalid measurement requirements');
   requirements.set(q.id,q);
  }
  for(const k of ['evidence','reviews','decisions','runFailures'])if(!Array.isArray(r[k]))throw Error('missing '+k);
  if(r.findingAcceptance!==undefined&&!Array.isArray(r.findingAcceptance))throw Error('invalid finding acceptance judgments');
  if(!object(r.recovery)||!Array.isArray(r.recovery.obligations)||!Array.isArray(r.recovery.gaps)||!object(r.checkEvidence)||!['records','gaps','requiredLiveChecks'].every(k=>Array.isArray(r.checkEvidence[k])))throw Error('missing producer obligations/check evidence');
  snapshots.push(r);
 }catch(e){gap('root acceptance record: '+e.message)}
}
const current=snapshots.at(-1);
if(!current)gap('caller acceptance requirements unavailable');
else{
 if(tree!==undefined&&!hash(tree)){console.error('not a full Git tree identity');process.exit(2)}
 if(tree!==undefined&&tree!==current.sourceTree)gap('acceptance source differs from requested source tree');
 const records=snapshots.flatMap(r=>[...r.evidence,...r.checkEvidence.records]);
 const identity=r=>object(r)&&hash(r.sourceTree)&&text(r.command)&&text(r.configuration);
 const valid=r=>identity(r)&&text(r.location)&&['live','simulated','fallback'].includes(r.kind)&&['pass','fail','unavailable'].includes(r.outcome);
 for(const r of records)if(!valid(r))gap('invalid source-bound measurement evidence');
 function measure(q,label){
  if(!identity(q)){gap(label+': measurement identity unavailable');return false}
  const matches=records.filter(r=>valid(r)&&r.sourceTree===q.sourceTree&&r.command===q.command&&r.configuration===q.configuration&&(!q.id||!q.taskCheck||r.id===q.id)&&(!q.requiredLive||r.kind==='live'));
  // Contradictory outcomes at an immutable source do not silently turn into a pass.
  if(matches.some(r=>r.outcome==='pass')&&!matches.some(r=>r.outcome==='fail'))return true;
  const result=matches.some(r=>r.outcome==='fail')?'fail':matches.some(r=>r.outcome==='unavailable')?'unavailable':'unavailable'+(q.requiredLive?' (live required)':'');
  wait(label+': '+result+'; owner: '+(q.owner||'caller'));return false;
 }
 for(const kind of ['review','measurement','human'])if(![...requirements.values()].some(q=>q.kind===kind))gap('missing '+kind+' acceptance requirements');
 for(const q of requirements.values()){
  if(q.kind==='measurement')measure({...q,sourceTree:q.sourceTree||current.sourceTree},q.id);
  else if(q.kind==='review'){
   const review=current.reviews.filter(r=>r&&r.id===q.id).at(-1);
   if(!review||review.sourceTree!==current.sourceTree||review.outcome!=='pass'||!text(review.location))wait(q.id+': review pending; owner: '+q.owner);
  }else{
   const decision=current.decisions.filter(r=>r&&r.id===q.id).at(-1);
   if(!decision||decision.authority!=='human'||decision.decision!=='accept'||!Array.isArray(decision.evidence)||!decision.evidence.length||!decision.evidence.every(text))wait(q.id+': human decision pending; owner: '+q.owner);
  }
 }
 for(const r of snapshots)for(const q of r.checkEvidence.requiredLiveChecks)measure({...q,requiredLive:true,taskCheck:true},'required live check '+(q?.command||'unknown'));
 for(const g of [...current.recovery.gaps,...current.checkEvidence.gaps])gap(typeof g==='string'?g:JSON.stringify(g));
 const failures=new Map();
 for(const f of current.runFailures){
  if(!object(f)||!text(f.id)||!['run-introduced','pre-run','gap'].includes(f.classification)||!['open','verified'].includes(f.state)){gap('invalid run failure classification');continue}
  failures.set(f.id,f);
  if(f.classification==='pre-run')continue; // diagnostic unless acceptance separately requires repair
  for(const g of f.gaps||[])gap(f.id+': '+(typeof g==='string'?g:JSON.stringify(g)));
  if(f.classification==='gap'||f.state!=='verified')wait(f.id+': '+f.classification+' '+f.state+'; owner: '+(f.owner||'caller'));
 }
 for(const r of current.recovery.obligations){
  if(!object(r)||r.version!==1||!text(r.id)||!['hold','pending-closure','deferred'].includes(r.kind)||r.operation!=='record'||!text(r.reason)||!Array.isArray(r.evidence)||!r.evidence.length||!r.evidence.every(text)||!object(r.data)){gap('invalid recovery obligation');continue}
  if(r.data.runFailure){if(!failures.has(r.id))gap(r.id+': run failure classification unavailable');continue}
  if(r.kind==='deferred'){
   const binding=[...requirements.values()].find(q=>q.kind==='measurement'&&Array.isArray(q.obligations)&&q.obligations.includes(r.id));
   // Deferred final-suite records predate any tested tree. The caller explicitly binds
   // their exact IDs to the final measurement; a pass cannot clear another obligation.
   if(binding && (!r.data.command||r.data.command===binding.command) && (!r.data.configuration||r.data.configuration===binding.configuration) && (!r.data.sourceTree||r.data.sourceTree===(binding.sourceTree||current.sourceTree)))measure({...binding,sourceTree:binding.sourceTree||current.sourceTree,requiredLive:true},r.id);
   else measure({...r.data,requiredLive:true},r.id);
  }
  else wait(r.id+': '+r.kind+' '+r.reason+'; owner: '+(r.data.owner||'caller'));
 }
}
// Use the same validated projection as Remaining and resume. Valid empty is distinct
// from a missing extraction or an empty --keys stream carrying gaps.
const projection=cp.spawnSync('bash',[path.join(scripts,'scope-dispositions'),'--project',run],{encoding:'utf8'});
try{
 if(![0,3].includes(projection.status))throw Error('unavailable');
 const p=JSON.parse(projection.stdout);if(!Array.isArray(p.findings)||!Array.isArray(p.gaps))throw Error('malformed');
 for(const g of p.gaps)gap('finding evidence: '+JSON.stringify(g));
 const sameRef=(a,b)=>a&&b&&a.source===b.source&&a.section===b.section&&a.position===b.position;
 for(const f of p.findings.filter(f=>f.outstanding)){
  const refs=f.occurrences.map(o=>({source:o.source,section:o.section,position:o.position}));
  // Explicit projection links establish one finding group. Assess it once through
  // any exact member ref, retaining every original source occurrence in the result.
  const judgment=(current?.findingAcceptance||[]).filter(j=>refs.some(ref=>sameRef(j?.ref,ref))).at(-1);
  if(!judgment||judgment.judgment!=='supported'||!text(judgment.basis)||!Array.isArray(judgment.evidence)||!judgment.evidence.length||!judgment.evidence.every(text)||!['required','nonblocking'].includes(judgment.effect))gap('finding acceptance relevance unproven: '+JSON.stringify(refs));
  else if(judgment.effect==='required'){
   if(!text(judgment.requirement)||!requirements.has(judgment.requirement))gap('finding acceptance requirement unavailable: '+JSON.stringify(refs));
   wait('finding '+JSON.stringify(refs)+' remains required for '+(judgment.requirement||'unknown acceptance'));
  }else nonblockingFindings.push(...refs); // still outstanding in the shared punch-list projection
 }
}catch{gap('finding projection unavailable')}
// Reuse ordinary status collection validation without recursively running this gate.
const status=cp.spawnSync('bash',[path.join(scripts,'report-status'),run],{encoding:'utf8',env:{...process.env,RS_SKIP_ACCEPTANCE:'1'}});
if(status.status!==0)gap('run status unavailable');
else for(const line of status.stdout.split('\n'))if(/^qualifier: (review collection|review collections|finding evidence|finding projection)/.test(line))gap(line.slice(11));
const result={owner:'super-auto',sourceTree:current?.sourceTree||null,eligible:pending.length===0&&gaps.length===0,pending:[...new Set(pending)],gaps:[...new Set(gaps)],nonblockingFindings};
console.log(JSON.stringify(result));process.exit(result.eligible?0:3);