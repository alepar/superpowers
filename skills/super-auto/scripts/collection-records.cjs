// Pure collection shape/provenance validation shared by collection and read-only gates.
const path=require('node:path'),crypto=require('node:crypto');
const validCollection = r => r && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(r.invocationId) &&
 typeof r.workspace==='string' && path.isAbsolute(r.workspace) &&
 (r.reviewPath===null || (typeof r.reviewPath==='string' && path.isAbsolute(r.reviewPath))) &&
 typeof r.review==='string' && r.review.trim()!=='' && typeof r.settled==='boolean' &&
 Array.isArray(r.required) && r.required.every(f=>typeof f==='string' && f!=='' && !path.isAbsolute(f) && !f.split(/[\\/]/).includes('..')) &&
 (r.complete===undefined || typeof r.complete==='boolean') &&
 (r.gaps===undefined || (Array.isArray(r.gaps) && r.gaps.every(g=>typeof g==='string' && g!==''))) &&
 (r.files===undefined || (Array.isArray(r.files) && r.files.every(f=>f && typeof f.path==='string' && f.path!=='' && !path.isAbsolute(f.path) && !f.path.split(/[\\/]/).includes('..') && /^[a-f0-9]{64}$/.test(f.sha256)))) &&
 (!r.complete || (r.settled && Array.isArray(r.gaps) && r.gaps.length===0 &&
 (r.reviewPath===null ? r.review==='no work landed' : r.files?.some(f=>f.path==='final-review-'+r.invocationId+'.md'))));
const recordHash=r=>crypto.createHash('sha256').update(JSON.stringify(r)).digest('hex');
const sameBundle=(a,b)=>a.workspace===b.workspace&&JSON.stringify(a.required)===JSON.stringify(b.required);
const sameRecovery=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const sameResult=(a,b)=>a.invocationId===b.invocationId&&sameBundle(a,b)&&a.reviewPath===b.reviewPath&&a.review===b.review&&a.settled===b.settled&&sameRecovery(a.recovery,b.recovery);
function collectionHistory(text){
 const latest=new Map(),history=new Map(),completed=new Map();let approvals=false,errors=0;
for(const line of text.split('\n')){
 if(/^[A-Za-z][A-Za-z0-9-]*:/.test(line))approvals=line==='approvals:';
 if(!line.startsWith('- review-collection'))continue;
 try{
  if(!approvals||!line.startsWith('- review-collection · '))throw Error();
  const r=JSON.parse(line.slice('- review-collection · '.length));if(!validCollection(r))throw Error();
  const old=latest.get(r.invocationId);
  // Collection snapshots are append-only commitments. A later record cannot hide
  // a saved digest (or any other saved input) by dropping it from its manifest.
  if(old?.files?.length){
   const files=new Map((r.files||[]).map(f=>[f.path,f.sha256]));
   for(const f of old.files)if(files.get(f.path)!==f.sha256)throw Error();
  }
  // Provenance is mandatory for the transition and every later recovery snapshot,
  // including when a corrupted record omits the marker instead of changing it.
  if(r.recovery!==undefined||old?.recovery!==undefined||(old?.settled&&old.reviewPath===null&&r.reviewPath!==null)){
   const recovery=r.recovery,base=history.get(recovery?.recordSha256);
   if(!recovery||recovery.kind!=='settled-null'||!base||!base.settled||base.reviewPath!==null||base.review!==recovery.review||
      base.invocationId!==r.invocationId||!sameBundle(base,r)||!r.settled||r.reviewPath!==path.join(r.workspace,'final-review-'+r.invocationId+'.md')||
      !(recordHash(old)===recovery.recordSha256||(old?.reviewPath===r.reviewPath&&old.review===r.review&&sameRecovery(old.recovery,recovery))))throw Error();
  }
  // A failed retry does not erase prior completion, but a changed result cannot
  // inherit it. Consumers must still match each saved file to this basis.
  if(old&&!sameResult(old,r))completed.delete(r.invocationId);
  if(r.complete)completed.set(r.invocationId,r);
  latest.set(r.invocationId,r);history.set(recordHash(r),r);
 }catch{errors++}
}
 return {latest,completed,errors};
}
module.exports={validCollection,recordHash,sameBundle,sameResult,collectionHistory};
