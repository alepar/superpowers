#!/usr/bin/env python3
import collections,datetime,hashlib,json,pathlib,subprocess
ROOT=pathlib.Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers');OUT=pathlib.Path('/private/tmp/ufz-correction-final-artifact-inventory-c216');OLD=pathlib.Path('/private/tmp/ufz-correction-final-artifact-inventory');HEAD='c21681200aac20fb0223b6b0e83e953b1bc75cde';PREV='7b18b0c26b9f19d531c558e112d490743901a13b';BASE='832b051c870ae5c69adfa7f14d770292ab6c1a81';RUN='docs/superpowers/runs/2026-10-16-workflow-reliability/';MC=RUN+'merge-correction/'
def sha(b):return hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
def put(n,d):(OUT/n).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
full=json.loads((OUT/'complete-final-path-inventory.json').read_text());rs={x['path']:x for x in full['records']};delta=json.loads((OUT/'delta-path-inventory.json').read_text());ds={x['path']:x for x in delta['records']};s=json.loads((OUT/'summary.json').read_text());reuse=json.loads((OUT/'historical-review-and-role-reuse-proof.json').read_text());sources=json.loads((OUT/'final-source-partition.json').read_text());oldad=json.loads((OLD/'pending-adapter-provenance.json').read_text());oldrole=json.loads((OLD/'role-assessment-addendum.json').read_text())
# Rebind the eleven attributed reviewer reports themselves, not only their members.
reportchecks=[]
for x in reuse['prior11AttributedReports']['reports']:
    p=x['path'].removeprefix(str(ROOT)+'/');r=rs[p];reportchecks.append({'path':p,'expectedSha256':x['sha256'],'actualSha256':r['sha256'],'expectedBytes':x['bytes'],'actualBytes':r['bytes'],'sameBytes':x['sha256']==r['sha256']and x['bytes']==r['bytes']})
reuse['prior11AttributedReportFinalChecks']=reportchecks
extraad=[]
for key in ['manifest','recordProposals','receipt']:
    x=oldad['registration'][key];p=x['path'].removeprefix(str(ROOT)+'/');r=rs[p];extraad.append({'kind':key,'path':p,'expectedSha256':x['sha256'],'actualSha256':r['sha256'],'sameBytes':x['sha256']==r['sha256']})
reuse['adapterRegistrationArtifactChecks']=extraad
put('historical-review-and-role-reuse-proof.json',reuse)

# Exact byte matches make prior review/role evidence available without merging
# identities or treating every raw draft as a formal settled finding.
coverage_by_hash=collections.defaultdict(list)
for x in reuse['historical79Checks']:
    for kind in ['original','rawCopy']:
        coverage_by_hash[x[kind]['sha256']].append({'kind':'attributed-complete-original-report-interpretation','source':x['source'],'originalPath':x['original']['path'],'scope':'Original79 full raw interpretations; unchanged byte identity only. No new finding identity/disposition/current applicability follows.'})
    for kind in ['proposalAdapter','operationalAdapter']:
        coverage_by_hash[x[kind]['sha256']].append({'kind':'attributed-reviewed-qualified-representation','source':x['source'],'originalPath':x['original']['path'],'scope':'Corrected representation fidelity/review only; original failure/unknown verdicts/gaps preserved. Not current acceptance.'})
for x in reuse['historical242Checks']:coverage_by_hash[x['actualSha256']].append({'kind':'attributed-former-historical-obligation-member','path':x['path'],'ordinal':x['ordinal'],'index':x['index'],'memberKind':x['kind'],'scope':'Prior11 attributed historical reviews only. Matching bytes do not merge source identities or extend to current code/measurement.'})
for x in oldrole['unestablishedArtifactRecords']:coverage_by_hash[x['sha256']].append({'kind':'prior-bounded-artifact-role-assessment','path':x['path'],'scope':x['readScope'],'limit':x['limitsAndRemainingClaim']})
queue=json.loads((OUT/'semantic-claim-queue.json').read_text());eligible=0
for x in queue['records']:
    if x['sha256']in coverage_by_hash:
        # Deduplicate provenance entries repeated through operational/proposal copies.
        rows={json.dumps(v,sort_keys=True):v for v in coverage_by_hash[x['sha256']]};x['availablePriorAttributedByteScopes']=list(rows.values());eligible+=1
