import json,pathlib,subprocess
root=pathlib.Path('/tmp/ufz-pr2-controller/evidence-api-contract')
work=root/'workspace';work.mkdir(exist_ok=True)
rundir=root/'run';rundir.mkdir(exist_ok=True)
run=rundir/'run.md';report=work/'final-review-contract-probe.md'
script='/tmp/ufz-pr2-controller/source/skills/super-auto/scripts/report-status'
run.write_text('phase: code\nflags: skipPlanRoast=false skipCodeRoast=false\napprovals:\n')
def call(label,*opts):
 r=subprocess.run(['bash',script,'--collect',str(run),*opts],capture_output=True,text=True)
 return dict(label=label,args=list(opts),code=r.returncode,stdout=r.stdout,stderr=r.stderr)
base=['--invocation','contract-probe','--workspace',str(work)]
results=[call('settled unavailable result',*base,'--review','none','--verdict','UNAVAILABLE')]
report.write_text('## Verdict\nready\n## Must fix before landing\n- none\n## Untested scope\n- none\n## Deferred OK\n- none\n')
results.append(call('recover same invocation report',*base,'--review',str(report),'--verdict','ready'))
results.append(call('replay after recovered report',))
# Positive control: fresh settlement with the same valid report bytes and actual path.
positive=rundir/'positive.md';positive.write_text('phase: code\nflags: skipPlanRoast=false skipCodeRoast=false\napprovals:\n')
r=subprocess.run(['bash',script,'--collect',str(positive),*base,'--review',str(report),'--verdict','ready'],capture_output=True,text=True)
results.append(dict(label='positive direct report collection',code=r.returncode,stdout=r.stdout,stderr=r.stderr))
(root/'null-recovery-receipt.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps(results,indent=2))
