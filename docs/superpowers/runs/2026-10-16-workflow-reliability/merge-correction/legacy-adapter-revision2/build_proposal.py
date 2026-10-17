#!/usr/bin/env python3
"""Evidence-only deterministic proposal; writes exclusively alongside this script."""
import collections, hashlib, json, re, shutil, subprocess
from pathlib import Path
OUT=Path(__file__).resolve().parent
REPO=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
RUN=REPO/'docs/superpowers/runs/2026-10-16-workflow-reliability'
REV=Path('/private/tmp/ufz-correction-source-interpretation')
INTAKE=Path('/private/tmp/ufz-correction-history-intake')
PARSER=REPO/'skills/super-code/scripts/report-verdict'
PROPOSAL_REVISION=2
MIXED_JUDGMENTS_DOCUMENT=json.loads((OUT/'mixed-passage-judgments.json').read_bytes())
MIXED_JUDGMENTS={(j['ordinal'],j['byteStart'],j['byteEnd']):j for j in MIXED_JUDGMENTS_DOCUMENT['passages']}
assert len(MIXED_JUDGMENTS)==13
BOUNDED_STRUCTURED_CONCERNS={(43,'/concerns/0'):(9651,9791),(49,'/concerns/0'):(22349,22581)}
def sha(b): return hashlib.sha256(b).hexdigest()
def writej(path,obj):
 p=OUT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def copy(src,dest):
 p=OUT/dest;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(Path(src).read_bytes());return sha(p.read_bytes())
def runparse(artifact,source,complete=True):
 args=['bash',str(PARSER)]+(['--complete','--source',source] if complete else [])+[artifact]
 c=subprocess.run(args,cwd=OUT,capture_output=True,text=True)
 if complete:return c,json.loads(c.stdout) if c.returncode==0 else None
 fields=dict(re.findall(r'^(verdict|kind): (.*)$',c.stdout,re.M));return c,fields

docs=[]; sources=[];inputhashes=[]
for part in (1,2,3):
 for ext in ('json','md'):
  src=REV/f'part-{part}-review.{ext}';dest=f'review-evidence/{src.name}'
  inputhashes.append({'artifact':dest,'original':str(src),'sha256':copy(src,dest)})
 d=json.loads((REV/f'part-{part}-review.json').read_bytes());docs.append(d)
 for s in d['sources']:s['_part']=part;sources.append(s)
sources.sort(key=lambda s:s['ordinal']);assert [s['ordinal'] for s in sources]==list(range(1,80))
for name in ('HANDOFF.md','task19-qualifier-correction.json'):
 inputhashes.append({'artifact':f'review-evidence/{name}','original':str(INTAKE/name),'sha256':copy(INTAKE/name,f'review-evidence/{name}')})
for artifact in ('mixed-passage-judgments.json','review-evidence/adapter-initial-failed-review.md'):
 inputhashes.append({'artifact':artifact,'original':str(OUT/artifact),'sha256':sha((OUT/artifact).read_bytes())})
coverage=json.loads((INTAKE/'coverage.json').read_bytes());cov={s['source']:s for s in coverage['sources']}
strict={}
for p in sorted((INTAKE/'existing-strict-json').glob('*')):
 data=json.loads(p.read_bytes());strict[data['source']]=data;copy(p,f'existing-strict-json/{p.name}')
original24=[o for s in sources for o in s.get('existingStrictOccurrencesPreservedExactly',s.get('existingStrictOccurrences',[]))]
# Strict objects in part3 carry source separately; take original parser objects without transformations.
strict24=[dict(source=s['source'],**o) for s in sources if s['source'] in strict for o in strict[s['source']]['occurrences']]
assert len(strict24)==24
assert docs[2]['strictOccurrencePolicy']['occurrences']==strict24
writej('original-strict-occurrences.json',strict24)
runbytes=(RUN/'run.md').read_bytes()
current=[json.loads(l.split(' · ',1)[1]) for l in runbytes.decode().splitlines() if l.startswith('- finding-source · ')]
assert len(current)==73
rawids={s['source'] for s in sources};rawarts={s['rawArtifact'] for s in sources}
identityoverlap=sorted(rawids&{s['source'] for s in current})
artifactoverlap=sorted(rawarts&{s['artifact'] for s in current})
currenthashes=collections.defaultdict(list);missingcurrent=[]
for s in current:
 p=RUN/s['artifact']
 if p.is_file():currenthashes[sha(p.read_bytes())].append(s['source'])
 else:missingcurrent.append(s['artifact'])
hashoverlap=[{'source':s['source'],'currentSources':currenthashes[s['rawSha256']]} for s in sources if s['rawSha256'] in currenthashes]
assert not identityoverlap and not artifactoverlap and not hashoverlap and not missingcurrent
writej('current-registration-overlap-check.json',{'currentSourceCount':73,'runMdSha256':sha(runbytes),'proposedLegacySourceCount':79,'sourceIDOverlaps':identityoverlap,'artifactPathOverlaps':artifactoverlap,'rawByteHashOverlaps':hashoverlap,'missingCurrentArtifacts':missingcurrent,'existingRecords':current,'scope':'Comparison is source identities, retained artifact paths and raw-byte hashes; no semantic identity inference.'})

# Explicit role allowlists reflect independently reviewed semantics, not keyword extraction from raw text.
KEEP1={'review-finding','historical-finding','scope-concern','deferred-coverage','deferred-integration-scope'}
KEEP2={'actual-finding','actual-deferred-minor','actual-defect-observation','actual-concern-defect-assertion','actual-integration-concern','historical-defect-observation','coverage-qualification','scope-qualification','deferred-coverage-obligation','native-platform-coverage-qualification','separate-integration-seam-coverage-obligation','historical-coverage-qualification'}
KEEP3={'review_finding','deferred_coverage','scope_concern','coverage_limit'}

