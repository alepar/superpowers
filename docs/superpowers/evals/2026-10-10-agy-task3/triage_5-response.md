{
  "decision": "RESOLVE",
  "detail": "Implement ret-3's approved amendment: expire records strictly older than 7 days using UTC elapsed milliseconds; retain records exactly 7 days old. The child bead explicitly replaces the plan's former 30-day cutoff. Preserve RETENTION_DAYS = 7 and the public API. Add focused older-than and exact-boundary tests, implement isExpired, run node --test tests/retention.test.js, and commit. Reads performed: baseline-triage-prompt.md; plan.md (mapping ret-3 → Task 3 and its complete section); fixture.py bd show ret-block --json; fixture.py bd show ret-epic --json; fixture.py bd show ret-3 --json; source.js. Governing passage from ret-3: “AMENDMENT approved after planning: replace the former 30-day cutoff with 7 days.” The epic delegates task-scoped acceptance criteria to child tasks and references no design document.",
  "cause": "stale plan conflicts with approved task amendment"
}
