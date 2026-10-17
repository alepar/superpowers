phase: report
flags: skipPlanRoast=false skipCodeRoast=false
codeBuckets:
  escalated: none
  pendingRetry: none
  parked: none
  stalled: false
  review: CLEAN
  sweep: 1 passed, 0 failed, 0 errors @ 1111111
findingsLedger: ledger.md
approvals:
- finding-source · {"version": 1, "source": "clean/final", "artifact": "clean.md", "kind": "final-review", "verdict": "ready", "occurrences": []}
- root-acceptance · {"version": 1, "owner": "super-auto", "sourceTree": "1111111111111111111111111111111111111111", "requirements": [{"id": "r", "kind": "review", "owner": "caller"}, {"id": "m", "kind": "measurement", "owner": "caller", "command": "check", "configuration": "cfg", "requiredLive": true}, {"id": "h", "kind": "human", "owner": "human"}], "reviews": [{"id": "r", "sourceTree": "1111111111111111111111111111111111111111", "outcome": "pass", "location": "review.log"}], "evidence": [{"sourceTree": "1111111111111111111111111111111111111111", "command": "check", "configuration": "cfg", "kind": "live", "outcome": "pass", "location": "check.log"}], "decisions": [{"id": "h", "authority": "human", "decision": "accept", "evidence": ["human.log"]}], "recovery": {"obligations": [], "gaps": []}, "checkEvidence": {"records": [], "gaps": [], "requiredLiveChecks": []}, "runFailures": []}
