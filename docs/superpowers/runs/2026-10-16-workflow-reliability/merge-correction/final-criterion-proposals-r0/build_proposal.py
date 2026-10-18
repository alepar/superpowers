import json, hashlib, subprocess, shutil, re
from pathlib import Path

W=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
P=Path('/private/tmp/ufz-correction-final-relevance-proposals')
O=Path('/private/tmp/ufz-correction-final-criterion-proposals')
O.mkdir(exist_ok=True)
SOURCE='4911223a98c2abd1ac1060e644053bf99ed7da0d'
FINAL='c21681200aac20fb0223b6b0e83e953b1bc75cde'
RUN=W/'docs/superpowers/runs/2026-10-16-workflow-reliability'
def j(p):return json.loads(Path(p).read_text())
def put(n,d):(O/n).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
def sha(b):return hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=W)
def ref(x):return {k:x[k] for k in ['source','section','position']}
def rkey(x):return json.dumps(ref(x),ensure_ascii=False,separators=(',',':'))

priorNew=j(P/'new213-exact-ref-relevance.json')['proposals']
priorOld=j(P/'old26-required-group-mappings.json')['groups']
priorCatalog=j(P/'source-and-schema-evidence.json')
initial=j('/private/tmp/ufz-correction-legacy-relevance/exact-ref-proposals.json')
initialBy={x['id']:x for x in initial['occurrences']}
delta=j('/private/tmp/ufz-correction-legacy-relevance/revision2-delta/exact-ref-delta-proposals.json')
deltaBy={x['id']:x for x in delta['proposals']}
history=j('/private/tmp/ufz-correction-legacy-relevance/historical-evidence-rebinding.json')
deltaProof=j('/private/tmp/ufz-correction-legacy-relevance/revision2-delta/source-bound-evidence.json')
qualification=j(P/'historical-qualification-map.json')

# Full prior structured work is read and retained, with all exact source text and raw mappings.
# No claim is made to repeat the initial/revision2 broad raw-source interpretations.
readInputs=[P/n for n in ['REPORT.md','new213-exact-ref-relevance.json','old26-required-group-mappings.json','candidate-findingAcceptance-updates.json','historical-qualification-map.json','source-and-schema-evidence.json','remaining-dependencies.json','adoption-audit.json']]
readInputs += [Path('/private/tmp/ufz-correction-legacy-relevance')/n for n in ['REPORT.md','exact-ref-proposals.json','historical-evidence-rebinding.json','prior-history-judgments.json','additional-evidence.json','supplemental-proposals.json','source-gap-proposals.json','unresolved-evidence-requirements.json']]
readInputs += [Path('/private/tmp/ufz-correction-legacy-relevance/revision2-delta')/n for n in ['exact-ref-delta-proposals.json','source-bound-evidence.json','pending-evidence-requirements.json']]
inputs=[]
for p in readInputs:
 b=p.read_bytes();inputs.append({'path':str(p),'sha256':sha(b),'bytes':len(b),'reuse':'complete attributed prior proposal read; no broad historical raw reread claimed'})

E={}
def artifact(k,p,summary,kind='retained-executed-or-independent-assessment'):
 p=Path(p);b=p.read_bytes();dest=O/'retained-evidence'/f'{k}{p.suffix}'
 dest.parent.mkdir(exist_ok=True);dest.write_bytes(b)
 E[k]={'kind':kind,'originalPath':str(p),'retained':str(dest),'sha256':sha(b),'bytes':len(b),'summary':summary,'executedByThisTask':False}
 return k
for i in range(1,6):
 for t in ['report','review']:
  artifact(f'task{i}-{t}',P/'retained-evidence'/f'task{i}-{t}.md',f'Full Task {i} {t}; prior pinned execution/review evidence retains original source identities and limitations.')
artifact('task6-report',W/'.superpowers/sdd/2026-10-17-workflow-reliability-merge-correction/task-6-seam-repair-report.md','Full original and appended Task6 reports; earlier 7b18 paired-result claim explicitly superseded by acknowledged settlement and separate history-attempt repairs.')
artifact('task6-round2-review','/private/tmp/ufz-correction-task6-rereview-round2.md','Independent approved 9e4 two-file re-review: R3 addressed, R1/R2 remain supported; 19 metrics/17 coordinator-to-profile cases and 325 adjacent assertions are retained worker receipts.')
artifact('final-wave-report','/private/tmp/ufz-correction-final-fix-wave-report.md','Eight concrete scoped fixes at491; full historical RED/intermediate failures and execution limits retained.')
artifact('final-wave-review','/private/tmp/ufz-correction-final-fix-review/review.md','Independent complete eleven-path fix re-review PASS; all eight addressed, no new demonstrated defect; no whole-branch readiness.')
artifact('final-wave-identities','/private/tmp/ufz-correction-final-fix-wave-logs/committed-source-identities.json','Exact committed491 file hashes, blobs and frozen guide equality; receipt does not restamp earlier command HEADs.')
artifact('phase1','/private/tmp/ufz-correction-actual-continuity-4911223a/phase1-report.md','Actual frozen four-helper execution: settled null retained then explicit recovery, ready silent retry, 4 occurrences still outstanding, idempotent collections, root gate ineligible.')
artifact('phase2','/private/tmp/ufz-correction-actual-continuity-4911223a/phase2-report.md','Actual original criterion RED, one-line committed counter repair, same check GREEN, exact supported disposition removes one of4 groups; other3 and independent review/human requirements remain pending. Controlled caller, not production acceptance.')
artifact('phase1-receipts','/private/tmp/ufz-correction-actual-continuity-4911223a/phase1-receipt-manifest.json','Phase1 exact argv/environment/source/hash/stream inventory.')
artifact('phase2-receipts','/private/tmp/ufz-correction-actual-continuity-4911223a/phase2-receipt-manifest.json','Phase2 exact diff/RED/GREEN/ref/disposition/projection/gate/idempotence receipt inventory.')
artifact('primary-grade',RUN/'merge-correction/behavior-eval/primary-grading/grade.json','Blinded primary after A–F30/30; before28PASS1FAIL1AMB. Five subjects per arm, supplied-fact textual decisions; old B refusal policy qualifies comparison.')
artifact('supplemental-grade',RUN/'merge-correction/behavior-eval/supplemental-grading/g-m-grade.json','After-only G–M34/35; M4/5. Same five after respondents,35 correlated decisions, L/M case-derived.')
artifact('m-assessment','/private/tmp/ufz-correction-m-eval-assessment.md','Retains after_2 material M FAIL for unsupported missing-work assertion; no source-instruction defect established. Correct sync/owner/failure-hold facets remain bounded evidence.')
artifact('n-grade','/private/tmp/ufz-supplemental-grading/n-grade.json','N after-only5/5 same respondents; current attempt SETUP_FAILED/retention supported. Later recovery not uniformly demonstrated; no before N or compliance improvement claim.')
artifact('n-parent-verification','/private/tmp/ufz-supplemental-grading/n-parent-verification.json','Parent verified25 exact quotes/hashes, zero errors; packet match is not actual process-cleanup measurement.')
artifact('feedback-grade',RUN/'merge-correction/feedback-eval/grading/grade.json','Before5/5 after5/5 correct ID reconciliation: two task landings plus one base absorption; no improvement claim.')
artifact('guide-equality','/private/tmp/ufz-correction-behavior-eval/final-fix-head-guidance-equality.json','Twelve supplied full-guide files byte-equal491 source; new top-level super-code guide separately covered by N.')
artifact('n-guide-identity','/private/tmp/ufz-correction-behavior-eval/after-only-final-super-code-identity.json','After-only final top-level guide identity; do not infer older baseline equivalence.')
artifact('policy',P/'retained-evidence/policy.md','Approved scope: captured bounded incomplete review can progress without omission authority; outer caller owns complete original design/code input populations.')
artifact('blocker-status',P/'retained-evidence/blocker-status.json','Actual parent-read super-plan-8fn status CLOSED, resolved by merged ufz.6; narrow historical bookkeeping only.')
artifact('history-registration',P/'retained-evidence/history-registration.json','79 registered retained representations, all source-specific original refs preserved; population receipt not acceptance.')
artifact('original-requirements',RUN/'coverage-round-1-requirements.md','Exact original R1–R15 definitions.')
artifact('original-accounting',RUN/'final-acceptance-accounting/assessment.md','Original root assessment remains pending at its own old source; 26required220nonblocking subset and original unknowns preserved, not rewritten.')
artifact('final-suite-plan','/private/tmp/ufz-correction-final-suite-plan-c2168120.json','Prospective47 distinct commands plus2TMPDIR configurations; no final execution result is asserted by this proposal.')
artifact('suite-owner-amendment','/private/tmp/ufz-correction-final-suite-owner-amendment.json','Prospective actual owner reconciliation; old aggregate wrapper/history remains retained, no command silently substituted.')
for k,n,s in [
 ('wave-r1','R1-final.log','22 recovery scope scenarios, exit0'),('wave-r2','R2-final.log','4 unplanned-admission cases, exit0'),
 ('wave-h2','H2-final.log','6 real-subprocess liveness classifications, exit0'),('wave-sr1-h1','SR1-H1-final.log','17 source-binding producer/parser/collector and writer collision cases, exit0'),
 ('wave-a1','A1-green.log','39 acceptance population cases; printed helper/test file hashes match491 despite precommit9e4HEAD'),
 ('wave-a2','focused-final-3.log','32 recovery/status/acceptance cases, exit0'),('wave-replay','replay-final-corrected-controls.log','2404/0 retained execution; dryRun48/19/23; not final47combinedsuite')]:
 artifact(k,Path('/private/tmp/ufz-correction-final-fix-wave-logs')/n,s)

