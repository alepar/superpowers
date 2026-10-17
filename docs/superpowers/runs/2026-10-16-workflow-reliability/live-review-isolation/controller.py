import os,sys,json,time,subprocess,pathlib,hashlib
R=pathlib.Path('/private/tmp/ufz-live-isolation');C=R/'caller'; ctl=R/'control';start=time.time();pid=os.getpid();(R/'evidence/controller-pid').write_text(str(pid))
def call(args):
 p=subprocess.run(['python3',str(R/'record-command.py'),'controller','--cwd',str(C),'--',*args],text=True,capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr)
 return p.stdout.strip()
def snapshot(label):
 files={}
 for q in [C/'caller-sentinel.txt',C/'build/caller-output.txt',C/'caller-session.txt',C/'lib/format.mjs',C/'lib/generated.mjs',R/'seat-b/existing-output.txt']:
  files[str(q)]=hashlib.sha256(q.read_bytes()).hexdigest() if q.exists() else None
 refs=subprocess.run(['git','show-ref','--head'],cwd=C,text=True,capture_output=True).stdout
 status=subprocess.run(['git','status','--porcelain','--untracked-files=all'],cwd=C,text=True,capture_output=True).stdout
 processes=['process enumeration unavailable: sandbox EPERM; own controller pid '+str(pid)]
 with (R/'evidence/observations.jsonl').open('a') as f:f.write(json.dumps({'time':time.time(),'label':label,'files':files,'refs':refs,'status':status,'processes':processes})+'\n')
def wait(names):
 while not all((ctl/n).exists() for n in names):
  snapshot('waiting:'+','.join(names))
  if time.time()-start>900:raise TimeoutError(names)
  time.sleep(.25)
 snapshot('checkpoint:'+','.join(names))
try:
 snapshot('initial');wait(['seat-a.ready','seat-b.ready'])
 (C/'integration.txt').write_text('integration 1: legitimate concurrent integration\n');call(['git','add','integration.txt']);call(['git','commit','-m','legitimate concurrent integration one'])
 (C/'caller-session.txt').write_text('caller pending local edit: must survive both reviews\n');snapshot('after-advance1');(ctl/'stage1').write_text(call(['git','rev-parse','HEAD'])+'\n')
 wait(['seat-a.phase1','seat-b.phase1'])
 (C/'integration.txt').write_text('integration 2: legitimate follow-up\n');(C/'lib/format.mjs').write_text("export function formatAmount(cents) { return '$' + (cents < 0 ? '-' : '') + Math.trunc(Math.abs(cents) / 100) + '.' + String(Math.abs(cents % 100)).padStart(2, '0'); }\n")
 call(['git','add','integration.txt','lib/format.mjs']);call(['git','commit','-m','legitimate concurrent integration two fixes signed sub-dollar amount'])
 snapshot('after-advance2');(ctl/'stage2').write_text(call(['git','rev-parse','HEAD'])+'\n')
 while not (ctl/'finished').exists():
  snapshot('reviews-finishing')
  if time.time()-start>900:raise TimeoutError('finished')
  time.sleep(.25)
 snapshot('final');call(['git','log','--all','--oneline','--decorate']);call(['git','reflog','--all','--date=iso']);call(['git','worktree','list','--porcelain'])
 (R/'evidence/controller-result.json').write_text(json.dumps({'status':'done','started':start,'finished':time.time(),'pid':pid})+'\n')
except Exception as e:
 (R/'evidence/controller-result.json').write_text(json.dumps({'status':'error','error':str(e),'time':time.time(),'pid':pid})+'\n');raise
