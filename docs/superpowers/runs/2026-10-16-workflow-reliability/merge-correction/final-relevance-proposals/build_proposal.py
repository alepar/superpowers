import json,hashlib,re,subprocess,shutil
from pathlib import Path
from collections import Counter

OUT=Path('/private/tmp/ufz-correction-final-relevance-proposals')
WORK=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
RUN=WORK/'docs/superpowers/runs/2026-10-16-workflow-reliability'
REL=Path('docs/superpowers/runs/2026-10-16-workflow-reliability')
SRC=RUN/'merge-correction/legacy-adapter-revision2'
PRIOR=Path('/private/tmp/ufz-correction-legacy-relevance')
FREEZE='7b18b0c26b9f19d531c558e112d490743901a13b'
sha=lambda b:hashlib.sha256(b).hexdigest()
read=lambda p:json.loads(p.read_text())
def key(r):return (r['source'],r['section'],r['position'])
OUT.mkdir(exist_ok=True)
def write(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def git(args):return subprocess.run(['git',*args],cwd=WORK,capture_output=True)
def blob(p):
 r=git(['show',FREEZE+':'+p]);assert r.returncode==0,(p,r.stderr)
 return r.stdout
def copy_evidence(p,label):
 data=p.read_bytes();dest=OUT/'retained-evidence'/label;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
 return {'path':str(p),'sha256':sha(data),'retained':str(dest),'limits':'Read existing source/receipt; no new execution or source rebinding inferred.'}
prior_files={str(p.relative_to(PRIOR)):sha(p.read_bytes())for p in PRIOR.rglob('*')if p.is_file()}
initial=read(PRIOR/'exact-ref-proposals.json')
delta=read(PRIOR/'revision2-delta/exact-ref-delta-proposals.json')
history=read(PRIOR/'prior-history-judgments.json')
old_relevance=read(RUN/'final-acceptance-accounting/finding-relevance.json')
records=read(SRC/'finding-source-record-proposals.json')
assert sha((SRC/'finding-source-record-proposals.json').read_bytes())=='c04593efb7ffd0b9414222ee39c1337e1b3e5d2722356d11fe2de0dfd5e7b9ee'
projection=read(RUN/'merge-correction/history-registration-projection.json')
runbytes=(RUN/'run.md').read_bytes();runtext=runbytes.decode()
registered={}
snapshots=[]
for line in runtext.splitlines():
 if line.startswith('- finding-source · '):
  s=json.loads(line.split(' · ',1)[1]);registered[s['source']]=s
 if line.startswith('- root-acceptance · '):snapshots.append(json.loads(line.split(' · ',1)[1]))
current=snapshots[-1]
requirements={q['id']:q for q in current['requirements']}
assert all('R'+str(i)in requirements for i in range(1,16))
assert len(projection['findings'])==469 and not projection['gaps']
group_by_ref={key(o):(i,g)for i,g in enumerate(projection['findings'])for o in g['occurrences']}
initial_by={key(p['originalRef']):p for p in initial['occurrences']}
delta_by={key(p['originalRef']):p for p in delta['proposals']}
new_records=[]
for s in records['records']:
 reg=registered[s['record']['source']]
 assert all(reg[k]==s['record'][k]for k in ['version','source','kind','verdict','occurrences'])
 for o in reg['occurrences']:new_records.append((reg,o,s))
assert len(new_records)==213
assert all(key({'source':s['source'],**o})in initial_by or key({'source':s['source'],**o})in delta_by for s,o,_ in new_records)
assert all(key(x['oldExactRef'])not in {key({'source':s['source'],**o})for s,o,_ in new_records}for x in delta['obsoleteReplacedRefs'])

evidence={}
def frozen(eid,path,start=None,end=None,needle=None,before=4,after=16):
 data=blob(path);ls=data.splitlines(keepends=True)
 if needle is not None:
  index=next(i for i,l in enumerate(ls)if needle.encode()in l);start=max(1,index+1-before);end=min(len(ls),index+1+after)
 assert start and end
 lo=sum(map(len,ls[:start-1]));span=b''.join(ls[start-1:end]);dest=OUT/'frozen-source'/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
 evidence[eid]={'kind':'static-current-source','revision':FREEZE,'path':path,'fileSha256':sha(data),'lineStart':start,'lineEnd':end,'byteStart':lo,'byteEnd':lo+len(span),'text':span.decode(),'retained':str(dest),'limits':'Static inspection at this freeze; no fresh suite/behavior/cleanup/acceptance result.'}
 return eid

frozen('schema-findingAcceptance','skills/super-auto/scripts/report-status',319,347)
frozen('schema-records-and-requirements','skills/super-auto/scripts/report-status',84,101)
frozen('schema-current-gates','skills/super-auto/scripts/report-status',119,168)
frozen('schema-caller-semantics','skills/super-auto/run-state.md',255,315)
frozen('captured-bounded-writer','skills/super-code/scripts/dispatch-text.mjs',needle="if (kind === 'bounded-review')",after=43)
frozen('captured-selector-availability','skills/super-code/scripts/dispatch-text.mjs',243,281)
frozen('stable-final-source','skills/super-code/coordinator.js',needle='if (persistedReviewSource) finalSource',before=4,after=28)
frozen('cleanup-inventory','skills/super-code/scripts/stop-run-processes',42,91)
frozen('cleanup-retention','skills/super-code/scripts/remove-task-worktree',45,118)
frozen('cleanup-setup-consumer','skills/super-code/coordinator.js',needle='function workspaceSetup',after=25)
frozen('fresh-capacity-admission','skills/super-code/coordinator.js',needle='const admitAfterCapacity',after=29)
frozen('verification-parent-settlement','skills/super-code/coordinator.js',1833,1860)
frozen('durable-resume','skills/super-code/coordinator.js',874,920)
frozen('amendment-resume','skills/super-auto/resume.md',68,85)
frozen('source-evidence-validation','skills/super-code/coordinator.js',needle='function verificationProblem',after=35)
frozen('run-failure-history','skills/super-code/coordinator.js',471,516)
frozen('acceptance-producer-facts','skills/super-auto/scripts/report-status',104,168)
frozen('acceptance-declared-population','skills/super-auto/scripts/report-status',170,247)
frozen('finding-semantic-support','skills/super-auto/run-state.md',needle='**Routing.**',before=6,after=27)
frozen('finding-transport-projection','skills/super-auto/scripts/scope-dispositions',70,115)
frozen('process-aliases','skills/super-code/coordinator.js',602,656)
frozen('independent-metrics','skills/super-code/coordinator.js',2190,2221)
frozen('typed-completion-digest','skills/super-code/scripts/run-digest',104,120)
frozen('typed-completion-profile','skills/super-code/scripts/run-profile.mjs',1166,1208)
frozen('readiness-profile','skills/super-code/scripts/run-profile.mjs',1240,1269)
frozen('planning-profile','skills/super-code/scripts/run-profile.mjs',1648,1675)
frozen('gate-output','skills/super-auto/scripts/report-status',339,351)

profiles={
'R1':{'behavior':'Reviews use captured Git bounds and independent mutable output ownership. Provenance gaps now permit a separately bound incomplete review, while omission authority and whole-range readiness remain refused.','evidence':['captured-bounded-writer','captured-selector-availability','stable-final-source'],'receipts':['task4-report','task4-review']},
'R2':{'behavior':'Owned cleanup distinguishes unavailable inventory, retained processes/resources, failed removal and successful deletion; setup/recut consumes nonzero helper exits without forced deletion. Task 6 changes are static inspected and independently under review.','evidence':['cleanup-inventory','cleanup-retention','cleanup-setup-consumer'],'receipts':[]},
'R3':{'behavior':'Initial dispatch and verification reacquisition share fresh post-capacity admission, including authoritative external/opaque observations, failed-lookup invalidation and bounded query budgets.','evidence':['fresh-capacity-admission'],'receipts':['task1-report','task1-review']},
'R4':{'behavior':'Resume preserves exact pending closures, guards unavailable tracker arrays, waits for durable confirmation and distinguishes verification source from landing. Amendment replay now repeats committed abstraction sync before filing/advance and holds sync failure.','evidence':['durable-resume','amendment-resume'],'receipts':['task5-report','task5-review']},
'R5':{'behavior':'Evidence validates exact source/command/configuration/outcome/kind and independent reviewer basis; failed/unavailable or fallback-for-live remain distinct. The caller gate retains matching obligations and contradictory outcomes.','evidence':['source-evidence-validation','schema-current-gates'],'receipts':['task3-report','task3-review']},
'R6':{'behavior':'Reviewed unchanged verification completion has a typed evidence basis, releases the slot before parent settlement, reacquires with fresh admission and avoids invented Git landings. Current metrics separately classify verification closures.','evidence':['source-evidence-validation','verification-parent-settlement','typed-completion-profile'],'receipts':['task1-report','task1-review']},
'R7':{'behavior':'The caller gate independently checks source-bound review, measurements, producer Recovery facts, exact source population and reserved human decisions. Collection or leaf success does not establish root acceptance; output must drain without a false successful partial JSON result.','evidence':['acceptance-producer-facts','acceptance-declared-population','schema-current-gates','gate-output'],'receipts':['task3-report','task3-review','task4-report','task4-review']},
'R8':{'behavior':'Run attribution retains introducing ownership and earlier contradictory history independently from task-base exoneration; the gate imports gaps before diagnostic/pre-run classification. Missing real baseline is not fabricated.','evidence':['run-failure-history','acceptance-producer-facts'],'receipts':['task3-report','task3-review']},
'R9':{'behavior':'Immutable occurrence refs remain individually retained; current caller declarations and complete registered extractions reconcile actual design/code ledger populations. Transport keys never establish semantic identity; bounded collected reviews remain incomplete.','evidence':['acceptance-declared-population','finding-transport-projection','captured-bounded-writer'],'receipts':['task3-report','task3-review','task4-report','task4-review','history-registration']},
'R10':{'behavior':'Supported fix/rejection requires explicit original references, semantic owner judgment and concrete evidence; uncertain appearances remain separate and later silence supplies no disposition. Nonblocking relevance leaves the original group outstanding.','evidence':['finding-semantic-support','finding-transport-projection','schema-findingAcceptance'],'receipts':['history-registration']},
'R11':{'behavior':'Exact process aliases group classes while retaining raw text/provenance and separate defect identity, severity and scope. Recurrence is an observation, not automatic shared defect/fix.','evidence':['process-aliases'],'receipts':[]},
'R12':{'behavior':'Finish retains supported independent observations and explicit transport/discrepancy gaps, while digest and profiler distinguish verified completion from actual landing. Task 6 output and metrics changes still need independent final verification.','evidence':['independent-metrics','typed-completion-digest','typed-completion-profile'],'receipts':[]},
'R13':{'behavior':'Latest attempt and run history remain distinct; typed verification completions do not invent landings or timed merge events. Historical ledger landings remain facts with unknown timing rather than being moved to the verification chain end.','evidence':['typed-completion-digest','typed-completion-profile','independent-metrics'],'receipts':[]},
'R14':{'behavior':'Readiness uses evidenced creation/mapping/dependency timestamps and preserves nulls; profile scope is observed residual graph, planning remains included and modeling is distinct from historical cause.','evidence':['readiness-profile','planning-profile'],'receipts':[]},
'R15':{'behavior':'Focused fixtures, prospective changed-instruction/continuity assessment, actual final suite and independent whole-epic review have separate evidence owners. Historical replay/text/diagnostic passes cannot stand in for the final combined source or human decision.','evidence':['schema-caller-semantics','schema-current-gates'],'receipts':[]},
}

SDD=WORK/'.superpowers/sdd/2026-10-17-workflow-reliability-merge-correction'
receipt_paths={
 'task1-report':SDD/'task-1-report.md','task1-review':RUN/'merge-correction/task-1-fix-round-1-review.md',
 'task2-report':SDD/'task-2-report.md','task2-review':RUN/'merge-correction/task-2-fix-round-1-review.md',
 'task3-report':SDD/'task-3-report.md','task3-review':RUN/'merge-correction/task-3-fix-round-1-review.md',
 'task4-report':SDD/'task-4-report.md','task4-review':RUN/'merge-correction/task-4-independent-review.md',
 'task5-report':SDD/'task-5-report.md','task5-review':RUN/'merge-correction/task-5-independent-review.md',
 'history-registration':RUN/'merge-correction/history-registration-receipt.json',
 'actual-roast-correspondence':RUN/'merge-correction/roast-round1-correspondence-adoption.json',
 'projection':RUN/'merge-correction/history-registration-projection.json',
 'blocker-observation':RUN/'merge-correction/super-plan-8fn-observation.json','blocker-status':RUN/'merge-correction/super-plan-8fn-status.json',
 'policy':RUN/'merge-correction/policy-review.md',
}
for eid,path in receipt_paths.items():evidence[eid]={'kind':'retained-scope-and-execution-receipt',**copy_evidence(path,eid+path.suffix)}
for eid,path in {'prior-initial':PRIOR/'exact-ref-proposals.json','prior-delta':PRIOR/'revision2-delta/exact-ref-delta-proposals.json',
 'prior-historical-support':PRIOR/'historical-evidence-rebinding.json','prior-delta-support':PRIOR/'revision2-delta/source-bound-evidence.json',
 'prior-additional-support':PRIOR/'additional-evidence.json','prior-supplements':PRIOR/'supplemental-proposals.json',
 'prior-gap-map':PRIOR/'source-gap-proposals.json'}.items():evidence[eid]={'kind':'attributed-prior-judgment-not-entire-raw-reread',**copy_evidence(path,eid+'.json')}
assert sha(receipt_paths['blocker-status'].read_bytes())==read(receipt_paths['blocker-observation'])['artifactSha256']
assert read(receipt_paths['blocker-status'])[0]['status']=='closed'

dependencies={
 'suite':'Actual final combined-source required suite, with source/environment/command reconciliation and preserved failure history, remains parent-owned and pending.',
 'behavior':'Parent assessment of actual changed instructions and continuity/cleanup/no-change behavior remains pending; preserve strict B4 0 pass/2 fail/3 ambiguous separately from protocol-complete diagnostic results.',
 'review':'Independent whole-epic review and supported exact-source coverage remain pending; Task 1–5 scoped reviews, imported historical coverage and complete collection do not supply this.',
 'human':'The existing phase-7 human choice remains with the human partner; no new human gate is created by an historical escalation title.',
 'process':'Actual final owned caller/review resource inspection and retention outcomes remain parent-owned; old unknown PID cause or platform limits are not reconstructed.',
 'task6-review':'Task 6 guard/cleanup/typed-metrics/output changes at 9695b0bd and7b18b0c2 are not declared accepted by this proposal; their independent review and subsequent final evidence remain required.',
 'semantic-evidence':'Owner must assess exact source roles, command/configuration, chronology and support for any disposition. No source hash, key membership, task success or later silence supplies semantic proof.',
 'source-accounting':'The79 historical sources are now registered with213 exact refs and zero structural projection gaps. Remaining step here is semantic applicability/adoption and any actual declared-source gate reconciliation, not fabricated missing source wrappers.',
}
routes_to_dep={'suite':['suite'],'behavior':['behavior'],'review':['review'],'human':['human'],'process':['process'],
 'selector':['review','suite','behavior'],'resume':['review','suite'],'cleanup-metrics':['task6-review','suite','review'],
 'semantic-evidence':['semantic-evidence'],'source-accounting':['source-accounting','semantic-evidence'],'tracker-reconciliation':[]}
def deps(routes,criteria,required):
 ds={d for r in routes for d in routes_to_dep.get(r,[])}
 if required:ds.update(['suite','review'])
 if any(c in ['R2','R12','R13']for c in criteria):ds.add('task6-review')
 return [{'id':d,'basis':dependencies[d]}for d in sorted(ds)]
def evidence_paths(keys):return [evidence[k]['retained']for k in dict.fromkeys(keys)]
def profile_keys(criteria):return list(dict.fromkeys(k for c in criteria for k in profiles[c]['evidence']+profiles[c]['receipts']))

new=[]
for number,(reg,o,source_proposal)in enumerate(new_records,1):
 ref={'source':reg['source'],'section':o['section'],'position':o['position']};k=key(ref)
 prior=delta_by.get(k,initial_by.get(k));is_delta=k in delta_by
 prior_id=prior['id'];classification=prior['classification'];criteria=list(prior['criteria'])
 routes=prior.get('pendingCurrentRoutes',prior.get('pendingRoutes',[]))
 pending=classification in ['current-required-obligation','historical-baseline-assertion-current-evaluation-pending','historical-design-wording-finding-current-disposition-unresolved',
 'current-required-composition-obligation','historical-scope-with-current-required-caller-obligations']
 if 'behavior'in routes and 'R15'not in criteria:criteria.append('R15')
 if 'human'in routes and 'R7'not in criteria:criteria.append('R7')
 primary='R15'if 'behavior'in routes else criteria[0]
 meta=read(SRC/source_proposal['interpretationMetadata'])
 mapping=prior.get('exactRawMapping',{})
 raw_pointer={'source':reg['source'],'rawArtifact':str(SRC/meta['rawCopy']),'sha256':meta['rawSha256'],
  'byteStart':mapping.get('rawByteStart'),'byteEnd':mapping.get('rawByteEnd'),'jsonPointer':mapping.get('jsonPointer'),
  'interpretationMetadata':str(SRC/source_proposal['interpretationMetadata'])}
 basis=prior['basis']
 interpretation=mapping.get('interpretation')
 if interpretation:basis+=' Original independently interpreted passage: '+interpretation
 if pending:
  basis+=' Current acceptance relevance: this exact source retains unfinished evidence/behavior or a current operative guarantee under '+', '.join(criteria)+'. Required current checks remain pending; this is not a claim that its historical defect persists unchanged.'
 else:
  basis+=' Current acceptance effect only: this exact historical/scope appearance does not add an independently unsatisfied current acceptance obligation on the specific approved-contract and bounded evidence basis above. It remains outstanding in the projection; no resolution/rejection or later-silence inference is supplied. Relevant whole-criterion and final checks remain pending separately.'
 if k in delta_by and prior_id=='delta-15' or prior.get('priorNarrowJudgment',{}).get('id')=='H09':
  basis+=' Updated narrow bookkeeping evidence: the parent retained actual bd observation for super-plan-8fn, status closed with reason task super-plan-ufz.6 merged, independently bound to its status bytes. That corroborates this explicit old blocker only; it does not establish root acceptance.'
 mechanism=' '.join(c+': '+profiles[c]['behavior']for c in criteria)
 ekeys=profile_keys(criteria)+(['prior-delta','prior-delta-support']if is_delta else ['prior-initial','prior-historical-support'])
 if prior.get('historicalEvidenceKeys') and 'historical-profile-qualification'in prior['historicalEvidenceKeys']:ekeys+=['prior-additional-support']
 if k in delta_by and prior_id=='delta-15' or prior.get('priorNarrowJudgment',{}).get('id')=='H09':ekeys+=['blocker-observation','blocker-status']
 ev=[str(RUN/reg['artifact']),raw_pointer['interpretationMetadata'],*evidence_paths(ekeys)]
 helper={'ref':ref,'judgment':'supported','effect':'required'if pending else'nonblocking','basis':basis+' Current concrete behavior: '+mechanism,'evidence':list(dict.fromkeys(ev))}
 if pending:helper['requirement']=primary
 group_index,group=group_by_ref[k]
 new.append({'id':f'new-{number:03d}','exactOriginalRef':{**ref,'key':o['key'],'text':o['text']},'sourceRawEvidence':raw_pointer,
  'registeredArtifact':reg['artifact'],'sourceKind':reg['kind'],'registeredAdapterVerdict':reg['verdict'],'originalHistoricalOutcome':meta['originalCompactRecognition'],
  'criteria':criteria,'semanticRelevance':'required'if pending else'does-not-affect-current-acceptance-on-this-specific-basis',
  'sourceSpecificBasis':basis,'currentConcreteBehavior':mechanism,'evidenceKeys':list(dict.fromkeys(ekeys)),
  'remainingDependencies':deps(routes,criteria,pending),'proposedFindingAcceptance':helper,
  'projectionGroupIndex':group_index,'projectionOriginalMemberRefs':[{x:y for x,y in a.items()if x in ['source','section','position']}for a in group['occurrences']],
  'priorWork':{'artifact':'prior-delta'if is_delta else'prior-initial','id':prior_id,'originalInspectionFreeze':prior.get('inspectionFreeze',initial['currentInspectionFreeze']),'reusedRatherThanEntireRawReread':True},
  'proposalOnly':True,'noDispositionApplied':True,'noIdentityLinkApplied':True,'currentFinalAcceptanceEstablished':False})
assert len(new)==213 and len({x['projectionGroupIndex']for x in new})==213

old_required=[j for j in old_relevance if j['effect']=='required'];assert len(old_required)==26
old_plans={
1:('R6',['task1-report','task1-review'],['review','suite'],'The cap=1 parent-failure/verification-child cycle has reviewed slot-release/reacquisition and fresh-admission corrections. Preserve this exact confirmed group as required until final combined-source verification; do not rewrite the old deadlock report or claim hosted runtime success.'),
2:('R9',['task2-report','task2-review'],['review','suite'],'Destination-parent containment and archive recovery provenance have scoped reviewed corrections. Current complete source/collection and final suite/review remain required; matching outside bytes and historical complete metadata never supply ownership.'),
3:('R8',['task3-report','task3-review'],['semantic-evidence','review','suite'],'The caller now imports runFailure gaps before diagnostic pre-run classification. The original retained-contradiction group remains required through final evidence; pre-run diagnosis is not a new repair owner and current source role/history still needs semantic support.'),
4:('R7',['task3-report','task3-review'],['review','suite'],'Review-source Recovery provenance is validated as immutable metadata and exempted only from fabricated measurement interpretation. Current source/producer/gate reconciliation and final review still need actual evidence.'),
5:('R9',['task2-report','task2-review','task4-report','task4-review'],['review','suite'],'Explicit settled-null recovery preserves predecessor provenance and actual report verdict; captured-Git selector now mirrors that supported transition. The actual final producer/consumer seam remains required, not waived by a focused collection pass.'),
6:('R4',['task5-report','task5-review'],['behavior','review','suite'],'Both committed-amendment replay paths now sync before filing/advance and retain specs-committed on sync failure. Static contract/mutation tests and scoped review do not establish real agent/tracker adherence; required behavior and final review remain pending.'),
7:('R1',['policy','task4-report','task4-review'],['behavior','review','suite'],'The specific policy ruling permits independently verified captured source to receive an explicitly incomplete bounded review while every omission-provenance gap remains. Current implementation follows that bounded contract; whole-range coverage and actual instruction behavior still remain required. The old escalation title creates no new human gate.'),
8:('R7',['policy','task3-report','task3-review','task4-report','task4-review'],['source-accounting','review','suite'],'The scope ruling assigns design/code source collection to the outer caller. Real declared input populations and ledger transports are now reconciled; a dispute count alone is not a universal veto. Actual current population/relevance and final gate evidence remain required; no fabricated historical producer result is inferred.'),
9:('R15',[],['behavior','suite'],'This exact earlier cluster defers caller behavior/measurement; replay evidence keeps its simulated kind and cannot discharge actual required current acceptance work.'),
10:('R15',[],['behavior','suite','human'],'Keep the required root sweep and behavior evidence, while native Linux/hosted limits stay explicitly bounded qualifications. The source does not independently mandate retrospective native/hosted execution.'),
11:('R15',[],['behavior'],'The source excludes live ordinary-agent scheduling/tracker behavior from its simulated replay evidence. Current representative behavior assessment remains required without calling fixtures live agents.'),
12:('R15',[],['behavior'],'The cluster validates prepared scenarios, not execution of fresh-agent continuity/evidence decisions. Required current representative execution/assessment remains pending.'),
13:('R15',[],['behavior'],'Independent fresh-agent report interpretation and current live-run acceptance were explicitly outside this historical partition. Preserve that source limit and the current behavior requirement.'),
14:('R15',[],['behavior','suite','review'],'The historical final seam review executes only its named feedback fixture. It cannot establish the actual final combined-source suite or changed-instruction behavior; no separate compulsory hosted runtime is invented.'),
15:('R15',[],['suite','review','human'],'Root final sweep, required acceptance review and existing human decision remain independently owned. Closed leaves and this old not-ready review cannot satisfy them.'),
16:('R7',['task3-report','task3-review'],['review','suite'],'The exact final-review Must-fix reports fabricated measurement interpretation of immutable review-source metadata. Its typed exemption is implemented/reviewed, but current full producer/gate and final evidence remain required; no automatic disposition is supplied.'),
17:('R1',['policy','task4-report','task4-review'],['behavior','review','suite'],'The actual lost first review is preserved. Corrected provenance-only fallback may now produce a strictly incomplete source-bound report; it grants no omission authority and does not resolve the original 690 gaps or whole-epic coverage. Required final review/behavior remain pending.'),
18:('R15',[],['review'],'The source expressly identifies product paths, profiler internals, instructions, test bodies and reporting/docs outside the original semantic review. Imported historical frozen coverage cannot establish current whole-epic review.'),
19:('R1',['task4-report','task4-review'],['review'],'Original 690 provenance gaps remain original historical observations; later captured-range availability is separate. Whole-epic coverage and supported source selection are still required, without inventing valid omissions or blanket archive certification.'),
20:('R15',[],['suite','process','behavior'],'The exact historical final source only had SWEEP DEFERRED. Actual current required final commands, owned-root cleanup and representative instruction evidence remain pending. Synthetic satisfied gate prerequisites provide no real human acceptance.'),
21:('R7',[],['review','suite','human'],'The old source lacked a root snapshot and deliberately excluded later main changes. Current final source identity, supported judgments and reserved human decision remain required; the late current snapshot never becomes a fabricated initial checkpoint.'),
22:('R15',[],['behavior','suite','review'],'The cluster requires preserving root-owned evaluations, platform qualifications and the separately attributed fixture teardown concern. Concrete prior teardown evidence may support its narrow historical mechanism; silence cannot clear it and current behavior/sweep remain pending.'),
23:('R15',[],['behavior'],'This historical fixture contained no prior actionable/deferred/parked item. It cannot demonstrate cross-invocation finding continuity, so the actual representative continuity assessment remains required.'),
24:('R15',[],['behavior'],'live-sim labels, prompt checks and fake denial/signal records remain simulated mechanics evidence. Current fresh-agent interruption/changed-instruction assessment is required; no new historical live measurement is claimed.'),
25:('R15',[],['behavior','review','suite'],'The historical aggregate names unfulfilled finding-continuity/acceptance examples and original scope boundaries. Actual representative continuity, semantic ownership and current final suite/review remain required; other findings are neither reviewed nor disposed here.'),
26:('R15',[],['review','suite','human'],'Frozen historical artifact coverage is not current whole-epic review or source-bound final sweep/human acceptance. Subsequent revisions require attributed actual final evidence and every original supported finding/qualification remains preserved.'),
}
old=[]
for n,j in enumerate(old_required,1):
 gi,g=group_by_ref[key(j['ref'])];occ=next(o for o in g['occurrences']if key(o)==key(j['ref']))
 criterion,receipts,routes,basis=old_plans[n];ekeys=profile_keys([criterion])+receipts
 helper={'ref':j['ref'],'judgment':'supported','effect':'required','requirement':j['requirement'],
  'basis':basis+' Current concrete path: '+profiles[criterion]['behavior'],
  'evidence':list(dict.fromkeys([str(RUN/occ['artifact']),*evidence_paths(ekeys)]))}
 old.append({'id':f'old-required-{n:02d}','exactOriginalRef':{k:occ[k]for k in ['source','section','position','key','text']},
  'criteria':[criterion],'originalRequiredMapping':j,'proposedFindingAcceptance':helper,'remainingDependencies':deps(routes,[criterion],True),
  'projectionGroupIndex':gi,'allOriginalGroupOccurrences':g['occurrences'],'proposalOnly':True,'noDispositionApplied':True})
assert len({p['projectionGroupIndex']for p in old})==26
assert not {p['projectionGroupIndex']for p in old}&{p['projectionGroupIndex']for p in new}

supp=read(PRIOR/'supplemental-proposals.json')['qualifications'];assert len(supp)==29
supp_final=[]
for p in supp:
 q=p['originalQualification'];cs=p['criteria'];required=p['classification']=='required';ekeys=profile_keys(cs)+['prior-supplements']
 basis=p['basis']+' Current concrete behavior: '+' '.join(c+': '+profiles[c]['behavior']for c in cs)
 if p['classification']=='historical':basis+=' The preserved old failed/held/amendment temporal layer is not itself proof of a present failure or current unclosed scope hold. It remains disclosed; concrete earlier repair sources are attributable and final acceptance checks remain separate.'
 supp_final.append({'id':p['id'],'originalQualification':q,'originalSourceRef':p['originalSourceRef'],'criteria':cs,
  'semanticRelevance':'required current obligation'if required else'does not independently affect current acceptance; retain exact historical qualification',
  'basis':basis,'evidence':evidence_paths(ekeys)+[str(SRC/'supplemental-qualifications.json')],
  'remainingDependencies':deps(p['pendingRoutes'],cs,required),'findingAcceptanceRecordCreated':False,
  'schemaReason':'This is an original byte/JSON-field qualification, not a fabricated finding-source section/position ref. It maps to existing criteria and remains separate from the213 findingAcceptance records.',
  'proposalOnly':True})
gap_prior=read(PRIOR/'source-gap-proposals.json')['gaps'];assert len(gap_prior)==35
gap_final=[]
for g in gap_prior:
 cs=g['criteria'];gap_final.append({'id':g['id'],'originalGap':g['originalGap'],'criteria':cs,
  'basis':g['basis']+' Current registration accounts for all selected79 source representations and preserves this exact original interpretation/coverage limitation. Zero structural projection gaps do not retrospectively establish its unknown historical outcome or missing original evidence.',
  'evidence':[str(SRC/'unresolved-gaps.json'),*evidence_paths(profile_keys(cs)+['prior-gap-map','history-registration'])],
  'remainingDependencies':deps(g['pendingRoutes'],cs,False),'originalHistoricalStatusRetained':True,'currentStructuralProjectionGapInferred':False,'proposalOnly':True})
unknown=[g for g in gap_final if g['id'].startswith('unknown-original-outcome-')];assert len(unknown)==5

updates=[p['proposedFindingAcceptance']for p in new+old]
assert len(updates)==239 and len({key(p['ref'])for p in updates})==239
for j in updates:
 assert j['effect']in ['required','nonblocking']and j['judgment']=='supported'and j['basis']and j['evidence']and all(isinstance(x,str)and x for x in j['evidence'])
 assert key(j['ref'])in group_by_ref
 if j['effect']=='required':assert j['requirement']in requirements
assert {str(p.relative_to(PRIOR)):sha(p.read_bytes())for p in PRIOR.rglob('*')if p.is_file()}==prior_files
assert (RUN/'run.md').read_bytes()==runbytes

write('new213-exact-ref-relevance.json',{'schemaVersion':1,'proposalOnly':True,'inspectionFreeze':FREEZE,'registeredSourceCount':79,'exactOccurrenceCount':213,
 'inspectionMethod':'Reuse attributed initial197 retained judgments plus16 revision2 delta judgments; inspect current schema, changed producer/consumer mechanisms and source receipts. No assertion of a new entire raw corpus read.',
 'proposals':new})
write('old26-required-group-mappings.json',{'schemaVersion':1,'proposalOnly':True,'inspectionFreeze':FREEZE,'groups':old,'retainedRequiredGroupCount':26,
 'remainingExisting220NonblockingJudgments':'Not reassessed or rewritten by this task. No whole469-group relevance or present acceptance certification.'})
write('candidate-findingAcceptance-updates.json',{'schemaVersion':1,'proposalOnly':True,'schema':'root-acceptance.findingAcceptance entries only; this is not a root-acceptance snapshot',
 'adoptionRule':'Parent inspection and actual final evidence required before canonical adoption. A required entry unconditionally remains pending in the current helper even if its named review requirement passes; reconsider its exact relevance/disposition after actual evidence rather than expecting the helper to clear it automatically.',
 'updates':updates})
write('historical-qualification-map.json',{'schemaVersion':1,'proposalOnly':True,'supplementalQualifications':supp_final,'originalSourceGaps':gap_final,'unknownHistoricalOutcomes':unknown,
 'counts':{'supplements':29,'sourceGaps':35,'unknownOutcomesAmongThose35':5},
 'limits':'These retained historical qualifications are not converted into [] by a structural projection result and no historical outcome is restamped. No invented original wrappers, retrospective baseline/owner/platform/hosted obligations or new human gates.'})
write('source-and-schema-evidence.json',{'inspectionFreeze':FREEZE,'profiles':profiles,'evidence':evidence,
 'schemaMapping':'User-facing does-not-affect is encoded only as helper effect nonblocking; literal does-not-affect is not a valid helper enum. Nonblocking changes acceptance effect and leaves outstanding occurrences untouched.'})
write('remaining-dependencies.json',{'dependencies':dependencies,'allCurrentR1toR15RemainPending':'This task supplies relevance proposals, not passing criterion reviews. Parent must provide actual final evidence, including Task6 review, before adoption/acceptance.',
 'historicalBookkeepingUpdate':'Actual retained super-plan-8fn closed status now corroborates its old narrow rebase bookkeeping; no tracker write was made and no root acceptance follows.'})
write('adoption-audit.json',{'inspectionFreeze':FREEZE,'sourceRunSha256':sha(runbytes),'sourceRunUnchanged':True,'priorProposalFilesUnchanged':True,
 'registrationReceipt':evidence['history-registration'],'projection':{'recordedOccurrences':sum(len(g['occurrences'])for g in projection['findings']),'recordedGroups':469,'structuralGaps':0,'notAcceptance':True},
 'newExactRefs':213,'strictOriginalRefs':24,'interpretedRefs':189,'oldRequiredGroups':26,'candidateUpdateRecords':239,
 'newRelevanceCounts':dict(Counter(p['proposedFindingAcceptance']['effect']for p in new)),'oldRequiredRemainsRequired':26,'supplements':29,'sourceGaps':35,'unknownOriginalVerdicts':5,
 'recordsMatchCurrentRegisteredExtraction':True,'allCandidateRefsExistInRecordedProjection':True,'requiredNamesExistInActualSnapshot':True,
 'actualDeclaredInputs':[l for l in runtext.splitlines()if l.startswith(('roast-design:','roast-code:','findingsLedgerDesign:','findingsLedger:'))],
 'actualSourceCorrespondenceRecords':[json.loads(l.split(' · ',1)[1])for l in runtext.splitlines()if l.startswith('- source-correspondence · ')],
 'sourceCorrespondenceLimit':'Only the actual declared original roast correspondence is retained; registering79 representations grants no blanket original-source correspondence, finding identity or historical outcome normalization.',
 'limits':{'testsExecuted':False,'canonicalWrites':False,'dispositionsApplied':False,'identityLinksApplied':False,'productWrites':False,'trackerHerdrWrites':False,'subagents':False,'finalAcceptanceEstablished':False}})
lines=['# Final relevance adoption preparation','',
 'Proposal only, inspected against `'+FREEZE+'`. The actual helper schema, current registered population, Task 1–5 scoped correction/review receipts and Task 6 guard/metrics changes were inspected. Earlier source interpretations and historical repair evidence are reused with attribution; no entire raw corpus reread is claimed.','',
 'Prepared exact relevance proposals for all **213 new refs** (189 interpreted + original24 strict), separate mappings for **29 supplements** and **35 source qualifications**, and the **26 previously required groups**. The five unknown original outcomes remain unknown. The recorded486 appearances /469 groups /zero structural gaps describe extraction/projection, not acceptance.','',
 'Every new ref has its original text, exact registered source/ref, source-specific historical basis, concrete current path/behavior, evidence pointers and remaining dependencies. Does-not-affect maps to helper `effect:"nonblocking"`; it leaves the occurrence outstanding and supplies no repair/rejection disposition. Required current checks remain blocking.','',
 'Current final suite, representative changed-instruction/continuity assessment, independent whole-epic review, actual owned-resource outcomes and existing human choice remain parent-owned. Task 6 is not declared accepted here. Reviewed narrow repairs and old historical GREEN evidence never become a final-source suite or a whole-run readiness claim. Actual retained tracker evidence now confirms `super-plan-8fn` closed; that narrow bookkeeping fact does not close the root.','',
 'The candidate helper entries are in `candidate-findingAcceptance-updates.json`, outside any canonical snapshot. The helper keeps every `required` finding pending even after its named criterion review passes, so the parent must reassess exact relevance/disposition using actual final evidence before adoption. No canonical records, tracker/Herdr state or product files were changed and no tests ran.','',
 'Files: `new213-exact-ref-relevance.json`, `old26-required-group-mappings.json`, `historical-qualification-map.json`, `source-and-schema-evidence.json`, `remaining-dependencies.json`, `adoption-audit.json`.']
(OUT/'REPORT.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'output':str(OUT),'newRefs':213,'newRelevanceCounts':dict(Counter(p['proposedFindingAcceptance']['effect']for p in new)),'oldRequiredGroups':26,'supplements':29,'sourceGaps':35,'unknownHistoricalOutcomes':5,'runAndPriorFilesUnchanged':True},indent=2))
