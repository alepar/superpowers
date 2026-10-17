#!/usr/bin/env python3
"""Read-only Git/content inventory. Writes only this temporary output directory."""
import collections, datetime, hashlib, json, os, pathlib, re, subprocess

ROOT=pathlib.Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
OUT=pathlib.Path('/private/tmp/ufz-correction-final-artifact-inventory')
BASE='832b051c870ae5c69adfa7f14d770292ab6c1a81'
HEAD='7b18b0c26b9f19d531c558e112d490743901a13b'
RUN='docs/superpowers/runs/2026-10-16-workflow-reliability'
SOURCE_MANIFEST=pathlib.Path('/private/tmp/ufz-correction-final-source-review/manifest.json')

def git(*args): return subprocess.check_output(['git',*args],cwd=ROOT)
def sha(b): return hashlib.sha256(b).hexdigest()
def put(name,obj): (OUT/name).write_text(json.dumps(obj,indent=2,ensure_ascii=False)+'\n')
def tree(ref):
    d={}
    for row in git('ls-tree','-rz',ref).split(b'\0'):
        if row:
            m,p=row.split(b'\t',1); mode,typ,oid=m.decode().split();d[p.decode()]={'gitMode':mode,'gitType':typ,'gitBlob':oid}
    return d

started=datetime.datetime.now(datetime.timezone.utc).isoformat()
assert git('rev-parse','HEAD').decode().strip()==HEAD
trees={BASE:tree(BASE),HEAD:tree(HEAD)}
paths=git('diff','--name-only','-z',BASE,HEAD).decode().rstrip('\0').split('\0')
statuses={}
raw=git('diff','--name-status','--no-renames','-z',BASE,HEAD).decode().rstrip('\0').split('\0')
for i in range(0,len(raw),2): statuses[raw[i+1]]=raw[i]
sm=json.loads(SOURCE_MANIFEST.read_bytes()); product={x['path']:x for x in sm['paths']}
assert len(product)==58 and set(product)<=set(paths)
# Cat-file returns exact committed bytes, independent of the evolving working tree.
oids=sorted({trees[HEAD].get(p,trees[BASE].get(p))['gitBlob'] for p in paths})
out=git('cat-file','--batch') if False else subprocess.run(['git','cat-file','--batch'],input=('\n'.join(oids)+'\n').encode(),stdout=subprocess.PIPE,cwd=ROOT,check=True).stdout
contents={};pos=0
for oid in oids:
    end=out.index(b'\n',pos); hdr=out[pos:end].decode().split(); n=int(hdr[2]);pos=end+1
    contents[oid]=out[pos:pos+n];pos+=n+1
del out
allhead_by_blob=collections.defaultdict(list)
base_by_blob=collections.defaultdict(list)
for p,v in trees[HEAD].items(): allhead_by_blob[v['gitBlob']].append(p)
for p,v in trees[BASE].items(): base_by_blob[v['gitBlob']].append(p)
records={}; jsondocs={}; snippets={}
for p in paths:
    t=trees[HEAD].get(p,trees[BASE].get(p));b=contents[t['gitBlob']];h=sha(b)
    rec={'path':p,'status':statuses[p],'bytes':len(b),'sha256':h,**t,'bytesFrom':HEAD if p in trees[HEAD] else BASE,'omitted':False,'semanticAssessment':'not independently assessed by this inventory'}
    if p in product:
        rec.update(role='current-product-source-assigned-to-source-review',sourceReviewGroup=product[p]['group'],sourceReviewManifestHashMatches=h==product[p]['sha256'])
    else: rec['role']='retained-unclassified-reviewable-content'
    if p.endswith('.json'):
        try:
            doc=json.loads(b);jsondocs[p]=doc
            rec['contentFormat']='json';rec['jsonTopLevel']=list(doc.keys()) if isinstance(doc,dict) else type(doc).__name__
        except (ValueError,UnicodeDecodeError):rec['contentFormat']='nonparseable-json-named-file'
    elif b'\0' in b[:8192]:rec['contentFormat']='binary-or-nul-bearing'
    else:
        rec['contentFormat']='text'; s=b[:4096].decode('utf8','replace');snippets[p]=s
        rec['firstNonemptyLine']=next((x[:240] for x in s.splitlines() if x.strip()),'')
    records[p]=rec