# Frozen full files plus exact current spans, distinguished from actual execution receipts.
sourcePaths=sorted({v['path'] for v in priorCatalog['evidence'].values() if isinstance(v,dict) and v.get('kind')=='static-current-source'}|{
 'skills/super-auto/scripts/collection-records.cjs','skills/super-auto/run-state.md','skills/super-code/SKILL.md','skills/super-code/coordinator.js','skills/super-code/scripts/run-profile.mjs','skills/super-design/SKILL.md'})
source={}
for p in sourcePaths:
 b=git('show',SOURCE+':'+p);f=O/'frozen-source'/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(b)
 source[p]={'revision':SOURCE,'path':p,'sha256':sha(b),'bytes':len(b),'retained':str(f),'sameAtFinalDocsCommit':b==git('show',FINAL+':'+p)}
def span(k,p,start,end):
 b=(O/'frozen-source'/p).read_bytes();ls=b.decode().splitlines(keepends=True)
 E[k]={'kind':'current-code-inspection','revision':SOURCE,'path':p,'fileSha256':sha(b),'lineStart':start,'lineEnd':end,'byteStart':len(''.join(ls[:start-1]).encode()),'byteEnd':len(''.join(ls[:end]).encode()),'text':''.join(ls[start-1:end]),'retained':source[p]['retained'],'sameAtFinalDocsCommit':source[p]['sameAtFinalDocsCommit'],'limits':'Inspected code, not test execution or whole-criterion acceptance.'}
for k,v in priorCatalog['evidence'].items():
 if isinstance(v,dict) and v.get('kind')=='static-current-source':
  # Old line offsets remain attributable old evidence, not republished as current spans.
  E['prior-'+k]=v
specs=[
 ('current-recovery-admission','skills/super-code/coordinator.js',412,505),
 ('current-hold-enforcement','skills/super-code/coordinator.js',934,963),
 ('current-newwork-admission','skills/super-code/coordinator.js',1535,1616),
 ('current-capacity-verification','skills/super-code/coordinator.js',1700,1882),
 ('current-resume','skills/super-code/coordinator.js',820,934),
 ('current-settlement','skills/super-code/coordinator.js',1438,1505),
 ('current-stub','skills/super-code/coordinator.js',3035,3057),
 ('current-metrics','skills/super-code/coordinator.js',2230,2320),
 ('current-population','skills/super-auto/scripts/report-status',173,337),
 ('current-attribution-gate','skills/super-auto/scripts/report-status',103,170),
 ('current-shared-history','skills/super-auto/scripts/collection-records.cjs',1,38),
 ('current-collection','skills/super-auto/scripts/report-status',385,453),
 ('current-status-history','skills/super-auto/scripts/report-status',510,575),
 ('current-finding-contract','skills/super-auto/run-state.md',240,307),
 ('current-disposition-parser','skills/super-auto/scripts/scope-dispositions',130,166),
 ('current-finding-relevance-gate','skills/super-auto/scripts/report-status',329,349),
 ('current-profile-history','skills/super-code/scripts/run-profile.mjs',1153,1210),
 ('current-sync-resume','skills/super-auto/resume.md',69,81),
 ('current-sync-design','skills/super-design/SKILL.md',895,918),
 ('current-four-cleanup-arrays','skills/super-code/SKILL.md',170,182),
]
for args in specs:span(*args)
for k,p,anchor,before,after in [
 ('current-process-aliases','skills/super-code/coordinator.js','const processAliases',2,48),
 ('current-readiness-profile','skills/super-code/scripts/run-profile.mjs','b.createdAt = creation.get',4,31),
 ('current-planning-profile','skills/super-code/scripts/run-profile.mjs','const planning',4,32),
]:
 lines=(O/'frozen-source'/p).read_text().splitlines()
 hits=[i for i,l in enumerate(lines) if anchor in l]
 if not hits and k=='current-planning-profile':
  old=priorCatalog['evidence']['planning-profile'];span(k,p,old['lineStart'],old['lineEnd'])
 else:
  assert hits,(k,anchor);i=hits[0]+1;span(k,p,max(1,i-before),min(len(lines),i+after))

# Original exact criteria, updated current behavior and evidence scope.
reqs={}
for line in (RUN/'coverage-round-1-requirements.md').read_text().splitlines():
 k,txt=line.split(' ',1);reqs[k]=txt
profiles={
 'R1':('Captured source bounds and guarded immutable outputs remain; unavailable omission provenance grants zero omissions and only separately bound incomplete review. The final null-seam stub now survives strict extraction without granting readiness.', ['current-stub','final-wave-review','task4-review','wave-sr1-h1'], ['A','B','phase1','phase2'], 'Actual process-isolated review evidence remains bounded: controlled assembler failure, no arbitrary detached-process absence or exhaustive no-test-review execution.'),
 'R2':('Inventory failure remains unknown/exit4; discard/setup preserves worktrees/branches on exits3/4; four result arrays and dependent resources are explicit. N confirms current supplied-fact SETUP_FAILED decisions.', ['current-four-cleanup-arrays','task6-report','final-wave-review','wave-h2'],['D','N'],'Native Linux /proc and actual final parent teardown were not demonstrated. No zero-process claim is inferred; retained caller resources require fresh observation before deletion.'),
 'R3':('Mapped dispatch, verification reacquisition and newly initiated unplanned routing recheck admission after actual capacity acquisition. Failed external observations invalidate stale success; already-owned settlement is allowed to finish.', ['current-newwork-admission','current-capacity-verification','task1-review','wave-r2'],['G'],'The during-wait case injects a real producer hold at a test boundary; no live external-arrival or hosted tracker transaction claim.'),
 'R4':('Invalid compact Recovery constrains identifiable tasks/global unknown scope without becoming clearable valid obligations. Resume preserves original history, requires full observations and acknowledged durable settlement, and reruns committed Key Abstractions sync before filing.', ['current-recovery-admission','current-resume','current-settlement','current-sync-resume','current-sync-design','task5-review','task6-round2-review','wave-r1'],['G','H','M'],'M after_2 material missing-work FAIL remains; no source-instruction defect established. Textual sync/adoption/failure-hold evidence does not establish actual tracker effects.'),
 'R5':('Command/configuration/source/outcome/kind validation and gate evidence binding distinguish live, simulated, fallback, failed and unavailable. Reviewed source chronology remains an owning-agent semantic judgment.', ['current-attribution-gate','task3-review','final-wave-review'],['E','I'],'Synthetic live-kind fixture records are not real live product measurements; missing original baselines are never reconstructed.'),
 'R6':('Reviewed unchanged verification releases capacity before waiting on parents and reacquires with fresh admission. Typed close and acknowledged post-check settlement complete without a fake commit/landing; implementation requirements remain.', ['current-capacity-verification','current-settlement','current-profile-history','task1-review','task6-round2-review'],['H'],'Historical strict B4 AFTER0PASS2FAIL3AMB remains unchanged. Current H5/5 is a distinct after-only five-response study, not a retrospective B4 repair or universal agent guarantee.'),
 'R7':('Caller gate independently retains actual requirements, complete source populations, producer obligations, source-bound measurements/reviews and reserved human decisions. Read-only status now validates recovered collection history using the same validator as collection.', ['current-finding-contract','current-population','current-attribution-gate','current-status-history','current-shared-history','wave-a1','wave-a2'],['E','F','L','phase1','phase2'],'Actual controlled fixture still refuses acceptance after one fixed criterion. No actual root eligibility, human decision, or branch-choice authorization is supplied.'),
 'R8':('Retained run-introduced ownership and conflicting source history survive task-base/pre-run diagnosis; gate imports gaps before diagnostic classification. Missing baseline stays a gap.', ['current-attribution-gate','task3-review'],['I'],'No historical run baseline, introducing owner or previously unobserved measurement is invented from empty returned arrays.'),
 'R9':('Original invocation/ref identities survive null recovery, ready silent retry and idempotent replay. Typed key population is transport only; complete registered extractions/correspondence bind actual original source appearances.', ['current-population','current-collection','current-shared-history','wave-a1','wave-a2','history-registration'],['C','L','phase1','phase2'],'79 retained source representations and486appearances/469groups0structuralgaps establish the registered population, not original missing-wrapper verdicts or root acceptance.'),
 'R10':('Supported explicit original-ref disposition, concrete repair/rejection basis and verification alone remove an item; uncertain equal-key/text appearances remain separate. Phase2 actually repairs one while preserving three others.', ['current-finding-contract','phase2','phase2-receipts'],['C','phase1','phase2'],'This proposal applies no dispositions/links. Original rejection reasons remain; successful tasks or a passing criterion alone do not dispose every related occurrence.'),
 'R11':('Exact process-class aliases retain original spelling/provenance and separate defect identity, severity and scope; recurrence emits a grouped observation for reassessment, not automatic shared fix authority.', ['current-process-aliases','task6-round2-review'],[],'No dedicated new process-alias behavior case was run. Representative evaluation is a selected changed-instruction sample, not exhaustive per-sentence certification; original raw history and exact alias fixtures remain named evidence.'),
 'R12':('Independent Finish source observations, valid-empty vs unavailable transport and explicit ID discrepancies remain distinct. Task6 output drains large JSON; unavailable sources never become zero run totals.', ['current-metrics','task6-report','task6-round2-review'],['K','feedback'],'Metrics fixtures are deterministic observations. They do not establish complete historical totals or improve agent performance.'),
 'R13':('Verification completion, latest attempt, historical implementation release and genuine landing remain separate. Acknowledged settlement controls verification completion; earlier timed/untimed landing evidence survives and base absorption adds zero task landings.', ['current-profile-history','current-settlement','task6-round2-review','feedback-grade'],['K','feedback'],'Readiness20s/wait5000ms, earlier landing22s/40s and44%model-fit remain original observations, not newly inferred timing or measured improvement.'),
 'R14':('Timing is bounded by task existence, evidenced mapping/dependency readiness and observed graph scope; null waits and planning are preserved. Historical graph interpretations are qualified, not retroactively reconstructed.', ['current-readiness-profile','current-planning-profile','task6-round2-review'],['K'],'Historical64,688,059ms modeled vs63,785,002ms observed, creation contradiction and residual graph limitations remain; no causal3x/remedy claim.'),
 'R15':('Focused source-pinned mechanics, representative real model decisions, actual controlled helper continuity and independent source review are separate evidence classes; final integrated suite and global composition remain independently required.', ['final-wave-review','task6-round2-review','phase1','phase2','primary-grade','supplemental-grade','m-assessment','n-grade','feedback-grade','final-suite-plan'],['A','B','C','D','E','F','G','H','I','J','K','L','M','N','phase1','phase2'],'47distinct final entrypoints plus2TMPDIR configurations are prospective here. No combined-source pass or root eligible assertion. M4/5 remains material, no total-behavior pass or general improvement inferred.'),
}
pendingGlobal=['Parent independent final composition against exact final source/product equality; no whole-branch READY verdict in this proposal.', 'Actual final47 distinct command receipts plus2targeted TMPDIR configurations, source/command/configuration/outcome/streams matched to final requirements; not inferred from focused logs.', 'Preserve all original missing wrappers, five unknown historical verdicts, original failed/unavailable observations and absence of pre-code root snapshot.', 'Actual caller Recovery/checkEvidence/runFailures reconciliation and exact finding adoption; no fabricated empty history.', 'Reserved phase7 human decision remains independently pending; no agent-provided accept decision.', 'Actual caller/review parent cleanup remains unknown until fresh resource observation; retain resources and evidence.']
criteria=[]
for k,(behavior,ev,cases,limits) in profiles.items():
 criteria.append({'id':k,'originalRequirement':reqs[k],'judgment':'current source contract and bounded evidence support the named behavior; final criterion acceptance remains parent-owned', 'currentBehaviorBasis':behavior,'currentCodeOrReviewedEvidence':ev,'representativeCases':cases,'limits':limits,'remainingDependencies':pendingGlobal[:2]+(['Material M failure retained; independent representativeness judgment must explicitly address it.'] if k in ['R4','R15'] else []),'proposedRootReviewRecord':None,'finalPassClaimed':False})
