from pathlib import Path
import json,hashlib,subprocess,shutil

W=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
P=Path('/private/tmp/ufz-correction-final-criterion-proposals')
R0=Path('/private/tmp/ufz-correction-final-criterion-proposals-r0')
STUDY=W/'docs/superpowers/runs/2026-10-16-workflow-reliability/behavior-after'
HEAD='c21681200aac20fb0223b6b0e83e953b1bc75cde'
OLD='0bb280edcf5fc6a60499fdfdb090d1819a432963'
TARGETS=['new-169','new-171','new-174']
def load(p):return json.loads(Path(p).read_text())
def dump(p,d):Path(p).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
def sha(b):return hashlib.sha256(b).hexdigest()
def get(p):return subprocess.check_output(['git','show',HEAD+':'+p],cwd=W)
def inventory(p):return {str(x.relative_to(p)):sha(x.read_bytes()) for x in p.rglob('*') if x.is_file()}
manifest=load('/private/tmp/ufz-correction-final-criterion-proposals-r0-manifest.json')
assert inventory(R0)==manifest['files']
assert inventory(P)==manifest['files'],'Apply only to byte-identical revision0 proposal'

dest=P/'retained-evidence/r11-c8';dest.mkdir(parents=True)
files=['report.md','scenario-C.txt','guidance-C.txt','source-manifest.json','source-recheck.json','claim-summary.json','scores.json','trials.json']
files += [f'C-after-{i}-{kind}.txt' for i in range(1,6) for kind in ['prompt','response']]
retained=[]
for name in files:
 b=(STUDY/name).read_bytes();(dest/name).write_bytes(b)
 retained.append({'originalPath':str(STUDY/name),'retained':str(dest/name),'sha256':sha(b),'bytes':len(b)})
assessment=Path('/private/tmp/ufz-correction-final-r11-assessment.md')
assessmentBytes=assessment.read_bytes();(dest/'independent-assessment.md').write_bytes(assessmentBytes)

sourceBinding=[]
for entry in load(STUDY/'source-manifest.json'):
 if entry['case']!='C':continue
 path=entry['repository_relative_path'];current=get(path)
 frozen=(STUDY/'source-snapshot'/path.removeprefix('skills/')).read_bytes()
 assert sha(frozen)==entry['sha256_full']
 excerpt=b''.join(frozen.splitlines(keepends=True)[entry['start']-1:entry['end']])
 currentExcerpt=b''.join(current.splitlines(keepends=True)[entry['start']-1:entry['end']])
 assert sha(excerpt)==entry['sha256_excerpt']
 role='reporting context; changed full diff inspected, C8 grouping semantics unaffected' if path=='skills/super-auto/report-prompt.md' else 'operative C8 process-tag clause; exact bytes unchanged'
 if path!='skills/super-auto/report-prompt.md':assert current==frozen and currentExcerpt==excerpt
 else:assert current!=frozen
 snap=dest/'historical-source'/path;snap.parent.mkdir(parents=True,exist_ok=True);snap.write_bytes(frozen)
 sourceBinding.append({'originalManifestEntry':entry,'historicalSnapshot':str(snap),'historicalFullSha256':sha(frozen),'historicalExcerptSha256':sha(excerpt),'currentSource':HEAD,'currentFullSha256':sha(current),'currentSameLineExcerptSha256':sha(currentExcerpt),'fullMatches':current==frozen,'excerptMatches':currentExcerpt==excerpt,'applicabilityRole':role})
diff=subprocess.check_output(['git','diff',OLD,HEAD,'--','skills/super-auto/report-prompt.md'],cwd=W)
(dest/'report-context.diff').write_bytes(diff)

c8=[]
for item in load(STUDY/'scores.json'):
 if not item['id'].startswith('C-after-'):continue
 response=(STUDY/(item['id']+'-response.txt')).read_text()
 claim=item['claims']['C8'];assert claim['disposition']=='pass'
 assert all(q in response for q in claim['evidence_quotes'])
 grouping=response[response.rfind('- '):].strip()
 c8.append({'trial':item['id'],'originalAgent':item['agent'],'score':claim,'responsePath':str(STUDY/(item['id']+'-response.txt')),'responseSha256':sha(response.encode()),'allRecordedC8QuotesExact':True,'groupingResponseTail':grouping})
assert len(c8)==5
summary=load(STUDY/'claim-summary.json')['C8']
assert summary['installed_6_0']=={'pass':5,'fail':0} and summary['no_guidance']=={'pass':5,'fail':0}
assert summary['after']=={'pass':5,'fail':0,'ambiguous':0,'omitted':0}