def exact_json_pointer_span(block,pointer):
 """Derive exact UTF-8 value bytes from a fully verified original fenced JSON block."""
 decoder=json.JSONDecoder();spans={}
 def skip(i):
  while block[i].isspace():i+=1
  return i
 def value(i,path):
  i=skip(i);start=i
  if block[i]=='{':
   i=skip(i+1)
   if block[i]!='}':
    while True:
     key,i=decoder.raw_decode(block,i);i=skip(i);assert block[i]==':';i=value(i+1,path+(key,));i=skip(i)
     if block[i]=='}':break
     assert block[i]==',';i=skip(i+1)
   i+=1
  elif block[i]=='[':
   i=skip(i+1);n=0
   if block[i]!=']':
    while True:
     i=value(i,path+(str(n),));n+=1;i=skip(i)
     if block[i]==']':break
     assert block[i]==',';i=skip(i+1)
   i+=1
  else:_,i=decoder.raw_decode(block,i)
  spans[path]=(start,i);return i
 value(block.index('{'),())
 path=tuple(x.replace('~1','/').replace('~0','~') for x in pointer.strip('/').split('/'))
 start,end=spans[path];return len(block[:start].encode()),len(block[:end].encode())

def roles(p):return p.get('roles',p.get('semanticRoles',[p.get('classification','unknown')]))
def passages(s):return s.get('interpretedPassages',s.get('semanticPassages',s.get('passages',[])))
def primary(rs):
 if 'historically_rejected_finding' in rs:return 'historically-rejected-claim'
 if set(rs)&{'review-finding','actual-finding','review_finding','actual-deferred-minor'}:return 'review-finding'
 if set(rs)&{'historical-finding','actual-defect-observation','actual-concern-defect-assertion','historical-defect-observation'}:return 'historical-defect-assertion'
 if any('deferred' in r or 'obligation' in r for r in rs):return 'pending-obligation'
 return 'scope-or-coverage-qualification'

def mkitem(p,origin,rs=None):
 return {'byteStart':p['byteStart'],'byteEnd':p['byteEnd'],'roles':rs or roles(p),'reviewRefs':[origin],'interpretation':p.get('interpretation',p.get('semanticInterpretation','See complete independently reviewed source interpretation.')),'jsonPointer':p.get('jsonPointer')}

def subitem(p,origin,text,rs=None):
 # Use exact substring bytes; no invented text and no reconstruction of the original claim.
 b=p['rawText'].encode();needle=text.encode();offset=b.index(needle)
 q=mkitem(p,origin,rs);q['byteStart']=p['byteStart']+offset;q['byteEnd']=q['byteStart']+len(needle);q['interpretation']='Adapter selection isolates substantive qualification/obligation from a mixed illustrative or repair passage; complete original remains in metadata/raw.';return q