criteria += [
 {'id':'finding-continuity-fresh-agent-assessment','judgment':'Supported bounded actual-helper and fresh-agent evidence; final global assessment pending','basis':'C textual cases5/5 plus actual phases1/2 exercise settled-null explicit recovery, immutable collection/replay, ready silent retry, retained unrelated/deferred/untested findings, original criterion RED, exact committed repair and one supported original-ref disposition. The actual gate stays ineligible before and after the scoped repair.','evidence':['primary-grade','phase1','phase2','phase1-receipts','phase2-receipts'],'limits':'Controlled fixture caller uses complete four-helper closure491 and real shell/Git/check executions. It is not hosted Workflow, production root acceptance, actual human decision, or exhaustive both-mechanism agent execution.','remainingDependencies':pendingGlobal[:2],'finalPassClaimed':False},
 {'id':'changed-instruction-representativeness-assessment','judgment':'Representative source-bound instruction decisions support the declared structural contracts with explicit material M qualification; no perfect-compliance or improvement claim','basis':'Full guides supplied and byte-bound to current product. A–F after30/30, before28PASS1FAIL1AMB; G–M34/35 after-only with M4/5; N5/5 after-only same five after respondents; feedback before5/5 andafter5/5. These cover amendment sync, captured review/provenance, findings, resource retention, required live gate, local finish choice, fresh admission, verification completion, attribution, no-test/missing-evidence review, timing/metrics, full source populations, committed sync/owner adoption and denied setup.','evidence':['primary-grade','supplemental-grade','m-assessment','n-grade','n-parent-verification','feedback-grade','guide-equality','n-guide-identity'],'limits':'M after_2 invented no missing work and advanced filing; keep FAIL. Four sync facets have5/5 evidence and source sufficient, but actual filing/tracker execution unobserved. Same respondents produce correlated decisions, L/Mcase-derived, Nafter-only, no dedicated alias case. Old B policy differs; historical B4 remains unchanged. No pooled40independent/respondent claim or improvement inference.','remainingDependencies':['Independent global composition must decide representative sufficiency with retained M FAIL and explicit coverage limits; no new unapproved universal zero-error requirement.']+pendingGlobal[:2],'finalPassClaimed':False}
]
put('criterion-judgments.json',{'schemaVersion':1,'proposalOnly':True,'inspectionSource':SOURCE,'finalDocsSource':FINAL,'criteria':criteria,'globalRemainingDependencies':pendingGlobal})

# Source-specific historical repairs: exact appearances are separately judged using their own raw
# appearance plus the named concrete repair evidence. No automatic identity links are created.
repairBy={}
for x in priorNew:
 prev=(initialBy if x['priorWork']['artifact']=='prior-initial' else deltaBy)[x['priorWork']['id']]
 keys=prev.get('historicalEvidenceKeys',prev.get('evidenceKeys',[]))
 disp=prev.get('proposedDisposition') or ''
 if disp in ['resolved-supported','historical-seam-addressed','supported-bounded-historical-repair-proposal'] or disp.startswith('supported-historical-') and 'qualification' not in disp:
  repairBy[x['id']]={'kind':'bounded historical repair','basis':prev['basis'],'historicalEvidenceKeys':keys,'verification':'The named retained repair source supplies actual executed RED/GREEN commands/results at its own stated head/tree; the exact current relevant mechanism remains in the frozen491 source. Historical commands are not restamped as final-source execution.'}
# Independent structured appearances need their own exact raw scenario assessment, not key matching.
repairBy['new-091']={'kind':'same-review structured original finding; separately assessed','basis':'This exact Task19 /finding field independently describes the deleted foreign-ledger bounded-transport fixture and unimplemented amendment. Task19 later explicitly implemented that bounded amendment at d604b8a7/tree0c1a61d28b20d557e0664056906edbafaed34d36; retained full replay2329/0 plus hold-scope16 and digest success check unavailable/foreign hold, recovered basis and genuine absent basis. The source/scenario and changed fixture are matched substantively, not linked by display key or assumed JSON identity.','historicalEvidenceKeys':['task19-fixture'],'verification':'Task19 retained actual fix-replay-final-r1.log2329/0 and source-bound hold/digest commands, with current corresponding Recovery fixtures surviving; final combined-source check remains pending.'}
repairBy['new-108']={'kind':'same-review structured original finding; separately assessed','basis':'This exact Task20 /finding field describes operational Resume executing during ordinary non-review builder loading. Concrete633c351b/treee074a18493acc7ae30c0a31ceeb77964a0d4e4bc returns initialized real builders before operational Resume; loader throws if any dispatch occurs. Actual unchanged ordinary dispatch suite,16startup and126realCLI seam assertions passed. Current loader preserves that early-return boundary while live Resume still requires safe identity/persistence. No link to the prose appearance is added.','historicalEvidenceKeys':['builder'],'verification':'Original Task20 Fix-pass commands/results at633c351b plus current loader/Resume inspection; no fresh-agent or final-suite claim.'}
repairBy['new-210']={'kind':'original Task8.4 criterion contradiction corrected','basis':'The original settled-tree Task8.4 required including verified external fixes, contradicting the governing removal rule. The actual settled-tree-after-roast-1 Task8.4 now explicitly excludes supported resolved/rejected findings, including externally verified fixes. Actual Task13 report at ee4f3cfcd20a6eb8ada40f32e821dbbd6895630b records script/lint exit0 and the exact assertion "verified fix supplied elsewhere leaves punch list". Current scope-dispositions requires supported exact-ref disposition and verification. This resolves the specific task criterion contradiction; the original confirmed verdict and frozen pre-fix tree stay unchanged.','historicalEvidenceKeys':['task8.4-criterion-repair'],'verification':'Exact before/after Task8.4 description and actual Task13 final script/lint output, reinforced by actual phase2 one-ref supported removal; no source-ID/key shortcut.'}

