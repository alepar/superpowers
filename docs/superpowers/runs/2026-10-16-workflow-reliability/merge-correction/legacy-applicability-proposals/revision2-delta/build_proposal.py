import json, hashlib, re, subprocess, shutil
from pathlib import Path
from collections import Counter

BASE=Path('/private/tmp/ufz-correction-legacy-relevance')
OUT=BASE/'revision2-delta'
SRC=Path('/private/tmp/ufz-correction-legacy-adapters')
WORK=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
RUN='docs/superpowers/runs/2026-10-16-workflow-reliability'
FREEZE='583f2486ebe6b00a5c6fe3b87bc3d5b98ed53533'
RECORD_SHA='c04593efb7ffd0b9414222ee39c1337e1b3e5d2722356d11fe2de0dfd5e7b9ee'
MANIFEST_SHA='d759bee75ac79d3952540ff325f13f422848b8c26ed5a599d4a47cca4066e262'
sha=lambda b:hashlib.sha256(b).hexdigest()
read=lambda p:json.loads(p.read_text())
def write(name,v):
 (OUT/name).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def git(args):return subprocess.run(['git',*args],cwd=WORK,capture_output=True)
def blob(path):
 p=git(['show',FREEZE+':'+path]);assert p.returncode==0,(path,p.stderr)
 return p.stdout
def refkey(r):return (r['source'],r['section'],r['position'])
def initial_hashes():return {str(p.relative_to(BASE)):sha(p.read_bytes()) for p in BASE.rglob('*') if p.is_file() and 'revision2-delta' not in p.relative_to(BASE).parts}
before=initial_hashes()
OUT.mkdir(exist_ok=True)
assert sha((SRC/'finding-source-record-proposals.json').read_bytes())==RECORD_SHA
assert sha((SRC/'reversible-manifest.json').read_bytes())==MANIFEST_SHA
change=read(SRC/'correction-round-1/change-map.json')
records=read(SRC/'finding-source-record-proposals.json')
initial=read(BASE/'exact-ref-proposals.json')
initial_index={refkey(p['originalRef']):p for p in initial['occurrences']}
current_index={refkey({'source':s['record']['source'],**o}):(s,o) for s in records['records'] for o in s['record']['occurrences']}
assert len(change['addedExactRefs'])==16 and len(change['removedErroneousOrNarrowSyntheticRefs'])==2
assert len(current_index)==213
removed={refkey(x['ref']) for x in change['removedErroneousOrNarrowSyntheticRefs']}
for k,p in initial_index.items():
 if k not in removed:
  s,o=current_index[k]
  assert p['originalRef']=={'source':s['record']['source'],**o}
for path in ['CORRECTION-ROUND-1.md','correction-round-1/change-map.json','mixed-passage-judgments.json','finding-source-record-proposals.json','reversible-manifest.json']:
 d=OUT/'pinned-input'/path;d.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(SRC/path,d)

code={}
def lines_evidence(key,path,a,b,kind='frozen-static-inspection'):
 data=blob(path);lines=data.splitlines(keepends=True);start=sum(map(len,lines[:a-1]));text=b''.join(lines[a-1:b]);dest=OUT/'frozen-source'/path
 dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
 code[key]={'kind':kind,'revision':FREEZE,'path':path,'fileSha256':sha(data),'lineStart':a,'lineEnd':b,'byteStart':start,'byteEnd':start+len(text),'text':text.decode(),'retained':'frozen-source/'+path}
 return key

