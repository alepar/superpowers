#!/usr/bin/env python3
"""Exact-source delta inventory; product bytes are classified, not re-audited."""
import collections,datetime,hashlib,json,os,pathlib,re,subprocess
ROOT=pathlib.Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
OLD=pathlib.Path('/private/tmp/ufz-correction-final-artifact-inventory');OUT=pathlib.Path('/private/tmp/ufz-correction-final-artifact-inventory-c216')
BASE='832b051c870ae5c69adfa7f14d770292ab6c1a81';PREV='7b18b0c26b9f19d531c558e112d490743901a13b';HEAD='c21681200aac20fb0223b6b0e83e953b1bc75cde';TREE='294ee3186698a29c112b7ed7daded506288a52f1';RUN='docs/superpowers/runs/2026-10-16-workflow-reliability/';MC=RUN+'merge-correction/'
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
def put(n,d):(OUT/n).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
def fact(p):
    p=pathlib.Path(p);b=p.read_bytes();return {'path':str(p),'bytes':len(b),'sha256':sha(b)}
def tree(ref):
    d={}
    for x in git('ls-tree','-rz',ref).split(b'\0'):
        if x:
            a,p=x.split(b'\t',1);m,t,o=a.decode().split();d[p.decode()]={'gitMode':m,'gitType':t,'gitBlob':o}
    return d
assert git('rev-parse','HEAD').decode().strip()==HEAD
assert git('rev-parse',HEAD+'^{tree}').decode().strip()==TREE
working_status=git('status','--porcelain').decode()
old=json.loads((OLD/'tracked-path-inventory.json').read_text());prior={x['path']:x for x in old['records']};pendingdoc=json.loads((OLD/'pending-working-tree-inventory.json').read_text());pending={x['path']:x for x in pendingdoc['records']};t=tree(HEAD);oldtree=tree(PREV)
paths=git('diff','--name-only','-z',PREV,HEAD).decode().rstrip('\0').split('\0');fullpaths=git('diff','--name-only','-z',BASE,HEAD).decode().rstrip('\0').split('\0');status={};rr=git('diff','--no-renames','--name-status','-z',PREV,HEAD).decode().rstrip('\0').split('\0')
for i in range(0,len(rr),2):status[rr[i+1]]=rr[i]
oids=sorted({t.get(p,oldtree.get(p))['gitBlob']for p in paths});out=subprocess.run(['git','cat-file','--batch'],input=('\n'.join(oids)+'\n').encode(),cwd=ROOT,stdout=subprocess.PIPE,check=True).stdout;contents={};pos=0
for oid in oids:
    e=out.index(b'\n',pos);n=int(out[pos:e].split()[2]);pos=e+1;contents[oid]=out[pos:pos+n];pos+=n+1
del out
def headbytes(p):return contents[t[p]['gitBlob']]if t[p]['gitBlob']in contents else git('show',HEAD+':'+p)
oldhash=collections.defaultdict(list)
for p,r in prior.items():oldhash[r['sha256']].append(p)
privatehash=collections.defaultdict(list);privatefacts=[]
for directory in [OLD,pathlib.Path('/private/tmp/ufz-correction-final-fix-review')]:
    for p in sorted(directory.rglob('*')):
        if p.is_file():f=fact(p);privatefacts.append(f);privatehash[f['sha256']].append(f)
for p in ['/private/tmp/ufz-correction-task6-rereview-round2.md','/private/tmp/ufz-correction-task6-rereview-round1.md']:
    if pathlib.Path(p).is_file():f=fact(p);privatefacts.append(f);privatehash[f['sha256']].append(f)
