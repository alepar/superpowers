from pathlib import Path
import subprocess,json,shutil
root=Path('/tmp/ufz-pr2-controller/judge-0-reproduce')
src=Path('/tmp/ufz-pr2-controller/source')
work=root/'work'; run=root/'run'; outside=root/'outside'
for d in [work/'payload',run/'reviews'/'probe',outside]:d.mkdir(parents=True,exist_ok=True)
shutil.copyfile(src/'tests/super-auto/fixtures/report-status/clean.md',run/'run.md')
review=work/'final-review-probe.md'
review.write_text('## Verdict\nready\n## Must-fix\nnone\n## Deferred OK\nnone\n## Untested scope\nnone\n')
(work/'payload'/'new-file.txt').write_text('archive-destination-escape-sentinel\n')
(run/'reviews'/'probe'/'payload').symlink_to(outside,target_is_directory=True)
script=src/'skills/super-auto/scripts/report-status'
def cli(args):
 p=subprocess.run(['bash',str(script),*map(str,args)],capture_output=True,text=True)
 return {'exit':p.returncode,'stdout':p.stdout,'stderr':p.stderr}
result={'collect':cli(['--collect',run/'run.md','--invocation','probe','--workspace',work,'--review',review,'--verdict','ready','--required','payload/new-file.txt'])}
result['outsideCreated']=(outside/'new-file.txt').exists()
result['outsideContent']=(outside/'new-file.txt').read_text()
result['realDestination']=str((run/'reviews'/'probe'/'payload'/'new-file.txt').resolve())
result['collection']=json.loads([l.split(' · ',1)[1] for l in (run/'run.md').read_text().splitlines() if l.startswith('- review-collection · ')][-1])
result['status']=cli([run/'run.md'])
# Simulate external temp-directory removal after preservation claims success.
shutil.rmtree(outside)
result['statusAfterExternalRemoval']=cli([run/'run.md'])
(root/'receipt.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
