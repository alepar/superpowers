from pathlib import Path
import subprocess,json
out=Path(__file__).parent
W=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
H='ff2f79f62cc34084c8df20edc5c2e4f201a5d630'
def cmd(args,cwd):
 return subprocess.run(args,cwd=cwd,capture_output=True,text=True)
for f in ['skills/super-auto/scripts/report-status','skills/super-code/scripts/report-verdict']:
 p=out/'frozen'/f;p.parent.mkdir(parents=True,exist_ok=True)
 r=cmd(['git','show',H+':'+f],W);assert r.returncode==0;p.write_text(r.stdout)
repo=out/'fixture';repo.mkdir()
def git(*args):
 r=cmd(['git',*args],repo);assert r.returncode==0,r.stderr;return r.stdout.strip()
git('init','-q');git('config','user.name','Review Fixture');git('config','user.email','fixture@example.invalid')
(repo/'product.txt').write_text('old\n');git('add','.');git('commit','-qm','base');base=git('rev-parse','HEAD')
(repo/'product.txt').write_text('UNIQUE_PRODUCT_DELTA\n')
run=repo/'docs/superpowers/runs/probe/run.md';run.parent.mkdir(parents=True);run.write_text('phase: code\nflags: skipPlanRoast=false skipCodeRoast=false\napprovals:\n')
git('add','.');git('commit','-qm','one product change')
rows=[]
for n in range(1,7):
 ident='i'+str(n);ws=out/('ws'+str(n));assembled=ws/'assembled'/('final-review-'+ident+'-final');slices=assembled/'slices';slices.mkdir(parents=True)
 head=git('rev-parse','HEAD');names=git('diff','--name-only',base+'..'+head).splitlines()
 row={'invocation':n,'changedFiles':len(names),'sliceBytes':0,'productCopies':0};rows.append(row)
 for name in names:
  data=cmd(['git','diff',base+'..'+head,'--',name],repo).stdout
  dest=slices/(name.replace('/','__')+'.diff')
  try:dest.write_text(data)
  except OSError as e:
   row.update(errno=e.errno,error=str(e),basenameBytes=len(dest.name.encode()),source=name);break
  row['sliceBytes']+=len(data.encode());row['productCopies']+=data.count('UNIQUE_PRODUCT_DELTA')
 if 'errno' in row:break
 (assembled/'digest.md').write_text('## diffstat\n'+git('diff','--stat',base+'..'+head)+'\n')
 (assembled/'diffstat.txt').write_text(git('diff','--stat',base+'..'+head)+'\n')
 (assembled/'clusters.json').write_text(json.dumps({'changed':names,'clusters':[{'name':'all','files':names,'slices':['slices/'+f.replace('/','__')+'.diff' for f in names]}]}))
 review=ws/('final-review-'+ident+'.md');review.write_text('## Verdict\nready\n## Must fix before landing\n- none\n## Untested scope\n- none\n## Deferred OK\n- none\n')
 r=cmd(['bash',str(out/'frozen/skills/super-auto/scripts/report-status'),'--collect',str(run),'--invocation',ident,'--workspace',str(ws),'--review',str(review),'--verdict','ready'],repo)
 row.update(collectExit=r.returncode,stdout=r.stdout,stderr=r.stderr)
 if r.returncode:break
 git('add','.');git('commit','-qm','retain bundle '+ident)
(out/'receipt.json').write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps(rows,indent=2))
