Reads: `baseline-implementer-prompt.md`; fixture `bd comments ret-3` (returned `[]`); `brief.md`; `source.js`; fixture file listing.

I would implement a 30-day cutoff using UTC elapsed milliseconds: expire only when age exceeds `30 * 24 * 60 * 60 * 1000`; retain the exact boundary. Update `RETENTION_DAYS` from 7 to 30 and preserve the public API. The brief explicitly requires 30 days; comments contain no clarification overriding it.

I would add focused tests for exactly 30 days and 30 days plus 1 ms, verify RED, implement, then run `node --test tests/retention.test.js` for GREEN. Stopped before coding; no files changed.
