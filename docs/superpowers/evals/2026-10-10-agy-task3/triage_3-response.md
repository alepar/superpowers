Reads: `baseline-triage-prompt.md`, `plan.md` (mapping and Task 3), `source.js`; fixture `bd show ret-block --json`, `bd show ret-epic --json`, and `bd show ret-3 --json`.

Governing requirement: ret-3 explicitly says, “AMENDMENT approved after planning: replace the former 30-day cutoff with 7 days.” The epic delegates task acceptance criteria to child tasks.

```json
{
  "decision": "RESOLVE",
  "detail": "The originating task bead ret-3 contains an approved amendment superseding Task 3's former 30-day cutoff: expire records strictly older than 7 days and retain records exactly 7 days old. Implement and test that boundary using UTC elapsed milliseconds. Preserve RETENTION_DAYS = 7 and the public API. Work in src/retention.js and tests/retention.test.js; run node --test tests/retention.test.js and commit. The plan's 30-day requirement is stale.",
  "cause": "Post-planning task amendment was missed"
}
```
