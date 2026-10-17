import json,pathlib,subprocess
root=pathlib.Path('/tmp/ufz-pr1/judge-4-reproduce');scripts=root/'skills/super-auto/scripts';s='a'*40
source=json.loads((root/'run.md').read_text().split('- finding-source · ')[1]);refs=[dict(source=source['source'],section=o['section'],position=o['position']) for o in source['occurrences']]
r=dict(version=1,owner='super-auto',sourceTree=s,requirements=[dict(id='review',kind='review',owner='super-auto'),dict(id='measurement',kind='measurement',owner='super-auto',command='suite',configuration='fixture',requiredLive=True),dict(id='finish',kind='human',owner='human')],evidence=[dict(sourceTree=s,command='suite',configuration='fixture',kind='live',outcome='pass',location='fixture.log')],reviews=[dict(id='review',sourceTree=s,outcome='pass',location='review.md')],decisions=[dict(id='finish',authority='human',decision='accept',evidence=['human-choice'])],recovery=dict(obligations=[],gaps=[]),checkEvidence=dict(records=[],gaps=[],requiredLiveChecks=[]),runFailures=[],findingAcceptance=[dict(ref=ref,judgment='supported',effect='nonblocking',basis='Outside required acceptance scope',evidence=['scope-review.md']) for ref in refs])
run=root/'acceptance-run.md';run.write_text((root/'run.md').read_text()+'- root-acceptance · '+json.dumps(r)+'\n')
fixed=root/'flush-scripts';fixed.mkdir(exist_ok=True);(fixed/'report-status').write_bytes((scripts/'report-status').read_bytes());(fixed/'scope-dispositions').write_bytes((scripts/'scope-dispositions-flush-probe').read_bytes())
results={}
for label,base in [('head',scripts),('flush',fixed)]:
 p=subprocess.run(['bash',str(base/'report-status'),'--acceptance',str(run)],capture_output=True,text=True)
 results[label]=dict(exit=p.returncode,result=json.loads(p.stdout),stderr=p.stderr)
(root/'acceptance-receipt.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps({k:dict(exit=v['exit'],eligible=v['result']['eligible'],gaps=v['result']['gaps'],pending=v['result']['pending'],nonblockingCount=len(v['result']['nonblockingFindings'])) for k,v in results.items()},indent=2))
