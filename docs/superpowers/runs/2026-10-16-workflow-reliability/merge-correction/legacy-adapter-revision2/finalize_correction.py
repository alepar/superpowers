#!/usr/bin/env python3
"""Finalize temporary correction evidence; no original/frozen/canonical writes."""
from pathlib import Path
import collections,hashlib,json
B=Path(__file__).resolve().parent;R=B/'correction-round-1';I=Path('/private/tmp/ufz-correction-legacy-adapters-initial')
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(Path(p).read_bytes())
write=lambda p,x:Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
old=load(I/'reversible-manifest.json');new=load(B/'reversible-manifest.json');assert new['proposalRevision']==2
initialHashes=load(R/'initial-snapshot-hashes.json');actualInitial={str(p.relative_to(I)):p for p in I.rglob('*') if p.is_file()};assert set(actualInitial)=={x['artifact'] for x in initialHashes['files']}
for x in initialHashes['files']:assert sha(actualInitial[x['artifact']].read_bytes())==x['sha256'] and actualInitial[x['artifact']].stat().st_size==x['byteCount']
red=load(R/'selection-RED.stdout.json');green=load(R/'selection-GREEN.stdout.json');audit=load(B/'independent-structural-audit.json')
assert (red['passed'],red['failed'])==(7,18) and (green['passed'],green['failed'])==(25,0)
assert red['controlScriptSha256']==green['controlScriptSha256']==sha((B/'selection_controls.py').read_bytes())
assert audit['proposalRevision']==2 and audit['parserReextractionsPassed']==79 and audit['totalOccurrenceCount']==213 and audit['adapterOccurrenceMappingsChecked']==189
assert load(R/'selection-RED.receipt.json')['builderSha256']==sha((I/'build_proposal.py').read_bytes())==sha((R/'original-builder-reproduction/build_proposal.py').read_bytes())
assert load(R/'corrected-builder.receipt.json')['builderSha256']==sha((B/'build_proposal.py').read_bytes())
assert (B/'original-strict-occurrences.json').read_bytes()==(I/'original-strict-occurrences.json').read_bytes()
assert load(B/'supplemental-qualifications.json')==load(I/'supplemental-qualifications.json')
assert load(B/'unresolved-gaps.json')==load(I/'unresolved-gaps.json')
assert load(B/'current-registration-overlap-check.json')==load(I/'current-registration-overlap-check.json')
oldRecords={x['record']['source']:x['record'] for x in load(I/'finding-source-record-proposals.json')['records']};newRecords={x['record']['source']:x['record'] for x in load(B/'finding-source-record-proposals.json')['records']}
def refs(records):return {(source,o['section'],o['position']):o for source,r in records.items() for o in r['occurrences']}
oldRefs=refs(oldRecords);newRefs=refs(newRecords)
added=[{'ref':dict(zip(('source','section','position'),k)),'occurrence':newRefs[k]} for k in sorted(set(newRefs)-set(oldRefs))]
removed=[{'ref':dict(zip(('source','section','position'),k)),'occurrence':oldRefs[k]} for k in sorted(set(oldRefs)-set(newRefs))]
changedUnderSameRef=[k for k in set(oldRefs)&set(newRefs) if oldRefs[k]!=newRefs[k]]
assert len(added)==16 and len(removed)==2 and not changedUnderSameRef
changed=[]
for before,after in zip(old['sources'],new['sources']):
 assert before['source']==after['source'] and before['rawSha256']==after['rawSha256'] and before['rawByteCount']==after['rawByteCount']
 if before['retainedSha256']!=after['retainedSha256']:changed.append({'ordinal':after['ordinal'],'source':after['source'],'retainedArtifact':after['retainedArtifact'],'beforeSha256':before['retainedSha256'],'afterSha256':after['retainedSha256'],'beforeOccurrenceCount':before['parsedOccurrenceCount'],'afterOccurrenceCount':after['parsedOccurrenceCount']})
assert [x['ordinal'] for x in changed]==[2,3,7,11,15,17,18,21,25,43,49]
replacements=[]
for item in removed:
 source=item['ref']['source'];ref=item['ref']
 if 'raw-byte-000005358' in ref['section']:
  replacement=next(x['ref'] for x in added if x['ref']['source']==source and 'raw-byte-000005652' in x['ref']['section']);reason='F2 corrects an adapter selection error: unqualified illustrative JSON leaves occurrence extraction and remains exact labelled contextual evidence; its exact population qualification becomes the interpreted occurrence. This is no semantic rejection disposition.'
 elif 'raw-byte-000015015' in ref['section']:
  replacement=next(x['ref'] for x in added if x['ref']['source']==source and 'raw-byte-000014138' in x['ref']['section']);reason='F1 expands the adapter item to the full original mixed historical-finding/repair passage, including the exact unchanged blocker obligation. It replaces only the narrower synthetic representation; no blocker closure, supported resolution or cross-source identity decision occurs.'
 else:raise AssertionError(ref)
 replacements.append({'oldSyntheticRef':ref,'replacementSyntheticRef':replacement,'representationCorrectionOnly':True,'basis':reason,'appliedFindingLink':False,'appliedDisposition':False})
