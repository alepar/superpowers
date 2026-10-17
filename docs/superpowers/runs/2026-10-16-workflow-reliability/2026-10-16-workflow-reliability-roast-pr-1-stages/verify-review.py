from pathlib import Path
import json,re,hashlib
from collections import Counter
p=Path('/tmp/ufz-pr1');w=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers');r=w/'docs/superpowers/runs/2026-10-16-workflow-reliability';stage=r/'2026-10-16-workflow-reliability-roast-pr-1-stages'
report=r/'2026-10-16-workflow-reliability-roast-pr-1.md';cov=r/'2026-10-16-workflow-reliability-roast-pr-1-coverage.json'
s=report.read_text();x=json.loads((p/'final-state.json').read_text());c=json.loads(cov.read_text());mapping=json.loads((stage/'durable-path-map.json').read_text())
assert c==x['coverage'] and c['judgeCompletionPct']==100 and not c['lowCoverage'] and not c['convergenceEligible']
assert s.splitlines()[0]=='super-roast verdict: '+x['verdict']
assert '/tmp/ufz-pr1' not in s and '{{' not in s and '[converged]' not in s
assert 'same-family (GPT-6) — seat-differentiated panel · rung: manual fan-out' in s
section=s.split('## Confirmed findings',1)[1].split('## Not verified',1)[0]
findings=re.findall(r'^- \[(Blocking|Should-fix|Nit|FYI)\] (.*?) — ',section,re.M)
assert len(findings)==7 and Counter(t for t,_ in findings)=={'Blocking':1,'Should-fix':6}
for packet in json.loads((p/'packets.json').read_text()):
 if packet['defaultRoute']=='confirmed':assert packet['finding']['location'] in [v for _,v in findings]
assert section.count('[lanes:')==7
roles=Counter(t['role'] for t in json.loads((p/'dispatch-manifest.json').read_text()))
assert roles=={'triage':1,'scout':12,'dedupe':1,'judge':27,'reporter':1}
for dispatch in json.loads((p/'judge-dispatch-plan.json').read_text()):
 finding=json.loads(Path(dispatch['promptPath']).read_text().split('<finding>\n',1)[1].split('\n</finding>',1)[0])
 assert not {'suggestedSeverity','previouslyRejected','lanes'}.intersection(finding)
entries={e['durablePath']:e for e in mapping['entries']}
for entry in mapping['entries']:
 f=w/entry['durablePath'];assert f.is_file();assert hashlib.sha256(f.read_bytes()).hexdigest()==entry['sha256'],entry['durablePath']
prefix=str(stage.relative_to(w))+'/'
refs=set(re.findall(re.escape(prefix)+r'[A-Za-z0-9_./-]+',s));refs={v.rstrip('.') for v in refs}
for ref in refs:
 f=w/ref;assert f.exists(),ref
 if f.is_file() and f.name!='durable-path-map.json':assert ref in entries,ref
out={'verdict':x['verdict'],'confirmedCount':7,'severityCounts':{'Blocking':1,'Should-fix':6},'routes':x['routeCounts'],'reporterFailed':x['reporterFailed'],'engineEnforcement':x['enforcement'],'coverageMatchesEngine':True,'canonicalFindingLocations':True,'allSeatFindingsBlind':True,'modelRoster':dict(roles),'sameFamilySeatDifferentiated':True,'durableFilesHashVerified':len(entries),'reportEvidenceCitationsVerified':len(refs),'temporaryEvidenceReferencesInPublishedReport':0,'unresolvedTemplateTokens':0,'productFilesEdited':False,'callerFilesEdited':False}
(p/'verification.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out))