oldRepairs={
 1:('Verification child cap1 parent-failure deadlock','The reviewed Task1 change releases the verification child slot before parent settlement, reacquires after success, and uses shared fresh admission. Independent rereview confirms failed parent cleanup retains capacity and the original cap1/cap2/success/failure/cancellation controls; finalwave newWork gating is restricted to fresh routing and preserves owned settlement.','task1-review','current-capacity-verification','wave-replay'),
 2:('Archive destination intermediate symlink escape','Task2 actual component-wise destination lstat validation precedes reads/hashes/copies, repeats after parent creation, and rejects matching outside sentinels.32symlink controls passed; Task2 scoped rereview and finalwave32affected controls preserve containment. No atomic hostile concurrent-filesystem guarantee is claimed.','task2-review','current-collection','final-wave-review'),
 3:('Pre-run diagnostic drops retained attribution contradictions','Task3 gate imports retained failure gaps before pre-run/diagnostic classification; same-source/history contradiction cannot be retired by an alternative current classification. Independent Task3 review and exact attribution/population controls preserve owner/history.','task3-review','current-attribution-gate','final-wave-review'),
 4:('Immutable review-source metadata misread as a measurement','Task3 validates review-source deferred records as hash-bound immutable provenance, checks historical/current consistency and excludes only that validated metadata from measurement interpretation. Malformed identity/history remains a gap; no fake command/configuration is created.','task3-review','current-attribution-gate','task4-review'),
 5:('Settled null invocation cannot recover actual review','Task2 explicit --recover-null preserves original unavailable/null predecessor, expected report path/verdict and ordered required identity; Task4 selector validates same transition. Finalwave shared validator makes collection/status/acceptance agree. Actual phases1/2 use the frozen four-helper closure, real explicit recovery and unchanged idempotent replays.','task2-review','task4-review','phase1','phase2','current-shared-history','final-wave-review'),
 6:('Committed amendment resume skips Key Abstractions sync','Both resume surfaces now enter specs-committed sync before filing/advance and hold on sync failure; committed authority, replacement and owner adoption follow existing idempotent procedure. Independent Task5 review confirms10/0 mechanical contract plus mutation controls; Manswers all support four sync facets. Material Mafter_2filingFAIL remains and does not establish source-instruction defect or actual tracker execution.','task5-review','current-sync-resume','current-sync-design','m-assessment'),
 7:('Selector policy escalation: provenance refusal suppresses bounded source review','Approved explicit scope ruling preserves omission refusal but permits separately captured bounded incomplete review. Task4 validates full Git inventory/hunks, hard output/source guards and forces not-ready; finalwave producer/parser integration preserves that route. This supplies the specific policy/availability adjudication, not resolution of original690provenance gaps or whole-range readiness.','policy','task4-review','final-wave-review','wave-sr1-h1'),
 8:('Design-loop producer/consumer declaration escalation','Approved ruling assigns complete original code/design input population declaration and extraction/correspondence to the outer caller. Task3+4 require actual declared inputs including empty/key-only and reject truncation. Finalwave A1 recognizes proper typed keys without filename identity. Original design-ledger existence is not treated as fabricated roast invocation or source record.','policy','task3-review','task4-review','current-population','wave-a1','final-wave-review'),
 16:('Recovery source metadata becomes unsatisfiable measurement','This separately referenced P2 appearance follows the actual dispatch-text producer→Recovery reader→acceptance consumer. Valid review-source metadata retains exact source identity but is not required to invent a measurement. Task3 source-specific validation and Task4 source binding address that chain; unsupported/malformed metadata remains a gap.','task3-review','task4-review','current-attribution-gate'),
 17:('Copied run snapshots create omission authority and prevent bounded review','Approved Task4 boundary now supplies separate bounded captured-source availability with zero omissions, unchanged full inventory and retained provenance gaps. Writer validates exact captured hunks and ownership, preserves findings and forces whole-range not-ready. Original sidecar690gaps stays immutable; no retrospective archival certification.','policy','task4-review','final-wave-review','wave-sr1-h1'),
}