product=lambda p:p.startswith(('skills/','tests/','scripts/'))or p in ['AGENTS.md','CLAUDE.md']
productpaths=[p for p in fullpaths if product(p)];productdelta=[p for p in paths if product(p)];finalfix=json.loads(pathlib.Path('/private/tmp/ufz-correction-final-fix-review/manifest.json').read_text());fixpaths={x['path']:x for x in finalfix['paths']}
records={};docs={}
for p in paths:
    b=headbytes(p);h=sha(b);r={'path':p,'status':status[p],'bytes':len(b),'sha256':h,**t[p],'head':HEAD,'omitted':False,'semanticAssessment':'Role/provenance only; no new substantive semantic read unless specifically named.','sourceOfBytes':'immutable Git blob at final source freeze'}
    if p in prior:r['previousTrackedFact']={'head':PREV,'sha256':prior[p]['sha256'],'bytes':prior[p]['bytes'],'sameBytes':prior[p]['sha256']==h,'role':prior[p]['role']}
    if p in pending:r['priorPendingSnapshot']={'capturedUtc':pendingdoc['capturedUtc'],'sha256':pending[p]['sha256'],'bytes':pending[p]['bytes'],'sameBytes':pending[p]['sha256']==h,'semanticCoverageTransferred':False}
    if h in privatehash:r['exactPrivateArtifactCopies']=privatehash[h]
    if h in oldhash:r['exactPreviousTrackedByteCopies']=oldhash[h]
    text=b[:4096].decode('utf8','replace');r['firstNonemptyLine']=next((x[:240]for x in text.splitlines()if x.strip()),'')
    if p.endswith('.json') or b.lstrip().startswith((b'{',b'[')):
        try:
            d=json.loads(b);docs[p]=d;r['contentFormat']='json';r['jsonTopLevel']=list(d)if isinstance(d,dict)else type(d).__name__
        except(ValueError,UnicodeDecodeError):r['contentFormat']='nonparseable-json-named-file' if p.endswith('.json') else 'text'
    elif b'\0'in b[:8192]:r['contentFormat']='binary-or-nul-bearing';r.pop('firstNonemptyLine',None)
    else:r['contentFormat']='text'
    k=set(r.get('jsonTopLevel',[]))if isinstance(r.get('jsonTopLevel'),list)else set()
    if product(p):
        r['role']='current-product-or-test-source-changed-after-prior-freeze';r['semanticAssessment']='Assigned scoped source review; this inventory is not product audit.'
        if p in fixpaths:r['finalFixPackage']={'base':finalfix['base'],'head':finalfix['head'],'manifestSha256':sha(pathlib.Path('/private/tmp/ufz-correction-final-fix-review/manifest.json').read_bytes()),'hashMatches':h==fixpaths[p]['sha256'],'reviewStateAtFreeze':'scoped global composer re-review pending in plan freeze note; no verdict inferred here'}
    elif p.startswith(('docs/superpowers/specs/','docs/superpowers/plans/')):r['role']='primary-current-plan-or-spec-note-read-in-full';r['semanticAssessment']='Complete c216 plan/spec bodies read; preserve incomplete final acceptance/measurement states.'
    elif p==RUN+'run.md':r['role']='current-canonical-run-evidence-and-acceptance-record-snapshot';r['semanticAssessment']='Structured record type/identity accounting only; parent owns actual gate interpretation.'
    elif h in privatehash:r['role']='exact-retained-private-artifact-or-review-bytes'
    elif b.startswith(b'#!')or p.endswith(('.py','.mjs','.cjs','.js','.sh')):r['role']='retained-reconstructing-probe-or-evaluation-source'
    elif k&{'sources','files','artifacts','entries','outputs','inputs'}and any(x in pathlib.PurePosixPath(p).name for x in ['manifest','inventory','receipt','protocol']):r['role']='retained-source-producer-or-artifact-manifest-claims'
    elif k&{'verdict','findings','occurrences','extractionComplete','findingEvidence','records','judgments','decisions','dispositions','assessments'}:r['role']='retained-review-extraction-proposal-or-disposition-claims'
    elif k&{'command','exitCode','exit','outcome','checks','results','status','configuration','configurationId','returncode'}:r['role']='retained-probe-measurement-or-run-result-claims'
    elif p.endswith(('.md','.txt')):r['role']='retained-human-readable-report-guidance-or-evidence-claims'
    elif p.endswith(('.log','.stderr','.stdout','.jsonl'))or len(b)==0:r['role']='retained-raw-output-or-empty-artifact'
    elif r['contentFormat']=='binary-or-nul-bearing':r['role']='retained-binary-or-packed-evidence'
    elif r['contentFormat']=='json':r['role']='retained-structured-data-role-subclaims-unassessed'
    elif r['contentFormat']=='nonparseable-json-named-file':r['role']='retained-malformed-or-truncated-json-payload'
    elif text.startswith('diff --git'):r['role']='retained-derived-diff-input'
    else:r['role']='retained-text-payload-with-unassessed-source-claims'
    records[p]=r

