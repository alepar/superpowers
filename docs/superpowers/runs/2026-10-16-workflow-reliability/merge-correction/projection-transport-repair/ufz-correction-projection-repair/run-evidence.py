from pathlib import Path
import hashlib, json, subprocess, sys, time
root=Path('/private/tmp/ufz-correction-projection-repair-source')
evidence=Path('/private/tmp/ufz-correction-projection-repair')
label=sys.argv[1]
command=sys.argv[2:]
identity={}
for name,args in [('head',['git','rev-parse','HEAD']),('tree',['git','rev-parse','HEAD^{tree}']),('status',['git','status','--short'])]:
    identity[name]=subprocess.check_output(args,cwd=root,text=True).strip()
identity['ownedSha256']={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in ['skills/super-auto/scripts/report-status','tests/super-auto/projection-output-r1.sh']}
(evidence/f'{label}.command.json').write_text(json.dumps({'argv':command,'cwd':str(root),'source':identity},indent=2)+'\n')
start=time.monotonic()
r=subprocess.run(command,cwd=root,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
(evidence/f'{label}.stdout').write_bytes(r.stdout)
(evidence/f'{label}.stderr').write_bytes(r.stderr)
(evidence/f'{label}.status.json').write_text(json.dumps({'returncode':r.returncode,'elapsedSeconds':time.monotonic()-start},indent=2)+'\n')
print(r.stdout.decode())
print(r.stderr.decode())
print('status:',r.returncode)