# Collect structurally addressed path claims. Path resolution records all actual
# plausible candidates and does not turn a bare reference into validated lineage.
refs=[];hashclaims=[];blobclaims=[];claim_sources=set();duplicateids={}
def resolve(s,claimant):
    if not isinstance(s,str) or len(s)>1500 or '\n' in s or '\0' in s:return []
    s=s.removeprefix('file://')
    root=str(ROOT)+'/'
    if s.startswith(root):s=s[len(root):]
    candidates=[s,str(pathlib.PurePosixPath(claimant).parent/s),RUN+'/'+s]
    for parent in pathlib.PurePosixPath(claimant).parents:
        if str(parent).startswith(RUN):candidates.append(str(parent/s))
    result=[]
    for c in candidates:
        c=os.path.normpath(c)
        if c in records and c not in result:result.append(c)
    return result

pathkeys={'path','archive','artifact','copy','file','durablePath','safeRelativePath','descriptorRelativePath','currentGitPath','capturedPath','retainedPath','reportPath','sourcePath','source','rawSource','original','originalPath','manifestPath','packagePath','extractionPath','payloadPath','stdout','stderr','log','report','evidence','input','output','promptPath','receipt'}
hashkeys=['sha256','SHA256','hash','expectedSha256','currentSha256','reportSha256','sourceSha256','rawSha256','manifestSha256','descriptorSHA256','outputSha256','inputSha256']
def scan(obj,claimant,pointer='',origin='tracked-json'):
    if isinstance(obj,dict):
        hv=next((obj[k] for k in hashkeys if isinstance(obj.get(k),str) and re.fullmatch('[0-9a-f]{64}',obj[k])),None)
        n=next((obj[k] for k in ['bytes','expectedBytes','size','byteCount'] if type(obj.get(k)) is int),None)
        for k,v in obj.items():
            loc=pointer+'/'+str(k).replace('~','~0').replace('/','~1')
            candidates=resolve(v,claimant) if k in pathkeys or k.lower().endswith(('path','file','report','manifest','receipt')) else []
            # Hash maps can use actual repository/relative file paths as keys.
            kc=resolve(k,claimant)
            if kc and isinstance(v,str) and re.fullmatch('[0-9a-f]{64}',v):
                for q in kc:
                    hashclaims.append({'claimant':claimant,'pointer':loc,'target':q,'expectedSha256':v,'observedSha256':records[q]['sha256'],'hashMatches':v==records[q]['sha256'],'origin':origin})
                    refs.append({'claimant':claimant,'pointer':loc,'target':q,'reference':k,'field':'map-key','origin':origin,'relationship':'explicit-hash-map-key-reference'})
            if kc and isinstance(v,str) and re.fullmatch('[0-9a-f]{40}',v):
                for q in kc:
                    blobclaims.append({'claimant':claimant,'pointer':loc,'target':q,'expectedGitBlob':v,'observedGitBlob':records[q]['gitBlob'],'blobMatches':v==records[q]['gitBlob'],'origin':origin})
                    refs.append({'claimant':claimant,'pointer':loc,'target':q,'reference':k,'field':'map-key','origin':origin,'relationship':'explicit-git-blob-map-key-reference'})
            for q in candidates:
                if q==claimant:continue
                ref={'claimant':claimant,'pointer':loc,'field':k,'reference':v,'target':q,'origin':origin,'relationship':'explicit-path-reference-only'}
                # Hash binds the record to an object, not every path mentioned in it.
                # Restrict to representation/output keys (never original/source inputs).
                if hv and k in {'path','archive','artifact','copy','durablePath','currentGitPath','safeRelativePath','descriptorRelativePath','retainedPath','capturedPath','file'}:
                    c={**ref,'expectedSha256':hv,'observedSha256':records[q]['sha256'],'hashMatches':hv==records[q]['sha256']}
                    if n is not None:c.update(expectedBytes=n,observedBytes=records[q]['bytes'],bytesMatch=n==records[q]['bytes'])
                    hashclaims.append(c)
                refs.append(ref);claim_sources.add(claimant)
            scan(v,claimant,loc,origin)
    elif isinstance(obj,list):
        for i,v in enumerate(obj):
            if isinstance(v,str):
                for q in resolve(v,claimant):
                    if q!=claimant:refs.append({'claimant':claimant,'pointer':pointer+'/'+str(i),'target':q,'reference':v,'field':'array-member','origin':origin,'relationship':'explicit-path-array-reference-only'})
            scan(v,claimant,pointer+'/'+str(i),origin)
