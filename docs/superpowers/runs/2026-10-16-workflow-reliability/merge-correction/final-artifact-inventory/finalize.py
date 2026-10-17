#!/usr/bin/env python3
import collections,datetime,hashlib,json,pathlib,subprocess
ROOT=pathlib.Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers');OUT=pathlib.Path('/private/tmp/ufz-correction-final-artifact-inventory');HEAD='7b18b0c26b9f19d531c558e112d490743901a13b';BASE='832b051c870ae5c69adfa7f14d770292ab6c1a81'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
def put(n,d):(OUT/n).write_text(json.dumps(d,indent=2)+'\n')
inv=json.loads((OUT/'tracked-path-inventory.json').read_text());rs={x['path']:x for x in inv['records']};s=json.loads((OUT/'summary.json').read_text());source=json.loads(pathlib.Path('/private/tmp/ufz-correction-final-source-review/manifest.json').read_text());sourcepaths={x['path']for x in source['paths']};nowpaths=set(git('diff','--name-only','-z',BASE,HEAD).decode().rstrip('\0').split('\0'))
assert set(rs)==nowpaths and len(rs)==8476 and len(sourcepaths)==58
assert all(rs[x['path']]['sha256']==x['sha256']for x in source['paths'])
# Refresh only the explicitly pending workspace snapshot. No tracked coverage is
# inferred for any new parent artifact, even if its content duplicates a Git blob.
tracked=set(git('ls-tree','-rz','--name-only',HEAD).decode().rstrip('\0').split('\0'));ps=set(git('ls-files','--others','--exclude-standard','-z').decode().rstrip('\0').split('\0'))|set(git('diff','--name-only','-z',HEAD).decode().rstrip('\0').split('\0'));pending=[]
for p in sorted(ps-{''}):
    f=ROOT/p
    if not f.is_file():continue
    pre=f.stat();b=f.read_bytes();post=f.stat();r={'path':p,'bytes':len(b),'sha256':sha(b),'state':'tracked-working-tree-modified'if p in tracked else'untracked-working-tree','trackedHeadCoverage':False,'stableDuringRead':pre.st_size==post.st_size and pre.st_mtime_ns==post.st_mtime_ns,'semanticAssessment':'not independently assessed by this inventory'}
    if p in tracked:r.update(headGitBlob=rs[p]['gitBlob']if p in rs else git('rev-parse',HEAD+':'+p).decode().strip(),headSha256=rs[p]['sha256']if p in rs else sha(git('show',HEAD+':'+p)))
    if p.endswith('.json'):
        try:d=json.loads(b);r['jsonTopLevel']=list(d)if isinstance(d,dict)else type(d).__name__
        except(ValueError,UnicodeDecodeError):pass
    pending.append(r)