# Complete path inventory reuses unchanged Git object identities without reopening
# their bodies. Delta bodies alone were newly loaded/hashed.
combined=[];unchanged=[]
for p in fullpaths:
    if p in records:combined.append(records[p]);continue
    assert p in prior and t[p]['gitBlob']==prior[p]['gitBlob']
    r={'path':p,'bytes':prior[p]['bytes'],'sha256':prior[p]['sha256'],**t[p],'head':HEAD,'role':prior[p]['role'],'omitted':False,'evidence':'prior inventory exact bytes + unchanged Git object at final freeze','priorInventory':str(OLD/'tracked-path-inventory.json'),'priorHead':PREV,'semanticAssessment':prior[p]['semanticAssessment']};combined.append(r);unchanged.append({'path':p,'oldGitBlob':prior[p]['gitBlob'],'finalGitBlob':t[p]['gitBlob'],'sameGitBlob':True,'sha256':prior[p]['sha256']})
assert len({x['path']for x in combined})==len(fullpaths)
put('delta-path-inventory.json',{'previousHead':PREV,'head':HEAD,'tree':TREE,'deltaPaths':len(paths),'records':list(records.values())})
put('unchanged-inheritance-proof.json',{'previousInventory':fact(OLD/'tracked-path-inventory.json'),'previousHead':PREV,'head':HEAD,'scope':'Unchanged Git object identity preserves prior byte/provenance facts and only their original semantic limits.','records':unchanged})
put('complete-final-path-inventory.json',{'base':BASE,'head':HEAD,'tree':TREE,'changedTrackedPaths':len(fullpaths),'scope':'Path/byte/provenance completeness only. No new all-path semantic read, omission authority or global-ready verdict.','omissions':0,'records':combined})
byhash=collections.defaultdict(list)
for r in combined:byhash[r['sha256']].append(r['path'])
put('exact-byte-duplicate-groups.json',{'head':HEAD,'groups':[{'sha256':h,'paths':ps,'meaning':'Byte identity only; no semantic/provenance-authority transfer'}for h,ps in byhash.items()if len(ps)>1]})
put('previous-private-artifact-facts.json',{'scope':'Actual local artifacts hashed at inventory time. Relationships are byte equality only, never a new semantic read.','records':privatefacts})

# Narrow attributed scope of the 14 changed product/test paths.
source_records=[];r1path=MC+'task-6/evidence/review-round-1-source-identities.json';r2path=MC+'task-6/evidence/review-round-2-source-identities.json';r1=docs[r1path];r2=docs[r2path]
for p in productpaths:
    r=next(x for x in combined if x['path']==p);x={'path':p,'bytes':r['bytes'],'sha256':r['sha256'],'gitBlob':r['gitBlob'],'deltaFromPreviousFreeze':p in records}
    if p in fixpaths:x.update(reviewScope='11-path final-fix package',packageBase=finalfix['base'],packageHead=finalfix['head'],packageHashMatches=r['sha256']==fixpaths[p]['sha256'],semanticVerdict='global composer owns fresh final-fix scoped review; not claimed by inventory')
    elif p in productdelta:
        binding=r2 if p in r2['files']else r1;f=binding['files'][p];report=MC+'task-6/review-round2.md'if binding is r2 else MC+'task-6/review-round1.md'
        x.update(reviewScope='Task6 independently attributed follow-up',reviewedCommit=binding['commit'],sourceIdentityManifest=r2path if binding is r2 else r1path,reviewedSha256=f['sha256'],reviewedGitBlob=f['gitBlob'],matchesReviewedFinalBytes=f['sha256']==r['sha256']and f['gitBlob']==r['gitBlob'],reviewReport=report,reviewReportSha256=records[report]['sha256'],reviewLimit='Round1 addresses R1/R2 but raises R3; round2 reads the two-file R3 fix and retained17 settlement cases, resolves R3 while explicitly retaining parent final-suite/behavior/gate obligations. New settlement test body was fully read by round1 reviewer, not newly semantically reread here.')
    else:x.update(reviewScope='prior58-source partition unchanged bytes',previousHead=PREV,previousGroup=prior[p].get('sourceReviewGroup'),semanticVerdict='Retains original actual review attribution/limits; original partition alone is not a fresh verdict.')
    source_records.append(x)