records=[];man=[];associations=[];associationgaps=[];gaps=[];supplemental=[];validation=[];counts=collections.Counter();rawverified=0;reviewspanchecks=0;structuredspanchecks=0
for s in sources:
 ordinal=s['ordinal'];source=s['source'];raw=(RUN/s['rawArtifact']).read_bytes();assert sha(raw)==s['rawSha256'];assert len(raw)==s['rawByteCount'];rawverified+=1
 rawcopy='raw/'+s['rawArtifact'];copy(RUN/s['rawArtifact'],rawcopy)
 side=json.loads((INTAKE/cov[source]['sidecar']).read_bytes());sidepath=f'metadata/{ordinal:02d}-sidecar.json';copy(INTAKE/cov[source]['sidecar'],sidepath)
 assert (s['readScope'].get('completeRawRead') is True or (s['readScope'].get('complete') is True and s['readScope'].get('rawFileReadDirectly') is True)),(ordinal,'independent full-read evidence missing')
 ps=passages(s); reviewbase=f'review-evidence/part-{s["_part"]}-review.json#/sources/{next(i for i,x in enumerate(docs[s["_part"]-1]["sources"]) if x["source"]==source)}'
 # Verify every reviewed exact-text span, including excluded contextual passages.
 for p in ps:
  assert raw[p['byteStart']:p['byteEnd']].decode()==p['rawText'],(ordinal,p['lineStart'],'reviewed span mismatch')
  assert raw[:p['byteStart']].count(b'\n')+1==p['lineStart']
  assert raw[:max(p['byteStart'],p['byteEnd']-1)].count(b'\n')+1==p['lineEnd']
  reviewspanchecks+=1
 selected=[];classified=[];mixedRepresentations=[]
 keep=KEEP1 if s['_part']==1 else KEEP2 if s['_part']==2 else KEEP3
 for n,p in enumerate(ps):
  origin=f'{reviewbase}/'+('interpretedPassages' if s['_part']==1 else 'semanticPassages' if s['_part']==2 else 'passages')+f'/{n}'
  rs=roles(p);selectedhere=bool(set(rs)&keep)
  if source in strict and set(rs)&{'scope_qualification','structured_concern_rendition'}:selectedhere=True # Exact supplemental qualification only, never a strict occurrence rewrite.
  # A repair claim does not erase an independently judged historical finding.
  # These13 mixed passages have explicit source-local judgments; pure repair/TDD/support/example prose stays metadata.
  mixedJudgment=None
  if {'historical-finding','claimed-repair'}<=set(rs):
   mixedKey=(ordinal,p['byteStart'],p['byteEnd']);assert mixedKey in MIXED_JUDGMENTS,('unjudged mixed historical assertion',mixedKey)
   mixedJudgment=MIXED_JUDGMENTS[mixedKey];assert mixedJudgment['source']==source and mixedJudgment['rawSha256']==sha(raw)
   assert mixedJudgment['assertionQuote'] in p['rawText'] and mixedJudgment['repairClaimQuote'] in p['rawText'];selectedhere=True
  if ordinal==74 and 'historically_rejected_finding' in rs:selectedhere=True
  if ordinal==74 and n==14:selectedhere=False # Independently judged execution provenance context, not an additional coverage obligation.
  item=mkitem(p,origin)
  if mixedJudgment:item['passageJudgment']=mixedJudgment;item['interpretation']=mixedJudgment['basis']+' Claimed repair, present applicability and cross-source identity remain unadjudicated.'
  # Exact, explicit review boundary grouping: one Important item, not six disconnected fragments.
  if ordinal==32 and n in (2,3,4,5,6,7,8):
   selectedhere=False
   if n==2:
    end=ps[8]['byteEnd'];q=dict(item,byteEnd=end,roles=['actual-finding','required-remediation'],reviewRefs=[f'{reviewbase}/semanticPassages/{i}' for i in range(2,9)],interpretation='One original Important finding with Required bounded fix and its complete original bounded remediation list. Synthetic grouping is explicit; no cross-source identity link.')
    selected.append(q)
  elif ordinal==37 and n in (3,4):
   selectedhere=False
   if n==3:
    g=s['canonicalItemGroupingRecommendation'];q=mkitem(g,f'{reviewbase}/canonicalItemGroupingRecommendation',['actual-finding','finding-qualification-and-required-remediation']);selected.append(q)
  elif ordinal==3 and n==5:
   selectedhere=False
   for text,rr in [(p['rawText'].split('\n\n')[0],['coverage-qualification']),(p['rawText'].split('\n\n')[-2] if p['rawText'].endswith('\n\n') else p['rawText'].split('\n\n')[-1],['deferred-coverage'])]:selected.append(subitem(p,origin,text,rr))
  elif ordinal==18 and n==4:
   selectedhere=False;selected.append(subitem(p,origin,p['rawText'].split('Recommended post scenario:')[0].rstrip(),['deferred-coverage']))
  elif ordinal==21 and n==1:
   selectedhere=False
   qualifier=raw[5652:5840].decode();assert p['byteStart']==5322 and p['byteEnd']==5840 and qualifier in p['rawText']
   selected.append(subitem(p,origin,qualifier,['scope-concern']))
   mixedRepresentations.append({'basis':'F2 explicit source-local selection: retain population qualification; labelled metrics JSON remains contextual example, not actual run counts.','originalPassageByteSpan':[5322,5840],'labelRawText':'Actual emitted projection example:','exampleByteSpan':[5358,5650],'exampleRawText':raw[5358:5650].decode(),'qualificationByteSpan':[5652,5840],'qualificationRawText':qualifier,'appliedIdentityLink':False})
  elif ordinal==36 and n==6:
   selectedhere=False;selected.append(subitem(p,origin,p['rawText'][p['rawText'].index('Caller/root acceptance'):],['deferred-coverage-obligation']))
  elif ordinal==50 and n==4:
   selectedhere=False;selected.append(subitem(p,origin,p['rawText'][p['rawText'].index('Task super-plan-ufz.27 closure'):],['deferred-coverage-obligation','separate-human-gate-preserved']))
  elif selectedhere:selected.append(item)
  classified.append({'reviewRef':origin,'roles':rs,'span':[p['byteStart'],p['byteEnd']],'retention':'canonical occurrence or exact grouped/split span' if selectedhere else 'metadata/raw; may contribute to explicit grouped/split occurrence','interpretation':p.get('interpretation',p.get('semanticInterpretation'))})
 # Structured appearances remain separately attributed; only actual finding/obligation fields are selected.
 for n,p in enumerate(s.get('structuredAppearances',[])):
  block=raw[p['byteStart']:p['byteEnd']].decode();assert block==p['exactJsonBlock'];obj=json.loads(re.sub(r'^```[^\n]*\n|\n```\s*$','',block))
  val=obj
  for token in p['jsonPointer'].strip('/').split('/'):
   token=token.replace('~1','/').replace('~0','~');val=val[int(token)] if isinstance(val,list) else val[token]
  assert val==p['fieldValue'];structuredspanchecks+=1
  if p.get('isExplicitEmptyDeclaration'):continue
  val=p.get('fieldValue')
  if val is None or val=='' or val==[]:continue
  boundedConcern=(ordinal,p['jsonPointer']) in BOUNDED_STRUCTURED_CONCERNS
  if p.get('semanticRole')!='structured-same-source-finding-rendition' and not boundedConcern:continue
  q=mkitem(p,f'{reviewbase}/structuredAppearances/{n}',['structured-concern-appearance'] if boundedConcern else ['structured-finding-appearance']);lo,hi=exact_json_pointer_span(block,p['jsonPointer']);q['originalReviewedJsonBlockSpan']=[p['byteStart'],p['byteEnd']];q['byteStart']=p['byteStart']+lo;q['byteEnd']=p['byteStart']+hi;q['fieldLocatorInterpretation']='Mechanically derived exact raw JSON value span from verified complete original block and reviewed JSON pointer; no semantic identity link.';assert json.loads(raw[q['byteStart']:q['byteEnd']].decode())==val;q['decodedText']=val if isinstance(val,str) else json.dumps(val,ensure_ascii=False);q['jsonPointer']=p['jsonPointer'];q['interpretation']='Distinct decoded JSON-field appearance; exact original JSON block and pointer retained. No applied semantic identity link; occurrence count is appearance count.'
  if boundedConcern:
   assert (q['byteStart'],q['byteEnd'])==BOUNDED_STRUCTURED_CONCERNS[(ordinal,p['jsonPointer'])];q['representationChoice']='parent-bounded-two-structured-concerns';q['interpretation']='Parent explicitly requests this one of two independently identified structured concern renditions as a separate interpreted appearance. Full exact JSON provenance retained. Not an independent defect, identity link, resolution, or exhaustive-every-quote claim.'
  selected.append(q)
 for n,p in enumerate(s.get('additionalStructuredObligationAppearances',[])):
  assert raw[p['byteStart']:p['byteEnd']].decode()==p['rawJsonValue'];assert json.loads(p['rawJsonValue'])==p['value'];structuredspanchecks+=1
  q=mkitem(p,f'{reviewbase}/additionalStructuredObligationAppearances/{n}',['structured-pending-obligation-appearance']);q['jsonPointer']=p['jsonPointer'];q['decodedText']=p['value'] if isinstance(p['value'],str) else '\n'.join(p['value']);selected.append(q)
 # Do not manufacture semantic duplicates when one exact span has several reviewed roles.
 byspan={}
 for p in selected:
  k=(p['byteStart'],p['byteEnd'],p.get('jsonPointer'))
  if k in byspan:
   byspan[k]['roles']=sorted(set(byspan[k]['roles']+p['roles']));byspan[k]['reviewRefs']+=p['reviewRefs']
  else:byspan[k]=p
 selected=sorted(byspan.values(),key=lambda p:(p['byteStart'],p['byteEnd'],p.get('jsonPointer') or ''))
 compactproc,compact=runparse(rawcopy,source,False)
 # All original outcome/status lines remain separately attributed, including non-recognizable legacy fields.
 fields=[]
 for n,line in enumerate(raw.decode().splitlines(),1):
  if re.search(r'(?:^|["*\s])(?:[Ss]tatus|status|Verdict|verdict|completionKind)["*\s]*:',line):fields.append({'line':n,'rawText':line})
 metadata={'version':1,'ordinal':ordinal,'source':source,'originalArtifact':s['rawArtifact'],'rawCopy':rawcopy,'rawSha256':sha(raw),'rawByteCount':len(raw),'readCompletenessEvidence':s['readScope'],'reviewEvidence':reviewbase,'fullReviewInputHashes':inputhashes,'rawSidecar':sidepath,'originalCompactRecognition':compact,'originalVerdictAndStatusFields':fields,'reviewedPassagesClassification':classified,'allReviewedPassages':ps,'structuredAppearances':s.get('structuredAppearances',[]),'additionalStructuredObligations':s.get('additionalStructuredObligationAppearances',[]),'selectedExactSpans':selected,'proposalRevision':PROPOSAL_REVISION,'mixedPassageRepresentationJudgments':mixedRepresentations,'emptinessJudgment':s.get('coverageJudgment',s.get('explicitEmptyAssessment',{'scopedEmptySupported':s.get('scopedEmptySupported'),'supportedGlobalFindingEmpty':s.get('supportedGlobalFindingEmpty')})),'semanticAmbiguities':s.get('semanticAmbiguities',[]),'appliedIdentityLinks':[],'appliedDispositions':[],'acceptanceJudgment':None}
 # All source-specific interpretive ambiguities remain named, never silently resolved by adapting format.
 for n,g in enumerate(s.get('semanticAmbiguities',[])):gaps.append({'id':f'interpretation-{ordinal:02d}-{n+1}','source':source,'kind':'semantic-interpretation-gap','basis':g,'owner':'parent/fresh semantic reviewer','status':'open'})
 strictsource=source in strict
 adaptermaps=[];supp=[]
 if strictsource:
  artifact=s['rawArtifact'];copy(RUN/artifact,artifact)
  c,parsed=runparse(artifact,source);assert c.returncode==0,(ordinal,c.stderr)
  assert parsed['occurrences']==strict[source]['occurrences'];assert parsed['kind']==strict[source]['kind'];assert parsed['verdict']==strict[source]['verdict']
  counts['strictSources']+=1;counts['strictOccurrences']+=len(parsed['occurrences'])
  for n,p in enumerate(selected):
   pp=dict(p);pp['rawText']=raw[p['byteStart']:p['byteEnd']].decode();pp['lineStart']=raw[:p['byteStart']].count(b'\n')+1;pp['lineEnd']=raw[:max(p['byteStart'],p['byteEnd']-1)].count(b'\n')+1
   # Exact contained strict raw text means already accounted; extra context stays supplemental.
   norm=pp['rawText'].strip();norm=re.sub(r'^ ?(?:[-*]|[0-9]+[.)])\s+','',norm,count=1)
   if not any(norm==o['text'] for o in parsed['occurrences']):supp.append(pp)
  metadata['supplementalQualifications']=supp
  for n,p in enumerate(supp):supplemental.append({'id':f'strict-supplement-{ordinal:02d}-{n+1}','source':source,'proposedRequirementName':f'history/source-{ordinal:02d}/raw-byte-{p["byteStart"]}','qualification':p,'status':'retained supplemental qualification; requires supported owner mapping, no canonical occurrence change'})
  if supp:gaps.append({'id':f'strict-supplemental-{ordinal:02d}','source':source,'kind':'supplemental-qualification-owner-mapping','count':len(supp),'basis':'Original strict24 retained exactly. Additional reviewed pending/coverage qualifications remain exact supplemental spans; parent/fresh review must map to named requirements without a conflicting same-source extraction.','status':'open'})
  adaptersha=sha(raw)
 else:
  artifact=f'legacy-report-adapters-r1/{ordinal:02d}-{Path(s["rawArtifact"]).name}'
  parts=[]
  if compact.get('kind')=='roast':
   markers=[l for l in raw.decode().splitlines() if l.startswith('super-roast verdict: ')];assert len(markers)==1;parts.append(markers[0]+'\n');statusbasis='Original recognizable roast marker copied exactly; not a new historical outcome.'
  elif compact.get('kind')=='task-report' and compact.get('verdict') in {'DONE_WITH_CONCERNS','DONE','NEEDS_CONTEXT','BLOCKED_AUTH','BLOCKED','IMPLEMENTED','FIXED','CLEAN','NEEDS_FIX','INVALID'}:
   parts.append('Status: '+compact['verdict']+'\n');statusbasis='Adapter preserves original compact-recognized task verdict; this status does not discharge findings/obligations.'
  elif compact.get('kind')=='final-review' and compact.get('verdict') not in (None,'unknown'):
   parts.append('## Verdict\n\n'+compact['verdict']+'\n');statusbasis='Adapter preserves original compact-recognized final-review verdict; not acceptance.'
  else:
   parts.append('Status: NEEDS_CONTEXT\n');statusbasis='NEEDS_CONTEXT is a conservative status of this NEW INTERPRETATION ADAPTER only; original legacy task/reviewer outcome remains unrecognized by the parser. All actual original verdict/status fields are preserved separately.'
  parts.append('\n# Legacy interpretation adapter\n\nAdapter-only synthetic labels and item boundaries. Exact raw source, original headings, complete passages, line/byte locators and interpretation limits are recorded in the hash-bound metadata. This document proposes history representation and makes no acceptance, identity-link or resolution decision.\n')
  if not selected:
   empty=[(n,p) for n,p in enumerate(ps) if any('empty' in r for r in roles(p))]
   supported=s.get('coverageJudgment',{}).get('validScopedEmptySupported') or s.get('explicitEmptyAssessment',{}).get('supportedLocalEmpty') or s.get('scopedEmptySupported')
   if empty and supported:
    parts.append('\n## Findings — adapter scoped-empty source declarations only\n\nNone\n');metadata['adapterScopedEmptyBasis']=[{'reviewRef':reviewbase,'passageIndex':n,'lineStart':p['lineStart'],'lineEnd':p['lineEnd'],'byteStart':p['byteStart'],'byteEnd':p['byteEnd'],'rawText':p['rawText'],'roles':roles(p)} for n,p in empty];counts['scopedEmptyAdapters']+=1
   else:
    # A gap is explicit; never manufacture None from absent headings, DONE or failed parsing.
    parts.append('\n## Concerns — adapter unresolved extraction gap\n\n- Reviewed source has no selected substantive occurrence or supported explicit scoped-empty basis; interpretation remains NEEDS_CONTEXT.\n');gaps.append({'id':f'empty-basis-{ordinal:02d}','source':source,'kind':'no-supported-extraction-empty-basis','status':'open'});counts['gapAdapters']+=1
  for n,p in enumerate(selected):
   start,end=p['byteStart'],p['byteEnd'];rawtext=raw[start:end].decode();rs=p['roles'];category=primary(rs)
   if 'structured-finding-appearance' in rs:category='structured-finding-appearance'
   if 'structured-pending-obligation-appearance' in rs:category='structured-pending-obligation-appearance'
   if 'structured-concern-appearance' in rs:category='structured-concern-appearance'
   originalSections=[{'section':sec.get('section'),'sectionOrdinal':sec['sectionOrdinal'],'headingRaw':sec.get('headingRaw'),'hierarchy':sec.get('hierarchy',[]),'byteStart':sec['byteStart'],'byteEnd':sec['byteEnd']} for sec in s['rawSections'] if sec['byteStart']<end and sec['byteEnd']>start]
   prefix='Rejected' if category=='historically-rejected-claim' else 'Findings' if category in ('review-finding','historical-defect-assertion','structured-finding-appearance') else 'Concerns'
   # Unique adapter section plus one original physical span gives stable source/section/position.
   section=f'{prefix} — adapter/{category}/raw-section-{originalSections[0]["sectionOrdinal"] if originalSections else 0}/raw-byte-{start:09d}'
   if p.get('jsonPointer'):section+='/json-pointer-'+p['jsonPointer']
   text=p.get('decodedText',rawtext)
   text=text.replace('\r\n','\n').replace('\r','\n').rstrip('\n')
   text=re.sub(r'^ ?(?:[-*]|[0-9]+[.)])[ \t]+','',text,count=1)
   lines=text.split('\n');leadingWhitespaceRemoved=lines[0][:len(lines[0])-len(lines[0].lstrip(' \t'))];lines[0]=lines[0].lstrip(' \t');rewrites=[]
   for j in range(1,len(lines)):
    if re.match(r'^(?:#+[ \t]|\*\*[^*]+\*\*| ?(?:[-*]|[0-9]+[.)])[ \t])',lines[j]):rewrites.append({'line':j+1,'prefixAdded':'  '});lines[j]='  '+lines[j]
   itemtext='\n'.join(lines)
   parts.append('\n## '+section+'\n\n- '+itemtext+'\n')
   adaptermaps.append({'adapterSection':section,'adapterSectionSynthetic':True,'adapterPosition':1,'category':category,'roles':rs,'passageJudgment':p.get('passageJudgment'),'representationChoice':p.get('representationChoice'),'rawByteStart':start,'rawByteEnd':end,'rawLineStart':raw[:start].count(b'\n')+1,'rawLineEnd':raw[:max(start,end-1)].count(b'\n')+1,'originalSections':originalSections,'rawText':rawtext,'jsonPointer':p.get('jsonPointer'),'originalReviewedJsonBlockSpan':p.get('originalReviewedJsonBlockSpan'),'fieldLocatorInterpretation':p.get('fieldLocatorInterpretation'),'decodedFieldText':p.get('decodedText'),'adapterText':itemtext,'transformation':{'firstListMarkerRemoved':bool(re.match(r'^ ?(?:[-*]|[0-9]+[.)])[ \t]+',rawtext)),'firstLeadingWhitespaceRemoved':leadingWhitespaceRemoved,'newlineNormalization':'CRLF/CR to LF; trailing newline omitted by parser','continuationEscapes':rewrites,'originalSpanPreservedSeparately':True},'reviewRefs':p['reviewRefs'],'interpretation':p['interpretation']})
   counts[category]+=1
  p=OUT/artifact;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(''.join(parts));adaptersha=sha(p.read_bytes())
  metadata['adapterStatusInterpretation']=statusbasis;metadata['adapterOccurrenceMap']=adaptermaps
  c,parsed=runparse(artifact,source)
  assert c.returncode==0,(ordinal,c.stderr)
  assert len(parsed['occurrences'])==(len(adaptermaps) if selected else (0 if 'adapterScopedEmptyBasis' in metadata else 1)),(ordinal,len(parsed['occurrences']),len(adaptermaps))
  for mapping,occ in zip(adaptermaps,parsed['occurrences']):
   assert occ['section']==mapping['adapterSection'] and occ['position']==1 and occ['text']==mapping['adapterText'],(ordinal,occ['section'],'re-extraction mismatch')
  if compact.get('kind') in ('roast','task-report','final-review'):
   assert parsed['kind']==compact['kind'] and parsed['verdict']==compact['verdict'],(ordinal,compact,parsed['kind'],parsed['verdict'])
  counts['interpretedAdapters']+=1
  assoc={'version':1,'artifact':s['rawArtifact'],'sha256':sha(raw),'source':source,'retainedArtifact':artifact,'retainedSha256':adaptersha,'basis':'PROPOSAL ONLY. Independent full-source semantic review, exact raw provenance and deterministic reversible adapter. Parent/fresh review required before registration or correspondence approval.','evidence':[str(OUT/'reversible-manifest.json'),str(OUT/f'metadata/{ordinal:02d}-interpretation.json'),str(OUT/f'review-evidence/part-{s["_part"]}-review.json')],'interpretation':{'kind':'legacy-adapter','originalVerdict':compact.get('verdict','unknown'),'limitations':[statusbasis,'No identity links, source merges, repair or rejection dispositions applied.','Scoped explicit empty declarations do not clear pending obligations or establish global readiness.','Pure contextual/example/repair-only passages remain metadata; explicit mixed finding/repair assertions retain both roles without supported disposition.']}}
  lineRefs=collections.defaultdict(list)
  for mapping in adaptermaps:
   ref={'source':source,'section':mapping['adapterSection'],'position':mapping['adapterPosition']}
   for line in range(mapping['rawLineStart'],mapping['rawLineEnd']+1):
    if ref not in lineRefs[line]:lineRefs[line].append(ref)
  assoc['lines']=[{'line':line,'refs':refs} for line,refs in sorted(lineRefs.items())]
  if compact.get('kind') in ('roast','task-report','final-review') and compact.get('verdict')!='unknown':assoc['judgment']='supported';associations.append(assoc)
  else:
   assoc['status']='unsupported/gap';assoc['reason']='Original compact kind/verdict unknown. Adapter NEEDS_CONTEXT is a new interpretation status and cannot be represented as the original historical outcome or a status-preserving declared-report correspondence.';associationgaps.append(assoc);gaps.append({'id':f'unknown-original-outcome-{ordinal:02d}','source':source,'kind':'original-format-kind-verdict-unrecognized','status':'open'})
  records.append({'status':'proposal-only; fresh validation required','record':parsed,'rawArtifact':s['rawArtifact'],'rawSha256':sha(raw),'adapterSha256':adaptersha,'interpretationMetadata':f'metadata/{ordinal:02d}-interpretation.json','statusInterpretation':statusbasis})
 if strictsource:records.append({'status':'proposal-only; original strict parse retained','record':parsed,'rawArtifact':s['rawArtifact'],'rawSha256':sha(raw),'adapterSha256':adaptersha,'interpretationMetadata':f'metadata/{ordinal:02d}-interpretation.json','originalStrictJsonArtifact':f'existing-strict-json/{Path(s["rawArtifact"]).name}.complete.json'})
 metadata['retainedArtifact']=artifact;metadata['retainedSha256']=adaptersha
 writej(f'metadata/{ordinal:02d}-interpretation.json',metadata)
 writej(f'extracted/{ordinal:02d}.json',parsed)
 man.append({'ordinal':ordinal,'source':source,'rawArtifact':s['rawArtifact'],'rawCopy':rawcopy,'rawSha256':sha(raw),'rawByteCount':len(raw),'retainedArtifact':artifact,'retainedSha256':adaptersha,'mode':'original-strict-bytes' if strictsource else 'interpreted-legacy-adapter','metadata':f'metadata/{ordinal:02d}-interpretation.json','metadataSha256':sha((OUT/f'metadata/{ordinal:02d}-interpretation.json').read_bytes()),'parserExtraction':f'extracted/{ordinal:02d}.json','parsedOccurrenceCount':len(parsed['occurrences']),'supplementalQualificationCount':len(supp),'originalCompactRecognition':compact})
 validation.append({'ordinal':ordinal,'source':source,'rawHashAndLengthMatch':True,'parserExitCode':c.returncode,'sourceIDPreserved':parsed['source']==source,'strictOccurrencesUnchanged':parsed['occurrences']==strict[source]['occurrences'] if strictsource else None,'retainedSha256':adaptersha,'adapterMappingsVerified':len(adaptermaps),'fullRawCopyByteEquality':(OUT/rawcopy).read_bytes()==raw})

