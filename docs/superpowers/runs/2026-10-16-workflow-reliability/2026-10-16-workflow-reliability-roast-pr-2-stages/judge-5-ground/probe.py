from pathlib import Path
import subprocess,json
root=Path('/tmp/ufz-pr2-controller/judge-5-ground')
script=Path('/tmp/ufz-pr2-controller/source/skills/super-auto/scripts/report-status')
work=root/'workspace';work.mkdir(exist_ok=True)
run=root/'run.md';run.write_text('flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\napprovals:\n')
review='## Verdict\nready\n## Must-fix\nnone\n## Deferred OK\nnone\n## Untested scope\nnone\n'
steps=[]
def call(label,run,args):
 p=subprocess.run(['bash',str(script),'--collect',str(run)]+args,text=True,capture_output=True)
 steps.append(dict(label=label,exit=p.returncode,stdout=p.stdout,stderr=p.stderr))
def args(id,file,verdict):return ['--invocation',id,'--workspace',str(work),'--review',str(file),'--verdict',verdict]
id='ground5';file=work/('final-review-'+id+'.md')
call('settle-null',run,args(id,'none','UNAVAILABLE'))
file.write_text(review)
call('recover-path',run,args(id,file,'ready'))
call('replay-recovered',run,[])
fresh=work/'final-review-ground5fresh.md';fresh.write_text(review)
call('subsequent-invocation',run,args('ground5fresh',fresh,'ready'))
control=root/'control.md';control.write_text('approvals:\n')
call('control',control,args(id,file,'ready'))
records=[json.loads(l.split(' · ',1)[1]) for l in run.read_text().splitlines() if l.startswith('- review-collection · ')]
assert [s['exit'] for s in steps]==[3,3,3,3,0],steps
assert records[-1]['complete'] is True
assert (root/'reviews'/id/file.name).read_text()==review
(root/'receipt.json').write_text(json.dumps(dict(steps=steps,collections=records),indent=2))
print(json.dumps(steps,indent=2))