currentContracts=[]
for path,start,end in [('skills/super-code/coordinator-subagents.md',101,107),('skills/super-code/coordinator-workflow.md',1494,1513),('skills/super-code/coordinator.js',631,675)]:
 b=get(path);currentContracts.append({'source':HEAD,'path':path,'sha256':sha(b),'lineStart':start,'lineEnd':end,'text':b''.join(b.splitlines(keepends=True)[start-1:end]).decode()})
binding={'proposalOnly':True,'historicalStudySource':OLD,'currentSource':HEAD,'originalRequiredObservable':{'path':str(W/'.superpowers/sdd/super-plan-ufz-plan/task-7-brief.md'),'acceptanceLine':25,'requirement':'Alias/provenance/negative-case fixtures pass; coordinator owns representative fresh-agent semantic tagging evaluation.'},'historicalStudyArtifacts':retained,'sourceBinding':sourceBinding,'currentContracts':currentContracts,'claim':'C8 only','actualObservedC8':c8,'scoresUnchanged':summary,'independentAssessment':{'path':str(assessment),'retained':str(dest/'independent-assessment.md'),'sha256':sha(assessmentBytes),'verdict':'SUPPORTED within original representative semantic-tagging scope; historical C8 reuse plus current mechanics'},'contextDiff':{'path':str(dest/'report-context.diff'),'sha256':sha(diff),'judgment':'Complete context diff inspected: durable source/disputed-ledger reporting, redesign states and cleanup retention do not alter the operative C8 grouping/identity/severity/fix-scope rules.'},'scope':'Actual historical model answers reused only for unchanged C8 semantic contract. No new experiment, no A–N tagging-case relabel, no full-case/current-guide carry-forward, no runtime normalization authority for unknown cleanup-permission-denied tag.','limits':['Five fresh gpt-6.1-sol/medium/fork_turns=none excerpt-pack respondents; historical manual unblinded scoring and shared system/developer context.','Both historical comparison arms already5/5; no improvement claim.','Not automatic skill discovery, a complete current coordinator session, universal tagging reliability, hosted/live Workflow or every unknown tag.','Original pending/unperformed statements remain true for their historical source; later attributed C8 answers supply current relevant representative observable.']}
dump(P/'r11-c8-source-binding.json',binding)

cat=load(P/'evidence-catalog.json')
cat['evidence']['r11-independent-c8-assessment']={'kind':'independent applicability assessment of retained actual behavior and current source','originalPath':str(assessment),'retained':str(dest/'independent-assessment.md'),'sha256':sha(assessmentBytes),'summary':'Original Task7 expressly assigned semantic tagging evaluation. Historical actual C8five/five supports unchanged operative clauses plus current mechanics; unrelated A–N/mechanics alone insufficient. No improvement; report context changed and explicitly assessed.','executedByThisTask':False}
cat['evidence']['r11-historical-c8-source-binding']={'kind':'targeted retained actual study/source-binding and exact quote integrity','path':str(P/'r11-c8-source-binding.json'),'sha256':sha((P/'r11-c8-source-binding.json').read_bytes()),'historicalSource':OLD,'currentSource':HEAD,'scope':'C8 only, actual5fresh historical responses and explicit unchanged-clause/context adjudication; not new A–N or full-case current applicability.','currentContracts':currentContracts,'executedByThisTask':False}
cat['historicalReadMethod']+=' Revision1targeted amendment additionally read the full independent R11assessment, historical AFTER report/scenarioC/allfiveC-after answers, exact C8scores/claims/source manifest/recheck, original Task7brief and current coordinator alias contracts; recomputed C8operative full/excerpt hashes and inspected complete report-context diff. This does not expand reuse to other historical claims.'
dump(P/'evidence-catalog.json',cat)

