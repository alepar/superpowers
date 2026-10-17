import subprocess,json
from pathlib import Path
root=Path('/tmp/ufz-pr2-controller/judge-5-reproduce')
script='/tmp/ufz-pr2-controller/source/skills/super-auto/scripts/report-status'
work=root/'work'; work.mkdir(exist_ok=True)
run=root/'run.md'; run.write_text('flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n'+ '- review-collection · '+json.dumps(dict(invocationId='probe',workspace=str(work),reviewPath=str(work/'final-review-probe.md'),review='pending',required=[],settled=False))+'\n')
receipts=[]
def cli(label,*args):
 p=subprocess.run(['bash',script,*map(str,args)],capture_output=True,text=True)
 receipts.append(dict(label=label,args=list(map(str,args)),exit=p.returncode,stdout=p.stdout,stderr=p.stderr))
 return p.returncode
def settle(file,review,verdict='ready',id='probe'):
 return ['--collect',file,'--invocation',id,'--workspace',work,'--review',review,'--verdict',verdict]
assert cli('settled null',*settle(run,'none','UNAVAILABLE'))==3
review=work/'final-review-probe.md'; review.write_text('## Verdict\nready\n## Must-fix\nnone\n## Deferred OK\nnone\n## Untested scope\nnone\n')
assert cli('reconcile valid recovered review',*settle(run,review))==3
assert cli('replay recovery', '--collect',run)==3
assert (root/'reviews/probe/final-review-probe.md').read_bytes()==review.read_bytes()
cli('status after preserved recovery',run)
control=root/'control.md';control.write_text('flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n')
assert cli('same report positive control',*settle(control,review))==0
later=work/'final-review-later.md'; later.write_bytes(review.read_bytes())
assert cli('fresh invocation cannot clear original pending',*settle(run,later,id='later'))==3
(root/'receipt.json').write_text(json.dumps(receipts,indent=2))
print(json.dumps(receipts,indent=2))
