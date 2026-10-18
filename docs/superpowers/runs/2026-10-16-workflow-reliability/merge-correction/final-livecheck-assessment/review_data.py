from pathlib import Path
import subprocess,json,hashlib,re,copy,datetime,math
ROOT=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
OUT=Path('/private/tmp/ufz-correction-final-livecheck-assessment'); HEAD='c21681200aac20fb0223b6b0e83e953b1bc75cde'; TREE='294ee3186698a29c112b7ed7daded506288a52f1'
sha=lambda x:hashlib.sha256(x).hexdigest()
def git(*a):return subprocess.check_output(['git','-C',str(ROOT),*a],stderr=subprocess.PIPE)
def blob(rev,p,optional=False):
 try:return git('show',rev+':'+p)
 except subprocess.CalledProcessError:
  if optional:return None
  raise
def fact(rev,p):
 data=blob(rev,p);return {'revision':rev,'path':p,'bytes':len(data),'sha256':sha(data),'gitBlob':git('rev-parse',rev+':'+p).decode().strip()}
def readjson(p):return json.loads(Path(p).read_text())
def dump(name,o):(OUT/name).write_text(json.dumps(o,indent=2,ensure_ascii=False)+'\n')
assert git('rev-parse',HEAD+'^{tree}').decode().strip()==TREE
B='docs/superpowers/runs/2026-10-16-workflow-reliability/'
originalPath=Path('/private/tmp/ufz-correction-recovery-applicability/obligation-map.json');originalData=originalPath.read_bytes();original=readjson(originalPath);historical=original['requiredLiveCheckMap'];assert len(historical)==33
inputs=OUT/'inputs';inputs.mkdir(exist_ok=True);(inputs/'original-obligation-map.json').write_bytes(originalData)
# Preserve exact original JSON object spans, not just reserialized equal values.
s=originalData.decode();start=s.index('"requiredLiveCheckMap"');start=s.index('[',start);decoder=json.JSONDecoder();_,end=decoder.raw_decode(s,start);arraybytes=s[start:end].encode();(inputs/'original-requiredLiveCheckMap-array.json').write_bytes(arraybytes)
rawdir=OUT/'original-live-declarations';rawdir.mkdir(exist_ok=True);pos=start+1;rawrefs=[]
for row in historical:
 while s[pos].isspace() or s[pos]==',':pos+=1
 obj,endobj=decoder.raw_decode(s,pos);assert obj==row;raw=s[pos:endobj].encode();p=rawdir/(row['requirementId']+'.json');p.write_bytes(raw);rawrefs.append({'requirementId':row['requirementId'],'path':str(p),'sha256':sha(raw),'bytes':len(raw),'originalCharStart':pos,'originalCharEnd':endobj});pos=endobj
# Original report/code/output and baseline/final profile conservation.
r27=B+'fix-r1-handoff/source/task-27-report.md';v27=B+'fix-r1-handoff/source/task-27-review.md';r28=B+'fix-r1-handoff/source/task-28-report.md';v28=B+'fix-r1-handoff/source/task-28-review.md'
reports={p:blob(HEAD,p) for p in [r27,v27,r28,v28]}
for row in [historical[27],historical[29]]:
 for prov in row['declarationProvenance']:
  if prov['path'] in reports:assert sha(reports[prov['path']])==prov['sourceSha256']
