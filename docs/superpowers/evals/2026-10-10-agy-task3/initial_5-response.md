Reads: `initial-prompt.txt`, `baseline-implementer-prompt.md`, `brief.md`, `source.js`; fixture commands `bd comments ret-3` and `bd show ret-3`; directory listing via `rg --files`.

Implement a strict **7-day** cutoff using UTC elapsed milliseconds, retaining records exactly seven days old and preserving the public API. The tracker explicitly records an approved amendment replacing 30 days with seven; the existing constant agrees. Comments are empty.

Add focused failing tests for exactly seven days and one millisecond older, implement the comparison, then run `node --test tests/retention.test.js`. Stopped before coding; no files changed or tests run.
