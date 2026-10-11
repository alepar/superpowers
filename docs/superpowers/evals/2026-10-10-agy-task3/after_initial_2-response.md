Reads performed: `after-initial-prompt.txt`, `after-implementer-prompt.md`, `fixture.py bd show ret-3 --json`, `fixture.py bd comments ret-3`, `brief.md`, and `source.js`; listed fixture paths with `rg --files`.

Would implement expiration strictly after **7 × 86,400,000 elapsed milliseconds**, retaining records exactly seven days old and younger, without public API changes. The current bead explicitly amends the frozen brief’s 30-day requirement to seven days; comments contain no additional clarification. Existing `RETENTION_DAYS = 7` agrees.

Would add focused failing tests for seven days plus one millisecond, exactly seven days, and seven days minus one millisecond, implement `isExpired`, then run `node --test tests/retention.test.js`.

Stopped before coding. No files changed, commits, tracker mutations, agents, or test runs.