text27=reports[r27].decode();text28=reports[r28].decode()
js=re.search(r'## One-off comparison source[\s\S]*?```js\n([\s\S]*?)\n```',text27).group(1)
log27=re.search(r'## Verification output\n\n```text\n([\s\S]*?)\n```',text27).group(1)
shell28=re.search(r'Final executed command[\s\S]*?```bash\n([\s\S]*?)\n```',text28).group(1)
stdin28=shell28.split("<<'PY'\n",1)[1].rsplit('\nPY',1)[0]
log28=re.search(r'Output \(exit 0,[^\n]*\):\n\n```text\n([\s\S]*?)\n```',text28).group(1)
for name,data in [('l0028-source-excerpt.txt',js),('l0028-retained-output-excerpt.txt',log27),('l0030-stdin-excerpt.txt',stdin28),('l0030-retained-output-excerpt.txt',log28)]: (inputs/name).write_text(data)
profile=B+'profile-implementation';beforeRev='c3fac4369c7c737e2e7f9f7250fd253b21442d12';fixedTree=historical[27]['historicalRequirement']['sourceTree']
before=json.loads(blob(beforeRev,profile+'.json'));fixed=json.loads(blob(fixedTree,profile+'.json'));final=json.loads(blob(HEAD,profile+'.json'))
assert fixed==final
profiles=[]
for ext in ['json','md']:
 a,b=blob(fixedTree,profile+'.'+ext),blob(HEAD,profile+'.'+ext);assert a==b
 profiles.append({'historical':fact(fixedTree,profile+'.'+ext),'final':fact(HEAD,profile+'.'+ext),'exactSameBytes':True})
def flatten(x,path='',out=None):
 if out is None:out={}
 if isinstance(x,dict):
  for k,v in x.items():flatten(v,path+'/'+k,out)
 elif isinstance(x,list):
  for i,v in enumerate(x):flatten(v,path+'/'+str(i),out)
 else:out[path]=x
 return out
fb,ff=flatten(before),flatten(final);changed=sorted(k for k in set(fb)|set(ff) if fb.get(k,object())!=ff.get(k,object()))
allowed=sorted(['/diagnosis/dominant','/simulation/verdict','/simulation/qualification','/simulation/whatIfs/0/note','/simulation/whatIfs/1/note']+['/summary/'+str(i) for i in [3,5,7,12,18,19]])
assert changed==allowed
nb={k:v for k,v in fb.items() if type(v) in [int,float]};nf={k:v for k,v in ff.items() if type(v) in [int,float]};assert nb==nf
rawkeys=[k for k in before if k not in ['diagnosis','simulation','summary']];assert all(before[k]==final[k] for k in rawkeys)
assert all(before['diagnosis'][k]==final['diagnosis'][k] for k in ['planningMs','windowMs'])
def rawsim(a):
 x=copy.deepcopy(a);x.pop('verdict',None);x.pop('qualification',None)
 for w in x['whatIfs']:w.pop('note',None)
 return x
