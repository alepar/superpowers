#!/usr/bin/env python3
"""Curated occurrence-oriented view of the lossless sidecars. No canonical writes.

Selection is explicit by source and original label/field. Context passages,
no-finding declarations and claimed repairs remain separate from findings.
"""
import pathlib,json,re,hashlib,collections
OUT=pathlib.Path('/private/tmp/ufz-correction-history-intake')
def read(p):return json.loads(p.read_text())
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def copied(sec,u,source):
 return {'source':source,'section':sec['section'],'sectionOrdinal':sec['sectionOrdinal'],'positionInSection':u['positionInSection'],
  'key':u['text'].split('\n')[0],'text':u['text'],'rawText':u['rawText'],'lineStart':u['lineStart'],'lineEnd':u['lineEnd'],
  'byteStart':u['byteStart'],'byteEnd':u['byteEnd'],'originalHierarchy':sec['hierarchy']}
def empty(t):
 t=re.sub(r'^(?: ?[-*] )?(?:Critical|Important|Minor|Finding|finding|Unverified requirements?(?: items?)?|Warnings?(?: items?)?)\s*:\s*','',t.strip())
 return bool(re.fullmatch(r'(?:[Nn]one[.!]?|null|\[\]|"")',t))
FIND_SECTION_RULES={
 'task-10-review.md':['Issues'],
 'task-11-review-seam-round-1.md':[None],
 'task-11-review.md':[None],
 'task-12-seam-findings.md':['Important'],
 'task-14-review.md':['Important','Minor'],
 'task-15-review.md':['Important'],
 'task-15-seam-findings.md':['Important'],
 'task-16-seam-findings.md':['Important'],
 'task-19-review.md':['Findings'],
 'task-2-review.md':['Issues'],
 'task-20-review.md':['Important','Minor / deferred coverage'],
 'task-29-review.md':['Minor / deferred observation'],
 'task-4-seam-findings.md':['Important'],
 'task-5-review.md':['Issues'],
 'task-6-review.md':['Issues'],
 '2026-10-16-workflow-reliability-roast-pr-1.md':['Confirmed findings','Rejected'],
}

def is_curated_finding(name,sec,u):
 label=sec['section'];t=u['text'].strip()
 if name=='task-11-review-seam-round-1.md':return label is None and t.startswith('finding:') and not empty(t)
 if name=='task-11-review.md':return label is None and t.startswith('skills/super-code/coordinator.js:1511')
 if name=='task-10-review.md':return label=='Issues' and t.startswith('Important —')
 if name=='task-19-review.md':return label=='Findings' and t.startswith('Important / Missing')
 if name=='task-2-review.md':return label=='Issues' and t.startswith('Minor:') and not empty(t)
 if name=='task-5-review.md':return label=='Issues' and t.startswith('Minor:') and not empty(t)
 if name=='task-6-review.md':return label=='Issues' and t.startswith('[deferred-live-evaluation]')
 rules=FIND_SECTION_RULES.get(name,[])
 return any(label and label.startswith(a) for a in rules if a) and not empty(t) and u['unitKind']!='fenced-block'

