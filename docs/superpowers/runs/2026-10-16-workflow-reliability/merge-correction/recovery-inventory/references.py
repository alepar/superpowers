#!/usr/bin/env python3
import pathlib,json,re,hashlib,subprocess,collections
P=pathlib.Path('/private/tmp/ufz-correction-recovery-inventory');M=json.loads((P/'manifest.json').read_text());ROOT=pathlib.Path(M['sourceCheckout']);BASE=M['historicalBaseline'];S=M['sources'];SS={s['sourceId']:s for s in S};A=json.loads((P/'objects-classified.json').read_text());E=json.loads((P/'measurement-records.json').read_text());RUN='docs/superpowers/runs/2026-10-16-workflow-reliability/';HAND=RUN+'fix-r1-handoff/source/'
def save(n,x):(P/n).write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
tree={}
for l in subprocess.check_output(['git','ls-tree','-rl',BASE],cwd=ROOT,text=True).splitlines():
 a,p=l.split('\t',1);m,t,h,n=a.split();tree[p]={'gitBlob':h,'bytes':int(n)}
refs=collections.defaultdict(list)
for e in E:refs[e['record']['location']].append({'kind':'typed-evidence-location','evidenceId':e['evidenceId'],'task':e['task'],'record':e['record']})
legacy=[]
for o in A:
 if re.search(r'evidence/super-plan-ufz\.14/(?:corrected-pre-rebase-required-results|final-required-results|pre-rebase-required-results|required-results)\.json$',o['path']):
  for i,v in enumerate(o['object']):
   legacy.append({'objectId':o['objectId'],'sourceId':o['sourceId'],'path':o['path'],'sourceSha256':o['sourceSha256'],'pointer':'$/'+str(i),'record':v,'sourceTreeBinding':'Not in this receipt. Preserve source-manifest/source-stability artifacts separately; no inferred or restamped hash.','configurationBinding':'Runner and source manifests retained separately; receipt itself lacks explicit exact configuration field.'})
   if v.get('log'):refs[v['log']].append({'kind':'legacy-runner-log','objectId':o['objectId'],'pointer':'$/'+str(i)})
   if isinstance(v.get('hygiene'),dict) and v['hygiene'].get('log'):refs[v['hygiene']['log']].append({'kind':'legacy-runner-hygiene','objectId':o['objectId'],'pointer':'$/'+str(i)+'/hygiene'})
resolved=[]
for loc,users in sorted(refs.items()):
 original,sep,anchor=loc.partition('#');r={'originalLocation':loc,'users':users,'anchor':anchor or None};poss=[]
 rel=original[len(str(ROOT))+1:] if original.startswith(str(ROOT)+'/') else original
 if rel in tree:poss.append((rel,'exact-repository-path'))
 if rel.startswith('.superpowers/sdd/super-plan-ufz-plan/'):
  suffix=rel[len('.superpowers/sdd/super-plan-ufz-plan/'):]
  if HAND+suffix in tree:poss.append((HAND+suffix,'committed-canonical-handoff-copy; path mapping only, report anchor retained'))
  if RUN+'task-report-history-r1/raw/'+suffix in tree:poss.append((RUN+'task-report-history-r1/raw/'+suffix,'committed-historical-raw-copy; path mapping only, report anchor retained'))
 if '/evidence/' in rel:
  suffix='evidence/'+rel.split('/evidence/',1)[1]
  if suffix in tree:poss.append((suffix,'task-worktree evidence path maps to committed evidence path; identity retained separately'))
 r['capturedExactOrCanonicalPaths']=[]
 for path,basis in sorted(set(poss)):
  b=subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT);sha=hashlib.sha256(b).hexdigest();raw=P/'raw'/sha;raw.write_bytes(b)
  r['capturedExactOrCanonicalPaths'].append({'path':path,'commit':BASE,**tree[path],'sha256':sha,'rawFile':'raw/'+sha,'mappingBasis':basis,'anchorContentVerified':False if anchor else None})
 if not poss:
  # Candidates preserve the exact subtree suffix. Never assert a copy from basename alone.
  stem=pathlib.PurePosixPath(original).name;task=next((x.get('task') for x in users if x.get('task')),None)
  cand=[p for p in tree if task and '/'+task+'/' in p and p.endswith('/'+stem) and ('retained-task-evidence/' in p or 'task-19-' in p)]
  r['unverifiedRetainedCandidates']=[{'path':x,**tree[x]} for x in cand]
  r['status']='unresolved-original-location: candidates are NOT established aliases' if cand else 'unresolved-original-location: original output not inventoried at exact path'
 else:r['status']='captured-exact-or-canonical-source; anchors require semantic correspondence'
 resolved.append(r)
save('reference-manifest.json',resolved);save('legacy-runner-attempts-complete.json',legacy)
print(json.dumps({'referenceLocations':len(resolved),'capturedLocations':sum(bool(x['capturedExactOrCanonicalPaths']) for x in resolved),'unresolvedLocations':sum(not x['capturedExactOrCanonicalPaths'] for x in resolved),'legacyRunnerObservations':len(legacy),'legacyRunnerFailedObservations':sum(x['record'].get('code') not in [0,None] for x in legacy)},indent=2))