lines_evidence('history-order-code','skills/super-code/coordinator.js',471,516)
lines_evidence('history-order-fixture','tests/super-code/replay-harness.mjs',628,640)
lines_evidence('resume-confirmed-append-code','skills/super-code/coordinator.js',874,920)
lines_evidence('resume-clear-and-array-fixtures','tests/super-code/replay-harness.mjs',2037,2069)
lines_evidence('zero-metrics-conditional-code','skills/super-code/coordinator.js',2299,2305)
lines_evidence('zero-metrics-unchanged-expectation','tests/super-code/replay-harness.mjs',3797,3803)
lines_evidence('verification-source-prompt','skills/super-code/coordinator.js',2849,2862)
lines_evidence('verification-confirmed-completion','skills/super-code/coordinator.js',1459,1475)
lines_evidence('verification-resume-fixtures','tests/super-code/replay-harness.mjs',827,855)
lines_evidence('unknown-source-coverage-guard','skills/super-auto/scripts/scope-dispositions',69,84)
lines_evidence('unknown-source-coverage-fixture','tests/super-auto/test-scripts.sh',390,398)
lines_evidence('operative-finding-field-table','skills/super-auto/run-state.md',61,67)
lines_evidence('operative-finding-record-contract','skills/super-auto/run-state.md',307,349)
lines_evidence('contract-mutation-fixtures','tests/super-auto/test-contract-lint.sh',411,420)
lines_evidence('direct-package-detection','skills/super-auto/scripts/report-status',439,470)
lines_evidence('run-failure-gap-gate','skills/super-auto/scripts/report-status',146,155)
lines_evidence('run-failure-gap-fixture','tests/super-auto/test-scripts.sh',130,137)

rawcache={}
def raw_evidence(key,basename,a,b):
 path='task-report-history-r1/raw/'+basename;data=(SRC/'raw'/path).read_bytes()
 assert blob(RUN+'/'+path)==data,(key,'raw differs from frozen original')
 dest=OUT/'original-raw'/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
 lines=data.splitlines(keepends=True);start=sum(map(len,lines[:a-1]));text=b''.join(lines[a-1:b])
 code[key]={'kind':'historical-report-with-recorded-execution-evidence','retainedAtRevision':FREEZE,'originalArtifact':RUN+'/'+path,'originalRawSha256':sha(data),
  'lineStart':a,'lineEnd':b,'byteStart':start,'byteEnd':start+len(text),'text':text.decode(),'retained':'original-raw/'+path,
  'limits':'These are the original recorded command/results excerpts, not tests executed by this delta reviewer or new final-tree verification.'}
 rawcache[basename]=data
 return key

raw_evidence('history-order-fix-source','task-10-report-fix.md',5,85)
raw_evidence('history-order-appended-source','task-10-report.md',201,281)
raw_evidence('resume-original-source-identity','task-11-report.md',1,20)
raw_evidence('resume-original-regressions-and-final-checks','task-11-report.md',65,114)
raw_evidence('zero-metrics-original-source-and-final-checks','task-12-report.md',5,74)
raw_evidence('zero-metrics-original-assertion','task-12-report.md',95,121)
raw_evidence('verification-seam-source-and-results','task-12-report.md',155,210)
raw_evidence('projection-original-source-and-final-checks','task-13-report.md',5,107)
raw_evidence('projection-original-regressions','task-13-report.md',125,129)
raw_evidence('direct-package-fix-source-and-results','task-14-report-fix.md',5,112)
raw_evidence('direct-package-appended-source-and-results','task-14-report.md',166,273)
raw_evidence('metrics-seam-source-and-results','task-15-report.md',247,346)
raw_evidence('root-gate-original-regression-and-results','task-16-report.md',116,180)
raw_evidence('root-seam-source-and-results','task-16-report.md',244,339)