def main():
 coverage=read(OUT/'coverage.json');projected=[];allfind=[];counts=collections.Counter()
 for entry in coverage['sources']:
  d=read(OUT/entry['sidecar']);name=pathlib.Path(entry['rawArtifact']).name
  existing=d.get('existingStrictExtraction');p={'source':d['source'],'rawArtifact':d['rawArtifact'],'rawSha256':d['rawSha256'],'rawByteCount':d['rawByteCount'],
   'classification':d['classification'],'sidecar':entry['sidecar'],'existingStrictOccurrences':existing['occurrences'] if existing else [],
   'newFindingAppearances':[],'structuredFindingAppearances':[],'scopeAndConcernPassages':[],'explicitEmptyDeclarations':[],
   'historicalRepairNarratives':[],'claimedDispositionPassages':[],'proposedAppearanceLinks':[],
   'canonicalReady':False,'canonicalReadyReason':'Prospective sidecar only; original identity and contextual/disposition interpretation remain separate.',
   'acceptanceJudgment':None,'resolutionRecords':[]}
  for sec in d['sections']:
   for u in sec['units']:
    if u['unitKind']=='fenced-block':continue
    x=copied(sec,u,d['source']);t=u['text'].strip();label=sec['section'] or ''
    if empty(t):p['explicitEmptyDeclarations'].append(x);continue
    if is_curated_finding(name,sec,u):
     x['sourceState']='historically-rejected' if label.startswith('Rejected') else 'historical-finding-or-minor; no disposition applied by intake'
     x['selectionBasis']='Explicit source-specific original finding/severity section or finding field; full selected item preserved.'
     if name=='task-20-review.md' and label=='Important':
      # Two paragraphs form one original unbulleted Important item; preserve the
      # exact blank separator and complete second paragraph rather than invent a second defect.
      if p['newFindingAppearances'] and p['newFindingAppearances'][-1]['section']=='Important':
       q=p['newFindingAppearances'][-1];raw=pathlib.Path(d['artifact']).read_bytes();q['byteEnd']=x['byteEnd'];q['lineEnd']=x['lineEnd'];q['rawText']=raw[q['byteStart']:q['byteEnd']].decode();q['text']=q['rawText'].rstrip('\r\n');continue
     p['newFindingAppearances'].append(x);continue
    if re.search(r'concern|remaining evaluation|scope limit|pending caller',label,re.I):
     x['role']='Original concern/scope/remaining-obligation text; not promoted to a product defect.';p['scopeAndConcernPassages'].append(x)
    elif t.startswith(('⚠','❌')) or re.search(r'(?:remain(?:s)? (?:explicitly )?(?:pending|outstanding|unmeasured)|not (?:run|measured)|(?:Parent|Caller|Coordinator)-owned .*pending)',t,re.I):
     x['role']='Explicit source qualification or pending-scope passage; not a new defect.';p['scopeAndConcernPassages'].append(x)
    if re.match(r'^Finding and ',label,re.I) or (name.endswith('-report-fix.md') and label=='Fix pass' and re.search(r'finding|fix|correction',t,re.I)):
     x['role']='Historical repair description or source claim; not a verified resolution.';p['historicalRepairNarratives'].append(x)
    if re.match(r'^(?:Resolution:|Resolved |The .*finding is (?:valid|resolved))',t):
     x['role']='Original author disposition/repair assertion retained verbatim; semantic support unjudged.';p['claimedDispositionPassages'].append(x)
  for j in d['structuredFieldAppearances']:
   y=dict(j,source=d['source'])
   if j['isExplicitEmptyDeclaration']:
    p['explicitEmptyDeclarations'].append(y)
   elif j['field'] in ['finding','minors']:
    y['sourceState']='Original structured finding/minor assertion; no inferred link or disposition.';p['structuredFindingAppearances'].append(y)
   else:
    y['role']='Original structured concern/scope assertion; not promoted to product defect.';p['scopeAndConcernPassages'].append(y)
  # Preserve the original strict occurrence objects byte-for-byte in value and order.
  if existing:
   assert p['existingStrictOccurrences']==existing['occurrences']
   p['originalStrictExtractionRetained']=True
   # Concern/source rerenditions are retained separately; no count is consolidated.
  # Proposed only: show exact source-text overlap without applying a link.
  for j in p['structuredFindingAppearances']:
   text=j.get('text') or ''
   for a in p['newFindingAppearances']:
    if text and (text in a['text'] or a['text'] in text):
     p['proposedAppearanceLinks'].append({'fromJsonPointer':j['jsonPointer'],'fromJsonBlockLine':j['lineStart'],
      'toOriginalSection':a['section'],'toLine':a['lineStart'],'reason':'Exact text containment inside this source; semantic identity still unjudged.','applied':False})
  if not p['newFindingAppearances'] and not p['structuredFindingAppearances'] and not existing:
   p['sourceReviewClassification']='No additional actionable item asserted by this intake. Explicit empty declarations, concerns and full narrative remain separately retained; no inferred None.'
  else:p['sourceReviewClassification']='Finding-bearing source appearances retained; current disposition not judged.'
  p['unresolvedAmbiguities']=['Source findings, context and quoted/structured repetitions are kept separate; no automatic identity merge or resolution.']
  if not d['hasStandardizedFindingHeadings']:
   p['unresolvedAmbiguities'].append('Narrative/headerless source: full original sections retained; canonical source format still needs an explicit interpretation, not an inferred None.')
  for k in ['existingStrictOccurrences','newFindingAppearances','structuredFindingAppearances','scopeAndConcernPassages','explicitEmptyDeclarations','historicalRepairNarratives','claimedDispositionPassages']:
   counts[k]+=len(p[k])
  projected.append(p)
 result={'schemaVersion':1,'purpose':'Occurrence-oriented prospective projection; contextual population is not a finding population. No canonical registration, resolution or acceptance.',
  'sourceCount':79,'counts':dict(counts),'sources':projected,'limits':[
  'Only the requested 79-source population is projected; three separate Task 19 variant sidecars retain their own raw-byte qualifier.',
  'New finding appearances are historical source assertions, not a judgment that the defect is currently actionable or unresolved.',
  'Scope/concern passages include pending live evaluations and ownership qualifications and remain outside the product-defect count.',
  'All candidate contextual passages remain available in lossless sidecars, but are not registered as findings.',
  'Original 24 strict occurrence objects are retained without any key/text/section/position rewrite.',
  'No proposed appearance link is applied; no original rejection state or reason is removed.']}
 dump(OUT/'occurrence-projection.json',result)
 md=['# Occurrence-oriented historical projection','',f'All **79** sources are accounted for. The **24** original strict occurrence objects are unchanged. This view separates **{counts["newFindingAppearances"]} new historical finding/minor appearances** and **{counts["structuredFindingAppearances"]} structured finding/minor renditions** from **{counts["scopeAndConcernPassages"]} scope/concern passages**, **{counts["explicitEmptyDeclarations"]} explicit empty declarations**, and **{counts["historicalRepairNarratives"]} historical repair passages.**','',
  'These are prospective source appearances, not a current outstanding-defect total. No canonical records were registered, repetitions were not consolidated, and no source claim of FIXED/resolution was accepted as proof. The original roast rejection texts retain their state and basis.','','## Finding and minor appearances','']
 for p in projected:
  if not p['newFindingAppearances'] and not p['structuredFindingAppearances']:continue
  md+=['### '+p['source'],'']
  for x in p['newFindingAppearances']:
   md += [f'- Original section `{x["section"]}`, lines {x["lineStart"]}–{x["lineEnd"]}; {x["sourceState"]}.', '', '> '+x['text'].replace('\n','\n> '),'']
  for x in p['structuredFindingAppearances']:
   md += [f'- Original JSON field `{x["jsonPointer"]}` in block lines {x["lineStart"]}–{x["lineEnd"]}; separate rendition, no automatic link.', '', '> '+x['text'].replace('\n','\n> '),'']
 md+=['## Remaining interpretation limits','','Narrative source classification is explicit in each source record. A missing standardized heading or parser failure never yields a None inference. Some source prose pairs an explicit no-task-local-finding assertion with pending parent obligations; the complete qualified text is retained in scope/concern passages. All exact original sections, units, byte offsets and line positions remain in the sidecars.','',
  'Task 19 handoff report/review copies have the same raw hashes and byte lengths as canonical intake copies. They remain separately retained in `variants/` with the original task/invocation name reference. There is no established byte mismatch and no automatic canonical registration or semantic disposition.','','See `coverage.json` for every source disposition and `occurrence-projection.json` for full machine-readable text and qualifiers.','']
 (OUT/'occurrence-projection.md').write_text('\n'.join(md))
 print(json.dumps(dict(counts)))
if __name__=='__main__':main()