for p,d in jsondocs.items():scan(d,p)
for p in paths:
    if pathlib.PurePosixPath(p).name=='run.md':
        b=contents[records[p]['gitBlob']]
        for i,line in enumerate(b.decode('utf8','replace').splitlines(),1):
            if ' · {' in line:
                try:scan(json.loads(line.split(' · ',1)[1]),p,'line:'+str(i),'embedded-run-record')
                except ValueError:pass

bytarget=collections.defaultdict(list);hashbytarget=collections.defaultdict(list);blobbytarget=collections.defaultdict(list)
for i,x in enumerate(refs):bytarget[x['target']].append(i)
for i,x in enumerate(hashclaims):hashbytarget[x['target']].append(i)
for i,x in enumerate(blobclaims):blobbytarget[x['target']].append(i)
duplicate_groups=[];byhash=collections.defaultdict(list)
for p,rec in records.items():byhash[rec['sha256']].append(p)
for h,ps in sorted(byhash.items()):
    if len(ps)>1:
        ident='duplicate-'+str(len(duplicate_groups)+1)
        duplicate_groups.append({'id':ident,'sha256':h,'bytes':records[ps[0]]['bytes'],'paths':ps,'meaning':'exact byte identity at captured Git range; no shared producer or semantic equivalence asserted'})
        for p in ps:duplicateids[p]=ident

# Recheck all 242 source/slice members against their retained attributed proof.
reusepath=ROOT/RUN/'merge-correction/historical-coverage-reuse/content-identity-at-7fc5a4dd.json'
reusebytes=reusepath.read_bytes();reuse=json.loads(reusebytes);reusechecks=[]
for old in reuse['checks']:
    p=old['currentGitPath'];rec=records.get(p)
    if rec is None and p in trees[HEAD]:
        b=git('show',HEAD+':'+p);rec={'sha256':sha(b),'bytes':len(b),'gitBlob':trees[HEAD][p]['gitBlob']}
    reusechecks.append({**old,'verifiedAtHead':HEAD,'headAvailable':rec is not None,'headSha256':rec['sha256'] if rec else None,'headBytes':rec['bytes'] if rec else None,'matchesAtHead':bool(rec and rec['sha256']==old['expectedSha256'] and rec['bytes']==old['expectedBytes'])})
reuse_members={x['currentGitPath'] for x in reusechecks if x['matchesAtHead']}
put('source-bound-reuse-proof.json',{'purpose':'Byte identity continuation only. Original 11 reviewers retain attribution. No fresh semantic read, new whole-range coverage, omission authority or acceptance is asserted.','head':HEAD,'priorProofPath':str(reusepath.relative_to(ROOT)),'priorProofState':'working-tree pending/untracked at inventory start','priorProofBytes':len(reusebytes),'priorProofSha256':sha(reusebytes),'priorScope':reuse.get('scope'),'frozenHistoricalProductHead':reuse.get('frozenHistoricalProductHead'),'originalParentRead':reuse.get('parentRead'),'checks':reusechecks,'checksCount':len(reusechecks),'matchesAtHead':sum(x['matchesAtHead'] for x in reusechecks),'failureCount':sum(not x['matchesAtHead'] for x in reusechecks)})

