# super-auto run — 2026-07-31-per-tenant-rate-limiter

flags: planOneShot=false skipPlanRoast=false skipCodeRoast=false autonomous=true
phase: report

parked:
- 2026-07-31-x-roast-design-2.md · degraded-verdict · "clean [low coverage] — proceeded, not re-roasted"
- 2026-08-01-x-roast-pr-2.md · degraded-verdict · "redesign proposed, not applied — one refresh middleware; dissolves r2 [Blocking] src/a.ts:4"
- 2026-08-01-x-roast-pr-1.md · beyond-cap · "Blocking candidate left unjudged at panel cap"
- graph-pass · graph-change · "drop bd-9<-bd-7: not safe unattended"

codeBuckets:
  completed: bd-413
  escalated:
  pendingRetry:
  parked:
  stalled: false
  review: CLEAN
  sweep: 3f9c2e1 — 412 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: npm test @ 3f9c2e1