assert rawsim(before['simulation'])==rawsim(final['simulation'])
oldmd=blob(beforeRev,profile+'.md').decode();md=blob(HEAD,profile+'.md').decode()
middle=lambda x:x[x.index('## Per bead'):x.index('## Schedule model')]
tail=lambda x:x[x.index('## Timeline'):]
assert middle(oldmd)==middle(md) and tail(oldmd)==tail(md)
sched=lambda x:[r.split('|')[2:] for r in x[x.index('| scenario |'):x.index('## Timeline')].strip().split('\n')]
assert sched(oldmd)==sched(md);assert md.split('```')[1].strip().splitlines()==final['summary']
late={x['id']:x for x in final['beads'] if x['id'] in ['super-plan-ufz.14','super-plan-ufz.20']}
date=lambda s:datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
pre=(date(late['super-plan-ufz.20']['createdAt'])-date(late['super-plan-ufz.14']['dispatchedAt'])).total_seconds()*1000
excess=final['simulation']['lowerBoundMs']-final['window']['graphMs'];wait=next(x for x in final['criticalPath']['segments'] if x['ms']>14*3600000)
noagent=final['concurrency']['byActive']['0']/final['concurrency']['wallMs']*100
assert excess==903057 and pre==434869 and round(noagent)==83 and wait['ms']==51989476
assert all(x['readyAt'] is None and x['waitMs'] is None for x in late.values())
assert final['simulation']['verdict']=='inconclusive' and final['diagnosis']['dominant']=='unknown'
assert all(w['savingMs']==final['simulation']['asRunMs']-w['ms'] for w in final['simulation']['whatIfs'])
profileJudgment={'id':'l0028','judgment':'SUPPORTED data conservation and qualification at frozen final source; no product rerun required for this historical data-only slot','originalSourceTree':fixedTree,'originalComparisonSource':{'retainedIn':r27,'excerptSha256':sha(js.encode()),'standaloneOriginalFileProof':'Source retained exactly within hash-bound original report; no standalone compare-profile.mjs/log-byte identity asserted beyond that report'},'originalOutput':{'retainedIn':r27+'#verification-output','excerptSha256':sha(log27.encode()),'originalOutcomePreserved':'live/pass'},'baselineRevision':beforeRev,'profileByteConservation':profiles,'independentReadOnlyComparisons':{'changedInterpretationLeaves':changed,'numericLeavesUnchanged':len(nb),'rawTopLevelSubtreesUnchanged':len(rawkeys),'diagnosisTimesUnchanged':True,'rawSimulationResultsUnchanged':True,'markdownRawMiddleAndTimelineSuffixByteIdentical':True,'scheduleNumericColumnsUnchanged':True,'markdownJsonSummarySameLines':len(final['summary'])},'semanticMath':{'modelOnlyMinimumMs':final['simulation']['lowerBoundMs'],'observedGraphMs':final['window']['graphMs'],'modelExcessMs':excess,'task14DispatchPrecedesTask20CreationMs':pre,'longWaitMs':wait['ms'],'noAgentPercentUnrounded':noagent,'noAgentPercentRounded':round(noagent),'wallMs':final['concurrency']['wallMs'],'planningMs':final['diagnosis']['planningMs'],'allAgentPeak':final['concurrency']['peak'],'taskSlotPeak':final['taskSlots']['peak'],'taskSlotCap':final['taskSlots']['cap'],'whatIfSavingsMatchModelBaseline':True},'qualification':'Raw contradictory observations are conserved; unknown readiness/waits and historical topology remain unknown; final prose/JSON explicitly disclaim established historical lower-bound/causal remedy. What-if savings are model-relative, not demonstrated elapsed savings. No general profiler, performance or new behavioral measurement claim.','remainingForThisDataOnlySlot':[]}
# Archive integrity reads: captured red baseline -> restored old tree -> frozen final.
archive=B+'live-review-isolation/';red='e3749b014f6939cb82f5e79a33dc020f5b3961f0';restoredTree=historical[29]['historicalRequirement']['sourceTree'];manifestData=blob(HEAD,archive+'artifact-manifest.json');manifest=json.loads(manifestData);provData=blob(HEAD,archive+'retained-equivalents/provenance.json');prov=json.loads(provData)
assert len(manifest)==81 and len(prov['audit'])==81;assert sha(manifestData)==prov['originalManifestSha256']
assert blob(red,archive+'artifact-manifest.json')==manifestData==blob(restoredTree,archive+'artifact-manifest.json')
assert blob(red,archive+'report.md')==blob(restoredTree,archive+'report.md')==blob(HEAD,archive+'report.md')
audit={x['originalIdentity']:x for x in prov['audit']};restored={x['originalIdentity']:x for x in prov['restored']};archiveChecks=[];missing=[];unchanged=0
for path,want in manifest.items():
 full=archive+path;old=blob(red,full,True);hist=blob(restoredTree,full);now=blob(HEAD,full)
 assert now==hist and sha(now)==want
 assert audit[path]['expectedSha256']==audit[path]['retainedSha256']==want and audit[path]['bytes']==len(now)
 if old is None:missing.append(path)
 else:assert old==now;unchanged+=1
 a={'identity':path,'sha256':want,'bytes':len(now),'finalGitBlob':git('rev-parse',HEAD+':'+full).decode().strip(),'historicalRestoredGitBlob':git('rev-parse',restoredTree+':'+full).decode().strip(),'sameRestoredFinalBytes':True,'baselinePresent':old is not None,'baselineSameBytes':old==now if old is not None else None,'provenanceAuditMatches':True}
 if path in restored:
  r=restored[path];source=Path(r['sourceLocation']);data=source.read_bytes();assert data==now and sha(data)==r['sourceSha256']==r['expectedSha256']==r['retainedSha256'] and len(data)==r['bytes'];assert blob('612ea0a7e4d64480bdd01e0ac842b539115342ee',full,True) is None
  mode=git('ls-tree',HEAD,'--',full).decode().split()[0];assert mode=='100644'
  a['originalTempSourceVerifiedNow']={'path':str(source),'sha256':sha(data),'bytes':len(data),'exactBytesEqual':True};a['captured612Absent']=True;a['finalGitMode']=mode
 archiveChecks.append(a)