put('semantic-claim-queue.json',queue)

# Full read of both changed primary documents, a role/claim assessment rather than
# a replacement global source/gate review.
plan='docs/superpowers/plans/2026-10-17-workflow-reliability-merge-correction.md';spec='docs/superpowers/specs/2026-10-16-workflow-reliability-design.md'
docassessment={'head':HEAD,'readScope':'Both complete committed bodies read from git show at c216; no truncation. Source-code diff/stat and new helper/test headers read for role only, not independent product audit. Task6 review-round1/round2 full reports read; implementation report-after-round2 source/round sections inspected, not claimed full body review.','documents':[{'path':plan,'bytes':rs[plan]['bytes'],'sha256':rs[plan]['sha256'],'actualTextBasis':['Tasks1–5 checked, five Task6 acceptance/measurement/review/merge checkboxes remain open.','Final-source-freeze paragraph pins4911223a and explicitly says scoped re-review pending at that entry.','Later measurements, exact-ref dispositions, behavior assessment and merge facts belong append-only in RUN/SDD; later run-only commits require outside-run equality proof.','Authorization remains local merge after gates; no push/release/external filing or waiver.'],'assessment':'The plan records a source freeze and pending gates, not completed global acceptance. Historical failures/pinned policy/source identities remain explicit.'},{'path':spec,'bytes':rs[spec]['bytes'],'sha256':rs[spec]['sha256'],'actualTextBasis':['Original five invariants remain intact.','Dated authorized-correction note attributes two policy resolutions to independent policy review and enumerates bounded scheduler/collection/recovery/selection/sync/cleanup/metrics repairs.','At that entry, representative after evaluations, actual interrupted-helper exercise, combined-source verification, final whole-branch review and real root gate remain pending.','Earlier37 commands stay bound to their old source; fallback/text decisions cannot substitute for required live checks.'],'assessment':'Note is an attributed implementation/policy history with explicit temporal limits. It supplies no current final measurement or root-pass claim; source correctness still belongs to actual scoped reviewers.'}],'unchangedPrimaryIndex':{'path':'docs/superpowers/specs/INDEX.md','sha256':rs['docs/superpowers/specs/INDEX.md']['sha256'],'role':'unchanged primary catalog; original global-composer ownership retained, not independently reread here'},'remainingClaimAuthority':'Parent/global composer integrates scoped source reviews, future source-bound measurements, actual continuity evidence and current gate. No branch-ready or omission authority is conferred.'}
put('primary-document-read-assessment.json',docassessment)

# Preserve selector scope: the existing evidence remains historical at its own refs.
sel=json.loads((OLD/'selector-evidence-provenance.json').read_text());selectorchecks=[]
for x in sel['records']:
    rel=str(pathlib.Path(x['retainedAt']).relative_to(OLD));p=MC+'final-artifact-inventory/'+rel;r=rs[p];selectorchecks.append({'path':p,'expectedSha256':x['sha256'],'actualSha256':r['sha256'],'sameBytes':x['sha256']==r['sha256'],'originalBase':x.get('base'),'originalHead':x.get('head'),'originalGaps':x.get('gaps'),'originalOmissions':x.get('omitted'),'freshAtC216':False})
put('selector-retention-binding.json',{'head':HEAD,'scope':'Original690 and earlier707 sidecars/receipt remain byte-exact with original endpoints. No selector executed at c216; no current707 restamp or archive omission authority.','checks':selectorchecks})

# A metadata-only outside-RUN map makes future evidence-only equality checkable.
outside=[]
for row in git('ls-tree','-rz',HEAD).split(b'\0'):
    if not row:continue
    a,p=row.split(b'\t',1);p=p.decode()
    if p.startswith(RUN):continue
    mode,typ,oid=a.decode().split();outside.append({'path':p,'gitMode':mode,'gitType':typ,'gitBlob':oid})
put('outside-run-tree-identity.json',{'head':HEAD,'tree':full['tree'],'excludedRunRoot':RUN,'scope':'Metadata only for future exact outside-RUN equality proof. No future commit equality is claimed in advance.','entries':outside})

