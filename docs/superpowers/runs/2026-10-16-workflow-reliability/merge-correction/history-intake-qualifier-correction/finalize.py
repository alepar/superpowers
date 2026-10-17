#!/usr/bin/env python3
import pathlib,json,hashlib,collections
from project_occurrences import copied,is_curated_finding,empty
OUT=pathlib.Path('/private/tmp/ufz-correction-history-intake')
ROOT=pathlib.Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
RUN=ROOT/'docs/superpowers/runs/2026-10-16-workflow-reliability'
def read(p):return json.loads(p.read_text())
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
sha=lambda b:hashlib.sha256(b).hexdigest()
c=read(OUT/'coverage.json');p=read(OUT/'occurrence-projection.json');copies=[]
(OUT/'existing-strict-json').mkdir(exist_ok=True)
for entry in c['sources']:
 d=read(OUT/entry['sidecar'])
 if d.get('existingStrictExtraction'):
  rawpath=RUN/d['originalMetadata']['parsedSourceJSON'];raw=rawpath.read_bytes();dest=OUT/'existing-strict-json'/rawpath.name
  dest.write_bytes(raw);copies.append({'source':entry['source'],'original':str(rawpath),'copy':str(dest.relative_to(OUT)),'sha256':sha(raw),'byteCount':len(raw)})
variants=[]
for v in c['task19RetainedVariants']:
 d=read(OUT/v['sidecar']);z=dict(v,canonicalRegistered=False,acceptanceJudgment=None,resolutionRecords=[],findingAppearances=[],structuredFindingAppearances=[],scopeAndConcernPassages=[],claimedRepairPassages=[])
 if d['classification']=='non-finding-diff-artifact':variants.append(z);continue
 name=pathlib.Path(v['retainedPath']).name
 for sec in d['sections']:
  for u in sec['units']:
   if u['unitKind']=='fenced-block':continue
   x=copied(sec,u,d['source'])
   x['variantRawSha256']=d['rawSha256'];x['identityMeaning']='Original source-name reference plus retained path and raw hash; report/review bytes equal their canonical raw-intake copies. No semantic identity or disposition decision applied.'
   if is_curated_finding(name,sec,u):z['findingAppearances'].append(x)
   if 'concern' in (sec['section'] or '').lower():z['scopeAndConcernPassages'].append(x)
   if sec['section'] in ['Latest Task 19 fix status','Fix pass','Fixture repair']:
    x['state']='Historical repair assertion; semantic sufficiency not judged.';z['claimedRepairPassages'].append(x)
 for x in d['structuredFieldAppearances']:
  y=dict(x,variantRawSha256=d['rawSha256'])
  if not x['isExplicitEmptyDeclaration']:
   if x['field'] in ['finding','minors']:z['structuredFindingAppearances'].append(y)
   else:z['scopeAndConcernPassages'].append(y)
 variants.append(z)
dump(OUT/'task19-variant-projection.json',{'schemaVersion':1,'variants':variants,'canonicalIdentityDecision':None,'limits':'The retained report/review paths are byte-identical archive copies of the canonical intake raw files. Separate retention is not evidence of a different revision. No automatic canonical registration or resolution.'})
# Source-specific supporting text stays attached, outside the finding count.
for s in p['sources']:
 s['supportingFindingContext']=[]
 if s['rawArtifact'].endswith('task-19-review.md'):
  d=read(OUT/s['sidecar'])
  for sec in d['sections']:
   if sec['section']=='Findings':
    for u in sec['units']:
     if u['text'].startswith(('Required bounded fix:','Preserve line 603','Add a recovered','Separately use','Add ready replay','Run exactly')):
      s['supportingFindingContext'].append(copied(sec,u,s['source']))
dump(OUT/'occurrence-projection.json',p)
# Verify complete per-source dispositions, exact original strict population and locators.
checks=[]
def ok(name,cond):
 assert cond,name
 checks.append({'check':name,'passed':True})
ok('79 source entries, original identities unique and preserved',len(p['sources'])==79 and [x['source'] for x in p['sources']]==[x['source'] for x in c['sources']] and len(set(x['source'] for x in p['sources']))==79)
ok('24 existing strict occurrences unchanged',sum(len(s['existingStrictOccurrences']) for s in p['sources'])==24)
spanCount=0
for s in p['sources']:
 d=read(OUT/s['sidecar']);raw=pathlib.Path(d['artifact']).read_bytes()
 assert sha(raw)==s['rawSha256'] and len(raw)==s['rawByteCount']
 assert b''.join(sec['rawText'].encode() for sec in d['sections'])==raw
 assert s['existingStrictOccurrences']==d.get('existingStrictExtraction',{}).get('occurrences',[])
 for x in d.get('existingOccurrencesWithLocators',[]):assert len(x['exactFullTextMatches'])==1
 for arr in ['newFindingAppearances','scopeAndConcernPassages','explicitEmptyDeclarations','historicalRepairNarratives','claimedDispositionPassages','supportingFindingContext']:
  for x in s[arr]:
   if 'rawText' in x:
    assert raw[x['byteStart']:x['byteEnd']].decode()==x['rawText'];spanCount+=1
 assert s['acceptanceJudgment'] is None and s['resolutionRecords']==[] and s['canonicalReady'] is False
 assert all(x.get('applied') is False for x in s['proposedAppearanceLinks'])
