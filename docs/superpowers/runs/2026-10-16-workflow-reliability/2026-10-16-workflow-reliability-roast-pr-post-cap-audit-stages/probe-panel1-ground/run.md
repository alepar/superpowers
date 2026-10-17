# super-auto run — 2026-10-16-disputed

flags: planOneShot=false skipPlanRoast=false skipCodeRoast=false autonomous=true
phase: report

roastCodeRound: 5
findingsLedger: disputed-uncapped-ledger.md

codeBuckets:
  completed: bd-1
  escalated:
  pendingRetry:
  parked:
  stalled: false
  review: CLEAN
  sweep: 9e8d7c6 — 120 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: npm test @ 9e8d7c6

approvals:
- root-acceptance · {"version":1,"owner":"super-auto","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","requirements":[{"id":"final-review","kind":"review","owner":"super-auto"},{"id":"sweep","kind":"measurement","owner":"super-auto","command":"suite","configuration":"quiet","requiredLive":true},{"id":"finish","kind":"human","owner":"human"}],"evidence":[{"sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","command":"suite","configuration":"quiet","kind":"live","outcome":"pass","location":"sweep.log"}],"reviews":[{"id":"final-review","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","outcome":"pass","location":"final.md"}],"decisions":[{"id":"finish","authority":"human","decision":"accept","evidence":["user-choice"]}],"recovery":{"obligations":[],"gaps":[]},"checkEvidence":{"records":[],"requiredLiveChecks":[],"gaps":[]},"runFailures":[]}
- finding-source · {"version":1,"source":"inv-final/final","artifact":"final.md","kind":"final-review","verdict":"ready","occurrences":[]}