assert len(rs)==11767 and len(ds)==3304
assert len(sources['records'])==62
assert all(x.get('packageHashMatches',True)and x.get('matchesReviewedFinalBytes',True)for x in sources['records'])
assert all(x['matches']for x in reuse['historical242Checks'])and all(x['sameBytes']for x in reportchecks)
assert all(x['originalStillMatchesPriorInterpretation']and x['rawCopyStillMatchesOriginal']and x['proposalStillMatchesReviewedProposal']and x['operationalStillMatchesProposal']for x in reuse['historical79Checks'])
assert all(x['sameBytes']for x in reuse['interpretationInputChecks']+reuse['adapterReviewArtifactChecks']+extraad)
assert all(x['sameBytes']for x in reuse['prior18ArtifactRoleChecks'])
assert all(x['sameBytes']for x in selectorchecks)
assert {x['path']for x in reuse['prior364NormativeChecks']if not x['sameBytes']}=={plan,spec}
source_extra=[x for x in sources['records']if x.get('matchesReviewedFinalBytes')is not None]
privatebindings=json.loads((OUT/'explicit-private-path-byte-bindings.json').read_text())['records'];boundtargets={p for x in privatebindings for p in x['exactCommittedMatches']}
changedpending=[x for x in ds.values()if 'priorPendingSnapshot'in x and not x['priorPendingSnapshot']['sameBytes']]
put('inventory-consistency-check.json',{'head':HEAD,'checks':'Generated inventory/provenance consistency only; no repository tests.','fullPathSet11767':True,'delta3304':True,'all62SourcePathsAccounted':True,'all11FinalFixPackageHashesMatch':True,'all3Task6FollowupHashesAndBlobsMatch':True,'all242HistoricalMembersAnd11ReportsMatch':True,'all79OriginalRawProposalOperationalBindingsMatch':True,'all10InterpretationInputsAnd2AdapterReviewArtifactsMatch':True,'all18PriorRoleAssessmentsUnchanged':True,'prior364OnlyPlanSpecChanged':True,'originalSelectorSidecarsPreserved':True,'noOmissionsAuthorized':True,'noAllPathSemanticReadClaim':True,'onlyWrites':str(OUT)})
s.update(attributedByteScopesAvailableForDeltaQueuePaths=eligible,actualPrivatePathBindingUniqueTargets=len(boundtargets),finalTask6ThreeSourceBindingsMatch=True,finalFixElevenSourceBindingsMatch=True,outsideRunMetadataEntryCount=len(outside),historical11ReportsAllMatch=True)
put('summary.json',s)
role_table='\n'.join('| '+k+' | '+str(v)+' |'for k,v in s['deltaRoles'].items())
source_table='\n'.join('| `'+x['path']+'` | `'+x['reviewedCommit'][:12]+'` | `'+x['sha256']+'` |'for x in source_extra)
changed_table='\n'.join('- `'+x['path']+'`: prior pending SHA `'+x['priorPendingSnapshot']['sha256']+'`; c216 SHA `'+x['sha256']+'`.'for x in changedpending)
report=f'''# Final source-bound inventory delta at c216

Frozen source: `{HEAD}`, tree `{full['tree']}`. Base: `{BASE}`. Previous inventory: `{PREV}`.

The full range has **11,767 changed tracked paths**. This continuation accounts for **3,304 delta paths:3,291 additions and13 modifications**; the other8,463 retain exactly the previous Git blobs and byte/hash facts. Only the delta bodies were newly loaded for hashing/structural role attribution; unchanged8k bodies were not rescanned. Every path is retained. Path/hash completeness does not establish all-path semantic review, archive omission authority, source correctness, current acceptance or whole-branch readiness.

## Actual product and document scope

There are **62** changed skills/tests/scripts/AGENTS/CLAUDE paths in the whole range:48 unchanged from the prior58-path partition,11 final-fix-package paths, and three separately attributed Task6 follow-up paths. Four files were added after7b18:shared `collection-records.cjs`, fixture-liveness test, unplanned-admission test, and verification-settlement-profile test. The current product delta is14 paths, not11 or59. The complete source partition, hashes, blobs and attributed review scopes are in `final-source-partition.json`.

All11 final-fix manifest hashes match c216. The plan freezes4911223a and says its scoped re-review is pending at that entry; actual subsequent reviewer judgment remains the global composer's responsibility. The three other files match exact independently reviewed Task6 source identities:

| Source path | Reviewed commit | Current SHA-256 |
| --- | --- | --- |
{source_table}

Both Task6 review reports were read in full. Round1 addresses R1/R2 but preserves its newly found R3; round2 resolves R3 in the two-file9e4 change and inspects retained settlement controls, while preserving all parent-owned behavior/suite/gate limits. The new settlement test is unchanged from its round1 reviewed blob. This is attributed follow-up scope, not borrowed initial58 coverage or a new product audit. The full14-path diff is retained as `product-delta-for-role-attribution.diff` for source attribution.

The changed **plan and spec were read completely** at c216. Their exact hashes and assessments are in `primary-document-read-assessment.json`. Task6's five final requirements stay unchecked. The plan's final-freeze note preserves pending scoped re-review, final evidence and root acceptance, and requires outside-RUN equality proof for later evidence-only commits. The spec's dated note keeps policy rulings and bounded implementation history separate from pending measurements/continuity/final review/root gate, and expressly does not restamp the old37 commands. The primary INDEX is unchanged; its global-composer review ownership is retained.

## What the3,304 delta files are

| Content/role attribution | Paths |
| --- | ---: |
{role_table}

These labels come from actual formats, headers, JSON fields, exact private/previous byte matches and explicit record paths. No directory name grants omission or acceptance. The340 text payloads and1,078 structured-data payloads with unassessed subclaims remain explicit retained input, not invented clean archives. Source/probe scripts are source, raw model answers are answers, grading/proposal documents remain claim-bearing records, and a raw scout/candidate does not become a formal settled finding merely because it is retained.

The two nonparseable JSON payloads are the known65,536-byte `acceptance-output-probe/{{current-pipe,pipe}}.json` truncated transport outputs. They remain failing historical evidence; their parsing failure is not a current gate result or a new test execution.

## Previous private evidence is now committed, with exact identities

All2,995 paths in the old pending snapshot are present in the delta. **2,991 preserve its exact bytes**. The four changed paths are explicitly bounded:

{changed_table}

The continuity preparation script was superseded by a retained before-module version; both versions' actual paths/hashes remain in the delta inventory. The final plan is fully read here, and the changed replay/settlement test bytes have the scoped source bindings above. No pending snapshot is silently promoted to semantic review.

There are34 direct exact matches to the prior private inventory/final-fix/reviewer artifacts hashed here. Explicit private paths named inside actual retained producer records yield3,271 byte-binding records across{len(boundtargets)} distinct delta targets; `explicit-private-path-byte-bindings.json` preserves source path, actual private bytes/hash, claiming record/pointer and exact committed matches. These establish byte relationships, not issuer authority or semantic correctness. `previous-private-artifact-facts.json` and exact duplicate groups preserve the remaining exact identity relationships.

## Historical and role coverage is reused only within its scope

`historical-review-and-role-reuse-proof.json` confirms all **242/242** historical source/slice members and all **11** attributed review reports unchanged at c216. It preserves original ordinals/member identities and historical scope; no current implementation/measurement/gate claim follows.

All **79/79** original reports, full raw copies, corrected proposal representations and operational copies match the earlier independently interpreted/reviewed bytes. All ten interpretation/review input artifacts, both adapter review reports, and manifest/proposal/registration receipt hashes also match. They are now committed facts at c216, rather than pending files. Their representation review does not establish current applicability, supported disposition, root acceptance or an unknown original verdict. Initial failed adapters and original strict-parser failures remain separate retained evidence.

All **18** earlier bounded artifact-role assessments retain identical bytes. Of364 prior normative candidates,362 are unchanged; only the primary plan/spec changed and were read fully here. The earlier49-group classification and all original unread-body limits therefore remain source-bound. The explicit claim queue notes{eligible} paths with available exact-byte prior interpretation/review/role scopes; availability is not automatic adoption or identity merging.

The original690-gap and earlier707-gap selector sidecars/receipt are committed byte-exact under the retained old inventory. `selector-retention-binding.json` retains their original endpoints and counters. **No selector was executed at c216;707 is not a fresh c216 count.** Zero omission authority is granted.

## Remaining semantic claims, current work and cost

`semantic-claim-queue.json` names all3,288 non-product/non-primary-document delta paths with exact hashes, roles, prior pending/private matches and available attributed scopes. It distinguishes retained raw/source/proposal claims from current canonical run/acceptance records. The parent must integrate actual reviewer/evaluator assessments before relying on current review, grading, relevance, disposition, suite or gate claims. This inventory neither declares every row a finding nor requires semantically rereading every duplicate.

The canonical committed run is classified through record-type/identity rows in `canonical-run-structured-role.json`; no root gate was executed or semantically validated here. Historical negative gates, failures and old sweep results retain their original source. Later actual-continuity, supplemental-N grading/verification and final-fix review working files began after the initially clean freeze inspection. They appear in the observed working status in `summary.json` and are **outside c216 coverage**. Their content and later acceptance effect remain for parent integration.

Cost:209,971,013 path-bytes hashed in the3,304-path delta, with deduplicated Git-blob retrieval;8,463 unchanged paths inherited by Git-object equality. New substantive prose reading is bounded to both complete primary documents, both complete Task6 follow-up reviews, and named source-role headers/selected implementation-report sections. No full8k/archive/report corpus semantic reread, no new subagents, no tests, and no product/canonicalRUN/Git/index/tracker/Herdr writes occurred. The remaining raw tracker prose, historical measurement-log and copied-source semantic limits from the role addendum remain unchanged.

`outside-run-tree-identity.json` supplies metadata for a later evidence-only commit equality proof; it does not preapprove a future commit. Parent/global composer retains authority for final coverage, source-review composition, fresh required evidence, current gate meaning and local merge. This inventory cannot certify whole-branch readiness.
'''
(OUT/'REPORT.md').write_text(report)
handoff=f'''# Global composition handoff — c216

- Exact freeze `{HEAD}` / tree `{full['tree']}`;11,767 full-range paths =8,463 inherited unchanged +3,304 delta. All retained; no omission or all-path semantic verdict.
- Actual source partition62 =48 unchanged prior +11 final-fix package +3 Task6 follow-ups. All11 package hashes match; all3 follow-up blobs/hashes match2091/9e4 and retained scoped reviews. Fresh final-fix verdict remains composer's actual report, not this inventory.
- Plan/spec fully read and keep final Task6/gate requirements open. INDEX unchanged and still owned by composer.
- Prior242members/11reports,79 raw interpretations/corrected representations,18role assessments unchanged;362/364 normative members unchanged. Only plan/spec differ. See exact reuse proof; preserve old failures and scope limits.
- Old pending2,995 paths:2,991 byte-identical; four named changes. Explicit delta semantic claim queue3288 retains all raw/report/proposal/source claims and available attributed byte scopes; no formal-finding promotion from drafts.
- Original690/earlier707 selector evidence unchanged at original refs; no c216 selector invocation or fresh707 claim.
- Later continuity/N-grading/final-fix-review working files are outside committed c216 inventory. Integrate separately; later RUN-only evidence commit needs exact outside-RUN equality proof.
- Read REPORT.md first; machine path inventory, source partition, reuse proof and semantic queue carry exact facts. No tests or repository/state mutations by this inventory.
'''
(OUT/'GLOBAL-COMPOSITION-HANDOFF.md').write_text(handoff)
manifest=[]
for p in sorted(OUT.iterdir()):
    if p.is_file()and p.name!='artifact-manifest.json':b=p.read_bytes();manifest.append({'path':p.name,'bytes':len(b),'sha256':sha(b)})
put('artifact-manifest.json',{'createdUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'head':HEAD,'scope':'Bounded source/path/provenance inventory delta; no global readiness or omission authority','files':manifest})
print(json.dumps({'fullPaths':len(rs),'delta':len(ds),'sourcePaths':62,'prior79And242And11ReportsMatch':True,'availableAttributedQueueScopes':eligible,'outputFiles':len(manifest)+1,'outputBytes':sum(x['bytes']for x in manifest),'reportSha256':sha((OUT/'REPORT.md').read_bytes())},indent=2))
