from pathlib import Path
import subprocess,json,os
root=Path('/tmp/ufz-pr2-controller/judge-0-ground/destination-fixture')
root.mkdir()
workspace=root/'workspace'; workspace.mkdir()
run=root/'run.md';run.write_text('flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n')
report=workspace/'final-review-probe.md';report.write_text('## Verdict\nready\n## Must-fix\nnone\n## Deferred OK\nnone\n## Untested scope\nnone\n')
(workspace/'payload').mkdir(); (workspace/'payload'/'new-file.txt').write_text('REVIEW INPUT SENTINEL\n')
outside=root/'outside';outside.mkdir()
(root/'reviews').mkdir(); (root/'reviews'/'probe').mkdir(); (root/'reviews'/'probe'/'payload').symlink_to(outside,target_is_directory=True)
script='/tmp/ufz-pr2-controller/source/skills/super-auto/scripts/report-status'
r=subprocess.run(['bash',script,'--collect',str(run),'--invocation','probe','--workspace',str(workspace),'--review',str(report),'--verdict','ready','--required','payload/new-file.txt'],capture_output=True,text=True)
latest=[json.loads(l.split(' · ',1)[1]) for l in run.read_text().splitlines() if l.startswith('- review-collection · ')][-1]
status=subprocess.run(['bash',script,str(run)],capture_output=True,text=True)
receipt={'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr,'record':latest,'outsideCreated':(outside/'new-file.txt').exists(),'outsideBytes':(outside/'new-file.txt').read_text() if (outside/'new-file.txt').exists() else None,'statusExit':status.returncode,'statusOutput':status.stdout}
(root.parent/'destination-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt,indent=2))