assert missing==prov['before']['missing'] and unchanged==76 and len(restored)==5
assert blob(restoredTree,archive+'retained-equivalents/provenance.json')==provData
restoreChanges=git('diff','--name-status','69c3a0d001b0533aa4a8f682f51ca4e4bd8a5551',restoredTree).decode().splitlines();assert set(restoreChanges)=={'A\t'+archive+n for n in missing+['retained-equivalents/provenance.json']}
archiveReport=blob(HEAD,archive+'report.md').decode()
for required in ['not a baseline/control or multi-repetition behavioral certification','does not execute the real coordinator','Task-review no-test policy was not exercised','Global process observation via ps was denied','first verifier reported false positives']:
 assert required in archiveReport
archiveJudgment={'id':'l0030','judgment':'SUPPORTED exact81-entry conservation/restoration and continued narrow qualification at final source; no new product behavior run required','originalAuditSource':{'retainedIn':r28,'fullStdinExcerptSha256':sha(stdin28.encode()),'originalOutputExcerptSha256':sha(log28.encode()),'originalOutcomePreserved':'live/pass at restored tree; earlier baseline-red live/fail retained separately'},'baselineRevision':red,'baselineTree':prov['baselineTree'],'restoredHistoricalTree':restoredTree,'manifest':fact(HEAD,archive+'artifact-manifest.json'),'report':fact(HEAD,archive+'report.md'),'provenance':fact(HEAD,archive+'retained-equivalents/provenance.json'),'baselineManifestAndReportByteIdentical':True,'restoredFinalManifestReportProvenanceByteIdentical':True,'manifestEntries':81,'finalHashMatches':81,'missingAtBaseline':missing,'original76ByteIdentical':unchanged,'restoredFiveOriginalSourcesStillMatchNow':True,'restorationDeltaOnlySixDeclaredAdditions':True,'entries':archiveChecks,'qualification':'Archive bytes/identity restoration only. Original exercise remains one representative historical source, no baseline/control/repetition certification, controlled assembler failure, sampled state, initial verifier false positives, denied global process inspection, task-review policy and hosted Workflow untested. Hash retention does not certify historical behavior for changed current product.','remainingForThisDataOnlySlot':[]}
# Rebind these bounded facts to actual existing inventories, not their broad claims.
finalInventory=Path('/private/tmp/ufz-correction-final-artifact-inventory-c216/complete-final-path-inventory.json');inv=readjson(finalInventory);idx={r['path']:r for r in inv['records']};paths=[profile+'.json',profile+'.md',r27,v27,r28,v28,archive+'artifact-manifest.json',archive+'report.md',archive+'retained-equivalents/provenance.json']+[archive+x for x in manifest]
bindings=[]
for p in paths:
 f=fact(HEAD,p);r=idx.get(p);assert r is not None and r['sha256']==f['sha256'] and r['bytes']==f['bytes'] and r['gitBlob']==f['gitBlob'];bindings.append({'path':p,'sha256':f['sha256'],'bytes':f['bytes'],'finalGitBlob':f['gitBlob'],'inventoryMatches':True,'previousTrackedFact':r.get('previousTrackedFact')})
