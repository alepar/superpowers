flags: skipPlanRoast=false skipCodeRoast=false
phase: report
codeBuckets:
  escalated: none
  pendingRetry: none
  parked: none
  stalled: false
  review: ready
  sweep: 1 passed, 0 failed, 0 errors @ fffffff
approvals:
- root-acceptance · {"version":1,"owner":"super-auto","sourceTree":"ffffffffffffffffffffffffffffffffffffffff","requirements":[{"id":"review","kind":"review","owner":"caller"},{"id":"suite","kind":"measurement","owner":"caller","command":"suite","configuration":"quiet","requiredLive":true},{"id":"finish","kind":"human","owner":"human"}],"evidence":[{"sourceTree":"ffffffffffffffffffffffffffffffffffffffff","command":"suite","configuration":"quiet","location":"history/f-pass.log","kind":"live","outcome":"pass"}],"reviews":[{"id":"review","sourceTree":"ffffffffffffffffffffffffffffffffffffffff","outcome":"pass","location":"final.md"}],"decisions":[{"id":"finish","authority":"human","decision":"accept","evidence":["human-decision"]}],"recovery":{"obligations":[],"gaps":[]},"checkEvidence":{"records":[],"requiredLiveChecks":[],"gaps":[]},"runFailures":[]}
- finding-source · {"version":1,"source":"clean-review","kind":"final-review","artifact":"final.md","verdict":"ready","occurrences":[]}
