"""Two declared targeted measurements; execute after the serial suite ends."""
from pathlib import Path
import datetime, hashlib, json, os, subprocess, time

root=Path('/private/tmp/ufz-correction-final-source-fd52ffc7')
out=Path('/private/tmp/ufz-correction-final-tmpdir-variants-fd52ffc7')
head='fd52ffc7a8de0c4412c517adec2d4979d06906ff'
tree='e9fb5e1b76697264ef7ade29dc5fc79ea57898c2'
suite=json.loads(Path('/private/tmp/ufz-correction-final-suite-fd52ffc7/result.json').read_text())
assert suite['completed'] and suite['measurementValid'] and suite['status']=='passed'
assert not out.exists();out.mkdir()
sha=lambda b:hashlib.sha256(b).hexdigest()
utc=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def source():
 result={}
 for key,args in [('head',['rev-parse','HEAD']),('tree',['rev-parse','HEAD^{tree}']),('status',['status','--porcelain'])]:
  p=subprocess.run(['git','-C',str(root),*args],capture_output=True)
  result[key]={'exitCode':p.returncode,'stdout':p.stdout.decode(),'stderr':p.stderr.decode()}
 assert result['head']['stdout'].strip()==head and result['tree']['stdout'].strip()==tree
 assert result['status']['stdout']=='' and all(r['exitCode']==0 for r in result.values())
 return result
inherited=os.environ.get('TMPDIR')
assert inherited and Path(inherited).is_dir() and Path(inherited).stat().st_uid==os.getuid()
cases=[]
for variant in ('inherited','trailing'):
 case=out/variant;case.mkdir()
 for name in ['home','tmp','xdg-config','xdg-cache','xdg-data','xdg-state','codex-home']:(case/name).mkdir()
 tmp=inherited if variant=='inherited' else str(case/'tmp')+'/'
 env={'PATH':'/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin','CI':'1','LANG':'C','LC_ALL':'C','TZ':'UTC','GIT_CONFIG_NOSYSTEM':'1','GIT_CONFIG_GLOBAL':'/dev/null','GIT_CONFIG_SYSTEM':'/dev/null','GIT_OPTIONAL_LOCKS':'0','HOME':str(case/'home'),'TMPDIR':tmp,'CODEX_HOME':str(case/'codex-home')}
 for suffix in ['CONFIG','CACHE','DATA','STATE']:env['XDG_'+suffix+'_HOME']=str(case/('xdg-'+suffix.lower()))
 argv=['/bin/bash','tests/super-code/test-dispatch-text.sh']
 r={'requirementId':'current-live-tmpdir-'+variant,'variant':variant,'argv':argv,'cwd':str(root),'environment':env,'sourceHead':head,'sourceTree':tree,'beforeSource':source(),'executableSha256':sha(Path('/bin/bash').read_bytes()),'entrypointSha256':sha((root/argv[1]).read_bytes()),'inheritedTMPDIRObservation':inherited,'startUtc':utc(),'limits':'Two actual targeted commands with distinct declared TMPDIR configurations; no historical same-config or causal speedup/global absence claim.'}
 start=time.monotonic()
 with (case/'stdout.log').open('wb') as stdout,(case/'stderr.log').open('wb') as stderr:
  p=subprocess.run(argv,cwd=root,env=env,stdout=stdout,stderr=stderr,timeout=600)
 r.update(exitCode=p.returncode,durationSeconds=round(time.monotonic()-start,3),endUtc=utc(),afterSource=source())
 for stream in ('stdout','stderr'):
  path=case/(stream+'.log');data=path.read_bytes();r[stream]={'path':str(path),'bytes':len(data),'sha256':sha(data)}
 (case/'receipt.json').write_text(json.dumps(r,indent=2)+'\n');cases.append(r)
 print(variant,p.returncode,flush=True)
 assert p.returncode==0
(out/'result.json').write_text(json.dumps({'completed':True,'allPassed':True,'cases':cases},indent=2)+'\n')