planPath=Path('/private/tmp/ufz-correction-final-suite-plan-c2168120.json');plan=readjson(planPath);ownerPath=Path('/private/tmp/ufz-correction-final-suite-owner-amendment.json');owner=readjson(ownerPath)
assert plan['sourceHead']==owner['sourceHead']==HEAD and plan['sourceTree']==owner['sourceTree']==TREE and owner['planSha256']==sha(planPath.read_bytes());assert len(plan['commands'])==47==len(set(plan['commands']))
assert plan['commands'][44:]==['node tests/super-code/test-verification-settlement-profile.mjs','node tests/super-code/unplanned-admission-final-wave.mjs','node tests/super-code/fixture-liveness-final-wave.mjs']
runPath=ROOT/(B+'run.md');runData=runPath.read_bytes();runlines=runData.decode().splitlines();snapshots=[json.loads(s.split(' · ',1)[1]) for s in runlines if s.startswith('- root-acceptance · ')];canonical=[json.loads(s.split(' · ',1)[1]) for s in runlines if s.startswith('- measurement-amendment · ')];assert canonical[-1]==owner;old,current=snapshots[0],snapshots[-1];assert current['sourceTree']==TREE
assert len(old['requirements'])==57 and len(current['requirements'])==69 and len(owner['changes'])==50
assert all(q['id'] in {q['id'] for q in current['requirements']} for q in old['requirements']) and all(e in current['checkEvidence']['records'] for e in old['checkEvidence']['records'])
for c in owner['changes']:
 if c['previous'] is not None:assert c['previous'] in old['requirements']
 assert c['next'] in current['requirements']
prior=readjson('/private/tmp/ufz-correction-final-live-check-map-proposal.json');byOld={r['requirementId']:r for r in prior['rows']};newCase={str(i+1).zfill(2):{'caseId':str(i+1).zfill(2),'command':c,'entrypointSha256':plan['entrypoints'][i]['sha256'],'requirementIds':plan['entrypoints'][i]['requirementIds']} for i,c in enumerate(plan['commands'])};newRequirements={q['id']:q for q in current['requirements']}
assess=[]
for h,ref in zip(historical,rawrefs):
 rid=h['requirementId'];previous=byOld[rid];cases=[copy.deepcopy(newCase[c['caseId']]) for c in previous['matchingProspectiveCases']]
 a={'requirementId':rid,'originalDeclarationExactBytes':ref,'originalRequirementObjectUnchanged':True,'mappedFinalCases':cases,'sourceHead':HEAD,'sourceTree':TREE,'oldOutcomeRetained':h['historicalOutcomes'],'historicalPassBecomesCurrentPass':False,'factBoundChange':'Final source and approved source/configuration owner amendment now identified; current execution results still unassessed','currentVerificationState':'Pending actual final case receipt/outcome and original33 applicability integration; running suite has no final pass judged here','priorScopeOrUnknownRetained':h['nonReconstructableHistoricalUnknown'],'sameIdAmendmentBindings':[{'id':i,'next':newRequirements[i]} for c in cases for i in c['requirementIds'] if i in newRequirements]}
 if rid in ['l0025','l0026']:
  qid='current-live-tmpdir-inherited' if rid=='l0025' else 'current-live-tmpdir-trailing';a['targetedRequirement']=newRequirements[qid];a['currentVerificationState']='Pending separate inherited/trailing targeted operation after serial47 suite; no variant pass inferred';a['factBoundChange']='Actual distinct target requirement ID/source/configuration now recorded; previous hypothetical run name replaced in assessment only'
 if rid=='l0027':a['tmpdirScope']='Only case03 owned slashfree; does not substitute l0025 inherited/l0026 trailing'
 if rid in ['l0028','l0030']:
  a['dataOnlyJudgmentReference']='data-only-judgments.json#'+rid;a['factBoundChange']='Previously pending bounded conservation/qualification review completed by exact frozen Git blob, report source/output and raw-data/math checks';a['currentVerificationState']='Supported historical-scope reuse/conservation; no additional product run and no final-source behavior claim';a['remainingForThisSlot']=[]
 if rid=='l0029':a['factBoundChange']='Final owned source/evidence roots now identified; inspection remains separate';a['currentVerificationState']='Pending parent current owned-resource inspection after runs; no inspection performed/inferred';a['ownedRootsKnown']=[plan['checkout'],plan['output']]
 if rid in ['l0032','l0033']:a['inlineEnvironmentEquivalenceBoundary']='Original inline TMPDIR/HOME/XDG command retained byte-identically; actual same-ID combined-case config explicitly amended to controlled env at final tree. Historical inventory-slot applicability bridge must be carried explicitly into final caller assessment, not silent exact-command equality.'
 if rid in ['l0012','l0031']:a['failureFixCorrespondenceRetained']=h['currentEquivalentEvidenceNeeded'];a['historicalFailureNotErased']=True
 assess.append(a)