# Individual qualifications beyond ordinary caller-owned pending-check statements.
specific={
 6:'The exact source limits its repair claim: contradictory histories still require independent measurement/semantic review. Current R5/R8 retain that rule; no new unmeasured product run is required solely by this report.',
 8:'Runtime validates evidence shape/identity while reviewers establish claimed baseline/base/fix semantic roles. This is the approved semantic ownership boundary, covered by R5/R8 and independent final review; no helper can prove chronology from a label.',
 9:'Compatible Recovery/source-evidence contracts and pending fresh behavior are composed through current R5/R8; old task success remains local. The exact source introduces no separate retrospective live measurement.',
 10:'Source chronology/semantic check correspondence is an owning-reviewer obligation under R5/R8; current source retains contradictory gaps. Missing historical measurements stay unknown instead of becoming a new reconstructive requirement.',
 15:'The independently appended appearance preserves the same report-local limitation on contradicting measurements; no automatic match or inheritance is added. Current R5/R8 assessment carries the actual evidence duty.',
 21:'Scoped holds/deferred records constrain affected task and consumers; merge-lane holds all. This operative contract is implemented and reviewed in shared admission plus finalwave invalid-scope and unplanned routes. No universal unrelated-work hold is required.',
 22:'Only generated resume holds may auto-reconcile; other owners provide explicit evidence-bearing clears. Current Recovery paths retain that ownership; final caller must reconcile real holds without inventing historical clears.',
 25:'Unscoped diagnostic deferrals are caller-owned while explicit task scopes gate admission. Current R4/R7 preserve that distinction; report-local no-comment reading is historical metadata, not another current defect.',
 30:'The schema-correct diagnostic remains unscoped/caller-owned and does not quarantine arbitrary unrelated tasks. Original fixture fix is assessed separately; this occurrence is the contract qualification.',
 34:'Typed no-change completion without valid retained basis stays a Recovery gap and the4096byte cap remains. Current R4/R6 and acknowledged settlement enforce that boundary; no uncapped reader or fake commit is required.',
 35:'The supplied historical baseline failed3/5installed vs0/5controls; preserve that outcome. Current H5/5after-only is bounded additional evidence, not a regrade, same-pack improvement claim or universal compliance proof.',
 37:'No-change intent and independent semantic evidence remain necessary; unchanged code alone cannot complete implementation. Current R6 source and Htext decisions implement that contract without artificial commits.',
 40:'All internal confirmation callers are mechanically exercised; agent semantic compliance is a separate R15assessment. This is caller coverage scope, not another missing implementation.',
 41:'An absent named seam wrapper was handled using the exact quoted dispatch and live owned diff. That original missing wrapper remains a qualification; it does not mandate recreating an unobserved historical file.',
 47:'Projection exit0/3/2/4 meanings are evidence availability, not semantic acceptance. Current R9/R10 caller preserves gaps/unavailable; no clean[] is inferred from unsupported tooling.',
 48:'Optional supported input records validate structure only and retain local consumer ownership; semantic supported disposition is independently judged for each ref under R10. No new lifecycle is required.',
 49:'Collector/source/route/disposition and Remaining/resume/status seams are composed by Tasks2–4 and real phases1/2. This instruction handoff stays subject to existing R9/R10 plus final source review rather than becoming a duplicate per-report blocker.',
 50:'Semantic sufficiency is explicitly the owner judgment, not a structural helper oracle. Current exact-ref candidates supply separate proof; this contractual warning itself is preserved as nonblocking.',
 52:'Documented --project reachability and local script callers are mechanics evidence only; actual continuity phases1/2 now exercise caller boundaries. Complete final suite remains required independently.',
 55:'Preserved golden fixtures and ordinary-key output establish historical compatibility, not current final acceptance; current R9/R10 suite still checks those contracts.',
 56:'Detailed projection retains original refs/outstanding/deferred/dispositions; metrics fields do not redefine findings. Current R9/R10/R12 gate and exact-ref analysis keep that boundary.',
 58:'Collector cannot infer unknown optional inputs or semantic fix sufficiency. Current actual complete caller declarations, hash/ref correspondence and independent disposition judgments carry those duties.',
 65:'Independent retry source observations retain their own units/support; current R12/R13 plus Task6 settlement/history corrections preserve that contract. Old task-local success is not root acceptance.',
 67:'Projection exit3 retains supported partial observations with gaps; current metrics and acceptance preserve that distinction rather than converting the report to zero totals.',
 69:'Legacy event lines, durable records, supported repaired groups and absent task-report coverage have distinct populations. This exact metric definition is retained; current R12/R13 does not require unavailable historical totals.',
 71:'This second source appearance records the same independent-source retry obligation but remains a separate ref. Current metrics support is inspected individually; no identity link is applied.',
 73:'Original rebase ancestry and source-bound check history are retained. Later Task6 changes have their own review; the report does not independently require replaying the historical rebase.',
 74:'Observed transport/reconciliation/landing discrepancy checks are bounded mechanical evidence. Current R12/R13 conditions remain separately required; no universal run-total claim follows.',
 79:'Approved caller relevance may exclude nonrequired deferred limitations while retaining them in Remaining; zero outstanding findings is not a contract. Actual required measurements/reviews/human decisions remain mandatory.',
 83:'The exact quoted rebase finding was available though named wrapper was absent. Concrete root seam evidence plus actual8fnclosed bookkeeping applies only to that historical transition; no missing-wrapper outcome is invented.',
 88:'This task-local node/whitespace/rebase outcome is source-bound historical evidence; no independently measured run-baseline exoneration is claimed. Current source/evidence validation still applies.',
 89:'The exact two-file review deliberately preserves raw failed history and limits integration claims; final source semantics and suite own the current composed behavior.',
 93:'Native Linux /proc is not demonstrated by macOS lsof integration. Retain this platform qualification; the approved contract does not require inventing another host/platform execution to accept the current macOS-bound evidence.',
 101:'Captured binding ownership and current startup/selector are now composed by Task4 with concrete scoped review; whole-source suite/review/human gates remain actual R15/R7 requirements.',
 113:'Empty supplied failure history gives no run-start baseline/owner attribution. The intentional RED remains failed evidence; current R5/R8/R7 assess actual records without reconstructing missing history.',
 117:'This exact report limits itself to source containment, leaving input selection to its sibling. Current Task4 and finalwave composition inspect both boundaries; no standalone leaf verdict covers the whole seam.',
 118:'Separate original JSON concern requires composition of input selection and source containment. Current component-wise source checks, captured inventory rules and Task4/finalwave complete scoped review support that composition. No link to prose or extra independent defect is asserted; final combined checks remain required.',
 119:'Source containment and input selection are separately owned and now composed in reviewed current code. No broad filesystem privilege or atomic adversarial concurrent-mutation guarantee is part of the approved minimal contract.',
 123:'Original baseline/resolved tree support bounded fixture failure only; no recorded owner or run-start result exists. Preserve that unknown attribution, original .27hold and later local pass without inventing retrospective exoneration.',
 126:'The old captured leaf excluded the adjacent startup fix. Current ordinary-builder early return and captured selector route have separate source-bound proof and composed review; this historical omission is not a new current defect.',
 127:'The literal caller-pending value is an original local evidence boundary; it supplies no new code scenario or original outcome. Current R1/R15 and caller gate retain the actual required assessment.',
 133:'This exact source delivers only historical profile claim qualification, not new live measurement. Current R14 code/readiness evidence and Ktext case provide bounded support; final suite/review and actual human gate remain separate.',
 134:'Separate JSON concern preserves the bounded historical interpretation correction and caller-owned remaining work. It is not a second profile defect or an independent original verification run.',
 135:'The historical .27closure hold, resources and reserved decision were untouched by that task. This source establishes no current tracker state. Preserve the historical hold as an unknown qualification; actual current caller must reconcile any real reserved gate, and phase7human-choice remains required. No new retrospective human decision is inferred.',
 136:'81/81retained entries prove archival byte completeness, not original baseline/control/repeated-run certification or current whole-branch review. Original representative-source limits remain explicit.',
 137:'Representative source, controlled assembler failure, absent task-review no-test exercise, and no repeated baseline remain historical coverage limits. Representative current eval and final composition are required; no blanket exhaustive new scenario requirement is invented.',
 138:'IMPLEMENTED/completionKind describes delivery only; actual caller acceptance remains independently gated under R2/R7. This occurrence is not an unresolved cleanup code finding.',
 140:'The original leaf consumed its current requirements with no amendments and delegated ordinary instruction evaluation. D/N and reviewed setup code now supply bounded relevant evidence; final integration remains a named current criterion.',
 144:'Generated status/kind/error slots are mechanics evidence. Gsupplies after-only ordinary textual decisions; actual external tracker transaction/adherence is not inferred.',
 145:'Historical baseline is retained unchanged and no concurrent agent was spawned in that task. Current Gcurrent admission decisions add bounded after-only support rather than a fabricated old-policy failure.',
 146:'Historical seat had no Workflow tool; real replay provides standard timers. Approved existing paths allow deterministic Workflow mechanics plus ordinary textual representative behavior; no separately mandated hosted runtime is invented.',
 148:'Timer finite-budget/quiet cancellation fixtures cover runtime mechanics. Current Gtext and finalwave admission controls add distinct evidence; no agent behavior follows from a timer assertion alone.',
 150:'Explicit clear evidence and caller-owned deferred sweep authority remain operative. R4/R7check real retained records; representative model decisions do not supply a historical clear.',
 151:'The simulated producer run cannot establish agent compliance; ordinary after-case evidence and final caller assessment are separate. No source API change or all-path live execution is implied.',
 152:'Ordinary dispatch calls unchanged builders; full integration and behavior assessment remain separate current requirements, not a new historical code defect.',
 155:'Read retained failing/passing producer history as mechanical source-bound evidence. Current R4/actual continuity plus final review decide caller obligations; old reports are not promoted into live outcomes.',
 157:'Existing baseline B1/B2/B5passed both arms, so source changes remain structural evidence slots without new generic policy. No behavior improvement is claimed from unchanged baseline success.',
 159:'Named live/simulated/fallback/failed classification cases now have E/Itext and actual gate fixtures; synthetic live-kind still supplies no real product measurement.',
 164:'Historical C5–C7passed both arms. Preserve those outcomes; Kcurrent timing/graph interpretation is bounded after-only support, not an old failure or improvement.',
 169:'Raw original process-class text remains authoritative; grouping does not change identity/severity/fix routing. Exact alias mechanics remain tested, while no dedicated current alias-text eval was run. Representative means selected changed contracts, not exhaustive per-sentence certification.',
 170:'Only exact aliases are authorized; ambiguous cleanup-denied is not inspection refusal. Current exact alias map preserves the narrow scope and raw provenance; no automatic shared defect/fix is accepted.',
 171:'Legacy compact data without recurrence IDs stays qualified unknown; no new ordinary semantic tagging run is fabricated. Current exact alias fixtures and representative-assessment scope are explicit.',
 176:'This producer hands source identity to downstream collection/disposition. Tasks2–4 and actual phases1/2 demonstrate current handoff; extraction/collection completeness alone still cannot authorize fix disposition.',
 179:'Strict parser rejects unsupported/empty/truncated sources. Portable unreadable-directory fixture does not prove real denied regular-file behavior; finalwave fixes actual stub producer without relaxing parser. Retain the exact evidence limit.',
 193:'Hosted Workflow and end-to-end live ordinary coordination were not executed historically; synthetic live-kind smoke stays simulated. Approved R15requires focused mechanics and representative actual agent decisions, not a newly invented mandatory hosted run.',
 194:'Preserve original strictB4AFTER0PASS2FAIL3AMB and all protocol diagnostic qualifications. Current H5/5 after-only is separate small textual evidence; no retrospective repair, pooled score, exact-stage-routing or live no-change claim.',
 195:'Original24/24owned Git/file/worktree checks remain limited by denied global ps, controlled assembler failure and absent no-test-review case. Current D/J/Ntext adds selected instruction coverage; actual caller resource cleanup remains unknown until freshly verified.',
 197:'Original linked-worktree packaging limitation and separately sourced standalone pass remain. Final suite uses an actual independently declared current clean checkout/configuration; no retrospective single23suite-linked pass is fabricated.',
 199:'The actual historical2294/1failure remains fail. Later Task19bounded fixture repair has explicit d604b8a7/tree0c1a61d28b20d557e0664056906edbafaed34d36 and actual2329/0 plus focused evidence; this occurrence records the earlier failed measurement, not an independently persistent current defect.',
 200:'The original implementation did not make its amendment edits. Later Task19fix source supplies those exact bounded fixture edits and2329/0 verification; preserve the original deferred statement rather than reclassifying its old delivery.',
 202:'Targeted Recovery may remain large; unavailable transport conservatively holds admission. Current invalid/oversized scope guards preserve that contract without extra reader dispatch or a new uncapped engine.',
 206:'This exact passage is from the appended held RED-only Task23handoff. The same report separately retains later amended implementation tree3397ea3c23392a9b6b0cf004b7c8a54bf9830067 with actual real-collector four unchanged-product reentries/later-product membership; current Task4selector has its own reviewed composition. Keep original held NOTfixed statement true for its old source, not an eternal new code defect or a retrospective GREEN.',
 209:'The original stoppedPID29238had unavailable command and possible overlap with read-only Git capture. Preserve uncertain attribution; do not call it a test leak, prove historical no-process inventory, or require an invented baseline. Actual current R2cleanup observation remains separately required.',
}

def sourceFamily(x):
 s=x['exactOriginalRef']['source'];txt=x['exactOriginalRef']['text']
 return s.rsplit('/',1)[-1],txt
