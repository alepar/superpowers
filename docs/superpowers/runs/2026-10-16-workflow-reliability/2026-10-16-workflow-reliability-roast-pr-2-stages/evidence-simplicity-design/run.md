flags: skipPlanRoast=false skipCodeRoast=false
phase: report
codeBuckets:
  escalated: none
  pendingRetry: none
  parked: none
  stalled: false
  review: ready
  sweep: 1 — 1 passed, 0 failed, 0 errors; command: suite @ ccccccc
approvals:
- finding-source · {"version":1,"source":"fixture/final","artifact":"review.md","kind":"final-review","verdict":"ready","occurrences":[]}
- root-acceptance · {"version":1,"owner":"super-auto","sourceTree":"cccccccccccccccccccccccccccccccccccccccc","requirements":[{"id":"review","kind":"review","owner":"caller"},{"id":"suite","kind":"measurement","owner":"caller","command":"suite","configuration":"fixture","requiredLive":true},{"id":"human","kind":"human","owner":"human"}],"evidence":[{"sourceTree":"cccccccccccccccccccccccccccccccccccccccc","command":"suite","configuration":"fixture","kind":"live","outcome":"pass","location":"fixture.log"}],"reviews":[{"id":"review","sourceTree":"cccccccccccccccccccccccccccccccccccccccc","outcome":"pass","location":"review.md"}],"decisions":[{"id":"human","authority":"human","decision":"accept","evidence":["synthetic fixture decision"]}],"recovery":{"obligations":[{"version":1,"id":"review-source:probe","kind":"deferred","operation":"record","reason":"immutable invocation review source","evidence":["/tmp/ufz-pr2-controller/evidence-simplicity-design/work/.superpowers/sdd/R-plan/progress.md"],"data":{"reviewSource":{"invocationId":"probe","base":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","head":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}}}],"gaps":[]},"checkEvidence":{"records":[],"requiredLiveChecks":[],"gaps":[]},"runFailures":[]}
