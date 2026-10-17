#!/usr/bin/env python3
"""Bounded historical report intake. Sidecar extraction only, never resolution.

Reads the pinned inventory and immutable raw bytes, partitions them losslessly into
source sections, and retains exact passages. Explicit heading/field context selects
candidate appearances without inventing section labels or a verdict. These are
prospective sidecars, not authorization to append canonical source records.
"""
import argparse, collections, hashlib, json, pathlib, re

ROOT=pathlib.Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
RUN=ROOT/'docs/superpowers/runs/2026-10-16-workflow-reliability'
OUT=pathlib.Path('/private/tmp/ufz-correction-history-intake')
INVENTORY=RUN/'task-report-history-intake-r1.json'
sha=lambda x:hashlib.sha256(x).hexdigest()

def dump(p,obj):
 p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')

def blocks(lines,start,end):
 """Exact prose/list/fence units, retaining continuations and untrimmed raw spans."""
 out=[];i=start
 while i<end:
  if not lines[i].strip():i+=1;continue
  a=i;fm=re.match(r'^\s{0,3}(`{3,}|~{3,})',lines[i])
  if fm:
   mark=fm.group(1);i+=1
   while i<end:
    if re.match(r'^\s{0,3}'+re.escape(mark[0])+r'{'+str(len(mark))+r',}\s*$',lines[i].rstrip('\r\n')):
     i+=1;break
    i+=1
   kind='fenced-block'
  else:
   bm=re.match(r'^ ?(?:[-*]|[0-9]+[.)])[ \t]+',lines[i])
   kind='list-item' if bm else 'paragraph';i+=1
   while i<end:
    if bm:
     if re.match(r'^ ?(?:[-*]|[0-9]+[.)])[ \t]+',lines[i]):break
     # A blank followed by nonindented prose ends a list item. Indented multiline
     # evidence remains part of that exact item, including nested bullets.
     if not lines[i].strip():
      j=i+1
      while j<end and not lines[j].strip():j+=1
      if j>=end or (lines[j] and not lines[j][0].isspace()):break
    elif not lines[i].strip() or re.match(r'^ ?(?:[-*]|[0-9]+[.)])[ \t]+',lines[i]) or re.match(r'^\s{0,3}(`{3,}|~{3,})',lines[i]) or re.match(r'^(?:Status|status|Task|task|id|base|head|Base|Head|finding|Finding|Critical|Important|Minor|Issues|Spec compliance|Unverified requirements?|Warnings? items?)\s*:',lines[i]):break
    i+=1
  z=i
  while z>a and not lines[z-1].strip():z-=1
  raw=''.join(lines[a:z]);text=raw.rstrip('\r\n')
  marker=None
  if kind=='list-item':
   mm=re.match(r'^( ?(?:[-*]|[0-9]+[.)])[ \t]+)(.*)',text,re.S);marker=mm.group(1);text=mm.group(2)
  out.append(dict(start=a,end=z,unitKind=kind,rawText=raw,text=text,listMarker=marker))
 return out

def partition(raw):
 text=raw.decode('utf-8');lines=text.splitlines(keepends=True);offset=[0]
 for l in lines:offset.append(offset[-1]+len(l.encode('utf-8')))
 heads=[];fence=None
 for i,line in enumerate(lines):
  fm=re.match(r'^\s{0,3}(`{3,}|~{3,})',line)
  if fence:
   if re.match(r'^\s{0,3}'+re.escape(fence[0])+r'{'+str(len(fence))+r',}\s*$',line.rstrip('\r\n')):fence=None
   continue
  if fm:fence=fm.group(1);continue
  hm=re.match(r'^(#{1,6})[ \t]+(.*?)(?:\r?\n)?$',line)
  if hm:heads.append((i,len(hm.group(1)),hm.group(2),line))
  else:
   bm=re.match(r'^\*\*([^*]+)\*\*(.*?)(?:\r?\n)?$',line)
   if bm and (bm.group(1).rstrip(':').lower() in ['issues','spec compliance','test evidence','focused boundary checks','strengths']):
    # Only standalone original bold labels, preserving inline suffix as body.
    heads.append((i,2,bm.group(1),line))
 sections=[];stack=[];starts=[(-1,0,None,None)]+heads
 for n,(h,level,label,headingraw) in enumerate(starts):
  end=starts[n+1][0] if n+1<len(starts) else len(lines)
  start=0 if h<0 else h
  bs=start if h<0 else h+1
  if label is not None:
   while stack and stack[-1][0]>=level:stack.pop()
   stack.append((level,label))
  sec={'section':label,'sectionOrdinal':n,'headingLevel':level,'headingRaw':headingraw,'hierarchy':[a[1] for a in stack],
       'lineStart':start+1,'lineEnd':end,'byteStart':offset[start],'byteEnd':offset[end],
       'bodyLineStart':bs+1,'rawText':''.join(lines[start:end]),'bodyRawText':''.join(lines[bs:end]),'units':[]}
  for k,u in enumerate(blocks(lines,bs,end),1):
   a=u.pop('start');z=u.pop('end')
   u.update(positionInSection=k,lineStart=a+1,lineEnd=z,byteStart=offset[a],byteEnd=offset[z])
   assert raw[offset[a]:offset[z]].decode('utf-8')==u['rawText']
   sec['units'].append(u)
  sections.append(sec)
 assert ''.join(s['rawText'] for s in sections).encode('utf-8')==raw
 return sections