# Individually judged scenarios; a common label or copied text supplies no identity link.
cases={
 1:dict(title='Structured collector selection/containment concern',criteria=['R1','R9','R15'],classification='current-required-composition-obligation',routes=['selector','review','suite'],
  disposition=None,evidence=[],basis='This original JSON concern explicitly requires composing independently owned input selection with source containment across shared collector lines. It neither asserts a separate defect nor measures a completed integration. The parent still needs the actual final selector/containment composition review and final suite; interim frozen-source inspection cannot establish Task 4 final behavior.'),
 2:dict(title='Structured historical profile qualification and caller gates',criteria=['R7','R14','R15'],classification='historical-scope-with-current-required-caller-obligations',routes=['behavior','review','suite','human'],
  disposition=None,evidence=[],basis='The exact JSON concern limits this leaf to historical interpretation correction and separately leaves review, final sweep, changed-instruction evaluation and human/root acceptance with the caller. Historical graph reconstruction/new measurement is not required by approved design section 5. Keep the named current caller gates pending; this separate appearance is not another independent defect.'),
 3:dict(title='Appended history-order contradiction loss',criteria=['R5','R8'],classification='supported-bounded-historical-repair-proposal',routes=[],disposition='supported-historical-mechanism-repair-proposal',
  evidence=['history-order-appended-source','history-order-code','history-order-fixture'],
  basis='The original appended report describes loss of an earlier contradiction after a different-source repair, retaining its 1980/1 RED. It also retains the explicit every-verification correction and final 1981/0 checks at the named fixed tree. Frozen code iterates all retained verifications and records prior gaps while reopening only active conflicting verification; the exact different-source fixture still checks retained b-source contradiction after e-source repair. This supports this source appearance independently, without borrowing a later silence or applying a link to the fix-report appearance.'),
 4:dict(title='Fix-report history-order contradiction loss',criteria=['R5','R8'],classification='supported-bounded-historical-repair-proposal',routes=[],disposition='supported-historical-mechanism-repair-proposal',
  evidence=['history-order-fix-source','history-order-code','history-order-fixture'],
  basis='This source names fixed head 340d4ef85fbe59dbf55950d3c5e6c44df5d11d28 and tested tree 4790bbe2d53e9418423b55cc9f9e399ddc6757ec. Its specific history-order RED 1980/1 is followed by an executed 1981/0 run that explicitly passes earlier-contradiction retention. Current static inspection confirms the complete-history guard and scenario fixture, not a final-tree pass. The separately appended report remains a separate occurrence.'),
 5:dict(title='In-memory Recovery clear before durable confirmation',criteria=['R4'],classification='supported-bounded-historical-repair-proposal',routes=[],disposition='supported-historical-mechanism-repair-proposal',
  evidence=['resume-original-source-identity','resume-original-regressions-and-final-checks','resume-confirmed-append-code','resume-clear-and-array-fixtures'],
  basis='Original source records the actual failed unconfirmed-clear case, 2010/1, and 2011/0 after combining clear/completion append before reduction. Its final rebased head 26cc469e06bab7b6dad98cb726326f949d1c486f records replay 2074/0 and passing dispatch commands. Frozen resume code awaits the combined append and retains the obligation on unavailable persistence before readRecovery/settle; the null append/retry fixture asserts recovery-held and the original pending closure. This supports only this all-closed recovery transaction, not every interruption or later partial-close defect.'),
 6:dict(title='Missing closed-status array threw during resume',criteria=['R4'],classification='supported-bounded-historical-repair-proposal',routes=[],disposition='supported-historical-mechanism-repair-proposal',
  evidence=['resume-original-source-identity','resume-original-regressions-and-final-checks','resume-confirmed-append-code','resume-clear-and-array-fixtures'],
  basis='The original report preserves TypeError and 2014/4, records 2018/0 after explicit array guards, and gives final rebased 2074/0 with exact commands. Frozen known-observation classification first requires both closed/open arrays, then uses includes; missing closed is a retained held reason. The actual fixture includes {landed:true,open:[]} and asserts no throw, bounded one attempt, retained additive data and explicit recovery-held. No unsafe generic array guarantee beyond this route is inferred.'),
 7:dict(title='Zero-valued verification metric broke unchanged output',criteria=['R6','R13','R15'],classification='supported-bounded-historical-repair-proposal',routes=[],disposition='supported-historical-output-compatibility-repair-proposal',
  evidence=['zero-metrics-original-source-and-final-checks','zero-metrics-original-assertion','zero-metrics-conditional-code','zero-metrics-unchanged-expectation'],
  basis='The original report identifies the intermediate zero-valued field regression and the conditional output fix, names head 9610071921c440aa1debff4b873525b42cf3f217/tree a9b037fe8c354ce529bdfd79413a6ccfa8df6fa7, and records exact replay/dispatch/digest commands exiting 0 with replay 2062/0. Frozen production appends the verification-only suffix only when cVerification is nonzero, while the unchanged fixture still requires the exact legacy completion line. This supports exact zero-count output compatibility, not all current metrics corrections or behavior.'),
 8:dict(title='Verification-only resume wrongly required Git landing',criteria=['R4','R6'],classification='supported-bounded-historical-repair-proposal',routes=[],disposition='supported-historical-mechanism-repair-proposal',
  evidence=['verification-seam-source-and-results','resume-confirmed-append-code','verification-source-prompt','verification-confirmed-completion','verification-resume-fixtures'],
  basis='The source names rebased head 70854e385736ce425a65d027a629ae0c1d58263c/tree ab08708333a5454aca375c8b87d905fd8784fb7a. It preserves three specific RED seam failures (2189/3) and executed final 2192/0 plus dispatch/digest passes for sourceVerified/no-landing and confirmed closure. Frozen resume selects verification.source/head, requires sourceVerified, avoids landed insertion, and confirms durable typed completion before settle; current fixtures verify zero impl/review/merge and no invented landing. B4 agent adherence and unrelated pending interruption repairs remain separate.'),
 9:dict(title='No retained source returned clean projection',criteria=['R9','R10'],classification='supported-bounded-historical-repair-proposal',routes=[],disposition='supported-historical-coverage-gap-repair-proposal',
  evidence=['projection-original-source-and-final-checks','projection-original-regressions','unknown-source-coverage-guard','unknown-source-coverage-fixture'],
  basis='The source preserves wrong exit 0 versus required 3, records the added unknown-coverage guard, and identifies final head ee4f3cfcd20a6eb8ada40f32e821dbbd6895630b with actual final script/lint commands exiting 0. Its exact output includes the no-retained-source assertion passing. Frozen helper still emits unknown-coverage gap when no finding-source exists, and the fixture checks exit 3. This narrow missing-population guard does not prove every declared source is accounted or resolve current legacy registration gaps.'),
 10:dict(title='Operative finding-record fields/formats missing',criteria=['R9','R10'],classification='supported-bounded-historical-repair-proposal',routes=[],disposition='supported-historical-operative-contract-repair-proposal',
  evidence=['projection-original-source-and-final-checks','projection-original-regressions','operative-finding-field-table','operative-finding-record-contract','contract-mutation-fixtures'],
  basis='The source identifies exact missing approvals finding-source/link/route/disposition fields and formats, retains failing lint, and records final operative table/examples/instructions plus actual rebased script and lint success at ee4f3cfcd20a6eb8ada40f32e821dbbd6895630b. Frozen run-state field table and operative record instructions contain those fields/formats; mutation fixtures still reject dropped/changed approved additions. This supports the specific historical documentation/contract omission, not semantic sufficiency of any supplied disposition or future lint pass.'),
 11:dict(title='Appended direct-review package suffix mismatch',criteria=['R9'],classification='supported-bounded-historical-repair-proposal',routes=[],disposition='supported-historical-producer-consumer-repair-proposal',
  evidence=['direct-package-appended-source-and-results','direct-package-detection'],
  basis='The source-local appended fix names RED production 9095b266 and fixed efec33f6c7ceb333d695a5163b9d4987116c2fc7; actual producer-shaped scripts went from seven failures to exit 0, including byte preservation, inventory, conflict, direct-only null and idempotent gaps. Frozen hasBundle and discovery both recognize .md.diff. The original Important assertion and its exact producer filename stay attributed to this source; this does not apply an identity link to the separate fix report or certify current acceptance recovery transitions.'),
 12:dict(title='Fix-report direct-review package suffix mismatch',criteria=['R9'],classification='supported-bounded-historical-repair-proposal',routes=[],disposition='supported-historical-producer-consumer-repair-proposal',
  evidence=['direct-package-fix-source-and-results','direct-package-detection'],
  basis='The exact fix report identifies producer ${reviewPath}.diff with final-review-ID.md, correction of discovery plus hasBundle, fixed efec33f6c7ceb333d695a5163b9d4987116c2fc7, seven expected RED failures and actual GREEN script/lint commands. Current frozen suffix detection preserves both fixes. Support is bounded to that producer/collector filename and original null-bundle behavior; separate current gate/population/recovery corrections remain pending final verification.'),
 13:dict(title='Actual retained metrics population qualification',criteria=['R9','R12','R13'],classification='nonblocking-historical-population-qualification-with-current-accounting-route',routes=['source-accounting','cleanup-metrics'],disposition=None,evidence=[],
  basis='This exact original paragraph states task reports were absent from that specific retained fixture/projection population and other-section groups remained in the full projection. It prevents interpreting absence as zero run-wide task reviews. It is not a current run metric or evidence current task-report coverage is absent. Preserve this historical scope limit; current source population and supported partial metrics still require the existing R9/R12/R13 accounting. The replaced JSON example has no adoption authority.'),
 14:dict(title='Metrics rebase conflict with missing named seam wrapper',criteria=['R4','R12','R13'],classification='supported-bounded-historical-seam-repair-proposal',routes=[],disposition='supported-historical-seam-addressed-proposal',
  evidence=['metrics-seam-source-and-results'],
  basis='The original source preserves absence of task-15-review-seam.diff and says the complete quoted dispatch matched the reproduced conflict. It gives original head 548a0b08, original stacked boundary 70741213, exact --onto target 6c332aa2, resolved coordinator hunk, range-diff preservation, final head 9b41133178416096df0b16a390342d81eeb0f690 and actual combined 2263/0 with independent-source/no-fictitious-landing cases. Frozen ancestry is inspected separately; a missing historical wrapper is not fabricated or demanded anew. This addresses the specific historical seam, not a current rebase or tracker/root disposition.'),
 15:dict(title='Full root-acceptance rebase passage and retained blocker',criteria=['R4','R7'],classification='supported-historical-seam-with-unresolved-current-bookkeeping',routes=['tracker-reconciliation','review'],disposition='supported-historical-seam-addressed-proposal-only',
  evidence=['root-seam-source-and-results'],
  basis='The complete passage gives exact --onto boundary/target, only-own-commit replay, verbatim source-population and acceptance blocks, patch-equivalence, final 0bb280edcf5fc6a60499fdfdb090d1819a432963/tree 87567e36e0dde251b05a76381473ff3330b50d22, and four actual combined command passes (replay 2273/0, status 44 assertions, lint and digest). That supports this historical conflict resolution only. The exact same source expressly leaves super-plan-8fn for parent closure after verified merge; current tracker closure was not observed and cannot follow from ancestry or reported FIXED.'),
 16:dict(title='Verified run failure with history gaps incorrectly eligible',criteria=['R5','R7','R8'],classification='supported-bounded-historical-repair-proposal',routes=[],disposition='supported-historical-acceptance-gap-repair-proposal',
  evidence=['root-gate-original-regression-and-results','root-seam-source-and-results','run-failure-gap-gate','run-failure-gap-fixture'],
  basis='The original source preserves eligible:true on a run-introduced/verified failure retaining conflicting source history, its wrong 0 versus 3 exit, then the bounded gap-retention correction and actual status rerun. It identifies initial source 232d3ca4/tree 4ebd4903 and later rebased 0bb280ed/tree 87567e36, with recorded final 44 acceptance assertions and combined commands passing. Frozen report-status emits each f.gaps before considering verified/pre-run state, and its actual fixture still expects exit 3 for this exact run-introduced verified-with-gap input. This supports only the historical lost-gap mechanism, not global root eligibility, current source population, semantic evidence reconciliation or Task 4 final changes.'),
}