put('final-source-partition.json',{'base':BASE,'head':HEAD,'actualSourcePathCount':len(productpaths),'unchangedFromPrior58Count':sum(not x['deltaFromPreviousFreeze']for x in source_records),'changedSourcePathCount':len(productdelta),'finalFixPackagePathCount':len(fixpaths),'additionalTask6FollowupPathCount':len(set(productdelta)-set(fixpaths)),'records':source_records})
source_diff=git('diff','--no-ext-diff',PREV,HEAD,'--',*productdelta);(OUT/'product-delta-for-role-attribution.diff').write_bytes(source_diff)

# Rebind previously attributed historical reviews/79 raw interpretations to
# committed final source. Never convert byte equality into a new semantic read.
reuse=json.loads((OLD/'source-bound-reuse-proof.json').read_text());reusechecks=[]
for x in reuse['checks']:
    p=x['currentGitPath'];r=next(y for y in combined if y['path']==p);reusechecks.append({'path':p,'ordinal':x['ordinal'],'index':x['index'],'kind':x['kind'],'expectedSha256':x['expectedSha256'],'expectedBytes':x['expectedBytes'],'actualSha256':r['sha256'],'actualBytes':r['bytes'],'matches':r['sha256']==x['expectedSha256']and r['bytes']==x['expectedBytes']})
roleold=json.loads((OLD/'role-assessment-addendum.json').read_text());rolechecks=[]
for group in roleold['normativeGroups']:
    for p in group['paths']:
        r=next(y for y in combined if y['path']==p);rolechecks.append({'path':p,'group':group['id'],'expectedSha256':group['sha256'],'actualSha256':r['sha256'],'sameBytes':group['sha256']==r['sha256'],'classification':group['classification'],'priorReadScope':group['readScope']})
role18=[]
for x in roleold['unestablishedArtifactRecords']:
    r=next(y for y in combined if y['path']==x['path']);role18.append({'path':x['path'],'expectedSha256':x['sha256'],'actualSha256':r['sha256'],'sameBytes':x['sha256']==r['sha256'],'actualRole':x['actualRole'],'priorReadScope':x['readScope'],'limits':x['limitsAndRemainingClaim']})
ad=json.loads((OLD/'pending-adapter-provenance.json').read_text());adchecks=[]
def finalfact(abs_or_rel):
    p=str(abs_or_rel).removeprefix(str(ROOT)+'/');r=next(y for y in combined if y['path']==p);return {'path':p,'bytes':r['bytes'],'sha256':r['sha256'],'gitBlob':r['gitBlob']}
for x in ad['checks']:
    z={'ordinal':x['ordinal'],'source':x['source'],'original':finalfact(x['originalCommittedPath']),'rawCopy':finalfact(x['rawCopy']['path']),'proposalAdapter':finalfact(x['retainedProposalAdapter']['path']),'operationalAdapter':finalfact(x['operationalAdapter']['path']),'attributedSemanticScope':x['semanticAssessment'],'trackedAtFinalHead':True}
    z['originalStillMatchesPriorInterpretation']=z['original']['sha256']==x['originalCommittedSha256'];z['rawCopyStillMatchesOriginal']=z['rawCopy']['sha256']==z['original']['sha256'];z['proposalStillMatchesReviewedProposal']=z['proposalAdapter']['sha256']==x['retainedProposalAdapter']['sha256'];z['operationalStillMatchesProposal']=z['operationalAdapter']['sha256']==z['proposalAdapter']['sha256'];adchecks.append(z)