writej('finding-source-record-proposals.json',{'version':1,'proposalRevision':PROPOSAL_REVISION,'correctionRound':1,'proposalOnly':True,'registrationPerformed':False,'records':records,'strictOccurrencePolicy':'Original24 source/section/position/key/text and raw strict reports retained exactly; extra qualifiers are supplemental requirements, never conflicting same-source extraction.','countUnit':'Parsed occurrences include historical finding appearances, explicit pending obligations, scopes/coverage qualifications and historical rejected claims. They are NOT an outstanding-defect total.'})
writej('source-correspondence-supported-proposals.json',{'version':1,'proposalOnly':True,'approvals':associations})
writej('source-correspondence-unsupported-gaps.json',{'version':1,'proposalOnly':True,'associations':associationgaps})
writej('supplemental-qualifications.json',{'version':1,'qualifications':supplemental,'status':'Exact raw pending/coverage qualifications outside strict24 need parent-supported requirement ownership mapping. They do not modify strict occurrence counts or assert any acceptance.'})
writej('unresolved-gaps.json',{'version':1,'gaps':gaps,'globalGaps':[{'id':'fresh-review-before-registration','basis':'All records and supported correspondences here remain proposals; parent/fresh independent review must validate selection, full-item boundaries, raw mappings, status semantics and owner accounting before any canonical registration.'},{'id':'historical-repair-sufficiency','basis':'No repair/fix/CLEAN/DONE/later-silence/rejection disposition applied. Historical rejections retain their original state/reasons only.'},{'id':'requirement-ownership','basis':'Every pending obligation and strict supplemental qualification must be mapped to the current named requirement inventory by its acceptance owner before completeness/acceptance claims.'},{'id':'legacy-canonicalization-policy','basis':'Adapter section labels and physical-order item boundaries are prospective; original section labels/ordinals and bytes remain separate. Current-code applicability and semantic cross-source identities remain unjudged.'}]})
manifest={'version':1,'proposalRevision':PROPOSAL_REVISION,'correctionRound':1,'failedInitialSnapshot':'/private/tmp/ufz-correction-legacy-adapters-initial','failedReview':'review-evidence/adapter-initial-failed-review.md','proposalOnly':True,'scope':'79 bounded historical sources; no original/canonical run writes','originalRun':str(RUN),'originalRunMdSha256':sha(runbytes),'inputs':inputhashes,'parser':str(PARSER),'parserSha256':sha(PARSER.read_bytes()),'namespace':'legacy-report-adapters-r1; synthetic section roles + original raw section ordinal + original byte start; JSON pointers separately attributed','offsetConvention':'Raw UTF-8 byte offsets zero-based half-open; raw lines 1-based inclusive. Raw spans may begin/end within a line, explicitly byte-bound. Each selected item has one synthetic adapter section and adapter position1; this position is not an original heading/unit position.','reversal':'Read each rawCopy and verify rawSha256/rawByteCount; these are exact complete original reports. Metadata preserves exact original section hierarchy and all interpreted raw spans. Adapter text transformation maps are explicit; never reverse by discarding provenance or inferring missing raw content.','sources':man,'counts':dict(counts),'registrationCount':0,'appliedLinks':0,'appliedDispositions':0}
writej('reversible-manifest.json',manifest)
obligationAccounting=[]
for entry in man:
 s=next(x for x in sources if x['source']==entry['source']);md=json.loads((OUT/entry['metadata']).read_bytes())
 for n,p in enumerate(passages(s)):
  rs=roles(p)
  if not any(('deferred' in r or 'obligation' in r or r in ('caller-acceptance-not-discharged','separate-human-gate-preserved')) for r in rs):continue
  matches=[x for x in md['selectedExactSpans'] if x['byteStart']<p['byteEnd'] and x['byteEnd']>p['byteStart']]
  assert matches,(s['ordinal'],n,'reviewed obligation has no proposed representation')
  refs=[{'source':s['source'],'section':x['adapterSection'],'position':x['adapterPosition']} for x in md.get('adapterOccurrenceMap',[]) if x['rawByteStart']<p['byteEnd'] and x['rawByteEnd']>p['byteStart']]
  obligationAccounting.append({'source':s['source'],'reviewedPassageIndex':n,'roles':rs,'rawLineStart':p['lineStart'],'rawLineEnd':p['lineEnd'],'rawByteStart':p['byteStart'],'rawByteEnd':p['byteEnd'],'originalFullRawText':p['rawText'],'representation':'exact strict occurrence or explicit supplemental qualification' if entry['mode']=='original-strict-bytes' else 'adapter occurrence; exact complete mixed passage also retained in metadata','proposedExactRefs':refs,'proposedRequirementName':f'history/source-{s["ordinal"]:02d}/raw-byte-{p["byteStart"]}','requirementMappingStatus':'Parent/fresh owner mapping remains required; no obligation discharged.'})
