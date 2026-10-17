#!/usr/bin/env python3
import pathlib,subprocess,json,re,hashlib,collections,datetime
ROOT=pathlib.Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
BASE='c4c9bf712a0010346bbea0c020f8070d121d597c'
OUT=pathlib.Path('/private/tmp/ufz-correction-recovery-inventory')
RUN='docs/superpowers/runs/2026-10-16-workflow-reliability/'
PLAN='.superpowers/sdd/super-plan-ufz-plan/'
HAND=RUN+'fix-r1-handoff/source/'
KEYS={'recovery','checkevidence','requiredlivechecks','runfailures','failureattribution','recoveryobligations','checkfailures'}
def sha(b):return hashlib.sha256(b).hexdigest()
def save(n,o):
 p=OUT/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(o,indent=2,ensure_ascii=False)+'\n')
ls=subprocess.check_output(['git','ls-tree','-rl',BASE],cwd=ROOT,text=True).splitlines()
tree={}
for l in ls:
 a,p=l.split('\t',1);m,t,h,n=a.split();tree[p]={'gitBlob':h,'size':int(n)}
sources=[];objects=[];envelopes=[];prose=[];errors=[];excluded=[]
def choose(p):
 if p.startswith(RUN+'fix-r1-handoff-historical-addendum/raw/'):return 'historical-supplemental-review-return'
 if p.startswith(RUN+'reviews/') and re.fullmatch(r'[^/]+/final-review[^/]+\.md',p[len(RUN+'reviews/'):]):return 'historical-final-review-return'
 if p.startswith(HAND+'retained-task-evidence/') and p.endswith(('task-20-report-before-fix.md','task-20-review-before-fix.md')):return 'retained-before-fix-return'
 if p.startswith(RUN+'task-report-history-r1/raw/'):return 'historical-raw-task-source'
 if p.startswith(HAND):
  rel=p[len(HAND):]
  if '/' not in rel and not rel.endswith('.diff') and not rel.startswith('profile-'):return 'committed-handoff-canonical-source'
  if rel=='dispatch/impl-super-plan-ufz.29-result.json':return 'misplaced-canonical-return'
  if rel.startswith('retained-task-evidence/') and rel.endswith('manifest.json'):return 'retained-evidence-manifest'
 if p.startswith(RUN):
  rel=p[len(RUN):];parts=rel.split('/')
  if len(parts)==1 and (rel.endswith(('.md','.json'))):return 'run-record-or-report'
  if len(parts)==2 and parts[0].endswith('-stages') and (parts[1].startswith('result') or parts[1] in ['continuation.json','final-state.json','reporter-original.json','reporter-corrected.json','reporter-corrections.json']):return 'retained-roast-result'
  if len(parts)==2 and parts[0] in ['final-acceptance-accounting','post-cap-audit-checkpoint','post-loop-r2-checkpoint','final-sweep-combined-1'] and parts[1] in ['caller-gate-result.json','assessment.json','proposed-root-acceptance.json','input-manifest.json','measurement-normalization.json','result.json','caller-verified-result.json','command-plan.json','post-cap-audit-result.json','roast-pr-r2-result.json','parent-process-cleanup.json','scoped-process-cleanup.json']:return 'retained-caller-or-measurement-record'
  if len(parts)==2 and parts[0] in ['live-review-isolation','behavior-baseline','behavior-after','nochange-diagnostic'] and parts[1] in ['report.md','verification.json','metadata.json','protocol.json','claim-summary.json']:return 'evaluation-summary-not-live-return'
 if p.startswith('evidence/') and p.endswith(('.json','.md','.mjs')) and len(p.split('/'))<=3:return 'task-retained-measurement-or-runner'
 return None

def walk(o,path='$'):
 if isinstance(o,dict):
  for k,v in o.items():
   q=path+'/'+str(k).replace('~','~0').replace('/','~1')
   if k.lower() in KEYS:yield q,k,v
   yield from walk(v,q)
 elif isinstance(o,list):
  for i,v in enumerate(o):yield from walk(v,path+'/'+str(i))

