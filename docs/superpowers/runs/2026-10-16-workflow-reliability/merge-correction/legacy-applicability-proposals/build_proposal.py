import json, hashlib, re, subprocess, shutil
from pathlib import Path
from collections import Counter

ROOT=Path('/private/tmp/ufz-correction-legacy-relevance')
INPUT=Path('/private/tmp/ufz-correction-legacy-adapters-initial')
HIST=Path('/private/tmp/ufz-correction-history-judgments')
WORK=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
FREEZE='87166167a4414189497d4b8877fdc44eb71e76a6'
RUN='docs/superpowers/runs/2026-10-16-workflow-reliability'
SPEC='docs/superpowers/specs/2026-10-16-workflow-reliability-design.md'
EXPECTED='ec52ee50d9e0ed8b666db30e4b5014eacd0d00243518796242da020e68f19ca0'
ROOT.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
def read(p):return json.loads(p.read_text())
def write(name,value):
 (ROOT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def blob(path):
 p=subprocess.run(['git','show',FREEZE+':'+path],cwd=WORK,capture_output=True)
 if p.returncode:raise RuntimeError(path+': '+p.stderr.decode())
 return p.stdout
assert sha((INPUT/'finding-source-record-proposals.json').read_bytes())==EXPECTED
records=read(INPUT/'finding-source-record-proposals.json')
history=read(HIST/'judgments.json')
qualifications=read(INPUT/'supplemental-qualifications.json')['qualifications']
gaps=read(INPUT/'unresolved-gaps.json')['gaps']
strict=read(INPUT/'original-strict-occurrences.json')

# Freeze the exact reviewed proposal and all original provenance in this output.
for relative in ['finding-source-record-proposals.json','supplemental-qualifications.json','unresolved-gaps.json',
 'original-strict-occurrences.json','pending-obligation-accounting.json','reversible-manifest.json',
 'source-correspondence-unsupported-gaps.json','validation-results.json']:
 dst=ROOT/'pinned-input'/relative;dst.parent.mkdir(exist_ok=True,parents=True);shutil.copyfile(INPUT/relative,dst)
for dirname in ['metadata','review-evidence','raw','existing-strict-json']:
 shutil.copytree(INPUT/dirname,ROOT/'pinned-input'/dirname,dirs_exist_ok=True)
shutil.copyfile(HIST/'judgments.json',ROOT/'prior-history-judgments.json')

criteria={}
for line in blob(RUN+'/coverage-round-1-requirements.md').decode().splitlines():
 m=re.match(r'(R\d+) (.+)',line)
 if m:criteria[m[1]]=m[2]
assert len(criteria)==15
contracts={
 'workspace':{'path':SPEC,'section':'1. Workspace and process safety','basis':'Stable captured revisions, isolated mutable outputs; unexplained caller changes are not attributed automatically. Cleanup preserves resources when process status is unknown.'},
 'recovery':{'path':SPEC,'section':'2. Scheduling and recovery','basis':'Preserve scoped holds, pending closure and deferred obligations; reconcile Git/tracker facts before admitting affected work. No historical scheduler reconstruction or universal automatic clear is required.'},
 'acceptance':{'path':SPEC,'section':'3. Evidence and acceptance','basis':'Implementation, review, measurement and acceptance are independent. Required live checks cannot be discharged by fallback. Verification-only reviewed evidence may require no commit; missing historical baseline remains a gap.'},
 'findings':{'path':SPEC,'section':'4. Finding continuity','basis':'Each occurrence remains until explicit supported disposition; uncertain matches stay separate; a success claim does not resolve a finding. The punch list is a projection, not a replacement database.'},
 'metrics':{'path':SPEC,'section':'5. Metrics and diagnosis','basis':'Supported partial observations, explicit discrepancies and unknown timestamps remain. Historical graph reconstruction is expressly not required; causal estimates must be qualified.'},
 'verification':{'path':SPEC,'section':'Delivery and verification boundaries','basis':'Focused deterministic fixtures, representative evaluations of changed instructions and cross-component checks; examples guide selection rather than requiring every agent to run every check.'},
}
routes={
 'behavior':{'criteria':['R15','R7'],'status':'pending/blocking','action':'Caller assesses representative actual merged changed instructions with source-bound fresh-agent evidence and existing qualified trials. Preserve strict B4 0 pass/2 fail/3 ambiguous and separate diagnostic arms; do not pool, regrade, or infer live workflow behavior from fixtures.'},
 'suite':{'criteria':['R15','R5'],'status':'pending/blocking','action':'After current selector/resume/cleanup/metrics repairs settle, execute and record the actual required final combined-source suite. Reconcile historical aggregate command/configuration separately; retain all failed/unavailable history and source/environment differences.'},
 'review':{'criteria':['R1','R7','R15'],'status':'pending/blocking','action':'Complete independent whole-epic review against the actual captured final source pair and accounted source population. Historical scoped CLEAN reviews and post-cap audit do not supply this coverage.'},
 'source-accounting':{'criteria':['R9','R10'],'status':'pending/blocking','action':'Parent reviews exact legacy source interpretations, complete item boundaries and supported correspondence/semantic judgments before registration. Retain strict24 and original strict failures; never manufacture a recognized historical verdict or infer emptiness.'},
 'selector':{'criteria':['R1','R9','R15'],'status':'pending/blocking','action':'Finish and verify current selector/provenance repairs and real continuation/membership behavior on the final source; retain original recursive failure and narrower fallback rejection separately.'},
 'resume':{'criteria':['R4','R15'],'status':'pending/blocking','action':'Finish and verify current resume interruption/re-entry repairs, with durable pending closures and holds intact, then independent final review.'},
 'cleanup-metrics':{'criteria':['R2','R12','R13','R15'],'status':'pending/blocking','action':'Finish the four current cleanup/metrics corrections and verify actual retained-resource/unknown outcomes and supported reconciled metrics. Old fixture passes do not certify these new repairs.'},
 'process':{'criteria':['R2'],'status':'pending/blocking','action':'Caller inspects final owned caller/review roots, reports stopped/surviving/unknown/kept accurately and retains resources needed by surviving or unverified owned processes. Do not invent retrospective global process absence or old PID attribution.'},
 'semantic-evidence':{'criteria':['R5','R8','R10'],'status':'pending/blocking','action':'Owning reviewer judges exact source role, command/configuration, chronology, same-failure correspondence and concrete fix support. Preserve missing run-baseline and conflicting histories as gaps; no guessed baseline/owner or structural oracle.'},
 'human':{'criteria':['R7'],'status':'pending/blocking','action':'Retain existing human phase-7 finish/branch decision and root acceptance ownership until explicitly exercised; implementation authorization and leaf closure do not replace them.'},
}
taskcriteria={1:['R1'],2:['R2'],3:['R3'],4:['R4'],5:['R5'],6:['R14'],7:['R11'],8:['R9'],9:['R9'],10:['R8','R5'],11:['R4'],12:['R6'],13:['R9','R10'],14:['R9','R10'],15:['R12','R13'],16:['R7'],17:['R1','R2','R6','R15'],18:['R5'],19:['R4','R6'],20:['R4','R9'],21:['R9','R7'],22:['R9'],23:['R1','R9'],24:['R9'],25:['R15'],26:['R1'],27:['R14'],28:['R1'],29:['R2']}
taskfocus={1:'stable review source and isolated mutable outputs',2:'truthful process cleanup and retained resources',3:'fresh admission and authoritative external dependency observations',4:'durable Recovery facts and explicit clears',5:'source/command/configuration/outcome evidence classification',6:'planning, unknown readiness and concurrency interpretation',7:'exact process-class aliases without defect or severity pooling',8:'immutable invocation artifacts and interrupted-invocation continuity',9:'complete source extraction with unsupported/malformed input gaps',10:'run-introduction ownership distinct from task-base exoneration',11:'durable resume reconciliation and confirmed closure append',12:'reviewed verification-only completion without artificial commits',13:'outstanding-finding projection and semantic dispositions',14:'settled immutable source collection, routing and status',15:'partial, reconciled source observations and distinct metric units',16:'caller-owned root acceptance and nonblocking relevance',17:'integrated evidence and qualified behavior/suite results',18:'check-evidence classification across ordinary and Workflow callers',19:'oversized Recovery transport and distinct re-entry scenarios',20:'strict operational startup and compatible ordinary builder initialization',21:'retained archive hash validation at acceptance',22:'complete finding projection on piped stdout',23:'captured-source generated-input selection and full-range review continuity',24:'source path containment composed with independent input selection',25:'portable trailing-slash TMPDIR fixture behavior',26:'captured source binding and refusal of unsettled output reuse',27:'historical profiler qualification without causal reconstruction',28:'lossless historical live-review artifact retention',29:'cleanup-aware finish/reporting without dropping retained resources'}
def task(source):
 m=re.search(r'/task-(\d+)-',source)
 return int(m[1]) if m else None
def base_criteria(source):return taskcriteria.get(task(source),['R9','R10'])
def ref(source,o):return {'source':source,**{k:o[k] for k in ['section','position','key','text']}}

# Exact static rebinding of prior evidence. This is inspection, not test execution.
rebound={}
for name,e in history['evidence'].items():
 refs=[]
 for original in e['references']:
  b=blob(original['path']);text=original['text'].encode();start=b.find(text)
  assert start>=0,(name,original['path'])
  refs.append({'originalReference':original,'inspectionRevision':FREEZE,'inspectionFileSha256':sha(b),
    'exactTextPreserved':True,'matchCount':b.count(text),'byteStart':start,'byteEnd':start+len(text),
    'lineStart':b[:start].count(b'\n')+1,'lineEnd':b[:start+len(text)].count(b'\n')+(0 if text.endswith(b'\n') else 1)})
 rebound[name]={'priorEvidence':e,'currentExactSpanInspection':refs,'testsExecutedByThisTask':False,
  'limits':'Historical executed results remain tied to their original recorded trees; exact text survival is current static inspection only. Neither is final-tree suite, behavior, cleanup or independent-review acceptance.'}
write('historical-evidence-rebinding.json',rebound)

history_by_id={x['id']:x for x in history['appearances']}
oldmap={16:'H01',27:'H02',28:'H03',37:'H04',52:'H05',53:'H06',64:'H07',65:'H08',73:'H09',78:'H10',84:'H11',94:'H12',95:'H13',128:'H14',142:'H15',148:'H16',153:'H17',167:'H18',168:'H19',169:'H20',170:'H21',171:'H22',172:'H23',173:'H24',174:'H25',175:'H26'}
new_evidence={4:'contradiction',12:'contradiction',17:'closure',23:'closure',25:'diagnostic',54:'retry',60:'retry',85:'builder',87:'builder'}
new_basis={
 4:'This source explicitly describes verification-only b/live/pass overriding retained b/live/fail with omitted observed. The same source records the whole-history contradiction repair and 1981/0 replay; cited current reducer/fixture spans preserve that exact route.',
 12:'The appended passage repeats the concrete verification-only contradiction inside this original report. Its explicitly named task-10 fix records the history-aware guard and source-bound 1981/0 replay. This appearance stays independent of the fix-report and review occurrences.',
 17:'The same fix report identifies initially open associated bead, successful close, null/false ledger append, and premature obligation reduction; its recorded RED 2086/4 then GREEN 2090/0 and current partial-close confirmed-append code address those conditions.',
 23:'The appended fix in this original report expressly identifies partial-close confirmClosure before ledger durability. Separate fix-report verification names that exact path and retained-original-on-failed-append assertions. No unrelated resume interruption claim is covered.',
 25:'This report explicitly names sibling97ee30a1 diagnostic schema fields and the failing exact-obligation fixture. Its subsequent fixture-only correction supplies command/configuration and complete identity-matching task/dispatch/claim/evidence history; source-bound2124/0 replay and static current fixture support the bounded repair. The reference to task-11-review-seam.md is not automatically equated with round-1.',
 54:'The original text explicitly references task15-review Important independent-source observations. Its own correction records coherent review-pair selection and independent Git/ledger retention, executed39/0 focused and2191/0 full replay. Later rebased2263/0 and current exact reducer spans retain support; no key matching used.',
 60:'The appended assertion explicitly names task15-review Important and the bounded ledger retry. Source-local fix and post-rebase report retain alternating independent-source tests and coherent-pair guard, with executed2263/0. This source appearance remains independent of the fix-only report.',
 85:'Original dispatch-text exit1 and missing impl output are retained failures. The same report later gives the startup/builder separation at committed633c351b/treee074a184, actual unchanged dispatch suite success, startup16 and real CLI126; current loader returns before operational Resume. No run-start or task-base pass is inferred.',
 87:'This source names dispatch-text loadBuilders executing startup while null-returning and omitting identity for nonreview modes. Its later explicit fix separates internal extraction from live startup and preserves legacy identity-free nonreview building; same-source actual dispatch/startup/CLI results support that seam only.',
}

# Every scope-only row has an individual contract basis and bounded reason.
scope={
10:('verification','Synthetic tree identities and canned live-kind records are fixture evidence, not actual live product measurements. Keep them as mechanics evidence; representative behavior and final suite remain separate required routes.'),
56:('metrics','The JSON explicitly describes a retained-source fixture population of3 sources/7 occurrences/5 findings. It is neither a real run total nor an additional defect. R12/R13 still require current supported metrics.'),
74:('verification','This review limits itself to historical20/23, refreshed six, exact-source standalone packaging, strictB4 and live-isolation caveats. It supplies no final phase6 pass; those historical outcomes remain untouched.'),
82:('workspace','Native Linux /proc was not observed on the macOS seat. The approved contract requires truthful supported cleanup behavior and representative verification, not a new mandatory retrospective Linux-host run.'),
98:('findings','The report bounds this task to saved-file integrity; source symlink containment belonged to the independent.27 task. Current composition remains reviewable under R9, without retroactively making this source claim that work.'),
100:('findings','This review describes source-local hash/inventory checks, preserves no-work null semantics, and expressly excludes ancestor containment. Current full acceptance and current transition repairs remain separate; no global all-clear follows.'),
103:('acceptance','Local RED/GREEN transport evidence establishes the piped-output case, without measured run-start baseline or other owner attribution. Missing attribution stays unknown; the contract forbids inventing it.'),
107:('findings','The source-path review explicitly says separate.26 selection was absent and not assumed. That is truthful scoped coverage, not a fresh defect or permission to omit final composition review.'),
108:('workspace','Component-wise source containment is inspected here; optional missing assembled trees are optional and required entries remain gaps. The approved minimal boundary does not promise broader privilege or adversarial concurrent-filesystem guarantees.'),
115:('metrics','This source lists a documentation-only historical qualification diff and expressly leaves profiler product code and.27 resources unchanged. R14 requires supported qualification, not unrelated product modification.'),
117:('metrics','Exact old dispatch/creation timestamps, null readiness/waits and residual edges remain observations. Approved§5 explicitly says historical graph reconstruction is not required; do not demand an invented historical enforcement proof.'),
118:('metrics','14h26m wait,83% no-agent time and5m planning remain bounded observations across named windows. Unknown cause is an acceptable explicit gap; no new causal diagnosis or parallelism remedy is required.'),
119:('metrics','The source labels residual-graph and dispatch-release assumptions and changes only historical interpretations. A source-bound native data comparison is appropriate; no product instruction behavior changed in this leaf.'),
133:('verification','This is an explicit static seam review with no tests run as instructed. Approved focused verification does not require each reviewer to duplicate suite execution; independent final review and final suite remain pending.'),
135:('verification','The reviewer assesses retained1900/0 command evidence at named214a28e8 source without rerun. Preserve that attribution; it does not create an extra required historical reviewer execution.'),
139:('verification','No-rerun static seam scope is explicit. The approved contract selects focused checks and does not require every reviewer to rerun tests. This historical review never supplies final-tree acceptance.'),
140:('verification','The reviewer explicitly ran no tests and cites implementer commands at immutable head. That is a scope limit, not evidence that final integrated checks passed or an instruction to reconstruct a retrospective reviewer run.'),
146:('verification','This bounded static seam review performed no tests or source/branch changes. Its scoped artifacts are review evidence only; the approved design does not add a per-reviewer test requirement.'),
149:('verification','The reviewer separates actual fixture CLI execution, simulated Workflow runtime and absence of live multi-agent evaluation. Preserve each kind; live representative behavior is routed separately and cannot be inferred here.'),
154:('verification','This passage assesses retained profiler-in-flight pass output at the historical head. No unexplained failure is claimed within that scope; final merged-source checks remain pending independently.'),
158:('verification','The seam JSON result describes test-diff/compact transport expectations and two parent-run commands. It does not establish fresh-agent semantic tagging or a new run-wide metric.'),
159:('verification','The reviewer cites retained2007/0 and digest/dispatch passes and explicitly ran no tests. Historical test plausibility is not final-tree execution; no retrospective duplicate reviewer run is required.'),
163:('verification','Historical isolated-environment1916/0 and dispatch summaries were log-inspected rather than rerun. The limit is honest and creates no separate mandatory reviewer execution.'),
166:('verification','This source reviews retained complete-mode extraction test evidence without rerun. Unsupported/truncated inputs remain gaps; source accounting and final integrated checks remain separate current obligations.'),
177:('verification','No hosted Workflow/live model execution by this implementer is an evidence-kind limit. Approved focused mechanics plus representative changed-instruction evaluation do not independently mandate a hosted end-to-end runtime run.'),
178:('workspace','Linux native /proc behavior was not observed on this macOS host. Preserve the platform limit; it is not an approved mandatory retrospective platform check. Current truthful cleanup and its final verification remain required.'),
182:('verification','17 selected hashes were rechecked and the profiler delta was separately recorded. This supports bounded historical source attribution only, without blanket equivalence or current final acceptance.'),
190:('findings','Ordinary reports and metadata may still exceed the assembler window, and the contract honestly reports capped/unavailable review rather than granting a filename-only exemption. Current selector refusal/coverage remains required; unbounded assembler capacity is not promised.'),
191:('findings','The source excludes unrelated redesigns of collector, transport, startup, cleanup and direct frozen-Git fallback. Those are separate contracts; no new obligation arises to redesign them in this historical leaf.'),
193:('findings','Historical bytes and the narrower explicitly rejected frozen-Git fallback materiality claim remain unchanged. This does not reject or repair recursive collection or current selector defects.'),
194:('findings','The held leaf disclaims production changes to separate.24/.29/.23/.32 contracts. This historical scope statement does not attest current integration; final composition review remains required.'),
197:('recovery','The original design review rejected a demand for an additional survivor-handling rule because preservation, uncertainty and reconciliation already constrain recovery. Keep the exact rejection; do not invent conflicting-workspace assumptions as a new mandatory mechanism.'),
198:('workspace','The original review rejected a universal review-invalidation policy: source-bound reviews and independent integrated measurements already have ownership. Keep the exact scoped rejection, while actual required final reviews remain pending.'),
199:('findings','The original review rejected automatic resolution inheritance as inconsistent with the already approved supported-disposition rule. Preserve the reasoning; later actionable occurrences still require supported individual accounting.'),
}

# Explicit primary routes, chosen after reading each source; not keyword matching.
route_override={
5:['semantic-evidence'],7:['semantic-evidence'],9:['semantic-evidence'],13:['semantic-evidence'],
19:['resume'],20:['resume'],30:['resume','review'],32:['semantic-evidence','behavior'],
39:['source-accounting'],40:['source-accounting','semantic-evidence'],41:['source-accounting','review'],42:['semantic-evidence'],
46:['suite'],47:['source-accounting','review'],49:['source-accounting','semantic-evidence','suite'],59:['cleanup-metrics','source-accounting'],
67:['semantic-evidence','review'],69:['resume','review'],76:['suite'],77:['suite','human'],
81:['behavior','suite'],89:['suite','review','human'],101:['semantic-evidence','suite','human'],102:['suite','review','process','human'],
105:['selector','review','suite'],106:['selector','review'],110:['semantic-evidence','review','human'],113:['suite','review'],
120:['behavior','suite','review','human'],121:['behavior','suite','review','human'],122:['behavior','review','suite','process','human'],123:['behavior','review','suite','process','human'],
124:['review','human'],125:['behavior','suite','review','process','human'],127:['behavior'],130:['behavior'],
132:['suite','review'],136:['resume','behavior'],137:['resume','suite','behavior'],138:['suite','behavior'],
145:['behavior','semantic-evidence'],155:['behavior','source-accounting'],157:['behavior','source-accounting'],162:['source-accounting'],
165:['source-accounting','suite','review','behavior'],179:['behavior','suite'],180:['behavior'],181:['behavior','process','review'],
183:['suite'],184:['suite','review','behavior','human'],185:['suite','resume'],186:['suite','review'],187:['behavior','suite','review','human'],
188:['resume'],189:['behavior','suite','review','human'],192:['selector','suite','review'],195:['process','review'],196:['source-accounting','review']}

proposals=[]
for s in records['records']:
 source=s['record']['source'];t=task(source);meta_path=INPUT/s['interpretationMetadata'];meta=read(meta_path)
 maps=meta.get('adapterOccurrenceMap',[])
 for o in s['record']['occurrences']:
  i=len(proposals)+1
  rawmap=next((x for x in maps if x['adapterSection']==o['section'] and x['adapterPosition']==o['position']),None)
  if rawmap is None:
   rawbytes=(INPUT/meta['rawCopy']).read_bytes();found=rawbytes.find(o['text'].encode())
   rawmap={'strictOriginalOccurrence':True,'rawByteStart':found if found>=0 else None,'rawByteEnd':found+len(o['text'].encode()) if found>=0 else None,
    'rawText':o['text'] if found>=0 else None,'originalLocatorEvidence':'Exact strict occurrence object retained. Full multi-line/list raw mapping remains in pinned interpretation metadata and original raw source; no synthetic strict remapping.'}
  p={'id':f'occurrence-{i:03d}','originalRef':ref(source,o),'originalSourceKind':s['record']['kind'],'originalSourceVerdict':s['record']['verdict'],
   'originalStatusProvenance':meta['originalCompactRecognition'],'originalRawArtifact':meta['originalArtifact'],'originalRawSha256':meta['rawSha256'],
   'exactRawMapping':rawmap,'interpretationMetadata':'pinned-input/'+s['interpretationMetadata'],'criteria':base_criteria(source),
   'contractFocus':taskfocus.get(t,'immutable occurrence accounting and supported disposition'),
   'proposalOnly':True,'canonicalApplied':False,'identityLinksApplied':False,'originalOccurrenceMerged':False,
   'requiredFinalEvidenceStillPending':True,'pendingRoutes':route_override.get(i,['behavior','suite','review','human']),
   'classification':'current-required-obligation','acceptanceEffect':'blocking until named current required evidence is supported; occurrence count is not independent defect count',
   'proposedDisposition':None,
   'basis':'This exact source retains caller-owned unfinished verification/acceptance or an operative cross-component contract. Map it to the named existing criterion; leaf success and historical scoped review cannot discharge the caller obligation.'}
  if i in scope:
   contract,reason=scope[i];p.update(classification='historical-or-scope-qualification',acceptanceEffect='nonblocking qualification only; original remains retained and outstanding without fake resolution',
     pendingRoutes=[],proposedDisposition=None,basis=reason,approvedContractBasis=contracts[contract],
     remainingCurrentRequirement='The linked criterion and global final routes remain pending independently; this qualification adds no retrospective or broader-platform obligation.')
  if i in oldmap:
   h=history_by_id[oldmap[i]];p['priorNarrowJudgment']=h;p['historicalEvidenceKeys']=h['evidenceKeys']
   d=h['proposedDisposition']
   if d=='open-deferred-evaluation':
    p.update(pendingRoutes=['behavior'],basis=h['currentApplicability'],criteria=sorted(set(p['criteria']+['R15','R7'])))
   elif d=='retain-historical-rejected':
    p.update(classification='historically-rejected-claim',acceptanceEffect='nonblocking exact historical rejection; no new disposition or blanket policy adjudication',proposedDisposition='retain-original-rejected-with-reason',pendingRoutes=[],basis=h['currentApplicability'])
   else:
    p.update(classification='bounded-historical-repair-proposal',acceptanceEffect='nonblocking only for this exact historical scenario if parent adopts the supported proposal; current final checks remain blocking',
     proposedDisposition=d,pendingRoutes=[],basis=h['currentApplicability'],
     evidenceDistinction='Concrete recorded historical repair and executed verification are retained in historical-evidence-rebinding.json; cited source/fixture spans still occur exactly at freeze87166167. No tests, model trials or cleanup were executed by this task.')
    if i==73:p['separateOutstandingGap']='super-plan-8fn tracker closure is not established by ancestry or this proposal; reconcile actual current tracker/bookkeeping under R4/R7.'
    if i==171:p['separateOutstandingGap']='The older recursion mechanism has historical repair evidence; current selector/provenance corrections and final continuation/coverage verification remain blocking via selector route.'
  if i in new_evidence:
   p.update(classification='new-historical-assertion-with-narrow-repair-proposal',proposedDisposition='supported-bounded-historical-repair-proposal',historicalEvidenceKeys=[new_evidence[i]],
    basis=new_basis[i],pendingRoutes=[],acceptanceEffect='nonblocking only for this separately attributed historical scenario if parent adopts the evidence judgment; current criterion/final checks remain pending',
    evidenceDistinction='Executed results are historical reports/logs at named tested trees. Current inspection proves only exact cited code/fixture survival at87166167. No final-tree or live-agent verification is claimed.')
  if i==31:
   p.update(classification='historical-baseline-assertion-current-evaluation-pending',criteria=['R6','R15'],pendingRoutes=['behavior','review'],
    basis='The actual frozen baseline report, claim-summary B4 and individual scores support3/5 installed-guidance failures versus0/5 controls. These bounded unblinded text decisions do not establish repaired behavior: strict AFTER remains0 pass/2 fail/3 ambiguous and the protocol-complete diagnostic is separate.',
    historicalEvidenceKeys=['no-change-baseline'],proposedDisposition=None)
  if i==116:
   p.update(classification='new-historical-assertion-with-narrow-qualification-repair-proposal',criteria=['R14'],pendingRoutes=[],proposedDisposition='supported-historical-claim-qualification-proposal',historicalEvidenceKeys=['historical-profile-qualification'],
    acceptanceEffect='nonblocking bounded historical interpretation repair only; unknown historical causal outcome remains unknown',
    basis='The source records executed comparison exit0 on treed807eeb58c5aefe49829da9e56d36cf16ee0f6a4, preserving1818 numeric leaves and22 raw subtrees while qualifying11 interpretation leaves. Frozen profile JSON still states diagnosis.dominant=unknown, simulation.verdict=inconclusive and explicit model-only/noncausal limitations. This repairs unsupported interpretation, not the unknowable historical dependency cause.')
  if i==56:
   p.update(classification='obsolete-initial-selection-not-adoptable',canonicalAdoptable=False,proposedDisposition=None,pendingRoutes=[],
    acceptanceEffect='not an adoptable finding/qualification occurrence; preserve exact failed initial proposal as contextual evidence',
    basis='Fresh independent adapter review F2 established this exact initial ref selects the illustrative JSON instead of the real population qualification. These example3-source/5-finding values supply no run metric or obligation. Do not register or map this obsolete ref as a qualification; the corrected version must separately select original bytes[5652,5840), line70, without changing this pinned record.',
    knownReviewDefect='F2 in adapter-review-known-failures.md; initial snapshot records SHA ec52ee50 retained.')
  if i==132:
   p['basis']='No live Workflow tool was available in this historical seat, and replay supplies standard timer APIs. Preserve that runtime/evidence limit; final existing-path mechanics and independent review remain required. No mandatory hosted-runtime run is invented.'
  if i==179:
   p['basis']='Hosted Workflow and actual ordinary coordination were not measured by this leaf, and synthetic live-kind smoke remains simulated. Required representative actual changed-instruction assessment and final mechanics suite remain pending; this source does not itself create a separate mandatory hosted end-to-end run.'
  if i==196:
   p.update(classification='historical-design-wording-finding-current-disposition-unresolved',criteria=['R10'],proposedDisposition=None,pendingRoutes=['source-accounting','review'],
    basis='The original confirmed finding concerns contradictory .8.4 acceptance wording, not an established current runtime defect. A concrete text-only repair candidate exists in design-roast-round-1-disposition.md and corrected settled-tree-after-roast-1.json (.8.4 now excludes supported resolved/rejected findings including external verified fixes). Parent must judge that original-to-corrected source evidence for this exact strict ref; no repair disposition is applied by this proposal.',
    concreteCandidateEvidence=[RUN+'/design-roast-round-1-disposition.md',RUN+'/settled-tree-after-roast-1.json'],
    acceptanceEffect='historical disposition remains unresolved for exact-ref parent judgment; actual R10 final criterion remains pending, without assuming the old wording defect persists')
  proposals.append(p)
assert len(proposals)==199

# Specific supplemental mappings. Each original byte span/JSON pointer stays independent.
supp={
'75-1':('scope',['R1','R15'],[], 'Replay/dryRun is simulated mechanics evidence. Hosted Workflow is not a separately mandated runtime; representative actual instruction behavior remains required.', 'verification'),
'75-2':('required',['R1','R15'],['behavior'],'Parent-owned before/after source-isolation instruction evaluation remains required; preserve baseline controls.', 'verification'),
'75-3':('required',['R1','R9'],['review'],'Resource lifecycle is a separate leaf; captured repository identities and actual source-pair use remain a current boundary to review.', 'workspace'),
'75-4':('required',['R1','R15'],['behavior','review'],'The explicit two-seat advancing-caller/output-isolation and unavailable-assembler scenario remains an acceptance example to assess with representative evidence; do not infer task-review no-rerun coverage from unrelated live checks.', 'workspace'),
'76-1':('required',['R5','R15'],['suite'],'Retain linked-worktree exit9, separate exact-source standalone package pass and mixed23-command coverage. Complete final combined-source suite/reconciliation without relabeling worktree failure.', 'acceptance'),
'76-2':('required',['R2','R7','R15'],['behavior','suite','review','human'],'Fixture teardown follow-through and explicit parent final/behavior/review/acceptance ownership survive historical leaf completion.', 'verification'),
'76-3':('scope',['R2'],[],'Approved temporary-root validator layout and native packaging mktemp behavior are historical evidence boundaries. No global process-absence claim follows and no retrospective global scan is required.', 'workspace'),
'76-4':('scope',['R7'],[],'The source performed no real root closure. An empty humanAction/no-mutation report is not actual human acceptance and adds no new historical execution requirement.', 'acceptance'),
'77-1':('historical',['R4','R6','R15'],['suite','review'],'Original2294/1 delivery remains failed. Named bounded Task19 amendment has specific later historical verification; parent may assess that support without rewriting the original result.', 'verification'),
'77-2':('required',['R4'],['resume','review'],'Full unknown/additive Recovery records require owned source/line association and conservative holds on unresolved transport through the existing reader; current resume review remains required.', 'recovery'),
'77-3':('historical',['R4','R6'],['review'],'The original implementer explicitly deferred the bounded fixture amendment. Later source-bound fix evidence can support this exact scenario; initial implementation never measured those cases.', 'verification'),
'77-4':('required',['R4','R6'],['resume'],'Differentiate genuinely new-run absence from unresolved known pointer and never guess scope from neighboring/foreign lines. Current resume repair verification must retain that boundary.', 'recovery'),
'77-5':('scope',['R5','R15'],[],'Actual helper/test execution with simulated agents remains mechanical evidence only, with separate required changed-instruction evaluation.', 'verification'),
'77-6':('scope',['R5','R8'],[],'The early digest failure lacks a full captured tree. Keep outcome/cause unknown; later repeat passes do not retroactively establish pre-existing/flaky attribution or a run baseline.', 'acceptance'),
'77-7':('historical',['R4','R6','R15'],['suite','review'],'Separate JSON appearance of original2294/1 concern: preserve failed result; candidate relationship requires same-source exact JSON/prose evidence before parent linkage.', 'verification'),
'77-8':('historical',['R4','R6'],['review'],'Separate JSON appearance of deferred fixture amendment. Bounded later fix verification is available, with no automatic occurrence merge or retrospective original pass.', 'verification'),
'77-9':('required',['R7','R15'],['behavior','suite','review','human'],'Separate JSON pending caller acceptance concern remains blocking under original ownership.', 'acceptance'),
'77-10':('required',['R4'],['resume'],'Separate JSON large-payload/conservative-hold concern remains required; existing-reader transport failure must preserve the hold.', 'recovery'),
'77-11':('required',['R4','R6'],['resume','review'],'The precise amendment preserves real cap, typed discriminator, source guards and negative cases. Current resume/final review must retain these guards; no broad fixture rewriting.', 'recovery'),
'77-12':('required',['R15'],['suite','behavior'],'Full replay/startup checks are bounded mechanics evidence, with no full repository suite or real-model trial claim; final suite and representative evaluation remain required.', 'verification'),
'77-13':('required',['R7','R15'],['suite','review','human','behavior'],'Fix-only deterministic success does not finish caller final sweep, acceptance or instruction behavior.', 'acceptance'),
'77-14':('required',['R7','R15'],['suite','review','human','behavior'],'The new final JSON concern separately preserves caller acceptance and simulated-agent limitations; do not automatically merge it with original four concerns.', 'acceptance'),
'78-1':('required',['R1','R9','R15'],['selector','review'],'Captured commit/manifests, exact generated payload exclusions, preserved reports/metadata and explicit refusal/no omission authority are current selector guarantees. Historical implementation evidence does not waive current selector repairs.', 'findings'),
'78-2':('required',['R7','R15'],['behavior','suite','review','human'],'The final rebased implementation explicitly leaves changed-instruction, review, sweep and human/root acceptance pending.', 'verification'),
'78-3':('required',['R1','R9','R15'],['selector','behavior','review'],'Explicit amendment chooses existing component and preserves unrelated contracts/history. Actual changed-source instruction evaluation and current selector correctness remain pending.', 'findings'),
'78-4':('scope',['R2'],[],'Later empty cleanup probes are task-local observations and explicitly preserve the prior unknown-command stopped PID. They neither attribute that PID nor establish retrospective global absence.', 'workspace'),
'78-5':('historical',['R1','R9'],['selector','review'],'Prior BLOCKED scope-amendment handoff is a real temporal layer. Later approved amendment may supersede the interface, but current selector repairs/final checks remain pending; no live scope-hold is inferred from old status.', 'findings'),
'78-6':('historical',['R1','R9'],['selector','review'],'Uncreated unauthorized helper and provisional report-status interface belong to held history. Later amendment selected existing dispatch-text; preserve old claim without demanding that obsolete interface now.', 'findings'),
'78-7':('historical',['R7','R15'],['behavior','review'],'Explicit old coordinator scope hold governed the RED-only result, with no blocker. Later amendment and fresh-owner handoff are separately evidenced; no missing-dependency or retry-budget requirement is invented.', 'acceptance'),
}
supp_proposals=[]
for q in qualifications:
 short=q['id'].removeprefix('strict-supplement-');kind,cs,rs,reason,contract=supp[short]
 p={'id':q['id'],'originalQualification':q,'originalSourceRef':{'source':q['source'],'rawByteStart':q['qualification']['byteStart'],'rawByteEnd':q['qualification']['byteEnd'],'jsonPointer':q['qualification'].get('jsonPointer')},
 'classification':kind,'criteria':cs,'pendingRoutes':rs,'basis':reason,'approvedContractBasis':contracts[contract],
 'acceptanceEffect':'nonblocking retained scope qualification; no disposition supplied' if kind=='scope' else 'current named routes remain blocking; historical appearance itself is retained without automatic disposition',
 'proposalOnly':True,'canonicalApplied':False,'identityLinksApplied':False,'proposedDisposition':None}
 if short in ['77-1','77-3','77-7','77-8']:
  p['boundedHistoricalEvidenceKeys']=['task19-fixture'];p['candidateHistoricalDisposition']='Specific Task19 fixture amendment has concrete historical executed verification; exact-reference parent judgment still required. Original2294/1 is unchanged.'
 if short in ['78-5','78-6','78-7']:p['boundedHistoricalEvidenceKeys']=['recursive-inputs']
 supp_proposals.append(p)

# The35 named source gaps are retained as questions, with separate current routes.
gap_notes={
'interpretation-01-1':(['R1','R15'],['behavior'],'Historical later evaluation outcome unknown here. Actual changed-instruction assessment is required; scoped Issues:none never clears it.'),
'interpretation-02-1':(['R5','R8'],['semantic-evidence'],'Repeat-measurement reconciliation is semantic judgment, not automatic latest-pass precedence. The exact old contradiction has repair evidence; current evidence coverage remains required without invented historical measurements.'),
'interpretation-03-1':(['R5','R8'],['semantic-evidence','behavior'],'Synthetic history cannot establish real introduction chronology. Assess actual source roles and same-failure evidence; preserve absent baseline and live-evaluation limits.'),
'interpretation-05-1':(['R8','R15'],['behavior'],'This source alone does not establish completion of the caller attribution behavior evaluation. Keep the representative merged-source assessment pending.'),
'interpretation-06-1':(['R4'],['resume','review'],'The exact partial-close defect has concrete closure repair/RED-GREEN evidence and unchanged current code spans. Current interruption repairs/final review are distinct pending obligations.'),
'interpretation-07-1':(['R4','R15'],['resume','behavior','review'],'Partial-close and diagnostic-schema cases have distinct bounded closure/diagnostic evidence. Embedded FIXED does not merge appearances or satisfy parent fresh-agent evaluation; mixed intermediate histories may need versioned additional adapter records.'),
'interpretation-09-1':(['R4'],['source-accounting'],'The same-source sole fixture repair is supported by diagnostic schema history and recorded2124/0 replay, with exact current fixture. Parent may judge that bounded repair; no automatic identity link follows from a seam review claim.'),
'interpretation-11-1':(['R6','R15'],['behavior','review'],'Actual baseline report/claim-summary/scores substantiate B4 baseline3/5 versus0/5. Strict AFTER remains0/2/3. Missing old seam-diff wrapper stays a historical retention limitation; quoted exact conflict and source-bound repair are separate evidence.'),
'interpretation-15-1':(['R9','R10'],['semantic-evidence','source-accounting'],'Worked JSON is illustrative; structural evidence text cannot establish fix/rejection sufficiency. Parent must support individual semantic dispositions against original sources.'),
'interpretation-18-1':(['R9'],['source-accounting','review'],'Known required direct inputs must be declared by actual caller inventory; absent optional input cannot itself distinguish unnecessary from missing. Do not invent a retrospective required-input list or claim the baseline establishes post-collector behavior.'),
'interpretation-20-1':(['R12','R13','R15'],['suite','review'],'Historical stacked-source pass is not evidence for a future rebase. Current final suite is required; do not demand or invent a retrospective test at an unspecified future tree.'),
'interpretation-21-1':(['R12','R13'],['cleanup-metrics','source-accounting'],'Fixture/projected populations lacking task reports cannot establish run-wide totals. Preserve absent seam artifact as history and use explicit quoted conflict/verification separately; current metrics require supported population accounting.'),
'interpretation-25-1':(['R7','R15'],['review','suite'],'Original stacked and rebased sources stay separate. Specific seam resolution has recorded verification, while the missing named seam file is not reconstructed or treated as empty.'),
'interpretation-26-1':(['R9'],[],'The complete CLEAN seam object plus substantive scope/evidence supports only local finding:null interpretation. Generic null elsewhere remains unknown; no universal parser rule or new retrospective check is required.'),
'interpretation-32-1':(['R9','R10'],['source-accounting'],'Keep exact Task19 prose and JSON finding refs independent. Same original report and scenario provide a candidate rendition relationship; parent must review original raw block and full remediation list before any link.'),
'interpretation-36-1':(['R4','R9','R15'],['review','suite','behavior'],'Actual builder repair and dispatch/startup/CLI verification support the concrete old caller regression. Original exit1 and superseding/FIXED status remain historical; current suite/agent behavior are still pending.'),
'interpretation-58-1':(['R4','R15'],['review','suite'],'Specific recovery seam conflict has exact source/target/repair/check evidence. Other historical repair/reproduction narratives remain unadjudicated; no context passage is silently promoted, cleared or made a current defect.'),
'interpretation-62-1':(['R2','R5'],['process','review','behavior'],'Keep initial detached fixture leak report separate from Task5 review occurrence and from later teardown repair evidence. Current final cleanup and behavior remain required; no old surviving-daemon assertion is invented.'),
'interpretation-75-1':(['R1','R15'],['behavior','review','suite'],'Original pinning/resource mechanics history is bounded; actual representative source-isolation behavior and final suite/review remain pending. No hosted-runtime requirement follows from absent hosted evidence.'),
'interpretation-76-1':(['R1','R2','R6','R15'],['behavior','suite','review','process'],'Retain packaging failure/standalone pass, strictB4 and native/global-process limitations separately. Final suite and behavior assessment remain required; retrospective Linux/hosted/global baseline reconstruction is not prescribed.'),
'interpretation-77-1':(['R4','R6','R15'],['resume','suite','review'],'Task19 concrete bounded amendment has2329/0 and preserved negative guards; original2294/1 remains a failed historical result. This does not verify current resume interruption fixes or final tree.'),
'interpretation-77-2':(['R7'],['review','human'],'Structured task-fix acceptancePending:false applies to that task fix; explicit caller/root pending survives. Do not reinterpret it as actual root/human acceptance.'),
'interpretation-77-3':(['R9'],[],'Byte-identical Task19 retained/canonical pairs establish byte equality only. Retain identities; no finding merge, repair disposition or current requirement follows from byte equality.'),
'interpretation-78-1':(['R1','R9','R15'],['selector','review','suite'],'Concrete earlier recursion repair/continuation evidence is bounded. Current selector/provenance repairs remain required and original held RED/current implementation layers are preserved.'),
'interpretation-78-2':(['R2'],['process'],'Old PID29238 command and cause remain unknown, with possible concurrent Git capture. Do not infer test leak or retrospective global absence. Current final owned-root process inspection/retention is a separate required check.'),
'interpretation-78-3':(['R1','R9'],['selector','review'],'Retain old BLOCKED scopeHeld and later amended IMPLEMENTED as temporal facts; actual new amendment selected existing dispatch-text. Neither status clears source findings or certifies current selector.'),
}
gap_proposals=[]
for g in gaps:
 ident=g['id']
 if ident.startswith('unknown-original-outcome-'):
  cs,rs,reason=['R9'],['source-accounting'],'Original historical kind/verdict genuinely unrecognized; adapter NEEDS_CONTEXT is new interpretation only. Keep this historical outcome unknown without inventing wrappers or demanding a retrospective status. Actual current source registration/correspondence must be supported or retain the explicit coverage gap.'
 elif ident.startswith('strict-supplemental-'):
  ordinal=ident.rsplit('-',1)[1];subset=[p for p in supp_proposals if p['id'].startswith('strict-supplement-'+ordinal+'-')]
  cs=sorted({c for p in subset for c in p['criteria']});rs=sorted({r for p in subset for r in p['pendingRoutes']})
  reason='Every exact supplemental span is separately mapped in supplemental-proposals.json: '+', '.join(p['id']for p in subset)+'. No source-wide clearance or replacement strict extraction is proposed.'
 else:cs,rs,reason=gap_notes[ident]
 gap_proposals.append({'id':ident,'originalGap':g,'criteria':cs,'pendingRoutes':rs,'basis':reason,'historicalInterpretationStatus':'retained; no erased historical unknown or missing wrapper',
  'currentAcceptanceEffect':'named required routes remain blocking' if rs else 'nonblocking retained historical/scope interpretation only',
  'canonicalApplied':False,'proposalOnly':True})
assert len(gap_proposals)==35

extra={}
for key,paths in {
 'no-change-baseline':[RUN+'/behavior-baseline/report.md',RUN+'/behavior-baseline/claim-summary.json',RUN+'/behavior-baseline/scores.json'],
 'historical-profile-qualification':[RUN+'/task-report-history-r1/raw/task-27-report.md',RUN+'/profile-implementation.json',RUN+'/profile-implementation.md']}.items():
 out=[]
 for path in paths:
  b=blob(path);dest=ROOT/'additional-evidence'/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
  out.append({'revision':FREEZE,'path':path,'sha256':sha(b),'retained':'additional-evidence/'+path})
 extra[key]={'artifacts':out,'testsExecutedByThisTask':False}
baseline=json.loads(blob(RUN+'/behavior-baseline/claim-summary.json'))
profile=json.loads(blob(RUN+'/profile-implementation.json'))
extra['no-change-baseline']['observedB4']=baseline['B4']
extra['no-change-baseline']['limits']='Historical small-sample manually scored supplied-fact text decisions; strict AFTER failure/ambiguity remains and no supported repair disposition is proposed from baseline alone.'
extra['historical-profile-qualification']['observedFields']={k:profile[k] for k in ['graphScope','diagnosis','window']}
extra['historical-profile-qualification']['simulation']={k:v for k,v in profile['simulation'].items() if k in ['lowerBoundMs','verdict','qualification']}
extra['historical-profile-qualification']['limits']='Historical executed one-off comparison is retained in the raw report; this task inspected actual frozen qualified artifacts without executing it. No causal or historical dependency reconstruction.'
write('additional-evidence.json',extra)

# Proposal-only JSON/prose relations: exact original report evidence, never key-only.
renditions=[]
for i,j,name in [(79,78,'Task19 finding and full bounded amendment'),(96,94,'Task20 builder/startup finding'),(97,95,'Task20 pending changed-instruction evaluation'),(129,128,'Task29 deferred instruction evaluation')]:
 a,b=proposals[i-1],proposals[j-1]
 assert a['originalRef']['source']==b['originalRef']['source']
 renditions.append({'name':name,'refs':[a['originalRef'],b['originalRef']],'sameOriginalReport':True,'status':'candidate rendition relation only; parent raw-block/full-item judgment required',
  'basis':'Original structured /finding or /minors field describes the same named task and concrete scenario within this one raw report. Exact raw byte ranges/JSON pointer and prose full item remain distinct; neither matching keys nor byte equality supplies identity.',
  'requiredEvidence':[a['interpretationMetadata'],b['interpretationMetadata'],'pinned-input/raw/'+a['originalRawArtifact']],
  'linkApplied':False,'dispositionInherited':False})
write('rendition-link-candidates.json',renditions)
review_path=Path('/private/tmp/ufz-correction-legacy-adapter-review.md')
shutil.copyfile(review_path,ROOT/'adapter-review-known-failures.md')
write('exact-ref-proposals.json',{'schemaVersion':1,'proposalOnly':True,'canonicalAdoptionBlockedByInitialAdapterReview':True,'currentInspectionFreeze':FREEZE,'pinnedRecordSha256':EXPECTED,
 'populationBoundary':'Exactly initial199 occurrences,29 strict supplements and35 named source gaps. Fresh adapter review NEEDS_FIX identifies13 omitted mixed historical-finding/claimed-repair appearances, a wrong task15 example selection, and two separately retained structured concerns chosen by parent for later additions. These are not absent/empty or cleared here. This initial source population is not adoptable as complete; any corrected version/delta needs separate exact-ref review. Occurrence056 is explicitly not adoptable.',
 'criteria':criteria,'approvedContractBases':contracts,'pendingRoutes':routes,'occurrences':proposals})
write('supplemental-proposals.json',{'schemaVersion':1,'proposalOnly':True,'qualifications':supp_proposals})
write('source-gap-proposals.json',{'schemaVersion':1,'proposalOnly':True,'gaps':gap_proposals})

questions=[
 {'id':'source-population-delta','effect':'blocks complete-source accounting, not an invented product defect','evidenceNeeded':'Fresh initial adapter review is NEEDS_FIX. Independently classify the13 exact mixed historical-finding/claimed-repair appearances in its census, the replacement real task15 population qualification, and the two parent-selected structured concern appearances. Initial199 remain pinned; occurrence056 example ref is obsolete/not adoptable. No completeness/adoption claim covers the later delta.'},
 {'id':'unknown-historical-outcomes','effect':'historical unknown retained; current registration coverage remains explicit','evidenceNeeded':'Preserve the five named original unknown outcomes. Parent must choose supported current conservative source accounting or retain gap; no fabricated recognized original status or retrospective wrapper.'},
 {'id':'current-final-tree','effect':'blocking existing R1–R15 where applicable','evidenceNeeded':'Finish selector/resume/four cleanup-metrics repairs; capture actual final source; run required final suite and source-bound independent whole-epic review. Old exact-span inspection and historical GREEN do not replace these checks.'},
 {'id':'behavior-representativeness','effect':'blocking R15/R7 and relevant behavioral criterion','evidenceNeeded':'Parent assessment of actual merged instructions, required interrupted-invocation/finding continuity and cleanup behavior. Retain strict AFTER B4 0/2/3, diagnostic5/5 and original source/selection limitations separately; no pooled improvement claim.'},
 {'id':'source-semantic-support','effect':'blocking current source/finding/evidence support','evidenceNeeded':'Parent adoption of per-ref supported historical proposals, exact source correspondence and any JSON/prose candidate links, with concrete same-task/scenario evidence. Current chronology/check correspondence and missing run-baseline remain gaps when unproved.'},
 {'id':'historical-profile-cause','effect':'nonblocking historical unknown under approved§5','evidenceNeeded':'No reconstruction required. Keep unknown cause/readiness/enforcement and model-only estimate; the concrete old qualification repair is separately supported by source-bound comparison and frozen artifact fields.'},
 {'id':'old-cleanup-pid','effect':'nonblocking historical unknown; current R2 cleanup still blocking','evidenceNeeded':'PID29238 command unavailable and possible concurrent capture remain unknown; no retrospective attribution is required. Actual final caller/review-root process/retained-resource inspection is required.'},
 {'id':'suite-reconciliation','effect':'blocking actual current R5/R15 requirement accounting','evidenceNeeded':'Reconcile exact historical aggregate suite command/configuration against actual final command groups without replacing linked-worktree exit9 or original failed outcomes by a standalone pass.'},
 {'id':'tracker-human','effect':'blocking when actual current R4/R7 gates remain','evidenceNeeded':'Reconcile actual current pending closure/holds including super-plan-8fn if applicable, and retain existing human finish decision. Old blocker/status mentions alone do not establish present tracker state or invent an additional human gate.'},
 {'id':'original-design-wording-finding','effect':'exact historical strict-ref disposition unresolved; current R10 criterion remains required','evidenceNeeded':'Assess original .8.4 inclusion contradiction against concrete corrected settled-tree-after-roast-1.json and design-roast-round-1-disposition.md. This is a text-only repair candidate, not evidence the old contradiction remains in current runtime or that final projection behavior passed.'},
]
write('unresolved-evidence-requirements.json',questions)

# Representation checks, not product tests: exact objects, refs, raw hashes and static spans.
assert [p['originalRef'] for p in proposals]==[ref(s['record']['source'],o) for s in records['records'] for o in s['record']['occurrences']]
assert [p['originalRef'] for p in proposals[-24:]]==strict
assert [p['originalQualification'] for p in supp_proposals]==qualifications
assert [p['originalGap'] for p in gap_proposals]==gaps
assert len({(p['originalRef']['source'],p['originalRef']['section'],p['originalRef']['position'])for p in proposals})==199
input_manifest=[]
for path in sorted((ROOT/'pinned-input').rglob('*')):
 if path.is_file():input_manifest.append({'path':str(path.relative_to(ROOT)),'sha256':sha(path.read_bytes()),'bytes':path.stat().st_size})
summary={'counts':{'sources':79,'initialOccurrences':199,'strictOriginalOccurrences':24,'supplements':29,'namedSourceGaps':35,'newHistoricalAssertions':11},
 'classifications':dict(Counter(p['classification']for p in proposals)),
 'currentRequiredRoutes':{k:sum(k in p['pendingRoutes'] for p in proposals) for k in routes},
 'checks':{'recordInputHashMatches':True,'all199ExactOriginalObjectsPreserved':True,'strict24Exact':True,'all29SupplementsExact':True,'all35OriginalGapsExact':True,'noDuplicateOriginalRefs':True,'allPriorHistoricalEvidenceSpansReboundExactlyAtFreeze':True},
 'limits':{'proposalOnly':True,'canonicalWrites':False,'sourceOrIndexOrHeadWrites':False,'trackerHerdrProcessMutations':False,'testsExecuted':False,'subagents':False,'finalAcceptanceEstablished':False,'wholeRunPopulationComplete':False},
 'pinnedInputs':input_manifest}
write('representation-audit.json',summary)

lines=['# Exact-reference legacy relevance proposal','',
 'Proposal only. Current inspection freeze `'+FREEZE+'`; initial records SHA-256 `'+EXPECTED+'`. No canonical adoption, occurrence merge, disposition application or present final acceptance is performed.','',
 'The output preserves all 199 initial occurrence objects (including the original strict 24), 29 exact strict supplements, 35 named source gaps, original raw bytes and interpretation metadata. The initial adapter review is NEEDS_FIX: 13 mixed historical-finding/claimed-repair appearances were omitted, and Task 15 occurrence 056 incorrectly selects an illustrative JSON example. That exact obsolete ref is flagged **not adoptable**. Two parent-selected structured concern appearances also await the corrected adapter delta. No initial source completeness or adoption is approved.','',
 'Required current checks remain blocking: selector/resume/four cleanup-metrics repairs, actual final combined-source suite, independent whole-epic review, representative actual changed-instruction assessment, final owned-resource inspection and existing caller/human acceptance. Each occurrence/supplement has its named R criterion and pending route; counts describe appearances, not independent defects.','',
 'Historical repair proposals use concrete original same-task/scenario repair and executed verification evidence, with all cited code/fixture/report spans independently rebound exactly at the frozen source. Static span survival is not a final-tree test. Original failures remain failures: Task19 2294/1, earlier packaging exit9 and all other retained RED/unavailable history are preserved.','',
 'Nine newly selected defect assertions have narrow repair support: contradiction occurrences 4/12, partial-close 17/23, diagnostic-schema 25, independent-source retry 54/60 and builder caller 85/87. Each remains an independent original reference. New assertion 31 is a supported bounded B4 baseline claim (3/5 failed versus 0/5 controls), with no repair disposition: strict AFTER remains 0 pass / 2 fail / 3 ambiguous. New assertion 116 has a narrow supported historical qualification repair: executed source-bound data comparison and actual frozen inconclusive/unknown model fields; historical cause remains unknown.','',
 'Native Linux, absent hosted Workflow, no per-reviewer test rerun, old unknown PID attribution and unavailable historical graph causation are qualified by the specific approved contract in each row. They remain disclosed without fake resolution or an invented retrospective check. Actual required live behavior, final checks and cleanup remain separately blocking. Five unrecognized original outcomes stay unknown; adapter NEEDS_CONTEXT is not a historical verdict.','',
 'Candidate JSON/prose rendition links remain proposal-only, requiring the original same-report field/prose/full-scenario evidence. Byte-identical Task 19 copies and matching keys never establish finding identity.','',
 'Files: `exact-ref-proposals.json` (199 exact refs), `supplemental-proposals.json` (29), `source-gap-proposals.json` (35), `historical-evidence-rebinding.json`, `additional-evidence.json`, `rendition-link-candidates.json`, `unresolved-evidence-requirements.json`, `representation-audit.json`, and preserved `pinned-input/`.','',
 'No product tests, agent trials, canonical run/source/index/HEAD/tracker/Herdr/process changes, pushes or releases were performed. Local representation checks confirm preserved input objects/hashes and static evidence spans only. The per-reference table is in `exact-ref-index.md`.']
index=['# Pinned initial199 exact-reference proposal index','','| Proposal | Exact original source | Existing criteria | Classification | Pending route |','| --- | --- | --- | --- | --- |']
for p in proposals:
 r=p['originalRef'];index.append('| '+p['id']+' | `'+r['source']+'` / `'+r['section']+'` / '+str(r['position'])+' | '+', '.join(p['criteria'])+' | '+p['classification']+' | '+(', '.join(p['pendingRoutes'])or'bounded historical/scope only; current final gates still pending')+' |')
(ROOT/'REPORT.md').write_text('\n'.join(lines)+'\n')
(ROOT/'exact-ref-index.md').write_text('\n'.join(index)+'\n')
print(json.dumps({'output':str(ROOT),'counts':summary['counts'],'classifications':summary['classifications'],'representationChecks':summary['checks']},indent=2))