adinputs=[]
for x in ad['inputs']:
    f=finalfact(x['actual']['path']);adinputs.append({'path':f['path'],'expectedSha256':x['sha256'],'actualSha256':f['sha256'],'sameBytes':f['sha256']==x['sha256']})
adreviews=[]
for x in ad['reviewArtifacts']:
    f=finalfact(x['path']);adreviews.append({'path':f['path'],'expectedSha256':x['sha256'],'actualSha256':f['sha256'],'sameBytes':f['sha256']==x['sha256']})
put('historical-review-and-role-reuse-proof.json',{'head':HEAD,'scope':'Exact byte rebinding to prior attributed coverage/role assessment. No semantic expansion or current measurement/gate clearance.','prior242Proof':fact(OLD/'source-bound-reuse-proof.json'),'historical242Checks':reusechecks,'prior11AttributedReports':reuse['attributionEvidence'],'priorRoleAddendum':fact(OLD/'role-assessment-addendum.json'),'prior364NormativeChecks':rolechecks,'prior18ArtifactRoleChecks':role18,'prior79Proof':fact(OLD/'pending-adapter-provenance.json'),'historical79Checks':adchecks,'interpretationInputChecks':adinputs,'adapterReviewArtifactChecks':adreviews,'originalFailurePreservation':'Initial failed adapter, raw reports, original strict gaps, failed measurements and old selector sidecars remain unchanged unless explicitly identified delta; byte equality is not root acceptance.'})

# Bound explicit actual private paths appearing in retained new producer records.
# Never infer producer lineage from the directory label alone.
privateclaims=[]
def walk(v,claimant,pointer=''):
    if isinstance(v,dict):
        for k,w in v.items():
            loc=pointer+'/'+str(k)
            if isinstance(w,str)and '\n'not in w and len(w)<1500 and w.startswith(('/private/tmp/','/tmp/')):
                f=pathlib.Path(w)
                if f.is_file():
                    try:
                        b=f.read_bytes();h=sha(b);matches=[p for p,r in records.items()if r['sha256']==h]
                        if matches:privateclaims.append({'claimant':claimant,'pointer':loc,'privateSource':str(f),'actualPrivateBytes':len(b),'actualPrivateSha256':h,'exactCommittedMatches':matches,'scope':'Recorded private path exists and equals these committed bytes; producer authority and semantic coverage not inferred.'})
                    except OSError:pass
            walk(w,claimant,loc)
    elif isinstance(v,list):
        for i,x in enumerate(v):walk(x,claimant,pointer+'/'+str(i))
for p,d in docs.items():walk(d,p)
put('explicit-private-path-byte-bindings.json',{'scope':'Only actual existing private files explicitly named in retained delta JSON, and only exact byte matches.','records':privateclaims})

# Structured canonical run accounting is not semantic acceptance evaluation.
runtext=headbytes(RUN+'run.md').decode();types=collections.Counter();runrecords=[]
for n,line in enumerate(runtext.splitlines(),1):
    if line.startswith('- ')and' · {'in line:
        typ=line[2:].split(' · ',1)[0]
        try:
            d=json.loads(line.split(' · ',1)[1]);types[typ]+=1
            if typ in ['root-acceptance','finding-source','review-source','review-collection']:
                runrecords.append({'line':n,'type':typ,'source':d.get('source'),'invocationId':d.get('invocationId'),'artifact':d.get('artifact'),'sourceTree':d.get('sourceTree'),'owner':d.get('owner'),'complete':d.get('complete'),'requirementCount':len(d.get('requirements',[])),'dataSha256':sha(json.dumps(d,sort_keys=True).encode())})
        except ValueError:pass
put('canonical-run-structured-role.json',{'head':HEAD,'path':RUN+'run.md','sha256':records[RUN+'run.md']['sha256'],'scope':'Structured source/collection/root record counts and identities only. No gate execution, relevance/disposition verification or current eligibility assertion.','recordTypeCounts':dict(types),'selectedRecordIdentityRows':runrecords})

