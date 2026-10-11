import sys,json
args=sys.argv[1:]
if args[:2] == ['bd','comments']:
 print('[]')
elif args[:2] == ['bd','show']:
 id=args[2]
 data={
 'ret-epic': {'id':'ret-epic','description':'Implement retention expiry. Use UTC elapsed milliseconds and preserve the public API. Task-scoped acceptance criteria are tracked on child tasks.'},
 'ret-3': {'id':'ret-3','title':'Retention cutoff','description':'Retention cutoff: expire records strictly older than 7 days; retain exactly-7-day records. AMENDMENT approved after planning: replace the former 30-day cutoff with 7 days. No public API changes. Files src/retention.js and tests/retention.test.js. Use UTC elapsed milliseconds.'},
 'ret-block': {'id':'ret-block','description':'Task ret-3 blocked: plan prescribes 30 days but existing RETENTION_DAYS constant is 7. Neither plan nor empty comments explain why. Tried reading brief and existing source; did not edit code. Need settled retention cutoff before implementing.'}
 }
 print(json.dumps(data.get(id,{'error':'not found'})))
else:
 print('Unsupported fixture read; available syntax: bd comments ID, bd show ID --json')
