#!/usr/bin/env python3
import pathlib,json,re,collections,hashlib,subprocess,datetime
OUT=pathlib.Path('/private/tmp/ufz-correction-recovery-inventory');M=json.loads((OUT/'manifest.json').read_text());SS={s['sourceId']:s for s in M['sources']};A=json.loads((OUT/'objects-all-extracted.json').read_text());ROOT=pathlib.Path(M['sourceCheckout']);BASE=M['historicalBaseline'];RUN='docs/superpowers/runs/2026-10-16-workflow-reliability/';HAND=RUN+'fix-r1-handoff/source/'
def save(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def canonical(o):return json.dumps(o,sort_keys=True,ensure_ascii=False,separators=(',',':'))
def h(o):return hashlib.sha256(canonical(o).encode()).hexdigest()
MAP_SOURCE=next(s for s in M['sources'] if s['path'].endswith('fix-r1-handoff/source/mapping-all.json'))
TASK_MAP={int(v['n']):v['id'] for v in json.loads((OUT/MAP_SOURCE['rawFile']).read_text())['mapping']}
def task(o):
 x=o['object'];p=o['path'];text=(OUT/SS[o['sourceId']]['rawFile']).read_text()
 if isinstance(x,dict) and re.fullmatch(r'super-plan-ufz\.\d+(?:\.\d+)?',str(x.get('id',''))):return x['id']
 m=re.search(r'task-(\d+)-(?:report|review)',p)
 if m and int(m.group(1)) in TASK_MAP:return TASK_MAP[int(m.group(1))]
 m=re.search(r'super-plan-ufz\.\d+(?:\.\d+)?',text[:900]);
 if m:return m.group(0)
 m=re.search(r'evidence/(super-plan-ufz\.\d+)/',p)
 if m:return m.group(1)
 m=re.search(r'task-(\d+)-(?:report|review)',p)
 return 'task-report-'+m.group(1) if m else None
ACT=[];EX=[];OTHER=[]
for o in A:
 p=o['path'];n=p.split('/')[-1];s=SS[o['sourceId']];x=o['object'];cl='context-artifact';reason='Preserved complete artifact; does not itself assert a producer-result population.';label=None
 if o['form']=='json-fence':
  m=re.search(r'task-(\d+)-(?:report|review)',n)
  if m and int(m.group(1))>=19:
   cl='actual-task-return-or-source-bound-record';reason='Report explicitly presents complete structured result or source-bound evidence/check declarations.'
   if isinstance(x,list):
    context=o['contextBefore'];before=re.sub(r'```json\s*$','',context).rstrip()
    if re.search(r'(?:requiredLiveChecks|Required live checks)[`:\s]*$',before,re.I):label='requiredLiveChecks'
    elif re.search(r'(?:## Evidence|evidence[^\n]*)[`:\s]*$',before,re.I):label='evidence'
    else:label='unclassified-array'
  else:cl='example-or-fixture-output';reason='Explicit downstream fixture/illustrative producer/projection example; never a real run obligation.'
 elif o['form']=='ledger-json':
  cl='actual-root-acceptance-snapshot' if isinstance(x,dict) and 'requirements' in x else 'actual-Recovery-record'
  reason='Literal complete JSON ledger record, retained with original line and bytes.'
 elif re.match(r'(?:impl|fix)-super-plan-ufz\..*-result\.json$',n):cl='actual-producer-return';reason='Retained implementer/fixer returned object, not a dispatch prompt.'
 elif p.startswith('evidence/') and p.endswith('.json'):
  cl='actual-measurement-artifact';reason='Retained task measurement receipt/source manifest; evidence slots are actual recorded measurements, not a Workflow return.'
 elif n in ['proposed-root-acceptance.json','caller-gate-result.json','root-acceptance-gate-final.json']:
  cl='actual-root-acceptance-snapshot';reason='Retained caller accounting proposal/gate result. Empty arrays retain documented population gaps and do not prove a complete empty run.'
 elif n in ['result.json','caller-verified-result.json'] and '/final-sweep-combined-1/' in p:cl='actual-measurement-artifact';reason='Retained final-suite output with original source/configuration; no restamp.'
 elif s['role']=='retained-roast-result':cl='actual-roast-output';reason='Actual retained roast stage result (including failed attempts); nested code examples in findings are inert strings.'
 elif p.endswith('metrics-examples.md'):cl='example-or-fixture-output';reason='Explicit fixture examples, not run measurements.'
 o.update({'classification':cl,'classificationBasis':reason,'taskIdentity':task(o),'arrayLabel':label})
 if cl.startswith('actual'):ACT.append(o)
 elif cl=='example-or-fixture-output':EX.append(o)
 else:OTHER.append(o)
save('actual-objects-complete.json',ACT);save('examples-excluded-complete.json',EX);save('context-objects-complete.json',OTHER);save('objects-classified.json',A)
# Each declaration/measurement/association below retains all source occurrences. Exact duplicates consolidate by task + unchanged JSON value only.
reqs={};evs={};assocs={};empty=[];rec=[]
def prov(o,pointer):return {'objectId':o['objectId'],'sourceId':o['sourceId'],'path':o['path'],'sourceSha256':o['sourceSha256'],'location':o['location'],'pointer':pointer,'identityKind':SS[o['sourceId']]['identityKind']}
def add(store,key,value,o,pointer):
 k=(o['taskIdentity'],canonical(value));store.setdefault(k,{'task':o['taskIdentity'],'record':value,'provenance':[]})['provenance'].append(prov(o,pointer))
for o in ACT:
 x=o['object'];sets=[]
 if isinstance(x,dict):
  for name in ['requiredLiveChecks','evidence','failureAttribution']:
   if name in x and isinstance(x[name],list):sets.append((name,x[name],'$/'+name))
  if isinstance(x.get('checkEvidence'),dict):
   for key,name in [('requiredLiveChecks','requiredLiveChecks'),('records','evidence')]:
    if isinstance(x['checkEvidence'].get(key),list):sets.append((name,x['checkEvidence'][key],'$/checkEvidence/'+key))
  elif isinstance(x.get('checkEvidence'),list):sets.append(('evidence',x['checkEvidence'],'$/checkEvidence'))
 elif isinstance(x,list) and o['arrayLabel'] in ['requiredLiveChecks','evidence']:sets.append((o['arrayLabel'],x,'$'))
 for name,rows,ptr in sets:
  if not rows and name in ['requiredLiveChecks','failureAttribution']:empty.append({'field':name,**prov(o,ptr),'task':o['taskIdentity'],'meaning':'Explicit empty declaration in this record only; no run-wide or prior-obligation erasure.'})
  for i,v in enumerate(rows):
   if not isinstance(v,dict):continue
   dest={'requiredLiveChecks':reqs,'evidence':evs,'failureAttribution':assocs}[name]
   if name=='evidence' and not all(k in v for k in ['sourceTree','command','configuration','outcome','kind','location']):continue
   add(dest,name,v,o,ptr+'/'+str(i))
 if o['classification']=='actual-Recovery-record':rec.append(o)
# Mechanical comparisons only. A same-task exact measurement match is neither gate acceptance nor a later-source disposition.
E=list(evs.values());R=list(reqs.values())
for i,e in enumerate(E):e['evidenceId']=f'e{i+1:04d}'
for i,r in enumerate(R):
 r['requirementId']=f'l{i+1:04d}';v=r['record'];matches=[e for e in E if e['task']==r['task'] and all(e['record'].get(k)==v.get(k) for k in ['sourceTree','command','configuration'])]
 r['matchingEvidenceIds']=[e['evidenceId'] for e in matches];r['observedExactOutcomes']=sorted(set(e['record']['kind']+'/'+e['record']['outcome'] for e in matches));r['comparison']='live-pass-observed' if any(e['record']['kind']=='live' and e['record']['outcome']=='pass' for e in matches) else 'live-fail-observed' if any(e['record']['kind']=='live' and e['record']['outcome']=='fail' for e in matches) else 'no-exact-live-measurement-in-inventoried-actual-records'
for a in assocs.values():
 a['referencedEvidenceBySource']=[]
 # Indices are resolved in ORIGINAL same-object evidence array only, never global combined indices.
 for pr in a['provenance']:
  o=next(x for x in A if x['objectId']==pr['objectId']);arr=o['object'].get('evidence',[]) if isinstance(o['object'],dict) else []
  linked={k:{'index':v,'record':arr[v] if isinstance(v,int) and 0<=v<len(arr) else None} for k,v in a['record'].items() if k in ['observed','runBaseline','taskBase','verification']}
  a['referencedEvidenceBySource'].append({'objectId':o['objectId'],'links':linked})
save('required-live-checks.json',R);save('measurement-records.json',E);save('failure-attribution-actual.json',list(assocs.values()));save('explicit-empty-fields.json',empty);save('Recovery-records-actual.json',rec)
# Preserve complete non-code prose sections for evidence/obligation references; scope obligations may be paragraphs rather than JSON.
prose=[];seen=set()
for s in M['sources']:
 if s['sha256'] in seen:continue
 seen.add(s['sha256']);text=(OUT/s['rawFile']).read_text();lines=text.splitlines();fence=False;start=0;paras=[];section=''
 for i,line in enumerate(lines+['']):
  if line.startswith('```'):
   fence=not fence
   if paras:
    if re.search(r'(?i)Recovery|checkEvidence|requiredLiveChecks|runFailures|failureAttribution|fresh.agent|pending|live.*evaluat|evaluat.*live|attribution|not run|parent.owned|coordinator.owned','\n'.join(paras)):prose.append({'sourceId':s['sourceId'],'path':s['path'],'sourceSha256':s['sha256'],'lineStart':start+1,'lineEnd':i,'section':section,'text':'\n'.join(paras),'classification':'prose-source-statement-requires-scope-judgment-not-synthetic-JSON'})
    paras=[]
   continue
  if fence:continue
  if line.startswith('#'):section=line
  if line.strip():
   if not paras:start=i
   paras.append(line)
  elif paras:
   if re.search(r'(?i)Recovery|checkEvidence|requiredLiveChecks|runFailures|failureAttribution|fresh.agent|pending|live.*evaluat|evaluat.*live|attribution|not run|parent.owned|coordinator.owned','\n'.join(paras)):prose.append({'sourceId':s['sourceId'],'path':s['path'],'sourceSha256':s['sha256'],'lineStart':start+1,'lineEnd':i,'section':section,'text':'\n'.join(paras),'classification':'prose-source-statement-requires-scope-judgment-not-synthetic-JSON'})
   paras=[]
save('prose-evidence-statements.json',prose)
# Account for all local top-level entries considered by selector (not read if outside scope).
local=[]
for p in sorted((ROOT/'.superpowers/sdd/super-plan-ufz-plan').iterdir()):
 match=[s for s in M['sources'] if s['path']==str(p.relative_to(ROOT))]
 local.append({'path':str(p.relative_to(ROOT)),'kind':'directory' if p.is_dir() else 'file','capturedSources':[s['sourceId'] for s in match],'status':'captured' if match else 'metadata-only: outside bounded canonical-return selection; not asserted empty'})
save('local-path-accounting.json',local)
counts={'actualObjectsIncludingCopies':len(ACT),'exampleObjectsExcludedIncludingCopies':len(EX),'contextObjects':len(OTHER),'exactTaskRequirementIdentities':len(R),'requirementComparisons':dict(collections.Counter(r['comparison'] for r in R)),'exactTaskMeasurementRecords':len(E),'failedMeasurementRecords':sum(e['record']['outcome']=='fail' for e in E),'actualFailureAssociationRecords':len(assocs),'formalRecoveryRecordsIncludingCopies':len(rec),'formalRecoveryRecordValues':len({canonical(o['object']) for o in rec}),'explicitEmptyFieldsIncludingCopies':len(empty)}
save('counts.json',counts)
print(json.dumps(counts,indent=2));print('NONPASS REQUIRED:')
for r in R:
 if r['comparison']!='live-pass-observed':print(r['requirementId'],r['task'],r['record']['sourceTree'],r['record']['command'],r['observedExactOutcomes'])
print('ASSOCIATIONS:')
for a in assocs.values():print(a['task'],a['record'])
print('UNCLASSIFIED ARRAYS:',[(o['objectId'],o['path']) for o in ACT if o['arrayLabel']=='unclassified-array'])