proposals=[]
for number,added in enumerate(change['addedExactRefs'],1):
 exact={**added['ref'],'key':added['occurrence']['key'],'text':added['occurrence']['text']}
 s,o=current_index[refkey(exact)];assert o==added['occurrence']
 meta=read(SRC/s['interpretationMetadata']);mapping=next(x for x in meta['adapterOccurrenceMap'] if x['adapterSection']==o['section'] and x['adapterPosition']==o['position'])
 raw=(SRC/meta['rawCopy']).read_bytes();assert sha(raw)==meta['rawSha256']
 assert raw[mapping['rawByteStart']:mapping['rawByteEnd']].decode()==mapping['rawText']
 assert blob(RUN+'/'+meta['originalArtifact'])==raw
 for rel in [s['interpretationMetadata'],meta['rawCopy'],s['record']['artifact']]:
  d=OUT/'pinned-input'/rel;d.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(SRC/rel,d)
 case=cases[number]
 p={'id':f'delta-{number:02d}','originalRef':exact,'originalRawSha256':meta['rawSha256'],'originalRawArtifact':meta['originalArtifact'],
  'exactRawMapping':mapping,'sourceMetadata':'pinned-input/'+s['interpretationMetadata'],'sourceRecordVerdict':s['record']['verdict'],
  'sourceRecordVerdictScope':'Interpreted adapter record only; when original compact kind/verdict is unknown, NEEDS_CONTEXT is a new adapter interpretation and original historical outcome remains unknown.',
  'originalCompactRecognition':meta['originalCompactRecognition'],'inspectionFreeze':FREEZE,
  'title':case['title'],'criteria':case['criteria'],'classification':case['classification'],'proposedDisposition':case['disposition'],'basis':case['basis'],
  'evidenceKeys':case['evidence'],'pendingCurrentRoutes':case['routes'],'proposalOnly':True,'canonicalApplied':False,'identityLinkApplied':False,
  'originalOccurrenceMerged':False,'historicalRecordedEvidenceIsNotFreshCurrentVerification':True,
  'currentFinalGateStatus':'Still pending: final repairs, actual final combined-source suite, whole-epic independent review, representative changed-instruction assessment and actual caller/human acceptance. Only the named delta scenario was inspected at583f2486.',
  'acceptanceEffect':'current named obligation remains pending/blocking' if number in [1,2] else 'historical or scope qualification may be nonblocking only within this exact scenario after parent judgment; existing final criteria remain pending'}
 if number==13:
  p['acceptanceEffect']='Historical population scope itself is nonblocking and retained without resolution; actual current source accounting/metrics checks remain blocking.'
 if number in [14,15]:
  historical_head='9b41133178416096df0b16a390342d81eeb0f690' if number==14 else '0bb280edcf5fc6a60499fdfdb090d1819a432963'
  r=git(['merge-base','--is-ancestor',historical_head,FREEZE])
  p['readOnlyAncestryInspection']={'historicalHead':historical_head,'freeze':FREEZE,'exitCode':r.returncode,'limits':'Ancestry confirms integration history only; actual recorded combined checks support the historical seam. No current tracker closure or acceptance follows.'}
 if number==15:
  p['acceptanceEffect']='Only the specific historical rebase seam has repair support; its original blocker obligation is not cleared. Actual required current R4/R7 gates remain pending until parent reconciliation.'
  p['retainedPendingObligation']={'exactOriginalText':'blocker `super-plan-8fn` remains for the parent to close after verified merge.',
   'underlyingStatus':'Current tracker/bookkeeping unobserved; remains open in evidence accounting until actual parent reconciliation. No new duplicate blocker or retrospective closure invented.',
   'route':'Reconcile actual current tracker/hold state under existing R4/R7 before caller acceptance; retain any real pending gate. Historical source alone does not establish present tracker state.'}
 if number in [1,2]:
  p['renditionStatus']='Separate original structured concern appearance. No link to prose, extra independent defect, or independent execution claim is applied.'
 if number in [3,4,5,6,7,8,9,10,11,12,14,15,16]:
  p['dispositionSupportBoundary']='A concrete repair source, actual original executed command/result evidence and relevant frozen source/fixture inspection support only this historical scenario. Parent must review/adopt the judgment against this exact ref; no automatic resolution inheritance or final acceptance.'
 proposals.append(p)