def ingest(path,b,role,kind,meta):
 source_id=f's{len(sources)+1:04d}';h=sha(b);raw=OUT/'raw'/h;raw.parent.mkdir(exist_ok=True);raw.write_bytes(b)
 s=b.decode('utf-8',errors='replace');m={'sourceId':source_id,'path':path,'role':role,'identityKind':kind,'sha256':h,'bytes':len(b),'rawFile':str(raw.relative_to(OUT)),**meta};sources.append(m)
 blocks=[]
 try:
  o=json.loads(s);blocks=[(o,0,len(s),'whole-json','actual-artifact')]
 except json.JSONDecodeError as e:
  if path.endswith('.json'):errors.append({'sourceId':source_id,'path':path,'error':str(e),'populationStatus':'unknown-not-empty'})
  # Fences are extracted intact, then classified by context. Text/log fences remain prose, never searched as object sources.
  for fm in re.finditer(r'^```(?:json|JSON)\s*\n(.*?)^```\s*$',s,re.M|re.S):
   txt=fm.group(1);start=fm.start(1)
   try:o=json.loads(txt)
   except json.JSONDecodeError as e:errors.append({'sourceId':source_id,'line':s[:start].count('\n')+1,'error':str(e),'populationStatus':'unknown-not-empty'});continue
   blocks.append((o,start,start+len(txt),'json-fence','unclassified-fenced-object'))
  for lm in re.finditer(r'^(?:Recovery:\s*|\s*-\s*(?:root-acceptance|launch|recovery|check-evidence|run-failure)\s*·\s*)(\{.*\})\s*$',s,re.M|re.I):
   txt=lm.group(1);start=lm.start(1)
   try:o=json.loads(txt)
   except json.JSONDecodeError as e:errors.append({'sourceId':source_id,'line':s[:start].count('\n')+1,'error':str(e),'populationStatus':'unknown-not-empty'});continue
   blocks.append((o,start,start+len(txt),'ledger-json','actual-ledger-record'))
 for o,start,end,form,cl in blocks:
  oid=f'o{len(objects)+1:05d}';line=s[:start].count('\n')+1;context=s[max(0,start-700):start]
  obj={'objectId':oid,'sourceId':source_id,'path':path,'sourceSha256':h,'location':{'lineStart':line,'lineEnd':s[:end].count('\n')+1,'charStart':start,'charEnd':end},'form':form,'classification':cl,'contextBefore':context,'object':o}
  objects.append(obj)
  for q,k,v in walk(o):envelopes.append({'objectId':oid,'sourceId':source_id,'path':path,'sourceSha256':h,'location':obj['location'],'pointer':q,'key':k,'value':v,'classification':cl})
 # Preserve every term-bearing prose line, including quoted synthetic logs, for review without turning it into an obligation.
 for i,l in enumerate(s.splitlines()):
  if re.search(r'(?i)Recovery|checkEvidence|requiredLiveChecks|runFailures|failureAttribution',l):prose.append({'sourceId':source_id,'line':i+1,'text':l,'classification':'unreviewed-reference-not-inferred-obligation'})
 m['objectIds']=[o['objectId'] for o in objects if o['sourceId']==source_id];m['termLineCount']=sum(1 for x in prose if x['sourceId']==source_id)

for p,t in tree.items():
 role=choose(p)
 if role:ingest(p,subprocess.check_output(['git','show',BASE+':'+p],cwd=ROOT),role,'pinned-git',{'commit':BASE,**t})
 elif p.startswith(RUN) or p.startswith('evidence/'):excluded.append({'path':p,**t,'reason':'bounded inventory excludes nested archived fixtures/source mirrors, dispatch prompts, generated projections and raw log bytes except explicit known references; no emptiness claim'})
# Local untracked canonical records: capture every top-level relevant return/report/progress plus exact duplicate comparison, not source repair text.
pp=ROOT/PLAN
for p in sorted(pp.iterdir()):
 if not p.is_file():continue
 n=p.name
 take=(bool(re.match(r'task-\d+-(?:report|review).*\.(?:md|json)$',n)) or bool(re.match(r'(?:impl|fix|merge)-.*result\.json$',n)) or n in ['progress.md','coordinator-state.json','finish-state.json','finish-fix-r1.json','refill-18-result.json','task-23-scope-held-result.json','root-acceptance-gate-final.json','final-review-fix-r1-unavailable-attempt.json','launch-fix-r1.json','guidance-eval-assessment-r1.md','recovery-fixture-assessment-r1.md','invocation-fixture-assessment-r1.md','startup-builder-seam-assessment-r1.md'])
 if take:
  before=p.stat();b=p.read_bytes();after=p.stat();ingest(str(p.relative_to(ROOT)),b,'local-canonical-return-or-report','local-untracked-snapshot',{'mtimeNs':before.st_mtime_ns,'stableReadStat':(before.st_size,before.st_mtime_ns)==(after.st_size,after.st_mtime_ns),'capturedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()})
# Requested current inventory is deliberately a local document, not baseline source.
p=ROOT/(RUN+'merge-correction/acceptance-inventory.md');ingest(str(p.relative_to(ROOT)),p.read_bytes(),'task-instructions-inventory','local-current-document',{})
byhash=collections.defaultdict(list)
for s in sources:byhash[s['sha256']].append(s['sourceId'])
for s in sources:s['sameBytesSources']=byhash[s['sha256']]
save('manifest.json',{'schemaVersion':1,'historicalBaseline':BASE,'sourceCheckout':str(ROOT),'sources':sources,'parseErrors':errors,'excludedPathAccounting':excluded,'bounds':'Only chosen canonical returns/reports and named evidence records. No recursive semantic scan of nested archived checkouts/fixtures. Local untracked reads separate from pinned historical copies.','counts':{'sources':len(sources),'bytes':sum(s['bytes'] for s in sources),'objects':len(objects),'envelopes':len(envelopes),'parseErrors':len(errors),'excludedPaths':len(excluded)}})
save('objects-all-extracted.json',objects);save('envelopes-all-extracted.json',envelopes);save('term-lines.json',prose)
print(json.dumps({'sources':len(sources),'objects':len(objects),'envelopes':len(envelopes),'errors':len(errors),'bytes':sum(s['bytes'] for s in sources)},indent=2))
