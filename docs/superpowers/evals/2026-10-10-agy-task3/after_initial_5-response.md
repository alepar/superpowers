Reads: `after-initial-prompt.txt`, `after-implementer-prompt.md`; fixture `bd show ret-3 --json` and `bd comments ret-3`; `brief.md`, `source.js`, and `fixture.py`. Listed fixture filenames without opening prior responses or scores.

Proceed with the explicitly amended **7-day** cutoff, overriding the brief’s older 30-day requirement. Preserve the API and expire only when UTC elapsed milliseconds exceed `7 * 24 * 60 * 60 * 1000`; retain the existing `RETENTION_DAYS = 7`.

Would add focused tests for 7 days + 1 ms (expired), exactly 7 days (retained), and 7 days − 1 ms (retained), establish RED against the stub, implement, then run `node --test tests/retention.test.js` for GREEN. Record the approved amendment under Assumptions.

Stopped before coding. No files changed or tests claimed passing.