writej('pending-obligation-accounting.json',{'version':1,'sourceScope':'All 79 independent source interpretations, all reviewed passages expressly classified deferred/obligation/separate human gate; structured obligations separately preserved in adapter maps.','reviewedObligationPassageCount':len(obligationAccounting),'unrepresentedReviewedObligationPassages':0,'qualifications':obligationAccounting,'claimLimit':'Coverage follows the independent reviewed role judgments, not a new assertion that every original raw passage is an actual pending requirement. Full raw/context remains reversible.'})
# Check input immutability and all map/source identities after producing all records.
assert (RUN/'run.md').read_bytes()==runbytes
for s in sources:assert sha((RUN/s['rawArtifact']).read_bytes())==s['rawSha256']
assert sum(len(r['record']['occurrences']) for r in records if r['record']['source'] in strict)==24
assert len({r['record']['source'] for r in records})==79
allrefs=[(r['record']['source'],o['section'],o['position']) for r in records for o in r['record']['occurrences']];assert len(allrefs)==len(set(allrefs))
writej('validation-results.json',{'version':1,'validationScope':'Read-only existing report-verdict on temporary raw copies/adapters only; no broad/product suites or live agents.','sourceCount':79,'parsedSourceCount':len(validation),'rawVerifiedCount':rawverified,'reviewedObligationPassagesAccounted':len(obligationAccounting),'unrepresentedReviewedObligationPassages':0,'reviewedExactPassageSpansVerified':reviewspanchecks,'structuredJsonValueSpansAndDecodedFieldsVerified':structuredspanchecks,'reviewedLineLocatorsVerified':reviewspanchecks,'strictSourceCount':5,'strictOccurrenceCount':24,'strictValuesAndOrderExactlyMatchOriginal':True,'interpretedAdapterCount':74,'newAdapterOccurrenceCount':sum(v['parsedOccurrenceCount'] for v in man if v['mode']=='interpreted-legacy-adapter'),'supportedCorrespondenceProposalCount':len(associations),'unsupportedOriginalOutcomeAssociationCount':len(associationgaps),'supplementalQualificationCount':len(supplemental),'uniqueOccurrenceRefs':True,'current73NoSourceArtifactHashOverlap':True,'originalRunAndSourceHashesUnchanged':True,'canonicalWrites':0,'identityLinksApplied':0,'dispositionsApplied':0,'acceptanceClaim':None,'counts':dict(counts),'sources':validation})
lines=['# Reversible legacy adapter proposal','', 'Proposal revision2, correction round1. The initial snapshot failed fidelity/spec and quality review (NEEDS_FIX); its frozen evidence and complete failed review remain retained. F1/F2 and the parent\'s bounded structured-concern ruling are corrected here, pending fresh semantic review. No source registration, semantic identity link, supported resolution, canonical mutation or acceptance decision was performed.','',f'All 79 reviewed historical source identities and hashes are distinct from the current 73 registrations, retained artifact paths and raw-byte hashes. Five original strict reports and their 24 occurrence objects remain exact. The 74 original strict failures remain historical failures; new interpreted documents are separate artifacts.','',f'The 74 adapters re-extract with the existing report-verdict --complete and original immutable source IDs. Their {sum(v["parsedOccurrenceCount"] for v in man if v["mode"]=="interpreted-legacy-adapter")} occurrences are appearances/obligations/qualifications, not a current outstanding-defect total. All original raw reports are copied exactly for reversal.','',f'{len(associations)} status-preserving correspondence proposals retain recognizable original kind/verdict; {len(associationgaps)} associations remain unsupported because the original kind/verdict is unknown. NEEDS_CONTEXT on those documents belongs only to this new adapter. Original verdict/status fields are preserved independently. Roast markers are copied exactly.','', 'Actual reviewed findings and pending/coverage qualifications are explicitly classified. Thirteen explicit source-local judgments preserve actual asserted historical findings together with their unadjudicated repair claims. Pure repair/TDD/support/example passages and redundant same-source summaries remain hash-bound metadata. The metrics example stays labelled contextual evidence; its exact population qualification is extracted. The parent requested two named structured concern renditions as additional separately attributed appearances. This bounded choice is not an exhaustive-every-quote claim. Mixed passages use exact byte-bounded splits and preserve complete original passages. JSON/prose appearances remain distinct, with no applied identity links. Multi-paragraph actual findings and bounded remediation lists remain complete items.','',f'The strict sources carry {len(supplemental)} additional exact supplemental qualifications outside strict24. They are named requirement-mapping gaps; they do not replace strict extraction or fabricate new original invocations. All semantic ambiguities and unknown-status associations remain in unresolved-gaps.json.','', 'No None was inferred from a parser failure, DONE/CLEAN/FIXED, missing heading, silence or task closure. Scoped explicit empty declarations are retained with their exact reviewed evidence and qualifications. Pending obligations survive every status and repair assertion.','', 'Task 19 canonical/handoff report and review pairs are byte-identical under the corrected intake handoff. The earlier differing-byte claim is withdrawn; byte equality supplies no finding identity or supported disposition.','', 'Parent/fresh review must validate this proposal before any registration, correspondence approval, obligation mapping or acceptance claim. Raw span/extraction/hash checks prove representation consistency; they do not establish the semantic sufficiency of a repair, current applicability, global completeness or readiness.','', 'Run `python3 build_proposal.py` to reproduce this directory using the fixed input evidence paths. It writes only this directory and invokes existing report-verdict read-only on temporary files. Product suites were not run.','', '## Artifacts','', '- reversible-manifest.json: source identities, hashes, reversible raw copies, adapter paths, metadata and count units.','- finding-source-record-proposals.json: 79 original-source-ID records for review, including exact strict24.','- source-correspondence-supported-proposals.json: hash-bound status-preserving correspondence drafts only.','- source-correspondence-unsupported-gaps.json: genuinely unknown original outcome associations.','- supplemental-qualifications.json, pending-obligation-accounting.json and unresolved-gaps.json: exact pending/coverage qualifications, complete accounting of independently classified obligations, and named owner-mapping/interpretation gaps.','- validation-results.json: parser, raw hash/length, exact span, identity uniqueness and original-source immutability checks.','- CORRECTION-ROUND-1.md, correction-round-1/, mixed-passage-judgments.json and selection_controls.py: failed review, explicit correction judgments, exact RED/GREEN evidence, selection-specific controls and change map.','- review-evidence/, metadata/, raw/, existing-strict-json/, extracted/: full provenance and exact preserved inputs.','', '## Per-source extraction','', '| Ordinal | Original source | Mode | Occurrences | Original compact outcome |','|---|---|---|---:|---|']
for x in man:lines.append(f'| {x["ordinal"]} | `{x["source"]}` | {x["mode"]} | {x["parsedOccurrenceCount"]} | {x["originalCompactRecognition"].get("kind","unknown")}: {x["originalCompactRecognition"].get("verdict","unknown")} |')
(OUT/'REPORT.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'sources':79,'counts':dict(counts),'supportedCorrespondenceProposals':len(associations),'unsupportedCorrespondenceGaps':len(associationgaps),'supplementalQualifications':len(supplemental),'namedSourceGaps':len(gaps),'canonicalWrites':0},indent=2))
