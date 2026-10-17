flags: skipPlanRoast=false skipCodeRoast=false
phase: report
codeBuckets:
  completed: bd-1
  escalated: none
  pendingRetry: none
  parked: none
  stalled: false
  review: ready
  sweep: 1 — 1 passed, 0 failed, 0 errors; command: suite @ aaaaaaa
findingsLedgerDesign: ledger.md
approvals:
- root-acceptance · {"version": 1, "owner": "super-auto", "sourceTree": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "requirements": [{"id": "review", "kind": "review", "owner": "super-auto"}, {"id": "suite", "kind": "measurement", "owner": "super-auto", "command": "suite", "configuration": "host", "requiredLive": true}, {"id": "finish", "kind": "human", "owner": "human"}], "evidence": [{"sourceTree": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "command": "suite", "configuration": "host", "kind": "live", "outcome": "pass", "location": "suite.log"}], "reviews": [{"id": "review", "sourceTree": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "outcome": "pass", "location": "final.md"}], "decisions": [{"id": "finish", "authority": "human", "decision": "accept", "evidence": ["operator-choice"]}], "recovery": {"obligations": [], "gaps": []}, "checkEvidence": {"records": [], "requiredLiveChecks": [], "gaps": []}, "runFailures": []}
- finding-source · {"version": 1, "source": "inv-final/final", "artifact": "final.md", "kind": "final-review", "verdict": "ready", "occurrences": []}
- finding-source · {"version": 1, "source": "roast-code/round-1", "artifact": "r1.md", "kind": "roast", "verdict": "Blocking (2 confirmed)", "occurrences": [{"section": "Confirmed findings", "position": 1, "key": "[Blocking] src/a.sh:10", "text": "[Blocking] src/a.sh:10 \u2014 finding text for this entry\n  verdict: confirmed (reproduce \u2713 / refute \u2713 / ground \u2713)"}, {"section": "Confirmed findings", "position": 2, "key": "[Blocking] src/b.sh:5", "text": "[Blocking] src/b.sh:5 \u2014 finding text for this entry\n  verdict: confirmed (reproduce \u2713 / refute \u2713 / ground \u2713)"}]}
