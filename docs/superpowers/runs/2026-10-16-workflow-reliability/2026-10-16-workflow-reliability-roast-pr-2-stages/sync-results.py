from pathlib import Path
import json
s=Path('/tmp/ufz-pr2-controller')
r={}
for p in s.glob('result-*.json'):
 key=p.stem[len('result-'):]
 key=key.replace('scout_', 'scout:',1) if key.startswith('scout_') else key
 if key.startswith('judge_'):
  seat,idx=key[len('judge_'):].rsplit('-',1);key='judge:'+seat+'#'+idx
 r[key]=json.loads(p.read_text())
(s/'results.json').write_text(json.dumps(r,indent=2))
print('results',len(r))
