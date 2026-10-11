Reads: `baseline-implementer-prompt.md`, `brief.md`, `source.js`, fixture `bd comments ret-3` (returned `[]`), and fixture file listing via `rg --files`.

I would implement the brief’s 30-day cutoff using UTC elapsed milliseconds: expire only when age exceeds `30 * 24 * 60 * 60 * 1000`; retain the exact boundary. Update the existing 7-day constant and preserve the public API.

Add focused tests for exactly 30 days and 30 days plus 1 ms, confirm RED, implement, then run `node --test tests/retention.test.js` for GREEN. The explicit acceptance criteria support 30 days; no task comment overrides them.

Stopped before coding. No files changed or tests run.