ok('all source sections reconstruct exact raw bytes; no truncation',True)
ok('all selected exact source-byte spans verify',True)
ok('all existing strict occurrences have one exact full-text source locator',True)
ok('no semantic resolution, acceptance, applied appearance link or fabricated canonical readiness',True)
ok('original five parsed JSON artifacts copied byte-for-byte',len(copies)==5 and all(sha((OUT/x['copy']).read_bytes())==x['sha256'] for x in copies))
for v in variants:
 raw=(RUN/v['retainedPath']).read_bytes();assert sha(raw)==v['sha256'] and len(raw)==v['byteCount']
ok('all three Task 19 retained variant hashes and byte counts verified separately',True)
roast=next(s for s in p['sources'] if s['rawArtifact']=='2026-10-16-workflow-reliability-roast-pr-1.md')
reject=[x for x in roast['newFindingAppearances'] if x['sourceState']=='historically-rejected']
ok('both roast PR rejected items retain complete reason and rejected source state',len(reject)==2 and all('Receipts:' in x['text'] for x in reject))
ok('context passages are separate from new finding occurrences',len(p['sources'])==79 and p['counts']['newFindingAppearances']==26 and p['counts']['structuredFindingAppearances']==4 and p['counts']['scopeAndConcernPassages']==121)
refs=[]
for rel in ['docs/superpowers/specs/2026-10-16-workflow-reliability-design.md','docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md','.superpowers/sdd/super-plan-ufz-plan/historical-report-format-adapters/manifest.json']:
 raw=(ROOT/rel).read_bytes();refs.append({'path':rel,'sha256':sha(raw),'byteCount':len(raw)})
dump(OUT/'verification.json',{'schemaVersion':1,'checks':checks,'sourceCount':79,'selectedByteSpansVerified':spanCount,'existingStrictCopies':copies,'referenceDocuments':refs,'canonicalLedgerWrites':0,'sourceWrites':0,'rawWrites':0})
md=['# Historical intake handoff','',
 'The bounded population is **79 sources**: 74 strict-parser failures and five existing strict parses. All have explicit source classifications and lossless sidecars with original headings, per-section positions, complete text and line/byte locators. The original **24 strict occurrences** are unchanged; five original parsed JSON artifacts are also copied byte for byte.','',
 '**26 historical finding/minor appearances** and **four structured renditions** were isolated from the broader contextual population. They are prospective appearances, not a current outstanding-defect total. The two original roast PR rejections retain their reasons and historical rejected state. **121 concern/scope passages, 99 explicit empty declarations, 30 repair narratives and six author disposition assertions** remain separate. No FIXED/DONE/CLEAN claim, later silence or task closure becomes a supported disposition.','',
 'All **110** raw inventory hashes and byte counts match. The **33** raw artifacts outside the 79 report population are explicitly classified: 29 input briefs and four supporting JSON artifacts. The three known Task 19 retained references are separately hash-checked. The retained report/review copies are byte-identical to their canonical raw-intake counterparts; no byte mismatch or differing revision is established. No canonical record was registered and no semantic disposition was applied. The retained diff is supporting evidence, not a report.','',
 '## Remaining interpretation gaps','',
 '- The sidecar representation is prospective. All 74 original strict-parser failures remain visible; none is relabeled a strict parse success.',
 '- Headerless fields and narrative reports retain original null section context. A canonical source/section/position representation for those items requires explicit interpretation; an absent heading never implies None.',
 '- Repeated prose, JSON, fix-report and archive appearances remain separate. Proposed exact-text links are recorded with `applied:false`; semantic identity is unjudged.',
 '- Historical repair and resolution assertions retain their full text and supporting-source context, but their semantic sufficiency has not been judged.',
 '- Task 19 report/review canonical and handoff copies have identical hashes and byte lengths. The earlier differing-bytes claim was mistaken and is withdrawn; see `task19-qualifier-correction.json` for current and frozen-86ce3567 evidence. Byte equality does not imply a supported finding disposition.',
 '- Concern/untested/live-evaluation/parent-ownership passages remain qualifications and obligations for the acceptance owner; no acceptance determination was made.','',
 '## Artifacts','',
 '- `occurrence-projection.json`: all 79 sources, original 24 occurrences, selected historical findings, structured renditions and separate concerns/declarations/repair claims.',
 '- `occurrence-projection.md`: exact finding/minor text with source line locators.',
 '- `coverage.json` / `coverage.md`: complete source inventory, raw hash/byte counts, dispositions and exclusions.',
 '- `sidecars/`: full original section bytes, all exact units and candidate passages. These contextual passages are not registered as findings.',
 '- `task19-variant-projection.json` / `variants/`: bounded variant evidence and explicitly unjudged repair claims.',
 '- `existing-strict-json/`: exact original parser JSON bytes.',
 '- `verification.json`: successful source/hash/text/identity/segregation checks.',
 '- `adapt_history.py`, `project_occurrences.py`, `finalize.py`: deterministic reproduction, writing only this temporary output directory.','',
 'Run the three scripts in that order to reproduce. Product tests were not run. No source code, immutable raw source, run.md, Git state or Herdr state was modified.','']
(OUT/'HANDOFF.md').write_text('\n'.join(md))
print(json.dumps({'verifiedChecks':len(checks),'selectedByteSpansVerified':spanCount,'all79Accounted':True,'originalStrictOccurrences':24,'newFindingAppearances':26,'structuredFindingAppearances':4,'task19VariantFindingAppearances':sum(len(v['findingAppearances']) for v in variants),'task19VariantStructuredRenditions':sum(len(v['structuredFindingAppearances']) for v in variants)}))
