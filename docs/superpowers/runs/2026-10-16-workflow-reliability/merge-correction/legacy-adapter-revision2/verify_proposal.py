#!/usr/bin/env python3
"""Read-only independent structural audit; its only writes are tmp audit artifacts."""
import hashlib,json,subprocess,collections
from pathlib import Path
B=Path(__file__).resolve().parent
load=lambda p:json.loads((B/p).read_bytes())
sha=lambda b:hashlib.sha256(b).hexdigest()
m=load('reversible-manifest.json');p=load('finding-source-record-proposals.json');records={x['record']['source']:x['record'] for x in p['records']}
assert len(records)==79
assert sha(Path(m['parser']).read_bytes())==m['parserSha256']
assert sha((Path(m['originalRun'])/'run.md').read_bytes())==m['originalRunMdSha256']
strict=[];parsedtotal=0;maptotal=0;sourceChecks=[]
for entry in m['sources']:
 source=entry['source'];raw=(B/entry['rawCopy']).read_bytes();retained=(B/entry['retainedArtifact']).read_bytes()
 assert len(raw)==entry['rawByteCount'] and sha(raw)==entry['rawSha256']
 assert raw==(Path(m['originalRun'])/entry['rawArtifact']).read_bytes()
 assert sha(retained)==entry['retainedSha256']
 assert sha((B/entry['metadata']).read_bytes())==entry['metadataSha256']
 md=load(entry['metadata'])
 assert md['source']==source and md['appliedIdentityLinks']==[] and md['appliedDispositions']==[] and md['acceptanceJudgment'] is None
 result=subprocess.run(['bash',m['parser'],'--complete','--source',source,entry['retainedArtifact']],cwd=B,capture_output=True,text=True)
 assert result.returncode==0,(source,result.stderr)
 actual=json.loads(result.stdout);assert actual==records[source]
 parsedtotal+=len(actual['occurrences'])
 if entry['mode']=='original-strict-bytes':
  assert raw==retained
  original=load('existing-strict-json/'+Path(entry['rawArtifact']).name+'.complete.json')
  assert actual['occurrences']==original['occurrences'] and actual['kind']==original['kind'] and actual['verdict']==original['verdict']
  strict.extend([dict(source=source,**o) for o in actual['occurrences']])
 else:
  byref={(o['section'],o['position']):o for o in actual['occurrences']}
  maps=md.get('adapterOccurrenceMap',[])
  for item in maps:
   assert raw[item['rawByteStart']:item['rawByteEnd']].decode()==item['rawText']
   assert item['adapterSectionSynthetic'] is True
   assert byref[(item['adapterSection'],item['adapterPosition'])]['text']==item['adapterText']
   maptotal+=1
  if not maps:
   assert md.get('adapterScopedEmptyBasis') and actual['occurrences']==[]
   for empty in md['adapterScopedEmptyBasis']:assert raw[empty['byteStart']:empty['byteEnd']].decode()==empty['rawText']
 sourceChecks.append({'source':source,'retainedSha256':sha(retained),'parserExitCode':0,'occurrences':len(actual['occurrences'])})
assert strict==load('original-strict-occurrences.json') and len(strict)==24
allrefs={(r['source'],o['section'],o['position']) for r in records.values() for o in r['occurrences']};assert len(allrefs)==parsedtotal
supported=load('source-correspondence-supported-proposals.json')['approvals'];unsupported=load('source-correspondence-unsupported-gaps.json')['associations']
for assoc in supported+unsupported:
 entry=next(x for x in m['sources'] if x['source']==assoc['source']);actual=records[assoc['source']]
 assert assoc['sha256']==entry['rawSha256'] and assoc['retainedSha256']==entry['retainedSha256']
 assert assoc['interpretation']['kind']=='legacy-adapter'
 if assoc in supported:
  assert assoc['judgment']=='supported'
  assert actual['verdict']==entry['originalCompactRecognition']['verdict'] and actual['kind']==entry['originalCompactRecognition']['kind']
 else:
  assert 'judgment' not in assoc and assoc['status']=='unsupported/gap'
  assert entry['originalCompactRecognition'].get('kind') is None and actual['verdict']=='NEEDS_CONTEXT'
 for mapping in assoc.get('lines',[]):
  for ref in mapping['refs']:assert (ref['source'],ref['section'],ref['position']) in allrefs
assert len(supported)==69 and len(unsupported)==5
ob=load('pending-obligation-accounting.json');assert ob['unrepresentedReviewedObligationPassages']==0
report={'version':1,'proposalRevision':m.get('proposalRevision',1),'status':'representation checks pass; semantic proposal remains unapproved','sourceCount':79,'parserReextractionsPassed':79,'strictSourceCount':5,'originalStrictOccurrencesExactlyPreserved':24,'adapterOccurrenceMappingsChecked':maptotal,'totalOccurrenceCount':parsedtotal,'occurrenceCountLimit':'Representation appearances and obligations, not a current outstanding-defect total.','supportedStatusPreservingCorrespondenceProposals':len(supported),'unsupportedUnknownOriginalOutcomeAssociations':len(unsupported),'reviewedObligationPassagesAccounted':ob['reviewedObligationPassageCount'],'unrepresentedReviewedObligationPassages':0,'canonicalSourceHashesUnchanged':True,'canonicalWrites':0,'identityLinksApplied':0,'dispositionsApplied':0,'semanticAcceptance':None,'sources':sourceChecks}
(B/'independent-structural-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
files=[]
for f in sorted(B.rglob('*')):
 if f.is_file() and f.name!='output-inventory.json':files.append({'artifact':str(f.relative_to(B)),'byteCount':f.stat().st_size,'sha256':sha(f.read_bytes())})
(B/'output-inventory.json').write_text(json.dumps({'version':1,'excludesSelf':True,'files':files},indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='sources'},indent=2))
