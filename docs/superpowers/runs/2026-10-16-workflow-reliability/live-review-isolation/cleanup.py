import pathlib,subprocess,json,hashlib,tarfile,time
R=pathlib.Path('/private/tmp/ufz-live-isolation');C=R/'caller';records=[]
for seat in ['seat-a','seat-b']:
 p=R/seat/'review-worktree'; assert p.parent==R/seat
 files={str(x.relative_to(p)):hashlib.sha256(x.read_bytes()).hexdigest() for x in p.rglob('*') if x.is_file()}
 (R/'evidence'/f'{seat}-worktree-files.json').write_text(json.dumps(files,indent=2)+'\n')
 with tarfile.open(R/'evidence'/f'{seat}-worktree-before-cleanup.tar.gz','w:gz') as tar:tar.add(p,arcname=seat+'-review-worktree')
 diff=subprocess.run(['git','diff','--binary'],cwd=p,text=True,capture_output=True);(R/'evidence'/f'{seat}-worktree.diff').write_text(diff.stdout)
 cmd=['python3',str(R/'record-command.py'),'verifier','--cwd',str(C),'--','git','worktree','remove','--force',str(p)]
 result=subprocess.run(cmd,text=True,capture_output=True);records.append({'path':str(p),'exit':result.returncode,'stdout':result.stdout,'stderr':result.stderr,'removed':not p.exists()});assert result.returncode==0
wt=subprocess.check_output(['git','worktree','list','--porcelain'],cwd=C,text=True);(R/'evidence/worktrees-after-cleanup.txt').write_text(wt)
result={'time':time.time(),'owned_worktrees':records,'remaining_worktrees':wt,'processes':'All recorder children synchronously communicate() reaped; controller unified session returned exit 0. No process kill performed. Global process enumeration unavailable (ps EPERM).'}
(R/'evidence/cleanup.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