obsolete=[]
for item,replacement in zip(change['removedErroneousOrNarrowSyntheticRefs'],change['representationReplacements']):
 old={**item['ref'],'key':item['occurrence']['key'],'text':item['occurrence']['text']};prior=initial_index[refkey(old)]
 assert prior['originalRef']==old
 new=next(p for p in proposals if refkey(p['originalRef'])==refkey(replacement['replacementSyntheticRef']))
 obsolete.append({'oldExactRef':old,'priorProposalID':prior['id'],'initialProposalUnchanged':True,'adoptability':'obsolete/unadoptable synthetic extraction ref in revision2; retained as failed/narrow initial history only',
  'replacementExactRef':new['originalRef'],'representationReplacementOnly':True,'semanticFindingLinkApplied':False,'findingRejectionApplied':False,'findingResolutionApplied':False,
  'underlyingObligations':'Actual population-scope qualification retained at delta-13; no fixture-example metric supplies a run total.' if 'task-15-report' in old['source'] else 'Exact super-plan-8fn pending-closure requirement remains inside full delta-15 passage; no closure or waiver is inferred.',
  'basis':replacement['basis']})

write('exact-ref-delta-proposals.json',{'schemaVersion':1,'proposalRevision':2,'deltaOnly':True,'proposalOnly':True,'inspectionFreeze':FREEZE,
 'correctedAdapterRecordsSha256':RECORD_SHA,'correctedAdapterManifestSha256':MANIFEST_SHA,
 'reusedInitialWork':{'path':'../exact-ref-proposals.json','sha256':before['exact-ref-proposals.json'],'scope':'Initial199 assessment retained unchanged at its original freeze87166167;197 unchanged exact ref objects reused with attribution, not claimed independently reread/rejudged at583f2486.'},
 'populationAccounting':{'initial':199,'removedReplacedSyntheticRefs':2,'addedExactRefs':16,'corrected':213,'historicalMixedAppearances':13,'structuredConcernAppearances':2,'actualPopulationQualification':1,'independentDefectCount':None},
 'freshReviewScope':'Only the16 added exact refs and two replaced refs; exact substantive raw spans, source-bound historical repair/verification and selected relevant Git blobs at583f2486. Corrected adapter controls are selection/representation evidence only, not product acceptance.',
 'proposals':proposals,'obsoleteReplacedRefs':obsolete,'canonicalAdoptionPerformed':False,'currentWholeRunAcceptanceEstablished':False})