specific={
 'new-169':'This exact Task7report passage preserves raw original class spelling/provenance and separates grouped recurrence from defect identity, severity, disposition and fix scope. The expressly assigned representative semantic-tagging obligation now has specific attributed evidence: retained actual historical C8five/five answers group the two explicitly described denied-inspection causes, keep their raw tags/distinct incidents and separate the assertion failure. Independent assessment binds unchanged delivered task-reviewer/reporter/feedback clauses to c216 and explicitly examines the changed report context; current exact-tag/unknown-fingerprint/resume mechanics are consistent. Generic A–N decisions or alias fixtures alone are not the semantic basis.',
 'new-171':'This exact Task7report scope statement correctly did not claim live ordinary semantic evaluation then, and legacy compact data without recurrence IDs stays qualified unknown. Later actual historical C8five/five fresh responses now supply the specifically assigned representative semantic observable for unchanged operative tagging clauses, with exact source/excerpt binding and independent context-diff assessment at c216. No new live run, old timestamp rewrite or automatic runtime alias for cleanup-permission-denied is inferred; models grouped the scenario explicit described inspection cause while preserving raw incidents.',
 'new-174':'This exact Task7review expressly delegated fresh-agent semantic tagging to the enclosing coordinator; mechanical success and unrelated representative A–N cases alone could not discharge it. The independent R11assessment now judges the retained actual historical C8five/five fresh answers against that exact assigned observable and unchanged operative task-reviewer/reporter/feedback clauses, with the modified reporting context separately inspected. All five preserve raw tags/distinct incidents and the separate assertion failure; current narrow exact-tag/provenance/resume mechanics support the same contract. This is specific historical C8reuse, not a new experiment or generic no-case exemption.'}
common=' Historical C8both comparison arms already passed5/5, so no improvement is claimed. The study is a five-response manual/unblinded excerpt-pack exercise, not universal/current full-session/live Workflow certification. Original occurrence/history remains outstanding; this relevance judgment supplies no disposition or identity link. Parent current criterion/root adoption remains independent.'
r11Behavior='Exact process-class aliases retain raw spelling/provenance and keep defect identity, severity, disposition and fix scope separate. Explicitly attributed historical C8actual fresh5/5decisions supply the assigned semantic observable for unchanged operative clauses; current coordinator exact aliases, unknown-text fingerprints and resume mechanical coverage remain separate supporting evidence.'
r11Evidence=['current-process-aliases','r11-historical-c8-source-binding','r11-independent-c8-assessment']
r11Limits='Historical C8is n5, manual/unblinded and excerpt-pack based with shared system/developer context; both original comparison arms5/5, no improvement. Operative reviewer/reporter/feedback clauses match c216exact bytes; the changed full auto/report context is separately assessed, not treated as byte-equal or full-case applicable. cleanup-permission-denied is semantically grouped from its explicit description in the case, not added as a runtime alias. A–N have no dedicated tagging case and do not replace C8. No full current session, universal/unknown-tag guarantee or live Workflow claim.'

exact=load(P/'exact-ref-proposals.json')
changed=[]
for x in exact['proposals']:
 if x['id'] not in TARGETS:continue
 basis=specific[x['id']]+common
 x['sourceSpecificJudgment']=basis
 x['proposedFindingAcceptance']['basis']=basis
 ev=x['proposedFindingAcceptance']['evidence']
 x['proposedFindingAcceptance']['evidence']=[str(P/'evidence-catalog.json')+'#'+k for k in r11Evidence]+[p for p in ev if not p.endswith('#current-process-aliases')]
 for m in x['currentCriterionMapping']:
  if m['id']=='R11':
   m['actualCurrentBehavior']=r11Behavior;m['evidenceKeys']=r11Evidence;m['observedRepresentativeCases']=['historical actual C8 five fresh responses; unchanged operative-clause applicability independently assessed'];m['measurementAndInterpretationLimits']=r11Limits
 x['remainingDependencies']=['Parent independent current-source criterion/root adoption after full composition; this proposal supplies no READY/root eligible assertion.','For R11specifically, reuse is limited to unchanged C8semantic contract with independent source binding; later operative grouping/identity/severity/fix-scope changes require rebinding and targeted assessment.']
 changed.append(x['id'])
assert changed==TARGETS
dump(P/'exact-ref-proposals.json',exact)
updates=load(P/'candidate-findingAcceptance-updates.json')
byRef={json.dumps(x['proposedFindingAcceptance']['ref'],sort_keys=True):x for x in exact['proposals'] if x['id'] in TARGETS}
for i,x in enumerate(updates['updates']):
 key=json.dumps(x['ref'],sort_keys=True)
 if key in byRef:updates['updates'][i]=byRef[key]['proposedFindingAcceptance']