def qualificationBasis(x):
 n=int(x['id'].split('-')[1]);name,txt=sourceFamily(x)
 if n in specific:return specific[n]
 if x['proposedFindingAcceptance']['effect']=='nonblocking':
  return x['sourceSpecificBasis'].split(' Original independently interpreted passage:')[0].split(' Current acceptance effect only:')[0]
 # Caller-assigned assessments are explicit obligations, retained under the actual existing IDs.
 # The original source is a dated local evidence statement rather than a second mandatory run.
 return (f'The exact original {name} passage delegates or limits its local evidence for '+', '.join(x['criteria'])+'. '
         'It is retained as a source-specific historical caller-assessment qualification. The current mechanisms and observed scenarios for those criteria are listed below; current final suite/review, representative-assessment and reserved human requirements remain independently mandatory in the existing root requirements. '
         'This proposal does not convert that historical pending statement into a repaired code defect, infer its old outcome, require recreating an absent original wrapper, or treat task-local success as acceptance.')

updates=[];candidates=[];proposals=[]
for x in priorNew:
 orig=x['exactOriginalRef'];id=x['id'];isRepair=id in repairBy
 ev=list(dict.fromkeys(sum([profiles[k][1] for k in x['criteria']],[])))
 originalWork=(initialBy if x['priorWork']['artifact']=='prior-initial' else deltaBy)[x['priorWork']['id']]
 qbasis=qualificationBasis(x)
 if isRepair:
  rp=repairBy[id];histkeys=rp.get('historicalEvidenceKeys',[])
  concrete=[]
  for k in histkeys:
   if k in history:concrete.append(history[k]['priorEvidence']['basis'])
  basis=rp['basis']+' Concrete named repair/verification support: '+' '.join(concrete) if concrete else rp['basis']
  if id in ['new-081','new-085']:
   basis+=' The earlier bounded review left super-plan-8fn status unobserved. That uncertainty is now narrowly superseded by the actual parent-read blocker-status receipt: CLOSED, reason resolved by task super-plan-ufz.6 merged. It supplies no root acceptance or other tracker outcome.'
   ev.append('blocker-status')
  basis+=' Exact original appearance remains preserved; this candidate applies only to its demonstrated scenario. Current criterion/final checks retain separate scope.'
  histkeys=rp.get('historicalEvidenceKeys',[])
  for k in histkeys:
   if k in history:ev.append('historical:'+k)
   elif k in deltaProof['evidence']:ev.append('delta:'+k)
  if id=='new-210':ev+=['task8.4-criterion-repair','phase2']
  candidate={'ref':ref(orig),'disposition':'resolved','judgment':'supported','basis':basis,'evidence':[str(O/'evidence-catalog.json')+'#'+k for k in dict.fromkeys(ev)],'verification':rp['verification']+(' Exact retained executed basis: '+' '.join(concrete) if concrete else '')}
  candidates.append({'id':id,'exactOriginalRef':orig,'candidateRecord':candidate,'status':'supported semantic candidate; parent must independently adopt, no canonical disposition applied','remainingAdoptionDependencies':pendingGlobal[:2],'noIdentityLinkApplied':True})
  acceptance={'ref':ref(orig),'judgment':'supported','effect':'required','requirement':x['criteria'][0],'basis':'Before the exact supported disposition is adopted, this concrete defect appearance remains required. Proposed repair support: '+basis,'evidence':candidate['evidence']}
 else:
  basis=qbasis+' The original occurrence stays outstanding and visible; this relevance qualification supplies no finding resolution/rejection. Actual current required checks are retained through '+', '.join(x['criteria'])+' and final-review/final-suite, with any actual reserved human decision separate.'
  acceptance={'ref':ref(orig),'judgment':'supported','effect':'nonblocking','basis':basis,'evidence':[str(O/'evidence-catalog.json')+'#'+k for k in dict.fromkeys(ev)]+[x['sourceRawEvidence']['rawArtifact'],str(P/'new213-exact-ref-relevance.json')+'#'+id]}
 updates.append(acceptance)
 proposals.append({'id':id,'exactOriginalRef':orig,'sourceRawEvidence':x['sourceRawEvidence'],'sourceKind':x['sourceKind'],'originalHistoricalOutcome':x['originalHistoricalOutcome'],'registeredAdapterVerdict':x['registeredAdapterVerdict'],'priorWork':x['priorWork'],'priorSourceSpecificBasis':x['sourceSpecificBasis'],'priorFindingAcceptance':x['proposedFindingAcceptance'],'criteria':x['criteria'],'sourceSpecificJudgment':basis,'currentCriterionMapping':[{'id':k,'originalRequirement':reqs[k],'actualCurrentBehavior':profiles[k][0],'evidenceKeys':profiles[k][1],'observedRepresentativeCases':profiles[k][2],'measurementAndInterpretationLimits':profiles[k][3]} for k in x['criteria']],'proposedFindingAcceptance':acceptance,'candidateSupportedDisposition':candidate if isRepair else None,'adoptionRoute':'Assess and append exact supported repair disposition; required finding then clears structurally, independent root criteria remain mandatory.' if isRepair else 'Adopt narrow nonblocking historical/contract relevance while retaining real current criteria and all original occurrence text/history. No disposition.','remainingDependencies':pendingGlobal[:2]+(['Actual source-specific caller evidence must satisfy named existing root requirements; no source silence substitutes.'] if not isRepair else []),'projectionOriginalMemberRefs':x.get('projectionOriginalMemberRefs',[]),'proposalOnly':True,'canonicalApplied':False,'noIdentityLinkApplied':True,'finalAcceptanceEstablished':False})

oldQualification={
9:'This old source separates replay and caller behavior/measurement evidence. Current primary/supplemental real model decisions and actual helper phases now supply named bounded evidence; final suite/composition remain actual root requirements. It is no second code defect.',
10:'Native Linux coverage, hosted Workflow and live no-change historical gaps remain qualifications. Hafter-only5/5does not regrade oldB4; macOS actual helpers and replay do not prove nativeLinux or hosted execution. No new hosted/platform requirement is invented.',
11:'Old simulated transcripts did not establish live ordinary/tracker operation. G/Hcurrent textual decisions and real controlled helpers supply separate bounded evidence; authoritative current tracker/run reconciliation remains the caller duty, not an invented old baseline.',
12:'The old review validated only a scenario document. Current actual model responses and phases1/2provide executed evidence for selected scenarios, while whole-branch acceptance remains separate.',
13:'Independent report interpretation is now represented by K/feedback named actual decisions; no metric improvement is claimed. Required R14/R15/finalreview/finalsuite remain independently enforced.',
14:'The old collector/assembly fixture did not run a complete coordinator or hosted path. Current focused runtime, actual helper and representative model evidence have their own exact scope; final combined suite is not inferred from the historical fixture.',
15:'The old not-ready review never satisfied final review and leaves closing supplied no substitute. Actual current final source review and suite remain explicit existing requirements; dated pending evidence is not a newly persistent product defect.',
18:'The old5,587file/~1.1Mline review was incomplete. Retained whole-scope partition review, clean Task1–6and eleven-path delta review are the actual current composition inputs. This proposal does not assert every historical artifact line semantically reviewed or waive current whole-branch review.',
19:'The exact old690provenance gaps remain immutable historical source qualifications. Task4bounded review provides zero omissions and no archival certification; current exact population reconciliation does not erase unknown historical provenance. RequirementR1reviews stable code, not invented retrospective wrapper repair.',
20:'The old deferred suite/live/process/platform omissions remain true for that source. The current owner has prospective47commands+2TMPDIRconfigs; actual controlled phases1/2and representative text decisions are distinct evidence, and final actual suite remains mandatory.',
21:'Original snapshot absence and actual reserved decisions stay explicit. Current root owner must preserve source-bound measurement/review/dispositions and phase7human choice; this historical scope note cannot create extra approvals or infer old unknown state.',
22:'Preserve original deferred behavior/platform/fixture teardown concern. Concrete historical fixture cleanup has separate attributed repair evidence, current D/Nmodel behavior is bounded, and actual final parent cleanup remains unknown; neither source silence nor report label clears resources.',
23:'The old cluster fixture had no prior findings and could not exercise continuity. Actual phases1/2now use prior Mustfix/Deferred/Untested refs, silent retry, exact repair and still-open controls. That new executed counterpart does not rewrite the old fixture population.',
24:'Original live-sim/dryRun/fake-signal fixtures remain simulated mechanics. New real model decisions and actual controlled helper executions add named evidence without turning those old transcripts into hosted/ordinary runtime events.',
25:'Original deterministic retention and empty-prior cluster evidence did not complete fresh continuity examples. Ctext plus actual phases1/2now demonstrate original-finding retention, exact supported repair and three remaining obligations. No exhaustive allagent/bothpath certification or real taskreview no-test execution is asserted.',
26:'Historical artifact partitions were never current whole-epic acceptance. Current product/fix review and47suite/behavior/helper composition have explicit owners and remain independent; every original unknown and uncertain match remains preserved.',
}
for x in priorOld:
 n=int(x['id'].split('-')[-1]);orig=x['exactOriginalRef'];id=x['id'];isRepair=n in oldRepairs
 if isRepair:
  title,b,*ev=oldRepairs[n];basis=b+' This exact original group is judged using the substantive source path/scenario, concrete diff and actual focused results; no display-key or silence inference. All original explicitly linked group member refs remain preserved.'
  candidate={'ref':ref(orig),'disposition':'resolved','judgment':'supported','basis':basis,'evidence':[str(O/'evidence-catalog.json')+'#'+k for k in ev],'verification':'Concrete source-pinned corrective diff, actual RED/GREEN/focused command receipts and clean scoped independent re-review establish this scenario. Final whole-source47suite/configuration and independent global composition remain adoption dependencies.'}
  candidates.append({'id':id,'exactOriginalRef':orig,'candidateRecord':candidate,'status':'supported semantic candidate; parent adoption pending','allOriginalGroupOccurrences':x['allOriginalGroupOccurrences'],'remainingAdoptionDependencies':pendingGlobal[:2]})
  acceptance={'ref':ref(orig),'judgment':'supported','effect':'required','requirement':x['criteria'][0],'basis':'Keep concrete finding required until its supported exact-ref disposition is adopted. '+basis,'evidence':candidate['evidence']}
 else:
  basis=oldQualification[n]+' This changes acceptance relevance only; original source/group remains outstanding and the named current acceptance requirements stay mandatory.'
  ev=['final-wave-review','task6-round2-review','phase1','phase2','primary-grade','supplemental-grade','m-assessment','n-grade','final-suite-plan']
  acceptance={'ref':ref(orig),'judgment':'supported','effect':'nonblocking','basis':basis,'evidence':[str(O/'evidence-catalog.json')+'#'+k for k in ev]+[str(P/'old26-required-group-mappings.json')+'#'+id]}
 updates.append(acceptance)
 proposals.append({'id':id,'exactOriginalRef':orig,'criteria':x['criteria'],'priorFindingAcceptance':x['proposedFindingAcceptance'],'sourceSpecificJudgment':basis,'currentCriterionMapping':[{'id':k,'originalRequirement':reqs[k],'actualCurrentBehavior':profiles[k][0],'evidenceKeys':profiles[k][1],'limits':profiles[k][3]} for k in x['criteria']],'proposedFindingAcceptance':acceptance,'candidateSupportedDisposition':candidate if isRepair else None,'allOriginalGroupOccurrences':x['allOriginalGroupOccurrences'],'remainingDependencies':pendingGlobal[:2],'proposalOnly':True,'canonicalApplied':False,'noIdentityLinkApplied':True,'finalAcceptanceEstablished':False})