# Scope the unread semantic queue explicitly. Exact pending/private copies prove
# retention, not new substantive review; proposal, raw and report roles stay distinct.
queue=[]
for p,r in records.items():
    if product(p)or r['role']=='primary-current-plan-or-spec-note-read-in-full':continue
    keys=set(r.get('jsonTopLevel',[]))if isinstance(r.get('jsonTopLevel'),list)else set();name=pathlib.PurePosixPath(p).name
    priority='retained-source/proposal/raw claims not newly semantically assessed'
    if r['role']=='current-canonical-run-evidence-and-acceptance-record-snapshot':priority='parent must assess actual current record/gate meaning'
    elif r['role']=='retained-human-readable-report-guidance-or-evidence-claims'or name.endswith('.md'):priority='human-readable substantive claim/report; preserve original attributed scope'
    elif keys&{'eligible','requirements','findingAcceptance','dispositions','judgments','assessments','protocol','coverage'}:priority='acceptance/relevance/evaluation/coverage claims need attributed assessment before reliance'
    queue.append({'path':p,'sha256':r['sha256'],'bytes':r['bytes'],'role':r['role'],'assessmentNeed':priority,'samePriorPendingBytes':r.get('priorPendingSnapshot',{}).get('sameBytes'),'exactPrivateArtifactMatch':bool(r.get('exactPrivateArtifactCopies')),'formalSettledFindingStatus':'not inferred from raw/scout/candidate/proposal contents or filename'})
put('semantic-claim-queue.json',{'scope':'Explicit delta claim-bearing/raw/source queue. This does not declare every row a formal finding or mandate rereading unchanged duplicates. Parent chooses justified actual review/reuse; inventory grants no omissions.','records':queue})
summary={'base':BASE,'previousHead':PREV,'head':HEAD,'tree':TREE,'cleanCheckoutObservedAtInitialFreezeInspection':True,'workingStatusAtInventoryStart':working_status,'workingStatusMeaning':'Parent has begun later RUN-only evidence work; those uncommitted bytes are outside frozen c216 inventory.','fullChangedPaths':len(fullpaths),'deltaPaths':len(paths),'deltaStatuses':dict(collections.Counter(status.values())),'unchangedInheritedPaths':len(unchanged),'deltaRoles':dict(collections.Counter(r['role']for r in records.values())),'actualProductSourcePaths':len(productpaths),'changedProductSourcePaths':len(productdelta),'unchangedPriorSourcePaths':len(productpaths)-len(productdelta),'finalFixPackagePaths':len(fixpaths),'additionalTask6FollowupSourcePaths':len(set(productdelta)-set(fixpaths)),'priorPendingSamePathRecords':sum(p in pending for p in paths),'priorPendingExactSameBytes':sum(r.get('priorPendingSnapshot',{}).get('sameBytes',False)for r in records.values()),'priorPendingChangedBytes':sum(p in pending and not records[p]['priorPendingSnapshot']['sameBytes']for p in paths),'deltaExactPrivateArtifactMatches':sum(bool(r.get('exactPrivateArtifactCopies'))for r in records.values()),'explicitPrivatePathByteBindings':len(privateclaims),'historical242AllMatch':all(x['matches']for x in reusechecks),'historical79AllMatch':all(x['originalStillMatchesPriorInterpretation']and x['rawCopyStillMatchesOriginal']and x['proposalStillMatchesReviewedProposal']and x['operationalStillMatchesProposal']for x in adchecks),'role18AllMatch':all(x['sameBytes']for x in role18),'normativePrior364SameBytes':sum(x['sameBytes']for x in rolechecks),'normativePrior364ChangedBytes':sum(not x['sameBytes']for x in rolechecks),'semanticQueueRecords':len(queue),'noOmissionsAuthorized':True,'newAllPathSemanticRead':False,'testsExecuted':False,'globalReadyAuthority':False,'deltaBytesHashed':sum(x['bytes']for x in records.values())}
put('summary.json',summary);print(json.dumps(summary,indent=2))
