findingsLedger: ledger.md
flags: skipPlanRoast=false skipCodeRoast=false
phase: report
codeBuckets:
  completed: leaf-A
  escalated: none
  pendingRetry: none
  parked: none
  stalled: false
  review: ready
  sweep: 1 passed, 0 failed, 0 errors @ aaaaaaa
approvals:
- root-acceptance · {"version":1,"owner":"super-auto","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","requirements":[{"id":"final-review","kind":"review","owner":"super-auto"},{"id":"sweep","kind":"measurement","owner":"super-auto","command":"suite","configuration":"quiet","requiredLive":true},{"id":"finish","kind":"human","owner":"human"}],"evidence":[{"sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","command":"suite","configuration":"quiet","kind":"live","outcome":"pass","location":"sweep.log"}],"reviews":[{"id":"final-review","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","outcome":"pass","location":"final.md"}],"decisions":[{"id":"finish","authority":"human","decision":"accept","evidence":["user-choice"]}],"recovery":{"obligations":[],"gaps":[]},"checkEvidence":{"records":[],"requiredLiveChecks":[],"gaps":[]},"runFailures":[]}
- finding-source · {"version":1,"source":"inv-a/final","artifact":"final.md","kind":"final-review","verdict":"ready","occurrences":[]}
- finding-source · {"version":1,"source":"roast-code/round-1","artifact":"r1.md","kind":"roast","verdict":"Blocking (2 confirmed)","occurrences":[{"section":"Confirmed findings","position":1,"key":"[Blocking] src/a.sh:10","text":"[Blocking] src/a.sh:10 — finding text for this entry\n  verdict: confirmed (reproduce ✓ / refute ✓ / ground ✓)"},{"section":"Confirmed findings","position":2,"key":"[Blocking] src/b.sh:5","text":"[Blocking] src/b.sh:5 — finding text for this entry\n  verdict: confirmed (reproduce ✓ / refute ✓ / ground ✓)"}]}