# Preserve exact historical proof catalogs and augment the actual Task8.4 criterion fix evidence.
E['historicalRepairEvidence']={'artifact':'/private/tmp/ufz-correction-legacy-relevance/historical-evidence-rebinding.json','evidence':history,'limits':'Historical executed results remain bound to their old trees; no source-specific repair claim inferred from FIXED/DONE labels.'}
E['deltaRepairEvidence']={'artifact':'/private/tmp/ufz-correction-legacy-relevance/revision2-delta/source-bound-evidence.json','evidence':deltaProof['evidence'],'limits':'13complete historical finding/repair appearances retain exact supporting commands; two structured concerns remain separate.'}
for k,v in history.items():E['historical:'+k]=v
for k,v in deltaProof['evidence'].items():E['delta:'+k]=v
task84=[]
for file in ['settled-tree.json','settled-tree-after-roast-1.json']:
 p=RUN/file;d=j(p);a=d if isinstance(d,list) else d.get('tasks',d.get('issues',[]))
 x=next(x for x in a if x['id']=='super-plan-ufz.8.4')
 task84.append({'path':str(p),'sha256':sha(p.read_bytes()),'id':x['id'],'description':x['description']})
p=RUN/'task-report-history-r1/raw/task-13-report.md';lines=p.read_text().splitlines()
E['task8.4-criterion-repair']={'kind':'exact source contrast and retained actual command output','beforeAndAfter':task84,'actualVerification':{'path':str(p),'sha256':sha(p.read_bytes()),'sourceHead':'ee4f3cfcd20a6eb8ada40f32e821dbbd6895630b','lineStart':5,'lineEnd':81,'text':'\n'.join(lines[4:81])},'limits':'Original source wording and verdict retained; no retroactive modification of settled-tree.json or automatic grouping.'}

# Native review observations are not legacy adapter sources. Preserve all eight explicit chains.
native=[]
for id,title,sourceReport,heading,ev in [
 ('runtime-R1','Invalid compact Recovery loses admission constraint','runtime-review.md','R1',['current-recovery-admission','current-hold-enforcement','wave-r1']),
 ('runtime-R2','Unplanned routing bypasses fresh admission','runtime-review.md','R2',['current-newwork-admission','current-capacity-verification','wave-r2']),
 ('SR1','Null-seam generated report rejected by strict extraction','source-review-report.md','Important / SR-1',['current-stub','wave-sr1-h1']),
 ('A1','Complete declared final-review keys population falsely rejected','acceptance-review.md','A1',['current-population','wave-a1']),
 ('A2','Read-only status/acceptance skip recovery history validation','acceptance-review.md','A2',['current-shared-history','current-status-history','wave-a2']),
 ('runtime-R3','Top-level cleanup contract only describes2arrays','runtime-review.md','R3',['current-four-cleanup-arrays','n-grade','n-parent-verification']),
 ('H1','Optional writer guard test permits unexecuted guard','harness-review.md','Minor / writer guard execution',['wave-sr1-h1','final-wave-identities']),
 ('H2','Liveness observer treats diagnostic denial as absence','harness-review.md','Minor / liveness observer',['wave-h2','wave-replay'])]:
 native.append({'id':id,'title':title,'originalNativeReport':str(Path('/private/tmp/ufz-correction-final-source-review')/sourceReport),'originalNativeSection':heading,'judgment':'supported addressed within reviewed eleven-path final-wave scope','basis':'Concrete correction and retained actual focused result assessed in independent complete final-wave re-review; original finding severity/source remains unchanged.','evidence':ev+['final-wave-report','final-wave-review'],'source':SOURCE,'remainingDependencies':pendingGlobal[:2],'canonicalLegacyRefCreated':False,'legacyPopulationAdded':False})
put('native-review-assessments.json',{'proposalOnly':True,'nativeFinalWaveCount':8,'observations':native,'correctiveTaskChains':[{'task':i,'reports':[str(O/'retained-evidence'/f'task{i}-report.md'),str(O/'retained-evidence'/f'task{i}-review.md')],'scope':'Source-pinned native corrective report/review chain, not formal new roast invocation population or legacy adapter.'} for i in range(1,6)]+[{'task':6,'reports':[E['task6-report']['retained'],E['task6-round2-review']['retained']],'scope':'Original7b18R1/R2repair2091andnewR3repair9e4; history and failed draft retained. No new legacy refs.'}]})

put('exact-ref-proposals.json',{'schemaVersion':2,'proposalOnly':True,'inspectionSource':SOURCE,'finalDocsSource':FINAL,'newRefs':213,'oldRequiredGroups':26,'exactRefProposalCount':239,'proposals':proposals,'byExactRef':{rkey(x['exactOriginalRef']):x['id'] for x in proposals}})
put('candidate-supported-dispositions.json',{'proposalOnly':True,'schema':'Existing approvals finding-disposition record; no application and no root acceptance snapshot','adoptionRule':'Parent independently inspect exact scenario/source/verification, final product equality and actual final checks. Apply only supported candidates; later review silence/criterion pass never supplies another ref disposition.','candidateCount':len(candidates),'candidates':candidates})
put('candidate-findingAcceptance-updates.json',{'proposalOnly':True,'schema':'Existing root-acceptance.findingAcceptance entries only; not a snapshot','adoptionRule':'Concrete defect refs remain required before supported disposition; nonblocking qualifications preserve current checks through actual named root requirements. A required entry never auto-clears merely when a criterion passes.','updates':updates})
qualification['currentProposalSource']=SOURCE
qualification['retainedPriorMappingScope']='The full29supplement35qualification records below are the prior7b18proposal rendition, retained verbatim for attribution. Its old current-code/pending-stage wording is historical. currentCriterionUpdates and criterion-judgments.json provide this proposal current491mechanism/evidence assessment; original qualifications/outcomes are not rewritten.'
qualification['preservationRule']='Original29supplements35sourcegaps/fiveunknown historical outcomes are retained verbatim. Current mechanism/behavior evidence is separate; no empty[] or changed original outcome inferred.'
qualification['currentCriterionUpdates']={k:{'behavior':v[0],'evidenceKeys':v[1],'limits':v[3]} for k,v in profiles.items()}
put('historical-qualification-map.json',qualification)
diff=git('diff','--name-only',SOURCE,FINAL).decode().splitlines()
sourceEquality={'sourceHead':SOURCE,'sourceTree':git('rev-parse',SOURCE+'^{tree}').decode().strip(),'finalHead':FINAL,'finalTree':git('rev-parse',FINAL+'^{tree}').decode().strip(),'changedPathCount':len(diff),'nonDocsChangedPaths':[p for p in diff if not(p.startswith('docs/') or p.startswith('.superpowers/'))],'frozenPaths':source}
put('evidence-catalog.json',{'inspectionSource':SOURCE,'evidence':E,'frozenSourceEquality':sourceEquality,'priorInputReads':inputs,'historicalReadMethod':'Full previous attributed proposals and relevant current contract read; unchanged broad historical corpus interpretations reused with provenance. Only Task8.4 original/after criterion and specific structured Task19/20/heldTask23 passages freshly revisited; no new comprehensive raw reread claim.','testsExecutedByThisTask':False})
put('remaining-dependencies.json',{'proposalOnly':True,'currentRequired':pendingGlobal,'specificLimits':{'materialM':'after_2 MFAIL remains and is not converted into PASS; independent assessment found no source defect.','oldB4':'AFTER0PASS2FAIL3AMB unchanged; newH5/5after-only cannot regrade it.','historicalSourceGaps':35,'unknownOriginalVerdicts':5,'supplementaryQualifications':29,'noHostedOrNativeLinuxClaim':True,'initialAcceptanceSnapshot':'Missing before code; late checkpoint remains historical limitation.'},'obsoleteInitialRefs':delta['obsoleteReplacedRefs'],'allCurrentCriteriaRetained':[c['id'] for c in criteria]})
projection=j(P/'retained-evidence/projection.json')
projectedRefs={rkey(o['ref']):g for g in projection['findings'] for o in g.get('occurrences',[]) if 'ref' in o}
# Some projection forms put the exact occurrence fields directly in the occurrence object.
for g in projection['findings']:
 if 'ref' in g:projectedRefs[rkey(g['ref'])]=g
 for o in g.get('occurrences',[]):
  if all(k in o for k in ['source','section','position']):projectedRefs[rkey(o)]=g
