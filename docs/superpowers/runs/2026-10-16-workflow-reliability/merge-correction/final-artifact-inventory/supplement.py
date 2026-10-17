#!/usr/bin/env python3
import collections,datetime,hashlib,json,pathlib,re,shutil,subprocess
ROOT=pathlib.Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
OUT=pathlib.Path('/private/tmp/ufz-correction-final-artifact-inventory')
RUN=ROOT/'docs/superpowers/runs/2026-10-16-workflow-reliability'
HEAD='7b18b0c26b9f19d531c558e112d490743901a13b'
BASE='832b051c870ae5c69adfa7f14d770292ab6c1a81'
def sha(b):return hashlib.sha256(b).hexdigest()
def put(n,d):(OUT/n).write_text(json.dumps(d,indent=2)+'\n')
def fact(p):
    p=pathlib.Path(p);b=p.read_bytes();return {'path':str(p),'bytes':len(b),'sha256':sha(b)}
inv=json.loads((OUT/'tracked-path-inventory.json').read_text());rs={r['path']:r for r in inv['records']}
refs=json.loads((OUT/'path-references.json').read_text())['records'];hashes=json.loads((OUT/'hash-provenance-claims.json').read_text())['records'];blobclaims=json.loads((OUT/'git-blob-provenance-claims.json').read_text())['records']
claims=collections.defaultdict(lambda:{'targets':set(),'hashMatchedTargets':set(),'hashUnmatchedTargets':set(),'gitBlobMatchedTargets':set()})
for x in refs:claims[x['claimant']]['targets'].add(x['target'])
for x in hashes:claims[x['claimant']]['hashMatchedTargets' if x['hashMatches'] else 'hashUnmatchedTargets'].add(x['target'])
for x in blobclaims:
    if x['blobMatches']:claims[x['claimant']]['gitBlobMatchedTargets'].add(x['target'])
put('producer-claiming-record-index.json',{'scope':'Claimant records structurally reference exact targets; matching hashes/blobs prove bytes only. Producer authority, causal production, correctness, complete historical review and acceptance are not established by references.','records':[{'claimant':p,'claimantSha256':rs[p]['sha256'],'claimantBytes':rs[p]['bytes'],'claimantRole':rs[p]['role'],**{k:sorted(v) for k,v in d.items()}} for p,d in sorted(claims.items())]})

# Historical source/slice reuse stays attributed to the retained 11 reports.
reuse=json.loads((OUT/'source-bound-reuse-proof.json').read_text());hr=RUN/'merge-correction/historical-coverage-reuse';aggregate=hr/'historical-review-aggregate-r1.md';ags=aggregate.read_text()
links=list(dict.fromkeys(re.findall(r'\[R[^]]+\]\((followup-review-[^)]+)\)',ags)))
reuse['attributionEvidence']={'aggregate':fact(aggregate),'method':'Read aggregate identity/matrix prefix only for attribution; 11 raw review reports were not independently semantically reread. Their full byte hashes identify retained attribution artifacts.','reports':[fact(hr/x) for x in links],'retainedScope':'Exactly three former historical obligations, ordinals 9/29/52, 121 sources plus 121 archived slices. Current code, other historical obligations, measurements, acceptance and global readiness are outside this reuse proof.'}
anchor=reuse['frozenHistoricalProductHead'];anchorrec=rs[anchor['manifestPath']]
reuse['archivedManifestAtHead']={'path':anchorrec['path'],'bytes':anchorrec['bytes'],'sha256':anchorrec['sha256'],'expectedSha256':anchor['manifestSha256'],'matches':anchorrec['sha256']==anchor['manifestSha256']}
assert reuse['archivedManifestAtHead']['matches']
put('source-bound-reuse-proof.json',reuse)

# Source local adapter byte bindings: original reports stay committed; adapters
# and the corrective semantic reviews remain pending working-tree artifacts.
ar=RUN/'merge-correction/legacy-adapter-revision2';mp=ar/'reversible-manifest.json';m=json.loads(mp.read_text());receiptp=RUN/'merge-correction/history-registration-receipt.json';receipt=json.loads(receiptp.read_text());checks=[]
for s in m['sources']:
    original=RUN/s['rawArtifact'];rp=str(original.relative_to(ROOT));b=subprocess.check_output(['git','show',HEAD+':'+rp],cwd=ROOT)
    raw=ar/s['rawCopy'];rawb=raw.read_bytes();ret=ar/s['retainedArtifact'];retb=ret.read_bytes();op=RUN/s['retainedArtifact'];opb=op.read_bytes()
    row={'ordinal':s['ordinal'],'source':s['source'],'originalCommittedPath':rp,'originalHead':HEAD,'originalCommittedSha256':sha(b),'originalCommittedBytes':len(b),'rawCopy':fact(raw),'rawExpectedSha256':s['rawSha256'],'rawExpectedBytes':s['rawByteCount'],'rawCopyMatchesOriginalGit':rawb==b,'rawCopyExpectedHashMatches':sha(rawb)==s['rawSha256'],'rawCopyExpectedBytesMatch':len(rawb)==s['rawByteCount'],'retainedProposalAdapter':fact(ret),'retainedExpectedSha256':s['retainedSha256'],'retainedExpectedHashMatches':sha(retb)==s['retainedSha256'],'operationalAdapter':fact(op),'operationalAdapterMatchesReviewedProposal':opb==retb,'mode':s['mode'],'originalCompactRecognition':s.get('originalCompactRecognition'),'parsedOccurrenceCountClaim':s.get('parsedOccurrenceCount'),'supplementalQualificationCountClaim':s.get('supplementalQualificationCount'),'semanticAssessment':'attributed to retained interpretation/review artifacts; no new semantic interpretation performed here','trackedHeadCoverageForPendingAdapter':False}
    for key,hkey in [('metadata','metadataSha256')]:
        if key in s:
            f=ar/s[key];row[key]={'file':fact(f),'expectedSha256':s.get(hkey),'matchesExpected':sha(f.read_bytes())==s.get(hkey)}
    if 'parserExtraction'in s:row['parserExtraction']=fact(ar/s['parserExtraction'])
    checks.append(row)
