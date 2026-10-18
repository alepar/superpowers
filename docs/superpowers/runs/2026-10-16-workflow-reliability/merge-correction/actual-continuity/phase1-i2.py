exec((__import__('pathlib').Path(__file__).parent/'phase1-driver.py').read_text().split("assert sha(Path('/private/tmp")[0])
ws=Path(M['workspace']); invocation='continuity-i2'
# The expected report basename is the explicit collection contract, with a fresh task-assigned token.
review=ws/('final-review-'+invocation+'.md')
intent={'invocationId':invocation,'workspace':str(ws),'reviewPath':str(review),'review':'pending','required':['inputs/counter.mjs'],'settled':False}
with Path(M['run']).open('a') as f: f.write('- review-collection · '+json.dumps(intent,separators=(',',':'))+'\n')
assert not review.exists(); review.write_bytes(Path(M['silentRetryReport']).read_bytes())
(D/'i2-report-copy.json').write_text(json.dumps({'source':M['silentRetryReport'],'destination':str(review),'sha256':sha(review.read_bytes()),'timeUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'identityBasis':'fresh task-assigned continuity-i2 token and operative final-review-ID.md collection contract'},indent=2)+'\n')
r=command('collect-i2',['bash',str(S),'--collect',M['run'],'--invocation',invocation,'--workspace',str(ws),'--review',str(review),'--verdict','ready','--required','inputs/counter.mjs']); assert r['exitCode']==0
for n in [1,2]:
 r=command('replay-i2-'+str(n),['bash',str(S),'--collect',M['run']]); assert r['exitCode']==0 and r['stateBefore']==r['stateAfter']
# Latest informational invocation verdict, without changing prior sources or acceptance.
with Path(M['run']).open('a') as f:f.write('codeBuckets:\n  completed:\n  escalated:\n  pendingRetry:\n  parked:\n  stalled: false\n  review: ready\n  sweep: SWEEP DEFERRED (caller-owned)\n  slowness:\n  worktreesKept:\n  processSweep: stopped 0 · survived 0 · unknown 0 · kept 0\n')
r=command('projection-phase1',['bash',str(P),'--project',M['run']]); assert r['exitCode']==0
r=command('keys-phase1',['bash',str(P),'--project',M['run'],'--keys']); assert r['exitCode']==0
r=command('acceptance-phase1',['bash',str(S),'--acceptance',M['run'],'--tree',M['productTree']]); assert r['exitCode']==3
r=command('status-phase1',['bash',str(S),M['run'],'--tip',M['productHead']]); assert r['exitCode']==0