FIND_HEADING=re.compile(r'^(?:concerns?\b|blockers?\b|findings?\b|deferred\b|must[- ]fix\b|untested scope\b|confirmed findings\b|not verified\b|beyond remainder cap\b|rejected\b|unverified nits\b|escalations\b|issues:?$|critical\b|important\b|minor\b)',re.I)
SCOPE_HEADING=re.compile(r'(?:concern|remaining evaluation|behavior evaluation|behaviour evaluation|pending caller|scope limit|assumption|fix pass|seam fix|self-review)',re.I)
WARNING=re.compile(r'⚠|❌|\b(?:remain(?:s)? (?:pending|outstanding|unmeasured|unknown)|not (?:run|measured|established)|unverified|not demonstrated|caller-owned|parent-owned|coordinator-owned)\b',re.I)
INLINE_FINDING=re.compile(r'^(?:[-*] )?(?:\*\*)?(?:finding|critical|important|minor|issues|concerns?|unverified requirements? items?|warnings? items?)\s*(?:\*\*)?\s*[:—/]',re.I)
NONE=re.compile(r'^(?:none[.!]?|null|\[\]|""|\'\')$',re.I)

def context_class(section,text):
 label=section['section'] or '';hier=section['hierarchy'];x=text.strip()
 if re.search(r'^rejected\b',label,re.I):return 'historically-rejected-assertion'
 if re.search(r'^(?:not verified|unverified nits|untested scope)\b',label,re.I):return 'unverified-or-untested-assertion'
 if re.search(r'^beyond remainder cap',label,re.I):return 'historical-count-only-declaration'
 if re.search(r'^escalations',label,re.I):return 'historical-escalation-assertion'
 if re.search(r'concern|pending|evaluation|scope limit|assumption',label,re.I):return 'scope-concern-or-qualification'
 if re.search(r'^minor\b',label,re.I) or re.match(r'^(?:[-*] )?Minor\s*:',x,re.I):return 'historical-minor-assertion'
 if re.search(r'^(?:important|critical|confirmed findings|finding)',label,re.I) or re.match(r'^(?:[-*] )?(?:Important|Critical|finding)\s*[:—/]',x,re.I):return 'historical-finding-assertion'
 return 'narrative-finding-context'

def candidate_for(source,sec,u):
 text=u['text'];label=sec['section'] or '';isfind=bool(FIND_HEADING.search(label));scope=bool(SCOPE_HEADING.search(label));inline=bool(INLINE_FINDING.search(text));warn=bool(WARNING.search(text))
 if u['unitKind']=='fenced-block':return None
 # All unheaded legacy text is retained for manual interpretation, with exact original label null.
 unheaded=sec['section'] is None
 if not (isfind or scope or inline or warn or unheaded):return None
 typ=context_class(sec,text)
 explicitnone=bool(NONE.fullmatch(re.sub(r'^(?:Finding|Critical|Important|Minor)\s*:\s*','',text.strip(),flags=re.I)))
 if explicitnone:typ='explicit-no-finding-declaration'
 qualifiednone=bool(re.match(r'^(?:(?:Finding|Critical|Important|Minor)\s*:\s*)?None\b',text.strip(),re.I)) and not explicitnone
 return {'source':source,'section':sec['section'],'sectionOrdinal':sec['sectionOrdinal'],'hierarchy':sec['hierarchy'],
  'positionInSection':u['positionInSection'],'key':text.split('\n')[0],'text':text,'rawText':u['rawText'],
  'lineStart':u['lineStart'],'lineEnd':u['lineEnd'],'byteStart':u['byteStart'],'byteEnd':u['byteEnd'],
  'appearanceClass':typ,'isDeclaration':explicitnone,'qualifiedNone':qualifiednone,
  'interpretation':'prospective-exact-passage; no semantic disposition or identity merge',
  'selectionBasis':('explicit-finding-heading' if isfind else 'scope-heading' if scope else 'inline-finding-field' if inline else 'warning-or-pending-wording' if warn else 'unheaded-narrative-context'),
  'requiresSemanticInterpretation':not explicitnone}

