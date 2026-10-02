# super-auto run — 2026-09-04-audit-plan-instrumentation

flags: planOneShot=false skipPlanRoast=false skipCodeRoast=false autonomous=true
phase: report

codeBuckets:
  completed: bd-1
  escalated:
  pendingRetry:
  parked:
  stalled: false
  review: CLEAN
  sweep: 7fb4cd0 — 860 passed, 0 failed, 0 errors, 0 skipped; command: bash tests/super-code/test-coordinator-replay.sh
