Reads performed: `after-initial-prompt.txt`, `after-implementer-prompt.md`, fixture `bd show ret-3 --json`, fixture `bd comments ret-3`, `brief.md`, and `source.js`.

I would implement `isExpired(record, now)` using UTC elapsed milliseconds: expire only ages strictly greater than `7 * 24 * 60 * 60 * 1000`; retain exactly seven days. Preserve the public API and existing `RETENTION_DAYS = 7`.

Amendment used: the current bead explicitly replaces the frozen brief’s 30-day cutoff with seven days. Comments are empty; compatible scope and UTC requirements still apply.

Before implementation, add focused failing tests for seven days plus one millisecond, exactly seven days, and just below seven days. Then implement and run `node --test tests/retention.test.js`, plus relevant caller tests identified by a call-site search. Stopped before coding; no files changed or tests run.