inputs=[]
for i in m['inputs']:
    f=ar/i['artifact'];inputs.append({**i,'actual':fact(f),'hashMatches':sha(f.read_bytes())==i['sha256']})
reviews=[RUN/'merge-correction/legacy-adapter-initial-review.md',RUN/'merge-correction/legacy-adapter-correction-round-1-rereview.md']
registration={'manifest':fact(mp),'manifestMatchesRegistrationReceipt':sha(mp.read_bytes())==receipt['manifestSha256'],'recordProposals':fact(ar/'finding-source-record-proposals.json'),'recordProposalsMatchRegistrationReceipt':sha((ar/'finding-source-record-proposals.json').read_bytes())==receipt['recordProposalsSha256'],'receipt':fact(receiptp),'registrationReceiptClaims':receipt,'receiptAfterRunHashMatchesCurrentWorkingRun':receipt['afterRunSha256']==sha((RUN/'run.md').read_bytes()),'receiptStateExplanation':'Registration receipt is a historical operation record. Subsequent parent run.md appends may change its current hash; that does not restamp the receipt. Proposal manifest retains its pre-registration proposalOnly/registrationCount state.'}
put('pending-adapter-provenance.json',{'scope':'Byte/provenance inspection of pending 79-source adapter correction only. Raw reports bind to committed HEAD; interpretations, corrected adapters, reviews, registration and operational copies are pending worktree facts and are not added to HEAD semantic coverage.','manifestCountsClaims':m['counts'],'proposalManifestClaims':{'proposalOnly':m['proposalOnly'],'registrationCount':m['registrationCount'],'scope':m['scope']},'inputs':inputs,'reviewArtifacts':[fact(p) for p in reviews],'registration':registration,'sourceCount':len(checks),'allRawCopiesMatchCommittedOriginals':all(x['rawCopyMatchesOriginalGit'] for x in checks),'allOperationalCopiesMatchProposal':all(x['operationalAdapterMatchesReviewedProposal'] for x in checks),'checks':checks})

# Preserve raw earlier selector evidence exactly, with its own original endpoints.
selroot=pathlib.Path('/var/folders/d3/rsgv6zk54y5dd7137_cmcc100000gn/T/task4-refreshed-selection-_d5fzpnr');recp=selroot/'receipt.json';recd=json.loads(recp.read_text());saved=OUT/'retained-selector-evidence';saved.mkdir(exist_ok=True);sources=[('refreshed-receipt.json',recp)]
for tag in ['same-source-after-fix','corrected-product-range']:sources.append((tag+'-review-inputs.json',selroot/tag/'selection/review-inputs.json'))
sources.append(('original-690-review-inputs.json',pathlib.Path(recd['original']['path'])))
facts=[]
for name,p in sources:
    b=p.read_bytes();(saved/name).write_bytes(b);f={**fact(p),'retainedAt':str(saved/name),'retainedSha256':sha((saved/name).read_bytes())}
    if name!='refreshed-receipt.json':
        d=json.loads(b);f.update(base=d['base'],head=d['head'],status=d.get('status'),sourceAvailable=d.get('sourceAvailable'),wholeRangeReady=d.get('wholeRangeReady'),changed=len(d.get('changed',[])),omitted=len(d.get('omitted',[])),gaps=len(d.get('gaps',[])),archiveRecords=len(d.get('archives',[])))
    facts.append(f)
put('selector-evidence-provenance.json',{'scope':'Retained historical selector evidence only. No selector was executed by this inventory. None of these sidecars selects exact HEAD 7b18b0c; 707 is not restamped as a fresh exact-head count. Original gap strings/arrays and zero omissions remain byte-preserved.','exactInventoryBase':BASE,'exactInventoryHead':HEAD,'currentHeadSelectorRun':'not performed or claimed','original690MatchesExpectedSha256':facts[-1]['sha256']==recd['original']['sha256'],'records':facts})

# Explicit gaps are an input queue, not an omission or a declaration of defects.
unassessed=[{'path':p,'sha256':r['sha256'],'bytes':r['bytes'],'role':r['role'],'hasRecordReferences':bool(r.get('pathReferenceIds')),'hasHashMatchedClaim':any(hashes[i]['hashMatches'] for i in r.get('hashClaimIds',[]))}for p,r in rs.items() if r['role']=='retained-reviewable-content-role-not-established']
put('unestablished-role-review-queue.json',{'scope':'These retained paths stay fully reviewable. Their producer/role was not established by this bounded content/record inspection. No clean or omission inference is permitted.','records':unassessed})
print(json.dumps({'producerClaimantRecords':len(claims),'attributedReports':len(links),'pendingAdapterSources':len(checks),'all79RawMatchGit':all(x['rawCopyMatchesOriginalGit'] for x in checks),'all79OperationalCopyMatches':all(x['operationalAdapterMatchesReviewedProposal'] for x in checks),'manifestMatchesReceipt':registration['manifestMatchesRegistrationReceipt'],'recordProposalsMatchReceipt':registration['recordProposalsMatchRegistrationReceipt'],'retainedSelectorEvidenceRecords':len(facts),'unestablishedRolePaths':len(unassessed)},indent=2))