changeMap={'version':1,'proposalRevision':2,'correctionRound':1,'initialSnapshot':str(I),'initialManifestSha256':sha((I/'reversible-manifest.json').read_bytes()),'initialRecordsSha256':sha((I/'finding-source-record-proposals.json').read_bytes()),'correctedManifestSha256':sha((B/'reversible-manifest.json').read_bytes()),'correctedRecordsSha256':sha((B/'finding-source-record-proposals.json').read_bytes()),'sourceIDsAdded':[],'sourceIDsRemoved':[],'changedRetainedAdapters':changed,'addedExactRefs':added,'removedErroneousOrNarrowSyntheticRefs':removed,'changedOccurrenceObjectsUnderSameRef':[],'representationReplacements':replacements,'newHistoricalMixedAppearances':13,'boundedStructuredConcernAppearances':2,'oldTotalOccurrences':199,'newTotalOccurrences':213,'countLimit':'Appearances, obligations and qualifications; not independent defects/current outstanding totals. One prior blocker-only item is now part of a full mixed historical item; all105 reviewed obligation passages and29 strict supplements remain explicit.','strict24AndFiveRawReportsUnchanged':True,'all79OriginalRawHashesUnchanged':True,'all73ExistingRegistrationsUnchanged':True,'all35SourceAndFourGlobalGapsUnchanged':True,'frozenInitialSnapshotUnchanged':True,'canonicalWrites':0,'appliedLinks':0,'appliedDispositions':0,'semanticAcceptance':None}
write(R/'change-map.json',changeMap)
logs=[]
for n in ['failed-review.md','original-builder.py','selection-RED.stdout.json','selection-RED.stderr.log','selection-RED.receipt.json','selection-GREEN.stdout.json','selection-GREEN.stderr.log','selection-GREEN.receipt.json','corrected-builder.stdout.log','corrected-builder.stderr.log','corrected-builder.receipt.json','structural-GREEN.stdout.json','structural-GREEN.stderr.log','structural-GREEN.receipt.json','change-map.json']:
 p=R/n;logs.append({'artifact':'correction-round-1/'+n,'sha256':sha(p.read_bytes()),'byteCount':p.stat().st_size})