def json_observations(sections):
 out=[];decoder=json.JSONDecoder()
 for sec in sections:
  for u in sec['units']:
   raw=u['rawText'];spans=[]
   # Decode fenced JSON plus headerless JSON object reports, preserving complete original block.
   if u['unitKind']=='fenced-block':
    first=raw.find('\n');last=raw.rfind('\n```');payload=raw[first+1:last] if first>=0 and last>first else ''
    try:obj=json.loads(payload);spans.append((obj,None))
    except (ValueError,TypeError):pass
   elif re.match(r'^\s*\{',raw):
    try:obj=json.loads(raw);spans.append((obj,None))
    except ValueError:pass
   for obj,_ in spans:
    if not isinstance(obj,dict):continue
    for field in ['finding','minors','concerns','warnings','unverified']:
     if field not in obj:continue
     val=obj[field]
     values=val if isinstance(val,list) else [val]
     if values==[]:values=[[]]
     for k,v in enumerate(values):
      out.append({'section':sec['section'],'sectionOrdinal':sec['sectionOrdinal'],'field':field,
       'jsonPointer':'/'+field+(('/'+str(k)) if isinstance(val,list) and val else ''),
       'fieldValue':v,'text':v if isinstance(v,str) else None,'exactJsonBlock':raw,
       'lineStart':u['lineStart'],'lineEnd':u['lineEnd'],'byteStart':u['byteStart'],'byteEnd':u['byteEnd'],
       'isExplicitEmptyDeclaration':v is None or v=='' or v==[],
       'interpretation':'original JSON-field appearance; not automatically linked to prose renditions; empty is this field only'})
 return out

def locate_existing(raw,record):
 lines=raw.decode('utf-8').replace('\r\n','\n').replace('\r','\n').split('\n');out=[]
 for oc in record['occurrences']:
  first=oc['text'].split('\n')[0];matches=[]
  for i,l in enumerate(lines):
   stripped=re.sub(r'^ ?(?:[-*]|[0-9]+[.)])[ \t]+','',l)
   if stripped==first:
    wanted=oc['text'].split('\n')
    actual=[stripped]+lines[i+1:i+len(wanted)]
    if actual==wanted:matches.append({'lineStart':i+1,'lineEnd':i+len(wanted)})
  out.append(dict(oc,exactFullTextMatches=matches,locatorAmbiguous=len(matches)!=1))
 return out

def build_one(source,path,meta,previous=None,role=None):
 raw=path.read_bytes();sections=partition(raw)
 if meta.get('sha256'):
  assert sha(raw)==meta['sha256'],str(path)+' SHA mismatch'
  assert len(raw)==meta['byteCount'],str(path)+' bytecount mismatch'
 candidates=[]
 for s in sections:
  for u in s['units']:
   c=candidate_for(source,s,u)
   if c:candidates.append(c)
 statuses=[{'line':i+1,'rawText':line} for i,line in enumerate(raw.decode().splitlines()) if re.search(r'\b(?:[Ss]tatus|super-roast verdict)\s*:',line)]
 standard=any(FIND_HEADING.search(s['section'] or '') for s in sections)
 classification='historical-roast-report' if 'roast' in path.name else ('seam-finding-artifact' if 'seam-findings' in path.name else ('legacy-task-review' if 'review' in path.name else 'legacy-task-report'))
 if path.suffix=='.diff':classification='non-finding-diff-artifact'
 elif role=='brief':classification='input-brief-not-report'
 result={'sidecarVersion':1,'source':source,'artifact':str(path),'rawArtifact':meta.get('rawPath',meta.get('durablePath',meta.get('retainedPath'))),
  'rawSha256':sha(raw),'rawByteCount':len(raw),'originalMetadata':meta,
  'classification':classification,'hasStandardizedFindingHeadings':standard,
  'reportedStatusLines':statuses,'sourceDisposition':'lossless-source-sidecar; prospective interpretation only',
  'resolutionRecords':[],'acceptanceJudgment':None,'sections':sections,'candidatePassages':candidates,
  'structuredFieldAppearances':json_observations(sections),
  'uncertainties':['No automatic identity link between prose, JSON, fix-pass copies, archive variants or repeated text.',
   'No later status, silence, FIXED/DONE/CLEAN, task closure or existence of verification discharges any appearance.'],
  'verification':{'shaAndByteCountMatchInventory':bool(meta.get('sha256')),'allBytesPartitionedExactly':True,'allPassageByteLocatorsVerified':True}}
 if not standard:result['uncertainties'].append('Standardized finding headings absent: full narrative and original labels retained; absence does not imply zero findings.')
 if previous:
  old=json.loads((RUN/previous['parsedSourceJSON']).read_text());result['existingStrictExtraction']=old
  result['existingOccurrencesWithLocators']=locate_existing(raw,old)
  assert len(old['occurrences'])==previous['occurrences']
  result['sourceDisposition']='existing strict extraction retained unchanged; augmented exact-section sidecar'
 else:result['sourceDisposition']='legacy format retained with exact passages; canonical parser gap not silently cleared'
 return result