# Content-informed role triage is not an archive exclusion or semantic finding.
for p,rec in records.items():
    if p in product:continue
    name=pathlib.PurePosixPath(p).name;s=snippets.get(p,'');keys=set(rec.get('jsonTopLevel',[])) if isinstance(rec.get('jsonTopLevel'),list) else set()
    hasrefs=bool(bytarget[p]);hmatch=any(hashclaims[i]['hashMatches'] for i in hashbytarget[p])
    rec['pathReferenceIds']=bytarget[p];rec['hashClaimIds']=hashbytarget[p];rec['gitBlobClaimIds']=blobbytarget[p]
    if p in duplicateids:rec['exactDuplicateGroup']=duplicateids[p]
    # The base-tree identical object proves a captured source copy can be compared
    # to a preexisting Git blob; it does not grant an archive authority.
    source_matches=[q for q in base_by_blob[rec['gitBlob']] if q.startswith(('skills/','tests/','scripts/')) or q in ['AGENTS.md','CLAUDE.md']]
    current_matches=[q for q in allhead_by_blob[rec['gitBlob']] if q.startswith(('skills/','tests/','scripts/')) or q in ['AGENTS.md','CLAUDE.md']]
    if source_matches or current_matches:
        rec['role']='retained-source-copy-exact-git-blob-identity'
        rec['sourceGitIdentity']={'base':BASE,'basePaths':source_matches,'head':HEAD,'headPaths':current_matches,'meaning':'byte identity only; not producer lineage, current review coverage or omission authorization'}
    elif p in reuse_members:rec['role']='retained-source-or-slice-prior-review-attributed-byte-identity'
    elif p.startswith(('docs/superpowers/specs/','docs/superpowers/plans/')):rec['role']='primary-design-plan-or-index-review-needed'
    elif keys & {'sourceBlobs','representations','archiveRoot','sourceTree','artifacts','files','entries'} and ('manifest' in name or 'map' in name or 'inventory' in name):rec['role']='retained-producer-or-capture-manifest-claims'
    elif keys & {'exitCode','command','stdout','stderr','checks','results','configuration','returncode'}:rec['role']='retained-probe-or-measurement-receipt-claims'
    elif name=='run.md' and ('approvals:' in s or 'phase:' in s or 'super-auto run' in s):rec['role']='retained-run-state-and-authority-claims'
    elif s.startswith(('#!','//','import ','from ','const ','function ')) or name.endswith(('.mjs','.js','.py','.sh','.cjs')):rec['role']='retained-reconstructing-or-probe-source-reviewable'
    elif rec['contentFormat']=='binary-or-nul-bearing':rec['role']='retained-binary-or-packed-evidence-needs-format-specific-assessment'
    elif keys & {'findings','verdict','occurrences','extractionComplete','findingEvidence','coverage','judgments','summary'}:rec['role']='retained-review-extraction-or-coverage-claims'
    elif name.endswith('.diff') and (s.startswith('diff --git') or '@@ ' in s):rec['role']='retained-derived-diff-review-input'
    elif name.endswith(('.md','.txt')) and (s.lstrip().startswith('#') or re.search(r'\b(Blocking|Must-fix|verdict|review|scope|Source|PASS|FAIL)\b',s)):rec['role']='retained-human-readable-review-design-or-evidence-claims'
    elif name.endswith(('.log','.stdout','.stderr','.jsonl')) or rec['bytes']==0:rec['role']='retained-raw-output-or-empty-artifact'
    elif hasrefs:rec['role']='retained-data-with-explicit-record-reference'
    else:rec['role']='retained-reviewable-content-role-not-established'
    rec['roleBasis']={'contentFormat':rec['contentFormat'],'contentHeaderOrSchemaObserved':rec['contentFormat']!='binary-or-nul-bearing','hasExplicitClaimingRecord':hasrefs,'hasMatchingHashClaim':hmatch,'directoryAloneDoesNotAuthorizeOmission':True}
    if p in reuse_members:rec['semanticAssessment']='prior reviewer attributed scope retained; byte identity rechecked here; no fresh semantic read'

put('path-references.json',{'scope':'Structural references only, including ambiguous relative matches; not omission authorization or assertion that producer claims are true.','records':refs})
put('hash-provenance-claims.json',{'scope':'Explicit record path/hash pairs rechecked against captured Git bytes. Matches prove identity only; provenance/meaning and claimant authority remain reviewable. Mismatches are retained without assuming defect; some generic record hashes describe another representation.','records':hashclaims})
put('git-blob-provenance-claims.json',{'scope':'Explicit map keys with Git object IDs rechecked against this range. Object mismatch may be a historical revision; no source drift inference without claimant binding.','records':blobclaims})
put('exact-byte-duplicate-groups.json',{'head':HEAD,'groups':duplicate_groups})
put('tracked-path-inventory.json',{'version':1,'createdUtc':started,'root':str(ROOT),'base':BASE,'head':HEAD,'headTree':git('rev-parse',HEAD+'^{tree}').decode().strip(),'pathCoverageMeaning':'Every changed tracked path observed and hashed from immutable Git bytes. Not semantic whole-range review, omission authority, test rerun, validity of historical claims, or global readiness.','codeSourceManifest':{'path':str(SOURCE_MANIFEST),'sha256':sha(SOURCE_MANIFEST.read_bytes()),'paths':58,'allHashMatches':all(records[p]['sourceReviewManifestHashMatches'] for p in product)},'changedPathCount':len(paths),'otherPathCount':len(paths)-len(product),'omissions':0,'records':[records[p] for p in paths]})