dump(P/'candidate-findingAcceptance-updates.json',updates)
criteria=load(P/'criterion-judgments.json')
for c in criteria['criteria']:
 if c['id']!='R11':continue
 c['judgment']='Supported within the original representative semantic-tagging scope by explicitly attributed historical actual C8reuse plus current mechanics; parent current adoption remains independent'
 c['currentBehaviorBasis']=r11Behavior;c['currentCodeOrReviewedEvidence']=r11Evidence
 c['representativeCases']=['historical C8only:5fresh C-after answers at frozen0bb280; not new A–N']
 c['limits']=r11Limits
 c['remainingDependencies']=['Parent independent current-source criterion/global composition and root adoption; no actual root decision supplied by this proposal.','Rebind if operative grouping/identity/severity/disposition/fix-scope clauses change; no fresh evaluation required solely for unchanged bounded C8observable.']
dump(P/'criterion-judgments.json',criteria)
deps=load(P/'remaining-dependencies.json')
deps['specificLimits']['R11semanticTagging']='Specifically assigned obligation supported by actual retained historical C8five/five plus independent c216source-binding/context assessment; generic A–N/mechanics alone insufficient. Both comparison arms5/5; no improvement. No universal/full-session/live claim, original raw/pending history unchanged.'
deps['revision1ReadScopeAndDependencyStatus']={'scope':'Only new-169/new-171/new-174 relevance basis, R11criterion and associated evidence/readscope/dependency report amended.','sourceAssessment':str(assessment),'sourceBinding':str(P/'r11-c8-source-binding.json'),'semanticEvaluationDependency':'No new experiment required for unchanged bounded C8observable; exact historical source reuse and independent applicability judgment now supplied.','parentReportedCurrentState':'Parent reports actual c21647distinct checks plus2TMPDIRvariants pass and independently verified by global composer; O7six owned roots check exit0. This scoped amendment did not rerun or independently adjudicate those receipts. Original r0pending-stage statements remain attributable to r0; parent owns current adoption.','finalReadyClaimed':False,'rootEligibilityClaimed':False}
dump(P/'remaining-dependencies.json',deps)

report=(P/'REPORT.md').read_text()
report=report.replace('missing no-test/exhaustive alias exercise','missing no-test/exhaustive alias exercise (with specifically assigned representative R11semantic tagging now supported by attributed historical C8reuse, as amended below)')
report+='''\n## Revision 1 — narrowly attributed R11 / C8 reuse\n\nRevision 0 is preserved byte-for-byte at `/private/tmp/ufz-correction-final-criterion-proposals-r0/`, with its external file-hash manifest. Only new-169, new-171 and new-174 relevance judgments and the R11criterion/evidence/dependency rendition change; all 239exact refs, 55repair candidates, 184qualifications and 220unchanged existing nonblocking groups remain. All original raw/status data, 29supplements, 35source qualifications and five unknown outcomes are unchanged.\n\nThe original Task7explicitly assigned representative fresh-agent semantic tagging, so generic A–Nsampling or mechanical aliases alone were insufficient. The independent assessment `/private/tmp/ufz-correction-final-r11-assessment.md` now supports narrow reuse of actual retained historical C8: all five fresh C-after answers group explicitly described denied-inspection causes while retaining raw tags/distinct incidents and the separate assertion failure. Operative task-reviewer, roast reporter and upstream-feedback process clauses are byte-identical at c216; complete changes to auto/report reporting context were inspected and do not change that C8semantic contract. Current coordinator exact-tag/unknown-fingerprint/provenance/resume mechanics remain consistent and separately covered.\n\nThis is C8reuse only, not a new experiment, new A–Ntagging case, whole-case/current-guide applicability or runtime permission to normalize unknown tags. In particular cleanup-permission-denied is semantically grouped from its explicit described cause; it is not an added runtime exact alias. Historical original pending statements stay true at their original time. C8both original comparison arms already passed5/5; no improvement is claimed. Five manual/unblinded excerpt-pack answers cannot establish complete current sessions, automatic skill discovery, universal unknown-tag reliability or hosted/live Workflow behavior.\n\nParent now reports all actual c21647checks plus2TMPDIRvariants passed and independently verified, and O7six owned roots check exit0. That later global evidence is parent-owned; this amendment did not rerun or independently adjudicate it. The r0prospective dependency wording above remains its historical stage record, while current criterion/finding/root adoption remains with the parent. No final READY or actual root eligibility is asserted here. `R11-CHANGELOG.json` and `integrity-check.json` record exact changed IDs, file hashes and preservation checks.\n'''
(P/'REPORT.md').write_text(report)

# Semantic diff assertions: only three exact entries and only R11criterion can differ.
before=load(R0/'exact-ref-proposals.json');after=load(P/'exact-ref-proposals.json')
actual=[]
for a,b in zip(before['proposals'],after['proposals']):
 assert a['id']==b['id'] and a['exactOriginalRef']==b['exactOriginalRef']
 if a!=b:actual.append(a['id'])