# All33 originals remain exact in copied input and exact raw object spans; assessment is separate.
assessment={'schemaVersion':1,'scope':'Bounded original33 live-check applicability update and actual l0028/l0030 data conservation review. No final product measurements/eligibility judged.','sourceHead':HEAD,'sourceTree':TREE,'original33':{'inputPath':str(originalPath),'inputSha256':sha(originalData),'conservedWholeInput':str(inputs/'original-obligation-map.json'),'exactOriginalArray':str(inputs/'original-requiredLiveCheckMap-array.json'),'arraySha256':sha(arraybytes),'exactObjectCount':33,'objects':rawrefs},'executionPlan':{'path':str(planPath),'sha256':sha(planPath.read_bytes()),'distinctCommands':47,'extraTmpdirOperationsPending':2,'totalProductInvocationsIfCompleted':49,'commands45to47':[newCase[x] for x in ['45','46','47']],'state':'Parent reports serial47 running; no result read/certified by this review; two targeted variants pending'},'ownerAmendmentVerification':{'path':str(ownerPath),'sha256':sha(ownerPath.read_bytes()),'authority':owner['authority'],'canonicalRunPath':str(runPath),'canonicalRunSnapshotSha256AtRead':sha(runData),'canonicalAmendmentExactlyEqualsPrivate':True,'changesVerified':50,'originalRequirements':57,'currentRequirements':69,'allOldRequirementIdsRetained':True,'all37OldCheckRecordsRetained':True,'amendmentState':owner['state'],'oldAggregateMismatchPreservedAsPredecessor':True,'authorityIsNotWaiver':True,'currentEvidenceEntriesObserved':len(current['evidence']),'requiredLivePopulationGapStillRecorded':current['checkEvidence']['gaps']},'dataOnlyJudgmentsFile':'data-only-judgments.json','dataOnlySupportedSlots':['l0028','l0030'],'perOldGapFactBoundChanges':assess,'inventoryBindingsFile':'inventory-bindings.json','notPerformed':['product/historical command or original script execution','suite result judgment','current owned-process inspection, signals or cleanup','new runner/test/framework','canonical RUN/product/index/Herdr/tracker writes','broader historical recertification','root eligibility or human decision inference'],'remainingRequirements':['Actual final47 source-bound suite outcomes and all case/configuration receipts, including exact documented48/19/23 assertions','Actual inherited and trailing TMPDIR operations with separate exact configurations, plus case03 slashfree evidence','Explicit final historical33 applicability bridge from exact retained original declaration identities to actual new evidence, preserving original failures and source/configuration amendments','Parent scoped owned-resource inspection and truthful unknown/retention reporting (l0029)','Applicable independent review/guidance/finding-continuity/Recovery/human requirements remain caller-assessed; no waiver or historical reconstruction invented']}
dump('data-only-judgments.json',{'l0028':profileJudgment,'l0030':archiveJudgment,'reportSourceFacts':[fact(HEAD,p) for p in reports]});dump('inventory-bindings.json',{'inventory':{'path':str(finalInventory),'sha256':sha(finalInventory.read_bytes())},'head':HEAD,'tree':TREE,'boundedVerifiedPaths':len(bindings),'records':bindings});dump('assessment.json',assessment)
print(json.dumps({'dataOnlySupported':['l0028','l0030'],'numericLeavesConserved':len(nb),'rawSubtreesConserved':len(rawkeys),'profileInterpretationChanges':len(changed),'archiveEntriesConserved':len(archiveChecks),'original76Conserved':unchanged,'restored5OriginalSourceBytesMatch':True,'inventoryBindings':len(bindings),'original33ExactRawObjects':len(rawrefs),'finalDistinctCommands':47,'extraTargetsPending':2,'totalPlannedInvocations':49,'finalMeasurementsClaimed':False},indent=2))
