flags: skipPlanRoast=false skipCodeRoast=false
phase: report
codeBuckets:
  completed: ep.1
  escalated: none
  pendingRetry: none
  parked: none
  stalled: false
  review: ready
  sweep: 1 — 1 passed, 0 failed, 0 errors; command: suite @ aaaaaaa
approvals:
- root-acceptance · {"version":1,"owner":"super-auto","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","requirements":[{"id":"review","kind":"review","owner":"super-auto"},{"id":"sweep","kind":"measurement","owner":"super-auto","command":"suite","configuration":"quiet","requiredLive":true},{"id":"finish","kind":"human","owner":"human"}],"evidence":[],"reviews":[{"id":"review","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","outcome":"pass","location":"final.md"}],"decisions":[{"id":"finish","authority":"human","decision":"accept","evidence":["user-choice"]}],"recovery":{"obligations":[],"gaps":[]},"checkEvidence":{"records":[{"id":"ep.1","dispatch":"impl:ep.1","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","command":"suite","configuration":"quiet","outcome":"fail","location":"fail.log","kind":"live"},{"id":"ep.1","dispatch":"impl:ep.1","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","command":"suite","configuration":"quiet","outcome":"pass","location":"pass.log","kind":"live"}],"gaps":[],"requiredLiveChecks":[{"id":"ep.1","dispatch":"impl:ep.1","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","command":"suite","configuration":"quiet","outcome":"pass","matches":[0,1]}]},"runFailures":[]}
- finding-source · {"version":1,"source":"inv-test/final","artifact":"final.md","kind":"final-review","verdict":"ready","occurrences":[]}