assert actual==TARGETS
assert {k:v for k,v in before.items() if k!='proposals'}=={k:v for k,v in after.items() if k!='proposals'}
oldc=load(R0/'criterion-judgments.json');newc=load(P/'criterion-judgments.json')
assert [a['id'] for a,b in zip(oldc['criteria'],newc['criteria']) if a!=b]==['R11']
for n in ['candidate-supported-dispositions.json','historical-qualification-map.json','adoption-audit.json','native-review-assessments.json','exact-ref-index.tsv','supported-disposition-index.md']:
 assert (R0/n).read_bytes()==(P/n).read_bytes(),n
assert load(P/'adoption-audit.json')['candidateSupportedDispositions']==55
assert sum(x['effect']=='nonblocking' for x in updates['updates'])==184
assert sum(x['effect']=='required' for x in updates['updates'])==55

integrity=load(P/'integrity-check.json')
originalHashRechecks=[]
for x in integrity['originalRawIntegrity']:
 actualHash=sha(Path(x['path']).read_bytes());assert actualHash==x['expectedSha256'];originalHashRechecks.append({'path':x['path'],'sha256':actualHash,'matchesOriginal':True})
integrity['revision1R11Amendment']={'exactChangedProposalIds':actual,'criterionChangedIds':['R11'],'exactOriginalRefsAll239Unchanged':True,'candidate55BytesUnchanged':True,'historicalQualificationMapBytesUnchanged':True,'counts55Required184Nonblocking220ExistingPreserved':True,'revision0ByteManifest':str(Path('/private/tmp/ufz-correction-final-criterion-proposals-r0-manifest.json')),'revision0StillByteIdentical':inventory(R0)==manifest['files'],'historicalC8QuotesExact':5,'sourceClauseBindingChecks':len(sourceBinding),'originalRawHashRechecks':originalHashRechecks,'noCanonicalWrite':True,'noProductTestsOrEvaluationsExecuted':True}
dump(P/'integrity-check.json',integrity)
shutil.copyfile(__file__,P/'amend-r11-proposal.py')
post=inventory(P)
changedFiles=[{'path':k,'revision0Sha256':v,'revision1Sha256':post[k]} for k,v in manifest['files'].items() if post[k]!=v]
newFiles=[{'path':k,'sha256':v} for k,v in post.items() if k not in manifest['files']]
assert [x['path'] for x in changedFiles]==[x for x in manifest['files'] if x in ['REPORT.md','criterion-judgments.json','exact-ref-proposals.json','evidence-catalog.json','candidate-findingAcceptance-updates.json','remaining-dependencies.json','integrity-check.json']]
log={'proposalOnly':True,'revision':1,'basis':'Independent R11assessment and actual historical C8source binding; no generic A–N/no-case exemption','preservedRevision0':str(R0),'revision0Manifest':'/private/tmp/ufz-correction-final-criterion-proposals-r0-manifest.json','exactChangedProposalIds':actual,'changedCriterionIds':['R11'],'changedFieldsForTargetRefs':['sourceSpecificJudgment','proposedFindingAcceptance.basis','proposedFindingAcceptance.evidence','currentCriterionMapping.R11','remainingDependencies'],'changedExistingFiles':changedFiles,'newSupportingFiles':newFiles,'unchangedCriticalFiles':['candidate-supported-dispositions.json','historical-qualification-map.json','adoption-audit.json','native-review-assessments.json','exact-ref-index.tsv','supported-disposition-index.md'],'counts':{'exactRefs':239,'repairCandidates':55,'nonblockingQualifications':184,'existingNonblockingHistoricalGroups':220,'supplements':29,'sourceQualifications':35,'unknownOutcomes':5},'allOriginalRawRefsAndOutcomesUnchanged':True,'readScope':'Full independent R11assessment, old study report/scenarioC/all5actual responses/C8score quotes, original Task7acceptance, exact source manifest/recheck and current C8operative/context binding only. No fresh broad historical reread, new test/evaluation or source/canonical mutation.','currentAdoption':'Parent-owned; no final READY/root eligible claim.'}
dump(P/'R11-CHANGELOG.json',log)
print(json.dumps({'changedIds':actual,'changedCriterion':'R11','changedExistingFiles':[x['path'] for x in changedFiles],'counts':log['counts'],'revision0VerifiedUnchanged':inventory(R0)==manifest['files']},indent=2))