write('source-bound-evidence.json',{'schemaVersion':1,'inspectionFreeze':FREEZE,'evidence':code,'testsExecutedByThisTask':False})
pending=[
 {'id':'delta15-blocker','sourceRef':proposals[14]['originalRef'],'status':'unresolved current tracker/bookkeeping','requirement':'Preserve original super-plan-8fn closure owner and verified-merge condition; actual current parent reconciliation required if still pending. This reviewer made no tracker observation/write.'},
 {'id':'delta1-composition','sourceRef':proposals[0]['originalRef'],'status':'current required checks pending','requirement':'Actual final selector/containment composition suite and independent review remain pending; Task4 underway source is not substituted for frozen583f2486 inspection.'},
 {'id':'delta2-caller-gates','sourceRef':proposals[1]['originalRef'],'status':'current required checks pending','requirement':'Caller changed-instruction assessment, whole-epic independent review, final suite and existing human/root decision remain required; no historical graph reconstruction or new hosted requirement invented.'},
 {'id':'delta13-current-population','sourceRef':proposals[12]['originalRef'],'status':'historical qualification nonblocking; current accounting pending','requirement':'Use actual current source population and supported partial metrics under R9/R12/R13. Historical fixture task-report absence is not zero or a claim about current population.'},
 {'id':'historical-verification-limit','status':'preserved limitation','requirement':'Historical original reports retain actual source-bound command/results, including RED failures. This task executed no tests or agent trials. Static code/fixture survival is not current final-tree proof; broader or later defects remain open.'},
 {'id':'parent-adoption','status':'proposal-only','requirement':'Parent must review the exact per-ref support and corrected adapter semantic verdict before adoption/registration. No semantic links, disposition inheritance, source merges or current root acceptance were applied.'},
]
write('pending-evidence-requirements.json',pending)
assert initial_hashes()==before,'initial proposal files changed'
assert sha((SRC/'finding-source-record-proposals.json').read_bytes())==RECORD_SHA
assert sha((SRC/'reversible-manifest.json').read_bytes())==MANIFEST_SHA
write('representation-audit.json',{'inspectionFreeze':FREEZE,'initialHashesBefore':before,'initialHashesAfter':initial_hashes(),'initialFilesUnchanged':True,
 'correctedInputHashesMatched':True,'addedExactRefsPreserved':16,'obsoleteRefsPreserved':2,'retained197OriginalRefObjectsExact':True,
 'currentTotal213IsRepresentationArithmeticOnly':True,'rawDeltaMappingsAndFrozenOriginalBytesMatch':True,
 'testsExecuted':False,'initialUniverseIndependentlyReread':False,'canonicalOrProductOrHerdrOrTrackerWrites':False,
 'proposalClassifications':dict(Counter(x['classification']for x in proposals))})

