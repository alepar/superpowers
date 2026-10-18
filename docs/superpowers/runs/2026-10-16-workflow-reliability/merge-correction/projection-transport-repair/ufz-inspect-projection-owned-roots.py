"""Read-only owned-root observation after both declared final measurements."""
from pathlib import Path
import subprocess,json,hashlib,datetime
tmp=Path('/private/tmp');tag='fd52ffc7'
suite=json.loads((tmp/f'ufz-correction-final-suite-{tag}/result.json').read_bytes())
variants=json.loads((tmp/f'ufz-correction-final-tmpdir-variants-{tag}/result.json').read_bytes())
assert suite['status']=='passed' and suite['completed'] and suite['measurementValid'] and variants['completed'] and variants['allPassed']
old=json.loads((tmp/'ufz-correction-final-owned-inspection-c2168120/receipt.json').read_bytes())
roots=old['ownedRoots']+[str(tmp/p) for p in [f'ufz-correction-final-suite-{tag}',f'ufz-correction-final-suite-outer-{tag}',f'ufz-correction-final-tmpdir-variants-{tag}',f'ufz-correction-final-source-{tag}','ufz-correction-projection-repair-source','ufz-correction-projection-repair','ufz-correction-repaired-root-transport']]
assert len(roots)==13 and len(set(roots))==13 and all(Path(p).is_dir() for p in roots)
out=tmp/f'ufz-correction-final-owned-inspection-{tag}';assert not out.exists();out.mkdir()
helper=tmp/f'ufz-correction-final-source-{tag}/skills/super-code/scripts/stop-run-processes'
argv=['/bin/bash',str(helper),'--check',*roots]
env=old['environment'];utc=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat();sha=lambda b:hashlib.sha256(b).hexdigest()
r={'argv':argv,'cwd':'/Users/alepar/AleCode/superpowers','environment':env,'helperSourceHead':suite['sourceHead'],'helperSha256':sha(helper.read_bytes()),'mode':'read-only --check; no signals or deletion','startUtc':utc(),'ownedRoots':roots,'callerRetention':'Main pane and external correction worktree remain active/retained and are not cleanup targets.','limits':'Listed owned test/fixture roots only; unrelated/global host state unknown; unknown/matches retain all roots.'}
p=subprocess.run(argv,cwd=r['cwd'],env=env,capture_output=True);r.update(exitCode=p.returncode,endUtc=utc())
for name,data in [('stdout',p.stdout),('stderr',p.stderr)]:
 path=out/(name+'.log');path.write_bytes(data);r[name]={'path':str(path),'bytes':len(data),'sha256':sha(data)}
r['interpretation']='Verified discovery found no matching owned processes for listed roots at observation' if p.returncode==0 else 'Owned process observation matched or unavailable; retain all roots'
(out/'receipt.json').write_text(json.dumps(r,indent=2)+'\n')
print('Owned roots',len(roots),'inspection exit',p.returncode)
raise SystemExit(p.returncode)
