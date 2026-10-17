flags: skipPlanRoast=false skipCodeRoast=false
phase: report
codeBuckets:
  escalated: none
  pendingRetry: none
  parked: none
  stalled: false
  review: ready
  sweep: 1 — 1 passed, 0 failed, 0 errors; command: suite @ aaaaaaa
approvals:
- finding-source · {"version":1,"source":"clean","artifact":"source.md","kind":"final-review","verdict":"ready","occurrences":[]}
- root-acceptance · {"version":1,"owner":"super-auto","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","requirements":[{"id":"review","kind":"review","owner":"super-auto"},{"id":"sweep","kind":"measurement","owner":"super-auto","command":"suite","configuration":"quiet","requiredLive":true},{"id":"finish","kind":"human","owner":"human"}],"evidence":[{"sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","command":"suite","configuration":"quiet","kind":"live","outcome":"pass","location":"sweep.log"}],"reviews":[{"id":"review","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","outcome":"pass","location":"/tmp/ufz-pr2-controller/evidence-data-migrations/source.md"}],"decisions":[{"id":"finish","authority":"human","decision":"accept","evidence":["decision"]}],"recovery":{"obligations":[{"version":1,"id":"review-source:bd-100","kind":"deferred","operation":"record","reason":"immutable invocation review source","evidence":["/tmp/ufz-pr2-controller/evidence-data-migrations/work/.superpowers/sdd/bd-100-plan/progress.md"],"data":{"reviewSource":{"invocationId":"bd-100","base":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","head":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}}}],"gaps":[]},"checkEvidence":{"records":[],"gaps":[],"requiredLiveChecks":[]},"runFailures":[]}
