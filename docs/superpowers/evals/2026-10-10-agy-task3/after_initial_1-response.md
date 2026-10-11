Reads chosen: `after-initial-prompt.txt`, `after-implementer-prompt.md`, fixture tracker commands `bd show ret-3 --json` and `bd comments ret-3`, then `brief.md` and `source.js`. I also listed fixture filenames; I did not read prior responses or scores.

Would implement `isExpired` using UTC elapsed milliseconds: expire only when age exceeds `7 * 24 * 60 * 60 * 1000`; retain exactly seven days and younger records. Preserve the public API and `RETENTION_DAYS = 7`.

The current bead explicitly approves replacing the frozen brief’s 30-day cutoff with seven days. Comments are empty. Record that amendment under Assumptions.

Would first add failing tests for seven days minus one millisecond, exactly seven days, and seven days plus one millisecond, then implement and run `node --test tests/retention.test.js`.

Stopped before coding. No files changed or tests run.