capture=datetime.datetime.now(datetime.timezone.utc).isoformat()
put('pending-working-tree-inventory.json',{'capturedUtc':capture,'comparedWithHead':HEAD,'observedCheckoutHead':git('rev-parse','HEAD').decode().strip(),'note':'Concurrent parent work is evolving. These exact bytes are a separate pending snapshot, never tracked-HEAD coverage. Refresh after any later parent edit or final freeze.','records':pending})
s['pendingWorkingTreePaths']=len(pending);s['pendingCapturedUtc']=capture;s['producerClaimingRecords']=len(json.loads((OUT/'producer-claiming-record-index.json').read_text())['records']);put('summary.json',s)
reuse=json.loads((OUT/'source-bound-reuse-proof.json').read_text());assert len(reuse['checks'])==242 and all(x['matchesAtHead']for x in reuse['checks'])
ad=json.loads((OUT/'pending-adapter-provenance.json').read_text());assert ad['sourceCount']==79 and ad['allRawCopiesMatchCommittedOriginals'] and ad['allOperationalCopiesMatchProposal']
packed=json.loads((OUT/'packed-evidence-inventory.json').read_text())['records']
assert all(x.get('decodedHashMatches',True)and x.get('decodedBytesMatch',True)and x.get('allMemberChecksMatch',True)and x.get('regularMemberSetEqualsDescriptor',True)for x in packed)
selector=json.loads((OUT/'selector-evidence-provenance.json').read_text());assert selector['original690MatchesExpectedSha256']
for x in selector['records']:assert x['sha256']==sha(pathlib.Path(x['retainedAt']).read_bytes())
assert all(not x['omitted']for x in rs.values())
put('inventory-self-check.json',{'capturedUtc':capture,'kind':'Read-only consistency check of generated inventory and existing evidence; no repository tests executed','exactChangedSetEquality':True,'trackedChangedPaths':8476,'sourcePartitionPathCount':58,'sourcePartitionHashMatches':True,'otherTrackedPaths':8418,'all242PriorMembersMatch':True,'all79PendingRawCopiesMatchCommittedReports':True,'all79OperationalAdapterCopiesMatchProposal':True,'retainedSelectorEvidenceHashesMatch':True,'noOmissionsAuthorized':True,'noProductGitRunHerdrTrackerOrIndexWrites':True,'onlyWrites':'/private/tmp/ufz-correction-final-artifact-inventory/','independentSemanticWholeRangeReview':False,'wholeBranchReadyAuthority':False})
dirty=[x for x in pending if x['state']=='tracked-working-tree-modified'];dirtytable='\n'.join('| `'+x['path']+'` | '+str(x['bytes'])+' | `'+x['sha256']+'` |'for x in dirty)
roles='\n'.join('| '+k+' | '+str(v)+' |'for k,v in s['roles'].items())
report=f'''# Final artifact path/provenance inventory, bounded scope

Exact committed range: `{BASE}..{HEAD}`. All **8,476** changed tracked paths are observed, retained and hashed from immutable Git bytes. The existing 58-path source-review manifest matches all 58 committed hashes; **8,418 other paths** have individual path/size/SHA-256/Git-object/role records. This establishes path coverage and byte identity only. It does not certify semantic coverage, archive omission authority, a clean branch, root acceptance or whole-range readiness.

No repository tests, source edits, canonical run writes, Git changes, Herdr operations, tracker writes, or index writes were performed. All outputs are in this temporary directory. Read `tracked-path-inventory.json` as the complete path map; the remaining files add evidence relationships without silently excluding any path.

## What the retained files represent

The role labels use observed text headers/JSON structure and actual source-object identity, with claimant references recorded independently. Directory names alone never authorize omission. Even the 18 paths whose role was not established remain reviewable content in `unestablished-role-review-queue.json`.

| Observed role | Paths |
| --- | ---: |
{roles}

The 3,851 source-copy paths have exact Git blob identity with a product source path at the captured base or head. `sourceGitIdentity` names the commit and source paths. This proves a byte comparison target; it does not establish who copied it, that its historical invocation used it, or that reviewing the current product implies review of its surrounding archive. There are 1,141 exact-byte duplicate groups involving 6,374 changed paths; `exact-byte-duplicate-groups.json` is a complete member map. Equal bytes do not authorize omissions or transfer semantic findings between unrelated contexts.

## Producer, claiming-record and packed-artifact evidence

`producer-claiming-record-index.json` names 293 actual committed records and their referenced target sets. `path-references.json` retains 35,241 structural references; 8,430 changed paths are targets of an explicit record/array/hash-map reference. Bare path reference is recorded separately from a matching hash or Git object ID.

`hash-provenance-claims.json` records 7,551 candidate record/path/hash comparisons: 7,248 match, covering 6,301 target paths. The 303 nonmatching candidate comparisons remain visible. Relative resolution can yield several real candidates, and a record may describe an earlier representation; these observations are not automatically defects or valid current provenance. `git-blob-provenance-claims.json` records 1,408 explicit Git-map comparisons, 1,378 matching and 30 differing at this head. Historical revision differences remain unadjudicated.

Concrete large producer records include the roast-pr-1 `durable-path-map.json` (4,106 referenced targets with matching hashes), `fix-r1-handoff/archive-manifest.json` (714 matched targets), and the post-cap audit `artifact-source-hash-map.json` (621 matched targets). These are substantive producer/retention claims, not authority inferred from an archive directory. The historical selector sidecar's large changed-path array is only a declared range, not evidence that its 5,587 targets were semantically reviewed.

`packed-evidence-inventory.json` inventories all ten binary/packed artifacts. The two gzip diffs decode to exactly the byte counts/SHA-256 claimed by their respective packaging manifests: 136,599,903 bytes for `authored.diff.gz`, and 65,197,934 for `captured.diff.gz`. All four inert Git metadata tars have exact regular-member set/hash/byte agreement with their retained descriptors. The four captured seat-worktree tar paths (two exact-byte duplicate pairs) have explicit member inventories. No archive was extracted to disk or executed; no decoded diff semantic review is claimed.

## Historical review attribution retained, not re-created

`source-bound-reuse-proof.json` rechecks **242/242** prior-proof members at exact head `{HEAD}`: 121 original source files and 121 archived slices, all unchanged against expected bytes and SHA-256. The proof retains its frozen historical range, original ordinal/member identities, limits, aggregate report hash, and hashes of the **11** attributed review reports. The inherited scope is exactly the three former obligations at cluster ordinals 9, 29 and 52. I read the aggregate identity/matrix portion for attribution and did not independently semantically reread those 11 reports or 242 members. This cannot supply current implementation review, other historical obligations, new measurements or whole-branch readiness.

## Pending parent work is separate

`pending-working-tree-inventory.json` snapshots **{len(pending)}** pending paths at `{capture}`; later parent edits require another freeze. None receives tracked-head review coverage. The modified committed documents at this snapshot are:

| Working-tree path | Pending bytes | Pending SHA-256 |
| --- | ---: | --- |
{dirtytable}

`pending-adapter-provenance.json` separately binds all **79** original raw reports to their exact committed Git bytes at `{HEAD}`, their complete pending raw copies, corrected proposal adapters, metadata/extraction artifacts, and operational copies under `legacy-report-adapters-r1`. Every raw copy equals its committed original, and every operational adapter equals its corrected proposal. All ten declared interpretation/review inputs match their manifest hashes. The corrected manifest and finding-source proposal hashes match the registration receipt. Interpretation, initial failure, correction re-review and registration are still attributed to their retained artifacts; no new semantic extraction, applicability, identity merge, finding disposition or root approval follows here.

The proposal manifest intentionally retains its pre-registration `proposalOnly:true`/`registrationCount:0` state; the later receipt separately claims registration of 79 sources and 213 occurrences while preserving the 73 original sources. Its `afterRunSha256` no longer equals the evolving current run.md, so the receipt is retained as a historical operation record, not restamped as current-run identity. The receipt preserves the 29 strict supplements and 35 source gaps; this inventory does not discharge them.

## Original selection gaps are retained with their own endpoints

`retained-selector-evidence/` contains exact copies of the original 690-gap sidecar and the two Task 4 refreshed 707-gap sidecars, plus their receipt. `selector-evidence-provenance.json` binds original paths, full endpoints, sizes and hashes. The original sidecar remains SHA-256 `c838e1390ca298afea5a1d8d5e4f5b2b6a74ab696ba8768d7e7780f39ff4707e` with 5,587 changed paths and zero omissions. The corrected-product-range sidecar is `d84541ae…480f7a23`, with 8,725 changed paths, 707 gaps, zero omissions, `sourceAvailable:true`, `wholeRangeReady:false`. The same-source-after-fix sidecar is `832b051c…583f2486`, with 8,469 changed paths and the same 707/zero counts.

**No selector was run at `{HEAD}` by this inventory.** The earlier 707 count is not a fresh exact-head count. All original gap strings and failed/unavailable status are preserved; this inventory authorizes zero omissions and removes no historical requirement. The policy review under RUN/merge-correction was read and its distinction between independently readable Git source and unavailable omission authority is preserved.

## Remaining review input and authority boundaries

Three primary committed documents need substantive review or explicitly attributed coverage: `docs/superpowers/plans/2026-10-17-workflow-reliability-merge-correction.md`, `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, and `docs/superpowers/specs/INDEX.md`. Their exact committed hashes are in the main inventory; their pending edits are separately identified above.

`substantive-document-review-queue.json` names 364 actual normative-looking documentation/source candidates: 253 exact source copies, 107 human-readable archived claim documents, three primary documents, and one referenced data document. This includes archived AGENTS/CLAUDE/MAINTENANCE/README/INDEX/SKILL content rather than exempting it by pathname. The queue is triage for a reviewer, not a demand that duplicate bytes be reread or a declaration that archived content changes current policy. Parent/global reviewer must choose and justify coverage using exact content, provenance and already attributed reviews.

The 459 reconstructing/probe source artifacts, 1,460 human-readable report/design/evidence claims, extraction/state/measurement records, and the remaining raw/derived artifacts have been inventoried for role and provenance, not newly semantically validated. Explicit hashes prove preserved bytes; they do not prove experimental validity, completeness of old source populations, sufficient resolution of findings, or the truth of historical reports. The 58 current-source review assignments are also assignments, not verdicts supplied by this inventory. Parent/global reviewer must integrate actual source reviews, historical scopes, retained gaps, measurement evidence and pending final documentation. This bounded inventory cannot certify the whole branch.

`inventory-self-check.json` records exact changed-set equality and the byte-binding consistency checks. `artifact-manifest.json` hashes this output package. No all-clean verdict is issued.
'''
(OUT/'REPORT.md').write_text(report)
files=[]
for p in sorted(OUT.rglob('*')):
    if p.is_file()and p.name!='artifact-manifest.json':b=p.read_bytes();files.append({'path':str(p.relative_to(OUT)),'bytes':len(b),'sha256':sha(b)})
put('artifact-manifest.json',{'createdUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Temporary bounded inventory package only; no global readiness or omission authority','files':files})
print(json.dumps({'trackedPaths':len(rs),'pendingSnapshotPaths':len(pending),'outputFiles':len(files)+1,'outputBytes':sum(x['bytes']for x in files),'report':str(OUT/'REPORT.md')},indent=2))
