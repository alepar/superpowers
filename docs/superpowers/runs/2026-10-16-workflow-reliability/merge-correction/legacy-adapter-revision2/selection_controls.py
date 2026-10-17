#!/usr/bin/env python3
"""Selection-specific controls: exact boundaries/text/category and explicit judgments, not overlap."""
import argparse,hashlib,json,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('snapshot',type=Path);args=p.parse_args();b=args.snapshot
load=lambda n:json.loads((b/n).read_bytes())
m=load('reversible-manifest.json');entries={s['ordinal']:s for s in m['sources']};results=[]
def check(name,condition,detail):results.append({'name':name,'passed':bool(condition),'detail':detail})
census=[(2,3014,3613),(3,20452,21051),(7,5758,6278),(7,6279,6985),(11,10301,10750),(11,16157,17041),(15,8564,8868),(15,8869,9295),(17,539,986),(18,16071,16518),(21,21569,21919),(25,7247,7805),(25,14138,15094)]
for ordinal,start,end in census:
 e=entries[ordinal];md=load(e['metadata']);raw=(b/e['rawCopy']).read_bytes();maps=md.get('adapterOccurrenceMap',[]);matches=[x for x in maps if (x['rawByteStart'],x['rawByteEnd'])==(start,end)]
 ok=len(matches)==1
 if ok:
  x=matches[0];occ=next((o for o in load(e['parserExtraction'])['occurrences'] if (o['section'],o['position'])==(x['adapterSection'],x['adapterPosition'])),None)
  j=x.get('passageJudgment',{});ok=(x['category']=='historical-defect-assertion' and {'historical-finding','claimed-repair'}<=set(x['roles']) and x['rawText']==raw[start:end].decode() and occ is not None and occ['text']==x['adapterText'] and bool(j.get('assertionQuote')) and bool(j.get('repairClaimQuote')) and j.get('appliedDisposition') is False and j.get('selection')=='full-original-passage')
  if ok:ok=j['assertionQuote'] in x['rawText'] and j['repairClaimQuote'] in x['rawText']
 check(f'F1/{ordinal}/{start}:{end}',ok,'Exactly one complete independently judged finding+repair appearance with explicit source-local assertion/repair qualification; no test-name inference or disposition.')
e=entries[21];md=load(e['metadata']);raw=(b/e['rawCopy']).read_bytes();maps=md['adapterOccurrenceMap'];q=[x for x in maps if (x['rawByteStart'],x['rawByteEnd'])==(5652,5840)]
check('F2/exact-population-qualification',len(q)==1 and q[0]['rawText']==raw[5652:5840].decode() and q[0]['adapterText']==raw[5652:5840].decode().rstrip('\n') and q[0]['category']=='scope-or-coverage-qualification','Select exact substantive paragraph, including task-report population limit; equality, not overlap.')
check('F2/example-excluded',not any(x['rawByteStart']<5650 and x['rawByteEnd']>5358 for x in maps),'Illustrative JSON [5358,5650) is not a registered occurrence.')
check('F2/labelled-example-metadata',any(x.get('labelRawText')=='Actual emitted projection example:' and x.get('exampleByteSpan')==[5358,5650] and x.get('exampleRawText')==raw[5358:5650].decode() and x.get('qualificationByteSpan')==[5652,5840] for x in md.get('mixedPassageRepresentationJudgments',[])),'Original label, exact JSON example and exact qualifier remain distinguished in metadata.')
for ordinal,start,end in [(43,9651,9791),(49,22349,22581)]:
 e=entries[ordinal];md=load(e['metadata']);raw=(b/e['rawCopy']).read_bytes();maps=md['adapterOccurrenceMap'];x=[x for x in maps if (x['rawByteStart'],x['rawByteEnd'],x.get('jsonPointer'))==(start,end,'/concerns/0')]
 ok=len(x)==1
 if ok:
  x=x[0];ok=x['category']=='structured-concern-appearance' and x['rawText']==raw[start:end].decode() and x['decodedFieldText']==json.loads(raw[start:end]) and x['adapterText']==json.loads(raw[start:end]) and bool(x.get('originalReviewedJsonBlockSpan')) and x.get('representationChoice')=='parent-bounded-two-structured-concerns'
 check(f'parent-structured-concern/{ordinal}',ok,'Exact JSON string/pointer/value, separate original-source appearance, full original block provenance and bounded representation ruling.')
