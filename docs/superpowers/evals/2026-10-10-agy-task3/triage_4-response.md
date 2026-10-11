Reads: `triage-prompt.txt`, `baseline-triage-prompt.md`, `plan.md`, `source.js`; fixture `bd show ret-block --json`, `bd show ret-epic --json`, and `bd show ret-3 --json`.

Task 3 specifies: “records older than 30 days are expired. A record exactly 30 days old is retained. Use UTC elapsed milliseconds. No public API changes.” The epic delegates: “Task-scoped acceptance criteria are tracked on child tasks.” No design document is referenced.

```json
{
  "decision": "RESOLVE",
  "detail": "Implement the approved amendment recorded on task ret-3: replace the former 30-day cutoff with 7 days. Expire records strictly older than 7 days; retain records exactly 7 days old. Use UTC elapsed milliseconds, preserve the public API, and keep RETENTION_DAYS = 7. The append-only plan predates this amendment. Add focused tests for older-than and exact-boundary records, run node --test tests/retention.test.js, and commit.",
  "cause": "Task amendment missed when consulting stale plan"
}
```
