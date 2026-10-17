import json,pathlib,subprocess
root=pathlib.Path('/tmp/ufz-pr2-controller/evidence-api-contract');work=root/'workspace';run=root/'run'/'run.md'
report=work/'final-review-contract-probe-fresh.md';report.write_text((work/'final-review-contract-probe.md').read_text())
p=subprocess.run(['bash','/tmp/ufz-pr2-controller/source/skills/super-auto/scripts/report-status','--collect',str(run),'--invocation','contract-probe-fresh','--workspace',str(work),'--review',str(report),'--verdict','ready'],capture_output=True,text=True)
r={'code':p.returncode,'stdout':p.stdout,'stderr':p.stderr}
(root/'fresh-recovery-receipt.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r,indent=2))