lines=['# Revision 2 exact-reference relevance delta','',
 'Proposal only. Inspected frozen source `'+FREEZE+'`; corrected adapter records `'+RECORD_SHA+'` and manifest `'+MANIFEST_SHA+'` match the parent’s pinned inputs. Initial proposal files remain byte-identical.','',
 'Assessed only 16 added exact refs and two obsolete/replaced synthetic refs. The original 199 assessment is reused with its original attribution and freeze; this is not a claim to have reread or freshly accepted the entire 213-occurrence population.','',
 'The 13 added historical finding/repair appearances have bounded repair proposals supported by their concrete original repair source and recorded executed verification, plus relevant static source/fixture inspection at the frozen revision. Historical REDs remain failures; no product tests or agent trials ran here. Current final suite, whole-epic review, changed-instruction assessment, ongoing repairs and actual caller/human acceptance remain pending.','',
 'The Task 15 example ref and Task 16 blocker-only ref are **obsolete/unadoptable** in revision 2. This corrects representation only. The real Task 15 population qualification remains disclosed; the exact `super-plan-8fn` closure obligation survives inside the full Task 16 rebase passage, with present tracker status unobserved. The two structured concerns remain separate appearances with pending composition/caller obligations and no identity links.','',
 '| Delta | Exact source and raw start | Proposed applicability | Current qualification |','| --- | --- | --- | --- |']
for p in proposals:
 r=p['originalRef'];m=p['exactRawMapping'];q='Pending: '+', '.join(p['pendingCurrentRoutes']) if p['pendingCurrentRoutes'] else 'Historical scenario only; final criteria still pending'
 if p['id']=='delta-15':q='Historical seam supported; blocker closure unobserved'
 lines.append('| '+p['id']+' | `'+r['source']+'`, byte '+str(m['rawByteStart'])+' | '+p['title']+' — '+p['classification']+' | '+q+' |')
lines+=['','Exact refs, complete original text, raw/JSON pointers, individualized reasoning, criteria and evidence keys are in `exact-ref-delta-proposals.json`. All concrete excerpts and source hashes are in `source-bound-evidence.json`; unresolved current obligations are in `pending-evidence-requirements.json`. No canonical registration, supported disposition application, semantic merge or present acceptance was performed.']
(OUT/'REPORT.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'output':str(OUT),'initialFilesUnchanged':True,'addedRefs':16,'obsoleteRefs':2,'classifications':dict(Counter(p['classification']for p in proposals))},indent=2))
