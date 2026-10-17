from pathlib import Path
import json,sys
p=Path('/tmp/ufz-pr1');r=json.loads((p/'results.json').read_text());m=json.loads((p/'dispatch-manifest.json').read_text())
for f in p.glob('result-judge_*.json'):
 seat,i=f.stem.removeprefix('result-judge_').rsplit('-',1);x=json.loads(f.read_text())
 assert x['verdict'] in ['CONFIRM','REJECT','UNVERIFIED'] and x['severity'] in ['Blocking','Should-fix','Nit','FYI'] and isinstance(x['evidence'],str) and x['evidence']
 r[f'judge:{seat}#{i}']=x
for i in range(int(sys.argv[1])+1):
 for s in ['reproduce','refute','ground']:
  task=f'/root/roast_code_ufz_r1_continuation/j{i}_{s}'
  if not any(x['task']==task for x in m):m.append({'task':task,'role':'judge','model':'gpt-6.1-sol','reasoningEffort':'medium','fresh':True,'mechanism':'native collaboration','promptPath':f'/tmp/ufz-pr1/static-dispatch-{s}-{i}.md','framing':'static analysis'})
(p/'results.json').write_text(json.dumps(r,indent=2));(p/'dispatch-manifest.json').write_text(json.dumps(m,indent=2)+'\n')
print(json.dumps({'votesRetained':len([k for k in r if k.startswith('judge:')]),'panelsDispatched':int(sys.argv[1])+1}))