# Separate evolving parent material: never assign it tracked-HEAD coverage.
pending=[]
pending_paths=set(git('ls-files','--others','--exclude-standard','-z').decode().rstrip('\0').split('\0'))|set(git('diff','--name-only','-z',HEAD).decode().rstrip('\0').split('\0'))
for p in sorted(pending_paths-{''}):
    f=ROOT/p
    if f.is_file():
        b=f.read_bytes();entry={'path':p,'bytes':len(b),'sha256':sha(b),'state':'tracked-working-tree-modified' if p in trees[HEAD] else 'untracked-working-tree','trackedHeadCoverage':False,'semanticAssessment':'not independently assessed by this inventory'}
        if p in trees[HEAD]:entry.update(headGitBlob=trees[HEAD][p]['gitBlob'],headSha256=records[p]['sha256'] if p in records else sha(git('show',HEAD+':'+p)))
        try:
            if p.endswith('.json'):
                d=json.loads(b);entry['jsonTopLevel']=list(d) if isinstance(d,dict) else type(d).__name__
        except (ValueError,UnicodeDecodeError):pass
        pending.append(entry)
put('pending-working-tree-inventory.json',{'capturedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'head':HEAD,'note':'Snapshot of parent working tree only. Concurrent additions/edits after capture require refreshed inventory. These paths are not covered by tracked-HEAD inventory or semantic claims.','records':pending})

priority=[]
for p,rec in records.items():
    if p in product:continue
    name=pathlib.PurePosixPath(p).name
    if rec['role']=='primary-design-plan-or-index-review-needed' or name in {'AGENTS.md','CLAUDE.md','MAINTENANCE.md','README.md','INDEX.md','SKILL.md'}:
        priority.append({'path':p,'sha256':rec['sha256'],'bytes':rec['bytes'],'role':rec['role'],'priorAttributedReuse':p in reuse_members,'exactGitSourceCopy':rec.get('sourceGitIdentity'),'reviewNeed':'Assess as substantive documentation/source or explicitly bind attributed coverage; never omit from directory/name alone.'})
put('substantive-document-review-queue.json',{'scope':'Content role triage only; candidates include archived source copies and substantive docs. No fresh substantive review is claimed.','records':priority})
summary={'createdUtc':started,'base':BASE,'head':HEAD,'trackedChangedPaths':len(paths),'codeSourcePartition':len(product),'otherTrackedPaths':len(paths)-len(product),'allPathsHashed':all('sha256'in x for x in records.values()),'sourcePartitionHashesMatch':all(records[p]['sourceReviewManifestHashMatches'] for p in product),'roles':dict(collections.Counter(x['role'] for x in records.values())),'explicitPathReferences':len(refs),'pathsWithExplicitReference':sum(bool(bytarget[p]) for p in records),'hashClaims':len(hashclaims),'matchingHashClaims':sum(x['hashMatches'] for x in hashclaims),'pathsWithMatchingHashClaim':sum(any(hashclaims[i]['hashMatches'] for i in hashbytarget[p]) for p in records),'gitBlobClaims':len(blobclaims),'matchingGitBlobClaims':sum(x['blobMatches'] for x in blobclaims),'exactDuplicateGroups':len(duplicate_groups),'duplicateMemberPaths':len(duplicateids),'priorAttributedReuseChecks':len(reusechecks),'priorAttributedReuseMatching':sum(x['matchesAtHead'] for x in reusechecks),'priorAttributedReuseUniqueChangedPaths':len(reuse_members&set(paths)),'pendingWorkingTreePaths':len(pending),'substantiveDocumentationCandidates':len(priority),'omissionsAuthorizedByThisInventory':0,'wholeBranchReadiness':'not assessed; this inventory cannot certify it'}
put('summary.json',summary)
print(json.dumps(summary,indent=2))