summary={'version':1,'proposalRevision':2,'correctionRound':1,'failedReviewSha256':sha((R/'failed-review.md').read_bytes()),'fidelitySpecVerdict':'fresh scoped semantic review pending; original snapshot NEEDS_FIX retained','qualityVerdict':'fresh scoped semantic review pending; original snapshot NEEDS_FIX retained','selectionRED':{'passed':7,'failed':18,'exitCode':1},'selectionGREEN':{'passed':25,'failed':0,'exitCode':0},'parserReextractionsPassed':79,'correctedAdapterOccurrenceCount':189,'unchangedStrictOccurrenceCount':24,'totalInterpretedOccurrences':213,'reviewedObligationPassagesAccounted':105,'strictSupplementalQualifications':29,'supportedCorrespondenceDrafts':69,'unsupportedUnknownOriginalOutcomes':5,'openSourceGaps':35,'globalGapCategories':4,'coreSuitesRun':0,'freshAgentsDispatched':0,'canonicalWrites':0,'frozenInitialSnapshotUnchanged':True,'manifestSha256':sha((B/'reversible-manifest.json').read_bytes()),'recordProposalsSha256':sha((B/'finding-source-record-proposals.json').read_bytes()),'changeMap':'correction-round-1/change-map.json','evidence':logs,'semanticAcceptance':None}
write(R/'correction-summary.json',summary)
report=f'''# Task 6 adapter correction round 1 — proposal revision 2

The initial snapshot failed fidelity/spec and quality review (NEEDS_FIX). It remains frozen at `{I}`; its complete review is retained at `review-evidence/adapter-initial-failed-review.md` and `correction-round-1/failed-review.md`. This revision corrects the bounded F1/F2 selections and implements the parent's two-concern representation ruling. Fresh scoped semantic review remains required before registration or correspondence approval.

F1's root cause was a blanket `claimed-repair` exclusion that overrode the independent reviewers' `historical-finding` judgment. Thirteen explicit source-local judgments now retain complete asserted historical finding appearances together with their repair qualifications. Each judgment identifies exact assertion/repair quotes and raw spans. Supporting TDD commands/output remain inside the one substantive historical item; pure repair/support/example passages remain metadata. No present applicability, supported repair, identity merge or disposition is inferred. Ordinal 25's full rebase passage replaces its narrower blocker-only adapter item while preserving the exact pending blocker text and owner requirement.

F2's root cause was paragraph indexing that selected the illustrative JSON block. Ordinal 21 now extracts exact raw bytes [5652,5840), the task-report population qualification. Its original label and JSON [5358,5650) remain explicit contextual metadata; example numbers establish no actual run metrics or finding totals.

The parent explicitly requested two independently identified structured concern renditions as additional separately attributed interpreted appearances: ordinal 43 `/concerns/0` [9651,9791) and ordinal 49 `/concerns/0` [22349,22581). Both retain exact raw JSON strings, decoded values, pointers and complete original JSON blocks. This is a bounded representation choice, not an exhaustive-every-quote claim or an independent-defect/identity decision.

The corrected proposal contains 189 adapter occurrences plus the exact original 24 strict occurrences: 213 appearances/obligations/qualifications, not outstanding defects. The change map records 16 added exact refs, two corrected/replaced synthetic refs, no altered occurrence objects under retained refs, and 11 changed adapter artifacts. All 79 source IDs and raw hashes, five strict raw reports, strict24, 29 supplemental qualifications, 105 reviewed obligation passages, original73 registrations, and 35 source/four global gaps remain retained. A pending-role count changes from 87 to 86 because one blocker item is represented inside the full historical item; no obligation was discharged.

The exact original builder was copied from the frozen snapshot and executed in the mutable `correction-round-1/original-builder-reproduction/` directory. The same selection-specific controls produce RED: 7 passed / 18 failed, exit 1, on those actual original-builder outputs; GREEN: 25 passed / 0 failed, exit 0, on revision2. The failing controls specifically cover all13 full mixed passages, exact F2 qualifier/example/label selection and the two structured concerns. They use equality, source-specific assertions and raw/decoded text checks rather than passage overlap alone. Negative controls retain pure repair/example/context metadata; invariants preserve strict24, supplements, gaps, current73 and obligation text.

Fresh structural validation re-extracted all79 reports, checked all189 adapter maps and exact strict24, verified raw hashes and decoded JSON provenance, and accounted for105 reviewed obligations. These are representation/selection controls, not a fresh semantic completeness or root-acceptance verdict. Core/product suites were not run; no new agents, original/frozen files, run, index, HEAD, tracker or Herdr state were changed.

## Stable core hashes

- Manifest: `{summary['manifestSha256']}`
- Source-record proposals: `{summary['recordProposalsSha256']}`
- Initial failed-review bytes: `{summary['failedReviewSha256']}`

## Evidence

- `correction-round-1/change-map.json`: complete old/new exact refs, source artifact hashes and bounded representation replacements.
- `mixed-passage-judgments.json`: all13 explicit F1 source-local judgments.
- `correction-round-1/selection-RED.*` and `selection-GREEN.*`: exact control output, exit codes and SHA-256 receipts.
- `correction-round-1/structural-GREEN.*`, `validation-results.json` and `independent-structural-audit.json`: lossless/extraction/accounting checks.
- `correction-round-1/initial-snapshot-hashes.json`: every frozen initial file checked unchanged.
- `correction-round-1/correction-summary.json` and `output-inventory.json`: bounded results and final artifact hashes.

`build_proposal.py` regenerates the core corrected proposal using the fixed original reviews and explicit correction judgments. `selection_controls.py SNAPSHOT` and `verify_proposal.py` perform read-only checks; `finalize_correction.py` refreshes this correction report, change map and output inventory. Captured failed-review history and RED/GREEN logs are retained evidence, not claims generated from a passing status or later silence.
'''
(B/'CORRECTION-ROUND-1.md').write_text(report)
files=[{'artifact':str(p.relative_to(B)),'byteCount':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in sorted(B.rglob('*')) if p.is_file() and p.name!='output-inventory.json']
write(B/'output-inventory.json',{'version':1,'proposalRevision':2,'excludesSelf':True,'files':files})
print(json.dumps({k:v for k,v in summary.items() if k!='evidence'},indent=2))
print('change-map SHA256',sha((R/'change-map.json').read_bytes()))
print('output-inventory SHA256',sha((B/'output-inventory.json').read_bytes()))
