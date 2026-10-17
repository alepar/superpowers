flags: skipPlanRoast=false skipCodeRoast=false
phase: report
codeBuckets:
  completed: leaf-A
  escalated: none
  pendingRetry: none
  parked: none
  stalled: false
  review: ready
  sweep: 1 — 1 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: suite @ aaaaaaa
findingsLedger: ledger.md
approvals:
- root-acceptance · {"version": 1, "owner": "super-auto", "sourceTree": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "requirements": [{"id": "final-review", "kind": "review", "owner": "super-auto"}, {"id": "sweep", "kind": "measurement", "owner": "super-auto", "command": "suite", "configuration": "quiet", "requiredLive": true}, {"id": "finish", "kind": "human", "owner": "human"}], "evidence": [{"sourceTree": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "command": "suite", "configuration": "quiet", "kind": "live", "outcome": "pass", "location": "sweep.log"}], "reviews": [{"id": "final-review", "sourceTree": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "outcome": "pass", "location": "final.md"}], "decisions": [{"id": "finish", "authority": "human", "decision": "accept", "evidence": ["user-choice"]}], "recovery": {"obligations": [], "gaps": []}, "checkEvidence": {"records": [], "requiredLiveChecks": [], "gaps": []}, "runFailures": []}
- finding-source · {"version": 1, "source": "inv-a/final", "artifact": "final.md", "kind": "final-review", "verdict": "ready", "occurrences": []}