membership=[{'id':x['id'],'found':rkey(x['exactOriginalRef']) in projectedRefs,'outstanding':projectedRefs.get(rkey(x['exactOriginalRef']),{}).get('outstanding')} for x in proposals]
assert all(x['found'] and x['outstanding'] for x in membership),[x for x in membership if not x['found'] or not x['outstanding']]
rawIntegrity=[]
for p in {x['sourceRawEvidence']['rawArtifact']:x['sourceRawEvidence']['sha256'] for x in priorNew}.items():
 path,expected=p;actual=sha(Path(path).read_bytes());rawIntegrity.append({'path':path,'expectedSha256':expected,'actualSha256':actual,'matches':expected==actual})
assert all(x['matches'] for x in rawIntegrity)
put('integrity-check.json',{'proposalOnly':True,'method':'Read-only data/ref/hash consistency checks; no product suite/test invoked, no fresh broad semantic source reread claimed.','projectionOriginalRefMembership':membership,'originalRawIntegrity':rawIntegrity,'priorInputsUnchanged':[{'path':x['path'],'matches':sha(Path(x['path']).read_bytes())==x['sha256']} for x in inputs]})
audit={'proposalOnly':True,'newExactRefs':len(priorNew),'oldGroupRefs':len(priorOld),'total':len(proposals),'uniqueExactRefs':len({rkey(x['exactOriginalRef']) for x in proposals}),'candidateSupportedDispositions':len(candidates),'preDispositionRequiredCount':sum(x['effect']=='required' for x in updates),'nonblockingQualificationCount':sum(x['effect']=='nonblocking' for x in updates),'remainingExistingNonblockingHistoricalGroups':220,'oldCanonicalGroups':469,'registeredAppearances':486,'currentlyOutstandingGroupsIncludingOtherSections':sum(bool(g.get('outstanding')) for g in projection['findings']),'alreadySupportedRepairedGroups':projection['metrics']['repaired'],'actionableOutstandingMetric':projection['metrics']['outstanding'],'otherSectionGroups':projection['metrics']['otherSectionGroups'],'newLegacySourcesOrLinksCreated':0,'nativeFinalWaveObservationsAssessedSeparately':8,'finalSuitePassClaimed':False,'actualRootEligibilityClaimed':False,'canonicalMutation':False,'allSourceEqualityChecks':all(x['sameAtFinalDocsCommit'] for x in source.values()),'historicalQualificationCounts':qualification['counts']}
assert len(proposals)==239 and audit['uniqueExactRefs']==239 and len(updates)==239
assert not sourceEquality['nonDocsChangedPaths'] and audit['allSourceEqualityChecks']
assert {rkey(x['exactOriginalRef']) for x in proposals[:213]}=={rkey(x['exactOriginalRef']) for x in priorNew}
for x in candidates:
 c=x['candidateRecord'];assert c['judgment']=='supported' and c['basis'] and c['evidence'] and c['verification']
assert all(len(x['evidence'])>0 and x['basis'] for x in updates)
put('adoption-audit.json',audit)
report=f'''# Exact-ref criterion and disposition proposals

Proposal only, inspected product {SOURCE}; final docs source {FINAL}. All {len(diff)} intervening changed paths are documentation/run evidence, and every frozen product file remains byte-identical. No canonical record, source/index/HEAD, tracker, Herdr, process or test execution was changed by this work.

The 239exact-ref records preserve213new appearances (189interpreted24strict) plus26old required groups. Original source IDs, section/position refs, key/text, raw hashes/mappings and existing group members remain. Prior initial199 and revision2delta work is reused with full attribution; no broad historical reread is claimed. The original initial adapter hash ec52ee50d9e0ed8b666db30e4b5014eacd0d00243518796242da020e68f19ca0 and corrected revision2 hash c04593efb7ffd0b9414222ee39c1337e1b3e5d2722356d11fe2de0dfd5e7b9ee remain unchanged. Old replaced Task15illustrativeJSON and Task16blocker-only refs are obsolete/unadoptable; their actual qualifier/blocker obligations remain preserved.

There are {len(candidates)} supported-disposition candidates with exact original refs, concrete source/repair evidence and verification statements. These remain required before adoption; after a supported exact disposition the structural group clears without expecting a criterion pass to erase it. The other {audit['nonblockingQualificationCount']} records propose individual nonblocking relevance for historical scope, measurement limitations, semantic contract ownership or dated caller-pending statements. Those occurrences remain outstanding; their real current obligations stay mandatory under R1–R15/final-suite/final-review and the reserved human gate. This is not an exemption for new history and no candidate is automatically applied.

The retained projection has 469 total groups: 10 already supported repairs and 459 outstanding groups, including 11 other-section groups. Its narrower actionable-outstanding metric is 448. The 239 proposals plus 220 unchanged existing nonblocking groups cover those 459 outstanding groups; these counts do not identify 459 independent defects.

The defect candidates include the10old concrete corrective/policy-seam groups; separately attributed historical repairs retain actual named trees/commands. Structured Task19andTask20findings receive their own scenario-bound proof without linking them to prose. The original Task8.4contradictory criterion has exact before/after wording and actual Task13external-fix-removal assertion support. Historical2294/1, Task23heldNOTfixed and strictB4AFTER0/2/3remain their original outcomes, not retroactively passing measurements.

criterion-judgments.json assesses originalR1–R15 and both existing continuity/representativeness assessments against actual current behavior. Task6typed closure/acknowledged settlement and separate historical attempt changes supersede the old7b18classification claims. The independent final fix re-review clears the eight native final-wave observations within its eleven-path scope; native corrective chains remain separate from the legacy486appearance/469group population, with no invented new roast population. The prior220nonblocking historical groups are not re-adjudicated.

Actual continuity phases1/2 use the complete frozen491four-helper closure and a controlled real caller. Original null recovery, immutable replay and silent retry preserve4refs; an actual one-line committed counter repair passes the unchanged original criterion and supports precisely1disposition. The other3refs remain outstanding and the actual fixture root gate stays ineligible for required review/human and unproven relevance. This provides real supported-disposition evidence without supplying production acceptance.

Behavior evidence remains qualified: primary afterA–F30/30 versus before28PASS1FAIL1AMB; G–M34/35withM4/5; Nafter-only5/5; feedbackbefore5/5after5/5. Same five after subjects produce correlated decisions. Mafter_2invented no missing work and remains a materialFAIL; independent assessment found no source-instruction defect. Correct sync/owner-adoption/failure-hold facets stay useful bounded evidence. HistoricalB4, nativeLinux gap, hostedWorkflow limitation, missing no-test/exhaustive alias exercise, unknown historical attribution and lack of a pre-code root snapshot remain explicit. No improvement, perfect compliance or40independent-trial claim.

The29supplements,35original source qualifications and fiveunknownoriginal verdicts are retained separately and verbatim. There is no empty[] substitution or invented retrospective baseline/owner/human outcome. Caller/review resources require fresh observation before deletion; no final cleanup is claimed.

Final47distinct suite entrypoints plus2TMPDIRconfigurations are prospective dependencies here. The parent must inspect actual source/config-bound receipts, compose the complete retained source reviews, judge representative sufficiency with MFAIL intact, reconcile actual Recovery/evidence/findings and apply only supported exact candidates. Final suite PASS, whole-branchREADY, actual root eligible and human acceptance are not asserted.

Files: exact-ref-proposals.json preserves all239 judgments; candidate-supported-dispositions.json contains reviewable append candidates; candidate-findingAcceptance-updates.json contains239relevance entries; evidence-catalog.json distinguishes current inspected source from prior executed receipts; historical-qualification-map.json retains29/35/five; native-review-assessments.json keeps8native observations separate; remaining-dependencies.json records unresolved duties. adoption-audit.json contains exact counts. No proposed record is a canonical snapshot.
'''
(O/'REPORT.md').write_text(report)
shutil.copyfile(__file__,O/'build_proposal.py')
print(json.dumps(audit,indent=2))
