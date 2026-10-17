import pathlib,subprocess,json
root=pathlib.Path('/tmp/ufz-pr2-controller/judge-5-refute')
script='/tmp/ufz-pr2-controller/source/skills/super-auto/scripts/report-status'
w=root/'workspace';w.mkdir(exist_ok=True)
run=root/'run.md';run.write_text('flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n')
review=w/'final-review-test.md'
rows=[]
def invoke(label,*args):
 p=subprocess.run(['bash',script,*map(str,args)],capture_output=True,text=True)
 rows.append(dict(label=label,args=list(map(str,args)),exit=p.returncode,stdout=p.stdout,stderr=p.stderr))
invoke('settle unavailable','--collect',run,'--invocation','test','--workspace',w,'--review','none','--verdict','UNAVAILABLE')
review.write_text('## Verdict\nready\n## Must-fix\nnone\n## Deferred OK\nnone\n## Untested scope\nnone\n')
invoke('reconcile recovered report','--collect',run,'--invocation','test','--workspace',w,'--review',review,'--verdict','ready')
invoke('replay recovered artifacts','--collect',run)
invoke('status',run)
control=root/'control.md';control.write_text('flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n')
invoke('positive control','--collect',control,'--invocation','test','--workspace',w,'--review',review,'--verdict','ready')
(root/'receipts.json').write_text(json.dumps(rows,indent=2))
print(json.dumps(rows,indent=2))
