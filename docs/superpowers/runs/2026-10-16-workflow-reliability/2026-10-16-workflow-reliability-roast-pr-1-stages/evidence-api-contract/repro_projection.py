import json, pathlib, subprocess
r = pathlib.Path(__file__).resolve().parent
run = r / 'large-run.md'
artifact = r / 'large-review.md'
artifact.write_text('retained source')
occurrences = [{'section':'Must fix', 'position':i+1, 'key':'key-'+str(i), 'text':'finding '+str(i)+' '+('x'*950)} for i in range(128)]
source = {'version':1, 'source':'inv-a/final', 'artifact':str(artifact), 'kind':'final-review', 'verdict':'not ready', 'occurrences':occurrences}
run.write_text('flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\ncodeBuckets:\n  completed: leaf-A\n  stalled: false\n  parked: none\n  pendingRetry: none\n  escalated: none\n  review: ready\n  sweep: 1 passed, 0 failed, 0 errors @ '+'a'*40+'\napprovals:\n- finding-source · '+json.dumps(source)+'\n')
scope = r / 'head/skills/super-auto/scripts/scope-dispositions'
with (r/'projection-direct.json').open('w') as stream:
    direct = subprocess.run(['bash',str(scope),'--project',str(run)],stdout=stream,stderr=subprocess.PIPE,text=True)
piped = subprocess.run(['bash',str(scope),'--project',str(run)],capture_output=True,text=True)
(r/'projection-pipe.json').write_text(piped.stdout)
status = subprocess.run(['bash',str(r/'head/skills/super-auto/scripts/report-status'),str(run)],capture_output=True,text=True)
receipt = {'direct':{'status':direct.returncode,'bytes':(r/'projection-direct.json').stat().st_size,'findings':len(json.loads((r/'projection-direct.json').read_text())['findings'])},'pipe':{'status':piped.returncode,'bytes':len(piped.stdout.encode())},'report_status':{'status':status.returncode,'stdout':status.stdout,'stderr':status.stderr}}
try: receipt['pipe']['findings']=len(json.loads(piped.stdout)['findings'])
except Exception as error: receipt['pipe']['parse_error']=str(error)
(r/'projection-receipt.json').write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt,indent=2))
