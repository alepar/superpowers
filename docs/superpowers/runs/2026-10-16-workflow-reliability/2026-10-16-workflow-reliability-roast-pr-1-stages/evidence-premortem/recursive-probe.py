import pathlib, subprocess, json
out=pathlib.Path(__file__).parent
repo=out/'recursive-fixture'; repo.mkdir(exist_ok=True)
helper=out/'head/skills/super-auto/scripts/report-status'
def call(*cmd, cwd=repo):
 return subprocess.run(cmd,cwd=cwd,capture_output=True,text=True)
def git(*args):
 r=call('git',*args)
 if r.returncode: raise Exception(r.stderr)
 return r.stdout.strip()
git('init','-q');git('config','user.email','probe@example.invalid');git('config','user.name','Local review probe')
(repo/'product.txt').write_text('before\n');git('add','.');git('commit','-qm','baseline');base=git('rev-parse','HEAD')
(repo/'product.txt').write_text('SEED-PRODUCT-CHANGE\n')
run=repo/'docs/superpowers/runs/probe/run.md';run.parent.mkdir(parents=True,exist_ok=True);run.write_text('phase: code\nflags: skipPlanRoast false, skipCodeRoast false\napprovals:\n')
git('add','.');git('commit','-qm','product change')
rows=[]
for i in range(1,9):
 inv='inv'+str(i); workspace=out/('workspace'+str(i)); asm=workspace/'assembled'/('final-review-'+inv+'-final');slices=asm/'slices';slices.mkdir(parents=True,exist_ok=True)
 head=git('rev-parse','HEAD'); files=git('diff','--name-only',base,head).splitlines();row={'invocation':i,'changedFiles':len(files),'sliceBytes':0,'archiveBytes':0,'seedCopies':0};rows.append(row)
 for src in files:
  dest=slices/(src.replace('/','__')+'.diff')
  content=call('git','diff',base,head,'--',src).stdout
  try:dest.write_text(content)
  except OSError as e:
   row.update(error=str(e),filenameBytes=len(dest.name.encode()),source=src);break
  row['sliceBytes']+=len(content.encode());row['seedCopies']+=content.count('SEED-PRODUCT-CHANGE')
  if '/reviews/' in src:row['archiveBytes']+=len(content.encode())
 if 'error' in row:break
 (asm/'digest.md').write_text('## Source\n'+head+'\n');(asm/'diffstat.txt').write_text(git('diff','--stat',base,head)+'\n')
 review=workspace/('final-review-'+inv+'.md');review.write_text('## Verdict\nready\n## Must fix before landing\n- none\n## Untested scope\n- none\n## Deferred OK\n- none\n')
 r=call('bash',str(helper),'--collect',str(run),'--invocation',inv,'--workspace',str(workspace),'--review',str(review),'--verdict','ready')
 row.update(collectExit=r.returncode,collectOutput=r.stdout,collectError=r.stderr)
 if r.returncode:break
 git('add','.');git('commit','-qm','collect '+inv)
(out/'recursive-result.json').write_text(json.dumps({'base':base,'rows':rows},indent=2)+'\n');print(json.dumps(rows,indent=2))
