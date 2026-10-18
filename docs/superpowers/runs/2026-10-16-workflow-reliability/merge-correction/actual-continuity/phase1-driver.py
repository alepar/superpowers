from pathlib import Path
import json, hashlib, subprocess, shutil, datetime, time
R=Path(__file__).parent
M=json.loads((R/'fixture-manifest.json').read_text())
E=M['commandEnvironment']
D=R/'phase1-receipts'; D.mkdir(exist_ok=True)
def sha(b): return hashlib.sha256(b).hexdigest()
def files():
    paths=[Path(M['run'])]
    a=R/'reviews'
    if a.exists(): paths+=sorted(x for x in a.rglob('*') if x.is_file())
    return {str(p.relative_to(R)):sha(p.read_bytes()) for p in paths}
def command(name, argv, cwd=None):
    actual=[shutil.which(argv[0],path=E['PATH']) or argv[0],*argv[1:]]
    before=files(); start=datetime.datetime.now(datetime.timezone.utc).isoformat(); t=time.monotonic()
    q=subprocess.run(actual,cwd=cwd or R,env=E,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    out=D/(name+'.stdout'); err=D/(name+'.stderr'); out.write_bytes(q.stdout); err.write_bytes(q.stderr)
    rec={'argv':argv,'actualArgv':actual,'environment':E,'cwd':str(cwd or R),'startedUtc':start,'finishedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'durationSeconds':time.monotonic()-t,'exitCode':q.returncode,'stdout':str(out),'stdoutSha256':sha(q.stdout),'stderr':str(err),'stderrSha256':sha(q.stderr),'executableIdentity':{'path':actual[0],'realpath':str(Path(actual[0]).resolve()),'sha256':sha(Path(actual[0]).read_bytes())},'helperSourceHead':M['helperSourceHead'],'helperSourceTree':M['helperSourceTree'],'helperIdentities':[{**h,'actualSha256':sha((R/'frozen-helpers'/h['path']).read_bytes())} for h in M['helpers']],'stateBefore':before,'stateAfter':files()}
    (D/(name+'.json')).write_text(json.dumps(rec,indent=2)+'\n')
    print(name,q.returncode,q.stdout.decode(),q.stderr.decode())
    return rec
S=R/'frozen-helpers/skills/super-auto/scripts/report-status'
P=R/'frozen-helpers/skills/super-auto/scripts/scope-dispositions'

assert sha(Path('/private/tmp/ufz-correction-behavior-eval/after-context.md').read_bytes())=='cfb8f2b4ad710d6a2ef017ac20a0d89fd854aff90bbd7825de36cda292b51c36'
for h in M['helpers']: assert sha((R/'frozen-helpers'/h['path']).read_bytes())==h['sha256']
assert sha(Path(M['run']).read_bytes())==M['initialRunSha256']
originals={str(p.relative_to(R)):sha(p.read_bytes()) for d in ['retained-originals','preparation-receipts'] for p in sorted((R/d).rglob('*')) if p.is_file()}
originals['pre-resume-run.md']=sha((R/'pre-resume-run.md').read_bytes())
(D/'preserved-predecessors.json').write_text(json.dumps(originals,indent=2)+'\n')
ws=Path(M['workspace']); ws.mkdir(exist_ok=True)
required=ws/'inputs/counter.mjs'; required.parent.mkdir(exist_ok=True)
review=Path(M['expectedRecoveredReview'])
restores=[]
for src,dest in [(Path(M['requiredOriginalBytes']),required),(Path(M['initialReport']),review)]:
 assert not dest.exists()
 dest.write_bytes(src.read_bytes()); restores.append({'source':str(src),'destination':str(dest),'sha256':sha(dest.read_bytes()),'timeUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()})
(D/'restoration.json').write_text(json.dumps(restores,indent=2)+'\n')
cmd=['bash',str(S),'--collect',M['run'],'--invocation','continuity-i1','--workspace',str(ws),'--review',str(review),'--verdict','not ready','--required','inputs/counter.mjs','--recover-null']
r=command('recover-i1',cmd); assert r['exitCode']==0
for n in [1,2]:
 r=command('replay-i1-'+str(n),['bash',str(S),'--collect',M['run']]); assert r['exitCode']==0 and r['stateBefore']==r['stateAfter']