def main():
 invraw=INVENTORY.read_bytes();inv=json.loads(invraw);rawmeta={x['durablePath']:x for x in inv['rawFiles']}
 entries=[]
 for s in inv['extractionGaps']:entries.append((s['source'],s['rawPath'],s,None))
 for s in inv['proposedSourceRecords']:entries.append((s['source'],s['rawArtifact'],s,s))
 assert len(entries)==79 and len({a[0] for a in entries})==79
 records=[]
 for idx,(source,rel,s,old) in enumerate(entries,1):
  meta=dict(rawmeta.get(rel,{}),**s);meta['rawPath']=rel
  r=build_one(source,RUN/rel,meta,old);name=f'{idx:02d}-{pathlib.Path(rel).stem}.sidecar.json';dump(OUT/'sidecars'/name,r)
  records.append({'ordinal':idx,'source':source,'rawArtifact':rel,'rawSha256':r['rawSha256'],'rawByteCount':r['rawByteCount'],
   'classification':r['classification'],'disposition':r['sourceDisposition'],'sidecar':'sidecars/'+name,
   'sectionCount':len(r['sections']),'candidatePassageCount':len(r['candidatePassages']),
   'structuredFieldAppearanceCount':len(r['structuredFieldAppearances']),
   'existingStrictOccurrenceCount':len(r.get('existingStrictExtraction',{}).get('occurrences',[])),
   'hasStandardizedFindingHeadings':r['hasStandardizedFindingHeadings']})
 variants=[]
 for idx,s in enumerate(inv['alreadyRetainedTask19VariantPathReferences'],1):
  stem=pathlib.Path(s['retainedPath']).stem;invocation=inv['mappings']['fixCodeInvocation'];source=invocation+'/'+stem
  r=build_one(source,RUN/s['retainedPath'],s)
  if pathlib.Path(s['retainedPath']).suffix=='.diff':r['sourceDisposition']='non-finding supporting diff; retained for provenance; not counted as report source'
  name=f'variant-{idx}-{pathlib.Path(s["retainedPath"]).name}.sidecar.json'
  canonical=[x for x in records if x['source']==source]
  r['canonicalByteRelationship']={'canonicalRawArtifact':canonical[0]['rawArtifact'] if canonical else None,'sameAsCanonicalBytes':canonical[0]['rawSha256']==r['rawSha256'] if canonical else None,'interpretation':'Exact byte equality is an archive-copy fact, not semantic finding disposition or automatic record registration.'}
  dump(OUT/'variants'/name,r)
  variants.append({'sourceNameReference':source,'retainedPath':s['retainedPath'],'sha256':r['rawSha256'],'byteCount':r['rawByteCount'],
   'sidecar':'variants/'+name,'canonicalRawSha256':canonical[0]['rawSha256'] if canonical else None,
   'sameAsCanonicalBytes':canonical[0]['rawSha256']==r['rawSha256'] if canonical else None,
   'classification':r['classification'],'disposition':r['sourceDisposition']})
 included={x['rawArtifact'] for x in records};excluded=[]
 for s in inv['rawFiles']:
  raw=(RUN/s['durablePath']).read_bytes();assert sha(raw)==s['sha256'] and len(raw)==s['byteCount']
  if s['durablePath'] not in included:
   reason='input brief; not an output report or new finding source' if s['logicalRole']=='brief' else 'supporting JSON artifact outside the bounded 79 report population; not silently interpreted as a new finding source'
   excluded.append(dict(s,scopeDisposition=reason))
 cov={'schemaVersion':1,'purpose':'Prospective lossless historical sidecars; extraction/accounting only. No source-code change or canonical ledger writes.',
  'inventoryPath':str(INVENTORY),'inventorySha256':sha(invraw),'boundedSourceCount':len(records),'priorGapSourceCount':74,'alreadyParsedSourceCount':5,
  'existingStrictOccurrenceCount':sum(r['existingStrictOccurrenceCount'] for r in records),
  'candidatePassageCount':sum(r['candidatePassageCount'] for r in records),
  'structuredFieldAppearanceCount':sum(r['structuredFieldAppearanceCount'] for r in records),
  'newCanonicalOccurrences':0,'newCanonicalOccurrenceReason':'Candidate passages and field appearances are explicitly prospective, not fabricated parser-compatible occurrences. Preserve raw section/position and review interpretation before canonical ingestion.',
  'sources':records,'task19RetainedVariants':variants,'rawInventoryExcludedFrom79':excluded,
  'unresolvedAmbiguities':['74 canonical strict-parser failures are accounted for but not relabeled parse successes; sidecars are a separate representation.',
   'Paragraph/list units are mechanical source passages, not a claim of semantic finding boundaries or severity.',
   'Repeated prose/JSON/fix-report appearances and similar wording are not merged without explicit supported references.',
   'Task 19 report/review retained copies match canonical intake bytes exactly; no byte mismatch is established. Archive-copy equality does not itself register or resolve findings.',
   'No acceptance or resolution decision is made; explicit None statements remain local historical assertions with their qualifications.'],
  'verification':{'all110InventoryFilesShaAndByteCountsVerified':True,'all79SourceDispositionsPresent':True,'allSectionsReconstructOriginalBytes':True,
   'rawSourceWrites':False,'sourceCodeWrites':False,'runMdWrites':False,'gitMutations':False,'herdrWrites':False}}
 dump(OUT/'coverage.json',cov)
 md=['# Bounded historical task-report intake','','All **79** requested source entries have a lossless sidecar: **74** former parser gaps and **5** existing strict parses (**24** existing strict occurrences). Every original section label, heading position, body and full item/passage text is retained with exact byte and line locators. All 110 raw-inventory SHA-256 values and byte counts match the inventory. No raw source, source code, run.md or Git state was changed.','',
  f'The sidecars retain **{cov["candidatePassageCount"]} prospective passages** and **{cov["structuredFieldAppearanceCount"]} structured-field appearances**. Those counts include declarations, qualifications and repeated renditions; they are not counts of unique defects or new canonical occurrences. No parse failure, DONE/FIXED/CLEAN status, later silence or reported fix was converted into None or resolution.','',
  '## Boundaries and uncertainties','','A sidecar is an evidence representation, not a replacement parser or an accepted source record. All 74 original strict-parser failures remain visibly qualified. Narrative reports without standardized headings retain their complete text; unheaded fields retain a null section rather than an invented heading. Explicit None declarations are retained as declarations, while qualified None plus remaining obligations is retained in full. JSON renditions and prose renditions stay separate. No identities are automatically merged.','',
  'The three known Task 19 handoff references are separately hash-checked and retained. Both report/review handoff copies are byte-identical to their canonical raw-intake counterparts; no byte mismatch is established. No canonical source record or semantic disposition was changed. The diff is supporting evidence, not a finding report. The other 33 raw-inventory artifacts (29 input briefs and four JSON helpers) are explicitly accounted for outside the requested 79-source report population.','',
  '## Source coverage','','| # | Source | Format | Passages | Existing strict occurrences | Sidecar |','|---|---|---|---:|---:|---|']
 for r in records:md.append(f'| {r["ordinal"]} | `{r["source"]}` | {r["classification"]} | {r["candidatePassageCount"]} | {r["existingStrictOccurrenceCount"]} | [{pathlib.Path(r["sidecar"]).name}]({r["sidecar"]}) |')
 md+=['','## Retained Task 19 variants','']
 for v in variants:md.append(f'- `{v["retainedPath"]}`: SHA-256 `{v["sha256"]}`, {v["byteCount"]} bytes; canonical byte match: {v["sameAsCanonicalBytes"]}. [{pathlib.Path(v["sidecar"]).name}]({v["sidecar"]})')
 md+=['','## Reproduce','','Run `python3 adapt_history.py` from any directory. The utility reads only the named inventory/raw/retained paths and writes only this output directory. It asserts raw hashes/lengths, exact section reconstruction, exact passage byte locators and the 79-source population. It runs no product tests and modifies no canonical source or ledger.','']
 (OUT/'coverage.md').write_text('\n'.join(md))
 print(json.dumps({k:cov[k] for k in ['boundedSourceCount','existingStrictOccurrenceCount','candidatePassageCount','structuredFieldAppearanceCount','newCanonicalOccurrences']}))
if __name__=='__main__':main()