# Negative controls: source interpretations classify these as pure repair/support/example, not historical findings.
negative=[]
for ordinal in range(1,75):
 e=entries[ordinal];md=load(e['metadata'])
 for passage in md['allReviewedPassages']:
  rs=passage.get('roles',passage.get('semanticRoles',[passage.get('classification','')]))
  if rs in (['historical_repair_narrative'],['illustrative_contract_example'],['pure_context'],['claimed-repair']):
   exact=[x for x in md.get('adapterOccurrenceMap',[]) if (x['rawByteStart'],x['rawByteEnd'])==(passage['byteStart'],passage['byteEnd'])]
   negative.append(not exact)
check('negative/pure-repair-example-context-not-promoted',len(negative)>0 and all(negative),f'{len(negative)} explicitly pure repair/example/context passages remain metadata.')
# Frozen original strict24 and existing registrations are invariants, not satisfaction of F1/F2.
initial=Path('/private/tmp/ufz-correction-legacy-adapters-initial')
check('invariant/strict24',(b/'original-strict-occurrences.json').read_bytes()==(initial/'original-strict-occurrences.json').read_bytes(),'Exact original strict24 bytes unchanged.')
check('invariant/strict-supplements',load('supplemental-qualifications.json')==json.loads((initial/'supplemental-qualifications.json').read_bytes()),'All29 strict supplemental objects unchanged.')
check('invariant/open-gaps',load('unresolved-gaps.json')==json.loads((initial/'unresolved-gaps.json').read_bytes()),'All35 source gaps and four global categories remain open and unchanged.')
oldAccounting=json.loads((initial/'pending-obligation-accounting.json').read_bytes());newAccounting=load('pending-obligation-accounting.json')
key=lambda x:(x['source'],x['rawByteStart'],x['rawByteEnd'])
oldByKey={key(x):x for x in oldAccounting['qualifications']};newByKey={key(x):x for x in newAccounting['qualifications']}
check('invariant/105-reviewed-obligations-exact-text',len(newByKey)==105 and set(oldByKey)==set(newByKey) and all(newByKey[k]['originalFullRawText']==oldByKey[k]['originalFullRawText'] and newByKey[k]['roles']==oldByKey[k]['roles'] and newByKey[k]['requirementMappingStatus']==oldByKey[k]['requirementMappingStatus'] for k in oldByKey),'All105 original independently classified obligation passages and their open owner-mapping statuses survive; synthetic refs may change only through explicit correction mapping.')
e=entries[25];md=load(e['metadata']);raw=(b/e['rawCopy']).read_bytes();blocker=raw[15015:15094].decode()
check('invariant/task16-blocker-obligation-text',any(blocker in x['rawText'] and blocker.rstrip('\n') in x['adapterText'] for x in md['adapterOccurrenceMap']),'Original exact blocker text remains in the represented passage, independent of role/count regrouping; no closure/disposition inferred.')
oldCurrent=json.loads((initial/'current-registration-overlap-check.json').read_bytes());newCurrent=load('current-registration-overlap-check.json')
check('invariant/current73-records-and-run-hash',newCurrent['existingRecords']==oldCurrent['existingRecords'] and newCurrent['runMdSha256']==oldCurrent['runMdSha256'],'All73 original finding-source registrations and original run.md hash remain exact.')
report={'version':1,'snapshot':str(b),'controlScriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'results':results,'limit':'These controls establish bounded corrected selections and invariants; fresh semantic review remains required.'}
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(1 if report['failed'] else 0)
